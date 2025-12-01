-- ============================================================================
-- MIGRATION 014: Add metadata column to media_assets if missing
-- Created: 2025-11-18
-- Description: Safely add metadata JSONB column to media_assets table
--              This is optional - code is resilient to missing column
-- ============================================================================

-- Add metadata column if it doesn't exist
-- This is safe to run multiple times (IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'media_assets' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE media_assets 
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE 'Added metadata column to media_assets table';
  ELSE
    RAISE NOTICE 'metadata column already exists in media_assets table';
  END IF;
END $$;

-- Add index on metadata for JSONB queries (optional but helpful)
CREATE INDEX IF NOT EXISTS idx_media_assets_metadata_source 
ON media_assets USING gin ((metadata->>'source'));

CREATE INDEX IF NOT EXISTS idx_media_assets_metadata_role 
ON media_assets USING gin ((metadata->>'role'));

