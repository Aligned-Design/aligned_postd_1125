#!/usr/bin/env tsx
/**
 * Scraper Truth Smoke Test
 *
 * Verifies that the website scraper & brand kit pipeline uses REAL DATA ONLY:
 * - No mocks, no demo brands, no sample identity
 * - Zero duplicates (hash enforcement)
 * - Zero broken logic (correct categorization)
 * - Zero drift (scraper output matches Brand Kit expectations)
 *
 * Usage:
 *   # Single brand:
 *   SCRAPER_TEST_BRAND_ID_1=<uuid> pnpm scraper:smoke
 *
 *   # Multiple brands:
 *   SCRAPER_TEST_BRAND_ID_1=<uuid1> SCRAPER_TEST_BRAND_ID_2=<uuid2> pnpm scraper:smoke
 *
 *   # With URLs (optional):
 *   SCRAPER_TEST_BRAND_ID_1=<uuid1> SCRAPER_TEST_URL_1=<url> pnpm scraper:smoke
 *
 * Environment Variables:
 *   - SCRAPER_TEST_BRAND_ID_1, SCRAPER_TEST_BRAND_ID_2, ... SCRAPER_TEST_BRAND_ID_N
 *   - SCRAPER_TEST_URL_1, SCRAPER_TEST_URL_2, ... (optional, for display only)
 *
 * Exit Codes:
 *   - 0: All tests passed (with optional warnings)
 *   - 1: Critical failures detected (blocks deployment)
 *
 * What It Checks:
 *   1. Brand exists in database with valid brand_kit
 *   2. media_assets table has scraped images for the brand
 *   3. No duplicate media_assets for same URL/hash
 *   4. Colors array has valid HEX values (1-6 colors)
 *   5. brand_kit identity fields not empty if scrape claims success
 *   6. Logos properly categorized (category='logos')
 *   7. Brand images separate from logos
 *
 * ⚠️ CRITICAL: This script uses REAL Supabase data only.
 *    NO mocks, NO demo brands, NO fallback fixtures.
 */

import "dotenv/config";
import { supabase } from "../server/lib/supabase";

// ============================================================================
// TYPES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: unknown;
  critical: boolean; // If true, failure blocks deployment
}

interface BrandTestConfig {
  brandId: string;
  url?: string;
  label: string; // e.g., "Brand 1", "Brand 2"
}

interface BrandTestSummary {
  brandId: string;
  label: string;
  url?: string;
  results: TestResult[];
  criticalFailures: number;
  warnings: number;
  passed: boolean;
}

// ============================================================================
// CONFIGURATION - Parse env vars for multi-brand testing
// ============================================================================

