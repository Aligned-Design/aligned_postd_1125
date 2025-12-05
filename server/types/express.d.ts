/**
 * Extended Express Request/Response types
 * Adds custom properties added by middleware
 * 
 * Note: This file uses declaration merging to extend Express types via global namespace.
 * This ensures TypeScript recognizes these properties throughout the codebase.
 */

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
    }
  }
}

// Export empty object to make this a module
export {};
