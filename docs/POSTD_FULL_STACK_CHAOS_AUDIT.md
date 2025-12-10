# POSTD Full-Stack Chaos Audit & Failure-Mode Map

> **Status:** ✅ Complete  
> **Date:** 2025-12-10  
> **Auditor:** POSTD Full-Stack Chaos Auditor & Failure-Mode Mapper  
> **Purpose:** Deep system analysis, failure-mode identification, and surgical fix recommendations

---

## Table of Contents

1. [System Map (Flows + Functions)](#1-system-map-flows--functions)
2. [Agent Handoff & Collaboration Map](#2-agent-handoff--collaboration-map)
3. [Flow-by-Flow Failure Analysis](#3-flow-by-flow-failure-analysis)
4. [Agent Contract & Handoff Weak Points](#4-agent-contract--handoff-weak-points)
5. [Ranked Risk List](#5-ranked-risk-list)
6. [Recommended Tests & Fix Plan](#6-recommended-tests--fix-plan)

---

## 1. System Map (Flows + Functions)

### 1A. Top-Level Flow Map

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          POSTD USER JOURNEY                                  │
└─────────────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════╗
║ ONBOARDING + BRAND CREATION                                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   User enters URL                                                             ║
║        ↓                                                                      ║
║   POST /api/crawl/start?sync=true                                             ║
║        ↓                                                                      ║
║   ┌───────────────────────────────────────┐                                  ║
║   │ Brand Crawler (brand-crawler.ts)      │                                  ║
║   │  - Launches Playwright browser        │                                  ║
║   │  - Crawls max 50 pages, depth ≤3      │                                  ║
║   │  - Extracts images, headlines, text   │                                  ║
║   │  - Extracts colors via node-vibrant   │                                  ║
║   │  - Generates AI brand_kit             │                                  ║
║   └───────────────────────────────────────┘                                  ║
║        ↓                                                                      ║
║   persistScrapedImages() → media_assets table                                 ║
║        ↓                                                                      ║
║   UPDATE brands SET brand_kit = {...}                                         ║
║        ↓                                                                      ║
║   Brand created with UUID                                                     ║
║        ↓                                                                      ║
║   POST /api/onboarding/generate-week                                          ║
║        ↓                                                                      ║
║   Content Planning Service generates 8 items                                  ║
║        ↓                                                                      ║
║   INSERT INTO content_items (status: pending_review)                          ║
║        ↓                                                                      ║
║   Items appear in Content Queue                                               ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║ BRAND GUIDE → AGENTS                                                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   getCurrentBrandGuide(brandId)                                               ║
║        ↓                                                                      ║
║   SELECT * FROM brands WHERE id = :brandId                                    ║
║        ↓                                                                      ║
║   normalizeBrandGuide(brand) → BrandGuide type                               ║
║        ↓                                                                      ║
║   buildFullBrandGuidePrompt(brandGuide)                                       ║
║        ↓                                                                      ║
║   [PROMPTS] System prompt + User prompt + Brand context                       ║
║        ↓                                                                      ║
║   Doc Agent / Design Agent / Advisor Agent                                    ║
║        ↓                                                                      ║
║   calculateBrandFidelityScore() → BFS 0-1                                     ║
║        ↓                                                                      ║
║   If BFS < 0.8 → Retry with stricter prompt                                   ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║ CONTENT CREATION FLOWS                                                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   [FLOW A: Onboarding Content]                                                ║
║   POST /api/onboarding/generate-week                                          ║
║        ↓                                                                      ║
║   generateWeeklyContentPackage() → 8 items                                    ║
║        ↓                                                                      ║
║   INSERT INTO content_packages + content_items                                ║
║        ↓                                                                      ║
║   Content visible in Queue immediately                                        ║
║                                                                               ║
║   [FLOW B: Studio AI Generation]                                              ║
║   POST /api/ai/doc                                                            ║
║        ↓                                                                      ║
║   Doc Agent generates 3 variants                                              ║
║        ↓                                                                      ║
║   Response returned to client (ephemeral)                                     ║
║        ↓                                                                      ║
║   User applies variant to canvas                                              ║
║        ↓                                                                      ║
║   POST /api/studio/save → content_items                                       ║
║                                                                               ║
║   [FLOW C: Design Agent]                                                      ║
║   POST /api/ai/design                                                         ║
║        ↓                                                                      ║
║   Reads ContentPackage.copy if provided                                       ║
║        ↓                                                                      ║
║   Generates design variants                                                   ║
║        ↓                                                                      ║
║   Updates ContentPackage.designContext + visuals                              ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║ STUDIO & QUEUE                                                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   Queue Page                                                                  ║
║        ↓                                                                      ║
║   GET /api/content-items?brandId=X                                            ║
║        ↓                                                                      ║
║   SELECT * FROM content_items WHERE brand_id = :brandId                       ║
║        ↓                                                                      ║
║   Display items by status (draft, scheduled, published)                       ║
║                                                                               ║
║   Studio Page                                                                 ║
║        ↓                                                                      ║
║   Load content item for editing                                               ║
║        ↓                                                                      ║
║   User edits → POST /api/studio/save                                          ║
║        ↓                                                                      ║
║   User schedules → creates publishing_job                                     ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║ PUBLISHING                                                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   User schedules post                                                         ║
║        ↓                                                                      ║
║   INSERT INTO publishing_jobs                                                 ║
║        ↓                                                                      ║
║   Scheduler processes jobs at scheduled_for                                   ║
║        ↓                                                                      ║
║   Publishing queue → Platform APIs                                            ║
║        ↓                                                                      ║
║   UPDATE content_items SET status = 'published'                               ║
║        ↓                                                                      ║
║   Analytics sync → analytics_metrics                                          ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 1B. Function-Level Maps (Module by Module)

#### **Brand Crawler & Crawl Route**

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/workers/brand-crawler.ts`, `server/routes/crawler.ts` |
| **Key Exports** | `crawlWebsite()`, `POST /api/crawl/start` |
| **Inputs** | `url`, `brand_id`, `workspaceId` |
| **Outputs** | `CrawlResult[]` with images, headlines, colors, typography |
| **Downstream Deps** | `scraped-images-service.ts` → `media_assets`, `brands.brand_kit` |
| **Called From** | `Screen3AiScrape.tsx` (onboarding), manual crawl triggers |

#### **Brand Guide Service**

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/lib/brand-guide-service.ts`, `shared/brand-guide.ts` |
| **Key Exports** | `getCurrentBrandGuide()`, `saveBrandGuide()`, `normalizeBrandGuide()` |
| **Inputs** | `brandId` (UUID) |
| **Outputs** | `BrandGuide` (normalized type with identity, voiceAndTone, visualIdentity, contentRules) |
| **Downstream Deps** | All AI agents, prompt builders |
| **Called From** | `doc-agent.ts:279`, `design-agent.ts:265`, `advisor.ts:280`, `content-planning-service.ts:58` |

#### **Content Planning Service**

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/lib/content-planning-service.ts` |
| **Key Exports** | `generateContentPlan()`, `generateDefaultContentPlan()` |
| **Inputs** | `brandId`, `tenantId`, Brand Guide, Brand Profile |
| **Outputs** | `ContentPlan` with 8 items (5 social, 1 blog, 1 email, 1 GBP) → `content_items` table |
| **Downstream Deps** | `content-db-service.ts`, AI agents (Doc, Design) |
| **Called From** | `server/routes/content-plan.ts`, onboarding flow |

#### **Doc Agent (Copy Agent)**

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/routes/doc-agent.ts`, `server/lib/copy-agent.ts`, `server/lib/ai/docPrompt.ts` |
| **Key Exports** | `generateDocContent()`, `buildDocSystemPrompt()`, `buildDocUserPrompt()` |
| **Inputs** | `brandId`, `topic`, `platform`, `contentType`, `tone`, `length`, `callToAction` |
| **Outputs** | `AiDocGenerationResponse` with `variants[]`, `metadata`, `brandContext` |
| **Downstream Deps** | `generateWithAI()`, `ContentPackageStorage.save()`, `calculateBrandFidelityScore()` |
| **Called From** | `POST /api/ai/doc`, Studio AI modal |

#### **Design Agent (Creative Agent)**

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/routes/design-agent.ts`, `server/lib/creative-agent.ts`, `server/lib/ai/designPrompt.ts` |
| **Key Exports** | `generateDesignContent()`, `generateDesignConcept()` |
| **Inputs** | `brandId`, `theme`, `aspect_ratio`, `headline`, `platform`, `contentPackageId` |
| **Outputs** | `AiDesignGenerationResponse` with design variants, layout metadata |
| **Downstream Deps** | `ContentPackageStorage.save()`, updates `designContext` + `visuals[]` |
| **Called From** | `POST /api/ai/design`, Pipeline Orchestrator Phase 2 |

#### **Advisor Agent (Strategist)**

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/routes/advisor.ts`, `server/lib/advisor-engine.ts`, `server/lib/ai/advisorPrompt.ts` |
| **Key Exports** | `getAdvisorInsights()`, `calculateReviewScores()` |
| **Inputs** | `brandId`, performance metrics, Brand Guide |
| **Outputs** | `insights[]`, `topics[]`, `best_times[]`, `format_mix`, updates `advisor_cache` |
| **Downstream Deps** | `BrandHistoryStorage.save()`, `advisor_cache` table (24h TTL) |
| **Called From** | `POST /api/ai/advisor`, Pipeline Orchestrator Phases 1, 3, 4 |

#### **Pipeline Orchestrator**

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/lib/pipeline-orchestrator.ts`, `server/routes/orchestration.ts` |
| **Key Exports** | `PipelineOrchestrator`, `executePipelineCycle()` |
| **Inputs** | `brandId`, `CollaborationContext` (optional StrategyBrief, BrandHistory) |
| **Outputs** | `PipelineCycle` with strategy, contentPackage, reviewScores, learnings |
| **Downstream Deps** | `PersistenceService`, `PerformanceTrackingJob`, `CreativeAgent` |
| **Called From** | `POST /api/orchestration/pipeline/execute` |
| **⚠️ NOTE** | `PersistenceService { enabled: false }` by default (line 67) |

#### **BFS Scorer & Content Linter**

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/agents/brand-fidelity-scorer.ts`, `server/lib/brand-fidelity-scorer-enhanced.ts`, `server/agents/content-linter.ts` |
| **Key Exports** | `calculateBrandFidelityScore()`, `BrandFidelityScorer`, `contentLinter()` |
| **Inputs** | Content text, Brand Profile (tone, personality, phrases, banned_phrases) |
| **Outputs** | BFS 0-1 score, `complianceTags[]`, `passed` boolean |
| **Downstream Deps** | Used by all agents for quality validation |
| **Called From** | `doc-agent.ts:341-343`, `design-agent.ts` variant scoring |

#### **Content Items Route**

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/routes/content-items.ts` |
| **Key Exports** | `GET /api/content-items`, `GET /api/content-items/:id` |
| **Inputs** | `brandId` (query), `status`, `platform`, `limit`, `offset` |
| **Outputs** | `{ success, items[], total }` |
| **Downstream Deps** | `supabase.from("content_items")` |
| **Called From** | Queue page (`client/app/(postd)/queue/page.tsx`) |

#### **Creative Studio Routes**

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/routes/creative-studio.ts` |
| **Key Exports** | `POST /api/studio/save`, `PUT /api/studio/update/:id`, `POST /api/studio/schedule/:id` |
| **Inputs** | `SaveDesignRequest` (format, width, height, items[], brandId) |
| **Outputs** | `SaveDesignResponse` with design ID |
| **Downstream Deps** | `content_items` table (uses type="creative_studio") |
| **Called From** | Studio page save/export actions |

#### **Publishing Routes**

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/routes/publishing.ts`, `server/lib/publishing-db-service.ts`, `server/lib/publishing-queue.ts` |
| **Key Exports** | `initiateOAuth()`, `handleOAuthCallback()`, `publishContent()`, `getJobs()` |
| **Inputs** | OAuth tokens, post content, schedule info, platform selection |
| **Outputs** | `PublishingJob` records, OAuth connections |
| **Downstream Deps** | `platform_connections`, `publishing_jobs` tables |
| **Called From** | Studio schedule action, integrations settings |

### 1C. Agent Communication / Handoff Map

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                    AGENT COLLABORATION FLOW                                 │
└────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │     BRAND GUIDE      │ ◀── Source of Truth
                    │   (brands.brand_kit) │     getCurrentBrandGuide()
                    └──────────┬───────────┘
                               │
                               ▼
         ┌─────────────────────┴─────────────────────┐
         │                                           │
         ▼                                           ▼
┌─────────────────┐                       ┌─────────────────┐
│  ADVISOR AGENT  │ ──────────────────▶   │    DOC AGENT    │
│  (Phase 1: Plan)│    StrategyBrief      │ (Phase 2: Copy) │
│                 │                       │                 │
│ Output:         │                       │ Output:         │
│ - StrategyBrief │                       │ - ContentPackage│
│ - Insights[]    │                       │ - 3 variants    │
│                 │                       │ - BFS per var   │
└─────────────────┘                       └────────┬────────┘
                                                   │
                                                   │ ContentPackage.copy
                                                   ▼
                                          ┌─────────────────┐
                                          │  DESIGN AGENT   │
                                          │(Phase 2: Visual)│
                                          │                 │
                                          │ Reads:          │
                                          │ - ContentPackage│
                                          │ - BrandHistory  │
                                          │                 │
                                          │ Outputs:        │
                                          │ - designContext │
                                          │ - visuals[]     │
                                          └────────┬────────┘
                                                   │
                                                   │ Updated ContentPackage
                                                   ▼
                                          ┌─────────────────┐
                                          │  ADVISOR AGENT  │
                                          │(Phase 3: Review)│
                                          │                 │
                                          │ Outputs:        │
                                          │ - ReviewScore   │
                                          │ - 5D scoring    │
                                          └────────┬────────┘
                                                   │
                                                   │ Performance data
                                                   ▼
                                          ┌─────────────────┐
                                          │  ADVISOR AGENT  │
                                          │ (Phase 4: Learn)│
                                          │                 │
                                          │ Outputs:        │
                                          │ - BrandHistory  │
                                          │ - learnings[]   │
                                          └─────────────────┘

STORAGE LOCATIONS:
──────────────────
• StrategyBrief     → strategy_briefs table (brand_id_uuid)
• ContentPackage    → content_packages table (brand_id_uuid)
• BrandHistory      → brand_history table (brand_id_uuid)
• PerformanceLog    → In-memory cache ONLY (not persisted!)
• Content Items     → content_items table (brand_id)
• Generation Logs   → generation_logs table

HANDOFF CONTRACTS:
──────────────────
• Doc Agent → Design Agent: ContentPackage with copy.headline, copy.body, copy.tone
• Advisor → Agents: StrategyBrief with positioning, voice, visual, competitive
• All Agents → BFS: Content text + BrandProfile → score 0-1
• Design Agent → ContentPackage: adds designContext, visuals[] array
```

---

## 2. Agent Handoff & Collaboration Map

### Doc Agent Contract

| Contract Aspect | Details |
|-----------------|---------|
| **Input Contract** | `{ brandId: UUID, topic: string, platform: string, contentType: string, tone?: string, strategyBriefId?: string, contentPackageId?: string }` |
| **Output Contract** | `{ variants: AiDocVariant[], brandContext, metadata: { provider, latencyMs, avgBFS }, warnings? }` |
| **Dependencies** | Brand Guide (`getCurrentBrandGuide`), Brand Profile (`getBrandProfile`), Images (`getPrioritizedImages`) |
| **Persistence** | `ContentPackageStorage.save()` if `requestId` or `contentPackageId` provided |
| **Where Contract Can Break** | 1) Brand Guide returns null → throws `NO_BRAND_GUIDE` error. 2) AI provider fails → fallback to alternate provider. 3) JSON parse failure → returns `parse-error` variant. 4) BFS < 0.8 → triggers retry. |

### Design Agent Contract

| Contract Aspect | Details |
|-----------------|---------|
| **Input Contract** | `{ brandId: UUID, theme?, aspect_ratio?, headline?, platform?, contentPackageId?: string }` |
| **Output Contract** | `{ variants: AiDesignVariant[], metadata, warnings? }` |
| **Dependencies** | Brand Guide, ContentPackage (optional), BrandHistory (optional), PerformanceLog (optional) |
| **Persistence** | Updates `ContentPackage.designContext` + `ContentPackage.visuals[]` |
| **Where Contract Can Break** | 1) ContentPackage not found if `contentPackageId` provided. 2) Missing copy fields → generates with empty copy. 3) BrandHistory/PerformanceLog empty → proceeds without history. |

