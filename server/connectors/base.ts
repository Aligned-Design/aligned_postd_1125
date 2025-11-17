/**
 * Base Connector Interface
 *
 * All platform connectors must implement this interface
 * Provides standardized method signatures for OAuth, publishing, etc.
 */

export interface Account {
  id: string;
  name: string;
  type: string; // 'page', 'profile', 'organization', etc.
  imageUrl?: string;
  followers?: number;
  metadata?: Record<string, any>;
}

export interface PublishOptions {
  scheduledFor?: Date; // For scheduled publishing
  metadata?: Record<string, any>; // Platform-specific options
}

export interface PublishResult {
  postId: string;
  url?: string;
  scheduledAt?: Date;
  status: 'published' | 'scheduled' | 'draft';
  metadata?: Record<string, any>;
}

export interface AnalyticsMetrics {
  views?: number;
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  clicks?: number;
  engagementRate?: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  latencyMs: number;
  message: string;
}

export interface OAuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  userId: string;
  scopes: string[];
}

/**
 * Base Connector Class
 * All platform connectors extend this
 */
export abstract class BaseConnector {
  protected platform: string;
  protected tenantId: string;
  protected connectionId: string;

  constructor(platform: string, tenantId: string, connectionId: string) {
    this.platform = platform;
    this.tenantId = tenantId;
    this.connectionId = connectionId;
  }

  /**
   * Authenticate with platform (OAuth callback handler)
   */
  abstract authenticate(code: string, state: string): Promise<OAuthResult>;

  /**
   * Refresh access token
   */
  abstract refreshToken(refreshToken: string): Promise<OAuthResult>;

  /**
   * Fetch user's accounts/profiles
   */
  abstract fetchAccounts(): Promise<Account[]>;

  /**
   * Publish content to platform
   */
  abstract publish(
    accountId: string,
    title: string,
    body: string,
    mediaUrls?: string[],
    options?: PublishOptions
  ): Promise<PublishResult>;

  /**
   * Delete published post
   */
  abstract deletePost(accountId: string, postId: string): Promise<void>;

  /**
   * Get analytics for a post
   */
  abstract getPostAnalytics(accountId: string, postId: string): Promise<AnalyticsMetrics>;

  /**
   * Check connection health
   */
  abstract healthCheck(): Promise<HealthCheckResult>;

  /**
   * Validate webhook signature
   */
  abstract validateWebhookSignature(signature: string, payload: string): boolean;

  /**
   * Parse webhook event
   */
  abstract parseWebhookEvent(payload: any): any;
}

export default BaseConnector;
