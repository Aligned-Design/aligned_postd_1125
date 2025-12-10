-- ============================================================================
-- MIGRATION 008: Add excluded column to media_assets for user removal
-- Created: 2025-12-10
-- Description: 
--   1. Adds excluded boolean column to media_assets table
--   2. Allows users to "remove" images from their brand without deleting the record
--   3. This enables soft-delete / hide functionality for the brand images UI
-- ============================================================================

-- STEP 1: Add excluded column with default false
-- This column allows users to hide/remove images from their brand preview
-- without permanently deleting the asset (enables undo)
ALTER TABLE media_assets
ADD COLUMN IF NOT EXISTS excluded BOOLEAN NOT NULL DEFAULT FALSE;

-- STEP 2: Add index for efficient filtering of excluded assets
-- Queries will typically filter WHERE excluded = FALSE
CREATE INDEX IF NOT EXISTS idx_media_assets_excluded
ON media_assets (excluded)
WHERE excluded = TRUE;

-- STEP 3: Add composite index for brand_id + excluded queries
-- Most common query pattern: SELECT * FROM media_assets WHERE brand_id = X AND excluded = FALSE
CREATE INDEX IF NOT EXISTS idx_media_assets_brand_excluded
ON media_assets (brand_id, excluded);

-- Note: Existing RLS policies will continue to work as-is
-- The UPDATE policy "Brand members can update media assets" (from migration 007)
-- already allows brand members to update their assets, including setting excluded = true


