-- ============================================================================
-- RLS Phase 1 Verification Test Suite
-- ============================================================================
-- Purpose: Verify RLS policies for Phase 1 critical tables
-- Usage: Run this in Supabase SQL Editor after applying 001_bootstrap_schema.sql
-- Safe: Idempotent - can be run multiple times
-- ============================================================================

-- ============================================================================
-- 1. CHECK RLS IS ENABLED ON ALL PHASE 1 TABLES
-- ============================================================================

DO $$
DECLARE
  missing_rls TEXT[];
BEGIN
  SELECT array_agg(table_name)
  INTO missing_rls
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
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
    AND table_name NOT IN (
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND rowsecurity = true
    );

  IF missing_rls IS NOT NULL THEN
    RAISE EXCEPTION 'RLS not enabled on tables: %', array_to_string(missing_rls, ', ');
  END IF;

  RAISE NOTICE '✅ All Phase 1 tables have RLS enabled';
END $$;

-- ============================================================================
-- 2. SEED TEST DATA (Idempotent - uses ON CONFLICT DO NOTHING)
-- ============================================================================

-- Test tenant
INSERT INTO tenants (id, name, plan)
VALUES ('11111111-1111-1111-1111-111111111111', 'Test Tenant', 'free')
ON CONFLICT (id) DO NOTHING;

-- Test brand
INSERT INTO brands (id, name, tenant_id, created_by)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Test Brand',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333'
)
ON CONFLICT (id) DO NOTHING;

-- Test users (simulated - these won't exist in auth.users, but we'll use them for JWT claims)
-- User 1 = owner
-- User 2 = member
-- User 3 = non-member (should see nothing)

-- Brand members
INSERT INTO brand_members (id, user_id, brand_id, role)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'owner'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'member')
ON CONFLICT (id) DO NOTHING;

-- Payment attempts (user1 owns one)
INSERT INTO payment_attempts (id, user_id, attempt_number, status, amount)
VALUES
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 1, 'succeeded', 29.99)
ON CONFLICT (id) DO NOTHING;

-- Strategy briefs
INSERT INTO strategy_briefs (id, brand_id, request_id, cycle_id, version, positioning, voice, visual, competitive)
VALUES
  ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'req-001', 'cycle-001', 'v1', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Content packages
INSERT INTO content_packages (id, brand_id, content_id, request_id, cycle_id, copy, collaboration_log, status)
VALUES
  ('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'content-001', 'req-001', 'cycle-001', '{}'::jsonb, '{}'::jsonb, 'draft')
ON CONFLICT (id) DO NOTHING;

-- Milestones
INSERT INTO milestones (id, workspace_id, key, unlocked_at)
VALUES
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'first_post', NOW())
ON CONFLICT (workspace_id, key) DO NOTHING;

-- Archived data
INSERT INTO archived_data (id, user_id, brand_id, data_type, data, delete_after)
VALUES
  ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'content', '{}'::jsonb, NOW() + INTERVAL '90 days')
ON CONFLICT (id) DO NOTHING;

-- Brand history (immutable log)
INSERT INTO brand_history (id, brand_id, entry_id, timestamp, agent, action, tags)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'entry-001', NOW(), 'creative_agent', 'created_content', ARRAY[]::TEXT[])
ON CONFLICT (id) DO NOTHING;

-- Collaboration logs (immutable log)
INSERT INTO collaboration_logs (id, cycle_id, request_id, brand_id, agent, action, timestamp)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'cycle-001', 'req-001', '22222222-2222-2222-2222-222222222222', 'copy_agent', 'generated', NOW())
ON CONFLICT (id) DO NOTHING;

