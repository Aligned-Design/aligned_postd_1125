/**
 * Milestone Trigger Helpers
 *
 * This module provides helper functions to trigger milestones
 * from various parts of the application.
 *
 * Usage:
 * - Call these functions after key events complete
 * - They are idempotent and safe to call multiple times
 * - Failures are logged but don't throw to avoid breaking main flows
 */

import { unlockMilestone } from "./milestones";

/**
 * Trigger when user completes onboarding
 */
export async function triggerOnboardingComplete(workspaceId: string) {
  try {
    await unlockMilestone(workspaceId, "onboarding_complete");
  } catch (err) {
    console.error("[Milestone] Failed to trigger onboarding_complete:", err);
  }
}

/**
 * Trigger when first integration is connected
 */
export async function triggerFirstIntegration(workspaceId: string) {
  try {
    await unlockMilestone(workspaceId, "first_integration");
  } catch (err) {
    console.error("[Milestone] Failed to trigger first_integration:", err);
  }
}

/**
 * Trigger when first content is approved
 */
export async function triggerFirstApproval(workspaceId: string) {
  try {
    await unlockMilestone(workspaceId, "first_approval");
  } catch (err) {
    console.error("[Milestone] Failed to trigger first_approval:", err);
  }
}

/**
 * Trigger when first post is published successfully
 */
export async function triggerFirstPublish(workspaceId: string) {
  try {
    await unlockMilestone(workspaceId, "first_publish");
  } catch (err) {
    console.error("[Milestone] Failed to trigger first_publish:", err);
  }
}

/**
 * Trigger when analytics goal is met
 */
export async function triggerGoalMet(workspaceId: string) {
  try {
    await unlockMilestone(workspaceId, "goal_met");
  } catch (err) {
    console.error("[Milestone] Failed to trigger goal_met:", err);
  }
}

/**
 * Trigger when agency reaches 5 brands
 */
export async function triggerAgencyScale5(workspaceId: string) {
  try {
    await unlockMilestone(workspaceId, "agency_scale_5");
  } catch (err) {
    console.error("[Milestone] Failed to trigger agency_scale_5:", err);
  }
}

/**
 * Trigger on 1-month anniversary
 */
export async function triggerMonth1Anniversary(workspaceId: string) {
  try {
    await unlockMilestone(workspaceId, "month_1_anniversary");
  } catch (err) {
    console.error("[Milestone] Failed to trigger month_1_anniversary:", err);
  }
}

/**
 * Check and trigger agency scale milestone based on brand count
 */
export async function checkAgencyScale(
  workspaceId: string,
  brandCount: number,
) {
  if (brandCount >= 5) {
    await triggerAgencyScale5(workspaceId);
  }
}
