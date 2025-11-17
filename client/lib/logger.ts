/**
 * Logger utility for frontend
 * 
 * In production, logs are disabled or sent to a tracking service.
 * In development, logs are sent to console.
 */

const isDevelopment = import.meta.env.DEV;

interface LogContext {
  [key: string]: unknown;
}

/**
 * Log telemetry/analytics events
 * In production, this should send to an analytics service
 */
export function logTelemetry(event: string, context?: LogContext): void {
  if (isDevelopment) {
    console.log(`[telemetry] ${event}`, context || {});
  }
  // TODO: In production, send to analytics service (e.g., PostHog, Mixpanel)
}

/**
 * Log errors
 * In production, this should send to an error tracking service
 */
export function logError(message: string, error?: Error, context?: LogContext): void {
  if (isDevelopment) {
    console.error(`[error] ${message}`, error, context || {});
  } else {
    // TODO: In production, send to error tracking service (e.g., Sentry)
    // For now, silently fail in production
  }
}

/**
 * Log warnings
 */
export function logWarning(message: string, context?: LogContext): void {
  if (isDevelopment) {
    console.warn(`[warn] ${message}`, context || {});
  }
}

/**
 * Log info messages
 */
export function logInfo(message: string, context?: LogContext): void {
  if (isDevelopment) {
    console.info(`[info] ${message}`, context || {});
  }
}

