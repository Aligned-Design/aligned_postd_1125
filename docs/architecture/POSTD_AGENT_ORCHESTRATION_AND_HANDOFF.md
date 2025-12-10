# POSTD Agent Orchestration and Handoff

> **Status:** ✅ Active — Single source of truth for agent collaboration  
> **Last Updated:** 2025-12-10 (Verified)  
> **Purpose:** Defines how all POSTD AI agents work together, hand off work, and share context  
> **Verified By:** Pre-flight contract audit against actual code

---

## How Cursor Should Use This File

- **Read this doc before modifying any agent** to understand handoff contracts
- **Reference the Agent Catalog** when implementing new features that touch AI
- **Follow the Handoff Patterns** when agents need to share data
- **Check the Roadmap** before proposing new orchestration patterns

If implementing agent changes, ensure they:
1. Respect the Brand Guide as source of truth
2. Use the shared collaboration artifacts (StrategyBrief, ContentPackage, BrandHistory)
3. Log actions to `collaborationLog` for traceability
4. Don't break existing handoff contracts

---

## 1. Executive Summary

POSTD implements a **three-agent collaborative intelligence system**:

| Agent | Also Known As | Primary Role |
|-------|---------------|--------------|
| **Doc Agent** | The Copywriter, Content Engine | Generates on-brand text content |
| **Design Agent** | The Creative, Creative Studio | Creates visual concepts and layouts |
| **Advisor Agent** | The Strategist | Provides insights, recommendations, and strategic guidance |

All agents:
- ✅ Load Brand Guide via `getCurrentBrandGuide()` (source of truth)
- ✅ Use structured prompts via `buildFullBrandGuidePrompt()`
- ✅ Implement provider fallback (OpenAI → Anthropic → deterministic)
- ✅ Store outputs in collaboration artifacts
- ✅ Calculate Brand Fidelity Score (BFS) for quality assurance

---

## 2. Agent Catalog

### A. Doc Agent (The Copywriter)

**Purpose:** Generates on-brand text content for social media, emails, blogs, and other platforms. Extracts structured meaning from text, converts longform ideas into usable content, and handles content refinement with brand alignment.

**Key Inputs:**
- `brand_id` (UUID) — Brand to generate content for
- `input.topic` — Content topic or prompt
- `input.platform` — Target platform (instagram, linkedin, facebook, twitter, etc.)
- `input.tone` — Desired tone (professional, casual, energetic, etc.)
- `input.format` — Content format (post, carousel, reel, etc.)
- Brand Guide context (loaded automatically)
- StrategyBrief (optional, for orchestrated flows)
- ContentPackage (optional, for refinement)

**Key Outputs:**
- `variants[]` — Multiple content variants (typically 3) with:
  - `content` — Full content text (headline, body, CTA, hashtags)
  - `brandFidelityScore` — BFS score (0-1)
  - `tone` — Detected tone
  - `wordCount` — Content length
- `metadata` — Provider, latency, retry status
- Updates to `content_packages` table
- Entries in `generation_logs` table

**Where It Lives in Code:**

| Component | File Path |
|-----------|-----------|
| Route Handler | `server/routes/doc-agent.ts` |
| Agent Route | `server/routes/agents.ts` → `POST /api/agents/generate/doc` |
| Core Logic | `server/lib/copy-agent.ts` |
| Prompt Builder | `server/lib/ai/docPrompt.ts` |
| Brand Guide Prompts | `server/lib/prompts/brand-guide-prompts.ts` |

---

### B. Design Agent (The Creative)

**Purpose:** Creates visual concepts, layouts, and design metadata for creative assets. Generates descriptions for creative assets, works with image sourcing (scraped, stock, uploaded), and prepares metadata for Creative Studio.

