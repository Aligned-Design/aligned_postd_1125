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
}

export interface AdvisorRequest {
  brandId: string;
  timeRange?: "7d" | "30d" | "90d" | "all";
  period?: string; // Alternative to timeRange
  metrics?: {
    topPosts?: Array<{
      title: string;
      platform: string;
      engagement: number;
      reach: number;
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

export interface BrandProfile {
  name: string;
  tone?: string;
  values?: string[];
  targetAudience?: string;
  forbiddenPhrases?: string[];
  requiredDisclaimers?: string[];
  allowedToneDescriptors?: string[];
}

