-- ============================================================================
-- Bootstrap Migration Verification
-- ============================================================================
-- Purpose: Verify schema + RLS after applying 001_bootstrap_schema.sql
-- Usage: Run this inside the Supabase SQL editor after applying the bootstrap migration
-- Safe: Read-only queries (no data modification)
-- ============================================================================

-- ============================================================================
-- 1. SCHEMA & RLS CHECK FOR KEY TABLES
-- ============================================================================

-- Check that all Phase 1 critical tables exist and have RLS enabled
SELECT 
  t.table_name,
  CASE 
    WHEN pt.rowsecurity = true THEN '✅ RLS Enabled'
    ELSE '❌ RLS NOT Enabled'
  END as rls_status
FROM information_schema.tables t
LEFT JOIN pg_tables pt ON pt.tablename = t.table_name AND pt.schemaname = 'public'
WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'milestones',
    'strategy_briefs',
    'content_packages',
    'brand_history',
    'payment_attempts',
    'archived_data',
    'tenants',
    'brand_success_patterns',
    'collaboration_logs',
    'performance_logs',
    'platform_insights',
    'token_health',
    'weekly_summaries',
    'advisor_review_audits'
  )
ORDER BY t.table_name;

-- ============================================================================
-- 2. POLICY COUNT CHECK
-- ============================================================================

-- Count policies per critical/medium table
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ No policies'
    WHEN COUNT(*) < 2 THEN '⚠️  Limited policies'
    ELSE '✅ Policies present'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'milestones',
    'strategy_briefs',
    'content_packages',
    'brand_history',
    'payment_attempts',
    'archived_data',
    'tenants',
    'brand_success_patterns',
    'collaboration_logs',
    'performance_logs',
    'platform_insights',
    'token_health',
    'weekly_summaries',
    'advisor_review_audits'
  )
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ============================================================================
-- 3. DETAILED POLICY LISTING
-- ============================================================================

-- List all policies for Phase 1 tables
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'milestones',
    'strategy_briefs',
    'content_packages',
    'brand_history',
    'payment_attempts',
    'archived_data',
    'tenants',
    'brand_success_patterns',
    'collaboration_logs',
    'performance_logs',
    'platform_insights',
    'token_health',
    'weekly_summaries',
    'advisor_review_audits'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- 4. HELPER FUNCTIONS CHECK
-- ============================================================================

-- Verify helper functions exist
SELECT 
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name IN ('update_updated_at', 'is_brand_member_text', 'is_workspace_member') 
    THEN '✅ Required function'
    ELSE '⚠️  Additional function'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_updated_at', 'is_brand_member_text', 'is_workspace_member')
ORDER BY routine_name;

-- ============================================================================
-- 5. TRIGGERS CHECK
-- ============================================================================

-- Verify updated_at triggers exist
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE 
    WHEN tgname LIKE '%updated_at%' THEN '✅ updated_at trigger'
    ELSE '⚠️  Other trigger'
  END as status
FROM pg_trigger
WHERE tgisinternal = false
  AND tgrelid::regclass::text IN (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  )
ORDER BY tgrelid::regclass, tgname;

-- ============================================================================
-- 6. IMMUTABLE LOG TABLES - VERIFY DENY POLICIES
-- ============================================================================

-- Check that immutable log tables have explicit deny policies for UPDATE/DELETE
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd IN ('UPDATE', 'DELETE') AND qual LIKE '%false%' THEN '✅ Deny policy present'
    WHEN cmd IN ('UPDATE', 'DELETE') THEN '⚠️  Policy exists but may not deny'
    ELSE 'ℹ️  Other policy'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('brand_history', 'collaboration_logs', 'performance_logs', 'advisor_review_audits')
  AND cmd IN ('UPDATE', 'DELETE')
ORDER BY tablename, cmd;

-- ============================================================================
-- 7. SUMMARY REPORT
-- ============================================================================

-- Generate a summary report
DO $$
DECLARE
  total_tables INTEGER;
  tables_with_rls INTEGER;
  total_policies INTEGER;
  missing_rls_tables TEXT[];
BEGIN
  -- Count total Phase 1 tables
  SELECT COUNT(*) INTO total_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'milestones', 'strategy_briefs', 'content_packages', 'brand_history',
      'payment_attempts', 'archived_data', 'tenants', 'brand_success_patterns',
      'collaboration_logs', 'performance_logs', 'platform_insights',
      'token_health', 'weekly_summaries', 'advisor_review_audits'
    );

  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true
    AND tablename IN (
      'milestones', 'strategy_briefs', 'content_packages', 'brand_history',
      'payment_attempts', 'archived_data', 'tenants', 'brand_success_patterns',
      'collaboration_logs', 'performance_logs', 'platform_insights',
      'token_health', 'weekly_summaries', 'advisor_review_audits'
    );

  -- Count total policies
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'milestones', 'strategy_briefs', 'content_packages', 'brand_history',
      'payment_attempts', 'archived_data', 'tenants', 'brand_success_patterns',
      'collaboration_logs', 'performance_logs', 'platform_insights',
      'token_health', 'weekly_summaries', 'advisor_review_audits'
    );

  -- Find tables missing RLS
  SELECT array_agg(t.table_name)
  INTO missing_rls_tables
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_name IN (
      'milestones', 'strategy_briefs', 'content_packages', 'brand_history',
      'payment_attempts', 'archived_data', 'tenants', 'brand_success_patterns',
      'collaboration_logs', 'performance_logs', 'platform_insights',
      'token_health', 'weekly_summaries', 'advisor_review_audits'
    )
    AND t.table_name NOT IN (
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND rowsecurity = true
    );

  -- Print summary
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Bootstrap Migration Verification Summary';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Phase 1 Tables: %', total_tables;
  RAISE NOTICE 'Tables with RLS: %', tables_with_rls;
  RAISE NOTICE 'Total Policies: %', total_policies;
  
  IF missing_rls_tables IS NOT NULL AND array_length(missing_rls_tables, 1) > 0 THEN
    RAISE WARNING 'Tables missing RLS: %', array_to_string(missing_rls_tables, ', ');
  ELSE
    RAISE NOTICE '✅ All Phase 1 tables have RLS enabled';
  END IF;
  
  IF total_policies < total_tables THEN
    RAISE WARNING 'Some tables may be missing policies (expected at least 1 per table)';
  ELSE
    RAISE NOTICE '✅ All tables have at least one policy';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

