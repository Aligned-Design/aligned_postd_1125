# Supabase Tables Required - Complete Reference

**Last Updated:** January 2025  
**Purpose:** Exact list of all Supabase tables needed for backend launch

---

## 🎯 Critical Tables (Must Have for Launch)

These tables are actively used by backend routes and **must exist**:

### Core Identity & Access

| Table | Purpose | Key Columns | Migration |
|-------|---------|-------------|-----------|
| `brands` | Main brand entity | `id`, `tenant_id`, `name`, `brand_kit`, `voice_summary`, `visual_summary` | `002_brands_and_agencies.sql` |
| `tenants` | Multi-tenancy support | `id`, `name`, `plan` | Core table |
| `brand_members` | Brand membership with roles | `id`, `user_id`, `brand_id`, `role`, `created_at` | Core table (referenced in RLS) |
| `auth.users` | Supabase auth users | `id`, `email` | Supabase built-in |

**Note:** `brand_members` is referenced in RLS policies. If it doesn't exist, create it:
```sql
CREATE TABLE IF NOT EXISTS brand_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, brand_id)
);
```

---

### Media Management (Phase 6)

| Table | Purpose | Key Columns | Migration |
|-------|---------|-------------|-----------|
| `media_assets` | Asset metadata, variants, usage | `id`, `brand_id`, `tenant_id`, `category`, `filename`, `path`, `hash`, `used_in[]`, `usage_count` | `006_media_tables.sql` |
| `media_usage_logs` | Usage tracking audit trail | `id`, `asset_id`, `brand_id`, `used_in`, `used_by_user` | `006_media_tables.sql` |
| `storage_quotas` | Brand storage limits | `id`, `brand_id`, `tenant_id`, `limit_bytes` (default: 5GB) | `006_media_tables.sql` |

**Used by routes:**
- `POST /api/media/upload`
- `GET /api/media/list`
- `GET /api/media/usage/:brandId`
- `POST /api/media/track-usage`

---

### Publishing & OAuth (Phase 7)

| Table | Purpose | Key Columns | Migration |
|-------|---------|-------------|-----------|
| `publishing_jobs` | Scheduled/pending jobs | `id`, `brand_id`, `tenant_id`, `content`, `platforms[]`, `status`, `scheduled_at` | `007_publishing_jobs_and_logs.sql` |
| `publishing_logs` | Per-platform audit trail | `id`, `job_id`, `brand_id`, `platform`, `status`, `platform_post_id` | `007_publishing_jobs_and_logs.sql` |
| `platform_connections` | OAuth token storage | `id`, `brand_id`, `platform`, `access_token`, `refresh_token`, `status` | `007_publishing_jobs_and_logs.sql` |
| `platform_sync_logs` | Analytics sync tracking | `id`, `brand_id`, `platform`, `sync_type`, `status` | `007_publishing_jobs_and_logs.sql` |

**Used by routes:**
- `POST /api/publishing/:brandId/publish`
- `GET /api/publishing/:brandId/jobs`
- `GET /api/publishing/oauth/initiate`
- `GET /api/brands/:brandId/posting-schedule`

---

### Analytics (Phase 8)

| Table | Purpose | Key Columns | Migration |
|-------|---------|-------------|-----------|
| `analytics_metrics` | Platform metrics (reach, engagement) | `id`, `brand_id`, `platform`, `date`, `metrics` (JSONB) | `008_analytics_metrics.sql` |
| `analytics_sync_logs` | Sync operation history | `id`, `brand_id`, `platform`, `sync_type`, `status` | `008_analytics_metrics.sql` |
| `analytics_goals` | Goal tracking & progress | `id`, `brand_id`, `metric`, `target`, `current`, `deadline` | `008_analytics_metrics.sql` |
| `advisor_feedback` | Learning system feedback | `id`, `brand_id`, `insight_id`, `category`, `type`, `feedback`, `previous_weight`, `new_weight` | `008_analytics_metrics.sql` |
| `auto_plans` | Generated content plans | `id`, `brand_id`, `month`, `plan_data` (JSONB), `confidence` | `008_analytics_metrics.sql` |

**Used by routes:**
- `GET /api/analytics/:brandId`
- `GET /api/analytics/:brandId/insights`
- `POST /api/brand-intelligence/feedback`

---

### Approvals & Compliance (Phase 9)

| Table | Purpose | Key Columns | Migration |
|-------|---------|-------------|-----------|
| `client_settings` | Email preferences, timezone | `id`, `client_id`, `brand_id`, `email_preferences` (JSONB), `timezone` | `007_client_portal_and_audit.sql` or `20250121_*_client_settings.sql` |
| `post_approvals` | Approval status tracking | `id`, `brand_id`, `post_id`, `status`, `approved_at`, `approved_by` | `20250122_*_post_approvals.sql` |
| `audit_logs` | Comprehensive action logging | `id`, `brand_id`, `user_id`, `action`, `resource_type`, `resource_id`, `metadata` | `20250123_*_audit_logs.sql` |
| `webhook_events` | Incoming webhook events | `id`, `brand_id`, `provider`, `event_type`, `payload`, `idempotency_key` | `20250125_*_webhook_events.sql` |
| `webhook_attempts` | Retry history | `id`, `event_id`, `attempt_number`, `status`, `response_code` | `20250125_*_webhook_attempts.sql` |
| `escalation_rules` | Brand-level escalation config | `id`, `brand_id`, `rule_type`, `trigger_hours`, `escalate_to_role` | `20250126_*_escalation_rules.sql` |
| `escalation_events` | Triggered escalations | `id`, `brand_id`, `approval_id`, `rule_id`, `status` | `20250126_*_escalation_rules.sql` |

