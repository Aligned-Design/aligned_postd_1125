export type MediaCategory = 'graphics' | 'images' | 'logos' | 'videos' | 'ai_exports' | 'client_uploads';

export interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  category: MediaCategory;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  hash: string;
  tags: string[];
  brandId: string;
  tenantId: string;
  bucketPath: string;
  thumbnailPath?: string;
  variants: MediaVariant[];
  metadata: MediaMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface MediaVariant {
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
  width: number;
  height: number;
  path: string;
  fileSize: number;
}

export interface MediaMetadata {
  // EXIF (core technical data we keep)
  width: number;
  height: number;
  orientation?: number;
  captureDate?: string;
  cameraModel?: string;
  colorSpace?: string;

  // IPTC (SEO and ownership data we keep)
  title?: string;
  caption?: string;
  keywords: string[];
  copyright?: string;
  creator?: string;

  // XMP (color profile data we keep)
  iccProfile?: string;

  // Video-specific metadata
  duration?: number; // seconds
  frameRate?: number;

  // AI-generated tags and analysis
  aiTags: string[];
  detectedSubjects?: string[];
  hasText?: boolean;
  dominantColors?: string[];

  // Usage tracking
  usedIn: string[]; // ["post:123", "email:456", "website:789"]
  lastUsed?: string;
  usageCount: number;
}

export interface MediaUploadProgress {
  id: string;
  filename: string;
  category?: MediaCategory;
  progress: number;
  status: 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error';
  error?: string;
  stage?: string; // "Extracting metadata", "Generating thumbnails", etc.
}

export interface MediaUploadRequest {
  brandId: string;
  tenantId: string;
  category?: MediaCategory; // auto-detect if not provided
  tags?: string[];
  generateVariants?: boolean;
  optimizeForSEO?: boolean;
  preserveLocation?: boolean; // for local businesses
}

export interface MediaUploadResponse {
  success: boolean;
  asset?: MediaAsset;
  uploadId: string;
  error?: string;
  warnings?: string[]; // e.g., "GPS data stripped for privacy"
}

export interface MediaListRequest {
  brandId: string;
  category?: MediaCategory;
  tags?: string[];
  mimeType?: string;
  used?: boolean; // filter by usage status
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: 'created' | 'name' | 'size' | 'usage';
  sortOrder?: 'asc' | 'desc';
}

export interface MediaListResponse {
  assets: MediaAsset[];
  total: number;
  hasMore: boolean;
  categories: Record<MediaCategory, number>; // count per category
}

export interface StorageUsageResponse {
  brandId: string;
  totalSize: number;
  assetCount: number;
  bucketName: string;
  categoryBreakdown: Record<MediaCategory, {
    count: number;
    size: number;
  }>;
  lastUpdated: string;
}

export interface DuplicateCheckResponse {
  isDuplicate: boolean;
  existingAsset?: MediaAsset;
  similarity?: number; // 0-1 score
}

export interface SEOMetadataRequest {
  assetId: string;
  context?: 'web' | 'google_business' | 'social';
  targetKeywords?: string[];
}

export interface SEOMetadataResponse {
  altText: string;
  title: string;
  description: string;
  keywords: string[];
  optimizedMetadata: Partial<MediaMetadata>;
}

export interface AssetUsageRequest {
  assetId: string;
  usedIn: string; // "post:123", "email:456", etc.
  context?: string;
}
