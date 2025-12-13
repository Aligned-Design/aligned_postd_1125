#!/usr/bin/env tsx
import "dotenv/config";
import { supabase } from "../server/lib/supabase";
import { generateTokenPair } from "../server/lib/jwt-auth";
import { Role } from "../server/middleware/rbac";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";
const BRAND_ID = "aaaaaaaa-bbbb-cccc-dddd-555555555555";
const API_BASE = "http://localhost:8080";

async function main() {
  console.log("🔄 Re-testing Squarespace scrape with third-party filter...\n");

  // Clean up old data
  await supabase.from("media_assets").delete().eq("brand_id", BRAND_ID);
  await supabase.from("brands").delete().eq("id", BRAND_ID);

  // Create fresh brand
  await supabase.from("brands").insert({
    id: BRAND_ID,
    tenant_id: TENANT_ID,
    name: "Squarespace Retest Brand",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  console.log(`✅ Brand created: ${BRAND_ID}\n`);

  // Execute scrape
  const { accessToken } = generateTokenPair({
    userId: "test-user",
    email: "test@verification.com",
    role: Role.ADMIN,
    brandIds: [BRAND_ID],
    tenantId: TENANT_ID,
    workspaceId: TENANT_ID,
  });

  console.log("🚀 Starting scrape...\n");

  const response = await fetch(`${API_BASE}/api/crawl/start?sync=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      url: "https://sdirawealth.com",
      brand_id: BRAND_ID,
      workspaceId: TENANT_ID,
      sync: true,
    }),
  });

  const data = await response.json();
  console.log(`📥 Response: ${response.status}\n`);

  if (!response.ok) {
    console.error("❌ Scrape failed:", data);
    return;
  }

  console.log("✅ Scrape completed\n");

  // Wait for DB
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Verify results
  const { data: images } = await supabase
    .from("media_assets")
    .select("path, metadata")
    .eq("brand_id", BRAND_ID)
    .order("created_at", { ascending: true });

  if (!images || images.length === 0) {
    console.log("⚠️  No images found\n");
    return;
  }

  console.log(`📊 Results: ${images.length} images\n`);

  const roles = images.map(img => (img.metadata as any)?.role || "unknown");
  const roleBreakdown: Record<string, number> = {};
  roles.forEach(role => {
    roleBreakdown[role] = (roleBreakdown[role] || 0) + 1;
  });

  console.log("Role breakdown:", roleBreakdown);
  console.log("\nFirst 5 roles:", roles.slice(0, 5).join(", "));

  const logoCount = roleBreakdown["logo"] || 0;
  console.log(`\n📊 Logo count: ${logoCount} (limit: 2)`);

  if (logoCount <= 2 && images.length > logoCount) {
    console.log("\n✅ PASS: Logo count ≤ 2 and non-logo images present");
  } else {
    console.log("\n❌ FAIL: Too many logos or no brand images");
  }

  // Show first 5 images
  console.log("\nFirst 5 images:");
  images.slice(0, 5).forEach((img, idx) => {
    const meta = img.metadata as any;
    const filename = img.path.split("/").pop()?.substring(0, 40) || "unknown";
    console.log(`${idx + 1}. [${meta?.role || "unknown"}] ${filename}`);
  });
}

main().catch(console.error);

