'use client';
import React, { useState, useEffect, useRef } from 'react';

interface OrderTimerProps {
  createdAt: string;
  requestedTime: string;
  status: string;
}

export default function OrderTimer({ createdAt, requestedTime, status }: OrderTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('--:--');
  const [isOverdue, setIsOverdue] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Κρατάμε το σφάλμα (διαφορά χρόνου Server/Υπολογιστή) στη μνήμη
  const offsetRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === 'completed') {
      setTimeLeft('ΕΤΟΙΜΟ');
      setIsOverdue(false);
      setIsPending(false);
      return;
    }

    // Υπολογισμός του Clock Drift μόνο την πρώτη φορά που φορτώνει
    if (offsetRef.current === null) {
      const initialDiff = Date.now() - new Date(createdAt).getTime();
      offsetRef.current = (initialDiff > 0 && initialDiff < 30000) ? initialDiff : 0;
    }

    const calculateTime = () => {
      const now = new Date();
      // Κόβουμε τα milliseconds για να ξεκινάει το χρονόμετρο σε ακριβή δευτερόλεπτα (π.χ. 01:00 αντί για 00:59)
      const nowMs = Math.floor(now.getTime() / 1000) * 1000; 
      // Ο χρόνος αν αφαιρέσουμε το σφάλμα του Server
      const adjustedNowMs = nowMs - (offsetRef.current || 0);

      // --- ΣΕΝΑΡΙΟ 1: ΝΕΑ ΠΑΡΑΓΓΕΛΙΑ (Pending) ---
      if (status === 'pending') {
        setIsPending(true);
        const createdDate = new Date(createdAt);
        
        // Χρησιμοποιούμε το 'adjustedNowMs' γιατί η παραγγελία έρχεται από τον Server
        let diffMs = adjustedNowMs - createdDate.getTime();
        if (diffMs < 0) diffMs = 0; // Αποτροπή αρνητικού χρόνου
        
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setTimeLeft(`+${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        
        if (mins >= 5) setIsOverdue(true);
        else setIsOverdue(false);
        return;
      }

      // --- ΣΕΝΑΡΙΟ 2: ΣΕ ΠΡΟΕΤΟΙΜΑΣΙΑ (Preparing) ---
      setIsPending(false);
      let targetDate = new Date();
      let diffMs = 0;

      if (!requestedTime || requestedTime === 'ASAP' || requestedTime.includes('Hurtigst')) {
        targetDate = new Date(createdAt);
        targetDate.setMinutes(targetDate.getMinutes() + 20);
        // Το ASAP βασίζεται στον χρόνο δημιουργίας του Server, άρα αφαιρούμε το offset
        diffMs = targetDate.getTime() - adjustedNowMs; 
      } else {
        const cleanTime = requestedTime.replace('.', ':');
        const parts = cleanTime.split(':').map(Number);
        const hours = parts[0];
        const minutes = parts[1];
        const seconds = parts.length > 2 ? parts[2] : 0;
        
        if (!isNaN(hours) && !isNaN(minutes)) {
          targetDate.setHours(hours, minutes, seconds, 0); 
          
          // ΕΔΩ ΕΙΝΑΙ Η ΛΥΣΗ: Η ώρα "1 λεπτό" φτιάχτηκε μόλις τώρα από το ρολόι του υπολογιστή σου!
          // Άρα συγκρίνουμε με τον ΚΑΝΟΝΙΚΟ χρόνο (nowMs) χωρίς να μπλέκουμε τον Server.
          diffMs = targetDate.getTime() - nowMs;
        } else {
          targetDate = new Date(createdAt);
          targetDate.setMinutes(targetDate.getMinutes() + 20);
          diffMs = targetDate.getTime() - adjustedNowMs;
        }
      }

      if (diffMs <= 0) {
        setIsOverdue(true);
        const absDiff = Math.abs(diffMs);
        const mins = Math.floor(absDiff / 60000);
        const secs = Math.floor((absDiff % 60000) / 1000);
        setTimeLeft(`-${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      } else {
        setIsOverdue(false);
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    calculateTime(); 
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [createdAt, requestedTime, status]);

  if (status === 'completed') {
    return <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md uppercase tracking-wider">✓ Ολοκληρωθηκε</span>;
  }

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-black text-sm transition-colors shadow-sm ${
      isOverdue 
        ? 'bg-red-900/40 border-red-500 text-red-400 animate-pulse' 
        : isPending 
          ? 'bg-blue-900/30 border-blue-500 text-blue-400' 
          : 'bg-slate-800 border-slate-600 text-white' 
    }`}>
      <span className={isOverdue ? 'animate-bounce' : ''}>
        {isPending ? '🔔' : '⏳'}
      </span>
      {timeLeft}
    </div>
  );
}
