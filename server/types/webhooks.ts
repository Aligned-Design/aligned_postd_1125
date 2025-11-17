/**
 * Webhook Payload Types
 * TypeScript interfaces for platform webhook events
 */

// ============================================================================
// INSTAGRAM WEBHOOK TYPES
// ============================================================================

export interface InstagramWebhookEvent {
  object: 'instagram';
  entry: Array<{
    id: string;
    time: number;
    changes: Array<{
      value: {
        id: string;
        caption?: string;
        media_type?: string;
        story_type?: string;
        like_count?: number;
        comments_count?: number;
        timestamp?: string;
      };
      field: string;
    }>;
  }>;
}

// ============================================================================
// FACEBOOK WEBHOOK TYPES
// ============================================================================

export interface FacebookWebhookEvent {
  object: 'page';
  entry: Array<{
    id: string;
    time: number;
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        attachments?: Array<{
          type: string;
          payload: Record<string, unknown>;
        }>;
      };
      postback?: {
        title: string;
        payload: string;
      };
    }>;
    changes?: Array<{
      value: {
        post_id?: string;
        status?: string;
        permalink_url?: string;
        created_time?: string;
        type?: string;
        story?: string;
      };
      field: string;
    }>;
  }>;
}

// ============================================================================
// TWITTER/X WEBHOOK TYPES
// ============================================================================

export interface TwitterWebhookEvent {
  for_user_id: string;
  data: {
    id: string;
    text: string;
    created_at?: string;
    author_id?: string;
    public_metrics?: {
      retweet_count: number;
      reply_count: number;
      like_count: number;
      quote_count: number;
    };
  };
  includes?: {
    users?: Array<{
      id: string;
      name: string;
      username: string;
    }>;
    tweets?: Array<{
      id: string;
      text: string;
    }>;
  };
}

// ============================================================================
// TIKTOK WEBHOOK TYPES
// ============================================================================

export interface TikTokWebhookEvent {
  data: {
    event_type: string;
    timestamp: number;
    video?: {
      id: string;
      title: string;
      create_time: number;
      views: number;
      likes: number;
      comments: number;
      shares: number;
    };
    user?: {
      id: string;
      display_name: string;
      avatar: string;
    };
  };
}

// ============================================================================
// YOUTUBE WEBHOOK TYPES
// ============================================================================

export interface YouTubeWebhookEvent {
  kind: 'youtube#subscription';
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    title: string;
    description: string;
    resourceId: {
      kind: string;
      channelId: string;
    };
    publisherDetails: {
      displayName: string;
    };
  };
}

// ============================================================================
// LINKEDIN WEBHOOK TYPES
// ============================================================================

export interface LinkedInWebhookEvent {
  eventMuxes?: Array<{
    events: Array<{
      eventType: string;
      timestamp: number;
      body: {
        '*': string;
      };
    }>;
  }>;
}

// ============================================================================
// PINTEREST WEBHOOK TYPES
// ============================================================================

export interface PinterestWebhookEvent {
  data: {
    id: string;
    created_timestamp: number;
    event_type: string;
    action_source: string;
  };
}

// ============================================================================
// SNAPCHAT WEBHOOK TYPES
// ============================================================================

export interface SnapchatWebhookEvent {
  events: Array<{
    id: string;
    timestamp: number;
    eventType: string;
    data: {
      id: string;
      created_at: string;
      stats?: {
        impressions: number;
        swipes: number;
      };
    };
  }>;
}

// ============================================================================
// GENERIC WEBHOOK TYPES
// ============================================================================

export type WebhookEvent =
  | InstagramWebhookEvent
  | FacebookWebhookEvent
  | TwitterWebhookEvent
  | TikTokWebhookEvent
  | YouTubeWebhookEvent
  | LinkedInWebhookEvent
  | PinterestWebhookEvent
  | SnapchatWebhookEvent;

export interface WebhookPayload {
  platform: string;
  event: WebhookEvent;
  signature: string;
  timestamp: number;
}

export interface WebhookLog {
  id: string;
  platform: string;
  eventType: string;
  payload: Record<string, unknown>;
  signature: string;
  isValid: boolean;
  processingStatus: 'pending' | 'processed' | 'failed';
  errorMessage?: string;
  processedAt?: string;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  url: string;
  payload: Record<string, unknown>;
  statusCode?: number;
  response?: string;
  retries: number;
  nextRetryAt?: string;
  succeededAt?: string;
  failedAt?: string;
  createdAt: string;
}

// ============================================================================
// WEBHOOK CONFIGURATION TYPES
// ============================================================================

export interface WebhookSubscription {
  id: string;
  brandId: string;
  platform: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookVerification {
  platform: string;
  challenge?: string;
  response_token?: string;
  timestamp?: number;
  signature?: string;
}
