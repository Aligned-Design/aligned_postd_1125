# POSTD Supabase Drift & Migration Audit Report

**Date**: 2025-01-16  
**Auditor**: POSTD Supabase Drift & Migration Auditor  
**Purpose**: Identify database/schema changes that need to be applied to Supabase, verify code-schema alignment, and provide actionable checklist

---

## 0. CONTEXT & CANONICAL SCHEMA SUMMARY

### Canonical Schema Overview

The POSTD database uses a **consolidated bootstrap migration** approach:

- **Primary Migration**: `001_bootstrap_schema.sql` (3,924 lines) - Contains ALL tables, indexes, constraints, triggers, and RLS policies
- **Active Migrations**: 9 numbered migrations (001-009) + 1 dated migration (20250130)
- **Archived Migrations**: Legacy migrations in `_legacy/` and `archived/` folders (for reference only)

### Key Schema Characteristics

1. **Multi-Tenant Architecture**:
   - `tenants` → `brands` → `brand_members` hierarchy
   - All data tables reference `brand_id UUID` for isolation
   - RLS policies enforce brand-scoped access

2. **Brand ID Migration Status**:
   - **Core tables**: Use `brand_id UUID` (canonical)
   - **Persistence schema tables**: Migrated from `brand_id TEXT` → `brand_id_uuid UUID` (migrations 003, 005, 006)
   - **Code**: Uses `brand_id_uuid` for persistence tables, `brand_id` for core tables

3. **Brand Guide Structure**:
   - Primary: `brands.brand_kit` (JSONB) - canonical storage
   - Legacy: `brands.voice_summary`, `brands.visual_summary`, `brands.tone_keywords` (kept for backward compatibility)
   - Migration 009 consolidates legacy fields into `brand_kit`

4. **Total Tables**: 51+ tables across 11 functional categories

---

## 1. MIGRATIONS STATUS & DRIFT CHECK

### Active Migrations (In Order)

| # | File | Purpose | Risk | Status | Notes |
|---|------|---------|------|--------|-------|
| 001 | `001_bootstrap_schema.sql` | Complete schema baseline | ✅ **Stable** | **Canonical** | Single source of truth. Contains all 51+ tables, indexes, RLS policies, helper functions. Safe to run on empty database. |
| 002 | `002_create_brand_guide_versions.sql` | Brand guide version history | ✅ **Stable** | **Idempotent** | Creates `brand_guide_versions` table. Uses `IF NOT EXISTS` and exception handling. Safe if already exists. |
| 003 | `003_fix_brand_id_persistence_schema.sql` | Add `brand_id_uuid` columns | ⚠️ **Cleanup/Retrofit** | **Additive** | Adds `brand_id_uuid UUID` to 10 persistence tables. Backfills from `brand_id TEXT`. Safe (additive only). |
| 004 | `004_activate_generation_logs_table.sql` | Activate `generation_logs` table | ✅ **Stable** | **Idempotent** | Creates `generation_logs` table if missing. Used by `server/routes/agents.ts`. Safe. |
| 005 | `005_finalize_brand_id_uuid_migration.sql` | Complete UUID migration | ⚠️ **Cleanup/Retrofit** | **Policy Updates** | Adds FK constraints, updates RLS policies to use `brand_id_uuid`. Drops old policies. Safe (policies only). |
| 006 | `006_drop_legacy_brand_id_text_columns.sql` | Drop deprecated TEXT columns | ❌ **HIGH RISK** | **Destructive** | **DROPS COLUMNS** from 10 tables. **IRREVERSIBLE**. Only run after code migration complete. |
| 007 | `007_add_media_assets_status_and_rls.sql` | Add status column + RLS to `media_assets` | ✅ **Stable** | **Additive** | Adds `status TEXT` column, INSERT/UPDATE RLS policies. Safe (additive). |
| 014 | `014_content_planning_schema_clarification.sql` | Documentation only | ✅ **Stable** | **No Changes** | Documentation migration. No schema changes. Safe. |
| 009 | `009_consolidate_brand_guide_fields.sql` | Merge legacy fields into `brand_kit` | ⚠️ **Data Migration** | **Data Transform** | Merges `voice_summary`, `visual_summary`, `tone_keywords` into `brand_kit` JSONB. Safe (additive merge). |
| 20250130 | `20250130_brand_guide_versions_patch.sql` | Patch for existing DBs | ✅ **Stable** | **Idempotent** | Creates `brand_guide_versions` if missing (for DBs created before migration 002). Safe. |

