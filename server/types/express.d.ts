/**
 * Extended Express Request/Response types
 * Adds custom properties added by middleware
 * 
 * Note: This file uses declaration merging to extend Express types.
 * Do not import types from other modules here - use string unions instead.
 */

declare module "express-serve-static-core" {
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
  }
}
