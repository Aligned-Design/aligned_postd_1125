# System-Level Audit Report: Frontend-Backend Alignment

**Date:** 2024-11-XX  
**Auditor:** System-Level Auditor  
**Scope:** End-to-end alignment between frontend views and backend endpoints

---

## Executive Summary

This audit maps frontend views to backend endpoints, identifies inconsistencies, detects mock/placeholder logic, checks type contracts, and categorizes launch-blocking vs non-blocking issues.

**Key Findings:**
- ✅ **Well-Wired:** Creative Studio, Client Portal dashboard, most media operations
- ⚠️ **Partially Wired:** Analytics (uses real API but also displays mock platform metrics), Admin panel (fallback to mocks)
- ❌ **Mock Data Still Active:** Reviews page, some analytics components, ROI dashboard
- 🔄 **Route Inconsistencies:** `/api/client/*` vs `/api/client-portal/*` (both work, but inconsistent usage)

---

## 1. Frontend Views → Backend Endpoints Mapping

### 1.1 Creative Studio (`/studio`)

**Frontend File:** `client/app/(postd)/studio/page.tsx`

| Feature | Frontend Call | Backend Endpoint | Status | Notes |
|---------|--------------|------------------|--------|-------|
| Save Design | `POST /api/studio/save` | `POST /api/studio/save` | ✅ Wired | Uses `SaveDesignRequest` type |
| Update Design | `PUT /api/studio/:id` | `PUT /api/studio/:id` | ✅ Wired | Uses `UpdateDesignRequest` type |
| Schedule Design | `POST /api/studio/:id/schedule` | `POST /api/studio/:id/schedule` | ✅ Wired | Uses `ScheduleDesignRequest` type |
| Load Design | `GET /api/studio/:id` | `GET /api/studio/:id` | ✅ Wired | Returns `CreativeStudioDesign` |
| AI Generation | `POST /api/ai/design` | `POST /api/ai/design` | ✅ Wired | Via design agent |
| Doc Generation | `POST /api/ai/doc` | `POST /api/ai/doc` | ✅ Wired | Via doc agent |

**Backend Routes:** `server/routes/creative-studio.ts`  
**Shared Types:** `@shared/api` (SaveDesignRequest, UpdateDesignRequest, ScheduleDesignRequest)

**Status:** ✅ **FULLY WIRED** - All operations use real API endpoints with proper types.

---

### 1.2 Client Portal (`/client-portal`)

**Frontend File:** `client/app/(postd)/client-portal/page.tsx`

| Feature | Frontend Call | Backend Endpoint | Status | Notes |
|---------|--------------|------------------|--------|-------|
| Dashboard Data | `GET /api/client-portal/dashboard` | `GET /api/client-portal/dashboard` | ✅ Wired | Returns `ClientDashboardData` |
| Workflow Action | `POST /api/client-portal/workflow/action` | `POST /api/client-portal/workflow/action` | ✅ Wired | Uses `WorkflowAction` type |
| Approve Content | `POST /api/client-portal/content/:id/approve` | `POST /api/client-portal/content/:id/approve` | ✅ Wired | ✅ Correct route |
| Reject Content | `POST /api/client-portal/content/:id/reject` | `POST /api/client-portal/content/:id/reject` | ✅ Wired | ✅ Correct route |
| Media Upload | `POST /api/client-portal/media/upload` | `POST /api/client-portal/media/upload` | ✅ Wired | Client-scoped upload |
| Share Links | `POST /api/client-portal/share-links` | `POST /api/client-portal/share-links` | ✅ Wired | Creates shareable analytics link |
| Analytics Dashboard | `ClientAnalyticsDashboard` component | `GET /api/analytics/:brandId` | ✅ Wired | Uses `useAnalytics` hook |

**Backend Routes:** `server/routes/client-portal.ts`  
**Shared Types:** `@shared/client-portal` (ClientDashboardData, ContentItem, ApprovalAction)

**Status:** ✅ **FULLY WIRED** - All operations use real API endpoints with proper types.

**⚠️ Note:** Client Portal correctly uses `/api/client-portal/*` (not `/api/client/*`).

---

### 1.3 Dashboard (`/dashboard`)

