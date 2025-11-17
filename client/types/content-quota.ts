/**
 * Content Posting Quotas & Mix Configuration
 * Phase 5 - Agent Orchestration & Scheduling
 */

export type Platform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "tiktok"
  | "youtube_shorts"
  | "blog"
  | "email"
  | "google_business";

export type ContentType =
  | "reel"
  | "carousel"
  | "image"
  | "story"
  | "post"
  | "article"
  | "video"
  | "email"
  | "blog";

export type FunnelStage = "top" | "mid" | "bottom";

export type PostingFrequency = "light" | "standard" | "aggressive";

/**
 * Default posting quotas per platform
 */
export interface PlatformQuota {
  platform: Platform;
  posts_per_week: { min: number; max: number };
  posts_per_month: { min: number; max: number };
  content_types: ContentType[];
  description: string;
}

/**
 * Default quotas (baseline smart defaults)
 */
export const DEFAULT_PLATFORM_QUOTAS: PlatformQuota[] = [
  {
    platform: "instagram",
    posts_per_week: { min: 3, max: 5 },
    posts_per_month: { min: 12, max: 20 },
    content_types: ["reel", "carousel", "image", "story"],
    description: "Mix of reels, carousels, images",
  },
  {
    platform: "facebook",
    posts_per_week: { min: 3, max: 5 },
    posts_per_month: { min: 12, max: 20 },
    content_types: ["reel", "carousel", "image", "post"],
    description: "Mix of reels, carousels, images",
  },
  {
    platform: "linkedin",
    posts_per_week: { min: 2, max: 3 },
    posts_per_month: { min: 8, max: 12 },
    content_types: ["post", "article"],
    description: "Thought leadership + brand updates",
  },
  {
    platform: "twitter",
    posts_per_week: { min: 3, max: 5 },
    posts_per_month: { min: 12, max: 20 },
    content_types: ["post"],
    description: "Snippets, quotes, blog promos",
  },
  {
    platform: "tiktok",
    posts_per_week: { min: 2, max: 2 },
    posts_per_month: { min: 8, max: 8 },
    content_types: ["video"],
    description: "Short-form video",
  },
  {
    platform: "youtube_shorts",
    posts_per_week: { min: 2, max: 2 },
    posts_per_month: { min: 8, max: 8 },
    content_types: ["video"],
    description: "Short-form video",
  },
  {
    platform: "blog",
    posts_per_week: { min: 1, max: 1 },
    posts_per_month: { min: 4, max: 4 },
    content_types: ["blog"],
    description: "SEO or educational posts",
  },
  {
    platform: "email",
    posts_per_week: { min: 1, max: 1 },
    posts_per_month: { min: 4, max: 4 },
    content_types: ["email"],
    description: "Nurture or announcement series",
  },
  {
    platform: "google_business",
    posts_per_week: { min: 1, max: 1 },
    posts_per_month: { min: 4, max: 4 },
    content_types: ["post"],
    description: "Service highlights or promos",
  },
];

/**
 * Content mix configuration (per platform)
 */
export interface ContentMix {
  platform: Platform;
  total_posts: number;
  breakdown: {
    [K in ContentType]?: {
      count: number;
      percentage: number;
    };
  };
  funnel_distribution: {
    top: number; // Awareness %
    mid: number; // Education %
    bottom: number; // Conversion %
  };
}

/**
 * Monthly content plan (output from Advisor Agent)
 */
export interface MonthlyContentPlan {
  brand_id: string;
  month: string; // YYYY-MM format
  total_pieces: number;
  platforms: ContentMix[];
  best_times: Array<{
    platform: Platform;
    day: string;
    slot: string; // HH:MM
    confidence: number;
  }>;
  top_topics: string[];
  generated_at: string;
  valid_until: string;
}

/**
 * Performance adjustment rules
 */
export interface PerformanceAdjustment {
  condition:
    | "engagement_up"
    | "engagement_down"
    | "growth_flat"
    | "failed_posts";
  threshold: number; // e.g., 0.25 for 25%
  action:
    | "increase_frequency"
    | "decrease_frequency"
    | "shift_mix"
    | "audit_integrations";
  adjustment_value?: number; // e.g., +1 or -1 posts/week
  details: string;
}

/**
 * Performance adjustment rules (configured)
 */
export const PERFORMANCE_ADJUSTMENT_RULES: PerformanceAdjustment[] = [
  {
    condition: "engagement_up",
    threshold: 0.25,
    action: "increase_frequency",
    adjustment_value: 1,
    details: "Add +1 post/week on top 2 performing channels",
  },
  {
    condition: "engagement_down",
    threshold: 0.2,
    action: "decrease_frequency",
    adjustment_value: -1,
    details: "Reduce output by 1 post/week; focus on quality",
  },
  {
    condition: "growth_flat",
    threshold: 2, // 2+ months
    action: "shift_mix",
    details: "Shift mix: 60% awareness → 40% conversion posts",
  },
  {
    condition: "failed_posts",
    threshold: 2, // 2+ failures per month
    action: "audit_integrations",
    details: "Auto-audit integrations and flag for user review",
  },
];

/**
 * Brand posting configuration (user-customizable)
 */
