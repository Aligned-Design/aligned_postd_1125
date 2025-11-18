import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getAdvisorInsights } from "./routes/advisor";
import { generateDocContent } from "./routes/doc-agent";
import { generateDesignContent } from "./routes/design-agent";
import { getSyncState } from "./routes/ai-sync";
import { getDashboardData } from "./routes/dashboard";
import onboardingRouter from "./routes/onboarding";
import brandGuideRouter from "./routes/brand-guide";
import brandGuideGenerateRouter from "./routes/brand-guide-generate";
import agentsRouter from "./routes/agents";
import approvalsRouter from "./routes/approvals";
import clientPortalRouter, {
  getShareLinkByToken,
} from "./routes/client-portal";
import workflowRouter from "./routes/workflow";
import adminRouter from "./routes/admin";
import notificationsRouter from "./routes/notifications";
import searchRouter from "./routes/search";
import billingRouter from "./routes/billing";
import trialRouter from "./routes/trial";
import milestonesRouter from "./routes/milestones";
import integrationsRouter from "./routes/integrations";
import { searchStockImages, getStockImage } from "./routes/stock-images";

// Import RBAC middleware
import { authenticateUser, optionalAuthForOnboarding } from "./middleware/security";
import { requireScope } from "./middleware/requireScope";

import publishingRouter from "./routes/publishing-router";

// Import route handlers
import {
  generateContent as generateAIContent,
  generateDesign,
  getProviders as getAIProviders,
} from "./routes/ai-generation";
import {
  generateContent as generateBuilderContent,
  builderWebhook,
} from "./routes/builder";
import analyticsRouter from "./routes/analytics";
import orchestrationRouter from "./routes/orchestration";
import {
  getAuditLogs,
  getPostAuditLog,
  getAuditStats,
  exportAuditLogsHandler,
  searchAuditLogs,
  getAuditActions,
} from "./routes/audit";
import {
  getBrandIntelligence,
  submitRecommendationFeedback,
} from "./routes/brand-intelligence";
import {
  bulkApproveOrReject,
  getApprovalStatus,
  getBatchApprovalStatus,
  lockPostsAfterApproval,
} from "./routes/bulk-approvals";
import {
  getClientSettings,
  updateClientSettings,
  updateEmailPreferences,
  generateUnsubscribeLink,
  unsubscribeFromEmails,
  resubscribeToEmails,
  verifyUnsubscribeToken,
} from "./routes/client-settings";
import {
  uploadMedia,
  listMedia,
  getStorageUsage,
  getAssetUrl,
  checkDuplicateAsset,
  generateSEOMetadataRoute,
  trackAssetUsage,
} from "./routes/media";
import {
  getPreferences,
  updatePreferences,
  exportPreferences,
} from "./routes/preferences";
import {
  initiateOAuth,
  handleOAuthCallback,
  getConnections,
  disconnectPlatform,
  publishContent,
  getPublishingJobs,
  retryJob,
  cancelJob,
  verifyConnection,
  refreshToken,
  publishBlogPost,
  publishEmailCampaign,
  updateScheduledTime,
} from "./routes/publishing";
import {
  handleZapierWebhook,
  handleMakeWebhook,
  handleSlackWebhook,
  handleHubSpotWebhook,
  getWebhookStatus,
  getWebhookLogs,
  retryWebhookEvent,
} from "./routes/webhooks";
import {
  getWhiteLabelConfig,
  getConfigByDomain,
  updateWhiteLabelConfig,
} from "./routes/white-label";
import {
  getBrandPostingSchedule,
  updateBrandPostingSchedule,
} from "./routes/brand-posting-schedule";
import studioRouter from "./routes/creative-studio";
import reviewsRouter from "./routes/reviews";
import brandMembersRouter from "./routes/brand-members";
import brandsRouter from "./routes/brands";
import healthRouter from "./routes/health";
import crawlerRouter from "./routes/crawler";
import agentsHealthRouter from "./routes/agents-health";
import contentPlanRouter from "./routes/content-plan";
import calendarRouter from "./routes/calendar";

