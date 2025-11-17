import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Music,
  Youtube,
  MapPin,
} from "lucide-react";

export type PostStatus = "draft" | "reviewing" | "scheduled" | "published" | "errored";

export interface Post {
  id: string;
  title: string;
  platform: "linkedin" | "instagram" | "facebook" | "twitter" | "tiktok" | "youtube" | "pinterest";
  status: PostStatus;
  brand: string;
  campaign: string;
  createdDate: string;
  scheduledDate?: string;
  excerpt: string;
  errorMessage?: string;
}

export const PLATFORM_ICONS: Record<string, React.ComponentType<any>> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Music,
  youtube: Youtube,
  pinterest: MapPin,
};

export const PLATFORM_NAMES: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  twitter: "Twitter",
  tiktok: "TikTok",
  youtube: "YouTube",
  pinterest: "Pinterest",
};
