# POSTD New Developer Architecture Guide

**Welcome!** This is your interactive guide to understanding the POSTD system architecture. We'll walk through each MVP, showing you exactly where the code lives and how data flows from UI → API → Services → Database.

**Time to complete:** 45-60 minutes  
**Prerequisites:** Node.js 18+, pnpm installed, Supabase access

---

## 🎯 0) CONTEXT LOADED

You should have these documents open:

✅ **`docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md`** - High-level system diagram  
✅ **`docs/P0_BRAND_GUIDE_SYNC_COMPLETE.md`** - Brand Guide MVP architecture  
✅ **`POSTD_CREATIVE_STUDIO_AND_SCHEDULER_AUDIT_REPORT.md`** - Creative Studio & Scheduler diagrams  
✅ **`docs/MVP_ARCHITECTURE_ALIGNMENT_AUDIT.md`** - Implementation vs diagram verification  
✅ **`docs/NEW_DEVELOPER_ONBOARDING_GUIDE.md`** - Quick reference (if exists)
✅ **`docs/audit/FINAL_LOCK_IN_VERIFICATION_REPORT.md`** - Final repository alignment verification (2025-01-20)

**Project Structure Confirmed:**
- ✅ Frontend: `client/app/(postd)/...` (React + Vite, not Next.js)
- ✅ Backend: `server/routes/...` and `server/lib/...`
- ✅ Database: `supabase/migrations/001_bootstrap_schema.sql`

---

## 🏗️ 1) SYSTEM OVERVIEW (HIGH-LEVEL DIAGRAM)

**Reference:** `docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md` → "High-Level System Diagram"

### 📊 System Architecture Summary

The POSTD system is a **full-stack React application** with an Express backend and Supabase PostgreSQL database. Here's how it's structured:

#### **Frontend (React + Vite)**

The frontend surfaces these main entry points:

1. **Onboarding Flow** (`client/pages/onboarding/...`)
   - 10-step onboarding wizard
   - Brand creation and website scraping
   - Brand Guide initial setup
   - Key files: `Screen3AiScrape.tsx`, `Screen5BrandSummaryReview.tsx`

2. **Dashboard** (`client/app/(postd)/dashboard/...`)
   - Brand overview and metrics
   - Content calendar view

3. **Brand Guide** (`client/app/(postd)/brand-guide/page.tsx`)
   - Edit brand voice, tone, colors, fonts
   - View scraped logos and brand images
   - Auto-save with 2-second debounce

4. **Creative Studio** (`client/app/(postd)/studio/page.tsx`)
   - Canvas-based design editor
   - Templates, blank canvas, AI generation
   - Save designs and schedule posts

5. **Content Queue / Approvals** (`client/app/(postd)/queue/page.tsx`, `client/app/(postd)/approvals/page.tsx`)
   - Review AI-generated content
   - Approve/reject workflow
   - Schedule approved content

#### **Key Data Flows**

**1. Brand Crawler Path:**
```
User enters website URL (Onboarding Step 3)
  ↓
POST /api/crawl/start (server/routes/crawler.ts)
  ↓
Playwright crawler extracts:
  - Images (logos, brand images)
  - Colors (via node-vibrant)
  - Typography (fonts)
  - Text content
  ↓
persistScrapedImages() → media_assets table
  - category: 'logos' | 'images'
  - metadata.source: 'scrape'
  ↓
AI generates Brand Kit → brands.brand_kit JSONB
```

**2. Brand Guide Path:**
```
Brand Guide Page loads
  ↓
GET /api/brand-guide/:brandId (server/routes/brand-guide.ts)
  ↓
Queries:
  - brands table → brand_kit, voice_summary, visual_summary
  - media_assets table → WHERE metadata.source = 'scrape'
  ↓
Returns separated arrays:
  - scrapedLogos[] (max 2)
  - scrapedBrandImages[] (max 15)
```

**3. AI Agents Path:**
```
Doc/Design/Advisor Agent called
  ↓
POST /api/agents/generate/doc | /design | /advisor
  ↓
getBrandProfile(brandId) → reads from brands table
  - Always fetches latest (no cache)
  - Uses brand_kit, voice_summary, visual_summary
  ↓
Generates content via OpenAI/Claude
  ↓
Saves to:
  - content_items table
  - generation_logs table (with BFS score)
```

**4. Scheduler / Publishing Path:**
```
Approve content in queue
  ↓
POST /api/approvals/:approvalId/approve (server/routes/approvals-v2.ts)
  ↓
Updates content_items.status → 'approved'
  ↓
Schedule post
  ↓
POST /api/publishing/:brandId/publish (server/routes/publishing-router.ts)
  ↓
Creates publishing_jobs row
  ↓
PublishingQueue checks scheduled_at:
  - If future: wait
  - If now/past: publish via platform connector
  ↓
Status transitions:
  - scheduled → published (success)
  - scheduled → failed (retry if retryCount < maxRetries)
```

