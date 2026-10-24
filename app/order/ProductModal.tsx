'use client';
import React, { useState } from "react";

export default function ProductModal({
  activeProduct,
  lang,
  closeModal,
  addToCart,
  supabaseImageUrl = "https://keolpijcsvwsrzkjqtkc.supabase.co/storage/v1/object/public/menu-images/",
}: any) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  // Κρατάει τα IDs των επιλεγμένων options
  const [selections, setSelections] = useState<{ [groupId: number]: number[] }>({});

  if (!activeProduct) return null;

  // Μεταφράσεις
  const dict: any = {
    da: { add: "Tilføj", req: "Krævet", opt: "Valgfri", upTo: "Op til", select1: "Vælg 1", note: "Bemærkning", notePlace: "F.eks. uden løg...", free: "Gratis" },
    en: { add: "Add", req: "Required", opt: "Optional", upTo: "Up to", select1: "Select 1", note: "Note", notePlace: "e.g. no onions...", free: "Free" },
    el: { add: "Προσθήκη", req: "Υποχρεωτικό", opt: "Προαιρετικό", upTo: "Έως", select1: "Επιλέξτε 1", note: "Σχόλιο", notePlace: "π.χ. χωρίς κρεμμύδι...", free: "Δωρεάν" }
  };
  const ui = dict[lang] || dict.da;

  const getTitle = (item: any) => item[`title_${lang}`] || item.title_da || item.name;
  const getDesc = (item: any) => item[`desc_${lang}`] || item.desc_da || item.description;
  const getOptName = (opt: any) => opt[`name_${lang}`] || opt.name_da || opt.name;
  const basePrice = Number(activeProduct.price_takeaway || activeProduct.price || 0);

  // Υπολογισμός Extra Κόστους
  let extraPrice = 0;
  const addons = activeProduct.options || [];
  addons.forEach((group: any) => {
    const selectedIndexes = selections[group.id] || [];
    selectedIndexes.forEach((idx) => {
      extraPrice += Number(group.items[idx].price || 0);
    });
  });

  const currentTotal = (basePrice + extraPrice) * quantity;

  // Διαχείριση Επιλογών (Checkboxes / Radio)
  const toggleSelection = (groupId: number, optionIndex: number, maxSel: number) => {
    setSelections(prev => {
      const currentSel = prev[groupId] || [];
      if (currentSel.includes(optionIndex)) {
        // Αφαίρεση αν είναι ήδη επιλεγμένο
        return { ...prev, [groupId]: currentSel.filter(i => i !== optionIndex) };
      } else {
        // Προσθήκη (με έλεγχο ορίου)
        if (maxSel === 1) return { ...prev, [groupId]: [optionIndex] }; // Radio behavior
        if (currentSel.length < maxSel) return { ...prev, [groupId]: [...currentSel, optionIndex] };
        return prev;
      }
    });
  };

  const handleConfirm = () => {
    // Έλεγχος Υποχρεωτικών (Required)
    for (const group of addons) {
      if (group.isRequired && !(selections[group.id]?.length > 0)) {
        alert(`Παρακαλώ επιλέξτε: ${getOptName(group)}`);
        return;
      }
    }

    // Καταγραφή Επιλεγμένων Extras για να φαίνονται στο καλάθι και το χαρτάκι
    const selectedExtras: string[] = [];
    addons.forEach((group: any) => {
      const selectedIndexes = selections[group.id] || [];
      selectedIndexes.forEach((idx) => {
        selectedExtras.push(getOptName(group.items[idx]));
      });
    });

    addToCart({
      ...activeProduct,
      final_price: basePrice + extraPrice, // Η νέα τιμή ΜΟΝΑΔΑΣ (Βάση + Extras)
      selectedOptions: selectedExtras,
      note: note
    }, quantity);
    
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[300] flex items-end sm:items-center justify-center animate-fade-in" onClick={closeModal}>
      <div className="w-full max-w-lg max-h-[90vh] bg-[#0F172A] sm:rounded-[3rem] rounded-t-[3rem] flex flex-col shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {activeProduct.image_path && (
          <div className="relative h-48 sm:h-64 shrink-0 bg-gray-800">
             <img src={`${supabaseImageUrl}${activeProduct.image_path}`} alt="" className="w-full h-full object-cover" />
             <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent"></div>
          </div>
        )}

        <button onClick={closeModal} className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors z-10 ${activeProduct.image_path ? "bg-black/40 text-white" : "bg-gray-800 text-gray-400"}`}>✕</button>

        <div className={`flex-1 overflow-y-auto px-6 no-scrollbar pb-24 ${!activeProduct.image_path ? 'pt-14' : 'pt-6'}`}>
          <h2 className="text-2xl font-black uppercase mb-2 text-white pr-8">{getTitle(activeProduct)}</h2>
          <p className="text-xl font-black mb-4 text-[#38BDF8]">{basePrice.toFixed(2)} DKK</p>
          <p className="text-sm font-medium mb-6 text-gray-400 leading-relaxed">{getDesc(activeProduct)}</p>

          {/* ADD-ONS (ΥΛΙΚΑ) */}
          {addons.map((group: any) => {
            const groupName = getOptName(group);
            const isReq = group.isRequired;
            const maxSel = group.maxSelections || 1;
            const selectedCount = (selections[group.id] || []).length;
            
            return (
              <div key={group.id} className="mb-6">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h3 className="font-black uppercase text-sm text-gray-200">{groupName}</h3>
                    <p className={`text-[10px] font-bold mt-1 uppercase ${isReq ? 'text-red-400' : 'text-gray-500'}`}>
                      {isReq ? `* ${ui.req}` : ui.opt} {maxSel > 1 ? `(${ui.upTo} ${maxSel})` : `(${ui.select1})`}
                    </p>
                  </div>
                  {isReq && selectedCount === 0 && <span className="text-[10px] font-black text-white bg-red-500 px-2 py-1 rounded-lg uppercase">!</span>}
                </div>
                
                <div className="space-y-2">
                  {group.items.map((opt: any, idx: number) => {
                    const optName = getOptName(opt);
                    const optPrice = Number(opt.price || 0);
                    const isSelected = (selections[group.id] || []).includes(idx);
                    
                    return (
                      <div 
                        key={idx} 
                        onClick={() => toggleSelection(group.id, idx, maxSel)}
                        className={`flex justify-between items-center p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${isSelected ? 'border-[#38BDF8] bg-[#38BDF8]/10' : 'border-gray-700 bg-gray-800/50'}`}
                      >
                        <span className={`text-sm font-black uppercase ${isSelected ? 'text-[#38BDF8]' : 'text-gray-300'}`}>{optName}</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-black ${isSelected ? 'text-[#38BDF8]' : 'text-gray-400'}`}>
                            {optPrice > 0 ? `+${optPrice.toFixed(0)} DKK` : ui.free}
                          </span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[#38BDF8] bg-[#38BDF8]' : 'border-gray-600'}`}>
                            {isSelected && <span className="text-[#0B1120] text-[10px]">✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* NOTE */}
          <div className="mt-8">
            <h3 className="font-black uppercase text-sm mb-3 text-gray-200">{ui.note}</h3>
            <textarea
              className="w-full border border-gray-700 p-4 rounded-2xl text-sm font-bold bg-gray-800 text-white focus:border-[#38BDF8] outline-none resize-none"
              rows={2}
              placeholder={ui.notePlace}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* FOOTER - ΑΠΟΣΤΟΛΗ ΣΤΟ ΚΑΛΑΘΙ */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#0F172A]">
          <div className="flex gap-4">
            <div className="flex items-center justify-between px-2 rounded-2xl border border-gray-700 bg-gray-800 w-32">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 text-xl font-black text-gray-400">−</button>
              <span className="text-lg font-black text-white">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 text-xl font-black text-[#38BDF8]">+</button>
            </div>
            
            <button 
              onClick={handleConfirm}
              className="flex-1 bg-[#38BDF8] text-[#0B1120] rounded-2xl font-black uppercase text-sm shadow-xl flex items-center justify-between px-6 transition-transform active:scale-95"
            >
              <span>{ui.add}</span>
              <span>{currentTotal.toFixed(0)} DKK</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
