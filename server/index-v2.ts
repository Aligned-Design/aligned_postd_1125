import "dotenv/config";
import express from "express";
import cors from "cors";
import { logger } from "./lib/logger";

// ✅ CRITICAL: Validate Supabase environment variables on startup
// NOTE: Server code should use SUPABASE_URL (not VITE_SUPABASE_URL)
// VITE_* prefix is for client-side code only. Fallback to VITE_SUPABASE_URL
// is kept for backward compatibility but should be removed in future versions.
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  logger.error("SUPABASE_URL (or VITE_SUPABASE_URL fallback) is not set. Auth and database operations will fail.", undefined, {
    error: "SUPABASE_URL_MISSING",
  });
  throw new Error("SUPABASE_URL is required");
}

if (!supabaseServiceKey) {
  logger.error("SUPABASE_SERVICE_ROLE_KEY is not set. Auth and database operations will fail.", undefined, {
    error: "SUPABASE_SERVICE_ROLE_KEY_MISSING",
  });
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
}

if (supabaseUrl && supabaseServiceKey) {
  logger.info("Supabase credentials configured", {
    url: supabaseUrl,
    hasServiceKey: true,
    keyLength: supabaseServiceKey.length,
  });
} else {
  logger.error("Supabase credentials incomplete - server will fail", undefined, {
    error: "SUPABASE_CREDENTIALS_INCOMPLETE",
    missing: {
      url: !supabaseUrl,
      serviceKey: !supabaseServiceKey,
    },
  });
  throw new Error("Supabase environment variables are required");
}

// ✅ CRITICAL: Verify Supabase connection on startup
import { supabase } from "./lib/supabase";

