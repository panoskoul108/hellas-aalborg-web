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
  // Νέα props για Hellas Takeaway/Delivery & Loyalty
  orderType = "takeaway", // 'takeaway' | 'delivery'
  setOrderType,
  onSubmitOrder,
  loyaltyInfo,
  checkCustomerLoyalty,
  isSubmitting = false,
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [postalCode, setPostalCode] = useState("9000");
  const [floorDoor, setFloorDoor] = useState("");
  const [requestedTime, setRequestedTime] = useState("ASAP");
  const [redeemReward, setRedeemReward] = useState(false);

  // Αυτόματος έλεγχος πόντων Loyalty όταν ο πελάτης πληκτρολογεί το τηλέφωνό του
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

  // Πολυγλωσσικό λεξικό (Δανικά, Αγγλικά, Ελληνικά)
  const dict = {
    da: {
      yourOrder: "DIN BESTILLING",
      takeaway: "AFHENTNING",
      delivery: "LEVERING",
      namePlaceholder: "Dit fulde navn *",
      phonePlaceholder: "Telefonnummer (f.eks. 12345678) *",
      addressPlaceholder: "Gade og husnummer *",
      postalPlaceholder: "Postnr. *",
      floorPlaceholder: "Etage / Dør (valgfrit)",
      timeLabel: "Ønsket tidspunkt",
      asap: "Hurtigst muligt (ASAP)",
      freqBought: "OFTE KØBT SAMMEN",
      genNoteTitle: "BEMÆRKNINGER TIL ORDREN",
      notePlaceholder: "Allergier, ekstra servietter osv...",
      payMethod: "BETALINGSMETODE",
      cardPickup: "KORT / MOBILEPAY",
      cash: "KONTANT",
      subtotal: "Subtotal",
      deliveryFee: "Leveringsgebyr",
      momsIncluded: "Heraf 25% moms",
      loyaltyTitle: "LOYALITETSPOINT",
      redeemText: `Brug ${REWARD_THRESHOLD} point (-${REWARD_DISCOUNT_DKK} kr.)`,
      fillRequired: "UDFYLD KONTAKTOPLYSNINGER",
      sendOrder: "SEND BESTILLING",
      processing: "BEHANDLER...",
      pausedMsg: "Vi modtager desværre ikke online ordrer i øjeblikket.",
      privacyLink: "Privatlivspolitik & Handelsbetingelser",
    },
    en: {
      yourOrder: "YOUR ORDER",
      takeaway: "TAKEAWAY",
      delivery: "DELIVERY",
      namePlaceholder: "Your full name *",
      phonePlaceholder: "Phone number *",
      addressPlaceholder: "Street and house number *",
      postalPlaceholder: "Postal code *",
      floorPlaceholder: "Floor / Door (optional)",
      timeLabel: "Requested time",
      asap: "As soon as possible (ASAP)",
      freqBought: "FREQUENTLY BOUGHT TOGETHER",
      genNoteTitle: "ORDER NOTES",
      notePlaceholder: "Allergies, instructions...",
      payMethod: "PAYMENT METHOD",
      cardPickup: "CARD / MOBILEPAY",
      cash: "CASH",
      subtotal: "Subtotal",
      deliveryFee: "Delivery fee",
      momsIncluded: "Included 25% VAT (Moms)",
      loyaltyTitle: "LOYALTY POINTS",
      redeemText: `Redeem ${REWARD_THRESHOLD} points (-${REWARD_DISCOUNT_DKK} kr.)`,
      fillRequired: "FILL REQUIRED DETAILS",
      sendOrder: "PLACE ORDER",
      processing: "PROCESSING...",
      pausedMsg: "We are currently not accepting online orders.",
      privacyLink: "Privacy Policy & Terms",
    },
    el: {
      yourOrder: "Η ΠΑΡΑΓΓΕΛΙΑ ΣΑΣ",
      takeaway: "ΠΑΡΑΛΑΒΗ (TAKEAWAY)",
      delivery: "ΔΙΑΝΟΜΗ (DELIVERY)",
      namePlaceholder: "Ονοματεπώνυμο *",
      phonePlaceholder: "Τηλέφωνο επικοινωνίας *",
      addressPlaceholder: "Οδός και Αριθμός *",
      postalPlaceholder: "Τ.Κ. *",
      floorPlaceholder: "Όροφος / Κουδούνι",
      timeLabel: "Επιθυμητή ώρα",
      asap: "Το συντομότερο δυνατό (ASAP)",
      freqBought: "ΣΥΝΟΔΕΥΣΤΕ ΜΕ",
      genNoteTitle: "ΣΧΟΛΙΑ ΠΑΡΑΓΓΕΛΙΑΣ",
      notePlaceholder: "Αλλεργίες, οδηγίες...",
      payMethod: "ΤΡΟΠΟΣ ΠΛΗΡΩΜΗΣ",
      cardPickup: "ΚΑΡΤΑ / MOBILEPAY",
      cash: "ΜΕΤΡΗΤΑ",
      subtotal: "Μερικό Σύνολο",
      deliveryFee: "Κόστος Διανομής",
      momsIncluded: "Περιλαμβάνει 25% ΦΠΑ (Moms)",
      loyaltyTitle: "ΠΟΝΤΟΙ LOYALTY",
      redeemText: `Εξαργύρωση ${REWARD_THRESHOLD} πόντων (-${REWARD_DISCOUNT_DKK} kr.)`,
      fillRequired: "ΣΥΜΠΛΗΡΩΣΤΕ ΤΑ ΣΤΟΙΧΕΙΑ ΣΑΣ",
      sendOrder: "ΑΠΟΣΤΟΛΗ ΠΑΡΑΓΓΕΛΙΑΣ",
      processing: "ΑΠΟΣΤΟΛΗ...",
      pausedMsg: "Προς το παρόν δεν δεχόμαστε online παραγγελίες.",
      privacyLink: "Πολιτική Απορρήτου & Όροι Χρήσης",
    },
  };

  const ui = dict[lang] || dict.da;

  // Helpers για τον πίνακα menu_items του Hellas Aalborg
  const getTitle = (item) =>
    item[`title_${lang}`] || item.title_da || item.title_en || item.title_el || item.name || "";

  const getItemPrice = (item) => {
    const rawPrice =
      orderType === "delivery"
        ? item.price_delivery || item.price_takeaway || item.price
        : item.price_takeaway || item.price;
    return parseFloat(rawPrice || 0);
  };

  // Υπολογισμός Συνόλων σε DKK
  const subtotalDkk = cart.reduce(
    (sum, item) => sum + getItemPrice(item) * (item.quantity || 1),
    0
  );
  const deliveryFeeDkk = orderType === "delivery" ? 35 : 0; // Προσαρμόσιμο κόστος διανομής
  const canRedeem = loyaltyInfo && loyaltyInfo.points >= REWARD_THRESHOLD;
  const discountDkk = canRedeem && redeemReward ? REWARD_DISCOUNT_DKK : 0;
  const finalTotalDkk = Math.max(0, subtotalDkk + deliveryFeeDkk - discountDkk);
  const vatMomsDkk = finalTotalDkk * 0.2; // 25% ΦΠΑ επί της καθαρής αξίας = 20% της τελικής

  // Προτάσεις (Smart Upsell) από τις στήλες popular / featured του menu_items
  const cartItemIds = cart.map((item) => item.id);
  const recommendations = (products || [])
    .filter(
      (p) =>
        p.is_available !== false &&
        (p.popular || p.featured) &&
        !cartItemIds.includes(p.id)
    )
    .slice(0, 4);

  // Έλεγχος εγκυρότητας φόρμας
  const isFormValid =
    cart.length > 0 &&
    customerName.trim().length >= 2 &&
    customerPhone.trim().length >= 6 &&
    paymentMethod &&
    (orderType === "takeaway" ||
      (deliveryAddress.trim().length >= 4 && postalCode.trim().length >= 4));

  const triggerOrderSubmit = () => {
    if (!isFormValid || isSubmitting) return;
    onSubmitOrder({
      order_type: orderType,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      delivery_address: deliveryAddress.trim(),
      postal_code: postalCode.trim(),
      floor_door: floorDoor.trim(),
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
      delivery_fee_dkk: deliveryFeeDkk,
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
        
        {/* 1. Επιλογή Takeaway vs Delivery */}
        <div className={`flex p-1.5 rounded-2xl mb-6 shadow-inner ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
          <button
            onClick={() => setOrderType && setOrderType("takeaway")}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${
              orderType === "takeaway"
                ? "bg-white text-gray-900 shadow-md scale-[1.01]"
                : "text-gray-500"
            }`}
            style={orderType === "takeaway" ? { color: themeColor } : {}}
          >
            🛍️ {ui.takeaway}
          </button>
          <button
            onClick={() => setOrderType && setOrderType("delivery")}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${
              orderType === "delivery"
                ? "bg-white text-gray-900 shadow-md scale-[1.01]"
                : "text-gray-500"
            }`}
            style={orderType === "delivery" ? { color: themeColor } : {}}
          >
            🛵 {ui.delivery}
          </button>
        </div>

        {/* 2. Λίστα Προϊόντων Καλαθιού */}
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

        {/* 3. Smart Upsell Προτάσεις */}
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

        {/* 4. Φόρμα Στοιχείων Πελάτη (Takeaway / Delivery) */}
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

          {/* Εμφάνιση Πόντων Loyalty αν βρεθεί το τηλέφωνο */}
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

          {orderType === "delivery" && (
            <>
              <input
                type="text"
                placeholder={ui.addressPlaceholder}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none ${
                  isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                }`}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={ui.postalPlaceholder}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className={`w-1/3 border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none ${
                    isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                  }`}
                />
                <input
                  type="text"
                  placeholder={ui.floorPlaceholder}
                  value={floorDoor}
                  onChange={(e) => setFloorDoor(e.target.value)}
                  className={`w-2/3 border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none ${
                    isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                  }`}
                />
              </div>
            </>
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
              <option value="In 30 mins">+30 min</option>
              <option value="In 45 mins">+45 min</option>
              <option value="In 60 mins">+60 min</option>
            </select>
          </div>
        </div>

        {/* 5. Σχόλια Παραγγελίας */}
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

        {/* 6. Τρόπος Πληρωμής */}
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

        {/* 7. Ανάλυση Κόστους & 25% Δανέζικου ΦΠΑ (Moms) */}
        <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${isDark ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-200 text-gray-700"}`}>
          <div className="flex justify-between font-bold">
            <span>{ui.subtotal}</span>
            <span>{subtotalDkk.toFixed(2)} kr.</span>
          </div>
          {orderType === "delivery" && (
            <div className="flex justify-between font-bold">
              <span>{ui.deliveryFee}</span>
              <span>{deliveryFeeDkk.toFixed(2)} kr.</span>
            </div>
          )}
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
