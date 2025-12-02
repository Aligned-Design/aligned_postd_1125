# 🚀 POSTD Phase 1 Infrastructure Setup - Engineer Guide

> **Status:** ✅ Completed – This phase infrastructure has been fully implemented in the current POSTD platform.  
> **Last Updated:** 2025-01-20

**Last Updated**: November 11, 2025  
**Audience**: Backend engineers implementing connectors

---

## Quick Start (30 minutes)

### 1. Prerequisites

```bash
# Check Node.js version (18+ required)
node --version

# Check we have pnpm installed
pnpm --version

# If not: npm install -g pnpm
```

### 2. Install Dependencies

```bash
cd server
pnpm install

# New packages for Week 1
pnpm add bull ioredis @supabase/supabase-js uuid pino

# Dev dependencies
pnpm add -D typescript @types/node @types/bull
```

### 3. Environment Setup

Create `.env.local` in project root:

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
SUPABASE_ACCESS_TOKEN=xxx

# Redis (local development)
REDIS_HOST=localhost
REDIS_PORT=6379

# Security (local dev only!)
TOKEN_VAULT_MASTER_SECRET=dev-key-$(openssl rand -hex 16)

# Observability
DATADOG_API_KEY=xxx (optional for now)
DATADOG_SITE=datadoghq.com

# App config
NODE_ENV=development
LOG_LEVEL=debug
APP_VERSION=0.1.0
```

### 4. Start Services

```bash
# Terminal 1: Redis (if running locally)
docker-compose up redis

# Terminal 2: Application
npm run dev

# Terminal 3 (optional): Bull UI for queue visualization
npx bull-board -p 3001
```

### 5. Deploy Database

```bash
# Deploy schema (creates 14 tables, 3 views)
npx tsx server/scripts/deploy-db-schema.ts

# Verify deployment
npx tsx server/scripts/db-healthcheck.ts

# Full system health check
npx tsx server/scripts/integration-health.ts
```

**Expected output**: ✅ All checks passing

---

## Understanding the Infrastructure

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│ Express API Server                              │
│ - OAuth endpoints: /api/oauth/*/start           │
│ - Publish endpoint: POST /api/publish            │
│ - Health endpoint: GET /api/health/queue        │
└────────────┬────────────────────────────────────┘
             │
    ┌────────┼────────────────┐
    │        │                │
    ▼        ▼                ▼
┌────────┐ ┌─────────────┐ ┌──────────┐
│Supabase│ │Bull Queue   │ │TokenVault│
│ (Conn- │ │ (Redis-     │ │(AES-256) │
│ ections│ │  backed)    │ │+ KMS     │
│ Audit) │ │             │ │          │
└────────┘ └──────┬──────┘ └──────────┘
                  │
                  │ Jobs: publish, health_check, token_refresh
                  │
                  ▼
           ┌─────────────────┐
           │ Worker Processes│
           │ (Bull Jobs)     │
           │ - 5 pub threads │
           │ - 10 health     │
           │ - 5 token       │
           └────────┬────────┘
                    │
        ┌───────────┼───────────┬──────────────┬──────────┐
        │           │           │              │          │
        ▼           ▼           ▼              ▼          ▼
      Meta      LinkedIn     TikTok           GBP   Mailchimp
      APIs       APIs         APIs           APIs      APIs
```

### Key Concepts

#### 1. TokenVault (Encryption)

All sensitive data encrypted before storage:

```typescript
import TokenVault from './lib/token-vault';

const vault = new TokenVault(config);

// Store (user authenticates via OAuth)
const encrypted = await vault.encrypt(accessToken);
await vault.storeSecret(tenantId, connectionId, 'access_token', accessToken);

// Retrieve (when publishing)
const token = await vault.retrieveSecret(tenantId, connectionId, 'access_token');
// token now decrypted and ready to use
```

**Why**: OAuth tokens are secrets that must never be logged or exposed.

