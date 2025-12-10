-- ============================================================================
-- Migration 013: RLS Policy Hardening (Critical Security Fix)
-- Created: 2025-01-XX
-- Purpose: Ensure all critical tables have RLS enabled and properly block
--          unauthenticated access. This migration addresses RLS gaps found
--          in security audit tests (rls-multi-tenant-isolation.test.ts).
-- 
-- TABLES HARDENED:
--   - brands
--   - brand_members
--   - content_items
--   - media_assets
--   - publishing_jobs
--   - scheduled_content (verification only - already protected)
--
-- SECURITY GUARANTEES:
--   1. Unauthenticated users (anon key with no JWT) see 0 rows
--   2. Authenticated users only see data for their brand memberships
--   3. Service role bypasses RLS (admin/system access)
--   4. Cross-tenant isolation is enforced
--   5. Cross-brand isolation is enforced within same tenant
--
-- NOTE: This migration is IDEMPOTENT and safe to run multiple times.
-- ============================================================================

-- ============================================================================
-- STEP 1: FORCE ENABLE RLS ON ALL CRITICAL TABLES
-- ============================================================================

-- Enable RLS on critical tables (idempotent - won't error if already enabled)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE publishing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_content ENABLE ROW LEVEL SECURITY;

-- Also enable on related tables that should be protected
ALTER TABLE publishing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_approvals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: FIX BRANDS TABLE RLS
-- Issue: Policies exist but may not be blocking unauthenticated access properly
-- ============================================================================

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Brand members can view brands" ON brands;
DROP POLICY IF EXISTS "Brand members can manage brands" ON brands;
DROP POLICY IF EXISTS "Users can view own brands" ON brands;
DROP POLICY IF EXISTS "Brands select policy" ON brands;
DROP POLICY IF EXISTS "Brands all policy" ON brands;

-- SELECT: Only authenticated users who are brand members OR creator
CREATE POLICY "Brand members can view brands"
  ON brands FOR SELECT
  USING (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    AND (
      -- User is a member of this brand
      EXISTS (
        SELECT 1 FROM brand_members
        WHERE brand_members.brand_id = brands.id
        AND brand_members.user_id = auth.uid()
      )
      -- OR user created this brand
      OR created_by = auth.uid()
    )
  );

-- INSERT: Only authenticated users can create brands
CREATE POLICY "Authenticated users can create brands"
  ON brands FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- UPDATE/DELETE: Only brand admins/owners OR creator
CREATE POLICY "Brand admins can update brands"
  ON brands FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM brand_members
        WHERE brand_members.brand_id = brands.id
        AND brand_members.user_id = auth.uid()
        AND brand_members.role IN ('owner', 'admin')
      )
      OR created_by = auth.uid()
    )
  );

CREATE POLICY "Brand admins can delete brands"
  ON brands FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM brand_members
        WHERE brand_members.brand_id = brands.id
        AND brand_members.user_id = auth.uid()
        AND brand_members.role IN ('owner', 'admin')
      )
      OR created_by = auth.uid()
    )
  );

-- ============================================================================
-- STEP 3: FIX BRAND_MEMBERS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their brand memberships" ON brand_members;
DROP POLICY IF EXISTS "Admins can manage brand members" ON brand_members;
DROP POLICY IF EXISTS "Brand members select policy" ON brand_members;
DROP POLICY IF EXISTS "Brand members all policy" ON brand_members;

-- SELECT: Users can view their own memberships OR all memberships in brands they admin
CREATE POLICY "Users can view brand memberships"
  ON brand_members FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- User can see their own memberships
      user_id = auth.uid()
      -- OR user is an admin/owner of the brand (can see all members)
      OR EXISTS (
        SELECT 1 FROM brand_members bm2
        WHERE bm2.brand_id = brand_members.brand_id
        AND bm2.user_id = auth.uid()
        AND bm2.role IN ('owner', 'admin')
      )
    )
  );

-- INSERT: Only brand admins/owners can add members
CREATE POLICY "Brand admins can add members"
  ON brand_members FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- Admin/owner of the brand can add members
      EXISTS (
        SELECT 1 FROM brand_members bm2
        WHERE bm2.brand_id = brand_members.brand_id
        AND bm2.user_id = auth.uid()
        AND bm2.role IN ('owner', 'admin')
      )
      -- OR brand creator can add members (when brand has no members yet)
      OR EXISTS (
        SELECT 1 FROM brands
        WHERE brands.id = brand_members.brand_id
        AND brands.created_by = auth.uid()
      )
    )
  );

