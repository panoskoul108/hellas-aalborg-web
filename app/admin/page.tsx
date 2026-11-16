'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase'; 
import { PrintTicket } from './PrintTicket'; 
import OrderTimer from '@/components/admin/OrderTimer'; 
import { OrderCard } from '../../components/admin/OrderCard'; 
import HistoryPanel from '../../components/admin/HistoryPanel'; 
import SettingsPanel from '../../components/admin/SettingsPanel';
import Link from 'next/link';

// Ορίζουμε 2 διαφορετικούς ήχους
const NOTIFICATION_SOUND = "/notification.mp3.wav"; // Για παραγγελίες
const CHAT_SOUND = "/chat-alert.mp3.wav";           // ΝΕΟ: Για μηνύματα

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // -- STATES ΓΙΑ ΤΟ PIN PAD, ΗΧΟ ΚΑΙ ΥΠΕΝΘΥΜΙΣΕΙΣ --
  const prevCountRef = useRef(0); 
  const remindedOrdersRef = useRef<Set<number>>(new Set()); 
  
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [expectedPin, setExpectedPin] = useState('1234'); 
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [reminderAlert, setReminderAlert] = useState({ show: false, orderId: '', time: '' });
  
  // -- UI STATES --
  const [isPrinting, setIsPrinting] = useState(false);
  const [activePrintOrder, setActivePrintOrder] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'settings'>('live');
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  // -- STATES ΓΙΑ ΤΟ SUPPORT CHAT --
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [activeChatOrderId, setActiveChatOrderId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const prevChatCountRef = useRef(0);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {
      console.log('Το Wake Lock απορρίφθηκε ή δεν υποστηρίζεται:', err);
    }
  };

  useEffect(() => {
    const initDash = async () => {
      const { data: pinData } = await supabase.from('pos_settings').select('pin_code').eq('id', 1).single();
      if (pinData) setExpectedPin(pinData.pin_code.trim()); 
      
      const { data: storeSettings } = await supabase.from('store_settings').select('accepting_orders').eq('id', 1).single();
      if (storeSettings) setIsStoreOpen(storeSettings.accepting_orders);

      await fetchOrders();
      await fetchChats();
    };
    initDash();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setOrders(data);
    setIsLoading(false);
  };

  const fetchChats = async () => {
    // Φέρνουμε τα μηνύματα των τελευταίων 3 ημερών για να μην "βαραίνει"
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase.from('support_chats').select('*').gte('created_at', threeDaysAgo).order('created_at', { ascending: true });
    if (data) setSupportMessages(data);
  };

  // --- REALTIME SUBSCRIPTIONS (ΟRDERS & CHATS) ---
  useEffect(() => {
    const orderChannel = supabase.channel('admin-orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') setOrders(prev => [payload.new, ...prev]);
        else if (payload.eventType === 'UPDATE') setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
        else if (payload.eventType === 'DELETE') setOrders(prev => prev.filter(o => o.id !== payload.old.id));
      })
      .subscribe();

    const chatChannel = supabase.channel('admin-chats-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_chats' }, (payload) => {
        setSupportMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(orderChannel); 
      supabase.removeChannel(chatChannel); 
    };
  }, []);

  useEffect(() => {
    if (!audioUnlocked) return;
    const interval = setInterval(() => { fetchOrders(); fetchChats(); }, 60000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') { fetchOrders(); fetchChats(); requestWakeLock(); }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", handleVisibilityChange); };
  }, [audioUnlocked]);

  // --- ΣΥΝΑΡΤΗΣΕΙΣ ΑΝΑΠΑΡΑΓΩΓΗΣ ΗΧΩΝ ---
  const playSound = () => {
    const audio = document.getElementById('order-alert-sound') as HTMLAudioElement;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log("Audio Blocked:", e));
    }
  };

  const playChatSound = () => {
    const audio = document.getElementById('chat-alert-sound') as HTMLAudioElement;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log("Audio Blocked:", e));
    }
  };

  // --- ΜΗΧΑΝΙΣΜΟΙ ΗΧΩΝ & ΥΠΕΝΘΥΜΙΣΕΩΝ ---

  // 1. Ήχος για ΝΕΕΣ ΠΑΡΑΓΓΕΛΙΕΣ
  useEffect(() => {
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    if (pendingCount > prevCountRef.current && audioUnlocked) playSound();
    prevCountRef.current = pendingCount;
  }, [orders, audioUnlocked]);

  // 2. Ήχος για ΝΕΑ ΜΗΝΥΜΑΤΑ (Από πελάτη)
  useEffect(() => {
    const unreadCount = supportMessages.filter(m => !m.is_store).length;
    if (unreadCount > prevChatCountRef.current && audioUnlocked) playChatSound();
    prevChatCountRef.current = unreadCount;
  }, [supportMessages, audioUnlocked]);

  // 3. Επαναλαμβανόμενος ήχος ΚΑΘΕ 5 ΔΕΥΤΕΡΟΛΕΠΤΑ όσο υπάρχουν "Pending" Orders
  useEffect(() => {
    if (!audioUnlocked) return;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    let interval: NodeJS.Timeout;
    if (pendingCount > 0) interval = setInterval(() => playSound(), 5000);
    return () => { if (interval) clearInterval(interval); };
  }, [orders, audioUnlocked]);

  // 4. Υπενθύμιση παραγγελιών στο 10λεπτο (ΜΟΝΟ ΠΡΟΓΡΑΜΜΑΤΙΣΜΕΝΕΣ)
  useEffect(() => {
    if (!audioUnlocked) return;
    const interval = setInterval(() => {
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      orders.forEach(order => {
        if (order.status === 'preparing' && order.requested_time) {
          const [reqH, reqM] = order.requested_time.split(':').map(Number);
          let diff = (reqH * 60 + reqM) - currentTotalMinutes;
          if (diff < -720) diff += 1440; 
          const minutesSinceCreation = (now.getTime() - new Date(order.created_at).getTime()) / 60000;
          const isScheduled = minutesSinceCreation >= 20;
          
          if (diff > 0 && diff <= 10 && !remindedOrdersRef.current.has(order.id) && isScheduled) {
            playSound();
            setTimeout(() => playSound(), 1000);
            setReminderAlert({ show: true, orderId: order.order_number || order.id.toString().slice(-4), time: order.requested_time.slice(0, 5) });
            remindedOrdersRef.current.add(order.id);
            setTimeout(() => setReminderAlert({ show: false, orderId: '', time: '' }), 12000);
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [orders, audioUnlocked]);

  // Auto-scroll όταν ανοίγει ένα chat ή έρχεται νέο μήνυμα
  useEffect(() => {
    if (isChatPanelOpen && activeChatOrderId) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [supportMessages, isChatPanelOpen, activeChatOrderId]);

  useEffect(() => {
    if (sessionStorage.getItem('admin_unlocked') === 'true') {
      setAudioUnlocked(true);
    }
  }, []);

  const handlePinSubmit = () => {
    if (enteredPin === expectedPin) {
      sessionStorage.setItem('admin_unlocked', 'true');
      const audio = document.getElementById('order-alert-sound') as HTMLAudioElement;
      if (audio) {
        audio.muted = true;
        audio.play().then(() => { audio.muted = false; setAudioUnlocked(true); requestWakeLock(); }).catch(e => { setAudioUnlocked(true); requestWakeLock(); });
      } else { setAudioUnlocked(true); requestWakeLock(); }
    } else {
      setPinError(true); setEnteredPin(''); setTimeout(() => setPinError(false), 800);
    }
  };

  const toggleStoreStatus = async () => {
    const newStatus = !isStoreOpen;
    setIsStoreOpen(newStatus); 
    const { data, error } = await supabase.from('store_settings').update({ accepting_orders: newStatus }).eq('id', 1).select();
    if (error || !data || data.length === 0) {
      alert("Σφάλμα κατά την αλλαγή κατάστασης. Παρακαλώ ανανεώστε τη σελίδα.");
      setIsStoreOpen(!newStatus); 
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    const orderToCancel = orders.find(o => o.id === orderId);
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    if (error) { alert("Σφάλμα κατά την ακύρωση: " + error.message); return; } 
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));

    if (orderToCancel?.user_id) {
      try {
        const { data: settings } = await supabase.from('store_settings').select('loyalty_earn_percentage').eq('id', 1).single();
        const earnPct = settings ? settings.loyalty_earn_percentage : 5;
        const earnedCashback = Number((orderToCancel.total_price * (earnPct / 100)).toFixed(2));
        const usedDiscount = orderToCancel.discount_dkk || 0;
        await supabase.rpc('rollback_order_loyalty', { p_user_id: orderToCancel.user_id, p_used_discount: usedDiscount, p_earned_cashback: earnedCashback, p_order_total: orderToCancel.total_price });
      } catch (err) { console.error("Σφάλμα κατά το rollback:", err); }
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
    setActivePrintOrder(updatedOrder); setIsPrinting(true); setSelectedOrder(null); 
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

  const sendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!chatInput.trim() || !activeChatOrderId) return;
    const msg = chatInput.trim();
    setChatInput('');
    await supabase.from('support_chats').insert([{
      order_id: activeChatOrderId,
      message: msg,
      is_store: true
    }]);
  };

  // ΝΕΟ: Διαγραφή όλου του ιστορικού μηνυμάτων για τη συγκεκριμένη παραγγελία
  const handleDeleteChat = async () => {
    if (!activeChatOrderId) return;
    if (!window.confirm("Σίγουρα θέλετε να διαγράψετε όλο το ιστορικό μηνυμάτων γι' αυτή την παραγγελία;")) return;
    
    const { error } = await supabase.from('support_chats').delete().eq('order_id', activeChatOrderId);
    if (error) {
      alert("Σφάλμα κατά τη διαγραφή: " + error.message);
      return;
    }
    
    // Αφαιρούμε τα διεγραμμένα μηνύματα από το state και κλείνουμε την προβολή συνομιλίας
    setSupportMessages(prev => prev.filter(m => m.order_id !== activeChatOrderId));
    setActiveChatOrderId(null);
  };

  if (isLoading) return <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-[#38BDF8] font-bold text-xl animate-pulse">Φόρτωση Ταμείου...</div>;

  if (!audioUnlocked) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-6 text-center bg-[url('/bg.jpg')] bg-cover bg-fixed bg-center relative">
        <div className="absolute inset-0 bg-[#0B1120]/90 -z-10 backdrop-blur-sm"></div>
        <audio id="order-alert-sound" src={NOTIFICATION_SOUND} preload="auto" />
        <audio id="chat-alert-sound" src={CHAT_SOUND} preload="auto" />
        <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-2 shadow-black drop-shadow-md">HELLAS AALBORG</h1>
        <p className="text-[#38BDF8] font-black uppercase tracking-widest text-xs mb-8">ΚΛΕΙΔΩΜΑ ΟΘΟΝΗΣ</p>
        <div className={`bg-slate-800/80 p-8 rounded-[2.5rem] shadow-2xl border ${pinError ? 'border-red-500 animate-shake' : 'border-slate-600/50'} w-full max-w-xs backdrop-blur-md transition-colors duration-300`}>
          <div className={`mb-8 h-14 bg-slate-900 rounded-2xl flex items-center justify-center tracking-[0.5em] text-3xl font-black border shadow-inner transition-colors ${pinError ? 'text-red-500 border-red-500/50' : 'text-[#38BDF8] border-slate-700'}`}>
             {enteredPin.length > 0 ? enteredPin.replace(/./g, '•') : <span className="text-slate-700 tracking-normal text-sm">PIN CODE</span>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button key={num} onClick={() => { if(enteredPin.length < 8) setEnteredPin(prev => prev + num); }} className="bg-slate-700 hover:bg-slate-600 text-white text-2xl font-black rounded-2xl aspect-square active:scale-90 transition-all shadow-md border border-slate-600">{num}</button>
            ))}
            <button onClick={() => setEnteredPin('')} className="bg-red-900/40 hover:bg-red-500 text-red-400 hover:text-white text-lg font-black rounded-2xl aspect-square active:scale-90 transition-all shadow-md border border-red-900/50">C</button>
            <button onClick={() => { if(enteredPin.length < 8) setEnteredPin(prev => prev + '0'); }} className="bg-slate-700 hover:bg-slate-600 text-white text-2xl font-black rounded-2xl aspect-square active:scale-90 transition-all shadow-md border border-slate-600">0</button>
            <button onClick={handlePinSubmit} className="bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] text-2xl font-black rounded-2xl aspect-square active:scale-90 transition-all shadow-md border border-sky-400">✓</button>
          </div>
        </div>
      </div>
    );
  }

  // --- Υπολογισμοί Μηνυμάτων & Ταξινόμηση Παραγγελιών ---
  
  const activeChatOrders = Array.from(new Set(supportMessages.map(m => m.order_id)));
  const unreadChatCount = activeChatOrders.filter(id => {
     const msgs = supportMessages.filter(m => m.order_id === id);
     return msgs.length > 0 && !msgs[msgs.length - 1].is_store;
  }).length;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders
    .filter(o => o.status === 'preparing')
    .sort((a, b) => {
      if (!a.requested_time) return 1;
      if (!b.requested_time) return -1;
      const now = new Date();
      const currentTotalMins = now.getHours() * 60 + now.getMinutes();
      const getDiff = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        let diff = (h * 60 + m) - currentTotalMins;
        if (diff < -720) diff += 1440; 
        return diff;
      };
      return getDiff(a.requested_time) - getDiff(b.requested_time);
    });
  const completedOrders = orders.filter(o => o.status === 'completed' && o.is_delivered !== true && (new Date().getTime() - new Date(o.created_at).getTime() < 24 * 60 * 60 * 1000));

  // Εύρεση της παραγγελίας για το Chat Panel
  const currentChatOrder = orders.find(o => o.id === activeChatOrderId);

  return (
    <>
      <audio id="order-alert-sound" src={NOTIFICATION_SOUND} preload="auto" />
      <audio id="chat-alert-sound" src={CHAT_SOUND} preload="auto" />

      {/* ΟΠΤΙΚΟ BANNER ΥΠΕΝΘΥΜΙΣΗΣ */}
      {reminderAlert.show && (
        <div className="fixed top-20 md:top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-5 rounded-3xl shadow-[0_20px_50px_rgba(220,38,38,0.7)] z-[9999] animate-bounce border-4 border-white flex flex-col items-center min-w-[320px]">
          <span className="text-5xl mb-2">⚠️</span>
          <span className="font-black text-xl md:text-2xl uppercase tracking-widest text-center">ΠΡΟΣΟΧΗ ΧΡΟΝΟΣ!</span>
          <span className="font-bold text-lg md:text-xl mt-2 text-red-100 text-center">
            Η παραγγελία <strong className="text-white text-2xl">#{reminderAlert.orderId}</strong> πρέπει να βγει στις <strong className="text-white text-2xl">{reminderAlert.time}</strong>
          </span>
        </div>
      )}

      <div className={`min-h-screen font-sans bg-[#0B1120] text-gray-200 bg-[url('/bg.jpg')] bg-cover bg-fixed bg-center relative print:hidden ${isPrinting ? "hidden" : "block"}`}>
        <div className="absolute inset-0 bg-[#0B1120]/85 -z-10"></div>

        <header className="bg-[#0F172A]/90 border-b border-white/10 p-4 sticky top-0 z-40 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg backdrop-blur-md transition-all">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-black text-white italic tracking-tight">
              HELLAS AALBORG <span className="text-[#38BDF8]">ADMIN</span>
            </h1>
          </div>
          
          <div className="flex bg-slate-900/80 rounded-xl p-1 border border-slate-700/50 shadow-inner">
            <button 
              onClick={() => setActiveTab('live')} 
              className={`px-4 md:px-6 py-2 rounded-lg text-xs font-black uppercase transition-all duration-300 ${activeTab === 'live' ? 'bg-[#38BDF8] text-[#0B1120] shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              LIVE ΤΑΜΕΙΟ
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              className={`px-4 md:px-6 py-2 rounded-lg text-xs font-black uppercase transition-all duration-300 ${activeTab === 'history' ? 'bg-[#38BDF8] text-[#0B1120] shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              ΙΣΤΟΡΙΚΟ & Z
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`px-4 md:px-6 py-2 rounded-lg text-xs font-black uppercase transition-all duration-300 ${activeTab === 'settings' ? 'bg-[#38BDF8] text-[#0B1120] shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              ΡΥΘΜΙΣΕΙΣ
            </button>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center">
            
            <button 
              onClick={toggleStoreStatus}
              className={`hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm ${
                isStoreOpen 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                  : 'bg-red-500 text-white border-red-600 hover:bg-red-600 animate-pulse'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${isStoreOpen ? 'bg-emerald-400' : 'bg-white'}`}></div>
              {isStoreOpen ? 'ΑΝΟΙΧΤΟ' : 'ΚΛΕΙΣΤΟ (PAUSE)'}
            </button>

            <Link href="/admin/products" className="hidden lg:flex items-center gap-1.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-sm transition-colors">
                📋 ΚΑΤΑΛΟΓΟΣ
            </Link>
            
            <button onClick={playSound} className="hidden sm:flex items-center justify-center bg-slate-800 text-gray-300 border border-slate-600 w-10 h-10 rounded-xl hover:bg-slate-700 transition-colors shadow-sm" title="Δοκιμή Ήχου Παραγγελίας">
              🔊
            </button>

            <button 
              onClick={() => { setIsChatPanelOpen(true); setActiveChatOrderId(null); }} 
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 text-lg shadow-sm transition-colors" 
              title="Μηνύματα Πελατών"
            >
              💬
              {unreadChatCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg animate-bounce">
                  {unreadChatCount}
                </span>
              )}
            </button>

            <button onClick={fetchOrders} className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 hover:bg-[#38BDF8]/20 text-lg shadow-sm transition-colors" title="Ανανέωση">
              🔄
            </button>
            
            <div className="h-6 w-px bg-slate-700 hidden sm:block mx-1"></div>

            <button onClick={() => { setAudioUnlocked(false); setEnteredPin(''); sessionStorage.removeItem('admin_unlocked'); }} className="text-[10px] text-orange-400 hover:text-white bg-orange-500/10 hover:bg-orange-500/30 border border-orange-500/30 font-black uppercase px-6 py-2.5 rounded-xl transition-colors shadow-sm">
              ΚΛΕΙΔΩΜΑ
            </button>
          </div>
        </header>

        <div className="lg:hidden p-4 bg-[#0F172A] border-b border-white/10 flex flex-col gap-2">
           <button 
              onClick={toggleStoreStatus}
              className={`w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all border shadow-lg ${
                isStoreOpen 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30' 
                  : 'bg-red-500 text-white border-red-600 hover:bg-red-600 animate-pulse'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${isStoreOpen ? 'bg-emerald-400' : 'bg-white'}`}></div>
              {isStoreOpen ? 'ΠΑΡΑΓΓΕΛΙΕΣ ΑΝΟΙΧΤΕΣ' : 'ΠΑΡΑΓΓΕΛΙΕΣ ΚΛΕΙΣΤΕΣ (STORE PAUSE)'}
            </button>
            <Link href="/admin/products" className="w-full flex justify-center items-center gap-1.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 px-4 py-3 rounded-xl text-sm font-black uppercase shadow-sm transition-colors">
               📋 ΔΙΑΧΕΙΡΙΣΗ ΚΑΤΑΛΟΓΟΥ
            </Link>
        </div>

        {activeTab === 'live' ? (
          <main className="p-4 md:p-6 max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            
            {/* ΝΕΕΣ */}
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
                    <div className="flex justify-between items-center px-4 pt-2 mb-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ληψη: {new Date(order.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</span>
                        
                        <button 
                          onClick={() => { setIsChatPanelOpen(true); setActiveChatOrderId(order.id); }}
                          className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-black uppercase transition-colors flex items-center gap-1"
                        >
                          💬 Chat
                        </button>
                      </div>
                      
                      <OrderTimer createdAt={order.created_at} requestedTime={order.requested_time} status={order.status} />
                    </div>
                    <OrderCard order={order} onCancel={handleCancelOrder} onAccept={(exactTime: string | null, mins: number) => handleAcceptOrder(order, exactTime, mins)} onView={() => setSelectedOrder(order)} />
                  </div>
                ))}
              </div>
            </div>

            {/* ΣΕ ΠΡΟΕΤΟΙΜΑΣΙΑ */}
            <div className="bg-[#0F172A]/70 border border-orange-500/30 rounded-[2rem] p-5 shadow-xl min-h-[80vh] backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h2 className="font-black text-lg uppercase text-orange-400 tracking-widest">Σε Προετοιμασία</h2>
                <span className="bg-orange-500 text-[#0B1120] font-black px-3 py-1 rounded-lg text-sm shadow-md">{preparingOrders.length}</span>
              </div>
              <div className="flex flex-col gap-4">
                {preparingOrders.map(order => (
                  <div key={order.id} className="flex flex-col gap-2 bg-slate-800/40 p-2 rounded-2xl border border-orange-500/20 shadow-sm backdrop-blur-md">
                    <div className="flex justify-between items-center px-4 pt-2 mb-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ληψη: {new Date(order.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</span>
                        
                        <button 
                          onClick={() => { setIsChatPanelOpen(true); setActiveChatOrderId(order.id); }}
                          className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-black uppercase transition-colors flex items-center gap-1"
                        >
                          💬 Chat
                        </button>
                      </div>
                      
                      <OrderTimer createdAt={order.created_at} requestedTime={order.requested_time} status={order.status} />
                    </div>
                    <OrderCard order={order} onComplete={() => handleCompleteOrder(order)} onPrint={() => { setActivePrintOrder(order); setIsPrinting(true); }} onView={() => setSelectedOrder(order)} />
                  </div>
                ))}
              </div>
            </div>

            {/* ΟΛΟΚΛΗΡΩΜΕΝΕΣ */}
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
                        
                        <button onClick={() => { setIsChatPanelOpen(true); setActiveChatOrderId(order.id); }} className="text-[10px] bg-indigo-700 hover:bg-indigo-600 transition-colors px-2 py-1.5 rounded text-white font-bold border border-indigo-600 shadow-sm" title="Μήνυμα">💬</button>
                        
                        <button onClick={() => setSelectedOrder(order)} className="text-[10px] bg-gray-700 hover:bg-gray-600 transition-colors px-2 py-1.5 rounded text-white font-bold border border-gray-600 shadow-sm">👁️</button>
                        <button onClick={() => handleDismissOrder(order.id)} title="Παραδόθηκε (Απόκρυψη)" className="text-[10px] bg-emerald-600 hover:bg-emerald-500 transition-colors px-2 py-1.5 rounded text-white font-black shadow-sm border border-emerald-500">✓</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        ) : activeTab === 'history' ? (
          <div className="p-4 md:p-6 max-w-[1800px] mx-auto animate-fade-in">
            <HistoryPanel />
          </div>
        ) : (
          <div className="p-4 md:p-6 max-w-[1800px] mx-auto animate-fade-in">
            <SettingsPanel />
          </div>
        )}
      </div>

      {/* ======================================= */}
      {/* ΣΥΡΤΑΡΙ ΓΙΑ ΤΑ CHAT ΤΟΥ ADMIN           */}
      {/* ======================================= */}
      {isChatPanelOpen && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex justify-end animate-fade-in backdrop-blur-sm" onClick={() => setIsChatPanelOpen(false)}>
          <div className="w-full md:max-w-md bg-[#0F172A] h-full flex flex-col shadow-2xl border-l border-white/10" onClick={e => e.stopPropagation()}>
            
            <div className="p-5 border-b border-white/10 bg-slate-900 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                💬 Υποστήριξη
              </h2>
              <button onClick={() => setIsChatPanelOpen(false)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>
            
            {!activeChatOrderId ? (
              // 1. ΛΙΣΤΑ ΜΕ ΕΝΕΡΓΑ CHAT
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {activeChatOrders.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm mt-10 font-bold uppercase">Κανένα ενεργό Chat</p>
                ) : (
                  activeChatOrders.map(oid => {
                    const msgs = supportMessages.filter(m => m.order_id === oid);
                    const lastMsg = msgs[msgs.length - 1];
                    const isUnread = !lastMsg.is_store;
                    const orderForList = orders.find(o => o.id === oid);
                    return (
                      <div 
                        key={oid} 
                        onClick={() => setActiveChatOrderId(oid)} 
                        className={`p-4 rounded-2xl cursor-pointer border transition-colors shadow-sm ${isUnread ? 'bg-indigo-900/40 border-indigo-500/50' : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-black text-white text-sm">Order #{orderForList?.order_number || oid.toString().slice(-4)} - {orderForList?.customer_name || 'ΠΕΛΑΤΗΣ'}</span>
                          <span className="text-[9px] font-bold text-gray-400">{new Date(lastMsg.created_at).toLocaleTimeString('el-GR', {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className={`text-xs line-clamp-1 ${isUnread ? 'text-indigo-300 font-bold' : 'text-gray-500'}`}>
                          {lastMsg.is_store ? 'Εσείς: ' : 'Πελάτης: '} {lastMsg.message}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              // 2. ΠΡΟΒΟΛΗ ΣΥΓΚΕΚΡΙΜΕΝΟΥ CHAT (ΑΠΑΝΤΗΣΗ & ΔΙΑΓΡΑΦΗ)
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0F172A]">
                <div className="p-3 bg-slate-800 border-b border-white/5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setActiveChatOrderId(null)} className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full text-white hover:bg-slate-600 transition-colors">←</button>
                    <div className="flex flex-col">
                      <span className="font-black text-white text-sm uppercase">Order #{currentChatOrder?.order_number || activeChatOrderId.toString().slice(-4)} - {currentChatOrder?.customer_name || 'ΠΕΛΑΤΗΣ'}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{currentChatOrder?.customer_phone || ''}</span>
                    </div>
                  </div>
                  {/* ΝΕΟ: ΚΟΥΜΠΙ ΔΙΑΓΡΑΦΗΣ ΙΣΤΟΡΙΚΟΥ CHAT */}
                  <button onClick={handleDeleteChat} className="text-gray-500 hover:text-red-400 p-2 transition-colors" title="Διαγραφή Ιστορικού Μηνυμάτων">
                    🗑️
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  {supportMessages.filter(m => m.order_id === activeChatOrderId).map(msg => (
                    <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.is_store ? 'self-end' : 'self-start'}`}>
                      <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 mx-1 ${msg.is_store ? 'text-[#38BDF8] text-right' : 'text-emerald-400'}`}>
                        {msg.is_store ? 'Εσείς' : (currentChatOrder?.customer_name || 'Πελάτης')}
                      </span>
                      <div className={`px-4 py-3 rounded-2xl text-sm font-medium ${msg.is_store ? 'bg-[#38BDF8] text-[#0B1120] rounded-tr-sm' : 'bg-slate-800 text-white rounded-tl-sm'}`}>
                        {msg.message}
                      </div>
                      <span className={`text-[9px] text-gray-500 mt-1 mx-1 font-bold ${msg.is_store ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('el-GR', {hour:'2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  ))}
                  <div ref={chatMessagesEndRef} />
                </div>
                <form onSubmit={sendAdminMessage} className="p-4 bg-slate-900 border-t border-white/5 flex gap-2 shrink-0">
                  <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Απάντηση..." className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#38BDF8] transition-colors" />
                  <button type="submit" disabled={!chatInput.trim()} className="bg-[#38BDF8] text-[#0B1120] font-black uppercase text-xs px-5 rounded-xl disabled:opacity-50 transition-colors">SEND</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {isPrinting && (
        <div className="bg-white text-black w-full m-0 p-0">
          <PrintTicket order={activePrintOrder} storeName="HELLAS AALBORG" isThermal={true} hasKitchenEnabled={false} onPrintDone={() => { setIsPrinting(false); setActivePrintOrder(null); }} />
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL ΛΕΠΤΟΜΕΡΕΙΩΝ ΠΑΡΑΓΓΕΛΙΑΣ          */}
      {/* ======================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
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

            <div className="p-6 border-t border-slate-700 bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-left w-full md:w-auto">
                <p className="text-xs text-gray-400 font-bold uppercase">Πληρωμή: {selectedOrder.payment_method}</p>
                <p className="text-2xl font-black text-white">{selectedOrder.total_price} kr.</p>
              </div>
              <div className="flex w-full md:w-auto gap-2">
                <button 
                  onClick={() => {
                    setIsChatPanelOpen(true);
                    setActiveChatOrderId(selectedOrder.id);
                    setSelectedOrder(null);
                  }} 
                  className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 text-white font-black px-6 py-3 rounded-xl transition-colors shadow-lg border border-indigo-500"
                >
                  💬 ΜΗΝΥΜΑ
                </button>
                <button 
                  onClick={() => { setActivePrintOrder(selectedOrder); setIsPrinting(true); }} 
                  className="flex-1 md:flex-none bg-slate-700 text-white font-black px-6 py-3 rounded-xl hover:bg-slate-600 transition-colors shadow-lg border border-slate-600"
                >
                  🖨️ ΕΚΤΥΠΩΣΗ
                </button>
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
