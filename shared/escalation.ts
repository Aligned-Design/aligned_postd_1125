/**
 * Escalation Types & Validation
 * Defines escalation rules, events, and workflow configuration
 */

import { z } from 'zod';

// ==================== ENUMS ====================

export const EscalationRuleType = {
  REMINDER_24H: 'reminder_24h',
  REMINDER_48H: 'reminder_48h',
  ESCALATION_48H: 'escalation_48h',
  ESCALATION_96H: 'escalation_96h',
  CUSTOM: 'custom',
} as const;

export type EscalationRuleType = typeof EscalationRuleType[keyof typeof EscalationRuleType];

export const EscalationTargetType = {
  APPROVAL: 'approval',
  POST: 'post',
  WORKFLOW: 'workflow',
} as const;

export type EscalationTargetType = typeof EscalationTargetType[keyof typeof EscalationTargetType];

export const EscalationLevel = {
  REMINDER_24H: 'reminder_24h',
  REMINDER_48H: 'reminder_48h',
  ESCALATION_48H: 'escalation_48h',
  ESCALATION_96H: 'escalation_96h',
} as const;

export type EscalationLevel = typeof EscalationLevel[keyof typeof EscalationLevel];

export const EscalationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  RESOLVED: 'resolved',
} as const;

export type EscalationStatus = typeof EscalationStatus[keyof typeof EscalationStatus];

export const EscalationRole = {
  MANAGER: 'manager',
  ADMIN: 'admin',
  CUSTOM: 'custom',
} as const;

export type EscalationRole = typeof EscalationRole[keyof typeof EscalationRole];

export const NotificationType = {
  EMAIL: 'email',
  SLACK: 'slack',
  WEBHOOK: 'webhook',
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const EscalationAction = {
  CREATED: 'created',
  SCHEDULED: 'scheduled',
  SENT: 'sent',
  FAILED: 'failed',
  RESOLVED: 'resolved',
  ACKNOWLEDGED: 'acknowledged',
} as const;

export type EscalationAction = typeof EscalationAction[keyof typeof EscalationAction];

// ==================== SCHEMAS ====================

export const EscalationRuleSchema = z.object({
  id: z.string().uuid(),
  brand_id: z.string().uuid(),
  rule_type: z.enum(['reminder_24h', 'reminder_48h', 'escalation_48h', 'escalation_96h', 'custom']),
  trigger_hours: z.number().int().min(1).max(720), // Max 30 days
  target_type: z.enum(['approval', 'post', 'workflow']).default('approval'),
  escalate_to_role: z.enum(['manager', 'admin', 'custom']).default('manager'),
  escalate_to_user_id: z.string().uuid().optional(),
  notify_via: z.array(z.enum(['email', 'slack', 'webhook'])).default(['email']),
  custom_escalate_endpoint: z.string().url().optional(),
  webhook_secret: z.string().optional(),
  enabled: z.boolean().default(true),
  send_email: z.boolean().default(true),
  send_slack: z.boolean().default(false),
  override_reminder_frequency: z.enum(['immediate', '24h', '48h', 'weekly']).optional(),
  override_max_emails_per_day: z.number().int().min(1).optional(),
  respect_timezone: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().optional(),
});

export type EscalationRule = z.infer<typeof EscalationRuleSchema>;

export const CreateEscalationRuleSchema = EscalationRuleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  created_by: true,
});

export type CreateEscalationRule = z.infer<typeof CreateEscalationRuleSchema>;

export const UpdateEscalationRuleSchema = CreateEscalationRuleSchema.partial();

export const EscalationEventSchema = z.object({
  id: z.string().uuid(),
  brand_id: z.string().uuid(),
  approval_id: z.string().uuid().optional(),
  post_id: z.string().uuid().optional(),
  rule_id: z.string().uuid(),
  escalation_level: z.enum(['reminder_24h', 'reminder_48h', 'escalation_48h', 'escalation_96h']),
  status: z.enum(['pending', 'sent', 'failed', 'resolved']).default('pending'),
  escalated_to_role: z.enum(['manager', 'admin', 'custom']).optional(),
  escalated_to_user_id: z.string().uuid().optional(),
  notification_type: z.enum(['email', 'slack', 'webhook']).optional(),
  triggered_at: z.string().datetime(),
  scheduled_send_at: z.string().datetime().optional(),
  sent_at: z.string().datetime().optional(),
  resolved_at: z.string().datetime().optional(),
  resolved_by: z.string().uuid().optional(),
  delivery_attempt_count: z.number().int().min(0).default(0),
  last_delivery_error: z.string().optional(),
  response_metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type EscalationEvent = z.infer<typeof EscalationEventSchema>;

export const CreateEscalationEventSchema = EscalationEventSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial({
  sent_at: true,
  resolved_at: true,
  resolved_by: true,
});

export type CreateEscalationEvent = z.infer<typeof CreateEscalationEventSchema>;

export const EscalationHistorySchema = z.object({
  id: z.string().uuid(),
  brand_id: z.string().uuid(),
  escalation_event_id: z.string().uuid(),
  action: z.enum(['created', 'scheduled', 'sent', 'failed', 'resolved', 'acknowledged']),
  actor: z.string().uuid().optional(),
  reason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
});

export type EscalationHistory = z.infer<typeof EscalationHistorySchema>;

// ==================== REQUEST/RESPONSE SCHEMAS ====================

export const CreateEscalationRequestSchema = z.object({
  approval_id: z.string().uuid(),
  rule_id: z.string().uuid(),
  escalation_level: z.enum(['reminder_24h', 'reminder_48h', 'escalation_48h', 'escalation_96h']),
  scheduled_send_at: z.string().datetime().optional(),
  timezone: z.string().default('UTC'),
});

export type CreateEscalationRequest = z.infer<typeof CreateEscalationRequestSchema>;

export const UpdateEscalationEventSchema = z.object({
  status: z.enum(['pending', 'sent', 'failed', 'resolved']).optional(),
  resolved_by: z.string().uuid().optional(),
  reason: z.string().optional(),
});

export type UpdateEscalationEvent = z.infer<typeof UpdateEscalationEventSchema>;

export const EscalationQuerySchema = z.object({
  brand_id: z.string().uuid(),
  approval_id: z.string().uuid().optional(),
  post_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'sent', 'failed', 'resolved']).optional(),
  escalation_level: z.enum(['reminder_24h', 'reminder_48h', 'escalation_48h', 'escalation_96h']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).default(50),
  offset: z.number().int().min(0).default(0),
});

