import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};

// For backward compatibility with existing imports, but we should move to getSupabase()
export const supabase = {
  auth: {
    getSession: () => getSupabase().auth.getSession(),
    onAuthStateChange: (callback: any) => getSupabase().auth.onAuthStateChange(callback),
    signInWithPassword: (credentials: any) => getSupabase().auth.signInWithPassword(credentials),
    signOut: () => getSupabase().auth.signOut(),
  },
  from: (table: string) => getSupabase().from(table),
};
