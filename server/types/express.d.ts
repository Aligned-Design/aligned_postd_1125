/**
 * Extended Express Request/Response types
 * Adds custom properties added by middleware
 * 
 * Note: This file uses declaration merging to extend Express types via global namespace.
 * This ensures TypeScript recognizes these properties throughout the codebase.
 * 
 * For Vercel compatibility, we also export explicit interfaces that can be used
 * for type casting inside middleware functions.
 */

import { Request, Response, NextFunction, ParamsDictionary } from "express";
import { ParsedQs } from "qs";
import { Socket } from "net";
import { IncomingHttpHeaders } from "http";

declare global {
  namespace Express {
    interface Request {
      id?: string;
      auth?: {
        userId: string;
        email: string;
        role: string; // Can be Role enum value or UserRole enum value
        brandIds?: string[];
        tenantId?: string;
        workspaceId?: string;
        scopes?: string[];
      };
      user?: {
        id: string;
        email: string;
        role: string; // Can be Role enum value or UserRole enum value
        brandId?: string;
        brandIds?: string[];
        tenantId?: string;
        workspaceId?: string;
        scopes?: string[];
      };
      validatedState?: string;
      validatedBrandId?: string;
    }
  }
}

/**
 * Auth context attached to authenticated requests
 */
export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  brandIds?: string[];
  tenantId?: string;
  workspaceId?: string;
  scopes?: string[];
}

/**
 * User context for backward compatibility
 */
export interface UserContext {
  id: string;
  email: string;
  role: string;
  brandId?: string;
  brandIds?: string[];
  tenantId?: string;
  workspaceId?: string;
  scopes?: string[];
}

/**
 * AuthenticatedRequest - Request with authentication context
 * Use this interface for type casting inside middleware that requires auth
 * 
 * Includes all standard Express Request properties to ensure compatibility
 * when casting from Request to AuthenticatedRequest.
 */
export interface AuthenticatedRequest extends Request {
  // Custom auth properties
  id?: string;
  auth?: AuthContext;
  user?: UserContext;
  validatedState?: string;
  validatedBrandId?: string;
  
  // Standard Express Request properties (re-declared for Vercel compatibility)
  params: ParamsDictionary;
  query: ParsedQs;
  body: any;
  headers: IncomingHttpHeaders;
  ip?: string;
  socket: Socket;
}

/**
 * BrandScopedRequest - Request with validated brand ID
 * Use this interface for type casting inside middleware that requires brand context
 */
export interface BrandScopedRequest extends AuthenticatedRequest {
  validatedBrandId: string;
}

// Re-export Express types for convenience
// Note: These are type-only re-exports for TypeScript
export type { Request, Response, NextFunction } from "express";