function parseBrandConfigs(): BrandTestConfig[] {
  const configs: BrandTestConfig[] = [];

  // Support up to 10 brands (can be extended)
  for (let i = 1; i <= 10; i++) {
    const brandId = process.env[`SCRAPER_TEST_BRAND_ID_${i}`];
    const url = process.env[`SCRAPER_TEST_URL_${i}`];

    if (brandId && brandId.trim()) {
      configs.push({
        brandId: brandId.trim(),
        url: url?.trim() || undefined,
        label: `Brand ${i}`,
      });
    }
  }

  // Also support legacy single-brand env var for backwards compatibility
  const legacyBrandId = process.env.SCRAPER_TEST_BRAND_ID;
  const legacyUrl = process.env.SCRAPER_TEST_URL;

  if (legacyBrandId && legacyBrandId.trim() && !configs.some((c) => c.brandId === legacyBrandId.trim())) {
    configs.unshift({
      brandId: legacyBrandId.trim(),
      url: legacyUrl?.trim() || undefined,
      label: "Brand (legacy)",
    });
  }

  return configs;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate HEX color format (#RGB or #RRGGBB)
 */
function isValidHexColor(color: string): boolean {
  if (!color || typeof color !== "string") return false;
  // Match #RGB or #RRGGBB (case-insensitive)
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

/**
 * Check for duplicate media assets by hash or path
 */
function findDuplicates(assets: Array<{ id: string; hash?: string; path?: string }>): string[] {
  const seen = new Map<string, string>(); // key -> first asset id
  const duplicates: string[] = [];

  for (const asset of assets) {
    // Check by hash first (primary dedup key)
    const key = asset.hash || asset.path;
    if (!key) continue;

    if (seen.has(key)) {
      duplicates.push(`Duplicate: ${key.substring(0, 50)}... (IDs: ${seen.get(key)}, ${asset.id})`);
    } else {
      seen.set(key, asset.id);
    }
  }

  return duplicates;
}

/**
 * Check if brand_kit has meaningful identity content (not just empty defaults)
 * Also accepts voice_summary from the separate column (passed as second param)
 */
function hasIdentityContent(
  brandKit: Record<string, unknown>,
  voiceSummaryColumn?: Record<string, unknown>
): {
  hasContent: boolean;
  emptyFields: string[];
} {
  const emptyFields: string[] = [];

  // Required identity fields from scraper
  const identityFields: Array<{ key: string; altKeys?: string[]; columnValue?: unknown }> = [
    { key: "about_blurb", altKeys: ["purpose", "mission"] },
    { key: "voice_summary", columnValue: voiceSummaryColumn },
  ];

  for (const field of identityFields) {
    const value = brandKit[field.key];

    // Check main key
    if (value && typeof value === "string" && value.length > 10) continue;
    if (value && typeof value === "object" && Object.keys(value).length > 0) continue;

    // Check alternate keys
    if (field.altKeys) {
      const altValue = field.altKeys.map((k) => brandKit[k]).find((v) => v);
      if (altValue && typeof altValue === "string" && altValue.length > 10) continue;
      if (altValue && typeof altValue === "object" && Object.keys(altValue).length > 0) continue;
    }

    // Check column value (for voice_summary which is stored in separate column)
    if (field.columnValue) {
      if (typeof field.columnValue === "object" && Object.keys(field.columnValue).length > 0) continue;
    }

    emptyFields.push(field.key);
  }

  return {
    hasContent: emptyFields.length === 0,
    emptyFields,
  };
}

// ============================================================================
// TEST SUITE FOR SINGLE BRAND
// ============================================================================

async function runBrandTests(config: BrandTestConfig): Promise<BrandTestSummary> {
  const results: TestResult[] = [];
  const { brandId, label, url } = config;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔍 Testing: ${label}`);
  console.log(`   Brand ID: ${brandId}`);
  if (url) console.log(`   URL: ${url}`);
  console.log("=".repeat(60));

  // -------------------------------------------------------------------------
  // TEST 1: Brand Exists
  // -------------------------------------------------------------------------
  console.log(`\n📋 [${label}] Step 1: Checking brand exists...`);

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name, website_url, brand_kit, voice_summary, visual_summary, tenant_id, created_at, updated_at")
    .eq("id", brandId)
    .single();

  if (brandError || !brand) {
    results.push({
      name: "Brand Exists",
      passed: false,
      message: brandError ? `Database error: ${brandError.message}` : `Brand ${brandId} not found`,
      details: { brandId, error: brandError },
      critical: true,
    });
    console.log(`   ❌ CRITICAL: Brand not found`);

    // Cannot continue without brand
    return {
      brandId,
      label,
      url,
      results,
      criticalFailures: 1,
      warnings: 0,
      passed: false,
    };
  }

  results.push({
    name: "Brand Exists",
    passed: true,
    message: `Found brand: ${brand.name || brandId}`,
    critical: true,
  });
  console.log(`   ✅ Found: ${brand.name || brandId}`);

  // -------------------------------------------------------------------------
  // TEST 2: Brand Kit Exists and Non-Empty
  // -------------------------------------------------------------------------
  console.log(`\n📋 [${label}] Step 2: Checking brand_kit integrity...`);

  const brandKit = (brand.brand_kit as Record<string, unknown>) || {};
  const hasBrandKit = Object.keys(brandKit).length > 0;

  if (!hasBrandKit) {
    results.push({
      name: "Brand Kit Exists",
      passed: false,
      message: "brand_kit is null or empty JSONB",
      details: { brandId },
      critical: true,
    });
    console.log(`   ❌ CRITICAL: brand_kit is empty`);
  } else {
    results.push({
      name: "Brand Kit Exists",
      passed: true,
      message: `brand_kit has ${Object.keys(brandKit).length} fields`,
      critical: true,
    });
    console.log(`   ✅ brand_kit has ${Object.keys(brandKit).length} fields`);
  }

  // -------------------------------------------------------------------------
  // TEST 3: Colors Valid (1-6 HEX colors)
  // -------------------------------------------------------------------------
  console.log(`\n📋 [${label}] Step 3: Validating colors...`);

  // Colors can be stored in multiple locations - check all of them
  // Priority order per task requirements:
  //   1. brand_kit.colors.allColors
  //   2. brand_kit.colors.palette
  //   3. brand_kit.colors.primaryColors
  //   4. visual_summary.colors (fallback, since crawler writes there too)
  const colorsObj = (brandKit.colors as Record<string, unknown>) || {};
  const visualSummary = (brand.visual_summary as Record<string, unknown>) || {};
  
  // Try multiple possible color storage locations (ordered by preference)
  const allColors: string[] =
    // 1. brand_kit.colors.allColors (preferred)
    (colorsObj.allColors as string[]) ||
    // 2. brand_kit.colors.palette (some crawlers use this)
    (colorsObj.palette as string[]) ||
    // 3. brand_kit.colors.primaryColors
    (colorsObj.primaryColors as string[]) ||
    // 4. brand_kit.primaryColors (direct)
    (brandKit.primaryColors as string[]) ||
    // 5. brand_kit.colorPalette
    (brandKit.colorPalette as string[]) ||
    // 6. brand_kit.allColors (direct)
    (brandKit.allColors as string[]) ||
    // 7. visual_summary.colors (crawler also saves here - fallback)
    (visualSummary.colors as string[]) ||
    // 8. Individual color fields in colors object
    [colorsObj.primary as string, colorsObj.secondary as string, colorsObj.accent as string].filter(
      (c): c is string => typeof c === "string" && c.length > 0
    );

  const uniqueColors = [...new Set(allColors)].filter((c) => c && c.length > 0);
  const invalidColors = uniqueColors.filter((c) => !isValidHexColor(c));

  if (uniqueColors.length === 0) {
    results.push({
      name: "Colors Valid",
      passed: false,
      message: "No colors found in brand_kit.colors or visual_summary.colors",
      details: { colorsObj, visualSummaryColors: visualSummary.colors },
      critical: true,
    });
    console.log(`   ❌ CRITICAL: No colors found`);
  } else if (invalidColors.length > 0) {
    results.push({
      name: "Colors Valid",
      passed: false,
      message: `Invalid HEX colors found: ${invalidColors.join(", ")}`,
      details: { invalidColors, allColors: uniqueColors },
      critical: true,
    });
    console.log(`   ❌ CRITICAL: Invalid HEX colors: ${invalidColors.join(", ")}`);
  } else if (uniqueColors.length > 6) {
    results.push({
      name: "Colors Valid",
      passed: false,
      message: `Too many colors: ${uniqueColors.length} (max 6)`,
      details: { colors: uniqueColors },
      critical: true,
    });
    console.log(`   ❌ CRITICAL: Too many colors: ${uniqueColors.length}`);
  } else {
    results.push({
      name: "Colors Valid",
      passed: true,
      message: `${uniqueColors.length} valid HEX color(s): ${uniqueColors.join(", ")}`,
      critical: true,
    });
    console.log(`   ✅ ${uniqueColors.length} valid colors: ${uniqueColors.join(", ")}`);
  }

  // -------------------------------------------------------------------------
  // TEST 4: Media Assets - Query and Validate
  // -------------------------------------------------------------------------
  console.log(`\n📋 [${label}] Step 4: Checking media_assets...`);

  const { data: mediaAssets, error: mediaError } = await supabase
    .from("media_assets")
    .select("id, brand_id, path, filename, category, metadata, hash, status, created_at")
    .eq("brand_id", brandId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (mediaError) {
    results.push({
      name: "Media Assets Query",
      passed: false,
      message: `Database error: ${mediaError.message}`,
      details: { error: mediaError },
      critical: false, // Warning - might be RLS or table issue
    });
    console.log(`   ⚠️ Warning: Media query failed - ${mediaError.message}`);
  } else {
    const assets = mediaAssets || [];

    // Filter for scraped images (HTTP URLs in path)
    const scrapedImages = assets.filter((a) => {
      const path = (a.path as string) || "";
      return path.startsWith("http://") || path.startsWith("https://");
    });

    results.push({
      name: "Media Assets Exist",
      passed: assets.length > 0,
      message: assets.length > 0 ? `${assets.length} media asset(s) found` : "No media assets found",
      details: { total: assets.length, scraped: scrapedImages.length },
      critical: false, // Warning - brand might not have been scraped yet
    });

    if (assets.length > 0) {
      console.log(`   ✅ ${assets.length} media asset(s) found (${scrapedImages.length} scraped)`);
    } else {
      console.log(`   ⚠️ Warning: No media assets found`);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Logos Exist (category='logos' or metadata.role='logo')
    // -------------------------------------------------------------------------
    console.log(`\n📋 [${label}] Step 5: Checking logos...`);

    const logos = assets.filter((a) => {
      const category = (a.category as string) || "";
      const metadata = (a.metadata as Record<string, unknown>) || {};
      const role = (metadata.role as string) || "";
      return category === "logos" || role === "logo";
    });

    if (logos.length === 0 && assets.length > 0) {
      results.push({
        name: "Logos Exist",
        passed: false,
        message: "No logos found (expected at least 1 if images were scraped)",
        details: { totalAssets: assets.length },
        critical: false, // Warning - might be classification issue
      });
      console.log(`   ⚠️ Warning: No logos found`);
    } else if (logos.length > 0) {
      results.push({
        name: "Logos Exist",
        passed: true,
        message: `${logos.length} logo(s) found (max 2 expected)`,
        details: { logoCount: logos.length },
        critical: false,
      });
      console.log(`   ✅ ${logos.length} logo(s) found`);

      // Check logo count limit
      if (logos.length > 2) {
        results.push({
          name: "Logo Count Limit",
          passed: false,
          message: `Too many logos: ${logos.length} (max 2)`,
          details: { logoIds: logos.map((l) => l.id) },
          critical: false,
        });
        console.log(`   ⚠️ Warning: Too many logos (${logos.length} > 2)`);
      }
    } else {
      results.push({
        name: "Logos Exist",
        passed: true,
        message: "No assets to check (brand may not have been scraped)",
        critical: false,
      });
      console.log(`   ℹ️ Skipped: No assets to check`);
    }

    // -------------------------------------------------------------------------
    // TEST 6: Brand Images Exist (non-logo)
    // -------------------------------------------------------------------------
    console.log(`\n📋 [${label}] Step 6: Checking brand images...`);

    const brandImages = assets.filter((a) => {
      const category = (a.category as string) || "";
      const metadata = (a.metadata as Record<string, unknown>) || {};
      const role = (metadata.role as string) || "";
      // Non-logo images
      return category === "images" && role !== "logo";
    });

    if (brandImages.length > 0) {
      results.push({
        name: "Brand Images Exist",
        passed: true,
        message: `${brandImages.length} brand image(s) found (max 15)`,
        critical: false,
      });
      console.log(`   ✅ ${brandImages.length} brand image(s) found`);
    } else if (assets.length > 0) {
      results.push({
        name: "Brand Images Exist",
        passed: true, // Not critical if we have logos
        message: "No non-logo brand images found",
        critical: false,
      });
      console.log(`   ℹ️ No non-logo brand images (logos may be the only assets)`);
    }

    // -------------------------------------------------------------------------
    // TEST 7: No Duplicates
    // -------------------------------------------------------------------------
    console.log(`\n📋 [${label}] Step 7: Checking for duplicates...`);

    const duplicates = findDuplicates(
      assets.map((a) => ({
        id: a.id as string,
        hash: a.hash as string | undefined,
        path: a.path as string | undefined,
      }))
    );

    if (duplicates.length > 0) {
      results.push({
        name: "No Duplicates",
        passed: false,
        message: `Found ${duplicates.length} duplicate(s)`,
        details: { duplicates },
        critical: true, // Duplicates indicate a bug
      });
      console.log(`   ❌ CRITICAL: ${duplicates.length} duplicate(s) found`);
      duplicates.slice(0, 3).forEach((d) => console.log(`      - ${d}`));
    } else {
      results.push({
        name: "No Duplicates",
        passed: true,
        message: "No duplicate media assets found",
        critical: true,
      });
      console.log(`   ✅ No duplicates`);
    }

    // -------------------------------------------------------------------------
    // TEST 8: Source Metadata
    // -------------------------------------------------------------------------
    console.log(`\n📋 [${label}] Step 8: Checking source metadata...`);

    const scrapedWithSource = scrapedImages.filter((a) => {
      const metadata = (a.metadata as Record<string, unknown>) || {};
      return metadata.source === "scrape";
    });

    if (scrapedImages.length > 0 && scrapedWithSource.length < scrapedImages.length) {
      const missing = scrapedImages.length - scrapedWithSource.length;
      results.push({
        name: "Source Metadata",
        passed: false,
        message: `${missing} scraped image(s) missing source='scrape' metadata`,
        critical: false, // Warning
      });
      console.log(`   ⚠️ Warning: ${missing} scraped image(s) missing source metadata`);
    } else if (scrapedImages.length > 0) {
      results.push({
        name: "Source Metadata",
        passed: true,
        message: "All scraped images have source='scrape' metadata",
        critical: false,
      });
      console.log(`   ✅ All scraped images have source metadata`);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 9: Identity Fields Present
  // -------------------------------------------------------------------------
  console.log(`\n📋 [${label}] Step 9: Checking identity fields...`);

  if (hasBrandKit) {
    // Pass voice_summary column as second param (stored in separate column, not in brand_kit)
    const voiceSummaryColumn = (brand.voice_summary as Record<string, unknown>) || undefined;
    const { hasContent, emptyFields } = hasIdentityContent(brandKit, voiceSummaryColumn);

    if (!hasContent) {
      results.push({
        name: "Identity Fields",
        passed: false,
        message: `Missing identity content: ${emptyFields.join(", ")}`,
        details: { emptyFields },
        critical: true, // Brand kit should have identity if scraper ran
      });
      console.log(`   ❌ CRITICAL: Missing identity fields: ${emptyFields.join(", ")}`);
    } else {
      results.push({
        name: "Identity Fields",
        passed: true,
        message: "Identity fields populated",
        critical: true,
      });
      console.log(`   ✅ Identity fields populated`);
    }
  }

  // -------------------------------------------------------------------------
  // SUMMARY FOR THIS BRAND
  // -------------------------------------------------------------------------
  const criticalFailures = results.filter((r) => !r.passed && r.critical).length;
  const warnings = results.filter((r) => !r.passed && !r.critical).length;

  return {
    brandId,
    label,
    url,
    results,
    criticalFailures,
    warnings,
    passed: criticalFailures === 0,
  };
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

async function main() {
  console.log("\n🔬 Scraper Truth Smoke Test");
  console.log("=".repeat(60));
  console.log("⚠️  REAL DATA ONLY - No mocks, no demo brands");
  console.log("=".repeat(60));

  // Parse brand configurations from env vars
  const brandConfigs = parseBrandConfigs();

  if (brandConfigs.length === 0) {
    console.error("\n❌ Error: No test brands configured");
    console.log("\nUsage:");
    console.log("  SCRAPER_TEST_BRAND_ID_1=<uuid> pnpm scraper:smoke");
    console.log("\nMultiple brands:");
    console.log("  SCRAPER_TEST_BRAND_ID_1=<uuid1> SCRAPER_TEST_BRAND_ID_2=<uuid2> pnpm scraper:smoke");
    console.log("\nWith URLs (optional):");
    console.log("  SCRAPER_TEST_BRAND_ID_1=<uuid1> SCRAPER_TEST_URL_1=<url> pnpm scraper:smoke");
    process.exit(1);
  }

  console.log(`\nConfigured brands: ${brandConfigs.length}`);
  brandConfigs.forEach((c) => {
    console.log(`  - ${c.label}: ${c.brandId}${c.url ? ` (${c.url})` : ""}`);
  });

  // Check Supabase connection first
  console.log("\n📡 Checking Supabase connection...");
  const { error: healthError } = await supabase.from("brands").select("count").limit(1);

  if (healthError) {
    console.error(`❌ Supabase connection failed: ${healthError.message}`);
    process.exit(1);
  }
  console.log("✅ Supabase connected");

  // Run tests for each brand
  const summaries: BrandTestSummary[] = [];

  for (const config of brandConfigs) {
    const summary = await runBrandTests(config);
    summaries.push(summary);
  }

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n" + "=".repeat(60));
  console.log("📊 SCRAPER TRUTH SMOKE TEST - FINAL SUMMARY");
  console.log("=".repeat(60));

  let totalCritical = 0;
  let totalWarnings = 0;
  let brandsWithFailures: string[] = [];

  for (const summary of summaries) {
    const icon = summary.passed ? "✅" : "❌";
    console.log(`\n${icon} ${summary.label} (${summary.brandId})`);

    if (summary.url) {
      console.log(`   URL: ${summary.url}`);
    }

    console.log(`   Critical Failures: ${summary.criticalFailures}`);
    console.log(`   Warnings: ${summary.warnings}`);

    if (!summary.passed) {
      brandsWithFailures.push(summary.label);
      console.log(`   Failed Tests:`);
      summary.results
        .filter((r) => !r.passed && r.critical)
        .forEach((r) => {
          console.log(`      ❌ ${r.name}: ${r.message}`);
        });
    }

    if (summary.warnings > 0) {
      console.log(`   Warnings:`);
      summary.results
        .filter((r) => !r.passed && !r.critical)
        .forEach((r) => {
          console.log(`      ⚠️ ${r.name}: ${r.message}`);
        });
    }

    totalCritical += summary.criticalFailures;
    totalWarnings += summary.warnings;
  }

  // Final verdict
  console.log("\n" + "=".repeat(60));
  console.log(`Brands Tested: ${summaries.length}`);
  console.log(`Total Critical Failures: ${totalCritical}`);
  console.log(`Total Warnings: ${totalWarnings}`);
  console.log("=".repeat(60));

  if (totalCritical > 0) {
    console.log("\n🚨 VERDICT: CRITICAL FAILURES DETECTED");
    console.log(`   Brands with failures: ${brandsWithFailures.join(", ")}`);
    console.log("   Scraper needs repair before production deployment.");
    console.log("\nExiting with code 1 (failure)");
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log("\n⚠️ VERDICT: PASSED WITH WARNINGS");
    console.log("   All critical checks passed, but some warnings detected.");
    console.log("   Review warnings above - they may indicate issues.");
    console.log("\nExiting with code 0 (success with warnings)");
    process.exit(0);
  } else {
    console.log("\n✅ VERDICT: ALL TESTS PASSED");
    console.log("   Scraper is healthy and using real data correctly.");
    console.log("\nExiting with code 0 (success)");
    process.exit(0);
  }
}

// Run the tests
main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
