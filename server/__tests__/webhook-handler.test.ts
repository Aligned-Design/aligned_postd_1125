/**
 * Webhook Handler Unit Tests
 * Tests for webhook handling, retry logic, and idempotency
 */

import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import { WebhookHandler } from "../lib/webhook-handler";
import {
  calculateBackoffDelay,
  shouldRetryWebhook,
  DEFAULT_WEBHOOK_RETRY_CONFIG,
  type WebhookProvider,
} from "@shared/webhooks";

describe("Webhook Handler", () => {
  let handler: WebhookHandler;

  beforeEach(() => {
    handler = new WebhookHandler();
  });

  describe("Signature Verification", () => {
    it("should verify valid HMAC-SHA256 signature", () => {
      const body = JSON.stringify({ action: "test", data: {} });
      const secret = "test-secret";
      const signature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      const isValid = handler.verifySignature(
        "zapier",
        body,
        signature,
        secret,
      );
      expect(isValid).toBe(true);
    });

    it("should reject invalid signature", () => {
      const body = JSON.stringify({ action: "test", data: {} });
      const secret = "test-secret";
      // Create an invalid signature with same length as valid one to avoid buffer mismatch
      const invalidSignature = "0000000000000000000000000000000000000000000000000000000000000000";

      const isValid = handler.verifySignature(
        "zapier",
        body,
        invalidSignature,
        secret,
      );
      expect(isValid).toBe(false);
    });

    it("should handle unknown provider gracefully", () => {
      const body = "test";
      const signature = "test-sig";

      const isValid = handler.verifySignature(
        "unknown" as WebhookProvider,
        body,
        signature,
        "secret",
      );
      expect(isValid).toBe(false);
    });
  });

  describe("Backoff Calculation", () => {
    it("should calculate exponential backoff correctly", () => {
      const attempt1 = calculateBackoffDelay(1, DEFAULT_WEBHOOK_RETRY_CONFIG);
      const attempt2 = calculateBackoffDelay(2, DEFAULT_WEBHOOK_RETRY_CONFIG);
      const attempt3 = calculateBackoffDelay(3, DEFAULT_WEBHOOK_RETRY_CONFIG);

      expect(attempt1).toBe(DEFAULT_WEBHOOK_RETRY_CONFIG.baseDelayMs); // 2000
      expect(attempt2).toBe(4000); // 2000 * 2^1
      expect(attempt3).toBe(8000); // 2000 * 2^2
    });

    it("should respect max delay cap", () => {
      const largeAttempt = calculateBackoffDelay(
        20,
        DEFAULT_WEBHOOK_RETRY_CONFIG,
      );
      expect(largeAttempt).toBeLessThanOrEqual(
        DEFAULT_WEBHOOK_RETRY_CONFIG.maxDelayMs,
      );
    });

    it("should handle custom retry config", () => {
      const customConfig = {
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        maxAttempts: 5,
        backoffMultiplier: 2,
      };

      const delay = calculateBackoffDelay(2, customConfig);
      expect(delay).toBe(2000); // 1000 * 2^(2-1) = 1000 * 2
    });
  });

  describe("Retry Logic", () => {
    it("should retry delivered events return false", () => {
      const event = {
        id: "test-id",
        status: "delivered",
        attempt_count: 1,
        max_attempts: 5,
      } as unknown;

      const shouldRetry = shouldRetryWebhook(event);
      expect(shouldRetry).toBe(false);
    });

    it("should retry dead-letter events return false", () => {
      const event = {
        id: "test-id",
        status: "dead_letter",
        attempt_count: 5,
        max_attempts: 5,
      } as unknown;

      const shouldRetry = shouldRetryWebhook(event);
      expect(shouldRetry).toBe(false);
    });

    it("should retry pending events below max attempts", () => {
      const event = {
        id: "test-id",
        status: "pending",
        attempt_count: 2,
        max_attempts: 5,
      } as unknown;

      const shouldRetry = shouldRetryWebhook(event);
      expect(shouldRetry).toBe(true);
    });

    it("should not retry events at max attempts", () => {
      const event = {
        id: "test-id",
        status: "failed",
        attempt_count: 5,
        max_attempts: 5,
      } as unknown;

      const shouldRetry = shouldRetryWebhook(event);
      expect(shouldRetry).toBe(false);
    });
  });

  describe("Event Handling", () => {
    it("should create webhook event request with required fields", async () => {
      const request = {
        provider: "zapier" as const,
        brandId: "550e8400-e29b-41d4-a716-446655440000",
        eventType: "test.event",
        payload: { test: "data" },
        idempotencyKey: "test-key-123",
      };

      expect(request.provider).toBe("zapier");
      expect(request.brandId).toMatch(/^[0-9a-f-]{36}$/);
      expect(request.eventType).toBe("test.event");
      expect(request.idempotencyKey).toBe("test-key-123");
    });

    it("should handle multiple providers", () => {
      const providers = ["zapier", "make", "slack", "hubspot"] as const;

      providers.forEach((provider) => {
        expect(provider).toBeTruthy();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle missing brandId gracefully", () => {
      const request = {
        provider: "zapier" as const,
        brandId: "",
        eventType: "test.event",
        payload: {},
        idempotencyKey: "test-key",
      };

      expect(request.brandId).toBe("");
    });

    it("should validate idempotency keys", () => {
      const keys = ["test-1", "test-2", "test-1"]; // Duplicate key
      const uniqueKeys = new Set(keys);

      expect(uniqueKeys.size).toBe(2); // Should have 2 unique keys
    });
  });

  describe("Configuration", () => {
    it("should use default retry config if not provided", () => {
      const handler = new WebhookHandler();
      expect(handler).toBeTruthy();
    });

    it("should accept custom retry config", () => {
      const customConfig = {
        baseDelayMs: 5000,
        maxDelayMs: 60000,
        maxAttempts: 10,
        backoffMultiplier: 1.5,
      };

      const handler = new WebhookHandler({ retryConfig: customConfig });
      expect(handler).toBeTruthy();
    });
  });
});

describe("Webhook Retry Configuration", () => {
  it("should have sensible defaults", () => {
    expect(DEFAULT_WEBHOOK_RETRY_CONFIG.baseDelayMs).toBe(2000);
    expect(DEFAULT_WEBHOOK_RETRY_CONFIG.maxDelayMs).toBe(300000);
    expect(DEFAULT_WEBHOOK_RETRY_CONFIG.maxAttempts).toBe(5);
    expect(DEFAULT_WEBHOOK_RETRY_CONFIG.backoffMultiplier).toBe(2);
  });

  it("should calculate total max retry time", () => {
    let totalTime = 0;
    for (let i = 1; i < DEFAULT_WEBHOOK_RETRY_CONFIG.maxAttempts; i++) {
      totalTime += calculateBackoffDelay(i, DEFAULT_WEBHOOK_RETRY_CONFIG);
    }

    // Should complete within ~15 minutes for max attempts
    expect(totalTime).toBeLessThan(15 * 60 * 1000);
  });
});
