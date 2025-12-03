# POSTD First Impression Test Checklist

**Date**: 2025-01-20  
**Purpose**: Comprehensive end-to-end testing to ensure POSTD feels polished, real, and trustworthy — not like a demo or mock application.

---

## ✅ Critical Fixes Completed

### 1. Analytics Page
- **Fixed**: Removed hardcoded "Weekly Summary" metrics (382K, 20.5K, 5.4%, 1,847)
- **Fixed**: Removed hardcoded "Top Opportunities" section with generic recommendations
- **Status**: Now shows "Coming soon" messages when data is not available

### 2. Queue Page
- **Fixed**: Removed hardcoded `allPosts` array with 10 mock posts
- **Fixed**: Now fetches real posts from `/api/content-items` endpoint
- **Status**: Shows loading/error/empty states instead of mock data

### 3. Previously Fixed (from regression report)
- ✅ Billing Page - Fetches from `/api/billing/status`
- ✅ Reviews Page - Fetches real auto-reply settings and brand guide
- ✅ Reporting Page - Fetches from `/api/reports`
- ✅ Events Page - Fetches from `/api/events`
- ✅ Analytics Insights - Fetches from `/api/analytics/insights`
- ✅ Performance Tracking - Removed mock metrics generation

---

## 🧪 Test Checklist

### 1️⃣ Signup → Login → Onboarding

**Goal**: First impression must feel polished, real, and trustworthy.

#### Steps:
- [ ] Sign up or log in as a new agency/brand user
- [ ] Start the guided onboarding flow
- [ ] Enter brand details, upload a logo, enter website URL
- [ ] Run the website scraper
- [ ] Review the extracted Brand Guide summary

#### What SHOULD happen:
- [ ] Smooth signup — no broken redirects
- [ ] Scraper pulls real brand colors, logos, images, text
- [ ] Brand Guide feels aligned, not generic
- [ ] No lorem ipsum, no demo data, no placeholders
- [ ] Voice/Tone sliders update summaries dynamically
- [ ] You feel like: "Wow, this gets my brand."

#### Watch for:
- [ ] Buttons not advancing
- [ ] Missing logos
- [ ] Incorrect colors
- [ ] Text from random pages
- [ ] Any mock or template language
- [ ] Long load times (>3 seconds)

**Files to Check**:
- `client/pages/onboarding/Screen3AiScrape.tsx` - Uses real scraper
- `server/routes/crawler.ts` - Real website crawling
- `client/pages/onboarding/Screen5BrandSummaryReview.tsx` - Real brand data

---

### 2️⃣ Dashboard Landing

**Goal**: User should feel "okay, everything I need is here."

#### Steps:
- [ ] Land on the post-onboarding dashboard
- [ ] Click through sidebar items (Library, Calendar, Queue, Approvals, Analytics, Billing, etc.)

#### What SHOULD happen:
- [ ] Dashboard loads real brand info
- [ ] Quick stats or "empty but real" states load (NOT fake metrics)
- [ ] No Unsplash placeholders
- [ ] No mock posts or demo graphs

#### Watch for:
- [ ] Analytics sections accidentally still showing samples
- [ ] Charts using random dummy values
- [ ] Panels saying "mock data" or showing generic examples
- [ ] Performance issues

**Files to Check**:
- `client/app/(postd)/dashboard/page.tsx` - Uses `useDashboardData` hook
- `client/components/postd/dashboard/hooks/useDashboardData.ts` - Fetches real data

---

### 3️⃣ Library → Upload Assets → See Media

**Goal**: The Library must feel REAL.

#### Steps:
- [ ] Upload 3–6 random images
- [ ] Refresh the page
- [ ] Click each image
- [ ] Try filters, sorting, tags
- [ ] Use the ImageSelectorModal from Studio or posts

#### What SHOULD happen:
- [ ] Images persist in Supabase
- [ ] Real thumbnails load instantly
- [ ] Tagging works or shows "no tags yet"
- [ ] Selector modal shows real assets only
- [ ] No Unsplash
- [ ] Upload zone shows real previews (URL.createObjectURL)

