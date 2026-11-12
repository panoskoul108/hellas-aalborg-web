'use client';
import React, { useState, useEffect } from 'react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Πιάνουμε την εντολή εγκατάστασης του Android αν είναι διαθέσιμη
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 2. ΕΜΦΑΝΙΖΟΥΜΕ ΤΟ BANNER ΠΑΝΤΑ (μετά από 1.5 δευτερόλεπτο)
    // Έτσι δεν περιμένουμε την cache του Android να αποφασίσει!
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Αν το Android είναι έτοιμο, πετάμε το επίσημο popup
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // Αν είναι iPhone ή το Android δεν έστειλε το prompt, δίνουμε οδηγίες!
      alert("Για εγκατάσταση:\n\n📱 Στο κάτω μέρος της οθόνης (iPhone) ή στις 3 τελείες (Android), πάτησε 'Προσθήκη στην οθόνη αφετηρίας'!");
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#0F172A] border-t border-white/10 p-4 z-[100] flex justify-between items-center shadow-2xl animate-fade-in-up md:hidden">
      <div className="flex items-center gap-3">
        {/* Χρησιμοποιούμε το apple-icon.png που φτιάξαμε */}
        <img src="/apple-icon.png" alt="App Icon" className="w-10 h-10 rounded-xl shadow-md" />
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