---

### 🗄️ Core Database Tables

**Reference:** `supabase/migrations/001_bootstrap_schema.sql`

Here are the **6 core tables** you need to understand:

#### **1. `brands` Table**
```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  brand_kit JSONB DEFAULT '{}',        -- Main Brand Guide data
  voice_summary JSONB,                 -- Voice & tone data
  visual_summary JSONB,                -- Visual identity data
  website_url TEXT,
  tenant_id UUID,                      -- Multi-tenant isolation
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```
**Purpose:** Stores brand identity, Brand Guide data, and metadata. The JSONB fields (`brand_kit`, `voice_summary`, `visual_summary`) contain the editable Brand Guide content.

#### **2. `media_assets` Table**
```sql
CREATE TABLE media_assets (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL,
  tenant_id UUID,                      -- Required for RLS
  category TEXT,                       -- 'logos' | 'images' | 'graphics'
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',         -- { source: 'scrape', role: 'logo' }
  created_at TIMESTAMPTZ
);
```
**Purpose:** Stores all brand media (logos, images, uploaded files). Scraped images have `metadata.source = 'scrape'` and `category` indicates type.

#### **3. `content_items` Table**
```sql
CREATE TABLE content_items (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL,
  type TEXT NOT NULL,                  -- 'creative_studio' | 'doc' | 'design'
  content JSONB NOT NULL,              -- Design data or post content
  status TEXT DEFAULT 'draft',         -- 'draft' | 'pending_review' | 'approved' | 'rejected' | 'scheduled' | 'published'
  platform TEXT,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```
**Purpose:** Stores all generated content (Creative Studio designs, AI-generated posts). `type` distinguishes source, `status` tracks workflow state.

#### **4. `publishing_jobs` Table**
```sql
CREATE TABLE publishing_jobs (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id),
  tenant_id UUID REFERENCES tenants(id),
  content JSONB NOT NULL,
  platforms TEXT[] NOT NULL,           -- ['instagram', 'linkedin']
  status TEXT DEFAULT 'pending',       -- 'pending' | 'scheduled' | 'published' | 'failed'
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```
**Purpose:** Queue of publishing jobs. Jobs are processed by `PublishingQueue` which checks `scheduled_at` and publishes via platform connectors. Retry logic is handled in the `PublishingQueue` class (retry_count/max_retries may be stored in `content` JSONB or tracked in-memory).

#### **5. `generation_logs` Table**
```sql
CREATE TABLE generation_logs (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES brands(id),
  agent TEXT NOT NULL,                 -- 'doc' | 'design' | 'advisor'
  prompt_version TEXT,
  input JSONB NOT NULL,
  output JSONB NOT NULL,
  bfs_score DECIMAL(3,1),              -- Brand Fidelity Score (0-1)
  linter_results JSONB,
  approved BOOLEAN DEFAULT FALSE,
  reviewer_id UUID REFERENCES auth.users(id),
  revision INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ
);
```
**Purpose:** Tracks AI generation history and BFS (Brand Fidelity Score) for content quality assessment. Used by review queue. Links to `content_items` via `brand_id` (not direct foreign key). **Note:** Agent values are `'doc'`, `'design'`, `'advisor'` (not `'copywriter'`, `'creative'`, `'advisor'`).

#### **6. `platform_connections` Table**
```sql
CREATE TABLE platform_connections (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL,       -- 'instagram' | 'linkedin' | 'tiktok' | 'meta'
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```
**Purpose:** Stores OAuth tokens for social platform integrations. Used by platform connectors to authenticate publishing requests. **Note:** Column is named `platform` (not `provider`), and `expires_at` (not `token_expires_at`).

---

## 🔍 2) DEEP DIVE — PER MVP (USE MINI DIAGRAMS)

### 2.1 Brand Guide MVP

**Diagram Reference:** `docs/P0_BRAND_GUIDE_SYNC_COMPLETE.md` → "Architecture (MVP View)"

#### **Flow Explanation**

The Brand Guide MVP has **3 main flows**:

**Flow 1: Onboarding → Brand Guide Creation**

1. **User enters website URL** (Onboarding Step 3)
   - File: `client/pages/onboarding/Screen3AiScrape.tsx`

2. **Crawler triggers:**
   - API: `POST /api/crawl/start` 
   - Route file: `server/routes/crawler.ts`
   - Service: `server/lib/crawler.ts` (Playwright crawler)

