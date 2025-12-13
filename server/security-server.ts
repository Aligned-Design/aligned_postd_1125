import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { handleDemo } from "./routes/demo";

// Security middleware
import {
  rateLimit,
  sanitizeInput,
  ipFilter,
  requestSizeLimit,
} from "./middleware/security";
import { jwtAuth } from "./lib/jwt-auth";
import { mockAuth } from "./middleware/rbac";
import {
  performanceMonitor,
  auditLogger,
  errorHandler,
} from "./middleware/monitoring";

// Import route routers
import agentsRouter from "./routes/agents";
import aiMetricsRouter from "./routes/ai-metrics";
import crawlerRouter from "./routes/crawler";
import escalationsRouter from "./routes/escalations";
import integrationsRouter from "./routes/integrations";
import mediaManagementRouter from "./routes/media-management";
import publishingRouter from "./routes/publishing-router";
import orchestrationRouter from "./routes/orchestration";
import milestonesRouter from "./routes/milestones";
import contentItemsRouter from "./routes/content-items";
import reportsRouter from "./routes/reports";

// Import events route handlers
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from "./routes/events";

// Import route handlers
import {
  generateContent as generateAIContent,
  generateDesign,
  getProviders as getAIProviders,
} from "./routes/ai-generation";
import {
  getAnalytics,
  getInsights,
  getForecast,
  processVoiceQuery,
  provideFeedback,
  getGoals,
  createGoal,
  syncPlatformData,
  addOfflineMetric,
  getEngagementHeatmap,
  getAlerts,
  acknowledgeAlert,
} from "./routes/analytics";
import {
  bulkApproveContent,
  approveSingleContent,
  rejectContent,
  getApprovalHistory,
  requestApproval,
  getPendingApprovals,
  sendApprovalReminder,
} from "./routes/approvals";
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
  getClientDashboard,
  approveContent as approveClientContent,
  rejectContent as rejectClientContent,
  addContentComment,
  getContentComments,
  uploadClientMedia,
  getClientMedia,
  getPortalContent,
  getContentWithComments,
} from "./routes/client-portal";
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
  getWorkflowTemplates,
  createWorkflowTemplate,
  startWorkflow,
  processWorkflowAction,
  getWorkflowNotifications,
  markNotificationRead,
  cancelWorkflow,
  getWorkflow,
  getWorkflowsForContent,
} from "./routes/workflow";

