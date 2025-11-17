# Aligned-20ai Database Structure & Mock Storage Analysis

## Executive Summary
The Aligned-20ai codebase has a **hybrid database architecture** with partial Supabase integration. There are **3 main database service files** handling specific domains, **12 Supabase migrations** defining the schema, and **minimal mock/in-memory storage** with a focus on real database persistence.

---

## 1. DATABASE SERVICE FILES (server/lib/)

### 3 Main Database Service Files

#### 1.1 **dbClient.ts** - Core Database Client (Primary)
**Location:** `/Users/krisfoust/Documents/GitHub/Aligned-20ai/server/lib/dbClient.ts`
**Purpose:** Unified Supabase client wrapper with type-safe interfaces

**Entities Handled:**
- **Client Settings** - Email preferences, notifications per client/brand
- **Post Approvals** - Approval workflow tracking (pending/approved/rejected)
- **Audit Logs** - Comprehensive audit trail for compliance
- **Webhook Events** - Incoming webhook processing with idempotency
- **Webhook Attempts** - Retry tracking for webhook delivery
- **Escalation Rules** - Brand-level escalation configuration
- **Escalation Events** - Triggered escalation notifications

**Record Interfaces:**
```typescript
interface ClientSettingsRecord {
  id, client_id, brand_id, email_preferences, timezone, language,
  unsubscribe_token, unsubscribed_from_all, unsubscribed_types
}

interface PostApprovalRecord {
  id, brand_id, post_id, status, approved_at, approved_by,
  rejected_at, rejected_by, locked
}

interface AuditLogRecord {
  id, brand_id, post_id, actor_id, actor_email, action,
  metadata, ip_address, user_agent
}

interface WebhookEventRecord {
  id, brand_id, provider, event_type, payload, idempotency_key,
  status, attempt_count, max_attempts, delivered_at
}

interface EscalationRuleRecord {
  id, brand_id, rule_type, trigger_hours, target_type,
  escalate_to_role, notify_via, enabled
}

interface EscalationEventRecord {
  id, brand_id, approval_id, post_id, rule_id, escalation_level,
  status, scheduled_send_at, sent_at, resolved_at
}
```

**Features:**
- Singleton Supabase client initialization
- Custom `DatabaseError` class for error handling
- RLS (Row-Level Security) policies integrated
- Database health check function
- Service role authentication

---

#### 1.2 **analytics-db-service.ts** - Analytics & Metrics
**Location:** `/Users/krisfoust/Documents/GitHub/Aligned-20ai/server/lib/analytics-db-service.ts`
**Purpose:** Analytics metrics, goals, and learning feedback

**Entities:**
- **Analytics Metrics** - Platform-specific metrics (reach, engagement, followers)
- **Analytics Sync Logs** - Audit trail of sync operations
- **Analytics Goals** - Goal tracking and progress
- **Advisor Feedback** - Learning system weights and feedback
- **Auto Plans** - Generated content plans with confidence scores

**Class Methods:**
```typescript
class AnalyticsDBService {
  getMetricsByDateRange(brandId, platform, startDate, endDate)
  getLatestMetrics(brandId)
  getMetricsSummary(brandId, days)
  getPlatformStats(brandId, platform, days)
  logSync(brandId, tenantId, platform, syncType, status...)
  upsertGoal(brandId, tenantId, metric, target, deadline)
  getGoals(brandId)
  updateGoalProgress(goalId, current, status)
  logFeedback(brandId, tenantId, insightId, category, type, feedback...)
  getAverageWeights(brandId)
}
```

**Singleton Export:**
```typescript
export const analyticsDB = new AnalyticsDBService();
```

---

#### 1.3 **connections-db-service.ts** - Platform Connections (OAuth)
**Location:** `/Users/krisfoust/Documents/GitHub/Aligned-20ai/server/lib/connections-db-service.ts`
**Purpose:** OAuth token management and platform connection lifecycle

**Entity:**
```typescript
interface PlatformConnectionRecord {
  id, brand_id, tenant_id, platform, account_id, account_name,
  profile_picture, access_token, refresh_token, token_expires_at,
  status (connected|expired|revoked|disconnected), permissions, metadata
}
```

**Class Methods:**
```typescript
class ConnectionsDBService {
  upsertConnection(brandId, tenantId, platform, accessToken...)
  getConnection(brandId, platform)
  getBrandConnections(brandId)
  getConnectedPlatforms(brandId)
  updateConnectionStatus(connectionId, status)
  updateAccessToken(connectionId, accessToken, refreshToken, expiresAt)
  disconnectPlatform(brandId, platform)
  deleteConnection(brandId, platform)
  getExpiringConnections(hoursUntilExpiry)
  verifyConnection(connectionId)
  getConnectionStats(brandId)
  updateConnectionStatuses(updates)
  searchConnections(brandId, filters)
}
```

