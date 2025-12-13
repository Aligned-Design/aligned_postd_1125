# Migration 006 Preconditions Checklist

**Migration File:** `supabase/migrations/006_drop_legacy_brand_id_text_columns.sql`  
**Status:** ⚠️ **GATED - DO NOT RUN WITHOUT APPROVAL**  
**Type:** DESTRUCTIVE AND IRREVERSIBLE  
**Last Updated:** 2025-01-12

---

## ⚠️ CRITICAL WARNING

**This migration is DESTRUCTIVE and IRREVERSIBLE.**

Migration 006 **permanently drops** the legacy `brand_id TEXT` columns from 10 persistence schema tables. Once executed, **there is no automatic rollback**.

**DO NOT RUN THIS MIGRATION** until ALL preconditions below are satisfied and verified in the target environment.

---

## What This Migration Does

Migration 006 performs the following **irreversible** operations:

1. **Drops 10 indexes** on `brand_id TEXT` columns
2. **Drops 10 `brand_id TEXT` columns** from persistence tables
3. **Drops** the `is_brand_member_text()` helper function

### Affected Tables (10)

| Table                    | Column Dropped    | Replacement Column  | Index Dropped                          |
|--------------------------|-------------------|---------------------|----------------------------------------|
| `strategy_briefs`        | `brand_id` (TEXT) | `brand_id_uuid`     | `idx_strategy_briefs_brand_id`         |
| `content_packages`       | `brand_id` (TEXT) | `brand_id_uuid`     | `idx_content_packages_brand_id`        |
| `brand_history`          | `brand_id` (TEXT) | `brand_id_uuid`     | `idx_brand_history_brand_id`           |
| `brand_success_patterns` | `brand_id` (TEXT) | `brand_id_uuid`     | `idx_brand_success_patterns_brand_id`  |
| `collaboration_logs`     | `brand_id` (TEXT) | `brand_id_uuid`     | `idx_collaboration_logs_brand_id`      |
| `performance_logs`       | `brand_id` (TEXT) | `brand_id_uuid`     | `idx_performance_logs_brand_id`        |
| `platform_insights`      | `brand_id` (TEXT) | `brand_id_uuid`     | `idx_platform_insights_brand_id`       |
| `token_health`           | `brand_id` (TEXT) | `brand_id_uuid`     | `idx_token_health_brand_id`            |
| `weekly_summaries`       | `brand_id` (TEXT) | `brand_id_uuid`     | `idx_weekly_summaries_brand_id`        |
| `advisor_review_audits`  | `brand_id` (TEXT) | `brand_id_uuid`     | `idx_advisor_review_audits_brand_id`   |

### Helper Function Dropped

- `is_brand_member_text(TEXT)` - RLS helper for TEXT-based brand_id (replaced by direct UUID checks)

---

## Prerequisites (Must Be Applied First)

Migration 006 **REQUIRES** the following migrations to be applied in order:

- ✅ **Migration 003**: `003_fix_brand_id_persistence_schema.sql`
  - Adds `brand_id_uuid` columns to all 10 tables
  - Backfills `brand_id_uuid` from existing `brand_id TEXT` values
  - Creates indexes on `brand_id_uuid`

- ✅ **Migration 005**: `005_finalize_brand_id_uuid_migration.sql`
  - Adds foreign key constraints: `brand_id_uuid REFERENCES brands(id)`
  - Updates all RLS policies to use `brand_id_uuid` instead of `is_brand_member_text()`
  - Marks `brand_id TEXT` columns as deprecated

- ✅ **Migration 010** (if exists): `010_ensure_rls_policies_use_brand_id_uuid.sql`
  - Ensures all RLS policies use `brand_id_uuid` (double-check after migration 005)

**Verification:**

```sql
-- Check migrations 003, 005, 010 have been applied
SELECT version FROM schema_migrations
WHERE version IN ('003', '005', '010')
ORDER BY version;
-- Should return 3 rows (or 2 if 010 doesn't exist)
```

---

## Preconditions Checklist

### ✅ Phase 1: Database Schema Verification

Run these checks **IN THE TARGET ENVIRONMENT** before proceeding:

- [ ] **1.1** All 10 tables have `brand_id_uuid UUID` columns

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'strategy_briefs', 'content_packages', 'brand_history',
    'brand_success_patterns', 'collaboration_logs', 'performance_logs',
    'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
  )
  AND column_name = 'brand_id_uuid';
