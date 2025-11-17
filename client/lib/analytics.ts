/**
 * Analytics wrapper - centralized event tracking
 * Can be swapped to Segment/Mixpanel later without changing call sites
 */

type EventName = "cta_click" | "page_view" | "form_submit" | "error";

interface CTAClickEvent {
  source: "hero" | "sticky" | "footer" | "header";
  auth_state: "anon" | "authed";
}

interface AnalyticsEvent {
  cta_click: CTAClickEvent;
  page_view: { page: string };
  form_submit: { form: string; success: boolean };
  error: { message: string; code?: string };
}

class Analytics {
  track<T extends EventName>(eventName: T, properties: AnalyticsEvent[T]) {
    // For now, log to console
    console.log(`[Analytics] ${eventName}:`, properties);

    // TODO: Replace with real analytics provider
    // Example: segment.track(eventName, properties);
  }
}

export const analytics = new Analytics();
