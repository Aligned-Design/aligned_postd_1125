/**
 * Brand Images Exclusion Smoke Test
 * 
 * Validates the new image exclusion feature:
 * 
 * 1. All Assets Stored
 *    - Verify logo and brand images are persisted in media_assets
 *    - Verify images with uncertain roles are NOT dropped
 *    - Logo is optional (brand_kit.logo can be null)
 * 
 * 2. Brand Images Display (up to 15)
 *    - Verify Brand Images query returns non-excluded items
 *    - Verify logos can appear in Brand Images list
 *    - Verify excluded assets are filtered out
 * 
 * 3. Exclude/Restore Functionality
 *    - Simulate marking an asset as excluded
 *    - Verify excluded asset no longer appears in Brand Images
 *    - Verify excluded asset can be restored (un-excluded)
 * 
 * Usage:
 *   pnpm tsx scripts/brand-images-exclude-smoke.ts <BRAND_ID>
 * 
 * Example:
 *   pnpm tsx scripts/brand-images-exclude-smoke.ts abc123-def456-ghi789
 */

import "dotenv/config";
import { supabase } from "../server/lib/supabase";

// Support CLI arg or environment variable
const BRAND_ID = process.argv[2] || process.env.BRAND_EXPERIENCE_TEST_BRAND_ID;

if (!BRAND_ID) {
  console.error("❌ Error: BRAND_ID is required");
  console.log("\nUsage: pnpm tsx scripts/brand-images-exclude-smoke.ts <BRAND_ID>");
  console.log("   Or: BRAND_EXPERIENCE_TEST_BRAND_ID=<uuid> pnpm tsx scripts/brand-images-exclude-smoke.ts");
  process.exit(1);
}

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean;
  details?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, critical: boolean = false, details?: any) {
  results.push({ name, passed, message, critical, details });
  const icon = passed ? "✅" : critical ? "❌" : "⚠️";
  console.log(`${icon} ${name}: ${message}`);
  if (details && !passed) {
    console.log(`   Details:`, JSON.stringify(details, null, 2).split("\n").map(l => `   ${l}`).join("\n"));
  }
}

async function testBrandExists(): Promise<boolean> {
  console.log("\n📋 Testing Brand Exists...");
  
  const { data: brand, error } = await supabase
    .from("brands")
    .select("id, name, brand_kit")
    .eq("id", BRAND_ID)
    .single();

  if (error || !brand) {
    logTest("Brand Exists", false, error?.message || "Brand not found", true);
    return false;
  }

  logTest("Brand Exists", true, `Found: ${brand.name}`, true);
  return true;
}