### Migration Risk Assessment

#### ✅ **SAFE TO APPLY** (Stable & Canonical)
- **001**: Bootstrap schema - run first on empty database
- **002**: Brand guide versions - idempotent
- **004**: Generation logs - idempotent
- **007**: Media assets status - additive
- **008**: Documentation only
- **20250130**: Patch migration - idempotent

#### ⚠️ **REQUIRES CAREFUL VERIFICATION** (Cleanup/Retrofit)
- **003**: Adds `brand_id_uuid` columns - verify backfill worked correctly
- **005**: Updates RLS policies - verify policies work correctly
- **009**: Data migration - verify merge didn't lose data

#### ❌ **HIGH RISK - DO NOT APPLY YET** (Destructive)
- **006**: **DROPS COLUMNS** - Only apply after:
  1. Migration 003, 005 applied
  2. All application code uses `brand_id_uuid`
  3. Verified no code references `brand_id TEXT` in persistence tables
  4. **Backup database first**

### Signs of Schema Drift

#### ✅ **No Drift Detected**
- All migrations are well-documented
- Idempotent migrations use `IF NOT EXISTS` and exception handling
- No commented-out or WIP migrations in active folder

#### ⚠️ **Potential Drift Indicators**
1. **Migration 006** (drop columns) - May not be applied if code still uses `brand_id TEXT`
2. **Legacy fields** (`voice_summary`, `visual_summary`, `tone_keywords`) - Still exist but should be in `brand_kit`
3. **Helper function** `is_brand_member_text()` - May still exist if migration 006 not applied

---

## 2. CODE VS SCHEMA CROSS-CHECK

### Core Tables (brand_id UUID) - ✅ **ALIGNED**

| Table | Code Usage | Migration | Status |
|-------|------------|-----------|--------|
| `brands` | `server/routes/brand-guide.ts`, `server/lib/brand-profile.ts` | 001 | ✅ Uses `brand_id UUID`, `brand_kit`, `voice_summary`, `visual_summary`, `tone_keywords` |
| `content_items` | `server/routes/content-plan.ts` | 001 | ✅ Uses `brand_id UUID` |
| `scheduled_content` | `server/routes/agents.ts` | 001 | ✅ Uses `brand_id UUID` |
| `media_assets` | `server/lib/media-service.ts` | 001, 007 | ✅ Uses `brand_id UUID`, `status` (added in 007) |
| `publishing_jobs` | `server/lib/publishing-db-service.ts` | 001 | ✅ Uses `brand_id UUID` |
| `analytics_metrics` | `server/lib/analytics-db-service.ts` | 001 | ✅ Uses `brand_id UUID` |
| `auto_plans` | `server/lib/auto-plan-generator.ts` | 001 | ✅ Uses `brand_id UUID` |

### Persistence Schema Tables (brand_id_uuid UUID) - ⚠️ **MIGRATION IN PROGRESS**

| Table | Code Usage | Migration | Status |
|-------|------------|-----------|--------|
| `strategy_briefs` | `server/lib/collaboration-storage.ts` | 001, 003, 005 | ⚠️ Code uses `brand_id_uuid`, but may fallback to `brand_id TEXT` |
| `content_packages` | `server/lib/collaboration-storage.ts`, `server/routes/onboarding.ts` | 001, 003, 005 | ⚠️ Code uses `brand_id_uuid`, but may fallback to `brand_id TEXT` |
| `brand_history` | `server/lib/collaboration-storage.ts` | 001, 003, 005 | ⚠️ Code uses `brand_id_uuid`, but may fallback to `brand_id TEXT` |
| `brand_success_patterns` | (Not found in code) | 001, 003, 005 | ⚠️ May be unused |
| `collaboration_logs` | (Not found in code) | 001, 003, 005 | ⚠️ May be unused |
| `performance_logs` | (Not found in code) | 001, 003, 005 | ⚠️ May be unused |
| `platform_insights` | (Not found in code) | 001, 003, 005 | ⚠️ May be unused |
| `token_health` | (Not found in code) | 001, 003, 005 | ⚠️ May be unused |
| `weekly_summaries` | (Not found in code) | 001, 003, 005 | ⚠️ May be unused |
| `advisor_review_audits` | (Not found in code) | 001, 003, 005 | ⚠️ May be unused |

