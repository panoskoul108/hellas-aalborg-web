'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
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
    // Είτε αποδεχτεί είτε "απορρίψει" (που σημαίνει ότι κρατάμε μόνο τα τεχνικά απαραίτητα), 
    // αποθηκεύουμε την επιλογή για να μην ξαναεμφανιστεί.
    localStorage.setItem('hellas_cookie_consent', accepted ? 'true' : 'minimal');
    setShowBanner(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:max-w-sm bg-slate-900 border border-slate-700 p-5 rounded-2xl shadow-2xl z-[100]">
      <div className="text-xs sm:text-sm font-medium opacity-90 leading-relaxed max-w-4xl">
        Vi bruger udelukkende nødvendige cookies (lokal lagring) for at få din takeaway-bestilling og kurv til at fungere. Vi bruger ikke tracking eller marketing-cookies.{' '}
        <Link href="/privacy" className="underline text-sky-400 font-bold hover:text-sky-300">
          Læs mere i vores Privatlivspolitik.
        </Link>
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
        <button 
          onClick={() => handleAction(false)}
          className="flex-1 sm:flex-none px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors active:scale-95 border border-gray-700"
        >
          Kun nødvendige
        </button>
        <button 
          onClick={() => handleAction(true)}
          className="flex-1 sm:flex-none px-6 py-3 bg-sky-500 hover:bg-sky-400 text-gray-900 font-black text-xs uppercase tracking-widest rounded-xl transition-colors active:scale-95"
        >
          Forstået / OK
        </button>
      </div>
    </div>
  );
}
