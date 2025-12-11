/**
 * Design Agent API Route
 * 
 * Handles requests to generate on-brand visual concepts (prompts, descriptions, layout suggestions).
 * 
 * @response Returns `AiDesignGenerationResponse` directly (not wrapped in { success: true } envelope).
 * This is intentional to maintain backward compatibility with existing clients.
 * The response includes: variants[], brandContext, request, metadata, warnings, status.
 */

import { RequestHandler } from "express";
import { generateWithAI } from "../workers/ai-generation";
import { buildDesignSystemPrompt, buildDesignUserPrompt, buildDesignRetryPrompt } from "../lib/ai/designPrompt";
import { calculateBrandFidelityScore } from "../lib/ai/brandFidelity";
import { getBrandContext } from "../lib/brand-context";
import { getPrioritizedImages } from "../lib/image-sourcing";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { supabase } from "../lib/supabase";
import { assertBrandAccess } from "../lib/brand-access";
import { AiDesignGenerationRequestSchema } from "@shared/validation-schemas";
import type {
  AiAgentResponseStatus,
  AiAgentWarning,
  AiDesignGenerationRequest,
  AiDesignGenerationResponse,
  AiDesignVariant,
} from "@shared/aiContent";
import type { BrandContext } from "@shared/advisor";
import {
  buildBrandContextPayload,
  mergeBrandContextWithOverrides,
} from "../lib/ai/agent-context";
import {
  broadcastAgentCompleted,
  broadcastAgentFailed,
} from "../lib/event-broadcaster";
import { StrategyBriefStorage, ContentPackageStorage, BrandHistoryStorage, PerformanceLogStorage } from "../lib/collaboration-storage";
import { getBrandVisualIdentity } from "../lib/brand-visual-identity";
import { getBrandContextPack } from "../lib/brand-brain-service";
import { getCurrentBrandGuide } from "../lib/brand-guide-service";
import { mapVariantToVisualEntry } from "../lib/collaboration-utils";
import { logger } from "../lib/logger";

// Simple logger for telemetry
function logDesignAgentCall(provider: string, latencyMs: number, avgBFS: number, retryAttempted: boolean, variantCount: number, error?: string) {
  if (error) {
    logger.error("Design agent call failed", new Error(error), {
      provider,
      latencyMs,
      avgBFS,
      retryAttempted,
      variantCount,
    });
  } else {
    logger.info("Design agent call completed", {
      provider,
      latencyMs,
      avgBFS,
      retryAttempted,
      variantCount,
    });
  }
}

/**
 * Parse JSON variants from AI response
 */
function parseDesignVariants(content: string): AiDesignVariant[] {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content.trim();
    
    const parsed = JSON.parse(jsonString);
    
    if (!Array.isArray(parsed)) {
      throw new Error("Expected array of variants");
    }

    // Validate and normalize variants (support both old and new format)
    return parsed.map((item: any, idx: number) => ({
      id: item.id || `variant-${idx + 1}`,
      label: item.label || `Concept ${String.fromCharCode(65 + idx)}`, // A, B, C
      prompt: item.prompt || item.imagePrompt || "", // Support both old and new field names
      description: item.description,
      aspectRatio: item.aspectRatio || item.metadata?.aspectRatio,
      useCase: item.useCase || item.format,
      brandFidelityScore: 0, // Will be calculated below
      complianceTags: [],
      status: "draft" as const,
      // Enhanced fields (if present)
      type: item.type,
      format: item.format,
      templateRef: item.templateRef,
      metadata: item.metadata,
      performanceInsights: item.performanceInsights,
    }));
  } catch (error) {
    logger.error("Failed to parse design variants", error instanceof Error ? error : new Error(String(error)));
    // Return a fallback variant
    return [{
      id: "parse-error",
      label: "Parse Error",
      prompt: "The AI response could not be parsed. Please try again.",
      description: "Parse error occurred",
      brandFidelityScore: 0,
      complianceTags: ["parse_error"],
      status: "draft" as const,
    }];
  }
}

const LOW_BFS_THRESHOLD = 0.8;

