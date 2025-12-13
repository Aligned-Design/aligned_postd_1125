#!/usr/bin/env tsx
/**
 * Detailed media_assets schema verification
 */

import "dotenv/config";
import { supabase } from "../server/lib/supabase";

async function main() {
  console.log("🔍 MEDIA_ASSETS SCHEMA DETAILED CHECK\n");

  // Get any image to see schema
  const { data: anyImage, error } = await supabase
    .from("media_assets")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("❌ Error querying media_assets:", error.message);
    return;
  }

  if (!anyImage) {
    console.log("⚠️  No images in database yet\n");
    console.log("Creating test structure check...\n");
    
    // Try to see what columns we can insert
    const testInsert = {
      brand_id: "11111111-2222-3333-4444-555555555555",
      tenant_id: "00000000-0000-0000-0000-000000000001",
      path: "https://example.com/test.jpg",
      category: "images",
      metadata: { role: "photo", source: "test" },
      status: "active",
    };

    console.log("Attempting test insert with structure:");
    console.log(JSON.stringify(testInsert, null, 2));

    const { data: inserted, error: insertError } = await supabase
      .from("media_assets")
      .insert(testInsert)
      .select()
      .single();

    if (insertError) {
      console.log("\n❌ Insert failed:", insertError.message);
      
      if (insertError.message.includes("column")) {
        console.log("\n⚠️  Possible schema mismatch detected");
      }
    } else {
      console.log("\n✅ Insert successful!");
      console.log("\nActual columns in database:");
      console.log(Object.keys(inserted).join(", "));
      
      console.log("\n📋 Full row:");
      console.table(inserted);

      // Verify role is stored correctly
      console.log("\n🔍 Role Verification:");
      console.log(`   metadata.role: ${inserted.metadata?.role || "N/A"}`);
      console.log(`   metadata.source: ${inserted.metadata?.source || "N/A"}`);
      console.log(`   category: ${inserted.category}`);

      // Clean up
      await supabase.from("media_assets").delete().eq("id", inserted.id);
      console.log("\n🧹 Cleaned up test row");
    }
  } else {
    console.log("✅ Found existing image\n");
    console.log("Available columns:");
    const cols = Object.keys(anyImage);
    console.log(cols.join(", "));

    console.log("\n📋 Sample row structure:");
    console.table({
      id: anyImage.id,
      brand_id: anyImage.brand_id,
      path: anyImage.path?.substring(0, 50) + "...",
      category: anyImage.category,
      "metadata.role": anyImage.metadata?.role || "N/A",
      "metadata.source": anyImage.metadata?.source || "N/A",
      created_at: anyImage.created_at,
      status: anyImage.status,
    });

    // Check for role consistency
    const { data: allImages } = await supabase
      .from("media_assets")
      .select("metadata")
      .limit(50);

    if (allImages) {
      const rolesWithNull = allImages.filter(img => !img.metadata?.role).length;
      const rolesWithValue = allImages.filter(img => img.metadata?.role).length;

      console.log("\n📊 Role Storage Check (50 images):");
      console.log(`   With role: ${rolesWithValue}`);
      console.log(`   Without role: ${rolesWithNull}`);

      if (rolesWithNull > 0) {
        console.log("\n⚠️  Some images missing role in metadata");
      } else {
        console.log("\n✅ All images have role defined");
      }
    }
  }

  // Check if our test brand has images (should after our test scrape)
  const { data: testBrandImages, count } = await supabase
    .from("media_assets")
    .select("*", { count: "exact" })
    .eq("brand_id", "11111111-2222-3333-4444-555555555555");

  console.log(`\n📊 Test brand images: ${count || 0}`);
  
  if (testBrandImages && testBrandImages.length > 0) {
    console.log("\nTest brand image roles:");
    testBrandImages.forEach((img, idx) => {
      console.log(`   ${idx + 1}. ${img.metadata?.role || "unknown"} - ${img.path.split("/").pop()}`);
    });
  }
}

main().catch(console.error);

