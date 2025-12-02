# Migration Chain Validation Checklist

**Purpose:** Step-by-step validation process for the entire migration chain (001-007 + patch migrations)

**Last Updated:** 2025-01-XX

---

## Prerequisites

### Required Tools

- [ ] Supabase CLI installed (`supabase --version`)
- [ ] Docker Desktop running (required for local Supabase)
- [ ] Database connection available (for production validation)

### Environment Setup

```bash
# Verify Supabase CLI is available
supabase --version

# Verify Docker is running
docker ps

# Navigate to project root
cd /path/to/project
```

---

## Validation Process

### Step 1: Fresh Database Test

**Command:**
```bash
supabase db reset
```

**Expected Result:** ✅ Success
- All migrations (001-007) apply successfully
- No errors in console output
- All objects created (tables, indexes, triggers, policies)

**What to Check:**
- [ ] No "duplicate_object" errors
- [ ] No "duplicate_table" errors  
- [ ] No "column does not exist" errors
- [ ] No syntax errors
- [ ] Migration completes without warnings

**If Errors Occur:**
1. Note which migration failed
2. Check error message for specific issue
3. Review migration file for pattern violations
4. Fix using established patterns
5. Re-run validation

---

### Step 2: Shadow Database Replay Test

**Command:**
```bash
supabase db push
```

**Expected Result:** ✅ Success
- Shadow database created successfully
- All migrations replayed without errors
- Schema diff generated correctly

**What to Check:**
- [ ] No "duplicate_object" errors during replay
- [ ] No "duplicate_table" errors
- [ ] Shadow DB creation succeeds
- [ ] Schema comparison works
- [ ] No unexpected differences

**If Errors Occur:**
1. Note which migration failed during replay
2. This is the critical test - shadow DB replay is what Supabase uses
3. Fix any issues found
4. Re-run validation

---

### Step 3: Idempotency Test

**Purpose:** Verify migrations can run multiple times safely

**Test Process:**
```bash
# Reset to clean state
supabase db reset

# Run first time
supabase db push

# Run second time (should succeed)
supabase db push
```

**Expected Result:** ✅ Both runs succeed
- Second run completes without errors
- No duplicate object warnings
- Database state identical after both runs

**What to Check:**
- [ ] Second `supabase db push` succeeds
- [ ] No errors on second run
- [ ] No warnings about duplicate objects

---

### Step 4: Pattern Compliance Audit

**Manual Verification:**

#### Check CREATE POLICY Statements

```bash
# Search for unwrapped CREATE POLICY statements
grep -r "^CREATE POLICY" supabase/migrations/*.sql | grep -v "DO \$\$"
```

**Expected Result:** ✅ No matches
- All CREATE POLICY should be inside DO $$ blocks
- All should have EXCEPTION WHEN duplicate_object

#### Check CREATE TRIGGER Statements

```bash
# Search for unwrapped CREATE TRIGGER statements
grep -r "^CREATE TRIGGER" supabase/migrations/*.sql | grep -v "DO \$\$"
```

**Expected Result:** ✅ No matches
- All CREATE TRIGGER should be inside DO $$ blocks
- All should have EXCEPTION WHEN duplicate_object

#### Check ADD CONSTRAINT Statements

```bash
# Search for unwrapped ADD CONSTRAINT statements
grep -r "^ALTER TABLE.*ADD CONSTRAINT" supabase/migrations/*.sql | grep -v "DO \$\$"
```

**Expected Result:** ✅ No matches (or only inside DO $$ blocks)
- All ADD CONSTRAINT should be inside DO $$ blocks
- All should have EXCEPTION WHEN duplicate_object

---

## Migration-Specific Checks

### Migration 001 (Baseline)

**Status:** ✅ Locked - Do not modify

**Verification:**
- [ ] File exists: `supabase/migrations/001_bootstrap_schema.sql`
- [ ] All 145 exception handlers present
- [ ] All patterns verified in previous audit

---

### Migration 002

**Status:** ✅ Repaired

**Checks:**
- [ ] All 3 CREATE POLICY wrapped with exception handling
- [ ] CREATE TRIGGER wrapped with exception handling
- [ ] Safe as no-op (001 already creates brand_guide_versions)

---

### Migration 003

**Status:** ✅ Verified Safe

**Checks:**
- [ ] All ADD COLUMN use `IF NOT EXISTS`
- [ ] All CREATE INDEX use `IF NOT EXISTS`
- [ ] UPDATE statements check for NULL first

---

### Migration 004

**Status:** ✅ Repaired

**Checks:**
- [ ] CREATE POLICY wrapped with exception handling

---

### Migration 005

**Status:** ✅ Repaired

**Checks:**
- [ ] All 28 CREATE POLICY wrapped with exception handling
- [ ] All 10 ADD CONSTRAINT wrapped with exception handling
- [ ] DROP POLICY IF EXISTS present before CREATE