**Code Pattern Found**:
```typescript
// server/lib/collaboration-storage.ts, server/routes/onboarding.ts
.eq("brand_id_uuid", brandId) // Primary
// Fallback:
brandId: data.brand_id_uuid || data.brand_id // Prefer UUID, fallback to TEXT
```

**Analysis**: Code is **migration-aware** and uses `brand_id_uuid` as primary with `brand_id TEXT` fallback. This is safe but indicates migration 006 (drop columns) should **NOT** be applied yet.

### Potential Mismatches

#### ✅ **No Critical Mismatches**
- All code-referenced tables exist in migrations
- Column names match (e.g., `size_bytes` in `media_assets`, not `file_size`)
- RLS policies exist for all brand-scoped tables

#### ⚠️ **Minor Mismatches** (Non-Blocking)
1. **Legacy Brand Guide Fields**: Code reads from both `brand_kit` and legacy fields (`voice_summary`, `visual_summary`, `tone_keywords`). Migration 009 consolidates but doesn't drop legacy fields. **Status**: Safe, backward compatible.

2. **Persistence Schema Fallback**: Code has fallback to `brand_id TEXT` in persistence tables. **Status**: Safe, but migration 006 should not be applied until fallback removed.

3. **Unused Tables**: 7 persistence schema tables not found in codebase. **Status**: May be legacy or future features. Not a problem.

---

## 3. RLS & MULTI-TENANT SAFETY CHECK

### Tables with RLS Status

#### ✅ **RLS Consistent** (Brand-Scoped)
- `brands` - Brand members can view/manage
- `brand_members` - Users see own memberships
- `content_items` - Brand members only
- `scheduled_content` - Brand members only
- `media_assets` - Brand members (SELECT, INSERT, UPDATE from migration 007)
- `publishing_jobs` - Brand members only
- `analytics_metrics` - Brand members only
- `auto_plans` - Brand members only
- `post_approvals` - Brand members only
- `client_settings` - Clients + admins
- `audit_logs` - Admins only
- `platform_connections` - Brand members view, admins manage
- `webhook_events` - Brand members
- `escalation_rules` - Brand admins
- `generation_logs` - Brand members (migration 004)

#### ⚠️ **RLS Unclear/Outdated Helper** (Persistence Schema)
- `strategy_briefs` - Uses `brand_id_uuid` (migration 005 updated policies)
- `content_packages` - Uses `brand_id_uuid` (migration 005 updated policies)
- `brand_history` - Uses `brand_id_uuid` (migration 005 updated policies)
- `brand_success_patterns` - Uses `brand_id_uuid` (migration 005 updated policies)
- `collaboration_logs` - Uses `brand_id_uuid` (migration 005 updated policies)
- `performance_logs` - Uses `brand_id_uuid` (migration 005 updated policies)
- `platform_insights` - Uses `brand_id_uuid` (migration 005 updated policies)
- `token_health` - Uses `brand_id_uuid` (migration 005 updated policies)
- `weekly_summaries` - Uses `brand_id_uuid` (migration 005 updated policies)
- `advisor_review_audits` - Uses `brand_id_uuid` (migration 005 updated policies)

**Status**: Migration 005 updated all RLS policies to use `brand_id_uuid` instead of `is_brand_member_text()`. If migration 005 is applied, RLS is consistent. If not, policies may still use `is_brand_member_text()` helper.

#### ✅ **RLS Consistent** (User-Scoped)
- `user_profiles` - Users see own profile
- `user_preferences` - Users see own preferences
- `milestones` - Workspace-based (uses `is_workspace_member()` helper)
- `payment_attempts` - Users see own payments
- `archived_data` - Users see own archived data

### RLS Helper Functions

