-- ============================================================================
-- BOOTSTRAP MIGRATION: Complete Schema + Phase 1 RLS Security
-- Created: 2025-01-XX
-- Description: Single authoritative baseline migration for brand-new Supabase project
--              Includes all tables, indexes, constraints, and Phase 1 RLS policies
--              Safe to run on empty Supabase project
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. HELPER FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper: Check if user is brand member (handles TEXT brand_id)
-- Used for persistence schema tables that use brand_id TEXT
CREATE OR REPLACE FUNCTION is_brand_member_text(brand_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  BEGIN
    RETURN EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_id = brand_id_param::uuid
      AND user_id = auth.uid()
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Check if user is workspace member
-- Used for milestones table (workspace_id TEXT)
CREATE OR REPLACE FUNCTION is_workspace_member(workspace_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM brands b
    JOIN brand_members bm ON bm.brand_id = b.id
    WHERE COALESCE(b.workspace_id, b.tenant_id::text) = workspace_id_param
    AND bm.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. CORE IDENTITY & ACCESS
-- ============================================================================

-- Tenants table (workspace/tenant management)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_sign_in_at TIMESTAMP WITH TIME ZONE
);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_digest VARCHAR(20) DEFAULT 'daily' CHECK (email_digest IN ('daily', 'weekly', 'never')),
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(100) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  industry TEXT,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  workspace_id TEXT, -- Backward compatibility alias to tenant_id
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  brand_kit JSONB DEFAULT '{}'::jsonb,
  voice_summary JSONB,
  visual_summary JSONB,
  intake_completed BOOLEAN DEFAULT FALSE,
  intake_completed_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ,
  scraper_status TEXT DEFAULT 'never_run',
  tone_keywords TEXT[],
  compliance_rules TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Members (access control)
CREATE TABLE IF NOT EXISTS brand_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, brand_id)
);

-- ============================================================================
-- Brand Guide Version History Migration
-- Created: 2025-01-20
-- Description: Creates brand_guide_versions table for tracking Brand Guide changes
--              Includes RLS policies for tenant isolation
-- ============================================================================

-- Brand Guide Versions table
CREATE TABLE IF NOT EXISTS brand_guide_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  brand_guide JSONB NOT NULL DEFAULT '{}'::jsonb, -- Snapshot of Brand Guide at this version
  changed_fields TEXT[] NOT NULL DEFAULT '{}', -- Array of changed field paths (e.g., ['identity.name', 'voiceAndTone.tone'])
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- User who made the change
  change_reason TEXT, -- Optional reason for change
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique version per brand
  UNIQUE (brand_id, version)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_brand_guide_versions_brand_id ON brand_guide_versions(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_guide_versions_version ON brand_guide_versions(brand_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_brand_guide_versions_created_at ON brand_guide_versions(brand_id, created_at DESC);

-- ============================================================================
-- 4. CONTENT & STUDIO
-- ============================================================================

-- Content Items
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  platform TEXT,
  media_urls TEXT[],
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft',
  generated_by_agent TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Scheduled Content
CREATE TABLE IF NOT EXISTS scheduled_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  platforms TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (content_id, scheduled_at)
);

-- Publishing Jobs
CREATE TABLE IF NOT EXISTS publishing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  content JSONB NOT NULL,
  platforms TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Publishing Logs
CREATE TABLE IF NOT EXISTS publishing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES publishing_jobs(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  status TEXT NOT NULL,
  platform_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. APPROVALS & WORKFLOWS
-- ============================================================================

-- Post Approvals
CREATE TABLE IF NOT EXISTS post_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  post_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by TEXT,
  rejection_reason TEXT,
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Approval Threads
CREATE TABLE IF NOT EXISTS approval_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workflow Templates
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  steps JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow Instances
CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES workflow_templates(id) ON DELETE SET NULL,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  current_step INTEGER DEFAULT 0,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Escalation Rules
CREATE TABLE IF NOT EXISTS escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  trigger_hours INTEGER NOT NULL,
  escalate_to_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Escalation Events
CREATE TABLE IF NOT EXISTS escalation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  approval_id UUID REFERENCES post_approvals(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES escalation_rules(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================================
-- 6. CLIENT PORTAL & AUDIT
-- ============================================================================

-- Client Settings
CREATE TABLE IF NOT EXISTS client_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  email_preferences JSONB,
  timezone TEXT DEFAULT 'America/New_York',
  language TEXT DEFAULT 'en',
  unsubscribe_token TEXT UNIQUE,
  unsubscribed_from_all BOOLEAN NOT NULL DEFAULT FALSE,
  unsubscribed_types TEXT[],
  can_view_analytics BOOLEAN DEFAULT FALSE,
  can_approve_content BOOLEAN DEFAULT FALSE,
  can_upload_media BOOLEAN DEFAULT FALSE,
  can_view_brand_guide BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_by VARCHAR,
  UNIQUE (client_id, brand_id)
);

-- Client Comments
CREATE TABLE IF NOT EXISTS client_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  attachment_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client Media
CREATE TABLE IF NOT EXISTS client_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'uploading' CHECK (status IN ('uploading', 'ready', 'failed')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  post_id VARCHAR, -- Legacy
  actor_id VARCHAR, -- Legacy
  actor_email VARCHAR, -- Legacy
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  changes JSONB, -- Legacy, renamed to metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  approval_notifications BOOLEAN DEFAULT TRUE,
  job_completion_notifications BOOLEAN DEFAULT TRUE,
  sync_alerts BOOLEAN DEFAULT TRUE,
  weekly_digest BOOLEAN DEFAULT TRUE,
  daily_summary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. INTEGRATIONS & OAUTH
-- ============================================================================

-- Platform Connections
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(brand_id, platform, account_id)
);

-- Platform Sync Logs
CREATE TABLE IF NOT EXISTS platform_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Webhook Events
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  idempotency_key TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webhook Attempts
CREATE TABLE IF NOT EXISTS webhook_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  status TEXT NOT NULL,
  response_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Integration Events
CREATE TABLE IF NOT EXISTS integration_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webhook Logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255),
  event_type VARCHAR(100),
  payload JSONB,
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. ANALYTICS & METRICS
-- ============================================================================

-- Analytics Metrics
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (brand_id, platform, date)
);

-- Analytics Goals
CREATE TABLE IF NOT EXISTS analytics_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  target NUMERIC NOT NULL,
  current NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics Sync Logs
CREATE TABLE IF NOT EXISTS analytics_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Advisor Feedback
CREATE TABLE IF NOT EXISTS advisor_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  insight_id TEXT NOT NULL,
  category TEXT,
  type TEXT,
  feedback TEXT,
  previous_weight NUMERIC,
  new_weight NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto Plans
CREATE TABLE IF NOT EXISTS auto_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  plan_data JSONB NOT NULL,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, month)
);

