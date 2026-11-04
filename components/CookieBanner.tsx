'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Ελέγχει αν ο πελάτης έχει ήδη πατήσει OK στο παρελθόν
    const hasAccepted = localStorage.getItem('hellas_cookie_consent');
    if (!hasAccepted) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('hellas_cookie_consent', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white p-4 sm:p-6 z-[9999] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] animate-slide-up">
      <div className="text-xs sm:text-sm font-medium opacity-90 leading-relaxed max-w-4xl">
        Vi bruger kun nødvendige cookies (lokal lagring) for at få takeaway-kurven til at fungere og for at beskytte mod spam. 
        Ved at bruge siden accepterer du dette. <br className="hidden sm:block"/>
        Læs vores{' '}
        <Link href="/privacy" className="underline text-sky-400 font-bold hover:text-sky-300">
          Privatlivspolitik
        </Link>{' '}
        for mere information.
      </div>
      <button 
        onClick={acceptCookies}
        className="w-full sm:w-auto px-8 py-3 bg-sky-500 hover:bg-sky-400 text-gray-900 font-black text-xs uppercase tracking-widest rounded-xl transition-colors shrink-0 active:scale-95"
      >
        FORSTÅET (Κατάλαβα)
      </button>
    </div>
  );
}
