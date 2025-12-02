# Supabase Schema Map

**Date**: 2025-01-XX  
**Purpose**: Comprehensive documentation of POSTD's Supabase database schema  
**Status**: Read-only discovery - no schema changes  
**Source**: All tables defined in `supabase/migrations/001_bootstrap_schema.sql`

---

## Schema Overview

This document maps all Supabase tables organized by functional category. Each table includes:
- Definition location (migration files)
- Core columns and constraints
- RLS (Row Level Security) policies
- Code references (where tables are used in TypeScript)

**Total Tables**: **51 tables** across 11 functional categories

**Single Source of Truth**: All tables are defined in `supabase/migrations/001_bootstrap_schema.sql` (bootstrap migration)

**Important Notes**:
- All table definitions, indexes, constraints, triggers, and RLS policies are in the bootstrap migration
- Previous migrations have been archived and consolidated
- This document reflects the current state as defined in the bootstrap schema
- Line numbers in "Defined in" sections refer to `001_bootstrap_schema.sql`

---

## Table Categories

### 1. Core / Multi-Tenant
- `tenants` - Workspace/tenant management
- `brands` - Brand/agency entities
- `brand_members` - User-brand access control
- `user_profiles` - User identity
- `user_preferences` - User settings

### 2. Brand Intelligence / Guides
- `brand_assets` - Brand media assets
- `assets` - General asset storage
- `media_assets` - Media metadata
- `media_usage_logs` - Asset usage tracking
- `storage_quotas` - Storage limits per brand

### 3. Content / Studio
- `content_items` - Primary content storage
- `scheduled_content` - Content scheduling
- `publishing_jobs` - Publishing queue
- `publishing_logs` - Publishing history
- `designs` - Creative Studio designs (if exists)

### 4. Approvals / Workflows
- `post_approvals` - Content approval tracking
- `approval_threads` - Approval comments
- `workflow_templates` - Workflow definitions
- `workflow_instances` - Active workflows
- `workflow_notifications` - Workflow alerts

### 5. Client Portal / Audit
- `client_settings` - Client preferences
- `client_comments` - Client feedback
- `client_media` - Client uploads
- `audit_logs` - Activity audit trail
- `notifications` - User notifications
- `notification_preferences` - Notification settings

### 6. Integrations / OAuth
- `platform_connections` - OAuth tokens
- `integration_events` - Integration webhooks
- `webhook_logs` - Webhook debugging
- `webhook_events` - Webhook processing
- `webhook_attempts` - Webhook retries
- `platform_sync_logs` - Sync history

### 7. Analytics / Metrics
- `analytics_metrics` - Performance data
- `analytics_sync_logs` - Sync tracking
- `analytics_goals` - Goal tracking
- `advisor_feedback` - AI advisor feedback
- `auto_plans` - Auto-generated plans

### 8. Persistence / Learning Loop
- `strategy_briefs` - AI strategy briefs
- `content_packages` - Content packages
- `brand_history` - Brand activity log
- `brand_success_patterns` - Success patterns
- `collaboration_logs` - Agent collaboration
- `performance_logs` - Performance tracking
- `platform_insights` - Platform insights
- `token_health` - OAuth token health
- `weekly_summaries` - Weekly reports
- `advisor_review_audits` - Advisor reviews

### 9. Escalations / Rules
- `escalation_rules` - Escalation configuration
- `escalation_events` - Triggered escalations

### 10. Milestones / Achievements
- `milestones` - User milestone tracking

### 11. Payments / Billing
- `payment_attempts` - Payment history
- `archived_data` - Archived user data
- `payment_notifications` - Payment emails

---

## Per-Table Details

### tenants

**Defined in**:
- `supabase/migrations/001_bootstrap_schema.sql` (lines 65-71)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `name` TEXT NOT NULL
- `plan` TEXT DEFAULT 'free'
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes / Constraints**:
- Primary key on `id`
- No additional indexes (tenant lookup via brands table)

**RLS**:
- RLS enabled: Yes (line 1165)
- Policies:
  - **SELECT**: Users can view tenants they belong to via brands → brand_members
  - **INSERT**: Service role only
  - **UPDATE**: Service role only
  - **DELETE**: Service role only

**Referenced in code**:
- `server/lib/brand-access.ts` - Tenant validation
- `server/routes/brands.ts` - Brand creation with tenant
- `server/routes/auth.ts` - Tenant creation during signup

---

### brands

**Defined in**:
- `supabase/migrations/001_bootstrap_schema.sql` (lines 100-122)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `name` TEXT NOT NULL
- `slug` TEXT
- `description` TEXT
- `logo_url` TEXT
- `website_url` TEXT
- `industry` TEXT
- `tenant_id` UUID REFERENCES tenants(id) ON DELETE SET NULL
- `workspace_id` TEXT (backward compatibility alias to tenant_id)
- `created_by` UUID REFERENCES auth.users(id) ON DELETE SET NULL
- `brand_kit` JSONB DEFAULT '{}'::jsonb
- `voice_summary` JSONB
- `visual_summary` JSONB
- `intake_completed` BOOLEAN DEFAULT FALSE
- `intake_completed_at` TIMESTAMPTZ
- `scraped_at` TIMESTAMPTZ
- `scraper_status` TEXT DEFAULT 'never_run'
- `tone_keywords` TEXT[]
- `compliance_rules` TEXT
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()

**Indexes / Constraints**:
- UNIQUE INDEX `brands_slug_tenant_unique` ON (tenant_id, slug) WHERE tenant_id IS NOT NULL (line 834)
- INDEX `idx_brands_tenant_id` (line 828)
- INDEX `idx_brands_created_by` (line 829)
- INDEX `idx_brands_website_url` (line 830)
- INDEX `idx_brands_scraper_status` (line 831)
- INDEX `idx_brands_intake_completed` (line 832)
- INDEX `idx_brands_intake_completed_at` (line 833)
- Trigger: `update_brands_updated_at` (line 1046)

**RLS**:
- RLS enabled: Yes (line 1220)
- Policies:
  - **SELECT**: Brand members can view brands (via brand_members check OR created_by = auth.uid())
  - **ALL** (INSERT/UPDATE/DELETE): Brand members with role 'owner' or 'admin' OR created_by = auth.uid()

