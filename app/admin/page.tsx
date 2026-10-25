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
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const [isPrinting, setIsPrinting] = useState(false);
  const [activePrintOrder, setActivePrintOrder] = useState<any>(null);

  // State για το Modal Αναλυτικής Προβολής
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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

  // Παραγωγή Ήχου (Χρησιμοποιεί το κρυφό audio tag)
  const playSound = () => {
    const audioEl = document.getElementById('notification-sound') as HTMLAudioElement;
    if (audioEl) {
      audioEl.currentTime = 0;
      audioEl.play().catch(e => console.log("Αναμονή αλληλεπίδρασης για ήχο", e));
    }
  };

  useEffect(() => {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    if (pendingCount > prevCount && audioUnlocked) {
      playSound();
    }
    setPrevCount(pendingCount);
  }, [orders, prevCount, audioUnlocked]);

  const unlockSystem = () => {
    playSound(); // Παίζει μια φορά κενά για να πάρει άδεια από τον browser
    setAudioUnlocked(true);
  };

  // Αποδοχή Παραγγελίας (Μετάβαση σε "Προετοιμασία")
  const handleAcceptOrder = async (order: any, exactTime: string | null, addedMins: number = 0) => {
    let confirmedTime = exactTime;
    
    // Αν δεν δόθηκε ακριβής ώρα (π.χ. ήταν ASAP και πάτησε "15'"), υπολογίζουμε την ώρα
    if (!confirmedTime) {
      const targetDate = new Date(new Date().getTime() + addedMins * 60000);
      confirmedTime = targetDate.toLocaleTimeString("da-DK", { hour: '2-digit', minute: '2-digit' });
    }

    const updatedOrder = { ...order, status: 'preparing', requested_time: confirmedTime };
    
    // 1. Τοπική Ενημέρωση
    setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
    
    // 2. Ενημέρωση Βάσης
    const { error } = await supabase.from('orders').update({ status: 'preparing', requested_time: confirmedTime }).eq('id', order.id);
    if (error) { alert("Σφάλμα: " + error.message); fetchOrders(); return; }

    // 3. Εκτύπωση
    setActivePrintOrder(updatedOrder);
    setIsPrinting(true);
    setSelectedOrder(null); // Κλείνει το modal αν ήταν ανοιχτό
  };

  // Ολοκλήρωση Παραγγελίας (Μετάβαση σε "Ολοκληρωμένες")
  const handleCompleteOrder = async (order: any) => {
    const completedAt = new Date().toISOString();
    const updatedOrder = { ...order, status: 'completed', completed_at: completedAt };
    
    setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
    await supabase.from('orders').update({ status: 'completed', completed_at: completedAt }).eq('id', order.id);
    setSelectedOrder(null);
  };

  if (isLoading) return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-[#38BDF8] font-bold text-xl animate-pulse">Φόρτωση Ταμείου...</div>;

  if (!audioUnlocked) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-6 text-center">
        <span className="text-7xl mb-6">🔊</span>
        <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Ενεργοποιηση Ταμειου</h1>
        <p className="text-gray-400 font-bold mb-8">Για να λαμβάνετε ειδοποιήσεις, πρέπει να ξεκινήσετε τη βάρδια.</p>
        <button onClick={unlockSystem} className="bg-emerald-500 hover:bg-emerald-400 text-[#0B1120] px-10 py-6 rounded-2xl font-black text-2xl uppercase shadow-[0_0_30px_rgba(16,185,129,0.4)]">
          ▶ ΕΝΑΡΞΗ ΒΑΡΔΙΑΣ
        </button>
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
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
            <button onClick={playSound} className="bg-gray-800 text-gray-300 border border-gray-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-700">
              🔊 Δοκιμή Ήχου
            </button>
            <a href="/admin/products" className="hidden sm:block bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase shadow-lg transition-colors">
              📋 ΔΙΑΧΕΙΡΙΣΗ ΚΑΤΑΛΟΓΟΥ
            </a>
            <button onClick={fetchOrders} className="w-10 h-10 rounded-xl bg-slate-800 text-[#38BDF8] flex items-center justify-center hover:bg-slate-700 text-xl shadow-md">🔄</button>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/")} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase ml-2">ΕΞΟΔΟΣ</button>
          </div>
        </header>

        {/* 3 ΣΤΗΛΕΣ (Νέες -> Προετοιμασία -> Ολοκληρωμένες) */}
        <main className="p-4 md:p-6 max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="bg-[#0F172A]/80 border border-[#38BDF8]/30 rounded-[2rem] p-5 shadow-2xl min-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2 className="font-black text-lg uppercase text-[#38BDF8] tracking-widest flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {pendingOrders.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>}
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#38BDF8]"></span>
                </span>
                Νέες
              </h2>
              <span className="bg-[#38BDF8] text-[#0B1120] font-black px-3 py-1 rounded-lg text-sm">{pendingOrders.length}</span>
            </div>
            <div className="flex flex-col gap-4">
              {pendingOrders.map(order => (
                <OrderCard 
                  key={order.id} order={order} 
                  onAccept={(exactTime: string | null, mins: number) => handleAcceptOrder(order, exactTime, mins)} 
                  onView={() => setSelectedOrder(order)}
                />
              ))}
            </div>
          </div>

          <div className="bg-[#0F172A]/50 border border-orange-500/30 rounded-[2rem] p-5 shadow-xl min-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2 className="font-black text-lg uppercase text-orange-400 tracking-widest">Σε Προετοιμασία</h2>
              <span className="bg-orange-500 text-black font-black px-3 py-1 rounded-lg text-sm">{preparingOrders.length}</span>
            </div>
            <div className="flex flex-col gap-4">
              {preparingOrders.map(order => (
                <OrderCard 
                  key={order.id} order={order} 
                  onComplete={() => handleCompleteOrder(order)} 
                  onPrint={() => { setActivePrintOrder(order); setIsPrinting(true); }}
                  onView={() => setSelectedOrder(order)}
                />
              ))}
            </div>
          </div>

          <div className="bg-slate-900/30 border border-white/5 rounded-[2rem] p-5 opacity-90 hover:opacity-100 transition-opacity min-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <h2 className="font-black text-lg uppercase text-gray-500 tracking-widest">Ολοκληρωμένες</h2>
              <span className="bg-gray-800 text-gray-400 border border-gray-700 font-black px-3 py-1 rounded-lg text-sm">{completedOrders.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {completedOrders.slice(0, 20).map(order => (
                <div key={order.id} className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <h3 className="font-black text-gray-300">#{order.order_number || order.id.toString().slice(-4)} - {order.customer_name}</h3>
                    <span className="text-emerald-400 font-bold">{order.requested_time}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 font-bold">{order.total_price} DKK ({order.payment_method})</p>
                    <button onClick={() => setSelectedOrder(order)} className="text-xs bg-gray-700 px-3 py-1.5 rounded text-white">Προβολή</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      {/* ΣΥΣΤΗΜΑ ΕΚΤΥΠΩΣΗΣ */}
      {isPrinting && (
        <div className="bg-white text-black w-full m-0 p-0">
          <PrintTicket 
            order={activePrintOrder} storeName="HELLAS AALBORG" isThermal={true} hasKitchenEnabled={false}
            onPrintDone={() => { setIsPrinting(false); setActivePrintOrder(null); }} 
          />
        </div>
      )}

      {/* MODAL ΑΝΑΛΥΤΙΚΗΣ ΠΡΟΒΟΛΗΣ */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedOrder(null)}>
          <div className="bg-slate-800 border border-slate-600 w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <div>
                <h2 className="text-2xl font-black text-white italic">#{selectedOrder.order_number || selectedOrder.id.toString().slice(-4)}</h2>
                <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md mt-1 inline-block ${selectedOrder.status === 'pending' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : selectedOrder.status === 'preparing' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6 border-b border-slate-700 pb-6">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Πελατης</p>
                  <p className="text-lg font-black text-white">{selectedOrder.customer_name}</p>
                  <p className="text-sm font-bold text-gray-400">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Χρονος (Ζητηθηκε)</p>
                  <p className="text-2xl font-black text-[#38BDF8]">{selectedOrder.requested_time}</p>
                  <p className="text-xs text-gray-400">Λήψη: {new Date(selectedOrder.created_at).toLocaleTimeString('el-GR')}</p>
                </div>
              </div>

              <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Προϊοντα</h4>
              <ul className="space-y-4">
                {(selectedOrder.items || []).map((it: any, i: number) => (
                  <li key={i} className="flex flex-col bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between font-bold text-lg text-white">
                      <span><span className="text-[#38BDF8] mr-2">{it.quantity || 1}x</span>{it.title_da || it.title_el || it.name}</span>
                      <span>{(it.unit_price_dkk * (it.quantity || 1)).toFixed(0)} DKK</span>
                    </div>
                    {it.selectedOptions?.length > 0 && <span className="text-sm text-gray-400 mt-1">+ {it.selectedOptions.map((o:any) => o.name || o).join(', ')}</span>}
                    {it.note && <span className="text-sm bg-yellow-900/40 text-yellow-500 border border-yellow-700/50 px-3 py-1.5 rounded-lg mt-2 inline-block w-fit font-bold italic">📝 {it.note}</span>}
                  </li>
                ))}
              </ul>

              {selectedOrder.notes && (
                <div className="bg-indigo-900/30 border border-indigo-800/50 p-4 rounded-xl mt-6">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">ΓΕΝΙΚΟ ΣΧΟΛΙΟ:</span>
                  <p className="text-base text-indigo-100 font-bold italic">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 bg-slate-900 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Πληρωμή: {selectedOrder.payment_method}</p>
                <p className="text-2xl font-black text-white">{selectedOrder.total_price} DKK</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setActivePrintOrder(selectedOrder); setIsPrinting(true); }} className="bg-slate-700 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-600 transition-colors">
                  🖨️ ΕΚΤΥΠΩΣΗ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
