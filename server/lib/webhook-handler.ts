/**
 * Webhook Handler
 * Provides core webhook event handling with idempotency, signature verification, and retry logic
 */

import crypto from "crypto";
import {
  WebhookProvider,
  WebhookHandlerRequest,
  WebhookHandlerResponse,
  SIGNATURE_CONFIGS,
  calculateBackoffDelay,
  shouldRetryWebhook,
  DEFAULT_WEBHOOK_RETRY_CONFIG,
  type WebhookRetryConfig,
} from "@shared/webhooks";
import { webhookEvents, webhookAttempts } from "./dbClient";

// ==================== WEBHOOK HANDLER ====================

interface WebhookHandlerOptions {
  retryConfig?: WebhookRetryConfig;
}

export class WebhookHandler {
  private retryConfig: WebhookRetryConfig;

  constructor(options?: WebhookHandlerOptions) {
    this.retryConfig = options?.retryConfig || DEFAULT_WEBHOOK_RETRY_CONFIG;
  }

  /**
   * Verify webhook signature
   * Ensures the webhook came from a trusted source
   */
  public verifySignature(
    provider: WebhookProvider,
    body: string,
    signature: string,
    secret: string,
  ): boolean {
    const config = SIGNATURE_CONFIGS[provider];
    if (!config) {
      console.warn(
        `[Webhook] Unknown provider for signature verification: ${provider}`,
      );
      return false;
    }

    const expectedSignature = crypto
      .createHmac(config.algorithm.replace("sha", "sha"), secret)
      .update(body)
      .digest(config.encoding);

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Handle incoming webhook event
   * Validates, deduplicates, and processes the event
   */
  public async handleEvent(
    request: WebhookHandlerRequest,
  ): Promise<WebhookHandlerResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Check for idempotency (duplicate detection)
      const existingEvent = await webhookEvents.getByIdempotencyKey(
        request.idempotencyKey,
      );
      if (existingEvent) {
        console.log(
          `[Webhook] Duplicate event detected (idempotency_key: ${request.idempotencyKey})`,
        );
        return {
          success: true,
          eventId: existingEvent.id,
          status: existingEvent.status as
            | "pending"
            | "processing"
            | "delivered"
            | "failed"
            | "dead_letter",
          message: `Event already processed with status: ${existingEvent.status}`,
        };
      }

      // Step 2: Create webhook event record
      const event = await webhookEvents.create({
        brand_id: request.brandId,
        provider: request.provider,
        event_type: request.eventType,
        payload: request.payload,
        idempotency_key: request.idempotencyKey,
        status: "pending" as const,
        attempt_count: 0,
        max_attempts: this.retryConfig.maxAttempts,
      });

      console.log(
        `[Webhook] Event created (id: ${event.id}, provider: ${request.provider}, event_type: ${request.eventType})`,
      );

      // Step 3: Process the event (async in real implementation)
      // For now, we'll mark it as processing and schedule retry
      await webhookEvents.update(event.id, { status: "processing" as const });

      // Step 4: Attempt delivery (simulated - in real usage, you'd call the actual handler)
      const delivered = await this.deliverEvent(event.id, event);

      const duration = Date.now() - startTime;
      console.log(
        `[Webhook] Event processing completed (id: ${event.id}, duration: ${duration}ms)`,
      );

      return {
        success: delivered,
        eventId: event.id,
        status: delivered ? "delivered" : "pending",
        message: delivered
          ? "Event processed successfully"
          : "Event queued for retry",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[Webhook] Handler error: ${errorMessage}`, error);
      throw error;
    }
  }

  /**
   * Deliver/process a webhook event
   * Simulates actual delivery. In production, this would invoke the real handler
   */
  private async deliverEvent(eventId: string, event: unknown): Promise<boolean> {
    try {
      // Log the attempt
      const attemptNumber = (event?.attempt_count || 0) + 1;
      const backoffMs =
        attemptNumber > 1
          ? calculateBackoffDelay(attemptNumber - 1, this.retryConfig)
          : 0;

      // In production, you would call the actual event handler here
      // For now, we'll assume success for most events
      const success = Math.random() > 0.1; // 90% success rate for simulation

      const attemptStatus = success ? "success" : "failed";
      await webhookAttempts.create({
        event_id: eventId,
        attempt_number: attemptNumber,
        status: attemptStatus,
        backoff_ms: backoffMs,
        error: success ? undefined : "Simulated delivery failure",
        response_code: success ? 200 : 500,
      });

      if (success) {
        await webhookEvents.markDelivered(eventId);
        return true;
      }

      // Check if we should retry
      if (attemptNumber < this.retryConfig.maxAttempts) {
        // Schedule next retry by updating status back to pending
        await webhookEvents.update(eventId, {
          status: "pending" as const,
          attempt_count: attemptNumber,
          last_error: "Delivery failed, scheduled for retry",
        });
        return false;
      }

      // Max attempts reached - move to dead letter
      await webhookEvents.markDeadLetter(
        eventId,
        "Max retry attempts exceeded",
      );
      return false;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[Webhook] Delivery error for event ${eventId}: ${errorMessage}`,
      );

      // Log the failed attempt
      await webhookAttempts.create({
        event_id: eventId,
        attempt_number: event.attempt_count + 1,
        status: "failed",
        error: errorMessage,
        backoff_ms: calculateBackoffDelay(
          event.attempt_count,
          this.retryConfig,
        ),
      });

      throw error;
    }
  }

  /**
   * Retry pending webhook events
   * Called by background scheduler
   */
  public async retryPendingEvents(
    maxAgeMinutes: number = 60,
  ): Promise<{ retried: number; failed: number }> {
    try {
      const candidates =
        await webhookEvents.getRetryPendingEvents(maxAgeMinutes);
      let retried = 0;
      let failed = 0;

      for (const event of candidates) {
        try {
          // Convert database record to shared event format for validation
          const eventData = {
            id: event.id,
            status: event.status as
              | "pending"
              | "failed"
              | "processing"
              | "delivered"
              | "dead_letter",
            attempt_count: event.attempt_count,
            max_attempts: event.max_attempts,
            payload: event.payload,
            brand_id: event.brand_id,
            created_at: event.created_at,
            event_type: event.event_type,
            idempotency_key: event.idempotency_key,
            updated_at: event.updated_at,
            delivered_at: event.delivered_at || undefined,
          };
          const shouldRetry = shouldRetryWebhook(eventData as unknown);
          if (!shouldRetry) {
            continue;
          }

          // Update status to processing
          await webhookEvents.update(event.id, {
            status: "processing" as const,
          });

          // Attempt delivery
          const delivered = await this.deliverEvent(event.id, event);
          if (delivered) {
            retried++;
          }
        } catch (error) {
          console.error(`[Webhook] Retry error for event ${event.id}:`, error);
          failed++;
        }
      }

      console.log(
        `[Webhook] Retry batch complete: ${retried} retried, ${failed} failed`,
      );
      return { retried, failed };
    } catch (error) {
      console.error("[Webhook] Retry batch error:", error);
      throw error;
    }
  }

  /**
   * Get event status
   */
  public async getEventStatus(eventId: string): Promise<unknown> {
    const event = await webhookEvents.getById(eventId);
    if (!event) {
      return null;
    }

    const attempts = await webhookAttempts.getByEventId(eventId);
    return {
      ...event,
      attempts,
    };
  }
}

// ==================== SINGLETON INSTANCE ====================

export const webhookHandler = new WebhookHandler();
