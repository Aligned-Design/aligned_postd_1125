export interface MediaAsset {
  id: string;
  brandId: string;
  tenantId: string;
  category: string;
  filename: string;
  originalName?: string;
  mimeType?: string;
  bucketPath?: string;
  size?: number;
  hash?: string;
  thumbnailPath?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  variants?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}
