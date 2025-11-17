import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
