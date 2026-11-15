'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Ελέγχει αν είναι ανοιχτό ή απλό μπισκότο
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasAccepted = localStorage.getItem('hellas_cookie_consent');
    if (!hasAccepted) {
      setShowBanner(true);
    }
  }, []);

  if (!mounted) return null; 
  if (!showBanner) return null;

  const handleAction = (accepted: boolean) => {
    // Αποθηκεύουμε την επιλογή για να εξαφανιστεί ΟΡΙΣΤΙΚΑ.
    localStorage.setItem('hellas_cookie_consent', accepted ? 'true' : 'minimal');
    setShowBanner(false);
  };

  // --- ΚΑΤΑΣΤΑΣΗ 1: ΜΙΚΡΟ ΣΥΝΝΕΦΑΚΙ (ΜΠΙΣΚΟΤΟ) ---
  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-[130px] left-4 md:bottom-8 md:left-8 w-14 h-14 bg-slate-900 border-2 border-slate-700 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] z-[100] flex items-center justify-center text-3xl hover:scale-110 hover:border-[#38BDF8] transition-all animate-bounce"
        aria-label="Cookie Indstillinger"
      >
        🍪
      </button>
    );
  }

  // --- ΚΑΤΑΣΤΑΣΗ 2: ΑΝΟΙΧΤΟ BANNER ΜΕ ΚΟΥΜΠΙΑ ---
  return (
    <div className="fixed bottom-[130px] left-4 right-4 md:left-8 md:right-auto md:bottom-8 md:max-w-sm bg-slate-900 border border-slate-700 p-5 rounded-2xl shadow-2xl z-[100] animate-fade-in-up">
      
      {/* Κουμπί κλεισίματος για να ξαναγίνει μπισκότο */}
      <button 
        onClick={() => setIsExpanded(false)}
        className="absolute -top-3 -right-3 w-8 h-8 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-700 transition-colors shadow-lg"
      >
        ✕
      </button>

      <div className="text-xs sm:text-sm font-medium opacity-90 leading-relaxed max-w-4xl mb-4 text-gray-200">
        Vi bruger udelukkende nødvendige cookies (lokal lagring) for at få din takeaway-bestilling og kurv til at fungere. Vi bruger ikke tracking eller marketing-cookies.{' '}
        <Link href="/privacy" className="underline text-[#38BDF8] font-bold hover:text-sky-300">
          Læs mere i vores Privatlivspolitik.
        </Link>
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
        <button 
          onClick={() => handleAction(false)}
          className="flex-1 sm:flex-none px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl transition-colors active:scale-95 border border-gray-700"
        >
          Kun nødvendige
        </button>
        <button 
          onClick={() => handleAction(true)}
          className="flex-1 sm:flex-none px-6 py-3 bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl transition-colors active:scale-95"
        >
          Forstået / OK
        </button>
      </div>
    </div>
  );
}
