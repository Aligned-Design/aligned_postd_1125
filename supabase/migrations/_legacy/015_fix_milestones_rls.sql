-- Fix Milestones RLS Policies
-- The milestones table uses workspace_id, but RLS policies need to check user access
-- This migration replaces the permissive policies with proper tenant-scoped RLS

-- Enable RLS (if not already enabled)
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies (from 20250120_create_milestones_table.sql)
DROP POLICY IF EXISTS "Users can read own workspace milestones" ON public.milestones;
DROP POLICY IF EXISTS "System can insert milestones" ON public.milestones;
DROP POLICY IF EXISTS "Users can acknowledge milestones" ON public.milestones;

-- Drop policies from 20250112_milestones_rls.sql that reference non-existent columns
DROP POLICY IF EXISTS milestones_read ON public.milestones;
DROP POLICY IF EXISTS milestones_insert ON public.milestones;
DROP POLICY IF EXISTS milestones_update ON public.milestones;
DROP POLICY IF EXISTS milestones_delete ON public.milestones;

-- Policy: Users can read milestones for workspaces they belong to
-- A user has access if:
-- 1. They are a member of a brand that belongs to the workspace (via tenant_id)
-- 2. OR the workspace_id matches their tenant_id (for single-tenant workspaces)
CREATE POLICY milestones_read ON public.milestones
  FOR SELECT
  USING (
    -- User must be authenticated
    auth.uid() IS NOT NULL
    AND (
      -- Check if user is a member of a brand in this workspace
      EXISTS (
        SELECT 1 FROM public.brand_members bm
        INNER JOIN public.brands b ON b.id = bm.brand_id
        WHERE bm.user_id = auth.uid()::uuid
          AND (b.tenant_id::text = milestones.workspace_id OR b.id::text = milestones.workspace_id)
      )
      -- OR workspace_id matches user's tenant_id (if stored in user_profiles or JWT)
      OR milestones.workspace_id = auth.jwt() ->> 'tenant_id'
      OR milestones.workspace_id = auth.jwt() ->> 'workspace_id'
    )
  );

-- Policy: System and admins can insert milestones
-- Milestones are created by automated system processes or by workspace admins
CREATE POLICY milestones_insert ON public.milestones
  FOR INSERT
  WITH CHECK (
    -- Either system account (service role)
    auth.role() = 'service_role'
    -- OR user is a brand member with admin/owner role for this workspace
    OR (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.brand_members bm
        INNER JOIN public.brands b ON b.id = bm.brand_id
        WHERE bm.user_id = auth.uid()::uuid
          AND (b.tenant_id::text = new.workspace_id OR b.id::text = new.workspace_id)
          AND bm.role IN ('owner', 'admin')
      )
    )
  );

-- Policy: Users can acknowledge (update) milestones they have access to
CREATE POLICY milestones_update ON public.milestones
  FOR UPDATE
  USING (
    -- User must have access to the milestone's workspace
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.brand_members bm
        INNER JOIN public.brands b ON b.id = bm.brand_id
        WHERE bm.user_id = auth.uid()::uuid
          AND (b.tenant_id::text = milestones.workspace_id OR b.id::text = milestones.workspace_id)
      )
      OR milestones.workspace_id = auth.jwt() ->> 'tenant_id'
      OR milestones.workspace_id = auth.jwt() ->> 'workspace_id'
    )
  )
  WITH CHECK (
    -- Same check for the updated row
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.brand_members bm
        INNER JOIN public.brands b ON b.id = bm.brand_id
        WHERE bm.user_id = auth.uid()::uuid
          AND (b.tenant_id::text = new.workspace_id OR b.id::text = new.workspace_id)
      )
      OR new.workspace_id = auth.jwt() ->> 'tenant_id'
      OR new.workspace_id = auth.jwt() ->> 'workspace_id'
    )
    -- Prevent changing workspace_id or key (only acknowledge_at can be updated)
    AND new.workspace_id = milestones.workspace_id
    AND new.key = milestones.key
  );

-- Policy: Prevent deletion of milestones by regular users (only admin/system can delete)
CREATE POLICY milestones_delete ON public.milestones
  FOR DELETE
  USING (
    -- Only service role (system) or workspace admins
    auth.role() = 'service_role'
    OR (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.brand_members bm
        INNER JOIN public.brands b ON b.id = bm.brand_id
        WHERE bm.user_id = auth.uid()::uuid
          AND (b.tenant_id::text = milestones.workspace_id OR b.id::text = milestones.workspace_id)
          AND bm.role IN ('owner', 'admin')
      )
    )
  );

-- Add comment explaining the RLS strategy
COMMENT ON TABLE public.milestones IS 
  'Tracks user milestone achievements. RLS ensures users only see milestones for workspaces they belong to via brand membership or tenant association.';

