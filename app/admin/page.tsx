'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States για το Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setIsAuthenticated(true);
      else setLoading(false);
    };
    checkUser();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('menu_items').select('*').order('id', { ascending: true });
    if (data) setMenuItems(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) fetchMenu();
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password: passwordInput });
    if (error) alert('Λάθος Email ή Κωδικός!');
    else setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  // Άνοιγμα Modal για ΝΕΟ πιάτο
  const openNewModal = () => {
    setEditingItem({
      category: 'GYROS PITA', title_da: '', title_en: '', title_el: '', desc_da: '', desc_en: '', desc_el: '',
      price_takeaway: '', price_delivery: '', popular: false, vegetarian: false, featured: false
    });
    setIsModalOpen(true);
  };

  // Άνοιγμα Modal για ΕΠΕΞΕΡΓΑΣΙΑ
  const openEditModal = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Αποθήκευση (Είτε Insert είτε Update)
  const saveItem = async () => {
    if (editingItem.id) {
      // 1. Βγάζουμε το 'id' έξω, και κρατάμε τα υπόλοιπα στο 'dataToUpdate'
      const { id, ...dataToUpdate } = editingItem;

      // 2. Στέλνουμε για update ΜΟΝΟ τα δεδομένα, χωρίς το id!
      const { error } = await supabase.from('menu_items').update(dataToUpdate).eq('id', id);
      
      if (error) alert('Σφάλμα: ' + error.message);
      else { alert('Αποθηκεύτηκε!'); fetchMenu(); setIsModalOpen(false); }
    } else {
      // Insert νέου
      const { error } = await supabase.from('menu_items').insert([editingItem]);
      if (error) alert('Σφάλμα: ' + error.message);
      else { alert('Προστέθηκε!'); fetchMenu(); setIsModalOpen(false); }
    }
  };

  // Διαγραφή Πιάτου (με επιβεβαίωση)
  const deleteItem = async (id: number) => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πιάτο οριστικά; Απαιτείται επιβεβαίωση διαχειριστή.')) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) alert('Σφάλμα διαγραφής.');
      else { alert('Διαγράφηκε!'); fetchMenu(); }
    }
  };

  // Εξαγωγή σε CSV
  const exportToCSV = () => {
    const headers = ['Category,Title DA,Title EN,Title EL,Price Takeaway,Price Wolt'];
    const rows = menuItems.map(item => 
      `"${item.category}","${item.title_da}","${item.title_en}","${item.title_el}","${item.price_takeaway}","${item.price_delivery}"`
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "hellas_aalborg_menu.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-900 p-8 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-4 max-w-sm w-full">
          <h1 className="text-2xl font-bold text-white text-center mb-2">Hellas Aalborg Admin</h1>
          <input type="email" placeholder="Email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="p-3 rounded-lg bg-slate-800 text-white border border-slate-700 outline-none" required />
          <input type="password" placeholder="Κωδικός Πρόσβασης" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="p-3 rounded-lg bg-slate-800 text-white border border-slate-700 outline-none" required />
          <button type="submit" className="bg-[#38BDF8] text-slate-900 font-bold p-3 rounded-lg hover:bg-sky-400 mt-2">Είσοδος</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-gray-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Διαχείριση Μενού</h1>
          <div className="flex flex-wrap gap-3">
            <button onClick={exportToCSV} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm border border-white/10 hover:bg-slate-700">📥 Εξαγωγή CSV</button>
            <button onClick={openNewModal} className="bg-[#38BDF8] text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-400">➕ Νέο Πιάτο</button>
            <button onClick={handleLogout} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm border border-red-500/30 hover:bg-red-500 hover:text-white">Αποσύνδεση</button>
          </div>
        </div>

        {loading ? <p className="text-[#38BDF8]">Φόρτωση πιάτων...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map(item => (
              <div key={item.id} className="bg-slate-800/50 p-5 rounded-xl border border-white/5 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-[#38BDF8] uppercase tracking-wider">{item.category}</span>
                    <div className="flex gap-1">
                      {item.popular && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">Popular</span>}
                      {item.vegetarian && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Veg</span>}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title_da}</h3>
                  <div className="flex gap-4 text-sm text-gray-400">
                    <p>TA: <span className="text-white font-medium">{item.price_takeaway}</span></p>
                    <p>Wolt: <span className="text-white font-medium">{item.price_delivery}</span></p>
                  </div>
                </div>
                <div className="flex gap-2 mt-5 pt-4 border-t border-white/5">
                  <button onClick={() => openEditModal(item)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm transition">Επεξεργασία</button>
                  <button onClick={() => deleteItem(item.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 rounded-lg text-sm transition">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL ΕΠΕΞΕΡΓΑΣΙΑΣ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editingItem.id ? 'Επεξεργασία Πιάτου' : 'Νέο Πιάτο'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full">
                <label className="text-xs text-gray-400 block mb-1">Κατηγορία</label>
                <input type="text" value={editingItem.category} onChange={(e) => setEditingItem({...editingItem, category: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Τίτλος (Δανέζικα)</label>
                <input type="text" value={editingItem.title_da} onChange={(e) => setEditingItem({...editingItem, title_da: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Τίτλος (Ελληνικά)</label>
                <input type="text" value={editingItem.title_el} onChange={(e) => setEditingItem({...editingItem, title_el: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div className="col-span-full">
                <label className="text-xs text-gray-400 block mb-1">Περιγραφή (Δανέζικα)</label>
                <textarea value={editingItem.desc_da} onChange={(e) => setEditingItem({...editingItem, desc_da: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white h-20" />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Τιμή Takeaway</label>
                <input type="text" value={editingItem.price_takeaway} onChange={(e) => setEditingItem({...editingItem, price_takeaway: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Τιμή Wolt</label>
                <input type="text" value={editingItem.price_delivery} onChange={(e) => setEditingItem({...editingItem, price_delivery: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div className="col-span-full flex gap-6 pt-4 border-t border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingItem.popular} onChange={(e) => setEditingItem({...editingItem, popular: e.target.checked})} className="accent-[#38BDF8] w-4 h-4" />
                  <span className="text-sm">Popular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingItem.vegetarian} onChange={(e) => setEditingItem({...editingItem, vegetarian: e.target.checked})} className="accent-[#38BDF8] w-4 h-4" />
                  <span className="text-sm">Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingItem.featured} onChange={(e) => setEditingItem({...editingItem, featured: e.target.checked})} className="accent-[#38BDF8] w-4 h-4" />
                  <span className="text-sm">Featured (Διπλή Κάρτα)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm text-gray-400 hover:text-white">Ακύρωση</button>
              <button onClick={saveItem} className="bg-[#38BDF8] text-slate-900 font-bold px-6 py-2 rounded-lg hover:bg-sky-400">Αποθήκευση</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
