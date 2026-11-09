import React from 'react';
import LoyaltyWallet from './LoyaltyWallet'; 
import SmartUpsell from './SmartUpsell';
import { Icons } from '../Icons';

export default function CheckoutSidebar({
  isCartOpen, setIsCartOpen, checkoutStep, setCheckoutStep, lang, ui, t, auth, cart,
  updateQuantity, removeFromCart, addToCart, setActiveProduct, getItemPrice,
  subtotal, finalTotal, loyaltyDiscount, setLoyaltyDiscount, storeSettings,
  storeOpen, generateTimeSlots, requestedTime, setRequestedTime, orderNote,
  setOrderNote, paymentMethod, setPaymentMethod, submitOrder, isSubmitting,
  placedOrder, handleCustomerPickup, handleRepeatOrder, getLocaleDateString, menuItems
}: any) {
  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full md:max-w-md bg-[#0F172A] h-full flex flex-col shadow-2xl md:border-l border-white/10 animate-fade-in-up md:animate-slide-in-right">
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900 shrink-0">
          <h2 className="text-lg font-bold text-white uppercase tracking-wide">{checkoutStep === 'profile' ? ui.profileTitle : ui.cartTitle}</h2>
          {checkoutStep !== 'success' && <button onClick={() => { setIsCartOpen(false); if(checkoutStep === 'review' || checkoutStep === 'profile') setCheckoutStep('cart'); }} className="text-gray-400 hover:text-white transition-colors p-1"><Icons.Close /></button>}
        </div>

        <div className="flex-1 overflow-y-auto p-5 pb-24">
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
                          <div className="flex flex-col items-end gap-3">
                            <span className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wide ${o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>{o.status}</span>
                            <button onClick={() => handleRepeatOrder(o)} className="text-[#38BDF8] hover:bg-[#38BDF8]/10 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-transparent hover:border-[#38BDF8]/20"><Icons.Repeat /> {t.repeatOrder}</button>
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
              <a href="https://reviewshellas.dk" target="_blank" rel="noopener noreferrer" className="w-full bg-[#38BDF8] text-[#0B1120] font-bold uppercase tracking-wide py-4 rounded-xl mb-4 block">{ui.leaveReview}</a>
              <button onClick={() => { setCheckoutStep('cart'); setIsCartOpen(false); }} className="w-full bg-slate-800 text-gray-300 font-bold uppercase tracking-wide py-4 rounded-xl hover:bg-slate-700 transition-colors">{ui.close}</button>
            </div>
          ) : checkoutStep === 'success' ? (
            <div className="flex flex-col items-center py-6 w-full">
              <h2 className="text-xl font-bold text-white mb-8 tracking-widest text-center">#{placedOrder?.order_number || placedOrder?.id?.toString().slice(-4)}</h2>
              <div className="w-full mb-10 relative">
                <div className="absolute top-4 left-0 h-1 bg-slate-800 w-full -z-10 rounded-full"></div><div className={`absolute top-4 left-0 h-1 bg-[#38BDF8] -z-10 transition-all duration-700 ease-out rounded-full ${placedOrder?.status === 'pending' ? 'w-[15%]' : placedOrder?.status === 'preparing' ? 'w-[50%]' : 'w-full !bg-emerald-500'}`}></div>
                <div className="flex justify-between">
                  <div className="flex flex-col items-center gap-3"><div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${placedOrder?.status === 'pending' || placedOrder?.status === 'preparing' || placedOrder?.status === 'completed' ? 'bg-[#38BDF8] text-[#0B1120]' : 'bg-slate-800 text-gray-500'}`}>1</div><span className={`text-[10px] font-bold uppercase tracking-wider ${placedOrder?.status === 'pending' ? 'text-white' : 'text-gray-500'}`}>{ui.trackPending}</span></div>
                  <div className="flex flex-col items-center gap-3"><div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${placedOrder?.status === 'preparing' || placedOrder?.status === 'completed' ? 'bg-[#38BDF8] text-[#0B1120]' : 'bg-slate-800 text-gray-500'}`}>2</div><span className={`text-[10px] font-bold uppercase tracking-wider ${placedOrder?.status === 'preparing' ? 'text-white' : 'text-gray-500'}`}>{ui.trackPrep}</span></div>
                  <div className="flex flex-col items-center gap-3"><div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${placedOrder?.status === 'completed' ? 'bg-emerald-500 text-[#0B1120]' : 'bg-slate-800 text-gray-500'}`}>3</div><span className={`text-[10px] font-bold uppercase tracking-wider ${placedOrder?.status === 'completed' ? 'text-emerald-400' : 'text-gray-500'}`}>{ui.trackReady}</span></div>
                </div>
              </div>
              <div className="w-full bg-slate-800/30 border border-white/5 rounded-2xl p-8 mb-8 text-center">
                {placedOrder?.status === 'pending' && (<div className="animate-fade-in"><div className="w-12 h-12 border-4 border-[#38BDF8]/20 border-t-[#38BDF8] rounded-full animate-spin mx-auto mb-5"></div><h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">{ui.trackPendingTitle}</h3><p className="text-sm text-gray-400">{ui.trackPendingDesc}</p></div>)}
                {placedOrder?.status === 'preparing' && (<div className="animate-fade-in"><div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-orange-400 mx-auto mb-5 animate-pulse"><Icons.Clock /></div><h3 className="text-lg font-bold text-white mb-5 uppercase tracking-wide">{ui.trackPrepTitle}</h3><div className="bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-xl p-4 inline-block"><p className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-widest mb-1">{ui.trackPrepTime}</p><p className="text-4xl font-bold text-white">{placedOrder?.requested_time && placedOrder.requested_time !== 'ASAP' ? placedOrder.requested_time.slice(0, 5) : '...'}</p></div></div>)}
                {placedOrder?.status === 'completed' && (<div className="animate-fade-in"><div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-5"><Icons.Check /></div><h3 className="text-lg font-bold text-emerald-400 mb-3 uppercase tracking-wide">{ui.trackReadyTitle}</h3><p className="text-sm text-gray-300 mb-8">{ui.trackReadyDesc}</p><button onClick={handleCustomerPickup} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0B1120] font-bold text-sm uppercase py-4 rounded-xl transition-colors tracking-wide">{t.pickupConfirm}</button></div>)}
              </div>
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
              <div className="text-center mt-2 mb-2">
                <h3 className="text-xl font-bold text-white uppercase tracking-wide">{ui.guestCheckout}</h3>
                <p className="text-gray-400 text-sm mt-2">{ui.guestDesc}</p>
              </div>
              <button onClick={() => setCheckoutStep('checkout')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-white/5 uppercase tracking-wide transition-colors">{ui.guestCheckout}</button>
              <div className="flex items-center gap-4 my-2 opacity-50">
                <hr className="flex-1 border-slate-600" />
                <span className="text-xs text-slate-400 font-bold uppercase">{ui.or}</span>
                <hr className="flex-1 border-slate-600" />
              </div>
              <div className="bg-slate-800/30 p-6 rounded-2xl border border-white/5">
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
                <button type="button" onClick={() => { auth.setAuthMode(auth.authMode === 'signup' ? 'login' : 'signup'); auth.setAuthError(''); }} className="w-full text-sm text-gray-400 hover:text-white mt-6 font-medium transition-colors">{auth.authMode === 'signup' ? ui.hasAcc : ui.noAcc}</button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="text-center text-gray-500 mt-24 flex flex-col items-center"><div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 mb-4"><Icons.Cart /></div><p className="font-medium text-lg">{ui.emptyCart}</p></div>
          ) : checkoutStep === 'cart' ? (
            <div className="flex flex-col gap-4">
              {cart.map((cartItem: any, idx: number) => (
                <div key={idx} className="flex flex-col bg-slate-800/30 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex-1 pr-3"><p className="font-bold text-white text-sm leading-tight mb-1">{cartItem.item[`title_${lang}`] || cartItem.item.name}</p><p className="text-sm font-bold text-[#38BDF8]">{getItemPrice(cartItem.item)} DKK</p></div>
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
              <div className="mt-4"><SmartUpsell cart={cart} menuItems={menuItems} lang={lang} onAdd={(item: any) => addToCart(item, 1)} /></div>
            </div>
          ) : (
            <form id="checkoutForm" onSubmit={submitOrder} className="flex flex-col gap-6">
              <h3 className="font-bold text-lg text-white border-b border-white/10 pb-3 uppercase tracking-wide">{ui.detailsTitle}</h3>
              <LoyaltyWallet userId={auth.user?.id} subtotal={subtotal} lang={lang} onApplyDiscount={setLoyaltyDiscount} settings={storeSettings} />
              <div><label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">{ui.nameLabel}</label><input type="text" value={auth.customerName} onChange={e => auth.setCustomerName(e.target.value)} required className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors" /></div>
              <div><label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">{ui.phoneLabel}</label><input type="tel" value={auth.customerPhone} onChange={e => auth.setCustomerPhone(e.target.value)} required className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors" /></div>
              <div><label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">{ui.timeLabel}</label><select value={requestedTime} onChange={e => setRequestedTime(e.target.value)} className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white font-medium text-sm outline-none focus:border-[#38BDF8]/50 transition-colors">{generateTimeSlots().map((slot: any, i: number) => <option key={i} value={slot.value}>{slot.label}</option>)}</select></div>
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

        {cart.length > 0 && checkoutStep !== 'success' && checkoutStep !== 'review' && checkoutStep !== 'profile' && (
          <div className="p-5 bg-slate-900 border-t border-white/5 shrink-0">
            <div className="flex justify-between items-center mb-2"><span className="text-gray-400 text-sm">{ui.subtotal}</span><span className="text-white font-bold">{subtotal} kr.</span></div>
            {loyaltyDiscount > 0 && <div className="flex justify-between items-center mb-2 text-[#38BDF8]"><span className="text-sm">{ui.loyaltyDiscount}</span><span className="font-bold">-{loyaltyDiscount.toFixed(2)} kr.</span></div>}
            <div className="flex justify-between items-center mt-4 mb-6 border-t border-white/5 pt-4"><span className="text-white font-bold uppercase tracking-wide">{ui.totalPay}</span><span className="text-2xl font-bold text-[#38BDF8]">{finalTotal.toFixed(2)} kr.</span></div>
            {!storeOpen && checkoutStep === 'cart' && requestedTime === 'ASAP' ? (
              <button onClick={() => setCheckoutStep('checkout')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wide py-4 rounded-xl transition-colors">{t.schedule}</button>
            ) : checkoutStep === 'cart' ? (
              <button onClick={() => auth.user ? setCheckoutStep('checkout') : setCheckoutStep('auth')} className="w-full bg-[#38BDF8] text-[#0B1120] font-bold uppercase tracking-wide py-4 rounded-xl hover:bg-sky-400 transition-colors">{ui.toCheckout}</button>
            ) : checkoutStep === 'auth' ? (
              <button type="button" onClick={() => setCheckoutStep('cart')} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700 uppercase tracking-wide transition-colors">{ui.backToCart}</button>
            ) : (
              <div className="flex gap-3">
                <button type="button" onClick={() => setCheckoutStep('cart')} className="px-6 py-4 rounded-xl bg-slate-800 text-white font-bold uppercase tracking-wide hover:bg-slate-700 transition-colors">{ui.back}</button>
                <button type="submit" form="checkoutForm" disabled={isSubmitting} className="flex-1 bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-bold py-4 rounded-xl disabled:opacity-50 uppercase tracking-wide transition-colors">{isSubmitting ? ui.sending : ui.confirm}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
