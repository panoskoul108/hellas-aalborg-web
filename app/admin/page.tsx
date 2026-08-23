'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Ο κρυφός κωδικός πρόσβασης! Άλλαξέ τον αν θες.
  const SECRET_PASSWORD = '2026!';

  // Φέρνουμε τα πιάτα από τη βάση όταν μπει ο χρήστης
  const fetchMenu = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('menu_items').select('*').order('id', { ascending: true });
    if (data) setMenuItems(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) fetchMenu();
  }, [isAuthenticated]);

  // Διαχείριση Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === SECRET_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Λάθος Κωδικός!');
    }
  };

  // Αλλαγή δεδομένων κατά την πληκτρολόγηση
  const handleInputChange = (id: number, field: string, value: any) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Αποθήκευση ενός πιάτου στη βάση (Update)
  const saveItem = async (item: any) => {
    const { error } = await supabase.from('menu_items').update({
      title_da: item.title_da,
      title_en: item.title_en,
      title_el: item.title_el,
      price_takeaway: item.price_takeaway,
      price_delivery: item.price_delivery,
      popular: item.popular
    }).eq('id', item.id);

    if (error) {
      alert('Σφάλμα κατά την αποθήκευση!');
      console.error(error);
    } else {
      alert('✅ Αποθηκεύτηκε επιτυχώς!');
    }
  };

  // Αν δεν έχει βάλει κωδικό, δείξε την οθόνη Login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-900 p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-4 max-w-sm w-full">
          <h1 className="text-2xl font-bold text-white text-center">Hellas Aalborg Admin</h1>
          <input 
            type="password" 
            placeholder="Κωδικός Πρόσβασης" 
            value={passwordInput} 
            onChange={(e) => setPasswordInput(e.target.value)}
            className="p-3 rounded-lg bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-[#38BDF8]"
          />
          <button type="submit" className="bg-[#38BDF8] text-slate-900 font-bold p-3 rounded-lg hover:bg-sky-400 transition">
            Είσοδος
          </button>
        </form>
      </div>
    );
  }

  // Αν έχει βάλει κωδικό, δείξε τον πίνακα διαχείρισης
  return (
    <div className="min-h-screen bg-[#0B1120] text-gray-200 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-white">Διαχείριση Μενού</h1>
          <button onClick={() => setIsAuthenticated(false)} className="text-sm text-gray-400 hover:text-white">Αποσύνδεση</button>
        </div>

        {loading ? (
          <p className="text-[#38BDF8]">Φόρτωση πιάτων...</p>
        ) : (
          <>
            {/* Mobile Cards (φαίνονται μόνο σε μικρές οθόνες) */}
            <div className="grid grid-cols-1 lg:hidden gap-6">
              {menuItems.map(item => (
                <div key={item.id} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex flex-col gap-3 shadow-lg">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                     <span className="text-xs font-bold text-[#38BDF8] uppercase">{item.category}</span>
                     <div className="flex items-center gap-2">
                       <label className="text-xs text-gray-400">Popular</label>
                       <input 
                         type="checkbox" 
                         checked={item.popular} 
                         onChange={(e) => handleInputChange(item.id, 'popular', e.target.checked)} 
                         className="w-4 h-4 accent-[#38BDF8]"
                       />
                     </div>
                  </div>
                  <div>
                     <label className="text-xs text-gray-500 block mb-1">Τίτλος (Δανέζικα)</label>
                     <input 
                       type="text" 
                       value={item.title_da || ''} 
                       onChange={(e) => handleInputChange(item.id, 'title_da', e.target.value)} 
                       className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-[#38BDF8] outline-none" 
                     />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                       <label className="text-xs text-gray-500 block mb-1">Takeaway (DKK)</label>
                       <input 
                         type="text" 
                         value={item.price_takeaway || ''} 
                         onChange={(e) => handleInputChange(item.id, 'price_takeaway', e.target.value)} 
                         className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-[#38BDF8] outline-none" 
                       />
                    </div>
                    <div className="flex-1">
                       <label className="text-xs text-gray-500 block mb-1">Wolt (DKK)</label>
                       <input 
                         type="text" 
                         value={item.price_delivery || ''} 
                         onChange={(e) => handleInputChange(item.id, 'price_delivery', e.target.value)} 
                         className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm focus:border-[#38BDF8] outline-none" 
                       />
                    </div>
                  </div>
                  <button 
                    onClick={() => saveItem(item)} 
                    className="mt-2 w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-2 rounded-lg font-bold hover:bg-emerald-500 hover:text-white transition-all text-sm"
                  >
                    Αποθήκευση
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table (φαίνεται μόνο σε μεγάλες οθόνες) */}
            <div className="hidden lg:block bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden overflow-x-auto shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800 text-gray-400 uppercase">
                  <tr>
                    <th className="p-4">Κατηγορία</th>
                    <th className="p-4">Τίτλος (Δανέζικα)</th>
                    <th className="p-4">Τιμή Takeaway</th>
                    <th className="p-4">Τιμή Wolt</th>
                    <th className="p-4 text-center">Popular</th>
                    <th className="p-4 text-right">Ενέργεια</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {menuItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-medium text-[#38BDF8]">{item.category}</td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          value={item.title_da || ''} 
                          onChange={(e) => handleInputChange(item.id, 'title_da', e.target.value)}
                          className="bg-transparent border-b border-slate-700 p-1 text-white focus:outline-none focus:border-[#38BDF8] w-full"
                        />
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          value={item.price_takeaway || ''} 
                          onChange={(e) => handleInputChange(item.id, 'price_takeaway', e.target.value)}
                          className="bg-transparent border-b border-slate-700 p-1 text-white focus:outline-none focus:border-[#38BDF8] w-20"
                        />
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          value={item.price_delivery || ''} 
                          onChange={(e) => handleInputChange(item.id, 'price_delivery', e.target.value)}
                          className="bg-transparent border-b border-slate-700 p-1 text-white focus:outline-none focus:border-[#38BDF8] w-20"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={item.popular} 
                          onChange={(e) => handleInputChange(item.id, 'popular', e.target.checked)}
                          className="w-4 h-4 accent-[#38BDF8]"
                        />
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => saveItem(item)}
                          className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg font-bold hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          Αποθήκευση
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
