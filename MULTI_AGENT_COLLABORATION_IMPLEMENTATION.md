# Multi-Agent Collaboration Implementation Summary

## Overview

Successfully implemented multi-agent collaboration infrastructure for Postd's AI system (The Copywriter, The Creative, The Advisor). All three agents now participate in a unified collaboration loop, sharing context via StrategyBrief and ContentPackage artifacts.

## Files Changed

### Shared Types & Validation
- **`shared/collaboration-artifacts.ts`** (NEW)
  - Centralized types: `StrategyBrief`, `ContentPackage`, `BrandHistory`, `PerformanceLog`, `CollaborationContext`
  - Helper functions for creating artifacts

- **`shared/validation-schemas.ts`**
  - Added optional `requestId`, `strategyBriefId`, `contentPackageId` to:
    - `AdvisorRequestSchema`
    - `AiDocGenerationRequestSchema`
    - `AiDesignGenerationRequestSchema`

### Storage & Infrastructure
- **`server/lib/collaboration-storage.ts`** (NEW)
  - `StrategyBriefStorage`: Get/save StrategyBrief
  - `ContentPackageStorage`: Get/save ContentPackage by ID or requestId
  - `BrandHistoryStorage`: In-memory cache (ready for DB)
  - `PerformanceLogStorage`: In-memory cache (ready for DB)
  - 5-minute TTL cache for performance

- **`server/lib/collaboration-artifacts.ts`**
  - Updated to re-export from `@shared/collaboration-artifacts`
  - Removed duplicate type definitions

- **`server/lib/pipeline-orchestrator.ts`**
  - Updated imports to use shared types
  - Fixed agent naming: "copy" → "copywriter"
  - Updated method signatures to use `CollaborationContext`

### Routes
- **`server/routes/doc-agent.ts`**
  - Accepts optional `requestId`, `strategyBriefId`, `contentPackageId`
  - Reads StrategyBrief if provided (enhances prompts)
  - Reads/updates ContentPackage if provided
  - Saves ContentPackage after generation
  - Log naming: `[DocAgent]` → `[Copywriter]`

- **`server/routes/design-agent.ts`**
  - Accepts optional `requestId`, `strategyBriefId`, `contentPackageId`
  - Reads StrategyBrief and ContentPackage if provided
  - Updates ContentPackage with design context after generation
  - Log naming: `[DesignAgent]` → `[Creative]`

- **`server/routes/advisor.ts`**
  - Accepts optional `requestId`, `strategyBriefId`, `contentPackageId`
  - Generates and saves StrategyBrief after insights generation
  - Log naming: `[Advisor]` (unchanged, already correct)

- **`server/routes/orchestration.ts`**
  - Updated to use `PipelineOrchestrator` class
  - Added authentication and scope checks
  - Uses shared types from `@shared/collaboration-artifacts`

- **`server/routes/ai-sync.ts`** (NEW)
  - `POST /api/ai/sync` endpoint
  - Returns current collaboration state for a brand/request

- **`server/index.ts`**
  - Registered `/api/orchestration` router
  - Registered `/api/ai/sync` endpoint

### Prompt Builders
- **`server/lib/ai/docPrompt.ts`**
  - System prompt: "You are The Copywriter for Postd"
  - Accepts `StrategyBrief` in context
  - Includes StrategyBrief in user prompt if available

- **`server/lib/ai/designPrompt.ts`**
  - System prompt: "You are The Creative for Postd"
  - Accepts `StrategyBrief` and `ContentPackage` in context
  - Includes both in user prompt if available

- **`server/lib/ai/advisorPrompt.ts`**
  - System prompt: "You are The Advisor for Postd"

- **`server/lib/creative-system-prompt.ts`**
  - Updated: "You are The Creative for Postd"
  - Updated collaboration references: "The Copywriter and The Advisor"

### Tests
- **`server/__tests__/collaboration.test.ts`** (NEW)
  - Integration tests for `/api/orchestration/pipeline/execute`
  - Integration tests for `/api/ai/sync`

## New Endpoint Shapes

### POST /api/orchestration/pipeline/execute
**Request:**
```typescript
{
  brandId: string; // Required
  context?: Partial<CollaborationContext>; // Optional
  options?: Record<string, unknown>; // Optional
}
```

