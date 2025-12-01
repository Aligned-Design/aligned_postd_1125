# POSTD API Integration Strategy & Implementation Plan

> **Status:** ✅ Active – This is an active API integration strategy document for POSTD.  
> **Last Updated:** 2025-01-20

**Date**: November 11, 2025  
**Status**: 🟢 READY FOR DESIGN & IMPLEMENTATION  
**Version**: 1.0 - Initial Strategy Document

---

## EXECUTIVE SUMMARY

This document outlines a **modular, multi-tenant, production-grade API integration framework** for POSTD. The strategy prioritizes:
1. **User value** (ROI per integration)
2. **Maintenance burden** (API stability + dev effort)
3. **Operational safety** (token management, rate limits, error recovery)
4. **Scalability** (support 100+ users, many accounts per tenant)

### Phase Timeline
- **Phase 1 (MVP Foundation)**: Core architecture + 5 Tier-1 integrations (6-8 weeks)
- **Phase 2 (Growth)**: Tier-2 integrations + advanced features (8-12 weeks)
- **Phase 3 (Enterprise)**: Tier-3 + custom connectors (ongoing)

---

## PART 1: CURRENT STATE ANALYSIS

### What We Already Have
✅ React Router v6 (client-side routing)
✅ Express backend with middleware + error handling
✅ Supabase (database + auth)
✅ TypeScript throughout
✅ OAuth context (user auth working)
✅ Toast/notification system
✅ Hook-based state management

### What We Need to Add
❌ **Connectors service**: OAuth for 3rd-party platforms (Meta, TikTok, LinkedIn, etc.)
❌ **Token vault**: Encrypted storage + rotation
❌ **Publishing service**: Queue-based async job handling (RabbitMQ / Redis / Bull)
❌ **Webhook router**: Inbound webhook handling + health checks
❌ **Integration health dashboard**: Token expiry, connection status, API health
❌ **Capability matrix**: Data-driven UI rendering per platform
❌ **Monitoring & observability**: Dashboards + alerts + DLQ
❌ **Error recovery flow**: Reconnect wizard + auto-heal playbook

---

## PART 2: INTEGRATION PRIORITIZATION MATRIX

### Scoring Methodology
Each integration is scored 1-10 on four dimensions:

| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| **User Demand** | 40% | % of target users requesting it; market fit |
| **Differentiation** | 25% | Competitive advantage; unique to POSTD |
| **Maintenance** | 20% | API stability, breaking change frequency, vendor support |
| **Speed-to-Value** | 15% | Dev hours to MVP; time to user benefit |

**Formula**: `Final Score = (Demand×0.4) + (Diff×0.25) + (Maintenance×0.2) + (Speed×0.15)`

---

### TIER 1: Must-Have Foundations (Score ≥ 8.5)
**Ship in MVP**. These integrations are table-stakes for marketing automation + AI content.

| Integration | Demand | Diff | Maint | Speed | **Score** | Why | Effort |
|-------------|--------|------|-------|-------|-----------|-----|--------|
| **Meta (FB/IG)** | 10 | 9 | 7 | 6 | **8.3** | Core social; 70% of users want it | High (4-6w) |
| **LinkedIn** | 9 | 8 | 8 | 7 | **8.2** | B2B essential; Advisors AI can read posts | Medium (3-4w) |
| **TikTok** | 9 | 8 | 6 | 5 | **7.8** | Rising demand; tricky auth flow | High (4-6w) |
| **Google Business Profile** | 8 | 7 | 9 | 8 | **8.1** | Local/retail brands; reviews + posts | Medium (2-3w) |
| **Mailchimp** | 7 | 8 | 9 | 7 | **7.7** | Email CTA follow-ups; low-code | Low (1-2w) |

**MVP Deliverable**: Connector framework + 5 live connectors + token health dashboard

---

### TIER 2: High-Impact Growth (Score 7.5–8.4)
**Add Phases 2–3 (months 2–3)**. Expand use cases and market appeal.

