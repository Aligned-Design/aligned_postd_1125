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
 * Default: "gpt-4o-mini" (cost-effective, fast)
 */
export const DEFAULT_OPENAI_MODEL =
  process.env.OPENAI_MODEL_TEXT ?? "gpt-4o-mini";

/**
 * High-performance model for complex reasoning tasks
 * 
 * Used for advisor/analysis tasks that require deeper reasoning.
 * Can be overridden via OPENAI_MODEL_ADVANCED environment variable.
 * 
 * Default: "gpt-4o" (more capable, higher cost)
 */
export const ADVANCED_OPENAI_MODEL =
  process.env.OPENAI_MODEL_ADVANCED ?? "gpt-4o";

/**
 * Cheaper/faster model for background jobs
 * 
 * Used for non-critical background processing where cost/speed matters.
 * Can be overridden via OPENAI_MODEL_CHEAP environment variable.
 * 
 * Default: "gpt-4o-mini" (same as default, but can be set to nano if available)
 */
export const CHEAP_OPENAI_MODEL =
  process.env.OPENAI_MODEL_CHEAP ?? "gpt-4o-mini";

/**
 * Default embedding model
 * 
 * Used for generating embeddings for semantic similarity, tone matching, etc.
 * Can be overridden via OPENAI_MODEL_EMBEDDING environment variable.
 * 
 * Default: "text-embedding-3-small" (modern, cost-effective)
 */
export const DEFAULT_EMBEDDING_MODEL =
  process.env.OPENAI_MODEL_EMBEDDING ?? "text-embedding-3-small";

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
 * Generate content using OpenAI Responses API (preferred for new code)
 * 
 * NOTE: Responses API may not be available in all OpenAI SDK versions.
 * This function is prepared for when Responses API becomes available.
 * Currently falls back to Chat Completions API.
 * 
 * @param prompt - User prompt text
 * @param options - Optional configuration
 * @returns Generated text content
 */
export async function generateWithResponsesAPI(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  // TODO: When Responses API is available in OpenAI SDK, use:
  // const response = await client.responses.create({...});
  // For now, use Chat Completions API as the standard
  return generateWithChatCompletions(
    [{ role: "user", content: prompt }],
    options
  );
}

/**
 * Generate content using Chat Completions API (legacy, but still supported)
 * 
 * Use this if you need features not available in Responses API,
 * or for compatibility with existing code.
 * 
 * @param messages - Chat messages array
 * @param options - Optional configuration
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
    console.error(`[OpenAI] Chat Completions API error:`, {
      error: errorMessage,
      model,
    });
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

  try {
    const response = await client.embeddings.create({
      model,
      input: text,
      dimensions,
    });

    return response.data[0]?.embedding || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[OpenAI] Embedding error:`, {
      error: errorMessage,
      model,
    });
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

