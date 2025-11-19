# Product Flows – E2E Checklist

**Date:** 2025-01-XX  
**Status:** Code Review (Not Live Tested)  
**Reviewer:** AI Code Analysis

---

## A. Onboarding → Brand Guide → AI Plan

### ✅ **Complete Onboarding Flow**

**Files Reviewed:**
- `client/pages/onboarding/Screen1SignUp.tsx`
- `client/pages/onboarding/Screen2BusinessEssentials.tsx`
- `client/pages/onboarding/Screen3AiScrape.tsx`
- `client/pages/onboarding/Screen5BrandSummaryReview.tsx`
- `client/pages/onboarding/Screen7ContentGeneration.tsx`
- `client/pages/onboarding/Screen8CalendarPreview.tsx`

**Findings:**

✅ **Flow Completeness:**
- All 10 screens implemented (Screen1-10)
- Progress tracking via `onboardingStep` in AuthContext
- Navigation between screens works

⚠️ **Potential Issues:**

1. **Console Errors:**
   - Multiple `console.log/warn/error` statements in `Screen3AiScrape.tsx` (lines 63-300)
   - Should be removed or gated behind `NODE_ENV !== 'production'`
   - **Fix:** Add environment check or remove debug logs

2. **Error Handling:**
   - `Screen3AiScrape.tsx` has good error categorization (timeout, browser, network, auth)
   - But errors might not be user-friendly enough
   - **Fix:** Verify error messages are clear

3. **Brand ID Validation:**
   - `Screen5BrandSummaryReview.tsx` validates UUID format (line 55-61)
   - Falls back gracefully if invalid
   - ✅ Good

### ✅ **Brand Guide Display**

**Files Reviewed:**
- `client/app/(postd)/brand-guide/page.tsx`
- `server/routes/brand-guide.ts`
- `client/components/dashboard/BrandDashboard.tsx`

**Findings:**

✅ **Identity / Voice / Audience:**
- `BrandDashboard` component displays identity section
- `VoiceToneEditor` component for voice editing
- `PersonasEditor` for audience personas
- Data mapped from `brand_kit` JSONB field

⚠️ **Potential Issues:**

1. **Visual Identity Colors:**
   - Colors extracted from `visual_summary.allColors` or `brand_kit.colors`
   - **Verify:** Colors match selected theme/tokens
   - **Fix Needed:** Check if `tokens.colors` are used consistently

2. **AI Brand Summary:**
   - Fetched from `brandGuide.purpose` or `brandGuide.longFormSummary` (Screen5BrandSummaryReview.tsx:82-99)
   - Validates length > 10 and not "0"
   - **Verify:** Shows 8-10 paragraph style (currently shows single string)
   - **Fix Needed:** Format long-form summary with paragraph breaks

3. **Images Display:**
   - `Screen5BrandSummaryReview.tsx` separates logos from other images (lines 28-29)
   - Fetches from `brandGuide.approvedAssets.uploadedPhotos` (line 68-100)
   - **Verify:** Images actually display (check image URLs are valid)

### ✅ **7-30 Day Content Plan**

**Files Reviewed:**
- `client/pages/onboarding/Screen8CalendarPreview.tsx`
- `server/lib/content-planning-service.ts`
- `server/routes/content-plan.ts`

**Findings:**

✅ **Content Generation:**
- `Screen7ContentGeneration.tsx` calls `/api/content-plan/${brandId}/generate`
- `Screen8CalendarPreview.tsx` loads from `/api/content-plan/${brandId}`
- Filters out placeholder content (line 362: `isRealContent` helper)

⚠️ **Potential Issues:**

1. **Content Quality:**
   - `isRealContent` checks for minimum length and non-placeholder text
   - **Verify:** Titles/descriptions look sane (not "Test Content" or "Lorem ipsum")
   - **Fix Needed:** Add more robust validation

2. **Error Handling:**
   - Shows "No content found" if generation fails
   - **Verify:** Error message is user-friendly
   - **Fix:** Add retry button

**Notes / Fixes Needed:**
- [ ] Remove console.log statements from production builds
- [ ] Format brand summary with paragraph breaks (8-10 paragraphs)
- [ ] Verify image URLs are valid and display correctly
- [ ] Add content quality validation (reject "Test Content", "Lorem ipsum")
- [ ] Add retry button for content generation failures

---

## B. Creative Studio

**Files Reviewed:**
- `client/app/(postd)/studio/page.tsx`
- `client/components/postd/studio/StudioEntryScreen.tsx`
- `client/components/postd/studio/DesignAiPanel.tsx`

### ✅ **"Start from AI" Flow**

**Findings:**

✅ **AI Generation:**
- `StudioEntryScreen.tsx` has "Start from AI" button (line 133-139)
- Calls `onStartFromAI()` callback
- `DesignAiPanel.tsx` handles AI generation

⚠️ **Potential Issues:**

1. **Variant Generation:**
   - **Verify:** Selecting a variant opens a real design on canvas
   - **Fix Needed:** Check if `handleSelectVariant` actually loads design to canvas

2. **Canvas Integration:**
   - **Verify:** Generated designs appear on canvas with editable elements
   - **Fix Needed:** Test design loading flow

