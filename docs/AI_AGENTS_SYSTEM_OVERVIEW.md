# AI Agents System Overview

> **Status:** ✅ Active – Complete documentation of POSTD's AI agent architecture  
> **Last Updated:** 2025-01-20  
> **Auditor:** POSTD AI Agent System Auditor

**Complete Technical Documentation of POSTD's AI Agent System**

---

## 📋 Purpose

This document provides a comprehensive overview of POSTD's AI agent system, including:
- Agent responsibilities and capabilities
- Collaboration workflows and data flow
- Content intake and storage mechanisms
- Error handling and fallback strategies
- Prompt architecture and Brand Guide integration

---

## 🎯 Executive Summary

POSTD implements a **three-agent collaborative intelligence system**:

1. **Doc Agent (Copywriter)** - Generates on-brand text content (captions, posts, emails, blogs)
2. **Design Agent (Creative)** - Creates visual concepts, layouts, and design metadata
3. **Advisor Agent (Strategist)** - Provides insights, recommendations, and performance analysis

All agents:
- ✅ Load Brand Guide via `getCurrentBrandGuide()` (source of truth)
- ✅ Use structured prompts with Brand Guide context
- ✅ Implement provider fallback (OpenAI → Anthropic → deterministic)
- ✅ Store outputs in collaboration artifacts (StrategyBrief, ContentPackage, BrandHistory)
- ✅ Log all actions with context and request IDs
- ✅ Calculate Brand Fidelity Score (BFS) for quality assurance

---

## 🤖 A. Agent Responsibilities

### 1. Doc Agent (Copywriter)

**Location:** `server/routes/doc-agent.ts`, `server/lib/copy-agent.ts`

**Primary Responsibility:**
Generates on-brand text content for social media, emails, blogs, and other platforms.

**Key Capabilities:**
- ✅ Extracts structured meaning from text (captions, outlines, summaries)
- ✅ Converts longform ideas → usable content
- ✅ Handles content refinement, rewriting, brand alignment
- ✅ Works with Brand Guide + avoid phrases + content rules
- ✅ Generates multiple variants (typically 3) for A/B testing
- ✅ Calculates Brand Fidelity Score (BFS) for each variant
- ✅ Supports retry logic when BFS < 0.8 threshold

**Input Sources:**
- Brand Guide (via `getCurrentBrandGuide()`)
- Brand Profile (tone, values, target audience)
- StrategyBrief (positioning, voice, competitive context)
- ContentPackage (existing copy for refinement)
- Available images (for context)
- User request (topic, platform, contentType, tone, length, CTA)

**Output Format:**
```typescript
{
  variants: AiDocVariant[],
  brandContext: BrandContextPayload,
  request: AiDocGenerationRequest,
  metadata: {
    provider: "openai" | "claude",
    latencyMs: number,
    retryAttempted: boolean,
    status: "success" | "partial_success" | "failure",
    averageBrandFidelityScore: number,
    complianceTagCounts: Record<string, number>
  },
  warnings?: AiAgentWarning[]
}
```

**Storage:**
- Writes to `content_packages` table (via `ContentPackageStorage.save()`)
- Appends to `collaboration_log` in ContentPackage
- Stores variants in `content_items` table (when content is finalized)

**Brand Guide Integration:**
- ✅ Loads via `getCurrentBrandGuide(brandId)`
- ✅ Uses `buildFullBrandGuidePrompt()` for prompt context
- ✅ Enforces `voiceAndTone.avoidPhrases`
- ✅ Applies `contentRules.neverDo` and `contentRules.guardrails`
- ✅ Uses `identity.industryKeywords` for industry-specific terminology

---

### 2. Design Agent (Creative)

**Location:** `server/routes/design-agent.ts`, `server/lib/creative-agent.ts`

**Primary Responsibility:**
Creates visual concepts, layouts, and design metadata for creative assets.

