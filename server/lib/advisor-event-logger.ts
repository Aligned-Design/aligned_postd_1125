/**
 * Advisor Event Logger
 *
 * Logs all Advisor operations using the centralized event logging system.
 * Provides traceability for reviews, actions, and their outcomes.
 */

import { getAgentEventLogger } from "./agent-events";
import type { ReviewScore } from "./advisor-review-scorer";
import type { ReflectionQuestion } from "./advisor-reflection-generator";
import type { ActionResult } from "./advisor-action-handlers";

/**
 * Log when an Advisor review is created with scores
 */
export function logAdvisorReviewCreated(
  brandId: string,
  requestId: string,
  durationMs: number,
  metadata: {
    content_id: string;
    platform: string;
    scores: ReviewScore;
    severity_level: "green" | "yellow" | "red";
    has_reflection_question: boolean;
    suggested_actions_count: number;
  }
): void {
  const eventLogger = getAgentEventLogger();

  eventLogger.emitAdvisorReviewCreated(brandId, requestId, durationMs, {
    clarity_score: metadata.scores.clarity,
    brand_alignment_score: metadata.scores.brand_alignment,
    resonance_score: metadata.scores.resonance,
    actionability_score: metadata.scores.actionability,
    platform_fit_score: metadata.scores.platform_fit,
    average_score: metadata.scores.average,
    tokens_in: 0, // Would be populated if tracking AI token usage
    tokens_out: 0,
    provider: "claude",
    insights_count: metadata.suggested_actions_count,
  });
}

/**
 * Log when an Advisor action is invoked by the user
 */
export function logAdvisorActionInvoked(
  brandId: string,
  requestId: string,
  metadata: {
    action_type: string;
    content_id: string;
    platform: string;
    user_id: string;
    parameters?: Record<string, unknown>;
  }
): void {
  const eventLogger = getAgentEventLogger();

  eventLogger.emitActionInvoked(brandId, requestId, {
    action_type: metadata.action_type,
    insight_id: metadata.content_id,
    agent: "advisor",
    parameters: {
      platform: metadata.platform,
      user_id: metadata.user_id,
      ...metadata.parameters,
    },
  });
}

/**
 * Log the result of an Advisor action (success or failure)
 */
export function logAdvisorActionResult(
  brandId: string,
  requestId: string,
  durationMs: number,
  metadata: {
    action_type: string;
    content_id: string;
    success: boolean;
    result?: Record<string, unknown>;
    error?: string;
  }
): void {
  const eventLogger = getAgentEventLogger();

  eventLogger.emitActionResult(brandId, requestId, durationMs, {
    action_type: metadata.action_type,
    insight_id: metadata.content_id,
    success: metadata.success,
    result: metadata.success ? metadata.result : undefined,
    error: metadata.success ? undefined : metadata.error,
  });
}

/**
 * Log when content is flagged as needing human review
 */
export function logAdvisorContentFlagged(
  brandId: string,
  requestId: string,
  metadata: {
    content_id: string;
    reason: string;
    priority: "low" | "medium" | "high";
    requires_action: boolean;
  }
): void {
  const eventLogger = getAgentEventLogger();

  eventLogger.emitRiskFlagged(brandId, requestId, {
    risk_type: "advisor_escalation",
    severity:
      metadata.priority === "high"
        ? "critical"
        : metadata.priority === "medium"
          ? "high"
          : "medium",
    message: `Content flagged for review: ${metadata.reason}`,
    agent: "advisor",
    requires_human_review: metadata.requires_action,
  });
}

/**
 * Log when Advisor needs additional information to proceed
 */
export function logAdvisorNeedsInfo(
  brandId: string,
  requestId: string,
  metadata: {
    content_id: string;
    missing_fields: string[];
    reason: string;
  }
): void {
  const eventLogger = getAgentEventLogger();

  eventLogger.emitNeedsInfo(brandId, requestId, {
    missing_fields: metadata.missing_fields,
    reason: metadata.reason,
    agent: "advisor",
  });
}

/**
 * Log when token health affects Advisor operations
 */
export function logAdvisorTokenHealthCheck(
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
  const eventLogger = getAgentEventLogger();

  eventLogger.emitTokenHealthCheck(brandId, requestId, {
    account_id: metadata.account_id,
    platform: metadata.platform,
    is_healthy: metadata.is_healthy,
    status: metadata.status,
    expires_in_days: metadata.expires_in_days || 0,
  });
}

/**
 * Log when Advisor cannot proceed due to compliance/safety issues
 */
export function logAdvisorContentBlocked(
  brandId: string,
  requestId: string,
  metadata: {
    content_id: string;
    reason: string;
    blocked_by: string[];
  }
): void {
  const eventLogger = getAgentEventLogger();

  eventLogger.emitContentBlocked(brandId, requestId, {
    reason: metadata.reason,
    agent: "advisor",
    blocked_by: metadata.blocked_by,
  });
}

/**
 * Log full advisor review lifecycle event
 */
export function logAdvisorReviewLifecycle(
  brandId: string,
  requestId: string,
  event: "created" | "reviewed" | "actioned" | "approved" | "published" | "archived",
  metadata: {
    content_id: string;
    review_score?: number;
    action_type?: string;
    success: boolean;
    details: Record<string, unknown>;
  }
): void {
  const eventLogger = getAgentEventLogger();

  const eventTypeMap = {
    created: "advisor.review.created",
    reviewed: "advisor.review.reviewed",
    actioned: "advisor.action.invoked",
    approved: "advisor.review.approved",
    published: "advisor.review.published",
    archived: "advisor.review.archived",
  };

  // This would typically be a generic event logger, but we use existing methods
  if (event === "created") {
    logAdvisorReviewCreated(brandId, requestId, 0, {
      content_id: metadata.content_id,
      platform: metadata.details.platform as string,
      scores: metadata.details.scores as ReviewScore,
      severity_level: metadata.details.severity_level as any,
      has_reflection_question: !!metadata.details.reflection_question,
      suggested_actions_count: (metadata.details.suggested_actions as any[])?.length || 0,
    });
  } else if (event === "actioned") {
    logAdvisorActionResult(brandId, requestId, 0, {
      action_type: metadata.action_type || "unknown",
      content_id: metadata.content_id,
      success: metadata.success,
      result: metadata.details,
    });
  }
}

/**
 * Calculate and log advisor performance metrics
 */
export function logAdvisorMetrics(
  brandId: string,
  requestId: string,
  metadata: {
    total_reviews: number;
    reviews_actioned: number;
    average_score: number;
    actions_success_rate: number;
    token_health_status: "healthy" | "expiring" | "expired";
  }
): void {
  const eventLogger = getAgentEventLogger();

  // Log as custom metadata to a generic event
  console.log(`[Advisor Metrics] Brand: ${brandId}`, {
    reviews: metadata.total_reviews,
    actioned: metadata.reviews_actioned,
    avg_score: metadata.average_score,
    success_rate: metadata.actions_success_rate,
    token_status: metadata.token_health_status,
  });
}
