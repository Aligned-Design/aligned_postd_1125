#!/usr/bin/env tsx
/**
 * Brand Kit Backfill Script
 *
 * Finds brands with missing or empty brand_kit/colors and re-runs
 * the brand kit pipeline to populate them.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-brand-kit.ts
 *
 *   # Dry run (no changes):
 *   DRY_RUN=true pnpm tsx scripts/backfill-brand-kit.ts
 *
 *   # Limit to N brands:
 *   LIMIT=5 pnpm tsx scripts/backfill-brand-kit.ts
 *
 *   # Specific brand ID:
 *   BRAND_ID=<uuid> pnpm tsx scripts/backfill-brand-kit.ts
 *
 * What It Does:
 *   1. Finds brands where:
 *      - brand_kit IS NULL or empty {}
 *      - OR brand_kit.colors is missing/empty
 *   2. For each brand with a valid website_url:
 *      - Extracts colors from the website
 *      - Generates brand kit with AI
 *      - Updates brands.brand_kit in database
 *   3. Logs summary of fixed/skipped brands
 *
 * IMPORTANT:
 *   - Uses existing crawler helpers (extractColors, generateBrandKit)
 *   - Does NOT crawl full pages (uses existing crawl results if available)
 *   - Does NOT modify RLS policies or schema
 */

import "dotenv/config";
import { supabase } from "../server/lib/supabase";
import {
  extractColors,
  generateBrandKit,
  crawlWebsite,
  extractBrandNameFromUrl,
  extractIndustryFromContent,
} from "../server/workers/brand-crawler";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DRY_RUN = process.env.DRY_RUN === "true";
const LIMIT = parseInt(process.env.LIMIT || "0", 10) || 0; // 0 = no limit
const SPECIFIC_BRAND_ID = process.env.BRAND_ID?.trim();

// ============================================================================
// TYPES
// ============================================================================

