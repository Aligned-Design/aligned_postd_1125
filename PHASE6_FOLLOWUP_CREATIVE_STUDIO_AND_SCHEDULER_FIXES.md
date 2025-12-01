# POSTD Phase 6 Follow-Up: Creative Studio & Scheduler Fixes

> **Status:** 🔄 In Progress – This follow-up work is currently in progress.  
> **Last Updated:** 2025-01-20

**Date**: 2025-01-20  
**Follow-up to**: `POSTD_CREATIVE_STUDIO_AND_SCHEDULER_AUDIT_REPORT.md`

---

## 📋 Context & Scope

This document tracks the implementation of fixes identified in the Creative Studio and Scheduler audit.

**Creative Studio** is the canvas-based design editor where users create visual content using templates, AI generation, or from scratch. It includes template selection, brand style application, element editing, and export functionality.

**Scheduler** manages the content publishing pipeline: draft → review → approve → schedule → publish. It includes calendar views, queue management, approvals workflow, and multi-platform publishing via social connectors.

---

## ✅ Checklist of Tasks

### Creative Studio

- [ ] **G1.1**: Implement crop tool for uploaded images in the Studio canvas
- [ ] **G1.2**: Ensure crop tool supports freeform and common aspect ratios (1:1, 9:16)
- [x] **G2.1**: Verify AI-generated text can be placed into the canvas from the AI modal ✅ **VERIFIED**
- [x] **G2.2**: Verify AI-generated images can be placed into the canvas (upload/selection → canvas item) ✅ **VERIFIED** (Design variant creates structure, not images - expected)

### Scheduler

- [x] **G3.1**: Confirm calendar drag/drop rescheduling works from UI to DB to queue ✅ **VERIFIED**
- [x] **G3.2**: Confirm that rescheduling updates both `scheduled_for` in the DB and the job in the publishing queue ✅ **FIXED**
- [x] **G4.1**: Review token refresh logic for Meta, LinkedIn, TikTok ✅ **AUDITED**
- [x] **G4.2**: Add/confirm logging and error handling around token refresh and publishing failures ✅ **VERIFIED** (Logging exists, documented enhancement opportunity)

---

## 📦 Batch Plan

### Batch G1 – Crop Tool Implementation

**Goal**: Implement and wire a proper crop tool on the canvas for uploaded images.

**Files to Touch**:
- `client/types/creativeStudio.ts` - Add crop properties to CanvasItem (image type)
- `client/components/dashboard/CreativeStudioCanvas.tsx` - Add crop UI and handlers
- `client/components/postd/studio/ContextualPropertiesPanel.tsx` - Add crop button/controls
- `shared/creative-studio.ts` - Update shared types if needed

**Expected Behavior Changes**:
- Image items can enter "crop mode" via properties panel
- Crop overlay appears on selected image
- User can adjust crop rectangle (drag handles, aspect ratio lock)
- Crop area stored in `CanvasItem.crop` property
- Export/download respects crop area

**Test/Validation Steps**:
1. Upload image to canvas
2. Select image → Click "Crop" in properties panel
3. Adjust crop rectangle
4. Confirm crop → Image renders with crop applied
5. Save to library → Verify crop persists
6. Export → Verify exported image is cropped

**Status**: ⏳ **PENDING**

---

### Batch G2 – AI → Canvas Flows (Text & Image)

**Goal**: Ensure AI-generated text and images can be placed into the canvas as expected.

**Files to Review**:
- `client/app/(postd)/studio/page.tsx` - `handleUseDocVariant`, `handleUseDesignVariant`
- `client/components/postd/studio/AiGenerationModal.tsx` - Modal integration
- `client/components/postd/studio/DocAiPanel.tsx` - Text generation UI
- `client/components/postd/studio/DesignAiPanel.tsx` - Design generation UI

**Expected Behavior**:
- ✅ Text generation → `handleUseDocVariant` creates/updates text element on canvas
- ⚠️ Image generation → `handleUseDesignVariant` creates design but may not place images

**Test/Validation Steps**:
1. Open AI modal → Generate text → Click "Use This"
2. Verify text appears on canvas as editable element
3. Open AI modal → Generate design concept → Click "Use Prompt"
4. Verify design is created (may need to verify image placement separately)

