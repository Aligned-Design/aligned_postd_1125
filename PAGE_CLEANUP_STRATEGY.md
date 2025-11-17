# Page Cleanup Strategy

**Created:** November 10, 2025
**Status:** Planning Phase

---

## Overview

This document outlines a systematic plan to clean up 38 orphaned pages and consolidate duplicates, reducing code bloat from ~6,000 lines to a lean, maintainable structure.

**Current State:**
- Total pages: 56 files
- Routed pages: 18 (32%)
- Orphaned pages: 38 (68%)
- Estimated dead code: 6,000+ lines

---

## Categorization & Actions

### Category 1: Marketing Pages (11 files - MOVE/DELETE)
**Recommendation:** Move to separate landing site project

These pages are for public marketing, not the protected app. They should either be:
1. Moved to a separate `landing-site/` project
2. Deleted if not needed
3. Documented as out-of-scope for this app

**Pages:**
- [ ] About.tsx (89 lines)
- [ ] Contact.tsx (73 lines)
- [ ] Features.tsx (112 lines)
- [ ] Integrations.tsx (287 lines) - Different from LinkedAccounts
- [ ] IntegrationsMarketing.tsx (103 lines)
- [ ] Legal.tsx (68 lines)
- [ ] Pricing.tsx (453 lines)
- [ ] Privacy.tsx (67 lines)
- [ ] Support.tsx (168 lines)
- [ ] Terms.tsx (61 lines)
- [ ] HelpLibrary.tsx (514 lines)

**Total Lines:** 1,993 lines
**Action:** DELETE (or move to landing site)
**Priority:** LOW (Nice to have)
**Time:** 30 minutes to delete

---

### Category 2: Legacy Authentication Pages (2 files - DELETE)
**Recommendation:** Delete - superseded by AuthContext

These are legacy auth pages. Authentication is now handled by `AuthContext`, not these pages.

**Pages:**
- [ ] Login.tsx (71 lines)
- [ ] Signup.tsx (143 lines)

**Total Lines:** 214 lines
**Action:** DELETE
**Priority:** LOW (Nice to have)
**Time:** 5 minutes to delete

**Verification Steps:**
- Search codebase for imports of Login or Signup
- Confirm no routes reference these pages
- Delete files

---

### Category 3: Minimal/Stub Pages (3 files - DELETE)
**Recommendation:** Delete - incomplete implementations

These are minimal placeholder pages with almost no functionality.

**Pages:**
- [ ] Assets.tsx (200 lines) - Stub page
- [ ] Content.tsx (40 lines) - Stub page
- [ ] Media.tsx (32 lines) - Stub page

**Total Lines:** 272 lines
**Action:** DELETE
**Priority:** LOW (Nice to have)
**Time:** 5 minutes to delete

---

### Category 4: Duplicate Dashboards (2 files - CONSOLIDATE)
**Recommendation:** Delete duplicates, keep Dashboard.tsx

Three versions exist. Dashboard.tsx is routed and appears to be the canonical version.

**Pages:**
- Dashboard.tsx (69 lines) - **ROUTED** at `/dashboard` ✅
- [ ] NewDashboard.tsx (368 lines) - ORPHANED
- [ ] ContentDashboard.tsx (511 lines) - ORPHANED

**Total Orphaned Lines:** 879 lines
**Action:** DELETE NewDashboard.tsx and ContentDashboard.tsx
**Priority:** MEDIUM (Should be done)
**Time:** 15 minutes

**Consolidation Steps:**
1. Compare NewDashboard.tsx and ContentDashboard.tsx to Dashboard.tsx
2. Extract any unique features from orphaned versions
3. Merge features into Dashboard.tsx if valuable
4. Delete orphaned versions
5. Test Dashboard route works properly

---

### Category 5: Duplicate Analytics (1 file - CONSOLIDATE)
**Recommendation:** Delete AnalyticsPortal.tsx, keep Analytics.tsx

Two versions exist. Analytics.tsx is routed and 552 lines.

**Pages:**
- Analytics.tsx (552 lines) - **ROUTED** at `/analytics` ✅
- [ ] AnalyticsPortal.tsx (909 lines) - ORPHANED

**Total Orphaned Lines:** 909 lines
**Action:** DELETE AnalyticsPortal.tsx
**Priority:** MEDIUM (Should be done)
**Time:** 15 minutes

**Consolidation Steps:**
1. Compare AnalyticsPortal.tsx to Analytics.tsx
2. Identify unique features in AnalyticsPortal
3. Merge into Analytics.tsx if valuable
4. Delete AnalyticsPortal.tsx
5. Test Analytics route works properly

---

### Category 6: Duplicate Media Manager (2 files - CONSOLIDATE)
**Recommendation:** Delete MediaManager and MediaManagerV2, keep Library.tsx

