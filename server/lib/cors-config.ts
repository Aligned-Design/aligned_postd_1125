/**
 * CORS Configuration
 * Centralized Cross-Origin Resource Sharing (CORS) configuration
 * Supports development and production environments with security best practices
 */

import { CorsOptions } from "cors";

/**
 * Parse comma-separated origins from environment variable
 * @param originsString - Comma-separated origin URLs
 * @returns Array of origin URLs
 */
function parseOrigins(originsString: string | undefined): string[] {
  if (!originsString) return [];
  return originsString
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Check if origin is allowed
 * @param origin - Request origin
 * @param allowedOrigins - List of allowed origins
 * @returns true if origin is allowed
 */
function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (!origin) return false;

  // Allow any localhost origin in development
  if (process.env.NODE_ENV !== "production") {
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return true;
    }
  }

  return allowedOrigins.includes(origin);
}

/**
 * Get CORS configuration based on environment
 * @returns CORS options for Express middleware
 */
export function getCorsConfig(): CorsOptions {
  const isDevelopment = process.env.NODE_ENV !== "production";

  // Development: Allow localhost and any origin if explicitly set
  if (isDevelopment) {
    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or cURL requests)
        if (!origin) return callback(null, true);

        // Allow localhost in development
        if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
          return callback(null, true);
        }

        // Allow explicitly configured origins
        const allowedOrigins = parseOrigins(process.env.ALLOWED_ORIGINS);
        if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // Log in development for debugging
        callback(null, true);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Accept",
        "Accept-Language",
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "X-CSRF-Token",
        "X-API-Key",
      ],
      exposedHeaders: ["Content-Length", "X-JSON-Response-Time", "X-Request-ID"],
      maxAge: 86400, // 24 hours
    };
  }

  // Production: Strict origin validation
  const productionOrigins = parseOrigins(
    process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL
  );

  if (productionOrigins.length === 0) {
    throw new Error(
      "CORS_ORIGINS or FRONTEND_URL environment variable must be set in production"
    );
  }

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (required for some mobile/desktop clients)
      if (!origin) return callback(null, true);

      if (isOriginAllowed(origin, productionOrigins)) {
        return callback(null, true);
      }

      // Reject disallowed origins in production
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Accept",
      "Accept-Language",
      "Authorization",
      "Content-Type",
      "X-Requested-With",
      "X-CSRF-Token",
      "X-API-Key",
    ],
    exposedHeaders: ["Content-Length", "X-JSON-Response-Time", "X-Request-ID"],
    maxAge: 86400, // 24 hours
  };
}

/**
 * Get list of allowed origins for current environment
 * @returns Array of allowed origin URLs
 */
export function getAllowedOrigins(): string[] {
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (isDevelopment) {
    return [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:8080",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:8080",
      ...parseOrigins(process.env.ALLOWED_ORIGINS),
    ];
  }

  return parseOrigins(process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "");
}

/**
 * Validate CORS configuration
 * Useful for startup validation
 * @returns true if CORS configuration is valid
 */
export function validateCorsConfig(): boolean {
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (!isDevelopment) {
    const origins = getAllowedOrigins();
    if (origins.length === 0) {
      console.error(
        "CORS Configuration Error: No allowed origins configured for production"
      );
      return false;
    }
  }

  return true;
}
