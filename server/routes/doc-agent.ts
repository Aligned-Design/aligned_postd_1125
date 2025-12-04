/**
 * Doc Agent API Route (Legacy Endpoint)
 * 
 * Handles requests to generate on-brand text content (captions, emails, blogs, ads, etc.).
 * 
 * @endpoint POST /api/ai/doc (legacy)
 * @canonical POST /api/agents/generate/doc (use this for new integrations)
 * 
 * TODO: Migrate remaining usage to /api/agents/generate/doc and deprecate this endpoint.
 * 
 * @response Returns `AiDocGenerationResponse` directly (not wrapped in { success: true } envelope).
 * This is intentional to maintain backward compatibility with existing clients.
 * The response includes: variants[], brandContext, request, metadata, warnings, status.
 */

import { RequestHandler } from "express";
import { generateWithAI } from "../workers/ai-generation";
import { buildDocSystemPrompt, buildDocUserPrompt, buildDocRetryPrompt } from "../lib/ai/docPrompt";
import { calculateBrandFidelityScore } from "../lib/ai/brandFidelity";
import { getBrandProfile } from "../lib/brand-profile";
import { getCurrentBrandGuide } from "../lib/brand-guide-service";
import type { BrandGuide } from "@shared/brand-guide";
import { getPrioritizedImages } from "../lib/image-sourcing";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { supabase } from "../lib/supabase";
import { assertBrandAccess } from "../lib/brand-access";
import { AiDocGenerationRequestSchema } from "@shared/validation-schemas";
import type {
  AiAgentResponseStatus,
  AiAgentWarning,
  AiDocGenerationRequest,
  AiDocGenerationResponse,
  AiDocVariant,
} from "@shared/aiContent";
import type { BrandProfile } from "@shared/advisor";
import {
  buildBrandContextPayload,
  mergeBrandProfileWithOverrides,
} from "../lib/ai/agent-context";
import {
  broadcastAgentCompleted,
  broadcastAgentFailed,
} from "../lib/event-broadcaster";
import { StrategyBriefStorage, ContentPackageStorage } from "../lib/collaboration-storage";
import { createContentPackage } from "@shared/collaboration-artifacts";

// Simple logger for telemetry
function logDocAgentCall(provider: string, latencyMs: number, avgBFS: number, retryAttempted: boolean, variantCount: number, error?: string) {
  console.log(`[Copywriter] provider=${provider} latency=${latencyMs}ms avgBFS=${avgBFS.toFixed(2)} retry=${retryAttempted} variants=${variantCount}${error ? ` error=${error}` : ""}`);
}

/**
 * Parse JSON variants from AI response
 */
function parseDocVariants(content: string): AiDocVariant[] {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content.trim();
    
    const parsed = JSON.parse(jsonString);
    
    if (!Array.isArray(parsed)) {
      throw new Error("Expected array of variants");
    }

    // Validate and normalize variants
    return parsed.map((item: any, idx: number) => ({
      id: item.id || `variant-${idx + 1}`,
      label: item.label || `Option ${String.fromCharCode(65 + idx)}`, // A, B, C
      content: item.content || "",
      tone: item.tone,
      platform: item.platform,
      wordCount: item.wordCount || (item.content ? item.content.split(/\s+/).length : 0),
      brandFidelityScore: 0, // Will be calculated below
      complianceTags: [],
      status: "draft" as const,
    }));
  } catch (error) {
    console.error("Failed to parse doc variants:", error);
    // Return a fallback variant
    return [{
      id: "parse-error",
      label: "Parse Error",
      content: "The AI response could not be parsed. Please try again.",
      brandFidelityScore: 0,
      complianceTags: ["parse_error"],
      status: "draft" as const,
    }];
  }
}

const LOW_BFS_THRESHOLD = 0.8;

