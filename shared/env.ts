// Environment variable validation and access

// Server-side environment (Node.js)
export const serverEnv = {
  // AI Providers
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  AI_PROVIDER: process.env.AI_PROVIDER || 'auto',
  
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  APP_URL: process.env.VITE_APP_URL || process.env.APP_URL || 'http://localhost:8080',
  
  // Meta (Facebook/Instagram/Threads)
  META_APP_ID: process.env.META_APP_ID || '',
  META_APP_SECRET: process.env.META_APP_SECRET || '',
  META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN || '',
  META_REDIRECT_URI: process.env.META_REDIRECT_URI || '',
  
  // Threads
  THREADS_APP_ID: process.env.THREADS_APP_ID || '',
  THREADS_APP_SECRET: process.env.THREADS_APP_SECRET || '',
  THREADS_REDIRECT_URI: process.env.THREADS_REDIRECT_URI || '',
  
  // LinkedIn
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || '',
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET || '',
  LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI || '',
  
  // X (Twitter)
  X_CLIENT_ID: process.env.X_CLIENT_ID || '',
  X_CLIENT_SECRET: process.env.X_CLIENT_SECRET || '',
  X_API_KEY: process.env.X_API_KEY || '',
  X_API_SECRET: process.env.X_API_SECRET || '',
  X_BEARER_TOKEN: process.env.X_BEARER_TOKEN || '',
  X_REDIRECT_URI: process.env.X_REDIRECT_URI || '',
  
  // TikTok
  TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY || '',
  TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET || '',
  TIKTOK_REDIRECT_URI: process.env.TIKTOK_REDIRECT_URI || '',
  
  // Canva
  CANVA_CLIENT_ID: process.env.CANVA_CLIENT_ID || '',
  CANVA_CLIENT_SECRET: process.env.CANVA_CLIENT_SECRET || '',
  CANVA_REDIRECT_URI: process.env.CANVA_REDIRECT_URI || '',
} as const;

// Client-side environment (Vite)
export const clientEnv = {
  VITE_SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY || '',
  VITE_API_BASE_URL: import.meta.env?.VITE_API_BASE_URL || '/api',
} as const;

// Validation helpers
export function validateServerEnv(): boolean {
  const required = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'] as const;
  const missing = required.filter(key => !serverEnv[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing server environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  // Optional: Warn about missing OAuth credentials (but don't fail)
  const optionalOAuth = [
    'META_APP_ID',
    'LINKEDIN_CLIENT_ID',
    'X_CLIENT_ID',
    'TIKTOK_CLIENT_KEY',
    'CANVA_CLIENT_ID',
  ] as const;
  
  const missingOAuth = optionalOAuth.filter(key => !serverEnv[key]);
  if (missingOAuth.length > 0) {
    console.warn(`Optional OAuth credentials not configured: ${missingOAuth.join(', ')}`);
  }
  
  return true;
}

export function validateClientEnv(): boolean {
  // Client env validation if needed
  return true;
}
