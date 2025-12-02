# Bootstrap Migration QA Report

**Date**: 2025-01-XX  
**Migration File**: `supabase/migrations/001_bootstrap_schema.sql`  
**QA Engineer**: PostgreSQL/Supabase Security QA  
**Status**: ✅ **PASS WITH MINOR ISSUES**

---

## Executive Summary

### Overall Verdict: ✅ **PASS** (with minor issues)

The bootstrap migration **001_bootstrap_schema.sql** is **largely correct** and aligns well with the design documentation. However, there are **3 minor issues** that should be addressed:

1. ⚠️ **Redundant check in strategy_briefs INSERT policy** - Uses both helper function AND direct brand_members check
2. ⚠️ **Missing DELETE policy for brand_history** - Should explicitly deny DELETE (immutable log)
3. ⚠️ **Potential performance issue** - Some policies use nested EXISTS subqueries that could be optimized

### Compliance Summary

| Category | Status | Notes |
|----------|--------|-------|
| **Schema Match** | ✅ PASS | All tables match SUPABASE_SCHEMA_MAP.md |
| **Phase 1 RLS** | ✅ PASS | All Phase 1 tables have RLS enabled |
| **Service Role Usage** | ✅ PASS | Uses `auth.role() = 'service_role'` (no magic UUIDs) |
| **Type Preservation** | ✅ PASS | No TEXT → UUID conversions |
| **No Table Drops** | ✅ PASS | No DROP TABLE statements |
| **Helper Functions** | ✅ PASS | Both functions defined and used correctly |
| **Foreign Keys** | ✅ PASS | Only documented FKs included |
| **Syntax** | ✅ PASS | No syntax errors detected |

---

## Per-Table RLS Verification

### 🔴 Critical Priority Tables

#### 1. milestones

**RLS Enabled**: ✅ YES  
**Table Definition**: ✅ Matches schema map (workspace_id TEXT, key TEXT, UNIQUE constraint)

**Policies**:
- ✅ **"Users can view workspace milestones"** (SELECT) - Uses workspace membership via brands → brand_members ✅
- ✅ **"System can insert milestones"** (INSERT) - Uses `auth.role() = 'service_role'` OR workspace owners/admins ✅
- ✅ **"Users can acknowledge workspace milestones"** (UPDATE) - Uses workspace membership ✅

**Notes**:
- ✅ Correctly uses `COALESCE(b.workspace_id, b.tenant_id::text)` for workspace mapping
- ✅ No DELETE policy (appropriate - milestones are not deleted)
- ✅ Matches RLS_SECURITY_PLAN.md intent

**Verdict**: ✅ **PASS**

---

#### 2. strategy_briefs

**RLS Enabled**: ✅ YES  
**Table Definition**: ✅ Matches schema map (brand_id TEXT, all expected columns)

**Policies**:
- ✅ **"Brand members can view strategy briefs"** (SELECT) - Uses `is_brand_member_text()` helper ✅
- ⚠️ **"System can insert strategy_briefs"** (INSERT) - **ISSUE**: Redundant check
  - Uses `is_brand_member_text(brand_id)` AND then checks `brand_members` directly
  - The helper function already checks brand_members, so the nested EXISTS is redundant
- ✅ **"Admins can manage strategy_briefs"** (UPDATE) - Uses helper + role check ✅
- ✅ **"Admins can delete strategy_briefs"** (DELETE) - Uses helper + role check ✅

**Notes**:
- ✅ Uses `is_brand_member_text()` helper function correctly
- ✅ brand_id remains TEXT (no type conversion)
- ⚠️ INSERT policy has redundant brand_members check (line 1905-1911)

**Verdict**: ⚠️ **PASS WITH MINOR ISSUE** (redundant check, but functionally correct)

---

#### 3. content_packages

**RLS Enabled**: ✅ YES  
**Table Definition**: ✅ Matches schema map (brand_id TEXT, all expected columns)

**Policies**:
- ✅ **"Brand members can view content packages"** (SELECT) - Uses `is_brand_member_text()` ✅
- ✅ **"System can insert content packages"** (INSERT) - Uses service role OR brand members with roles ✅
- ✅ **"Brand members can update content packages"** (UPDATE) - Uses helper function ✅
- ✅ **"Admins can delete content packages"** (DELETE) - Uses helper + role check ✅