**Referenced in code**:
- `server/routes/brands.ts` - Brand CRUD operations
- `client/contexts/BrandContext.tsx` - Brand context provider
- `server/lib/brand-access.ts` - Brand access validation
- `server/lib/brand-guide-sync.ts` - Brand guide sync

---

### brand_members

**Defined in**:
- `supabase/migrations/001_bootstrap_schema.sql` (lines 125-133)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id` UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `role` VARCHAR(50) NOT NULL DEFAULT 'member'
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- UNIQUE (user_id, brand_id)

**Indexes / Constraints**:
- UNIQUE (user_id, brand_id) (line 132)
- INDEX `idx_brand_members_user_id` (line 837)
- INDEX `idx_brand_members_brand_id` (line 838)
- INDEX `idx_brand_members_role` (line 839)
- Trigger: `update_brand_members_updated_at` (line 1051)

**RLS**:
- RLS enabled: Yes (line 1246)
- Policies:
  - **SELECT**: Users can view their own brand memberships (user_id = auth.uid())
  - **ALL** (INSERT/UPDATE/DELETE): Brand admins (owners/admins) can manage members for their brands

**Referenced in code**:
- `server/lib/brand-access.ts` - Access control
- `server/routes/brand-members.ts` - Member management
- `client/contexts/BrandContext.tsx` - Brand membership checks

---

### user_profiles

**Defined in**:
- `supabase/migrations/001_bootstrap_schema.sql` (lines 74-84)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- `email` VARCHAR(255) UNIQUE NOT NULL
- `first_name` VARCHAR(100)
- `last_name` VARCHAR(100)
- `avatar_url` TEXT
- `is_active` BOOLEAN DEFAULT TRUE
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
- `last_sign_in_at` TIMESTAMP WITH TIME ZONE

**Indexes / Constraints**:
- UNIQUE on `email` (line 76)
- INDEX `idx_user_profiles_email` (line 821)
- INDEX `idx_user_profiles_created_at` (line 822)
- Trigger: `update_user_profiles_updated_at` (line 1036)

**RLS**:
- RLS enabled: Yes (line 1192)
- Policies:
  - **SELECT**: Users can read own profile (auth.uid()::text = id::text) (line 1194-1196)
  - **UPDATE**: Users can update own profile (line 1198-1201)

**Referenced in code**:
- `server/routes/auth.ts` - Authentication
- `client/contexts/UserContext.tsx` - User context
- `server/lib/preferences-db-service.ts` - User preferences

---

### user_preferences

**Defined in**:
- `supabase/migrations/001_bootstrap_schema.sql` (lines 87-97)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- `user_id` UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE
- `theme` VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system'))
- `notifications_enabled` BOOLEAN DEFAULT TRUE
- `email_digest` VARCHAR(20) DEFAULT 'daily' CHECK (email_digest IN ('daily', 'weekly', 'never'))
- `language` VARCHAR(10) DEFAULT 'en'
- `timezone` VARCHAR(100) DEFAULT 'UTC'
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

**Indexes / Constraints**:
- UNIQUE on `user_id` (line 89)
- INDEX `idx_user_preferences_user_id` (line 825)
- Trigger: `update_user_preferences_updated_at` (line 1041)

**RLS**:
- RLS enabled: Yes (line 1204)
- Policies:
  - **SELECT**: Users can read own preferences (auth.uid()::text = user_id::text) (line 1206-1208)
  - **UPDATE**: Users can update own preferences (line 1210-1213)
  - **INSERT**: Users can insert own preferences (line 1215-1217)

**Referenced in code**:
- `server/lib/preferences-db-service.ts` - Preferences service
- `client/hooks/usePreferences.ts` - Preferences hook

---

### content_items

**Defined in**:
- `supabase/migrations/001_bootstrap_schema.sql` (lines 140-156)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- `brand_id` UUID REFERENCES brands(id) ON DELETE CASCADE
- `title` TEXT NOT NULL
- `type` TEXT NOT NULL
- `content` JSONB NOT NULL DEFAULT '{}'::jsonb
- `platform` TEXT
- `media_urls` TEXT[]
- `scheduled_for` TIMESTAMP WITH TIME ZONE
- `status` TEXT NOT NULL DEFAULT 'draft'
- `generated_by_agent` TEXT
- `created_by` UUID REFERENCES auth.users(id) ON DELETE SET NULL
- `approved_by` UUID REFERENCES user_profiles(id) ON DELETE SET NULL
- `published_at` TIMESTAMP WITH TIME ZONE
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT now()
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT now()

**Indexes / Constraints**:
- INDEX `idx_content_items_brand_id` (line 842)
- INDEX `idx_content_items_status` (line 843)
- INDEX `idx_content_items_created_by` (line 844)
- INDEX `idx_content_items_created_at` (line 845)
- Trigger: `update_content_items_updated_at` (line 1056)

**RLS**:
- RLS enabled: Yes (line 1268)
- Policies:
  - **SELECT**: Brand members can view content items (line 1270-1278)
  - **ALL** (INSERT/UPDATE/DELETE): Brand members can manage content items (line 1280-1288)

**Referenced in code**:
- `server/routes/content-plan.ts` - Content planning
- `server/lib/content-planning-service.ts` - Content service
- `client/app/(postd)/content-generator/page.tsx` - Content generator
- `server/routes/creative-studio.ts` - Creative studio operations

---

### post_approvals

**Defined in**:
- `supabase/migrations/001_bootstrap_schema.sql` (lines 201-214)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `post_id` UUID
- `status` TEXT NOT NULL DEFAULT 'pending'
- `approved_at` TIMESTAMP WITH TIME ZONE
- `approved_by` UUID REFERENCES auth.users(id) ON DELETE SET NULL
- `rejected_at` TIMESTAMP WITH TIME ZONE
- `rejected_by` TEXT
- `rejection_reason` TEXT
- `locked` BOOLEAN DEFAULT FALSE
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT now()
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT now()

**Indexes / Constraints**:
- INDEX `idx_post_approvals_brand_id` (line 860)
- INDEX `idx_post_approvals_post_id` (line 861)
- INDEX `idx_post_approvals_status` (line 862)
- Trigger: `update_post_approvals_updated_at` (line 1071)

**RLS**:
- RLS enabled: Yes (line 1344)
- Policies:
  - **SELECT**: Brand members can view post approvals (line 1346-1354)
  - **ALL** (INSERT/UPDATE/DELETE): Brand members can manage post approvals (line 1356-1364)

**Referenced in code**:
- `server/lib/dbClient.ts` - PostApprovalRecord interface
- `server/lib/approvals-db-service.ts` - Approvals service
- `server/routes/approvals.ts` - Approvals API
- `client/app/(postd)/approvals/page.tsx` - Approvals UI

---

### client_settings

**Defined in**:
- `supabase/migrations/007_client_portal_and_audit.sql`
- `supabase/migrations/009_complete_schema_sync.sql`
- `supabase/migrations/012_canonical_schema_alignment.sql` (updates)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `client_id` UUID/VARCHAR REFERENCES auth.users(id) ON DELETE SET NULL
- `brand_id` UUID/VARCHAR NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `email_preferences` JSONB
- `timezone` TEXT/VARCHAR NOT NULL DEFAULT 'America/New_York'
- `language` TEXT/VARCHAR NOT NULL DEFAULT 'en'
- `unsubscribe_token` TEXT/VARCHAR UNIQUE
- `unsubscribed_from_all` BOOLEAN NOT NULL DEFAULT FALSE
- `unsubscribed_types` TEXT[]
- `can_view_analytics` BOOLEAN DEFAULT FALSE
- `can_approve_content` BOOLEAN DEFAULT FALSE
- `can_upload_media` BOOLEAN DEFAULT FALSE
- `can_view_brand_guide` BOOLEAN DEFAULT FALSE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `last_modified_by` VARCHAR
- UNIQUE (client_id, brand_id)

**Indexes / Constraints**:
- UNIQUE (client_id, brand_id)
- INDEX `idx_client_settings_client_id`
- INDEX `idx_client_settings_brand_id`
- Trigger: `update_client_settings_updated_at`

**RLS**:
- RLS enabled: Yes
- Policies:
  - `select`: Clients can view own settings; admins can view all
  - `all`: Admins can manage client settings

**Referenced in code**:
- `server/lib/dbClient.ts` - ClientSettingsRecord interface
- `server/routes/client-settings.ts` - Client settings API
- `client/app/(postd)/client-portal/page.tsx` - Client portal UI

---

### audit_logs

**Defined in**:
- `supabase/migrations/007_client_portal_and_audit.sql`
- `supabase/migrations/009_complete_schema_sync.sql`
- `supabase/migrations/012_canonical_schema_alignment.sql` (updates)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` UUID/VARCHAR NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `user_id` UUID REFERENCES auth.users(id) ON DELETE SET NULL
- `post_id` VARCHAR (legacy)
- `actor_id` VARCHAR (legacy)
- `actor_email` VARCHAR (legacy)
- `action` VARCHAR(100) NOT NULL
- `resource_type` VARCHAR(50) NOT NULL
- `resource_id` VARCHAR(255) NOT NULL
- `changes` JSONB (legacy, renamed to metadata)
- `metadata` JSONB DEFAULT '{}'
- `ip_address` VARCHAR(45)
- `user_agent` TEXT
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

