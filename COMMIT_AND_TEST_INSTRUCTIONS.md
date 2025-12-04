# Commit & Test Instructions

## Current Status

You have two logical changes staged:

### 1. Doc Agent Contract Fix (6 files)
- `server/routes/agents.ts` - Normalization & error handling
- `server/routes/doc-agent.ts` - Legacy endpoint TODO
- `docs/API_USAGE_AND_TESTING.md` - Updated docs
- `scripts/api-doc-agent-smoke.ts` - New smoke test
- `scripts/smoke-agents.ts` - Updated
- `CHANGELOG.md` - Added entry

### 2. Brand Safety Schema Fix (5 files)
- `supabase/migrations/012_fix_brand_safety_configs_ghost.sql` - Migration
- `docs/BRAND_SAFETY_SCHEMA_NOTES.md` - Design docs
- `docs/BRAND_SAFETY_SCHEMA_FIX.md` - Application guide
- `docs/SUPABASE_TABLES_REQUIRED.md` - Fixed table listing
- `BRAND_SAFETY_CONFIG_FIX_SUMMARY.md` - Summary

## Step 1: Apply Migration 012

**Since Supabase CLI has .env parsing issues, use Supabase Dashboard:**

1. Open Supabase Dashboard → SQL Editor
2. Copy entire file: `supabase/migrations/012_fix_brand_safety_configs_ghost.sql`
3. Paste and Run
4. Should see NOTICE messages (not errors)

## Step 2: Verify Schema

Run in Supabase SQL Editor:

```sql
-- Should return NULL (table doesn't exist)
SELECT to_regclass('public.brand_safety_configs');

-- Should return 1 row with safety_config column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'brands'
  AND column_name = 'safety_config';

-- Should work without errors
SELECT safety_config, brand_kit FROM brands LIMIT 1;
```

## Step 3: Test Doc Agent

```bash
export ACCESS_TOKEN="ziOck3plUEehS0Qq/w8JwS9x7lTg+eXa6/Fp2Wl9i1naxhIac7jhnewuZaH3ZSfoVZ7pG3Sf5YKk9d8AE6T8yw=="
export BRAND_ID="e1e20953-f0ea-4bc5-b467-4d94ae4e753c"
pnpm tsx scripts/api-doc-agent-smoke.ts
```

**Expected:** No `brand_safety_configs` error!

## Step 4: Commit Strategy

### Option A: Two Separate Commits (Recommended)

```bash
# Unstage schema fix files temporarily
git reset HEAD supabase/migrations/012_fix_brand_safety_configs_ghost.sql \
  docs/BRAND_SAFETY_SCHEMA_NOTES.md \
  docs/BRAND_SAFETY_SCHEMA_FIX.md \
  docs/SUPABASE_TABLES_REQUIRED.md \
  BRAND_SAFETY_CONFIG_FIX_SUMMARY.md

# Commit 1: Doc Agent fix
git commit -m "fix: align doc agent contract and verify OpenAI integration

- Normalize brandId → brand_id and legacy prompt → input.topic
- Improve Zod validation error reporting
- Update API docs with canonical doc agent contract
- Add doc agent smoke test script
- Mark legacy /api/ai/doc endpoint for future migration"

# Stage schema fix files again
git add supabase/migrations/012_fix_brand_safety_configs_ghost.sql \
  docs/BRAND_SAFETY_SCHEMA_NOTES.md \
  docs/BRAND_SAFETY_SCHEMA_FIX.md \
  docs/SUPABASE_TABLES_REQUIRED.md \
  BRAND_SAFETY_CONFIG_FIX_SUMMARY.md

# Commit 2: Schema fix
git commit -m "fix: remove legacy brand_safety_configs deps and align safety config to brands.safety_config

- Remove ghost references to non-existent brand_safety_configs table
- Ensure brands.safety_config JSONB column is canonical source
- Update documentation to reflect correct schema design
- Add migration to clean up any remaining schema artifacts"

# Push both
git push
```

### Option B: Single Commit (If You Prefer)

```bash
git commit -m "fix: align doc agent contract and remove brand_safety_configs ghost references

- Normalize doc agent request contract (brandId → brand_id, prompt → input.topic)
- Improve Zod validation error reporting
- Update API docs with canonical contract
- Add doc agent smoke test
- Remove legacy brand_safety_configs table references
- Ensure brands.safety_config JSONB is canonical source
- Add migration 012 to clean up schema artifacts"

git push
```

## Step 5: Verify No Secrets Committed

```bash
# Check for any hardcoded tokens/secrets
git diff HEAD --name-only | xargs grep -l "ziOck3plUEehS0Qq\|e1e20953-f0ea" || echo "✅ No secrets found"
```

## Success Criteria

✅ Migration applied without errors  
✅ Schema verification queries pass  
✅ Doc Agent smoke test runs without `brand_safety_configs` error  
✅ Commits are clean and well-organized  
✅ No secrets in committed files  

