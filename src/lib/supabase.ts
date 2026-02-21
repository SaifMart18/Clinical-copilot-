import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use import.meta.env for Vite client-side environment variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (supabaseInstance) return supabaseInstance;

  // Fallback check to prevent crash if variables are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration is missing. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    // We return a placeholder client that will fail on calls but won't crash the app on load
    return createClient('https://placeholder.supabase.co', 'placeholder');
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    return createClient('https://placeholder.supabase.co', 'placeholder');
  }
  
  return supabaseInstance;
};

// Proxy object for backward compatibility and lazy initialization
export const supabase = {
  auth: {
    getSession: () => getSupabase().auth.getSession(),
    onAuthStateChange: (callback: any) => getSupabase().auth.onAuthStateChange(callback),
    signInWithPassword: (credentials: any) => getSupabase().auth.signInWithPassword(credentials),
    signUp: (credentials: any) => getSupabase().auth.signUp(credentials),
    signOut: () => getSupabase().auth.signOut(),
  },
  from: (table: string) => getSupabase().from(table),
};
