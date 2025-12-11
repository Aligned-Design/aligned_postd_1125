/**
 * Social Content Package (Shared Type)
 *
 * Defines the structure for AI-generated social content packages
 * for Facebook and Instagram (feed + Reels).
 *
 * Used by:
 * - POST /api/agents/generate/social endpoint
 * - Planner UI for displaying and editing generated content
 */

import { z } from "zod";

// ============================================================================
// PLATFORM TYPES
// ============================================================================

/**
 * Supported social platforms for this endpoint
 * (LinkedIn, TikTok, email, etc. are NOT supported here)
 */
export const SupportedPlatformSchema = z.enum([
  "facebook",
  "instagram_feed",
  "instagram_reel",
]);

export type SupportedPlatform = z.infer<typeof SupportedPlatformSchema>;

// ============================================================================
// SOCIAL CONTENT PACKAGE SCHEMA
// ============================================================================

/**
 * SocialContentPackage - The main output from the social content generator
 *
 * This package contains everything needed to create a social post,
 * including copy, design brief, and metadata.
 */
export const SocialContentPackageSchema = z.object({
  // Primary content
  primary_text: z.string().describe("Main caption/body text for the post"),
  headline: z.string().optional().describe("Optional headline (primarily for Facebook)"),

  // Hashtags and mentions
  suggested_hashtags: z.array(z.string()).default([]).describe("Recommended hashtags"),
  suggested_mentions: z.array(z.string()).optional().describe("Recommended @mentions"),

  // Call-to-action
  cta_text: z.string().optional().describe("Call-to-action text"),
  cta_link: z.string().optional().describe("CTA link URL if applicable"),

  // Visual guidance (for Creative Studio)
  design_brief: z.string().describe("Design brief for the Creative Studio to generate visuals"),
  preferred_asset_role: z.string().optional().describe("Recommended asset type: 'product', 'lifestyle', 'team', 'testimonial', etc."),
  visual_style_notes: z.string().optional().describe("Additional visual style guidance"),

  // Platform-specific metadata
  platform: SupportedPlatformSchema,
  optimal_length: z.number().optional().describe("Recommended character count for the platform"),
  best_posting_time: z.string().optional().describe("Suggested posting time based on platform/audience"),

  // Content context (from slot)
  pillar: z.string().optional().describe("Content pillar this post belongs to"),
  objective: z.string().optional().describe("Content objective (e.g., 'awareness', 'engagement', 'conversion')"),

  // Reel-specific fields (when platform = instagram_reel)
  reel_hook: z.string().optional().describe("Opening hook for Reel (first 3 seconds)"),
  reel_script_outline: z.array(z.string()).optional().describe("Scene-by-scene script outline for Reel"),
  reel_audio_suggestion: z.string().optional().describe("Suggested audio/music for Reel"),
  reel_duration_seconds: z.number().optional().describe("Recommended Reel duration in seconds"),
});

export type SocialContentPackage = z.infer<typeof SocialContentPackageSchema>;

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

/**
 * Request schema for POST /api/agents/generate/social
 */
export const GenerateSocialRequestSchema = z.object({
  brand_id: z.string().uuid("Invalid brand ID format"),
  slot_id: z.string().uuid("Invalid slot ID format"),
});

export type GenerateSocialRequest = z.infer<typeof GenerateSocialRequestSchema>;

/**
 * Response schema for POST /api/agents/generate/social
 */
export const GenerateSocialResponseSchema = z.object({
  success: z.boolean(),
  draft_id: z.string().uuid().optional(),
  content: SocialContentPackageSchema.optional(),
  error: z.string().optional(),
  validation_errors: z.array(z.string()).optional(),
});

export type GenerateSocialResponse = z.infer<typeof GenerateSocialResponseSchema>;

// ============================================================================
// CONTENT DRAFT SCHEMA (for database storage)
// ============================================================================

/**
 * ContentDraft - Database record for storing generated drafts
 */
export const ContentDraftSchema = z.object({
  id: z.string().uuid(),
  brand_id: z.string().uuid(),
  slot_id: z.string().uuid(),
  platform: SupportedPlatformSchema,
  payload: SocialContentPackageSchema,
  status: z.enum(["draft", "edited", "approved", "rejected"]).default("draft"),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type ContentDraft = z.infer<typeof ContentDraftSchema>;

// ============================================================================
// SLOT CONTEXT SCHEMA (loaded from content_items)
// ============================================================================

/**
 * SlotContext - Context loaded from a content plan slot
 * Used to inform the AI about what type of content to generate
 */
export const SlotContextSchema = z.object({
  id: z.string().uuid(),
  brand_id: z.string().uuid(),
  title: z.string(),
  platform: z.string(),
  type: z.string(), // "post", "reel", etc.
  scheduled_for: z.string().datetime().optional(),

  // Content plan metadata (from content JSONB)
  pillar: z.string().optional(),
  objective: z.string().optional(),
  hook: z.string().optional(),
  angle: z.string().optional(),
  cta: z.string().optional(),
  recommended_asset_role: z.string().optional(),
});

export type SlotContext = z.infer<typeof SlotContextSchema>;

// ============================================================================
// PLATFORM RULES
// ============================================================================

/**
 * Platform-specific content rules and guidelines
 */
export const PLATFORM_RULES: Record<SupportedPlatform, {
  maxLength: number;
  hashtagGuidance: string;
  bestPractices: string[];
}> = {
  facebook: {
    maxLength: 63206,
    hashtagGuidance: "Use 1-3 relevant hashtags. Facebook users engage less with hashtag-heavy posts.",
    bestPractices: [
      "Keep posts concise (40-80 characters for highest engagement)",
      "Ask questions to encourage comments",
      "Use emojis sparingly but effectively",
      "Include a clear call-to-action",
      "Tag relevant pages when appropriate",
    ],
  },
  instagram_feed: {
    maxLength: 2200,
    hashtagGuidance: "Use 5-15 relevant hashtags. Mix popular and niche hashtags. Place in caption or first comment.",
    bestPractices: [
      "Start with a hook in the first line",
      "Use line breaks for readability",
      "Include a call-to-action (save, share, comment)",
      "Use relevant emojis to add personality",
      "Mention other accounts when relevant",
      "End with a question to boost engagement",
    ],
  },
  instagram_reel: {
    maxLength: 2200,
    hashtagGuidance: "Use 3-5 highly relevant hashtags. Include trending hashtags when appropriate.",
    bestPractices: [
      "Hook viewers in the first 3 seconds",
      "Keep Reels 15-30 seconds for optimal engagement",
      "Use trending audio when brand-appropriate",
      "Include text overlays for accessibility",
      "End with a strong CTA",
      "Caption should complement, not repeat, the video content",
    ],
  },
};

// ============================================================================
// UPDATE DRAFT SCHEMA
// ============================================================================

/**
 * Request schema for PATCH /api/agents/drafts/:draftId
 */
export const UpdateDraftRequestSchema = z.object({
  primary_text: z.string().optional(),
  headline: z.string().optional(),
  suggested_hashtags: z.array(z.string()).optional(),
  cta_text: z.string().optional(),
  design_brief: z.string().optional(),
  status: z.enum(["draft", "edited", "approved", "rejected"]).optional(),
});

export type UpdateDraftRequest = z.infer<typeof UpdateDraftRequestSchema>;