**Indexes / Constraints**:
- INDEX `idx_audit_logs_brand_id`
- INDEX `idx_audit_logs_user_id`
- INDEX `idx_audit_logs_action`
- INDEX `idx_audit_logs_resource` (resource_type, resource_id)
- INDEX `idx_audit_logs_created_at`

**RLS**:
- RLS enabled: Yes
- Policies:
  - `select`: Admins can view audit logs for their brands

**Referenced in code**:
- `server/lib/dbClient.ts` - AuditLogRecord interface
- `server/routes/audit.ts` - Audit API
- `server/lib/brand-access.ts` - Audit logging

---

### platform_connections

**Defined in**:
- `supabase/migrations/005_integrations.sql`
- `supabase/migrations/012_canonical_schema_alignment.sql` (adds status column)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `platform` VARCHAR(50) NOT NULL
- `account_id` VARCHAR(255) NOT NULL
- `account_name` VARCHAR(255)
- `access_token` TEXT NOT NULL
- `refresh_token` TEXT
- `expires_at` TIMESTAMP WITH TIME ZONE
- `is_active` BOOLEAN DEFAULT TRUE
- `status` TEXT NOT NULL DEFAULT 'active' (added in migration 012)
- `last_sync_at` TIMESTAMP WITH TIME ZONE
- `next_sync_at` TIMESTAMP WITH TIME ZONE
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
- `disconnected_at` TIMESTAMP WITH TIME ZONE
- UNIQUE(brand_id, platform, account_id)

**Indexes / Constraints**:
- UNIQUE(brand_id, platform, account_id)
- INDEX `idx_platform_connections_brand_id`
- INDEX `idx_platform_connections_platform`
- INDEX `idx_platform_connections_is_active`
- INDEX `idx_platform_connections_updated_at`
- Trigger: `update_platform_connections_updated_at`
- Function: `check_token_expiration()`

**RLS**:
- RLS enabled: Yes
- Policies:
  - `select`: Brand members can view platform connections
  - `all`: Only brand admins can manage connections

**Referenced in code**:
- `server/lib/connections-db-service.ts` - Connections service
- `server/routes/integrations.ts` - Integrations API
- `server/connectors/*` - Platform connectors

---

### analytics_metrics

**Defined in**:
- `supabase/migrations/004_analytics_and_metrics.sql` (skipped, exists)
- `supabase/migrations/009_complete_schema_sync.sql`
- `supabase/migrations/012_canonical_schema_alignment.sql` (migrates to JSONB)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- `content_item_id` UUID REFERENCES content_items(id) ON DELETE CASCADE (legacy)
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `platform` TEXT NOT NULL
- `date` DATE NOT NULL
- `metrics` JSONB NOT NULL (migrated from individual columns)
- `recorded_at` TIMESTAMP WITH TIME ZONE DEFAULT now() (legacy)
- UNIQUE (brand_id, platform, date)

