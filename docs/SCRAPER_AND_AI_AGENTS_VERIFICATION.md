# Scraper & AI Agents Deployment Verification

## Overview
This document outlines how to verify that the website scraper and AI agents (Copywriter, Creative, Advisor) are properly deployed and working.

## ✅ What's Been Fixed

### 1. Week Preview Images
- **Issue**: Week preview was showing blurry/placeholder images instead of actual brand images
- **Fix**: 
  - Updated `server/lib/onboarding-content-generator.ts` to include `imageUrl` from `getPrioritizedImage()` (which prioritizes scraped images)
  - Updated `server/routes/onboarding.ts` to save and return `imageUrl` in content package
  - Updated `client/pages/onboarding/Screen8CalendarPreview.tsx` to display images in post cards
- **Result**: Week preview now shows actual scraped brand images or prioritized images from the brand's media library

### 2. Password Visibility Toggle
- **Issue**: No way to preview password during login
- **Fix**: Added eye icon toggle to `client/components/auth/LoginPage.tsx` using `Eye`/`EyeOff` icons from lucide-react
- **Result**: Users can now click the eye icon to show/hide password

## 🔍 Verification Steps

### 1. Website Scraper Verification

**Endpoint**: `POST /api/crawl/start`

**Test Request**:
```bash
curl -X POST http://localhost:8080/api/crawl/start \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "brand_id": "brand_test_123",
    "sync": true
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "brandKit": {
    "voice_summary": { ... },
    "colors": { ... },
    "images": [...],
    "logoUrl": "...",
    "headlines": [...],
    "source": "crawler"
  }
}
```

**Check**:
- ✅ Response includes `images` array with scraped images
- ✅ `logoUrl` is present if logo found
- ✅ `source` is `"crawler"` (not `"fallback"`)
- ✅ Images are persisted to `media_assets` table with `metadata->>'source' = 'scrape'`

**Vercel Logs** (Production):
Look for:
```
[Crawler] Scrape result: { workspaceId: ..., brandId: ..., pages: X, images: Y, persisted: Z, logoFound: true/false }
```

### 2. AI Agents Verification

#### A. Copywriter Agent (Doc Agent)

**Endpoint**: `POST /api/ai/doc`

**Test Request**:
```bash
curl -X POST http://localhost:8080/api/ai/doc \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "brandId": "brand_test_123",
    "platform": "instagram",
    "format": "feed",
    "request": {
      "topic": "Introducing our new product",
      "tone": "friendly"
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "variants": [
    {
      "id": "...",
      "content": "...",
      "brandFidelityScore": 0.85
    }
  ]
}
```

**Check**:
- ✅ Response includes `variants` array with generated content
- ✅ `brandFidelityScore` is ≥ 0.80
- ✅ Content matches brand tone/voice

#### B. Creative Agent (Design Agent)

**Endpoint**: `POST /api/ai/design`

**Test Request**:
```bash
curl -X POST http://localhost:8080/api/ai/design \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "brandId": "brand_test_123",
    "platform": "instagram",
    "format": "feed",
    "request": {
      "topic": "Product showcase",
      "visualStyle": "modern"
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "variants": [
    {
      "id": "...",
      "label": "Concept A",
      "type": "template",
      "format": "ig_post",
      "metadata": {
        "colorUsage": ["primary", "secondary"],
        "emotion": "energetic"
      }
    }
  ]
}
```

**Check**:
- ✅ Response includes `variants` with visual concepts
- ✅ `metadata` includes brand colors and design tokens
- ✅ `type` is one of: `"template"`, `"image"`, `"graphic"`, `"layout"`

#### C. Advisor Agent

**Endpoint**: `POST /api/ai/advisor`

**Test Request**:
```bash
curl -X POST http://localhost:8080/api/ai/advisor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "brandId": "brand_test_123",
    "request": {
      "type": "strategy",
      "context": "weekly_content_plan"
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "insights": {
    "recommendations": [...],
    "performanceNotes": [...],
    "strategyBrief": { ... }
  }
}
```

**Check**:
- ✅ Response includes `insights` with recommendations
- ✅ `strategyBrief` is present if collaboration context exists

### 3. Onboarding Content Generation

**Endpoint**: `POST /api/onboarding/generate-week`

