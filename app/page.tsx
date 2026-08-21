'use client';
import React, { useState } from 'react';

// Το "λεξικό" μας (Προσαρμοσμένο να τονίζει την ελληνικότητα)
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
    <div className="min-h-screen font-sans bg-[#F9F9F9] text-gray-800 flex flex-col">
      
      {/* --- NAVIGATION BAR --- */}
      <nav className="flex items-center justify-between px-6 py-5 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {/* Logo με Ελληνικό Μπλε και Χρυσό */}
          <span className="text-2xl font-black tracking-tight text-[#003366]">
            Hellas<span className="text-[#D4AF37] font-medium">Aalborg</span>
          </span>
        </div>
        
        <div className="hidden md:flex gap-8 font-semibold text-[#003366]/70">
          <a href="#menu" className="hover:text-[#003366] transition">{t.menu}</a>
          <a href="#location" className="hover:text-[#003366] transition">{t.location}</a>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            className="bg-[#F3F4F6] border-none text-[#003366] rounded-full px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer font-medium"
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
      <header className="relative bg-[#001f3f] h-[75vh] flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 opacity-50">
          {/* Φωτογραφία που θυμίζει Ελλάδα (μπλε και λευκό) */}
          <img 
            src="https://images.unsplash.com/photo-1515859005217-8a1f08870f59?q=80&w=2070&auto=format&fit=crop" 
            alt="Greek Vibe" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 px-4 flex flex-col items-center">
          <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase mb-4 text-sm bg-white/10 px-4 py-1 rounded-full backdrop-blur-sm">
            {t.tag}
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-lg leading-tight">
            {t.title1} <br/> <span className="text-white/90 font-light italic">{t.title2}</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl font-light">
            {t.desc}
          </p>
          
          <a 
            href="#menu"
            className="bg-[#D4AF37] hover:bg-[#c19b2c] text-white font-bold py-4 px-10 rounded-full shadow-xl transition transform hover:-translate-y-1"
          >
            {t.btnTakeaway}
          </a>
        </div>
      </header>

      {/* --- GREEK HEART / ABOUT SECTION --- */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          {/* Μια μικρή λεπτομέρεια που θυμίζει μαίανδρο/κύμα */}
          <div className="flex justify-center gap-2 mb-6 opacity-30">
            <span className="w-12 h-1 bg-[#003366] rounded-full"></span>
            <span className="w-4 h-1 bg-[#D4AF37] rounded-full"></span>
            <span className="w-12 h-1 bg-[#003366] rounded-full"></span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#003366] mb-4">{t.aboutTitle}</h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            {t.aboutDesc}
          </p>
        </div>
      </section>

      {/* --- MENU SECTION --- */}
      <section id="menu" className="py-20 px-4 md:px-8 max-w-6xl mx-auto flex-grow">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-[#003366] mb-4">{t.menuTitle}</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            {t.menuDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all p-8 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#003366]/10 group-hover:bg-[#003366] transition-colors"></div>
              
              {item.popular && (
                <div className="absolute top-6 right-6 bg-[#D4AF37]/10 text-[#c19b2c] text-xs font-bold px-3 py-1.5 rounded-full">
                  {t.popular}
                </div>
              )}
              
              <div className="text-xs text-[#003366]/50 font-bold mb-3 uppercase tracking-widest">
                {item.category}
              </div>
              <h3 className="text-2xl font-bold text-[#003366] mb-3 pr-10">
                {item.title[lang as keyof typeof item.title]}
              </h3>
              <p className="text-gray-500 text-sm mb-8 line-clamp-3 leading-relaxed">
                {item.desc[lang as keyof typeof item.desc]}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                <span className="text-2xl font-black text-[#D4AF37]">
                  {item.price}
                </span>
                <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                  {t.takeawayLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FOOTER / LOCATION SECTION --- */}
      <footer id="location" className="bg-[#003366] text-white py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div>
            <h3 className="text-3xl font-black text-white mb-6">
              Hellas<span className="text-[#D4AF37] font-medium">Aalborg</span>
            </h3>
            <p className="mb-6 text-white/70 text-sm leading-relaxed">
              {t.footerDesc}
            </p>
            <div className="space-y-4 text-sm font-medium">
              <p className="flex items-center gap-3">
                <span className="text-[#D4AF37] text-xl">📍</span>
                Ved Stranden 21, 9000 Aalborg
              </p>
              <p className="flex items-center gap-3">
                <span className="text-[#D4AF37] text-xl">📞</span>
                +45 42 17 77 54
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-[#D4AF37] mb-6">{t.hoursTitle}</h4>
            <ul className="space-y-3 text-sm text-white/90">
              <li className="flex justify-between border-b border-white/10 pb-2">
                <span>{t.monThu}</span>
                <span className="font-bold">18:00 - 24:00</span>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-[#D4AF37]">{t.friSat}</span>
                <span className="font-bold text-[#D4AF37]">18:00 - 04:00</span>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-2">
                <span>{t.sun}</span>
                <span className="font-bold">18:00 - 24:00</span>
              </li>
            </ul>
          </div>

          <div className="h-64 md:h-auto w-full rounded-2xl overflow-hidden shadow-2xl opacity-90 hover:opacity-100 transition-opacity">
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
        
        <div className="max-w-6xl mx-auto px-4 md:px-8 mt-16 pt-8 border-t border-white/10 text-center text-xs text-white/50 flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} Hellas Aalborg. All rights reserved.</p>
          <a href="https://wolt.com/da/dnk/aalborg/restaurant/hellas-food1" target="_blank" rel="noreferrer" className="text-[#D4AF37] hover:text-white mt-4 md:mt-0 transition font-bold tracking-wider uppercase">
            {t.footerDelivery}
          </a>
        </div>
      </footer>

    </div>
  );
}
