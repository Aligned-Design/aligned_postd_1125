/**
 * Scope-based authorization middleware
 * Enforces permission checks based on canonical RBAC system
 */

/// <reference types="express" />
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import permissionsMap from "../../config/permissions.json";

export type Scope = string; // String type to allow flexibility

/**
 * Middleware factory to require specific scope(s)
 * User role must have at least one of the required scopes
 *
 * @param scopes - Single scope or array of scopes. User must have at least one.
 * @returns Express middleware function
 *
 * @example
 * router.post('/approve', requireScope('content:approve'), handler);
 * router.post('/publish', requireScope(['publish:now', 'publish:schedule']), handler);
 */
export function requireScope(scopes: Scope | Scope[]) {
  const requiredScopes = Array.isArray(scopes) ? scopes : [scopes];

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get user from request (set by authenticateUser middleware)
      const user = req.user || req.auth;

      if (!user) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          HTTP_STATUS.UNAUTHORIZED,
          "warning",
        );
      }

      // Get user's role
      const userRoleRaw = (user.role || "").toString();
      const userRole = userRoleRaw.toUpperCase() as keyof typeof permissionsMap;

      if (!userRole) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "User role not found",
          HTTP_STATUS.FORBIDDEN,
          "warning",
        );
      }

      // Get permissions for user's role
      const rolePermissions = permissionsMap[userRole];

      if (!rolePermissions) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          `Unknown role: ${userRole}`,
          HTTP_STATUS.FORBIDDEN,
          "warning",
        );
      }

      // Check if user has wildcard permission (SUPERADMIN)
      if (rolePermissions.includes("*")) {
        return next();
      }

      // Check if user has at least one of the required scopes
      const hasRequiredScope = requiredScopes.some((scope) =>
        rolePermissions.includes(scope),
      );

      if (!hasRequiredScope) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          `Insufficient permissions. Required: ${requiredScopes.join(" or ")}`,
          HTTP_STATUS.FORBIDDEN,
          "warning",
          {
            userRole,
            requiredScopes,
            userPermissions: rolePermissions,
          },
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory to require ALL scopes
 * User role must have all of the specified scopes
 *
 * @param scopes - Array of scopes. User must have all.
 * @returns Express middleware function
 *
 * @example
 * router.post('/admin-action', requireAllScopes(['billing:manage', 'user:manage']), handler);
 */
export function requireAllScopes(scopes: Scope[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user || req.auth;

      if (!user) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "Authentication required",
          HTTP_STATUS.UNAUTHORIZED,
          "warning",
        );
      }

      const userRoleRaw = (user.role || "").toString();
      const userRole = userRoleRaw.toUpperCase() as keyof typeof permissionsMap;
      const rolePermissions = permissionsMap[userRole];

      if (!rolePermissions) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          `Unknown role: ${userRole}`,
          HTTP_STATUS.FORBIDDEN,
          "warning",
        );
      }

      if (rolePermissions.includes("*")) {
        return next();
      }

      const hasAllScopes = scopes.every((scope) =>
        rolePermissions.includes(scope),
      );

      if (!hasAllScopes) {
        const missingScopes = scopes.filter(
          (scope) => !rolePermissions.includes(scope),
        );

        throw new AppError(
          ErrorCode.FORBIDDEN,
          `Insufficient permissions. Missing: ${missingScopes.join(", ")}`,
          HTTP_STATUS.FORBIDDEN,
          "warning",
          {
            userRole,
            requiredScopes: scopes,
            missingScopes,
            userPermissions: rolePermissions,
          },
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Get permissions for a specific role
 * Useful for checking permissions without middleware
 *
 * @param role - The role to check
 * @returns Array of scopes the role has
 */
export function getRolePermissions(role: string): Scope[] {
  const normalized = (role || "").toUpperCase();
  return (
    permissionsMap[normalized as keyof typeof permissionsMap] || []
  );
}

/**
 * Check if a role has a specific scope
 * @param role - The role to check
 * @param scope - The scope to verify
 * @returns boolean
 */
export function roleHasScope(role: string, scope: Scope): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes("*") || permissions.includes(scope);
}
