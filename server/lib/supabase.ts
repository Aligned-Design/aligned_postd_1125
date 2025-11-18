import { createClient } from '@supabase/supabase-js';

// ✅ CRITICAL: Check environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("[Supabase] ❌ CRITICAL: SUPABASE_URL or VITE_SUPABASE_URL is not set!");
  console.error("[Supabase] Auth and database operations will fail.");
  throw new Error("SUPABASE_URL environment variable is required");
}

if (!supabaseServiceKey) {
  console.error("[Supabase] ❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set!");
  console.error("[Supabase] Auth and database operations will fail.");
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

// ✅ CRITICAL: Validate that service role key is actually a service role key
// Decode JWT to check the role (first part is header, second is payload)
try {
  const parts = supabaseServiceKey.split('.');
  if (parts.length === 3) {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (payload.role !== 'service_role') {
      console.error("[Supabase] ❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY has wrong role!");
      console.error(`[Supabase] Expected role: 'service_role', Got: '${payload.role}'`);
      console.error("[Supabase] This key appears to be an ANON key, not a SERVICE_ROLE key!");
      console.error("[Supabase] Your keys may be swapped. Check FIX_SUPABASE_KEYS.md");
      console.error("[Supabase] Auth operations will FAIL until this is fixed!");
      // Don't throw - allow startup but warn heavily
    } else {
      console.log("[Supabase] ✅ Service role key validated (role: service_role)");
    }
  }
} catch (e) {
  console.warn("[Supabase] Could not validate service role key format (continuing anyway)");
}

// ✅ Log Supabase connection (without exposing keys)
console.log("[Supabase] ✅ Initialized", {
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  keyLength: supabaseServiceKey?.length || 0,
});

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
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
