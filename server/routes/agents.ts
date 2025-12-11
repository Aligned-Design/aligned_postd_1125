/**
 * AI Agent API Routes
 *
 * POST /api/agents/generate/doc - Generate content with Doc Agent
 * POST /api/agents/generate/design - Generate visuals with Design Agent
 * POST /api/agents/generate/advisor - Generate insights with Advisor Agent
 * POST /api/agents/generate/social - Generate social content for FB/IG (feed + Reels)
 * GET /api/agents/bfs/calculate - Calculate Brand Fidelity Score
 * GET /api/agents/templates/:agent/:version - Get prompt template
 * POST /api/agents/review/approve/:logId - Approve flagged content
 * POST /api/agents/review/reject/:logId - Reject flagged content
 * GET /api/agents/review/queue/:brandId - Get review queue
 * PATCH /api/agents/drafts/:draftId - Update a content draft
 * GET /api/agents/drafts/slot/:slotId - Get draft for a slot
 */

import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { logAuditAction } from "../lib/audit-logger";
import {
  GenerationRequest,
  GenerationResponse,
  DocInput,
  DocOutput,
  DesignInput,
  DesignOutput,
  AdvisorOutput,
  BrandSafetyConfig,
  DEFAULT_SAFETY_CONFIG,
  SafetyMode,
} from "../../client/types/agent-config";
import { parseBrandKit } from "../types/guards";
import { calculateBFS } from "../agents/brand-fidelity-scorer";
import { lintContent, autoFixContent } from "../agents/content-linter";
import { generateWithAI, loadPromptTemplate, NoAIProviderError } from "../workers/ai-generation";
import {
  validateDocRequest,
  validateDesignRequest,
  validateAdvisorRequest,
} from "../lib/validation-schemas";
import { v4 as uuidv4 } from "uuid";
import { getCurrentBrandGuide } from "../lib/brand-guide-service";
import {
  GenerateSocialRequestSchema,
  SocialContentPackageSchema,
  UpdateDraftRequestSchema,
  PLATFORM_RULES,
  type SocialContentPackage,
  type SupportedPlatform,
} from "@shared/social-content";

const router = Router();

// Use shared supabase client from server/lib/supabase.ts

// Maximum regeneration attempts for BFS failures
const MAX_REGENERATION_ATTEMPTS = 3;

/**
 * POST /api/agents/generate/doc
 * Generate content with Doc Agent
 * 
 * Canonical contract:
 * {
 *   "brand_id": "UUID",
 *   "input": {
 *     "topic": "string",
 *     "platform": "linkedin" | "instagram" | ...,
 *     "tone": "professional" | "casual" | ...,
 *     "format": "post" | "carousel" | ...,
 *     ...
 *   }
 * }
 * 
 * Backwards compatibility: Also accepts:
 * - brandId (camelCase) → normalized to brand_id
 * - Top-level prompt/platform/tone → normalized into input object
 */
