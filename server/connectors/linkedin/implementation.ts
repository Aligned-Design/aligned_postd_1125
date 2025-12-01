/**
 * LinkedIn Connector - Full Implementation
 *
 * Supports:
 * - Personal profile posts
 * - Organization posts
 * - Text posts + image attachments
 * - OAuth 2.0 authentication
 * - Multi-platform publishing
 * - Health checks and token refresh
 *
 * Limitations:
 * - No native post scheduling (uses Bull queue workaround)
 * - No real-time engagement metrics (use Analytics dashboard or enterprise webhooks)
 * - Image upload is multi-step (register → upload → use asset)
 *
 * Documentation: https://learn.microsoft.com/en-us/linkedin/
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import TokenVault from '../../lib/token-vault';
import OAuthManager, { OAuthConfig } from '../oauth-utils';
import BaseConnector, {
  Account,
  PublishResult,
  AnalyticsMetrics,
  HealthCheckResult,
  OAuthResult,
  PublishOptions,
} from '../base';
import { logger, recordMetric, measureLatency } from '../../lib/observability';

const API_VERSION = 'v2';
const BASE_URL = 'https://api.linkedin.com';

/**
 * LinkedIn-specific account type for publishing
 */
interface LinkedInAccount extends Account {
  accountType: 'personal' | 'organization';
  userId?: string; // For personal profiles
  orgId?: string; // For organizations
  urn?: string; // Full URN identifier
}

export class LinkedInConnector extends BaseConnector {
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
    super('linkedin', tenantId, connectionId);

    this.clientId = config?.clientId || process.env.LINKEDIN_CLIENT_ID || '';
    this.clientSecret = config?.clientSecret || process.env.LINKEDIN_CLIENT_SECRET || '';
    const redirectUri =
      config?.redirectUri ||
      process.env.LINKEDIN_REDIRECT_URI ||
      `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/api/auth/linkedin/callback`;

    const supabaseUrl = config?.supabaseUrl || process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = config?.supabaseKey || process.env.VITE_SUPABASE_ANON_KEY || '';

    this.vault = config?.vault || new TokenVault({ supabaseUrl, supabaseKey });
    this.supabase = createClient(supabaseUrl, supabaseKey);

    // OAuth configuration for LinkedIn
    const oauthConfig: OAuthConfig = {
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUri,
      authorizationEndpoint: `https://www.linkedin.com/oauth/v2/authorization`,
      tokenEndpoint: `https://www.linkedin.com/oauth/v2/accessToken`,
      revokeEndpoint: `https://www.linkedin.com/oauth/v2/revoke`,
      scopes: ['openid', 'profile', 'email', 'w_member_social', 'r_ad_campaigns'],
    };

