import { supabase } from './supabase';
import { MediaCategory, MediaAsset } from '@shared/media';

export async function ensureBrandStorage(tenantId: string, _brandId: string): Promise<string> {
  const bucketName = `tenant-${tenantId}`;
  
  // Check if bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  
  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: false,
      allowedMimeTypes: ['image/*', 'video/*', 'application/pdf'],
      fileSizeLimit: 100 * 1024 * 1024 // 100MB
    });
    
    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`);
    }
  }
  
  return bucketName;
}

export function generateAssetPath(
  tenantId: string, 
  brandId: string, 
  category: MediaCategory, 
  filename: string
): string {
  const timestamp = Date.now();
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${brandId}/${category}/${timestamp}-${cleanFilename}`;
}

export function generateVariantPath(
  basePath: string, 
  variant: string, 
  purpose?: string
): string {
  const pathParts = basePath.split('/');
  const filename = pathParts.pop()!;
  const category = pathParts.pop()!;
  const brandId = pathParts.pop()!;
  
  const purposeSuffix = purpose ? `_${purpose}` : '';
  return `${brandId}/${category}/variants/${variant}${purposeSuffix}/${filename}`;
}

export async function uploadAssetWithVariants(
  bucketName: string,
  assetPath: string,
  fileBuffer: Buffer,
  variants: { buffer: Buffer; path: string; mimeType: string }[],
  mimeType: string
): Promise<void> {
  // Upload original file
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(assetPath, fileBuffer, {
      contentType: mimeType,
      cacheControl: '31536000', // 1 year
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Failed to upload original: ${uploadError.message}`);
  }

  // Upload variants
  for (const variant of variants) {
    const { error: variantError } = await supabase.storage
      .from(bucketName)
      .upload(variant.path, variant.buffer, {
        contentType: variant.mimeType,
        cacheControl: '31536000',
        upsert: false
      });

    if (variantError) {
      console.warn(`Failed to upload variant ${variant.path}:`, variantError.message);
    }
  }
}

export async function deleteAssetWithVariants(
  bucketName: string,
  asset: MediaAsset
): Promise<void> {
  const pathsToDelete = [
    asset.bucketPath,
    ...(asset.variants?.map(v => v.path) || [])
  ];

  if (asset.thumbnailPath) pathsToDelete.push(asset.thumbnailPath);

  const { error } = await supabase.storage
    .from(bucketName)
    .remove(pathsToDelete);

  if (error) {
    console.warn('Failed to delete some asset files:', error.message);
  }
}

export async function checkDuplicate(
  _bucketName: string,
  _hash: string,
  _brandId: string
): Promise<MediaAsset | null> {
  // In a real implementation, this would query a database
  // For now, return null (no duplicate found)
  return null;
}

export async function getSignedUrl(
  bucketName: string,
  assetPath: string,
  expiresIn = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(assetPath, expiresIn);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

export async function getCategoryUsage(
  bucketName: string,
  brandId: string
): Promise<Record<MediaCategory, { count: number; size: number }>> {
  const usage: Record<MediaCategory, { count: number; size: number }> = {
    graphics: { count: 0, size: 0 },
    images: { count: 0, size: 0 },
    logos: { count: 0, size: 0 },
    videos: { count: 0, size: 0 },
    ai_exports: { count: 0, size: 0 },
    client_uploads: { count: 0, size: 0 }
  };

  // List files by category
  for (const category of Object.keys(usage) as MediaCategory[]) {
    try {
      const { data: files, error } = await supabase.storage
        .from(bucketName)
        .list(`${brandId}/${category}`, { limit: 1000 });

      if (!error && files) {
        usage[category].count = files.length;
        usage[category].size = files.reduce(
          (sum, file) => sum + (file.metadata?.size || 0), 
          0
        );
      }
    } catch (error) {
      console.warn(`Failed to get usage for category ${category}:`, error);
    }
  }

  return usage;
}