#### 2. Bull Queue (Job Processing)

Asynchronous job processing with automatic retry:

```typescript
import { publishJobQueue } from './queue';

// Add a job
const job = await publishJobQueue.add('publish', {
  tenantId, connectionId, platform, body, mediaUrls
}, {
  jobId: idempotencyKey, // Prevents duplicate publishes
  attempts: 4,           // Retry up to 4 times
  backoff: { type: 'exponential', delay: 1000 }
});

// Retry schedule: 1s → 3s → 9s → 27s
// 5 concurrent workers prevent overload
// Jobs that fail 4x move to DLQ (Dead Letter Queue)
```

**Why**: Publishing takes time. We queue it, retry on failures, and track what broke.

#### 3. Feature Flags (Gradual Rollout)

Control which platforms are available per tenant:

```typescript
import { getFeatureFlagsManager } from './lib/feature-flags';

const flags = getFeatureFlagsManager();

if (await flags.isEnabled('integration_meta', tenantId)) {
  // Show Meta integration option
}

// Control rollout percentage
await flags.setRolloutPercentage('integration_tiktok', 50); // 50% of users
```

**Why**: Don't turn on all platforms at once. Test with 10%, then 50%, then 100%.

#### 4. Datadog Observability

All operations logged with context:

```typescript
import { logger, recordMetric, measureLatency } from './lib/observability';

// Structured logging
logger.info({
  cycleId: 'cycle_abc123',
  requestId: 'req_def456',
  tenantId: 'tenant_xyz',
  platform: 'meta',
  latencyMs: 245
}, 'Publish completed');

// Custom metrics
recordMetric('api.publish.latency', 245, { platform: 'meta' });

// Measure operation
await measureLatency('fetch_accounts', async () => {
  return await metaConnector.fetchAccounts();
}, { tenantId });
```

**Why**: See what's slow, where errors happen, which users are affected.

---

## Connector Implementation

### Step 1: Understand the Base Interface

All connectors extend `BaseConnector` in `server/connectors/base.ts`:

```typescript
export abstract class BaseConnector {
  abstract authenticate(code: string, state: string): Promise<OAuthResult>;
  abstract refreshToken(refreshToken: string): Promise<OAuthResult>;
  abstract fetchAccounts(): Promise<Account[]>;
  abstract publish(...): Promise<PublishResult>;
  abstract deletePost(...): Promise<void>;
  abstract getPostAnalytics(...): Promise<AnalyticsMetrics>;
  abstract healthCheck(): Promise<HealthCheckResult>;
  abstract validateWebhookSignature(...): boolean;
  abstract parseWebhookEvent(...): any;
}
```

### Step 2: Start with Meta

**Why Meta first?**
- Largest user demand
- Good documentation
- Teaches error handling (has complex requirements)

**Scaffold**: `server/connectors/meta/index.ts`

Full specification: `CONNECTOR_SPECS_META.md` (100+ implementation details)

### Step 3: Implement Each Method

Example: `authenticate` method for Meta

```typescript
async authenticate(code: string, state: string): Promise<OAuthResult> {
  try {
    // 1. Exchange code for short-lived token
    const shortLivedResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${META_CLIENT_ID}&` +
      `client_secret=${META_CLIENT_SECRET}&` +
      `code=${code}&` +
      `redirect_uri=${REDIRECT_URI}`
    );

    if (!shortLivedResponse.ok) {
      throw new Error(`OAuth failed: ${shortLivedResponse.status}`);
    }

    const shortLived = await shortLivedResponse.json();

    // 2. Exchange for long-lived token
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${META_CLIENT_ID}&` +
      `client_secret=${META_CLIENT_SECRET}&` +
      `fb_exchange_token=${shortLived.access_token}`
    );

    const longLived = await longLivedResponse.json();

    // 3. Get user ID
    const meResponse = await fetch(
      `https://graph.facebook.com/me?access_token=${longLived.access_token}`
    );

    const me = await meResponse.json();

    // 4. Store encrypted token in vault
    await this.vault.storeSecret(
      this.tenantId,
      this.connectionId,
      'access_token',
      longLived.access_token
    );

    // 5. Return result
    return {
      accessToken: longLived.access_token,
      refreshToken: null, // Meta tokens don't refresh
      expiresIn: longLived.expires_in,
      userId: me.id,
      scopes: ['pages_manage_metadata', 'pages_manage_posts'],
    };

  } catch (error) {
    logger.error({ error: error.message }, '[Meta] Authentication failed');
    throw error;
  }
}
```

### Step 4: Test Your Implementation

```bash
# Unit tests
npm run test server/connectors/meta/__tests__/authenticate.test.ts

