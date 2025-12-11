/**
 * AI Content Types
 * 
 * Shared types for AI-generated content (Doc and Design agents).
 */

import type { EvaluationCheck } from "@shared/brand-brain";

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

export type AiAgentResponseStatus = "ok" | "partial" | "error";

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
  label: string; // "Option A", "Long-form", etc.
  content: string;
  tone?: string;
  platform?: string; // "instagram", "facebook", "email", "blog", etc.
  wordCount?: number;
  brandFidelityScore: number; // 0–1
  complianceTags?: string[];
  status: AiContentStatus;
}

export interface AiDesignVariant {
  id: string;
  label: string; // "Concept A", etc.
  prompt: string; // text prompt for an image/creative
  description?: string; // explanation of the concept
  aspectRatio?: string; // "1:1", "9:16", etc.
  useCase?: string; // "Reel cover", "Carousel slide", etc.
  brandFidelityScore: number; // 0–1
  complianceTags?: string[];
  status: AiContentStatus;
}

export interface AiDocGenerationRequest {
  brandId: string;
  topic: string;
  platform: string;
  contentType: "caption" | "email" | "blog" | "ad" | "script" | "other";
  tone?: string;
  length?: "short" | "medium" | "long";
  callToAction?: string;
  additionalContext?: string;
  brandContext?: AiAgentBrandContextInput;
}

export interface AiDesignGenerationRequest {
  brandId: string;
  campaignName?: string;
  platform: string;
  format: "story" | "feed" | "reel" | "short" | "ad" | "other";
  tone?: string;
  visualStyle?: string; // "minimal", "bold", "playful", etc.
  additionalContext?: string;
  brandContext?: AiAgentBrandContextInput;
}

export interface AiDocGenerationResponse {
  variants: AiDocVariant[];
  brandContext: AiAgentBrandContext;
  request: AiDocGenerationRequest;
  metadata: AiAgentMetadata;
  warnings?: AiAgentWarning[];
  /** Brand Brain evaluation result (advisory - does not block approval) */
  brandBrainEvaluation?: BrandBrainEvaluation;
}

export interface AiDesignGenerationResponse {
  variants: AiDesignVariant[];
  brandContext: AiAgentBrandContext;
  request: AiDesignGenerationRequest;
  metadata: AiAgentMetadata;
  warnings?: AiAgentWarning[];
  /** Brand Brain evaluation result (advisory - does not block approval) */
  brandBrainEvaluation?: BrandBrainEvaluation;
}

