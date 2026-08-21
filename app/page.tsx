'use client';
import React, { useState } from 'react';

// Το "λεξικό" μας για τα σταθερά κείμενα της σελίδας
const translations = {
  da: {
    menu: 'Menu',
    location: 'Lokation & Timer',
    orderWolt: 'Bestil via Wolt',
    tag: 'Autentisk Græsk Street Food',
    title1: 'Den Berømte Pita Gyros',
    title2: 'i Aalborg',
    desc: 'Friske råvarer, traditionelle opskrifter, ægte smag. Oplev hjertet af Grækenland midt i Aalborg.',
    btnTakeaway: 'Se Takeaway Menu',
    menuTitle: 'Takeaway Menu',
    menuDesc: 'Vores priser ved afhentning i butikken. Ægte græsk smag lavet med kærlighed.',
    popular: 'Populært',
    takeawayLabel: 'Takeaway',
    hoursTitle: 'Åbningstider',
    monThu: 'Mandag - Torsdag',
    friSat: 'Fredag - Lørdag',
    sun: 'Søndag',
    footerDesc: 'Din destination for autentisk græsk street food. Kom forbi og smag forskellen.',
    footerDelivery: 'Bestil Delivery'
  },
  en: {
    menu: 'Menu',
    location: 'Location & Hours',
    orderWolt: 'Order via Wolt',
    tag: 'Authentic Greek Street Food',
    title1: 'The Famous Pita Gyros',
    title2: 'in Aalborg',
    desc: 'Fresh ingredients, traditional recipes, true taste. Experience the heart of Greece in Aalborg.',
    btnTakeaway: 'See Takeaway Menu',
    menuTitle: 'Takeaway Menu',
    menuDesc: 'Our pick-up prices. Authentic Greek taste made with love.',
    popular: 'Popular',
    takeawayLabel: 'Takeaway',
    hoursTitle: 'Opening Hours',
    monThu: 'Monday - Thursday',
    friSat: 'Friday - Saturday',
    sun: 'Sunday',
    footerDesc: 'Your destination for authentic Greek street food. Come by and taste the difference.',
    footerDelivery: 'Order Delivery'
  },
  el: {
    menu: 'Μενού',
    location: 'Τοποθεσία & Ωράριο',
    orderWolt: 'Παραγγελία Wolt',
    tag: 'Αυθεντικό Ελληνικό Street Food',
    title1: 'Η Ξακουστή Πίτα Γύρος',
    title2: 'στο Aalborg',
    desc: 'Φρέσκα υλικά, παραδοσιακές συνταγές, αληθινή γεύση. Η καρδιά της Ελλάδας στο Aalborg.',
    btnTakeaway: 'Δες το Μενού',
    menuTitle: 'Μενού Καταστήματος',
    menuDesc: 'Οι τιμές μας για παραλαβή (takeaway). Αυθεντική ελληνική γεύση με μεράκι.',
    popular: 'Δημοφιλές',
    takeawayLabel: 'Από το κατάστημα',
    hoursTitle: 'Ωράριο Λειτουργίας',
    monThu: 'Δευτέρα - Πέμπτη',
    friSat: 'Παρασκευή - Σάββατο',
    sun: 'Κυριακή',
    footerDesc: 'Ο προορισμός σας για αυθεντικό ελληνικό street food. Ελάτε να δοκιμάσετε τη διαφορά.',
    footerDelivery: 'Παραγγελία Delivery'
  }
};

