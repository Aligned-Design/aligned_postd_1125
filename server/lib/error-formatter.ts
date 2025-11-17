/**
 * Error Formatter
 *
 * Converts various error types into standardized API error responses
 */

import { Response, Request, NextFunction } from "express";
import {
  ErrorCode,
  APIError,
  APIErrorResponse,
  ERROR_STATUS_MAP,
  getSeverity,
  ValidationErrorDetail,
} from "@shared/error-types";

interface ErrorFormatOptions {
  requestId?: string;
  path?: string;
  includeStack?: boolean;
}

class ErrorFormatter {
  /**
   * Format and send error response
   */
  sendError(
    res: Response,
    error: Error | APIError | string,
    options: ErrorFormatOptions = {},
  ): void {
    const { requestId, path, includeStack } = options;
    const formattedError = this.formatError(error, includeStack);

    const statusCode = ERROR_STATUS_MAP[formattedError.code] || 500;

    const response: APIErrorResponse = {
      error: formattedError,
      requestId: requestId || "unknown",
      timestamp: new Date().toISOString(),
      ...(path && { path }),
    };

    (res as any).status(statusCode).json(response);
  }

  /**
   * Format error to standard structure
   */
  private formatError(
    error: Error | APIError | string,
    _includeStack = false,
  ): APIError {
    // If already formatted, return as-is
    if (this.isAPIError(error)) {
      return error;
    }

    // If string, treat as generic message
    if (typeof error === "string") {
      return {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: error,
        statusCode: 500,
        severity: getSeverity(ErrorCode.INTERNAL_SERVER_ERROR),
      };
    }

    // Parse error message for OAuth-specific errors
    const message = error.message || "Unknown error";

    if (message.includes("Invalid or expired OAuth state")) {
      return {
        code: ErrorCode.OAUTH_STATE_INVALID,
        message:
          "The OAuth authorization has expired or is invalid. Please try connecting again.",
        statusCode: 400,
        details: { originalError: message },
        recoveryHints: [
          "Start a new connection request",
          "Make sure your browser allows redirects",
          "Check that you authorized the request within 10 minutes",
        ],
        severity: getSeverity(ErrorCode.OAUTH_STATE_INVALID),
      };
    }

    if (message.includes("Platform mismatch")) {
      return {
        code: ErrorCode.OAUTH_PLATFORM_MISMATCH,
        message:
          "The platform in the OAuth response did not match the requested platform.",
        statusCode: 400,
        details: { originalError: message },
        recoveryHints: [
          "Ensure you approved the correct platform",
          "Try connecting again",
        ],
        severity: getSeverity(ErrorCode.OAUTH_PLATFORM_MISMATCH),
      };
    }

    if (message.includes("Token exchange failed")) {
      return {
        code: ErrorCode.OAUTH_TOKEN_EXCHANGE_FAILED,
        message:
          "Failed to exchange the authorization code for an access token.",
        statusCode: 500,
        details: { originalError: message },
        recoveryHints: [
          "Try connecting again",
          "Contact support if problem persists",
        ],
        severity: getSeverity(ErrorCode.OAUTH_TOKEN_EXCHANGE_FAILED),
      };
    }

    if (message.includes("No refresh token available")) {
      return {
        code: ErrorCode.AUTH_EXPIRED,
        message:
          "Your connection has expired and cannot be refreshed. Please reconnect.",
        statusCode: 401,
        details: { originalError: message },
        recoveryHints: [
          "Reconnect your platform account",
          "Check platform permission settings",
        ],
        severity: getSeverity(ErrorCode.AUTH_EXPIRED),
      };
    }

    if (message.includes("Token refresh failed")) {
      return {
        code: ErrorCode.AUTH_EXPIRED,
        message:
          "Failed to refresh your platform connection. Please reconnect.",
        statusCode: 401,
        details: { originalError: message },
        recoveryHints: ["Reconnect your platform account"],
        severity: getSeverity(ErrorCode.AUTH_EXPIRED),
      };
    }

    if (message.includes("Failed to get account info")) {
      return {
        code: ErrorCode.OAUTH_ACCOUNT_INFO_FAILED,
        message:
          "Could not retrieve your account information from the platform.",
        statusCode: 500,
        details: { originalError: message },
        recoveryHints: [
          "Try connecting again",
          "Verify your platform account is active",
        ],
        severity: getSeverity(ErrorCode.OAUTH_ACCOUNT_INFO_FAILED),
      };
    }

    // Default to generic internal server error
    return {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message:
        process.env.NODE_ENV === "development"
          ? message
          : "An unexpected error occurred",
      statusCode: 500,
      details:
        process.env.NODE_ENV === "development"
          ? { error: error.toString() }
          : undefined,
      severity: getSeverity(ErrorCode.INTERNAL_SERVER_ERROR),
    };
  }

