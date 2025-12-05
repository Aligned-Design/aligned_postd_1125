-- ============================================================================
-- Migration 013: Refresh Schema Cache After Dropping brand_safety_configs
-- Created: 2025-12-03
-- Purpose: Force Supabase PostgREST to refresh its schema cache
-- Prerequisites: 
--   - Migration 012 (dropped brand_safety_configs table)
-- ============================================================================
--
-- PROBLEM:
-- After dropping brand_safety_configs table, Supabase's PostgREST schema cache
-- may still reference it, causing "Could not find the table in the schema cache" errors.
--
-- SOLUTION:
-- Notify PostgREST to reload the schema by touching a system table.
-- This is a no-op operation that forces a schema cache refresh.
-- ============================================================================

-- Force PostgREST to reload schema cache
-- This is done by performing a harmless operation that triggers schema reload
NOTIFY pgrst, 'reload schema';

-- Alternative: Touch a system table (also triggers cache refresh)
-- SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'public';

-- ============================================================================
-- Note: In Supabase Dashboard, you can also manually refresh the schema cache:
-- 1. Go to Settings → API
-- 2. Click "Reload Schema" or wait a few minutes for auto-refresh
-- ============================================================================

