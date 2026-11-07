import { useState, useEffect } from 'react';

export function useCart(loyaltyDiscount: number = 0) {
  const [cart, setCart] = useState<{ item: any, quantity: number, cartId: string }[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false); // Για να μην σβήσει το καλάθι στο πρώτο δευτερόλεπτο

  // 1. ΦΟΡΤΩΣΗ: Όταν μπαίνει στη σελίδα, ψάχνει αν υπήρχε παλιό καλάθι
  useEffect(() => {
    const savedCart = localStorage.getItem('hellas_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) {}
    }
    setIsCartLoaded(true);
  }, []);

  // 2. ΑΠΟΘΗΚΕΥΣΗ: Κάθε φορά που αλλάζει το καλάθι, το σώζει (αφού πρώτα έχει φορτώσει)
  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem('hellas_cart', JSON.stringify(cart));
    }
  }, [cart, isCartLoaded]);

  // Υπολογισμός τιμής πιάτου
  const getItemPrice = (item: any) => Number(item.final_price || item.price_takeaway || item.price || 0);

  // Προσθήκη ή Ενημέρωση στο Καλάθι
  const addToCart = (item: any, quantity: number = 1) => {
    setCart(prev => {
      if (item.cartId) {
        return prev.map(cartItem => cartItem.cartId === item.cartId ? { item, quantity, cartId: item.cartId } : cartItem);
      }
      const cartId = item.id + (item.selectedOptions?.join('-') || '') + (item.note || '') + Date.now().toString();
      return [...prev, { item, quantity, cartId }];
    });
  };

  // Αφαίρεση από το Καλάθι
  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(cartItem => cartItem.cartId !== cartId));
  };

  // Αυξομείωση Ποσότητας (+ / -)
  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(cartItem => 
      cartItem.cartId === cartId 
        ? (cartItem.quantity + delta > 0 ? { ...cartItem, quantity: cartItem.quantity + delta } : cartItem) 
        : cartItem
    ));
  };

  // Καθαρισμός Καλαθιού (π.χ. μετά από παραγγελία)
  const clearCart = () => setCart([]);

  // Οικονομικοί Υπολογισμοί
  const subtotal = cart.reduce((total, cartItem) => total + (getItemPrice(cartItem.item) * cartItem.quantity), 0);
  const finalTotal = Math.max(0, subtotal - loyaltyDiscount);
  const vatMoms = Number((finalTotal * 0.2).toFixed(2));

  return {
    cart, addToCart, removeFromCart, updateQuantity, clearCart,
    subtotal, finalTotal, vatMoms, getItemPrice
  };
}
