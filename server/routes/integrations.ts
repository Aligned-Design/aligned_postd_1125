/**
 * Integrations API Routes
 * 
 * Handles platform integrations, OAuth flows, sync events, and webhooks.
 * All brand-scoped routes require brand access verification.
 */

import { Router, RequestHandler } from "express";
import { z } from "zod";
import { Integration, SyncEvent, WebhookEvent, IntegrationType } from "@shared/integrations";
import {
  GetIntegrationsQuerySchema,
  CreateIntegrationBodySchema,
} from "../lib/validation-schemas";
import { validateQuery, validateBody, validateParams, validateRequest } from "../lib/validation-middleware";
import { integrationsDB } from "../lib/integrations-db-service";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { assertBrandAccess } from "../lib/brand-access";

const router = Router();

// ✅ VALIDATION: Additional Zod schemas for integrations routes
const IntegrationIdParamSchema = z.object({
  integrationId: z.string().uuid("Invalid integration ID format"),
}).strict();

const OAuthCallbackBodySchema = z.object({
  type: z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "threads", "pinterest", "slack", "hubspot", "meta", "google_business", "zapier", "asana", "trello", "salesforce", "canva"]),
  code: z.string().min(1, "OAuth code is required"),
  state: z.string().optional(),
  brandId: z.string().uuid("Invalid brand ID format"),
}).strict();

const SyncTriggerBodySchema = z.object({
  type: z.string().optional(),
}).strict();

const UpdateIntegrationBodySchema = z.object({
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().datetime().optional(),
  status: z.enum(["connected", "disconnected", "error", "pending"]).optional(),
  metadata: z.record(z.unknown()).optional(),
}).strict();

const SyncEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
}).strict();

const WebhookTypeParamSchema = z.object({
  type: z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "threads", "pinterest", "slack", "hubspot", "meta", "google_business", "zapier", "asana", "trello", "salesforce", "canva"]),
}).strict();

