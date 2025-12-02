/**
 * Advisor API Route
 * 
 * Handles requests to the AI Advisor endpoint for generating marketing insights.
 * 
 * @response Returns `AdvisorResponse` directly (not wrapped in { success: true } envelope).
 * This is intentional to maintain backward compatibility with existing clients.
 * The response includes: insights[], brandContext, request, metadata, warnings, compliance, rawModelInfo.
 */

import { RequestHandler } from "express";
import { z } from "zod";
import { generateWithAI } from "../workers/ai-generation";
import { buildAdvisorSystemPrompt, buildAdvisorUserPrompt, buildAdvisorRetryPrompt } from "../lib/ai/advisorPrompt";
import { calculateAdvisorBFS, shouldRetryAdvisor } from "../lib/ai/advisorCompliance";
import { getBrandProfile } from "../lib/brand-profile";
import { getCurrentBrandGuide } from "../lib/brand-guide-service";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { AdvisorRequestSchema } from "@shared/validation-schemas";
import type {
  AdvisorRequest,
  AdvisorResponse,
  AdvisorInsight,
  BrandProfile,
} from "@shared/advisor";
import type { AiAgentResponseStatus, AiAgentWarning } from "@shared/aiContent";
import {
  buildBrandContextPayload,
  mergeBrandProfileWithOverrides,
} from "../lib/ai/agent-context";
import {
  broadcastAgentCompleted,
  broadcastAgentFailed,
} from "../lib/event-broadcaster";
import { assertBrandAccess } from "../lib/brand-access";
import { StrategyBriefStorage, ContentPackageStorage } from "../lib/collaboration-storage";
import { createStrategyBrief } from "@shared/collaboration-artifacts";

// Simple logger for telemetry
function logAdvisorCall(provider: string, latencyMs: number, bfs: number, retryAttempted: boolean, error?: string) {
  console.log(`[Advisor] provider=${provider} latency=${latencyMs}ms bfs=${bfs.toFixed(2)} retry=${retryAttempted}${error ? ` error=${error}` : ""}`);
}

/**
 * Parse JSON insights from AI response
 */
function parseInsights(content: string): AdvisorInsight[] {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content.trim();
    
    const parsed = JSON.parse(jsonString);
    
    if (!Array.isArray(parsed)) {
      throw new Error("Expected array of insights");
    }

    // Validate and normalize insights
    return parsed.map((item: any, idx: number) => ({
      id: item.id || `insight-${idx + 1}`,
      title: item.title || "Insight",
      body: item.body || item.description || "",
      severity: item.severity || "info",
      category: item.category || "other",
      recommendedActions: item.recommendedActions || [],
      confidence: Math.max(0, Math.min(1, item.confidence || 0.8)),
    }));
  } catch (error) {
    console.error("Failed to parse insights:", error);
    // Return a fallback insight
    return [{
      id: "parse-error",
      title: "Unable to parse insights",
      body: "The AI response could not be parsed. Please try again.",
      severity: "warning" as const,
      category: "other" as const,
      confidence: 0,
    }];
  }
}

const LOW_BFS_THRESHOLD = 0.8;

function buildAdvisorWarnings({
  brandFidelityScore,
  compliance,
  retryAttempted,
}: {
  brandFidelityScore: number;
  compliance: AdvisorResponse["compliance"];
  retryAttempted: boolean;
}): AiAgentWarning[] {
  const warnings: AiAgentWarning[] = [];

  if (brandFidelityScore < LOW_BFS_THRESHOLD) {
    warnings.push({
      code: "low_bfs",
      message: `Advisor output scored ${Math.round(brandFidelityScore * 100)}% on brand fidelity.`,
      severity: "warning",
    });
  }

  if (compliance?.bannedPhrases && compliance.bannedPhrases.length > 0) {
    warnings.push({
      code: "banned_phrases",
      message: "Advisor surfaced language on the banned list.",
      severity: "warning",
      details: { phrases: compliance.bannedPhrases },
    });
  }

  if (compliance?.missingDisclaimers && compliance.missingDisclaimers.length > 0) {
    warnings.push({
      code: "missing_disclaimer",
      message: "Advisor recommendations are missing required disclaimers.",
      severity: "warning",
      details: { disclaimers: compliance.missingDisclaimers },
    });
  }

  if (retryAttempted) {
    warnings.push({
      code: "retry_attempted",
      message: "Insights required a retry to meet brand fidelity.",
      severity: "info",
    });
  }

  return warnings;
}

