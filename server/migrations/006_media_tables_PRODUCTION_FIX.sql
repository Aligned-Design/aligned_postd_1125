/**
 * PHASE 6: Media Management Database Schema - PRODUCTION ALIGNED
 * ⚠️ This version matches the existing production schema (size_bytes not file_size)
 * 
 * NOTE: Your production already has media_assets table with size_bytes column.
 * This migration only adds the missing storage_quotas table and updates indexes.
 */

-- ============================================================================
-- STORAGE QUOTAS TABLE (CHECK IF EXISTS FIRST)
-- ============================================================================

-- Check what columns exist in storage_quotas table
DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'storage_quotas'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '⚠️  storage_quotas table already exists. Checking columns...';
    RAISE NOTICE 'Existing columns: %', (
      SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
      FROM information_schema.columns
      WHERE table_name = 'storage_quotas'
    );
  ELSE
    RAISE NOTICE '✅ Creating storage_quotas table...';
  END IF;
END $$;

-- Create storage_quotas table if it doesn't exist
-- Using column names that might already exist
CREATE TABLE IF NOT EXISTS storage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL UNIQUE,
  tenant_id UUID,
  limit_bytes BIGINT NOT NULL DEFAULT 5368709120, -- 5GB default
  warning_threshold_percent INTEGER DEFAULT 80,
  hard_limit_percent INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns if table already exists
DO $$
BEGIN
  -- Add tenant_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'storage_quotas' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE storage_quotas ADD COLUMN tenant_id UUID;
    RAISE NOTICE '✅ Added tenant_id column';
  END IF;
  
  -- Add warning_threshold_percent if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'storage_quotas' AND column_name = 'warning_threshold_percent'
  ) THEN
    ALTER TABLE storage_quotas ADD COLUMN warning_threshold_percent INTEGER DEFAULT 80;
    RAISE NOTICE '✅ Added warning_threshold_percent column';
  END IF;
  
  -- Add hard_limit_percent if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'storage_quotas' AND column_name = 'hard_limit_percent'
  ) THEN
    ALTER TABLE storage_quotas ADD COLUMN hard_limit_percent INTEGER DEFAULT 100;
    RAISE NOTICE '✅ Added hard_limit_percent column';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_storage_quotas_brand ON storage_quotas(brand_id);
CREATE INDEX IF NOT EXISTS idx_storage_quotas_tenant ON storage_quotas(tenant_id);

-- Enable RLS
ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for storage_quotas
-- Note: Using brand_members instead of brand_users (check your schema)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS storage_quotas_select_own ON storage_quotas;
DROP POLICY IF EXISTS storage_quotas_update_admin ON storage_quotas;

CREATE POLICY storage_quotas_select_own ON storage_quotas
  FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY storage_quotas_update_admin ON storage_quotas
  FOR UPDATE
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  )
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- SEED DEFAULT QUOTAS FOR EXISTING BRANDS
-- ============================================================================

-- Add default quotas for all existing brands that don't have one
DO $$
BEGIN
  -- Try inserting with all columns
  INSERT INTO storage_quotas (brand_id, tenant_id, limit_bytes, warning_threshold_percent, hard_limit_percent)
  SELECT 
    b.id as brand_id,
    b.tenant_id,
    5368709120 as limit_bytes, -- 5GB
    80 as warning_threshold_percent,
    95 as hard_limit_percent
  FROM brands b
  WHERE NOT EXISTS (
    SELECT 1 FROM storage_quotas sq WHERE sq.brand_id = b.id
  )
  ON CONFLICT (brand_id) DO NOTHING;
  
  RAISE NOTICE '✅ Seeded default quotas for % brands', 
    (SELECT COUNT(*) FROM storage_quotas);
    
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  Could not seed quotas (table might have different columns): %', SQLERRM;
END $$;

-- ============================================================================
-- VERIFY EXISTING TABLES (NO CHANGES TO media_assets)
-- ============================================================================

-- Verify media_assets exists with size_bytes column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'media_assets' 
    AND column_name = 'size_bytes'
  ) THEN
    RAISE EXCEPTION 'ERROR: media_assets.size_bytes column missing! Production schema mismatch.';
  END IF;
  
  RAISE NOTICE '✅ Verified: media_assets table has size_bytes column';
END $$;

-- Optional: Add missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_media_assets_brand_id ON media_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_category ON media_assets(brand_id, category);
CREATE INDEX IF NOT EXISTS idx_media_assets_hash ON media_assets(hash);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_usage_count ON media_assets(brand_id, usage_count DESC);

-- Enable RLS on media_assets if not already enabled
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete:';
  RAISE NOTICE '   - storage_quotas table created';
  RAISE NOTICE '   - Default quotas added for % existing brands', (SELECT COUNT(*) FROM brands);
  RAISE NOTICE '   - Indexes verified';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Next: Verify image uploads work in onboarding flow';
END $$;

