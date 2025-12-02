-- ============================================================================
-- Storage Quotas Migration Verification Script
-- ============================================================================
-- Run this in Supabase SQL Editor to verify the storage_quotas table exists
-- and has the correct schema as defined in 001_bootstrap_schema.sql
-- ============================================================================

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'storage_quotas'
) AS table_exists;

-- 2. Verify table schema (all columns)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'storage_quotas'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Expected Result: 7 rows
-- - id (uuid, NOT NULL, default: gen_random_uuid())
-- - brand_id (uuid, NOT NULL)
-- - tenant_id (uuid, nullable)
-- - limit_bytes (bigint, NOT NULL, default: 5368709120)
-- - used_bytes (bigint, NOT NULL, default: 0)
-- - created_at (timestamp with time zone, NOT NULL, default: NOW())
-- - updated_at (timestamp with time zone, NOT NULL, default: NOW())

-- 3. Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'storage_quotas'
  AND schemaname = 'public';

-- Expected Result: Should include idx_storage_quotas_brand_id

-- 4. Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'storage_quotas'
  AND schemaname = 'public';

-- Expected Result: rowsecurity = true

-- 5. Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'storage_quotas'
  AND schemaname = 'public';

-- Expected Result: At least one SELECT policy exists

-- 6. Verify trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'storage_quotas'
  AND event_object_schema = 'public';

-- Expected Result: Should include update_storage_quotas_updated_at trigger

-- 7. Check for any existing quota rows (optional)
SELECT 
  COUNT(*) as total_quota_rows,
  COUNT(DISTINCT brand_id) as brands_with_quotas
FROM storage_quotas;

-- 8. Verify foreign key constraint to brands table
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'storage_quotas'
  AND tc.table_schema = 'public';

-- Expected Result: Should show foreign key from brand_id to brands(id)

-- ============================================================================
-- Verification Summary
-- ============================================================================
-- If all queries return expected results:
-- ✅ Migration is correctly applied
-- ✅ Table structure matches schema definition
-- ✅ Indexes, RLS, and triggers are in place
-- ✅ Ready for scraped images to persist
-- ============================================================================

