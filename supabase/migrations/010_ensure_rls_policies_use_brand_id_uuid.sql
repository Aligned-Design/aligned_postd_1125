-- ============================================================================
-- Migration 010: Ensure All RLS Policies Use brand_id_uuid
-- Created: 2025-01-16
-- Purpose: Safety check to ensure all persistence schema RLS policies use brand_id_uuid
--          This migration fixes any policies that may still reference brand_id TEXT
--          or is_brand_member_text() helper function
-- Prerequisites: 
--   - Migration 003 (added brand_id_uuid columns)
--   - Migration 005 (should have updated policies, but this ensures completeness)
-- ============================================================================
--
-- PROBLEM:
-- Migration 005 updated RLS policies to use brand_id_uuid, but if migration 005
-- was not fully applied or if bootstrap migration policies were recreated,
-- some policies might still use is_brand_member_text(brand_id).
--
-- SOLUTION:
-- 1. Check all persistence table policies
-- 2. Drop and recreate any policies still using is_brand_member_text() or brand_id TEXT
-- 3. Ensure all policies use brand_id_uuid with direct brand_members check
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
-- - Idempotent: Can be run multiple times safely
-- - Only updates policies that need fixing
-- - No data loss
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix STRATEGY_BRIEFS Policies
-- ============================================================================

-- Drop old policies if they exist (will be recreated correctly)
DROP POLICY IF EXISTS "Brand members can view strategy briefs" ON strategy_briefs;
DROP POLICY IF EXISTS "System can insert strategy_briefs" ON strategy_briefs;
DROP POLICY IF EXISTS "Admins can manage strategy_briefs" ON strategy_briefs;
DROP POLICY IF EXISTS "Admins can delete strategy_briefs" ON strategy_briefs;

