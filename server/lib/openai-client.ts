/**
 * Shared OpenAI Client Module
 * 
 * Provides a single, standardized OpenAI client instance for the entire application.
 * All OpenAI API calls should use this module instead of creating new clients.
 * 
 * Features:
 * - Single client instance (singleton pattern)
 * - Environment-based model configuration
 * - Consistent error handling
 * - Support for both Responses API and Chat Completions API
 * - Modern embedding models
 */

import OpenAI from "openai";
import { logger } from "./logger";

/**
 * Initialize OpenAI client
 * 
 * Uses OPENAI_API_KEY from environment variables.
 * Throws an error if API key is not configured (prevents silent failures).
 */
function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Please set it in your environment variables."
    );
  }

  return new OpenAI({
    apiKey,
    timeout: 30000, // 30 second timeout
  });
}

/**
 * Single OpenAI client instance for the entire application
 * 
 * Created lazily on first access to avoid initialization errors
 * if environment variables are not set during module load.
 */
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = createOpenAIClient();
  }
  return openaiClient;
}

/**
 * Default OpenAI client instance (exported for convenience)
 * 
 * Use this for most OpenAI API calls:
 * ```ts
 * import { openai } from "@/server/lib/openai-client";
 * ```
 */
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return getOpenAIClient()[prop as keyof OpenAI];
  },
});

// ==================== MODEL CONFIGURATION ====================

/**
 * Default text generation model
 * 
 * Used for most content generation tasks (brand copy, social posts, etc.)
 * Can be overridden via OPENAI_MODEL_TEXT environment variable.
 * 
 * Default: "gpt-5-mini" (cost-effective, fast)
 */
export const DEFAULT_OPENAI_MODEL =
  process.env.OPENAI_MODEL_TEXT ?? "gpt-5-mini";

/**
 * High-performance model for complex reasoning tasks
 * 
 * Used for advisor/analysis tasks that require deeper reasoning.
 * Can be overridden via OPENAI_MODEL_ADVANCED environment variable.
 * 
 * Default: "gpt-5.1" (more capable, higher cost)
 */
export const ADVANCED_OPENAI_MODEL =
  process.env.OPENAI_MODEL_ADVANCED ?? "gpt-5.1";

/**
 * Cheaper/faster model for background jobs
 * 
 * Used for non-critical background processing where cost/speed matters.
 * Can be overridden via OPENAI_MODEL_CHEAP environment variable.
 * 
 * Default: "gpt-5-nano" (same as default, but can be set to nano if available)
 */
export const CHEAP_OPENAI_MODEL =
  process.env.OPENAI_MODEL_CHEAP ?? "gpt-5-nano";

/**
 * Default embedding model
 * 
 * Used for generating embeddings for semantic similarity, tone matching, etc.
 * Can be overridden via OPENAI_MODEL_EMBEDDING environment variable.
 * 
 * Default: "text-embedding-3-large" (modern, high-quality embeddings)
 */
export const DEFAULT_EMBEDDING_MODEL =
  process.env.OPENAI_MODEL_EMBEDDING ?? "text-embedding-3-large";

/**
 * Embedding dimensions
 * 
 * Number of dimensions for embeddings. Lower = cheaper, less accurate.
 * Can be overridden via OPENAI_EMBEDDING_DIMENSIONS environment variable.
 * 
 * Default: 512 (good balance)
 */
export const EMBEDDING_DIMENSIONS =
  parseInt(process.env.OPENAI_EMBEDDING_DIMENSIONS || "512", 10);

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate content using OpenAI Responses API (future enhancement)
 * 
 * NOTE: As of 2025-01-16, we use Chat Completions API as the standard.
 * The Responses API is a newer OpenAI feature that may be available in future SDK versions.
 * 
 * Current implementation: Uses Chat Completions API via generateWithChatCompletions()
 * Future: When Responses API is stable and available, we can migrate to:
 *   const response = await client.responses.create({
 *     model: options?.model ?? DEFAULT_OPENAI_MODEL,
 *     input: prompt,
 *     ...
 *   });
 * 
 * @param prompt - User prompt text
 * @param options - Optional configuration
 * @returns Generated text content
 * @deprecated This function currently just wraps generateWithChatCompletions.
 *            Use generateWithChatCompletions() directly for clarity.
 */
export async function generateWithResponsesAPI(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  // Currently uses Chat Completions API (standard, stable, widely supported)
  // Responses API migration can happen when SDK support is stable
  return generateWithChatCompletions(
    [{ role: "user", content: prompt }],
    options
  );
}

/**
 * Generate content using OpenAI Chat Completions API (current standard)
 * 
 * This is the primary method for OpenAI text generation in POSTD.
 * Chat Completions API is stable, well-documented, and fully supported.
 * 
 * All main AI agents (doc, design, advisor) use this via server/workers/ai-generation.ts
 * which calls this function through the shared OpenAI client.
 * 
 * @param messages - Chat messages array (system, user, assistant roles)
 * @param options - Optional configuration (model, temperature, maxTokens)
 * @returns Generated message content
 */
export async function generateWithChatCompletions(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const client = getOpenAIClient();
  const model = options?.model ?? DEFAULT_OPENAI_MODEL;

  // Log model usage in development mode
  if (process.env.NODE_ENV === "development") {
    logger.debug("Using OpenAI model", {
      model,
      endpoint: "generateWithChatCompletions",
    });
  }

  try {
    const response = await client.chat.completions.create({
      model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated by OpenAI");
    }

    return content;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Use structured logger if available, otherwise console.error for critical startup errors
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.error(`[OpenAI] Chat Completions API error:`, {
        error: errorMessage,
        model,
      });
    }
    throw new Error(`OpenAI generation failed: ${errorMessage}`);
  }
}

/**
 * Generate embeddings for text
 * 
 * @param text - Text to embed
 * @param options - Optional configuration
 * @returns Embedding vector
 */
export async function generateEmbedding(
  text: string,
  options?: {
    model?: string;
    dimensions?: number;
  }
): Promise<number[]> {
  const client = getOpenAIClient();
  const model = options?.model ?? DEFAULT_EMBEDDING_MODEL;
  const dimensions = options?.dimensions ?? EMBEDDING_DIMENSIONS;

  // Log model usage in development mode
  if (process.env.NODE_ENV === "development") {
    logger.debug("Using OpenAI model", {
      model,
      endpoint: "generateWithChatCompletions",
    });
  }

  try {
    const response = await client.embeddings.create({
      model,
      input: text,
      dimensions,
    });

    return response.data[0]?.embedding || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Use structured logger if available, otherwise console.error for critical startup errors
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.error(`[OpenAI] Embedding error:`, {
        error: errorMessage,
        model,
      });
    }
    throw new Error(`OpenAI embedding failed: ${errorMessage}`);
  }
}

/**
 * Validate that OpenAI is properly configured
 * 
 * @returns true if configured, false otherwise
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