interface BrandRow {
  id: string;
  name: string | null;
  website_url: string | null;
  brand_kit: Record<string, unknown> | null;
  visual_summary: Record<string, unknown> | null;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

interface BackfillResult {
  brandId: string;
  brandName: string;
  status: "fixed" | "skipped" | "error";
  reason?: string;
  colorsFound?: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function hasMissingBrandKit(brand: BrandRow): boolean {
  const brandKit = brand.brand_kit;
  if (!brandKit || typeof brandKit !== "object") return true;
  if (Object.keys(brandKit).length === 0) return true;
  return false;
}

function hasMissingColors(brand: BrandRow): boolean {
  const brandKit = brand.brand_kit;
  if (!brandKit || typeof brandKit !== "object") return true;

  // Check brand_kit.colors
  const colors = (brandKit as Record<string, unknown>).colors as Record<string, unknown> | undefined;
  if (!colors || typeof colors !== "object") return true;

  // Check for allColors array
  const allColors = (colors.allColors as string[]) || [];
  const primaryColors = (colors.primaryColors as string[]) || [];
  const colorPalette = (brandKit.colorPalette as string[]) || [];

  // If any color array has valid entries, we have colors
  const hasAnyColors =
    allColors.length > 0 || primaryColors.length > 0 || colorPalette.length > 0;

  return !hasAnyColors;
}

function isValidUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ============================================================================
// MAIN BACKFILL LOGIC
// ============================================================================

async function backfillBrand(brand: BrandRow): Promise<BackfillResult> {
  const brandName = brand.name || "Unknown";
  const websiteUrl = brand.website_url;

  console.log(`\n📦 Processing: ${brandName} (${brand.id})`);
  console.log(`   URL: ${websiteUrl || "(none)"}`);

  // Check if we have a valid website URL
  if (!isValidUrl(websiteUrl)) {
    console.log(`   ⏭️  Skipped: No valid website URL`);
    return {
      brandId: brand.id,
      brandName,
      status: "skipped",
      reason: "No valid website_url",
    };
  }

  if (DRY_RUN) {
    console.log(`   🔍 DRY RUN: Would extract colors from ${websiteUrl}`);
    return {
      brandId: brand.id,
      brandName,
      status: "skipped",
      reason: "Dry run mode",
    };
  }

  try {
    // Step 1: Extract colors from website
    console.log(`   🎨 Extracting colors...`);
    const colors = await extractColors(websiteUrl!);

    if (!colors || !colors.allColors || colors.allColors.length === 0) {
      console.log(`   ⚠️  No colors extracted from website`);
      return {
        brandId: brand.id,
        brandName,
        status: "error",
        reason: "No colors extracted",
        colorsFound: 0,
      };
    }

    console.log(`   ✅ Found ${colors.allColors.length} colors: ${colors.allColors.join(", ")}`);

    // Step 2: Try to crawl and generate full brand kit (optional, may fail)
    let aiBrandKit: Record<string, unknown> | null = null;
    try {
      console.log(`   🕸️  Crawling website...`);
      const crawlResults = await crawlWebsite(websiteUrl!);
      
      if (crawlResults && crawlResults.length > 0) {
        const brandNameFromUrl = extractBrandNameFromUrl(websiteUrl!);
        const industry = extractIndustryFromContent(crawlResults);
        
        console.log(`   🤖 Generating AI brand kit...`);
        aiBrandKit = await generateBrandKit(crawlResults, colors, websiteUrl!, brandNameFromUrl, industry);
        console.log(`   ✅ AI brand kit generated`);
      }
    } catch (crawlError) {
      console.log(`   ⚠️  Crawl/AI generation failed (continuing with colors only):`, 
        crawlError instanceof Error ? crawlError.message : String(crawlError));
      // Continue without AI brand kit - we'll at least save colors
    }

    // Step 3: Build brand_kit update
    const colorPalette = {
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      confidence: colors.confidence || 0,
      primaryColors: colors.primaryColors || (colors.primary ? [colors.primary] : []),
      secondaryColors: colors.secondaryColors || 
        (colors.secondary && colors.accent ? [colors.secondary, colors.accent] : 
          colors.secondary ? [colors.secondary] : 
          colors.accent ? [colors.accent] : []),
      allColors: colors.allColors || [
        colors.primary,
        colors.secondary,
        colors.accent,
        ...(colors.primaryColors || []),
        ...(colors.secondaryColors || []),
      ].filter((c): c is string => !!c).slice(0, 6),
    };

    // Merge with existing brand_kit or AI brand kit
    const existingBrandKit = (brand.brand_kit as Record<string, unknown>) || {};
    const newBrandKit = aiBrandKit ? {
      ...existingBrandKit,
      ...aiBrandKit,
      colors: colorPalette,
      // Preserve existing identity fields if AI didn't provide them
      purpose: (aiBrandKit as any).about_blurb || existingBrandKit.purpose || "",
      about_blurb: (aiBrandKit as any).about_blurb || existingBrandKit.about_blurb || "",
    } : {
      ...existingBrandKit,
      colors: colorPalette,
      colorPalette: colorPalette.allColors,
      primaryColors: colorPalette.primaryColors,
      secondaryColors: colorPalette.secondaryColors,
    };

    // Step 4: Update database
    console.log(`   💾 Saving to database...`);
    const { error: updateError } = await supabase
      .from("brands")
      .update({
        brand_kit: newBrandKit,
        visual_summary: {
          ...(brand.visual_summary || {}),
          colors: colorPalette.allColors,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", brand.id);

    if (updateError) {
      console.log(`   ❌ Database update failed: ${updateError.message}`);
      return {
        brandId: brand.id,
        brandName,
        status: "error",
        reason: `DB update failed: ${updateError.message}`,
        colorsFound: colorPalette.allColors.length,
      };
    }

    console.log(`   ✅ Brand kit updated with ${colorPalette.allColors.length} colors`);
    return {
      brandId: brand.id,
      brandName,
      status: "fixed",
      colorsFound: colorPalette.allColors.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ Error: ${errorMessage}`);
    return {
      brandId: brand.id,
      brandName,
      status: "error",
      reason: errorMessage,
    };
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║           BRAND KIT BACKFILL SCRIPT                            ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`Mode: ${DRY_RUN ? "🔍 DRY RUN (no changes)" : "💾 LIVE (will modify database)"}`);
  if (LIMIT > 0) console.log(`Limit: ${LIMIT} brands`);
  if (SPECIFIC_BRAND_ID) console.log(`Specific Brand: ${SPECIFIC_BRAND_ID}`);
  console.log("");

  // Step 1: Find brands needing backfill
  console.log("🔍 Finding brands with missing brand_kit or colors...\n");

  let query = supabase
    .from("brands")
    .select("id, name, website_url, brand_kit, visual_summary, tenant_id, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (SPECIFIC_BRAND_ID) {
    query = query.eq("id", SPECIFIC_BRAND_ID);
  }

  if (LIMIT > 0) {
    query = query.limit(LIMIT * 2); // Fetch extra to account for filtering
  }

  const { data: brands, error: queryError } = await query;

  if (queryError) {
    console.error("❌ Failed to query brands:", queryError.message);
    process.exit(1);
  }

  if (!brands || brands.length === 0) {
    console.log("✅ No brands found to process.");
    process.exit(0);
  }

  // Filter to only brands needing backfill
  const brandsNeedingBackfill = (brands as BrandRow[]).filter(
    (brand) => hasMissingBrandKit(brand) || hasMissingColors(brand)
  );

  // Apply limit after filtering
  const brandsToProcess = LIMIT > 0 
    ? brandsNeedingBackfill.slice(0, LIMIT) 
    : brandsNeedingBackfill;

  console.log(`Found ${brands.length} total brands`);
  console.log(`${brandsNeedingBackfill.length} brands need backfill`);
  console.log(`Processing ${brandsToProcess.length} brands\n`);

  if (brandsToProcess.length === 0) {
    console.log("✅ No brands need backfill!");
    process.exit(0);
  }

  // Step 2: Process each brand
  const results: BackfillResult[] = [];

  for (const brand of brandsToProcess) {
    const result = await backfillBrand(brand);
    results.push(result);

    // Small delay between brands to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Step 3: Print summary
  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("                         BACKFILL SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════════");

  const fixed = results.filter((r) => r.status === "fixed");
  const skipped = results.filter((r) => r.status === "skipped");
  const errors = results.filter((r) => r.status === "error");

  console.log(`\n✅ Fixed: ${fixed.length}`);
  if (fixed.length > 0) {
    fixed.forEach((r) => {
      console.log(`   - ${r.brandName}: ${r.colorsFound} colors`);
    });
  }

  console.log(`\n⏭️  Skipped: ${skipped.length}`);
  if (skipped.length > 0) {
    skipped.forEach((r) => {
      console.log(`   - ${r.brandName}: ${r.reason}`);
    });
  }

  console.log(`\n❌ Errors: ${errors.length}`);
  if (errors.length > 0) {
    errors.forEach((r) => {
      console.log(`   - ${r.brandName}: ${r.reason}`);
    });
  }

  console.log("\n═══════════════════════════════════════════════════════════════════");

  // Exit with error code if any errors occurred
  if (errors.length > 0) {
    console.log("\n⚠️  Some brands failed to backfill. Check errors above.");
    process.exit(1);
  }

  console.log("\n✅ Backfill complete!");
  process.exit(0);
}

// Run
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

