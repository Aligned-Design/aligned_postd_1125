-- ============================================================================
-- MIGRATION: Create content_drafts table for AI-generated social content
-- Created: 2025-01-XX
-- Description: Stores AI-generated content drafts linked to content plan slots
--              Used by POST /api/agents/generate/social endpoint
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram_feed', 'instagram_reel')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'edited', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Optional: track which user/agent generated this
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_by_agent TEXT DEFAULT 'social-content-agent'
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

-- Index for querying drafts by brand
CREATE INDEX IF NOT EXISTS idx_content_drafts_brand_id ON content_drafts(brand_id);

-- Index for querying drafts by slot (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_content_drafts_slot_id ON content_drafts(slot_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_content_drafts_status ON content_drafts(status);

-- Composite index for common query: get draft for a specific slot
CREATE INDEX IF NOT EXISTS idx_content_drafts_slot_status ON content_drafts(slot_id, status);

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_content_drafts_updated_at ON content_drafts;
CREATE TRIGGER update_content_drafts_updated_at
  BEFORE UPDATE ON content_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;

-- Helper function to check brand membership for content_drafts
CREATE OR REPLACE FUNCTION is_content_draft_brand_member(draft_brand_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM brand_members
    WHERE brand_id = draft_brand_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: SELECT - Brand members can view their brand's drafts
DROP POLICY IF EXISTS content_drafts_select_policy ON content_drafts;
CREATE POLICY content_drafts_select_policy ON content_drafts
  FOR SELECT
  USING (is_content_draft_brand_member(brand_id));

-- Policy: INSERT - Brand members can create drafts for their brands
DROP POLICY IF EXISTS content_drafts_insert_policy ON content_drafts;
CREATE POLICY content_drafts_insert_policy ON content_drafts
  FOR INSERT
  WITH CHECK (is_content_draft_brand_member(brand_id));

-- Policy: UPDATE - Brand members can update their brand's drafts
DROP POLICY IF EXISTS content_drafts_update_policy ON content_drafts;
CREATE POLICY content_drafts_update_policy ON content_drafts
  FOR UPDATE
  USING (is_content_draft_brand_member(brand_id))
  WITH CHECK (is_content_draft_brand_member(brand_id));

-- Policy: DELETE - Brand members can delete their brand's drafts
DROP POLICY IF EXISTS content_drafts_delete_policy ON content_drafts;
CREATE POLICY content_drafts_delete_policy ON content_drafts
  FOR DELETE
  USING (is_content_draft_brand_member(brand_id));

-- ============================================================================
-- 5. COMMENTS
-- ============================================================================

COMMENT ON TABLE content_drafts IS 'Stores AI-generated social content drafts linked to content plan slots';
COMMENT ON COLUMN content_drafts.slot_id IS 'References the content_items record this draft is for';
COMMENT ON COLUMN content_drafts.platform IS 'Target platform: facebook, instagram_feed, or instagram_reel';
COMMENT ON COLUMN content_drafts.payload IS 'JSONB containing the SocialContentPackage data';
COMMENT ON COLUMN content_drafts.status IS 'Draft lifecycle: draft → edited → approved/rejected';

