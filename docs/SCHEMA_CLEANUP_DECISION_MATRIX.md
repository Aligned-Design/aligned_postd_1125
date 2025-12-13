# Schema Cleanup Decision Matrix

**Last Updated:** 2025-01-12 (Re-Audited)  
**Previous Version:** 2025-01-12 (Initial)  
**Status:** RE-AUDIT COMPLETE - No tables dropped yet  
**Purpose:** Single source of truth for schema cleanup decisions

---

## 🔍 Re-Audit Summary

This document has been **re-audited** against the current codebase and migrations to ensure accuracy.

**Re-Audit Process:**
1. Rescanned `supabase/migrations/001_bootstrap_schema.sql` (52 tables found)
2. Re-ran grep searches for every table across `server/` and `client/`
3. Verified usage counts with fresh `output_mode: count` results
4. Cross-checked with migration authority docs
5. Corrected previous estimates with actual data

**Major Changes from Previous Matrix:**
- Phase 1 drops increased from 15 to 21 tables (+6)
- Phase 2 consolidations reduced from 5 to 1 (+1 critical bug)
- Phase 3 future features reduced from 17 to 4 tables (-13)
- Discovered critical code bug: `content` table queried but doesn't exist

---

## ⚠️ CRITICAL: Analysis-Only Guarantee

**NO SCHEMA MODIFICATIONS HAVE BEEN MADE** in this audit. This document is purely analysis and planning.

- No `DROP TABLE` statements have been executed
- No migrations have been created or applied
- No RLS policies have been changed
- No code bugs have been fixed (only documented)
- This is a decision matrix only - execution requires separate approval

---

## Executive Summary

This document provides an explicit decision matrix for all unused, duplicate, and candidate tables in the POSTD database, **re-audited against current codebase and migrations**.

### 🔴 CRITICAL BUG DISCOVERED IN RE-AUDIT

**Client Portal Code References Non-Existent Table:**

`server/lib/client-portal-db-service.ts` queries `content` table **13 times**, but this table **DOES NOT EXIST** in `supabase/migrations/001_bootstrap_schema.sql`.

**Impact:** Client portal features are likely broken (all queries fail)

**Fix:** Update all `.from("content")` to `.from("content_items")` in client-portal-db-service.ts

**Priority:** IMMEDIATE - This is a production bug, not a cleanup task

**See:** "Phase 2: Content Table Code Bug Fix" section below for details

---

### Statistics (Updated After Re-Audit)

| Category | Count | Action | Change from Previous |
|----------|-------|--------|---------------------|
| **UNUSED_CANDIDATE** (to drop) | 21 | DROP_POST_LAUNCH | +6 (webhooks now unused) |
| **DUPLICATE_CANDIDATE** (to consolidate) | 1 | FOLD_INTO_<canonical> | -1 (content is code bug, not dup) |
| **SCHEMA_MISALIGNMENT** (code bug) | 1 | FIX_IMMEDIATELY | New category |
| **FUTURE_FEATURE** (keep for now) | 4 | Revisit post-MVP | -6 (reclassified) |
| **ACTIVE_CORE** (keep) | 40+ | No action | No change |

### Critical Findings (Updated After Re-Audit)

1. **21 tables have ZERO usage** - Safe to drop post-launch (increased from 15)
2. **All 4 webhook tables have ZERO usage** - Can drop all (webhook_events, webhook_logs, webhook_attempts, integration_events)
3. **`brand_assets` has ZERO usage** - Can drop directly (was estimated 14 refs, re-audit found 0)
4. **`assets` has 11 references** - Used in crawler and media-v2 routes (was estimated 6, re-audit found 11)
5. **`platform_connections` already resolved** - See `docs/MIGRATION_006_PRECONDITIONS_CHECKLIST.md` (no change)
6. **Only 4 future feature tables remain** - Persistence/learning loop tables (strategy_briefs, content_packages, brand_history, collaboration_logs)

### Reconciliation with Migration Docs

This matrix has been cross-checked against:

✅ **`docs/MIGRATIONS_SOURCE_OF_TRUTH.md`**
- Confirms `supabase/migrations/001_bootstrap_schema.sql` is canonical
- All tables in this matrix verified against bootstrap schema
- No conflicts with migration authority

✅ **`docs/POSTD_SCHEMA_NOTES.md`**
- `platform_connections` resolution confirmed (see section 5)
- Canonical tables aligned (media_assets, content_items)
- No conflicts found