function determineStatus(
  warningList: AiAgentWarning[],
): AiAgentResponseStatus {
  if (
    warningList.some(
      (warning) => warning.severity === "warning" || warning.severity === "critical",
    )
  ) {
    return "partial";
  }
  return "ok";
}

function buildComplianceTagCounts(
  compliance: AdvisorResponse["compliance"],
): Record<string, number> {
  const counts: Record<string, number> = {};
  if (compliance?.bannedPhrases?.length) {
    counts.banned_phrase = compliance.bannedPhrases.length;
  }
  if (compliance?.missingDisclaimers?.length) {
    counts.missing_disclaimer = compliance.missingDisclaimers.length;
  }
  if (compliance?.offBrand) {
    counts.off_brand = 1;
  }
  return counts;
}

function buildAdvisorResponse({
  brandId,
  brand,
  request,
  insights,
  provider,
  latencyMs,
  retryAttempted,
  modelName,
  complianceResult,
}: {
  brandId: string;
  brand: BrandProfile;
  request: AdvisorRequest;
  insights: AdvisorInsight[];
  provider: "openai" | "claude";
  latencyMs: number;
  retryAttempted: boolean;
  modelName?: string;
  complianceResult: {
    brandFidelityScore: number;
    compliance: AdvisorResponse["compliance"];
  };
}): AdvisorResponse {
  const warnings = buildAdvisorWarnings({
    brandFidelityScore: complianceResult.brandFidelityScore,
    compliance: complianceResult.compliance,
    retryAttempted,
  });
  const status = determineStatus(warnings);
  const complianceTagCounts = buildComplianceTagCounts(
    complianceResult.compliance,
  );

  const response: AdvisorResponse = {
    insights,
    brandFidelityScore: complianceResult.brandFidelityScore,
    compliance: complianceResult.compliance,
    brandContext: buildBrandContextPayload(brandId, brand),
    request,
    metadata: {
      provider,
      latencyMs,
      retryAttempted,
      status,
      averageBrandFidelityScore: complianceResult.brandFidelityScore,
      complianceTagCounts,
    },
    rawModelInfo: {
      model: modelName,
      latencyMs,
      provider,
      retryAttempted,
    },
  };

  if (warnings.length > 0) {
    response.warnings = warnings;
  }

  return response;
}

/**
 * Main advisor endpoint handler
 */
