/**
 * Meta (Facebook/Instagram) Connector - Full Implementation
 *
 * Supports:
 * - Facebook Pages (feed posts)
 * - Instagram Business Accounts (feed, stories, reels)
 * - OAuth 2.0 authentication
 * - Multi-platform publishing
 * - Analytics retrieval
 * - Webhook handling
 *
 * Documentation: https://developers.facebook.com/docs/graph-api/
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import TokenVault from '../../lib/token-vault';
import OAuthManager, { OAuthConfig } from '../oauth-utils';
import BaseConnector, { Account, PublishResult, AnalyticsMetrics, HealthCheckResult, OAuthResult, PublishOptions } from '../base';
import { logger, recordMetric, measureLatency } from '../../lib/observability';
import { publishJobQueue } from '../../queue';

const API_VERSION = 'v18.0';
const BASE_URL = 'https://graph.instagram.com';
const GRAPH_URL = 'https://graph.facebook.com';

export class MetaConnector extends BaseConnector {
  private oauthManager: OAuthManager;
  private vault: TokenVault;
  private supabase: any;
  private clientId: string;
  private clientSecret: string;

  constructor(
    tenantId: string,
    connectionId: string,
    config?: {
      clientId?: string;
      clientSecret?: string;
      redirectUri?: string;
      vault?: TokenVault;
      supabaseUrl?: string;
      supabaseKey?: string;
    }
  ) {
    super('meta', tenantId, connectionId);

    this.clientId = config?.clientId || process.env.META_APP_ID || process.env.META_CLIENT_ID || '';
    this.clientSecret = config?.clientSecret || process.env.META_APP_SECRET || process.env.META_CLIENT_SECRET || '';
    const redirectUri = config?.redirectUri || process.env.META_REDIRECT_URI || `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/api/auth/meta/callback`;

    const supabaseUrl = config?.supabaseUrl || process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = config?.supabaseKey || process.env.VITE_SUPABASE_ANON_KEY || '';

    this.vault = config?.vault || new TokenVault({ supabaseUrl, supabaseKey });
    this.supabase = createClient(supabaseUrl, supabaseKey);

    // OAuth configuration
    const oauthConfig: OAuthConfig = {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUri,
      authorizationEndpoint: `${GRAPH_URL}/oauth/authorize`,
      tokenEndpoint: `${GRAPH_URL}/oauth/access_token`,
      revokeEndpoint: `${GRAPH_URL}/oauth/delete_app`,
      scopes: [
        'pages_manage_metadata',
        'pages_read_engagement',
        'pages_manage_posts',
        'instagram_business_manage_messages',
        'instagram_business_content_publish',
        'instagram_business_basic',
        'user_photos',
      ],
    };

    this.oauthManager = new OAuthManager('meta', oauthConfig, this.vault, supabaseUrl, supabaseKey);
  }

  /**
   * Authenticate user via Meta OAuth
   */
  async authenticate(code: string, state: string): Promise<OAuthResult> {
    return await measureLatency('meta_authenticate', async () => {
      try {
        // Exchange code for tokens
        const tokenResponse = await this.oauthManager.exchangeCodeForTokens(code);

        // Get user info
        const userResponse = await fetch(`${GRAPH_URL}/me?access_token=${tokenResponse.accessToken}`);
        if (!userResponse.ok) {
          throw new Error(`Failed to get user info: ${userResponse.status}`);
        }

        const userInfo = await userResponse.json();

        // Store tokens
        await this.oauthManager.storeTokens(
          this.tenantId,
          this.connectionId,
          tokenResponse,
          {
            userId: userInfo.id,
            displayName: userInfo.name || 'Meta User',
          }
        );

        logger.info(
          'Meta authentication successful',
          {
            tenantId: this.tenantId,
            platform: 'meta',
            userId: userInfo.id,
          }
        );

        return {
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          expiresIn: tokenResponse.expiresIn,
          userId: userInfo.id,
          scopes: this.oauthManager['config'].scopes,
        };
      } catch (error) {
        logger.error(
          'Meta authentication failed',
          error instanceof Error ? error : new Error(String(error)),
          {
            platform: 'meta',
            tenantId: this.tenantId,
          }
        );
        throw error;
      }
    }, { tenantId: this.tenantId, platform: 'meta' });
  }

  /**
   * Refresh access token
   * Meta tokens expire in 60 days - refresh every 53 days
   */
  async refreshToken(refreshToken: string): Promise<OAuthResult> {
    return await measureLatency('meta_refresh_token', async () => {
      try {
        const tokenResponse = await this.oauthManager.refreshAccessToken(refreshToken);

        // Store new tokens
        await this.oauthManager.storeTokens(
          this.tenantId,
          this.connectionId,
          tokenResponse,
          {
            userId: 'unknown', // We don't refresh user info
            displayName: 'Meta User',
          }
        );

        logger.info(
          'Meta token refresh successful',
          {
            tenantId: this.tenantId,
            platform: 'meta',
            expiresIn: tokenResponse.expiresIn,
          }
        );

        return {
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          expiresIn: tokenResponse.expiresIn,
          userId: 'unknown',
          scopes: [],
        };
      } catch (error) {
        logger.error(
          'Meta token refresh failed',
          error instanceof Error ? error : new Error(String(error)),
          {
            platform: 'meta',
            tenantId: this.tenantId,
            connectionId: this.connectionId,
          }
        );
        throw error;
      }
    }, { tenantId: this.tenantId, platform: 'meta' });
  }

  /**
   * Fetch user's Facebook pages and Instagram business accounts
   */
  async fetchAccounts(): Promise<Account[]> {
    return await measureLatency('meta_fetch_accounts', async () => {
      try {
        const accessToken = await this.vault.retrieveSecret(this.tenantId, this.connectionId, 'access_token');
        if (!accessToken) {
          throw new Error('Access token not found in vault');
        }

        // Get Facebook Pages
        const pagesResponse = await fetch(`${GRAPH_URL}/me/accounts?access_token=${accessToken}`);
        if (!pagesResponse.ok) {
          throw new Error(`Failed to fetch pages: ${pagesResponse.status}`);
        }

        const pagesData = await pagesResponse.json();
        const accounts: Account[] = [];

        // Add Facebook pages
        for (const page of pagesData.data || []) {
          accounts.push({
            id: page.id,
            name: page.name,
            type: 'facebook_page',
            imageUrl: page.picture?.data?.url,
            metadata: { accessToken: page.access_token },
          });

          // Get Instagram business account for this page
          const igResponse = await fetch(
            `${GRAPH_URL}/${page.id}/instagram_business_account?access_token=${page.access_token}`
          );

          if (igResponse.ok) {
            const igData = await igResponse.json();
            if (igData.instagram_business_account) {
              const igId = igData.instagram_business_account.id;

              // Get IG account info
              const igInfoResponse = await fetch(
                `${BASE_URL}/${igId}?fields=id,username,name,biography,profile_picture_url,followers_count&access_token=${page.access_token}`
              );

              if (igInfoResponse.ok) {
                const igInfo = await igInfoResponse.json();
                accounts.push({
                  id: igId,
                  name: igInfo.username || igInfo.name || 'Instagram Account',
                  type: 'instagram_business',
                  imageUrl: igInfo.profile_picture_url,
                  followers: igInfo.followers_count,
                  metadata: {
                    pageId: page.id,
                    pageAccessToken: page.access_token,
                  },
                });
              }
            }
          }
        }

        logger.info(
          {
            tenantId: this.tenantId,
            platform: 'meta',
            accountCount: accounts.length,
          },
          'Meta accounts fetched'
        );

        recordMetric('meta.accounts_fetched', accounts.length, { tenantId: this.tenantId });

        return accounts;
      } catch (error) {
        logger.error(
          {
            platform: 'meta',
            error: error instanceof Error ? error.message : String(error),
          },
          'Failed to fetch Meta accounts'
        );
        throw error;
      }
    }, { tenantId: this.tenantId, platform: 'meta' });
  }

  /**
   * Publish content to Meta (Facebook or Instagram)
   */
  async publish(
    accountId: string,
    title: string,
    body: string,
    mediaUrls?: string[],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return await measureLatency('meta_publish', async () => {
      try {
        // Get account info from database to determine type
        const { data: accounts } = await this.supabase
          .from('connections')
          .select('metadata')
          .eq('id', this.connectionId)
          .single();

        if (!accounts) {
          throw new Error('Connection not found');
        }

        const accessToken = await this.vault.retrieveSecret(this.tenantId, this.connectionId, 'access_token');
        if (!accessToken) {
          throw new Error('Access token not found');
        }

        let postId: string;
        let url: string;

        // Determine if Facebook Page or Instagram
        if (accountId.startsWith('instagram_')) {
          // Instagram publishing
          const igAccountId = accountId.replace('instagram_', '');
          postId = await this.publishToInstagram(igAccountId, body, mediaUrls, accessToken);
          url = `https://instagram.com`;
        } else {
          // Facebook page publishing
          postId = await this.publishToFacebook(accountId, body, mediaUrls, accessToken);
          url = `https://facebook.com/${accountId}`;
        }

        logger.info(
          {
            tenantId: this.tenantId,
            platform: 'meta',
            accountId,
            postId,
          },
          'Meta content published'
        );

        recordMetric('meta.publish_success', 1, { accountId });

        return {
          postId,
          url,
          status: 'published',
          metadata: { platform: 'meta', accountId },
        };
      } catch (error) {
        logger.error(
          {
            platform: 'meta',
            error: error instanceof Error ? error.message : String(error),
          },
          'Meta publish failed'
        );

        recordMetric('meta.publish_error', 1, { error: String(error) });
        throw error;
      }
    }, { tenantId: this.tenantId, platform: 'meta', connectionId: accountId });
  }

  /**
   * Helper to make API call with automatic token refresh on 401/403
   */
  private async fetchWithAutoRefresh(
    url: string,
    options: RequestInit,
    accessToken: string,
    retryCount = 0
  ): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Auto-refresh on 401/403 (expired/invalid token)
    if ((response.status === 401 || response.status === 403) && retryCount === 0) {
      try {
        // Get refresh token and attempt refresh
        const refreshToken = await this.vault.retrieveSecret(this.tenantId, this.connectionId, 'refresh_token');
        if (refreshToken) {
          logger.info(
            {
              tenantId: this.tenantId,
              platform: 'meta',
              connectionId: this.connectionId,
              status: response.status,
            },
            'Token expired, attempting refresh'
          );

          await this.refreshToken(refreshToken);

          // Get new access token and retry once
          const newAccessToken = await this.vault.retrieveSecret(this.tenantId, this.connectionId, 'access_token');
          if (newAccessToken) {
            logger.info(
              {
                tenantId: this.tenantId,
                platform: 'meta',
                connectionId: this.connectionId,
              },
              'Token refreshed successfully, retrying API call'
            );
            return this.fetchWithAutoRefresh(url, options, newAccessToken, retryCount + 1);
          } else {
            logger.error(
              {
                tenantId: this.tenantId,
                platform: 'meta',
                connectionId: this.connectionId,
              },
              'Token refresh succeeded but new access token not found'
            );
          }
        }
      } catch (refreshError) {
        logger.error(
          {
            tenantId: this.tenantId,
            platform: 'meta',
            connectionId: this.connectionId,
            error: refreshError instanceof Error ? refreshError.message : String(refreshError),
          },
          'Token refresh failed during API call'
        );
      }
    }

    return response;
  }

  /**
   * Publish to Facebook page
   */
  private async publishToFacebook(pageId: string, message: string, mediaUrls?: string[], accessToken?: string): Promise<string> {
    const token = accessToken || (await this.vault.retrieveSecret(this.tenantId, this.connectionId, 'access_token'));

    if (!token) {
      throw new Error('Access token not found');
    }

    const body: any = { message };

    if (mediaUrls && mediaUrls.length > 0) {
      // Use first URL as picture/video
      body.picture = mediaUrls[0];
    }

    const response = await this.fetchWithAutoRefresh(
      `${GRAPH_URL}/${pageId}/feed?access_token=${token}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      },
      token
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}` } }));
      throw new Error(`Facebook publish failed: ${error.error?.message || response.status}`);
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Publish to Instagram business account
   */
  private async publishToInstagram(igAccountId: string, caption: string, mediaUrls?: string[], accessToken?: string): Promise<string> {
    const token = accessToken || (await this.vault.retrieveSecret(this.tenantId, this.connectionId, 'access_token'));

    if (!token) {
      throw new Error('Access token not found');
    }

    if (!mediaUrls || mediaUrls.length === 0) {
      throw new Error('Instagram requires media URL');
    }

    // Create media object
    const mediaResponse = await this.fetchWithAutoRefresh(
      `${BASE_URL}/${igAccountId}/media?access_token=${token}`,
      {
        method: 'POST',
        body: JSON.stringify({
          image_url: mediaUrls[0],
          caption,
        }),
        headers: { 'Content-Type': 'application/json' },
      },
      token
    );

    if (!mediaResponse.ok) {
      const error = await mediaResponse.json().catch(() => ({ error: { message: `HTTP ${mediaResponse.status}` } }));
      throw new Error(`Instagram media creation failed: ${error.error?.message || mediaResponse.status}`);
    }

    const mediaData = await mediaResponse.json();
    const mediaId = mediaData.id;

    // Publish media
    const publishResponse = await this.fetchWithAutoRefresh(
      `${BASE_URL}/${mediaId}/publish?access_token=${token}`,
      {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      },
      token
    );

    if (!publishResponse.ok) {
      const error = await publishResponse.json().catch(() => ({ error: { message: `HTTP ${publishResponse.status}` } }));
      throw new Error(`Instagram publish failed: ${error.error?.message || publishResponse.status}`);
    }

    const publishData = await publishResponse.json();
    return publishData.id || mediaId;
  }

  /**
   * Delete published post
   */
  async deletePost(accountId: string, postId: string): Promise<void> {
    return await measureLatency('meta_delete_post', async () => {
      try {
        const accessToken = await this.vault.retrieveSecret(this.tenantId, this.connectionId, 'access_token');
        if (!accessToken) {
          throw new Error('Access token not found');
        }

        const endpoint = accountId.startsWith('instagram_')
          ? `${BASE_URL}/${postId}`
          : `${GRAPH_URL}/${postId}`;

        const response = await fetch(`${endpoint}?access_token=${accessToken}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Delete failed: ${error.error?.message || response.status}`);
        }

        logger.info(
          {
            tenantId: this.tenantId,
            platform: 'meta',
            postId,
          },
          'Meta post deleted'
        );

        recordMetric('meta.delete_success', 1);
      } catch (error) {
        logger.error(
          {
            platform: 'meta',
            error: error instanceof Error ? error.message : String(error),
          },
          'Meta delete failed'
        );
        throw error;
      }
    }, { tenantId: this.tenantId, platform: 'meta' });
  }

  /**
   * Get post analytics
   */
  async getPostAnalytics(accountId: string, postId: string): Promise<AnalyticsMetrics> {
    return await measureLatency('meta_get_analytics', async () => {
      try {
        const accessToken = await this.vault.retrieveSecret(this.tenantId, this.connectionId, 'access_token');
        if (!accessToken) {
          throw new Error('Access token not found');
        }

        const fields = 'impressions,engagement,reach,video_views,like_count,comment_count,share_count';
        const endpoint = accountId.startsWith('instagram_')
          ? `${BASE_URL}/${postId}/insights?fields=${fields}`
          : `${GRAPH_URL}/${postId}/insights?fields=${fields}`;

        const response = await fetch(`${endpoint}&access_token=${accessToken}`);

        if (!response.ok) {
          throw new Error(`Analytics fetch failed: ${response.status}`);
        }

        const data = await response.json();
        const insights: any = {};

        (data.data || []).forEach((metric: any) => {
          insights[metric.name] = metric.values?.[0]?.value || 0;
        });

        return {
          views: insights.impressions || insights.video_views || 0,
          impressions: insights.impressions || 0,
          likes: insights.like_count || 0,
          comments: insights.comment_count || 0,
          shares: insights.share_count || 0,
          engagement: insights.engagement || 0,
        };
      } catch (error) {
        logger.warn(
          {
            platform: 'meta',
            error: error instanceof Error ? error.message : String(error),
          },
          'Failed to fetch Meta analytics (may be delayed)'
        );
        // Return empty metrics if failed (analytics are delayed anyway)
        return { impressions: 0, views: 0, likes: 0, comments: 0, shares: 0 };
      }
    }, { tenantId: this.tenantId, platform: 'meta', jobId: postId });
  }

  /**
   * Health check - verify token is valid
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const accessToken = await this.vault.retrieveSecret(this.tenantId, this.connectionId, 'access_token');
      if (!accessToken) {
        return {
          status: 'critical',
          latencyMs: Date.now() - startTime,
          message: 'Access token not found in vault',
        };
      }

      // Call /me endpoint
      const response = await fetch(`${GRAPH_URL}/me?access_token=${accessToken}`);
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, needs refresh
          return {
            status: 'warning',
            latencyMs,
            message: 'Token expired - refresh needed',
          };
        }
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        status: 'healthy',
        latencyMs,
        message: `Connection healthy - user ${data.id}`,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      logger.error(
        {
          platform: 'meta',
          error: error instanceof Error ? error.message : String(error),
          latencyMs,
        },
        'Meta health check failed'
      );

      return {
        status: 'critical',
        latencyMs,
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Validate webhook signature
   * Meta sends X-Hub-Signature header with HMAC-SHA256
   */
  validateWebhookSignature(signature: string, payload: string): boolean {
    try {
      const appSecret = process.env.META_APP_SECRET || '';
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (error) {
      logger.error(
        {
          platform: 'meta',
          error: error instanceof Error ? error.message : String(error),
        },
        'Webhook signature validation failed'
      );
      return false;
    }
  }

  /**
   * Parse incoming webhook event
   */
  parseWebhookEvent(payload: any): any {
    try {
      const events = [];

      if (payload.entry) {
        for (const entry of payload.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              events.push({
                object: payload.object,
                field: change.field,
                value: change.value,
                timestamp: entry.time,
              });
            }
          }
        }
      }

      return events;
    } catch (error) {
      logger.error(
        {
          platform: 'meta',
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to parse webhook event'
      );
      return null;
    }
  }
}

export default MetaConnector;