// Helper function to map database record to API response
function mapConnectionRecord(record: any): Integration {
  return {
    id: record.id,
    type: record.provider as IntegrationType,
    name: record.account_name || `${record.provider} Account`,
    brandId: record.brand_id,
    status: record.status,
    credentials: {
      accessToken: record.access_token || '',
      refreshToken: record.refresh_token,
      expiresAt: record.token_expires_at,
    },
    settings: record.settings || {},
    permissions: record.scopes || [],
    lastSyncAt: record.last_synced_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

/**
 * GET /api/integrations
 * Get all integrations for a brand
 * 
 * **Auth:** Required (authenticateUser)
 * **Brand Access:** Required (assertBrandAccess)
 * **Query Params:** brandId (UUID, required)
 */
router.get(
  "/",
  validateQuery(GetIntegrationsQuerySchema),
  async (req, res, next) => {
    try {
      const { brandId } = req.query as { brandId: string };

      // Verify user has access to this brand
      await assertBrandAccess(req, brandId);

      // Fetch connections from database
      const connections = await integrationsDB.getBrandConnections(brandId);
      const integrations = connections.map(mapConnectionRecord);
      
      (res as any).json({ success: true, integrations });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler;

/**
 * GET /api/integrations/status
 * Get platform connection status for a brand (simple boolean flags)
 * 
 * **Auth:** Required (authenticateUser)
 * **Brand Access:** Required (assertBrandAccess)
 * **Query Params:** brandId (UUID, required)
 */
router.get(
  "/status",
  validateQuery(GetIntegrationsQuerySchema),
  async (req, res, next) => {
    try {
      const { brandId } = req.query as { brandId: string };

      // Verify user has access to this brand
      await assertBrandAccess(req, brandId);

      // Fetch connections from database
      const connections = await integrationsDB.getBrandConnections(brandId);
      
      // Map to simple connection status by platform
      const statusMap: Record<string, { connected: boolean }> = {
        facebook: { connected: false },
        instagram: { connected: false },
        linkedin: { connected: false },
        twitter: { connected: false },
        tiktok: { connected: false },
        meta: { connected: false },
      };

      // Check which platforms are connected (status = "connected")
      connections.forEach((conn) => {
        const provider = conn.provider.toLowerCase();
        if (provider === "meta" || provider === "facebook") {
          statusMap.facebook.connected = conn.status === "connected";
          statusMap.meta.connected = conn.status === "connected";
        }
        if (provider === "instagram" || provider === "meta") {
          statusMap.instagram.connected = conn.status === "connected";
        }
        if (provider === "linkedin") {
          statusMap.linkedin.connected = conn.status === "connected";
        }
        if (provider === "twitter") {
          statusMap.twitter.connected = conn.status === "connected";
        }
        if (provider === "tiktok") {
          statusMap.tiktok.connected = conn.status === "connected";
        }
      });

      (res as any).json({ success: true, platforms: statusMap });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler;

/**
 * GET /api/integrations/templates
 * Get available integration templates
 * 
 * **Auth:** None (public templates)
 */
router.get("/templates", async (req, res, next) => {
  try {
    const templates = [
      {
        type: 'slack',
        name: 'Slack',
        description: 'Real-time notifications and approval workflows',
        logoUrl: '/integrations/slack.png',
        category: 'productivity',
        features: ['Real-time notifications', 'Approval workflows', 'Content sharing'],
        authType: 'oauth2',
        requiredScopes: ['channels:read', 'chat:write', 'files:read'],
        endpoints: {
          auth: 'https://slack.com/oauth/v2/authorize',
          api: 'https://slack.com/api',
          webhook: '/api/webhooks/slack'
        },
        rateLimits: { requests: 1200, period: 'minute' }
      },
      {
        type: 'hubspot',
        name: 'HubSpot',
        description: 'Sync contacts, campaigns, and analytics',
        logoUrl: '/integrations/hubspot.png',
        category: 'crm',
        features: ['Contact sync', 'Campaign tracking', 'Lead scoring'],
        authType: 'oauth2',
        requiredScopes: ['contacts', 'content', 'social'],
        endpoints: {
          auth: 'https://app.hubspot.com/oauth/authorize',
          api: 'https://api.hubapi.com',
          webhook: '/api/webhooks/hubspot'
        },
        rateLimits: { requests: 100, period: '10s' }
      },
      {
        type: 'meta',
        name: 'Meta Business',
        description: 'Manage Facebook and Instagram business accounts',
        logoUrl: '/integrations/meta.png',
        category: 'social',
        features: ['Post publishing', 'Analytics sync', 'Ad management'],
        authType: 'oauth2',
        requiredScopes: ['pages_manage_posts', 'pages_read_engagement', 'ads_management'],
        endpoints: {
          auth: 'https://www.facebook.com/v18.0/dialog/oauth',
          api: 'https://graph.facebook.com/v18.0',
          webhook: '/api/webhooks/meta'
        },
        rateLimits: { requests: 200, period: 'hour' }
      },
      {
        type: 'google_business',
        name: 'Google Business Profile',
        description: 'Manage Google Business listings and reviews',
        logoUrl: '/integrations/google.png',
        category: 'social',
        features: ['Profile management', 'Review monitoring', 'Post publishing'],
        authType: 'oauth2',
        requiredScopes: ['business.manage'],
        endpoints: {
          auth: 'https://accounts.google.com/oauth/authorize',
          api: 'https://mybusinessbusinessinformation.googleapis.com',
          webhook: '/api/webhooks/google'
        },
        rateLimits: { requests: 1000, period: 'day' }
      },
      {
        type: 'zapier',
        name: 'Zapier',
        description: 'Automate workflows with 5000+ apps',
        logoUrl: '/integrations/zapier.png',
        category: 'automation',
        features: ['Workflow automation', 'Data sync', 'Trigger actions'],
        authType: 'webhook',
        requiredScopes: [],
        endpoints: {
          api: 'https://hooks.zapier.com',
          webhook: '/api/webhooks/zapier'
        },
        rateLimits: { requests: 100, period: 'minute' }
      }
    ];

    (res as any).json({ success: true, templates });
  } catch (error) {
    next(error);
  }
}) as RequestHandler;

/**
 * POST /api/integrations/oauth/start
 * Start OAuth flow for an integration
 * 
 * **Auth:** Required (authenticateUser)
 * **Brand Access:** Required (assertBrandAccess)
 * **Body:** { type: IntegrationType, brandId: UUID }
 */
router.post(
  "/oauth/start",
  validateBody(CreateIntegrationBodySchema),
  async (req, res, next) => {
    try {
      const { type, brandId } = req.body as {
        type: IntegrationType;
        brandId: string;
      };

      // Verify user has access to this brand
      await assertBrandAccess(req, brandId);

      // Generate OAuth URL based on integration type
      const authUrl = generateOAuthUrl(type, brandId);

      (res as any).json({ success: true, authUrl });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler;

/**
 * POST /api/integrations/oauth/callback
 * Complete OAuth flow and create integration connection
 * 
 * **Auth:** Required (authenticateUser)
 * **Brand Access:** Required (assertBrandAccess)
 * **Body:** { type: IntegrationType, code: string, state?: string, brandId: UUID }
 */
router.post("/oauth/callback", validateBody(OAuthCallbackBodySchema), async (req, res, next) => {
  try {
    const { type, code, brandId } = req.body as z.infer<typeof OAuthCallbackBodySchema>;

    // Verify user has access to this brand
    await assertBrandAccess(req, brandId);

    // Exchange code for tokens
    const credentials = await exchangeCodeForTokens(type as IntegrationType, code);

    // Create connection in database
    const connectionRecord = await integrationsDB.createConnection(
      brandId,
      type as any,
      credentials.accessToken,
      {
        accountUsername: `${type} Account`,
        refreshToken: credentials.refreshToken,
        tokenExpiresAt: new Date(credentials.expiresAt),
      }
    );

    // Start initial sync
    const integration = mapConnectionRecord(connectionRecord);
    await initiateSync(integration);

    (res as any).json({ success: true, integration });
  } catch (error) {
    next(error);
  }
}) as RequestHandler;

/**
 * POST /api/integrations/:integrationId/sync
 * Trigger manual sync for an integration
 * 
 * **Auth:** Required (authenticateUser)
 * **Brand Access:** Required (assertBrandAccess via integration's brandId)
 * **Params:** integrationId (UUID)
 * **Body:** { type?: string }
 */
router.post("/:integrationId/sync", validateParams(IntegrationIdParamSchema), validateBody(SyncTriggerBodySchema), async (req, res, next) => {
  try {
    const { integrationId } = req.params as z.infer<typeof IntegrationIdParamSchema>;
    const { type } = req.body as z.infer<typeof SyncTriggerBodySchema>;

    // Fetch integration from database to get brandId, then verify access
    const integration = await integrationsDB.getConnection(integrationId);
    if (!integration) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Integration not found",
        HTTP_STATUS.NOT_FOUND
      );
    }
    await assertBrandAccess(req, integration.brand_id, true, true);

    // Trigger sync for the integration
    const syncEvent = await triggerSync({ id: integrationId, type: integration.provider } as any, type);

    (res as any).json({ success: true, syncEvent });
  } catch (error) {
    next(error);
  }
}) as RequestHandler;

/**
 * PUT /api/integrations/:integrationId
 * Update integration settings
 * 
 * **Auth:** Required (authenticateUser)
 * **Brand Access:** Required (assertBrandAccess via integration's brandId)
 * **Params:** integrationId (UUID)
 * **Body:** { settings?: Record<string, unknown>, accountName?: string }
 */
router.put("/:integrationId", validateParams(IntegrationIdParamSchema), validateBody(UpdateIntegrationBodySchema), async (req, res, next) => {
  try {
    const { integrationId } = req.params as z.infer<typeof IntegrationIdParamSchema>;
    const updates = req.body as z.infer<typeof UpdateIntegrationBodySchema>;

    // Fetch integration from database to get brandId, then verify access
    const integration = await integrationsDB.getConnection(integrationId);
    if (!integration) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Integration not found",
        HTTP_STATUS.NOT_FOUND
      );
    }
    await assertBrandAccess(req, integration.brand_id, true, true);

    // Update connection in database
    const updateData: Partial<{
      accessToken: string;
      refreshToken: string;
      tokenExpiresAt: Date;
      status: string;
      metadata: Record<string, unknown>;
    }> = {};
    if (updates.accessToken) updateData.accessToken = updates.accessToken;
    if (updates.refreshToken) updateData.refreshToken = updates.refreshToken;
    if (updates.tokenExpiresAt) updateData.tokenExpiresAt = new Date(updates.tokenExpiresAt);
    if (updates.status) updateData.status = updates.status;
    if (updates.metadata) updateData.metadata = updates.metadata;
    
    const connectionRecord = await integrationsDB.updateConnection(
      integrationId,
      updateData
    );

    (res as any).json({ success: true, integration: mapConnectionRecord(connectionRecord) });
  } catch (error) {
    next(error);
  }
}) as RequestHandler;

/**
 * DELETE /api/integrations/:integrationId
 * Delete/disconnect an integration
 * 
 * **Auth:** Required (authenticateUser)
 * **Brand Access:** Required (assertBrandAccess via integration's brandId)
 * **Params:** integrationId (UUID)
 */
router.delete("/:integrationId", validateParams(IntegrationIdParamSchema), async (req, res, next) => {
  try {
    const { integrationId } = req.params as z.infer<typeof IntegrationIdParamSchema>;

    // Fetch integration from database to get brandId, then verify access
    const integration = await integrationsDB.getConnection(integrationId);
    if (!integration) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Integration not found",
        HTTP_STATUS.NOT_FOUND
      );
    }
    await assertBrandAccess(req, integration.brand_id, true, true);

    // Disconnect and revoke tokens
    await integrationsDB.disconnectPlatform(integrationId);

    (res as any).json({ success: true });
  } catch (error) {
    next(error);
  }
}) as RequestHandler;

/**
 * GET /api/integrations/:integrationId/sync-events
 * Get sync events for an integration
 * 
 * **Auth:** Required (authenticateUser)
 * **Brand Access:** Required (assertBrandAccess via integration's brandId)
 * **Params:** integrationId (UUID)
 * **Query:** limit (number, 1-100, default 50), offset (number, min 0, default 0)
 */
router.get("/:integrationId/sync-events", validateParams(IntegrationIdParamSchema), validateQuery(SyncEventsQuerySchema), async (req, res, next) => {
  try {
    const { integrationId } = req.params as z.infer<typeof IntegrationIdParamSchema>;
    const { limit, offset } = req.query as z.infer<typeof SyncEventsQuerySchema>;

    // Fetch integration from database to get brandId, then verify access
    const integration = await integrationsDB.getConnection(integrationId);
    if (!integration) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Integration not found",
        HTTP_STATUS.NOT_FOUND
      );
    }
    await assertBrandAccess(req, integration.brand_id, true, true);

    // Fetch sync events from database
    const syncEventsData = await integrationsDB.getIntegrationSyncEvents(integrationId, limit);
    const syncEvents: SyncEvent[] = syncEventsData.map((event) => ({
      id: event.id,
      integrationId,
      type: event.event_type as 'content' | 'analytics' | 'tasks' | 'contacts' | 'campaigns',
      action: 'sync' as const,
      sourceId: integrationId,
      data: {} as unknown,
      status: event.status as 'pending' | 'processing' | 'completed' | 'failed',
      attempts: 0,
      scheduledAt: event.created_at,
    }));

    (res as any).json({
      success: true,
      events: syncEvents,
      total: syncEvents.length,
      hasMore: false,
      limit,
      offset
    });
  } catch (error) {
    next(error);
  }
}) as RequestHandler;

/**
 * POST /api/integrations/webhooks/:type
 * Handle webhook events from external platforms
 * 
 * **Auth:** None (webhook signature verification)
 * **Params:** type (IntegrationType)
 * **Headers:** x-webhook-signature (string, required)
 * **Body:** Platform-specific webhook payload
 */
router.post("/webhooks/:type", validateParams(WebhookTypeParamSchema), async (req, res, next) => {
  try {
    const { type } = req.params as z.infer<typeof WebhookTypeParamSchema>;
    const payload = req.body;
    const signature = req.headers['x-webhook-signature'] as string;

    if (!signature) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'Webhook signature is required',
        HTTP_STATUS.BAD_REQUEST,
        'warning'
      );
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(type as IntegrationType, payload, signature)) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        'Invalid webhook signature',
        HTTP_STATUS.UNAUTHORIZED,
        'warning',
        undefined,
        'Webhook signature verification failed'
      );
    }

    // Process webhook
    const event: WebhookEvent = {
      id: `webhook_${Date.now()}`,
      integrationId: `int_${type}_${Date.now()}`, // Note: In production, map webhook signature to integration ID
      source: type as IntegrationType,
      eventType: payload.type || 'unknown',
      payload,
      signature,
      receivedAt: new Date().toISOString(),
      status: 'pending'
    };

    // Queue for processing
    await processWebhookEvent(event);

    (res as any).json({ success: true });
  } catch (error) {
    next(error);
  }
}) as RequestHandler;