**Frontend File:** `client/app/(postd)/dashboard/page.tsx`

| Feature | Frontend Call | Backend Endpoint | Status | Notes |
|---------|--------------|------------------|--------|-------|
| Dashboard Data | `POST /api/dashboard` | `POST /api/dashboard` | ✅ Wired | Uses `useDashboardData` hook |
| Brand Context | `useBrand()` context | N/A | ✅ Wired | Client-side context |

**Backend Routes:** `server/routes/dashboard.ts`  
**Shared Types:** Defined in route handler (not in shared types - **⚠️ ISSUE**)

**Status:** ✅ **WIRED** - Uses real API, but response type not in shared types.

**⚠️ Issue:** Dashboard response type (`DashboardResponse`) is defined in `server/routes/dashboard.ts` but not exported to `@shared/api`. Frontend uses local type definition.

---

### 1.4 Analytics (`/analytics`)

**Frontend File:** `client/app/(postd)/analytics/page.tsx`

| Feature | Frontend Call | Backend Endpoint | Status | Notes |
|---------|--------------|------------------|--------|-------|
| Analytics Data | `GET /api/analytics/:brandId?days=N` | `GET /api/analytics/:brandId` | ✅ Wired | Uses `useAnalytics` hook |
| Platform Metrics | **MOCK DATA** (lines 40-250) | N/A | ❌ Mock | Hardcoded `platformMetrics` array |
| Advisor Insights | `POST /api/ai/advisor` | `POST /api/ai/advisor` | ✅ Wired | Via advisor agent |

**Backend Routes:** `server/routes/analytics.ts`  
**Shared Types:** `@shared/analytics` (AnalyticsResponse)

**Status:** ⚠️ **PARTIALLY WIRED** - Real analytics API is used, but platform metrics carousel displays mock data.

**❌ Critical Issue:** Lines 40-250 in `analytics/page.tsx` contain hardcoded mock `platformMetrics` data that is displayed in the UI. This should be replaced with real platform-specific analytics from the API.

---

### 1.5 Admin Panel (`/admin`)

**Frontend File:** `client/app/(postd)/admin/page.tsx`

| Feature | Frontend Call | Backend Endpoint | Status | Notes |
|---------|--------------|------------------|--------|-------|
| Tenants | `GET /api/admin/tenants` | `GET /api/admin/tenants` | ⚠️ Fallback | Falls back to `getMockTenants()` |
| Users | `GET /api/admin/users` | `GET /api/admin/users` | ⚠️ Fallback | Falls back to `getMockUsers()` |
| Billing | `GET /api/admin/billing` | `GET /api/admin/billing` | ⚠️ Fallback | Falls back to `getMockBilling()` |
| Feature Flags | `GET /api/admin/feature-flags` | `GET /api/admin/feature-flags` | ⚠️ Fallback | Falls back to default flags |

**Backend Routes:** `server/routes/admin.ts`  
**Shared Types:** Not clearly defined in shared types

**Status:** ⚠️ **FALLBACK TO MOCKS** - Tries real API first, but gracefully falls back to mock data if API fails. This is acceptable for non-critical admin features, but should be documented.

**Note:** Lines 108-148 show the fallback pattern. This is a reasonable approach for admin tools, but the mock functions should be removed once all endpoints are fully implemented.

---

### 1.6 Client Settings (`/client-settings`)

**Frontend File:** `client/app/(postd)/client-settings/page.tsx`

| Feature | Frontend Call | Backend Endpoint | Status | Notes |
|---------|--------------|------------------|--------|-------|
| Get Settings | `GET /api/client/settings` | `GET /api/client-settings` | ❌ **MISMATCH** | Frontend uses `/api/client/settings`, backend expects `/api/client-settings` |
| Update Settings | `PUT /api/client/settings` | `PUT /api/client-settings` | ❌ **MISMATCH** | Same mismatch |
| Email Preferences | `POST /api/client/settings/email-preferences` | `POST /api/client-settings/email-preferences` | ❌ **MISMATCH** | Same mismatch |
| Unsubscribe Link | `POST /api/client/settings/generate-unsubscribe-link` | `POST /api/client-settings/generate-unsubscribe-link` | ❌ **MISMATCH** | Same mismatch |

