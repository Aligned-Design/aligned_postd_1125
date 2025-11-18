# Onboarding Improvements Plan

## Overview
This plan addresses three key improvements to the onboarding flow:
1. **Smart Image Prioritization** - Prioritize images with faces, subject matter, and logos
2. **Crawler-Copywriter Collaboration** - Ensure they work together to create strong brand summaries
3. **Real Content in 7-Day Preview** - Ensure calendar preview shows actual agent-generated content

---

## 1. Smart Image Prioritization in Crawler

### Current State
- **File**: `server/workers/brand-crawler.ts`
- **Current Logic**: 
  - Extracts images with basic role detection (logo, hero, other)
  - Sorts by: logo → hero → size
  - No face detection
  - No page-type prioritization
  - Logo detection is basic (alt text, class names, header position)

### Proposed Changes

#### A. Enhanced Image Extraction with Face Detection
**Location**: `server/workers/brand-crawler.ts` - `extractImages()` function

**Changes**:
1. **Add face detection** using image analysis (can use a lightweight library or API)
2. **Prioritize pages** by URL patterns:
   - Priority 1: Main page (`/`, `/home`, `/index`)
   - Priority 2: Team/About pages (`/team`, `/about`, `/about-us`, `/our-team`)
   - Priority 3: Other pages
3. **Enhanced logo detection**:
   - Check filename for "logo" or brand name
   - Check URL path for "logo" or brand name
   - Check alt text for brand name
   - Check parent element classes/IDs for brand name
4. **Image categorization**:
   - `logo` - Brand logo (highest priority)
   - `team` - Images with faces (team photos, about page)
   - `subject` - Product/service images
   - `hero` - Large hero images
   - `other` - Everything else

#### B. Image Priority Sorting
**New Priority Order**:
1. **Logo** (if detected) - Always first
2. **Team images** (with faces, from team/about pages) - Second
3. **Subject matter** (product/service images) - Third
4. **Hero images** - Fourth
5. **Other images** - Last

#### C. Implementation Details

```typescript
interface CrawledImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  role: "logo" | "team" | "subject" | "hero" | "other";
  pageType?: "main" | "team" | "about" | "other";
  hasFaces?: boolean;
  filename?: string;
  priority?: number; // Calculated priority score
}
```

**New Functions Needed**:
- `detectFacesInImage(url: string): Promise<boolean>` - Face detection
- `categorizeImage(img: ImageElement, pageUrl: string, brandName: string): ImageCategory`
- `calculateImagePriority(img: CrawledImage): number` - Priority scoring

---

## 2. Crawler-Copywriter Collaboration for Brand Summary

### Current State
- **Crawler**: Extracts `about_blurb` from website content
- **Copywriter**: Uses brand guide data but doesn't actively generate summary
- **Gap**: No collaboration between them to create a strong summary

### Proposed Changes

#### A. Enhanced Brand Summary Generation
**Location**: `server/workers/brand-crawler.ts` and `server/lib/ai/docPrompt.ts`

**Strategy**:
1. **Crawler extracts raw data**:
   - Page content (H1, H2, H3, body text)
   - Meta descriptions
   - About page content
   - Team page content
   - Service/product descriptions

2. **Crawler creates initial summary** (if `about_blurb` is missing):
   - Combines key information from multiple pages
   - Extracts brand name, industry, services, values

3. **Copywriter refines summary**:
   - Takes crawler's raw data + initial summary
   - Uses AI to create compelling brand story
   - Ensures it's engaging and brand-appropriate
   - Saves to `brand_kit.about_blurb` and `brand_kit.longFormSummary`

#### B. New Function: `generateBrandSummaryWithAI()`
**Location**: `server/workers/brand-crawler.ts`

**Process**:
1. Collect all extracted text from crawler
2. Call Doc Agent with prompt: "Create a compelling 1-2 sentence brand story from this website data"
3. Save result to `brand_kit.about_blurb`
4. Also generate longer form summary (3-5 sentences) for `brand_kit.longFormSummary`

