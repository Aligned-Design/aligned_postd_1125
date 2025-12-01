# 🧹 POSTD Phase 3: Global Cleanup Plan

**Generated:** 2025-01-20  
**Status:** 📋 **PLANNING** — Ready for Execution  
**Source:** COHERENCE_AUDIT_REPORT.md

---

## 📋 EXECUTIVE SUMMARY

This cleanup plan prioritizes all issues identified in the Coherence Audit Report. Each item includes:
- File path and line range
- Current code snippet
- Exact proposed fix
- Risk assessment
- Dependencies

**Total Actions:** 47  
**Estimated Time:** 2-3 days  
**Risk Level:** Low (all fixes are safe and non-destructive)

---

## ✅ PHASE 5 SECURITY FIXES COMPLETED (2025-01-20)

**Status:** All missing `await assertBrandAccess` calls and manual brand checks in routes have been remediated.

**Files Modified:**
- `server/routes/publishing.ts` - Added `await` to 4 `assertBrandAccess()` calls
- `server/routes/brand-intelligence.ts` - Added `await` to 1 `assertBrandAccess()` call
- `server/routes/ai-sync.ts` - Added `await` to 1 `assertBrandAccess()` call
- `server/routes/brand-members.ts` - Added `await` to 1 `assertBrandAccess()` call
- `server/routes/analytics.ts` - Added `await` to 11 `assertBrandAccess()` calls
- `server/routes/reviews.ts` - Replaced manual brand check with `await assertBrandAccess(req, brandId, true, true)`
- `server/routes/search.ts` - Replaced manual brand check with `await assertBrandAccess(req, brand, true, true)`

**Verification:**
- ✅ All 48 `assertBrandAccess()` calls in `server/routes/` are now properly awaited
- ✅ No remaining `userBrandIds.includes()` manual brand checks in route files
- ✅ All changes validated with `pnpm lint` and `pnpm typecheck` (no new errors introduced)

---

## 🔴 PRIORITY 1: CRITICAL FIXES (8 Actions)

### Action C1: Fix `publishing_jobs.created_by` Schema Mismatch

**File:** `server/lib/publishing-db-service.ts`  
**Lines:** 22, 65  
**Severity:** 🔴 CRITICAL  
**Risk:** HIGH - Database insert will fail  
**Dependencies:** None

**Current Code:**
```typescript
// Line 22
export interface PublishingJobRecord {
  created_by?: string;  // ❌ Remove this
  // ...
}

// Line 65
.insert({
  brand_id: brandId,
  tenant_id: tenantId,
  content,
  platforms,
  scheduled_at: scheduledAt?.toISOString(),
  created_by: userId,  // ❌ Remove this
  status: ...
})
```

**Proposed Fix:**
```typescript
// Remove created_by from interface
export interface PublishingJobRecord {
  // created_by removed
  // ...
}

// Store userId in content JSONB instead
.insert({
  brand_id: brandId,
  tenant_id: tenantId,
  content: {
    ...content,
    createdBy: userId,  // ✅ Store in JSONB
  },
  platforms,
  scheduled_at: scheduledAt?.toISOString(),
  status: ...
})
```

**Verification:**
- Check schema: `001_bootstrap_schema.sql:172-182` confirms no `created_by` column
- Test: Verify insert succeeds
- Check: Verify `content.createdBy` is accessible when reading jobs

---

### Action C2: Remove Duplicate `assertBrandAccess` in analytics.ts

**File:** `server/routes/analytics.ts`  
**Lines:** 796-834 (delete), 1-48 (add import)  
**Severity:** 🔴 CRITICAL  
**Risk:** MEDIUM - Security inconsistency  
**Dependencies:** None

**Current Code:**
```typescript
// Lines 796-834: Local duplicate function
function assertBrandAccess(req: any, brandId?: string) {
  // ... manual implementation
}
```

