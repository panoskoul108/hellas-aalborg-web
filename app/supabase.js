import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://keolpijcsvwsrzkjqtkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlb2xwaWpjc3Z3c3J6a2pxdGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0OTk0NzMsImV4cCI6MjEwMzA3NTQ3M30.yrxVzfswzX653cgYaZ5Kq1HBTmYyjjD64GB9oFhJXzc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
