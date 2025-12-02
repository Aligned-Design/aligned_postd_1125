import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
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
    jwtAuth(req, res, () => {
      // Normalize req.user for backward compatibility
      const auth = req.auth;
      if (auth) {
        // ✅ CRITICAL: Extract tenantId from JWT payload
        const tenantId = auth.tenantId || auth.workspaceId || null;
        
        req.user = {
          id: auth.userId,
          email: auth.email,
          role: auth.role,
          brandId: auth.brandIds?.[0],
          brandIds: auth.brandIds,
          scopes: auth.scopes || [],
          // ✅ CRITICAL: Add tenantId to user context
          tenantId: tenantId,
          workspaceId: tenantId, // Alias for compatibility
        };
        
        // Also add to auth object for consistency
        req.auth = {
          ...auth,
          tenantId: tenantId,
          workspaceId: tenantId,
        };
      }

      // Log auth context for debugging (remove in production if sensitive)
      const user = req.user;
      if (user) {
        console.log("[Auth] Request authenticated", {
          userId: user.id,
          tenantId: user.tenantId || "unknown",
          email: user.email,
          brandIds: user.brandIds,
          scopes: user.scopes || [],
          role: user.role,
          path: req.path || req.url,
        });
      } else {
        console.warn("[Auth] No user context found for path:", req.path || req.url);
      }

      next();
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware for onboarding routes
 * DEPRECATED: This middleware allowed requests without auth, which bypasses security.
 * All routes should now use authenticateUser middleware.
 * 
 * This function now requires authentication - it will reject requests without valid tokens.
 * For public routes (like signup/login), they should be explicitly excluded from auth middleware.
 */
export function optionalAuthForOnboarding(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // ✅ CRITICAL: Require authentication for all routes
  // This prevents mock/dev users from bypassing auth
  console.warn("[Auth] optionalAuthForOnboarding is deprecated - requiring real authentication");
  
  // Use real authentication middleware
  authenticateUser(req, res, next);
}

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    Object.keys(rateLimitStore).forEach((key) => {
      if (rateLimitStore[key].resetTime < now) {
        delete rateLimitStore[key];
      }
    });
  },
  5 * 60 * 1000,
);

/**
 * Rate limiting middleware
 * Prevents brute force attacks and API abuse
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const userId = req.auth?.userId || "anonymous";
      return `${ip}-${userId}`;
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
      rateLimitStore[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    const store = rateLimitStore[key];
    store.count++;

    res.setHeader("X-RateLimit-Limit", maxRequests.toString());
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - store.count).toString(),
    );
    res.setHeader("X-RateLimit-Reset", new Date(store.resetTime).toISOString());

    if (store.count > maxRequests) {
      throw new AppError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        "Too many requests, please try again later",
        HTTP_STATUS.TOO_MANY_REQUESTS,
        "warning",
        { key, count: store.count, limit: maxRequests },
      );
    }

    // Track response for conditional rate limiting
    if (skipSuccessfulRequests || skipFailedRequests) {
      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        const statusCode = res.statusCode;
        if (
          (skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) ||
          (skipFailedRequests && (statusCode < 200 || statusCode >= 300))
        ) {
          store.count--;
        }
        return originalJson(data);
      };
    }

    next();
  };
}

/**
 * XSS Protection - Sanitize input
 */
export function sanitizeInput(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const sanitize = (obj: any): any => {
    if (typeof obj === "string") {
      // Remove script tags and potentially dangerous content
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "");
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
}

/**
 * CSRF Protection
 */
const csrfTokens = new Map<string, number>();

// Cleanup expired tokens every 10 minutes
setInterval(
  () => {
    const now = Date.now();
    csrfTokens.forEach((expiry, token) => {
      if (expiry < now) {
        csrfTokens.delete(token);
      }
    });
  },
  10 * 60 * 1000,
);

export function generateCsrfToken(): string {
  const token = crypto.randomBytes(32).toString("hex");
  csrfTokens.set(token, Date.now() + 3600000); // 1 hour expiry
  return token;
}

export function verifyCsrfToken(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const token = req.headers["x-csrf-token"] as string;

  if (!token || !csrfTokens.has(token)) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Invalid or missing CSRF token",
      HTTP_STATUS.FORBIDDEN,
      "warning",
    );
  }

  const expiry = csrfTokens.get(token)!;
  if (expiry < Date.now()) {
    csrfTokens.delete(token);
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "CSRF token expired",
      HTTP_STATUS.FORBIDDEN,
      "warning",
    );
  }

  next();
}