**Backend Routes:** `server/routes/client-settings.ts`  
**Backend Registration:** `server/index.ts` lines 254-260 use `/api/client-settings`  
**Shared Types:** `@shared/client-settings` (ClientSettingsResponse)

**Status:** ❌ **ROUTE MISMATCH** - Frontend calls `/api/client/settings/*` but backend registers `/api/client-settings/*`.

**🔴 Launch-Blocking:** This will cause 404 errors when users try to access client settings.

---

### 1.7 Reviews (`/reviews`)

**Frontend File:** `client/app/(postd)/reviews/page.tsx`

| Feature | Frontend Call | Backend Endpoint | Status | Notes |
|---------|--------------|------------------|--------|-------|
| Reviews Data | **MOCK DATA** (lines 9-92) | N/A | ❌ Mock | Hardcoded `MOCK_REVIEWS` array |

**Backend Routes:** ❌ **NO BACKEND ROUTE** - No reviews API endpoint exists.

**Status:** ❌ **FULLY MOCKED** - Entire reviews page uses hardcoded mock data. No backend integration.

**🔴 Launch-Blocking (if reviews feature is required):** Reviews page will not work in production.

---

### 1.8 Media Management

**Frontend Files:** 
- `client/components/media/MediaUploader.tsx`
- `client/components/media/MediaBrowser.tsx`
- `client/components/media/MediaUploadWithProgress.tsx`

| Feature | Frontend Call | Backend Endpoint | Status | Notes |
|---------|--------------|------------------|--------|-------|
| Upload Media | `POST /api/media/upload` | `POST /api/media/upload` | ✅ Wired | ✅ Correct route |
| List Media | `GET /api/media/list?query` | `GET /api/media/list` | ✅ Wired | ✅ Correct route |
| Get Asset URL | `GET /api/media/url/:assetId` | `GET /api/media/url/:assetId` | ⚠️ **MISMATCH** | Frontend uses `/api/media/url/${brandId}/${bucketPath}`, backend expects `/api/media/url/:assetId` |
| Storage Usage | `GET /api/media/usage/:brandId` | `GET /api/media/usage/:brandId` | ✅ Wired | ✅ Correct route |

**Backend Routes:** `server/routes/media.ts`  
**Shared Types:** `@shared/media` (MediaUploadResponse, MediaListResponse)

**Status:** ⚠️ **MOSTLY WIRED** - Upload and list work, but asset URL endpoint has path mismatch.

**⚠️ Issue:** `MediaBrowser.tsx` line 78 constructs URL as `/api/media/url/${asset.brandId}/${encodeURIComponent(asset.bucketPath)}`, but backend expects `/api/media/url/:assetId` (single ID parameter).

---

## 2. Inconsistent or Duplicate API Usage

### 2.1 `/api/client/*` vs `/api/client-portal/*`

**Issue:** Backend registers both routes, frontend inconsistently uses both.

**Backend Registration** (`server/index.ts`):
```typescript
app.use("/api/client-portal", authenticateUser, clientPortalRouter);
app.use("/api/client", authenticateUser, clientPortalRouter); // Duplicate
app.get("/api/client-portal/share-links/:token", getShareLinkByToken);
app.get("/api/client/share-links/:token", getShareLinkByToken); // Duplicate
```

**Frontend Usage:**
- ✅ `client/app/(postd)/client-portal/page.tsx` - Uses `/api/client-portal/*` (CORRECT)
- ❌ `client/pages/ClientPortal.tsx` - Uses `/api/client/*` (OLD/LEGACY)
- ❌ `client/app/(postd)/client-settings/page.tsx` - Uses `/api/client/settings` (WRONG - should be `/api/client-settings`)

**Recommendation:**
1. **Standardize on `/api/client-portal/*`** for all client portal operations
2. **Remove `/api/client/*` aliases** from backend (or mark as deprecated)
3. **Update legacy pages** (`client/pages/ClientPortal.tsx`) to use `/api/client-portal/*`
4. **Fix client-settings** to use `/api/client-settings/*` (not `/api/client/settings/*`)

