import { RequestHandler, Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/express.d";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";

/**
 * User roles in the system
 */
export enum Role {
  SUPERADMIN = "superadmin",
  OWNER = "owner",
  ADMIN = "admin",
  AGENCY_ADMIN = "agency_admin",
  BRAND_MANAGER = "brand_manager",
  CREATOR = "creator",
  CLIENT_VIEWER = "client_viewer",
}

/**
 * Permissions mapped to actions
 */
export enum Permission {
  // Content permissions
  CREATE_CONTENT = "content:create",
  EDIT_CONTENT = "content:edit",
  DELETE_CONTENT = "content:delete",
  APPROVE_CONTENT = "content:approve",
  PUBLISH_CONTENT = "content:publish",
  VIEW_CONTENT = "content:view",

  // Brand permissions
  MANAGE_BRAND = "brand:manage",
  VIEW_BRAND = "brand:view",
  EDIT_BRAND_SETTINGS = "brand:settings",

  // User/Team permissions
  MANAGE_USERS = "users:manage",
  VIEW_USERS = "users:view",
  INVITE_USERS = "users:invite",

  // Integration permissions
  MANAGE_INTEGRATIONS = "integrations:manage",
  VIEW_INTEGRATIONS = "integrations:view",

  // Analytics permissions
  VIEW_ANALYTICS = "analytics:view",
  EXPORT_ANALYTICS = "analytics:export",

  // Billing permissions
  MANAGE_BILLING = "billing:manage",
  VIEW_BILLING = "billing:view",

  // Admin permissions
  MANAGE_WHITE_LABEL = "admin:white_label",
  VIEW_AUDIT_LOGS = "admin:audit_logs",
  MANAGE_SYSTEM = "admin:system",
}

/**
 * Role to permissions mapping
 */
const rolePermissions: Record<Role, Permission[]> = {
  [Role.SUPERADMIN]: Object.values(Permission), // All permissions

  [Role.OWNER]: [
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.APPROVE_CONTENT,
    Permission.PUBLISH_CONTENT,
    Permission.VIEW_CONTENT,
    Permission.MANAGE_BRAND,
    Permission.VIEW_BRAND,
    Permission.EDIT_BRAND_SETTINGS,
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.INVITE_USERS,
    Permission.MANAGE_INTEGRATIONS,
    Permission.VIEW_INTEGRATIONS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.MANAGE_BILLING,
    Permission.VIEW_BILLING,
  ],

  [Role.ADMIN]: [
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.APPROVE_CONTENT,
    Permission.PUBLISH_CONTENT,
    Permission.VIEW_CONTENT,
    Permission.MANAGE_BRAND,
    Permission.VIEW_BRAND,
    Permission.EDIT_BRAND_SETTINGS,
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.INVITE_USERS,
    Permission.MANAGE_INTEGRATIONS,
    Permission.VIEW_INTEGRATIONS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.MANAGE_BILLING,
    Permission.VIEW_BILLING,
  ],

  [Role.AGENCY_ADMIN]: [
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.APPROVE_CONTENT,
    Permission.PUBLISH_CONTENT,
    Permission.VIEW_CONTENT,
    Permission.MANAGE_BRAND,
    Permission.VIEW_BRAND,
    Permission.EDIT_BRAND_SETTINGS,
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.INVITE_USERS,
    Permission.MANAGE_INTEGRATIONS,
    Permission.VIEW_INTEGRATIONS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.MANAGE_BILLING,
    Permission.VIEW_BILLING,
    Permission.MANAGE_WHITE_LABEL,
    Permission.VIEW_AUDIT_LOGS,
  ],

  [Role.BRAND_MANAGER]: [
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.APPROVE_CONTENT,
    Permission.PUBLISH_CONTENT,
    Permission.VIEW_CONTENT,
    Permission.VIEW_BRAND,
    Permission.EDIT_BRAND_SETTINGS,
    Permission.VIEW_USERS,
    Permission.INVITE_USERS,
    Permission.MANAGE_INTEGRATIONS,
    Permission.VIEW_INTEGRATIONS,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.VIEW_BILLING,
  ],

  [Role.CREATOR]: [
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.VIEW_CONTENT,
    Permission.VIEW_BRAND,
    Permission.VIEW_INTEGRATIONS,
    Permission.VIEW_ANALYTICS,
  ],

  [Role.CLIENT_VIEWER]: [
    Permission.VIEW_CONTENT,
    Permission.VIEW_BRAND,
    Permission.VIEW_ANALYTICS,
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  role: Role,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  role: Role,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Middleware: Require authentication
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const aReq = req as AuthenticatedRequest;
  const auth = aReq.auth;

  if (!auth || !auth.userId) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Authentication required",
      HTTP_STATUS.UNAUTHORIZED,
      "warning",
    );
  }

  next();
}

