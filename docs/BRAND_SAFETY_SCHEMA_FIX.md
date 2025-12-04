# Brand Safety Schema Fix - Application & Verification

## Problem

The Doc Agent endpoint was failing with:
```
Could not find the table 'public.brand_safety_configs'
```

This error occurred even though the code correctly queries `brands.safety_config` (JSONB column), not a separate table.

## Root Cause

The database schema had ghost references to a non-existent `brand_safety_configs` table, likely from:
- Cached schema references in Supabase
- Legacy migration artifacts
- Documentation that incorrectly listed it as a table

## Solution

Migration `012_fix_brand_safety_configs_ghost.sql` removes all references to `brand_safety_configs` and ensures the schema aligns with the intended design where `brands.safety_config` (JSONB) is the canonical source.

## Application Steps

### 1. Apply the Migration

**Option A: Using Supabase CLI (Recommended)**
```bash
# From repo root
supabase db push

# Or apply specific migration
supabase migration up
```

**Option B: Using Supabase Dashboard**
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy the contents of `supabase/migrations/012_fix_brand_safety_configs_ghost.sql`
4. Paste and execute

**Option C: Using psql**
```bash
psql $DATABASE_URL -f supabase/migrations/012_fix_brand_safety_configs_ghost.sql
```

### 2. Verify Migration Applied

Run this SQL in Supabase SQL Editor:

```sql
-- Check that brands.safety_config column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'brands'
  AND column_name = 'safety_config';

-- Should return:
-- column_name: safety_config
-- data_type: jsonb
-- is_nullable: YES
-- column_default: (JSONB default value)
```

```sql
-- Verify brand_safety_configs table does NOT exist
SELECT to_regclass('public.brand_safety_configs');

-- Should return: NULL (table doesn't exist)
```

```sql
-- Test querying safety_config (should work without errors)
SELECT 
  id,
  name,
  safety_config,
  brand_kit
FROM brands
LIMIT 1;

-- Should return rows without any "table not found" errors
```

### 3. Test Doc Agent Endpoint

**Run the smoke test:**
```bash
export ACCESS_TOKEN="your_access_token"
export BRAND_ID="your_brand_id"
pnpm tsx scripts/api-doc-agent-smoke.ts
```

**Expected result:**
- ✅ Status: 200 (or other non-500 error if auth/brand issues)
- ✅ No error message about `brand_safety_configs` table
- ✅ Request progresses to actual generation or proper validation errors

**Manual curl test:**
```bash
curl -X POST http://localhost:8080/api/agents/generate/doc \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "YOUR_BRAND_ID",
    "input": {
      "topic": "Write a launch announcement",
      "platform": "linkedin",
      "tone": "professional"
    }
  }'
```

**Expected result:**
- ✅ No `"Could not find the table 'public.brand_safety_configs'"` error
- ✅ Either successful generation OR proper error (auth, validation, etc.)

## Verification Checklist

- [ ] Migration `012_fix_brand_safety_configs_ghost.sql` applied successfully
- [ ] `brands.safety_config` column exists and is JSONB type
- [ ] `brand_safety_configs` table does NOT exist (verified with `to_regclass`)
- [ ] Query `SELECT safety_config, brand_kit FROM brands LIMIT 1` works without errors
- [ ] Doc Agent smoke test no longer shows `brand_safety_configs` error
- [ ] Doc Agent endpoint returns 200 or proper validation/auth errors (not schema errors)

## Troubleshooting

### If migration fails with "relation does not exist"

This is expected and safe. The migration uses `IF EXISTS` and `IF NOT NULL` checks, so it's idempotent. The warnings/notices are informational.

### If error persists after migration

1. **Check Supabase schema cache:**
   - Supabase may cache schema. Try refreshing or waiting a few minutes.

2. **Verify RLS policies:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'brands' 
   AND policyname LIKE '%safety%';
   ```
   - Should not reference `brand_safety_configs`

3. **Check for views:**
   ```sql
   SELECT viewname, definition 
   FROM pg_views 
   WHERE schemaname = 'public' 
   AND definition LIKE '%brand_safety%';
   ```
   - Should return no rows

4. **Check application logs:**
   - The error might be coming from a different code path
   - Verify `server/routes/agents.ts` is using the correct query

### If you see "permission denied" errors

The migration uses `SECURITY DEFINER` functions and should run with service role. If using Supabase Dashboard, ensure you're connected as the service role or have sufficient permissions.

## Success Criteria

✅ **Migration applied:** No errors in migration output  
✅ **Schema clean:** `brand_safety_configs` table does not exist  
✅ **Column exists:** `brands.safety_config` is accessible  
✅ **Query works:** `SELECT safety_config FROM brands` succeeds  
✅ **Doc Agent works:** Endpoint no longer shows schema errors  

## Next Steps After Verification

1. Commit the migration file
2. Update any remaining documentation that references `brand_safety_configs` as a table
3. Monitor Doc Agent endpoint for any remaining issues
4. Consider adding integration tests that verify `brands.safety_config` is used correctly

