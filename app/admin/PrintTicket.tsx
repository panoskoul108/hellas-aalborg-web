'use client';
import React, { useEffect, useRef } from "react";

export const PrintTicket = ({
  order,
  storeName = "HELLAS AALBORG",
  companyInfo = "Nordic-mythos 1 ApS",
  isThermal = true,
  onPrintDone,
  isKitchenTicket = false,
  hasKitchenEnabled = false,
}: any) => {
  const hasTriggeredPrint = useRef(false);

  useEffect(() => {
    if (!order || hasTriggeredPrint.current) return;
    hasTriggeredPrint.current = true;

    const timer = setTimeout(() => {
      window.print();
      if (onPrintDone) onPrintDone(order.id);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  if (!order) return null;

  const printDoubleTicket = hasKitchenEnabled === false && !isKitchenTicket;
  const fTitle = printDoubleTicket ? "20px" : "16px";
  const fOrderNum = printDoubleTicket ? "42px" : "34px";
  const fItems = printDoubleTicket ? "22px" : "18px";
  const fNotes = printDoubleTicket ? "18px" : "14px";
  const fTotal = printDoubleTicket ? "24px" : "18px";

  const allItems = order.items || [];
  const kitchenItems = allItems.filter((item: any) => !item.station || item.station === "kitchen");
  const hasKitchenItems = kitchenItems.length > 0;

  const totalPrice = Number(order.total_price || 0);
  const subtotalDkk = Number(order.subtotal_dkk || totalPrice);
  const discountDkk = Number(order.discount_dkk || 0);
  const vatMomsDkk = Number(order.vat_moms_dkk || (totalPrice * 0.2).toFixed(2));

  const orderNumberDisplay = order.order_number || order.id?.toString().slice(-4) || "NEW";
  const generalNoteText = order.notes || order.general_note || "";

  const getTicketItemName = (item: any) => {
    if (item.title_el && item.title_da && item.title_el !== item.title_da) {
      return `${item.title_el} (${item.title_da})`;
    }
    return item.title_el || item.title_da || item.name || "Προϊόν";
  };

  return (
    <>
      {isThermal && (
        <style>
          {`
            @media print {
              @page { margin: 0 !important; size: auto; }
              body { margin: 0 !important; padding: 0 !important; }
              .thermal-container { padding: 0 4px !important; margin: 0 auto !important; width: 100% !important; box-sizing: border-box !important; }
            }
          `}
        </style>
      )}

      {/* 1ο ΧΑΡΤΑΚΙ: ΚΥΡΙΟ ΔΕΛΤΙΟ TAKEAWAY */}
      <div className={isThermal ? "thermal-container" : ""} style={{ width: "100%", padding: "0", margin: "0", backgroundColor: "white", color: "black", fontFamily: "monospace", lineHeight: "1.15" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid black", paddingBottom: "8px", marginBottom: "8px" }}>
          <div style={{ textAlign: "left" }}>
            <h2 style={{ margin: 0, fontSize: fTitle, fontWeight: "900", textTransform: "uppercase" }}>{isKitchenTicket ? "ΚΟΥΖΙΝΑ / KØKKEN" : storeName}</h2>
            {!isKitchenTicket && <div style={{ fontSize: "12px", fontWeight: "bold" }}>{companyInfo}</div>}
            <div style={{ display: "inline-block", backgroundColor: "black", color: "white", padding: "2px 8px", fontSize: "16px", fontWeight: "900", marginTop: "6px" }}>🛍️ TAKEAWAY</div>
            <h1 style={{ margin: "6px 0 0 0", fontSize: fOrderNum, fontWeight: "900", lineHeight: "1" }}>#{orderNumberDisplay}</h1>
          </div>
          
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "900" }}>{new Date(order.created_at || Date.now()).toLocaleString("da-DK", { dateStyle: "short", timeStyle: "short" })}</p>
            {/* ΤΕΡΑΣΤΙΑ ΩΡΑ ΠΑΡΑΛΑΒΗΣ */}
            <div style={{ marginTop: "12px", border: "4px solid black", backgroundColor: "black", color: "white", padding: "6px 12px", textAlign: "center", borderRadius: "6px" }}>
              <div style={{ fontSize: "12px", fontWeight: "900" }}>ΠΑΡΑΛΑΒΗ / PICKUP:</div>
              <div style={{ fontSize: "28px", fontWeight: "900", marginTop: "2px" }}>{order.requested_time || "ASAP"}</div>
            </div>
          </div>
        </div>

        <div style={{ borderBottom: "2px dashed black", paddingBottom: "8px", marginBottom: "8px", fontSize: "16px", fontWeight: "900" }}>
          <div>👤 ΠΕΛΑΤΗΣ: {order.customer_name || "-"}</div>
          <div style={{ marginTop: "2px" }}>📞 ΤΗΛ: {order.customer_phone || "-"}</div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {(isKitchenTicket ? kitchenItems : allItems).map((item: any, i: number) => {
              const itemUnitPrice = Number(item.unit_price_dkk || item.price_takeaway || item.price || 0);
              const itemRowTotal = itemUnitPrice * (item.quantity || 1);
              return (
                <tr key={i} style={{ borderBottom: "1px dotted #ccc" }}>
                  <td style={{ padding: "5px 0", verticalAlign: "top" }}>
                    <span style={{ fontSize: fItems, fontWeight: "900" }}>{item.quantity || 1}x {getTicketItemName(item)}</span>
                    {item.selectedOptions && item.selectedOptions.length > 0 && <div style={{ fontSize: "16px", fontWeight: "900", marginLeft: "12px", marginTop: "2px" }}>+ {item.selectedOptions.map((opt: any) => opt.name || opt).join(", ")}</div>}
                    {item.note && <div style={{ fontSize: fNotes, fontWeight: "900", fontStyle: "italic", marginTop: "2px", backgroundColor: "#eee", padding: "2px 4px" }}>👉 ΣΗΜ: {item.note}</div>}
                  </td>
                  {!isKitchenTicket && <td style={{ textAlign: "right", verticalAlign: "top", paddingTop: "5px", fontSize: "16px", fontWeight: "900", minWidth: "65px" }}>{itemRowTotal.toFixed(0)} kr.</td>}
                </tr>
              );
            })}
          </tbody>
        </table>

        {generalNoteText && <div style={{ border: "3px solid black", padding: "8px", marginTop: "10px", fontSize: fNotes, fontWeight: "900" }}><span style={{ textDecoration: "underline" }}>ΣΧΟΛΙΟ ΠΕΛΑΤΗ:</span> {generalNoteText}</div>}

        {!isKitchenTicket && (
          <div style={{ borderTop: "3px solid black", marginTop: "10px", paddingTop: "8px" }}>
            {discountDkk > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "bold" }}><span>Subtotal:</span><span>{subtotalDkk.toFixed(2)} kr.</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "900" }}><span>🎁 Loyalty Rabat:</span><span>-{discountDkk.toFixed(2)} kr.</span></div>
              </>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
              <div style={{ fontSize: "15px", fontWeight: "900" }}>ΠΛΗΡΩΜΗ: {order.payment_method === "ΚΑΡΤΑ" ? "KORT" : "KONTANT"}</div>
              <div style={{ fontSize: "18px", fontWeight: "900" }}>TOTAL: <span style={{ fontSize: fTotal }}>{totalPrice.toFixed(2)} kr.</span></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "bold", marginTop: "4px", borderTop: "1px dashed black", paddingTop: "4px" }}><span>Heraf 25% moms (ΦΠΑ):</span><span>{vatMomsDkk.toFixed(2)} kr.</span></div>
          </div>
        )}
        {!isKitchenTicket && discountDkk > 0 && <div style={{ marginTop: "10px", border: "3px double black", textAlign: "center", fontWeight: "900", padding: "5px", fontSize: "15px" }}>🎁 ΕΞΑΡΓΥΡΩΣΗ LOYALTY 🎁</div>}
        {!(hasKitchenItems && printDoubleTicket) && <div style={{ height: "15mm" }}></div>}
      </div>

      {/* 2ο ΧΑΡΤΑΚΙ (ΚΟΥΖΙΝΑ) */}
      {printDoubleTicket && hasKitchenItems && (
        <div className={isThermal ? "thermal-container" : ""} style={{ width: "100%", padding: "0", margin: "0", backgroundColor: "white", color: "black", fontFamily: "monospace", lineHeight: "1.15", pageBreakBefore: "always", paddingTop: "15px" }}>
          <div style={{ textAlign: "center", borderBottom: "4px solid black", paddingBottom: "8px", marginBottom: "8px" }}>
            <div style={{ backgroundColor: "black", color: "white", display: "inline-block", padding: "4px 10px", fontSize: "20px", fontWeight: "900", marginBottom: "5px" }}>ΚΟΥΖΙΝΑ - TAKEAWAY</div>
            <h1 style={{ margin: "0", fontSize: fOrderNum, fontWeight: "900" }}>#{orderNumberDisplay}</h1>
            <div style={{ fontSize: "24px", fontWeight: "900", marginTop: "4px", border: "2px solid black", padding: "4px" }}>🕒 ΠΑΡΑΛΑΒΗ: {order.requested_time || "ASAP"}</div>
            <div style={{ fontSize: "16px", fontWeight: "bold", marginTop: "8px" }}>👤 {order.customer_name} ({order.customer_phone})</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {kitchenItems.map((item: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: "1px dashed #999" }}>
                  <td style={{ padding: "8px 0", verticalAlign: "top" }}>
                    <span style={{ fontSize: fItems, fontWeight: "900" }}>• {getTicketItemName(item)}</span>
                    {item.selectedOptions && item.selectedOptions.length > 0 && <div style={{ fontSize: "18px", fontWeight: "900", marginLeft: "12px", marginTop: "2px" }}>+ {item.selectedOptions.map((opt: any) => opt.name || opt).join(", ")}</div>}
                    {item.note && <div style={{ fontSize: fNotes, fontWeight: "900", fontStyle: "italic", marginTop: "4px", backgroundColor: "#eee", padding: "4px" }}>👉 ΣΗΜ: {item.note}</div>}
                  </td>
                  <td style={{ textAlign: "right", verticalAlign: "top", paddingTop: "8px", fontSize: fItems, fontWeight: "900", minWidth: "45px" }}>{item.quantity || 1}x</td>
                </tr>
              ))}
            </tbody>
          </table>
          {generalNoteText && <div style={{ border: "3px solid black", padding: "8px", marginTop: "10px", fontSize: fNotes, fontWeight: "900" }}><span style={{ textDecoration: "underline" }}>ΓΕΝ. ΣΗΜ:</span> {generalNoteText}</div>}
          <div style={{ textAlign: "center", marginTop: "16px", fontSize: "12px", borderTop: "2px dashed black", paddingTop: "8px", fontWeight: "bold" }}>** ΤΕΛΟΣ ΔΕΛΤΙΟΥ ΚΟΥΖΙΝΑΣ **</div>
          <div style={{ height: "15mm" }}></div>
        </div>
      )}
    </>
  );
};
