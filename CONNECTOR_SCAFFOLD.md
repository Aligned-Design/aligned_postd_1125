# 🚀 Connector Implementation Scaffold & Starter Code

**Date**: November 11, 2025
**Purpose**: Ready-to-use templates for implementing first connector (Meta)
**Version**: 1.0

---

## FILE STRUCTURE

```
/server
├── connectors/
│   ├── shared/
│   │   ├── types.ts          # Interface definitions
│   │   ├── errors.ts         # Error handling
│   │   ├── retry.ts          # Retry logic with backoff
│   │   └── webhook.ts        # Webhook validation
│   ├── meta/
│   │   ├── index.ts          # MetaConnector class
│   │   ├── oauth.ts          # OAuth flow
│   │   ├── publish.ts        # Publishing logic
│   │   ├── analytics.ts      # Analytics fetching
│   │   ├── webhooks.ts       # Webhook handlers
│   │   └── tests.ts          # Tests
│   ├── linkedin/
│   │   ├── index.ts
│   │   └── ...
│   └── [other platforms]
├── lib/
│   ├── token-vault.ts        # Token encryption/decryption
│   ├── connector-manager.ts  # Orchestrator
│   └── queue-service.ts      # Bull/Redis queue
└── routes/
    ├── api/
    │   ├── connectors.ts     # Connection CRUD
    │   ├── oauth.ts          # OAuth endpoints
    │   ├── publish.ts        # Publishing endpoints
    │   ├── webhooks.ts       # Webhook receiver
    │   └── health.ts         # Health check endpoints
```

---

## PART 1: Shared Types & Interfaces

### `/server/connectors/shared/types.ts`

```typescript
/**
 * Core types for all connectors
 */

export interface ConnectorConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  apiVersion?: string;
}

export interface AuthResult {
  ok: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number; // Unix timestamp (ms)
  scope?: string;
  error?: ConnectorError;
}

export interface ConnectorError {
  code: string;
  message: string;
  retryable?: boolean;
  statusCode?: number;
  details?: Record<string, any>;
}

export interface Account {
  id: string;
  name: string;
  externalId: string;
  platform: 'meta' | 'linkedin' | 'tiktok' | 'youtube' | string;
  type?: 'page' | 'account' | 'channel' | 'creator';
  profileUrl?: string;
  profileImageUrl?: string;
  permissions?: string[];
}

export interface PostPayload {
  content: string;
  mediaUrls?: string[];
  mediaIds?: string[];
  hashtags?: string[];
  mentionedAccounts?: string[];
  productTags?: ProductTag[];
  scheduledFor?: Date;
  idempotencyKey: string;
  format?: 'post' | 'story' | 'reel' | 'video' | 'article' | 'update';
  metadata?: Record<string, any>;
}

export interface ProductTag {
  productId: string;
  productName?: string;
  price?: number;
  link?: string;
  position?: { x: number; y: number };
}

export interface PostResult {
  ok: boolean;
  postId?: string;
  permalink?: string;
  scheduledAt?: Date;
  mediaIds?: string[];
  error?: ConnectorError;
}

export interface AnalyticsMetrics {
  impressions: number;
  engagements: number;
  clicks?: number;
  conversions?: number;
  reachEstimate?: number;
  reach?: number;
  shares?: number;
  comments?: number;
  likes?: number;
  saves?: number;
  videoViews?: number;
  videoAverageViewDuration?: number;
  period?: { start: Date; end: Date };
}

export interface HealthCheckResult {
  healthy: boolean;
  statusCode?: number;
  errors?: string[];
  lastCheck?: Date;
  nextCheck?: Date;
}

export interface WebhookEvent {
  type: string;
  timestamp: Date;
  data: Record<string, any>;
}

/**
 * Main Connector interface - all platforms must implement
 */
export interface Connector {
  // ─── Authentication ─────────────────────────────
  getAuthUrl(state?: string, locale?: string): string;
  exchangeCodeForToken(code: string): Promise<AuthResult>;
  refreshToken(refreshToken: string): Promise<AuthResult>;
  revokeToken(accessToken: string): Promise<{ ok: boolean }>;

  // ─── Account Management ─────────────────────────
  fetchAccounts(accessToken: string): Promise<Account[]>;
  verifyPermissions(accessToken: string): Promise<{ ok: boolean; missingScopes?: string[] }>;

  // ─── Publishing ────────────────────────────────
  createPost(accessToken: string, accountId: string, payload: PostPayload): Promise<PostResult>;
  schedulePost(accessToken: string, accountId: string, payload: PostPayload): Promise<PostResult>;
  editPost(accessToken: string, accountId: string, postId: string, payload: Partial<PostPayload>): Promise<PostResult>;
  deletePost(accessToken: string, accountId: string, postId: string): Promise<{ ok: boolean; error?: ConnectorError }>;

  // ─── Analytics ─────────────────────────────────
  getAnalytics(accessToken: string, accountId: string, postId?: string, period?: 'day' | 'week' | 'month'): Promise<AnalyticsMetrics>;

  // ─── Webhooks ──────────────────────────────────
  validateWebhookSignature(payload: Buffer, signature: string): boolean;
  parseWebhookEvent(payload: any): WebhookEvent | null;
  getWebhookSubscriptions(): string[]; // Events to subscribe to

  // ─── Health & Status ───────────────────────────
  checkHealth(accessToken: string): Promise<HealthCheckResult>;

  // ─── Metadata ──────────────────────────────────
  getPlatformName(): string;
  getSupportedFormats(): string[];
  getCapabilities(): Record<string, boolean>;
}

export interface Connection {
  id: string;
  tenantId: string;
  platform: string;
  externalId: string;
  accountName: string;
  scopes: string[];
  accessTokenEncrypted: Buffer;
  refreshTokenEncrypted?: Buffer;
  expiresAt?: Date;
  lastRefreshAt?: Date;
  status: 'healthy' | 'expiring_soon' | 'attention' | 'revoked';
  lastErrorCode?: string;
  lastErrorAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublishJob {
  id: string;
  tenantId: string;
  connectionId: string;
  contentId?: string;
  idempotencyKey: string;
  payload: PostPayload;
  status: 'pending' | 'scheduled' | 'published' | 'failed' | 'retrying';
  attemptCount: number;
  maxAttempts: number;
  externalPostId?: string;
  externalPermalink?: string;
  errorCode?: string;
  errorMessage?: string;
  scheduledFor?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## PART 2: Shared Error Handling

### `/server/connectors/shared/errors.ts`

```typescript
/**
 * Error types and utilities
 */