| Integration | Demand | Diff | Maint | Speed | **Score** | Why | Effort |
|-------------|--------|------|-------|-------|-----------|-----|--------|
| **YouTube/Shorts** | 8 | 8 | 8 | 6 | **7.8** | Video powerhouse; Shorts + analytics | Medium (3-4w) |
| **Pinterest** | 7 | 8 | 8 | 7 | **7.6** | Visual brands; e-comm tie-in | Medium (3-4w) |
| **Shopify** | 8 | 9 | 9 | 6 | **8.2** | E-comm; product tagging + CTAs | High (3-5w) |
| **Canva** | 7 | 9 | 9 | 8 | **8.1** | Design + AI templates; huge UX value | Low (2-3w) |
| **Google Analytics 4** | 8 | 8 | 8 | 7 | **7.9** | Performance tracking + Advisor insights | Medium (2-3w) |
| **Cloudinary** | 7 | 9 | 8 | 7 | **7.8** | Image transforms + DAM; must-have | Low (2-3w) |
| **Slack** | 6 | 8 | 9 | 8 | **7.6** | Approval notifications + publish receipts | Low (1-2w) |
| **Airtable** | 7 | 7 | 9 | 8 | **7.7** | Content calendar source-of-truth | Low (2-3w) |

**Growth Deliverable**: Add 6–8 connectors; Advanced AI recommendations ("Your Shopify products outperform others 3x on IG").

---

### TIER 3: Specialized / Roadmap (Score < 7.5)
**Defer to later phases or monitor demand.**

| Integration | Demand | Diff | Maint | Speed | **Score** | Why | Notes |
|-------------|--------|------|-------|-------|-----------|-----|-------|
| **Reddit** | 6 | 7 | 6 | 6 | **6.3** | Niche; permitting issues | Defer to Q4 |
| **Threads** | 5 | 6 | 5 | 5 | **5.4** | Very new; API still limited | Monitor Q1 2026 |
| **WhatsApp Business** | 6 | 7 | 6 | 4 | **6.0** | Limited posting; mainly notifications | Defer |
| **Medium / Substack** | 5 | 6 | 7 | 6 | **5.8** | Content writers; niche | Defer |
| **Notion** | 6 | 7 | 6 | 5 | **6.1** | Interesting; low priority | Monitor adoption |
| **HubSpot CRM** | 7 | 8 | 7 | 4 | **7.0** | Enterprise feature; complex; phase later | Enterprise phase |
| **Salesforce** | 6 | 8 | 6 | 3 | **6.2** | Big feature; ROI low early | Enterprise phase |
| **Advanced Audio** (TikTok CML) | 4 | 9 | 3 | 2 | **4.3** | Licensing hell; defer | Roadmap only |

---

## PART 3: ARCHITECTURE DESIGN

### 3.1 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      POSTD PLATFORM                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐                ┌──────────────────────┐  │
│  │   React Client   │                │   Express Backend    │  │
│  │  (UI + Auth)     │───────────────▶│  (API Routes)        │  │
│  └──────────────────┘                └──────────────────────┘  │
│                                                │                │
│                                                ▼                │
│                                    ┌──────────────────────┐     │
│                                    │ Connectors Service   │     │
│                                    │ (OAuth, Tokens,      │     │
│                                    │  Webhooks, Health)   │     │
│                                    └──────────────────────┘     │
│                                                │                │
│           ┌───────────────────────────────────┼──────────────┐  │
│           ▼                                   ▼              ▼   │
│   ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐   │
│   │ Token Vault  │  │ Queue Service    │  │ Webhook Router │   │
│   │ (KMS+Crypt)  │  │ (Bull/Redis)     │  │                │   │
│   └──────────────┘  └──────────────────┘  └────────────────┘   │
│           │                 │                      │            │
│           ▼                 ▼                      ▼            │
│   ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐   │
│   │ Supabase DB  │  │ Worker Threads   │  │ Platform Inbox │   │
│   │ (Encrypted)  │  │ (Publish jobs)   │  │ (Events)       │   │
│   └──────────────┘  └──────────────────┘  └────────────────┘   │
│           │                 │                      │            │
│           └─────────────────┼──────────────────────┘            │
│                             ▼                                   │
│                   ┌─────────────────────┐                       │
│                   │  Observability      │                       │
│                   │  (Logs, Metrics,    │                       │
│                   │   Alerts, DLQ)      │                       │
│                   └─────────────────────┘                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  External Platform APIs                                  │  │
│  │  Meta │ TikTok │ LinkedIn │ YouTube │ Shopify │ ...     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Connector Interface (TypeScript)

