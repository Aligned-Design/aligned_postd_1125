/**
 * Agent Preflight Utilities
 *
 * Provides preflight checks for all AI agents in the POSTD system.
 * Ensures agents operate within their defined boundaries and have
 * necessary context before performing operations.
 *
 * GLOBAL PREFLIGHT RULES (BRAND AGENTS):
 * - Always work for one brand at a time using `brand_id`
 * - NEVER use or reference data from other brands
 * - Always request Brand Context from Brand Brain before generating
 * - Brand Brain rules override default agent behavior
 * - Do not invent facts about the brand
 */

import { getBrandContextPack } from "./brand-brain-service";
import { getCurrentBrandGuide } from "./brand-guide-service";
import type {
  AgentType,
  AgentPreflightResult,
  AgentPreflightConfig,
  BrandContextPack,
  AGENT_PREFLIGHT_CONFIGS,
} from "@shared/brand-brain";

// Re-export configs for use in agents
export { AGENT_PREFLIGHT_CONFIGS } from "@shared/brand-brain";

// ============================================================================
// PREFLIGHT CHECK FUNCTION
// ============================================================================

/**
 * Run preflight checks for an agent before any operation.
 *
 * @param agentType - The type of agent running the check
 * @param brandId - The brand ID (optional for some agents like ops_brain)
 * @param options - Additional options for the preflight check
 * @returns PreflightResult with pass/fail status and any loaded context
 */
