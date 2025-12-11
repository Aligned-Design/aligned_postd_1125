/**
 * AI Content Types (Shared)
 * 
 * Shared types for AI-generated content between client and server.
 */

import type { ContentEvaluationResult, EvaluationCheck } from "./brand-brain";

export type AiContentStatus = "draft" | "approved" | "needs_review";

/**
 * Brand Brain Evaluation result included in AI generation responses.
 * This is an advisory score - it does not block approvals.
 */
export interface BrandBrainEvaluation {
  /** Overall alignment score 0-100 */
  score: number;
  /** Individual checks with pass/warn/fail status */
  checks: EvaluationCheck[];
  /** Natural language recommendations for improvement */
  recommendations: string[];
  /** Evaluation timestamp */
  evaluatedAt: string;
  /** Evaluation version for tracking */
  evaluationVersion: string;
}

/**
 * Converts ContentEvaluationResult to BrandBrainEvaluation for API responses
 */
export function toBrandBrainEvaluation(result: ContentEvaluationResult): BrandBrainEvaluation {
  return {
    score: result.score,
    checks: result.checks,
    recommendations: result.recommendations,
    evaluatedAt: result.evaluatedAt,
    evaluationVersion: result.evaluationVersion,
  };
}

export type AiAgentResponseStatus = "ok" | "partial" | "error" | "success" | "partial_success" | "failure";

export interface AiAgentWarning {
  code: string;
  message: string;
  severity: "info" | "warning" | "critical";
  details?: Record<string, unknown>;
}

export interface AiAgentBrandContext {
  brandId: string;
  brandName: string;
  tone?: string;
  values?: string[];
  targetAudience?: string;
  guardrails?: {
    forbiddenPhrases?: string[];
    requiredDisclaimers?: string[];
  };
  allowedToneDescriptors?: string[];
}

export interface AiAgentBrandContextInput {
  tone?: string;
  values?: string[];
  targetAudience?: string;
  forbiddenPhrases?: string[];
  requiredDisclaimers?: string[];
  allowedToneDescriptors?: string[];
}

export interface AiAgentMetadata {
  provider: "openai" | "claude";
  latencyMs: number;
  retryAttempted: boolean;
  status: AiAgentResponseStatus;
  averageBrandFidelityScore: number;
  complianceTagCounts: Record<string, number>;
}

export interface AiDocVariant {
  id: string;
  label: string;
  content: string;
  tone?: string;
  platform?: string;
  wordCount?: number;
  brandFidelityScore: number;
  complianceTags?: string[];
  status: AiContentStatus;
}

export interface AiDesignVariant {
  id: string;
  label: string;
  prompt: string;
  description?: string;
  aspectRatio?: string;
  useCase?: string;
  brandFidelityScore: number;
  complianceTags?: string[];
  status: AiContentStatus;
  // ✅ PHASE 4: Optional metadata field (exists at runtime from Design Agent parser)
  metadata?: {
    colorUsage?: string[];
    typeStructure?: {
      headingFont?: string;
      bodyFont?: string;
      fontSize?: string;
      fontWeight?: string;
    };
    layoutStyle?: string;
    emotion?: string;
  };
}

export interface AiDocGenerationRequest {
  brandId?: string; // ✅ Made optional to match route implementation
  workspaceId?: string; // ✅ Added to match Zod schema
  topic?: string; // ✅ Made optional to match route implementation
  platform?: string; // ✅ Made optional to match route implementation
  contentType: "caption" | "email" | "blog" | "ad" | "script" | "other";
  tone?: string;
  length?: "short" | "medium" | "long";
  callToAction?: string;
  additionalContext?: string;
  brandContext?: AiAgentBrandContextInput;
  requestId?: string; // ✅ Added to match Zod schema
  strategyBriefId?: string; // ✅ Added to match Zod schema
  contentPackageId?: string; // ✅ Added to match Zod schema
}

export interface AiDesignGenerationRequest {
  brandId?: string; // ✅ Made optional to match route implementation
  workspaceId?: string; // ✅ Added to match Zod schema
  campaignName?: string;
  platform?: string; // ✅ Made optional to match route implementation (will be required by Zod schema validation)
  format: "story" | "feed" | "reel" | "short" | "ad" | "carousel" | "linkedin_post" | "quote_card" | "announcement" | "other"; // ✅ Added missing format types
  tone?: string;
  visualStyle?: string;
  additionalContext?: string;
  brandContext?: AiAgentBrandContextInput;
  requestId?: string; // ✅ Added to match Zod schema
  strategyBriefId?: string; // ✅ Added to match Zod schema
  contentPackageId?: string; // ✅ Added to match Zod schema
}

export interface AiDocGenerationResponse {
  variants: AiDocVariant[];
  brandContext: AiAgentBrandContext;
  request: AiDocGenerationRequest;
  metadata: AiAgentMetadata;
  warnings?: AiAgentWarning[];
  status?: AiAgentResponseStatus;
  /** Brand Brain evaluation result (advisory - does not block approval) */
  brandBrainEvaluation?: BrandBrainEvaluation;
}

export interface AiDesignGenerationResponse {
  variants: AiDesignVariant[];
  brandContext: AiAgentBrandContext;
  request: AiDesignGenerationRequest;
  metadata: AiAgentMetadata;
  warnings?: AiAgentWarning[];
  status?: AiAgentResponseStatus;
  /** Brand Brain evaluation result (advisory - does not block approval) */
  brandBrainEvaluation?: BrandBrainEvaluation;
}

