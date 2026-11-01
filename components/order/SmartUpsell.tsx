'use client';
import React, { useState, useEffect } from 'react';

interface SmartUpsellProps {
  cart: { item: any, quantity: number }[];
  menuItems: any[];
  lang: 'da' | 'en' | 'el';
  onAdd: (item: any) => void;
}

export default function SmartUpsell({ cart, menuItems, lang, onAdd }: SmartUpsellProps) {
  const [suggestion, setSuggestion] = useState<any>(null);

  useEffect(() => {
    // Αν δεν υπάρχουν προϊόντα στο μενού ή το καλάθι είναι άδειο, κρύψου!
    if (!menuItems || menuItems.length === 0 || cart.length === 0) {
      setSuggestion(null);
      return;
    }
    
    const cartItemIds = cart.map(c => c.item.id);
    
    // Λέξεις-κλειδιά που ψάχνουμε για να του προτείνουμε (αναψυκτικά, πατάτες, κλπ)
    const upsellKeywords = ['coca', 'cola', 'sodavand', 'fanta', 'sprite', 'pepsi', 'vand', 'pommes', 'frites', 'tzatziki', 'πατάτες'];
    
    // Ψάχνουμε στο μενού προϊόντα που έχουν αυτές τις λέξεις ΚΑΙ ΔΕΝ είναι ήδη στο καλάθι
    const potentialUpsells = menuItems.filter(item => {
      if (cartItemIds.includes(item.id)) return false; 
      const name = (item.title_da || item.title_el || item.name || '').toLowerCase();
      return upsellKeywords.some(kw => name.includes(kw));
    });

    if (potentialUpsells.length > 0) {
      // Επιλέγουμε ένα τυχαία για να έχει ποικιλία κάθε φορά που ανοίγει το καλάθι!
      const randomItem = potentialUpsells[Math.floor(Math.random() * potentialUpsells.length)];
      setSuggestion(randomItem);
    } else {
      setSuggestion(null);
    }
  }, [cart, menuItems]);

  if (!suggestion) return null;

  const dict = {
    da: { title: "Noget koldt at drikke eller tilbehør?", add: "Tilføj" },
    en: { title: "Something cold to drink or a side?", add: "Add" },
    el: { title: "Μήπως ξεχάσατε κάτι;", add: "Προσθήκη" }
  };
  const ui = dict[lang];

  const getTitle = (item: any) => item[`title_${lang}`] || item.title_da || item.title_el || item.name;
  const getPrice = (item: any) => Number(item.final_price || item.price_takeaway || item.price || 0);

  return (
    <div className="bg-indigo-900/40 border border-indigo-500/50 rounded-2xl p-4 mt-2 flex items-center justify-between shadow-lg animate-fade-in-up">
      <div className="pr-3 flex-1">
        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">💡 {ui.title}</h4>
        <p className="font-bold text-white text-sm leading-tight">{getTitle(suggestion)}</p>
      </div>
      <button 
        onClick={() => onAdd(suggestion)} 
        className="bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black text-xs px-4 py-2.5 rounded-xl transition-transform active:scale-95 shadow-md whitespace-nowrap flex items-center gap-1"
      >
        ➕ {getPrice(suggestion)} kr.
      </button>
    </div>
  );
}
