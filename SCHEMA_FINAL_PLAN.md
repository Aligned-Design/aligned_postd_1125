# Schema Final Plan - Target Architecture & Migration Strategy

**Generated:** 2025-11-19  
**Status:** Actionable plan for schema cleanup and consolidation

---

## 🎯 Executive Summary

**Current State:**
- 80+ tables defined across 30+ migration files
- 15 tables confirmed unused (0 references)
- 8 schema conflicts/duplicates
- Split between `server/migrations/` and `supabase/migrations/`
- Migration numbering conflicts (007, 009 exist in both folders)

**Target State:**
- 50 core tables (production-ready)
- Single source of truth for all schemas
- No duplicate table definitions
- Consolidated asset/content tables
- Clear migration path from old to new connector infrastructure

**Impact:**
- Remove 15 unused tables
- Consolidate 5 duplicate/overlapping tables
- Archive 14 migration files (already archived)
- Resolve 8 schema conflicts

---

## 📐 FINAL TARGET SCHEMA (9 Categories)

### 1. **Brand & Identity** (5 tables)
```sql
-- Core brand management
CREATE TABLE brands (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  workspace_id TEXT,  -- backward compat alias
  created_by UUID REFERENCES auth.users(id),
  
  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  website_url TEXT,
  industry TEXT,
  description TEXT,
  
  -- Brand Assets
  brand_kit JSONB DEFAULT '{}'::jsonb,
  voice_summary TEXT,
  visual_summary TEXT,
  tone_keywords TEXT[],
  compliance_rules TEXT,
  
  -- Intake/Onboarding
  intake_completed BOOLEAN DEFAULT FALSE,
  intake_completed_at TIMESTAMPTZ,
  
  -- Crawler Status
  scraped_at TIMESTAMPTZ,
  scraper_status TEXT DEFAULT 'never_run',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Tenant-scoped uniqueness
  CONSTRAINT unique_slug_per_tenant UNIQUE (tenant_id, slug)
);

CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE brand_members (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, brand_id)
);

CREATE TABLE milestones (
  id UUID PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_workspace_milestone UNIQUE (workspace_id, key)
);

-- RLS: brand_id isolation via brand_members
```

**Sources:**
- supabase/migrations/012_canonical_schema_alignment.sql
- supabase/migrations/011_add_all_brand_columns.sql
- supabase/migrations/20250120_create_milestones_table.sql

---

### 2. **Media Management** (3 tables → 1 consolidated)
```sql
-- CONSOLIDATED: Replaces media_assets, brand_assets, assets
CREATE TABLE media_assets (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- File Info
  category TEXT,  -- graphics, images, logos, videos, ai_exports, client_uploads, scraped
  filename TEXT NOT NULL,
  mime_type TEXT,
  path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  hash TEXT UNIQUE,  -- SHA256 for deduplication
  
  -- Media Metadata
  metadata JSONB DEFAULT '{}'::jsonb,  -- width, height, aiTags, dominantColors, etc
  variants JSONB DEFAULT '[]'::jsonb,  -- [{size, width, height, path, url, fileSize}]
  
  -- Usage Tracking
  used_in TEXT[] DEFAULT ARRAY[]::TEXT[],
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'active',  -- active, archived, deleted
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE media_usage_logs (
  id UUID PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  used_in TEXT NOT NULL,  -- "post:uuid", "email:uuid"
  used_by_user UUID REFERENCES auth.users(id),
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE storage_quotas (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  limit_bytes BIGINT NOT NULL DEFAULT 5368709120,  -- 5GB
  used_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id)
);

-- Triggers
CREATE TRIGGER media_assets_increment_usage
  AFTER INSERT ON media_usage_logs
  FOR EACH ROW EXECUTE FUNCTION increment_asset_usage();

-- RLS: brand_id isolation
```

**Migration Required:**
- Merge data from `brand_assets` and `assets` into `media_assets`
- Map old columns to new unified schema
- Update 20 file references

**Sources:**
- server/migrations/006_media_tables.sql (primary)
- supabase/migrations/009_complete_schema_sync.sql (assets, brand_assets)

---

