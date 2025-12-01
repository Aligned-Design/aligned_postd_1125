-- ============================================================================
-- Migration 003: Fix brand_id Type Inconsistency (Step 1 of 2)
-- Created: 2025-01-20
-- Purpose: Add UUID columns to persistence schema tables that currently use brand_id TEXT
-- Reference: MVP_DATABASE_TABLE_AUDIT_REPORT.md - Section 5.1 Critical for Launch
-- ============================================================================
--
-- PROBLEM:
-- The persistence schema tables (AI learning loop) use brand_id TEXT instead of brand_id UUID,
-- which prevents foreign key constraints and requires custom RLS helper functions.
--
-- SOLUTION:
-- Step 1 (this migration): Add brand_id_uuid columns and backfill from existing TEXT values
-- Step 2 (future): Add foreign keys, update RLS policies, deprecate TEXT columns
--
-- AFFECTED TABLES:
-- - strategy_briefs
-- - content_packages
-- - brand_history
-- - brand_success_patterns
-- - collaboration_logs
-- - performance_logs
-- - platform_insights
-- - token_health
-- - weekly_summaries
-- - advisor_review_audits
--
-- SAFETY:
-- - All changes are additive (new columns, no data loss)
-- - Existing brand_id TEXT columns remain for backward compatibility
-- - RLS policies continue to work via is_brand_member_text() helper
-- ============================================================================

-- ============================================================================
-- 1. STRATEGY_BRIEFS
-- ============================================================================

-- Add UUID column
ALTER TABLE strategy_briefs
ADD COLUMN IF NOT EXISTS brand_id_uuid UUID;

-- Backfill from TEXT brand_id (assumes TEXT stores UUID as string)
-- Only update if brand_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'strategy_briefs'
      AND column_name = 'brand_id'
  ) THEN
    UPDATE strategy_briefs
    SET brand_id_uuid = brand_id::uuid
    WHERE brand_id_uuid IS NULL
      AND brand_id IS NOT NULL
      AND brand_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_strategy_briefs_brand_id_uuid ON strategy_briefs(brand_id_uuid);

-- ============================================================================
-- 2. CONTENT_PACKAGES
-- ============================================================================

ALTER TABLE content_packages
ADD COLUMN IF NOT EXISTS brand_id_uuid UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'content_packages'
      AND column_name = 'brand_id'
  ) THEN
    UPDATE content_packages
    SET brand_id_uuid = brand_id::uuid
    WHERE brand_id_uuid IS NULL
      AND brand_id IS NOT NULL
      AND brand_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_content_packages_brand_id_uuid ON content_packages(brand_id_uuid);

-- ============================================================================
-- 3. BRAND_HISTORY
-- ============================================================================

ALTER TABLE brand_history
ADD COLUMN IF NOT EXISTS brand_id_uuid UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'brand_history'
      AND column_name = 'brand_id'
  ) THEN
    UPDATE brand_history
    SET brand_id_uuid = brand_id::uuid
    WHERE brand_id_uuid IS NULL
      AND brand_id IS NOT NULL
      AND brand_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_brand_history_brand_id_uuid ON brand_history(brand_id_uuid);

-- ============================================================================
-- 4. BRAND_SUCCESS_PATTERNS
-- ============================================================================

ALTER TABLE brand_success_patterns
ADD COLUMN IF NOT EXISTS brand_id_uuid UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'brand_success_patterns'
      AND column_name = 'brand_id'
  ) THEN
    UPDATE brand_success_patterns
    SET brand_id_uuid = brand_id::uuid
    WHERE brand_id_uuid IS NULL
      AND brand_id IS NOT NULL
      AND brand_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_brand_success_patterns_brand_id_uuid ON brand_success_patterns(brand_id_uuid);

-- ============================================================================
-- 5. COLLABORATION_LOGS
-- ============================================================================

ALTER TABLE collaboration_logs
ADD COLUMN IF NOT EXISTS brand_id_uuid UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'collaboration_logs'
      AND column_name = 'brand_id'
  ) THEN
    UPDATE collaboration_logs
    SET brand_id_uuid = brand_id::uuid
    WHERE brand_id_uuid IS NULL
      AND brand_id IS NOT NULL
      AND brand_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_collaboration_logs_brand_id_uuid ON collaboration_logs(brand_id_uuid);

-- ============================================================================
-- 6. PERFORMANCE_LOGS
-- ============================================================================

