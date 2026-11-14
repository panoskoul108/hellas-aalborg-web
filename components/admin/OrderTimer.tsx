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

  // ΠΡΟΣΘΗΚΗ: Κρατάμε το σφάλμα (διαφορά χρόνου) στη μνήμη χωρίς να προκαλούμε re-renders
  const offsetRef = useRef<number | null>(null);

  useEffect(() => {
    if (status === 'completed') {
      setTimeLeft('ΕΤΟΙΜΟ');
      setIsOverdue(false);
      setIsPending(false);
      return;
    }

    // ΠΡΟΣΘΗΚΗ: Υπολογισμός του Clock Drift μόνο την πρώτη φορά που φορτώνει
    if (offsetRef.current === null) {
      const initialDiff = Date.now() - new Date(createdAt).getTime();
      // Αν η διαφορά είναι κάτω από 30 δευτερόλεπτα, φταίει η καθυστέρηση του δικτύου / ρολογιού.
      // Αποθηκεύουμε το σφάλμα για να το αφαιρούμε συνεχώς.
      offsetRef.current = (initialDiff > 0 && initialDiff < 30000) ? initialDiff : 0;
    }

    const calculateTime = () => {
      const now = new Date();
      // ΔΙΟΡΘΩΣΗ: Αφαιρούμε το σφάλμα για να συγχρονιστούμε με το Supabase
      const adjustedNowMs = now.getTime() - (offsetRef.current || 0);

      if (status === 'pending') {
        setIsPending(true);
        const createdDate = new Date(createdAt);
        
        let diffMs = adjustedNowMs - createdDate.getTime();
        if (diffMs < 0) diffMs = 0; // Αποτροπή αρνητικού χρόνου (-00:01)
        
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setTimeLeft(`+${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        
        if (mins >= 5) setIsOverdue(true);
        else setIsOverdue(false);
        return;
      }

      setIsPending(false);
      let targetDate = new Date();

      if (!requestedTime || requestedTime === 'ASAP' || requestedTime.includes('Hurtigst')) {
        targetDate = new Date(createdAt);
        targetDate.setMinutes(targetDate.getMinutes() + 20);
      } else {
        const cleanTime = requestedTime.replace('.', ':');
        // Διαβάζει πλέον Ώρες, Λεπτά ΚΑΙ Δευτερόλεπτα
        const parts = cleanTime.split(':').map(Number);
        const hours = parts[0];
        const minutes = parts[1];
        const seconds = parts.length > 2 ? parts[2] : 0;
        
        if (!isNaN(hours) && !isNaN(minutes)) {
          targetDate.setHours(hours, minutes, seconds, 0); 
        } else {
          targetDate = new Date(createdAt);
          targetDate.setMinutes(targetDate.getMinutes() + 20);
        }
      }

      // Χρησιμοποιούμε το διορθωμένο "Τώρα" (adjustedNowMs) και στην αντίστροφη μέτρηση
      const diffMs = targetDate.getTime() - adjustedNowMs;
      
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