    this.oauthManager = new OAuthManager('linkedin', oauthConfig, this.vault, supabaseUrl, supabaseKey);
  }

  /**
   * Authenticate user via LinkedIn OAuth
   */
  async authenticate(code: string, state: string): Promise<OAuthResult> {
    return await measureLatency('linkedin_authenticate', async () => {
      try {
        // Exchange code for tokens
        const tokenResponse = await this.oauthManager.exchangeCodeForTokens(code);

        // Get user info
        const userResponse = await fetch(`${BASE_URL}/${API_VERSION}/me`, {
          headers: {
            Authorization: `Bearer ${tokenResponse.accessToken}`,
          },
        });

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
            displayName: `${userInfo.localizedFirstName} ${userInfo.localizedLastName}`,
            imageUrl: undefined,
          }
        );

        logger.info(
          {
            cycleId: this.connectionId,
            tenantId: this.tenantId,
            platform: 'linkedin',
            userId: userInfo.id,
          },
          '[LinkedIn] Authentication successful'
        );

        return {
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken || null,
          expiresIn: tokenResponse.expiresIn,
          userId: userInfo.id,
          scopes: ['w_member_social', 'r_ad_campaigns'],
        };
      } catch (error) {
        logger.error(
          {
            error: (error as Error).message,
            tenantId: this.tenantId,
            connectionId: this.connectionId,
          },
          '[LinkedIn] Authentication failed'
        );
        throw error;
      }
    }, { tenantId: this.tenantId, platform: 'linkedin' });
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<OAuthResult> {
    return await measureLatency('linkedin_refresh_token', async () => {
      try {
        const response = await fetch(`https://www.linkedin.com/oauth/v2/accessToken`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }).toString(),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Token refresh failed: ${response.status} - ${error}`);
        }

        const data = await response.json();

        // Store new tokens
        await this.oauthManager.storeTokens(
          this.tenantId,
          this.connectionId,
          {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || refreshToken, // LinkedIn may or may not return new refresh token
            expiresIn: data.expires_in || 3600,
            tokenType: data.token_type || 'Bearer',
            scope: data.scope,
          },
          {
            userId: '', // Not available during refresh
            displayName: '',
          }
        );

        logger.info(
          '[LinkedIn] Token refreshed',
          {
            cycleId: this.connectionId,
            tenantId: this.tenantId,
            platform: 'linkedin',
            latencyMs: measureLatency,
          }
        );

        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || refreshToken,
          expiresIn: data.expires_in,
          userId: undefined,
          scopes: ['w_member_social'],
        };
      } catch (error) {
        logger.error(
          {
            error: (error as Error).message,
            tenantId: this.tenantId,
            connectionId: this.connectionId,
          },
          '[LinkedIn] Token refresh failed'
        );
        throw error;
      }
    }, { tenantId: this.tenantId, platform: 'linkedin' });
  }

  /**
   * Fetch user's personal and organization accounts
   */
  async fetchAccounts(): Promise<LinkedInAccount[]> {
    return await measureLatency('linkedin_fetch_accounts', async () => {
      try {
        const accessToken = await this.vault.retrieveSecret(
          this.tenantId,
          this.connectionId,
          'access_token'
        );

        const accounts: LinkedInAccount[] = [];

        // Get personal profile
        const userResponse = await fetch(`${BASE_URL}/${API_VERSION}/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (userResponse.ok) {
          const userInfo = await userResponse.json();
          accounts.push({
            id: userInfo.id,
            name: `${userInfo.localizedFirstName} ${userInfo.localizedLastName}`,
            type: 'personal',
            imageUrl: undefined,
            accountType: 'personal',
            userId: userInfo.id,
            urn: `urn:li:person:${userInfo.id}`,
            metadata: { platform: 'linkedin' },
          });
        }

        // Get organizations the user can post on behalf of
        const orgsResponse = await fetch(
          `${BASE_URL}/${API_VERSION}/administratedDMFollowingEntities?q=creators`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (orgsResponse.ok) {
          const orgsData = await orgsResponse.json();
          if (orgsData.elements) {
            for (const org of orgsData.elements) {
              accounts.push({
                id: org.id.replace('urn:li:organization:', ''),
                name: org.name,
                type: 'organization',
                imageUrl: org.logo || undefined,
                accountType: 'organization',
                orgId: org.id.replace('urn:li:organization:', ''),
                urn: org.id,
                metadata: { platform: 'linkedin' },
              });
            }
          }
        }

        logger.info(
          {
            cycleId: this.connectionId,
            tenantId: this.tenantId,
            platform: 'linkedin',
            accountCount: accounts.length,
          },
          '[LinkedIn] Fetched accounts'
        );

        return accounts;
      } catch (error) {
        logger.error(
          {
            error: (error as Error).message,
            tenantId: this.tenantId,
            connectionId: this.connectionId,
          },
          '[LinkedIn] Failed to fetch accounts'
        );
        throw error;
      }
    }, { tenantId: this.tenantId, platform: 'linkedin' });
  }

  /**
   * Publish content to LinkedIn
   */
  async publish(
    accountId: string,
    title: string,
    body: string,
    mediaUrls?: string[],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return await measureLatency('linkedin_publish', async () => {
      try {
        const accessToken = await this.vault.retrieveSecret(
          this.tenantId,
          this.connectionId,
          'access_token'
        );

        // Determine if personal or organization post based on accountId
        const accounts = await this.fetchAccounts();
        const account = accounts.find((a) => a.id === accountId) as LinkedInAccount | undefined;

        if (!account) {
          throw new Error(`Account ${accountId} not found`);
        }

        let postId: string;

        if (mediaUrls && mediaUrls.length > 0) {
          postId = await this.publishWithMedia(account, title, body, mediaUrls, accessToken);
        } else {
          postId = await this.publishText(account, title, body, accessToken);
        }

        logger.info(
          {
            cycleId: this.connectionId,
            tenantId: this.tenantId,
            connectionId: this.connectionId,
            platform: 'linkedin',
            postId,
            accountType: account.accountType,
          },
          '[LinkedIn] Post published'
        );

        recordMetric('linkedin.publish.success', 1, {
          platform: 'linkedin',
          accountType: account.accountType,
        });

        return {
          postId,
          url: `https://linkedin.com/feed/update/${postId}`,
          status: 'published',
          metadata: {
            publishedAt: new Date().toISOString(),
            accountType: account.accountType,
          },
        };
      } catch (error) {
        logger.error(
          {
            error: (error as Error).message,
            tenantId: this.tenantId,
            connectionId: this.connectionId,
            accountId,
          },
          '[LinkedIn] Publish failed'
        );
        recordMetric('linkedin.publish.error', 1, {
          platform: 'linkedin',
          errorType: 'publish_failed',
        });
        throw error;
      }
    }, { tenantId: this.tenantId, platform: 'linkedin' });
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
              platform: 'linkedin',
              connectionId: this.connectionId,
              status: response.status,
            },
            '[LinkedIn] Token expired, attempting refresh'
          );

          await this.refreshToken(refreshToken);

          // Get new access token and retry once
          const newAccessToken = await this.vault.retrieveSecret(this.tenantId, this.connectionId, 'access_token');
          if (newAccessToken) {
            logger.info(
              {
                tenantId: this.tenantId,
                platform: 'linkedin',
                connectionId: this.connectionId,
              },
              '[LinkedIn] Token refreshed successfully, retrying API call'
            );
            return this.fetchWithAutoRefresh(url, options, newAccessToken, retryCount + 1);
          } else {
            logger.error(
              {
                tenantId: this.tenantId,
                platform: 'linkedin',
                connectionId: this.connectionId,
              },
              '[LinkedIn] Token refresh succeeded but new access token not found'
            );
          }
        }
      } catch (refreshError) {
        logger.error(
          {
            tenantId: this.tenantId,
            platform: 'linkedin',
            connectionId: this.connectionId,
            error: refreshError instanceof Error ? refreshError.message : String(refreshError),
          },
          '[LinkedIn] Token refresh failed during API call'
        );
      }
    }

    return response;
  }

  /**
   * Publish text-only post
   */
  private async publishText(
    account: LinkedInAccount,
    title: string,
    body: string,
    accessToken: string
  ): Promise<string> {
    const payload = {
      author: account.urn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.PublishText': {
          text: body || title,
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await this.fetchWithAutoRefresh(
      `${BASE_URL}/${API_VERSION}/ugcPosts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      accessToken
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn publish failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Publish post with media (multi-step process)
   */
  private async publishWithMedia(
    account: LinkedInAccount,
    title: string,
    body: string,
    mediaUrls: string[],
    accessToken: string
  ): Promise<string> {
    const mediaAssets: any[] = [];

    // Upload each image
    for (const mediaUrl of mediaUrls.slice(0, 1)) {
      // LinkedIn allows 1 image per post
      const assetUrn = await this.uploadImage(account, mediaUrl, accessToken);
      mediaAssets.push({
        status: 'READY',
        media: assetUrn,
      });
    }

    // Publish post with media
    const payload = {
      author: account.urn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.PublishContent': {
          media: mediaAssets,
          title: {
            text: title || 'Shared post',
          },
          description: {
            text: body || '',
          },
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await this.fetchWithAutoRefresh(
      `${BASE_URL}/${API_VERSION}/ugcPosts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      accessToken
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn publish with media failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Upload image to LinkedIn (multi-step)
   */
  private async uploadImage(
    account: LinkedInAccount,
    imageUrl: string,
    accessToken: string
  ): Promise<string> {
    // Step 1: Register upload
    const registerPayload = {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare_image'],
        owner: account.urn,
        serviceRelationships: [
          {
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          },
        ],
      },
    };

    const registerResponse = await this.fetchWithAutoRefresh(
      `${BASE_URL}/${API_VERSION}/assets?action=registerUpload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerPayload),
      },
      accessToken
    );

    if (!registerResponse.ok) {
      const error = await registerResponse.text();
      throw new Error(`Image registration failed: ${registerResponse.status} - ${error}`);
    }

    const registerData = await registerResponse.json();
    const uploadUrl = registerData.value.mediaUploadHttpRequest.uploadUrl;
    const assetUrn = registerData.value.asset;

    // Step 2: Download image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Step 3: Upload image binary to LinkedIn
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Image upload failed: ${uploadResponse.status} - ${error}`);
    }

    logger.debug(
      {
        assetUrn,
        tenantId: this.tenantId,
      },
      '[LinkedIn] Image uploaded successfully'
    );

    return assetUrn;
  }

  /**
   * Delete a LinkedIn post
   */
  async deletePost(accountId: string, postId: string): Promise<void> {
    return await measureLatency('linkedin_delete_post', async () => {
      try {
        const accessToken = await this.vault.retrieveSecret(
          this.tenantId,
          this.connectionId,
          'access_token'
        );

        const response = await fetch(`${BASE_URL}/${API_VERSION}/ugcPosts/${postId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // LinkedIn returns 204 even if post doesn't exist (idempotent)
        if (response.status !== 204 && !response.ok) {
          const error = await response.text();
          throw new Error(`Delete failed: ${response.status} - ${error}`);
        }

        logger.info(
          {
            cycleId: this.connectionId,
            tenantId: this.tenantId,
            platform: 'linkedin',
            postId,
          },
          '[LinkedIn] Post deleted'
        );

        recordMetric('linkedin.delete.success', 1, { platform: 'linkedin' });
      } catch (error) {
        logger.error(
          {
            error: (error as Error).message,
            tenantId: this.tenantId,
            connectionId: this.connectionId,
            postId,
          },
          '[LinkedIn] Delete failed'
        );
        throw error;
      }
    }, { tenantId: this.tenantId, platform: 'linkedin' });
  }

  /**
   * Get analytics for a LinkedIn post
   *
   * NOTE: LinkedIn does NOT provide engagement metrics via REST API
   * This method returns post metadata only. Real analytics require:
   * - LinkedIn Analytics Dashboard (manual)
   * - LinkedIn Ads API (sponsored content only)
   * - Enterprise webhooks (requires B2B agreement)
   */
  async getPostAnalytics(accountId: string, postId: string): Promise<AnalyticsMetrics> {
    return await measureLatency('linkedin_get_analytics', async () => {
      try {
        const accessToken = await this.vault.retrieveSecret(
          this.tenantId,
          this.connectionId,
          'access_token'
        );

        // LinkedIn API returns post metadata but NOT engagement metrics
        const response = await fetch(`${BASE_URL}/${API_VERSION}/ugcPosts/${postId}?q=author`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Analytics fetch failed: ${response.status} - ${error}`);
        }

        const postData = await response.json();

        logger.info(
          {
            cycleId: this.connectionId,
            tenantId: this.tenantId,
            platform: 'linkedin',
            postId,
          },
          '[LinkedIn] Analytics retrieved (metadata only)'
        );

        // Return metadata since engagement metrics not available
        return {
          postId,
          views: 0, // Not available via API
          likes: 0, // Not available via API
          comments: 0, // Not available via API
          shares: 0, // Not available via API
          engagementRate: 0,
          metadata: {
            createdAt: postData.created,
            lifecycleState: postData.lifecycleState,
            note: 'LinkedIn does not provide engagement metrics via REST API. Use Analytics dashboard for real metrics.',
          },
        };
      } catch (error) {
        logger.error(
          {
            error: (error as Error).message,
            tenantId: this.tenantId,
            connectionId: this.connectionId,
            postId,
          },
          '[LinkedIn] Analytics retrieval failed'
        );
        throw error;
      }
    }, { tenantId: this.tenantId, platform: 'linkedin' });
  }

  /**
   * Health check for LinkedIn connection
   */
  async healthCheck(): Promise<HealthCheckResult> {
    return await measureLatency('linkedin_health_check', async () => {
      const startTime = Date.now();
      try {
        const accessToken = await this.vault.retrieveSecret(
          this.tenantId,
          this.connectionId,
          'access_token'
        );

        const response = await fetch(`${BASE_URL}/${API_VERSION}/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const latencyMs = Date.now() - startTime;

        if (response.status === 401) {
          logger.warn(
            {
              cycleId: this.connectionId,
              tenantId: this.tenantId,
              platform: 'linkedin',
              latencyMs,
            },
            '[LinkedIn] Health check failed - token expired'
          );
          recordMetric('linkedin.health_check.failed', 1, { platform: 'linkedin' });
          return {
            status: 'warning',
            latencyMs,
            message: 'Token expired - refresh needed',
          };
        }

        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }

        const data = await response.json();

        logger.info(
          {
            cycleId: this.connectionId,
            tenantId: this.tenantId,
            platform: 'linkedin',
            latencyMs,
            userId: data.id,
          },
          '[LinkedIn] Health check passed'
        );

        recordMetric('linkedin.health_check.success', 1, { platform: 'linkedin' });

        return {
          status: 'healthy',
          latencyMs,
          message: `Connection healthy - user ${data.id}`,
        };
      } catch (error) {
        const latencyMs = Date.now() - startTime;
        logger.error(
          {
            error: (error as Error).message,
            tenantId: this.tenantId,
            connectionId: this.connectionId,
            latencyMs,
          },
          '[LinkedIn] Health check failed'
        );
        recordMetric('linkedin.health_check.critical', 1, { platform: 'linkedin' });
        return {
          status: 'critical',
          latencyMs,
          message: `Health check failed: ${(error as Error).message}`,
        };
      }
    }, { tenantId: this.tenantId, platform: 'linkedin' });
  }

  /**
   * Validate webhook signature (not implemented for LinkedIn)
   * LinkedIn webhooks require enterprise agreement
   */
  validateWebhookSignature(signature: string, payload: string): boolean {
    // LinkedIn enterprise webhooks use HMAC-SHA256
    // This would be implemented when enterprise webhooks are available
    logger.warn(
      {
        tenantId: this.tenantId,
        platform: 'linkedin',
      },
      '[LinkedIn] Webhook signature validation not yet implemented'
    );
    return false;
  }

  /**
   * Parse webhook event (not implemented for LinkedIn)
   */
  parseWebhookEvent(payload: any): any {
    logger.warn(
      {
        tenantId: this.tenantId,
        platform: 'linkedin',
      },
      '[LinkedIn] Webhook parsing not yet implemented'
    );
    return null;
  }
}