**Key Inputs:**
- `brand_id` (UUID) — Brand to create designs for
- `input.theme` — Visual theme
- `input.aspect_ratio` — Target aspect ratio
- `input.headline` — Headline text to incorporate
- `input.platform` — Target platform
- Brand Guide context (loaded automatically)
- ContentPackage (optional, for copy context)
- BrandHistory (optional, for pattern awareness)
- PerformanceLog (optional, for data-driven design)

**Key Outputs:**
- `variants[]` — Design variants with:
  - `cover_title` — Main title
  - `template_ref` — Template identifier
  - `alt_text` — Accessibility text
  - `visual_elements[]` — Components used
  - `color_palette_used[]` — Colors applied
  - `font_suggestions[]` — Typography recommendations
  - `brandFidelityScore` — BFS score
- Updates to `content_packages.designContext` and `content_packages.visuals`
- Entries in `generation_logs` table

**Where It Lives in Code:**

| Component | File Path |
|-----------|-----------|
| Route Handler | `server/routes/design-agent.ts` |
| Agent Route | `server/routes/agents.ts` → `POST /api/agents/generate/design` |
| Core Logic | `server/lib/creative-agent.ts` |
| Prompt Builder | `server/lib/ai/designPrompt.ts` |
| Brand Guide Prompts | `server/lib/prompts/brand-guide-prompts.ts` |

---

### C. Advisor Agent (The Strategist)

**Purpose:** Provides insights, recommendations, diagnostics, and strategic guidance. Supports planning (weekly focus, content gaps, opportunities), uses analytics + Brand Guide context, and helps improve content strategy.

**Key Inputs:**
- `brand_id` (UUID) — Brand to analyze
- Performance metrics (from `analytics_metrics` table)
- Brand Guide context (loaded automatically)
- BrandHistory (optional, for pattern analysis)
- PerformanceLog (optional, for recent performance data)

**Key Outputs:**
- `insights[]` — Strategic insights with:
  - `title`, `body` — Insight content
  - `severity` — info / warning / critical
  - `category` — content / timing / channel / engagement
  - `confidence` — Confidence score
- `topics[]` — Recommended content topics
- `best_times[]` — Optimal posting times
- `format_mix` — Recommended format distribution
- `hashtags[]`, `keywords[]` — Suggested tags
- Cached results in `advisor_cache` table (24h TTL)
- Updates to `brand_history` table

**Where It Lives in Code:**

| Component | File Path |
|-----------|-----------|
| Route Handler | `server/routes/advisor.ts` |
| Agent Route | `server/routes/agents.ts` → `POST /api/agents/generate/advisor` |
| Core Logic | `server/lib/advisor-engine.ts` |
| Prompt Builder | `server/lib/ai/advisorPrompt.ts` |
| Brand Guide Prompts | `server/lib/prompts/brand-guide-prompts.ts` |
| Review Scoring | `server/lib/advisor-review-scorer.ts` |
| Reflection Generator | `server/lib/advisor-reflection-generator.ts` |

---

### D. Pipeline Orchestrator

**Purpose:** Coordinates the full content lifecycle across all three agents in a synchronized sequence: **Plan → Create → Review → Learn**. Ensures shared data passing, collaboration logging, and continuous learning.

**Key Inputs:**
- `brandId` (UUID) — Brand to orchestrate for
- `context` (optional) — Partial CollaborationContext with:
  - `strategyBrief` — Pre-existing strategy
  - `brandHistory` — Historical patterns
  - `performanceLog` — Recent performance data

**Key Outputs:**
- `PipelineCycle` containing:
  - `strategy` — StrategyBrief from Phase 1
  - `contentPackage` — ContentPackage from Phase 2
  - `reviewScores` — ReviewScore from Phase 3
  - `learnings[]` — BrandHistoryEntry[] from Phase 4
  - `metrics` — Duration per phase

**Pipeline Phases:**

