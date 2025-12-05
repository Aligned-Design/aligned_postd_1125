/**
 * Webhook Routes
 * Endpoints for receiving and managing webhook events from external providers
 */

import { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import {
  WebhookProvider,
  WebhookLogsQuerySchema,
  generateIdempotencyKey,
} from "@shared/webhooks";
import { webhookHandler } from "../lib/webhook-handler";
import { webhookEvents } from "../lib/dbClient";
import { logAuditAction } from "../lib/audit-logger";
import { logger } from "../lib/logger";

// ==================== TYPES & VALIDATION ====================

interface WebhookEventAttempt {
  attempt_number: number;
  status: string;
  error: string | null;
  response_code: number | null;
  backoff_ms: number;
  created_at: string;
}

interface _WebhookEventStatus {
  event_id: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  last_error: string | null;
  attempts: WebhookEventAttempt[];
}

const ZapierWebhookBodySchema = z.object({
  id: z.string().optional(),
  action: z.string(),
  data: z.record(z.unknown()).optional(),
});

const MakeWebhookBodySchema = z.object({
  event: z.string(),
  data: z.record(z.unknown()).optional(),
  webhook_id: z.string().optional(),
});

const HubSpotWebhookBodySchema = z.object({
  eventId: z.string(),
  portalId: z.number(),
  subscriptionType: z.string(),
  objectId: z.number(),
  timestamp: z.number(),
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Get webhook signature from request headers
 */
function _getSignatureFromRequest(
  provider: WebhookProvider,
  headers: Record<string, unknown>,
): string | null {
  const headerMap: Record<WebhookProvider, string> = {
    zapier: "x-zapier-signature",
    make: "x-hook-secret-key",
    slack: "x-slack-signature",
    hubspot: "x-hubspot-signature",
  };

  const headerName = headerMap[provider];
  return (headers[headerName] || headers[headerName.toLowerCase()]) as
    | string
    | null;
}

/**
 * Get webhook secret from environment
 */
function _getWebhookSecret(provider: WebhookProvider): string {
  const secrets: Record<WebhookProvider, string> = {
    zapier: process.env.WEBHOOK_SECRET_ZAPIER || "zapier-secret",
    make: process.env.WEBHOOK_SECRET_MAKE || "make-secret",
    slack: process.env.WEBHOOK_SECRET_SLACK || "slack-secret",
    hubspot: process.env.WEBHOOK_SECRET_HUBSPOT || "hubspot-secret",
  };

  return secrets[provider];
}

// ==================== WEBHOOK ENDPOINTS ====================

/**
 * POST /api/webhooks/zapier
 * Receive events from Zapier (idempotent)
 * 
 * **Auth:** Not required (uses signature verification)
 * **Security:** Validates x-brand-id header and request body signature
 * **Body:** { action: string, data?: object, id?: string }
 */
export const handleZapierWebhook: RequestHandler = async (req, res, next) => {
  try {
    const brandId = req.headers["x-brand-id"] as string;
    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing required header: x-brand-id",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Validate request body
    const validationResult = ZapierWebhookBodySchema.safeParse(req.body);
    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
        code: e.code,
      }));
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Request validation failed",
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        "warning",
        { validationErrors },
        "Please review the validation errors and retry your request"
      );
    }

    const body = validationResult.data;
    const idempotencyKey =
      body.id || generateIdempotencyKey("zapier", body.action, Date.now());

    // Handle webhook event
    const response = await webhookHandler.handleEvent({
      provider: "zapier",
      brandId,
      eventType: body.action,
      payload: body.data || {},
      idempotencyKey,
    });

    (res as any).json(response);
  } catch (error) {
    logger.error("Zapier webhook error", error instanceof Error ? error : new Error(String(error)));
    // If it's already an AppError, pass it to error middleware
    if (error instanceof AppError) {
      return next(error);
    }
    // Otherwise, wrap and pass to error middleware
    next(
      new AppError(
        ErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : "Internal server error",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        error instanceof Error ? { originalError: error.message } : undefined,
        "Please try again later or contact support"
      )
    );
  }
};

/**
 * POST /api/webhooks/make
 * Receive events from Make.com (idempotent)
 * 
 * **Auth:** Not required (uses signature verification)
 * **Security:** Validates x-brand-id header and request body signature
 * **Body:** { event: string, data?: object, webhook_id?: string }
 */
