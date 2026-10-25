'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import { PrintTicket } from './PrintTicket'; 
import { OrderCard } from '../../components/admin/OrderCard'; 

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [prevCount, setPrevCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const [isPrinting, setIsPrinting] = useState(false);
  const [activePrintOrder, setActivePrintOrder] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setIsLoading(false); return; }
      setUser(session.user);
      fetchOrders();
    };
    checkAuth();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) console.error("Σφάλμα ανάγνωσης παραγγελιών:", error);
    if (data) setOrders(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('admin-orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    if (pendingCount > prevCount && !isMuted && audioUnlocked) {
      const audioEl = document.getElementById('notification-sound') as HTMLAudioElement;
      if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play().catch(e => console.log("Το πρόγραμμα περιήγησης μπλόκαρε τον ήχο:", e));
      }
    }
    setPrevCount(pendingCount);
  }, [orders, isMuted, prevCount, audioUnlocked]);

  const unlockSystem = () => {
    const audioEl = document.getElementById('notification-sound') as HTMLAudioElement;
    if (audioEl) {
      audioEl.play().then(() => {
        audioEl.pause();
        audioEl.currentTime = 0;
      }).catch(() => {});
    }
    setAudioUnlocked(true);
  };

  const handleAcceptOrder = async (order: any, addedMins: number) => {
    const targetDate = new Date(new Date().getTime() + addedMins * 60000);
    const confirmedTime = targetDate.toLocaleTimeString("da-DK", { hour: '2-digit', minute: '2-digit' });
    const completedAt = new Date().toISOString();

    const updatedOrder = { ...order, status: 'completed', requested_time: confirmedTime, completed_at: completedAt };
    setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
    
    const { error } = await supabase
      .from('orders')
      .update({ status: 'completed', requested_time: confirmedTime, completed_at: completedAt })
      .eq('id', order.id);

    if (error) {
      alert("Σφάλμα συγχρονισμού με τη βάση: " + error.message);
      fetchOrders(); 
      return;
    }

    setActivePrintOrder(updatedOrder);
    setIsPrinting(true);
  };

  if (isLoading) return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-[#38BDF8] font-bold text-xl animate-pulse">Φόρτωση Ταμείου...</div>;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedOrders = orders.filter(o => o.status === 'completed' && (new Date().getTime() - new Date(o.created_at).getTime() < 24 * 60 * 60 * 1000));

  return (
    <>
      <audio id="notification-sound" src="/notification.mp3" preload="auto" />

      {/* ΔΙΑΚΡΙΤΙΚΟ BANNER ΓΙΑ ΤΟΝ ΗΧΟ ΑΝΤΙ ΓΙΑ FULL SCREEN */}
      {!audioUnlocked && (
        <div className="bg-red-600 text-white p-3 text-center flex flex-col sm:flex-row justify-center items-center gap-4 z-50 relative">
          <span className="font-bold text-sm">⚠️ Για να ακούγεται ο ήχος στις νέες παραγγελίες, πρέπει να πατήσετε το κουμπί:</span>
          <button onClick={unlockSystem} className="bg-white text-red-600 font-black px-6 py-2 rounded-xl shadow-md hover:bg-gray-100 transition-colors">
            🔊 ΕΝΕΡΓΟΠΟΙΗΣΗ ΗΧΟΥ
          </button>
        </div>
      )}

      <div className={`min-h-screen font-sans bg-[#0B1120] text-gray-200 ${isPrinting ? "hidden" : "block"}`}>
        <header className="bg-[#0F172A] border-b border-white/10 p-4 md:p-6 sticky top-0 z-40 flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white italic tracking-tight">HELLAS AALBORG <span className="text-[#38BDF8]">ADMIN</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin/products" className="hidden sm:block bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase shadow-lg transition-colors">
              📋 ΔΙΑΧΕΙΡΙΣΗ ΚΑΤΑΛΟΓΟΥ
            </a>
            <button onClick={fetchOrders} className="w-10 h-10 rounded-xl bg-slate-800 text-[#38BDF8] flex items-center justify-center hover:bg-slate-700 text-xl shadow-md">🔄</button>
            <button onClick={() => setIsMuted(!isMuted)} className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${isMuted ? "bg-red-900/40 text-red-400 border border-red-800" : "bg-white/10 text-white border border-white/5 hover:bg-white/20"}`}>
              {isMuted ? "🔇" : "🔊"}
            </button>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/")} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase ml-2">ΕΞΟΔΟΣ</button>
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-[#0F172A]/80 border border-[#38BDF8]/30 rounded-[2rem] p-5 shadow-2xl min-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2 className="font-black text-xl uppercase text-[#38BDF8] tracking-widest flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {pendingOrders.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>}
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#38BDF8]"></span>
                </span>
                Νέες Παραγγελίες
              </h2>
              <span className="bg-[#38BDF8] text-[#0B1120] font-black px-3 py-1 rounded-lg text-sm">{pendingOrders.length}</span>
            </div>
            <div className="flex flex-col gap-4">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-20 text-gray-600 font-bold uppercase tracking-widest">Καμία νέα παραγγελία 🎉</div>
              ) : (
                pendingOrders.map(order => (
                  <OrderCard key={order.id} order={order} onAccept={(mins: number) => handleAcceptOrder(order, mins)} />
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900/30 border border-white/5 rounded-[2rem] p-5 opacity-90 hover:opacity-100 transition-opacity min-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <h2 className="font-black text-xl uppercase text-gray-500 tracking-widest">Ετοιμάζονται / Ολοκληρωμένες</h2>
              <span className="bg-gray-800 text-gray-400 border border-gray-700 font-black px-3 py-1 rounded-lg text-sm">{completedOrders.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {completedOrders.slice(0, 20).map(order => (
                <div key={order.id} className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <h3 className="font-black text-gray-300">#{order.order_number || order.id.toString().slice(-4)} - {order.customer_name}</h3>
                    <span className="text-emerald-400 font-bold">Έτοιμο στις: {order.requested_time}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 font-bold">Αξία: {order.total_price} DKK ({order.payment_method})</p>
                    <div className="flex gap-2">
                      <button onClick={() => { setActivePrintOrder(order); setIsPrinting(true); }} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors">🖨️ ΕΠΑΝΕΚΤΥΠΩΣΗ</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      {isPrinting && (
        <div className="bg-white text-black w-full m-0 p-0">
          <PrintTicket 
            order={activePrintOrder} storeName="HELLAS AALBORG" isThermal={true} hasKitchenEnabled={false}
            onPrintDone={() => { setIsPrinting(false); setActivePrintOrder(null); }} 
          />
        </div>
      )}
    </>
  );
}