# Integration test with real API (use sandbox account!)
npm run test:integration server/connectors/meta/__tests__/full-flow.test.ts

# Manual testing
curl -X POST http://localhost:3000/api/oauth/meta/start \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"test-tenant"}'
```

---

## Error Handling & Retry Logic

### Classification

**Retryable Errors** (will retry with backoff):
- 429 (Rate limit) → Back off 1s, 3s, 9s, 27s
- 5xx (Server error) → Retry immediately
- 408 (Timeout) → Retry immediately

**Non-Retryable Errors** (fail immediately, go to DLQ):
- 400 (Bad request) → Fix the request format
- 401 (Unauthorized) → Re-authenticate
- 403 (Forbidden) → Check scopes
- 404 (Not found) → Content was deleted

### Implementation

```typescript
async function handlePublishError(
  error: Error,
  jobData: PublishJobData,
  attemptNumber: number
) {
  const errorCode = classifyError(error);
  const isRetryable = isRetryableError(errorCode);

  if (isRetryable && attemptNumber < 4) {
    // Bull will auto-retry with exponential backoff
    throw error;
  } else if (!isRetryable || attemptNumber >= 4) {
    // Move to DLQ
    await publishJobQueue.add('dlq', {
      ...jobData,
      dlqReason: isRetryable ? 'Max retries' : `Unretryable: ${errorCode}`,
      originalError: error.message,
    });

    // Alert team
    logger.error({
      jobId: jobData.jobId,
      errorCode,
      dlqReason
    }, 'Job moved to DLQ - manual review required');
  }
}
```

---

## Testing Checklist

Before starting implementation, prepare:

**Test Account Setup** (per platform):
- [ ] Meta: Create Meta Developer App, sandbox page, IG Business account
- [ ] LinkedIn: Create LinkedIn app, sandbox account
- [ ] TikTok: Request sandbox access (24-72h wait), get credentials
- [ ] GBP: Create GCP project, test business location
- [ ] Mailchimp: Get API key, create test list

**Code Readiness**:
- [ ] Run `npm run typecheck` - 0 TypeScript errors
- [ ] Run `npm run lint` - 0 linting errors
- [ ] Run `npm test` - All unit tests passing
- [ ] Run `npm run integration-health` - All systems green

**Connector Readiness**:
- [ ] All 8 abstract methods implemented
- [ ] All error cases handled (retryable vs non-retryable)
- [ ] Health check passing
- [ ] TokenVault integration confirmed
- [ ] Webhook signature validation working

---

## Debugging Tips

### 1. Check Logs

```bash
# Real-time logs from Bull queue
tail -f logs/queue.log

# System health report
cat logs/system-health.json | jq '.components[] | select(.status != "healthy")'