#### Watch for:
- [ ] Blurry thumbnails
- [ ] Duplicate uploads
- [ ] Non-deterministic ordering
- [ ] Any hard-coded demo assets
- [ ] Empty modal with mock images

**Files to Check**:
- `client/app/(postd)/library/page.tsx` - Fetches from `/api/media/list`
- `client/components/dashboard/ImageSelectorModal.tsx` - Fetches real assets
- `server/routes/media.ts` - Real media API

---

### 4️⃣ Content Creation (Studio)

**Goal**: This is where the "magic" happens for the user.

#### Steps:
- [ ] Open Studio
- [ ] Select a template
- [ ] Insert real brand data
- [ ] Insert media from Library
- [ ] Generate AI copy
- [ ] Save to Library
- [ ] Send to Queue

#### What SHOULD happen:
- [ ] Template auto-applies brand fonts/colors
- [ ] Library fetcher returns real images
- [ ] AI captions reflect the brand voice
- [ ] "Save" writes to media/content tables
- [ ] No demo templates or fake sample images

#### Watch for:
- [ ] Templates still referencing placeholder images
- [ ] AI falling back to generic tone
- [ ] Save-to-library showing demo assets
- [ ] Approval ❌ instead of scheduled ✔️

**Files to Check**:
- `client/app/(postd)/studio/page.tsx` - Uses real brand guide
- `client/components/media/MediaBrowser.tsx` - Fetches real assets
- `server/lib/image-sourcing.ts` - Prioritizes real brand assets

---

### 5️⃣ Queue → Schedule → Approvals

**Goal**: Operational test — everything must work.

#### Steps:
- [ ] Open Queue
- [ ] Check post thumbnails
- [ ] Edit scheduled time
- [ ] Submit for approval
- [ ] Approve from another user
- [ ] Confirm system updates automatically

#### What SHOULD happen:
- [ ] Real post thumbnails load (or neutral SVG)
- [ ] Editing schedule updates DB
- [ ] Approval dashboard shows real items
- [ ] No fallback to getMockApprovals()
- [ ] Approval changes reflect instantly

#### Watch for:
- [ ] Missing images
- [ ] Approval state not sticking
- [ ] Any fake post titles/descriptions

**Files to Check**:
- `client/app/(postd)/queue/page.tsx` - ✅ FIXED: Now fetches from API
- `client/app/(postd)/approvals/page.tsx` - Fetches from `/api/agents/review/queue`
- `client/components/collaboration/MultiClientApprovalDashboard.tsx` - Fetches from `/api/approvals/pending`

---

### 6️⃣ Analytics / Insights / Reporting

**Goal**: These pages must NEVER show fake data.

#### Steps:
- [ ] Open Analytics
- [ ] Open ROI Insights
- [ ] Open Reporting
- [ ] Trigger a report creation
- [ ] Try exporting/downloading

#### What SHOULD happen:
- [ ] Analytics shows real metrics OR "Coming Soon"
- [ ] ROI page shows "Coming Soon" (not mock ROI)
- [ ] Reports page loads real saved reports
- [ ] Charts don't contain sample or mock values
- [ ] No generic "video gets 3x engagement" fake insight

#### Watch for:
- [ ] Charts populating with hard-coded numbers
- [ ] AI Insight cards still showing emoji sample text
- [ ] Fake invoices or performance metrics

**Files to Check**:
- `client/app/(postd)/analytics/page.tsx` - ✅ FIXED: Removed hardcoded metrics
- `client/app/(postd)/insights-roi/page.tsx` - Shows "Coming soon"
- `client/app/(postd)/reporting/page.tsx` - ✅ FIXED: Fetches from API

---

### 7️⃣ Billing

**Goal**: This page must feel official and trustworthy.

#### Steps:
- [ ] Navigate to Billing
- [ ] View current plan
- [ ] View usage
- [ ] Confirm subscription status
- [ ] View invoices

#### What SHOULD happen:
- [ ] Pulls from `/api/billing/status`
- [ ] Real invoice list or empty state
- [ ] No fake "INV-2025-001" style data
- [ ] No mock credit card (4242)

