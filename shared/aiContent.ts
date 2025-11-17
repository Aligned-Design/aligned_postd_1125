/**
 * AI Content Types (Shared)
 * 
 * Shared types for AI-generated content between client and server.
 */

export type AiContentStatus = "draft" | "approved" | "needs_review";

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
  visualStyle?: string;
  additionalContext?: string;
  brandContext?: AiAgentBrandContextInput;
}

export interface AiDocGenerationResponse {
  variants: AiDocVariant[];
  brandContext: AiAgentBrandContext;
  request: AiDocGenerationRequest;
  metadata: AiAgentMetadata;
  warnings?: AiAgentWarning[];
}

export interface AiDesignGenerationResponse {
  variants: AiDesignVariant[];
  brandContext: AiAgentBrandContext;
  request: AiDesignGenerationRequest;
  metadata: AiAgentMetadata;
  warnings?: AiAgentWarning[];
}