3. **Image extraction & persistence:**
   - Function: `persistScrapedImages()` 
   - File: `server/lib/scraped-images-service.ts`
   - Saves to: `media_assets` table
   - Fields:
     - `category: 'logos'` (max 2) or `'images'` (max 15)
     - `metadata.source: 'scrape'`
     - `metadata.role: 'logo' | 'hero' | 'photo' | 'team' | 'other'`

4. **AI generates Brand Kit:**
   - Function: `saveBrandGuideFromOnboarding()`
   - Saves to: `brands.brand_kit` JSONB field
   - Also saves: `voice_summary`, `visual_summary` JSONB fields

**Flow 2: Brand Guide Page → Auto-save**

1. **User edits Brand Guide:**
   - UI: `client/app/(postd)/brand-guide/page.tsx`
   - Hook: `client/hooks/useBrandGuide.ts`
   - Auto-save: 2-second debounce

2. **API call:**
   - `PATCH /api/brand-guide/:brandId`
   - Route file: `server/routes/brand-guide.ts` (line ~452)

3. **Database update:**
   - Updates `brands.brand_kit`, `voice_summary`, `visual_summary` JSONB fields
   - Optional: Creates version history in `brand_guide_versions` table

**Flow 3: AI Agents → Brand Guide**

1. **AI Agent called** (Doc/Design/Advisor):
   - Endpoint: `POST /api/agents/generate/doc | /design | /advisor`
   - Route file: `server/routes/agents.ts`

2. **Load Brand Profile:**
   - Function: `getBrandProfile(brandId)`
   - File: `server/lib/brand-profile.ts`
   - Always reads from `brands` table (no cache)
   - Returns: Combined `brand_kit`, `voice_summary`, `visual_summary`

3. **Generate content:**
   - Uses Brand Guide data in AI prompt
   - Saves to `content_items` and `generation_logs` tables

#### **Key Files to Open and Review**

1. **`server/routes/crawler.ts`**
   - Look for: `POST /api/crawl/start` handler
   - Find: `runCrawlJobSync()` function
   - See: How it calls `persistScrapedImages()`

2. **`server/lib/scraped-images-service.ts`**
   - Look for: `persistScrapedImages()` function
   - See: How it inserts into `media_assets` with `category` and `metadata.source = 'scrape'`
   - Note: Image classification logic (logos vs brand images)

3. **`server/routes/brand-guide.ts`**
   - Look for:
     - `GET /api/brand-guide/:brandId` (line ~27)
     - `PATCH /api/brand-guide/:brandId` (line ~452)
   - See: How it queries `brands` and `media_assets` tables
   - Note: Separates logos (max 2) and brand images (max 15) in response

4. **`server/lib/brand-profile.ts`**
   - Look for: `getBrandProfile(brandId)` function
   - See: How it reads from `brands` table (always fresh, no cache)
   - Note: Returns unified Brand Guide object for AI agents

5. **`client/hooks/useBrandGuide.ts`**
   - Look for: Auto-save logic with 2-second debounce
   - See: How it calls `PATCH /api/brand-guide/:brandId` on changes

6. **`client/app/(postd)/brand-guide/page.tsx`**
   - Look for: UI that displays scraped logos and brand images
   - See: How it uses `useBrandGuide` hook
   - Note: Auto-save indicator ("Saving..." / "Saved at [time]")

#### **Database Queries to Verify**

```sql
-- Check scraped images
SELECT id, brand_id, category, path, metadata
FROM media_assets
WHERE metadata->>'source' = 'scrape'
ORDER BY created_at DESC
LIMIT 10;

-- Check Brand Guide data
SELECT id, name, brand_kit, voice_summary, visual_summary
FROM brands
ORDER BY created_at DESC
LIMIT 1;
```

---

### 2.2 Creative Studio MVP

**Diagram Reference:** `POSTD_CREATIVE_STUDIO_AND_SCHEDULER_AUDIT_REPORT.md` → "Creative Studio Flow"

#### **Flow Explanation**

The Creative Studio MVP has **4 entry methods**:

**Entry Method 1: Template**

1. **User selects template:**
   - UI: `client/app/(postd)/studio/page.tsx`
   - Template picker: `client/components/dashboard/CreativeStudioTemplateGrid.tsx`
   - Templates: 18 starter templates in `client/lib/studio/templates.ts`

2. **Apply brand styling:**
   - Function: `adaptTemplateToBrand()`
   - File: `client/lib/studio/templates.ts`
   - Applies: Brand colors and fonts from Brand Guide

3. **Load into canvas:**
   - Component: `client/components/dashboard/CreativeStudioCanvas.tsx`
   - User can edit: Text, images, shapes, backgrounds

**Entry Method 2: Blank Canvas**

1. **User starts blank:**
   - UI: `client/app/(postd)/studio/page.tsx`
   - Creates empty canvas
   - User adds elements manually

**Entry Method 3: AI Generate**