### Advisor Agent Contract

| Contract Aspect | Details |
|-----------------|---------|
| **Input Contract** | `{ brandId: UUID, metrics?: { timeRange }, strategyBriefId?, contentPackageId? }` |
| **Output Contract** | `{ insights: AdvisorInsight[], topics[], best_times[], format_mix, compliance }` |
| **Dependencies** | Brand Guide, analytics_metrics table, BrandHistory, PerformanceLog |
| **Persistence** | `advisor_cache` (24h TTL), `brand_history` updates |
| **Where Contract Can Break** | 1) Empty analytics → returns empty insights. 2) Cache stale → regenerates. 3) BrandHistory empty → creates new. |

### Pipeline Orchestrator Contract

| Contract Aspect | Details |
|-----------------|---------|
| **Input Contract** | `{ brandId: UUID, context?: Partial<CollaborationContext> }` |
| **Output Contract** | `PipelineCycle { strategy, contentPackage, reviewScores, learnings[], metrics }` |
| **Dependencies** | All agents, `PersistenceService`, `PerformanceTrackingJob` |
| **Persistence** | **⚠️ DISABLED** - `PersistenceService { enabled: false }` at line 67 |
| **Where Contract Can Break** | 1) Any phase throws → cycle.status = "failed". 2) Persistence disabled → data only in memory. 3) CreativeAgent initialization fails → Phase 2 fails. |

