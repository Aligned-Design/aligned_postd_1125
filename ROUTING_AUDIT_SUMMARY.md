# ROUTING & PAGES AUDIT - QUICK REFERENCE

**Date:** November 10, 2025
**Full Report:** See `ROUTING_AUDIT.md` for comprehensive analysis

---

## KEY METRICS

| Category | Count | Status |
|----------|-------|--------|
| **CLIENT ROUTES** | 17 | ✓ FUNCTIONAL |
| **CLIENT PAGES (Routed)** | 18 | ✓ WORKING |
| **CLIENT PAGES (Orphaned)** | 34 | ✗ UNUSED |
| **SERVER API ENDPOINTS** | 107 | ✓ FUNCTIONAL |
| **Endpoints with TODOs** | 9 | ⚠️ INCOMPLETE |
| **Broken Routes** | 0 | ✓ NONE |

---

## CRITICAL ISSUES (Fix Immediately)

### 1. CATCH-ALL ROUTE BROKEN
- **File:** `client/App.tsx` Line 67
- **Problem:** Routes to Dashboard instead of NotFound
- **Fix:** Change to: `<Route path="*" element={<NotFound />} />`
- **Impact:** 404 errors show dashboard instead of error page

### 2. 34 ORPHANED PAGES
- **Files:** client/pages/ (30% of all pages)
- **Size:** ~6,000+ lines of unused code
- **Problem:** Bloats bundle, confuses developers
- **Examples:** ClientPortal.tsx (1189 lines), BrandIntelligence.tsx (867 lines)
- **Action:** Classify and delete/move/route these pages

### 3. 9 INCOMPLETE API ENDPOINTS
- **Files:** Multiple server/routes/*.ts files
- **Status:** Have TODOs indicating missing functionality
- **Examples:** 
  - Integrations: Missing sync trigger, webhook verification
  - Brand Intelligence: Feedback not persisted
  - Builder: Webhook incomplete
  - Publishing: Permissions not extracted
- **Action:** Complete TODOs before production use

---

## ROUTED PAGES (17 Working Routes)

```
✓ /                      → Index (landing)
✓ /onboarding           → Onboarding (multi-step)
✓ /dashboard            → Dashboard
✓ /calendar             → Calendar
✓ /content-queue        → ContentQueue
✓ /creative-studio      → CreativeStudio
✓ /campaigns            → Campaigns
✓ /brand-guide          → BrandGuide
✓ /analytics            → Analytics
✓ /reporting            → Reporting
✓ /paid-ads             → PaidAds
✓ /library              → Library (imported as LibraryPage)
✓ /events               → Events
✓ /reviews              → Reviews
✓ /linked-accounts      → LinkedAccounts
✓ /settings             → Settings
* (catch-all)           → Dashboard (SHOULD BE NotFound!)
```

---

## API ENDPOINT SUMMARY

### By Category:
- **AI & Agents:** 12 endpoints
- **Analytics:** 12 endpoints
- **Content Management:** 31 endpoints (approvals, bulk, media)
- **Publishing:** 9 endpoints
- **Integrations:** 7 endpoints + webhooks
- **Infrastructure:** 26 endpoints (crawler, escalations, workflows, white-label, etc.)

### Status:
- ✓ Fully Implemented: 98 endpoints
- ⚠️ With TODOs: 9 endpoints
- ✗ Broken: 0 endpoints

---

## ORPHANED PAGES (High Priority)

### Large Functional Pages (Should be routed?)
| Page | Lines | Purpose |
|------|-------|---------|
| ClientPortal.tsx | 1189 | White-label client portal |
| AnalyticsPortal.tsx | 909 | Advanced analytics |
| BrandIntelligence.tsx | 867 | Brand insights dashboard |
| ReviewQueue.tsx | 614 | Content review workflow |
| Demo.tsx | 687 | Demo/testing interface |

### Marketing Pages (Move to separate site?)
- About.tsx, Contact.tsx, Features.tsx, Pricing.tsx
- Privacy.tsx, Terms.tsx, Legal.tsx, Support.tsx
- HelpLibrary.tsx, IntegrationsMarketing.tsx

### Duplicate Pages (Consolidate)
- Dashboard.tsx, NewDashboard.tsx, ContentDashboard.tsx
- Analytics.tsx, AnalyticsPortal.tsx
- MediaManager.tsx, MediaManagerV2.tsx, Library.tsx
- Approvals.tsx, ReviewQueue.tsx

### Legacy/Deprecated (Delete?)
- Login.tsx, Signup.tsx (Auth via context)
- Assets.tsx, Content.tsx, Media.tsx (Stubs)
- BrandIntake.tsx, BrandSnapshot.tsx, Brands.tsx (Onboarding pages?)
- MediaManager.tsx, MediaManagerV2.tsx (Older versions)

---

## MINOR ISSUES

### Component Naming
- Library.tsx imported as "LibraryPage" (works but confusing)
- **Fix:** Import as "Library" to match filename

### TODO Endpoints (By File)

**brand-intelligence.ts**
- Line 331-332: Store feedback in database
- Line 331-332: Use feedback to improve recommendations

**builder.ts**
- Line 45: Handle content updates (cache invalidation)
- Line 48: Handle content publishing

**integrations.ts**
- Line 235: Fetch integration from database
- Line 300: Fetch from database
- Line 335: Get integration mapping
- Line 398: Start background sync process
- Line 417: Implement webhook signature verification
- Line 422: Queue webhook event for processing

**publishing.ts**
- Line 131: Extract permissions from token response

**agents.ts**
- Line 238: Track actual duration

---

## IMMEDIATE ACTION ITEMS

### Priority 1 (This Week)
1. [ ] Fix catch-all route to show NotFound (5 min)
2. [ ] Classify all 34 orphaned pages (30 min)
3. [ ] Delete clearly unused pages (30 min)
4. [ ] Fix Library import naming (2 min)

### Priority 2 (This Sprint)
1. [ ] Complete 9 TODO items in API handlers
2. [ ] Move marketing pages to separate location
3. [ ] Consolidate duplicate pages
4. [ ] Add tests for routes and endpoints

### Priority 3 (Next Sprint)
1. [ ] Document routing architecture
2. [ ] Add routing guide for developers
3. [ ] Set up routing tests in CI/CD
4. [ ] Monitor for orphaned page usage

---

## FILES MODIFIED IN AUDIT

### Generated Reports
- ✓ ROUTING_AUDIT.md (comprehensive full report)
- ✓ ROUTING_AUDIT_SUMMARY.md (this file)

### Key Files Reviewed
- client/App.tsx (main routing config)
- server/index.ts (API routing)
- client/pages/*.tsx (56 page files)
- server/routes/*.ts (25 route files)

---

## STATISTICS

**Code Analyzed:**
- 56 page components (~18,000 lines)
- 107 API endpoints
- 25 server route files
- 1 main routing configuration

**Issues Found:**
- Critical: 3
- Moderate: 5
- Minor: 2

**Overall Assessment:**
- Routing is FUNCTIONAL but needs CLEANUP
- Core routes are solid, pages need organization
- API is mostly complete with 9 incomplete TODOs

---

For full details, see `ROUTING_AUDIT.md`