| Phase | Agent | Action | Output |
|-------|-------|--------|--------|
| **Phase 1: Plan** | Advisor | Generates StrategyBrief | `strategy_briefs` (conceptual) |
| **Phase 2: Create** | Copywriter + Creative | Generates ContentPackage | `content_packages` |
| **Phase 3: Review** | Advisor | Scores content (5D) | ReviewScore |
| **Phase 4: Learn** | Advisor | Updates BrandHistory | `brand_history` |

**Where It Lives in Code:**

| Component | File Path |
|-----------|-----------|
| Route Handler | `server/routes/orchestration.ts` → `POST /api/orchestration/pipeline/execute` |
| Core Logic | `server/lib/pipeline-orchestrator.ts` |
| Persistence | `server/lib/persistence-service.ts` |
| Performance Tracking | `server/lib/performance-tracking-job.ts` |

---

### E. Content Planning Service

**Purpose:** Uses AI agents to generate a complete content plan during onboarding or on-demand. Coordinates Copywriter (complete brand guide), Advisor (recommend plan), and Creative (plan content) to produce a 7-day content plan.

**Key Inputs:**
- `brandId` (UUID) — Brand to plan for
- `tenantId` (optional) — Workspace context
- Brand Guide (loaded via `getCurrentBrandGuide()`)
- Brand Profile (loaded via `getBrandProfile()`)
- Scraped Images (loaded via `getScrapedImages()`)

**Key Outputs:**
- `ContentPlan` containing:
  - `items[]` — ContentPlanItem[] (5 social posts, 1 blog, 1 email, 1 GBP post)
  - `advisorRecommendations[]` — Strategic recommendations
- Stored in `content_items` table with status `draft`

**Where It Lives in Code:**

| Component | File Path |
|-----------|-----------|
| Service | `server/lib/content-planning-service.ts` |
| Onboarding Generator | `server/lib/onboarding-content-generator.ts` |

---

### F. Brand Fidelity Scorer (BFS)

**Purpose:** Calculates a 0-1 score measuring how well generated content aligns with the brand. Used by all agents to validate output quality and trigger retry logic.

**Key Inputs:**
- Content text (headline, body, CTA, hashtags)
- Brand Profile (tone keywords, brand personality, writing style, common phrases, banned phrases)

**Key Outputs:**
- `brandFidelityScore` — Overall score (0-1)
- `complianceTags[]` — Flags for specific issues
- `passed` — Boolean (typically passes if score ≥ 0.8)
- Score breakdown (tone_alignment, terminology_match, compliance, cta_fit, platform_fit)

**Where It Lives in Code:**

| Component | File Path |
|-----------|-----------|
| Core Scorer | `server/agents/brand-fidelity-scorer.ts` |
| Enhanced Scorer | `server/lib/brand-fidelity-scorer-enhanced.ts` |
| Tone Classifier | `server/lib/tone-classifier.ts` |

---

### G. Content Linter

**Purpose:** Scans generated content for safety violations, compliance issues, and quality problems. Provides auto-fix capabilities where possible.

**Key Inputs:**
- Content text (body, headline, CTA, hashtags, platform)
- Brand Safety Config (banned phrases, required disclaimers, required hashtags)

**Key Outputs:**
- `passed` — Boolean
- `blocked` — Boolean (if content should not proceed)
- `needs_human_review` — Boolean
- `fixes_applied[]` — Auto-corrections made
- Detected issues (profanity, toxicity, banned_phrases, pii, competitor_mentions)

**Where It Lives in Code:**

| Component | File Path |
|-----------|-----------|
| Linter | `server/agents/content-linter.ts` |
| Used By | `server/routes/agents.ts` (Doc Agent flow) |

---

## 3. Shared Context / Contract

### A. Brand Guide (Source of Truth)

The Brand Guide is the **canonical source of brand identity** for all agents. It's stored in `brands.brand_kit` (JSONB) and loaded via `getCurrentBrandGuide(brandId)`.

**Canonical Shape (from `shared/brand-guide.ts`):**

