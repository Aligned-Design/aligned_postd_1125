-- ============================================================================
-- Migration 011: Add Missing Tables and Columns
-- Created: 2025-01-16
-- Purpose: Add tables/columns/views that code expects but are missing
-- Prerequisites: 
--   - Migration 001 (bootstrap schema)
-- ============================================================================
--
-- This migration adds:
-- 1. approval_requests table (used by approval workflow)
-- 2. advisor_cache table (used by advisor agent caching)
-- 3. user_preferences.brand_id column (allows per-brand preferences)
-- 4. brands.safety_config column (brand safety configuration)
-- 5. tenants_view view (aggregated tenant metrics)
--
-- All changes are idempotent and safe to run multiple times.
-- ============================================================================

-- ============================================================================
-- 1. Create approval_requests table
-- ============================================================================
-- Used by approval workflow (separate from post_approvals status tracking)
-- Code locations: server/routes/approvals-v2.ts, server/lib/approvals-db-service.ts

CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, brand_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_approval_requests_brand_id ON approval_requests(brand_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_assigned_to ON approval_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_approval_requests_post_id ON approval_requests(post_id);

-- Enable RLS
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view approval requests"
      ON approval_requests FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = approval_requests.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Brand members can create approval requests"
      ON approval_requests FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = approval_requests.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    CREATE POLICY "Brand members can update approval requests"
      ON approval_requests FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = approval_requests.brand_id
          AND brand_members.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = approval_requests.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

COMMENT ON TABLE approval_requests IS 'Approval request workflow - separate from post_approvals status tracking';

-- ============================================================================
-- 2. Create advisor_cache table
-- ============================================================================
-- Used to cache advisor agent responses to avoid redundant API calls
-- Code locations: server/routes/agents.ts, server/workers/generation-pipeline.ts

CREATE TABLE IF NOT EXISTS advisor_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  output JSONB NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand_id)  -- One cache entry per brand
);

-- Indexes for cache lookups
CREATE INDEX IF NOT EXISTS idx_advisor_cache_brand_id ON advisor_cache(brand_id);
CREATE INDEX IF NOT EXISTS idx_advisor_cache_valid_until ON advisor_cache(valid_until);

-- Enable RLS
ALTER TABLE advisor_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view advisor cache"
      ON advisor_cache FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = advisor_cache.brand_id
          AND brand_members.user_id = auth.uid()
        )
      );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  
  -- Service role can manage cache (insert/update/delete)
  -- Service role bypasses RLS by default in Supabase
END $$;

COMMENT ON TABLE advisor_cache IS 'Cache for advisor agent responses to avoid redundant API calls';

-- ============================================================================
-- 3. Add brand_id column to user_preferences
-- ============================================================================
-- Allows per-brand user preferences (NULL = global preferences)
-- Code location: server/lib/preferences-db-service.ts

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- Drop old unique constraint if it exists (user_id was unique)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_preferences_user_id_key'
  ) THEN
    ALTER TABLE user_preferences DROP CONSTRAINT user_preferences_user_id_key;
  END IF;
END $$;

-- Create new unique constraint: one row per user per brand (or global if brand_id is NULL)
CREATE UNIQUE INDEX IF NOT EXISTS user_preferences_user_brand_unique
ON user_preferences(user_id, COALESCE(brand_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Index for brand_id lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_brand_id ON user_preferences(brand_id);

COMMENT ON COLUMN user_preferences.brand_id IS 'Allows per-brand user preferences (NULL = global preferences)';

-- ============================================================================
-- 4. Add safety_config column to brands
-- ============================================================================
-- Brand safety configuration for AI content generation
-- Code location: server/routes/agents.ts (queries brands.safety_config JSONB column - correct)

ALTER TABLE brands
ADD COLUMN IF NOT EXISTS safety_config JSONB DEFAULT '{
  "safety_mode": "safe",
  "banned_phrases": [],
  "competitor_names": [],
  "claims": [],
  "required_disclaimers": [],
  "required_hashtags": [],
  "brand_links": [],
  "disallowed_topics": ["politics", "religion", "medical advice"],
  "allow_topics": [],
  "compliance_pack": "none",
  "platform_limits_override": {}
}'::jsonb;

COMMENT ON COLUMN brands.safety_config IS 'Brand safety configuration for AI content generation';

-- ============================================================================
-- 5. Create tenants_view view
-- ============================================================================
-- Aggregated tenant summary with computed metrics
-- Code location: server/routes/admin.ts

CREATE OR REPLACE VIEW tenants_view AS
SELECT 
  t.id,
  t.name,
  t.plan,
  'active' as status,  -- Default status (tenants table doesn't have status column)
  COUNT(DISTINCT b.id) as brand_count,
  COUNT(DISTINCT bm.user_id) as user_count,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.status = 'published') as posts_published,
  COALESCE(SUM(ma.size_bytes), 0) as storage_used,
  0 as api_quota_used,  -- TODO: Implement API quota tracking
  1000000 as api_quota_limit,  -- TODO: Make this configurable per plan
  t.created_at,
  t.updated_at
FROM tenants t
LEFT JOIN brands b ON b.tenant_id = t.id
LEFT JOIN brand_members bm ON bm.brand_id = b.id
LEFT JOIN content_items ci ON ci.brand_id = b.id AND ci.status = 'published'
LEFT JOIN media_assets ma ON ma.brand_id = b.id
GROUP BY t.id, t.name, t.plan, t.created_at, t.updated_at;

COMMENT ON VIEW tenants_view IS 'Aggregated tenant summary with computed metrics';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- All missing tables, columns, and views have been added.
-- RLS policies are enabled and configured for brand-scoped access.
-- Next steps:
-- 1. ✅ Code correctly queries brands.safety_config and brands.brand_kit JSONB columns
-- 2. Fix column name mismatches (approvals, integrations, analytics)
-- 3. Run verification queries to confirm alignment
-- ============================================================================