**Response:**
```typescript
{
  success: true;
  cycle: {
    cycleId: string;
    brandId: string;
    requestId: string;
    timestamp: string;
    status: "planning" | "creating" | "reviewing" | "learning" | "complete" | "failed";
    strategy: StrategyBrief | null;
    contentPackage: ContentPackage | null;
    reviewScores: ReviewScore | null;
    learnings: BrandHistoryEntry[];
    metrics: {
      planDurationMs: number;
      createDurationMs: number;
      reviewDurationMs: number;
      learnDurationMs: number;
    };
    errors: Array<{ phase: string; error: string; timestamp: string }>;
  };
}
```

**Auth:** Requires `authenticateUser` + `requireScope("ai:generate")`

### POST /api/ai/sync
**Request:**
```typescript
{
  brandId: string; // Required (UUID)
  requestId?: string; // Optional
}
```

**Response:**
```typescript
{
  brandId: string;
  requestId: string | null;
  strategyBrief: StrategyBrief | null;
  contentPackage: ContentPackage | null;
  advisorFeedback: Array<{
    action: string;
    notes: string;
    timestamp: string;
  }>;
  status: "planning" | "creating" | "reviewing" | "complete";
  timestamp: string;
}
```

**Auth:** Requires `authenticateUser` + `requireScope("ai:generate")`

### Updated: POST /api/ai/doc
**Request (now accepts collaboration context):**
```typescript
{
  brandId: string; // Required
  topic: string; // Required
  platform: string; // Required
  contentType: "caption" | "email" | "blog" | "ad" | "script" | "other"; // Required
  // ... existing fields ...
  requestId?: string; // NEW - Optional
  strategyBriefId?: string; // NEW - Optional
  contentPackageId?: string; // NEW - Optional
}
```

**Behavior:**
- If `strategyBriefId` provided: Reads StrategyBrief and includes in prompt
- If `contentPackageId` provided: Reads existing ContentPackage or creates new
- After generation: Saves/updates ContentPackage with copy content
- Backwards compatible: Works exactly as before if no collaboration context provided

### Updated: POST /api/ai/design
**Request (now accepts collaboration context):**
```typescript
{
  brandId: string; // Required
  platform: string; // Required
  format: "story" | "feed" | "reel" | "short" | "ad" | "other"; // Required
  // ... existing fields ...
  requestId?: string; // NEW - Optional
  strategyBriefId?: string; // NEW - Optional
  contentPackageId?: string; // NEW - Optional
}
```

**Behavior:**
- If `strategyBriefId` provided: Reads StrategyBrief and includes in prompt
- If `contentPackageId` provided: Reads ContentPackage from Copywriter and includes in prompt
- After generation: Updates ContentPackage with design context
- Backwards compatible: Works exactly as before if no collaboration context provided

### Updated: POST /api/ai/advisor
**Request (now accepts collaboration context):**
```typescript
{
  brandId: string; // Required
  timeRange?: "7d" | "30d" | "90d" | "all"; // Optional
  // ... existing fields ...
  requestId?: string; // NEW - Optional
  strategyBriefId?: string; // NEW - Optional
  contentPackageId?: string; // NEW - Optional
}
```

**Behavior:**
- If `strategyBriefId` provided: Reads existing StrategyBrief for updates
- If `contentPackageId` provided: Reads ContentPackage for review context
- After generation: Generates and saves StrategyBrief from insights
- Backwards compatible: Works exactly as before if no collaboration context provided

## How Individual AI Routes Participate in Collaboration Loop

### The Advisor (Phase 1: Plan)
1. **Input:** Brand analytics, performance data
2. **Process:** Analyzes data, generates insights
3. **Output:** 
   - Returns insights (existing behavior)
   - **NEW:** Generates and saves `StrategyBrief` if `requestId` or `strategyBriefId` provided
4. **Artifact:** `StrategyBrief` stored via `StrategyBriefStorage`

### The Copywriter (Phase 2: Create - Copy)
1. **Input:** 
   - Topic, platform, content type (existing)
   - **NEW:** `strategyBriefId` → Reads StrategyBrief from Advisor
   - **NEW:** `contentPackageId` → Reads existing ContentPackage (if updating)
2. **Process:** 
   - **NEW:** Prompt enhanced with StrategyBrief context if available
   - Generates copy variants (existing behavior)
