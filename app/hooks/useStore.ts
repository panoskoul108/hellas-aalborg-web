import { useState, useEffect } from 'react';
import { supabase } from '../app/supabase'; // Βεβαιώσου ότι το path για το supabase είναι σωστό βάσει του φακέλου σου

export function useStore(ui: any) {
  const [storeOpen, setStoreOpen] = useState(true);
  const [todayCloseTime, setTodayCloseTime] = useState('22:00');

  // Υπολογισμός των 15λεπτων για παραλαβή
  const generateTimeSlots = () => {
    const slots = [{ value: 'ASAP', label: ui.asap }];
    const now = new Date();
    
    let current = new Date(now.getTime() + 30 * 60000); 
    current.setMinutes(Math.ceil(current.getMinutes() / 15) * 15);
    
    const [closeH, closeM] = todayCloseTime.split(':').map(Number);
    const closeDate = new Date(now);
    closeDate.setHours(closeH, closeM, 0, 0);
    
    // Αν κλείνει μετά τα μεσάνυχτα
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

  // Έλεγχος αν το κατάστημα είναι ανοιχτό
  useEffect(() => {
    const checkStoreStatus = async () => {
      const jsDay = new Date().getDay();
      const dbDay = jsDay === 0 ? 7 : jsDay; 
      
      const { data } = await supabase.from('store_hours').select('*').eq('day_of_week', dbDay).single();
      
      if (data) {
        setTodayCloseTime(data.close_time); 
        
        if (data.is_closed) {
          setStoreOpen(false);
          return;
        }

        const now = new Date();
        const currentTimeMins = now.getHours() * 60 + now.getMinutes();
        
        const [openH, openM] = data.open_time.split(':').map(Number);
        const [closeH, closeM] = data.close_time.split(':').map(Number);
        
        const openMins = openH * 60 + openM;
        let closeMins = closeH * 60 + closeM;
        
        if (closeMins < openMins) closeMins += 24 * 60; 
        
        let currentAdjusted = currentTimeMins;
        if (currentTimeMins < openMins && closeMins > 24 * 60) currentAdjusted += 24 * 60; 

        setStoreOpen(currentAdjusted >= openMins && currentAdjusted <= closeMins);
      }
    };

    checkStoreStatus();
    const interval = setInterval(checkStoreStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return { storeOpen, generateTimeSlots };
}
