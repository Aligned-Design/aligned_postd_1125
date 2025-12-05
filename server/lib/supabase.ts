import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

// ✅ CRITICAL: Check environment variables
// NOTE: Server code should use SUPABASE_URL (not VITE_SUPABASE_URL)
// VITE_* prefix is for client-side code only. Fallback to VITE_SUPABASE_URL
// is kept for backward compatibility but should be removed in future versions.
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  logger.error("SUPABASE_URL (or VITE_SUPABASE_URL fallback) is not set", undefined, {
    endpoint: "supabase_init",
    message: "Auth and database operations will fail. Set SUPABASE_URL in your environment variables (server-side).",
  });
  throw new Error("SUPABASE_URL environment variable is required");
}

if (!supabaseServiceKey) {
  logger.error("SUPABASE_SERVICE_ROLE_KEY is not set", undefined, {
    endpoint: "supabase_init",
    message: "Auth and database operations will fail.",
  });
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

// ✅ CRITICAL: Validate that service role key is actually a service role key
// Decode JWT to check the role (first part is header, second is payload)
try {
  const parts = supabaseServiceKey.split('.');
  if (parts.length === 3) {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (payload.role !== 'service_role') {
      logger.error("SUPABASE_SERVICE_ROLE_KEY has wrong role", undefined, {
        endpoint: "supabase_init",
        expectedRole: "service_role",
        actualRole: payload.role,
        message: "This key appears to be an ANON key, not a SERVICE_ROLE key! Your keys may be swapped. Check FIX_SUPABASE_KEYS.md. Auth operations will FAIL until this is fixed!",
      });
      // Don't throw - allow startup but warn heavily
    } else {
      logger.info("Service role key validated", {
        endpoint: "supabase_init",
        role: "service_role",
      });
    }
  }
} catch (e) {
  logger.warn("Could not validate service role key format (continuing anyway)", {
    endpoint: "supabase_init",
    error: e instanceof Error ? e.message : String(e),
  });
}

// ✅ Log Supabase connection (without exposing keys)
logger.info("Supabase initialized", {
  endpoint: "supabase_init",
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  keyLength: supabaseServiceKey?.length || 0,
});

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function ensureBrandBucket(brandId: string): Promise<string> {
  const bucketName = `brand-${brandId}`;
  
  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  
  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: false,
      allowedMimeTypes: ['image/*', 'video/*'],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    });
    
    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }
  }
  
  return bucketName;
}
