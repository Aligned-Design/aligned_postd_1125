/**
 * Authentication Middleware
 * Extracts and attaches authentication context to requests
 * Provides middleware for requiring authentication
 */

/* eslint-disable */
import { Request, Response, NextFunction } from "express";
import {
  extractAuthContext,
  AuthContext,
  UserRole,
  validateAuthContext,
  canAccessBrand,
} from "./auth-context";
import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";

/**
 * Extend Express Request type to include auth context
 */
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * Middleware to extract authentication context from request
 * Attaches context to req.auth, does not require authentication
 */
export function extractAuthMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    _req.auth = extractAuthContext(_req);
    next();
  } catch (error) {
    // If extraction fails, continue without auth
    next();
  }
}

/**
 * Middleware to require authentication
 * Returns 401 if no valid authentication context
 */
export function requireAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const validation = validateAuthContext(req.auth);

  if (!validation.valid) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Authentication required",
      HTTP_STATUS.UNAUTHORIZED,
      "warning",
      undefined,
      "Please provide valid authentication credentials"
    );
  }

  next();
}

/**
 * Middleware to require brand ID in auth context
 * Use when route requires brand-specific operations
 */
export function requireBrandAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const validation = validateAuthContext(req.auth, {
    requireBrandId: true,
  });

  if (!validation.valid) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      "Brand context required",
      HTTP_STATUS.FORBIDDEN,
      "warning",
      undefined,
      "This operation requires a valid brand context"
    );
  }

  next();
}

/**
 * Middleware to require minimum role
 * Use for endpoints that require specific permission levels
 */
export function requireRoleMiddleware(minRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const validation = validateAuthContext(req.auth, { minRole });

    if (!validation.valid) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "Insufficient permissions",
        HTTP_STATUS.FORBIDDEN,
        "warning",
        { requiredRole: minRole, userRole: req.auth?.role },
        `This operation requires ${minRole} role or higher`
      );
    }

    next();
  };
}

/**
 * Middleware to check brand access
 * Ensures user can access the requested brand
 * Use with requireBrandAuthMiddleware
 */
export function requireBrandAccessMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const targetBrandId = ((req as any).params.brandId as string) ||
    ((req as any).query.brandId as string) || req.auth?.brandId;

  if (!targetBrandId) {
    throw new AppError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      "Brand ID not provided",
      HTTP_STATUS.BAD_REQUEST,
      "warning",
      undefined,
      "Please specify a brand ID"
    );
  }

  if (!canAccessBrand(req.auth, targetBrandId)) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      "Access denied to this brand",
      HTTP_STATUS.FORBIDDEN,
      "warning",
      { requestedBrand: targetBrandId },
      "You do not have permission to access this brand"
    );
  }

  next();
}

/**
 * Compose multiple auth middleware
 * Useful for common patterns
 */
export function composeBrandAuthMiddleware(...middlewares: unknown[]) {
  return [
    extractAuthMiddleware,
    requireAuthMiddleware,
    requireBrandAuthMiddleware,
    ...middlewares,
  ];
}

/**
 * Create role-based access middleware
 */
export function createRoleBasedMiddleware(
  minRole: UserRole,
  requireBrand: boolean = true
) {
  const middleware = [
    extractAuthMiddleware,
    requireAuthMiddleware,
    requireRoleMiddleware(minRole),
  ];

  if (requireBrand) {
    middleware.push(requireBrandAuthMiddleware, requireBrandAccessMiddleware);
  }

  return middleware;
}
