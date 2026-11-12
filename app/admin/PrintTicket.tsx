'use client';
import React, { useEffect } from 'react';

export const PrintTicket = ({ order, storeName, onPrintDone }: any) => {
  useEffect(() => {
    if (order) {
      // Μικρή καθυστέρηση για να προλάβει ο browser να φορτώσει το HTML
      const timer = setTimeout(() => {
        window.print();
        if (onPrintDone) onPrintDone();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [order, onPrintDone]);

  if (!order) return null;

  return (
    <div className="w-[80mm] bg-white text-black p-4 text-sm font-mono font-bold print:block">
      {/* HEADER */}
      <div className="text-center text-xl font-black mb-1">{storeName}</div>
      <div className="text-center text-xs mb-4 border-b-2 border-black pb-2">
        Takeaway Order #{order.order_number || order.id.toString().slice(-4)}<br/>
        {new Date(order.created_at).toLocaleString('el-GR')}
      </div>
      
      {/* ΠΕΛΑΤΗΣ */}
      <div className="mb-4 text-sm">
        <div className="uppercase">Name: {order.customer_name}</div>
        <div className="uppercase">Tel: {order.customer_phone}</div>
        <div className="mt-2 text-lg font-black uppercase border border-black p-1 text-center">
          TIME: {order.requested_time}
        </div>
      </div>

      {/* ΠΡΟΪΟΝΤΑ (ΟΛΑ ΜΑΖΙ) */}
      <div className="border-t-2 border-b-2 border-black py-3 mb-4">
        {order.items?.map((it: any, i: number) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between font-black text-base">
              <span className="uppercase">{it.quantity}x {it.title_da || it.title_el || it.name}</span>
              <span>{(it.unit_price_dkk * it.quantity).toFixed(0)} kr.</span>
            </div>
            {/* Extras / Υλικά */}
            {it.selectedOptions?.length > 0 && (
              <div className="text-[11px] pl-4 mt-0.5 uppercase">
                + {it.selectedOptions.join(', ')}
              </div>
            )}
            {/* Σχόλιο Προϊόντος */}
            {it.note && (
              <div className="text-[11px] pl-4 mt-0.5 italic">
                * Note: {it.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ΣΥΝΟΛΑ */}
      <div className="flex justify-between text-lg font-black mt-2">
        <span className="uppercase">TOTAL ({order.payment_method === 'ΚΑΡΤΑ' ? 'CARD' : 'CASH'}):</span>
        <span>{order.total_price} DKK</span>
      </div>
      
      {/* ΓΕΝΙΚΟ ΣΧΟΛΙΟ ΠΑΡΑΓΓΕΛΙΑΣ */}
      {order.notes && (
        <div className="mt-4 p-2 border-2 border-black text-sm font-black uppercase">
          GENERAL NOTE:<br/>{order.notes}
        </div>
      )}
      
      <div className="text-center text-[10px] mt-6 mb-8">
        Thank you for your order!
      </div>
    </div>
  );
};