router.post("/generate/doc", async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  try {
    // ✅ BACKWARDS COMPATIBILITY: Normalize request body before validation
    // Accept both brandId (camelCase) and brand_id (snake_case)
    // Accept top-level prompt/platform/tone and map into input object
    const normalizedBody: any = { ...req.body };
    
    // Normalize brand_id: accept brandId → brand_id
    if (normalizedBody.brandId && !normalizedBody.brand_id) {
      normalizedBody.brand_id = normalizedBody.brandId;
      delete normalizedBody.brandId;
    }
    
    // Normalize input: if top-level prompt/platform/tone exist, create/merge input object
    // This handles legacy requests that send prompt/platform/tone at the top level
    if (!normalizedBody.input) {
      // Check if we have any top-level fields that should be in input
      const hasTopLevelFields = normalizedBody.prompt || normalizedBody.topic || normalizedBody.platform || normalizedBody.tone || normalizedBody.format || normalizedBody.contentType;
      
      if (hasTopLevelFields) {
        normalizedBody.input = {
          // Canonical field is "topic" (matches Zod schema). Accept "prompt" as legacy alias.
          topic: normalizedBody.prompt || normalizedBody.topic || "",
          platform: normalizedBody.platform || "instagram",
          tone: normalizedBody.tone || "professional",
          format: normalizedBody.format || normalizedBody.contentType || "post",
          max_length: normalizedBody.maxLength || normalizedBody.max_length,
          include_cta: normalizedBody.includeCTA !== undefined ? normalizedBody.includeCTA : normalizedBody.include_cta !== undefined ? normalizedBody.include_cta : true,
          cta_type: normalizedBody.ctaType || normalizedBody.cta_type || normalizedBody.callToAction,
          additional_context: normalizedBody.additionalContext || normalizedBody.additional_context,
        };
        
        // Clean up top-level fields that are now in input
        delete normalizedBody.prompt;
        delete normalizedBody.topic;
        delete normalizedBody.platform;
        delete normalizedBody.tone;
        delete normalizedBody.format;
        delete normalizedBody.contentType;
        delete normalizedBody.maxLength;
        delete normalizedBody.max_length;
        delete normalizedBody.includeCTA;
        delete normalizedBody.include_cta;
        delete normalizedBody.ctaType;
        delete normalizedBody.cta_type;
        delete normalizedBody.callToAction;
        delete normalizedBody.additionalContext;
        delete normalizedBody.additional_context;
      }
    }
    
    // Validate input with Zod schema (now using normalized body)
    let brand_id: string;
    let input: DocInput;
    let safety_mode: string;
    let __idempotency_key: string | undefined;
    
    try {
      const validated = validateDocRequest(normalizedBody);
      brand_id = validated.brand_id;
      input = validated.input as DocInput;
      safety_mode = validated.safety_mode || "safe";
      __idempotency_key = validated.__idempotency_key;
    } catch (validationError: any) {
      // Handle Zod validation errors with clear messages
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.errors.map((err) => {
          const path = err.path.join(".");
          return `${path}: ${err.message}`;
        }).join("; ");
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          `Validation failed: ${errorMessages}`,
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { 
            requestId, 
            originalBody: req.body, 
            normalizedBody,
            hint: "If you sent brandId or top-level prompt/platform/tone, normalization may have failed. Check that the request format matches the canonical contract."
          },
          "Please check your request format. Expected: { brand_id: string, input: { topic: string, platform: string, ... } }",
        );
      }
      // If it's not a ZodError but has errors array (legacy format)
      if (validationError.errors && Array.isArray(validationError.errors)) {
        const errorMessages = validationError.errors.map((err: any) => {
          const path = err.path?.join?.(".") || String(err.path || "unknown");
          return `${path}: ${err.message || String(err)}`;
        }).join("; ");
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          `Validation failed: ${errorMessages}`,
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { 
            requestId, 
            originalBody: req.body, 
            normalizedBody,
            hint: "If you sent brandId or top-level prompt/platform/tone, normalization may have failed. Check that the request format matches the canonical contract."
          },
          "Please check your request format. Expected: { brand_id: string, input: { topic: string, platform: string, ... } }",
        );
      }
      // If error message is already a stringified array, parse it
      if (typeof validationError.message === 'string' && validationError.message.startsWith('[')) {
        try {
          const parsedErrors = JSON.parse(validationError.message);
          if (Array.isArray(parsedErrors)) {
            const errorMessages = parsedErrors.map((err: any) => {
              const path = err.path?.join?.(".") || String(err.path || "unknown");
              return `${path}: ${err.message || String(err)}`;
            }).join("; ");
            throw new AppError(
              ErrorCode.MISSING_REQUIRED_FIELD,
              `Validation failed: ${errorMessages}`,
              HTTP_STATUS.BAD_REQUEST,
              "warning",
              { 
                requestId, 
                originalBody: req.body, 
                normalizedBody,
                hint: "Normalization may have failed. Original request had brandId/top-level fields but they weren't converted."
              },
              "Please check your request format. Expected: { brand_id: string, input: { topic: string, platform: string, ... } }",
            );
          }
        } catch {
          // If parsing fails, fall through to throw original error
        }
      }
      throw validationError;
    }
    const docInput = input as DocInput;

    // Load brand safety config and brand kit from brands table
    // ✅ FALLBACK: If PostgREST schema cache error occurs, use default safety config
    let brandData: { safety_config: any; brand_kit: any } | null = null;
    let brandError: any = null;
    
    const { data: fetchedBrandData, error: fetchedBrandError } = await supabase
      .from("brands")
      .select("safety_config, brand_kit")
      .eq("id", brand_id)
      .single();

    brandData = fetchedBrandData;
    brandError = fetchedBrandError;

    // ✅ HANDLE SCHEMA CACHE ERRORS: Fallback to default safety config
    const isSchemaCacheError = brandError?.message?.includes("brand_safety_configs") || 
                               brandError?.message?.includes("Could not find the table") ||
                               brandError?.message?.includes("schema cache");

    if (brandError && !isSchemaCacheError) {
      // Real database error (not schema cache issue)
      console.error("[Doc Agent] Failed to load brand data:", {
        brand_id,
        error: brandError.message,
        code: brandError.code,
        details: brandError.details,
      });
      
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to load brand data: ${brandError.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        { brand_id, originalError: brandError.message, requestId },
        "Please verify the brand exists and you have access to it.",
      );
    }

    if (isSchemaCacheError) {
      // ✅ FALLBACK: PostgREST schema cache is stale - use default safety config
      console.warn("[Doc Agent] PostgREST schema cache error detected, using default safety config", {
        brand_id,
        error: brandError?.message,
        requestId,
        action: "fallback_to_default_safety_config",
      });
      
      // Use default safety config and attempt to load brand_kit separately
      // Try a simpler query that might work even with stale cache
      const { data: brandKitData } = await supabase
        .from("brands")
        .select("brand_kit")
        .eq("id", brand_id)
        .single();
      
      // Use default safety config
      brandData = {
        safety_config: null, // Will be replaced with default below
        brand_kit: brandKitData?.brand_kit || null,
      };
    }

    // Extract safety config from JSONB column (with fallback defaults)
    // ✅ FALLBACK: If schema cache error occurred, use default safety config
    const safetyConfigData: BrandSafetyConfig = isSchemaCacheError
      ? {
          ...DEFAULT_SAFETY_CONFIG,
          safety_mode: (safety_mode || DEFAULT_SAFETY_CONFIG.safety_mode) as SafetyMode,
        }
      : ((brandData?.safety_config as BrandSafetyConfig) || {
          ...DEFAULT_SAFETY_CONFIG,
          safety_mode: (safety_mode || DEFAULT_SAFETY_CONFIG.safety_mode) as SafetyMode,
        });

    const safetyConfig: BrandSafetyConfig = {
      ...safetyConfigData,
      safety_mode: (safetyConfigData.safety_mode || safety_mode || DEFAULT_SAFETY_CONFIG.safety_mode) as SafetyMode,
    };

    // Extract brand kit from JSONB column
    const brandKit = brandData?.brand_kit || {};
    const parsedBrandKit = parseBrandKit(brandKit);

    let attempts = 0;
    let output: DocOutput | undefined;
    let blocked = false;
    let needsReview = false;
    let tokens_in = 0;
    let tokens_out = 0;
    let provider_used = "";
    let model_used = "";

    while (attempts < MAX_REGENERATION_ATTEMPTS && !output) {
      attempts++;

      try {
        // Generate content with AI
        const aiOutput = await generateDocContent(
          docInput,
          parsedBrandKit,
          safetyConfig,
        );

        // Capture token usage
        if ((aiOutput as any).__tokens_in !== undefined) {
          tokens_in = (aiOutput as any).__tokens_in;
          tokens_out = (aiOutput as any).__tokens_out;
          provider_used = (aiOutput as any).__provider || "";
          model_used = (aiOutput as any).__model || "";
        }

        // Calculate Brand Fidelity Score
        const bfs = await calculateBFS(
          {
            body: aiOutput.body,
            headline: aiOutput.headline,
            cta: aiOutput.cta,
            hashtags: aiOutput.hashtags,
            platform: docInput.platform,
          },
          {
            tone_keywords: parsedBrandKit.toneKeywords || [],
            brandPersonality: parsedBrandKit.brandPersonality || [],
            writingStyle: parsedBrandKit.writingStyle,
            commonPhrases: parsedBrandKit.commonPhrases,
            required_disclaimers: safetyConfig.required_disclaimers,
            required_hashtags: safetyConfig.required_hashtags,
            banned_phrases: safetyConfig.banned_phrases,
          },
        );

        // Run content linter
        const linterResult = await lintContent(
          {
            body: aiOutput.body,
            headline: aiOutput.headline,
            cta: aiOutput.cta,
            hashtags: aiOutput.hashtags,
            platform: docInput.platform,
          },
          safetyConfig,
        );

        // Auto-fix if possible
        const finalContent = {
          body: aiOutput.body,
          headline: aiOutput.headline || "",
          cta: aiOutput.cta,
          hashtags: aiOutput.hashtags,
          platform: docInput.platform,
        };

        if (!linterResult.passed && !linterResult.blocked) {
          const { content: fixedContent, fixes } = autoFixContent(
            {
              body: finalContent.body,
              headline: finalContent.headline,
              cta: finalContent.cta,
              hashtags: finalContent.hashtags,
              platform: finalContent.platform,
            },
            linterResult,
            safetyConfig,
          );

          finalContent.body = fixedContent.body;
          finalContent.headline = fixedContent.headline || "";
          finalContent.cta = fixedContent.cta || finalContent.cta;
          finalContent.hashtags =
            fixedContent.hashtags || finalContent.hashtags;
          linterResult.fixes_applied = fixes;
        }

        // Check if we should proceed
        if (linterResult.blocked) {
          blocked = true;
          break;
        }

        if (
          bfs.passed &&
          (linterResult.passed || linterResult.fixes_applied.length > 0)
        ) {
          output = {
            ...aiOutput,
            body: finalContent.body,
            headline: finalContent.headline,
            cta: finalContent.cta,
            hashtags: finalContent.hashtags,
            bfs,
            linter: linterResult,
          };
        } else if (linterResult.needs_human_review) {
          needsReview = true;
          output = {
            ...aiOutput,
            body: finalContent.body,
            headline: finalContent.headline,
            cta: finalContent.cta,
            hashtags: finalContent.hashtags,
            bfs,
            linter: linterResult,
          };
        }
        // If BFS failed or linter failed without fixes, continue loop for retry
      } catch (generationError) {
        console.error(
          `Generation attempt ${attempts} failed:`,
          generationError,
        );
        if (attempts >= MAX_REGENERATION_ATTEMPTS) {
          throw generationError;
        }
      }
    }

    // Log the generation attempt
    const logEntry = {
      brand_id,
      agent: "doc" as const,
      prompt_version: "v1.0",
      safety_mode: safetyConfig.safety_mode,
      input: docInput,
      output,
      bfs: output?.bfs,
      linter_results: output?.linter,
      approved: !needsReview && !blocked,
      revision: 0,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      tokens_in,
      tokens_out,
      provider: provider_used || "unknown",
      model: model_used || "unknown",
      regeneration_count: attempts - 1,
      request_id: requestId,
      error: blocked
        ? "Content blocked by safety filters"
        : !output
          ? "Failed to generate acceptable content"
          : undefined,
    };

    const { data: logData, error: logError } = await supabase
      .from("generation_logs")
      .insert(logEntry)
      .select()
      .single();

    if (logError) {
      console.error("Failed to log generation:", logError);
    }

    const response: GenerationResponse = {
      success: !!output,
      output,
      bfs: output?.bfs,
      linter: output?.linter,
      needs_review: needsReview,
      blocked,
      error: blocked
        ? "Content blocked by safety filters"
        : !output
          ? "Failed to generate acceptable content after multiple attempts"
          : undefined,
      log_id: logData?.id || "",
    };

    (res as any).json(response);
  } catch (error) {
    console.error("Doc generation error:", error);

    // Handle validation errors
    if (
      error instanceof Error &&
      error.message.startsWith("Validation failed:")
    ) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        error.message,
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { requestId },
        "Please check your request format and try again",
      );
    }

    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Internal server error",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error
        ? { originalError: error.message, requestId }
        : { requestId },
      "Please try again later or contact support",
    );
  }
});