**Files to Update:**
- `client/pages/ClientPortal.tsx` (lines 81, 111, 551, 691, 1154)
- `client/app/(postd)/client-settings/page.tsx` (lines 49, 76, 108)
- `server/index.ts` (remove `/api/client` aliases or mark deprecated)

---

### 2.2 Media URL Endpoint Path Mismatch

**Issue:** Frontend constructs media URL with two path segments, backend expects one.

**Frontend** (`client/components/media/MediaBrowser.tsx:78`):
```typescript
`/api/media/url/${asset.brandId}/${encodeURIComponent(asset.bucketPath)}`
```

**Backend** (`server/routes/media.ts`):
```typescript
app.get("/api/media/url/:assetId", getAssetUrl);
```

**Recommendation:**
- **Option A:** Update frontend to use `/api/media/url/:assetId` (single ID)
- **Option B:** Update backend to accept `/api/media/url/:brandId/:bucketPath` (two segments)

**Preferred:** Option A (single ID is cleaner). Update `MediaBrowser.tsx` to use `asset.id` instead of constructing path.

---

### 2.3 Analytics Endpoint Variations

**Current Usage:**
- `GET /api/analytics/:brandId?days=N` (used by `useAnalytics` hook)
- `GET /api/analytics/status/:brandId` (used by `useRealtimeAnalytics` hook)
- `POST /api/analytics/performance` (used by performance utils)

**Backend Routes:** All exist in `server/routes/analytics.ts`

**Status:** ✅ **CONSISTENT** - All variations are properly registered and used correctly.

---

## 3. Mocked/Placeholder Logic Still in Use

### 3.1 Reviews Page - Fully Mocked

**File:** `client/app/(postd)/reviews/page.tsx`

**Issue:** Lines 9-92 contain hardcoded `MOCK_REVIEWS` array that is displayed in the UI.

**Impact:** Reviews page will not show real data in production.

**Recommendation:**
- Create backend route: `GET /api/reviews/:brandId`
- Replace mock data with API call
- Add shared type: `@shared/reviews` (Review, ReviewListResponse)

**Priority:** 🔴 **Launch-Blocking** (if reviews feature is required)

---

### 3.2 Analytics Platform Metrics - Mock Data

**File:** `client/app/(postd)/analytics/page.tsx`

**Issue:** Lines 40-250 contain hardcoded `platformMetrics` array that is displayed in `PlatformMetricsCarousel`.

**Impact:** Platform-specific metrics (Facebook, Instagram, LinkedIn, etc.) show fake data.

**Recommendation:**
- Extend `GET /api/analytics/:brandId` to return platform-specific metrics
- Update `AnalyticsResponse` type to include `platforms: Record<string, PlatformMetrics>`
- Replace mock data with real API response

**Priority:** 🟡 **Non-Blocking** (analytics summary works, only platform breakdown is mocked)

---

### 3.3 Admin Panel - Fallback to Mocks

**File:** `client/app/(postd)/admin/page.tsx`

**Issue:** Lines 108-148 show fallback pattern: tries real API, falls back to mock functions if API fails.

**Impact:** Admin panel may show mock data if backend endpoints are not fully implemented.

**Recommendation:**
- Verify all admin endpoints are implemented: `/api/admin/tenants`, `/api/admin/users`, `/api/admin/billing`, `/api/admin/feature-flags`
- Remove mock fallback functions once endpoints are confirmed working
- Add error handling UI instead of silent fallback to mocks

**Priority:** 🟡 **Non-Blocking** (admin tools are not user-facing)

---

### 3.4 ROI Dashboard - Mock Data

**File:** `client/components/retention/ROIDashboard.tsx`

**Issue:** Lines 333-388 contain `mockROIData` export (used for examples/demos).

**Impact:** If this component is used in production without data prop, it will show mock data.

**Recommendation:**
- Ensure component always receives real data prop
- Remove or clearly mark `mockROIData` as example-only
- Add TypeScript to require data prop

**Priority:** 🟢 **Low Priority** (component appears to be example/demo)

---

### 3.5 Dashboard Mock Data Hook

**File:** `client/components/postd/dashboard/hooks/useDashboardMockData.ts`

**Issue:** Hook exists but appears unused (dashboard uses `useDashboardData` instead).

