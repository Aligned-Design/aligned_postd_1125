#!/usr/bin/env tsx
/**
 * Verify scraper fix results in database
 */

import "dotenv/config";
import { supabase } from "../server/lib/supabase";

const TEST_BRAND_ID = "11111111-2222-3333-4444-555555555555";

async function main() {
  console.log("🔍 Verifying scrape results...\n");
  console.log(`Brand ID: ${TEST_BRAND_ID}\n`);

  // CHECK A: Image ordering (not logo-first)
  console.log("=" + "=".repeat(70));
  console.log(" CHECK A: Images Are NOT Logo-First");
  console.log("=" + "=".repeat(70) + "\n");

  const { data: images, error: imagesError } = await supabase
    .from("media_assets")
    .select("path, category, metadata")
    .eq("brand_id", TEST_BRAND_ID)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (imagesError) {
    console.error("❌ Error querying images:", imagesError.message);
  } else if (!images || images.length === 0) {
    console.log("⚠️  No images found (site may have no images)");
  } else {
    console.log(`Total images: ${images.length}\n`);
    console.log("First 10 images (ordered by created_at):\n");
    
    images.slice(0, 10).forEach((img, idx) => {
      const role = img.metadata?.role || "unknown";
      const filename = img.path.split("/").pop() || img.path.substring(0, 50);
      console.log(`${idx + 1}. [${role.padEnd(10)}] ${filename}`);
    });

    // Count by role
    const roleCount: Record<string, number> = {};
    images.forEach(img => {
      const role = img.metadata?.role || "unknown";
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    console.log("\nRole breakdown:");
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });

    // Check if logos appear first
    const first5Roles = images.slice(0, 5).map(i => i.metadata?.role || "unknown");
    const logoesFirst = first5Roles.filter(r => r === "logo").length;
    
    if (logoesFirst === 0) {
      console.log("\n✅ PASS: No logos in first 5 images");
    } else if (logoesFirst <= 2 && first5Roles.indexOf("logo") >= 3) {
      console.log("\n✅ PASS: Logos appear after position 3");
    } else {
      console.log("\n❌ FAIL: Logos appear in first positions");
    }
  }

  // CHECK B: Brand kit canonical storage
  console.log("\n" + "=" + "=".repeat(70));
  console.log(" CHECK B: Brand Kit Written to Canonical brand_kit Field");
  console.log("=" + "=".repeat(70) + "\n");

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("brand_kit, voice_summary, visual_summary, tone_keywords")
    .eq("id", TEST_BRAND_ID)
    .single();

  if (brandError) {
    console.error("❌ Error querying brand:", brandError.message);
  } else if (!brand) {
    console.error("❌ Brand not found");
  } else {
    console.log("Brand kit status:");
    console.log(`   brand_kit: ${brand.brand_kit ? "✅ Present" : "❌ NULL"}`);
    console.log(`   voice_summary: ${brand.voice_summary !== null ? "⚠️  NOT NULL (legacy)" : "✅ NULL"}`);
    console.log(`   visual_summary: ${brand.visual_summary !== null ? "⚠️  NOT NULL (legacy)" : "✅ NULL"}`);
    console.log(`   tone_keywords: ${brand.tone_keywords !== null ? "⚠️  NOT NULL (legacy)" : "✅ NULL"}`);

    if (brand.brand_kit) {
      const kit = brand.brand_kit as any;
      console.log("\nBrand kit contents:");
      console.log(`   identity.name: ${kit.identity?.name || "N/A"}`);
      console.log(`   visualIdentity.colors: ${kit.visualIdentity?.colors?.length || kit.colors?.allColors?.length || 0}`);
      console.log(`   metadata.host: ${kit.metadata?.host?.name || "unknown"}`);
      
      if (kit.visualIdentity?.colors && kit.visualIdentity.colors.length > 0) {
        console.log(`   Color palette: ${kit.visualIdentity.colors.slice(0, 3).join(", ")}`);
      } else if (kit.colors?.allColors && kit.colors.allColors.length > 0) {
        console.log(`   Color palette: ${kit.colors.allColors.slice(0, 3).join(", ")}`);
      }
    }

    // Final verdict
    const legacyWritten = brand.voice_summary !== null || brand.visual_summary !== null || brand.tone_keywords !== null;
    
    console.log("\n" + "=" + "=".repeat(70));
    if (!legacyWritten && brand.brand_kit) {
      console.log(" ✅ PASS: All data in canonical brand_kit, no legacy writes");
    } else if (legacyWritten) {
      console.log(" ❌ FAIL: Legacy columns were written to");
    } else {
      console.log(" ⚠️  WARNING: brand_kit is null");
    }
    console.log("=" + "=".repeat(70));
  }
}

main().catch(console.error);

