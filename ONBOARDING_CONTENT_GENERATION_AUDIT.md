# Onboarding & Content Generation Flow Audit

## Executive Summary

This audit covers the end-to-end onboarding and content generation flows, identifying failure modes and proposing improvements for robustness, graceful degradation, and better error handling.

## Flow 1: User Signup/Authentication

### Current Implementation

**API Endpoint**: `POST /api/auth/signup`  
**File**: `server/routes/auth.ts`

### Flow Steps

1. Validate input (email, password)
2. Check Supabase configuration
3. Create user in Supabase Auth (`supabase.auth.admin.createUser`)
4. Create user profile in `user_profiles` table
5. Get or create tenant/workspace
6. Generate JWT tokens
7. Return success response

### Failure Modes

**Known Issues:**
- ✅ **"User already registered"** errors return generic 400 with error message, but not logged at appropriate level
- ✅ Error handling is comprehensive but could distinguish between "user exists" (info) vs "other errors" (warning/error)

**Current Error Handling:**
- Missing fields → 400 with `MISSING_REQUIRED_FIELD`
- Password too short → 400 with `VALIDATION_ERROR`
- Supabase config missing → 500 with `INTERNAL_ERROR` (critical)
- User creation fails → 400 with `INVALID_CREDENTIALS` (warning)
- Tenant creation fails → 500 with `DATABASE_ERROR`

**Improvements Needed:**
1. Detect "user already exists" specifically and return a clearer message
2. Log expected errors (user exists) at info level, not error level
3. Ensure UI shows appropriate message for "already registered" case

---

## Flow 2: Brand Creation + Website Scrape

### Current Implementation

**API Endpoint**: `POST /api/crawl/start`  
**File**: `server/routes/crawler.ts`

### Flow Steps

1. Validate brand ID and URL
2. Acquire crawl lock
3. Launch browser and crawl website
4. Extract images, colors, typography
5. Generate AI brand kit summary
6. Persist scraped images to `media_assets`
7. Update brand with scraped data
8. Return success response

### Failure Modes

**Known Issues:**
- ✅ Crawl timeout → returns error, but UI shows generic timeout message
- ✅ Image persistence failures → logged but not surfaced clearly to user
- ✅ AI generation failures during scrape → handled with fallback to Claude

**Current Error Handling:**
- Invalid URL → 400
- Crawl timeout → 500 with timeout message
- Browser launch failure → 500
- Image persistence failure → logged but continues
- AI generation failure → fallback to Claude, then fails

**Improvements Needed:**
1. Better timeout handling with partial results
2. Clear distinction between partial vs total failure
3. Surface image persistence issues to user if critical

---

## Flow 3: Content Plan Generation

### Current Implementation

**API Endpoints:**
- `POST /api/onboarding/generate-week` (onboarding flow)
- `POST /api/content-plan/:brandId/generate` (standard flow)

**Files:**
- `server/routes/onboarding.ts`
- `server/routes/content-plan.ts`
- `server/lib/onboarding-content-generator.ts`
- `server/lib/content-planning-service.ts`

### Flow Steps

**Onboarding Flow (`/api/onboarding/generate-week`):**
1. Validate brandId, weeklyFocus, brandSnapshot
2. Call `generateWeeklyContentPackage()` from onboarding-content-generator
3. Generate 7 content items using AI (in parallel with staggered delays)
4. Persist to `content_packages` table
5. Return content package

**Standard Flow (`/api/content-plan/:brandId/generate`):**
1. Validate brandId
2. Verify brand access
3. Call `generateContentPlan()` from content-planning-service
4. Complete brand guide with Doc Agent
5. Get advisor recommendations
6. Plan content with Creative Agent
7. Store content items in `content_items` table
8. Update brand_kit with recommendations
9. Return content plan

### Failure Modes

**Known Issues:**

1. **AI Provider Failures:**
   - ✅ OpenAI quota exceeded → falls back to Claude (handled)
   - ✅ Model not found → error propagated (needs better handling)
   - ✅ Network timeouts → error propagated (needs retry)
   - ⚠️ **Both providers fail → throws error, no graceful fallback**

2. **Content Generation Failures:**
   - ⚠️ Individual item generation fails → returns placeholder (good fallback)
   - ⚠️ All items fail → throws error (needs default plan fallback)

3. **Persistence Failures:**
   - ⚠️ Database save fails → logged but continues (may cause "Content Not Found")
   - ⚠️ Transaction issues → partial persistence possible