function calculateAverageBFS(variants: AiDesignVariant[]): number {
  if (variants.length === 0) {
    return 0;
  }
  const total = variants.reduce(
    (sum, variant) => sum + (variant.brandFidelityScore || 0),
    0,
  );
  return total / variants.length;
}

function aggregateComplianceTags(
  variants: AiDesignVariant[],
): Record<string, number> {
  return variants.reduce((acc, variant) => {
    if (!variant.complianceTags) {
      return acc;
    }
    for (const tag of variant.complianceTags) {
      acc[tag] = (acc[tag] ?? 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
}

function buildDesignWarnings({
  avgBFS,
  complianceTagCounts,
  retryAttempted,
  parseWarning,
}: {
  avgBFS: number;
  complianceTagCounts: Record<string, number>;
  retryAttempted: boolean;
  parseWarning: boolean;
}): AiAgentWarning[] {
  const warnings: AiAgentWarning[] = [];

  if (avgBFS < LOW_BFS_THRESHOLD) {
    warnings.push({
      code: "low_bfs",
      message: `Average brand fidelity is ${Math.round(avgBFS * 100)}%. Please review the concepts.`,
      severity: "warning",
    });
  }

  if (Object.keys(complianceTagCounts).length > 0) {
    warnings.push({
      code: "compliance_flags",
      message: "Some concepts triggered compliance flags.",
      severity: "warning",
      details: { tags: complianceTagCounts },
    });
  }

  if (parseWarning) {
    warnings.push({
      code: "partial_parse",
      message: "The AI response was partially parsed. A fallback concept is shown.",
      severity: "warning",
    });
  }

  if (retryAttempted) {
    warnings.push({
      code: "retry_attempted",
      message: "Initial concepts required a retry to hit brand fidelity.",
      severity: "info",
    });
  }

  return warnings;
}

function determineStatus(
  variantCount: number,
  warnings: AiAgentWarning[],
): AiAgentResponseStatus {
  if (variantCount === 0) {
    return "failure";
  }

  const hasBlockingWarning = warnings.some(
    (warning) => warning.severity === "warning" || warning.severity === "critical",
  );

  return hasBlockingWarning ? "partial_success" : "success";
}

function buildDesignAgentResponse(
  brandId: string,
  brand: BrandContext,
  request: AiDesignGenerationRequest,
  variants: AiDesignVariant[],
  provider: "openai" | "claude",
  latencyMs: number,
  retryAttempted: boolean,
  avgBFS: number,
): AiDesignGenerationResponse {
  const complianceTagCounts = aggregateComplianceTags(variants);
  const parseWarning = variants.some((variant) => variant.id === "parse-error");
  const warnings = buildDesignWarnings({
    avgBFS,
    complianceTagCounts,
    retryAttempted,
    parseWarning,
  });
  const status = determineStatus(variants.length, warnings);

  const response: AiDesignGenerationResponse = {
    variants,
    brandContext: buildBrandContextPayload(brandId, brand),
    request,
    metadata: {
      provider,
      latencyMs,
      retryAttempted,
      status: status === "ok" ? "success" : status === "partial" ? "partial_success" : status === "error" ? "failure" : (status as "success" | "partial_success" | "failure"),
      averageBrandFidelityScore: avgBFS,
      complianceTagCounts,
    },
  };

  if (warnings.length > 0) {
    response.warnings = warnings;
  }

  return response;
}

/**
 * Main design agent endpoint handler
 */
export const generateDesignContent: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  let retryAttempted = false;
      let provider: "openai" | "claude" = process.env.AI_PROVIDER === "anthropic" ? "claude" : "openai";

  try {
    // Validate request body with Zod
    const requestBody = AiDesignGenerationRequestSchema.parse(req.body);
    // ✅ Use validated brandId from middleware (checks params, query, body)
    const brandId = (req as any).validatedBrandId ?? requestBody.brandId;
    const { campaignName, platform, format, tone, visualStyle, additionalContext, requestId, strategyBriefId, contentPackageId } = requestBody;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "brandId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // ✅ COLLABORATION: Read StrategyBrief if provided
    let strategyBrief = null;
    if (strategyBriefId) {
      strategyBrief = await StrategyBriefStorage.getLatest(brandId);
      if (strategyBrief && strategyBrief.id !== strategyBriefId) {
        logger.info("StrategyBrief ID mismatch, using latest", {
          requestedId: strategyBriefId,
          latestId: strategyBrief.id,
          brandId,
        });
      }
    }

    // ✅ COLLABORATION: Read ContentPackage from Copywriter if provided
    let contentPackage = null;
    if (contentPackageId) {
      contentPackage = await ContentPackageStorage.getById(contentPackageId);
      if (!contentPackage) {
        logger.warn("ContentPackage not found", {
          contentPackageId,
          brandId,
        });
      }
    }

    // Brand access already verified by assertBrandAccess above

    // ✅ BRAND GUIDE: Load Brand Guide (source of truth)
    const brandGuide = await getCurrentBrandGuide(brandId);

    // Check if brand guide has meaningful content
    const hasBrandGuide = brandGuide && !!(
      brandGuide.voiceAndTone?.tone?.length ||
      brandGuide.voiceAndTone?.voiceDescription ||
      brandGuide.visualIdentity?.colors?.length ||
      brandGuide.identity?.businessType
    );

    if (!hasBrandGuide) {
      throw new AppError(
        ErrorCode.NO_BRAND_GUIDE,
        "This brand doesn't have a Brand Guide yet. Please create one first.",
        HTTP_STATUS.BAD_REQUEST,
        "info",
        {
          suggestion: "Create a Brand Guide in Settings to unlock AI content generation.",
        }
      );
    }

    // ✅ PERFORMANCE INSIGHTS: Read BrandHistory for visual performance insights
    const brandHistory = await BrandHistoryStorage.get(brandId);

    // ✅ PERFORMANCE INSIGHTS: Read PerformanceLog for recent visual performance
    const performanceLog = await PerformanceLogStorage.getLatest(brandId);

    // ✅ BRAND VISUAL IDENTITY: Get actual brand tokens (colors, fonts, spacing)
    const brandVisualIdentity = await getBrandVisualIdentity(brandId);

    // Get brand context and apply optional overrides
    const brand = mergeBrandContextWithOverrides(
      await getBrandContext(brandId),
      requestBody.brandContext,
    );

    // Get available images (prioritized: brand assets → stock images)
    const availableImages = await getPrioritizedImages(brandId, 5); // Get up to 5 images for context

    // ✅ MVP3: Get host metadata from Brand Brain for host-aware prompts
    const brandContextPack = await getBrandContextPack(brandId);
    const hostMetadata = brandContextPack?.host;

    // ✅ COLLABORATION: Build prompts with BrandGuide + collaboration context + performance insights
    const systemPrompt = buildDesignSystemPrompt();
    const userPrompt = buildDesignUserPrompt({
      brand,
      brandGuide, // Pass BrandGuide to prompt builder (source of truth)
      request: requestBody as AiDesignGenerationRequest,
      strategyBrief,
      contentPackage,
      brandHistory,
      performanceLog,
      brandVisualIdentity,
      availableImages: availableImages.map(img => ({
        url: img.url,
        source: img.source,
        title: img.metadata?.alt || undefined,
        alt: img.metadata?.alt || undefined,
      })),
      host: hostMetadata, // ✅ MVP3: Pass host for host-aware prompts
    });

    // Combine system and user prompts
    const fullPrompt = `${systemPrompt}\n\n## User Request\n\n${userPrompt}`;

    // Generate content with retry logic
    let variants: AiDesignVariant[] = [];
    let rawResponse = "";
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await generateWithAI(fullPrompt, "design", provider);
        rawResponse = result.content;
        variants = parseDesignVariants(result.content);

        // Calculate BFS for each variant (based on prompt + description)
        for (const variant of variants) {
          const combinedText = `${variant.prompt} ${variant.description || ""}`;
          const bfsResult = calculateBrandFidelityScore(combinedText, brand);
          variant.brandFidelityScore = bfsResult.brandFidelityScore;
          variant.complianceTags = bfsResult.complianceTags;
        }

        // Calculate average BFS
        const avgBFS = calculateAverageBFS(variants);

        // If average BFS is low and we haven't retried yet, retry with stricter prompt
        if (avgBFS < LOW_BFS_THRESHOLD && attempt < maxAttempts) {
          retryAttempted = true;
          const retryPrompt = buildDesignRetryPrompt(
            { brand, request: requestBody as AiDesignGenerationRequest },
            rawResponse
          );
          const retryFullPrompt = `${systemPrompt}\n\n${retryPrompt}`;
          
          // Wait a bit before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 250 * attempt));
          
          const retryResult = await generateWithAI(retryFullPrompt, "design", provider);
          rawResponse = retryResult.content;
          variants = parseDesignVariants(retryResult.content);
          
          // Recalculate BFS after retry
          for (const variant of variants) {
            const combinedText = `${variant.prompt} ${variant.description || ""}`;
            const bfsResult = calculateBrandFidelityScore(combinedText, brand);
            variant.brandFidelityScore = bfsResult.brandFidelityScore;
            variant.complianceTags = bfsResult.complianceTags;
          }
          
          const retryAvgBFS = calculateAverageBFS(variants);
          
          const latencyMs = Date.now() - startTime;

          const response = buildDesignAgentResponse(
            brandId,
            brand,
            requestBody as AiDesignGenerationRequest,
            variants,
            provider,
            latencyMs,
            true,
            retryAvgBFS,
          );

          // ✅ COLLABORATION: Update ContentPackage with design context and visuals (retry path)
          if ((requestId || contentPackageId) && contentPackage) {
            try {
              const selectedVariant = variants[0];
              contentPackage.designContext = {
                suggestedLayout: selectedVariant.useCase || format,
                componentPrecedence: ["headline", "visual", "cta"],
                colorTheme: visualStyle || "brand-primary",
                motionConsiderations: [],
                accessibilityNotes: [],
              };

              // ✅ VISUALS: Convert variants to visuals array using normalized helper (retry path)
              if (!contentPackage.visuals) {
                contentPackage.visuals = [];
              }
              
              // ✅ PHASE 4: Use mapVariantToVisualEntry helper for consistent format
              variants.forEach((variant: AiDesignVariant) => {
                const visual = mapVariantToVisualEntry(variant, {
                  source: "design_agent_make_on_brand",
                  selected: false, // Not selected yet - user will select via VariantSelector
                  designFormat: format,
                  platform: platform,
                });
                contentPackage.visuals.push(visual);
              });

              contentPackage.collaborationLog.push({
                agent: "creative",
                action: "design_concept_generated",
                timestamp: new Date().toISOString(),
                notes: `Generated ${variants.length} design concepts with visuals (retry) for ${format} on ${platform}`,
              });
              contentPackage.updatedAt = new Date().toISOString();
              await ContentPackageStorage.save(contentPackage);
              logger.info("Updated ContentPackage with visuals (retry)", {
                contentPackageId: contentPackage.id,
                brandId,
              });
            } catch (collabError) {
              logger.warn("Failed to update ContentPackage", {
                contentPackageId: contentPackage.id,
                brandId,
                error: collabError instanceof Error ? collabError.message : String(collabError),
              });
            }
          }

          logDesignAgentCall(provider, latencyMs, retryAvgBFS, true, variants.length);
          
          // Broadcast agent completion
          const userId = (req as any).user?.id || (req as any).userId || "unknown";
          broadcastAgentCompleted({
            agent: "design",
            brandId,
            userId,
            status: response.status === "ok" ? "success" : response.status === "partial" ? "partial_success" : response.status === "error" ? "failure" : (response.status as "success" | "partial_success" | "failure"),
            variantCount: variants.length,
            avgBFS: retryAvgBFS,
            warnings: response.warnings,
            latencyMs,
          });
          
          return res.json(response);
        }

        // Success - return response
        const latencyMs = Date.now() - startTime;

        const response = buildDesignAgentResponse(
          brandId,
          brand,
          requestBody as AiDesignGenerationRequest,
          variants,
          provider,
          latencyMs,
          retryAttempted,
          avgBFS,
        );

        // ✅ COLLABORATION: Update ContentPackage with design context and visuals if collaboration context exists
        if ((requestId || contentPackageId) && contentPackage) {
          try {
            const selectedVariant = variants[0];
            contentPackage.designContext = {
              suggestedLayout: selectedVariant.useCase || format,
              componentPrecedence: ["headline", "visual", "cta"],
              colorTheme: visualStyle || "brand-primary",
              motionConsiderations: [],
              accessibilityNotes: [],
            };

            // ✅ VISUALS: Convert variants to visuals array using normalized helper
            if (!contentPackage.visuals) {
              contentPackage.visuals = [];
            }
            
            // ✅ PHASE 4: Use mapVariantToVisualEntry helper for consistent format
            // Add all variants as visuals (non-selected, will be marked selected when user picks one)
            variants.forEach((variant: AiDesignVariant) => {
              const visual = mapVariantToVisualEntry(variant, {
                source: "design_agent_make_on_brand",
                selected: false, // Not selected yet - user will select via VariantSelector
                designFormat: format,
                platform: platform,
              });
              contentPackage.visuals.push(visual);
            });

            contentPackage.collaborationLog.push({
              agent: "creative",
              action: "design_concept_generated",
              timestamp: new Date().toISOString(),
              notes: `Generated ${variants.length} design concepts with visuals for ${format} on ${platform}`,
            });
            contentPackage.updatedAt = new Date().toISOString();
            await ContentPackageStorage.save(contentPackage);
            logger.info("Updated ContentPackage with design context", {
              contentPackageId: contentPackage.id,
              visualsCount: contentPackage.visuals.length,
              brandId,
            });
          } catch (collabError) {
            logger.warn("Failed to update ContentPackage", {
              contentPackageId: contentPackage.id,
              brandId,
              error: collabError instanceof Error ? collabError.message : String(collabError),
            });
          }
        }

        logDesignAgentCall(provider, latencyMs, avgBFS, retryAttempted, variants.length);
        
        // Broadcast agent completion
        const userId = (req as any).user?.id || (req as any).userId || "unknown";
        broadcastAgentCompleted({
          agent: "design",
          brandId,
          userId,
          status: response.status === "ok" ? "success" : response.status === "partial" ? "partial_success" : response.status === "error" ? "failure" : (response.status as "success" | "partial_success" | "failure"),
          variantCount: variants.length,
          avgBFS,
          warnings: response.warnings,
          latencyMs,
        });
        
        return res.json(response);
      } catch (error) {
        // If this is the last attempt, throw the error
        if (attempt === maxAttempts) {
          throw error;
        }
        
        // Try fallback provider
            provider = provider === "openai" ? "claude" : "openai";
        logger.info("Design generation attempt failed, trying alternative provider", {
          attempt,
          provider,
          brandId,
        });
      }
    }

    // Should never reach here
    throw new Error("Failed to generate content after all attempts");
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    logDesignAgentCall(provider, latencyMs, 0, retryAttempted, 0, errorMessage);

    // Classify error types
    if (error instanceof AppError) {
      throw error;
    }

    // Network/provider errors
    if (errorMessage.includes("API") || errorMessage.includes("network") || errorMessage.includes("timeout")) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "AI provider error",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        { originalError: errorMessage },
        "The AI service is temporarily unavailable. Please try again in a moment."
      );
    }

    // Invalid request
    if (errorMessage.includes("Missing") || errorMessage.includes("Invalid")) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        errorMessage,
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        undefined,
        "Please check your request and try again"
      );
    }

    // Generic error
    const userId = (req as any).user?.id || (req as any).userId || "unknown";
    const brandId = (req as any).body?.brandId || "unknown";
    
    // Broadcast agent failure
    broadcastAgentFailed({
      agent: "design",
      brandId,
      userId,
      status: "failure",
      error: errorMessage,
      latencyMs,
    });
    
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to generate content",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      { originalError: errorMessage },
      "We couldn't generate content right now. Please try again later."
    );
  }
};

