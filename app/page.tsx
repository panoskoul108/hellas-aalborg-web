'use client';
import React, { useState } from 'react';

const translations = {
  da: {
    menu: 'Menu',
    location: 'Find Os',
    orderWolt: 'Bestil via Wolt',
    tag: 'Smagen af Grækenland',
    title1: 'Ægte Græsk Gyros',
    title2: 'i hjertet af Aalborg',
    desc: 'Oplev den autentiske græske stemning. Vi bringer opskrifterne direkte fra Grækenland til dig. Velkommen!',
    btnTakeaway: 'Se Vores Menu',
    menuTitle: 'Vores Menu',
    menuDesc: 'Vælg mellem vores fordelagtige Takeaway-priser for afhentning, eller få det leveret via Wolt.',
    popular: 'Vores Favorit',
    takeawayLabel: 'Takeaway',
    deliveryLabel: 'Wolt Pris',
    tabTakeaway: 'Menu Takeaway',
    tabDelivery: 'Menu Wolt (Delivery)',
    aboutTitle: 'Græsk Hjerte, Dansk Hygge',
    aboutDesc: 'Hos Hellas Aalborg forener vi den varme græske gæstfrihed med nordisk kvalitet. Vores gyros laves efter originale familieopskrifter med kød af højeste kvalitet og håndlavet tzatziki.',
    hoursTitle: 'Åbningstider',
    monThu: 'Mandag - Torsdag',
    friSat: 'Fredag - Lørdag',
    sun: 'Søndag',
    footerDesc: 'Dit lille stykke Grækenland i Nordjylland. Vi glæder os til at se dig.',
    footerDelivery: 'Bestil Delivery',
    allergies: 'Allergier eller særlige behov? Spørg vores personale!',
    veg: 'Vegetarisk',
    smiley: 'Se Fødevarestyrelsens smiley-rapport',
    followUs: 'Følg os på Instagram'
  },
  en: {
    menu: 'Menu',
    location: 'Find Us',
    orderWolt: 'Order via Wolt',
    tag: 'Taste of Greece',
    title1: 'Authentic Greek Gyros',
    title2: 'in the heart of Aalborg',
    desc: 'Experience the true Greek vibe. We bring original recipes straight from Greece to you. Welcome!',
    btnTakeaway: 'See Our Menu',
    menuTitle: 'Our Menu',
    menuDesc: 'Choose our great Takeaway prices for pick-up, or get it delivered via Wolt.',
    popular: 'Our Favorite',
    takeawayLabel: 'Takeaway',
    deliveryLabel: 'Wolt Price',
    tabTakeaway: 'Takeaway Menu',
    tabDelivery: 'Wolt Menu (Delivery)',
    aboutTitle: 'Greek Heart, Danish Hygge',
    aboutDesc: 'At Hellas Aalborg, we combine warm Greek hospitality with Nordic quality. Our gyros are made using original family recipes, premium meat, and handmade tzatziki.',
    hoursTitle: 'Opening Hours',
    monThu: 'Monday - Thursday',
    friSat: 'Friday - Saturday',
    sun: 'Sunday',
    footerDesc: 'Your little piece of Greece in North Jutland. We look forward to seeing you.',
    footerDelivery: 'Order Delivery',
    allergies: 'Allergies or dietary needs? Please ask our staff!',
    veg: 'Vegetarian',
    smiley: 'Food safety inspection report',
    followUs: 'Follow us on Instagram'
  },
  el: {
    menu: 'Μενού',
    location: 'Βρείτε μας',
    orderWolt: 'Παραγγελία Wolt',
    tag: 'Η Γεύση της Ελλάδας',
    title1: 'Αυθεντικός Ελληνικός Γύρος',
    title2: 'στην καρδιά του Aalborg',
    desc: 'Ζήστε την πραγματική ελληνική ατμόσφαιρα. Φέραμε τις αυθεντικές συνταγές απευθείας στο Aalborg. Καλώς ήρθατε!',
    btnTakeaway: 'Δείτε το Μενού',
    menuTitle: 'Το Μενού μας',
    menuDesc: 'Επιλέξτε τις χαμηλότερες τιμές μας για παραλαβή από το κατάστημα, ή παραγγείλετε μέσω Wolt.',
    popular: 'Αγαπημένο',
    takeawayLabel: 'Takeaway',
    deliveryLabel: 'Τιμή Wolt',
    tabTakeaway: 'Μενού Καταστήματος (Takeaway)',
    tabDelivery: 'Μενού Wolt (Delivery)',
    aboutTitle: 'Ελληνική Ψυχή, Δανέζικη Ποιότητα',
    aboutDesc: 'Στο Hellas Aalborg ενώνουμε τη ζεστή ελληνική φιλοξενία με την ποιότητα του Βορρά. Ο γύρος μας φτιάχνεται με αυθεντικές οικογενειακές συνταγές, εκλεκτά κρέατα και χειροποίητο τζατζίκι.',
    hoursTitle: 'Ωράριο Λειτουργίας',
    monThu: 'Δευτέρα - Πέμπτη',
    friSat: 'Παρασκευή - Σάββατο',
    sun: 'Κυριακή',
    footerDesc: 'Το δικό σας κομμάτι Ελλάδας στη Βόρεια Γιουτλάνδη. Σας περιμένουμε.',
    footerDelivery: 'Παραγγελία Delivery',
    allergies: 'Έχετε αλλεργίες; Ρωτήστε το προσωπικό μας!',
    veg: 'Χορτοφαγικό',
    smiley: 'Αναφορά υγειονομικού ελέγχου',
    followUs: 'Ακολουθήστε μας στο Instagram'
  }
};

