# MVP Client Journeys — Technical Flow Map

**Date**: January 2025  
**Purpose**: Map each client user journey to specific routes, components, and API endpoints

---

## MVP 2: Brand Guide Builder

### Journey 1: Onboard Brand via Website Scrape

#### Route Hierarchy
```
/onboarding (forced flow)
  ├─ Screen1SignUp.tsx (Step 1)
  ├─ Screen2BusinessEssentials.tsx (Step 2) → Creates brand
  ├─ Screen3ExpectationSetting.tsx (Step 3)
  ├─ Screen3AiScrape.tsx (Step 4) → Triggers scrape
  ├─ Screen5BrandSummaryReview.tsx (Step 5) → Reviews Brand Guide
  └─ ... (Steps 6-10)

/app/brands (brand management)
/app/brand-guide (Brand Guide editor)
```

#### API Calls (in order)
1. **POST `/api/brands`** (Step 2)
   - Creates brand record
   - Returns `brandId` (UUID)
   - Body: `{ name, website_url, industry, description, workspace_id }`

2. **POST `/api/crawl/start`** (Step 4)
   - Triggers website crawl
   - Body: `{ url, brand_id, workspaceId, sync: true }`
   - Returns: `{ brandKit, images, colors, voice_summary }`

3. **POST `/api/brand-guide/:brandId`** or **PUT `/api/brand-guide/:brandId`** (Step 4)
   - Saves scraped Brand Guide data
   - Called by `saveBrandGuideFromOnboarding()` in `Screen3AiScrape.tsx`
   - Body: `{ brand_kit, voice_summary, visual_summary, colors, typography }`

4. **GET `/api/brand-guide/:brandId`** (Step 5)
   - Loads Brand Guide for review
   - Returns: Full Brand Guide JSON

5. **PATCH `/api/brand-guide/:brandId`** (Step 5)
   - Saves user edits
   - Body: `{ voice_summary, colors, typography, keywords, ... }`
   - Auto-saves every 2 seconds (debounced)

#### Data Storage
- **Table**: `brands` (column: `brand_kit` JSONB)
- **Table**: `media_assets` (scraped images with `metadata->>'source' = 'scrape'`)
- **RLS**: Scoped by `brand_id` and `tenant_id`

#### Key Components
- `client/pages/onboarding/Screen2BusinessEssentials.tsx` - Brand creation form
- `client/pages/onboarding/Screen3AiScrape.tsx` - Scrape trigger & progress
- `client/pages/onboarding/Screen5BrandSummaryReview.tsx` - Brand Guide review
- `client/app/(postd)/brand-guide/page.tsx` - Brand Guide editor
- `client/hooks/useBrandGuide.ts` - Brand Guide data hook

#### Brand Guide Data Flow
```
Onboarding Scrape
  ↓
POST /api/crawl/start
  ↓
Server: crawlWebsite() → extractColors() → generateBrandKit()
  ↓
POST /api/brand-guide/:brandId (saveBrandGuideFromOnboarding)
  ↓
Supabase: brands.brand_kit JSONB
  ↓
GET /api/brand-guide/:brandId (useBrandGuide hook)
  ↓
UI: Brand Guide page displays data
  ↓
PATCH /api/brand-guide/:brandId (auto-save on edit)
  ↓
Supabase: brands.brand_kit updated
```

---

### Journey 2: Manual Brand Guide Creation

#### Route Hierarchy
```
/app/brands → Create brand (no website)
/app/brand-guide → Manual Brand Guide editor
```

#### API Calls
1. **POST `/api/brands`**
   - Creates brand without `website_url`
   - Returns `brandId`

2. **GET `/api/brand-guide/:brandId`**
   - Loads empty Brand Guide (or existing if edited before)

3. **PUT `/api/brand-guide/:brandId`** or **PATCH `/api/brand-guide/:brandId`**
   - Saves manual inputs:
     - Logo upload → `POST /api/media/upload` first, then save URL
     - Colors → `colors` object
     - Fonts → `typography` object
     - Voice → `voice_summary` object
     - Keywords → `keywords` array

4. **POST `/api/brand-guide/:brandId/generate`** (Regenerate AI Snapshot)
   - Generates AI summary from manual inputs
   - Returns: `{ ai_snapshot }`

#### Data Storage
- **Table**: `brands.brand_kit` JSONB
- **Table**: `media_assets` (uploaded logo/images)

---

## MVP 3: AI Content Generator

