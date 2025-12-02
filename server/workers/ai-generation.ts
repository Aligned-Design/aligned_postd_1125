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
      console.warn("Failed to initialize Anthropic client:", error);
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
 * Generate content using configured AI provider with token tracking
 */
export async function generateWithAI(
  prompt: string,
  agentType: "doc" | "design" | "advisor",
  provider?: AIProvider
): Promise<AIGenerationOutput> {
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
    // ✅ FIX: Log as warning since we have fallback providers - API failures are non-critical
    console.warn(`[AI] ⚠️ AI generation failed with ${selectedProvider} (will attempt fallback):`, {
      error: error instanceof Error ? error.message : String(error),
      provider: selectedProvider
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
      const fallbackProvider = selectedProvider === "openai" ? "claude" : "openai";

      try {
        console.log(`⚠️ ${selectedProvider} failed, attempting fallback to ${fallbackProvider}...`);
        
        if (fallbackProvider === "openai") {
          const client = getOpenAI();
          if (client) {
            console.log("✅ Retrying with OpenAI...");
            return await generateWithOpenAI(prompt, agentType, client);
          } else {
            console.warn("⚠️ OpenAI fallback not available (no API key)");
          }
        } else {
          const client = getAnthropic();
          if (client) {
            console.log("✅ Retrying with Claude...");
            return await generateWithClaude(prompt, agentType, client);
          } else {
            console.warn("⚠️ Claude fallback not available (no API key)");
          }
        }
      } catch (fallbackError) {
        // ✅ FIX: Log as warning - both providers failed, but caller should handle gracefully
        console.warn(`[AI] ⚠️ Fallback to ${fallbackProvider} also failed:`, {
          originalError: error instanceof Error ? error.message : String(error),
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          hint: "Both AI providers unavailable - caller should use fallback generation"
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
 */
async function generateWithOpenAI(prompt: string, agentType: string, _client?: unknown): Promise<AIGenerationOutput> {
  const model = getOpenAIModel(agentType);
  const client = getOpenAI();
  
  if (!client) {
    throw new Error("OpenAI client not available - check OPENAI_API_KEY");
  }

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: prompt
        }
      ],
      temperature: getTemperature(agentType),
      max_tokens: getMaxTokens(agentType),
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated by OpenAI");
    }

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
    console.error(`[OpenAI] Generation error:`, {
      error: errorMessage,
      model,
      agentType,
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
    if (error instanceof Error) {
      throw new Error(`Anthropic API error: ${error.message}`);
    }
    throw error;
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
    console.error(`Failed to load template for ${agent} ${version}:`, error);
    
    // Fallback templates
    return getFallbackTemplate(agent);
  }
}

/**
 * Generate Builder.io compatible content
 * Optimized for visual content blocks and structured data
 */
export async function generateBuilderContent(
  request: AIGenerationRequest
): Promise<AIGenerationResponse> {
  const { prompt, agentType, provider } = request;

  const builderPrompt = `${prompt}

Generate content optimized for Builder.io visual editor with these requirements:
- Return structured content that works well in visual blocks
- Include metadata for Builder.io field mapping
- Consider responsive design needs
- Generate content that's easily editable in visual editor
- Follow AGENTS.md Fusion Starter specifications

Agent type: ${agentType}

Return as valid JSON with this structure:
{
  "content": "Generated content here",
  "title": "Content title",
  "description": "Brief description",
  "tags": ["tag1", "tag2"],
  "builderFields": {
    "heading": "Main heading",
    "subheading": "Subheading if applicable",
    "cta": "Call to action text",
    "ctaUrl": "/target-url"
  }
}`;

  try {
    const result = await generateWithAI(builderPrompt, agentType, provider);

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(result.content);
      return {
        content: parsed.content || result.content,
        provider: provider || "openai",
        agentType: agentType
      };
    } catch (_parseError) {
      // Fallback if not valid JSON
      return {
        content: result.content,
        provider: provider || "openai",
        agentType: agentType
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Generation failed';
    return {
      content: `Error: ${errorMessage}`,
      provider: provider || "openai",
      agentType: agentType
    };
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
 */
function getClaudeModel(agentType: string): string {
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
 * Generate visual design blocks for Builder.io
 * Creates structured visual specifications with color, layout, and typography
 */
export async function generateDesignVisuals(
  request: AIGenerationRequest
): Promise<AIGenerationResponse> {
  const { prompt, provider } = request;

  const designPrompt = `${prompt}

Generate visual design specifications for Builder.io with these requirements:
- Return structured JSON optimized for visual blocks
- Include color palette with exact hex codes
- Provide layout and grid specifications
- Include typography recommendations
- Suggest component structure
- Consider responsive design (mobile, tablet, desktop)
- Include accessibility guidelines

Return as valid JSON with this structure:
{
  "title": "Design name",
  "description": "Design description",
  "visualBlocks": [
    {
      "type": "hero|section|card|grid|carousel|button|text|image",
      "id": "block-id",
      "label": "Block label",
      "config": {
        "layout": "flex|grid|block",
        "gridColumns": 12,
        "gap": "1rem",
        "padding": "2rem",
        "alignment": "center|start|end|stretch"
      },
      "styling": {
        "backgroundColor": "#ffffff",
        "borderRadius": "8px",
        "boxShadow": "0 2px 8px rgba(0,0,0,0.1)"
      }
    }
  ],
  "colorPalette": {
    "primary": "#primary-hex",
    "secondary": "#secondary-hex",
    "accent": "#accent-hex",
    "background": "#bg-hex",
    "text": "#text-hex"
  },
  "typography": {
    "heading": {
      "fontFamily": "Font Name",
      "fontSize": "32px",
      "fontWeight": "700",
      "lineHeight": "1.2"
    },
    "body": {
      "fontFamily": "Font Name",
      "fontSize": "16px",
      "fontWeight": "400",
      "lineHeight": "1.5"
    }
  },
  "responsive": {
    "mobile": {
      "breakpoint": "640px",
      "columns": 1,
      "padding": "1rem"
    },
    "tablet": {
      "breakpoint": "768px",
      "columns": 2,
      "padding": "1.5rem"
    },
    "desktop": {
      "breakpoint": "1024px",
      "columns": 12,
      "padding": "2rem"
    }
  },
  "accessibility": {
    "contrastRatio": "WCAG AA",
    "altText": "Descriptive alt text",
    "focusable": true
  }
}`;

  try {
    const result = await generateWithAI(designPrompt, "design", provider);

    // ✅ FIX: result is AIGenerationOutput, extract content property
    const content = result.content;

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(content);
      return {
        content: JSON.stringify(parsed, null, 2),
        provider: result.provider || provider || "openai",
        agentType: "design"
      };
    } catch (_parseError) {
      // Fallback if not valid JSON
      return {
        content: content,
        provider: result.provider || provider || "openai",
        agentType: "design"
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Generation failed';
    return {
      content: `Error: ${errorMessage}`,
      provider: provider || "openai",
      agentType: "design"
    };
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
    console.error("No AI providers configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY");
    return false;
  }
  console.log(`AI providers available: ${providers.join(", ")}`);
  return true;
}

// Export getDefaultProvider for use in other modules
export { getDefaultProvider };