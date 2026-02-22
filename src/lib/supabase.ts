import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use import.meta.env for Vite client-side environment variables
const getEnv = (key: string): string => {
  try {
    return (import.meta as any).env[key] || '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

let supabaseInstance: SupabaseClient | null = null;

/**
 * Lazy-initializes and returns the Supabase client.
 * This prevents the application from crashing if environment variables are missing at load time.
 */
export const getSupabase = (): SupabaseClient => {
  if (supabaseInstance) return supabaseInstance;

  // Fallback check to prevent crash if variables are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
    // Return a placeholder client that will fail on calls but won't crash the app on load
    // This is critical for preventing the "white screen" issue during deployment/initialization
    return createClient('https://placeholder-project.supabase.co', 'placeholder-key');
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    return createClient('https://placeholder-project.supabase.co', 'placeholder-key');
  }
};

// Export a direct instance for simpler usage
export const supabase = getSupabase();