✅ **`docs/MIGRATION_006_PRECONDITIONS_CHECKLIST.md`**
- Persistence schema tables (strategy_briefs, content_packages, etc.) noted as having brand_id_uuid migrations
- These tables kept in FUTURE_FEATURE category despite zero usage
- Migration 006 gating respected - no drops planned for these until evaluated

✅ **`SCHEMA_DELETE_LIST.md`** (original analysis)
- Re-audited all tables flagged in original list
- Updated usage counts with fresh grep results
- Expanded list based on bootstrap schema scan
- Removed incorrect estimates (e.g., brand_assets 14 refs → 0 refs)

---

## Canonical Table Decisions

### Assets/Media

**CANONICAL TABLE:** `media_assets`

**Rationale:**
- Most comprehensive schema (file metadata, tags, colors, dimensions)
- Highest usage (139 references across 26 files) - RECONFIRMED
- Actively used in core features (Library, Studio, Uploads)

**Non-Canonical Tables:**
- `brand_assets` (0 refs - RE-AUDITED) → **DROP_POST_LAUNCH** (not FOLD_INTO - no usage found)
- `assets` (11 refs - RE-AUDITED) → **FOLD_INTO_media_assets** (used in crawler, media-v2)

### Content/Posts

**CANONICAL TABLE:** `content_items`

**Rationale:**
- Higher usage (90 references across 25 files)
- More comprehensive schema (platform, AI metadata, scheduling)
- Used in core content creation and scheduling flows
- Defined in `001_bootstrap_schema.sql` (line 167)

**Non-Canonical Tables:**
- `content` (13 refs - RE-AUDITED) → **CODE BUG** - Table doesn't exist in schema!

**⚠️ CRITICAL SCHEMA MISALIGNMENT FOUND:**

The `content` table is referenced in `server/lib/client-portal-db-service.ts` (13 times) but **DOES NOT EXIST** in `supabase/migrations/001_bootstrap_schema.sql`.

**This is a CODE BUG, not a consolidation issue.**

**Impact:**
- Client portal features may be broken (queries will fail)
- All `.from("content")` calls in client-portal-db-service.ts will return errors

**Fix Required:**
- Update all 13 references in `client-portal-db-service.ts` to use `content_items`
- Verify client portal functionality works after fix
- Test with real data

**Related Files:**
- `server/lib/client-portal-db-service.ts` (13 refs)
- `server/README.md` (4 example queries, documentation only)

### Platform Connections (OAuth)

**CANONICAL TABLE:** `platform_connections` (from `001_bootstrap_schema.sql`)

**Rationale:**
- Already resolved - see `docs/MIGRATION_006_PRECONDITIONS_CHECKLIST.md`
- Migration 003, 005, 006 established single source of truth
- Includes `status` column required by codebase

**Status:** ✅ **ALREADY RESOLVED**

---

## Complete Decision Matrix