**Status**: ✅ **VERIFIED - WORKING**

**Findings**:
- ✅ `handleUseDocVariant` is implemented and creates text elements correctly (lines 1499-1594)
- ✅ `handleUseDesignVariant` creates design with visual elements (gradient background, text) - this is expected behavior
- ✅ Both handlers properly integrate with canvas and apply brand styles
- **Conclusion**: AI → Canvas flow is working as designed. Design variant creates design structure (not actual images), which is correct.

---

### Batch G3 – Calendar Drag/Drop Rescheduling

**Goal**: Make sure drag/drop in the calendar reschedules content end-to-end.

**Files to Review**:
- `client/components/dashboard/CalendarAccordion.tsx` - Calendar UI with drag/drop
- `client/hooks/useDragAndDrop.ts` - Drag/drop hook
- `client/hooks/useRescheduleContent.ts` - Reschedule API hook
- `server/routes/publishing.ts` - Reschedule endpoint
- `server/lib/publishing-queue.ts` - Queue job update logic

**Expected Behavior**:
- Drag event to new date/time → `useRescheduleContent.reschedule()` called
- API endpoint `/api/publishing/jobs/:jobId/schedule` updates DB
- Queue job `scheduledAt` updated
- Calendar refreshes to show new time

**Test/Validation Steps**:
1. Create scheduled post
2. Confirm it appears on calendar
3. Drag to new date/time
4. Verify DB record `scheduled_for` updated
5. Verify queue job `scheduledAt` updated
6. Verify calendar refreshes

**Status**: ✅ **FIXED**

**Findings**:
- ✅ Drag/drop UI is implemented (`useDragAndDrop` hook)
- ✅ Reschedule hook exists (`useRescheduleContent`) - calls `/api/publishing/jobs/:jobId/schedule` (PATCH)
- ✅ API endpoint exists: `updateScheduledTime` in `server/routes/publishing.ts` (line 753)
- ✅ Endpoint updates DB: `publishingDBService.updateScheduledTime()` updates `publishing_jobs` table
- ✅ **FIXED**: Added `updateScheduledTime()` method to `PublishingQueue` class
- ✅ **FIXED**: Reschedule endpoint now updates both DB and in-memory queue job
- **Result**: Calendar drag/drop rescheduling now works end-to-end (UI → API → DB → Queue)

---

### Batch G4 – Token Refresh Audit & Hardening

**Goal**: Confirm and harden token refresh behavior for Meta, LinkedIn, and TikTok.

**Files to Review**:
- `server/connectors/meta/implementation.ts` - Meta refresh logic
- `server/connectors/linkedin/implementation.ts` - LinkedIn refresh logic
- `server/connectors/tiktok/implementation.ts` - TikTok refresh logic
- `server/lib/token-vault.ts` - Token storage
- `server/lib/publishing-queue.ts` - Token usage in publishing

**Expected Behavior**:
- Expired token errors trigger refresh attempt
- Refresh failures logged with context (brand, platform, connector)
- Callers get meaningful error status
- Proactive refresh before expiration

**Test/Validation Steps**:
1. Review refresh logic for each platform
2. Verify error handling on refresh failure
3. Verify logging includes actionable context
4. Test expired token scenario (if possible)

**Status**: ✅ **AUDITED - DOCUMENTED**

**Findings**:
- ✅ Meta: `refreshToken()` implemented (60-day tokens, refresh at 53 days) - `server/connectors/meta/implementation.ts:141`
  - ✅ Error handling: Catches and logs errors with context (tenantId, platform)
  - ✅ Logging: Uses `logger.error()` with actionable context
- ✅ LinkedIn: `refreshToken()` implemented - `server/connectors/linkedin/implementation.ts:163`
  - ✅ Error handling: Catches and logs errors with context (tenantId, connectionId)
  - ✅ Logging: Uses `logger.error()` with actionable context
- ❌ TikTok: `refreshToken()` throws "Future work" error - `server/connectors/tiktok/index.ts:60`
  - **Status**: Documented as future work (TikTok tokens have 24h lifetime)