### 3. **Content & Scheduling** (2 tables → 1 consolidated)
```sql
-- CONSOLIDATED: Primary content storage
CREATE TABLE content_items (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Content
  type TEXT NOT NULL,  -- post, blog, caption, email, story
  title TEXT,
  content JSONB NOT NULL,  -- Unified content structure
  
  -- Publishing
  status TEXT NOT NULL DEFAULT 'draft',  -- draft, pending_review, approved, scheduled, published
  platform TEXT,  -- instagram, facebook, linkedin, etc
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Approval
  approval_required BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- AI Generation
  generated_by_agent TEXT,
  generation_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Media
  media_urls TEXT[],
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scheduled content view (can be materialized)
CREATE TABLE scheduled_content (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  platforms TEXT[] NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled',  -- scheduled, publishing, published, failed
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (content_id, scheduled_at)
);

-- RLS: brand_id isolation
```

**Migration Required:**
- Verify if `content` table is alias or duplicate of `content_items`
- If separate, migrate data to `content_items`
- Update client-portal-db-service.ts (9 refs)

**Sources:**
- supabase/migrations/009_complete_schema_sync.sql
- supabase/migrations/012_canonical_schema_alignment.sql

---

### 4. **Publishing & OAuth** (Unified Connector Infrastructure)
```sql
-- NEW INFRASTRUCTURE (replaces old platform_connections/publishing_jobs)
CREATE TABLE connector_platforms (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES auth.users(id),
  
  platform_name VARCHAR(50) NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_beta BOOLEAN NOT NULL DEFAULT false,
  api_version VARCHAR(20) NOT NULL DEFAULT 'v1',
  
  -- Rate Limiting
  rate_limit_requests INT NOT NULL DEFAULT 60,
  rate_limit_window_seconds INT NOT NULL DEFAULT 60,
  max_retry_attempts INT NOT NULL DEFAULT 4,
  
  -- Features
  webhook_supported BOOLEAN NOT NULL DEFAULT false,
  scheduling_supported BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_platform CHECK (platform_name IN ('meta', 'linkedin', 'tiktok', 'gbp', 'mailchimp'))
);

CREATE TABLE connections (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES connector_platforms(id) ON DELETE CASCADE,
  
  -- Account Info
  platform_user_id VARCHAR(255) NOT NULL,
  platform_account_id VARCHAR(255),
  display_name VARCHAR(255) NOT NULL,
  profile_image_url TEXT,
  
  -- Status & Health
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  health_status VARCHAR(50) NOT NULL DEFAULT 'healthy',
  last_health_check TIMESTAMPTZ,
  health_check_error TEXT,
  
  -- Token Management
  token_expires_at TIMESTAMPTZ,
  last_token_refresh TIMESTAMPTZ,
  requires_reconnect BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  scopes TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  
  UNIQUE (tenant_id, platform_id, platform_account_id)
);

CREATE TABLE encrypted_secrets (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  
  secret_type VARCHAR(100) NOT NULL,  -- access_token, refresh_token, api_key
  secret_name VARCHAR(255) NOT NULL,
  
  -- Encrypted Value (AES-256-GCM)
  encrypted_value TEXT NOT NULL,
  iv VARCHAR(255) NOT NULL,
  auth_tag VARCHAR(255) NOT NULL,
  
  -- Rotation
  rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE publish_jobs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  
  -- Idempotency
  idempotency_key UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Content
  content_type VARCHAR(50) NOT NULL,
  title VARCHAR(500),
  body TEXT NOT NULL,
  media_urls TEXT[],
  call_to_action JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  publish_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  platform_post_id VARCHAR(255),
  
  -- Retry
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 4,
  next_retry_at TIMESTAMPTZ,
  last_error_code VARCHAR(50),
  last_error_message TEXT,
  error_history JSONB DEFAULT '[]'::jsonb,
  
  -- DLQ
  dlq_reason TEXT,
  dlq_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255),
  
  UNIQUE (connection_id, idempotency_key)
);

-- Legacy tables (TO BE DEPRECATED after migration)
CREATE TABLE platform_connections (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  platform VARCHAR(50) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'connected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, platform)
);

CREATE TABLE publishing_jobs (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  content JSONB NOT NULL,
  platforms TEXT[] NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE publishing_logs (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES publishing_jobs(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  platform_post_id VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE platform_sync_logs (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  items_synced INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Migration Strategy (PHASED):**
- **Phase 1:** Both schemas run in parallel (current state)
- **Phase 2:** New connector routes use new schema, old routes use legacy
- **Phase 3:** Migrate data from `platform_connections` → `connections`
- **Phase 4:** Migrate data from `publishing_jobs` → `publish_jobs`
- **Phase 5:** Update all code to use new schema
- **Phase 6:** Deprecate and drop legacy tables

**⚠️ CRITICAL:** Resolve `platform_connections` duplicate definition first (defined in both 005 and 007 migrations)

**Sources:**
- supabase/migrations/20241111_api_connector_schema.sql (new infrastructure)
- server/migrations/007_publishing_jobs_and_logs.sql (legacy)
- supabase/migrations/005_integrations.sql (legacy)

---

### 5. **Analytics & Metrics** (5 tables)
```sql
CREATE TABLE analytics_metrics (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  
  platform VARCHAR(50) NOT NULL,
  post_id VARCHAR(255),
  date DATE NOT NULL,
  
  -- All metrics as JSONB (flexible schema)
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,  
  /* Contains: reach, impressions, engagement, likes, comments, 
     shares, clicks, followers, ctr, engagementRate */
  
  metadata JSONB DEFAULT '{}'::jsonb,
  /* Contains: postType, hashtags, contentCategory */
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (brand_id, platform, post_id, date)
);