1. **User requests AI design:**
   - API: `POST /api/agents/generate/design`
   - Route file: `server/routes/agents.ts`
   - Generates: Design variants with brand styling

2. **Load into canvas:**
   - Design variants appear in UI
   - User selects variant → loads into canvas

**Entry Method 4: Upload Image**

1. **User uploads image:**
   - Uploads to Supabase Storage
   - Image added to canvas as image element
   - User can crop, resize, position

#### **Save Flow**

1. **User clicks "Save":**
   - Function: `handleSaveToLibrary()`
   - File: `client/app/(postd)/studio/page.tsx` (line ~730)

2. **API call:**
   - `POST /api/studio/save` (new design)
   - `PUT /api/studio/:id` (update existing)
   - Route file: `server/routes/creative-studio.ts`

3. **Database write:**
   - Table: `content_items`
   - Fields:
     - `type: 'creative_studio'`
     - `content` JSONB: Full design data (canvas items, dimensions, etc.)
     - `status: 'draft'`

#### **Schedule Flow**

1. **User schedules design:**
   - Function: `handleConfirmSchedule()`
   - File: `client/app/(postd)/studio/page.tsx` (line ~1019)

2. **API call:**
   - `POST /api/studio/:id/schedule`
   - Route file: `server/routes/creative-studio.ts` (line ~430)

3. **Publishing job created:**
   - Table: `publishing_jobs`
   - Queue: `PublishingQueue` (in-memory + DB)
   - Status: `scheduled` (if future date) or `pending` (if immediate)

#### **Key Files to Open and Review**

1. **`client/app/(postd)/studio/page.tsx`**
   - Look for:
     - Template selection UI
     - Canvas component rendering
     - `handleSaveToLibrary()` function (line ~730)
     - `handleConfirmSchedule()` function (line ~1019)
   - See: How designs are saved and scheduled

2. **`client/components/dashboard/CreativeStudioCanvas.tsx`**
   - Look for: Canvas rendering and editing logic
   - See: Drag/drop, resize, text editing handlers
   - Note: How canvas items are managed in state

3. **`client/lib/studio/templates.ts`**
   - Look for: `STARTER_TEMPLATES` array (18 templates)
   - Find: `adaptTemplateToBrand()` function (line ~28)
   - See: How brand colors/fonts are applied to templates

4. **`server/routes/creative-studio.ts`**
   - Look for:
     - `POST /api/studio/save` (line ~105)
     - `POST /api/studio/:id/schedule` (line ~430)
   - See: How designs are saved to `content_items` table

5. **`server/lib/image-sourcing.ts`**
   - Look for: `getScrapedBrandAssets()` function
   - See: How it queries `media_assets` for brand images
   - Note: Used by Studio to show brand assets in image picker

#### **Database Query to Verify**

```sql
-- Check saved Creative Studio designs
SELECT id, brand_id, type, status, content->'items' as canvas_items
FROM content_items
WHERE type = 'creative_studio'
ORDER BY created_at DESC
LIMIT 5;
```

---

### 2.3 Scheduler MVP

**Diagram Reference:** `POSTD_CREATIVE_STUDIO_AND_SCHEDULER_AUDIT_REPORT.md` → "Scheduler Flow"

#### **Flow Explanation**

The Scheduler MVP has **3 main flows**:

**Flow 1: Content Queue → Review**

1. **List content items:**
   - UI: `client/app/(postd)/queue/page.tsx`
   - API: `GET /api/content-items`
   - Route file: `server/routes/content-items.ts`
   - Filters: `status: 'draft' | 'pending_review'`

2. **Review queue:**
   - UI: `client/app/(postd)/approvals/page.tsx`
   - API: `GET /api/agents/review/queue/:brandId`
   - Route file: `server/routes/agents.ts` (line ~793)
   - Queries: `generation_logs` table for items with low BFS scores

**Flow 2: Approve / Reject**

1. **Approve content:**
   - API: `POST /api/approvals/:approvalId/approve`
   - Route file: `server/routes/approvals-v2.ts` (line ~273)
   - Mounted at: `/api/approvals` (NOT `/api/approvals-v2`)
   - Updates: `content_items.status → 'approved'`

2. **Reject content:**
   - API: `POST /api/approvals/:approvalId/reject`
   - Route file: `server/routes/approvals-v2.ts`
   - Updates: `content_items.status → 'rejected'`

**Flow 3: Schedule → Publish**

1. **Schedule post:**
   - UI: Schedule modal (from queue or approvals page)
   - API: `POST /api/publishing/:brandId/publish`
   - Route file: `server/routes/publishing-router.ts` (line ~50)

2. **Job creation:**
   - Validates content via platform validators
   - Creates row in `publishing_jobs` table
   - Adds to in-memory `PublishingQueue`