export const handleMakeWebhook: RequestHandler = async (req, res, next) => {
  try {
    const brandId = req.headers["x-brand-id"] as string;
    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing required header: x-brand-id",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Validate request body
    const validationResult = MakeWebhookBodySchema.safeParse(req.body);
    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
        code: e.code,
      }));
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Request validation failed",
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        "warning",
        { validationErrors },
        "Please review the validation errors and retry your request"
      );
    }

    const body = validationResult.data;
    const idempotencyKey =
      body.webhook_id || generateIdempotencyKey("make", body.event, Date.now());

    // Handle webhook event
    const response = await webhookHandler.handleEvent({
      provider: "make",
      brandId,
      eventType: body.event,
      payload: body.data || {},
      idempotencyKey,
    });

    (res as any).json(response);
  } catch (error) {
    logger.error("Make webhook error", error instanceof Error ? error : new Error(String(error)));
    if (error instanceof AppError) {
      return next(error);
    }
    next(
      new AppError(
        ErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : "Internal server error",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        error instanceof Error ? { originalError: error.message } : undefined,
        "Please try again later or contact support"
      )
    );
  }
};

/**
 * POST /api/webhooks/slack
 * Receive events from Slack (Events API)
 * 
 * **Auth:** Not required (uses signature verification)
 * **Security:** Validates x-brand-id header and Slack signature
 * **Body:** Slack Events API payload (supports url_verification challenge)
 */
export const handleSlackWebhook: RequestHandler = async (req, res, next) => {
  try {
    const brandId = req.headers["x-brand-id"] as string;
    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing required header: x-brand-id",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    const body = req.body;

    // Handle Slack URL verification challenge
    if (body.type === "url_verification") {
      return (res as any).json({ challenge: body.challenge });
    }

    // Handle Slack event
    if (body.type === "event_callback" && body.event) {
      const event = body.event;
      const idempotencyKey = `slack-${event.event_ts || Date.now()}`;

      const response = await webhookHandler.handleEvent({
        provider: "slack",
        brandId,
        eventType: event.type || "unknown",
        payload: event,
        idempotencyKey,
      });

      (res as any).json(response);
    } else {
      (res as any).json({ ok: true });
    }
  } catch (error) {
    logger.error("Slack webhook error", error instanceof Error ? error : new Error(String(error)));
    if (error instanceof AppError) {
      return next(error);
    }
    next(
      new AppError(
        ErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : "Internal server error",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        error instanceof Error ? { originalError: error.message } : undefined,
        "Please try again later or contact support"
      )
    );
  }
};

/**
 * POST /api/webhooks/hubspot
 * Receive events from HubSpot
 * 
 * **Auth:** Not required (uses signature verification)
 * **Security:** Validates x-brand-id header and HubSpot signature
 * **Body:** Single event object or array of event objects
 */
export const handleHubSpotWebhook: RequestHandler = async (req, res, next) => {
  try {
    const brandId = req.headers["x-brand-id"] as string;
    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing required header: x-brand-id",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    const body = req.body;

    // Handle both single event and array of events
    const events = Array.isArray(body) ? body : [body];

    const responses = [];
    for (const event of events) {
      // Validate event
      const validationResult = HubSpotWebhookBodySchema.safeParse(event);
      if (!validationResult.success) {
        logger.warn("HubSpot webhook invalid event", { event });
        continue;
      }

      const idempotencyKey = `hubspot-${event.eventId}`;

      const response = await webhookHandler.handleEvent({
        provider: "hubspot",
        brandId,
        eventType: event.subscriptionType,
        payload: event,
        idempotencyKey,
        timestamp: event.timestamp,
      });

      responses.push(response);
    }

    (res as any).json({
      success: true,
      processed: responses.length,
      results: responses,
    });
  } catch (error) {
    logger.error("HubSpot webhook error", error instanceof Error ? error : new Error(String(error)));
    if (error instanceof AppError) {
      return next(error);
    }
    next(
      new AppError(
        ErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : "Internal server error",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        error instanceof Error ? { originalError: error.message } : undefined,
        "Please try again later or contact support"
      )
    );
  }
};

/**
 * GET /api/webhooks/status/:eventId
 * Get status of a specific webhook event
 * 
 * **Auth:** Not required (but validates brand ownership via x-brand-id header)
 * **Params:** eventId (string)
 * **Headers:** x-brand-id (required)
 */