3. **Output:**
   - Returns variants (existing behavior)
   - **NEW:** Saves/updates `ContentPackage` with copy content if `requestId` or `contentPackageId` provided
4. **Artifact:** `ContentPackage` stored via `ContentPackageStorage`

### The Creative (Phase 2: Create - Design)
1. **Input:**
   - Platform, format, visual style (existing)
   - **NEW:** `strategyBriefId` → Reads StrategyBrief from Advisor
   - **NEW:** `contentPackageId` → Reads ContentPackage from Copywriter
2. **Process:**
   - **NEW:** Prompt enhanced with StrategyBrief and ContentPackage context
   - Generates design concepts (existing behavior)
3. **Output:**
   - Returns design variants (existing behavior)
   - **NEW:** Updates `ContentPackage` with design context if `requestId` or `contentPackageId` provided
4. **Artifact:** `ContentPackage.designContext` updated via `ContentPackageStorage`

### Collaboration Flow Example

```
1. User calls /api/orchestration/pipeline/execute
   → PipelineOrchestrator executes full cycle:
   
2. Phase 1 (Plan): Advisor generates StrategyBrief
   → Saved to StrategyBriefStorage
   
3. Phase 2 (Create): 
   a. Copywriter reads StrategyBrief, generates copy
      → Saved to ContentPackageStorage
   b. Creative reads StrategyBrief + ContentPackage, generates design
      → Updates ContentPackage with designContext
      
4. Phase 3 (Review): Advisor reviews ContentPackage
   → Scores content, adds feedback to collaborationLog
   
5. Phase 4 (Learn): System updates BrandHistory
   → Records learnings for future cycles
```

### Standalone Usage (Backwards Compatible)

All three routes work independently without collaboration context:

- **`/api/ai/advisor`** without `requestId` → Returns insights only (no StrategyBrief saved)
- **`/api/ai/doc`** without `strategyBriefId` → Uses brand profile only (no StrategyBrief read)
- **`/api/ai/design`** without `contentPackageId` → Generates design without copy context

### Coordination via /api/ai/sync

The sync endpoint allows frontend/other services to:
- Check collaboration state for a brand
- Get latest StrategyBrief
- Get ContentPackage by requestId
- See advisor feedback from collaboration log
- Determine current status (planning/creating/reviewing/complete)

## Naming Consistency

### Updated Terminology
- **"doc-agent"** → **"The Copywriter"** (in prompts, logs, comments)
- **"design-agent"** → **"The Creative"** (in prompts, logs, comments)
- **"advisor-agent"** → **"The Advisor"** (in prompts, logs, comments)
- **"Aligned-20AI"** → **"Postd"** (in system prompts)

### Log Prefixes
- `[DocAgent]` → `[Copywriter]`
- `[DesignAgent]` → `[Creative]`
- `[Advisor]` → `[Advisor]` (unchanged)

### System Prompts
- Copywriter: "You are The Copywriter for Postd"
- Creative: "You are The Creative for Postd"
- Advisor: "You are The Advisor for Postd"

## Database Requirements

The collaboration storage service is ready for Supabase integration. Required tables:

- **`strategy_briefs`**: Stores StrategyBrief artifacts
- **`content_packages`**: Stores ContentPackage artifacts
- **`brand_history`**: Stores BrandHistory (currently in-memory)
- **`performance_logs`**: Stores PerformanceLog (currently in-memory)

See `docs/SUPABASE_TABLES_REQUIRED.md` for schema details.

## Testing

Integration tests added in `server/__tests__/collaboration.test.ts`:
- `/api/orchestration/pipeline/execute` endpoint tests
- `/api/ai/sync` endpoint tests
- Authentication and validation tests

## Build Status

✅ **Build passing** - All TypeScript compilation successful
✅ **No linter errors** - All code passes linting
✅ **Backwards compatible** - Existing API calls work unchanged

## Next Steps

1. **Database Integration**: Wire collaboration storage to Supabase tables
2. **Frontend Integration**: Update UI to use collaboration context in AI generation flows
3. **Enhanced Prompts**: Refine StrategyBrief → Copywriter/Creative prompt integration
4. **Performance Tracking**: Wire PerformanceLog to analytics system
5. **Brand History**: Implement persistent BrandHistory storage