3. **Queue processing:**
   - Service: `server/lib/publishing-queue.ts`
   - Checks `scheduled_at`:
     - If future: Waits until scheduled time
     - If now/past: Publishes immediately
   - Publishes via platform connector:
     - Meta (Instagram/Facebook): `server/connectors/meta/implementation.ts`
     - LinkedIn: `server/connectors/linkedin/implementation.ts`
     - TikTok: `server/connectors/tiktok/implementation.ts`

4. **Status transitions:**
   - `scheduled → published` (success)
   - `scheduled → failed` (retry if `retryCount < maxRetries`)

#### **Key Files to Open and Review**

1. **`client/app/(postd)/queue/page.tsx`**
   - Look for: Content list rendering
   - See: How it calls `GET /api/content-items`
   - Note: Filtering by status

2. **`client/app/(postd)/approvals/page.tsx`**
   - Look for: Review queue UI
   - See: How it calls `GET /api/agents/review/queue/:brandId`
   - Find: Approve/reject handlers

3. **`server/routes/content-items.ts`**
   - Look for: `GET /api/content-items` handler
   - See: How it filters by `status` from `content_items` table

4. **`server/routes/agents.ts`**
   - Look for: `GET /api/agents/review/queue/:brandId` (line ~793)
   - See: How it queries `generation_logs` for items needing review

5. **`server/routes/approvals-v2.ts`**
   - Look for:
     - `POST /api/approvals/:approvalId/approve` (line ~273)
     - `POST /api/approvals/:approvalId/reject`
   - Note: Router is mounted at `/api/approvals` in `server/index-v2.ts` (line ~212)
   - See: How it updates `content_items.status`

6. **`server/routes/publishing-router.ts`**
   - Look for: `POST /api/publishing/:brandId/publish` (line ~50)
   - See: How it validates content and creates publishing job
   - Note: May be commented out in `server/index-v2.ts` - verify mount status

7. **`server/lib/publishing-queue.ts`**
   - Look for: `PublishingQueue` class
   - Find: `processJob()` method (line ~57)
   - See: How it checks `scheduled_at` and publishes via connectors

8. **`server/lib/publishing-db-service.ts`**
   - Look for: Database service methods
   - See: `createPublishingJob()`, `updateJobStatus()`, etc.

#### **Database Queries to Verify**

```sql
-- Check content items in queue
SELECT id, brand_id, type, status
FROM content_items
WHERE status IN ('draft', 'pending_review', 'approved')
ORDER BY created_at DESC
LIMIT 10;

-- Check publishing jobs
SELECT id, brand_id, platforms, status, scheduled_at
FROM publishing_jobs
ORDER BY created_at DESC
LIMIT 5;

-- Check generation logs (for review queue)
-- Note: Links via brand_id + timestamp window, not direct FK
SELECT ci.id, ci.status, gl.bfs_score, gl.approved, gl.agent
FROM content_items ci
LEFT JOIN generation_logs gl ON gl.brand_id = ci.brand_id
  AND gl.created_at BETWEEN ci.created_at - INTERVAL '1 minute' AND ci.created_at + INTERVAL '1 minute'
ORDER BY ci.created_at DESC
LIMIT 5;
```

---

## 🧪 3) HANDS-ON END-TO-END FLOW (GUIDE THE DEV)

Follow this **happy path** to see the system in action. We'll trace data from UI → API → Services → DB.

### 3.1 Start Dev Server

**Commands:**

```bash
# Install dependencies (if not already done)
pnpm install

# Start dev server (runs on port 8080)
pnpm dev
```

**Verify:** Open `http://localhost:8080` in your browser. You should see the landing page or be redirected to login.

**What to expect:**
- Frontend: React app served by Vite
- Backend: Express server on same port (integrated via Vite)
- Hot reload: Both client and server code reload on changes

---

### 3.2 Create a Test Brand via Onboarding

**Steps:**

1. **Sign up / Log in** to the application

2. **Navigate to onboarding flow** (or create a new brand if onboarding is skipped)

3. **Enter a real website URL** in onboarding Step 3
   - Example: `https://example.com` or any real brand website
   - File: `client/pages/onboarding/Screen3AiScrape.tsx`

4. **Watch the Network tab** in browser DevTools
   - Look for: `POST /api/crawl/start` request
   - Request body should include: `{ url, brand_id, workspaceId }`

5. **Watch server logs** in terminal
   - Look for: Crawler progress messages
   - Should see: Playwright browser launch, page navigation, image extraction

6. **Wait for crawl to complete** (may take 30-60 seconds)

**What the server is doing:**

