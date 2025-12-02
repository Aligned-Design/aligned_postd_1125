/**
 * Health Check Routes
 * 
 * Simple healthcheck endpoints for monitoring.
 */

import { RequestHandler, Router } from "express";
import { supabase } from "../lib/supabase";
import { createClient } from "@supabase/supabase-js";

const router = Router();

/**
 * GET /health
 * Basic health check with AI and integration status
 */
router.get("/", ((_req, res) => {
  // Check AI configuration
  const provider = process.env.AI_PROVIDER || "openai";
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const aiConfigured = hasOpenAI || hasAnthropic;

  // Check integration configuration (OAuth redirect URLs)
  // Note: We don't check actual connections here, just if OAuth is configured
  const hasOAuthConfig = !!(
    process.env.META_APP_ID ||
    process.env.LINKEDIN_CLIENT_ID ||
    process.env.TIKTOK_CLIENT_KEY
  );

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "postd-backend",
    aiConfigured,
    aiProvider: aiConfigured ? (hasOpenAI ? "openai" : "anthropic") : null,
    integrationsConfigured: hasOAuthConfig,
  });
}) as RequestHandler);

/**
 * GET /health/ai
 * Check AI service availability
 */
router.get("/ai", (async (_req, res) => {
  try {
    // Check if AI provider is configured
    const provider = process.env.AI_PROVIDER || "openai";
    const hasApiKey =
      provider === "openai"
        ? !!process.env.OPENAI_API_KEY
        : !!process.env.ANTHROPIC_API_KEY;

    res.json({
      status: hasApiKey ? "ok" : "degraded",
      provider,
      configured: hasApiKey,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}) as RequestHandler);

/**
 * GET /health/supabase
 * Check Supabase connection
 */
router.get("/supabase", (async (_req, res) => {
  try {
    const { data, error } = await supabase.from("brands").select("id").limit(1);

    if (error) {
      res.status(503).json({
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      status: "ok",
      connected: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}) as RequestHandler);

export default router;

