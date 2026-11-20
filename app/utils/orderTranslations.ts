export function getLocalOrderUi(
  lang: 'da' | 'en' | 'el',
  nextOpenTimeStr: string
) {
  const dict: Record<'da' | 'en' | 'el', any> = {
    da: {
      search: "Søg i menuen...",
      closed: "Lukket",
      opensAt: `Åbner kl. ${nextOpenTimeStr}`,
      paused: "Lukket midlertidigt",
      smiley: "Smiley rapport",
      details: "Restaurant info",
      schedule: "Planlæg ordre",
      viewOrder: "Se bestilling",
      legalName: "Juridisk navn",
      cvr: "CVR-nummer",
      address: "Adresse",
      maps: "Vis på kort",
      hours: "Åbningstider",
      promoBadge: "Opret konto & Få 35 kr.",
      repeatOrder: "Gentag",
      card: "Kort",
      cash: "Kontant",
      pickupConfirm: "Bekræft afhentning",
      dobPlaceholder: "Fødselsdato (dd/mm/åååå)",
    },
    en: {
      search: "Search menu...",
      closed: "Closed",
      opensAt: `Opens at ${nextOpenTimeStr}`,
      paused: "Paused for now",
      smiley: "Smiley report",
      details: "Restaurant info",
      schedule: "Schedule order",
      viewOrder: "View order",
      legalName: "Legal Name",
      cvr: "Registered number",
      address: "Registered address",
      maps: "View on Maps",
      hours: "Opening hours",
      promoBadge: "Sign up & Get 35 kr.",
      repeatOrder: "Repeat",
      card: "Card",
      cash: "Cash",
      pickupConfirm: "Pickup Confirmation",
      dobPlaceholder: "Birthdate (dd/mm/yyyy)",
    },
    el: {
      search: "Αναζήτηση μενού...",
      closed: "Κλειστά",
      opensAt: `Ανοίγει στις ${nextOpenTimeStr}`,
      paused: "Προσωρινά Κλειστά",
      smiley: "Αναφορά Smiley",
      details: "Πληροφορίες",
      schedule: "Προγραμματισμός",
      viewOrder: "Καλάθι",
      legalName: "Νομική Επωνυμία",
      cvr: "Αριθμός Μητρώου (CVR)",
      address: "Διεύθυνση",
      maps: "Προβολή στο Χάρτη",
      hours: "Ωράριο Λειτουργίας",
      promoBadge: "35 kr. Δώρο Εγγραφής",
      repeatOrder: "Επανάληψη",
      card: "Κάρτα",
      cash: "Μετρητά",
      pickupConfirm: "Επιβεβαίωση Παραλαβής",
      dobPlaceholder: "Ημ. Γέννησης (ηη/μμ/εεεε)",
    },
  };

  return dict[lang] || dict.da;
}

export function translateDay(dayName: string, currentLang: 'da' | 'en' | 'el') {
  const dayDict: Record<string, Record<'da' | 'en' | 'el', string>> = {
    ΔΕΥΤΕΡΑ: { da: 'Mandag', en: 'Monday', el: 'Δευτέρα' },
    ΤΡΙΤΗ: { da: 'Tirsdag', en: 'Tuesday', el: 'Τρίτη' },
    ΤΕΤΑΡΤΗ: { da: 'Onsdag', en: 'Wednesday', el: 'Τετάρτη' },
    ΠΕΜΠΤΗ: { da: 'Torsdag', en: 'Thursday', el: 'Πέμπτη' },
    ΠΑΡΑΣΚΕΥΗ: { da: 'Fredag', en: 'Friday', el: 'Παρασκευή' },
    ΣΑΒΒΑΤΟ: { da: 'Lørdag', en: 'Saturday', el: 'Σάββατο' },
    ΚΥΡΙΑΚΗ: { da: 'Søndag', en: 'Sunday', el: 'Κυριακή' },
    MONDAY: { da: 'Mandag', en: 'Monday', el: 'Δευτέρα' },
    TUESDAY: { da: 'Tirsdag', en: 'Tuesday', el: 'Τρίτη' },
    WEDNESDAY: { da: 'Onsdag', en: 'Wednesday', el: 'Τετάρτη' },
    THURSDAY: { da: 'Torsdag', en: 'Thursday', el: 'Πέμπτη' },
    FRIDAY: { da: 'Fredag', en: 'Friday', el: 'Παρασκευή' },
    SATURDAY: { da: 'Lørdag', en: 'Saturday', el: 'Σάββατο' },
    SUNDAY: { da: 'Søndag', en: 'Sunday', el: 'Κυριακή' },
  };

  const key = dayName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
  return dayDict[key] ? dayDict[key][currentLang] : dayName;
}

export function translateCategory(cat: string, currentLang: 'da' | 'en' | 'el') {
  if (cat === 'POPULAR') {
    return currentLang === 'da' ? 'Populært' : currentLang === 'en' ? 'Popular' : 'Δημοφιλή';
  }

  const catDict: Record<string, Record<'da' | 'en' | 'el', string>> = {
    'KOMBO TILBUD': { da: 'Kombo tilbud', en: 'Combos', el: 'Προσφορές' },
    'GYROS PITA': { da: 'Gyros Pita', en: 'Gyros Pita', el: 'Πίτα με Γύρο' },
    'VEGETERIAN PITA': { da: 'Vegeterian Pita', en: 'Vegeterian Pita', el: 'Πίτα Vegeterian' },
    'PITA CLUB': { da: 'Pita Club', en: 'Pita Club', el: 'Πίτα Κλάμπ' },
    'DOBBELT INDBAGT PITA': { da: 'Dobbelt indbagt pita', en: 'Double baked pita', el: 'Σκεπαστή' },
    PORTIONER: { da: 'Portioner', en: 'Portions', el: 'Μερίδες' },
    DRIKKEVARER: { da: 'Drikkevarer', en: 'Drinks', el: 'Αναψυκτικά' },
    TILBEHØR: { da: 'TILBEHØR', en: 'Sides', el: 'Συνοδευτικά' },
    DIPS: { da: 'Dips', en: 'Dips', el: 'Έξτρα' },
  };

  const normalizedCat = cat.toUpperCase().trim();
  return catDict[normalizedCat] && catDict[normalizedCat][currentLang]
    ? catDict[normalizedCat][currentLang]
    : cat;
}