**Proposed Fix:**
```typescript
// Line 1-48: Add import
import { assertBrandAccess } from "../lib/brand-access";

// Delete lines 796-834 entirely
// All 11 existing calls will now use imported function
```

**Verification:**
- Check: All 11 calls in file still work
- Test: Verify access control still functions
- Compare: Ensure behavior matches imported function

---

### Action C3: Replace Manual Brand Checks with `assertBrandAccess`

**Files:** 
- `server/routes/reviews.ts` (lines 66, 91-92)
- `server/routes/search.ts` (line 45)
- `server/routes/approvals.ts` (lines 526, 931)

**Severity:** 🔴 CRITICAL  
**Risk:** HIGH - Security vulnerability  
**Dependencies:** Import `assertBrandAccess` in each file

**Current Code (reviews.ts:66):**
```typescript
hasAccess: userBrandIds.includes(brandId) || userRole === "SUPERADMIN",
```

**Proposed Fix:**
```typescript
// Add import at top
import { assertBrandAccess } from "../lib/brand-access";

// Replace manual check
await assertBrandAccess(req, brandId, true, true);
// Remove SUPERADMIN check (handled by assertBrandAccess)
```

**Verification:**
- Test: Verify access control works correctly
- Check: No SUPERADMIN bypass needed
- Verify: Database-backed access check works

---

### Action C4: Fix `content_type` References in Workers

**Files:**
- `server/workers/generation-pipeline.ts` (lines 40, 142-149)
- `server/lib/content-planning-service.ts` (line 469)
- `server/lib/approvals-db-service.ts` (lines 611, 630, 730)
- `server/lib/integrations-db-service.ts` (line 298)

**Severity:** 🔴 CRITICAL  
**Risk:** MEDIUM - Schema mismatch if mapping to DB  
**Dependencies:** Verify these are request fields, not DB columns

**Proposed Fix:**
- If these are request/response fields: Keep as-is (API contract)
- If these map to database: Change to `type`
- Update comments to clarify

**Verification:**
- Check: Are these API fields or DB columns?
- Test: Verify no database queries use `content_type`
- Update: Comments to clarify usage

---

### Action C5: Delete Archived Migrations

**Directory:** `server/migrations_ARCHIVED/`  
**Severity:** 🔴 CRITICAL  
**Risk:** LOW - Safe deletion  
**Dependencies:** None

**Action:**
```bash
rm -rf server/migrations_ARCHIVED/
```

**Verification:**
- Check: No references to archived migrations in code
- Verify: `001_bootstrap_schema.sql` is the authoritative schema
- Confirm: No scripts reference archived migrations

---

### Action C6: Update Branding in Documentation

**Files:** Multiple markdown files (348 references)  
**Severity:** 🔴 CRITICAL (Documentation)  
**Risk:** LOW - Documentation only  
**Dependencies:** None

**Key Files to Update:**
- `ARCHITECTURE_QUICK_REFERENCE.md`
- `API_INTEGRATION_STRATEGY.md`
- `GITHUB-ISSUES-CREATION.md`
- `SECURITY.md`
- All other markdown files

**Proposed Fix:**
```bash
# Use find and replace
find . -name "*.md" -type f -exec sed -i '' 's/Aligned-20AI/POSTD/g' {} +
find . -name "*.md" -type f -exec sed -i '' 's/Aligned-AI/POSTD/g' {} +
find . -name "*.md" -type f -exec sed -i '' 's/Aligned-20ai/POSTD/g' {} +
```

**Verification:**
- Check: All references updated
- Verify: No broken links
- Test: Documentation still readable

---

### Action C7: Classify and Clean Orphaned Pages

**Directory:** `client/pages/`  
**Severity:** 🔴 CRITICAL (Code Bloat)  
**Risk:** LOW - Safe deletion after classification  
**Dependencies:** Verify pages are truly unused

