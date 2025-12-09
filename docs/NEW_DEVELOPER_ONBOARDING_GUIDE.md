# New Developer Onboarding Guide

**Welcome to POSTD!** This guide will walk you through understanding the system architecture and getting hands-on experience with the codebase.

**Time to complete:** 30-45 minutes  
**Prerequisites:** Node.js 18+, pnpm installed, Supabase account access

---

## STEP 1 — System Overview

### Open the High-Level Architecture Diagram

**File:** `docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md`

Start by reviewing the **High-Level System Diagram**. This shows the major components and how data flows through the system.

### Key Components (5-7 bullet summary):

1. **Frontend App (Next.js React)**
   - Client-side application with multiple entry points
   - Onboarding flow, Dashboard, Creative Studio, Content Queue

2. **Brand Crawler Path**
   - User enters website URL → `POST /api/crawl/start`
   - Playwright crawler extracts images, colors, typography
   - Images classified (logos vs brand images) → saved to `media_assets` table
   - AI generates voice/tone → saved to `brands.brand_kit` JSONB

3. **Brand Guide Path**
   - Brand Guide page loads → `GET /api/brand-guide/:brandId`
   - Queries `brands` table (brand_kit, voice_summary, visual_summary)
   - Queries `media_assets` table (scraped logos/images)
   - Auto-saves edits → `PATCH /api/brand-guide/:brandId`

4. **AI Agents Path**
   - Doc/Design/Advisor agents → `POST /api/agents/generate/*`
   - Load Brand Guide via `getBrandProfile()` → reads from `brands` table
   - Generate content via OpenAI/Claude
   - Save to `content_items` and `generation_logs` tables

5. **Scheduler / Publishing Path**
   - Content Queue → Approve content → `POST /api/approvals/:approvalId/approve`
   - Schedule post → `POST /api/publishing/:brandId/publish`
   - Creates job in `publishing_jobs` table
   - Publishing queue processes → publishes to social platforms

### Core Database Tables

The system uses these key Supabase tables:

- **`brands`** - Brand data with `brand_kit`, `voice_summary`, `visual_summary` JSONB fields
- **`media_assets`** - Images (logos, brand images) with `category`, `metadata.source` fields
- **`content_items`** - Generated content with `status`, `type`, `bfs_score` fields
- **`publishing_jobs`** - Scheduled publishing jobs with `status`, `scheduled_at` fields
- **`generation_logs`** - AI generation history with `bfs_score`, `approved` fields
- **`platform_connections`** - OAuth tokens for social platform integrations

---

## STEP 2 — Deep Dive per MVP

### Brand Guide MVP

**Diagram Location:** `docs/P0_BRAND_GUIDE_SYNC_COMPLETE.md` → "Architecture (MVP View)" section

#### Flow Explanation:

1. **Onboarding Scrape → Brand Guide Creation:**
   - User enters website URL in onboarding Step 3
   - `POST /api/crawl/start` triggers Playwright crawler
   - Crawler extracts content → `persistScrapedImages()` saves to `media_assets` table
   - AI generates voice/tone → `saveBrandGuideFromOnboarding()` saves to `brands.brand_kit` JSONB
   - Images saved with `category: logos/images` and `metadata.source: scrape`

2. **Brand Guide Page → Auto-save:**
   - User edits Brand Guide → auto-save triggers after 2 second debounce
   - `PATCH /api/brand-guide/:brandId` updates `brands` table JSONB fields
   - Version history optionally created in `brand_guide_versions` table

3. **AI Agents → Brand Guide:**
   - AI agents call `getBrandProfile(brandId)` → reads from `brands` table
   - Always gets latest data (no caching)
   - Uses `brand_kit`, `voice_summary`, `visual_summary` fields

**Key Files:**
- `server/routes/brand-guide.ts` - API endpoints
- `server/lib/scraped-images-service.ts` - Image persistence
- `server/lib/brand-profile.ts` - Brand profile service
- `client/hooks/useBrandGuide.ts` - Frontend hook

---

### Creative Studio MVP

**Diagram Location:** `POSTD_CREATIVE_STUDIO_AND_SCHEDULER_AUDIT_REPORT.md` → "Creative Studio Flow" diagram

#### Flow Explanation:

1. **Entry Methods:**
   - **Template:** Select from 18 starter templates → `adaptTemplateToBrand()` applies brand colors/fonts
   - **Blank:** Start with empty canvas
   - **AI Generate:** `POST /api/agents/generate/design` → generates design → loads into canvas

2. **Canvas → Save:**
   - User edits design (text, images, shapes)
   - `POST /api/studio/save` → saves to `content_items` table
   - Design stored as JSONB in `content` field with `type: "creative_studio"`

3. **Schedule Design:**
   - `POST /api/studio/:id/schedule` → creates publishing job
   - Job added to `publishing_jobs` table and in-memory queue

