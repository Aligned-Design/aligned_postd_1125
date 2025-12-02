-- Complete Row Level Security policies for milestones table
-- Ensures users can only access milestones for organizations and brands they belong to

-- Enable RLS on milestones table
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies (as noted in audit)
DROP POLICY IF EXISTS "Users can read own workspace milestones" ON public.milestones;
DROP POLICY IF EXISTS "System can insert milestones" ON public.milestones;
DROP POLICY IF EXISTS "Users can acknowledge milestones" ON public.milestones;

-- Policy: Users can read milestones for their organization/brands
-- Milestones are visible to users who are members of the milestone's organization
-- and either have no brand restriction (org-level) or belong to the milestone's brand
CREATE POLICY milestones_read ON public.milestones
  FOR SELECT
  USING (
    -- User must be a member of the organization
    EXISTS (
      SELECT 1 FROM public.brand_members bm
      WHERE bm.user_id = auth.uid()::uuid
        AND bm.brand_id = milestones.brand_id
        AND bm.organization_id = milestones.organization_id
    )
  );

-- Policy: System and admins can insert milestones
-- Milestones are created by automated system processes or by organization admins
CREATE POLICY milestones_insert ON public.milestones
  FOR INSERT
  WITH CHECK (
    -- Either system account (service role)
    auth.role() = 'service_role'
    -- Or user is an organization admin/owner
    OR EXISTS (
      SELECT 1 FROM public.brand_members bm
      WHERE bm.user_id = auth.uid()::uuid
        AND bm.organization_id = new.organization_id
        AND bm.role IN ('owner', 'admin')
    )
  );

-- Policy: Users can acknowledge (update) milestones they have access to
CREATE POLICY milestones_update ON public.milestones
  FOR UPDATE
  USING (
    -- User must have access to the milestone's organization/brand
    EXISTS (
      SELECT 1 FROM public.brand_members bm
      WHERE bm.user_id = auth.uid()::uuid
        AND bm.brand_id = milestones.brand_id
        AND bm.organization_id = milestones.organization_id
    )
  )
  WITH CHECK (
    -- Same check for the updated row
    EXISTS (
      SELECT 1 FROM public.brand_members bm
      WHERE bm.user_id = auth.uid()::uuid
        AND bm.brand_id = new.brand_id
        AND bm.organization_id = new.organization_id
    )
  );

-- Policy: Prevent deletion of milestones by regular users (only admin/system can delete)
CREATE POLICY milestones_delete ON public.milestones
  FOR DELETE
  USING (
    -- Only service role (system) or org admins
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.brand_members bm
      WHERE bm.user_id = auth.uid()::uuid
        AND bm.organization_id = milestones.organization_id
        AND bm.role IN ('owner', 'admin')
    )
  );

-- Add comment explaining the RLS strategy
COMMENT ON TABLE public.milestones IS 
  'Tracks user milestone achievements. RLS ensures users only see milestones for their organization/brand memberships.';