export const getAdvisorInsights: RequestHandler = async (req, res) => {
  const startTime = Date.now();
  let retryAttempted = false;
      let provider: "openai" | "claude" = process.env.AI_PROVIDER === "anthropic" ? "claude" : "openai";

  try {
    // Validate request body with Zod
    let requestBody: AdvisorRequest;
    try {
      requestBody = AdvisorRequestSchema.parse(req.body);
    } catch (validationError) {
      // Provide structured error response for validation failures
      if (validationError instanceof z.ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Request validation failed",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          {
            validationErrors: validationError.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
              code: err.code,
            })),
          },
          "Please check your request and try again. Required: brandId (UUID). Optional: timeRange, metrics, context."
        );
      }
      throw validationError;
    }
    
    const { brandId, timeRange, period, metrics, context, requestId, strategyBriefId, contentPackageId } = requestBody;

    // ✅ SECURITY: Verify user has access to this brand and workspace
    await assertBrandAccess(req, brandId, true, true);

    // ✅ COLLABORATION: Read existing StrategyBrief or ContentPackage if provided
    let existingStrategyBrief = null;
    if (strategyBriefId) {
      existingStrategyBrief = await StrategyBriefStorage.getLatest(brandId);
    }

    let contentPackage = null;
    if (contentPackageId) {
      contentPackage = await ContentPackageStorage.getById(contentPackageId);
      if (!contentPackage) {
        console.warn(`[Advisor] ContentPackage ${contentPackageId} not found`);
      }
    }

    // ✅ BRAND GUIDE: Load Brand Guide (source of truth)
    const brandGuide = await getCurrentBrandGuide(brandId);

    // Get brand profile and merge optional overrides
    const brand = mergeBrandProfileWithOverrides(
      await getBrandProfile(brandId),
      requestBody.brandContext,
    );

    // Build prompts
    const systemPrompt = buildAdvisorSystemPrompt();
    const userPrompt = buildAdvisorUserPrompt({
      brand,
      brandGuide, // Pass BrandGuide to prompt builder (source of truth)
      analytics: metrics,
      timeRange: timeRange || period,
    });

    // Combine system and user prompts for single-prompt API
    // The generateWithAI function expects a single prompt string
    const fullPrompt = `${systemPrompt}\n\n## User Request\n\n${userPrompt}`;

    // Generate insights with retry logic
    let insights: AdvisorInsight[] = [];
    let rawResponse = "";
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await generateWithAI(fullPrompt, "advisor", provider);
        rawResponse = result.content;
        insights = parseInsights(result.content);

        // Calculate BFS and compliance
        const complianceResult = calculateAdvisorBFS(insights, brand);

        // If BFS is low and we haven't retried yet, retry with stricter prompt
        if (shouldRetryAdvisor(complianceResult) && attempt < maxAttempts) {
          retryAttempted = true;
          const retryPrompt = buildAdvisorRetryPrompt(
            { brand, analytics: metrics, timeRange: timeRange || period },
            rawResponse
          );
          const retryFullPrompt = `${systemPrompt}\n\n${retryPrompt}`;
          
          // Wait a bit before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 250 * attempt));
          
          const retryResult = await generateWithAI(retryFullPrompt, "advisor", provider);
          rawResponse = retryResult.content;
          insights = parseInsights(retryResult.content);
          
          // Recalculate BFS after retry
          const retryComplianceResult = calculateAdvisorBFS(insights, brand);
          
          const latencyMs = Date.now() - startTime;

          const response = buildAdvisorResponse({
            brandId,
            brand,
            request: requestBody,
            insights,
            provider,
            latencyMs,
            retryAttempted: true,
            modelName: retryResult.model,
            complianceResult: retryComplianceResult,
          });

          // ✅ COLLABORATION: Generate and save StrategyBrief (retry path)
          if (requestId || strategyBriefId) {
            try {
              const newStrategyBrief = createStrategyBrief({
                id: strategyBriefId || `sb_${Date.now()}`,
                brandId,
                version: "1.0.0",
                updatedAt: new Date().toISOString(),
                positioning: {
                  tagline: brand.name,
                  missionStatement: insights[0]?.body || "",
                  targetAudience: {
                    demographics: brand.targetAudience || "",
                    psychographics: brand.values || [],
                    painPoints: [],
                    aspirations: [],
                  },
                },
                voice: {
                  tone: (brand.tone as "professional" | "friendly" | "casual" | "energetic" | "authoritative" | "mixed") || "professional",
                  personality: brand.values || [],
                  keyMessages: insights.slice(0, 3).map(i => i.title),
                  avoidPhrases: brand.forbiddenPhrases || [],
                },
                visual: {
                  primaryColor: "#A76CF5",
                  secondaryColor: "#F5C96C",
                  accentColor: "#06B6D4",
                  fontPairing: {
                    heading: "Poppins",
                    body: "Inter",
                  },
                  imagery: {
                    style: "photo",
                    subjects: [],
                  },
                },
                competitive: {
                  differentiation: [],
                  uniqueValueProposition: "",
                },
              });

              if (existingStrategyBrief) {
                newStrategyBrief.id = existingStrategyBrief.id;
                newStrategyBrief.positioning = { ...existingStrategyBrief.positioning, ...newStrategyBrief.positioning };
                newStrategyBrief.voice = { ...existingStrategyBrief.voice, ...newStrategyBrief.voice };
              }

              await StrategyBriefStorage.save(newStrategyBrief);
              console.log(`[Advisor] Saved StrategyBrief ${newStrategyBrief.id} (retry)`);
            } catch (collabError) {
              console.warn(`[Advisor] Failed to save StrategyBrief:`, collabError);
            }
          }

          logAdvisorCall(provider, latencyMs, retryComplianceResult.brandFidelityScore, true);
          
          // Broadcast agent completion
          const userId = (req as any).user?.id || (req as any).userId || "unknown";
          broadcastAgentCompleted({
            agent: "advisor",
            brandId,
            userId,
            status: response.status === "ok" ? "success" : response.status === "partial" ? "partial_success" : response.status === "error" ? "failure" : (response.status as "success" | "partial_success" | "failure"),
            avgBFS: retryComplianceResult.brandFidelityScore,
            warnings: response.warnings,
            latencyMs,
          });
          
          return res.json(response);
        }

        // Success - return response
        const latencyMs = Date.now() - startTime;

        const response = buildAdvisorResponse({
          brandId,
          brand,
          request: requestBody,
          insights,
          provider,
          latencyMs,
          retryAttempted,
          modelName: result.model,
          complianceResult,
        });

        // ✅ COLLABORATION: Generate and save StrategyBrief if collaboration context exists
        if (requestId || strategyBriefId) {
          try {
            const newStrategyBrief = createStrategyBrief({
              id: strategyBriefId || `sb_${Date.now()}`,
              brandId,
              version: "1.0.0",
              updatedAt: new Date().toISOString(),
              positioning: {
                tagline: brand.name,
                missionStatement: insights[0]?.body || "",
                targetAudience: {
                  demographics: brand.targetAudience || "",
                  psychographics: brand.values || [],
                  painPoints: [],
                  aspirations: [],
                },
              },
              voice: {
                tone: (brand.tone as "professional" | "friendly" | "casual" | "energetic" | "authoritative" | "mixed") || "professional",
                personality: brand.values || [],
                keyMessages: insights.slice(0, 3).map(i => i.title),
                avoidPhrases: brand.forbiddenPhrases || [],
              },
              visual: {
                primaryColor: "#A76CF5",
                secondaryColor: "#F5C96C",
                accentColor: "#06B6D4",
                fontPairing: {
                  heading: "Poppins",
                  body: "Inter",
                },
                imagery: {
                  style: "photo",
                  subjects: [],
                },
              },
              competitive: {
                differentiation: [],
                uniqueValueProposition: "",
              },
            });

            // Merge with existing if updating
            if (existingStrategyBrief) {
              newStrategyBrief.id = existingStrategyBrief.id;
              newStrategyBrief.positioning = { ...existingStrategyBrief.positioning, ...newStrategyBrief.positioning };
              newStrategyBrief.voice = { ...existingStrategyBrief.voice, ...newStrategyBrief.voice };
            }

            await StrategyBriefStorage.save(newStrategyBrief);
            console.log(`[Advisor] Saved StrategyBrief ${newStrategyBrief.id} for request ${requestId || "unknown"}`);
          } catch (collabError) {
            console.warn(`[Advisor] Failed to save StrategyBrief:`, collabError);
          }
        }

        logAdvisorCall(provider, latencyMs, complianceResult.brandFidelityScore, retryAttempted);
        
        // Broadcast agent completion
        const userId = (req as any).user?.id || (req as any).userId || "unknown";
        broadcastAgentCompleted({
          agent: "advisor",
          brandId,
          userId,
          status: response.status === "ok" ? "success" : response.status === "partial" ? "partial_success" : response.status === "error" ? "failure" : (response.status as "success" | "partial_success" | "failure"),
          avgBFS: complianceResult.brandFidelityScore,
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

    // Should never reach here, but TypeScript needs it
    throw new Error("Failed to generate insights after all attempts");
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    logAdvisorCall(provider, latencyMs, 0, retryAttempted, errorMessage);

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
      agent: "advisor",
      brandId,
      userId,
      status: "failure",
      error: errorMessage,
      latencyMs,
    });
    
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Failed to generate advisor insights",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "error",
      { originalError: errorMessage },
      "We couldn't generate insights right now. Please try again later."
    );
  }
};

