'use client';
import React, { useState } from 'react';

export default function ProductModal({ activeProduct, lang, closeModal, addToCart, supabaseImageUrl }: any) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  
  // Αποθηκεύει τις επιλογές του χρήστη ανά κατηγορία (π.χ. { "Kød": ["Svinekød"], "Ekstra": ["Homemade chilli"] })
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  const title = activeProduct[`title_${lang}`] || activeProduct.title_da || activeProduct.title_el || activeProduct.name;
  const desc = activeProduct[`desc_${lang}`] || activeProduct.desc_da;
  const basePrice = Number(activeProduct.final_price || activeProduct.price_takeaway || activeProduct.price || 0);

  // Ασφαλής ανάγνωση του JSON των extras
  let extras: Record<string, any> = {};
  try {
    extras = typeof activeProduct.extras === 'string' ? JSON.parse(activeProduct.extras) : activeProduct.extras || {};
  } catch (e) {
    console.error("Error parsing extras", e);
  }

  // Υπολογισμός συνολικής τιμής (Βασική τιμή + Τιμή επιλεγμένων Extras) * Ποσότητα
  let extraPrice = 0;
  Object.keys(extras).forEach(groupKey => {
    const group = extras[groupKey];
    const selectedOptions = selections[groupKey] || [];
    selectedOptions.forEach(optName => {
      const optionDef = group.options.find((o: any) => o.name === optName);
      if (optionDef) extraPrice += Number(optionDef.price || 0);
    });
  });
  
  const totalPrice = (basePrice + extraPrice) * quantity;

  // Διαχείριση κλικ σε επιλογή
  const handleSelect = (groupKey: string, optionName: string, isSingle: boolean, max?: number) => {
    setSelections(prev => {
      const currentSelections = prev[groupKey] || [];
      
      // Αν είναι Υποχρεωτικό (Single) - π.χ. Κρέας (αλλάζει την επιλογή)
      if (isSingle) {
        return { ...prev, [groupKey]: [optionName] };
      } 
      // Αν είναι Πολλαπλό (Multiple) - π.χ. Extras
      else {
        if (currentSelections.includes(optionName)) {
          // Αφαίρεση αν είναι ήδη επιλεγμένο
          return { ...prev, [groupKey]: currentSelections.filter(n => n !== optionName) };
        } else {
          // Προσθήκη αν δεν έχει ξεπεράσει το όριο max
          if (max && currentSelections.length >= max) return prev; 
          return { ...prev, [groupKey]: [...currentSelections, optionName] };
        }
      }
    });
  };

  const handleAdd = () => {
    // 1. Έλεγχος αν έχει επιλέξει τα υποχρεωτικά
    for (const groupKey of Object.keys(extras)) {
      if (extras[groupKey].type === 'single') {
        if (!selections[groupKey] || selections[groupKey].length === 0) {
          alert(`Παρακαλώ επιλέξτε: ${groupKey}`);
          return;
        }
      }
    }

    // 2. Μετατροπή των επιλογών σε μια απλή λίστα για το καλάθι
    const flatSelections: string[] = [];
    Object.keys(selections).forEach(groupKey => {
      selections[groupKey].forEach(optName => {
        flatSelections.push(optName);
      });
    });

    // 3. Προσθήκη στο καλάθι
    // Στέλνουμε το προϊόν με τη ΝΕΑ τελική τιμή μονάδας (Βασική + Extras)
    const productForCart = { 
      ...activeProduct, 
      final_price: basePrice + extraPrice, 
      price_takeaway: basePrice + extraPrice, // Fallbacks
      selectedOptions: flatSelections, 
      note 
    };
    
    addToCart(productForCart, quantity);
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
      <div className="bg-[#0F172A] w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
        
        {/* Εικόνα και Κουμπί Κλεισίματος */}
        <div className="relative h-48 sm:h-64 bg-slate-800 shrink-0">
          <button onClick={closeModal} className="absolute top-4 right-4 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black transition-colors z-10">✕</button>
          {activeProduct.image_path ? (
            <img src={`${supabaseImageUrl}${activeProduct.image_path}`} alt={title} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent"></div>
        </div>

        {/* Πληροφορίες Προϊόντος & Extras (Scrollable) */}
        <div className="p-5 overflow-y-auto flex-1 pb-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">{title}</h2>
          <p className="text-[#38BDF8] font-black text-lg mb-2">{basePrice} DKK <span className="text-xs font-bold text-gray-500 line-through ml-2">ΒΑΣΙΚΗ ΤΙΜΗ</span></p>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">{desc}</p>

          {/* Rendering των Extras */}
          {Object.keys(extras).length > 0 && (
            <div className="flex flex-col gap-6 mb-6">
              {Object.keys(extras).map((groupKey) => {
                const group = extras[groupKey];
                const isSingle = group.type === 'single';
                const currentSelections = selections[groupKey] || [];

                return (
                  <div key={groupKey} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-white text-sm uppercase">{groupKey}</h3>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${isSingle ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'bg-gray-800 text-gray-400'}`}>
                        {isSingle ? 'ΥΠΟΧΡΕΩΤΙΚΟ (Επιλεξτε 1)' : group.max ? `ΕΩΣ ${group.max} ΕΠΙΛΟΓΕΣ` : 'ΠΡΟΑΙΡΕΤΙΚΟ'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {group.options.map((opt: any, idx: number) => {
                        const isSelected = currentSelections.includes(opt.name);
                        // Αν είναι multiple και έχουμε φτάσει το max, απενεργοποιούμε τα υπόλοιπα
                        const isDisabled = !isSingle && !isSelected && group.max && currentSelections.length >= group.max;

                        return (
                          <label key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${isSelected ? 'border-[#38BDF8] bg-[#38BDF8]/10' : 'border-white/5 bg-slate-800/50 hover:bg-slate-800'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <div className="flex items-center gap-3">
                              {/* Custom Checkbox/Radio UI */}
                              <div className={`w-5 h-5 flex items-center justify-center border-2 transition-colors ${isSingle ? 'rounded-full' : 'rounded-md'} ${isSelected ? 'border-[#38BDF8] bg-[#38BDF8]' : 'border-gray-500'}`}>
                                {isSelected && <span className={`bg-[#0F172A] ${isSingle ? 'w-2 h-2 rounded-full' : 'w-3 h-3'}`} style={!isSingle ? { clipPath: 'polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)', backgroundColor: '#0F172A'} : {}}></span>}
                              </div>
                              <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{opt.name}</span>
                            </div>
                            <span className="text-xs font-bold text-gray-400">{Number(opt.price) > 0 ? `+${opt.price} kr.` : ''}</span>
                            
                            {/* Κρυφό πραγματικό input για προσβασιμότητα/λειτουργικότητα */}
                            <input 
                              type={isSingle ? "radio" : "checkbox"} 
                              name={groupKey} 
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={() => handleSelect(groupKey, opt.name, isSingle, group.max)}
                              className="hidden"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Γενικό Σχόλιο */}
          <div className="mb-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">ΣΧΟΛΙΑ / ΕΙΔΙΚΕΣ ΟΔΗΓΙΕΣ</label>
            <textarea 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              placeholder="π.χ. Χωρίς σως..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-[#38BDF8] resize-none h-20"
            />
          </div>
        </div>

        {/* Footer (Ποσότητα & Προσθήκη) */}
        <div className="p-4 border-t border-slate-700 bg-slate-900 shrink-0 flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-1.5 border border-white/5">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-white hover:bg-slate-700 rounded-lg font-black text-xl transition-colors">-</button>
            <span className="font-black text-lg w-6 text-center">{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center text-white hover:bg-slate-700 rounded-lg font-black text-xl transition-colors">+</button>
          </div>
          
          <button onClick={handleAdd} className="flex-1 bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-between px-6 uppercase tracking-wider items-center">
            <span>{ui?.add || 'ΠΡΟΣΘΗΚΗ'}</span>
            <span className="bg-[#0B1120]/10 px-2 py-1 rounded-lg">{totalPrice} DKK</span>
          </button>
        </div>
      </div>
    </div>
  );
}