---

### Migration 006

**Status:** ✅ Verified Safe

**Checks:**
- [ ] All DROP INDEX use `IF EXISTS`
- [ ] All DROP COLUMN use `IF EXISTS`
- [ ] All DROP FUNCTION use `IF EXISTS`

---

### Migration 007

**Status:** ✅ Repaired

**Checks:**
- [ ] Both CREATE POLICY wrapped with exception handling
- [ ] Uses exception handling pattern (not pg_policies check)

---

### Patch Migration: 20250130_brand_guide_versions_patch.sql

**Status:** ✅ Repaired

**Checks:**
- [ ] CREATE INDEX use `IF NOT EXISTS`
- [ ] CREATE POLICY wrapped with exception handling (3 policies)
- [ ] CREATE TRIGGER wrapped with exception handling

---

## Error Scenarios & Solutions

### Error: "duplicate_object"

**Cause:** Object already exists from previous migration run

**Solution:** ✅ Already fixed - all CREATE statements use exception handling

**Verification:**
- Check migration uses DO $$ + EXCEPTION WHEN duplicate_object
- Re-run validation to confirm fix works

---

### Error: "duplicate_table"

**Cause:** Table/index already exists

**Solution:** ✅ Already fixed - uses IF NOT EXISTS or exception handling

**Verification:**
- Check CREATE TABLE uses `IF NOT EXISTS`
- Check CREATE INDEX uses `IF NOT EXISTS` or exception handling

---

### Error: "column does not exist"

**Cause:** Policy/index references dropped column

**Solution:** ✅ Already fixed in 001 - conditional checks present

**Verification:**
- Check policies reference columns that exist
- Verify conditional checks for dropped columns

---

### Error: "syntax error"

**Cause:** SQL syntax issue in migration file

**Solution:**
- Review migration file syntax
- Check for missing semicolons, quotes, etc.
- Fix syntax error
- Re-run validation

---

## Production Validation

### Pre-Deployment Checklist

- [ ] All validation tests pass locally
- [ ] All migrations follow established patterns
- [ ] Documentation updated
- [ ] Backup created (if production)

### Deployment Steps

1. **Staging First:**
   ```bash
   # Deploy to staging environment
   supabase db push --linked
   ```

2. **Verify in Supabase Studio:**
   - Check "Inspect" view for errors
   - Verify all tables exist
   - Verify all policies are active

3. **Production:**
   ```bash
   # Deploy to production
   supabase db push --linked
   ```

---

## Validation Log Template

### Date: YYYY-MM-DD

**Validation Run:**
- [ ] Fresh database test: ✅ / ❌
- [ ] Shadow DB replay test: ✅ / ❌
- [ ] Idempotency test: ✅ / ❌
- [ ] Pattern compliance audit: ✅ / ❌

**Issues Found:**
- None / List issues

**Actions Taken:**
- None / List fixes applied

**Result:**
- ✅ PASS - All tests successful
- ❌ FAIL - Issues found, see details above

---

## Quick Validation Script

```bash
#!/bin/bash
# Quick validation script for migration chain

echo "=== Migration Chain Validation ==="
echo ""

echo "Step 1: Fresh Database Test"
supabase db reset
if [ $? -eq 0 ]; then
  echo "✅ Fresh database test passed"
else
  echo "❌ Fresh database test failed"
  exit 1
fi

echo ""
echo "Step 2: Shadow DB Replay Test"
supabase db push
if [ $? -eq 0 ]; then
  echo "✅ Shadow DB replay test passed"
else
  echo "❌ Shadow DB replay test failed"
  exit 1
fi

echo ""
echo "Step 3: Pattern Compliance Check"
UNWRAPPED_POLICIES=$(grep -r "^CREATE POLICY" supabase/migrations/*.sql | grep -v "DO \$\$" | wc -l)
UNWRAPPED_TRIGGERS=$(grep -r "^CREATE TRIGGER" supabase/migrations/*.sql | grep -v "DO \$\$" | wc -l)

if [ $UNWRAPPED_POLICIES -eq 0 ] && [ $UNWRAPPED_TRIGGERS -eq 0 ]; then
  echo "✅ Pattern compliance check passed"
else
  echo "❌ Pattern compliance check failed"
  echo "  Unwrapped policies: $UNWRAPPED_POLICIES"
  echo "  Unwrapped triggers: $UNWRAPPED_TRIGGERS"
  exit 1
fi

echo ""
echo "=== All Validation Tests Passed ==="
```

---

## Success Criteria

✅ **Migration chain is production-ready if:**

1. `supabase db reset` completes successfully
2. `supabase db push` completes successfully  
3. All migrations follow established patterns
4. No duplicate_object errors
5. No duplicate_table errors
6. No column does not exist errors
7. All CREATE POLICY/TRIGGER/CONSTRAINT use exception handling

---

**Validation Guide Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Status:** ✅ Ready for Use

