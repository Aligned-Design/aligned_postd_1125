/**
 * Type definitions for Paid Ads integration
 * Supports Meta, Google, and LinkedIn advertising platforms
 */

export type AdPlatform = "meta" | "google" | "linkedin" | "tiktok";
export type AdStatus =
  | "active"
  | "paused"
  | "completed"
  | "pending"
  | "rejected"
  | "error";
export type CampaignObjective =
  | "awareness"
  | "consideration"
  | "conversion"
  | "traffic"
  | "engagement"
  | "app_installs";

export interface AdAccount {
  id: string;
  platform: AdPlatform;
  name: string;
  accountHandle: string;
  status: "connected" | "disconnected" | "error";
  currency: string;
  timezone: string;
  spendingLimit?: number;
  connectedDate: string;
  tokenExpiresIn?: number; // days
}

export interface AdCampaign {
  id: string;
  accountId: string;
  platform: AdPlatform;
  name: string;
  objective: CampaignObjective;
  status: AdStatus;
  budget: number;
  budgetType: "daily" | "lifetime";
  startDate: string;
  endDate?: string;
  createdDate: string;
  updatedDate: string;
  performance: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number; // Click-through rate %
    cpc: number; // Cost per click
    conversions: number;
    conversionRate: number;
    roas: number; // Return on ad spend
    leadCount?: number;
  };
}

export interface AdCreative {
  id: string;
  campaignId: string;
  platform: AdPlatform;
  type: "image" | "video" | "carousel" | "collection" | "text";
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  callToActionText: string;
  headline: string;
  primaryText: string;
  createdDate: string;
  performance: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
  };
}

export interface AdInsight {
  id: string;
  campaignId: string;
  type: "performance" | "opportunity" | "warning";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  recommendation: string;
  metric: string;
  metricValue: number;
  benchmarkValue?: number;
  suggestedAction?: {
    actionType:
      | "increase_budget"
      | "pause_campaign"
      | "adjust_targeting"
      | "create_variant"
      | "duplicate_creative";
    details: Record<string, unknown>;
  };
}

export interface AdVariant {
  id: string;
  creativeId: string;
  platformId: string;
  variantType: "a_b_test" | "multivariate";
  variants: Array<{
    id: string;
    label: string;
    changes: Record<string, unknown>; // Headline, image, CTA, etc.
  }>;
  status: "draft" | "active" | "completed";
  startDate?: string;
  endDate?: string;
  winnerVoteShare?: Record<string, number>; // variant ID -> percentage
}

export interface BidStrategy {
  type:
    | "lowest_cost"
    | "target_cost"
    | "maximum_value"
    | "target_roas"
    | "target_impression_share";
  targetValue?: number; // For target-based bidding
  options?: Record<string, unknown>;
}

export interface AdTargeting {
  locations?: string[];
  languages?: string[];
  ageMin?: number;
  ageMax?: number;
  genders?: ("male" | "female" | "all")[];
  interests?: string[];
  behaviors?: string[];
  exclusions?: string[];
  customAudiences?: string[];
  lookalikeSources?: string[];
  deviceTypes?: ("mobile" | "desktop" | "tablet")[];
  platforms?: ("feed" | "stories" | "reels" | "search")[];
}

export interface PaidAdsConfig {
  accounts: AdAccount[];
  campaigns: AdCampaign[];
  creatives: AdCreative[];
  insights: AdInsight[];
  variants: AdVariant[];
}

// API Request/Response types
export interface FetchCampaignsRequest {
  accountId?: string;
  platform?: AdPlatform;
  status?: AdStatus;
  limit?: number;
  offset?: number;
}

export interface FetchCampaignsResponse {
  campaigns: AdCampaign[];
  total: number;
  hasMore: boolean;
}

export interface CreateCampaignRequest {
  accountId: string;
  platform: AdPlatform;
  name: string;
  objective: CampaignObjective;
  budget: number;
  budgetType: "daily" | "lifetime";
  startDate: string;
  endDate?: string;
  targeting?: AdTargeting;
  bidStrategy?: BidStrategy;
}

export interface UpdateCampaignRequest {
  campaignId: string;
  patch: Partial<AdCampaign>;
}

export interface FetchInsightsRequest {
  campaignId: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface FetchInsightsResponse {
  insights: AdInsight[];
  generatedAt: string;
}

export interface GenerateVariantRequest {
  creativeId: string;
  variationType: "headline" | "description" | "image" | "cta";
  variantCount?: number;
  guidelines?: Record<string, unknown>; // Brand guidelines
}

export interface GenerateVariantResponse {
  variants: Array<{
    original: string;
    suggested: string[];
    rationale: string;
  }>;
}