  /**
   * Create a validation error
   */
  createValidationError(
    validationErrors: ValidationErrorDetail[],
    message = "Request validation failed",
  ): APIError {
    return {
      code: ErrorCode.VALIDATION_ERROR,
      message,
      statusCode: 400,
      validationErrors,
      details: { errorCount: validationErrors.length },
      severity: getSeverity(ErrorCode.VALIDATION_ERROR),
    };
  }

  /**
   * Create a missing field error
   */
  createMissingFieldError(fieldName: string): APIError {
    return {
      code: ErrorCode.MISSING_REQUIRED_FIELD,
      message: `Required field missing: ${fieldName}`,
      statusCode: 400,
      details: { field: fieldName },
      recoveryHints: [`Provide the ${fieldName} field in your request`],
      severity: getSeverity(ErrorCode.MISSING_REQUIRED_FIELD),
    };
  }

  /**
   * Create a not found error
   */
  createNotFoundError(resourceType: string, identifier: string): APIError {
    return {
      code: ErrorCode.NOT_FOUND,
      message: `${resourceType} not found: ${identifier}`,
      statusCode: 404,
      details: { resourceType, identifier },
      severity: getSeverity(ErrorCode.NOT_FOUND),
    };
  }

  /**
   * Create a conflict error
   */
  createConflictError(message: string, resourceType?: string): APIError {
    return {
      code: ErrorCode.RESOURCE_CONFLICT,
      message,
      statusCode: 409,
      details: { resourceType },
      severity: getSeverity(ErrorCode.RESOURCE_CONFLICT),
    };
  }

  /**
   * Create a rate limit error
   */
  createRateLimitError(retryAfter?: number): APIError {
    return {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: "Rate limit exceeded. Please try again later.",
      statusCode: 429,
      details: { retryAfter },
      recoveryHints: [`Wait ${retryAfter || 60} seconds before retrying`],
      severity: getSeverity(ErrorCode.RATE_LIMIT_EXCEEDED),
    };
  }

  /**
   * Check if error is already formatted
   */
  private isAPIError(error: unknown): error is APIError {
    return (
      error &&
      typeof error === "object" &&
      "code" in error &&
      "message" in error &&
      "statusCode" in error
    );
  }

  /**
   * Log error for monitoring (Sentry, etc.)
   */
  logError(error: Error, context?: Record<string, unknown>): void {
    // In production, send to Sentry or similar
    console.error("Error logged:", {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

// Export singleton instance
export const errorFormatter = new ErrorFormatter();

/**
 * Express error handling middleware
 */
export function errorHandlingMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const isDevelopment = process.env.NODE_ENV === "development";

  errorFormatter.logError(err, {
    path: req.path,
    method: req.method,
    body: isDevelopment ? req.body : undefined,
    query: isDevelopment ? req.query : undefined,
  });

  const requestId = (res.getHeader("X-Request-ID") as string) || "unknown";

  errorFormatter.sendError(res, err, {
    requestId,
    path: req.path,
    includeStack: isDevelopment,
  });
}
