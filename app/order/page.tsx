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

  // --- HOOKS ---
  const { storeOpen, generateTimeSlots } = useStore(ui);
  const auth = useAuth();
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0); 
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, finalTotal, vatMoms, getItemPrice } = useCart(loyaltyDiscount);

  // --- LOCAL STATE ---
  const [storeSettings, setStoreSettings] = useState({ loyalty_max_percentage: 50, loyalty_earn_percentage: 5 });
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

  // --- EFFECTS ---
  useEffect(() => {
    const fetchMenuAndSettings = async () => {
      const [menuRes, settingsRes] = await Promise.all([
        supabase.from('menu_items').select('*').order('sort_order', { ascending: true }),
        supabase.from('store_settings').select('*').eq('id', 1).single()
      ]);
      
      if (menuRes.data) setMenuItems(menuRes.data);
      if (settingsRes.data) setStoreSettings(settingsRes.data);
      setIsLoading(false);
    };
    fetchMenuAndSettings();
    
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
    if (!storeOpen) return alert(ui.closedStore);
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
    if (error) alert("⚠️ Η βάση δεδομένων απέρριψε την ενημέρωση! Ζητήστε από το ταμείο να πατήσει το '✓'.");
    localStorage.removeItem('hellas_active_order'); 
    setPlacedOrder(null); clearCart(); setCheckoutStep('review');
  };

  // --- ΚΑΤΗΓΟΡΙΕΣ ΚΑΙ SCROLLING ---
  const hasRecommended = menuItems.some(p => p.popular);
  const uniqueCategories = [...new Set(menuItems.map(p => p.category))].filter(Boolean);
  const displayCategories = hasRecommended ? ['POPULAR', ...uniqueCategories] : uniqueCategories;

  const getItemsForCategory = (cat: string) => {
    if (cat === 'POPULAR') return menuItems.filter(i => i.popular);
    return menuItems.filter(i => i.category === cat);
  };

  const getCategoryName = (cat: string) => {
    if (cat === 'POPULAR') {
      return lang === 'da' ? '⭐ Populært' : lang === 'en' ? '⭐ Popular' : '⭐ Δημοφιλή';
    }
    return cat;
  };

  const scrollToCategory = (cat: string) => {
    const element = document.getElementById(`category-${cat}`);
    if (element) {
      const yOffset = -130; // Υπολογισμός ύψους για το header και τη μπάρα κατηγοριών ώστε να μη κρύβεται ο τίτλος
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#0B1120] text-gray-200 selection:bg-[#38BDF8] selection:text-[#0B1120] pb-24 bg-[url('/bg.jpg')] bg-cover bg-fixed bg-center relative">
      <div className="absolute inset-0 bg-[#0B1120]/85 -z-10"></div>
      
      {/* HEADER */}
      <header className="bg-[#0F172A] border-b border-white/10 p-4 md:p-6 sticky top-0 z-40 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <a href="/" className="hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="Logo" width={50} height={50} className="object-contain" />
          </a>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white leading-tight">Hellas Aalborg</h1>
            <span className="text-[10px] md:text-xs text-[#38BDF8] uppercase tracking-wider font-bold">Takeaway</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-5">
          <div className="flex gap-1 md:gap-2 text-xl bg-slate-800 p-1 rounded-lg border border-white/10">
            <button onClick={() => setLang('da')} className={`p-1 rounded ${lang === 'da' ? 'bg-white/20 scale-110' : 'opacity-50 hover:opacity-100'}`}>🇩🇰</button>
            <button onClick={() => setLang('en')} className={`p-1 rounded ${lang === 'en' ? 'bg-white/20 scale-110' : 'opacity-50 hover:opacity-100'}`}>🇬🇧</button>
            <button onClick={() => setLang('el')} className={`p-1 rounded ${lang === 'el' ? 'bg-white/20 scale-110' : 'opacity-50 hover:opacity-100'}`}>🇬🇷</button>
          </div>
          
          {auth.user ? (
            <>
              {/* Desktop: Κείμενο με Email */}
              <div className="hidden md:flex flex-col text-right cursor-pointer hover:opacity-80" onClick={openProfile}>
                <span className="text-xs text-gray-400 font-bold border-b border-slate-700 pb-0.5">{auth.user.email}</span>
                <span className="text-[10px] text-[#38BDF8] uppercase tracking-widest mt-0.5">{ui.profileTitle}</span>
              </div>
              {/* Mobile: Εικονίδιο Προφίλ */}
              <button onClick={openProfile} className="md:hidden relative bg-white/10 hover:bg-white/20 w-11 h-11 rounded-full transition-colors border border-white/5 text-xl flex items-center justify-center">
                👤
              </button>
            </>
          ) : (
            <>
              {/* Desktop: Κείμενο Σύνδεσης */}
              <button onClick={() => { setIsCartOpen(true); setCheckoutStep('auth'); }} className="hidden md:block text-sm font-bold text-[#38BDF8] hover:text-white transition-colors">
                {ui.loginTitle}
              </button>
              {/* Mobile: Εικονίδιο Σύνδεσης */}
              <button onClick={() => { setIsCartOpen(true); setCheckoutStep('auth'); }} className="md:hidden relative bg-white/10 hover:bg-white/20 w-11 h-11 rounded-full transition-colors border border-white/5 text-xl flex items-center justify-center">
                👤
              </button>
            </>
          )}
          
          <button onClick={() => setIsCartOpen(true)} className="relative bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors border border-white/5">
            🛒 {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-[#38BDF8] text-[#0B1120] text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-[#0F172A]">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 pt-4">
        
        {/* ΜΠΑΡΑ ΚΑΤΗΓΟΡΙΩΝ (Sticky Navigation) */}
        {!isLoading && (
          <div className="sticky top-[72px] md:top-[88px] z-30 bg-[#0B1120]/95 backdrop-blur-md py-3 -mx-4 px-4 md:mx-0 md:px-0 mb-8 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5 shadow-sm">
            {displayCategories.map(cat => (
              <button 
                key={cat} 
                onClick={() => scrollToCategory(cat)}
                className="shrink-0 px-5 py-2.5 rounded-full bg-slate-800 text-gray-300 font-black text-[10px] md:text-xs uppercase tracking-widest border border-white/5 hover:bg-[#38BDF8]/20 hover:text-[#38BDF8] hover:border-[#38BDF8]/50 transition-colors shadow-sm"
              >
                {getCategoryName(cat)}
              </button>
            ))}
          </div>
        )}

        {isLoading ? <p className="text-center text-[#38BDF8] animate-pulse">Loading...</p> : (
          <div className="flex flex-col gap-10">
            {displayCategories.map(cat => {
              const items = getItemsForCategory(cat);
              if (items.length === 0) return null;
              
              return (
                <div key={cat} id={`category-${cat}`} className="scroll-mt-32">
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
                    {getCategoryName(cat)}
                  </h3>
                  
                  <div className="flex flex-col gap-4">
                    {items.map(item => (
                      <div key={item.id} className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 flex gap-4 hover:border-white/10 transition-colors shadow-sm items-center">
                        {item.image_path ? (
                          <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-white/5">
                            <img src={`${supabaseImageUrl}${item.image_path}`} alt={item[`title_${lang}`] || item.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-20 h-20 shrink-0 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center text-2xl">🍽️</div>
                        )}
                        
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-white mb-1">{item[`title_${lang}`] || item.name}</h3>
                          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mb-2">{item[`desc_${lang}`] || ''}</p>
                          <span className="font-bold text-[#38BDF8]">{getItemPrice(item)} DKK</span>
                        </div>
                        
                        <button onClick={() => setActiveProduct(item)} className="bg-white hover:bg-gray-200 text-[#0B1120] font-bold p-3 md:px-6 md:py-2.5 rounded-xl shadow-md transition-transform active:scale-95 shrink-0 flex items-center gap-2">
                          <span className="hidden md:inline">{ui.add}</span> ➕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODALS ΚΑΙ ΚΑΛΑΘΙ (Χωρίς αλλαγή) */}
      {activeProduct && <ProductModal activeProduct={activeProduct} lang={lang} closeModal={() => setActiveProduct(null)} addToCart={addToCart} supabaseImageUrl={supabaseImageUrl} />}

      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full md:max-w-md bg-[#0F172A] h-full flex flex-col shadow-2xl md:border-l border-white/10 animate-fade-in-up md:animate-slide-in-right">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900 shrink-0">
              <h2 className="text-xl font-bold text-white">{checkoutStep === 'profile' ? ui.profileTitle : ui.cartTitle}</h2>
              {checkoutStep !== 'success' && <button onClick={() => { setIsCartOpen(false); if(checkoutStep === 'review' || checkoutStep === 'profile') setCheckoutStep('cart'); }} className="text-gray-400 hover:text-white text-3xl md:text-2xl font-light">&times;</button>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
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
                  
                  {/* ΜΗΝΥΜΑ ΠΡΟΣΦΟΡΑΣ (LOYALTY) */}
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
                
                {!storeOpen ? (
                  <div className="w-full bg-red-900/50 border border-red-500 text-red-400 font-black uppercase tracking-wider py-4 rounded-xl text-center shadow-lg">{ui.closedStore}</div>
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