**Classification Needed:**
1. **Delete:** Unused development pages (Demo.tsx, etc.)
2. **Route:** Pages that should be accessible (ClientPortal.tsx?)
3. **Consolidate:** Duplicate versions (Dashboard variants)
4. **Move:** Marketing pages to separate project

**Proposed Actions:**
- Create classification document
- Delete confirmed unused pages
- Consolidate duplicates
- Route necessary pages

**Verification:**
- Check: No imports of deleted pages
- Test: App still builds
- Verify: No broken routes

---

### Action C8: Audit Error Handling

**Files:** All route handlers  
**Severity:** 🔴 CRITICAL  
**Risk:** MEDIUM - Unhandled errors  
**Dependencies:** None

**Action:**
- Review all route handlers
- Ensure all async routes have try/catch
- Verify error middleware is used

**Verification:**
- Check: All routes have error handling
- Test: Errors are caught and handled
- Verify: Consistent error format

---

## 🟡 PRIORITY 2: HIGH PRIORITY FIXES (12 Actions)

### Action H1: Verify and Fix `content_id` References

**Files:** `server/routes/onboarding.ts`, `server/routes/client-portal.ts`  
**Risk:** MEDIUM - Verify schema first  
**Action:** Check if `content_id` exists in `content_packages` table schema

---

### Action H2: Verify JSON.parse Usage

**Files:** Worker files  
**Risk:** LOW - Likely OK  
**Action:** Verify these parse API responses, not DB JSONB columns

---

### Action H3: Complete or Document TODOs

**Files:** Various routes  
**Risk:** LOW - Documentation  
**Action:** Review each TODO, complete or document as intentional

---

### Action H4: Add Zod Validation

**Files:** Routes with type assertions  
**Risk:** MEDIUM - Type safety  
**Action:** Replace `req.body as Type` with `schema.parse(req.body)`

---

### Action H5: Add `await` to `assertBrandAccess`

**Files:** `media.ts`, `integrations.ts`, `orchestration.ts`  
**Risk:** MEDIUM - Race conditions  
**Action:** Add `await` to all calls

---

### Actions H6-H12: Various High Priority Fixes

See COHERENCE_AUDIT_REPORT.md for details.

---

## 🟢 PRIORITY 3: MEDIUM PRIORITY FIXES (18 Actions)

See COHERENCE_AUDIT_REPORT.md for full list of medium priority issues.

---

## ⚪ PRIORITY 4: LOW PRIORITY FIXES (9 Actions)

See COHERENCE_AUDIT_REPORT.md for full list of low priority issues.

---

## 📊 EXECUTION CHECKLIST

### Phase 1: Critical Fixes
- [ ] C1: Fix publishing_jobs.created_by
- [ ] C2: Remove duplicate assertBrandAccess
- [ ] C3: Replace manual brand checks
- [ ] C4: Fix content_type references
- [ ] C5: Delete archived migrations
- [ ] C6: Update branding in docs
- [ ] C7: Classify orphaned pages
- [ ] C8: Audit error handling

### Phase 2: High Priority Fixes
- [ ] H1-H12: All high priority fixes

### Phase 3: Medium Priority Fixes
- [ ] M1-M18: Code quality improvements

### Phase 4: Low Priority Fixes
- [ ] L1-L9: Cosmetic fixes

---

## 🎯 RISK ASSESSMENT

### High Risk Actions
- **C1:** Publishing jobs insert - Test thoroughly
- **C3:** Security changes - Verify access control

### Medium Risk Actions
- **C2:** Function replacement - Test all call sites
- **C4:** Schema references - Verify mapping

### Low Risk Actions
- **C5:** Delete archived files - Safe
- **C6:** Documentation updates - Safe
- **C7:** Page cleanup - Safe after classification

---

## 📝 NOTES

- All fixes should be applied one at a time
- Test after each fix
- Commit after each successful fix
- Document any deviations from plan

---

**END OF GLOBAL CLEANUP PLAN**

