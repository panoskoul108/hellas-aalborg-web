import { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import { updateMenuItemAdmin, deleteMenuItemAdmin, insertMenuItemAdmin, bulkUpdateMenuSortOrderAdmin } from '@/app/actions/storeActions';

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
    const updatesForDb: {id: number, sort_order: number}[] = [];

    items.forEach((item, newSortOrder) => {
      const pIndex = newProducts.findIndex(p => p.id === item.id);
      if(pIndex !== -1) {
        newProducts[pIndex].sort_order = newSortOrder;
        updatesForDb.push({ id: item.id, sort_order: newSortOrder });
      }
    });
    
    // Αισιόδοξη ενημέρωση UI
    setProducts(newProducts);

    setIsUploading(true);
    try {
      await bulkUpdateMenuSortOrderAdmin(updatesForDb);
    } catch (error: any) {
      alert("Σφάλμα κατά την αλλαγή σειράς (RLS/Action).");
      console.error(error);
      fetchProducts(); // Επαναφορά
    }
    setIsUploading(false);
  };

  const handleBulkPriceUpdate = async (bulkCategory: string, bulkPriceChange: number, onComplete: () => void) => {
    if (!bulkCategory || bulkPriceChange === 0) return alert("Επιλέξτε κατηγορία και ποσό αλλαγής.");
    if (window.confirm(`Είστε σίγουροι ότι θέλετε να αλλάξετε τις τιμές στην κατηγορία "${bulkCategory}" κατά ${bulkPriceChange > 0 ? '+' : ''}${bulkPriceChange}kr;`)) {
      setIsUploading(true);
      const productsToUpdate = products.filter(p => p.category === bulkCategory);
      
      try {
        const updatePromises = productsToUpdate.map(p => 
          updateMenuItemAdmin(p.id, { 
            price_takeaway: Math.max(0, (p.price_takeaway || 0) + bulkPriceChange),
            price_delivery: Math.max(0, (p.price_delivery || 0) + bulkPriceChange)
          })
        );
        await Promise.all(updatePromises);
        alert("Οι τιμές ενημερώθηκαν επιτυχώς!");
        fetchProducts();
      } catch (error: any) {
        alert("Σφάλμα (Action): " + error.message);
      }
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
      
      try {
        await insertMenuItemAdmin(clonedProduct);
        fetchProducts();
      } catch (error: any) {
        alert("Σφάλμα Αντιγραφής: " + error.message);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("ΠΡΟΣΟΧΗ: Θέλετε σίγουρα να διαγράψετε αυτό το προϊόν;")) {
      try {
        await deleteMenuItemAdmin(id);
        fetchProducts();
      } catch (error: any) {
        alert("Σφάλμα Διαγραφής: " + error.message);
      }
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