- ⚠️ **Enhancement Opportunity**: Publishing queue doesn't automatically refresh tokens on 401/403 errors
  - Current: Errors are logged, user must manually refresh
  - Future: Could add automatic refresh retry on expired token errors

---

## 📝 Implementation Notes

### Batch G1 Progress

**Current State**:
- Images can be uploaded and placed on canvas
- Images can be resized, moved, rotated
- No crop functionality exists

**Implementation Plan**:
1. Add `crop` property to `CanvasItem` type (image items only):
   ```typescript
   crop?: {
     x: number;
     y: number;
     width: number;
     height: number;
     aspectRatio?: "1:1" | "9:16" | "16:9" | "free";
   }
   ```

2. Add crop mode state to `CreativeStudioCanvas`:
   - `croppingItemId: string | null`
   - Crop overlay UI when in crop mode

3. Add crop controls to `ContextualPropertiesPanel`:
   - "Crop Image" button
   - Aspect ratio selector (1:1, 9:16, 16:9, Free)
   - Confirm/Cancel buttons

4. Render cropped image:
   - Use CSS `clip-path` or canvas rendering to show crop preview
   - Apply crop on export

**Limitations**:
- Initial implementation: CSS-based crop (visual only)
- Future: Server-side crop for actual image processing

---

### Batch G2 Progress

**Current State**:
- ✅ `handleUseDocVariant` works - creates/updates text elements
- ⚠️ `handleUseDesignVariant` creates design structure but doesn't place images

**Action Items**:
- [ ] Verify if Design variant should generate/place images or just create design structure
- [ ] If images needed, integrate with image generation/selection flow

---

### Batch G3 Progress

**Current State**:
- ✅ Drag/drop UI implemented
- ✅ Reschedule hook exists
- ⚠️ Need to verify API endpoint and queue update

**Action Items**:
- [ ] Verify `/api/publishing/jobs/:jobId/schedule` endpoint exists
- [ ] Verify endpoint updates both `scheduled_content` table and queue job
- [ ] Test end-to-end flow

---

### Batch G4 Progress

**Current State**:
- ✅ Meta: Refresh implemented
- ✅ LinkedIn: Refresh implemented
- ❌ TikTok: Refresh not implemented

**Action Items**:
- [ ] Review error handling in Meta/LinkedIn refresh
- [ ] Add logging improvements
- [ ] Document TikTok refresh as future work or implement if needed

---

## 🎯 Summary of Changes

### Batch G1 - Crop Tool Implementation
**Status**: ✅ **COMPLETED**

**Completed**:
- ✅ Added `crop` property to `CanvasItem` type in `shared/creative-studio.ts`
- ✅ Added crop props to `CreativeStudioCanvas` component interface
- ✅ Implemented crop mode state management in `studio/page.tsx`
- ✅ Added crop overlay UI to canvas (draggable rectangle with resize handles)
- ✅ Added crop controls to properties panel (aspect ratio selector: Free, 1:1, 9:16, 16:9)
- ✅ Applied crop when rendering images (CSS clip-path and object-position)
- ✅ Crop persists through undo/redo, save/reload
- ✅ Export/download respects crop area (CSS-based, visually consistent)

**Technical Notes**:
- Crop is stored as relative coordinates (0-1) in `CanvasItem.crop`
- Crop overlay supports drag and resize with aspect ratio constraints
- Image rendering uses CSS `clip-path` and `object-position` for visual crop
- Export currently uses CSS-based crop (visually consistent). For pixel-perfect export, server-side image processing would be required.

### Batch G2 - AI → Canvas Flows
**Status**: ✅ **VERIFIED - WORKING**

**Findings**:
- ✅ Text generation → Canvas: `handleUseDocVariant` works correctly
- ✅ Design generation → Canvas: `handleUseDesignVariant` works correctly (creates design structure)
- **Conclusion**: No fixes needed - flows are working as designed

### Batch G3 - Calendar Drag/Drop Rescheduling
**Status**: ✅ **FIXED**

**Changes Made**:
1. Added `updateScheduledTime()` method to `PublishingQueue` class (`server/lib/publishing-queue.ts`)
   - Updates in-memory job's `scheduledAt`
   - Handles status transitions (scheduled ↔ pending)
   - Respects future vs past scheduled times

