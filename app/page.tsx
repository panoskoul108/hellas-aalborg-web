import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen font-sans bg-gray-50 text-gray-800">
      
      {/* --- NAVIGATION BAR --- */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {/* Μπορείς να βάλεις το logo σας εδώ */}
          <span className="text-2xl font-bold tracking-tight text-orange-600">
            Hellas<span className="text-gray-800">Aalborg</span>
          </span>
        </div>
        
        {/* Κρυφό σε κινητά, εμφανές σε Desktop */}
        <div className="hidden md:flex gap-6 font-medium text-gray-600">
          <a href="#menu" className="hover:text-orange-500 transition">Menu</a>
          <a href="#location" className="hover:text-orange-500 transition">Location & Hours</a>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Selector Placeholder */}
          <select className="bg-gray-100 border-none rounded-md px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-orange-500">
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
        {/* Background Image Overlay - Βάλε εδώ μια ωραία φώτο με γύρο */}
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

    </div>
  );
}