#### C. Integration Points
- **After crawler completes**: Call summary generation
- **Before saving brand_kit**: Ensure summary exists
- **In Screen5BrandSummaryReview**: Display AI-generated summary

---

## 3. Real Content in 7-Day Preview

### Current State
- **Screen8CalendarPreview**: Uses `generateSampleWeekContent()` as fallback
- **Screen7ContentGeneration**: Calls `/api/content-plan/${brandId}/generate` but may not save properly
- **Gap**: Calendar preview may show sample content instead of real agent-generated content

### Proposed Changes

#### A. Ensure Content is Generated and Saved
**Location**: `server/routes/content-plan.ts` and `server/lib/content-planning-service.ts`

**Changes**:
1. **Verify content generation**:
   - Ensure `generateContentPlan()` actually creates content items
   - Each item should have: title, content, platform, scheduledDate, scheduledTime
   - Content should be complete (not placeholders)

2. **Save to database**:
   - Save to `content_items` table with status `pending_review`
   - Save to `content_packages` table for onboarding
   - Ensure all items are linked to brand_id

3. **Return proper structure**:
   - API should return items in format expected by Screen8CalendarPreview
   - Include: id, title, content, platform, scheduledDate, scheduledTime, imageUrl

#### B. Update Screen8CalendarPreview
**Location**: `client/pages/onboarding/Screen8CalendarPreview.tsx`

**Changes**:
1. **Remove sample content fallback** (or make it last resort)
2. **Always try to load from API first**:
   - `/api/content-plan/${brandId}` (new API)
   - `/api/onboarding/content-package/${brandId}` (old API)
