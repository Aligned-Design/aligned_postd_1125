export type EventStatus = "draft" | "scheduled" | "published" | "live" | "completed" | "cancelled";
export type EventVisibility = "public" | "private";
export type EventType = "digital" | "in_person" | "promo";
export type Platform = "facebook" | "google_business" | "squarespace";

export interface EventPlatform {
  platform: Platform;
  isConnected: boolean;
  syncStatus: "synced" | "pending" | "failed" | "not_linked";
  linkedDate?: string;
  externalId?: string;
}

export interface AIGeneratedContent {
  eventTitle?: string;
  eventDescription?: string;
  promotionContent?: {
    before: string[];
    during: string[];
    after: string[];
  };
  hashtagsSuggested?: string[];
  imageprompts?: string[];
  postingCadence?: {
    preEventDays: number;
    postEventDays: number;
    postsPerDay: number;
  };
  estimatedReachLift?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  imageUrl?: string;
  eventType: EventType;
  status: EventStatus;
  visibility: EventVisibility;
  rsvpUrl?: string;
  tags: string[];
  brand: string;
  createdDate: string;
  updatedDate: string;
  platforms: EventPlatform[];
  promotionSchedule: PromotionPost[];
  assignedCampaignId?: string;
  aiGeneratedContent?: AIGeneratedContent;
  isAIGenerated?: boolean;
  attendance?: {
    interested: number;
    going: number;
    views: number;
  };
  engagementData?: {
    impressions: number;
    clicks: number;
    shares: number;
  };
}

export interface PromotionPost {
  id: string;
  type: "before" | "during" | "after";
  title: string;
  content: string;
  platforms: Platform[];
  scheduledDate: string;
  status: "draft" | "scheduled" | "published";
}

export interface EventQuickStats {
  upcomingCount: number;
  connectedPlatforms: number;
  scheduledPromotions: number;
  failedSyncs: number;
}

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-300",
  scheduled: "bg-blue-100 text-blue-700 border-blue-300",
  published: "bg-green-100 text-green-700 border-green-300",
  live: "bg-red-100 text-red-700 border-red-300",
  completed: "bg-purple-100 text-purple-700 border-purple-300",
  cancelled: "bg-gray-100 text-gray-700 border-gray-300",
};

export const EVENT_STATUS_ICONS: Record<EventStatus, string> = {
  draft: "📝",
  scheduled: "📅",
  published: "✅",
  live: "🔴",
  completed: "🏁",
  cancelled: "❌",
};

export const PLATFORM_ICONS: Record<Platform, string> = {
  facebook: "f",
  google_business: "G",
  squarespace: "S",
};

export const PLATFORM_NAMES: Record<Platform, string> = {
  facebook: "Facebook",
  google_business: "Google Business",
  squarespace: "Squarespace",
};

export const PROMOTION_TYPES = {
  before: "Before Event",
  during: "During Event",
  after: "After Event",
};

export const EVENT_STATUS_LIST: EventStatus[] = [
  "draft",
  "scheduled",
  "published",
  "live",
  "completed",
  "cancelled",
];

export interface EventTypeConfig {
  id: EventType;
  name: string;
  icon: string;
  color: string;
  accentColor: string;
  aiTone: string;
  description: string;
  example: string;
  defaultPostingCadence: {
    preEventDays: number;
    postEventDays: number;
  };
}

export const EVENT_TYPE_CONFIGS: Record<EventType, EventTypeConfig> = {
  digital: {
    id: "digital",
    name: "Digital",
    icon: "💻",
    color: "bg-indigo-100 text-indigo-700 border-indigo-300",
    accentColor: "from-indigo-500 to-teal-500",
    aiTone: "Professional, educational tone",
    description: "Webinars, online presentations, virtual conferences",
    example: "Product demos, online classes, training sessions, webinars",
    defaultPostingCadence: { preEventDays: 7, postEventDays: 3 },
  },
  in_person: {
    id: "in_person",
    name: "In-Person Event",
    icon: "🎉",
    color: "bg-amber-100 text-amber-700 border-amber-300",
    accentColor: "from-amber-500 to-red-500",
    aiTone: "Celebratory, community-focused tone",
    description: "Ribbon cuttings, grand openings, networking events, meetups",
    example: "Store openings, networking mixers, grand openings, community events",
    defaultPostingCadence: { preEventDays: 14, postEventDays: 7 },
  },
  promo: {
    id: "promo",
    name: "Promotion / Sale",
    icon: "🏷️",
    color: "bg-rose-100 text-rose-700 border-rose-300",
    accentColor: "from-rose-500 to-pink-500",
    aiTone: "Urgent, exciting, sales-focused tone",
    description: "Limited-time offers, sales, special promotions, discounts",
    example: "Flash sales, seasonal specials, limited-time offers, discounts",
    defaultPostingCadence: { preEventDays: 3, postEventDays: 1 },
  },
};
