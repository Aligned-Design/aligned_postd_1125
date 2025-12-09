/**
 * Error Handling Middleware
 * Centralized error handling with standardized response format
 * Integrates with error-responses.ts for OWASP-compliant error handling
 */

import { Request, Response, NextFunction, RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { ZodError } from "zod";
import {
  ErrorResponse,
  HTTP_STATUS,
  ErrorCode,
  ErrorSeverity,
  sendErrorResponse,
  sendValidationErrorResponse,
  createErrorResponse,
  getSeverityForStatus,
} from "./error-responses";

/**
 * Request ID middleware - adds unique request ID for tracing
 */
export const addRequestId: RequestHandler = (req, _res, next) => {
  const requestId = req.get("X-Request-ID") || uuidv4();
  req.id = requestId;
  next();
};

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public severity: ErrorSeverity = "error",
    public details?: Record<string, unknown>,
    public suggestion?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Type guard for AppError
 */
function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard for ZodError
 */
function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

/**
 * Central error handler middleware
 * Must be registered last in middleware stack
 * 
 * Note: Error handlers have a different signature (err, req, res, next)
 * so we can't use RequestHandler here. This is the standard Express error handler pattern.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id;

  // Ensure we only respond once
  if (res.headersSent) {
    return;
  }

  // Handle AppError (known errors)
  if (isAppError(err)) {
    const errorResponse: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        severity: err.severity,
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId }),
        ...(err.details && { details: err.details }),
        ...(err.suggestion && { suggestion: err.suggestion }),
      },
    };

    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // Handle ZodError (validation errors)
  if (isZodError(err)) {
    const fieldErrors = err.errors.map((error) => ({
      field: error.path.join("."),
      message: error.message,
      code: error.code,
    }));

    const response = {
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: "Request validation failed",
        severity: "warning" as ErrorSeverity,
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId }),
        validationErrors: fieldErrors,
        suggestion: "Please review the validation errors and retry your request",
      },
    };

    res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(response);
    return;
  }

  // Handle native errors
  if (err instanceof SyntaxError && "body" in err) {
    // JSON parsing error
    sendErrorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      ErrorCode.INVALID_FORMAT,
      "Invalid JSON in request body",
      "warning",
      undefined,
      "Please ensure your request body contains valid JSON"
    );
    return;
  }

  // Generic error (unknown error type)
  const statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message =
    err instanceof Error ? err.message : "An unexpected error occurred";

  const errorResponse: ErrorResponse = {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message,
      severity: getSeverityForStatus(statusCode),
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
      suggestion:
        "Please try again later or contact support if the problem persists",
    },
  };

    res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper for route handlers
 * Wraps async route handlers to catch errors and pass to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler (should be registered after all routes)
 */
export const notFoundHandler: RequestHandler = (req, res) => {
  const error = new AppError(
    ErrorCode.NOT_FOUND,
    `Route not found: ${req.method} ${req.path}`,
    HTTP_STATUS.NOT_FOUND,
    "info"
  );

  errorHandler(error, req, res, () => {});
};

/**
 * Validation error helper
 * Creates an AppError from validation error details
 */
export function createValidationError(
  fieldErrors: Array<{ field: string; message: string; code: string }>
): AppError {
  return new AppError(
    ErrorCode.VALIDATION_ERROR,
    "Request validation failed",
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    "warning",
    { validationErrors: fieldErrors },
    "Please review the validation errors and retry your request"
  );
}
