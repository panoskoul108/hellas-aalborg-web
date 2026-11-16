'use client';
import React, { useState, useEffect, useRef } from 'react';
import LoyaltyWallet from './LoyaltyWallet'; 
import SmartUpsell from './SmartUpsell';
import { Icons } from '../Icons';
import { supabase } from '../../app/supabase'; 

export default function CheckoutSidebar({
  isCartOpen, setIsCartOpen, checkoutStep, setCheckoutStep, lang, ui, t, auth, cart,
  updateQuantity, removeFromCart, addToCart, setActiveProduct, getItemPrice,
  subtotal, finalTotal, loyaltyDiscount, setLoyaltyDiscount, storeSettings,
  storeOpen, generateTimeSlots, requestedTime, setRequestedTime, orderNote,
  setOrderNote, paymentMethod, setPaymentMethod, submitOrder, isSubmitting,
  placedOrder, handleCustomerPickup, handleRepeatOrder, getLocaleDateString, menuItems,
  onEditItem, onAddNewItem
}: any) {
  
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // --- STATES ΓΙΑ ΤΟ CHAT ΥΠΟΣΤΗΡΙΞΗΣ ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatOrderId, setActiveChatOrderId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [hasUnreadStoreMsg, setHasUnreadStoreMsg] = useState(false);

  // Λεξικό για το Chat
  const chatUiDict: Record<string, any> = {
    da: { needHelp: "Brug for hjælp?", support: "Kundeservice", typeMsg: "Skriv en besked...", send: "Send", you: "Dig", store: "Hellas Aalborg", empty: "Skriv dit problem her, så svarer vi hurtigst muligt!", callUs: "RING TIL OS", takeawayTag: "TAKEAWAY - AFHENT I BUTIK" },
    en: { needHelp: "Report a problem", support: "Support Chat", typeMsg: "Type a message...", send: "Send", you: "You", store: "Hellas Aalborg", empty: "Describe your issue here and we'll reply ASAP!", callUs: "CALL STORE", takeawayTag: "TAKEAWAY - STORE PICKUP" },
    el: { needHelp: "Αναφορά Προβλήματος", support: "Συνομιλία Υποστήριξης", typeMsg: "Γράψτε το μήνυμά σας...", send: "Αποστολή", you: "Εσείς", store: "Hellas Aalborg", empty: "Γράψτε μας το πρόβλημά σας και θα απαντήσουμε άμεσα!", callUs: "ΚΛΗΣΗ ΚΑΤΑΣΤΗΜΑΤΟΣ", takeawayTag: "TAKEAWAY - ΠΑΡΑΛΑΒΗ ΑΠΟ ΚΑΤΑΣΤΗΜΑ" }
  };
  const chatUi = chatUiDict[lang] || chatUiDict['da'];

  useEffect(() => {
    if (checkoutStep === 'auth') setShowAuthForm(false);
  }, [checkoutStep]);

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

  // --- EFFECT ΓΙΑ ΦΟΡΤΩΣΗ, REALTIME CHAT & ΕΙΔΟΠΟΙΗΣΕΙΣ ΑΠΟ ΤΟ ΜΑΓΑΖΙ ---
  useEffect(() => {
    let channel: any;
    
    if (isChatOpen && activeChatOrderId) {
      setHasUnreadStoreMsg(false);
      const fetchMsgs = async () => {
        const { data } = await supabase.from('support_chats').select('*').eq('order_id', activeChatOrderId).order('created_at', { ascending: true });
        if (data) setChatMessages(data);
      };
      fetchMsgs();

      channel = supabase.channel(`chat_order_${activeChatOrderId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_chats', filter: `order_id=eq.${activeChatOrderId}` }, (payload) => {
          setChatMessages(prev => [...prev, payload.new]);
        }).subscribe();
    } 
    else if (placedOrder?.id && !isChatOpen) {
      channel = supabase.channel(`hidden_chat_${placedOrder.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_chats', filter: `order_id=eq.${placedOrder.id}` }, (payload) => {
          if (payload.new.is_store) {
            setHasUnreadStoreMsg(true);
            const audio = new Audio('/chat-alert.mp3.wav');
            audio.play().catch(e => console.log("Audio blocked by browser"));
          }
        }).subscribe();
    }
    
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [isChatOpen, activeChatOrderId, placedOrder?.id]);

  useEffect(() => {
    if (isChatOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatOrderId) return;
    const msg = chatInput.trim();
    setChatInput('');
    await supabase.from('support_chats').insert([{
      order_id: activeChatOrderId,
      user_id: auth.user?.id || null,
      message: msg,
      is_store: false
    }]);
  };

  const openSupportChat = (orderId: number) => {
    setActiveChatOrderId(orderId);
    setHasUnreadStoreMsg(false);
    setIsChatOpen(true);
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full md:max-w-md bg-[#0F172A] h-full flex flex-col shadow-2xl md:border-l border-white/10 animate-fade-in-up md:animate-slide-in-right relative overflow-hidden">
        
        {/* === ΠΕΡΙΒΑΛΛΟΝ CHAT ΥΠΟΣΤΗΡΙΞΗΣ === */}
        {isChatOpen ? (
          <div className="flex flex-col h-full w-full bg-[#0F172A] absolute inset-0 z-50">
            <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-slate-900 shrink-0 shadow-md">
              <button onClick={() => setIsChatOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
                ←
              </button>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">{chatUi.support}</h2>
                <p className="text-[10px] text-[#38BDF8] font-black uppercase">Order #{activeChatOrderId?.toString().slice(-4)}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 my-auto flex flex-col items-center gap-3">
                  <span className="text-4xl">👋</span>
                  <p className="text-xs font-bold uppercase">{chatUi.empty}</p>
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.is_store ? 'self-start' : 'self-end'}`}>
                  <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 mx-1 ${msg.is_store ? 'text-emerald-400' : 'text-[#38BDF8] text-right'}`}>
                    {msg.is_store ? chatUi.store : chatUi.you}
                  </span>
                  <div className={`px-4 py-3 rounded-2xl text-sm font-medium ${msg.is_store ? 'bg-slate-800 text-white rounded-tl-sm shadow-sm' : 'bg-[#38BDF8] text-[#0B1120] rounded-tr-sm shadow-md'}`}>
                    {msg.message}
                  </div>
                  <span className="text-[9px] text-gray-500 mt-1 mx-1 font-bold">
                    {new Date(msg.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendChatMessage} className="p-4 bg-slate-900 border-t border-white/5 flex gap-2 shrink-0 pb-8 md:pb-4">
              <input 
                type="text" 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                placeholder={chatUi.typeMsg} 
                className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#38BDF8] transition-colors"
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim()}
                className="bg-[#38BDF8] text-[#0B1120] font-black uppercase text-xs px-5 rounded-xl disabled:opacity-50 transition-colors"
              >
                {chatUi.send}
              </button>
            </form>
          </div>
        ) : (
          
          /* === ΚΑΝΟΝΙΚΟ ΠΕΡΙΒΑΛΛΟΝ ΚΑΛΑΘΙΟΥ === */
          <>
            {/* HEADER ΚΑΛΑΘΙΟΥ */}
            <div className="p-4 md:p-5 border-b border-white/5 flex justify-between items-center bg-slate-900 shrink-0">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">{checkoutStep === 'profile' ? ui.profileTitle : ui.cartTitle}</h2>
              {checkoutStep !== 'success' && <button onClick={() => { setIsCartOpen(false); if(checkoutStep === 'review' || checkoutStep === 'profile') setCheckoutStep('cart'); }} className="text-gray-400 hover:text-white transition-colors p-1"><Icons.Close /></button>}
            </div>

            {/* ΣΩΜΑ ΚΑΛΑΘΙΟΥ (ΣΚΡΟΛΑΡΕΙ) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 pb-8">
              {checkoutStep === 'profile' ? (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="text-center mb-2"><div className="w-16 h-16 bg-slate-800 rounded-full mx-auto flex items-center justify-center text-gray-400 mb-3"><Icons.User /></div><h3 className="text-lg font-bold text-white">{auth.customerName || auth.user?.email}</h3><p className="text-sm text-gray-400">{auth.customerPhone}</p></div>
                  <LoyaltyWallet userId={auth.user?.id} subtotal={0} lang={lang} onApplyDiscount={() => {}} settings={storeSettings} />
                  <div className="bg-slate-800/30 rounded-2xl border border-white/5 p-5">
                    <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4 border-b border-white/5 pb-2">{ui.myOrders}</h4>
                    {auth.userOrderHistory.length === 0 ? <p className="text-sm text-gray-500 font-medium">No orders yet.</p> : (
                      <ul className="space-y-4">
                        {auth.userOrderHistory.map((o: any) => (
                          <li key={o.id} className="flex flex-col gap-3 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-white text-sm">#{o.order_number || o.id.toString().slice(-4)}</p>
                                <p className="text-xs text-gray-400 mt-1">{getLocaleDateString(o.created_at, lang)} - {o.total_price} kr.</p>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{o.items?.map((i:any) => `${i.quantity}x ${i[`title_${lang}`] || i.title_en || i.title_da || 'Item'}`).join(', ')}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wide ${o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>{o.status}</span>
                                
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => openSupportChat(o.id)} className="bg-slate-700 hover:bg-slate-600 text-gray-300 w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-transparent hover:border-slate-500" title={chatUi.needHelp}>
                                    💬
                                  </button>
                                  <button onClick={() => handleRepeatOrder(o)} className="text-[#38BDF8] hover:bg-[#38BDF8]/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-transparent hover:border-[#38BDF8]/20"><Icons.Repeat /> {t.repeatOrder}</button>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button onClick={() => auth.logout(() => { setIsCartOpen(false); setCheckoutStep('cart'); })} className="w-full text-red-400 hover:bg-red-500/10 font-bold py-3.5 rounded-xl transition-colors mt-2 text-sm uppercase tracking-wide">{ui.logout}</button>
                </div>
              ) : checkoutStep === 'review' ? (
                <div className="flex flex-col items-center justify-center py-10 h-full text-center animate-fade-in">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-[#38BDF8] mb-6"><Icons.Check /></div>
                  <h2 className="text-2xl font-bold text-white mb-3 uppercase tracking-wide">{ui.thankYou}</h2><p className="text-gray-400 text-sm mb-10 px-4 leading-relaxed">{ui.reviewPrompt}</p>
                  <a href="https://qr.abcrfid.com/re?uid=0475AD2DBC2A81" target="_blank" rel="noopener noreferrer" className="w-full bg-[#38BDF8] text-[#0B1120] font-bold uppercase tracking-wide py-4 rounded-xl mb-4 block">{ui.leaveReview}</a>
                  <button onClick={() => { setCheckoutStep('cart'); setIsCartOpen(false); }} className="w-full bg-slate-800 text-gray-300 font-bold uppercase tracking-wide py-4 rounded-xl hover:bg-slate-700 transition-colors">{ui.close}</button>
                </div>
              ) : checkoutStep === 'success' ? (
                <div className="flex flex-col items-center py-6 w-full">
                  <h2 className="text-xl font-bold text-white mb-8 tracking-widest text-center">#{placedOrder?.order_number || placedOrder?.id?.toString().slice(-4)}</h2>
                  
                  {placedOrder?.status !== 'cancelled' && (
                    <div className="w-full mb-10 relative">
                      <div className="absolute top-4 left-0 h-1 bg-slate-800 w-full -z-10 rounded-full"></div><div className={`absolute top-4 left-0 h-1 bg-[#38BDF8] -z-10 transition-all duration-700 ease-out rounded-full ${placedOrder?.status === 'pending' ? 'w-[15%]' : placedOrder?.status === 'preparing' ? 'w-[50%]' : 'w-full !bg-emerald-500'}`}></div>
                      <div className="flex justify-between">
                        <div className="flex flex-col items-center gap-3"><div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${placedOrder?.status === 'pending' || placedOrder?.status === 'preparing' || placedOrder?.status === 'completed' ? 'bg-[#38BDF8] text-[#0B1120]' : 'bg-slate-800 text-gray-500'}`}>1</div><span className={`text-[10px] font-bold uppercase tracking-wider ${placedOrder?.status === 'pending' ? 'text-white' : 'text-gray-500'}`}>{ui.trackPending}</span></div>
                        <div className="flex flex-col items-center gap-3"><div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${placedOrder?.status === 'preparing' || placedOrder?.status === 'completed' ? 'bg-[#38BDF8] text-[#0B1120]' : 'bg-slate-800 text-gray-500'}`}>2</div><span className={`text-[10px] font-bold uppercase tracking-wider ${placedOrder?.status === 'preparing' ? 'text-white' : 'text-gray-500'}`}>{ui.trackPrep}</span></div>
                        <div className="flex flex-col items-center gap-3"><div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${placedOrder?.status === 'completed' ? 'bg-emerald-500 text-[#0B1120]' : 'bg-slate-800 text-gray-500'}`}>3</div><span className={`text-[10px] font-bold uppercase tracking-wider ${placedOrder?.status === 'completed' ? 'text-emerald-400' : 'text-gray-500'}`}>{ui.trackReady}</span></div>
                      </div>
                    </div>
                  )}

                  <div className="w-full bg-slate-800/30 border border-white/5 rounded-2xl p-8 mb-6 text-center">
                    {placedOrder?.status === 'pending' && (<div className="animate-fade-in"><div className="w-12 h-12 border-4 border-[#38BDF8]/20 border-t-[#38BDF8] rounded-full animate-spin mx-auto mb-5"></div><h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">{ui.trackPendingTitle}</h3><p className="text-sm text-gray-400">{ui.trackPendingDesc}</p></div>)}
                    {placedOrder?.status === 'preparing' && (<div className="animate-fade-in"><div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-orange-400 mx-auto mb-5 animate-pulse"><Icons.Clock /></div><h3 className="text-lg font-bold text-white mb-5 uppercase tracking-wide">{ui.trackPrepTitle}</h3><div className="bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-xl p-4 inline-block"><p className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-widest mb-1">{ui.trackPrepTime}</p><p className="text-4xl font-bold text-white">{placedOrder?.requested_time && placedOrder.requested_time !== 'ASAP' ? placedOrder.requested_time.slice(0, 5) : '...'}</p></div></div>)}
                    {placedOrder?.status === 'completed' && (<div className="animate-fade-in"><div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-5"><Icons.Check /></div><h3 className="text-lg font-bold text-emerald-400 mb-3 uppercase tracking-wide">{ui.trackReadyTitle}</h3><p className="text-sm text-gray-300 mb-8">{ui.trackReadyDesc}</p><button onClick={handleCustomerPickup} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0B1120] font-bold text-sm uppercase py-4 rounded-xl transition-colors tracking-wide">{t.pickupConfirm}</button></div>)}
                    
                    {placedOrder?.status === 'cancelled' && (
                      <div className="animate-fade-in">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mx-auto mb-5">
                          <Icons.Close />
                        </div>
                        <h3 className="text-lg font-bold text-red-400 mb-3 uppercase tracking-wide">
                          {lang === 'da' ? 'Ordren er annulleret' : lang === 'en' ? 'Order Cancelled' : 'Η παραγγελία ακυρώθηκε'}
                        </h3>
                        <p className="text-sm text-gray-300 mb-8">
                          {lang === 'da' ? 'Beklager, vi kan desværre ikke behandle denne ordre på nuværende tidspunkt.' : 
                           lang === 'en' ? 'Sorry, we cannot fulfill this order at this time.' : 
                           'Συγγνώμη, δεν μπορούμε να εξυπηρετήσουμε αυτή την παραγγελία αυτή τη στιγμή.'}
                        </p>
                        <button 
                          onClick={() => { 
                            localStorage.removeItem('hellas_active_order'); 
                            window.location.reload(); 
                          }} 
                          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm uppercase py-4 rounded-xl transition-colors tracking-wide"
                        >
                          {ui.close || (lang === 'da' ? 'LUK' : lang === 'en' ? 'CLOSE' : 'ΚΛΕΙΣΙΜΟ')}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => openSupportChat(placedOrder.id)}
                    className={`w-full font-bold uppercase tracking-widest text-xs py-4 rounded-2xl flex items-center justify-center gap-2 transition-all relative ${
                      hasUnreadStoreMsg ? 'bg-[#38BDF8] text-[#0B1120] shadow-lg animate-pulse' : 'bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700'
                    }`}
                  >
                    💬 {chatUi.needHelp}
                    {hasUnreadStoreMsg && (
                      <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-[#0B1120]">!</span>
                    )}
                  </button>

                </div>
              ) : checkoutStep === 'auth' ? (
                <div className="flex flex-col gap-6 animate-fade-in py-2">
                  <div className="bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center shrink-0"><Icons.Gift /></div>
                    <div>
                      <h4 className="font-bold text-white text-sm mb-1">{lang === 'da' ? 'Opret konto & få 35 DKK!' : lang === 'en' ? 'Create an account & get 35 DKK!' : 'Φτιάξε λογαριασμό & κέρδισε 35 DKK!'}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">{lang === 'da' ? 'Saml point og spar på dine næste ordrer.' : lang === 'en' ? 'Collect points and save on your next orders.' : 'Μάζεψε πόντους και κέρδισε έκπτωση στις επόμενες παραγγελίες σου.'}</p>
                    </div>
                  </div>

                  {!showAuthForm ? (
                    <div className="flex flex-col gap-4 mt-2 animate-fade-in">
                      <button 
                        onClick={() => setShowAuthForm(true)} 
                        className="w-full bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black py-4 rounded-xl uppercase tracking-wide transition-transform active:scale-95 shadow-md"
                      >
                        {lang === 'da' ? 'Opret konto / Log ind' : lang === 'en' ? 'Create Account / Login' : 'Εγγραφη / Εισοδος'}
                      </button>

                      <div className="flex items-center gap-4 my-2 opacity-50">
                        <hr className="flex-1 border-slate-600" />
                        <span className="text-xs text-slate-400 font-bold uppercase">{ui.or}</span>
                        <hr className="flex-1 border-slate-600" />
                      </div>

                      <div className="text-center">
                        <button 
                          onClick={() => setCheckoutStep('checkout')} 
                          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-white/5 uppercase tracking-wide transition-colors"
                        >
                          {ui.guestCheckout}
                        </button>
                        <p className="text-gray-400 text-xs mt-4">{ui.guestDesc}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      <div className="bg-slate-800/30 p-6 rounded-2xl border border-white/5 relative">
                        <button 
                          onClick={() => setShowAuthForm(false)} 
                          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
                        >
                          <Icons.Close />
                        </button>
                        
                        <h3 className="text-base font-bold text-white text-center mb-6 uppercase tracking-wide">{auth.authMode === 'signup' ? ui.regTitle : ui.loginTitle}</h3>
                        
                        <form onSubmit={(e) => auth.handleAuth(e, () => setCheckoutStep('checkout'))} className="flex flex-col gap-4">
                          {auth.authError && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm font-medium text-center border border-red-500/20">{auth.authError}</div>}
                          
                          {auth.authMode === 'signup' && (
                            <div className="flex flex-col gap-4 animate-fade-in">
                              <input type="text" placeholder={ui.nameLabel} value={auth.regName} onChange={e => auth.setRegName(e.target.value)} required className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors" />
                              <input type="tel" placeholder={ui.phoneLabel} value={auth.regPhone} onChange={e => auth.setRegPhone(e.target.value)} required className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors" />
                              <input type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }} placeholder={t.dobPlaceholder} value={auth.regDob} onChange={e => auth.setRegDob(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors" />
                            </div>
                          )}
                          <input type="email" placeholder={ui.emailPlh} value={auth.email} onChange={e => auth.setEmail(e.target.value)} required className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors" />
                          <input type="password" placeholder={ui.passPlh} value={auth.password} onChange={e => auth.setPassword(e.target.value)} required className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors" />
                          <button type="submit" className="w-full bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-bold py-4 rounded-xl mt-2 uppercase tracking-wide transition-colors">{auth.authMode === 'signup' ? ui.regTitle : ui.loginTitle}</button>
                        </form>
                        
                        <button type="button" onClick={() => { auth.setAuthMode(auth.authMode === 'signup' ? 'login' : 'signup'); auth.setAuthError(''); }} className="w-full text-sm text-[#38BDF8] hover:text-sky-300 mt-6 font-bold transition-colors">{auth.authMode === 'signup' ? ui.hasAcc : ui.noAcc}</button>
                      </div>

                      <div className="flex items-center gap-4 my-2 opacity-50">
                        <hr className="flex-1 border-slate-600" />
                        <span className="text-xs text-slate-400 font-bold uppercase">{ui.or}</span>
                        <hr className="flex-1 border-slate-600" />
                      </div>

                      <button 
                        onClick={() => setCheckoutStep('checkout')} 
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-white/5 uppercase tracking-wide transition-colors"
                      >
                        {ui.guestCheckout}
                      </button>
                    </div>
                  )}
                </div>
                
              ) : cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-24 flex flex-col items-center"><div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 mb-4"><Icons.Cart /></div><p className="font-medium text-lg">{ui.emptyCart}</p></div>
              ) : checkoutStep === 'cart' ? (
                <div className="flex flex-col gap-4">
                  
                  {/* ΝΕΟ: ΕΜΦΑΝΕΣ TAKEAWAY TAG (Αντικατέστησε τη Wolt) */}
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
                    <div key={idx} className="flex flex-col bg-slate-800/30 p-4 rounded-2xl border border-white/5">
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
                              ✎ {lang === 'da' ? 'Ret' : lang === 'en' ? 'Edit' : 'Επεξεργασία'}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-[#38BDF8]">{getItemPrice(cartItem.item)} DKK</p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1 border border-white/5">
                          <button onClick={() => updateQuantity(cartItem.cartId, -1)} className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-slate-800 rounded-md font-bold transition-colors">-</button>
                          <span className="font-bold text-sm w-4 text-center">{cartItem.quantity}</span>
                          <button onClick={() => updateQuantity(cartItem.cartId, 1)} className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-slate-800 rounded-md font-bold transition-colors">+</button>
                        </div>
                        <div className="ml-3">
                          <button onClick={() => removeFromCart(cartItem.cartId)} className="text-gray-500 hover:text-red-400 p-2 transition-colors"><Icons.Close /></button>
                        </div>
                      </div>
                      {cartItem.item.selectedOptions?.length > 0 && <p className="text-xs text-gray-400 border-t border-white/5 pt-3 mt-1">+ {cartItem.item.selectedOptions.join(', ')}</p>}
                      {cartItem.item.note && <p className="text-xs text-gray-400 italic mt-2">Note: {cartItem.item.note}</p>}
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
                  <h3 className="font-bold text-lg text-white border-b border-white/10 pb-3 uppercase tracking-wide">{ui.detailsTitle}</h3>
                  <LoyaltyWallet userId={auth.user?.id} subtotal={subtotal} lang={lang} onApplyDiscount={setLoyaltyDiscount} settings={storeSettings} />
                  <div><label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">{ui.nameLabel}</label><input type="text" value={auth.customerName} onChange={e => auth.setCustomerName(e.target.value)} required className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors" /></div>
                  <div><label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">{ui.phoneLabel}</label><input type="tel" value={auth.customerPhone} onChange={e => auth.setCustomerPhone(e.target.value)} required className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors" /></div>
                  
                  {storeOpen && (
                    <div><label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">{ui.timeLabel}</label><select value={requestedTime} onChange={e => setRequestedTime(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white font-medium text-sm outline-none focus:border-[#38BDF8]/50 transition-colors">{generateTimeSlots().map((slot: any, i: number) => <option key={i} value={slot.value}>{slot.label}</option>)}</select></div>
                  )}

                  <div><label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">{ui.orderNoteTitle}</label><textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} placeholder={ui.orderNotePlh} rows={2} className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 resize-none transition-colors"></textarea></div>
                  <div className="mt-2"><label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-3">{ui.payLabel}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div onClick={() => setPaymentMethod('card')} className={`cursor-pointer p-4 rounded-xl border text-center transition-colors font-bold uppercase tracking-wide text-xs ${paymentMethod === 'card' ? 'bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8]' : 'bg-slate-900 border-white/5 text-gray-400 hover:bg-slate-800'}`}>{t.card}</div>
                      <div onClick={() => setPaymentMethod('cash')} className={`cursor-pointer p-4 rounded-xl border text-center transition-colors font-bold uppercase tracking-wide text-xs ${paymentMethod === 'cash' ? 'bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8]' : 'bg-slate-900 border-white/5 text-gray-400 hover:bg-slate-800'}`}>{t.cash}</div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* FOOTER - ΣΤΑΘΕΡΟ ΚΑΤΩ ΜΕΡΟΣ (ΜΟΝΟ ΑΝ ΔΕΝ ΕΙΝΑΙ ΣΤΟ CHAT) */}
            {cart.length > 0 && checkoutStep !== 'success' && checkoutStep !== 'review' && checkoutStep !== 'profile' && (
              <div className="p-4 md:p-5 bg-slate-900 border-t border-white/5 shrink-0 flex flex-col z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                
                <div className="flex justify-between items-center mb-2"><span className="text-gray-400 text-sm">{ui.subtotal}</span><span className="text-white font-bold">{subtotal} kr.</span></div>
                {loyaltyDiscount > 0 && <div className="flex justify-between items-center mb-2 text-[#38BDF8]"><span className="text-sm">{ui.loyaltyDiscount}</span><span className="font-bold">-{loyaltyDiscount.toFixed(2)} kr.</span></div>}
                <div className="flex justify-between items-center mt-2 mb-5 border-t border-white/5 pt-3"><span className="text-white font-bold uppercase tracking-wide">{ui.totalPay}</span><span className="text-2xl font-bold text-[#38BDF8]">{finalTotal.toFixed(2)} kr.</span></div>
                
                {!storeOpen ? (
                  <div className="flex flex-col gap-2 animate-fade-in-up">
                     <button disabled className="w-full bg-red-900/50 text-red-300 font-black uppercase tracking-widest py-3.5 rounded-xl border border-red-500/30 cursor-not-allowed">
                       {lang === 'da' ? 'MIDLERTIDIGT LUKKET' : lang === 'en' ? 'TEMPORARILY CLOSED' : 'ΠΡΟΣΩΡΙΝΑ ΚΛΕΙΣΤΟ'}
                     </button>
                     <p className="text-xs text-red-400 font-bold text-center italic">
                       {lang === 'da' ? 'På grund af travlhed modtager vi i øjeblikket ikke nye ordrer. Prøv venligst igen senere!' : 
                        lang === 'en' ? 'Due to high demand, we are currently not accepting new orders. Please try again later!' : 
                        'Λόγω φόρτου εργασίας δεν δεχόμαστε νέες παραγγελίες αυτή τη στιγμή. Δοκιμάστε ξανά αργότερα!'}
                     </p>
                  </div>
                ) : checkoutStep === 'cart' ? (
                  <button onClick={() => auth.user ? setCheckoutStep('checkout') : setCheckoutStep('auth')} className="w-full bg-[#38BDF8] text-[#0B1120] font-bold uppercase tracking-wide py-3.5 rounded-xl hover:bg-sky-400 transition-colors">{ui.toCheckout}</button>
                ) : checkoutStep === 'auth' ? (
                  <button type="button" onClick={() => setCheckoutStep('cart')} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 uppercase tracking-wide transition-colors">{ui.backToCart}</button>
                ) : (
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setCheckoutStep('cart')} className="px-5 py-3.5 rounded-xl bg-slate-800 text-white font-bold uppercase tracking-wide hover:bg-slate-700 transition-colors">{ui.back}</button>
                    <button 
                      type="submit" 
                      form="checkoutForm" 
                      disabled={isSubmitting || cooldown > 0} 
                      className="flex-1 bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-bold py-3.5 rounded-xl disabled:opacity-50 uppercase tracking-wide transition-colors"
                    >
                      {cooldown > 0 
                        ? (lang === 'da' ? `VENT ${cooldown}s` : lang === 'en' ? `WAIT ${cooldown}s` : `ΑΝΑΜΟΝΗ ${cooldown}s`) 
                        : isSubmitting ? ui.sending : ui.confirm}
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