**Key Files:**
- `client/app/(postd)/studio/page.tsx` - Main studio page
- `server/routes/creative-studio.ts` - API endpoints
- `client/lib/studio/templates.ts` - Template system

---

### Scheduler MVP

**Diagram Location:** `POSTD_CREATIVE_STUDIO_AND_SCHEDULER_AUDIT_REPORT.md` → "Scheduler Flow" diagram

#### Flow Explanation:

1. **Content Queue → Review:**
   - `GET /api/content-items` lists items with `status: draft/pending_review`
   - `GET /api/agents/review/queue/:brandId` shows items needing review
   - Queries `generation_logs` table for BFS scores

2. **Approve/Reject:**
   - `POST /api/approvals/:approvalId/approve` → updates `content_items.status` to `approved`
   - `POST /api/approvals/:approvalId/reject` → updates status to `rejected`

3. **Schedule → Publish:**
   - `POST /api/publishing/:brandId/publish` → validates content
   - Creates job in `publishing_jobs` table
   - Publishing queue checks `scheduledAt` → waits if future, publishes if now
   - Updates status: `scheduled → published` or `scheduled → failed`
   - Retry logic: `retryCount < maxRetries`

**Key Files:**
- `server/routes/publishing.ts` - Publishing endpoints
- `server/lib/publishing-queue.ts` - Queue processing
- `server/routes/approvals-v2.ts` - Approval endpoints

---

## STEP 3 — Map Code to Diagrams

For each MVP, here's where to find the actual code:

### Brand Guide MVP

**UI Entry Points:**
- `client/pages/onboarding/Screen3AiScrape.tsx` - Onboarding scrape
- `client/app/(postd)/brand-guide/page.tsx` - Brand Guide page

**API Routes:**
- `server/routes/brand-guide.ts` - GET, PATCH endpoints
- `server/routes/crawler.ts` - POST /api/crawl/start

**Services/Helpers:**
- `server/lib/scraped-images-service.ts` - `persistScrapedImages()`
- `server/lib/brand-profile.ts` - `getBrandProfile()`
- `server/lib/brand-guide-service.ts` - `saveBrandGuide()`

**Database Tables:**
- `brands` - brand_kit, voice_summary, visual_summary JSONB
- `media_assets` - category, metadata JSONB
- `brand_guide_versions` - version history (optional)

---

### Creative Studio MVP

**UI Entry Points:**
- `client/app/(postd)/studio/page.tsx` - Main studio page
- `client/components/dashboard/CreativeStudioCanvas.tsx` - Canvas component

**API Routes:**
- `server/routes/creative-studio.ts` - POST /api/studio/save, POST /api/studio/:id/schedule

**Services/Helpers:**
- `client/lib/studio/templates.ts` - `adaptTemplateToBrand()`, `createTemplateDesign()`
- `server/lib/image-sourcing.ts` - `getScrapedBrandAssets()`

**Database Tables:**
- `content_items` - type: "creative_studio", content JSONB
- `publishing_jobs` - scheduled publishing jobs

---

### Scheduler MVP

**UI Entry Points:**
- `client/pages/ContentQueue.tsx` - Content Queue page
- `client/components/dashboard/ApprovalsBoard.tsx` - Approvals UI

**API Routes:**
- `server/routes/content-items.ts` - GET /api/content-items
- `server/routes/approvals-v2.ts` - POST /api/approvals/:approvalId/approve
- `server/routes/publishing.ts` - POST /api/publishing/:brandId/publish
- `server/routes/agents.ts` - GET /api/agents/review/queue/:brandId

**Services/Helpers:**
- `server/lib/publishing-queue.ts` - PublishingQueue class
- `server/lib/publishing-db-service.ts` - PublishingDBService class

**Database Tables:**
- `content_items` - status, bfs_score
- `generation_logs` - bfs_score, approved
- `publishing_jobs` - status, scheduled_at, platform

---

## STEP 4 — Hands-On End-to-End Flow

Follow this "happy path" to see the system in action:

### 1. Start Development Server

```bash
# Install dependencies (if not done)
pnpm install

# Start dev server (runs on port 8080)
pnpm dev
```

**Verify:** Open `http://localhost:8080` - you should see the landing page or be redirected to login.

---

### 2. Create a Test Brand via Onboarding

**Steps:**
1. Sign up / log in to the application
2. Navigate to onboarding flow (or create a new brand)
3. Enter a test website URL (e.g., `https://example.com` or any real website)
4. Trigger the crawl: The system will call `POST /api/crawl/start`

**What to Watch:**
- Check browser DevTools Network tab → see `POST /api/crawl/start` request
- Check server logs → see crawler progress messages
- Wait for crawl to complete (may take 30-60 seconds)

