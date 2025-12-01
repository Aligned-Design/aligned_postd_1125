# Storage Quota System - Future TODO & Tech Debt

**Last Updated:** 2025-01-30  
**Status:** ✅ Core quota system implemented with graceful fallbacks

---

## 📋 Current Implementation Status

### ✅ What's Working

1. **Graceful Fallback Pattern**
   - `media-db-service.ts` → `getStorageUsage()` returns unlimited quota on error
   - `media-db-service.ts` → `createMediaAsset()` skips quota for scraped images (`fileSize === 0 && path.startsWith("http")`)
   - `media-service.ts` → `checkStorageQuota()` has catch block that allows uploads on error
   - All quota lookups handle missing `storage_quotas` table/rows gracefully

2. **Scraped Images**
   - Automatically detected and skip quota checks
   - No storage used (external URLs)
   - Persisted with `size_bytes = 0`

3. **Upload Enforcement**
   - `media-service.ts` → `uploadMedia()` intentionally enforces quota for uploads
   - Throws clear error message when quota exceeded
   - This is **intentional** - uploads should be strictly enforced

---

## 🔍 Code Path Analysis

### Media Creation Paths

| Path | File | Quota Check | Fallback | Status |
|------|------|-------------|----------|--------|
| Scraped Images | `scraped-images-service.ts` → `createMediaAsset()` | ✅ Skips (scraped detection) | ✅ Graceful | ✅ Good |
| Direct Upload | `routes/media.ts` → `createMediaAsset()` | ✅ Checks | ✅ Graceful | ✅ Good |
| Media Service Upload | `media-service.ts` → `uploadMedia()` | ✅ Checks | ✅ Graceful | ✅ Good |
| Client Media | `client-portal-db-service.ts` → `client_media` table | ❌ N/A (different table) | N/A | ✅ Good |

### Quota Lookup Paths

| Path | File | Error Handling | Status |
|------|------|----------------|--------|
| `getStorageUsage()` | `media-db-service.ts` | ✅ Returns unlimited on error | ✅ Good |
| `checkStorageQuota()` | `media-service.ts` | ✅ Allows upload on error | ✅ Good |
| `getBrandStorageUsage()` | `media-service.ts` | ✅ Returns 0 on error | ✅ Good |

---

## ⚠️ Issues Found & Fixed

### 1. ✅ `media-service.ts` → `getBrandStorageUsage()` - Fixed

**Location:** `server/lib/media-service.ts:120-134`

**Issue:** If `media_assets` table doesn't exist or query fails, this could throw and break quota check.

**Status:** ✅ **FIXED** - Already returns 0 on error, added clarifying comment explaining graceful fallback.

### 2. ✅ `media-db-service.ts` → `getStorageUsage()` - Fixed

**Location:** `server/lib/media-db-service.ts:490-497`

**Issue:** If `media_assets` query fails when calculating usage, it throws an error instead of gracefully handling.

**Status:** ✅ **FIXED** - Changed to return 0 usage on error instead of throwing. Now returns:
```typescript
{
  quotaLimitBytes: quota.limit_bytes,
  totalUsedBytes: 0, // Graceful fallback
  percentageUsed: 0,
  isWarning: false,
  isHardLimit: false,
  assetCount: 0,
}
```

### 3. ✅ Code Comments Added

**Status:** ✅ **COMPLETE** - Added clarifying comments to all quota-related methods explaining:
- Which paths are intentionally strict (uploads) vs. graceful (scraped images)
- Why graceful fallback is used (quota system may not be fully configured)
- How scraped images skip quota checks

---

## 📝 Tech Debt & Future Improvements

### 1. UI/UX Improvements

- [ ] **Storage Quota Dashboard**
  - Show current usage vs limit
  - Visual progress bar
  - Warning when approaching limit
  - Location: `client/pages/dashboard/StorageUsage.tsx` (new)

- [ ] **Upload Quota Warnings**
  - Show warning toast when >80% quota used
  - Block uploads with clear message when quota exceeded
  - Location: `client/components/dashboard/LibraryUploadZone.tsx`

- [ ] **Brand Settings - Storage Tab**
  - View current usage
  - Upgrade plan option
  - Location: `client/pages/settings/BrandSettings.tsx`

### 2. Quota Management

- [ ] **Automatic Quota Row Creation**
  - Create `storage_quotas` row when brand is created
  - Default: 5GB limit, 80% warning, 100% hard limit
  - Location: Brand creation hook/migration

- [ ] **Quota Updates on Asset Deletion**
  - Update `used_bytes` when assets deleted
  - Currently calculated on-the-fly (may be slow for large brands)
  - Consider: Trigger or background job to keep `used_bytes` accurate

- [ ] **Quota Calculation Optimization**
  - Cache `used_bytes` calculation
  - Update incrementally on insert/delete
  - Background job to reconcile if drift detected

### 3. Service Architecture

