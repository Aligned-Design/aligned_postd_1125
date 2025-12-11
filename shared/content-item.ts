/**
 * Content Item Types (Shared)
 * 
 * Canonical type definitions for the content_items.content JSONB field.
 * Used by all content writers and readers to ensure consistency.
 * 
 * GUARDRAILS:
 * - ALL metadata must be nested under content.metadata (never at root)
 * - ALL new fields must be optional to avoid breaking downstream parsers
 * - body, title, blocks are the only allowed top-level content fields
 */

/**
 * Metadata block for content classification, routing, and system info.
 * All metadata fields live under content.metadata - never at root level.
 */
export interface ContentItemMetadata {
  /** Channel/platform: instagram, blog, email, gbp, linkedin, facebook, twitter, etc. */
  channel?: string;
  /** Source of content generation */
  source?: "onboarding" | "planner" | "docAgent" | "import" | "creative_studio" | string;
  /** Optional campaign linkage */
  campaignId?: string | null;
  /** Platform-specific post type (reel, story, carousel, etc.) */
  platformPostType?: string | null;
  /** Content tags for categorization */
  tags?: string[];
  /** Scheduled date (ISO date string YYYY-MM-DD) */
  scheduledDate?: string;
  /** Scheduled time (HH:mm format) */
  scheduledTime?: string;
  /** Package ID for batch content */
  packageId?: string;
  /** Generation timestamp */
  generatedAt?: string;
  /** Brand fidelity score */
  brandFidelityScore?: number;
  /** Image URL for the content */
  imageUrl?: string;
  /** Content type: post, blog, email, gbp, etc. */
  type?: string;
  /** Content pillar for strategy alignment */
  pillar?: string;
  /** Content objective */
  objective?: string;
  /** Extension hook: allows custom metadata keys */
  [key: string]: unknown;
}

/**
 * Canonical structure for content_items.content JSONB field.
 * 
 * RULES:
 * - body, title, blocks = top-level content fields
 * - metadata = ALL classification, routing, or system info
 * - Never place metadata fields at root level
 */
export interface ContentItemContent {
  /** Primary caption/body text (the main content) */
  body?: string;
  /** Title for email/blogs/headlines */
  title?: string;
  /** Optional headline (alias for title, used by some agents) */
  headline?: string;
  /** Optional rich content blocks */
  blocks?: unknown[];
  /** All metadata nested here - never at root level */
  metadata?: ContentItemMetadata;
}

/**
 * Input arguments for building a ContentItemContent object.
 * Used by the buildContentItemContent helper function.
 */
export interface BuildContentItemContentArgs {
  /** Primary body/caption text */
  body?: string;
  /** Title or headline */
  title?: string;
  /** Headline (alias for title) */
  headline?: string;
  /** Rich content blocks */
  blocks?: unknown[];
  /** Channel/platform */
  channel?: string;
  /** Content source */
  source?: "onboarding" | "planner" | "docAgent" | "import" | "creative_studio" | string;
  /** Campaign ID */
  campaignId?: string | null;
  /** Platform post type */
  platformPostType?: string | null;
  /** Tags */
  tags?: string[];
  /** Scheduled date */
  scheduledDate?: string;
  /** Scheduled time */
  scheduledTime?: string;
  /** Package ID */
  packageId?: string;
  /** Generated at timestamp */
  generatedAt?: string;
  /** Brand fidelity score */
  brandFidelityScore?: number;
  /** Image URL */
  imageUrl?: string;
  /** Content type */
  type?: string;
  /** Content pillar */
  pillar?: string;
  /** Content objective */
  objective?: string;
  /** Additional metadata (will be merged into metadata block) */
  additionalMetadata?: Record<string, unknown>;
}

/**
 * Build a properly structured ContentItemContent object.
 * 
 * ALL writers to content_items.content MUST use this helper.
 * This ensures:
 * 1. Consistent JSONB structure across all write paths
 * 2. All metadata is nested under content.metadata
 * 3. No metadata fields leak to root level
 * 
 * @param args - Content and metadata arguments
 * @returns Properly structured ContentItemContent object
 */
