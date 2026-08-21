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
    menuTitle: 'Vores Græske Menu',
    menuDesc: 'Frisklavet takeaway, præcis som du får det i Grækenland. God appetit!',
    popular: 'Vores Favorit',
    takeawayLabel: 'Takeaway',
    aboutTitle: 'Græsk Hjerte, Dansk Hygge',
    aboutDesc: 'Hos Hellas Aalborg forener vi den varme græske gæstfrihed med nordisk kvalitet. Vores gyros laves efter originale familieopskrifter med kød af højeste kvalitet og håndlavet tzatziki.',
    hoursTitle: 'Åbningstider',
    monThu: 'Mandag - Torsdag',
    friSat: 'Fredag - Lørdag',
    sun: 'Søndag',
    footerDesc: 'Dit lille stykke Grækenland i Nordjylland. Vi glæder os til at se dig.',
    footerDelivery: 'Bestil Delivery'
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
    menuTitle: 'Our Greek Menu',
    menuDesc: 'Freshly made takeaway, exactly how you find it in Greece. Enjoy!',
    popular: 'Our Favorite',
    takeawayLabel: 'Takeaway',
    aboutTitle: 'Greek Heart, Danish Hygge',
    aboutDesc: 'At Hellas Aalborg, we combine warm Greek hospitality with Nordic quality. Our gyros are made using original family recipes, premium meat, and handmade tzatziki.',
    hoursTitle: 'Opening Hours',
    monThu: 'Monday - Thursday',
    friSat: 'Friday - Saturday',
    sun: 'Sunday',
    footerDesc: 'Your little piece of Greece in North Jutland. We look forward to seeing you.',
    footerDelivery: 'Order Delivery'
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
    menuTitle: 'Το Ελληνικό μας Μενού',
    menuDesc: 'Φρέσκο takeaway, ακριβώς όπως το απολαμβάνετε στην Ελλάδα. Καλή όρεξη!',
    popular: 'Αγαπημένο',
    takeawayLabel: 'Takeaway',
    aboutTitle: 'Ελληνική Ψυχή, Δανέζικη Ποιότητα',
    aboutDesc: 'Στο Hellas Aalborg ενώνουμε τη ζεστή ελληνική φιλοξενία με την ποιότητα του Βορρά. Ο γύρος μας φτιάχνεται με αυθεντικές οικογενειακές συνταγές, εκλεκτά κρέατα και χειροποίητο τζατζίκι.',
    hoursTitle: 'Ωράριο Λειτουργίας',
    monThu: 'Δευτέρα - Πέμπτη',
    friSat: 'Παρασκευή - Σάββατο',
    sun: 'Κυριακή',
    footerDesc: 'Το δικό σας κομμάτι Ελλάδας στη Βόρεια Γιουτλάνδη. Σας περιμένουμε.',
    footerDelivery: 'Παραγγελία Delivery'
  }
};

const menuItems = [
  {
    id: 1,
    category: 'GYROS PITA',
    title: { da: 'Gyros Pita', en: 'Gyros Pita', el: 'Πίτα Γύρος' },
    desc: { da: 'Pita med gyros, tomat, løg, tzatziki og pommes frites.', en: 'Pita with gyros, tomato, onion, tzatziki, and fries.', el: 'Πίτα με γύρο, ντομάτα, κρεμμύδι, τζατζίκι και πατάτες.' },
    price: '74 DKK',
    popular: true
  },
  {
    id: 2,
    category: 'GYROS PITA',
    title: { da: 'Pita med Picante Sauce Fetas', en: 'Pita with Picante Feta Sauce', el: 'Πίτα με Picante Sauce Φέτας' },
    desc: { da: 'Pita med gyros, tomat, løg, pommes frites og picante sauce feta.', en: 'Pita with gyros, tomato, onion, fries, and picante feta sauce.', el: 'Πίτα με γύρο, ντομάτα, κρεμμύδι, πατάτες και picante sauce φέτας.' },
    price: '74 DKK',
    popular: false
  },
  {
    id: 3,
    category: 'PITA CLUB',
    title: { da: 'Pita Club', en: 'Pita Club', el: 'Pita Club' },
    desc: { da: 'Tre pitabrød sauce, serveret lagvis med saftig gyros, tomat, ost, bacon og frisk agurk mellem pitaerne.', en: 'Three pita breads layered with juicy gyros, tomato, cheese, bacon, and fresh cucumber.', el: 'Τρεις πίτες σε στρώσεις με ζουμερό γύρο, ντομάτα, τυρί, μπέικον και φρέσκο αγγούρι.' },
    price: '120 DKK',
    popular: true
  },
  {
    id: 4,
    category: 'DOBBELT INDBAGT PITA',
    title: { da: 'Skepasti', en: 'Skepasti (Double Pita)', el: 'Σκεπαστή' },
    desc: { da: 'To indbagte pitaer, serveret lagvis med gyros, hjemmelavet tzatziki, sauce, frisk tomat og løg imellem.', en: 'Two baked pitas layered with gyros, tzatziki, sauce, tomato, and onions.', el: 'Δύο ψημένες πίτες γεμιστές με γύρο, τζατζίκι, σως, ντομάτα και κρεμμύδι.' },
    price: '89 DKK',
    popular: true
  },
  {
    id: 5,
    category: 'PORTIONER',
    title: { da: 'Svinekødsgyros', en: 'Pork Gyros Portion', el: 'Μερίδα Γύρος Χοιρινός' },
    desc: { da: 'Hjemmelavet svinekødsgyros portion, serveres med pommes frites, tzatziki og pita.', en: 'Homemade pork gyros portion, served with fries, tzatziki, and pita.', el: 'Μερίδα γύρος χοιρινός, σερβίρεται με πατάτες, τζατζίκι και πίτα.' },
    price: '114 DKK',
    popular: false
  },
  {
    id: 7,
    category: 'NYHED',
    title: { da: 'Halloumi Pita', en: 'Halloumi Pita', el: 'Πίτα Χαλούμι' },
    desc: { da: 'Pita med grillet halloumi, tzatziki, tomat, løg og pommes frites.', en: 'Pita with grilled halloumi, tzatziki, tomato, onion, and fries.', el: 'Πίτα με ψητό χαλούμι, τζατζίκι, ντομάτα, κρεμμύδι και πατάτες.' },
    price: '79 DKK',
    popular: true
  }
];