export function createServer() {
  const app = express();

  // Middleware
  // ✅ SECURE: CORS restricted to production domain
  // Development allows localhost, production allows configured domain only
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

  // ✅ SECURE: Security headers
  app.use((_req, res, next) => {
    // Prevent clickjacking attacks
    res.setHeader("X-Frame-Options", "DENY");
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Enable XSS protection in older browsers
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Prevent referrer leakage
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Content Security Policy
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.example.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
    );
    // HSTS (HTTP Strict Transport Security) - only for production
    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload",
      );
    }
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoints
  app.use("/health", healthRouter);
  
  // Agents health endpoint (public, no auth required for monitoring)
  app.use("/api/agents/health", agentsHealthRouter);

  // Basic ping endpoint
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "pong";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Advisor routes
  app.post(
    "/api/ai/advisor",
    authenticateUser,
    requireScope("ai:generate"),
    getAdvisorInsights,
  );

  // Doc & Design Agent routes
  app.post(
    "/api/ai/doc",
    authenticateUser,
    requireScope("ai:generate"),
    generateDocContent,
  );
  app.post(
    "/api/ai/design",
    authenticateUser,
    requireScope("ai:generate"),
    generateDesignContent,
  );

  // AI Sync route (collaboration coordination)
  app.post(
    "/api/ai/sync",
    authenticateUser,
    requireScope("ai:generate"),
    getSyncState,
  );

  // Dashboard route
  app.post("/api/dashboard", authenticateUser, requireScope("content:view"), getDashboardData);

  // Orchestration routes (full collaboration pipeline)
  app.use("/api/orchestration", orchestrationRouter);

  // Brand Guide routes
  app.use("/api/brand-guide", authenticateUser, brandGuideRouter);
  
  // Brand Guide generation route
  app.use("/api/ai/brand-guide", authenticateUser, brandGuideGenerateRouter);

  // Onboarding routes
  app.use("/api/onboarding", authenticateUser, onboardingRouter);

  // Crawler routes (for website scraping during onboarding)
  // Note: Authentication is optional for sync mode (onboarding), handled in route
  // ✅ CRITICAL: Require real authentication for crawler routes
  // Crawler needs tenantId to persist images correctly
  app.use("/api/crawl", authenticateUser, crawlerRouter);

  // Router mounting
  app.use(
    "/api/agents",
    authenticateUser,
    requireScope("ai:generate"),
    agentsRouter,
  );

  app.use("/api/approvals", authenticateUser, approvalsRouter);

  app.use("/api/client-portal", authenticateUser, clientPortalRouter);
  // Legacy route removed - all frontend now uses /api/client-portal/*
  // app.use("/api/client", authenticateUser, clientPortalRouter); // DEPRECATED
  app.get("/api/client-portal/share-links/:token", getShareLinkByToken);
  // Legacy share link route removed
  // app.get("/api/client/share-links/:token", getShareLinkByToken); // DEPRECATED

  app.use("/api/workflow", authenticateUser, workflowRouter);

  app.use("/api/admin", authenticateUser, adminRouter);

  app.use("/api/notifications", authenticateUser, notificationsRouter);

  app.use(
    "/api/analytics",
    authenticateUser,
    analyticsRouter,
  );

  // Brand Intelligence routes
  app.get("/api/brand-intelligence/:brandId", authenticateUser, getBrandIntelligence);
  app.post("/api/brand-intelligence/feedback", authenticateUser, submitRecommendationFeedback);

  // Media routes
  app.post("/api/media/upload", authenticateUser, uploadMedia);
  app.get("/api/media/list", authenticateUser, listMedia);
  app.get("/api/media/usage/:brandId", authenticateUser, getStorageUsage);
  app.get("/api/media/url/:assetId", authenticateUser, getAssetUrl);
  app.post("/api/media/duplicate-check", authenticateUser, checkDuplicateAsset);
  app.post("/api/media/seo-metadata", authenticateUser, generateSEOMetadataRoute);
  app.post("/api/media/track-usage", authenticateUser, trackAssetUsage);

  // Stock Image routes
  app.get(
    "/api/media/stock-images/search",
    authenticateUser,
    requireScope("content:view"),
    searchStockImages,
  );
  app.get(
    "/api/media/stock-images/:id",
    authenticateUser,
    requireScope("content:view"),
    getStockImage,
  );

  // Client Settings routes
  app.get("/api/client-settings", authenticateUser, getClientSettings);
  app.put("/api/client-settings", authenticateUser, updateClientSettings);
  app.post("/api/client-settings/email-preferences", authenticateUser, updateEmailPreferences);
  app.post("/api/client-settings/unsubscribe-link", authenticateUser, generateUnsubscribeLink);
  app.post("/api/client-settings/unsubscribe", unsubscribeFromEmails);
  app.post("/api/client-settings/resubscribe", resubscribeToEmails);
  app.get("/api/client-settings/verify-unsubscribe/:token", verifyUnsubscribeToken);

  app.use("/api/search", authenticateUser, requireScope("content:view"), searchRouter);

  // Billing routes
  app.use("/api/billing", authenticateUser, billingRouter);

  // Trial routes
  app.use("/api/trial", authenticateUser, trialRouter);

  // Milestones routes
  app.use("/api/milestones", authenticateUser, milestonesRouter);

  // Integrations routes
  app.use("/api/integrations", authenticateUser, integrationsRouter);

  // Publishing routes (OAuth + publishing) - mounted via publishingRouter
  app.use("/api/publishing", publishingRouter);

  // Brand posting schedule routes
  app.get(
    "/api/brands/:brandId/posting-schedule",
    authenticateUser,
    requireScope("content:view"),
    getBrandPostingSchedule,
  );
  app.put(
    "/api/brands/:brandId/posting-schedule",
    authenticateUser,
    requireScope("content:manage"),
    updateBrandPostingSchedule,
  );

  // Creative Studio routes
  app.use("/api/studio", authenticateUser, studioRouter);
  app.use("/api/creative-studio", authenticateUser, studioRouter); // Alias

  // Reviews routes
  app.use("/api/reviews", authenticateUser, reviewsRouter);

  // Brand creation route (with automatic onboarding)
  app.use("/api/brands", authenticateUser, brandsRouter);
  
  // Brand Members routes (prevents frontend from calling Supabase directly)
  app.use("/api/brands", authenticateUser, requireScope("content:view"), brandMembersRouter);

  // Content Plan routes (7-day content plan)
  app.use("/api/content-plan", contentPlanRouter);

  // Calendar routes (fetch scheduled content for calendar views)
  app.use("/api/calendar", authenticateUser, calendarRouter);

  // Notifications routes (already registered above, removing duplicate)

  return app;
}