### Journey 1: Generate Single Post

#### Route Hierarchy
```
/app/content-generator (ContentGenerator page)
```

#### API Calls (in order)
1. **GET `/api/brand-guide/:brandId`** (on page load)
   - Loads Brand Guide for current brand
   - Used by `useBrandGuide` hook

2. **POST `/api/agents/generate/doc`** (on "Generate" click)
   - Generates content with Doc Agent
   - Body: `{ brandId, topic, platform, contentType, tone, length, callToAction }`
   - Returns: `{ content, headline, cta, hashtags, bfs, linter_results, variants }`

3. **POST `/api/agents/generate/doc`** (on "Regenerate" click)
   - Same endpoint, generates new variant

#### Data Storage
- **Table**: `agent_generations` (optional, for history)
- **In-memory**: Generation result stored in component state
- **Table**: `content_packages` (if user clicks "Save" or "Schedule")

#### Key Components
- `client/app/(postd)/content-generator/page.tsx` - Main page
- `client/components/generation/GenerationResult.tsx` - Result display
- `server/routes/agents.ts` - Doc Agent endpoint
- `server/lib/brand-profile.ts` - Loads Brand Guide for AI context

#### Brand Guide Integration
```
Content Generator Page
  ↓
useBrandGuide() hook
  ↓
GET /api/brand-guide/:brandId
  ↓
POST /api/agents/generate/doc
  ↓
Server: getBrandProfile(brandId) → Reads brands.brand_kit
  ↓
AI Prompt includes: tone, keywords, voice_summary, colors
  ↓
Generated content respects Brand Guide settings
```

---

### Journey 2: Generate 7-Day Content Package

#### Route Hierarchy
```
/onboarding
  ├─ Screen6WeeklyFocus.tsx (Step 6)
  ├─ Screen7ContentGeneration.tsx (Step 7) → Batch generation
  └─ Screen8CalendarPreview.tsx (Step 8) → Calendar view
```

#### API Calls (in order)
1. **POST `/api/onboarding/generate-week`** (Step 7)
   - Generates 7 content items
   - Body: `{ brandId, weeklyFocus, platforms }`
   - Returns: `{ items: [ContentItem, ...] }` (7 items)

2. **POST `/api/content-packages`** (Step 7, after generation)
   - Saves content package to database
   - Body: `{ brand_id, items: [...], status: 'draft' }`

3. **GET `/api/onboarding/content-package/:brandId`** (Step 8)
   - Loads content package for calendar preview
   - Returns: `{ items: [...], scheduled_dates: [...] }`

4. **PATCH `/api/content-packages/:packageId`** (Step 8, on drag & drop)
   - Updates scheduled dates
   - Body: `{ items: [{ id, scheduled_for }, ...] }`

#### Data Storage
- **Table**: `content_packages` (package metadata)
- **Table**: `content_items` (individual items within package)
- **RLS**: Scoped by `brand_id`

#### Key Components
- `client/pages/onboarding/Screen7ContentGeneration.tsx` - Generation UI
- `client/pages/onboarding/Screen8CalendarPreview.tsx` - Calendar preview
- `server/lib/onboarding-content-generator.ts` - Batch generation logic
- `server/routes/onboarding.ts` - Onboarding endpoints

---

## MVP 4: Creative Studio

### Journey 1: Create Design from Template

#### Route Hierarchy
```
/app/studio (CreativeStudio page)
  ├─ CreativeStudioLanding (entry screen)
  ├─ CreativeStudioCanvas (editor)
  └─ CreativeStudioBrandKit (brand assets sidebar)
```

#### API Calls (in order)
1. **GET `/api/brand-guide/:brandId`** (on page load)
   - Loads Brand Guide for brand colors/fonts
   - Used by `useBrandGuide` hook

2. **GET `/api/media/list?brandId=:brandId`** (on page load)
   - Loads brand assets for image selector
   - Returns: `{ assets: [...] }`

3. **GET `/api/media/stock-images/search`** (optional, if user searches stock)
   - Searches stock image library
   - Query: `?query=...&page=1`

4. **POST `/api/creative-studio/save`** (on "Save" click)
   - Saves design to library
   - Body: `{ brand_id, design_json, name, format }`
   - Returns: `{ design_id, url }`

5. **POST `/api/creative-studio/schedule`** (on "Schedule" click)
   - Schedules design for publishing
   - Body: `{ design_id, scheduled_for, platforms }`

