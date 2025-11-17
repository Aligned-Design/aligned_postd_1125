/**
 * CSRF State Validation Middleware
 * Validates OAuth state parameters to prevent CSRF attacks
 * Ensures state parameter is present, valid, and has proper format
 */

import { Request, Response, NextFunction } from "express";
import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";

/**
 * Validate OAuth state parameter format
 * States should be hex strings (exactly 64 characters for 32 bytes)
 * No compound formats allowed (no colons, no brandId encoding)
 */
function isValidStateFormat(state: string): boolean {
  // State must be exactly 64 characters (32 bytes in hex)
  // Not >= 64, exactly 64 to prevent compound state formats
  if (!state || state.length !== 64) {
    return false;
  }

  // State should only contain hex characters (0-9, a-f)
  // SECURITY: No colons allowed - compound state format "token:brandId" is UNSAFE
  // BrandId must be stored securely in backend cache, never in state parameter
  const validStateRegex = /^[a-f0-9]+$/i;
  return validStateRegex.test(state);
}

/**
 * Extract raw state token
 * DEPRECATED: No longer supports compound states (e.g., "token:brandId")
 * State is now always a single 64-character hex token
 */
function extractRawStateToken(state: string): string {
  // State is no longer compound, return as-is
  return state;
}

/**
 * Middleware to validate OAuth state parameter
 * Must be applied to OAuth callback routes
 */
export function validateOAuthState(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const state = ((req as any).query.state as string) || undefined;

  // State parameter is required
  if (!state) {
    throw new AppError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      "OAuth state parameter is required",
      HTTP_STATUS.BAD_REQUEST,
      "warning",
      undefined,
      "State parameter must be provided in the OAuth callback URL"
    );
  }

  // Validate state format (must be exactly 64 hex chars, no compound formats)
  if (!isValidStateFormat(state)) {
    throw new AppError(
      ErrorCode.INVALID_FORMAT,
      "Invalid OAuth state format",
      HTTP_STATUS.BAD_REQUEST,
      "warning",
      { state: state.substring(0, 10) + "..." },
      "State parameter must be a 64-character hex string"
    );
  }

  // Extract raw token (no longer compound, just return as-is)
  const rawStateToken = extractRawStateToken(state);

  // Attach validated state to request for downstream handlers
  (req as any).validatedState = {
    fullState: state,
    rawToken: rawStateToken,
    parts: [rawStateToken], // Now always single element since no colons allowed
  };

  next();
}

/**
 * Middleware to validate OAuth state expiration
 * Requires validateOAuthState to be called first
 * Checks that state hasn't expired (typically 10 minutes)
 */
export function validateOAuthStateExpiration(maxAgeMs: number = 10 * 60 * 1000) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const issuedAt = ((req as any).query.iat as string) || undefined;

    // If iat (issued at) is provided, validate it hasn't expired
    if (issuedAt) {
      const issuedAtMs = parseInt(issuedAt, 10);
      const nowMs = Date.now();
      const ageMs = nowMs - issuedAtMs;

      if (ageMs > maxAgeMs) {
        throw new AppError(
          ErrorCode.TOKEN_EXPIRED,
          "OAuth state has expired",
          HTTP_STATUS.BAD_REQUEST,
          "warning",
          { expiresIn: maxAgeMs / 1000 },
          "Authorization request has expired. Please start the OAuth flow again"
        );
      }
    }

    next();
  };
}

/**
 * Validate that state parameter matches expected format
 * Useful for enforcing branded state patterns
 */
export function validateStatePattern(pattern: RegExp) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const state = ((req as any).query.state as string) || undefined;

    if (!state || !pattern.test(state)) {
      throw new AppError(
        ErrorCode.INVALID_FORMAT,
        "OAuth state does not match expected pattern",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        undefined,
        "State parameter format is invalid"
      );
    }

    next();
  };
}

/**
 * Compose multiple CSRF middleware validators
 */
export function composeCSRFValidation(...middleware: Array<(req: Request, res: Response, next: NextFunction) => void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    let index = 0;

    const executeNext = (err?: unknown): void => {
      if (err) {
        next(err);
        return;
      }

      if (index < middleware.length) {
        const fn = middleware[index++];
        try {
          fn(req, res, executeNext);
        } catch (e) {
          next(e);
        }
      } else {
        next();
      }
    };

    executeNext();
  };
}
