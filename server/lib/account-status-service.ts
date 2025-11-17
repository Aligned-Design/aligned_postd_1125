/**
 * Account Status Service
 * Manages account restrictions and permissions based on payment status
 */

export type PlanStatus =
  | "active"
  | "trial"
  | "past_due"
  | "archived"
  | "deleted";

export interface AccountPermissions {
  canPublish: boolean;
  canApprove: boolean;
  canGenerateContent: boolean;
  canAccessAnalytics: boolean;
  canManageBrands: boolean;
  canAccessClientPortal: boolean;
  maxDailyAIGenerations: number | null;
  isReadOnly: boolean;
}

export interface AccountStatus {
  planStatus: PlanStatus;
  daysPastDue: number;
  permissions: AccountPermissions;
  restrictions: string[];
  nextAction: string;
}

/**
 * Get account permissions based on plan status
 */
export function getAccountPermissions(
  planStatus: PlanStatus,
  daysPastDue: number = 0,
): AccountPermissions {
  // Active and trial users have full access
  if (planStatus === "active" || planStatus === "trial") {
    return {
      canPublish: true,
      canApprove: true,
      canGenerateContent: true,
      canAccessAnalytics: true,
      canManageBrands: true,
      canAccessClientPortal: true,
      maxDailyAIGenerations: planStatus === "trial" ? 10 : null,
      isReadOnly: false,
    };
  }

  // Past due accounts (Days 1-13)
  if (planStatus === "past_due" && daysPastDue < 14) {
    return {
      canPublish: true,
      canApprove: true,
      canGenerateContent: true,
      canAccessAnalytics: true,
      canManageBrands: false, // Can't add new brands
      canAccessClientPortal: true,
      maxDailyAIGenerations: 2, // Limited AI to maintain engagement
      isReadOnly: false,
    };
  }

  // Suspended accounts (Days 14-29)
  if (planStatus === "past_due" && daysPastDue >= 14) {
    return {
      canPublish: false, // Publishing disabled
      canApprove: false, // Approvals disabled
      canGenerateContent: true, // Still allow content generation
      canAccessAnalytics: true, // Analytics viewable but frozen
      canManageBrands: false,
      canAccessClientPortal: true, // Client portal shows inactive banner
      maxDailyAIGenerations: 2,
      isReadOnly: true,
    };
  }

  // Archived accounts (Days 30-89)
  if (planStatus === "archived") {
    return {
      canPublish: false,
      canApprove: false,
      canGenerateContent: false,
      canAccessAnalytics: true, // View only
      canManageBrands: false,
      canAccessClientPortal: true,
      maxDailyAIGenerations: 0,
      isReadOnly: true,
    };
  }

  // Deleted accounts
  return {
    canPublish: false,
    canApprove: false,
    canGenerateContent: false,
    canAccessAnalytics: false,
    canManageBrands: false,
    canAccessClientPortal: false,
    maxDailyAIGenerations: 0,
    isReadOnly: true,
  };
}

/**
 * Get account restrictions list
 */
export function getAccountRestrictions(
  planStatus: PlanStatus,
  daysPastDue: number = 0,
): string[] {
  const restrictions: string[] = [];

  if (planStatus === "past_due" && daysPastDue < 14) {
    restrictions.push("Cannot add new brands until payment is resolved");
    restrictions.push("AI content generation limited to 2 per day");
  }

  if (planStatus === "past_due" && daysPastDue >= 14) {
    restrictions.push("Publishing disabled - update payment to resume");
    restrictions.push("Approvals disabled");
    restrictions.push("Analytics in read-only mode (no live updates)");
    restrictions.push("AI content generation limited to 2 per day");
  }

  if (planStatus === "archived") {
    restrictions.push("Account archived - all features disabled");
    restrictions.push("Data retained for 90 days");
    restrictions.push("Reactivate anytime to restore access");
  }

  if (planStatus === "deleted") {
    restrictions.push("Account permanently deleted");
  }

  return restrictions;
}

/**
 * Get next recommended action for user
 */
export function getNextAction(
  planStatus: PlanStatus,
  daysPastDue: number = 0,
): string {
  if (planStatus === "active" || planStatus === "trial") {
    return "";
  }

  if (planStatus === "past_due" && daysPastDue < 7) {
    return "Update your payment method to avoid service interruption";
  }

  if (planStatus === "past_due" && daysPastDue >= 7 && daysPastDue < 14) {
    return "Update payment now to prevent account suspension";
  }

  if (planStatus === "past_due" && daysPastDue >= 14) {
    return "Update billing info to restore publishing and approvals instantly";
  }

  if (planStatus === "archived") {
    return "Reactivate your account to restore all features and scheduled content";
  }

  return "Contact support for assistance";
}

/**
 * Get complete account status
 */
export function getAccountStatus(
  planStatus: PlanStatus,
  daysPastDue: number = 0,
): AccountStatus {
  return {
    planStatus,
    daysPastDue,
    permissions: getAccountPermissions(planStatus, daysPastDue),
    restrictions: getAccountRestrictions(planStatus, daysPastDue),
    nextAction: getNextAction(planStatus, daysPastDue),
  };
}

/**
 * Check if user can perform specific action
 */
export function canPerformAction(
  planStatus: PlanStatus,
  action: keyof AccountPermissions,
  daysPastDue: number = 0,
): boolean {
  const permissions = getAccountPermissions(planStatus, daysPastDue);
  return Boolean(permissions[action]);
}