#### Data Storage
- **Table**: `designs` or `content_packages` (design metadata)
- **Table**: `media_assets` (uploaded/generated images)
- **Storage**: Supabase Storage bucket (design exports)

#### Key Components
- `client/app/(postd)/studio/page.tsx` - Main Studio page
- `client/components/dashboard/CreativeStudioCanvas.tsx` - Canvas editor
- `client/components/dashboard/CreativeStudioBrandKit.tsx` - Brand kit sidebar
- `client/components/dashboard/CreativeStudioTemplateGrid.tsx` - Template grid
- `server/routes/creative-studio.ts` - Studio API endpoints

#### Brand Guide Integration
```
Studio Page
  ↓
useBrandGuide() hook
  ↓
GET /api/brand-guide/:brandId
  ↓
Brand colors → ColorPickerModal options
Brand fonts → Font selector options
Brand images → ImageSelectorModal options
  ↓
User applies brand style → Uses Brand Guide values
```

---

### Journey 2: Edit Existing Design

#### API Calls
1. **GET `/api/creative-studio/:designId`**
   - Loads existing design
   - Returns: `{ design_json, name, format, ... }`

2. **PATCH `/api/creative-studio/:designId`**
   - Updates design
   - Body: `{ design_json, name, ... }`

---

### Journey 3: Generate Design with AI

#### API Calls
1. **POST `/api/agents/generate/design`**
   - Generates design concepts
   - Body: `{ brandId, prompt, format, aspect_ratio }`
   - Returns: `{ variants: [DesignVariant, ...], bfs }`

2. **POST `/api/creative-studio/save`** (after selecting variant)
   - Saves AI-generated design
   - Body: `{ design_json, source: 'ai', ... }`

---

## MVP 5: Scheduler + Queue + Approvals

### Journey 1: Schedule Content with Approval

#### Route Hierarchy
```
/app/studio → Schedule button
/app/content-generator → Schedule button
/app/calendar → Click day → Schedule modal
/app/approvals → Approval queue
```

#### API Calls (in order)
1. **POST `/api/content-packages`** or **POST `/api/creative-studio/schedule`**
   - Creates scheduled content
   - Body: `{ brand_id, content, scheduled_for, platforms, require_approval: true }`
   - Returns: `{ content_id, status: 'pending_review' }`

2. **GET `/api/agents/review/queue/:brandId`** (on Approvals page load)
   - Loads pending review items
   - Returns: `{ items: [ReviewItem, ...] }`

3. **POST `/api/approvals/approve`** (on "Approve" click)
   - Approves content
   - Body: `{ content_id, comment }`
   - Returns: `{ status: 'approved' }`

4. **POST `/api/approvals/reject`** (on "Reject" click)
   - Rejects content
   - Body: `{ content_id, reason, comment }`
   - Returns: `{ status: 'rejected' }`

5. **GET `/api/calendar?brandId=:brandId`** (on Calendar page load)
   - Loads scheduled content
   - Returns: `{ events: [CalendarEvent, ...] }`

#### Data Storage
- **Table**: `content_packages` (content metadata)
- **Table**: `scheduled_content` (scheduling details)
- **Table**: `approval_threads` (approval history)
- **Table**: `client_comments` (comments on content)
- **RLS**: Scoped by `brand_id`

#### Key Components
- `client/app/(postd)/approvals/page.tsx` - Approval queue
- `client/components/dashboard/ScheduleModal.tsx` - Schedule modal
- `client/app/(postd)/calendar/page.tsx` - Calendar view
- `server/routes/approvals.ts` - Approval endpoints
- `server/routes/calendar.ts` - Calendar endpoints

---

### Journey 2: Queue Management

#### API Calls
1. **GET `/api/content-packages?brandId=:brandId&status=...`**
   - Loads content queue
   - Query params: `status`, `platform`, `brandId`
   - Returns: `{ packages: [...] }`

2. **POST `/api/bulk-approvals`** (bulk approve)
   - Approves multiple items
   - Body: `{ content_ids: [...], action: 'approve' }`

3. **GET `/api/publishing/jobs?brandId=:brandId`**
   - Loads publishing job status
   - Returns: `{ jobs: [{ id, status, permalink, error }, ...] }`

#### Key Components
- `client/app/(postd)/queue/page.tsx` - Queue page
- `server/routes/bulk-approvals.ts` - Bulk actions

---

### Journey 3: Calendar Drag & Drop

