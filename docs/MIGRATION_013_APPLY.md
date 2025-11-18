# Migration 013: Apply Brand Slug Tenant-Scoped Uniqueness

## Problem
The database has a global unique constraint on `brands.slug` which prevents multiple tenants from using the same slug. This causes "duplicate key value violates unique constraint brands_slug_key" errors.

## Solution
Migration 013 changes the uniqueness constraint from global to tenant-scoped, allowing the same slug across different tenants but ensuring uniqueness within a tenant.

## How to Apply

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/013_brand_slug_tenant_unique.sql`
4. Click **Run** to execute the migration

### Option 2: Via Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or run the migration directly
supabase db execute -f supabase/migrations/013_brand_slug_tenant_unique.sql
```

### Option 3: Manual SQL Execution

If you have direct database access, run the SQL from `supabase/migrations/013_brand_slug_tenant_unique.sql` directly.

## What the Migration Does

1. **Drops all existing unique constraints/indexes on `slug`**:
   - Drops `brands_slug_key` constraint if it exists
   - Drops any unique indexes on slug column
   - Handles cases where migrations run in different orders

2. **Creates tenant-scoped unique index**:
   - Creates `brands_slug_tenant_unique` index on `(tenant_id, slug)`
   - Allows same slug across different tenants
   - Ensures uniqueness within each tenant

## Verification

After applying the migration, verify it worked:

```sql
-- Check that the old constraint is gone
SELECT conname FROM pg_constraint 
WHERE conrelid = 'brands'::regclass 
AND conname LIKE '%slug%';

-- Should return no rows (or only the new composite constraint)

-- Check that the new index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'brands' 
AND indexname = 'brands_slug_tenant_unique';

-- Should show the composite unique index
```

## Important Notes

- **This migration is idempotent** - it's safe to run multiple times
- **No data loss** - existing brands are not affected
- **Backward compatible** - code changes handle both old and new constraint types
- **Race condition protection** - application code includes retry logic

## Troubleshooting

If you still get duplicate slug errors after applying the migration:

1. **Check if migration actually ran**:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'brands' AND indexname = 'brands_slug_tenant_unique';
   ```
   If this returns no rows, the migration didn't run.

2. **Check for remaining global constraints**:
   ```sql
   SELECT conname FROM pg_constraint WHERE conrelid = 'brands'::regclass AND conname LIKE '%slug%';
   ```
   If `brands_slug_key` still exists, manually drop it:
   ```sql
   ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_slug_key;
   ```

3. **Re-run migration 013** - it's safe to run multiple times

## After Migration

Once the migration is applied:
- New brands will automatically get unique slugs within their tenant
- Duplicate slugs across different tenants are now allowed
- The application will handle race conditions with retry logic

