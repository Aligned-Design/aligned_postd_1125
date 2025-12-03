-- ============================================================================
-- POSTD Complete Supabase Schema Verification Script
-- Created: 2025-01-16
-- Purpose: Comprehensive verification of all database schema, migrations, and RLS
-- Usage: Paste this entire script into Supabase Dashboard → SQL Editor and run
-- ============================================================================
--
-- This script verifies:
-- 1. Core tables exist with correct columns
-- 2. Persistence schema tables have brand_id_uuid columns
-- 3. RLS is enabled on all tenant-scoped tables
-- 4. RLS policies use brand_id_uuid (not brand_id TEXT or is_brand_member_text)
-- 5. media_assets.status column exists
-- 6. brand_guide_versions table exists
-- 7. Foreign key constraints exist
-- 8. No orphaned brand references
-- 9. Migration 006 status (brand_id TEXT columns)
-- 10. Helper functions status
-- ============================================================================

\echo '============================================================================'
\echo 'POSTD SUPABASE SCHEMA VERIFICATION REPORT'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- SECTION 1: Core Tables Verification
-- ============================================================================

\echo '1. CORE TABLES VERIFICATION'
\echo '----------------------------'

-- Check core tables exist
SELECT 
  'Core Tables' as check_type,
  COUNT(*) as tables_found,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'brands', 'brand_guide_versions', 'content_items',
    'auto_plans', 'scheduled_content', 'media_assets'
  );

-- Check brands table columns
SELECT 
  'brands.brand_kit column' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'brands' AND column_name = 'brand_kit' AND data_type = 'jsonb'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

-- Check brand_guide_versions table
SELECT 
  'brand_guide_versions table' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'brand_guide_versions'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

-- Check auto_plans table columns
SELECT 
  'auto_plans columns' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'auto_plans'
      AND column_name IN ('id', 'brand_id', 'month', 'plan_data', 'confidence')
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

-- Check scheduled_content table columns
SELECT 
  'scheduled_content columns' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'scheduled_content'
      AND column_name IN ('id', 'brand_id', 'content_id', 'scheduled_at', 'platforms')
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

\echo ''

-- ============================================================================
-- SECTION 2: media_assets.status Column Verification
-- ============================================================================

\echo '2. MEDIA_ASSETS.STATUS COLUMN VERIFICATION'
\echo '------------------------------------------'

SELECT 
  'media_assets.status column' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name = 'status' 
      AND data_type = 'text' 
      AND is_nullable = 'NO'
      AND column_default LIKE '%active%'
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM information_schema.columns
WHERE table_name = 'media_assets'
  AND column_name = 'status';

-- Check media_assets INSERT/UPDATE RLS policies
SELECT 
  'media_assets INSERT policy' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'media_assets' AND cmd = 'INSERT'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

SELECT 
  'media_assets UPDATE policy' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'media_assets' AND cmd = 'UPDATE'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

\echo ''

-- ============================================================================
-- SECTION 3: Persistence Schema brand_id_uuid Verification
-- ============================================================================

\echo '3. PERSISTENCE SCHEMA BRAND_ID_UUID VERIFICATION'
\echo '------------------------------------------------'

-- Check all 10 persistence tables have brand_id_uuid columns
SELECT 
  'Persistence tables with brand_id_uuid' as check_type,
  COUNT(*) as tables_found,
  CASE 
    WHEN COUNT(*) = 10 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'strategy_briefs', 'content_packages', 'brand_history',
    'brand_success_patterns', 'collaboration_logs', 'performance_logs',
    'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
  )
  AND column_name = 'brand_id_uuid'
  AND data_type = 'uuid';

-- List which tables have brand_id_uuid
SELECT 
  table_name,
  'brand_id_uuid column exists' as check_type,
  '✅ PASS' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'strategy_briefs', 'content_packages', 'brand_history',
    'brand_success_patterns', 'collaboration_logs', 'performance_logs',
    'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
  )
  AND column_name = 'brand_id_uuid'
ORDER BY table_name;

\echo ''

-- ============================================================================
-- SECTION 4: Foreign Key Constraints Verification
-- ============================================================================

\echo '4. FOREIGN KEY CONSTRAINTS VERIFICATION'
\echo '----------------------------------------'

-- Check FK constraints on persistence tables
SELECT 
  'Persistence tables with FK constraints' as check_type,
  COUNT(DISTINCT conrelid::regclass) as tables_with_fk,
  CASE 
    WHEN COUNT(DISTINCT conrelid::regclass) >= 10 THEN '✅ PASS'
    ELSE '⚠️ WARNING'
  END as status
