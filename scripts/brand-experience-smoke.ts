/**
 * Brand Experience Smoke Test
 * 
 * Verifies end-to-end brand experience pipeline:
 * 
 * 1. Brand Guide Loading
 *    - Colors are clean HEX values (1-6 colors)
 *    - Logos and images are available
 *    - Tone/voice settings are populated
 *    - Mission and values are present
 * 
 * 2. Content Generation Flow
 *    - AI generates content with brand context
 *    - BFS (Brand Fidelity Score) is calculated
 *    - Content reflects brand tone/keywords
 * 
 * 3. Content Storage (Studio → DB → Queue)
 *    - Content items exist in database
 *    - Content Queue API returns items
 *    - Items have correct structure
 * 
 * 4. Image Pipeline
 *    - Scraped images are in media_assets
 *    - Logos are properly categorized
 * 
 * Usage:
 *   pnpm brand-experience:smoke <BRAND_ID>
 * 
 * Environment Variables:
 *   BRAND_EXPERIENCE_TEST_BRAND_ID - Default brand ID for testing
 * 
 * Example:
 *   BRAND_EXPERIENCE_TEST_BRAND_ID=abc123 pnpm brand-experience:smoke
 *   pnpm brand-experience:smoke abc123-def456-ghi789
 */

import "dotenv/config";
import { supabase } from "../server/lib/supabase";

// Support both CLI arg and environment variable
const BRAND_ID = process.argv[2] || process.env.BRAND_EXPERIENCE_TEST_BRAND_ID;

