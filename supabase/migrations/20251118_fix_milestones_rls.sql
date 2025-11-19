-- 20251118_fix_milestones_rls.sql
-- Purpose: Enforce brand-scoped RLS on milestones to prevent cross-brand access.
-- This migration replaces any existing permissive policies with proper brand-based access control.

-- Ensure RLS is enabled
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive or incorrect policies
DROP POLICY IF EXISTS "Users can read own workspace milestones" ON milestones;
DROP POLICY IF EXISTS "System can insert milestones" ON milestones;
DROP POLICY IF EXISTS "Users can acknowledge milestones" ON milestones;
DROP POLICY IF EXISTS milestones_read ON milestones;
DROP POLICY IF EXISTS milestones_insert ON milestones;
DROP POLICY IF EXISTS milestones_update ON milestones;
DROP POLICY IF EXISTS milestones_delete ON milestones;

-- Policy: Users can view milestones only for brands they belong to
-- This ensures users in Brand A cannot see milestones for Brand B
CREATE POLICY "Users can view milestones for their brands"
  ON milestones
  FOR SELECT
  USING (
    -- Check if user is a member of the milestone's brand
    EXISTS (
      SELECT 1
      FROM brand_members
      WHERE brand_members.user_id = auth.uid()
        AND brand_members.brand_id = milestones.brand_id
    )
    -- OR if milestones use workspace_id, check via brand's tenant_id
    OR (
      milestones.workspace_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM brand_members bm
        INNER JOIN brands b ON b.id = bm.brand_id
        WHERE bm.user_id = auth.uid()
          AND (b.tenant_id::text = milestones.workspace_id OR b.id::text = milestones.workspace_id)
      )
    )
  );

-- Policy: Admins/managers/owners can insert milestones for their brands
-- Viewers cannot create milestones (will get 403)
CREATE POLICY "Managers can create milestones"
  ON milestones
  FOR INSERT
  WITH CHECK (
    -- Service role (system) can always insert
    auth.role() = 'service_role'
    -- OR user is a member with admin/manager/owner role
    OR EXISTS (
      SELECT 1
      FROM brand_members
      WHERE brand_members.user_id = auth.uid()
        AND brand_members.brand_id = COALESCE(new.brand_id, (
          SELECT id FROM brands 
          WHERE tenant_id::text = new.workspace_id OR id::text = new.workspace_id 
          LIMIT 1
        ))
        AND brand_members.role IN ('admin', 'manager', 'owner')
    )
  );

-- Policy: Managers can update milestones (e.g., acknowledge them)
CREATE POLICY "Managers can update milestones"
  ON milestones
  FOR UPDATE
  USING (
    -- User must be a member of the milestone's brand
    EXISTS (
      SELECT 1
      FROM brand_members
      WHERE brand_members.user_id = auth.uid()
        AND brand_members.brand_id = COALESCE(milestones.brand_id, (
          SELECT id FROM brands 
          WHERE tenant_id::text = milestones.workspace_id OR id::text = milestones.workspace_id 
          LIMIT 1
        ))
    )
  )
  WITH CHECK (
    -- Same check for the updated row
    EXISTS (
      SELECT 1
      FROM brand_members
      WHERE brand_members.user_id = auth.uid()
        AND brand_members.brand_id = COALESCE(new.brand_id, (
          SELECT id FROM brands 
          WHERE tenant_id::text = new.workspace_id OR id::text = new.workspace_id 
          LIMIT 1
        ))
    )
    -- Prevent changing workspace_id or key (only acknowledge_at can be updated)
    AND (new.workspace_id IS NULL OR new.workspace_id = milestones.workspace_id)
    AND new.key = milestones.key
  );

-- Policy: Only admins/owners can delete milestones
CREATE POLICY "Managers can delete milestones"
  ON milestones
  FOR DELETE
  USING (
    -- Service role (system) can always delete
    auth.role() = 'service_role'
    -- OR user is an admin/owner of the milestone's brand
    OR EXISTS (
      SELECT 1
      FROM brand_members
      WHERE brand_members.user_id = auth.uid()
        AND brand_members.brand_id = COALESCE(milestones.brand_id, (
          SELECT id FROM brands 
          WHERE tenant_id::text = milestones.workspace_id OR id::text = milestones.workspace_id 
          LIMIT 1
        ))
        AND brand_members.role IN ('admin', 'owner')
    )
  );

-- Add comment explaining the RLS strategy
COMMENT ON TABLE milestones IS 
  'Tracks user milestone achievements. RLS ensures users only see milestones for brands they belong to via brand_members. Viewers can read but not create/update/delete.';

