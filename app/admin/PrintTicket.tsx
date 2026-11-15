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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { 
            size: 80mm auto; /* Αναγκάζει το tablet να δει το χαρτί ως 80mm */
            margin: 0;       /* Καταργεί τα προεπιλεγμένα περιθώρια του tablet */
          }
          body { 
            margin: 0; 
            padding: 0; 
            background: white; 
            /* Αποκρύπτει τα πάντα εκτός από το print-container */
            visibility: hidden; 
          }
          .print-receipt-container { 
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important; 
            max-width: 80mm !important;
            padding: 2mm !important; /* Ελάχιστο κενό για να μην κόβονται τα γράμματα στις άκρες */
            color: black !important;
          }
        }
      `}} />

      {/* 
        Σημείωση: H κλάση 'print-receipt-container' είναι κρίσιμη για να 
        εφαρμοστούν σωστά τα @media print styles. 
      */}
      <div className="print-receipt-container bg-white text-black text-sm font-mono font-bold w-full max-w-[80mm] mx-auto p-2">
        {/* HEADER */}
        <div className="text-center text-3xl font-black mb-2 leading-none">{storeName}</div>
        <div className="text-center text-lg mb-4 border-b-2 border-black pb-2 leading-tight">
          Takeaway Order #{order.order_number || order.id.toString().slice(-4)}<br/>
          {new Date(order.created_at).toLocaleString('el-GR')}
        </div>
        
        {/* ΠΕΛΑΤΗΣ */}
        <div className="mb-4 text-xl leading-tight">
          <div className="uppercase">Name: {order.customer_name}</div>
          <div className="uppercase">Tel: {order.customer_phone}</div>
          <div className="mt-2 text-3xl font-black uppercase border-2 border-black p-2 text-center tracking-wider">
            TIME: {order.requested_time}
          </div>
        </div>

        {/* ΠΡΟΪΟΝΤΑ (ΟΛΑ ΜΑΖΙ) */}
        <div className="border-t-4 border-b-4 border-black py-4 mb-4">
          {order.items?.map((it: any, i: number) => (
            <div key={i} className="mb-4 last:mb-0">
              <div className="flex justify-between font-black text-2xl leading-tight">
                <span className="uppercase pr-2">{it.quantity}x {it.title_da || it.title_el || it.name}</span>
                <span className="whitespace-nowrap">{(it.unit_price_dkk * it.quantity).toFixed(0)} kr.</span>
              </div>
              {/* Extras / Υλικά */}
              {it.selectedOptions?.length > 0 && (
                <div className="text-lg pl-4 mt-1 uppercase leading-tight font-bold">
                  + {it.selectedOptions.join(', ')}
                </div>
              )}
              {/* Σχόλιο Προϊόντος */}
              {it.note && (
                <div className="text-lg pl-4 mt-1 italic uppercase font-black">
                  *** Note: {it.note} ***
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ΣΥΝΟΛΑ */}
        <div className="flex justify-between text-2xl font-black mt-2 mb-4">
          <span className="uppercase">TOTAL ({order.payment_method === 'ΚΑΡΤΑ' ? 'CARD' : 'CASH'}):</span>
          <span>{order.total_price} DKK</span>
        </div>
        
        {/* ΓΕΝΙΚΟ ΣΧΟΛΙΟ ΠΑΡΑΓΓΕΛΙΑΣ */}
        {order.notes && (
          <div className="mt-4 p-3 border-4 border-black text-xl font-black uppercase leading-tight">
            GENERAL NOTE:<br/>{order.notes}
          </div>
        )}
        
        <div className="text-center text-lg mt-8 mb-12 font-bold">
          Thank you for your order!
        </div>
      </div>
    </>
  );
};