```typescript
// /server/connectors/shared/types.ts

export interface ConnectorConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface AuthResult {
  ok: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: { code: string; message: string };
}

export interface Account {
  id: string;
  name: string;
  externalId: string;
  platform: string;
  profileUrl?: string;
  profileImageUrl?: string;
}

export interface PostPayload {
  content: string;
  mediaUrls?: string[];
  scheduledFor?: Date;
  idempotencyKey: string;
  productTags?: { productId: string; position?: { x: number; y: number } }[];
}

export interface PostResult {
  ok: boolean;
  postId?: string;
  permalink?: string;
  scheduledAt?: Date;
  error?: { code: string; message: string };
}

export interface AnalyticsMetrics {
  impressions: number;
  engagements: number;
  clicks: number;
  conversions?: number;
  reachEstimate?: number;
}

export interface Connector {
  // Auth
  getAuthUrl(): string;
  exchangeCodeForToken(code: string): Promise<AuthResult>;
  refreshToken(refreshToken: string): Promise<AuthResult>;

  // Account data
  fetchAccounts(accessToken: string): Promise<Account[]>;
  verifyPermissions(accessToken: string): Promise<{ ok: boolean; missingScopes?: string[] }>;

  // Publishing
  createPost(accessToken: string, accountId: string, payload: PostPayload): Promise<PostResult>;
  schedulePost(accessToken: string, accountId: string, payload: PostPayload): Promise<PostResult>;
  editPost(accessToken: string, postId: string, payload: Partial<PostPayload>): Promise<PostResult>;
  deletePost(accessToken: string, postId: string): Promise<{ ok: boolean; error?: any }>;

  // Analytics
  getAnalytics(accessToken: string, accountId: string, timeframe: 'day' | 'week' | 'month'): Promise<AnalyticsMetrics>;

  // Webhooks
  validateWebhookSignature(payload: any, signature: string): boolean;
  parseWebhookEvent(payload: any): { type: string; data: any };

  // Health
  checkHealth(accessToken: string): Promise<{ healthy: boolean; errors?: string[] }>;
}
```

### 3.3 Database Schema Changes

```sql
-- Connections table: encrypted token storage
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  account_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'meta', 'linkedin', 'tiktok', etc.
  external_id VARCHAR(500) NOT NULL, -- platform's account ID
  account_name VARCHAR(255),
  scopes TEXT[], -- JSON array of granted scopes
  access_token_encrypted BYTEA NOT NULL,
  refresh_token_encrypted BYTEA,
  expires_at TIMESTAMP,
  last_refresh_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'healthy', -- healthy | expiring_soon | attention | revoked
  last_error_code VARCHAR(100),
  last_error_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, platform, external_id)
);

-- Publish jobs (async queue)
CREATE TABLE publish_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  connection_id UUID NOT NULL REFERENCES connections(id),
  content_id UUID,
  idempotency_key UUID NOT NULL,
  payload JSONB NOT NULL, -- { content, mediaUrls, scheduledFor, productTags }
  status VARCHAR(50) DEFAULT 'pending', -- pending | scheduled | published | failed | retrying
  attempt_count INT DEFAULT 0,
  max_attempts INT DEFAULT 4,
  external_post_id VARCHAR(500),
  external_permalink VARCHAR(1000),
  error_code VARCHAR(100),
  error_message TEXT,
  scheduled_for TIMESTAMP,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, idempotency_key)
);

-- Webhook events (audit trail)
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  platform VARCHAR(50),
  event_type VARCHAR(100),
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  received_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Integration health log
CREATE TABLE connection_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES connections(id),
  status VARCHAR(50),
  check_type VARCHAR(100), -- 'synthetic_ping' | 'token_refresh' | 'webhook_test'
  passed BOOLEAN,
  error_code VARCHAR(100),
  checked_at TIMESTAMP DEFAULT NOW()
);

-- Audit trail: every connection change
CREATE TABLE connection_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  connection_id UUID,
  action VARCHAR(100), -- 'connected' | 'reconnected' | 'revoked' | 'refreshed' | 'failed'
  user_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.4 Token Vault Implementation

```typescript
// /server/lib/token-vault.ts

