import { useState } from 'react';
import { supabase } from '../app/supabase';

const defaultForm = {
  title_da: "", title_en: "", title_el: "", desc_da: "", desc_en: "", desc_el: "",
  price_takeaway: 0, price_delivery: 0, category: "", image_path: "", sort_order: 0,
  popular: false, vegetarian: false, featured: false, addons: []
};

// ΜΕΤΑΤΡΟΠΕΙΣ JSON
export const parseExtrasToUI = (dbExtras: any) => {
  if (!dbExtras) return [];
  try {
    const parsed = typeof dbExtras === 'string' ? JSON.parse(dbExtras) : dbExtras;
    return Object.keys(parsed).map(key => {
      const group = parsed[key];
      return {
        id: key, name: group.title_da || key, name_en: group.title_en || "", name_el: group.title_el || "",
        isRequired: group.type === 'single', maxSelections: group.max || 1,
        options: (group.options || []).map((opt: any) => ({
          name: opt.label_da || opt.name, name_en: opt.label_en || "", name_el: opt.label_el || "", price: opt.price || 0
        }))
      };
    });
  } catch (e) { return []; }
};

export const buildExtrasForDB = (uiAddons: any[]) => {
  const extrasObj: Record<string, any> = {};
  uiAddons.forEach(group => {
    const key = group.name || `group_${Date.now()}`;
    extrasObj[key] = {
      title_da: group.name, title_en: group.name_en, title_el: group.name_el,
      type: group.isRequired ? 'single' : 'multiple', max: group.maxSelections,
      options: group.options.map((opt: any) => ({
        name: opt.name.toLowerCase().replace(/\s+/g, '_'), 
        label_da: opt.name, label_en: opt.name_en, label_el: opt.name_el, price: opt.price || 0
      }))
    };
  });
  return extrasObj;
};

export function useProductForm(onSuccess: () => void, setIsUploading: (v: boolean) => void) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState("basic");
  const [editForm, setEditForm] = useState<any>(defaultForm);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const resetForm = (categoryStr: string = "") => {
    setIsAdding(true);
    setEditingId(null);
    setIsCustomCategory(false);
    setActiveEditTab("basic");
    setEditForm({ ...defaultForm, category: categoryStr });
  };

  const startEdit = (product: any) => {
    setEditingId(product.id);
    setActiveEditTab("basic");
    setIsCustomCategory(false);
    setEditForm({ ...product, addons: parseExtrasToUI(product.extras) });
  };

  const closeModal = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const saveProduct = async () => {
    const safeCategory = editForm.category?.trim().toUpperCase() || "ΓΕΝΙΚΑ";
    const { id, created_at, addons, ...dbData } = editForm; 
    const finalData = { ...dbData, category: safeCategory, extras: buildExtrasForDB(addons) };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("menu_items").update(finalData).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("menu_items").insert([finalData]));
    }

    if (error) alert("Σφάλμα Αποθήκευσης: " + error.message);
    else { closeModal(); setIsCustomCategory(false); onSuccess(); }
  };

  const uploadImage = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const fileName = `${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("menu-images").upload(fileName, file);
    if (!error) setEditForm({ ...editForm, image_path: fileName });
    else alert("Σφάλμα ανεβάσματος!");
    setIsUploading(false);
  };

  // Addon Helpers
  const addAddonGroup = () => setEditForm({ ...editForm, addons: [...(editForm.addons || []), { id: Date.now().toString(), name: "", name_en: "", name_el: "", isRequired: false, maxSelections: 1, options: [] }] });
  const removeAddonGroup = (groupId: string) => setEditForm({ ...editForm, addons: editForm.addons.filter((g: any) => g.id !== groupId) });
  const updateAddonGroup = (groupId: string, field: string, value: any) => setEditForm({ ...editForm, addons: editForm.addons.map((g: any) => g.id === groupId ? { ...g, [field]: value } : g) });
  const addAddonOption = (groupId: string) => setEditForm({ ...editForm, addons: editForm.addons.map((g: any) => g.id === groupId ? { ...g, options: [...g.options, { name: "", name_en: "", name_el: "", price: 0 }] } : g) });
  const removeAddonOption = (groupId: string, optionIndex: number) => setEditForm({ ...editForm, addons: editForm.addons.map((g: any) => { if (g.id === groupId) { const newOptions = [...g.options]; newOptions.splice(optionIndex, 1); return { ...g, options: newOptions }; } return g; }) });
  const updateAddonOption = (groupId: string, optionIndex: number, field: string, value: any) => setEditForm({ ...editForm, addons: editForm.addons.map((g: any) => { if (g.id === groupId) { const newOptions = [...g.options]; newOptions[optionIndex][field] = value; return { ...g, options: newOptions }; } return g; }) });

  return {
    editingId, isAdding, activeEditTab, setActiveEditTab, editForm, setEditForm,
    isCustomCategory, setIsCustomCategory, resetForm, startEdit, closeModal, saveProduct, uploadImage,
    addAddonGroup, removeAddonGroup, updateAddonGroup, addAddonOption, removeAddonOption, updateAddonOption
  };
}
