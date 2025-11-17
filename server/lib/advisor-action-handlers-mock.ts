/**
 * Mock Action Handlers for Testing
 *
 * Provides mock implementations of action handlers for testing without
 * requiring actual API keys or external service calls.
 */

import type { ActionContext, ActionResult } from "./advisor-action-handlers";

/**
 * Mock: Regenerate Caption (no API call needed)
 */
export async function mockActionRegenerateCaption(
  context: ActionContext,
  feedback: string
): Promise<ActionResult> {
  return {
    action_type: "regenerate_caption",
    success: true,
    message: "New caption generated successfully",
    result_data: {
      new_caption: `${context.content} [Regenerated based on: ${feedback.substring(0, 50)}...]`,
      original_caption: context.content,
      platform: context.platform,
      duration_ms: 123,
      tokens_used: {
        input: 45,
        output: 32,
      },
    },
    requires_approval: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Mock: Tighten Post Length (no API call needed)
 */
export async function mockActionTightenPostLength(
  context: ActionContext,
  target_length: number = 150
): Promise<ActionResult> {
  const shortened = context.content.split(" ").slice(0, 4).join(" ");

  return {
    action_type: "tighten_post_length",
    success: true,
    message: `Content tightened from ${context.content.length} to ${shortened.length} characters`,
    result_data: {
      original_length: context.content.length,
      new_length: shortened.length,
      reduction_percent: Math.round(
        ((context.content.length - shortened.length) / context.content.length) * 100
      ),
      tightened_content: shortened,
      platform: context.platform,
      duration_ms: 89,
    },
    requires_approval: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Mock: Optimize Schedule (no API call needed)
 */
export async function mockActionOptimizeSchedule(
  context: ActionContext
): Promise<ActionResult> {
  const scheduleRecommendations: Record<string, string[]> = {
    instagram: [
      "Tuesday 10:00 AM (highest engagement)",
      "Wednesday 2:00 PM (strong performer)",
      "Thursday 7:00 PM (evening audience)",
    ],
    tiktok: [
      "Tuesday 6:00 AM (early morning)",
      "Friday 5:00 PM (weekend preparation)",
      "Sunday 9:00 PM (peak viewing time)",
    ],
    linkedin: [
      "Tuesday 8:00 AM (commute time)",
      "Wednesday 11:00 AM (mid-day focus)",
      "Thursday 10:00 AM (high engagement)",
    ],
  };

  const times = scheduleRecommendations[context.platform] || [
    "Tuesday 10:00 AM",
    "Wednesday 2:00 PM",
    "Thursday 7:00 PM",
  ];

  return {
    action_type: "optimize_schedule",
    success: true,
    message: `Optimal posting times identified for ${context.platform}`,
    result_data: {
      platform: context.platform,
      recommended_times: times,
      strategy: `Post during ${times[0]} for maximum reach`,
      confidence_level: "medium",
      duration_ms: 67,
    },
    requires_approval: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Mock: Autofill Open Dates (no API call needed)
 */
export async function mockActionAutofillOpenDates(
  context: ActionContext,
  num_posts: number = 5
): Promise<ActionResult> {
  const schedules = [];
  const now = new Date();

  for (let i = 0; i < num_posts; i++) {
    const postDate = new Date(now);
    postDate.setDate(postDate.getDate() + 3 * (i + 1));
    const hour = context.platform === "tiktok" ? 18 : 10;
    postDate.setHours(hour, 0, 0, 0);

    schedules.push({
      scheduled_for: postDate.toISOString(),
      day: postDate.toLocaleDateString("en-US", { weekday: "long" }),
      time: postDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  }

  return {
    action_type: "autofill_open_dates",
    success: true,
    message: `Scheduled ${num_posts} posts for optimal times`,
    result_data: {
      platform: context.platform,
      scheduled_posts: schedules,
      start_date: schedules[0]?.scheduled_for,
      end_date: schedules[num_posts - 1]?.scheduled_for,
      cadence: "Every 3 days",
      duration_ms: 95,
    },
    requires_approval: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Mock: Queue Variant (no API call needed)
 */
export async function mockActionQueueVariant(
  context: ActionContext,
  variant_type: "tone" | "length" | "format" = "tone"
): Promise<ActionResult> {
  let variant = context.content;

  if (variant_type === "tone") {
    variant = `[CASUAL] ${context.content}`;
  } else if (variant_type === "length") {
    variant = context.content.split(" ").slice(0, 3).join(" ") + "!";
  } else if (variant_type === "format") {
    variant = `1. ${context.content.split(".")[0]}\n2. Key benefits\n3. Call to action`;
  }

  return {
    action_type: "queue_variant",
    success: true,
    message: `${variant_type} variant created for A/B testing`,
    result_data: {
      variant_type,
      original_content: context.content,
      variant_content: variant,
      original_length: context.content.length,
      variant_length: variant.length,
      recommendation: "Use for A/B testing to compare performance",
      platform: context.platform,
      duration_ms: 112,
    },
    requires_approval: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Mock: Request Brand Info (no API call needed)
 */
export async function mockActionRequestBrandInfo(
  context: ActionContext,
  missing_info: string[]
): Promise<ActionResult> {
  return {
    action_type: "request_brand_info",
    success: true,
    message: "Brand information request created",
    result_data: {
      content_id: context.content_id,
      requested_fields: missing_info,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      note: "Content paused until information is provided",
      impact: "Providing this info will improve future content quality",
      duration_ms: 45,
    },
    requires_approval: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Mock: Flag Reconnect (no API call needed)
 */
export async function mockActionFlagReconnect(
  context: ActionContext,
  account_id: string,
  days_until_expiry: number
): Promise<ActionResult> {
  return {
    action_type: "flag_reconnect",
    success: true,
    message: `Account reconnection required (${days_until_expiry} days remaining)`,
    result_data: {
      account_id,
      platform: context.platform,
      days_until_expiry,
      action_required: true,
      severity:
        days_until_expiry <= 3
          ? "critical"
          : days_until_expiry <= 7
            ? "high"
            : "medium",
      consequence: "Posts will fail to publish if token expires",
      remediation: "Click 'Reconnect Account' in platform settings",
      urgency_message:
        days_until_expiry <= 3
          ? "⚠️ Urgent: Reconnect within 3 days"
          : `Reconnect soon: ${days_until_expiry} days remaining`,
      duration_ms: 38,
    },
    requires_approval: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Mock: Mark for Review (no API call needed)
 */
export async function mockActionMarkForReview(
  context: ActionContext,
  reason: string,
  priority: "low" | "medium" | "high" = "medium"
): Promise<ActionResult> {
  return {
    action_type: "mark_for_review",
    success: true,
    message: "Content escalated to review queue",
    result_data: {
      content_id: context.content_id,
      priority,
      reason,
      escalated_at: new Date().toISOString(),
      assignee: "review_queue",
      status: "pending_review",
      estimated_review_time:
        priority === "high"
          ? "2-4 hours"
          : priority === "medium"
            ? "4-24 hours"
            : "1-3 days",
      review_checklist: [
        "Brand alignment check",
        "Safety/compliance check",
        "Audience appropriateness",
        "Quality assessment",
      ],
      duration_ms: 52,
    },
    requires_approval: true,
    timestamp: new Date().toISOString(),
  };
}
