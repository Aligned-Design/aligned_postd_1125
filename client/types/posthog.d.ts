/**
 * PostHog Type Declarations
 * Provides type safety for PostHog analytics integration
 */

declare global {
  interface Window {
    posthog?: {
      capture: (eventName: string, properties?: Record<string, any>) => void;
      identify: (userId: string, properties?: Record<string, any>) => void;
      reset: () => void;
      isFeatureEnabled: (featureName: string) => boolean;
      onFeatureFlags: (callback: (flags: string[]) => void) => void;
      getFeatureFlag: (featureName: string) => string | boolean | undefined;
      group: (
        groupType: string,
        groupKey: string,
        properties?: Record<string, any>,
      ) => void;
      alias: (alias: string) => void;
      set: (properties: Record<string, any>) => void;
      set_once: (properties: Record<string, any>) => void;
      register: (properties: Record<string, any>) => void;
      register_once: (properties: Record<string, any>) => void;
      unregister: (property: string) => void;
      opt_out_capturing: () => void;
      opt_in_capturing: () => void;
      has_opted_out_capturing: () => boolean;
      has_opted_in_capturing: () => boolean;
      clear_opt_in_out_capturing: () => void;
    };
  }
}

export {};
