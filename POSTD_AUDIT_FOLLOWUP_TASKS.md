# POSTD System Audit - Follow-Up Tasks

**Generated**: 2025-01-20  
**Status**: 🔄 IN PROGRESS

This document contains detailed follow-up tasks from the comprehensive system audit.

---

## Critical Priority Tasks (Must Fix Immediately)

### 1. Brand ID Consistency & Validation

**Issue**: Brand ID validation is inconsistent across routes. Some routes validate UUID format, others don't.

**Tasks**:
- [x] Create `validateBrandId` middleware (`server/middleware/validate-brand-id.ts`)
- [x] Apply `validateBrandId` middleware to `brand-guide.ts` routes (6 routes updated)
- [x] Apply `validateBrandId` middleware to `content-items.ts` routes
- [x] Apply `validateBrandIdFormat` to `creative-studio.ts` POST /save (allows temp IDs)
- [x] Apply `validateBrandIdFormat` to `crawler.ts` POST /start (allows temp IDs)
- [ ] Apply middleware to remaining routes (analytics, approvals, media, etc.)
- [ ] Verify all routes use UUID format for brand_id (not TEXT)
- [ ] Ensure brand_id reconciliation works correctly (temp → final UUID)

**Files Updated**:
- ✅ `server/routes/brand-guide.ts` - All 6 routes now use `validateBrandId`
- ✅ `server/routes/content-items.ts` - GET route uses `validateBrandId`
- ✅ `server/routes/creative-studio.ts` - POST /save uses `validateBrandIdFormat`, GET / uses `validateBrandId`
- ✅ `server/routes/crawler.ts` - POST /start uses `validateBrandIdFormat` (allows temp IDs)
- ✅ `server/routes/analytics-v2.ts` - All 4 routes use `validateBrandId`
- ✅ `server/routes/approvals-v2.ts` - GET routes use `validateBrandId`; routes with :approvalId keep assertBrandAccess (brandId from DB)
- ✅ `server/routes/media-v2.ts` - GET routes use `validateBrandId`; routes with :assetId keep assertBrandAccess (brandId from DB)
- ✅ `server/routes/brand-intelligence.ts` - Handler updated; middleware applied in `server/index.ts`
- ✅ `server/routes/brands.ts` - No routes with :brandId (no middleware needed)

**Files Still Needing Verification** (may not need updates):
- `server/routes/agents.ts` - Check if brandId is used
- `server/routes/doc-agent.ts` - Check if brandId is used
- `server/routes/design-agent.ts` - Check if brandId is used
- `server/routes/dashboard.ts` - Check if brandId is used
- `server/routes/calendar.ts` - Check if brandId is used
- `server/routes/publishing.ts` - Check if brandId is used
- Other routes - Verify on case-by-case basis

**Status**: ✅ **CORE ROUTES COMPLETE** - All critical brand-aware routes now use middleware

---

### 2. Environment Variables Verification

**Issue**: Need to verify all required environment variables are set in Vercel.

