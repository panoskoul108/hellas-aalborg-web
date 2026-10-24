import React, { useState, useEffect } from "react";

const REWARD_THRESHOLD = 40; // Όριο πόντων για επιβράβευση
const REWARD_DISCOUNT_DKK = 35; // Έκπτωση σε DKK όταν εξαργυρώνει τους 40 πόντους

export default function CartModal({
  isCartOpen,
  setIsCartOpen,
  cart,
  updateCartItemQuantity,
  handleEditCartItem,
  removeFromCart,
  themeColor = "#0284c7",
  lang = "da", // 'da' | 'en' | 'el'
  products = [],
  handleProductClick,
  generalNote,
  setGeneralNote,
  paymentMethod,
  setPaymentMethod,
  isAcceptingOrders = true,
  openPrivacy,
  theme = "light",
  onSubmitOrder,
  loyaltyInfo,
  checkCustomerLoyalty,
  isSubmitting = false,
  woltUrl = "https://wolt.com", // Βάλε εδώ το ακριβές link του Hellas Aalborg στη Wolt
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [requestedTime, setRequestedTime] = useState("ASAP");
  const [redeemReward, setRedeemReward] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (checkCustomerLoyalty && customerPhone.trim().length >= 8) {
        checkCustomerLoyalty(customerPhone);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [customerPhone]);

  if (!isCartOpen) return null;
  const isDark = theme === "dark";

  const dict = {
    da: {
      yourOrder: "DIN TAKEAWAY BESTILLING",
      takeawayBadge: "🛍️ KUN AFHENTNING I BUTIKKEN",
      woltPrompt: "Ønsker du levering? Bestil via Wolt 🛵",
      namePlaceholder: "Dit fulde navn *",
      phonePlaceholder: "Telefonnummer (f.eks. 12345678) *",
      timeLabel: "Afhentningstidspunkt",
      asap: "Hurtigst muligt (ca. 15-20 min)",
      freqBought: "OFTE KØBT SAMMEN",
      genNoteTitle: "BEMÆRKNINGER TIL ORDREN",
      notePlaceholder: "Allergier, ekstra servietter osv...",
      payMethod: "BETALING VED AFHENTNING",
      cardPickup: "KORT / MOBILEPAY",
      cash: "KONTANT",
      subtotal: "Subtotal",
      momsIncluded: "Heraf 25% moms",
      loyaltyTitle: "LOYALITETSPOINT",
      redeemText: `Brug ${REWARD_THRESHOLD} point (-${REWARD_DISCOUNT_DKK} kr.)`,
      fillRequired: "UDFYLD NAVN & TELEFON",
      sendOrder: "BESTIL TIL AFHENTNING",
      processing: "SENDER...",
      pausedMsg: "Vi modtager desværre ikke online ordrer i øjeblikket.",
      privacyLink: "Privatlivspolitik & Handelsbetingelser (Nordic-mythos 1 ApS)",
    },
    en: {
      yourOrder: "YOUR TAKEAWAY ORDER",
      takeawayBadge: "🛍️ STORE PICKUP ONLY",
      woltPrompt: "Want delivery? Order via Wolt 🛵",
      namePlaceholder: "Your full name *",
      phonePlaceholder: "Phone number *",
      timeLabel: "Pickup time",
      asap: "As soon as possible (approx. 15-20 min)",
      freqBought: "FREQUENTLY BOUGHT TOGETHER",
      genNoteTitle: "ORDER NOTES",
      notePlaceholder: "Allergies, instructions...",
      payMethod: "PAYMENT AT PICKUP",
      cardPickup: "CARD / MOBILEPAY",
      cash: "CASH",
      subtotal: "Subtotal",
      momsIncluded: "Included 25% VAT (Moms)",
      loyaltyTitle: "LOYALTY POINTS",
      redeemText: `Redeem ${REWARD_THRESHOLD} points (-${REWARD_DISCOUNT_DKK} kr.)`,
      fillRequired: "ENTER NAME & PHONE",
      sendOrder: "ORDER FOR PICKUP",
      processing: "PROCESSING...",
      pausedMsg: "We are currently not accepting online orders.",
      privacyLink: "Privacy Policy & Terms (Nordic-mythos 1 ApS)",
    },
    el: {
      yourOrder: "ΠΑΡΑΓΓΕΛΙΑ TAKEAWAY",
      takeawayBadge: "🛍️ ΠΑΡΑΛΑΒΗ ΑΠΟ ΤΟ ΚΑΤΑΣΤΗΜΑ",
      woltPrompt: "Θέλετε Delivery; Παραγγείλτε μέσω Wolt 🛵",
      namePlaceholder: "Ονοματεπώνυμο *",
      phonePlaceholder: "Τηλέφωνο επικοινωνίας *",
      timeLabel: "Ώρα παραλαβής",
      asap: "Το συντομότερο δυνατό (περίπου 15-20 λεπτά)",
      freqBought: "ΣΥΝΟΔΕΥΣΤΕ ΜΕ",
      genNoteTitle: "ΣΧΟΛΙΑ ΠΑΡΑΓΓΕΛΙΑΣ",
      notePlaceholder: "Αλλεργίες, οδηγίες...",
      payMethod: "ΠΛΗΡΩΜΗ ΚΑΤΑ ΤΗΝ ΠΑΡΑΛΑΒΗ",
      cardPickup: "ΚΑΡΤΑ / MOBILEPAY",
      cash: "ΜΕΤΡΗΤΑ",
      subtotal: "Μερικό Σύνολο",
      momsIncluded: "Περιλαμβάνει 25% ΦΠΑ (Moms)",
      loyaltyTitle: "ΠΟΝΤΟΙ LOYALTY",
      redeemText: `Εξαργύρωση ${REWARD_THRESHOLD} πόντων (-${REWARD_DISCOUNT_DKK} kr.)`,
      fillRequired: "ΣΥΜΠΛΗΡΩΣΤΕ ΟΝΟΜΑ & ΤΗΛΕΦΩΝΟ",
      sendOrder: "ΑΠΟΣΤΟΛΗ ΠΑΡΑΓΓΕΛΙΑΣ",
      processing: "ΑΠΟΣΤΟΛΗ...",
      pausedMsg: "Προς το παρόν δεν δεχόμαστε online παραγγελίες.",
      privacyLink: "Πολιτική Απορρήτου & Όροι (Nordic-mythos 1 ApS)",
    },
  };

  const ui = dict[lang] || dict.da;

  const getTitle = (item) =>
    item[`title_${lang}`] || item.title_da || item.title_en || item.title_el || item.name || "";

  // Διαβάζει αποκλειστικά την τιμή Takeaway από τον πίνακα menu_items
  const getItemPrice = (item) => parseFloat(item.price_takeaway || item.price || 0);

  const subtotalDkk = cart.reduce(
    (sum, item) => sum + getItemPrice(item) * (item.quantity || 1),
    0
  );
  const canRedeem = loyaltyInfo && loyaltyInfo.points >= REWARD_THRESHOLD;
  const discountDkk = canRedeem && redeemReward ? REWARD_DISCOUNT_DKK : 0;
  const finalTotalDkk = Math.max(0, subtotalDkk - discountDkk);
  const vatMomsDkk = finalTotalDkk * 0.2;

  const cartItemIds = cart.map((item) => item.id);
  const recommendations = (products || [])
    .filter(
      (p) =>
        p.is_available !== false &&
        (p.popular || p.featured) &&
        !cartItemIds.includes(p.id)
    )
    .slice(0, 4);

  const isFormValid =
    cart.length > 0 &&
    customerName.trim().length >= 2 &&
    customerPhone.trim().length >= 6 &&
    paymentMethod;

  const triggerOrderSubmit = () => {
    if (!isFormValid || isSubmitting) return;
    onSubmitOrder({
      order_type: "takeaway",
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      requested_time: requestedTime,
      items: cart.map((item) => ({
        id: item.id,
        title_da: item.title_da || getTitle(item),
        title_el: item.title_el || getTitle(item),
        quantity: item.quantity || 1,
        unit_price_dkk: getItemPrice(item),
        note: item.note || "",
        selectedOptions: item.selectedOptions || [],
      })),
      subtotal_dkk: subtotalDkk,
      discount_dkk: discountDkk,
      payment_method: paymentMethod,
      notes: generalNote,
      redeemReward: canRedeem && redeemReward,
    });
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col animate-slide-up ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <div className={`p-4 flex justify-between items-center shadow-sm border-b shrink-0 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <h2 className={`font-black uppercase text-lg ${isDark ? "text-white" : "text-gray-800"}`}>
          {ui.yourOrder}
        </h2>
        <button
          onClick={() => setIsCartOpen(false)}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-colors ${
            isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          ✕
        </button>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto p-4 no-scrollbar pb-32 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        
        {/* Takeaway Banner + Wolt Link */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-2 p-3 rounded-2xl bg-sky-50 border border-sky-200">
          <span className="font-black text-xs text-sky-900 tracking-wide">
            {ui.takeawayBadge}
          </span>
          <a
            href={woltUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-black text-sky-600 hover:underline"
          >
            {ui.woltPrompt}
          </a>
        </div>

        {/* Λίστα Προϊόντων */}
        <div className={`mb-6 bg-transparent rounded-2xl ${isDark ? "divide-gray-800" : "divide-gray-200"} divide-y`}>
          {cart.map((item) => {
            const unitPrice = getItemPrice(item);
            return (
              <div key={item.cartId || item.id} className="py-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-3">
                    <h4 className={`font-black uppercase text-sm leading-tight ${isDark ? "text-white" : "text-gray-800"}`}>
                      {getTitle(item)}
                    </h4>
                    {item.note && (
                      <p className={`text-[10px] font-bold italic mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        📝 {item.note}
                      </p>
                    )}
                  </div>
                  <span className="font-black text-sm pt-0.5" style={{ color: themeColor }}>
                    {(unitPrice * (item.quantity || 1)).toFixed(0)} kr.
                  </span>
                </div>

                <div className="flex justify-between items-center mt-1">
                  <div className={`flex items-center rounded-lg border shadow-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <button
                      onClick={() => updateCartItemQuantity(item.cartId || item.id, -1)}
                      className={`w-9 h-8 flex items-center justify-center font-black active:scale-90 transition-transform ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      −
                    </button>
                    <span className={`font-black text-xs w-6 text-center ${isDark ? "text-white" : "text-gray-800"}`}>
                      {item.quantity || 1}
                    </span>
                    <button
                      onClick={() => updateCartItemQuantity(item.cartId || item.id, 1)}
                      className="w-9 h-8 flex items-center justify-center font-black active:scale-90 transition-transform"
                      style={{ color: themeColor }}
                    >
                      +
                    </button>
                  </div>

                  <div className="flex gap-4 pr-1 ml-auto">
                    {handleEditCartItem && (
                      <button onClick={() => handleEditCartItem(item)} className="text-lg active:scale-90 transition-transform opacity-80 hover:opacity-100">
                        ✏️
                      </button>
                    )}
                    <button onClick={() => removeFromCart(item.cartId || item.id)} className="text-lg active:scale-90 transition-transform opacity-80 hover:opacity-100">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Smart Upsell Προτάσεις */}
        {recommendations.length > 0 && (
          <div className="mb-6">
            <p className="font-black text-[10px] uppercase text-sky-600 mb-3 tracking-widest px-1">
              {ui.freqBought}
            </p>
            <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar px-1">
              {recommendations.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleProductClick && handleProductClick(prod)}
                  className={`min-w-[150px] max-w-[150px] flex flex-col p-2.5 rounded-2xl border cursor-pointer transition-transform active:scale-95 ${
                    isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"
                  }`}
                >
                  <div className="flex flex-col flex-1 justify-between">
                    <span className={`text-[11px] font-black uppercase line-clamp-2 leading-tight ${isDark ? "text-white" : "text-gray-800"}`}>
                      {getTitle(prod)}
                    </span>
                    <span className="text-xs font-black mt-2" style={{ color: themeColor }}>
                      +{getItemPrice(prod).toFixed(0)} kr.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Φόρμα Στοιχείων Παραλαβής (Takeaway) */}
        <div className={`p-4 rounded-2xl border mb-6 space-y-3 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
          <input
            type="text"
            placeholder={ui.namePlaceholder}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={`w-full border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none ${
              isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
            }`}
          />
          <input
            type="tel"
            placeholder={ui.phonePlaceholder}
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className={`w-full border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none ${
              isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
            }`}
          />

          {/* Εμφάνιση Πόντων Loyalty */}
          {loyaltyInfo && (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase text-sky-800">{ui.loyaltyTitle}</p>
                <p className="text-xs font-bold text-sky-900">
                  ⭐ {loyaltyInfo.points || 0} / {REWARD_THRESHOLD} points
                </p>
              </div>
              {canRedeem && (
                <button
                  type="button"
                  onClick={() => setRedeemReward(!redeemReward)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                    redeemReward ? "bg-emerald-600 text-white" : "bg-sky-600 text-white"
                  }`}
                >
                  {redeemReward ? "✓" : ui.redeemText}
                </button>
              )}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">
              {ui.timeLabel}
            </label>
            <select
              value={requestedTime}
              onChange={(e) => setRequestedTime(e.target.value)}
              className={`w-full border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none ${
                isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
              }`}
            >
              <option value="ASAP">{ui.asap}</option>
              <option value="In 20 mins">+20 min</option>
              <option value="In 30 mins">+30 min</option>
              <option value="In 45 mins">+45 min</option>
              <option value="In 60 mins">+60 min</option>
            </select>
          </div>
        </div>

        {/* Σχόλια Παραγγελίας */}
        <div className="mb-6">
          <p className="font-black text-[10px] uppercase text-gray-400 mb-2 tracking-widest px-1">
            {ui.genNoteTitle}
          </p>
          <textarea
            rows="2"
            placeholder={ui.notePlaceholder}
            value={generalNote}
            onChange={(e) => setGeneralNote(e.target.value)}
            className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none font-bold resize-none shadow-sm ${
              isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
            }`}
          />
        </div>

        {/* Τρόπος Πληρωμής */}
        <div className={`flex flex-col mb-6 p-3 rounded-2xl border shadow-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <span className="font-black text-[9px] uppercase text-gray-500 tracking-widest mb-2 text-center">
            {ui.payMethod} <span className="text-red-500">*</span>
          </span>
          <div className={`flex p-1.5 rounded-xl shadow-inner gap-2 ${isDark ? "bg-gray-900" : "bg-gray-100"}`}>
            <button
              type="button"
              onClick={() => setPaymentMethod("ΚΑΡΤΑ")}
              className={`flex-1 py-3 rounded-lg font-black text-xs uppercase transition-all flex items-center justify-center gap-1.5 ${
                paymentMethod === "ΚΑΡΤΑ"
                  ? "bg-white shadow-md text-gray-900 scale-[1.02]"
                  : "text-gray-400"
              }`}
              style={paymentMethod === "ΚΑΡΤΑ" ? { color: themeColor } : {}}
            >
              💳 <span>{ui.cardPickup}</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("ΜΕΤΡΗΤΑ")}
              className={`flex-1 py-3 rounded-lg font-black text-xs uppercase transition-all flex items-center justify-center gap-1.5 ${
                paymentMethod === "ΜΕΤΡΗΤΑ"
                  ? "bg-white shadow-md text-gray-900 scale-[1.02]"
                  : "text-gray-400"
              }`}
              style={paymentMethod === "ΜΕΤΡΗΤΑ" ? { color: themeColor } : {}}
            >
              💵 <span>{ui.cash}</span>
            </button>
          </div>
        </div>

        {/* Ανάλυση Κόστους & 25% Moms */}
        <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${isDark ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-200 text-gray-700"}`}>
          <div className="flex justify-between font-bold">
            <span>{ui.subtotal}</span>
            <span>{subtotalDkk.toFixed(2)} kr.</span>
          </div>
          {discountDkk > 0 && (
            <div className="flex justify-between font-black text-emerald-600">
              <span>Loyalty Discount</span>
              <span>-{discountDkk.toFixed(2)} kr.</span>
            </div>
          )}
          <div className="flex justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-200">
            <span>{ui.momsIncluded}</span>
            <span>{vatMomsDkk.toFixed(2)} kr.</span>
          </div>
        </div>
      </div>

      {/* Footer Submit Button */}
      <div className={`p-4 shrink-0 border-t shadow-[0_-10px_20px_rgba(0,0,0,0.05)] ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
        {!isAcceptingOrders ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl font-black text-center text-xs uppercase border-2 border-red-200 mb-2">
            ⚠️ {ui.pausedMsg}
          </div>
        ) : (
          <button
            onClick={triggerOrderSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-5 rounded-2xl font-black flex justify-between px-6 items-center transition-all active:scale-95 mb-1 ${
              isFormValid && !isSubmitting
                ? "text-white shadow-xl hover:opacity-90"
                : isDark
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            style={isFormValid && !isSubmitting ? { backgroundColor: themeColor } : {}}
          >
            <span className="uppercase text-sm tracking-widest">
              {isSubmitting ? ui.processing : !isFormValid ? ui.fillRequired : ui.sendOrder}
            </span>
            <span className="text-xl">{finalTotalDkk.toFixed(0)} kr.</span>
          </button>
        )}

        {openPrivacy && (
          <div className="text-center mt-2">
            <button
              onClick={openPrivacy}
              className="text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600"
            >
              {ui.privacyLink}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
