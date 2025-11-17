/**
 * Webhook Types and Validation Schemas
 * Defines all webhook-related types with Zod validation for type safety
 */

import { z } from 'zod';

// ==================== ENUMS ====================

export const WebhookProvider = z.enum(['zapier', 'make', 'slack', 'hubspot']);
export type WebhookProvider = z.infer<typeof WebhookProvider>;

export const WebhookStatus = z.enum(['pending', 'processing', 'delivered', 'failed', 'dead_letter']);
export type WebhookStatus = z.infer<typeof WebhookStatus>;

export const WebhookAttemptStatus = z.enum(['success', 'failed']);
export type WebhookAttemptStatus = z.infer<typeof WebhookAttemptStatus>;

// ==================== WEBHOOK EVENT SCHEMAS ====================

export const WebhookEventSchema = z.object({
  id: z.string().uuid(),
  brand_id: z.string().min(1),
  provider: WebhookProvider,
  event_type: z.string().min(1),
  payload: z.record(z.unknown()),
  idempotency_key: z.string().min(1),
  status: WebhookStatus,
  attempt_count: z.number().int().min(0),
  max_attempts: z.number().int().min(1).max(10),
  last_error: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  delivered_at: z.string().datetime().nullable(),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

// ==================== WEBHOOK ATTEMPT SCHEMAS ====================

export const WebhookAttemptSchema = z.object({
  id: z.string().uuid(),
  event_id: z.string().uuid(),
  attempt_number: z.number().int().min(1),
  status: WebhookAttemptStatus,
  error: z.string().nullable(),
  response_code: z.number().int().min(100).max(599).nullable(),
  backoff_ms: z.number().int().min(0),
  created_at: z.string().datetime(),
});

export type WebhookAttempt = z.infer<typeof WebhookAttemptSchema>;

// ==================== INCOMING REQUEST SCHEMAS ====================

/**
 * Zapier webhook payload
 * Zapier sends raw JSON in request body
 */
export const ZapierWebhookSchema = z.object({
  action: z.string(),
  data: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
});

/**
 * Make.com webhook payload
 * Make sends JSON with predictable structure
 */
export const MakeWebhookSchema = z.object({
  event: z.string(),
  data: z.record(z.unknown()).optional(),
  webhook_id: z.string().optional(),
});

/**
 * Slack webhook payload (Events API)
 * Slack sends events with metadata
 */
export const SlackWebhookSchema = z.object({
  type: z.enum(['url_verification', 'event_callback']),
  challenge: z.string().optional(),
  token: z.string().optional(),
  team_id: z.string().optional(),
  api_app_id: z.string().optional(),
  event: z.record(z.unknown()).optional(),
  authed_users: z.array(z.string()).optional(),
});

/**
 * HubSpot webhook payload
 * HubSpot sends events with object details
 */
export const HubSpotWebhookSchema = z.object({
  eventId: z.string().uuid(),
  portalId: z.number(),
  subscriptionType: z.string(),
  attemptNumber: z.number().optional(),
  objectId: z.number(),
  changeSource: z.string().optional(),
  timestamp: z.number(),
  changes: z.array(z.record(z.unknown())).optional(),
});

// ==================== WEBHOOK HANDLER SCHEMAS ====================

/**
 * Generic webhook handler request
 * Used for all providers with normalized structure
 */
export const WebhookHandlerRequestSchema = z.object({
  provider: WebhookProvider,
  brandId: z.string().uuid(),
  eventType: z.string(),
  payload: z.record(z.unknown()),
  idempotencyKey: z.string(),
  signature: z.string().optional(),
  timestamp: z.number().optional(),
});

export type WebhookHandlerRequest = z.infer<typeof WebhookHandlerRequestSchema>;

/**
 * Webhook handler response
 */
export const WebhookHandlerResponseSchema = z.object({
  success: z.boolean(),
  eventId: z.string().uuid(),
  status: WebhookStatus,
  message: z.string(),
});

export type WebhookHandlerResponse = z.infer<typeof WebhookHandlerResponseSchema>;

// ==================== WEBHOOK QUERY SCHEMAS ====================

/**
 * Query parameters for webhook logs endpoint
 */
export const WebhookLogsQuerySchema = z.object({
  provider: WebhookProvider.optional(),
  status: WebhookStatus.optional(),
  brandId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type WebhookLogsQuery = z.infer<typeof WebhookLogsQuerySchema>;

/**
 * Webhook event query response
 */
export const WebhookLogsResponseSchema = z.object({
  success: z.boolean(),
  events: z.array(WebhookEventSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

export type WebhookLogsResponse = z.infer<typeof WebhookLogsResponseSchema>;

// ==================== WEBHOOK RETRY CONFIGURATION ====================

export interface WebhookRetryConfig {
  baseDelayMs: number;
  maxDelayMs: number;
  maxAttempts: number;
  backoffMultiplier: number;
}

export const DEFAULT_WEBHOOK_RETRY_CONFIG: WebhookRetryConfig = {
  baseDelayMs: 2000,
  maxDelayMs: 300000, // 5 minutes
  maxAttempts: 5,
  backoffMultiplier: 2,
};

// ==================== WEBHOOK SIGNATURE VERIFICATION ====================

/**
 * Signature verification configuration per provider
 */
export interface SignatureVerificationConfig {
  headerName: string;
  algorithm: 'sha256' | 'sha1';
  encoding: 'hex' | 'base64';
}

export const SIGNATURE_CONFIGS: Record<WebhookProvider, SignatureVerificationConfig> = {
  zapier: {
    headerName: 'x-zapier-signature',
    algorithm: 'sha256',
    encoding: 'hex',
  },
  make: {
    headerName: 'x-hook-secret-key',
    algorithm: 'sha256',
    encoding: 'hex',
  },
  slack: {
    headerName: 'x-slack-signature',
    algorithm: 'sha256',
    encoding: 'hex',
  },
  hubspot: {
    headerName: 'x-hubspot-signature',
    algorithm: 'sha256',
    encoding: 'hex',
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate next retry delay using exponential backoff
 */
export function calculateBackoffDelay(
  attemptNumber: number,
  config: WebhookRetryConfig = DEFAULT_WEBHOOK_RETRY_CONFIG,
): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attemptNumber - 1);
  return Math.min(exponentialDelay, config.maxDelayMs);
}

/**
 * Check if event should be retried
 */
export function shouldRetryWebhook(
  event: WebhookEvent,
): boolean {
  if (event.status === 'delivered') return false;
  if (event.status === 'dead_letter') return false;
  if (event.attempt_count >= event.max_attempts) return false;
  return true;
}

/**
 * Generate idempotency key from provider and event data
 */
export function generateIdempotencyKey(
  provider: WebhookProvider,
  eventId: string,
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  return `${provider}-${eventId}-${ts}`;
}