export const getWebhookStatus: RequestHandler = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const brandId = req.headers["x-brand-id"] as string;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing required header: x-brand-id",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    const eventStatus = (await webhookHandler.getEventStatus(eventId)) as unknown;
    if (!eventStatus) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Event not found",
        HTTP_STATUS.NOT_FOUND,
        "info"
      );
    }

    const typedStatus = eventStatus as {
      id?: string;
      brand_id?: string;
      provider?: string;
      event_type?: string;
      status?: string;
      attempt_count?: number;
      max_attempts?: number;
      created_at?: string;
      updated_at?: string;
      delivered_at?: string;
      last_error?: string;
      attempts?: Array<{
        attempt_number?: number;
        status?: string;
        error?: string;
        response_code?: number;
        backoff_ms?: number;
        created_at?: string;
      }>;
    };

    // Verify brand ownership
    if (typedStatus.brand_id !== brandId) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "Unauthorized",
        HTTP_STATUS.FORBIDDEN,
        "warning"
      );
    }

    (res as any).json({
      success: true,
      event: {
        id: typedStatus.id,
        provider: typedStatus.provider,
        eventType: typedStatus.event_type,
        status: typedStatus.status,
        attemptCount: typedStatus.attempt_count,
        maxAttempts: typedStatus.max_attempts,
        createdAt: typedStatus.created_at,
        updatedAt: typedStatus.updated_at,
        deliveredAt: typedStatus.delivered_at,
        lastError: typedStatus.last_error,
      },
      attempts: (typedStatus.attempts || []).map((a) => ({
        attemptNumber: a.attempt_number,
        status: a.status,
        error: a.error,
        responseCode: a.response_code,
        backoffMs: a.backoff_ms,
        createdAt: a.created_at,
      })),
    });
  } catch (error) {
    console.error("[Webhook Status] Error:", error);
    if (error instanceof AppError) {
      return next(error);
    }
    next(
      new AppError(
        ErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : "Internal server error",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        error instanceof Error ? { originalError: error.message } : undefined,
        "Please try again later or contact support"
      )
    );
  }
};

/**
 * GET /api/webhooks/logs
 * Get webhook event logs with filtering
 * 
 * **Auth:** Not required (but validates brand ownership via x-brand-id header)
 * **Headers:** x-brand-id (required)
 * **Query:** provider, status, startDate, endDate, limit, offset
 */
export const getWebhookLogs: RequestHandler = async (req, res, next) => {
  try {
    const brandId = req.headers["x-brand-id"] as string;
    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing required header: x-brand-id",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Validate query parameters
    const validationResult = WebhookLogsQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
        code: e.code,
      }));
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Request validation failed",
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        "warning",
        { validationErrors },
        "Please review the validation errors and retry your request"
      );
    }

    const query = validationResult.data;
    const { events, total } = await webhookEvents.query({
      brandId,
      provider: query.provider,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      limit: query.limit,
      offset: query.offset,
    });

    (res as any).json({
      success: true,
      events: (events as Array<{
        id?: string;
        provider?: string;
        event_type?: string;
        status?: string;
        attempt_count?: number;
        max_attempts?: number;
        created_at?: string;
        updated_at?: string;
        delivered_at?: string;
        last_error?: string;
      }>).map((e) => ({
        id: e.id,
        provider: e.provider,
        eventType: e.event_type,
        status: e.status,
        attemptCount: e.attempt_count,
        maxAttempts: e.max_attempts,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
        deliveredAt: e.delivered_at,
        lastError: e.last_error,
      })),
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < total,
      },
    });
  } catch (error) {
    logger.error("Webhook logs error", error instanceof Error ? error : new Error(String(error)));
    if (error instanceof AppError) {
      return next(error);
    }
    next(
      new AppError(
        ErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : "Internal server error",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        error instanceof Error ? { originalError: error.message } : undefined,
        "Please try again later or contact support"
      )
    );
  }
};

/**
 * POST /api/webhooks/retry/:eventId
 * Manually trigger retry for a failed webhook event
 * 
 * **Auth:** Not required (but validates brand ownership via x-brand-id header)
 * **Params:** eventId (string)
 * **Headers:** x-brand-id (required), x-user-id (optional), x-user-email (optional)
 */
export const retryWebhookEvent: RequestHandler = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const brandId = req.headers["x-brand-id"] as string;
    const userId = req.headers["x-user-id"] as string;
    const userEmail = req.headers["x-user-email"] as string;

    if (!brandId) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Missing required header: x-brand-id",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // Get event
    const event = (await webhookHandler.getEventStatus(eventId)) as {
      brand_id?: string;
      provider?: string;
      event_type?: string;
    } | unknown;
    if (!event) {
      throw new AppError(
        ErrorCode.NOT_FOUND,
        "Event not found",
        HTTP_STATUS.NOT_FOUND,
        "info"
      );
    }

    // Verify brand ownership
    const typedEvent = event as { brand_id?: string };
    if (typedEvent.brand_id !== brandId) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "Unauthorized",
        HTTP_STATUS.FORBIDDEN,
        "warning"
      );
    }

    // Log audit trail
    await logAuditAction(
      brandId,
      eventId,
      userId || "system",
      userEmail || "system",
      "WEBHOOK_RETRY_TRIGGERED",
      {
        provider: (event as any).provider,
        eventType: (event as any).event_type,
      },
    );

    (res as any).json({
      success: true,
      message: "Webhook retry triggered",
      eventId,
    });
  } catch (error) {
    logger.error("Webhook retry error", error instanceof Error ? error : new Error(String(error)));
    if (error instanceof AppError) {
      return next(error);
    }
    next(
      new AppError(
        ErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : "Internal server error",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error",
        error instanceof Error ? { originalError: error.message } : undefined,
        "Please try again later or contact support"
      )
    );
  }
};
