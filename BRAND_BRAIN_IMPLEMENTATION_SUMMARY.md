# Brand Brain Implementation Summary

## Overview

This document summarizes the implementation of the Brand Brain multi-agent AI system for POSTD. The Brand Brain serves as the per-brand AI layer responsible for brand memory, creative QA, and providing guidance to other agents.

## Files Created/Modified

### New Files

| File | Purpose |
|------|---------|
| `shared/brand-brain.ts` | Shared TypeScript types for Brand Brain system |
| `supabase/migrations/20250127_create_brand_brain_tables.sql` | Database migration for Brand Brain tables |
| `server/lib/brand-brain-service.ts` | Core Brand Brain service with all API methods |
| `server/routes/brand-brain.ts` | REST API routes for Brand Brain |
| `server/lib/agent-preflight.ts` | Agent preflight utilities for multi-agent system |

### Modified Files

| File | Changes |
|------|---------|
| `server/index-v2.ts` | Added Brand Brain router registration |
| `server/lib/copy-agent.ts` | Integrated Brand Brain context and evaluation |

---

## Architecture

### Data Model

Three new tables in Supabase:

1. **`brand_brain_state`** - Core brand memory
   - `summary` - Model-ready brand description
   - `voice_rules` - Voice & tone guidelines
   - `visual_rules` - Visual identity rules
   - `bfs_baseline` - Brand Fidelity Score baseline
   - `preferences` - Evaluation strictness, platforms, CTAs

2. **`brand_brain_examples`** - Learning examples
   - `example_type` - POSITIVE, NEGATIVE, NEUTRAL
   - `channel` - Platform (instagram, email, etc.)
   - `content` - Content body, headline, CTA
   - `performance` - Engagement metrics
   - `source` - Origin (user_feedback, analytics, manual, system)

3. **`brand_brain_events`** - Audit log
   - `event_type` - Operation type
   - `input_snapshot` - What was passed in
   - `result_snapshot` - What was produced
   - All operations are logged for debugging/auditing

### Service Layer

`BrandBrainService` provides four main methods:

#### 1. `getBrandContextPack(brandId)`
Returns structured context for other agents:
- Brand summary
- Voice rules
- Visual rules
- Do's and don'ts
- Example snippets
- Positioning and offers

#### 2. `evaluateContent(brandId, input)`
Evaluates content for brand alignment:
- Returns score (0-100)
- Individual checks (tone, compliance, CTA, platform, clarity, terminology)
- Recommendations
- Integrates with existing BFS calculator

#### 3. `registerOutcome(brandId, input)`
Logs content performance for learning:
- Creates examples based on performance
- Stores user feedback
- Future: Updates brand state based on patterns

#### 4. `refreshStateFromBrandGuide(brandId)`
Syncs Brand Brain state from Brand Guide:
- Called after brand guide creation/update
- Distills guide into optimized format

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/brand-brain/:brandId/context` | Get context pack for agents |
| POST | `/api/brand-brain/:brandId/evaluate` | Evaluate content |
| POST | `/api/brand-brain/:brandId/outcome` | Register performance outcome |
| POST | `/api/brand-brain/:brandId/refresh` | Refresh state from Brand Guide |
| GET | `/api/brand-brain/:brandId/state` | Get current state |
| GET | `/api/brand-brain/:brandId/examples` | Get learning examples |
| GET | `/api/brand-brain/:brandId/events` | Get event log |
| POST | `/api/brand-brain/:brandId/examples` | Add manual example |
| DELETE | `/api/brand-brain/:brandId/examples/:id` | Delete example |

---

## Agent Preflight System

Every agent must run preflight checks before operations:

### Preflight Configurations by Agent

| Agent | Requires Brand ID | Requires Brand Context | Can Access Content | Can Access Metrics |
|-------|-------------------|------------------------|-------------------|-------------------|
| Brand Brain | ✅ | ❌ (creates it) | ✅ | ✅ |
| Ops Brain | ❌ | ❌ | ❌ | ✅ (aggregated) |
| Copy | ✅ | ✅ | ✅ | ❌ |
| Creative | ✅ | ✅ | ✅ | ❌ |
| Advisor | ✅ | ✅ | ✅ | ✅ |
| Scheduler | ✅ | ✅ | ❌ | ❌ |
| Approvals | ✅ | ✅ | ✅ | ❌ |
| Analytics | ✅ | ❌ | ❌ | ✅ |

### Preflight Functions

```typescript
// Generic preflight
await runAgentPreflight("copy", brandId, { mode: "context" });

