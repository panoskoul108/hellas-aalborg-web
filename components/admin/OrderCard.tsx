'use client';
import React from 'react';
import { LiveTimer } from '../shared/LiveTimer';

export const OrderCard = ({ order, onAccept, onPrint, onComplete, onView }: any) => {
  const items = order.items || [];
  const isPending = order.status === 'pending';
  const isPreparing = order.status === 'preparing';

  // Ελέγχουμε αν ζήτησε ASAP ή συγκεκριμένη ώρα (π.χ. 20:30)
  const isASAP = order.requested_time === 'ASAP' || order.requested_time?.includes('Hurtigst') || !order.requested_time;

  return (
    <div className={`bg-slate-800 border rounded-2xl p-5 shadow-lg relative overflow-hidden ${isPending ? "border-[#38BDF8]/50" : "border-orange-500/50"}`}>
      {order.discount_dkk > 0 && <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-md">🎁 Loyalty</div>}

      <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3">
        <div>
          <h3 className="text-2xl font-black text-white italic">#{order.order_number || order.id.toString().slice(-4)}</h3>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Πελάτης: <span className="text-white">{order.customer_name}</span> ({order.customer_phone})</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isPending && <LiveTimer createdAt={order.created_at} />}
          {isPreparing && (
            <span className="bg-orange-500 text-[#0B1120] text-xs font-black px-3 py-1.5 rounded-lg uppercase shadow-md flex items-center gap-1 border-2 border-orange-400">
              🕒 ΠΑΡΑΛΑΒΗ: {order.requested_time}
            </span>
          )}
          <button onClick={onView} className="bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-md transition-colors border border-gray-600 mt-1">
            👁️ ΠΡΟΒΟΛΗ
          </button>
        </div>
      </div>

      {/* Περιληπτική Λίστα - Μόνο τα 2 πρώτα είδη (τα υπόλοιπα στο Modal) */}
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

      {/* FOOTER ΓΙΑ "ΝΕΕΣ ΠΑΡΑΓΓΕΛΙΕΣ" */}
      {isPending && (
        <div className="border-t border-slate-700 pt-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Ζητηθηκε: <span className="text-white text-sm">{order.requested_time}</span></span>
            <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-widest block">Σύνολο: {order.total_price} kr.</span>
          </div>
          
          {isASAP ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-1">
              {[5, 7, 10, 12, 15, 20].map((mins) => (
                <button key={mins} onClick={() => onAccept(null, mins)} className="bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black text-sm rounded-xl py-2.5 shadow-md active:scale-95 transition-transform">
                  {mins}'
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-1">
              {/* Αν ζήτησε συγκεκριμένη ώρα, μεγάλο κουμπί Αποδοχής για ΕΚΕΙΝΗ την ώρα */}
              <button onClick={() => onAccept(order.requested_time, 0)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0B1120] font-black text-sm uppercase rounded-xl py-3 shadow-md active:scale-95 transition-transform">
                ✅ ΑΠΟΔΟΧΗ ΓΙΑ {order.requested_time}
              </button>
              <div className="flex justify-between items-center mt-2 border-t border-slate-700 pt-2">
                <span className="text-[9px] text-gray-500 font-bold uppercase">Ή αλλαγη (λεπτα απο τωρα):</span>
                <div className="flex gap-1">
                  {[10, 15, 20, 30].map(mins => (
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

      {/* FOOTER ΓΙΑ "ΣΕ ΠΡΟΕΤΟΙΜΑΣΙΑ" */}
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