-- MUST return exactly 10 rows
```

- [ ] **1.2** All `brand_id_uuid` columns are populated (no NULLs in active records)

```sql
-- Check for NULL brand_id_uuid values
SELECT 'strategy_briefs' AS table_name, COUNT(*) AS null_count
FROM strategy_briefs WHERE brand_id_uuid IS NULL
UNION ALL
SELECT 'content_packages', COUNT(*) FROM content_packages WHERE brand_id_uuid IS NULL
UNION ALL
SELECT 'brand_history', COUNT(*) FROM brand_history WHERE brand_id_uuid IS NULL
UNION ALL
SELECT 'brand_success_patterns', COUNT(*) FROM brand_success_patterns WHERE brand_id_uuid IS NULL
UNION ALL
SELECT 'collaboration_logs', COUNT(*) FROM collaboration_logs WHERE brand_id_uuid IS NULL
UNION ALL
SELECT 'performance_logs', COUNT(*) FROM performance_logs WHERE brand_id_uuid IS NULL
UNION ALL
SELECT 'platform_insights', COUNT(*) FROM platform_insights WHERE brand_id_uuid IS NULL
UNION ALL
SELECT 'token_health', COUNT(*) FROM token_health WHERE brand_id_uuid IS NULL
UNION ALL
SELECT 'weekly_summaries', COUNT(*) FROM weekly_summaries WHERE brand_id_uuid IS NULL
UNION ALL
SELECT 'advisor_review_audits', COUNT(*) FROM advisor_review_audits WHERE brand_id_uuid IS NULL;
-- ALL null_count values MUST be 0
```

- [ ] **1.3** All 10 tables have foreign key constraints on `brand_id_uuid`

```sql
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint
WHERE conname LIKE 'fk_%_brand_id_uuid'
ORDER BY conname;
-- MUST return exactly 10 rows
```

- [ ] **1.4** All RLS policies use `brand_id_uuid` (NOT `brand_id` TEXT or `is_brand_member_text()`)

```sql
-- Check for policies still using legacy brand_id TEXT or is_brand_member_text()
SELECT tablename, policyname, qual
FROM pg_policies
WHERE tablename IN (
  'strategy_briefs', 'content_packages', 'brand_history',
  'brand_success_patterns', 'collaboration_logs', 'performance_logs',
  'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
)
AND (
  qual LIKE '%is_brand_member_text%'
  OR (qual LIKE '%brand_id%' AND qual NOT LIKE '%brand_id_uuid%')
);
-- MUST return 0 rows
```

- [ ] **1.5** Indexes on `brand_id_uuid` exist for all 10 tables

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN (
  'strategy_briefs', 'content_packages', 'brand_history',
  'brand_success_patterns', 'collaboration_logs', 'performance_logs',
  'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
)
AND indexname LIKE '%brand_id_uuid%'
ORDER BY tablename;
-- MUST return at least 10 rows
```

---

### ✅ Phase 2: Application Code Verification

- [ ] **2.1** No server code references legacy `brand_id TEXT` columns in persistence tables

```bash
# Search for legacy column references in server code
cd /path/to/POSTD
grep -r "\.brand_id[^_]" server/ --include="*.ts" | grep -E "(strategy_briefs|content_packages|brand_history|brand_success_patterns|collaboration_logs|performance_logs|platform_insights|token_health|weekly_summaries|advisor_review_audits)"
# MUST return 0 results (or only template string replacements like {{brand_id}})
```

**Status:** ✅ Verified on 2025-01-12
- `persistence-service.ts`: Uses in-memory store only (DB operations are disabled/commented)
- `advisor-event-logger.ts`: No direct DB queries (uses event logger abstraction)
- `routes/agents.ts` and `workers/generation-pipeline.ts`: Only template string replacements (`{{brand_id}}`), NOT database columns

- [ ] **2.2** All Supabase client queries use `brand_id_uuid` for persistence tables

```bash
# Search for .from() calls to persistence tables
grep -r "\.from\(" server/ --include="*.ts" | grep -E "(strategy_briefs|content_packages|brand_history|brand_success_patterns|collaboration_logs|performance_logs|platform_insights|token_health|weekly_summaries|advisor_review_audits)"
# Manually verify each result uses brand_id_uuid, not brand_id
```

- [ ] **2.3** No client code references legacy `brand_id TEXT` columns in persistence tables

```bash
grep -r "brand_id[^_]" client/ --include="*.ts" --include="*.tsx" | grep -E "(strategy_briefs|content_packages|brand_history|brand_success_patterns|collaboration_logs|performance_logs|platform_insights|token_health|weekly_summaries|advisor_review_audits)"
# MUST return 0 results
```

---

### ✅ Phase 3: Testing Verification

- [ ] **3.1** All RLS tests pass using `brand_id_uuid`

