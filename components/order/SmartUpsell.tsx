'use client';
import React, { useState, useEffect } from 'react';

interface SmartUpsellProps {
  cart: { item: any, quantity: number }[];
  menuItems: any[];
  lang: 'da' | 'en' | 'el';
  onAdd: (item: any) => void;
}

export default function SmartUpsell({ cart, menuItems, lang, onAdd }: SmartUpsellProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const supabaseImageUrl = "https://keolpijcsvwsrzkjqtkc.supabase.co/storage/v1/object/public/menu-images/";

  useEffect(() => {
    if (!menuItems || menuItems.length === 0 || cart.length === 0) {
      setSuggestions([]);
      return;
    }
    
    const cartItemIds = cart.map(c => c.item.id);
    const upsellKeywords = ['coca', 'cola', 'sodavand', 'fanta', 'sprite', 'pepsi', 'vand', 'pommes', 'frites', 'tzatziki', 'πατάτες', 'halloumi', 'pita'];
    
    const potentialUpsells = menuItems.filter(item => {
      if (cartItemIds.includes(item.id)) return false; 
      const name = (item.title_da || item.title_el || item.name || '').toLowerCase();
      const category = (item.category || '').toUpperCase().trim();
      
      return upsellKeywords.some(kw => name.includes(kw)) || category === 'DRINKS' || category === 'BEERS' || category === 'DRIKKEVARER' || category === 'DIPS';
    });

    if (potentialUpsells.length > 0) {
      const shuffled = potentialUpsells.sort(() => 0.5 - Math.random());
      setSuggestions(shuffled.slice(0, 6));
    } else {
      setSuggestions([]);
    }
  }, [cart, menuItems]);

  if (suggestions.length === 0) return null;

  const dict = {
    da: { title: "Noget ekstra?", add: "Tilføj" },
    en: { title: "Something extra?", add: "Add" },
    el: { title: "Μήπως ξεχάσατε κάτι;", add: "Προσθήκη" }
  };
  const ui = dict[lang];

  const getTitle = (item: any) => item[`title_${lang}`] || item.title_da || item.title_el || item.name;
  const getPrice = (item: any) => Number(item.final_price || item.price_takeaway || item.price || 0);

  const handleItemClick = (item: any) => {
    const category = (item.category || '').toUpperCase().trim();
    // ΠΡΟΣΤΕΘΗΚΕ Η ΚΑΤΗΓΟΡΙΑ 'DIPS' ΣΤΟ ΑΜΕΣΟ ΚΛΙΚ
    if (category === 'DRINKS' || category === 'BEERS' || category === 'DRIKKEVARER' || category === 'DIPS') {
      const itemToDropInCart = {
        ...item,
        final_price: getPrice(item),
        selectedOptions: [],
        note: ""
      };
      onAdd({ _directAdd: true, item: itemToDropInCart }); 
    } else {
      onAdd(item);
    }
  };

  return (
    <div className="mt-4 animate-fade-in-up">
      <h4 className="text-[10px] font-black text-[#38BDF8] uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
        💡 {ui.title}
      </h4>
      
      <div className="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory no-scrollbar -mx-5 px-5">
        {suggestions.map((item) => (
          <div 
            key={item.id} 
            onClick={() => handleItemClick(item)}
            className="flex-none w-[140px] bg-slate-800/40 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-between shadow-lg snap-start cursor-pointer hover:bg-slate-800 transition-colors group"
          >
            <div className="w-20 h-20 bg-slate-900 rounded-full mb-3 overflow-hidden border-2 border-slate-700 group-hover:border-[#38BDF8] transition-colors shrink-0">
              {item.image_path ? (
                <img src={`${supabaseImageUrl}${item.image_path}`} alt="product" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">🍟</div>
              )}
            </div>
            
            <p className="font-bold text-white text-[11px] leading-tight text-center line-clamp-2 h-8 mb-2">
              {getTitle(item)}
            </p>
            
            <div className="w-full bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black text-[10px] py-2 rounded-xl text-center uppercase tracking-wider transition-transform active:scale-95 shadow-sm">
              ➕ {getPrice(item)} kr.
            </div>
          </div>
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
