# POSTD Audit - Quick Fix Checklist

**For: Frontend Agent, Backend Agent, Shared Types Agent**

---

## 🚨 CRITICAL - Fix Immediately (Server Won't Start)

### Backend Agent
- [x] **Fix:** Add missing import in `server/index.ts`
  ```typescript
  import searchRouter from "./routes/search";
  ```
  **Line:** Add after line 18 (with other router imports)

---

## 🔴 HIGH PRIORITY - Frontend Will Break

### Backend Agent
- [x] **Fix:** Register brand-intelligence routes in `server/index.ts`
  ```typescript
  app.get("/api/brand-intelligence/:brandId", authenticateUser, getBrandIntelligence);
  app.post("/api/brand-intelligence/feedback", authenticateUser, submitRecommendationFeedback);
  ```
  **Location:** After line 232 (after analytics routes)

- [x] **Fix:** Register media routes in `server/index.ts`
  ```typescript
  app.post("/api/media/upload", authenticateUser, uploadMedia);
  app.get("/api/media/list", authenticateUser, listMedia);
  app.get("/api/media/usage/:brandId", authenticateUser, getStorageUsage);
  app.get("/api/media/url/:assetId", authenticateUser, getAssetUrl);
  app.post("/api/media/duplicate-check", authenticateUser, checkDuplicateAsset);
  app.post("/api/media/seo-metadata", authenticateUser, generateSEOMetadataRoute);
  app.post("/api/media/track-usage", authenticateUser, trackAssetUsage);
  ```
  **Location:** After brand-intelligence routes
  **Note:** Routes adjusted to match handler signatures (usage/:brandId, url/:assetId)

- [x] **Fix:** Register client-settings routes
  ```typescript
  app.get("/api/client-settings", authenticateUser, getClientSettings);
  app.put("/api/client-settings", authenticateUser, updateClientSettings);
  app.post("/api/client-settings/email-preferences", authenticateUser, updateEmailPreferences);
  app.post("/api/client-settings/unsubscribe-link", authenticateUser, generateUnsubscribeLink);
  app.post("/api/client-settings/unsubscribe", unsubscribeFromEmails);
  app.post("/api/client-settings/resubscribe", resubscribeToEmails);
  app.get("/api/client-settings/verify-unsubscribe/:token", verifyUnsubscribeToken);
  ```
  **Location:** After media routes

---

## ⚠️ MEDIUM PRIORITY - Missing Features

### Backend Agent
- [x] **Fix:** Import and register billing routes
  ```typescript
  import billingRouter from "./routes/billing";
  // ... later ...
  app.use("/api/billing", authenticateUser, billingRouter);
  ```

- [x] **Fix:** Import and register trial routes
  ```typescript
  import trialRouter from "./routes/trial";
  // ... later ...
  app.use("/api/trial", authenticateUser, trialRouter);
  ```

- [x] **Fix:** Import and register milestones routes
  ```typescript
  import milestonesRouter from "./routes/milestones";
  // ... later ...
  app.use("/api/milestones", authenticateUser, milestonesRouter);
  ```

- [x] **Fix:** Import and register integrations routes
  ```typescript
  import integrationsRouter from "./routes/integrations";
  // ... later ...
  app.use("/api/integrations", authenticateUser, integrationsRouter);
  ```

- [x] **Fix:** Register admin routes (check if `adminRouter` handles these)
  - Verified `/api/admin/tenants` exists (GET)
  - Verified `/api/admin/users` exists (GET)
  - Verified `/api/admin/billing` exists (GET)
  - Verified `/api/admin/feature-flags` exists (GET, POST)
  - Verified `/api/admin/overview` exists (GET)
  **Status:** All admin routes are properly registered via `adminRouter` at `/api/admin`

---

## 🔧 TYPE FIXES

### Shared Types Agent
- [ ] **Fix:** Remove duplicate `ClientDashboardData` from `shared/api.ts`
  - Keep the one in `shared/client-portal.ts` (it's more comprehensive)
  - Remove lines 349-354 from `shared/api.ts`

- [ ] **Fix:** Remove duplicate `BrandIntelligenceUpdate` from `shared/brand-intelligence.ts`
  - Remove one of the duplicate definitions (lines 161-171)

### Frontend Agent
- [ ] **Fix:** Update `ClientPortal.tsx` to import from correct location
  ```typescript
  // Change from:
  import { ClientDashboardData } from "@shared/api";
  // To:
  import { ClientDashboardData } from "@shared/client-portal";
  ```

---

## 📋 VERIFICATION CHECKLIST

### Backend Agent
- [ ] All imported route handlers are registered
- [ ] All route files that exist are either imported or removed
- [ ] Test server starts without errors
- [ ] All routes return correct response types

### Frontend Agent
- [ ] All API calls have matching backend routes
- [ ] All type imports use correct source files
- [ ] No duplicate type imports
- [ ] Error handling for 404 responses

### Shared Types Agent
- [ ] No duplicate type definitions
- [ ] All types are in appropriate files
- [ ] Types match actual API responses

---

## 🧪 TESTING

### Backend Agent
- [ ] Run: `pnpm typecheck` - should pass
- [ ] Run: `pnpm dev` - server should start
- [ ] Test: All registered routes respond (not 404)

### Frontend Agent
- [ ] Run: `pnpm typecheck` - should pass
- [ ] Test: Brand Intelligence page loads data
- [ ] Test: Media upload works
- [ ] Test: Client Portal loads dashboard

---

## 📝 NOTES

- **Route Registration Pattern:** Most routes should be registered after line 232 (after analytics)
- **Authentication:** Most routes need `authenticateUser` middleware
- **Scopes:** Some routes may need `requireScope()` - check existing patterns
- **Router vs Direct:** Some routes use routers (e.g., `analyticsRouter`), others use direct handlers

---

## ✅ COMPLETION CRITERIA

- [ ] Server starts without errors
- [ ] All frontend API calls return 200 (not 404)
- [ ] TypeScript compilation passes
- [ ] No duplicate type definitions
- [ ] All imported handlers are registered

---

**Estimated Time:** 4-6 hours for critical + high priority fixes