const menuItems = [
  {
    id: 1,
    category: 'GYROS PITA',
    title: { da: 'Gyros Pita', en: 'Gyros Pita', el: 'Πίτα Γύρος' },
    desc: { 
      da: 'Pita med gyros (svine- eller kyllinggyros), tomat, løg, tzatziki og pommes frites.', 
      en: 'Pita with gyros (pork or chicken), tomato, onion, tzatziki, and fries.',
      el: 'Πίτα με γύρο (χοιρινό ή κοτόπουλο), ντομάτα, κρεμμύδι, τζατζίκι και πατάτες.' 
    },
    price: '74 DKK',
    popular: true
  },
  {
    id: 2,
    category: 'GYROS PITA',
    title: { da: 'Pita med Picante Sauce Fetas', en: 'Pita with Picante Feta Sauce', el: 'Πίτα με Picante Sauce Φέτας' },
    desc: { 
      da: 'Pita med svine- eller kyllinggyros, tomat, løg, pommes frites og picante sauce feta.',
      en: 'Pita with pork or chicken gyros, tomato, onion, fries, and picante feta sauce.',
      el: 'Πίτα με γύρο χοιρινό ή κοτόπουλο, ντομάτα, κρεμμύδι, πατάτες και picante sauce φέτας.'
    },
    price: '74 DKK',
    popular: false
  },
  {
    id: 3,
    category: 'PITA CLUB',
    title: { da: 'Pita Club', en: 'Pita Club', el: 'Pita Club' },
    desc: { 
      da: 'Tre pitabrød sauce, serveret lagvis med saftig gyros, tomat, ost, bacon og frisk agurk mellem pitaerne.',
      en: 'Three pita breads layered with juicy gyros, tomato, cheese, bacon, and fresh cucumber.',
      el: 'Τρεις πίτες σε στρώσεις με ζουμερό γύρο, ντομάτα, τυρί, μπέικον και φρέσκο αγγούρι.'
    },
    price: '120 DKK',
    popular: true
  },
  {
    id: 4,
    category: 'DOBBELT INDBAGT PITA',
    title: { da: 'Skepasti', en: 'Skepasti (Double Pita)', el: 'Σκεπαστή' },
    desc: { 
      da: 'To indbagte pitaer, serveret lagvis med gyros, hjemmelavet tzatziki, sauce, frisk tomat og løg imellem.',
      en: 'Two baked pitas layered with gyros, homemade tzatziki, sauce, fresh tomato, and onions.',
      el: 'Δύο ψημένες πίτες γεμιστές με γύρο, χειροποίητο τζατζίκι, σως, φρέσκια ντομάτα και κρεμμύδι.'
    },
    price: '89 DKK',
    popular: true
  },
  {
    id: 5,
    category: 'PORTIONER',
    title: { da: 'Svinekødsgyros', en: 'Pork Gyros Portion', el: 'Μερίδα Γύρος Χοιρινός' },
    desc: { 
      da: 'Hjemmelavet svinekødsgyros portion, serveres med pommes frites, tzatziki og pita.',
      en: 'Homemade pork gyros portion, served with fries, tzatziki, and pita.',
      el: 'Χειροποίητη μερίδα γύρος χοιρινός, σερβίρεται με πατάτες, τζατζίκι και πίτα.'
    },
    price: '114 DKK',
    popular: false
  },
  {
    id: 6,
    category: 'PORTIONER',
    title: { da: 'Kyllingegyros', en: 'Chicken Gyros Portion', el: 'Μερίδα Γύρος Κοτόπουλο' },
    desc: { 
      da: 'Hjemmelavet kyllingegyros portion, serveres med pommes frites, tzatziki og pita.',
      en: 'Homemade chicken gyros portion, served with fries, tzatziki, and pita.',
      el: 'Χειροποίητη μερίδα γύρος κοτόπουλο, σερβίρεται με πατάτες, τζατζίκι και πίτα.'
    },
    price: '114 DKK',
    popular: false
  },
  {
    id: 7,
    category: 'NYHED',
    title: { da: 'Halloumi Pita', en: 'Halloumi Pita', el: 'Πίτα Χαλούμι' },
    desc: { 
      da: 'Pita med grillet halloumi, tzatziki, tomat, løg og pommes frites.',
      en: 'Pita with grilled halloumi, tzatziki, tomato, onion, and fries.',
      el: 'Πίτα με ψητό χαλούμι, τζατζίκι, ντομάτα, κρεμμύδι και πατάτες.'
    },
    price: '79 DKK',
    popular: true
  }
];

