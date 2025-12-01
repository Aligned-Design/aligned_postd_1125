-- ============================================================================
-- MIGRATION 013: Brand Slug Tenant-Scoped Uniqueness
-- Created: 2025-02-01
-- Description: Change brand slug uniqueness from global to tenant-scoped
-- ============================================================================

-- Drop ALL existing unique constraints and indexes on slug
-- This handles cases where migrations run in different orders
DO $$
BEGIN
  -- Drop the unique constraint if it exists (created via ALTER TABLE ... UNIQUE)
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'brands_slug_key' 
    AND conrelid = 'brands'::regclass
  ) THEN
    ALTER TABLE brands DROP CONSTRAINT brands_slug_key;
    RAISE NOTICE 'Dropped global unique constraint brands_slug_key';
  END IF;

  -- Drop any unique index on slug (might be created by migrations 009 or 012)
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'brands_slug_key' 
    AND tablename = 'brands'
  ) THEN
    DROP INDEX IF EXISTS brands_slug_key;
    RAISE NOTICE 'Dropped unique index brands_slug_key';
  END IF;

  -- Also check for any other unique indexes on slug column
  FOR r IN (
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename = 'brands' 
    AND indexdef LIKE '%slug%' 
    AND indexdef LIKE '%UNIQUE%'
  ) LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname);
    RAISE NOTICE 'Dropped unique index: %', r.indexname;
  END LOOP;
END $$;

-- Ensure slug column exists (without UNIQUE constraint)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS slug TEXT;

-- Drop the old composite index if it exists (in case migration runs twice)
DROP INDEX IF EXISTS brands_slug_tenant_unique;

-- Create composite unique index on (tenant_id, slug)
-- This allows the same slug across different tenants, but ensures uniqueness within a tenant
-- NULL tenant_id values are excluded from the unique constraint
CREATE UNIQUE INDEX brands_slug_tenant_unique 
ON brands(tenant_id, slug)
WHERE tenant_id IS NOT NULL;

-- Add comment to document the constraint
COMMENT ON INDEX brands_slug_tenant_unique IS 
  'Ensures slug uniqueness is scoped to tenant_id. Same slug can exist for different tenants, but not within the same tenant.';

