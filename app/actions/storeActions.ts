'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function updateStoreHours(hoursData: any) {
  // Απομονώνουμε μόνο τα πεδία που μας έστειλε το Admin Panel
  const updateData: any = {};
  if (hoursData.open_time !== undefined) updateData.open_time = hoursData.open_time;
  if (hoursData.close_time !== undefined) updateData.close_time = hoursData.close_time;
  if (hoursData.is_closed !== undefined) updateData.is_closed = hoursData.is_closed;

  // ΒΑΣΙΚΟ: Ενημερώνουμε με βάση το day_of_week (π.χ. 1 για Δευτέρα)
  const { data, error } = await supabaseAdmin
    .from('store_hours')
    .update(updateData)
    .eq('day_of_week', hoursData.day_of_week);

  if (error) {
    console.error("Supabase Error (StoreHours):", error);
    throw new Error(error.message);
  }
  return data;
}

export async function updateStoreSettings(settingsData: any) {
  // Αυτό αναλαμβάνει το Loyalty και το Pause του καταστήματος
  const { data, error } = await supabaseAdmin
    .from('store_settings')
    .update(settingsData)
    .eq('id', 1) // Το store_settings έχει πάντα id = 1
    .select();

  if (error) {
    console.error("Supabase Error (StoreSettings):", error);
    throw new Error(error.message);
  }
  return data;
}
export async function deleteSupportChat(orderId: number) {
  const { data, error } = await supabaseAdmin
    .from('support_chats')
    .delete()
    .eq('order_id', orderId);

  if (error) {
    console.error("Supabase Error (Delete Chat):", error);
    throw new Error(error.message);
  }
  return data;
}

export async function updateOrderAdmin(orderId: number, updateData: any) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (error) throw new Error(error.message);
  return data;
}

export async function rollbackOrderLoyaltyAdmin(payload: any) {
  const { data, error } = await supabaseAdmin.rpc('rollback_order_loyalty', payload);
  if (error) throw new Error(error.message);
  return data;
}

export async function insertSupportChatAdmin(chatData: any) {
  const { data, error } = await supabaseAdmin.from('support_chats').insert([chatData]);
  if (error) throw new Error(error.message);
  return data;
}

export async function updateProductAvailability(productId: number, isAvailable: boolean) {
  const { data, error } = await supabaseAdmin
    .from('menu_items') // Βάλε το σωστό όνομα του πίνακα αν διαφέρει (π.χ. 'products')
    .update({ is_available: isAvailable })
    .eq('id', productId);

  if (error) {
    console.error("Supabase Error (Update Product):", error);
    throw new Error(error.message);
  }
  return data;
}

// ΝΕΑ ACTIONS ΓΙΑ ΤΑ ΠΡΟΪΟΝΤΑ ΚΑΙ ΤΟΝ ΚΑΤΑΛΟΓΟ
export async function insertMenuItemAdmin(itemData: any) {
  const { data, error } = await supabaseAdmin.from('menu_items').insert([itemData]).select();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateMenuItemAdmin(itemId: number, updateData: any) {
  const { data, error } = await supabaseAdmin.from('menu_items').update(updateData).eq('id', itemId).select();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMenuItemAdmin(itemId: number) {
  const { data, error } = await supabaseAdmin.from('menu_items').delete().eq('id', itemId);
  if (error) throw new Error(error.message);
  return data;
}

export async function bulkUpdateMenuSortOrderAdmin(updates: {id: number, sort_order: number}[]) {
  // Εκτελούμε τα updates παράλληλα μέσω Promise.all
  const updatePromises = updates.map(update => 
    supabaseAdmin.from('menu_items').update({ sort_order: update.sort_order }).eq('id', update.id)
  );
  
  const results = await Promise.all(updatePromises);
  // Ελέγχουμε αν κάποιο απέτυχε
  const failed = results.find(res => res.error);
  if (failed && failed.error) throw new Error(failed.error.message);
  
  return true;
}

export async function uploadReceiptAdmin(formData: FormData) {
  const file = formData.get('file') as File;
  const fileName = formData.get('fileName') as string;
  
  if (!file || !fileName) {
    throw new Error("Missing file or fileName");
  }

  // Το Service Role Key επιτρέπει το ανέβασμα ακόμα και σε Private bucket
  const { data, error } = await supabaseAdmin
    .storage
    .from('receipts')
    .upload(fileName, file);

  if (error) {
    console.error("Supabase Error (Upload Receipt):", error);
    throw new Error(error.message);
  }
  
  return data;
}

// Server Action για δημιουργία "Προσωρινού" URL (για να βλέπεις την απόδειξη με ασφάλεια)
export async function getReceiptUrlAdmin(fileName: string) {
   // Δημιουργεί ένα link που λήγει σε 60 δευτερόλεπτα (μόνο εσύ προλαβαίνεις να το δεις)
   const { data, error } = await supabaseAdmin
    .storage
    .from('receipts')
    .createSignedUrl(fileName, 60);
    
   if (error) throw new Error(error.message);
   return data.signedUrl;
}

// === PUSH NOTIFICATIONS ΓΙΑ ΤΟ ΚΙΝΗΤΟ ΤΟΥ ΚΑΤΑΣΤΗΜΑΤΟΣ ===
export async function saveAdminPushSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}, deviceLabel = 'Shop Mobile') {
  const { error } = await supabaseAdmin
    .from('admin_push_subscriptions')
    .upsert(
      {
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        device_label: deviceLabel,
      },
      { onConflict: 'endpoint' }
    );

  if (error) {
    console.error('Supabase Error (Save Push Sub):', error);
    throw new Error(error.message);
  }
  return { success: true };
}

export async function removeAdminPushSubscription(endpoint: string) {
  const { error } = await supabaseAdmin
    .from('admin_push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);

  if (error) {
    console.error('Supabase Error (Remove Push Sub):', error);
    throw new Error(error.message);
  }
  return { success: true };
}
