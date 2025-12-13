#!/usr/bin/env tsx
/**
 * Smoke test: Scrape two real sites and print DB evidence
 * 
 * Sites:
 * - https://sdirawealth.com (Squarespace)
 * - https://1-spine.com (WordPress)
 */

import "dotenv/config";
import { supabase } from "../server/lib/supabase";
import { generateTokenPair } from "../server/lib/jwt-auth";
import { Role } from "../server/middleware/rbac";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";
const API_BASE = process.env.API_BASE || "http://localhost:8080";

const TEST_SITES = [
  {
    name: "Squarespace",
    url: "https://sdirawealth.com",
    expectedHost: "squarespace",
    brandId: "smoke-test-squarespace-brand-id",
  },
  {
    name: "WordPress",
    url: "https://1-spine.com",
    expectedHost: "wordpress",
    brandId: "smoke-test-wordpress-brand-id",
  },
];

interface SmokeResult {
  site: string;
  url: string;
  brandId: string;
  success: boolean;
  hostDetected: string;
  roleBreakdown: Record<string, number>;
  first10Images: Array<{ role: string; url: string }>;
  legacyColumnsNull: boolean;
  colorCount: number;
  duration: number;
}

async function setupBrand(brandId: string, name: string) {
  // Ensure tenant exists
  await supabase.from("tenants").upsert(
    { id: TENANT_ID, name: "Smoke Test Tenant" },
    { onConflict: "id" }
  );

  // Clean up old data
  await supabase.from("media_assets").delete().eq("brand_id", brandId);
  await supabase.from("brands").delete().eq("id", brandId);

  // Create fresh brand
  const { error } = await supabase.from("brands").insert({
    id: brandId,
    tenant_id: TENANT_ID,
    name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to create brand: ${error.message}`);
  }
}

async function runScrape(site: typeof TEST_SITES[0]): Promise<SmokeResult> {
  const startTime = Date.now();

  const result: SmokeResult = {
    site: site.name,
    url: site.url,
    brandId: site.brandId,
    success: false,
    hostDetected: "unknown",
    roleBreakdown: {},
    first10Images: [],
    legacyColumnsNull: false,
    colorCount: 0,
    duration: 0,
  };

  try {
    // Setup brand
    await setupBrand(site.brandId, `${site.name} Smoke Test`);

    // Generate auth token
    const { accessToken } = generateTokenPair({
      userId: "smoke-test-user",
      email: "smoke@test.com",
      role: Role.ADMIN,
      brandIds: [site.brandId],
      tenantId: TENANT_ID,
      workspaceId: TENANT_ID,
    });

    // Execute scrape
    const response = await fetch(`${API_BASE}/api/crawl/start?sync=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url: site.url,
        brand_id: site.brandId,
        workspaceId: TENANT_ID,
        sync: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ ${site.name} scrape failed:`, data.error?.message || data);
      result.duration = Date.now() - startTime;
      return result;
    }

    // Wait for DB to settle
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify brand_kit
    const { data: brand } = await supabase
      .from("brands")
      .select("brand_kit, voice_summary, visual_summary, tone_keywords")
      .eq("id", site.brandId)
      .single();

    if (brand?.brand_kit) {
      const brandKit = brand.brand_kit as any;
      result.hostDetected = brandKit.metadata?.host?.name || "unknown";
      result.colorCount = brandKit.visualIdentity?.colors?.length || 0;
      result.legacyColumnsNull =
        brand.voice_summary === null &&
        brand.visual_summary === null &&
        brand.tone_keywords === null;
    }

    // Verify images
    const { data: images } = await supabase
      .from("media_assets")
      .select("path, metadata, created_at")
      .eq("brand_id", site.brandId)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (images && images.length > 0) {
      const roles = images.map((img) => (img.metadata as any)?.role || "unknown");
      
      // Role breakdown
      roles.forEach((role) => {
        result.roleBreakdown[role] = (result.roleBreakdown[role] || 0) + 1;
      });

      // First 10 images
      result.first10Images = images.slice(0, 10).map((img) => ({
        role: (img.metadata as any)?.role || "unknown",
        url: img.path.substring(0, 60) + (img.path.length > 60 ? "..." : ""),
      }));
    }

    result.success = true;
    result.duration = Date.now() - startTime;

    return result;
  } catch (error) {
    console.error(`❌ ${site.name} error:`, error);
    result.duration = Date.now() - startTime;
    return result;
  }
}

function printResult(result: SmokeResult) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`${result.success ? "✅" : "❌"} ${result.site} (${result.url})`);
  console.log("=".repeat(70));
  console.log(`Brand ID: ${result.brandId}`);
  console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`);
  console.log(`Status: ${result.success ? "SUCCESS" : "FAILED"}`);
  
  if (!result.success) {
    console.log("\n⚠️  Scrape failed or timed out");
    return;
  }

  console.log(`\nHost Detected: ${result.hostDetected}`);
  console.log(`Color Count: ${result.colorCount}`);
  console.log(`Legacy Columns NULL: ${result.legacyColumnsNull ? "✅" : "❌"}`);

  console.log(`\nRole Breakdown:`);
  Object.entries(result.roleBreakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });

  console.log(`\nFirst 10 Images:`);
  result.first10Images.forEach((img, idx) => {
    console.log(`   ${idx + 1}. [${img.role}] ${img.url}`);
  });
}

