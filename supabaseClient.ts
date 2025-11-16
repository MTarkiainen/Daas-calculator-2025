import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './supabaseMock';

// FIX: Use process.env variables defined in vite.config.ts.
// This resolves the TypeScript error "Property 'env' does not exist on type 'ImportMeta'".
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabase;

// Conditionally initialize Supabase client
if (supabaseUrl && supabaseAnonKey) {
  // Production or configured local environment
  console.log("Connecting to live Supabase project.");
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Local development without .env file
  console.warn(
    "Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) not set. " +
    "Falling back to mock client for local development."
  );
  supabase = mockSupabase;
}

export { supabase };