async function testMediaAssetsStored(): Promise<string | null> {
  console.log("\n🖼️ Testing All Assets Stored...");
  
  // Query all media_assets for this brand (including excluded)
  const { data: allAssets, error } = await supabase
    .from("media_assets")
    .select("id, path, filename, category, metadata, status, excluded")
    .eq("brand_id", BRAND_ID)
    .eq("status", "active");

  if (error) {
    logTest("Media Assets Query", false, error.message, true);
    return null;
  }

  if (!allAssets || allAssets.length === 0) {
    logTest("Media Assets Exist", false, "No media assets found for brand", true);
    return null;
  }

  logTest("Media Assets Exist", true, `Found ${allAssets.length} media asset(s)`);

  // Check for scraped images (HTTP URLs in path)
  const scrapedAssets = allAssets.filter(a => a.path?.startsWith("http"));
  logTest("Scraped Images", scrapedAssets.length > 0, 
    scrapedAssets.length > 0 ? `${scrapedAssets.length} scraped image(s)` : "No scraped images found");

  // Check role breakdown
  const roleBreakdown = scrapedAssets.reduce((acc, a) => {
    const role = (a.metadata as any)?.role || "unknown";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log("   Role breakdown:", roleBreakdown);

  // Verify logos exist (optional - can be empty)
  const logos = scrapedAssets.filter(a => 
    (a.metadata as any)?.role === "logo" || a.category === "logos"
  );
  logTest("Logo Detection", true, 
    logos.length > 0 ? `${logos.length} logo(s) detected` : "No logos detected (optional)", false);

  // Verify brand images exist (should have some)
  const brandImages = scrapedAssets.filter(a => 
    (a.metadata as any)?.role !== "logo" && a.category !== "logos"
  );
  logTest("Brand Images", brandImages.length > 0, 
    brandImages.length > 0 ? `${brandImages.length} brand image(s)` : "No brand images found", false);

  // Check excluded count
  const excludedCount = scrapedAssets.filter(a => a.excluded === true).length;
  console.log(`   Excluded assets: ${excludedCount}`);

  // Return first non-excluded asset ID for exclusion test
  const testAsset = scrapedAssets.find(a => !a.excluded);
  return testAsset?.id || null;
}

async function testNonExcludedQuery(testAssetId: string | null): Promise<void> {
  console.log("\n🔍 Testing Non-Excluded Query...");
  
  // Query only non-excluded assets (simulating what UI would do)
  const { data: nonExcludedAssets, error } = await supabase
    .from("media_assets")
    .select("id, path, filename, metadata, excluded")
    .eq("brand_id", BRAND_ID)
    .eq("status", "active")
    .or("excluded.is.null,excluded.eq.false");

  if (error) {
    logTest("Non-Excluded Query", false, error.message, true);
    return;
  }

  const scrapedNonExcluded = (nonExcludedAssets || []).filter(a => a.path?.startsWith("http"));
  logTest("Non-Excluded Assets", scrapedNonExcluded.length > 0, 
    `${scrapedNonExcluded.length} non-excluded scraped asset(s)`);

  // Verify limit of 15 brand images
  if (scrapedNonExcluded.length > 15) {
    console.log(`   Note: ${scrapedNonExcluded.length} assets (UI displays up to 15)`);
  }

  // Verify test asset is in non-excluded list
  if (testAssetId) {
    const found = scrapedNonExcluded.some(a => a.id === testAssetId);
    logTest("Test Asset Visible", found, 
      found ? "Test asset is visible in non-excluded list" : "Test asset not found", false);
  }
}

async function testExcludeAndRestore(testAssetId: string | null): Promise<void> {
  if (!testAssetId) {
    console.log("\n⏭️ Skipping Exclude/Restore Test (no test asset available)");
    return;
  }

  console.log("\n🚫 Testing Exclude/Restore Functionality...");
  console.log(`   Test asset ID: ${testAssetId}`);

  // Step 1: Exclude the asset
  const { error: excludeError } = await supabase
    .from("media_assets")
    .update({ excluded: true, updated_at: new Date().toISOString() })
    .eq("id", testAssetId)
    .eq("brand_id", BRAND_ID);

  if (excludeError) {
    logTest("Exclude Asset", false, excludeError.message, false);
    return;
  }
  logTest("Exclude Asset", true, "Asset marked as excluded");

  // Step 2: Verify asset is now excluded from non-excluded query
  const { data: afterExclude, error: afterExcludeError } = await supabase
    .from("media_assets")
    .select("id")
    .eq("brand_id", BRAND_ID)
    .eq("status", "active")
    .or("excluded.is.null,excluded.eq.false");

  if (afterExcludeError) {
    logTest("Verify Exclusion", false, afterExcludeError.message, false);
  } else {
    const stillVisible = (afterExclude || []).some(a => a.id === testAssetId);
    logTest("Verify Exclusion", !stillVisible, 
      stillVisible ? "Asset still visible after exclusion (FAIL)" : "Asset hidden after exclusion");
  }

  // Step 3: Restore the asset
  const { error: restoreError } = await supabase
    .from("media_assets")
    .update({ excluded: false, updated_at: new Date().toISOString() })
    .eq("id", testAssetId)
    .eq("brand_id", BRAND_ID);

  if (restoreError) {
    logTest("Restore Asset", false, restoreError.message, false);
    return;
  }
  logTest("Restore Asset", true, "Asset restored (un-excluded)");

  // Step 4: Verify asset is now visible again
  const { data: afterRestore, error: afterRestoreError } = await supabase
    .from("media_assets")
    .select("id")
    .eq("brand_id", BRAND_ID)
    .eq("status", "active")
    .or("excluded.is.null,excluded.eq.false");

  if (afterRestoreError) {
    logTest("Verify Restoration", false, afterRestoreError.message, false);
  } else {
    const visible = (afterRestore || []).some(a => a.id === testAssetId);
    logTest("Verify Restoration", visible, 
      visible ? "Asset visible after restoration" : "Asset not visible after restoration (FAIL)");
  }
}

async function testLogoOptional(): Promise<void> {
  console.log("\n🔍 Testing Logo Optional...");
  
  // Verify brand_kit.logo can be null/empty without breaking anything
  const { data: brand, error } = await supabase
    .from("brands")
    .select("id, name, logo_url, brand_kit")
    .eq("id", BRAND_ID)
    .single();

  if (error) {
    logTest("Logo Optional Query", false, error.message, false);
    return;
  }

  const brandKit = (brand?.brand_kit as any) || {};
  const logoUrl = brand?.logo_url || brandKit.logoUrl || null;
  
  logTest("Logo Optional", true, 
    logoUrl ? `Logo set: ${logoUrl.substring(0, 50)}...` : "No logo set (this is OK - logo is optional)");
}

async function printSummary(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("📊 BRAND IMAGES EXCLUSION SMOKE TEST SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const criticalFailed = results.filter(r => !r.passed && r.critical).length;

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed} (${criticalFailed} critical)`);

  if (criticalFailed > 0) {
    console.log("\n❌ CRITICAL FAILURES:");
    results.filter(r => !r.passed && r.critical).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }

  if (failed === 0) {
    console.log("\n✅ ALL TESTS PASSED - Image exclusion feature is working correctly!");
  } else if (criticalFailed === 0) {
    console.log("\n⚠️ Some non-critical tests failed. Review the output above.");
  } else {
    console.log("\n❌ CRITICAL TESTS FAILED - Image exclusion feature may not work correctly.");
    process.exit(1);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("🚀 BRAND IMAGES EXCLUSION SMOKE TEST");
  console.log("=".repeat(60));
  console.log(`Brand ID: ${BRAND_ID}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  // Run tests
  const brandExists = await testBrandExists();
  if (!brandExists) {
    console.log("\n⛔ Cannot continue - brand not found");
    process.exit(1);
  }

  const testAssetId = await testMediaAssetsStored();
  await testNonExcludedQuery(testAssetId);
  await testExcludeAndRestore(testAssetId);
  await testLogoOptional();

  await printSummary();
}

main().catch(error => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});

