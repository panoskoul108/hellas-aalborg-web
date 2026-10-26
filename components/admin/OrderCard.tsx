'use client';
import React, { useState } from 'react';

export const OrderCard = ({ order, onAccept, onPrint, onComplete, onView }: any) => {
  const items = order.items || [];
  const isPending = order.status === 'pending';
  const isPreparing = order.status === 'preparing';
  
  // State για το Custom Input
  const [customMins, setCustomMins] = useState('');

  const isASAP = order.requested_time === 'ASAP' || order.requested_time?.includes('Hurtigst') || !order.requested_time;
  
  // Κρύβουμε τα δευτερόλεπτα από το UI
  const displayTime = order.requested_time ? order.requested_time.slice(0, 5) : '';

  return (
    <div className={`bg-slate-800 border rounded-2xl p-5 shadow-lg relative overflow-hidden ${isPending ? "border-[#38BDF8]/50" : "border-orange-500/50"}`}>
      {order.discount_dkk > 0 && <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-md">🎁 Loyalty</div>}

      <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3">
        <div>
          <h3 className="text-2xl font-black text-white italic">#{order.order_number || order.id.toString().slice(-4)}</h3>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Πελάτης: <span className="text-white">{order.customer_name}</span> ({order.customer_phone})</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={onView} className="bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-md transition-colors border border-gray-600 mt-1">
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
          <div className="flex justify-between items-center">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Ζητηθηκε: <span className="text-white text-sm">{displayTime || 'ASAP'}</span></span>
             <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-widest block">Σύνολο: {order.total_price} kr.</span>
          </div>
          
          {isASAP ? (
            <div className="flex flex-wrap gap-2 mt-1">
              {[5, 10, 15, 20].map((mins) => (
                <button key={mins} onClick={() => onAccept(null, mins)} className="flex-1 min-w-[2.5rem] bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black text-sm rounded-xl py-2.5 shadow-md active:scale-95 transition-transform">
                  {mins}'
                </button>
              ))}
              <div className="flex flex-1 min-w-[5.5rem] gap-1">
                <input 
                  type="number" 
                  placeholder="Λεπτά" 
                  value={customMins} 
                  onChange={e => setCustomMins(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl text-center font-bold text-sm outline-none focus:border-[#38BDF8] px-1" 
                />
                <button onClick={() => customMins && onAccept(null, Number(customMins))} className="bg-emerald-500 text-[#0B1120] font-black px-2 rounded-xl shadow-md hover:bg-emerald-400">✓</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-1">
              <button onClick={() => onAccept(order.requested_time, 0)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0B1120] font-black text-sm uppercase rounded-xl py-3 shadow-md active:scale-95 transition-transform">
                ✅ ΑΠΟΔΟΧΗ ΓΙΑ {displayTime}
              </button>
              <div className="flex justify-between items-center mt-2 border-t border-slate-700 pt-2">
                <span className="text-[9px] text-gray-500 font-bold uppercase">Ή αλλαγη (λεπτα):</span>
                <div className="flex gap-1">
                  {[10, 15, 20].map(mins => (
                    <button key={mins} onClick={() => onAccept(null, mins)} className="bg-slate-700 text-gray-300 text-[10px] font-bold px-2 py-1 rounded hover:bg-slate-600">
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
