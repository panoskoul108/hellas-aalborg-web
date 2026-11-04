'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'da' | 'en' | 'el'>('da'); // Προεπιλογή Δανέζικα

  useEffect(() => {
    setMounted(true);
    const hasAccepted = localStorage.getItem('hellas_cookie_consent');
    if (!hasAccepted) {
      setShowBanner(true);
    }
    
    // Αν έχεις αποθηκεύσει τη γλώσσα του site στο localStorage, προσπαθεί να τη διαβάσει
    const savedLang = localStorage.getItem('lang');
    if (savedLang === 'da' || savedLang === 'en' || savedLang === 'el') {
      setLang(savedLang);
    }
  }, []);

  if (!mounted) return null; 
  if (!showBanner) return null;

  // Λεξικό για τις μεταφράσεις
  const dict = {
    da: {
      text: "Vi bruger kun nødvendige cookies (lokal lagring) for at få takeaway-kurven til at fungere og for at beskytte mod spam. Ved at bruge siden accepterer du dette.",
      link: "Læs vores Privatlivspolitik her.",
      btn: "FORSTÅET"
    },
    en: {
      text: "We only use essential cookies (local storage) to make the takeaway cart work and to protect against spam. By using the site you agree to this.",
      link: "Read our Privacy Policy here.",
      btn: "GOT IT"
    },
    el: {
      text: "Χρησιμοποιούμε μόνο απαραίτητα cookies (τοπική αποθήκευση) για τη λειτουργία του καλαθιού και την προστασία από spam. Χρησιμοποιώντας τον ιστότοπο συμφωνείτε σε αυτό.",
      link: "Διαβάστε την Πολιτική Απορρήτου.",
      btn: "ΚΑΤΑΛΑΒΑ"
    }
  };

  const ui = dict[lang];

  const acceptCookies = () => {
    localStorage.setItem('hellas_cookie_consent', 'true');
    setShowBanner(false);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white p-4 sm:p-6 z-[9999] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] animate-slide-up">
      <div className="flex flex-col gap-3 max-w-4xl w-full">
        
        {/* Επιλογή Γλώσσας Banner */}
        <div className="flex gap-2">
          <button onClick={() => setLang('da')} className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded transition-colors ${lang === 'da' ? 'bg-sky-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>DK</button>
          <button onClick={() => setLang('en')} className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded transition-colors ${lang === 'en' ? 'bg-sky-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>EN</button>
          <button onClick={() => setLang('el')} className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded transition-colors ${lang === 'el' ? 'bg-sky-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>EL</button>
        </div>

        {/* Κείμενο βάσει Γλώσσας */}
        <div className="text-xs sm:text-sm font-medium opacity-90 leading-relaxed">
          {ui.text} <br className="hidden sm:block"/>
          <Link href="/privacy" className="underline text-sky-400 font-bold hover:text-sky-300">
            {ui.link}
          </Link>
        </div>
      </div>
      
      <button 
        onClick={acceptCookies}
        className="w-full sm:w-auto px-8 py-4 bg-sky-500 hover:bg-sky-400 text-gray-900 font-black text-xs uppercase tracking-widest rounded-xl transition-colors shrink-0 active:scale-95"
      >
        {ui.btn}
      </button>
    </div>
  );
}
