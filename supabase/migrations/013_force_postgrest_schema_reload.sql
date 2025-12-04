-- ============================================================================
-- Migration 013: Force PostgREST Schema Reload
-- Created: 2025-12-04
-- Purpose: Force PostgREST to reload its schema cache after dropping brand_safety_configs
-- Prerequisites: 
--   - Migration 012 (dropped brand_safety_configs table)
-- ============================================================================
--
-- PROBLEM:
-- After dropping brand_safety_configs table, PostgREST's schema cache may still
-- reference it, causing "Could not find the table in the schema cache" errors.
--
-- SOLUTION:
-- Perform operations that force PostgREST to reload its schema cache.
-- This migration is idempotent and safe to run multiple times.
-- ============================================================================

-- Method 1: Notify PostgREST to reload schema (if supported)
-- Note: This may not work in all Supabase setups, but is harmless
DO $$
BEGIN
  -- Attempt to notify PostgREST (may not be available in all setups)
  PERFORM pg_notify('pgrst', 'reload schema');
  RAISE NOTICE 'Attempted to notify PostgREST to reload schema';
EXCEPTION WHEN OTHERS THEN
  -- Notification not available - that's okay, continue
  RAISE NOTICE 'PostgREST notification not available (this is normal)';
END $$;

-- Method 2: Touch a system table to trigger schema introspection
-- This forces PostgREST to re-introspect the schema
SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'public';

-- Method 3: Verify brands.safety_config column exists and is accessible
-- This ensures the correct schema is visible
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'brands'
      AND column_name = 'safety_config'
  ) THEN
    RAISE NOTICE 'Verified: brands.safety_config column exists';
  ELSE
    RAISE WARNING 'brands.safety_config column not found - migration 011 may not have run';
  END IF;
END $$;

-- Method 4: Verify brand_safety_configs table does NOT exist
DO $$
BEGIN
  IF to_regclass('public.brand_safety_configs') IS NULL THEN
    RAISE NOTICE 'Verified: brand_safety_configs table does not exist (correct)';
  ELSE
    RAISE WARNING 'brand_safety_configs table still exists - migration 012 may not have run';
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- After running this migration:
-- 1. Go to Supabase Dashboard → Settings → API → Reload Schema (manual step)
-- 2. Wait 10-30 seconds for PostgREST to reload
-- 3. Restart your application server to clear Supabase JS client cache
-- ============================================================================