1. **Crawler runs** (`server/routes/crawler.ts`):
   - Launches Playwright headless browser
   - Navigates to website (respects robots.txt)
   - Extracts images (logos, brand images)
   - Extracts colors (via node-vibrant)
   - Extracts typography (fonts)
   - Extracts text content

2. **Images saved** (`server/lib/scraped-images-service.ts`):
   - `persistScrapedImages()` called
   - Images classified (logos vs brand images)
   - Saved to `media_assets` table:
     - `category: 'logos'` (max 2)
     - `category: 'images'` (max 15)
     - `metadata.source: 'scrape'`

3. **AI generates Brand Kit**:
   - AI prompt built from crawl results + colors
   - Brand Kit generated (voice, tone, keywords)
   - Saved to `brands.brand_kit` JSONB field

**Verify in Database:**

```sql
-- Check brand created
SELECT id, name, brand_kit, voice_summary, visual_summary, created_at
FROM brands
ORDER BY created_at DESC
LIMIT 1;

-- Check scraped images
SELECT id, brand_id, category, path, metadata
FROM media_assets
WHERE metadata->>'source' = 'scrape'
ORDER BY created_at DESC
LIMIT 10;

-- Should see:
-- - category: 'logos' (1-2 rows)
-- - category: 'images' (up to 15 rows)
-- - metadata->>'source': 'scrape'
-- - metadata->>'role': 'logo' | 'hero' | 'photo' | 'team' | 'other'
```

**Expected Results:**
- ✅ `brands` table has new row with `brand_kit` JSONB populated
- ✅ `media_assets` table has rows with `category: 'logos'` or `category: 'images'`
- ✅ All scraped images have `metadata.source = 'scrape'`

---

### 3.3 View Brand Guide (Populated)

**Steps:**

1. **Navigate to Brand Guide page:**
   - URL: `/brand-guide` (or from dashboard)
   - File: `client/app/(postd)/brand-guide/page.tsx`

2. **Watch Network tab:**
   - Look for: `GET /api/brand-guide/:brandId` request
   - Response should include:
     - `scrapedLogos[]` array (max 2 items)
     - `scrapedBrandImages[]` array (max 15 items)
     - Brand Guide data (voice, tone, colors, fonts)

3. **Verify UI displays:**
   - ✅ Scraped logos (max 2) in Logos section
   - ✅ Scraped brand images (max 15) in Brand Images section
   - ✅ Voice & tone keywords
   - ✅ Color palette (from extracted colors)

**What the API is doing:**

1. **GET /api/brand-guide/:brandId** (`server/routes/brand-guide.ts`, line ~27):
   - Queries `brands` table → gets `brand_kit`, `voice_summary`, `visual_summary`
   - Queries `media_assets` table:
     ```sql
     WHERE brand_id = :brandId
     AND metadata->>'source' = 'scrape'
     ```
   - Separates images:
     - Logos: `WHERE category = 'logos' AND metadata->>'role' = 'logo'` (max 2)
     - Brand Images: `WHERE category = 'images' AND metadata->>'role' != 'logo'` (max 15)

2. **Response structure:**
   ```json
   {
     "scrapedLogos": [...],        // Max 2
     "scrapedBrandImages": [...],  // Max 15
     "voice": {...},
     "colors": {...},
     "fonts": {...}
   }
   ```

**Tie it back to the diagram:**
- ✅ Brand Guide diagram shows: `GET /api/brand-guide/:id` → queries `media_assets` and `brands` → returns separated arrays
- ✅ This matches what you see in the Network tab response

---

### 3.4 Generate Content (Studio or Queue)

Choose **one path**:

---

#### **Option A: Creative Studio**

**Steps:**

1. **Navigate to Creative Studio:**
   - URL: `/studio`
   - File: `client/app/(postd)/studio/page.tsx`

2. **Start with template or blank canvas:**
   - Click "Start with Template" → select a template
   - OR click "Blank Canvas"

3. **Make a small change:**
   - Add text element
   - Change colors
   - Add an image

4. **Click "Save":**
   - Watch Network tab → `POST /api/studio/save` request
   - Response should include: `{ id, ... }`

**What's happening:**

1. **Save handler** (`client/app/(postd)/studio/page.tsx`, line ~730):
   - `handleSaveToLibrary()` called
   - POST to `/api/studio/save`

2. **API saves** (`server/routes/creative-studio.ts`, line ~105):
   - Creates row in `content_items` table:
     - `type: 'creative_studio'`
     - `content` JSONB: Full design data (canvas items, dimensions)
     - `status: 'draft'`

**Verify in Database:**

```sql
-- Check saved Creative Studio design
SELECT id, brand_id, type, status, 
       content->>'items' as canvas_items,
       content->>'width' as width,
       content->>'height' as height
FROM content_items
WHERE type = 'creative_studio'
ORDER BY created_at DESC
LIMIT 1;

-- Should see:
-- - type: 'creative_studio'
-- - status: 'draft'
-- - content: JSONB with design data
```