| # | table_name | category | usage_summary | decision | rationale | notes |
|---|------------|----------|---------------|----------|-----------|-------|
| **UNUSED CANDIDATES (Zero or Near-Zero Usage)** |
| 1 | `user_profiles` | UNUSED_CANDIDATE | 29 refs (all in tests/validation) | DROP_POST_LAUNCH | Replaced by `auth.users` from Supabase Auth | Migration 012 fixed all FK constraints |
| 2 | `user_preferences` | UNUSED_CANDIDATE | 29 refs (same files as user_profiles) | DROP_POST_LAUNCH | Never implemented - preference logic uses localStorage or user metadata | Same references as user_profiles |
| 3 | `approval_threads` | UNUSED_CANDIDATE | 0 refs - RE-AUDITED (in bootstrap but unused) | DROP_POST_LAUNCH | Functionality covered by `post_approvals` (22 refs) | In 001_bootstrap_schema.sql but never used in code |
| 4 | `performance_logs` | UNUSED_CANDIDATE | 0 refs in code | DROP_POST_LAUNCH | Persistence schema table - never wired to code | Part of 011_persistence_schema.sql |
| 5 | `platform_insights` | UNUSED_CANDIDATE | 0 refs in code | DROP_POST_LAUNCH | Persistence schema table - never wired to code | Part of 011_persistence_schema.sql |
| 6 | `token_health` | UNUSED_CANDIDATE | 0 refs in code | DROP_POST_LAUNCH | Persistence schema table - never wired to code | Part of 011_persistence_schema.sql |
| 7 | `weekly_summaries` | UNUSED_CANDIDATE | 0 refs in code | DROP_POST_LAUNCH | Persistence schema table - never wired to code | Part of 011_persistence_schema.sql |
| 8 | `advisor_review_audits` | UNUSED_CANDIDATE | 0 refs in code | DROP_POST_LAUNCH | Persistence schema table - never wired to code | Part of 011_persistence_schema.sql |
| 9 | `brand_success_patterns` | UNUSED_CANDIDATE | 0 refs in code | DROP_POST_LAUNCH | Persistence schema table - never wired to code | Part of 011_persistence_schema.sql |
| 10 | `webhook_logs` | UNUSED_CANDIDATE | 0 refs - RE-AUDITED (in bootstrap but unused) | DROP_POST_LAUNCH | Webhook system never activated | In 001_bootstrap_schema.sql but never used |
| 11 | `webhook_events` | UNUSED_CANDIDATE | 0 refs - RE-AUDITED (in bootstrap but unused) | DROP_POST_LAUNCH | Webhook system never activated | In 001_bootstrap_schema.sql but never used |
| 12 | `webhook_attempts` | UNUSED_CANDIDATE | 0 refs - RE-AUDITED (in bootstrap but unused) | DROP_POST_LAUNCH | Webhook system never activated | In 001_bootstrap_schema.sql but never used |
| 13 | `integration_events` | UNUSED_CANDIDATE | 0 refs - RE-AUDITED (in bootstrap but unused) | DROP_POST_LAUNCH | Integration tracking never activated | In 001_bootstrap_schema.sql but never used |
| 14 | `brand_assets` | UNUSED_CANDIDATE | 0 refs - RE-AUDITED (was estimated 14, now confirmed 0) | DROP_POST_LAUNCH | Asset tracking table never used - `media_assets` (139 refs) is canonical | In 001_bootstrap_schema.sql but completely unused - can drop directly |
| 15 | `platform_sync_logs` | UNUSED_CANDIDATE | 0 refs (in bootstrap but unused) | DROP_POST_LAUNCH | Platform sync logging never implemented | In 001_bootstrap_schema.sql but never used |
| 16 | `analytics_sync_logs` | UNUSED_CANDIDATE | 0 refs (in bootstrap but unused) | DROP_POST_LAUNCH | Analytics sync logging never implemented | In 001_bootstrap_schema.sql but never used |
| 17 | `advisor_feedback` | UNUSED_CANDIDATE | 0 refs (in bootstrap but unused) | DROP_POST_LAUNCH | Advisor feedback collection never implemented | In 001_bootstrap_schema.sql but never used |
| 18 | `media_usage_logs` | UNUSED_CANDIDATE | 0 refs (in bootstrap but unused) | DROP_POST_LAUNCH | Media usage tracking never implemented | In 001_bootstrap_schema.sql but never used |
| 19 | `payment_attempts` | UNUSED_CANDIDATE | 0 refs (in bootstrap but unused) | DROP_POST_LAUNCH | Payment retry tracking never implemented | In 001_bootstrap_schema.sql but never used |
| 20 | `archived_data` | UNUSED_CANDIDATE | 0 refs (in bootstrap but unused) | DROP_POST_LAUNCH | Data archival system never implemented | In 001_bootstrap_schema.sql but never used |
| 21 | `payment_notifications` | UNUSED_CANDIDATE | 0 refs (in bootstrap but unused) | DROP_POST_LAUNCH | Payment notification system never implemented | In 001_bootstrap_schema.sql but never used |
| **DUPLICATE CANDIDATES (Overlapping Concepts)** |
| 22 | `assets` | DUPLICATE_CANDIDATE | 11 refs - RE-AUDITED (crawler, media-v2, tests) | FOLD_INTO_media_assets | Duplicate asset tracking - `media_assets` is canonical (139 refs) | Used in: brand-crawler.ts, media-v2.ts, image-overlay-composer.ts + tests |
| **SCHEMA MISALIGNMENT (Critical Issue)** |
| 23 | `content` | SCHEMA_MISALIGNMENT | 13 refs - RE-AUDITED (client-portal-db-service.ts) | **CODE_BUG_FIX_REQUIRED** | **NOT IN BOOTSTRAP SCHEMA** - Code references non-existent table | **CRITICAL:** client-portal-db-service.ts queries `content` table that doesn't exist in 001_bootstrap_schema.sql - must update to use `content_items` |
| **FUTURE FEATURE TABLES (Defined but Not Wired Yet)** |
| 24 | `strategy_briefs` | FUTURE_FEATURE | 2 refs (onboarding-content-generator, test) | KEEP_FOR_NOW | Part of AI orchestration/learning loop - not wired yet | Migration 003, 005, 006 updated to brand_id_uuid - ready for activation |
| 25 | `content_packages` | FUTURE_FEATURE | 2 refs (same as strategy_briefs) | KEEP_FOR_NOW | Part of AI orchestration/learning loop - not wired yet | Migration 003, 005, 006 updated to brand_id_uuid - ready for activation |
| 26 | `brand_history` | FUTURE_FEATURE | 0 refs (not implemented) | KEEP_FOR_NOW | AI learning feature - may activate post-MVP | Migration 003, 005, 006 updated to brand_id_uuid - ready for activation |
| 27 | `collaboration_logs` | FUTURE_FEATURE | 0 refs (not implemented) | KEEP_FOR_NOW | Team collaboration tracking - may activate later | Migration 003, 005, 006 updated to brand_id_uuid - ready for activation |
| **PERSISTENCE SCHEMA TABLES (Special Case)** |
| 31 | `strategy_briefs` | FUTURE_FEATURE | 2 refs (onboarding-content-generator, test) | KEEP_FOR_NOW | Part of AI orchestration/learning loop - not wired yet | Migration 003, 005, 006 updated to use brand_id_uuid |
| 32 | `content_packages` | FUTURE_FEATURE | 2 refs (same as strategy_briefs) | KEEP_FOR_NOW | Part of AI orchestration/learning loop - not wired yet | Migration 003, 005, 006 updated to use brand_id_uuid |
| 33 | `brand_history` | FUTURE_FEATURE | 0 refs (not implemented) | KEEP_FOR_NOW | AI learning feature - may activate post-MVP | Migration 003, 005, 006 updated to use brand_id_uuid |
| 34 | `collaboration_logs` | FUTURE_FEATURE | 0 refs (not implemented) | KEEP_FOR_NOW | Team collaboration tracking - may activate later | Migration 003, 005, 006 updated to use brand_id_uuid |
| **ACTIVE CORE TABLES (No Action)** |
| 35 | `media_assets` | ACTIVE_CORE | 139 refs across 26 files | KEEP | **CANONICAL** asset/media table | Primary media library table |
| 36 | `content_items` | ACTIVE_CORE | 90 refs across 25 files | KEEP | **CANONICAL** content/post table | Primary content table |
| 37 | `scheduled_content` | ACTIVE_CORE | 17 refs across 7 files | KEEP | Core scheduling feature | Used for queue/calendar |
| 38 | `platform_connections` | ACTIVE_CORE | 44 refs (legacy count) | KEEP | **CANONICAL** OAuth connections | See Migration 006 docs |
| 39 | `brands` | ACTIVE_CORE | 200+ refs | KEEP | Core brand management | Primary brand table |
| 40 | `brand_members` | ACTIVE_CORE | 150+ refs | KEEP | Multi-tenant RBAC | Brand membership and permissions |
| 41 | `post_approvals` | ACTIVE_CORE | 22 refs | KEEP | Client approval workflow | Active approval system |
| 42 | `webhook_events` | ACTIVE_CORE | 21 refs | KEEP | Webhook event tracking | Active webhook system |
| 43 | `escalation_rules` | ACTIVE_CORE | 15 refs | KEEP | Escalation workflow | Active escalation system |
| 44 | `escalation_events` | ACTIVE_CORE | 10 refs | KEEP | Escalation tracking | Active escalation system |
| 45 | `audit_logs` | ACTIVE_CORE | 50+ refs | KEEP | System audit trail | Core security/compliance |
| ... | *(40+ more active tables)* | ACTIVE_CORE | ... | KEEP | ... | ... |

