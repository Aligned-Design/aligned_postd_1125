# POSTD OpenAI Integration - Current State

**Last Updated:** 2025-01-XX  
**Status:** ✅ Production Ready (Using Chat Completions API)

---

## Overview

This document is the **single source of truth** for how POSTD integrates with OpenAI. It describes the actual implementation, not aspirational features.

---

## 1. Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |

**Source:** Environment variable (never hardcoded)  
**Validation:** Checked via `isOpenAIConfigured()` in `server/lib/openai-client.ts`  
**Security:** Never exposed to client-side code

### Optional Model Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_MODEL_TEXT` | `gpt-5-mini` | Default text generation model |
| `OPENAI_MODEL_ADVANCED` | `gpt-5.1` | Advanced reasoning tasks |
| `OPENAI_MODEL_CHEAP` | `gpt-5-nano` | Background jobs |
| `OPENAI_MODEL_EMBEDDING` | `text-embedding-3-large` | Embedding model |
| `OPENAI_EMBEDDING_DIMENSIONS` | `512` | Embedding dimensions |

---

## 2. SDK Initialization

### Current Implementation

```typescript
// server/lib/openai-client.ts
import OpenAI from "openai";

function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey,
    timeout: 30000,
  });
}
```

**Status:** ✅ **Matches OpenAI docs** - Uses standard `new OpenAI()` pattern  
**API Key Source:** `process.env.OPENAI_API_KEY` (correct)  
**Singleton Pattern:** Yes, via `getOpenAIClient()` function

---

## 3. API Usage

### Current: Chat Completions API

**Status:** ✅ **In Production** - Using stable Chat Completions API

```typescript
// server/lib/openai-client.ts
const response = await client.chat.completions.create({
  model: DEFAULT_OPENAI_MODEL,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ],
  temperature: 0.7,
  max_tokens: 1000,
});
```

**Why Chat Completions:**
- Stable, production-ready API
- Well-tested in our codebase
- Supports all features we need
- Widely documented and supported

### Future: Responses API

**Status:** ⚠️ **Prepared but Not Active** - Code structure exists but not used

```typescript
// server/lib/openai-client.ts
export async function generateWithResponsesAPI(
  prompt: string,
  options?: { model?: string; temperature?: number; maxTokens?: number; }
): Promise<string> {
  // TODO: When Responses API is available in OpenAI SDK, use:
  // const response = await client.responses.create({...});
  // For now, falls back to Chat Completions API
  return generateWithChatCompletions([{ role: "user", content: prompt }], options);
}
```

**Migration Path:** When Responses API becomes available in the SDK, we can migrate seamlessly. The helper function is already prepared.

---

## 4. Models Used

### Current Models

| Model | Usage | Default Env Var |
|-------|-------|-----------------|
| `gpt-5-mini` | Text generation (doc, design agents) | `OPENAI_MODEL_TEXT` |
| `gpt-5.1` | Advanced reasoning (advisor agent) | `OPENAI_MODEL_ADVANCED` |
| `gpt-5-nano` | Background jobs (utility tasks) | `OPENAI_MODEL_CHEAP` |
| `text-embedding-3-large` | Embeddings (BFS, tone matching) | `OPENAI_MODEL_EMBEDDING` |

**Note:** POSTD now uses the current 2025 OpenAI model suite including GPT-5.1, GPT-5-mini, GPT-5-nano, and text-embedding-3-large. All models are configurable via environment variables.

---

## 5. Features NOT Currently Used

### 5.1 Agents SDK (`@openai/agents`)

**Status:** ❌ **Not Used**

**Current Implementation:**
- POSTD uses custom orchestration logic
- "Doc Agent", "Design Agent", "Advisor Agent" are custom implementations
- Not using `@openai/agents` SDK

**Why:**
- Custom agents provide better control over brand fidelity scoring
- Integration with our brand guide system
- Retry logic and fallback providers (Claude)

**If Needed:**
- Would require significant refactoring
- Would need to maintain brand guide integration
- Not currently planned

### 5.2 Tools (web_search, file_search)

**Status:** ❌ **Not Used**

**Current Implementation:**
- No tool usage in OpenAI calls
- No `tools: [{ type: "web_search" }]` configuration
- No function calling

**If Needed:**
- Would require updating `generateWithChatCompletions()` to accept tools parameter
- Would need to handle tool calls in responses
- Not currently planned

### 5.3 Streaming

**Status:** ❌ **Not Used**

**Current Implementation:**
- All OpenAI calls are synchronous (await full response)
- No `stream: true` configuration
- No `for await (const event of stream)` loops

**If Needed:**
- Would require updating response handling
- Would need to support Server-Sent Events (SSE) for real-time updates
- Not currently planned

### 5.4 Multimodal (Image/File Inputs)

**Status:** ❌ **Not Used**

**Current Implementation:**
- Text-only prompts
- No image URLs in messages
- No file references

**Note:** We do process images for brand scraping and analysis, but we don't send them to OpenAI. We use embeddings and text descriptions instead.

---

## 6. Code Locations

### Main Files

| File | Purpose |
|------|---------|
| `server/lib/openai-client.ts` | Shared OpenAI client and helpers |
| `server/workers/ai-generation.ts` | Main AI generation worker (uses shared client) |
| `server/routes/doc-agent.ts` | Doc agent endpoint (text generation) |
| `server/routes/design-agent.ts` | Design agent endpoint (visual concepts) |
| `server/routes/advisor.ts` | Advisor agent endpoint (insights) |
| `server/lib/bfs-baseline-generator.ts` | Brand fidelity baseline generation |
| `server/agents/brand-fidelity-scorer.ts` | Brand fidelity scoring (uses embeddings) |
| `server/lib/tone-classifier.ts` | Tone classification (uses embeddings) |
| `server/workers/brand-crawler.ts` | Brand crawling (uses embeddings) |

