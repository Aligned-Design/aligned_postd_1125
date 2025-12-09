# P0 #2: Brand Guide ↔ Supabase Sync — Complete

**Date**: January 2025  
**Status**: ✅ Complete

---

## ✅ What Was Implemented

### **1. Full CRUD Sync** ✅

**All Brand Guide fields now sync to/from Supabase:**

- ✅ **Summary**: purpose, mission, vision, summaryReviewedByAI
- ✅ **Voice & Tone**: tone, friendlinessLevel, formalityLevel, confidenceLevel, voiceDescription, aiToneSuggestions
- ✅ **Visual Identity**: logoUrl, fontFamily, fontSource, customFontUrl, primaryColors, secondaryColors, colorPalette, visualNotes
- ✅ **Personas**: Full array of persona objects
- ✅ **Goals**: Full array of goal objects
- ✅ **Guardrails**: Full array of guardrail objects
- ✅ **Keywords**: keywords, keyword_themes (from onboarding)
- ✅ **Metadata**: completionPercentage, setupMethod, version, updatedAt

**Storage Structure:**
- `brand_kit` (JSONB) — Main Brand Guide data
- `voice_summary` (JSONB) — Voice & tone specific data
- `visual_summary` (JSONB) — Visual identity data
- `tone_keywords` (TEXT[]) — Array of tone keywords (for backward compatibility)

---

### **2. Replaced localStorage** ✅

**Before:**
- Brand Guide saved to `localStorage.getItem("brandGuide")`
- No server sync
- Data lost on different device/browser

**After:**
- ✅ Brand Guide loads from Supabase on page load
- ✅ Auto-saves to Supabase (2 second debounce)
- ✅ Manual save via `saveBrandGuide()` function
- ✅ Partial updates via `updateBrandGuide()` function
- ✅ All localStorage dependencies removed from Brand Guide page
- ✅ Auto-save indicator shows "Saving..." / "Saved at [time]"

**Files Updated:**
- `client/app/(postd)/brand-guide/page.tsx` — Uses `useBrandGuide` hook (Supabase)
- `client/hooks/useBrandGuide.ts` — Already implemented Supabase sync
- Removed all `safeGetJSON("brandGuide")` and `safeSetJSON("brandGuide")` calls

---

### **3. Unified Brand Profile Source** ✅

**AI Agents:**
- ✅ `getBrandProfile()` reads from Supabase `brands` table
- ✅ Uses `brand_kit`, `voice_summary`, `visual_summary` fields
- ✅ Doc Agent uses synced data
- ✅ Design Agent uses synced data
- ✅ Advisor Agent uses synced data

**Onboarding:**
- ✅ Screen3AiScrape saves Brand Guide to Supabase after scraping
- ✅ Screen5BrandSummaryReview saves edits to Supabase via PATCH
- ✅ Uses same `brand_kit`, `voice_summary`, `visual_summary` structure
- ✅ Same `brandId` used throughout onboarding

**7-Day Content Engine:**
- ✅ Uses `getBrandProfile(brandId)` which reads from Supabase
- ✅ Automatically uses latest Brand Guide data
- ✅ No need to pass brandSnapshot separately (still accepts for backward compatibility)

**Brand Guide Page:**
- ✅ Loads from Supabase on mount
- ✅ Saves to Supabase on edit
- ✅ Real-time sync with AI agents

---

### **4. Conflict Handling** ✅

**Latest Edits Win:**
- ✅ Onboarding saves to Supabase immediately
- ✅ Brand Guide page saves to Supabase on edit
- ✅ Both use PATCH for partial updates (merges with existing data)
- ✅ Version number increments on each update
- ✅ `updated_at` timestamp tracks last modification

**AI Agents Always Use Newest:**
- ✅ `getBrandProfile()` always fetches from Supabase (no cache)
- ✅ AI agents get latest data on every call
- ✅ No stale data issues

**Last Updated Timestamp:**
- ✅ Displayed in Brand Guide header
- ✅ Shows "Last updated: [date/time]"
- ✅ Updates automatically after save

---

### **5. Error Handling** ✅

**Non-Blocking Notifications:**
- ✅ Save failures show toast: "⚠️ Save Failed"
- ✅ Load failures show error state with retry button
- ✅ Network issues handled gracefully
- ✅ Onboarding continues even if Brand Guide save fails
- ✅ Uses existing toast system (`useToast` hook)

**Error States:**
- ✅ Loading state: "Loading your brand guide..."
- ✅ Error state: "Failed to load Brand Guide" + Retry button
- ✅ Save error: Toast notification (non-blocking)

---

## 📁 Files Created/Modified

### **New Files:**
1. `server/lib/brand-guide-sync.ts` — Helper functions for onboarding sync