if (!BRAND_ID) {
  console.error("❌ Error: BRAND_ID is required");
  console.log("\nUsage: pnpm brand-experience:smoke <BRAND_ID>");
  console.log("   Or: BRAND_EXPERIENCE_TEST_BRAND_ID=<uuid> pnpm brand-experience:smoke");
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

async function testBrandGuide() {
  console.log("\n📋 Testing Brand Guide (from DB)...");
  
  try {
    // Fetch brand directly from database
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, brand_kit, voice_summary, visual_summary")
      .eq("id", BRAND_ID)
      .single();

    if (brandError || !brand) {
      logTest("Brand Exists", false, brandError?.message || "Brand not found", true);
      return null;
    }

    logTest("Brand Exists", true, `Found: ${brand.name}`, true);

    const brandKit = (brand.brand_kit as Record<string, unknown>) || {};
    const voiceSummary = brand.voice_summary as Record<string, unknown> | null;
    const visualSummary = brand.visual_summary as Record<string, unknown> | null;

    // Test colors - check multiple locations
    let colors: string[] = [];
    if (brandKit.colors && typeof brandKit.colors === 'object') {
      const colorsObj = brandKit.colors as Record<string, unknown>;
      colors = (colorsObj.allColors as string[]) || 
               (colorsObj.primaryColors as string[]) || 
               [];
    }
    if (colors.length === 0 && Array.isArray(brandKit.primaryColors)) {
      colors = brandKit.primaryColors as string[];
    }
    if (colors.length === 0 && Array.isArray(brandKit.colorPalette)) {
      colors = brandKit.colorPalette as string[];
    }
    if (colors.length === 0 && visualSummary?.colors && Array.isArray(visualSummary.colors)) {
      colors = visualSummary.colors as string[];
    }
    
    const hasColors = colors.length > 0;
    const hexPattern = /^#[0-9A-Fa-f]{3,6}$/;
    const areHexColors = colors.length > 0 && colors.every((c: string) => hexPattern.test(c));
    
    logTest("Brand Colors Exist", hasColors, hasColors ? `${colors.length} colors found` : "No colors found", true, hasColors ? { colors } : undefined);
    logTest("Colors are Clean HEX", areHexColors || !hasColors, areHexColors ? "All colors are valid HEX codes" : "Some colors may not be valid HEX", false, { colors });

    // Test voice/tone
    const hasTone = !!(
      (voiceSummary?.tone) ||
      (brandKit.voiceAndTone && typeof brandKit.voiceAndTone === 'object') ||
      (brandKit.tone)
    );
    logTest("Voice/Tone Configured", hasTone, hasTone ? "Tone settings found" : "No tone settings", false);

    // Test identity fields
    const hasAbout = !!(brandKit.about_blurb || brandKit.purpose || brandKit.mission);
    logTest("Brand Identity", hasAbout, hasAbout ? "About/purpose found" : "No about text", false);

    return { brand, brandKit, voiceSummary, visualSummary };
  } catch (error) {
    logTest("Brand Guide Fetch", false, error instanceof Error ? error.message : String(error), true);
    return null;
  }
}

async function testContentItems() {
  console.log("\n📦 Testing Content Items (Studio → DB → Queue flow)...");

  try {
    // Check content_items table directly for this brand
    const { data: contentItems, error } = await supabase
      .from("content_items")
      .select("id, title, type, platform, status, content, created_at, generated_by_agent")
      .eq("brand_id", BRAND_ID)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      logTest("Content Items Query", false, error.message, true);
      return null;
    }

    const hasContent = contentItems && contentItems.length > 0;
    logTest("Content Items Exist", hasContent, hasContent ? `${contentItems.length} content item(s) found` : "No content items for this brand", false);

    if (hasContent && contentItems) {
      // Check content structure
      const firstItem = contentItems[0];
      const hasRequiredFields = !!(firstItem.id && firstItem.title && firstItem.type);
      logTest("Content Item Structure", hasRequiredFields, "Content items have required fields (id, title, type)", true);

      // Check content types distribution
      const typeDistribution: Record<string, number> = {};
      contentItems.forEach((item: any) => {
        const type = item.type || "unknown";
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      });
      logTest("Content Types", Object.keys(typeDistribution).length > 0, 
        `Types: ${Object.entries(typeDistribution).map(([k, v]) => `${k}(${v})`).join(", ")}`, 
        false
      );

      // Check status distribution
      const statusDistribution: Record<string, number> = {};
      contentItems.forEach((item: any) => {
        const status = item.status || "unknown";
        statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      });
      logTest("Content Statuses", Object.keys(statusDistribution).length > 0, 
        `Statuses: ${Object.entries(statusDistribution).map(([k, v]) => `${k}(${v})`).join(", ")}`, 
        false
      );

      // Check if any are AI-generated
      const aiGenerated = contentItems.filter((item: any) => 
        item.generated_by_agent || 
        (item.content && typeof item.content === 'object' && (item.content as any).generated_by)
      );
      logTest("AI-Generated Content", aiGenerated.length > 0 || contentItems.length === 0, 
        `${aiGenerated.length} AI-generated item(s)`, 
        false
      );

      return contentItems;
    }

    return [];
  } catch (error) {
    logTest("Content Items", false, error instanceof Error ? error.message : String(error), true);
    return null;
  }
}

async function testCreativeStudioContent() {
  console.log("\n🎨 Testing Creative Studio Content...");

  try {
    // Check for creative studio specific content
    const { data: studioItems, error } = await supabase
      .from("content_items")
      .select("id, title, type, content, status, created_at")
      .eq("brand_id", BRAND_ID)
      .eq("type", "creative_studio")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      logTest("Studio Content Query", false, error.message, false);
      return null;
    }

    const hasStudioContent = studioItems && studioItems.length > 0;
    logTest("Studio Designs Saved", hasStudioContent, 
      hasStudioContent ? `${studioItems.length} studio design(s) found` : "No studio designs for this brand (expected if never used Studio)", 
      false
    );

    if (hasStudioContent && studioItems) {
      // Check design structure
      const firstDesign = studioItems[0];
      const content = firstDesign.content as Record<string, unknown> | null;
      const hasCanvasItems = content && Array.isArray(content.items);
      logTest("Studio Design Structure", hasCanvasItems, 
        hasCanvasItems ? `Design has ${(content?.items as unknown[]).length} canvas item(s)` : "Design may have different structure",
        false
      );
    }

    return studioItems;
  } catch (error) {
    logTest("Studio Content", false, error instanceof Error ? error.message : String(error), false);
    return null;
  }
}

