#!/usr/bin/env tsx
/**
 * Brand Sanity Script
 * 
 * Lists workspaces → brands → brand_guide for the current user.
 * Useful for debugging brand access issues.
 * 
 * Run with: pnpm tsx server/scripts/brand-sanity.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listBrandSanity() {
  console.log("\n" + "=".repeat(60));
  console.log("BRAND SANITY CHECK");
  console.log("=".repeat(60));

  try {
    // List all tenants/workspaces
    console.log("\n📁 Workspaces (Tenants):");
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, name, plan")
      .order("created_at", { ascending: false })
      .limit(10);

    if (tenantsError) {
      console.warn("⚠️  Could not fetch tenants:", tenantsError.message);
    } else if (tenants && tenants.length > 0) {
      tenants.forEach((tenant: any) => {
        console.log(`  - ${tenant.name} (${tenant.id}) [${tenant.plan || "N/A"}]`);
      });
    } else {
      console.log("  (No tenants found)");
    }

    // List all brands
    console.log("\n🏢 Brands:");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, tenant_id, workspace_id, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (brandsError) {
      console.warn("⚠️  Could not fetch brands:", brandsError.message);
    } else if (brands && brands.length > 0) {
      brands.forEach((brand: any) => {
        const workspaceId = brand.workspace_id || brand.tenant_id || "N/A";
        console.log(`  - ${brand.name || "Untitled"} (${brand.id})`);
        console.log(`    Workspace: ${workspaceId}`);
      });
    } else {
      console.log("  (No brands found)");
    }

    // List brand members
    console.log("\n👥 Brand Members:");
    const { data: members, error: membersError } = await supabase
      .from("brand_members")
      .select("id, user_id, brand_id, role, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (membersError) {
      console.warn("⚠️  Could not fetch brand members:", membersError.message);
    } else if (members && members.length > 0) {
      const brandMap = new Map<string, any[]>();
      members.forEach((member: any) => {
        if (!brandMap.has(member.brand_id)) {
          brandMap.set(member.brand_id, []);
        }
        brandMap.get(member.brand_id)!.push(member);
      });

      brandMap.forEach((memberList, brandId) => {
        console.log(`  Brand ${brandId}:`);
        memberList.forEach((member: any) => {
          console.log(`    - User ${member.user_id} (${member.role})`);
        });
      });
    } else {
      console.log("  (No brand members found)");
    }

    // Check brand guides
    console.log("\n📋 Brand Guides:");
    if (brands && brands.length > 0) {
      for (const brand of brands.slice(0, 10)) {
        const brandKit = (brand.brand_kit as any) || {};
        const voiceSummary = (brand.voice_summary as any) || {};
        const visualSummary = (brand.visual_summary as any) || {};

        const hasBrandGuide = !!(
          brandKit.purpose ||
          brandKit.mission ||
          brandKit.vision ||
          (brandKit.toneKeywords && brandKit.toneKeywords.length > 0) ||
          brandKit.voiceDescription ||
          brandKit.primaryColor ||
          brandKit.fontFamily ||
          brandKit.logoUrl ||
          (brandKit.personas && brandKit.personas.length > 0) ||
          (voiceSummary.tone && voiceSummary.tone.length > 0) ||
          (visualSummary.colors && visualSummary.colors.length > 0)
        );

        console.log(`  ${brand.name || "Untitled"} (${brand.id}):`);
        console.log(`    Has Brand Guide: ${hasBrandGuide ? "✅ Yes" : "❌ No"}`);
        if (hasBrandGuide) {
          console.log(`    - Purpose: ${brandKit.purpose ? "✅" : "❌"}`);
          console.log(`    - Tone: ${brandKit.toneKeywords?.length > 0 || voiceSummary.tone?.length > 0 ? "✅" : "❌"}`);
          console.log(`    - Colors: ${visualSummary.colors?.length > 0 || brandKit.primaryColor ? "✅" : "❌"}`);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Brand sanity check complete");
    console.log("=".repeat(60) + "\n");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

listBrandSanity();