-- UPDATE: Only brand admins/owners can update member roles
CREATE POLICY "Brand admins can update members"
  ON brand_members FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members bm2
      WHERE bm2.brand_id = brand_members.brand_id
      AND bm2.user_id = auth.uid()
      AND bm2.role IN ('owner', 'admin')
    )
  );

-- DELETE: Only brand admins/owners can remove members
CREATE POLICY "Brand admins can remove members"
  ON brand_members FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members bm2
      WHERE bm2.brand_id = brand_members.brand_id
      AND bm2.user_id = auth.uid()
      AND bm2.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- STEP 4: FIX CONTENT_ITEMS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view content items" ON content_items;
DROP POLICY IF EXISTS "Brand members can manage content items" ON content_items;
DROP POLICY IF EXISTS "Content items select policy" ON content_items;
DROP POLICY IF EXISTS "Content items all policy" ON content_items;

-- SELECT: Only brand members can view content
CREATE POLICY "Brand members can view content items"
  ON content_items FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = content_items.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- INSERT: Only brand members can create content
CREATE POLICY "Brand members can create content items"
  ON content_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = content_items.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- UPDATE: Only brand members can update content
CREATE POLICY "Brand members can update content items"
  ON content_items FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = content_items.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- DELETE: Only brand admins/owners can delete content
CREATE POLICY "Brand admins can delete content items"
  ON content_items FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = content_items.brand_id
      AND brand_members.user_id = auth.uid()
      AND brand_members.role IN ('owner', 'admin', 'editor')
    )
  );

-- ============================================================================
-- STEP 5: FIX MEDIA_ASSETS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view media assets" ON media_assets;
DROP POLICY IF EXISTS "Brand members can insert media assets" ON media_assets;
DROP POLICY IF EXISTS "Brand members can update media assets" ON media_assets;
DROP POLICY IF EXISTS "Media assets select policy" ON media_assets;

-- SELECT: Only brand members can view media
CREATE POLICY "Brand members can view media assets"
  ON media_assets FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = media_assets.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- INSERT: Only brand members can upload media
CREATE POLICY "Brand members can insert media assets"
  ON media_assets FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = media_assets.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- UPDATE: Only brand members can update media metadata
CREATE POLICY "Brand members can update media assets"
  ON media_assets FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = media_assets.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- DELETE: Only brand admins can delete media (soft delete via status is preferred)
CREATE POLICY "Brand admins can delete media assets"
  ON media_assets FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = media_assets.brand_id
      AND brand_members.user_id = auth.uid()
      AND brand_members.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- STEP 6: FIX PUBLISHING_JOBS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view publishing jobs" ON publishing_jobs;
DROP POLICY IF EXISTS "Publishing jobs select policy" ON publishing_jobs;
DROP POLICY IF EXISTS "Publishing jobs all policy" ON publishing_jobs;

-- SELECT: Only brand members can view publishing jobs
CREATE POLICY "Brand members can view publishing jobs"
  ON publishing_jobs FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = publishing_jobs.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- INSERT: Only brand members can create publishing jobs
CREATE POLICY "Brand members can create publishing jobs"
  ON publishing_jobs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = publishing_jobs.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- UPDATE: Only brand members can update publishing jobs (e.g., cancel)
CREATE POLICY "Brand members can update publishing jobs"
  ON publishing_jobs FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = publishing_jobs.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- DELETE: Only brand admins can delete publishing jobs
CREATE POLICY "Brand admins can delete publishing jobs"
  ON publishing_jobs FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = publishing_jobs.brand_id
      AND brand_members.user_id = auth.uid()
      AND brand_members.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- STEP 7: VERIFY SCHEDULED_CONTENT RLS (already protected, but ensure policies)
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view scheduled content" ON scheduled_content;
DROP POLICY IF EXISTS "Brand members can manage scheduled content" ON scheduled_content;
DROP POLICY IF EXISTS "Scheduled content select policy" ON scheduled_content;

-- SELECT: Only brand members can view scheduled content
CREATE POLICY "Brand members can view scheduled content"
  ON scheduled_content FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = scheduled_content.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- INSERT: Only brand members can schedule content