import crypto from 'crypto';
import { supabase } from './supabase-client';

export class TokenVault {
  private kmsKeyId: string;
  private encryptionKey: Buffer;

  constructor(kmsKeyId: string) {
    this.kmsKeyId = kmsKeyId;
    // In production: fetch from AWS KMS / GCP / HashiCorp Vault
    // For now: derive from env
    this.encryptionKey = crypto.scryptSync(process.env.ENCRYPTION_PASSPHRASE!, 'salt', 32);
  }

  /**
   * Encrypt token before storage
   */
  encrypt(token: string): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt token after retrieval
   */
  decrypt(encryptedBuffer: Buffer): string {
    const iv = encryptedBuffer.slice(0, 16);
    const authTag = encryptedBuffer.slice(16, 32);
    const encrypted = encryptedBuffer.slice(32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }

  /**
   * Store encrypted token in DB
   */
  async storeToken(
    tenantId: string,
    platform: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date
  ): Promise<void> {
    const encryptedAccess = this.encrypt(accessToken);
    const encryptedRefresh = refreshToken ? this.encrypt(refreshToken) : null;

    await supabase
      .from('connections')
      .update({
        access_token_encrypted: encryptedAccess,
        refresh_token_encrypted: encryptedRefresh,
        expires_at: expiresAt,
        last_refresh_at: new Date(),
      })
      .eq('tenant_id', tenantId)
      .eq('platform', platform);
  }

  /**
   * Retrieve and decrypt token
   */
  async retrieveToken(connectionId: string): Promise<{ accessToken: string; refreshToken?: string } | null> {
    const { data } = await supabase
      .from('connections')
      .select('access_token_encrypted, refresh_token_encrypted')
      .eq('id', connectionId)
      .single();

    if (!data) return null;

    return {
      accessToken: this.decrypt(data.access_token_encrypted),
      refreshToken: data.refresh_token_encrypted ? this.decrypt(data.refresh_token_encrypted) : undefined,
    };
  }
}

export const tokenVault = new TokenVault(process.env.KMS_KEY_ID!);
```

### 3.5 Connector Manager (Orchestrator)

```typescript
// /server/lib/connector-manager.ts

import { Connector } from './connectors/types';
import { MetaConnector } from './connectors/meta';
import { LinkedInConnector } from './connectors/linkedin';
import { TikTokConnector } from './connectors/tiktok';
import { tokenVault } from './token-vault';

export class ConnectorManager {
  private connectors: Map<string, Connector> = new Map();

  constructor() {
    this.connectors.set('meta', new MetaConnector());
    this.connectors.set('linkedin', new LinkedInConnector());
    this.connectors.set('tiktok', new TikTokConnector());
    // ... add more
  }

  getConnector(platform: string): Connector | null {
    return this.connectors.get(platform) || null;
  }

