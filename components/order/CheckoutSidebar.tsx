'use client';
import React, { useState, useEffect } from 'react';
import LoyaltyWallet from './LoyaltyWallet';
import SmartUpsell from './SmartUpsell';
import SupportChatView from './SupportChatView';
import AuthCheckoutStep from './AuthCheckoutStep';
import OrderTrackingView from './OrderTrackingView';
import { Icons } from '../Icons';
import { supabase } from '../../app/supabase';

const CHAT_UI_DICT: Record<string, any> = {
  da: {
    needHelp: "Brug for hjælp?",
    support: "Kundeservice",
    typeMsg: "Skriv en besked...",
    send: "Send",
    you: "Dig",
    store: "Hellas Aalborg",
    empty: "Skriv dit problem her, så svarer vi hurtigst muligt!",
    callUs: "RING TIL OS",
    takeawayTag: "TAKEAWAY - AFHENT I BUTIK",
    forgotPass: "Glemt adgangskode?",
    resetTitle: "Nulstil adgangskode",
    resetDesc: "Indtast din e-mailadresse, så sender vi et link til at vælge en ny adgangskode.",
    sendResetLink: "Send nulstillingslink",
    sendingLink: "Sender...",
    resetSuccess: "Hvis der findes en konto med denne e-mail, er der sendt et link til nulstilling af adgangskoden.",
    backToLogin: "Tilbage til login",
    missingEmail: "Indtast venligst din e-mailadresse.",
    chooseExactTime: "Vælg tidspunkt",
    invalidTimeMsg: "Butikken er lukket på dette tidspunkt. Vælg et gyldigt tidspunkt inden for åbningstiden."
  },
  en: {
    needHelp: "Report a problem",
    support: "Support Chat",
    typeMsg: "Type a message...",
    send: "Send",
    you: "You",
    store: "Hellas Aalborg",
    empty: "Describe your issue here and we'll reply ASAP!",
    callUs: "CALL STORE",
    takeawayTag: "TAKEAWAY - STORE PICKUP",
    forgotPass: "Forgot password?",
    resetTitle: "Reset Password",
    resetDesc: "Enter your email address and we will send you a link to set a new password.",
    sendResetLink: "Send reset link",
    sendingLink: "Sending...",
    resetSuccess: "If an account exists for this email, a password reset link has been sent.",
    backToLogin: "Back to login",
    missingEmail: "Please enter your email address.",
    chooseExactTime: "Choose exact time",
    invalidTimeMsg: "Store is closed at this time. Please choose a valid time within opening hours."
  },
  el: {
    needHelp: "Αναφορά Προβλήματος",
    support: "Συνομιλία Υποστήριξης",
    typeMsg: "Γράψτε το μήνυμά σας...",
    send: "Αποστολή",
    you: "Εσείς",
    store: "Hellas Aalborg",
    empty: "Γράψτε μας το πρόβλημά σας και θα απαντήσουμε άμεσα!",
    callUs: "ΚΛΗΣΗ ΚΑΤΑΣΤΗΜΑΤΟΣ",
    takeawayTag: "TAKEAWAY - ΠΑΡΑΛΑΒΗ ΑΠΟ ΚΑΤΑΣΤΗΜΑ",
    forgotPass: "Ξέχασα τον κωδικό μου",
    resetTitle: "Επαναφορά Κωδικού",
    resetDesc: "Γράψε το email του λογαριασμού σου για να σου στείλουμε σύνδεσμο ορισμού νέου κωδικού.",
    sendResetLink: "Αποστολή συνδέσμου",
    sendingLink: "Αποστολή...",
    resetSuccess: "Αν υπάρχει λογαριασμός με αυτό το email, στάλθηκε σύνδεσμος επαναφοράς κωδικού.",
    backToLogin: "Επιστροφή στη σύνδεση",
    missingEmail: "Παρακαλώ εισάγετε το email σας.",
    chooseExactTime: "Ακριβής ώρα",
    invalidTimeMsg: "Το κατάστημα είναι κλειστό αυτή την ώρα. Επιλέξτε έγκυρη ώρα εντός ωραρίου."
  }
};