### ✅ **"Blank Canvas" Flow**

**Findings:**

✅ **Blank Canvas:**
- `StudioEntryScreen.tsx` has "Blank" tab (line 110-115)
- Calls `onStartNew(format)` with format selection
- **Verify:** Opens clean brand-aware canvas

⚠️ **Potential Issues:**

1. **Brand Awareness:**
   - **Verify:** Canvas uses brand colors/fonts from brand guide
   - **Fix Needed:** Check if `useCurrentBrand()` hook provides brand data to canvas

2. **Save Functionality:**
   - `handleSaveDesign` in `studio/page.tsx` (line 1125+)
   - **Verify:** Can save content successfully
   - **Fix:** Test save flow

### ✅ **"Upload to Edit" Flow**

**Findings:**

✅ **Upload:**
- `StudioEntryScreen.tsx` has upload button (line 51: `onUploadToEdit`)
- **Verify:** Upload image appears on canvas
   - **Fix Needed:** Check if uploaded image is added to canvas state

⚠️ **Potential Issues:**

1. **Image Positioning:**
   - **Verify:** Can move/resize uploaded image
   - **Fix Needed:** Test drag/resize functionality

2. **Save After Upload:**
   - **Verify:** Can save edited uploaded image
   - **Fix:** Test save flow

### ⚠️ **Basic A11y**

**Findings:**

❌ **Tab Navigation:**
- **Verify:** Tab moves through AI panel fields logically
- **Fix Needed:** Add `tabIndex` and keyboard navigation handlers

❌ **Labels/ARIA:**
- **Verify:** Key fields have proper labels and ARIA attributes
- **Fix Needed:** Audit form fields for `aria-label`, `aria-describedby`

❌ **Enter/Cmd+Enter Submit:**
- **Verify:** Enter or Cmd/Ctrl+Enter submits when expected
- **Fix Needed:** Add keyboard event handlers for form submission

**Notes / Fixes Needed:**
- [ ] Test "Start from AI" → variant selection → canvas loading
- [ ] Verify blank canvas uses brand colors/fonts
- [ ] Test upload → canvas → move/resize → save flow
- [ ] Add keyboard navigation (Tab) to AI panel
- [ ] Add ARIA labels to all form fields
- [ ] Add Enter/Cmd+Enter submit handlers

---

## C. Calendar & Statuses

**Files Reviewed:**
- `client/app/(postd)/calendar/page.tsx`
- `client/components/dashboard/CalendarAccordion.tsx`
- `client/components/dashboard/MonthCalendarView.tsx`
- `client/pages/ContentQueue.tsx`

### ✅ **Calendar Display**

**Findings:**

✅ **Content Display:**
- `CalendarAccordion.tsx` shows content for selected brand (line 267-288)
- Filters by brand, platform, campaign
- **Verify:** Calendar shows content for the brand

⚠️ **Potential Issues:**

1. **Data Source:**
   - Uses mock data (`daySchedules` state, line 78-264)
   - **Fix Needed:** Connect to real API endpoint
   - **Fix:** Replace mock data with API call to `/api/content-plan/${brandId}`

### ✅ **Filters**

**Findings:**

✅ **Status Filters:**
- `ContentQueue.tsx` has status filter (line 134-168)
- Statuses: `draft`, `reviewing`, `scheduled`, `published`, `errored`
- **Verify:** Filters work correctly

⚠️ **Potential Issues:**

1. **Filter Implementation:**
   - `ContentQueue.tsx` filters by `post.status` (line 224)
   - **Verify:** Filter dropdown actually filters content
   - **Fix:** Test filter functionality

2. **URL State:**
   - `ContentQueue.tsx` reads `statusFilter` from URL (line 224)
   - **Verify:** URL updates when filter changes
   - **Fix:** Add URL state management

### ✅ **Empty State**

**Findings:**

✅ **Empty State:**
- `ContentQueue.tsx` shows empty state when no posts (line 410+)
- **Verify:** Empty state is clear and helpful
- **Fix:** Check empty state message clarity

### ✅ **Status Chips**

**Findings:**

✅ **Status Chips:**
- `ContentQueue.tsx` has `statusConfig` with colors/icons (line 134-168)
- **Verify:** Status chips look consistent and readable
- **Fix:** Test chip styling across all statuses

**Notes / Fixes Needed:**
- [ ] Replace mock data in `CalendarAccordion.tsx` with real API call
- [ ] Test filter functionality (draft/pending/scheduled/published)
- [ ] Verify empty state message is helpful
- [ ] Test status chip styling and readability

---

## D. Approvals & Client View

**Files Reviewed:**
- `client/app/(postd)/approvals/page.tsx`
- `server/routes/approvals.ts`
- `client/app/(postd)/client-portal/page.tsx`
- `server/lib/approvals-db-service.ts`

### ✅ **Create Content Requiring Approval**

**Findings:**

✅ **Approval Request:**
- `server/routes/approvals.ts` has `requestApproval` handler (line 377+)
- Creates approval request with `pending_review` status
- **Verify:** Content can be marked as requiring approval