# Recent errors
grep "ERROR\|WARN" logs/*.log | tail -20
```

### 2. Check Bull UI

```bash
# Start Bull UI (requires bull-board)
npx bull-board -p 3001

# Navigate to http://localhost:3001
# See queued jobs, active jobs, failed jobs, completed jobs
```

### 3. Check Database

```bash
# List all connections
supabase sql "SELECT id, platform_id, status, last_health_check FROM connections LIMIT 10"

# Check for stalled tokens
supabase sql "SELECT * FROM connections WHERE token_expires_at < NOW() + interval '1 hour'"

# View error log
supabase sql "SELECT * FROM publish_job_errors ORDER BY created_at DESC LIMIT 20"
```

### 4. Test OAuth Redirect

```bash
# Manually trigger OAuth flow
curl -X POST http://localhost:3000/api/oauth/meta/start \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"test-tenant"}'

# Should return redirect URL to Meta login
```

---

## Performance Monitoring

### Key Metrics to Watch

**Latency** (should be <500ms for publishing):
```bash
curl http://localhost:3000/api/health/metrics \
  | jq '.metrics[] | select(.name == "api.publish.latency")'
```

**Error Rate** (should be <5%):
```bash
# From Datadog
curl -H "DD-API-KEY: ${DATADOG_API_KEY}" \
  https://api.datadoghq.com/api/v1/query?query=avg:aligned_connector.api.error_rate
```

**Queue Depth** (should process within seconds):
```bash
curl http://localhost:3000/api/health/queue \
  | jq '.queues[] | select(.waiting > 10)'
```

---

## Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| "Cannot find module 'bull'" | Run `pnpm install bull` |
| "Redis connection refused" | Start Redis: `docker-compose up redis` |
| "TokenVault health check failed" | Verify database has `encrypted_secrets` table |
| "Feature flag not found" | Run migration: `npx tsx server/scripts/deploy-db-schema.ts` |
| "OAuth callback 401" | Check credentials in `.env`, verify redirect URI registered |
| "Job stuck in 'active' state" | Bull UI → Monitor → see if worker crashed, check logs |
| "Datadog metrics not showing" | Verify `DATADOG_API_KEY` valid, check network connection |

---

## Week 1 Timeline

| Day | Task | Owner | Hours |
|-----|------|-------|-------|
| Mon AM | Kickoff, confirm decisions | Team | 1 |
| Mon PM | Deploy database, verify schema | Tech Lead | 2 |
| Tue AM | OAuth flow setup (all platforms) | Owners | 8 |
| Tue PM | Account fetching (all platforms) | Owners | 8 |
| Wed AM | Publishing endpoints (focus Meta) | Owners | 8 |
| Wed PM | Error handling + DLQ testing | Team | 4 |
| Thu AM | Health checks + token refresh | Owners | 4 |
| Thu PM | Webhook integration + testing | Owners | 4 |
| Fri | Documentation + runbooks | Tech Lead | 4 |

---

## Success Criteria (Week 1 End)

✅ All infrastructure deployed and passing health checks
✅ Meta connector 100% functional (OAuth → publish → analytics)
✅ LinkedIn connector OAuth + publishing working
✅ TikTok connector video upload working
✅ GBP connector post creation working
✅ Mailchimp connector campaign creation working
✅ Error handling tested with DLQ working
✅ Health checks running every 6 hours
✅ Datadog metrics flowing
✅ Team confident to launch to staging

---

## Resources

- **Architecture**: [API_INTEGRATION_STRATEGY.md](./API_INTEGRATION_STRATEGY.md)
- **Meta Spec**: [CONNECTOR_SPECS_META.md](./CONNECTOR_SPECS_META.md)
- **Shared Patterns**: [CONNECTOR_SPECS_SHARED.md](./CONNECTOR_SPECS_SHARED.md)
- **Deployment**: [INFRA_DEPLOYMENT_REPORT.md](./INFRA_DEPLOYMENT_REPORT.md)
- **Schedule**: [THIS_WEEK_ACTION_PLAN.md](./THIS_WEEK_ACTION_PLAN.md)

---

**Questions?** Ask in #engineering-alerts Slack or check the inline comments in TypeScript files.

Good luck! 🚀
