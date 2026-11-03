'use client';
import React, { useState } from 'react';

interface ProductModalProps {
  activeProduct: any;
  lang: 'da' | 'en' | 'el';
  closeModal: () => void;
  addToCart: (item: any, quantity: number) => void;
  supabaseImageUrl: string;
}

export default function ProductModal({ activeProduct, lang, closeModal, addToCart, supabaseImageUrl }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<any[]>([]);
  const [note, setNote] = useState('');

  const dict = {
    da: { add: "Tilføj til kurv", qty: "Antal", extras: "Tilvalg & Fravalg", note: "Særlige ønsker", notePlh: "F.eks. ingen tomat...", cancel: "Luk" },
    en: { add: "Add to Cart", qty: "Quantity", extras: "Extras & Removals", note: "Special requests", notePlh: "e.g., no tomato...", cancel: "Close" },
    el: { add: "Προσθήκη", qty: "Ποσότητα", extras: "Επιλογές & Έξτρα", note: "Ειδικές Οδηγίες", notePlh: "π.χ. χωρίς ντομάτα...", cancel: "Κλείσιμο" }
  };
  // Ασφάλεια σε περίπτωση που το lang είναι κάτι άκυρο
  const ui = dict[lang] || dict['da'];

  // Ασφαλής ανάγνωση τίτλου, περιγραφής και τιμής
  const getTitle = (item: any) => item?.[`title_${lang}`] || item?.title_da || item?.title_el || item?.name || "Unknown Product";
  const getDesc = (item: any) => item?.[`desc_${lang}`] || item?.desc_da || "";
  const getBasePrice = () => Number(activeProduct?.price_takeaway || activeProduct?.price || 0);

  // ΕΛΕΓΧΟΣ ΑΣΦΑΛΕΙΑΣ ΓΙΑ ΤΑ EXTRAS (Αποτρέπει το Application Error)
  let extrasList: any[] = [];
  try {
    if (activeProduct?.extras) {
      if (typeof activeProduct.extras === 'string') {
        extrasList = JSON.parse(activeProduct.extras);
      } else if (Array.isArray(activeProduct.extras)) {
        extrasList = activeProduct.extras;
      }
    }
  } catch (e) {
    console.error("Σφάλμα στην ανάγνωση των extras:", e);
    extrasList = [];
  }

  const handleExtraToggle = (extra: any) => {
    const exists = selectedExtras.find(e => e.name_da === extra.name_da);
    if (exists) {
      setSelectedExtras(selectedExtras.filter(e => e.name_da !== extra.name_da));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const getExtraName = (extra: any) => extra?.[`name_${lang}`] || extra?.name_da || "Option";
  
  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + Number(extra.price || 0), 0);
  const finalUnitPrice = getBasePrice() + extrasTotal;
  const totalPrice = finalUnitPrice * quantity;

  const handleAdd = () => {
    const formattedOptions = selectedExtras.map(e => {
      const priceStr = e.price > 0 ? ` (+${e.price} kr.)` : '';
      return `${getExtraName(e)}${priceStr}`;
    });

    const customItem = {
      ...activeProduct,
      final_price: finalUnitPrice,
      selectedOptions: formattedOptions,
      note: note.trim()
    };

    addToCart(customItem, quantity);
    closeModal();
  };

  // Αν για κάποιο λόγο το activeProduct είναι null, μην προσπαθήσεις να φορτώσεις το Modal
  if (!activeProduct) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={closeModal}>
      <div className="bg-[#0F172A] border border-white/10 rounded-[2rem] w-full max-w-md overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up" onClick={e => e.stopPropagation()}>
        
        {activeProduct?.image_path ? (
          <div className="relative w-full h-48 sm:h-56 bg-slate-800 shrink-0">
            <img src={`${supabaseImageUrl}${activeProduct.image_path}`} alt={getTitle(activeProduct)} className="w-full h-full object-cover" />
            <button onClick={closeModal} className="absolute top-4 right-4 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/90 z-10 backdrop-blur-md border border-white/20 transition-colors">&times;</button>
          </div>
        ) : (
          <div className="relative w-full h-12 bg-[#0F172A] shrink-0 border-b border-white/5">
             <button onClick={closeModal} className="absolute top-2 right-4 bg-slate-800 text-gray-400 w-8 h-8 rounded-full flex items-center justify-center hover:text-white transition-colors">&times;</button>
          </div>
        )}

        <div className="p-5 sm:p-6 flex-1 overflow-y-auto">
          <h3 className="text-2xl font-black text-white mb-2">{getTitle(activeProduct)}</h3>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">{getDesc(activeProduct)}</p>

          {/* ΛΙΣΤΑ ΜΕ ΕΠΙΛΟΓΕΣ & ΕΞΤΡΑ */}
          {extrasList && extrasList.length > 0 && (
            <div className="mb-6">
              <h4 className="text-[10px] text-[#38BDF8] font-bold uppercase tracking-widest mb-3">{ui.extras}</h4>
              <div className="flex flex-col gap-2">
                {extrasList.map((extra, idx) => (
                  <label key={idx} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-[#38BDF8] rounded bg-slate-900 border-slate-700" 
                        checked={!!selectedExtras.find(e => e.name_da === extra.name_da)}
                        onChange={() => handleExtraToggle(extra)}
                      />
                      <span className="text-white font-medium text-sm">{getExtraName(extra)}</span>
                    </div>
                    {extra.price > 0 && <span className="text-gray-400 text-xs font-bold">+{extra.price} kr.</span>}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ΕΙΔΙΚΕΣ ΟΔΗΓΙΕΣ ΠΙΑΤΟΥ */}
          <div className="mb-6">
            <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">{ui.note}</h4>
            <textarea 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              placeholder={ui.notePlh} 
              rows={2} 
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-[#38BDF8] resize-none transition-colors"
            />
          </div>

          {/* ΠΟΣΟΤΗΤΑ */}
          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-2xl border border-white/5 mb-2 shadow-inner">
            <span className="text-xs text-gray-400 font-bold uppercase ml-3">{ui.qty}</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 bg-slate-800 rounded-xl text-white font-bold text-xl hover:bg-slate-700 transition-colors active:scale-90">-</button>
              <span className="font-black text-lg w-4 text-center">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 bg-slate-800 rounded-xl text-white font-bold text-xl hover:bg-slate-700 transition-colors active:scale-90">+</button>
            </div>
          </div>
        </div>

        {/* ΚΟΥΜΠΙ ΠΡΟΣΘΗΚΗΣ */}
        <div className="p-5 bg-slate-900 border-t border-white/10 shrink-0">
          <button onClick={handleAdd} className="w-full bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black uppercase tracking-wider py-4 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.2)] transition-transform active:scale-95 flex justify-between px-6">
            <span>{ui.add}</span>
            <span>{totalPrice} kr.</span>
          </button>
        </div>
        
      </div>
    </div>
  );
}