-- Recreate policies using brand_id_uuid
DO $$
BEGIN
  BEGIN
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
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
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
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Admins can manage strategy_briefs"
      ON strategy_briefs FOR UPDATE
      USING (
        brand_id_uuid IN (
          SELECT brand_id FROM brand_members
          WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Admins can delete strategy_briefs"
      ON strategy_briefs FOR DELETE
      USING (
        brand_id_uuid IN (
          SELECT brand_id FROM brand_members
          WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

-- ============================================================================
-- STEP 2: Fix CONTENT_PACKAGES Policies
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view content packages" ON content_packages;
DROP POLICY IF EXISTS "System can insert content packages" ON content_packages;
DROP POLICY IF EXISTS "Brand members can update content packages" ON content_packages;
DROP POLICY IF EXISTS "Admins can delete content packages" ON content_packages;

DO $$
BEGIN
  BEGIN
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
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
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
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can update content packages"
      ON content_packages FOR UPDATE
      USING (
        brand_id_uuid IN (
          SELECT brand_id FROM brand_members
          WHERE user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Admins can delete content packages"
      ON content_packages FOR DELETE
      USING (
        brand_id_uuid IN (
          SELECT brand_id FROM brand_members
          WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

-- ============================================================================
-- STEP 3: Fix BRAND_HISTORY Policies
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view brand history" ON brand_history;
DROP POLICY IF EXISTS "System can insert brand history" ON brand_history;
DROP POLICY IF EXISTS "Deny updates to brand_history" ON brand_history;
DROP POLICY IF EXISTS "Deny deletes to brand_history" ON brand_history;

DO $$
BEGIN
  BEGIN
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
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
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
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Deny updates to brand_history"
      ON brand_history FOR UPDATE
      USING (false);
  EXCEPTION
    WHEN duplicate_object THEN
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
      NULL;
  END;
END $$;

-- ============================================================================
-- STEP 4: Fix BRAND_SUCCESS_PATTERNS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view success patterns" ON brand_success_patterns;
DROP POLICY IF EXISTS "System can manage success patterns" ON brand_success_patterns;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view success patterns"
      ON brand_success_patterns FOR SELECT
      USING (
        brand_id_uuid IN (
          SELECT brand_id FROM brand_members
          WHERE user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
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
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

-- ============================================================================
-- STEP 5: Fix COLLABORATION_LOGS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view collaboration logs" ON collaboration_logs;
DROP POLICY IF EXISTS "System can insert collaboration logs" ON collaboration_logs;
DROP POLICY IF EXISTS "Deny updates to collaboration_logs" ON collaboration_logs;
DROP POLICY IF EXISTS "Deny deletes to collaboration_logs" ON collaboration_logs;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view collaboration logs"
      ON collaboration_logs FOR SELECT
      USING (
        brand_id_uuid IN (
          SELECT brand_id FROM brand_members
          WHERE user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can insert collaboration logs"
      ON collaboration_logs FOR INSERT
      WITH CHECK (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
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
      NULL;
  END;
END $$;

-- ============================================================================
-- STEP 6: Fix PERFORMANCE_LOGS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view performance logs" ON performance_logs;
DROP POLICY IF EXISTS "System can insert performance logs" ON performance_logs;
DROP POLICY IF EXISTS "Deny updates to performance_logs" ON performance_logs;
DROP POLICY IF EXISTS "Deny deletes to performance_logs" ON performance_logs;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view performance logs"
      ON performance_logs FOR SELECT
      USING (
        brand_id_uuid IN (
          SELECT brand_id FROM brand_members
          WHERE user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can insert performance logs"
      ON performance_logs FOR INSERT
      WITH CHECK (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
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
      NULL;
  END;
END $$;

-- ============================================================================
-- STEP 7: Fix PLATFORM_INSIGHTS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view platform insights" ON platform_insights;
DROP POLICY IF EXISTS "System can manage platform insights" ON platform_insights;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view platform insights"
      ON platform_insights FOR SELECT
      USING (
        brand_id_uuid IN (
          SELECT brand_id FROM brand_members
          WHERE user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
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
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

-- ============================================================================
-- STEP 8: Fix TOKEN_HEALTH Policies
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view token health" ON token_health;
DROP POLICY IF EXISTS "System/admins can manage token health" ON token_health;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view token health"
      ON token_health FOR SELECT
      USING (
        brand_id_uuid IN (
          SELECT brand_id FROM brand_members
          WHERE user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
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
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

-- ============================================================================
-- STEP 9: Fix WEEKLY_SUMMARIES Policies
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view weekly summaries" ON weekly_summaries;
DROP POLICY IF EXISTS "System can manage weekly summaries" ON weekly_summaries;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view weekly summaries"
      ON weekly_summaries FOR SELECT
      USING (
        brand_id_uuid IN (
          SELECT brand_id FROM brand_members
          WHERE user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can manage weekly summaries"
      ON weekly_summaries FOR ALL
      WITH CHECK (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

-- ============================================================================
-- STEP 10: Fix ADVISOR_REVIEW_AUDITS Policies
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view advisor reviews" ON advisor_review_audits;
DROP POLICY IF EXISTS "System can insert advisor reviews" ON advisor_review_audits;
DROP POLICY IF EXISTS "Deny updates to advisor_review_audits" ON advisor_review_audits;
DROP POLICY IF EXISTS "Deny deletes to advisor_review_audits" ON advisor_review_audits;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "Brand members can view advisor reviews"
      ON advisor_review_audits FOR SELECT
      USING (
        brand_id_uuid IN (
          SELECT brand_id FROM brand_members
          WHERE user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "System can insert advisor reviews"
      ON advisor_review_audits FOR INSERT
      WITH CHECK (auth.role() = 'service_role');
  EXCEPTION
    WHEN duplicate_object THEN
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
      NULL;
  END;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify no policies use is_brand_member_text():
--
-- SELECT tablename, policyname, qual
-- FROM pg_policies
-- WHERE tablename IN (
--   'strategy_briefs', 'content_packages', 'brand_history',
--   'brand_success_patterns', 'collaboration_logs', 'performance_logs',
--   'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
-- )
-- AND (qual LIKE '%is_brand_member_text%' OR qual LIKE '%brand_id%' AND qual NOT LIKE '%brand_id_uuid%');
-- -- Should return 0 rows
-- ============================================================================

