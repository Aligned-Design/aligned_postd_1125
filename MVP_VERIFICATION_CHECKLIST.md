# MVP Verification Checklist

This document tracks verification and cleanup of MVP-critical files for POSTD's 5 core MVPs.

---

## 🔥 MVP #2: Brand Guide Builder + Brand Context

### Files Touched
- `client/contexts/BrandContext.tsx` - Core brand context provider
- `client/hooks/useBrandGuide.ts` - Brand guide data hook
- `client/app/(postd)/brand-guide/page.tsx` - Brand guide UI (already using logger)

### Expected Behavior (User POV)
- User logs in → sees their brands automatically loaded
- Brand switcher shows all available brands
- Selecting a brand persists across page refreshes
- Brand guide page loads the current brand's guide data
- Auto-selects first brand if none selected
- Handles missing brands gracefully (shows empty state)

### What I Will Verify/Fix

**BrandContext.tsx:**
- ✅ Data source: Fetches from `/api/brands` endpoint (backend API, not direct Supabase)
- ✅ Brand ID consistency: Uses proper UUIDs, handles workspace-level defaults
- ✅ Error handling: 401 errors clear invalid tokens, errors don't crash app
- ✅ Persistence: Saves selected brand to localStorage, loads on mount
- ✅ URL params: Supports `?brandId=` query param for deep linking
- ✅ Auto-selection: Auto-selects first brand when none selected

**Issues to check:**
- Dev brand creation is disabled in production (good)
- Token validation before API calls
- Graceful fallbacks when no brands exist

**Console statements to replace:**
- 12 console statements (warn/log/error) → Replace with logger utilities

---

## 🔥 MVP #3: AI Content Generator (Three-Agent System)

### Files Touched
- `client/components/postd/studio/DocAiPanel.tsx` - Copywriter agent UI
- `client/components/postd/studio/DesignAiPanel.tsx` - Design agent UI  
- `client/app/(postd)/content-generator/page.tsx` - Content generator page

### Expected Behavior (User POV)
- User opens Studio or Content Generator
- Can input topic, platform, format
- AI generates content variants with BFS scores
- User can select, edit, or regenerate variants
- Brand guide validation prevents generation without guide
- Errors show user-friendly messages

### What I Will Verify/Fix

**DocAiPanel.tsx:**
- ✅ Data source: Uses `useDocAgent` hook → calls `/api/agents/generate/doc`
- ✅ Brand ID: Auto-detects from workspace, uses workspace default if needed
- ✅ Brand guide check: Shows warning if no brand guide exists
- ✅ Error handling: Errors shown via toast, hook manages error state
- ✅ Validation: Required fields (topic, platform, contentType) validated
- Console statements: 1 console.error → Replace with logError

**DesignAiPanel.tsx:**
- ✅ Data source: Uses `useDesignAgent` hook → calls design agent API
- ✅ Brand ID: Auto-detects from workspace, uses workspace default if needed
- ✅ Brand guide check: Shows warning if no brand guide exists
- ✅ Format validation: Validates format enum matches backend expectations
- ✅ Platform normalization: Lowercases and trims platform value
- ✅ Error handling: Handles NO_BRAND_GUIDE and INVALID_BRAND error codes
- Console statements: 1 console.error → Replace with logError

**Content Generator Page:**
- ✅ Data source: Direct API call to `/api/agents/generate/doc`
- ⚠️ ISSUE: Does NOT use brand context or brand guide validation
- ⚠️ ISSUE: Missing brandId in API call payload
- Console statements: 1 console.log → Replace with logTelemetry
- **FIX NEEDED**: Add brand context integration

---

## 🔥 MVP #4: Creative Studio Canvas

### Files Touched
- ✅ `client/app/(postd)/studio/page.tsx` - Main studio page (already cleaned)
- `client/components/dashboard/CreativeStudioCanvas.tsx` - Canvas component (needs cleanup)

### Expected Behavior (User POV)

**Entry Paths into Canvas:**
1. **Quick Templates / AI flows** → Select a variant → Opens on Canvas
   - Template selection applies brand colors/fonts automatically
   - AI-generated content creates new design with brandId
   - Design is scoped to current brand

2. **Upload to Edit** → Upload image → Create design → Opens on Canvas
   - Uploaded image creates new design with brandId
   - Design is scoped to current brand

3. **Blank Canvas** → Choose size/preset → Opens on Canvas
   - Blank canvas creates new design with brandId
   - Design is scoped to current brand (or workspace default if no brand)

