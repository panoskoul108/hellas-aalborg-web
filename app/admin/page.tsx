'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  // State για το Μενού
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // ΝΕΟ: State για τις Παραγγελίες
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('orders'); // Ξεκινάει στις παραγγελίες από προεπιλογή
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

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

  // ΝΕΟ: Φόρτωση Παραγγελιών
  const fetchOrders = async () => {
    setLoadingOrders(true);
    // Τραβάμε τις παραγγελίες ΜΑΖΙ με τα πιάτα (order_items) που ανήκουν σε αυτές
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
    setLoadingOrders(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMenu();
    }
  }, [isAuthenticated]);

  // ΝΕΟ: Αυτόματη ανανέωση παραγγελιών κάθε 15 δευτερόλεπτα (σαν live POS)
  useEffect(() => {
    let interval: any;
    if (isAuthenticated && activeTab === 'orders') {
      fetchOrders();
      interval = setInterval(() => {
        fetchOrders();
      }, 15000);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated, activeTab]);

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

  // ΝΕΟ: Αλλαγή Κατάστασης Παραγγελίας
  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (!error) {
      fetchOrders(); // Ανανεώνουμε τη λίστα μετά την αλλαγή
    } else {
      alert('Σφάλμα: ' + error.message);
    }
  };

  // --- Λειτουργίες Μενού (Παραμένουν ίδιες) ---
  const openNewModal = () => {
    setEditingItem({
      sort_order: menuItems.length + 1, 
      category: 'GYROS PITA', title_da: '', title_en: '', title_el: '', desc_da: '', desc_en: '', desc_el: '',
      price_takeaway: '', price_delivery: '', popular: false, vegetarian: false, featured: false,
      image_path: null
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => { setEditingItem(item); setIsModalOpen(true); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      setImageUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('menu-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      setEditingItem({ ...editingItem, image_path: fileName });
    } catch (error: any) {
      alert('Σφάλμα: ' + error.message);
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
    if (window.confirm('Διαγραφή;')) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (!error) { alert('Διαγράφηκε!'); fetchMenu(); }
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
        
        {/* TABS & BUTTONS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/10 pb-4">
          <div className="flex gap-6">
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`text-xl md:text-2xl font-bold pb-2 transition-colors ${activeTab === 'orders' ? 'text-white border-b-2 border-[#38BDF8]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              📦 Παραγγελίες
            </button>
            <button 
              onClick={() => setActiveTab('menu')} 
              className={`text-xl md:text-2xl font-bold pb-2 transition-colors ${activeTab === 'menu' ? 'text-white border-b-2 border-[#38BDF8]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              🍔 Μενού
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {activeTab === 'menu' && (
              <button onClick={openNewModal} className="bg-[#38BDF8] text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-400">➕ Νέο Πιάτο</button>
            )}
            {activeTab === 'orders' && (
              <button onClick={fetchOrders} className="bg-slate-800 text-white border border-white/10 px-4 py-2 rounded-lg text-sm hover:bg-slate-700 flex items-center gap-2">
                <span className={loadingOrders ? 'animate-spin' : ''}>🔄</span> Ανανέωση
              </button>
            )}
            <button onClick={handleLogout} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm border border-red-500/30 hover:bg-red-500 hover:text-white">Αποσύνδεση</button>
          </div>
        </div>

        {/* ΕΝΟΤΗΤΑ ΠΑΡΑΓΓΕΛΙΩΝ */}
        {activeTab === 'orders' && (
          <div className="flex flex-col gap-6">
            {loadingOrders && orders.length === 0 ? (
              <p className="text-[#38BDF8] font-medium animate-pulse">Φόρτωση παραγγελιών...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-white/5">
                <span className="text-4xl block mb-3">😴</span>
                <p className="text-gray-400">Δεν υπάρχουν ακόμα παραγγελίες.</p>
              </div>
            ) : (
              orders.map((order: any) => (
                <div key={order.id} className={`p-5 md:p-6 rounded-2xl border shadow-lg ${
                  order.status === 'pending' ? 'border-yellow-500/50 bg-yellow-500/10' : 
                  order.status === 'accepted' ? 'border-blue-500/40 bg-blue-500/10' : 
                  order.status === 'completed' ? 'border-green-500/30 bg-green-500/5 opacity-70' : 
                  'border-red-500/30 bg-red-500/5 opacity-50'
                }`}>
                  <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-white">{order.customer_name}</h3>
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                          order.status === 'pending' ? 'bg-yellow-500 text-black' : 
                          order.status === 'accepted' ? 'bg-blue-500 text-white' : 
                          order.status === 'completed' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
                        }`}>
                          {order.status === 'pending' ? 'ΝΕΑ' : order.status === 'accepted' ? 'ΕΤΟΙΜΑΖΕΤΑΙ' : order.status === 'completed' ? 'ΟΛΟΚΛΗΡΩΘΗΚΕ' : 'ΑΚΥΡΩΘΗΚΕ'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 font-medium tracking-wide">📞 {order.customer_phone}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(order.created_at).toLocaleString('el-GR', { weekday: 'short', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-left md:text-right bg-slate-900/50 p-3 rounded-xl border border-white/5 w-full md:w-auto">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">{order.order_type}</p>
                      <span className="text-2xl font-extrabold text-[#38BDF8]">{order.total_amount} <span className="text-sm">DKK</span></span>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 rounded-xl p-4 mb-5 border border-white/5">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-sm py-2 border-b border-white/5 last:border-0">
                        <span className="text-gray-200">
                          <span className="text-[#38BDF8] font-bold text-base mr-2">{item.quantity}x</span> 
                          {item.item_name}
                        </span>
                        <span className="text-gray-400 font-medium">{item.total_price} DKK</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {order.status === 'pending' && (
                      <button onClick={() => updateOrderStatus(order.id, 'accepted')} className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-3 rounded-xl text-sm font-bold flex-1 shadow-lg transform transition active:scale-95">👉 Αποδοχή & Προετοιμασία</button>
                    )}
                    {order.status === 'accepted' && (
                      <button onClick={() => updateOrderStatus(order.id, 'completed')} className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-3 rounded-xl text-sm font-bold flex-1 shadow-lg transform transition active:scale-95">✅ Είναι Έτοιμη!</button>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                      <button onClick={() => { if(window.confirm('Θέλετε σίγουρα να ακυρώσετε αυτή την παραγγελία;')) updateOrderStatus(order.id, 'cancelled') }} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-bold border border-red-500/20 transition-colors">❌ Ακύρωση</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {/* ΕΝΟΤΗΤΑ ΜΕΝΟΥ */}
        {activeTab === 'menu' && (
          <div>
            {loading ? <p className="text-[#38BDF8]">Φόρτωση πιάτων...</p> : (
              <>
                <div className="grid grid-cols-1 lg:hidden gap-6">
                  {menuItems.map((item, index) => (
                    <div key={item.id} className="bg-slate-800/50 p-5 rounded-xl border border-white/5 shadow-lg relative flex gap-4 items-start">
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
              <div className="col-span-full bg-slate-800/50 p-4 rounded-xl border border-white/10 mb-2">
                <label className="text-sm font-bold text-white block mb-3">Φωτογραφία Πιάτου</label>
                <div className="flex items-center gap-4">
                  {editingItem.image_path ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/20 shrink-0">
                      <img src={`${supabaseImageUrl}${editingItem.image_path}`} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-800 border border-dashed border-slate-600 flex items-center justify-center text-2xl text-slate-500 shrink-0">📸</div>
                  )}
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={imageUploading} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#38BDF8]/10 file:text-[#38BDF8] hover:file:bg-[#38BDF8]/20 cursor-pointer disabled:opacity-50" />
                    {imageUploading && <p className="text-xs text-[#38BDF8] mt-2 animate-pulse">Ανέβασμα...</p>}
                    {editingItem.image_path && (
                      <button onClick={() => setEditingItem({...editingItem, image_path: null})} className="text-xs text-red-400 hover:text-red-300 mt-2 underline">Αφαίρεση</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-full">
                <label className="text-xs text-gray-400 block mb-1">Κατηγορία</label>
                <input type="text" value={editingItem.category} onChange={(e) => setEditingItem({...editingItem, category: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" />
              </div>
              <div><label className="text-xs text-gray-400 block mb-1">Τίτλος (Δανέζικα)</label><input type="text" value={editingItem.title_da} onChange={(e) => setEditingItem({...editingItem, title_da: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" /></div>
              <div><label className="text-xs text-gray-400 block mb-1">Τίτλος (Ελληνικά)</label><input type="text" value={editingItem.title_el} onChange={(e) => setEditingItem({...editingItem, title_el: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" /></div>
              <div className="col-span-full"><label className="text-xs text-gray-400 block mb-1">Περιγραφή (Δανέζικα)</label><textarea value={editingItem.desc_da || ''} onChange={(e) => setEditingItem({...editingItem, desc_da: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white h-20" /></div>
              <div><label className="text-xs text-gray-400 block mb-1">Τιμή Takeaway (Μόνο αριθμός)</label><input type="text" value={editingItem.price_takeaway} onChange={(e) => setEditingItem({...editingItem, price_takeaway: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" /></div>
              <div><label className="text-xs text-gray-400 block mb-1">Τιμή Wolt (Μόνο αριθμός)</label><input type="text" value={editingItem.price_delivery} onChange={(e) => setEditingItem({...editingItem, price_delivery: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" /></div>

              <div className="col-span-full flex flex-wrap gap-6 pt-4 border-t border-white/5">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editingItem.popular} onChange={(e) => setEditingItem({...editingItem, popular: e.target.checked})} className="accent-[#38BDF8] w-4 h-4" /> <span className="text-sm">Popular</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editingItem.vegetarian} onChange={(e) => setEditingItem({...editingItem, vegetarian: e.target.checked})} className="accent-[#38BDF8] w-4 h-4" /> <span className="text-sm">Vegetarian</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={editingItem.featured} onChange={(e) => setEditingItem({...editingItem, featured: e.target.checked})} className="accent-[#38BDF8] w-4 h-4" /> <span className="text-sm">Featured</span></label>
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