### Content Planner Contract

| Contract Aspect | Details |
|-----------------|---------|
| **Input Contract** | `{ brandId: UUID, tenantId?: string }` |
| **Output Contract** | `ContentPlan { items: ContentPlanItem[], advisorRecommendations[], generatedAt }` |
| **Dependencies** | Brand Guide, Brand Profile, scraped images, AI agents |
| **Persistence** | Writes to `content_items` table |
| **Where Contract Can Break** | 1) AI fails completely → uses `generateDefaultContentPlan()`. 2) All items filtered as placeholder → uses fallback. 3) DB write fails → continues but items lost. |

---

## 3. Flow-by-Flow Failure Analysis

### Flow 1: Onboarding + Scraper + Brand Kit

#### Happy Path

1. User enters URL → `POST /api/crawl/start?sync=true` (line 160 crawler.ts)
2. `runCrawlJobSync()` → `crawlWebsite()` (brand-crawler.ts:256)
3. Playwright launches, crawls pages (max 50, depth ≤3)
4. `extractPageContent()` → `extractImages()` → `categorizeImage()`
5. `extractColors()` via node-vibrant
6. `generateBrandKit()` with OpenAI/Anthropic
7. `persistScrapedImages()` → `media_assets` table
8. `UPDATE brands SET brand_kit = {...}`