export class ConnectorException extends Error {
  constructor(
    public code: string,
    message: string,
    public retryable: boolean = false,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ConnectorException';
  }
}

/**
 * Classify error codes and determine retryability
 */
export function classifyError(statusCode: number, errorCode?: string): { retryable: boolean; classification: string } {
  if (statusCode === 429 || errorCode === 'rate_limit') {
    return { retryable: true, classification: 'rate_limit' };
  }
  if ([500, 502, 503, 504].includes(statusCode)) {
    return { retryable: true, classification: 'server_error' };
  }
  if (statusCode === 408) {
    return { retryable: true, classification: 'timeout' };
  }
  if (statusCode === 401 || errorCode === 'invalid_token') {
    return { retryable: false, classification: 'auth_error' };
  }
  if (statusCode === 403 || errorCode === 'insufficient_permission') {
    return { retryable: false, classification: 'permission_error' };
  }
  if ([400, 404].includes(statusCode)) {
    return { retryable: false, classification: 'client_error' };
  }
  return { retryable: false, classification: 'unknown' };
}

/**
 * Parse platform-specific error responses
 */
export interface PlatformErrorResponse {
  errorCode: string;
  message: string;
  statusCode: number;
  rawError: any;
}

export function extractErrorInfo(
  response: any,
  statusCode: number,
  platform: string
): PlatformErrorResponse {
  // Meta/Facebook format
  if (response?.error?.code) {
    return {
      errorCode: String(response.error.code),
      message: response.error.message || String(response.error.code),
      statusCode,
      rawError: response.error,
    };
  }

  // LinkedIn format
  if (response?.serviceErrorCode) {
    return {
      errorCode: String(response.serviceErrorCode),
      message: response.message || '',
      statusCode,
      rawError: response,
    };
  }

  // TikTok format
  if (response?.error) {
    return {
      errorCode: response.error,
      message: response.message || '',
      statusCode,
      rawError: response,
    };
  }

  // Generic fallback
  return {
    errorCode: `HTTP_${statusCode}`,
    message: response?.message || `HTTP ${statusCode}`,
    statusCode,
    rawError: response,
  };
}
```

---

## PART 3: Retry Logic with Exponential Backoff

### `/server/connectors/shared/retry.ts`

```typescript
/**
 * Retry logic with exponential backoff + jitter
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterFactor?: number; // 0-1
  retryableStatusCodes?: number[];
  onRetry?: (attempt: number, delayMs: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 4,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
  jitterFactor: 0.1,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  onRetry: () => {}, // no-op
};

/**
 * Execute async function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if retryable
      const isRetryable =
        error.retryable ||
        (error.statusCode && opts.retryableStatusCodes.includes(error.statusCode));

      if (!isRetryable || attempt === opts.maxRetries) {
        throw error;
      }

      // Calculate backoff
      const delayMs = calculateBackoff(attempt, opts);
      opts.onRetry(attempt + 1, delayMs, error);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Calculate exponential backoff with jitter
 */
