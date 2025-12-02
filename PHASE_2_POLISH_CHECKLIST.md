# POSTD Phase 2 Polish Checklist – Frontend ↔ Backend Alignment

> **Status:** ✅ Active – This checklist is active for post-launch improvements.  
> **Last Updated:** 2025-01-20

This checklist covers **non-blocking, post-launch improvements** identified in the `SYSTEM_LEVEL_AUDIT_REPORT.md` and `CRITICAL_FIXES_VERIFICATION.md`.

**Phase 2 is about:**
- Replacing remaining mock/placeholder data
- Tightening type safety and contracts
- Cleaning up legacy routes and dead code
- Hardening admin/internal tooling

> **Status:** All critical launch-blocking issues are resolved.  
> This doc is for **cleanup + refinement**, not launch blockers.

---

## 0. Quick Reference

- ✅ **Phase 1: Critical fixes (DONE)**
  - Client settings route mismatch
  - Media URL path mismatch
  - Reviews wired to backend

- 🎯 **Phase 2: Polish (THIS DOC)**
  - Analytics mocks
  - Admin mocks
  - Types & shared contracts
  - Legacy route cleanup
  - Dead code removal

---

## 1. Analytics – Replace Mock Platform Metrics

**Goal:** Make sure all analytics shown to users come from real APIs, not hardcoded mock objects.

**Files (from audit):**
- `client/app/(postd)/analytics/page.tsx`
- `server/routes/analytics.ts`
- `shared/analytics.ts` (or `@shared/analytics`)

### Tasks

- [ ] **Remove platform metrics mock data**
  - In `analytics/page.tsx`, remove the hardcoded `platformMetrics` array (lines ~40–250 in the audit).
  - Ensure there is **no inline mock data** feeding UI components.

- [ ] **Extend analytics API for per-platform metrics**
  - Update `server/routes/analytics.ts` so `GET /api/analytics/:brandId` returns platform-level metrics (e.g., per-platform impressions, clicks, engagement).
  - Update or confirm the `AnalyticsResponse` type in `@shared/analytics` includes a proper `platforms` field, e.g.:
    ```ts
    platforms: Record<string, PlatformMetrics>;
    ```
  - Ensure the backend response matches this type exactly.

- [ ] **Wire frontend to real platform metrics**
  - Update `analytics/page.tsx` to consume platform metrics from `useAnalytics` (or a similar hook) instead of the mock array.
  - Feed real data into `PlatformMetricsCarousel` (or equivalent components).

- [ ] **Add safe fallbacks**
  - If no platform data exists, show a friendly empty state (e.g. "No platform analytics yet. Connect accounts or wait for data to accumulate.").

**Owner:** Backend + Frontend  
**Estimate:** ~3–4 hours

**Current State:**
- ✅ Analytics summary uses real API (`useAnalytics` hook)
- ❌ Platform-specific metrics carousel uses hardcoded mock data (lines 40-250 in `analytics/page.tsx`)
- ⚠️ `AnalyticsResponse` type uses `platforms: Record<string, unknown>` (should be strongly typed)
- 📍 **Specific Location:** `client/app/(postd)/analytics/page.tsx` lines 40-251 contain `platformMetrics: PlatformMetrics[]` array

---

## 2. Admin Panel – Remove Mock Fallbacks & Add Real Error States

**Goal:** Ensure admin tools show real data or clear errors, not silent mock fallbacks.

**Files (from audit):**
- `client/app/(postd)/admin/page.tsx`
- `server/routes/admin.ts`

### Tasks

- [ ] **Identify all mock fallbacks**
  - In `admin/page.tsx` find `getMockTenants`, `getMockUsers`, `getMockBilling`, etc.
  - Document where/when each mock is used.

- [ ] **Verify admin endpoints**
  - Confirm the following routes are implemented and returning real data:
    - `GET /api/admin/tenants`
    - `GET /api/admin/users`
    - `GET /api/admin/billing`
    - `GET /api/admin/feature-flags`
  - If any are missing, add minimal implementations.

- [ ] **Remove mock fallbacks**
  - Replace "fallback to mocks on error" with:
    - Proper loading state
    - Error UI (e.g. "Unable to load admin data. Check configuration or try again.")

- [ ] **Add basic observability**
  - Ensure admin-related failures log a clear, non-sensitive error on the server.
  - Avoid logging secrets or raw responses.

**Owner:** Backend + Frontend  
**Estimate:** ~2–3 hours

