'use client';
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase"; // Προσαρμογή του path 

export default function AdminProducts({ theme }: { theme?: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("ΟΛΑ");
  const [searchQuery, setSearchQuery] = useState("");
  const isDark = theme === "dark" || true; 
  
  const [isAdding, setIsAdding] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState("basic");

  const [editForm, setEditForm] = useState({
    title_da: "", title_en: "", title_el: "",
    desc_da: "", desc_en: "", desc_el: "",
    price_takeaway: 0,
    category: "",
    is_available: true,
    popular: false,
    image_path: "",
    sort_order: 0,
    extras: "{}" // Εδώ θα αποθηκεύεται το JSON ως κείμενο κατά την επεξεργασία
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("title_da", { ascending: true });
      
    if (data) setProducts(data);
    if (error) console.error("Error fetching products:", error);
  };
  
  useEffect(() => {
    fetchProducts();
  }, []);

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

  // Αποθήκευση ή Ενημέρωση (Save) - ΠΡΟΣΑΡΜΟΣΜΕΝΟ ΓΙΑ JSON
  const saveEdit = async () => {
    const safeCategory = editForm.category?.trim().toUpperCase() || "ΓΕΝΙΚΑ";
    
    // Έλεγχος & Μετατροπή του Extras κειμένου σε πραγματικό JSON
    let parsedExtras = null;
    if (editForm.extras && editForm.extras.trim() !== '') {
      try {
        parsedExtras = JSON.parse(editForm.extras);
      } catch (err) {
        alert("Σφάλμα: Το κείμενο στα ΥΛΙΚΑ (EXTRAS JSON) δεν είναι έγκυρο JSON. Ελέγξτε για κόμματα ή εισαγωγικά που λείπουν.");
        return; // Σταματάει την αποθήκευση αν έχει συντακτικό λάθος
      }
    }

    const finalData: any = { ...editForm, category: safeCategory, extras: parsedExtras };
    // Αφαιρούμε το string extras για να πάει σωστά στη βάση
    
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

  // Φιλτράρισμα & Κατηγορίες
  let displayCategories = [...new Set(products.map((p) => p.category))].filter(Boolean);
  
  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === "ΟΛΑ" ? true : p.category === activeCategory;
    const matchSearch = (p.title_da || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.title_en || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto pb-24 px-2 sm:px-4">
      {/* Header Ελέγχου */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-white/10 pb-4">
        <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-[#38BDF8]">
          Διαχείριση Καταλόγου
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Αναζήτηση..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:min-w-[200px] px-4 py-3 rounded-2xl font-bold text-sm bg-gray-800 border border-gray-700 text-white focus:border-[#38BDF8] outline-none"
          />
          <button
            onClick={() => {
              setIsAdding(true); setEditingId(null); setIsCustomCategory(false); setActiveEditTab("basic");
              setEditForm({ title_da: "", title_en: "", title_el: "", desc_da: "", desc_en: "", desc_el: "", price_takeaway: 0, category: displayCategories[0] || "", is_available: true, popular: false, image_path: "", sort_order: 0, extras: "{}" });
            }}
            className="bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] px-5 py-3 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 whitespace-nowrap"
          >
            + Νέο Προϊόν
          </button>
        </div>
      </div>

      {/* Tabs Κατηγοριών */}
      <div className="flex overflow-x-auto gap-2 pb-4 mb-6 no-scrollbar">
        <button onClick={() => setActiveCategory("ΟΛΑ")} className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap ${activeCategory === "ΟΛΑ" ? "bg-white text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>ΟΛΑ</button>
        {displayCategories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase whitespace-nowrap ${activeCategory === cat ? "bg-white text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>{cat}</button>
        ))}
      </div>

      {/* Λίστα Προϊόντων */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center text-gray-500 font-bold uppercase mt-10">Δεν βρέθηκαν προϊόντα.</div>
        ) : (
          filteredProducts.map((p) => (
            <div key={p.id} className={`p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all border ${!p.is_available ? "opacity-60 border-red-900/50 bg-red-900/10" : "bg-gray-800/60 border-gray-700"}`}>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-16 h-16 shrink-0 rounded-2xl bg-gray-900 shadow-inner flex items-center justify-center text-2xl overflow-hidden border border-gray-700">
                  {p.image_path ? <img src={`https://keolpijcsvwsrzkjqtkc.supabase.co/storage/v1/object/public/menu-images/${p.image_path}`} alt="" className="w-full h-full object-cover"/> : "🍽️"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black uppercase text-base text-gray-100 leading-tight">{p.title_da || p.title_el}</h3>
                    {p.popular && <span className="text-yellow-500 text-xs">⭐</span>}
                  </div>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide mb-1">{p.category}</p>
                  <p className="text-[#38BDF8] font-black text-sm">{Number(p.price_takeaway || p.price || 0).toFixed(2)} DKK</p>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto justify-end items-center">
                <div className="flex flex-col items-center mr-2">
                  <span className="text-[8px] font-black uppercase text-gray-400 mb-1">Διαθεσιμο</span>
                  <input type="checkbox" checked={p.is_available} onChange={() => handleToggleAvailable(p)} className="w-5 h-5 accent-green-500 cursor-pointer" />
                </div>
                <button onClick={() => handleTogglePopular(p)} className={`w-12 h-12 rounded-xl text-xl ${p.popular ? "bg-yellow-900/30 text-yellow-500" : "bg-gray-900 text-gray-500"}`}>⭐</button>
                <button 
                  onClick={() => { 
                    setEditingId(p.id); 
                    setActiveEditTab("basic"); 
                    // Φορτώνουμε το JSON στο editForm μετατρέποντάς το σε κείμενο
                    setEditForm({ ...p, extras: typeof p.extras === 'object' ? JSON.stringify(p.extras, null, 2) : p.extras || '{}' }); 
                    setIsCustomCategory(false); 
                  }} 
                  className="w-12 h-12 rounded-xl text-lg bg-blue-900/30 text-blue-400">✏️</button>
                <button onClick={() => handleDelete(p.id)} className="w-12 h-12 rounded-xl text-lg bg-red-900/30 text-red-400">🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL ΕΠΕΞΕΡΓΑΣΙΑΣ */}
      {(isAdding || editingId !== null) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col rounded-[2rem] shadow-2xl overflow-hidden bg-gray-900 border border-gray-700">
            
            <div className="shrink-0 flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900">
              <h3 className="text-xl font-black uppercase italic text-white">{isAdding ? "Νέο Προϊόν" : "Επεξεργασία"}</h3>
              <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="w-10 h-10 rounded-full bg-gray-800 text-gray-500 hover:text-red-500 font-black text-xl">✕</button>
            </div>

            <div className="shrink-0 flex overflow-x-auto border-b border-gray-800 px-6 pt-4 gap-4">
              <button onClick={() => setActiveEditTab("basic")} className={`pb-3 font-black text-xs uppercase tracking-widest border-b-4 ${activeEditTab === "basic" ? "border-[#38BDF8] text-[#38BDF8]" : "border-transparent text-gray-500"}`}>ΒΑΣΙΚΑ & ΤΙΜΗ</button>
              <button onClick={() => setActiveEditTab("addons")} className={`pb-3 font-black text-xs uppercase tracking-widest border-b-4 ${activeEditTab === "addons" ? "border-[#38BDF8] text-[#38BDF8]" : "border-transparent text-gray-500"}`}>ΥΛΙΚΑ (EXTRAS JSON)</button>
              <button onClick={() => setActiveEditTab("trans")} className={`pb-3 font-black text-xs uppercase tracking-widest border-b-4 ${activeEditTab === "trans" ? "border-[#38BDF8] text-[#38BDF8]" : "border-transparent text-gray-500"}`}>ΜΕΤΑΦΡΑΣΕΙΣ</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {activeEditTab === "basic" && (
                <div className="space-y-4">
                  <div><label className="text-[10px] font-black uppercase text-gray-500 mb-2 block">Όνομα (Δανέζικα - Προεπιλογή)</label>
                    <input type="text" className="w-full p-4 rounded-xl font-black text-sm bg-gray-800 border border-gray-700 text-white outline-none focus:border-[#38BDF8]" value={editForm.title_da} onChange={(e) => setEditForm({ ...editForm, title_da: e.target.value })} />
                  </div>
                  <div><label className="text-[10px] font-black uppercase text-gray-500 mb-2 block">Τιμή Takeaway (DKK)</label>
                    <input type="number" className="w-full p-4 rounded-xl font-black text-lg bg-gray-800 border border-gray-700 text-[#38BDF8] outline-none" value={editForm.price_takeaway} onChange={(e) => setEditForm({ ...editForm, price_takeaway: Number(e.target.value) })} />
                  </div>
                  <div><label className="text-[10px] font-black uppercase text-gray-500 mb-2 block">Κατηγορία</label>
                    {!isCustomCategory ? (
                      <select className="w-full p-3 rounded-xl font-bold bg-gray-800 border border-gray-700 text-white outline-none" value={editForm.category} onChange={(e) => { if (e.target.value === "NEW") setIsCustomCategory(true); else setEditForm({ ...editForm, category: e.target.value }); }}>
                        {displayCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="NEW" className="text-[#38BDF8] font-black">+ ΝΕΑ ΚΑΤΗΓΟΡΙΑ</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input type="text" placeholder="Όνομα Κατηγορίας..." className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white uppercase" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value.toUpperCase() })} />
                        <button onClick={() => {setIsCustomCategory(false); setEditForm({...editForm, category: displayCategories[0]});}} className="px-4 bg-gray-700 rounded-xl font-bold text-white">✕</button>
                      </div>
                    )}
                  </div>
                  <div><label className="text-[10px] font-black uppercase text-gray-500 mb-2 block">Όνομα Αρχείου Εικόνας (από Supabase Storage π.χ. burger.png)</label>
                    <input type="text" className="w-full p-3 rounded-xl font-medium text-sm bg-gray-800 border border-gray-700 text-white outline-none" value={editForm.image_path} onChange={(e) => setEditForm({ ...editForm, image_path: e.target.value })} />
                  </div>
                </div>
              )}

              {activeEditTab === "trans" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-gray-500 uppercase">🇬🇧 Αγγλικά</span>
                    <input type="text" placeholder="Title EN" className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white" value={editForm.title_en} onChange={(e) => setEditForm({ ...editForm, title_en: e.target.value })} />
                    <textarea placeholder="Description EN" rows={3} className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white resize-none" value={editForm.desc_en} onChange={(e) => setEditForm({ ...editForm, desc_en: e.target.value })} />
                  </div>
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-gray-500 uppercase">🇬🇷 Ελληνικά</span>
                    <input type="text" placeholder="Title EL" className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white" value={editForm.title_el} onChange={(e) => setEditForm({ ...editForm, title_el: e.target.value })} />
                    <textarea placeholder="Description EL" rows={3} className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white resize-none" value={editForm.desc_el} onChange={(e) => setEditForm({ ...editForm, desc_el: e.target.value })} />
                  </div>
                </div>
              )}

              {activeEditTab === "addons" && (
                <div className="flex flex-col gap-4 h-full">
                  <div className="bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] p-4 rounded-xl text-xs font-bold leading-relaxed">
                    Επικολλήστε εδώ το JSON των Extras (όπως το παράγει η βάση) για να δώσετε επιλογές (Κρέας, Σως κλπ).
                  </div>
                  <textarea
                    value={editForm.extras}
                    onChange={(e) => setEditForm({ ...editForm, extras: e.target.value })}
                    className="w-full h-80 bg-gray-950 border border-gray-700 text-green-400 font-mono text-[11px] p-4 rounded-xl outline-none focus:border-[#38BDF8]"
                    spellCheck="false"
                  />
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
