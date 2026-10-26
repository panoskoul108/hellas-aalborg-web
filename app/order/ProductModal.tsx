'use client';
import React, { useState } from 'react';

export default function ProductModal({ activeProduct, lang, closeModal, addToCart, supabaseImageUrl }: any) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  const title = activeProduct[`title_${lang}`] || activeProduct.title_da || activeProduct.title_el || activeProduct.name;
  const desc = activeProduct[`desc_${lang}`] || activeProduct.desc_da;
  const basePrice = Number(activeProduct.final_price || activeProduct.price_takeaway || activeProduct.price || 0);
  const addBtnText = lang === 'da' ? 'TILFØJ' : lang === 'en' ? 'ADD' : 'ΠΡΟΣΘΗΚΗ';

  let extras: Record<string, any> = {};
  try { extras = typeof activeProduct.extras === 'string' ? JSON.parse(activeProduct.extras) : activeProduct.extras || {}; } catch (e) {}

  let extraPrice = 0;
  Object.keys(extras).forEach(groupKey => {
    const group = extras[groupKey];
    (selections[groupKey] || []).forEach(optName => {
      const optionDef = group.options.find((o: any) => o.name === optName);
      if (optionDef) extraPrice += Number(optionDef.price || 0);
    });
  });
  
  const totalPrice = (basePrice + extraPrice) * quantity;

  const handleSelect = (groupKey: string, optionName: string, isSingle: boolean, max?: number) => {
    setSelections(prev => {
      const currentSelections = prev[groupKey] || [];
      if (isSingle) return { ...prev, [groupKey]: [optionName] };
      else {
        if (currentSelections.includes(optionName)) return { ...prev, [groupKey]: currentSelections.filter(n => n !== optionName) };
        else {
          if (max && currentSelections.length >= max) return prev; 
          return { ...prev, [groupKey]: [...currentSelections, optionName] };
        }
      }
    });
  };

  const handleAdd = () => {
    for (const groupKey of Object.keys(extras)) {
      if (extras[groupKey].type === 'single' && (!selections[groupKey] || selections[groupKey].length === 0)) {
        alert(lang === 'da' ? `Vælg venligst: ${groupKey}` : `Please select: ${groupKey}`);
        return;
      }
    }
    const flatSelections: string[] = [];
    Object.keys(selections).forEach(groupKey => selections[groupKey].forEach(optName => flatSelections.push(optName)));
    addToCart({ ...activeProduct, final_price: basePrice + extraPrice, price_takeaway: basePrice + extraPrice, selectedOptions: flatSelections, note }, quantity);
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/90 md:bg-black/80 z-50 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
      {/* MOBILE UI POLISH: Full width & height on mobile (h-[95vh] rounded-t-3xl), Max-width & auto-height on desktop */}
      <div className="bg-[#0F172A] w-full h-[95vh] md:h-auto md:max-w-xl rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col shadow-2xl md:max-h-[90vh] md:border border-white/10" onClick={e => e.stopPropagation()}>
        
        <div className="relative h-48 sm:h-56 shrink-0 bg-slate-800">
          {/* Bigger, clearer close button for mobile */}
          <button onClick={closeModal} className="absolute top-4 right-4 bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black transition-colors z-10 text-xl font-light shadow-lg">✕</button>
          {activeProduct.image_path ? (
            <img src={`${supabaseImageUrl}${activeProduct.image_path}`} alt={title} className="w-full h-full object-cover" />
          ) : <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent"></div>
        </div>

        <div className="p-5 overflow-y-auto flex-1 pb-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{title}</h2>
          <p className="text-[#38BDF8] font-black text-lg mb-2">{basePrice} DKK</p>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">{desc}</p>

          {Object.keys(extras).length > 0 && (
            <div className="flex flex-col gap-6 mb-8">
              {Object.keys(extras).map((groupKey) => {
                const group = extras[groupKey];
                const isSingle = group.type === 'single';
                const currentSelections = selections[groupKey] || [];

                return (
                  <div key={groupKey} className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-white text-sm uppercase tracking-wide">{groupKey}</h3>
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${isSingle ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'bg-gray-800 text-gray-400'}`}>
                        {isSingle 
                          ? (lang === 'da' ? 'OBLIGATORISK (Vælg 1)' : lang === 'en' ? 'REQUIRED (Select 1)' : 'ΥΠΟΧΡΕΩΤΙΚΟ (Επιλέξτε 1)')
                          : group.max 
                            ? (lang === 'da' ? `MAX ${group.max} VALG` : lang === 'en' ? `UP TO ${group.max} OPTIONS` : `ΕΩΣ ${group.max} ΕΠΙΛΟΓΕΣ`)
                            : (lang === 'da' ? 'VALGFRIT' : lang === 'en' ? 'OPTIONAL' : 'ΠΡΟΑΙΡΕΤΙΚΟ')}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {group.options.map((opt: any, idx: number) => {
                        const isSelected = currentSelections.includes(opt.name);
                        const isDisabled = !isSingle && !isSelected && group.max && currentSelections.length >= group.max;

                        return (
                          <label key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer ${isSelected ? 'border-[#38BDF8] bg-[#38BDF8]/10' : 'border-white/5 bg-slate-800/80 hover:bg-slate-800'} ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 shrink-0 flex items-center justify-center border-2 transition-colors ${isSingle ? 'rounded-full' : 'rounded-md'} ${isSelected ? 'border-[#38BDF8] bg-[#38BDF8]' : 'border-gray-500'}`}>
                                {isSelected && <span className={`bg-[#0F172A] ${isSingle ? 'w-2 h-2 rounded-full' : 'w-3 h-3'}`} style={!isSingle ? { clipPath: 'polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)', backgroundColor: '#0F172A'} : {}}></span>}
                              </div>
                              <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{opt.name}</span>
                            </div>
                            <span className="text-xs font-black text-gray-400">{Number(opt.price) > 0 ? `+${opt.price} kr.` : ''}</span>
                            <input type={isSingle ? "radio" : "checkbox"} name={groupKey} checked={isSelected} disabled={isDisabled} onChange={() => handleSelect(groupKey, opt.name, isSingle, group.max)} className="hidden" />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mb-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">
              {lang === 'da' ? 'Kommentarer / Særlige instruktioner' : lang === 'en' ? 'Comments / Special Instructions' : 'ΣΧΟΛΙΑ / ΕΙΔΙΚΕΣ ΟΔΗΓΙΕΣ'}
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8] resize-none h-24" />
          </div>
        </div>

        {/* Footer is now fully pinned to the bottom on mobile */}
        <div className="p-4 md:p-5 border-t border-slate-800 bg-slate-900 shrink-0 flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <div className="flex items-center justify-between md:justify-start gap-4 bg-slate-800 rounded-xl p-2 md:p-1.5 border border-white/5">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-12 h-12 md:w-10 md:h-10 flex items-center justify-center text-white bg-slate-700 md:bg-transparent md:hover:bg-slate-700 rounded-lg font-black text-2xl transition-colors">-</button>
            <span className="font-black text-xl md:text-lg w-8 text-center">{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} className="w-12 h-12 md:w-10 md:h-10 flex items-center justify-center text-white bg-slate-700 md:bg-transparent md:hover:bg-slate-700 rounded-lg font-black text-2xl transition-colors">+</button>
          </div>
          
          <button onClick={handleAdd} className="flex-1 bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black py-4 md:py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-between px-6 uppercase tracking-wider items-center">
            <span className="text-sm md:text-base">{addBtnText}</span>
            <span className="bg-[#0B1120]/10 px-3 py-1.5 rounded-lg text-sm md:text-base">{totalPrice} DKK</span>
          </button>
        </div>
      </div>
    </div>
  );
}
