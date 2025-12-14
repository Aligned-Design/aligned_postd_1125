/**
 * Brand Contract Schemas
 */

import { z } from "zod";

/**
 * Brand schema matching database structure
 */
export const BrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  logo_url: z.string().url().nullable().optional(),
  website_url: z.string().url().nullable().optional(),
  industry: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  tone_keywords: z.array(z.string()).nullable().optional(),
  compliance_rules: z.record(z.unknown()).nullable().optional(),
  brand_kit: z.record(z.unknown()).nullable().optional(),
  voice_summary: z.string().nullable().optional(),
  visual_summary: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Brand = z.infer<typeof BrandSchema>;

/**
 * Create brand payload
 */
export const CreateBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  website_url: z.string().url("Invalid URL").optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
});

export type CreateBrandPayload = z.infer<typeof CreateBrandSchema>;

/**
 * Update brand payload (all fields optional except id)
 */
export const UpdateBrandSchema = CreateBrandSchema.partial();

export type UpdateBrandPayload = z.infer<typeof UpdateBrandSchema>;

/**
 * Brand guide/kit schema
 */
export const BrandGuideSchema = z.object({
  brand_id: z.string().uuid(),
  voice: z.object({
    tone: z.array(z.string()).optional(),
    style: z.string().optional(),
    do: z.array(z.string()).optional(),
    dont: z.array(z.string()).optional(),
  }).optional(),
  visual: z.object({
    colors: z.array(z.string()).optional(),
    fonts: z.array(z.string()).optional(),
    logo_urls: z.array(z.string()).optional(),
  }).optional(),
  messaging: z.object({
    tagline: z.string().optional(),
    value_props: z.array(z.string()).optional(),
  }).optional(),
  updated_at: z.string().datetime().optional(),
});

export type BrandGuide = z.infer<typeof BrandGuideSchema>;