**Verify in Database:**
```sql
-- Check brands table
SELECT id, name, brand_kit, voice_summary, visual_summary 
FROM brands 
ORDER BY created_at DESC 
LIMIT 1;

-- Check media_assets table
SELECT id, brand_id, category, path, metadata 
FROM media_assets 
WHERE metadata->>'source' = 'scrape' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Expected Results:**
- `brands` table has new row with `brand_kit` JSONB populated
- `media_assets` table has rows with `category: 'logos'` or `category: 'images'`
- `metadata.source = 'scrape'` on all scraped images

---

### 3. View Brand Guide Populated

**Steps:**
1. Navigate to Brand Guide page: `/brand-guide` (or from dashboard)
2. Page loads → calls `GET /api/brand-guide/:brandId`

**What to Watch:**
- Check Network tab → see `GET /api/brand-guide/:brandId` request
- Brand Guide UI should show:
  - Scraped logos (max 2) in Logos section
  - Scraped brand images (max 15) in Brand Images section
  - Voice & tone keywords
  - Color palette

**Verify in Database:**
```sql
-- Check Brand Guide API response structure
-- The API should return scrapedLogos[] and scrapedBrandImages[] arrays
```

---

### 4. Generate Content (Studio or Queue)

**Option A: Creative Studio**

1. Navigate to Creative Studio: `/studio`
2. Click "Start with Template" or "Blank Canvas"
3. Edit design (add text, images)
4. Click "Save" → calls `POST /api/studio/save`

**What to Watch:**
- Network tab → `POST /api/studio/save` request
- Response includes `design.id`

**Verify in Database:**
```sql
-- Check content_items table
SELECT id, brand_id, type, status, content 
FROM content_items 
WHERE type = 'creative_studio' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Option B: Content Queue (AI Generation)**

1. Navigate to Content Queue: `/content-queue`
2. Click "Generate Content" or use AI agent
3. Select platform, topic, tone
4. Generate → calls `POST /api/agents/generate/doc` or `/api/agents/generate/design`

**What to Watch:**
- Network tab → see AI generation request
- Response includes `variants[]` array with generated content
- Content saved to `content_items` table

**Verify in Database:**
```sql
-- Check content_items and generation_logs
SELECT ci.id, ci.status, ci.bfs_score, gl.approved 
FROM content_items ci
LEFT JOIN generation_logs gl ON gl.content_item_id = ci.id
ORDER BY ci.created_at DESC 
LIMIT 5;
```

---

### 5. Schedule a Post (End at Job Creation)

**Steps:**
1. From Content Queue, approve a content item
2. Click "Schedule" or "Publish"
3. Select platform(s), set scheduled time
4. Submit → calls `POST /api/publishing/:brandId/publish`

**What to Watch:**
- Network tab → `POST /api/publishing/:brandId/publish` request
- Request body includes `platforms[]`, `scheduledAt`, `content`
- Response includes `jobId`

**Verify in Database:**
```sql
-- Check publishing_jobs table
SELECT id, brand_id, platform, status, scheduled_at, content 
FROM publishing_jobs 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected Results:**
- `publishing_jobs` table has new row
- `status = 'pending'` or `status = 'scheduled'`
- `scheduled_at` matches your selected time
- Job will be processed by publishing queue when `scheduled_at` arrives

**Note:** You don't need to actually publish to a real platform for this walkthrough. The job creation is sufficient to see the full flow.

---

## Troubleshooting

### Common Issues

**1. Crawler doesn't start:**
- Check `POST /api/crawl/start` response in Network tab
- Verify `brandId` and `workspaceId` are provided
- Check server logs for Playwright browser launch errors

**2. Brand Guide doesn't load:**
- Verify `GET /api/brand-guide/:brandId` returns 200
- Check browser console for errors
- Verify `brandId` is valid UUID format

**3. Content not saving:**
- Check `POST /api/studio/save` or content generation endpoint response
- Verify authentication token is present
- Check server logs for database errors

**4. Publishing job not created:**
- Verify `POST /api/publishing/:brandId/publish` endpoint exists
- Check if publishing router is mounted (may be commented out)
- Verify platform connections exist in `platform_connections` table

---

## Next Steps

After completing this walkthrough:

1. **Explore the Code:**
   - Read through the key files listed in Step 3
   - Understand how data flows from UI → API → Service → DB

2. **Review Architecture Diagrams:**
   - Re-read `docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md` with code context
   - Compare diagrams to actual implementation

3. **Check Related Documentation:**
   - `docs/BRAND_CRAWLER_BREAKDOWN.md` - Detailed crawler explanation
   - `docs/API_SURFACE_MAP.md` - Complete API reference
   - `docs/00_MASTER_CURSOR_COMMAND_CENTER.md` - Development guidelines

4. **Start Contributing:**
   - Pick a small bug fix or feature
   - Follow the architecture patterns you've learned
   - Use the diagrams as reference for data flow

---

**Questions?** Check the [Documentation Index](DOCS_INDEX.md) or ask in team channels.

**Happy coding! 🚀**

