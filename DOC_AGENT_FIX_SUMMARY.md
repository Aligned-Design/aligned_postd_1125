# Doc Agent Endpoint Fix - Summary

## Changes Made

### 1. Fixed Request Contract Normalization
**File:** `server/routes/agents.ts`

- ✅ Added proper normalization for `brandId` → `brand_id`
- ✅ Added normalization for top-level `prompt`/`platform`/`tone` → `input` object
- ✅ Improved Zod validation error handling with clear messages
- ✅ Added comment clarifying `topic` is canonical, `prompt` is legacy alias

### 2. Verified OpenAI Integration
**Flow Confirmed:**
- `/api/agents/generate/doc` → `generateDocContent()` → `generateWithAI()` → `server/lib/openai-client.ts` → OpenAI API
- ✅ Real OpenAI calls (no mocks in production)

### 3. Updated Documentation
**File:** `docs/API_USAGE_AND_TESTING.md`

- ✅ Documented canonical contract with all field descriptions
- ✅ Clarified backwards compatibility support

### 4. Created Smoke Test
**File:** `scripts/api-doc-agent-smoke.ts`

- ✅ Tests canonical format
- ✅ Tests legacy format (backwards compatibility)
- ✅ Verifies content generation

### 5. Marked Legacy Endpoint
**File:** `server/routes/doc-agent.ts`

- ✅ Added TODO comment to migrate `/api/ai/doc` → `/api/agents/generate/doc`

## Canonical Contract

```json
{
  "brand_id": "UUID",
  "input": {
    "topic": "string",
    "platform": "linkedin" | "instagram" | "facebook" | "twitter" | "tiktok" | "email",
    "tone": "professional" | "casual" | ...,
    "format": "post" | "carousel" | "reel" | "story" | "image" | "email",
    "max_length": 2200,
    "include_cta": true,
    "cta_type": "link" | "comment" | "dm" | "bio" | "email",
    "additional_context": "string (optional)"
  }
}
```

**Note:** `topic` is the canonical field. `prompt` is accepted as a legacy alias and normalized to `topic`.

## Testing Instructions

### 1. Run Smoke Test

```bash
export ACCESS_TOKEN="YOUR_REAL_ACCESS_TOKEN"
export BRAND_ID="YOUR_REAL_BRAND_ID"
pnpm tsx scripts/api-doc-agent-smoke.ts
```

### 2. Manual curl Test

```bash
curl -X POST http://localhost:8080/api/agents/generate/doc \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "YOUR_BRAND_ID",
    "input": {
      "topic": "Write a launch announcement with steps for my new product",
      "platform": "linkedin",
      "tone": "professional"
    }
  }'
```

### 3. Test Legacy Format (Backwards Compatibility)

```bash
curl -X POST http://localhost:8080/api/agents/generate/doc \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "YOUR_BRAND_ID",
    "prompt": "Write a launch announcement",
    "platform": "linkedin",
    "tone": "professional"
  }'
```

## Files Changed

1. `server/routes/agents.ts` - Fixed normalization and error handling
2. `server/routes/doc-agent.ts` - Added legacy endpoint TODO
3. `docs/API_USAGE_AND_TESTING.md` - Updated documentation
4. `scripts/api-doc-agent-smoke.ts` - New smoke test script
5. `scripts/smoke-agents.ts` - Updated to use canonical format
6. `CHANGELOG.md` - Added changelog entry

## Next Steps

1. ✅ Run smoke test with real credentials
2. ✅ Test with curl (canonical format)
3. ✅ Test with curl (legacy format)
4. ⏳ Create ticket: "Unify doc agent endpoints /api/ai/doc → /api/agents/generate/doc"
5. ⏳ Update MVP/launch checklist

## Topic vs Prompt

**Decision:** `topic` is canonical (matches Zod schema in `server/lib/validation-schemas.ts`)

- ✅ Schema uses `topic`
- ✅ Normalization accepts `prompt` → maps to `topic`
- ✅ Documentation uses `topic`
- ✅ Client code should use `topic` going forward