---

#### 1.4 **publishing-db-service.ts** - Publishing Jobs & Logs
**Location:** `/Users/krisfoust/Documents/GitHub/Aligned-20ai/server/lib/publishing-db-service.ts`
**Purpose:** Publishing job persistence and audit trail

**Entities:**
```typescript
interface PublishingJobRecord {
  id, brand_id, tenant_id, content, platforms, scheduled_at,
  status, retry_count, max_retries, published_at, last_error
}

interface PublishingLogRecord {
  id, job_id, brand_id, platform, status, attempt_number,
  platform_post_id, platform_post_url, error_code, error_message
}
```

**Class Methods:**
```typescript
class PublishingDBService {
  createPublishingJob(brandId, tenantId, content, platforms, scheduledAt, userId)
  getPublishingJob(jobId, brandId)
  getPendingJobs(limit)
  updateJobStatus(jobId, status, updates)
  incrementRetryCount(jobId)
  markJobPublished(jobId)
  markJobFailed(jobId, error, errorDetails)
  createPublishingLog(jobId, brandId, platform, status, attemptNumber, options)
  getPublishingLogs(jobId)
  getBrandPublishingLogs(brandId, platform, limit)
  createSyncLog(brandId, tenantId, platform, syncType...)
  getPlatformStats(brandId, days)
  getJobHistory(brandId, limit, offset)
  getBrandPostingConfig(brandId)
}
```

---

## 2. SUPABASE MIGRATIONS (supabase/migrations/)

### 12 Migration Files (Chronological Order)

| # | File | Date | Purpose | Tables |
|---|------|------|---------|--------|
| 1 | `20250115_create_brand_embeddings.sql` | 01/15 | Brand embeddings for AI similarity | `brand_embeddings` |
| 2 | `20250116_create_brand_kit_history.sql` | 01/16 | Brand kit version control | `brand_kit_history` |
| 3 | `20250117_create_agent_safety_tables.sql` | 01/17 | AI agent safety & guardrails | `agent_guardrails`, `agent_execution_logs` |
| 4 | `20250118_create_content_calendar_tables.sql` | 01/18 | Content planning & scheduling | `content_calendar_items`, `content_plans` |
| 5 | `20250119_create_integrations_tables.sql` | 01/19 | Platform integrations | `platform_connections`, `social_posts`, `platform_reviews`, `platform_events`, `review_response_templates` |
| 6 | `20250120_create_dashboard_client_portal_tables.sql` | 01/20 | Dashboards & analytics | Multiple dashboard tables |
| 7 | `20250121_create_phase_9_client_settings.sql` | 01/21 | Client email preferences | `client_settings` (470 lines) |
| 8 | `20250122_create_phase_9_post_approvals.sql` | 01/22 | Post approval workflow | `post_approvals` (83 lines) |
| 9 | `20250123_create_phase_9_audit_logs.sql` | 01/23 | Audit trail for compliance | `audit_logs` (131 lines) |
| 10 | `20250125_create_webhook_events.sql` | 01/25 | Webhook event processing | `webhook_events` (134 lines) |
| 11 | `20250125_create_webhook_attempts.sql` | 01/25 | Webhook retry attempts | `webhook_attempts` (150 lines) |
| 12 | `20250126_create_escalation_rules.sql` | 01/26 | Escalation & notifications | `escalation_rules`, `escalation_events`, `escalation_history` (390 lines) |

---

## 3. SERVER MIGRATIONS (server/migrations/)

### 3 Migration Files

#### 3.1 `006_media_tables.sql`
**Purpose:** Phase 6 - Media asset management
**Tables:**
- `media_assets` - File metadata, hash, variants, usage tracking
- `media_usage_logs` - Asset reuse tracking
- `storage_quotas` - Brand storage limits (5GB default)

**Key Features:**
- SHA256 hash for duplicate detection
- Variant tracking (different sizes)
- Usage count auto-increment via trigger
- Multi-tenant brand isolation with RLS

---

#### 3.2 `007_publishing_jobs_and_logs.sql`
**Purpose:** Phase 7 - Publishing persistence & OAuth
**Tables:**
- `publishing_jobs` - Job persistence with retry logic
- `publishing_logs` - Audit trail per platform
- `platform_connections` - OAuth token storage (duplicate of Supabase)
- `platform_sync_logs` - Analytics sync tracking

**Note:** `platform_connections` defined in BOTH server/migrations/ and supabase/migrations/

---

#### 3.3 `008_analytics_metrics.sql`
**Purpose:** Phase 8 - Analytics storage
**Tables:**
- `analytics_metrics` - Platform metrics (reach, engagement, followers)
- `analytics_sync_logs` - Sync operation audit
- `analytics_goals` - Goal tracking
- `advisor_feedback` - Learning system feedback
- `auto_plans` - Generated content plans

