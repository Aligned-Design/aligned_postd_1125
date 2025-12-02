-- ============================================================================
-- MEDIA_ASSETS TABLE VERIFICATION
-- ============================================================================
-- This table is CRITICAL for scraped image persistence.
-- If it's missing or wrong, you'll get "Found 15 images but none persisted"
-- ============================================================================

-- STEP 1: Verify table exists and get column structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'media_assets'
ORDER BY ordinal_position;

-- STEP 2: Verify all required columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'media_assets'
  AND column_name IN (
    'id',
    'brand_id',
    'tenant_id',
    'category',
    'filename',
    'path',
    'hash',
    'mime_type',
    'size_bytes',
    'metadata',
    'status',
    'used_in',
    'usage_count',
    'created_at',
    'updated_at'
  );

-- Expected: Should return 15 rows (one for each required column)

-- STEP 3: Check if status column exists (added in migration 007)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'media_assets' 
        AND column_name = 'status'
    ) 
    THEN '✅ status column exists' 
    ELSE '❌ status column MISSING - apply migration 007' 
  END as status_check;

-- STEP 4: Verify table has data (optional - for existing deployments)
SELECT 
  COUNT(*) as total_rows,
  COUNT(DISTINCT brand_id) as brands_with_assets,
  COUNT(*) FILTER (WHERE path LIKE 'http%') as scraped_images,
  COUNT(*) FILTER (WHERE category = 'logos') as logos,
  COUNT(*) FILTER (WHERE category = 'images') as brand_images
FROM media_assets
WHERE status = 'active';

-- ============================================================================
-- IF TABLE IS MISSING OR WRONG:
-- ============================================================================
-- 1. Apply migration: supabase/migrations/001_bootstrap_schema.sql
-- 2. Apply migration: supabase/migrations/007_add_media_assets_status_and_rls.sql
-- 3. Re-run verification queries above
-- ============================================================================