**Key Capabilities:**
- ✅ Creates asset plans (layout metadata, styles)
- ✅ Generates descriptions for creative assets
- ✅ Works with image sourcing (scraped, stock, uploaded)
- ✅ Prepares metadata for Creative Studio
- ✅ Generates design prompts for image generation
- ✅ Validates WCAG AA accessibility compliance
- ✅ Uses performance insights to adapt designs

**Input Sources:**
- Brand Guide (via `getCurrentBrandGuide()`)
- Brand Visual Identity (colors, fonts, spacing tokens)
- StrategyBrief (visual identity, competitive positioning)
- ContentPackage (copy from Doc Agent)
- BrandHistory (visual performance patterns)
- PerformanceLog (recent visual performance data)
- Available images (prioritized: brand assets → stock)

**Output Format:**
```typescript
{
  variants: AiDesignVariant[],
  brandContext: BrandContextPayload,
  request: AiDesignGenerationRequest,
  metadata: {
    provider: "openai" | "claude",
    latencyMs: number,
    retryAttempted: boolean,
    status: "success" | "partial_success" | "failure",
    averageBrandFidelityScore: number,
    complianceTagCounts: Record<string, number>
  },
  warnings?: AiAgentWarning[]
}
```

**Storage:**
- Updates `content_packages` table with `designContext` and `visuals` array
- Appends to `collaboration_log` in ContentPackage
- Stores design metadata in `design_assets` table (when finalized)

**Brand Guide Integration:**
- ✅ Loads via `getCurrentBrandGuide(brandId)`
- ✅ Uses `buildFullBrandGuidePrompt()` for prompt context
- ✅ Enforces `visualIdentity.colors` and `visualIdentity.typography`
- ✅ Applies `visualIdentity.photographyStyle.mustInclude` and `mustAvoid`
- ✅ Uses `contentRules.platformGuidelines` for platform-specific design rules

---

### 3. Advisor Agent (Strategist)

**Location:** `server/routes/advisor.ts`, `server/lib/advisor-engine.ts`

**Primary Responsibility:**
Provides insights, recommendations, diagnostics, and strategic guidance.

**Key Capabilities:**
- ✅ Provides insights, recommendations, diagnostics
- ✅ Supports planning: weekly focus, content gaps, opportunities
- ✅ Uses analytics + Brand Guide context
- ✅ Helps improve content strategy
- ✅ Analyzes trends and performance patterns
- ✅ Generates 5-dimensional review scoring (clarity, alignment, resonance, actionability, platform fit)
- ✅ Provides adaptive reflection questions

**Input Sources:**
- Brand Guide (via `getCurrentBrandGuide()`)
- Brand Profile (analytics, metrics)
- Performance data (post performance, engagement metrics)
- BrandHistory (success patterns, design fatigue alerts)
- PerformanceLog (recent content performance)

**Output Format:**
```typescript
{
  insights: AdvisorInsight[],
  brandContext: BrandContextPayload,
  request: AdvisorRequest,
  metadata: {
    provider: "openai" | "claude",
    latencyMs: number,
    retryAttempted: boolean,
    status: "success" | "partial_success" | "failure"
  },
  compliance: {
    brandFidelityScore: number,
    complianceTagCounts: Record<string, number>
  },
  warnings?: AiAgentWarning[]
}
```

**Storage:**
- Stores insights in `advisor_cache` table (24h TTL)
- Updates `brand_history` table with success patterns
- Logs actions to `advisor_feedback` table

**Brand Guide Integration:**
- ✅ Loads via `getCurrentBrandGuide(brandId)`
- ✅ Uses `buildFullBrandGuidePrompt()` for prompt context
- ✅ Analyzes `performanceInsights.visualPatterns` and `copyPatterns`
- ✅ Uses `contentRules.contentPillars` for topic recommendations
- ✅ Applies `contentRules.guardrails` to filter recommendations

---

## 🔄 B. How They Work Together (Pipeline)

### Content Generation Pipeline

