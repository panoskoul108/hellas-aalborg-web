'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import { PrintTicket } from './PrintTicket'; 

// --- LIVE TIMER COMPONENT ---
const LiveTimer = ({ createdAt }: { createdAt: string }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calc = () => setElapsed(Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / 1000));
    calc();
    const int = setInterval(calc, 60000);
    return () => clearInterval(int);
  }, [createdAt]);

  const mins = Math.floor(elapsed / 60);
  let colorClass = "text-emerald-400 bg-emerald-900/30 border-emerald-800";
  if (mins >= 20) colorClass = "text-red-400 bg-red-900/40 border-red-700 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.3)]";
  else if (mins >= 10) colorClass = "text-orange-400 bg-orange-900/30 border-orange-800";

  return <span className={`text-[11px] font-black px-2 py-1 rounded-lg border ${colorClass}`}>⏱️ {mins} λεπτά</span>;
};

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
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        setIsLoading(false);
        return;
      }
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
    const channel = supabase
      .channel('admin-orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Παίζει τον ήχο καλώντας το HTML στοιχείο
  useEffect(() => {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    if (pendingCount > prevCount && !isMuted && audioUnlocked) {
      const audioEl = document.getElementById('notification-sound') as HTMLAudioElement;
      if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play().catch(e => console.log("Audio block:", e));
      }
    }
    setPrevCount(pendingCount);
  }, [orders, isMuted, prevCount, audioUnlocked]);

  const unlockAudio = () => {
    const audioEl = document.getElementById('notification-sound') as HTMLAudioElement;
    if (audioEl) {
      audioEl.play().then(() => {
        audioEl.pause();
        audioEl.currentTime = 0;
        setAudioUnlocked(true);
      }).catch(e => console.log("Unlock failed:", e));
    }
  };

  // Αποδοχή Παραγγελίας (Ορισμός Χρόνου & Εκτύπωση)
  const handleAcceptOrder = async (order: any, addedMins: number) => {
    // Υπολογισμός νέας ώρας αν ήταν ASAP
    let confirmedTime = order.requested_time;
    if (confirmedTime === "ASAP" || confirmedTime.includes("Hurtigst")) {
      const targetDate = new Date(new Date().getTime() + addedMins * 60000);
      confirmedTime = targetDate.toLocaleTimeString("da-DK", { hour: '2-digit', minute: '2-digit' });
    }

    const updatedOrder = { ...order, status: 'preparing', requested_time: confirmedTime };
    
    // Ακαριαία αλλαγή στην οθόνη
    setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
    
    // Αποθήκευση στη βάση
    await supabase.from('orders').update({ status: 'preparing', requested_time: confirmedTime }).eq('id', order.id);

    // Εκτύπωση με τη νέα ώρα
    setActivePrintOrder(updatedOrder);
    setIsPrinting(true);
  };

  const updateOrderStatus = async (id: number, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
  };

  const handleManualPrint = (order: any) => {
    setActivePrintOrder(order);
    setIsPrinting(true);
  };

  if (isLoading) return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-[#38BDF8] font-bold text-xl animate-pulse">Φόρτωση Ταμείου...</div>;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const completedOrders = orders.filter(o => o.status === 'completed' && (new Date().getTime() - new Date(o.created_at).getTime() < 24 * 60 * 60 * 1000));

  return (
    <>
      <audio id="notification-sound" src="/notification.mp3" preload="auto" />

      <div className={`min-h-screen font-sans bg-[#0B1120] text-gray-200 ${isPrinting ? "hidden" : "block"}`}>
        
        <header className="bg-[#0F172A] border-b border-white/10 p-4 md:p-6 sticky top-0 z-40 flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white italic tracking-tight">
              HELLAS AALBORG <span className="text-[#38BDF8]">ADMIN</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {!audioUnlocked && (
              <button onClick={unlockAudio} className="bg-orange-500 text-black px-4 py-2 rounded-xl text-xs font-black uppercase animate-bounce shadow-lg">
                Ενεργοποιηση Ηχου 🔊
              </button>
            )}
            <button onClick={fetchOrders} className="w-12 h-12 rounded-xl bg-slate-800 text-[#38BDF8] flex items-center justify-center hover:bg-slate-700 text-xl shadow-md transition-transform active:scale-90">🔄</button>
            <button onClick={() => setIsMuted(!isMuted)} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors ${isMuted ? "bg-red-900/40 text-red-400 border border-red-800" : "bg-white/10 text-white border border-white/5 hover:bg-white/20"}`}>
              {isMuted ? "🔇" : "🔊"}
            </button>
          </div>
        </header>

        {/* 3 ΣΤΗΛΕΣ (Νέες -> Προετοιμασία -> Ολοκληρωμένες) */}
        <main className="p-4 md:p-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ΣΤΗΛΗ 1: ΝΕΕΣ (ΕΚΚΡΕΜΕΙΣ ΓΙΑ ΑΠΟΔΟΧΗ) */}
          <div className="bg-[#0F172A]/80 border border-[#38BDF8]/30 rounded-[2rem] p-5 shadow-2xl min-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2 className="font-black text-lg uppercase text-[#38BDF8] tracking-widest flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {pendingOrders.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>}
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#38BDF8]"></span>
                </span>
                Νέες Παραγγελίες
              </h2>
              <span className="bg-[#38BDF8] text-[#0B1120] font-black px-3 py-1 rounded-lg text-sm">{pendingOrders.length}</span>
            </div>
            <div className="flex flex-col gap-4">
              {pendingOrders.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onAccept={(mins: number) => handleAcceptOrder(order, mins)} 
                />
              ))}
            </div>
          </div>

          {/* ΣΤΗΛΗ 2: ΣΕ ΠΡΟΕΤΟΙΜΑΣΙΑ */}
          <div className="bg-[#0F172A]/50 border border-orange-500/30 rounded-[2rem] p-5 shadow-xl min-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2 className="font-black text-lg uppercase text-orange-400 tracking-widest">Σε Προετοιμασία</h2>
              <span className="bg-orange-500 text-black font-black px-3 py-1 rounded-lg text-sm">{preparingOrders.length}</span>
            </div>
            <div className="flex flex-col gap-4">
              {preparingOrders.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onPrint={() => handleManualPrint(order)} 
                  onComplete={() => updateOrderStatus(order.id, 'completed')} 
                />
              ))}
            </div>
          </div>

          {/* ΣΤΗΛΗ 3: ΟΛΟΚΛΗΡΩΜΕΝΕΣ */}
          <div className="bg-slate-900/30 border border-white/5 rounded-[2rem] p-5 opacity-80 hover:opacity-100 transition-opacity min-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <h2 className="font-black text-lg uppercase text-gray-500 tracking-widest">Ολοκληρωμένες Σήμερα</h2>
              <span className="bg-gray-800 text-gray-400 border border-gray-700 font-black px-3 py-1 rounded-lg text-sm">{completedOrders.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {completedOrders.slice(0, 15).map(order => (
                <div key={order.id} className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <h3 className="font-black text-gray-300">#{order.order_number || order.id.toString().slice(-4)} - {order.customer_name}</h3>
                    <span className="text-[#38BDF8] font-bold">{order.total_price} DKK</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 font-bold">Παραδόθηκε: {new Date(order.completed_at || order.created_at).toLocaleTimeString("el-GR")}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleManualPrint(order)} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors">🖨️</button>
                      <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="p-2 rounded-lg bg-orange-900/30 text-orange-500 hover:bg-orange-900/50 transition-colors text-xs font-black">↩️ ΑΚΥΡΩΣΗ</button>
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
            order={activePrintOrder} 
            storeName="HELLAS AALBORG" 
            isThermal={true} 
            hasKitchenEnabled={false}
            onPrintDone={() => { setIsPrinting(false); setActivePrintOrder(null); }} 
          />
        </div>
      )}
    </>
  );
}

// --- Η ΚΑΡΤΑ ΤΗΣ ΠΑΡΑΓΓΕΛΙΑΣ ---
const OrderCard = ({ order, onAccept, onPrint, onComplete }: any) => {
  const items = order.items || [];
  const isPending = order.status === 'pending';
  const isPreparing = order.status === 'preparing';
  
  const [prepTime, setPrepTime] = useState(10); // Προεπιλογή

  return (
    <div className={`bg-slate-800 border rounded-2xl p-5 shadow-lg relative overflow-hidden ${isPending ? "border-[#38BDF8]/50" : "border-orange-500/50"}`}>
      {order.discount_dkk > 0 && <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-md">🎁 Loyalty</div>}

      <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3">
        <div>
          <h3 className="text-2xl font-black text-white italic">#{order.order_number || order.id.toString().slice(-4)}</h3>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Πελάτης: <span className="text-white">{order.customer_name}</span> ({order.customer_phone})</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LiveTimer createdAt={order.created_at} />
          {isPreparing && (
            <span className="bg-orange-500 text-[#0B1120] text-xs font-black px-3 py-1.5 rounded-lg uppercase shadow-md flex items-center gap-1 border-2 border-orange-400">
              🕒 ΠΑΡΑΛΑΒΗ: {order.requested_time}
            </span>
          )}
          {isPending && (
             <span className="text-gray-400 text-[10px] font-bold uppercase">Ζητήθηκε: {order.requested_time}</span>
          )}
        </div>
      </div>

      <ul className="space-y-2 mb-5">
        {items.map((it: any, i: number) => (
          <li key={i} className="flex flex-col text-sm">
            <div className="flex justify-between font-bold text-gray-200">
              <span><span className="text-[#38BDF8] mr-2 text-lg">{it.quantity || 1}x</span>{it.title_da || it.name}</span>
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

      {/* FOOTER ΓΙΑ "ΝΕΕΣ ΠΑΡΑΓΓΕΛΙΕΣ" (Αποδοχή & Ορισμός Χρόνου) */}
      {isPending && (
        <div className="border-t border-slate-700 pt-4 flex gap-2 items-center">
          <select 
            value={prepTime} 
            onChange={(e) => setPrepTime(Number(e.target.value))}
            className="bg-slate-900 text-[#38BDF8] font-black p-3 rounded-xl outline-none border border-slate-700 flex-1 text-sm text-center"
          >
            <option value={5}>Σε 5'</option>
            <option value={7}>Σε 7'</option>
            <option value={10}>Σε 10'</option>
            <option value={12}>Σε 12'</option>
            <option value={15}>Σε 15'</option>
            <option value={20}>Σε 20'</option>
          </select>
          <button 
            onClick={() => onAccept(prepTime)} 
            className="flex-[2] bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black uppercase rounded-xl py-3 shadow-lg active:scale-95 transition-transform"
          >
            ΑΠΟΔΟΧΗ & ΕΚΤΥΠΩΣΗ
          </button>
        </div>
      )}

      {/* FOOTER ΓΙΑ "ΣΕ ΠΡΟΕΤΟΙΜΑΣΙΑ" (Ολοκλήρωση) */}
      {isPreparing && (
        <div className="flex items-center justify-between border-t border-slate-700 pt-4">
          <div>
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Πληρωμή ({order.payment_method})</span>
            <span className="text-xl font-black text-white">{order.total_price?.toFixed(2)} DKK</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onPrint} className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center text-xl transition-colors shadow-md active:scale-95">🖨️</button>
            <button onClick={onComplete} className="px-6 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase transition-colors shadow-md active:scale-95 tracking-wider">✅ ΕΤΟΙΜΗ</button>
          </div>
        </div>
      )}
    </div>
  );
};
