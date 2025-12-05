# Migration 001 Bootstrap Schema Audit Report

**Date:** 2025-01-XX  
**Migration File:** `supabase/migrations/001_bootstrap_schema.sql`  
**Purpose:** Audit and fix idempotency issues for Supabase shadow database replay safety

---

## Executive Summary

The bootstrap migration `001_bootstrap_schema.sql` contains several statements that can fail when replayed against an existing schema or during Supabase's shadow database creation process. This audit identifies all problematic patterns and documents the fixes applied to make the migration replay-safe and idempotent.

---

## Issues Identified

### 1. Strategy Briefs brand_id Index (Line ~1010)

**Problem:**
```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strategy_briefs' AND column_name = 'brand_id') THEN
    CREATE INDEX IF NOT EXISTS idx_strategy_briefs_brand_id ON strategy_briefs(brand_id);
  END IF;
END $$;
```

**Why it's problematic:**
- The index creation uses `IF NOT EXISTS`, but in a shadow DB replay scenario, the column check might pass (column exists in bootstrap) but the index creation could still fail if:
  - The index was already created in a previous partial replay
  - There's a race condition during shadow DB creation
  - The column exists but the index creation fails for other reasons (permissions, etc.)

**Fix Strategy:**
- Keep the column existence check (needed because migration 006 drops this column)
- Add `EXCEPTION WHEN duplicate_object` handling around the `CREATE INDEX` statement
- This ensures the index creation is truly idempotent

**Similar Issues:**
- Same pattern exists for `content_packages.brand_id` (line ~1018)
- Same pattern exists for `brand_history.brand_id` (line ~1027)
- Same pattern exists for `brand_success_patterns.brand_id` (line ~1036)
- Same pattern exists for `collaboration_logs.brand_id` (line ~1045)
- Same pattern exists for `performance_logs.brand_id` (line ~1054)

---

### 2. CREATE POLICY Statements (110 instances, starting at line ~1252)

**Problem:**
All CREATE POLICY statements are wrapped in DO $$ blocks with `IF NOT EXISTS` checks using `pg_policies`, but they lack exception handling:

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Policy Name'
      AND tablename = 'table_name'
  ) THEN
    CREATE POLICY "Policy Name"
      ON table_name FOR SELECT
      USING (...);
  END IF;
END $$;
```

**Why it's problematic:**
- While `IF NOT EXISTS` checks are good, they can have race conditions in shadow DB scenarios
- If the policy exists but the `pg_policies` query doesn't find it (timing, schema search path issues), the CREATE will fail with `duplicate_object`
- Exception handling is more robust and handles edge cases better
- PostgreSQL doesn't support `CREATE POLICY IF NOT EXISTS` natively

**Fix Strategy:**
- Replace `IF NOT EXISTS` checks with direct `CREATE POLICY` wrapped in `EXCEPTION WHEN duplicate_object`
- This pattern is more reliable for shadow DB replay scenarios
- Keep the same policy names, tables, roles, and USING/WITH CHECK clauses

**Affected Policies (110 total):**
- Lines 1252-3403: All RLS policies for:
  - tenants
  - user_profiles
  - user_preferences
  - brands
  - brand_members
  - brand_guide_versions
  - content_items
  - scheduled_content
  - publishing_jobs
  - publishing_logs
  - post_approvals
  - approval_threads
  - workflow_templates
  - workflow_instances
  - escalation_rules
  - escalation_events
  - client_settings
  - client_comments
  - client_media
  - audit_logs
  - notifications
  - notification_preferences
  - platform_connections
  - platform_sync_logs
  - webhook_events
  - webhook_attempts
  - integration_events
  - webhook_logs
  - analytics_metrics
  - analytics_goals
  - analytics_sync_logs
  - advisor_feedback
  - auto_plans
  - media_assets
  - media_usage_logs
  - brand_assets
  - assets
  - storage_quotas
  - strategy_briefs
  - content_packages
  - brand_history
  - brand_success_patterns
  - collaboration_logs
  - performance_logs
  - platform_insights
  - token_health
  - weekly_summaries
  - advisor_review_audits
  - milestones
  - payment_attempts
  - archived_data
  - payment_notifications

---

### 3. CREATE TRIGGER Statements (24 instances, starting at line ~1114)

**Problem:**
All CREATE TRIGGER statements are bare (not wrapped in exception handling):

```sql
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

**Why it's problematic:**
- If a trigger already exists (from a previous partial replay), `CREATE TRIGGER` will fail with `duplicate_object`
- Shadow DB replay scenarios can create triggers multiple times
- No idempotency protection

**Fix Strategy:**
- Wrap each `CREATE TRIGGER` in a DO $$ block with `EXCEPTION WHEN duplicate_object`
- Use `CREATE OR REPLACE TRIGGER` is not available in PostgreSQL, so exception handling is the correct approach

