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

  // Κόβουμε τα δευτερόλεπτα από την ώρα παραλαβής (π.χ. από 13:17:40 κρατάμε 13:17)
  const formattedTime = order.requested_time ? order.requested_time.slice(0, 5) : '';

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { 
            size: 80mm auto; 
            margin: 0mm !important; /* Αυστηρά μηδενικά περιθώρια σελίδας */
          }
          body { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white; 
            visibility: hidden; 
          }
          .print-receipt-container { 
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm !important; 
            max-width: 80mm !important;
            padding: 0 3mm !important; /* 0 κενό πάνω/κάτω, 3mm αριστερά/δεξιά για να μην κόβονται τα γράμματα */
            margin: 0 !important;
            color: black !important;
          }
        }
      `}} />

      <div className="print-receipt-container bg-white text-black text-xs font-mono font-bold w-full max-w-[80mm] mx-auto">
        <div className="pt-2"> {/* Ελάχιστο κενό πάνω για να μην κοπεί το όνομα του μαγαζιού */}
          
          {/* HEADER */}
          <div className="text-center text-xl font-black mb-1 leading-none">{storeName}</div>
          <div className="text-center text-sm mb-3 border-b-2 border-black pb-2 leading-tight">
            Takeaway Order #{order.order_number || order.id.toString().slice(-4)}<br/>
            {/* Ημερομηνία χωρίς δευτερόλεπτα */}
            {new Date(order.created_at).toLocaleString('el-GR', { dateStyle: 'short', timeStyle: 'short' })}
          </div>
          
          {/* ΠΕΛΑΤΗΣ */}
          <div className="mb-3 text-base leading-tight">
            <div className="uppercase">Name: {order.customer_name}</div>
            <div className="uppercase">Tel: {order.customer_phone}</div>
            <div className="mt-2 text-xl font-black uppercase border-2 border-black p-1.5 text-center tracking-wider">
              TIME: {formattedTime}
            </div>
          </div>

          {/* ΠΡΟΪΟΝΤΑ (ΟΛΑ ΜΑΖΙ) */}
          <div className="border-t-2 border-b-2 border-black py-3 mb-3">
            {order.items?.map((it: any, i: number) => (
              <div key={i} className="mb-3 last:mb-0">
                <div className="flex justify-between font-black text-lg leading-tight">
                  <span className="uppercase pr-2">{it.quantity}x {it.title_da || it.title_el || it.name}</span>
                  <span className="whitespace-nowrap">{(it.unit_price_dkk * it.quantity).toFixed(0)} kr.</span>
                </div>
                {/* Extras / Υλικά */}
                {it.selectedOptions?.length > 0 && (
                  <div className="text-sm pl-3 mt-1 uppercase leading-tight font-bold">
                    + {it.selectedOptions.join(', ')}
                  </div>
                )}
                {/* Σχόλιο Προϊόντος */}
                {it.note && (
                  <div className="text-sm pl-3 mt-1 italic uppercase font-black">
                    *** Note: {it.note} ***
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ΣΥΝΟΛΑ */}
          <div className="flex justify-between text-xl font-black mt-2 mb-3">
            <span className="uppercase">TOTAL ({order.payment_method === 'ΚΑΡΤΑ' ? 'CARD' : 'CASH'}):</span>
            <span>{order.total_price} DKK</span>
          </div>
          
          {/* ΓΕΝΙΚΟ ΣΧΟΛΙΟ ΠΑΡΑΓΓΕΛΙΑΣ */}
          {order.notes && (
            <div className="mt-3 p-2 border-2 border-black text-base font-black uppercase leading-tight">
              GENERAL NOTE:<br/>{order.notes}
            </div>
          )}
          
          {/* FOOTER */}
          <div className="text-center text-sm mt-4 mb-2 font-bold pb-2">
            Thank you for your order!
          </div>
          
        </div>
      </div>
    </>
  );
};
