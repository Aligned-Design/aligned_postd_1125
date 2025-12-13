# Schema Cleanup: Execution Ready Checklist

**Status:** Pre-Execution Verification  
**Date:** December 12, 2025  
**Purpose:** Final checklist before executing any schema changes

---

## 🎯 Overview

This document is your **final pre-flight checklist** before executing schema cleanup migrations. Go through each section carefully and check off items as you complete them.

**Rule:** ❌ **DO NOT PROCEED** to the next section until the current section is 100% complete.

---

## ✅ Phase 0: Pre-Execution Verification (REQUIRED)

### Environment Identification

- [ ] I have identified my environment:
  - [ ] Local/Development
  - [ ] Staging/Testing
  - [ ] Production

- [ ] I understand which environment I'm working in: **________________**

### Documentation Review

- [ ] Read: `docs/SCHEMA_CLEANUP_IMPLEMENTATION_SUMMARY.md`
- [ ] Read: `docs/SCHEMA_CLEANUP_DECISION_MATRIX.md`
- [ ] Read: `docs/BUGFIX_pg_stat_user_tables.md`
- [ ] Understand what tables will be dropped
- [ ] Understand the risks and safety measures

### Database Backup

- [ ] **CRITICAL:** Full database backup created
- [ ] Backup timestamp: **________________**
- [ ] Backup location: **________________**
- [ ] Backup size: **________________**
- [ ] Backup verified (test restore attempted): **YES / NO**

**⚠️ WARNING:** Do NOT proceed without a verified backup!

### Inventory Script Execution

- [ ] Opened Supabase SQL Editor
- [ ] Copied `supabase/scripts/current-schema-inventory.sql`
- [ ] Executed script successfully
- [ ] Saved output to file: **________________**
- [ ] Reviewed output for unexpected issues

### Inventory Analysis Results

Based on the inventory output:

- [ ] Total tables in database: **________**
- [ ] Phase 1 tables that exist: **________ of 21**
- [ ] Phase 1 tables with data: **________**
- [ ] Asset tables status:
  - [ ] `assets` exists: **YES / NO**
  - [ ] `brand_assets` exists: **YES / NO**
  - [ ] `media_assets` exists: **YES / NO**
- [ ] Content table bug status:
  - [ ] `content` exists: **YES / NO** (should be NO)
  - [ ] `content_items` exists: **YES / NO** (should be YES)

### Safety Verification Script

- [ ] Ran `supabase/scripts/verify-schema-cleanup-safety.sql`
- [ ] All safety checks passed: **YES / NO**
- [ ] Foreign key constraints identified: **________**
- [ ] All Phase 1 tables have 0 rows: **YES / NO**

### Sign-Off Requirements

- [ ] Database Administrator approval: **________________** (signature/date)
- [ ] Backend Lead approval: **________________** (signature/date)
- [ ] Maintenance window scheduled: **________________** (date/time)
- [ ] On-call engineer available: **________________** (name)
- [ ] Rollback plan understood and documented

**Status:** [ ] READY FOR PHASE 1A / [ ] NOT READY - Review issues above

---

## ✅ Phase 1A: Drop 3 Safest Tables

### Pre-Migration

- [ ] Phase 0 completed and signed off
- [ ] Working in **STAGING** environment first
- [ ] Backup created less than 24 hours ago
- [ ] `user_profiles` table exists: **YES / NO**
- [ ] `user_preferences` table exists: **YES / NO**
- [ ] `approval_threads` table exists: **YES / NO**
- [ ] All 3 tables have 0 rows: **YES / NO**

### Migration Execution

**Environment:** **________________**

- [ ] Opened migration: `supabase/migrations/007_drop_unused_tables_phase_1a.sql`
- [ ] Reviewed migration contents
- [ ] Copied migration to SQL Editor
- [ ] **PAUSED** - Ready to execute
- [ ] Took a deep breath
- [ ] **EXECUTED** migration
- [ ] Execution time: **________________**
- [ ] Execution completed without errors: **YES / NO**

### Migration Output Verification

- [ ] Migration output shows: "✅ user_profiles dropped successfully"
- [ ] Migration output shows: "✅ user_preferences dropped successfully"
- [ ] Migration output shows: "✅ approval_threads dropped successfully"
- [ ] Migration output shows: "✅✅✅ SUCCESS: All Phase 1A tables dropped"

### Post-Migration Verification

Immediately after migration (within 5 minutes):

- [ ] Application loads without errors
- [ ] No database errors in logs
- [ ] Dashboard accessible
- [ ] No user-reported issues

**Verification queries:**
```sql
-- Verify tables dropped
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'user_preferences', 'approval_threads');
-- Expected: 0 rows
```

- [ ] Verification query confirms 0 tables remain: **YES / NO**

### Monitoring Period (48 Hours)

**Start:** **________________**  
**End:** **________________**