---

#### **Option B: Content Queue (AI Generation)**

**Steps:**

1. **Navigate to Content Queue:**
   - URL: `/content-queue` or `/queue`
   - File: `client/app/(postd)/queue/page.tsx`

2. **Generate content via AI:**
   - Click "Generate Content" or use AI agent UI
   - Select platform, topic, tone
   - Click "Generate"

3. **Watch Network tab:**
   - Look for: `POST /api/agents/generate/doc` or `/api/agents/generate/design`
   - Response should include: `{ variants: [...], ... }`

**What's happening:**

1. **AI Agent called** (`server/routes/agents.ts`):
   - Loads Brand Guide via `getBrandProfile(brandId)`
   - Builds AI prompt with Brand Guide context
   - Generates content via OpenAI/Claude
   - Calculates BFS (Brand Fidelity Score)

2. **Content saved:**
   - `content_items` table:
     - `type: 'doc'` or `'design'`
     - `content` JSONB: Generated content variants
     - `status: 'draft'`
   - `generation_logs` table:
     - `bfs_score`: Brand Fidelity Score (0-1, stored as DECIMAL(3,1))
     - `approved`: false (needs review if BFS < threshold)

**Verify in Database:**

```sql
-- Check generated content in content_items
SELECT id, brand_id, type, status, created_at
FROM content_items
WHERE type IN ('doc', 'design')
ORDER BY created_at DESC
LIMIT 5;

-- Check generation logs (linked via brand_id + timestamp)
SELECT id, brand_id, agent, bfs_score, approved, created_at
FROM generation_logs
ORDER BY created_at DESC
LIMIT 5;

-- Should see:
-- - type: 'doc' or 'design' in content_items
-- - status: 'draft' or 'pending_review'
-- - bfs_score: Decimal (0-1, stored as DECIMAL(3,1)) in generation_logs
-- Note: generation_logs links via brand_id + timestamp, not direct FK to content_items
```

---

### 3.5 Schedule a Post (Job Creation)

**Steps:**

1. **Approve a content item:**
   - Go to `/approvals` or `/queue`
   - Find an approved or draft content item
   - Click "Approve" (if needed)

2. **Click "Schedule" or "Publish":**
   - Schedule modal opens
   - Select platform(s): Instagram, LinkedIn, TikTok
   - Set scheduled date/time

3. **Submit:**
   - Watch Network tab → `POST /api/publishing/:brandId/publish` request
   - Request body should include: `{ platforms: [...], scheduledAt: '...', content: {...} }`
   - Response should include: `{ jobId: '...' }`

**What's happening:**

1. **Publishing endpoint** (`server/routes/publishing-router.ts`, line ~50):
   - Validates content via platform validators
   - Creates row in `publishing_jobs` table:
     - `platforms`: Array of platform names
     - `scheduled_at`: ISO timestamp
     - `status`: `'scheduled'` (if future) or `'pending'` (if immediate)
     - `content`: Full content JSONB

2. **Job added to queue:**
   - `PublishingQueue.addJob()` called
   - Job stored in-memory and DB
   - Queue processor checks `scheduled_at`:
     - If future: Waits until scheduled time
     - If now/past: Publishes immediately

**Verify in Database:**

```sql
-- Check publishing job created
SELECT id, brand_id, platforms, status, scheduled_at, 
       content->>'title' as content_title
FROM publishing_jobs
ORDER BY created_at DESC
LIMIT 1;

-- Should see:
-- - platforms: TEXT[] (e.g., ['instagram', 'linkedin'])
-- - status: 'scheduled' or 'pending'
-- - scheduled_at: TIMESTAMPTZ
-- - content: JSONB with post content
```

**Expected Results:**
- ✅ `publishing_jobs` table has new row
- ✅ `status = 'scheduled'` (if future date) or `'pending'` (if immediate)
- ✅ `scheduled_at` matches your selected time
- ✅ `platforms` is a TEXT array (e.g., `['instagram', 'linkedin']`)
- ✅ Job will be processed by publishing queue when `scheduled_at` arrives
- ⚠️ **Note:** Publishing router may be commented out in `server/index-v2.ts` - verify mount status if job creation fails

**Note:** You don't need to actually publish to a real platform for this walkthrough. The job creation is sufficient to see the full flow wired up.

---

## ✅ 4) WRAP-UP CHECKLIST

At the end of this walkthrough, you should be able to answer:

### **System Understanding**

- [ ] **I understand the high-level system diagram**
  - Frontend (React) → API (Express) → Services → Database (Supabase)
  - Key flows: Crawler, Brand Guide, AI Agents, Scheduler

