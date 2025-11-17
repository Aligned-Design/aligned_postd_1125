/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */

import { Request, Response, NextFunction } from "express";
import { jwtAuth } from "../lib/jwt-auth";

/**
 * Authenticate user via JWT token
 * Expects Authorization: Bearer <token> header
 * Attaches req.auth with userId, email, role, brandIds
 * Also sets req.user for backward compatibility
 */
export function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Call jwtAuth middleware to verify token
    jwtAuth(req, res, () => {
      // After JWT is verified, normalize req.user for backward compatibility
      const auth = (req as any).auth;
      if (auth) {
        (req as any).user = {
          id: auth.userId,
          email: auth.email,
          role: auth.role,
          brandId: auth.brandIds?.[0],
          brandIds: auth.brandIds,
        };
      }
      next();
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Legacy export for compatibility
 * Routes importing from security.ts should be updated to use this file
 */
export const authenticateUserLegacy = authenticateUser;
