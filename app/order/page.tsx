'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../supabase'; // Πρόσεξε τις δύο τελείες '../' επειδή είμαστε σε υποφάκελο

export default function OrderPage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<{item: any, quantity: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Φόρμα Checkout
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' ή 'cash'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabaseImageUrl = "https://keolpijcsvwsrzkjqtkc.supabase.co/storage/v1/object/public/menu-images/";

  useEffect(() => {
    const fetchMenu = async () => {
      const { data } = await supabase.from('menu_items').select('*').order('sort_order', { ascending: true });
      if (data) setMenuItems(data);
      setIsLoading(false);
    };
    fetchMenu();
  }, []);

  // Λειτουργίες Καλαθιού
  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.item.id === item.id);
      if (existing) {
        return prev.map(cartItem => cartItem.item.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(cartItem => cartItem.item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(cartItem => {
      if (cartItem.item.id === id) {
        const newQ = cartItem.quantity + delta;
        return newQ > 0 ? { ...cartItem, quantity: newQ } : cartItem;
      }
      return cartItem;
    }));
  };

  const cartTotal = cart.reduce((total, cartItem) => total + (Number(cartItem.item.price_takeaway) * cartItem.quantity), 0);

  // Αποστολή Παραγγελίας στο Supabase
  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) return alert('Παρακαλώ συμπληρώστε όνομα και τηλέφωνο.');
    
    setIsSubmitting(true);
    try {
      // 1. Δημιουργία της κύριας παραγγελίας
      const { data: orderData, error: orderError } = await supabase.from('orders').insert([{
        customer_name: customerName,
        customer_phone: customerPhone,
        order_type: 'takeaway',
        total_amount: cartTotal,
        status: 'pending'
      }]).select().single();

      if (orderError) throw orderError;

      // 2. Εισαγωγή των ειδών (Order Items)
      const orderItems = cart.map(cartItem => ({
        order_id: orderData.id,
        item_name: cartItem.item.title_da,
        quantity: cartItem.quantity,
        unit_price: cartItem.item.price_takeaway,
        total_price: Number(cartItem.item.price_takeaway) * cartItem.quantity
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Επιτυχία!
      setCheckoutStep('success');
      setCart([]); // Άδειασμα καλαθιού
    } catch (error: any) {
      alert('Υπήρξε πρόβλημα με την παραγγελία σας: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#0B1120] text-gray-200 selection:bg-[#38BDF8] selection:text-[#0B1120] pb-24">
      {/* Header */}
      <header className="bg-[#0F172A] border-b border-white/10 p-6 sticky top-0 z-40 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <a href="/" className="hover:opacity-80 transition-opacity">
             <Image src="/logo.png" alt="Logo" width={50} height={50} className="object-contain" />
          </a>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Hellas Aalborg</h1>
            <span className="text-xs text-[#38BDF8] uppercase tracking-wider font-bold">Takeaway Bestilling</span>
          </div>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors border border-white/5"
        >
          🛒
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#38BDF8] text-[#0B1120] text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-[#0F172A]">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      {/* Menu List */}
      <main className="max-w-4xl mx-auto p-4 md:p-6 pt-10">
        <h2 className="text-3xl font-extrabold text-white mb-8">Vælg dine retter</h2>
        
        {isLoading ? (
          <p className="text-center text-[#38BDF8] animate-pulse">Indlæser menu...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {menuItems.map(item => (
              <div key={item.id} className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 flex gap-4 hover:border-white/10 transition-colors shadow-sm items-center">
                
                {item.image_path ? (
                  <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-white/5">
                    <img src={`${supabaseImageUrl}${item.image_path}`} alt="Food" className="w-full h-full object-cover" />
                  </div>
                ) : (
                   <div className="w-20 h-20 shrink-0 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center text-2xl">🍽️</div>
                )}

                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white mb-1">{item.title_da}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed mb-2">{item.desc_da}</p>
                  <span className="font-bold text-[#38BDF8]">{item.price_takeaway} DKK</span>
                </div>

                <button 
                  onClick={() => addToCart(item)}
                  className="bg-white hover:bg-gray-200 text-[#0B1120] font-bold p-3 md:px-6 md:py-2.5 rounded-xl shadow-md transition-transform active:scale-95 shrink-0 flex items-center gap-2"
                >
                  <span className="hidden md:inline">Tilføj</span> ➕
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Cart Panel (Αναδυόμενο Καλάθι) */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-[#0F172A] h-full flex flex-col shadow-2xl border-l border-white/10 animate-fade-in-up">
            
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900">
              <h2 className="text-xl font-bold text-white">Din Bestilling</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {checkoutStep === 'success' ? (
                <div className="text-center py-20">
                  <span className="text-6xl mb-4 block">✅</span>
                  <h3 className="text-2xl font-bold text-white mb-2">Tak for din bestilling!</h3>
                  <p className="text-gray-400">Din mad vil være klar til afhentning snart.</p>
                  <button onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }} className="mt-8 bg-white text-slate-900 font-bold px-8 py-3 rounded-full hover:bg-gray-200 transition-colors">
                    Luk
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <span className="text-4xl mb-3 block">🛒</span>
                  <p>Din kurv er tom.</p>
                </div>
              ) : checkoutStep === 'cart' ? (
                <div className="flex flex-col gap-4">
                  {cart.map(cartItem => (
                    <div key={cartItem.item.id} className="flex justify-between items-center bg-slate-800/30 p-3 rounded-xl border border-white/5">
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-white text-sm">{cartItem.item.title_da}</p>
                        <p className="text-xs text-[#38BDF8]">{cartItem.item.price_takeaway} DKK</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1 border border-white/5">
                        <button onClick={() => updateQuantity(cartItem.item.id, -1)} className="w-7 h-7 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 rounded-md font-bold">-</button>
                        <span className="font-bold text-sm w-4 text-center">{cartItem.quantity}</span>
                        <button onClick={() => updateQuantity(cartItem.item.id, 1)} className="w-7 h-7 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 rounded-md font-bold">+</button>
                      </div>
                      <button onClick={() => removeFromCart(cartItem.item.id)} className="ml-3 text-red-400 hover:text-red-300 text-sm bg-red-500/10 p-2 rounded-lg">🗑️</button>
                    </div>
                  ))}
                </div>
              ) : (
                /* Checkout Form */
                <form id="checkoutForm" onSubmit={submitOrder} className="flex flex-col gap-5">
                  <h3 className="font-bold text-lg text-white border-b border-white/10 pb-2">Dine oplysninger</h3>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Fulde Navn</label>
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-[#38BDF8]" placeholder="Indtast dit navn" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Telefonnummer</label>
                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-[#38BDF8]" placeholder="+45 12 34 56 78" />
                  </div>
                  
                  <div className="mt-4">
                    <label className="text-xs text-gray-400 block mb-2">Betalingsmetode ved afhentning</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div onClick={() => setPaymentMethod('card')} className={`cursor-pointer p-4 rounded-xl border text-center transition-all ${paymentMethod === 'card' ? 'bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8]' : 'bg-slate-800 border-white/5 text-gray-400'}`}>
                        <span className="block text-2xl mb-1">💳</span> Kort
                      </div>
                      <div onClick={() => setPaymentMethod('cash')} className={`cursor-pointer p-4 rounded-xl border text-center transition-all ${paymentMethod === 'cash' ? 'bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8]' : 'bg-slate-800 border-white/5 text-gray-400'}`}>
                        <span className="block text-2xl mb-1">💵</span> Kontant
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && checkoutStep !== 'success' && (
              <div className="p-6 bg-slate-900 border-t border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-400">Total at betale</span>
                  <span className="text-2xl font-bold text-white">{cartTotal} <span className="text-sm font-normal text-gray-500">DKK</span></span>
                </div>
                
                {checkoutStep === 'cart' ? (
                  <button onClick={() => setCheckoutStep('checkout')} className="w-full bg-[#38BDF8] hover:bg-sky-400 text-slate-900 font-bold py-4 rounded-xl shadow-lg transition-colors text-lg">
                    Gå til Kassen
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setCheckoutStep('cart')} className="px-6 py-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 border border-white/5">
                      Tilbage
                    </button>
                    <button type="submit" form="checkoutForm" disabled={isSubmitting} className="flex-1 bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-xl shadow-lg transition-colors text-lg disabled:opacity-50">
                      {isSubmitting ? 'Sender...' : 'Bekræft Bestilling'}
                    </button>
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