Three versions exist. Library.tsx is routed and appears to be the current version.

**Pages:**
- Library.tsx (851 lines) - **ROUTED** at `/library` ✅
- [ ] MediaManager.tsx (278 lines) - ORPHANED
- [ ] MediaManagerV2.tsx (568 lines) - ORPHANED

**Total Orphaned Lines:** 846 lines
**Action:** DELETE MediaManager.tsx and MediaManagerV2.tsx
**Priority:** MEDIUM (Should be done)
**Time:** 15 minutes

**Consolidation Steps:**
1. Compare MediaManager.tsx and MediaManagerV2.tsx to Library.tsx
2. Extract any unique features
3. Merge into Library.tsx if valuable
4. Delete orphaned versions
5. Test Library route works properly

---

### Category 7: Duplicate Approval Workflow (2 files - CONSOLIDATE)
**Recommendation:** Consolidate and create route for unified approval system

Neither is currently routed. We need to decide which is better or merge them.

**Pages:**
- [ ] Approvals.tsx (34 lines) - ORPHANED (minimal)
- [ ] ReviewQueue.tsx (614 lines) - ORPHANED (full-featured)

**Total Lines:** 648 lines
**Action:** CONSOLIDATE into unified page, ADD ROUTE, DELETE duplicate
**Priority:** HIGH (Functionality impact)
**Time:** 1-2 hours

**Consolidation Steps:**
1. Review both pages to understand approval workflow
2. Decide which is more complete or merge them
3. Create unified approval interface
4. Add route at `/approvals` or `/review-queue`
5. Update App.tsx with new route
6. Test functionality works
7. Delete duplicate files

---

### Category 8: Large Functional Pages - Needs Decision (10+ files)

These are fully-implemented pages that are complete but not routed. We need to decide if they should be:
- **Route:** Add a route and enable them
- **Archive:** Move to archive folder for future reference
- **Delete:** If no longer needed

#### Sub-Category 8A: Brand Management Pages (5 files)
These appear to be admin/brand management interfaces that may be needed but aren't routed.

**Pages:**
- [ ] BrandIntake.tsx (577 lines) - Brand intake form
- [ ] BrandSnapshot.tsx (331 lines) - Brand snapshot view
- [ ] Brands.tsx (351 lines) - Brands list/management
- [ ] ClientSettings.tsx (484 lines) - Client settings management
- [ ] Assets.tsx (200 lines) - Asset management (Note: duplicate filename with stub)

**Total Lines:** 1,943 lines
**Decision Required:**
- Are these replaced by API endpoints?
- Should these be routed under `/admin/` or `/settings/`?
- Are they actively used?

**Action:** RESEARCH & DECIDE
**Priority:** MEDIUM (Functionality)
**Time:** 30 minutes decision + 1-2 hours if implementing

---

#### Sub-Category 8B: Content Creation Pages (4 files)
These appear to be alternate or legacy content creation interfaces.

**Pages:**
- [ ] ContentDashboard.tsx (511 lines) - Content dashboard
- [ ] ContentGenerator.tsx (426 lines) - AI content generation
- [ ] CreatePost.tsx (526 lines) - Post creation form
- [ ] TeamManagement.tsx (252 lines) - Team management

**Total Lines:** 1,715 lines
**Decision Required:**
- Do these provide features not in routed pages?
- Should ContentGenerator be routed?
- Is CreatePost better than ContentQueue?
- Where does TeamManagement fit?

**Action:** RESEARCH & DECIDE
**Priority:** MEDIUM (Functionality)
**Time:** 30 minutes decision + 1-2 hours if implementing

---

#### Sub-Category 8C: Advanced Features (3 files)
These are advanced feature pages that might be high-value but aren't routed.

**Pages:**
- [ ] ClientPortal.tsx (1,189 lines) - Client approval portal (LARGE)
- [ ] BrandIntelligence.tsx (867 lines) - Brand insights dashboard
- [ ] Demo.tsx (687 lines) - Demo/testing interface

**Total Lines:** 2,743 lines
**Decision Required:**
- ClientPortal: Should this be routed at `/client-portal/:clientId`?
- BrandIntelligence: Should this be a separate route or integrated with Analytics?
- Demo: Is this only for development or should it be in code at all?

**Action:** RESEARCH & DECIDE
**Priority:** HIGH (High-value features)
**Time:** 1 hour decision + 2-3 hours if implementing

---

#### Sub-Category 8D: Miscellaneous (2 files)
- [ ] BrandKitBuilder.tsx (100 lines) - Unclear purpose
- [ ] NeonNest.tsx (10 lines) - Builder.io integration wrapper

**Decision Required:**
- BrandKitBuilder: Is this still needed?
- NeonNest: Is this used for Builder.io integration?