- [ ] **Dedicated Quota Service**
  - Extract quota logic to `server/lib/quota-service.ts`
  - Centralize all quota checks
  - Easier to test and maintain
  - Current: Logic split between `media-db-service.ts` and `media-service.ts`

- [ ] **Quota Event System**
  - Emit events on quota threshold crossings (80%, 100%)
  - Send notifications to brand admins
  - Integration with notification system

### 4. Testing & Monitoring

- [ ] **Quota System Tests**
  - Test graceful fallback when table missing
  - Test scraped image quota skip
  - Test upload quota enforcement
  - Location: `server/__tests__/quota-system.test.ts` (new)

- [ ] **Quota Monitoring**
  - Log quota usage metrics
  - Alert on quota errors
  - Dashboard for quota health

### 5. Documentation

- [ ] **Quota System Architecture Doc**
  - Document all code paths
  - Explain fallback patterns
  - Migration guide for quota setup
  - Location: `docs/STORAGE_QUOTA_ARCHITECTURE.md` (new)

---

## 🔒 Invariants to Maintain

### 1. Scraped Images Never Count Toward Quota

**Invariant:** `fileSize === 0 && path.startsWith("http")` → Skip quota check

**Enforcement:**
- ✅ `media-db-service.ts` → `createMediaAsset()` checks this condition
- ✅ `scraped-images-service.ts` passes `fileSize: 0` and HTTP URL

**Future:** Add test to ensure this invariant is never broken.

### 2. Graceful Fallback on Quota Errors

**Invariant:** Quota lookup failures should never block media persistence (except intentional upload enforcement)

**Enforcement:**
- ✅ `getStorageUsage()` returns unlimited quota on error
- ✅ `createMediaAsset()` catches quota errors and allows persistence
- ⚠️ `uploadMedia()` intentionally throws on quota exceeded (this is correct)

**Future:** Document which paths are intentionally strict vs. graceful.

### 3. Storage Quotas Row Per Brand

**Invariant:** Each brand should have a `storage_quotas` row (but system works without it)

**Current:** System works without quota rows (uses defaults)

**Future:** 
- Auto-create quota row on brand creation
- Migration to backfill missing quota rows

### 4. Used Bytes Calculation

**Invariant:** `used_bytes` in `storage_quotas` should match sum of `size_bytes` in `media_assets` (excluding scraped images)

**Current:** Calculated on-the-fly in `getStorageUsage()`

**Future:**
- Maintain `used_bytes` incrementally
- Background job to reconcile if drift detected

---

## 🚀 If We Move Quotas to Dedicated Service

### Proposed Architecture

```
server/lib/quota-service.ts
├── checkQuota(brandId, fileSize) → { allowed, message }
├── getUsage(brandId) → { used, limit, percent }
├── updateUsage(brandId, delta) → void
└── initializeQuota(brandId) → void
```

### Benefits

1. **Centralized Logic**
   - Single source of truth for quota checks
   - Easier to test and maintain
   - Clear separation of concerns

2. **Better Error Handling**
   - Consistent fallback patterns
   - Clear error messages
   - Better logging

3. **Easier to Extend**
   - Add quota types (API quota, storage quota, etc.)
   - Add quota tiers/plans
   - Add quota analytics

### Migration Path

1. Create `quota-service.ts` with same interface as current code
2. Update `media-db-service.ts` to use quota service
3. Update `media-service.ts` to use quota service
4. Add tests for quota service
5. Deprecate old quota check methods

### Considerations

- **Backward Compatibility:** Keep old methods working during migration
- **Performance:** Ensure quota service doesn't add latency
- **Testing:** Comprehensive test coverage before migration
- **Rollback Plan:** Ability to revert if issues found

---

## 📊 Metrics to Track

- [ ] Quota lookup failures (should be rare)
- [ ] Quota enforcement blocks (upload rejections)
- [ ] Scraped images persisted (should skip quota)
- [ ] Average quota usage per brand
- [ ] Brands approaching quota limits

---

## 🎯 Priority Order

1. **High Priority**
   - Fix `getBrandStorageUsage()` error handling (if needed)
   - Add quota row auto-creation on brand creation
   - Add UI for quota display

2. **Medium Priority**
   - Extract quota logic to dedicated service
   - Add quota event system
   - Optimize quota calculation

3. **Low Priority**
   - Quota analytics dashboard
   - Advanced quota management features
   - Quota tier/plan system

---

## 📚 Related Documentation

- `docs/MVP1_STORAGE_QUOTA_FIX.md` - Original quota fix implementation
- `docs/STORAGE_QUOTA_VERIFICATION_GUIDE.md` - Verification steps
- `docs/STORAGE_QUOTA_END_TO_END_VERIFICATION.md` - E2E test guide
- `docs/CROSS_SYSTEM_AUDIT_REPORT.md` - Full system audit

---

**Next Review:** After quota UI implementation or dedicated service migration

