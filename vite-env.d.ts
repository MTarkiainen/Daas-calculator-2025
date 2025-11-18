// By providing explicit definitions for `import.meta.env`, we can resolve
// TypeScript errors without relying on `vite/client` types, which may not be
// resolving correctly in the current environment.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
