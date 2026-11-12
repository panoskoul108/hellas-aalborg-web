'use client';
import React, { useState, useEffect } from 'react';

export const LiveTimer = ({ createdAt }: { createdAt: string }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calc = () => setElapsed(Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / 1000));
    calc();
    const int = setInterval(calc, 60000);
    return () => clearInterval(int);
  }, [createdAt]);

  const mins = Math.floor(elapsed / 60);
  let colorClass = "text-emerald-400 bg-emerald-900/30 border-emerald-800";
  
  if (mins >= 20) colorClass = "text-red-400 bg-red-900/40 border-red-700 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.3)]";
  else if (mins >= 10) colorClass = "text-orange-400 bg-orange-900/30 border-orange-800";

  return <span className={`text-[11px] font-black px-2 py-1 rounded-lg border ${colorClass}`}>⏱️ {mins} λεπτά</span>;
};
