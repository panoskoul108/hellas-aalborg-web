'use client';
import React from 'react';
import { LiveTimer } from '../shared/LiveTimer';

export const OrderCard = ({ order, onAccept, onPrint, onComplete }: any) => {
  const items = order.items || [];
  const isPending = order.status === 'pending';
  const isPreparing = order.status === 'preparing';

  return (
    <div className={`bg-slate-800 border rounded-2xl p-5 shadow-lg relative overflow-hidden ${isPending ? "border-[#38BDF8]/50" : "border-orange-500/50"}`}>
      {order.discount_dkk > 0 && <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-md">🎁 Loyalty</div>}

      <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3">
        <div>
          <h3 className="text-2xl font-black text-white italic">#{order.order_number || order.id.toString().slice(-4)}</h3>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Πελάτης: <span className="text-white">{order.customer_name}</span> ({order.customer_phone})</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LiveTimer createdAt={order.created_at} />
          {isPreparing && (
            <span className="bg-orange-500 text-[#0B1120] text-xs font-black px-3 py-1.5 rounded-lg uppercase shadow-md flex items-center gap-1 border-2 border-orange-400">
              🕒 ΠΑΡΑΛΑΒΗ: {order.requested_time}
            </span>
          )}
          {isPending && (
             <span className="text-gray-400 text-[10px] font-bold uppercase">Ζητήθηκε: {order.requested_time}</span>
          )}
        </div>
      </div>

      <ul className="space-y-2 mb-5">
        {items.map((it: any, i: number) => (
          <li key={i} className="flex flex-col text-sm">
            <div className="flex justify-between font-bold text-gray-200">
              <span><span className="text-[#38BDF8] mr-2 text-lg">{it.quantity || 1}x</span>{it.title_da || it.title_el || it.name}</span>
              <span>{(it.unit_price_dkk * (it.quantity || 1)).toFixed(0)} kr.</span>
            </div>
            {it.selectedOptions?.length > 0 && <span className="text-xs text-gray-400 ml-6 block mt-0.5">+ {it.selectedOptions.map((o:any) => o.name || o).join(', ')}</span>}
            {it.note && <span className="text-xs bg-yellow-900/40 text-yellow-500 border border-yellow-700/50 px-2 py-1 rounded-md mt-1 ml-6 inline-block w-fit font-bold italic">📝 {it.note}</span>}
          </li>
        ))}
      </ul>

      {order.notes && (
        <div className="bg-indigo-900/30 border border-indigo-800/50 p-3 rounded-xl mb-4">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">ΓΕΝΙΚΟ ΣΧΟΛΙΟ:</span>
          <p className="text-sm text-indigo-100 font-bold italic">{order.notes}</p>
        </div>
      )}

      {isPending && (
        <div className="border-t border-slate-700 pt-4 flex flex-col gap-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Σύνολο: {order.total_price} DKK ({order.payment_method})</span>
            <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-widest block">ΑΠΟΔΟΧΗ ΣΕ (ΛΕΠΤΑ):</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[5, 7, 10, 12, 15, 20].map((mins) => (
              <button key={mins} onClick={() => onAccept(mins)} className="bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black text-base rounded-xl py-3 shadow-md active:scale-95 transition-transform">
                {mins}'
              </button>
            ))}
          </div>
        </div>
      )}

      {isPreparing && (
        <div className="flex items-center justify-between border-t border-slate-700 pt-4">
          <div>
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Πληρωμή ({order.payment_method})</span>
            <span className="text-xl font-black text-white">{order.total_price?.toFixed(2)} DKK</span>
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
