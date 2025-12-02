import "dotenv/config";
import express from "express";
import cors from "cors";

// ✅ CRITICAL: Validate Supabase environment variables on startup
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ CRITICAL: SUPABASE_URL or VITE_SUPABASE_URL is not set!");
  console.error("   Auth and database operations will fail.");
  console.error("   Set SUPABASE_URL or VITE_SUPABASE_URL in your environment variables.");
}

if (!supabaseServiceKey) {
  console.error("❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set!");
  console.error("   Auth and database operations will fail.");
  console.error("   Set SUPABASE_SERVICE_ROLE_KEY in your environment variables.");
}

if (supabaseUrl && supabaseServiceKey) {
  console.log("✅ Supabase credentials configured", {
    url: supabaseUrl,
    hasServiceKey: true,
    keyLength: supabaseServiceKey.length,
  });
} else {
  console.error("❌ CRITICAL: Supabase credentials incomplete - server will fail!");
  console.error("   Missing:", {
    url: !supabaseUrl,
    serviceKey: !supabaseServiceKey,
  });
  throw new Error("Supabase environment variables are required");
}

// ✅ CRITICAL: Verify Supabase connection on startup
import { supabase } from "./lib/supabase";

async function verifySupabaseConnection() {
  try {
    console.log("[Server] 🔍 Verifying Supabase connection...");
    
    // Test query to verify connection
    const { data, error } = await supabase
      .from("tenants")
      .select("id")
      .limit(1);
    
    if (error) {
      console.error("[Server] ❌ Supabase connection test FAILED:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    
    console.log("[Server] ✅ Supabase connection verified", {
      url: supabaseUrl,
      testQuery: "success",
      rowCount: data?.length || 0,
    });
  } catch (err) {
    console.error("[Server] ❌ CRITICAL: Supabase verification failed", err);
    throw err;
  }
}

// Run verification (but don't block server startup in production)
if (process.env.NODE_ENV !== "production") {
  verifySupabaseConnection().catch((err) => {
    console.error("[Server] ⚠️  Supabase verification error (continuing anyway):", err);
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
import debugHealthRouter from "./routes/debug-health";

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

  // ✅ CRITICAL: All routes require authentication
  // AI Agent routes (Sprint 1)
  app.post("/api/ai/advisor", authenticateUser, getAdvisorInsights);
  app.post("/api/ai/doc", authenticateUser, generateDocContent);
  app.post("/api/ai/design", authenticateUser, generateDesignContent);
  
  // Dashboard route (Sprint 1)
  app.post("/api/dashboard", authenticateUser, getDashboardData);

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
  
  // ✅ CRITICAL: Brand and onboarding routes (required for onboarding flow)
  app.use("/api/brands", brandsRouter);
  app.use("/api/crawl", crawlerRouter);
  app.use("/api/brand-guide", brandGuideRouter);
  app.use("/api/onboarding", onboardingRouter);
  app.use("/api/content-plan", contentPlanRouter);
  
  // ✅ DEBUG: Health check endpoint (comprehensive system verification)
  app.use("/api/debug", debugHealthRouter);

  // Future work: Add these routers incrementally after testing
  // These routers are available but not yet enabled in production
  // app.use("/api/client-portal", clientPortalRouter);
  // app.use("/api/publishing", publishingRouter);
  // app.use("/api/integrations", integrationsRouter);

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
    console.log(`🚀 Fusion Server v2 running on port ${port}`);
    console.log(`📱 Frontend: http://localhost:${port}`);
    console.log(`🔧 API: http://localhost:${port}/api`);
    console.log(`📊 Health: http://localhost:${port}/health`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("🛑 Received SIGTERM, shutting down gracefully");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("🛑 Received SIGINT, shutting down gracefully");
    process.exit(0);
  });
}
