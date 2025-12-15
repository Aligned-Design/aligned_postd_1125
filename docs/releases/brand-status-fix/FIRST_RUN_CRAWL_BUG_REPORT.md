# First-Run Crawler Bug Report

**Date**: 2025-12-15  
**Status**: 🔴 CRITICAL - Blocks onboarding/first-run workflow

---

## Executive Summary

Three critical endpoint failures prevent brand owners from completing first-run onboarding and crawler setup. All issues block the initial data collection workflow.

---

## Issue #1: Analytics Log Endpoint Missing (404)

**Client Call**:
- File: `client/lib/logger.ts:22`
- Path: `POST /api/analytics/log`
- Purpose: Frontend telemetry/error logging in production

**Server State**:
- ❌ **Route does not exist** in `server/routes/analytics.ts`
- ✅ Router is mounted at `/api/analytics` in `server/index-v2.ts:322`
- ❌ No `/log` handler defined in analytics router

**Root Cause**: Client calls non-existent endpoint. The analytics router has endpoints like `/:brandId`, `/:brandId/insights`, etc., but no `/log` endpoint.

**Impact**: Frontend logging fails silently in production (by design), but creates 404 noise and prevents proper telemetry.

**Fix Required**: Add `POST /log` handler to analytics router or remove the client calls if logging is not needed.

---

## Issue #2: Auth Signup Endpoint (404)

**Client Call**:
- File: `client/contexts/AuthContext.tsx:236`
- Path: `POST /api/auth/signup`
- Purpose: User registration during onboarding

**Server State**:
- ✅ Route **exists** in `server/routes/auth.ts:53` as `router.post("/signup", ...)`
- ✅ Auth router **is mounted** at `/api/auth` in `server/index-v2.ts:312`
- ❓ Should be accessible at `/api/auth/signup`

**Root Cause**: TBD - Need to verify:
1. Auth router export/import chain
2. Router instantiation (is it a Router instance?)
3. Live server verification with curl

**Impact**: Users cannot sign up, blocking entire onboarding flow.

**Fix Required**: Verify auth router is correctly exported and mounted. Test with curl.

---

## Issue #3: Onboarding Run-All (403 Forbidden - Missing `ai:generate` permission)

**Client Call**:
- File: `client/pages/onboarding/Screen3AiScrape.tsx:397`
- Path: `POST /api/orchestration/onboarding/run-all`
- Purpose: Trigger first-run crawler + AI analysis workflow

**Server State**:
- ✅ Route exists at `server/routes/orchestration.ts:370-374`
- ✅ Orchestration router mounted at `/api/orchestration` in `server/index-v2.ts:336`
- ❌ **Route requires `ai:generate` scope** (line 372: `requireScope("ai:generate")`)
- ❌ **NO ROLE IN `config/permissions.json` HAS `ai:generate`**
  - SUPERADMIN has `"*"` (wildcard, works)
  - OWNER has 27 permissions, but NOT `ai:generate`
  - ADMIN has 27 permissions, but NOT `ai:generate`
  - Other roles: same issue

**Root Cause**: Permission `ai:generate` is required but never granted to any user role (except SUPERADMIN via wildcard).

**Impact**: Brand owners (role: OWNER) get 403 when trying to run onboarding crawler. First-run workflow completely blocked.

**Fix Required**: Add `"ai:generate"` to appropriate roles in `config/permissions.json`:
- **Minimum**: Add to `OWNER` role (brand owners should run onboarding)
- **Recommended**: Add to `OWNER`, `ADMIN`, `AGENCY_ADMIN`, `BRAND_MANAGER`
- **Alternative**: Remove `requireScope("ai:generate")` from onboarding endpoints (less secure, not recommended)

---

## Verification Checklist

Before marking as fixed, verify:

- [ ] `curl -X POST http://localhost:3000/api/analytics/log` returns non-404
- [ ] `curl -X POST http://localhost:3000/api/auth/signup` returns non-404 (even 400/401 is progress)
- [ ] Onboarding flow with OWNER role successfully calls `/api/orchestration/onboarding/run-all` and receives 200
- [ ] Crawler persists assets to `media_assets` table for new brand
- [ ] No 404s in browser console during onboarding

---

## Next Steps

1. **Part A**: Fix 404s (analytics/log and auth/signup route mismatch)
2. **Part B**: Fix 403 (add `ai:generate` to OWNER role)
3. **Part C**: Verify crawler persistence for first-run brands
4. **Part D**: Run full test suite and manual UI verification