- [ ] Hour 1: Application stable
- [ ] Hour 4: No errors in logs
- [ ] Hour 12: No user issues reported
- [ ] Hour 24: All systems normal
- [ ] Hour 48: All tests passing

**Issues detected during monitoring:** **YES / NO**

If YES, list issues: **________________**

### Sign-Off

- [ ] Phase 1A completed successfully in STAGING
- [ ] No errors for 48+ hours
- [ ] Approved to execute in PRODUCTION: **________________** (signature/date)

**Status:** [ ] READY FOR PHASE 1B / [ ] ROLLBACK REQUIRED

---

## ✅ Phase 1B: Drop 6 Persistence Tables

### Pre-Migration

- [ ] Phase 1A completed successfully
- [ ] Phase 1A stable for 48+ hours
- [ ] Working in **STAGING** environment first
- [ ] Fresh backup created: **________________**
- [ ] All 6 persistence tables exist: **YES / NO**
- [ ] All 6 tables have 0 rows: **YES / NO**

### Migration Execution

**Environment:** **________________**

- [ ] Opened migration: `supabase/migrations/008_drop_unused_tables_phase_1b.sql`
- [ ] Migration verifies Phase 1A complete
- [ ] Copied migration to SQL Editor
- [ ] **EXECUTED** migration
- [ ] Execution time: **________________**
- [ ] Execution completed without errors: **YES / NO**

### Migration Output Verification

- [ ] All 6 tables dropped successfully
- [ ] Migration output shows: "✅✅✅ SUCCESS: All Phase 1B tables dropped"
- [ ] Progress shows: "9 of 21 tables dropped (43%)"

### Post-Migration Verification

- [ ] Application loads without errors
- [ ] No database errors in logs
- [ ] All features working normally

**Verification queries:**
```sql
-- Verify Phase 1A + 1B tables dropped
SELECT COUNT(*) FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'user_profiles', 'user_preferences', 'approval_threads',
    'performance_logs', 'platform_insights', 'token_health',
    'weekly_summaries', 'advisor_review_audits', 'brand_success_patterns'
  );
-- Expected: 0
```

- [ ] Verification confirms 0 tables remain: **YES / NO**

### Monitoring Period (48 Hours)

- [ ] Hour 1: Stable
- [ ] Hour 12: Stable
- [ ] Hour 24: Stable
- [ ] Hour 48: Stable

**Status:** [ ] READY FOR PHASE 1C / [ ] ROLLBACK REQUIRED

---

## ✅ Phase 1C: Drop 12 Remaining Tables

### Pre-Migration

- [ ] Phase 1A and 1B completed successfully
- [ ] Both phases stable for 48+ hours each
- [ ] Working in **STAGING** environment first
- [ ] Fresh backup created: **________________**
- [ ] All 12 remaining tables exist (or some already dropped): **________**

### Migration Execution

**Environment:** **________________**

- [ ] Opened migration: `supabase/migrations/009_drop_unused_tables_phase_1c.sql`
- [ ] Migration verifies Phase 1A and 1B complete
- [ ] Copied migration to SQL Editor
- [ ] **EXECUTED** migration
- [ ] Execution time: **________________**
- [ ] Execution completed without errors: **YES / NO**

### Migration Output Verification

- [ ] All remaining tables dropped successfully
- [ ] Migration output shows: "✅✅✅ SUCCESS: ALL PHASE 1 CLEANUP COMPLETE"
- [ ] Progress shows: "21 of 21 tables dropped (100%)"

### Post-Migration Verification

**Comprehensive testing required:**

- [ ] Application loads
- [ ] Dashboard works
- [ ] Library works
- [ ] Media upload works
- [ ] Brand Guide works
- [ ] Content creation works
- [ ] Scheduler works
- [ ] All API endpoints responding

**Verification queries:**
```sql
-- Verify ALL Phase 1 tables dropped
SELECT COUNT(*) FROM pg_tables 
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
-- Expected: 0
```

- [ ] Verification confirms 0 tables remain: **YES / NO**

### Monitoring Period (1 Week)

**Extended monitoring for final phase:**

- [ ] Day 1: Stable
- [ ] Day 2: Stable
- [ ] Day 3: Stable
- [ ] Day 4: Stable
- [ ] Day 5: Stable
- [ ] Day 6: Stable
- [ ] Day 7: Stable

**Issues during week:** **YES / NO**

### Phase 1 Complete Sign-Off

- [ ] All 21 tables dropped successfully
- [ ] Application stable for 1+ week
- [ ] No user-reported issues
- [ ] All tests passing
- [ ] Performance metrics normal or improved
- [ ] Schema reduction achieved: **________%**

**Phase 1 Complete:** **________________** (signature/date)

**Status:** [ ] READY FOR PHASE 2 / [ ] ISSUES REQUIRE ATTENTION

---

## ✅ Phase 2: Assets Consolidation (After 1 Week Stability)

### Pre-Phase 2 Requirements

