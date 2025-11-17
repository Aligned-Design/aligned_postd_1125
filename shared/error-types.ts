/**
 * Standardized Error Response Types
 *
 * All API errors follow this consistent format to allow clients
 * to handle errors uniformly across the platform
 */

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_INVALID = 'AUTH_INVALID',

  // OAuth Errors
  OAUTH_STATE_INVALID = 'OAUTH_STATE_INVALID',
  OAUTH_STATE_EXPIRED = 'OAUTH_STATE_EXPIRED',
  OAUTH_PLATFORM_MISMATCH = 'OAUTH_PLATFORM_MISMATCH',
  OAUTH_TOKEN_EXCHANGE_FAILED = 'OAUTH_TOKEN_EXCHANGE_FAILED',
  OAUTH_ACCOUNT_INFO_FAILED = 'OAUTH_ACCOUNT_INFO_FAILED',

  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST_BODY = 'INVALID_REQUEST_BODY',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_UUID = 'INVALID_UUID',
  INVALID_ENUM_VALUE = 'INVALID_ENUM_VALUE',

  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // Publishing Errors
  PUBLISHING_FAILED = 'PUBLISHING_FAILED',
  PLATFORM_CONNECTION_FAILED = 'PLATFORM_CONNECTION_FAILED',
  CONTENT_VALIDATION_FAILED = 'CONTENT_VALIDATION_FAILED',
  INVALID_SCHEDULING_TIME = 'INVALID_SCHEDULING_TIME',
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  JOB_ALREADY_PUBLISHED = 'JOB_ALREADY_PUBLISHED',
  JOB_APPROVAL_REQUIRED = 'JOB_APPROVAL_REQUIRED',

  // Media Errors
  MEDIA_UPLOAD_FAILED = 'MEDIA_UPLOAD_FAILED',
  MEDIA_NOT_FOUND = 'MEDIA_NOT_FOUND',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',

  // Analytics Errors
  ANALYTICS_SYNC_FAILED = 'ANALYTICS_SYNC_FAILED',
  PLATFORM_API_ERROR = 'PLATFORM_API_ERROR',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  INSIGHTS_GENERATION_FAILED = 'INSIGHTS_GENERATION_FAILED',

  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',

  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
  code?: string;
}

export interface APIError {
  code: ErrorCode | string;
  message: string;
  statusCode: number;
  details?: unknown;
  validationErrors?: ValidationErrorDetail[];
  recoveryHints?: string[];
  severity?: ErrorSeverity;
}

export interface APIErrorResponse {
  error: APIError;
  requestId: string;
  timestamp: string;
  path?: string;
}

/**
 * HTTP Status Code mapping for error codes
 */
export const ERROR_STATUS_MAP: Record<ErrorCode | string, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.AUTH_EXPIRED]: 401,
  [ErrorCode.AUTH_INVALID]: 401,

  [ErrorCode.OAUTH_STATE_INVALID]: 400,
  [ErrorCode.OAUTH_STATE_EXPIRED]: 401,
  [ErrorCode.OAUTH_PLATFORM_MISMATCH]: 400,
  [ErrorCode.OAUTH_TOKEN_EXCHANGE_FAILED]: 500,
  [ErrorCode.OAUTH_ACCOUNT_INFO_FAILED]: 500,

  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_REQUEST_BODY]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,
  [ErrorCode.INVALID_UUID]: 400,
  [ErrorCode.INVALID_ENUM_VALUE]: 400,

  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.RESOURCE_CONFLICT]: 409,

  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.QUOTA_EXCEEDED]: 429,

  [ErrorCode.PUBLISHING_FAILED]: 500,
  [ErrorCode.PLATFORM_CONNECTION_FAILED]: 503,
  [ErrorCode.CONTENT_VALIDATION_FAILED]: 400,
  [ErrorCode.INVALID_SCHEDULING_TIME]: 400,
  [ErrorCode.JOB_NOT_FOUND]: 404,
  [ErrorCode.JOB_ALREADY_PUBLISHED]: 409,
  [ErrorCode.JOB_APPROVAL_REQUIRED]: 400,

  [ErrorCode.MEDIA_UPLOAD_FAILED]: 500,
  [ErrorCode.MEDIA_NOT_FOUND]: 404,
  [ErrorCode.FILE_TOO_LARGE]: 413,
  [ErrorCode.UNSUPPORTED_FILE_TYPE]: 400,
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: 429,

  [ErrorCode.ANALYTICS_SYNC_FAILED]: 500,
  [ErrorCode.PLATFORM_API_ERROR]: 502,
  [ErrorCode.INVALID_DATE_RANGE]: 400,
  [ErrorCode.INSIGHTS_GENERATION_FAILED]: 500,

  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.TRANSACTION_FAILED]: 500,

  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.TIMEOUT]: 504
};

/**
 * Get HTTP status code for error code
 */
export function getStatusCode(errorCode: ErrorCode | string): number {
  return ERROR_STATUS_MAP[errorCode] || 500;
}

/**
 * Get severity level for error code
 */
export function getSeverity(errorCode: ErrorCode | string): ErrorSeverity {
  const statusCode = getStatusCode(errorCode);

  if (statusCode >= 500) {
    return ErrorSeverity.HIGH;
  } else if (statusCode === 429) {
    return ErrorSeverity.MEDIUM;
  } else if (statusCode >= 400) {
    return ErrorSeverity.LOW;
  }

  return ErrorSeverity.MEDIUM;
}
