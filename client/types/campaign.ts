export type CampaignStatus = "draft" | "planned" | "active" | "completed" | "idea";
export type CampaignGoal = "awareness" | "engagement" | "sales" | "event" | "brand-building" | "other";
export type CampaignTone = "inspirational" | "informative" | "promo" | "personal";
export type Platform = "linkedin" | "instagram" | "facebook" | "twitter" | "tiktok" | "youtube" | "pinterest" | "google_business";

export interface ContentDistribution {
  id: string;
  type: string;
  label: string;
  platforms: Platform[];
  icon: string;
  count: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  goal: CampaignGoal;
  description?: string;
  tone?: CampaignTone;
  startDate: string;
  endDate: string;
  targetPlatforms: Platform[];
  brand: string;
  createdDate: string;
  performance?: {
    reach: number;
    engagement: number;
    conversions: number;
    performancePercent?: number;
  };
  postCount?: number;
  keyMessage?: string;
  audiencePersona?: string;
  postFrequency?: string;
  notes?: string;
  draftPostIds?: string[];
  contentDistribution?: ContentDistribution[];
}

export interface CampaignIdea {
  id: string;
  name: string;
  status: "idea";
  notes: string;
  tags: string[];
  theme?: string;
  createdDate: string;
  brand: string;
}

export interface CampaignQuickStats {
  activeCampaigns: number;
  totalReach: number;
  bestPerformer: string;
}

export const CAMPAIGN_GOALS: Record<CampaignGoal, string> = {
  awareness: "Awareness",
  engagement: "Engagement",
  sales: "Sales",
  event: "Event",
  "brand-building": "Brand Building",
  other: "Other",
};

export const CAMPAIGN_TONES: Record<CampaignTone, string> = {
  inspirational: "Inspirational",
  informative: "Informative",
  promo: "Promo",
  personal: "Personal",
};

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-300",
  planned: "bg-blue-100 text-blue-700 border-blue-300",
  active: "bg-green-100 text-green-700 border-green-300",
  completed: "bg-purple-100 text-purple-700 border-purple-300",
  idea: "bg-orange-100 text-orange-700 border-orange-300",
};

export const CAMPAIGN_GOAL_ICONS: Record<CampaignGoal, string> = {
  awareness: "🎯",
  engagement: "💬",
  sales: "💰",
  event: "🎉",
  "brand-building": "🏢",
  other: "📌",
};

export const CONTENT_DISTRIBUTION_TYPES: ContentDistribution[] = [
  {
    id: "cross-posts",
    type: "cross-posts",
    label: "Cross Posts",
    platforms: ["instagram", "facebook", "linkedin"],
    icon: "📱",
    count: 0,
  },
  {
    id: "video-cross-posts",
    type: "video-cross-posts",
    label: "Video Cross Posts",
    platforms: ["instagram", "tiktok", "youtube"],
    icon: "🎥",
    count: 0,
  },
  {
    id: "instagram-posts",
    type: "instagram-posts",
    label: "Instagram Posts",
    platforms: ["instagram"],
    icon: "📸",
    count: 0,
  },
  {
    id: "instagram-stories",
    type: "instagram-stories",
    label: "Instagram Stories",
    platforms: ["instagram"],
    icon: "📖",
    count: 0,
  },
  {
    id: "instagram-reels",
    type: "instagram-reels",
    label: "Instagram Reels",
    platforms: ["instagram"],
    icon: "🎞️",
    count: 0,
  },
  {
    id: "youtube-shorts",
    type: "youtube-shorts",
    label: "YouTube Shorts",
    platforms: ["youtube"],
    icon: "📹",
    count: 0,
  },
  {
    id: "tiktok-posts",
    type: "tiktok-posts",
    label: "TikTok Posts",
    platforms: ["tiktok"],
    icon: "♪",
    count: 0,
  },
  {
    id: "facebook-posts",
    type: "facebook-posts",
    label: "Facebook Posts",
    platforms: ["facebook"],
    icon: "f",
    count: 0,
  },
  {
    id: "linkedin-posts",
    type: "linkedin-posts",
    label: "LinkedIn Posts",
    platforms: ["linkedin"],
    icon: "💼",
    count: 0,
  },
  {
    id: "twitter-posts",
    type: "twitter-posts",
    label: "X/Twitter Posts",
    platforms: ["twitter"],
    icon: "𝕏",
    count: 0,
  },
  {
    id: "blog-posts",
    type: "blog-posts",
    label: "Blog Posts",
    platforms: [],
    icon: "📝",
    count: 0,
  },
  {
    id: "emails",
    type: "emails",
    label: "Emails",
    platforms: [],
    icon: "📧",
    count: 0,
  },
];