```
User Input
    ↓
Content Intake (raw text, brand guide, scraped metadata)
    ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 1: Strategy Planning (Advisor)                  │
│ - Generates StrategyBrief                               │
│ - Analyzes brand context and performance                │
│ - Output: StrategyBrief → strategy_briefs table        │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 2: Content Creation (Doc Agent)                  │
│ - Reads StrategyBrief                                   │
│ - Generates copy variants                               │
│ - Calculates BFS for each variant                       │
│ - Output: ContentPackage → content_packages table       │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 3: Visual Design (Design Agent)                  │
│ - Reads ContentPackage from Doc Agent                   │
│ - Reads BrandHistory and PerformanceLog                 │
│ - Generates design concepts and visuals                 │
│ - Updates ContentPackage with designContext + visuals   │
│ - Output: Updated ContentPackage                        │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│ Phase 4: Review & Learn (Advisor)                       │
│ - Reviews ContentPackage                                │
│ - Generates 5D scoring                                  │
│ - Updates BrandHistory with learnings                   │
│ - Output: BrandHistory → brand_history table            │
└─────────────────────────────────────────────────────────┘
    ↓
Content Package → Storage → UI
```

### Collaboration Artifacts Flow

**StrategyBrief:**
- Created by: Advisor Agent (or manually)
- Stored in: `strategy_briefs` table
- Used by: Doc Agent, Design Agent
- Fields: `positioning`, `voice`, `visual`, `competitive`

**ContentPackage:**
- Created by: Doc Agent
- Updated by: Design Agent (adds `designContext` and `visuals`)
- Stored in: `content_packages` table
- Used by: UI (Creative Studio, Preview Calendar)
- Fields: `copy`, `designContext`, `visuals`, `collaborationLog`, `status`

**BrandHistory:**
- Created/Updated by: Advisor Agent
- Stored in: `brand_history` table
- Used by: All agents (for performance-driven adaptation)
- Fields: `entries`, `successPatterns`, `designFatigueAlerts`, `constraints`

**PerformanceLog:**
- Created by: Analytics system (post-publish)
- Stored in: In-memory cache (temporary)
- Used by: Advisor Agent, Design Agent
- Fields: `contentPerformance`, `visualPerformance`, `patterns`, `platformInsights`

---

## 📥 C. Content Intake & Storage

### Content Intake Sources

1. **Website Scraper Extraction** (`server/lib/scraped-images-service.ts`)
   - Extracts images, headlines, about text from brand websites
   - Stores in `scraped_images` table
   - Prioritized by: brand assets → stock images → generic

2. **Brand Guide Fields** (`server/lib/brand-guide-service.ts`)
   - Loaded via `getCurrentBrandGuide(brandId)`
   - Stored in `brands.brand_kit` (JSONB)
   - Normalized via `normalizeBrandGuide()` from `@shared/brand-guide`

3. **User-Provided Text/Captions**
   - Via API endpoints: `POST /api/agents/generate/doc`
   - Request body: `AiDocGenerationRequest`
   - Includes: `topic`, `platform`, `contentType`, `tone`, `length`, `callToAction`

4. **Image Uploads**
   - Via `server/lib/image-sourcing.ts`
   - Prioritized: brand assets → stock images → uploaded → generic
   - Stored in `media_assets` table

5. **AI-Generated Layouts**
   - Via Design Agent
   - Stored in `content_packages.designContext` and `content_packages.visuals`

6. **Metadata** (platform, post type, weekly focus)
   - Via `content_planning_service.ts`
   - Stored in `content_items` table

### Storage Locations

| Storage Area | Table | Key Fields | Agent Output |
|-------------|-------|------------|--------------|
| **Generated Content** | `content_items` | `body`, `caption`, `platform`, `type`, `content` (JSONB), `metadata`, `bfs_score` | Doc Agent variants |
| **Content Plan Packages** | `content_packages` | `copy`, `designContext`, `visuals`, `collaborationLog`, `status` | Doc + Design Agent collaboration |
| **Design Assets** | `design_assets` | `layout` (JSONB), `brand_data`, `image_refs` | Design Agent metadata |
| **Collaboration Artifacts** | `strategy_briefs` | `positioning`, `voice`, `visual`, `competitive` | Advisor Agent |
| **Collaboration Artifacts** | `content_packages` | `copy`, `designContext`, `visuals`, `collaborationLog` | Doc + Design Agent |
| **Collaboration Artifacts** | `brand_history` | `entries`, `successPatterns`, `designFatigueAlerts` | Advisor Agent |
| **Brand Guide** | `brands.brand_kit` | `identity`, `voiceAndTone`, `visualIdentity`, `contentRules`, `performanceInsights` | Source of truth |

