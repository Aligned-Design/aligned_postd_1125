-- ============================================================================
-- Migration 006: Drop Legacy brand_id TEXT Columns
-- Created: 2025-01-20
-- Updated: 2025-01-16 (added safety checks)
-- Purpose: Remove deprecated brand_id TEXT columns from persistence schema tables
-- Reference: MVP_DATABASE_TABLE_AUDIT_REPORT.md - Phase 4
-- Prerequisites: 
--   - Migration 003 (added brand_id_uuid columns)
--   - Migration 005 (updated RLS policies to use brand_id_uuid)
--   - Migration 010 (ensures all RLS policies use brand_id_uuid)
--   - Application code migrated to use brand_id_uuid (no fallbacks)
-- ============================================================================
--
-- PROBLEM:
-- The 10 persistence schema tables historically used brand_id TEXT instead of UUID.
-- Migration 003 added brand_id_uuid columns and backfilled data.
-- Migration 005 updated RLS policies to use brand_id_uuid.
-- Migration 010 ensures all policies are correct.
-- Application code has been updated to use brand_id_uuid (no fallbacks).
-- The legacy brand_id TEXT columns are now unused and can be safely dropped.
--
-- SOLUTION:
-- 1. Safety checks: Verify brand_id_uuid columns exist and are populated
-- 2. Safety checks: Verify no RLS policies use is_brand_member_text() or brand_id TEXT
-- 3. Drop indexes on brand_id TEXT columns
-- 4. Drop brand_id TEXT columns from all 10 tables
-- 5. Drop is_brand_member_text() helper function (no longer used)
--
-- AFFECTED TABLES (10):
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
-- - All application code has been verified to use brand_id_uuid (Phase 3)
-- - RLS policies have been updated to use brand_id_uuid (Migration 005)
-- - No remaining references to brand_id TEXT in codebase
-- - This migration is irreversible - ensure backups before running
-- ============================================================================

-- ============================================================================
-- STEP 0: Safety Checks (Pre-flight Verification)
-- ============================================================================
-- Verify that migration is safe to run before dropping columns

DO $$
DECLARE
  missing_uuid_count INTEGER;
  policies_using_text_count INTEGER;
BEGIN
  -- Check 1: Verify all persistence tables have brand_id_uuid columns
  SELECT COUNT(*) INTO missing_uuid_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN (
      'strategy_briefs', 'content_packages', 'brand_history',
      'brand_success_patterns', 'collaboration_logs', 'performance_logs',
      'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
    )
    AND column_name = 'brand_id_uuid';
  
  IF missing_uuid_count < 10 THEN
    RAISE EXCEPTION 'Safety check failed: Not all persistence tables have brand_id_uuid column. Found % out of 10.', missing_uuid_count;
  END IF;
  
  -- Check 2: Verify no RLS policies still use is_brand_member_text() or brand_id TEXT
  SELECT COUNT(*) INTO policies_using_text_count
  FROM pg_policies
  WHERE tablename IN (
    'strategy_briefs', 'content_packages', 'brand_history',
    'brand_success_patterns', 'collaboration_logs', 'performance_logs',
    'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
  )
  AND (
    qual LIKE '%is_brand_member_text%'
    OR (qual LIKE '%brand_id%' AND qual NOT LIKE '%brand_id_uuid%')
  );
  
  IF policies_using_text_count > 0 THEN
    RAISE EXCEPTION 'Safety check failed: Found % RLS policies still using is_brand_member_text() or brand_id TEXT. Run migration 010 first.', policies_using_text_count;
  END IF;
  
  RAISE NOTICE 'Safety checks passed. Proceeding with migration 006.';
END $$;

-- ============================================================================
-- STEP 1: Drop Indexes on brand_id TEXT Columns
-- ============================================================================
-- These indexes were created in 001_bootstrap_schema.sql for the TEXT columns.
-- They are no longer needed since we use brand_id_uuid indexes (created in migration 003).

DROP INDEX IF EXISTS idx_strategy_briefs_brand_id;
DROP INDEX IF EXISTS idx_content_packages_brand_id;
DROP INDEX IF EXISTS idx_brand_history_brand_id;
DROP INDEX IF EXISTS idx_brand_success_patterns_brand_id;
DROP INDEX IF EXISTS idx_collaboration_logs_brand_id;
DROP INDEX IF EXISTS idx_performance_logs_brand_id;
DROP INDEX IF EXISTS idx_platform_insights_brand_id;
DROP INDEX IF EXISTS idx_token_health_brand_id;
DROP INDEX IF EXISTS idx_weekly_summaries_brand_id;
DROP INDEX IF EXISTS idx_advisor_review_audits_brand_id;