- [ ] Phase 1 complete and stable for 1+ week
- [ ] No outstanding issues from Phase 1
- [ ] Read: `docs/PHASE_2_IMPLEMENTATION_SUMMARY.md`
- [ ] Read: `docs/PHASE_2_CODE_CHANGES.md` (zero changes needed!)
- [ ] Read: `docs/PHASE_2_TESTING_CHECKLIST.md`

### Phase 2 Readiness Verification

- [ ] Ran `supabase/scripts/verify-phase-2-ready.sql`
- [ ] All checks passed: **YES / NO**
- [ ] `assets` table exists: **YES / NO**
- [ ] `media_assets` table exists: **YES / NO**
- [ ] `brand_assets` dropped in Phase 1C: **YES / NO**

### Migration Execution

**Environment:** **STAGING FIRST**

- [ ] Fresh backup created: **________________**
- [ ] Opened migration: `supabase/migrations/010_consolidate_asset_tables.sql`
- [ ] Reviewed migration contents
- [ ] **EXECUTED** migration in staging
- [ ] Execution completed without errors: **YES / NO**

### Post-Migration Testing

**Complete ALL tests in `PHASE_2_TESTING_CHECKLIST.md`:**

- [ ] Library - Media list works
- [ ] Library - Media upload works
- [ ] Library - Media operations work
- [ ] Brand crawler works
- [ ] Storage calculations correct
- [ ] API endpoints work
- [ ] Database verification passed
- [ ] Integration tests pass

### Production Deployment

**Only after staging success:**

- [ ] Staging stable for 48+ hours
- [ ] All tests passed
- [ ] Approved for production: **________________** (signature/date)
- [ ] Fresh production backup: **________________**
- [ ] **EXECUTED** in production
- [ ] Post-production tests passed

### Monitoring Period (1 Week)

- [ ] Day 1: Stable
- [ ] Day 3: Stable
- [ ] Day 7: Stable

**Status:** [ ] PHASE 2 COMPLETE / [ ] ISSUES DETECTED

---

## ✅ Final Verification & Cleanup

### Schema State Verification

Run final inventory to confirm new state:

```sql
SELECT COUNT(*) AS total_tables 
FROM pg_tables 
WHERE schemaname = 'public';
```

- [ ] Starting table count: **________**
- [ ] Ending table count: **________**
- [ ] Tables removed: **________**
- [ ] Reduction percentage: **________%**

### Asset Tables Verification

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%asset%';
```

- [ ] Only `media_assets` exists: **YES / NO**

### Documentation Updates

- [ ] Updated `SCHEMA_CLEANUP_DECISION_MATRIX.md` with completion dates
- [ ] Archived old schema documentation
- [ ] Updated team wiki/knowledge base
- [ ] Notified team of schema changes

---

## 🎉 Success Criteria

**All phases complete when:**

✅ All 21 Phase 1 tables dropped  
✅ Assets consolidated to single canonical table  
✅ Application stable for 1+ week after each phase  
✅ Zero user-reported issues  
✅ Zero errors in production logs  
✅ All tests passing  
✅ Performance metrics normal or improved  
✅ Team notified and documentation updated  

---

## 🚨 Emergency Procedures

### If Something Goes Wrong

**Immediate Actions:**

1. **STOP** - Do not proceed with any more changes
2. **ASSESS** - What specifically broke?
3. **LOG** - Document the error/issue
4. **NOTIFY** - Alert team/on-call engineer
5. **ROLLBACK** - Restore from backup if necessary

### Rollback Procedure

**For each phase:**

```sql
-- 1. Stop all application traffic (if needed)
-- 2. Restore database from backup
-- 3. Verify restoration
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';
-- 4. Test application
-- 5. Resume traffic
-- 6. Investigate root cause
```

### Escalation

- **Level 1:** On-call engineer
- **Level 2:** Database Administrator
- **Level 3:** CTO/Technical Lead

**Emergency contacts:**
- DBA: **________________**
- Backend Lead: **________________**
- On-Call: **________________**

---

## 📊 Tracking Sheet

| Phase | Started | Completed | Environment | Issues | Status |
|-------|---------|-----------|-------------|--------|--------|
| 0 - Verification | | | | | |
| 1A - 3 tables (Staging) | | | Staging | | |
| 1A - 3 tables (Production) | | | Production | | |
| 1B - 6 tables (Staging) | | | Staging | | |
| 1B - 6 tables (Production) | | | Production | | |
| 1C - 12 tables (Staging) | | | Staging | | |
| 1C - 12 tables (Production) | | | Production | | |
| 2 - Consolidation (Staging) | | | Staging | | |
| 2 - Consolidation (Production) | | | Production | | |

---

## 📝 Notes Section

Use this space to record observations, issues, or important details:

```
Date: ________________
Notes:








```

---

**Document Version:** 1.0  
**Last Updated:** December 12, 2025  
**Owner:** Database Team  
**Status:** Ready for Execution

