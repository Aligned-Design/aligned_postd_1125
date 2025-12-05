/**
 * Tests for brand reconciliation (temporary brand ID → final UUID)
 * 
 * Verifies that reconcileTemporaryBrandAssets correctly transfers media_assets
 * from temporary brand IDs to final UUID-based brand IDs.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { reconcileTemporaryBrandAssets } from "../lib/brand-reconciliation";
import { supabase } from "../lib/supabase";

describe("Brand Reconciliation", () => {
  let testTenantId: string;
  let testFinalBrandId: string;
  let tempBrandId: string;

  beforeEach(async () => {
    // Create test tenant
    const { data: tenant } = await supabase
      .from("tenants")
      .insert({
        name: `Test Tenant ${Date.now()}`,
        slug: `test-tenant-${Date.now()}`,
      })
      .select()
      .single();

    testTenantId = tenant?.id || "";

    // Create final brand (UUID)
    const { data: brand } = await supabase
      .from("brands")
      .insert({
        name: `Test Brand ${Date.now()}`,
        tenant_id: testTenantId,
        website_url: "https://example.com",
      })
      .select()
      .single();

    testFinalBrandId = brand?.id || "";
    tempBrandId = `brand_${Date.now()}`;
  });

  afterEach(async () => {
    // Cleanup: Delete test data
    if (testFinalBrandId) {
      await supabase.from("media_assets").delete().eq("brand_id", testFinalBrandId);
      await supabase.from("brands").delete().eq("id", testFinalBrandId);
    }
    if (testTenantId) {
      await supabase.from("tenants").delete().eq("id", testTenantId);
    }
  });

  it("should transfer media_assets from temp brand ID to final UUID", async () => {
    // Create media assets with temp brand ID
    const { data: media1 } = await supabase
      .from("media_assets")
      .insert({
        brand_id: tempBrandId,
        tenant_id: testTenantId,
        filename: "test-image-1.jpg",
        path: "https://example.com/image1.jpg",
        category: "images",
        status: "active",
      })
      .select()
      .single();

    const { data: media2 } = await supabase
      .from("media_assets")
      .insert({
        brand_id: tempBrandId,
        tenant_id: testTenantId,
        filename: "test-image-2.jpg",
        path: "https://example.com/image2.jpg",
        category: "logos",
        status: "active",
      })
      .select()
      .single();

    expect(media1).toBeDefined();
    expect(media2).toBeDefined();

    // Reconcile
    const result = await reconcileTemporaryBrandAssets(tempBrandId, testFinalBrandId);

    expect(result.success).toBe(true);
    expect(result.transferredImages).toBe(2);
    expect(result.errors).toHaveLength(0);

    // Verify assets now have final brand ID
    const { data: updatedMedia1 } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", media1?.id)
      .single();

    const { data: updatedMedia2 } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", media2?.id)
      .single();

    expect(updatedMedia1?.brand_id).toBe(testFinalBrandId);
    expect(updatedMedia2?.brand_id).toBe(testFinalBrandId);
    expect(updatedMedia1?.tenant_id).toBe(testTenantId);
    expect(updatedMedia2?.tenant_id).toBe(testTenantId);

    // Verify no assets remain with temp brand ID
    const { data: remainingTempAssets } = await supabase
      .from("media_assets")
      .select("*")
      .eq("brand_id", tempBrandId);

    expect(remainingTempAssets).toHaveLength(0);
  });

  it("should handle temp ID that doesn't start with 'brand_'", async () => {
    const invalidTempId = "invalid_temp_id";

    const result = await reconcileTemporaryBrandAssets(invalidTempId, testFinalBrandId);

    expect(result.success).toBe(true); // Returns success but with error message
    expect(result.transferredImages).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("format");
  });

  it("should reject invalid final brand ID (not UUID)", async () => {
    const invalidFinalId = "not-a-uuid";

    const result = await reconcileTemporaryBrandAssets(tempBrandId, invalidFinalId);

    expect(result.success).toBe(false);
    expect(result.transferredImages).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("UUID");
  });

  it("should be idempotent (safe to call multiple times)", async () => {
    // Create media asset with temp brand ID
    const { data: media } = await supabase
      .from("media_assets")
      .insert({
        brand_id: tempBrandId,
        tenant_id: testTenantId,
        filename: "test-image.jpg",
        path: "https://example.com/image.jpg",
        category: "images",
        status: "active",
      })
      .select()
      .single();

    // Reconcile first time
    const result1 = await reconcileTemporaryBrandAssets(tempBrandId, testFinalBrandId);
    expect(result1.success).toBe(true);
    expect(result1.transferredImages).toBe(1);

    // Reconcile second time (should be safe)
    const result2 = await reconcileTemporaryBrandAssets(tempBrandId, testFinalBrandId);
    expect(result2.success).toBe(true);
    expect(result2.transferredImages).toBe(0); // No new transfers

    // Verify asset still has final brand ID
    const { data: updatedMedia } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", media?.id)
      .single();

    expect(updatedMedia?.brand_id).toBe(testFinalBrandId);
  });

  it("should handle case where no assets exist for temp brand ID", async () => {
    const result = await reconcileTemporaryBrandAssets(tempBrandId, testFinalBrandId);

    expect(result.success).toBe(true);
    expect(result.transferredImages).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("should handle case where temp and final IDs are the same", async () => {
    const result = await reconcileTemporaryBrandAssets(testFinalBrandId, testFinalBrandId);

    expect(result.success).toBe(true);
    expect(result.transferredImages).toBe(0);
    expect(result.errors).toHaveLength(0);
  });
});