**Used by routes:**
- `GET /api/client-settings`
- `PUT /api/client-settings`
- `GET /api/approvals/*`
- `POST /api/client-portal/approve/:contentId`

---

### Content & Creative Studio

| Table | Purpose | Key Columns | Migration |
|-------|---------|-------------|-----------|
| `content_items` | AI-generated content | `id`, `brand_id`, `type`, `content` (JSONB), `status` | `003_content_and_posts.sql` (or existing) |
| `scheduled_content` | Scheduled posts | `id`, `brand_id`, `content_id`, `scheduled_at`, `platforms[]` | Existing table |

**Used by routes:**
- `POST /api/studio/generate`
- `POST /api/studio/save`
- `GET /api/studio/list`
- `POST /api/dashboard`

---

### Workflow & Notifications

| Table | Purpose | Key Columns | Migration |
|-------|---------|-------------|-----------|
| `workflow_templates` | Workflow definitions | `id`, `brand_id`, `name`, `steps` (JSONB) | `006_approvals_and_workflows.sql` |
| `workflow_instances` | Active workflow instances | `id`, `template_id`, `brand_id`, `status`, `current_step` | `006_approvals_and_workflows.sql` |
| `workflow_notifications` | Workflow notifications | `id`, `instance_id`, `user_id`, `type`, `message` | `006_approvals_and_workflows.sql` |

**Used by routes:**
- `GET /api/workflow/*`
- `GET /api/notifications`

---

## 📋 Optional Tables (Nice to Have)

These tables are referenced but may have fallbacks:

| Table | Purpose | Status |
|-------|---------|--------|
| `approval_requests` | Approval request tracking | Used by approvals service |
| `generation_logs` | AI generation audit trail | Used by agents routes |
| `brand_kits` | Brand kit storage | Used by agents routes |
| `brands.safety_config` (JSONB) | AI safety constraints | Used by agents routes (stored on brands table, not separate table) |
| `advisor_cache` | Cached advisor insights | Used by agents routes |
| `content_packages` | Content package templates | Used by onboarding |
| `share_links` | Client portal share links | Used by client-portal |
| `client_approvals` | Client approval tracking | Used by client-portal |
| `content_comments` | Client comments on content | Used by client-portal |
| `client_media` | Client-uploaded media | Used by client-portal |

---

## 🔧 Storage Buckets

| Bucket | Purpose | Policies |
|--------|---------|----------|
| `brand-assets` | Media file storage | RLS policies for brand isolation |

**Migration:** `supabase/storage/brand-assets-policies.sql`

---

## 📊 Views (Optional but Recommended)

| View | Purpose | Tables Joined |
|------|---------|---------------|
| `tenants_view` | Tenant summary with stats | `tenants`, `brands`, `brand_users` |
| `profiles_view` | User profile with brand access | `user_profiles`, `brand_members` |
| `dashboard_metrics` | Dashboard aggregations | Various analytics tables |

**Migration:** `008_indexes_and_views.sql`

---

## 🚨 Critical Dependencies

### Tables That Must Exist First

1. **`brands`** - Referenced by almost everything
2. **`tenants`** - Referenced by multi-tenant tables
3. **`brand_members`** - Used in RLS policies for brand isolation
4. **`auth.users`** - Supabase built-in, but must exist

### RLS Policy Dependencies

Many RLS policies reference `brand_members`:
```sql
-- Example from media_assets RLS
brand_id IN (
  SELECT brand_id FROM brand_members
  WHERE user_id = auth.uid()
)
```

**If `brand_members` doesn't exist, RLS policies will fail.**

---

## 📝 Migration Order

Apply migrations in this order:

1. **Core Tables:**
   - `001_auth_and_users.sql` - User profiles
   - `002_brands_and_agencies.sql` - Brands, tenants
   - Create `brand_members` if missing

2. **Content & Media:**
   - `003_content_and_posts.sql` - Content items
   - `006_media_tables.sql` - Media assets

3. **Publishing:**
   - `007_publishing_jobs_and_logs.sql` - Publishing jobs

4. **Analytics:**
   - `008_analytics_metrics.sql` - Analytics tables

5. **Approvals & Compliance:**
   - `007_client_portal_and_audit.sql` - Client settings, audit logs
   - `20250121_*_client_settings.sql` - Client settings (if separate)
   - `20250122_*_post_approvals.sql` - Post approvals
   - `20250123_*_audit_logs.sql` - Audit logs (if separate)
   - `20250125_*_webhook_events.sql` - Webhooks
   - `20250126_*_escalation_rules.sql` - Escalations

6. **Workflows:**
   - `006_approvals_and_workflows.sql` - Workflow tables

7. **Storage:**
   - `brand-assets-policies.sql` - Storage bucket policies

8. **Indexes & Views:**
   - `008_indexes_and_views.sql` - Performance indexes

---

## ✅ Quick Checklist

Before launch, verify these tables exist:

- [ ] `brands`
- [ ] `tenants`
- [ ] `brand_members` ⚠️ **CRITICAL - Used in RLS**
- [ ] `media_assets`
- [ ] `media_usage_logs`
- [ ] `publishing_jobs`
- [ ] `publishing_logs`
- [ ] `platform_connections`
- [ ] `analytics_metrics`
- [ ] `advisor_feedback`
- [ ] `client_settings`
- [ ] `post_approvals`
- [ ] `audit_logs`
- [ ] `content_items` (or `content`)

---

## 🔍 How to Verify Tables Exist

```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'brand_members';

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## 📚 Related Documentation

- `DATABASE-STRUCTURE.md` - Full database architecture
- `QUICK-DB-REFERENCE.md` - Quick reference guide
- `BACKEND_LAUNCH_AUDIT.md` - Backend audit report

---

**Last Updated:** January 2025  
**Status:** Production-ready schema

