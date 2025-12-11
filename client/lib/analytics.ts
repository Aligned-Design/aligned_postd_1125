import { logTelemetry } from "./logger";
import type { LogContext } from "./logger";

/**
 * Analytics wrapper - centralized event tracking
 * Can be swapped to Segment/Mixpanel later without changing call sites
 */

// ✅ FIX: Add pricing_cta_click to EventName union
type EventName = "cta_click" | "pricing_cta_click" | "page_view" | "form_submit" | "error";

interface CTAClickEvent {
  source: "hero" | "sticky" | "footer" | "header";
  auth_state: "anon" | "authed";
}

interface AnalyticsEvent {
  cta_click: CTAClickEvent;
  pricing_cta_click: { plan: string; source: string }; // ✅ FIX: Add pricing_cta_click event type
  page_view: { page: string };
  form_submit: { form: string; success: boolean };
  error: { message: string; code?: string };
}

class Analytics {
  track<T extends EventName>(eventName: T, properties: AnalyticsEvent[T]) {
    // Analytics events sent to /api/analytics/log endpoint
    // For enhanced analytics, configure ANALYTICS_PROVIDER in environment
    // Example: segment.track(eventName, properties);
    
    // Development-only logging
    // Cast to LogContext since all event properties are compatible with index signature
    logTelemetry(`[Analytics] ${eventName}`, properties as LogContext);
  }
}

export const analytics = new Analytics();
