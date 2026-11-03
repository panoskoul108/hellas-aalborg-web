'use client';
import React, { useEffect, useState } from "react";
import { supabase } from '../../supabase'; 
import Image from 'next/image';

const SUPABASE_IMAGE_URL = "https://keolpijcsvwsrzkjqtkc.supabase.co/storage/v1/object/public/menu-images/";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("ΟΛΑ"); 
  const [searchQuery, setSearchQuery] = useState("");

  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkPriceChange, setBulkPriceChange] = useState(0);

  // Modal State & Tabs
  const [isAdding, setIsAdding] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState("basic");

  const [editForm, setEditForm] = useState<any>({
    title_da: "", title_en: "", title_el: "",
    desc_da: "", desc_en: "", desc_el: "",
    price_takeaway: 0, price_delivery: 0,
    category: "",
    image_path: "",
    sort_order: 0,
    popular: false,
    vegetarian: false,
    featured: false,
    addons: [], // Το UI δουλεύει με Array για ευκολία
  });
  
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("title_da", { ascending: true });
      
    if (data) setProducts(data);
  };
  
  useEffect(() => {
    fetchProducts();
  }, []);

  // --- ΜΕΤΑΤΡΟΠΕΙΣ JSON (Μετατρέπουν το Array του UI σε Object της Βάσης και αντίστροφα) ---
  const parseExtrasToUI = (dbExtras: any) => {
    if (!dbExtras) return [];
    try {
      const parsed = typeof dbExtras === 'string' ? JSON.parse(dbExtras) : dbExtras;
      return Object.keys(parsed).map(key => {
        const group = parsed[key];
        return {
          id: key,
          name: group.title_da || key,
          name_en: group.title_en || "",
          name_el: group.title_el || "",
          isRequired: group.type === 'single',
          maxSelections: group.max || 1,
          options: (group.options || []).map((opt: any) => ({
            name: opt.label_da || opt.name,
            name_en: opt.label_en || "",
            name_el: opt.label_el || "",
            price: opt.price || 0
          }))
        };
      });
    } catch (e) { return []; }
  };

  const buildExtrasForDB = (uiAddons: any[]) => {
    const extrasObj: Record<string, any> = {};
    uiAddons.forEach(group => {
      const key = group.name || `group_${Date.now()}`;
      extrasObj[key] = {
        title_da: group.name,
        title_en: group.name_en,
        title_el: group.name_el,
        type: group.isRequired ? 'single' : 'multiple',
        max: group.maxSelections,
        options: group.options.map((opt: any) => ({
          name: opt.name.toLowerCase().replace(/\s+/g, '_'), 
          label_da: opt.name,
          label_en: opt.name_en,
          label_el: opt.name_el,
          price: opt.price || 0
        }))
      };
    });
    return extrasObj;
  };

  const handleMoveProduct = async (index: number, direction: number) => {
    if (activeCategory === "ΟΛΑ" || activeCategory === "ΠΡΟΤΕΙΝΟΜΕΝΑ" || searchQuery) return;

    const items = [...filteredProducts];
    if (direction === -1 && index > 0) {
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
    } else if (direction === 1 && index < items.length - 1) {
      [items[index + 1], items[index]] = [items[index], items[index + 1]];
    } else { return; }

    const newProducts = [...products];
    items.forEach((item, newSortOrder) => {
      const pIndex = newProducts.findIndex(p => p.id === item.id);
      if(pIndex !== -1) newProducts[pIndex].sort_order = newSortOrder;
    });
    setProducts(newProducts);

    setIsUploading(true);
    const updates = items.map((p, idx) => supabase.from("menu_items").update({ sort_order: idx }).eq("id", p.id));
    await Promise.all(updates);
    setIsUploading(false);
  };

  const handleBulkPriceUpdate = async () => {
    if (!bulkCategory || bulkPriceChange === 0) return alert("Επιλέξτε κατηγορία και ποσό αλλαγής.");
    if (window.confirm(`Είστε σίγουροι ότι θέλετε να αλλάξετε τις τιμές στην κατηγορία "${bulkCategory}" κατά ${bulkPriceChange > 0 ? '+' : ''}${bulkPriceChange}kr;`)) {
      setIsUploading(true);
      const productsToUpdate = products.filter(p => p.category === bulkCategory);
      const updates = productsToUpdate.map(p => 
        supabase.from("menu_items").update({ 
          price_takeaway: Math.max(0, (p.price_takeaway || 0) + bulkPriceChange),
          price_delivery: Math.max(0, (p.price_delivery || 0) + bulkPriceChange)
        }).eq("id", p.id)
      );
      await Promise.all(updates);
      alert("Οι τιμές ενημερώθηκαν επιτυχώς!");
      setBulkPriceChange(0);
      fetchProducts();
      setIsUploading(false);
    }
  };

  const handleDuplicate = async (product: any) => {
    if (window.confirm(`Να δημιουργηθεί αντίγραφο του "${product.title_da}";`)) {
      const { id, created_at, ...productWithoutId } = product;
      const clonedProduct = {
        ...productWithoutId,
        title_da: `${product.title_da} (Kopi)`,
        title_el: `${product.title_el} (Αντίγραφο)`,
      };
      await supabase.from("menu_items").insert([clonedProduct]);
      fetchProducts();
    }
  };

 const saveEdit = async () => {
    const safeCategory = editForm.category?.trim().toUpperCase() || "ΓΕΝΙΚΑ";
    
    // ΔΙΟΡΘΩΣΗ: Αφαιρούμε το 'id' (και το 'created_at') πριν την αποθήκευση!
    const { id, created_at, addons, ...dbData } = editForm; 
    
    const finalData = { ...dbData, category: safeCategory, extras: buildExtrasForDB(addons) };

    const { error } = await supabase.from("menu_items").update(finalData).eq("id", editingId);
    if (error) alert("Σφάλμα Αποθήκευσης: " + error.message);
    else { setEditingId(null); setIsCustomCategory(false); fetchProducts(); }
  };
  
  const addNewProduct = async () => {
    const safeCategory = editForm.category?.trim().toUpperCase() || "ΓΕΝΙΚΑ";
    const { addons, ...dbData } = editForm;
    const finalData = { ...dbData, category: safeCategory, extras: buildExtrasForDB(addons) };

    const { error } = await supabase.from("menu_items").insert([finalData]);
    if (error) alert("Σφάλμα Προσθήκης: " + error.message);
    else { setIsAdding(false); setIsCustomCategory(false); fetchProducts(); }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("ΠΡΟΣΟΧΗ: Θέλετε σίγουρα να διαγράψετε αυτό το προϊόν;")) {
      await supabase.from("menu_items").delete().eq("id", id);
      fetchProducts();
    }
  };

  const uploadImage = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const fileName = `${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("menu-images").upload(fileName, file);
    if (!error) {
      setEditForm({ ...editForm, image_path: fileName });
    } else { alert("Σφάλμα ανεβάσματος!"); }
    setIsUploading(false);
  };

  // ADDON HELPERS
  const addAddonGroup = () => setEditForm({ ...editForm, addons: [...(editForm.addons || []), { id: Date.now().toString(), name: "", name_en: "", name_el: "", isRequired: false, maxSelections: 1, options: [] }] });
  const removeAddonGroup = (groupId: string) => setEditForm({ ...editForm, addons: editForm.addons.filter((g: any) => g.id !== groupId) });
  const updateAddonGroup = (groupId: string, field: string, value: any) => setEditForm({ ...editForm, addons: editForm.addons.map((g: any) => g.id === groupId ? { ...g, [field]: value } : g) });
  const addAddonOption = (groupId: string) => setEditForm({ ...editForm, addons: editForm.addons.map((g: any) => g.id === groupId ? { ...g, options: [...g.options, { name: "", name_en: "", name_el: "", price: 0 }] } : g) });
  const removeAddonOption = (groupId: string, optionIndex: number) => setEditForm({ ...editForm, addons: editForm.addons.map((g: any) => { if (g.id === groupId) { const newOptions = [...g.options]; newOptions.splice(optionIndex, 1); return { ...g, options: newOptions }; } return g; }) });
  const updateAddonOption = (groupId: string, optionIndex: number, field: string, value: any) => setEditForm({ ...editForm, addons: editForm.addons.map((g: any) => { if (g.id === groupId) { const newOptions = [...g.options]; newOptions[optionIndex][field] = value; return { ...g, options: newOptions }; } return g; }) });

  // --- Κατηγορίες & Φιλτράρισμα ---
  const hasRecommended = products.some(p => p.popular);
  let displayCategories = [...new Set(products.map((p) => p.category))].filter(Boolean);
  if (hasRecommended) displayCategories = ["ΠΡΟΤΕΙΝΟΜΕΝΑ", ...displayCategories];

  const filteredProducts = products.filter(p => {
    let matchCat = false;
    if (activeCategory === "ΟΛΑ") matchCat = true;
    else if (activeCategory === "ΠΡΟΤΕΙΝΟΜΕΝΑ") matchCat = p.popular;
    else matchCat = p.category === activeCategory;

    const matchSearch = (p.title_da || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.title_el || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="min-h-screen bg-[#0B1120] text-gray-200 font-sans">
      
      {/* HEADER (Ενσωματωμένο όπως το είχες στο wrapper) */}
      <header className="bg-[#0F172A] border-b border-white/10 p-4 sticky top-0 z-40 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-black text-white italic tracking-tight">HELLAS AALBORG</h1>
          <p className="text-xs text-[#38BDF8] uppercase tracking-widest font-bold">Διαχείριση Καταλόγου</p>
        </div>
        <a href="/admin" className="bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-slate-700 transition-colors shadow-sm">
          🔙 ΠΙΣΩ ΣΤΟ ΤΑΜΕΙΟ
        </a>
      </header>

      <div className="pt-8 pb-24 px-4 sm:px-8 max-w-6xl mx-auto">
        {/* Controls Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="hidden md:block text-2xl font-black italic uppercase tracking-tighter text-[#38BDF8]">
            ΠΡΟΪΟΝΤΑ & EXTRA
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input type="text" placeholder="Αναζήτηση..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:min-w-[250px] p-3 rounded-2xl font-bold text-sm border-white/10 outline-none bg-slate-900 text-white focus:border-[#38BDF8] border" />
            <button onClick={() => setShowBulkActions(!showBulkActions)} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase shadow-sm transition-colors whitespace-nowrap">
              ⚡ Μαζικες
            </button>
            <button onClick={() => {
                setIsAdding(true); setEditingId(null); setIsCustomCategory(false); setActiveEditTab("basic");
                setEditForm({ title_da: "", title_en: "", title_el: "", desc_da: "", desc_en: "", desc_el: "", price_takeaway: 0, price_delivery: 0, category: (activeCategory !== "ΟΛΑ" && activeCategory !== "ΠΡΟΤΕΙΝΟΜΕΝΑ") ? activeCategory : displayCategories.filter(c => c !== "ΠΡΟΤΕΙΝΟΜΕΝΑ")[0] || "", image_path: "", sort_order: 0, popular: false, vegetarian: false, featured: false, addons: [] });
              }} className="bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg transition-transform active:scale-95 whitespace-nowrap">
              + Νεο Προϊον
            </button>
          </div>
        </div>

        {/* Μαζικές Ενέργειες */}
        {showBulkActions && (
          <div className="mb-8 p-6 rounded-[2rem] border-2 border-dashed bg-purple-900/10 border-purple-900/50 animate-fade-in">
            <h3 className="text-sm font-black uppercase mb-4 text-purple-400">⚡ Εργαλεια Κατηγοριας</h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/3">
                <label className="block text-[10px] font-black uppercase mb-2 text-gray-400">1. Επιλογη Κατηγοριας</label>
                <select className="w-full p-3 rounded-xl font-bold border border-gray-700 bg-gray-800 text-white outline-none" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
                  <option value="" disabled>Επιλέξτε Κατηγορία</option>
                  {displayCategories.filter(c => c !== "ΠΡΟΤΕΙΝΟΜΕΝΑ").map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="w-full md:w-1/3">
                <label className="block text-[10px] font-black uppercase mb-2 text-gray-400">2. Αλλαγη Τιμων (DKK)</label>
                <div className="flex gap-2">
                  <input type="number" step="1" placeholder="+/- 5" value={bulkPriceChange} onChange={(e) => setBulkPriceChange(parseFloat(e.target.value) || 0)} className="w-24 p-2 text-center rounded-lg font-bold border border-gray-700 bg-gray-800 text-white outline-none" />
                  <button onClick={handleBulkPriceUpdate} disabled={isUploading} className="flex-1 bg-[#38BDF8] text-[#0B1120] rounded-lg font-black text-[10px] uppercase transition-transform active:scale-95 disabled:opacity-50">Εφαρμογη</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Tabs */}
        <div className="flex overflow-x-auto gap-3 pb-4 mb-6 border-b border-gray-800 no-scrollbar">
          <button onClick={() => setActiveCategory("ΟΛΑ")} className={`shrink-0 px-6 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-colors ${activeCategory === "ΟΛΑ" ? "bg-white text-black" : "bg-slate-800 text-gray-400 hover:bg-slate-700"}`}>
            ΟΛΑ
          </button>
          {displayCategories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`shrink-0 px-6 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-colors ${activeCategory === cat ? (cat === "ΠΡΟΤΕΙΝΟΜΕΝΑ" ? "bg-yellow-500 text-black" : "bg-white text-black") : "bg-slate-800 text-gray-400 hover:bg-slate-700"}`}>
              {cat === "ΠΡΟΤΕΙΝΟΜΕΝΑ" ? "⭐ ΠΡΟΤΕΙΝΟΜΕΝΑ" : cat}
            </button>
          ))}
        </div>

        {/* Product List */}
        <div className="space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 font-bold uppercase mt-10">Δεν βρέθηκαν προϊόντα.</div>
          ) : (
            filteredProducts.map((p, index) => (
              <div key={p.id} className="border border-slate-800 bg-slate-900/50 p-4 rounded-[2rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {activeCategory !== "ΟΛΑ" && activeCategory !== "ΠΡΟΤΕΙΝΟΜΕΝΑ" && !searchQuery && (
                    <div className="flex flex-col gap-1 mr-2 shrink-0">
                      <button onClick={() => handleMoveProduct(index, -1)} disabled={index === 0 || isUploading} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 border-gray-700 hover:bg-sky-900 text-gray-400 disabled:opacity-30">↑</button>
                      <button onClick={() => handleMoveProduct(index, 1)} disabled={index === filteredProducts.length - 1 || isUploading} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 border-gray-700 hover:bg-sky-900 text-gray-400 disabled:opacity-30">↓</button>
                    </div>
                  )}

                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-slate-800 bg-cover bg-center shadow-inner flex items-center justify-center text-2xl border border-white/5" style={p.image_path ? { backgroundImage: `url(${SUPABASE_IMAGE_URL}${p.image_path})` } : {}}>
                    {!p.image_path && "🍽️"}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black uppercase text-base text-gray-100">{p.title_da}</h3>
                      {p.popular && <span className="text-yellow-500 text-xs" title="Popular">⭐</span>}
                      {p.vegetarian && <span className="text-emerald-500 text-xs" title="Vegetarian">🥬</span>}
                    </div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide mb-1">{p.category}</p>
                    <p className="text-[#38BDF8] font-black text-sm">TAKEAWAY: {p.price_takeaway} kr. <span className="text-gray-600 mx-1">•</span> WOLT: {p.price_delivery} kr.</p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end border-t border-slate-800 sm:border-t-0 pt-3 sm:pt-0 items-center">
                  <button onClick={() => handleDuplicate(p)} className="w-12 h-12 rounded-xl flex items-center justify-center text-lg bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 transition-colors">📋</button>
                  <button onClick={() => { 
                      setEditingId(p.id); setActiveEditTab("basic"); setIsCustomCategory(false);
                      setEditForm({ ...p, addons: parseExtrasToUI(p.extras) }); 
                    }} className="w-12 h-12 rounded-xl flex items-center justify-center text-lg bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 transition-colors">✏️</button>
                  <button onClick={() => handleDelete(p.id)} className="w-12 h-12 rounded-xl flex items-center justify-center text-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- MODAL --- */}
        {(isAdding || editingId) && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => { setIsAdding(false); setEditingId(null); }}>
            <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden bg-slate-900 border border-slate-700" onClick={(e) => e.stopPropagation()}>
              
              {/* Header */}
              <div className="shrink-0 flex justify-between items-center p-6 border-b border-slate-800 bg-[#0F172A]">
                <h3 className="text-xl font-black uppercase italic text-white">{isAdding ? "Νεο Προϊον" : "Επεξεργασια Προϊοντος"}</h3>
                <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 text-gray-400 hover:text-red-500 font-black text-xl border border-slate-700 transition-colors">✕</button>
              </div>

              {/* Tabs */}
              <div className="shrink-0 flex overflow-x-auto border-b border-slate-800 bg-[#0F172A] px-6 pt-4 gap-6 no-scrollbar">
                <button onClick={() => setActiveEditTab("basic")} className={`pb-3 font-black text-[11px] uppercase tracking-widest border-b-4 transition-colors ${activeEditTab === "basic" ? "border-[#38BDF8] text-[#38BDF8]" : "border-transparent text-gray-500 hover:text-gray-300"}`}>ΒΑΣΙΚΑ & ΤΙΜΕΣ</button>
                <button onClick={() => setActiveEditTab("addons")} className={`pb-3 font-black text-[11px] uppercase tracking-widest border-b-4 transition-colors ${activeEditTab === "addons" ? "border-[#38BDF8] text-[#38BDF8]" : "border-transparent text-gray-500 hover:text-gray-300"}`}>ΕΠΙΛΟΓΕΣ (ADD-ONS)</button>
                <button onClick={() => setActiveEditTab("translations")} className={`pb-3 font-black text-[11px] uppercase tracking-widest border-b-4 transition-colors ${activeEditTab === "translations" ? "border-[#38BDF8] text-[#38BDF8]" : "border-transparent text-gray-500 hover:text-gray-300"}`}>ΜΕΤΑΦΡΑΣΕΙΣ</button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {activeEditTab === "basic" && (
                  <div className="flex flex-col md:flex-row gap-6 animate-fade-in">
                    <div className="flex flex-col items-center justify-center w-full md:w-48 h-48 border-2 border-dashed rounded-3xl relative transition-colors border-slate-600 bg-slate-800">
                      {editForm.image_path ? (
                        <div className="relative w-full h-full p-2">
                          <img src={`${SUPABASE_IMAGE_URL}${editForm.image_path}`} alt="Preview" className="w-full h-full object-cover rounded-2xl shadow-md" />
                          <button onClick={() => setEditForm({ ...editForm, image_path: "" })} className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full font-bold shadow-lg">✕</button>
                        </div>
                      ) : (
                        <>
                          <span className="text-4xl mb-2">📷</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Ανέβασμα</span>
                          <input type="file" accept="image/*" onChange={uploadImage} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </>
                      )}
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Ονομασια (Δανεζικα - Βασικη)</label>
                        <input type="text" placeholder="π.χ. Gyros Pita" className="w-full p-4 rounded-xl font-black text-sm border-slate-700 bg-slate-800 text-white outline-none focus:border-[#38BDF8] border" value={editForm.title_da} onChange={(e) => setEditForm({ ...editForm, title_da: e.target.value })} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Τιμη Takeaway (DKK)</label>
                          <input type="number" className="w-full border-slate-700 bg-slate-800 text-white p-4 rounded-xl font-black text-lg outline-none focus:border-[#38BDF8] border" value={editForm.price_takeaway} onChange={(e) => setEditForm({ ...editForm, price_takeaway: parseFloat(e.target.value) })} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Τιμη Delivery/Wolt (DKK)</label>
                          <input type="number" className="w-full border-slate-700 bg-slate-800 text-white p-4 rounded-xl font-black text-lg outline-none focus:border-[#38BDF8] border" value={editForm.price_delivery} onChange={(e) => setEditForm({ ...editForm, price_delivery: parseFloat(e.target.value) })} />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Περιγραφη (Δανεζικα)</label>
                        <textarea rows={2} placeholder="Svinekød gyros..." className="w-full p-3.5 rounded-xl font-medium border-slate-700 bg-slate-800 text-white text-xs outline-none focus:border-[#38BDF8] border resize-none" value={editForm.desc_da || ""} onChange={(e) => setEditForm({ ...editForm, desc_da: e.target.value })} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Κατηγορια</label>
                          {!isCustomCategory ? (
                            <select className="w-full border-slate-700 bg-slate-800 text-white p-3 rounded-xl font-bold text-sm outline-none focus:border-[#38BDF8] border" value={editForm.category} onChange={(e) => {
                                if (e.target.value === "NEW_CATEGORY") { setIsCustomCategory(true); setEditForm({ ...editForm, category: "" }); } 
                                else setEditForm({ ...editForm, category: e.target.value });
                              }}>
                              <option value="" disabled>Επιλέξτε Κατηγορία...</option>
                              {displayCategories.filter(c => c !== "ΠΡΟΤΕΙΝΟΜΕΝΑ").map(c => <option key={c} value={c}>{c}</option>)}
                              <option value="NEW_CATEGORY" className="font-black text-[#38BDF8]">➕ ΝΕΑ ΚΑΤΗΓΟΡΙΑ...</option>
                            </select>
                          ) : (
                            <div className="flex gap-2">
                              <input type="text" placeholder="Όνομα Νέας..." className="w-full border-slate-700 bg-slate-800 text-white p-3 rounded-xl font-bold text-sm outline-none focus:border-[#38BDF8] border" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value.toUpperCase() })} autoFocus />
                              <button onClick={() => { setIsCustomCategory(false); setEditForm({ ...editForm, category: displayCategories[0] || "" }); }} className="px-4 rounded-xl border border-slate-600 bg-slate-700 text-gray-400 hover:text-white font-black">✕</button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-300 cursor-pointer"><input type="checkbox" checked={editForm.popular} onChange={(e) => setEditForm({...editForm, popular: e.target.checked})} className="w-4 h-4 rounded bg-slate-800" /> ⭐ Δημοφιλές (Popular)</label>
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-300 cursor-pointer"><input type="checkbox" checked={editForm.vegetarian} onChange={(e) => setEditForm({...editForm, vegetarian: e.target.checked})} className="w-4 h-4 rounded bg-slate-800" /> 🥬 Χορτοφαγικό</label>
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-300 cursor-pointer"><input type="checkbox" checked={editForm.featured} onChange={(e) => setEditForm({...editForm, featured: e.target.checked})} className="w-4 h-4 rounded bg-slate-800" /> 🌟 Μεγάλο (Featured)</label>
                      </div>

                    </div>
                  </div>
                )}

                {activeEditTab === "addons" && (
                  <div className="animate-fade-in space-y-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2 text-[#38BDF8]">
                        <span className="text-xl">🎛️</span> Επιλογες (Add-ons)
                      </h3>
                      <button onClick={addAddonGroup} className="px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-md bg-blue-600 text-white hover:bg-blue-500">
                        + Νεα Ομαδα
                      </button>
                    </div>
                    
                    {(editForm.addons || []).map((group: any, gIndex: number) => (
                      <div key={group.id} className="p-4 sm:p-5 rounded-3xl border-2 shadow-sm bg-slate-800 border-slate-700">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 p-3 rounded-2xl border bg-slate-900 border-slate-700">
                          
                          <div className="w-full flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input type="text" placeholder="DA: Gruppe Navn" className="p-2.5 rounded-xl font-bold border-slate-600 bg-slate-800 text-white text-sm outline-none border" value={group.name} onChange={(e) => updateAddonGroup(group.id, "name", e.target.value)} />
                            <input type="text" placeholder="EN: Group Name" className="p-2.5 rounded-xl font-bold border-slate-600 bg-slate-800 text-white text-sm outline-none border" value={group.name_en || ""} onChange={(e) => updateAddonGroup(group.id, "name_en", e.target.value)} />
                            <input type="text" placeholder="EL: Όνομα Ομάδας" className="p-2.5 rounded-xl font-bold border-slate-600 bg-slate-800 text-white text-sm outline-none border" value={group.name_el || ""} onChange={(e) => updateAddonGroup(group.id, "name_el", e.target.value)} />
                          </div>
                          <button onClick={() => removeAddonGroup(group.id)} className="w-full sm:w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold bg-red-900/30 text-red-500 hover:bg-red-900/50">✕</button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-5 items-start sm:items-center px-2">
                          <label onClick={(e) => { e.preventDefault(); updateAddonGroup(group.id, "isRequired", !group.isRequired); }} className="flex items-center gap-3 text-xs font-black uppercase cursor-pointer text-gray-300">
                            <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${group.isRequired ? 'bg-red-500' : 'bg-gray-600'}`}>
                              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${group.isRequired ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                            Υποχρεωτικη (Single)
                          </label>
                          <div className="flex items-center gap-3 text-xs font-black uppercase border-l-0 sm:border-l pl-0 sm:pl-6 border-gray-700 text-gray-300">
                            <span>Μεγιστες Επιλογες (Max):</span>
                            <input type="number" min="1" value={group.maxSelections} onChange={(e) => updateAddonGroup(group.id, "maxSelections", parseInt(e.target.value))} className="w-16 border-2 rounded-xl p-1.5 text-center outline-none bg-slate-900 border-slate-600 text-white focus:border-[#38BDF8]" />
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          {group.options.map((opt: any, oIndex: number) => (
                            <div key={oIndex} className="flex flex-col sm:flex-row gap-2 items-center p-2 rounded-2xl border transition-colors bg-slate-900/50 border-slate-700 hover:border-[#38BDF8]/50">
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                                <input type="text" placeholder="DA: Valg" className="p-2 rounded-lg font-bold border-b text-xs outline-none bg-transparent border-slate-600 text-white focus:border-[#38BDF8]" value={opt.name} onChange={(e) => updateAddonOption(group.id, oIndex, "name", e.target.value)} />
                                <input type="text" placeholder="EN: Option" className="p-2 rounded-lg font-bold border-b text-xs outline-none bg-transparent border-slate-600 text-white focus:border-[#38BDF8]" value={opt.name_en || ""} onChange={(e) => updateAddonOption(group.id, oIndex, "name_en", e.target.value)} />
                                <input type="text" placeholder="EL: Επιλογή" className="p-2 rounded-lg font-bold border-b text-xs outline-none bg-transparent border-slate-600 text-white focus:border-[#38BDF8]" value={opt.name_el || ""} onChange={(e) => updateAddonOption(group.id, oIndex, "name_el", e.target.value)} />
                              </div>
                              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-3 sm:mt-0 items-center border-slate-700">
                                <div className="flex-1 sm:w-24 shrink-0 flex items-center border-2 rounded-xl pr-2 bg-slate-800 border-slate-600 focus-within:border-[#38BDF8]">
                                  <input type="number" placeholder="0" step="1" className="w-full bg-transparent p-2 text-xs font-black outline-none text-center text-[#38BDF8]" value={opt.price} onChange={(e) => updateAddonOption(group.id, oIndex, "price", parseFloat(e.target.value))} />
                                  <span className="text-gray-400 font-bold text-xs">kr</span>
                                </div>
                                <button onClick={() => removeAddonOption(group.id, oIndex)} className="w-8 h-8 flex items-center justify-center shrink-0 font-bold rounded-lg transition-colors bg-red-900/20 text-red-400 hover:bg-red-900/50 hover:text-red-300">✕</button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => addAddonOption(group.id)} className="w-full sm:w-auto mt-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50">
                          <span className="text-lg leading-none">+</span> Νεα Επιλογη
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {activeEditTab === "translations" && (
                  <div className="p-6 rounded-2xl border animate-fade-in bg-slate-800 border-slate-700">
                    <h3 className="font-black uppercase tracking-widest text-sm mb-6 text-center text-gray-300">Μεταφρασεις Προϊοντος</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase flex items-center gap-2 border-b pb-2 border-gray-700">🇬🇧 Αγγλικα (English)</span>
                        <input type="text" placeholder="Product Name" className="w-full p-3 rounded-xl font-bold border text-sm outline-none bg-slate-900 border-slate-700 text-white focus:border-[#38BDF8]" value={editForm.title_en || ""} onChange={(e) => setEditForm({ ...editForm, title_en: e.target.value })} />
                        <textarea rows={3} placeholder="Description / Ingredients" className="w-full p-3 rounded-xl font-medium border text-xs outline-none resize-none bg-slate-900 border-slate-700 text-white focus:border-[#38BDF8]" value={editForm.desc_en || ""} onChange={(e) => setEditForm({ ...editForm, desc_en: e.target.value })} />
                      </div>
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase flex items-center gap-2 border-b pb-2 border-gray-700">🇬🇷 Ελληνικα (Greek)</span>
                        <input type="text" placeholder="Όνομα Προϊόντος" className="w-full p-3 rounded-xl font-bold border text-sm outline-none bg-slate-900 border-slate-700 text-white focus:border-[#38BDF8]" value={editForm.title_el || ""} onChange={(e) => setEditForm({ ...editForm, title_el: e.target.value })} />
                        <textarea rows={3} placeholder="Συστατικά / Περιγραφή" className="w-full p-3 rounded-xl font-medium border text-xs outline-none resize-none bg-slate-900 border-slate-700 text-white focus:border-[#38BDF8]" value={editForm.desc_el || ""} onChange={(e) => setEditForm({ ...editForm, desc_el: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="shrink-0 p-4 sm:p-6 border-t flex flex-col sm:flex-row gap-3 bg-[#0F172A] border-slate-800">
                <button onClick={isAdding ? addNewProduct : saveEdit} disabled={isUploading} className="flex-1 sm:flex-[2] bg-emerald-500 text-[#0B1120] py-4 rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-50 transition-transform active:scale-95 shadow-lg hover:bg-emerald-400">
                  {isAdding ? "Δημιουργια Προϊοντος" : "Αποθηκευση Αλλαγων"}
                </button>
                <button onClick={() => { setIsAdding(false); setEditingId(null); setIsCustomCategory(false); }} className="flex-1 py-4 rounded-2xl font-black text-sm uppercase transition-colors border bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700">
                  Ακυρωση
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