**Current State:**
- ⚠️ Admin panel tries real API first, but falls back to mocks silently on error (lines 108-148)
- ⚠️ Mock functions defined in same file (lines 575, 616, 647): `getMockTenants()`, `getMockUsers()`, `getMockBilling()`
- ✅ Admin endpoints ARE implemented in `server/routes/admin.ts`:
  - `GET /api/admin/tenants` (line 31)
  - `GET /api/admin/users` (line 40)
  - `GET /api/admin/billing` (line 49)
  - `GET /api/admin/feature-flags` (line 58)
- 📍 **Issue:** Frontend silently falls back to mocks if API fails - should show error UI instead

---

## 3. Types & Shared Contracts – Tighten and Centralize

**Goal:** Make sure both frontend and backend share the same types for core responses, especially dashboard and analytics.

### 3.1 DashboardResponse → Shared Type

**Files:**
- `server/routes/dashboard.ts`
- `shared/api.ts` (or `@shared/api`)
- `client/components/postd/dashboard/hooks/useDashboardData.ts`

**Tasks**

- [ ] Move `DashboardResponse` definition from `server/routes/dashboard.ts` into `@shared/api`.
- [ ] Update backend route to import `DashboardResponse` from shared types.
- [ ] Update `useDashboardData` hook to use the shared `DashboardResponse` type instead of a local interface.

**Owner:** Shared Types + Backend + Frontend  
**Estimate:** ~30–45 min

**Current State:**
- ❌ `DashboardResponse` defined locally in `server/routes/dashboard.ts` (line 48, not exported/shared)
- ❌ Frontend uses local type definition in `useDashboardData.ts` (lines 10-47, interface `DashboardData`)
- ✅ Functionality works, but types are duplicated
- 📍 **Note:** Backend uses `DashboardResponse`, frontend uses `DashboardData` - need to align names or create alias

---

### 3.2 AnalyticsResponse – Align Frontend with Shared Type

**Files:**
- `client/components/postd/analytics/hooks/useAnalytics.ts`
- `shared/analytics.ts`
- `server/routes/analytics.ts`

**Tasks**

- [ ] Confirm `AnalyticsResponse` in `@shared/analytics` accurately represents the backend response.
- [ ] Update `useAnalytics.ts` to import and use `AnalyticsResponse` from `@shared/analytics` rather than a local interface.
- [ ] Remove any `unknown` in analytics-related types (`platforms: Record<string, unknown>` → strongly typed).

**Owner:** Shared Types + Frontend  
**Estimate:** ~30–45 min

**Current State:**
- ⚠️ Frontend has local `AnalyticsResponse` interface in `useAnalytics.ts` (lines 9-27)
- ⚠️ Uses `platforms: Record<string, unknown>` (line 17) - should be strongly typed
- ✅ `@shared/analytics.ts` has `AnalyticsResponse` (line 160) but structure may differ
- 📍 **Note:** Shared type includes `summary`, `charts`, `insights`, `goals`, `alerts` - frontend type is simpler
- ❓ Need to verify backend response matches shared type and update frontend to use shared type

---

## 4. Route Cleanup – `/api/client/*` vs `/api/client-portal/*`

**Goal:** Standardize routes and avoid confusion/duplication.

**Files (from audit):**
- `server/index.ts`
- `client/pages/ClientPortal.tsx` (legacy)
- Any remaining usage of `/api/client/*`

### Tasks

- [ ] **Standardize route convention**
  - Confirm that **`/api/client-portal/*`** is the canonical route for client portal endpoints.

- [ ] **Update legacy frontend usage**
  - Update `client/pages/ClientPortal.tsx` (or other legacy files) to use `/api/client-portal/*` instead of `/api/client/*`.
  - If the legacy file is truly unused, consider deleting it after confirming.

- [ ] **Deprecate/remove `/api/client/*`**
  - Once all frontend usage is migrated, remove or clearly deprecate the `/api/client/*` aliases in `server/index.ts`.
  - Option: temporarily log a warning when `/api/client/*` is accessed, before full removal.

**Owner:** Backend + Frontend  
**Estimate:** ~1–1.5 hours

**Current State:**
- ✅ Active route (`client/app/(postd)/client-portal/page.tsx`) uses `/api/client-portal/*`
- ❌ Legacy file (`client/pages/ClientPortal.tsx`) uses `/api/client/*`:
  - Line 81: `GET /api/client/dashboard`
  - Line 111: `POST /api/client/workflow/action`
  - Line 551: `POST /api/client/content/:id/approve`
  - Line 691: `POST /api/client/media/upload`
  - Line 1154: `POST /api/client/share-links`
