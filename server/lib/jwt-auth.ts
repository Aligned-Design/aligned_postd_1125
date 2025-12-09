import crypto from "crypto";
/// <reference types="express" />
import { RequestHandler } from "express";
import { AuthenticatedRequest } from "../types/express";
import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";
import { Role } from "../middleware/rbac";

/**
 * JWT configuration
 */
const ACCESS_TOKEN_EXPIRY = 3600; // 1 hour in seconds
const REFRESH_TOKEN_EXPIRY = 604800; // 7 days in seconds
const ALGORITHM = "HS256";

interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  brandIds: string[];
  tenantId: string;
  iat: number; // Issued at
  exp: number; // Expiry
  type: "access" | "refresh";
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Get JWT secret from environment
 * 
 * ✅ FIX: Log warning once per boot instead of on every request
 */
let jwtSecretWarningLogged = false;

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    // ✅ FIX: Only log warning once per boot to reduce log noise
    if (!jwtSecretWarningLogged) {
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        console.error(
          "❌ CRITICAL: JWT_SECRET not set in production environment. This is a security risk!"
        );
      } else {
        console.warn(
          "⚠️  JWT_SECRET not set in environment. Using development secret. DO NOT USE IN PRODUCTION!",
        );
      }
      jwtSecretWarningLogged = true;
    }
    return "dev-jwt-secret-change-in-production";
  }

  return secret;
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

/**
 * Sign JWT token
 */
function signToken(payload: JWTPayload): string {
  const header = {
    alg: ALGORITHM,
    typ: "JWT",
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signature = crypto
    .createHmac("sha256", getJWTSecret())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  // Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", getJWTSecret())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    )
  ) {
    throw new Error("Invalid token signature");
  }

  // Decode payload
  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;

  // Check expiry
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return payload;
}

/**
 * Generate access and refresh token pair
 */
export function generateTokenPair(user: {
  userId: string;
  email: string;
  role: Role;
  brandIds: string[];
  tenantId: string;
}): TokenPair {
  const now = Math.floor(Date.now() / 1000);

  const accessPayload: JWTPayload = {
    ...user,
    iat: now,
    exp: now + ACCESS_TOKEN_EXPIRY,
    type: "access",
  };

  const refreshPayload: JWTPayload = {
    ...user,
    iat: now,
    exp: now + REFRESH_TOKEN_EXPIRY,
    type: "refresh",
  };

  return {
    accessToken: signToken(accessPayload),
    refreshToken: signToken(refreshPayload),
    expiresIn: ACCESS_TOKEN_EXPIRY,
  };
}

/**
 * Refresh access token using refresh token
 */
export function refreshAccessToken(refreshToken: string): TokenPair {
  try {
    const payload = verifyToken(refreshToken);

    if (payload.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    // Generate new token pair
    return generateTokenPair({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      brandIds: payload.brandIds,
      tenantId: payload.tenantId,
    });
  } catch (error) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Invalid or expired refresh token",
      HTTP_STATUS.UNAUTHORIZED,
      "warning",
    );
  }
}

/**
 * Middleware: Verify JWT token from header
 */
export const jwtAuth: RequestHandler = (req, res, next) => {
  const aReq = req as AuthenticatedRequest;
  try {
    const authHeader = aReq.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Missing or invalid authorization header",
        HTTP_STATUS.UNAUTHORIZED,
        "warning",
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (payload.type !== "access") {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Invalid token type",
        HTTP_STATUS.UNAUTHORIZED,
        "warning",
      );
    }

    // Attach user info to request
    aReq.auth = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role as Role,
      brandIds: payload.brandIds,
      tenantId: payload.tenantId,
    };

    // Check if token is close to expiry (within 5 minutes)
    const timeUntilExpiry = payload.exp - Math.floor(Date.now() / 1000);
    if (timeUntilExpiry < 300) {
      res.setHeader("X-Token-Expiring", "true");
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      error instanceof Error ? error.message : "Authentication failed",
      HTTP_STATUS.UNAUTHORIZED,
      "warning",
    );
  }
}

/**
 * Set refresh token as httpOnly cookie
 */
export function setRefreshTokenCookie(res: Response, refreshToken: string) {
  (res as any).cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_EXPIRY * 1000,
    path: "/api/auth/refresh",
  });
}

/**
 * Clear refresh token cookie
 */
export function clearRefreshTokenCookie(res: Response) {
  (res as any).clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth/refresh",
  });
}

/**
 * Extract user from request (for authenticated routes)
 */
export function getUserFromRequest(req: AuthenticatedRequest): {
  userId: string;
  email: string;
  role: Role;
  brandIds: string[];
  tenantId: string;
} | null {
  const auth = req.auth;
  if (!auth) return null;
  
  return {
    userId: auth.userId,
    email: auth.email,
    role: auth.role as Role,
    brandIds: auth.brandIds || [],
    tenantId: auth.tenantId || "",
  };
}
