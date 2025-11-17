/**
 * Input Validation Schemas for Agent Endpoints
 *
 * Provides Zod schemas for all agent requests to ensure type safety,
 * prevent injection attacks, and provide clear error messages.
 */

import { z } from "zod";

// ============================================================================
// BASE SCHEMAS (Shared)
// ============================================================================

export const BrandIdSchema = z.string().uuid("Invalid brand_id format");

export const PlatformSchema = z.enum([
  "instagram",
  "facebook",
  "linkedin",
  "twitter",
  "tiktok",
  "email",
]);

export const SafetyModeSchema = z
  .enum(["safe", "bold", "edgy_opt_in"])
  .default("safe");

export const RequestIdSchema = z.string().optional();

// ============================================================================
// DOC AGENT (Copy/Writer) SCHEMAS
// ============================================================================

export const DocInputSchema = z.object({
  topic: z
    .string()
    .min(1, "Topic cannot be empty")
    .max(5000, "Topic too long (max 5000 chars)"),
  tone: z
    .string()
    .min(1, "Tone must be specified")
    .optional()
    .default("professional"),
  platform: PlatformSchema,
  format: z
    .enum(["post", "carousel", "reel", "story", "image", "email"])
    .default("post"),
  max_length: z
    .number()
    .min(50, "Max length must be at least 50 chars")
    .max(10000, "Max length cannot exceed 10000 chars")
    .optional(),
  include_cta: z.boolean().optional().default(true),
  cta_type: z
    .enum(["link", "comment", "dm", "bio", "email"])
    .optional(),
  additional_context: z.string().optional(),
});

export const DocGenerationRequestSchema = z.object({
  brand_id: BrandIdSchema,
  input: DocInputSchema,
  safety_mode: SafetyModeSchema,
  __idempotency_key: RequestIdSchema,
});

export type DocGenerationRequest = z.infer<typeof DocGenerationRequestSchema>;

// ============================================================================
// DESIGN AGENT (Creative/Visual Strategist) SCHEMAS
// ============================================================================

export const DesignInputSchema = z.object({
  headline: z.string().max(200, "Headline too long").optional(),
  theme: z
    .enum([
      "educational",
      "testimonial",
      "promotional",
      "story",
      "behind-the-scenes",
    ])
    .optional()
    .default("educational"),
  aspect_ratio: z
    .enum([
      "1080x1080",
      "1080x1350",
      "1080x1920",
      "1200x627",
      "1280x720",
    ])
    .optional(),
  tone: z.string().optional(),
  copy_reference: z.string().optional(),
});

export const DesignGenerationRequestSchema = z.object({
  brand_id: BrandIdSchema,
  input: DesignInputSchema,
  safety_mode: SafetyModeSchema,
  __idempotency_key: RequestIdSchema,
});

export type DesignGenerationRequest = z.infer<
  typeof DesignGenerationRequestSchema
>;

// ============================================================================
// ADVISOR AGENT (Growth Partner) SCHEMAS
// ============================================================================

export const AdvisorGenerationRequestSchema = z.object({
  brand_id: BrandIdSchema,
  platform: PlatformSchema.optional(),
  date_range: z
    .object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    })
    .optional(),
  __idempotency_key: RequestIdSchema,
});

export type AdvisorGenerationRequest = z.infer<
  typeof AdvisorGenerationRequestSchema
>;

// ============================================================================
// BFS CALCULATION SCHEMAS
// ============================================================================

export const ContentForBFSSchema = z.object({
  body: z.string().min(1, "Content body required"),
  headline: z.string().optional(),
  cta: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  platform: PlatformSchema,
});

export const BFSCalculationRequestSchema = z.object({
  brand_id: BrandIdSchema,
  content: ContentForBFSSchema,
});

export type BFSCalculationRequest = z.infer<typeof BFSCalculationRequestSchema>;

// ============================================================================
// APPROVAL/REVIEW SCHEMAS
// ============================================================================

export const ApprovalRequestSchema = z.object({
  logId: z.string().uuid("Invalid log_id"),
  reviewer_notes: z.string().optional(),
});

export const ReviewQueueFilterSchema = z.object({
  brandId: z.string().uuid("Invalid brand_id"),
  agent: z.enum(["doc", "design", "advisor"]).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// ============================================================================
// HELPER FUNCTION: Validate Request Body
// ============================================================================

export function validateDocRequest(data: unknown): DocGenerationRequest {
  return DocGenerationRequestSchema.parse(data);
}

export function validateDesignRequest(data: unknown): DesignGenerationRequest {
  return DesignGenerationRequestSchema.parse(data);
}

export function validateAdvisorRequest(data: unknown): AdvisorGenerationRequest {
  return AdvisorGenerationRequestSchema.parse(data);
}

export function validateBFSRequest(data: unknown): BFSCalculationRequest {
  return BFSCalculationRequestSchema.parse(data);
}

// ============================================================================
// INTEGRATIONS SCHEMAS
// ============================================================================

export const GetIntegrationsQuerySchema = z.object({
  brandId: z.string().uuid("Invalid brand_id format"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const IntegrationTypeSchema = z.enum([
  "instagram",
  "facebook",
  "tiktok",
  "twitter",
  "linkedin",
  "threads",
  "pinterest",
]);

export const CreateIntegrationBodySchema = z.object({
  type: IntegrationTypeSchema,
  brandId: z.string().uuid("Invalid brand_id format"),
});

export type GetIntegrationsQuery = z.infer<typeof GetIntegrationsQuerySchema>;
export type CreateIntegrationBody = z.infer<typeof CreateIntegrationBodySchema>;

/**
 * Generic validation helper with error message formatting
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors
        .map((err) => {
          const path = err.path.join(".");
          return `${path}: ${err.message}`;
        })
        .join("; ");
      throw new Error(`Validation failed: ${messages}`);
    }
    throw error;
  }
}
