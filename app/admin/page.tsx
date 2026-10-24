'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import { PrintTicket } from './PrintTicket'; 

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [prevCount, setPrevCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false); // Πρέπει να γίνει true για να ανοίξει το ταμείο

  const [isPrinting, setIsPrinting] = useState(false);
  const [activePrintOrder, setActivePrintOrder] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) { setIsLoading(false); return; }
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
    if (!error && data) setOrders(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('admin-orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { fetchOrders(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Παίζει τον ήχο όταν έρθει νέα παραγγελία
  useEffect(() => {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    if (pendingCount > prevCount && !isMuted && audioUnlocked) {
      const audioEl = document.getElementById('notification-sound') as HTMLAudioElement;
      if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play().catch(e => console.log("Audio error:", e));
      }
    }
    setPrevCount(pendingCount);
  }, [orders, isMuted, prevCount, audioUnlocked]);

  // Ξεκλείδωμα Ήχου (Απαιτείται κλικ από τον χρήστη)
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

  // Απευθείας Αποδοχή & Ολοκλήρωση (Χωρίς ενδιάμεσο στάδιο)
  const handleAcceptOrder = async (order: any, addedMins: number) => {
    const targetDate = new Date(new Date().getTime() + addedMins * 60000);
    const confirmedTime = targetDate.toLocaleTimeString("da-DK", { hour: '2-digit', minute: '2-digit' });

    // Το στέλνουμε ΚΑΤΕΥΘΕΙΑΝ σε completed
    const updatedOrder = { ...order, status: 'completed', requested_time: confirmedTime, completed_at: new Date().toISOString() };
    
    setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
    await supabase.from('orders').update({ status: 'completed', requested_time: confirmedTime, completed_at: new Date().toISOString() }).eq('id', order.id);

    setActivePrintOrder(updatedOrder);
    setIsPrinting(true);
  };

  if (isLoading) return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-[#38BDF8] font-bold text-xl animate-pulse">Φόρτωση...</div>;

  // ΟΘΟΝΗ ΞΕΚΛΕΙΔΩΜΑΤΟΣ ΗΧΟΥ (Αν δεν πατήσει, δεν βλέπει το ταμείο)
  if (!audioUnlocked) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-6 text-center">
        <span className="text-7xl mb-6">🔊</span>
        <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Ξεκλειδωμα Ηχου</h1>
        <p className="text-gray-400 font-bold mb-8">Για να ακούγονται οι ειδοποιήσεις, πρέπει να ξεκινήσετε τη βάρδια.</p>
        <button onClick={unlockSystem} className="bg-emerald-500 hover:bg-emerald-400 text-[#0B1120] px-10 py-6 rounded-2xl font-black text-2xl uppercase shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-transform active:scale-95">
          ▶ ΕΝΑΡΞΗ ΤΑΜΕΙΟΥ
        </button>
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'pending');
  // Δείχνουμε τις σημερινές ολοκληρωμένες
  const completedOrders = orders.filter(o => o.status === 'completed' && (new Date().getTime() - new Date(o.created_at).getTime() < 24 * 60 * 60 * 1000));

  return (
    <>
      <audio id="notification-sound" src="/notification.mp3" preload="auto" />

      <div className={`min-h-screen font-sans bg-[#0B1120] text-gray-200 ${isPrinting ? "hidden" : "block"}`}>
        <header className="bg-[#0F172A] border-b border-white/10 p-4 md:p-6 sticky top-0 z-40 flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white italic tracking-tight">HELLAS AALBORG <span className="text-[#38BDF8]">ADMIN</span></h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Κουμπί για να πάει στον Κατάλογο */}
            <a href="/admin/products" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase shadow-lg transition-colors">
              📋 ΔΙΑΧΕΙΡΙΣΗ ΚΑΤΑΛΟΓΟΥ
            </a>

            <button onClick={fetchOrders} className="w-10 h-10 rounded-xl bg-slate-800 text-[#38BDF8] flex items-center justify-center hover:bg-slate-700 text-xl shadow-md">🔄</button>
            <button onClick={() => setIsMuted(!isMuted)} className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${isMuted ? "bg-red-900/40 text-red-400 border border-red-800" : "bg-white/10 text-white border border-white/5 hover:bg-white/20"}`}>
              {isMuted ? "🔇" : "🔊"}
            </button>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/")} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase ml-2">ΕΞΟΔΟΣ</button>
          </div>
        </header>

        {/* 2 ΣΤΗΛΕΣ ΠΛΕΟΝ (Νέες -> Ολοκληρωμένες) */}
        <main className="p-4 md:p-6 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ΣΤΗΛΗ 1: ΝΕΕΣ */}
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

          {/* ΣΤΗΛΗ 2: ΟΛΟΚΛΗΡΩΜΕΝΕΣ / ΑΠΟΔΕΚΤΕΣ */}
          <div className="bg-slate-900/30 border border-white/5 rounded-[2rem] p-5 opacity-90 hover:opacity-100 transition-opacity min-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <h2 className="font-black text-xl uppercase text-gray-500 tracking-widest">Ολοκληρωμένες / Ετοιμάζονται</h2>
              <span className="bg-gray-800 text-gray-400 border border-gray-700 font-black px-3 py-1 rounded-lg text-sm">{completedOrders.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {completedOrders.slice(0, 20).map(order => (
                <div key={order.id} className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <h3 className="font-black text-gray-300">#{order.order_number || order.id.toString().slice(-4)} - {order.customer_name}</h3>
                    <span className="text-emerald-400 font-bold">Προγραμματισμένη: {order.requested_time}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 font-bold">Αξία: {order.total_price} DKK ({order.payment_method})</p>
                    <div className="flex gap-2">
                      <button onClick={() => { setActivePrintOrder(order); setIsPrinting(true); }} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors">🖨️</button>
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

// --- Η ΚΑΡΤΑ ΤΗΣ ΠΑΡΑΓΓΕΛΙΑΣ ---
const OrderCard = ({ order, onAccept }: any) => {
  const items = order.items || [];

  return (
    <div className={`bg-slate-800 border rounded-2xl p-5 shadow-lg relative overflow-hidden border-[#38BDF8]/50`}>
      {order.discount_dkk > 0 && <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-md">🎁 Loyalty</div>}

      <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3">
        <div>
          <h3 className="text-2xl font-black text-white italic">#{order.order_number || order.id.toString().slice(-4)}</h3>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Πελάτης: <span className="text-white">{order.customer_name}</span> ({order.customer_phone})</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-gray-400 text-[10px] font-bold uppercase">Ζητήθηκε: {order.requested_time}</span>
        </div>
      </div>

      <ul className="space-y-2 mb-5">
        {items.map((it: any, i: number) => (
          <li key={i} className="flex flex-col text-sm">
            <div className="flex justify-between font-bold text-gray-200">
              <span><span className="text-[#38BDF8] mr-2 text-lg">{it.quantity || 1}x</span>{it.title_da || it.title_el || it.name}</span>
              <span>{(it.unit_price_dkk * (it.quantity || 1)).toFixed(0)} kr.</span>
            </div>
            {it.selectedOptions?.length > 0 && <span className="text-xs text-gray-400 ml-6 block mt-0.5">+ {it.selectedOptions.map((o:any) => o.name || o).join(', ')}</span>}
            {it.note && <span className="text-xs bg-yellow-900/40 text-yellow-500 border border-yellow-700/50 px-2 py-1 rounded-md mt-1 ml-6 inline-block w-fit font-bold italic">📝 {it.note}</span>}
          </li>
        ))}
      </ul>

      {order.notes && (
        <div className="bg-indigo-900/30 border border-indigo-800/50 p-3 rounded-xl mb-4">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">ΓΕΝΙΚΟ ΣΧΟΛΙΟ:</span>
          <p className="text-sm text-indigo-100 font-bold italic">{order.notes}</p>
        </div>
      )}

      {/* FOOTER ΓΙΑ "ΝΕΕΣ ΠΑΡΑΓΓΕΛΙΕΣ" (Αποδοχή & Ολοκλήρωση σε 1 κλικ) */}
      <div className="border-t border-slate-700 pt-4 flex flex-col gap-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Σύνολο: {order.total_price} DKK ({order.payment_method})</span>
          <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-widest block">ΑΠΟΔΟΧΗ ΚΑΙ ΕΚΤΥΠΩΣΗ ΣΕ (ΛΕΠΤΑ):</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[5, 7, 10, 12, 15, 20].map((mins) => (
            <button key={mins} onClick={() => onAccept(mins)} className="bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black text-base rounded-xl py-3 shadow-md active:scale-95 transition-transform">
              {mins}'
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
