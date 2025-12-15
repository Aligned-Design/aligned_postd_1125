/**
 * Unit Tests for OpenAI Payload Sanitizer
 * 
 * Ensures that model-specific parameter constraints are enforced
 * to prevent API errors with models that have limited parameter support.
 */

import { describe, it, expect } from "vitest";
import {
  sanitizeOpenAIPayload,
  isValidOpenAIPayload,
  type OpenAIPayload,
} from "../lib/openai-payload-sanitizer";

describe("sanitizeOpenAIPayload", () => {
  const baseMessages = [
    { role: "system", content: "You are a helpful assistant" },
    { role: "user", content: "Hello" },
  ];

  describe("gpt-5* models (limited parameter support)", () => {
    it("should remove temperature for gpt-5-mini", () => {
      const payload: OpenAIPayload = {
        model: "gpt-5-mini",
        messages: baseMessages,
        temperature: 0.7,
      };

      const sanitized = sanitizeOpenAIPayload(payload);

      expect(sanitized.model).toBe("gpt-5-mini");
      expect(sanitized.messages).toEqual(baseMessages);
      expect(sanitized.temperature).toBeUndefined();
    });

    it("should remove presence_penalty for gpt-5-mini", () => {
      const payload: OpenAIPayload = {
        model: "gpt-5-mini",
        messages: baseMessages,
        presence_penalty: 0.1,
      };

      const sanitized = sanitizeOpenAIPayload(payload);

      expect(sanitized.presence_penalty).toBeUndefined();
    });

    it("should remove frequency_penalty for gpt-5-mini", () => {
      const payload: OpenAIPayload = {
        model: "gpt-5-mini",
        messages: baseMessages,
        frequency_penalty: 0.1,
      };

      const sanitized = sanitizeOpenAIPayload(payload);

      expect(sanitized.frequency_penalty).toBeUndefined();
    });

    it("should remove ALL unsupported parameters for gpt-5-mini", () => {
      const payload: OpenAIPayload = {
        model: "gpt-5-mini",
        messages: baseMessages,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        max_completion_tokens: 1000,
      };

      const sanitized = sanitizeOpenAIPayload(payload);

      // Should keep supported parameters
      expect(sanitized.model).toBe("gpt-5-mini");
      expect(sanitized.messages).toEqual(baseMessages);
      expect(sanitized.max_completion_tokens).toBe(1000);

      // Should remove unsupported parameters
      expect(sanitized.temperature).toBeUndefined();
      expect(sanitized.presence_penalty).toBeUndefined();
      expect(sanitized.frequency_penalty).toBeUndefined();
    });

    it("should handle gpt-5-nano (any gpt-5* variant)", () => {
      const payload: OpenAIPayload = {
        model: "gpt-5-nano",
        messages: baseMessages,
        temperature: 0.7,
        presence_penalty: 0.1,
      };

      const sanitized = sanitizeOpenAIPayload(payload);

      expect(sanitized.temperature).toBeUndefined();
      expect(sanitized.presence_penalty).toBeUndefined();
    });
  });

  describe("gpt-4* and other models (full parameter support)", () => {
    it("should keep temperature for gpt-4o", () => {
      const payload: OpenAIPayload = {
        model: "gpt-4o",
        messages: baseMessages,
        temperature: 0.7,
      };

      const sanitized = sanitizeOpenAIPayload(payload);

      expect(sanitized.temperature).toBe(0.7);
    });

    it("should keep presence_penalty for gpt-4o", () => {
      const payload: OpenAIPayload = {
        model: "gpt-4o",
        messages: baseMessages,
        presence_penalty: 0.1,
      };

      const sanitized = sanitizeOpenAIPayload(payload);

      expect(sanitized.presence_penalty).toBe(0.1);
    });

    it("should keep frequency_penalty for gpt-4o", () => {
      const payload: OpenAIPayload = {
        model: "gpt-4o",
        messages: baseMessages,
        frequency_penalty: 0.1,
      };

      const sanitized = sanitizeOpenAIPayload(payload);

      expect(sanitized.frequency_penalty).toBe(0.1);
    });

    it("should keep ALL parameters for gpt-4o", () => {
      const payload: OpenAIPayload = {
        model: "gpt-4o",
        messages: baseMessages,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        max_completion_tokens: 1000,
      };

      const sanitized = sanitizeOpenAIPayload(payload);

      expect(sanitized.model).toBe("gpt-4o");
      expect(sanitized.messages).toEqual(baseMessages);
      expect(sanitized.temperature).toBe(0.7);
      expect(sanitized.presence_penalty).toBe(0.1);
      expect(sanitized.frequency_penalty).toBe(0.1);
      expect(sanitized.max_completion_tokens).toBe(1000);
    });

    it("should keep parameters for gpt-4-turbo", () => {
      const payload: OpenAIPayload = {
        model: "gpt-4-turbo",
        messages: baseMessages,
        temperature: 0.8,
        presence_penalty: 0.2,
      };

      const sanitized = sanitizeOpenAIPayload(payload);

      expect(sanitized.temperature).toBe(0.8);
      expect(sanitized.presence_penalty).toBe(0.2);
    });
  });

  describe("edge cases", () => {
    it("should handle payload with only required fields", () => {
      const payload: OpenAIPayload = {
        model: "gpt-5-mini",
        messages: baseMessages,
      };

      const sanitized = sanitizeOpenAIPayload(payload);

      expect(sanitized.model).toBe("gpt-5-mini");
      expect(sanitized.messages).toEqual(baseMessages);
      expect(Object.keys(sanitized)).toEqual(["model", "messages"]);
    });

    it("should not modify undefined parameters", () => {
      const payload: OpenAIPayload = {
        model: "gpt-5-mini",
        messages: baseMessages,
        temperature: undefined,
        presence_penalty: undefined,
      };

      const sanitized = sanitizeOpenAIPayload(payload);

      expect("temperature" in sanitized).toBe(false);
      expect("presence_penalty" in sanitized).toBe(false);
    });

    it("should handle empty messages array", () => {
      const payload: OpenAIPayload = {
        model: "gpt-5-mini",
        messages: [],
      };

      const sanitized = sanitizeOpenAIPayload(payload);

      expect(sanitized.messages).toEqual([]);
    });
  });

  describe("immutability", () => {
    it("should not modify original payload object", () => {
      const original: OpenAIPayload = {
        model: "gpt-5-mini",
        messages: baseMessages,
        temperature: 0.7,
        presence_penalty: 0.1,
      };

      const originalCopy = { ...original };
      sanitizeOpenAIPayload(original);

      // Original should be unchanged
      expect(original).toEqual(originalCopy);
    });
  });
});

describe("isValidOpenAIPayload", () => {
  it("should return true for valid payload", () => {
    const payload = {
      model: "gpt-5-mini",
      messages: [{ role: "user", content: "Hello" }],
    };

    expect(isValidOpenAIPayload(payload)).toBe(true);
  });

  it("should return false for missing model", () => {
    const payload = {
      messages: [{ role: "user", content: "Hello" }],
    };

    expect(isValidOpenAIPayload(payload)).toBe(false);
  });

  it("should return false for missing messages", () => {
    const payload = {
      model: "gpt-5-mini",
    };

    expect(isValidOpenAIPayload(payload)).toBe(false);
  });

  it("should return false for empty messages array", () => {
    const payload = {
      model: "gpt-5-mini",
      messages: [],
    };

    expect(isValidOpenAIPayload(payload)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isValidOpenAIPayload(null)).toBe(false);
  });

  it("should return false for non-object", () => {
    expect(isValidOpenAIPayload("not an object")).toBe(false);
    expect(isValidOpenAIPayload(123)).toBe(false);
    expect(isValidOpenAIPayload(undefined)).toBe(false);
  });
});

