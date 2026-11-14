'use client';
import React, { useState, useEffect } from 'react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      alert("Το prompt δεν είναι έτοιμο ακόμα. Δοκίμασε από τις 3 τελείες!");
    }
  };

  // ΑΦΑΙΡΕΣΑΜΕ ΤΟ "if (!isVisible) return null;"
  // Τώρα θα φαίνεται ΠΑΝΤΑ, χωρίς καθυστερήσεις.

  return (
    <div className="fixed bottom-20 left-0 w-full bg-red-600 border-t-4 border-white p-4 z-[9999] flex justify-between items-center shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-bold text-white text-sm">ΔΟΚΙΜΑΣΤΙΚΟ BANNER</span>
          <span className="text-[11px] text-white/80">Αν το βλέπεις, ο κώδικας δουλεύει!</span>
        </div>
      </div>
      
      <button 
        onClick={handleInstall} 
        className="bg-white text-red-600 px-4 py-2.5 rounded-lg font-bold text-xs uppercase"
      >
        ΛΗΨΗ
      </button>
    </div>
  );
}
