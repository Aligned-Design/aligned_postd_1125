import { describe, it, expect } from "vitest";
import {
  BrandIdSchema,
  PlatformSchema,
  EmailSchema,
  CreateIntegrationBodySchema,
  GetIntegrationsQuerySchema,
} from "../lib/validation-schemas";
import { InitiateOAuthSchema } from "@shared/validation-schemas";

describe("Validation Schemas", () => {
  describe("BrandIdSchema", () => {
    it("should accept valid brand IDs (UUID)", async () => {
      const result = await BrandIdSchema.parseAsync("550e8400-e29b-41d4-a716-446655440000");
      expect(result).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should reject empty brand ID", async () => {
      try {
        await BrandIdSchema.parseAsync("");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should reject invalid UUID format", async () => {
      try {
        await BrandIdSchema.parseAsync("brand@123!");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("PlatformSchema", () => {
    it("should accept valid platforms", async () => {
      const validPlatforms = [
        "instagram",
        "facebook",
        "linkedin",
        "twitter",
        "google_business",
      ];
      for (const platform of validPlatforms) {
        const result = await PlatformSchema.parseAsync(platform);
        expect(result).toBe(platform);
      }
    });

    it("should reject invalid platform", async () => {
      try {
        await PlatformSchema.parseAsync("tiktok");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("EmailSchema", () => {
    it("should accept valid emails", async () => {
      const result = await EmailSchema.parseAsync("user@example.com");
      expect(result).toBe("user@example.com");
    });

    it("should reject invalid emails", async () => {
      try {
        await EmailSchema.parseAsync("not-an-email");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("CreateIntegrationBodySchema", () => {
    it("should accept valid integration body", async () => {
      const body = {
        brandId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID
        type: "instagram",
      };
      const result = await CreateIntegrationBodySchema.parseAsync(body);
      expect(result.brandId).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(result.type).toBe("instagram");
    });

    it("should reject missing required fields", async () => {
      try {
        await CreateIntegrationBodySchema.parseAsync({
          brandId: "550e8400-e29b-41d4-a716-446655440000",
          // missing type
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("GetIntegrationsQuerySchema", () => {
    it("should accept valid query with pagination", async () => {
      const query = {
        brandId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID
        page: 1,
        limit: 20,
      };
      const result = await GetIntegrationsQuerySchema.parseAsync(query);
      expect(result.brandId).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("should use default pagination values", async () => {
      const query = {
        brandId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID
      };
      const result = await GetIntegrationsQuerySchema.parseAsync(query);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("should reject invalid pagination limits", async () => {
      try {
        await GetIntegrationsQuerySchema.parseAsync({
          brandId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID
          limit: 200, // exceeds max of 100
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("InitiateOAuthSchema", () => {
    it("should accept valid OAuth initiate request", async () => {
      const body = {
        platform: "instagram",
        brandId: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID
      };
      const result = await InitiateOAuthSchema.parseAsync(body);
      expect(result.platform).toBe("instagram");
      expect(result.brandId).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should reject missing platform", async () => {
      try {
        await InitiateOAuthSchema.parseAsync({
          brandId: "550e8400-e29b-41d4-a716-446655440000",
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
