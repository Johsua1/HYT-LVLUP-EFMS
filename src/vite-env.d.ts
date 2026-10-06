/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Set to "false" to allow right-click / DevTools shortcuts while debugging. */
  readonly VITE_BLOCK_INSPECT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
