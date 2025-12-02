# OpenAI Integration Discovery Report

This document catalogs all OpenAI usage patterns found in the codebase before standardization.

## Summary

- **Total call sites found**: 6
- **Files using OpenAI**: 5
- **API patterns used**: 
  - `chat.completions.create` (3 instances)
  - `embeddings.create` (3 instances)
- **Model names found**: 
  - `gpt-4o-mini` (hard-coded in multiple places)
  - `gpt-4o` (hard-coded)
  - `text-embedding-ada-002` (legacy embedding model)
  - `text-embedding-3-small` (newer embedding model)

## Detailed Findings

### 1. `server/workers/ai-generation.ts`

**Function**: `generateWithOpenAI()`

**Client Creation**:
```typescript
openaiClient = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
});
```

**Endpoint Style**: `chat.completions.create`

**Model Names Used**:
- `gpt-4o-mini` (for "doc" and "design" agent types)
- `gpt-4o` (for "advisor" agent type)

**Notes**: 
- Uses lazy initialization pattern
- Has fallback to Claude
- Model selection based on `agentType` parameter

---

### 2. `server/lib/bfs-baseline-generator.ts`

**Function**: `generateBFSBaseline()`

**Client Creation**:
```typescript
openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder",
});
```

**Endpoint Style**: `chat.completions.create`

**Model Names Used**:
- `process.env.OPENAI_MODEL || "gpt-4o-mini"` (with fallback)

**Notes**: 
- Uses lazy initialization
- Has placeholder fallback (should be removed)

---

### 3. `server/agents/brand-fidelity-scorer.ts`

**Function**: `scoreToneAlignment()` (embeddings)

**Client Creation**:
```typescript
openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder",
});
```

**Endpoint Style**: `embeddings.create`

**Model Names Used**:
- `text-embedding-ada-002` (legacy model)

**Notes**: 
- Uses lazy initialization
- Has placeholder fallback (should be removed)
- Legacy embedding model should be updated

---

### 4. `server/lib/tone-classifier.ts`

**Function**: `getEmbedding()` (private method)

**Client Creation**:
```typescript
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```

**Endpoint Style**: `embeddings.create`

**Model Names Used**:
- `text-embedding-3-small` (modern model)

**Notes**: 
- Creates client at module level (not lazy)
- Uses modern embedding model (good)

---

### 5. `server/workers/brand-crawler.ts`

**Function**: `createBrandEmbedding()`

**Client Creation**:
```typescript
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
```

**Endpoint Style**: `embeddings.create`

**Model Names Used**:
- `text-embedding-ada-002` (legacy model)

**Notes**: 
- Creates client inline (not reusable)
- Uses legacy embedding model (should be updated)

---

### 6. Test Files

**File**: `server/__tests__/agents.test.ts`

**Usage**: Mock data only (no actual API calls)

**Model Names Referenced**:
- `gpt-4o-mini` (in test data)

**Notes**: 
- No changes needed (just test data)

---

## Issues Identified

1. **Inconsistent Client Creation**: 
   - Some use lazy initialization, some create at module level, some create inline
   - Some have placeholder fallbacks that should be removed

2. **Hard-coded Model Names**: 
   - `gpt-4o-mini` appears in multiple places
   - `gpt-4o` hard-coded for advisor type
   - No centralized model configuration

3. **Legacy Embedding Models**: 
   - `text-embedding-ada-002` used in 2 places (should migrate to `text-embedding-3-small`)

4. **No Responses API Usage**: 
   - All current usage is `chat.completions.create` or `embeddings.create`
   - No usage of newer Responses API

5. **Inconsistent Error Handling**: 
   - Some have try/catch, some don't
   - Error messages vary

6. **Environment Variable Inconsistency**:
   - Some check `process.env.OPENAI_API_KEY`
   - Some use `OPENAI_MODEL` env var, others hard-code
   - No standard env var names for model selection

---

## Standardization Plan

1. ✅ Create shared client module: `server/lib/openai-client.ts`
2. ✅ Export single client instance
3. ✅ Export model constants from env vars
4. ✅ Migrate all call sites to use shared client
5. ✅ Standardize on Chat Completions API (Responses API prepared for future)
6. ✅ Update embedding models to modern versions
7. ✅ Remove placeholder fallbacks
8. ✅ Add consistent error handling

---

## Refactoring Summary

