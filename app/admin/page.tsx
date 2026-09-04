'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [imageUploading, setImageUploading] = useState(false); // Νέο state για το loading της εικόνας

  // Το URL του Supabase Storage για τις προεπισκοπήσεις
 const supabaseImageUrl = "https://keolpijcsvwsrzkjqtkc.supabase.co/storage/v1/object/public/menu-images/";

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
    const { data, error } = await supabase.from('menu_items').select('*').order('sort_order', { ascending: true });
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

  const openNewModal = () => {
    setEditingItem({
      sort_order: menuItems.length + 1, 
      category: 'GYROS PITA', title_da: '', title_en: '', title_el: '', desc_da: '', desc_en: '', desc_el: '',
      price_takeaway: '', price_delivery: '', popular: false, vegetarian: false, featured: false,
      image_path: null // Αρχικοποίηση κενού image path για νέο πιάτο
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // --- ΝΕΑ ΛΕΙΤΟΥΡΓΙΑ: Ανέβασμα Εικόνας στο Supabase ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setImageUploading(true);

      // Φτιάχνουμε ένα μοναδικό όνομα για την εικόνα βάσει ημερομηνίας/ώρας
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      // Ανέβασμα στο Supabase Storage στο bucket "menu-images"
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Αν πετύχει, αποθηκεύουμε το όνομα του αρχείου στο state (για να σωθεί μετά στη βάση)
      setEditingItem({ ...editingItem, image_path: fileName });

    } catch (error: any) {
      alert('Σφάλμα κατά το ανέβασμα της εικόνας: ' + error.message);
    } finally {
      setImageUploading(false);
    }
  };

  const saveItem = async () => {
    let dataToUpdate = { ...editingItem };

    dataToUpdate.price_takeaway = String(dataToUpdate.price_takeaway || '').replace(/[^0-9]/g, '');
    dataToUpdate.price_delivery = String(dataToUpdate.price_delivery || '').replace(/[^0-9]/g, '');

    if (dataToUpdate.id) {
      const { id, ...rest } = dataToUpdate;
      const { error } = await supabase.from('menu_items').update(rest).eq('id', id);
      if (error) alert('Σφάλμα: ' + error.message);
      else { alert('Αποθηκεύτηκε!'); fetchMenu(); setIsModalOpen(false); }
    } else {
      const { error } = await supabase.from('menu_items').insert([dataToUpdate]);
      if (error) alert('Σφάλμα: ' + error.message);
      else { alert('Προστέθηκε!'); fetchMenu(); setIsModalOpen(false); }
    }
  };

  const deleteItem = async (id: number) => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πιάτο οριστικά;')) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) alert('Σφάλμα διαγραφής.');
      else { alert('Διαγράφηκε!'); fetchMenu(); }
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === menuItems.length - 1) return;

    const newItems = [...menuItems];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    const temp = newItems[index];
    newItems[index] = newItems[swapIndex];
    newItems[swapIndex] = temp;

    const updatedItems = newItems.map((item, i) => ({ ...item, sort_order: i + 1 }));

    setMenuItems(updatedItems); 

    await supabase.from('menu_items').update({ sort_order: updatedItems[index].sort_order }).eq('id', updatedItems[index].id);
    await supabase.from('menu_items').update({ sort_order: updatedItems[swapIndex].sort_order }).eq('id', updatedItems[swapIndex].id);
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
            <button onClick={openNewModal} className="bg-[#38BDF8] text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-400">➕ Νέο Πιάτο</button>
            <button onClick={handleLogout} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm border border-red-500/30 hover:bg-red-500 hover:text-white">Αποσύνδεση</button>
          </div>
        </div>

        {loading ? <p className="text-[#38BDF8]">Φόρτωση πιάτων...</p> : (
          <>
            {/* Κινητό: Κάρτες */}
            <div className="grid grid-cols-1 lg:hidden gap-6">
              {menuItems.map((item, index) => (
                <div key={item.id} className="bg-slate-800/50 p-5 rounded-xl border border-white/5 shadow-lg relative flex gap-4 items-start">
                  
                  {/* Μικρογραφία στο κινητό */}
                  {item.image_path ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 mt-2">
                       <img src={`${supabaseImageUrl}${item.image_path}`} alt="food" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-700 shrink-0 mt-2 flex items-center justify-center text-xl">📷</div>
                  )}

                  <div className="flex-1 w-full">
                    <div className="absolute top-4 right-4 flex flex-col gap-1">
                      <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-xs disabled:opacity-30 disabled:cursor-not-allowed">🔼</button>
                      <button onClick={() => moveItem(index, 'down')} disabled={index === menuItems.length - 1} className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded text-xs disabled:opacity-30 disabled:cursor-not-allowed">🔽</button>
                    </div>

                    <div className="flex justify-between items-center mb-1 pr-10">
                      <span className="text-xs font-bold text-[#38BDF8] uppercase tracking-wider">{item.category}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title_da}</h3>
                    <div className="flex gap-4 text-sm text-gray-400 mb-4">
                      <p>TA: <span className="text-white">{item.price_takeaway}</span></p>
                      <p>Wolt: <span className="text-white">{item.price_delivery}</span></p>
                    </div>
                    <div className="flex gap-2 border-t border-white/5 pt-4">
                      <button onClick={() => openEditModal(item)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm transition">Επεξεργασία</button>
                      <button onClick={() => deleteItem(item.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 rounded-lg text-sm transition">🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Υπολογιστής: Πίνακας */}
            <div className="hidden lg:block bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800 text-gray-400 uppercase">
                  <tr>
                    <th className="p-4 w-20 text-center">Σειρά</th>
                    <th className="p-4 w-20">Φωτό</th>
                    <th className="p-4">Κατηγορία</th>
                    <th className="p-4">Τίτλος</th>
                    <th className="p-4">Takeaway</th>
                    <th className="p-4 text-right">Ενέργεια</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {menuItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-white disabled:opacity-20 transition-colors">▲</button>
                          <button onClick={() => moveItem(index, 'down')} disabled={index === menuItems.length - 1} className="text-gray-400 hover:text-white disabled:opacity-20 transition-colors">▼</button>
                        </div>
                      </td>
                      <td className="p-4">
                        {item.image_path ? (
                          <img src={`${supabaseImageUrl}${item.image_path}`} alt="food" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center text-xs">📷</div>
                        )}
                      </td>
                      <td className="p-4 text-[#38BDF8] font-medium">{item.category}</td>
                      <td className="p-4 font-bold text-white">{item.title_da}</td>
                      <td className="p-4">{item.price_takeaway} DKK</td>
                      <td className="p-4 text-right">
                        <button onClick={() => openEditModal(item)} className="text-[#38BDF8] hover:text-sky-300 font-bold mr-4">Επεξεργασία</button>
                        <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-300">Διαγραφή</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editingItem.id ? 'Επεξεργασία Πιάτου' : 'Νέο Πιάτο'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* --- ΝΕΟ: ΕΝΟΤΗΤΑ ΦΩΤΟΓΡΑΦΙΑΣ --- */}
              <div className="col-span-full bg-slate-800/50 p-4 rounded-xl border border-white/10 mb-2">
                <label className="text-sm font-bold text-white block mb-3">Φωτογραφία Πιάτου</label>
                <div className="flex items-center gap-4">
                  {/* Προεπισκόπηση */}
                  {editingItem.image_path ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/20 shrink-0">
                      <img src={`${supabaseImageUrl}${editingItem.image_path}`} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-800 border border-dashed border-slate-600 flex items-center justify-center text-2xl text-slate-500 shrink-0">📸</div>
                  )}
                  
                  {/* Κουμπιά & Input */}
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      disabled={imageUploading}
                      className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#38BDF8]/10 file:text-[#38BDF8] hover:file:bg-[#38BDF8]/20 cursor-pointer disabled:opacity-50" 
                    />
                    {imageUploading && <p className="text-xs text-[#38BDF8] mt-2 animate-pulse">Ανέβασμα φωτογραφίας...</p>}
                    
                    {editingItem.image_path && (
                      <button 
                        onClick={() => setEditingItem({...editingItem, image_path: null})} 
                        className="text-xs text-red-400 hover:text-red-300 mt-2 underline"
                      >
                        Αφαίρεση Φωτογραφίας (Δεν θα διαγραφεί από τον φάκελο)
                      </button>
                    )}
                  </div>
                </div>
              </div>

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
                <textarea value={editingItem.desc_da || ''} onChange={(e) => setEditingItem({...editingItem, desc_da: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white h-20" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Τιμή Takeaway (Μόνο αριθμός)</label>
                <input type="text" value={editingItem.price_takeaway} onChange={(e) => setEditingItem({...editingItem, price_takeaway: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Τιμή Wolt (Μόνο αριθμός)</label>
                <input type="text" value={editingItem.price_delivery} onChange={(e) => setEditingItem({...editingItem, price_delivery: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div className="col-span-full flex flex-wrap gap-6 pt-4 border-t border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingItem.popular} onChange={(e) => setEditingItem({...editingItem, popular: e.target.checked})} className="accent-[#38BDF8] w-4 h-4" /> <span className="text-sm">Popular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingItem.vegetarian} onChange={(e) => setEditingItem({...editingItem, vegetarian: e.target.checked})} className="accent-[#38BDF8] w-4 h-4" /> <span className="text-sm">Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingItem.featured} onChange={(e) => setEditingItem({...editingItem, featured: e.target.checked})} className="accent-[#38BDF8] w-4 h-4" /> <span className="text-sm">Featured (Διπλή Κάρτα)</span>
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
