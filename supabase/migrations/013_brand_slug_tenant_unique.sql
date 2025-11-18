-- ============================================================================
-- MIGRATION 013: Brand Slug Tenant-Scoped Uniqueness
-- Created: 2025-02-01
-- Description: Change brand slug uniqueness from global to tenant-scoped
-- ============================================================================

-- Drop the existing global unique constraint on slug
-- First, check if the constraint exists and drop it
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

  -- Also check for unique index that might have been created
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'brands_slug_key' 
    AND tablename = 'brands'
  ) THEN
    DROP INDEX IF EXISTS brands_slug_key;
    RAISE NOTICE 'Dropped unique index brands_slug_key';
  END IF;
END $$;

-- Create composite unique index on (tenant_id, slug)
-- This allows the same slug across different tenants, but ensures uniqueness within a tenant
CREATE UNIQUE INDEX IF NOT EXISTS brands_slug_tenant_unique 
ON brands(tenant_id, slug);

-- Add comment to document the constraint
COMMENT ON INDEX brands_slug_tenant_unique IS 
  'Ensures slug uniqueness is scoped to tenant_id. Same slug can exist for different tenants, but not within the same tenant.';

