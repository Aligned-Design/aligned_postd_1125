# Phase 2: Assets Consolidation - Testing Checklist

**Migration:** `010_consolidate_asset_tables.sql`  
**Status:** Pre-Migration & Post-Migration Testing  
**Estimated Time:** 2-3 hours per environment

---

## 🎯 Testing Strategy

**Approach:** Test in **3 environments** sequentially:
1. **Local/Dev** - Initial validation
2. **Staging** - Full regression (mandatory)
3. **Production** - Post-deployment verification

**Rule:** ❌ **DO NOT PROCEED** to next environment if any test fails

---

## 📋 Pre-Migration Tests (Before Running 010)

### Environment Setup
- [ ] **Backup Created**
  - Full database backup completed
  - Backup file location documented
  - Backup verified (can restore if needed)
  
- [ ] **Phase 1 Confirmed**
  - All 21 Phase 1 tables dropped
  - Application stable for 1+ week
  - No errors in logs

- [ ] **Schema Verification**
  - `assets` table exists
  - `media_assets` table exists
  - `brand_assets` does NOT exist (dropped in Phase 1C)

### Baseline Functionality (Before Migration)
Test that these work BEFORE migration to establish baseline:

#### Library - Media List
- [ ] Navigate to Library page
- [ ] Media assets load correctly
- [ ] Filter by image type works
- [ ] Filter by video type works
- [ ] Filter by document type works
- [ ] Search assets by filename works
- [ ] Pagination works
- [ ] Sort by date works

#### Library - Media Upload
- [ ] Upload single image (< 5MB)
- [ ] Upload multiple images (batch upload)
- [ ] Upload video file
- [ ] Upload PDF document
- [ ] Verify files appear in Library
- [ ] Verify thumbnails generated correctly

#### Library - Media Operations
- [ ] View asset details
- [ ] Edit asset metadata (name, tags)
- [ ] Delete asset
- [ ] Restore deleted asset (if feature exists)
- [ ] Download asset

#### Brand Crawler
- [ ] Run brand crawler on test URL
- [ ] Verify logo extracted
- [ ] Verify hero image extracted
- [ ] Verify colors extracted
- [ ] Images saved to Library

#### Storage
- [ ] Check storage usage displays correctly
- [ ] Verify storage limits enforced (if applicable)

**Baseline Status:** [ ] ALL PASS (required before proceeding)

---

## 🔧 Migration Execution

### In Staging Environment ONLY
- [ ] Connect to staging database
- [ ] Run migration `010_consolidate_asset_tables.sql`
- [ ] Verify migration completes without errors
- [ ] Review migration output logs
- [ ] Confirm `assets` table dropped
- [ ] Confirm `media_assets` table still exists

**Migration Output Expected:**
```
✅ Phase 1 confirmed complete
✅ assets table exists
✅ media_assets table exists (canonical)
✅ assets table is empty (or data migrated)
✅ All assets columns exist in media_assets
✅ Data verified
✅ assets table dropped successfully
✅ Assets consolidation complete!
```

**Migration Status:** [ ] PASS (required before proceeding to post-tests)

---

## ✅ Post-Migration Tests (After Running 010)

### Immediate Verification (Within 5 minutes)
- [ ] Application loads without errors
- [ ] No database connection errors in logs
- [ ] Library page loads
- [ ] Media assets still visible

### Library - Media List (Re-test)
- [ ] Navigate to Library page
- [ ] **CRITICAL:** All media assets from BEFORE migration still visible
- [ ] Asset counts match pre-migration counts
- [ ] Filter by image type works
- [ ] Filter by video type works
- [ ] Filter by document type works
- [ ] Search assets works
- [ ] Pagination works
- [ ] Sort by date works

#### Library - Media Upload (Re-test)
- [ ] Upload single image (< 5MB)
- [ ] Upload multiple images (batch upload)
- [ ] Upload video file
- [ ] Upload PDF document
- [ ] **NEW:** Verify assets saved to `media_assets` table (query DB)
- [ ] Verify thumbnails generated correctly
- [ ] Verify files appear in Library immediately