#### Assumptions

- ✅ Website is accessible (not behind auth, not blocked)
- ✅ Playwright binary available
- ✅ OpenAI/Anthropic API keys valid
- ✅ Brand UUID already exists in `brands` table
- ⚠️ `tenant_id` available for media_assets

#### Failure Modes

| Step | Failure Mode | Code Location | Current Behavior |
|------|--------------|---------------|------------------|
| 2 | Website unreachable | `brand-crawler.ts:290` | Throws, returns partial result |
| 2 | Playwright timeout (60s default) | `brand-crawler.ts:300` | Logs error, continues with partial |
| 3 | Too few pages found | `brand-crawler.ts:350` | Returns what was found |
| 4 | No images extracted | `extractImages()` | Returns empty array → UI shows no images |
| 5 | Color extraction fails | `extractColors()` | Returns empty colors → brand has no palette |
| 6 | AI provider 500/429 | `generateBrandKit()` | **Fallback removed** (line 939) → throws |
| 7 | Missing tenantId | `persistScrapedImages()` | Fails silently, images not saved |
| 8 | Brand not found | `saveBrandGuide()` | Logs and skips (onboarding temp ID) |

#### Impact to User

- **Website unreachable**: "Crawl failed" error, no brand created
- **No images**: Brand Guide shows empty visual identity, content generation lacks context
- **No colors**: Brand colors empty, designs use fallback/generic colors
- **AI fails**: Brand Kit is null, all agent prompts lack brand context

#### Attack Scenarios

1. **Brand has no `website_url`**: Scraper can't run → brand_kit stays null
2. **Website returns 403**: Crawler gets no content → empty brand_kit
3. **All images are social icons**: Filtering removes everything → no brand images

---

### Flow 2: Brand Guide Loading + AI Prompt Building

#### Happy Path

1. Agent calls `getCurrentBrandGuide(brandId)` (brand-guide-service.ts:15)
2. SELECT * FROM brands WHERE id = brandId
3. `normalizeBrandGuide(brand)` → BrandGuide type
4. `buildFullBrandGuidePrompt(brandGuide)` → prompt string
5. Prompt sent to AI provider

#### Assumptions

- ✅ Brand exists in database
- ✅ `brand_kit` JSONB is not null
- ✅ `brand_kit` has required fields (voiceAndTone, identity, etc.)

#### Failure Modes

