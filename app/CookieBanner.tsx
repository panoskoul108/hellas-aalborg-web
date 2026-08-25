'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Ελέγχουμε αν υπάρχει ήδη αποθηκευμένη απάντηση (είτε ναι είτε όχι)
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) setIsVisible(true);
  }, []);

  if (!isVisible) return null;

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
    // Στο μέλλον: Εδώ θα δίνουμε εντολή να φορτώσει το Google Analytics
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
    // Το site λειτουργεί κανονικά, απλώς δεν παρακολουθούμε τον χρήστη
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#040812]/95 backdrop-blur-xl border-t border-white/10 text-gray-300 p-5 z-[100] flex flex-col md:flex-row justify-between items-center gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <p className="text-sm text-center md:text-left font-medium">
        Vi bruger cookies for at forbedre din oplevelse. / We use cookies to improve your experience. <br className="md:hidden" />
        <Link href="/privacy" className="text-[#38BDF8] hover:text-white transition-colors ml-1 font-bold">
          Læs mere / Read more
        </Link>
      </p>
      
      <div className="flex items-center gap-2 md:gap-4">
        {/* Κουμπί Απόρριψης - Πιο διακριτικό */}
        <button onClick={declineCookies} className="text-gray-400 hover:text-white font-medium px-4 py-2 text-sm transition-colors">
          Afvis / Decline
        </button>
        
        {/* Κουμπί Αποδοχής - Έντονο */}
        <button onClick={acceptCookies} className="bg-[#38BDF8] text-slate-900 font-extrabold px-6 py-2.5 rounded-xl hover:bg-sky-400 transition-colors whitespace-nowrap shadow-[0_0_15px_rgba(56,189,248,0.3)]">
          Accepter / Accept
        </button>
      </div>
    </div>
  );
}