**Impact:** None (unused code).

**Recommendation:**
- Remove unused mock data hook
- Clean up dead code

**Priority:** 🟢 **Low Priority** (dead code cleanup)

---

## 4. Cross-Check Types & Contracts

### 4.1 Dashboard Response Type Not Shared

**Issue:** `DashboardResponse` type is defined in `server/routes/dashboard.ts` but not exported to `@shared/api`.

**Frontend:** Uses local type definition in `useDashboardData.ts`.

**Recommendation:**
- Move `DashboardResponse` to `@shared/api.ts`
- Update backend to import from shared types
- Update frontend to import from shared types

**Files:**
- `server/routes/dashboard.ts` - Export type
- `shared/api.ts` - Add DashboardResponse
- `client/components/postd/dashboard/hooks/useDashboardData.ts` - Import from shared

**Priority:** 🟡 **Non-Blocking** (works, but inconsistent)

---

### 4.2 Analytics Response Type Mismatch

**Frontend** (`client/components/postd/analytics/hooks/useAnalytics.ts`):
```typescript
interface AnalyticsResponse {
  summary: { ... };
  platforms: Record<string, unknown>; // ⚠️ Using unknown
  comparison: { ... };
  timeframe: { ... };
  lastUpdated: string;
}
```

**Backend** (`server/routes/analytics.ts`):
- Returns similar structure but may have different field names

**Shared Type** (`@shared/analytics.ts`):
- `AnalyticsResponse` exists but may not match exactly

**Recommendation:**
- Verify `@shared/analytics.AnalyticsResponse` matches both frontend and backend
- Update frontend to use shared type (remove local definition)
- Ensure backend returns exact shape defined in shared type

**Priority:** 🟡 **Non-Blocking** (works, but types could be tighter)

---

### 4.3 Media Response Types

**Status:** ✅ **GOOD** - Media types are properly shared:
- `@shared/media.ts` defines `MediaUploadResponse`, `MediaListResponse`, etc.
- Backend and frontend both use shared types

---

### 4.4 Creative Studio Types

**Status:** ✅ **GOOD** - Studio types are properly shared:
- `@shared/api.ts` defines `SaveDesignRequest`, `UpdateDesignRequest`, `ScheduleDesignRequest`, etc.
- Backend and frontend both use shared types

---

### 4.5 Client Portal Types

**Status:** ✅ **GOOD** - Client portal types are properly shared:
- `@shared/client-portal.ts` defines `ClientDashboardData`, `ContentItem`, `ApprovalAction`
- Backend and frontend both use shared types

---

## 5. Launch-Blocking vs Non-Blocking Issues

### 5.1 🔴 Launch-Blocking Issues

#### 1. Client Settings Route Mismatch
- **Issue:** Frontend calls `/api/client/settings/*` but backend registers `/api/client-settings/*`
- **Impact:** Client settings page will return 404 errors
- **Files:** 
  - `client/app/(postd)/client-settings/page.tsx` (lines 49, 76, 108)
- **Fix:** Update frontend to use `/api/client-settings/*` (not `/api/client/settings/*`)
- **Owner:** Frontend Agent
- **Estimated Time:** 15 minutes

#### 2. Reviews Page - No Backend Integration
- **Issue:** Reviews page uses hardcoded mock data, no backend route exists
- **Impact:** Reviews feature will not work in production
- **Files:**
  - `client/app/(postd)/reviews/page.tsx` (lines 9-92)
- **Fix:** 
  - Create `GET /api/reviews/:brandId` endpoint
  - Replace mock data with API call
  - Add shared types
- **Owner:** Backend Agent (route) + Frontend Agent (integration)
- **Estimated Time:** 2-3 hours

#### 3. Media URL Endpoint Path Mismatch
- **Issue:** Frontend constructs `/api/media/url/:brandId/:bucketPath` but backend expects `/api/media/url/:assetId`
- **Impact:** Media asset URLs will return 404 errors
- **Files:**
  - `client/components/media/MediaBrowser.tsx` (line 78)
- **Fix:** Update frontend to use `asset.id` instead of constructing path
- **Owner:** Frontend Agent
- **Estimated Time:** 30 minutes

---

