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
