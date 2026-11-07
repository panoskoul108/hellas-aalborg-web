import { useState } from 'react';

export function useCart(loyaltyDiscount: number = 0) {
  const [cart, setCart] = useState<{ item: any, quantity: number, cartId: string }[]>([]);

  // Υπολογισμός τιμής πιάτου
  const getItemPrice = (item: any) => Number(item.final_price || item.price_takeaway || item.price || 0);

  // Προσθήκη ή Ενημέρωση στο Καλάθι
  const addToCart = (item: any, quantity: number = 1) => {
    setCart(prev => {
      // Αν υπάρχει ήδη cartId, κάνουμε Update (από το Edit Modal)
      if (item.cartId) {
        return prev.map(cartItem => cartItem.cartId === item.cartId ? { item, quantity, cartId: item.cartId } : cartItem);
      }
      
      // Αλλιώς, νέα προσθήκη
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

  // Καθαρισμός Καλαθιού (π.χ. μετά από επιτυχημένη παραγγελία)
  const clearCart = () => setCart([]);

  // Οικονομικοί Υπολογισμοί
  const subtotal = cart.reduce((total, cartItem) => total + (getItemPrice(cartItem.item) * cartItem.quantity), 0);
  const finalTotal = Math.max(0, subtotal - loyaltyDiscount);
  const vatMoms = Number((finalTotal * 0.2).toFixed(2));

  // Επιστρέφουμε όλα τα "εργαλεία" για να τα χρησιμοποιήσει η σελίδα μας
  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    finalTotal,
    vatMoms,
    getItemPrice
  };
}
