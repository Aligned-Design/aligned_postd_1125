/**
 * Test Scraped Image Persistence
 * 
 * Dev-only script to test scraped image persistence to media_assets table.
 * 
 * Usage:
 *   pnpm tsx scripts/test-scraped-image-persistence.ts [brandId] [tenantId]
 * 
 * If brandId/tenantId not provided, will use test values.
 * 
 * This script:
 * 1. Creates test scraped images (external URLs)
 * 2. Calls persistScrapedImages()
 * 3. Verifies rows appear in media_assets with correct fields
 * 4. Cleans up test data (optional)
 */

import { persistScrapedImages, CrawledImage } from "../server/lib/scraped-images-service";
import { supabase } from "../server/lib/supabase";

const TEST_BRAND_ID = process.argv[2] || "test-brand-scraped-images";
const TEST_TENANT_ID = process.argv[3] || "00000000-0000-0000-0000-000000000000";

// Test images (external URLs - scraped images)
const TEST_IMAGES: CrawledImage[] = [
  {
    url: "https://via.placeholder.com/400x200.png?text=Test+Logo",
    alt: "Test Logo",
    width: 400,
    height: 200,
    role: "logo",
  },
  {
    url: "https://via.placeholder.com/800x600.jpg?text=Test+Hero",
    alt: "Test Hero Image",
    width: 800,
    height: 600,
    role: "hero",
  },
];

async function testScrapedImagePersistence() {
  console.log("\n========================================");
  console.log("🧪 Testing Scraped Image Persistence");
  console.log("========================================\n");

  console.log(`Brand ID: ${TEST_BRAND_ID}`);
  console.log(`Tenant ID: ${TEST_TENANT_ID}`);
  console.log(`Test Images: ${TEST_IMAGES.length}\n`);

  try {
    // Step 1: Persist scraped images
    console.log("📤 Step 1: Persisting scraped images...");
    const persistedIds = await persistScrapedImages(
      TEST_BRAND_ID,
      TEST_TENANT_ID,
      TEST_IMAGES
    );

    console.log(`✅ Persisted ${persistedIds.length} image(s)\n`);

    if (persistedIds.length === 0) {
      console.error("❌ ERROR: No images were persisted!");
      process.exit(1);
    }

    // Step 2: Verify rows in database
    console.log("🔍 Step 2: Verifying database records...");
    const { data: assets, error: queryError } = await supabase
      .from("media_assets")
      .select("*")
      .in("id", persistedIds)
      .order("created_at", { ascending: false });

    if (queryError) {
      console.error("❌ ERROR querying media_assets:", queryError);
      process.exit(1);
    }

    if (!assets || assets.length === 0) {
      console.error("❌ ERROR: No assets found in database after persistence!");
      process.exit(1);
    }

    console.log(`✅ Found ${assets.length} asset(s) in database\n`);

    // Step 3: Verify each asset has correct fields
    console.log("✅ Step 3: Verifying asset fields...");
    let allValid = true;

    for (const asset of assets) {
      const issues: string[] = [];

      // Check required fields
      if (!asset.brand_id || asset.brand_id !== TEST_BRAND_ID) {
        issues.push(`brand_id mismatch: expected ${TEST_BRAND_ID}, got ${asset.brand_id}`);
      }

      if (asset.tenant_id !== TEST_TENANT_ID) {
        issues.push(`tenant_id mismatch: expected ${TEST_TENANT_ID}, got ${asset.tenant_id || "null"}`);
      }

      if (!asset.filename) {
        issues.push("filename is missing");
      }

      if (!asset.path) {
        issues.push("path is missing");
      }

      // Check that path is an HTTP URL (scraped images)
      if (!asset.path.startsWith("http://") && !asset.path.startsWith("https://")) {
        issues.push(`path should be HTTP URL for scraped images, got: ${asset.path.substring(0, 50)}`);
      }

      // Check status (should be 'active')
      if (asset.status !== "active") {
        issues.push(`status should be 'active', got: ${asset.status || "null"}`);
      }

      // Check size_bytes (should be 0 for scraped images)
      if (asset.size_bytes !== 0) {
        issues.push(`size_bytes should be 0 for scraped images, got: ${asset.size_bytes}`);
      }

      // Check category
      if (!asset.category || (asset.category !== "logos" && asset.category !== "images")) {
        issues.push(`category should be 'logos' or 'images', got: ${asset.category || "null"}`);
      }

      // Check metadata (should have source='scrape')
      const metadata = asset.metadata as any;
      if (!metadata || metadata.source !== "scrape") {
        issues.push(`metadata.source should be 'scrape', got: ${metadata?.source || "null"}`);
      }

      if (issues.length > 0) {
        console.error(`❌ Asset ${asset.id} has issues:`, issues);
        allValid = false;
      } else {
        console.log(`✅ Asset ${asset.id} is valid:`, {
          filename: asset.filename,
          category: asset.category,
          status: asset.status,
          path: asset.path.substring(0, 60),
          size_bytes: asset.size_bytes,
          has_metadata: !!asset.metadata,
        });
      }
    }

    if (!allValid) {
      console.error("\n❌ Some assets have validation issues!");
      process.exit(1);
    }

    // Step 4: Summary
    console.log("\n========================================");
    console.log("✅ TEST PASSED");
    console.log("========================================");
    console.log(`Persisted: ${persistedIds.length} image(s)`);
    console.log(`Verified: ${assets.length} asset(s) in database`);
    console.log(`Brand ID: ${TEST_BRAND_ID}`);
    console.log(`Tenant ID: ${TEST_TENANT_ID}`);
    console.log("\n✅ All scraped images persisted successfully!");
    console.log("✅ All database records are valid!");
    console.log("\n💡 To clean up test data, run:");
    console.log(`   DELETE FROM media_assets WHERE id IN (${persistedIds.map(id => `'${id}'`).join(", ")});`);

  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testScrapedImagePersistence()
  .then(() => {
    console.log("\n✅ Test script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test script failed:", error);
    process.exit(1);
  });