**Tasks**:
- [ ] Create comprehensive env var checklist
- [ ] Verify all Supabase env vars are set:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_URL` (server-side)
- [ ] Verify all AI provider keys are set:
  - `OPENAI_API_KEY` (optional)
  - `ANTHROPIC_API_KEY` (required)
  - `ANTHROPIC_MODEL` (optional)
- [ ] Verify all OAuth client IDs/secrets are set (if using OAuth)
- [ ] Verify all third-party API keys are set:
  - TikTok API keys
  - Pexels API key
  - Squarespace integration keys
- [ ] Create script to validate env vars from Vercel runtime

**Files**:
- `server/utils/validate-env.ts` - ✅ Exists, needs verification
- `VERCEL_ENV_CHECKLIST.md` - ✅ Exists, needs update

**Status**: ⏳ Needs verification

---

### 3. RLS Policies Verification

**Issue**: Need to verify all tables have RLS enabled and policies are correct.

**Tasks**:
- [ ] Verify RLS is enabled on all tables
- [ ] Verify RLS policies exist for all tables
- [ ] Verify RLS policies use `brand_id` UUID format (not TEXT)
- [ ] Test RLS policies with different user roles
- [ ] Verify brand isolation works correctly

**Files**:
- `supabase/migrations/001_bootstrap_schema.sql` - ✅ Has RLS policies
- `supabase/migrations/010_ensure_rls_policies_use_brand_id_uuid.sql` - ✅ Exists

**Status**: ⏳ Needs verification

---

### 4. Supabase Type Generation

**Issue**: Need to regenerate Supabase types from latest schema.

**Tasks**:
- [ ] Run Supabase type generation command
- [ ] Verify types match actual database schema
- [ ] Update any code that uses outdated types
- [ ] Commit updated types to repository

**Command**:
```bash
npx supabase gen types typescript --project-id <project-id> > shared/supabase-types.ts
```

**Status**: ⏳ Needs execution

---

## High Priority Tasks (Should Fix Soon)

### 5. Error Handling Standardization

**Issue**: Error handling is inconsistent across routes.

**Tasks**:
- [ ] Standardize error response format across all routes
- [ ] Ensure all routes use `AppError` class
- [ ] Add error boundaries to all route components
- [ ] Verify error logging is comprehensive

**Files**:
- `server/lib/error-middleware.ts` - ✅ Exists
- `server/lib/error-responses.ts` - ✅ Exists
- All route files - ⏳ Need standardization

**Status**: ⏳ Needs standardization

---

### 6. Brand Isolation Verification

**Issue**: Need to verify brand isolation works correctly.

**Tasks**:
- [ ] Test brand isolation with multiple brands
- [ ] Verify users can only access their own brands
- [ ] Verify RLS policies enforce brand isolation
- [ ] Test edge cases (brand switching, concurrent access)

**Status**: ⏳ Needs testing

---

### 7. Crawler Pipeline End-to-End Test

**Issue**: Need to verify crawler pipeline works end-to-end.

**Tasks**:
- [ ] Test URL crawling with real website
- [ ] Verify 10-15 images are extracted (when available)
- [ ] Verify 6 colors are extracted
- [ ] Verify logo detection works
- [ ] Verify hero text/headlines extraction works
- [ ] Verify brand guide generation works
- [ ] Verify brand_id consistency throughout pipeline
- [ ] Test with temporary brand_id (onboarding flow)
- [ ] Test brand_id reconciliation (temp → final UUID)

**Files**:
- `server/workers/brand-crawler.ts` - ✅ Exists
- `server/routes/crawler.ts` - ✅ Exists

**Status**: ⏳ Needs testing

---

### 8. Creative Studio Flows End-to-End Test

**Issue**: Need to verify all Creative Studio flows work correctly.

**Tasks**:
- [ ] Test template → AI → variant → canvas flow
- [ ] Test blank canvas → template grid → canvas flow
- [ ] Test upload → create design flow
- [ ] Verify template rendering works
- [ ] Verify variant generation works
- [ ] Verify design saving works
- [ ] Verify autosave works
- [ ] Verify preview rendering works
- [ ] Verify brand_id is set correctly in all flows

**Files**:
- `client/app/(postd)/studio/page.tsx` - ✅ Exists
- `client/components/postd/studio/DesignAiPanel.tsx` - ✅ Exists
- `server/routes/creative-studio.ts` - ✅ Exists

**Status**: ⏳ Needs testing

---

## Medium Priority Tasks (Nice to Fix)

### 9. Type Safety Improvements

**Issue**: Some code uses `any` types instead of strict TypeScript types.

**Tasks**:
- [ ] Replace `any` types with strict TypeScript types
- [ ] Enable strict TypeScript mode (if not already)
- [ ] Fix all TypeScript errors
- [ ] Add type definitions for all API responses

**Status**: ⏳ Needs implementation

---

### 10. Error Boundaries

**Issue**: Missing error boundaries in some route components.

**Tasks**:
- [ ] Add error boundaries to all route components
- [ ] Create reusable error boundary component
- [ ] Test error boundaries work correctly

**Status**: ⏳ Needs implementation

---

### 11. Loading States

**Issue**: Some components don't have loading states.

**Tasks**:
- [ ] Add loading states to all async components
- [ ] Create reusable loading component
- [ ] Test loading states work correctly

**Status**: ⏳ Needs implementation

---

### 12. Rate Limiting

**Issue**: Missing rate limiting on some public endpoints.

**Tasks**:
- [ ] Add rate limiting to public endpoints
- [ ] Configure rate limits appropriately
- [ ] Test rate limiting works correctly

**Status**: ⏳ Needs implementation

---

## Testing Tasks

### 13. Integration Tests

**Tasks**:
- [ ] Test brand guide pipeline end-to-end
- [ ] Test Creative Studio flows end-to-end
- [ ] Test crawler pipeline end-to-end
- [ ] Test brand isolation
- [ ] Test error handling
- [ ] Test authentication/authorization

**Status**: ⏳ Needs implementation

---

### 14. Smoke Tests

**Tasks**:
- [ ] Create smoke test for brand guide pipeline
- [ ] Create smoke test for Creative Studio
- [ ] Create smoke test for crawler
- [ ] Run smoke tests in CI/CD

**Status**: ⏳ Needs implementation

---

## Documentation Tasks

### 15. API Documentation

**Tasks**:
- [ ] Document all API endpoints
- [ ] Document request/response formats
- [ ] Document error codes
- [ ] Create API reference documentation

**Status**: ⏳ Needs implementation

---

### 16. Architecture Documentation

**Tasks**:
- [ ] Update architecture documentation
- [ ] Document brand_id handling
- [ ] Document RLS policies
- [ ] Document environment variables

**Status**: ⏳ Needs update

---

## Summary

**Total Tasks**: 16 categories
**Critical**: 4 categories
**High Priority**: 4 categories
**Medium Priority**: 4 categories
**Testing**: 2 categories
**Documentation**: 2 categories

**Next Steps**:
1. Apply `validateBrandId` middleware to all routes
2. Verify environment variables in Vercel
3. Verify RLS policies
4. Regenerate Supabase types
5. Run end-to-end tests for crawler and Creative Studio

