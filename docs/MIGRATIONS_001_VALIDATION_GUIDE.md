# Migration 001 Bootstrap Schema - Validation Guide

**Purpose:** Step-by-step validation instructions for ensuring migration 001 works correctly with Supabase shadow database replay.

---

## Quick Validation Commands

### 1. Fresh Database Test
```bash
supabase db reset
```
**Expected:** ✅ Migration runs successfully, all 310+ objects created

**What to check:**
- No errors in console output
- All tables exist
- All indexes exist
- All policies exist
- All triggers exist

### 2. Shadow Database Test (Primary Use Case)
```bash
supabase db push
```
**Expected:** ✅ Shadow database created and migrations replayed successfully

**What to check:**
- No "duplicate_object" errors
- No "duplicate_table" errors
- No "column does not exist" errors
- Migration completes successfully

### 3. Idempotency Test
```bash
# Run migration twice in succession
supabase db reset
psql $DATABASE_URL -f supabase/migrations/001_bootstrap_schema.sql
psql $DATABASE_URL -f supabase/migrations/001_bootstrap_schema.sql
```
**Expected:** ✅ Both runs succeed without errors

**What to check:**
- Second run completes without errors
- No duplicate object warnings

### 4. Post-Migration-006 Test (Column Drop Safety)
```bash
# Run full migration sequence including column drops
supabase db reset
supabase migration up --include-all  # Runs through migration 006

# Re-run bootstrap migration
psql $DATABASE_URL -f supabase/migrations/001_bootstrap_schema.sql
```
**Expected:** ✅ Migration succeeds, conditional checks prevent errors

**What to check:**
- No errors referencing `brand_id` columns
- Conditional policies/indexes skip creation (expected behavior)
- Migration completes successfully

---

## Detailed Validation Checklist

### Schema Objects Verification

After running the migration, verify these objects exist:

#### ✅ Extensions (2)
```sql
SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');
-- Expected: 2 rows
```

#### ✅ Functions (3)
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('update_updated_at', 'is_brand_member_text', 'is_workspace_member');
-- Expected: 3 rows
```

#### ✅ Tables (52)
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
-- Expected: 52 tables
```

#### ✅ Indexes (114+)
```sql
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public';
-- Expected: 114+ indexes
```

#### ✅ Triggers (25)
```sql
SELECT COUNT(*) FROM information_schema.triggers 
WHERE trigger_schema = 'public';
-- Expected: 25 triggers
```

#### ✅ RLS Policies (110)
```sql
SELECT COUNT(*) FROM pg_policies 
WHERE schemaname = 'public';
-- Expected: 110 policies
```

---

## Shadow Database Replay Validation

### What Supabase Does

When you run `supabase db push`, Supabase:

1. Creates a shadow database
2. Replays all migrations from scratch
3. Compares shadow DB schema with your local migrations
4. Generates a diff and applies it

### Why Exception Handling Matters

During shadow DB replay:
- Migrations run against a fresh database
- But Supabase may replay them multiple times during diff generation
- Objects may already exist from previous replay attempts
- Exception handling ensures idempotency

### Validation Query

After `supabase db push`, check for any failed objects:

```sql
-- Check for any policies that failed to create
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- Expected: 110 policies, no errors

-- Check for any triggers that failed to create
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
-- Expected: 25 triggers, no errors
```

---

## Error Scenarios to Test

### ✅ Test 1: Duplicate Policy Handling

```sql
-- Try to create a policy that already exists
DO $$
BEGIN
  CREATE POLICY "test_duplicate" ON tenants FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy already exists - handled correctly';
END $$;
```

**Expected:** ✅ Notice message, no error

### ✅ Test 2: Column Existence Check

```sql
-- Verify conditional indexes skip creation when column doesn't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'strategy_briefs'
      AND column_name = 'brand_id'
  ) THEN
    RAISE NOTICE 'Column exists';
  ELSE
    RAISE NOTICE 'Column does not exist - index creation skipped';
  END IF;
END $$;
```

**Expected:** ✅ Correct behavior based on whether column exists

### ✅ Test 3: Exception Handler Coverage

```sql
-- Verify exception handlers catch the right errors
DO $$
BEGIN
  BEGIN
    CREATE INDEX idx_test_duplicate ON brands(created_at);
    RAISE NOTICE 'Index created successfully';
  EXCEPTION
    WHEN duplicate_table OR duplicate_object THEN
      RAISE NOTICE 'Index already exists - handled correctly';
  END;
END $$;
```

**Expected:** ✅ Notice message, no error

---

## Common Issues and Solutions

### Issue: "duplicate_object" errors during replay

**Cause:** Policy/trigger/index already exists  
**Solution:** ✅ Already handled - all objects have exception handling

### Issue: "column does not exist" errors after migration 006

**Cause:** Policy/index references dropped column  
**Solution:** ✅ Already handled - all references have column existence checks

### Issue: Shadow DB replay fails

**Cause:** Missing exception handling or conditional checks  
**Solution:** ✅ Already handled - all objects are properly guarded

---

## Performance Validation

After migration runs, verify indexes are used:

```sql
-- Check index usage (should show indexes being used)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;
```

---

## RLS Policy Validation

Verify RLS is enabled and policies are active:

```sql
-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;
-- Expected: ~40+ tables with RLS enabled

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;
```

---

## Final Validation Checklist

- [ ] Fresh database test passes
- [ ] Shadow database test passes (`supabase db push`)
- [ ] Idempotency test passes (run twice)
- [ ] Post-migration-006 test passes
- [ ] All expected objects exist (extensions, functions, tables, indexes, triggers, policies)
- [ ] No error messages in console
- [ ] RLS policies are active
- [ ] Indexes are created and can be used

---

## Success Criteria

✅ **Migration is production-ready if:**

1. All validation tests pass
2. No errors during shadow DB replay
3. All objects created successfully
4. Exception handling works correctly
5. Conditional checks prevent errors after column drops

---

## Support and Troubleshooting

If validation fails:

1. Check error messages in console
2. Review exception handler patterns
3. Verify column existence checks are present
4. Check migration file syntax
5. Review comprehensive audit report: `docs/MIGRATIONS_001_BOOTSTRAP_COMPREHENSIVE_AUDIT.md`

---

**Validation Guide Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Status:** ✅ Ready for Use

