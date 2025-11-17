export type UserRole =
  | "admin"
  | "strategy_manager"
  | "brand_manager"
  | "approver"
  | "viewer";

export interface DashboardMetrics {
  id: string;
  brand_id: string;
  metric_date: string;
  reach: number;
  engagement: number;
  engagement_rate: number;
  posts_published: number;
  followers_gained: number;
  ctr: number;
  platform_breakdown: Record<string, number>;
  top_posts: TopPost[];
  advisor_insights: AdvisorInsight[];
  created_at: string;
  updated_at: string;
}

export interface TopPost {
  id: string;
  title: string;
  platform: string;
  thumbnail?: string;
  reach: number;
  engagement: number;
  engagement_rate: number;
  published_at: string;
}

export interface AdvisorInsight {
  id: string;
  title: string;
  description: string;
  impact: string;
  source_posts?: string[];
  icon?: string;
  type: "time" | "topic" | "format" | "hashtag" | "audience";
}

export interface ClientPortalSettings {
  id: string;
  brand_id: string;
  enabled: boolean;
  logo_url?: string;
  header_image_url?: string;
  accent_color?: string;
  custom_domain?: string;
  modules_enabled: string[];
  default_date_range: number;
  allow_share_links: boolean;
  footer_text?: string;
  support_link?: string;
  created_at: string;
  updated_at: string;
}

export interface ShareLink {
  id: string;
  brand_id: string;
  token: string;
  name?: string;
  scope: {
    modules?: string[];
    platforms?: string[];
  };
  date_range_days: number;
  expires_at?: string;
  passcode_hash?: string;
  allow_download: boolean;
  watermark_logo: boolean;
  view_count: number;
  last_accessed_at?: string;
  revoked_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientUpload {
  id: string;
  brand_id: string;
  uploaded_by?: string;
  file_name: string;
  storage_path: string;
  file_type?: string;
  file_size_bytes?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
  thumbnail_url?: string;
  tags?: string[];
  notes?: string;
  campaign?: string;
  status: "pending" | "approved" | "rejected" | "in_use";
  assigned_to?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentVersion {
  id: string;
  post_id: string;
  version_number: number;
  caption?: string;
  media_urls?: string[];
  hashtags?: string[];
  changes_summary?: string;
  changed_by?: string;
  created_at: string;
}

export interface ClientMessage {
  id: string;
  brand_id: string;
  message_type: "update" | "comment" | "notification";
  title?: string;
  content: string;
  metadata: Record<string, unknown>;
  from_user_id?: string;
  to_user_id?: string;
  read_at?: string;
  email_sent: boolean;
  created_at: string;
}

export interface ApprovalComment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  comment_type: "feedback" | "approval" | "rejection" | "mention";
  mentions?: string[];
  created_at: string;
}

export interface DashboardSummary {
  reach: number;
  reachChange: number;
  engagement: number;
  engagementChange: number;
  posts: number;
  postsChange: number;
  followers: number;
  followersChange: number;
}

export interface PipelineStats {
  draft: number;
  review: number;
  approved: number;
  scheduled: number;
  published: number;
}

export interface ConnectionHealth {
  platform: string;
  status: "connected" | "expiring" | "expired" | "disconnected";
  expiresIn?: number;
  lastPublish?: Date;
  icon: string;
  color: string;
}
