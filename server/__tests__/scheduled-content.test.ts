/**
 * Tests for scheduled_content creation workflow
 * 
 * Verifies that when content is scheduled, rows are created in scheduled_content table
 * with correct brand_id, content_id, scheduled_at, and platforms.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { approvalsDB } from "../lib/approvals-db-service";
import { supabase } from "../lib/supabase";

describe("Scheduled Content Workflow", () => {
  let testBrandId: string;
  let testContentId: string;
  let testTenantId: string;

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

    // Create test brand
    const { data: brand } = await supabase
      .from("brands")
      .insert({
        name: `Test Brand ${Date.now()}`,
        tenant_id: testTenantId,
        website_url: "https://example.com",
      })
      .select()
      .single();

    testBrandId = brand?.id || "";

    // Create test content item
    const { data: contentItem } = await supabase
      .from("content_items")
      .insert({
        brand_id: testBrandId,
        title: "Test Content",
        type: "post",
        content: { body: "Test content body" },
        platform: "instagram",
        status: "approved",
      })
      .select()
      .single();

    testContentId = contentItem?.id || "";
  });

  afterEach(async () => {
    // Cleanup: Delete test data
    if (testContentId) {
      await supabase.from("scheduled_content").delete().eq("content_id", testContentId);
      await supabase.from("content_items").delete().eq("id", testContentId);
    }
    if (testBrandId) {
      await supabase.from("brands").delete().eq("id", testBrandId);
    }
    if (testTenantId) {
      await supabase.from("tenants").delete().eq("id", testTenantId);
    }
  });

  it("should create scheduled_content row when content is scheduled", async () => {
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 1); // Tomorrow
    const platforms = ["instagram", "facebook"];

    const scheduledContent = await approvalsDB.createScheduledContent(
      testContentId,
      testBrandId,
      scheduledAt,
      platforms
    );

    expect(scheduledContent).toBeDefined();
    expect(scheduledContent.brand_id).toBe(testBrandId);
    expect(scheduledContent.content_id).toBe(testContentId);
    expect(scheduledContent.scheduled_at).toBe(scheduledAt.toISOString());
    expect(scheduledContent.platforms).toEqual(platforms);
    expect(scheduledContent.status).toBe("scheduled");
  });

  it("should enforce unique constraint (content_id + scheduled_at)", async () => {
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 1);
    const platforms = ["instagram"];

    // Create first scheduled content
    await approvalsDB.createScheduledContent(
      testContentId,
      testBrandId,
      scheduledAt,
      platforms
    );

    // Try to create duplicate (same content_id + scheduled_at)
    await expect(
      approvalsDB.createScheduledContent(
        testContentId,
        testBrandId,
        scheduledAt,
        platforms
      )
    ).rejects.toThrow();
  });

  it("should require at least one platform", async () => {
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 1);

    await expect(
      approvalsDB.createScheduledContent(
        testContentId,
        testBrandId,
        scheduledAt,
        []
      )
    ).rejects.toThrow("At least one platform is required");
  });

  it("should allow scheduling same content at different times", async () => {
    const platforms = ["instagram"];
    const scheduledAt1 = new Date();
    scheduledAt1.setDate(scheduledAt1.getDate() + 1);
    const scheduledAt2 = new Date();
    scheduledAt2.setDate(scheduledAt2.getDate() + 2);

    const scheduled1 = await approvalsDB.createScheduledContent(
      testContentId,
      testBrandId,
      scheduledAt1,
      platforms
    );

    const scheduled2 = await approvalsDB.createScheduledContent(
      testContentId,
      testBrandId,
      scheduledAt2,
      platforms
    );

    expect(scheduled1.id).not.toBe(scheduled2.id);
    expect(scheduled1.scheduled_at).toBe(scheduledAt1.toISOString());
    expect(scheduled2.scheduled_at).toBe(scheduledAt2.toISOString());
  });
});

