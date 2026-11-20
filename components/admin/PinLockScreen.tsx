'use client';
import React from 'react';

interface PinLockScreenProps {
  notificationSound: string;
  chatSound: string;
  enteredPin: string;
  setEnteredPin: React.Dispatch<React.SetStateAction<string>>;
  pinError: boolean;
  onPinSubmit: () => void;
}

export default function PinLockScreen({
  notificationSound,
  chatSound,
  enteredPin,
  setEnteredPin,
  pinError,
  onPinSubmit,
}: PinLockScreenProps) {
  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-4 md:p-6 text-center bg-[url('/bg.jpg')] bg-cover bg-fixed bg-center relative">
      <div className="absolute inset-0 bg-[#0B1120]/90 -z-10 backdrop-blur-sm"></div>
      <audio id="order-alert-sound" src={notificationSound} preload="auto" />
      <audio id="chat-alert-sound" src={chatSound} preload="auto" />
      <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest mb-2 shadow-black drop-shadow-md">
        HELLAS AALBORG
      </h1>
      <p className="text-[#38BDF8] font-black uppercase tracking-widest text-xs mb-6 md:mb-8">
        ΚΛΕΙΔΩΜΑ ΟΘΟΝΗΣ
      </p>
      <div
        className={`bg-slate-800/80 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border ${
          pinError ? 'border-red-500 animate-shake' : 'border-slate-600/50'
        } w-full max-w-xs backdrop-blur-md transition-colors duration-300`}
      >
        <div
          className={`mb-6 md:mb-8 h-12 md:h-14 bg-slate-900 rounded-2xl flex items-center justify-center tracking-[0.5em] text-2xl md:text-3xl font-black border shadow-inner transition-colors ${
            pinError ? 'text-red-500 border-red-500/50' : 'text-[#38BDF8] border-slate-700'
          }`}
        >
          {enteredPin.length > 0 ? (
            enteredPin.replace(/./g, '•')
          ) : (
            <span className="text-slate-700 tracking-normal text-sm">PIN CODE</span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2.5 md:gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => {
                if (enteredPin.length < 8) setEnteredPin((prev) => prev + num);
              }}
              className="bg-slate-700 hover:bg-slate-600 text-white text-xl md:text-2xl font-black rounded-2xl aspect-square active:scale-90 transition-all shadow-md border border-slate-600"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setEnteredPin('')}
            className="bg-red-900/40 hover:bg-red-500 text-red-400 hover:text-white text-base md:text-lg font-black rounded-2xl aspect-square active:scale-90 transition-all shadow-md border border-red-900/50"
          >
            C
          </button>
          <button
            onClick={() => {
              if (enteredPin.length < 8) setEnteredPin((prev) => prev + '0');
            }}
            className="bg-slate-700 hover:bg-slate-600 text-white text-xl md:text-2xl font-black rounded-2xl aspect-square active:scale-90 transition-all shadow-md border border-slate-600"
          >
            0
          </button>
          <button
            onClick={onPinSubmit}
            className="bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] text-xl md:text-2xl font-black rounded-2xl aspect-square active:scale-90 transition-all shadow-md border border-sky-400"
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}
