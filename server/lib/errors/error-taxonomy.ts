/**
 * Error Taxonomy - Canonical classification system for all partner API errors
 *
 * This system maps platform-specific error codes to a unified taxonomy that drives:
 * - Retry decisions (retryable vs unrecoverable)
 * - Recovery actions (pause, reconnect, backfill)
 * - Alert routing (severity, urgency)
 * - User-facing messages (clear, actionable)
 */

/**
 * Canonical error codes across all platforms
 */
export enum ErrorCode {
  // Authentication & Authorization (user action required)
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_REVOKED = 'AUTH_REVOKED',

  // Permission & Scope Issues
  PERMISSION_INSUFFICIENT = 'PERMISSION_INSUFFICIENT',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  SCOPE_MISSING = 'SCOPE_MISSING',

  // App-level Deauthorization
  APP_DEAUTHORIZED = 'APP_DEAUTHORIZED',
  APP_SUSPENDED = 'APP_SUSPENDED',

  // Rate Limiting (retryable with backoff)
  RATE_LIMIT_429 = 'RATE_LIMIT_429',
  RATE_LIMIT_QUOTA_EXCEEDED = 'RATE_LIMIT_QUOTA_EXCEEDED',

  // Server Errors (retryable)
  PARTNER_5XX = 'PARTNER_5XX',
  PARTNER_TIMEOUT = 'PARTNER_TIMEOUT',
  PARTNER_UNAVAILABLE = 'PARTNER_UNAVAILABLE',

  // Client Errors (non-retryable)
  PAYLOAD_INVALID_4XX = 'PAYLOAD_INVALID_4XX',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_DELETED = 'RESOURCE_DELETED',
  UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION',

  // Network & Timeout Issues
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SSL_ERROR = 'SSL_ERROR',

  // Webhook Failures
  WEBHOOK_DELIVERY_FAILED = 'WEBHOOK_DELIVERY_FAILED',
  WEBHOOK_PARSE_ERROR = 'WEBHOOK_PARSE_ERROR',
  WEBHOOK_SIGNATURE_INVALID = 'WEBHOOK_SIGNATURE_INVALID',

  // System Errors
  UNKNOWN = 'UNKNOWN',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

/**
 * Error action - what the system should do
 */
export enum ErrorAction {
  // Automatically handle
  RETRY_WITH_BACKOFF = 'RETRY_WITH_BACKOFF',
  RETRY_IMMEDIATELY = 'RETRY_IMMEDIATELY',

  // Require user action
  PAUSE_CHANNEL = 'PAUSE_CHANNEL',
  TRIGGER_RECONNECT = 'TRIGGER_RECONNECT',
  ALERT_USER = 'ALERT_USER',