### ID Relationships

**ContentPackage References:**
- `content_packages.content_id` → `content_items.id` (optional)
- `content_packages.brand_id_uuid` → `brands.id` (UUID)
- `content_packages.request_id` → Links to generation request

**Design Assets References:**
- `design_assets.content_item_id` → `content_items.id` (optional)
- `design_assets.brand_id` → `brands.id`

**Collaboration Artifacts:**
- `strategy_briefs.brand_id_uuid` → `brands.id` (UUID)
- `content_packages.brand_id_uuid` → `brands.id` (UUID)
- `brand_history.brand_id_uuid` → `brands.id` (UUID)

**BFS Score Relationships:**
- `content_items.bfs_score` → Calculated by `calculateBrandFidelityScore()`
- `generation_logs.bfs_score` → Stored for audit trail
- `content_packages.copy.brandFidelityScore` → Per-variant BFS

---

## 🔍 D. Referencing & Fetching

### Agents → Storage

**Doc Agent Storage:**
```typescript
// Writes to content_packages
await ContentPackageStorage.save({
  id: contentPackageId,
  brandId,
  contentId: `content_${Date.now()}`,
  platform,
  status: "draft",
  copy: {
    headline: selectedVariant.content.split('\n')[0],
    body: selectedVariant.content,
    callToAction: callToAction || "",
    tone: selectedVariant.tone || tone || "professional",
    keywords: [],
    estimatedReadTime: Math.ceil((selectedVariant.wordCount || 0) / 200),
  },
  collaborationLog: [{
    agent: "copywriter",
    action: "content_generated",
    timestamp: new Date().toISOString(),
    notes: `Generated ${variants.length} variants for ${contentType} on ${platform}`,
  }],
});
```

**Design Agent Storage:**
```typescript
// Updates content_packages with design context
contentPackage.designContext = {
  suggestedLayout: selectedVariant.useCase || format,
  componentPrecedence: ["headline", "visual", "cta"],
  colorTheme: visualStyle || "brand-primary",
  motionConsiderations: [],
  accessibilityNotes: [],
};

// Adds visuals array
contentPackage.visuals = variants.map(variant => 
  mapVariantToVisualEntry(variant, {
    source: "design_agent_make_on_brand",
    selected: false,
    designFormat: format,
    platform: platform,
  })
);

await ContentPackageStorage.save(contentPackage);
```

**Advisor Agent Storage:**
```typescript
// Updates brand_history
await BrandHistoryStorage.save({
  id: `bh_${Date.now()}`,
  brandId,
  entries: [...existingEntries, newEntry],
  successPatterns: updatedPatterns,
  designFatigueAlerts: alerts,
  constraints: constraints,
  lastUpdated: new Date().toISOString(),
});
```

### Fetching → UI

**Content Plans:**
- UI fetches from `GET /api/content-plan/:brandId`
- Service reads from `content_items` table
- Filters by `brand_id`, `status`, `scheduled_for`

**Creative Studio:**
- UI fetches from `GET /api/content-packages/:packageId`
- Service reads from `content_packages` table via `ContentPackageStorage.getById()`
- Loads `designContext` and `visuals` array for rendering

**Preview Calendar:**
- UI fetches from `GET /api/content-items?brandId=:brandId&status=scheduled`
- Service reads from `content_items` table
- Uses `scheduled_for` for calendar display

**Collaboration Screens:**
- UI fetches from `GET /api/content-packages/:packageId`
- Service reads `collaborationLog` from `content_packages` table
- Displays variant history and agent actions