```typescript
interface BrandGuide {
  id: string;
  brandId: string;
  brandName: string;
  
  // Identity
  identity: {
    name: string;
    businessType?: string;
    industry?: string;
    industryKeywords: string[];
    values?: string[];
    targetAudience?: string;
    painPoints?: string[];
    competitors?: string[];
  };
  
  // Voice & Tone
  voiceAndTone: {
    tone: string[];
    friendlinessLevel: number;
    formalityLevel: number;
    confidenceLevel: number;
    voiceDescription?: string;
    writingRules?: string[];
    avoidPhrases?: string[];
  };
  
  // Visual Identity
  visualIdentity: {
    colors: string[];
    typography: { heading?: string; body?: string; };
    photographyStyle: { mustInclude: string[]; mustAvoid: string[]; };
    logoUrl?: string;
  };
  
  // Content Rules
  contentRules: {
    platformGuidelines?: Record<string, string>;
    preferredPlatforms?: string[];
    preferredPostTypes?: string[];
    contentPillars?: string[];
    neverDo: string[];
    guardrails?: Array<{ id: string; title: string; description: string; }>;
  };
  
  // Performance Insights
  performanceInsights?: {
    visualPatterns?: Array<{ pattern: string; performance: number; }>;
    copyPatterns?: Array<{ pattern: string; performance: number; }>;
    bfsBaseline?: { score: number; };
  };
  
  // Legacy fields
  purpose?: string;
  mission?: string;
  vision?: string;
}
```

**How Agents Access Brand Guide:**

```typescript
import { getCurrentBrandGuide } from "../lib/brand-guide-service";
import { buildFullBrandGuidePrompt } from "../lib/prompts/brand-guide-prompts";

// Load Brand Guide
const brandGuide = await getCurrentBrandGuide(brandId);

// Build prompt context
const brandContext = buildFullBrandGuidePrompt(brandGuide);
```

---

### B. Collaboration Artifacts

Agents share work through these data structures (from `shared/collaboration-artifacts.ts`):

| Artifact | Created By | Consumed By | Stored In |
|----------|------------|-------------|-----------|
| **StrategyBrief** | Advisor | Copywriter, Creative | `strategy_briefs` (conceptual) |
| **ContentPackage** | Copywriter | Creative (adds design), UI | `content_packages` |
| **BrandHistory** | Advisor | All agents | `brand_history` |
| **PerformanceLog** | Analytics/Advisor | Creative, Advisor | In-memory cache |

**StrategyBrief Shape:**

```typescript
interface StrategyBrief {
  id: string;
  brandId: string;
  positioning: {
    tagline: string;
    missionStatement: string;
    targetAudience: { demographics, psychographics, painPoints, aspirations };
  };
  voice: {
    tone: "professional" | "casual" | "energetic" | ...;
    personality: string[];
    keyMessages: string[];
    avoidPhrases: string[];
  };
  visual: {
    primaryColor, secondaryColor, accentColor: string;
    fontPairing: { heading, body };
    imagery: { style, subjects };
  };
  competitive: {
    differentiation: string[];
    uniqueValueProposition: string;
  };
}
```

**ContentPackage Shape:**

```typescript
interface ContentPackage {
  id: string;
  brandId: string;
  contentId: string;
  platform: string;
  status: "draft" | "in_review" | "approved" | "published";
  
  // From Copywriter
  copy: {
    headline: string;
    body: string;
    callToAction: string;
    tone: string;
    keywords: string[];
  };
  
  // Added by Creative
  designContext?: {
    suggestedLayout: string;
    componentPrecedence: string[];
    colorTheme: string;
    accessibilityNotes: string[];
  };
  visuals?: Array<{
    id: string;
    type: "template" | "image" | "graphic";
    format: "ig_post" | "carousel" | "reel_cover" | ...;
    metadata: { format, colorUsage, emotion, layoutStyle, aspectRatio };
  }>;
  
  // Collaboration trail
  collaborationLog: Array<{
    agent: "copywriter" | "creative" | "advisor";
    action: string;
    timestamp: string;
    notes: string;
  }>;
}
```