| Step | Failure Mode | Code Location | Current Behavior |
|------|--------------|---------------|------------------|
| 2 | Brand not found | `brand-guide-service.ts:23` | Returns `null` |
| 2 | Supabase connection error | `brand-guide-service.ts:17` | Catches, returns `null` |
| 3 | `brand_kit` is null | `normalizeBrandGuide()` | Returns empty/default BrandGuide |
| 3 | `brand_kit` missing required fields | `normalizeBrandGuide()` | Uses empty arrays/defaults |
| 4 | BrandGuide has no tone | `buildFullBrandGuidePrompt()` | Prompt says "No tone defined" |

#### Impact to User

- **Brand not found**: Agent throws `NO_BRAND_GUIDE` error (doc-agent.ts:291)
- **Empty brand_kit**: AI generates generic content, not on-brand
- **Missing tone**: Content may not match brand voice

#### Attack Scenarios

1. **Brand created but brand_kit never populated**: Test brands created for RLS testing
2. **Temp brand ID during onboarding**: Brand doesn't exist yet → returns null
3. **brand_kit.colors empty**: Prompts lack color context

---

### Flow 3: Doc Agent (Copy) Flow

#### Happy Path

1. `POST /api/ai/doc` → `generateDocContent()` (doc-agent.ts:234)
2. Validate request with Zod schema (line 241)
3. Load Brand Guide (line 279)
4. Check `hasBrandGuide` (line 282-288)
5. `getBrandProfile()` + `getPrioritizedImages()` (lines 302, 308)
6. Build prompts (lines 311-326)
7. `generateWithAI()` with retry logic (lines 333-486)
8. Parse variants + calculate BFS (lines 337-344)
9. If avgBFS < 0.8, retry with stricter prompt (lines 350-444)
10. Save ContentPackage if collaboration context (lines 388-426)
11. Broadcast completion event (lines 462-473)

#### Assumptions

- ✅ User authenticated (via `authenticateUser` middleware)
- ✅ Brand exists with Brand Guide
- ✅ AI provider available
- ✅ Response is valid JSON array

#### Failure Modes

| Step | Failure Mode | Code Location | Current Behavior |
|------|--------------|---------------|------------------|
| 2 | Zod validation fails | `AiDocGenerationRequestSchema.parse()` | Throws, 400 error |
| 3 | Brand Guide null | `getCurrentBrandGuide()` | `hasBrandGuide = false` |
| 4 | No Brand Guide | Line 290-299 | Throws `NO_BRAND_GUIDE` error |
| 5 | Brand Profile null | `getBrandProfile()` | Returns empty object |
| 5 | No images found | `getPrioritizedImages()` | Returns empty array |
| 7 | Primary provider fails | `generateWithAI()` | Tries fallback provider |
| 7 | Both providers fail | Line 483-484 | Throws error |
| 8 | JSON parse fails | `parseDocVariants()` line 62-96 | Returns `parse-error` variant |
| 9 | Retry fails | Lines 361-444 | Returns low BFS content |
| 10 | ContentPackage save fails | Line 424 | Logs warning, continues |

#### Impact to User

- **No Brand Guide**: "This brand doesn't have a Brand Guide yet" error
- **Parse error**: Single variant with "could not be parsed" message
- **Low BFS after retry**: Content shows warning "Average brand fidelity is X%"

#### Attack Scenarios

1. **Request with invalid brandId**: Zod validates UUID format
2. **Empty topic**: AI generates with minimal context
3. **Platform not in preferredPlatforms**: No validation → generates anyway

---

### Flow 4: Content Planning → content_items → Queue

#### Happy Path

1. `generateContentPlan()` called (content-planning-service.ts:43)
2. Load brand context (lines 58-73)
3. Step 1: Doc Agent completes brand guide (line 84)
4. Step 2: Advisor recommends plan (line 93)
5. Step 3: Creative plans 8 items (line 101)
6. Validate content quality (lines 111-143)
7. Store to `content_items` (line 146)
8. Items appear in Queue with status `pending_review`

#### Assumptions

- ✅ Brand exists with website_url
- ✅ AI providers available
- ✅ All 8 items generate successfully
- ✅ No placeholder content

#### Failure Modes

| Step | Failure Mode | Code Location | Current Behavior |
|------|--------------|---------------|------------------|
| 2 | Brand not found | Line 69-71 | Throws "Brand not found" |
| 3 | Doc Agent fails | Line 234-238 | Returns original brandGuide |
| 4 | Advisor fails | Line 291-294 | Returns empty recommendations |
| 5 | AI completely fails | Lines 356-366 | Uses `generateDefaultContentPlan()` |
| 6 | All items are placeholders | Lines 141-142 | Throws "All generated content items were invalid" |
| 6 | Most items filtered | Lines 130-138 | Uses filtered (fewer) items |
| 7 | DB insert fails | Lines 634-653 | Logs error, continues to next item |

#### Impact to User

- **AI fails**: Default content plan (generic posts) appears in Queue
- **All placeholder**: Error shown, no content generated
- **DB insert fails**: Some items appear in Queue, others silently lost

#### Attack Scenarios

1. **Brand has no industry set**: Content is generic, not industry-specific
2. **AI returns only 2 valid items**: User sees 2 items, not 8
3. **Supabase timeout**: Items generated but not persisted

---

### Flow 5: Studio AI Modal → content_items

#### Happy Path

1. User opens AI Generation Modal in Studio
2. `POST /api/ai/doc` → variants returned
3. User selects variant → applies to canvas
4. User clicks Save → `POST /api/studio/save`
5. Design saved to `content_items` (type: "creative_studio")

#### Assumptions