// Agent-specific preflights
await copyAgentPreflight(brandId);
await creativeAgentPreflight(brandId);
await advisorAgentPreflight(brandId);

// Wrapper for operations
await withAgentPreflight("copy", brandId, async (context) => {
  // Your operation here
});
```

---

## Copy Agent Integration

The Copy Agent now integrates with Brand Brain:

### New Methods

```typescript
// Run preflight
await agent.preflight();

// Load brand context
await agent.loadBrandContext();

// Evaluate with Brand Brain
await agent.evaluateWithBrandBrain(content, channel, goal);
```

### New Generation Functions

```typescript
// With Brand Brain integration (preferred)
await generateCopyWithBrandBrain(brandId, strategy, options);

// From Brand Context only (no strategy needed)
await generateCopyFromBrandContext(brandId, { platform, goal });
```

### Output Changes

`CopyOutput` now includes:
- `brandEvaluation` - Brand Brain evaluation result
- `brandContextUsed` - Whether context was loaded

---

## Global Preflight Rules (All Brand Agents)

1. Always work for **one brand at a time** using `brand_id`
2. **NEVER** use or reference data from other brands
3. Always request **Brand Context** from Brand Brain before generating
4. **Brand Brain rules override** default agent behavior
5. Do not invent facts about the brand
6. If something is missing, use safe defaults with TODO markers

---

## Content Evaluation Checks

The Brand Brain evaluates content on 6 dimensions:

| Check | Weight | Description |
|-------|--------|-------------|
| Tone Alignment | 30% | Matches brand voice and formality |
| Compliance | 20% | No banned phrases, has required disclaimers |
| CTA Quality | 15% | Clear action verb, appropriate length |
| Platform Fit | 15% | Meets platform character/hashtag limits |
| Clarity | 10% | Readable sentences, active voice |
| Brand Terminology | 10% | Uses approved brand phrases |

---

## MVP Scope

Brand Brain v1 supports:
- ✅ Text content only (copy-focused)
- ✅ Copy Agent integration
- ✅ Approvals UI integration (via API)
- ✅ Score, checks, recommendations
- ✅ Advisory mode (no hard blocks)

Future versions will add:
- Visual checks
- Strict blocking mode
- Deeper analytics learning
- Multi-channel patterns

---

## Security

### Row-Level Security (RLS)

All Brand Brain tables are protected by RLS:
- Users can only access their brand's data
- Service role has full access
- No cross-brand queries possible

### Data Isolation

- Brand Brain only operates on one `brand_id` at a time
- Ops Brain cannot access brand content
- All operations are logged with audit trail

---

## Next Steps

1. **Run Migration**: Apply `20250127_create_brand_brain_tables.sql` to Supabase
2. **Test API**: Verify endpoints with test brand
3. **Integrate Approvals UI**: Show Brand Brain evaluation in approval panel
4. **Wire Analytics**: Call `registerOutcome` after content publishes
5. **Update Other Agents**: Add Brand Brain integration to Creative, Advisor agents

---

## Usage Example

```typescript
import { getBrandContextPack, evaluateContent } from "./server/lib/brand-brain-service";

// 1. Get context for an agent
const context = await getBrandContextPack(brandId);

// 2. Generate content (in Copy Agent)
const copy = await generateCopyWithBrandBrain(brandId, strategy, {
  platform: "instagram",
  goal: "engagement"
});

// 3. Content comes back with evaluation
console.log(copy.brandEvaluation.score); // 0-100
console.log(copy.brandEvaluation.checks); // Individual checks
console.log(copy.brandEvaluation.recommendations); // Suggestions

// 4. Later, register outcome
await registerOutcome(brandId, {
  contentId: copy.requestId,
  channel: "instagram",
  performanceMetrics: { engagementRate: 5.2 },
  userFeedback: { rating: "great" }
});
```

