import { z } from "zod";

export const PlatformConnectionRecordSchema = z.object({
  id: z.string(),
  brand_id: z.string(),
  platform: z.string(),
  account_id: z.string(),
  account_name: z.string().nullable().optional(),
  access_token: z.string(),
  refresh_token: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean(),
  status: z.string(),
  last_sync_at: z.string().nullable().optional(),
  next_sync_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  disconnected_at: z.string().nullable().optional(),
});

export type PlatformConnection = z.infer<typeof PlatformConnectionRecordSchema>;

export const MediaAssetRowSchema = z.object({
  id: z.string(),
  brand_id: z.string(),
  tenant_id: z.string(),
  category: z.string(),
  filename: z.string(),
  mime_type: z.string(),
  path: z.string(),
  file_size: z.number().optional(),
  hash: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  variants: z.array(z.any()).nullable().optional(),
  used_in: z.array(z.string()).nullable().optional(),
  usage_count: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type MediaAssetRow = z.infer<typeof MediaAssetRowSchema>;

export const PublishingJobRowSchema = z.object({
  id: z.string(),
  brand_id: z.string(),
  tenant_id: z.string(),
  platforms: z.array(z.string()).optional(),
  status: z.string().optional(),
  scheduled_at: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  content: z.any().optional(),
  validation_results: z.array(z.any()).optional(),
  retry_count: z.number().optional(),
  max_retries: z.number().optional(),
  last_error: z.string().nullable().optional(),
  last_error_details: z.any().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type PublishingJobRow = z.infer<typeof PublishingJobRowSchema>;

export const BrandKitSchema = z.object({
  toneKeywords: z.array(z.string()).optional(),
  brandPersonality: z.array(z.string()).optional(),
  writingStyle: z.string().optional(),
  commonPhrases: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  fontFamily: z.string().optional(),
  colors: z
    .object({
      value: z.any().optional(),
      source: z.string().optional(),
    })
    .optional(),
  keywords: z
    .object({
      value: z.array(z.string()).optional(),
      source: z.string().optional(),
    })
    .optional(),
  about_blurb: z
    .object({ value: z.string().optional(), source: z.string().optional() })
    .optional(),
});

export type BrandKit = z.infer<typeof BrandKitSchema>;

export function parseBrandKit(data: unknown) {
  return BrandKitSchema.parse(data || {});
}

// Utility parsers
export function parsePlatformConnection(data: unknown) {
  return PlatformConnectionRecordSchema.parse(data);
}

export function parseMediaAssetRow(data: unknown) {
  return MediaAssetRowSchema.parse(data);
}

export function parsePublishingJobRow(data: unknown) {
  return PublishingJobRowSchema.parse(data);
}
