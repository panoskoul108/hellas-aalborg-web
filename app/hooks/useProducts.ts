import { useState, useEffect } from 'react';
import { supabase } from '../app/supabase'; // Βεβαιώσου ότι το path είναι σωστό!

export function useProducts() {
  const [products, setProducts] = useState<any[]>([]);
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

  const handleMoveProduct = async (index: number, direction: number, currentList: any[]) => {
    const items = [...currentList];
    if (direction === -1 && index > 0) {
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
    } else if (direction === 1 && index < items.length - 1) {
      [items[index + 1], items[index]] = [items[index], items[index + 1]];
    } else return;

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

  const handleBulkPriceUpdate = async (bulkCategory: string, bulkPriceChange: number, onComplete: () => void) => {
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
      fetchProducts();
      setIsUploading(false);
      onComplete();
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

  const handleDelete = async (id: number) => {
    if (window.confirm("ΠΡΟΣΟΧΗ: Θέλετε σίγουρα να διαγράψετε αυτό το προϊόν;")) {
      await supabase.from("menu_items").delete().eq("id", id);
      fetchProducts();
    }
  };

  return {
    products,
    isUploading,
    setIsUploading,
    fetchProducts,
    handleMoveProduct,
    handleBulkPriceUpdate,
    handleDuplicate,
    handleDelete
  };
}