**Indexes / Constraints**:
- UNIQUE (brand_id, platform, date)
- INDEX `idx_analytics_metrics_content_item_id`
- INDEX `idx_analytics_metrics_platform`
- INDEX `idx_analytics_metrics_recorded_at`
- INDEX `idx_analytics_metrics_brand_date`
- INDEX `idx_analytics_metrics_brand_platform`

**RLS**:
- RLS enabled: Yes
- Policies: Brand members can view analytics for their brands

**Referenced in code**:
- `server/lib/analytics-db-service.ts` - Analytics service
- `server/routes/analytics.ts` - Analytics API
- `server/lib/analytics-sync.ts` - Analytics sync

---

### publishing_jobs

**Defined in**:
- `supabase/migrations/012_canonical_schema_alignment.sql`
- `server/migrations/007_publishing_jobs_and_logs.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `tenant_id` UUID REFERENCES tenants(id) ON DELETE SET NULL
- `content` JSONB NOT NULL
- `platforms` TEXT[] NOT NULL
- `status` TEXT NOT NULL DEFAULT 'pending'
- `scheduled_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes / Constraints**:
- INDEX `idx_publishing_jobs_brand_id`
- INDEX `idx_publishing_jobs_status`

**RLS**:
- RLS enabled: Yes
- Policies: Brand members can view publishing jobs

**Referenced in code**:
- `server/lib/publishing-db-service.ts` - Publishing service
- `server/routes/publishing.ts` - Publishing API
- `server/workers/*` - Publishing workers

---

### publishing_logs

**Defined in**:
- `supabase/migrations/012_canonical_schema_alignment.sql`
- `server/migrations/007_publishing_jobs_and_logs.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `job_id` UUID NOT NULL REFERENCES publishing_jobs(id) ON DELETE CASCADE
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `platform` TEXT NOT NULL
- `status` TEXT NOT NULL
- `platform_post_id` TEXT
- `error_message` TEXT
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes / Constraints**:
- INDEX on job_id, brand_id

**RLS**:
- RLS enabled: Yes
- Policies: Brand members can view publishing logs

**Referenced in code**:
- `server/lib/publishing-db-service.ts` - Publishing service
- `server/routes/publishing.ts` - Publishing API

---

### media_assets

**Defined in**:
- `supabase/migrations/012_canonical_schema_alignment.sql`
- `server/migrations/006_media_tables.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `tenant_id` UUID REFERENCES tenants(id) ON DELETE SET NULL
- `category` TEXT
- `filename` TEXT NOT NULL
- `path` TEXT NOT NULL
- `hash` TEXT
- `mime_type` TEXT
- `size_bytes` BIGINT
- `used_in` TEXT[] DEFAULT ARRAY[]::TEXT[]
- `usage_count` INTEGER NOT NULL DEFAULT 0
- `metadata` JSONB DEFAULT '{}'::jsonb
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes / Constraints**:
- INDEX `idx_media_assets_brand_id`
- INDEX `idx_media_assets_tenant_id`

**RLS**:
- RLS enabled: Yes
- Policies: Brand members can view media assets for their brands

**Referenced in code**:
- `server/lib/media-db-service.ts` - Media service
- `server/routes/media.ts` - Media API
- `server/lib/image-sourcing.ts` - Image sourcing

---

### brand_assets

**Defined in**:
- `supabase/migrations/009_complete_schema_sync.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- `brand_id` UUID REFERENCES brands(id) ON DELETE CASCADE
- `asset_type` TEXT NOT NULL
- `file_name` TEXT NOT NULL
- `file_path` TEXT NOT NULL
- `file_size` BIGINT
- `mime_type` TEXT
- `metadata` JSONB DEFAULT '{}'
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT now()
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT now()

**Indexes / Constraints**:
- INDEX `idx_brand_assets_brand_id`
- INDEX `idx_brand_assets_asset_type`

**RLS**:
- RLS enabled: Yes (policies in migration 012)
- Policies: Brand members can view brand assets

**Referenced in code**:
- `server/lib/fileUpload.ts` - File upload
- `client/lib/fileUpload.ts` - Client file upload
- `server/routes/brand-guide.ts` - Brand guide API

---

### webhook_events

**Defined in**:
- `supabase/migrations/012_canonical_schema_alignment.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` UUID REFERENCES brands(id) ON DELETE SET NULL
- `provider` TEXT NOT NULL
- `event_type` TEXT NOT NULL
- `payload` JSONB NOT NULL
- `idempotency_key` TEXT
- `status` TEXT NOT NULL DEFAULT 'received'
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes / Constraints**:
- Index on brand_id, provider, created_at

**RLS**:
- RLS enabled: Yes
- Policies: Brand members can view webhook events

**Referenced in code**:
- `server/lib/dbClient.ts` - WebhookEventRecord interface
- `server/routes/webhooks.ts` - Webhook handler

---

### webhook_attempts

**Defined in**:
- `supabase/migrations/012_canonical_schema_alignment.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `event_id` UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE
- `attempt_number` INTEGER NOT NULL
- `status` TEXT NOT NULL
- `response_code` INTEGER
- `error_message` TEXT
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes / Constraints**:
- Index on event_id, attempt_number

**RLS**:
- RLS enabled: Yes
- Policies: Brand members can view webhook attempts

**Referenced in code**:
- `server/lib/dbClient.ts` - WebhookAttemptRecord interface
- `server/routes/webhooks.ts` - Webhook handler

---

### escalation_rules

**Defined in**:
- `supabase/migrations/012_canonical_schema_alignment.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `rule_type` TEXT NOT NULL
- `trigger_hours` INTEGER NOT NULL
- `escalate_to_role` TEXT NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes / Constraints**:
- Index on brand_id

**RLS**:
- RLS enabled: Yes
- Policies: Brand admins can manage escalation rules

**Referenced in code**:
- `server/lib/dbClient.ts` - EscalationRuleRecord interface
- `server/routes/escalations.ts` - Escalations API

---

### escalation_events

**Defined in**:
- `supabase/migrations/012_canonical_schema_alignment.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `approval_id` UUID REFERENCES post_approvals(id) ON DELETE SET NULL
- `rule_id` UUID REFERENCES escalation_rules(id) ON DELETE SET NULL
- `status` TEXT NOT NULL DEFAULT 'pending'
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `resolved_at` TIMESTAMPTZ

