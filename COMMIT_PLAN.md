# Commit Plan: Brand Safety Config Schema Fix

## Summary

Complete fix for `brand_safety_configs` ghost table references:
- ✅ Migration to drop table and ensure `brands.safety_config` exists
- ✅ Fallback logic in Doc Agent to handle PostgREST schema cache errors
- ✅ Diagnostic utility to test schema health
- ✅ All tests use canonical contract
- ✅ Documentation updated

## Commits

### Commit 1: Schema Fix Migration
```bash
git add supabase/migrations/012_fix_brand_safety_configs_ghost.sql \
  supabase/migrations/013_force_postgrest_schema_reload.sql \
  docs/BRAND_SAFETY_SCHEMA_NOTES.md \
  docs/BRAND_SAFETY_SCHEMA_FIX.md \
  docs/SUPABASE_TABLES_REQUIRED.md

git commit -m "fix(db): remove legacy brand_safety_configs table and align to brands.safety_config

- Drop brand_safety_configs table if it exists (CASCADE removes all dependencies)
- Ensure brands.safety_config JSONB column exists and is documented
- Add migration to force PostgREST schema reload
- Update documentation to reflect correct schema design
- Zero-ghost-schema state: no references to non-existent table

BREAKING: brand_safety_configs table no longer exists. All code must use brands.safety_config JSONB column."
```

### Commit 2: Fallback Logic & Diagnostics
```bash
git add server/routes/agents.ts \
  scripts/diagnostics/test-supabase-schema.ts

git commit -m "fix(api): add fallback for PostgREST schema cache errors in Doc Agent

- Detect PostgREST schema cache errors (brand_safety_configs references)
- Fallback to DEFAULT_SAFETY_CONFIG when cache is stale
- Log warnings for schema cache issues (non-blocking)
- Add diagnostic utility to test Supabase schema health
- Ensures Doc Agent works even with stale PostgREST cache

The fallback ensures the API continues to function while PostgREST
schema cache refreshes, preventing service disruption."
```

### Commit 3: Cleanup Documentation
```bash
git add BRAND_SAFETY_CONFIG_FIX_SUMMARY.md \
  COMMIT_AND_TEST_INSTRUCTIONS.md

git commit -m "docs: add brand safety config schema fix documentation

- Summary of schema fix and migration strategy
- Commit and test instructions
- Verification steps"
```

## Verification Steps

After committing:

1. **Apply migrations:**
   ```bash
   # In Supabase Dashboard SQL Editor, run:
   # - supabase/migrations/012_fix_brand_safety_configs_ghost.sql
   # - supabase/migrations/013_force_postgrest_schema_reload.sql
   ```

2. **Reload PostgREST schema:**
   - Supabase Dashboard → Settings → API → Reload Schema

3. **Run diagnostic:**
   ```bash
   export SUPABASE_URL="your_url"
   export SUPABASE_SERVICE_ROLE_KEY="your_key"
   export BRAND_ID="your_brand_id"  # optional
   pnpm tsx scripts/diagnostics/test-supabase-schema.ts
   ```

4. **Test Doc Agent:**
   ```bash
   export ACCESS_TOKEN="your_token"
   export BRAND_ID="your_brand_id"
   pnpm tsx scripts/api-doc-agent-smoke.ts
   ```

## Expected Results

✅ Diagnostic utility shows all tests passing  
✅ Doc Agent smoke test succeeds (no brand_safety_configs errors)  
✅ Fallback logic handles schema cache errors gracefully  
✅ Schema is clean (no ghost references)  

## Files Changed

### New Files
- `supabase/migrations/012_fix_brand_safety_configs_ghost.sql` - Drop table migration
- `supabase/migrations/013_force_postgrest_schema_reload.sql` - Force cache reload
- `scripts/diagnostics/test-supabase-schema.ts` - Diagnostic utility
- `docs/BRAND_SAFETY_SCHEMA_NOTES.md` - Schema design docs
- `docs/BRAND_SAFETY_SCHEMA_FIX.md` - Fix application guide
- `BRAND_SAFETY_CONFIG_FIX_SUMMARY.md` - Summary
- `COMMIT_AND_TEST_INSTRUCTIONS.md` - Instructions

### Modified Files
- `server/routes/agents.ts` - Added fallback logic
- `docs/SUPABASE_TABLES_REQUIRED.md` - Fixed table listing
- `supabase/migrations/011_add_missing_tables_and_columns.sql` - Fixed comments

### Deleted Files (Cleanup)
- `supabase/migrations/014_check_brands_rls_policies.sql` - Diagnostic only
- `supabase/migrations/015_find_hidden_references.sql` - Diagnostic only
- Various temporary diagnostic/instruction markdown files