export async function runAgentPreflight(
  agentType: AgentType,
  brandId?: string,
  options?: {
    requireBrandGuide?: boolean;
    mode?: "context" | "evaluation" | "learning";
  }
): Promise<AgentPreflightResult & { contextPack?: BrandContextPack }> {
  const config = getAgentConfig(agentType);
  const errors: string[] = [];
  const warnings: string[] = [];
  let contextLoaded = false;
  let contextPack: BrandContextPack | undefined;

  // 1. Check if brand ID is required and present
  if (config.requiresBrandId && !brandId) {
    errors.push(`Agent ${agentType} requires a brand_id but none was provided`);
  }

  // 2. Validate brand ID format if provided
  if (brandId && !isValidUUID(brandId)) {
    errors.push(`Invalid brand_id format: ${brandId}`);
  }

  // 3. Load brand context if required and brand ID is valid
  if (config.requiresBrandContext && brandId && isValidUUID(brandId)) {
    try {
      contextPack = await getBrandContextPack(brandId) ?? undefined;
      if (contextPack) {
        contextLoaded = true;
      } else {
        warnings.push(`Could not load brand context for ${brandId} - Brand Brain state may need to be initialized`);
      }
    } catch (error) {
      warnings.push(`Error loading brand context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 4. Check for Brand Guide if explicitly required
  if (options?.requireBrandGuide && brandId) {
    try {
      const brandGuide = await getCurrentBrandGuide(brandId);
      if (!brandGuide) {
        warnings.push(`Brand Guide not found for ${brandId}`);
      }
    } catch (error) {
      warnings.push(`Error loading Brand Guide: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 5. Validate agent-specific constraints
  if (agentType === "ops_brain" && brandId) {
    warnings.push("Ops Brain should not receive brand_id - it operates at system level only");
  }

  if (!config.canAccessBrandContent && options?.mode === "evaluation") {
    errors.push(`Agent ${agentType} is not allowed to access brand content for evaluation`);
  }

  const passed = errors.length === 0;

  return {
    passed,
    brandId: brandId || "",
    contextLoaded,
    errors,
    warnings,
    mode: options?.mode,
    contextPack,
  };
}

// ============================================================================
// AGENT-SPECIFIC PREFLIGHT FUNCTIONS
// ============================================================================

/**
 * Preflight for Brand Brain agent
 */
export async function brandBrainPreflight(
  brandId: string,
  mode: "context" | "evaluation" | "learning"
): Promise<AgentPreflightResult> {
  const result = await runAgentPreflight("brand_brain", brandId, { mode });

  // Brand Brain specific checks
  if (mode === "evaluation" && !result.contextLoaded) {
    result.warnings.push("Brand Brain state should exist before evaluation mode");
  }

  return result;
}

/**
 * Preflight for Copy Agent
 */
export async function copyAgentPreflight(
  brandId: string
): Promise<AgentPreflightResult & { contextPack?: BrandContextPack }> {
  const result = await runAgentPreflight("copy", brandId, { requireBrandGuide: true });

  if (!result.contextLoaded) {
    result.errors.push("Copy Agent requires brand context from Brand Brain");
    result.passed = false;
  }

  return result;
}

/**
 * Preflight for Creative/Design Agent
 */
export async function creativeAgentPreflight(
  brandId: string
): Promise<AgentPreflightResult & { contextPack?: BrandContextPack }> {
  const result = await runAgentPreflight("creative", brandId, { requireBrandGuide: true });

  // Creative agent needs visual rules
  if (result.contextPack && (!result.contextPack.visualRules || result.contextPack.visualRules.colors.length === 0)) {
    result.warnings.push("Visual rules are incomplete - colors not defined");
  }

  return result;
}

/**
 * Preflight for Advisor/Strategy Agent
 */
export async function advisorAgentPreflight(
  brandId: string
): Promise<AgentPreflightResult & { contextPack?: BrandContextPack }> {
  const result = await runAgentPreflight("advisor", brandId, { requireBrandGuide: true });

  // Advisor needs positioning info
  if (result.contextPack && !result.contextPack.brandSummary.targetAudience) {
    result.warnings.push("Target audience not defined - recommendations may be generic");
  }

  return result;
}

/**
 * Preflight for Scheduler Agent
 */
export async function schedulerAgentPreflight(
  brandId: string
): Promise<AgentPreflightResult & { contextPack?: BrandContextPack }> {
  const result = await runAgentPreflight("scheduler", brandId);

  // Scheduler needs platform preferences
  if (result.contextPack && result.contextPack.brandSummary && !result.contextPack.contentPillars?.length) {
    result.warnings.push("No content pillars defined - scheduling may lack thematic variety");
  }

  return result;
}

/**
 * Preflight for Approvals/Review Agent
 */
export async function approvalsAgentPreflight(
  brandId: string
): Promise<AgentPreflightResult & { contextPack?: BrandContextPack }> {
  const result = await runAgentPreflight("approvals", brandId);

  if (!result.contextPack) {
    result.warnings.push("Brand context not loaded - approval recommendations may be limited");
  }

  return result;
}

/**
 * Preflight for Analytics/Learning Agent
 */
export async function analyticsAgentPreflight(
  brandId: string
): Promise<AgentPreflightResult> {
  const result = await runAgentPreflight("analytics", brandId);

  // Analytics agent doesn't need full context but needs brand ID
  if (!brandId) {
    result.errors.push("Analytics Agent requires brand_id for metrics analysis");
    result.passed = false;
  }

  return result;
}

/**
 * Preflight for Ops Brain agent (no brand context needed)
 */
export async function opsBrainPreflight(): Promise<AgentPreflightResult> {
  return {
    passed: true,
    brandId: "",
    contextLoaded: false,
    errors: [],
    warnings: [],
    mode: undefined,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get agent configuration
 */
function getAgentConfig(agentType: AgentType): AgentPreflightConfig {
  const configs: Record<AgentType, AgentPreflightConfig> = {
    brand_brain: {
      agentType: "brand_brain",
      requiresBrandContext: false,
      requiresBrandId: true,
      canAccessBrandContent: true,
      canAccessMetrics: true,
    },
    ops_brain: {
      agentType: "ops_brain",
      requiresBrandContext: false,
      requiresBrandId: false,
      canAccessBrandContent: false,
      canAccessMetrics: true,
    },
    copy: {
      agentType: "copy",
      requiresBrandContext: true,
      requiresBrandId: true,
      canAccessBrandContent: true,
      canAccessMetrics: false,
    },
    creative: {
      agentType: "creative",
      requiresBrandContext: true,
      requiresBrandId: true,
      canAccessBrandContent: true,
      canAccessMetrics: false,
    },
    advisor: {
      agentType: "advisor",
      requiresBrandContext: true,
      requiresBrandId: true,
      canAccessBrandContent: true,
      canAccessMetrics: true,
    },
    scheduler: {
      agentType: "scheduler",
      requiresBrandContext: true,
      requiresBrandId: true,
      canAccessBrandContent: false,
      canAccessMetrics: false,
    },
    approvals: {
      agentType: "approvals",
      requiresBrandContext: true,
      requiresBrandId: true,
      canAccessBrandContent: true,
      canAccessMetrics: false,
    },
    analytics: {
      agentType: "analytics",
      requiresBrandContext: false,
      requiresBrandId: true,
      canAccessBrandContent: false,
      canAccessMetrics: true,
    },
  };

  return configs[agentType];
}

/**
 * Validate UUID format
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ============================================================================
// AGENT BOUNDARY ENFORCEMENT
// ============================================================================

/**
 * Decorator/wrapper to enforce agent boundaries
 * Use this to wrap agent operations to ensure preflight passes
 */
export async function withAgentPreflight<T>(
  agentType: AgentType,
  brandId: string | undefined,
  operation: (context: BrandContextPack | undefined) => Promise<T>,
  options?: {
    requireBrandGuide?: boolean;
    mode?: "context" | "evaluation" | "learning";
  }
): Promise<T> {
  const preflight = await runAgentPreflight(agentType, brandId, options);

  if (!preflight.passed) {
    throw new Error(
      `Agent preflight failed for ${agentType}: ${preflight.errors.join("; ")}`
    );
  }

  // Log warnings
  if (preflight.warnings.length > 0) {
    console.warn(
      `[Agent Preflight] Warnings for ${agentType}:`,
      preflight.warnings
    );
  }

  return operation(preflight.contextPack);
}

// ============================================================================
// AGENT GUARDRAILS
// ============================================================================

/**
 * Validate that an agent is not crossing brand boundaries
 */
export function validateBrandBoundary(
  agentType: AgentType,
  requestedBrandId: string,
  currentBrandId: string
): boolean {
  if (agentType === "ops_brain") {
    // Ops Brain doesn't work with brands
    return true;
  }

  if (requestedBrandId !== currentBrandId) {
    console.error(
      `[Agent Boundary Violation] ${agentType} attempted to access brand ${requestedBrandId} while operating on ${currentBrandId}`
    );
    return false;
  }

  return true;
}

/**
 * Check if agent can perform a specific action
 */
export function canAgentPerformAction(
  agentType: AgentType,
  action: "read_content" | "write_content" | "read_metrics" | "evaluate" | "schedule"
): boolean {
  const config = getAgentConfig(agentType);

  switch (action) {
    case "read_content":
    case "write_content":
      return config.canAccessBrandContent;
    case "read_metrics":
      return config.canAccessMetrics;
    case "evaluate":
      return agentType === "brand_brain" || agentType === "approvals";
    case "schedule":
      return agentType === "scheduler" || agentType === "advisor";
    default:
      return false;
  }
}