/**
 * POST /api/agents/generate/design
 * Generate visuals with Design Agent
 */
router.post("/generate/design", async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  try {
    // Validate input with Zod schema
    const { brand_id, input } = validateDesignRequest(req.body);

    // Load brand kit for visual context from brands table
    const { data: brandData, error: brandError } = await supabase
      .from("brands")
      .select("brand_kit")
      .eq("id", brand_id)
      .single();

    if (brandError) {
      throw new Error(
        `Failed to load brand kit: ${brandError?.message || String(brandError)}`,
      );
    }

    const brandKit = brandData?.brand_kit || {};

    const parsedBrandKit = parseBrandKit(brandKit || {});

    // Generate design recommendations
    const output = await generateDesignContent(
      input as DesignInput,
      parsedBrandKit,
    );

    // Extract token usage from design output
    const tokens_in = (output as any).__tokens_in || 0;
    const tokens_out = (output as any).__tokens_out || 0;
    const provider = (output as any).__provider || "unknown";
    const model = (output as any).__model || "unknown";

    // Log the generation
    const logEntry = {
      brand_id,
      agent: "design" as const,
      prompt_version: "v1.0",
      safety_mode: "safe" as const,
      input,
      output,
      approved: true, // Design output doesn't require BFS/linter checks
      revision: 0,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      tokens_in,
      tokens_out,
      provider,
      model,
      regeneration_count: 0,
      request_id: requestId,
    };

    const { data: logData, error: logError } = await supabase
      .from("generation_logs")
      .insert(logEntry)
      .select()
      .single();

    if (logError) {
      console.error("Failed to log generation:", logError);
    }

    const response: GenerationResponse = {
      success: true,
      output,
      needs_review: false,
      blocked: false,
      log_id: logData?.id || "",
    };

    (res as any).json(response);
  } catch (error) {
    console.error("Design generation error:", error);

    // Handle validation errors
    if (
      error instanceof Error &&
      error.message.startsWith("Validation failed:")
    ) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        error.message,
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { requestId },
        "Please check your request format and try again",
      );
    }

    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Internal server error",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error
        ? { originalError: error.message, requestId }
        : { requestId },
      "Please try again later or contact support",
    );
  }
});

/**
 * POST /api/agents/generate/advisor
 * Generate insights with Advisor Agent
 */
router.post("/generate/advisor", async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  try {
    // Validate input with Zod schema
    const { brand_id } = validateAdvisorRequest(req.body);

    // Check cache first
    const { data: cachedOutput, error: cacheError } = await supabase
      .from("advisor_cache")
      .select("*")
      .eq("brand_id", brand_id)
      .gte("valid_until", new Date().toISOString())
      .single();

    if (!cacheError && cachedOutput) {
      return (res as any).json({
        success: true,
        output: cachedOutput.output,
        needs_review: false,
        blocked: false,
        log_id: cachedOutput.id,
      });
    }

    // Generate new insights
    const output = await generateAdvisorInsights(brand_id);

    // Cache the results (valid for 24 hours)
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 24);

    const { data: cacheData, error: cacheSaveError } = await supabase
      .from("advisor_cache")
      .upsert({
        brand_id,
        output,
        cached_at: new Date().toISOString(),
        valid_until: validUntil.toISOString(),
      })
      .select()
      .single();

    if (cacheSaveError) {
      console.error("Failed to cache advisor output:", cacheSaveError);
    }

    // Extract token usage from advisor output
    const tokens_in = (output as any).__tokens_in || 0;
    const tokens_out = (output as any).__tokens_out || 0;
    const provider = (output as any).__provider || "unknown";
    const model = (output as any).__model || "unknown";

    // Log the generation
    const logEntry = {
      brand_id,
      agent: "advisor" as const,
      prompt_version: "v1.0",
      safety_mode: "safe" as const,
      input: { brand_id },
      output,
      approved: true,
      revision: 0,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      tokens_in,
      tokens_out,
      provider,
      model,
      regeneration_count: 0,
      request_id: requestId,
    };

    const { data: logData, error: __logError } = await supabase
      .from("generation_logs")
      .insert(logEntry)
      .select()
      .single();

    const response: GenerationResponse = {
      success: true,
      output,
      needs_review: false,
      blocked: false,
      log_id: logData?.id || cacheData?.id || "",
    };

    (res as any).json(response);
  } catch (error) {
    console.error("Advisor generation error:", error);

    // Handle validation errors
    if (
      error instanceof Error &&
      error.message.startsWith("Validation failed:")
    ) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        error.message,
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { requestId },
        "Please check your request format and try again",
      );
    }

    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Internal server error",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error
        ? { originalError: error.message, requestId }
        : { requestId },
      "Please try again later or contact support",
    );
  }
});

/**
 * POST /api/agents/generate/social
 * Generate social content for Facebook and Instagram (feed + Reels)
 * 
 * Input: { brand_id: string, slot_id: string }
 * Output: { success: boolean, draft_id: string, content: SocialContentPackage }
 */