**Notes**:
- ✅ Uses `is_brand_member_text()` helper function correctly
- ✅ brand_id remains TEXT (no type conversion)
- ✅ INSERT policy allows 'owner', 'admin', 'editor', 'creator' roles (matches plan)

**Verdict**: ✅ **PASS**

---

#### 4. brand_history

**RLS Enabled**: ✅ YES  
**Table Definition**: ✅ Matches schema map (brand_id TEXT, immutable log structure)

**Policies**:
- ✅ **"Brand members can view brand history"** (SELECT) - Uses `is_brand_member_text()` ✅
- ✅ **"System can insert brand history"** (INSERT) - Uses service role OR brand owners/admins ✅
- ❌ **UPDATE policy**: **MISSING** (should explicitly deny - immutable log)
- ❌ **DELETE policy**: **MISSING** (should explicitly deny - immutable log)

**Notes**:
- ✅ Uses `is_brand_member_text()` helper function correctly
- ✅ brand_id remains TEXT (no type conversion)
- ⚠️ **ISSUE**: Should explicitly deny UPDATE/DELETE (immutable audit log)
  - While PostgreSQL defaults to deny, explicit policies are clearer and safer

**Verdict**: ⚠️ **PASS WITH MINOR ISSUE** (missing explicit deny policies)

---

#### 5. payment_attempts

**RLS Enabled**: ✅ YES  
**Table Definition**: ✅ Matches schema map (user_id UUID, all expected columns)

**Policies**:
- ✅ **"Users can view own payment attempts"** (SELECT) - Uses `user_id = auth.uid()` ✅
- ✅ **"System can insert payment attempts"** (INSERT) - Uses service role OR user_id = auth.uid() ✅
- ✅ **"System can update payment attempts"** (UPDATE) - Uses service role OR user_id = auth.uid() ✅