// Helper functions
function generateOAuthUrl(type: IntegrationType, brandId: string, redirectUrl?: string): string {
  const baseUrls: Partial<Record<IntegrationType, string>> = {
    slack: 'https://slack.com/oauth/v2/authorize',
    hubspot: 'https://app.hubspot.com/oauth/authorize',
    meta: 'https://www.facebook.com/v18.0/dialog/oauth',
    google_business: 'https://accounts.google.com/oauth/authorize',
    zapier: 'https://zapier.com/oauth/authorize',
    asana: 'https://app.asana.com/-/oauth_authorize',
    trello: 'https://trello.com/app-key',
    salesforce: 'https://login.salesforce.com/services/oauth2/authorize',
    canva: 'https://www.canva.com/api/oauth/authorize'
  };
  
  const url = baseUrls[type];
  if (!url) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `OAuth URL not configured for integration type: ${type}`,
      HTTP_STATUS.BAD_REQUEST,
      "warning"
    );
  }

  const scopes: Partial<Record<IntegrationType, string>> = {
    slack: 'channels:read,chat:write,files:read',
    hubspot: 'contacts,content,social',
    meta: 'pages_manage_posts,pages_read_engagement',
    google_business: 'business.manage',
    zapier: 'user:read',
    asana: 'default',
    trello: 'read,write',
    salesforce: 'full',
    canva: 'design:read,design:write'
  };
  
  const scope = scopes[type] || '';

  // Map integration types to correct environment variable names
  const getClientId = (integrationType: IntegrationType): string => {
    const envVarMap: Partial<Record<IntegrationType, string>> = {
      meta: process.env.META_APP_ID || '',
      canva: process.env.CANVA_CLIENT_ID || '',
      google_business: process.env.GOOGLE_CLIENT_ID || '',
      slack: process.env.SLACK_CLIENT_ID || '',
      hubspot: process.env.HUBSPOT_CLIENT_ID || '',
      zapier: process.env.ZAPIER_CLIENT_ID || '',
      asana: process.env.ASANA_CLIENT_ID || '',
      trello: process.env.TRELLO_CLIENT_ID || '',
      salesforce: process.env.SALESFORCE_CLIENT_ID || '',
    };
    return envVarMap[integrationType] || '';
  };

  const params = new URLSearchParams({
    client_id: getClientId(type) || 'demo',
    redirect_uri: redirectUrl || `${process.env.FRONTEND_URL || process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/integrations/callback`,
    scope: scope,
    state: `${type}:${brandId}`,
    response_type: 'code'
  });

  return `${url}?${params.toString()}`;
}