- ⚠️ Backend registers both routes (lines 223-226 in `server/index.ts`):
  - Line 223: `app.use("/api/client-portal", authenticateUser, clientPortalRouter);`
  - Line 224: `app.use("/api/client", authenticateUser, clientPortalRouter);` (duplicate)
  - Lines 225-226: Share links registered on both routes

---

## 5. Mock/Data Cleanup & Dead Code Removal

**Goal:** Ensure no production feature accidentally relies on demo/mock data or unused code paths.

### Tasks

- [ ] **Remove unused `useDashboardMockData` hook:**
  - File: `client/components/postd/dashboard/hooks/useDashboardMockData.ts`
  - ⚠️ **Dependency:** `DashboardChartData` type (line 16) is imported by `AnalyticsChart.tsx` (line 8)
  - **Action Plan:**
    1. Move `DashboardChartData` interface to shared types or `AnalyticsChart.tsx` itself
    2. Update `AnalyticsChart.tsx` to import from new location
    3. Verify `useDashboardMockData` hook function is not called anywhere
    4. Delete `useDashboardMockData.ts` file

- [ ] **Review `ROIDashboard` mock data:**
  - File: `client/components/retention/ROIDashboard.tsx`
  - Ensure `mockROIData` is clearly labeled as demo-only and never used in production flows.
  - Optionally:
    - Make `data` a required prop
    - Remove or move `mockROIData` to a dedicated story/demo file (e.g., Storybook).

- [ ] **Search codebase for `MOCK_` patterns:**
  - Find any `MOCK_*` exports and confirm:
    - Either they are used only in dev/tests/stories
    - Or they are removed from production code.

**Owner:** Frontend  
**Estimate:** ~1–2 hours

**Current State:**
- ❌ `useDashboardMockData.ts` exists but appears unused (dashboard uses `useDashboardData` instead)
- ⚠️ `ROIDashboard.tsx` exports `mockROIData` (lines 333-388) - verify it's demo-only
- ⚠️ `MOCK_BRAND_GUIDE` and `MOCK_AUTO_REPLY_SETTINGS` in reviews page (UI settings, not data - acceptable)

---

## 6. Optional Hardening – Observability & Feature Flags

**Goal:** Make debugging easier and avoid surprises around partially-built features.

### 6.1 Logging & Error Patterns

- [ ] Ensure API errors:
  - Use a consistent structured shape (e.g. `{ error: { message, code } }`)
  - Don't leak stack traces or secrets to the client
  - Are logged server-side with enough context: route, user/tenant ID (if applicable), platform

### 6.2 Feature Flags for Non-Essential Screens

- [ ] Add simple feature flags (even via config/env) for:
  - Reviews
  - Advanced analytics breakdowns
  - Admin experimental features

- [ ] When a feature is disabled:
  - Hide the navigation item OR
  - Show a "Coming Soon" / "Not enabled for this account" screen instead of broken/empty UI.

**Owner:** Backend + Frontend  
**Estimate:** ~2–4 hours (optional / as needed)

---

## 7. Progress Tracking

Use this table to track Phase 2 completion:

| Area                          | Status | Owner        | Notes                          |
|-------------------------------|--------|--------------|--------------------------------|
| Analytics platform metrics    | [ ]    |              | Replace mocks with real data   |
| Admin mocks & error UI        | [ ]    |              | Remove fallbacks               |
| Dashboard shared type         | [ ]    |              | Move `DashboardResponse`       |
| Analytics shared type usage   | [ ]    |              | Use `AnalyticsResponse` shared |
| `/api/client` route cleanup   | [ ]    |              | Standardize on `client-portal` |
| Mock/dead code cleanup        | [ ]    |              | Remove unused/mock hooks       |
| Logging & feature flags (opt) | [ ]    |              | Optional hardening             |

---

## Summary

- **Phase 1** = **launch readiness** (✅ DONE)  
- **Phase 2** = **polish, trust, and maintainability**

You can ship now with confidence and schedule Phase 2 as a focused cleanup sprint.

---

## Quick Start Guide

**Priority Order (Recommended):**

1. **Types & Shared Contracts** (Sections 3.1, 3.2) - Quick wins, improves maintainability
2. **Route Cleanup** (Section 4) - Reduces confusion, prevents future bugs
3. **Mock/Dead Code Cleanup** (Section 5) - Clean house, reduce technical debt
4. **Analytics Platform Metrics** (Section 1) - User-facing improvement
5. **Admin Panel** (Section 2) - Internal tooling improvement
6. **Optional Hardening** (Section 6) - Nice-to-have enhancements

**Estimated Total Time:** ~10-15 hours for all items, or ~4-6 hours for priority items (1-3).