export default function Home() {
  const [lang, setLang] = useState('da'); 
  const t = translations[lang as keyof typeof translations];

  return (
    // DARK MODE BACKGROUND: Ένα πολύ βαθύ γκρι/μπλε (#0F172A)
    <div className="min-h-screen font-sans bg-[#0F172A] text-gray-200 flex flex-col">
      
      {/* --- NAVIGATION BAR --- */}
      <nav className="flex items-center justify-between px-6 py-5 bg-[#1E293B] shadow-md sticky top-0 z-50 border-b border-[#334155]">
        <div className="flex items-center gap-2">
          {/* Logo με λευκό και το Ελληνικό Μπλε φωτισμένο */}
          <span className="text-2xl font-black tracking-tight text-white">
            Hellas<span className="text-[#38BDF8] font-medium">Aalborg</span>
          </span>
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
        <div className="absolute inset-0 opacity-50">
         <img 
  src="https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=2080&auto=format&fit=crop" 
  alt="Authentic Greek Pita Gyros" 
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

      {/* --- MENU SECTION --- */}
      <section id="menu" className="py-20 px-4 md:px-8 max-w-6xl mx-auto flex-grow">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-white mb-4">{t.menuTitle}</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t.menuDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-[#1E293B] rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 relative overflow-hidden group border border-[#334155]">
              {/* Μπλε Ελληνική γραμμή στο hover */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#334155] group-hover:bg-[#38BDF8] transition-colors"></div>
              
              {item.popular && (
                <div className="absolute top-6 right-6 bg-[#38BDF8]/20 text-[#38BDF8] text-xs font-bold px-3 py-1.5 rounded-full border border-[#38BDF8]/30">
                  {t.popular}
                </div>
              )}
              
              <div className="text-xs text-gray-500 font-bold mb-3 uppercase tracking-widest">
                {item.category}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 pr-10">
                {item.title[lang as keyof typeof item.title]}
              </h3>
              <p className="text-gray-400 text-sm mb-8 line-clamp-3 leading-relaxed">
                {item.desc[lang as keyof typeof item.desc]}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#334155]">
                <span className="text-2xl font-black text-white">
                  {item.price}
                </span>
                <span className="text-xs font-bold text-[#0F172A] bg-[#38BDF8] px-2 py-1 rounded-md">
                  {t.takeawayLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FOOTER / LOCATION SECTION --- */}
      <footer id="location" className="bg-[#090E17] text-gray-400 py-16 border-t border-[#334155]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div>
            <h3 className="text-3xl font-black text-white mb-6">
              Hellas<span className="text-[#38BDF8] font-medium">Aalborg</span>
            </h3>
            <p className="mb-6 text-sm leading-relaxed">
              {t.footerDesc}
            </p>
            <div className="space-y-4 text-sm font-medium text-white">
              <p className="flex items-center gap-3">
                <span className="text-[#38BDF8] text-xl">📍</span>
                Ved Stranden 21, 9000 Aalborg
              </p>
              <p className="flex items-center gap-3">
                <span className="text-[#38BDF8] text-xl">📞</span>
                +45 42 17 77 54
              </p>
            </div>
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