| Function | Purpose | Status | Migration |
|----------|---------|--------|-----------|
| `is_brand_member_text(brand_id_param TEXT)` | Check membership for TEXT brand_id | ⚠️ **Deprecated** | 001 (created), 005 (replaced), 006 (drops) |
| `is_workspace_member(workspace_id_param TEXT)` | Check workspace membership | ✅ **Active** | 001 |
| `update_updated_at()` | Auto-update timestamps | ✅ **Active** | 001 |

**Analysis**: 
- `is_brand_member_text()` is deprecated and should be dropped by migration 006
- If migration 006 is not applied, this function may still exist (not a problem, just unused)
- If migration 005 is applied, RLS policies use direct `brand_members` checks instead of helper

### Critical RLS Gaps

#### ✅ **No Critical Gaps**
- All brand-scoped tables have RLS enabled
- All user-scoped tables have RLS enabled
- RLS policies use appropriate checks (brand_members, user_id, service_role)

---

## 4. SUPABASE CHECKLIST

### Supabase Checklist — Local Development

#### Prerequisites
- [ ] Supabase CLI installed (`supabase --version`)
- [ ] Local Supabase running (`supabase start`)
- [ ] Database is empty or you're okay with reset

#### Step 1: Apply Bootstrap Schema
- [ ] **CRITICAL**: Run `001_bootstrap_schema.sql` first
  ```sql
  -- In Supabase Dashboard → SQL Editor, or:
  psql "postgresql://postgres:postgres@localhost:54322/postgres" -f supabase/migrations/001_bootstrap_schema.sql
  ```
- [ ] Verify: Check that 51+ tables exist
  ```sql
  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
  -- Should return 51+
  ```

#### Step 2: Apply Safe Migrations (In Order)
- [ ] Run `002_create_brand_guide_versions.sql` (idempotent)
- [ ] Run `004_activate_generation_logs_table.sql` (idempotent)
- [ ] Run `007_add_media_assets_status_and_rls.sql` (additive)
- [ ] Run `014_content_planning_schema_clarification.sql` (documentation only)
- [ ] Run `20250130_brand_guide_versions_patch.sql` (idempotent)

#### Step 3: Apply Data Migrations (If Needed)
- [ ] **IF** you have existing data with `brand_id TEXT` in persistence tables:
  - [ ] Run `003_fix_brand_id_persistence_schema.sql` (adds `brand_id_uuid`, backfills)
  - [ ] Verify backfill: Check that `brand_id_uuid` is populated
    ```sql
    SELECT COUNT(*) FROM strategy_briefs WHERE brand_id_uuid IS NULL;
    -- Should return 0
    ```
- [ ] **IF** you have existing data with legacy brand guide fields:
  - [ ] Run `009_consolidate_brand_guide_fields.sql` (merges into `brand_kit`)
  - [ ] Verify merge: Check that `brand_kit` contains merged data
    ```sql
    SELECT id, brand_kit->'voiceAndTone', voice_summary FROM brands LIMIT 1;
    -- brand_kit should contain voiceAndTone data
    ```

#### Step 4: Apply RLS Policy Updates (If Needed)
- [ ] **IF** migration 003 was applied:
  - [ ] Run `005_finalize_brand_id_uuid_migration.sql` (updates RLS policies)
  - [ ] Verify policies: Check that policies use `brand_id_uuid`
    ```sql
    SELECT tablename, policyname, qual
    FROM pg_policies
    WHERE tablename IN ('strategy_briefs', 'content_packages')
    AND qual LIKE '%brand_id_uuid%';
    -- Should return policies
    ```

#### Step 5: Verify Schema
- [ ] Check all core tables exist:
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('brands', 'content_items', 'media_assets', 'publishing_jobs', 'analytics_metrics');
  -- Should return all 5 tables
  ```
- [ ] Check RLS is enabled on brand-scoped tables:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('brands', 'content_items', 'media_assets');
  -- rowsecurity should be 't' (true) for all
  ```
- [ ] Check `media_assets` has `status` column (migration 007):
  ```sql
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'media_assets' AND column_name = 'status';
  -- Should return status TEXT
  ```