**Affected Triggers (24 total):**
- Lines 1114-1232: All `update_*_updated_at` triggers
- Line 1514: `update_brand_guide_versions_updated_at` trigger

---

### 4. CREATE EXTENSION Statements (Lines 13-14)

**Current State:**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

**Assessment:**
- These already use `IF NOT EXISTS`, which is good
- However, for maximum robustness in shadow DB scenarios, exception handling could be added
- **Decision:** Keep as-is since `IF NOT EXISTS` is sufficient for extensions and is the standard pattern

---

### 5. CREATE FUNCTION Statements (Lines 21-50+)

**Current State:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Assessment:**
- Uses `CREATE OR REPLACE`, which is idempotent
- **Decision:** No changes needed - this pattern is already safe

---

## Fixes Applied

### Pattern 1: Index Creation with Column Check + Exception Handling

**Before:**
```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'strategy_briefs' AND column_name = 'brand_id') THEN
    CREATE INDEX IF NOT EXISTS idx_strategy_briefs_brand_id ON strategy_briefs(brand_id);
  END IF;
END $$;
```

**After:**
```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'strategy_briefs'
      AND column_name  = 'brand_id'
  ) THEN
    BEGIN
      CREATE INDEX idx_strategy_briefs_brand_id
        ON public.strategy_briefs (brand_id);
    EXCEPTION
      WHEN duplicate_table OR duplicate_object THEN
        -- Index already exists; do nothing
        NULL;
    END;
  END IF;
END $$;
```

**Changes:**
- Added explicit `table_schema = 'public'` check for safety
- Removed `IF NOT EXISTS` (not needed with exception handling)
- Added nested `BEGIN...EXCEPTION...END` block around CREATE INDEX
- Catches both `duplicate_table` and `duplicate_object` errors

---

### Pattern 2: CREATE POLICY with Exception Handling

**Before:**
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Users can view their tenants'
      AND tablename = 'tenants'
  ) THEN
    CREATE POLICY "Users can view their tenants"
      ON tenants FOR SELECT
      USING (...);
  END IF;
END $$;
```

**After:**
```sql
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can view their tenants"
      ON tenants FOR SELECT
      USING (...);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;
```

**Changes:**
- Removed `IF NOT EXISTS` check (exception handling is more reliable)
- Direct `CREATE POLICY` wrapped in exception handler
- Catches `duplicate_object` error
- Policy semantics (name, table, roles, USING/WITH CHECK) remain unchanged

---

### Pattern 3: CREATE TRIGGER with Exception Handling

**Before:**
```sql
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

**After:**
```sql
DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger already exists; do nothing
      NULL;
  END;
END $$;
```

**Changes:**
- Wrapped in DO $$ block with exception handling
- Catches `duplicate_object` error
- Trigger name, table, timing, and function remain unchanged

---

## Summary of Changes

| Category | Count | Status |
|----------|-------|--------|
| Index creations (conditional on column) | 6 | Fixed with exception handling |
| CREATE POLICY statements | 110 | Fixed with exception handling |
| CREATE TRIGGER statements | 24 | Fixed with exception handling |
| CREATE EXTENSION statements | 2 | No change needed (IF NOT EXISTS sufficient) |
| CREATE FUNCTION statements | Multiple | No change needed (CREATE OR REPLACE sufficient) |

---

## Testing Recommendations

After applying these fixes, verify:

1. **Fresh Database:**
   ```bash
   supabase db reset
   ```
   Should complete without errors.

2. **Shadow Database (db push):**
   ```bash
   supabase db push
   ```
   Should complete without errors, even if migrations are replayed.

3. **Partial Replay:**
   - Manually run the migration twice
   - Should succeed both times (idempotent)

4. **Column Drop Scenario:**
   - Run migration 001 (creates index on brand_id)
   - Run migration 006 (drops brand_id column)
   - Re-run migration 001
   - Should succeed (column check prevents index creation)

---

## Future Migration Guidelines

When creating new migrations, follow these patterns:

1. **CREATE POLICY:** Always wrap in DO $$ with EXCEPTION WHEN duplicate_object
2. **CREATE TRIGGER:** Always wrap in DO $$ with EXCEPTION WHEN duplicate_object
3. **CREATE INDEX on potentially-dropped columns:** Use column existence check + exception handling
4. **CREATE EXTENSION:** Use IF NOT EXISTS (sufficient)
5. **CREATE FUNCTION:** Use CREATE OR REPLACE (sufficient)

**Example Template for New Policies:**
```sql
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Policy Name"
      ON table_name FOR operation
      TO role_name
      USING (condition);
  EXCEPTION
    WHEN duplicate_object THEN
      -- Policy already exists; do nothing
      NULL;
  END;
END $$;
```

---

## Notes

- All changes preserve the original schema intent and RLS logic
- No policies, indexes, or triggers were removed or modified semantically
- Only error handling was added to make statements idempotent
- The migration is now safe for Supabase shadow database replay scenarios