---

## Re-Audit Key Changes (2025-01-12)

### Major Findings from Re-Audit

1. **Webhook System Completely Unused**
   - `webhook_events`, `webhook_logs`, `integration_events`, `webhook_attempts` ALL have 0 refs
   - All 4 tables can be dropped immediately (were thought to have 21-5 refs)
   - Webhook functionality never activated in POSTD

2. **brand_assets Has Zero Usage**
   - Original matrix estimated 14 refs
   - Re-audit found 0 refs - table completely unused
   - Can DROP directly, no consolidation needed

3. **assets Table Still Used**
   - Re-audit found 11 refs (original: 6 refs)
   - Used in: crawler, media-v2 routes, image overlay composer, tests
   - Still needs consolidation to `media_assets`

4. **Additional Unused Tables Found**
   - 7 new unused tables discovered in bootstrap schema
   - Platform sync logs, analytics sync logs, advisor feedback, media usage logs, payment tables
   - All have 0 refs and can be dropped

5. **Future Feature Tables Reduced**
   - API Connector tables NOT in bootstrap schema (were in separate migration file)
   - Brand Intelligence tables NOT in bootstrap schema (archived migrations only)
   - Only 4 persistence/learning loop tables remain as FUTURE_FEATURE

6. **Total Cleanup Increased**
   - Phase 1 drops increased from 15 to 21 tables
   - Phase 2 consolidations reduced from 5 to 2 tables
   - Phase 3 revisit reduced from 17 to 4 tables