function calculateAverageBFS(variants: AiDocVariant[]): number {
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
  variants: AiDocVariant[],
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

function buildDocWarnings({
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
      message: `Average brand fidelity is ${Math.round(avgBFS * 100)}%. Please review before publishing.`,
      severity: "warning",
    });
  }

  if (Object.keys(complianceTagCounts).length > 0) {
    warnings.push({
      code: "compliance_flags",
      message: "Some variants triggered compliance flags.",
      severity: "warning",
      details: { tags: complianceTagCounts },
    });
  }

  if (parseWarning) {
    warnings.push({
      code: "partial_parse",
      message: "The AI response was partially parsed. A fallback variant is shown.",
      severity: "warning",
    });
  }

  if (retryAttempted) {
    warnings.push({
      code: "retry_attempted",
      message: "Initial draft needed a retry to reach acceptable fidelity.",
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

function buildDocAgentResponse(
  brandId: string,
  brand: BrandProfile,
  request: AiDocGenerationRequest,
  variants: AiDocVariant[],
  provider: "openai" | "claude",
  latencyMs: number,
  retryAttempted: boolean,
  avgBFS: number,
): AiDocGenerationResponse {
  const complianceTagCounts = aggregateComplianceTags(variants);
  const parseWarning = variants.some((variant) => variant.id === "parse-error");
  const warnings = buildDocWarnings({
    avgBFS,
    complianceTagCounts,
    retryAttempted,
    parseWarning,
  });
  const status = determineStatus(variants.length, warnings);

  const response: AiDocGenerationResponse = {
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
 * Main doc agent endpoint handler
 */
export const generateDocContent: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  let retryAttempted = false;
      let provider: "openai" | "claude" = process.env.AI_PROVIDER === "anthropic" ? "claude" : "openai";

  try {
    // Validate request body with Zod
    const requestBody = AiDocGenerationRequestSchema.parse(req.body);
    const { brandId, topic, platform, contentType, tone, length, callToAction, additionalContext, requestId, strategyBriefId, contentPackageId } = requestBody;

    // ✅ SECURITY: Verify user has access to this brand and workspace
    await assertBrandAccess(req, brandId, true, true);

    // ✅ COLLABORATION: Read StrategyBrief if provided
    let strategyBrief = null;
    if (strategyBriefId) {
      strategyBrief = await StrategyBriefStorage.getLatest(brandId);
      if (strategyBrief && strategyBrief.id !== strategyBriefId) {
        // If specific ID requested but latest is different, try to get by ID
        // (For now, we only have getLatest - can extend later)
        // Note: StrategyBrief ID mismatch - using latest instead of requested ID
        // This is expected behavior when only getLatest() is available
      }
    }

    // ✅ COLLABORATION: Read existing ContentPackage if provided
    let contentPackage = null;
    if (contentPackageId) {
      contentPackage = await ContentPackageStorage.getById(contentPackageId);
      if (!contentPackage) {
        console.warn(`[Copywriter] ContentPackage ${contentPackageId} not found, creating new`);
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

    // Get brand profile and apply optional overrides from the request
    const brand = mergeBrandProfileWithOverrides(
      await getBrandProfile(brandId),
      requestBody.brandContext,
    );

    // Get available images (prioritized: brand assets → stock images)
    const availableImages = await getPrioritizedImages(brandId, 5); // Get up to 5 images for context

    // ✅ COLLABORATION: Enhance prompt with BrandGuide and StrategyBrief
    const systemPrompt = buildDocSystemPrompt();
    const userPrompt = buildDocUserPrompt({
      brand,
      brandGuide, // Pass BrandGuide to prompt builder (source of truth)
      request: requestBody as AiDocGenerationRequest,
      availableImages: availableImages.map(img => ({
        url: img.url,
        source: img.source,
        title: img.metadata?.alt || undefined,
        alt: img.metadata?.alt || undefined,
      })),
      strategyBrief, // Pass StrategyBrief to prompt builder
    });

    // Combine system and user prompts
    const fullPrompt = `${systemPrompt}\n\n## User Request\n\n${userPrompt}`;

    // Generate content with retry logic
    let variants: AiDocVariant[] = [];
    let rawResponse = "";
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await generateWithAI(fullPrompt, "doc", provider);
        rawResponse = result.content;
        variants = parseDocVariants(result.content);

        // Calculate BFS for each variant
        for (const variant of variants) {
          const bfsResult = calculateBrandFidelityScore(variant.content, brand);
          variant.brandFidelityScore = bfsResult.brandFidelityScore;
          variant.complianceTags = bfsResult.complianceTags;
        }

        // Calculate average BFS
        const avgBFS = calculateAverageBFS(variants);

        // If average BFS is low and we haven't retried yet, retry with stricter prompt
        if (avgBFS < LOW_BFS_THRESHOLD && attempt < maxAttempts) {
          retryAttempted = true;
          const retryPrompt = buildDocRetryPrompt(
            { brand, request: requestBody as AiDocGenerationRequest },
            rawResponse
          );
          const retryFullPrompt = `${systemPrompt}\n\n${retryPrompt}`;
          
          // Wait a bit before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 250 * attempt));
          
          const retryResult = await generateWithAI(retryFullPrompt, "doc", provider);
          rawResponse = retryResult.content;
          variants = parseDocVariants(retryResult.content);
          
          // Recalculate BFS after retry
          for (const variant of variants) {
            const bfsResult = calculateBrandFidelityScore(variant.content, brand);
            variant.brandFidelityScore = bfsResult.brandFidelityScore;
            variant.complianceTags = bfsResult.complianceTags;
          }
          
          const retryAvgBFS = calculateAverageBFS(variants);
          
          const latencyMs = Date.now() - startTime;

          const response = buildDocAgentResponse(
            brandId,
            brand,
            requestBody as AiDocGenerationRequest,
            variants,
            provider,
            latencyMs,
            true,
            retryAvgBFS,
          );

          // ✅ COLLABORATION: Save ContentPackage if collaboration context exists
          if (requestId || contentPackageId) {
            try {
              const selectedVariant = variants[0];
              const newContentPackage = createContentPackage({
                id: contentPackageId || `cp_${Date.now()}`,
                brandId,
                contentId: `content_${Date.now()}`,
                platform,
                status: "draft",
                copy: {
                  headline: selectedVariant.content.split('\n')[0] || selectedVariant.content.substring(0, 100),
                  body: selectedVariant.content,
                  callToAction: callToAction || "",
                  tone: selectedVariant.tone || tone || "professional",
                  keywords: [],
                  estimatedReadTime: Math.ceil((selectedVariant.wordCount || 0) / 200),
                },
                requestId: requestId || `req_${Date.now()}`,
                createdBy: "copywriter",
                collaborationLog: [{
                  agent: "copywriter",
                  action: "content_generated",
                  timestamp: new Date().toISOString(),
                  notes: `Generated ${variants.length} variants (retry) for ${contentType} on ${platform}`,
                }],
              });

              if (contentPackage) {
                newContentPackage.id = contentPackage.id;
                newContentPackage.copy = { ...contentPackage.copy, ...newContentPackage.copy };
                newContentPackage.collaborationLog = [...(contentPackage.collaborationLog || []), ...newContentPackage.collaborationLog];
              }

              await ContentPackageStorage.save(newContentPackage);
              console.log(`[Copywriter] Saved ContentPackage ${newContentPackage.id} (retry)`);
            } catch (collabError) {
              console.warn(`[Copywriter] Failed to save ContentPackage:`, collabError);
            }
          }

          logDocAgentCall(provider, latencyMs, retryAvgBFS, true, variants.length);
          
          // Broadcast agent completion
          const userId = (req as any).user?.id || (req as any).userId || "unknown";
          broadcastAgentCompleted({
            agent: "doc",
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

        const response = buildDocAgentResponse(
          brandId,
          brand,
          requestBody as AiDocGenerationRequest,
          variants,
          provider,
          latencyMs,
          retryAttempted,
          avgBFS,
        );

        logDocAgentCall(provider, latencyMs, avgBFS, retryAttempted, variants.length);
        
        // Broadcast agent completion
        const userId = (req as any).user?.id || (req as any).userId || "unknown";
        broadcastAgentCompleted({
          agent: "doc",
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
        console.log(`Attempt ${attempt} failed, trying provider: ${provider}`);
      }
    }

    // Should never reach here
    throw new Error("Failed to generate content after all attempts");
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    logDocAgentCall(provider, latencyMs, 0, retryAttempted, 0, errorMessage);

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
      agent: "doc",
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

