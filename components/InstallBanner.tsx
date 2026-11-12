'use client';
import React, { useState, useEffect } from 'react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Αυτό το event "πιάνει" την κρυφή πρόσκληση εγκατάστασης του Android
    const handler = (e: Event) => {
      e.preventDefault(); // Σταματάμε το Chrome από το να κάνει τα δικά του
      setDeferredPrompt(e); // Αποθηκεύουμε την εντολή της εγκατάστασης
      setIsVisible(true); // Εμφανίζουμε το δικό μας όμορφο banner
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Όταν πατήσει το κουμπί, του πετάμε το επίσημο popup της Google!
    deferredPrompt.prompt();
    
    // Περιμένουμε να δούμε αν πάτησε Ναι ή Ακύρωση
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false); // Κρύβουμε το banner αν το εγκατέστησε
    }
    
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#0F172A] border-t border-white/10 p-4 z-[100] flex justify-between items-center shadow-2xl animate-fade-in-up md:hidden">
      <div className="flex items-center gap-3">
        <img src="/apple-icon.png" alt="App Icon" className="w-10 h-10 rounded-xl" />
        <div className="flex flex-col">
          <span className="font-bold text-white text-sm">Hellas App</span>
          <span className="text-[11px] text-gray-400">Γρήγορες παραγγελίες!</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsVisible(false)} 
          className="text-gray-400 p-2 text-xs font-bold uppercase tracking-wider"
        >
          ΟΧΙ
        </button>
        <button 
          onClick={handleInstall} 
          className="bg-[#38BDF8] text-[#0B1120] px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide active:scale-95 transition-transform"
        >
          ΛΗΨΗ
        </button>
      </div>
    </div>
  );
}