2. Updated reschedule endpoint (`server/routes/publishing.ts`)
   - Now calls `publishingQueue.updateScheduledTime()` after DB update
   - Ensures both DB and queue are synchronized

**Result**: Calendar drag/drop rescheduling now works end-to-end

### Batch G4 - Token Refresh Audit & Hardening
**Status**: ✅ **COMPLETED**

**Findings**:
- ✅ Meta: Refresh implemented with proper error handling and logging
- ✅ LinkedIn: Refresh implemented with proper error handling and logging
- ❌ TikTok: Refresh not implemented (documented as future work with clear status)

**Enhancements Implemented**:
- ✅ **Auto-refresh on 401/403 for Meta**: Added `fetchWithAutoRefresh()` helper that automatically refreshes tokens on expired token errors during API calls
- ✅ **Auto-refresh on 401/403 for LinkedIn**: Added `fetchWithAutoRefresh()` helper for LinkedIn API calls
- ✅ **Enhanced TikTok documentation**: Added comprehensive JSDoc comments explaining current limitation, implementation requirements, and links to API docs

**Technical Details**:
- Auto-refresh wrapper intercepts 401/403 responses
- Attempts token refresh using stored refresh_token
- Retries original API call once with new token
- Prevents infinite loops with retry count
- Logs refresh attempts and failures with full context (tenantId, platform, connectionId, jobId)

**Conclusion**: Token refresh is properly implemented for Meta and LinkedIn with automatic retry on expired tokens. TikTok refresh is clearly documented as future work with implementation requirements.

---

## 🎯 Next Pass - Implementation Plan

**Date**: 2025-01-20  
**Focus**: Complete Batch G1 (Crop Tool) + Batch G4+ (Token Refresh Enhancements)

### Batch G1 – Finish Crop Tool Implementation

**Goal**: Complete the image crop tool in Creative Studio, from UI to export.

**Tasks**:
- [x] Add crop mode state to `studio/page.tsx` ✅
- [x] Implement crop overlay UI in `CreativeStudioCanvas.tsx` (draggable rectangle, resize handles) ✅
- [x] Wire crop controls in `ContextualPropertiesPanel.tsx` (enter crop mode, aspect ratio selector, confirm/cancel) ✅
- [x] Apply crop when rendering images (CSS clip-path or object-position) ✅
- [x] Update export/download to respect crop area ✅
- [x] Ensure crop persists through undo/redo, save/reload ✅

**Files to Modify**:
- `client/app/(postd)/studio/page.tsx` - Crop mode state and handlers
- `client/components/dashboard/CreativeStudioCanvas.tsx` - Crop overlay UI
- `client/components/postd/studio/ContextualPropertiesPanel.tsx` - Crop controls
- `client/app/(postd)/studio/page.tsx` - Export logic (handleDownload)

**Validation**:
- Upload image → crop → save → reload → export
- Change crop, undo/redo, then export again

### Batch G4+ – Token Refresh Enhancements

**Goal**: Harden token refresh and clearly document TikTok behavior.

**Tasks**:
- [x] Add automatic refresh on 401/403 for Meta connector (in `publishToPlatform` methods) ✅
- [x] Add automatic refresh on 401/403 for LinkedIn connector ✅
- [x] Document TikTok refresh status clearly (add comments, update docs) ✅
- [x] Ensure refresh failures are logged with full context (brandId, platform, jobId) ✅

**Files to Modify**:
- `server/connectors/meta/implementation.ts` - Add auto-refresh wrapper
- `server/connectors/linkedin/implementation.ts` - Add auto-refresh wrapper
- `server/lib/publishing-queue.ts` - Wrap publish calls with refresh retry
- `server/connectors/tiktok/implementation.ts` - Add clear documentation

**Validation**:
- Test expired token scenario (if possible)
- Verify logs contain actionable context
- Run typecheck, lint, tests

---

## 📌 Remaining TODOs

### High Priority
- [ ] **G1**: Complete crop tool implementation (UI, handlers, export support) - **IN PROGRESS**

### Medium Priority
- [ ] **G4 Enhancement**: Add automatic token refresh on 401/403 errors during publishing - **IN PROGRESS**
- [ ] **G4 Enhancement**: Document TikTok refresh clearly (implementation deferred)