---

## 4. DATABASE TYPES (src/types/db.ts)

Conservative, hand-written TypeScript interfaces (not generated):

```typescript
interface PlatformConnectionRecordDB {
  id, brand_id, tenant_id, platform, account_id, account_name,
  profile_picture, access_token, refresh_token, token_expires_at,
  status, permissions, metadata, created_by, created_at, updated_at, last_verified_at
}

interface PublishingJobDB {
  id, brand_id, tenant_id, platforms, status, scheduled_at,
  published_at, content, validation_results, retry_count, max_retries
}

interface MediaAssetRowDB {
  id, brand_id, tenant_id, category, filename, mime_type, path,
  file_size, hash, thumbnail_url, metadata, variants, used_in, usage_count
}
```

---

## 5. SCHEMA OVERVIEW - ALL TABLES

### Core Tables (Already exist)
- `brands` - Main brand entity
- `tenants` - Multi-tenancy support
- `brand_users` - Brand membership with roles
- `auth.users` - Supabase authentication

### Phase 6: Media Management
- `media_assets` - Asset metadata, variants, usage
- `media_usage_logs` - Usage tracking
- `storage_quotas` - Brand storage limits

### Phase 7: Publishing & Connections
- `publishing_jobs` - Scheduled/pending jobs
- `publishing_logs` - Per-platform audit trail
- `platform_connections` - OAuth tokens (status: connected|expired|revoked|disconnected)
- `platform_sync_logs` - Analytics sync tracking

### Phase 8: Analytics
- `analytics_metrics` - Platform metrics (reach, engagement, followers)
- `analytics_sync_logs` - Sync operation history
- `analytics_goals` - Goal tracking & progress
- `advisor_feedback` - Learning system feedback
- `auto_plans` - Generated content plans

### Phase 9: Approvals & Compliance
- `client_settings` - Email preferences, timezone, language, unsubscribe tokens
- `post_approvals` - Approval status tracking (pending|approved|rejected)
- `audit_logs` - Comprehensive action logging (GDPR compliance)
- `webhook_events` - Incoming webhook events (idempotency_key for deduplication)
- `webhook_attempts` - Retry history with backoff tracking
- `escalation_rules` - Brand-level escalation configuration
- `escalation_events` - Triggered escalations
- `escalation_history` - Escalation lifecycle audit trail

### Integrations & Other
- `platform_connections` - Multi-platform OAuth (Supabase migration)
- `social_posts` - Post scheduling & publishing
- `platform_reviews` - Review management
- `platform_events` - Event management
- `review_response_templates` - Review reply templates
- `brand_embeddings` - AI embeddings for similarity
- `brand_kit_history` - Version control for brand kits
- `agent_guardrails` - AI safety constraints
- `agent_execution_logs` - AI agent audit trail
- `content_calendar_items` - Content calendar items
- `content_plans` - Content plans
- Various dashboard tables (from Phase 9 migration)

---

## 6. MOCK DATA & IN-MEMORY STORAGE

### Current Status: MINIMAL MOCKING
The codebase is **primarily database-driven** with very little in-memory mock data:

**Mock Data Found:**
1. **server/index.ts** - Contains comment "Helper functions for demo/mock data" but actual implementation unclear
2. **server/routes/media.ts** - Contains "Helper function stubs"

**Actual Usage:**
- Database defaults (e.g., client_settings has jsonb defaults for email preferences)
- No discovered large mock datasets
- All major entities use real Supabase persistence

### Data Defaults in Database:
```sql
-- client_settings email_preferences JSONB default
{
  "approvalsNeeded": true,
  "approvalReminders": true,
  "publishFailures": true,
  "publishSuccess": false,
  "weeklyDigest": false,
  "dailyDigest": false,
  "reminderFrequency": "24h",
  "digestFrequency": "weekly",
  "maxEmailsPerDay": 20
}

-- storage_quotas limit_bytes default
5368709120 (5GB)
```

---

## 7. SUPABASE CONFIGURATION

### Client Initialization
**Location:** `server/lib/supabase.ts` & `server/lib/dbClient.ts`

```typescript
// Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// Service role (not anon) for backend operations
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
```

### RLS (Row-Level Security) Implementation
**All Phase 9+ tables use RLS with 4 standard policies:**
1. SELECT - Users see own brand data
2. INSERT - Managers/admins can create for brand
3. UPDATE - Managers/admins can update own brand
4. DELETE - Admins only

**Pattern:**
```sql
CREATE POLICY "brand_isolation_select" ON table_name
  FOR SELECT USING (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );
```

### Storage Buckets
**Location:** `supabase/storage/brand-assets-policies.sql`

