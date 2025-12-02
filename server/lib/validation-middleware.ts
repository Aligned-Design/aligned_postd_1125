/**
 * Validation Middleware
 * Express middleware for request validation using Zod schemas
 * Provides consistent error handling and type coercion
 */

import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Validation error response structure
 */
interface ValidationError {
  message: string;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Validates request body against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateBody(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError: ValidationError = {
          message: "Request validation failed",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        };
        return res.status(400).json(validationError);
      }
      next(error);
    }
  };
}

/**
 * Validates request query parameters against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateQuery(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError: ValidationError = {
          message: "Query validation failed",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        };
        return res.status(400).json(validationError);
      }
      next(error);
    }
  };
}

/**
 * Validates request path parameters against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateParams(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError: ValidationError = {
          message: "Path parameter validation failed",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        };
        return res.status(400).json(validationError);
      }
      next(error);
    }
  };
}

/**
 * Combines multiple validators for a single endpoint
 * @param validators - Object containing body, query, and/or params validators
 * @returns Express middleware function
 */
export function validateRequest(validators: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errors: ValidationError["errors"] = [];

    // Validate body
    if (validators.body) {
      try {
        const validated = await validators.body.parseAsync(req.body);
        req.body = validated;
      } catch (error) {
        if (error instanceof ZodError) {
          errors.push(
            ...error.errors.map((err) => ({
              field: `body.${err.path.join(".")}`,
              message: err.message,
              code: err.code,
            }))
          );
        }
      }
    }

    // Validate query
    if (validators.query) {
      try {
        const validated = await validators.query.parseAsync(req.query);
        req.query = validated as any;
      } catch (error) {
        if (error instanceof ZodError) {
          errors.push(
            ...error.errors.map((err) => ({
              field: `query.${err.path.join(".")}`,
              message: err.message,
              code: err.code,
            }))
          );
        }
      }
    }

    // Validate params
    if (validators.params) {
      try {
        const validated = await validators.params.parseAsync(req.params);
        req.params = validated as any;
      } catch (error) {
        if (error instanceof ZodError) {
          errors.push(
            ...error.errors.map((err) => ({
              field: `params.${err.path.join(".")}`,
              message: err.message,
              code: err.code,
            }))
          );
        }
      }
    }

    // If there are errors, return them all at once
    if (errors.length > 0) {
      const validationError: ValidationError = {
        message: "Request validation failed",
        errors,
      };
      return res.status(400).json(validationError);
    }

    next();
  };
}

/**
 * Safely parse and validate data without middleware
 * Useful for internal validation within route handlers
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Parsed data or validation errors
 */
export async function safeValidate(
  schema: ZodSchema,
  data: unknown
): Promise<{ success: true; data: unknown } | { success: false; errors: ValidationError }> {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: {
          message: "Validation failed",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        },
      };
    }
    throw error;
  }
}
