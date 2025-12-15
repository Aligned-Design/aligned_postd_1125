/// <reference types="vite/client" />

/**
 * Vite environment variable type definitions
 * 
 * Extends ImportMetaEnv with our custom build metadata variables
 */
interface ImportMetaEnv {
  readonly VITE_GIT_SHA?: string;
  readonly VITE_GIT_SHORT_SHA?: string;
  readonly VITE_BUILD_TIME?: string;
  readonly VITE_BUILD_ID?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