#### Step 6: Test Multi-Tenant Isolation
- [ ] Create test brand A and brand B
- [ ] Create user in brand A only
- [ ] Verify user from brand A **cannot** see brand B data:
  ```sql
  -- As brand A user, try to query brand B data
  SET LOCAL "request.jwt.claims" = '{"sub": "user-a-uuid", "brand_id": "brand-a-uuid"}';
  SELECT * FROM content_items WHERE brand_id = 'brand-b-uuid';
  -- Should return 0 rows (RLS blocks)
  ```

#### Step 7: **DO NOT APPLY** (Until Verified)
- [ ] ❌ **DO NOT** run `006_drop_legacy_brand_id_text_columns.sql` until:
  - [ ] All application code uses `brand_id_uuid` (no fallback to `brand_id TEXT`)
  - [ ] Verified no code references `brand_id TEXT` in persistence tables
  - [ ] **Backup database first**

---

### Supabase Checklist — Staging/Production

#### Prerequisites
- [ ] **CRITICAL**: Backup production database first
  ```bash
  # Via Supabase Dashboard → Database → Backups
  # Or via CLI:
  supabase db dump -f backup-$(date +%Y%m%d).sql
  ```
- [ ] Verify Supabase project connection
- [ ] Test migrations on staging first

#### Step 1: Verify Current Schema State
- [ ] Check which migrations have been applied:
  ```sql
  -- Check if bootstrap schema exists
  SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
  -- If < 50, bootstrap may not be applied
  ```
