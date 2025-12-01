-- ============================================================================
-- Migration 005: Finalize brand_id UUID Migration (Step 2 of 2)
-- Created: 2025-01-20
-- Purpose: Complete migration from brand_id TEXT to brand_id_uuid UUID
-- Reference: MVP_DATABASE_TABLE_AUDIT_REPORT.md - Section 8 Open TODOs
-- Prerequisites: Migration 003 must be applied first
-- ============================================================================
--
-- PROBLEM:
-- Step 1 (migration 003) added brand_id_uuid columns and backfilled data.
-- However, RLS policies still use is_brand_member_text(brand_id) and there are
-- no foreign key constraints. This migration completes the transition.
--
-- SOLUTION:
-- 1. Add foreign key constraints: brand_id_uuid REFERENCES brands(id)
-- 2. Update all RLS policies to use brand_id_uuid instead of is_brand_member_text()
-- 3. Mark brand_id TEXT columns as deprecated (DO NOT DROP - backward compatibility)
-- 4. Add comments explaining future drop steps
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
-- - All changes are additive or policy updates (no data loss)
-- - brand_id TEXT columns remain for backward compatibility
-- - RLS policies updated to use UUID for better performance and FK support
-- - Application code can gradually migrate to brand_id_uuid
-- ============================================================================

-- ============================================================================
-- STEP 1: Add Foreign Key Constraints
-- ============================================================================
-- Note: These will fail if any brand_id_uuid values don't match existing brands.
-- Migration 003 should have backfilled correctly, but we handle NULLs gracefully.

-- Strategy Briefs
ALTER TABLE strategy_briefs
ADD CONSTRAINT fk_strategy_briefs_brand_id_uuid
FOREIGN KEY (brand_id_uuid) REFERENCES brands(id) ON DELETE CASCADE;

-- Content Packages
ALTER TABLE content_packages
ADD CONSTRAINT fk_content_packages_brand_id_uuid
FOREIGN KEY (brand_id_uuid) REFERENCES brands(id) ON DELETE CASCADE;

-- Brand History
ALTER TABLE brand_history
ADD CONSTRAINT fk_brand_history_brand_id_uuid
FOREIGN KEY (brand_id_uuid) REFERENCES brands(id) ON DELETE CASCADE;

-- Brand Success Patterns
ALTER TABLE brand_success_patterns
ADD CONSTRAINT fk_brand_success_patterns_brand_id_uuid
FOREIGN KEY (brand_id_uuid) REFERENCES brands(id) ON DELETE CASCADE;

-- Collaboration Logs
ALTER TABLE collaboration_logs
ADD CONSTRAINT fk_collaboration_logs_brand_id_uuid
FOREIGN KEY (brand_id_uuid) REFERENCES brands(id) ON DELETE CASCADE;

-- Performance Logs
ALTER TABLE performance_logs
ADD CONSTRAINT fk_performance_logs_brand_id_uuid
FOREIGN KEY (brand_id_uuid) REFERENCES brands(id) ON DELETE CASCADE;

-- Platform Insights
ALTER TABLE platform_insights
ADD CONSTRAINT fk_platform_insights_brand_id_uuid
FOREIGN KEY (brand_id_uuid) REFERENCES brands(id) ON DELETE CASCADE;

-- Token Health
ALTER TABLE token_health
ADD CONSTRAINT fk_token_health_brand_id_uuid
FOREIGN KEY (brand_id_uuid) REFERENCES brands(id) ON DELETE CASCADE;

-- Weekly Summaries
ALTER TABLE weekly_summaries
ADD CONSTRAINT fk_weekly_summaries_brand_id_uuid
FOREIGN KEY (brand_id_uuid) REFERENCES brands(id) ON DELETE CASCADE;

