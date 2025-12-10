#!/usr/bin/env tsx
/**
 * List Brands Helper
 *
 * Lists brands from the database to help identify real brand IDs for testing.
 *
 * Usage:
 *   pnpm tsx scripts/list-brands.ts
 *   pnpm tsx scripts/list-brands.ts --limit 20
 */

import "dotenv/config";
import { supabase } from "../server/lib/supabase";

async function listBrands() {
  console.log("📋 Listing brands from database...\n");

  const limit = parseInt(process.argv[2]?.replace("--limit=", "") || "10", 10);

  const { data: brands, error } = await supabase
    .from("brands")
    .select("id, name, website_url, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("❌ Error fetching brands:", error.message);
    process.exit(1);
  }

  if (!brands || brands.length === 0) {
    console.log("No brands found in database.");
    console.log("\nTo create a brand, use the onboarding flow or API.");
    process.exit(0);
  }

  console.log(`Found ${brands.length} brand(s):\n`);
  console.log("─".repeat(80));

  for (const brand of brands) {
    console.log(`
Brand: ${brand.name || "(unnamed)"}
  ID: ${brand.id}
  URL: ${brand.website_url || "(no URL)"}
  Updated: ${brand.updated_at || brand.created_at || "(unknown)"}
`);
  }

  console.log("─".repeat(80));
  console.log("\n📝 To test with a brand, run:");
  console.log(`   SCRAPER_TEST_BRAND_ID_1=${brands[0]?.id} pnpm scraper:smoke`);

  // Also check media assets for the first brand
  if (brands[0]) {
    const { data: assets } = await supabase
      .from("media_assets")
      .select("id, category, path, status")
      .eq("brand_id", brands[0].id)
      .eq("status", "active")
      .limit(5);

    if (assets && assets.length > 0) {
      console.log(`\n📸 First brand has ${assets.length}+ media assets`);
    } else {
      console.log(`\n⚠️ First brand has no media assets (may need to scrape first)`);
    }
  }
}

listBrands().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