---

### C. Brand Context Payload

All agents receive brand context through a consistent structure when using the centralized prompt builder:

**Location:** `server/lib/prompts/brand-guide-prompts.ts`

**Functions:**
- `buildFullBrandGuidePrompt(brandGuide)` — Complete brand context for prompts
- `buildIdentityPrompt(brandGuide)` — Identity section only
- `buildVoiceTonePrompt(brandGuide)` — Voice & tone section only
- `buildVisualIdentityPrompt(brandGuide)` — Visual identity section only
- `buildContentRulesPrompt(brandGuide)` — Content rules section only
- `buildBrandGuideContext(brandGuide)` — All sections as a structured object

---

## 4. Current Orchestration Model (As-Is)

### A. Manual / User-Driven Calls

Most agent interactions today are **user-initiated through the UI**:

| Flow | Trigger | Agent(s) | Storage |
|------|---------|----------|---------|
| Generate Caption | User clicks "Generate" in Studio | Doc Agent | Returns to client, manual save |
| Make On-Brand | User clicks "Make on-brand" | Design Agent | Updates ContentPackage |
| Get Insights | User views Advisor dashboard | Advisor Agent | Cached in `advisor_cache` |
| Review BFS | User requests BFS check | BFS Scorer | No persistent storage |

**Example: Doc Agent Direct Call**

```
User → UI → POST /api/agents/generate/doc 
    → Doc Agent loads Brand Guide
    → Doc Agent generates variants
    → Doc Agent calculates BFS
    → Response returned to client
    → User manually saves via Studio/Queue
```

---

### B. Orchestrated Calls (Content Planning)

The **Content Planning Service** orchestrates multiple agents automatically:

```
Onboarding/On-demand → Content Planning Service
    → Step 1: Copywriter completes brand guide context
    → Step 2: Advisor recommends plan of action
    → Step 3: Creative plans content (5 social, 1 blog, 1 email, 1 GBP)
    → Content stored in content_items table
    → Items appear in Content Queue as drafts
```

**Location:** `server/lib/content-planning-service.ts`

---

### C. Full Pipeline Orchestration

The **Pipeline Orchestrator** executes the complete collaborative cycle:

```
POST /api/orchestration/pipeline/execute
    → Phase 1: Plan (Advisor → StrategyBrief)
    → Phase 2: Create (Copywriter → ContentPackage → Creative adds design)
    → Phase 3: Review (Advisor → 5D scoring)
    → Phase 4: Learn (Advisor → BrandHistory update)
    → PipelineCycle returned to client
```

**Current Status:**
- ✅ Infrastructure complete and tested (22/22 tests passing)
- ⚠️ Persistence disabled by default (`PersistenceService { enabled: false }`)
- ⚠️ Not yet wired to production UI flows

**Location:** `server/lib/pipeline-orchestrator.ts`

---

### D. Provider Fallback System

All agents implement a three-layer fallback:

| Layer | Location | Behavior |
|-------|----------|----------|
| **Layer 1: Provider** | `server/workers/ai-generation.ts` | OpenAI → Anthropic on API errors |
| **Layer 2: Agent** | Each agent route | Retry with stricter prompt if BFS < 0.8 |
| **Layer 3: Pipeline** | Planning services | Deterministic fallback if AI unavailable |

---

## 5. Agent Handoff Patterns

### A. Brand Scraper → Brand Kit → All Agents

**Flow:**
```
Website URL → Brand Crawler
    → Extract: images, headlines, colors, typography, voice
    → Persist scraped images to media_assets
    → Generate AI brand kit (voice, keywords, about_blurb)
    → Save to brands.brand_kit (JSONB)
    → All agents load via getCurrentBrandGuide()
    → Prompt built via buildFullBrandGuidePrompt()
```

