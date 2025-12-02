-- ============================================================================
-- MIGRATION 016: Secure RLS Policies (Phase 1)
-- Created: 2025-01-XX
-- Description: Adds/fixes RLS policies for tables with weak or missing security
--              NO schema changes (no TEXT→UUID, no FKs, no table drops)
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Helper: Check if user is brand member (handles TEXT brand_id)
-- Used for persistence schema tables that use brand_id TEXT
CREATE OR REPLACE FUNCTION is_brand_member_text(brand_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Try to cast to UUID and check brand_members
  -- If cast fails, return false
  BEGIN
    RETURN EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_id = brand_id_param::uuid
      AND user_id = auth.uid()
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Check if user is workspace member
-- Used for milestones table (workspace_id TEXT)
CREATE OR REPLACE FUNCTION is_workspace_member(workspace_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM brands b
    JOIN brand_members bm ON bm.brand_id = b.id
    WHERE COALESCE(b.workspace_id, b.tenant_id::text) = workspace_id_param
    AND bm.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- milestones – workspace-scoped RLS
-- ============================================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can read own workspace milestones" ON milestones;
DROP POLICY IF EXISTS "System can insert milestones" ON milestones;
DROP POLICY IF EXISTS "Users can acknowledge milestones" ON milestones;

-- Users can view milestones for their workspace
-- Workspace is determined via brand_members → brands → tenant_id/workspace_id
CREATE POLICY "Users can view workspace milestones"
  ON milestones FOR SELECT
  USING (
    workspace_id IN (
      SELECT COALESCE(b.workspace_id, b.tenant_id::text)
      FROM brands b
      JOIN brand_members bm ON bm.brand_id = b.id
      WHERE bm.user_id = auth.uid()
      AND COALESCE(b.workspace_id, b.tenant_id::text) IS NOT NULL
    )
  );

-- System/service role can insert milestones
-- Brand owners/admins can also insert milestones for their workspace
CREATE POLICY "System can insert milestones"
  ON milestones FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR workspace_id IN (
      SELECT COALESCE(b.workspace_id, b.tenant_id::text)
      FROM brands b
      JOIN brand_members bm ON bm.brand_id = b.id
      WHERE bm.user_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
      AND COALESCE(b.workspace_id, b.tenant_id::text) IS NOT NULL
    )
  );

-- Users can acknowledge milestones for their workspace
CREATE POLICY "Users can acknowledge workspace milestones"
  ON milestones FOR UPDATE
  USING (
    workspace_id IN (
      SELECT COALESCE(b.workspace_id, b.tenant_id::text)
      FROM brands b
      JOIN brand_members bm ON bm.brand_id = b.id
      WHERE bm.user_id = auth.uid()
      AND COALESCE(b.workspace_id, b.tenant_id::text) IS NOT NULL
    )
  );

-- ============================================================================
-- strategy_briefs – brand-scoped RLS (brand_id TEXT)
-- ============================================================================

ALTER TABLE strategy_briefs ENABLE ROW LEVEL SECURITY;

-- Brand members can view strategy briefs for their brands
CREATE POLICY "Brand members can view strategy briefs"
  ON strategy_briefs FOR SELECT
  USING (
    is_brand_member_text(brand_id)
    OR brand_id IN (
      SELECT id::text FROM brands
      WHERE created_by = auth.uid()
    )
  );

-- System/service role can insert strategy briefs
-- Brand owners/admins can also insert strategy briefs
CREATE POLICY "System can insert strategy_briefs"
  ON strategy_briefs FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      is_brand_member_text(brand_id)
      AND EXISTS (
        SELECT 1 FROM brand_members
        WHERE brand_id = brand_id::uuid
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

-- Only admins can update/delete strategy briefs
CREATE POLICY "Admins can manage strategy_briefs"
  ON strategy_briefs FOR UPDATE
  USING (
    is_brand_member_text(brand_id)
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_id = brand_id::uuid
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete strategy_briefs"
  ON strategy_briefs FOR DELETE
  USING (
    is_brand_member_text(brand_id)
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_id = brand_id::uuid
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- content_packages – brand-scoped RLS (brand_id TEXT)
-- ============================================================================

ALTER TABLE content_packages ENABLE ROW LEVEL SECURITY;

-- Brand members can view content packages for their brands
CREATE POLICY "Brand members can view content packages"
  ON content_packages FOR SELECT
  USING (
    is_brand_member_text(brand_id)
    OR brand_id IN (
      SELECT id::text FROM brands
      WHERE created_by = auth.uid()
    )
  );

-- System/service role can insert content packages
-- Brand members with creator+ role can also insert
CREATE POLICY "System can insert content packages"
  ON content_packages FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      is_brand_member_text(brand_id)
      AND EXISTS (
        SELECT 1 FROM brand_members
        WHERE brand_id = brand_id::uuid
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'editor', 'creator')
      )
    )
  );

-- Brand members can update content packages (for approval workflow)
CREATE POLICY "Brand members can update content packages"
  ON content_packages FOR UPDATE
  USING (
    is_brand_member_text(brand_id)
  );

-- Only admins can delete content packages
CREATE POLICY "Admins can delete content packages"
  ON content_packages FOR DELETE
  USING (
    is_brand_member_text(brand_id)
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_id = brand_id::uuid
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- brand_history – brand-scoped RLS (brand_id TEXT, immutable log)
-- ============================================================================

ALTER TABLE brand_history ENABLE ROW LEVEL SECURITY;

-- Brand members can view brand history
CREATE POLICY "Brand members can view brand history"
  ON brand_history FOR SELECT
  USING (
    is_brand_member_text(brand_id)
    OR brand_id IN (
      SELECT id::text FROM brands
      WHERE created_by = auth.uid()
    )
  );

-- Only system/service role can insert (immutable log)
-- Brand owners/admins can also insert for their brand
CREATE POLICY "System can insert brand history"
  ON brand_history FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      is_brand_member_text(brand_id)
      AND EXISTS (
        SELECT 1 FROM brand_members
        WHERE brand_id = brand_id::uuid
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

-- No UPDATE/DELETE policies (immutable log)

-- ============================================================================
-- payment_attempts – user-only + system RLS
-- ============================================================================

ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment attempts
CREATE POLICY "Users can view own payment attempts"
  ON payment_attempts FOR SELECT
  USING (user_id = auth.uid());

-- System/service role can insert payment attempts
-- Users can create their own payment attempt
CREATE POLICY "System can insert payment attempts"
  ON payment_attempts FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR user_id = auth.uid()
  );

-- System/service role can update payment attempts
CREATE POLICY "System can update payment attempts"
  ON payment_attempts FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR user_id = auth.uid()
  );

-- Note: No admin-only policy for payment_attempts since we don't have
-- a reliable way to check for admin role without user_profiles.role column.
-- If admin access is needed, add it via a separate migration after
-- verifying user_profiles.role exists or creating tenant_members table.

-- ============================================================================
-- archived_data – user-only + system RLS
-- ============================================================================

ALTER TABLE archived_data ENABLE ROW LEVEL SECURITY;

-- Users can view their own archived data
CREATE POLICY "Users can view own archived data"
  ON archived_data FOR SELECT
  USING (user_id = auth.uid());

-- If brand_id is present, also allow brand members to view
CREATE POLICY "Brand members can view archived data"
  ON archived_data FOR SELECT
  USING (
    brand_id IS NOT NULL
    AND brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

-- System/service role can insert archived data
CREATE POLICY "System can insert archived data"
  ON archived_data FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- System/service role can update (for restoration flag)
CREATE POLICY "System can update archived data"
  ON archived_data FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- tenants – tenant-scoped RLS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their tenants" ON tenants;
DROP POLICY IF EXISTS "System can create tenants" ON tenants;
DROP POLICY IF EXISTS "Superadmin can manage tenants" ON tenants;

-- Users can view tenants they belong to (via brands)
CREATE POLICY "Users can view their tenants"
  ON tenants FOR SELECT
  USING (
    id IN (
      SELECT DISTINCT COALESCE(b.tenant_id, b.workspace_id::uuid)
      FROM brands b
      JOIN brand_members bm ON bm.brand_id = b.id
      WHERE bm.user_id = auth.uid()
      AND COALESCE(b.tenant_id, b.workspace_id::uuid) IS NOT NULL
    )
  );

-- Only system/service role can create tenants
CREATE POLICY "System can create tenants"
  ON tenants FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Only system/service role can update/delete tenants
CREATE POLICY "System can manage tenants"
  ON tenants FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "System can delete tenants"
  ON tenants FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- brand_success_patterns – brand-scoped RLS (brand_id TEXT)
-- ============================================================================

ALTER TABLE brand_success_patterns ENABLE ROW LEVEL SECURITY;

-- Brand members can view success patterns
CREATE POLICY "Brand members can view success patterns"
  ON brand_success_patterns FOR SELECT
  USING (is_brand_member_text(brand_id));

-- System/service role can insert/update success patterns
-- Brand owners/admins can also manage success patterns
CREATE POLICY "System can manage success patterns"
  ON brand_success_patterns FOR ALL
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      is_brand_member_text(brand_id)
      AND EXISTS (
        SELECT 1 FROM brand_members
        WHERE brand_id = brand_id::uuid
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

-- ============================================================================
-- collaboration_logs – brand-scoped RLS (brand_id TEXT, immutable log)
-- ============================================================================

ALTER TABLE collaboration_logs ENABLE ROW LEVEL SECURITY;

-- Brand members can view collaboration logs
CREATE POLICY "Brand members can view collaboration logs"
  ON collaboration_logs FOR SELECT
  USING (is_brand_member_text(brand_id));

-- Only system/service role can insert (immutable log)
CREATE POLICY "System can insert collaboration logs"
  ON collaboration_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- No UPDATE/DELETE policies (immutable log)

-- ============================================================================
-- performance_logs – brand-scoped RLS (brand_id TEXT, immutable log)
-- ============================================================================

ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

-- Brand members can view performance logs
CREATE POLICY "Brand members can view performance logs"
  ON performance_logs FOR SELECT
  USING (is_brand_member_text(brand_id));

-- Only system/service role can insert (analytics sync)
CREATE POLICY "System can insert performance logs"
  ON performance_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- No UPDATE/DELETE policies (immutable log)

-- ============================================================================
-- platform_insights – brand-scoped RLS (brand_id TEXT)
-- ============================================================================

ALTER TABLE platform_insights ENABLE ROW LEVEL SECURITY;

-- Brand members can view platform insights
CREATE POLICY "Brand members can view platform insights"
  ON platform_insights FOR SELECT
  USING (is_brand_member_text(brand_id));

-- System/service role can insert/update platform insights
-- Brand owners/admins can also manage platform insights
CREATE POLICY "System can manage platform insights"
  ON platform_insights FOR ALL
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      is_brand_member_text(brand_id)
      AND EXISTS (
        SELECT 1 FROM brand_members
        WHERE brand_id = brand_id::uuid
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

-- ============================================================================
-- token_health – brand-scoped RLS (brand_id TEXT, sensitive OAuth data)
-- ============================================================================

ALTER TABLE token_health ENABLE ROW LEVEL SECURITY;

-- Brand members can view token health
CREATE POLICY "Brand members can view token health"
  ON token_health FOR SELECT
  USING (is_brand_member_text(brand_id));

-- System/service role can insert/update token health
-- Brand owners/admins can also manage token health
CREATE POLICY "System/admins can manage token health"
  ON token_health FOR ALL
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      is_brand_member_text(brand_id)
      AND EXISTS (
        SELECT 1 FROM brand_members
        WHERE brand_id = brand_id::uuid
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

-- ============================================================================
-- weekly_summaries – brand-scoped RLS (brand_id TEXT)
-- ============================================================================

ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- Brand members can view weekly summaries
CREATE POLICY "Brand members can view weekly summaries"
  ON weekly_summaries FOR SELECT
  USING (is_brand_member_text(brand_id));

-- System/service role can insert/update weekly summaries
CREATE POLICY "System can manage weekly summaries"
  ON weekly_summaries FOR ALL
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- advisor_review_audits – brand-scoped RLS (brand_id TEXT, immutable log)
-- ============================================================================

ALTER TABLE advisor_review_audits ENABLE ROW LEVEL SECURITY;

-- Brand members can view advisor reviews
CREATE POLICY "Brand members can view advisor reviews"
  ON advisor_review_audits FOR SELECT
  USING (is_brand_member_text(brand_id));

-- Only system/service role can insert (AI advisor)
CREATE POLICY "System can insert advisor reviews"
  ON advisor_review_audits FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- No UPDATE/DELETE policies (immutable log)

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION is_brand_member_text IS 'Helper function to check brand membership for TEXT brand_id columns. Used by persistence schema tables.';
COMMENT ON FUNCTION is_workspace_member IS 'Helper function to check workspace membership via brands → brand_members relationship. Used by milestones table.';

COMMENT ON POLICY "Users can view workspace milestones" ON milestones IS 'Users can view milestones for workspaces they belong to (via brand membership)';
COMMENT ON POLICY "System can insert milestones" ON milestones IS 'Service role or brand owners/admins can insert milestones';
COMMENT ON POLICY "Users can acknowledge workspace milestones" ON milestones IS 'Users can acknowledge milestones for their workspace';

COMMENT ON POLICY "Brand members can view strategy briefs" ON strategy_briefs IS 'Brand members can view AI-generated strategy briefs for their brands';
COMMENT ON POLICY "System can insert strategy_briefs" ON strategy_briefs IS 'Service role or brand owners/admins can insert strategy briefs';
COMMENT ON POLICY "Admins can manage strategy_briefs" ON strategy_briefs IS 'Only brand owners/admins can update/delete strategy briefs';

COMMENT ON POLICY "Brand members can view content packages" ON content_packages IS 'Brand members can view AI-generated content packages for their brands';
COMMENT ON POLICY "System can insert content packages" ON content_packages IS 'Service role or brand members with creator+ role can insert content packages';
COMMENT ON POLICY "Brand members can update content packages" ON content_packages IS 'Brand members can update content packages (for approval workflow)';

COMMENT ON POLICY "Brand members can view brand history" ON brand_history IS 'Brand members can view immutable audit log of AI agent actions';
COMMENT ON POLICY "System can insert brand history" ON brand_history IS 'Service role or brand owners/admins can insert brand history (immutable log)';

COMMENT ON POLICY "Users can view own payment attempts" ON payment_attempts IS 'Users can view their own payment attempts (sensitive financial data)';
COMMENT ON POLICY "System can insert payment attempts" ON payment_attempts IS 'Service role or users can create payment attempts';
COMMENT ON POLICY "System can update payment attempts" ON payment_attempts IS 'Service role or users can update their own payment attempts';

COMMENT ON POLICY "Users can view own archived data" ON archived_data IS 'Users can view their own archived data (90-day retention)';
COMMENT ON POLICY "Brand members can view archived data" ON archived_data IS 'Brand members can view archived data for their brands (if brand_id is present)';
COMMENT ON POLICY "System can insert archived data" ON archived_data IS 'Service role can insert archived data (archival process)';
COMMENT ON POLICY "System can update archived data" ON archived_data IS 'Service role can update archived data (for restoration flag)';

COMMENT ON POLICY "Users can view their tenants" ON tenants IS 'Users can view tenants they belong to (via brand membership)';
COMMENT ON POLICY "System can create tenants" ON tenants IS 'Service role can create tenants';
COMMENT ON POLICY "System can manage tenants" ON tenants IS 'Service role can update/delete tenants';

COMMENT ON POLICY "Brand members can view success patterns" ON brand_success_patterns IS 'Brand members can view AI-learned success patterns for their brands';
COMMENT ON POLICY "System can manage success patterns" ON brand_success_patterns IS 'Service role or brand owners/admins can manage success patterns';

COMMENT ON POLICY "Brand members can view collaboration logs" ON collaboration_logs IS 'Brand members can view immutable log of AI agent collaborations';
COMMENT ON POLICY "System can insert collaboration logs" ON collaboration_logs IS 'Service role can insert collaboration logs (immutable log)';

COMMENT ON POLICY "Brand members can view performance logs" ON performance_logs IS 'Brand members can view analytics performance logs for their brands';
COMMENT ON POLICY "System can insert performance logs" ON performance_logs IS 'Service role can insert performance logs (analytics sync)';

COMMENT ON POLICY "Brand members can view platform insights" ON platform_insights IS 'Brand members can view platform-specific analytics insights';
COMMENT ON POLICY "System can manage platform insights" ON platform_insights IS 'Service role or brand owners/admins can manage platform insights';

COMMENT ON POLICY "Brand members can view token health" ON token_health IS 'Brand members can view OAuth token health status (sensitive)';
COMMENT ON POLICY "System/admins can manage token health" ON token_health IS 'Service role or brand owners/admins can manage token health';

COMMENT ON POLICY "Brand members can view weekly summaries" ON weekly_summaries IS 'Brand members can view weekly performance summaries';
COMMENT ON POLICY "System can manage weekly summaries" ON weekly_summaries IS 'Service role can manage weekly summaries (report generation)';

COMMENT ON POLICY "Brand members can view advisor reviews" ON advisor_review_audits IS 'Brand members can view AI advisor review audits';
COMMENT ON POLICY "System can insert advisor reviews" ON advisor_review_audits IS 'Service role can insert advisor reviews (AI advisor)';

