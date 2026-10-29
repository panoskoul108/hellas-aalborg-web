'use client';
import React, { useState } from 'react';

export const OrderCard = ({ order, onAccept, onPrint, onComplete, onView }: any) => {
  const items = order.items || [];
  const isPending = order.status === 'pending';
  const isPreparing = order.status === 'preparing';
  
  const isASAP = order.requested_time === 'ASAP' || order.requested_time?.includes('Hurtigst') || !order.requested_time;
  const displayTime = order.requested_time ? order.requested_time.slice(0, 5) : '';

  // STATE ΓΙΑ ΤΟ "CUSTOM" ΚΟΥΜΠΙ
  const [showCustom, setShowCustom] = useState(false);
  const customMinutes = Array.from({ length: 30 }, (_, i) => i + 1); 

  return (
    // Αφαιρέσαμε το h-full και βάλαμε h-auto για να μεγαλώνει ελεύθερα
    <div className={`bg-slate-800 border rounded-xl p-3 shadow-md flex flex-col h-auto relative overflow-hidden ${isPending ? "border-[#38BDF8]/50" : "border-orange-500/50"}`}>
      {order.discount_dkk > 0 && <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-lg shadow-sm z-10">🎁 Loyalty</div>}

      {/* HEADER: Αριθμός, Πελάτης, Προβολή */}
      <div className="flex justify-between items-start mb-2 border-b border-slate-700 pb-2 shrink-0">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-xl font-black text-white italic truncate">#{order.order_number || order.id.toString().slice(-4)}</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase truncate">
            <span className="text-gray-200">{order.customer_name}</span> <span className="opacity-70">({order.customer_phone})</span>
          </p>
        </div>
        <button onClick={onView} className="bg-gray-700 hover:bg-gray-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md transition-colors border border-gray-600 shrink-0">
          👁️ ΠΡΟΒΟΛΗ
        </button>
      </div>

      {/* ΛΙΣΤΑ ΠΡΟΪΟΝΤΩΝ: Χωρίς scroll, ψηλώνει φυσικά */}
      <ul className="space-y-1.5 mb-3 flex-1">
        {items.map((it: any, i: number) => (
          <li key={i} className="flex flex-col text-sm border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
            <div className="flex justify-between items-start font-bold text-gray-200 leading-tight">
              <span className="flex-1 pr-2 break-words">
                <span className="text-[#38BDF8] mr-1.5">{it.quantity || 1}x</span>{it.title_da || it.title_el || it.name}
              </span>
            </div>
            {/* Options */}
            {it.selectedOptions?.length > 0 && (
              <span className="text-[10px] text-gray-400 ml-5 block leading-tight mt-0.5">
                + {it.selectedOptions.map((o:any) => o.name || o).join(', ')}
              </span>
            )}
            {/* Σχόλιο Είδους */}
            {it.note && (
              <span className="text-[10px] text-yellow-500 font-bold italic ml-5 mt-0.5 bg-yellow-500/10 px-1.5 py-0.5 rounded-md inline-block w-fit">
                📝 {it.note}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Γενικό Σχόλιο Παραγγελίας (Αν υπάρχει) */}
      {order.notes && (
         <div className="text-[10px] font-bold italic text-indigo-300 bg-indigo-900/30 p-1.5 rounded-lg mb-3 shrink-0 border border-indigo-500/30">
           <span className="uppercase text-indigo-400 block mb-0.5 text-[9px]">ΣΧΟΛΙΟ ΠΕΛΑΤΗ:</span>
           {order.notes}
         </div>
      )}

      {/* FOOTER: Ενέργειες ανάλογα με το Status */}
      {isPending && (
        <div className="border-t border-slate-700 pt-2 shrink-0">
          <div className="flex justify-between items-center mb-1.5">
             <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Ζητηθηκε: <span className="text-white">{displayTime || 'ASAP'}</span></span>
             <span className="text-[10px] font-black text-[#38BDF8]">{order.total_price} kr.</span>
          </div>
          
          {isASAP ? (
            <div className="flex flex-col gap-1.5">
              {!showCustom ? (
                <div className="flex gap-1.5">
                  {[5, 10, 15, 20].map((mins) => (
                    <button key={mins} onClick={() => onAccept(null, mins)} className="flex-1 bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black text-xs rounded-lg py-2 shadow-sm active:scale-95 transition-transform">
                      {mins}'
                    </button>
                  ))}
                  <button onClick={() => setShowCustom(true)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-black text-[10px] rounded-lg py-2 shadow-sm active:scale-95 transition-transform border border-slate-500">
                    CUSTOM
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 animate-fade-in bg-slate-900/50 p-1.5 rounded-lg border border-slate-700">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">ΕΠΙΛΕΞΤΕ ΛΕΠΤΑ (👈👉):</span>
                    <button onClick={() => setShowCustom(false)} className="text-red-400 hover:text-red-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-500/30">✕ ΠΙΣΩ</button>
                  </div>
                  <div className="flex overflow-x-auto gap-1.5 pb-1 no-scrollbar snap-x touch-pan-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {customMinutes.map((mins) => (
                      <button key={mins} onClick={() => onAccept(null, mins)} className="shrink-0 w-12 h-12 bg-slate-700 hover:bg-[#38BDF8] hover:text-[#0B1120] text-white hover:border-[#38BDF8] font-black text-sm rounded-2xl shadow-md active:scale-95 transition-all snap-center border border-slate-600 flex items-center justify-center">
                        {mins}'
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <button onClick={() => onAccept(order.requested_time, 0)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0B1120] font-black text-xs uppercase rounded-lg py-2 shadow-sm active:scale-95 transition-transform">
                ✅ ΑΠΟΔΟΧΗ ΓΙΑ {displayTime}
              </button>
              
              <div className="flex flex-col mt-1 border-t border-slate-700 pt-1.5">
                {!showCustom ? (
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">ΑΛΛΑΓΗ:</span>
                    <div className="flex gap-1">
                      {[10, 15, 20].map(mins => (
                        <button key={mins} onClick={() => onAccept(null, mins)} className="bg-slate-700 hover:bg-slate-600 text-gray-200 text-[10px] font-bold px-2.5 py-1.5 rounded-md">
                          {mins}'
                        </button>
                      ))}
                      <button onClick={() => setShowCustom(true)} className="bg-slate-800 text-[#38BDF8] border border-[#38BDF8]/30 hover:bg-slate-700 text-[9px] font-bold px-2 py-1.5 rounded-md">
                        CUSTOM
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 animate-fade-in bg-slate-900/50 p-1.5 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">ΑΛΛΑΓΗ ΩΡΑΣ (👈👉):</span>
                      <button onClick={() => setShowCustom(false)} className="text-red-400 hover:text-red-300 text-[9px] font-black px-1.5 py-0.5 rounded border border-red-500/30">✕ ΠΙΣΩ</button>
                    </div>
                    <div className="flex overflow-x-auto gap-1.5 pb-1 no-scrollbar snap-x touch-pan-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {customMinutes.map((mins) => (
                        <button key={mins} onClick={() => onAccept(null, mins)} className="shrink-0 w-9 h-9 bg-slate-800 hover:bg-orange-500 text-gray-400 hover:text-black hover:border-orange-500 font-black text-xs rounded-lg shadow-sm active:scale-95 transition-all snap-center border border-slate-700 flex items-center justify-center">
                          {mins}'
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isPreparing && (
        <div className="flex items-center justify-between border-t border-slate-700 pt-2 shrink-0 mt-2">
          <div>
            <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">Πληρωμή ({order.payment_method})</span>
            <span className="text-lg font-black text-white">{order.total_price?.toFixed(2)} kr.</span>
          </div>
          <div className="flex gap-1.5">
            <button onClick={onPrint} className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-lg transition-colors shadow-sm active:scale-95 border border-slate-600">🖨️</button>
            <button onClick={onComplete} className="px-4 h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black text-[11px] uppercase transition-colors shadow-sm active:scale-95 tracking-wider border border-emerald-500">✅ ΕΤΟΙΜΗ</button>
          </div>
        </div>
      )}
    </div>
  );
};