export function buildContentItemContent(args: BuildContentItemContentArgs): ContentItemContent {
  const {
    body,
    title,
    headline,
    blocks,
    channel,
    source,
    campaignId,
    platformPostType,
    tags,
    scheduledDate,
    scheduledTime,
    packageId,
    generatedAt,
    brandFidelityScore,
    imageUrl,
    type,
    pillar,
    objective,
    additionalMetadata,
  } = args;

  // Build metadata block (only include defined values)
  const metadata: ContentItemMetadata = {};
  
  if (channel !== undefined) metadata.channel = channel;
  if (source !== undefined) metadata.source = source;
  if (campaignId !== undefined) metadata.campaignId = campaignId;
  if (platformPostType !== undefined) metadata.platformPostType = platformPostType;
  if (tags !== undefined) metadata.tags = tags;
  if (scheduledDate !== undefined) metadata.scheduledDate = scheduledDate;
  if (scheduledTime !== undefined) metadata.scheduledTime = scheduledTime;
  if (packageId !== undefined) metadata.packageId = packageId;
  if (generatedAt !== undefined) metadata.generatedAt = generatedAt;
  if (brandFidelityScore !== undefined) metadata.brandFidelityScore = brandFidelityScore;
  if (imageUrl !== undefined) metadata.imageUrl = imageUrl;
  if (type !== undefined) metadata.type = type;
  if (pillar !== undefined) metadata.pillar = pillar;
  if (objective !== undefined) metadata.objective = objective;

  // Merge additional metadata if provided
  if (additionalMetadata) {
    Object.assign(metadata, additionalMetadata);
  }

  // Build content object
  const content: ContentItemContent = {};
  
  // Top-level content fields
  if (body !== undefined) content.body = body;
  if (title !== undefined) content.title = title;
  if (headline !== undefined) content.headline = headline;
  if (blocks !== undefined) content.blocks = blocks;
  
  // Only add metadata if it has properties
  if (Object.keys(metadata).length > 0) {
    content.metadata = metadata;
  }

  return content;
}

/**
 * Extract body text from ContentItemContent with fallbacks.
 * Handles various field naming conventions (body, caption, text).
 * 
 * @param content - The content object (may be ContentItemContent or legacy format)
 * @returns The body text or empty string
 */
export function extractBody(content: ContentItemContent | Record<string, unknown> | null | undefined): string {
  if (!content || typeof content !== "object") return "";
  
  // Check standard fields in priority order
  if (typeof content.body === "string") return content.body;
  if (typeof (content as any).caption === "string") return (content as any).caption;
  if (typeof (content as any).text === "string") return (content as any).text;
  
  return "";
}

/**
 * Extract title from ContentItemContent with fallbacks.
 * Handles various field naming conventions (title, headline).
 * 
 * @param content - The content object
 * @returns The title or empty string
 */
export function extractTitle(content: ContentItemContent | Record<string, unknown> | null | undefined): string {
  if (!content || typeof content !== "object") return "";
  
  if (typeof content.title === "string") return content.title;
  if (typeof content.headline === "string") return content.headline;
  
  return "";
}

/**
 * Extract channel from ContentItemContent with fallbacks.
 * Handles both nested metadata and legacy root-level platform field.
 * 
 * @param content - The content object
 * @returns The channel/platform or undefined
 */
export function extractChannel(content: ContentItemContent | Record<string, unknown> | null | undefined): string | undefined {
  if (!content || typeof content !== "object") return undefined;
  
  // Preferred: nested under metadata
  if (content.metadata && typeof (content.metadata as any).channel === "string") {
    return (content.metadata as any).channel;
  }
  
  // Fallback: legacy root-level platform
  if (typeof (content as any).platform === "string") {
    return (content as any).platform;
  }
  
  return undefined;
}

/**
 * Extract source from ContentItemContent with fallbacks.
 * 
 * @param content - The content object
 * @returns The source or undefined
 */
export function extractSource(content: ContentItemContent | Record<string, unknown> | null | undefined): string | undefined {
  if (!content || typeof content !== "object") return undefined;
  
  // Preferred: nested under metadata
  if (content.metadata && typeof (content.metadata as any).source === "string") {
    return (content.metadata as any).source;
  }
  
  // Fallback: legacy root-level source
  if (typeof (content as any).source === "string") {
    return (content as any).source;
  }
  
  return undefined;
}

/**
 * Type guard to check if an object is a ContentItemContent.
 * 
 * @param obj - Object to check
 * @returns True if object conforms to ContentItemContent structure
 */
export function isContentItemContent(obj: unknown): obj is ContentItemContent {
  if (!obj || typeof obj !== "object") return false;
  
  const content = obj as Record<string, unknown>;
  
  // Check that if body/title/headline exist, they are strings
  if ("body" in content && typeof content.body !== "string" && content.body !== undefined) return false;
  if ("title" in content && typeof content.title !== "string" && content.title !== undefined) return false;
  if ("headline" in content && typeof content.headline !== "string" && content.headline !== undefined) return false;
  
  // Check that if metadata exists, it's an object
  if ("metadata" in content && content.metadata !== null && typeof content.metadata !== "object") return false;
  
  return true;
}

