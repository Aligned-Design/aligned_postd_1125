import "dotenv/config";
import express from "express";
import cors from "cors";

// Import error handling
import { AppError, errorHandler } from "./lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "./lib/error-responses";

// Import RBAC middleware
import { authenticateUser } from "./middleware/security";
import { requireScope } from "./middleware/requireScope";

// Import route routers (add incrementally)
import milestonesRouter from "./routes/milestones";
import agentsRouter from "./routes/agents";
import analyticsRouter from "./routes/analytics-v2";
import approvalsRouter from "./routes/approvals-v2";
import mediaRouter from "./routes/media-v2";
import { getAdvisorInsights } from "./routes/advisor";
import { generateDocContent } from "./routes/doc-agent";
import { generateDesignContent } from "./routes/design-agent";
import { getDashboardData } from "./routes/dashboard";

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

  // AI Agent routes (Sprint 1)
  app.post("/api/ai/advisor", getAdvisorInsights);
  app.post("/api/ai/doc", generateDocContent);
  app.post("/api/ai/design", generateDesignContent);
  
  // Dashboard route (Sprint 1)
  app.post("/api/dashboard", getDashboardData);

  // =============================================================================
  // Mount Routers
  // =============================================================================

  // Core routes that are working
  app.use("/api/milestones", milestonesRouter);
  app.use("/api/agents", agentsRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/approvals", approvalsRouter);
  app.use("/api/media", mediaRouter);

  // TODO: Add these routers incrementally after testing
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
