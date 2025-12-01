-- ============================================================================
-- Brand Guide Version History Migration
-- Created: 2025-01-20
-- Description: Creates brand_guide_versions table for tracking Brand Guide changes
--              Includes RLS policies for tenant isolation
-- ============================================================================

-- Brand Guide Versions table
CREATE TABLE IF NOT EXISTS brand_guide_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  brand_guide JSONB NOT NULL DEFAULT '{}'::jsonb, -- Snapshot of Brand Guide at this version
  changed_fields TEXT[] NOT NULL DEFAULT '{}', -- Array of changed field paths (e.g., ['identity.name', 'voiceAndTone.tone'])
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- User who made the change
  change_reason TEXT, -- Optional reason for change
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique version per brand
  UNIQUE (brand_id, version)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_brand_guide_versions_brand_id ON brand_guide_versions(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_guide_versions_version ON brand_guide_versions(brand_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_brand_guide_versions_created_at ON brand_guide_versions(brand_id, created_at DESC);

-- Enable RLS
ALTER TABLE brand_guide_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view version history for brands they are members of
CREATE POLICY "Users can view brand guide versions for their brands"
  ON brand_guide_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = brand_guide_versions.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- RLS Policy: System can insert version history (via service role)
-- Note: This is handled by the server-side code using service role
-- Regular users cannot insert directly (only via API which uses service role)

-- RLS Policy: Users cannot update version history
-- Version history is append-only for audit trail integrity
CREATE POLICY "Version history cannot be updated"
  ON brand_guide_versions
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- RLS Policy: Users cannot delete version history
-- Version history is append-only for audit trail integrity
CREATE POLICY "Version history cannot be deleted"
  ON brand_guide_versions
  FOR DELETE
  USING (false);

-- Add updated_at trigger (for consistency, though updates are blocked)
CREATE TRIGGER update_brand_guide_versions_updated_at
  BEFORE UPDATE ON brand_guide_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add comment
COMMENT ON TABLE brand_guide_versions IS 'Tracks all versions of Brand Guide for audit trail, rollback, and change tracking';
COMMENT ON COLUMN brand_guide_versions.brand_guide IS 'JSONB snapshot of Brand Guide at this version';
COMMENT ON COLUMN brand_guide_versions.changed_fields IS 'Array of field paths that changed in this version (e.g., ["identity.name", "voiceAndTone.tone"])';
COMMENT ON COLUMN brand_guide_versions.changed_by IS 'User ID who made the change (from auth.users)';
COMMENT ON COLUMN brand_guide_versions.change_reason IS 'Optional reason for change (e.g., "Onboarding sync", "User edit")';