#### API Calls
1. **GET `/api/calendar?brandId=:brandId&view=month`**
   - Loads calendar events
   - Returns: `{ events: [...] }`

2. **PATCH `/api/publishing/jobs/:jobId/schedule`** (on drag & drop)
   - Updates scheduled time
   - Body: `{ scheduled_for }`
   - Returns: `{ updated: true }`

#### Key Components
- `client/app/(postd)/calendar/page.tsx` - Calendar
- `client/components/dashboard/MonthCalendarView.tsx` - Month view
- `client/hooks/useDragAndDrop.ts` - Drag & drop logic
- `client/hooks/useRescheduleContent.ts` - Reschedule API call

---

## Cross-MVP Data Flow

### Brand Guide → AI Agents → Studio → Scheduler

```
1. Brand Guide (MVP 2)
   brands.brand_kit JSONB
   ↓
2. AI Content Generator (MVP 3)
   POST /api/agents/generate/doc
   → getBrandProfile(brandId) reads brands.brand_kit
   → AI prompt includes Brand Guide settings
   → Generated content respects tone/colors/keywords
   ↓
3. Creative Studio (MVP 4)
   useBrandGuide() hook
   → Brand colors in ColorPickerModal
   → Brand fonts in font selector
   → Brand images in ImageSelectorModal
   ↓
4. Scheduler (MVP 5)
   POST /api/content-packages
   → Saves content with brand_id
   → RLS ensures brand isolation
   → Approval queue filters by brand_id
```

### Multi-Tenant Isolation

All API endpoints enforce:
- **Authentication**: `authenticateUser` middleware
- **Brand Access**: `assertBrandAccess(brandId, userId)` checks
- **RLS**: Supabase policies filter by `brand_id` and `tenant_id`

Key checks:
- `GET /api/brand-guide/:brandId` → Verifies user has access to brand
- `POST /api/agents/generate/doc` → Requires `brandId`, validates access
- `GET /api/agents/review/queue/:brandId` → Returns only brand's items
- `GET /api/calendar?brandId=:brandId` → Returns only brand's events

---

## API Endpoint Summary

### MVP 2: Brand Guide
- `POST /api/brands` - Create brand
- `POST /api/crawl/start` - Scrape website
- `GET /api/brand-guide/:brandId` - Load Brand Guide
- `PUT /api/brand-guide/:brandId` - Save Brand Guide
- `PATCH /api/brand-guide/:brandId` - Update Brand Guide
- `POST /api/brand-guide/:brandId/generate` - Regenerate AI Snapshot

### MVP 3: AI Generator
- `POST /api/agents/generate/doc` - Generate content
- `POST /api/agents/generate/design` - Generate design
- `POST /api/onboarding/generate-week` - Generate 7-day package
- `GET /api/onboarding/content-package/:brandId` - Load package

### MVP 4: Creative Studio
- `GET /api/brand-guide/:brandId` - Load Brand Guide (for colors/fonts)
- `GET /api/media/list?brandId=:brandId` - Load brand assets
- `POST /api/creative-studio/save` - Save design
- `POST /api/creative-studio/schedule` - Schedule design
- `GET /api/creative-studio/:designId` - Load existing design

### MVP 5: Scheduler + Approvals
- `POST /api/content-packages` - Create content package
- `GET /api/agents/review/queue/:brandId` - Load approval queue
- `POST /api/approvals/approve` - Approve content
- `POST /api/approvals/reject` - Reject content
- `GET /api/calendar?brandId=:brandId` - Load calendar
- `PATCH /api/publishing/jobs/:jobId/schedule` - Reschedule
- `POST /api/bulk-approvals` - Bulk approve/reject

---

## Error Handling Flow

### Common Error Scenarios

1. **Brand Guide Not Found**
   - `GET /api/brand-guide/:brandId` → 404
   - UI: Shows empty state, prompts to create Brand Guide

2. **AI Generation Failure**
   - `POST /api/agents/generate/doc` → 500 or timeout
   - UI: Shows error message, retry button
   - Fallback: Returns cached/default content

3. **Approval Queue Empty**
   - `GET /api/agents/review/queue/:brandId` → `{ items: [] }`
   - UI: Shows "No content to review" empty state

4. **Calendar Load Failure**
   - `GET /api/calendar` → 500
   - UI: Shows error state, retry button

5. **Multi-Tenant Leak Prevention**
   - User tries to access `brandId` they don't own
   - `assertBrandAccess()` throws 403
   - UI: Shows "Access denied" message