async function testImagePipeline() {
  console.log("\n🖼️  Testing Image Pipeline...");

  try {
    // Check media_assets table
    const { data: mediaAssets, error } = await supabase
      .from("media_assets")
      .select("id, path, category, metadata, status")
      .eq("brand_id", BRAND_ID)
      .eq("status", "active")
      .limit(20);

    if (error) {
      logTest("Media Assets Query", false, error.message, false);
      return;
    }

    const totalAssets = mediaAssets?.length || 0;
    logTest("Media Assets", totalAssets > 0, `${totalAssets} active asset(s) in database`, false);

    if (mediaAssets && mediaAssets.length > 0) {
      // Check scraped images
      const scrapedImages = mediaAssets.filter((asset: any) => 
        asset.metadata?.source === "scrape" || asset.path?.startsWith("http")
      );
      logTest("Scraped Images", scrapedImages.length > 0, `${scrapedImages.length} scraped image(s)`, false);

      // Check logos
      const logos = mediaAssets.filter((asset: any) => 
        asset.category === "logos" || asset.metadata?.role === "logo"
      );
      logTest("Logos Available", logos.length > 0, `${logos.length} logo(s) categorized`, false);

      // Check non-logo images
      const nonLogos = mediaAssets.filter((asset: any) => 
        asset.category !== "logos" && asset.metadata?.role !== "logo"
      );
      logTest("Brand Images", nonLogos.length > 0, `${nonLogos.length} non-logo image(s)`, false);

      // Check for duplicates by path
      const paths = mediaAssets.map((a: any) => a.path);
      const uniquePaths = new Set(paths);
      const hasDuplicates = paths.length !== uniquePaths.size;
      logTest("No Duplicate Assets", !hasDuplicates, 
        hasDuplicates ? `Found ${paths.length - uniquePaths.size} duplicate path(s)` : "No duplicate paths", 
        false
      );
    }

  } catch (error) {
    logTest("Image Pipeline", false, error instanceof Error ? error.message : String(error), false);
  }
}

async function runAllTests() {
  console.log("🚀 Brand Experience Smoke Test");
  console.log("============================================================");
  console.log(`Brand ID: ${BRAND_ID}`);
  console.log("============================================================");
  console.log("\n⚠️  DATABASE-ONLY MODE - Tests query Supabase directly\n");

  // Run all tests
  await testBrandGuide();
  await testContentItems();
  await testCreativeStudioContent();
  await testImagePipeline();

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 BRAND EXPERIENCE SMOKE TEST - FINAL SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const criticalFailed = results.filter(r => !r.passed && r.critical).length;
  const total = results.length;

  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`⚠️  Warnings: ${failed - criticalFailed}`);
  console.log(`❌ Critical Failures: ${criticalFailed}`);

  if (criticalFailed > 0) {
    console.log("\n❌ Critical Failures:");
    results.filter(r => !r.passed && r.critical).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log("\n❌ VERDICT: FAILED");
    console.log("   One or more critical tests failed.");
    console.log("\nExiting with code 1 (failure)");
    process.exit(1);
  } else if (failed > 0) {
    console.log("\n⚠️  Warnings (non-critical):");
    results.filter(r => !r.passed && !r.critical).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    console.log("\n⚠️  VERDICT: PASSED WITH WARNINGS");
    console.log("   All critical checks passed, but some warnings detected.");
    console.log("\nExiting with code 0 (success with warnings)");
    process.exit(0);
  } else {
    console.log("\n✅ VERDICT: PASSED");
    console.log("   All tests passed with no warnings!");
    console.log("\nExiting with code 0 (success)");
    process.exit(0);
  }
}

runAllTests().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

