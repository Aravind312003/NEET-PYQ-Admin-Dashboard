import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const useSupabase = !!(supabaseUrl && supabaseKey);
export const supabase = useSupabase ? createClient(supabaseUrl!, supabaseKey!) : null;

if (useSupabase) {
  console.log('[SYSTEM] Supabase integration initialized successfully from db directory!');
} else {
  console.log('[SYSTEM] Supabase credentials unconfigured in db directory.');
}
