'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../supabase';
import ProductModal from './ProductModal';
import LoyaltyWallet from '../../components/order/LoyaltyWallet'; 
import SmartUpsell from '../../components/order/SmartUpsell';
import { dict } from '../utils/dict'; 
import { useCart } from '../hooks/useCart'; 
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';

const MAX_ORDERS = 50; 
const LOCKOUT_MS = 5 * 60 * 1000;
const supabaseImageUrl = "https://keolpijcsvwsrzkjqtkc.supabase.co/storage/v1/object/public/menu-images/";

export default function OrderPage() {
  const [lang, setLang] = useState<'da' | 'en' | 'el'>('da');
  const ui = dict[lang];

  // --- TEMPORARY THEME SWITCHER STATE ---
  const [designTheme, setDesignTheme] = useState<'glass' | 'bento' | 'glow' | 'neumorphism' | 'spotlight'>('glass');

  // --- HOOKS ---
  const { storeOpen, generateTimeSlots } = useStore(ui);
  const auth = useAuth();
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0); 
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, finalTotal, vatMoms, getItemPrice } = useCart(loyaltyDiscount);

  // --- LOCAL STATE ---
  const [storeSettings, setStoreSettings] = useState({ loyalty_max_percentage: 50, loyalty_earn_percentage: 5 });
  const [storeSchedule, setStoreSchedule] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'auth' | 'checkout' | 'success' | 'review' | 'profile'>('cart');
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [requestedTime, setRequestedTime] = useState('ASAP');
  const [orderNote, setOrderNote] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [ordersPlaced, setOrdersPlaced] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  // Νέα States για UI
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [nextOpenTimeStr, setNextOpenTimeStr] = useState<string>("17:00");

  // --- EFFECTS ---
  useEffect(() => {
    const fetchData = async () => {
      const [menuRes, settingsRes, hoursRes] = await Promise.all([
        supabase.from('menu_items').select('*').order('sort_order', { ascending: true }),
        supabase.from('store_settings').select('*').eq('id', 1).single(),
        supabase.from('store_hours').select('*').order('day_of_week', { ascending: true })
      ]);
      
      if (menuRes.data) setMenuItems(menuRes.data);
      if (settingsRes.data) setStoreSettings(settingsRes.data);
      if (hoursRes.data && hoursRes.data.length > 0) {
        setStoreSchedule(hoursRes.data);
        const mapDayOfWeek = (jsDay: number) => jsDay === 0 ? 7 : jsDay; 
        const now = new Date();
        const currentJS = now.getDay();
        const currentDBDay = mapDayOfWeek(currentJS);
        const todaySchedule = hoursRes.data.find((d: any) => d.day_of_week === currentDBDay);
        
        if (todaySchedule && !todaySchedule.is_closed) {
             const [openH, openM] = todaySchedule.open_time.split(':').map(Number);
             const openDate = new Date();
             openDate.setHours(openH, openM, 0, 0);
             if (now < openDate) setNextOpenTimeStr(todaySchedule.open_time.slice(0, 5));
             else {
                  let nextDay = currentDBDay + 1 > 7 ? 1 : currentDBDay + 1;
                  const tomorrowSchedule = hoursRes.data.find((d: any) => d.day_of_week === nextDay);
                  if (tomorrowSchedule && !tomorrowSchedule.is_closed) setNextOpenTimeStr(tomorrowSchedule.open_time.slice(0, 5));
             }
        } else {
             let nextDay = currentDBDay + 1 > 7 ? 1 : currentDBDay + 1;
             let nextDaySchedule = hoursRes.data.find((d: any) => d.day_of_week === nextDay);
             let counter = 0;
             while (nextDaySchedule && nextDaySchedule.is_closed && counter < 7) {
                 nextDay = nextDay + 1 > 7 ? 1 : nextDay + 1;
                 nextDaySchedule = hoursRes.data.find((d: any) => d.day_of_week === nextDay);
                 counter++;
             }
             if (nextDaySchedule && !nextDaySchedule.is_closed) setNextOpenTimeStr(nextDaySchedule.open_time.slice(0, 5));
        }
      }
      setIsLoading(false);
    };
    fetchData();
    
    const storedOrders = parseInt(localStorage.getItem("servato_orders") || "0");
    const lastTime = parseInt(localStorage.getItem("servato_time") || "0");
    if (Date.now() - lastTime > LOCKOUT_MS) localStorage.setItem("servato_orders", "0");
    else { setOrdersPlaced(storedOrders); if (storedOrders >= MAX_ORDERS) setIsLocked(true); }

    const checkSavedOrder = async () => {
      const savedOrderId = localStorage.getItem('hellas_active_order');
      if (savedOrderId) {
        const { data } = await supabase.from('orders').select('*').eq('id', savedOrderId).single();
        if (data && data.is_delivered !== true) { setPlacedOrder(data); setCheckoutStep('success'); setIsCartOpen(true); }
        else localStorage.removeItem('hellas_active_order');
      }
    };
    checkSavedOrder();
  }, []);

  useEffect(() => {
    if (!placedOrder?.id) return;
    const channel = supabase.channel(`public:orders:id=eq.${placedOrder.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${placedOrder.id}` }, async (payload) => {
        setPlacedOrder((prev: any) => ({ ...prev, ...payload.new })); 
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [placedOrder?.id]);

  const localUi = {
    da: { search: "Søg i menuen...", closed: "Lukket", opensAt: `Åbner kl. ${nextOpenTimeStr}`, smiley: "Smiley info", details: "Restaurant detaljer", schedule: "Planlæg ordre", viewOrder: "Se bestilling", legalName: "Juridisk navn", cvr: "Registreret nummer", address: "Registreret adresse", maps: "Se på kort", hours: "Åbningstider", promoBadge: "Få 35 kr. rabat", repeatOrder: "Gentag" },
    en: { search: "Search menu...", closed: "Closed", opensAt: `Opens at ${nextOpenTimeStr}`, smiley: "Smiley info", details: "Restaurant details", schedule: "Schedule order", viewOrder: "View order", legalName: "Legal Name", cvr: "Registered number", address: "Registered address", maps: "View on Maps", hours: "Opening hours", promoBadge: "Get 35 kr. off", repeatOrder: "Repeat" },
    el: { search: "Αναζήτηση μενού...", closed: "Κλειστά", opensAt: `Ανοίγει στις ${nextOpenTimeStr}`, smiley: "Αναφορά Smiley", details: "Πληροφορίες", schedule: "Προγραμματισμος", viewOrder: "Καλαθι", legalName: "Νομική Επωνυμία", cvr: "Αριθμός Μητρώου (CVR)", address: "Διεύθυνση", maps: "Προβολή στους Χάρτες", hours: "Ωράριο Λειτουργίας", promoBadge: "35 kr. Δώρο Εγγραφής", repeatOrder: "Επαναληψη" }
  };
  const t = localUi[lang];

  const openProfile = async () => { setCheckoutStep('profile'); setIsCartOpen(true); auth.fetchOrderHistory(); };

  const handleRepeatOrder = (pastOrder: any) => {
    if (!pastOrder.items || pastOrder.items.length === 0) return;
    if (cart.length > 0) {
      const confirmClear = window.confirm(lang === 'da' ? 'Vil du rydde din nuværende kurv for at gentage denne ordre?' : lang === 'en' ? 'Clear your current cart to repeat this order?' : 'Θέλετε να αδειάσετε το τωρινό καλάθι για να επαναλάβετε την παραγγελία;');
      if (!confirmClear) return;
      clearCart();
    }
    pastOrder.items.forEach((pastItem: any) => {
      const originalProduct = menuItems.find(m => m.id === pastItem.id) || {};
      const itemToReAdd = { ...originalProduct, id: pastItem.id, title_da: pastItem.title_da || originalProduct.title_da, title_en: pastItem.title_en || originalProduct.title_en, title_el: pastItem.title_el || originalProduct.title_el, final_price: pastItem.unit_price_dkk, price_takeaway: pastItem.unit_price_dkk, selectedOptions: pastItem.selectedOptions || [], note: pastItem.note || "" };
      addToCart(itemToReAdd, pastItem.quantity);
    });
    setCheckoutStep('cart');
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeOpen && requestedTime === 'ASAP') return alert(ui.closedStore);
    if (isLocked) return alert("Limit reached.");
    if (!auth.customerName || !auth.customerPhone) return alert('Missing details.');
    setIsSubmitting(true);
    try {
      const payload = { user_id: auth.user?.id || null, order_type: 'takeaway', customer_name: auth.customerName, customer_phone: auth.customerPhone.replace(/\s+/g, ""), requested_time: requestedTime, notes: orderNote, items: cart.map(c => ({ id: c.item.id, title_da: c.item.title_da, title_el: c.item.title_el, quantity: c.quantity, unit_price_dkk: getItemPrice(c.item), selectedOptions: c.item.selectedOptions || [], note: c.item.note || "" })), subtotal_dkk: subtotal, discount_dkk: loyaltyDiscount, vat_moms_dkk: vatMoms, total_price: finalTotal, payment_method: paymentMethod === 'card' ? 'ΚΑΡΤΑ' : 'ΜΕΤΡΗΤΑ', status: 'pending' };
      const { data: orderData, error: orderError } = await supabase.from('orders').insert([payload]).select().single();
      if (orderError) throw orderError;
      setPlacedOrder(orderData); localStorage.setItem('hellas_active_order', orderData.id);
      await supabase.from('action_logs').insert([{ action_type: "TAKEAWAY_ORDER_CREATED", order_id: orderData.id, details: { company: "Nordic-mythos 1 ApS", user: auth.user?.email || "Guest", total_dkk: finalTotal } }]);
      if (auth.user?.id) {
        const { data: settings } = await supabase.from('store_settings').select('loyalty_earn_percentage').eq('id', 1).single();
        const earnPct = settings ? settings.loyalty_earn_percentage : 5;
        const earnedCashback = Number((finalTotal * (earnPct / 100)).toFixed(2));
        const { data: loyaltyData } = await supabase.from('customers_loyalty').select('*').eq('user_id', auth.user.id).single();
        const currentBalance = loyaltyData?.wallet_balance ? Number(loyaltyData.wallet_balance) : 0;
        await supabase.from('customers_loyalty').upsert({ user_id: auth.user.id, wallet_balance: currentBalance - loyaltyDiscount + earnedCashback, total_orders: (loyaltyData?.total_orders || 0) + 1, total_spent_dkk: Number(loyaltyData?.total_spent_dkk || 0) + finalTotal });
      }
      const newTotal = ordersPlaced + 1; setOrdersPlaced(newTotal); localStorage.setItem("servato_orders", newTotal.toString()); localStorage.setItem("servato_time", Date.now().toString());
      setCheckoutStep('success'); setOrderNote(''); 
    } catch (error: any) { alert('Σφάλμα: ' + error.message); } finally { setIsSubmitting(false); }
  };

  const handleCustomerPickup = async () => {
    if (!placedOrder) return;
    const { error } = await supabase.from('orders').update({ is_delivered: true }).eq('id', placedOrder.id);
    if (error) alert("⚠️ Η βάση δεδομένων απέρριψε την ενημέρωση!");
    localStorage.removeItem('hellas_active_order'); setPlacedOrder(null); clearCart(); setCheckoutStep('review');
  };

  const translateDay = (dayName: string, currentLang: string) => {
    const dict: Record<string, any> = { 'ΔΕΥΤΕΡΑ': { da: 'Mandag', en: 'Monday', el: 'Δευτέρα' }, 'ΤΡΙΤΗ': { da: 'Tirsdag', en: 'Tuesday', el: 'Τρίτη' }, 'ΤΕΤΑΡΤΗ': { da: 'Onsdag', en: 'Wednesday', el: 'Τετάρτη' }, 'ΠΕΜΠΤΗ': { da: 'Torsdag', en: 'Thursday', el: 'Πέμπτη' }, 'ΠΑΡΑΣΚΕΥΗ': { da: 'Fredag', en: 'Friday', el: 'Παρασκευή' }, 'ΣΑΒΒΑΤΟ': { da: 'Lørdag', en: 'Saturday', el: 'Σάββατο' }, 'ΚΥΡΙΑΚΗ': { da: 'Søndag', en: 'Sunday', el: 'Κυριακή' }, 'MONDAY': { da: 'Mandag', en: 'Monday', el: 'Δευτέρα' }, 'TUESDAY': { da: 'Tirsdag', en: 'Tuesday', el: 'Τρίτη' }, 'WEDNESDAY': { da: 'Onsdag', en: 'Wednesday', el: 'Τετάρτη' }, 'THURSDAY': { da: 'Torsdag', en: 'Thursday', el: 'Πέμπτη' }, 'FRIDAY': { da: 'Fredag', en: 'Friday', el: 'Παρασκευή' }, 'SATURDAY': { da: 'Lørdag', en: 'Saturday', el: 'Σάββατο' }, 'SUNDAY': { da: 'Søndag', en: 'Sunday', el: 'Κυριακή' } };
    const key = dayName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    return dict[key] ? dict[key][currentLang] : dayName;
  };

  const getItemsForCategory = (cat: string) => cat === 'POPULAR' ? menuItems.filter(i => i.popular) : menuItems.filter(i => i.category === cat);
  const translateCategory = (cat: string, currentLang: string) => {
    if (cat === 'POPULAR') return currentLang === 'da' ? '⭐ Mest bestilte' : currentLang === 'en' ? '⭐ Most ordered' : '⭐ Δημοφιλή';
    const catDict: Record<string, any> = { 'COMBOS': { da: 'Menuer', en: 'Combos', el: 'Μενού' }, 'GYROS PITA': { da: 'Gyros', en: 'Gyros', el: 'Γύρος' }, 'HALLOUMI PITA': { da: 'Halloumi', en: 'Halloumi', el: 'Χαλούμι' }, 'PITA CLUB': { da: 'Pita Club', en: 'Pita Club', el: 'Σκεπαστή' }, 'PORTIONER': { da: 'Portioner', en: 'Portions', el: 'Μερίδες' }, 'RUM': { da: 'Drikkevarer', en: 'Drinks', el: 'Αναψυκτικά' }, 'DIPS': { da: 'Dips & Ekstra', en: 'Dips', el: 'Έξτρα' } };
    const normalizedCat = cat.toUpperCase().trim();
    return catDict[normalizedCat] && catDict[normalizedCat][currentLang] ? catDict[normalizedCat][currentLang] : cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  };

  const getItemsForDisplay = () => {
    if (!searchQuery) return menuItems;
    const q = searchQuery.toLowerCase();
    return menuItems.filter(item => (item.title_da && item.title_da.toLowerCase().includes(q)) || (item.title_en && item.title_en.toLowerCase().includes(q)) || (item.title_el && item.title_el.toLowerCase().includes(q)) || (item.desc_da && item.desc_da.toLowerCase().includes(q)));
  };

  const scrollToCategory = (cat: string) => {
    const element = document.getElementById(`category-${cat}`);
    if (element) { const y = element.getBoundingClientRect().top + window.scrollY - 90; window.scrollTo({ top: y, behavior: 'smooth' }); }
    setIsCategoryMenuOpen(false); 
  };

  const hasRecommended = menuItems.some(p => p.popular);
  const uniqueCategories = [...new Set(menuItems.map(p => p.category))].filter(Boolean);
  const displayCategories = hasRecommended ? ['POPULAR', ...uniqueCategories] : uniqueCategories;
  const displayedItems = getItemsForDisplay();

  // --- ΣΥΣΤΗΜΑ ΘΕΜΑΤΩΝ (ΚΛΑΣΕΙΣ CSS) ---
  const getCardStyle = (theme: string) => {
    switch(theme) {
      case 'bento': return "bg-[#111827] border border-white/10 rounded-[2rem] shadow-none hover:bg-[#1F2937] transition-colors";
      case 'glow': return "bg-slate-900 border border-slate-700 hover:border-sky-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] rounded-[2rem] transition-all duration-300";
      case 'neumorphism': return "bg-[#0B1120] rounded-[2rem] shadow-[8px_8px_16px_#060912,-8px_-8px_16px_#10192e] border border-transparent hover:shadow-[inset_5px_5px_15px_#060912,inset_-5px_-5px_15px_#10192e] transition-all duration-300";
      case 'spotlight': return "bg-transparent border border-transparent hover:bg-white/5 hover:border-white/10 rounded-[2rem] transition-all duration-300";
      case 'glass':
      default: return "bg-[#0F172A]/60 backdrop-blur-xl border border-white/5 shadow-lg hover:shadow-2xl hover:shadow-sky-500/10 rounded-[2rem] hover:-translate-y-1 transition-all duration-300";
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#0B1120] text-gray-200 selection:bg-[#38BDF8] selection:text-[#0B1120] pb-28 md:pb-12 relative overflow-hidden">
      
     {/* TEMP: THEME SWITCHER ΓΙΑ ΔΟΚΙΜΕΣ */}
      <div className="fixed top-24 left-4 z-[9999] bg-slate-900/90 backdrop-blur-md border border-sky-400/50 p-3 rounded-2xl shadow-2xl flex flex-col gap-3 text-xs font-black shadow-sky-500/20 flex">
        <span className="text-sky-400 uppercase tracking-widest border-b border-white/10 pb-1">🎨 Design Tester</span>
        <button onClick={() => setDesignTheme('glass')} className={`text-left transition-colors ${designTheme === 'glass' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>1. Glassmorphism (Τωρινό)</button>
        <button onClick={() => setDesignTheme('bento')} className={`text-left transition-colors ${designTheme === 'bento' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>2. Bento Box (Apple)</button>
        <button onClick={() => setDesignTheme('glow')} className={`text-left transition-colors ${designTheme === 'glow' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>3. Animated Glow</button>
        <button onClick={() => setDesignTheme('neumorphism')} className={`text-left transition-colors ${designTheme === 'neumorphism' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>4. 3D Neumorphism</button>
        <button onClick={() => setDesignTheme('spotlight')} className={`text-left transition-colors ${designTheme === 'spotlight' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>5. Spotlight (Αόρατο)</button>
      </div>

      <div className="fixed top-[-15%] left-[-10%] w-[50rem] h-[50rem] bg-sky-500/10 rounded-full mix-blend-screen filter blur-[140px] opacity-70 pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[140px] opacity-60 pointer-events-none z-0"></div>
      
      <header className="bg-[#0B1120]/70 backdrop-blur-2xl p-4 flex justify-between items-center z-50 sticky top-0 border-b border-white/5 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={42} height={42} className="object-contain rounded-[14px] shadow-lg shadow-black/50" />
        </div>
        
        <div className="flex items-center gap-3 md:gap-5">
          <div className="flex gap-1 text-base bg-[#0F172A]/80 p-1.5 rounded-full border border-white/5 shadow-inner">
            <button onClick={() => setLang('da')} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${lang === 'da' ? 'bg-gradient-to-tr from-sky-500 to-blue-500 shadow-md text-white' : 'opacity-50 hover:opacity-100 hover:bg-white/10'}`}>🇩🇰</button>
            <button onClick={() => setLang('en')} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${lang === 'en' ? 'bg-gradient-to-tr from-sky-500 to-blue-500 shadow-md text-white' : 'opacity-50 hover:opacity-100 hover:bg-white/10'}`}>🇬🇧</button>
            <button onClick={() => setLang('el')} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${lang === 'el' ? 'bg-gradient-to-tr from-sky-500 to-blue-500 shadow-md text-white' : 'opacity-50 hover:opacity-100 hover:bg-white/10'}`}>🇬🇷</button>
          </div>
          <button onClick={() => { auth.user ? openProfile() : setCheckoutStep('auth'); setIsCartOpen(true); }} className="w-11 h-11 bg-[#0F172A]/80 rounded-full flex items-center justify-center text-lg text-sky-400 border border-white/5 shadow-inner hover:bg-slate-800 transition-all duration-300 hover:scale-105">👤</button>
          <button onClick={() => setIsCartOpen(true)} className="hidden md:flex relative bg-gradient-to-r from-sky-400 to-blue-500 text-[#0B1120] px-6 py-2.5 rounded-full font-black items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] active:scale-95">
            🛒 <span className="text-white bg-black/20 px-2 py-0.5 rounded-full">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-8 relative z-10">
        
        <div className={`mb-8 p-6 md:p-8 flex flex-col gap-6 ${getCardStyle(designTheme)}`}>
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-400 tracking-tighter">Hellas Aalborg</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-300">
              <span className={`px-3 py-1.5 rounded-full border shadow-sm ${storeOpen ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{storeOpen ? 'Open' : t.closed}</span>
              {!storeOpen && <span className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-white/5 shadow-sm text-gray-300">{t.opensAt}</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-black tracking-wide text-sky-400">
            <a href="https://www.findsmiley.dk/app/1579343" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-sky-500/10 px-4 py-2.5 rounded-xl border border-sky-500/20 hover:bg-sky-500/20 transition-all duration-300"><span className="text-base">🔍</span> {t.smiley}</a>
            <button onClick={() => setIsDetailsModalOpen(true)} className="flex items-center gap-1.5 bg-slate-800/60 px-4 py-2.5 rounded-xl border border-white/10 hover:bg-slate-700/80 transition-all duration-300 hover:text-white shadow-sm"><span className="text-base">ℹ️</span> {t.details}</button>
            {!auth.user && <button onClick={() => { setIsCartOpen(true); setCheckoutStep('auth'); }} className="flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-500/20 text-purple-300 px-4 py-2.5 rounded-xl border border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300 animate-pulse-slow"><span className="text-base">🎁</span> {t.promoBadge}</button>}
          </div>
          
          <button onClick={() => { setIsCartOpen(true); setCheckoutStep('cart'); }} className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white py-4.5 rounded-2xl font-black text-sm uppercase tracking-widest flex justify-center items-center gap-2 transition-all duration-300 active:scale-95 border border-white/5 shadow-xl">🕒 {t.schedule}</button>
        </div>

        <div className="mb-8 sticky top-[72px] md:top-[88px] z-40 bg-[#0B1120]/70 backdrop-blur-2xl py-3 -mx-4 px-4 md:mx-0 md:px-0 border-b border-white/5 transition-all duration-300">
          <div className="relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl text-gray-500 group-focus-within:text-sky-400 transition-colors">🔍</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.search} className="w-full bg-[#0F172A]/80 border border-white/10 text-white rounded-full py-4 pl-14 pr-6 font-bold text-sm outline-none focus:border-sky-400/50 focus:bg-[#0F172A] transition-all duration-300 placeholder:text-gray-500 shadow-inner" />
          </div>
        </div>

        {!searchQuery && !isLoading && (
          <div className="mb-6 flex items-center gap-3 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 md:mx-0 md:px-0">
            <button onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)} className="shrink-0 bg-sky-500/10 text-sky-400 border border-sky-500/20 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-sky-500/20 shadow-sm">📑 Menu <span className={`transition-transform duration-300 ${isCategoryMenuOpen ? 'rotate-180' : ''}`}>▼</span></button>
            {displayCategories.map(cat => (
              <button key={cat} onClick={() => scrollToCategory(cat)} className="shrink-0 text-gray-300 hover:text-white bg-slate-800/60 border border-white/5 px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:bg-slate-700/80 hover:scale-105 shadow-sm">{translateCategory(cat, lang).replace('⭐', '').trim()}</button>
            ))}
          </div>
        )}

        {isCategoryMenuOpen && !searchQuery && (
          <div className={`mb-10 p-3 overflow-hidden ${getCardStyle(designTheme)}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {displayCategories.map(cat => (
                <button key={cat} onClick={() => scrollToCategory(cat)} className="text-left px-6 py-4 hover:bg-sky-500/10 text-gray-300 hover:text-sky-400 font-black text-sm uppercase tracking-wider rounded-2xl transition-all border border-transparent hover:border-sky-500/20">{translateCategory(cat, lang)}</button>
              ))}
            </div>
          </div>
        )}

        <div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center my-24 opacity-60"><div className="w-14 h-14 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-5 shadow-[0_0_15px_rgba(56,189,248,0.5)]"></div><p className="font-black text-sky-400 tracking-widest uppercase text-sm">Loading Menu...</p></div>
          ) : searchQuery ? (
            <div className="flex flex-col gap-5">
              <h3 className="font-black text-xl text-white mb-3 tracking-wide">Search Results</h3>
              {displayedItems.length === 0 ? <p className="text-gray-500 font-medium">No items found.</p> : null}
              {displayedItems.map(item => (
                <div key={item.id} onClick={() => setActiveProduct(item)} className={`group p-4 md:p-5 flex justify-between gap-5 cursor-pointer ${getCardStyle(designTheme)}`}>
                  <div className="flex-1 flex flex-col justify-center py-2">
                    <h3 className="font-black text-lg text-white mb-2 leading-tight pr-2 group-hover:text-sky-400 transition-colors">{item[`title_${lang}`] || item.name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed pr-2 font-medium">{item[`desc_${lang}`] || ''}</p>
                    <span className="font-black text-sky-400 text-base bg-sky-500/10 inline-block px-3 py-1 rounded-lg border border-sky-500/20 self-start">{getItemPrice(item)} DKK</span>
                  </div>
                  <div className="relative w-32 h-32 md:w-36 md:h-36 shrink-0 rounded-[1.5rem] bg-slate-800 shadow-inner overflow-visible">
                    {item.image_path ? <img src={`${supabaseImageUrl}${item.image_path}`} alt="Food" className="w-full h-full object-cover rounded-[1.5rem]" /> : <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">🍽️</div>}
                    <button onClick={(e) => { e.stopPropagation(); setActiveProduct(item); }} className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-tr from-sky-400 to-blue-500 text-white rounded-full flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(56,189,248,0.4)] border-4 border-[#0B1120] active:scale-95 transition-all duration-300 group-hover:scale-110 z-10">+</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {displayCategories.map(cat => {
                const items = getItemsForCategory(cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} id={`category-${cat}`} className="scroll-mt-40">
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-6 flex items-center gap-3 tracking-tighter">{translateCategory(cat, lang)}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {items.map(item => (
                        <div key={item.id} onClick={() => setActiveProduct(item)} className={`group p-4 md:p-5 flex justify-between gap-5 cursor-pointer ${getCardStyle(designTheme)}`}>
                          <div className="flex-1 flex flex-col justify-center py-2">
                            <h3 className="font-black text-lg text-white mb-2 leading-tight pr-2 group-hover:text-sky-400 transition-colors">{item[`title_${lang}`] || item.name}</h3>
                            <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed pr-2 font-medium">{item[`desc_${lang}`] || ''}</p>
                            <span className="font-black text-sky-400 text-base bg-sky-500/10 inline-block px-3 py-1 rounded-lg border border-sky-500/20 self-start">{getItemPrice(item)} DKK</span>
                          </div>
                          <div className="relative w-32 h-32 md:w-36 md:h-36 shrink-0 rounded-[1.5rem] bg-slate-800 shadow-inner overflow-visible">
                            {item.image_path ? <img src={`${supabaseImageUrl}${item.image_path}`} alt="Food" className="w-full h-full object-cover rounded-[1.5rem]" /> : <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">🍽️</div>}
                            <button onClick={(e) => { e.stopPropagation(); setActiveProduct(item); }} className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-tr from-sky-400 to-blue-500 text-white rounded-full flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(56,189,248,0.4)] border-4 border-[#0B1120] active:scale-95 transition-all duration-300 group-hover:scale-110 z-10">+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-40 md:hidden animate-fade-in-up">
          <button onClick={() => setIsCartOpen(true)} className="w-full bg-gradient-to-r from-sky-400 to-blue-500 text-white py-4.5 rounded-3xl font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(56,189,248,0.4)] flex justify-between items-center px-6 transition-all duration-300 active:scale-95 border border-sky-300/30">
            <span className="bg-white/20 backdrop-blur-md text-white w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-inner border border-white/20">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
            <span className="text-sm shadow-black/10 drop-shadow-md">{t.viewOrder}</span>
            <span className="text-sm shadow-black/10 drop-shadow-md">{finalTotal.toFixed(2)} kr.</span>
          </button>
        </div>
      )}

      {isDetailsModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[100] flex justify-center items-center p-4">
          <div className="bg-[#0B1120]/90 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-slate-900/30">
              <h2 className="text-lg font-black text-white uppercase tracking-widest">{t.details}</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-800/80 rounded-full text-gray-400 hover:text-white transition-all hover:bg-slate-700 hover:scale-105 border border-white/5">✕</button>
            </div>
            <div className="p-8 flex flex-col gap-7">
              <div><h3 className="text-[10px] text-sky-400 font-black uppercase tracking-widest mb-1.5">{t.legalName}</h3><p className="text-white font-bold text-base tracking-wide">Nordic-mythos 1 ApS</p></div>
              <div><h3 className="text-[10px] text-sky-400 font-black uppercase tracking-widest mb-1.5">{t.cvr}</h3><p className="text-white font-bold text-base tracking-wide">46414373</p></div>
              <div><h3 className="text-[10px] text-sky-400 font-black uppercase tracking-widest mb-1.5">{t.address}</h3><p className="text-gray-300 font-bold text-sm leading-relaxed tracking-wide">Ved Stranden 21, 9000<br/>Aalborg, Danmark</p><a href="https://maps.app.goo.gl/EQMBBoujJMQBvYLy5" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-black uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all shadow-sm">📍 {t.maps}</a></div>
              <div className="pt-6 border-t border-white/5">
                <h3 className="text-[10px] text-sky-400 font-black uppercase tracking-widest mb-5">{t.hours}</h3>
                <ul className="flex flex-col gap-4">
                  {storeSchedule.map(day => (
                    <li key={day.day_of_week} className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-3 last:border-0"><span className="text-gray-400 font-black uppercase tracking-widest">{translateDay(day.day_name, lang)}</span><span className={day.is_closed ? 'text-red-400 font-black tracking-widest bg-red-500/10 px-3 py-1 rounded-md' : 'text-white font-bold tracking-widest'}>{day.is_closed ? t.closed : `${day.open_time.slice(0,5)} - ${day.close_time.slice(0,5)}`}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeProduct && <ProductModal activeProduct={activeProduct} lang={lang} closeModal={() => setActiveProduct(null)} addToCart={addToCart} supabaseImageUrl={supabaseImageUrl} />}

      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-end">
          <div className="w-full md:max-w-md bg-[#0F172A] h-full flex flex-col shadow-2xl md:border-l border-white/10 animate-fade-in-up md:animate-slide-in-right">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/80 backdrop-blur-md shrink-0">
              <h2 className="text-xl font-black text-white uppercase tracking-widest">{checkoutStep === 'profile' ? ui.profileTitle : ui.cartTitle}</h2>
              {checkoutStep !== 'success' && <button onClick={() => { setIsCartOpen(false); if(checkoutStep === 'review' || checkoutStep === 'profile') setCheckoutStep('cart'); }} className="text-gray-400 hover:text-white text-3xl font-light transition-colors hover:scale-110">&times;</button>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
              {checkoutStep === 'profile' ? (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="text-center mb-4"><div className="w-20 h-20 bg-slate-800 border-2 border-[#38BDF8] rounded-full mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg">👤</div><h3 className="text-xl font-black text-white">{auth.customerName || auth.user?.email}</h3><p className="text-sm text-gray-400 font-bold">{auth.customerPhone}</p></div>
                  <LoyaltyWallet userId={auth.user?.id} subtotal={0} lang={lang} onApplyDiscount={() => {}} settings={storeSettings} />
                  <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-5 shadow-inner">
                    <h4 className="text-xs text-[#38BDF8] font-black uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">{ui.myOrders}</h4>
                    {auth.userOrderHistory.length === 0 ? <p className="text-sm text-gray-400 font-medium">No orders yet.</p> : (
                      <ul className="space-y-4">
                        {auth.userOrderHistory.map(o => (
                          <li key={o.id} className="flex flex-col gap-3 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-black text-white text-sm">#{o.order_number || o.id.toString().slice(-4)}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">{new Date(o.created_at).toLocaleDateString()} - {o.total_price} kr.</p>
                                <p className="text-[11px] text-gray-500 mt-2 leading-snug line-clamp-2">{o.items?.map((i:any) => `${i.quantity}x ${i[`title_${lang}`] || i.title_en || i.title_da || 'Item'}`).join(', ')}</p>
                              </div>
                              <div className="flex flex-col items-end gap-3">
                                <span className={`text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-wider ${o.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/20 text-orange-400 border border-orange-500/20'}`}>{o.status}</span>
                                <button onClick={() => handleRepeatOrder(o)} className="bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors flex items-center gap-1.5 active:scale-95 shadow-sm"><span className="text-sm">🔁</span> {t.repeatOrder}</button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button onClick={() => auth.logout(() => { setIsCartOpen(false); setCheckoutStep('cart'); })} className="w-full bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300 font-black py-4 rounded-xl border border-red-900/30 uppercase tracking-widest transition-colors mt-4">{ui.logout}</button>
                </div>
              ) : checkoutStep === 'review' ? (
                <div className="flex flex-col items-center justify-center py-10 h-full text-center animate-fade-in"><span className="text-7xl mb-6">🙏</span><h2 className="text-2xl md:text-3xl font-black text-white mb-4 uppercase italic tracking-wider">{ui.thankYou}</h2><p className="text-gray-400 font-bold mb-10 px-2 leading-relaxed">{ui.reviewPrompt}</p><a href="https://reviewshellas.dk" target="_blank" rel="noopener noreferrer" className="w-full max-w-xs bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-[#38BDF8]/20 transition-transform active:scale-95 mb-4 block">{ui.leaveReview}</a><button onClick={() => { setCheckoutStep('cart'); setIsCartOpen(false); }} className="w-full max-w-xs bg-slate-800 text-gray-300 font-bold uppercase tracking-widest py-4 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">{ui.close}</button></div>
              ) : checkoutStep === 'success' ? (
                <div className="flex flex-col items-center py-6 w-full">
                  <h2 className="text-xl md:text-2xl font-black text-white mb-8 uppercase tracking-widest italic text-center"># {placedOrder?.order_number || placedOrder?.id?.toString().slice(-4)}</h2>
                  <div className="w-full max-w-xs mb-10 relative">
                    <div className="absolute top-4 left-0 h-1.5 bg-slate-800 w-full -z-10 rounded-full"></div><div className={`absolute top-4 left-0 h-1.5 bg-[#38BDF8] -z-10 transition-all duration-700 ease-out rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)] ${placedOrder?.status === 'pending' ? 'w-[15%]' : placedOrder?.status === 'preparing' ? 'w-[50%]' : 'w-full !bg-emerald-500 !shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}></div>
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center gap-2.5"><div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-colors duration-500 shadow-md ${placedOrder?.status === 'pending' || placedOrder?.status === 'preparing' || placedOrder?.status === 'completed' ? 'bg-[#38BDF8] text-[#0B1120]' : 'bg-slate-800 text-gray-500 border border-white/10'}`}>1</div><span className={`text-[9px] md:text-[10px] font-black uppercase tracking-wide ${placedOrder?.status === 'pending' ? 'text-white' : 'text-gray-500'}`}>{ui.trackPending}</span></div>
                      <div className="flex flex-col items-center gap-2.5"><div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-colors duration-500 shadow-md ${placedOrder?.status === 'preparing' || placedOrder?.status === 'completed' ? 'bg-[#38BDF8] text-[#0B1120]' : 'bg-slate-800 text-gray-500 border border-white/10'}`}>2</div><span className={`text-[9px] md:text-[10px] font-black uppercase tracking-wide ${placedOrder?.status === 'preparing' ? 'text-white' : 'text-gray-500'}`}>{ui.trackPrep}</span></div>
                      <div className="flex flex-col items-center gap-2.5"><div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-colors duration-500 shadow-md ${placedOrder?.status === 'completed' ? 'bg-emerald-500 text-[#0B1120]' : 'bg-slate-800 text-gray-500 border border-white/10'}`}>3</div><span className={`text-[9px] md:text-[10px] font-black uppercase tracking-wide ${placedOrder?.status === 'completed' ? 'text-emerald-400' : 'text-gray-500'}`}>{ui.trackReady}</span></div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-900/60 border border-slate-700 rounded-3xl p-8 mb-8 text-center shadow-xl backdrop-blur-md">
                    {placedOrder?.status === 'pending' && (<div className="animate-fade-in"><div className="w-14 h-14 rounded-full border-4 border-[#38BDF8]/30 border-t-[#38BDF8] animate-spin mx-auto mb-5"></div><h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">{ui.trackPendingTitle}</h3><p className="text-sm text-gray-400 font-medium leading-relaxed">{ui.trackPendingDesc}</p></div>)}
                    {placedOrder?.status === 'preparing' && (<div className="animate-fade-in"><span className="text-7xl mb-5 block animate-bounce-slow">🔥</span><h3 className="text-xl font-black text-white mb-5 uppercase tracking-wide">{ui.trackPrepTitle}</h3><div className="bg-[#38BDF8]/10 border border-[#38BDF8]/30 rounded-2xl p-5 inline-block shadow-inner"><p className="text-[10px] font-black text-[#38BDF8] uppercase tracking-widest mb-1.5">{ui.trackPrepTime}</p><p className="text-5xl font-black text-white tracking-tighter">{placedOrder?.requested_time && placedOrder.requested_time !== 'ASAP' ? placedOrder.requested_time.slice(0, 5) : '...'}</p></div></div>)}
                    {placedOrder?.status === 'completed' && (<div className="animate-fade-in"><span className="text-7xl mb-5 block">✅</span><h3 className="text-xl font-black text-emerald-400 mb-3 uppercase tracking-wide">{ui.trackReadyTitle}</h3><p className="text-sm text-gray-300 font-medium mb-8 leading-relaxed">{ui.trackReadyDesc}</p><button onClick={handleCustomerPickup} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0B1120] font-black text-sm uppercase py-4 rounded-xl shadow-lg active:scale-95 transition-transform tracking-widest">🖐️ {ui.pickedUpBtn}</button></div>)}
                  </div>
                </div>
              ) : checkoutStep === 'auth' ? (
                <div className="flex flex-col gap-6 animate-fade-in py-2">
                  <div className="bg-gradient-to-r from-[#38BDF8]/20 to-purple-500/20 border border-[#38BDF8]/30 rounded-2xl p-5 flex items-center gap-5 shadow-lg mb-2"><div className="w-12 h-12 rounded-full bg-[#38BDF8] flex items-center justify-center text-xl shrink-0 shadow-md">🎁</div><div><h4 className="font-black text-white text-sm uppercase tracking-wide mb-1">{lang === 'da' ? 'Opret konto & få 35 DKK!' : lang === 'en' ? 'Create an account & get 35 DKK!' : 'Φτιάξε λογαριασμό & κέρδισε 35 DKK!'}</h4><p className="text-[11px] text-gray-300 font-medium leading-relaxed">{lang === 'da' ? 'Saml point og spar på dine næste ordrer.' : lang === 'en' ? 'Collect points and save on your next orders.' : 'Μάζεψε πόντους και κέρδισε έκπτωση στις επόμενες παραγγελίες σου.'}</p></div></div>
                  <div className="text-center mb-2"><h3 className="text-2xl font-black text-white uppercase tracking-widest">{ui.guestCheckout}</h3><p className="text-gray-400 text-sm mt-2">{ui.guestDesc}</p></div>
                  <button onClick={() => setCheckoutStep('checkout')} className="w-full bg-white hover:bg-gray-200 text-[#0B1120] font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest transition-transform active:scale-95">🚀 {ui.guestCheckout}</button>
                  <div className="flex items-center gap-4 my-2 opacity-50"><hr className="flex-1 border-slate-600" /><span className="text-xs text-slate-400 font-black uppercase tracking-widest">{ui.or}</span><hr className="flex-1 border-slate-600" /></div>
                  <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 shadow-inner backdrop-blur-sm">
                    <h3 className="text-lg font-black text-white text-center mb-6 uppercase tracking-widest">{auth.authMode === 'signup' ? ui.regTitle : ui.loginTitle}</h3>
                    <form onSubmit={(e) => auth.handleAuth(e, () => setCheckoutStep('checkout'))} className="flex flex-col gap-4">
                      {auth.authError && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm font-bold text-center">{auth.authError}</div>}
                      {auth.authMode === 'signup' && (
                        <div className="flex flex-col gap-4 animate-fade-in"><input type="text" placeholder={ui.nameLabel} value={auth.regName} onChange={e => auth.setRegName(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-[#38BDF8] transition-colors" /><input type="tel" placeholder={ui.phoneLabel} value={auth.regPhone} onChange={e => auth.setRegPhone(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-[#38BDF8] transition-colors" /><div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 block ml-1">{ui.dobPlh}</label><input type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }} placeholder={lang === 'da' ? "dd/mm/åååå" : lang === 'en' ? "dd/mm/yyyy" : "ηη/μμ/εεεε"} value={auth.regDob} onChange={e => auth.setRegDob(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-[#38BDF8] transition-colors" /></div></div>
                      )}
                      <input type="email" placeholder={ui.emailPlh} value={auth.email} onChange={e => auth.setEmail(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-[#38BDF8] transition-colors" /><input type="password" placeholder={ui.passPlh} value={auth.password} onChange={e => auth.setPassword(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-[#38BDF8] transition-colors" />
                      <button type="submit" className="w-full bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/50 font-black py-4 rounded-xl shadow-sm mt-3 uppercase tracking-widest transition-colors">{auth.authMode === 'signup' ? ui.regTitle : ui.loginTitle}</button>
                    </form>
                    <button type="button" onClick={() => { auth.setAuthMode(auth.authMode === 'signup' ? 'login' : 'signup'); auth.setAuthError(''); }} className="w-full text-xs text-gray-400 hover:text-white mt-6 font-bold transition-colors uppercase tracking-widest">{auth.authMode === 'signup' ? ui.hasAcc : ui.noAcc}</button>
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-24 flex flex-col items-center"><span className="text-5xl mb-4 block opacity-50">🛒</span><p className="font-bold text-lg">{ui.emptyCart}</p></div>
              ) : checkoutStep === 'cart' ? (
                <div className="flex flex-col gap-4">
                  <a href="https://wolt.com" target="_blank" rel="noreferrer" className="block text-center bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] text-xs font-black p-3.5 rounded-xl hover:bg-[#38BDF8]/20 transition-colors tracking-widest uppercase">{ui.wolt}</a>
                  {cart.map((cartItem, idx) => (
                    <div key={idx} className="flex flex-col bg-slate-900/50 p-4 rounded-2xl border border-white/5 shadow-inner">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex-1 pr-3"><p className="font-bold text-white text-sm leading-tight mb-1">{cartItem.item[`title_${lang}`] || cartItem.item.name}</p><p className="text-xs font-black text-[#38BDF8]">{getItemPrice(cartItem.item)} DKK</p></div>
                        <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-1.5 border border-white/5 shadow-sm">
                          <button onClick={() => updateQuantity(cartItem.cartId, -1)} className="w-8 h-8 flex items-center justify-center text-white bg-slate-700 hover:bg-slate-600 rounded-lg font-black text-lg transition-colors">-</button>
                          <span className="font-black text-sm w-4 text-center">{cartItem.quantity}</span>
                          <button onClick={() => updateQuantity(cartItem.cartId, 1)} className="w-8 h-8 flex items-center justify-center text-white bg-slate-700 hover:bg-slate-600 rounded-lg font-black text-lg transition-colors">+</button>
                        </div>
                        <div className="flex flex-col gap-2 ml-3">
                          <button onClick={() => removeFromCart(cartItem.cartId)} className="text-red-400 hover:text-red-300 text-lg bg-red-500/10 w-9 h-9 flex items-center justify-center rounded-lg transition-colors border border-red-500/20">✕</button>
                        </div>
                      </div>
                      {cartItem.item.selectedOptions?.length > 0 && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide ml-1 border-t border-white/5 pt-2 mt-1">+ {cartItem.item.selectedOptions.join(', ')}</p>}
                      {cartItem.item.note && <p className="text-[10px] text-yellow-500 font-bold italic ml-1 mt-1.5">📝 {cartItem.item.note}</p>}
                    </div>
                  ))}
                  <div className="mt-4"><SmartUpsell cart={cart} menuItems={menuItems} lang={lang} onAdd={(item) => addToCart(item, 1)} /></div>
                </div>
              ) : (
                <form id="checkoutForm" onSubmit={submitOrder} className="flex flex-col gap-6">
                  <h3 className="font-black text-lg text-white border-b border-white/10 pb-3 uppercase tracking-widest">{ui.detailsTitle}</h3>
                  <LoyaltyWallet userId={auth.user?.id} subtotal={subtotal} lang={lang} onApplyDiscount={setLoyaltyDiscount} settings={storeSettings} />
                  <div><label className="text-[11px] text-gray-500 font-black uppercase tracking-widest block mb-2">{ui.nameLabel}</label><input type="text" value={auth.customerName} onChange={e => auth.setCustomerName(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-[#38BDF8] transition-colors" /></div>
                  <div><label className="text-[11px] text-gray-500 font-black uppercase tracking-widest block mb-2">{ui.phoneLabel}</label><input type="tel" value={auth.customerPhone} onChange={e => auth.setCustomerPhone(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-bold outline-none focus:border-[#38BDF8] transition-colors" /></div>
                  <div><label className="text-[11px] text-gray-500 font-black uppercase tracking-widest block mb-2">{ui.timeLabel}</label><select value={requestedTime} onChange={e => setRequestedTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-[#38BDF8] font-black transition-colors">{generateTimeSlots().map((slot, i) => <option key={i} value={slot.value}>{slot.label}</option>)}</select></div>
                  <div><label className="text-[11px] text-gray-500 font-black uppercase tracking-widest block mb-2">{ui.orderNoteTitle}</label><textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} placeholder={ui.orderNotePlh} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white font-medium outline-none focus:border-[#38BDF8] resize-none transition-colors"></textarea></div>
                  <div className="mt-2"><label className="text-[11px] text-gray-500 font-black uppercase tracking-widest block mb-3">{ui.payLabel}</label><div className="grid grid-cols-2 gap-4"><div onClick={() => setPaymentMethod('card')} className={`cursor-pointer p-4 rounded-xl border-2 text-center transition-colors font-black uppercase tracking-wider flex items-center justify-center gap-2 ${paymentMethod === 'card' ? 'bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8]' : 'bg-slate-800 border-transparent text-gray-400 hover:bg-slate-700'}`}>💳 {ui.card}</div><div onClick={() => setPaymentMethod('cash')} className={`cursor-pointer p-4 rounded-xl border-2 text-center transition-colors font-black uppercase tracking-wider flex items-center justify-center gap-2 ${paymentMethod === 'cash' ? 'bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8]' : 'bg-slate-800 border-transparent text-gray-400 hover:bg-slate-700'}`}>💵 {ui.cash}</div></div></div>
                </form>
              )}
            </div>

            {cart.length > 0 && checkoutStep !== 'success' && checkoutStep !== 'review' && checkoutStep !== 'profile' && (
              <div className="p-6 bg-slate-900/80 backdrop-blur-md border-t border-white/10 shrink-0">
                <div className="flex justify-between items-center mb-1.5"><span className="text-gray-400 font-bold text-sm">{ui.subtotal}</span><span className="text-white font-black">{subtotal} kr.</span></div>
                {loyaltyDiscount > 0 && <div className="flex justify-between items-center mb-1 text-[#38BDF8]"><span className="text-xs font-bold uppercase tracking-wide">{ui.loyaltyDiscount}</span><span className="font-black">-{loyaltyDiscount.toFixed(2)} kr.</span></div>}
                <div className="flex justify-between items-center mt-5 mb-6 border-t border-white/10 pt-5"><span className="text-gray-200 font-black uppercase tracking-widest">{ui.totalPay}</span><span className="text-3xl font-black text-[#38BDF8]">{finalTotal.toFixed(2)} kr.</span></div>
                {!storeOpen && checkoutStep === 'cart' && requestedTime === 'ASAP' ? (
                  <button onClick={() => setCheckoutStep('checkout')} className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-widest py-4 rounded-xl text-center shadow-lg transition-transform active:scale-95">{t.schedule}</button>
                ) : checkoutStep === 'cart' ? (
                  <button onClick={() => auth.user ? setCheckoutStep('checkout') : setCheckoutStep('auth')} className="w-full bg-gradient-to-r from-sky-400 to-blue-500 text-white font-black uppercase tracking-widest py-4.5 rounded-2xl shadow-[0_10px_30px_rgba(56,189,248,0.3)] hover:scale-[1.02] transition-transform active:scale-95">{ui.toCheckout}</button>
                ) : checkoutStep === 'auth' ? (
                  <button type="button" onClick={() => setCheckoutStep('cart')} className="w-full px-6 py-4 rounded-xl bg-slate-800 text-white font-black border border-white/10 uppercase tracking-widest hover:bg-slate-700 transition-colors">{ui.backToCart}</button>
                ) : (
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setCheckoutStep('cart')} className="px-6 py-4 rounded-xl bg-slate-800 text-gray-300 hover:text-white font-black border border-white/10 uppercase tracking-widest hover:bg-slate-700 transition-colors">{ui.back}</button>
                    <button type="submit" form="checkoutForm" disabled={isSubmitting} className="flex-1 bg-emerald-500 hover:bg-emerald-400 transition-transform active:scale-95 text-[#0B1120] font-black py-4 rounded-xl disabled:opacity-50 uppercase tracking-widest shadow-lg shadow-emerald-500/20">{isSubmitting ? ui.sending : ui.confirm}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