4. **Content Quality Issues:**
   - ✅ Placeholder content detected and filtered
   - ✅ Invalid items filtered out

**Current Error Handling:**

**Onboarding Content Generator:**
- Individual item failure → returns placeholder content
- No error thrown → items array may contain placeholders

**Content Planning Service:**
- No content items → throws error
- All items invalid → throws error
- Database errors → logged but error thrown

**Improvements Needed:**

1. **AI Provider Failures:**
   - When both providers fail, generate deterministic default content plan
   - Log AI unavailability clearly
   - Return structured response indicating "AI unavailable" state

2. **Content Persistence:**
   - Ensure transactional consistency
   - If persistence fails, return content anyway but log clearly
   - Add retry logic for transient DB errors

3. **Graceful Degradation:**
   - Always return SOME content (even if defaults)
   - Clear messaging about what's AI-generated vs default
   - Frontend should handle empty/partial plans gracefully

---

## Flow 4: Content Plan Display

### Current Implementation

**Frontend Files:**
- `client/pages/onboarding/Screen7ContentGeneration.tsx` (generation UI)
- `client/pages/onboarding/Screen8CalendarPreview.tsx` (display UI)

**API Endpoint**: `GET /api/content-plan/:brandId`  
**File**: `server/routes/content-plan.ts`

### Flow Steps

1. Screen7 calls `/api/content-plan/:brandId/generate`
2. Shows loading animation while generating
3. Stores result in localStorage
4. Navigates to Screen8 (Calendar Preview)
5. Screen8 loads content from localStorage OR API
6. Displays content in calendar grid

### Failure Modes

**Known Issues:**

1. **"Content Not Found" Error:**
   - ⚠️ Appears when:
     - Content plan not persisted to database
     - Brand ID mismatch
     - localStorage cleared
     - API returns empty items array
   - ⚠️ No graceful fallback to empty state

2. **Timing Issues:**
   - ⚠️ Screen8 loads before Screen7 completes persistence
   - ⚠️ Race condition between generation and display

3. **API Failures:**
   - ⚠️ 5xx errors not handled gracefully
   - ⚠️ Network timeouts show generic error

**Current Error Handling:**

**Screen7:**
- API error → shows warning but continues to Screen8
- Stores error message but doesn't block progression

**Screen8:**
- Load error → shows "Content Not Found" banner
- No content → shows empty calendar (but confusing)

**Improvements Needed:**

1. **Better Empty State:**
   - Show "No content yet" with "Generate Content" button
   - Don't show scary "Content Not Found" error

2. **Retry Logic:**
   - If content not found, try API fetch
   - Poll for content if generation in progress

3. **Clear Messaging:**
   - Distinguish "generating" vs "failed" vs "empty"
   - Show actionable next steps

---

## Summary of Improvements Needed

### 1. Auth Signup

**Priority: Medium**
- Better handling of "user already registered" (info level, clear message)
- Distinguish expected vs unexpected errors

### 2. AI Provider Failures

**Priority: High**
- Graceful fallback when both providers fail
- Default/deterministic content plan generation
- Clear logging of AI availability

### 3. Content Persistence

**Priority: High**
- Ensure transactional consistency
- Retry logic for transient failures
- Always return content even if persistence fails (with clear indication)

### 4. Content Retrieval

**Priority: High**
- Fix "Content Not Found" when content exists
- Better empty state handling
- Retry/polling logic

### 5. Frontend Error Messages

**Priority: Medium**
- More actionable error messages
- Distinguish error types clearly
- Show loading states appropriately

---

## Testing Strategy

1. **Signup Flow:**
   - New user → should succeed
   - Existing user → should show clear "already registered" message
   - Invalid credentials → should show validation error

2. **Content Generation:**
   - Normal flow → should generate and persist
   - OpenAI failure → should fallback to Claude
   - Both AI providers fail → should return default plan
   - Database failure → should still return content

3. **Content Display:**
   - Normal flow → should display content
   - No content → should show empty state with action
   - Generation in progress → should poll/retry
   - API error → should show retry option

---

## Next Steps

1. ✅ Create audit document (this file)
2. ⏳ Fix auth signup error handling
3. ⏳ Implement AI provider graceful degradation
4. ⏳ Improve content persistence reliability
5. ⏳ Fix frontend "Content Not Found" handling
6. ⏳ Update error messages for clarity
7. ⏳ Add comprehensive logging/metrics
8. ⏳ Test end-to-end flows
9. ⏳ Document improvements

