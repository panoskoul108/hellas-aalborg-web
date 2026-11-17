'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function updateStoreHours(hoursData: any) {
  const { data, error } = await supabaseAdmin
    .from('store_hours')
    .update(hoursData)
    .eq('id', hoursData.id);

  if (error) throw new Error(error.message);
  return data;
}
export async function updateStoreSettings(settingsData: any) {
  const { data, error } = await supabaseAdmin
    .from('store_settings')
    .upsert(settingsData)
    .select();

  if (error) throw new Error(error.message);
  return data;
}