  // Manual review
  ESCALATE_TO_SUPPORT = 'ESCALATE_TO_SUPPORT',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
}

/**
 * Error severity for alerting and triage
 */
export enum ErrorSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

/**
 * Classified error with actions and metadata
 */
export interface ClassifiedError {
  code: ErrorCode;
  action: ErrorAction;
  severity: ErrorSeverity;
  retryable: boolean;
  maxRetries: number;
  backoffBase: number; // milliseconds
  backoffMultiplier: number;
  userMessage: string;
  systemMessage: string;
  requiresReauth: boolean;
  pausesChannel: boolean;
}

/**
 * Error taxonomy mapping
 */
export const ERROR_TAXONOMY: Record<ErrorCode, ClassifiedError> = {
  // ========================================
  // Authentication & Authorization
  // ========================================
  [ErrorCode.AUTH_EXPIRED]: {
    code: ErrorCode.AUTH_EXPIRED,
    action: ErrorAction.TRIGGER_RECONNECT,
    severity: ErrorSeverity.HIGH,
    retryable: false,
    maxRetries: 0,
    backoffBase: 0,
    backoffMultiplier: 0,
    userMessage:
      'Your connection has expired. Please reconnect to refresh your credentials.',
    systemMessage: 'OAuth token expired; requires user reconnection',
    requiresReauth: true,
    pausesChannel: true,
  },

  [ErrorCode.AUTH_INVALID]: {
    code: ErrorCode.AUTH_INVALID,
    action: ErrorAction.TRIGGER_RECONNECT,
    severity: ErrorSeverity.HIGH,
    retryable: false,
    maxRetries: 0,
    backoffBase: 0,
    backoffMultiplier: 0,
    userMessage:
      'Your authentication is invalid. Please reconnect your account.',
    systemMessage: 'OAuth token is invalid; user needs to re-authenticate',
    requiresReauth: true,
    pausesChannel: true,
  },

  [ErrorCode.AUTH_REVOKED]: {
    code: ErrorCode.AUTH_REVOKED,
    action: ErrorAction.TRIGGER_RECONNECT,
    severity: ErrorSeverity.HIGH,
    retryable: false,
    maxRetries: 0,
    backoffBase: 0,
    backoffMultiplier: 0,
    userMessage: 'Your authorization was revoked. Please reconnect.',
    systemMessage: 'User revoked OAuth grant; requires new authentication',
    requiresReauth: true,
    pausesChannel: true,
  },

  // ========================================
  // Permission & Scope Issues
  // ========================================
  [ErrorCode.PERMISSION_INSUFFICIENT]: {
    code: ErrorCode.PERMISSION_INSUFFICIENT,
    action: ErrorAction.TRIGGER_RECONNECT,
    severity: ErrorSeverity.HIGH,
    retryable: false,
    maxRetries: 0,
    backoffBase: 0,
    backoffMultiplier: 0,
    userMessage:
      'You need additional permissions. Please reconnect and grant the required scopes.',
    systemMessage: 'Insufficient OAuth scopes; user must reconnect with broader scopes',
    requiresReauth: true,
    pausesChannel: true,
  },

  [ErrorCode.PERMISSION_CHANGED]: {
    code: ErrorCode.PERMISSION_CHANGED,
    action: ErrorAction.TRIGGER_RECONNECT,
    severity: ErrorSeverity.HIGH,
    retryable: false,
    maxRetries: 0,
    backoffBase: 0,
    backoffMultiplier: 0,
    userMessage:
      'Your permissions have changed on the platform. Please reconnect to update.',
    systemMessage: 'Platform permissions changed; user must reconnect',
    requiresReauth: true,
    pausesChannel: true,
  },

  [ErrorCode.SCOPE_MISSING]: {
    code: ErrorCode.SCOPE_MISSING,
    action: ErrorAction.TRIGGER_RECONNECT,
    severity: ErrorSeverity.HIGH,
    retryable: false,
    maxRetries: 0,
    backoffBase: 0,
    backoffMultiplier: 0,
    userMessage:
      'Required scopes are missing. Please reconnect and enable all requested permissions.',
    systemMessage: 'Required OAuth scopes not granted; needs reconnection',
    requiresReauth: true,
    pausesChannel: true,
  },

  // ========================================
  // App-level Deauthorization
  // ========================================
  [ErrorCode.APP_DEAUTHORIZED]: {
    code: ErrorCode.APP_DEAUTHORIZED,
    action: ErrorAction.ESCALATE_TO_SUPPORT,
    severity: ErrorSeverity.CRITICAL,
    retryable: false,
    maxRetries: 0,
    backoffBase: 0,
    backoffMultiplier: 0,
    userMessage:
      'The integration has been deauthorized. Please contact support.',
    systemMessage: 'Application was deauthorized by platform',
    requiresReauth: false,
    pausesChannel: true,
  },

  [ErrorCode.APP_SUSPENDED]: {
    code: ErrorCode.APP_SUSPENDED,
    action: ErrorAction.ESCALATE_TO_SUPPORT,
    severity: ErrorSeverity.CRITICAL,
    retryable: false,
    maxRetries: 0,
    backoffBase: 0,
    backoffMultiplier: 0,
    userMessage:
      'The integration has been suspended. Please contact support.',
    systemMessage: 'Application was suspended by platform',
    requiresReauth: false,
    pausesChannel: true,
  },

  // ========================================
  // Rate Limiting (retryable)
  // ========================================
  [ErrorCode.RATE_LIMIT_429]: {
    code: ErrorCode.RATE_LIMIT_429,
    action: ErrorAction.RETRY_WITH_BACKOFF,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    maxRetries: 4,
    backoffBase: 1000, // 1 second
    backoffMultiplier: 3, // 1s, 3s, 9s, 27s
    userMessage:
      'We are temporarily rate-limited. Your request will be retried shortly.',
    systemMessage: 'HTTP 429 Too Many Requests; using exponential backoff',
    requiresReauth: false,
    pausesChannel: false,
  },

  [ErrorCode.RATE_LIMIT_QUOTA_EXCEEDED]: {
    code: ErrorCode.RATE_LIMIT_QUOTA_EXCEEDED,
    action: ErrorAction.RETRY_WITH_BACKOFF,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    maxRetries: 4,
    backoffBase: 1000,
    backoffMultiplier: 3,
    userMessage:
      'Your quota for this time period has been reached. Requests will resume shortly.',
    systemMessage: 'Rate limit quota exceeded; exponential backoff applied',
    requiresReauth: false,
    pausesChannel: false,
  },

  // ========================================
  // Server Errors (retryable)
  // ========================================
  [ErrorCode.PARTNER_5XX]: {
    code: ErrorCode.PARTNER_5XX,
    action: ErrorAction.RETRY_WITH_BACKOFF,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    maxRetries: 4,
    backoffBase: 1000,
    backoffMultiplier: 3,
    userMessage:
      'The platform is experiencing issues. Your request will be retried.',
    systemMessage: 'Partner API returned 5xx error; exponential backoff applied',
    requiresReauth: false,
    pausesChannel: false,
  },

  [ErrorCode.PARTNER_TIMEOUT]: {
    code: ErrorCode.PARTNER_TIMEOUT,
    action: ErrorAction.RETRY_IMMEDIATELY,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    maxRetries: 3,
    backoffBase: 500, // Shorter backoff for timeouts
    backoffMultiplier: 2,
    userMessage: 'Request timed out. Retrying...',
    systemMessage: 'Partner API timeout; immediate retry with short backoff',
    requiresReauth: false,
    pausesChannel: false,
  },

  [ErrorCode.PARTNER_UNAVAILABLE]: {
    code: ErrorCode.PARTNER_UNAVAILABLE,
    action: ErrorAction.RETRY_WITH_BACKOFF,
    severity: ErrorSeverity.HIGH,
    retryable: true,
    maxRetries: 4,
    backoffBase: 2000, // Longer initial backoff for unavailability
    backoffMultiplier: 2,
    userMessage:
      'The platform is currently unavailable. Your request will be retried.',
    systemMessage: 'Partner API unavailable (503); exponential backoff applied',
    requiresReauth: false,
    pausesChannel: false,
  },

  // ========================================
  // Client Errors (non-retryable)
  // ========================================
  [ErrorCode.PAYLOAD_INVALID_4XX]: {
    code: ErrorCode.PAYLOAD_INVALID_4XX,
    action: ErrorAction.MANUAL_REVIEW,
    severity: ErrorSeverity.HIGH,
    retryable: false,
    maxRetries: 0,
    backoffBase: 0,
    backoffMultiplier: 0,
    userMessage: 'Your request is invalid. Please review and try again.',
    systemMessage: 'Invalid request payload (4xx client error)',
    requiresReauth: false,
    pausesChannel: false,
  },

  [ErrorCode.RESOURCE_NOT_FOUND]: {
    code: ErrorCode.RESOURCE_NOT_FOUND,
    action: ErrorAction.MANUAL_REVIEW,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    maxRetries: 0,
    backoffBase: 0,
    backoffMultiplier: 0,
    userMessage: 'The target resource was not found. It may have been deleted.',
    systemMessage: 'Resource not found (HTTP 404)',
    requiresReauth: false,
    pausesChannel: false,
  },

  [ErrorCode.RESOURCE_DELETED]: {
    code: ErrorCode.RESOURCE_DELETED,
    action: ErrorAction.ALERT_USER,
    severity: ErrorSeverity.LOW,
    retryable: false,
    maxRetries: 0,
    backoffBase: 0,
    backoffMultiplier: 0,
    userMessage: 'The resource has been deleted on the platform.',
    systemMessage: 'Resource was deleted',
    requiresReauth: false,
    pausesChannel: false,
  },

  [ErrorCode.UNSUPPORTED_OPERATION]: {
    code: ErrorCode.UNSUPPORTED_OPERATION,
    action: ErrorAction.ALERT_USER,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    maxRetries: 0,
    backoffBase: 0,
    backoffMultiplier: 0,
    userMessage: 'This operation is not supported for this account type.',
    systemMessage: 'Operation not supported by platform for this account',
    requiresReauth: false,
    pausesChannel: false,
  },

  // ========================================
  // Network & Timeout Issues
  // ========================================
  [ErrorCode.TIMEOUT]: {
    code: ErrorCode.TIMEOUT,
    action: ErrorAction.RETRY_IMMEDIATELY,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    maxRetries: 3,
    backoffBase: 500,
    backoffMultiplier: 2,
    userMessage: 'Request timed out. Retrying...',
    systemMessage: 'Network timeout; immediate retry',
    requiresReauth: false,
    pausesChannel: false,
  },

  [ErrorCode.NETWORK_ERROR]: {
    code: ErrorCode.NETWORK_ERROR,
    action: ErrorAction.RETRY_WITH_BACKOFF,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    maxRetries: 4,
    backoffBase: 1000,
    backoffMultiplier: 3,
    userMessage: 'Network connection failed. Retrying...',
    systemMessage: 'Network connectivity error; exponential backoff',
    requiresReauth: false,
    pausesChannel: false,
  },

  [ErrorCode.SSL_ERROR]: {
    code: ErrorCode.SSL_ERROR,
    action: ErrorAction.RETRY_WITH_BACKOFF,
    severity: ErrorSeverity.HIGH,
    retryable: true,
    maxRetries: 2,
    backoffBase: 2000,
    backoffMultiplier: 2,
    userMessage: 'SSL connection error. Retrying...',
    systemMessage: 'SSL/TLS error; limited retries',
    requiresReauth: false,
    pausesChannel: false,
  },

  // ========================================
  // Webhook Failures
  // ========================================
  [ErrorCode.WEBHOOK_DELIVERY_FAILED]: {
    code: ErrorCode.WEBHOOK_DELIVERY_FAILED,
    action: ErrorAction.RETRY_WITH_BACKOFF,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    maxRetries: 4,
    backoffBase: 1000,
    backoffMultiplier: 3,
    userMessage: 'Failed to deliver webhook. Will retry.',
    systemMessage: 'Webhook delivery failed; exponential backoff',
    requiresReauth: false,
    pausesChannel: false,
  },

  [ErrorCode.WEBHOOK_PARSE_ERROR]: {
    code: ErrorCode.WEBHOOK_PARSE_ERROR,
    action: ErrorAction.ALERT_USER,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    maxRetries: 0,
    backoffBase: 0,
    backoffMultiplier: 0,
    userMessage: 'Webhook data could not be parsed.',
    systemMessage: 'Failed to parse webhook payload',
    requiresReauth: false,
    pausesChannel: false,
  },

  [ErrorCode.WEBHOOK_SIGNATURE_INVALID]: {
    code: ErrorCode.WEBHOOK_SIGNATURE_INVALID,
    action: ErrorAction.ALERT_USER,
    severity: ErrorSeverity.HIGH,
    retryable: false,
    maxRetries: 0,
    backoffBase: 0,
    backoffMultiplier: 0,
    userMessage: 'Webhook signature validation failed.',
    systemMessage: 'Invalid webhook signature (possible security issue)',
    requiresReauth: false,
    pausesChannel: false,
  },

  // ========================================
  // System Errors
  // ========================================
  [ErrorCode.UNKNOWN]: {
    code: ErrorCode.UNKNOWN,
    action: ErrorAction.RETRY_WITH_BACKOFF,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    maxRetries: 3,
    backoffBase: 1000,
    backoffMultiplier: 2,
    userMessage: 'An unexpected error occurred. Retrying...',
    systemMessage: 'Unknown error; conservative retry strategy',
    requiresReauth: false,
    pausesChannel: false,
  },

  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    action: ErrorAction.RETRY_WITH_BACKOFF,
    severity: ErrorSeverity.HIGH,
    retryable: true,
    maxRetries: 4,
    backoffBase: 1000,
    backoffMultiplier: 3,
    userMessage: 'Internal server error. Retrying...',
    systemMessage: 'Internal server error (HTTP 500); exponential backoff',
    requiresReauth: false,
    pausesChannel: false,
  },
};

/**
 * Get taxonomy entry for an error code
 */
export function getTaxonomyEntry(code: ErrorCode): ClassifiedError {
  return ERROR_TAXONOMY[code] || ERROR_TAXONOMY[ErrorCode.UNKNOWN];
}

/**
 * Check if error is retryable
 */
export function isRetryable(code: ErrorCode): boolean {
  return getTaxonomyEntry(code).retryable;
}

/**
 * Check if error requires user re-authentication
 */
export function requiresReauth(code: ErrorCode): boolean {
  return getTaxonomyEntry(code).requiresReauth;
}

/**
 * Check if error should pause the channel
 */
export function pausesChannel(code: ErrorCode): boolean {
  return getTaxonomyEntry(code).pausesChannel;
}

/**
 * Get user-friendly message for error code
 */
export function getUserMessage(code: ErrorCode): string {
  return getTaxonomyEntry(code).userMessage;
}
