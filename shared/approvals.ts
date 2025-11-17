/**
 * Approval and audit logging types for client collaboration features
 */

// ==================== AUDIT LOGGING ====================

export type AuditAction =
  | 'APPROVAL_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'BULK_APPROVED'
  | 'BULK_REJECTED'
  | 'PUBLISH_FAILED'
  | 'EMAIL_SENT'
  | 'COMMENT_ADDED'
  | 'WORKFLOW_STARTED'
  | 'WORKFLOW_ACTION'
  | 'SETTINGS_UPDATED'
  | 'EMAIL_PREFERENCES_UPDATED'
  | 'WEBHOOK_RETRY_TRIGGERED';

export interface AuditLog {
  id: string;
  brandId: string;
  postId: string;
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  metadata: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    note?: string;
    emailAddress?: string;
    bulkCount?: number;
    reason?: string;
    errorMessage?: string;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogQuery {
  brandId?: string;
  postId?: string;
  actorId?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ==================== APPROVAL WORKFLOWS ====================

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'awaiting_client';

export type ApprovalBoardStatus =
  | 'draft'
  | 'needs_edits'
  | 'ready_for_client'
  | 'awaiting_client'
  | 'approved'
  | 'scheduled';

export interface ApprovalRequest {
  id: string;
  brandId: string;
  postId: string;
  requestedBy: string;
  assignedTo: string;
  status: ApprovalStatus;
  deadline?: string;
  remindersSent: number;
  lastReminderAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulkApprovalRequest {
  postIds: string[];
  action: 'approve' | 'reject';
  note?: string;
  requesterRole: 'client' | 'agency' | 'admin';
}

export interface BulkApprovalResult {
  success: boolean;
  totalRequested: number;
  approved: number;
  rejected: number;
  skipped: number;
  errors: Array<{
    postId: string;
    reason: string;
  }>;
}

export interface ApprovalBoardItem {
  id: string;
  contentId: string;
  brandId: string;
  brandName: string;
  platform?: string;
  content: {
    headline?: string;
    body?: string;
    cta?: string;
    mediaUrls?: string[];
    caption?: string;
  };
  status: ApprovalBoardStatus;
  workflowStage: string;
  bfsScore?: number;
  complianceFlags: string[];
  scheduledFor?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  requestedChanges?: string;
}

export interface ApprovalBoardResponse {
  items: ApprovalBoardItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ==================== EMAIL PREFERENCES ====================

export interface ClientEmailPreferences {
  id: string;
  clientId: string;
  brandId: string;

  // Notification toggles
  approvalsNeeded: boolean;
  approvalReminders: boolean;
  publishFailures: boolean;
  publishSuccess: boolean;
  weeklyDigest: boolean;

  // Frequency settings
  reminderFrequency: 'immediate' | '24h' | '48h'; // for approval reminders
  digestFrequency: 'daily' | 'weekly' | 'never';

  // Rate limiting
  maxEmailsPerDay: number;
  unsubscribeToken?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ClientNotificationPreference {
  id: string;
  type: 'approval_needed' | 'approval_reminder' | 'publish_failure' | 'publish_success' | 'weekly_digest';
  enabled: boolean;
  frequency: 'immediate' | 'digest' | 'never';
}

// ==================== EMAIL TEMPLATES ====================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: string[];
}

export interface ApprovalEmailData {
  clientName: string;
  brandName: string;
  postTitle: string;
  postContent: string;
  postPlatforms: string[];
  approvalUrl: string;
  agencyName: string;
  agencyLogo?: string;
  brandColor?: string;
  deadline?: string;
  requestedBy?: string;
}

export interface ReminderEmailData {
  clientName: string;
  brandName: string;
  pendingCount: number;
  oldestPendingAge: string; // e.g., "2 days"
  approvalUrl: string;
  agencyName: string;
  agencyLogo?: string;
  brandColor?: string;
}

export interface PublishFailureEmailData {
  clientName: string;
  brandName: string;
  postTitle: string;
  failureReason: string;
  timestamp: string;
  supportUrl?: string;
  agencyName: string;
  agencyLogo?: string;
  brandColor?: string;
}

export interface WeeklyDigestEmailData {
  clientName: string;
  brandName: string;
  weekStart: string;
  weekEnd: string;
  postsPublished: number;
  postsScheduled: number;
  totalEngagement: number;
  topPost?: {
    title: string;
    engagement: number;
    platform: string;
  };
  pendingApprovals: number;
  agencyName: string;
  agencyLogo?: string;
  dashboardUrl: string;
  brandColor?: string;
}

// ==================== EMAIL SERVICE ====================

export interface EmailServiceConfig {
  provider: 'sendgrid' | 'nodemailer';
  enabled: boolean;
  from: string;
  replyTo?: string;
  maxRetries: number;
  retryDelayMs: number;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  templateId?: string;
  variables?: Record<string, unknown>;
  brandId?: string;
  userId?: string;
  notificationType?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retries: number;
}

// ==================== NOTIFICATIONS ====================

export interface WorkflowNotification {
  id: string;
  type: 'approval_requested' | 'approval_reminder' | 'publish_failed' | 'stage_changed';
  brandId: string;
  postId: string;
  userId: string;
  read: boolean;
  sentAt: string;
  metadata: Record<string, unknown>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

// ==================== TELEMETRY ====================

export interface ApprovalMetrics {
  approvals: {
    requested: number;
    approved: number;
    rejected: number;
    pendingCount: number;
    averageTimeToDecision: number; // milliseconds
  };
  bulk: {
    requests: number;
    successCount: number;
    partialFailures: number;
    avgItemsPerRequest: number;
  };
  emails: {
    sent: number;
    failed: number;
    bounced: number;
    unsubscribed: number;
  };
  workflows: {
    started: number;
    completed: number;
    failedCount: number;
  };
}

export interface ApprovalAlert {
  type: 'high_rejection_rate' | 'slow_approvals' | 'email_failures' | 'publish_failures';
  severity: 'warning' | 'critical';
  message: string;
  brandId: string;
  threshold: number;
  current: number;
  timestamp: string;
}