#### Watch for:
- [ ] Placeholder data
- [ ] Incorrect dates
- [ ] Negative usage numbers
- [ ] Demo invoices

**Files to Check**:
- `client/app/(postd)/billing/page.tsx` - ✅ FIXED: Fetches from API

---

### 8️⃣ Brand Intelligence

**Goal**: This will impress users the most — so it must be clean.

#### Steps:
- [ ] Run Brand Intelligence
- [ ] Scan through strengths, weaknesses, opportunities
- [ ] Read the generated summaries
- [ ] Validate alignment with Brand Guide

#### What SHOULD happen:
- [ ] No hard-coded intelligence
- [ ] Base summaries come from your real Brand Guide
- [ ] AI sections marked as "coming soon" or real
- [ ] No references to sustainability/fashion brands unless it's real

#### Watch for:
- [ ] Old mock insights from the removed file
- [ ] Hard-coded USP examples
- [ ] Entire sections repeating sample text

**Files to Check**:
- `client/app/(postd)/brand-intelligence/page.tsx` - Uses `useBrandIntelligence` hook
- `client/hooks/useBrandIntelligence.ts` - Fetches from `/api/brand-intelligence/:brandId`
- `server/routes/brand-intelligence.ts` - Queries real database

---

### 9️⃣ General UX & Behavior

**Goal**: The subjective "feel" of the app.

#### What SHOULD feel true:
- [ ] Nothing feels "demo."
- [ ] Every screen feels like it's about your brand.
- [ ] No confusing states or glitchy transitions.
- [ ] The system feels consistent and intentionally designed.
- [ ] Dead-ends are replaced with "Coming soon" or productive instructions.

---

### 🔟 Final Human Sanity Pass

**Pretend you're a paying client seeing POSTD for the first week.**

#### Ask:
- [ ] ⭐️ Does the platform feel REAL?
- [ ] ⭐️ Does it feel TRUSTWORTHY?
- [ ] ⭐️ Does anything feel "sample," "demo," or "template-like"?
- [ ] ⭐️ Would you pay for it today?
- [ ] ⭐️ Does every screen tie back to your actual brand's content, assets, voice, and data?

**If anything fails that vibe check — we fix it.**

---

## 📋 Quick Reference: API Endpoints

| Feature | Endpoint | Status |
|---------|----------|--------|
| Billing | `/api/billing/status` | ✅ Real |
| Reviews | `/api/reviews/:brandId` | ✅ Real |
| Reporting | `/api/reports` | ✅ Real |
| Events | `/api/events` | ✅ Real |
| Analytics Insights | `/api/analytics/insights` | ✅ Real (or "Coming soon") |
| Library/Media | `/api/media/list` | ✅ Real |
| Queue/Content | `/api/content-items` | ✅ Real |
| Approvals | `/api/approvals/pending` | ✅ Real |
| Brand Intelligence | `/api/brand-intelligence/:brandId` | ✅ Real |
| Dashboard Data | `/api/dashboard` | ✅ Real |

---

## 🐛 Known Issues / Coming Soon

1. **Analytics Weekly Summary**: Shows "Coming soon" message (no real metrics API yet)
2. **Analytics Top Opportunities**: Shows "Coming soon" message (no real insights API yet)
3. **Queue API**: May return empty if `/api/content-items` endpoint not fully implemented
4. **ROI Insights**: Shows "Coming soon" UI (feature not yet implemented)

---

## ✅ Summary

**All critical mock data violations have been fixed:**
- ✅ Analytics page - No hardcoded metrics
- ✅ Queue page - No hardcoded posts
- ✅ Billing page - Real API calls
- ✅ Reviews page - Real API calls
- ✅ Reporting page - Real API calls
- ✅ Events page - Real API calls

**Production Status**: ✅ **READY FOR FIRST IMPRESSION TESTING**

The application now uses real data APIs or honest empty/error/coming soon states throughout. No production code paths use mock data.

---

**Report Generated**: 2025-01-20  
**Next Steps**: Run through the test checklist above and verify everything feels real and trustworthy.