export interface BrandPostingConfig {
  brand_id: string;
  posting_frequency: PostingFrequency; // light | standard | aggressive
  platforms_enabled: Platform[];
  content_type_weighting: {
    [P in Platform]?: {
      [C in ContentType]?: number; // 0-1 percentage
    };
  };
  approval_workflow: "auto" | "manual"; // Auto-approve or manual review
  publish_schedule: {
    [P in Platform]?: Array<{
      day: string;
      time: string; // HH:MM
    }>;
  };
  ai_confidence_threshold: number; // 0-1 (default: 0.8)
  auto_generate_next_month: boolean;
}

/**
 * Posting frequency presets
 */
export const POSTING_FREQUENCY_PRESETS: Record<
  PostingFrequency,
  { multiplier: number; description: string }
> = {
  light: {
    multiplier: 0.7,
    description: "~15-25 posts/month (70% of standard)",
  },
  standard: {
    multiplier: 1.0,
    description: "~25-40 posts/month (baseline)",
  },
  aggressive: {
    multiplier: 1.5,
    description: "~40-60 posts/month (150% of standard)",
  },
};

/**
 * Weekly summary data
 */
export interface WeeklySummary {
  brand_id: string;
  week_start: string; // YYYY-MM-DD
  week_end: string;
  posts_published: number;
  posts_awaiting_approval: number;
  new_insights: number;
  reach_change_pct: number; // +14% = 0.14
  engagement_change_pct: number;
  top_performer_id?: string;
  suggested_actions: Array<{
    action: "generate_more" | "regenerate_low" | "rebalance_plan";
    label: string;
    count?: number;
  }>;
}

/**
 * Content piece status
 */
export type ContentStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "scheduled"
  | "published"
  | "failed";

/**
 * Scheduled content piece
 */
export interface ScheduledContent {
  id: string;
  brand_id: string;
  platform: Platform;
  content_type: ContentType;
  funnel_stage: FunnelStage;
  headline?: string;
  body: string;
  cta?: string;
  hashtags: string[];
  media_urls: string[];
  scheduled_for: string; // ISO timestamp
  status: ContentStatus;
  generation_log_id: string;
  bfs_score: number;
  auto_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  published_at?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Success metrics tracking
 */
export interface SystemSuccessMetrics {
  period_start: string;
  period_end: string;
  total_content_planned: number;
  total_content_generated: number;
  auto_generation_rate: number; // % planned content generated automatically
  approval_without_edit_rate: number; // % approved without edit
  avg_bfs_score: number;
  on_time_publication_rate: number; // % published on schedule
  mom_engagement_growth: number; // Month-over-month engagement growth %
}

/**
 * Target metrics
 */
export const TARGET_SUCCESS_METRICS = {
  auto_generation_rate: 0.9, // ≥ 90%
  approval_without_edit_rate: 0.8, // ≥ 80%
  avg_bfs_score: 0.85, // ≥ 0.85
  on_time_publication_rate: 0.95, // ≥ 95%
  mom_engagement_growth: 0.1, // +10%
};

/**
 * Calculate total monthly quota for a brand
 */
export function calculateMonthlyQuota(
  frequency: PostingFrequency,
  enabledPlatforms: Platform[],
): number {
  const multiplier = POSTING_FREQUENCY_PRESETS[frequency].multiplier;

  let total = 0;
  for (const platform of enabledPlatforms) {
    const quota = DEFAULT_PLATFORM_QUOTAS.find((q) => q.platform === platform);
    if (quota) {
      const avgMonthly =
        (quota.posts_per_month.min + quota.posts_per_month.max) / 2;
      total += avgMonthly * multiplier;
    }
  }

  return Math.round(total);
}

/**
 * Generate content mix from Advisor recommendations
 */
export function generateContentMix(
  platform: Platform,
  totalPosts: number,
  contentTypes: ContentType[],
  weightings?: { [K in ContentType]?: number },
): ContentMix {
  const breakdown: ContentMix["breakdown"] = {};

  // Default weightings if not provided
  const weights = weightings || getDefaultWeightings(platform);

  // Calculate breakdown
  for (const type of contentTypes) {
    const weight = weights[type] || 1 / contentTypes.length;
    const count = Math.round(totalPosts * weight);
    breakdown[type] = {
      count,
      percentage: weight,
    };
  }

  // Default funnel distribution (can be customized by Advisor)
  const funnelDistribution = {
    top: 0.5, // 50% awareness
    mid: 0.3, // 30% education
    bottom: 0.2, // 20% conversion
  };

  return {
    platform,
    total_posts: totalPosts,
    breakdown,
    funnel_distribution: funnelDistribution,
  };
}

/**
 * Get default content type weightings per platform
 */
function getDefaultWeightings(platform: Platform): {
  [K in ContentType]?: number;
} {
  const defaults: Record<Platform, { [K in ContentType]?: number }> = {
    instagram: { reel: 0.5, carousel: 0.3, image: 0.2 },
    facebook: { reel: 0.4, carousel: 0.3, image: 0.3 },
    linkedin: { post: 0.7, article: 0.3 },
    twitter: { post: 1.0 },
    tiktok: { video: 1.0 },
    youtube_shorts: { video: 1.0 },
    blog: { blog: 1.0 },
    email: { email: 1.0 },
    google_business: { post: 1.0 },
  };

  return defaults[platform] || {};
}
