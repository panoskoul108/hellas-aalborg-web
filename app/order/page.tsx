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

  // --- LOCAL DICT ΓΙΑ ΤΑ ΝΕΑ ΣΤΟΙΧΕΙΑ WOLT STYLE ---
  const localUi = {
    da: { search: "Søg i Hellas Aalborg", closed: "Lukket", opensAt: "Åbner kl. 17:00", smiley: "Smiley info", details: "Restaurant detaljer", schedule: "Planlæg ordre", viewOrder: "Se bestilling", legalName: "Juridisk navn", cvr: "Registreret nummer", address: "Registreret adresse", maps: "Se på kort", hours: "Åbningstider", promoBadge: "Få 35 kr. rabat" },
    en: { search: "Search in Hellas Aalborg", closed: "Closed", opensAt: "Opens at 17:00", smiley: "Smiley info", details: "Restaurant details", schedule: "Schedule order", viewOrder: "View order", legalName: "Legal Name", cvr: "Registered number", address: "Registered address", maps: "View on Maps", hours: "Opening hours", promoBadge: "Get 35 kr. off" },
    el: { search: "Αναζήτηση...", closed: "Κλειστά", opensAt: "Ανοίγει στις 17:00", smiley: "Αναφορά Smiley", details: "Πληροφορίες", schedule: "Προγραμματισμος", viewOrder: "Καλαθι", legalName: "Νομική Επωνυμία", cvr: "Αριθμός Μητρώου (CVR)", address: "Διεύθυνση", maps: "Προβολή στους Χάρτες", hours: "Ωράριο Λειτουργίας", promoBadge: "35 kr. Δώρο Εγγραφής" }
  };
  const t = localUi[lang];

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
      if (hoursRes.data) setStoreSchedule(hoursRes.data);
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
        if (data && data.is_delivered !== true) {
          setPlacedOrder(data); setCheckoutStep('success'); setIsCartOpen(true); 
        } else { localStorage.removeItem('hellas_active_order'); }
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

  // --- HANDLERS ---
  const openProfile = async () => {
    setCheckoutStep('profile'); setIsCartOpen(true);
    auth.fetchOrderHistory();
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeOpen && requestedTime === 'ASAP') return alert(ui.closedStore);
    if (isLocked) return alert("Limit reached.");
    if (!auth.customerName || !auth.customerPhone) return alert('Missing details.');
    
    setIsSubmitting(true);
    try {
      const payload = {
        user_id: auth.user?.id || null, 
        order_type: 'takeaway', customer_name: auth.customerName, customer_phone: auth.customerPhone.replace(/\s+/g, ""), requested_time: requestedTime, notes: orderNote, 
        items: cart.map(c => ({ id: c.item.id, title_da: c.item.title_da, title_el: c.item.title_el, quantity: c.quantity, unit_price_dkk: getItemPrice(c.item), selectedOptions: c.item.selectedOptions || [], note: c.item.note || "" })),
        subtotal_dkk: subtotal, discount_dkk: loyaltyDiscount, vat_moms_dkk: vatMoms, total_price: finalTotal, payment_method: paymentMethod === 'card' ? 'ΚΑΡΤΑ' : 'ΜΕΤΡΗΤΑ', status: 'pending'
      };

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
    localStorage.removeItem('hellas_active_order'); 
    setPlacedOrder(null); clearCart(); setCheckoutStep('review');
  };

  // Μετάφραση Ημερών
  const translateDay = (dayName: string, currentLang: string) => {
    const dict: Record<string, any> = {
      'ΔΕΥΤΕΡΑ': { da: 'Mandag', en: 'Monday', el: 'Δευτέρα' },
      'ΤΡΙΤΗ': { da: 'Tirsdag', en: 'Tuesday', el: 'Τρίτη' },
      'ΤΕΤΑΡΤΗ': { da: 'Onsdag', en: 'Wednesday', el: 'Τετάρτη' },
      'ΠΕΜΠΤΗ': { da: 'Torsdag', en: 'Thursday', el: 'Πέμπτη' },
      'ΠΑΡΑΣΚΕΥΗ': { da: 'Fredag', en: 'Friday', el: 'Παρασκευή' },
      'ΣΑΒΒΑΤΟ': { da: 'Lørdag', en: 'Saturday', el: 'Σάββατο' },
      'ΚΥΡΙΑΚΗ': { da: 'Søndag', en: 'Sunday', el: 'Κυριακή' },
      'MONDAY': { da: 'Mandag', en: 'Monday', el: 'Δευτέρα' },
      'TUESDAY': { da: 'Tirsdag', en: 'Tuesday', el: 'Τρίτη' },
      'WEDNESDAY': { da: 'Onsdag', en: 'Wednesday', el: 'Τετάρτη' },
      'THURSDAY': { da: 'Torsdag', en: 'Thursday', el: 'Πέμπτη' },
      'FRIDAY': { da: 'Fredag', en: 'Friday', el: 'Παρασκευή' },
      'SATURDAY': { da: 'Lørdag', en: 'Saturday', el: 'Σάββατο' },
      'SUNDAY': { da: 'Søndag', en: 'Sunday', el: 'Κυριακή' }
    };
    const key = dayName.toUpperCase().trim();
    return dict[key] ? dict[key][currentLang] : dayName;
  };

  const getItemsForCategory = (cat: string) => {
    if (cat === 'POPULAR') return menuItems.filter(i => i.popular);
    return menuItems.filter(i => i.category === cat);
  };

  const translateCategory = (cat: string, currentLang: string) => {
    if (cat === 'POPULAR') return currentLang === 'da' ? '⭐ Mest bestilte' : currentLang === 'en' ? '⭐ Most ordered' : '⭐ Δημοφιλή';
    const catDict: Record<string, any> = {
      'COMBOS': { da: 'Menuer', en: 'Combos', el: 'Μενού & Προσφορές' },
      'GYROS PITA': { da: 'Gyros', en: 'Gyros', el: 'Γύρος Πίτα' },
      'HALLOUMI PITA': { da: 'Halloumi', en: 'Halloumi', el: 'Χαλούμι' },
      'PITA CLUB': { da: 'Pita Club', en: 'Pita Club', el: 'Σκεπαστή' },
      'PORTIONER': { da: 'Portioner', en: 'Portions', el: 'Μερίδες' },
      'RUM': { da: 'Drikkevarer', en: 'Drinks', el: 'Αναψυκτικά' },
      'DIPS': { da: 'Dips & Ekstra', en: 'Dips & Extras', el: 'Dips & Έξτρα' }
    };
    const normalizedCat = cat.toUpperCase().trim();
    if (catDict[normalizedCat] && catDict[normalizedCat][currentLang]) return catDict[normalizedCat][currentLang];
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  };

  const getItemsForDisplay = () => {
    if (!searchQuery) return menuItems;
    const q = searchQuery.toLowerCase();
    return menuItems.filter(item => 
      (item.title_da && item.title_da.toLowerCase().includes(q)) || 
      (item.title_en && item.title_en.toLowerCase().includes(q)) || 
      (item.title_el && item.title_el.toLowerCase().includes(q)) ||
      (item.desc_da && item.desc_da.toLowerCase().includes(q))
    );
  };

  const scrollToCategory = (cat: string) => {
    const element = document.getElementById(`category-${cat}`);
    if (element) {
      const yOffset = -80; 
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsCategoryMenuOpen(false); 
  };

  const hasRecommended = menuItems.some(p => p.popular);
  const uniqueCategories = [...new Set(menuItems.map(p => p.category))].filter(Boolean);
  const displayCategories = hasRecommended ? ['POPULAR', ...uniqueCategories] : uniqueCategories;
  const displayedItems = getItemsForDisplay();

  return (
    <div className="min-h-screen font-sans bg-[#0F172A] text-gray-200 selection:bg-[#38BDF8] selection:text-[#0B1120] pb-24 md:pb-10 bg-slate-900 relative">
      
      {/* 1. ΣΤΑΘΕΡΟ HEADER */}
      <header className="bg-[#0F172A] p-4 flex justify-between items-center z-50 relative border-b border-white/5 shadow-md">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain rounded-lg" />
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex gap-1 text-lg bg-slate-800 p-1 rounded-full border border-white/10">
            <button onClick={() => setLang('da')} className={`w-8 h-8 flex items-center justify-center rounded-full ${lang === 'da' ? 'bg-white/20' : 'opacity-50'}`}>🇩🇰</button>
            <button onClick={() => setLang('en')} className={`w-8 h-8 flex items-center justify-center rounded-full ${lang === 'en' ? 'bg-white/20' : 'opacity-50'}`}>🇬🇧</button>
            <button onClick={() => setLang('el')} className={`w-8 h-8 flex items-center justify-center rounded-full ${lang === 'el' ? 'bg-white/20' : 'opacity-50'}`}>🇬🇷</button>
          </div>
          
          <button onClick={() => { auth.user ? openProfile() : setCheckoutStep('auth'); setIsCartOpen(true); }} className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-lg text-[#38BDF8] border border-white/10">
            👤
          </button>
          
          <button onClick={() => setIsCartOpen(true)} className="hidden md:flex relative bg-[#38BDF8] text-[#0B1120] px-5 py-2 rounded-full font-black items-center gap-2 transition-transform active:scale-95">
            🛒 <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-6 relative z-10">
        
        {/* 2. ΠΛΗΡΟΦΟΡΙΕΣ ΚΑΤΑΣΤΗΜΑΤΟΣ (ΧΩΡΙΣ ΚΕΝΟ) & SCHEDULE ORDER */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white mb-3">Hellas Aalborg</h1>
          
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-300 mb-4">
            {!storeOpen ? <span className="text-gray-400 font-bold">{t.closed}</span> : <span className="text-emerald-400 font-bold">Open</span>}
            {!storeOpen && <span className="text-gray-600">•</span>}
            {!storeOpen && <span className="text-gray-400">{t.opensAt}</span>}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#38BDF8] mb-6">
            <a href="https://www.findsmiley.dk/app/1579068" target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
              🔍 {t.smiley}
            </a>
            <span className="text-gray-600">•</span>
            <button onClick={() => setIsDetailsModalOpen(true)} className="hover:underline flex items-center gap-1">
              ℹ️ {t.details}
            </button>
            
            {!auth.user && (
              <>
                <span className="text-gray-600">•</span>
                <button onClick={() => { setIsCartOpen(true); setCheckoutStep('auth'); }} className="text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded flex items-center gap-1 font-black hover:bg-purple-500/20 transition-colors border border-purple-500/20">
                  🎁 {t.promoBadge}
                </button>
              </>
            )}
          </div>
          
          <button onClick={() => { setIsCartOpen(true); setCheckoutStep('cart'); }} className="w-full bg-[#38BDF8] text-[#0B1120] py-4 rounded-xl font-black text-sm uppercase flex justify-center items-center gap-2 transition-transform active:scale-95 shadow-md">
            🕒 {t.schedule}
          </button>
        </div>

        {/* 3. ΜΠΑΡΑ ΑΝΑΖΗΤΗΣΗΣ */}
        <div className="mb-6 sticky top-[72px] z-20 bg-[#0F172A] py-2 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-500">🔍</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-full py-3.5 pl-12 pr-4 font-bold text-sm outline-none focus:border-[#38BDF8] transition-colors placeholder:text-gray-500 shadow-inner"
            />
          </div>
        </div>

        {/* 4. ΚΑΤΗΓΟΡΙΕΣ (ΑΝ ΔΕΝ ΥΠΑΡΧΕΙ ΑΝΑΖΗΤΗΣΗ) */}
        {!searchQuery && !isLoading && (
          <div className="mb-2 flex items-center gap-3 overflow-x-auto no-scrollbar pb-4 border-b border-white/5 -mx-4 px-4 md:mx-0 md:px-0">
            <button 
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
              className="shrink-0 bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors"
            >
              📑 Menu ▼
            </button>
            {displayCategories.map(cat => (
              <button 
                key={cat} 
                onClick={() => scrollToCategory(cat)}
                className="shrink-0 text-gray-400 hover:text-white px-3 py-2 font-bold text-sm transition-colors whitespace-nowrap"
              >
                {translateCategory(cat, lang).replace('⭐', '').trim()}
              </button>
            ))}
          </div>
        )}

        {/* DROPDOWN ΚΑΤΗΓΟΡΙΩΝ */}
        {isCategoryMenuOpen && !searchQuery && (
          <div className="mb-6 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 p-2">
              {displayCategories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => scrollToCategory(cat)}
                  className="text-left px-5 py-4 hover:bg-slate-700 text-gray-200 font-black text-sm uppercase rounded-xl transition-colors border border-transparent"
                >
                  {translateCategory(cat, lang)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. ΛΙΣΤΑ ΠΡΟΪΟΝΤΩΝ (WOLT STYLE) */}
        <div>
          {isLoading ? (
            <p className="text-center text-[#38BDF8] animate-pulse my-10">Loading menu...</p>
          ) : searchQuery ? (
            <div className="flex flex-col gap-4">
              <h3 className="font-black text-xl text-white mb-2">Search Results</h3>
              {displayedItems.length === 0 ? <p className="text-gray-500">No items found.</p> : null}
              {displayedItems.map(item => (
                <div key={item.id} onClick={() => setActiveProduct(item)} className="bg-slate-800/50 p-4 md:p-5 rounded-2xl flex justify-between gap-4 border border-white/5 cursor-pointer hover:border-white/10 transition-colors shadow-sm">
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-bold text-base text-white mb-1.5 leading-tight pr-2">{item[`title_${lang}`] || item.name}</h3>
                    <p className="text-[13px] text-gray-400 line-clamp-2 mb-3 leading-snug pr-2">{item[`desc_${lang}`] || ''}</p>
                    <span className="font-bold text-[#38BDF8] text-[15px]">{getItemPrice(item)} DKK</span>
                  </div>
                  <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 rounded-xl bg-slate-700 shadow-inner">
                    {item.image_path ? (
                      <img src={`${supabaseImageUrl}${item.image_path}`} alt="Food" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl opacity-50">🍽️</div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setActiveProduct(item); }} className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#38BDF8] text-[#0B1120] rounded-full flex items-center justify-center font-black text-xl shadow-lg border-[3px] border-[#0F172A] active:scale-95 transition-transform">
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {displayCategories.map(cat => {
                const items = getItemsForCategory(cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} id={`category-${cat}`} className="scroll-mt-32">
                    <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                      {translateCategory(cat, lang)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map(item => (
                        <div key={item.id} onClick={() => setActiveProduct(item)} className="bg-slate-800/50 p-4 rounded-2xl flex justify-between gap-4 border border-white/5 cursor-pointer hover:border-white/10 transition-colors shadow-sm">
                          
                          {/* ΚΕΙΜΕΝΟ ΑΡΙΣΤΕΡΑ */}
                          <div className="flex-1 flex flex-col justify-center">
                            <h3 className="font-bold text-base text-white mb-1.5 leading-tight pr-2">{item[`title_${lang}`] || item.name}</h3>
                            <p className="text-[13px] text-gray-400 line-clamp-2 mb-3 leading-snug pr-2">{item[`desc_${lang}`] || ''}</p>
                            <span className="font-bold text-[#38BDF8] text-[15px]">{getItemPrice(item)} DKK</span>
                          </div>
                          
                          {/* ΕΙΚΟΝΑ ΔΕΞΙΑ ΜΕ ΤΟ + */}
                          <div className="relative w-28 h-28 md:w-32 md:h-32 shrink-0 rounded-xl bg-slate-700 shadow-inner">
                            {item.image_path ? (
                              <img src={`${supabaseImageUrl}${item.image_path}`} alt="Food" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl opacity-50">🍽️</div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); setActiveProduct(item); }} className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#38BDF8] text-[#0B1120] rounded-full flex items-center justify-center font-black text-xl shadow-lg border-[3px] border-slate-800 active:scale-95 transition-transform">
                              +
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

      {/* 6. FLOATING ΚΟΥΜΠΙ ΚΑΛΑΘΙΟΥ ΓΙΑ ΚΙΝΗΤΑ */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0B1120] via-[#0B1120] to-transparent z-40 md:hidden animate-fade-in-up pb-6">
          <button onClick={() => setIsCartOpen(true)} className="w-full bg-[#38BDF8] text-[#0B1120] py-4 rounded-xl font-black uppercase tracking-widest shadow-2xl flex justify-between items-center px-5 transition-transform active:scale-95">
            <span className="bg-[#0B1120] text-[#38BDF8] w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-inner">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
            <span>{t.viewOrder}</span>
            <span>{finalTotal.toFixed(2)} kr.</span>
          </button>
        </div>
      )}

      {/* --- MODAL ΠΛΗΡΟΦΟΡΙΩΝ ΕΣΤΙΑΤΟΡΙΟΥ --- */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="bg-[#0F172A] w-full max-w-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-5 border-b border-white/10 bg-slate-900">
              <h2 className="text-lg font-black text-white uppercase tracking-widest">{t.details}</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full text-gray-400 hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              
              <div>
                <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t.legalName}</h3>
                <p className="text-white font-bold text-sm">Nordic-mythos 1 ApS</p>
              </div>
              
              <div>
                <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t.cvr}</h3>
                <p className="text-white font-bold text-sm">46414373</p>
              </div>
              
              <div>
                <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t.address}</h3>
                <p className="text-white font-bold text-sm">Ved Stranden 21, 9000, Aalborg, Danmark</p>
                <a href="https://maps.app.goo.gl/EQMBBoujJMQBvYLy5" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 border border-[#38BDF8]/50 text-[#38BDF8] text-xs font-black uppercase tracking-widest px-5 py-3 rounded-xl transition-colors">
                  📍 {t.maps}
                </a>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">{t.hours}</h3>
                <ul className="flex flex-col gap-3">
                  {storeSchedule.map(day => (
                    <li key={day.day_of_week} className="flex justify-between items-center text-xs border-b border-slate-800/50 pb-2 last:border-0">
                      <span className="text-gray-300 font-bold uppercase">{translateDay(day.day_name, lang)}</span>
                      <span className={day.is_closed ? 'text-red-400 font-black' : 'text-emerald-400 font-bold'}>
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

      {/* MODALS & CART (ΑΜΕΤΑΒΛΗΤΑ) */}
      {activeProduct && <ProductModal activeProduct={activeProduct} lang={lang} closeModal={() => setActiveProduct(null)} addToCart={addToCart} supabaseImageUrl={supabaseImageUrl} />}

      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full md:max-w-md bg-[#0F172A] h-full flex flex-col shadow-2xl md:border-l border-white/10 animate-fade-in-up md:animate-slide-in-right">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900 shrink-0">
              <h2 className="text-xl font-bold text-white">{checkoutStep === 'profile' ? ui.profileTitle : ui.cartTitle}</h2>
              {checkoutStep !== 'success' && <button onClick={() => { setIsCartOpen(false); if(checkoutStep === 'review' || checkoutStep === 'profile') setCheckoutStep('cart'); }} className="text-gray-400 hover:text-white text-3xl md:text-2xl font-light">&times;</button>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
              {checkoutStep === 'profile' ? (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="text-center mb-4"><div className="w-20 h-20 bg-slate-800 border-2 border-[#38BDF8] rounded-full mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg">👤</div><h3 className="text-xl font-black text-white">{auth.customerName || auth.user?.email}</h3><p className="text-sm text-gray-400 font-bold">{auth.customerPhone}</p></div>
                  <LoyaltyWallet userId={auth.user?.id} subtotal={0} lang={lang} onApplyDiscount={() => {}} settings={storeSettings} />
                  <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-5">
                    <h4 className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">{ui.myOrders}</h4>
                    {auth.userOrderHistory.length === 0 ? <p className="text-sm text-gray-400">No orders yet.</p> : (
                      <ul className="space-y-4">
                        {auth.userOrderHistory.map(o => (
                          <li key={o.id} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
                            <div><p className="font-bold text-white text-sm">#{o.order_number || o.id.toString().slice(-4)}</p><p className="text-[10px] text-gray-400">{new Date(o.created_at).toLocaleDateString()} - {o.total_price} kr.</p></div>
                            <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${o.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>{o.status}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button onClick={() => auth.logout(() => { setIsCartOpen(false); setCheckoutStep('cart'); })} className="w-full bg-red-900/30 text-red-400 hover:bg-red-900/50 font-bold py-3 rounded-xl border border-red-900/50 uppercase transition-colors mt-4">{ui.logout}</button>
                </div>
              ) : checkoutStep === 'review' ? (
                <div className="flex flex-col items-center justify-center py-10 h-full text-center animate-fade-in">
                  <span className="text-7xl mb-6">🙏</span><h2 className="text-2xl md:text-3xl font-black text-white mb-4 uppercase italic tracking-wider">{ui.thankYou}</h2><p className="text-gray-400 font-bold mb-10 px-2 leading-relaxed">{ui.reviewPrompt}</p>
                  <a href="https://reviewshellas.dk" target="_blank" rel="noopener noreferrer" className="w-full max-w-xs bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-[#38BDF8]/20 transition-transform active:scale-95 mb-4 block">{ui.leaveReview}</a>
                  <button onClick={() => { setCheckoutStep('cart'); setIsCartOpen(false); }} className="w-full max-w-xs bg-slate-800 text-gray-300 font-bold uppercase py-4 rounded-2xl border border-slate-700 hover:bg-slate-700 transition-colors">{ui.close}</button>
                </div>
              ) : checkoutStep === 'success' ? (
                <div className="flex flex-col items-center py-6 w-full">
                  <h2 className="text-xl md:text-2xl font-black text-white mb-8 uppercase tracking-widest italic text-center"># {placedOrder?.order_number || placedOrder?.id?.toString().slice(-4)}</h2>
                  <div className="w-full max-w-xs mb-10 relative">
                    <div className="absolute top-4 left-0 h-1 bg-gray-700 w-full -z-10 rounded-full"></div><div className={`absolute top-4 left-0 h-1 bg-[#38BDF8] -z-10 transition-all duration-500 rounded-full ${placedOrder?.status === 'pending' ? 'w-[15%]' : placedOrder?.status === 'preparing' ? 'w-[50%]' : 'w-full !bg-emerald-500'}`}></div>
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center gap-2"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-colors duration-500 ${placedOrder?.status === 'pending' || placedOrder?.status === 'preparing' || placedOrder?.status === 'completed' ? 'bg-[#38BDF8] text-[#0B1120]' : 'bg-gray-800 text-gray-500'}`}>1</div><span className={`text-[9px] md:text-[10px] font-black uppercase ${placedOrder?.status === 'pending' ? 'text-white' : 'text-gray-500'}`}>{ui.trackPending}</span></div>
                      <div className="flex flex-col items-center gap-2"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-colors duration-500 ${placedOrder?.status === 'preparing' || placedOrder?.status === 'completed' ? 'bg-[#38BDF8] text-[#0B1120]' : 'bg-gray-800 text-gray-500'}`}>2</div><span className={`text-[9px] md:text-[10px] font-black uppercase ${placedOrder?.status === 'preparing' ? 'text-white' : 'text-gray-500'}`}>{ui.trackPrep}</span></div>
                      <div className="flex flex-col items-center gap-2"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-colors duration-500 ${placedOrder?.status === 'completed' ? 'bg-emerald-500 text-[#0B1120]' : 'bg-gray-800 text-gray-500'}`}>3</div><span className={`text-[9px] md:text-[10px] font-black uppercase ${placedOrder?.status === 'completed' ? 'text-emerald-400' : 'text-gray-500'}`}>{ui.trackReady}</span></div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800/50 border border-slate-700 rounded-3xl p-6 mb-8 text-center shadow-xl">
                    {placedOrder?.status === 'pending' && (<div className="animate-fade-in"><div className="w-12 h-12 rounded-full border-4 border-[#38BDF8] border-t-transparent animate-spin mx-auto mb-4"></div><h3 className="text-xl font-black text-white mb-2 uppercase">{ui.trackPendingTitle}</h3><p className="text-sm text-gray-400 font-bold">{ui.trackPendingDesc}</p></div>)}
                    {placedOrder?.status === 'preparing' && (<div className="animate-fade-in"><span className="text-6xl mb-4 block">🔥</span><h3 className="text-xl font-black text-white mb-4 uppercase">{ui.trackPrepTitle}</h3><div className="bg-[#38BDF8]/20 border border-[#38BDF8]/50 rounded-2xl p-4 inline-block"><p className="text-[10px] font-black text-[#38BDF8] uppercase tracking-widest mb-1">{ui.trackPrepTime}</p><p className="text-4xl font-black text-white">{placedOrder?.requested_time && placedOrder.requested_time !== 'ASAP' ? placedOrder.requested_time.slice(0, 5) : '...'}</p></div></div>)}
                    {placedOrder?.status === 'completed' && (<div className="animate-fade-in"><span className="text-6xl mb-4 block">✅</span><h3 className="text-xl font-black text-emerald-400 mb-2 uppercase">{ui.trackReadyTitle}</h3><p className="text-sm text-gray-300 font-bold mb-6">{ui.trackReadyDesc}</p><button onClick={handleCustomerPickup} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0B1120] font-black text-sm uppercase py-4 rounded-xl shadow-lg active:scale-95 transition-transform">🖐️ {ui.pickedUpBtn}</button></div>)}
                  </div>
                </div>
              ) : checkoutStep === 'auth' ? (
                <div className="flex flex-col gap-6 animate-fade-in py-2">
                  <div className="bg-gradient-to-r from-[#38BDF8]/20 to-purple-500/20 border border-[#38BDF8]/30 rounded-2xl p-4 flex items-center gap-4 shadow-lg mb-2">
                    <div className="w-12 h-12 rounded-full bg-[#38BDF8] flex items-center justify-center text-xl shrink-0">🎁</div>
                    <div>
                      <h4 className="font-black text-white text-sm uppercase tracking-wide">
                        {lang === 'da' ? 'Opret konto & få 35 DKK!' : lang === 'en' ? 'Create an account & get 35 DKK!' : 'Φτιάξε λογαριασμό & κέρδισε 35 DKK!'}
                      </h4>
                      <p className="text-xs text-gray-300 font-medium">
                        {lang === 'da' ? 'Saml point og spar på dine næste ordrer.' : lang === 'en' ? 'Collect points and save on your next orders.' : 'Μάζεψε πόντους και κέρδισε έκπτωση στις επόμενες παραγγελίες σου.'}
                      </p>
                    </div>
                  </div>
                  <div className="text-center mb-2">
                    <h3 className="text-2xl font-black text-white uppercase tracking-widest">{ui.guestCheckout}</h3>
                    <p className="text-gray-400 text-sm mt-2">{ui.guestDesc}</p>
                  </div>
                  <button onClick={() => setCheckoutStep('checkout')} className="w-full bg-white hover:bg-gray-200 text-[#0B1120] font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest transition-transform active:scale-95">🚀 {ui.guestCheckout}</button>
                  <div className="flex items-center gap-4 my-2 opacity-50">
                    <hr className="flex-1 border-slate-600" />
                    <span className="text-xs text-slate-400 font-bold uppercase">{ui.or}</span>
                    <hr className="flex-1 border-slate-600" />
                  </div>
                  <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 shadow-inner">
                    <h3 className="text-lg font-bold text-white text-center mb-5">{auth.authMode === 'signup' ? ui.regTitle : ui.loginTitle}</h3>
                    <form onSubmit={(e) => auth.handleAuth(e, () => setCheckoutStep('checkout'))} className="flex flex-col gap-4">
                      {auth.authError && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-sm font-bold text-center">{auth.authError}</div>}
                      {auth.authMode === 'signup' && (
                        <div className="flex flex-col gap-4 animate-fade-in">
                          <input type="text" placeholder={ui.nameLabel} value={auth.regName} onChange={e => auth.setRegName(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-[#38BDF8] transition-colors" />
                          <input type="tel" placeholder={ui.phoneLabel} value={auth.regPhone} onChange={e => auth.setRegPhone(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-[#38BDF8] transition-colors" />
                          <div><label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block ml-1">{ui.dobPlh}</label><input type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }} placeholder={lang === 'da' ? "dd/mm/åååå" : lang === 'en' ? "dd/mm/yyyy" : "ηη/μμ/εεεε"} value={auth.regDob} onChange={e => auth.setRegDob(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-[#38BDF8] transition-colors" /></div>
                        </div>
                      )}
                      <input type="email" placeholder={ui.emailPlh} value={auth.email} onChange={e => auth.setEmail(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-[#38BDF8] transition-colors" />
                      <input type="password" placeholder={ui.passPlh} value={auth.password} onChange={e => auth.setPassword(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-[#38BDF8] transition-colors" />
                      <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-[#38BDF8] border border-[#38BDF8]/50 font-black py-4 rounded-xl shadow-lg mt-2 uppercase tracking-widest transition-transform active:scale-95">{auth.authMode === 'signup' ? ui.regTitle : ui.loginTitle}</button>
                    </form>
                    <button type="button" onClick={() => { auth.setAuthMode(auth.authMode === 'signup' ? 'login' : 'signup'); auth.setAuthError(''); }} className="w-full text-sm text-gray-400 hover:text-white mt-5 font-bold transition-colors">{auth.authMode === 'signup' ? ui.hasAcc : ui.noAcc}</button>
                  </div>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-20"><span className="text-4xl mb-3 block">🛒</span><p>{ui.emptyCart}</p></div>
              ) : checkoutStep === 'cart' ? (
                <div className="flex flex-col gap-4">
                  <a href="https://wolt.com" target="_blank" rel="noreferrer" className="block text-center bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] text-xs font-bold p-3 rounded-xl hover:bg-[#38BDF8]/20 transition-colors">{ui.wolt}</a>
                  {cart.map((cartItem, idx) => (
                    <div key={idx} className="flex flex-col bg-slate-800/30 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex-1 pr-2"><p className="font-bold text-white text-sm">{cartItem.item[`title_${lang}`] || cartItem.item.name}</p><p className="text-xs text-[#38BDF8]">{getItemPrice(cartItem.item)} DKK</p></div>
                        <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1 border border-white/5">
                          <button onClick={() => updateQuantity(cartItem.cartId, -1)} className="w-8 h-8 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 rounded-md font-bold text-lg">-</button>
                          <span className="font-bold text-sm w-4 text-center">{cartItem.quantity}</span>
                          <button onClick={() => updateQuantity(cartItem.cartId, 1)} className="w-8 h-8 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 rounded-md font-bold text-lg">+</button>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={() => setActiveProduct({ ...cartItem.item, cartId: cartItem.cartId, quantity: cartItem.quantity })} className="text-[#38BDF8] hover:text-sky-300 text-lg bg-[#38BDF8]/10 w-10 h-10 flex items-center justify-center rounded-lg transition-colors">✏️</button>
                          <button onClick={() => removeFromCart(cartItem.cartId)} className="text-red-400 hover:text-red-300 text-lg bg-red-500/10 w-10 h-10 flex items-center justify-center rounded-lg transition-colors">🗑️</button>
                        </div>
                      </div>
                      {cartItem.item.selectedOptions?.length > 0 && <p className="text-[10px] text-gray-400 font-bold uppercase ml-1">+ {cartItem.item.selectedOptions.join(', ')}</p>}
                      {cartItem.item.note && <p className="text-[10px] text-yellow-500 font-bold italic ml-1 mt-1">📝 {cartItem.item.note}</p>}
                    </div>
                  ))}
                  <SmartUpsell cart={cart} menuItems={menuItems} lang={lang} onAdd={(item) => addToCart(item, 1)} />
                </div>
              ) : (
                <form id="checkoutForm" onSubmit={submitOrder} className="flex flex-col gap-5">
                  <h3 className="font-bold text-lg text-white border-b border-white/10 pb-2">{ui.detailsTitle}</h3>
                  <LoyaltyWallet userId={auth.user?.id} subtotal={subtotal} lang={lang} onApplyDiscount={setLoyaltyDiscount} settings={storeSettings} />
                  <div><label className="text-xs text-gray-400 block mb-1">{ui.nameLabel}</label><input type="text" value={auth.customerName} onChange={e => auth.setCustomerName(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-[#38BDF8]" /></div>
                  <div><label className="text-xs text-gray-400 block mb-1">{ui.phoneLabel}</label><input type="tel" value={auth.customerPhone} onChange={e => auth.setCustomerPhone(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-[#38BDF8]" /></div>
                  
                  <div><label className="text-xs text-gray-400 block mb-1">{ui.timeLabel}</label><select value={requestedTime} onChange={e => setRequestedTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-[#38BDF8] font-bold">{generateTimeSlots().map((slot, i) => <option key={i} value={slot.value}>{slot.label}</option>)}</select></div>
                  
                  <div><label className="text-xs text-gray-400 block mb-1">{ui.orderNoteTitle}</label><textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} placeholder={ui.orderNotePlh} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-[#38BDF8] resize-none"></textarea></div>
                  <div className="mt-2"><label className="text-xs text-gray-400 block mb-2">{ui.payLabel}</label><div className="grid grid-cols-2 gap-3"><div onClick={() => setPaymentMethod('card')} className={`cursor-pointer p-4 rounded-xl border text-center transition-all font-bold ${paymentMethod === 'card' ? 'bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8]' : 'bg-slate-800 border-white/5 text-gray-400'}`}>💳 {ui.card}</div><div onClick={() => setPaymentMethod('cash')} className={`cursor-pointer p-4 rounded-xl border text-center transition-all font-bold ${paymentMethod === 'cash' ? 'bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8]' : 'bg-slate-800 border-white/5 text-gray-400'}`}>💵 {ui.cash}</div></div></div>
                </form>
              )}
            </div>

            {cart.length > 0 && checkoutStep !== 'success' && checkoutStep !== 'review' && checkoutStep !== 'profile' && (
              <div className="p-6 bg-slate-900 border-t border-white/10 shrink-0">
                <div className="flex justify-between items-center mb-1"><span className="text-gray-400">{ui.subtotal}</span><span className="text-white font-bold">{subtotal} kr.</span></div>
                {loyaltyDiscount > 0 && <div className="flex justify-between items-center mb-1 text-[#38BDF8]"><span className="text-xs">{ui.loyaltyDiscount}</span><span className="font-bold">-{loyaltyDiscount.toFixed(2)} kr.</span></div>}
                <div className="flex justify-between items-center mt-4 mb-6 border-t border-white/10 pt-4"><span className="text-gray-200 font-bold">{ui.totalPay}</span><span className="text-2xl font-black text-[#38BDF8]">{finalTotal.toFixed(2)} kr.</span></div>
                
                {!storeOpen && checkoutStep === 'cart' && requestedTime === 'ASAP' ? (
                  <button onClick={() => setCheckoutStep('checkout')} className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-wider py-4 rounded-xl text-center shadow-lg transition-colors">
                    {t.schedule}
                  </button>
                ) : checkoutStep === 'cart' ? (
                  <button onClick={() => auth.user ? setCheckoutStep('checkout') : setCheckoutStep('auth')} className="w-full bg-[#38BDF8] text-slate-900 font-black uppercase tracking-wider py-4 rounded-xl shadow-lg hover:bg-sky-400 transition-colors">{ui.toCheckout}</button>
                ) : checkoutStep === 'auth' ? (
                  <button type="button" onClick={() => setCheckoutStep('cart')} className="w-full px-6 py-4 rounded-xl bg-slate-800 text-white font-bold border border-white/5 uppercase">{ui.backToCart}</button>
                ) : (
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setCheckoutStep('cart')} className="px-6 py-4 rounded-xl bg-slate-800 text-white font-bold border border-white/5 uppercase">{ui.back}</button>
                    <button type="submit" form="checkoutForm" disabled={isSubmitting} className="flex-1 bg-emerald-500 hover:bg-emerald-400 transition-colors text-[#0B1120] font-black py-4 rounded-xl disabled:opacity-50 uppercase tracking-wider">{isSubmitting ? ui.sending : ui.confirm}</button>
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