- ✅ User authenticated with brand access
- ✅ AI responds with valid variants
- ✅ User manually saves (not auto-saved)

#### Failure Modes

| Step | Failure Mode | Code Location | Current Behavior |
|------|--------------|---------------|------------------|
| 2 | AI fails | doc-agent.ts | Error shown in modal |
| 4 | User closes without saving | N/A | Content lost (ephemeral) |
| 5 | Save fails | creative-studio.ts:143-186 | Falls through to mock response |
| 5 | content_items table error | creative-studio.ts:161 | Returns mock (misleading success) |

#### Impact to User

- **AI fails**: Modal shows error, user can retry
- **Doesn't save**: Content lost, user frustrated
- **Mock response**: User thinks save succeeded, but content not in DB

#### Attack Scenarios

1. **User generates but never saves**: Content never persisted
2. **Database connection lost**: Mock response returned → user thinks saved

---

### Flow 6: Publishing (scheduled_content + publishing_jobs)

#### Happy Path

1. User schedules post in Studio
2. `POST /api/publishing/publish` creates job
3. `publishing_jobs` entry created with `scheduled_for`
4. Publishing queue processes at scheduled time
5. Platform API called → post published
6. `content_items.status` → "published"

#### Assumptions

- ✅ Platform connected (OAuth tokens valid)
- ✅ Tokens not expired
- ✅ Platform API available
- ✅ Content meets platform requirements

#### Failure Modes

| Step | Failure Mode | Code Location | Current Behavior |
|------|--------------|---------------|------------------|
| 2 | No platform connection | publishing.ts:160-161 | `assertBrandAccess` passes but no connection |
| 3 | DB insert fails | publishing-db-service.ts | Throws error |
| 4 | Token expired | token-health-checker.ts | Job fails, needs reauth |
| 5 | Platform API 429 | platform-apis.ts | Retry logic (if implemented) |
| 5 | Platform API 401 | platform-apis.ts | Token revoked → needs reauth |
| 6 | Status update fails | N/A | Job marked failed, but content may be live |

#### Impact to User

- **No connection**: Error on schedule attempt
- **Token expired**: Job fails, post not published, notification needed
- **Platform API error**: Post fails, user may not know

---

### Flow 7: Auth + RLS + Multi-tenant Isolation

#### Happy Path

1. User authenticates → JWT issued with `userId`, `brandIds`, `tenantId`
2. Request arrives → `authenticateUser` middleware validates JWT
3. `req.user` populated with context
4. `assertBrandAccess()` verifies brand membership
5. Supabase query includes `brand_id` → RLS enforces

#### Assumptions

- ✅ JWT valid and not expired
- ✅ User is member of requested brand
- ✅ Brand belongs to user's workspace

#### Failure Modes

| Step | Failure Mode | Code Location | Current Behavior |
|------|--------------|---------------|------------------|
| 1 | JWT expired | jwt-auth.ts | 401 Unauthorized |
| 2 | Invalid token | security.ts:17 | jwtAuth throws |
| 3 | Missing userId | security.ts:42 | Logs warning, proceeds |
| 4 | Not brand member | brand-access.ts:78-115 | Throws FORBIDDEN |
| 4 | Brand doesn't exist | brand-access.ts:88-95 | Throws NOT_FOUND |
| 5 | RLS denies | Supabase | Empty results or error |

#### Impact to User

- **JWT expired**: Logged out, redirected to login
- **Not member**: "You don't have access to this brand" error
- **RLS denies**: Empty data returned, confusing empty state

#### Attack Scenarios

1. **JWT brandIds stale**: User added to brand after JWT issued → `assertBrandAccess` checks DB
2. **Cross-tenant access attempt**: `verifyWorkspace` check blocks
3. **Service role bypass needed**: Only for system operations, user tokens can't bypass

---

## 4. Agent Contract & Handoff Weak Points

### Doc → Design Handoff

| Aspect | Analysis |
|--------|----------|
| **Contract Location** | `shared/collaboration-artifacts.ts` → `ContentPackage.copy` |
| **Fields Expected by Design** | `copy.headline`, `copy.body`, `copy.callToAction`, `copy.tone` |
| **Risk: Mismatched Fields** | If Doc outputs `content` instead of `body`, Design gets empty string |
| **Risk: Missing Tone** | Design uses `tone` for color theme hints; empty = default theme |
| **Validation** | ❌ No runtime validation of ContentPackage shape |
| **Fix Needed** | Add Zod schema validation when Design reads ContentPackage |

### Advisor → Others Handoff

| Aspect | Analysis |
|--------|----------|
| **Contract Location** | `shared/collaboration-artifacts.ts` → `StrategyBrief` |
| **StrategyBrief Fields** | `positioning`, `voice`, `visual`, `competitive` |
| **Risk: Empty StrategyBrief** | Orchestrator creates default with empty arrays (lines 108-155) |
| **Risk: Stale Performance Data** | `PerformanceLog` is in-memory only → data lost on restart |
| **Risk: Advisor Cache Stale** | 24h TTL → insights may be outdated |
| **Validation** | StrategyBrief has defaults, but empty values propagate |
| **Fix Needed** | Add completeness check before using StrategyBrief |

### Pipeline Orchestrator Issues

| Aspect | Analysis |
|--------|----------|
| **Persistence Disabled** | `PersistenceService { enabled: false }` at line 67 |
| **Impact** | StrategyBrief, ContentPackage not persisted to DB during pipeline |
| **Race Condition Risk** | Multiple pipelines for same brand could conflict |
| **content_packages Assumption** | Phase 2 creates ContentPackage in memory only |
| **Fix Needed** | Enable persistence or explicitly document limitation |