export function calculateBackoff(attemptIndex: number, options: RetryOptions): number {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const exponentialDelay = opts.baseDelayMs * Math.pow(2, attemptIndex);
  const cappedDelay = Math.min(exponentialDelay, opts.maxDelayMs);
  const jitterAmount = cappedDelay * opts.jitterFactor * Math.random();
  return Math.floor(cappedDelay + jitterAmount);
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## PART 4: Meta Connector Implementation

### `/server/connectors/meta/index.ts`

```typescript
/**
 * Meta (Facebook + Instagram) Connector
 * Supports Facebook Pages and Instagram Business Accounts
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { Connector, ConnectorConfig, Account, AuthResult, PostPayload, PostResult, AnalyticsMetrics, HealthCheckResult, WebhookEvent } from '../shared/types';
import { ConnectorException, extractErrorInfo, classifyError } from '../shared/errors';
import { withRetry } from '../shared/retry';

const API_VERSION = 'v18.0';
const BASE_URL = `https://graph.instagram.com/${API_VERSION}`;
const GRAPH_URL = `https://graph.facebook.com/${API_VERSION}`;

export class MetaConnector implements Connector {
  private config: ConnectorConfig;
  private client: AxiosInstance;

  constructor(config?: ConnectorConfig) {
    this.config = config || {
      clientId: process.env.META_CLIENT_ID!,
      clientSecret: process.env.META_CLIENT_SECRET!,
      redirectUri: process.env.META_REDIRECT_URI || `${process.env.API_URL}/api/oauth/meta/callback`,
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

    this.client = axios.create({
      baseURL: GRAPH_URL,
      timeout: 10000,
    });
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state: state || crypto.randomUUID(),
      scope: this.config.scopes.join(','),
      response_type: 'code',
      auth_type: 'rerequest',
    });
    return `https://www.facebook.com/v${API_VERSION}/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange OAuth code for access token
   */
  async exchangeCodeForToken(code: string): Promise<AuthResult> {
    try {
      const response = await withRetry(
        () =>
          this.client.get('/oauth/access_token', {
            params: {
              client_id: this.config.clientId,
              client_secret: this.config.clientSecret,
              redirect_uri: this.config.redirectUri,
              code,
            },
          }),
        { maxRetries: 3 }
      );

      const { access_token, expires_in } = response.data;

      if (!access_token) {
        throw new ConnectorException('invalid_response', 'No access token in response', false);
      }

      return {
        ok: true,
        accessToken: access_token,
        expiresAt: Date.now() + expires_in * 1000,
      };
    } catch (error: any) {
      const errorInfo = extractErrorInfo(error.response?.data, error.response?.status || 500, 'meta');
      return {
        ok: false,
        error: {
          code: errorInfo.errorCode,
          message: errorInfo.message,
        },
      };
    }
  }

  /**
   * Refresh access token using long-lived token
   * Meta: tokens are long-lived by default (60 days)
   * Refresh only needed if actively used
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const response = await withRetry(
        () =>
          this.client.get('/oauth/access_token', {
            params: {
              client_id: this.config.clientId,
              client_secret: this.config.clientSecret,
              access_token: refreshToken,
              grant_type: 'fb_exchange_token',
            },
          }),
        { maxRetries: 2 }
      );

      const { access_token, expires_in } = response.data;

      return {
        ok: true,
        accessToken: access_token,
        expiresAt: Date.now() + expires_in * 1000,
      };
    } catch (error: any) {
      const errorInfo = extractErrorInfo(error.response?.data, error.response?.status || 500, 'meta');
      return {
        ok: false,
        error: {
          code: errorInfo.errorCode,
          message: errorInfo.message,
          retryable: classifyError(error.response?.status || 500, errorInfo.errorCode).retryable,
        },
      };
    }
  }

  /**
   * Fetch user's Facebook Pages and Instagram Business Accounts
   */
  async fetchAccounts(accessToken: string): Promise<Account[]> {
    try {
      const accounts: Account[] = [];

      // Fetch Facebook Pages
      const pagesResponse = await withRetry(
        () =>
          this.client.get('/me/accounts', {
            params: {
              access_token: accessToken,
              fields: 'id,name,picture,access_token',
            },
          }),
        { maxRetries: 2 }
      );

      for (const page of pagesResponse.data.data || []) {
        accounts.push({
          id: page.id,
          name: page.name,
          externalId: page.id,
          platform: 'meta',
          type: 'page',
          profileUrl: `https://facebook.com/${page.id}`,
          profileImageUrl: page.picture?.data?.url,
        });

        // Fetch Instagram Business Accounts connected to this page
        try {
          const igResponse = await withRetry(
            () =>
              this.client.get(`/${page.id}/instagram_business_account`, {
                params: {
                  access_token: page.access_token,
                  fields: 'id,name,biography,profile_picture_url,followers_count',
                },
              }),
            { maxRetries: 1 }
          );

          if (igResponse.data) {
            accounts.push({
              id: igResponse.data.id,
              name: igResponse.data.name || page.name,
              externalId: igResponse.data.id,
              platform: 'meta',
              type: 'account',
              profileUrl: `https://instagram.com/${igResponse.data.username || igResponse.data.id}`,
              profileImageUrl: igResponse.data.profile_picture_url,
            });
          }
        } catch {
          // Silently fail if no IG account connected
        }
      }

      return accounts;
    } catch (error: any) {
      const errorInfo = extractErrorInfo(error.response?.data, error.response?.status || 500, 'meta');
      throw new ConnectorException(errorInfo.errorCode, errorInfo.message, false);
    }
  }

  /**
   * Verify token has required permissions
   */
  async verifyPermissions(accessToken: string): Promise<{ ok: boolean; missingScopes?: string[] }> {
    try {
      const response = await this.client.get('/me/permissions', {
        params: { access_token: accessToken },
      });

      const grantedScopes = (response.data.data || []).map((p: any) => p.permission);
      const missingScopes = this.config.scopes.filter(s => !grantedScopes.includes(s));

      return {
        ok: missingScopes.length === 0,
        missingScopes: missingScopes.length > 0 ? missingScopes : undefined,
      };
    } catch (error) {
      return { ok: false };
    }
  }

  /**
   * Create a post on Facebook Page or Instagram
   */
  async createPost(accessToken: string, accountId: string, payload: PostPayload): Promise<PostResult> {
    try {
      // Determine if IG or FB based on accountId format
      const isInstagram = accountId.length > 10; // IG IDs are typically longer

      const endpoint = isInstagram ? `/${accountId}/media` : `/${accountId}/feed`;

      const postData: Record<string, any> = {
        caption: payload.content,
        access_token: accessToken,
      };

      // Add media if provided
      if (payload.mediaUrls?.length) {
        postData.image_url = payload.mediaUrls[0]; // Use first image
      }

      // Add product tags if present
      if (payload.productTags?.length && isInstagram) {
        postData.product_tags = payload.productTags.map(pt => ({
          product_id: pt.productId,
          x: pt.position?.x || 0.5,
          y: pt.position?.y || 0.5,
        }));
      }

      const response = await withRetry(
        () => this.client.post(endpoint, postData),
        {
          maxRetries: 3,
          onRetry: (attempt, delayMs) => {
            console.log(`[Meta] Retry attempt ${attempt} after ${delayMs}ms`);
          },
        }
      );

      const postId = response.data.id;

      // Get permalink for FB posts
      let permalink: string | undefined;
      if (!isInstagram) {
        try {
          const permalinkResponse = await this.client.get(`/${postId}`, {
            params: { fields: 'permalink_url', access_token: accessToken },
          });
          permalink = permalinkResponse.data.permalink_url;
        } catch {
          // Silently fail permalink fetch
        }
      }

      return {
        ok: true,
        postId,
        permalink: permalink || `https://facebook.com/${postId}`,
      };
    } catch (error: any) {
      const errorInfo = extractErrorInfo(error.response?.data, error.response?.status || 500, 'meta');
      const { retryable } = classifyError(error.response?.status || 500, errorInfo.errorCode);

      return {
        ok: false,
        error: {
          code: errorInfo.errorCode,
          message: errorInfo.message,
          retryable,
        },
      };
    }
  }

  /**
   * Schedule a post (Meta/FB only; IG doesn't support via API)
   */
  async schedulePost(accessToken: string, accountId: string, payload: PostPayload): Promise<PostResult> {
    if (!payload.scheduledFor) {
      return {
        ok: false,
        error: {
          code: 'missing_scheduled_time',
          message: 'scheduledFor is required',
        },
      };
    }

    try {
      const postData: Record<string, any> = {
        caption: payload.content,
        access_token: accessToken,
        published: false, // Keep as draft
        scheduled_publish_time: Math.floor(payload.scheduledFor.getTime() / 1000),
      };

      if (payload.mediaUrls?.length) {
        postData.image_url = payload.mediaUrls[0];
      }

      const response = await withRetry(
        () => this.client.post(`/${accountId}/feed`, postData),
        { maxRetries: 3 }
      );

      return {
        ok: true,
        postId: response.data.id,
        scheduledAt: payload.scheduledFor,
      };
    } catch (error: any) {
      const errorInfo = extractErrorInfo(error.response?.data, error.response?.status || 500, 'meta');
      return {
        ok: false,
        error: { code: errorInfo.errorCode, message: errorInfo.message },
      };
    }
  }

  /**
   * Delete a post
   */
  async deletePost(accessToken: string, accountId: string, postId: string): Promise<{ ok: boolean; error?: any }> {
    try {
      await this.client.delete(`/${postId}`, {
        params: { access_token: accessToken },
      });
      return { ok: true };
    } catch (error: any) {
      return {
        ok: false,
        error: extractErrorInfo(error.response?.data, error.response?.status || 500, 'meta'),
      };
    }
  }

  /**
   * Fetch post analytics (impressions, engagement)
   */
  async getAnalytics(accessToken: string, accountId: string, postId?: string): Promise<AnalyticsMetrics> {
    try {
      if (postId) {
        // Single post insights
        const response = await this.client.get(`/${postId}/insights`, {
          params: {
            access_token: accessToken,
            metric: 'impressions,engagement,reach,video_views',
          },
        });

        const metrics: AnalyticsMetrics = {
          impressions: 0,
          engagements: 0,
        };

        for (const insight of response.data.data || []) {
          switch (insight.name) {
            case 'impressions':
              metrics.impressions = insight.values[0]?.value || 0;
              break;
            case 'engagement':
              metrics.engagements = insight.values[0]?.value || 0;
              break;
            case 'reach':
              metrics.reach = insight.values[0]?.value || 0;
              break;
            case 'video_views':
              metrics.videoViews = insight.values[0]?.value || 0;
              break;
          }
        }

        return metrics;
      } else {
        // Page-level insights
        const response = await this.client.get(`/${accountId}/insights`, {
          params: {
            access_token: accessToken,
            metric: 'page_impressions,page_engaged_users,page_post_engagements',
            period: 'day',
          },
        });

        const metrics: AnalyticsMetrics = {
          impressions: 0,
          engagements: 0,
        };

        for (const insight of response.data.data || []) {
          switch (insight.name) {
            case 'page_impressions':
              metrics.impressions += insight.values[0]?.value || 0;
              break;
            case 'page_engaged_users':
              metrics.engagements += insight.values[0]?.value || 0;
              break;
          }
        }

        return metrics;
      }
    } catch (error) {
      console.error('[Meta] Analytics fetch failed:', error);
      return { impressions: 0, engagements: 0 };
    }
  }

  /**
   * Validate webhook signature (HMAC-SHA256)
   */
  validateWebhookSignature(payload: Buffer, signature: string): boolean {
    const hash = crypto
      .createHmac('sha256', this.config.clientSecret)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }

  /**
   * Parse incoming webhook event
   */
  parseWebhookEvent(payload: any): WebhookEvent | null {
    if (payload.entry && payload.entry.length > 0) {
      const entry = payload.entry[0];
      const event = entry.changes?.[0];

      if (event?.field === 'feed') {
        return {
          type: event.value.item || 'post_change',
          timestamp: new Date(entry.time * 1000),
          data: event.value,
        };
      }

      if (event?.field === 'permissions') {
        return {
          type: 'permissions_change',
          timestamp: new Date(entry.time * 1000),
          data: event.value,
        };
      }

      // App deauthorized event
      if (payload.object === 'app' && entry.object === 'app') {
        return {
          type: 'app_deauthorized',
          timestamp: new Date(),
          data: { userId: entry.uid },
        };
      }
    }

    return null;
  }

  /**
   * Get webhooks Meta should subscribe to
   */
  getWebhookSubscriptions(): string[] {
    return [
      'feed',
      'permissions',
      'page_change',
      'ratings',
      'leadgen',
    ];
  }

  /**
   * Health check - verify token is valid
   */
  async checkHealth(accessToken: string): Promise<HealthCheckResult> {
    try {
      const response = await withRetry(
        () =>
          this.client.get('/me', {
            params: {
              access_token: accessToken,
              fields: 'id,name',
            },
          }),
        { maxRetries: 2 }
      );

      return {
        healthy: !!response.data.id,
        statusCode: 200,
        lastCheck: new Date(),
      };
    } catch (error: any) {
      return {
        healthy: false,
        statusCode: error.response?.status || 500,
        errors: [extractErrorInfo(error.response?.data, error.response?.status || 500, 'meta').message],
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Platform metadata
   */
  getPlatformName(): string {
    return 'Meta (Facebook & Instagram)';
  }

  getSupportedFormats(): string[] {
    return ['post', 'story', 'reel', 'carousel', 'video'];
  }

  getCapabilities(): Record<string, boolean> {
    return {
      canPost: true,
      canSchedule: true,
      canEdit: true,
      canDelete: true,
      canTagProducts: true,
      canReply: true,
      canStream: false,
      hasTrendingAudio: false,
    };
  }
}
```

---

## PART 5: API Endpoint Examples

### `/server/routes/api/oauth.ts`

```typescript
/**
 * OAuth callback routes for all connectors
 */

import { Router } from 'express';
import { supabase } from '../../lib/supabase-client';
import { tokenVault } from '../../lib/token-vault';
import { connectorManager } from '../../lib/connector-manager';

const router = Router();

/**
 * POST /api/oauth/:platform/start
 * Generate auth URL for platform
 */
router.post('/:platform/start', async (req, res) => {
  try {
    const { platform } = req.params;
    const { tenantId } = req.body;

    const connector = connectorManager.getConnector(platform);
    if (!connector) {
      return res.status(404).json({ error: `Platform ${platform} not supported` });
    }

    const state = JSON.stringify({ tenantId, platform, timestamp: Date.now() });
    const encodedState = Buffer.from(state).toString('base64');
    const authUrl = connector.getAuthUrl(encodedState);

    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * GET /api/oauth/:platform/callback
 * Handle OAuth redirect
 */
router.get('/:platform/callback', async (req, res) => {
  try {
    const { platform } = req.params;
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.status(400).json({ error: String(oauthError) });
    }

    // Decode state
    const stateData = JSON.parse(Buffer.from(String(state), 'base64').toString());
    const { tenantId } = stateData;

    const connector = connectorManager.getConnector(platform);
    if (!connector) {
      return res.status(404).json({ error: `Platform ${platform} not supported` });
    }

    // Exchange code for token
    const authResult = await connector.exchangeCodeForToken(String(code));
    if (!authResult.ok) {
      return res.status(401).json({ error: authResult.error });
    }

    // Fetch accounts
    const accounts = await connector.fetchAccounts(authResult.accessToken!);

    // Store token + create connections
    for (const account of accounts) {
      await tokenVault.storeToken(
        tenantId,
        platform,
        authResult.accessToken!,
        authResult.refreshToken,
        authResult.expiresAt ? new Date(authResult.expiresAt) : undefined
      );

      // Create connection record
      await supabase.from('connections').upsert({
        tenant_id: tenantId,
        platform,
        external_id: account.externalId,
        account_name: account.name,
        status: 'healthy',
        created_at: new Date(),
      });
    }

    // Redirect back to app
    const appUrl = `${process.env.APP_URL}/linked-accounts?platform=${platform}&success=true`;
    res.redirect(appUrl);
  } catch (error) {
    console.error('[OAuth] Callback error:', error);
    res.status(500).json({ error: String(error) });
  }
});

export default router;
```

### `/server/routes/api/publish.ts`

```typescript
/**
 * Publishing endpoints
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase-client';
import { connectorManager } from '../../lib/connector-manager';
import { PublishJob, PostPayload } from '../../connectors/shared/types';
import Bull from 'bull';

const router = Router();

// Initialize queue
const publishQueue = new Bull('publish', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

/**
 * POST /api/publish
 * Submit a post for publishing (or scheduling)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { tenantId, connectionId, payload } = req.body;

    // Validate
    if (!tenantId || !connectionId || !payload) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check idempotency
    const existing = await supabase
      .from('publish_jobs')
      .select('id, status, external_post_id')
      .eq('idempotency_key', payload.idempotencyKey)
      .single();

    if (existing.data?.status === 'published') {
      // Already published - return cached result
      return res.json({
        postId: existing.data.external_post_id,
        cached: true,
      });
    }

    // Create job record
    const { data: job } = await supabase
      .from('publish_jobs')
      .insert({
        tenant_id: tenantId,
        connection_id: connectionId,
        idempotency_key: payload.idempotencyKey,
        payload,
        status: 'pending',
        scheduled_for: payload.scheduledFor,
      })
      .select()
      .single();

    // Enqueue for processing
    await publishQueue.add(
      { jobId: job.id, tenantId, connectionId, payload },
      {
        delay: payload.scheduledFor
          ? new Date(payload.scheduledFor).getTime() - Date.now()
          : 0,
        attempts: 4,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      }
    );

    res.json({
      jobId: job.id,
      status: 'queued',
      scheduledFor: payload.scheduledFor,
    });
  } catch (error) {
    console.error('[Publish] Error:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Job worker
 */
publishQueue.process(async job => {
  const { jobId, tenantId, connectionId, payload } = job.data;

  console.log(`[Publish] Processing job ${jobId}`);

  try {
    // Get connection metadata
    const { data: conn } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (!conn) throw new Error('Connection not found');

    // Publish via connector manager
    const result = await connectorManager.publishWithRetry(
      connectionId,
      payload as PostPayload,
      4
    );

    // Update job record
    await supabase
      .from('publish_jobs')
      .update({
        status: result.ok ? 'published' : 'failed',
        external_post_id: result.postId,
        external_permalink: result.permalink,
        error_code: result.error?.code,
        error_message: result.error?.message,
        published_at: result.ok ? new Date() : null,
      })
      .eq('id', jobId);

    if (!result.ok) {
      throw new Error(`Publish failed: ${result.error?.code} - ${result.error?.message}`);
    }

    return result;
  } catch (error) {
    console.error(`[Publish] Job ${jobId} failed:`, error);
    throw error;
  }
});

export default router;
```

---

## Next: Implementation Roadmap

1. **Week 1**: Scaffold directories + implement shared types/errors/retry
2. **Week 2**: Implement TokenVault + OAuth flow
3. **Week 3**: Build Meta connector (OAuth → publish → refresh)
4. **Week 4**: Add webhook handling + health checks
5. **Week 5**: Deploy to staging + test end-to-end
6. **Week 6-7**: LinkedIn + TikTok
7. **Week 8**: Dashboard + observability

---

**Version**: 1.0
**Last Updated**: November 11, 2025
**Ready to Copy/Paste**: Yes

