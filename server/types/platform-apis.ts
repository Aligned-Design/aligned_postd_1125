/**
 * Platform API Response Types
 * TypeScript interfaces for various social media platform API responses
 */

// ============================================================================
// INSTAGRAM API TYPES
// ============================================================================

export interface InstagramMediaInsight {
  name: string;
  values: Array<{
    value: number;
    end_time?: string;
  }>;
  title?: string;
  description?: string;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL";
  timestamp: string;
  like_count: number;
  comments_count: number;
  insights?: {
    data: InstagramMediaInsight[];
  };
}

export interface InstagramMediaResponse {
  data: InstagramMedia[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

export interface InstagramInsight {
  name: string;
  period: string;
  values: Array<{
    value: number;
  }>;
  title?: string;
  description?: string;
}

export interface InstagramAccountInsightsResponse {
  data: InstagramInsight[];
}

// ============================================================================
// FACEBOOK API TYPES
// ============================================================================

export interface FacebookInsight {
  name: string;
  period: string;
  values: Array<{
    value: number;
  }>;
  title?: string;
  description?: string;
}

export interface FacebookPost {
  id: string;
  created_time: string;
  type: string;
  story?: string;
  permalink_url?: string;
  message?: string;
  insights?: {
    data: FacebookInsight[];
  };
}

export interface FacebookPostsResponse {
  data: FacebookPost[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

// ============================================================================
// TWITTER/X API TYPES
// ============================================================================

export interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  author_id?: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

export interface TwitterTweetsResponse {
  data: TwitterTweet[];
  meta?: {
    result_count: number;
    newest_id?: string;
    oldest_id?: string;
    next_token?: string;
  };
}

// ============================================================================
// TIKTOK API TYPES
// ============================================================================

export interface TikTokVideo {
  id: string;
  create_time: number;
  text?: string;
  statistics?: {
    video_views: number;
    video_likes: number;
    video_comments: number;
    video_shares: number;
  };
}

export interface TikTokVideosResponse {
  data: {
    videos: TikTokVideo[];
  };
}

// ============================================================================
// GOOGLE BUSINESS API TYPES
// ============================================================================

export interface GoogleBusinessInsight {
  metric: string;
  totalValue: {
    value: number;
  };
  timeSeries?: Array<{
    date: {
      year: number;
      month: number;
      day: number;
    };
    values: Array<{
      value: number;
    }>;
  }>;
}

export interface GoogleBusinessInsightsResponse {
  locationInsights: Array<{
    location: string;
    metrics: GoogleBusinessInsight[];
  }>;
}

// ============================================================================
// PINTEREST API TYPES
// ============================================================================

export interface PinterestPin {
  id: string;
  url?: string;
  description?: string;
  created_at: string;
  note?: string;
  board?: {
    id: string;
    name: string;
  };
}

export interface PinterestPinsResponse {
  data: PinterestPin[];
  page?: {
    cursor: string;
  };
}

// ============================================================================
// YOUTUBE API TYPES
// ============================================================================

export interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  statistics?: {
    viewCount: string;
    likeCount?: string;
    commentCount: string;
  };
}

export interface YouTubePlaylistItemsResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
}

// ============================================================================
// LINKEDIN API TYPES
// ============================================================================

export interface LinkedInPost {
  id: string;
  text?: string;
  createdTime: number;
  lastModifiedTime?: number;
  visibility?: {
    "com.linkedin.ugc.MemberNetworkVisibility": string;
  };
}

export interface LinkedInPostsResponse {
  elements: LinkedInPost[];
  paging?: {
    start: number;
    count: number;
    total?: number;
  };
}

export interface LinkedInAnalytics {
  totalShareStatistics?: {
    shareCount: number;
    viewCount: number;
    commentCount: number;
    likeCount: number;
  };
}

// ============================================================================
// SNAPCHAT API TYPES
// ============================================================================

export interface SnapchatPost {
  id: string;
  created_at: string;
  snap_media_type: string;
  stats?: {
    impressions: number;
    swipes: number;
    attachments: number;
  };
}

export interface SnapchatPostsResponse {
  results: SnapchatPost[];
  paging?: {
    cursors: {
      next: string;
    };
  };
}

// ============================================================================
// GENERIC PLATFORM RESPONSE WRAPPER
// ============================================================================

export interface PlatformApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  statusCode: number;
}

export interface PlatformPostData {
  id: string;
  platform: string;
  postTime: string | number;
  text?: string;
  engagementMetrics?: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
  };
  rawData?: unknown;
}
