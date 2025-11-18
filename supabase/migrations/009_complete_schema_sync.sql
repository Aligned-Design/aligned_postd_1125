-- ============================================================================
-- MIGRATION 009: Complete Schema Sync
-- Created: 2025-11-10
-- Description: Comprehensive schema documentation and sync of all tables
-- ============================================================================

-- IMPORTANT: This migration documents the complete current state of the database
-- All tables are created with IF NOT EXISTS to ensure idempotency
-- This is a schema synchronization migration - it should be safe to run multiple times

-- ============================================================================
-- BRANDS TABLE (with intake fields already present)
-- ============================================================================

-- Verify brands table has all required columns
-- NOTE: slug uniqueness is handled by composite index (tenant_id, slug) in migration 013
-- Do NOT add UNIQUE constraint here as it conflicts with tenant-scoped uniqueness
ALTER TABLE brands ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tone_keywords TEXT[];
ALTER TABLE brands ADD COLUMN IF NOT EXISTS compliance_rules TEXT;

-- Indexes for brands
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_created_at ON brands(created_at);
CREATE INDEX IF NOT EXISTS idx_brands_updated_at ON brands(updated_at);

-- ============================================================================
-- CONTENT ITEMS TABLE (primary content storage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  platform TEXT,
  body TEXT,
  media_urls TEXT[],
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft',
  generated_by_agent TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for content_items
CREATE INDEX IF NOT EXISTS idx_content_items_brand_id ON content_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_created_by ON content_items(created_by);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON content_items(created_at);

-- ============================================================================
-- POST APPROVALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS post_approvals (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  brand_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by TEXT,
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for post_approvals
CREATE INDEX IF NOT EXISTS idx_post_approvals_brand_id ON post_approvals(brand_id);
CREATE INDEX IF NOT EXISTS idx_post_approvals_post_id ON post_approvals(post_id);
CREATE INDEX IF NOT EXISTS idx_post_approvals_status ON post_approvals(status);

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_metrics_content_item_id ON analytics_metrics(content_item_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_platform ON analytics_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_recorded_at ON analytics_metrics(recorded_at);

-- ============================================================================
-- APPROVAL & COLLABORATION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS approval_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_threads_content_item_id ON approval_threads(content_item_id);
CREATE INDEX IF NOT EXISTS idx_approval_threads_user_id ON approval_threads(user_id);

-- ============================================================================
-- ASSET TABLES
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_assets_brand_id ON assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_brand_id ON brand_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_asset_type ON brand_assets(asset_type);

-- ============================================================================
-- BRAND MEMBERS (access control)
-- ============================================================================

CREATE TABLE IF NOT EXISTS brand_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(brand_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_brand_members_brand_id ON brand_members(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_members_user_id ON brand_members(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_members_role ON brand_members(role);

-- ============================================================================
-- CLIENT SETTINGS (client-facing configuration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id CHARACTER VARYING NOT NULL,
  brand_id CHARACTER VARYING NOT NULL,
  email_preferences JSONB NOT NULL,
  timezone CHARACTER VARYING NOT NULL DEFAULT 'America/New_York',
  language CHARACTER VARYING NOT NULL DEFAULT 'en',
  unsubscribe_token CHARACTER VARYING UNIQUE,
  unsubscribed_from_all BOOLEAN NOT NULL DEFAULT FALSE,
  unsubscribed_types TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_modified_by CHARACTER VARYING,
  UNIQUE(client_id, brand_id)
);

CREATE INDEX IF NOT EXISTS idx_client_settings_client_id ON client_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_client_settings_brand_id ON client_settings(brand_id);

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id CHARACTER VARYING NOT NULL,
  post_id CHARACTER VARYING NOT NULL,
  actor_id CHARACTER VARYING NOT NULL,
  actor_email CHARACTER VARYING NOT NULL,
  action CHARACTER VARYING NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address CHARACTER VARYING,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_brand_id ON audit_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- Summary
-- ============================================================================

-- All tables are now synced to match the Supabase schema as of 2025-11-10
-- Brand intake fields present:
--   - brand_kit (JSONB)
--   - voice_summary (JSONB)
--   - visual_summary (JSONB)
--   - intake_completed (BOOLEAN)
--   - intake_completed_at (TIMESTAMP WITH TIME ZONE)
--
-- Complete schema includes:
--   - User authentication & preferences
--   - Brand management with intake workflow
--   - Content creation & publishing
--   - Analytics & metrics tracking
--   - Approvals & collaboration
--   - Asset management
--   - Client portal settings
--   - Audit logging
