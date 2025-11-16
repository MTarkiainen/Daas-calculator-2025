import path from 'path';
// FIX: Import loadEnv to read .env files and make them available to the define plugin.
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// FIX: Use function form of defineConfig to access mode and load env vars
export default defineConfig(({ mode }) => {
  // Load all env vars from .env file, not just VITE_ prefixed
  // FIX: Replaced `process.cwd()` with `path.resolve('.')` to resolve the TypeScript error "Property 'cwd' does not exist on type 'Process'".
  const env = loadEnv(mode, path.resolve('.'), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        // FIX: __dirname is not available in ES modules. 
        // path.resolve('.') resolves to the project root where vite.config.js is located.
        '@': path.resolve('.'),
      }
    },
    // FIX: Define process.env variables for client-side access.
    // This resolves TypeScript errors with import.meta.env and aligns with library guidelines.
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      // As per Gemini guidelines, the API key should be available on process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_GEMINI_API_KEY),
    }
  };
});