---

## 🎨 E. Prompts Architecture

### Prompt Structure

All agents use a **three-part prompt structure**:

1. **System Prompt** (`buildDocSystemPrompt()`, `buildDesignSystemPrompt()`, `buildAdvisorSystemPrompt()`)
   - Defines agent role and capabilities
   - Sets quality requirements
   - Specifies output format

2. **User Prompt** (`buildDocUserPrompt()`, `buildDesignUserPrompt()`, `buildAdvisorUserPrompt()`)
   - Includes Brand Guide context (via `buildFullBrandGuidePrompt()`)
   - Includes request parameters
   - Includes collaboration context (StrategyBrief, ContentPackage, BrandHistory, PerformanceLog)
   - Includes available images

3. **Retry Prompt** (`buildDocRetryPrompt()`, `buildDesignRetryPrompt()`)
   - Used when BFS < 0.8 threshold
   - Provides stricter brand alignment instructions
   - Includes feedback from initial attempt

### Brand Guide Integration

**Centralized Prompt Builder:**
- Location: `server/lib/prompts/brand-guide-prompts.ts`
- Function: `buildFullBrandGuidePrompt(brandGuide: BrandGuide)`
- Used by: All agents via prompt builders

**Brand Guide Fields Used:**
- `identity.businessType` - Industry context
- `identity.industryKeywords` - Industry-specific terminology
- `voiceAndTone.tone` - Tone descriptors
- `voiceAndTone.voiceDescription` - Voice description
- `voiceAndTone.avoidPhrases` - Forbidden phrases
- `voiceAndTone.writingRules` - Writing guidelines
- `visualIdentity.colors` - Brand colors
- `visualIdentity.typography` - Fonts
- `visualIdentity.photographyStyle` - Image style guidelines
- `contentRules.neverDo` - Content guardrails
- `contentRules.guardrails` - Additional constraints
- `contentRules.contentPillars` - Content themes
- `performanceInsights.visualPatterns` - Performance-driven adaptation
- `performanceInsights.copyPatterns` - Copy performance patterns

### Prompt Files

**File Structure:**
```
prompts/
├── doc/
│   └── en/
│       └── v1.0.md
├── design/
│   └── en/
│       └── v1.0.md
└── advisor/
    └── en/
        └── v1.0.md
```

**Code Prompt Builders:**
- `server/lib/ai/docPrompt.ts` - Doc Agent prompts
- `server/lib/ai/designPrompt.ts` - Design Agent prompts
- `server/lib/ai/advisorPrompt.ts` - Advisor Agent prompts

**Loading:**
- Via `loadPromptTemplate(agent, version, locale)` in `server/workers/ai-generation.ts`
- Falls back to `getFallbackTemplate()` if file not found

---

## 🛡️ F. Error Handling & Provider Fallback

### Three-Layer Fallback System

**Layer 1: Provider-Level Fallback**
- Location: `server/workers/ai-generation.ts`
- Function: `generateWithAI(prompt, agentType, provider)`
- Logic:
  1. Try primary provider (OpenAI or Anthropic based on `AI_PROVIDER` env var)
  2. If API error (network, rate limit, 503, 502, 500, 429), try fallback provider
  3. If both providers fail, throw error (caught by agent-level fallback)

**Layer 2: Agent-Level Fallback**
- Location: `server/routes/doc-agent.ts`, `server/routes/design-agent.ts`, `server/routes/advisor.ts`
- Logic:
  1. Try generation with retry logic (max 2 attempts)
  2. If BFS < 0.8, retry with stricter prompt
  3. If generation fails, try fallback provider
  4. If all attempts fail, return error response (caught by pipeline-level fallback)

**Layer 3: Pipeline-Level Fallback**
- Location: `server/lib/onboarding-content-generator.ts`, `server/lib/content-planning-service.ts`
- Logic:
  1. If AI completely unavailable, generate deterministic default content plan
  2. Uses `generateDefaultContentPackage()` or `generateDefaultContentPlan()`
  3. Creates sensible content based on brand info and weekly focus
  4. Logs fallback usage for monitoring