/**
 * Middleware: Require specific role
 */
export function requireRole(...roles: Role[]) {
  return ((req, _res, next) => {
    const aReq = req as AuthenticatedRequest;
    const auth = aReq.auth;

    if (!auth || !auth.role) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Authentication required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning",
      );
    }

    if (!roles.includes(auth.role as Role)) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "Insufficient permissions",
        HTTP_STATUS.FORBIDDEN,
        "warning",
        { requiredRoles: roles, userRole: auth.role },
      );
    }

    next();
  }) as RequestHandler;
}

/**
 * Middleware: Require specific permission
 */
export function requirePermission(...permissions: Permission[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const aReq = req as AuthenticatedRequest;
    const auth = aReq.auth;

    if (!auth || !auth.role) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Authentication required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning",
      );
    }

    const hasRequiredPermission = permissions.some((p) =>
      hasPermission(auth.role as Role, p),
    );

    if (!hasRequiredPermission) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "Insufficient permissions",
        HTTP_STATUS.FORBIDDEN,
        "warning",
        { requiredPermissions: permissions, userRole: auth.role },
      );
    }

    next();
  };
}

/**
 * Middleware: Require brand access
 */
export const requireBrandAccess: RequestHandler = (req, _res, next) => {
  const aReq = req as AuthenticatedRequest;
  const auth = aReq.auth;
  const brandId =
    (aReq.params as Record<string, string>).brandId ||
    (aReq.body as Record<string, any>).brandId ||
    (aReq.query as Record<string, any>).brandId;

  if (!auth || !auth.userId) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Authentication required",
      HTTP_STATUS.UNAUTHORIZED,
      "warning",
    );
  }

  if (!brandId) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Brand ID required",
      HTTP_STATUS.BAD_REQUEST,
      "warning",
    );
  }

  // Check if user has access to this brand
  // In production, this would check against brand_members table in Supabase
  const hasAccess =
    auth.brandIds?.includes(brandId) || auth.role === Role.SUPERADMIN;

  if (!hasAccess) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      "Access denied to this brand",
      HTTP_STATUS.FORBIDDEN,
      "warning",
      { brandId, userId: auth.userId },
    );
  }

  next();
};

/**
 * Middleware: Require ownership (user can only access their own resources)
 */
export function requireOwnership(userIdField: string = "userId"): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const aReq = req as AuthenticatedRequest;
    const auth = aReq.auth;
    const params = req.params as Record<string, string>;
    const body = req.body as Record<string, any>;
    const query = req.query as Record<string, any>;
    const resourceUserId =
      params[userIdField] || body[userIdField] || query[userIdField];

    if (!auth || !auth.userId) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Authentication required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning",
      );
    }

    // Superadmins can access any resource
    if (auth.role === Role.SUPERADMIN) {
      next();
      return;
    }

    if (auth.userId !== resourceUserId) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "You can only access your own resources",
        HTTP_STATUS.FORBIDDEN,
        "warning",
        { userId: auth.userId, resourceUserId },
      );
    }

    next();
  };
}

/**
 * Get user permissions based on role
 */
export function getUserPermissions(role: Role): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Mock authentication middleware
 * DEPRECATED: This function is no longer used.
 * All authentication now uses real Supabase Auth via authenticateUser middleware.
 * 
 * This function is kept for backward compatibility but should not be used.
 * @deprecated Use authenticateUser from server/middleware/security.ts instead
 */
export function mockAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  console.error("[Auth] ❌ CRITICAL: mockAuth is deprecated and should not be used!");
  console.error("[Auth] All routes must use real Supabase Auth via authenticateUser middleware.");
  console.error("[Auth] This request will be rejected to prevent security bypass.");
  
  // Reject the request - no mock auth allowed
  throw new Error("Mock authentication is disabled. Use real Supabase Auth.");
};