export default function Home() {
  const [lang, setLang] = useState('da'); // Η προεπιλεγμένη γλώσσα είναι τα Δανέζικα
  
  // Το t είναι ένας συντομευμένος τρόπος να καλούμε το σωστό λεξικό
  const t = translations[lang as keyof typeof translations];

  return (
    <div className="min-h-screen font-sans bg-gray-50 text-gray-800 flex flex-col">
      
      {/* --- NAVIGATION BAR --- */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-orange-600">
            Hellas<span className="text-gray-600">Aalborg</span>
          </span>
        </div>
        
        <div className="hidden md:flex gap-6 font-medium text-gray-500">
          <a href="#menu" className="hover:text-orange-500 transition">{t.menu}</a>
          <a href="#location" className="hover:text-orange-500 transition">{t.location}</a>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            className="bg-white border border-gray-300 text-gray-600 rounded-md px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="da">🇩🇰 DA</option>
            <option value="en">🇬🇧 EN</option>
            <option value="el">🇬🇷 EL</option>
          </select>
          
          <a 
            href="https://wolt.com/da/dnk/aalborg/restaurant/hellas-food1"
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden md:block bg-[#009de0] text-white px-5 py-2 rounded-full font-bold hover:bg-[#0082ba] transition shadow-md"
          >
            {t.orderWolt}
          </a>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative bg-gray-900 h-[70vh] flex items-center justify-center text-center overflow-hidden border-b-[6px] border-orange-500">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1593504049359-715563c678a2?q=80&w=2070&auto=format&fit=crop" 
            alt="Delicious Greek Gyros" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 px-4 flex flex-col items-center">
          <span className="text-orange-400 font-semibold tracking-wider uppercase mb-2">
            {t.tag}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
            {t.title1} <br/> <span className="text-orange-500">{t.title2}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl drop-shadow-md">
            {t.desc}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href="#menu"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105"
            >
              {t.btnTakeaway}
            </a>
          </div>
        </div>
      </header>

      {/* --- MENU SECTION --- */}
      <section id="menu" className="py-20 px-4 md:px-8 max-w-6xl mx-auto flex-grow">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{t.menuTitle}</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {t.menuDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-900/20 group-hover:bg-orange-400 transition-colors"></div>
              {item.popular && (
                <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-md">
                  {t.popular}
                </div>
              )}
              <div className="text-xs text-amber-700/70 font-bold mb-2 uppercase tracking-wider">
                {item.category}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 pr-12">
                {item.title[lang as keyof typeof item.title]}
              </h3>
              <p className="text-gray-500 text-sm mb-6 line-clamp-3">
                {item.desc[lang as keyof typeof item.desc]}
              </p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                <span className="text-xl font-extrabold text-orange-600">
                  {item.price}
                </span>
                <span className="text-xs font-medium text-gray-400">
                  {t.takeawayLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FOOTER / LOCATION SECTION --- */}
      <footer id="location" className="bg-[#1f2122] text-gray-300 py-16 border-t-[4px] border-orange-500">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">
              Hellas<span className="text-orange-500">Aalborg</span>
            </h3>
            <p className="mb-6 text-sm">
              {t.footerDesc}
            </p>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-3">
                <span className="text-orange-500 text-xl">📍</span>
                Ved Stranden 21, 9000 Aalborg
              </p>
              <p className="flex items-center gap-3">
                <span className="text-orange-500 text-xl">📞</span>
                +45 42 17 77 54
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">{t.hoursTitle}</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between border-b border-gray-700 pb-1">
                <span>{t.monThu}</span>
                <span className="text-white font-medium">18:00 - 24:00</span>
              </li>
              <li className="flex justify-between border-b border-gray-700 pb-1 text-orange-400 font-bold">
                <span>{t.friSat}</span>
                <span>18:00 - 04:00</span>
              </li>
              <li className="flex justify-between border-b border-gray-700 pb-1">
                <span>{t.sun}</span>
                <span className="text-white font-medium">18:00 - 24:00</span>
              </li>
            </ul>
          </div>

          <div className="h-64 md:h-auto w-full rounded-xl overflow-hidden shadow-lg border border-gray-700">
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
        
        <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12 pt-6 border-t border-gray-700 text-center text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} Hellas Aalborg. All rights reserved.</p>
          <a href="https://wolt.com/da/dnk/aalborg/restaurant/hellas-food1" target="_blank" rel="noreferrer" className="text-orange-500 hover:text-white mt-2 md:mt-0 transition">
            {t.footerDelivery}
          </a>
        </div>
      </footer>

    </div>
  );
}
