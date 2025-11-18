# Testing Guide: Brand Story Fix

## Quick Test Checklist

### ✅ Pre-Test Setup
1. **Clear browser cache/localStorage** (important!)
   - Open DevTools (F12)
   - Application tab → Clear storage → Clear site data
   - Or use incognito/private window

2. **Check environment variables** (if running locally)
   - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` must be set
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be set

### 🧪 Test Steps

#### Step 1: Start Onboarding
1. Go to signup/onboarding page
2. Enter a **real website URL** (not a placeholder)
   - Example: `https://www.alignedbydesign.com`
   - Or any real business website
3. Complete steps 1-2 (signup, business essentials)

#### Step 2: Monitor Browser Console (F12)
**Keep DevTools Console open during the entire crawl process**

Look for these logs in order:

**A. When crawler starts:**
```
[Onboarding] Calling crawler API
```

**B. When crawler completes:**
```
[Onboarding] ✅ Crawler API success
```
- ✅ Check: `hasAboutBlurb: true`
- ✅ Check: `aboutBlurbLength: > 50` (should be substantial)
- ✅ Check: `aboutBlurbPreview: "..."` (should show actual brand story, not "0")

**C. If invalid:**
```
[Onboarding] ❌ INVALID about_blurb from crawler
```
- ❌ This means the crawler returned invalid data

**D. On Screen 5 (Brand Summary Review):**
```
[BrandSnapshot] Brand identity resolution
```
- ✅ Check: `hasBrandGuideStory: true` OR `hasSnapshotIdentity: true`
- ✅ Check: `brandGuideStoryPreview` or `snapshotIdentityValue` (should be actual text, not "0")

```
[BrandSnapshot] Final brand identity
```
- ✅ Check: `finalIdentity` (should be actual brand story)
- ✅ Check: `isFallback: false` (if true, fallback was used)

#### Step 3: Check UI (Screen 5)
**On the "Here's your brand profile" screen:**

1. **Brand Story Section:**
   - ✅ Should show actual brand story (1-2 sentences)
   - ❌ Should NOT show "0" or "Aligned By Design 0"
   - ❌ Should NOT show placeholder text

2. **Logos Section:**
   - ✅ Should show logo images if found
   - ✅ Or show "No logos found" if none detected

3. **Brand Images Section:**
   - ✅ Should show brand images if found
   - ✅ Or show "No images found" if none detected

#### Step 4: Check Database (Optional - Advanced)
**In Supabase Dashboard:**

1. Go to Table Editor → `brands` table
2. Find your brand (by `id` or `name`)
3. Check `brand_kit` JSONB column:
   ```json
   {
     "about_blurb": "Actual brand story here...",
     "purpose": "Actual brand story here...",
     "longFormSummary": "Longer brand story..."
   }
   ```
   - ✅ `about_blurb` should exist and be > 50 characters
   - ✅ `purpose` should match `about_blurb`
   - ❌ Should NOT be "0" or empty

4. Check `voice_summary` JSONB:
   - Should have `tone`, `style`, `audience` fields

5. Check `visual_summary` JSONB:
   - Should have `colors` array

### 🔍 Debugging Steps

#### If Brand Story Shows "0" or Empty:

**1. Check Server Logs:**
Look for:
```
[Crawler] ✅ AI-generated brand kit received
```
- ✅ Should show `hasAboutBlurb: true`
- ✅ Should show `aboutBlurbPreview` with actual text

If you see:
```
[Crawler] ❌ AI brand kit generation failed
```
- ❌ AI generation failed (check API keys)

**2. Check Database Save:**
Look for:
```
[Crawler] ✅ BrandKit saved directly to database
```
- ✅ Confirms database save succeeded

If you see:
```
[Crawler] ❌ Failed to save brandKit to database
```
- ❌ Database save failed (check error message)

**3. Check Client Save:**
In browser console, look for:
```
[Onboarding] ✅ Brand Guide saved for brand: [brandId]
```
- ✅ Confirms client-side save succeeded

#### If Images Not Showing:

**1. Check Image Persistence:**
Look for:
```
[Crawler] Scrape complete
```
- ✅ Check: `imagesFound: > 0`
- ✅ Check: `imagesPersisted: > 0`
- ✅ Check: `logoFound: true` (if logo exists)

