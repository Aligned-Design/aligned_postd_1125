/**
 * Agent Registry
 * 
 * Central catalog of all AI agents, their routes, workers, and dependencies.
 * Used for health checks, orchestration, and monitoring.
 */

export interface AgentConfig {
  id: string;
  name: string;
  route: string;
  worker?: string;
  dependencies: {
    envVars: string[];
    services: string[];
  };
  healthCheck?: () => Promise<{ status: "ok" | "degraded" | "error"; message: string }>;
}

/**
 * Registry of all AI agents in the system
 */
export const AGENTS: Record<string, AgentConfig> = {
  doc: {
    id: "doc",
    name: "Doc Agent (Copywriter)",
    route: "/api/ai/doc",
    worker: "ai-generation",
    dependencies: {
      envVars: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"],
      services: ["supabase", "brand-guide"],
    },
  },
  design: {
    id: "design",
    name: "Design Agent (Creative)",
    route: "/api/ai/design",
    worker: "ai-generation",
    dependencies: {
      envVars: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"],
      services: ["supabase", "brand-guide"],
    },
  },
  advisor: {
    id: "advisor",
    name: "Advisor Agent (Strategy)",
    route: "/api/ai/advisor",
    worker: "advisor-engine",
    dependencies: {
      envVars: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"],
      services: ["supabase", "brand-guide", "analytics"],
    },
  },
  orchestrator: {
    id: "orchestrator",
    name: "Pipeline Orchestrator",
    route: "/api/orchestration/pipeline/execute",
    dependencies: {
      envVars: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"],
      services: ["supabase", "brand-guide"],
    },
  },
  crawler: {
    id: "crawler",
    name: "Brand Crawler",
    route: "/api/crawler/start",
    worker: "brand-crawler",
    dependencies: {
      envVars: ["OPENAI_API_KEY"],
      services: ["supabase"],
    },
  },
};

/**
 * Get all agent IDs
 */
export function getAgentIds(): string[] {
  return Object.keys(AGENTS);
}

/**
 * Get agent config by ID
 */
export function getAgent(id: string): AgentConfig | undefined {
  return AGENTS[id];
}

/**
 * Get all agents
 */
export function getAllAgents(): AgentConfig[] {
  return Object.values(AGENTS);
}

