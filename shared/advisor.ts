import type {
  AiAgentBrandContext,
  AiAgentBrandContextInput,
  AiAgentMetadata,
  AiAgentWarning,
} from "./aiContent";

/**
 * Advisor API Types
 * 
 * Shared types for the AI Advisor feature between client and server.
 */

export interface AdvisorInsight {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  category: "content" | "timing" | "channel" | "ads" | "engagement" | "other";
  recommendedActions?: string[];
  confidence: number; // 0–1
}

export interface AdvisorComplianceFlags {
  offBrand?: boolean;
  bannedPhrases?: string[];
  missingDisclaimers?: string[];
}

export interface AdvisorResponse {
  insights: AdvisorInsight[];
  brandFidelityScore: number; // 0–1
  compliance: AdvisorComplianceFlags;
  brandContext?: AiAgentBrandContext;
  metadata?: AiAgentMetadata;
  warnings?: AiAgentWarning[];
  request?: AdvisorRequest;
  rawModelInfo?: {
    model?: string;
    latencyMs?: number;
      provider?: "openai" | "claude";
    retryAttempted?: boolean;
  };
  status?: "ok" | "partial" | "error" | "success" | "partial_success" | "failure"; // ✅ Added status property with all possible values
}

export interface AdvisorRequest {
  brandId?: string; // ✅ Made optional to match route implementation
  workspaceId?: string; // ✅ Added to match Zod schema
  timeRange?: "7d" | "30d" | "90d" | "all";
  period?: string; // Alternative to timeRange
  requestId?: string; // ✅ Added to match Zod schema
  strategyBriefId?: string; // ✅ Added to match Zod schema
  contentPackageId?: string; // ✅ Added to match Zod schema
  metrics?: {
    topPosts?: Array<{
      title?: string; // ✅ Made optional to match Zod schema
      platform?: string; // ✅ Made optional to match Zod schema
      engagement?: number; // ✅ Made optional to match Zod schema
      reach?: number; // ✅ Made optional to match Zod schema
    }>;
    bestTimes?: string[];
    underperformingChannels?: string[];
    recentAnalytics?: {
      totalReach?: number;
      totalEngagement?: number;
      avgEngagementRate?: number;
    };
  };
  context?: Record<string, unknown>;
  brandContext?: AiAgentBrandContextInput;
}

/**
 * BrandContext - Brand context data for AI agents
 * 
 * This is the canonical type name per POSTD terminology guidelines.
 * Legacy "BrandProfile" has been removed - use BrandContext everywhere.
 */
export interface BrandContext {
  name: string;
  tone?: string;
  values?: string[];
  targetAudience?: string;
  forbiddenPhrases?: string[];
  requiredDisclaimers?: string[];
  allowedToneDescriptors?: string[];
}

// Note: Legacy "BrandProfile" alias removed - use BrandContext

