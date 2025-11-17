import sharp from 'sharp';
import crypto from 'crypto';
import { MediaVariant } from '@shared/media';

export interface ProcessedMedia {
  metadata: {
    width: number;
    height: number;
    size: number;
    hash: string;
  };
  variants: {
    buffer: Buffer;
    variant: MediaVariant;
  }[];
}

const VARIANT_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 400, height: 400 },
  medium: { width: 800, height: 800 },
  large: { width: 1200, height: 1200 }
} as const;

export async function processMediaFile(
  fileBuffer: Buffer,
  filename: string,
  brandId: string
): Promise<ProcessedMedia> {
  // Get image metadata
  const image = sharp(fileBuffer);
  const metadata = await image.metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error('Invalid image metadata');
  }

  // Generate hash
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  const variants: { buffer: Buffer; variant: MediaVariant }[] = [];

  // Generate variants
  for (const [sizeName, dimensions] of Object.entries(VARIANT_SIZES)) {
    const resized = await image
      .resize(dimensions.width, dimensions.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const resizedMetadata = await sharp(resized).metadata();

    variants.push({
      buffer: resized,
      variant: {
        size: sizeName as keyof typeof VARIANT_SIZES,
        width: resizedMetadata.width!,
        height: resizedMetadata.height!,
        path: `${brandId}/variants/${sizeName}/${filename}`,
        fileSize: resized.length
      }
    });
  }

  return {
    metadata: {
      width: metadata.width,
      height: metadata.height,
      size: fileBuffer.length,
      hash
    },
    variants
  };
}

export function generateAssetPath(brandId: string, filename: string): string {
  const timestamp = Date.now();
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${brandId}/assets/${timestamp}-${cleanFilename}`;
}