- [ ] Check if `brand_id_uuid` columns exist (migration 003):
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'strategy_briefs' AND column_name = 'brand_id_uuid';
  -- If exists, migration 003 applied
  ```
- [ ] Check if `is_brand_member_text()` function exists:
  ```sql
  SELECT routine_name FROM information_schema.routines
  WHERE routine_name = 'is_brand_member_text';
  -- If exists, migration 006 NOT applied
  ```

#### Step 2: Apply Missing Safe Migrations
- [ ] **IF** bootstrap schema not applied:
  - [ ] **STOP**: Do not apply bootstrap to production with existing data
  - [ ] Contact team to plan migration strategy
- [ ] **IF** bootstrap schema applied:
  - [ ] Run `002_create_brand_guide_versions.sql` (idempotent)
  - [ ] Run `004_activate_generation_logs_table.sql` (idempotent)
  - [ ] Run `007_add_media_assets_status_and_rls.sql` (additive)
  - [ ] Run `20250130_brand_guide_versions_patch.sql` (idempotent)

#### Step 3: Apply Data Migrations (If Needed)
- [ ] **IF** persistence tables have `brand_id TEXT` but no `brand_id_uuid`:
  - [ ] **BACKUP FIRST**
  - [ ] Run `003_fix_brand_id_persistence_schema.sql` (adds columns, backfills)
  - [ ] Verify backfill worked:
    ```sql
    SELECT 
      COUNT(*) as total,
      COUNT(brand_id_uuid) as with_uuid,
      COUNT(*) FILTER (WHERE brand_id_uuid IS NULL) as nulls
    FROM strategy_briefs;
    -- nulls should be 0 or very low
    ```
- [ ] **IF** legacy brand guide fields exist but not in `brand_kit`:
  - [ ] **BACKUP FIRST**
  - [ ] Run `009_consolidate_brand_guide_fields.sql` (merges data)
  - [ ] Verify merge:
    ```sql
    SELECT id, 
      (brand_kit->'voiceAndTone' IS NOT NULL) as has_voice,
      (voice_summary IS NOT NULL) as has_legacy_voice
    FROM brands
    WHERE voice_summary IS NOT NULL
    LIMIT 5;
    -- has_voice should be true for most
    ```

#### Step 4: Apply RLS Policy Updates (If Needed)
- [ ] **IF** migration 003 applied but policies still use `is_brand_member_text()`:
  - [ ] **BACKUP FIRST**
  - [ ] Run `005_finalize_brand_id_uuid_migration.sql` (updates policies)
  - [ ] Verify policies updated:
    ```sql
    SELECT tablename, policyname
    FROM pg_policies
    WHERE qual LIKE '%is_brand_member_text%';
    -- Should return 0 rows (all policies updated)
    ```

#### Step 5: Manual Schema Verification
- [ ] In Supabase Dashboard → Table Editor, verify:
  - [ ] `brands` table has columns: `id`, `name`, `brand_kit`, `voice_summary`, `visual_summary`, `tone_keywords`
  - [ ] `media_assets` table has `status` column (default 'active')
  - [ ] `brand_guide_versions` table exists
  - [ ] `generation_logs` table exists

#### Step 6: RLS Verification
- [ ] In Supabase Dashboard → Authentication → Policies, verify:
  - [ ] `brands` table has policies for SELECT, INSERT, UPDATE, DELETE
  - [ ] `media_assets` table has policies for SELECT, INSERT, UPDATE (from migration 007)
  - [ ] `content_items` table has brand member policies
  - [ ] All brand-scoped tables have RLS enabled

#### Step 7: Test Scenarios
- [ ] **Create test brand**:
  - [ ] Create brand via API
  - [ ] Verify brand appears in `brands` table
  - [ ] Verify `brand_kit` is `{}` (empty JSONB)
- [ ] **Brand guide save**:
  - [ ] Update `brand_kit` via API
  - [ ] Verify `brand_guide_versions` has new version row
- [ ] **Content generation**:
  - [ ] Generate content via API
  - [ ] Verify `content_items` has new row
  - [ ] Verify `generation_logs` has new row (if migration 004 applied)
- [ ] **Media assets**:
  - [ ] Upload media via API
  - [ ] Verify `media_assets` has new row with `status = 'active'`
- [ ] **Scheduled content**:
  - [ ] Schedule content via API
  - [ ] Verify `scheduled_content` has new row
- [ ] **Analytics**:
  - [ ] Sync analytics via API
  - [ ] Verify `analytics_metrics` has new rows
- [ ] **Cross-tenant access** (CRITICAL):
  - [ ] Create user in brand A
  - [ ] Create user in brand B
  - [ ] As brand A user, try to query brand B data
  - [ ] **Verify**: Brand A user **cannot** see brand B data (RLS blocks)

#### Step 8: **DO NOT APPLY** (Until Verified)
- [ ] ❌ **DO NOT** run `006_drop_legacy_brand_id_text_columns.sql` in production until:
  - [ ] All application code verified to use `brand_id_uuid` only
  - [ ] No fallback to `brand_id TEXT` in code
  - [ ] Tested on staging for 1+ week
  - [ ] **Full database backup taken**
  - [ ] **Maintenance window scheduled**

---

## 5. RISK NOTES

### Data-Destructive Migrations

#### ❌ **Migration 006: Drop Legacy Columns**
- **Risk**: **IRREVERSIBLE** - Drops `brand_id TEXT` columns from 10 tables
- **Impact**: If code still uses `brand_id TEXT`, queries will fail
- **Mitigation**:
  1. Verify all code uses `brand_id_uuid`
  2. Remove fallback code (`data.brand_id_uuid || data.brand_id`)
  3. Test on staging for 1+ week
  4. **Backup database before applying**
  5. Apply during maintenance window

### High-Risk Migrations (Require Backup)

#### ⚠️ **Migration 003: Add brand_id_uuid Columns**
- **Risk**: Medium - Backfill may fail if `brand_id TEXT` contains non-UUID values
- **Impact**: Some rows may have `NULL` `brand_id_uuid` if backfill fails
- **Mitigation**: Verify backfill after applying:
  ```sql
  SELECT COUNT(*) FROM strategy_briefs WHERE brand_id_uuid IS NULL AND brand_id IS NOT NULL;
  -- Should return 0
  ```

#### ⚠️ **Migration 005: Update RLS Policies**
- **Risk**: Medium - If policies fail to update, RLS may block legitimate access
- **Impact**: Users may lose access to data if policies are incorrect
- **Mitigation**: Test RLS policies after applying:
  ```sql
  -- As test user, verify can access own brand data
  SET LOCAL "request.jwt.claims" = '{"sub": "test-user-uuid", "brand_id": "test-brand-uuid"}';
  SELECT * FROM strategy_briefs WHERE brand_id_uuid = 'test-brand-uuid';
  -- Should return rows (if data exists)
  ```

#### ⚠️ **Migration 009: Consolidate Brand Guide Fields**
- **Risk**: Low - Merge is additive (doesn't overwrite existing `brand_kit` data)
- **Impact**: Minimal - Legacy fields remain for backward compatibility
- **Mitigation**: Verify merge didn't lose data:
  ```sql
  SELECT id, 
    (brand_kit->'voiceAndTone'->>'tone') as merged_tone,
    (voice_summary->>'tone') as legacy_tone
  FROM brands
  WHERE voice_summary IS NOT NULL
  LIMIT 5;
  -- merged_tone should contain legacy_tone data
  ```

### Safe Migrations (No Backup Required)

#### ✅ **Safe to Apply Anytime**
- Migration 001 (bootstrap) - Only on empty database
- Migration 002 (brand guide versions) - Idempotent
- Migration 004 (generation logs) - Idempotent
- Migration 007 (media assets status) - Additive
- Migration 008 (documentation) - No changes
- Migration 20250130 (patch) - Idempotent

---

## 6. SUMMARY & RECOMMENDATIONS

### Repo-Side Analysis

#### ✅ **Strengths**
1. **Consolidated Bootstrap**: Single source of truth (001_bootstrap_schema.sql)
2. **Idempotent Migrations**: Most migrations use `IF NOT EXISTS` and exception handling
3. **Code-Schema Alignment**: Code matches schema (uses correct column names)
4. **RLS Coverage**: All brand-scoped tables have RLS policies
5. **Migration-Aware Code**: Code handles `brand_id_uuid` migration gracefully

#### ⚠️ **Areas of Concern**
1. **Migration 006 Not Applied**: Legacy `brand_id TEXT` columns still exist (code has fallback)
2. **Legacy Brand Guide Fields**: Still exist but should be in `brand_kit` (migration 009 consolidates)
3. **Unused Persistence Tables**: 7 tables not found in codebase (may be legacy)

### Supabase-Side Checklist Summary

#### **Local Development**
1. ✅ Apply bootstrap schema (001)
2. ✅ Apply safe migrations (002, 004, 007, 008, 20250130)
3. ⚠️ Apply data migrations if needed (003, 009)
4. ⚠️ Apply RLS updates if needed (005)
5. ❌ **DO NOT** apply migration 006 yet

#### **Staging/Production**
1. ✅ **BACKUP FIRST**
2. ✅ Verify current schema state
3. ✅ Apply missing safe migrations
4. ⚠️ Apply data migrations with verification
5. ⚠️ Apply RLS updates with testing
6. ❌ **DO NOT** apply migration 006 until code migration complete

### Critical Actions Required

1. **Verify Migration 006 Readiness**:
   - [ ] Search codebase for `brand_id TEXT` references in persistence tables
   - [ ] Remove fallback code (`data.brand_id_uuid || data.brand_id`)
   - [ ] Test on staging
   - [ ] **Then** apply migration 006

2. **Verify RLS Policies**:
   - [ ] Test cross-tenant access (user from brand A cannot see brand B data)
   - [ ] Verify policies use `brand_id_uuid` (if migration 005 applied)

3. **Monitor for Schema Drift**:
   - [ ] Regularly check if new migrations are added
   - [ ] Verify code matches schema after each deployment

---

## 7. VERIFICATION QUERIES

### Quick Health Check Queries

```sql
-- 1. Count all tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';

-- 2. Check RLS enabled on brand-scoped tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('brands', 'content_items', 'media_assets', 'publishing_jobs')
ORDER BY tablename;

-- 3. Check if brand_id_uuid columns exist (migration 003)
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_name IN ('strategy_briefs', 'content_packages', 'brand_history')
AND column_name = 'brand_id_uuid';

-- 4. Check if is_brand_member_text() exists (should be dropped by migration 006)
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'is_brand_member_text';
-- Should return 0 rows if migration 006 applied

-- 5. Check media_assets has status column (migration 007)
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'media_assets' AND column_name = 'status';
-- Should return status TEXT with default 'active'

-- 6. Check brand_guide_versions table exists (migration 002)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'brand_guide_versions';
-- Should return 1 row

-- 7. Check generation_logs table exists (migration 004)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'generation_logs';
-- Should return 1 row
```

---

**Report Generated**: 2025-01-16  
**Next Review**: After applying migrations or schema changes  
**Questions**: Review this report and verify checklist items before applying migrations to production