**On the Canvas, a user should be able to:**
- See a design that is correctly scoped to the selected **brand**
- Add/edit/move:
  - Text (with brand fonts/colors available)
  - Images (including uploaded or template images)
  - Colors/backgrounds (brand colors available)
- See brand-consistent styling where applicable (fonts/colors/brand kit)
- Save the design (autosave or explicit save)
- Return to the grid/list view without losing progress

**Brand & Data Rules:**
- Every design on the canvas must be associated with the current **brandId**
- A user should **never** see designs from another brand
- Loading states and error states must be handled gracefully
- Brand colors/fonts are auto-applied when available

### What I Will Verify/Fix

**CreativeStudioCanvas.tsx:**
- ✅ Data source: Receives design prop from parent (studio/page.tsx)
- ✅ Brand ID: Design.brandId is passed from parent, verified in studio/page.tsx
- ✅ Error handling: Drag-drop errors are handled gracefully
- ✅ Console statements: 1 console.error → Replace with logError

**studio/page.tsx (Already Verified):**
- ✅ Entry paths: All entry paths (templates, AI variants, uploads, blank canvas) attach brandId
- ✅ Brand ID propagation: `getValidBrandId()` and `requireBrandForAction()` ensure brandId is present
- ✅ Save operations: All save/schedule operations include brandId in API calls
- ✅ Autosave: Autosave includes brandId for updates
- ✅ Template adaptation: Templates are adapted to brand via `createTemplateDesign()`
- ✅ Console statements: Already cleaned (uses logger utilities)

**Issues to check:**
- Canvas component error handling for drag-drop
- BrandId consistency across all entry paths
- Cross-brand leakage prevention (designs filtered by brandId)

---

## 🔥 MVP #5: Queue + Approvals

### Files Touched (Already Cleaned)
- ✅ `client/app/(postd)/queue/page.tsx` - Queue view
- ✅ `client/app/(postd)/approvals/page.tsx` - Approvals page

---

## Manual QA Steps

### Brand Context & Guide
1. **Login & Brand Loading**
   - Login as user with multiple brands
   - Verify brands appear in switcher
   - Verify first brand auto-selected

2. **Brand Switching**
   - Switch brands via switcher
   - Refresh page → verify selected brand persists
   - Navigate with `?brandId=` URL param → verify brand changes

3. **Brand Guide**
   - Open brand guide page
   - Verify guide data loads for current brand
   - Edit guide → verify autosave works
   - Switch brand → verify guide updates

### AI Content Generator
1. **With Brand Guide**
   - Open Studio → DocAiPanel
   - Enter topic, select platform
   - Generate content → verify variants appear with BFS scores
   - Select variant → verify it works

2. **Without Brand Guide**
   - Create new brand without guide
   - Open DocAiPanel → verify warning shows
   - Click "Create Brand Guide" → verify navigation works

3. **Error Handling**
   - Disconnect network
   - Try to generate → verify error message shows
   - Verify retry button works

### Content Generator Page
1. **Basic Flow**
   - Navigate to `/content-generator`
   - Fill form and generate
   - **ISSUE TO CHECK**: Does it use current brand? (likely not)

---

## Summary of Issues Found & Fixed

### Critical Issues (All Fixed ✅)
- ✅ `client/app/(postd)/content-generator/page.tsx` - Missing brand context integration → **FIXED**
- ✅ `client/app/(postd)/content-generator/page.tsx` - Missing brandId in API calls → **FIXED**
- ✅ `client/app/(postd)/content-generator/page.tsx` - Wrong API payload format → **FIXED**

### Minor Issues (All Fixed ✅)
- ✅ Console statements replaced with logger utilities
- ✅ Error handling improved with better context

---

## Changes Made

### BrandContext.tsx ✅
- [x] Replace 12 console statements with logger utilities
  - 3 console.warn → logWarning
  - 3 console.log → logTelemetry  
  - 6 console.error → logError
- [x] Verify API endpoint usage
  - ✅ Uses `/api/brands` endpoint via `apiGet` from `@/lib/api`
  - ✅ Properly handles JWT authentication
- [x] Verify token validation
  - ✅ Checks for token before API calls
  - ✅ Handles 401 errors by clearing invalid tokens
- [x] Verify error handling
  - ✅ Errors don't crash app (fallback to empty array)
  - ✅ Error context preserved in logger calls

**Verified Flow:**
- ✅ Fetches brands on user login/change
- ✅ Auto-selects first brand if none selected
- ✅ Persists selected brand to localStorage
- ✅ Handles URL query param `?brandId=`
- ✅ Applies brand theme when brand changes
- ✅ Graceful fallback when no brands exist

