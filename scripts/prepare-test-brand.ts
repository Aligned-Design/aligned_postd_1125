#!/usr/bin/env tsx
/**
 * Prepare fresh test brand for scraper verification
 */

import "dotenv/config";
import { supabase } from "../server/lib/supabase";

const TEST_BRAND_ID = "11111111-2222-3333-4444-555555555555"; // Valid UUID
const TEST_TENANT_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  console.log("🧹 Cleaning up old test data...\n");

  // Ensure tenant exists
  const { error: tenantError } = await supabase
    .from("tenants")
    .upsert({
      id: TEST_TENANT_ID,
      name: "Test Tenant for Scraper Fix",
    }, {
      onConflict: "id"
    });

  if (tenantError) {
    console.log("⚠️  Tenant:", tenantError.message);
  } else {
    console.log("✅ Tenant ready");
  }

  // Delete old images
  const { error: deleteImagesError } = await supabase
    .from("media_assets")
    .delete()
    .eq("brand_id", TEST_BRAND_ID);

  if (deleteImagesError) {
    console.log("⚠️  Old images:", deleteImagesError.message);
  } else {
    console.log("✅ Deleted old images");
  }

  // Delete old brand
  const { error: deleteBrandError } = await supabase
    .from("brands")
    .delete()
    .eq("id", TEST_BRAND_ID);

  if (deleteBrandError) {
    console.log("⚠️  Old brand:", deleteBrandError.message);
  } else {
    console.log("✅ Deleted old brand");
  }

  // Create fresh brand (no 'website' column - that's for deprecated schema)
  const { error: createError } = await supabase
    .from("brands")
    .insert({
      id: TEST_BRAND_ID,
      tenant_id: TEST_TENANT_ID,
      name: "Scraper Fix Test Brand",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (createError) {
    console.error("\n❌ Failed to create brand:", createError.message);
    process.exit(1);
  }

  console.log("✅ Created fresh brand\n");
  console.log("📋 Test Credentials:");
  console.log(`   Brand ID: ${TEST_BRAND_ID}`);
  console.log(`   Tenant ID: ${TEST_TENANT_ID}`);
  console.log(`   URL: https://www.squarespace.com/templates\n`);
}

main().catch(console.error);

