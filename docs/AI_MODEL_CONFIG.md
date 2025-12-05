# AI Model Configuration Guide

This document describes how OpenAI models are configured and used throughout the application.

## Overview

All OpenAI integration uses a shared client module (`server/lib/openai-client.ts`) that provides:
- Single client instance (singleton pattern)
- Environment-based model configuration
- Consistent error handling
- Support for both Chat Completions API and Responses API (when available)

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |

Get your API key from: https://platform.openai.com/api-keys

### Optional Model Configuration

You can override default models via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_MODEL_TEXT` | `gpt-5-mini` | Default text generation model (brand copy, social posts) |
| `OPENAI_MODEL_ADVANCED` | `gpt-5.1` | High-performance model for complex reasoning (advisor tasks) |
| `OPENAI_MODEL_CHEAP` | `gpt-5-nano` | Cheaper/faster model for background jobs |
| `OPENAI_MODEL_EMBEDDING` | `text-embedding-3-large` | Embedding model for semantic similarity |
| `OPENAI_EMBEDDING_DIMENSIONS` | `512` | Number of dimensions for embeddings (lower = cheaper) |

## Model Usage by Workload

### Text Generation (Default)

**Model**: `OPENAI_MODEL_TEXT` (default: `gpt-5-mini`)

**Used for**:
- Brand copy generation
- Social media post creation
- Content generation for "doc" and "design" agent types

**Characteristics**:
- Cost-effective
- Fast response times
- Good quality for most content tasks

### Advanced Reasoning

**Model**: `OPENAI_MODEL_ADVANCED` (default: `gpt-5.1`)

**Used for**:
- Advisor/analysis tasks
- Complex reasoning and strategy
- Deep content analysis

**Characteristics**:
- Higher capability
- Better reasoning
- Higher cost

### Background Jobs

**Model**: `OPENAI_MODEL_CHEAP` (default: `gpt-5-nano`)

**Used for**:
- Non-critical background processing
- Bulk operations
- Cost-sensitive workloads

**Characteristics**:
- Optimized for cost/speed
- Suitable for non-user-facing tasks

### Embeddings

**Model**: `OPENAI_MODEL_EMBEDDING` (default: `text-embedding-3-large`)

**Used for**:
- Semantic similarity calculations
- Tone matching
- Brand fidelity scoring
- Content classification

**Characteristics**:
- Modern embedding model (migrated from legacy `text-embedding-ada-002`)
- Configurable dimensions (default: 512)
- Cost-effective for vector operations

## Changing Models Without Code Changes

You can change models at runtime by setting environment variables. No code changes required.

**Example**: Use a different model for text generation:

```bash
export OPENAI_MODEL_TEXT="gpt-5-pro"
```

**Example**: Use a different embedding model:

```bash
export OPENAI_MODEL_EMBEDDING="text-embedding-3-large"
export OPENAI_EMBEDDING_DIMENSIONS="256"  # Lower dimensions = cheaper
```

## API Patterns

### Chat Completions API (Current Standard)

The application currently uses the Chat Completions API (`chat.completions.create`) as the standard pattern. This is the stable, production-ready API.

**Usage**:
```typescript
import { generateWithChatCompletions } from "@/server/lib/openai-client";

const content = await generateWithChatCompletions(
  [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Generate a social media post." },
  ],
  {
    model: DEFAULT_OPENAI_MODEL,
    temperature: 0.7,
    maxTokens: 1000,
  }
);
```

### Responses API (Future)

The codebase is prepared for the Responses API, which is the newer recommended API. When it becomes available in the OpenAI SDK, we can migrate seamlessly.

**Current Status**: The `generateWithResponsesAPI()` function exists but currently falls back to Chat Completions API until Responses API is available in the SDK.

## Migration from Legacy Code

### Before (Old Pattern)

```typescript
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const response = await client.chat.completions.create({
  model: "gpt-4o-mini", // Hard-coded
  messages: [...],
});
```

### After (New Pattern)

```typescript
import { generateWithChatCompletions, DEFAULT_OPENAI_MODEL } from "@/server/lib/openai-client";

const content = await generateWithChatCompletions(
  messages,
  {
    model: DEFAULT_OPENAI_MODEL, // From env var
    temperature: 0.7,
  }
);
```

## Error Handling

All OpenAI calls use consistent error handling:

- Errors are logged (without leaking secrets)
- Clean, structured error messages
- Graceful fallbacks where appropriate (e.g., Claude fallback in `ai-generation.ts`)

## Best Practices

1. **Always use the shared client**: Import from `server/lib/openai-client.ts`
2. **Use model constants**: Don't hard-code model names
3. **Configure via env vars**: Allow runtime model selection
4. **Handle errors gracefully**: Wrap calls in try/catch
5. **Log appropriately**: Log errors without exposing secrets

## Troubleshooting

### "OpenAI API key not configured"

**Solution**: Set `OPENAI_API_KEY` environment variable.

### Model not found errors

**Solution**: Check that the model name in your env var is valid. Common models:
- `gpt-5-mini` ✅
- `gpt-5.1` ✅
- `gpt-5-nano` ✅
- `gpt-5-pro` ✅
- `text-embedding-3-large` ✅
- `text-embedding-3-small` ✅ (alternative)
- `text-embedding-ada-002` ⚠️ (legacy, consider migrating)

### High costs

**Solution**: 
- Use `gpt-5-mini` instead of `gpt-5.1` for most tasks
- Use `gpt-5-nano` for background jobs
- Reduce embedding dimensions
- Use `OPENAI_MODEL_CHEAP` for background jobs

## Related Documentation

- [OpenAI Integration Discovery](./OPENAI_INTEGRATION_DISCOVERY.md) - Detailed audit of all OpenAI usage
- [Environment Setup](../ENVIRONMENT_SETUP.md) - Complete environment configuration guide