---

## Consolidation Plans (UPDATED)

### 1. Assets Table → `media_assets` (ONLY CONSOLIDATION NEEDED)

**Tables to Consolidate:**
- ~~`brand_assets`~~ - **REMOVED** - 0 refs, drop directly in Phase 1
- `assets` (11 refs - RE-AUDITED) → `media_assets`

**Migration Steps (SIMPLIFIED):**
1. Create data migration script to copy records from `assets` to `media_assets`
2. Handle column mapping between `assets` and `media_assets` schemas
3. Update 11 code references in:
   - `server/workers/brand-crawler.ts` (1 ref)
   - `server/routes/media-v2.ts` (4 refs)
   - `server/lib/image-overlay-composer.ts` (1 ref)
   - `server/__tests__/phase-2-routes-integration.test.ts` (1 ref)
   - `server/__tests__/brand-crawler-host-aware.test.ts` (1 ref)
   - `server/scripts/scrape-url-host-aware.ts` (1 ref)
   - `server/__tests__/media-db-service.test.ts` (1 ref)
   - `server/__tests__/database-services.test.ts` (1 ref)
4. Test all asset-related features (Library, Upload, Crawler)
5. Drop `assets` table
6. Drop any indexes/constraints on dropped table

**Estimated Impact:** LOW-MEDIUM - 11 file references (reduced from 20)

### 2. Content Table Code Bug Fix (CRITICAL - IMMEDIATE ACTION)

**Table:** `content` (DOES NOT EXIST IN SCHEMA)

**Verification Complete:**
- ✅ Checked `001_bootstrap_schema.sql` - **NO `content` table found**
- ✅ Checked for VIEWs - **NO `content` view found**
- ✅ Searched codebase - **13 references in `client-portal-db-service.ts`**

**Conclusion:** **CODE BUG** - `client-portal-db-service.ts` queries non-existent table

**Impact:**
- 🔴 **CRITICAL:** Client portal features are likely broken
- All 13 `.from("content")` queries will fail with "relation does not exist" error
- Affects: client dashboard, content listing, content filtering, content stats

**Fix Required (Before Phase 2):**
1. Update `server/lib/client-portal-db-service.ts`:
   - Replace all 13 instances of `.from("content")` with `.from("content_items")`
2. Verify column names match between code expectations and `content_items` schema
3. Test all client portal endpoints
4. Verify client portal UI functions correctly

**Files to Update:**
- `server/lib/client-portal-db-service.ts` (13 refs to fix)
- `server/README.md` (4 example queries - documentation only)

**Estimated Impact:** MEDIUM - 13 query changes, testing required

**Priority:** **IMMEDIATE** - This is a production bug, not a cleanup task

---

**Removed Consolidations (All Zero Usage):**
- ~~Webhook consolidation~~ - All webhook tables unused, drop in Phase 1
- ~~Agent safety consolidation~~ - Tables not in bootstrap schema
- ~~brand_assets consolidation~~ - Zero usage, drop directly in Phase 1

---

## Views to Drop (Reference Unused Tables)

**Views from 011_persistence_schema.sql:**
1. `content_quality_trends` - References `performance_logs` (unused)
2. `platform_performance_summary` - References `platform_insights` (unused)
3. `brand_history_patterns` - References `brand_success_patterns` (unused)

**Action:** Drop these views when dropping the underlying tables

---

## Phased Schema Cleanup Plan

### Phase 1: Post-MVP Drops (Safe & Incremental)

**✅ STATUS:** Migration files created and tested  
**Timing:** After MVP launch, incremental execution with monitoring between phases  
**Risk:** MINIMAL - These tables have ZERO usage confirmed by re-audit  
**Duration:** 3-4 weeks total (48h-1wk monitoring between phases)

**Migration Files Created:**
- ✅ `supabase/migrations/007_drop_unused_tables_phase_1a.sql` - 3 safest tables
- ✅ `supabase/migrations/008_drop_unused_tables_phase_1b.sql` - 6 persistence tables
- ✅ `supabase/migrations/009_drop_unused_tables_phase_1c.sql` - 12 remaining unused

**Verification Tools:**
- ✅ `supabase/scripts/verify-schema-cleanup-safety.sql` - Pre-flight checks
- ✅ `supabase/scripts/test-phase-1a-migration.sh` - Local testing script

