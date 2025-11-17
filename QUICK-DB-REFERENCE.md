# Quick Database Reference

## At-a-Glance Summary

### Database Services (4 files)
| File | Purpose | Main Entities |
|------|---------|--------------|
| **dbClient.ts** | Core Supabase client | ClientSettings, PostApprovals, AuditLogs, WebhookEvents, EscalationRules |
| **analytics-db-service.ts** | Analytics & metrics | AnalyticsMetrics, Goals, Feedback, AutoPlans |
| **connections-db-service.ts** | OAuth token lifecycle | PlatformConnections |
| **publishing-db-service.ts** | Publishing jobs | PublishingJobs, PublishingLogs |

### Tables by Category (35+ total)
```
CORE              | MEDIA (Phase 6)      | PUBLISHING (Phase 7) | ANALYTICS (Phase 8)
────────────────  | ─────────────────── | ──────────────────── | ──────────────────
brands            | media_assets        | publishing_jobs      | analytics_metrics
tenants           | media_usage_logs    | publishing_logs      | analytics_sync_logs
brand_users       | storage_quotas      | platform_connections | analytics_goals
auth.users        |                     | platform_sync_logs   | advisor_feedback
                  |                     |                      | auto_plans

APPROVALS (Phase 9) | WEBHOOKS (Phase 9)    | ESCALATIONS (Phase 9) | OTHER
─────────────────── | ───────────────────── | ───────────────────── | ──────────────────
client_settings     | webhook_events        | escalation_rules      | brand_embeddings
post_approvals      | webhook_attempts      | escalation_events     | brand_kit_history
audit_logs          |                       | escalation_history    | agent_guardrails
                    |                       |                       | agent_execution_logs
                    |                       |                       | content_calendar_items
```

### Critical Files
```
server/lib/
├── dbClient.ts                    [991 lines] Main database client
├── analytics-db-service.ts        [443 lines] Analytics operations
├── connections-db-service.ts      [406 lines] OAuth management
└── publishing-db-service.ts       [429 lines] Publishing operations

supabase/migrations/
├── 20250121_create_phase_9_client_settings.sql       [100 lines]
├── 20250122_create_phase_9_post_approvals.sql        [83 lines]
├── 20250123_create_phase_9_audit_logs.sql            [131 lines]
├── 20250125_create_webhook_events.sql                [134 lines]
├── 20250125_create_webhook_attempts.sql              [150 lines]
└── 20250126_create_escalation_rules.sql              [390 lines]

server/migrations/
├── 006_media_tables.sql           [196 lines] Media management
├── 007_publishing_jobs_and_logs.sql [309 lines] Publishing persistence
└── 008_analytics_metrics.sql       [313 lines] Analytics storage
```

## Key Interfaces

### ClientSettingsRecord
```ts
{
  id: string
  client_id: string
  brand_id: string
  email_preferences: { approvalsNeeded, approvalReminders, ... }
  timezone: string      // "America/New_York"
  language: string      // "en" | "es" | "fr" | "de"
  unsubscribe_token?: string
  unsubscribed_from_all: boolean
}
```

### PostApprovalRecord
```ts
{
  id: string
  brand_id: string
  post_id: string
  status: "pending" | "approved" | "rejected"
  approved_at?: timestamp
  approved_by?: string
  locked: boolean
}
```

### PublishingJobRecord
```ts
{
  id: string
  brand_id: string
  content: object
  platforms: string[]
  scheduled_at?: timestamp
  status: "pending" | "processing" | "published" | "failed" | "scheduled"
  retry_count: number
  published_at?: timestamp
}
```

### AnalyticsMetricRecord
```ts
{
  id: string
  brand_id: string
  platform: string
  date: string
  metrics: {
    reach?: number
    engagement?: number
    followers?: number
    engagementRate?: number
    impressions?: number
    [key: string]: any
  }
}
```

### PlatformConnectionRecord
```ts
{
  id: string
  brand_id: string
  platform: string
  account_id: string
  access_token: string
  refresh_token?: string
  token_expires_at?: timestamp
  status: "connected" | "expired" | "revoked" | "disconnected"
  permissions?: string[]
}
```

## Common Operations

### Get Approval Status
```ts
const approval = await dbClient.postApprovals.get(brandId, postId);
// Returns: { status: "pending" | "approved" | "rejected", ... }
```

### Create Publishing Job
```ts
const job = await publishingDBService.createPublishingJob(
  brandId, tenantId, content, platforms, scheduledAt
);
```

### Get Analytics Summary
```ts
const summary = await analyticsDB.getMetricsSummary(brandId, 30);
// Returns: { totalReach, totalEngagement, topPlatform, ... }
```

### Log Audit Action
```ts
await dbClient.auditLogs.create({
  brand_id: brandId,
  post_id: postId,
  actor_id: userId,
  actor_email: email,
  action: "APPROVED",
  metadata: { ... }
});
```

### Get Platform Connection
```ts
const conn = await connectionsDB.getConnection(brandId, "instagram");
// Returns: { access_token, status, ... }
```

## RLS Policies (Multi-Tenant Isolation)

All Phase 9+ tables use brand isolation:
```sql
-- SELECT: Users can see their brand's data
brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
OR current_setting('jwt.claims.role', TRUE) = 'admin'

-- INSERT: Managers/Admins can create
role IN ('admin', 'manager')

-- UPDATE: Managers/Admins can update
role IN ('admin', 'manager')

-- DELETE: Admins only
role = 'admin'
```

## Migrations Applied

### Server Migrations (earliest)
1. `006_media_tables.sql` - Phase 6 (media assets, usage, quotas)
2. `007_publishing_jobs_and_logs.sql` - Phase 7 (jobs, logs, connections)
3. `008_analytics_metrics.sql` - Phase 8 (metrics, goals, feedback)

### Supabase Migrations (latest)
4. `20250121_*_client_settings.sql` - Phase 9 feature 1
5. `20250122_*_post_approvals.sql` - Phase 9 feature 2
6. `20250123_*_audit_logs.sql` - Phase 9 feature 3
7. `20250125_*_webhook_events.sql` - Phase 9 feature 4
8. `20250125_*_webhook_attempts.sql` - Phase 9 feature 5
9. `20250126_*_escalation_rules.sql` - Phase 9 feature 6
+ Others for integrations, content calendar, agent safety, etc.

## Environment Variables

```bash
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
VITE_SUPABASE_URL=[same-as-above]
```

## Important Notes

1. **No Mock Data** - Very minimal in-memory data; mostly database-driven
2. **Service Role** - Backend uses service role key, not anon key
3. **RLS Enforced** - All operations respect brand_id isolation
4. **Idempotency** - Webhooks use `idempotency_key` to prevent duplicates
5. **Soft Limits** - Storage quotas default to 5GB per brand
6. **Status Tracking** - Publishing/connections/escalations all have detailed status

## Health Check

```ts
import { checkDatabaseConnection } from '@server/lib/dbClient';
const isConnected = await checkDatabaseConnection();
```

## Error Handling

```ts
try {
  await dbClient.postApprovals.get(brandId, postId);
} catch (error) {
  if (error instanceof DatabaseError) {
    console.error(`${error.code}: ${error.message}`);
  }
}
```

---

**Last Updated:** 2025-01-07
**Status:** Production-ready (15 tables implemented, 20+ planned)
