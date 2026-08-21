import React from 'react';

// Εδώ βάζουμε τα πραγματικά δεδομένα από το κατάστημα (Wolt)
const menuItems = [
  {
    id: 1,
    category: 'Gyros & Pita',
    title: 'Gyros i pita – svinekød eller kylling',
    desc: 'Saftig gyros af svinekød eller kylling serveret i blød pita med sprøde pommes frites, friske tomater, løg og hjemmelavet tzatziki.',
    price: '94.00 DKK',
    popular: true
  },
  {
    id: 2,
    category: 'Gyros & Pita',
    title: 'Vegetar-pita',
    desc: 'Pita med hjemmelavet tzatziki, friske tomater, løg og sprøde fritter – en lækker kombination!',
    price: '75.00 DKK',
    popular: false
  },
  {
    id: 3,
    category: 'Deals & Combos',
    title: 'Greek Gyros Combo',
    desc: '1 pitagyros, 1 portion pommes frites, 1 tzatziki, 2 udskårne pitabrød og 1 valgfri sodavand.',
    price: '189.00 DKK',
    popular: true
  },
  {
    id: 4,
    category: 'Deals & Combos',
    title: 'XL Menu for 1 (ΣΚΕΠΑΣΤΗ)',
    desc: 'To indbagte pitaer med gyros, hjemmelavet tzatziki, sauce, frisk tomat og løg. Inkl. pommes frites, tzatziki og sodavand.',
    price: '154.00 DKK',
    popular: true
  },
  {
    id: 5,
    category: 'Hovedretter',
    title: 'Svine gyros portion',
    desc: 'Saftig gyros serveret med sprøde pommes frites, blød grillet pita, frisk tomat i skiver, løg toppet med rød paprika og cremet hjemmelavet tzatziki.',
    price: '139.00 DKK',
    popular: false
  },
  {
    id: 6,
    category: 'Tilbehør',
    title: 'Hjemmelavet tyrokafteri',
    desc: 'Fetaost, yoghurt og olivenolie, blandet med pikante krydderier. En cremet og let stærk klassisk græsk dip.',
    price: '49.00 DKK',
    popular: false
  }
];

export default function Home() {
  return (
    <div className="min-h-screen font-sans bg-gray-50 text-gray-800">
      
      {/* --- NAVIGATION BAR --- */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-orange-600">
            Hellas<span className="text-gray-800">Aalborg</span>
          </span>
        </div>
        
        <div className="hidden md:flex gap-6 font-medium text-gray-600">
          <a href="#menu" className="hover:text-orange-500 transition">Menu</a>
          <a href="#location" className="hover:text-orange-500 transition">Location & Hours</a>
        </div>

        <div className="flex items-center gap-4">
          <select className="bg-gray-100 border-none rounded-md px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer">
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
            Order via Wolt
          </a>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative bg-gray-900 h-[70vh] flex items-center justify-center text-center overflow-hidden">
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
              href="https://wolt.com/da/dnk/aalborg/restaurant/hellas-food1"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#009de0] hover:bg-[#0082ba] text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105"
            >
              Bestil nu via Wolt
            </a>
            <a 
              href="#menu"
              className="bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg transition"
            >
              Se Menu
            </a>
          </div>
        </div>
      </header>

      {/* --- MENU SECTION --- */}
      <section id="menu" className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Vores Menu</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Udforsk vores udvalg af autentiske græske retter. Alt er lavet med friske ingredienser og masser af kærlighed.
          </p>
        </div>

        {/* Κατάλογος Πιάτων (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 relative overflow-hidden">
              
              {/* Ταμπελάκι Popular */}
              {item.popular && (
                <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
                  Populært
                </div>
              )}
              
              <div className="text-sm text-gray-400 font-medium mb-2 uppercase tracking-wide">
                {item.category}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 pr-12">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                {item.desc}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                <span className="text-lg font-extrabold text-gray-900">
                  {item.price}
                </span>
                <a 
                  href="https://wolt.com/da/dnk/aalborg/restaurant/hellas-food1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-[#009de0] hover:text-[#0082ba] transition"
                >
                  + Tilføj
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