  /**
   * Publish with retry logic, token refresh, and idempotency
   */
  async publishWithRetry(
    connectionId: string,
    payload: PostPayload,
    maxRetries: number = 4
  ): Promise<PostResult> {
    // Check idempotency
    const existing = await this.checkIdempotency(payload.idempotencyKey);
    if (existing) {
      return { ok: true, postId: existing.postId, permalink: existing.permalink };
    }

    // Get connection metadata
    const conn = await supabase.from('connections').select('*').eq('id', connectionId).single();
    if (!conn.data) throw new Error('Connection not found');

    // Ensure fresh token
    await this.ensureFreshToken(connectionId);

    // Retrieve decrypted token
    const tokens = await tokenVault.retrieveToken(connectionId);
    if (!tokens) throw new Error('Failed to decrypt token');

    const connector = this.getConnector(conn.data.platform);
    if (!connector) throw new Error(`Unknown platform: ${conn.data.platform}`);

    let lastError: PostResult | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await connector.createPost(tokens.accessToken, conn.data.external_id, payload);

        if (result.ok) {
          // Mark as published
          await this.markPublished(connectionId, payload.idempotencyKey, result.postId, result.permalink);
          return result;
        } else {
          // Check if error is retryable
          if (!this.isRetryable(result.error?.code)) {
            throw new Error(`Unretryable error: ${result.error?.code}`);
          }
          lastError = result;
        }
      } catch (error) {
        lastError = { ok: false, error: { code: 'publish_error', message: String(error) } };

        if (attempt < maxRetries) {
          // Exponential backoff + jitter
          const delayMs = Math.pow(2, attempt - 1) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // Mark as failed after retries exhausted
    await this.markFailed(connectionId, payload.idempotencyKey, lastError);
    return lastError || { ok: false, error: { code: 'max_retries', message: 'Max retries exceeded' } };
  }

  /**
   * Ensure token is fresh; refresh if near expiry
   */
  private async ensureFreshToken(connectionId: string): Promise<void> {
    const conn = await supabase.from('connections').select('*').eq('id', connectionId).single();
    if (!conn.data) throw new Error('Connection not found');

    const now = Date.now();
    const buffer = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (conn.data.expires_at && now < new Date(conn.data.expires_at).getTime() - buffer) {
      return; // Still fresh
    }

    const tokens = await tokenVault.retrieveToken(connectionId);
    if (!tokens?.refreshToken) throw new Error('No refresh token available');

    const connector = this.getConnector(conn.data.platform);
    if (!connector) throw new Error(`Unknown platform: ${conn.data.platform}`);

    const refreshResult = await connector.refreshToken(tokens.refreshToken);
    if (!refreshResult.ok) {
      // Mark connection as needing attention
      await supabase
        .from('connections')
        .update({ status: 'attention', last_error_code: refreshResult.error?.code })
        .eq('id', connectionId);
      throw new Error(`Token refresh failed: ${refreshResult.error?.code}`);
    }

    await tokenVault.storeToken(
      conn.data.tenant_id,
      conn.data.platform,
      refreshResult.accessToken!,
      refreshResult.refreshToken,
      new Date(refreshResult.expiresAt || Date.now() + 90 * 24 * 60 * 60 * 1000)
    );
  }

  private isRetryable(errorCode?: string): boolean {
    return ['rate_limit', '429', '500', '502', '503', 'timeout'].includes(errorCode || '');
  }

  private async checkIdempotency(idempotencyKey: string): Promise<any | null> {
    const { data } = await supabase
      .from('publish_jobs')
      .select('external_post_id, external_permalink')
      .eq('idempotency_key', idempotencyKey)
      .eq('status', 'published')
      .single();
    return data || null;
  }

  private async markPublished(connectionId: string, idempotencyKey: string, postId: string, permalink: string) {
    await supabase
      .from('publish_jobs')
      .update({ status: 'published', external_post_id: postId, external_permalink: permalink, published_at: new Date() })
      .eq('idempotency_key', idempotencyKey);
  }

  private async markFailed(connectionId: string, idempotencyKey: string, error: PostResult) {
    await supabase
      .from('publish_jobs')
      .update({ status: 'failed', error_code: error.error?.code, error_message: error.error?.message })
      .eq('idempotency_key', idempotencyKey);
  }
}

export const connectorManager = new ConnectorManager();
```

---

## PART 4: IMPLEMENTATION PHASES

### Phase 1: Foundation (Weeks 1–8)

#### Week 1–2: Architecture & Infrastructure
- [ ] Set up Connector interface + types
- [ ] Implement TokenVault (encryption, storage, retrieval)
- [ ] Design + deploy new DB tables (connections, publish_jobs, webhook_events, etc.)
- [ ] Set up Redis/Bull for queue system
- [ ] Create ConnectorManager orchestrator

#### Week 3–4: Meta Connector
- [ ] Implement Meta OAuth flow
- [ ] Handle Meta Graph API (feed, account details, publishing)
- [ ] Add token refresh logic
- [ ] Implement webhook handling (app deauthorized, permissions changed)
- [ ] Write tests (mock API responses)

#### Week 5–6: LinkedIn + TikTok Connectors
- [ ] LinkedIn OAuth + publishing
- [ ] TikTok OAuth + video upload (complex; separate upload endpoint)
- [ ] Refresh + webhook handlers
- [ ] Tests

#### Week 7: Google Business Profile + Mailchimp
- [ ] GBP OAuth + posting + reviews endpoint
- [ ] Mailchimp OAuth + newsletter publish
- [ ] Tests

#### Week 8: Health Dashboard + Observability
- [ ] Build "Linked Accounts" page UI (show connection status, refresh dates, error alerts)
- [ ] Create integration health dashboard (token expiries, API latency, error rates)
- [ ] Set up alerts (Slack, email) for token refresh failures + auth errors
- [ ] Create DLQ + failure analytics

**Deliverable**: Phase 1 MVP (5 connectors, token health, basic monitoring)

---

### Phase 2: Growth & Stability (Weeks 9–20)

#### Week 9–12: Advanced Connectors
- [ ] YouTube / Shorts
- [ ] Pinterest
- [ ] Shopify (product tagging + CTAs)
- [ ] Canva (design import)
- [ ] Google Analytics 4

#### Week 13–16: Advanced Features
- [ ] Capability matrix (JSON-driven UI)
- [ ] "Create Post" multi-platform modal
- [ ] Cross-platform analytics aggregation
- [ ] Advisor AI insights ("Your Shopify products outperform others 3x on IG")
- [ ] Workflow automation triggers ("When approved → auto-publish to all platforms")

#### Week 17–20: Polish & Hardening
- [ ] Load testing (100+ users, many accounts)
- [ ] Rate-limit testing + bulkhead validation
- [ ] Webhook resilience (retry, dead letter, replay)
- [ ] E2E tests (auth → post → analytics → reconnect flow)
- [ ] Documentation + runbooks

**Deliverable**: Phase 2 (8+ connectors, advanced AI, automation)

---

### Phase 3: Enterprise & Specialized (Weeks 21+)

#### Tier 3 Integrations
- [ ] HubSpot (CRM sync, campaign links)
- [ ] Salesforce (same)
- [ ] Custom connector framework (allow partners to build)
- [ ] Advanced audio licensing (TikTok CML if available)

#### Advanced Monitoring
- [ ] SLOs + burn-rate alerts
- [ ] Partner API status page integration
- [ ] Automated incident response (auto-pause if platform outage detected)
- [ ] Quarterly API deprecation scans

---

## PART 5: UI/UX IMPLEMENTATION

### 5.1 Capability Matrix (JSON)

```json
{
  "meta": {
    "name": "Meta (Facebook / Instagram)",
    "formats": ["post", "story", "reel", "carousel", "video"],
    "supports": {
      "productTags": true,
      "trendingAudio": false,
      "scheduling": true,
      "editing": true,
      "deletion": true
    },
    "constraints": {
      "imageSizeMin": 1080,
      "imageSizeMax": 6000,
      "videoLengthMax": 3600,
      "characterLimit": 2200,
      "carouselMax": 10
    },
    "healthStatus": "healthy",
    "scopesGranted": ["instagram_business_manage_messages", "instagram_business_content_publish"]
  },
  "linkedin": {
    "name": "LinkedIn",
    "formats": ["article", "update", "event"],
    "supports": {
      "productTags": false,
      "trendingAudio": false,
      "scheduling": true,
      "editing": false,
      "deletion": true
    },
    "constraints": {
      "characterLimit": 3000,
      "imageSizeMax": 10000
    },
    "healthStatus": "healthy",
    "scopesGranted": ["w_member_social"]
  },
  "tiktok": {
    "name": "TikTok",
    "formats": ["video"],
    "supports": {
      "productTags": false,
      "trendingAudio": "limited",
      "scheduling": true,
      "editing": false,
      "deletion": true
    },
    "constraints": {
      "videoLengthMin": 3,
      "videoLengthMax": 1800,
      "videoSizeMax": 287671232
    },
    "healthStatus": "attention",
    "scopesGranted": ["user.info.basic", "video.publish"],
    "warning": "Token expires in 2 days"
  }
}
```

### 5.2 "Create Post" Modal Flow

```typescript
// React component structure

<CreatePostModal
  connectedAccounts={accounts} // [{ platform: 'meta', account: {...}, health: 'healthy' }]
  capabilityMatrix={matrix}    // above JSON
  onPublish={(payload) => {...}}
>
  {/* Step 1: Select Platforms */}
  <PlatformSelector
    platforms={connectedAccounts}
    selected={selected}
    onChange={setSelected}
  />