### DocAiPanel.tsx ✅
- [x] Replace 1 console.error with logError
- [x] Verify brand ID detection
  - ✅ Auto-detects from workspace if no explicit brand
  - ✅ Uses workspace default as fallback
- [x] Verify brand guide validation
  - ✅ Shows warning UI if no brand guide exists
  - ✅ Links to brand guide creation page

**Verified Flow:**
- ✅ Uses `useDocAgent` hook for generation
- ✅ Validates required fields (topic, platform, contentType)
- ✅ Error handling via hook + toast notifications
- ✅ Shows BFS scores and compliance tags

### DesignAiPanel.tsx ✅
- [x] Replace 1 console.error with logError
- [x] Verify format validation
  - ✅ Validates format enum matches backend (`story`, `feed`, `reel`, etc.)
  - ✅ Shows error if invalid format
- [x] Verify platform normalization
  - ✅ Lowercases and trims platform value before sending

**Verified Flow:**
- ✅ Uses `useDesignAgent` hook for generation
- ✅ Validates required fields (campaignName, platform, format)
- ✅ Handles NO_BRAND_GUIDE and INVALID_BRAND error codes
- ✅ Shows brand guide warning if missing

### Content Generator Page ✅ (CRITICAL FIX)
- [x] Replace 1 console.log with logTelemetry
- [x] **FIX**: Add brand context integration
  - ✅ Now uses `useCurrentBrand()` hook
  - ✅ Auto-detects brand from workspace
  - ✅ Passes `brandId` to API (was missing before - CRITICAL BUG)
- [x] **FIX**: Add brand guide validation
  - ✅ Shows warning UI if no brand guide exists
  - ✅ Links to brand guide creation page
- [x] **FIX**: API payload format
  - ✅ Maps `format` → `contentType` (backend expects contentType)
  - ✅ Maps length to enum (`short`/`medium`/`long`)
  - ✅ Handles new API response format with variants array

**Issues Fixed:**
- ❌ **CRITICAL BUG**: Page was NOT sending brandId to API (would fail backend validation)
- ❌ **CRITICAL BUG**: No brand guide validation (would generate generic content)
- ❌ Missing error logging
- ❌ Wrong API payload format (format vs contentType)

**Verified Flow:**
- ✅ Validates brand guide exists before allowing generation
- ✅ Includes brandId in API request
- ✅ Handles both old and new API response formats
- ✅ Shows proper error messages via toast

---

### CreativeStudioCanvas.tsx ✅
- [x] Replace 1 console.error with logError
- [x] Verify data source
  - ✅ Receives design prop from parent (studio/page.tsx)
  - ✅ Design.brandId is passed from parent, verified in studio/page.tsx
- [x] Verify error handling
  - ✅ Drag-drop errors are handled gracefully (try-catch with logging)
  - ✅ Errors don't crash canvas

**Verified Flow:**
- ✅ Canvas renders design items correctly
- ✅ Drag-drop works for adding elements
- ✅ Error handling for invalid element props
- ✅ BrandId is present in design (verified in parent)

### studio/page.tsx ✅ (Already Cleaned - Verification Only)
- [x] Verify entry paths attach brandId
  - ✅ Blank canvas: `handleStartDesign()` → `createInitialDesign(format, brandId, "")`
  - ✅ Templates: `handleSelectTemplate()` → `createTemplateDesign(template, brandId, brand)`
  - ✅ AI variants: `handleUseDocVariant()` / `handleUseDesignVariant()` → `createInitialDesign(format, brandId, "")`
  - ✅ Upload: `handleUploadToEdit()` → creates design with brandId
- [x] Verify brandId propagation
  - ✅ `getValidBrandId()` gets brandId from context
  - ✅ `requireBrandForAction()` ensures brandId for persistent actions
  - ✅ All save/schedule operations include brandId in API calls
  - ✅ Autosave includes brandId for updates
- [x] Verify brand adaptation
  - ✅ Templates are adapted to brand via `createTemplateDesign()`
  - ✅ Brand colors/fonts are applied when available
  - ✅ Brand guide data is loaded via `useBrandGuide()` hook

**Verified Flow:**
- ✅ All entry paths (templates, AI variants, uploads, blank canvas) attach brandId
- ✅ Designs are scoped to current brand (no cross-brand leakage)
- ✅ Brand colors/fonts are auto-applied when available
- ✅ Save operations include brandId in API calls
- ✅ Autosave includes brandId for updates