export default function CheckoutSidebar({
  isCartOpen, setIsCartOpen, checkoutStep, setCheckoutStep, lang, ui, t, auth, cart,
  updateQuantity, removeFromCart, addToCart, setActiveProduct, getItemPrice,
  subtotal, finalTotal, loyaltyDiscount, setLoyaltyDiscount, storeSettings,
  storeOpen, getTimeBounds, isValidScheduledTime,
  requestedTime, setRequestedTime, orderNote, setOrderNote, paymentMethod,
  setPaymentMethod, submitOrder, isSubmitting, placedOrder, handleCustomerPickup,
  handleRepeatOrder, getLocaleDateString, menuItems, onEditItem, onAddNewItem
}: any) {
  const [cooldown, setCooldown] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatOrderId, setActiveChatOrderId] = useState<number | null>(null);
  const [hasUnreadStoreMsg, setHasUnreadStoreMsg] = useState(false);

  const chatUi = CHAT_UI_DICT[lang] || CHAT_UI_DICT['da'];

  useEffect(() => {
    const checkCooldown = () => {
      const lastTime = localStorage.getItem("servato_time");
      if (lastTime) {
        const elapsed = Date.now() - parseInt(lastTime, 10);
        const remaining = 180000 - elapsed;
        if (remaining > 0) setCooldown(Math.ceil(remaining / 1000));
        else setCooldown(0);
      }
    };
    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [isCartOpen, checkoutStep]);

  useEffect(() => {
    if (!placedOrder?.id || isChatOpen) return;

    const channel = supabase
      .channel(`hidden_chat_${placedOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_chats',
          filter: `order_id=eq.${placedOrder.id}`,
        },
        (payload) => {
          if (payload.new.is_store) {
            setHasUnreadStoreMsg(true);
            const audio = new Audio('/chat-alert.mp3.wav');
            audio.play().catch(() => console.log("Audio blocked by browser"));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [placedOrder?.id, isChatOpen]);

  const openSupportChat = (orderId: number) => {
    setActiveChatOrderId(orderId);
    setHasUnreadStoreMsg(false);
    setIsChatOpen(true);
  };

  if (!isCartOpen) return null;

  const bounds = getTimeBounds
    ? getTimeBounds()
    : { canSchedule: storeOpen, minTime: '', maxTime: '', openDisplay: '', closeDisplay: '' };
  const isCustomTime = requestedTime !== 'ASAP';
  const isSelectedTimeValid = !isCustomTime
    ? storeOpen
    : (isValidScheduledTime ? isValidScheduledTime(requestedTime) : true);
  const canSubmitWithTime = isCustomTime ? (bounds.canSchedule && isSelectedTimeValid) : storeOpen;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full md:max-w-md bg-[#0F172A] h-full flex flex-col shadow-2xl md:border-l border-white/10 animate-fade-in-up md:animate-slide-in-right relative overflow-hidden">
        {isChatOpen && activeChatOrderId ? (
          <SupportChatView
            orderId={activeChatOrderId}
            userId={auth.user?.id}
            chatUi={chatUi}
            onBack={() => setIsChatOpen(false)}
          />
        ) : (
          <>
            {/* HEADER ΚΑΛΑΘΙΟΥ */}
            <div className="p-4 md:p-5 border-b border-white/5 flex justify-between items-center bg-slate-900 shrink-0">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                {checkoutStep === 'profile' ? ui.profileTitle : ui.cartTitle}
              </h2>
              {checkoutStep !== 'success' && (
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    if (checkoutStep === 'review' || checkoutStep === 'profile') setCheckoutStep('cart');
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <Icons.Close />
                </button>
              )}
            </div>

            {/* ΣΩΜΑ ΚΑΛΑΘΙΟΥ */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 pb-8">
              {checkoutStep === 'profile' ? (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="text-center mb-2">
                    <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto flex items-center justify-center text-gray-400 mb-3">
                      <Icons.User />
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {auth.customerName || auth.user?.email}
                    </h3>
                    <p className="text-sm text-gray-400">{auth.customerPhone}</p>
                  </div>
                  <LoyaltyWallet
                    userId={auth.user?.id}
                    subtotal={0}
                    lang={lang}
                    onApplyDiscount={() => {}}
                    settings={storeSettings}
                  />
                  <div className="bg-slate-800/30 rounded-2xl border border-white/5 p-5">
                    <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
                      {ui.myOrders}
                    </h4>
                    {auth.userOrderHistory.length === 0 ? (
                      <p className="text-sm text-gray-500 font-medium">No orders yet.</p>
                    ) : (
                      <ul className="space-y-4">
                        {auth.userOrderHistory.map((o: any) => (
                          <li
                            key={o.id}
                            className="flex flex-col gap-3 border-b border-white/5 pb-4 last:border-0 last:pb-0"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-white text-sm">
                                  #{o.order_number || o.id.toString().slice(-4)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {getLocaleDateString(o.created_at, lang)} - {o.total_price} kr.
                                </p>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">
                                  {o.items
                                    ?.map(
                                      (i: any) =>
                                        `${i.quantity}x ${
                                          i[`title_${lang}`] || i.title_en || i.title_da || 'Item'
                                        }`
                                    )
                                    .join(', ')}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span
                                  className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wide ${
                                    o.status === 'completed'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                  }`}
                                >
                                  {o.status}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => openSupportChat(o.id)}
                                    className="bg-slate-700 hover:bg-slate-600 text-gray-300 w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-transparent hover:border-slate-500"
                                    title={chatUi.needHelp}
                                  >
                                    💬
                                  </button>
                                  <button
                                    onClick={() => handleRepeatOrder(o)}
                                    className="text-[#38BDF8] hover:bg-[#38BDF8]/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-transparent hover:border-[#38BDF8]/20"
                                  >
                                    <Icons.Repeat /> {t.repeatOrder}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      auth.logout(() => {
                        setIsCartOpen(false);
                        setCheckoutStep('cart');
                      })
                    }
                    className="w-full text-red-400 hover:bg-red-500/10 font-bold py-3.5 rounded-xl transition-colors mt-2 text-sm uppercase tracking-wide"
                  >
                    {ui.logout}
                  </button>
                </div>
              ) : checkoutStep === 'review' ? (
                <div className="flex flex-col items-center justify-center py-10 h-full text-center animate-fade-in">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-[#38BDF8] mb-6">
                    <Icons.Check />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3 uppercase tracking-wide">
                    {ui.thankYou}
                  </h2>
                  <p className="text-gray-400 text-sm mb-10 px-4 leading-relaxed">
                    {ui.reviewPrompt}
                  </p>
                  <a
                    href="https://qr.abcrfid.com/re?uid=0475AD2DBC2A81"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#38BDF8] text-[#0B1120] font-bold uppercase tracking-wide py-4 rounded-xl mb-4 block"
                  >
                    {ui.leaveReview}
                  </a>
                  <button
                    onClick={() => {
                      setCheckoutStep('cart');
                      setIsCartOpen(false);
                    }}
                    className="w-full bg-slate-800 text-gray-300 font-bold uppercase tracking-wide py-4 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    {ui.close}
                  </button>
                </div>
              ) : checkoutStep === 'success' ? (
                <OrderTrackingView
                  placedOrder={placedOrder}
                  lang={lang}
                  ui={ui}
                  t={t}
                  chatUi={chatUi}
                  hasUnreadStoreMsg={hasUnreadStoreMsg}
                  onCustomerPickup={handleCustomerPickup}
                  onOpenChat={openSupportChat}
                />
              ) : checkoutStep === 'auth' ? (
                <AuthCheckoutStep
                  lang={lang}
                  ui={ui}
                  t={t}
                  chatUi={chatUi}
                  auth={auth}
                  onProceedToCheckout={() => setCheckoutStep('checkout')}
                />
              ) : cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-24 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 mb-4">
                    <Icons.Cart />
                  </div>
                  <p className="font-medium text-lg">{ui.emptyCart}</p>
                </div>
              ) : checkoutStep === 'cart' ? (
                <div className="flex flex-col gap-4">
                  <div className="mb-2 flex items-center justify-center gap-2 p-3 rounded-2xl bg-sky-900/30 border border-sky-800/50 -mt-2">
                    <span className="font-black text-[11px] text-sky-400 tracking-wider flex items-center gap-2 uppercase">
                      🛍️ {chatUi.takeawayTag}
                    </span>
                  </div>

                  <div className="mb-2 -mt-2">
                    <SmartUpsell
                      cart={cart}
                      menuItems={menuItems}
                      lang={lang}
                      onAdd={(item: any) => {
                        if (item._directAdd) {
                          addToCart(item.item, 1);
                        } else if (onAddNewItem) {
                          onAddNewItem(item);
                        } else {
                          setActiveProduct(item);
                          setIsCartOpen(false);
                        }
                      }}
                    />
                  </div>

                  {cart.map((cartItem: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex flex-col bg-slate-800/30 p-4 rounded-2xl border border-white/5"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div
                          className="flex-1 pr-3 cursor-pointer group flex flex-col items-start"
                          onClick={() => onEditItem && onEditItem(cartItem)}
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-bold text-white text-sm leading-tight group-hover:text-[#38BDF8] transition-colors">
                              {cartItem.item[`title_${lang}`] || cartItem.item.name}
                            </p>
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded border border-[#38BDF8]/30 group-hover:bg-[#38BDF8] group-hover:text-[#0B1120] transition-colors shadow-sm">
                              ✎{' '}
                              {lang === 'da'
                                ? 'Ret'
                                : lang === 'en'
                                ? 'Edit'
                                : 'Επεξεργασία'}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-[#38BDF8]">
                            {getItemPrice(cartItem.item)} DKK
                          </p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1 border border-white/5">
                          <button
                            onClick={() => updateQuantity(cartItem.cartId, -1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-slate-800 rounded-md font-bold transition-colors"
                          >
                            -
                          </button>
                          <span className="font-bold text-sm w-4 text-center">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(cartItem.cartId, 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-slate-800 rounded-md font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="ml-3">
                          <button
                            onClick={() => removeFromCart(cartItem.cartId)}
                            className="text-gray-500 hover:text-red-400 p-2 transition-colors"
                          >
                            <Icons.Close />
                          </button>
                        </div>
                      </div>
                      {cartItem.item.selectedOptions?.length > 0 && (
                        <p className="text-xs text-gray-400 border-t border-white/5 pt-3 mt-1">
                          + {cartItem.item.selectedOptions.join(', ')}
                        </p>
                      )}
                      {cartItem.item.note && (
                        <p className="text-xs text-gray-400 italic mt-2">
                          Note: {cartItem.item.note}
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
                    <a
                      href="tel:+4542177754"
                      className="flex-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      📞 {chatUi.callUs}
                    </a>
                  </div>
                </div>
              ) : (
                <form id="checkoutForm" onSubmit={submitOrder} className="flex flex-col gap-6">
                  <h3 className="font-bold text-lg text-white border-b border-white/10 pb-3 uppercase tracking-wide">
                    {ui.detailsTitle}
                  </h3>
                  <LoyaltyWallet
                    userId={auth.user?.id}
                    subtotal={subtotal}
                    lang={lang}
                    onApplyDiscount={setLoyaltyDiscount}
                    settings={storeSettings}
                  />
                  <div>
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">
                      {ui.nameLabel}
                    </label>
                    <input
                      type="text"
                      value={auth.customerName}
                      onChange={(e) => auth.setCustomerName(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">
                      {ui.phoneLabel}
                    </label>
                    <input
                      type="tel"
                      value={auth.customerPhone}
                      onChange={(e) => auth.setCustomerPhone(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors"
                    />
                  </div>

                  {(storeOpen || bounds.canSchedule) && (
                    <div>
                      <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">
                        {ui.timeLabel}
                      </label>
                      <div className="grid grid-cols-2 gap-2.5 mb-3">
                        <button
                          type="button"
                          disabled={!storeOpen}
                          onClick={() => setRequestedTime('ASAP')}
                          className={`p-3.5 rounded-xl border text-center transition-colors font-bold uppercase tracking-wide text-xs ${
                            requestedTime === 'ASAP' && storeOpen
                              ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-[#38BDF8]'
                              : 'bg-slate-900 border-white/5 text-gray-400 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed'
                          }`}
                        >
                          ⚡ {ui?.asap || 'ASAP'}
                        </button>

                        <button
                          type="button"
                          disabled={!bounds.canSchedule}
                          onClick={() => {
                            if (requestedTime === 'ASAP') {
                              setRequestedTime(bounds.minTime || '18:00');
                            }
                          }}
                          className={`p-3.5 rounded-xl border text-center transition-colors font-bold uppercase tracking-wide text-xs ${
                            isCustomTime
                              ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-[#38BDF8]'
                              : 'bg-slate-900 border-white/5 text-gray-400 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed'
                          }`}
                        >
                          🕒 {chatUi.chooseExactTime}
                        </button>
                      </div>

                      {isCustomTime && bounds.canSchedule && (
                        <div className="bg-slate-900/90 border border-white/10 rounded-xl p-3.5 flex flex-col gap-2 animate-fade-in">
                          <div className="flex items-center justify-between gap-3">
                            <input
                              type="time"
                              step={60}
                              min={bounds.minTime}
                              max={bounds.maxTime}
                              value={requestedTime}
                              onChange={(e) => setRequestedTime(e.target.value)}
                              required
                              className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-base outline-none focus:border-[#38BDF8]"
                            />
                            <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap">
                              {bounds.openDisplay} - {bounds.closeDisplay}
                            </span>
                          </div>

                          {!isSelectedTimeValid && (
                            <p className="text-xs text-red-400 font-bold">
                              {chatUi.invalidTimeMsg}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">
                      {ui.orderNoteTitle}
                    </label>
                    <textarea
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder={ui.orderNotePlh}
                      rows={2}
                      className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 resize-none transition-colors"
                    ></textarea>
                  </div>
                  <div className="mt-2">
                    <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-3">
                      {ui.payLabel}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        onClick={() => setPaymentMethod('card')}
                        className={`cursor-pointer p-4 rounded-xl border text-center transition-colors font-bold uppercase tracking-wide text-xs ${
                          paymentMethod === 'card'
                            ? 'bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8]'
                            : 'bg-slate-900 border-white/5 text-gray-400 hover:bg-slate-800'
                        }`}
                      >
                        {t.card}
                      </div>
                      <div
                        onClick={() => setPaymentMethod('cash')}
                        className={`cursor-pointer p-4 rounded-xl border text-center transition-colors font-bold uppercase tracking-wide text-xs ${
                          paymentMethod === 'cash'
                            ? 'bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8]'
                            : 'bg-slate-900 border-white/5 text-gray-400 hover:bg-slate-800'
                        }`}
                      >
                        {t.cash}
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* FOOTER */}
            {cart.length > 0 &&
              checkoutStep !== 'success' &&
              checkoutStep !== 'review' &&
              checkoutStep !== 'profile' && (
                <div className="p-4 md:p-5 bg-slate-900 border-t border-white/5 shrink-0 flex flex-col z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">{ui.subtotal}</span>
                    <span className="text-white font-bold">{subtotal} kr.</span>
                  </div>
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between items-center mb-2 text-[#38BDF8]">
                      <span className="text-sm">{ui.loyaltyDiscount}</span>
                      <span className="font-bold">-{loyaltyDiscount.toFixed(2)} kr.</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2 mb-5 border-t border-white/5 pt-3">
                    <span className="text-white font-bold uppercase tracking-wide">
                      {ui.totalPay}
                    </span>
                    <span className="text-2xl font-bold text-[#38BDF8]">
                      {finalTotal.toFixed(2)} kr.
                    </span>
                  </div>

                  {!storeOpen && !bounds.canSchedule ? (
                    <div className="flex flex-col gap-2 animate-fade-in-up">
                      <button
                        disabled
                        className="w-full bg-red-900/50 text-red-300 font-black uppercase tracking-widest py-3.5 rounded-xl border border-red-500/30 cursor-not-allowed"
                      >
                        {lang === 'da'
                          ? 'MIDLERTIDIGT LUKKET'
                          : lang === 'en'
                          ? 'TEMPORARILY CLOSED'
                          : 'ΠΡΟΣΩΡΙΝΑ ΚΛΕΙΣΤΟ'}
                      </button>
                      <p className="text-xs text-red-400 font-bold text-center italic">
                        {lang === 'da'
                          ? 'På grund af travlhed modtager vi i øjeblikket ikke nye ordrer. Prøv venligst igen senere!'
                          : lang === 'en'
                          ? 'Due to high demand, we are currently not accepting new orders. Please try again later!'
                          : 'Λόγω φόρτου εργασίας δεν δεχόμαστε νέες παραγγελίες αυτή τη στιγμή. Δοκιμάστε ξανά αργότερα!'}
                      </p>
                    </div>
                  ) : checkoutStep === 'cart' ? (
                    <button
                      onClick={() =>
                        auth.user ? setCheckoutStep('checkout') : setCheckoutStep('auth')
                      }
                      className="w-full bg-[#38BDF8] text-[#0B1120] font-bold uppercase tracking-wide py-3.5 rounded-xl hover:bg-sky-400 transition-colors"
                    >
                      {ui.toCheckout}
                    </button>
                  ) : checkoutStep === 'auth' ? (
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('cart')}
                      className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 uppercase tracking-wide transition-colors"
                    >
                      {ui.backToCart}
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setCheckoutStep('cart')}
                        className="px-5 py-3.5 rounded-xl bg-slate-800 text-white font-bold uppercase tracking-wide hover:bg-slate-700 transition-colors"
                      >
                        {ui.back}
                      </button>
                      <button
                        type="submit"
                        form="checkoutForm"
                        disabled={isSubmitting || cooldown > 0 || !canSubmitWithTime}
                        className="flex-1 bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-bold py-3.5 rounded-xl disabled:opacity-50 uppercase tracking-wide transition-colors"
                      >
                        {cooldown > 0
                          ? lang === 'da'
                            ? `VENT ${cooldown}s`
                            : lang === 'en'
                            ? `WAIT ${cooldown}s`
                            : `ΑΝΑΜΟΝΗ ${cooldown}s`
                          : isSubmitting
                          ? ui.sending
                          : ui.confirm}
                      </button>
                    </div>
                  )}

                  <div className="text-center mt-3">
                    <a
                      href="/privacy.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Privacy Policy & Terms (Nordic-mythos 1 ApS)
                    </a>
                  </div>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}