#### Library - Media Operations (Re-test)
- [ ] View asset details (old assets uploaded BEFORE migration)
- [ ] View asset details (new assets uploaded AFTER migration)
- [ ] Edit asset metadata
- [ ] Delete asset (old)
- [ ] Delete asset (new)
- [ ] Download asset (old)
- [ ] Download asset (new)

#### Brand Crawler (Re-test)
- [ ] Run brand crawler on test URL
- [ ] Verify logo extracted
- [ ] Verify hero image extracted
- [ ] Verify colors extracted
- [ ] **NEW:** Verify images saved to `media_assets` (not `assets`)
- [ ] Verify crawler logs show no errors

#### Storage (Re-test)
- [ ] Storage usage displays correctly
- [ ] Storage usage matches pre-migration (no loss)
- [ ] Upload respects storage limits

### API Endpoint Tests
Run these API calls and verify responses:

#### GET /api/media
```bash
curl -X GET "https://your-staging-url/api/media?brandId=<test-brand-id>&limit=20" \
  -H "Authorization: Bearer <token>"
```
- [ ] Returns 200 OK
- [ ] Returns list of media assets
- [ ] Total count matches expected
- [ ] No references to `assets` table in logs

#### POST /api/media/upload
```bash
curl -X POST "https://your-staging-url/api/media/upload" \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-image.jpg" \
  -F "brandId=<test-brand-id>"
```
- [ ] Returns 200 OK or 201 Created
- [ ] Returns asset ID
- [ ] Asset appears in Library
- [ ] Asset stored in `media_assets` table

#### GET /api/media/:id
```bash
curl -X GET "https://your-staging-url/api/media/<asset-id>" \
  -H "Authorization: Bearer <token>"
```
- [ ] Returns 200 OK
- [ ] Returns asset details
- [ ] All fields populated correctly

#### DELETE /api/media/:id
```bash
curl -X DELETE "https://your-staging-url/api/media/<asset-id>" \
  -H "Authorization: Bearer <token>"
```
- [ ] Returns 200 OK or 204 No Content
- [ ] Asset removed from Library
- [ ] Asset marked as deleted in `media_assets`

#### GET /api/media/usage
```bash
curl -X GET "https://your-staging-url/api/media/usage?brandId=<test-brand-id>" \
  -H "Authorization: Bearer <token>"
```
- [ ] Returns 200 OK
- [ ] Returns storage usage stats
- [ ] Stats match expected values

### Database Verification
Run these SQL queries in staging database:

#### Verify assets table dropped
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'assets';
-- Expected: 0 rows (table should not exist)
```
- [ ] `assets` table does NOT exist ✅

#### Verify media_assets is only asset table
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE '%asset%';
-- Expected: Only 'media_assets'
```
- [ ] Only `media_assets` exists ✅

#### Count media_assets rows
```sql
SELECT COUNT(*) FROM media_assets;
-- Expected: Match pre-migration count (or higher if migrations happened)
```
- [ ] Row count matches or is higher ✅

#### Verify no data loss
```sql
SELECT brand_id, COUNT(*) as asset_count
FROM media_assets
GROUP BY brand_id
ORDER BY asset_count DESC
LIMIT 10;
-- Compare with pre-migration counts
```
- [ ] All brands have expected asset counts ✅
- [ ] No brand has 0 assets (if they had assets before)

### Integration Tests
Run automated test suites:

#### Unit Tests
```bash
cd /Users/krisfoust/Downloads/POSTD
pnpm test server/__tests__/media-db-service.test.ts
pnpm test server/__tests__/database-services.test.ts
```
- [ ] All media DB service tests pass
- [ ] All database service tests pass
- [ ] No new failures introduced