**Notes**:
- ✅ No DELETE policy (appropriate - payment history should not be deleted)
- ✅ Correctly restricts to user's own data
- ✅ Service role can manage (for payment processing)
- ⚠️ **Note**: No admin-only SELECT policy (per RLS_SECURITY_PLAN.md, but user_profiles.role doesn't exist, so this is correct)

**Verdict**: ✅ **PASS**

---

#### 6. archived_data

**RLS Enabled**: ✅ YES  
**Table Definition**: ✅ Matches schema map (user_id UUID, brand_id UUID optional)

**Policies**:
- ✅ **"Users can view own archived data"** (SELECT) - Uses `user_id = auth.uid()` ✅
- ✅ **"Brand members can view archived data"** (SELECT) - Uses brand_id + brand_members check ✅
- ✅ **"System can insert archived data"** (INSERT) - Uses service role only ✅
- ✅ **"System can update archived data"** (UPDATE) - Uses service role only ✅

**Notes**:
- ✅ Correctly handles both user-scoped and brand-scoped access
- ✅ Service role only for INSERT/UPDATE (archival process)
- ✅ No DELETE policy (appropriate - deletion handled by cleanup job)

**Verdict**: ✅ **PASS**

---

### 🟡 Medium Priority Tables

#### 7. tenants

**RLS Enabled**: ✅ YES  
**Table Definition**: ✅ Matches schema map

**Policies**:
- ✅ **"Users can view their tenants"** (SELECT) - Uses brands → brand_members mapping ✅
- ✅ **"System can create tenants"** (INSERT) - Uses service role only ✅
- ✅ **"System can manage tenants"** (UPDATE) - Uses service role only ✅
- ✅ **"System can delete tenants"** (DELETE) - Uses service role only ✅

**Notes**:
- ✅ Correctly uses `COALESCE(b.tenant_id, b.workspace_id::uuid)` for tenant mapping
- ✅ Service role only for mutations (appropriate)

**Verdict**: ✅ **PASS**

---

#### 8. brand_success_patterns

**RLS Enabled**: ✅ YES  
**Table Definition**: ✅ Matches schema map (brand_id TEXT)

**Policies**:
- ✅ **"Brand members can view success patterns"** (SELECT) - Uses `is_brand_member_text()` ✅
- ✅ **"System can manage success patterns"** (ALL) - Uses service role OR brand owners/admins ✅

**Notes**:
- ✅ Uses helper function correctly
- ✅ brand_id remains TEXT

**Verdict**: ✅ **PASS**

---

#### 9. collaboration_logs

**RLS Enabled**: ✅ YES  
**Table Definition**: ✅ Matches schema map (brand_id TEXT, immutable log)

**Policies**:
- ✅ **"Brand members can view collaboration logs"** (SELECT) - Uses `is_brand_member_text()` ✅
- ✅ **"System can insert collaboration logs"** (INSERT) - Uses service role only ✅
- ❌ **UPDATE/DELETE policies**: **MISSING** (should explicitly deny - immutable log)

**Notes**:
- ✅ Uses helper function correctly
- ⚠️ Should explicitly deny UPDATE/DELETE (immutable log)

**Verdict**: ⚠️ **PASS WITH MINOR ISSUE** (missing explicit deny policies)

---

#### 10. performance_logs

**RLS Enabled**: ✅ YES  
**Table Definition**: ✅ Matches schema map (brand_id TEXT, immutable log)

**Policies**:
- ✅ **"Brand members can view performance logs"** (SELECT) - Uses `is_brand_member_text()` ✅
- ✅ **"System can insert performance logs"** (INSERT) - Uses service role only ✅
- ❌ **UPDATE/DELETE policies**: **MISSING** (should explicitly deny - immutable log)

**Notes**:
- ✅ Uses helper function correctly
- ⚠️ Should explicitly deny UPDATE/DELETE (immutable log)

**Verdict**: ⚠️ **PASS WITH MINOR ISSUE** (missing explicit deny policies)

---

#### 11. platform_insights

**RLS Enabled**: ✅ YES  
**Table Definition**: ✅ Matches schema map (brand_id TEXT)

**Policies**:
- ✅ **"Brand members can view platform insights"** (SELECT) - Uses `is_brand_member_text()` ✅
- ✅ **"System can manage platform insights"** (ALL) - Uses service role OR brand owners/admins ✅

**Notes**:
- ✅ Uses helper function correctly
- ✅ brand_id remains TEXT

**Verdict**: ✅ **PASS**

---

#### 12. token_health

**RLS Enabled**: ✅ YES  
**Table Definition**: ✅ Matches schema map (brand_id TEXT, sensitive data)

**Policies**:
- ✅ **"Brand members can view token health"** (SELECT) - Uses `is_brand_member_text()` ✅
- ✅ **"System/admins can manage token health"** (ALL) - Uses service role OR brand owners/admins ✅

**Notes**:
- ✅ Uses helper function correctly
- ✅ Restricts management to admins (appropriate for sensitive OAuth data)

**Verdict**: ✅ **PASS**

---

#### 13. weekly_summaries

**RLS Enabled**: ✅ YES  
**Table Definition**: ✅ Matches schema map (brand_id TEXT)

**Policies**:
- ✅ **"Brand members can view weekly summaries"** (SELECT) - Uses `is_brand_member_text()` ✅
- ✅ **"System can manage weekly summaries"** (ALL) - Uses service role only ✅

**Notes**:
- ✅ Uses helper function correctly
- ✅ Service role only for mutations (appropriate - system-generated reports)

**Verdict**: ✅ **PASS**

---

#### 14. advisor_review_audits

**RLS Enabled**: ✅ YES  
**Table Definition**: ✅ Matches schema map (brand_id TEXT, immutable log)

**Policies**:
- ✅ **"Brand members can view advisor reviews"** (SELECT) - Uses `is_brand_member_text()` ✅
- ✅ **"System can insert advisor reviews"** (INSERT) - Uses service role only ✅
- ❌ **UPDATE/DELETE policies**: **MISSING** (should explicitly deny - immutable log)

**Notes**:
- ✅ Uses helper function correctly
- ⚠️ Should explicitly deny UPDATE/DELETE (immutable log)

**Verdict**: ⚠️ **PASS WITH MINOR ISSUE** (missing explicit deny policies)

---

## Phase 1 Rules Compliance

### ✅ Rule 1: No TEXT → UUID Type Changes

**Status**: ✅ **PASS**

- ✅ No `ALTER TABLE ... ALTER COLUMN ... TYPE uuid` statements found
- ✅ All persistence schema tables keep `brand_id TEXT`
- ✅ Helper function `is_brand_member_text()` handles TEXT brand_id correctly

**Verification**:
```bash
grep -i "ALTER TABLE.*ALTER COLUMN.*TYPE.*uuid" supabase/migrations/001_bootstrap_schema.sql
# Result: No matches found
```

---

### ✅ Rule 2: No New Foreign Keys Beyond Documentation

**Status**: ✅ **PASS**

- ✅ Only FKs explicitly documented in SUPABASE_SCHEMA_MAP.md are included
- ✅ No new FK constraints added to persistence schema tables
- ✅ `payment_attempts.user_id` correctly has no FK (comment explains: "no FK to avoid circular dependency")

**Verification**:
- All FKs match schema map documentation
- No unexpected FK constraints found

---

### ✅ Rule 3: No Table Drops

**Status**: ✅ **PASS**

- ✅ No `DROP TABLE` statements found
- ✅ All tables use `CREATE TABLE IF NOT EXISTS` (safe for empty database)

**Verification**:
```bash
grep -i "DROP TABLE" supabase/migrations/001_bootstrap_schema.sql
# Result: No matches found
```

---

### ✅ Rule 4: Service Role Usage

**Status**: ✅ **PASS**

- ✅ Uses `auth.role() = 'service_role'` consistently (21 occurrences)
- ✅ No magic UUID patterns (`'00000000-0000-0000-0000-000000000000'`) found

**Verification**:
```bash
grep "auth.role() = 'service_role'" supabase/migrations/001_bootstrap_schema.sql | wc -l
# Result: 21 matches

grep "00000000-0000-0000-0000-000000000000" supabase/migrations/001_bootstrap_schema.sql
# Result: No matches found
```

---

### ✅ Rule 5: Helper Functions

**Status**: ✅ **PASS**

**Functions Defined**:
1. ✅ `is_brand_member_text(brand_id_param TEXT)` - Defined with SECURITY DEFINER ✅
2. ✅ `is_workspace_member(workspace_id_param TEXT)` - Defined with SECURITY DEFINER ✅

**Functions Used**:
- ✅ `is_brand_member_text()` used in 19 policies (all persistence schema tables)
- ✅ `is_workspace_member()` defined but not used (acceptable - available for future use)

**Function Implementation**:
- ✅ `is_brand_member_text()` correctly handles TEXT → UUID conversion with exception handling
- ✅ `is_workspace_member()` correctly maps workspace_id to brands via COALESCE

**Verdict**: ✅ **PASS**

---

### ✅ Rule 6: RLS Enabled for Phase 1 Tables

**Status**: ✅ **PASS**

All Phase 1 tables have RLS enabled:

**Critical Priority**:
- ✅ milestones
- ✅ strategy_briefs
- ✅ content_packages
- ✅ brand_history
- ✅ payment_attempts
- ✅ archived_data

**Medium Priority**:
- ✅ tenants
- ✅ brand_success_patterns
- ✅ collaboration_logs
- ✅ performance_logs
- ✅ platform_insights
- ✅ token_health
- ✅ weekly_summaries
- ✅ advisor_review_audits

**Verification**:
```bash
grep "ALTER TABLE.*ENABLE ROW LEVEL SECURITY" supabase/migrations/001_bootstrap_schema.sql | wc -l
# Result: 50+ tables with RLS enabled
```

---

## Issues Found

### ⚠️ Issue 1: Redundant Check in strategy_briefs INSERT Policy

**Location**: Line 1900-1913  
**Severity**: Low (functionally correct, but inefficient)

**Problem**:
The INSERT policy for `strategy_briefs` checks both:
1. `is_brand_member_text(brand_id)` - which already checks brand_members
2. `EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brand_id::uuid ...)` - redundant check

**Current Code**:
```sql
CREATE POLICY "System can insert strategy_briefs"
  ON strategy_briefs FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      is_brand_member_text(brand_id)  -- This already checks brand_members
      AND EXISTS (
        SELECT 1 FROM brand_members
        WHERE brand_id = brand_id::uuid
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );
```

**Fix**:
```sql
CREATE POLICY "System can insert strategy_briefs"
  ON strategy_briefs FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      is_brand_member_text(brand_id)
      AND EXISTS (
        SELECT 1 FROM brand_members
        WHERE brand_id = brand_id::uuid
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );
```

**Wait, actually the nested EXISTS is checking for role IN ('owner', 'admin'), which the helper function doesn't check. So this is actually correct!**

**Revised Assessment**: ✅ The policy is correct - the helper function checks membership, and the nested EXISTS checks role. This is intentional and correct.

---

### ⚠️ Issue 2: Missing Explicit Deny Policies for Immutable Logs

**Location**: Multiple tables  
**Severity**: Low (PostgreSQL defaults to deny, but explicit is safer)

**Problem**:
Immutable log tables should explicitly deny UPDATE/DELETE operations for clarity and safety.

**Affected Tables**:
1. `brand_history` - Missing UPDATE/DELETE deny policies
2. `collaboration_logs` - Missing UPDATE/DELETE deny policies
3. `performance_logs` - Missing UPDATE/DELETE deny policies
4. `advisor_review_audits` - Missing UPDATE/DELETE deny policies

**Fix**: Add explicit deny policies (see Fixes section below)

---

### ⚠️ Issue 3: Potential Performance Optimization

**Location**: Multiple policies  
**Severity**: Low (may impact performance at scale)

**Problem**:
Some policies use nested EXISTS subqueries that could be optimized by using the helper functions more consistently.

**Example**:
The `strategy_briefs` INSERT policy uses both the helper function AND a nested EXISTS. While functionally correct, this could be optimized.

**Note**: This is a minor optimization opportunity, not a bug. The current implementation is correct.

---

## Fixes Section

### Fix 1: Add Explicit Deny Policies for Immutable Logs

**Add after line 2009** (after brand_history INSERT policy):

```sql
-- Explicitly deny UPDATE/DELETE for immutable log
CREATE POLICY "Deny updates to brand_history"
  ON brand_history FOR UPDATE
  USING (false);

CREATE POLICY "Deny deletes to brand_history"
  ON brand_history FOR DELETE
  USING (false);
```

**Add after line 2042** (after collaboration_logs INSERT policy):

```sql
-- Explicitly deny UPDATE/DELETE for immutable log
CREATE POLICY "Deny updates to collaboration_logs"
  ON collaboration_logs FOR UPDATE
  USING (false);

CREATE POLICY "Deny deletes to collaboration_logs"
  ON collaboration_logs FOR DELETE
  USING (false);
```

**Add after line 2053** (after performance_logs INSERT policy):

```sql
-- Explicitly deny UPDATE/DELETE for immutable log
CREATE POLICY "Deny updates to performance_logs"
  ON performance_logs FOR UPDATE
  USING (false);

CREATE POLICY "Deny deletes to performance_logs"
  ON performance_logs FOR DELETE
  USING (false);
```

**Add after line 2119** (after advisor_review_audits INSERT policy):

```sql
-- Explicitly deny UPDATE/DELETE for immutable log
CREATE POLICY "Deny updates to advisor_review_audits"
  ON advisor_review_audits FOR UPDATE
  USING (false);

CREATE POLICY "Deny deletes to advisor_review_audits"
  ON advisor_review_audits FOR DELETE
  USING (false);
```

---

## Static Analysis

### SQL Syntax Check

**Status**: ✅ **PASS**

- ✅ All statements properly terminated with semicolons
- ✅ No unbalanced BEGIN/END blocks
- ✅ All CREATE POLICY statements have proper USING/WITH CHECK clauses
- ✅ All ALTER TABLE statements properly formatted

**Manual Review**:
- ✅ Function definitions properly closed
- ✅ Trigger definitions properly formatted
- ✅ Index definitions properly formatted
- ✅ No duplicate object names (uses IF NOT EXISTS appropriately)

---

### Duplicate Object Check

**Status**: ✅ **PASS**

- ✅ All CREATE statements use `IF NOT EXISTS` (safe for idempotent execution)
- ✅ All CREATE POLICY statements use unique policy names
- ✅ No duplicate triggers or constraints detected

---

## Runtime Test Plan

### Test 1: RLS Verification Query

**Purpose**: Verify RLS is enabled for all Phase 1 tables

**SQL**:
```sql
-- Check RLS is enabled for Phase 1 tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'milestones',
    'strategy_briefs',
    'content_packages',
    'brand_history',
    'payment_attempts',
    'archived_data',
    'tenants',
    'brand_success_patterns',
    'collaboration_logs',
    'performance_logs',
    'platform_insights',
    'token_health',
    'weekly_summaries',
    'advisor_review_audits'
  )
ORDER BY tablename;

-- Expected: All tables should have rowsecurity = true
```

---

### Test 2: Policy Count Verification

**Purpose**: Verify all expected policies exist

**SQL**:
```sql
-- Count policies per Phase 1 table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'milestones',
    'strategy_briefs',
    'content_packages',
    'brand_history',
    'payment_attempts',
    'archived_data',
    'tenants',
    'brand_success_patterns',
    'collaboration_logs',
    'performance_logs',
    'platform_insights',
    'token_health',
    'weekly_summaries',
    'advisor_review_audits'
  )
GROUP BY tablename
ORDER BY tablename;

-- Expected counts:
-- milestones: 3 policies
-- strategy_briefs: 4 policies
-- content_packages: 4 policies
-- brand_history: 2 policies (should be 4 after fix)
-- payment_attempts: 3 policies
-- archived_data: 4 policies
-- tenants: 4 policies
-- brand_success_patterns: 2 policies
-- collaboration_logs: 2 policies (should be 4 after fix)
-- performance_logs: 2 policies (should be 4 after fix)
-- platform_insights: 2 policies
-- token_health: 2 policies
-- weekly_summaries: 2 policies
-- advisor_review_audits: 2 policies (should be 4 after fix)
```

---

### Test 3: Data Seeding Script

**Purpose**: Seed minimal test data for RLS validation

**SQL**:
```sql
-- ============================================================================
-- TEST DATA SEEDING SCRIPT
-- Run this with service_role to seed test data
-- ============================================================================

-- 1. Create test tenant
INSERT INTO tenants (id, name, plan)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Test Tenant', 'free')
ON CONFLICT (id) DO NOTHING;

-- 2. Create test users (UUIDs)
-- Note: These should match actual auth.users UUIDs in your test environment
-- Replace with real UUIDs from your Supabase auth.users table
DO $$
DECLARE
  test_user_1 UUID := '11111111-1111-1111-1111-111111111111';
  test_user_2 UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  -- Create user profiles (if they don't exist)
  INSERT INTO user_profiles (id, email, first_name, last_name)
  VALUES 
    (test_user_1, 'user1@test.com', 'Test', 'User1'),
    (test_user_2, 'user2@test.com', 'Test', 'User2')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- 3. Create test brand
INSERT INTO brands (id, name, tenant_id, workspace_id, created_by)
VALUES 
  (
    '33333333-3333-3333-3333-333333333333',
    'Test Brand',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111'
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Create brand memberships
INSERT INTO brand_members (user_id, brand_id, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'owner'),
  ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'member')
ON CONFLICT (user_id, brand_id) DO NOTHING;

-- 5. Create test payment_attempts
INSERT INTO payment_attempts (user_id, attempt_number, status, amount)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 1, 'succeeded', 29.99),
  ('22222222-2222-2222-2222-222222222222', 1, 'pending', 29.99)
ON CONFLICT DO NOTHING;

-- 6. Create test strategy_briefs (brand_id TEXT)
INSERT INTO strategy_briefs (brand_id, request_id, cycle_id, version, positioning, voice, visual, competitive)
VALUES 
  (
    '33333333-3333-3333-3333-333333333333'::text,
    'req-001',
    'cycle-001',
    'v1',
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- 7. Create test content_packages (brand_id TEXT)
INSERT INTO content_packages (brand_id, content_id, request_id, cycle_id, copy, collaboration_log, status)
VALUES 
  (
    '33333333-3333-3333-3333-333333333333'::text,
    'content-001',
    'req-001',
    'cycle-001',
    '{}'::jsonb,
    '{}'::jsonb,
    'draft'
  )
ON CONFLICT (content_id) DO NOTHING;

-- 8. Create test milestones (workspace_id TEXT)
INSERT INTO milestones (workspace_id, key, unlocked_at)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001'::text,
    'first_content_created',
    NOW()
  )
ON CONFLICT (workspace_id, key) DO NOTHING;

-- 9. Create test archived_data
INSERT INTO archived_data (user_id, brand_id, data_type, data, delete_after)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    'content',
    '{}'::jsonb,
    NOW() + INTERVAL '90 days'
  )
ON CONFLICT DO NOTHING;
```

---

### Test 4: RLS Behavior Validation

**Purpose**: Test RLS policies with different user contexts

**SQL**:
```sql
-- ============================================================================
-- RLS BEHAVIOR VALIDATION
-- Run each test block separately with different user contexts
-- ============================================================================

-- Test 1: User 1 (owner) can see their own payment_attempts
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

SELECT COUNT(*) as payment_count FROM payment_attempts;
-- Expected: 1 (only user1's payment)

-- Test 2: User 1 (owner) can see brand's strategy_briefs
SELECT COUNT(*) as brief_count FROM strategy_briefs;
-- Expected: 1 (brand's strategy brief)

-- Test 3: User 1 (owner) can see brand's content_packages
SELECT COUNT(*) as package_count FROM content_packages;
-- Expected: 1 (brand's content package)

-- Test 4: User 1 (owner) can see workspace milestones
SELECT COUNT(*) as milestone_count FROM milestones;
-- Expected: 1 (workspace milestone)

-- Test 5: User 2 (member) can see brand's strategy_briefs
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);

SELECT COUNT(*) as brief_count FROM strategy_briefs;
-- Expected: 1 (brand's strategy brief - member can view)

-- Test 6: User 2 (member) CANNOT see user1's payment_attempts
SELECT COUNT(*) as payment_count FROM payment_attempts;
-- Expected: 1 (only user2's payment, not user1's)

-- Test 7: User 2 (member) CANNOT insert strategy_briefs (not admin)
-- This should fail:
INSERT INTO strategy_briefs (brand_id, request_id, cycle_id, version, positioning, voice, visual, competitive)
VALUES 
  (
    '33333333-3333-3333-3333-333333333333'::text,
    'req-002',
    'cycle-002',
    'v1',
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb
  );
-- Expected: ERROR (member role not in 'owner', 'admin')

-- Test 8: Service role can insert strategy_briefs
-- Reset to service role (no SET LOCAL ROLE)
INSERT INTO strategy_briefs (brand_id, request_id, cycle_id, version, positioning, voice, visual, competitive)
VALUES 
  (
    '33333333-3333-3333-3333-333333333333'::text,
    'req-003',
    'cycle-003',
    'v1',
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb
  );
-- Expected: SUCCESS (service role can insert)
```

---

### Test 5: Helper Function Validation

**Purpose**: Test helper functions work correctly

**SQL**:
```sql
-- Test is_brand_member_text() function
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

-- Should return true (user1 is owner of test brand)
SELECT is_brand_member_text('33333333-3333-3333-3333-333333333333'::text);
-- Expected: true

-- Should return false (user1 is not member of non-existent brand)
SELECT is_brand_member_text('99999999-9999-9999-9999-999999999999'::text);
-- Expected: false

-- Test is_workspace_member() function
SELECT is_workspace_member('00000000-0000-0000-0000-000000000001'::text);
-- Expected: true (user1 is member of brand in test workspace)
```

---

### Test 6: Immutable Log Protection

**Purpose**: Verify immutable logs cannot be updated/deleted

**SQL**:
```sql
-- Test brand_history is immutable
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

-- Insert a test entry (as service role - reset first)
-- Then try to update (should fail)
UPDATE brand_history SET details = '{"test": "update"}'::jsonb WHERE id = (SELECT id FROM brand_history LIMIT 1);
-- Expected: ERROR (no UPDATE policy, or explicit deny policy)

-- Try to delete (should fail)
DELETE FROM brand_history WHERE id = (SELECT id FROM brand_history LIMIT 1);
-- Expected: ERROR (no DELETE policy, or explicit deny policy)

-- Repeat for collaboration_logs, performance_logs, advisor_review_audits
```

---

## Node.js Test Script (Optional)

**File**: `test-rls-behavior.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase clients
const serviceRoleClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const user1Client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        Authorization: `Bearer ${process.env.USER1_ACCESS_TOKEN}`
      }
    }
  }
);

const user2Client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        Authorization: `Bearer ${process.env.USER2_ACCESS_TOKEN}`
      }
    }
  }
);

async function testRLS() {
  console.log('🧪 Testing RLS Policies...\n');

  // Test 1: User1 can see their own payment_attempts
  const { data: user1Payments, error: user1PaymentsError } = await user1Client
    .from('payment_attempts')
    .select('*');
  
  console.log('Test 1 - User1 payment_attempts:', user1Payments?.length || 0);
  if (user1PaymentsError) console.error('Error:', user1PaymentsError);

  // Test 2: User2 cannot see user1's payment_attempts
  const { data: user2Payments, error: user2PaymentsError } = await user2Client
    .from('payment_attempts')
    .select('*');
  
  console.log('Test 2 - User2 payment_attempts:', user2Payments?.length || 0);
  if (user2PaymentsError) console.error('Error:', user2PaymentsError);

  // Test 3: User1 can see brand's strategy_briefs
  const { data: user1Briefs, error: user1BriefsError } = await user1Client
    .from('strategy_briefs')
    .select('*');
  
  console.log('Test 3 - User1 strategy_briefs:', user1Briefs?.length || 0);
  if (user1BriefsError) console.error('Error:', user1BriefsError);

  // Test 4: User2 can see brand's strategy_briefs (member)
  const { data: user2Briefs, error: user2BriefsError } = await user2Client
    .from('strategy_briefs')
    .select('*');
  
  console.log('Test 4 - User2 strategy_briefs:', user2Briefs?.length || 0);
  if (user2BriefsError) console.error('Error:', user2BriefsError);

  // Test 5: Service role can insert strategy_briefs
  const { data: insertResult, error: insertError } = await serviceRoleClient
    .from('strategy_briefs')
    .insert({
      brand_id: '33333333-3333-3333-3333-333333333333',
      request_id: 'req-test',
      cycle_id: 'cycle-test',
      version: 'v1',
      positioning: {},
      voice: {},
      visual: {},
      competitive: {}
    });
  
  console.log('Test 5 - Service role insert:', insertResult ? 'SUCCESS' : 'FAILED');
  if (insertError) console.error('Error:', insertError);

  // Test 6: User2 cannot insert strategy_briefs (not admin)
  const { data: user2Insert, error: user2InsertError } = await user2Client
    .from('strategy_briefs')
    .insert({
      brand_id: '33333333-3333-3333-3333-333333333333',
      request_id: 'req-test-2',
      cycle_id: 'cycle-test-2',
      version: 'v1',
      positioning: {},
      voice: {},
      visual: {},
      competitive: {}
    });
  
  console.log('Test 6 - User2 insert (should fail):', user2InsertError ? 'BLOCKED ✅' : 'ALLOWED ❌');
  if (user2InsertError) console.log('Expected error:', user2InsertError.message);

  console.log('\n✅ RLS Tests Complete');
}

testRLS().catch(console.error);
```

---

## Summary

### ✅ Overall Assessment: **PASS**

The bootstrap migration is **production-ready** with only minor improvements recommended:

1. **Add explicit deny policies** for immutable log tables (brand_history, collaboration_logs, performance_logs, advisor_review_audits)
2. **Consider performance optimization** for nested EXISTS queries (optional)

### Key Strengths

- ✅ **Complete schema coverage** - All tables from schema map included
- ✅ **Proper RLS implementation** - All Phase 1 tables secured
- ✅ **Service role pattern** - Consistent use of `auth.role() = 'service_role'`
- ✅ **Type preservation** - No forbidden type conversions
- ✅ **Helper functions** - Correctly implemented and used
- ✅ **Safe execution** - Uses IF NOT EXISTS throughout

### Recommendations

1. **Apply fixes** for immutable log tables (add explicit deny policies)
2. **Run test suite** using the provided test plan
3. **Monitor performance** of RLS policies at scale
4. **Document any exceptions** to the standard RLS patterns

---

**Report Status**: ✅ **COMPLETE**  
**Next Steps**: Apply fixes, run test suite, deploy to staging environment

