'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../supabase';
import ProductModal from './ProductModal';
import CheckoutSidebar from '../../components/order/CheckoutSidebar';
import { dict } from '../utils/dict'; 
import { useCart } from '../hooks/useCart'; 
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import { Icons } from '../../components/Icons'; 

const MAX_ORDERS = 50; 
const LOCKOUT_MS = 5 * 60 * 1000;
const supabaseImageUrl = "https://keolpijcsvwsrzkjqtkc.supabase.co/storage/v1/object/public/menu-images/";

export default function OrderPage() {
  const [lang, setLang] = useState<'da' | 'en' | 'el'>('da');
  const ui = dict[lang];

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

  // UI States
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

  // --- LOCAL DICT ---
  const localUi = {
    da: { search: "Søg i menuen...", closed: "Lukket", opensAt: `Åbner kl. ${nextOpenTimeStr}`, smiley: "Smiley rapport", details: "Restaurant info", schedule: "Planlæg ordre", viewOrder: "Se bestilling", legalName: "Juridisk navn", cvr: "CVR-nummer", address: "Adresse", maps: "Vis på kort", hours: "Åbningstider", promoBadge: "Opret konto & Få 35 kr.", repeatOrder: "Gentag", card: "Kort", cash: "Kontant", pickupConfirm: "Bekræft afhentning", dobPlaceholder: "Fødselsdato (dd/mm/åååå)" },
    en: { search: "Search menu...", closed: "Closed", opensAt: `Opens at ${nextOpenTimeStr}`, smiley: "Smiley report", details: "Restaurant info", schedule: "Schedule order", viewOrder: "View order", legalName: "Legal Name", cvr: "Registered number", address: "Registered address", maps: "View on Maps", hours: "Opening hours", promoBadge: "Sign up & Get 35 kr.", repeatOrder: "Repeat", card: "Card", cash: "Cash", pickupConfirm: "Pickup Confirmation", dobPlaceholder: "Birthdate (dd/mm/yyyy)" },
    el: { search: "Αναζήτηση μενού...", closed: "Κλειστά", opensAt: `Ανοίγει στις ${nextOpenTimeStr}`, smiley: "Αναφορά Smiley", details: "Πληροφορίες", schedule: "Προγραμματισμός", viewOrder: "Καλάθι", legalName: "Νομική Επωνυμία", cvr: "Αριθμός Μητρώου (CVR)", address: "Διεύθυνση", maps: "Προβολή στο Χάρτη", hours: "Ωράριο Λειτουργίας", promoBadge: "35 kr. Δώρο Εγγραφής", repeatOrder: "Επανάληψη", card: "Κάρτα", cash: "Μετρητά", pickupConfirm: "Επιβεβαίωση Παραλαβής", dobPlaceholder: "Ημ. Γέννησης (ηη/μμ/εεεε)" }
  };
  const t = localUi[lang];

  const getLocaleDateString = (dateStr: string, currentLang: string) => {
    const locales: Record<string, string> = { da: 'da-DK', en: 'en-GB', el: 'el-GR' };
    return new Date(dateStr).toLocaleDateString(locales[currentLang] || 'da-DK');
  };

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
    if (cat === 'POPULAR') return currentLang === 'da' ? 'Populært' : currentLang === 'en' ? 'Popular' : 'Δημοφιλή';
    const catDict: Record<string, any> = { 
      'KOMBO TILBUD': { da: 'Kombo tilbud', en: 'Combos', el: 'Προσφορές' }, 
      'GYROS PITA': { da: 'Gyros Pita', en: 'Gyros Pita', el: 'Πίτα με Γύρο' }, 
      'VEGETERIAN PITA': { da: 'Vegeterian Pita', en: 'Vegeterian Pita', el: 'Πίτα Vegeterian' }, 
      'PITA CLUB': { da: 'Pita Club', en: 'Pita Club', el: 'Πίτα Κλάμπ' }, 
      'DOBBELT INDBAGT PITA': { da: 'Dobbelt indbagt pita', en: 'Double baked pita', el: 'Σκεπαστή' }, 
      'PORTIONER': { da: 'Portioner', en: 'Portions', el: 'Μερίδες' }, 
      'Drikkevarer': { da: 'Drikkevarer', en: 'Drinks', el: 'Αναψυκτικά' }, 
      'TILBEHØR': { da: 'TILBEHØR', en: 'Sides', el: 'Συνοδευτικά' }, 
      'DIPS': { da: 'Dips', en: 'Dips', el: 'Έξτρα' } 
    };
    
    // Αφαιρούμε τα κενά από την αρχή και το τέλος και κάνουμε το κείμενο κεφαλαία
    const normalizedCat = cat.toUpperCase().trim();
    
    // Αν υπάρχει στο λεξικό, φέρε τη μετάφραση. Αλλιώς άφησέ το όπως είναι στη βάση!
    return catDict[normalizedCat] && catDict[normalizedCat][currentLang] 
      ? catDict[normalizedCat][currentLang] 
      : cat;
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
  const rawCategories = [...new Set(menuItems.map(p => p.category))].filter(Boolean) as string[];
  
  // --- ΕΔΩ ΟΡΙΖΕΙΣ ΤΗ ΣΕΙΡΑ ΤΩΝ ΚΑΤΗΓΟΡΙΩΝ ΣΟΥ ---
  const desiredOrder = [
    'KOMBO TILBUD',
    'GYROS PITA',
    'VEGETERIAN PITA',
    'PITA CLUB',
    'DOBBELT INDBAGT PITA',
    'PORTIONER',
    'TILBEHØR',
    'DIPS',
    'DRIKKEVARER'
  ];

  // Ταξινομεί τις κατηγορίες με βάση τη λίστα desiredOrder
  const uniqueCategories = rawCategories.sort((a, b) => {
    const idxA = desiredOrder.indexOf(a.toUpperCase().trim());
    const idxB = desiredOrder.indexOf(b.toUpperCase().trim());
    
    // Αν ξεχάσεις να βάλεις μια κατηγορία στη λίστα, θα εμφανιστεί απλά στο τέλος
    if (idxA === -1) return 1; 
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const displayCategories = hasRecommended ? ['POPULAR', ...uniqueCategories] : uniqueCategories;
  const displayedItems = getItemsForDisplay();

  return (
    <div className="min-h-screen font-sans bg-[#0B1120] text-gray-200 selection:bg-[#38BDF8] selection:text-[#0B1120] pb-28 md:pb-12 relative overflow-hidden">
      
      {/* 1. ΣΤΑΘΕΡΟ HEADER */}
      <header className="bg-[#0B1120]/80 backdrop-blur-xl p-4 flex justify-between items-center z-50 sticky top-0 border-b border-white/5 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={38} height={38} className="object-contain" />
        </div>
        
        <div className="flex items-center gap-3 md:gap-5">
          <div className="flex gap-1 text-lg bg-slate-800/50 p-1 rounded-full border border-white/5">
            <button onClick={() => setLang('da')} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${lang === 'da' ? 'bg-[#38BDF8] shadow-md' : 'opacity-50 hover:opacity-100 hover:bg-slate-700/50'}`}>🇩🇰</button>
            <button onClick={() => setLang('en')} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${lang === 'en' ? 'bg-[#38BDF8] shadow-md' : 'opacity-50 hover:opacity-100 hover:bg-slate-700/50'}`}>🇬🇧</button>
            <button onClick={() => setLang('el')} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${lang === 'el' ? 'bg-[#38BDF8] shadow-md' : 'opacity-50 hover:opacity-100 hover:bg-slate-700/50'}`}>🇬🇷</button>
          </div>
          
          <button onClick={() => { auth.user ? openProfile() : setCheckoutStep('auth'); setIsCartOpen(true); }} className="w-10 h-10 bg-slate-800/50 rounded-full flex items-center justify-center text-gray-300 border border-white/5 hover:bg-slate-700 hover:text-white transition-all duration-300">
            <Icons.User />
          </button>
          
          <button onClick={() => setIsCartOpen(true)} className="hidden md:flex bg-[#38BDF8] text-[#0B1120] px-5 py-2.5 rounded-full font-bold items-center gap-2 transition-all duration-300 hover:bg-sky-400 active:scale-95">
            <Icons.Cart /> <span className="text-sm border-l border-[#0B1120]/20 pl-2 ml-1">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-8 relative z-10">
        
        {/* 2. ΠΛΗΡΟΦΟΡΙΕΣ ΚΑΤΑΣΤΗΜΑΤΟΣ */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-white tracking-tight">Hellas Aalborg</h1>
          
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-400 mb-5">
            {storeOpen ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>Open</span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-400 font-bold"><span className="w-2 h-2 rounded-full bg-red-400"></span>{t.closed}</span>
            )}
            {!storeOpen && <span className="text-gray-600">•</span>}
            {!storeOpen && <span>{t.opensAt}</span>}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-300 mb-8">
            <a href="https://www.findsmiley.dk/app/1579343" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-slate-800/50 px-4 py-2 rounded-lg border border-white/5 hover:bg-slate-700 transition-colors">
              <Icons.Check /> {t.smiley}
            </a>
            
            <button onClick={() => setIsDetailsModalOpen(true)} className="flex items-center gap-1.5 bg-slate-800/50 px-4 py-2 rounded-lg border border-white/5 hover:bg-slate-700 transition-colors">
              <Icons.Info /> {t.details}
            </button>
            
            {!auth.user && (
              <button onClick={() => { setIsCartOpen(true); setCheckoutStep('auth'); }} className="flex items-center gap-1.5 bg-[#38BDF8]/10 text-[#38BDF8] px-4 py-2 rounded-lg border border-[#38BDF8]/20 hover:bg-[#38BDF8]/20 transition-colors">
                <Icons.Gift /> {t.promoBadge}
              </button>
            )}
          </div>
          
          <button onClick={() => { setIsCartOpen(true); setCheckoutStep('cart'); }} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wide flex justify-center items-center gap-2 transition-colors border border-white/5">
            <Icons.Clock /> {t.schedule}
          </button>
        </div>

        {/* 3. ΜΠΑΡΑ ΑΝΑΖΗΤΗΣΗΣ */}
        <div className="mb-6 sticky top-[72px] md:top-[88px] z-40 bg-[#0B1120]/90 backdrop-blur-xl py-3 -mx-4 px-4 md:mx-0 md:px-0 border-b border-white/5 transition-all">
          <div className="relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#38BDF8] transition-colors"><Icons.Search /></span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search}
              className="w-full bg-slate-800/50 border border-white/5 text-white rounded-xl py-3.5 pl-14 pr-6 font-medium text-sm outline-none focus:border-[#38BDF8]/50 focus:bg-slate-800 transition-all placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* 4. ΚΑΤΗΓΟΡΙΕΣ */}
        {!searchQuery && !isLoading && (
          <div className="mb-6 flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 md:mx-0 md:px-0">
            {displayCategories.map(cat => {
              const isPopular = cat === 'POPULAR';
              return (
                <button 
                  key={cat} 
                  onClick={() => scrollToCategory(cat)}
                  className={`shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${isPopular ? 'bg-slate-800/80 text-white border border-white/10' : 'bg-transparent text-gray-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                  {translateCategory(cat, lang)}
                </button>
              )
            })}
          </div>
        )}

        {/* 5. ΛΙΣΤΑ ΠΡΟΪΟΝΤΩΝ */}
        <div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center my-24 opacity-60">
              <div className="w-10 h-10 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-bold text-gray-400 text-sm tracking-wide">Loading Menu...</p>
            </div>
          ) : searchQuery ? (
            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-lg text-white mb-2">Search Results</h3>
              {displayedItems.length === 0 ? <p className="text-gray-500 text-sm">No items found.</p> : null}
              {displayedItems.map(item => (
                <div key={item.id} onClick={() => setActiveProduct(item)} className="group bg-slate-800/30 backdrop-blur-md p-4 rounded-2xl flex justify-between gap-4 border border-white/5 cursor-pointer hover:bg-slate-800/50 hover:border-white/10 transition-all">
                  <div className="flex-1 flex flex-col justify-center py-1">
                    <h3 className="font-bold text-base text-white mb-1.5 leading-tight">{item[`title_${lang}`] || item.name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3 leading-relaxed">{item[`desc_${lang}`] || ''}</p>
                    <span className="font-bold text-[#38BDF8] text-[15px]">{getItemPrice(item)} DKK</span>
                  </div>
                  <div className="relative w-28 h-28 shrink-0 rounded-xl bg-slate-800/50">
                    {item.image_path ? (
                      <img src={`${supabaseImageUrl}${item.image_path}`} alt="Food" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600"><Icons.Search /></div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setActiveProduct(item); }} className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#38BDF8] text-[#0B1120] rounded-full flex items-center justify-center shadow-lg border-4 border-[#0F172A] active:scale-95 transition-transform hover:bg-sky-400">
                      <Icons.Plus />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {displayCategories.map(cat => {
                const items = getItemsForCategory(cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} id={`category-${cat}`} className="scroll-mt-40">
                    <h3 className="text-2xl font-bold text-white mb-5 tracking-tight">
                      {translateCategory(cat, lang)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map(item => (
                        <div key={item.id} onClick={() => setActiveProduct(item)} className="group bg-slate-800/30 backdrop-blur-md p-4 rounded-2xl flex justify-between gap-4 border border-white/5 cursor-pointer hover:bg-slate-800/50 hover:border-white/10 transition-all">
                          
                          <div className="flex-1 flex flex-col justify-center py-1">
                            <h3 className="font-bold text-base text-white mb-1.5 leading-tight">{item[`title_${lang}`] || item.name}</h3>
                            <p className="text-sm text-gray-400 line-clamp-2 mb-3 leading-relaxed">{item[`desc_${lang}`] || ''}</p>
                            <span className="font-bold text-[#38BDF8] text-[15px]">{getItemPrice(item)} DKK</span>
                          </div>
                          
                          <div className="relative w-28 h-28 shrink-0 rounded-xl bg-slate-800/50">
                            {item.image_path ? (
                              <img src={`${supabaseImageUrl}${item.image_path}`} alt="Food" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600"><Icons.Search /></div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); setActiveProduct(item); }} className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#38BDF8] text-[#0B1120] rounded-full flex items-center justify-center shadow-lg border-4 border-[#0F172A] active:scale-95 transition-transform hover:bg-sky-400">
                              <Icons.Plus />
                            </button>
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

      {/* 6. FLOATING PILL CART (ΚΙΝΗΤΑ) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-40 md:hidden animate-fade-in-up">
          <button onClick={() => setIsCartOpen(true)} className="w-full bg-[#38BDF8] text-[#0B1120] py-4 rounded-2xl font-bold uppercase tracking-wide shadow-xl flex justify-between items-center px-5 transition-transform active:scale-95">
            <span className="bg-[#0B1120] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
            <span className="text-sm">{t.viewOrder}</span>
            <span className="text-sm">{finalTotal.toFixed(2)} kr.</span>
          </button>
        </div>
      )}

      {/* --- MODAL ΠΛΗΡΟΦΟΡΙΩΝ ΕΣΤΙΑΤΟΡΙΟΥ --- */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-5 border-b border-white/5 bg-slate-800/50">
              <h2 className="text-base font-bold text-white uppercase tracking-wide">{t.details}</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1"><Icons.Close /></button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              
              <div>
                <h3 className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">{t.legalName}</h3>
                <p className="text-white font-medium text-sm">Nordic-mythos 1 ApS</p>
              </div>
              
              <div>
                <h3 className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">{t.cvr}</h3>
                <p className="text-white font-medium text-sm">46414373</p>
              </div>
              
              <div>
                <h3 className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">{t.address}</h3>
                <p className="text-gray-300 font-medium text-sm leading-relaxed">Ved Stranden 21, 9000<br/>Aalborg, Danmark</p>
                <a href="https://maps.app.goo.gl/EQMBBoujJMQBvYLy5" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[#38BDF8] hover:text-sky-400 text-sm font-bold transition-colors">
                  <Icons.Search /> {t.maps}
                </a>
              </div>
              
              <div className="pt-5 border-t border-white/5">
                <h3 className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-4">{t.hours}</h3>
                <ul className="flex flex-col gap-3">
                  {storeSchedule.map(day => (
                    <li key={day.day_of_week} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
                      <span className="text-gray-300 font-medium">{translateDay(day.day_name, lang)}</span>
                      <span className={day.is_closed ? 'text-red-400 font-bold' : 'text-white font-medium'}>
                        {day.is_closed ? t.closed : `${day.open_time.slice(0,5)} - ${day.close_time.slice(0,5)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {activeProduct && <ProductModal activeProduct={activeProduct} lang={lang} closeModal={() => setActiveProduct(null)} addToCart={addToCart} supabaseImageUrl={supabaseImageUrl} />}

      {/* CHECKOUT SIDEBAR ΕΞΩΤΕΡΙΚΟ COMPONENT */}
      <CheckoutSidebar
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        checkoutStep={checkoutStep}
        setCheckoutStep={setCheckoutStep}
        lang={lang}
        ui={ui}
        t={t}
        auth={auth}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        addToCart={addToCart}
        setActiveProduct={setActiveProduct}
        getItemPrice={getItemPrice}
        subtotal={subtotal}
        finalTotal={finalTotal}
        loyaltyDiscount={loyaltyDiscount}
        setLoyaltyDiscount={setLoyaltyDiscount}
        storeSettings={storeSettings}
        storeOpen={storeOpen}
        generateTimeSlots={generateTimeSlots}
        requestedTime={requestedTime}
        setRequestedTime={setRequestedTime}
        orderNote={orderNote}
        setOrderNote={setOrderNote}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        submitOrder={submitOrder}
        isSubmitting={isSubmitting}
        placedOrder={placedOrder}
        handleCustomerPickup={handleCustomerPickup}
        handleRepeatOrder={handleRepeatOrder}
        getLocaleDateString={getLocaleDateString}
        menuItems={menuItems}
      />

    </div>
  );
}
