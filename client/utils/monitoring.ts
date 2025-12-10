/**
 * Monitoring & Error Tracking Setup
 * Integrates Sentry for error tracking and Web Vitals for performance monitoring
 */

import * as Sentry from "@sentry/react";
import { onCLS, onFCP, onLCP, onTTFB } from "web-vitals";

// Initialize Sentry for error tracking and performance monitoring
export function initializeSentry() {
  // ✅ FIX: Proper type for environment access
  const getEnv = (): Record<string, unknown> => {
    if (typeof window !== "undefined" && typeof import.meta !== "undefined") {
      return import.meta.env as Record<string, unknown>;
    }
    if (typeof process !== "undefined" && process.env) {
      return process.env as Record<string, unknown>;
    }
    return {};
  };
  const env = getEnv();

  // ✅ FIX: Ensure NODE_ENV is a string
  const NODE_ENV = (typeof env.NODE_ENV === "string" ? env.NODE_ENV : env.VITE_NODE_ENV) || "development";
  const isDevelopment = NODE_ENV === "development";
  const isProduction = NODE_ENV === "production";

  // ✅ FIX: Type guard for enableSentry
  const enableSentryRaw = env.VITE_ENABLE_SENTRY ?? env.ENABLE_SENTRY ?? false;
  const enableSentry = enableSentryRaw === true || String(enableSentryRaw) === "true";
  if (!isProduction && !enableSentry) {
    console.log(
      "ℹ️  Sentry disabled (set VITE_ENABLE_SENTRY=true to enable in development)",
    );
    return;
  }

  // ✅ FIX: Type guard for DSN
  const dsn = (typeof env.VITE_SENTRY_DSN === "string" ? env.VITE_SENTRY_DSN : null) ||
              (typeof env.SENTRY_DSN === "string" ? env.SENTRY_DSN : null) ||
              "https://your-sentry-dsn@sentry.io/project-id";

  Sentry.init({
    dsn,
    environment: NODE_ENV as string,
    // ✅ FIX: Use Sentry v8+ function-based integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    maxBreadcrumbs: 50,
    attachStacktrace: true,
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // Filter out development errors
      if (isDevelopment) {
        console.log("Sentry event (dev mode):", event);
      }
      return event;
    },
  });

  console.log("✅ Sentry initialized for error tracking");
}

// Report Web Vitals to Sentry
export function reportWebVitals() {
  const isMetric = (m: unknown): m is {
    name: string;
    value: number;
    rating?: "good" | "needs-improvement" | "poor";
  } => {
    return m !== null && typeof m === "object" && "name" in m && "value" in m;
  };

  function sendToSentry(metric: unknown) {
    if (!isMetric(metric)) return;
    
    Sentry.metrics.distribution(metric.name, metric.value, {
      unit: "millisecond",
    });
  }

  onCLS(sendToSentry);
  onFCP(sendToSentry);
  onLCP(sendToSentry);
  onTTFB(sendToSentry);
}

// Report custom metrics to Sentry
export function reportMetricsToSentry(metrics?: Record<string, number>) {
  if (!metrics) {
    // If no metrics provided, report performance metrics
    reportPerformanceMetrics();
    return;
  }
  Object.entries(metrics).forEach(([name, value]) => {
    Sentry.metrics.distribution(name, value, {
      unit: "millisecond",
    });
  });
}

// Report performance entries to Sentry
export function reportPerformanceMetrics() {
  if (typeof window === "undefined" || !window.performance) {
    return;
  }

  const isPerformanceEntry = (entry: unknown): entry is PerformanceEntry => {
    return entry !== null && typeof entry === "object" && "entryType" in entry && "name" in entry && "duration" in entry;
  };

  const entries = performance.getEntriesByType("measure");
  const metrics: Record<string, number> = {};

  entries.forEach((entry) => {
    if (isPerformanceEntry(entry) && entry.entryType === "measure") {
      metrics[entry.name] = entry.duration;
    }
  });

  if (Object.keys(metrics).length > 0) {
    reportMetricsToSentry(metrics);
  }
}

// Alias for reportWebVitals (for backward compatibility)
export const trackWebVitals = reportWebVitals;

// Capture a custom metric
export function captureMetric(
  _category: string,
  name: string,
  value: number,
  _rating?: "good" | "needs-improvement" | "poor"
) {
  Sentry.metrics.distribution(name, value, {
    unit: "millisecond",
  });
}

// Capture user interaction
export function captureUserInteraction(
  action: string,
  metadata?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category: "user",
    message: action,
    level: "info",
    data: metadata,
  });
}

// Set user context for Sentry
export function setUserContext(
  id: string,
  email?: string,
  additionalData?: Record<string, unknown>
) {
  Sentry.setUser({
    id,
    email,
    ...additionalData,
  });
}

// Clear user context
export function clearUserContext() {
  Sentry.setUser(null);
}

// Capture an error
export function captureError(
  error: Error | string | unknown,
  context?: Record<string, unknown>
) {
  if (error instanceof Error) {
    Sentry.captureException(error, { extra: context });
  } else {
    Sentry.captureMessage(String(error), {
      level: "error",
      extra: context,
    });
  }
}

// Mark performance start
export function markPerformanceStart(name: string) {
  if (typeof window !== "undefined" && window.performance) {
    window.performance.mark(`${name}-start`);
  }
}

// Mark performance end and measure
export function markPerformanceEnd(name: string) {
  if (typeof window !== "undefined" && window.performance) {
    try {
      window.performance.mark(`${name}-end`);
      window.performance.measure(name, `${name}-start`, `${name}-end`);
    } catch (e) {
      // Ignore if start mark doesn't exist
      console.warn(`Performance mark ${name}-start not found`);
    }
  }
}
