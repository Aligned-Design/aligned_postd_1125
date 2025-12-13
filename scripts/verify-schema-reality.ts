#!/usr/bin/env tsx
/**
 * Schema Reality Check — Verify canonical tables match expectations
 */

import "dotenv/config";
import { supabase } from "../server/lib/supabase";

async function main() {
  console.log("🔍 SCHEMA REALITY CHECK\n");
  console.log("=" + "=".repeat(70) + "\n");

  // =========================================================================
  // 1. BRANDS TABLE SCHEMA
  // =========================================================================
  console.log("1️⃣  BRANDS TABLE — Canonical Columns\n");

  const { data: brandsColumns, error: brandsError } = await supabase.rpc(
    "exec_sql",
    {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'brands'
        AND column_name IN ('brand_kit', 'voice_summary', 'visual_summary', 'tone_keywords', 'updated_at', 'id', 'tenant_id')
        ORDER BY 
          CASE column_name
            WHEN 'id' THEN 1
            WHEN 'tenant_id' THEN 2
            WHEN 'brand_kit' THEN 3
            WHEN 'updated_at' THEN 4
            WHEN 'voice_summary' THEN 5
            WHEN 'visual_summary' THEN 6
            WHEN 'tone_keywords' THEN 7
          END;
      `,
    }
  ).single();

  if (brandsError) {
    console.log("⚠️  Using fallback query (RPC not available)\n");
    
    // Try direct query
    const { data: testBrand } = await supabase
      .from("brands")
      .select("id, brand_kit, voice_summary, visual_summary, tone_keywords, updated_at")
      .limit(1)
      .single();

    if (testBrand) {
      console.log("✅ brand_kit:", typeof testBrand.brand_kit === "object" ? "JSONB (present)" : "unknown");
      console.log("✅ voice_summary:", testBrand.voice_summary !== undefined ? "exists" : "missing");
      console.log("✅ visual_summary:", testBrand.visual_summary !== undefined ? "exists" : "missing");
      console.log("✅ tone_keywords:", testBrand.tone_keywords !== undefined ? "exists" : "missing");
      console.log("✅ updated_at:", testBrand.updated_at ? "exists" : "missing");
    }
  } else {
    console.log("Schema columns:");
    console.table(brandsColumns);
  }

  // Check a real brand
  const { data: sampleBrand } = await supabase
    .from("brands")
    .select("id, brand_kit, voice_summary, visual_summary, tone_keywords, updated_at")
    .not("brand_kit", "is", null)
    .limit(1)
    .single();

  if (sampleBrand) {
    console.log("\n📋 Sample Brand Check:");
    console.log(`   ID: ${sampleBrand.id}`);
    console.log(`   brand_kit: ${sampleBrand.brand_kit ? "✅ Present (JSONB)" : "❌ NULL"}`);
    console.log(`   voice_summary: ${sampleBrand.voice_summary !== null ? "⚠️  NOT NULL" : "✅ NULL"}`);
    console.log(`   visual_summary: ${sampleBrand.visual_summary !== null ? "⚠️  NOT NULL" : "✅ NULL"}`);
    console.log(`   tone_keywords: ${sampleBrand.tone_keywords !== null ? "⚠️  NOT NULL" : "✅ NULL"}`);
    console.log(`   updated_at: ${sampleBrand.updated_at || "N/A"}`);
  }

  // =========================================================================
  // 2. MEDIA_ASSETS TABLE SCHEMA
  // =========================================================================
  console.log("\n" + "=" + "=".repeat(70));
  console.log("\n2️⃣  MEDIA_ASSETS TABLE — Key Columns\n");

  const { data: mediaColumns } = await supabase
    .from("media_assets")
    .select("*")
    .limit(1)
    .single();

  if (mediaColumns) {
    const cols = Object.keys(mediaColumns);
    console.log("Available columns:", cols.join(", "));
    console.log("\n✅ Required columns:");
    console.log(`   brand_id: ${cols.includes("brand_id") ? "✅" : "❌"}`);
    console.log(`   path: ${cols.includes("path") ? "✅" : "❌"}`);
    console.log(`   category: ${cols.includes("category") ? "✅" : "❌"}`);
    console.log(`   metadata: ${cols.includes("metadata") ? "✅" : "❌"}`);
    console.log(`   created_at: ${cols.includes("created_at") ? "✅" : "❌"}`);
    console.log(`   status: ${cols.includes("status") ? "✅" : "❌"}`);
  }

  // Check role storage
  const { data: sampleImage } = await supabase
    .from("media_assets")
    .select("id, brand_id, path, category, metadata, created_at")
    .not("metadata", "is", null)
    .limit(1)
    .single();

  if (sampleImage) {
    console.log("\n📋 Sample Image Check:");
    console.log(`   ID: ${sampleImage.id}`);
    console.log(`   brand_id: ${sampleImage.brand_id}`);
    console.log(`   category: ${sampleImage.category}`);
    console.log(`   metadata.role: ${(sampleImage.metadata as any)?.role || "N/A"}`);
    console.log(`   metadata.source: ${(sampleImage.metadata as any)?.source || "N/A"}`);
    console.log(`   path: ${sampleImage.path?.substring(0, 50)}...`);
  }

  // =========================================================================
  // 3. CONSTRAINTS CHECK
  // =========================================================================
  console.log("\n" + "=" + "=".repeat(70));
  console.log("\n3️⃣  CONSTRAINTS & TRIGGERS CHECK\n");

  // Try to insert a test row
  const testBrandId = "test-constraint-check-brand";
  const testImageId = "test-constraint-check-image";

  console.log("Testing insert capabilities...\n");

  const { error: insertError } = await supabase
    .from("media_assets")
    .insert({
      id: testImageId,
      brand_id: testBrandId,
      tenant_id: "00000000-0000-0000-0000-000000000001",
      path: "https://example.com/test-image.jpg",
      category: "images",
      metadata: {
        role: "photo",
        source: "test",
      },
      status: "active",
    });

  if (insertError) {
    if (insertError.message.includes("violates foreign key")) {
      console.log("✅ Foreign key constraint working (expected for test brand)");
    } else if (insertError.message.includes("duplicate key")) {
      console.log("⚠️  Test row already exists (cleaning up...)");
      await supabase.from("media_assets").delete().eq("id", testImageId);
    } else {
      console.log("❌ Unexpected constraint:", insertError.message);
    }
  } else {
    console.log("✅ Insert successful (cleaning up...)");
    await supabase.from("media_assets").delete().eq("id", testImageId);
  }

  // =========================================================================
  // 4. ROLE ENUM / VOCAB CHECK
  // =========================================================================
  console.log("\n" + "=" + "=".repeat(70));
  console.log("\n4️⃣  ROLE VOCABULARY CHECK\n");

  const { data: roleDistribution } = await supabase
    .from("media_assets")
    .select("metadata")
    .not("metadata", "is", null)
    .limit(100);

  if (roleDistribution) {
    const roles = new Set<string>();
    roleDistribution.forEach((img: any) => {
      const role = img.metadata?.role;
      if (role) roles.add(role);
    });

    console.log("Roles found in database:");
    Array.from(roles).sort().forEach(role => {
      console.log(`   - ${role}`);
    });

    const expectedRoles = ["logo", "hero", "photo", "team", "subject", "other", "social_icon", "ui_icon"];
    const unexpectedRoles = Array.from(roles).filter(r => !expectedRoles.includes(r));
    
    if (unexpectedRoles.length > 0) {
      console.log("\n⚠️  Unexpected roles found:", unexpectedRoles.join(", "));
    } else {
      console.log("\n✅ All roles match expected vocabulary");
    }
  }

  // =========================================================================
  // 5. INDEXES CHECK
  // =========================================================================
  console.log("\n" + "=" + "=".repeat(70));
  console.log("\n5️⃣  INDEX CHECK (Performance)\n");

  console.log("Recommended indexes:");
  console.log("   - media_assets (brand_id, created_at)");
  console.log("   - media_assets (brand_id, status)");
  console.log("   - brands (id) [PRIMARY KEY]");
  console.log("\n⚠️  Index verification requires EXPLAIN queries (manual check recommended)");

  // =========================================================================
  // 6. TRUTH TEST QUERY
  // =========================================================================
  console.log("\n" + "=" + "=".repeat(70));
  console.log("\n6️⃣  TRUTH TEST — Most Recent Scrape\n");

  const { data: recentBrand } = await supabase
    .from("brands")
    .select("id, name, brand_kit, voice_summary, visual_summary, tone_keywords, updated_at")
    .not("brand_kit", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (recentBrand) {
    console.log(`Recent brand: ${recentBrand.name} (${recentBrand.id})`);
    console.log(`Updated: ${recentBrand.updated_at}`);

    // Get images for this brand
    const { data: images } = await supabase
      .from("media_assets")
      .select("path, category, metadata, created_at")
      .eq("brand_id", recentBrand.id)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (images && images.length > 0) {
      console.log(`\nImages (${images.length} total):`);
      console.log("\nFirst 10 by created_at:");
      images.slice(0, 10).forEach((img, idx) => {
        const role = (img.metadata as any)?.role || "unknown";
        const filename = img.path.split("/").pop()?.substring(0, 30) || "N/A";
        console.log(`   ${idx + 1}. [${role.padEnd(10)}] ${filename}`);
      });

      // Role breakdown
      const roleCount: Record<string, number> = {};
      images.forEach(img => {
        const role = (img.metadata as any)?.role || "unknown";
        roleCount[role] = (roleCount[role] || 0) + 1;
      });

      console.log("\nRole distribution:");
      Object.entries(roleCount).forEach(([role, count]) => {
        console.log(`   ${role}: ${count}`);
      });

      // Check ordering
      const first5Roles = images.slice(0, 5).map(i => (i.metadata as any)?.role || "unknown");
      const logosInFirst5 = first5Roles.filter(r => r === "logo").length;

      console.log("\n📊 Ordering Check:");
      if (logosInFirst5 === 0) {
        console.log("   ✅ No logos in first 5 images");
      } else if (logosInFirst5 <= 2 && first5Roles.indexOf("logo") >= 3) {
        console.log("   ✅ Logos appear after position 3");
      } else {
        console.log(`   ⚠️  ${logosInFirst5} logo(s) in first 5 positions`);
      }
    } else {
      console.log("\n⚠️  No images found for this brand");
    }

    // Check brand_kit
    const brandKit = recentBrand.brand_kit as any;
    console.log("\n📊 Brand Kit Check:");
    console.log(`   brand_kit present: ${brandKit ? "✅" : "❌"}`);
    if (brandKit) {
      console.log(`   Colors: ${brandKit.visualIdentity?.colors?.length || brandKit.colors?.allColors?.length || 0}`);
      console.log(`   Host: ${brandKit.metadata?.host?.name || "unknown"}`);
      console.log(`   Name: ${brandKit.identity?.name || "N/A"}`);
    }
    console.log(`   voice_summary: ${recentBrand.voice_summary !== null ? "⚠️  NOT NULL" : "✅ NULL"}`);
    console.log(`   visual_summary: ${recentBrand.visual_summary !== null ? "⚠️  NOT NULL" : "✅ NULL"}`);
  }

  console.log("\n" + "=" + "=".repeat(70));
  console.log("\n✅ SCHEMA VERIFICATION COMPLETE\n");
}

main().catch(console.error);