⚠️ **Potential Issues:**

1. **Status Transition:**
   - **Verify:** Content status changes to `pending_review` or `awaiting_client`
   - **Fix:** Test status transition flow

### ✅ **Approve as Manager/Owner**

**Findings:**

✅ **Approval Handler:**
- `server/routes/approvals.ts` has `approveForClient` handler (line 560+)
- Updates status to `client_review` or `approved`
- **Verify:** Manager/owner can approve content

⚠️ **Potential Issues:**

1. **Role Check:**
   - **Verify:** Only manager/owner roles can approve
   - **Fix:** Test RBAC permissions

2. **Status Update:**
   - **Verify:** Approved content moves to `scheduled` or `published`
   - **Fix:** Test status transition after approval

### ⚠️ **Client Viewer Role**

**Findings:**

❌ **Client Viewer:**
- `client/app/(postd)/client-portal/page.tsx` has `ApprovalsSection` (line 502+)
- **Verify:** Client can view but not approve/edit
- **Fix Needed:** Test client viewer role permissions
- **Fix:** Add role check to prevent client from approving

**Notes / Fixes Needed:**
- [ ] Test content creation → approval request → status change
- [ ] Test manager/owner approval → status transition
- [ ] Test client viewer role (view only, no approve/edit)
- [ ] Add RBAC checks for approval actions

---

## E. Analytics (Basic Readiness)

**Files Reviewed:**
- `client/app/(postd)/analytics/page.tsx`
- `client/components/postd/analytics/hooks/useAnalytics.ts`

### ✅ **Loading State**

**Findings:**

✅ **Loading State:**
- `analytics/page.tsx` uses `useAnalytics` hook (line 41)
- `isLoadingAnalytics` state available
- **Verify:** Shows loading state (not blank flash)
- **Fix:** Check if `LoadingState` component is rendered

⚠️ **Potential Issues:**

1. **Loading Component:**
   - Imports `LoadingState` (line 16)
   - **Verify:** Actually renders loading state
   - **Fix:** Add conditional rendering: `{isLoadingAnalytics && <LoadingState />}`

### ✅ **Charts/Tables Render**

**Findings:**

✅ **Data Display:**
- `analytics/page.tsx` transforms API data to `PlatformMetrics` (line 44-87)
- **Verify:** Charts/tables render (even with test/mock data)
- **Fix:** Test with empty data, test data, real data

⚠️ **Potential Issues:**

1. **Empty Data:**
   - **Verify:** Handles empty data gracefully
   - **Fix:** Add empty state check

2. **Mock Data:**
   - Legacy mock data commented out (line 90+)
   - **Verify:** Uses real API data
   - **Fix:** Remove mock data fallback

### ✅ **Error Handling**

**Findings:**

✅ **Error State:**
- `analytics/page.tsx` uses `ErrorState` component (line 17)
- `isErrorAnalytics` and `analyticsError` available
- **Verify:** Shows friendly error + Retry button

⚠️ **Potential Issues:**

1. **Error Display:**
   - **Verify:** `ErrorState` is rendered on error
   - **Fix:** Add conditional: `{isErrorAnalytics && <ErrorState onRetry={refetchAnalytics} />}`

2. **Retry Functionality:**
   - `refetchAnalytics` available from hook
   - **Verify:** Retry button actually refetches data
   - **Fix:** Test retry flow

**Notes / Fixes Needed:**
- [ ] Add loading state rendering: `{isLoadingAnalytics && <LoadingState />}`
- [ ] Test charts/tables with empty, test, and real data
- [ ] Add error state rendering: `{isErrorAnalytics && <ErrorState onRetry={refetchAnalytics} />}`
- [ ] Test retry functionality
- [ ] Remove mock data fallback

---

## Summary

### ✅ **Working Well:**
- Onboarding flow structure is complete
- Brand Guide data mapping is correct
- Content generation API endpoints exist
- Calendar/Queue components are built
- Approvals workflow is implemented
- Analytics hook and data transformation exist

### ⚠️ **Needs Testing/Fixes:**
1. **Console Logs:** Remove or gate behind environment check
2. **Brand Summary Formatting:** Add paragraph breaks for 8-10 paragraph style
3. **Image Display:** Verify image URLs are valid
4. **Content Quality:** Add validation to reject placeholder content
5. **A11y:** Add keyboard navigation, ARIA labels, Enter submit
6. **Calendar Data:** Replace mock data with real API calls
7. **Client Viewer Role:** Test and enforce view-only permissions
8. **Loading/Error States:** Ensure components are actually rendered
9. **Retry Functionality:** Test error recovery flows

### 🔴 **Critical Before Launch:**
- [ ] Remove all `console.log` statements from production
- [ ] Connect calendar to real API (remove mock data)
- [ ] Test A11y (keyboard navigation, ARIA labels)
- [ ] Test client viewer role permissions
- [ ] Verify loading/error states render correctly
- [ ] Test all status transitions (draft → pending → approved → scheduled → published)

---

**Next Steps:**
1. Run live E2E tests for each flow
2. Fix issues identified above
3. Re-test after fixes
4. Document any additional findings