3. **Show loading state** while fetching
4. **Show error if no content** (don't silently fall back to samples)
5. **Ensure content matches what's in database**

#### C. Content Verification
**New Function**: `verifyContentGeneration(brandId: string)`

**Checks**:
- Content items exist in database
- Content has actual text (not placeholders)
- Content is properly scheduled
- Content matches what's shown in preview

---

## Implementation Priority

### Phase 1: Critical (Do First) ✅
1. **Fix 7-Day Preview to use real content**
   - ✅ Content IS being generated and saved (verified: `storeContentItems` is called)
   - ⚠️ Need to verify Screen8CalendarPreview loads correctly
   - ⚠️ Need to ensure content has real text (not placeholders)
   - Remove sample content fallback (or make it last resort with warning)

### Phase 2: High Priority
2. **Enhanced image prioritization**
   - Add page-type detection (main, team, about)
   - Improve logo detection (filename, URL, brand name)
   - Add face detection (or at least team page prioritization)
   - Categorize images: logo, team, subject, hero, other

### Phase 3: Enhancement
3. **Crawler-Copywriter collaboration**
   - Add AI summary generation after crawler (if about_blurb missing)
   - Ensure summary is always generated
   - Refine summary with Copywriter agent
   - Save to both `about_blurb` and `longFormSummary`

---

## Technical Details

### Image Prioritization Implementation

```typescript
// New image role types
type ImageRole = "logo" | "team" | "subject" | "hero" | "other";

// Page type detection
function detectPageType(url: string): "main" | "team" | "about" | "other" {
  const urlLower = url.toLowerCase();
  if (urlLower === "/" || urlLower.includes("/home") || urlLower.includes("/index")) {
    return "main";
  }
  if (urlLower.includes("/team") || urlLower.includes("/our-team")) {
    return "team";
  }
  if (urlLower.includes("/about")) {
    return "about";
  }
  return "other";
}

// Enhanced logo detection
function isLogo(img: ImageElement, brandName: string): boolean {
  const filename = extractFilename(img.url).toLowerCase();
  const brandNameLower = brandName.toLowerCase().replace(/\s+/g, "-");
  
  return (
    filename.includes("logo") ||
    filename.includes(brandNameLower) ||
    img.alt?.toLowerCase().includes("logo") ||
    img.alt?.toLowerCase().includes(brandName) ||
    // ... existing checks
  );
}

// Priority calculation
function calculateImagePriority(img: CrawledImage): number {
  let priority = 0;
  
  if (img.role === "logo") priority += 1000;
  if (img.role === "team") priority += 800;
  if (img.role === "subject") priority += 600;
  if (img.role === "hero") priority += 400;
  
  if (img.pageType === "main") priority += 100;
  if (img.pageType === "team" || img.pageType === "about") priority += 80;
  
  if (img.hasFaces) priority += 50;
  
  return priority;
}
```

### Brand Summary Generation

```typescript
async function generateBrandSummaryWithAI(
  crawlResults: CrawlResult[],
  brandName: string,
  industry: string
): Promise<string> {
  // Collect all text
  const allText = crawlResults
    .map(r => [r.h1, r.h2, r.h3, r.bodyText].flat().join(" "))
    .join(" ");
  
  // Call Doc Agent
  const prompt = `Create a compelling 1-2 sentence brand story for ${brandName} (${industry}) based on this website content:\n\n${allText.substring(0, 2000)}`;
  
  const summary = await generateWithAI(prompt, "doc", "openai");
  return summary.content;
}
```

### Content Verification

```typescript
async function verifyContentGeneration(brandId: string): Promise<boolean> {
  const { data: contentItems } = await supabase
    .from("content_items")
    .select("id, content, title")
    .eq("brand_id", brandId)
    .eq("status", "pending_review")
    .limit(10);
  
  if (!contentItems || contentItems.length === 0) {
    return false;
  }
  
  // Check if content is real (not placeholder)
  const hasRealContent = contentItems.some(item => 
    item.content && 
    item.content.length > 50 && 
    !item.content.includes("placeholder") &&
    !item.content.includes("sample")
  );
  
  return hasRealContent;
}
```

---

## Testing Checklist

### Image Prioritization
- [ ] Logo images are detected correctly
- [ ] Team/about page images are prioritized
- [ ] Images with faces are identified (if face detection implemented)
- [ ] Subject matter images are categorized correctly
- [ ] Priority sorting works as expected

### Brand Summary
- [ ] Summary is always generated (even if website has no about page)
- [ ] Summary is compelling and brand-appropriate
- [ ] Summary appears in Screen5BrandSummaryReview
- [ ] Summary is saved to brand_kit

### 7-Day Preview
- [ ] Calendar shows actual generated content (not samples)
- [ ] Content matches what's in database
- [ ] Content has real text (not placeholders)
- [ ] Content is properly scheduled
- [ ] Content appears in content queue after onboarding

---

## Files to Modify

### Image Prioritization
1. `server/workers/brand-crawler.ts`
   - Update `extractImages()` function
   - Add page type detection
   - Add enhanced logo detection
   - Add priority calculation
   - Update image sorting logic

### Brand Summary
1. `server/workers/brand-crawler.ts`
   - Add `generateBrandSummaryWithAI()` function
   - Call after crawler completes
2. `server/lib/ai/docPrompt.ts`
   - Add brand summary generation prompt
3. `client/pages/onboarding/Screen3AiScrape.tsx`
   - Ensure summary is used in brandSnapshot

### 7-Day Preview
1. `server/lib/content-planning-service.ts`
   - ✅ Content IS being saved (verified: `storeContentItems` called at line 110)
   - ⚠️ Need to verify content quality (not placeholders)
   - ⚠️ Need to ensure content has actual text
2. `server/routes/content-plan.ts`
   - ✅ Content is saved to database (verified)
   - ✅ GET endpoint returns proper format (verified)
   - ⚠️ Need to verify date range query works correctly
3. `client/pages/onboarding/Screen8CalendarPreview.tsx`
   - ⚠️ Currently has sample content fallback (line 134)
   - ⚠️ Should show error if no real content found
   - ⚠️ Should verify content is real (not placeholders)

---

## Success Criteria

1. ✅ **Images**: Logo is always first, team images prioritized, subject matter categorized
2. ✅ **Summary**: Brand story is always generated and compelling
3. ✅ **Preview**: Calendar shows real agent-generated content, matches database

---

## Next Steps

1. Review this plan
2. Start with Phase 1 (7-Day Preview)
3. Then Phase 2 (Image Prioritization)
4. Finally Phase 3 (Summary Collaboration)

