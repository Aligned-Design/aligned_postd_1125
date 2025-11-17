export type ChannelId =
  | "instagram"
  | "facebook"
  | "threads"
  | "linkedin"
  | "twitter"
  | "tiktok"
  | "google_business"
  | "pinterest"
  | "youtube"
  | "squarespace"
  | "mailchimp"
  | "wordpress"
  | "canva"
  | "bluesky"
  | "snapchat";

export type ChannelCategory = "social" | "email" | "blog" | "design";

export interface ChannelConfig {
  id: ChannelId;
  name: string;
  category: ChannelCategory;
  capabilities: string[];
  phase: "phase1" | "phase2" | "later";
}

export const CHANNELS: ChannelConfig[] = [
  {
    id: "instagram",
    name: "Instagram",
    category: "social",
    capabilities: ["create_post", "schedule", "stories", "reels", "analytics_pull"],
    phase: "phase1",
  },
  {
    id: "facebook",
    name: "Facebook",
    category: "social",
    capabilities: ["create_post", "schedule", "analytics_pull"],
    phase: "phase1",
  },
  {
    id: "threads",
    name: "Threads",
    category: "social",
    capabilities: ["create_post"],
    phase: "phase2",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    category: "social",
    capabilities: ["create_post", "analytics_pull"],
    phase: "phase1",
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    category: "social",
    capabilities: ["create_post", "analytics_pull"],
    phase: "phase1",
  },
  {
    id: "tiktok",
    name: "TikTok",
    category: "social",
    capabilities: ["video_upload", "schedule", "analytics_pull"],
    phase: "phase1",
  },
  {
    id: "google_business",
    name: "Google Business Profile",
    category: "social",
    capabilities: ["create_post", "analytics_pull"],
    phase: "phase1",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    category: "social",
    capabilities: ["create_post", "analytics_pull"],
    phase: "phase2",
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "social",
    capabilities: ["video_upload", "analytics_pull"],
    phase: "phase2",
  },
  {
    id: "squarespace",
    name: "Squarespace",
    category: "blog",
    capabilities: ["blog_publish"],
    phase: "phase2",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    category: "email",
    capabilities: ["email_send", "campaign_send"],
    phase: "phase2",
  },
  {
    id: "wordpress",
    name: "WordPress",
    category: "blog",
    capabilities: ["blog_publish"],
    phase: "phase2",
  },
  {
    id: "canva",
    name: "Canva",
    category: "design",
    capabilities: ["design_editor", "asset_sync"],
    phase: "phase2",
  },
  {
    id: "bluesky",
    name: "Bluesky",
    category: "social",
    capabilities: ["create_post"],
    phase: "later",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    category: "social",
    capabilities: ["video_upload"],
    phase: "later",
  },
];

export const CHANNELS_BY_ID = Object.fromEntries(
  CHANNELS.map((c) => [c.id, c])
);