### Brand Guide Contract Issues

| Aspect | Analysis |
|--------|----------|
| **Canonical Type** | `shared/brand-guide.ts` → `BrandGuide` |
| **Normalization** | `normalizeBrandGuide()` handles legacy → structured conversion |
| **Risk: Legacy Fields** | Code may access `brand.toneKeywords` instead of `brand.voiceAndTone.tone` |
| **Risk: Null brand_kit** | Normalization returns empty BrandGuide, not error |
| **Validation** | ❌ No completeness validation before using BrandGuide |
| **Fix Needed** | Add `validateBrandGuide()` helper to check required fields |

---

## 5. Ranked Risk List

| Risk ID | Area | Severity | Summary |
|---------|------|----------|---------|
| R01 | Pipeline Orchestrator | **HIGH** | `PersistenceService { enabled: false }` → content not saved to DB |
| R02 | Doc Agent | **HIGH** | JSON parse failure returns misleading `parse-error` variant |
| R03 | Content Planning | **HIGH** | AI failure fallback returns generic content without clear indicator |
| R04 | Creative Studio | **HIGH** | Save failure falls through to mock response → user thinks saved |
| R05 | PerformanceLog | **MEDIUM** | In-memory only → data lost on server restart |
| R06 | Brand Guide | **MEDIUM** | No validation of completeness → empty brand_kit passes through |
| R07 | Content Items | **MEDIUM** | DB insert failures logged but not surfaced to user |
| R08 | Publishing | **MEDIUM** | Token expiration not proactively checked before job runs |
| R09 | Doc → Design | **MEDIUM** | No runtime validation of ContentPackage shape |
| R10 | Scraper | **MEDIUM** | AI brand_kit generation failure throws (fallback removed) |
| R11 | Onboarding | **LOW** | Temporary brand ID causes `saveBrandGuide` to skip |
| R12 | Advisor Cache | **LOW** | 24h TTL may return stale insights |

---

## 6. Recommended Tests & Fix Plan

### Phase 1: Add Critical Tests (No Code Changes)

#### R02: Doc Agent Parse Failure Test
**File:** `server/routes/__tests__/doc-agent.test.ts`
```typescript
describe("Doc Agent", () => {
  it("should handle malformed AI response gracefully", async () => {
    // Mock AI to return invalid JSON
    // Verify response contains parse-error variant
    // Verify status is "partial_success" not "failure"
  });
  
  it("should return variants even when BFS is low", async () => {
    // Mock AI to return content with low BFS
    // Verify retry attempted
    // Verify warnings include "low_bfs"
  });
});
```

#### R03: Content Planning Fallback Test
**File:** `server/lib/__tests__/content-planning-service.test.ts`
```typescript
describe("Content Planning", () => {
  it("should use fallback when AI completely fails", async () => {
    // Mock AI to throw on all attempts
    // Verify fallback content is returned
    // Verify items have placeholder indicator
  });
  
  it("should filter placeholder content", async () => {
    // Mock AI to return mix of real and placeholder
    // Verify only real content is stored
  });
});
```

#### R04: Creative Studio Save Test
**File:** `server/routes/__tests__/creative-studio.test.ts`
```typescript
describe("Creative Studio Save", () => {
  it("should return error when DB save fails", async () => {
    // Mock Supabase to return error
    // Verify response is NOT success
    // Verify no mock response returned
  });
});
```

#### R01: Pipeline Orchestrator Test
**File:** `server/lib/__tests__/pipeline-orchestrator.test.ts`
```typescript
describe("Pipeline Orchestrator", () => {
  it("should persist ContentPackage when enabled", async () => {
    // Create orchestrator with { enabled: true }
    // Run full pipeline
    // Verify content_packages has entry
  });
  
  it("should log warning when persistence disabled", async () => {
    // Run pipeline with disabled persistence
    // Verify console.log includes warning
  });
});
```

### Phase 2: Small Surgical Fixes

#### Fix R04: Creative Studio - Remove Mock Fallback
**File:** `server/routes/creative-studio.ts`
**Lines:** 183-200

**Current:**
```typescript
} catch (err) {
  // Fall through to mock response
  console.log("Content items table not available, using mock response");
}

// Safe mock response (matches expected structure)
const mockResponse: SaveDesignResponse = { ... };
```

**Proposed:**
```typescript
} catch (err) {
  console.error("Failed to save design:", err);
  throw new AppError(
    ErrorCode.DATABASE_ERROR,
    "Failed to save design to database",
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    "error",
    { originalError: err instanceof Error ? err.message : String(err) }
  );
}
```

#### Fix R01: Pipeline Orchestrator - Add Warning
**File:** `server/lib/pipeline-orchestrator.ts`
**Line:** 67

**Current:**
```typescript
this.persistenceService = new PersistenceService({ enabled: false });
```

**Proposed:**
```typescript
const persistenceEnabled = process.env.PIPELINE_PERSISTENCE_ENABLED === "true";
this.persistenceService = new PersistenceService({ enabled: persistenceEnabled });

if (!persistenceEnabled) {
  console.warn("[Orchestrator] ⚠️ Persistence DISABLED - ContentPackages will NOT be saved to database");
}
```

#### Fix R06: Brand Guide Validation
**File:** `server/lib/brand-guide-service.ts`
**Add function:**

