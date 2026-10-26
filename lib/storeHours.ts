export function isStoreOpen(): boolean {
  // Παίρνουμε την τρέχουσα ώρα στη Δανία
  const nowStr = new Date().toLocaleString("en-US", { timeZone: "Europe/Copenhagen" });
  const denmarkTime = new Date(nowStr);

  const currentDay = denmarkTime.getDay(); // 0 = Κυριακή, 1 = Δευτέρα, ..., 6 = Σάββατο
  const currentHour = denmarkTime.getHours();
  const currentMinute = denmarkTime.getMinutes();

  // Μετατρέπουμε την τρέχουσα ώρα σε συνολικά λεπτά από τα μεσάνυχτα
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  // ΟΜΑΔΑ 1: Πέμπτη (4), Παρασκευή (5), Κυριακή (0) -> 17:00 έως 00:00
  if (currentDay === 0 || currentDay === 4 || currentDay === 5) {
    const openTime = 17 * 60; // 17:00 = 1020 λεπτά
    const closeTime = 24 * 60; // 00:00 (το τέλος της μέρας) = 1440 λεπτά
    
    return currentTotalMinutes >= openTime && currentTotalMinutes < closeTime;
  } 
  
  // ΟΜΑΔΑ 2: Δευτέρα (1), Τρίτη (2), Τετάρτη (3), Σάββατο (6) -> 16:00 έως 22:00
  else {
    const openTime = 16 * 60; // 16:00 = 960 λεπτά
    const closeTime = 22 * 60; // 22:00 = 1320 λεπτά
    
    return currentTotalMinutes >= openTime && currentTotalMinutes < closeTime;
  }
}