router.post("/generate/social", async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  
  try {
    // ✅ VALIDATION: Parse and validate request with Zod
    let brand_id: string;
    let slot_id: string;
    
    try {
      const validated = GenerateSocialRequestSchema.parse(req.body);
      brand_id = validated.brand_id;
      slot_id = validated.slot_id;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.errors.map((err) => {
          const path = err.path.join(".");
          return `${path}: ${err.message}`;
        }).join("; ");
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          `Validation failed: ${errorMessages}`,
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { requestId, originalBody: req.body },
          "Please provide valid brand_id and slot_id (both must be UUIDs)",
        );
      }
      throw validationError;
    }

    console.log("[Social Agent] Starting generation", { requestId, brand_id, slot_id });

    // ✅ STEP 1: Load the slot (content_items record)
    const { data: slotData, error: slotError } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", slot_id)
      .eq("brand_id", brand_id)
      .single();

    if (slotError || !slotData) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        `Content slot not found: ${slot_id}`,
        HTTP_STATUS.NOT_FOUND,
        "warning",
        { requestId, slot_id, brand_id },
        "The specified content slot does not exist or belongs to a different brand",
      );
    }

    // ✅ STEP 2: Normalize platform from slot
    const rawPlatform = (slotData.platform || "").toLowerCase();
    const slotType = (slotData.type || "post").toLowerCase();
    
    // Map platform string to supported platform enum
    let platform: SupportedPlatform;
    if (rawPlatform === "facebook") {
      platform = "facebook";
    } else if (rawPlatform === "instagram" || rawPlatform === "instagram_feed") {
      // Check if it's a reel based on type
      if (slotType === "reel" || slotType === "reels" || slotType === "instagram_reel") {
        platform = "instagram_reel";
      } else {
        platform = "instagram_feed";
      }
    } else if (rawPlatform === "instagram_reel") {
      platform = "instagram_reel";
    } else {
      // Unsupported platform
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Unsupported platform: ${rawPlatform}. Only facebook, instagram_feed, and instagram_reel are supported.`,
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { requestId, platform: rawPlatform },
        "This endpoint only supports Facebook and Instagram (feed + Reels). For other platforms, please use the appropriate endpoint.",
      );
    }

    console.log("[Social Agent] Slot loaded", { 
      requestId, 
      slot_id, 
      platform, 
      rawPlatform, 
      slotType,
      slotTitle: slotData.title 
    });

    // ✅ STEP 3: Load the Brand Guide
    const brandGuide = await getCurrentBrandGuide(brand_id);
    
    if (!brandGuide) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        `Brand Guide not found for brand: ${brand_id}`,
        HTTP_STATUS.NOT_FOUND,
        "warning",
        { requestId, brand_id },
        "Please complete the brand setup before generating content",
      );
    }

    console.log("[Social Agent] Brand Guide loaded", { 
      requestId, 
      brandName: brandGuide.brandName,
      hasTone: !!brandGuide.voiceAndTone?.tone?.length,
      hasColors: !!brandGuide.visualIdentity?.colors?.length,
    });

    // ✅ STEP 4: Extract slot context (from content JSONB)
    const slotContent = typeof slotData.content === "object" ? slotData.content : {};
    const slotContext = {
      title: slotData.title || "",
      pillar: (slotContent as any).pillar || (slotContent as any).content_pillar || "",
      objective: (slotContent as any).objective || "",
      hook: (slotContent as any).hook || "",
      angle: (slotContent as any).angle || "",
      cta: (slotContent as any).cta || "",
      recommended_asset_role: (slotContent as any).recommended_asset_role || (slotContent as any).asset_role || "",
    };

    // ✅ STEP 5: Build the AI prompt
    const prompt = buildSocialContentPrompt(brandGuide, slotContext, platform);

    // ✅ STEP 6: Call AI to generate content
    const aiResponse = await generateWithAI(prompt, "doc");
    
    console.log("[Social Agent] AI response received", { 
      requestId, 
      tokens_in: aiResponse.tokens_in,
      tokens_out: aiResponse.tokens_out,
      provider: aiResponse.provider,
    });

    // ✅ STEP 7: Parse and validate AI response
    let contentPackage: SocialContentPackage;
    try {
      // Clean up the response (remove markdown code blocks if present)
      let cleaned = aiResponse.content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      // Parse JSON
      const parsed = JSON.parse(cleaned);
      
      // Add platform to the parsed object
      parsed.platform = platform;
      
      // Validate with Zod schema
      contentPackage = SocialContentPackageSchema.parse(parsed);
    } catch (parseError) {
      console.error("[Social Agent] Failed to parse AI response", { 
        requestId, 
        error: parseError instanceof Error ? parseError.message : String(parseError),
        rawResponse: aiResponse.content.substring(0, 500),
      });
      
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Failed to parse AI-generated content",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        { 
          requestId, 
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        },
        "The AI generated invalid content. Please try again.",
      );
    }

    // ✅ STEP 8: Store the draft in content_drafts table
    const draftId = uuidv4();
    const { error: insertError } = await supabase
      .from("content_drafts")
      .insert({
        id: draftId,
        brand_id,
        slot_id,
        platform,
        payload: contentPackage,
        status: "draft",
        generated_by_agent: "social-content-agent",
      });

    if (insertError) {
      console.error("[Social Agent] Failed to store draft", { 
        requestId, 
        error: insertError.message,
        code: insertError.code,
      });
      
      // Return success but warn about storage failure
      // The content is still usable even if not persisted
      console.warn("[Social Agent] Returning content without persistence", { requestId });
    }

    // ✅ STEP 9: Log the generation
    const logEntry = {
      brand_id,
      agent: "social" as const,
      prompt_version: "v1.0",
      safety_mode: "safe" as const,
      input: { brand_id, slot_id, platform },
      output: contentPackage,
      approved: true,
      revision: 0,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      tokens_in: aiResponse.tokens_in || 0,
      tokens_out: aiResponse.tokens_out || 0,
      provider: aiResponse.provider || "unknown",
      model: aiResponse.model || "unknown",
      regeneration_count: 0,
      request_id: requestId,
    };

    await supabase
      .from("generation_logs")
      .insert(logEntry)
      .then(({ error }) => {
        if (error) {
          console.error("[Social Agent] Failed to log generation:", error);
        }
      });

    // ✅ STEP 10: Return success response
    const response = {
      success: true,
      draft_id: insertError ? undefined : draftId,
      content: contentPackage,
    };

    console.log("[Social Agent] Generation complete", { 
      requestId, 
      draft_id: draftId,
      platform,
      duration_ms: Date.now() - startTime,
    });

    (res as any).json(response);
  } catch (error) {
    console.error("[Social Agent] Generation error:", error);

    if (error instanceof AppError) {
      throw error;
    }

    // ✅ Handle missing AI provider with user-friendly error
    if (error instanceof NoAIProviderError) {
      throw new AppError(
        ErrorCode.NO_AI_PROVIDER_CONFIGURED,
        error.message,
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        "warning",
        { requestId, code: "NO_AI_PROVIDER_CONFIGURED" },
        "Configure OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment to enable AI features.",
      );
    }

    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Internal server error",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error
        ? { originalError: error.message, requestId }
        : { requestId },
      "Failed to generate social content. Please try again.",
    );
  }
});

/**
 * PATCH /api/agents/drafts/:draftId
 * Update a content draft (e.g., edit caption, change status)
 */
router.patch("/drafts/:draftId", async (req, res) => {
  const requestId = uuidv4();
  const { draftId } = req.params;

  try {
    // Validate draftId is a UUID
    if (!z.string().uuid().safeParse(draftId).success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid draft ID format",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { requestId, draftId },
        "Draft ID must be a valid UUID",
      );
    }

    // Parse and validate update payload
    const updateResult = UpdateDraftRequestSchema.safeParse(req.body);
    if (!updateResult.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid update payload: ${updateResult.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ")}`,
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { requestId, validationErrors: updateResult.error.errors },
        "Please provide valid update fields",
      );
    }

    const updates = updateResult.data;

    // Fetch existing draft
    const { data: existingDraft, error: fetchError } = await supabase
      .from("content_drafts")
      .select("*")
      .eq("id", draftId)
      .single();

    if (fetchError || !existingDraft) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Draft not found",
        HTTP_STATUS.NOT_FOUND,
        "warning",
        { requestId, draftId },
        "The specified draft does not exist",
      );
    }

    // Build updated payload
    const existingPayload = existingDraft.payload || {};
    const updatedPayload = { ...existingPayload };

    if (updates.primary_text !== undefined) {
      updatedPayload.primary_text = updates.primary_text;
    }
    if (updates.headline !== undefined) {
      updatedPayload.headline = updates.headline;
    }
    if (updates.suggested_hashtags !== undefined) {
      updatedPayload.suggested_hashtags = updates.suggested_hashtags;
    }
    if (updates.cta_text !== undefined) {
      updatedPayload.cta_text = updates.cta_text;
    }
    if (updates.design_brief !== undefined) {
      updatedPayload.design_brief = updates.design_brief;
    }

    // Determine new status
    const newStatus = updates.status || (Object.keys(updates).length > 0 ? "edited" : existingDraft.status);

    // Update the draft
    const { error: updateError } = await supabase
      .from("content_drafts")
      .update({
        payload: updatedPayload,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", draftId);

    if (updateError) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        `Failed to update draft: ${updateError.message}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        { requestId, draftId, error: updateError.message },
        "Failed to save changes. Please try again.",
      );
    }

    console.log("[Social Agent] Draft updated", { requestId, draftId, status: newStatus });

    (res as any).json({
      success: true,
      draft_id: draftId,
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Social Agent] Draft update error:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Internal server error",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      { requestId },
      "Failed to update draft. Please try again.",
    );
  }
});

/**
 * GET /api/agents/drafts/slot/:slotId
 * Get the draft for a specific slot
 */
router.get("/drafts/slot/:slotId", async (req, res) => {
  const requestId = uuidv4();
  const { slotId } = req.params;

  try {
    // Validate slotId is a UUID
    if (!z.string().uuid().safeParse(slotId).success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid slot ID format",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { requestId, slotId },
        "Slot ID must be a valid UUID",
      );
    }

    // Fetch draft for this slot (get the most recent one)
    const { data: draft, error: fetchError } = await supabase
      .from("content_drafts")
      .select("*")
      .eq("slot_id", slotId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !draft) {
      // No draft found is not an error - just return null
      (res as any).json({
        success: true,
        draft: null,
      });
      return;
    }

    (res as any).json({
      success: true,
      draft: {
        id: draft.id,
        slot_id: draft.slot_id,
        brand_id: draft.brand_id,
        platform: draft.platform,
        content: draft.payload,
        status: draft.status,
        created_at: draft.created_at,
        updated_at: draft.updated_at,
      },
    });
  } catch (error) {
    console.error("[Social Agent] Draft fetch error:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Internal server error",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      { requestId },
      "Failed to fetch draft. Please try again.",
    );
  }
});

/**
 * GET /api/agents/bfs/calculate
 * Calculate Brand Fidelity Score for given content
 */
router.post("/bfs/calculate", async (req, res) => {
  const requestId = uuidv4();
  try {
    const { content, brand_id } = req.body;

    if (!content || !brand_id) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing content or brand_id",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
      );
    }

    // Load brand kit from brands table
    const { data: brandData } = await supabase
      .from("brands")
      .select("brand_kit, tone_keywords")
      .eq("id", brand_id)
      .single();

    const brandKit = brandData?.brand_kit || {};
    const toneKeywords = brandData?.tone_keywords || [];

    const bfs = await calculateBFS(content, {
      tone_keywords: Array.isArray(toneKeywords) ? toneKeywords : [],
      brandPersonality: brandKit?.brandPersonality || [],
      writingStyle: brandKit?.writingStyle,
      commonPhrases: brandKit?.commonPhrases,
    });

    (res as any).json(bfs);
  } catch (error) {
    console.error("BFS calculation error:", error);
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to calculate BFS",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support",
    );
  }
});

// ✅ REMOVED: MOCK_REVIEW_QUEUE - always use real database
// Mock data moved to test fixtures if needed for testing

/**
 * GET /api/agents/review/queue/:brandId
 * Get content pending review
 */
router.get("/review/queue/:brandId", async (req, res) => {
  try {
    const { brandId } = req.params;

    // ✅ REMOVED: USE_MOCKS check - always use real database in production
    const { data: reviewQueue, error } = await supabase
      .from("generation_logs")
      .select("*")
      .eq("brand_id", brandId)
      .eq("approved", false)
      .is("error", null)
      .order("timestamp", { ascending: false })
      .limit(50);

    if (error) {
      // Graceful fallback: return empty queue instead of throwing
      console.warn("Review queue error:", error);
      return (res as any).json({ items: [], totalCount: 0, pendingCount: 0 });
    }

    const items = reviewQueue || [];
    (res as any).json({ items, totalCount: items.length, pendingCount: items.length });
  } catch (error) {
    console.error("Review queue error:", error);
    // Graceful fallback: always return valid JSON, never throw
    (res as any).json({ items: [], totalCount: 0, pendingCount: 0 });
  }
});

/**
 * POST /api/agents/review/approve/:logId
 * Approve flagged content
 */
router.post("/review/approve/:logId", async (req, res) => {
  try {
    const { logId } = req.params;
    const { reviewer_notes } = req.body;

    // Get the generation log to extract brandId and postId for audit logging
    const { data: logEntry, error: fetchError } = await supabase
      .from("generation_logs")
      .select("brand_id, post_id, agent")
      .eq("id", logId)
      .single();

    if (fetchError || !logEntry) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Generation log not found",
        HTTP_STATUS.NOT_FOUND,
        "warning",
        undefined,
        "The content to approve could not be found"
      );
    }

    const { error } = await supabase
      .from("generation_logs")
      .update({
        approved: true,
        reviewer_notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", logId);

    if (error) {
      throw error;
    }

    // Log audit action
    const userId = (req as any).user?.id || (req.headers["x-user-id"] as string) || "system";
    const userEmail = (req as any).user?.email || (req.headers["x-user-email"] as string) || "system";
    const postId = logEntry.post_id || logId;
    
    try {
      await logAuditAction(
        logEntry.brand_id,
        postId,
        userId,
        userEmail,
        "APPROVED",
        {
          note: reviewer_notes || "",
          agent: logEntry.agent,
          logId,
        },
        req.ip,
        req.headers["user-agent"],
      );
    } catch (auditError) {
      // Log audit error but don't fail the approval
      console.error("[Audit] Failed to log approval action:", auditError);
    }

    (res as any).json({ success: true, reviewId: logId, action: "approve", updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Approval error:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to approve content",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support",
    );
  }
});

/**
 * POST /api/agents/review/reject/:logId
 * Reject flagged content
 */
router.post("/review/reject/:logId", async (req, res) => {
  try {
    const { logId } = req.params;
    const { reviewer_notes } = req.body;

    // Get the generation log to extract brandId and postId for audit logging
    const { data: logEntry, error: fetchError } = await supabase
      .from("generation_logs")
      .select("brand_id, post_id, agent")
      .eq("id", logId)
      .single();

    if (fetchError || !logEntry) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Generation log not found",
        HTTP_STATUS.NOT_FOUND,
        "warning",
        undefined,
        "The content to reject could not be found"
      );
    }

    const { error } = await supabase
      .from("generation_logs")
      .update({
        approved: false,
        reviewer_notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", logId);

    if (error) {
      throw error;
    }

    // Log audit action
    const userId = (req as any).user?.id || (req.headers["x-user-id"] as string) || "system";
    const userEmail = (req as any).user?.email || (req.headers["x-user-email"] as string) || "system";
    const postId = logEntry.post_id || logId;
    
    try {
      await logAuditAction(
        logEntry.brand_id,
        postId,
        userId,
        userEmail,
        "REJECTED",
        {
          note: reviewer_notes || "",
          agent: logEntry.agent,
          logId,
        },
        req.ip,
        req.headers["user-agent"],
      );
    } catch (auditError) {
      // Log audit error but don't fail the rejection
      console.error("[Audit] Failed to log rejection action:", auditError);
    }

    (res as any).json({ success: true, reviewId: logId, action: "reject", updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Rejection error:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to reject content",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      error instanceof Error ? { originalError: error.message } : undefined,
      "Please try again later or contact support",
    );
  }
});

/**
 * GET /api/agents
 * Get available agents
 */
router.get("/", (req, res) => {
  (res as any).json({ agents: [] });
});

// Helper functions for content generation
async function generateDocContent(
  input: DocInput,
  brandKit: unknown,
  _safetyConfig: BrandSafetyConfig,
): Promise<DocOutput> {
  const template = await loadPromptTemplate("doc", "v1.0", "en");

  const prompt = template
    .replace(/\{\{brand_name\}\}/g, (brandKit as any).brandName || "Your Brand")
    .replace(
      /\{\{tone_keywords\}\}/g,
      ((brandKit as any).toneKeywords || []).join(", "),
    )
    .replace(
      /\{\{writing_style\}\}/g,
      (brandKit as any).writingStyle || "professional",
    )
    .replace(/\{\{topic\}\}/g, input.topic)
    .replace(/\{\{platform\}\}/g, input.platform)
    .replace(/\{\{format\}\}/g, input.format)
    .replace(/\{\{max_length\}\}/g, input.max_length?.toString() || "2200");

  const aiGenOutput = await generateWithAI(prompt, "doc");
  const aiResponse = aiGenOutput.content;

  // Parse AI response (assuming JSON format)
  let parsedOutput;
  try {
    parsedOutput = JSON.parse(aiResponse);
  } catch {
    // Fallback parsing if not JSON
    parsedOutput = {
      headline: aiResponse.split("\n")[0] || "",
      body: aiResponse,
      cta: "Learn more",
      hashtags: ["#YourBrand"],
      post_theme: input.format,
      tone_used: "professional",
      aspect_ratio: input.platform === "instagram" ? "1080x1350" : "1200x630",
      char_count: aiResponse.length,
    };
  }

  const result = {
    headline: parsedOutput.headline || "",
    body: parsedOutput.body || aiResponse,
    cta: parsedOutput.cta || "Learn more",
    hashtags: parsedOutput.hashtags || ["#YourBrand"],
    post_theme: parsedOutput.post_theme || input.format,
    tone_used: parsedOutput.tone_used || "professional",
    aspect_ratio: parsedOutput.aspect_ratio,
    char_count: (parsedOutput.body || aiResponse).length,
    bfs: {
      overall: 0,
      tone_alignment: 0,
      terminology_match: 0,
      compliance: 0,
      cta_fit: 0,
      platform_fit: 0,
      passed: false,
      issues: [],
      regeneration_count: 0,
    },
    linter: {
      passed: false,
      profanity_detected: false,
      toxicity_score: 0,
      banned_phrases_found: [],
      banned_claims_found: [],
      missing_disclaimers: [],
      missing_hashtags: [],
      platform_violations: [],
      pii_detected: [],
      competitor_mentions: [],
      fixes_applied: [],
      blocked: false,
      needs_human_review: false,
    },
  } as any;

  // Attach token usage information
  result.__tokens_in = aiGenOutput.tokens_in;
  result.__tokens_out = aiGenOutput.tokens_out;
  result.__provider = aiGenOutput.provider;
  result.__model = aiGenOutput.model;

  return result;
}

async function generateDesignContent(
  input: DesignInput,
  brandKit: unknown,
): Promise<DesignOutput> {
  const template = await loadPromptTemplate("design", "v1.0", "en");

  const prompt = template
    .replace(
      /\{\{brand_colors\}\}/g,
      (brandKit as any).primaryColor
        ? [
            (brandKit as any).primaryColor,
            (brandKit as any).secondaryColor,
            (brandKit as any).accentColor,
          ]
            .filter(Boolean)
            .join(", ")
        : "#8B5CF6",
    )
    .replace(/\{\{theme\}\}/g, input.theme)
    .replace(/\{\{aspect_ratio\}\}/g, input.aspect_ratio)
    .replace(/\{\{headline\}\}/g, input.headline || "");

  const aiGenOutput = await generateWithAI(prompt, "design");
  const aiResponse = aiGenOutput.content;

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(aiResponse);
  } catch {
    parsedOutput = {
      cover_title: input.headline || "Your Content",
      template_ref: `${input.theme}-template`,
      alt_text: `${input.theme} content template`,
      visual_elements: ["Text overlay", "Brand colors", "Logo placement"],
      color_palette_used: [(brandKit as any).primaryColor || "#8B5CF6"],
      font_suggestions: [(brandKit as any).fontFamily || "Inter"],
    };
  }

  const result = {
    cover_title: parsedOutput.cover_title || input.headline || "",
    template_ref: parsedOutput.template_ref || `${input.theme}-template`,
    alt_text: parsedOutput.alt_text || "",
    thumbnail_ref: parsedOutput.thumbnail_ref,
    visual_elements: parsedOutput.visual_elements || [],
    color_palette_used: parsedOutput.color_palette_used || [],
    font_suggestions: parsedOutput.font_suggestions || [],
  } as any;

  // Attach token usage information
  result.__tokens_in = aiGenOutput.tokens_in;
  result.__tokens_out = aiGenOutput.tokens_out;
  result.__provider = aiGenOutput.provider;
  result.__model = aiGenOutput.model;

  return result;
}

async function generateAdvisorInsights(
  brand_id: string,
): Promise<AdvisorOutput> {
  // Load recent post performance data
  const { data: posts } = await supabase
    .from("scheduled_content")
    .select("*")
    .eq("brand_id", brand_id)
    .gte(
      "scheduled_for",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    ) // Last 30 days
    .order("scheduled_for", { ascending: false });

  const template = await loadPromptTemplate("advisor", "v1.0", "en");

  const prompt = template
    .replace(/\{\{brand_id\}\}/g, brand_id)
    .replace(
      /\{\{recent_posts\}\}/g,
      JSON.stringify(posts?.slice(0, 20) || []),
    );

  const aiGenOutput = await generateWithAI(prompt, "advisor");
  const aiResponse = aiGenOutput.content;

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(aiResponse);
  } catch {
    // Fallback
    parsedOutput = {
      topics: [
        {
          title: "Continue Current Strategy",
          rationale: "Maintain consistent posting schedule and content themes.",
          confidence: 0.7,
        },
      ],
      best_times: [{ day: "Thursday", slot: "18:00", confidence: 0.8 }],
      format_mix: { reel: 0.4, carousel: 0.4, image: 0.2 },
      hashtags: ["#YourBrand", "#ContentMarketing"],
      keywords: ["growth", "engagement", "community"],
    };
  }

  const result = {
    topics: parsedOutput.topics || [],
    best_times: parsedOutput.best_times || [],
    format_mix: parsedOutput.format_mix || {},
    hashtags: parsedOutput.hashtags || [],
    keywords: parsedOutput.keywords || [],
    cached_at: new Date().toISOString(),
    valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  } as any;

  // Attach token usage information
  result.__tokens_in = aiGenOutput.tokens_in;
  result.__tokens_out = aiGenOutput.tokens_out;
  result.__provider = aiGenOutput.provider;
  result.__model = aiGenOutput.model;

  return result;
}

/**
 * Build the AI prompt for social content generation
 * 
 * Combines Brand Guide context, slot context, and platform-specific rules
 * to generate on-brand social content.
 */
function buildSocialContentPrompt(
  brandGuide: any,
  slotContext: {
    title: string;
    pillar: string;
    objective: string;
    hook: string;
    angle: string;
    cta: string;
    recommended_asset_role: string;
  },
  platform: SupportedPlatform
): string {
  const platformRules = PLATFORM_RULES[platform];

  // Build brand context section
  const brandContext = `
## Brand Context

**Brand Name:** ${brandGuide.brandName || "Brand"}
**Industry:** ${brandGuide.identity?.industry || brandGuide.identity?.businessType || "General Business"}
**Target Audience:** ${brandGuide.identity?.targetAudience || "General audience"}

### Voice & Tone
- **Tone Keywords:** ${(brandGuide.voiceAndTone?.tone || []).join(", ") || "Professional, Friendly"}
- **Voice Description:** ${brandGuide.voiceAndTone?.voiceDescription || "Confident and approachable"}
- **Friendliness Level:** ${brandGuide.voiceAndTone?.friendlinessLevel || 50}/100
- **Formality Level:** ${brandGuide.voiceAndTone?.formalityLevel || 50}/100

### Brand Values & Messaging
- **Core Values:** ${(brandGuide.identity?.values || []).join(", ") || "Quality, Trust, Innovation"}
- **Pain Points to Address:** ${(brandGuide.identity?.painPoints || []).join(", ") || "General audience challenges"}
- **Content Pillars:** ${(brandGuide.contentRules?.contentPillars || []).join(", ") || "Educational, Inspirational, Promotional"}

### Visual Identity (for design brief)
- **Brand Colors:** ${(brandGuide.visualIdentity?.colors || []).join(", ") || "#000000, #FFFFFF"}
- **Typography:** ${brandGuide.visualIdentity?.typography?.heading || "Modern sans-serif"}
- **Photography Style:** ${brandGuide.visualIdentity?.photographyStyle?.mustInclude?.join(", ") || "Professional, authentic imagery"}

### Content Rules
- **Brand Phrases to Use:** ${(brandGuide.contentRules?.brandPhrases || []).join(", ") || "N/A"}
- **Phrases to Avoid:** ${(brandGuide.voiceAndTone?.avoidPhrases || []).join(", ") || "N/A"}
- **Never Do:** ${(brandGuide.contentRules?.neverDo || []).join(", ") || "N/A"}
`;

  // Build slot context section
  const slotContextSection = `
## Content Slot Context

**Slot Title:** ${slotContext.title || "Social Post"}
**Content Pillar:** ${slotContext.pillar || "General"}
**Objective:** ${slotContext.objective || "Engagement"}
**Hook/Angle:** ${slotContext.hook || slotContext.angle || "Open-ended"}
**Call-to-Action:** ${slotContext.cta || "Engage with post"}
**Recommended Asset Type:** ${slotContext.recommended_asset_role || "Brand imagery"}
`;

  // Build platform-specific rules section
  const platformSection = `
## Platform: ${platform.replace("_", " ").toUpperCase()}

**Maximum Character Count:** ${platformRules.maxLength}
**Hashtag Guidance:** ${platformRules.hashtagGuidance}

### Best Practices:
${platformRules.bestPractices.map(bp => `- ${bp}`).join("\n")}
`;

  // Build Reel-specific instructions if needed
  const reelInstructions = platform === "instagram_reel" ? `
### Reel-Specific Requirements:
- Include a compelling opening hook (first 3 seconds are critical)
- Suggest a scene-by-scene script outline
- Recommend audio/music style that fits the brand
- Aim for 15-30 seconds duration for optimal engagement
- Caption should complement, not repeat, the video content
` : "";

  // Build the full prompt
  const prompt = `You are an expert social media content creator specializing in brand-aligned content for ${platform.replace("_", " ")}.

${brandContext}

${slotContextSection}

${platformSection}

${reelInstructions}

## Your Task

Generate a complete, ready-to-post social content package that:
1. Perfectly matches the brand voice and tone
2. Aligns with the content pillar and objective
3. Follows all platform-specific best practices
4. Includes a compelling design brief for the Creative Studio

## Output Format

Return your response as a valid JSON object with these fields:

{
  "primary_text": "The main caption/body text for the post. Should be engaging, on-brand, and include any relevant emojis.",
  "headline": "Optional headline (primarily useful for Facebook). Can be null for Instagram.",
  "suggested_hashtags": ["array", "of", "relevant", "hashtags"],
  "suggested_mentions": ["@relevant_accounts_if_any"],
  "cta_text": "Clear call-to-action text",
  "cta_link": "Optional link URL if applicable",
  "design_brief": "Detailed instructions for the Creative Studio to create the visual. Include color preferences, layout suggestions, text overlay placement, and style guidance based on the brand's visual identity.",
  "preferred_asset_role": "product|lifestyle|team|testimonial|educational|behind-the-scenes",
  "visual_style_notes": "Additional visual style guidance",
  "optimal_length": ${Math.min(platformRules.maxLength, 2200)},
  "best_posting_time": "Suggested posting time if known",
  "pillar": "${slotContext.pillar || "General"}",
  "objective": "${slotContext.objective || "Engagement"}"${platform === "instagram_reel" ? `,
  "reel_hook": "Opening hook text/concept for the first 3 seconds",
  "reel_script_outline": ["Scene 1: Description", "Scene 2: Description", "Scene 3: Description"],
  "reel_audio_suggestion": "Suggested audio/music style",
  "reel_duration_seconds": 30` : ""}
}

IMPORTANT:
- The primary_text MUST be complete, polished, and ready to post
- Do NOT include placeholder text like "[insert here]" or "TBD"
- Ensure all content aligns with the brand's voice and values
- The design_brief should be detailed enough for a designer to create a visual
- Stay within the platform's character limits
`;

  return prompt;
}

// ============================================================================
// CAPTION REFINEMENT ENDPOINT
// ============================================================================

/**
 * Zod schema for caption refinement request
 */
const RefineCaptionRequestSchema = z.object({
  brand_id: z.string().uuid("brand_id must be a valid UUID"),
  caption: z.string().min(1, "Caption is required"),
  platform: z.enum(["facebook", "instagram_feed", "instagram_reel"]),
  refinement_type: z.enum([
    "shorten",
    "expand",
    "more_fun",
    "more_professional",
    "add_emojis",
    "remove_emojis",
  ]),
  hashtags: z.array(z.string()).optional(),
});

type RefinementType = z.infer<typeof RefineCaptionRequestSchema>["refinement_type"];

/**
 * Build refinement prompt based on type
 */
function buildRefinementPrompt(
  brandGuide: any,
  caption: string,
  platform: SupportedPlatform,
  refinementType: RefinementType,
  hashtags?: string[]
): string {
  const platformRules = PLATFORM_RULES[platform];
  
  // Brand voice context
  const voiceContext = `
Brand Voice:
- Tone: ${(brandGuide.voiceAndTone?.tone || []).join(", ") || "Professional, Friendly"}
- Friendliness Level: ${brandGuide.voiceAndTone?.friendlinessLevel || 50}/100
- Formality Level: ${brandGuide.voiceAndTone?.formalityLevel || 50}/100
- Avoid phrases: ${(brandGuide.voiceAndTone?.avoidPhrases || []).join(", ") || "None specified"}
`;

  const refinementInstructions: Record<RefinementType, string> = {
    shorten: `
TASK: Shorten this caption while keeping the core message and brand voice intact.
- Aim for 30-50% shorter
- Preserve the main CTA and key points
- Keep it punchy and engaging
- Maintain the same tone
- Maximum ${Math.min(platformRules.maxLength, 300)} characters
`,
    expand: `
TASK: Expand this caption with more detail while maintaining brand voice.
- Add more context, storytelling, or value
- Keep the same tone and style
- Don't exceed ${platformRules.maxLength} characters
- Add personality without being verbose
- Include a stronger call-to-action if appropriate
`,
    more_fun: `
TASK: Make this caption more fun and playful while staying on-brand.
- Add humor, wit, or playfulness
- Use more casual language
- Add relevant emojis if appropriate
- Keep the core message intact
- Maintain professionalism - fun doesn't mean unprofessional
`,
    more_professional: `
TASK: Make this caption more professional and polished.
- Use more formal language
- Remove slang or overly casual expressions
- Focus on value and credibility
- Keep it authoritative but not stiff
- Remove excessive emojis
`,
    add_emojis: `
TASK: Add appropriate emojis to this caption.
- Weave emojis naturally into the text
- Don't overdo it (3-5 emojis max for most captions)
- Use emojis that match the content and brand tone
- Place emojis strategically (line breaks, key points)
- Keep the exact wording intact, just add emojis
`,
    remove_emojis: `
TASK: Remove all emojis from this caption.
- Strip all emoji characters
- Ensure punctuation and spacing remain correct
- Keep the text exactly the same otherwise
- Make sure sentences still flow naturally
`,
  };

  return `You are refining a social media caption for ${platform.replace("_", " ")}.

${voiceContext}

Platform: ${platform.replace("_", " ").toUpperCase()}
Max Length: ${platformRules.maxLength} characters

ORIGINAL CAPTION:
"""
${caption}
"""
${hashtags && hashtags.length > 0 ? `\nHASHTAGS: ${hashtags.join(" ")}` : ""}

${refinementInstructions[refinementType]}

Return ONLY the refined caption text, no explanations or quotes. The caption should be ready to post.`;
}

/**
 * POST /api/agents/refine-caption
 * Refine a caption with AI (shorten, expand, add/remove emojis, change tone)
 */
router.post("/refine-caption", async (req, res) => {
  const requestId = uuidv4();
  
  try {
    // Validate request
    const parseResult = RefineCaptionRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Invalid refinement request",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { validationErrors: parseResult.error.errors }
      );
    }

    const { brand_id, caption, platform, refinement_type, hashtags } = parseResult.data;

    // Load brand guide for voice context
    const brandGuide = await getCurrentBrandGuide(brand_id);
    if (!brandGuide) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Brand guide not found. Please complete brand setup first.",
        HTTP_STATUS.NOT_FOUND,
        "warning"
      );
    }

    // Build and execute refinement prompt
    const prompt = buildRefinementPrompt(
      brandGuide,
      caption,
      platform,
      refinement_type,
      hashtags
    );

    const aiOutput = await generateWithAI(prompt, "doc");
    
    // Clean up the response - remove any wrapping quotes or explanations
    let refinedCaption = aiOutput.content.trim();
    
    // Remove surrounding quotes if present
    if ((refinedCaption.startsWith('"') && refinedCaption.endsWith('"')) ||
        (refinedCaption.startsWith("'") && refinedCaption.endsWith("'"))) {
      refinedCaption = refinedCaption.slice(1, -1);
    }

    // Log the refinement
    console.log(`[refine-caption] ${requestId} | ${refinement_type} | ${brand_id} | ${platform} | ${caption.length} → ${refinedCaption.length} chars`);

    res.json({
      success: true,
      refined_caption: refinedCaption,
      refinement_type,
      original_length: caption.length,
      refined_length: refinedCaption.length,
      tokens_used: {
        input: aiOutput.tokens_in,
        output: aiOutput.tokens_out,
      },
    });
  } catch (error) {
    console.error(`[refine-caption] ${requestId} | Error:`, error);
    
    if (error instanceof AppError) {
      throw error;
    }

    // ✅ Handle missing AI provider with user-friendly error
    if (error instanceof NoAIProviderError) {
      throw new AppError(
        ErrorCode.NO_AI_PROVIDER_CONFIGURED,
        error.message,
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        "warning",
        { requestId, code: "NO_AI_PROVIDER_CONFIGURED" },
        "Configure OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment to enable AI features.",
      );
    }

    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to refine caption. Please try again.",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
});

export default router;
