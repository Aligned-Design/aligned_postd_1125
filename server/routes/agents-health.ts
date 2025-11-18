/**
 * Agents Health Endpoint
 * 
 * Provides unified health status for all AI agents in the system.
 * 
 * GET /api/agents/health
 * 
 * Returns status for each agent including:
 * - Overall status (ok, degraded, error)
 * - Dependency checks (env vars, services)
 * - Optional lightweight health checks
 */

import { Router, Request, Response } from "express";
import { AGENTS, getAgentIds } from "../lib/agent-registry";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";

const router = Router();

interface AgentHealthStatus {
  status: "ok" | "degraded" | "error";
  message: string;
  dependencies: {
    envVars: Record<string, boolean>;
    services: Record<string, boolean>;
  };
  lastChecked?: string;
}

interface AgentsHealthResponse {
  overall: "ok" | "degraded" | "error";
  timestamp: string;
  agents: Record<string, AgentHealthStatus>;
}

/**
 * Check if an environment variable is set
 */
function checkEnvVar(name: string): boolean {
  return !!process.env[name];
}

/**
 * Check Supabase connection
 */
async function checkSupabase(): Promise<boolean> {
  try {
    const { error } = await supabase.from("brands").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Check if AI provider is available
 */
async function checkAIProvider(): Promise<boolean> {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  return hasAnthropic || hasOpenAI;
}

/**
 * Check if brand guide service is available
 */
async function checkBrandGuideService(): Promise<boolean> {
  try {
    // Lightweight check - just verify the service can be imported
    const { getCurrentBrandGuide } = await import("../lib/brand-guide-service");
    return typeof getCurrentBrandGuide === "function";
  } catch {
    return false;
  }
}

/**
 * Check if analytics service is available
 */
async function checkAnalyticsService(): Promise<boolean> {
  try {
    // Lightweight check - verify analytics tables exist
    const { error } = await supabase.from("analytics_metrics").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Perform health check for a single agent
 */
async function checkAgentHealth(agentId: string): Promise<AgentHealthStatus> {
  const agent = AGENTS[agentId];
  if (!agent) {
    return {
      status: "error",
      message: `Agent ${agentId} not found in registry`,
      dependencies: {
        envVars: {},
        services: {},
      },
    };
  }

  const dependencies = {
    envVars: {} as Record<string, boolean>,
    services: {} as Record<string, boolean>,
  };

  // Check environment variables
  for (const envVar of agent.dependencies.envVars) {
    dependencies.envVars[envVar] = checkEnvVar(envVar);
  }

  // Check services
  for (const service of agent.dependencies.services) {
    switch (service) {
      case "supabase":
        dependencies.services.supabase = await checkSupabase();
        break;
      case "brand-guide":
        dependencies.services["brand-guide"] = await checkBrandGuideService();
        break;
      case "analytics":
        dependencies.services.analytics = await checkAnalyticsService();
        break;
      default:
        dependencies.services[service] = true; // Assume ok for unknown services
    }
  }

  // Determine overall status
  const allEnvVarsOk = Object.values(dependencies.envVars).every((v) => v);
  const allServicesOk = Object.values(dependencies.services).every((v) => v);

  let status: "ok" | "degraded" | "error" = "ok";
  let message = `${agent.name} is operational`;

  if (!allEnvVarsOk && !allServicesOk) {
    status = "error";
    message = `${agent.name} is unavailable - missing dependencies`;
  } else if (!allEnvVarsOk || !allServicesOk) {
    status = "degraded";
    message = `${agent.name} is partially available - some dependencies missing`;
  }

  // Optional: Run agent-specific health check if available
  if (agent.healthCheck) {
    try {
      const healthResult = await agent.healthCheck();
      if (healthResult.status !== "ok") {
        status = healthResult.status;
        message = healthResult.message;
      }
    } catch (error: any) {
      status = "error";
      message = `${agent.name} health check failed: ${error.message}`;
    }
  }

  return {
    status,
    message,
    dependencies,
    lastChecked: new Date().toISOString(),
  };
}

/**
 * GET /api/agents/health
 * 
 * Returns health status for all agents
 */
router.get("/", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = (req as any).headers["x-request-id"] || `health-${Date.now()}`;

  try {
    logger.info("Agents health check requested", {
      requestId,
      path: req.path,
    });

    const agentIds = getAgentIds();
    const agentStatuses: Record<string, AgentHealthStatus> = {};

    // Check each agent in parallel
    const healthChecks = agentIds.map(async (agentId) => {
      const status = await checkAgentHealth(agentId);
      agentStatuses[agentId] = status;
    });

    await Promise.all(healthChecks);

    // Determine overall status
    const statuses = Object.values(agentStatuses).map((s) => s.status);
    let overall: "ok" | "degraded" | "error" = "ok";

    if (statuses.some((s) => s === "error")) {
      overall = "error";
    } else if (statuses.some((s) => s === "degraded")) {
      overall = "degraded";
    }

    const response: AgentsHealthResponse = {
      overall,
      timestamp: new Date().toISOString(),
      agents: agentStatuses,
    };

    const durationMs = Date.now() - startTime;
    logger.info("Agents health check completed", {
      requestId,
      overall,
      durationMs,
      agentCount: agentIds.length,
    });

    res.status(overall === "error" ? 503 : overall === "degraded" ? 200 : 200).json(response);
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    logger.error("Agents health check failed", error, {
      requestId,
      durationMs,
    });

    res.status(500).json({
      overall: "error",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
      message: error.message,
      agents: {},
    });
  }
});

export default router;

