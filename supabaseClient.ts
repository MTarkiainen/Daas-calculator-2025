import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use Vite's standard import.meta.env for environment variables.
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

// A flag to check if config is missing.
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabase: SupabaseClient;

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!);
} else {
  // Create a dummy client to prevent the app from crashing on import.
  // The main App component will render an error message and this client won't be used.
  supabase = createClient('http://dummy-url.com', 'dummy-key');
}

export { supabase, isSupabaseConfigured };
