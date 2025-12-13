# Migration 020: Execution Guide

**Migration File:** `supabase/migrations/020_phase1_drop_legacy_tables.sql`  
**Purpose:** Drop 21 legacy/unused tables  
**Risk Level:** MINIMAL (all tables have 0 usage)  
**Estimated Duration:** 5-10 minutes

---

## 📋 Pre-Execution Checklist

### Required Before Running

- [ ] **Phase 0 inventory executed**
  - File: `supabase/scripts/current-schema-inventory.sql`
  - Results reviewed and understood
  - All 21 tables confirmed to exist (or some already dropped)
  
- [ ] **Row counts verified**
  - All 21 tables have 0 rows OR
  - Data verified as safe to delete
  
- [ ] **Foreign keys checked**
  - No blocking FK constraints OR
  - FK constraints understood (CASCADE will handle them)
  
- [ ] **Backup created**
  - Full database backup completed
  - Backup timestamp: ________________
  - Backup location: ________________
  - Backup verified (test restore): YES / NO
  
- [ ] **Approvals obtained**
  - DBA: ________________
  - Backend Lead: ________________
  - Date: ________________

- [ ] **Environment confirmed**
  - I am working in: [ ] Staging [ ] Production
  - Appropriate for this phase: YES / NO

---

## 🚀 Execution Steps

### Step 1: Open Supabase SQL Editor

1. Log into Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create new query

### Step 2: Load Migration

1. Open file: `/Users/krisfoust/Downloads/POSTD/supabase/migrations/020_phase1_drop_legacy_tables.sql`
2. Copy entire contents
3. Paste into SQL Editor

### Step 3: Review One More Time

**Before clicking "Run", verify:**
- [ ] This is the correct environment
- [ ] Backup was created in last 24 hours
- [ ] You understand what will happen
- [ ] You have rollback plan ready

### Step 4: Execute

1. Click **"Run"** button
2. Watch the output messages
3. Wait for completion (should be < 1 minute)

### Step 5: Verify Output

**Expected output messages:**

```
✅ Preconditions satisfied - proceeding with cleanup

GROUP 1:
  ✅ user_profiles dropped
  ✅ user_preferences dropped
  ✅ approval_threads dropped
  GROUP 1 COMPLETE: 3 of 21 tables dropped (14%)

GROUP 2:
  ✅ performance_logs dropped
  ✅ platform_insights dropped
  ✅ token_health dropped
  ✅ weekly_summaries dropped
  ✅ advisor_review_audits dropped
  ✅ brand_success_patterns dropped
  GROUP 2 COMPLETE: 9 of 21 tables dropped (43%)

GROUP 3:
  ✅ webhook_logs dropped
  ✅ webhook_events dropped
  ✅ webhook_attempts dropped
  ✅ integration_events dropped
  GROUP 3 COMPLETE: 13 of 21 tables dropped (62%)

GROUP 4:
  ✅ brand_assets dropped
  GROUP 4 COMPLETE: 14 of 21 tables dropped (67%)

GROUP 5:
  ✅ platform_sync_logs dropped
  ✅ analytics_sync_logs dropped
  ✅ advisor_feedback dropped
  ✅ media_usage_logs dropped
  ✅ payment_attempts dropped
  ✅ archived_data dropped
  ✅ payment_notifications dropped
  GROUP 5 COMPLETE: 21 of 21 tables dropped (100%)

  ✅ Orphaned views dropped

✅✅✅ SUCCESS: ALL 21 LEGACY TABLES DROPPED ✅✅✅
```

---

## ✅ Post-Execution Verification

### Immediate (Within 5 Minutes)

- [ ] Migration completed without errors
- [ ] All 21 success messages appeared
- [ ] Final success message showed
- [ ] Application still loads
- [ ] No database connection errors

**Verification query:**
```sql
-- Should return 0 rows
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles', 'user_preferences', 'approval_threads',
    'performance_logs', 'platform_insights', 'token_health',
    'weekly_summaries', 'advisor_review_audits', 'brand_success_patterns',
    'webhook_logs', 'webhook_events', 'webhook_attempts', 'integration_events',
    'brand_assets', 'platform_sync_logs', 'analytics_sync_logs',
    'advisor_feedback', 'media_usage_logs', 'payment_attempts',
    'archived_data', 'payment_notifications'
  );
```

- [ ] Query returned 0 rows: YES / NO

### Within 1 Hour

- [ ] Check application logs for errors
- [ ] Test core features:
  - [ ] Dashboard loads
  - [ ] Library loads
  - [ ] Brand Guide loads
  - [ ] Content creation works
  - [ ] Media upload works
  
- [ ] Check Supabase logs:
  - [ ] No errors referencing dropped tables
  - [ ] No RLS policy failures

### Within 24 Hours

- [ ] Run full test suite
- [ ] Verify all API endpoints
- [ ] Check user reports (if any)
- [ ] Monitor error rates

### Within 1 Week

- [ ] Daily log review
- [ ] User feedback collection
- [ ] Performance metrics review
- [ ] Stability confirmation

---

## 🚨 Error Scenarios

### If Migration Fails During Execution

**Error:** "BLOCKED: X tables have data"

**Action:**
1. STOP - Do not proceed
2. Run inventory script to identify which tables
3. Review why those tables have data
4. Decide: migrate data or accept data loss
5. Update migration or abort

**Error:** "FAILED: X still exists"

**Action:**
1. Check if CASCADE failed due to dependencies
2. Review foreign key constraints
3. May need to drop constraints first manually
4. Contact DBA for assistance

### If Application Breaks After Migration

**Symptoms:**
- Database connection errors
- "Relation does not exist" errors
- RLS policy failures
- Feature not working

**Immediate Action:**
1. STOP using the application
2. Check which table is referenced in error
3. If table was in the drop list: **This is a bug in our audit!**
4. ROLLBACK: Restore from backup immediately
5. Document the issue
6. Investigate why audit missed this usage

### Rollback Procedure

```sql
-- 1. Restore database from backup
-- Follow your backup restoration procedure

-- 2. Verify restoration
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';
-- Should match pre-migration count

-- 3. Verify dropped tables restored
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'user_preferences', ...)
ORDER BY tablename;
-- Should show all 21 tables back

-- 4. Test application
-- Verify all features work

-- 5. Document root cause
-- Update audit documentation with findings
```

---

## 📊 Success Metrics

**Migration is successful when:**

✅ All 21 tables dropped without errors  
✅ Application loads and functions normally  
✅ No errors in logs for 24 hours  
✅ All tests passing  
✅ No user-reported issues  
✅ Stable for 1 week  

**Then:** Document completion and prepare for Phase 2

---

## 🎯 What This Migration Does NOT Do

**This migration does NOT:**

❌ Drop any columns from existing tables  
❌ Modify `platform_connections` table  
❌ Drop canonical tables (media_assets, content_items, etc.)  
❌ Drop the `assets` table (saved for Phase 2 consolidation)  
❌ Touch future feature tables (strategy_briefs, content_packages, brand_history, collaboration_logs)  
❌ Modify any data in remaining tables  
❌ Change RLS policies  
❌ Alter any constraints on kept tables  

**It ONLY drops the 21 confirmed unused tables.**

---

## 📞 Support

**If you need help:**
- **Emergency rollback:** Restore from backup immediately
- **Questions about output:** Review this guide
- **Unexpected errors:** Contact DBA
- **Application issues:** Contact Backend Lead

**Contacts:**
- DBA: ________________
- Backend Lead: ________________
- On-Call: ________________

---

**Status:** Ready for Execution  
**Last Updated:** December 12, 2025