function printSQLQueries(brandId: string) {
  console.log(`\n${"=".repeat(70)}`);
  console.log("SQL Verification Queries (Run these manually if needed)");
  console.log("=".repeat(70));

  console.log(`\n-- 1) Check brand_kit and legacy columns`);
  console.log(`SELECT 
  id, 
  brand_kit IS NOT NULL as has_brand_kit,
  voice_summary IS NOT NULL as has_voice_summary,
  visual_summary IS NOT NULL as has_visual_summary,
  tone_keywords IS NOT NULL as has_tone_keywords,
  updated_at
FROM brands 
WHERE id = '${brandId}';`);

  console.log(`\n-- 2) Check image role distribution`);
  console.log(`SELECT 
  metadata->>'role' as role,
  COUNT(*) as count
FROM media_assets
WHERE brand_id = '${brandId}' AND status = 'active'
GROUP BY metadata->>'role'
ORDER BY count DESC;`);

  console.log(`\n-- 3) Check first 10 images by created_at`);
  console.log(`SELECT 
  metadata->>'role' as role,
  SUBSTRING(path, 1, 60) as url_preview,
  created_at
FROM media_assets
WHERE brand_id = '${brandId}' AND status = 'active'
ORDER BY created_at ASC
LIMIT 10;`);
}

async function main() {
  console.log("🔬 SMOKE TEST: Real Site Scraping\n");
  console.log(`API Base: ${API_BASE}`);
  console.log(`Sites: ${TEST_SITES.map(s => s.name).join(", ")}\n`);

  const results: SmokeResult[] = [];

  for (const site of TEST_SITES) {
    const result = await runScrape(site);
    results.push(result);
    printResult(result);
  }

  // Print SQL queries for manual verification
  console.log("\n");
  TEST_SITES.forEach(site => printSQLQueries(site.brandId));

  // Summary
  console.log(`\n${"=".repeat(70)}`);
  console.log("SUMMARY");
  console.log("=".repeat(70));

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log(`\nSuccess Rate: ${successCount}/${totalCount}`);

  results.forEach(r => {
    const status = r.success ? "✅ PASS" : "❌ FAIL";
    const logoCount = r.roleBreakdown["logo"] || 0;
    const hasNonLogos = Object.keys(r.roleBreakdown).some(role => role !== "logo");
    const logoStatus = logoCount <= 2 && hasNonLogos ? "✅" : "⚠️";

    console.log(`\n${status} ${r.site}`);
    console.log(`   Host: ${r.hostDetected} (expected: ${TEST_SITES.find(s => s.name === r.site)?.expectedHost})`);
    console.log(`   ${logoStatus} Logos: ${logoCount}/2`);
    console.log(`   Colors: ${r.colorCount}`);
    console.log(`   Legacy: ${r.legacyColumnsNull ? "✅ Clean" : "⚠️  Dirty"}`);
  });

  console.log("\n");

  // Exit code
  process.exit(successCount === totalCount ? 0 : 1);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

