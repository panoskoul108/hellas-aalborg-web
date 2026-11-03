'use client';
import React, { useState } from 'react';

export default function ProductModal({ activeProduct, lang, closeModal, addToCart, supabaseImageUrl }: any) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  const dict = {
    da: { add: "Tilføj til kurv", qty: "Antal", note: "Særlige ønsker", notePlh: "F.eks. ingen tomat..." },
    en: { add: "Add to Cart", qty: "Quantity", note: "Special requests", notePlh: "e.g., no tomato..." },
    el: { add: "Προσθήκη", qty: "Ποσότητα", note: "Ειδικές Οδηγίες", notePlh: "π.χ. χωρίς ντομάτα..." }
  };
  
  const ui = dict[lang as keyof typeof dict] || dict['da'];

  const getTitle = (item: any) => item?.[`title_${lang}`] || item?.title_da || item?.title_el || item?.name || "Product";
  const getDesc = (item: any) => item?.[`desc_${lang}`] || item?.desc_da || "";
  const getBasePrice = () => Number(activeProduct?.price_takeaway || activeProduct?.price || 0);

  const totalPrice = getBasePrice() * quantity;

  const handleAdd = () => {
    // Στέλνει το προϊόν στο καλάθι με ασφάλεια (κενά options για να μην κρασάρει το καλάθι)
    addToCart({ 
      ...activeProduct, 
      final_price: getBasePrice(), 
      selectedOptions: [], 
      note: note.trim() 
    }, quantity);
    closeModal();
  };

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
          
          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-2xl border border-white/5 mb-2 shadow-inner">
            <span className="text-xs text-gray-400 font-bold uppercase ml-3">{ui.qty}</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 bg-slate-800 rounded-xl text-white font-bold text-xl hover:bg-slate-700 transition-colors active:scale-90">-</button>
              <span className="font-black text-lg w-4 text-center">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 bg-slate-800 rounded-xl text-white font-bold text-xl hover:bg-slate-700 transition-colors active:scale-90">+</button>
            </div>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border-t border-white/10 shrink-0">
          <button onClick={handleAdd} className="w-full bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black uppercase tracking-wider py-4 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.2)] transition-transform active:scale-95 flex justify-between px-6">
            <span>{ui.add}</span><span>{totalPrice} kr.</span>
          </button>
        </div>

      </div>
    </div>
  );
}