async function verifySupabaseConnection() {
  try {
    logger.info("Verifying Supabase connection");
    
    // Test query to verify connection
    const { data, error } = await supabase
      .from("tenants")
      .select("id")
      .limit(1);
    
    if (error) {
      logger.error("Supabase connection test failed", new Error(error.message), {
        error: "SUPABASE_CONNECTION_FAILED",
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    
    logger.info("Supabase connection verified", {
      url: supabaseUrl,
      testQuery: "success",
      rowCount: data?.length || 0,
    });
  } catch (err) {
    logger.error("CRITICAL: Supabase verification failed", err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
}

// Run verification (but don't block server startup in production)
if (process.env.NODE_ENV !== "production") {
  verifySupabaseConnection().catch((err) => {
    logger.warn("Supabase verification error (continuing anyway)", {
      error: err instanceof Error ? err.message : String(err),
    });
  });
}

// Import error handling
import { AppError, errorHandler } from "./lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "./lib/error-responses";

// Import RBAC middleware
import { authenticateUser } from "./middleware/security";
import { requireScope } from "./middleware/requireScope";

// Import route routers (add incrementally)
import authRouter from "./routes/auth";
import authDiagnosticsRouter from "./routes/auth-diagnostics";
import milestonesRouter from "./routes/milestones";
import agentsRouter from "./routes/agents";
import analyticsRouter from "./routes/analytics-v2";
import contentItemsRouter from "./routes/content-items";
import approvalsRouter from "./routes/approvals-v2";
import mediaRouter from "./routes/media-v2";
import brandsRouter from "./routes/brands";
import crawlerRouter from "./routes/crawler";
import brandGuideRouter from "./routes/brand-guide";
import onboardingRouter from "./routes/onboarding";
import contentPlanRouter from "./routes/content-plan";
import { getAdvisorInsights } from "./routes/advisor";
import { generateDocContent } from "./routes/doc-agent";
import { generateDesignContent } from "./routes/design-agent";
import { getDashboardData } from "./routes/dashboard";
import { validateBrandId } from "./middleware/validate-brand-id";
import debugHealthRouter from "./routes/debug-health";
import reviewsRouter from "./routes/reviews";
import studioRouter from "./routes/creative-studio";
import contentPackagesRouter from "./routes/content-packages";
import orchestrationRouter from "./routes/orchestration";
import brandBrainRouter from "./routes/brand-brain";
import { getSyncState } from "./routes/ai-sync";
import {
  handleZapierWebhook,
  handleMakeWebhook,
  handleSlackWebhook,
  handleHubSpotWebhook,
  getWebhookStatus,
  getWebhookLogs,
  retryWebhookEvent,
} from "./routes/webhooks";
// Import missing routers for reality check remediation
import aiMetricsRouter from "./routes/ai-metrics";
import reportsRouter from "./routes/reports";
import whiteLabelRouter from "./routes/white-label";
import trialRouter from "./routes/trial";
import clientPortalRouter from "./routes/client-portal";
import publishingRouter from "./routes/publishing-router";
import integrationsRouter from "./routes/integrations";
import aiRewriteRouter from "./routes/ai-rewrite";

export function createServer() {
  const app = express();

  // CORS Configuration
  const corsOptions = {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.VITE_APP_URL
        : [
            "http://localhost:5173",
            "http://localhost:8080",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8080",
          ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload",
      );
    }
    next();
  });

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoints
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/ping", (_req, res) => {
    res.json({ message: process.env.PING_MESSAGE || "pong" });
  });

  // =============================================================================
  // Webhook Routes (No authentication - uses signature verification)
  // =============================================================================
  app.post("/api/webhooks/zapier", handleZapierWebhook);
  app.post("/api/webhooks/make", handleMakeWebhook);
  app.post("/api/webhooks/slack", handleSlackWebhook);
  app.post("/api/webhooks/hubspot", handleHubSpotWebhook);
  app.get("/api/webhooks/status/:eventId", getWebhookStatus);
  app.get("/api/webhooks/logs", getWebhookLogs);
  app.post("/api/webhooks/retry/:eventId", retryWebhookEvent);

  // ✅ CRITICAL: All routes require authentication
  // AI Agent routes (Sprint 1)
  app.post("/api/ai/advisor", authenticateUser, getAdvisorInsights);
  app.post("/api/ai/doc", authenticateUser, validateBrandId, generateDocContent); // Validates brandId from request body
  app.post("/api/ai/design", authenticateUser, validateBrandId, generateDesignContent); // Validates brandId from request body
  app.post("/api/ai/sync", authenticateUser, getSyncState); // Collaboration state endpoint
  
  // Dashboard route (Sprint 1)
  app.post("/api/dashboard", authenticateUser, validateBrandId, getDashboardData); // Validates brandId from request body

  // =============================================================================
  // Mount Routers
  // =============================================================================

  // ✅ AUTH: Real Supabase Auth routes (must be before other routes)
  app.use("/api/auth", authRouter);
  
  // ✅ AUTH DIAGNOSTICS: Only in development/staging (remove in production)
  if (process.env.NODE_ENV !== "production") {
    app.use("/api/auth", authDiagnosticsRouter);
  }

  // Core routes that are working
  app.use("/api/milestones", milestonesRouter);
  app.use("/api/agents", agentsRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/approvals", approvalsRouter);
  app.use("/api/media", mediaRouter);
  app.use("/api/reviews", reviewsRouter);
  
  // ✅ CRITICAL: Brand and onboarding routes (required for onboarding flow)
  app.use("/api/brands", brandsRouter);
  app.use("/api/crawl", crawlerRouter);
  app.use("/api/brand-guide", brandGuideRouter);
  app.use("/api/onboarding", onboardingRouter);
  app.use("/api/content-plan", contentPlanRouter);
  app.use("/api/content-items", contentItemsRouter);
  app.use("/api/studio", authenticateUser, studioRouter);
  app.use("/api/content-packages", authenticateUser, contentPackagesRouter);
  app.use("/api/orchestration", authenticateUser, orchestrationRouter);
  app.use("/api/brand-brain", authenticateUser, brandBrainRouter);
  
  // ✅ REALITY CHECK FIX: Register previously disconnected routes
  app.use("/api/metrics", authenticateUser, aiMetricsRouter);
  app.use("/api/reports", authenticateUser, reportsRouter);
  app.use("/api/white-label", authenticateUser, whiteLabelRouter);
  app.use("/api/trial", trialRouter);
  app.use("/api/client-portal", authenticateUser, clientPortalRouter);
  app.use("/api/publishing", authenticateUser, publishingRouter);
  app.use("/api/integrations", authenticateUser, integrationsRouter);
  app.use("/api/ai-rewrite", aiRewriteRouter);
  
  // ✅ DEBUG: Health check endpoint (comprehensive system verification)
  app.use("/api/debug", debugHealthRouter);

  // =============================================================================
  // Error Handling
  // =============================================================================

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      error: "Not Found",
      message: "The requested resource was not found",
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}

// Only start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createServer();
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    logger.info("Fusion Server v2 started", {
      port,
      frontend: `http://localhost:${port}`,
      api: `http://localhost:${port}/api`,
      health: `http://localhost:${port}/health`,
    });
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    logger.info("Received SIGTERM, shutting down gracefully");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    logger.info("Received SIGINT, shutting down gracefully");
    process.exit(0);
  });
}
