import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const MAX_ORDERS = 5; // Όριο: 5 παραγγελίες
const LOCKOUT_MS = 5 * 60 * 1000; // Χρόνος: 5 λεπτά (σε milliseconds)

export function useOrderSubmit() {
  const [isLocked, setIsLocked] = useState(false);
  const [ordersPlaced, setOrdersPlaced] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loyaltyInfo, setLoyaltyInfo] = useState(null);

  useEffect(() => {
    const storedOrders = parseInt(localStorage.getItem("servato_orders") || "0");
    const lastTime = parseInt(localStorage.getItem("servato_time") || "0");

    if (Date.now() - lastTime > LOCKOUT_MS) {
      localStorage.setItem("servato_orders", "0");
    } else {
      const REWARD_THRESHOLD = 40;
      setOrdersPlaced(storedOrders);
      if (storedOrders >= MAX_ORDERS) setIsLocked(true);
    }
  }, []);

  // Έλεγχος πόντων Loyalty με βάση το τηλέφωνο του πελάτη
  const checkCustomerLoyalty = async (phone) => {
    if (!phone || phone.trim().length < 6) {
      setLoyaltyInfo(null);
      return null;
    }
    const cleanPhone = phone.replace(/\s+/g, "");
    const { data, error } = await supabase
      .from("customers_loyalty")
      .select("*")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (!error && data) {
      setLoyaltyInfo(data);
      return data;
    } else {
      setLoyaltyInfo({ phone: cleanPhone, points: 0, total_orders: 0 });
      return null;
    }
  };

  const handleNewOrder = async (orderData) => {
    const REWARD_THRESHOLD = 40;

    if (isLocked) {
      alert("Du har nået grænsen for ordrer. Vent venligst et par minutter. / You have reached the order limit.");
      return { error: "Locked" };
    }

    setIsSubmitting(true);

    try {
      // 1. Δημιουργία ή ανάκτηση του μοναδικού ID της συσκευής (Session ID)
      let deviceId = localStorage.getItem("servato_device_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("servato_device_id", deviceId);
      }

      const cleanPhone = (orderData.customer_phone || "").replace(/\s+/g, "");
      const subtotal = Number(orderData.subtotal_dkk || 0);
      const deliveryFee = Number(orderData.delivery_fee_dkk || 0);
      const discount = Number(orderData.discount_dkk || 0);
      const finalTotal = Math.max(0, subtotal + deliveryFee - discount);

      // Στη Δανία οι τιμές καταλόγου περιλαμβάνουν 25% ΦΠΑ (Moms = 20% της τελικής τιμής)
      const vatMoms = Number((finalTotal * 0.2).toFixed(2));

      // 2. Payload για τον πίνακα orders του Hellas Aalborg
      const payload = {
        order_type: orderData.order_type || "takeaway",
        customer_name: orderData.customer_name,
        customer_phone: cleanPhone,
        delivery_address: orderData.order_type === "delivery" ? orderData.delivery_address : null,
        postal_code: orderData.order_type === "delivery" ? orderData.postal_code : null,
        floor_door: orderData.order_type === "delivery" ? orderData.floor_door : null,
        requested_time: orderData.requested_time || "ASAP",
        items: orderData.items,
        subtotal_dkk: subtotal,
        delivery_fee_dkk: deliveryFee,
        discount_dkk: discount,
        vat_moms_dkk: vatMoms,
        total_price: finalTotal,
        payment_method: orderData.payment_method || "card_on_pickup",
        status: "pending",
        notes: orderData.notes || null,
      };

      // 3. Εισαγωγή παραγγελίας στο Supabase
      const { data: insertedOrder, error: orderError } = await supabase
        .from("orders")
        .insert([payload])
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Καταγραφή στο action_logs (για Δανέζικο SAF-T Audit Log)
      await supabase.from("action_logs").insert([
        {
          action_type: "ORDER_CREATED",
          order_id: insertedOrder.id,
          details: { session_id: deviceId, total_dkk: finalTotal, vat_moms_dkk: vatMoms },
        },
      ]);

      // 5. Ενημέρωση Loyalty Πόντων (π.χ. 1 πόντος ανά 10 DKK αγοράς)
      const earnedPoints = Math.floor(finalTotal / 10);
      const existingLoyalty = await checkCustomerLoyalty(cleanPhone);

      if (existingLoyalty && existingLoyalty.id) {
        const currentPoints = existingLoyalty.points || 0;
        const pointsAfterRedeem = orderData.redeemReward
          ? Math.max(0, currentPoints - REWARD_THRESHOLD)
          : currentPoints;

        await supabase
          .from("customers_loyalty")
          .update({
            customer_name: orderData.customer_name,
            points: pointsAfterRedeem + earnedPoints,
            total_orders: (existingLoyalty.total_orders || 0) + 1,
            total_spent_dkk: Number(existingLoyalty.total_spent_dkk || 0) + finalTotal,
            updated_at: new Date().toISOString(),
          })
          .eq("phone", cleanPhone);
      } else {
        await supabase.from("customers_loyalty").insert([
          {
            phone: cleanPhone,
            customer_name: orderData.customer_name,
            points: earnedPoints,
            total_orders: 1,
            total_spent_dkk: finalTotal,
          },
        ]);
      }

      // 6. Ενημέρωση του μετρητή Anti-Spam
      const newTotal = ordersPlaced + 1;
      setOrdersPlaced(newTotal);
      localStorage.setItem("servato_orders", newTotal.toString());
      localStorage.setItem("servato_time", Date.now().toString());

      if (newTotal >= MAX_ORDERS) setIsLocked(true);

      setIsSubmitting(false);
      return { data: insertedOrder, error: null };
    } catch (err) {
      console.error("Order submission error:", err);
      setIsSubmitting(false);
      return { data: null, error: err.message };
    }
  };

  return { isLocked, isSubmitting, loyaltyInfo, checkCustomerLoyalty, handleNewOrder };
}