### Helper Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `getOpenAIClient()` | `server/lib/openai-client.ts` | Get singleton client instance |
| `generateWithChatCompletions()` | `server/lib/openai-client.ts` | Chat Completions API helper |
| `generateWithResponsesAPI()` | `server/lib/openai-client.ts` | Responses API helper (prepared, not active) |
| `generateEmbedding()` | `server/lib/openai-client.ts` | Embedding generation |
| `isOpenAIConfigured()` | `server/lib/openai-client.ts` | Check if OpenAI is configured |
| `generateWithAI()` | `server/workers/ai-generation.ts` | High-level AI generation (OpenAI or Claude) |

---

## 7. Security

### ✅ Secure Practices

1. **API Key Management:**
   - Never hardcoded
   - Only in environment variables
   - Never exposed to client-side code
   - Validated on startup

2. **Error Handling:**
   - Errors logged without leaking secrets
   - No API keys in error messages
   - Graceful fallbacks (Claude) when OpenAI unavailable

3. **Client Initialization:**
   - Singleton pattern prevents multiple clients
   - Lazy initialization (only when needed)
   - Proper error handling if key missing

---

## 8. Comparison with OpenAI Docs

### What Matches

| Feature | OpenAI Docs | POSTD Implementation | Status |
|---------|-------------|---------------------|--------|
| SDK Import | `import OpenAI from "openai"` | ✅ Same | ✅ Match |
| Client Init | `new OpenAI()` | ✅ Same | ✅ Match |
| API Key | `process.env.OPENAI_API_KEY` | ✅ Same | ✅ Match |
| Chat Completions | `client.chat.completions.create()` | ✅ Same | ✅ Match |

### What Differs

| Feature | OpenAI Docs | POSTD Implementation | Status |
|---------|-------------|---------------------|--------|
| Responses API | `client.responses.create()` | ⚠️ Prepared, not active | ⚠️ Future |
| Models | `gpt-5`, `gpt-5-nano` | ✅ Using `gpt-5-mini`, `gpt-5.1`, `gpt-5-nano` | ✅ Match (upgraded to GPT-5 suite) |
| Agents SDK | `@openai/agents` | ❌ Not used | ❌ Not implemented |
| Tools | `tools: [{ type: "web_search" }]` | ❌ Not used | ❌ Not implemented |
| Streaming | `stream: true` | ❌ Not used | ❌ Not implemented |
| Multimodal | Image/file inputs | ❌ Not used | ❌ Not implemented |

**Note:** Differences are **intentional** - we use Chat Completions API which is stable and production-ready. New features (Responses API, Agents SDK, etc.) are either not available yet or not needed for our use case.

---

## 9. Migration Paths

### If We Want to Use Responses API

1. Update `generateWithResponsesAPI()` in `server/lib/openai-client.ts`
2. Change from:
   ```typescript
   const response = await client.chat.completions.create({...});
   ```
   To:
   ```typescript
   const response = await client.responses.create({
     model: "gpt-5-nano",
     input: prompt,
   });
   ```
3. Update response handling to use `response.output_text`
4. Test thoroughly
5. Update call sites to use `generateWithResponsesAPI()` instead of `generateWithChatCompletions()`

### If We Want to Use Agents SDK

1. Install `@openai/agents` package
2. Create agent definitions
3. Integrate with brand guide system
4. Update agent routes to use Agents SDK
5. Maintain brand fidelity scoring integration

### If We Want to Use Tools

1. Update `generateWithChatCompletions()` to accept `tools` parameter
2. Add tool definitions (web_search, file_search, or custom functions)
3. Handle tool calls in responses
4. Update prompts to instruct model to use tools

### If We Want Streaming

1. Add `stream: true` to API calls
2. Handle streaming responses with `for await` loops
3. Update endpoints to support Server-Sent Events (SSE)
4. Update frontend to handle streaming updates

---

## 10. Best Practices

1. **Always use shared client:** Import from `server/lib/openai-client.ts`
2. **Use model constants:** Don't hard-code model names
3. **Configure via env vars:** Allow runtime model selection
4. **Handle errors gracefully:** Wrap calls in try/catch
5. **Log appropriately:** Log errors without exposing secrets
6. **Test fallbacks:** Ensure Claude fallback works if OpenAI unavailable

---

## 11. Troubleshooting

### "OPENAI_API_KEY is not configured"

**Solution:** Set `OPENAI_API_KEY` environment variable.

### Model not found errors

**Solution:** Check that model name is valid. Current supported models:
- `gpt-5-mini` ✅
- `gpt-5.1` ✅
- `gpt-5-nano` ✅
- `gpt-5-pro` ✅
- `text-embedding-3-large` ✅
- `text-embedding-3-small` ✅ (alternative)

### High costs

**Solution:**
- Use `gpt-5-mini` instead of `gpt-5.1` for most tasks
- Use `gpt-5-nano` for background jobs
- Reduce embedding dimensions
- Use `OPENAI_MODEL_CHEAP` for background jobs

---

## 12. Related Documentation

- [AI Model Configuration](./AI_MODEL_CONFIG.md) - Model configuration details
- [OpenAI Integration Summary](./OPENAI_INTEGRATION_SUMMARY.md) - Integration standardization summary
- [OpenAI Integration Discovery](./OPENAI_INTEGRATION_DISCOVERY.md) - Detailed audit report
- [Environment Setup](./ENVIRONMENT_SETUP.md) - Environment variable setup

---

**Status:** ✅ **Production Ready** - Current implementation is stable, secure, and well-tested. New OpenAI features (Responses API, Agents SDK, etc.) are prepared for future use but not required for current functionality.

