import { supabase } from '../app/supabase';// Βεβαιώσου ότι το path του supabase client είναι σωστό

// Η συνάρτηση γίνεται async γιατί τραβάει δεδομένα από τη βάση
export async function isStoreOpen(): Promise<boolean> {
  // 1. Παίρνουμε την τρέχουσα ώρα στη Δανία
  const nowStr = new Date().toLocaleString("en-US", { timeZone: "Europe/Copenhagen" });
  const denmarkTime = new Date(nowStr);

  const currentDay = denmarkTime.getDay(); // 0 = Κυρ, 1 = Δευ, ..., 6 = Σαβ
  const currentHour = denmarkTime.getHours();
  const currentMinute = denmarkTime.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  try {
    // 2. Ανάγνωση ωραρίου από τη Supabase (το RLS επιτρέπει στους anon να το διαβάσουν)
    const { data: storeHours, error } = await supabase
      .from('store_hours')
      .select('*');

    if (error || !storeHours || storeHours.length === 0) {
      console.error('Σφάλμα ανάγνωσης ωραρίου:', error);
      return false; // Ασφαλής προεπιλογή: κλειστό αν πέσει η βάση
    }

    // --- ΕΙΔΙΚΟΣ ΕΛΕΓΧΟΣ: Μαγαζί που ξενυχτάει (π.χ. κλείνει 05:00 το πρωί) ---
    // Αν είναι 02:00 τα ξημερώματα Σαββάτου, ανήκουμε "λογικά" στη βάρδια της Παρασκευής.
    const previousDay = currentDay === 0 ? 6 : currentDay - 1;
    const prevDayData = storeHours.find((d: any) => Number(d.day_of_week) === previousDay);
    
    if (prevDayData && !prevDayData.is_closed) {
      const [prevOpenH] = prevDayData.open_time.split(':').map(Number);
      const [prevCloseH, prevCloseM] = prevDayData.close_time.split(':').map(Number);
      const prevCloseTotal = prevCloseH * 60 + prevCloseM;
      
      // Αν χθες το μαγαζί έκλεινε μετά τα μεσάνυχτα και η τρέχουσα ώρα είναι μικρότερη από την ώρα κλεισίματος
      if (prevCloseH <= prevOpenH && currentTotalMinutes < prevCloseTotal) {
        return true;
      }
    }

    // --- ΚΑΝΟΝΙΚΟΣ ΕΛΕΓΧΟΣ ΓΙΑ ΤΗ ΣΗΜΕΡΙΝΗ ΜΕΡΑ ---
    const todayData = storeHours.find((d: any) => Number(d.day_of_week) === currentDay);
    
    if (!todayData || todayData.is_closed) {
      return false; // Ρητά κλειστά σήμερα
    }

    const [openH, openM] = todayData.open_time.split(':').map(Number);
    const [closeH, closeM] = todayData.close_time.split(':').map(Number);
    
    const openTotal = openH * 60 + openM;
    const closeTotal = closeH * 60 + closeM;

    if (closeTotal <= openTotal) {
      // Το ωράριο περνάει την αλλαγή της ημέρας (π.χ. 17:00 με 05:00). 
      // Αφού ελέγχουμε το "σήμερα", αρκεί να έχει περάσει η ώρα ανοίγματος.
      return currentTotalMinutes >= openTotal;
    } else {
      // Κανονικό ημερήσιο ωράριο (π.χ. 16:00 με 22:00)
      return currentTotalMinutes >= openTotal && currentTotalMinutes < closeTotal;
    }
  } catch (err) {
    console.error('Σφάλμα λειτουργίας:', err);
    return false;
  }
}
