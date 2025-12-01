-- ============================================================================
-- MIGRATION 007: Add status column and RLS policies to media_assets
-- Created: 2025-01-30
-- Description: 
--   1. Adds status column to media_assets table (required by code queries)
--   2. Adds INSERT and UPDATE RLS policies for media_assets
--   3. Adds index for status lookups
-- ============================================================================

-- STEP 1: Add status column with default 'active'
ALTER TABLE media_assets
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- STEP 2: Backfill any existing rows that might have NULL status (safety check)
UPDATE media_assets
SET status = 'active'
WHERE status IS NULL;

-- STEP 3: Add index for status lookups per brand (improves query performance)
CREATE INDEX IF NOT EXISTS idx_media_assets_brand_status
ON media_assets (brand_id, status);

-- STEP 4: Add INSERT policy for brand members (only if it doesn't exist)
-- Allows users to insert media assets for brands they belong to
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Brand members can insert media assets'
      AND tablename = 'media_assets'
  ) THEN
    CREATE POLICY "Brand members can insert media assets"
    ON media_assets
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM brand_members
        WHERE brand_members.brand_id = media_assets.brand_id
          AND brand_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- STEP 5: Add UPDATE policy for brand members (only if it doesn't exist)
-- Allows users to update media assets for brands they belong to
-- Useful for soft deletes (status = 'deleted') or metadata updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Brand members can update media assets'
      AND tablename = 'media_assets'
  ) THEN
    CREATE POLICY "Brand members can update media assets"
    ON media_assets
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1
        FROM brand_members
        WHERE brand_members.brand_id = media_assets.brand_id
          AND brand_members.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM brand_members
        WHERE brand_members.brand_id = media_assets.brand_id
          AND brand_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Note: Service-role key bypasses RLS by default in Supabase
-- No explicit policy needed for service-role operations
-- The server-side code (media-db-service.ts, scraped-images-service.ts) 
-- uses service-role key and will not be blocked by these policies

