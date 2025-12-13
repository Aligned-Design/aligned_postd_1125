/**
 * Content Contract Schemas
 */

import { z } from "zod";

/**
 * Content item metadata
 */
export const ContentMetadataSchema = z.object({
  channel: z.string().optional(),
  source: z.enum(["onboarding", "planner", "docAgent", "import", "creative_studio"]).or(z.string()).optional(),
  campaignId: z.string().optional(),
  bfsScore: z.number().min(0).max(100).optional(),
});

/**
 * Content item content structure
 */
export const ContentItemContentSchema = z.object({
  body: z.string().optional(),
  title: z.string().optional(),
  headline: z.string().optional(),
  blocks: z.array(z.unknown()).optional(),
  metadata: ContentMetadataSchema.optional(),
});

/**
 * Full content item schema
 */
export const ContentItemSchema = z.object({
  id: z.string().uuid(),
  brandId: z.string().uuid(),
  type: z.string(),
  content: ContentItemContentSchema,
  status: z.enum(["draft", "published", "scheduled", "archived"]).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type ContentItem = z.infer<typeof ContentItemSchema>;

/**
 * Create content payload
 */
export const CreateContentSchema = z.object({
  brandId: z.string().uuid("Brand ID must be a valid UUID"),
  type: z.string().min(1, "Content type is required"),
  content: ContentItemContentSchema,
  metadata: z.record(z.unknown()).optional(),
});

export type CreateContentPayload = z.infer<typeof CreateContentSchema>;

/**
 * Update content payload
 */
export const UpdateContentSchema = CreateContentSchema.partial().omit({ brandId: true });

export type UpdateContentPayload = z.infer<typeof UpdateContentSchema>;

