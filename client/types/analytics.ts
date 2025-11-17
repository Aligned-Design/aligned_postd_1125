export interface PlatformMetrics {
  platform: "facebook" | "instagram" | "linkedin" | "tiktok" | "youtube" | "twitter" | "pinterest";
  icon: string;
  color: string;
  period: string;
  metrics: {
    reach: number;
    engagement: number;
    engagementRate: number;
    followers: number;
    followerGrowth: number;
    topContent: {
      title: string;
      type: "post" | "reel" | "video" | "story";
      engagement: number;
      reach: number;
      icon: string;
    }[];
  };
  comparison?: {
    reachChange: number;
    engagementChange: number;
    followerChange: number;
    period: string;
  };
}

export interface AnalyticsInsight {
  id: string;
  platform: string;
  icon: string;
  title: string;
  description: string;
  metric: string;
  actionLabel: string;
  priority: "high" | "medium" | "low";
  type: "opportunity" | "warning" | "suggestion";
}

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
  days?: number;
}

export const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "📘", color: "from-blue-500 to-blue-600" },
  { id: "instagram", name: "Instagram", icon: "📸", color: "from-pink-500 to-purple-600" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", color: "from-blue-700 to-blue-800" },
  { id: "tiktok", name: "TikTok", icon: "🎵", color: "from-slate-800 to-slate-900" },
  { id: "youtube", name: "YouTube", icon: "📺", color: "from-red-500 to-red-600" },
  { id: "twitter", name: "Twitter/X", icon: "𝕏", color: "from-slate-900 to-black" },
  { id: "pinterest", name: "Pinterest", icon: "📌", color: "from-red-600 to-red-700" },
];

export const DATE_RANGES: DateRange[] = [
  { startDate: "2024-11-08", endDate: "2024-11-14", label: "Last 7 Days" },
  { startDate: "2024-10-08", endDate: "2024-11-07", label: "Last 30 Days" },
  { startDate: "2024-08-08", endDate: "2024-11-07", label: "Last 3 Months" },
  { startDate: "2023-11-08", endDate: "2024-11-07", label: "Last Year" },
];
