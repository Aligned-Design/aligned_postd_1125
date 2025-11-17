/**
 * Express Custom Types
 * Extends Express Request/Response types with application-specific properties
 */

import { Request, Response } from "express";
import { AuthContext } from "../lib/auth-context";

declare global {
  namespace Express {
    /**
     * Extended Request interface with custom properties
     */
    interface Request {
      /**
       * Unique request identifier for tracing
       */
      id?: string;

      /**
       * Authenticated user context
       */
      auth?: AuthContext;

      /**
       * Request body (overrides Express default)
       */
      body?: any;

      /**
       * URL parameters
       */
      params?: Record<string, string>;

      /**
       * Query string parameters
       */
      query?: Record<string, any>;

      /**
       * Validated request state
       */
      validatedState?: any;

      /**
       * Uploaded files
       */
      files?: Record<string, any>;
    }

    /**
     * Extended Response interface with custom properties
     */
    interface Response {
      /**
       * Flag indicating if headers have been sent
       */
      headersSent?: boolean;
    }
  }
}

/**
 * Type-safe request casting helper
 */
export function getRequestBody(req: Request): Record<string, any> {
  return (req.body as Record<string, any>) || {};
}

/**
 * Type-safe request params casting helper
 */
export function getRequestParams(req: Request): Record<string, string> {
  return (req.params as Record<string, string>) || {};
}

/**
 * Type-safe request query casting helper
 */
export function getRequestQuery(req: Request): Record<string, any> {
  return (req.query as Record<string, any>) || {};
}

/**
 * Type-safe request files casting helper
 */
export function getRequestFiles(req: Request): Record<string, any> {
  return (req.files as Record<string, any>) || {};
}

export {};