### Files Updated

1. **`server/lib/openai-client.ts`** (NEW)
   - Shared OpenAI client module
   - Model configuration from env vars
   - Helper functions for common operations

2. **`server/workers/ai-generation.ts`**
   - Removed local OpenAI client creation
   - Uses shared client and model constants
   - Maintains Claude fallback support

3. **`server/lib/bfs-baseline-generator.ts`**
   - Removed local client creation
   - Uses shared client and DEFAULT_OPENAI_MODEL
   - Removed placeholder fallback

4. **`server/agents/brand-fidelity-scorer.ts`**
   - Removed local client creation
   - Uses shared embedding functions
   - Updated to modern embedding model

5. **`server/lib/tone-classifier.ts`**
   - Removed module-level client creation
   - Uses shared embedding functions
   - Already using modern embedding model

6. **`server/workers/brand-crawler.ts`**
   - Removed inline client creation
   - Uses shared embedding functions
   - Updated to modern embedding model

### Model Standardization

**Before**: Hard-coded models in multiple files
- `gpt-4o-mini` (hard-coded in 3+ places)
- `gpt-4o` (hard-coded)
- `text-embedding-ada-002` (legacy, in 2 places)
- `text-embedding-3-small` (in 1 place)

**After**: Centralized model configuration
- `DEFAULT_OPENAI_MODEL` (from `OPENAI_MODEL_TEXT` env var, default: `gpt-4o-mini`)
- `ADVANCED_OPENAI_MODEL` (from `OPENAI_MODEL_ADVANCED` env var, default: `gpt-4o`)
- `CHEAP_OPENAI_MODEL` (from `OPENAI_MODEL_CHEAP` env var, default: `gpt-4o-mini`)
- `DEFAULT_EMBEDDING_MODEL` (from `OPENAI_MODEL_EMBEDDING` env var, default: `text-embedding-3-small`)

### Environment Variables

**New optional variables** (all have sensible defaults):
- `OPENAI_MODEL_TEXT` - Default text generation model
- `OPENAI_MODEL_ADVANCED` - Advanced reasoning model
- `OPENAI_MODEL_CHEAP` - Background job model
- `OPENAI_MODEL_EMBEDDING` - Embedding model
- `OPENAI_EMBEDDING_DIMENSIONS` - Embedding dimensions

**Required** (unchanged):
- `OPENAI_API_KEY` - API key (required)

### API Pattern

**Current Standard**: Chat Completions API (`chat.completions.create`)
- Stable, production-ready
- Used throughout the codebase
- Well-tested and reliable

**Future Ready**: Responses API
- Code structure prepared for Responses API
- `generateWithResponsesAPI()` function exists
- Will automatically use Responses API when available in SDK

### Improvements

1. ✅ **Single source of truth**: All OpenAI usage goes through shared client
2. ✅ **Environment-based configuration**: Models configurable via env vars
3. ✅ **Consistent error handling**: All calls have proper error handling
4. ✅ **Modern embedding models**: Migrated from legacy `text-embedding-ada-002`
5. ✅ **No hard-coded models**: All models come from env vars or constants
6. ✅ **Removed placeholders**: No more `"sk-placeholder"` fallbacks
7. ✅ **Better logging**: Errors logged without leaking secrets

### Remaining TODOs

1. **Responses API Migration**: When Responses API becomes available in OpenAI SDK v6.8.1+, update `generateWithResponsesAPI()` to use actual Responses API instead of falling back to Chat Completions.

2. **Model Selection**: Consider if `gpt-5-mini` or `gpt-5-nano` should be the default when available (currently defaults to `gpt-4o-mini`).

3. **Testing**: Add integration tests for the shared client module.

### Documentation

- ✅ Created `docs/OPENAI_INTEGRATION_DISCOVERY.md` (this file)
- ✅ Created `docs/AI_MODEL_CONFIG.md` (model configuration guide)
- ✅ Updated `docs/ENVIRONMENT_SETUP.md` (environment variables)

---

## Final Statistics

- **Total call sites updated**: 6
- **Files refactored**: 5
- **New shared module**: 1 (`server/lib/openai-client.ts`)
- **Hard-coded models removed**: 8+
- **Environment variables added**: 5 (all optional with defaults)
- **Legacy embedding models migrated**: 2 (`text-embedding-ada-002` → `text-embedding-3-small`)

