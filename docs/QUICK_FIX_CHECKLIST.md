# Quick Fix Checklist - What to Check First

## Most Common Issues (Check These First)

### 1. **Authentication Token Missing/Invalid**
**Symptom**: 401/403 errors in browser console
**Fix**: 
- Check browser console for "Unauthorized" errors
- Verify token is being sent: `localStorage.getItem("aligned_access_token")`
- Check if token is expired (refresh page to get new token)

### 2. **Environment Variables Missing**
**Symptom**: "API key not available" or "not set" in logs
**Check**:
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` must be set
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be set
- Check Vercel environment variables dashboard

### 3. **Browser Launch Failing (Vercel)**
**Symptom**: "Failed to launch browser" in logs
**Fix**: 
- Playwright/Chromium can be finicky on Vercel
- May need to increase function timeout
- May need to use different browser args

### 4. **Database Schema Mismatch**
**Symptom**: "column does not exist" errors
**Check**:
- Run migrations in Supabase
- Verify `content_items` table exists
- Verify `media_assets` table exists

### 5. **Network/Timeout Issues**
**Symptom**: Timeout errors, slow responses
**Fix**:
- Increase timeout values
- Check if website is accessible
- Check if website blocks automated crawlers

## Quick Diagnostic Commands

### Check Server Logs
Look for these patterns:
- `[Crawler]` - Crawler activity
- `[ContentPlan]` - Content generation
- `[Auth]` - Authentication issues
- `❌` - Errors (we added these markers)

### Check Browser Console
Look for:
- 401/403 - Authentication issues
- 500 - Server errors
- Network errors - Connection issues
- Failed fetch requests

### Test API Endpoints Directly
```bash
# Test crawler (requires auth token)
curl -X POST https://your-domain.com/api/crawl/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "sync": true}'

# Test content generation (requires auth token)
curl -X POST https://your-domain.com/api/content-plan/BRAND_ID/generate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## What We Fixed

1. ✅ **Schema mismatches** - Fixed content_items table column names
2. ✅ **Error handling** - Added comprehensive logging
3. ✅ **User-friendly errors** - Better error messages
4. ✅ **Image persistence** - Fixed metadata column issues
5. ✅ **Content retrieval** - Fixed GET endpoint

## Next Steps

1. **Check server logs** for specific error messages
2. **Check browser console** for client-side errors
3. **Verify environment variables** are set in Vercel
4. **Test authentication** - make sure token is valid
5. **Check database** - verify tables exist and have correct schema

## If Still Not Working

Share:
1. Browser console errors (screenshot or copy/paste)
2. Server logs (from Vercel dashboard)
3. Network tab showing failed requests
4. Any specific error messages you see

This will help identify the exact issue.