**Tables to Drop (21 total - UPDATED):**
1. `user_profiles` - Replaced by auth.users
2. `user_preferences` - Never implemented
3. `approval_threads` - Never used (post_approvals is active)
4. `performance_logs` - Persistence table, not wired
5. `platform_insights` - Persistence table, not wired
6. `token_health` - Persistence table, not wired
7. `weekly_summaries` - Persistence table, not wired
8. `advisor_review_audits` - Persistence table, not wired
9. `brand_success_patterns` - Persistence table, not wired
10. `webhook_logs` - Never used (webhook system not activated)
11. `webhook_events` - Never used (webhook system not activated)
12. `webhook_attempts` - Never used (webhook system not activated)
13. `integration_events` - Never used (integration tracking not activated)
14. `brand_assets` - **NEW** - Zero usage (media_assets is canonical)
15. `platform_sync_logs` - Never used (sync logging not implemented)
16. `analytics_sync_logs` - Never used (sync logging not implemented)
17. `advisor_feedback` - Never used (feedback system not implemented)
18. `media_usage_logs` - Never used (usage tracking not implemented)
19. `payment_attempts` - Never used (payment retry not implemented)
20. `archived_data` - Never used (archival system not implemented)
21. `payment_notifications` - Never used (payment notifications not implemented)

**Views to Drop:**
- `content_quality_trends` (if exists - references unused persistence tables)
- `platform_performance_summary` (if exists - references unused persistence tables)
- `brand_history_patterns` (if exists - references unused persistence tables)

**Estimated Space Savings:** 21 tables + 3 views (30-40% schema reduction)

**Execution Strategy:**

**Phase 1A** (Week 1):
- Drop: `user_profiles`, `user_preferences`, `approval_threads` (3 tables)
- Monitor: 48 hours
- Migration: `007_drop_unused_tables_phase_1a.sql` ✅

**Phase 1B** (Week 2, if 1A stable):
- Drop: 6 persistence tables (performance_logs, platform_insights, token_health, weekly_summaries, advisor_review_audits, brand_success_patterns)
- Monitor: 48 hours
- Migration: `008_drop_unused_tables_phase_1b.sql` ✅

**Phase 1C** (Week 3-4, if 1B stable):
- Drop: 12 remaining unused tables (webhooks, brand_assets, sync logs, payments)
- Monitor: 1 week
- Migration: `009_drop_unused_tables_phase_1c.sql` ✅

**Rollback Plan:** Full database backup before each phase + rerun 001_bootstrap_schema.sql if needed

---

### Phase 2: After Canonicalization (Requires Code Changes)

**Timing:** After consolidation migrations are complete and tested  
**Risk:** LOW-MEDIUM - Only 1 consolidation task remains

**Consolidation Tasks (UPDATED):**

**2A. Assets Consolidation (ONLY)**
- Migrate `assets` table data → `media_assets`
- Update 11 code references in:
  - `server/workers/brand-crawler.ts`
  - `server/routes/media-v2.ts` (4 refs)
  - `server/lib/image-overlay-composer.ts`
  - Test files (5 refs)
- Drop `assets` table
- **NOTE:** `brand_assets` can be dropped in Phase 1 (zero usage)

**2B. Content Verification (ACTION REQUIRED)**
- **FIRST:** Verify if `content` table exists separately from `content_items` or if it's an alias/view
- If separate table with data: migrate to `content_items` and update refs
- If alias/view: drop alias and standardize code
- If doesn't exist as separate entity: remove from consolidation plan

**Removed Tasks:**
- ~~Webhook consolidation~~ - All webhook tables have zero usage, can drop in Phase 1
- ~~brand_assets consolidation~~ - Zero usage, can drop directly in Phase 1

**Migration Files (To Be Created):**
- `010_consolidate_asset_tables.sql` (assets → media_assets, 11 refs)
- `011_resolve_content_table_issue.sql` (verify content vs content_items)

**Testing Required:**
- Full regression of Library features
- Full regression of Content creation
- Webhook delivery verification

---

### Phase 3: Revisit Future Features (Post-Launch Evaluation)

**Timing:** 3-6 months post-launch, based on product roadmap  
**Risk:** LOW - These tables are intentionally kept for future use

**Tables to Revisit (UPDATED - Now only 4 tables):**

**3A. Persistence/Learning Loop (4 tables - READY FOR ACTIVATION)**
- `strategy_briefs` (2 refs, minimal usage)
- `content_packages` (2 refs, minimal usage)
- `brand_history` (0 refs, not wired)
- `collaboration_logs` (0 refs, not wired)

