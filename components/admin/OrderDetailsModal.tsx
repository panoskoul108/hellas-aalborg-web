'use client';
import React from 'react';
import OrderTimer from '@/components/admin/OrderTimer';

interface OrderDetailsModalProps {
  order: any;
  onClose: () => void;
  onOpenChat: (orderId: number) => void;
  onPrintOrder: (order: any) => void;
}

export default function OrderDetailsModal({
  order,
  onClose,
  onOpenChat,
  onPrintOrder,
}: OrderDetailsModalProps) {
  if (!order) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-3 md:p-4 animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-600 w-full max-w-xl rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white italic">
              #{order.order_number || order.id.toString().slice(-4)}
            </h2>
            <span
              className={`text-[10px] md:text-xs font-bold uppercase tracking-widest px-2 py-0.5 md:py-1 rounded-md mt-1 inline-block ${
                order.status === 'pending'
                  ? 'bg-[#38BDF8]/20 text-[#38BDF8]'
                  : order.status === 'preparing'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {order.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 md:w-10 md:h-10 bg-slate-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-slate-700 shadow-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 md:mb-6 border-b border-slate-700 pb-5 md:pb-6">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                Πελατης
              </p>
              <p className="text-base md:text-lg font-black text-white">{order.customer_name}</p>
              <a
                href={`tel:${order.customer_phone}`}
                className="text-sm font-bold text-[#38BDF8] underline"
              >
                {order.customer_phone}
              </a>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                Χρονος (Ζητηθηκε)
              </p>
              <div className="flex items-center gap-3">
                <p className="text-xl md:text-2xl font-black text-[#38BDF8]">
                  {order.requested_time?.slice(0, 5)}
                </p>
                <OrderTimer
                  createdAt={order.created_at}
                  requestedTime={order.requested_time}
                  status={order.status}
                />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1.5 md:mt-2">
                Λήψη:{' '}
                {new Date(order.created_at).toLocaleTimeString('da-DK', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">
            Προϊοντα
          </h4>
          <ul className="space-y-3 md:space-y-4">
            {(order.items || []).map((it: any, i: number) => (
              <li
                key={i}
                className="flex flex-col bg-slate-900/50 p-3 md:p-4 rounded-xl border border-white/5 shadow-sm"
              >
                <div className="flex justify-between font-bold text-base md:text-lg text-white gap-2">
                  <span>
                    <span className="text-[#38BDF8] mr-1.5 md:mr-2">{it.quantity || 1}x</span>
                    {it.title_da || it.title_el || it.name}
                  </span>
                  <span className="shrink-0">
                    {(it.unit_price_dkk * (it.quantity || 1)).toFixed(0)} kr.
                  </span>
                </div>
                {it.selectedOptions?.length > 0 && (
                  <span className="text-xs md:text-sm text-gray-400 mt-1">
                    + {it.selectedOptions.map((o: any) => o.name || o).join(', ')}
                  </span>
                )}
                {it.note && (
                  <span className="text-xs md:text-sm bg-yellow-900/40 text-yellow-500 border border-yellow-700/50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg mt-2 inline-block w-fit font-bold italic">
                    📝 {it.note}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {order.notes && (
            <div className="bg-indigo-900/30 border border-indigo-800/50 p-3.5 md:p-4 rounded-xl mt-5 md:mt-6 shadow-sm">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">
                ΓΕΝΙΚΟ ΣΧΟΛΙΟ:
              </span>
              <p className="text-sm md:text-base text-indigo-100 font-bold italic">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 border-t border-slate-700 bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <div className="text-left w-full md:w-auto flex md:block justify-between items-center">
            <p className="text-xs text-gray-400 font-bold uppercase">
              Πληρωμή: {order.payment_method}
            </p>
            <p className="text-xl md:text-2xl font-black text-white">{order.total_price} kr.</p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <button
              onClick={() => {
                onOpenChat(order.id);
                onClose();
              }}
              className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs md:text-sm px-4 md:px-6 py-2.5 md:py-3 rounded-xl transition-colors shadow-lg border border-indigo-500"
            >
              💬 ΜΗΝΥΜΑ
            </button>
            <button
              onClick={() => onPrintOrder(order)}
              className="flex-1 md:flex-none bg-slate-700 text-white font-black text-xs md:text-sm px-4 md:px-6 py-2.5 md:py-3 rounded-xl hover:bg-slate-600 transition-colors shadow-lg border border-slate-600"
            >
              🖨️ ΕΚΤΥΠΩΣΗ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