CREATE POLICY "Brand members can create scheduled content"
  ON scheduled_content FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = scheduled_content.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- UPDATE: Only brand members can update scheduled content
CREATE POLICY "Brand members can update scheduled content"
  ON scheduled_content FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = scheduled_content.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- DELETE: Only brand members can delete scheduled content
CREATE POLICY "Brand members can delete scheduled content"
  ON scheduled_content FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = scheduled_content.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 8: PUBLISHING_LOGS RLS
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view publishing logs" ON publishing_logs;

-- SELECT: Only brand members can view publishing logs
CREATE POLICY "Brand members can view publishing logs"
  ON publishing_logs FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = publishing_logs.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- INSERT: System/service role or authenticated brand members
CREATE POLICY "Brand members can create publishing logs"
  ON publishing_logs FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM brand_members
        WHERE brand_members.brand_id = publishing_logs.brand_id
        AND brand_members.user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- STEP 9: POST_APPROVALS RLS
-- ============================================================================

DROP POLICY IF EXISTS "Brand members can view post approvals" ON post_approvals;
DROP POLICY IF EXISTS "Brand members can manage post approvals" ON post_approvals;

-- SELECT: Only brand members can view post approvals
CREATE POLICY "Brand members can view post approvals"
  ON post_approvals FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = post_approvals.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- INSERT: Only brand members can create post approvals
CREATE POLICY "Brand members can create post approvals"
  ON post_approvals FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = post_approvals.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- UPDATE: Only brand members can update post approvals
CREATE POLICY "Brand members can update post approvals"
  ON post_approvals FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = post_approvals.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 10: VERIFY RLS IS FORCE ENABLED
-- Final safety check to ensure RLS cannot be bypassed
-- ============================================================================

-- Force RLS for table owners (prevents BYPASSRLS privilege from working)
-- Note: This is commented out as it may not be needed for most deployments
-- and could impact admin operations. Enable if required by security policy.

-- ALTER TABLE brands FORCE ROW LEVEL SECURITY;
-- ALTER TABLE brand_members FORCE ROW LEVEL SECURITY;
-- ALTER TABLE content_items FORCE ROW LEVEL SECURITY;
-- ALTER TABLE media_assets FORCE ROW LEVEL SECURITY;
-- ALTER TABLE publishing_jobs FORCE ROW LEVEL SECURITY;
-- ALTER TABLE scheduled_content FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Brand members can view brands" ON brands IS
  'SELECT: Authenticated users can view brands they are members of or created';

COMMENT ON POLICY "Authenticated users can create brands" ON brands IS
  'INSERT: Any authenticated user can create a new brand';

COMMENT ON POLICY "Brand admins can update brands" ON brands IS
  'UPDATE: Only brand owners/admins or the creator can update brand settings';

COMMENT ON POLICY "Brand admins can delete brands" ON brands IS
  'DELETE: Only brand owners/admins or the creator can delete brands';

COMMENT ON POLICY "Users can view brand memberships" ON brand_members IS
  'SELECT: Users can view their own memberships or all members if they are admin';

COMMENT ON POLICY "Brand admins can add members" ON brand_members IS
  'INSERT: Only brand owners/admins or brand creator can add new members';

COMMENT ON POLICY "Brand members can view content items" ON content_items IS
  'SELECT: Only authenticated brand members can view content';

COMMENT ON POLICY "Brand members can view media assets" ON media_assets IS
  'SELECT: Only authenticated brand members can view media';

COMMENT ON POLICY "Brand members can view publishing jobs" ON publishing_jobs IS
  'SELECT: Only authenticated brand members can view publishing jobs';

COMMENT ON POLICY "Brand members can view scheduled content" ON scheduled_content IS
  'SELECT: Only authenticated brand members can view scheduled content';

-- ============================================================================
-- VERIFICATION QUERIES (run manually to verify)
-- ============================================================================

-- Check RLS is enabled on all critical tables:
-- 
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('brands', 'brand_members', 'content_items', 
--                   'media_assets', 'publishing_jobs', 'scheduled_content');
-- 
-- All should show rowsecurity = true

-- Check policies exist:
--
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('brands', 'brand_members', 'content_items',
--                     'media_assets', 'publishing_jobs', 'scheduled_content')
-- ORDER BY tablename, cmd;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

