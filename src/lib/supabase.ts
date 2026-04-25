import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL && typeof window !== 'undefined') {
  console.warn('VITE_SUPABASE_URL is missing. Please configure Supabase in your secrets.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