**2. Check Image Retrieval:**
On Screen 5, look for:
```
[BrandSnapshot] Fetching brand guide for images
[BrandSnapshot] Brand guide response
```
- ✅ Check: `uploadedPhotosCount: > 0`
- ✅ Check: `hasApprovedAssets: true`

**3. Check Database:**
In Supabase, check `media_assets` table:
- Filter by `brand_id = [your brand id]`
- Filter by `metadata->>'source' = 'scrape'`
- Should have rows with `path` containing image URLs

### 🐛 Common Issues & Solutions

#### Issue 1: "about_blurb is '0'"
**Cause:** AI generation returned "0" or validation failed
**Solution:** 
- Check API keys (OpenAI/Claude)
- Check server logs for AI errors
- Fallback should generate a basic story

#### Issue 2: "No brand story at all"
**Cause:** Brand story not being saved or retrieved
**Solution:**
- Check database save logs
- Check API response in browser console
- Verify `brandId` is a real UUID (not temporary)

#### Issue 3: "Images not showing"
**Cause:** Images not persisted or not retrieved
**Solution:**
- Check `imagesPersisted` count in logs
- Check `media_assets` table in database
- Verify `tenantId` was passed to crawler

#### Issue 4: "Fallback story showing"
**Cause:** AI generation failed or returned invalid data
**Solution:**
- Check API keys
- Check server logs for AI errors
- Verify website URL is accessible

### 📊 Expected Results

**✅ Success Indicators:**
- Brand story appears on Screen 5 (not "0", not empty)
- Brand story is > 50 characters
- Brand story is relevant to the website
- Logos appear if found
- Brand images appear if found
- Database contains `about_blurb` and `purpose`
- No errors in console

**❌ Failure Indicators:**
- Brand story shows "0"
- Brand story is empty
- Brand story is generic fallback
- Images don't appear
- Console errors about API or database
- Database `about_blurb` is "0" or empty

### 🎯 Quick Test Script

**Copy-paste this into browser console on Screen 5:**

```javascript
// Check brand snapshot
const brandSnapshot = JSON.parse(localStorage.getItem('brandSnapshot') || '{}');
console.log('Brand Snapshot:', {
  hasIdentity: !!brandSnapshot.extractedMetadata?.brandIdentity,
  identity: brandSnapshot.extractedMetadata?.brandIdentity,
  identityLength: brandSnapshot.extractedMetadata?.brandIdentity?.length,
});

// Check brand guide from API
const brandId = localStorage.getItem('aligned_brand_id');
if (brandId) {
  fetch(`/api/brand-guide/${brandId}`)
    .then(r => r.json())
    .then(data => {
      console.log('Brand Guide API:', {
        hasPurpose: !!data.brandGuide?.purpose,
        purpose: data.brandGuide?.purpose,
        purposeLength: data.brandGuide?.purpose?.length,
        hasAboutBlurb: !!data.brandGuide?.about_blurb,
        aboutBlurb: data.brandGuide?.about_blurb,
      });
    });
}
```

### 📝 Test Report Template

```
Test Date: ___________
Website URL: ___________
Brand ID: ___________

✅ Brand Story:
  - Appears on Screen 5: [Yes/No]
  - Length: [___] characters
  - Content: [Actual text or "0"/empty]
  - Is fallback: [Yes/No]

✅ Images:
  - Logos found: [Yes/No]
  - Brand images found: [Yes/No]
  - Images displayed: [Yes/No]

✅ Console Logs:
  - Crawler success: [Yes/No]
  - Has about_blurb: [Yes/No]
  - Database save: [Yes/No]
  - API retrieval: [Yes/No]

✅ Database:
  - about_blurb exists: [Yes/No]
  - purpose exists: [Yes/No]
  - Both match: [Yes/No]

Issues Found:
  - [List any issues]

Next Steps:
  - [What to fix]
```

### 🚀 Next Steps After Testing

1. **If everything works:**
   - ✅ Mark as complete
   - Document any edge cases found

2. **If issues found:**
   - Copy console logs
   - Copy database values
   - Note which step failed
   - Share logs for debugging

3. **If partial success:**
   - Note what works
   - Note what doesn't
   - Check logs for specific failure point

