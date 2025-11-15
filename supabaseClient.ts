import { mockSupabase } from './supabaseMock';

// This file configures the app to use the mock Supabase client,
// allowing it to run completely offline for development purposes.
export const supabase = mockSupabase as any;