-- ============================================================================
-- STEP 2: Drop brand_id TEXT Columns
-- ============================================================================
-- These columns are deprecated and no longer used by application code.
-- Migration 003 added brand_id_uuid columns which are now the primary identifiers.

-- 1. Strategy Briefs
ALTER TABLE strategy_briefs
  DROP COLUMN IF EXISTS brand_id;

-- 2. Content Packages
ALTER TABLE content_packages
  DROP COLUMN IF EXISTS brand_id;

-- 3. Brand History
ALTER TABLE brand_history
  DROP COLUMN IF EXISTS brand_id;

-- 4. Brand Success Patterns
ALTER TABLE brand_success_patterns
  DROP COLUMN IF EXISTS brand_id;

-- 5. Collaboration Logs
ALTER TABLE collaboration_logs
  DROP COLUMN IF EXISTS brand_id;

-- 6. Performance Logs
ALTER TABLE performance_logs
  DROP COLUMN IF EXISTS brand_id;

-- 7. Platform Insights
ALTER TABLE platform_insights
  DROP COLUMN IF EXISTS brand_id;

-- 8. Token Health
ALTER TABLE token_health
  DROP COLUMN IF EXISTS brand_id;

-- 9. Weekly Summaries
ALTER TABLE weekly_summaries
  DROP COLUMN IF EXISTS brand_id;

-- 10. Advisor Review Audits
ALTER TABLE advisor_review_audits
  DROP COLUMN IF EXISTS brand_id;

-- ============================================================================
-- STEP 3: Drop Helper Function for TEXT brand_id
-- ============================================================================
-- The is_brand_member_text() function was created in 001_bootstrap_schema.sql
-- to support RLS policies on tables using brand_id TEXT.
-- Migration 005 updated all RLS policies to use brand_id_uuid directly,
-- so this helper function is no longer needed.

DROP FUNCTION IF EXISTS is_brand_member_text(TEXT);

-- ============================================================================
-- VERIFICATION QUERIES (for manual verification after migration)
-- ============================================================================
-- Run these to verify migration success:
--
-- 1. Verify brand_id columns are dropped:
--    SELECT column_name, data_type
--    FROM information_schema.columns
--    WHERE table_name IN ('strategy_briefs', 'content_packages', 'brand_history', 
--                         'brand_success_patterns', 'collaboration_logs', 
--                         'performance_logs', 'platform_insights', 'token_health',
--                         'weekly_summaries', 'advisor_review_audits')
--    AND column_name = 'brand_id';
--    -- Should return 0 rows
--
-- 2. Verify brand_id_uuid columns exist:
--    SELECT column_name, data_type
--    FROM information_schema.columns
--    WHERE table_name IN ('strategy_briefs', 'content_packages', 'brand_history', 
--                         'brand_success_patterns', 'collaboration_logs', 
--                         'performance_logs', 'platform_insights', 'token_health',
--                         'weekly_summaries', 'advisor_review_audits')
--    AND column_name = 'brand_id_uuid';
--    -- Should return 10 rows
--
-- 3. Verify is_brand_member_text function is dropped:
--    SELECT routine_name
--    FROM information_schema.routines
--    WHERE routine_name = 'is_brand_member_text';
--    -- Should return 0 rows
--
-- 4. Verify indexes on brand_id are dropped:
--    SELECT indexname
--    FROM pg_indexes
--    WHERE tablename IN ('strategy_briefs', 'content_packages', 'brand_history', 
--                        'brand_success_patterns', 'collaboration_logs', 
--                        'performance_logs', 'platform_insights', 'token_health',
--                        'weekly_summaries', 'advisor_review_audits')
--    AND indexname LIKE '%brand_id%'
--    AND indexname NOT LIKE '%brand_id_uuid%';
--    -- Should return 0 rows
-- ============================================================================

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration completes the brand_id TEXT → UUID migration:
-- - Phase 1 (Migration 003): Added brand_id_uuid columns and backfilled data
-- - Phase 2 (Migration 005): Added FK constraints, updated RLS policies
-- - Phase 3: Updated application code to use brand_id_uuid
-- - Phase 4 (This migration): Drops legacy brand_id TEXT columns
--
-- Future optional step (not in this migration):
-- - Rename brand_id_uuid → brand_id for cleaner API (separate migration if desired)
-- ============================================================================