-- Performance logs (immutable log)
INSERT INTO performance_logs (id, brand_id, platform, engagement, recorded_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'instagram', '{}'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

-- Advisor review audits (immutable log)
INSERT INTO advisor_review_audits (id, cycle_id, request_id, brand_id, content_id, platform, clarity_score, alignment_score, resonance_score, actionability_score, platform_fit_score, average_score, weighted_score, severity_level)
VALUES
  ('dddddddd-0000-0000-0000-000000000001', 'cycle-001', 'req-001', '22222222-2222-2222-2222-222222222222', 'content-001', 'instagram', 8.5, 8.0, 7.5, 8.0, 8.5, 8.1, 8.2, 'low')
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE '✅ Test data seeded';
END $$;

-- ============================================================================
-- 3. RLS VALIDATION QUERIES
-- ============================================================================
-- Run these queries manually by simulating different users
-- Example:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
--   SELECT COUNT(*) FROM payment_attempts; -- Should return 1 for user1

-- ============================================================================
-- Test 1: User1 (owner) can see their own payment_attempts
-- ============================================================================
-- Expected: 1 row
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
--   SELECT COUNT(*) as payment_count FROM payment_attempts;
-- Expected result: payment_count = 1

-- ============================================================================
-- Test 2: User2 (member) cannot see user1's payment_attempts
-- ============================================================================
-- Expected: 0 rows
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', false);
--   SELECT COUNT(*) as payment_count FROM payment_attempts;
-- Expected result: payment_count = 0

-- ============================================================================
-- Test 3: User1 (owner) can see brand's strategy_briefs
-- ============================================================================
-- Expected: 1 row
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
--   SELECT COUNT(*) as brief_count FROM strategy_briefs;
-- Expected result: brief_count = 1

-- ============================================================================
-- Test 4: User2 (member) can see brand's strategy_briefs
-- ============================================================================
-- Expected: 1 row
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', false);
--   SELECT COUNT(*) as brief_count FROM strategy_briefs;
-- Expected result: brief_count = 1

-- ============================================================================
-- Test 5: User3 (non-member) cannot see brand's strategy_briefs
-- ============================================================================
-- Expected: 0 rows
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', false);
--   SELECT COUNT(*) as brief_count FROM strategy_briefs;
-- Expected result: brief_count = 0

-- ============================================================================
-- Test 6: User1 (owner) can see brand's content_packages
-- ============================================================================
-- Expected: 1 row
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
--   SELECT COUNT(*) as package_count FROM content_packages;
-- Expected result: package_count = 1

-- ============================================================================
-- Test 7: User2 (member) can see brand's content_packages
-- ============================================================================
-- Expected: 1 row
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', false);
--   SELECT COUNT(*) as package_count FROM content_packages;
-- Expected result: package_count = 1

-- ============================================================================
-- Test 8: Workspace members can see milestones
-- ============================================================================
-- Expected: 1 row (both user1 and user2 are workspace members)
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
--   SELECT COUNT(*) as milestone_count FROM milestones;
-- Expected result: milestone_count = 1

-- ============================================================================
-- Test 9: Non-members cannot see milestones
-- ============================================================================
-- Expected: 0 rows
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', false);
--   SELECT COUNT(*) as milestone_count FROM milestones;
-- Expected result: milestone_count = 0

-- ============================================================================
-- Test 10: Immutable logs cannot be UPDATEd (brand_history)
-- ============================================================================
-- Expected: Permission denied error
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
--   UPDATE brand_history SET action = 'modified' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
-- Expected result: ERROR or 0 rows updated (RLS blocks)

-- ============================================================================
-- Test 11: Immutable logs cannot be DELETEd (brand_history)
-- ============================================================================
-- Expected: Permission denied error
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
--   DELETE FROM brand_history WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
-- Expected result: ERROR or 0 rows deleted (RLS blocks)

-- ============================================================================
-- Test 12: Immutable logs cannot be UPDATEd (collaboration_logs)
-- ============================================================================
-- Expected: Permission denied error
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
--   UPDATE collaboration_logs SET action = 'modified' WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001';
-- Expected result: ERROR or 0 rows updated (RLS blocks)

-- ============================================================================
-- Test 13: Immutable logs cannot be DELETEd (collaboration_logs)
-- ============================================================================
-- Expected: Permission denied error
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
--   DELETE FROM collaboration_logs WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001';
-- Expected result: ERROR or 0 rows deleted (RLS blocks)

-- ============================================================================
-- Test 14: Immutable logs cannot be UPDATEd (performance_logs)
-- ============================================================================
-- Expected: Permission denied error
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
--   UPDATE performance_logs SET platform = 'modified' WHERE id = 'cccccccc-0000-0000-0000-000000000001';
-- Expected result: ERROR or 0 rows updated (RLS blocks)

-- ============================================================================
-- Test 15: Immutable logs cannot be DELETEd (performance_logs)
-- ============================================================================
-- Expected: Permission denied error
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
--   DELETE FROM performance_logs WHERE id = 'cccccccc-0000-0000-0000-000000000001';
-- Expected result: ERROR or 0 rows deleted (RLS blocks)

-- ============================================================================
-- Test 16: Immutable logs cannot be UPDATEd (advisor_review_audits)
-- ============================================================================
-- Expected: Permission denied error
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
--   UPDATE advisor_review_audits SET severity_level = 'modified' WHERE id = 'dddddddd-0000-0000-0000-000000000001';
-- Expected result: ERROR or 0 rows updated (RLS blocks)

-- ============================================================================
-- Test 17: Immutable logs cannot be DELETEd (advisor_review_audits)
-- ============================================================================
-- Expected: Permission denied error
-- Run:
--   SET LOCAL ROLE authenticated;
--   SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);
--   DELETE FROM advisor_review_audits WHERE id = 'dddddddd-0000-0000-0000-000000000001';
-- Expected result: ERROR or 0 rows deleted (RLS blocks)

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- After running all tests manually:
-- ✅ All Phase 1 tables have RLS enabled
-- ✅ Users can only see their own payment_attempts
-- ✅ Brand members can see their brand's strategy_briefs and content_packages
-- ✅ Non-members cannot see brand data
-- ✅ Workspace members can see milestones
-- ✅ Immutable logs cannot be updated or deleted
-- ============================================================================