### **Modified Files:**
1. `server/routes/brand-guide.ts` — Added keywords support in PATCH handler
2. `client/pages/onboarding/Screen3AiScrape.tsx` — Saves Brand Guide to Supabase after scraping
3. `client/pages/onboarding/Screen5BrandSummaryReview.tsx` — Saves edits to Supabase
4. `server/lib/onboarding-content-generator.ts` — Uses `getBrandProfile()` (already synced)

### **Already Implemented (No Changes Needed):**
1. `client/hooks/useBrandGuide.ts` — Already uses Supabase
2. `client/app/(postd)/brand-guide/page.tsx` — Already uses `useBrandGuide` hook
3. `server/lib/brand-profile.ts` — Already reads from Supabase
4. `server/routes/brand-guide.ts` — Already has GET, PUT, PATCH endpoints

---

## Architecture (MVP View)

```mermaid
flowchart TD
    User[User] --> Onboarding[Onboarding Flow<br/>Screen 3: AI Scrape]
    Onboarding --> |POST /api/crawl/start| CrawlerAPI[Crawler API]
    CrawlerAPI --> Crawler[Brand Crawler<br/>Playwright]
    Crawler --> Extract[Extract Content<br/>Images, Colors, Text]
    Extract --> AI[AI Generation<br/>Voice, Tone, Keywords]
    Extract --> Persist[Persist Images<br/>persistScrapedImages]
    AI --> SaveBrandGuide[Save Brand Guide<br/>brands.brand_kit JSONB]
    Persist --> MediaAssets[(media_assets<br/>category: logos/images<br/>metadata.source: scrape)]
    SaveBrandGuide --> BrandsTable[(brands Table<br/>brand_kit JSONB<br/>voice_summary JSONB<br/>visual_summary JSONB)]
    
    User --> BrandGuidePage[Brand Guide Page<br/>/brand-guide]
    BrandGuidePage --> |GET /api/brand-guide/:id| BrandGuideAPI[Brand Guide API]
    BrandGuideAPI --> |Query WHERE<br/>metadata.source = 'scrape'| MediaAssets
    BrandGuideAPI --> |Query| BrandsTable
    BrandGuideAPI --> |Return Separated| BrandGuideData[Brand Guide Data<br/>scrapedLogos[] (max 2)<br/>scrapedBrandImages[] (max 15)]
    BrandGuideData --> BrandGuidePage
    
    User --> Edit[Edit Brand Guide]
    Edit --> |Auto-save 2s debounce| BrandGuideAPI
    BrandGuideAPI --> |PATCH| BrandsTable
    BrandGuideAPI --> |Create Version| VersionHistory[(brand_guide_versions<br/>version, changed_fields)]
    
    AIAgent[AI Agent<br/>Doc/Design/Advisor] --> |getBrandProfile| BrandsTable
    BrandsTable --> AIAgent
    
    style User fill:#e1f5ff
    style BrandsTable fill:#3ecf8e
    style MediaAssets fill:#3ecf8e
    style VersionHistory fill:#3ecf8e
    style AI fill:#ff6b6b
```

## 🔄 Data Flow

### **Onboarding → Brand Guide:**
```
Screen3AiScrape (scrape website)
  ↓
Save to Supabase (brand_kit, voice_summary, visual_summary)
  ↓
Screen5BrandSummaryReview (user edits)
  ↓
PATCH to Supabase (updates specific fields)
  ↓
Screen7ContentGeneration (7-day content)
  ↓
Uses getBrandProfile(brandId) → Reads from Supabase
```

### **Brand Guide Page → AI Agents:**
```
User edits Brand Guide
  ↓
Auto-save to Supabase (2 second debounce)
  ↓
AI Agent called (Doc/Design/Advisor)
  ↓
getBrandProfile(brandId) → Reads from Supabase
  ↓
Uses latest Brand Guide data
```

---

## ✅ Acceptance Criteria Met

- ✅ **Brand Guide data is saved to Supabase** — All fields sync via PUT/PATCH
- ✅ **Brand Guide data is loaded from Supabase** — GET endpoint + `useBrandGuide` hook
- ✅ **Used by all AI agents** — `getBrandProfile()` reads from Supabase
- ✅ **Used by onboarding** — Screen3AiScrape and Screen5BrandSummaryReview save to Supabase
- ✅ **Used by 7-day content engine** — Uses `getBrandProfile()` which reads from Supabase
- ✅ **Editable after onboarding** — Brand Guide page loads and saves to Supabase
- ✅ **No more localStorage dependencies** — Removed from Brand Guide page
- ✅ **No duplication of fields** — Single source of truth (Supabase brands table)

---

## 🎯 Next Steps

**P0 #2 Complete** → Proceed to **P0 #3: OAuth End-to-End Flow Testing**

---

**Document Status**: ✅ Complete — Brand Guide ↔ Supabase Sync Implemented

