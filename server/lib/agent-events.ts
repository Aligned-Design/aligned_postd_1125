/**
 * Agent Event Logging
 *
 * Structured event logging for all agent operations:
 * - copy.generated
 * - creative.concept.generated
 * - advisor.review.created
 * - advisor.action.invoked
 * - action.result
 * - needs_info (missing data)
 * - risk.flagged (compliance issues)
 */

import { Logger } from "../../shared/logger";

export type AgentEventType =
  | "copy.generated"
  | "creative.concept.generated"
  | "advisor.review.created"
  | "advisor.action.invoked"
  | "action.result"
  | "needs_info"
  | "risk.flagged"
  | "review.created"
  | "content.blocked"
  | "token.health.check";

export interface AgentEvent {
  event_type: AgentEventType;
  brand_id: string;
  agent: "doc" | "design" | "advisor";
  request_id: string;
  timestamp: string;
  duration_ms: number;
  success: boolean;
  status: "success" | "warning" | "error" | "blocked";
  metadata: Record<string, unknown>;
  error?: {
    message: string;
    code?: string;
  };
}

class AgentEventLogger {
  private logger: Logger;

  constructor(context: string = "AgentEvents") {
    this.logger = new Logger({
      context,
      enableConsole: true,
      enableRemote: true,
    });
  }

  emitCopyGenerated(
    brandId: string,
    requestId: string,
    durationMs: number,
    metadata: {
      platform: string;
      tokens_in: number;
      tokens_out: number;
      provider: string;
      bfs_score?: number;
      passed_bfs: boolean;
      regeneration_count: number;
    }
  ): void {
    this.logger.info("Copy generated", {
      event_type: "copy.generated",
      brand_id: brandId,
      agent: "doc",
      request_id: requestId,
      duration_ms: durationMs,
      ...metadata,
    });
  }

  emitCreativeConceptGenerated(
    brandId: string,
    requestId: string,
    durationMs: number,
    metadata: {
      template_ref: string;
      tokens_in: number;
      tokens_out: number;
      provider: string;
      has_fallback: boolean;
    }
  ): void {
    this.logger.info("Creative concept generated", {
      event_type: "creative.concept.generated",
      brand_id: brandId,
      agent: "design",
      request_id: requestId,
      duration_ms: durationMs,
      ...metadata,
    });
  }

  emitAdvisorReviewCreated(
    brandId: string,
    requestId: string,
    durationMs: number,
    metadata: {
      clarity_score?: number;
      brand_alignment_score?: number;
      resonance_score?: number;
      actionability_score?: number;
      platform_fit_score?: number;
      average_score?: number;
      tokens_in: number;
      tokens_out: number;
      provider: string;
      insights_count: number;
    }
  ): void {
    this.logger.info("Advisor review created", {
      event_type: "advisor.review.created",
      brand_id: brandId,
      agent: "advisor",
      request_id: requestId,
      duration_ms: durationMs,
      ...metadata,
    });
  }

  emitActionInvoked(
    brandId: string,
    requestId: string,
    metadata: {
      action_type: string;
      insight_id: string;
      agent: string;
      parameters?: Record<string, unknown>;
    }
  ): void {
    this.logger.info("Action invoked", {
      event_type: "advisor.action.invoked",
      brand_id: brandId,
      agent: metadata.agent,
      request_id: requestId,
      duration_ms: 0,
      ...metadata,
    });
  }

  emitActionResult(
    brandId: string,
    requestId: string,
    durationMs: number,
    metadata: {
      action_type: string;
      insight_id: string;
      success: boolean;
      result?: unknown;
      error?: string;
    }
  ): void {
    const event: AgentEvent = {
      event_type: "action.result",
      brand_id: brandId,
      agent: "advisor",
      request_id: requestId,
      timestamp: new Date().toISOString(),
      duration_ms: durationMs,
      success: metadata.success,
      status: metadata.success ? "success" : "error",
      metadata,
    };

    if (metadata.success) {
      this.logger.info("Action completed", {
        event_type: "action.result",
        brand_id: brandId,
        agent: "advisor",
        request_id: requestId,
        duration_ms: durationMs,
        ...metadata,
      });
    } else {
      // ✅ Type-safe error logging (Error type doesn't have event_type, use any for logger)
      this.logger.error("Action failed", {
        event_type: "action.result",
        brand_id: brandId,
        agent: "advisor",
        request_id: requestId,
        duration_ms: durationMs,
        ...metadata,
      } as any);
    }
  }

  emitNeedsInfo(
    brandId: string,
    requestId: string,
    metadata: {
      missing_fields: string[];
      reason: string;
      agent: string;
    }
  ): void {
    this.logger.warn("Missing information", {
      event_type: "needs_info",
      brand_id: brandId,
      agent: metadata.agent,
      request_id: requestId,
      duration_ms: 0,
      ...metadata,
    });
  }

  emitRiskFlagged(
    brandId: string,
    requestId: string,
    metadata: {
      risk_type: string;
      severity: "low" | "medium" | "high" | "critical";
      message: string;
      agent: string;
      requires_human_review: boolean;
    }
  ): void {
    this.logger.warn(`Risk flagged: ${metadata.risk_type}`, {
      event_type: "risk.flagged",
      brand_id: brandId,
      agent: metadata.agent,
      request_id: requestId,
      duration_ms: 0,
      ...metadata,
    });
  }

  emitContentBlocked(
    brandId: string,
    requestId: string,
    metadata: {
      reason: string;
      agent: string;
      blocked_by: string[];
    }
  ): void {
    this.logger.warn("Content blocked", {
      event_type: "content.blocked",
      brand_id: brandId,
      agent: metadata.agent,
      request_id: requestId,
      duration_ms: 0,
      ...metadata,
    });
  }

  emitTokenHealthCheck(
    brandId: string,
    requestId: string,
    metadata: {
      account_id: string;
      platform: string;
      is_healthy: boolean;
      status: string;
      expires_in_days: number | null;
    }
  ): void {
    const logData = {
      event_type: "token.health.check",
      brand_id: brandId,
      agent: "advisor",
      request_id: requestId,
      duration_ms: 0,
      ...metadata,
    };

    if (metadata.is_healthy) {
      this.logger.debug(`Token health: ${metadata.status}`, logData);
    } else {
      this.logger.warn(`Token health: ${metadata.status}`, logData);
    }
  }
}

let agentEventLogger: AgentEventLogger | null = null;

export function getAgentEventLogger(): AgentEventLogger {
  if (!agentEventLogger) {
    agentEventLogger = new AgentEventLogger();
  }
  return agentEventLogger;
}
