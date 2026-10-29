'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import { PrintTicket } from './PrintTicket'; 
import OrderTimer from '@/components/admin/OrderTimer'; 
import { OrderCard } from '../../components/admin/OrderCard'; 
import HistoryPanel from '../../components/admin/HistoryPanel'; 

const NOTIFICATION_SOUND = "/notification.mp3.wav"; 

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [prevCount, setPrevCount] = useState(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const [isPrinting, setIsPrinting] = useState(false);
  const [activePrintOrder, setActivePrintOrder] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  // --- STATES ΓΙΑ ΤΟ PIN PAD ---
  const [expectedPin, setExpectedPin] = useState('1234'); 
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // --- WAKE LOCK API ---
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock ενεργό: Η οθόνη δεν θα σβήσει.');
      }
    } catch (err) {
      console.log('Το Wake Lock απορρίφθηκε ή δεν υποστηρίζεται:', err);
    }
  };

 useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. Αν δεν είσαι συνδεδεμένος, σε πάει στην αρχική για Login (δεν σε αφήνει στο PIN Pad)
      if (!session) { 
        alert("⚠️ Η συνεδρία έληξε ή δεν είστε συνδεδεμένος. Παρακαλώ συνδεθείτε ξανά!");
        window.location.href = "/"; 
        return; 
      }
      
      setUser(session.user);
      
      // 2. Τραβάμε το PIN και αν υπάρχει λάθος (π.χ. RLS), μας πετάει μήνυμα να το ξέρουμε!
      const { data: pinData, error } = await supabase.from('pos_settings').select('pin_code').eq('id', 1).single();
      
      if (error) {
        console.error("Σφάλμα ανάγνωσης PIN:", error.message);
      } else if (pinData) {
        // Βάζουμε trim() σε περίπτωση που πάτησες "1111 " (με κενό στο τέλος) κατά λάθος στη βάση
        setExpectedPin(pinData.pin_code.trim()); 
      }

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

  // --- ΣΥΓΧΡΟΝΙΣΜΟΣ SUPABASE ---
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('admin-orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // --- ΤΡΙΠΛΗ ΑΣΠΙΔΑ: ΑΘΟΡΥΒΟ POLLING ΚΑΙ VISIBILITY API ---
  useEffect(() => {
    if (!user || !audioUnlocked) return;

    // 1. Αόρατη ανανέωση κάθε 60 δευτερόλεπτα (Σώζει σε περίπτωση που πέσει το WebSocket)
    const interval = setInterval(() => {
      fetchOrders();
    }, 60000);

    // 2. Αν ο browser "ξυπνήσει" την καρτέλα (π.χ. άναψε ξανά η οθόνη), κάνε άμεσο refresh
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
        requestWakeLock(); // Ξαναζητάμε το Wake Lock γιατί χάνεται όταν σβήνει η οθόνη
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, audioUnlocked]);

  // --- ΗΧΟΣ ΕΙΔΟΠΟΙΗΣΗΣ ---
  useEffect(() => {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    if (pendingCount > prevCount && audioUnlocked) {
      playSound();
    }
    setPrevCount(pendingCount);
  }, [orders, prevCount, audioUnlocked]);

  const playSound = () => {
    const audio = document.getElementById('order-alert-sound') as HTMLAudioElement;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log("Audio Blocked:", e));
    }
  };

  // --- ΕΛΕΓΧΟΣ PIN & ΞΕΚΛΕΙΔΩΜΑ ΗΧΟΥ/ΟΘΟΝΗΣ ---
  const handlePinSubmit = () => {
    if (enteredPin === expectedPin) {
      const audio = document.getElementById('order-alert-sound') as HTMLAudioElement;
      if (audio) {
        audio.muted = true;
        audio.play().then(() => {
          audio.muted = false;
          setAudioUnlocked(true);
          requestWakeLock(); // Κλειδώνουμε την οθόνη να μένει ανοιχτή
        }).catch(e => {
          console.log("Unlock failed", e);
          setAudioUnlocked(true); 
          requestWakeLock();
        });
      } else {
        setAudioUnlocked(true);
        requestWakeLock();
      }
    } else {
      setPinError(true);
      setEnteredPin('');
      setTimeout(() => setPinError(false), 800);
    }
  };

  const handleAcceptOrder = async (order: any, exactTime: string | null, addedMins: number = 0) => {
    let confirmedTime = exactTime;
    if (!confirmedTime) {
      const targetDate = new Date();
      targetDate.setMinutes(targetDate.getMinutes() + addedMins);
      const hh = targetDate.getHours().toString().padStart(2, '0');
      const mm = targetDate.getMinutes().toString().padStart(2, '0');
      const ss = targetDate.getSeconds().toString().padStart(2, '0'); 
      confirmedTime = `${hh}:${mm}:${ss}`; 
    }
    const updatedOrder = { ...order, status: 'preparing', requested_time: confirmedTime };
    setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
    const { error } = await supabase.from('orders').update({ status: 'preparing', requested_time: confirmedTime }).eq('id', order.id);
    if (error) { alert("Σφάλμα: " + error.message); fetchOrders(); return; }
    setActivePrintOrder(updatedOrder);
    setIsPrinting(true);
    setSelectedOrder(null); 
  };

  const handleCompleteOrder = async (order: any) => {
    const completedAt = new Date().toISOString();
    const updatedOrder = { ...order, status: 'completed', completed_at: completedAt };
    setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
    await supabase.from('orders').update({ status: 'completed', completed_at: completedAt }).eq('id', order.id);
    setSelectedOrder(null);
  };

  const handleDismissOrder = async (orderId: number) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, is_delivered: true } : o));
    await supabase.from('orders').update({ is_delivered: true }).eq('id', orderId);
  };

  if (isLoading) return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-[#38BDF8] font-bold text-xl animate-pulse">Φόρτωση Ταμείου...</div>;

  if (!audioUnlocked) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-6 text-center bg-[url('/bg.jpg')] bg-cover bg-fixed bg-center relative">
        <div className="absolute inset-0 bg-[#0B1120]/90 -z-10 backdrop-blur-sm"></div>
        <audio id="order-alert-sound" src={NOTIFICATION_SOUND} preload="auto" />
        
        <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-2 shadow-black drop-shadow-md">HELLAS AALBORG</h1>
        <p className="text-[#38BDF8] font-black uppercase tracking-widest text-xs mb-8">ΣΥΣΤΗΜΑ ΤΑΜΕΙΟΥ</p>
        
        <div className={`bg-slate-800/80 p-8 rounded-[2.5rem] shadow-2xl border ${pinError ? 'border-red-500 animate-shake' : 'border-slate-600/50'} w-full max-w-xs backdrop-blur-md transition-colors duration-300`}>
          
          <div className={`mb-8 h-14 bg-slate-900 rounded-2xl flex items-center justify-center tracking-[0.5em] text-3xl font-black border shadow-inner transition-colors ${pinError ? 'text-red-500 border-red-500/50' : 'text-[#38BDF8] border-slate-700'}`}>
             {enteredPin.length > 0 ? enteredPin.replace(/./g, '•') : <span className="text-slate-700 tracking-normal text-sm">PIN CODE</span>}
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button key={num} onClick={() => { if(enteredPin.length < 8) setEnteredPin(prev => prev + num); }} className="bg-slate-700 hover:bg-slate-600 text-white text-2xl font-black rounded-2xl aspect-square active:scale-90 transition-all shadow-md border border-slate-600">
                {num}
              </button>
            ))}
            <button onClick={() => setEnteredPin('')} className="bg-red-900/40 hover:bg-red-500 text-red-400 hover:text-white text-lg font-black rounded-2xl aspect-square active:scale-90 transition-all shadow-md border border-red-900/50">C</button>
            <button onClick={() => { if(enteredPin.length < 8) setEnteredPin(prev => prev + '0'); }} className="bg-slate-700 hover:bg-slate-600 text-white text-2xl font-black rounded-2xl aspect-square active:scale-90 transition-all shadow-md border border-slate-600">0</button>
            <button onClick={handlePinSubmit} className="bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] text-2xl font-black rounded-2xl aspect-square active:scale-90 transition-all shadow-md border border-sky-400">✓</button>
          </div>
        </div>
      </div>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const completedOrders = orders.filter(o => o.status === 'completed' && o.is_delivered !== true && (new Date().getTime() - new Date(o.created_at).getTime() < 24 * 60 * 60 * 1000));

  return (
    <>
      <audio id="order-alert-sound" src={NOTIFICATION_SOUND} preload="auto" />

      <div className={`min-h-screen font-sans bg-[#0B1120] text-gray-200 bg-[url('/bg.jpg')] bg-cover bg-fixed bg-center relative ${isPrinting ? "hidden" : "block"}`}>
        <div className="absolute inset-0 bg-[#0B1120]/85 -z-10"></div>

        <header className="bg-[#0F172A]/90 border-b border-white/10 p-4 md:p-6 sticky top-0 z-40 flex justify-between items-center shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-6">
            <h1 className="text-xl md:text-2xl font-black text-white italic tracking-tight">HELLAS AALBORG <span className="text-[#38BDF8]">ADMIN</span></h1>
            
            <div className="hidden md:flex bg-slate-900 rounded-xl p-1 border border-slate-700">
              <button onClick={() => setActiveTab('live')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-colors ${activeTab === 'live' ? 'bg-[#38BDF8] text-[#0B1120]' : 'text-gray-400 hover:text-white'}`}>LIVE ΤΑΜΕΙΟ</button>
              <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-colors ${activeTab === 'history' ? 'bg-[#38BDF8] text-[#0B1120]' : 'text-gray-400 hover:text-white'}`}>ΙΣΤΟΡΙΚΟ & Z</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={playSound} className="hidden sm:block bg-gray-800 text-gray-300 border border-gray-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-700 transition-colors">🔊 Δοκιμή Ήχου</button>
            <a href="/admin/products" className="hidden sm:block bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase shadow-lg transition-colors">📋 ΔΙΑΧΕΙΡΙΣΗ ΚΑΤΑΛΟΓΟΥ</a>
            <button onClick={fetchOrders} className="w-10 h-10 rounded-xl bg-slate-800 text-[#38BDF8] flex items-center justify-center hover:bg-slate-700 text-xl shadow-md transition-colors">🔄</button>
            <button onClick={() => { setAudioUnlocked(false); setEnteredPin(''); }} className="text-xs text-orange-400 hover:text-orange-300 font-bold uppercase ml-2 border border-orange-400/30 px-3 py-2 rounded-lg transition-colors">ΚΛΕΙΔΩΜΑ</button>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/")} className="text-xs text-red-500 hover:text-red-400 font-bold uppercase ml-1 transition-colors">ΕΞΟΔΟΣ</button>
          </div>
        </header>

        {activeTab === 'live' ? (
          <main className="p-4 md:p-6 max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-[#0F172A]/80 border border-[#38BDF8]/30 rounded-[2rem] p-5 shadow-2xl min-h-[80vh] backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h2 className="font-black text-lg uppercase text-[#38BDF8] tracking-widest flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    {pendingOrders.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>}
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#38BDF8]"></span>
                  </span> Νέες
                </h2>
                <span className="bg-[#38BDF8] text-[#0B1120] font-black px-3 py-1 rounded-lg text-sm shadow-md">{pendingOrders.length}</span>
              </div>
              <div className="flex flex-col gap-4">
                {pendingOrders.map(order => (
                  <div key={order.id} className="flex flex-col gap-2 bg-slate-800/40 p-2 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
                    <div className="flex justify-between items-center px-4 pt-2">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ληψη: {new Date(order.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</span>
                      <OrderTimer createdAt={order.created_at} requestedTime={order.requested_time} status={order.status} />
                    </div>
                    <OrderCard order={order} onAccept={(exactTime: string | null, mins: number) => handleAcceptOrder(order, exactTime, mins)} onView={() => setSelectedOrder(order)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0F172A]/70 border border-orange-500/30 rounded-[2rem] p-5 shadow-xl min-h-[80vh] backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h2 className="font-black text-lg uppercase text-orange-400 tracking-widest">Σε Προετοιμασία</h2>
                <span className="bg-orange-500 text-[#0B1120] font-black px-3 py-1 rounded-lg text-sm shadow-md">{preparingOrders.length}</span>
              </div>
              <div className="flex flex-col gap-4">
                {preparingOrders.map(order => (
                  <div key={order.id} className="flex flex-col gap-2 bg-slate-800/40 p-2 rounded-2xl border border-orange-500/20 shadow-sm backdrop-blur-md">
                    <div className="flex justify-between items-center px-4 pt-2">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ληψη: {new Date(order.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</span>
                      <OrderTimer createdAt={order.created_at} requestedTime={order.requested_time} status={order.status} />
                    </div>
                    <OrderCard order={order} onComplete={() => handleCompleteOrder(order)} onPrint={() => { setActivePrintOrder(order); setIsPrinting(true); }} onView={() => setSelectedOrder(order)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-5 opacity-90 hover:opacity-100 transition-opacity min-h-[80vh] backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h2 className="font-black text-lg uppercase text-gray-400 tracking-widest">Ολοκληρωμένες</h2>
                <span className="bg-gray-800 text-gray-300 border border-gray-700 font-black px-3 py-1 rounded-lg text-sm shadow-sm">{completedOrders.length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {completedOrders.slice(0, 20).map(order => (
                  <div key={order.id} className="bg-slate-800/60 p-4 rounded-xl border border-white/5 flex flex-col gap-2 relative shadow-sm backdrop-blur-md">
                    <div className="flex justify-between">
                      <h3 className="font-black text-gray-200">#{order.order_number || order.id.toString().slice(-4)} - {order.customer_name}</h3>
                      <span className="text-emerald-400 font-bold">{order.requested_time?.slice(0, 5)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-400 font-bold">{order.total_price} kr. ({order.payment_method})</p>
                      <div className="flex items-center gap-2">
                        <OrderTimer createdAt={order.created_at} requestedTime={order.requested_time} status={order.status} />
                        <button onClick={() => setSelectedOrder(order)} className="text-[10px] bg-gray-700 hover:bg-gray-600 transition-colors px-2 py-1.5 rounded text-white font-bold border border-gray-600 shadow-sm">👁️</button>
                        <button onClick={() => handleDismissOrder(order.id)} title="Παραδόθηκε (Απόκρυψη)" className="text-[10px] bg-emerald-600 hover:bg-emerald-500 transition-colors px-2 py-1.5 rounded text-white font-black shadow-sm border border-emerald-500">✓</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        ) : (
          <div className="p-4 md:p-6 max-w-[1800px] mx-auto animate-fade-in">
            <HistoryPanel />
          </div>
        )}
      </div>

      {isPrinting && (
        <div className="bg-white text-black w-full m-0 p-0">
          <PrintTicket order={activePrintOrder} storeName="HELLAS AALBORG" isThermal={true} hasKitchenEnabled={false} onPrintDone={() => { setIsPrinting(false); setActivePrintOrder(null); }} />
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-slate-800 border border-slate-600 w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
              <div>
                <h2 className="text-2xl font-black text-white italic">#{selectedOrder.order_number || selectedOrder.id.toString().slice(-4)}</h2>
                <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md mt-1 inline-block ${selectedOrder.status === 'pending' ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : selectedOrder.status === 'preparing' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-slate-700 shadow-sm">✕</button>
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
                  <div className="flex items-center gap-3">
                    <p className="text-2xl font-black text-[#38BDF8]">{selectedOrder.requested_time?.slice(0, 5)}</p>
                    <OrderTimer createdAt={selectedOrder.created_at} requestedTime={selectedOrder.requested_time} status={selectedOrder.status} />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Λήψη: {new Date(selectedOrder.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Προϊοντα</h4>
              <ul className="space-y-4">
                {(selectedOrder.items || []).map((it: any, i: number) => (
                  <li key={i} className="flex flex-col bg-slate-900/50 p-4 rounded-xl border border-white/5 shadow-sm">
                    <div className="flex justify-between font-bold text-lg text-white">
                      <span><span className="text-[#38BDF8] mr-2">{it.quantity || 1}x</span>{it.title_da || it.title_el || it.name}</span>
                      <span>{(it.unit_price_dkk * (it.quantity || 1)).toFixed(0)} kr.</span>
                    </div>
                    {it.selectedOptions?.length > 0 && <span className="text-sm text-gray-400 mt-1">+ {it.selectedOptions.map((o:any) => o.name || o).join(', ')}</span>}
                    {it.note && <span className="text-sm bg-yellow-900/40 text-yellow-500 border border-yellow-700/50 px-3 py-1.5 rounded-lg mt-2 inline-block w-fit font-bold italic">📝 {it.note}</span>}
                  </li>
                ))}
              </ul>
              {selectedOrder.notes && (
                <div className="bg-indigo-900/30 border border-indigo-800/50 p-4 rounded-xl mt-6 shadow-sm">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">ΓΕΝΙΚΟ ΣΧΟΛΙΟ:</span>
                  <p className="text-base text-indigo-100 font-bold italic">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-700 bg-slate-900 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Πληρωμή: {selectedOrder.payment_method}</p>
                <p className="text-2xl font-black text-white">{selectedOrder.total_price} kr.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setActivePrintOrder(selectedOrder); setIsPrinting(true); }} className="bg-slate-700 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-600 transition-colors shadow-lg border border-slate-600">🖨️ ΕΚΤΥΠΩΣΗ</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}} />
    </>
  );
}