const menuItems = [
  // --- GYROS PITA ---
  {
    id: 1,
    category: 'GYROS PITA',
    title: { da: 'Gyros Pita', en: 'Gyros Pita', el: 'Πίτα Γύρος' },
    desc: { da: 'Pita med gyros, tomat, løg, tzatziki og pommes frites.', en: 'Pita with gyros, tomato, onion, tzatziki, and fries.', el: 'Πίτα με γύρο, ντομάτα, κρεμμύδι, τζατζίκι και πατάτες.' },
    priceTakeaway: '74 DKK',
    priceDelivery: '94 DKK',
    popular: true,
    vegetarian: false
  },
  {
    id: 2,
    category: 'GYROS PITA',
    title: { da: 'Pita med Picante Sauce Fetas', en: 'Pita with Picante Feta Sauce', el: 'Πίτα με Picante Sauce Φέτας' },
    desc: { da: 'Pita med gyros, tomat, løg, pommes frites og picante sauce feta.', en: 'Pita with gyros, tomato, onion, fries, and picante feta sauce.', el: 'Πίτα με γύρο, ντομάτα, κρεμμύδι, πατάτες και picante sauce φέτας.' },
    priceTakeaway: '74 DKK',
    priceDelivery: '94 DKK',
    popular: false,
    vegetarian: false
  },
  {
    id: 7,
    category: 'GYROS PITA',
    title: { da: 'Halloumi Pita', en: 'Halloumi Pita', el: 'Πίτα Χαλούμι' },
    desc: { da: 'Pita med grillet halloumi, tzatziki, tomat, løg og pommes frites.', en: 'Pita with grilled halloumi, tzatziki, tomato, onion, and fries.', el: 'Πίτα με ψητό χαλούμι, τζατζίκι, ντομάτα, κρεμμύδι και πατάτες.' },
    priceTakeaway: '79 DKK',
    priceDelivery: '99 DKK',
    popular: true,
    vegetarian: true
  },
  // --- CLUB & SKEPASTI ---
  {
    id: 3,
    category: 'PITA CLUB',
    title: { da: 'Pita Club', en: 'Pita Club', el: 'Pita Club' },
    desc: { da: 'Tre pitabrød sauce, serveret lagvis med saftig gyros, tomat, ost, bacon og frisk agurk mellem pitaerne.', en: 'Three pita breads layered with juicy gyros, tomato, cheese, bacon, and fresh cucumber.', el: 'Τρεις πίτες σε στρώσεις με ζουμερό γύρο, ντομάτα, τυρί, μπέικον και φρέσκο αγγούρι.' },
    priceTakeaway: '120 DKK',
    priceDelivery: '149 DKK',
    popular: true,
    vegetarian: false
  },
  {
    id: 4,
    category: 'DOBBELT INDBAGT PITA',
    title: { da: 'Skepasti', en: 'Skepasti (Double Pita)', el: 'Σκεπαστή' },
    desc: { da: 'To indbagte pitaer, serveret lagvis med gyros, hjemmelavet tzatziki, sauce, frisk tomat og løg imellem.', en: 'Two baked pitas layered with gyros, tzatziki, sauce, tomato, and onions.', el: 'Δύο ψημένες πίτες γεμιστές με γύρο, τζατζίκι, σως, ντομάτα και κρεμμύδι.' },
    priceTakeaway: '89 DKK',
    priceDelivery: '109 DKK',
    popular: true,
    vegetarian: false
  },
  {
    id: 5,
    category: 'PORTIONER',
    title: { da: 'Svinekødsgyros', en: 'Pork Gyros Portion', el: 'Μερίδα Γύρος Χοιρινός' },
    desc: { da: 'Hjemmelavet svinekødsgyros portion, serveres med pommes frites, tzatziki og pita.', en: 'Homemade pork gyros portion, served with fries, tzatziki, and pita.', el: 'Μερίδα γύρος χοιρινός, σερβίρεται με πατάτες, τζατζίκι και πίτα.' },
    priceTakeaway: '114 DKK',
    priceDelivery: '139 DKK',
    popular: false,
    vegetarian: false
  },
  // --- KOMBO TILBUD ---
  {
    id: 8,
    category: 'KOMBO TILBUD',
    title: { da: '1. XL Menu for 1', en: '1. XL Menu for 1', el: '1. XL Μενού για 1' },
    desc: { da: 'Dobbelt indbagt pitabrød (Skepasti) med gyros, en portion hjemmelavet tzatziki, pommes frites & 1 sodavand. (Spar 10 kr.)', en: 'Double baked pita (Skepasti) with gyros, homemade tzatziki, fries & 1 soda. (Save 10 DKK)', el: 'Σκεπαστή με γύρο, χειροποίητο τζατζίκι, πατάτες & 1 αναψυκτικό. (Κερδίστε 10 DKK)' },
    priceTakeaway: '129 DKK',
    priceDelivery: '154 DKK',
    popular: true,
    vegetarian: false
  },
  {
    id: 9,
    category: 'KOMBO TILBUD',
    title: { da: '2. Menu for 2', en: '2. Menu for 2', el: '2. Μενού για 2' },
    desc: { da: '2 pita gyros, en portion hjemmelavet tzatziki, pommes frites & 2 sodavand. (Spar 26 kr.)', en: '2 pita gyros, homemade tzatziki, fries & 2 sodas. (Save 26 DKK)', el: '2 πίτες γύρο, χειροποίητο τζατζίκι, πατάτες & 2 αναψυκτικά. (Κερδίστε 26 DKK)' },
    priceTakeaway: '240 DKK',
    priceDelivery: '309 DKK',
    popular: true,
    vegetarian: false
  },
  {
    id: 10,
    category: 'KOMBO TILBUD',
    title: { da: '3. 2 Pita Club + Tzatziki + 2 Sodavand', en: '3. 2 Pita Club + Tzatziki + 2 Sodas', el: '3. 2 Pita Club + Τζατζίκι + 2 Αναψυκτικά' },
    desc: { da: '2 pita club sandwiches med gyros, ost & bacon, en portion hjemmelavet tzatziki & 2 sodavand. (Spar 30 kr.)', en: '2 pita club sandwiches with gyros, cheese & bacon, homemade tzatziki & 2 sodas. (Save 30 DKK)', el: '2 pita club με γύρο, τυρί & μπέικον, χειροποίητο τζατζίκι & 2 αναψυκτικά. (Κερδίστε 30 DKK)' },
    priceTakeaway: '279 DKK',
    priceDelivery: '349 DKK',
    popular: true,
    vegetarian: false
  },
  // --- TILBEHØR (SIDES) ---
  {
    id: 11,
    category: 'TILBEHØR',
    title: { da: 'Pommes Frites', en: 'French Fries', el: 'Πατάτες Τηγανητές' },
    desc: { da: 'Sprøde pommes frites.', en: 'Crispy french fries.', el: 'Τραγανές πατάτες τηγανητές.' },
    priceTakeaway: '29 DKK',
    priceDelivery: '39 DKK',
    popular: false,
    vegetarian: true
  },
  {
    id: 12,
    category: 'TILBEHØR',
    title: { da: 'Pommes Frites med Dip og Bacon', en: 'Fries with Dip and Bacon', el: 'Πατάτες με Dip και Μπέικον' },
    desc: { da: 'Sprøde pommes frites toppet med dip og bacon.', en: 'Crispy fries topped with dip and bacon.', el: 'Τραγανές πατάτες με dip και κομμάτια μπέικον.' },
    priceTakeaway: '39 DKK',
    priceDelivery: '49 DKK',
    popular: false,
    vegetarian: false
  },
  {
    id: 13,
    category: 'TILBEHØR',
    title: { da: 'Hjemmelavet Tzatziki', en: 'Homemade Tzatziki', el: 'Χειροποίητο Τζατζίκι' },
    desc: { da: 'Græsk yoghurt, agurk, hvidløg og frisk dild.', en: 'Greek yogurt, cucumber, garlic, and fresh dill.', el: 'Ελληνικό γιαούρτι, αγγούρι, σκόρδο και φρέσκος άνηθος.' },
    priceTakeaway: '39 DKK',
    priceDelivery: '49 DKK',
    popular: true,
    vegetarian: true
  },
  // --- DRIKKEVARER (DRINKS) ---
  {
    id: 14,
    category: 'DRIKKEVARER',
    title: { da: 'Sodavand', en: 'Soft Drinks', el: 'Αναψυκτικά' },
    desc: { da: 'Cola, Faxe Kondi, Fanta eller Pepsi.', en: 'Cola, Faxe Kondi, Fanta, or Pepsi.', el: 'Cola, Faxe Kondi, Fanta, ή Pepsi.' },
    priceTakeaway: '15 DKK',
    priceDelivery: '15 DKK',
    popular: false,
    vegetarian: true
  },
  {
    id: 15,
    category: 'DRIKKEVARER',
    title: { da: 'Vand', en: 'Water', el: 'Νερό' },
    desc: { da: 'Kildevand.', en: 'Spring water.', el: 'Εμφιαλωμένο νερό.' },
    priceTakeaway: '15 DKK',
    priceDelivery: '15 DKK',
    popular: false,
    vegetarian: true
  },
  {
    id: 16,
    category: 'DRIKKEVARER',
    title: { da: 'Tuborg (Dåse)', en: 'Tuborg Beer (Can)', el: 'Μπύρα Tuborg (Κουτάκι)' },
    desc: { da: 'Kold Tuborg øl.', en: 'Cold Tuborg beer.', el: 'Παγωμένη μπύρα Tuborg.' },
    priceTakeaway: '25 DKK',
    priceDelivery: '35 DKK',
    popular: false,
    vegetarian: true
  }
];
export default function Home() {
  const [lang, setLang] = useState('da'); 
  const [menuType, setMenuType] = useState('takeaway');
  
  const t = translations[lang as keyof typeof translations];

  return (
    <div className="min-h-screen font-sans bg-[#0F172A] text-gray-200 flex flex-col">
      
      {/* --- NAVIGATION BAR --- */}
      <nav className="flex items-center justify-between px-6 py-5 bg-[#1E293B] shadow-md sticky top-0 z-50 border-b border-[#334155]">
      <div className="flex items-center gap-2">
  <img 
    src="/logo.png" /* Αν το αποθήκευσες ως logo.png, άλλαξέ το αντίστοιχα */
    alt="Hellas Aalborg Logo" 
    className="h-12 w-auto rounded-full border-2 border-[#38BDF8]" /* Το κάνουμε στρογγυλό και του βάζουμε ένα γαλάζιο περίγραμμα για να ξεχωρίζει */
  />
</div>
        
        <div className="hidden md:flex gap-8 font-semibold text-gray-300">
          <a href="#menu" className="hover:text-white transition">{t.menu}</a>
          <a href="#location" className="hover:text-white transition">{t.location}</a>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            className="bg-[#334155] border-none text-white rounded-full px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#38BDF8] cursor-pointer font-medium"
          >
            <option value="da">🇩🇰 DA</option>
            <option value="en">🇬🇧 EN</option>
            <option value="el">🇬🇷 EL</option>
          </select>
          
          <a 
            href="https://wolt.com/da/dnk/aalborg/restaurant/hellas-food1"
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden md:block bg-[#009de0] text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#007fb5] transition shadow-sm"
          >
            {t.orderWolt}
          </a>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative bg-[#090E17] h-[75vh] flex items-center justify-center text-center overflow-hidden border-b-[4px] border-[#38BDF8]">
        <div className="absolute inset-0 opacity-50 bg-[#0F172A]">
          <img 
            src="" 
            alt="Hellas Aalborg Gyros" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 px-4 flex flex-col items-center">
          <span className="text-[#38BDF8] font-bold tracking-[0.2em] uppercase mb-4 text-sm bg-[#0F172A]/80 px-4 py-1 rounded-full border border-[#38BDF8]/30">
            {t.tag}
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] leading-tight">
            {t.title1} <br/> <span className="text-gray-300 font-light italic">{t.title2}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl font-light drop-shadow-md">
            {t.desc}
          </p>
          
          <a 
            href="#menu"
            className="bg-white hover:bg-gray-200 text-[#0F172A] font-bold py-4 px-10 rounded-full shadow-xl transition transform hover:-translate-y-1"
          >
            {t.btnTakeaway}
          </a>
        </div>
      </header>

      {/* --- GREEK HEART / ABOUT SECTION --- */}
      <section className="py-16 bg-[#1E293B]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-2 mb-6 opacity-80">
            <span className="w-12 h-1 bg-white rounded-full"></span>
            <span className="w-4 h-1 bg-[#38BDF8] rounded-full"></span>
            <span className="w-12 h-1 bg-white rounded-full"></span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{t.aboutTitle}</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            {t.aboutDesc}
          </p>
        </div>
      </section>

      {/* --- MENU SECTION (WITH TABS & ALLERGENS) --- */}
      <section id="menu" className="py-20 px-4 md:px-8 max-w-6xl mx-auto flex-grow">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-white mb-4">{t.menuTitle}</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            {t.menuDesc}
          </p>
          
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setMenuType('takeaway')}
              className={`px-6 py-3 rounded-full font-bold transition-all ${
                menuType === 'takeaway' 
                  ? 'bg-white text-[#0F172A] shadow-lg scale-105' 
                  : 'bg-[#1E293B] text-gray-400 border border-[#334155] hover:bg-[#334155]'
              }`}
            >
              {t.tabTakeaway}
            </button>
            <button 
              onClick={() => setMenuType('wolt')}
              className={`px-6 py-3 rounded-full font-bold transition-all ${
                menuType === 'wolt' 
                  ? 'bg-[#009de0] text-white shadow-lg scale-105' 
                  : 'bg-[#1E293B] text-gray-400 border border-[#334155] hover:bg-[#334155]'
              }`}
            >
              {t.tabDelivery}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-[#1E293B] rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 relative overflow-hidden group border border-[#334155]">
              <div className={`absolute top-0 left-0 w-full h-1 transition-colors ${menuType === 'wolt' ? 'bg-[#009de0]' : 'bg-[#334155] group-hover:bg-[#38BDF8]'}`}></div>
              
              <div className="flex justify-end gap-2 absolute top-6 right-6">
                {item.vegetarian && (
                  <div className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full border border-green-500/30">
                    (V) {t.veg}
                  </div>
                )}
                {item.popular && (
                  <div className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                    menuType === 'wolt' ? 'bg-[#009de0]/10 text-[#009de0] border-[#009de0]/30' : 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/30'
                  }`}>
                    {t.popular}
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500 font-bold mb-3 uppercase tracking-widest mt-2">
                {item.category}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 pr-4">
                {item.title[lang as keyof typeof item.title]}
              </h3>
              <p className="text-gray-400 text-sm mb-8 line-clamp-3 leading-relaxed">
                {item.desc[lang as keyof typeof item.desc]}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#334155]">
                <span className="text-2xl font-black text-white transition-all">
                  {menuType === 'takeaway' ? item.priceTakeaway : item.priceDelivery}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${
                  menuType === 'takeaway' ? 'text-[#0F172A] bg-[#38BDF8]' : 'text-white bg-[#009de0]'
                }`}>
                  {menuType === 'takeaway' ? t.takeawayLabel : t.deliveryLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
   <div className="text-center mt-10">
          <p className="text-gray-500 text-sm italic">
            ⚠️ {t.allergies}
          </p>
        </div>
        
        {menuType === 'wolt' && (
          <div className="text-center mt-8 animate-fade-in-up">
            <a 
              href="https://wolt.com/da/dnk/aalborg/restaurant/hellas-food1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#009de0] hover:bg-[#0082ba] text-white font-bold py-4 px-12 rounded-full shadow-lg transition transform hover:scale-105"
            >
              {t.orderWolt}
            </a>
          </div>
        )}
      </section>

      {/* --- INSTAGRAM FEED SECTION --- */}
      <section id="instagram" className="py-12 bg-[#0F172A]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-8 flex items-center justify-center gap-3">
            <span className="text-[#38BDF8] text-2xl">📸</span> 
            {t.followUs}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <a key={i} href="#" target="_blank" rel="noopener noreferrer" className="relative aspect-square bg-[#1E293B] rounded-xl overflow-hidden group border border-[#334155] flex items-center justify-center hover:border-[#38BDF8] transition-colors">
                <span className="text-gray-600 group-hover:text-[#38BDF8] text-sm font-medium transition-colors">Image {i}</span>
                <div className="absolute inset-0 bg-[#0F172A]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-bold">View Post</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER / LOCATION SECTION --- */}
      <footer id="location" className="bg-[#090E17] text-gray-400 py-16 border-t border-[#334155]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div>
  <img 
    src="/logo.jpg" 
    alt="Hellas Aalborg Logo" 
    className="h-20 w-auto rounded-full border-2 border-[#38BDF8] mb-6 shadow-lg" 
  />
            <p className="mb-6 text-sm leading-relaxed">
              {t.footerDesc}
            </p>
            <div className="space-y-4 text-sm font-medium text-white mb-6">
              <p className="flex items-center gap-3">
                <span className="text-[#38BDF8] text-xl">📍</span>
                Ved Stranden 21, 9000 Aalborg
              </p>
              <p className="flex items-center gap-3">
                <span className="text-[#38BDF8] text-xl">📞</span>
                +45 42 17 77 54
              </p>
            </div>
            <a 
              href="https://www.findsmiley.dk/Sider/VirkSide.aspx?virk=1579068" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-[#334155] transition-colors"
            >
              <span className="text-2xl">😃</span>
              <span className="text-sm font-medium text-gray-300">{t.smiley}</span>
            </a>
          </div>

          <div>
            <h4 className="text-xl font-bold text-white mb-6">{t.hoursTitle}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between border-b border-[#1E293B] pb-2">
                <span>{t.monThu}</span>
                <span className="font-bold text-white">18:00 - 24:00</span>
              </li>
              <li className="flex justify-between border-b border-[#1E293B] pb-2">
                <span className="text-[#38BDF8]">{t.friSat}</span>
                <span className="font-bold text-[#38BDF8]">18:00 - 04:00</span>
              </li>
              <li className="flex justify-between border-b border-[#1E293B] pb-2">
                <span>{t.sun}</span>
                <span className="font-bold text-white">18:00 - 24:00</span>
              </li>
            </ul>
          </div>

          <div className="h-64 md:h-auto w-full rounded-2xl overflow-hidden shadow-2xl opacity-80 hover:opacity-100 transition-opacity border border-[#334155]">
            <iframe 
              title="Hellas Aalborg Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2170.198305602497!2d9.919427015949516!3d57.04944898092288!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x464932b144fc894f%3A0xc3c940b3c5a6c38b!2sVed%20Stranden%2021%2C%209000%20Aalborg%2C%20Denmark!5e0!3m2!1sen!2sgr!4v1680000000000!5m2!1sen!2sgr" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

        </div>
        
        <div className="max-w-6xl mx-auto px-4 md:px-8 mt-16 pt-8 border-t border-[#1E293B] text-center text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} Hellas Aalborg. All rights reserved.</p>
          <a href="https://wolt.com/da/dnk/aalborg/restaurant/hellas-food1" target="_blank" rel="noreferrer" className="text-[#38BDF8] hover:text-white mt-4 md:mt-0 transition font-bold tracking-wider uppercase">
            {t.footerDelivery}
          </a>
        </div>
      </footer>

    </div>
  );
}