### Provider Configuration

**Default Provider:**
- Determined by `getDefaultProvider()` in `server/workers/ai-generation.ts`
- Priority: OpenAI (if `OPENAI_API_KEY` set) → Anthropic (if `ANTHROPIC_API_KEY` set)
- Can be overridden via `AI_PROVIDER` env var: `"anthropic"` → Claude, otherwise OpenAI

**Model Selection:**
- OpenAI: `DEFAULT_OPENAI_MODEL` (doc, design) or `ADVANCED_OPENAI_MODEL` (advisor)
- Anthropic: `claude-3-5-haiku-20241022` (doc) or `claude-3-5-sonnet-20241022` (design, advisor)
- Can be overridden via `ANTHROPIC_MODEL` env var

**Error Detection:**
- API errors: Network, timeout, rate limit, service unavailable (503, 502, 500, 429)
- Configuration errors: Missing API key, invalid model name
- Only API errors trigger fallback; configuration errors throw immediately

### Logging

**Agent Logging:**
- All agents log via `logger.info()`, `logger.warn()`, `logger.error()` from `server/lib/logger.ts`
- Context includes: `brandId`, `agentType`, `provider`, `latencyMs`, `avgBFS`, `retryAttempted`, `variantCount`
- Example: `logDocAgentCall(provider, latencyMs, avgBFS, retryAttempted, variantCount, error)`

**Event Broadcasting:**
- All agents broadcast events via `broadcastAgentCompleted()` or `broadcastAgentFailed()` from `server/lib/event-broadcaster.ts`
- Events include: `agent`, `brandId`, `userId`, `status`, `variantCount`, `avgBFS`, `warnings`, `latencyMs`

**Generation Logs:**
- Stored in `generation_logs` table
- Fields: `brand_id`, `agent`, `prompt_version`, `input`, `output`, `bfs_score`, `approved`, `duration_ms`, `tokens_in`, `tokens_out`, `provider`, `model`, `regeneration_count`, `request_id`, `error`

---

## 📊 G. Data Flow Examples

### Example 1: Generate Social Media Post

```
1. User Request:
   POST /api/agents/generate/doc
   {
     brandId: "brand-123",
     topic: "Product launch announcement",
     platform: "instagram",
     contentType: "post",
     tone: "professional",
     length: "short"
   }

2. Doc Agent Processing:
   - Loads Brand Guide via getCurrentBrandGuide("brand-123")
   - Loads Brand Profile via getBrandProfile("brand-123")
   - Gets available images via getPrioritizedImages("brand-123", 5)
   - Builds prompt with Brand Guide context
   - Calls generateWithAI(prompt, "doc", "openai")
   - Parses 3 variants from response
   - Calculates BFS for each variant
   - If avgBFS < 0.8, retries with stricter prompt
   - Saves ContentPackage to content_packages table
   - Broadcasts agent completion event

3. Response:
   {
     variants: [
       { id: "variant-1", content: "...", brandFidelityScore: 0.85, ... },
       { id: "variant-2", content: "...", brandFidelityScore: 0.82, ... },
       { id: "variant-3", content: "...", brandFidelityScore: 0.88, ... }
     ],
     metadata: {
       provider: "openai",
       latencyMs: 2341,
       retryAttempted: false,
       status: "success",
       averageBrandFidelityScore: 0.85
     }
   }
```

### Example 2: Generate Design Concept

