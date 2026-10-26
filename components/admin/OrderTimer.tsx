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
    if (status === 'completed') {
      setTimeLeft('ΕΤΟΙΜΟ');
      setIsOverdue(false);
      return;
    }

    const calculateTime = () => {
      let targetDate = new Date(createdAt);
      
      if (!requestedTime || requestedTime === 'ASAP') {
        targetDate.setMinutes(targetDate.getMinutes() + 20);
      } else {
        // Μετατρέπουμε την τελεία (Δανέζικο format 20.44) σε άνω-κάτω τελεία (20:44)
        const cleanTime = requestedTime.replace('.', ':');
        const [hours, minutes] = cleanTime.split(':').map(Number);
        
        targetDate = new Date();
        if (!isNaN(hours) && !isNaN(minutes)) {
           targetDate.setHours(hours, minutes, 0, 0);
        } else {
           targetDate.setMinutes(targetDate.getMinutes() + 20); // Fallback αν κάτι πάει στραβά
        }
      }

      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();
      
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
        : 'bg-slate-800 border-slate-600 text-white'
    }`}>
      <span className={isOverdue ? 'animate-bounce' : ''}>⏳</span>
      {timeLeft}
    </div>
  );
}
