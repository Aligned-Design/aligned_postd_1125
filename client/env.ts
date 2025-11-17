// Environment validation helper
export function validateEnvironment() {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const missing = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:8080',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    analyticsId: import.meta.env.VITE_ANALYTICS_ID,
  };
}

// Validate on module load (only in browser)
if (typeof window !== 'undefined') {
  try {
    validateEnvironment();
  } catch (error) {
    console.warn('Environment validation failed:', error);
  }
}
