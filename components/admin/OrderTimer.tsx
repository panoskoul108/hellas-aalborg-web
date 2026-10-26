'use client';
import React, { useState, useEffect } from 'react';

interface OrderTimerProps {
  createdAt: string;
  requestedTime: string;
  status: string;
}

export default function OrderTimer({ createdAt, requestedTime, status }: OrderTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('--:--');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    // Αν η παραγγελία ολοκληρώθηκε, σταματάμε το χρονόμετρο
    if (status === 'completed') {
      setTimeLeft('ΕΤΟΙΜΟ');
      setIsOverdue(false);
      return;
    }

    const calculateTime = () => {
      let targetDate = new Date(createdAt);
      
      if (requestedTime === 'ASAP' || !requestedTime) {
        // ASAP: Στόχος 20 λεπτά μετά τη δημιουργία της παραγγελίας
        targetDate.setMinutes(targetDate.getMinutes() + 20);
      } else {
        // Συγκεκριμένη ώρα (π.χ. "18:45")
        const [hours, minutes] = requestedTime.split(':').map(Number);
        targetDate = new Date(); // Σημερινή μέρα
        targetDate.setHours(hours, minutes, 0, 0);
      }

      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        // Καθυστέρηση (Κόκκινο αρνητικό)
        setIsOverdue(true);
        const absDiff = Math.abs(diffMs);
        const mins = Math.floor(absDiff / 60000);
        const secs = Math.floor((absDiff % 60000) / 1000);
        setTimeLeft(`-${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      } else {
        // Κανονική αντίστροφη μέτρηση
        setIsOverdue(false);
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    calculateTime(); // Άμεσος υπολογισμός για να μην περιμένουμε 1 δευτερόλεπτο
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
        : 'bg-slate-800 border-slate-600 text-white'
    }`}>
      <span className={isOverdue ? 'animate-bounce' : ''}>⏳</span>
      {timeLeft}
    </div>
  );
}