-- ============================================================================
-- 9. MEDIA & ASSETS
-- ============================================================================

-- Media Assets
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  category TEXT,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  hash TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  used_in TEXT[] DEFAULT ARRAY[]::TEXT[],
  usage_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media Usage Logs
CREATE TABLE IF NOT EXISTS media_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  used_in TEXT NOT NULL,
  used_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brand Assets
CREATE TABLE IF NOT EXISTS brand_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assets (legacy/general)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes BIGINT,
  tags TEXT[],
  uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Storage Quotas
CREATE TABLE IF NOT EXISTS storage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  limit_bytes BIGINT NOT NULL DEFAULT 5368709120, -- 5GB default
  used_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id)
);

-- ============================================================================
-- 10. PERSISTENCE SCHEMA (AI Learning Loop)
-- ============================================================================

-- Strategy Briefs
CREATE TABLE IF NOT EXISTS strategy_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  version TEXT NOT NULL,
  positioning JSONB NOT NULL,
  voice JSONB NOT NULL,
  visual JSONB NOT NULL,
  competitive JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Packages
CREATE TABLE IF NOT EXISTS content_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Brand History
CREATE TABLE IF NOT EXISTS brand_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  agent TEXT NOT NULL,
  action TEXT NOT NULL,
  content_id TEXT,
  details JSONB,
  rationale TEXT,
  performance JSONB,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand Success Patterns
CREATE TABLE IF NOT EXISTS brand_success_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  pattern TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  avg_performance DECIMAL(4,2),
  examples TEXT[] NOT NULL DEFAULT '{}',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration Logs
CREATE TABLE IF NOT EXISTS collaboration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  agent TEXT NOT NULL,
  action TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  content_id TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Logs
CREATE TABLE IF NOT EXISTS performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  content_id TEXT,
  cycle_id TEXT,
  content_type TEXT,
  platform TEXT NOT NULL,
  engagement JSONB NOT NULL,
  reach INTEGER,
  impressions INTEGER,
  click_through_rate DECIMAL(5,2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform Insights
CREATE TABLE IF NOT EXISTS platform_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  top_visual_style TEXT,
  best_posting_time TEXT,
  topic_affinity TEXT[] NOT NULL DEFAULT '{}',
  avg_engagement DECIMAL(4,2),
  sample_size INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, platform)
);

-- Token Health
CREATE TABLE IF NOT EXISTS token_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  token_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'healthy',
  expires_at TIMESTAMP WITH TIME ZONE,
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, platform)
);

-- Weekly Summaries
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_cycles INTEGER DEFAULT 0,
  avg_quality_score DECIMAL(4,2),
  top_performers JSONB,
  success_patterns JSONB,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, week_start)
);

-- Advisor Review Audits
CREATE TABLE IF NOT EXISTS advisor_review_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id TEXT NOT NULL UNIQUE,
  request_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  clarity_score DECIMAL(3,1) NOT NULL,
  alignment_score DECIMAL(3,1) NOT NULL,
  resonance_score DECIMAL(3,1) NOT NULL,
  actionability_score DECIMAL(3,1) NOT NULL,
  platform_fit_score DECIMAL(3,1) NOT NULL,
  average_score DECIMAL(4,2) NOT NULL,
  weighted_score DECIMAL(4,2) NOT NULL,
  severity_level TEXT NOT NULL,
  reflection_question TEXT,
  suggested_actions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 11. MILESTONES
-- ============================================================================

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  key TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, key)
);

-- ============================================================================
-- 12. PAYMENTS & BILLING
-- ============================================================================

-- Payment Attempts
CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References auth.users (no FK to avoid circular dependency)
  attempt_number INT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('failed', 'succeeded', 'pending')),
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_invoice_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  error_code VARCHAR(255),
  error_message TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Archived Data
CREATE TABLE IF NOT EXISTS archived_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_id UUID,
  data_type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delete_after TIMESTAMP WITH TIME ZONE NOT NULL,
  restored BOOLEAN DEFAULT FALSE,
  restored_at TIMESTAMP WITH TIME ZONE
);

-- Payment Notifications
CREATE TABLE IF NOT EXISTS payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References auth.users (no FK to avoid circular dependency)
  notification_type VARCHAR(100) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_subject TEXT,
  email_body TEXT,
  delivered BOOLEAN DEFAULT FALSE,
  opened BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- 13. INDEXES
-- ============================================================================