**Bucket:** `brand-assets` (public bucket with RLS policies)
- Upload: Users can upload to their brand folder
- Read: Public read access for served media
- Delete: Users can delete their brand files
- Update: Users can replace/update files

---

## 8. CURRENT DATA RELATIONSHIPS

```
brands (1) ──→ (M) brand_users
    ├──→ (M) client_settings
    ├──→ (M) post_approvals
    ├──→ (M) audit_logs
    ├──→ (M) publishing_jobs
    ├──→ (M) publishing_logs
    ├──→ (M) platform_connections
    ├──→ (M) analytics_metrics
    ├──→ (M) analytics_goals
    ├──→ (M) webhook_events
    ├──→ (M) escalation_rules
    └──→ (M) escalation_events

post_approvals (1) ──→ (M) escalation_events
publishing_jobs (1) ──→ (M) publishing_logs
webhook_events (1) ──→ (M) webhook_attempts
escalation_rules (1) ──→ (M) escalation_events
```

---

## 9. WHAT'S IMPLEMENTED vs. MISSING

### IMPLEMENTED ✓
- [x] **Database Services** - 3 comprehensive service classes (dbClient, analytics, connections, publishing)
- [x] **Supabase Migrations** - 12 SQL migrations covering all major features
- [x] **RLS Policies** - Multi-tenant brand isolation on all Phase 9+ tables
- [x] **Type Safety** - Conservative hand-written TypeScript interfaces
- [x] **Error Handling** - Custom DatabaseError class
- [x] **Health Checks** - Database connection verification
- [x] **OAuth Persistence** - Platform connection token storage
- [x] **Audit Trails** - Comprehensive logging for compliance
- [x] **Webhook Support** - Event storage with idempotency & retry logic
- [x] **Escalation System** - Rule-based escalations with history
- [x] **Storage Integration** - Brand asset buckets with RLS
- [x] **Analytics** - Metrics, goals, feedback, auto-plans
- [x] **Approval Workflow** - Post approval tracking

### MISSING/NEEDS WORK ❌
- [ ] **Database Indexes** - Performance optimization on high-traffic queries
- [ ] **Aggregation Functions** - Complex analytics aggregations (mostly application-level)
- [ ] **Full-Text Search** - No FTS indexes on brand data, posts, content
- [ ] **Caching Layer** - No Redis integration shown
- [ ] **Read Replicas** - No read-only Supabase configuration
- [ ] **Backup Strategy** - No documented backup procedures
- [ ] **Migration Runner** - Manual SQL execution (no automated runner)
- [ ] **GraphQL API** - No Supabase realtime subscriptions
- [ ] **Rate Limiting** - Implemented in routes but not DB-enforced
- [ ] **Soft Deletes** - Hard deletes via CASCADE, no soft delete pattern
- [ ] **Field Encryption** - Tokens stored in plain text (relies on RLS)
- [ ] **Partitioning** - No table partitioning for large analytics tables

---

## 10. DATA FLOW SUMMARY

```
┌──────────────────────────────────────────────────────────┐
│                  CLIENT (React/Vite)                     │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTP/API
┌────────────────────▼─────────────────────────────────────┐
│                  SERVER (Express)                        │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Routes (/routes/*.ts)                          │    │
│  │  - AI Generation, Publishing, Media, Analytics  │    │
│  └──────────────┬───────────────────────────────────┘    │
│                 │ Query/Mutation
│  ┌──────────────▼───────────────────────────────────┐    │
│  │  Database Services (server/lib/*-db-service.ts)  │    │
│  │  - dbClient (approvals, webhooks, escalations)  │    │
│  │  - analyticsDB (metrics, goals, feedback)       │    │
│  │  - connectionsDB (OAuth tokens)                 │    │
│  │  - publishingDB (jobs, logs)                    │    │
│  └──────────────┬───────────────────────────────────┘    │
│                 │ Supabase Client
│  ┌──────────────▼───────────────────────────────────┐    │
│  │      Supabase (PostgreSQL + Storage)             │    │
│  │  - All migrations applied                        │    │
│  │  - RLS policies enforce multi-tenancy           │    │
│  │  - Brand-assets bucket for media storage        │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 11. ENVIRONMENT VARIABLES

Required for Supabase integration:
```
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
VITE_SUPABASE_URL=[same-as-SUPABASE_URL]
```

---

## CONCLUSION

**The Aligned-20ai database architecture is:**
1. **Production-ready** - Using Supabase with proper RLS policies
2. **Feature-rich** - Covers approvals, analytics, webhooks, escalations
3. **Type-safe** - Conservative TypeScript interfaces
4. **Audit-complete** - Comprehensive logging for compliance
5. **Minimally mocked** - Very little in-memory data, mostly database-driven

**Key strength:** Cohesive multi-tenant design with brand isolation via RLS and JWT claims

**Key improvement area:** Performance optimization (indexes, caching, aggregations)