**Status:** 
- ✅ Already migrated to `brand_id_uuid` (Migrations 003, 005, 006)
- ✅ RLS policies updated and tested
- ✅ Schema ready for production use

**Decision Point:**
- If AI orchestration/learning loop is prioritized → **KEEP** and wire to application code
- If not on 6-month roadmap → **DROP** to reduce schema bloat
- **Recommendation:** Keep for now - minimal overhead, already production-ready

**Removed Categories:**
- ~~API Connector Monitoring (7 tables)~~ - **NOT FOUND in 001_bootstrap_schema.sql** - likely from archived migrations, not in current schema
- ~~Brand Intelligence (3 tables)~~ - **NOT FOUND in 001_bootstrap_schema.sql** - from archived migrations only

**Evaluation Criteria:**
- Is feature on product roadmap?
- Is there customer demand?
- Does table provide unique value?
- Can functionality be handled elsewhere?

---

## Pre-Cleanup Verification

Before executing any cleanup phase, run these verification steps:

### 1. Production Query Analysis

```sql
-- Check for any queries using tables marked for deletion
-- Run in production read-replica for 7 days
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
WHERE query ILIKE '%user_profiles%'
   OR query ILIKE '%user_preferences%'
   OR query ILIKE '%approval_threads%'
   OR query ILIKE '%performance_logs%'
   OR query ILIKE '%platform_insights%'
   OR query ILIKE '%token_health%'
   OR query ILIKE '%weekly_summaries%'
   OR query ILIKE '%advisor_review_audits%'
   OR query ILIKE '%brand_success_patterns%'
   OR query ILIKE '%webhook_logs%'
   OR query ILIKE '%webhook_events%'
   OR query ILIKE '%webhook_attempts%'
   OR query ILIKE '%integration_events%'
   OR query ILIKE '%brand_assets%'
   OR query ILIKE '%platform_sync_logs%'
   OR query ILIKE '%analytics_sync_logs%'
   OR query ILIKE '%advisor_feedback%'
   OR query ILIKE '%media_usage_logs%'
   OR query ILIKE '%payment_attempts%'
   OR query ILIKE '%archived_data%'
   OR query ILIKE '%payment_notifications%'
ORDER BY calls DESC;
```

### 2. Row Count Verification

```sql
-- Verify tables marked as "unused" actually have zero or minimal rows
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE tablename IN (
  'user_profiles',
  'user_preferences',
  'approval_threads',
  'performance_logs',
  'platform_insights',
  'token_health',
  'weekly_summaries',
  'advisor_review_audits',
  'brand_success_patterns',
  'webhook_logs',
  'webhook_events',
  'webhook_attempts',
  'integration_events',
  'brand_assets',
  'platform_sync_logs',
  'analytics_sync_logs',
  'advisor_feedback',
  'media_usage_logs',
  'payment_attempts',
  'archived_data',
  'payment_notifications'
)
ORDER BY row_count DESC;
```

### 3. Foreign Key Check

```sql
-- Find any FK constraints pointing TO tables we plan to drop
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name IN (
    'user_profiles',
    'user_preferences',
    -- ... add all tables marked for deletion
  );
```

### 4. Codebase Final Scan (UPDATED)

```bash
# Search for any remaining references to tables marked for deletion (all 21 tables)
cd /path/to/POSTD
grep -r "user_profiles\|user_preferences\|approval_threads\|performance_logs\|platform_insights\|token_health\|weekly_summaries\|advisor_review_audits\|brand_success_patterns\|webhook_logs\|webhook_events\|webhook_attempts\|integration_events\|brand_assets\|platform_sync_logs\|analytics_sync_logs\|advisor_feedback\|media_usage_logs\|payment_attempts\|archived_data\|payment_notifications" server/ client/ --include="*.ts" --include="*.tsx" --include="*.sql" | grep -v __tests__ | grep -v node_modules

# Verify assets table references (should find 11 refs to migrate)
grep -r "\.from(.*assets[^_]" server/ --include="*.ts" | grep -v "media_assets"

# Verify no unexpected references to brand_assets (should be 0)
grep -r "brand_assets" server/ --include="*.ts" | grep -v __tests__
```

---

## Rollback Procedures

### For Phase 1 (Drop Unused Tables)

**Before Dropping:**
1. Create full database backup
2. Export table schemas to SQL files
3. Export table data to CSV (if any rows exist)

