/**
 * Logger utility for frontend
 * 
 * In production, logs are sent to the backend analytics/error tracking endpoint.
 * In development, logs are sent to console.
 */

const isDevelopment = import.meta.env.DEV;

export interface LogContext {
  [key: string]: unknown;
}

/**
 * Send log to backend (production only)
 */
async function sendToBackend(type: "telemetry" | "error" | "warning", data: Record<string, unknown>): Promise<void> {
  if (isDevelopment) return;
  
  try {
    // Non-blocking send to analytics endpoint
    fetch("/api/analytics/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        timestamp: new Date().toISOString(),
        ...data,
      }),
    }).catch(() => {
      // Silently fail - don't block UI for logging
    });
  } catch {
    // Silently fail
  }
}

/**
 * Log telemetry/analytics events
 * In production, this sends to the backend analytics endpoint
 */
export function logTelemetry(event: string, context?: LogContext): void {
  if (isDevelopment) {
    console.log(`[telemetry] ${event}`, context || {});
  }
  sendToBackend("telemetry", { event, context });
}

/**
 * Log errors
 * In production, this sends to the backend for error tracking
 */
export function logError(message: string, error?: Error, context?: LogContext): void {
  if (isDevelopment) {
    console.error(`[error] ${message}`, error, context || {});
  }
  sendToBackend("error", {
    message,
    error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined,
    context,
  });
}

/**
 * Log warnings
 */
export function logWarning(message: string, context?: LogContext): void {
  if (isDevelopment) {
    console.warn(`[warn] ${message}`, context || {});
  }
  sendToBackend("warning", { message, context });
}

/**
 * Log info messages
 */
export function logInfo(message: string, context?: LogContext): void {
  if (isDevelopment) {
    console.info(`[info] ${message}`, context || {});
  }
}
