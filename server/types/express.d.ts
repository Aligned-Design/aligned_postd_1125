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

import { Request } from "express";

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
 * AuthenticatedRequest - Request with authentication context
 * Use this interface for type casting inside middleware that requires auth
 */
export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    email: string;
    role: string;
    brandIds?: string[];
    tenantId?: string;
    workspaceId?: string;
    scopes?: string[];
  };
  user?: {
    id: string;
    email: string;
    role: string;
    brandId?: string;
    brandIds?: string[];
    tenantId?: string;
    workspaceId?: string;
    scopes?: string[];
  };
}

/**
 * BrandScopedRequest - Request with validated brand ID
 * Use this interface for type casting inside middleware that requires brand context
 */
export interface BrandScopedRequest extends AuthenticatedRequest {
  validatedBrandId?: string;
}