**Test Request**:
```bash
curl -X POST http://localhost:8080/api/onboarding/generate-week \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "brand_test_123",
    "weeklyFocus": "brand_awareness",
    "brandSnapshot": {
      "colors": ["#4F46E5", "#818CF8"],
      "tone": ["Professional", "Friendly"],
      "images": ["https://example.com/image1.jpg"]
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "contentPackage": {
    "id": "...",
    "brandId": "brand_test_123",
    "items": [
      {
        "id": "...",
        "title": "...",
        "platform": "instagram",
        "imageUrl": "https://...",  // ✅ Should be present
        "content": "...",
        "scheduledDate": "...",
        "scheduledTime": "..."
      }
    ]
  }
}
```

**Check**:
- ✅ Response includes 7 content items (one per day)
- ✅ Each item has `imageUrl` from scraped/prioritized images
- ✅ Items are distributed across platforms (Instagram, Facebook, LinkedIn, etc.)
- ✅ Content matches brand tone and weekly focus

### 4. Week Preview Display

**Visual Check**:
1. Complete onboarding flow
2. Navigate to week preview screen (Screen 8)
3. Verify:
   - ✅ Post cards show actual images (not blurry placeholders)
   - ✅ Images are from scraped brand images or prioritized media
   - ✅ Images load correctly (no broken image icons)
   - ✅ Each post card displays platform, title, time, and image

**API Check**:
```bash
curl http://localhost:8080/api/onboarding/content-package/brand_test_123
```

**Expected Response**:
```json
{
  "success": true,
  "contentPackage": {
    "items": [
      {
        "imageUrl": "https://...",  // ✅ Should be present
        ...
      }
    ]
  }
}
```

## 🚨 Troubleshooting

### Scraper Not Working

**Symptoms**:
- `source: "fallback"` in response
- Empty `images` array
- No images persisted to `media_assets`

**Checks**:
1. Verify Playwright is installed: `npm list playwright`
2. Check Vercel logs for crawler errors
3. Verify `authenticateUser` middleware is applied to `/api/crawl` route (or route is explicitly public)
4. Check timeout settings (default: 25s)

> **Note:** The `optionalAuthForOnboarding` middleware was removed (2025-01-20). All authenticated routes now use `authenticateUser`.

**Fix**:
- Increase timeout in `server/routes/crawler.ts` if needed
- Verify Playwright browser is installed in Vercel environment
- Check network connectivity for crawler

### AI Agents Not Generating Content

**Symptoms**:
- Empty `variants` array
- `brandFidelityScore` is 0
- 500 errors from AI endpoints

**Checks**:
1. Verify `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set
2. Check AI provider is accessible
3. Verify brand profile exists in database
4. Check rate limits

**Fix**:
- Set correct API keys in environment variables
- Verify brand guide is saved and accessible
- Check AI provider status

### Images Not Showing in Week Preview

**Symptoms**:
- Post cards show no images
- Broken image icons
- `imageUrl` is `undefined` in API response

**Checks**:
1. Verify `imageUrl` is saved in `content_packages.copy.items[].imageUrl`
2. Check `getPrioritizedImage()` returns valid URLs
3. Verify scraped images are persisted to `media_assets`
4. Check CORS/access permissions for image URLs

**Fix**:
- Ensure `imageUrl` is included when saving content package
- Verify image URLs are accessible (not blocked by CORS)
- Check `getPrioritizedImage()` logic prioritizes scraped images

## 📊 Success Criteria

✅ **Scraper**: Successfully scrapes website, extracts images, persists to database
✅ **Copywriter**: Generates on-brand content with BFS ≥ 0.80
✅ **Creative**: Generates visual concepts with brand tokens
✅ **Advisor**: Provides strategic insights and recommendations
✅ **Week Preview**: Displays actual brand images (not placeholders)
✅ **Password Toggle**: Eye icon works to show/hide password

## 🔗 Related Files

- `server/routes/crawler.ts` - Website scraper endpoint
- `server/workers/brand-crawler.ts` - Crawler implementation
- `server/lib/onboarding-content-generator.ts` - Content generation logic
- `server/routes/onboarding.ts` - Onboarding API routes
- `client/pages/onboarding/Screen8CalendarPreview.tsx` - Week preview UI
- `client/components/auth/LoginPage.tsx` - Login with password toggle
- `server/lib/image-sourcing.ts` - Image prioritization logic
- `server/lib/scraped-images-service.ts` - Scraped image persistence

