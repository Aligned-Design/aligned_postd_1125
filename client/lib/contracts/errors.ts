/**
 * Standard Error Response Schemas
 */

import { z } from "zod";

/**
 * Standard API error response shape
 * All API errors MUST conform to this structure
 */
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Standard API success response shape
 */
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.record(z.unknown()).optional(),
  });

/**
 * Common error codes
 */
export const ErrorCode = {
  // Auth errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  
  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  
  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  
  // Business logic errors
  INVALID_BRAND: "INVALID_BRAND",
  NO_BRAND_GUIDE: "NO_BRAND_GUIDE",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  
  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * Normalize any error to a consistent shape
 */
export function normalizeError(error: unknown): { message: string; code?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as any).code,
    };
  }
  
  if (typeof error === "string") {
    return { message: error };
  }
  
  if (typeof error === "object" && error !== null) {
    const err = error as any;
    return {
      message: err.message || err.error?.message || "An error occurred",
      code: err.code || err.error?.code,
    };
  }
  
  return { message: "An unknown error occurred" };
}