### 5.2 🟡 Non-Blocking / Post-Launch Issues

#### 1. Analytics Platform Metrics Mock Data
- **Issue:** Platform-specific metrics carousel shows hardcoded data
- **Impact:** Platform breakdown shows fake data (summary still works)
- **Files:**
  - `client/app/(postd)/analytics/page.tsx` (lines 40-250)
- **Fix:** Extend analytics API to return platform-specific metrics
- **Owner:** Backend Agent (extend API) + Frontend Agent (use real data)
- **Estimated Time:** 3-4 hours

#### 2. Admin Panel Fallback to Mocks
- **Issue:** Admin panel falls back to mock data if API fails
- **Impact:** Admin tools may show fake data if endpoints not implemented
- **Files:**
  - `client/app/(postd)/admin/page.tsx` (lines 108-148)
- **Fix:** Verify all admin endpoints work, remove mock fallbacks, add error UI
- **Owner:** Backend Agent (verify endpoints) + Frontend Agent (error handling)
- **Estimated Time:** 2 hours

#### 3. Dashboard Response Type Not Shared
- **Issue:** Dashboard response type defined in backend, not in shared types
- **Impact:** Type inconsistency, but functionality works
- **Files:**
  - `server/routes/dashboard.ts`
  - `shared/api.ts`
  - `client/components/postd/dashboard/hooks/useDashboardData.ts`
- **Fix:** Move type to shared, update imports
- **Owner:** Backend Agent (or shared types maintainer)
- **Estimated Time:** 30 minutes

#### 4. Analytics Response Type Mismatch
- **Issue:** Frontend uses local type definition, may not match backend exactly
- **Impact:** Type safety issues, but functionality works
- **Files:**
  - `client/components/postd/analytics/hooks/useAnalytics.ts`
  - `shared/analytics.ts`
- **Fix:** Use shared type, verify backend matches
- **Owner:** Frontend Agent
- **Estimated Time:** 30 minutes

#### 5. `/api/client/*` vs `/api/client-portal/*` Inconsistency
- **Issue:** Backend registers both, legacy pages use old route
- **Impact:** Works (both routes point to same handler), but inconsistent
- **Files:**
  - `client/pages/ClientPortal.tsx` (legacy page)
  - `server/index.ts` (duplicate routes)
- **Fix:** Update legacy pages, remove duplicate routes (or mark deprecated)
- **Owner:** Frontend Agent (update pages) + Backend Agent (cleanup routes)
- **Estimated Time:** 1 hour

#### 6. Unused Mock Data Hooks
- **Issue:** `useDashboardMockData` hook exists but unused
- **Impact:** Dead code
- **Files:**
  - `client/components/postd/dashboard/hooks/useDashboardMockData.ts`
- **Fix:** Remove unused code
- **Owner:** Frontend Agent
- **Estimated Time:** 15 minutes

---

## 6. Summary & Recommendations

### 6.1 What's Working Well ✅

1. **Creative Studio** - Fully wired, proper types, all operations work
2. **Client Portal** - Fully wired, proper types, correct route usage
3. **Media Management** - Mostly wired (upload, list work correctly)
4. **Dashboard** - Wired to real API (type sharing could be improved)
5. **Type Safety** - Most areas use shared types correctly

### 6.2 Critical Fixes Needed Before Launch 🔴

1. **Fix client settings route mismatch** (15 min)
2. **Fix media URL endpoint path** (30 min)
3. **Wire reviews page to backend** (2-3 hours) OR disable reviews feature

**Total Critical Fix Time:** ~3-4 hours

### 6.3 Recommended Post-Launch Improvements 🟡

1. Replace analytics platform metrics mock data
2. Remove admin panel mock fallbacks
3. Standardize dashboard response types
4. Clean up `/api/client/*` vs `/api/client-portal/*` inconsistency
5. Remove unused mock data hooks

**Total Post-Launch Time:** ~6-8 hours

### 6.4 Action Items by Agent

#### Frontend Agent
- [ ] Fix client settings route (`/api/client/settings` → `/api/client-settings`)
- [ ] Fix media URL endpoint path (use `asset.id` instead of constructing path)
- [ ] Wire reviews page to backend (if reviews feature required)
- [ ] Replace analytics platform metrics mock data
- [ ] Update legacy `ClientPortal.tsx` to use `/api/client-portal/*`
- [ ] Remove unused `useDashboardMockData` hook
- [ ] Use shared `AnalyticsResponse` type instead of local definition