-- Advisor Review Audits
ALTER TABLE advisor_review_audits
ADD CONSTRAINT fk_advisor_review_audits_brand_id_uuid
FOREIGN KEY (brand_id_uuid) REFERENCES brands(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 2: Update RLS Policies to Use brand_id_uuid
-- ============================================================================
-- Replace is_brand_member_text(brand_id) with direct brand_members check on UUID

-- ============================================================================
-- 1. STRATEGY_BRIEFS
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Brand members can view strategy briefs" ON strategy_briefs;
DROP POLICY IF EXISTS "System can insert strategy_briefs" ON strategy_briefs;
DROP POLICY IF EXISTS "Admins can manage strategy_briefs" ON strategy_briefs;
DROP POLICY IF EXISTS "Admins can delete strategy_briefs" ON strategy_briefs;

-- New policies using brand_id_uuid
CREATE POLICY "Brand members can view strategy briefs"
  ON strategy_briefs FOR SELECT
  USING (
    brand_id_uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
    OR brand_id_uuid IN (
      SELECT id FROM brands
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "System can insert strategy_briefs"
  ON strategy_briefs FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      brand_id_uuid IN (
        SELECT brand_id FROM brand_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Admins can manage strategy_briefs"
  ON strategy_briefs FOR UPDATE
  USING (
    brand_id_uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete strategy_briefs"
  ON strategy_briefs FOR DELETE
  USING (
    brand_id_uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 2. CONTENT_PACKAGES
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view content packages" ON content_packages;
DROP POLICY IF EXISTS "System can insert content packages" ON content_packages;
DROP POLICY IF EXISTS "Brand members can update content packages" ON content_packages;
DROP POLICY IF EXISTS "Admins can delete content packages" ON content_packages;

CREATE POLICY "Brand members can view content packages"
  ON content_packages FOR SELECT
  USING (
    brand_id_uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
    OR brand_id_uuid IN (
      SELECT id FROM brands
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "System can insert content packages"
  ON content_packages FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      brand_id_uuid IN (
        SELECT brand_id FROM brand_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'editor', 'creator')
      )
    )
  );

CREATE POLICY "Brand members can update content packages"
  ON content_packages FOR UPDATE
  USING (
    brand_id_uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete content packages"
  ON content_packages FOR DELETE
  USING (
    brand_id_uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 3. BRAND_HISTORY
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view brand history" ON brand_history;
DROP POLICY IF EXISTS "System can insert brand history" ON brand_history;
DROP POLICY IF EXISTS "Deny updates to brand_history" ON brand_history;
DROP POLICY IF EXISTS "Deny deletes to brand_history" ON brand_history;

CREATE POLICY "Brand members can view brand history"
  ON brand_history FOR SELECT
  USING (
    brand_id_uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
    OR brand_id_uuid IN (
      SELECT id FROM brands
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "System can insert brand history"
  ON brand_history FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      brand_id_uuid IN (
        SELECT brand_id FROM brand_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Deny updates to brand_history"
  ON brand_history FOR UPDATE
  USING (false);

CREATE POLICY "Deny deletes to brand_history"
  ON brand_history FOR DELETE
  USING (false);

-- ============================================================================
-- 4. BRAND_SUCCESS_PATTERNS
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view success patterns" ON brand_success_patterns;
DROP POLICY IF EXISTS "System can manage success patterns" ON brand_success_patterns;

CREATE POLICY "Brand members can view success patterns"
  ON brand_success_patterns FOR SELECT
  USING (
    brand_id_uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage success patterns"
  ON brand_success_patterns FOR ALL
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      brand_id_uuid IN (
        SELECT brand_id FROM brand_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

-- ============================================================================
-- 5. COLLABORATION_LOGS
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view collaboration logs" ON collaboration_logs;
DROP POLICY IF EXISTS "System can insert collaboration logs" ON collaboration_logs;
DROP POLICY IF EXISTS "Deny updates to collaboration_logs" ON collaboration_logs;
DROP POLICY IF EXISTS "Deny deletes to collaboration_logs" ON collaboration_logs;

CREATE POLICY "Brand members can view collaboration logs"
  ON collaboration_logs FOR SELECT
  USING (
    brand_id_uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert collaboration logs"
  ON collaboration_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Deny updates to collaboration_logs"
  ON collaboration_logs FOR UPDATE
  USING (false);

CREATE POLICY "Deny deletes to collaboration_logs"
  ON collaboration_logs FOR DELETE
  USING (false);

-- ============================================================================
-- 6. PERFORMANCE_LOGS
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view performance logs" ON performance_logs;
DROP POLICY IF EXISTS "System can insert performance logs" ON performance_logs;
DROP POLICY IF EXISTS "Deny updates to performance_logs" ON performance_logs;
DROP POLICY IF EXISTS "Deny deletes to performance_logs" ON performance_logs;

CREATE POLICY "Brand members can view performance logs"
  ON performance_logs FOR SELECT
  USING (
    brand_id_uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert performance logs"
  ON performance_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Deny updates to performance_logs"
  ON performance_logs FOR UPDATE
  USING (false);

CREATE POLICY "Deny deletes to performance_logs"
  ON performance_logs FOR DELETE
  USING (false);

-- ============================================================================
-- 7. PLATFORM_INSIGHTS
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view platform insights" ON platform_insights;
DROP POLICY IF EXISTS "System can manage platform insights" ON platform_insights;

CREATE POLICY "Brand members can view platform insights"
  ON platform_insights FOR SELECT
  USING (
    brand_id_uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage platform insights"
  ON platform_insights FOR ALL
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      brand_id_uuid IN (
        SELECT brand_id FROM brand_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

-- ============================================================================
-- 8. TOKEN_HEALTH
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view token health" ON token_health;
DROP POLICY IF EXISTS "System/admins can manage token health" ON token_health;

CREATE POLICY "Brand members can view token health"
  ON token_health FOR SELECT
  USING (
    brand_id_uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System/admins can manage token health"
  ON token_health FOR ALL
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      brand_id_uuid IN (
        SELECT brand_id FROM brand_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

-- ============================================================================
-- 9. WEEKLY_SUMMARIES
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view weekly summaries" ON weekly_summaries;
DROP POLICY IF EXISTS "System can manage weekly summaries" ON weekly_summaries;

CREATE POLICY "Brand members can view weekly summaries"
  ON weekly_summaries FOR SELECT
  USING (
    brand_id_uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage weekly summaries"
  ON weekly_summaries FOR ALL
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 10. ADVISOR_REVIEW_AUDITS
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view advisor reviews" ON advisor_review_audits;
DROP POLICY IF EXISTS "System can insert advisor reviews" ON advisor_review_audits;
DROP POLICY IF EXISTS "Deny updates to advisor_review_audits" ON advisor_review_audits;
DROP POLICY IF EXISTS "Deny deletes to advisor_review_audits" ON advisor_review_audits;

CREATE POLICY "Brand members can view advisor reviews"
  ON advisor_review_audits FOR SELECT
  USING (
    brand_id_uuid IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert advisor reviews"
  ON advisor_review_audits FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Deny updates to advisor_review_audits"
  ON advisor_review_audits FOR UPDATE
  USING (false);

CREATE POLICY "Deny deletes to advisor_review_audits"
  ON advisor_review_audits FOR DELETE
  USING (false);

-- ============================================================================
-- STEP 3: Mark brand_id TEXT Columns as Deprecated
-- ============================================================================
-- DO NOT DROP - these columns remain for backward compatibility during transition

COMMENT ON COLUMN strategy_briefs.brand_id IS 'DEPRECATED: Use brand_id_uuid instead. This column will be removed in a future migration after all application code is updated.';
COMMENT ON COLUMN content_packages.brand_id IS 'DEPRECATED: Use brand_id_uuid instead. This column will be removed in a future migration after all application code is updated.';
COMMENT ON COLUMN brand_history.brand_id IS 'DEPRECATED: Use brand_id_uuid instead. This column will be removed in a future migration after all application code is updated.';
COMMENT ON COLUMN brand_success_patterns.brand_id IS 'DEPRECATED: Use brand_id_uuid instead. This column will be removed in a future migration after all application code is updated.';
COMMENT ON COLUMN collaboration_logs.brand_id IS 'DEPRECATED: Use brand_id_uuid instead. This column will be removed in a future migration after all application code is updated.';
COMMENT ON COLUMN performance_logs.brand_id IS 'DEPRECATED: Use brand_id_uuid instead. This column will be removed in a future migration after all application code is updated.';
COMMENT ON COLUMN platform_insights.brand_id IS 'DEPRECATED: Use brand_id_uuid instead. This column will be removed in a future migration after all application code is updated.';
COMMENT ON COLUMN token_health.brand_id IS 'DEPRECATED: Use brand_id_uuid instead. This column will be removed in a future migration after all application code is removed.';
COMMENT ON COLUMN weekly_summaries.brand_id IS 'DEPRECATED: Use brand_id_uuid instead. This column will be removed in a future migration after all application code is updated.';
COMMENT ON COLUMN advisor_review_audits.brand_id IS 'DEPRECATED: Use brand_id_uuid instead. This column will be removed in a future migration after all application code is updated.';

-- Update brand_id_uuid column comments to indicate they are now primary
COMMENT ON COLUMN strategy_briefs.brand_id_uuid IS 'Primary brand identifier (UUID). Replaces deprecated brand_id TEXT column.';
COMMENT ON COLUMN content_packages.brand_id_uuid IS 'Primary brand identifier (UUID). Replaces deprecated brand_id TEXT column.';
COMMENT ON COLUMN brand_history.brand_id_uuid IS 'Primary brand identifier (UUID). Replaces deprecated brand_id TEXT column.';
COMMENT ON COLUMN brand_success_patterns.brand_id_uuid IS 'Primary brand identifier (UUID). Replaces deprecated brand_id TEXT column.';
COMMENT ON COLUMN collaboration_logs.brand_id_uuid IS 'Primary brand identifier (UUID). Replaces deprecated brand_id TEXT column.';
COMMENT ON COLUMN performance_logs.brand_id_uuid IS 'Primary brand identifier (UUID). Replaces deprecated brand_id TEXT column.';
COMMENT ON COLUMN platform_insights.brand_id_uuid IS 'Primary brand identifier (UUID). Replaces deprecated brand_id TEXT column.';
COMMENT ON COLUMN token_health.brand_id_uuid IS 'Primary brand identifier (UUID). Replaces deprecated brand_id TEXT column.';
COMMENT ON COLUMN weekly_summaries.brand_id_uuid IS 'Primary brand identifier (UUID). Replaces deprecated brand_id TEXT column.';
COMMENT ON COLUMN advisor_review_audits.brand_id_uuid IS 'Primary brand identifier (UUID). Replaces deprecated brand_id TEXT column.';

-- ============================================================================
-- STEP 4: Future Drop Steps (Documentation Only)
-- ============================================================================
-- These steps should be executed in a future migration (Phase 3) after:
-- 1. All application code is updated to use brand_id_uuid
-- 2. All existing data has been verified to have brand_id_uuid populated
-- 3. A grace period has passed to ensure no code still references brand_id TEXT
--
-- Future Migration Steps:
-- 1. Verify no application code references brand_id TEXT columns
-- 2. Set brand_id TEXT columns to NOT NULL = false (if they aren't already)
-- 3. Drop brand_id TEXT columns:
--    ALTER TABLE strategy_briefs DROP COLUMN brand_id;
--    ALTER TABLE content_packages DROP COLUMN brand_id;
--    ALTER TABLE brand_history DROP COLUMN brand_id;
--    ALTER TABLE brand_success_patterns DROP COLUMN brand_id;
--    ALTER TABLE collaboration_logs DROP COLUMN brand_id;
--    ALTER TABLE performance_logs DROP COLUMN brand_id;
--    ALTER TABLE platform_insights DROP COLUMN brand_id;
--    ALTER TABLE token_health DROP COLUMN brand_id;
--    ALTER TABLE weekly_summaries DROP COLUMN brand_id;
--    ALTER TABLE advisor_review_audits DROP COLUMN brand_id;
-- 4. Optionally drop is_brand_member_text() helper function if no longer used
-- 5. Rename brand_id_uuid to brand_id (optional, for cleaner API)
-- ============================================================================

-- ============================================================================
-- VERIFICATION QUERIES (for manual verification after migration)
-- ============================================================================
-- Run these to verify migration success:
--
-- 1. Check foreign keys exist:
--    SELECT conname, conrelid::regclass, confrelid::regclass
--    FROM pg_constraint
--    WHERE conname LIKE 'fk_%_brand_id_uuid';
--
-- 2. Check RLS policies use brand_id_uuid:
--    SELECT tablename, policyname, cmd, qual
--    FROM pg_policies
--    WHERE tablename IN ('strategy_briefs', 'content_packages', 'brand_history', ...)
--    AND qual LIKE '%brand_id_uuid%';
--
-- 3. Verify no policies still use is_brand_member_text:
--    SELECT tablename, policyname, qual
--    FROM pg_policies
--    WHERE qual LIKE '%is_brand_member_text%';
--    -- Should return 0 rows
-- ============================================================================