FROM pg_constraint
WHERE conname LIKE 'fk_%_brand_id_uuid'
  AND contype = 'f';

-- List FK constraints
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as references_table,
  'FK constraint exists' as check_type,
  '✅ PASS' as status
FROM pg_constraint
WHERE conname LIKE 'fk_%_brand_id_uuid'
  AND contype = 'f'
ORDER BY conrelid::regclass;

\echo ''

-- ============================================================================
-- SECTION 5: RLS Status Verification
-- ============================================================================

\echo '5. RLS STATUS VERIFICATION'
\echo '---------------------------'

-- Check RLS is enabled on key tables
SELECT 
  'RLS enabled on core tables' as check_type,
  COUNT(*) as tables_with_rls,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
  AND tablename IN (
    'brands', 'content_items', 'auto_plans',
    'scheduled_content', 'media_assets', 'analytics_metrics'
  );

-- Check RLS on persistence tables
SELECT 
  'RLS enabled on persistence tables' as check_type,
  COUNT(*) as tables_with_rls,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
  AND tablename IN (
    'strategy_briefs', 'content_packages', 'brand_history',
    'brand_success_patterns', 'collaboration_logs', 'performance_logs',
    'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
  );

\echo ''

-- ============================================================================
-- SECTION 6: RLS Policies Use brand_id_uuid (Not brand_id TEXT)
-- ============================================================================

\echo '6. RLS POLICIES USE BRAND_ID_UUID VERIFICATION'
\echo '-----------------------------------------------'

-- Check for policies using is_brand_member_text() (should be 0)
SELECT 
  'Policies using is_brand_member_text()' as check_type,
  COUNT(*) as policies_found,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Run migration 010'
  END as status
FROM pg_policies
WHERE tablename IN (
  'strategy_briefs', 'content_packages', 'brand_history',
  'brand_success_patterns', 'collaboration_logs', 'performance_logs',
  'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
)
AND qual LIKE '%is_brand_member_text%';

-- Check for policies using brand_id TEXT (should be 0)
SELECT 
  'Policies using brand_id TEXT (not UUID)' as check_type,
  COUNT(*) as policies_found,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Run migration 010'
  END as status
FROM pg_policies
WHERE tablename IN (
  'strategy_briefs', 'content_packages', 'brand_history',
  'brand_success_patterns', 'collaboration_logs', 'performance_logs',
  'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
)
AND qual LIKE '%brand_id%'
AND qual NOT LIKE '%brand_id_uuid%';

-- Check policies use brand_id_uuid (should be many)
SELECT 
  'Policies using brand_id_uuid' as check_type,
  COUNT(*) as policies_found,
  CASE 
    WHEN COUNT(*) >= 20 THEN '✅ PASS'
    ELSE '⚠️ WARNING'
  END as status
FROM pg_policies
WHERE tablename IN (
  'strategy_briefs', 'content_packages', 'brand_history',
  'brand_success_patterns', 'collaboration_logs', 'performance_logs',
  'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
)
AND qual LIKE '%brand_id_uuid%';

\echo ''

-- ============================================================================
-- SECTION 7: Migration 006 Status (brand_id TEXT Columns)
-- ============================================================================

\echo '7. MIGRATION 006 STATUS (BRAND_ID TEXT COLUMNS)'
\echo '------------------------------------------------'

-- Check if brand_id TEXT columns still exist (should be 0 if migration 006 applied)
SELECT 
  'brand_id TEXT columns remaining' as check_type,
  COUNT(*) as columns_found,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - Migration 006 applied'
    WHEN COUNT(*) = 10 THEN '⚠️ WARNING - Migration 006 not applied yet'
    ELSE '❌ FAIL - Unexpected state'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'strategy_briefs', 'content_packages', 'brand_history',
    'brand_success_patterns', 'collaboration_logs', 'performance_logs',
    'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
  )
  AND column_name = 'brand_id'
  AND data_type = 'text';

-- List which tables still have brand_id TEXT (if any)
SELECT 
  table_name,
  'brand_id TEXT column exists' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️ Migration 006 not applied'
    ELSE '✅ Migration 006 applied'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'strategy_briefs', 'content_packages', 'brand_history',
    'brand_success_patterns', 'collaboration_logs', 'performance_logs',
    'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
  )
  AND column_name = 'brand_id'
  AND data_type = 'text'
GROUP BY table_name
ORDER BY table_name;

\echo ''

