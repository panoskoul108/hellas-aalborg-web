import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useStore(ui: any) {
  const [storeOpen, setStoreOpen] = useState(true);
  const [todayCloseTime, setTodayCloseTime] = useState('22:00');

  const generateTimeSlots = () => {
    const slots = [{ value: 'ASAP', label: ui.asap }];
    const now = new Date();
    
    let current = new Date(now.getTime() + 30 * 60000); 
    current.setMinutes(Math.ceil(current.getMinutes() / 15) * 15);
    
    const [closeH, closeM] = todayCloseTime.split(':').map(Number);
    const closeDate = new Date(now);
    closeDate.setHours(closeH, closeM, 0, 0);
    
    // Night shift λογική για τα Time Slots
    if (closeH < 12 && now.getHours() >= 12) {
      closeDate.setDate(closeDate.getDate() + 1);
    }
    
    while (current <= closeDate) {
      const timeString = current.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
      slots.push({ value: timeString, label: timeString });
      current = new Date(current.getTime() + 15 * 60000);
    }
    return slots;
  };

  useEffect(() => {
    const checkStoreStatus = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      let jsDay = now.getDay();
      
      // NIGHT SHIFT FIX: 
      // Αν η ώρα είναι ανάμεσα στα μεσάνυχτα (00:00) και τις 06:00 το πρωί,
      // πρακτικά ανήκουμε στην "βάρδια" της χθεσινής μέρας.
      if (currentHour >= 0 && currentHour < 6) {
        jsDay = jsDay - 1;
        if (jsDay < 0) jsDay = 6; // Αν χθες ήταν Σάββατο, το JS day πάει 6
      }
      
      // Μετατροπή JS day (0=Κυρ, 1=Δευτ) σε DB day (1=Δευτ, 7=Κυρ)
      const dbDay = jsDay === 0 ? 7 : jsDay; 
      
      const [hoursRes, settingsRes] = await Promise.all([
        supabase.from('store_hours').select('*').eq('day_of_week', dbDay).single(),
        supabase.from('store_settings').select('accepting_orders').eq('id', 1).single()
      ]);
      
      const hoursData = hoursRes.data;
      const settingsData = settingsRes.data;
      
      if (hoursData) {
        setTodayCloseTime(hoursData.close_time); 
        
        let isTimeOpen = false;

        if (!hoursData.is_closed) {
          const currentTimeMins = now.getHours() * 60 + now.getMinutes();
          
          const [openH, openM] = hoursData.open_time.split(':').map(Number);
          const [closeH, closeM] = hoursData.close_time.split(':').map(Number);
          
          const openMins = openH * 60 + openM;
          let closeMins = closeH * 60 + closeM;
          
          // Αν το μαγαζί κλείνει μετά τα μεσάνυχτα (π.χ. 05:00), 
          // προσθέτουμε 24 ώρες στο κλείσιμο για να δουλέψουν σωστά τα μαθηματικά
          if (closeMins < openMins) {
            closeMins += 24 * 60; 
          }
          
          let currentAdjusted = currentTimeMins;
          
          // Αν η τωρινή ώρα είναι περασμένα μεσάνυχτα (π.χ. 01:00) και το μαγαζί
          // άνοιξε χθες (π.χ. 17:00), τότε προσθέτουμε και στο "Τώρα" 24 ώρες 
          // για να δει ότι είναι μέσα στο σωστό εύρος.
          if (currentTimeMins < openMins && closeMins > 24 * 60) {
            currentAdjusted += 24 * 60; 
          }

          isTimeOpen = (currentAdjusted >= openMins && currentAdjusted <= closeMins);
        }

        const isAcceptingOrders = settingsData?.accepting_orders ?? true;
        setStoreOpen(isTimeOpen && isAcceptingOrders);
      }
    };

    checkStoreStatus();
    const interval = setInterval(checkStoreStatus, 15000);

    const channel = supabase.channel('public:store_settings:listener')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'store_settings', filter: 'id=eq.1' }, () => {
        checkStoreStatus(); 
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return { storeOpen, generateTimeSlots };
}
