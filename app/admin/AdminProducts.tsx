'use client';
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function AdminProducts({ theme }: { theme?: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("ΟΛΑ");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isAdding, setIsAdding] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState("basic");

  // Το editForm.extras τώρα θα είναι ARRAY (λίστα) για να βολεύει το UI, 
  // και θα μετατρέπεται σε Object (JSON) κατά την αποθήκευση.
  const [editForm, setEditForm] = useState({
    title_da: "", title_en: "", title_el: "",
    desc_da: "", desc_en: "", desc_el: "",
    price_takeaway: 0,
    category: "",
    is_available: true,
    popular: false,
    image_path: "",
    sort_order: 0,
    extras: [] as any[] 
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("title_da", { ascending: true });
      
    if (data) setProducts(data);
  };
  
  useEffect(() => { fetchProducts(); }, []);

  const handleToggleAvailable = async (product: any) => {
    const newVal = !product.is_available;
    setProducts(products.map(p => p.id === product.id ? { ...p, is_available: newVal } : p));
    await supabase.from("menu_items").update({ is_available: newVal }).eq("id", product.id);
  };

  const handleTogglePopular = async (product: any) => {
    const newVal = !product.popular;
    setProducts(products.map(p => p.id === product.id ? { ...p, popular: newVal } : p));
    await supabase.from("menu_items").update({ popular: newVal }).eq("id", product.id);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("ΠΡΟΣΟΧΗ: Θέλετε σίγουρα να διαγράψετε αυτό το προϊόν;")) {
      await supabase.from("menu_items").delete().eq("id", id);
      fetchProducts();
    }
  };

  // --- ΜΕΤΑΤΡΟΠΕΣ (JSON Object <-> Array για το UI) ---
  const parseExtrasToArray = (extrasObj: any) => {
    if (!extrasObj || typeof extrasObj !== 'object') return [];
    return Object.keys(extrasObj).map((key, index) => ({
      id: Date.now() + index, // Μοναδικό ID για τη React
      name: key,
      type: extrasObj[key].type || 'multiple',
      max: extrasObj[key].max || 0,
      options: extrasObj[key].options || []
    }));
  };

  const parseArrayToExtras = (extrasArray: any[]) => {
    const result: any = {};
    extrasArray.forEach(group => {
      if (!group.name.trim()) return; // Αγνοούμε ομάδες χωρίς όνομα
      result[group.name.trim()] = {
        type: group.type,
        ...(group.type === 'multiple' && group.max > 0 ? { max: group.max } : {}),
        options: group.options.map((opt: any) => ({
          name: opt.name,
          price: Number(opt.price) || 0
        }))
      };
    });
    return result;
  };

  // --- ΛΕΙΤΟΥΡΓΙΕΣ ΤΟΥ BUILDER ---
  const addGroup = () => setEditForm(prev => ({ ...prev, extras: [...prev.extras, { id: Date.now(), name: "", type: "multiple", max: 0, options: [] }] }));
  const removeGroup = (id: number) => setEditForm(prev => ({ ...prev, extras: prev.extras.filter(g => g.id !== id) }));
  const updateGroup = (id: number, field: string, value: any) => setEditForm(prev => ({ ...prev, extras: prev.extras.map(g => g.id === id ? { ...g, [field]: value } : g) }));
  
  const addItem = (groupId: number) => setEditForm(prev => ({ ...prev, extras: prev.extras.map(g => g.id === groupId ? { ...g, options: [...g.options, { name: "", price: 0 }] } : g) }));
  const removeItem = (groupId: number, itemIndex: number) => setEditForm(prev => ({ ...prev, extras: prev.extras.map(g => { if (g.id === groupId) { const newOpts = [...g.options]; newOpts.splice(itemIndex, 1); return { ...g, options: newOpts }; } return g; }) }));
  const updateItem = (groupId: number, itemIndex: number, field: string, value: any) => setEditForm(prev => ({ ...prev, extras: prev.extras.map(g => { if (g.id === groupId) { const newOpts = [...g.options]; newOpts[itemIndex][field] = value; return { ...g, options: newOpts }; } return g; }) }));

  // --- ΑΠΟΘΗΚΕΥΣΗ ---
  const saveEdit = async () => {
    const safeCategory = editForm.category?.trim().toUpperCase() || "ΓΕΝΙΚΑ";
    const finalExtrasObject = parseArrayToExtras(editForm.extras); // Μετατροπή πίσω σε JSON

    const finalData = { ...editForm, category: safeCategory, extras: finalExtrasObject };
    
    if (isAdding) {
      const { error } = await supabase.from("menu_items").insert([finalData]);
      if (error) alert("Σφάλμα Προσθήκης: " + error.message);
    } else {
      const { error } = await supabase.from("menu_items").update(finalData).eq("id", editingId);
      if (error) alert("Σφάλμα Αποθήκευσης: " + error.message);
    }
    
    setEditingId(null);
    setIsAdding(false);
    setIsCustomCategory(false);
    fetchProducts();
  };

  const openEditor = (product: any) => {
    setEditingId(product?.id || null);
    setIsAdding(!product);
    setIsCustomCategory(false);
    setActiveEditTab("basic");

    if (product) {
      // Φόρτωση υπάρχοντος προϊόντος (μετατρέπουμε το JSON σε Array)
      let parsedExtras = product.extras;
      if (typeof parsedExtras === 'string') {
        try { parsedExtras = JSON.parse(parsedExtras); } catch { parsedExtras = {}; }
      }
      setEditForm({ ...product, extras: parseExtrasToArray(parsedExtras) });
    } else {
      // Νέο Προϊόν
      setEditForm({ title_da: "", title_en: "", title_el: "", desc_da: "", desc_en: "", desc_el: "", price_takeaway: 0, category: displayCategories[0] || "", is_available: true, popular: false, image_path: "", sort_order: 0, extras: [] });
    }
  };

  let displayCategories = [...new Set(products.map((p) => p.category))].filter(Boolean);
  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === "ΟΛΑ" ? true : p.category === activeCategory;
    const matchSearch = (p.title_da || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.title_en || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto pb-24 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-white/10 pb-4">
        <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-[#38BDF8]">Διαχείριση Καταλόγου</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input type="text" placeholder="Αναζήτηση..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:min-w-[200px] px-4 py-3 rounded-2xl font-bold text-sm bg-gray-800 border border-gray-700 text-white focus:border-[#38BDF8] outline-none" />
          <button onClick={() => openEditor(null)} className="bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] px-5 py-3 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 whitespace-nowrap">+ Νέο Προϊόν</button>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-4 mb-6 no-scrollbar">
        <button onClick={() => setActiveCategory("ΟΛΑ")} className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap ${activeCategory === "ΟΛΑ" ? "bg-white text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>ΟΛΑ</button>
        {displayCategories.map(cat => <button key={cat} onClick={() => setActiveCategory(cat)} className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap ${activeCategory === cat ? "bg-white text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>{cat}</button>)}
      </div>

      <div className="space-y-4">
        {filteredProducts.map((p) => (
          <div key={p.id} className={`p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all border ${!p.is_available ? "opacity-60 border-red-900/50 bg-red-900/10" : "bg-gray-800/60 border-gray-700"}`}>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-gray-900 flex items-center justify-center text-2xl overflow-hidden border border-gray-700">
                {p.image_path ? <img src={`https://keolpijcsvwsrzkjqtkc.supabase.co/storage/v1/object/public/menu-images/${p.image_path}`} className="w-full h-full object-cover"/> : "🍽️"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1"><h3 className="font-black uppercase text-base text-gray-100">{p.title_da || p.title_el}</h3>{p.popular && <span className="text-yellow-500 text-xs">⭐</span>}</div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide mb-1">{p.category}</p>
                <p className="text-[#38BDF8] font-black text-sm">{Number(p.price_takeaway || p.price || 0).toFixed(2)} DKK</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end items-center">
              <div className="flex flex-col items-center mr-2"><span className="text-[8px] font-black uppercase text-gray-400 mb-1">Διαθεσιμο</span><input type="checkbox" checked={p.is_available} onChange={() => handleToggleAvailable(p)} className="w-5 h-5 accent-green-500 cursor-pointer" /></div>
              <button onClick={() => handleTogglePopular(p)} className={`w-12 h-12 rounded-xl text-xl ${p.popular ? "bg-yellow-900/30 text-yellow-500" : "bg-gray-900 text-gray-500"}`}>⭐</button>
              <button onClick={() => openEditor(p)} className="w-12 h-12 rounded-xl text-lg bg-blue-900/30 text-blue-400">✏️</button>
              <button onClick={() => handleDelete(p.id)} className="w-12 h-12 rounded-xl text-lg bg-red-900/30 text-red-400">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {(isAdding || editingId !== null) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col rounded-[2rem] shadow-2xl overflow-hidden bg-gray-900 border border-gray-700">
            <div className="shrink-0 flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900">
              <h3 className="text-xl font-black uppercase italic text-white">{isAdding ? "Νέο Προϊόν" : "Επεξεργασία"}</h3>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="w-10 h-10 rounded-full bg-gray-800 text-gray-500 hover:text-red-500 font-black text-xl">✕</button>
            </div>

            <div className="shrink-0 flex overflow-x-auto border-b border-gray-800 px-6 pt-4 gap-4">
              <button onClick={() => setActiveEditTab("basic")} className={`pb-3 font-black text-xs uppercase tracking-widest border-b-4 ${activeEditTab === "basic" ? "border-[#38BDF8] text-[#38BDF8]" : "border-transparent text-gray-500"}`}>ΒΑΣΙΚΑ & ΤΙΜΗ</button>
              <button onClick={() => setActiveEditTab("addons")} className={`pb-3 font-black text-xs uppercase tracking-widest border-b-4 ${activeEditTab === "addons" ? "border-[#38BDF8] text-[#38BDF8]" : "border-transparent text-gray-500"}`}>ΥΛΙΚΑ / EXTRAS</button>
              <button onClick={() => setActiveEditTab("trans")} className={`pb-3 font-black text-xs uppercase tracking-widest border-b-4 ${activeEditTab === "trans" ? "border-[#38BDF8] text-[#38BDF8]" : "border-transparent text-gray-500"}`}>ΜΕΤΑΦΡΑΣΕΙΣ</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeEditTab === "basic" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2"><label className="text-[10px] font-black text-gray-500 block mb-1">ΟΝΟΜΑ</label><input type="text" className="w-full p-4 rounded-xl bg-gray-800 border-gray-700 text-white" value={editForm.title_da} onChange={(e) => setEditForm({ ...editForm, title_da: e.target.value })} /></div>
                  <div><label className="text-[10px] font-black text-gray-500 block mb-1">ΤΙΜΗ (DKK)</label><input type="number" className="w-full p-4 rounded-xl bg-gray-800 border-gray-700 text-[#38BDF8] text-lg font-black" value={editForm.price_takeaway} onChange={(e) => setEditForm({ ...editForm, price_takeaway: Number(e.target.value) })} /></div>
                  <div><label className="text-[10px] font-black text-gray-500 block mb-1">ΚΑΤΗΓΟΡΙΑ</label>
                    {!isCustomCategory ? (
                      <select className="w-full p-4 rounded-xl bg-gray-800 border-gray-700 text-white" value={editForm.category} onChange={(e) => { if (e.target.value === "NEW") setIsCustomCategory(true); else setEditForm({ ...editForm, category: e.target.value }); }}>
                        {displayCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="NEW">+ ΝΕΑ ΚΑΤΗΓΟΡΙΑ</option>
                      </select>
                    ) : (
                      <div className="flex gap-2"><input type="text" className="w-full p-4 rounded-xl bg-gray-800 border-gray-700 text-white uppercase" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value.toUpperCase() })} /><button onClick={() => {setIsCustomCategory(false); setEditForm({...editForm, category: displayCategories[0]});}} className="px-4 bg-gray-700 rounded-xl text-white">✕</button></div>
                    )}
                  </div>
                  <div className="col-span-1 md:col-span-2"><label className="text-[10px] font-black text-gray-500 block mb-1">ΑΡΧΕΙΟ ΕΙΚΟΝΑΣ</label><input type="text" className="w-full p-4 rounded-xl bg-gray-800 border-gray-700 text-white" value={editForm.image_path} onChange={(e) => setEditForm({ ...editForm, image_path: e.target.value })} /></div>
                </div>
              )}

              {/* ΦΙΛΙΚΟΣ BUILDER ΓΙΑ ΤΑ EXTRAS */}
              {activeEditTab === "addons" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-sm text-[#38BDF8] uppercase">Ομάδες Υλικών / Επιλογών</h3>
                    <button onClick={addGroup} className="bg-[#38BDF8] text-[#0B1120] px-4 py-2 rounded-lg font-black text-[10px] uppercase shadow-md">+ Νεα Ομαδα</button>
                  </div>

                  {editForm.extras.map((group, gIndex) => (
                    <div key={group.id} className="p-5 bg-gray-800/40 border border-gray-700 rounded-3xl shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <input type="text" placeholder="Όνομα Ομάδας (π.χ. Kød ή Ekstra)" className="p-3 border border-gray-600 rounded-xl bg-gray-900 text-white font-bold outline-none flex-1 mr-4 focus:border-[#38BDF8]" value={group.name} onChange={(e) => updateGroup(group.id, "name", e.target.value)} />
                        <button onClick={() => removeGroup(group.id)} className="w-12 h-12 rounded-xl bg-red-900/30 text-red-500 font-bold shrink-0 hover:bg-red-500 hover:text-white transition-colors">✕</button>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 mb-5 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-300">
                          <input type="radio" checked={group.type === "single"} onChange={() => { updateGroup(group.id, "type", "single"); updateGroup(group.id, "max", 0); }} className="accent-[#38BDF8] w-4 h-4" /> Υποχρεωτικό (Επιλογή 1)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-300">
                          <input type="radio" checked={group.type === "multiple"} onChange={() => updateGroup(group.id, "type", "multiple")} className="accent-[#38BDF8] w-4 h-4" /> Προαιρετικό / Πολλαπλά
                        </label>
                        {group.type === "multiple" && (
                          <div className="flex items-center gap-2 border-l border-gray-700 pl-4 text-xs font-bold text-gray-400">
                            Μέγιστες Επιλογές (0 = Απεριόριστα): 
                            <input type="number" min="0" value={group.max} onChange={(e) => updateGroup(group.id, "max", Number(e.target.value))} className="w-14 p-2 bg-gray-900 border border-gray-600 rounded-lg text-center text-white focus:border-[#38BDF8] outline-none" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        {group.options.map((opt: any, oIndex: number) => (
                          <div key={oIndex} className="flex items-center gap-3 bg-gray-900 p-2 rounded-xl border border-gray-700">
                            <input type="text" placeholder="Όνομα Υλικού (π.χ. Τζατζίκι)" className="flex-1 p-2 text-sm bg-transparent text-white outline-none" value={opt.name} onChange={(e) => updateItem(group.id, oIndex, "name", e.target.value)} />
                            <div className="w-24 flex items-center border border-gray-600 rounded-lg pr-2 bg-gray-800">
                              <input type="number" placeholder="0" className="w-full bg-transparent text-[#38BDF8] text-center font-bold p-2 text-sm outline-none" value={opt.price} onChange={(e) => updateItem(group.id, oIndex, "price", Number(e.target.value))} />
                              <span className="text-[10px] font-black text-gray-500">DKK</span>
                            </div>
                            <button onClick={() => removeItem(group.id, oIndex)} className="text-gray-500 hover:text-red-500 font-bold px-3">✕</button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addItem(group.id)} className="w-full py-3 bg-gray-900/50 text-[#38BDF8] rounded-xl font-black text-[10px] uppercase border border-gray-700 hover:bg-gray-800 transition-colors">+ Προσθηκη Υλικου</button>
                    </div>
                  ))}
                  
                  {editForm.extras.length === 0 && (
                    <div className="text-center p-10 border-2 border-dashed border-gray-700 rounded-3xl text-gray-500 font-bold">
                      Δεν υπάρχουν υλικά/επιλογές για αυτό το πιάτο.<br/>Πατήστε "+ Νέα Ομάδα" για να προσθέσετε (π.χ. Κρέας, Σως).
                    </div>
                  )}
                </div>
              )}

              {activeEditTab === "trans" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3"><span className="text-[10px] font-black text-gray-500 uppercase">🇬🇧 Αγγλικά</span><input type="text" placeholder="Title EN" className="w-full p-4 rounded-xl bg-gray-800 border-gray-700 text-white" value={editForm.title_en} onChange={(e) => setEditForm({ ...editForm, title_en: e.target.value })} /><textarea placeholder="Description EN" rows={3} className="w-full p-4 rounded-xl bg-gray-800 border-gray-700 text-white resize-none" value={editForm.desc_en} onChange={(e) => setEditForm({ ...editForm, desc_en: e.target.value })} /></div>
                  <div className="space-y-3"><span className="text-[10px] font-black text-gray-500 uppercase">🇬🇷 Ελληνικά</span><input type="text" placeholder="Title EL" className="w-full p-4 rounded-xl bg-gray-800 border-gray-700 text-white" value={editForm.title_el} onChange={(e) => setEditForm({ ...editForm, title_el: e.target.value })} /><textarea placeholder="Description EL" rows={3} className="w-full p-4 rounded-xl bg-gray-800 border-gray-700 text-white resize-none" value={editForm.desc_el} onChange={(e) => setEditForm({ ...editForm, desc_el: e.target.value })} /></div>
                </div>
              )}
            </div>

            <div className="shrink-0 p-5 border-t border-gray-800 bg-gray-900 flex gap-3">
              <button onClick={saveEdit} className="flex-[2] bg-emerald-500 text-white py-4 rounded-xl font-black text-sm uppercase">ΑΠΟΘΗΚΕΥΣΗ</button>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="flex-1 bg-gray-800 text-gray-400 py-4 rounded-xl font-black text-sm uppercase hover:text-white">ΑΚΥΡΩΣΗ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