async function exchangeCodeForTokens(type: IntegrationType, _code: string) {
  // Mock token exchange - in production, make actual API calls
  return {
    accessToken: `${type}_access_token_${Date.now()}`,
    refreshToken: `${type}_refresh_token_${Date.now()}`,
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
  };
}

async function initiateSync(integration: Integration) {
  // Future work: Start background sync process via queue worker
  // This would queue a job to sync data from the integration platform
  console.log(`[Integrations] Sync initiated for ${integration.type} integration ${integration.id}`);
}

async function triggerSync(integration: Integration, syncType: string): Promise<SyncEvent> {
  return {
    id: `sync_${Date.now()}`,
    integrationId: integration.id,
    type: syncType as any,
    action: 'sync',
    sourceId: integration.id,
    data: {},
    status: 'pending',
    attempts: 0,
    scheduledAt: new Date().toISOString()
  };
}

function verifyWebhookSignature(_type: IntegrationType, _payload: unknown, _signature: string): boolean {
  // Future work: Implement platform-specific signature verification
  // Each platform (Slack, HubSpot, Zapier, etc.) has different signature algorithms
  // This is a security-critical feature that requires proper implementation per platform
  return true;
}

async function processWebhookEvent(event: WebhookEvent) {
  // Future work: Queue webhook event for async processing via Bull queue
  // This would allow handling high-volume webhooks without blocking the API
  console.log(`[Integrations] Processing webhook event: ${event.eventType} from ${event.source}`);
}

export default router;