-- User Profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- User Preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Brands
CREATE INDEX IF NOT EXISTS idx_brands_tenant_id ON brands(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brands_created_by ON brands(created_by);
CREATE INDEX IF NOT EXISTS idx_brands_website_url ON brands(website_url);
CREATE INDEX IF NOT EXISTS idx_brands_scraper_status ON brands(scraper_status);
CREATE INDEX IF NOT EXISTS idx_brands_intake_completed ON brands(intake_completed);
CREATE INDEX IF NOT EXISTS idx_brands_intake_completed_at ON brands(intake_completed_at);
CREATE UNIQUE INDEX IF NOT EXISTS brands_slug_tenant_unique ON brands(tenant_id, slug) WHERE tenant_id IS NOT NULL;

-- Brand Members
CREATE INDEX IF NOT EXISTS idx_brand_members_user_id ON brand_members(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_members_brand_id ON brand_members(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_members_role ON brand_members(role);

-- Content Items
CREATE INDEX IF NOT EXISTS idx_content_items_brand_id ON content_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_created_by ON content_items(created_by);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON content_items(created_at);

-- Scheduled Content
CREATE INDEX IF NOT EXISTS idx_scheduled_content_brand_id ON scheduled_content(brand_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_scheduled_at ON scheduled_content(scheduled_at);

-- Publishing Jobs
CREATE INDEX IF NOT EXISTS idx_publishing_jobs_brand_id ON publishing_jobs(brand_id);
CREATE INDEX IF NOT EXISTS idx_publishing_jobs_status ON publishing_jobs(status);

-- Publishing Logs
CREATE INDEX IF NOT EXISTS idx_publishing_logs_job_id ON publishing_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_publishing_logs_brand_id ON publishing_logs(brand_id);

-- Post Approvals
CREATE INDEX IF NOT EXISTS idx_post_approvals_brand_id ON post_approvals(brand_id);
CREATE INDEX IF NOT EXISTS idx_post_approvals_post_id ON post_approvals(post_id);
CREATE INDEX IF NOT EXISTS idx_post_approvals_status ON post_approvals(status);

-- Approval Threads
CREATE INDEX IF NOT EXISTS idx_approval_threads_content_item_id ON approval_threads(content_item_id);
CREATE INDEX IF NOT EXISTS idx_approval_threads_user_id ON approval_threads(user_id);

-- Workflow Templates
CREATE INDEX IF NOT EXISTS idx_workflow_templates_brand_id ON workflow_templates(brand_id);

-- Workflow Instances
CREATE INDEX IF NOT EXISTS idx_workflow_instances_brand_id ON workflow_instances(brand_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_template_id ON workflow_instances(template_id);

-- Escalation Rules
CREATE INDEX IF NOT EXISTS idx_escalation_rules_brand_id ON escalation_rules(brand_id);

-- Escalation Events
CREATE INDEX IF NOT EXISTS idx_escalation_events_brand_id ON escalation_events(brand_id);
CREATE INDEX IF NOT EXISTS idx_escalation_events_approval_id ON escalation_events(approval_id);

-- Client Settings
CREATE INDEX IF NOT EXISTS idx_client_settings_client_id ON client_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_client_settings_brand_id ON client_settings(brand_id);

-- Client Comments
CREATE INDEX IF NOT EXISTS idx_client_comments_content_id ON client_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_client_comments_client_id ON client_comments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_comments_is_resolved ON client_comments(is_resolved);

-- Client Media
CREATE INDEX IF NOT EXISTS idx_client_media_brand_id ON client_media(brand_id);
CREATE INDEX IF NOT EXISTS idx_client_media_client_id ON client_media(client_id);
CREATE INDEX IF NOT EXISTS idx_client_media_status ON client_media(status);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_brand_id ON audit_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_brand_id ON notifications(brand_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Platform Connections
CREATE INDEX IF NOT EXISTS idx_platform_connections_brand_id ON platform_connections(brand_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_platform ON platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_platform_connections_is_active ON platform_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_platform_connections_updated_at ON platform_connections(updated_at);

-- Platform Sync Logs
CREATE INDEX IF NOT EXISTS idx_platform_sync_logs_brand_id ON platform_sync_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_platform_sync_logs_platform ON platform_sync_logs(platform);

-- Webhook Events
CREATE INDEX IF NOT EXISTS idx_webhook_events_brand_id ON webhook_events(brand_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Webhook Attempts
CREATE INDEX IF NOT EXISTS idx_webhook_attempts_event_id ON webhook_attempts(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_attempts_attempt_number ON webhook_attempts(attempt_number);

-- Integration Events
CREATE INDEX IF NOT EXISTS idx_integration_events_brand_id ON integration_events(brand_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_connection_id ON integration_events(connection_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_event_type ON integration_events(event_type);
CREATE INDEX IF NOT EXISTS idx_integration_events_created_at ON integration_events(created_at);

-- Webhook Logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_brand_id ON webhook_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_platform ON webhook_logs(platform);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Analytics Metrics
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_content_item_id ON analytics_metrics(content_item_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_brand_id ON analytics_metrics(brand_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_platform ON analytics_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_recorded_at ON analytics_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_brand_date ON analytics_metrics(brand_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_brand_platform ON analytics_metrics(brand_id, platform);

-- Analytics Goals
CREATE INDEX IF NOT EXISTS idx_analytics_goals_brand_id ON analytics_goals(brand_id);

-- Analytics Sync Logs
CREATE INDEX IF NOT EXISTS idx_analytics_sync_logs_brand_id ON analytics_sync_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sync_logs_platform ON analytics_sync_logs(platform);

-- Advisor Feedback
CREATE INDEX IF NOT EXISTS idx_advisor_feedback_brand_id ON advisor_feedback(brand_id);

-- Auto Plans
CREATE INDEX IF NOT EXISTS idx_auto_plans_brand_id ON auto_plans(brand_id);

-- Media Assets
CREATE INDEX IF NOT EXISTS idx_media_assets_brand_id ON media_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_tenant_id ON media_assets(tenant_id);

-- Media Usage Logs
CREATE INDEX IF NOT EXISTS idx_media_usage_logs_asset_id ON media_usage_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_media_usage_logs_brand_id ON media_usage_logs(brand_id);

-- Brand Assets
CREATE INDEX IF NOT EXISTS idx_brand_assets_brand_id ON brand_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_asset_type ON brand_assets(asset_type);

-- Assets
CREATE INDEX IF NOT EXISTS idx_assets_brand_id ON assets(brand_id);

-- Storage Quotas
CREATE INDEX IF NOT EXISTS idx_storage_quotas_brand_id ON storage_quotas(brand_id);

-- Persistence Schema Indexes
-- Note: brand_id TEXT columns are dropped in migration 006, so these indexes are conditional
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'strategy_briefs'
      AND column_name  = 'brand_id'
  ) THEN
    BEGIN
      CREATE INDEX idx_strategy_briefs_brand_id
        ON public.strategy_briefs (brand_id);
    EXCEPTION
      WHEN duplicate_table OR duplicate_object THEN
        -- Index already exists; do nothing
        NULL;
    END;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_strategy_briefs_created_at ON strategy_briefs(created_at);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'content_packages'
      AND column_name  = 'brand_id'
  ) THEN
    BEGIN
      CREATE INDEX idx_content_packages_brand_id
        ON public.content_packages (brand_id);
    EXCEPTION
      WHEN duplicate_table OR duplicate_object THEN
        -- Index already exists; do nothing
        NULL;
    END;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_content_packages_status ON content_packages(status);
CREATE INDEX IF NOT EXISTS idx_content_packages_created_at ON content_packages(created_at);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'brand_history'
      AND column_name  = 'brand_id'
  ) THEN
    BEGIN
      CREATE INDEX idx_brand_history_brand_id
        ON public.brand_history (brand_id);
    EXCEPTION
      WHEN duplicate_table OR duplicate_object THEN
        -- Index already exists; do nothing
        NULL;
    END;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_brand_history_timestamp ON brand_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_brand_history_tags ON brand_history USING GIN(tags);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'brand_success_patterns'
      AND column_name  = 'brand_id'
  ) THEN
    BEGIN
      CREATE INDEX idx_brand_success_patterns_brand_id
        ON public.brand_success_patterns (brand_id);
    EXCEPTION
      WHEN duplicate_table OR duplicate_object THEN
        -- Index already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_collaboration_logs_cycle_id ON collaboration_logs(cycle_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_logs_request_id ON collaboration_logs(request_id);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'collaboration_logs'
      AND column_name  = 'brand_id'
  ) THEN
    BEGIN
      CREATE INDEX idx_collaboration_logs_brand_id
        ON public.collaboration_logs (brand_id);
    EXCEPTION
      WHEN duplicate_table OR duplicate_object THEN
        -- Index already exists; do nothing
        NULL;
    END;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_collaboration_logs_agent_action ON collaboration_logs(agent, action);
CREATE INDEX IF NOT EXISTS idx_collaboration_logs_timestamp ON collaboration_logs(timestamp);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'performance_logs'
      AND column_name  = 'brand_id'
  ) THEN
    BEGIN
      CREATE INDEX idx_performance_logs_brand_id
        ON public.performance_logs (brand_id);
    EXCEPTION
      WHEN duplicate_table OR duplicate_object THEN
        -- Index already exists; do nothing
        NULL;
    END;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_performance_logs_platform ON performance_logs(platform);
CREATE INDEX IF NOT EXISTS idx_performance_logs_recorded_at ON performance_logs(recorded_at);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'platform_insights'
      AND column_name  = 'brand_id'
  ) THEN
    BEGIN
      CREATE INDEX idx_platform_insights_brand_id
        ON public.platform_insights (brand_id);
    EXCEPTION
      WHEN duplicate_table OR duplicate_object THEN
        -- Index already exists; do nothing
        NULL;
    END;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_platform_insights_platform ON platform_insights(platform);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'token_health'
      AND column_name  = 'brand_id'
  ) THEN
    BEGIN
      CREATE INDEX idx_token_health_brand_id
        ON public.token_health (brand_id);
    EXCEPTION
      WHEN duplicate_table OR duplicate_object THEN
        -- Index already exists; do nothing
        NULL;
    END;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_token_health_status ON token_health(status);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'weekly_summaries'
      AND column_name  = 'brand_id'
  ) THEN
    BEGIN
      CREATE INDEX idx_weekly_summaries_brand_id
        ON public.weekly_summaries (brand_id);
    EXCEPTION
      WHEN duplicate_table OR duplicate_object THEN
        -- Index already exists; do nothing
        NULL;
    END;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_week_start ON weekly_summaries(week_start);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'advisor_review_audits'
      AND column_name  = 'brand_id'
  ) THEN
    BEGIN
      CREATE INDEX idx_advisor_review_audits_brand_id
        ON public.advisor_review_audits (brand_id);
    EXCEPTION
      WHEN duplicate_table OR duplicate_object THEN
        -- Index already exists; do nothing
        NULL;
    END;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_advisor_review_audits_cycle_id ON advisor_review_audits(cycle_id);
CREATE INDEX IF NOT EXISTS idx_advisor_review_audits_created_at ON advisor_review_audits(created_at);

-- Milestones
CREATE INDEX IF NOT EXISTS idx_milestones_workspace ON milestones(workspace_id);
CREATE INDEX IF NOT EXISTS idx_milestones_key ON milestones(key);
CREATE INDEX IF NOT EXISTS idx_milestones_unlocked_at ON milestones(unlocked_at DESC);

-- Payment Attempts
CREATE INDEX IF NOT EXISTS idx_payment_attempts_user_id ON payment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON payment_attempts(status);

-- Archived Data
CREATE INDEX IF NOT EXISTS idx_archived_data_user_id ON archived_data(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_data_delete_after ON archived_data(delete_after);

-- Payment Notifications
CREATE INDEX IF NOT EXISTS idx_payment_notifications_user_id ON payment_notifications(user_id);

-- ============================================================================
-- 14. TRIGGERS
-- ============================================================================

-- Update triggers for updated_at columns
DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_user_preferences_updated_at
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_brands_updated_at
      BEFORE UPDATE ON brands
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_brand_members_updated_at
      BEFORE UPDATE ON brand_members
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_content_items_updated_at
      BEFORE UPDATE ON content_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_scheduled_content_updated_at
      BEFORE UPDATE ON scheduled_content
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_publishing_jobs_updated_at
      BEFORE UPDATE ON publishing_jobs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_post_approvals_updated_at
      BEFORE UPDATE ON post_approvals
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_workflow_templates_updated_at
      BEFORE UPDATE ON workflow_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_workflow_instances_updated_at
      BEFORE UPDATE ON workflow_instances
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_escalation_rules_updated_at
      BEFORE UPDATE ON escalation_rules
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_client_settings_updated_at
      BEFORE UPDATE ON client_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_client_comments_updated_at
      BEFORE UPDATE ON client_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_platform_connections_updated_at
      BEFORE UPDATE ON platform_connections
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_analytics_goals_updated_at
      BEFORE UPDATE ON analytics_goals
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_auto_plans_updated_at
      BEFORE UPDATE ON auto_plans
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_media_assets_updated_at
      BEFORE UPDATE ON media_assets
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_brand_assets_updated_at
      BEFORE UPDATE ON brand_assets
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_storage_quotas_updated_at
      BEFORE UPDATE ON storage_quotas
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_strategy_briefs_updated_at
      BEFORE UPDATE ON strategy_briefs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_content_packages_updated_at
      BEFORE UPDATE ON content_packages
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_milestones_updated_at
      BEFORE UPDATE ON milestones
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_payment_attempts_updated_at
      BEFORE UPDATE ON payment_attempts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_notification_preferences_updated_at
      BEFORE UPDATE ON notification_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

-- ============================================================================
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- ============================================================================
-- Core Identity & Access
-- ============================================================================

-- Tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can view their tenants"
      ON tenants FOR SELECT
      USING (
        id IN (
          SELECT DISTINCT COALESCE(b.tenant_id, b.workspace_id::uuid)
          FROM brands b
          JOIN brand_members bm ON bm.brand_id = b.id
          WHERE bm.user_id = auth.uid()
          AND COALESCE(b.tenant_id, b.workspace_id::uuid) IS NOT NULL
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can create tenants"
      ON tenants FOR INSERT
      WITH CHECK (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can manage tenants"
      ON tenants FOR UPDATE
      USING (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can delete tenants"
      ON tenants FOR DELETE
      USING (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can read own profile"
      ON user_profiles FOR SELECT
      USING (auth.uid()::text = id::text);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can update own profile"
      ON user_profiles FOR UPDATE
      USING (auth.uid()::text = id::text)
      WITH CHECK (auth.uid()::text = id::text);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- User Preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can read own preferences"
      ON user_preferences FOR SELECT
      USING (auth.uid()::text = user_id::text);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can update own preferences"
      ON user_preferences FOR UPDATE
      USING (auth.uid()::text = user_id::text)
      WITH CHECK (auth.uid()::text = user_id::text);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can insert own preferences"
      ON user_preferences FOR INSERT
      WITH CHECK (auth.uid()::text = user_id::text);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Brands
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view brands"
      ON brands FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = brands.id
          AND brand_members.user_id = auth.uid()
        )
        OR created_by = auth.uid()
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can manage brands"
      ON brands FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = brands.id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin')
        )
        OR created_by = auth.uid()
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Brand Members
ALTER TABLE brand_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can view their brand memberships"
      ON brand_members FOR SELECT
      USING (user_id = auth.uid());
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Admins can manage brand members"
      ON brand_members FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM brand_members bm2
          WHERE bm2.brand_id = brand_members.brand_id
          AND bm2.user_id = auth.uid()
          AND bm2.role IN ('owner', 'admin')
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Brand Guide Versions
ALTER TABLE brand_guide_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view version history for brands they are members of
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can view brand guide versions for their brands"
      ON brand_guide_versions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = brand_guide_versions.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- RLS Policy: Version history cannot be updated
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Version history cannot be updated"
      ON brand_guide_versions
      FOR UPDATE
      USING (false)
      WITH CHECK (false);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- RLS Policy: Users cannot delete version history
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Version history cannot be deleted"
      ON brand_guide_versions
      FOR DELETE
      USING (false);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Add updated_at trigger (for consistency, though updates are blocked)
DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_brand_guide_versions_updated_at
      BEFORE UPDATE ON brand_guide_versions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;

-- Add comment
COMMENT ON TABLE brand_guide_versions IS 'Tracks all versions of Brand Guide for audit trail, rollback, and change tracking';
COMMENT ON COLUMN brand_guide_versions.brand_guide IS 'JSONB snapshot of Brand Guide at this version';
COMMENT ON COLUMN brand_guide_versions.changed_fields IS 'Array of field paths that changed in this version (e.g., ["identity.name", "voiceAndTone.tone"])';
COMMENT ON COLUMN brand_guide_versions.changed_by IS 'User ID who made the change (from auth.users)';
COMMENT ON COLUMN brand_guide_versions.change_reason IS 'Optional reason for change (e.g., "Onboarding sync", "User edit")';

-- ============================================================================
-- Content & Studio
-- ============================================================================

-- Content Items
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view content items"
      ON content_items FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = content_items.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can manage content items"
      ON content_items FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = content_items.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Scheduled Content
ALTER TABLE scheduled_content ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view scheduled content"
      ON scheduled_content FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = scheduled_content.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can manage scheduled content"
      ON scheduled_content FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = scheduled_content.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Publishing Jobs
ALTER TABLE publishing_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view publishing jobs"
      ON publishing_jobs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = publishing_jobs.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Publishing Logs
ALTER TABLE publishing_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view publishing logs"
      ON publishing_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = publishing_logs.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- ============================================================================
-- Approvals & Workflows
-- ============================================================================

-- Post Approvals
ALTER TABLE post_approvals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view post approvals"
      ON post_approvals FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = post_approvals.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can manage post approvals"
      ON post_approvals FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = post_approvals.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Approval Threads
ALTER TABLE approval_threads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view approval threads"
      ON approval_threads FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM content_items ci
          JOIN brand_members bm ON bm.brand_id = ci.brand_id
          WHERE ci.id = approval_threads.content_item_id
          AND bm.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can manage approval threads"
      ON approval_threads FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM content_items ci
          JOIN brand_members bm ON bm.brand_id = ci.brand_id
          WHERE ci.id = approval_threads.content_item_id
          AND bm.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Workflow Templates
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view workflow templates"
      ON workflow_templates FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = workflow_templates.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can manage workflow templates"
      ON workflow_templates FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = workflow_templates.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Workflow Instances
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view workflow instances"
      ON workflow_instances FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = workflow_instances.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can manage workflow instances"
      ON workflow_instances FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = workflow_instances.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Escalation Rules
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand admins can view escalation rules"
      ON escalation_rules FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = escalation_rules.brand_id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin')
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand admins can manage escalation rules"
      ON escalation_rules FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = escalation_rules.brand_id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin')
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Escalation Events
ALTER TABLE escalation_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view escalation events"
      ON escalation_events FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = escalation_events.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- ============================================================================
-- Client Portal & Audit
-- ============================================================================

-- Client Settings
ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Clients can view their settings"
      ON client_settings FOR SELECT
      USING (
        client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = client_settings.brand_id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin')
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Admins can manage client settings"
      ON client_settings FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = client_settings.brand_id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin')
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Client Comments
ALTER TABLE client_comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view client comments"
      ON client_comments FOR SELECT
      USING (
        client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM content_items ci
          JOIN brand_members bm ON bm.brand_id = ci.brand_id
          WHERE ci.id = client_comments.content_id
          AND bm.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Clients and brand members can manage client comments"
      ON client_comments FOR ALL
      USING (
        client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM content_items ci
          JOIN brand_members bm ON bm.brand_id = ci.brand_id
          WHERE ci.id = client_comments.content_id
          AND bm.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Client Media
ALTER TABLE client_media ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Clients and brand members can view client media"
      ON client_media FOR SELECT
      USING (
        client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = client_media.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Clients and brand members can manage client media"
      ON client_media FOR ALL
      USING (
        client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = client_media.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Admins can view audit logs"
      ON audit_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = audit_logs.brand_id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin')
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can view own notifications"
      ON notifications FOR SELECT
      USING (user_id = auth.uid());
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can update notification read status"
      ON notifications FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Notification Preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can view own notification preferences"
      ON notification_preferences FOR SELECT
      USING (user_id = auth.uid());
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can manage own notification preferences"
      ON notification_preferences FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- ============================================================================
-- Integrations & OAuth
-- ============================================================================

-- Platform Connections
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view platform connections"
      ON platform_connections FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = platform_connections.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Admins can manage platform connections"
      ON platform_connections FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = platform_connections.brand_id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin')
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Platform Sync Logs
ALTER TABLE platform_sync_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view platform sync logs"
      ON platform_sync_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = platform_sync_logs.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Webhook Events
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view webhook events"
      ON webhook_events FOR SELECT
      USING (
        brand_id IS NULL
        OR EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = webhook_events.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Webhook Attempts
ALTER TABLE webhook_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view webhook attempts"
      ON webhook_attempts FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM webhook_events we
          LEFT JOIN brand_members bm ON bm.brand_id = we.brand_id AND bm.user_id = auth.uid()
          WHERE we.id = webhook_attempts.event_id
          AND (we.brand_id IS NULL OR bm.user_id IS NOT NULL)
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Integration Events
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view integration events"
      ON integration_events FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = integration_events.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can create integration events"
      ON integration_events FOR INSERT
      WITH CHECK (
        auth.role() = 'service_role'
        OR EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = integration_events.brand_id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin')
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Webhook Logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Admins can view webhook logs"
      ON webhook_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = webhook_logs.brand_id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin')
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can create webhook logs"
      ON webhook_logs FOR INSERT
      WITH CHECK (
        auth.role() = 'service_role'
        OR EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = webhook_logs.brand_id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin')
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- ============================================================================
-- Analytics & Metrics
-- ============================================================================

-- Analytics Metrics
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view analytics metrics"
      ON analytics_metrics FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = analytics_metrics.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Analytics Goals
ALTER TABLE analytics_goals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view analytics goals"
      ON analytics_goals FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = analytics_goals.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can manage analytics goals"
      ON analytics_goals FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = analytics_goals.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Analytics Sync Logs
ALTER TABLE analytics_sync_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view analytics sync logs"
      ON analytics_sync_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = analytics_sync_logs.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Advisor Feedback
ALTER TABLE advisor_feedback ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view advisor feedback"
      ON advisor_feedback FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = advisor_feedback.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can manage advisor feedback"
      ON advisor_feedback FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = advisor_feedback.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Auto Plans
ALTER TABLE auto_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view auto plans"
      ON auto_plans FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = auto_plans.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can manage auto plans"
      ON auto_plans FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = auto_plans.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- ============================================================================
-- Media & Assets
-- ============================================================================

-- Media Assets
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view media assets"
      ON media_assets FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = media_assets.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Media Usage Logs
ALTER TABLE media_usage_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view media usage logs"
      ON media_usage_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = media_usage_logs.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Brand Assets
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view brand assets"
      ON brand_assets FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = brand_assets.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view assets"
      ON assets FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = assets.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Storage Quotas
ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view storage quotas"
      ON storage_quotas FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = storage_quotas.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- ============================================================================
-- Persistence Schema (Phase 1 RLS)
-- ============================================================================

-- Strategy Briefs
ALTER TABLE strategy_briefs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'strategy_briefs'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "Brand members can view strategy briefs"
        ON strategy_briefs FOR SELECT
        USING (
          is_brand_member_text(brand_id)
          OR brand_id IN (
            SELECT id::text FROM brands
            WHERE created_by = auth.uid()
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'strategy_briefs'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "System can insert strategy_briefs"
        ON strategy_briefs FOR INSERT
        WITH CHECK (
          auth.role() = 'service_role'
          OR (
            is_brand_member_text(brand_id)
            AND EXISTS (
              SELECT 1 FROM brand_members
              WHERE brand_id = brand_id::uuid
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin')
            )
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'strategy_briefs'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "Admins can manage strategy_briefs"
        ON strategy_briefs FOR UPDATE
        USING (
          is_brand_member_text(brand_id)
          AND EXISTS (
            SELECT 1 FROM brand_members
            WHERE brand_id = brand_id::uuid
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'strategy_briefs'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "Admins can delete strategy_briefs"
        ON strategy_briefs FOR DELETE
        USING (
          is_brand_member_text(brand_id)
          AND EXISTS (
            SELECT 1 FROM brand_members
            WHERE brand_id = brand_id::uuid
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

-- Content Packages
ALTER TABLE content_packages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'content_packages'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "Brand members can view content packages"
        ON content_packages FOR SELECT
        USING (
          is_brand_member_text(brand_id)
          OR brand_id IN (
            SELECT id::text FROM brands
            WHERE created_by = auth.uid()
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'content_packages'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "System can insert content packages"
        ON content_packages FOR INSERT
        WITH CHECK (
          auth.role() = 'service_role'
          OR (
            is_brand_member_text(brand_id)
            AND EXISTS (
              SELECT 1 FROM brand_members
              WHERE brand_id = brand_id::uuid
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin', 'editor', 'creator')
            )
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'content_packages'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "Brand members can update content packages"
        ON content_packages FOR UPDATE
        USING (is_brand_member_text(brand_id));
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'content_packages'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "Admins can delete content packages"
        ON content_packages FOR DELETE
        USING (
          is_brand_member_text(brand_id)
          AND EXISTS (
            SELECT 1 FROM brand_members
            WHERE brand_id = brand_id::uuid
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

-- Brand History
ALTER TABLE brand_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'brand_history'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "Brand members can view brand history"
        ON brand_history FOR SELECT
        USING (
          is_brand_member_text(brand_id)
          OR brand_id IN (
            SELECT id::text FROM brands
            WHERE created_by = auth.uid()
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'brand_history'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "System can insert brand history"
        ON brand_history FOR INSERT
        WITH CHECK (
          auth.role() = 'service_role'
          OR (
            is_brand_member_text(brand_id)
            AND EXISTS (
              SELECT 1 FROM brand_members
              WHERE brand_id = brand_id::uuid
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin')
            )
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Deny updates to brand_history"
      ON brand_history FOR UPDATE
      USING (false);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Deny deletes to brand_history"
      ON brand_history FOR DELETE
      USING (false);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Brand Success Patterns
ALTER TABLE brand_success_patterns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'brand_success_patterns'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "Brand members can view success patterns"
        ON brand_success_patterns FOR SELECT
        USING (is_brand_member_text(brand_id));
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'brand_success_patterns'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "System can manage success patterns"
        ON brand_success_patterns FOR ALL
        USING (
          auth.role() = 'service_role'
          OR (
            is_brand_member_text(brand_id)
            AND EXISTS (
              SELECT 1 FROM brand_members
              WHERE brand_id = brand_id::uuid
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin')
            )
          )
        )
        WITH CHECK (
          auth.role() = 'service_role'
          OR (
            is_brand_member_text(brand_id)
            AND EXISTS (
              SELECT 1 FROM brand_members
              WHERE brand_id = brand_id::uuid
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin')
            )
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

-- Collaboration Logs
ALTER TABLE collaboration_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'collaboration_logs'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "Brand members can view collaboration logs"
        ON collaboration_logs FOR SELECT
        USING (is_brand_member_text(brand_id));
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can insert collaboration logs"
      ON collaboration_logs FOR INSERT
      WITH CHECK (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Deny updates to collaboration_logs"
      ON collaboration_logs FOR UPDATE
      USING (false);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Deny deletes to collaboration_logs"
      ON collaboration_logs FOR DELETE
      USING (false);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Performance Logs
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'performance_logs'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "Brand members can view performance logs"
        ON performance_logs FOR SELECT
        USING (is_brand_member_text(brand_id));
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can insert performance logs"
      ON performance_logs FOR INSERT
      WITH CHECK (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Deny updates to performance_logs"
      ON performance_logs FOR UPDATE
      USING (false);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Deny deletes to performance_logs"
      ON performance_logs FOR DELETE
      USING (false);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Platform Insights
ALTER TABLE platform_insights ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'platform_insights'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "Brand members can view platform insights"
        ON platform_insights FOR SELECT
        USING (is_brand_member_text(brand_id));
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'platform_insights'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "System can manage platform insights"
        ON platform_insights FOR ALL
        USING (
          auth.role() = 'service_role'
          OR (
            is_brand_member_text(brand_id)
            AND EXISTS (
              SELECT 1 FROM brand_members
              WHERE brand_id = brand_id::uuid
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin')
            )
          )
        )
        WITH CHECK (
          auth.role() = 'service_role'
          OR (
            is_brand_member_text(brand_id)
            AND EXISTS (
              SELECT 1 FROM brand_members
              WHERE brand_id = brand_id::uuid
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin')
            )
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

-- Token Health
ALTER TABLE token_health ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'token_health'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "Brand members can view token health"
        ON token_health FOR SELECT
        USING (is_brand_member_text(brand_id));
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'token_health'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "System/admins can manage token health"
        ON token_health FOR ALL
        USING (
          auth.role() = 'service_role'
          OR (
            is_brand_member_text(brand_id)
            AND EXISTS (
              SELECT 1 FROM brand_members
              WHERE brand_id = brand_id::uuid
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin')
            )
          )
        )
        WITH CHECK (
          auth.role() = 'service_role'
          OR (
            is_brand_member_text(brand_id)
            AND EXISTS (
              SELECT 1 FROM brand_members
              WHERE brand_id = brand_id::uuid
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin')
            )
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

-- Weekly Summaries
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'weekly_summaries'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "Brand members can view weekly summaries"
        ON weekly_summaries FOR SELECT
        USING (is_brand_member_text(brand_id));
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can manage weekly summaries"
      ON weekly_summaries FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Advisor Review Audits
ALTER TABLE advisor_review_audits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'advisor_review_audits'
      AND column_name = 'brand_id'
  ) THEN
    BEGIN
      CREATE POLICY "Brand members can view advisor reviews"
        ON advisor_review_audits FOR SELECT
        USING (is_brand_member_text(brand_id));
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists; do nothing
        NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can insert advisor reviews"
      ON advisor_review_audits FOR INSERT
      WITH CHECK (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Deny updates to advisor_review_audits"
      ON advisor_review_audits FOR UPDATE
      USING (false);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Deny deletes to advisor_review_audits"
      ON advisor_review_audits FOR DELETE
      USING (false);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- ============================================================================
-- Milestones (Phase 1 RLS)
-- ============================================================================

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can view workspace milestones"
      ON milestones FOR SELECT
      USING (
        workspace_id IN (
          SELECT COALESCE(b.workspace_id, b.tenant_id::text)
          FROM brands b
          JOIN brand_members bm ON bm.brand_id = b.id
          WHERE bm.user_id = auth.uid()
          AND COALESCE(b.workspace_id, b.tenant_id::text) IS NOT NULL
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can insert milestones"
      ON milestones FOR INSERT
      WITH CHECK (
        auth.role() = 'service_role'
        OR workspace_id IN (
          SELECT COALESCE(b.workspace_id, b.tenant_id::text)
          FROM brands b
          JOIN brand_members bm ON bm.brand_id = b.id
          WHERE bm.user_id = auth.uid()
          AND bm.role IN ('owner', 'admin')
          AND COALESCE(b.workspace_id, b.tenant_id::text) IS NOT NULL
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can acknowledge workspace milestones"
      ON milestones FOR UPDATE
      USING (
        workspace_id IN (
          SELECT COALESCE(b.workspace_id, b.tenant_id::text)
          FROM brands b
          JOIN brand_members bm ON bm.brand_id = b.id
          WHERE bm.user_id = auth.uid()
          AND COALESCE(b.workspace_id, b.tenant_id::text) IS NOT NULL
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- ============================================================================
-- Payments & Billing (Phase 1 RLS)
-- ============================================================================

-- Payment Attempts
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can view own payment attempts"
      ON payment_attempts FOR SELECT
      USING (user_id = auth.uid());
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can insert payment attempts"
      ON payment_attempts FOR INSERT
      WITH CHECK (
        auth.role() = 'service_role'
        OR user_id = auth.uid()
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can update payment attempts"
      ON payment_attempts FOR UPDATE
      USING (
        auth.role() = 'service_role'
        OR user_id = auth.uid()
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Archived Data
ALTER TABLE archived_data ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can view own archived data"
      ON archived_data FOR SELECT
      USING (user_id = auth.uid());
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view archived data"
      ON archived_data FOR SELECT
      USING (
        brand_id IS NOT NULL
        AND brand_id IN (
          SELECT brand_id FROM brand_members
          WHERE user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can insert archived data"
      ON archived_data FOR INSERT
      WITH CHECK (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can update archived data"
      ON archived_data FOR UPDATE
      USING (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- Payment Notifications
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can view own payment notifications"
      ON payment_notifications FOR SELECT
      USING (user_id = auth.uid());
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can manage payment notifications"
      ON payment_notifications FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;

-- ============================================================================
-- END OF BOOTSTRAP MIGRATION
-- ============================================================================

