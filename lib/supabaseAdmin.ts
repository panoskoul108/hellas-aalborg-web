import { createClient } from '@supabase/supabase-js';

// Βάζουμε "καρφωτό" το URL όπως στο supabase.js για να το βρίσκει πάντα
const supabaseUrl = 'https://keolpijcsvwsrzkjqtkc.supabase.co';

// ΠΡΟΣΟΧΗ: Το Service Role Key ΠΡΕΠΕΙ να μείνει στο process.env για ασφάλεια! 
// Διαβάζεται κατευθείαν από το Vercel.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