export function createSecureServer() {
  const app = express();

  // ============================================================================
  // LAYER 1: INFRASTRUCTURE SECURITY
  // ============================================================================

  // Helmet - Comprehensive security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://js.stripe.com",
          ],
          styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
          fontSrc: ["'self'", "fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: [
            "'self'",
            process.env.SUPABASE_URL || "",
            "https://api.stripe.com",
          ],
          frameSrc: ["'self'", "https://js.stripe.com"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests:
            process.env.NODE_ENV === "production" ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding from trusted sources
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow CORS
      referrerPolicy: { policy: "no-referrer" },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // CORS - Restricted to specific origins
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
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-CSRF-Token",
    ],
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // Request parsing with size limits
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // ============================================================================
  // LAYER 2: APPLICATION SECURITY
  // ============================================================================

  // Performance monitoring
  app.use(performanceMonitor);

  // Audit logging
  app.use(auditLogger);

  // Input sanitization (XSS protection)
  app.use(sanitizeInput);

  // IP filtering (if configured)
  app.use(ipFilter);

  // Request size limiting
  app.use(requestSizeLimit(10 * 1024 * 1024)); // 10MB max

  // Global rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000, // 1000 requests per 15 minutes per IP
    }),
  );

  // Authentication (use jwtAuth in production, mockAuth for development)
  const authMiddleware =
    process.env.NODE_ENV === "production" ? jwtAuth : mockAuth;
  app.use(authMiddleware);

  // ============================================================================
  // PUBLIC ROUTES (No authentication required)
  // ============================================================================

  // Health check endpoints
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "pong";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // OAuth callback (requires special handling)
  app.get("/api/oauth/:platform/callback", handleOAuthCallback);

  // Webhook endpoints (verified by signature)
  app.post("/api/webhooks/zapier", handleZapierWebhook);
  app.post("/api/webhooks/make", handleMakeWebhook);
  app.post("/api/webhooks/slack", handleSlackWebhook);
  app.post("/api/webhooks/hubspot", handleHubSpotWebhook);

  // ============================================================================
  // AUTHENTICATED ROUTES
  // ============================================================================

  // Stricter rate limiting for sensitive endpoints
  const strictRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100, // 100 requests per 15 minutes
  });

  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5, // Only 5 attempts per 15 minutes
    skipSuccessfulRequests: true, // Only count failed attempts
  });

  // Register route routers
  app.use("/api/agents", strictRateLimit, agentsRouter);
  app.use("/api/ai-metrics", strictRateLimit, aiMetricsRouter);
  app.use("/api/crawler", strictRateLimit, crawlerRouter);
  app.use("/api/escalations", escalationsRouter);
  app.use("/api/integrations", strictRateLimit, integrationsRouter);
  app.use("/api/media-management", mediaManagementRouter);
  app.use("/api/publishing", strictRateLimit, publishingRouter);
  app.use("/api/orchestration", orchestrationRouter);
  app.use("/api/milestones", milestonesRouter);
  app.use("/api/content-items", contentItemsRouter);
  app.use("/api/reports", reportsRouter);

  // Register individual route handlers with appropriate paths

  // AI Generation routes
  app.post("/api/ai/generate/content", strictRateLimit, generateAIContent);
  app.post("/api/ai/generate/design", strictRateLimit, generateDesign);
  app.get("/api/ai/providers", getAIProviders);

  // Analytics routes
  app.get("/api/analytics/:brandId", getAnalytics);
  app.get("/api/analytics/:brandId/insights", getInsights);
  app.get("/api/analytics/:brandId/forecast", getForecast);
  app.post("/api/analytics/:brandId/voice-query", processVoiceQuery);
  app.post("/api/analytics/:brandId/feedback", provideFeedback);
  app.get("/api/analytics/:brandId/goals", getGoals);
  app.post("/api/analytics/:brandId/goals", createGoal);
  app.post("/api/analytics/:brandId/sync", syncPlatformData);
  app.post("/api/analytics/:brandId/offline-metric", addOfflineMetric);
  app.get("/api/analytics/:brandId/heatmap", getEngagementHeatmap);
  app.get("/api/analytics/:brandId/alerts", getAlerts);
  app.post(
    "/api/analytics/:brandId/alerts/:alertId/acknowledge",
    acknowledgeAlert,
  );

  // Approvals routes
  app.post("/api/approvals/bulk", bulkApproveContent);
  app.post("/api/approvals/single", approveSingleContent);
  app.post("/api/approvals/reject", rejectContent);
  app.get("/api/approvals/history/:brandId", getApprovalHistory);
  app.post("/api/approvals/request", requestApproval);
  app.get("/api/approvals/pending/:brandId", getPendingApprovals);
  app.post("/api/approvals/:approvalId/remind", sendApprovalReminder);

  // Events routes (CRUD via content_items table with type='event')
  app.get("/api/:brandId/events", listEvents);
  app.get("/api/:brandId/events/:eventId", getEvent);
  app.post("/api/:brandId/events", createEvent);
  app.put("/api/:brandId/events/:eventId", updateEvent);
  app.delete("/api/:brandId/events/:eventId", deleteEvent);

  // Audit routes (stricter rate limit)
  app.get("/api/audit/logs/:brandId", strictRateLimit, getAuditLogs);
  app.get("/api/audit/logs/post/:postId", getPostAuditLog);
  app.get("/api/audit/stats/:brandId", getAuditStats);
  app.get(
    "/api/audit/export/:brandId",
    strictRateLimit,
    exportAuditLogsHandler,
  );
  app.post("/api/audit/search/:brandId", searchAuditLogs);
  app.get("/api/audit/actions/:brandId", getAuditActions);

  // Brand Intelligence routes
  app.get("/api/brand-intelligence/:brandId", getBrandIntelligence);
  app.post(
    "/api/brand-intelligence/:brandId/feedback",
    submitRecommendationFeedback,
  );

  // Bulk Approvals routes
  app.post("/api/bulk-approvals", bulkApproveOrReject);
  app.get("/api/bulk-approvals/:contentId/status", getApprovalStatus);
  app.get("/api/bulk-approvals/batch/:batchId/status", getBatchApprovalStatus);
  app.post("/api/bulk-approvals/:contentId/lock", lockPostsAfterApproval);

  // Client Portal routes
  app.get("/api/client-portal/:clientId/dashboard", getClientDashboard);
  app.post("/api/client-portal/approve/:contentId", approveClientContent);
  app.post("/api/client-portal/reject/:contentId", rejectClientContent);
  app.post("/api/client-portal/comments/:contentId", addContentComment);
  app.get("/api/client-portal/comments/:contentId", getContentComments);
  app.post("/api/client-portal/media/upload", uploadClientMedia);
  app.get("/api/client-portal/:clientId/media", getClientMedia);
  app.get("/api/client-portal/:clientId/content", getPortalContent);
  app.get(
    "/api/client-portal/content/:contentId/with-comments",
    getContentWithComments,
  );

  // Client Settings routes
  app.get("/api/client-settings/:clientId", getClientSettings);
  app.put("/api/client-settings/:clientId", updateClientSettings);
  app.put(
    "/api/client-settings/:clientId/email-preferences",
    updateEmailPreferences,
  );
  app.post(
    "/api/client-settings/:clientId/unsubscribe-link",
    generateUnsubscribeLink,
  );
  app.post("/api/client-settings/unsubscribe", unsubscribeFromEmails);
  app.post("/api/client-settings/resubscribe", resubscribeToEmails);
  app.post("/api/client-settings/verify-unsubscribe", verifyUnsubscribeToken);

  // Media routes
  app.post("/api/media/upload", uploadMedia);
  app.get("/api/media", listMedia);
  app.get("/api/media/storage-usage/:brandId", getStorageUsage);
  app.get("/api/media/:assetId/url", getAssetUrl);
  app.post("/api/media/check-duplicate", checkDuplicateAsset);
  app.post("/api/media/:assetId/seo-metadata", generateSEOMetadataRoute);
  app.post("/api/media/:assetId/track-usage", trackAssetUsage);

  // Preferences routes
  app.get("/api/preferences/:userId", getPreferences);
  app.put("/api/preferences/:userId", updatePreferences);
  app.get("/api/preferences/:userId/export", exportPreferences);

  // Publishing routes (with strict rate limiting)
  app.post("/api/publishing/oauth/initiate", strictRateLimit, initiateOAuth);
  app.get("/api/publishing/:brandId/connections", getConnections);
  app.delete(
    "/api/publishing/:brandId/:platform/disconnect",
    disconnectPlatform,
  );
  app.post("/api/publishing/publish", strictRateLimit, publishContent);
  app.get("/api/publishing/:brandId/jobs", getPublishingJobs);
  app.post("/api/publishing/jobs/:jobId/retry", retryJob);
  app.post("/api/publishing/jobs/:jobId/cancel", cancelJob);
  app.get("/api/publishing/:brandId/:platform/verify", verifyConnection);
  app.post("/api/publishing/:brandId/:platform/refresh-token", refreshToken);
  app.post("/api/publishing/:brandId/:platform/blog", publishBlogPost);
  app.post("/api/publishing/:brandId/:platform/email", publishEmailCampaign);

  // Webhook routes
  app.get("/api/webhooks/status", getWebhookStatus);
  app.get("/api/webhooks/logs/:brandId", getWebhookLogs);
  app.post("/api/webhooks/:eventId/retry", retryWebhookEvent);

  // White Label routes (stricter rate limit)
  app.get("/api/white-label/:brandId/config", getWhiteLabelConfig);
  app.get("/api/white-label/domain/:domain", getConfigByDomain);
  app.put(
    "/api/white-label/:brandId/config",
    strictRateLimit,
    updateWhiteLabelConfig,
  );

  // Workflow routes
  app.get("/api/workflow/templates/:brandId", getWorkflowTemplates);
  app.post("/api/workflow/templates/:brandId", createWorkflowTemplate);
  app.post("/api/workflow/start/:brandId", startWorkflow);
  app.post("/api/workflow/:workflowId/action", processWorkflowAction);
  app.get("/api/workflow/:brandId/notifications", getWorkflowNotifications);
  app.put(
    "/api/workflow/notifications/:notificationId/read",
    markNotificationRead,
  );
  app.post("/api/workflow/:workflowId/cancel", cancelWorkflow);
  app.get("/api/workflow/:workflowId", getWorkflow);
  app.get("/api/workflow/content/:contentId", getWorkflowsForContent);

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