ALTER TABLE performance_logs
ADD COLUMN IF NOT EXISTS brand_id_uuid UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'performance_logs'
      AND column_name = 'brand_id'
  ) THEN
    UPDATE performance_logs
    SET brand_id_uuid = brand_id::uuid
    WHERE brand_id_uuid IS NULL
      AND brand_id IS NOT NULL
      AND brand_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_performance_logs_brand_id_uuid ON performance_logs(brand_id_uuid);

-- ============================================================================
-- 7. PLATFORM_INSIGHTS
-- ============================================================================

ALTER TABLE platform_insights
ADD COLUMN IF NOT EXISTS brand_id_uuid UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'platform_insights'
      AND column_name = 'brand_id'
  ) THEN
    UPDATE platform_insights
    SET brand_id_uuid = brand_id::uuid
    WHERE brand_id_uuid IS NULL
      AND brand_id IS NOT NULL
      AND brand_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_platform_insights_brand_id_uuid ON platform_insights(brand_id_uuid);

-- ============================================================================
-- 8. TOKEN_HEALTH
-- ============================================================================

ALTER TABLE token_health
ADD COLUMN IF NOT EXISTS brand_id_uuid UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'token_health'
      AND column_name = 'brand_id'
  ) THEN
    UPDATE token_health
    SET brand_id_uuid = brand_id::uuid
    WHERE brand_id_uuid IS NULL
      AND brand_id IS NOT NULL
      AND brand_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_token_health_brand_id_uuid ON token_health(brand_id_uuid);

-- ============================================================================
-- 9. WEEKLY_SUMMARIES
-- ============================================================================

ALTER TABLE weekly_summaries
ADD COLUMN IF NOT EXISTS brand_id_uuid UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'weekly_summaries'
      AND column_name = 'brand_id'
  ) THEN
    UPDATE weekly_summaries
    SET brand_id_uuid = brand_id::uuid
    WHERE brand_id_uuid IS NULL
      AND brand_id IS NOT NULL
      AND brand_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_weekly_summaries_brand_id_uuid ON weekly_summaries(brand_id_uuid);

-- ============================================================================
-- 10. ADVISOR_REVIEW_AUDITS
-- ============================================================================

ALTER TABLE advisor_review_audits
ADD COLUMN IF NOT EXISTS brand_id_uuid UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'advisor_review_audits'
      AND column_name = 'brand_id'
  ) THEN
    UPDATE advisor_review_audits
    SET brand_id_uuid = brand_id::uuid
    WHERE brand_id_uuid IS NULL
      AND brand_id IS NOT NULL
      AND brand_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_advisor_review_audits_brand_id_uuid ON advisor_review_audits(brand_id_uuid);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN strategy_briefs.brand_id_uuid IS 'UUID version of brand_id (Step 1 of migration from TEXT to UUID)';
COMMENT ON COLUMN content_packages.brand_id_uuid IS 'UUID version of brand_id (Step 1 of migration from TEXT to UUID)';
COMMENT ON COLUMN brand_history.brand_id_uuid IS 'UUID version of brand_id (Step 1 of migration from TEXT to UUID)';
COMMENT ON COLUMN brand_success_patterns.brand_id_uuid IS 'UUID version of brand_id (Step 1 of migration from TEXT to UUID)';
COMMENT ON COLUMN collaboration_logs.brand_id_uuid IS 'UUID version of brand_id (Step 1 of migration from TEXT to UUID)';
COMMENT ON COLUMN performance_logs.brand_id_uuid IS 'UUID version of brand_id (Step 1 of migration from TEXT to UUID)';
COMMENT ON COLUMN platform_insights.brand_id_uuid IS 'UUID version of brand_id (Step 1 of migration from TEXT to UUID)';
COMMENT ON COLUMN token_health.brand_id_uuid IS 'UUID version of brand_id (Step 1 of migration from TEXT to UUID)';
COMMENT ON COLUMN weekly_summaries.brand_id_uuid IS 'UUID version of brand_id (Step 1 of migration from TEXT to UUID)';
COMMENT ON COLUMN advisor_review_audits.brand_id_uuid IS 'UUID version of brand_id (Step 1 of migration from TEXT to UUID)';

-- ============================================================================
-- TODO: Step 2 (Future Migration)
-- ============================================================================
-- After verifying all brand_id_uuid columns are populated:
-- 1. Add foreign key constraints: brand_id_uuid REFERENCES brands(id)
-- 2. Update RLS policies to use brand_id_uuid instead of is_brand_member_text()
-- 3. Update application code to use brand_id_uuid
-- 4. Mark brand_id TEXT columns as deprecated
-- 5. Eventually drop brand_id TEXT columns (after full migration)
-- ============================================================================

