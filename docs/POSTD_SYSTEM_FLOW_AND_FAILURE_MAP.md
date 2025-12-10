# POSTD System Flow and Failure Mode Map

> **Status:** ✅ Active — Living audit document for system flows, agent handoffs, and failure modes  
> **Date:** 2025-12-10  
> **Auditor:** POSTD Full-Stack Flow & Failure-Mode Auditor  
> **Purpose:** Executable-level brain map of how POSTD works, where it can break, and what to fix

---

## Table of Contents

1. [Phase 0 Summary: What the Docs Say](#1-phase-0-summary-what-the-docs-say)
2. [System Flow Map (End-to-End)](#2-system-flow-map-end-to-end)
3. [Function-Level Index (By Module)](#3-function-level-index-by-module)
4. [Agent Communication & Handoff Map](#4-agent-communication--handoff-map)
5. [Flow-by-Flow Failure Analysis](#5-flow-by-flow-failure-analysis)
6. [Ranked Risk List](#6-ranked-risk-list)
7. [Suggested Tests & Pre-Fix Targets](#7-suggested-tests--pre-fix-targets)
8. [Onboarding Auto-Workflow (Feature)](#8-onboarding-auto-workflow-feature)

---

## 1. Phase 0 Summary: What the Docs Say

### 1.1 Main Flows (From Documentation)

Based on `POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md`, `POSTD_AI_AGENTS_AND_CONTENT_FLOW.md`, and `MULTI_AGENT_SYSTEM_SUMMARY.md`:

#### **Flow A: Brand Setup (Onboarding)**
1. User enters website URL
2. Crawler runs (extracts images, colors, typography, voice)
3. Brand Guide generated from scraped data
4. Brand Brain initialized (Brand Guide is source of truth)

#### **Flow B: Creative Studio**
1. Select: Blank Canvas / Templates / AI → Canvas
2. Edit design
3. Save design
4. Export or schedule

#### **Flow C: AI Content Generation**
1. User provides prompt OR brand guide context OR idea generator
2. AI produces branded posts, carousels, reels ideas, captions, emails/blogs

#### **Flow D: Scheduling & Publishing**
1. User connects accounts (TikTok, Instagram, Facebook, LinkedIn, Google Business)
2. Chooses date/time
3. Schedules content
4. Sees it in calendar
5. Receives approval-flow notifications

#### **Flow E: Client Approval**
1. Creator sends for approval
2. Client receives portal view
3. Approve/deny
4. Content moves to next state

### 1.2 Current Orchestration Model & Agent Roles

From `POSTD_AGENT_ORCHESTRATION_AND_HANDOFF.md`:

| Agent | Also Known As | Primary Role |
|-------|---------------|--------------|
| **Doc Agent** | The Copywriter, Content Engine | Generates on-brand text content |
| **Design Agent** | The Creative, Creative Studio | Creates visual concepts and layouts |
| **Advisor Agent** | The Strategist | Provides insights, recommendations, strategic guidance |
| **Pipeline Orchestrator** | — | Coordinates Plan → Create → Review → Learn |
| **Content Planner** | — | Generates 7-day content plans via AI agents |
| **BFS Scorer** | Brand Fidelity Scorer | Calculates 0-1 brand alignment score |
| **Content Linter** | — | Safety/compliance checks |

All agents:
- ✅ Load Brand Guide via `getCurrentBrandGuide()` (source of truth)
- ✅ Use structured prompts via `buildFullBrandGuidePrompt()`
- ✅ Implement provider fallback (OpenAI → Anthropic → deterministic)
- ✅ Store outputs in collaboration artifacts
- ✅ Calculate Brand Fidelity Score (BFS) for quality assurance

### 1.3 Top Risks Already Identified (R01–R12)

From `POSTD_FULL_STACK_CHAOS_AUDIT.md`:

| Risk ID | Area | Severity | Summary | Current Status |
|---------|------|----------|---------|----------------|
| **R01** | Pipeline Orchestrator | HIGH | Persistence disabled by default → env var control added | ✅ FIXED |
| **R02** | Doc Agent | HIGH | JSON parse failure returns misleading `parse-error` variant | ⚠️ DOCUMENTED |
| **R03** | Content Planning | HIGH | AI failure fallback returns generic content | ⚠️ DOCUMENTED |
| **R04** | Creative Studio | HIGH | Save failure returned mock response | ✅ FIXED |
| **R05** | PerformanceLog | MEDIUM | In-memory only → data lost on restart | ⚠️ BY DESIGN |
| **R06** | Brand Guide | MEDIUM | No completeness validation | ✅ FIXED |
| **R07** | Content Items | MEDIUM | DB insert failures logged but not surfaced | ⚠️ NEEDS REVIEW |
| **R08** | Publishing | MEDIUM | Token expiration not proactively checked | ⚠️ NEEDS REVIEW |
| **R09** | Doc → Design | MEDIUM | No runtime validation of ContentPackage shape | ⚠️ NEEDS FIX |
| **R10** | Scraper | MEDIUM | AI brand_kit generation failure throws | ⚠️ DOCUMENTED |
| **R11** | Onboarding | LOW | Temporary brand ID causes save to skip | ✅ BY DESIGN |
| **R12** | Advisor Cache | LOW | 24h TTL may return stale insights | ⚠️ ACCEPTABLE |

---

## 2. System Flow Map (End-to-End)

### 2.1 Top-Level Flow Map

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          POSTD USER JOURNEY                                  │
└─────────────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════╗
║ FLOW 1: ONBOARDING + BRAND CREATION (AUTO-WIRED)                             ║
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
║   ┌───────────────────────────────────────┐                                  ║
║   │ ✅ AUTO-TRIGGERED (if real UUID +     │                                  ║
║   │    tenantId present):                 │                                  ║
║   │    runOnboardingWorkflow()            │                                  ║
║   │    (async, non-blocking)              │                                  ║
║   └───────────────────────────────────────┘                                  ║
║        ↓                                                                      ║
║   Onboarding Workflow runs 6 steps:                                           ║
║   1. Crawler (skipped if just ran)                                            ║
║   2. Brand Guide generation                                                   ║
║   3. Content Strategy                                                         ║
║   4. Sample Content                                                           ║
║   5. Brand Narrative Summary                                                  ║
║   6. Content Planning (8 items)                                               ║
║        ↓                                                                      ║
║   INSERT INTO content_items (status: draft)                                   ║
║        ↓                                                                      ║
║   8 Items appear in Content Queue:                                            ║
║   - 5 social posts (Instagram, Facebook, LinkedIn, Twitter, GBP)              ║
║   - 1 blog post                                                               ║
║   - 1 email                                                                   ║
║   - 1 Google Business Profile post                                            ║
║                                                                               ║
║   Response includes:                                                          ║
║   {                                                                           ║
║     success: true,                                                            ║
║     brandKit: {...},                                                          ║
║     onboarding: {                                                             ║
║       triggered: true,                                                        ║
║       status: "triggered",                                                    ║
║       jobId: "onboarding-xxx",                                                ║
║       message: "Onboarding workflow started in background..."                 ║
║     }                                                                         ║
║   }                                                                           ║
║                                                                               ║
║   NOTE: If brandId is temporary (brand_xxx) or no tenantId,                   ║
║   onboarding is skipped and triggered: false is returned.                     ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║ FLOW 2: BRAND GUIDE → AGENTS                                                  ║
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
║ FLOW 3: CONTENT CREATION (3 PATHS)                                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   [PATH A: Onboarding Content Plan]                                           ║
║   POST /api/orchestration/onboarding/run-all                                  ║
║        ↓                                                                      ║
║   runOnboardingWorkflow() → ContentPlanningService                            ║
║        ↓                                                                      ║
║   generateContentPlan() → 8 items (5 social, 1 blog, 1 email, 1 GBP)         ║
║        ↓                                                                      ║
║   INSERT INTO content_items                                                   ║
║                                                                               ║
║   [PATH B: Studio AI Generation]                                              ║
║   POST /api/agents/generate/doc                                               ║
║        ↓                                                                      ║
║   Doc Agent generates 3 variants (ephemeral)                                  ║
║        ↓                                                                      ║
║   User applies variant to canvas                                              ║
║        ↓                                                                      ║
║   POST /api/studio/save → content_items                                       ║
║                                                                               ║
║   [PATH C: Pipeline Orchestrator]                                             ║
║   POST /api/orchestration/pipeline/execute                                    ║
║        ↓                                                                      ║
║   Phase 1: Plan (Advisor → StrategyBrief)                                     ║
║   Phase 2: Create (Doc + Design → ContentPackage)                             ║
║   Phase 3: Review (Advisor → 5D Scoring)                                      ║
║   Phase 4: Learn (Advisor → BrandHistory)                                     ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║ FLOW 4: STUDIO & QUEUE                                                        ║
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
║   User edits → POST /api/studio/save or PUT /api/studio/:id                   ║
║        ↓                                                                      ║
║   User schedules → creates publishing_job                                     ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║ FLOW 5: PUBLISHING                                                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   User schedules post                                                         ║
║        ↓                                                                      ║
║   INSERT INTO publishing_jobs (scheduled_for, platform, content_id)           ║
║        ↓                                                                      ║
║   Scheduler processes jobs at scheduled_for                                   ║
║        ↓                                                                      ║
║   Publishing queue → Platform APIs (TikTok, IG, FB, LinkedIn, GBP)            ║
║        ↓                                                                      ║
║   UPDATE content_items SET status = 'published'                               ║
║        ↓                                                                      ║
║   Analytics sync → analytics_metrics table                                    ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║ FLOW 6: ANALYTICS → ADVISOR FEEDBACK LOOP                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   Post published and analytics collected                                      ║
║        ↓                                                                      ║
║   PerformanceLog updated with metrics                                         ║
║        ↓                                                                      ║
║   POST /api/advisor/insights                                                  ║
║        ↓                                                                      ║
║   Advisor Agent analyzes PerformanceLog + BrandHistory                        ║
║        ↓                                                                      ║
║   Generates insights with recommendations                                     ║
║        ↓                                                                      ║
║   Updates BrandHistory with learnings                                         ║
║        ↓                                                                      ║
║   Insights displayed in Advisor dashboard                                     ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 2.2 Agent Collaboration Flow

```text
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
```

---

## 3. Function-Level Index (By Module)

### 3.1 Brand Crawler & Crawl Route

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/workers/brand-crawler.ts`, `server/routes/crawler.ts` |
| **Key Exports** | `crawlWebsite()`, `extractColors()`, `generateBrandKit()`, `persistScrapedImages()` |
| **Route** | `POST /api/crawl/start` (authenticated) |
| **Inputs** | `{ url, brand_id, workspaceId, sync }` |
| **Outputs** | `{ success, brandKit, status }` or `{ job_id, status }` |
| **Persistence** | `media_assets`, `brands.brand_kit` |
| **Called From** | Onboarding screen (`Screen3AiScrape.tsx`), manual triggers |
| **Callees** | `crawlWebsite()` → `extractColors()` → `generateBrandKit()` → `persistScrapedImages()` |

**Key Functions:**

| Function | Location | Purpose | I/O |
|----------|----------|---------|-----|
| `crawlWebsite(url)` | `brand-crawler.ts:256` | Main crawl orchestrator | URL → CrawlResult[] |
| `extractPageContent(page)` | `brand-crawler.ts:400` | Extract text/images from page | Playwright page → PageContent |
| `extractColors(url)` | `brand-crawler.ts:2350` | Color palette extraction | URL → ColorPalette |
| `generateBrandKit(data)` | `brand-crawler.ts:~900` | AI brand story generation | CrawlResult → BrandKit |
| `persistScrapedImages(brandId, tenantId, images)` | `scraped-images-service.ts` | Save images to DB | Images → void |

---

### 3.2 Brand Guide Service

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/lib/brand-guide-service.ts`, `shared/brand-guide.ts` |
| **Key Exports** | `getCurrentBrandGuide()`, `saveBrandGuide()`, `normalizeBrandGuide()`, `validateBrandGuideCompleteness()` |
| **Inputs** | `brandId` (UUID) |
| **Outputs** | `BrandGuide` (normalized type) |
| **Persistence** | `brands.brand_kit` (JSONB), `brands.voice_summary`, `brands.visual_summary` |
| **Called From** | All agents, prompt builders, content planning |

**Key Functions:**

| Function | Location | Purpose | I/O |
|----------|----------|---------|-----|
| `getCurrentBrandGuide(brandId)` | `brand-guide-service.ts:109` | Load Brand Guide from DB | brandId → BrandGuide \| null |
| `saveBrandGuide(brandId, guide)` | `brand-guide-service.ts:133` | Save Brand Guide to DB | (brandId, BrandGuide) → void |
| `normalizeBrandGuide(brand)` | `shared/brand-guide.ts` | Convert legacy → structured | DB row → BrandGuide |
| `validateBrandGuideCompleteness(guide)` | `brand-guide-service.ts:27` | Check required fields | BrandGuide → CompletenessResult |

---

### 3.3 Content Planning Service

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/lib/content-planning-service.ts` |
| **Key Exports** | `generateContentPlan()`, `generateDefaultContentPlan()` |
| **Inputs** | `brandId`, `tenantId`, Brand Guide, Brand Profile |
| **Outputs** | `ContentPlan` with 8 items (5 social, 1 blog, 1 email, 1 GBP) |
| **Persistence** | `content_items` table |
| **Called From** | Onboarding orchestrator, content plan routes |
| **Callees** | `completeBrandGuideWithDocAgent()`, `getAdvisorRecommendations()`, `planContentWithCreativeAgent()` |

**Key Functions:**

| Function | Location | Purpose | I/O |
|----------|----------|---------|-----|
| `generateContentPlan(brandId, tenantId)` | `:43` | Main content plan generator | brandId → ContentPlan |
| `completeBrandGuideWithDocAgent()` | `:177` | Doc Agent fills brand guide gaps | context → completedGuide |
| `getAdvisorRecommendations()` | `:~200` | Advisor recommends plan | context → recommendations[] |
| `planContentWithCreativeAgent()` | `:~300` | Creative plans 8 items | context → ContentPlanItem[] |
| `storeContentItems()` | `:~400` | Save to content_items | items → storedItems[] |
| `generateDefaultContentPlan()` | `:483` | Fallback when AI fails | brandName → ContentPlan |

---

### 3.4 Doc Agent (Copywriter)

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/routes/doc-agent.ts`, `server/lib/copy-agent.ts`, `server/lib/ai/docPrompt.ts` |
| **Routes** | `POST /api/ai/doc` (legacy), `POST /api/agents/generate/doc` (canonical) |
| **Inputs** | `{ brandId, topic, platform, contentType, tone, strategyBriefId?, contentPackageId? }` |
| **Outputs** | `{ variants[], brandContext, metadata, warnings, status }` |
| **Persistence** | `content_packages` (if collaboration context), `generation_logs` |
| **Callees** | `getCurrentBrandGuide()`, `getBrandProfile()`, `generateWithAI()`, `calculateBrandFidelityScore()` |

**Key Functions:**

| Function | Location | Purpose | I/O |
|----------|----------|---------|-----|
| `generateDocContent()` | `doc-agent.ts:234` | Main handler | Request → Response |
| `parseDocVariants(content)` | `doc-agent.ts:61` | Parse AI JSON response | string → AiDocVariant[] |
| `buildDocSystemPrompt()` | `docPrompt.ts` | Build system prompt | context → string |
| `buildDocUserPrompt()` | `docPrompt.ts` | Build user prompt | request → string |
| `buildDocRetryPrompt()` | `docPrompt.ts` | Build stricter retry prompt | issues → string |

---

### 3.5 Design Agent (Creative)

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/routes/design-agent.ts`, `server/lib/creative-agent.ts`, `server/lib/ai/designPrompt.ts` |
| **Routes** | `POST /api/ai/design`, `POST /api/agents/generate/design` |
| **Inputs** | `{ brandId, theme?, aspect_ratio?, headline?, platform?, contentPackageId? }` |
| **Outputs** | `{ variants[], metadata, warnings }` |
| **Persistence** | Updates `content_packages.designContext` and `content_packages.visuals[]` |
| **Callees** | `getCurrentBrandGuide()`, `ContentPackageStorage.get()`, `BrandHistoryStorage.get()` |

**Key Functions:**

| Function | Location | Purpose | I/O |
|----------|----------|---------|-----|
| `generateDesignContent()` | `design-agent.ts:265` | Main handler | Request → Response |
| `CreativeAgent.generateDesignConcept()` | `creative-agent.ts` | Core design logic | CollaborationContext → DesignOutput |

---

### 3.6 Advisor Agent (Strategist)

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/routes/advisor.ts`, `server/lib/advisor-engine.ts`, `server/lib/ai/advisorPrompt.ts` |
| **Routes** | `POST /api/ai/advisor`, `POST /api/advisor/insights` |
| **Inputs** | `{ brandId, metrics?, strategyBriefId?, contentPackageId? }` |
| **Outputs** | `{ insights[], topics[], best_times[], format_mix, compliance }` |
| **Persistence** | `advisor_cache` (24h TTL), `brand_history` |
| **Callees** | `getCurrentBrandGuide()`, `PerformanceLogStorage.get()`, `BrandHistoryStorage.get()` |

**Key Functions:**

| Function | Location | Purpose | I/O |
|----------|----------|---------|-----|
| `getAdvisorInsights()` | `advisor.ts:280` | Main handler | Request → Response |
| `calculateReviewScores()` | `advisor-review-scorer.ts` | 5D content scoring | content → ReviewScore |
| `generateReflectionQuestion()` | `advisor-reflection-generator.ts` | Generate reflection Q | scores → Question |

---

### 3.7 Pipeline Orchestrator

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/lib/pipeline-orchestrator.ts`, `server/routes/orchestration.ts` |
| **Routes** | `POST /api/orchestration/pipeline/execute`, `POST /api/orchestration/onboarding/run-all` |
| **Inputs** | `{ brandId, context?: Partial<CollaborationContext> }` |
| **Outputs** | `PipelineCycle { strategy, contentPackage, reviewScores, learnings[], metrics }` |
| **Persistence** | Via `PersistenceService` (⚠️ disabled by default - use `PIPELINE_PERSISTENCE_ENABLED=true`) |
| **Callees** | `CreativeAgent`, `calculateReviewScores()`, `PersistenceService`, `PerformanceTrackingJob` |

**Key Functions:**

| Function | Location | Purpose | I/O |
|----------|----------|---------|-----|
| `executeFullPipeline(context)` | `pipeline-orchestrator.ts:533` | Run full cycle | context → PipelineCycle |
| `phase1_Plan(context)` | `:103` | Advisor generates StrategyBrief | → StrategyBrief |
| `phase2_Create(strategy, context)` | `:209` | Doc + Design generate ContentPackage | → ContentPackage |
| `phase3_Review(contentPackage, context)` | `:308` | Advisor scores content | → ReviewScore |
| `phase4_Learn(contentPackage, scores, history)` | `:393` | Update BrandHistory | → BrandHistory |

---

### 3.8 Creative Studio Routes

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/routes/creative-studio.ts` |
| **Routes** | `POST /api/studio/save`, `PUT /api/studio/:id`, `POST /api/studio/:id/schedule` |
| **Inputs** | `SaveDesignRequest { format, width, height, items[], brandId }` |
| **Outputs** | `SaveDesignResponse { success, design }` |
| **Persistence** | `content_items` table (type="creative_studio") |

**Key Functions:**

| Function | Location | Purpose | I/O |
|----------|----------|---------|-----|
| `POST /save` handler | `:105` | Save new design | Request → Response |
| `PUT /:id` handler | `:210` | Update existing design | Request → Response |
| `POST /:id/schedule` handler | `:~350` | Schedule design | Request → Response |

---

### 3.9 Publishing Routes

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/routes/publishing.ts`, `server/routes/publishing-router.ts`, `server/lib/publishing-queue.ts` |
| **Routes** | `POST /api/publishing/oauth/:platform`, `POST /api/publishing/publish`, `GET /api/publishing/jobs` |
| **Inputs** | OAuth tokens, post content, schedule info, platform selection |
| **Outputs** | `PublishingJob` records, OAuth connections |
| **Persistence** | `platform_connections`, `publishing_jobs` tables |

---

### 3.10 BFS Scorer & Content Linter

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/agents/brand-fidelity-scorer.ts`, `server/lib/brand-fidelity-scorer-enhanced.ts`, `server/agents/content-linter.ts` |
| **Key Exports** | `calculateBrandFidelityScore()`, `BrandFidelityScorer`, `contentLinter()` |
| **Inputs** | Content text, Brand Profile (tone, personality, phrases, banned_phrases) |
| **Outputs** | BFS 0-1 score, `complianceTags[]`, `passed` boolean |
| **Called From** | Doc Agent, Design Agent, Advisor Agent |

**Key Functions:**

| Function | Location | Purpose | I/O |
|----------|----------|---------|-----|
| `calculateBrandFidelityScore(content, profile)` | `brandFidelity.ts` | Calculate BFS | (content, profile) → score |
| `BrandFidelityScorer.score(content)` | `brand-fidelity-scorer.ts` | Enhanced scoring | content → BFSResult |
| `contentLinter(content, config)` | `content-linter.ts` | Safety/compliance | content → LintResult |

---

### 3.11 Collaboration Storage

| Aspect | Details |
|--------|---------|
| **Key Files** | `server/lib/collaboration-storage.ts`, `shared/collaboration-artifacts.ts` |
| **Key Exports** | `StrategyBriefStorage`, `ContentPackageStorage`, `BrandHistoryStorage`, `PerformanceLogStorage` |
| **Persistence** | `strategy_briefs`, `content_packages`, `brand_history` tables; `PerformanceLog` is in-memory only |

---

## 4. Agent Communication & Handoff Map

### 4.1 Doc Agent Contract

| Contract Aspect | Details |
|-----------------|---------|
| **Input Contract** | `{ brandId: UUID, topic: string, platform: string, contentType: string, tone?: string, strategyBriefId?: string, contentPackageId?: string }` |
| **Required Fields** | `brandId`, `topic`, `platform`, `contentType` |
| **Optional Context** | `strategyBriefId` (loads StrategyBrief), `contentPackageId` (for refinement) |
| **Output Contract** | `{ variants: AiDocVariant[], brandContext, metadata: { provider, latencyMs, avgBFS }, warnings?, status }` |
| **Persistence** | `ContentPackageStorage.save()` if `requestId` or `contentPackageId` provided |
| **Runtime Invariants** | - Brand Guide MUST exist (throws `NO_BRAND_GUIDE` if null) - AI response MUST be parseable JSON (falls back to `parse-error` variant) |

**Where Contract Can Break:**

1. Brand Guide returns null → throws `NO_BRAND_GUIDE` error
2. AI provider fails → fallback to alternate provider
3. JSON parse failure → returns `parse-error` variant (R02)
4. BFS < 0.8 → triggers retry with stricter prompt

---

### 4.2 Design Agent Contract

| Contract Aspect | Details |
|-----------------|---------|
| **Input Contract** | `{ brandId: UUID, theme?, aspect_ratio?, headline?, platform?, contentPackageId?: string }` |
| **Required Fields** | `brandId` |
| **Optional Context** | `contentPackageId` (loads ContentPackage with copy), `BrandHistory`, `PerformanceLog` |
| **Output Contract** | `{ variants: AiDesignVariant[], metadata, warnings? }` |
| **Persistence** | Updates `ContentPackage.designContext` + `ContentPackage.visuals[]` |
| **Runtime Invariants** | - Brand Guide MUST exist - If `contentPackageId` provided, expects `ContentPackage.copy` with headline/body |

**Where Contract Can Break:**

1. ContentPackage not found if `contentPackageId` provided → proceeds without copy context
2. Missing copy fields → generates with empty copy (R09)
3. BrandHistory/PerformanceLog empty → proceeds without history

---

### 4.3 Advisor Agent Contract

| Contract Aspect | Details |
|-----------------|---------|
| **Input Contract** | `{ brandId: UUID, metrics?: { timeRange }, strategyBriefId?, contentPackageId? }` |
| **Required Fields** | `brandId` |
| **Optional Context** | Analytics metrics, StrategyBrief, ContentPackage |
| **Output Contract** | `{ insights: AdvisorInsight[], topics[], best_times[], format_mix, compliance }` |
| **Persistence** | `advisor_cache` (24h TTL), `brand_history` updates |
| **Runtime Invariants** | - Brand Guide SHOULD exist (gracefully degrades if null) - Returns empty insights if no analytics data |

**Where Contract Can Break:**

1. Empty analytics → returns empty insights (graceful)
2. Cache stale → regenerates (acceptable)
3. BrandHistory empty → creates new

---

### 4.4 Pipeline Orchestrator Contract

| Contract Aspect | Details |
|-----------------|---------|
| **Input Contract** | `{ brandId: UUID, context?: Partial<CollaborationContext> }` |
| **Required Fields** | `brandId` |
| **Output Contract** | `PipelineCycle { strategy, contentPackage, reviewScores, learnings[], metrics }` |
| **Persistence** | **⚠️ DISABLED BY DEFAULT** - Set `PIPELINE_PERSISTENCE_ENABLED=true` |
| **Runtime Invariants** | - Brand Guide MUST exist (returns 400 if not found) - All 4 phases must complete for status = "complete" |

**Where Contract Can Break:**

1. Any phase throws → cycle.status = "failed"
2. Persistence disabled → data only in memory (R01 - now has env var control)
3. CreativeAgent initialization fails → Phase 2 fails

---

### 4.5 Content Planner Contract

| Contract Aspect | Details |
|-----------------|---------|
| **Input Contract** | `{ brandId: UUID, tenantId?: string }` |
| **Required Fields** | `brandId` |
| **Output Contract** | `ContentPlan { items: ContentPlanItem[], advisorRecommendations[], generatedAt }` |
| **Persistence** | `content_items` table |
| **Runtime Invariants** | - Brand MUST exist in DB - Filters placeholder content (< 50 chars or contains "placeholder") |

**Where Contract Can Break:**

1. AI fails completely → uses `generateDefaultContentPlan()` (R03)
2. All items filtered as placeholder → throws error
3. DB write fails → logs error, continues (some items lost)

---

### 4.6 Doc → Design Handoff

| Aspect | Analysis |
|--------|----------|
| **Contract Location** | `shared/collaboration-artifacts.ts` → `ContentPackage.copy` |
| **Fields Expected by Design** | `copy.headline`, `copy.body`, `copy.callToAction`, `copy.tone` |
| **Risk: Mismatched Fields** | If Doc outputs `content` instead of `body`, Design gets empty string |
| **Risk: Missing Tone** | Design uses `tone` for color theme hints; empty = default theme |
| **Validation** | ❌ No runtime validation of ContentPackage shape |
| **Fix Needed** | Add Zod schema validation when Design reads ContentPackage (R09) |

---

### 4.7 Advisor → Others Handoff

| Aspect | Analysis |
|--------|----------|
| **Contract Location** | `shared/collaboration-artifacts.ts` → `StrategyBrief` |
| **StrategyBrief Fields** | `positioning`, `voice`, `visual`, `competitive` |
| **Risk: Empty StrategyBrief** | Orchestrator creates default with empty arrays |
| **Risk: Stale Performance Data** | `PerformanceLog` is in-memory only → data lost on restart (R05) |
| **Risk: Advisor Cache Stale** | 24h TTL → insights may be outdated (R12) |

---

## 5. Flow-by-Flow Failure Analysis

### 5.1 Flow 1: Onboarding + Scraper + Brand Kit

#### Assumptions
- ✅ Website is accessible (not behind auth, not blocked)
- ✅ Playwright binary available
- ✅ OpenAI/Anthropic API keys valid
- ✅ Brand UUID or temp ID exists
- ⚠️ `tenantId` available for media_assets persistence

#### Failure Modes

| Step | Failure Mode | Code Location | Current Behavior | Impact |
|------|--------------|---------------|------------------|--------|
| 2 | Website unreachable | `brand-crawler.ts:290` | Throws, returns partial result | Crawl fails |
| 2 | Playwright timeout (60s) | `brand-crawler.ts:300` | Logs error, continues with partial | Some pages missed |
| 3 | Too few pages found | `brand-crawler.ts:350` | Returns what was found | Thin brand data |
| 4 | No images extracted | `extractImages()` | Returns empty array | UI shows no images |
| 5 | Color extraction fails | `extractColors()` | Returns empty colors | No brand palette |
| 6 | AI provider 500/429 | `generateBrandKit()` | Throws (no fallback) | Brand Kit null (R10) |
| 7 | Missing tenantId | `persistScrapedImages()` | Logs error, skips | Images not saved |
| 8 | Brand not found | `saveBrandGuide()` | Logs and skips | Brand Guide not saved |

#### Attack Scenarios

1. **Brand has no `website_url`**: Scraper can't run → brand_kit stays null
2. **Website returns 403**: Crawler gets no content → empty brand_kit
3. **All images are social icons**: Filtering removes everything → no brand images

---

### 5.2 Flow 2: Brand Guide Loading + AI Prompt Building

#### Assumptions
- ✅ Brand exists in database
- ✅ `brand_kit` JSONB is not null
- ✅ `brand_kit` has required fields

#### Failure Modes

| Step | Failure Mode | Code Location | Current Behavior | Impact |
|------|--------------|---------------|------------------|--------|
| 1 | Brand not found | `brand-guide-service.ts:117` | Returns `null` | Agent throws NO_BRAND_GUIDE |
| 2 | Supabase connection error | `brand-guide-service.ts:111` | Catches, returns `null` | Agent throws |
| 3 | `brand_kit` is null | `normalizeBrandGuide()` | Returns empty BrandGuide | Generic content |
| 4 | Missing required fields | `normalizeBrandGuide()` | Uses empty arrays/defaults | Weak prompts |

#### Attack Scenarios

1. **Test brand with no brand_kit**: Created for RLS testing, never crawled
2. **Temp brand ID during onboarding**: Brand doesn't exist yet → returns null
3. **brand_kit.colors empty**: Prompts lack color context

---

### 5.3 Flow 3: Doc Agent (Copy) Flow

#### Assumptions
- ✅ User authenticated with brand access
- ✅ Brand exists with Brand Guide
- ✅ AI provider available
- ✅ Response is valid JSON array

#### Failure Modes

| Step | Failure Mode | Code Location | Current Behavior | Impact |
|------|--------------|---------------|------------------|--------|
| 1 | Zod validation fails | `AiDocGenerationRequestSchema.parse()` | Throws 400 | Request rejected |
| 2 | Brand Guide null | `getCurrentBrandGuide()` | `hasBrandGuide = false` | Throws NO_BRAND_GUIDE |
| 3 | Primary provider fails | `generateWithAI()` | Tries fallback provider | Latency increases |
| 4 | Both providers fail | `generateWithAI()` | Throws error | Agent fails |
| 5 | JSON parse fails | `parseDocVariants()` | Returns `parse-error` variant | Confusing UX (R02) |
| 6 | Retry fails | Retry logic | Returns low BFS content | Low quality |
| 7 | ContentPackage save fails | `ContentPackageStorage.save()` | Logs warning, continues | Data not persisted |

---

### 5.4 Flow 4: Content Planning → content_items → Queue

#### Assumptions
- ✅ Brand exists with website_url
- ✅ AI providers available
- ✅ All 8 items generate successfully
- ✅ No placeholder content

#### Failure Modes

| Step | Failure Mode | Code Location | Current Behavior | Impact |
|------|--------------|---------------|------------------|--------|
| 1 | Brand not found | `content-planning-service.ts:69` | Throws "Brand not found" | Flow fails |
| 2 | Doc Agent fails | `:234-238` | Returns original brandGuide | Thin content |
| 3 | Advisor fails | `:291-294` | Returns empty recommendations | No strategy |
| 4 | AI completely fails | `:356-366` | Uses `generateDefaultContentPlan()` | Generic content (R03) |
| 5 | All items placeholder | `:141-142` | Throws error | No content |
| 6 | DB insert fails | `:634-653` | Logs error, continues | Items lost (R07) |

---

### 5.5 Flow 5: Studio AI Modal → content_items

#### Assumptions
- ✅ User authenticated with brand access
- ✅ AI responds with valid variants
- ✅ User manually saves

#### Failure Modes

| Step | Failure Mode | Code Location | Current Behavior | Impact |
|------|--------------|---------------|------------------|--------|
| 1 | AI fails | `doc-agent.ts` | Error shown in modal | Can retry |
| 2 | User closes without saving | N/A | Content lost (ephemeral) | Frustration |
| 3 | Save fails | `creative-studio.ts:155` | Throws AppError (R04 FIXED) | Error shown |

---

### 5.6 Flow 6: Publishing

#### Assumptions
- ✅ Platform connected (OAuth tokens valid)
- ✅ Tokens not expired
- ✅ Platform API available
- ✅ Content meets platform requirements

#### Failure Modes

| Step | Failure Mode | Code Location | Current Behavior | Impact |
|------|--------------|---------------|------------------|--------|
| 1 | No platform connection | `publishing.ts` | Error on schedule | Can't publish |
| 2 | Token expired | `token-health-checker.ts` | Job fails, needs reauth | Post not published (R08) |
| 3 | Platform API 429 | `platform-apis.ts` | Retry if implemented | Delayed |
| 4 | Platform API 401 | `platform-apis.ts` | Token revoked | Needs reauth |
| 5 | Status update fails | N/A | Job marked failed | Content may be live |

---

## 6. Ranked Risk List

| Rank | Risk ID | Area | Severity | Summary | Status |
|------|---------|------|----------|---------|--------|
| 1 | **R01** | Pipeline Orchestrator | HIGH | Persistence disabled by default | ✅ FIXED (env var control) |
| 2 | **R02** | Doc Agent | HIGH | JSON parse failure returns misleading variant | ⚠️ NEEDS UX IMPROVEMENT |
| 3 | **R03** | Content Planning | HIGH | AI failure fallback returns generic content without indicator | ⚠️ NEEDS INDICATOR |
| 4 | **R04** | Creative Studio | HIGH | Save failure returned mock response | ✅ FIXED |
| 5 | **R09** | Doc → Design | MEDIUM | No runtime validation of ContentPackage shape | ⚠️ NEEDS FIX |
| 6 | **R07** | Content Items | MEDIUM | DB insert failures logged but not surfaced | ⚠️ NEEDS REVIEW |
| 7 | **R08** | Publishing | MEDIUM | Token expiration not proactively checked | ⚠️ NEEDS FIX |
| 8 | **R10** | Scraper | MEDIUM | AI brand_kit generation failure throws | ⚠️ NEEDS FALLBACK |
| 9 | **R06** | Brand Guide | MEDIUM | No completeness validation | ✅ FIXED |
| 10 | **R05** | PerformanceLog | LOW | In-memory only | ⚠️ BY DESIGN |
| 11 | **R11** | Onboarding | LOW | Temporary brand ID causes save to skip | ✅ BY DESIGN |
| 12 | **R12** | Advisor Cache | LOW | 24h TTL may return stale insights | ⚠️ ACCEPTABLE |

---

## 7. Suggested Tests & Pre-Fix Targets

### 7.1 Critical Tests to Add

#### R02: Doc Agent Parse Failure Test
**File:** `server/routes/__tests__/doc-agent.test.ts`
```typescript
describe("Doc Agent", () => {
  it("should handle malformed AI response gracefully", async () => {
    // Mock AI to return invalid JSON
    // Verify response contains parse-error variant
    // Verify status is "partial_success" not "failure"
    // Verify user-facing message is helpful
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
    // Verify items have fallback indicator
  });
  
  it("should filter placeholder content", async () => {
    // Mock AI to return mix of real and placeholder
    // Verify only real content is stored
  });
});
```

#### R09: ContentPackage Validation Test
**File:** `server/lib/__tests__/collaboration-storage.test.ts`
```typescript
describe("ContentPackage Handoff", () => {
  it("should validate ContentPackage shape when Design reads it", async () => {
    // Create ContentPackage with missing copy fields
    // Verify Design Agent handles gracefully
    // Verify warning logged
  });
});
```

#### R08: Token Health Test
**File:** `server/lib/__tests__/token-health-checker.test.ts`
```typescript
describe("Token Health Checker", () => {
  it("should proactively check token before publishing job runs", async () => {
    // Create job with expired token
    // Verify token checked before API call
    // Verify user notified of refresh needed
  });
});
```

### 7.2 Pre-Fix Targets (Priority Order)

#### Priority 1: R09 - ContentPackage Validation

**File:** `server/lib/collaboration-storage.ts`
```typescript
import { z } from "zod";

const ContentPackageCopySchema = z.object({
  headline: z.string().optional().default(""),
  body: z.string().optional().default(""),
  callToAction: z.string().optional().default(""),
  tone: z.string().optional().default("professional"),
  keywords: z.array(z.string()).optional().default([]),
});

export function validateContentPackageCopy(contentPackage: any): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const copy = contentPackage?.copy || {};
  
  if (!copy.headline) warnings.push("Missing headline");
  if (!copy.body) warnings.push("Missing body");
  if (!copy.tone) warnings.push("Missing tone");
  
  return { valid: warnings.length === 0, warnings };
}
```

#### Priority 2: R03 - Fallback Content Indicator

**File:** `server/lib/content-planning-service.ts`

Add indicator field to fallback content:
```typescript
function generateDefaultContentPlan(brandName: string, industry: string): ContentPlan {
  // ... existing code ...
  return {
    brandId,
    items: defaultItems.map(item => ({
      ...item,
      metadata: { source: "fallback", reason: "ai_unavailable" },
    })),
    advisorRecommendations: [],
    generatedAt: new Date().toISOString(),
    isFallback: true, // NEW: Indicator for UI
  };
}
```

#### Priority 3: R08 - Token Proactive Check

**File:** `server/lib/publishing-queue.ts`

Add pre-flight token check:
```typescript
async function preflightTokenCheck(job: PublishingJob): Promise<{ valid: boolean; needsRefresh: boolean }> {
  const { data: connection } = await supabase
    .from("platform_connections")
    .select("access_token, expires_at")
    .eq("id", job.connection_id)
    .single();
    
  if (!connection) return { valid: false, needsRefresh: false };
  
  const expiresAt = new Date(connection.expires_at);
  const now = new Date();
  const thirtyMinutes = 30 * 60 * 1000;
  
  if (expiresAt.getTime() - now.getTime() < thirtyMinutes) {
    return { valid: false, needsRefresh: true };
  }
  
  return { valid: true, needsRefresh: false };
}
```

### 7.3 Smoke Tests Already in Place

| Script | Purpose | Location |
|--------|---------|----------|
| `pnpm scraper:smoke` | Validates scraper + brand_kit | `scripts/scraper-truth-smoke.ts` |
| `pnpm brand-experience:smoke` | Full brand experience test | `scripts/brand-experience-smoke.ts` |
| `pnpm test` | Vitest unit tests | All `__tests__` files |
| `pnpm typecheck` | TypeScript validation | Entire codebase |

### 7.4 Testing Commands

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

# Backfill brand kit for brands missing colors
DRY_RUN=true pnpm backfill:brand-kit
```

---

## 8. Onboarding Auto-Workflow (Feature)

### 8.1 Overview

The **Onboarding Auto-Workflow** is a feature that automatically generates the first week of content after a successful website scrape. When enabled, the flow becomes:

```text
User enters URL
      ↓
POST /api/crawl/start?sync=true
      ↓
Scraper fills Brand Brain (brand_kit, media, colors)
      ↓
[IF FEATURE FLAG ENABLED]
      ↓
POST /api/orchestration/onboarding/run-all
      ↓
Content Planning Service generates 8 items
      ↓
User lands on queue with ready drafts
```

### 8.2 Feature Flag

**Environment Variable:**
```bash
VITE_FEATURE_ONBOARDING_AUTO_RUN_WORKFLOW=true
```

**LocalStorage Override:**
```javascript
// Enable via browser console for testing
localStorage.setItem("featureFlags", JSON.stringify({
  onboarding_auto_run_workflow: true
}));
```

**Code Location:** `client/lib/featureFlags.ts`

### 8.3 API Sequence

1. **Scrape completes:**
   - `POST /api/crawl/start?sync=true`
   - Response: `{ success, brandKit, status }`

2. **Brand Guide saved:**
   - `saveBrandGuideFromOnboarding(brandId, brandSnapshot, brandName)`
   - Writes to `brands.brand_kit`

3. **Auto-workflow triggered (if flag enabled):**
   - `POST /api/orchestration/onboarding/run-all`
   - Request: `{ brandId, workspaceId, websiteUrl, industry }`
   - Response: `{ success, status, steps[], errors[] }`

4. **Content items created:**
   - Onboarding orchestrator runs 6 steps
   - Content planning step writes 8 items to `content_items`

5. **Screen7 skipped or fast-tracked:**
   - If `localStorage.getItem(\`postd:onboarding:${brandId}:workflow_completed\`) === "true"`
   - Screen7 shows quick success animation instead of calling API
   - **Note:** Keys are brand-specific to support multi-brand/agency onboarding

### 8.4 Implementation Files

| File | Changes |
|------|---------|
| `client/lib/featureFlags.ts` | Added `onboarding_auto_run_workflow` flag |
| `shared/api.ts` | Added `OnboardingRunAllRequest`, `OnboardingRunAllResponse`, `CrawlerSyncResponse` types |
| `client/pages/onboarding/Screen3AiScrape.tsx` | Added `runOnboardingWorkflow()` call after scrape success |
| `client/pages/onboarding/Screen7ContentGeneration.tsx` | Added check for workflow completion, skips API if already done |

### 8.5 Failure Behavior

- **Auto-workflow failure does NOT block onboarding**
- User sees warning: "We couldn't auto-generate your first week. You can still continue and create content manually."
- Screen7 will still run content generation via `/api/content-plan/:brandId/generate`
- All errors logged with `[OnboardingWorkflow]` tag

### 8.6 UX States

| State | UI |
|-------|-----|
| Generating content | Shows "✨ Generating your first week of content..." with spinner |
| Success | Completion message includes "We've also generated your first week of content!" |
| Failure | Warning banner with manual fallback message |

### 8.7 LocalStorage Keys (Brand-Specific)

To support multi-brand and agency onboarding scenarios, all workflow state keys are **brand-specific**:

| Key Pattern | Purpose | Set By | Read By |
|-------------|---------|--------|---------|
| `postd:onboarding:${brandId}:workflow_completed` | Marks auto-workflow succeeded | Screen3 | Screen7, Screen8 |
| `postd:onboarding:${brandId}:workflow_result` | Stores step completion metadata | Screen3 | Debug tools |
| `postd:onboarding:${brandId}:workflow_in_progress` | Double-execution lock | Screen3 | Screen3 |
| `postd:onboarding:${brandId}:content_package` | Generated content items | Screen7 | Screen8 |
| `postd:onboarding:${brandId}:connect_skipped` | User skipped connect step | Screen8 | Dashboard |
| `postd:onboarding:${brandId}:weekly_focus` | Selected content theme | Screen6 | Screen8 |

**Why brand-specific?**
- Agencies may onboard multiple brands in the same session
- Each brand's workflow state is tracked independently
- Prevents false positives when switching between brands
- Enables concurrent onboarding flows without collision

**Double-Execution Prevention:**
1. Screen3 sets `workflow_in_progress=true` before calling API
2. Screen3 checks `workflow_in_progress` and `workflow_completed` before triggering
3. Screen3 clears `workflow_in_progress` in `finally` block
4. Screen7 checks `workflow_completed` to skip redundant API calls

**Diagnostic Logging:**
All workflow events are logged with `[OnboardingWorkflow]` prefix:
- `[OnboardingWorkflow] brandId=xxx triggered`
- `[OnboardingWorkflow] completed in X ms`
- `[OnboardingWorkflow] Screen7 skipped - workflow_completed=true`

**Legacy keys (deprecated):**
- `postd:onboarding:content_package` → replaced by brand-specific key
- `aligned:onboarding:content_package` → deprecated
- `postd:onboarding:connect_skipped` → replaced by brand-specific key

---

## Appendix: Data Flow Diagram

```text
                            ┌─────────────────┐
                            │   USER BROWSER  │
                            └────────┬────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────┐
│                          EXPRESS SERVER                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Middleware: CORS → Auth → Brand Access → Rate Limiting  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ /api/crawl │  │ /api/agents│  │ /api/studio│  │/api/publish│ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘ │
│        │               │               │               │        │
└────────┼───────────────┼───────────────┼───────────────┼────────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ BRAND       │  │ AI AGENTS   │  │ CREATIVE    │  │ PUBLISHING  │
│ CRAWLER     │  │ Doc/Design  │  │ STUDIO      │  │ QUEUE       │
│             │  │ /Advisor    │  │             │  │             │
└─────┬───────┘  └─────┬───────┘  └─────┬───────┘  └─────┬───────┘
      │                │               │               │
      │   ┌────────────┴────────────┐  │               │
      │   │                         │  │               │
      ▼   ▼                         ▼  ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE (PostgreSQL)                     │
│                                                                   │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │  brands   │  │ content_items│  │ media_assets │  │ publish │ │
│  │(brand_kit)│  │              │  │              │  │ _jobs   │ │
│  └───────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
│                                                                   │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │ content_  │  │ brand_history│  │ advisor_cache│  │platform │ │
│  │ packages  │  │              │  │   (24h TTL)  │  │_connect │ │
│  └───────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Chaos Repair Function Map (Doc, Planner, Studio, Orchestrator, Brand Guide)

> **Purpose:** Detailed mapping of key functions touched by chaos fixes R01–R06
> **Date:** 2025-12-10

### 8.1 Doc Agent Functions (R02)

#### `parseDocVariants(content: string)`
| Aspect | Details |
|--------|---------|
| **File** | `server/routes/doc-agent.ts:61-96` |
| **Called By** | `generateDocContent()` handler |
| **Calls** | `JSON.parse()`, string manipulation |
| **Input** | Raw AI response string (expected JSON array) |
| **Output** | `AiDocVariant[]` or single `parse-error` variant |
| **Side Effects** | None |
| **Risk Tie** | R02 - Returns misleading `parse-error` variant on malformed JSON |

**Current Behavior:**
```typescript
// If JSON.parse fails:
return [{
  id: "parse-error",
  content: "AI response could not be parsed. Please try again.",
  tone: "error",
  wordCount: 0,
}];
```

#### `generateDocContent(req, res)`
| Aspect | Details |
|--------|---------|
| **File** | `server/routes/doc-agent.ts:234` |
| **Called By** | Express route `POST /api/ai/doc` |
| **Calls** | `getCurrentBrandGuide()`, `getBrandProfile()`, `generateWithAI()`, `parseDocVariants()`, `calculateBrandFidelityScore()` |
| **Input** | `AiDocGenerationRequest` (brandId, topic, platform, contentType, tone) |
| **Output** | `AiDocGenerationResponse` (variants, brandContext, metadata, warnings) |
| **Side Effects** | ContentPackage save (if collaboration context), generation logs |
| **Risk Tie** | R02 - BFS retry logic, parse error handling |

#### `buildDocSystemPrompt(brandGuide, platform, contentType)`
| Aspect | Details |
|--------|---------|
| **File** | `server/lib/ai/docPrompt.ts` |
| **Called By** | `generateDocContent()` |
| **Calls** | `buildFullBrandGuidePrompt()` |
| **Input** | BrandGuide, platform, contentType |
| **Output** | System prompt string for AI |
| **Side Effects** | None |
| **Risk Tie** | R06 - Empty brand guide → generic prompts |

---

### 8.2 Content Planning Service Functions (R03)

#### `generateContentPlan(brandId, tenantId)`
| Aspect | Details |
|--------|---------|
| **File** | `server/lib/content-planning-service.ts:43` |
| **Called By** | Onboarding orchestrator, content plan routes |
| **Calls** | `getCurrentBrandGuide()`, `completeBrandGuideWithDocAgent()`, `getAdvisorRecommendations()`, `planContentWithCreativeAgent()`, `storeContentItems()` |
| **Input** | `brandId` (UUID), `tenantId` (optional) |
| **Output** | `ContentPlan` with 8 items |
| **Side Effects** | Writes to `content_items` table |
| **Risk Tie** | R03 - Falls back to `generateDefaultContentPlan()` on AI failure |

#### `generateDefaultContentPlan(brandId, brandGuide, brandProfile, brandKit)`
| Aspect | Details |
|--------|---------|
| **File** | `server/lib/content-planning-service.ts:483` |
| **Called By** | `generateContentPlan()` on AI failure |
| **Calls** | Date utilities |
| **Input** | Brand context objects |
| **Output** | `ContentPlanItem[]` with deterministic content |
| **Side Effects** | None |
| **Risk Tie** | R03 - Returns generic content without clear "fallback" indicator |

**Current Fallback Trigger Points (lines 356-476):**
1. AI generation throws → line 366
2. All items filtered as placeholders → line 453
3. AI provider errors (Anthropic/OpenAI) → line 471

#### Content Quality Filter (lines 377-445)
```typescript
// Filters out items with:
// - content.length < 50
// - content contains "placeholder", "edit this content", "sample", "complete..."
```

---

### 8.3 Creative Studio Functions (R04)

#### `POST /api/studio/save` Handler
| Aspect | Details |
|--------|---------|
| **File** | `server/routes/creative-studio.ts:105-208` |
| **Called By** | Studio UI save action |
| **Calls** | Supabase `.insert()` on `content_items` |
| **Input** | `SaveDesignRequest` (format, width, height, items, brandId) |
| **Output** | `SaveDesignResponse` (success, design object) |
| **Side Effects** | Writes to `content_items` table |
| **Risk Tie** | R04 - **FIXED** - Now throws `AppError` on DB failure |

**Fix Applied (lines 155-165):**
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

#### `PUT /api/studio/:id` Handler
| Aspect | Details |
|--------|---------|
| **File** | `server/routes/creative-studio.ts:210-305` |
| **Called By** | Studio UI update action |
| **Calls** | Supabase `.update()` on `content_items` |
| **Input** | Design ID (param), `UpdateDesignRequest` |
| **Output** | `SaveDesignResponse` (success, updated design) |
| **Side Effects** | Updates `content_items` row |
| **Risk Tie** | R04 - **FIXED** - Now throws `AppError` on DB failure |

---

### 8.4 Pipeline Orchestrator Functions (R01)

#### `PipelineOrchestrator.constructor(brandId)`
| Aspect | Details |
|--------|---------|
| **File** | `server/lib/pipeline-orchestrator.ts:60-73` |
| **Called By** | Route handler `POST /api/orchestration/pipeline/execute` |
| **Calls** | `PersistenceService`, `PerformanceTrackingJob`, `CreativeAgent` |
| **Input** | `brandId` (UUID) |
| **Output** | Orchestrator instance |
| **Side Effects** | Logs warning if persistence disabled |
| **Risk Tie** | R01 - **FIXED** - Env var `PIPELINE_PERSISTENCE_ENABLED` controls persistence |

**Fix Applied (lines 67-72):**
```typescript
const persistenceEnabled = process.env.PIPELINE_PERSISTENCE_ENABLED === "true";
this.persistenceService = new PersistenceService({ enabled: persistenceEnabled });

if (!persistenceEnabled) {
  console.warn("[Orchestrator] ⚠️ Persistence DISABLED – pipeline outputs will not be saved to DB");
}
```

#### `executeFullPipeline(context)`
| Aspect | Details |
|--------|---------|
| **File** | `server/lib/pipeline-orchestrator.ts:533` |
| **Called By** | Route handler |
| **Calls** | `phase1_Plan()`, `phase2_Create()`, `phase3_Review()`, `phase4_Learn()` |
| **Input** | `CollaborationContext` (optional) |
| **Output** | `PipelineCycle` (strategy, contentPackage, reviewScores, learnings, metrics) |
| **Side Effects** | Persists artifacts if `persistenceEnabled = true` |
| **Risk Tie** | R01 - All data in-memory only if persistence disabled |

---

### 8.5 Brand Guide Service Functions (R06)

#### `validateBrandGuideCompleteness(guide)`
| Aspect | Details |
|--------|---------|
| **File** | `server/lib/brand-guide-service.ts:27-85` |
| **Called By** | Doc Agent (optional), smoke tests, validation flows |
| **Calls** | None (pure validation) |
| **Input** | `BrandGuide | null` |
| **Output** | `{ isComplete: boolean, missingFields: string[], completenessScore: number }` |
| **Side Effects** | None |
| **Risk Tie** | R06 - **FIXED** - Helper to detect incomplete brand guides |

**Fields Checked:**
- Critical: `voiceAndTone.tone`, `visualIdentity.colors`
- Important: `identity.businessType`, `identity.industry`
- Recommended: `voiceAndTone.voiceDescription`, `identity.targetAudience`, `identity.industryKeywords`

#### `getCurrentBrandGuide(brandId)`
| Aspect | Details |
|--------|---------|
| **File** | `server/lib/brand-guide-service.ts:109` |
| **Called By** | All agents (Doc, Design, Advisor), Content Planning |
| **Calls** | Supabase query, `normalizeBrandGuide()` |
| **Input** | `brandId` (UUID) |
| **Output** | `BrandGuide | null` |
| **Side Effects** | None |
| **Risk Tie** | R06 - Returns null if brand not found → agents throw `NO_BRAND_GUIDE` |

---

## 9. Chaos Regression Failure Modes (Post-Fix)

> **Purpose:** New or remaining failure modes after R01–R06 fixes
> **Date:** 2025-12-10

### 9.1 R01 — Pipeline Orchestrator (Post-Fix Analysis)

**Current Assumptions After Fix:**
1. `PIPELINE_PERSISTENCE_ENABLED` env var controls persistence
2. When false (default), warning is logged
3. When true, `PersistenceService` writes to DB

**Remaining Failure Scenarios:**

| Scenario | Functions Involved | User Experience | Test Coverage |
|----------|-------------------|-----------------|---------------|
| Env var typo (`PIPELINE_PERSISTENCE_ENABLE` without D) | Constructor | Silent failure - persistence disabled without warning | ❌ Not tested |
| DB connection fails during persistence | `PersistenceService.save()` | Pipeline returns success but data not saved | ❌ Not tested |
| Multiple pipelines for same brand run concurrently | `executeFullPipeline()` | Race condition - last write wins | ❌ Not tested |
| `content_packages` table not migrated | `PersistenceService.save()` | Persistence throws, pipeline fails | ⚠️ Partial |

**Proposed Tests:**
```typescript
// server/__tests__/pipeline-orchestrator-chaos.test.ts
it("should handle DB write failure gracefully during persistence", async () => {
  // Mock PersistenceService.save to throw
  // Verify pipeline still completes
  // Verify error is surfaced in cycle.errors[]
});

it("should detect env var typos (case sensitivity)", async () => {
  // Set PIPELINE_PERSISTENCE_ENABLE=true (missing D)
  // Verify persistence is still disabled
  // Verify warning is logged
});
```

---

### 9.2 R02 — Doc Agent Parse Errors (Post-Fix Analysis)

**Current Assumptions After Fix:**
1. Malformed AI JSON returns `parse-error` variant
2. Status includes `warnings` array
3. BFS < 0.8 triggers retry

**Remaining Failure Scenarios:**

| Scenario | Functions Involved | User Experience | Test Coverage |
|----------|-------------------|-----------------|---------------|
| Partially valid JSON (some fields missing) | `parseDocVariants()` | Variant returned with empty fields | ❌ Not tested |
| AI returns empty array `[]` | `parseDocVariants()` | Empty variants array, no error | ❌ Not tested |
| AI returns single variant instead of array | `parseDocVariants()` | Parse succeeds but only 1 variant | ⚠️ Partial |
| Retry also fails with parse error | `generateDocContent()` | User sees parse-error variant twice in warnings | ❌ Not tested |
| BFS scorer throws | `calculateBrandFidelityScore()` | Unhandled exception | ❌ Not tested |

**Proposed Tests:**
```typescript
// server/__tests__/doc-agent-chaos.test.ts
it("should handle AI returning empty array", async () => {
  // Mock AI to return "[]"
  // Verify response has empty variants but no crash
  // Verify appropriate warning
});

it("should handle partially valid JSON (missing fields)", async () => {
  // Mock AI to return [{content: "test"}] without id/tone/wordCount
  // Verify defaults applied
  // Verify variant usable
});
```

---

### 9.3 R03 — Content Planning Fallback (Post-Fix Analysis)

**Current Assumptions After Fix:**
1. AI failure triggers `generateDefaultContentPlan()`
2. Placeholder content filtered (< 50 chars or contains "placeholder")
3. Fallback content uses brand context when available

**Remaining Failure Scenarios:**

| Scenario | Functions Involved | User Experience | Test Coverage |
|----------|-------------------|-----------------|---------------|
| Fallback content not marked as fallback in UI | `generateDefaultContentPlan()` | User thinks AI-generated content is real | ❌ Not marked |
| Brand name is empty/undefined | `generateDefaultContentPlan()` | Content says "undefined's brand" | ❌ Not tested |
| DB write fails for some items | `storeContentItems()` | Partial content in queue, silent loss | ⚠️ Logged only |
| All AI content is exactly 50 chars | Filter logic | Edge case - might pass filter | ❌ Not tested |

**Proposed Tests:**
```typescript
// server/__tests__/content-planning-chaos.test.ts
it("should handle empty brand name in fallback", async () => {
  // Mock brand with empty name
  // Verify fallback uses sensible default (e.g., "your brand")
});

it("should mark fallback content with metadata indicator", async () => {
  // Force fallback path
  // Verify items have metadata.source = "fallback"
});
```

**Proposed Code Fix:**
```typescript
// content-planning-service.ts - generateDefaultContentPlan()
return {
  items: defaultItems.map(item => ({
    ...item,
    metadata: { 
      source: "fallback", 
      reason: "ai_unavailable" 
    },
  })),
  isFallback: true,
};
```

---

### 9.4 R04 — Creative Studio (Post-Fix Analysis)

**Current Assumptions After Fix:**
1. DB failure throws `AppError` with `DATABASE_ERROR`
2. User sees "Your design could not be saved. Please try again."
3. No mock fallback exists

**Remaining Failure Scenarios:**

| Scenario | Functions Involved | User Experience | Test Coverage |
|----------|-------------------|-----------------|---------------|
| Supabase returns null (not error object) | `POST /save` handler | Possible crash or unexpected behavior | ❌ Not tested |
| Design items array is empty | `POST /save` handler | Saves empty design | ❌ Not validated |
| brandId doesn't exist | `POST /save` handler | FK constraint violation | ❌ Not tested |
| Network timeout to Supabase | Supabase client | Different error shape | ❌ Not tested |
| Partial save (items saved, main record fails) | Multiple queries | Orphaned data | ❌ Not tested |

**Proposed Tests:**
```typescript
// server/__tests__/creative-studio-chaos.test.ts
it("should validate items array is not empty", async () => {
  // Send save request with items: []
  // Verify validation error returned
});

it("should handle Supabase returning null data", async () => {
  // Mock Supabase to return { data: null, error: null }
  // Verify appropriate error handling
});
```

---

### 9.5 R06 — Brand Guide Completeness (Post-Fix Analysis)

**Current Assumptions After Fix:**
1. `validateBrandGuideCompleteness()` checks critical fields
2. Returns `isComplete`, `missingFields`, `completenessScore`
3. Helper is exported but NOT enforced in agent flows

**Remaining Failure Scenarios:**

| Scenario | Functions Involved | User Experience | Test Coverage |
|----------|-------------------|-----------------|---------------|
| Validation not called in Doc Agent | `generateDocContent()` | Generic content generated silently | ❌ Not enforced |
| Validation not called in Content Planning | `generateContentPlan()` | Generic content generated silently | ❌ Not enforced |
| Empty arrays pass as "present" | `validateBrandGuideCompleteness()` | `tone: []` passes check | ❌ Edge case |
| New required fields added to BrandGuide | `validateBrandGuideCompleteness()` | Helper becomes stale | ⚠️ Manual sync |

**Proposed Integration Points:**

1. **Doc Agent** - Add to `generateDocContent()`:
```typescript
const completeness = validateBrandGuideCompleteness(brandGuide);
if (!completeness.isComplete) {
  response.warnings.push({
    code: "incomplete_brand_guide",
    message: `Brand guide is ${completeness.completenessScore}% complete`,
    missingFields: completeness.missingFields,
  });
}
```

2. **Content Planning** - Add to `generateContentPlan()`:
```typescript
const completeness = validateBrandGuideCompleteness(brandGuide);
if (completeness.completenessScore < 50) {
  logger.warn("Brand guide less than 50% complete", { 
    brandId, 
    missingFields: completeness.missingFields 
  });
}
```

---

### 9.7 Crawler → Onboarding Wiring (NEW - 2025-12-10)

**Implementation:** `server/routes/crawler.ts` (lines 355-410)

**Behavior:** After a successful synchronous crawl (`POST /api/crawl/start?sync=true`), the system now automatically triggers the onboarding workflow if:
1. The `brandId` is a real UUID (not a temporary ID like `brand_1234567890`)
2. A valid `tenantId` is available

**Response Schema (updated):**
```typescript
interface CrawlResponse {
  success: boolean;
  brandKit: any;
  status: "completed";
  onboarding: {
    triggered: boolean;
    status: "triggered" | "skipped_temp_id" | "skipped_no_tenant";
    jobId?: string;  // e.g., "onboarding-1702300800000-a1b2c3d4"
    message: string;
  };
}
```

**Failure Independence:**
- Scrape success is independent of onboarding success
- If onboarding fails, the scrape still returns `success: true` with `onboarding.triggered: true`
- Onboarding runs asynchronously (non-blocking)

**Potential Failure Modes:**

| Failure Mode | Scrape Result | Onboarding Result | User Experience | Test Coverage |
|--------------|---------------|-------------------|-----------------|---------------|
| Onboarding workflow fails | ✅ Success | ❌ Fails silently | BrandKit saved, no content in Queue | `crawler-onboarding-integration.test.ts` |
| Temporary brandId | ✅ Success | ⏭️ Skipped | BrandKit saved, "skipped_temp_id" in response | `crawler-onboarding-integration.test.ts` |
| Missing tenantId | ✅ Success | ⏭️ Skipped | BrandKit saved, "skipped_no_tenant" in response | `crawler-onboarding-integration.test.ts` |
| All steps succeed | ✅ Success | ✅ 8 items | BrandKit + 8 items in Queue | `crawler-onboarding-integration.test.ts` |

**Test Coverage:**
- **File:** `server/__tests__/crawler-onboarding-integration.test.ts`
- **Tests:**
  - Onboarding triggers for real UUID + tenantId
  - Onboarding skipped for temp brandId
  - Onboarding skipped when tenantId missing
  - Scrape success independent of onboarding
  - 8 content items generated

---

## 10. Next Chaos Hardening Steps (Recommended, Not Implemented)

> **Purpose:** Proposed tests and tiny fixes for identified gaps
> **Date:** 2025-12-10
> **Status:** PROPOSALS ONLY — Do not implement without explicit request

### 10.1 Priority 1: New Tests to Add

#### Test 1: Pipeline Persistence DB Failure
**File:** `server/__tests__/pipeline-orchestrator-chaos.test.ts`
**Scenario:** DB write fails during persistence  
**Assert:** Pipeline completes, error surfaced in `cycle.warnings[]`

```typescript
it("should handle PersistenceService failure gracefully", async () => {
  const orchestrator = new PipelineOrchestrator("brand-123");
  // Mock persistenceService.save() to throw
  vi.spyOn(orchestrator.persistenceService, 'save').mockRejectedValue(new Error("DB unavailable"));
  
  const cycle = await orchestrator.executeFullPipeline({});
  
  expect(cycle.status).toBe("complete");
  expect(cycle.warnings).toContain("Persistence failed: DB unavailable");
});
```

#### Test 2: Doc Agent Empty AI Response
**File:** `server/__tests__/doc-agent-chaos.test.ts`
**Scenario:** AI returns empty array `[]`  
**Assert:** Response has warning, status indicates issue

```typescript
it("should handle AI returning empty array", async () => {
  const result = parseDocVariants("[]");
  
  expect(result).toHaveLength(0);
  // Should trigger warning in caller
});
```

#### Test 3: Content Planning Empty Brand Name
**File:** `server/__tests__/content-planning-chaos.test.ts`
**Scenario:** Brand has no name  
**Assert:** Fallback uses "your brand" placeholder

```typescript
it("should use default name when brand name is empty", () => {
  const plan = generateDefaultContentPlan("brand-123", null, null, null);
  
  plan.forEach(item => {
    expect(item.content).not.toContain("undefined");
    expect(item.content).not.toContain("null");
  });
});
```

#### Test 4: Creative Studio Empty Items
**File:** `server/__tests__/creative-studio-chaos.test.ts`
**Scenario:** Save request with `items: []`  
**Assert:** Validation error returned before DB write

```typescript
it("should reject save with empty items array", async () => {
  const result = await simulateFixedSaveHandler(
    { ...validRequest, items: [] },
    "user-123",
    { data: null, error: null }
  );
  
  expect(result.status).toBe(400);
  expect(result.body.code).toBe("VALIDATION_ERROR");
});
```

#### Test 5: Brand Guide Empty Arrays
**File:** `server/__tests__/brand-guide-completeness.test.ts`
**Scenario:** Brand guide has `tone: []` (empty array)  
**Assert:** Marked as incomplete

```typescript
it("should detect empty arrays as incomplete", () => {
  const guide = createMockBrandGuide({
    voiceAndTone: { ...base, tone: [] },
  });
  
  const result = validateBrandGuideCompleteness(guide);
  
  expect(result.isComplete).toBe(false);
  expect(result.missingFields).toContain("voiceAndTone.tone");
});
```

---

### 10.2 Priority 2: Tiny Code Fixes

#### Fix 1: Fallback Content Metadata Indicator
**File:** `server/lib/content-planning-service.ts`
**Function:** `generateDefaultContentPlan()`
**Change:** Add `metadata.source = "fallback"` to items

```typescript
// Line ~505
return validatedItems.map(item => ({
  ...item,
  metadata: { 
    source: "fallback",
    reason: "ai_unavailable",
    generatedAt: new Date().toISOString(),
  },
}));
```

#### Fix 2: Brand Guide Completeness Check Empty Arrays
**File:** `server/lib/brand-guide-service.ts`
**Function:** `validateBrandGuideCompleteness()`
**Change:** Check array length, not just existence

```typescript
// Current:
if (!guide.voiceAndTone?.tone?.length) missing.push("voiceAndTone.tone");

// Already correct! But verify colors check is similar:
if (!guide.visualIdentity?.colors?.length) missing.push("visualIdentity.colors");
```

#### Fix 3: Doc Agent Integration of Completeness Check
**File:** `server/routes/doc-agent.ts`
**Location:** After `getCurrentBrandGuide()` call
**Change:** Add warning if brand guide incomplete

```typescript
// After line ~285
const completeness = validateBrandGuideCompleteness(brandGuide);
const warnings: string[] = [];
if (!completeness.isComplete) {
  warnings.push(`Brand guide ${completeness.completenessScore}% complete. Missing: ${completeness.missingFields.join(", ")}`);
}
```

#### Fix 4: Creative Studio Items Validation
**File:** `server/routes/creative-studio.ts`
**Location:** Start of POST handler
**Change:** Validate items array not empty

```typescript
// After line ~110
if (!designData.items || designData.items.length === 0) {
  throw new AppError(
    ErrorCode.VALIDATION_ERROR,
    "Design must have at least one item",
    HTTP_STATUS.BAD_REQUEST,
    "warning",
    {},
    "Please add content to your design before saving."
  );
}
```

---

### 10.3 Priority 3: Documentation Updates

#### Update 1: Add R01 Production Checklist
Add to `docs/GO_LIVE_CHECKLIST.md`:
```markdown
## Pipeline Orchestrator
- [ ] Set `PIPELINE_PERSISTENCE_ENABLED=true` in production
- [ ] Verify `content_packages` table exists with correct schema
- [ ] Test pipeline execution with persistence enabled
```

#### Update 2: Add Fallback Content Warning to Product Docs
Add to `docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md`:
```markdown
## Content Generation Fallbacks
When AI is unavailable, the system generates fallback content:
- Fallback content is clearly marked with `metadata.source = "fallback"`
- UI should display a banner: "Some content was generated using defaults due to AI unavailability"
```

---

### 10.4 Summary: Gaps by Risk

| Risk | Gap Type | Test File | Description |
|------|----------|-----------|-------------|
| R01 | Missing Test | `pipeline-orchestrator-chaos.test.ts` | DB failure during persistence |
| R01 | Missing Test | `pipeline-orchestrator-chaos.test.ts` | Env var typo detection |
| R02 | Missing Test | `doc-agent-chaos.test.ts` | Empty AI response `[]` |
| R02 | Missing Test | `doc-agent-chaos.test.ts` | Partial JSON (missing fields) |
| R03 | Missing Indicator | `content-planning-service.ts` | Fallback content not marked |
| R03 | Missing Test | `content-planning-chaos.test.ts` | Empty brand name handling |
| R04 | Missing Validation | `creative-studio.ts` | Empty items array |
| R04 | Missing Test | `creative-studio-chaos.test.ts` | Supabase null response |
| R06 | Not Enforced | `doc-agent.ts` | Completeness check not called |
| R06 | Not Enforced | `content-planning-service.ts` | Completeness check not called |
| R06 | Missing Test | `brand-guide-completeness.test.ts` | Empty arrays (e.g., `tone: []`) |

---

### 10.5 Execution Order (When Asked to Implement)

1. **Quick Wins (< 10 min each):**
   - Add empty array check to `validateBrandGuideCompleteness()`
   - Add items validation to Creative Studio save

2. **Test Coverage (30 min total):**
   - Add 5 new test cases listed in 10.1

3. **Integration (1 hour):**
   - Add completeness warning to Doc Agent
   - Add fallback metadata indicator to Content Planning

4. **Verification:**
   - Run `pnpm typecheck`
   - Run `pnpm test`
   - Manual smoke test of affected flows

---

**END OF DOCUMENT**

*Document generated: 2025-12-10*  
*Updated: 2025-12-10 (Chaos Regression Audit)*
*Based on comprehensive analysis of POSTD repository*  
*Consolidates findings from POSTD_FULL_STACK_CHAOS_AUDIT.md, POSTD_AGENT_ORCHESTRATION_AND_HANDOFF.md, and live code inspection*

