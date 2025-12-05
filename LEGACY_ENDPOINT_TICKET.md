# Follow-up Ticket: Unify Doc Agent Endpoints

## Title
Unify doc agent endpoints (/api/ai/doc → /api/agents/generate/doc)

## Description

We now have a canonical doc agent endpoint that is fully wired and tested:

**POST `/api/agents/generate/doc`**

### Canonical Contract

```json
{
  "brand_id": "UUID",
  "input": {
    "topic": "string",
    "platform": "string",
    "tone": "string",
    "format": "string",
    "max_length": number,
    "include_cta": boolean,
    "cta_type": "string",
    "additional_context": "string"
  }
}
```

### Current State

There is still a legacy endpoint: **POST `/api/ai/doc`** with a different schema/implementation (`AiDocGenerationRequestSchema` from `shared/validation-schemas.ts`).

The legacy endpoint:
- Uses `brandId` (camelCase) instead of `brand_id`
- Uses top-level fields (`topic`, `platform`, `tone`, etc.) instead of `input` object
- Has a different response format (`AiDocGenerationResponse` vs `GenerationResponse`)
- Located in `server/routes/doc-agent.ts`

### Acceptance Criteria

- [ ] All client call sites use `/api/agents/generate/doc` with the canonical contract **OR**
- [ ] `/api/ai/doc` is a thin wrapper that forwards into the same handler as `/api/agents/generate/doc`
- [ ] No duplicated doc-agent logic
- [ ] Docs clearly reference only the canonical endpoint for new integrations
- [ ] Legacy endpoint marked as deprecated with migration path documented

### Implementation Options

**Option A: Route forwarding**
- Make `/api/ai/doc` a thin wrapper that normalizes the legacy request format and calls the canonical handler
- Maintains backwards compatibility
- Single source of truth for doc generation logic

**Option B: Client migration**
- Update all client call sites to use `/api/agents/generate/doc`
- Remove `/api/ai/doc` endpoint entirely
- Requires coordination with frontend team

### Files to Update

- `server/routes/doc-agent.ts` - Either remove or convert to wrapper
- `client/components/postd/studio/hooks/useDocAgent.ts` - Currently uses `/api/ai/doc`
- Any other client code calling `/api/ai/doc`
- Documentation files referencing the legacy endpoint

### Related

- Doc Agent contract fix: [commit hash]
- Smoke test: `scripts/api-doc-agent-smoke.ts`
- API docs: `docs/API_USAGE_AND_TESTING.md`

