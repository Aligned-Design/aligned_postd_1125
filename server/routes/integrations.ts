import { Router, RequestHandler } from "express";
import { Integration, SyncEvent, WebhookEvent, IntegrationType } from "@shared/integrations";
import {
  GetIntegrationsQuerySchema,
  CreateIntegrationBodySchema,
} from "../lib/validation-schemas";
import { validateQuery, validateBody, validateRequest } from "../lib/validation-middleware";
import { integrationsDB } from "../lib/integrations-db-service";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { assertBrandAccess } from "../lib/brand-access";

const router = Router();

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

// Get all integrations for a brand
router.get(
  "/",
  validateQuery(GetIntegrationsQuerySchema),
  async (req, res, next) => {
    try {
      const { brandId } = req.query as { brandId: string };

      if (!brandId) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "brandId is required",
          HTTP_STATUS.BAD_REQUEST,
          "warning"
        );
      }

      // Verify user has access to this brand
      assertBrandAccess(req, brandId);

      // Fetch connections from database
      const connections = await integrationsDB.getBrandConnections(brandId);
      const integrations = connections.map(mapConnectionRecord);
      (res as any).json(integrations);
    } catch (error) {
      next(error);
    }
  }) as RequestHandler;

// Get available integration templates
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

    (res as any).json(templates);
  } catch (error) {
    next(error);
  }
}) as RequestHandler;

// Start OAuth flow
router.post(
  "/oauth/start",
  validateBody(CreateIntegrationBodySchema),
  async (req, res, next) => {
    try {
      const { type, brandId } = req.body as {
        type: IntegrationType;
        brandId: string;
      };

      if (!type || !brandId) {
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "type and brandId are required",
          HTTP_STATUS.BAD_REQUEST,
          "warning"
        );
      }

      // Generate OAuth URL based on integration type
      const authUrl = generateOAuthUrl(type, brandId);

      (res as any).json({ authUrl });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler;

// Complete OAuth flow
router.post("/oauth/callback", async (req, res, next) => {
  try {
    const { type, code, state, brandId } = req.body;

    if (!type || !code || !brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "type, code, and brandId are required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

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

// Trigger manual sync
router.post("/:integrationId/sync", async (req, res, next) => {
  try {
    const { integrationId } = req.params;
    const { type } = req.body;

    if (!integrationId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "integrationId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // TODO: Fetch integration from database and trigger sync
    const syncEvent = await triggerSync({ id: integrationId } as any, type);

    (res as any).json({ success: true, syncEvent });
  } catch (error) {
    next(error);
  }
}) as RequestHandler;

// Update integration settings
router.put("/:integrationId", async (req, res, next) => {
  try {
    const { integrationId } = req.params;
    const updates = req.body;

    if (!integrationId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "integrationId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Update connection in database
    const connectionRecord = await integrationsDB.updateConnection(
      integrationId,
      updates
    );

    (res as any).json({ success: true, integration: mapConnectionRecord(connectionRecord) });
  } catch (error) {
    next(error);
  }
}) as RequestHandler;

// Delete integration
router.delete("/:integrationId", async (req, res, next) => {
  try {
    const { integrationId } = req.params;

    if (!integrationId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "integrationId is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Disconnect and revoke tokens
    await integrationsDB.disconnectPlatform(integrationId);

    (res as any).json({ success: true });
  } catch (error) {
    next(error);
  }
}) as RequestHandler;

// Get sync events
router.get("/:integrationId/sync-events", async (req, res, next) => {
  try {
    const { integrationId: _integrationId } = req.params;
    const { limit: _limit = '50', offset: _offset = '0' } = req.query;

    // TODO: Fetch from database
    const syncEvents: SyncEvent[] = [];

    (res as any).json({
      events: syncEvents,
      total: syncEvents.length,
      hasMore: false
    });
  } catch (error) {
    next(error);
  }
}) as RequestHandler;

// Webhook handlers
router.post("/webhooks/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    const payload = req.body;
    const signature = req.headers['x-webhook-signature'] as string;

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
      integrationId: `int_${type}_1`, // TODO: Get from mapping
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
  const baseUrls: Record<IntegrationType, string> = {
    slack: 'https://slack.com/oauth/v2/authorize',
    hubspot: 'https://app.hubspot.com/oauth/authorize',
    meta: 'https://www.facebook.com/v18.0/dialog/oauth',
    google_business: 'https://accounts.google.com/oauth/authorize',
    zapier: 'https://zapier.com/oauth/authorize',
    asana: 'https://app.asana.com/-/oauth_authorize',
    trello: 'https://trello.com/app-key',
    salesforce: 'https://login.salesforce.com/services/oauth2/authorize'
  };

  const scopes: Record<IntegrationType, string> = {
    slack: 'channels:read,chat:write,files:read',
    hubspot: 'contacts,content,social',
    meta: 'pages_manage_posts,pages_read_engagement',
    google_business: 'business.manage',
    zapier: 'user:read',
    asana: 'default',
    trello: 'read,write',
    salesforce: 'full'
  };

  // Map integration types to correct environment variable names
  const getClientId = (integrationType: IntegrationType): string => {
    const envVarMap: Record<IntegrationType, string> = {
      meta: process.env.META_APP_ID || '',
      linkedin: process.env.LINKEDIN_CLIENT_ID || '',
      twitter: process.env.X_CLIENT_ID || '',
      x: process.env.X_CLIENT_ID || '',
      tiktok: process.env.TIKTOK_CLIENT_KEY || '',
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
    scope: scopes[type] || '',
    state: `${type}:${brandId}`,
    response_type: 'code'
  });

  return `${baseUrls[type]}?${params.toString()}`;
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
  // TODO: Start background sync process
  console.log(`Starting sync for ${integration.type} integration`);
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
  // TODO: Implement proper signature verification for each platform
  return true;
}

async function processWebhookEvent(event: WebhookEvent) {
  // TODO: Queue webhook event for processing
  console.log(`Processing webhook event: ${event.eventType} from ${event.source}`);
}

export default router;
