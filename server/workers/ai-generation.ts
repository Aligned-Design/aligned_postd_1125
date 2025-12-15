/**
 * AI Generation Worker
 * 
 * Handles communication with OpenAI and Claude APIs
 * Provides configurable switching between providers
 * Loads and processes prompt templates
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import { join } from "path";
import type { AIGenerationRequest, AIGenerationResponse } from "@shared/api";
import {
  openai,
  DEFAULT_OPENAI_MODEL,
  ADVANCED_OPENAI_MODEL,
  generateWithChatCompletions,
  isOpenAIConfigured,
} from "../lib/openai-client";
import { logger } from "../lib/logger";
import { sanitizeOpenAIPayload } from "../lib/openai-payload-sanitizer";

export type AIProvider = "openai" | "claude";

export interface AIGenerationOutput {
  content: string;
  tokens_in?: number;
  tokens_out?: number;
  total_tokens?: number;
  provider: AIProvider;
  model: string;
}

// Initialize Anthropic client only when needed
let anthropicClient: Anthropic | null = null;

function getOpenAI() {
  if (!isOpenAIConfigured()) {
    return null;
  }
  return openai;
}

function getAnthropic(): Anthropic | null {
  if (anthropicClient === null && process.env.ANTHROPIC_API_KEY) {
    try {
      anthropicClient = new Anthropic({ 
        apiKey: process.env.ANTHROPIC_API_KEY,
        timeout: 30000,
      });
    } catch (error) {
      logger.warn("Failed to initialize Anthropic client", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
  return anthropicClient;
}

// Default to OpenAI, fallback to Claude
function getDefaultProvider(): AIProvider {
  if (isOpenAIConfigured()) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  return "openai"; // fallback
}

/**
 * Custom error class for AI provider configuration issues
 * Client-side code can check for error.code === "NO_AI_PROVIDER_CONFIGURED"
 */
export class NoAIProviderError extends Error {
  code = "NO_AI_PROVIDER_CONFIGURED";
  constructor() {
    super("AI content generation is unavailable. Configure OPENAI_API_KEY or ANTHROPIC_API_KEY to enable this feature.");
    this.name = "NoAIProviderError";
  }
}

/**
 * Generate content using configured AI provider with token tracking
 */