- [ ] **I can trace the Brand Guide MVP:**
  - Onboarding → Crawler → Brand Guide → AI Agents
  - Know where: UI files, API routes, services, database tables

- [ ] **I can trace the Creative Studio MVP:**
  - Template/Blank/AI → Canvas → Save → Schedule
  - Know where: Studio page, canvas component, templates, API routes

- [ ] **I can trace the Scheduler MVP:**
  - Queue → Approvals → Publishing → Platforms
  - Know where: Queue/approvals pages, API routes, publishing queue service

### **Hands-On Experience**

- [ ] **I started the dev server:**
  - Ran `pnpm dev`
  - Opened `http://localhost:8080`

- [ ] **I created a test brand:**
  - Went through onboarding
  - Entered website URL
  - Saw crawl complete

- [ ] **I saw the Brand Guide populate:**
  - Navigated to `/brand-guide`
  - Saw scraped logos and images
  - Verified in database

- [ ] **I generated content:**
  - Used Creative Studio OR Content Queue
  - Saved content
  - Verified in `content_items` table

- [ ] **I created a publishing job:**
  - Approved content
  - Scheduled a post
  - Verified in `publishing_jobs` table

### **Code Navigation**

- [ ] **I know where to find:**
  - **Key UI surfaces:**
    - `client/app/(postd)/brand-guide/page.tsx`
    - `client/app/(postd)/studio/page.tsx`
    - `client/app/(postd)/queue/page.tsx`
    - `client/app/(postd)/approvals/page.tsx`

  - **API routes:**
    - `server/routes/brand-guide.ts`
    - `server/routes/crawler.ts`
    - `server/routes/creative-studio.ts`
    - `server/routes/agents.ts`
    - `server/routes/approvals-v2.ts`
    - `server/routes/publishing-router.ts`

  - **Services:**
    - `server/lib/scraped-images-service.ts`
    - `server/lib/brand-profile.ts`
    - `server/lib/publishing-queue.ts`
    - `server/lib/publishing-db-service.ts`

  - **Core tables in Supabase schema:**
    - `supabase/migrations/001_bootstrap_schema.sql`
    - Tables: `brands`, `media_assets`, `content_items`, `publishing_jobs`, `generation_logs`, `platform_connections`

### **Architecture Alignment**

- [ ] **I understand that the diagrams are the source of truth:**
  - `docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md` - High-level system
  - `docs/P0_BRAND_GUIDE_SYNC_COMPLETE.md` - Brand Guide MVP
  - `POSTD_CREATIVE_STUDIO_AND_SCHEDULER_AUDIT_REPORT.md` - Studio & Scheduler MVPs

- [ ] **I can verify implementation matches diagrams:**
  - Routes in code match diagram endpoints
  - Services match diagram components
  - Database tables match diagram schema

---

## 🎓 Next Steps

After completing this walkthrough:

1. **Explore the Code:**
   - Read through the key files listed in Section 2
   - Understand how data flows from UI → API → Service → DB

2. **Review Architecture Diagrams:**
   - Re-read `docs/SYSTEM_ARCHITECTURE_DIAGRAMS.md` with code context
   - Compare diagrams to actual implementation
   - Use diagrams as reference for new features

3. **Check Related Documentation:**
   - `docs/BRAND_CRAWLER_BREAKDOWN.md` - Detailed crawler explanation
   - `docs/API_SURFACE_MAP.md` - Complete API reference
   - `docs/00_MASTER_CURSOR_COMMAND_CENTER.md` - Development guidelines

4. **Start Contributing:**
   - Pick a small bug fix or feature
   - Follow the architecture patterns you've learned
   - Use the diagrams as reference for data flow

---

## 🐛 Troubleshooting

### Common Issues

**1. Crawler doesn't start:**
- Check `POST /api/crawl/start` response in Network tab
- Verify `brandId` and `workspaceId` are provided
- Check server logs for Playwright browser launch errors
- Verify Playwright dependencies installed: `pnpm install`

**2. Brand Guide doesn't load:**
- Verify `GET /api/brand-guide/:brandId` returns 200
- Check browser console for errors
- Verify `brandId` is valid UUID format
- Check if brand exists in `brands` table

**3. Content not saving:**
- Check `POST /api/studio/save` or content generation endpoint response
- Verify authentication token is present
- Check server logs for database errors
- Verify `tenant_id` is provided (required for RLS)

**4. Publishing job not created:**
- Verify `POST /api/publishing/:brandId/publish` endpoint exists
- Check if publishing router is mounted in `server/index-v2.ts` (may be commented out)
- Verify platform connections exist in `platform_connections` table
- Check server logs for validation errors

---

**Questions?** Check the documentation index or ask in team channels.

**Happy coding! 🚀**