**Action:** RESEARCH & DECIDE
**Priority:** LOW (Minimal code)
**Time:** 15 minutes decision

---

## Summary Table

| Category | Files | Lines | Action | Priority | Time |
|----------|-------|-------|--------|----------|------|
| Marketing | 11 | 1,993 | DELETE | LOW | 30 min |
| Legacy Auth | 2 | 214 | DELETE | LOW | 5 min |
| Stubs | 3 | 272 | DELETE | LOW | 5 min |
| Dash Dupes | 2 | 879 | DELETE | MEDIUM | 15 min |
| Analytics Dupe | 1 | 909 | DELETE | MEDIUM | 15 min |
| Media Dupes | 2 | 846 | DELETE | MEDIUM | 15 min |
| Approval Dupes | 2 | 648 | CONSOLIDATE | HIGH | 1-2 hrs |
| Brand Mgmt | 5 | 1,943 | DECIDE | MEDIUM | 30 min + 1-2 hrs |
| Content Pages | 4 | 1,715 | DECIDE | MEDIUM | 30 min + 1-2 hrs |
| Advanced | 3 | 2,743 | DECIDE | HIGH | 1 hr + 2-3 hrs |
| Misc | 2 | 110 | DECIDE | LOW | 15 min |

**Total Orphaned Lines:** 11,729 lines
**Estimated Total Time:** 5-12 hours (including decisions)

---

## Action Plan - Phases

### Phase 1: Quick Wins (1 hour) - Do This Week
1. **Fix 404 Bug** ✅ DONE
2. **Delete obvious dead code:**
   - Delete all 11 marketing pages
   - Delete 2 legacy auth pages
   - Delete 3 stub pages
3. **Delete dashboard duplicates:**
   - Delete NewDashboard.tsx
   - Delete ContentDashboard.tsx
4. **Delete analytics duplicate:**
   - Delete AnalyticsPortal.tsx
5. **Delete media duplicates:**
   - Delete MediaManager.tsx
   - Delete MediaManagerV2.tsx

**Result:** Remove 4,188 lines of confirmed dead code

---

### Phase 2: Consolidation (2-3 hours) - Do This Week
1. **Consolidate approval workflow:**
   - Choose between Approvals.tsx and ReviewQueue.tsx
   - Merge if needed
   - Add route to App.tsx
   - Delete duplicate

**Result:** Working approval workflow with proper routing

---

### Phase 3: Research & Decisions (1-2 hours) - Do Next Week
1. Review brand management pages (decision: route or delete?)
2. Review content creation pages (decision: route or delete?)
3. Review advanced feature pages (decision: route or delete?)
4. Review miscellaneous pages (decision: route or delete?)

**Result:** Clear decisions on what to keep, route, or delete

---

### Phase 4: Implementation (2-3 hours) - Do After Decisions
Based on Phase 3 decisions:
- Add routes for pages that should be public
- Create `/admin/` routes for admin pages
- Implement any needed consolidations
- Update documentation

---

## Success Criteria

After cleanup:
- [ ] All routed pages have matching entries in App.tsx
- [ ] No orphaned pages except those explicitly kept for archive
- [ ] All imports in App.tsx reference existing pages
- [ ] Build succeeds with no unused page warnings
- [ ] All routes work and render correct pages
- [ ] 404 page shows for invalid routes
- [ ] Code size reduced by 50%+
- [ ] Developer can quickly identify all available pages

---

## Files to Start Deleting (Phase 1)

```bash
# Marketing Pages (11)
client/pages/About.tsx
client/pages/Contact.tsx
client/pages/Features.tsx
client/pages/Integrations.tsx
client/pages/IntegrationsMarketing.tsx
client/pages/Legal.tsx
client/pages/Pricing.tsx
client/pages/Privacy.tsx
client/pages/Support.tsx
client/pages/Terms.tsx
client/pages/HelpLibrary.tsx

# Legacy Auth (2)
client/pages/Login.tsx
client/pages/Signup.tsx

# Stubs (3)
client/pages/Assets.tsx
client/pages/Content.tsx
client/pages/Media.tsx

# Dashboard Dupes (2)
client/pages/NewDashboard.tsx
client/pages/ContentDashboard.tsx

# Analytics Dupe (1)
client/pages/AnalyticsPortal.tsx

# Media Manager Dupes (2)
client/pages/MediaManager.tsx
client/pages/MediaManagerV2.tsx

Total: 23 files (3,188 lines)
```

---

## Next Steps

1. **Review this document** and approve Phase 1 deletions
2. **Delete the 23 files** listed above
3. **Fix Library import naming** (change to match component name)
4. **Test the build** to ensure no import errors
5. **Commit changes** to git
6. **Then decide on remaining pages** in Phase 2-4