```bash
cd /path/to/POSTD
pnpm test:rls
# OR
pnpm test -- rls
# ALL tests MUST pass
```

- [ ] **3.2** Persistence schema tests pass (if they exist)

```bash
pnpm test -- persistence
# ALL tests MUST pass
```

- [ ] **3.3** Integration tests pass in environment with migrations 003, 005, 010 applied

```bash
pnpm test:integration
# ALL tests MUST pass
```

---

### ✅ Phase 4: Deployment Safety

- [ ] **4.1** Full database backup created for target environment

```bash
# For Supabase hosted:
# Use Supabase Dashboard → Database → Backups → Create Backup

# For self-hosted:
pg_dump -U postgres -h <host> -d <database> > backup_before_migration_006_$(date +%Y%m%d_%H%M%S).sql
```

- [ ] **4.2** Rollback plan documented and tested

**Rollback Steps** (if migration 006 fails mid-execution):

1. **DO NOT attempt to re-add dropped columns manually** (data will be lost)
2. Restore from backup taken in step 4.1
3. Investigate failure reason
4. Re-verify all preconditions
5. Retry migration 006 only after all preconditions pass

- [ ] **4.3** Deployment window scheduled (recommend low-traffic period)

- [ ] **4.4** On-call engineer available during deployment

- [ ] **4.5** Monitoring and alerting configured for:
  - Database error rates
  - RLS policy failures
  - Application errors related to persistence tables

---

### ✅ Phase 5: Final Sign-Off

- [ ] **5.1** Database administrator reviewed and approved

  - **Name:** ___________________________
  - **Date:** ___________________________
  - **Signature:** ___________________________

- [ ] **5.2** Backend lead reviewed and approved

  - **Name:** ___________________________
  - **Date:** ___________________________
  - **Signature:** ___________________________

- [ ] **5.3** CTO/Technical lead reviewed and approved

  - **Name:** ___________________________
  - **Date:** ___________________________
  - **Signature:** ___________________________

---

## Post-Migration Verification

After successfully running migration 006, verify:

- [ ] **V.1** All `brand_id TEXT` columns are dropped

```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'strategy_briefs', 'content_packages', 'brand_history',
    'brand_success_patterns', 'collaboration_logs', 'performance_logs',
    'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
  )
  AND column_name = 'brand_id';
-- MUST return 0 rows
```

- [ ] **V.2** All `brand_id_uuid` columns still exist

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'strategy_briefs', 'content_packages', 'brand_history',
    'brand_success_patterns', 'collaboration_logs', 'performance_logs',
    'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
  )
  AND column_name = 'brand_id_uuid';
-- MUST return exactly 10 rows
```

- [ ] **V.3** `is_brand_member_text()` function is dropped

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'is_brand_member_text';
-- MUST return 0 rows
```

- [ ] **V.4** All indexes on `brand_id TEXT` are dropped

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN (
  'strategy_briefs', 'content_packages', 'brand_history',
  'brand_success_patterns', 'collaboration_logs', 'performance_logs',
  'platform_insights', 'token_health', 'weekly_summaries', 'advisor_review_audits'
)
AND indexname LIKE '%brand_id%'
AND indexname NOT LIKE '%brand_id_uuid%';
-- MUST return 0 rows
```

- [ ] **V.5** Application is running without errors for at least 1 hour post-migration

- [ ] **V.6** No RLS policy failures in production logs

- [ ] **V.7** Smoke tests pass in production

```bash
pnpm test:smoke:production
```

---

## Emergency Rollback Procedure

**IF** migration 006 causes critical issues in production:

1. **IMMEDIATELY** restore from backup (step 4.1)
2. Document the failure in incident report
3. Roll back application deployment to previous version (if necessary)
4. Investigate root cause before reattempting

**DO NOT** attempt to manually re-add columns without restoring from backup.

---

## References

- **Migration File:** `supabase/migrations/006_drop_legacy_brand_id_text_columns.sql`
- **Related Migrations:**
  - `003_fix_brand_id_persistence_schema.sql` (adds UUID columns)
  - `005_finalize_brand_id_uuid_migration.sql` (updates RLS, adds FKs)
  - `010_ensure_rls_policies_use_brand_id_uuid.sql` (RLS verification)
- **Migration Authority:** [`docs/MIGRATIONS_SOURCE_OF_TRUTH.md`](./MIGRATIONS_SOURCE_OF_TRUTH.md)
- **Schema Notes:** [`docs/POSTD_SCHEMA_NOTES.md`](./POSTD_SCHEMA_NOTES.md)

---

**Last Reviewed:** 2025-01-12  
**Next Review:** Before each deployment attempt