#### Backend Agent
- [ ] Create `GET /api/reviews/:brandId` endpoint (if reviews feature required)
- [ ] Extend `GET /api/analytics/:brandId` to return platform-specific metrics
- [ ] Verify all admin endpoints work (`/api/admin/tenants`, `/api/admin/users`, etc.)
- [ ] Export `DashboardResponse` to `@shared/api.ts`
- [ ] Remove or deprecate `/api/client/*` aliases (after frontend updates)

#### Shared Types Maintainer
- [ ] Add `DashboardResponse` to `@shared/api.ts`
- [ ] Verify `AnalyticsResponse` matches both frontend and backend
- [ ] Add `Review` and `ReviewListResponse` types (if reviews feature required)

---

## 7. Endpoint Inventory

### 7.1 Fully Wired Endpoints ✅

| Endpoint | Method | Frontend Usage | Backend Route | Status |
|----------|--------|----------------|---------------|--------|
| `/api/studio/save` | POST | ✅ | ✅ | Wired |
| `/api/studio/:id` | GET/PUT | ✅ | ✅ | Wired |
| `/api/studio/:id/schedule` | POST | ✅ | ✅ | Wired |
| `/api/client-portal/dashboard` | GET | ✅ | ✅ | Wired |
| `/api/client-portal/workflow/action` | POST | ✅ | ✅ | Wired |
| `/api/client-portal/content/:id/approve` | POST | ✅ | ✅ | Wired |
| `/api/client-portal/content/:id/reject` | POST | ✅ | ✅ | Wired |
| `/api/client-portal/media/upload` | POST | ✅ | ✅ | Wired |
| `/api/client-portal/share-links` | POST/GET | ✅ | ✅ | Wired |
| `/api/dashboard` | POST | ✅ | ✅ | Wired |
| `/api/analytics/:brandId` | GET | ✅ | ✅ | Wired |
| `/api/media/upload` | POST | ✅ | ✅ | Wired |
| `/api/media/list` | GET | ✅ | ✅ | Wired |
| `/api/media/usage/:brandId` | GET | ✅ | ✅ | Wired |
| `/api/ai/design` | POST | ✅ | ✅ | Wired |
| `/api/ai/doc` | POST | ✅ | ✅ | Wired |
| `/api/ai/advisor` | POST | ✅ | ✅ | Wired |

### 7.2 Partially Wired / Issues ⚠️

| Endpoint | Method | Frontend Usage | Backend Route | Issue |
|----------|--------|----------------|---------------|-------|
| `/api/client-settings` | GET/PUT | ❌ Uses `/api/client/settings` | ✅ | Route mismatch |
| `/api/media/url/:assetId` | GET | ⚠️ Uses `/:brandId/:bucketPath` | ✅ | Path mismatch |
| `/api/analytics/:brandId` | GET | ✅ | ✅ | Platform metrics still mocked |
| `/api/admin/*` | GET | ⚠️ Falls back to mocks | ✅ | Fallback pattern |

### 7.3 Missing Endpoints ❌

| Endpoint | Method | Frontend Usage | Backend Route | Status |
|----------|--------|----------------|---------------|--------|
| `/api/reviews/:brandId` | GET | ❌ Uses mock data | ❌ Missing | Not implemented |

---

## 8. Conclusion

**Overall Status:** 🟡 **Mostly Ready, Critical Fixes Needed**

The codebase is well-structured with most features properly wired to backend APIs. However, **3 critical issues** must be fixed before launch:

1. Client settings route mismatch (15 min fix)
2. Media URL endpoint path mismatch (30 min fix)
3. Reviews page not wired (2-3 hours OR disable feature)

After these fixes, the system will be ready for launch. Post-launch improvements can address mock data cleanup and type consistency improvements.

**Estimated Time to Launch-Ready:** 3-4 hours of focused work on critical issues.

---

**Report Generated:** 2024-11-XX  
**Next Review:** After critical fixes are applied

