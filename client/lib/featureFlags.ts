import { logError } from "./logger";

/**
 * Feature flags for Phase 2+ features
 * Set via localStorage key "featureFlags" (JSON object)
 * Or via environment variables VITE_FEATURE_*
 */

export interface FeatureFlags {
  studio_sidebar: boolean; // Drag-drop element sidebar
  studio_align_tools: boolean; // Advanced alignment & snap-to-grid
  ai_copy_v1: boolean; // AI content generator
  ai_palette_v1: boolean; // AI palette generator
  onboarding_auto_run_workflow: boolean; // Auto-trigger orchestration after scrape
}

const DEFAULT_FLAGS: FeatureFlags = {
  studio_sidebar: true, // Enable for Phase 2 build
  studio_align_tools: false,
  ai_copy_v1: false,
  ai_palette_v1: false,
  onboarding_auto_run_workflow: true, // ✅ MVP4: Enabled by default - auto-generates 7-day content plan after onboarding
};

/**
 * Get current feature flags
 * Priority: localStorage > environment variables > defaults
 */
export function getFeatureFlags(): FeatureFlags {
  const flags: FeatureFlags = { ...DEFAULT_FLAGS };

  // Check environment variables
  if (import.meta.env.VITE_FEATURE_STUDIO_SIDEBAR !== undefined) {
    flags.studio_sidebar = import.meta.env.VITE_FEATURE_STUDIO_SIDEBAR === "true";
  }
  if (import.meta.env.VITE_FEATURE_STUDIO_ALIGN_TOOLS !== undefined) {
    flags.studio_align_tools = import.meta.env.VITE_FEATURE_STUDIO_ALIGN_TOOLS === "true";
  }
  if (import.meta.env.VITE_FEATURE_AI_COPY_V1 !== undefined) {
    flags.ai_copy_v1 = import.meta.env.VITE_FEATURE_AI_COPY_V1 === "true";
  }
  if (import.meta.env.VITE_FEATURE_AI_PALETTE_V1 !== undefined) {
    flags.ai_palette_v1 = import.meta.env.VITE_FEATURE_AI_PALETTE_V1 === "true";
  }
  if (import.meta.env.VITE_FEATURE_ONBOARDING_AUTO_RUN_WORKFLOW !== undefined) {
    flags.onboarding_auto_run_workflow = import.meta.env.VITE_FEATURE_ONBOARDING_AUTO_RUN_WORKFLOW === "true";
  }

  // Check localStorage
  const stored = localStorage.getItem("featureFlags");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return { ...flags, ...parsed };
    } catch (e) {
      // Failed to parse feature flags - use defaults
      logError("Failed to parse feature flags from localStorage", e instanceof Error ? e : new Error(String(e)));
    }
  }

  return flags;
}

/**
 * Set feature flags in localStorage
 */
export function setFeatureFlags(flags: Partial<FeatureFlags>) {
  const current = getFeatureFlags();
  const updated = { ...current, ...flags };
  localStorage.setItem("featureFlags", JSON.stringify(updated));
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return getFeatureFlags()[feature];
}

/**
 * Reset all flags to defaults
 */
export function resetFeatureFlags() {
  localStorage.removeItem("featureFlags");
}

/**
 * Toggle feature flag (useful for testing)
 */
export function toggleFeature(feature: keyof FeatureFlags) {
  const current = getFeatureFlags();
  setFeatureFlags({ [feature]: !current[feature] });
}
