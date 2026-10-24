'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../supabase';
import ProductModal from './ProductModal';

const MAX_ORDERS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const REWARD_THRESHOLD = 40;
const REWARD_DISCOUNT_DKK = 35;

export default function OrderPage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<{ item: any, quantity: number, cartId: string }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lang, setLang] = useState<'da' | 'en' | 'el'>('da');
  
  const [activeProduct, setActiveProduct] = useState<any>(null);
  
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'auth' | 'checkout' | 'success'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [requestedTime, setRequestedTime] = useState('ASAP');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [loyaltyInfo, setLoyaltyInfo] = useState<any>(null);
  const [redeemReward, setRedeemReward] = useState(false);
  const [ordersPlaced, setOrdersPlaced] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // === LIVE TRACKING STATE ===
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  const supabaseImageUrl = "https://keolpijcsvwsrzkjqtkc.supabase.co/storage/v1/object/public/menu-images/";

  const dict = {
    da: { 
      menuTitle: "Vælg dine retter", add: "Tilføj", wolt: "Ønsker du levering? Bestil via Wolt 🛵",
      cartTitle: "Din Bestilling", emptyCart: "Din kurv er tom.",
      detailsTitle: "Dine oplysninger (Afhentning)", nameLabel: "Fulde Navn", phoneLabel: "Telefonnummer",
      timeLabel: "Afhentningstidspunkt", asap: "Hurtigst muligt",
      payLabel: "Betalingsmetode", card: "Kort", cash: "Kontant",
      subtotal: "Subtotal", loyaltyDiscount: "Loyalty Rabat", vat: "Heraf 25% moms",
      totalPay: "Total at betale", back: "Tilbage", confirm: "Bekræft Bestilling", sending: "Sender...",
      close: "Luk", loginTitle: "Log ind eller Opret", toCheckout: "Gå til Kassen", backToCart: "Tilbage til kurv",
      trackPendingTitle: "Afventer Godkendelse", trackPendingDesc: "Restauranten gennemgår din ordre...",
      trackPrepTitle: "Tilberedes!", trackPrepTime: "Klar klokken:",
      trackReadyTitle: "Klar til afhentning!", trackReadyDesc: "Din ordre venter på dig ved kassen."
    },
    en: { 
      menuTitle: "Choose your dishes", add: "Add", wolt: "Want delivery? Order via Wolt 🛵",
      cartTitle: "Your Order", emptyCart: "Your cart is empty.",
      detailsTitle: "Your Details (Pickup)", nameLabel: "Full Name", phoneLabel: "Phone Number",
      timeLabel: "Pickup Time", asap: "As soon as possible",
      payLabel: "Payment Method", card: "Card", cash: "Cash",
      subtotal: "Subtotal", loyaltyDiscount: "Loyalty Discount", vat: "Includes 25% VAT",
      totalPay: "Total to pay", back: "Back", confirm: "Confirm Order", sending: "Sending...",
      close: "Close", loginTitle: "Login or Register", toCheckout: "Proceed to Checkout", backToCart: "Back to Cart",
      trackPendingTitle: "Awaiting Approval", trackPendingDesc: "The restaurant is reviewing your order...",
      trackPrepTitle: "Preparing!", trackPrepTime: "Will be ready at:",
      trackReadyTitle: "Ready for Pickup!", trackReadyDesc: "Your order is waiting for you at the counter."
    },
    el: { 
      menuTitle: "Επιλέξτε τα πιάτα σας", add: "Προσθήκη", wolt: "Θέλετε Delivery; Παραγγείλτε μέσω Wolt 🛵",
      cartTitle: "Η Παραγγελία σας", emptyCart: "Το καλάθι σας είναι άδειο.",
      detailsTitle: "Τα στοιχεία σας (Takeaway)", nameLabel: "Ονοματεπώνυμο", phoneLabel: "Τηλέφωνο",
      timeLabel: "Ώρα Παραλαβής", asap: "Το συντομότερο δυνατό",
      payLabel: "Τρόπος Πληρωμής", card: "Κάρτα (POS)", cash: "Μετρητά",
      subtotal: "Μερικό Σύνολο", loyaltyDiscount: "Έκπτωση Loyalty", vat: "Περιλαμβάνει 25% ΦΠΑ",
      totalPay: "Σύνολο Πληρωμής", back: "Πίσω", confirm: "Επιβεβαίωση", sending: "Αποστολή...",
      close: "Κλείσιμο", loginTitle: "Σύνδεση ή Εγγραφή", toCheckout: "Ολοκλήρωση Παραγγελίας", backToCart: "Πίσω στο καλάθι",
      trackPendingTitle: "Αναμονη Αποδοχης", trackPendingDesc: "Το κατάστημα εξετάζει την παραγγελία σας...",
      trackPrepTitle: "Ετοιμαζεται!", trackPrepTime: "Θα ειναι ετοιμο στις:",
      trackReadyTitle: "Ετοιμο για Παραλαβη!", trackReadyDesc: "Η παραγγελία σας περιμένει στο ταμείο."
    }
  };
  const ui = dict[lang];

  const generateTimeSlots = () => {
    const slots = [{ value: 'ASAP', label: `${ui.asap} (~15-20 min)` }];
    const now = new Date();
    
    let current = new Date(now.getTime() + 15 * 60000); 
    current.setMinutes(Math.ceil(current.getMinutes() / 15) * 15);
    
    const closeTime = new Date();
    closeTime.setHours(22, 0, 0, 0); 

    while (current <= closeTime) {
      const timeString = current.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
      slots.push({ value: timeString, label: timeString });
      current = new Date(current.getTime() + 15 * 60000);
    }
    return slots;
  };

  useEffect(() => {
    const fetchMenu = async () => {
      const { data } = await supabase.from('menu_items').select('*').order('sort_order', { ascending: true });
      if (data) setMenuItems(data);
      setIsLoading(false);
    };
    fetchMenu();

    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    
    const storedOrders = parseInt(localStorage.getItem("servato_orders") || "0");
    const lastTime = parseInt(localStorage.getItem("servato_time") || "0");
    if (Date.now() - lastTime > LOCKOUT_MS) localStorage.setItem("servato_orders", "0");
    else { setOrdersPlaced(storedOrders); if (storedOrders >= MAX_ORDERS) setIsLocked(true); }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkLoyalty = async () => {
      if (customerPhone.trim().length >= 8) {
        const cleanPhone = customerPhone.replace(/\s+/g, "");
        const { data } = await supabase.from('customers_loyalty').select('*').eq('phone', cleanPhone).maybeSingle();
        setLoyaltyInfo(data || { phone: cleanPhone, points: 0 });
      } else { setLoyaltyInfo(null); setRedeemReward(false); }
    };
    const timer = setTimeout(checkLoyalty, 500);
    return () => clearTimeout(timer);
  }, [customerPhone]);

  // === LIVE TRACKING LISTENER ===
  useEffect(() => {
    if (!placedOrder?.id) return;
    const channel = supabase
      .channel(`public:orders:id=eq.${placedOrder.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${placedOrder.id}` }, (payload) => {
        setPlacedOrder(payload.new); 
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [placedOrder?.id]);

  const getTitle = (item: any) => item[`title_${lang}`] || item.title_da;
  const getDesc = (item: any) => item[`desc_${lang}`] || item.desc_da;
  const getItemPrice = (item: any) => Number(item.final_price || item.price_takeaway || item.price || 0);

  const addToCart = (item: any, quantity: number = 1) => {
    setCart(prev => {
      const cartId = item.id + (item.selectedOptions?.join('-') || '') + (item.note || '');
      const existing = prev.find(cartItem => cartItem.cartId === cartId);
      if (existing) return prev.map(cartItem => cartItem.cartId === cartId ? { ...cartItem, quantity: cartItem.quantity + quantity } : cartItem);
      return [...prev, { item, quantity, cartId }];
    });
  };

  const removeFromCart = (cartId: string) => setCart(prev => prev.filter(cartItem => cartItem.cartId !== cartId));
  
  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(cartItem => {
      if (cartItem.cartId === cartId) {
        const newQ = cartItem.quantity + delta;
        return newQ > 0 ? { ...cartItem, quantity: newQ } : cartItem;
      }
      return cartItem;
    }));
  };

  const subtotal = cart.reduce((total, cartItem) => total + (getItemPrice(cartItem.item) * cartItem.quantity), 0);
  const canRedeem = loyaltyInfo && loyaltyInfo.points >= REWARD_THRESHOLD;
  const discount = canRedeem && redeemReward ? REWARD_DISCOUNT_DKK : 0;
  const finalTotal = Math.max(0, subtotal - discount);
  const vatMoms = Number((finalTotal * 0.2).toFixed(2)); 

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError('Σφάλμα: ' + error.message);
      else { setUser(data.user); setCheckoutStep('checkout'); }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError('Λάθος email ή κωδικός.');
      else { setUser(data.user); setCheckoutStep('checkout'); }
    }
  };

  const proceedToCheckout = () => { user ? setCheckoutStep('checkout') : setCheckoutStep('auth'); };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return alert("Limit reached.");
    if (!customerName || !customerPhone || !user) return alert('Λείπουν στοιχεία.');
    
    setIsSubmitting(true);
    try {
      const cleanPhone = customerPhone.replace(/\s+/g, "");
      const payload = {
        user_id: user.id,
        order_type: 'takeaway',
        customer_name: customerName,
        customer_phone: cleanPhone,
        requested_time: requestedTime,
        items: cart.map(c => ({
          id: c.item.id,
          title_da: c.item.title_da,
          title_el: c.item.title_el,
          quantity: c.quantity,
          unit_price_dkk: getItemPrice(c.item),
          selectedOptions: c.item.selectedOptions || [],
          note: c.item.note || "" 
        })),
        subtotal_dkk: subtotal,
        discount_dkk: discount,
        vat_moms_dkk: vatMoms,
        total_price: finalTotal,
        payment_method: paymentMethod === 'card' ? 'ΚΑΡΤΑ' : 'ΜΕΤΡΗΤΑ',
        status: 'pending'
      };

      const { data: orderData, error: orderError } = await supabase.from('orders').insert([payload]).select().single();
      if (orderError) throw orderError;
      
      setPlacedOrder(orderData); // ΑΠΟΘΗΚΕΥΣΗ ΓΙΑ ΤΟ TRACKER

      await supabase.from('action_logs').insert([{
        action_type: "TAKEAWAY_ORDER_CREATED",
        order_id: orderData.id,
        details: { company: "Nordic-mythos 1 ApS", user: user.email, total_dkk: finalTotal }
      }]);

      const earnedPoints = Math.floor(finalTotal / 10);
      if (loyaltyInfo && loyaltyInfo.id) {
        const currentPoints = loyaltyInfo.points || 0;
        const pntAfter = redeemReward ? Math.max(0, currentPoints - REWARD_THRESHOLD) : currentPoints;
        await supabase.from('customers_loyalty').update({
          points: pntAfter + earnedPoints,
          total_orders: (loyaltyInfo.total_orders || 0) + 1,
          total_spent_dkk: Number(loyaltyInfo.total_spent_dkk || 0) + finalTotal
        }).eq('phone', cleanPhone);
      } else {
        await supabase.from('customers_loyalty').insert([{
          phone: cleanPhone, customer_name: customerName, points: earnedPoints, total_spent_dkk: finalTotal
        }]);
      }

      const newTotal = ordersPlaced + 1;
      setOrdersPlaced(newTotal);
      localStorage.setItem("servato_orders", newTotal.toString());
      localStorage.setItem("servato_time", Date.now().toString());

      setCheckoutStep('success');
      setCart([]);
    } catch (error: any) { alert('Σφάλμα: ' + error.message); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen font-sans bg-[#0B1120] text-gray-200 selection:bg-[#38BDF8] selection:text-[#0B1120] pb-24">
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

          {user ? (
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs text-gray-400">{user.email}</span>
              <button onClick={() => {supabase.auth.signOut(); setUser(null);}} className="text-xs text-red-400 hover:text-red-300 underline">Log ud</button>
            </div>
          ) : (
            <button onClick={() => { setIsCartOpen(true); setCheckoutStep('auth'); }} className="hidden md:block text-sm font-bold text-[#38BDF8] hover:text-white transition-colors">Log ind</button>
          )}
          <button onClick={() => setIsCartOpen(true)} className="relative bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors border border-white/5">
            🛒 {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-[#38BDF8] text-[#0B1120] text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-[#0F172A]">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 pt-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-6">{ui.menuTitle}</h2>
        {isLoading ? <p className="text-center text-[#38BDF8] animate-pulse">Loading...</p> : (
          <div className="flex flex-col gap-4">
            {menuItems.map(item => (
              <div key={item.id} className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 flex gap-4 hover:border-white/10 transition-colors shadow-sm items-center">
                {item.image_path ? (
                  <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-white/5">
                    <img src={`${supabaseImageUrl}${item.image_path}`} alt={getTitle(item)} className="w-full h-full object-cover" />
                  </div>
                ) : <div className="w-20 h-20 shrink-0 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center text-2xl">🍽️</div>}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white mb-1">{getTitle(item)}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mb-2">{getDesc(item)}</p>
                  <span className="font-bold text-[#38BDF8]">{getItemPrice(item)} DKK</span>
                </div>
                <button onClick={() => setActiveProduct(item)} className="bg-white hover:bg-gray-200 text-[#0B1120] font-bold p-3 md:px-6 md:py-2.5 rounded-xl shadow-md transition-transform active:scale-95 shrink-0 flex items-center gap-2">
                  <span className="hidden md:inline">{ui.add}</span> ➕
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {activeProduct && (
        <ProductModal 
          activeProduct={activeProduct} 
          lang={lang} 
          closeModal={() => setActiveProduct(null)} 
          addToCart={addToCart} 
          supabaseImageUrl={supabaseImageUrl}
        />
      )}

      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-[#0F172A] h-full flex flex-col shadow-2xl border-l border-white/10 animate-fade-in-up">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-bold text-white">{ui.cartTitle}</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {checkoutStep === 'success' ? (
                <div className="text-center py-10 flex flex-col items-center">
                  {placedOrder?.status === 'pending' && (
                    <>
                      <div className="w-16 h-16 rounded-full border-4 border-[#38BDF8] border-t-transparent animate-spin mb-6"></div>
                      <h3 className="text-2xl font-black text-white mb-2 uppercase">{ui.trackPendingTitle}</h3>
                      <p className="text-gray-400 font-bold mb-8">{ui.trackPendingDesc}</p>
                    </>
                  )}

                  {placedOrder?.status === 'completed' && (
                    <div className="animate-fade-in-up">
                      <span className="text-6xl mb-4 block">🔥</span>
                      <h3 className="text-2xl font-black text-emerald-400 mb-2 uppercase">{ui.trackPrepTitle}</h3>
                      <div className="bg-[#38BDF8]/20 border border-[#38BDF8]/50 rounded-2xl p-6 mt-6 shadow-xl">
                        <p className="text-sm font-black text-[#38BDF8] uppercase tracking-widest mb-1">{ui.trackPrepTime}</p>
                        <p className="text-5xl font-black text-white">{placedOrder.requested_time}</p>
                      </div>
                      <p className="text-gray-400 font-bold mt-6 text-sm">Προσέλθετε στο ταμείο την παραπάνω ώρα για παραλαβή.</p>
                    </div>
                  )}

                  <button onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); setPlacedOrder(null); setCart([]); }} className="mt-12 bg-white text-[#0B1120] font-black px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors uppercase">
                    {ui.close}
                  </button>
                </div>
              ) : checkoutStep === 'auth' ? (
                <div className="flex flex-col gap-5 py-4">
                  <h3 className="text-2xl font-bold text-white text-center mb-2">{ui.loginTitle}</h3>
                  <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    {authError && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-sm">{authError}</div>}
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-[#38BDF8]" />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-[#38BDF8]" />
                    <button type="submit" className="w-full bg-[#38BDF8] hover:bg-sky-400 text-slate-900 font-bold py-4 rounded-xl shadow-lg mt-2">Submit</button>
                  </form>
                  <button type="button" onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')} className="text-sm text-gray-400 hover:text-white underline text-center">
                    Toggle Login / Register
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-20"><span className="text-4xl mb-3 block">🛒</span><p>{ui.emptyCart}</p></div>
              ) : checkoutStep === 'cart' ? (
                <div className="flex flex-col gap-4">
                  <a href="https://wolt.com" target="_blank" rel="noreferrer" className="block text-center bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] text-xs font-bold p-3 rounded-xl hover:bg-[#38BDF8]/20 transition-colors">
                    {ui.wolt}
                  </a>
                  {cart.map((cartItem, idx) => (
                    <div key={idx} className="flex flex-col bg-slate-800/30 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex-1 pr-2">
                          <p className="font-bold text-white text-sm">{getTitle(cartItem.item)}</p>
                          <p className="text-xs text-[#38BDF8]">{getItemPrice(cartItem.item)} DKK</p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1 border border-white/5">
                          <button onClick={() => updateQuantity(cartItem.cartId, -1)} className="w-7 h-7 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 rounded-md font-bold">-</button>
                          <span className="font-bold text-sm w-4 text-center">{cartItem.quantity}</span>
                          <button onClick={() => updateQuantity(cartItem.cartId, 1)} className="w-7 h-7 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 rounded-md font-bold">+</button>
                        </div>
                        <button onClick={() => removeFromCart(cartItem.cartId)} className="ml-3 text-red-400 hover:text-red-300 text-sm bg-red-500/10 p-2 rounded-lg">🗑️</button>
                      </div>
                      {cartItem.item.selectedOptions && cartItem.item.selectedOptions.length > 0 && (
                        <p className="text-[10px] text-gray-400 font-bold uppercase ml-1">
                          + {cartItem.item.selectedOptions.join(', ')}
                        </p>
                      )}
                      {cartItem.item.note && (
                        <p className="text-[10px] text-yellow-500 font-bold italic ml-1 mt-1">
                          📝 {cartItem.item.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <form id="checkoutForm" onSubmit={submitOrder} className="flex flex-col gap-5">
                  <h3 className="font-bold text-lg text-white border-b border-white/10 pb-2">{ui.detailsTitle}</h3>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">{ui.nameLabel}</label>
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-[#38BDF8]" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">{ui.phoneLabel} (Loyalty)</label>
                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-[#38BDF8]" />
                  </div>

                  {loyaltyInfo && (
                    <div className="bg-emerald-900/30 border border-emerald-500/50 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-[10px] uppercase text-emerald-400 font-bold">Loyalty Points</p>
                        <p className="text-sm font-bold text-white">⭐ {loyaltyInfo.points} / {REWARD_THRESHOLD}</p>
                      </div>
                      {canRedeem && (
                        <button type="button" onClick={() => setRedeemReward(!redeemReward)} className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${redeemReward ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-emerald-400 border border-emerald-500/50'}`}>
                          {redeemReward ? "✓" : "Brug (-35 kr)"}
                        </button>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">{ui.timeLabel}</label>
                    <select value={requestedTime} onChange={e => setRequestedTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-[#38BDF8]">
                      {generateTimeSlots().map((slot, i) => (
                        <option key={i} value={slot.value}>{slot.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-2">
                    <label className="text-xs text-gray-400 block mb-2">{ui.payLabel}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div onClick={() => setPaymentMethod('card')} className={`cursor-pointer p-4 rounded-xl border text-center transition-all ${paymentMethod === 'card' ? 'bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8]' : 'bg-slate-800 border-white/5 text-gray-400'}`}>💳 {ui.card}</div>
                      <div onClick={() => setPaymentMethod('cash')} className={`cursor-pointer p-4 rounded-xl border text-center transition-all ${paymentMethod === 'cash' ? 'bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8]' : 'bg-slate-800 border-white/5 text-gray-400'}`}>💵 {ui.cash}</div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {cart.length > 0 && checkoutStep !== 'success' && (
              <div className="p-6 bg-slate-900 border-t border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400">{ui.subtotal}</span><span className="text-white font-bold">{subtotal} DKK</span>
                </div>
                {discount > 0 && <div className="flex justify-between items-center mb-1 text-emerald-400"><span className="text-xs">{ui.loyaltyDiscount}</span><span className="font-bold">-{discount} DKK</span></div>}
                <div className="flex justify-between items-center mb-1 text-gray-500 text-xs"><span>{ui.vat}</span><span>{vatMoms} DKK</span></div>
                <div className="flex justify-between items-center mt-4 mb-6 border-t border-white/10 pt-4"><span className="text-gray-200 font-bold">{ui.totalPay}</span><span className="text-2xl font-bold text-[#38BDF8]">{finalTotal} DKK</span></div>
                
                {checkoutStep === 'cart' ? (
                  <button onClick={proceedToCheckout} className="w-full bg-[#38BDF8] text-slate-900 font-bold py-4 rounded-xl shadow-lg">{ui.toCheckout}</button>
                ) : checkoutStep === 'auth' ? (
                  <button type="button" onClick={() => setCheckoutStep('cart')} className="w-full px-6 py-4 rounded-xl bg-slate-800 text-white font-bold border border-white/5">{ui.backToCart}</button>
                ) : (
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setCheckoutStep('cart')} className="px-6 py-4 rounded-xl bg-slate-800 text-white font-bold border border-white/5">{ui.back}</button>
                    <button type="submit" form="checkoutForm" disabled={isSubmitting} className="flex-1 bg-green-500 text-white font-bold py-4 rounded-xl disabled:opacity-50">{isSubmitting ? ui.sending : ui.confirm}</button>
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
