# Brand Safety Config Schema Fix - Summary

## Problem Identified

The Doc Agent endpoint was failing with:
```
Could not find the table 'public.brand_safety_configs'
```

Even though the code correctly queries `brands.safety_config` (JSONB column), not a separate table.

## Investigation Results

### Step 1: Found All References to `brand_safety_configs`

**Files Found:**
1. `server/routes/agents.ts` (line 222) - Error handling code that checks for this error message
2. `POSTD_SUPABASE_POST_AUDIT_GUARDIAN_REPORT.md` (line 748) - Documentation noting code bug was fixed
3. `supabase/migrations/011_add_missing_tables_and_columns.sql` (line 179, 233) - Comments noting code bug
4. `docs/SUPABASE_TABLES_REQUIRED.md` (line 144) - Incorrectly lists `brand_safety_configs` as a table

**No Actual Database Objects Found:**
- ❌ No `CREATE TABLE brand_safety_configs` statements
- ❌ No RLS policies referencing `brand_safety_configs`
- ❌ No views referencing `brand_safety_configs`
- ❌ No functions referencing `brand_safety_configs`
- ❌ No triggers referencing `brand_safety_configs`

**Conclusion:** The error is likely from a ghost reference in Supabase's schema cache or from documentation/comment confusion.

### Step 2: Confirmed Intended Design

**Canonical Source:** `brands.safety_config` (JSONB column)

- ✅ Migration 011 adds `brands.safety_config` column
- ✅ Archived migration `20250117_create_agent_safety_tables.sql` correctly adds it
- ✅ Code in `server/routes/agents.ts` correctly queries `brands.safety_config`
- ✅ TypeScript interface `BrandSafetyConfig` matches the JSONB structure

**No separate table exists or should exist.**

### Step 3: Migration Strategy

Created migration `012_fix_brand_safety_configs_ghost.sql` that:
1. ✅ Safely drops any views referencing `brand_safety_configs` (if they exist)
2. ✅ Safely drops any functions referencing `brand_safety_configs` (if they exist)
3. ✅ Safely drops any triggers referencing `brand_safety_configs` (if they exist)
4. ✅ Safely drops any RLS policies on `brand_safety_configs` (if they exist)
5. ✅ Safely drops `brand_safety_configs` table itself (if it exists)
6. ✅ Ensures `brands.safety_config` column exists and is documented
7. ✅ Verifies no remaining references

**All operations are idempotent and safe to run multiple times.**

### Step 4: Documentation Updates

1. ✅ Created `docs/BRAND_SAFETY_SCHEMA_NOTES.md` - Documents intended design
2. ✅ Created `docs/BRAND_SAFETY_SCHEMA_FIX.md` - Application and verification guide
3. ✅ Updated `docs/SUPABASE_TABLES_REQUIRED.md` - Fixed table listing
4. ✅ Updated `supabase/migrations/011_add_missing_tables_and_columns.sql` - Fixed comments

## Files Changed

### New Files
1. `supabase/migrations/012_fix_brand_safety_configs_ghost.sql` - Migration to remove ghost references
2. `docs/BRAND_SAFETY_SCHEMA_NOTES.md` - Schema design documentation
3. `docs/BRAND_SAFETY_SCHEMA_FIX.md` - Fix application guide

### Updated Files
1. `docs/SUPABASE_TABLES_REQUIRED.md` - Fixed table listing
2. `supabase/migrations/011_add_missing_tables_and_columns.sql` - Fixed comments

## Verification Steps

After applying migration:

1. **Verify column exists:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns
   WHERE table_name = 'brands' AND column_name = 'safety_config';
   ```

2. **Verify table doesn't exist:**
   ```sql
   SELECT to_regclass('public.brand_safety_configs');
   -- Should return NULL
   ```

3. **Test query:**
   ```sql
   SELECT safety_config, brand_kit FROM brands LIMIT 1;
   -- Should work without errors
   ```

4. **Test Doc Agent:**
   ```bash
   export ACCESS_TOKEN="your_token"
   export BRAND_ID="your_brand_id"
   pnpm tsx scripts/api-doc-agent-smoke.ts
   ```
   - Should NOT show `brand_safety_configs` error
   - Should progress to generation or proper validation errors

## Expected Outcome

✅ **Schema aligned:** No references to `brand_safety_configs` table  
✅ **Column accessible:** `brands.safety_config` works correctly  
✅ **Doc Agent works:** Endpoint no longer fails with schema errors  
✅ **Documentation accurate:** All docs reflect correct design  

## Next Steps

1. Apply migration: `supabase db push` or run migration file
2. Verify using SQL queries above
3. Test Doc Agent endpoint
4. Commit changes with message: `fix: remove legacy brand_safety_configs dependencies and align safety config to brands.safety_config`