### Low Priority / Future Enhancements
- [ ] Add server-side image cropping for actual image processing (vs CSS-only crop)
- [ ] Add more crop aspect ratios (4:5, 16:10, etc.)
- [ ] Add crop presets for common social media formats

---

## 🔍 Third Pass – QA, Hardening & Polish

**Date**: 2025-01-20  
**Focus**: Verify stability, harden edge cases, improve observability, and polish UX

### Batch H1 – Creative Studio QA & Hardening

**Goal**: Confirm the crop tool and core flows are robust, intuitive, and don't introduce regressions.

**Tasks**:
- [x] **UX & Edge Case Testing**
  - [x] Added bounds checking to prevent crop from going off-screen
  - [x] Crop rectangle constrained to image bounds (0-1 normalized coordinates)
  - [x] Minimum crop size enforced (10% of image) to prevent disappearing crop
  - [x] Mouse position normalized and clamped to valid range
  - [x] Confirm/Cancel buttons properly exit crop mode
  - [x] Aspect ratio switching maintains crop bounds
- [x] **State & History Behavior**
  - [x] Crop changes captured in history via `handleUpdateItem` (undo/redo supported)
  - [x] Designs without crop data load correctly (crop is optional property)
  - [x] Image rendering handles missing crop gracefully (conditional CSS application)
- [x] **Data Safety & Backwards Compatibility**
  - [x] Old designs (pre-crop) load without errors (crop is optional)
  - [x] Images without crop render normally (no CSS crop applied when crop is undefined)
  - [x] Added error handling for broken image URLs (onError fallback)
- [x] **Code Cleanup & Comments**
  - [x] Added comprehensive comments explaining coordinate system (normalized 0-1)
  - [x] Added comments for aspect ratio constraint logic
  - [x] Replaced console.warn/error with proper logging (logWarning, logError)
  - [x] Added comments for crop overlay rendering logic

**Status**: ✅ **COMPLETED**

**Changes Made**:
- Enhanced crop resize logic with bounds checking and minimum size constraints
- Added comprehensive comments explaining coordinate normalization and aspect ratio math
- Replaced console.warn/error calls with proper logging utilities
- Added error handling for broken image URLs
- Improved crop state initialization with validation

### Batch H2 – Scheduler & Token Refresh QA

**Goal**: Make sure calendar rescheduling and auto-refresh behavior are reliable and observable.

**Tasks**:
- [x] **Calendar Rescheduling QA**
  - [x] Verified drag/drop updates UI, DB, and queue (end-to-end flow confirmed)
  - [x] Enhanced `updateScheduledTime()` with proper state transition handling
  - [x] Added logging for state transitions (previous → new scheduled time and status)
  - [x] Improved error handling (queue update failures logged but don't fail request)
  - [x] Added check to prevent processing already-processing jobs
- [x] **Token Refresh Behavior**
  - [x] Verified auto-refresh only retries once per request (retryCount guard)
  - [x] Enhanced logging for refresh success (logs when token refreshed and retry initiated)
  - [x] Enhanced logging for refresh failures (logs when refresh succeeds but token not found)
  - [x] Error messages verified as non-leaky (no secrets in logs)
  - [x] TikTok documentation verified (comprehensive JSDoc with implementation requirements)
- [x] **Observability**
  - [x] Logs include platform, brand/tenant (tenantId), connectionId
  - [x] Rescheduling logs include jobId, brandId, platform, previous/new scheduled times
  - [x] Token refresh logs include tenantId, platform, connectionId
  - [x] Replaced console.warn with proper logger in rescheduling endpoint

**Status**: ✅ **COMPLETED**

**Changes Made**:
- Enhanced `updateScheduledTime()` with comprehensive state transition logic and logging
- Improved token refresh logging (success, failure, retry attempts)
- Replaced console.warn with proper logger in rescheduling endpoint
- Added observability for job state transitions

---

## 🔗 Related Documents

- `POSTD_CREATIVE_STUDIO_AND_SCHEDULER_AUDIT_REPORT.md` - Original audit
- `docs/PHASE6_IMPLEMENTATION.md` - Phase 6 implementation details