**Indexes / Constraints**:
- Index on brand_id, approval_id

**RLS**:
- RLS enabled: Yes
- Policies: Brand members can view escalation events

**Referenced in code**:
- `server/lib/dbClient.ts` - EscalationEventRecord interface
- `server/routes/escalations.ts` - Escalations API

---

### milestones

**Defined in**:
- `supabase/migrations/001_bootstrap_schema.sql` (lines 758-767)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `workspace_id` TEXT NOT NULL
- `key` TEXT NOT NULL
- `unlocked_at` TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
- `acknowledged_at` TIMESTAMP WITH TIME ZONE
- `created_at` TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
- UNIQUE (workspace_id, key)

**Indexes / Constraints**:
- UNIQUE (workspace_id, key) (line 766)
- INDEX `idx_milestones_workspace` (line 1016)
- INDEX `idx_milestones_key` (line 1017)
- INDEX `idx_milestones_unlocked_at` (line 1018)
- Trigger: `update_milestones_updated_at` (line 1141)

**RLS**:
- RLS enabled: Yes (line 2157)
- Policies:
  - **SELECT**: Users can view workspace milestones (via workspace membership check) (line 2159-2169)
  - **INSERT**: Service role OR brand owners/admins for that workspace (line 2171-2183)
  - **UPDATE**: Users can acknowledge workspace milestones (line 2185-2195)

**Referenced in code**:
- `server/routes/milestones.ts` - Milestones API
- `server/lib/milestones.ts` - Milestone logic

---

### strategy_briefs

