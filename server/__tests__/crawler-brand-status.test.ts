/**
 * Crawler Brand Status Update Tests
 * 
 * Verifies that brands.scraper_status and brands.scraped_at are correctly
 * updated after crawl completion, ensuring UI can distinguish:
 * - never run
 * - ran successfully with 0 assets
 * - failed
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { supabase } from "../lib/supabase";
import { markBrandCrawlFinished } from "../lib/brand-status-updater";

describe("Crawler Brand Status Updates", () => {
  let testBrandId: string;
  let testTenantId: string;

  beforeAll(async () => {
    // Create a test tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name: `test-crawler-status-${Date.now()}`,
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      throw new Error(`Failed to create test tenant: ${tenantError?.message}`);
    }
    testTenantId = tenant.id;

    // Create a test brand
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .insert({
        name: `Test Brand ${Date.now()}`,
        slug: `test-brand-${Date.now()}`,
        tenant_id: testTenantId,
        website_url: "https://example.com",
        scraper_status: "never_run", // Initial state
      })
      .select()
      .single();

    if (brandError || !brand) {
      throw new Error(`Failed to create test brand: ${brandError?.message}`);
    }
    testBrandId = brand.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testBrandId) {
      await supabase.from("brands").delete().eq("id", testBrandId);
    }
    if (testTenantId) {
      await supabase.from("tenants").delete().eq("id", testTenantId);
    }
  });

  it("should update brand status to 'ok' after successful crawl with assets", async () => {
    const runId = `test_run_${Date.now()}`;
    
    await markBrandCrawlFinished(testBrandId, {
      status: "ok",
      runId,
      durationMs: 5000,
      pagesScraped: 2,
      imagesExtracted: 5,
      colorsExtracted: 3,
    });

    // Verify database state
    const { data: brand, error } = await supabase
      .from("brands")
      .select("scraper_status, scraped_at")
      .eq("id", testBrandId)
      .single();

    expect(error).toBeNull();
    expect(brand).not.toBeNull();
    expect(brand!.scraper_status).toBe("ok");
    expect(brand!.scraped_at).not.toBeNull();
    
    // Verify scraped_at is a recent timestamp
    const scrapedAt = new Date(brand!.scraped_at);
    const now = new Date();
    const diffSeconds = (now.getTime() - scrapedAt.getTime()) / 1000;
    expect(diffSeconds).toBeLessThan(10); // Should be within last 10 seconds
  });

  it("should update brand status to 'ok' even when 0 assets extracted (example.com case)", async () => {
    const runId = `test_run_zero_assets_${Date.now()}`;
    
    // Reset to never_run first
    await supabase
      .from("brands")
      .update({ scraper_status: "never_run", scraped_at: null })
      .eq("id", testBrandId);

    // Mark crawl as finished with 0 assets (like example.com)
    await markBrandCrawlFinished(testBrandId, {
      status: "ok",
      runId,
      durationMs: 75396,
      pagesScraped: 1,
      imagesExtracted: 0, // Zero assets extracted
      colorsExtracted: 0,
    });

    // Verify database state
    const { data: brand, error } = await supabase
      .from("brands")
      .select("scraper_status, scraped_at")
      .eq("id", testBrandId)
      .single();

    expect(error).toBeNull();
    expect(brand).not.toBeNull();
    
    // Critical assertion: status should be 'ok' even with 0 assets
    expect(brand!.scraper_status).toBe("ok");
    expect(brand!.scraped_at).not.toBeNull();
    
    // UI can now distinguish "never run" from "ran but found nothing"
    expect(brand!.scraper_status).not.toBe("never_run");
  });

  it("should update brand status to 'error' after failed crawl", async () => {
    const runId = `test_run_error_${Date.now()}`;
    
    // Reset to never_run first
    await supabase
      .from("brands")
      .update({ scraper_status: "never_run", scraped_at: null })
      .eq("id", testBrandId);

    // Mark crawl as failed
    await markBrandCrawlFinished(testBrandId, {
      status: "error",
      runId,
      durationMs: 1000,
      error: "Connection timeout",
    });

    // Verify database state
    const { data: brand, error } = await supabase
      .from("brands")
      .select("scraper_status, scraped_at")
      .eq("id", testBrandId)
      .single();

    expect(error).toBeNull();
    expect(brand).not.toBeNull();
    expect(brand!.scraper_status).toBe("error");
    expect(brand!.scraped_at).not.toBeNull(); // scraped_at is still set
  });

  it("should handle multiple crawl runs (idempotency)", async () => {
    // Run crawl multiple times
    for (let i = 0; i < 3; i++) {
      const runId = `test_run_multi_${Date.now()}_${i}`;
      await markBrandCrawlFinished(testBrandId, {
        status: "ok",
        runId,
        durationMs: 1000 * (i + 1),
        pagesScraped: i + 1,
        imagesExtracted: i,
        colorsExtracted: 0,
      });
    }

    // Verify final state
    const { data: brand, error } = await supabase
      .from("brands")
      .select("scraper_status, scraped_at")
      .eq("id", testBrandId)
      .single();

    expect(error).toBeNull();
    expect(brand).not.toBeNull();
    expect(brand!.scraper_status).toBe("ok");
    expect(brand!.scraped_at).not.toBeNull();
  });

  it("should not crash when brand_id is temporary (starts with 'brand_')", async () => {
    // This simulates the onboarding flow with temporary brand IDs
    const tempBrandId = `brand_${Date.now()}`;
    const runId = `test_run_temp_${Date.now()}`;

    // Should not throw error, just log and continue
    await expect(
      markBrandCrawlFinished(tempBrandId, {
        status: "ok",
        runId,
        durationMs: 5000,
        pagesScraped: 1,
        imagesExtracted: 2,
        colorsExtracted: 1,
      })
    ).resolves.not.toThrow();
    
    // Note: This won't actually update DB since brand doesn't exist,
    // but the function should handle it gracefully
  });
});