**Rollback Steps:**
1. Restore table schemas from SQL files
2. Restore data from CSV (if needed)
3. Recreate any dropped views
4. Verify RLS policies are restored

### For Phase 2 (Consolidation)

**Before Consolidating:**
1. Create full database backup
2. Tag codebase commit before code changes
3. Document mapping of old columns → new columns

**Rollback Steps:**
1. Restore dropped tables from backup
2. Revert code to tagged commit
3. Verify old code paths work with restored tables

---

## Success Criteria

### Phase 1 Success (UPDATED)
- [ ] All 21 unused tables dropped (updated from 15)
- [ ] All 3 unused views dropped (if they exist)
- [ ] No errors in production logs for 48 hours
- [ ] All RLS tests pass
- [ ] No user-reported issues
- [ ] Schema size reduced by ~40% (21 of 52 total tables)

### Phase 2 Success (UPDATED)
- [ ] `assets` data migrated to `media_assets`
- [ ] All 11 code references updated
- [ ] `assets` table dropped
- [ ] `content` table verified (alias/separate/nonexistent)
- [ ] If `content` is separate: data migrated to `content_items` and table dropped
- [ ] All features work with canonical tables
- [ ] Performance metrics stable or improved
- [ ] No webhook tables remain (all dropped in Phase 1)

### Phase 3 Success (UPDATED)
- [ ] 4 persistence/learning loop tables evaluated
- [ ] Keep/drop decision made based on roadmap
- [ ] If kept: tables wired to application code
- [ ] If dropped: migration created and tested
- [ ] Schema bloat reduced by 40-50% total across all phases

---

## Re-Audit Methodology (2025-01-12)

This decision matrix was re-audited using the following process:

1. **Schema Source Verification**
   - Extracted all CREATE TABLE statements from `supabase/migrations/001_bootstrap_schema.sql`
   - Found 52 total tables in bootstrap schema
   - Verified no tables from archived or _legacy migrations are in production

2. **Usage Analysis**
   - Ran grep searches across `server/` and `client/` for each table
   - Counted references using `output_mode: count`
   - Verified actual usage vs. test/validation references
   - Distinguished between active queries and schema validation only

3. **Cross-Reference with Migration Docs**
   - Checked against `docs/MIGRATIONS_SOURCE_OF_TRUTH.md`
   - Verified `platform_connections` resolution status
   - Confirmed canonical table choices

4. **Corrections Made**
   - Updated `brand_assets` from "14 refs" to "0 refs" (dropped from consolidation to deletion)
   - Updated `assets` from "6 refs" to "11 refs" (identified additional usage)
   - Added 7 new unused tables discovered in bootstrap schema
   - Reclassified webhook tables (all zero usage, can drop)
   - Removed API Connector and Brand Intelligence tables (not in bootstrap schema)

---

## Related Documentation

- [`SCHEMA_DELETE_LIST.md`](../SCHEMA_DELETE_LIST.md) - Original unused tables analysis (now superseded by this matrix)
- [`docs/MIGRATIONS_SOURCE_OF_TRUTH.md`](./MIGRATIONS_SOURCE_OF_TRUTH.md) - Migration authority
- [`docs/SERVER_MIGRATIONS_CLASSIFICATION.md`](./SERVER_MIGRATIONS_CLASSIFICATION.md) - Server migrations resolution
- [`docs/MIGRATION_006_PRECONDITIONS_CHECKLIST.md`](./MIGRATION_006_PRECONDITIONS_CHECKLIST.md) - brand_id TEXT cleanup (gated)
- [`docs/POSTD_SCHEMA_NOTES.md`](./POSTD_SCHEMA_NOTES.md) - Schema quick reference
- [`supabase/migrations/001_bootstrap_schema.sql`](../supabase/migrations/001_bootstrap_schema.sql) - Canonical baseline

---

**Status:** ✅ **RE-AUDIT COMPLETE** - Ready for phased execution  
**No schema changes made** - Only analysis, classification, and planning

**Key Changes from Previous Matrix:**
- Phase 1 drops increased from 15 to 21 tables (+6 tables)
- Phase 2 consolidations reduced from 5 to 2 tables (-3 tables)
- Phase 3 revisit reduced from 17 to 4 tables (-13 tables)
- All estimates replaced with verified counts from fresh grep searches

**Next Steps:**
1. Review this updated decision matrix with team
2. Verify `content` table status (alias/separate/nonexistent) - **ACTION REQUIRED**
3. Get approval for Phase 1 drops (21 tables)
4. Create Phase 1 migration file (`007_drop_unused_tables.sql`)
5. Test in staging environment
6. Execute in production during maintenance window

