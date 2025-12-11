/**
 * Brand Brain API Routes
 *
 * Endpoints for Brand Brain operations:
 * - GET /api/brand-brain/:brandId/context - Get context pack for agents
 * - POST /api/brand-brain/:brandId/evaluate - Evaluate content for brand alignment
 * - POST /api/brand-brain/:brandId/outcome - Register content outcome
 * - POST /api/brand-brain/:brandId/refresh - Refresh state from Brand Guide
 * - GET /api/brand-brain/:brandId/state - Get current Brand Brain state
 * - GET /api/brand-brain/:brandId/examples - Get learning examples
 * - GET /api/brand-brain/:brandId/events - Get event log
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  brandBrain,
  getBrandContextPack,
  evaluateContent,
  registerOutcome,
  refreshBrandBrainState,
} from "../lib/brand-brain-service";
import { supabase } from "../lib/supabase";
import type { ContentEvaluationInput, OutcomeRegistrationInput } from "@shared/brand-brain";

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const evaluateContentSchema = z.object({
  channel: z.string().min(1),
  content: z.object({
    body: z.string().min(1),
    headline: z.string().optional(),
    cta: z.string().optional(),
    hashtags: z.array(z.string()).optional(),
    mediaRefs: z.array(z.string()).optional(),
  }),
  goal: z.enum([
    "awareness",
    "engagement",
    "nurture",
    "launch",
    "lead_gen",
    "conversion",
    "retention",
    "education",
    "entertainment",
  ]),
  context: z.string().optional(),
});

const registerOutcomeSchema = z.object({
  contentId: z.string().min(1),
  channel: z.string().min(1),
  performanceMetrics: z.object({
    engagementRate: z.number().optional(),
    reach: z.number().optional(),
    clicks: z.number().optional(),
    saves: z.number().optional(),
    shares: z.number().optional(),
    comments: z.number().optional(),
    conversions: z.number().optional(),
  }),
  userFeedback: z
    .object({
      rating: z.enum(["great", "good", "neutral", "poor", "off_brand"]),
      comment: z.string().optional(),
    })
    .optional(),
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/brand-brain/:brandId/context
 *
 * Get Brand Context Pack for use by other agents.
 * This is the primary endpoint for agents to fetch brand context.
 */
router.get("/:brandId/context", async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    const contextPack = await getBrandContextPack(brandId);

    if (!contextPack) {
      return res.status(404).json({
        error: "Brand context not found",
        message: "Brand Brain state could not be created. Ensure brand has a valid Brand Guide.",
      });
    }

    return res.json({
      success: true,
      data: contextPack,
    });
  } catch (error) {
    console.error("[BrandBrain API] Error getting context:", error);
    return res.status(500).json({
      error: "Failed to get brand context",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/brand-brain/:brandId/evaluate
 *
 * Evaluate content for brand alignment.
 * Returns BFS-like score, checks, and recommendations.
 */
router.post("/:brandId/evaluate", async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    // Validate request body
    const parseResult = evaluateContentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parseResult.error.issues,
      });
    }

    const input: ContentEvaluationInput = parseResult.data;
    const result = await evaluateContent(brandId, input);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[BrandBrain API] Error evaluating content:", error);
    return res.status(500).json({
      error: "Failed to evaluate content",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/brand-brain/:brandId/outcome
 *
 * Register content outcome for learning.
 * Called by analytics or after user feedback.
 */
router.post("/:brandId/outcome", async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    // Validate request body
    const parseResult = registerOutcomeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parseResult.error.issues,
      });
    }

    const input: OutcomeRegistrationInput = parseResult.data;
    await registerOutcome(brandId, input);

    return res.json({
      success: true,
      message: "Outcome registered successfully",
    });
  } catch (error) {
    console.error("[BrandBrain API] Error registering outcome:", error);
    return res.status(500).json({
      error: "Failed to register outcome",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/brand-brain/:brandId/refresh
 *
 * Refresh Brand Brain state from Brand Guide.
 * Called after brand guide updates.
 */
router.post("/:brandId/refresh", async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    await refreshBrandBrainState(brandId);

    return res.json({
      success: true,
      message: "Brand Brain state refreshed from Brand Guide",
    });
  } catch (error) {
    console.error("[BrandBrain API] Error refreshing state:", error);
    return res.status(500).json({
      error: "Failed to refresh state",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/brand-brain/:brandId/state
 *
 * Get current Brand Brain state.
 * Useful for debugging and admin views.
 */
router.get("/:brandId/state", async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    const { data, error } = await supabase
      .from("brand_brain_state")
      .select("*")
      .eq("brand_id", brandId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Brand Brain state not found" });
      }
      throw error;
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[BrandBrain API] Error getting state:", error);
    return res.status(500).json({
      error: "Failed to get state",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/brand-brain/:brandId/examples
 *
 * Get learning examples for a brand.
 * Supports filtering by type and channel.
 */
router.get("/:brandId/examples", async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;
    const { type, channel, limit = "20" } = req.query;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    let query = supabase
      .from("brand_brain_examples")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(parseInt(limit as string, 10));

    if (type) {
      query = query.eq("example_type", type as string);
    }

    if (channel) {
      query = query.eq("channel", channel as string);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("[BrandBrain API] Error getting examples:", error);
    return res.status(500).json({
      error: "Failed to get examples",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/brand-brain/:brandId/events
 *
 * Get event log for a brand.
 * Supports filtering by type and pagination.
 */
router.get("/:brandId/events", async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;
    const { type, limit = "50", offset = "0" } = req.query;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    let query = supabase
      .from("brand_brain_events")
      .select("*", { count: "exact" })
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .range(parseInt(offset as string, 10), parseInt(offset as string, 10) + parseInt(limit as string, 10) - 1);

    if (type) {
      query = query.eq("event_type", type as string);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data,
      count,
      pagination: {
        offset: parseInt(offset as string, 10),
        limit: parseInt(limit as string, 10),
        total: count,
      },
    });
  } catch (error) {
    console.error("[BrandBrain API] Error getting events:", error);
    return res.status(500).json({
      error: "Failed to get events",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/brand-brain/:brandId/examples
 *
 * Add a manual example.
 */
router.post("/:brandId/examples", async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;
    const { exampleType, channel, content, notes } = req.body;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    if (!exampleType || !channel || !content?.body) {
      return res.status(400).json({
        error: "Missing required fields: exampleType, channel, content.body",
      });
    }

    const { data, error } = await supabase
      .from("brand_brain_examples")
      .insert({
        brand_id: brandId,
        example_type: exampleType,
        channel,
        content,
        notes,
        source: "manual",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[BrandBrain API] Error adding example:", error);
    return res.status(500).json({
      error: "Failed to add example",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * DELETE /api/brand-brain/:brandId/examples/:exampleId
 *
 * Delete an example.
 */
router.delete("/:brandId/examples/:exampleId", async (req: Request, res: Response) => {
  try {
    const { brandId, exampleId } = req.params;

    if (!brandId || !exampleId) {
      return res.status(400).json({ error: "Brand ID and Example ID are required" });
    }

    const { error } = await supabase
      .from("brand_brain_examples")
      .delete()
      .eq("id", exampleId)
      .eq("brand_id", brandId);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      message: "Example deleted",
    });
  } catch (error) {
    console.error("[BrandBrain API] Error deleting example:", error);
    return res.status(500).json({
      error: "Failed to delete example",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

