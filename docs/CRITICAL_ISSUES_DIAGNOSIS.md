# Critical Issues Diagnosis

## Current Problems
1. **Scraper not pulling** - No content being extracted
2. **Content not loading** - 7-day preview shows "Content Not Found"

## Potential Root Causes

### 1. Authentication Issues
**Location**: `server/routes/crawler.ts` line 111
- Route requires `authenticateUser` middleware
- If token is invalid/missing, request will fail
- **Check**: Browser console for 401/403 errors

### 2. Browser Launch Failures (Vercel)
**Location**: `server/workers/brand-crawler.ts` line 26-58
- Playwright browser launch can fail on Vercel
- Chromium executable path issues
- Memory/timeout issues
- **Check**: Server logs for browser launch errors

### 3. Missing Environment Variables
**Required**:
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (for AI generation)
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (for database)
- **Check**: Server logs for "not available" or "not set" warnings

### 4. Database Schema Mismatches
**Issues**:
- `content_items` table might not exist
- Column names might differ (content_type vs type)
- **Check**: Database error logs

### 5. API Route Mounting
**Location**: `server/index.ts` line 244
- Route is mounted at `/api/crawl`
- Client calls `/api/crawl/start`
- **Check**: Route is properly mounted

## Quick Diagnostic Steps

1. **Check Browser Console**:
   - Look for 401/403 errors (authentication)
   - Look for 500 errors (server errors)
   - Check network tab for failed requests

2. **Check Server Logs**:
   - Look for `[Crawler]` messages
   - Look for `[ContentPlan]` messages
   - Look for authentication errors
   - Look for browser launch errors

3. **Check Environment Variables**:
   - Verify `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set
   - Verify Supabase credentials are set
   - Check Vercel environment variables

4. **Test API Endpoints Directly**:
   - `POST /api/crawl/start` with proper auth
   - `POST /api/content-plan/:brandId/generate` with proper auth
   - `GET /api/content-plan/:brandId` with proper auth

## Most Likely Issues

1. **Authentication failing** - Token not being sent or invalid
2. **Browser launch failing on Vercel** - Playwright/Chromium issues
3. **AI API keys missing** - Content generation failing silently
4. **Database connection issues** - Supabase credentials wrong

## Immediate Actions Needed

1. Check server logs for specific error messages
2. Verify environment variables are set in Vercel
3. Test authentication flow
4. Check if browser can launch (may need to use different approach on Vercel)

