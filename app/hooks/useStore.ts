import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useStore(ui: any) {
  const [storeOpen, setStoreOpen] = useState(false);
  const [todayOpenTime, setTodayOpenTime] = useState('16:00');
  const [todayCloseTime, setTodayCloseTime] = useState('22:00');
  const [isClosedToday, setIsClosedToday] = useState(false);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);

  const getCopenhagenNow = () => {
    const nowStr = new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' });
    return new Date(nowStr);
  };

  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  const fromMinutes = (totalMins: number) => {
    const normalized = ((totalMins % 1440) + 1440) % 1440;
    const h = Math.floor(normalized / 60).toString().padStart(2, '0');
    const m = (normalized % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // Υπολογίζει το επιτρεπτό εύρος ωρών (ακριβές λεπτό) για προγραμματισμένη παραγγελία
  const getTimeBounds = () => {
    if (isClosedToday || !isAcceptingOrders) {
      return {
        canSchedule: false,
        minTime: '',
        maxTime: '',
        openDisplay: todayOpenTime.slice(0, 5),
        closeDisplay: todayCloseTime.slice(0, 5),
      };
    }

    const now = getCopenhagenNow();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const openMins = toMinutes(todayOpenTime);
    let closeMins = toMinutes(todayCloseTime);
    const isNightShift = closeMins < openMins; // π.χ. 17:00 - 05:00

    if (isNightShift) {
      closeMins += 1440;
    }

    let adjustedCurrent = currentMins;
    if (currentMins < openMins && isNightShift) {
      adjustedCurrent += 1440;
    }

    // Ελάχιστη ώρα: είτε το άνοιγμα + 15', είτε τώρα + 20' (όποιο είναι μεγαλύτερο)
    const earliestOrderMins = Math.max(openMins + 15, adjustedCurrent + 20);

    if (earliestOrderMins > closeMins) {
      return {
        canSchedule: false,
        minTime: '',
        maxTime: '',
        openDisplay: todayOpenTime.slice(0, 5),
        closeDisplay: todayCloseTime.slice(0, 5),
      };
    }

    return {
      canSchedule: true,
      minTime: fromMinutes(earliestOrderMins),
      maxTime: fromMinutes(closeMins),
      openDisplay: fromMinutes(earliestOrderMins),
      closeDisplay: todayCloseTime.slice(0, 5),
    };
  };

  // Ελέγχει αν η ώρα (π.χ. "20:37") που διάλεξε ο πελάτης είναι έγκυρη & εντός ωραρίου
  const isValidScheduledTime = (selectedTime: string) => {
    if (!selectedTime || selectedTime === 'ASAP') return storeOpen;
    if (!/^\d{2}:\d{2}$/.test(selectedTime)) return false;

    const bounds = getTimeBounds();
    if (!bounds.canSchedule) return false;

    const openMins = toMinutes(todayOpenTime);
    let closeMins = toMinutes(todayCloseTime);
    const isNightShift = closeMins < openMins;
    if (isNightShift) closeMins += 1440;

    let selMins = toMinutes(selectedTime);
    if (isNightShift && selMins < openMins) {
      selMins += 1440;
    }

    const now = getCopenhagenNow();
    let adjustedCurrent = now.getHours() * 60 + now.getMinutes();
    if (isNightShift && adjustedCurrent < openMins) {
      adjustedCurrent += 1440;
    }

    const minAllowed = Math.max(openMins + 15, adjustedCurrent + 20);
    return selMins >= minAllowed && selMins <= closeMins;
  };

  // Κρατάμε και το generateTimeSlots για συμβατότητα αν καλείται κάπου αλλού
  const generateTimeSlots = () => {
    const slots = [{ value: 'ASAP', label: ui?.asap || 'ASAP' }];
    const bounds = getTimeBounds();
    if (bounds.canSchedule && bounds.minTime) {
      slots.push({ value: bounds.minTime, label: bounds.minTime });
    }
    return slots;
  };

  useEffect(() => {
    let isMounted = true;

    const checkStoreStatus = async () => {
      try {
        const now = getCopenhagenNow();
        const currentHour = now.getHours();
        let jsDay = now.getDay();

        // Night shift: 00:00 - 05:59 ανήκει στη βάρδια της προηγούμενης ημέρας
        if (currentHour >= 0 && currentHour < 6) {
          jsDay = jsDay - 1;
          if (jsDay < 0) jsDay = 6;
        }

        const dbDay = jsDay === 0 ? 7 : jsDay;

        const [hoursRes, settingsRes] = await Promise.all([
          supabase.from('store_hours').select('*').eq('day_of_week', dbDay).single(),
          supabase.from('store_settings').select('accepting_orders').eq('id', 1).single()
        ]);

        if (!isMounted) return;

        const hoursData = hoursRes.data;
        const settingsData = settingsRes.data;
        const accepting = settingsData?.accepting_orders ?? true;
        setIsAcceptingOrders(accepting);

        if (hoursData) {
          setTodayOpenTime(hoursData.open_time);
          setTodayCloseTime(hoursData.close_time);
          setIsClosedToday(Boolean(hoursData.is_closed));

          let isTimeOpen = false;

          if (!hoursData.is_closed) {
            const currentTimeMins = now.getHours() * 60 + now.getMinutes();
            const openMins = toMinutes(hoursData.open_time);
            let closeMins = toMinutes(hoursData.close_time);

            if (closeMins < openMins) {
              closeMins += 24 * 60;
            }

            let currentAdjusted = currentTimeMins;
            if (currentTimeMins < openMins && closeMins > 24 * 60) {
              currentAdjusted += 24 * 60;
            }

            isTimeOpen = currentAdjusted >= openMins && currentAdjusted <= closeMins;
          }

          setStoreOpen(isTimeOpen && accepting);
        }
      } catch (error) {
        console.error('Σφάλμα κατά τον έλεγχο ωραρίου:', error);
        if (isMounted) setStoreOpen(false);
      }
    };

    checkStoreStatus();
    const interval = setInterval(checkStoreStatus, 15000);

    const channel = supabase
      .channel('public:store_settings:listener')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'store_settings', filter: 'id=eq.1' }, () => {
        checkStoreStatus();
      })
      .subscribe();

    return () => {
      isMounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    storeOpen,
    generateTimeSlots,
    getTimeBounds,
    isValidScheduledTime,
  };
}
