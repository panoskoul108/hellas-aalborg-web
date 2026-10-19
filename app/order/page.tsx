) : cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-20"><span className="text-4xl mb-3 block">🛒</span><p>Din kurv er tom.</p></div>
              ) : checkoutStep === 'cart' ? (
                <div className="flex flex-col gap-4">
                  {cart.map(cartItem => (
                    <div key={cartItem.item.id} className="flex justify-between items-center bg-slate-800/30 p-3 rounded-xl border border-white/5">
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-white text-sm">{cartItem.item.title_da}</p>
                        <p className="text-xs text-[#38BDF8]">{cartItem.item.price_takeaway} DKK</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1 border border-white/5">
                        <button onClick={() => updateQuantity(cartItem.item.id, -1)} className="w-7 h-7 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 rounded-md font-bold">-</button>
                        <span className="font-bold text-sm w-4 text-center">{cartItem.quantity}</span>
                        <button onClick={() => updateQuantity(cartItem.item.id, 1)} className="w-7 h-7 flex items-center justify-center text-white bg-slate-800 hover:bg-slate-700 rounded-md font-bold">+</button>
                      </div>
                      <button onClick={() => removeFromCart(cartItem.item.id)} className="ml-3 text-red-400 hover:text-red-300 text-sm bg-red-500/10 p-2 rounded-lg">🗑️</button>
                    </div>
                  ))}
                </div>
              ) : (
                /* Checkout Form */
                <form id="checkoutForm" onSubmit={submitOrder} className="flex flex-col gap-5">
                  <h3 className="font-bold text-lg text-white border-b border-white/10 pb-2">Dine oplysninger</h3>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Fulde Navn</label>
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-[#38BDF8]" placeholder="Indtast dit navn" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Telefonnummer</label>
                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-[#38BDF8]" placeholder="+45 12 34 56 78" />
                  </div>
                  <div className="mt-4">
                    <label className="text-xs text-gray-400 block mb-2">Betalingsmetode ved afhentning</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div onClick={() => setPaymentMethod('card')} className={`cursor-pointer p-4 rounded-xl border text-center transition-all ${paymentMethod === 'card' ? 'bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8]' : 'bg-slate-800 border-white/5 text-gray-400'}`}>
                        <span className="block text-2xl mb-1">💳</span> Kort
                      </div>
                      <div onClick={() => setPaymentMethod('cash')} className={`cursor-pointer p-4 rounded-xl border text-center transition-all ${paymentMethod === 'cash' ? 'bg-[#38BDF8]/10 border-[#38BDF8] text-[#38BDF8]' : 'bg-slate-800 border-white/5 text-gray-400'}`}>
                        <span className="block text-2xl mb-1">💵</span> Kontant
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && checkoutStep !== 'success' && (
              <div className="p-6 bg-slate-900 border-t border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-400">Total at betale</span>
                  <span className="text-2xl font-bold text-white">{cartTotal} <span className="text-sm font-normal text-gray-500">DKK</span></span>
                </div>
                
                {checkoutStep === 'cart' ? (
                  <button onClick={proceedToCheckout} className="w-full bg-[#38BDF8] hover:bg-sky-400 text-slate-900 font-bold py-4 rounded-xl shadow-lg transition-colors text-lg">
                    Gå til Kassen
                  </button>
                ) : checkoutStep === 'auth' ? (
                  <button type="button" onClick={() => setCheckoutStep('cart')} className="w-full px-6 py-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 border border-white/5">
                    Tilbage til kurv
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setCheckoutStep('cart')} className="px-6 py-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 border border-white/5">
                      Tilbage
                    </button>
                    <button type="submit" form="checkoutForm" disabled={isSubmitting} className="flex-1 bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-xl shadow-lg transition-colors text-lg disabled:opacity-50">
                      {isSubmitting ? 'Sender...' : 'Bekræft Bestilling'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
