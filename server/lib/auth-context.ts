/**
 * Authentication Context
 * Extracts and validates user authentication context from requests
 * Eliminates hardcoded user IDs and ensures proper multi-tenancy
 */

import { Request } from "express";
import { z } from "zod";

/**
 * User role enumeration
 */
export enum UserRole {
  OWNER = "owner",
  ADMIN = "admin",
  EDITOR = "editor",
  VIEWER = "viewer",
  GUEST = "guest",
}

/**
 * Authentication context schema
 */
const AuthContextSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid email format").optional(),
  brandId: z.string().min(1, "Brand ID is required").optional(),
  role: z
    .enum([
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.EDITOR,
      UserRole.VIEWER,
      UserRole.GUEST,
    ])
    .default(UserRole.VIEWER),
  sessionId: z.string().optional(),
  issuedAt: z.number().optional(),
  expiresAt: z.number().optional(),
});

/**
 * Authenticated context for request
 */
export type AuthContext = z.infer<typeof AuthContextSchema>;

/**
 * Extract user ID from Authorization header
 * Supports both "Bearer <token>" and "token" formats
 */
function extractUserIdFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;

  // Handle "Bearer <token>" format
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Handle raw user ID
  if (authHeader.length > 0) {
    return authHeader;
  }

  return null;
}

/**
 * Extract brand ID from query or path parameters
 */
function extractBrandId(
  req: Request,
  additionalBrandId?: string
): string | undefined {
  // Priority: explicit param > query > header > additional
  // Safe type assertions: Express Request params/query are Record<string, string | undefined>
  const params = req.params as Record<string, string | undefined>;
  const query = req.query as Record<string, string | string[] | undefined>;
  
  const brandIdFromParams = typeof params.brandId === 'string' ? params.brandId : undefined;
  const brandIdFromQuery = typeof query.brandId === 'string' ? query.brandId : undefined;
  
  return (
    brandIdFromParams ||
    brandIdFromQuery ||
    (req.get("X-Brand-ID") as string | undefined) ||
    additionalBrandId
  );
}

/**
 * Extract auth context from request
 * Validates that required fields are present
 */
export function extractAuthContext(req: Request): AuthContext | null {
  const authHeader = req.get("Authorization");
  const userId = extractUserIdFromHeader(authHeader);

  if (!userId) {
    return null;
  }

  const brandId = extractBrandId(req);

  // Create base context
  const context: Partial<AuthContext> = {
    userId,
    email: req.get("X-User-Email") || undefined,
    brandId,
    role: (req.get("X-User-Role") as UserRole | undefined) || UserRole.VIEWER,
    sessionId: req.get("X-Session-ID") || undefined,
  };

  // Parse and validate
  const result = AuthContextSchema.safeParse(context);

  if (!result.success) {
    return null;
  }

  return result.data;
}

/**
 * Validate auth context has required fields
 */
export function validateAuthContext(
  context: AuthContext | null,
  options: {
    requireBrandId?: boolean;
    requireEmail?: boolean;
    minRole?: UserRole;
  } = {}
): { valid: boolean; error?: string } {
  if (!context) {
    return { valid: false, error: "No authentication context found" };
  }

  if (options.requireBrandId && !context.brandId) {
    return { valid: false, error: "Brand ID is required" };
  }

  if (options.requireEmail && !context.email) {
    return { valid: false, error: "Email is required in context" };
  }

  if (options.minRole) {
    const roleHierarchy = [
      UserRole.GUEST,
      UserRole.VIEWER,
      UserRole.EDITOR,
      UserRole.ADMIN,
      UserRole.OWNER,
    ];

    const contextRoleIndex = roleHierarchy.indexOf(context.role);
    const minRoleIndex = roleHierarchy.indexOf(options.minRole);

    if (contextRoleIndex < minRoleIndex) {
      return {
        valid: false,
        error: `Insufficient permissions. Required role: ${options.minRole}, Got: ${context.role}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Ensure auth context is present and valid
 * Use in routes that require authentication
 */
export function requireAuthContext(
  context: AuthContext | null,
  options: {
    requireBrandId?: boolean;
    requireEmail?: boolean;
    minRole?: UserRole;
  } = {}
): { success: boolean; error?: string; context?: AuthContext } {
  const validation = validateAuthContext(context, options);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  return { success: true, context: context! };
}

/**
 * Helper to get safe context for logging (no sensitive data)
 */
export function getSafeAuthContext(
  context: AuthContext | null
): {
  userId: string;
  brandId?: string;
  role: UserRole;
} | null {
  if (!context) return null;

  return {
    userId: context.userId,
    brandId: context.brandId,
    role: context.role,
  };
}

/**
 * Get resource access check (user can access brand resources)
 */
export function canAccessBrand(
  context: AuthContext | null,
  targetBrandId: string
): boolean {
  if (!context) return false;

  // Owner/admin can access any brand
  if (context.role === UserRole.OWNER || context.role === UserRole.ADMIN) {
    return true;
  }

  // Others can only access their own brand
  return context.brandId === targetBrandId;
}

/**
 * Role permission checker
 */
export function hasPermission(
  context: AuthContext | null,
  requiredRole: UserRole
): boolean {
  if (!context) return false;

  const roleHierarchy = [
    UserRole.GUEST,
    UserRole.VIEWER,
    UserRole.EDITOR,
    UserRole.ADMIN,
    UserRole.OWNER,
  ];

  const contextRoleIndex = roleHierarchy.indexOf(context.role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  return contextRoleIndex >= requiredRoleIndex;
}
