#!/usr/bin/env tsx
/**
 * Verification Script: Scraped Images Persistence
 * 
 * Verifies that scraped images are being persisted correctly after the storage quota fix.
 * 
 * Usage:
 *   tsx scripts/verify-scraped-images.ts <brandId>
 * 
 * Or set BRAND_ID env var:
 *   BRAND_ID=<uuid> tsx scripts/verify-scraped-images.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyScrapedImages(brandId: string) {
  console.log(`\n🔍 Verifying scraped images for brand: ${brandId}\n`);

  // 1. Check if storage_quotas table exists
  console.log("1️⃣ Checking storage_quotas table...");
  const { data: quotaCheck, error: quotaError } = await supabase
    .from("storage_quotas")
    .select("id")
    .eq("brand_id", brandId)
    .limit(1);

  if (quotaError) {
    if (quotaError.code === "42P01" || quotaError.message?.includes("does not exist")) {
      console.log("   ⚠️  storage_quotas table does not exist (migration may not be applied)");
      console.log("   ℹ️  This is OK - quota check will use unlimited quota");
    } else if (quotaError.code === "PGRST204") {
      console.log("   ✅ storage_quotas table exists, but no quota row for this brand");
      console.log("   ℹ️  This is OK - quota check will use unlimited quota");
    } else {
      console.log(`   ⚠️  Error checking quota: ${quotaError.message}`);
      console.log("   ℹ️  This is OK - quota check will use unlimited quota");
    }
  } else {
    console.log("   ✅ storage_quotas table exists and has quota row");
  }

  // 2. Query scraped images from media_assets
  console.log("\n2️⃣ Querying scraped images from media_assets...");
  const { data: scrapedImages, error: imagesError } = await supabase
    .from("media_assets")
    .select("id, brand_id, path, filename, metadata, created_at")
    .eq("brand_id", brandId)
    .like("path", "http%")
    .order("created_at", { ascending: false })
    .limit(20);

  if (imagesError) {
    console.error(`   ❌ Error querying images: ${imagesError.message}`);
    return;
  }

  if (!scrapedImages || scrapedImages.length === 0) {
    console.log("   ⚠️  No scraped images found");
    console.log("   ℹ️  This could mean:");
    console.log("      - Crawler hasn't been run yet");
    console.log("      - Images weren't persisted (check server logs)");
    console.log("      - Brand ID is incorrect");
    return;
  }

  console.log(`   ✅ Found ${scrapedImages.length} scraped images\n`);

  // 3. Verify image structure
  console.log("3️⃣ Verifying image structure...");
  let validCount = 0;
  let logoCount = 0;
  let otherCount = 0;

  for (const img of scrapedImages) {
    const path = img.path || "";
    const metadata = (img.metadata as any) || {};
    const source = metadata.source;

    if (!path.startsWith("http")) {
      console.log(`   ⚠️  Image ${img.id} has invalid path (not HTTP URL): ${path.substring(0, 50)}`);
      continue;
    }

    if (source !== "scrape") {
      console.log(`   ⚠️  Image ${img.id} missing source='scrape' in metadata`);
      continue;
    }

    validCount++;
    const role = metadata.role || "";
    if (role === "logo") {
      logoCount++;
    } else {
      otherCount++;
    }
  }

  console.log(`   ✅ ${validCount} valid scraped images`);
  console.log(`      - Logos: ${logoCount}`);
  console.log(`      - Other: ${otherCount}`);

  // 4. Sample images
  console.log("\n4️⃣ Sample scraped images:");
  scrapedImages.slice(0, 5).forEach((img, idx) => {
    const metadata = (img.metadata as any) || {};
    console.log(`   ${idx + 1}. ${img.filename || "unnamed"}`);
    console.log(`      URL: ${(img.path || "").substring(0, 80)}...`);
    console.log(`      Role: ${metadata.role || "unknown"}`);
    console.log(`      Source: ${metadata.source || "unknown"}`);
  });

  // 5. Check brand_kit for images
  console.log("\n5️⃣ Checking brand_kit for image references...");
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("brand_kit")
    .eq("id", brandId)
    .single();

  if (brandError) {
    console.log(`   ⚠️  Error fetching brand: ${brandError.message}`);
  } else {
    const brandKit = (brand.brand_kit as any) || {};
    const brandKitImages = brandKit.images || [];
    console.log(`   ℹ️  brand_kit.images: ${brandKitImages.length} images`);
    console.log(`   ℹ️  brand_kit.logoUrl: ${brandKit.logoUrl || "none"}`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 VERIFICATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Brand ID: ${brandId}`);
  console.log(`Scraped Images Found: ${scrapedImages.length}`);
  console.log(`Valid Images: ${validCount}`);
  console.log(`Logos: ${logoCount}`);
  console.log(`Other Images: ${otherCount}`);
  
  if (validCount > 0) {
    console.log("\n✅ SUCCESS: Scraped images are being persisted correctly!");
    console.log("   Next step: Verify Step 5 UI shows these images");
  } else {
    console.log("\n⚠️  WARNING: No valid scraped images found");
    console.log("   Check server logs for quota errors or persistence failures");
  }
  console.log("=".repeat(60) + "\n");
}

// Main
const brandId = process.argv[2] || process.env.BRAND_ID;

if (!brandId) {
  console.error("❌ Brand ID required");
  console.error("Usage: tsx scripts/verify-scraped-images.ts <brandId>");
  console.error("   Or: BRAND_ID=<uuid> tsx scripts/verify-scraped-images.ts");
  process.exit(1);
}

// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(brandId)) {
  console.error(`❌ Invalid brand ID format: ${brandId}`);
  console.error("   Brand ID must be a valid UUID");
  process.exit(1);
}

verifyScrapedImages(brandId).catch((error) => {
  console.error("❌ Verification failed:", error);
  process.exit(1);
});

