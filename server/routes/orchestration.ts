/**
 * Orchestration Routes
 *
 * Exposes the Pipeline Orchestrator via HTTP endpoints for:
 * - Executing full content cycles (Plan → Create → Review → Learn)
 * - Monitoring cycle status and progress
 * - Retrieving collaboration logs and learnings
 */

import { Router, Request, Response } from "express";
import { PipelineOrchestrator } from "../lib/pipeline-orchestrator";
import type { CollaborationContext } from "@shared/collaboration-artifacts";
import {
  createStrategyBrief,
  createBrandHistory,
  createPerformanceLog,
} from "@shared/collaboration-artifacts";
import { authenticateUser } from "../middleware/security";
import { requireScope } from "../middleware/requireScope";
import { assertBrandAccess } from "../lib/brand-access";
import { getCurrentBrandGuide } from "../lib/brand-guide-service";

/**
 * Create and register orchestration routes
 */
function createOrchestrationRouter(): Router {
  const router = Router();

  /**
   * POST /pipeline/execute
   * Execute a complete pipeline cycle (Plan → Create → Review → Learn)
   * Requires authentication and ai:generate scope
   */
  router.post(
    "/pipeline/execute",
    authenticateUser,
    requireScope("ai:generate"),
    async (req: Request, res: Response) => {
      try {
        const { brandId, context, options } = req.body;

        if (!brandId) {
          return res.status(400).json({
            error: "brandId is required",
          });
        }

        // Verify brand access
        assertBrandAccess(req, brandId);

        // ✅ BRAND GUIDE: Load Brand Guide (source of truth)
        const brandGuide = await getCurrentBrandGuide(brandId);
        if (!brandGuide) {
          return res.status(400).json({
            error: "Brand Guide not found. Please complete brand setup first.",
          });
        }

        // Build collaboration context
        const fullContext: Partial<CollaborationContext> = {
          ...context,
          brandHistory: context?.brandHistory || createBrandHistory({ brandId }),
          performanceLog:
            context?.performanceLog ||
            createPerformanceLog({
              brandId,
              contentPerformance: [],
            }),
        };

        // Execute full pipeline cycle
        const orchestrator = new PipelineOrchestrator(brandId);
        const cycle = await orchestrator.executeFullPipeline(fullContext);

      return res.status(200).json({
        success: true,
        cycle: {
          cycleId: cycle.cycleId,
          brandId: cycle.brandId,
          requestId: cycle.requestId,
          timestamp: cycle.timestamp,
          status: cycle.status,
          strategy: cycle.strategy
            ? {
                positioning: cycle.strategy.positioning,
                voice: cycle.strategy.voice,
                competitive: cycle.strategy.competitive,
              }
            : null,
          contentPackage: cycle.contentPackage
            ? {
                contentId: cycle.contentPackage.contentId,
                copy: cycle.contentPackage.copy,
                platform: cycle.contentPackage.platform,
                status: cycle.contentPackage.status,
              }
            : null,
          reviewScores: cycle.reviewScores,
          learnings: cycle.learnings,
          metrics: cycle.metrics,
          errors: cycle.errors,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Pipeline execution failed",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /cycle/:cycleId
   * Get cycle status and progress
   */
  router.get("/cycle/:cycleId", async (req: Request, res: Response) => {
    try {
      const { cycleId } = req.params;

      // Note: In production, would fetch from database
      return res.status(200).json({
        success: true,
        message: `Cycle ${cycleId} status endpoint would fetch from database`,
        cycleId,
        status: "not_found",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Failed to retrieve cycle",
      });
    }
  });

  /**
   * GET /brand/:brandId/cycles
   * Get recent cycles for a brand
   */
  router.get("/brand/:brandId/cycles", async (req: Request, res: Response) => {
    try {
      const { brandId } = req.params;

      return res.status(200).json({
        success: true,
        brandId,
        cycles: [],
        message: "Brand cycles would be fetched from database in production",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Failed to retrieve brand cycles",
      });
    }
  });

  /**
   * POST /strategy/generate
   * Generate a StrategyBrief for a brand (Phase 1: Plan)
   */
  router.post("/strategy/generate", async (req: Request, res: Response) => {
    try {
      const { brandId, strategy: partialStrategy } = req.body;

      if (!brandId) {
        return res.status(400).json({
          error: "brandId is required",
        });
      }

      const strategy = createStrategyBrief({
        brandId,
        version: "1.0.0",
        positioning: partialStrategy?.positioning || {
          tagline: "Your Brand",
          missionStatement: "Building connections",
          targetAudience: {
            demographics: "All",
            psychographics: [],
            painPoints: [],
            aspirations: [],
          },
        },
        voice: partialStrategy?.voice || {
          tone: "professional",
          personality: [],
          keyMessages: [],
          avoidPhrases: [],
        },
        visual: partialStrategy?.visual || {
          primaryColor: "#A76CF5",
          secondaryColor: "#F5C96C",
          accentColor: "#06B6D4",
          fontPairing: {
            heading: "Poppins",
            body: "Inter",
          },
          imagery: {
            style: "photo" as const,
            subjects: [],
          },
        },
        competitive: partialStrategy?.competitive || {
          differentiation: [],
          uniqueValueProposition: "",
        },
      });

      return res.status(200).json({
        success: true,
        strategy,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Strategy generation failed",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /collaboration-log
   * Get collaboration log from a cycle
   */
  router.post("/collaboration-log", async (req: Request, res: Response) => {
    try {
      const { cycleId, contentId } = req.body;

      if (!cycleId && !contentId) {
        return res.status(400).json({
          error: "Either cycleId or contentId is required",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Collaboration log would be fetched from database in production",
        log: [],
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Failed to retrieve collaboration log",
      });
    }
  });

  /**
   * POST /brand-history/summary
   * Get weekly summary from BrandHistory
   */
  router.post("/brand-history/summary", async (req: Request, res: Response) => {
    try {
      const { brandId, days = 7 } = req.body;

      if (!brandId) {
        return res.status(400).json({
          error: "brandId is required",
        });
      }

      return res.status(200).json({
        success: true,
        brandId,
        period: `Last ${days} days`,
        summary: {
          totalCycles: 0,
          successPatterns: [],
          improvements: [],
          trends: [],
          recommendations: [],
        },
        message:
          "Brand history would be summarized from database in production",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Failed to retrieve brand history summary",
      });
    }
  });

  /**
   * GET /health
   * Health check for orchestration system
   */
  router.get("/health", (_req: Request, res: Response) => {
    return res.status(200).json({
      status: "healthy",
      system: "orchestration",
      modules: {
        pipeline: "ready",
        copyAgent: "ready",
        creativeAgent: "ready",
        advisorAgent: "ready",
      },
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

export default createOrchestrationRouter();
