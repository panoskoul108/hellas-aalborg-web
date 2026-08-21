import React from 'react';

const menuItems = [
  {
    id: 1,
    category: 'GYROS PITA',
    title: 'Gyros Pita',
    desc: 'Pita med gyros (svine- eller kyllinggyros), tomat, løg, tzatziki og pommes frites.',
    price: '74 DKK',
    popular: true
  },
  {
    id: 2,
    category: 'GYROS PITA',
    title: 'Pita med Picante Sauce Fetas',
    desc: 'Pita med svine- eller kyllinggyros, tomat, løg, pommes frites og picante sauce feta.',
    price: '74 DKK',
    popular: false
  },
  {
    id: 3,
    category: 'PITA CLUB',
    title: 'Pita Club (Svinekød / Kylling)',
    desc: 'Tre pitabrød sauce, serveret lagvis med saftig gyros, tomat, ost, bacon og frisk agurk mellem pitaerne. Serveres med sprøde pommes frites - ekstra stor og mættende.',
    price: '120 DKK',
    popular: true
  },
  {
    id: 4,
    category: 'DOBBELT INDBAGT PITA',
    title: 'Skepasti',
    desc: 'To indbagte pitaer, serveret lagvis med gyros, hjemmelavet tzatziki, sauce, frisk tomat og lag imellem pitaeme. Serveres med sprøde pommes frites.',
    price: '89 DKK',
    popular: true
  },
  {
    id: 5,
    category: 'PORTIONER',
    title: 'Svinekødsgyros',
    desc: 'Hjemmelavet svinekødsgyros portion, serveres med pommes frites, tzatziki og pita.',
    price: '114 DKK',
    popular: false
  },
  {
    id: 6,
    category: 'PORTIONER',
    title: 'Kyllingegyros',
    desc: 'Hjemmelavet kyllingegyros portion, serveres med pommes frites, tzatziki og pita.',
    price: '114 DKK',
    popular: false
  },
  {
    id: 7,
    category: 'NYHED',
    title: 'Halloumi Pita',
    desc: 'Pita med grillet halloumi, tzatziki, tomat, løg og pommes frites.',
    price: '79 DKK',
    popular: true
  }
];

export default function Home() {
  return (
    <div className="min-h-screen font-sans bg-gray-50 text-gray-800">
      
      {/* --- NAVIGATION BAR --- */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-orange-600">
            Hellas<span className="text-gray-600">Aalborg</span>
          </span>
        </div>
        
        <div className="hidden md:flex gap-6 font-medium text-gray-500">
          <a href="#menu" className="hover:text-orange-500 transition">Menu</a>
          <a href="#location" className="hover:text-orange-500 transition">Lokation & Timer</a>
        </div>

        <div className="flex items-center gap-4">
          <select className="bg-white border border-gray-300 text-gray-600 rounded-md px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer">
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
            Bestil via Wolt
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
            Autentisk Græsk Street Food
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
            Den Berømte Pita Gyros <br/> <span className="text-orange-500">i Aalborg</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl drop-shadow-md">
            Friske råvarer, traditionelle opskrifter, ægte smag. Oplev hjertet af Grækenland midt i Aalborg.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href="#menu"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105"
            >
              Se Takeaway Menu
            </a>
          </div>
        </div>
      </header>

      {/* --- MENU SECTION --- */}
      <section id="menu" className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Takeaway Menu</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Vores priser ved afhentning i butikken. Ægte græsk smag lavet med kærlighed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 relative overflow-hidden group">
              
              {/* Διακριτική καφέ λεπτομέρεια στο επάνω μέρος κάθε κάρτας */}
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-900/20 group-hover:bg-orange-400 transition-colors"></div>

              {item.popular && (
                <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-md">
                  Populært
                </div>
              )}
              
              <div className="text-xs text-amber-700/70 font-bold mb-2 uppercase tracking-wider">
                {item.category}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 pr-12">
                {item.title}
              </h3>
              <p className="text-gray-500 text-sm mb-6 line-clamp-3">
                {item.desc}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                <span className="text-xl font-extrabold text-orange-600">
                  {item.price}
                </span>
                <span className="text-xs font-medium text-gray-400">
                  Takeaway
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