```
1. User Request:
   POST /api/agents/generate/design
   {
     brandId: "brand-123",
     campaignName: "Summer Campaign",
     platform: "instagram",
     format: "carousel",
     visualStyle: "modern",
     contentPackageId: "cp-456"
   }

2. Design Agent Processing:
   - Loads Brand Guide via getCurrentBrandGuide("brand-123")
   - Loads ContentPackage via ContentPackageStorage.getById("cp-456")
   - Loads BrandHistory via BrandHistoryStorage.get("brand-123")
   - Loads PerformanceLog via PerformanceLogStorage.getLatest("brand-123")
   - Gets brand visual identity via getBrandVisualIdentity("brand-123")
   - Gets available images via getPrioritizedImages("brand-123", 5)
   - Builds prompt with all collaboration context
   - Calls generateWithAI(prompt, "design", "openai")
   - Parses design variants from response
   - Calculates BFS for each variant
   - Updates ContentPackage with designContext and visuals
   - Saves updated ContentPackage
   - Broadcasts agent completion event

3. Response:
   {
     variants: [
       { id: "variant-1", prompt: "...", description: "...", brandFidelityScore: 0.87, ... },
       { id: "variant-2", prompt: "...", description: "...", brandFidelityScore: 0.84, ... },
       { id: "variant-3", prompt: "...", description: "...", brandFidelityScore: 0.89, ... }
     ],
     metadata: {
       provider: "openai",
       latencyMs: 3124,
       retryAttempted: false,
       status: "success",
       averageBrandFidelityScore: 0.87
     }
   }
```

### Example 3: Get Advisor Insights

```
1. User Request:
   POST /api/advisor/insights
   {
     brandId: "brand-123",
     metrics: { timeRange: "30d" }
   }

2. Advisor Agent Processing:
   - Loads Brand Guide via getCurrentBrandGuide("brand-123")
   - Loads Brand Profile via getBrandProfile("brand-123")
   - Loads analytics data from database
   - Builds prompt with Brand Guide and analytics context
   - Calls generateWithAI(prompt, "advisor", "openai")
   - Parses insights from response
   - Calculates compliance score
   - Updates BrandHistory with new insights
   - Caches results in advisor_cache table (24h TTL)
   - Broadcasts agent completion event

3. Response:
   {
     insights: [
       { title: "...", body: "...", severity: "info", category: "content", ... },
       { title: "...", body: "...", severity: "warning", category: "timing", ... }
     ],
     compliance: {
       brandFidelityScore: 0.91,
       complianceTagCounts: {}
     },
     metadata: {
       provider: "openai",
       latencyMs: 4567,
       retryAttempted: false,
       status: "success"
     }
   }
```

---

## 🔧 H. Future TODOs

### High Priority
1. **Database Schema Alignment**
   - Verify all tables exist and match code expectations
   - Ensure `brand_id_uuid` (UUID) is used consistently (migration 005)
   - Add missing indexes for performance

2. **Performance Optimization**
   - Implement caching for Brand Guide loads (5min TTL)
   - Optimize ContentPackage queries with proper indexes
   - Add connection pooling for Supabase queries

3. **Error Recovery**
   - Implement exponential backoff for retry logic
   - Add circuit breaker pattern for provider failures
   - Improve deterministic fallback content quality

### Medium Priority
4. **Analytics Integration**
   - Connect PerformanceLog to actual post analytics
   - Implement automatic BrandHistory updates post-publish
   - Add performance-driven recommendation engine

5. **Collaboration Enhancement**
   - Add real-time collaboration via WebSockets
   - Implement variant comparison UI
   - Add agent action history viewer

6. **Testing**
   - Add integration tests for full pipeline
   - Add unit tests for prompt builders
   - Add E2E tests for agent collaboration

### Low Priority
7. **Documentation**
   - Add API documentation (OpenAPI/Swagger)
   - Create agent prompt versioning guide
   - Document Brand Guide field requirements

8. **Monitoring**
   - Add Prometheus metrics for agent performance
   - Implement alerting for provider failures
   - Add dashboard for agent usage analytics

---

## 📚 I. Related Documentation

- `docs/00_MASTER_CURSOR_COMMAND_CENTER.md` - Command Center rules
- `server/lib/brand-guide-service.ts` - Brand Guide service
- `server/lib/collaboration-storage.ts` - Collaboration artifacts storage
- `server/workers/ai-generation.ts` - AI generation worker
- `shared/collaboration-artifacts.ts` - Collaboration artifact types
- `shared/brand-guide.ts` - Brand Guide types

---

**END OF DOCUMENT**