**Defined in**:
- `supabase/migrations/001_bootstrap_schema.sql` (lines 597-609)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` TEXT NOT NULL (note: TEXT, not UUID)
- `request_id` TEXT NOT NULL
- `cycle_id` TEXT NOT NULL
- `version` TEXT NOT NULL
- `positioning` JSONB NOT NULL
- `voice` JSONB NOT NULL
- `visual` JSONB NOT NULL
- `competitive` JSONB NOT NULL
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()

**Indexes / Constraints**:
- INDEX `idx_strategy_briefs_brand_id` (line 979)
- INDEX `idx_strategy_briefs_created_at` (line 980)
- Trigger: `update_strategy_briefs_updated_at` (line 1131)

**RLS**:
- RLS enabled: Yes (line 1888)
- Policies:
  - **SELECT**: Brand members OR brand creator (line 1890-1898)
  - **INSERT**: Service role OR brand owners/admins (line 1900-1913)
  - **UPDATE**: Brand owners/admins only (line 1915-1925)
  - **DELETE**: Brand owners/admins only (line 1927-1937)
- Uses `is_brand_member_text()` helper function for TEXT brand_id

**Referenced in code**:
- `server/lib/collaboration-storage.ts` - Strategy brief storage
- `server/agents/*` - AI agents
- `server/lib/orchestration.ts` - Orchestration

---

### content_packages

**Defined in**:
- `supabase/migrations/001_bootstrap_schema.sql` (lines 612-627)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` TEXT NOT NULL (note: TEXT, not UUID)
- `content_id` TEXT NOT NULL UNIQUE
- `request_id` TEXT NOT NULL
- `cycle_id` TEXT NOT NULL
- `copy` JSONB NOT NULL
- `design_context` JSONB
- `collaboration_log` JSONB NOT NULL
- `status` TEXT NOT NULL DEFAULT 'draft'
- `quality_score` DECIMAL(3,1)
- `requires_approval` BOOLEAN DEFAULT true
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `published_at` TIMESTAMP WITH TIME ZONE

**Indexes / Constraints**:
- UNIQUE on `content_id` (line 615)
- INDEX `idx_content_packages_brand_id` (line 982)
- INDEX `idx_content_packages_status` (line 983)
- INDEX `idx_content_packages_created_at` (line 984)
- Trigger: `update_content_packages_updated_at` (line 1136)

**RLS**:
- RLS enabled: Yes (line 1940)
- Policies:
  - **SELECT**: Brand members OR brand creator (line 1942-1950)
  - **INSERT**: Service role OR brand members with role IN ('owner','admin','editor','creator') (line 1952-1965)
  - **UPDATE**: Brand members for that brand (line 1967-1969)
  - **DELETE**: Brand owners/admins only (line 1971-1981)
- Uses `is_brand_member_text()` helper function for TEXT brand_id

**Referenced in code**:
- `server/lib/collaboration-storage.ts` - Content package storage
- `server/routes/onboarding.ts` - Onboarding content packages
- `server/agents/*` - AI agents

---

### brand_history

**Defined in**:
- `supabase/migrations/001_bootstrap_schema.sql` (lines 630-643)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` TEXT NOT NULL (note: TEXT, not UUID)
- `entry_id` TEXT NOT NULL
- `timestamp` TIMESTAMP WITH TIME ZONE NOT NULL
- `agent` TEXT NOT NULL
- `action` TEXT NOT NULL
- `content_id` TEXT
- `details` JSONB
- `rationale` TEXT
- `performance` JSONB
- `tags` TEXT[] NOT NULL DEFAULT '{}'
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()

**Indexes / Constraints**:
- INDEX `idx_brand_history_brand_id` (line 986)
- INDEX `idx_brand_history_timestamp` (line 987)
- INDEX `idx_brand_history_tags` USING GIN(tags) (line 988)

**RLS**:
- RLS enabled: Yes (line 1984)
- Policies:
  - **SELECT**: Brand members OR brand creator (line 1986-1994)
  - **INSERT**: Service role OR brand owners/admins (line 1996-2009)
  - **UPDATE**: Denied (immutable log) (line 2011-2013)
  - **DELETE**: Denied (immutable log) (line 2015-2017)
- Uses `is_brand_member_text()` helper function for TEXT brand_id
- **Immutable**: No updates or deletes allowed

**Referenced in code**:
- `server/lib/collaboration-storage.ts` - Brand history storage
- `server/agents/*` - AI agents

---

### notifications

**Defined in**:
- `supabase/migrations/007_client_portal_and_audit.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- `user_id` UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE
- `brand_id` UUID REFERENCES brands(id) ON DELETE CASCADE
- `type` VARCHAR(50) NOT NULL
- `title` VARCHAR(255) NOT NULL
- `message` TEXT NOT NULL
- `severity` VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success'))
- `action_url` TEXT
- `is_read` BOOLEAN DEFAULT FALSE
- `read_at` TIMESTAMP WITH TIME ZONE
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
- `expires_at` TIMESTAMP WITH TIME ZONE

**Indexes / Constraints**:
- INDEX `idx_notifications_user_id`
- INDEX `idx_notifications_brand_id`
- INDEX `idx_notifications_is_read`
- INDEX `idx_notifications_created_at`

**RLS**:
- RLS enabled: Yes
- Policies:
  - `select`: Users can view own notifications
  - `update`: Users can update notification read status

**Referenced in code**:
- `server/routes/notifications.ts` - Notifications API
- `client/hooks/useNotifications.ts` - Notifications hook

---

### approval_threads

**Defined in**:
- `supabase/migrations/009_complete_schema_sync.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- `content_item_id` UUID REFERENCES content_items(id) ON DELETE CASCADE
- `user_id` UUID REFERENCES user_profiles(id) ON DELETE SET NULL
- `comment` TEXT NOT NULL
- `action` TEXT
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT now()

**Indexes / Constraints**:
- INDEX `idx_approval_threads_content_item_id`
- INDEX `idx_approval_threads_user_id`

**RLS**:
- RLS enabled: Yes (policies in migration 006)
- Policies: Brand members can view/manage approval threads

**Referenced in code**:
- `server/routes/approvals.ts` - Approvals API
- `client/app/(postd)/approvals/page.tsx` - Approvals UI

---

### workflow_templates

**Defined in**:
- `supabase/migrations/012_canonical_schema_alignment.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `name` TEXT NOT NULL
- `steps` JSONB NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes / Constraints**:
- Index on brand_id

**RLS**:
- RLS enabled: Yes
- Policies: Brand members can view/manage workflow templates

**Referenced in code**:
- `server/routes/workflow.ts` - Workflow API

---

### workflow_instances

**Defined in**:
- `supabase/migrations/012_canonical_schema_alignment.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `template_id` UUID REFERENCES workflow_templates(id) ON DELETE SET NULL
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `status` TEXT NOT NULL DEFAULT 'active'
- `current_step` INTEGER DEFAULT 0
- `context` JSONB DEFAULT '{}'::jsonb
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes / Constraints**:
- Index on brand_id, template_id

**RLS**:
- RLS enabled: Yes
- Policies: Brand members can view/manage workflow instances

**Referenced in code**:
- `server/routes/workflow.ts` - Workflow API

---

### scheduled_content

**Defined in**:
- `supabase/migrations/012_canonical_schema_alignment.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `content_id` UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE
- `scheduled_at` TIMESTAMPTZ NOT NULL
- `platforms` TEXT[] NOT NULL
- `status` TEXT NOT NULL DEFAULT 'scheduled'
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- UNIQUE (content_id, scheduled_at)

**Indexes / Constraints**:
- UNIQUE (content_id, scheduled_at)
- INDEX `idx_scheduled_content_brand_id`
- INDEX `idx_scheduled_content_scheduled_at`

**RLS**:
- RLS enabled: Yes
- Policies: Brand members can view/manage scheduled content

**Referenced in code**:
- `server/routes/calendar.ts` - Calendar API
- `client/app/(postd)/calendar/page.tsx` - Calendar UI

---

### analytics_goals

**Defined in**:
- `supabase/migrations/012_canonical_schema_alignment.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `metric` TEXT NOT NULL
- `target` NUMERIC NOT NULL
- `current` NUMERIC NOT NULL DEFAULT 0
- `deadline` DATE
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes / Constraints**:
- Index on brand_id

**RLS**:
- RLS enabled: Yes
- Policies: Brand members can view/manage analytics goals

**Referenced in code**:
- `server/lib/analytics-db-service.ts` - Analytics service
- `server/routes/analytics.ts` - Analytics API

---

### analytics_sync_logs

**Defined in**:
- `supabase/migrations/012_canonical_schema_alignment.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `platform` TEXT NOT NULL
- `sync_type` TEXT NOT NULL
- `status` TEXT NOT NULL
- `error_message` TEXT
- `started_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `finished_at` TIMESTAMPTZ

**Indexes / Constraints**:
- Index on brand_id, platform

**RLS**:
- RLS enabled: Yes
- Policies: Brand members can view analytics sync logs

**Referenced in code**:
- `server/lib/analytics-sync.ts` - Analytics sync
- `server/routes/analytics.ts` - Analytics API

---

### advisor_feedback

**Defined in**:
- `supabase/migrations/012_canonical_schema_alignment.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `insight_id` TEXT NOT NULL
- `category` TEXT
- `type` TEXT
- `feedback` TEXT
- `previous_weight` NUMERIC
- `new_weight` NUMERIC
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Indexes / Constraints**:
- Index on brand_id

**RLS**:
- RLS enabled: Yes
- Policies: Brand members can view/manage advisor feedback

**Referenced in code**:
- `server/routes/advisor.ts` - Advisor API
- `client/components/dashboard/AnalyticsAdvisor.tsx` - Advisor UI

---

### auto_plans

**Defined in**:
- `supabase/migrations/012_canonical_schema_alignment.sql`

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `brand_id` UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE
- `month` DATE NOT NULL
- `plan_data` JSONB NOT NULL
- `confidence` NUMERIC
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
- UNIQUE (brand_id, month)

**Indexes / Constraints**:
- UNIQUE (brand_id, month)
- Index on brand_id

**RLS**:
- RLS enabled: Yes
- Policies: Brand members can view/manage auto plans

**Referenced in code**:
- `server/lib/content-planning-service.ts` - Content planning
- `server/routes/content-plan.ts` - Content plan API

---

### payment_attempts

**Defined in**:
- `supabase/migrations/001_bootstrap_schema.sql` (lines 774-788)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id` UUID NOT NULL (references auth.users, no FK to avoid circular dependency)
- `attempt_number` INT NOT NULL
- `status` VARCHAR(50) NOT NULL CHECK (status IN ('failed', 'succeeded', 'pending'))
- `amount` DECIMAL(10, 2)
- `currency` VARCHAR(3) DEFAULT 'USD'
- `stripe_invoice_id` VARCHAR(255)
- `stripe_payment_intent_id` VARCHAR(255)
- `error_code` VARCHAR(255)
- `error_message` TEXT
- `attempted_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()

**Indexes / Constraints**:
- INDEX `idx_payment_attempts_user_id` (line 1021)
- INDEX `idx_payment_attempts_status` (line 1022)
- CHECK constraint on status (line 778)
- Trigger: `update_payment_attempts_updated_at` (line 1146)

**RLS**:
- RLS enabled: Yes (line 2202)
- Policies:
  - **SELECT**: Users can view own payment attempts (user_id = auth.uid()) (line 2204-2206)
  - **INSERT**: Service role OR user_id = auth.uid() (line 2208-2213)
  - **UPDATE**: Service role OR user_id = auth.uid() (line 2215-2220)

**Referenced in code**:
- `server/routes/billing.ts` - Billing API
- `server/lib/account-status-service.ts` - Account status checks

---

### archived_data

**Defined in**:
- `supabase/migrations/001_bootstrap_schema.sql` (lines 791-801)

**Columns**:
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id` UUID NOT NULL
- `brand_id` UUID
- `data_type` VARCHAR(100) NOT NULL
- `data` JSONB NOT NULL
- `archived_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `delete_after` TIMESTAMP WITH TIME ZONE NOT NULL
- `restored` BOOLEAN DEFAULT FALSE
- `restored_at` TIMESTAMP WITH TIME ZONE

**Indexes / Constraints**:
- INDEX `idx_archived_data_user_id` (line 1025)
- INDEX `idx_archived_data_delete_after` (line 1026)

**RLS**:
- RLS enabled: Yes (line 2223)
- Policies:
  - **SELECT**: Users can view own archived data OR brand members (if brand_id present) (line 2225-2237)
  - **INSERT**: Service role only (line 2239-2241)
  - **UPDATE**: Service role only (for restoration flags) (line 2243-2245)

**Referenced in code**:
- `server/routes/billing.ts` - Billing API
- `server/lib/account-status-service.ts` - Account status and data archival

---

## RLS & Security Overview

### Tables with RLS Disabled or Open Policies

**⚠️ HIGH RISK - RLS Disabled or Using `USING (true)`:**

1. **milestones** - Uses `USING (true)` for all policies (TODO comments indicate need for proper workspace auth)
2. **strategy_briefs** - RLS not specified (likely needs RLS)
3. **content_packages** - RLS not specified (likely needs RLS)
4. **brand_history** - RLS not specified (likely needs RLS)
5. **payment_attempts** - RLS not specified (likely needs RLS)
6. **archived_data** - RLS not specified (likely needs RLS)

### Critical Tables for Security

**Multi-Tenant Isolation:**
- `brands` - ✅ Has RLS with brand member checks
- `brand_members` - ✅ Has RLS (users can view own memberships)
- `tenants` - ⚠️ RLS enabled but minimal policies

**Content & Publishing:**
- `content_items` - ✅ Has RLS (brand members only)
- `post_approvals` - ✅ Has RLS (brand members only)
- `publishing_jobs` - ✅ Has RLS (brand members only)

**Client Portal:**
- `client_settings` - ✅ Has RLS (clients + admins)
- `audit_logs` - ✅ Has RLS (admins only)

**Integrations:**
- `platform_connections` - ✅ Has RLS (brand members view, admins manage)
- `webhook_events` - ✅ Has RLS (brand members)

**Analytics:**
- `analytics_metrics` - ✅ Has RLS (brand members)

### RLS Policy Patterns

**Common Patterns:**
1. **Brand Member Access**: `EXISTS (SELECT 1 FROM brand_members WHERE brand_id = X AND user_id = auth.uid())`
2. **Admin-Only**: `role IN ('owner', 'admin')`
3. **Own Data**: `user_id = auth.uid()`
4. **System Role**: `auth.uid()::text = '00000000-0000-0000-0000-000000000000'`

---

## Code Reference Mapping

### Primary Database Services

**`server/lib/dbClient.ts`** - Core database client
- `client_settings` - ClientSettingsRecord
- `post_approvals` - PostApprovalRecord
- `audit_logs` - AuditLogRecord
- `webhook_events` - WebhookEventRecord
- `webhook_attempts` - WebhookAttemptRecord
- `escalation_rules` - EscalationRuleRecord
- `escalation_events` - EscalationEventRecord

**`server/lib/analytics-db-service.ts`** - Analytics service
- `analytics_metrics`
- `analytics_goals`
- `analytics_sync_logs`

**`server/lib/connections-db-service.ts`** - OAuth connections
- `platform_connections`
- `platform_sync_logs`

**`server/lib/publishing-db-service.ts`** - Publishing
- `publishing_jobs`
- `publishing_logs`

**`server/lib/media-db-service.ts`** - Media management
- `media_assets`
- `media_usage_logs`
- `storage_quotas`

**`server/lib/approvals-db-service.ts`** - Approvals
- `post_approvals`
- `approval_threads`

**`server/lib/preferences-db-service.ts`** - User preferences
- `user_preferences`

### API Routes

**`server/routes/brands.ts`** - Brand management
- `brands`
- `brand_members`

**`server/routes/content-plan.ts`** - Content planning
- `content_items`
- `auto_plans`

**`server/routes/approvals.ts`** - Approvals
- `post_approvals`
- `approval_threads`

**`server/routes/client-portal.ts`** - Client portal
- `client_settings`
- `client_comments`
- `client_media`

**`server/routes/analytics.ts`** - Analytics
- `analytics_metrics`
- `analytics_goals`

**`server/routes/integrations.ts`** - Integrations
- `platform_connections`
- `integration_events`

**`server/routes/publishing.ts`** - Publishing
- `publishing_jobs`
- `publishing_logs`

**`server/routes/webhooks.ts`** - Webhooks
- `webhook_events`
- `webhook_attempts`

**`server/routes/escalations.ts`** - Escalations
- `escalation_rules`
- `escalation_events`

**`server/routes/milestones.ts`** - Milestones
- `milestones`

**`server/routes/billing.ts`** - Billing
- `payment_attempts`
- `archived_data`

### Client Hooks & Contexts

**`client/contexts/BrandContext.tsx`** - Brand context
- `brands` (via `/api/brands`)

**`client/contexts/UserContext.tsx`** - User context
- `user_profiles`

**`client/hooks/useBrandGuide.ts`** - Brand guide
- `brands` (brand_kit JSONB)

**`client/hooks/useNotifications.ts`** - Notifications
- `notifications`

**`client/hooks/useMilestones.ts`** - Milestones
- `milestones`

---

## Summary & Notes

### Total Tables Discovered

**51 tables** organized across 11 functional categories:
- Core/Multi-Tenant: 5 tables (tenants, user_profiles, user_preferences, brands, brand_members)
- Content/Studio: 4 tables (content_items, scheduled_content, publishing_jobs, publishing_logs)
- Approvals/Workflows: 6 tables (post_approvals, approval_threads, workflow_templates, workflow_instances, escalation_rules, escalation_events)
- Client Portal/Audit: 6 tables (client_settings, client_comments, client_media, audit_logs, notifications, notification_preferences)
- Integrations/OAuth: 6 tables (platform_connections, platform_sync_logs, webhook_events, webhook_attempts, integration_events, webhook_logs)
- Analytics/Metrics: 5 tables (analytics_metrics, analytics_goals, analytics_sync_logs, advisor_feedback, auto_plans)
- Media & Assets: 5 tables (media_assets, media_usage_logs, brand_assets, assets, storage_quotas)
- Persistence/Learning Loop: 10 tables (strategy_briefs, content_packages, brand_history, brand_success_patterns, collaboration_logs, performance_logs, platform_insights, token_health, weekly_summaries, advisor_review_audits)
- Milestones: 1 table (milestones)
- Payments/Billing: 3 tables (payment_attempts, archived_data, payment_notifications)

### Red Flags

**🔴 Critical Security Issues:**

**Note**: All tables in the bootstrap schema have RLS enabled with appropriate policies. The following were previously flagged but are now secured:

1. ✅ **milestones** - Has proper workspace-based RLS (users can view workspace milestones, system can insert)
2. ✅ **strategy_briefs, content_packages, brand_history** - Have RLS with brand member checks via `is_brand_member_text()` helper
3. ✅ **payment_attempts, archived_data** - Have RLS (users can view own data, service role for system operations)

**🟡 Medium Risk:**

1. **tenants table** - RLS enabled with tenant-scoped access via brands → brand_members relationship. Policies restrict to service role for writes, which is appropriate.

**🟢 Low Risk / Good:**

1. Most core tables have proper RLS with brand member checks
2. Client portal tables have appropriate RLS
3. Publishing and analytics tables have brand-scoped RLS

### Recommended Follow-Ups

**✅ Completed in Bootstrap Schema:**

1. ✅ **RLS added to persistence schema tables** - All tables have RLS with brand member checks via `is_brand_member_text()` helper
2. ✅ **Milestones RLS policies** - Proper workspace-based access control implemented
3. ✅ **Payment tables RLS** - User-scoped access for payment_attempts and archived_data
4. ✅ **Tenant RLS policies** - Tenant-scoped access via brands → brand_members relationship

**Future Considerations:**

**Short-Term (Post-Launch):**

1. **Consider migrating `brand_id TEXT` to `UUID` in persistence schema tables**
   - 10 tables use `TEXT` instead of `UUID` for brand_id (strategy_briefs, content_packages, brand_history, etc.)
   - Current implementation uses `is_brand_member_text()` helper function for RLS
   - Migration would enable FK constraints but requires careful planning

2. **Consolidate duplicate tables**
   - `assets` vs `brand_assets` vs `media_assets` - clarify purpose
   - `content` vs `content_items` - ensure consistency

3. **Add indexes for common queries**
   - Review query patterns and add missing indexes
   - Especially for brand_id, user_id, status columns

4. **Document RLS policy rationale**
   - Add comments to RLS policies explaining access patterns
   - Document any exceptions or special cases

**Long-Term:**

1. **Schema versioning**
   - Consider adding schema version tracking
   - Document migration dependencies

2. **Performance optimization**
   - Review query patterns and optimize indexes
   - Consider partitioning for large tables (analytics_metrics, audit_logs)

3. **Data retention policies**
   - Implement cleanup jobs for expired data
   - Document retention periods

---

## Migration Files Reference

**Active Migration (Single Source of Truth):**
- `supabase/migrations/001_bootstrap_schema.sql` - **Complete schema baseline**
  - Contains all 51 tables
  - All indexes and constraints
  - All Phase 1 RLS policies
  - Helper functions (update_updated_at, is_brand_member_text, is_workspace_member)
  - Safe to run on empty Supabase project

**Archived/Legacy Migrations** (in `supabase/migrations/_legacy/`):
- All previous migrations have been consolidated into the bootstrap schema
- These files are kept for historical reference only
- Do not reference these for current schema structure

**Archived Migrations** (in `supabase/migrations/archived/`):
- Phase-specific migrations that were consolidated into bootstrap schema

---

## Notes

- This is a **read-only documentation** - no schema changes were made
- Some tables may have multiple definitions across migrations (additive changes)
- RLS policies are documented but not audited for correctness
- Code references are key files only - not exhaustive
- Some tables may be legacy or unused - marked in summary

---

**Document Status**: ✅ Complete - Updated to reflect bootstrap schema  
**Last Updated**: 2025-01-XX  
**Source Migration**: `supabase/migrations/001_bootstrap_schema.sql`  
**Next Review**: After any schema changes