```typescript
export function validateBrandGuideCompleteness(guide: BrandGuide | null): {
  isComplete: boolean;
  missingFields: string[];
} {
  if (!guide) {
    return { isComplete: false, missingFields: ["entire brand guide"] };
  }
  
  const missing: string[] = [];
  
  if (!guide.voiceAndTone?.tone?.length) missing.push("voiceAndTone.tone");
  if (!guide.visualIdentity?.colors?.length) missing.push("visualIdentity.colors");
  if (!guide.identity?.businessType) missing.push("identity.businessType");
  
  return {
    isComplete: missing.length === 0,
    missingFields: missing,
  };
}
```

### Phase 3: Pipeline Wiring Changes (Optional)

#### Enable Pipeline Persistence by Default
1. Add `PIPELINE_PERSISTENCE_ENABLED=true` to `.env.production`
2. Update `PersistenceService` to use actual Supabase for `strategy_briefs`, `content_packages`
3. Add cleanup job for orphaned records

#### Add PerformanceLog Persistence
1. Create `performance_logs` table migration
2. Update `PerformanceLogStorage` to use Supabase
3. Add retention policy (30 days)

---

## Appendix: Test Commands

```bash
# Run existing tests
pnpm test

# Run specific agent tests
pnpm test -- --grep "Doc Agent"

# Run RLS tests
pnpm test -- server/__tests__/rls_phase1_test.ts

# Run smoke tests
SCRAPER_TEST_BRAND_ID_1=<uuid> pnpm scraper:smoke
pnpm brand-experience:smoke <BRAND_ID>

# Typecheck
pnpm typecheck
```

---

## Appendix: Implemented Fixes (2025-12-10)

This section documents the fixes implemented based on the Chaos Audit recommendations.

### Phase 1: New Test Coverage

| Test File | Risk ID | Coverage |
|-----------|---------|----------|
| `server/__tests__/doc-agent-chaos.test.ts` | R02 | Doc Agent parse error handling, BFS warnings, status determination |
| `server/__tests__/content-planning-chaos.test.ts` | R03 | Content planning fallback behavior, placeholder filtering |
| `server/__tests__/creative-studio-chaos.test.ts` | R04 | Creative Studio save failure handling (before/after fix) |
| `server/__tests__/pipeline-orchestrator-chaos.test.ts` | R01 | Pipeline persistence configuration, env toggle behavior |
| `server/__tests__/brand-guide-completeness.test.ts` | R06 | Brand Guide completeness validation helper |

### Phase 2A: Creative Studio Mock Fallback Removed (R04)

**File:** `server/routes/creative-studio.ts`

**Changes:**
- Removed the `try/catch` wrapper that fell through to mock response on DB failure
- POST `/api/studio/save` now returns proper `AppError` with `DATABASE_ERROR` code on failure
- PUT `/api/studio/:id` now returns proper `AppError` with `NOT_FOUND` or `DATABASE_ERROR` on failure
- Errors include user-friendly suggestion: "Your design could not be saved. Please try again."

**Before (problematic):**
```typescript
} catch (err) {
  console.log("Content items table not available, using mock response");
}
// Mock response returned even on DB failure
```

**After (fixed):**
```typescript
if (contentError) {
  console.error("[CreativeStudio] Failed to save design:", contentError.message);
  throw new AppError(
    ErrorCode.DATABASE_ERROR,
    "Failed to save design to database",
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    "error",
    { originalError: contentError.message },
    "Your design could not be saved. Please try again."
  );
}
```

### Phase 2B: Pipeline Persistence Warning (R01)

**File:** `server/lib/pipeline-orchestrator.ts`

**Changes:**
- Added environment variable toggle: `PIPELINE_PERSISTENCE_ENABLED`
- When set to `"true"`, persistence is enabled
- When not set or set to any other value, persistence remains disabled (safe default)
- Added warning log when persistence is disabled for visibility

**Code:**
```typescript
const persistenceEnabled = process.env.PIPELINE_PERSISTENCE_ENABLED === "true";
this.persistenceService = new PersistenceService({ enabled: persistenceEnabled });

if (!persistenceEnabled) {
  console.warn("[Orchestrator] ⚠️ Persistence DISABLED – pipeline outputs will not be saved to DB");
}
```

**To enable persistence in production:**
```bash
PIPELINE_PERSISTENCE_ENABLED=true
```

### Phase 2C: Brand Guide Completeness Helper (R06)

**File:** `server/lib/brand-guide-service.ts`

**New Function:** `validateBrandGuideCompleteness(guide: BrandGuide | null)`

**Returns:**
```typescript
{
  isComplete: boolean;
  missingFields: string[];
  completenessScore: number; // 0-100
}
```

**Checks for:**
- `voiceAndTone.tone` (critical)
- `visualIdentity.colors` (critical)
- `identity.businessType` (important)
- `identity.industry` (important)
- `voiceAndTone.voiceDescription` (recommended)
- `identity.targetAudience` (recommended)
- `identity.industryKeywords` (recommended)

**Usage:**
```typescript
import { validateBrandGuideCompleteness } from "../lib/brand-guide-service";

const result = validateBrandGuideCompleteness(brandGuide);
if (!result.isComplete) {
  console.warn(`Brand guide is ${result.completenessScore}% complete. Missing: ${result.missingFields.join(", ")}`);
}
```

### Verification

All changes verified with:
- `pnpm typecheck` ✅ (no errors)
- `pnpm test` ✅ (all new tests pass)
- New tests: 5 files, 55+ test cases

---

**END OF CHAOS AUDIT**

*Document generated: 2025-12-10*
*Based on comprehensive analysis of POSTD repository*
*Fixes implemented: 2025-12-10*

