'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../supabase';

const MAX_ORDERS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const REWARD_THRESHOLD = 40;
const REWARD_DISCOUNT_DKK = 35;

export default function OrderPage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<{item: any, quantity: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lang, setLang] = useState<'da' | 'en' | 'el'>('da');
  
  // Authentication State
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Checkout State
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'auth' | 'checkout' | 'success'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [requestedTime, setRequestedTime] = useState('ASAP');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Loyalty & Anti-spam
  const [loyaltyInfo, setLoyaltyInfo] = useState<any>(null);
  const [redeemReward, setRedeemReward] = useState(false);
  const [ordersPlaced, setOrdersPlaced] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const supabaseImageUrl = "https://keolpijcsvwsrzkjqtkc.supabase.co/storage/v1/object/public/menu-images/";

  // Λεξικό UI
  const dict = {
    da: { menuTitle: "Vælg dine retter", add: "Tilføj", wolt: "Ønsker du levering? Bestil via Wolt 🛵" },
    en: { menuTitle: "Choose your dishes", add: "Add", wolt: "Want delivery? Order via Wolt 🛵" },
    el: { menuTitle: "Επιλέξτε τα πιάτα σας", add: "Προσθήκη", wolt: "Θέλετε Delivery; Παραγγείλτε μέσω Wolt 🛵" }
  };
  const ui = dict[lang];

  useEffect(() => {
    const fetchMenu = async () => {
      const { data } = await supabase.from('menu_items').select('*').order('sort_order', { ascending: true });
      if (data) setMenuItems(data);
      setIsLoading(false);
    };
    fetchMenu();

    // Έλεγχος Σύνδεσης
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    
    // Anti-spam έλεγχος
    const storedOrders = parseInt(localStorage.getItem("servato_orders") || "0");
    const lastTime = parseInt(localStorage.getItem("servato_time") || "0");
    if (Date.now() - lastTime > LOCKOUT_MS) {
      localStorage.setItem("servato_orders", "0");
    } else {
      setOrdersPlaced(storedOrders);
      if (storedOrders >= MAX_ORDERS) setIsLocked(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  // Έλεγχος Loyalty Live
  useEffect(() => {
    const checkLoyalty = async () => {
      if (customerPhone.trim().length >= 8) {
        const cleanPhone = customerPhone.replace(/\s+/g, "");
        const { data } = await supabase.from('customers_loyalty').select('*').eq('phone', cleanPhone).maybeSingle();
        setLoyaltyInfo(data || { phone: cleanPhone, points: 0 });
      } else {
        setLoyaltyInfo(null);
        setRedeemReward(false);
      }
    };
    const timer = setTimeout(checkLoyalty, 500);
    return () => clearTimeout(timer);
  }, [customerPhone]);

  const getTitle = (item: any) => item[`title_${lang}`] || item.title_da;
  const getDesc = (item: any) => item[`desc_${lang}`] || item.desc_da;
  const getItemPrice = (item: any) => Number(item.price_takeaway || item.price || 0);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.item.id === item.id);
      if (existing) return prev.map(cartItem => cartItem.item.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem);
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(cartItem => cartItem.item.id !== id));
  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(cartItem => {
      if (cartItem.item.id === id) {
        const newQ = cartItem.quantity + delta;
        return newQ > 0 ? { ...cartItem, quantity: newQ } : cartItem;
      }
      return cartItem;
    }));
  };

  // Οικονομικοί Υπολογισμοί
  const subtotal = cart.reduce((total, cartItem) => total + (getItemPrice(cartItem.item) * cartItem.quantity), 0);
  const canRedeem = loyaltyInfo && loyaltyInfo.points >= REWARD_THRESHOLD;
  const discount = canRedeem && redeemReward ? REWARD_DISCOUNT_DKK : 0;
  const finalTotal = Math.max(0, subtotal - discount);
  const vatMoms = Number((finalTotal * 0.2).toFixed(2)); // 25% Moms

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCheckoutStep('cart');
  };

  const proceedToCheckout = () => {
    if (user) setCheckoutStep('checkout');
    else setCheckoutStep('auth');
  };

  // Ο ΕΓΚΕΦΑΛΟΣ ΑΠΟΣΤΟΛΗΣ SERVATO (Προσαρμοσμένος για Hellas)
  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return alert("Du har nået grænsen. Vent lidt / Limit reached.");
    if (!customerName || !customerPhone || !user) return alert('Λείπουν στοιχεία.');
    
    setIsSubmitting(true);
    try {
      const cleanPhone = customerPhone.replace(/\s+/g, "");
      const deviceId = crypto.randomUUID();

      const payload = {
        user_id: user.id, // Κρατάμε τη σύνδεση με το λογαριασμό
        order_type: 'takeaway',
        customer_name: customerName,
        customer_phone: cleanPhone,
        requested_time: requestedTime,
        items: cart.map(c => ({
          id: c.item.id,
          title_da: c.item.title_da,
          title_el: c.item.title_el,
          quantity: c.quantity,
          unit_price_dkk: getItemPrice(c.item)
        })),
        subtotal_dkk: subtotal,
        discount_dkk: discount,
        vat_moms_dkk: vatMoms,
        total_price: finalTotal,
        payment_method: paymentMethod ===
