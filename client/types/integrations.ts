export type PlatformProvider =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "tiktok"
  | "google_business"
  | "pinterest"
  | "youtube"
  | "squarespace"
  | "mailchimp"
  | "wordpress"
  | "wix"
  | "shopify"
  | "woocommerce"
  | "faire"
  | "rangeme";

export type PlatformTier = 1 | 2 | "coming_soon";

export type ConnectionStatus =
  | "connected"
  | "expired"
  | "disconnected"
  | "error";

export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export type ReviewStatus = "unanswered" | "answered" | "flagged";

export type ReviewSentiment = "positive" | "neutral" | "negative";

export type EventStatus = "draft" | "published" | "cancelled";

export type ContentType =
  | "post"
  | "story"
  | "reel"
  | "article"
  | "tweet"
  | "video"
  | "pin"
  | "blog"
  | "email"
  | "event"
  | "offer";

export interface PlatformConnection {
  id: string;
  brand_id: string;
  provider: PlatformProvider;
  account_username?: string;
  account_id?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  scopes?: string[];
  status: ConnectionStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  brand_id: string;
  connection_ids: string[];
  title?: string;
  caption: string;
  content_type: ContentType;
  media_urls?: string[];
  hashtags?: string[];
  cta_text?: string;
  cta_url?: string;
  platform_specific_data: Record<string, unknown>;
  schedule_for?: string;
  status: PostStatus;
  published_at?: string;
  published_urls: Record<string, string>;
  performance_metrics: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformReview {
  id: string;
  brand_id: string;
  connection_id: string;
  provider: PlatformProvider;
  external_review_id: string;
  reviewer_name?: string;
  reviewer_avatar_url?: string;
  rating: number;
  review_text: string;
  review_date: string;
  response_text?: string;
  responded_at?: string;
  responded_by?: string;
  sentiment?: ReviewSentiment;
  status: ReviewStatus;
  platform_url?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PlatformEvent {
  id: string;
  brand_id: string;
  connection_ids: string[];
  title: string;
  description?: string;
  event_type?: string;
  start_time: string;
  end_time?: string;
  location_name?: string;
  location_address?: string;
  online_url?: string;
  cover_image_url?: string;
  rsvp_enabled: boolean;
  rsvp_count: number;
  status: EventStatus;
  published_at?: string;
  published_urls: Record<string, string>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewResponseTemplate {
  id: string;
  brand_id: string;
  template_name: string;
  rating_range?: string;
  template_text: string;
  variables: Record<string, unknown>;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlatformConfig {
  provider: PlatformProvider;
  name: string;
  category:
    | "social"
    | "video"
    | "professional"
    | "ecommerce"
    | "reviews"
    | "email"
    | "web_blog";
  tier: PlatformTier;
  icon: string;
  color: string;
  supportedContentTypes: ContentType[];
  requiresAuth: boolean;
  oauthUrl?: string;
  maxCaptionLength?: number;
  maxHashtags?: number;
  supportsScheduling: boolean;
  supportsReviews?: boolean;
  supportsEvents?: boolean;
}

export const PLATFORM_CONFIGS: Record<PlatformProvider, PlatformConfig> = {
  instagram: {
    provider: "instagram",
    name: "Instagram",
    category: "social",
    tier: 1,
    icon: "📷",
    color: "#E4405F",
    supportedContentTypes: ["post", "story", "reel"],
    requiresAuth: true,
    maxCaptionLength: 2200,
    maxHashtags: 30,
    supportsScheduling: true,
  },
  facebook: {
    provider: "facebook",
    name: "Facebook",
    category: "social",
    tier: 1,
    icon: "👥",
    color: "#1877F2",
    supportedContentTypes: ["post", "story", "event"],
    requiresAuth: true,
    maxCaptionLength: 63206,
    supportsScheduling: true,
    supportsReviews: true,
    supportsEvents: true,
  },
  linkedin: {
    provider: "linkedin",
    name: "LinkedIn",
    category: "professional",
    tier: 1,
    icon: "💼",
    color: "#0A66C2",
    supportedContentTypes: ["post", "article"],
    requiresAuth: true,
    maxCaptionLength: 3000,
    supportsScheduling: true,
  },
  twitter: {
    provider: "twitter",
    name: "X (Twitter)",
    category: "social",
    tier: 1,
    icon: "🐦",
    color: "#000000",
    supportedContentTypes: ["tweet"],
    requiresAuth: true,
    maxCaptionLength: 280,
    maxHashtags: 10,
    supportsScheduling: true,
  },
  tiktok: {
    provider: "tiktok",
    name: "TikTok",
    category: "video",
    tier: 1,
    icon: "🎵",
    color: "#000000",
    supportedContentTypes: ["video"],
    requiresAuth: true,
    maxCaptionLength: 2200,
    maxHashtags: 30,
    supportsScheduling: true,
  },
  google_business: {
    provider: "google_business",
    name: "Google Business Profile",
    category: "reviews",
    tier: 1,
    icon: "🔍",
    color: "#4285F4",
    supportedContentTypes: ["post", "event", "offer"],
    requiresAuth: true,
    maxCaptionLength: 1500,
    supportsScheduling: true,
    supportsReviews: true,
    supportsEvents: true,
  },
  pinterest: {
    provider: "pinterest",
    name: "Pinterest",
    category: "social",
    tier: 1,
    icon: "📌",
    color: "#E60023",
    supportedContentTypes: ["pin"],
    requiresAuth: true,
    maxCaptionLength: 500,
    supportsScheduling: true,
  },
  youtube: {
    provider: "youtube",
    name: "YouTube",
    category: "video",
    tier: 1,
    icon: "▶️",
    color: "#FF0000",
    supportedContentTypes: ["video"],
    requiresAuth: true,
    maxCaptionLength: 5000,
    supportsScheduling: true,
  },
  squarespace: {
    provider: "squarespace",
    name: "Squarespace",
    category: "web_blog",
    tier: 1,
    icon: "⬛",
    color: "#000000",
    supportedContentTypes: ["blog", "email"],
    requiresAuth: true,
    supportsScheduling: true,
  },
  mailchimp: {
    provider: "mailchimp",
    name: "Mailchimp",
    category: "email",
    tier: 1,
    icon: "📧",
    color: "#FFE01B",
    supportedContentTypes: ["email"],
    requiresAuth: true,
    supportsScheduling: true,
  },
  wordpress: {
    provider: "wordpress",
    name: "WordPress",
    category: "web_blog",
    tier: 1,
    icon: "📝",
    color: "#21759B",
    supportedContentTypes: ["blog"],
    requiresAuth: true,
    supportsScheduling: true,
  },
  wix: {
    provider: "wix",
    name: "Wix",
    category: "web_blog",
    tier: 1,
    icon: "⚙️",
    color: "#FFB700",
    supportedContentTypes: ["blog", "email"],
    requiresAuth: true,
    supportsScheduling: true,
  },
  shopify: {
    provider: "shopify",
    name: "Shopify",
    category: "ecommerce",
    tier: 2,
    icon: "🛍️",
    color: "#96BF48",
    supportedContentTypes: ["post"],
    requiresAuth: true,
    supportsScheduling: false,
  },
  woocommerce: {
    provider: "woocommerce",
    name: "WooCommerce",
    category: "ecommerce",
    tier: 2,
    icon: "🛒",
    color: "#96588A",
    supportedContentTypes: ["post"],
    requiresAuth: true,
    supportsScheduling: false,
  },
  faire: {
    provider: "faire",
    name: "Faire",
    category: "ecommerce",
    tier: "coming_soon",
    icon: "📦",
    color: "#4A90E2",
    supportedContentTypes: [],
    requiresAuth: true,
    supportsScheduling: false,
  },
  rangeme: {
    provider: "rangeme",
    name: "RangeMe",
    category: "ecommerce",
    tier: "coming_soon",
    icon: "🏪",
    color: "#FF6B35",
    supportedContentTypes: [],
    requiresAuth: true,
    supportsScheduling: false,
  },
};

export interface CreatePostFormData {
  title?: string;
  caption: string;
  content_type: ContentType;
  media_urls?: string[];
  hashtags?: string[];
  cta_text?: string;
  cta_url?: string;
  platforms: PlatformProvider[];
  schedule_for?: Date;
}

export interface CreateEventFormData {
  title: string;
  description?: string;
  event_type?: string;
  start_time: Date;
  end_time?: Date;
  location_name?: string;
  location_address?: string;
  online_url?: string;
  cover_image_url?: string;
  rsvp_enabled: boolean;
  platforms: PlatformProvider[];
}