**Code References:**
- Crawler: `server/workers/brand-crawler.ts`
- Crawler Route: `server/routes/crawler.ts` → `POST /api/crawl/start`
- Image Persistence: `server/lib/scraped-images-service.ts`
- Brand Guide Service: `server/lib/brand-guide-service.ts`

---

### B. Content Planner → Studio/Queue via content_items

**Flow:**
```
Content Planning Service
    → Copywriter generates captions
    → Creative plans layouts
    → Store each item in content_items table (status: draft)
    → Queue page fetches via GET /api/content-items?brandId=X
    → Items appear in Content Queue
    → User edits/schedules in Studio
```

**Code References:**
- Planning Service: `server/lib/content-planning-service.ts`
- Content Items Route: `server/routes/content-items.ts`
- Queue Page: `client/app/(postd)/queue/page.tsx`

---

### C. Doc Agent → ContentPackage → Design Agent

**Flow (Orchestrated):**
```
Doc Agent generates copy
    → Creates ContentPackage with copy fields
    → Logs action to collaborationLog
    → Saves to content_packages table

Design Agent reads ContentPackage
    → Uses copy.headline, copy.body for design context
    → Generates design variants
    → Updates ContentPackage.designContext
    → Adds entries to ContentPackage.visuals[]
    → Logs action to collaborationLog
    → Saves updated ContentPackage
```

**Code References:**
- Doc Agent Route: `server/routes/doc-agent.ts`
- Design Agent Route: `server/routes/design-agent.ts`
- Content Package Storage: `server/lib/collaboration-storage.ts`

---

### D. Advisor → StrategyBrief → Doc/Design Agents

**Flow (Orchestrated):**
```
Advisor Agent (Phase 1)
    → Analyzes brand context and performance
    → Generates StrategyBrief
    → Stores in collaboration context

Doc Agent (Phase 2)
    → Reads StrategyBrief.positioning, StrategyBrief.voice
    → Uses messaging, audience, tone to guide copy

Design Agent (Phase 2)
    → Reads StrategyBrief.visual
    → Uses colors, fonts, imagery style to guide design
```

**Code References:**
- Advisor Route: `server/routes/advisor.ts`
- Pipeline Orchestrator: `server/lib/pipeline-orchestrator.ts`

---

### E. Studio → Scheduler → Publishing

**Flow:**
```
User finalizes content in Studio
    → Saves to content_items (status: approved)
    → User schedules post (date/time, platforms)
    → Creates publishing_job entries
    → Scheduler processes jobs at scheduled time
    → Posts to connected platforms
    → Updates status to published
```

**Code References:**
- Creative Studio Route: `server/routes/creative-studio.ts`
- Publishing Route: `server/routes/publishing.ts`
- Publishing Router: `server/routes/publishing-router.ts`

---

## 6. Database Tables Used

| Table | Purpose | Primary Agent(s) |
|-------|---------|------------------|
| `brands.brand_kit` | Brand Guide (source of truth) | All agents read |
| `content_items` | Generated content | Doc Agent, Planner |
| `content_packages` | Collaboration artifacts | Doc + Design |
| `generation_logs` | Audit trail for all generations | All agents |
| `media_assets` | Scraped/uploaded images | Brand Crawler, Image Sourcing |
| `advisor_cache` | Cached advisor insights (24h TTL) | Advisor |
| `publishing_jobs` | Scheduled publishing jobs | Scheduler |
| `scheduled_content` | Scheduled posts | Studio, Scheduler |
| `analytics_metrics` | Performance data | Advisor reads |

---

## 7. For Cursor: Agent Modification Guidelines

When modifying agents, always:

1. **Read Brand Guide first:**
   ```typescript
   const brandGuide = await getCurrentBrandGuide(brandId);
   if (!brandGuide) throw new Error("Brand Guide required");
   ```

