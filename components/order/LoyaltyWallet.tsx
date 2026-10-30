'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/app/supabase';

interface LoyaltyWalletProps {
  userId: string | undefined;
  subtotal: number;
  lang: 'da' | 'en' | 'el';
  onApplyDiscount: (discountAmount: number) => void;
}

export default function LoyaltyWallet({ userId, subtotal, lang, onApplyDiscount }: LoyaltyWalletProps) {
  const [balance, setBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  const dict = {
    da: { walletTitle: "Dit Digitale Pung", balanceMsg: "Din saldo:", useBtn: "Brug saldo", earnMsg: "Du tjener" },
    en: { walletTitle: "Your Digital Wallet", balanceMsg: "Your balance:", useBtn: "Use balance", earnMsg: "You will earn" },
    el: { walletTitle: "Το Ψηφιακό σας Πορτοφόλι", balanceMsg: "Το υπόλοιπό σας:", useBtn: "Χρήση υπολοίπου", earnMsg: "Θα κερδίσετε" }
  };
  const ui = dict[lang];

  useEffect(() => {
    if (!userId) return;
    const fetchBalance = async () => {
      const { data } = await supabase.from('customers_loyalty').select('wallet_balance').eq('user_id', userId).single();
      if (data) setBalance(Number(data.wallet_balance) || 0);
    };
    fetchBalance();
  }, [userId]);

  // Ανάλογα με την επιλογή, υπολογίζουμε την έκπτωση
  useEffect(() => {
    if (useWallet && balance > 0) {
      // Δεν μπορεί να χρησιμοποιήσει περισσότερα από όσα κοστίζει η παραγγελία
      const maxDiscount = Math.min(balance, subtotal);
      onApplyDiscount(maxDiscount);
    } else {
      onApplyDiscount(0);
    }
  }, [useWallet, balance, subtotal, onApplyDiscount]);

  if (!userId) return null; // Αν δεν έχει κάνει login, το Component κρύβεται εντελώς!

  const appliedDiscount = useWallet ? Math.min(balance, subtotal) : 0;
  const finalPay = Math.max(0, subtotal - appliedDiscount);
  const willEarn = (finalPay * 0.05).toFixed(2); // 5% επιστροφή επί του τελικού ποσού

  return (
    <div className="bg-gradient-to-br from-slate-900 to-[#0F172A] border border-[#38BDF8]/30 rounded-2xl p-4 shadow-lg mb-6 relative overflow-hidden">
      {/* Διακοσμητικό Glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#38BDF8]/20 blur-2xl rounded-full pointer-events-none"></div>

      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-black text-[#38BDF8] uppercase tracking-widest flex items-center gap-2">
          <span>💳</span> {ui.walletTitle}
        </h4>
        <span className="bg-slate-800 text-white font-black text-sm px-3 py-1 rounded-lg shadow-inner border border-slate-700">
          {balance.toFixed(2)} kr.
        </span>
      </div>

      {balance > 0 && (
        <div className="flex items-center justify-between border-t border-slate-700/50 pt-3 mb-2">
          <span className="text-sm font-bold text-gray-300">{ui.useBtn} (-{Math.min(balance, subtotal).toFixed(2)} kr)</span>
          <button 
            type="button"
            onClick={() => setUseWallet(!useWallet)}
            className={`w-12 h-6 rounded-full transition-colors relative shadow-inner flex items-center ${useWallet ? 'bg-[#38BDF8]' : 'bg-slate-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-md absolute transition-transform ${useWallet ? 'translate-x-7' : 'translate-x-1'}`}></div>
          </button>
        </div>
      )}

      <div className="bg-[#38BDF8]/10 text-[#38BDF8] text-[10px] font-bold px-3 py-2 rounded-lg mt-3 flex justify-between items-center border border-[#38BDF8]/20">
        <span className="uppercase tracking-widest">{ui.earnMsg}:</span>
        <span className="text-xs font-black">+{willEarn} kr.</span>
      </div>
    </div>
  );
}