  {/* Step 2: Content Composer */}
  <ContentComposer
    platforms={selected}
    capabilityMatrix={matrix}
    dynamicConstraints={getConstraints(selected)}
  />

  {/* Step 3: Preview */}
  <PreviewPanel
    platforms={selected}
    content={content}
    charCounts={countChars(selected)}
  />

  {/* Step 4: Confirm */}
  <ConfirmPublish
    onPublish={() => publish(...)}
    scheduling={scheduling}
  />
</CreatePostModal>
```

### 5.3 Linked Accounts / Connection Status Page

```typescript
// Show each connection with status + actions

<LinkedAccountsPage>
  {connections.map(conn => (
    <ConnectionCard key={conn.id}>
      <PlatformIcon platform={conn.platform} />
      <AccountName>{conn.accountName}</AccountName>

      {/* Status indicator */}
      {conn.status === 'healthy' && <Badge color="green">Healthy</Badge>}
      {conn.status === 'expiring_soon' && <Badge color="yellow">Expires in 3 days</Badge>}
      {conn.status === 'attention' && <Badge color="red">Requires Action</Badge>}

      {/* Last sync + actions */}
      <LastSync>{formatDate(conn.lastRefreshAt)}</LastSync>
      <Actions>
        <Button onClick={() => manualRefresh(conn.id)}>Refresh Now</Button>
        <Button onClick={() => disconnect(conn.id)}>Disconnect</Button>
        {conn.status === 'attention' && (
          <Button onClick={() => reconnect(conn.platform)} primary>
            Reconnect
          </Button>
        )}
      </Actions>

      {/* Error details */}
      {conn.lastErrorCode && (
        <ErrorMessage>
          Error: {conn.lastErrorCode} — {conn.lastErrorMessage}
        </ErrorMessage>
      )}

      {/* Scopes granted */}
      <ScopesList scopes={conn.scopes} />
    </ConnectionCard>
  ))}

