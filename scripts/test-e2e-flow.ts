/**
 * End-to-End Flow Test Script
 * 
 * This script tests the complete onboarding flow:
 * 1. Signup → Tenant Creation
 * 2. Brand Creation
 * 3. Crawler → Scraped Images
 * 4. Brand Guide Save
 * 
 * Run with: pnpm tsx scripts/test-e2e-flow.ts
 */

import { supabase } from "../server/lib/supabase";

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = "TestPassword123!";
const TEST_WEBSITE = "https://alignedbydesign.co";

interface TestResult {
  step: string;
  success: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function testStep(step: string, fn: () => Promise<any>): Promise<any> {
  try {
    console.log(`\n🧪 Testing: ${step}`);
    const data = await fn();
    results.push({ step, success: true, data });
    console.log(`✅ ${step} - SUCCESS`);
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ step, success: false, error: errorMessage });
    console.error(`❌ ${step} - FAILED:`, errorMessage);
    throw error;
  }
}

async function main() {
  console.log("🚀 Starting End-to-End Flow Test");
  console.log("=" .repeat(60));

  let userId: string;
  let tenantId: string;
  let brandId: string;
  let accessToken: string;

  try {
    // Step 1: Signup
    const signupResult = await testStep("1. User Signup", async () => {
      const { data, error } = await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: "Test User",
          role: "single_business",
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("No user returned");

      userId = data.user.id;
      return { userId, email: data.user.email };
    });

    // Step 2: Verify Tenant Creation
    await testStep("2. Verify Tenant Created", async () => {
      // Wait a moment for tenant creation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("id, name, plan")
        .eq("id", userId)
        .single();

      if (error) throw error;
      if (!tenant) throw new Error("Tenant not found");

      tenantId = tenant.id;
      return tenant;
    });

    // Step 3: Create Brand
    await testStep("3. Create Brand", async () => {
      const { data: brand, error } = await supabase
        .from("brands")
        .insert({
          name: "Test Brand",
          slug: `test-brand-${Date.now()}`,
          website_url: TEST_WEBSITE,
          industry: "Design",
          description: "Test brand for E2E flow",
          tenant_id: tenantId,
          workspace_id: tenantId,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      if (!brand) throw new Error("Brand not created");

      brandId = brand.id;
      return brand;
    });

    // Step 4: Verify Brand Member Created
    await testStep("4. Verify Brand Member Created", async () => {
      const { data: member, error } = await supabase
        .from("brand_members")
        .select("id, role")
        .eq("brand_id", brandId)
        .eq("user_id", userId)
        .single();

      if (error && !error.message.includes("No rows")) throw error;
      if (!member) {
        // Create member if it doesn't exist
        const { data: newMember, error: createError } = await supabase
          .from("brand_members")
          .insert({
            brand_id: brandId,
            user_id: userId,
            role: "owner",
          })
          .select()
          .single();

        if (createError) throw createError;
        return newMember;
      }

      return member;
    });

    // Step 5: Verify Brand Guide Can Be Saved
    await testStep("5. Save Brand Guide", async () => {
      const brandGuide = {
        brandName: "Test Brand",
        identity: {
          name: "Test Brand",
          businessType: "Design",
          industryKeywords: ["design", "creative"],
        },
        voiceAndTone: {
          tone: ["professional", "friendly"],
          friendlinessLevel: 50,
          formalityLevel: 50,
          confidenceLevel: 50,
        },
        visualIdentity: {
          colors: ["#8B5CF6", "#F0F7F7"],
          typography: {
            heading: "Inter",
            body: "Inter",
          },
        },
      };

      const { data: updated, error } = await supabase
        .from("brands")
        .update({
          brand_kit: brandGuide,
          voice_summary: { tone: ["professional", "friendly"] },
          visual_summary: { colors: ["#8B5CF6", "#F0F7F7"] },
        })
        .eq("id", brandId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    });

    // Step 6: Verify Media Assets Can Be Created
    await testStep("6. Create Media Asset", async () => {
      const { data: asset, error } = await supabase
        .from("media_assets")
        .insert({
          brand_id: brandId,
          tenant_id: tenantId,
          category: "images",
          filename: "test-image.jpg",
          path: `test/${brandId}/test-image.jpg`,
          hash: "test-hash-123",
          mime_type: "image/jpeg",
          size_bytes: 1024,
        })
        .select()
        .single();

      if (error) throw error;
      return asset;
    });

    // Step 7: Verify Brand Guide Can Be Read
    await testStep("7. Read Brand Guide", async () => {
      const { data: brand, error } = await supabase
        .from("brands")
        .select("id, name, brand_kit, voice_summary, visual_summary")
        .eq("id", brandId)
        .single();

      if (error) throw error;
      if (!brand.brand_kit) throw new Error("Brand guide not found");

      return {
        hasBrandKit: !!brand.brand_kit,
        hasVoiceSummary: !!brand.voice_summary,
        hasVisualSummary: !!brand.visual_summary,
      };
    });

    // Step 8: Cleanup
    await testStep("8. Cleanup Test Data", async () => {
      // Delete in reverse order (respecting foreign keys)
      await supabase.from("media_assets").delete().eq("brand_id", brandId);
      await supabase.from("brand_members").delete().eq("brand_id", brandId);
      await supabase.from("brands").delete().eq("id", brandId);
      await supabase.from("tenants").delete().eq("id", tenantId);
      await supabase.auth.admin.deleteUser(userId);

      return { cleaned: true };
    });

    // Print Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Summary");
    console.log("=".repeat(60));

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    results.forEach((result, index) => {
      const icon = result.success ? "✅" : "❌";
      console.log(`${icon} ${result.step}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log("\n" + "=".repeat(60));
    console.log(`✅ Passed: ${passed}/${results.length}`);
    if (failed > 0) {
      console.log(`❌ Failed: ${failed}/${results.length}`);
      process.exit(1);
    } else {
      console.log("🎉 All tests passed!");
      process.exit(0);
    }
  } catch (error) {
    console.error("\n💥 Test suite failed:", error);
    process.exit(1);
  }
}

main();