/**
 * IP Allowlist/Blocklist
 */
const blockedIPs = new Set<string>();
const allowedIPs = new Set<string>();

export function addToBlocklist(ip: string) {
  blockedIPs.add(ip);
}

export function removeFromBlocklist(ip: string) {
  blockedIPs.delete(ip);
}

export function setAllowlist(ips: string[]) {
  allowedIPs.clear();
  ips.forEach((ip) => allowedIPs.add(ip));
}

export function ipFilter(req: Request, _res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  if (blockedIPs.has(ip)) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      "Access denied",
      HTTP_STATUS.FORBIDDEN,
      "warning",
      { ip },
    );
  }

  if (allowedIPs.size > 0 && !allowedIPs.has(ip)) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      "Access denied - IP not in allowlist",
      HTTP_STATUS.FORBIDDEN,
      "warning",
      { ip },
    );
  }

  next();
}

/**
 * Request size limiter
 */
export function requestSizeLimit(maxSizeBytes: number) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);

    if (contentLength > maxSizeBytes) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Request body too large. Maximum size: ${maxSizeBytes} bytes`,
        HTTP_STATUS.PAYLOAD_TOO_LARGE,
        "warning",
        { size: contentLength, limit: maxSizeBytes },
      );
    }

    next();
  };
}

/**
 * Security event logger
 */
interface SecurityEvent {
  type:
    | "rate_limit"
    | "csrf_violation"
    | "blocked_ip"
    | "invalid_auth"
    | "suspicious_activity";
  ip: string;
  userId?: string;
  path: string;
  timestamp: string;
  details?: any;
}

const securityEvents: SecurityEvent[] = [];
const MAX_SECURITY_EVENTS = 10000;

export function logSecurityEvent(event: SecurityEvent) {
  securityEvents.push(event);

  // Keep only recent events
  if (securityEvents.length > MAX_SECURITY_EVENTS) {
    securityEvents.splice(0, securityEvents.length - MAX_SECURITY_EVENTS);
  }

  // Log critical events immediately
  if (["blocked_ip", "suspicious_activity"].includes(event.type)) {
    console.warn("🚨 Security Alert:", event);
  }
}

export function getSecurityEvents(filters?: {
  type?: SecurityEvent["type"];
  ip?: string;
  userId?: string;
  since?: Date;
  limit?: number;
}) {
  let filtered = [...securityEvents];

  if (filters?.type) {
    filtered = filtered.filter((e) => e.type === filters.type);
  }
  if (filters?.ip) {
    filtered = filtered.filter((e) => e.ip === filters.ip);
  }
  if (filters?.userId) {
    filtered = filtered.filter((e) => e.userId === filters.userId);
  }
  if (filters?.since) {
    filtered = filtered.filter((e) => new Date(e.timestamp) >= filters.since!);
  }

  const limit = filters?.limit || 100;
  return filtered.slice(-limit);
}

/**
 * Suspicious activity detection
 */
const activityTracking = new Map<
  string,
  {
    failedLogins: number;
    lastFailedLogin: number;
    suspiciousRequests: number;
  }
>();

export function trackFailedLogin(identifier: string) {
  const tracking = activityTracking.get(identifier) || {
    failedLogins: 0,
    lastFailedLogin: 0,
    suspiciousRequests: 0,
  };

  tracking.failedLogins++;
  tracking.lastFailedLogin = Date.now();
  activityTracking.set(identifier, tracking);

  if (tracking.failedLogins >= 5) {
    logSecurityEvent({
      type: "suspicious_activity",
      ip: identifier,
      path: "/auth/login",
      timestamp: new Date().toISOString(),
      details: { failedLogins: tracking.failedLogins },
    });

    // Auto-block after 10 failed attempts
    if (tracking.failedLogins >= 10) {
      addToBlocklist(identifier);
    }
  }
}

export function resetFailedLogins(identifier: string) {
  activityTracking.delete(identifier);
}
