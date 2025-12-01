-- ============================================================================
-- BOOTSTRAP MIGRATION FIXES
-- ARCHIVED: All fixes in this file have been incorporated into 001_bootstrap_schema.sql
-- This file is kept for historical reference only.
-- ============================================================================
-- 
-- Issue: Missing explicit deny policies for immutable log tables
-- Severity: Low (PostgreSQL defaults to deny, but explicit is safer)
-- 
-- Affected Tables:
-- 1. brand_history
-- 2. collaboration_logs
-- 3. performance_logs
-- 4. advisor_review_audits
--
-- ============================================================================

-- Fix 1: Add explicit deny policies for brand_history
-- Insert after line 2009 (after brand_history INSERT policy)

-- Explicitly deny UPDATE/DELETE for immutable log
CREATE POLICY "Deny updates to brand_history"
  ON brand_history FOR UPDATE
  USING (false);

CREATE POLICY "Deny deletes to brand_history"
  ON brand_history FOR DELETE
  USING (false);

-- Fix 2: Add explicit deny policies for collaboration_logs
-- Insert after line 2042 (after collaboration_logs INSERT policy)

-- Explicitly deny UPDATE/DELETE for immutable log
CREATE POLICY "Deny updates to collaboration_logs"
  ON collaboration_logs FOR UPDATE
  USING (false);

CREATE POLICY "Deny deletes to collaboration_logs"
  ON collaboration_logs FOR DELETE
  USING (false);

-- Fix 3: Add explicit deny policies for performance_logs
-- Insert after line 2053 (after performance_logs INSERT policy)

-- Explicitly deny UPDATE/DELETE for immutable log
CREATE POLICY "Deny updates to performance_logs"
  ON performance_logs FOR UPDATE
  USING (false);

CREATE POLICY "Deny deletes to performance_logs"
  ON performance_logs FOR DELETE
  USING (false);

-- Fix 4: Add explicit deny policies for advisor_review_audits
-- Insert after line 2119 (after advisor_review_audits INSERT policy)

-- Explicitly deny UPDATE/DELETE for immutable log
CREATE POLICY "Deny updates to advisor_review_audits"
  ON advisor_review_audits FOR UPDATE
  USING (false);

CREATE POLICY "Deny deletes to advisor_review_audits"
  ON advisor_review_audits FOR DELETE
  USING (false);

-- ============================================================================
-- END OF FIXES
-- ============================================================================
--
-- To apply these fixes:
-- 1. Open supabase/migrations/001_bootstrap_schema.sql
-- 2. Insert the appropriate policy blocks at the specified line numbers
-- 3. Or create a new migration file: 002_add_immutable_log_deny_policies.sql
-- 4. Run the migration on your Supabase project
--
-- ============================================================================