2. **Use centralized prompt builder:**
   ```typescript
   const brandContext = buildFullBrandGuidePrompt(brandGuide);
   // Include brandContext in your prompts
   ```

3. **Calculate BFS for quality assurance:**
   ```typescript
   const bfs = await calculateBFS(content, brandProfile);
   if (!bfs.passed) { /* retry or flag for review */ }
   ```

4. **Log to collaborationLog when updating ContentPackage:**
   ```typescript
   contentPackage.collaborationLog.push({
     agent: "copywriter", // or "creative" or "advisor"
     action: "content_generated",
     timestamp: new Date().toISOString(),
     notes: "Generated 3 variants for Instagram post",
   });
   ```

5. **Implement provider fallback:**
   - Use `generateWithAI()` from `server/workers/ai-generation.ts`
   - Handle errors gracefully with deterministic fallbacks

6. **Never bypass RLS or brand access:**
   ```typescript
   await assertBrandAccess(req, brandId);
   ```

---

## 8. Roadmap: Agent Orchestration Phases

### Phase 1 (Today)

**Current State:**
- ✅ Three core agents functional (Doc, Design, Advisor)
- ✅ Brand Guide as source of truth
- ✅ BFS scoring and content linting
- ✅ Provider fallback (OpenAI → Anthropic)
- ✅ Content Planning Service for onboarding
- ✅ Pipeline Orchestrator infrastructure (tests passing)
- ⚠️ Mostly manual/user-driven flows (user calls agents via UI)
- ⚠️ Pipeline Orchestrator not yet wired to production UI

**Handoffs:**
- Brand Kit → Agents via `buildFullBrandGuidePrompt()`
- Planner → content_items → Queue
- Doc Agent returns to client (user saves manually)
- Design Agent updates ContentPackage (if provided)

---

### Phase 2 (Near-term)

**Goals (from existing docs):**
- **Consistent content save path:** All agent outputs save to `content_items` via unified helper
- **Shared context improvements:** Cache Brand Guide with 5min TTL
- **Studio/Queue predictability:** Content always appears after generation
- **Pipeline Orchestrator UI integration:** Wire `/api/orchestration/pipeline/execute` to Studio

**Planned Improvements:**
- Enable `PersistenceService` for Pipeline Orchestrator
- Add real-time collaboration via WebSockets (existing SocketIO infrastructure)
- Implement performance-driven recommendations (PerformanceLog → Advisor → next cycle)

---

### Phase 3+ (Later)

**Potential Enhancements (as hinted in docs):**
- Event-based handoffs (optional, not currently specified)
- More sophisticated learning loop (BrandHistory patterns → next content)
- Cross-cycle optimization (success patterns influence strategy)

**Not Planned (per existing docs):**
- ❌ No new microservice architecture
- ❌ No event bus (beyond existing patterns)
- ❌ No new agents without explicit approval

---

## 9. Related Documentation

| Document | Purpose |
|----------|---------|
| `docs/00_MASTER_CURSOR_COMMAND_CENTER.md` | Master execution rules |
| `docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md` | Product definition |
| `docs/AI_AGENTS_SYSTEM_OVERVIEW.md` | Complete agent system overview |
| `docs/POSTD_AI_AGENTS_AND_CONTENT_FLOW.md` | Content flow documentation |
| `docs/MULTI_AGENT_SYSTEM_SUMMARY.md` | Multi-agent summary |
| `DOC_BRAND_KIT_PIPELINE.md` | Brand kit pipeline |
| `ORCHESTRATION_IMPLEMENTATION.md` | Pipeline orchestrator details |
| `shared/collaboration-artifacts.ts` | Artifact type definitions |
| `shared/brand-guide.ts` | Brand Guide types |

---

**END OF DOCUMENT**

---

*Generated: 2025-12-10*  
*Based on actual code and documentation in the POSTD repository*