#### Integration Tests
```bash
pnpm test server/__tests__/phase-2-routes-integration.test.ts
```
- [ ] All Phase 2 route tests pass
- [ ] Media endpoints work correctly

### Log Analysis
Check logs for errors:

#### Application Logs (Last 1 hour)
```bash
# Check for errors mentioning 'assets' table
grep -i "relation.*assets.*does not exist" logs/app.log
grep -i "table.*assets.*not found" logs/app.log
```
- [ ] Zero errors referencing `assets` table ✅
- [ ] No database errors in general

#### Database Logs (Last 1 hour)
```sql
SELECT 
  query, 
  calls, 
  mean_exec_time
FROM pg_stat_statements
WHERE query ILIKE '%assets%'
ORDER BY calls DESC
LIMIT 20;
```
- [ ] No queries referencing `assets` table (should only be `media_assets`)
- [ ] All queries complete successfully

---

## 🚨 Failure Scenarios & Rollback

### If ANY Test Fails:

1. **STOP IMMEDIATELY** - Do not proceed to production
2. **Document the failure:**
   - Which test failed?
   - What was the error message?
   - When did it occur (timestamp)?
   
3. **Rollback:**
   ```sql
   -- Restore from backup
   -- Follow backup restoration procedure
   ```

4. **Investigate:**
   - Review migration logs
   - Check for unexpected data in `assets` table before migration
   - Check for code still referencing `assets` table
   
5. **Fix & Retry:**
   - Update migration if needed
   - Fix any code issues
   - Re-test in staging from scratch

---

## ✅ Sign-Off Checklist

### Staging Sign-Off (Required)
- [ ] All pre-migration tests passed
- [ ] Migration executed successfully
- [ ] All post-migration tests passed
- [ ] API endpoints verified
- [ ] Database verification passed
- [ ] Integration tests passed
- [ ] Logs clean (no errors)
- [ ] **Staging stable for 48 hours minimum**

**Signed Off By:** ________________  
**Date:** ________________

### Production Deployment Approval
- [ ] Staging sign-off complete
- [ ] All stakeholders notified
- [ ] Backup plan confirmed
- [ ] Rollback procedure documented
- [ ] Maintenance window scheduled
- [ ] On-call engineer available

**Approved By:** ________________  
**Date:** ________________

---

## 📊 Test Results Summary

### Staging Environment

| Test Category | Tests Run | Passed | Failed | Notes |
|---------------|-----------|--------|--------|-------|
| Pre-Migration | | | | |
| Migration Execution | | | | |
| Immediate Verification | | | | |
| Library Tests | | | | |
| API Endpoint Tests | | | | |
| Database Verification | | | | |
| Integration Tests | | | | |
| Log Analysis | | | | |

**Overall Status:** [ ] PASS / [ ] FAIL

**If FAIL:** Do NOT proceed to production. See rollback section.

---

### Production Environment (After Deployment)

| Test Category | Tests Run | Passed | Failed | Notes |
|---------------|-----------|--------|--------|-------|
| Immediate Verification | | | | |
| Library Smoke Tests | | | | |
| API Endpoint Tests | | | | |
| Database Verification | | | | |
| Log Analysis | | | | |

**Overall Status:** [ ] PASS / [ ] FAIL

**If FAIL:** Initiate immediate rollback.

---

## 📞 Support Contacts

**If issues arise during testing:**

- **Database Administrator:** _________________
- **Backend Lead:** _________________
- **DevOps/SRE:** _________________
- **On-Call Engineer:** _________________

---

## 🎯 Success Criteria

**Phase 2 is considered successful when:**

✅ All staging tests pass  
✅ Staging stable for 48+ hours  
✅ Production migration completes without errors  
✅ All production post-tests pass  
✅ Production stable for 1 week  
✅ Zero user-reported issues related to media/assets  
✅ Zero errors in logs referencing `assets` table  

**Then:** Proceed to Phase 3 evaluation (in 3-6 months)

---

**Last Updated:** December 12, 2025  
**Version:** 1.0

