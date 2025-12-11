/**
 * Error Response Standardization
 * OWASP-compliant unified error format for all API responses
 * Provides type-safe error handling with consistent structure
 */

import { Response } from "express";

/**
 * Standard HTTP status codes with OWASP mappings
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429, // ✅ Added
  PAYLOAD_TOO_LARGE: 413, // ✅ Added
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502, // ✅ Added
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error severity levels
 */
export type ErrorSeverity = "info" | "warning" | "error" | "critical";

/**
 * Error code enumeration for programmatic handling
 */
export enum ErrorCode {
  // Validation errors (4xx)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",
  OUT_OF_RANGE = "OUT_OF_RANGE",

  // Authentication errors (4xx)
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",

  // Authorization errors (4xx)
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Resource errors (4xx)
  NOT_FOUND = "NOT_FOUND",
  RESOURCE_DELETED = "RESOURCE_DELETED",
  CONFLICT = "CONFLICT",
  DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",
  INVALID_BRAND = "INVALID_BRAND",
  NO_BRAND_GUIDE = "NO_BRAND_GUIDE",
  NO_ACCOUNTS_CONNECTED = "NO_ACCOUNTS_CONNECTED", // No social accounts connected for publishing

  // Rate limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",

  // Configuration errors
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR", // ✅ Added
  NOT_IMPLEMENTED = "NOT_IMPLEMENTED", // ✅ Added
  NO_AI_PROVIDER_CONFIGURED = "NO_AI_PROVIDER_CONFIGURED", // AI API keys missing

  // Server errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  BAD_GATEWAY = "BAD_GATEWAY", // ✅ Added
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    severity: ErrorSeverity;
    timestamp: string;
    requestId?: string;
    details?: Record<string, unknown>;
    suggestion?: string;
  };
}

/**
 * Validation error response (includes field-level errors)
 */
export interface ValidationErrorResponse extends ErrorResponse {
  error: ErrorResponse["error"] & {
    validationErrors: Array<{
      field: string;
      message: string;
      code: string;
    }>;
  };
}

/**
 * Create a standard error response
 */
export function createErrorResponse(
  code: ErrorCode | string,
  message: string,
  severity: ErrorSeverity = "error",
  details?: Record<string, unknown>,
  suggestion?: string
): ErrorResponse {
  return {
    error: {
      code,
      message,
      severity,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
      ...(suggestion && { suggestion }),
    },
  };
}

/**
 * Create a validation error response with field-level errors
 */
export function createValidationErrorResponse(
  fieldErrors: Array<{ field: string; message: string; code: string }>,
  details?: Record<string, unknown>
): ValidationErrorResponse {
  return {
    error: {
      code: ErrorCode.VALIDATION_ERROR,
      message: "Request validation failed",
      severity: "warning",
      timestamp: new Date().toISOString(),
      validationErrors: fieldErrors,
      ...(details && { details }),
      suggestion: "Please review the validation errors and retry your request",
    },
  };
}

/**
 * Send standardized error response
 */
export function sendErrorResponse(
  res: Response,
  statusCode: number,
  code: ErrorCode | string,
  message: string,
  severity: ErrorSeverity = "error",
  details?: Record<string, unknown>,
  suggestion?: string
): void {
  const errorResponse = createErrorResponse(code, message, severity, details, suggestion);
  (res as any).status(statusCode).json(errorResponse);
}

/**
 * Send validation error response
 */
export function sendValidationErrorResponse(
  res: Response,
  fieldErrors: Array<{ field: string; message: string; code: string }>,
  details?: Record<string, unknown>
): void {
  const errorResponse = createValidationErrorResponse(fieldErrors, details);
  (res as any).status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(errorResponse);
}

/**
 * Common error scenarios
 */
export const ErrorScenarios = {
  unauthorized: () => ({
    statusCode: HTTP_STATUS.UNAUTHORIZED,
    code: ErrorCode.UNAUTHORIZED,
    message: "Authentication required",
    severity: "warning" as ErrorSeverity,
    suggestion: "Please provide valid authentication credentials",
  }),

  forbidden: (resource = "resource") => ({
    statusCode: HTTP_STATUS.FORBIDDEN,
    code: ErrorCode.FORBIDDEN,
    message: `You do not have permission to access this ${resource}`,
    severity: "warning" as ErrorSeverity,
    suggestion: "Contact your administrator if you believe this is an error",
  }),

  notFound: (resource = "resource") => ({
    statusCode: HTTP_STATUS.NOT_FOUND,
    code: ErrorCode.NOT_FOUND,
    message: `The requested ${resource} was not found`,
    severity: "info" as ErrorSeverity,
  }),

  conflict: (details: string) => ({
    statusCode: HTTP_STATUS.CONFLICT,
    code: ErrorCode.CONFLICT,
    message: `A conflict occurred: ${details}`,
    severity: "warning" as ErrorSeverity,
  }),

  duplicateResource: (resource = "resource") => ({
    statusCode: HTTP_STATUS.CONFLICT,
    code: ErrorCode.DUPLICATE_RESOURCE,
    message: `A ${resource} with this identifier already exists`,
    severity: "warning" as ErrorSeverity,
  }),

  rateLimitExceeded: (retryAfter?: number) => ({
    statusCode: 429,
    code: ErrorCode.RATE_LIMIT_EXCEEDED,
    message: "Rate limit exceeded. Please try again later",
    severity: "warning" as ErrorSeverity,
    details: retryAfter ? { retryAfter } : undefined,
  }),

  internalError: () => ({
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: ErrorCode.INTERNAL_ERROR,
    message: "An unexpected error occurred",
    severity: "critical" as ErrorSeverity,
    suggestion: "Please try again later or contact support if the problem persists",
  }),

  serviceUnavailable: () => ({
    statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    code: ErrorCode.SERVICE_UNAVAILABLE,
    message: "Service temporarily unavailable",
    severity: "critical" as ErrorSeverity,
    suggestion: "Please try again in a few moments",
  }),

  databaseError: () => ({
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: ErrorCode.DATABASE_ERROR,
    message: "A database error occurred",
    severity: "critical" as ErrorSeverity,
    suggestion: "Please try your request again",
  }),

  externalServiceError: (serviceName: string) => ({
    statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
    code: ErrorCode.EXTERNAL_SERVICE_ERROR,
    message: `Error communicating with ${serviceName}`,
    severity: "error" as ErrorSeverity,
    suggestion: "Please try again later",
  }),

  noAccountsConnected: (platforms?: string[]) => ({
    statusCode: HTTP_STATUS.BAD_REQUEST,
    code: ErrorCode.NO_ACCOUNTS_CONNECTED,
    message: "No connected social accounts found",
    severity: "warning" as ErrorSeverity,
    details: platforms ? { requestedPlatforms: platforms } : undefined,
    suggestion: "Connect Facebook or Instagram in Settings → Linked Accounts before scheduling for auto-publish.",
  }),
};

/**
 * Check if status code indicates an error
 */
export function isErrorStatus(statusCode: number): boolean {
  return statusCode >= 400;
}

/**
 * Get error severity based on HTTP status code
 */
export function getSeverityForStatus(statusCode: number): ErrorSeverity {
  if (statusCode < 400) return "info";
  if (statusCode < 500) return "warning";
  if (statusCode < 600) return "critical";
  return "error";
}