CREATE TABLE analytics_sync_logs (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  platform VARCHAR(50) NOT NULL,
  sync_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE analytics_goals (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  metric VARCHAR(100) NOT NULL,
  target FLOAT NOT NULL,
  current FLOAT DEFAULT 0,
  deadline TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE advisor_feedback (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  insight_id VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  type VARCHAR(100) NOT NULL,
  feedback VARCHAR(50) NOT NULL,
  previous_weight FLOAT DEFAULT 1.0,
  new_weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE auto_plans (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  month DATE NOT NULL,
  plan_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence FLOAT DEFAULT 0.75,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, month)
);

-- RLS: brand_id isolation
```

**Migration Note:** Migration 012 already converted old column structure to JSONB. Verify production schema.

**Sources:**
- server/migrations/008_analytics_metrics.sql

---

### 6. **Approvals & Workflows** (6 tables)
```sql
CREATE TABLE post_approvals (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  post_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, approved, rejected
  
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  locked BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE approval_requests (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  requested_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  priority VARCHAR(20) DEFAULT 'normal',
  deadline TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  steps JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES workflow_templates(id) ON DELETE SET NULL,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  current_step INTEGER DEFAULT 0,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workflow_notifications (
  id UUID PRIMARY KEY,
  instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: brand_id isolation
```

**Note:** `approval_threads` table has minimal usage (6 refs) - consider merging into `post_approvals` or dropping.

**Sources:**
- supabase/migrations/009_complete_schema_sync.sql
- supabase/migrations/012_canonical_schema_alignment.sql

---

### 7. **Compliance & Audit** (5 tables)
```sql
CREATE TABLE client_settings (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Email Preferences
  email_preferences JSONB NOT NULL,
  /* Default structure:
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
  */
  
  timezone TEXT DEFAULT 'America/Chicago',
  language TEXT DEFAULT 'en',
  
  -- Unsubscribe
  unsubscribe_token TEXT UNIQUE,
  unsubscribed_from_all BOOLEAN DEFAULT FALSE,
  unsubscribed_types TEXT[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_by TEXT,
  
  UNIQUE (client_id, brand_id)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  user_id UUID REFERENCES auth.users(id),
  
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  idempotency_key TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE escalation_rules (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  trigger_hours INTEGER NOT NULL,
  escalate_to_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE escalation_events (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  approval_id UUID REFERENCES post_approvals(id),
  rule_id UUID REFERENCES escalation_rules(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- RLS: brand_id isolation
```

**Note:** `escalation_history` table defined but unused (0 refs) - marked for deletion.

**Sources:**
- Supabase migrations (Phase 9)

---

### 8. **Orchestration & Learning Loop** (4 tables)
```sql
CREATE TABLE strategy_briefs (
  id UUID PRIMARY KEY,
  brand_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  version TEXT NOT NULL,
  
  positioning JSONB NOT NULL,
  voice JSONB NOT NULL,
  visual JSONB NOT NULL,
  competitive JSONB NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_packages (
  id UUID PRIMARY KEY,
  brand_id TEXT NOT NULL,
  content_id TEXT NOT NULL UNIQUE,
  request_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  
  copy JSONB NOT NULL,
  design_context JSONB,
  collaboration_log JSONB NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'draft',
  quality_score DECIMAL(3,1),
  requires_approval BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE TABLE brand_history (
  id UUID PRIMARY KEY,
  brand_id TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  
  agent TEXT NOT NULL,
  action TEXT NOT NULL,
  content_id TEXT,
  details JSONB,
  rationale TEXT,
  performance JSONB,
  tags TEXT[] NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collaboration_logs (
  id UUID PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  
  agent TEXT NOT NULL,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  
  content_id TEXT,
  notes TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: brand_id isolation
```

**Status:** Recently implemented, low usage because feature is new. Keep all tables.

**Tables to DELETE from this schema (unused):**
- performance_logs (0 refs)
- platform_insights (0 refs)
- token_health (0 refs)
- weekly_summaries (0 refs)
- advisor_review_audits (0 refs)
- brand_success_patterns (0 refs)

**Sources:**
- supabase/migrations/011_persistence_schema.sql

---

### 9. **Integrations** (2 tables + deprecated)
```sql
-- Active
CREATE TABLE social_posts (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  platform_post_id VARCHAR(255) NOT NULL,
  content JSONB NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE platform_reviews (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  review_id VARCHAR(255) NOT NULL UNIQUE,
  rating INTEGER,
  review_text TEXT,
  reviewer_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DEPRECATED (to be deleted)
-- integration_events (minimal usage)
-- webhook_logs (replaced by webhook_events)
-- review_response_templates (0 refs)
```

**Sources:**
- supabase/migrations/archived/20250119_create_integrations_tables.sql
- supabase/migrations/005_integrations.sql

---

## 🗑️ TABLES TO DELETE (15 total)

### From User Management
- ❌ user_profiles
- ❌ user_preferences

### From Approvals
- ❌ approval_threads (minimal usage, merge into post_approvals)

### From Persistence Schema (Unused)
- ❌ performance_logs
- ❌ platform_insights
- ❌ token_health
- ❌ weekly_summaries
- ❌ advisor_review_audits
- ❌ brand_success_patterns

### From Integrations
- ❌ webhook_logs (replaced by webhook_events)
- ❌ review_response_templates

### From Archived Migrations
- ❌ content_calendar_items
- ❌ content_plans
- ❌ escalation_history
- ❌ webhook_attempts

**Total: 15 tables**

---

## 🔄 CONSOLIDATION REQUIRED (3 merges)

### 1. Asset Tables (3 → 1)
**Merge:** `brand_assets` + `assets` → `media_assets`

```sql
-- Migration: Consolidate assets
INSERT INTO media_assets (
  id, tenant_id, brand_id, category, filename, 
  mime_type, path, size_bytes, metadata, created_at
)
SELECT 
  id, 
  NULL as tenant_id,  -- backfill from brand
  brand_id,
  asset_type as category,
  file_name as filename,
  mime_type,
  file_path as path,
  file_size as size_bytes,
  metadata,
  created_at
FROM brand_assets
WHERE id NOT IN (SELECT id FROM media_assets);

-- Repeat for assets table
-- Then drop brand_assets and assets
```

### 2. Content Tables (2 → 1)
**Verify:** Is `content` an alias or duplicate of `content_items`?

If duplicate:
```sql
-- Migration: Consolidate content
INSERT INTO content_items (...)
SELECT ... FROM content
WHERE id NOT IN (SELECT id FROM content_items);

-- Drop content table
```

### 3. Platform Connections (Resolve Duplicate Definition)
**Problem:** Table defined in TWO migrations with different schemas

**Resolution:**
1. Investigate production schema (which migration ran last?)
2. Drop one migration file
3. Ensure single source of truth

---

## 📋 MIGRATION EXECUTION PLAN

### Phase 1: Analysis & Preparation (Week 1)
- [ ] **1.1** Review this plan with team
- [ ] **1.2** Run production query analysis
  - Check `pg_stat_user_tables` for actual table usage
  - Verify no production queries use tables marked for deletion
- [ ] **1.3** Create full database backup
- [ ] **1.4** Document current production schema state
  ```sql
  SELECT table_name, pg_size_pretty(pg_total_relation_size(table_name::regclass))
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY pg_total_relation_size(table_name::regclass) DESC;
  ```

### Phase 2: Delete Unused Tables (Week 2)
- [ ] **2.1** Create rollback migration
- [ ] **2.2** Delete tables with 0 references (15 tables)
  ```sql
  -- Migration: 100_delete_unused_tables.sql
  DROP TABLE IF EXISTS user_profiles CASCADE;
  DROP TABLE IF EXISTS user_preferences CASCADE;
  -- ... (list all 15 tables)
  
  -- Drop unused views
  DROP VIEW IF EXISTS content_quality_trends;
  DROP VIEW IF EXISTS platform_performance_summary;
  DROP VIEW IF EXISTS brand_history_patterns;
  ```
- [ ] **2.3** Test in staging
- [ ] **2.4** Deploy to production (off-hours)
- [ ] **2.5** Monitor for 48 hours

### Phase 3: Resolve Schema Conflicts (Week 3)
- [ ] **3.1** Resolve `platform_connections` duplicate
  - Determine active schema in production
  - Remove duplicate migration file
  - Document decision
  
- [ ] **3.2** Verify `analytics_metrics` schema
  - Confirm JSONB structure is active
  - Test analytics queries
  
- [ ] **3.3** Document schema resolutions
  - Update DATABASE-STRUCTURE.md
  - Update QUICK-DB-REFERENCE.md

### Phase 4: Consolidate Asset Tables (Week 4)
- [ ] **4.1** Create consolidation migration
  ```sql
  -- Migration: 101_consolidate_assets.sql
  -- 1. Backup data
  -- 2. Migrate brand_assets → media_assets
  -- 3. Migrate assets → media_assets
  -- 4. Update foreign keys
  -- 5. Drop old tables
  ```
  
- [ ] **4.2** Update code references (20 files)
  - image-sourcing.ts
  - workflow-db-service.ts
  - + 18 others
  
- [ ] **4.3** Test asset upload/retrieval
- [ ] **4.4** Deploy to staging
- [ ] **4.5** Run data validation
  - Verify row counts match
  - Check for data loss
- [ ] **4.6** Deploy to production

### Phase 5: Consolidate Content Tables (Week 5)
- [ ] **5.1** Investigate `content` vs `content_items`
  - Are they the same table?
  - If different, what's the relationship?
  
- [ ] **5.2** Create consolidation plan based on findings
- [ ] **5.3** Update client-portal-db-service.ts (9 refs)
- [ ] **5.4** Test content retrieval
- [ ] **5.5** Deploy

### Phase 6: Connector Infrastructure Migration (Weeks 6-8) 🚨 **STRATEGIC**
**Decision Required:** Migrate to new connector schema or keep both?

#### Option A: Full Migration to New Schema
```sql
-- Migration: 102_migrate_to_new_connector_infrastructure.sql

-- 1. Create new tables (already exist from 20241111 migration)
-- 2. Migrate data:
--    platform_connections → connections + encrypted_secrets
--    publishing_jobs → publish_jobs
-- 3. Update all code references (44 files)
-- 4. Deprecate old tables (mark with comment)
-- 5. After 30 days, drop old tables
```

**Impact:**
- ✅ Modern, production-ready infrastructure
- ✅ Better security (encrypted secrets)
- ✅ Better observability (health checks, audits)
- ❌ High effort (44+ file changes)
- ❌ Risk of breaking existing integrations

#### Option B: Keep Both Schemas
```sql
-- Use new schema for new integrations only
-- Keep old schema for existing integrations
-- Document usage patterns clearly
```

**Impact:**
- ✅ No breaking changes
- ✅ Gradual migration path
- ❌ Duplicate code paths
- ❌ Confusing for developers
- ❌ Technical debt remains

**Recommendation:** Option A (full migration) over 8-week period with phased rollout.

### Phase 7: Update Documentation (Week 9)
- [ ] **7.1** Generate final schema documentation
  - Create 5 clean SQL export files (by category)
  - Update DATABASE-STRUCTURE.md
  - Update QUICK-DB-REFERENCE.md
  
- [ ] **7.2** Create developer migration guide
- [ ] **7.3** Update API documentation
- [ ] **7.4** Archive old migration files

### Phase 8: Validation & Monitoring (Week 10)
- [ ] **8.1** Run comprehensive test suite
- [ ] **8.2** Performance benchmarking
  - Query performance before/after
  - Storage usage comparison
  
- [ ] **8.3** Monitor production for 1 week
  - Check error rates
  - Monitor database performance
  - Verify no broken queries
  
- [ ] **8.4** Sign-off and close cleanup project

---

## 📊 FINAL SCHEMA EXPORT (5 Files)

After cleanup is complete, export clean schema in 5 organized files:

### 1. `schema_01_identity_and_access.sql`
- brands
- tenants
- brand_members
- milestones
- RLS policies

### 2. `schema_02_media_and_content.sql`
- media_assets
- media_usage_logs
- storage_quotas
- content_items
- scheduled_content
- RLS policies

### 3. `schema_03_publishing_and_integrations.sql`
- connector_platforms
- connections
- encrypted_secrets
- publish_jobs
- publishing_logs
- platform_sync_logs
- social_posts
- platform_reviews
- RLS policies

### 4. `schema_04_analytics_and_workflows.sql`
- analytics_metrics
- analytics_sync_logs
- analytics_goals
- advisor_feedback
- auto_plans
- post_approvals
- approval_requests
- workflow_templates
- workflow_instances
- workflow_notifications
- RLS policies

### 5. `schema_05_compliance_and_orchestration.sql`
- client_settings
- audit_logs
- webhook_events
- escalation_rules
- escalation_events
- strategy_briefs
- content_packages
- brand_history
- collaboration_logs
- RLS policies

---

## 🎯 Success Criteria

- ✅ 15 unused tables removed
- ✅ 8 schema conflicts resolved
- ✅ Asset tables consolidated (3 → 1)
- ✅ Content tables consolidated (2 → 1)
- ✅ Single source of truth for all table definitions
- ✅ No duplicate migration files
- ✅ All tests passing
- ✅ No production errors
- ✅ Clean 5-file schema export
- ✅ Updated documentation

---

## ⚠️ Risks & Mitigation

### Risk 1: Data Loss During Consolidation
**Mitigation:**
- Full backup before each phase
- Validate row counts after migration
- Keep old tables for 30 days before dropping
- Rollback plan for each migration

### Risk 2: Breaking Existing Integrations
**Mitigation:**
- Comprehensive test suite
- Staging environment testing
- Phased rollout
- Feature flags for new connector infrastructure
- Monitor error rates closely

### Risk 3: Unknown Table Usage
**Mitigation:**
- Production query analysis before deletion
- Check `pg_stat_user_tables` for actual usage
- Monitor logs for SQL errors after changes
- 48-hour monitoring window after each change

### Risk 4: Migration Takes Longer Than Expected
**Mitigation:**
- Break into small, independent phases
- Each phase can be done independently
- If blocked, move to next phase
- Document blockers and revisit

---

## 📞 Support & Escalation

If issues arise during migration:
1. **Rollback immediately** using prepared rollback migrations
2. **Document the issue** in detail
3. **Review with team** before attempting again
4. **Update this plan** with lessons learned

---

## 📅 Timeline Summary

| Phase | Duration | Status | Risk Level |
|-------|----------|--------|------------|
| 1. Analysis & Prep | Week 1 | Ready | LOW |
| 2. Delete Unused | Week 2 | Ready | LOW |
| 3. Resolve Conflicts | Week 3 | Ready | MEDIUM |
| 4. Consolidate Assets | Week 4 | Ready | MEDIUM |
| 5. Consolidate Content | Week 5 | Needs Investigation | MEDIUM |
| 6. Connector Migration | Weeks 6-8 | Strategic Decision | HIGH |
| 7. Documentation | Week 9 | Ready | LOW |
| 8. Validation | Week 10 | Ready | LOW |

**Total:** 10 weeks (2.5 months)

---

## ✅ Next Immediate Actions

1. **Review this plan with team** (1 day)
2. **Run production query analysis** (1 day)
3. **Create rollback migrations** (2 days)
4. **Begin Phase 1: Analysis** (Week 1)

---

**End of Schema Final Plan**

For unused code cleanup recommendations, see `UNUSED_CODE_CLEANUP.md`.