export async function generateWithAI(
  prompt: string,
  agentType: "doc" | "design" | "advisor",
  provider?: AIProvider
): Promise<AIGenerationOutput> {
  // ✅ Check if any AI provider is configured before attempting generation
  if (!validateAIProviders()) {
    throw new NoAIProviderError();
  }

  const selectedProvider = provider || getDefaultProvider();

  try {
    if (selectedProvider === "openai") {
      return await generateWithOpenAI(prompt, agentType);
    } else if (selectedProvider === "claude") {
      const client = getAnthropic();
      if (!client) {
        throw new Error("Anthropic client not available - check ANTHROPIC_API_KEY");
      }
      return await generateWithClaude(prompt, agentType, client);
    } else {
      throw new Error(`Unknown provider: ${selectedProvider}`);
    }
  } catch (error) {
    // Re-throw NoAIProviderError without fallback attempt
    if (error instanceof NoAIProviderError) {
      throw error;
    }
    // ✅ FIX: Log as warning since we have fallback providers - API failures are non-critical
    logger.warn("AI generation failed, attempting fallback", {
      provider: selectedProvider,
      agentType,
      error: error instanceof Error ? error.message : String(error),
    });

    // ✅ ENHANCED FALLBACK: Try fallback provider if OpenAI is down or any API error occurs
    // Check if it's an API error (network, rate limit, service unavailable, etc.)
    const isApiError = error instanceof Error && (
      error.message.includes("API") ||
      error.message.includes("timeout") ||
      error.message.includes("network") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("503") ||
      error.message.includes("502") ||
      error.message.includes("500") ||
      error.message.includes("429") ||
      error.message.includes("rate limit") ||
      error.message.includes("service unavailable") ||
      error.message.includes("internal server error") ||
      // OpenAI-specific errors
      (error as any)?.status === 503 ||
      (error as any)?.status === 502 ||
      (error as any)?.status === 500 ||
      (error as any)?.status === 429 ||
      (error as any)?.code === "ECONNREFUSED"
    );

    // Try fallback provider if it's an API error (not a configuration issue)
    if (isApiError || (error instanceof Error && !error.message.includes("not available"))) {
      // ✅ FIX: If OpenAI failed with 429 (quota exceeded), don't try OpenAI again
      // Only use Claude as fallback when OpenAI fails
      const isQuotaError = error instanceof Error && (
        error.message.includes("429") ||
        error.message.includes("quota") ||
        (error as any)?.status === 429
      );
      
      // ✅ FIX: If OpenAI failed (especially with quota), always use Claude as fallback
      // Don't try OpenAI again if it already failed
      const fallbackProvider = (selectedProvider === "openai" || isQuotaError) ? "claude" : "openai";

      try {
        logger.info("Attempting fallback provider", {
          originalProvider: selectedProvider,
          fallbackProvider,
          agentType,
          isQuotaError,
        });
        
        if (fallbackProvider === "openai") {
          const client = getOpenAI();
          if (client) {
            logger.info("Retrying with OpenAI", { agentType });
            return await generateWithOpenAI(prompt, agentType, client);
          } else {
            logger.warn("OpenAI fallback not available (no API key)", { agentType });
          }
        } else {
          const client = getAnthropic();
          if (client) {
            logger.info("Retrying with Claude", { agentType });
            return await generateWithClaude(prompt, agentType, client);
          } else {
            logger.warn("Claude fallback not available (no API key)", { agentType });
          }
        }
      } catch (fallbackError) {
        // ✅ FIX: Log as warning - both providers failed, but caller should handle gracefully
        logger.warn("Fallback provider also failed", {
          originalProvider: selectedProvider,
          fallbackProvider,
          agentType,
          originalError: error instanceof Error ? error.message : String(error),
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          aiFallbackUsed: false, // Both providers failed
        });
        throw new Error(`AI generation failed with both providers. Original: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }

    throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate content using OpenAI with token tracking
 * 
 * Uses the shared OpenAI client from server/lib/openai-client.ts
 * ✅ FIX: Optimized to separate system and user messages when possible
 */
async function generateWithOpenAI(prompt: string, agentType: string, _client?: unknown): Promise<AIGenerationOutput> {
  const model = getOpenAIModel(agentType);
  const client = getOpenAI();
  
  if (!client) {
    throw new Error("OpenAI client not available - check OPENAI_API_KEY");
  }

  try {
    // ✅ FIX: Don't retry OpenAI if we're being called as a fallback from a 429 error
    // This prevents infinite loops when OpenAI quota is exceeded
    // ✅ OPTIMIZATION: Try to separate system and user messages
    // Look for common separators like "## User Request" or "## User Prompt"
    let messages: Array<{ role: "system" | "user"; content: string }>;
    
    const userRequestMatch = prompt.match(/##\s*User\s+Request\s*\n\n(.*)/is);
    if (userRequestMatch) {
      // Split into system and user messages
      const systemPart = prompt.substring(0, userRequestMatch.index).trim();
      const userPart = userRequestMatch[1].trim();
      
      messages = [
        { role: "system", content: systemPart },
        { role: "user", content: userPart }
      ];
    } else {
      // Fallback: send as single system message (original behavior)
      messages = [{ role: "system", content: prompt }];
    }

    // ✅ LOGGING: Log OpenAI API call
    logger.info("Calling OpenAI API", {
      model,
      agentType,
      provider: "openai",
      messageCount: messages.length,
      promptLength: prompt.length,
    });

    // Log model usage in development mode
    if (process.env.NODE_ENV === "development") {
      logger.debug("Using OpenAI model", {
        model,
        agentType,
        endpoint: "generateWithOpenAI",
      });
    }

    const startTime = Date.now();
    
    const payload = {
      model,
      messages,
      temperature: getTemperature(agentType),
      max_completion_tokens: getMaxTokens(agentType),
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    };
    
    // CRITICAL: Sanitize payload to remove unsupported parameters before API call
    // This prevents errors with models that have limited parameter support (e.g., gpt-5*)
    const sanitizedPayload = sanitizeOpenAIPayload(payload);
    
    // OPENAI_PAYLOAD_PROOF: Log what's actually being sent (no secrets/prompts)
    logger.info("OPENAI_PAYLOAD_PROOF", {
      model: sanitizedPayload.model,
      hasTemperature: sanitizedPayload.temperature !== undefined,
      temperatureValue: sanitizedPayload.temperature,
      hasPresencePenalty: sanitizedPayload.presence_penalty !== undefined,
      presencePenaltyValue: sanitizedPayload.presence_penalty,
      hasFrequencyPenalty: sanitizedPayload.frequency_penalty !== undefined,
      frequencyPenaltyValue: sanitizedPayload.frequency_penalty,
      messageCount: sanitizedPayload.messages.length,
      agentType,
    });
    
    const response = await client.chat.completions.create(sanitizedPayload);
    const latencyMs = Date.now() - startTime;

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated by OpenAI");
    }

    // ✅ LOGGING: Log successful response
    logger.info("OpenAI API call successful", {
      model,
      agentType,
      provider: "openai",
      latencyMs,
      tokensIn: response.usage?.prompt_tokens,
      tokensOut: response.usage?.completion_tokens,
      totalTokens: response.usage?.total_tokens,
    });

    return {
      content,
      tokens_in: response.usage?.prompt_tokens,
      tokens_out: response.usage?.completion_tokens,
      total_tokens: response.usage?.total_tokens,
      provider: "openai",
      model
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("OpenAI generation error", error instanceof Error ? error : new Error(errorMessage), {
      model,
      agentType,
      provider: "openai",
    });
    throw new Error(`OpenAI API error: ${errorMessage}`);
  }
}

/**
 * Generate content using Claude with token tracking
 */
async function generateWithClaude(prompt: string, agentType: string, client: Anthropic): Promise<AIGenerationOutput> {
  const model = getClaudeModel(agentType);

  try {
    const response = await client.messages.create({
      model,
      max_tokens: getMaxTokens(agentType),
      temperature: getTemperature(agentType),
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (!content || content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    return {
      content: content.text,
      tokens_in: response.usage?.input_tokens,
      tokens_out: response.usage?.output_tokens,
      total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      provider: "claude",
      model
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Anthropic generation error", error instanceof Error ? error : new Error(errorMessage), {
      model,
      agentType,
      provider: "claude",
    });
    throw new Error(`Anthropic API error: ${errorMessage}`);
  }
}

/**
 * Load prompt template from file system
 */
export async function loadPromptTemplate(
  agent: "doc" | "design" | "advisor",
  version: string = "v1.0",
  locale: string = "en"
): Promise<string> {
  try {
    const templatePath = join(process.cwd(), "prompts", agent, locale, `${version}.md`);
    const template = await readFile(templatePath, "utf-8");
    
    // Extract just the system prompt content (skip markdown headers)
    const lines = template.split('\n');
    const startIndex = lines.findIndex(line => line.includes('## SYSTEM ROLE') || line.includes('You are'));
    
    if (startIndex === -1) {
      return template; // Return full template if no clear start found
    }
    
    return lines.slice(startIndex).join('\n');
  } catch (error) {
    logger.error("Failed to load prompt template", error instanceof Error ? error : new Error(String(error)), {
      agent,
      version,
      locale,
    });
    
    // Fallback templates
    return getFallbackTemplate(agent);
  }
}


/**
 * Get OpenAI model based on agent type
 * 
 * Uses shared model constants from server/lib/openai-client.ts
 */
function getOpenAIModel(agentType: string): string {
  switch (agentType) {
    case "doc":
      return DEFAULT_OPENAI_MODEL; // Good for text generation
    case "design":
      return DEFAULT_OPENAI_MODEL; // Good for structured output
    case "advisor":
      return ADVANCED_OPENAI_MODEL; // Best for analysis and reasoning
    default:
      return DEFAULT_OPENAI_MODEL;
  }
}

/**
 * Get Claude model based on agent type
 * 
 * Uses ANTHROPIC_MODEL env var if set, otherwise defaults to model-specific choices.
 * Falls back to claude-3-5-sonnet-latest if specific model not found.
 */
function getClaudeModel(agentType: string): string {
  // If ANTHROPIC_MODEL is set, use it for all agent types
  if (process.env.ANTHROPIC_MODEL) {
    return process.env.ANTHROPIC_MODEL;
  }

  // Otherwise, use agent-specific defaults
  switch (agentType) {
    case "doc":
      return "claude-3-5-haiku-20241022"; // Fast for text generation
    case "design":
      return "claude-3-5-sonnet-20241022"; // Good for structured output
    case "advisor":
      return "claude-3-5-sonnet-20241022"; // Best for analysis
    default:
      return "claude-3-5-haiku-20241022";
  }
}

/**
 * Get temperature setting based on agent type
 */
function getTemperature(agentType: string): number {
  switch (agentType) {
    case "doc":
      return 0.7; // Creative but controlled
    case "design":
      return 0.5; // More structured
    case "advisor":
      return 0.3; // Analytical and consistent
    default:
      return 0.7;
  }
}

/**
 * Get max tokens based on agent type
 */
function getMaxTokens(agentType: string): number {
  switch (agentType) {
    case "doc":
      return 1000; // Enough for social posts
    case "design":
      return 2000; // Structured visual output
    case "advisor":
      return 1500; // Detailed analysis
    default:
      return 1000;
  }
}


/**
 * Fallback templates when files can't be loaded
 */
function getFallbackTemplate(agent: "doc" | "design" | "advisor"): string {
  const templates = {
    doc: `You are a professional content writer specializing in social media and marketing copy. 

Create engaging content that:
- Matches the brand voice and tone
- Includes a clear call-to-action
- Uses appropriate hashtags
- Stays within platform limits

Generate your response as JSON with these fields:
{
  "headline": "Attention-grabbing headline",
  "body": "Main content body",
  "cta": "Clear call-to-action",
  "hashtags": ["#relevant", "#hashtags"],
  "post_theme": "educational|promotional|story|testimonial",
  "tone_used": "professional|casual|friendly|bold",
  "aspect_ratio": "1080x1350|1080x1080|1920x1080"
}`,

    design: `You are a creative director specializing in social media visual design.

Create visual recommendations that:
- Use brand colors effectively
- Match the content theme
- Consider accessibility
- Provide clear layout guidance

Generate your response as JSON with these fields:
{
  "cover_title": "Short title for cover slide",
  "template_ref": "carousel-educational|single-image|video-thumbnail",
  "alt_text": "Detailed accessibility description",
  "visual_elements": ["list", "of", "design", "elements"],
  "color_palette_used": ["#color1", "#color2"],
  "font_suggestions": ["FontName", "weights"]
}`,

    advisor: `You are a data-driven social media strategist and advisor.

Analyze performance data to provide:
- Content topic recommendations
- Optimal posting times
- Format suggestions
- Strategic insights

Generate your response as JSON with these fields:
{
  "topics": [
    {
      "title": "Topic name",
      "rationale": "Why this works based on data",
      "confidence": 0.85
    }
  ],
  "best_times": [
    {
      "day": "Thursday",
      "slot": "18:00",
      "confidence": 0.8
    }
  ],
  "format_mix": {
    "reel": 0.4,
    "carousel": 0.4,
    "image": 0.2
  },
  "hashtags": ["#data-driven", "#hashtags"],
  "keywords": ["engagement", "growth", "insights"]
}`
  };

  return templates[agent];
}

/**
 * Check which AI providers are available
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  
  if (process.env.OPENAI_API_KEY) {
    providers.push("openai");
  }
  
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push("claude");
  }
  
  return providers;
}

/**
 * Validate that at least one AI provider is configured
 */
export function validateAIProviders(): boolean {
  const providers = getAvailableProviders();
  if (providers.length === 0) {
    logger.error("No AI providers configured", undefined, {
      hint: "Please set OPENAI_API_KEY or ANTHROPIC_API_KEY",
    });
    return false;
  }
  logger.info("AI providers available", {
    providers: providers.join(", "),
  });
  return true;
}

// Export getDefaultProvider for use in other modules
export { getDefaultProvider };