export type EscalationQuery = z.infer<typeof EscalationQuerySchema>;

// ==================== ESCALATION CONFIGURATION ====================

export interface EscalationConfig {
  enabled: boolean;
  intervalMs: number; // How often to check for pending escalations (default: 60s)
  maxAgeHours: number; // Only process escalations from last N hours (default: 168 = 1 week)
  maxConcurrent: number; // Max events to process per batch (default: 50)
  respectTimezone: boolean; // Adjust scheduled time per brand timezone (default: true)
}

export const DEFAULT_ESCALATION_CONFIG: EscalationConfig = {
  enabled: true,
  intervalMs: 60000, // Check every 60 seconds
  maxAgeHours: 168, // Process escalations from last 7 days
  maxConcurrent: 50, // Process max 50 escalations per batch
  respectTimezone: true,
};

// ==================== DEFAULT ESCALATION RULES ====================

export interface DefaultEscalationRuleSet {
  reminder_24h: Omit<CreateEscalationRule, 'brand_id'>;
  reminder_48h: Omit<CreateEscalationRule, 'brand_id'>;
  escalation_48h: Omit<CreateEscalationRule, 'brand_id'>;
  escalation_96h: Omit<CreateEscalationRule, 'brand_id'>;
}

export const DEFAULT_ESCALATION_RULES: DefaultEscalationRuleSet = {
  reminder_24h: {
    rule_type: 'reminder_24h',
    trigger_hours: 24,
    target_type: 'approval',
    escalate_to_role: 'manager',
    notify_via: ['email'],
    send_email: true,
    send_slack: false,
    enabled: true,
    respect_timezone: true,
  },
  reminder_48h: {
    rule_type: 'reminder_48h',
    trigger_hours: 48,
    target_type: 'approval',
    escalate_to_role: 'manager',
    notify_via: ['email', 'slack'],
    send_email: true,
    send_slack: true,
    enabled: true,
    respect_timezone: true,
  },
  escalation_48h: {
    rule_type: 'escalation_48h',
    trigger_hours: 48,
    target_type: 'approval',
    escalate_to_role: 'admin',
    notify_via: ['email', 'slack'],
    send_email: true,
    send_slack: true,
    enabled: true,
    respect_timezone: true,
  },
  escalation_96h: {
    rule_type: 'escalation_96h',
    trigger_hours: 96,
    target_type: 'approval',
    escalate_to_role: 'admin',
    notify_via: ['email', 'slack'],
    send_email: true,
    send_slack: true,
    enabled: true,
    respect_timezone: true,
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate when an escalation should be scheduled based on creation time and trigger hours
 */
export function calculateEscalationTime(
  createdAt: Date | string,
  triggerHours: number,
  _timezone?: string,
): Date {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const scheduled = new Date(created.getTime() + triggerHours * 60 * 60 * 1000);
  return scheduled;
}

/**
 * Check if an escalation should be triggered now
 */
export function shouldTriggerEscalation(
  scheduledTime: Date | string,
  currentTime: Date = new Date(),
): boolean {
  const scheduled = typeof scheduledTime === 'string' ? new Date(scheduledTime) : scheduledTime;
  return scheduled <= currentTime;
}

/**
 * Get escalation level label
 */
export function getEscalationLevelLabel(level: EscalationLevel): string {
  switch (level) {
    case 'reminder_24h':
      return '24-Hour Reminder';
    case 'reminder_48h':
      return '48-Hour Reminder';
    case 'escalation_48h':
      return '48-Hour Escalation';
    case 'escalation_96h':
      return '96-Hour Escalation';
    default:
      return level;
  }
}

/**
 * Get role label
 */
export function getRoleLabel(role: EscalationRole): string {
  switch (role) {
    case 'manager':
      return 'Manager';
    case 'admin':
      return 'Administrator';
    case 'custom':
      return 'Custom';
    default:
      return role;
  }
}

/**
 * Determine if escalation should bypass quiet hours or respects preferences
 */
export function shouldRespectNotificationPreferences(
  escalationLevel: EscalationLevel,
): boolean {
  // Escalations (not reminders) should override quiet hours
  return !escalationLevel.includes('escalation');
}

/**
 * Calculate next escalation level after current
 */
export function getNextEscalationLevel(currentLevel: EscalationLevel): EscalationLevel | null {
  const sequence: EscalationLevel[] = ['reminder_24h', 'reminder_48h', 'escalation_48h', 'escalation_96h'];
  const currentIndex = sequence.indexOf(currentLevel);
  if (currentIndex === -1 || currentIndex === sequence.length - 1) {
    return null;
  }
  return sequence[currentIndex + 1];
}