-- ============================================================================
-- SECTION 8: Helper Functions Status
-- ============================================================================

\echo '8. HELPER FUNCTIONS STATUS'
\echo '--------------------------'

-- Check is_brand_member_text() function status
SELECT 
  'is_brand_member_text() function' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_name = 'is_brand_member_text'
    ) THEN 
      CASE 
        WHEN (
          SELECT COUNT(*) FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name IN (
              'strategy_briefs', 'content_packages', 'brand_history',
              'brand_success_patterns', 'collaboration_logs', 'performance_logs',
              'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
            )
            AND column_name = 'brand_id'
            AND data_type = 'text'
        ) > 0 THEN '⚠️ EXISTS - Migration 006 not applied'
        ELSE '❌ EXISTS - Should be dropped (migration 006 applied but function remains)'
      END
    ELSE '✅ DROPPED - Migration 006 applied'
  END as status;

-- Check is_workspace_member() function (should exist)
SELECT 
  'is_workspace_member() function' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_name = 'is_workspace_member'
    ) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

\echo ''

-- ============================================================================
-- SECTION 9: Data Integrity Checks
-- ============================================================================

\echo '9. DATA INTEGRITY VERIFICATION'
\echo '-------------------------------'

-- Check brand_id_uuid columns are populated (if tables have data)
SELECT 
  'brand_id_uuid columns populated' as check_type,
  table_name,
  COUNT(*) as total_rows,
  COUNT(brand_id_uuid) as rows_with_uuid,
  COUNT(*) - COUNT(brand_id_uuid) as rows_missing_uuid,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS (no data)'
    WHEN COUNT(*) - COUNT(brand_id_uuid) = 0 THEN '✅ PASS'
    ELSE '⚠️ WARNING - Some rows missing brand_id_uuid'
  END as status
FROM (
  SELECT 'strategy_briefs' as table_name, brand_id_uuid FROM strategy_briefs
  UNION ALL
  SELECT 'content_packages', brand_id_uuid FROM content_packages
  UNION ALL
  SELECT 'brand_history', brand_id_uuid FROM brand_history
  UNION ALL
  SELECT 'brand_success_patterns', brand_id_uuid FROM brand_success_patterns
  UNION ALL
  SELECT 'collaboration_logs', brand_id_uuid FROM collaboration_logs
  UNION ALL
  SELECT 'performance_logs', brand_id_uuid FROM performance_logs
  UNION ALL
  SELECT 'platform_insights', brand_id_uuid FROM platform_insights
  UNION ALL
  SELECT 'token_health', brand_id_uuid FROM token_health
  UNION ALL
  SELECT 'weekly_summaries', brand_id_uuid FROM weekly_summaries
  UNION ALL
  SELECT 'advisor_review_audits', brand_id_uuid FROM advisor_review_audits
) AS all_tables
GROUP BY table_name
ORDER BY table_name;

-- Check for orphaned brand references
SELECT 
  'Orphaned brand references' as check_type,
  'strategy_briefs' as table_name,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Orphaned references found'
  END as status
FROM strategy_briefs s
LEFT JOIN brands b ON s.brand_id_uuid = b.id
WHERE s.brand_id_uuid IS NOT NULL
  AND b.id IS NULL;

\echo ''

-- ============================================================================
-- SECTION 10: Summary Report
-- ============================================================================

\echo '============================================================================'
\echo 'VERIFICATION SUMMARY'
\echo '============================================================================'
\echo ''
\echo 'To see detailed results, review the output above.'
\echo ''
\echo 'Expected Results:'
\echo '  ✅ All core tables exist'
\echo '  ✅ media_assets.status column exists'
\echo '  ✅ All 10 persistence tables have brand_id_uuid columns'
\echo '  ✅ All persistence tables have FK constraints'
\echo '  ✅ RLS enabled on all tenant-scoped tables'
\echo '  ✅ No policies use is_brand_member_text() or brand_id TEXT'
\echo '  ✅ All policies use brand_id_uuid'
\echo '  ✅ brand_id TEXT columns dropped (if migration 006 applied)'
\echo '  ✅ is_brand_member_text() function dropped (if migration 006 applied)'
\echo '  ✅ No orphaned brand references'
\echo ''
\echo 'If any checks fail:'
\echo '  1. Review the specific check output above'
\echo '  2. Apply missing migrations (001-010)'
\echo '  3. Run migration 010 if RLS policies are incorrect'
\echo '  4. Run migration 006 only after all other migrations are applied'
\echo '============================================================================'