  {/* Health Dashboard */}
  <HealthDashboard
    tokenExpiries={tokensByExpiryDate}
    apiLatency={latencyByPlatform}
    errorRates={errorsByPlatform}
  />
</LinkedAccountsPage>
```

---

## PART 6: ERROR RECOVERY & AUTO-HEAL Playbook

### When a Connection Breaks

1. **Detect**
   - Webhook: `app_deauthorized`, `permissions_removed`
   - Failed call: 401 (auth), 403 (permission), 410 (account gone)
   - Synthetic ping: scheduled health check fails

2. **Classify**
   - Refreshable → auto-attempt refresh; if success, resume
   - User action → move to blocked state, notify with Reconnect link

3. **Pause & Protect**
   - Set `status = 'attention'`
   - Pause all scheduled publishes for that channel (keep in queue, don't delete)
   - Notify user in-app + email

4. **One-Click Reconnect**
   - Show modal with error message (plain language)
   - Highlight affected platform + account
   - Button: "Reconnect [Platform]" → starts OAuth with exact scopes pre-filled

5. **Backfill**
   - After reconnect, offer "Publish missed items" (checkbox + count)
   - Re-enqueue with same `idempotencyKey` (no duplicates)

---

## PART 7: DEPLOYMENT & ROLLOUT STRATEGY

### Feature Flags per Integration

```typescript
// Use Supabase feature flags to enable/disable per tenant

export async function isIntegrationEnabled(tenantId: string, platform: string): Promise<boolean> {
  const { data } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('tenant_id', tenantId)
    .eq('feature', `integration_${platform}`)
    .single();

  return data?.enabled ?? false;
}
```

### Gradual Rollout

1. **Alpha** (Week 1): Internal team only. Catch obvious bugs.
2. **Beta** (Week 2): 10% of users. Monitor error rates + usage.
3. **Stable** (Week 3): 100% rollout. Enable via feature flag in Supabase.

---

## PART 8: MONITORING & ALERTS

### Key Metrics Dashboard

```
┌─ Token Health ──────────────────────┐
│ Expiring in <7d: 3 accounts         │
│ Expiring in <24h: 1 account         │
│ Failed refreshes (last 24h): 0      │
└─────────────────────────────────────┘

┌─ API Performance ───────────────────┐
│ Meta:       95.2% success, 342ms    │
│ LinkedIn:   99.1% success, 198ms    │
│ TikTok:     93.8% success, 2100ms   │
│ GBP:        100% success, 120ms     │
└─────────────────────────────────────┘

┌─ Error Distribution ────────────────┐
│ 401 Auth errors:        2           │
│ 429 Rate limits:        0           │
│ 500+ Server errors:     1           │
│ Timeout:                3           │
│ Unretryable (4xx):      2           │
└─────────────────────────────────────┘

┌─ Queue Health ──────────────────────┐
│ Pending jobs:           42          │
│ Published (24h):        156         │
│ Failed (24h):           8           │
│ DLQ size:               2           │
└─────────────────────────────────────┘
```

### Alert Rules

```
1. Token refresh failure → Slack alert + email
2. API error rate > 5% → Slack alert
3. Webhook delivery failure > 3× → Page On-Call
4. Queue backlog > 1000 jobs → Investigate resource
5. New platform outage detected → Pause publishes, notify users
```

---

## PART 9: SECURITY CHECKLIST

- [ ] Encrypt tokens at rest (AES-256-GCM)
- [ ] Use KMS for encryption key rotation (quarterly)
- [ ] Scopes: request only what's needed; audit granted scopes
- [ ] No tokens in logs, error messages, or client-side
- [ ] Rate-limit per tenant (not per platform globally)
- [ ] Webhook signature verification (HMAC-SHA256)
- [ ] Audit trail: every connection change + reason
- [ ] Principle of least privilege: service accounts per connector
- [ ] GDPR: implement data deletion on disconnect
- [ ] Secrets rotation: quarterly for app credentials

---

## PART 10: GO / NO-GO CHECKLIST BEFORE PHASE 1 LAUNCH

Phase 1 Launch Criteria (All must be ✅):

- [ ] DB schema migration tested in staging
- [ ] TokenVault encrypt/decrypt working + KMS integration confirmed
- [ ] Meta connector: OAuth flow end-to-end tested
- [ ] Publishing pipeline: idempotency + retries working
- [ ] Error recovery: reconnect flow UI mockup ready
- [ ] Monitoring: dashboards + alerts deployed
- [ ] E2E test: signup → connect Meta → post → analytics
- [ ] Load test: 50 concurrent users, 100 scheduled posts
- [ ] Security: token encryption + rotation validated
- [ ] Documentation: runbook + API docs ready
- [ ] Legal: compliance matrix for data handling reviewed

---

## NEXT STEPS

1. **Week 1**: Convene architecture review → finalize DB schema + token strategy
2. **Week 2**: Begin Phase 1 foundation build (vault + connectors framework)
3. **Week 3**: Start Meta connector implementation
4. **Weekly**: Sync on progress, blockers, and design questions

**Questions for alignment:**

1. Do you want to use **Redis + Bull** or **RabbitMQ** for the queue system?
2. For key management: **AWS KMS**, **GCP Secret Manager**, or **HashiCorp Vault**?
3. For observability: **Datadog**, **Grafana + Prometheus**, or **Sentry**?
4. Timeline: Can we commit to **Phase 1 MVP (5 connectors) by end of 2025**?

---

**Document Version**: 1.0
**Last Updated**: November 11, 2025
**Status**: Ready for Architecture Review & Implementation Kickoff

