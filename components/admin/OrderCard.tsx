'use client';
import React from 'react';

export const OrderCard = ({ order, onAccept, onPrint, onComplete, onView }: any) => {
  const items = order.items || [];
  const isPending = order.status === 'pending';
  const isPreparing = order.status === 'preparing';
  
  const isASAP = order.requested_time === 'ASAP' || order.requested_time?.includes('Hurtigst') || !order.requested_time;
  
  // Κρύβουμε τα δευτερόλεπτα από το UI (π.χ. 20:45)
  const displayTime = order.requested_time ? order.requested_time.slice(0, 5) : '';

  // Δημιουργία πίνακα με τα λεπτά από 2 έως 30 (για το Slider)
  const customMinutes = Array.from({ length: 29 }, (_, i) => i + 2);

  return (
    <div className={`bg-slate-800 border rounded-2xl p-5 shadow-lg relative overflow-hidden ${isPending ? "border-[#38BDF8]/50" : "border-orange-500/50"}`}>
      {order.discount_dkk > 0 && <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-md">🎁 Loyalty</div>}

      <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3">
        <div>
          <h3 className="text-2xl font-black text-white italic">#{order.order_number || order.id.toString().slice(-4)}</h3>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Πελάτης: <span className="text-white">{order.customer_name}</span> ({order.customer_phone})</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={onView} className="bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-md transition-colors border border-gray-600 mt-1 shadow-sm">
            👁️ ΠΡΟΒΟΛΗ
          </button>
        </div>
      </div>

      <ul className="space-y-2 mb-5">
        {items.slice(0, 2).map((it: any, i: number) => (
          <li key={i} className="flex flex-col text-sm">
            <div className="flex justify-between font-bold text-gray-200">
              <span className="truncate pr-2"><span className="text-[#38BDF8] mr-2">{it.quantity || 1}x</span>{it.title_da || it.title_el || it.name}</span>
            </div>
            {it.selectedOptions?.length > 0 && <span className="text-[10px] text-gray-400 ml-6 truncate block">+ {it.selectedOptions.map((o:any) => o.name || o).join(', ')}</span>}
          </li>
        ))}
        {items.length > 2 && (
          <li className="text-xs text-gray-500 font-bold italic ml-6 mt-1">+ {items.length - 2} ακόμη είδη (Δείτε Προβολή)</li>
        )}
      </ul>

      {isPending && (
        <div className="border-t border-slate-700 pt-4 flex flex-col gap-3">
          <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Ζητηθηκε: <span className="text-white text-sm">{displayTime || 'ASAP'}</span></span>
             <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-widest block">Σύνολο: {order.total_price} kr.</span>
          </div>
          
          {isASAP ? (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ΕΠΙΛΟΓΗ ΧΡΟΝΟΥ (ΣΕΡΝΕΤΕ 👈👉):</span>
              
              {/* --- SLIDER 2 ΕΩΣ 30 ΛΕΠΤΑ --- */}
              <div className="flex overflow-x-auto gap-2 pb-3 pt-1 px-1 no-scrollbar snap-x touch-pan-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {customMinutes.map((mins) => (
                  <button 
                    key={mins} 
                    onClick={() => onAccept(null, mins)} 
                    className="shrink-0 w-12 h-12 bg-slate-700 hover:bg-[#38BDF8] hover:text-[#0B1120] text-white hover:border-[#38BDF8] font-black text-sm rounded-2xl shadow-md active:scale-95 transition-all snap-center border border-slate-600 flex items-center justify-center"
                  >
                    {mins}'
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-1">
              <button onClick={() => onAccept(order.requested_time, 0)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0B1120] font-black text-sm uppercase rounded-xl py-3 shadow-md active:scale-95 transition-transform">
                ✅ ΑΠΟΔΟΧΗ ΓΙΑ {displayTime}
              </button>
              
              <div className="flex flex-col mt-3 border-t border-slate-700 pt-3">
                <span className="text-[9px] text-gray-500 font-bold uppercase mb-2">Η ΑΛΛΑΓΗ (ΣΕΡΝΕΤΕ 👈👉):</span>
                {/* --- SLIDER 2 ΕΩΣ 30 ΛΕΠΤΑ ΓΙΑ ΑΛΛΑΓΗ ΩΡΑΣ --- */}
                <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar snap-x touch-pan-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {customMinutes.map((mins) => (
                    <button 
                      key={mins} 
                      onClick={() => onAccept(null, mins)} 
                      className="shrink-0 w-10 h-10 bg-slate-800 hover:bg-orange-500 text-gray-400 hover:text-black hover:border-orange-500 font-black text-xs rounded-xl shadow-sm active:scale-95 transition-all snap-center border border-slate-700 flex items-center justify-center"
                    >
                      {mins}'
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isPreparing && (
        <div className="flex items-center justify-between border-t border-slate-700 pt-4 mt-auto">
          <div>
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Πληρωμή ({order.payment_method})</span>
            <span className="text-xl font-black text-white">{order.total_price?.toFixed(2)} kr.</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onPrint} className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center text-xl transition-colors shadow-md active:scale-95">🖨️</button>
            <button onClick={onComplete} className="px-6 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase transition-colors shadow-md active:scale-95 tracking-wider">✅ ΕΤΟΙΜΗ</button>
          </div>
        </div>
      )}
    </div>
  );
};
