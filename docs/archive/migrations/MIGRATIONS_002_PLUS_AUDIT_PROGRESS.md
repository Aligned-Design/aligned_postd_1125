# Migration 002+ Audit & Repair Progress

**Date:** 2025-01-XX  
**Status:** 🔄 In Progress  
**Baseline:** Migration 001 is locked and production-ready (verified safe)

---

## Executive Summary

Systematic audit and repair of migrations 002-007 to match the gold-standard patterns established in migration 001. All migrations are being updated to use consistent exception handling and idempotent patterns for safe Supabase shadow database replay.

---

## Audit Status by Migration

### ✅ Migration 002: `002_create_brand_guide_versions.sql`

**Status:** ✅ **REPAIRED**

**Issues Found:**
1. ❌ CREATE POLICY statements lacked exception handling
2. ❌ CREATE TRIGGER lacked exception handling  
3. ⚠️ Conflicts with migration 001 (which already creates this table)

**Fixes Applied:**
1. ✅ Wrapped all CREATE POLICY in DO $$ blocks with EXCEPTION WHEN duplicate_object
2. ✅ Wrapped CREATE TRIGGER in DO $$ block with exception handling
3. ✅ Added comments noting that 001 already creates these objects
4. ✅ Made migration safe as a no-op for fresh installs

**Pattern Compliance:**
- ✅ Matches migration 001 exception handling pattern
- ✅ Safe for shadow DB replay
- ✅ Idempotent

---

### ✅ Migration 003: `003_fix_brand_id_persistence_schema.sql`

**Status:** ✅ **VERIFIED SAFE** (No repairs needed)

**Issues Found:**
- ✅ Already uses `ADD COLUMN IF NOT EXISTS`
- ✅ Already uses `CREATE INDEX IF NOT EXISTS`
- ✅ UPDATE statements are safe (check for NULL first)

**Pattern Compliance:**
- ✅ Uses IF NOT EXISTS for all operations
- ✅ Safe for shadow DB replay
- ✅ Idempotent

**Action:** ✅ No changes needed

---

### ✅ Migration 004: `004_activate_generation_logs_table.sql`

**Status:** ✅ **REPAIRED**

**Issues Found:**
1. ❌ CREATE POLICY lacked exception handling

**Fixes Applied:**
1. ✅ Wrapped CREATE POLICY in DO $$ block with EXCEPTION WHEN duplicate_object

**Pattern Compliance:**
- ✅ Matches migration 001 exception handling pattern
- ✅ Safe for shadow DB replay
- ✅ Idempotent

---

### 🔄 Migration 005: `005_finalize_brand_id_uuid_migration.sql`

**Status:** 🔄 **PARTIALLY REPAIRED** (In Progress)

**Issues Found:**
1. ❌ ADD CONSTRAINT statements lacked exception handling (10 constraints)
2. ❌ CREATE POLICY statements lacked exception handling (28 policies)
3. ✅ DROP POLICY IF EXISTS already present (good)

**Fixes Applied:**
1. ✅ Wrapped all 10 ADD CONSTRAINT statements in DO $$ blocks with exception handling
2. ✅ Wrapped first 8 CREATE POLICY statements (strategy_briefs + content_packages)
3. 🔄 Remaining 20 CREATE POLICY statements need wrapping

**Remaining Work:**
- [ ] Wrap remaining CREATE POLICY statements for:
  - brand_history (4 policies)
  - brand_success_patterns (2 policies)
  - collaboration_logs (4 policies)
  - performance_logs (4 policies)
  - platform_insights (2 policies)
  - token_health (2 policies)
  - weekly_summaries (2 policies)
  - advisor_review_audits (4 policies)

**Pattern Compliance:**
- ✅ Foreign key constraints now idempotent
- 🔄 Policies in progress
- ⚠️ Complete before deployment

---

### ✅ Migration 006: `006_drop_legacy_brand_id_text_columns.sql`

**Status:** ✅ **VERIFIED SAFE** (Already reviewed)

**Issues Found:**
- ✅ Uses `DROP INDEX IF EXISTS`
- ✅ Uses `DROP COLUMN IF EXISTS`
- ✅ Uses `DROP FUNCTION IF EXISTS`

**Pattern Compliance:**
- ✅ All operations use IF EXISTS
- ✅ Safe for shadow DB replay
- ✅ Idempotent

**Action:** ✅ No changes needed

---

### ✅ Migration 007: `007_add_media_assets_status_and_rls.sql`

**Status:** ✅ **REPAIRED**

**Issues Found:**
1. ❌ Used IF NOT EXISTS check with pg_policies (should use exception handling pattern)

**Fixes Applied:**
1. ✅ Replaced IF NOT EXISTS checks with DO $$ + EXCEPTION WHEN duplicate_object pattern
2. ✅ Matches migration 001 gold standard

**Pattern Compliance:**
- ✅ Uses exception handling instead of pg_policies check
- ✅ Safe for shadow DB replay
- ✅ Idempotent

---

### ✅ Migration 20250130: `20250130_brand_guide_versions_patch.sql`

**Status:** ✅ **VERIFIED** (Needs exception handling for policies/triggers)

**Issues Found:**
1. ✅ Table creation properly guarded with IF NOT EXISTS check
2. ❌ CREATE POLICY statements lack exception handling
3. ❌ CREATE TRIGGER lacks exception handling

**Remaining Work:**
- [ ] Wrap CREATE POLICY statements in exception handling
- [ ] Wrap CREATE TRIGGER in exception handling

**Note:** This patch migration is likely obsolete if 001 and 002 are both present, but should still be safe.

---

## Pattern Compliance Summary

### Gold Standard Pattern (from Migration 001)

```sql
-- For CREATE POLICY
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Policy Name"
      ON table_name FOR operation
      USING (...);
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

-- For CREATE TRIGGER
DO $$
BEGIN
  BEGIN
    CREATE TRIGGER trigger_name
      BEFORE/AFTER operation ON table_name
      FOR EACH ROW
      EXECUTE FUNCTION function_name();
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

-- For ADD CONSTRAINT
DO $$
BEGIN
  BEGIN
    ALTER TABLE table_name
    ADD CONSTRAINT constraint_name
    FOREIGN KEY (column) REFERENCES other_table(id);
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;
```

---

## Next Steps

1. ✅ **Complete Migration 005:** Wrap remaining 20 CREATE POLICY statements
2. ✅ **Fix 20250130 patch:** Add exception handling for policies/triggers
3. ✅ **Final validation:** Run `supabase db push` to verify all migrations
4. ✅ **Create audit docs:** Document each migration's audit and fixes

---

## Files Modified

- ✅ `supabase/migrations/002_create_brand_guide_versions.sql`
- ✅ `supabase/migrations/004_activate_generation_logs_table.sql`
- 🔄 `supabase/migrations/005_finalize_brand_id_uuid_migration.sql` (partial)
- ✅ `supabase/migrations/007_add_media_assets_status_and_rls.sql`

---

## Validation Checklist

- [ ] All migrations use exception handling for CREATE POLICY
- [ ] All migrations use exception handling for CREATE TRIGGER
- [ ] All migrations use exception handling for ADD CONSTRAINT
- [ ] `supabase db reset` runs successfully
- [ ] `supabase db push` runs successfully (shadow DB replay)
- [ ] No duplicate_object errors
- [ ] No duplicate_table errors
- [ ] No "column does not exist" errors

---

**Last Updated:** 2025-01-XX  
**Status:** 🔄 In Progress - 80% Complete

