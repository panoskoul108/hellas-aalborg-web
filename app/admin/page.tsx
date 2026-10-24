'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase'; 
import { PrintTicket } from './PrintTicket'; 

// ΠΡΟΣΟΧΗ: Βεβαιώσου ότι το όνομα του αρχείου στον φάκελο public είναι σωστό!
const NOTIFICATION_SOUND = "/notification.mp3"; 

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
  const [isPrinting, setIsPrinting] = useState(false);
  const [activePrintOrder, setActivePrintOrder] = useState<any>(null);
  
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Φορτώνουμε τον ήχο αμέσως
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchOrders();
      } else {
        setIsLoading(false);
      }
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
    const channel = supabase
      .channel('admin-orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Έλεγχος νέων παραγγελιών και αναπαραγωγή ήχου
  useEffect(() => {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    if (pendingCount > prevCount && !isMuted && audioUnlocked && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio block by browser:", e));
    }
    setPrevCount(pendingCount);
  }, [orders, isMuted, prevCount, audioUnlocked]);

  const updateOrderStatus = async (id: number, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    await supabase.from('orders').update({ status: newStatus }).eq('id', id);
  };

  const handlePrint = (order: any) => {
    setActivePrintOrder(order);
    setIsPrinting(true);
  };

  // Συνάρτηση για να ξεκλειδώσει ο ήχος με το πρώτο κλικ του χρήστη
  const unlockAudio = () => {
    if (audioRef.current && !audioUnlocked) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
        audioRef.current!.currentTime = 0;
        setAudioUnlocked(true);
      }).catch(e => console.log(e));
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-[#38BDF8] font-bold animate-pulse">Φόρτωση...</div>;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedOrders = orders.filter(o => o.status === 'completed' && (new Date().getTime() - new Date(o.created_at).getTime() < 24 * 60 * 60 * 1000));

  return (
    <>
      {/* 1. ΚΥΡΙΟ DASHBOARD - Κρύβεται ΠΛΗΡΩΣ όταν εκτυπώνουμε */}
      <div className={`min-h-screen font-sans bg-[#0B1120] text-gray-200 ${isPrinting ? "hidden" : "block"}`} onClick={unlockAudio}>
        
        <header className="bg-[#0F172A] border-b border-white/10 p-4 md:p-6 sticky top-0 z-40 flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white italic tracking-tight">
              HELLAS AALBORG <span className="text-[#38BDF8]">ADMIN</span>
            </h1>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Διαχείριση Takeaway</p>
          </div>
          <div className="flex items-center gap-4">
            
            {!audioUnlocked && (
              <button onClick={unlockAudio} className="bg-orange-500 text-black px-4 py-2 rounded-xl text-xs font-black uppercase animate-bounce">
                Ενεργοποιηση Ηχου 🔊
              </button>
            )}

            <button onClick={() => setIsMuted(!isMuted)} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors ${isMuted ? "bg-red-900/40 text-red-400 border border-red-800" : "bg-white/10 text-white border border-white/5 hover:bg-white/20"}`}>
              {isMuted ? "🔇" : "🔊"}
            </button>
            <div className="hidden md:block text-right">
              <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/")} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase">ΕΞΟΔΟΣ</button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0F172A]/50 border border-white/10 rounded-[2rem] p-5 shadow-xl min-h-[80vh]">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <h2 className="font-black text-lg uppercase text-[#38BDF8] tracking-widest flex items-center gap-2">Νέες Παραγγελίες</h2>
              <span className="bg-[#38BDF8] text-[#0B1120] font-black px-3 py-1 rounded-lg text-sm">{pendingOrders.length}</span>
            </div>

            <div className="flex flex-col gap-4">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-20 text-gray-600 font-bold uppercase tracking-widest">Καμία εκκρεμότητα 🎉</div>
              ) : (
                pendingOrders.map(order => (
                  <OrderCard key={order.id} order={order} onPrint={() => handlePrint(order)} onComplete={() => updateOrderStatus(order.id, 'completed')} />
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900/30 border border-white/5 rounded-[2rem] p-5 opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <h2 className="font-black text-lg uppercase text-gray-500 tracking-widest">Ολοκληρωμένες Σήμερα</h2>
              <span className="bg-gray-800 text-gray-400 border border-gray-700 font-black px-3 py-1 rounded-lg text-sm">{completedOrders.length}</span>
            </div>

            <div className="flex flex-col gap-3">
              {completedOrders.slice(0, 15).map(order => (
                <div key={order.id} className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-gray-300">#{order.order_number || order.id.toString().slice(-4)} - {order.customer_name}</h3>
                    <p className="text-xs text-gray-500 font-bold mt-1">{new Date(order.created_at).toLocaleTimeString("el-GR")} • {order.total_price} DKK</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handlePrint(order)} className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 flex items-center justify-center transition-colors">🖨️</button>
                    <button onClick={() => updateOrderStatus(order.id, 'pending')} className="w-10 h-10 rounded-xl bg-orange-900/30 text-orange-500 hover:bg-orange-900/50 flex items-center justify-center transition-colors text-xs font-black">↩️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* 2. ΚΡΥΦΟΣ ΕΚΤΥΠΩΤΗΣ - Φαίνεται ΜΟΝΟ όταν πατάς εκτύπωση! */}
      {isPrinting && (
        <div className="bg-white text-black w-full m-0 p-0">
          <PrintTicket 
            order={activePrintOrder} 
            storeName="HELLAS AALBORG" 
            isThermal={true} 
            hasKitchenEnabled={false}
            onPrintDone={() => { 
              setIsPrinting(false); 
              setActivePrintOrder(null); 
            }} 
          />
        </div>
      )}
    </>
  );
}

// --- Η ΚΑΡΤΑ ΤΗΣ ΠΑΡΑΓΓΕΛΙΑΣ ---
const OrderCard = ({ order, onPrint, onComplete }: { order: any, onPrint: () => void, onComplete: () => void }) => {
  const items = order.items || [];
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
      {order.discount_dkk > 0 && <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-md">🎁 Loyalty Χρήστης</div>}

      <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3">
        <div>
          <h3 className="text-2xl font-black text-white italic">#{order.order_number || order.id.toString().slice(-4)}</h3>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Πελάτης: <span className="text-white">{order.customer_name}</span> ({order.customer_phone})</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LiveTimer createdAt={order.created_at} />
          {/* ΜΕΓΑΛΥΤΕΡΗ ΕΜΦΑΣΗ ΣΤΗΝ ΩΡΑ ΠΑΡΑΛΑΒΗΣ ΣΤΟ DASHBOARD */}
          <span className="bg-sky-500 text-[#0B1120] text-xs font-black px-3 py-1.5 rounded-lg uppercase shadow-md flex items-center gap-1 border-2 border-sky-400">
            🕒 ΠΑΡΑΛΑΒΗ: {order.requested_time || "ASAP"}
          </span>
        </div>
      </div>

      <ul className="space-y-2 mb-5">
        {items.map((it: any, i: number) => (
          <li key={i} className="flex flex-col text-sm">
            <div className="flex justify-between font-bold text-gray-200">
              <span><span className="text-[#38BDF8] mr-2 text-lg">{it.quantity || 1}x</span>{it.title_da || it.name}</span>
              <span>{(it.unit_price_dkk * (it.quantity || 1)).toFixed(0)} DKK</span>
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

      <div className="flex items-center justify-between border-t border-slate-700 pt-4">
        <div>
          <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Σύνολο ({order.payment_method})</span>
          <span className="text-xl font-black text-white">{order.total_price?.toFixed(2)} DKK</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onPrint} className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center text-xl transition-colors shadow-md active:scale-95">🖨️</button>
          <button onClick={onComplete} className="px-6 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase transition-colors shadow-md active:scale-95 tracking-wider">✅ ΕΤΟΙΜΗ</button>
        </div>
      </div>
    </div>
  );
};
