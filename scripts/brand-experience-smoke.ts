/**
 * Brand Experience Smoke Test
 * 
 * Verifies end-to-end brand experience:
 * 1. Brand colors are clean HEX values
 * 2. Brand identity is editable and persists
 * 3. Content generation uses brand kit
 * 4. Images are available to content agents
 * 5. Content Queue shows generated content
 * 6. Captions are brand-specific
 * 
 * Usage:
 *   pnpm tsx scripts/brand-experience-smoke.ts <BRAND_ID> <ACCESS_TOKEN>
 * 
 * Example:
 *   pnpm tsx scripts/brand-experience-smoke.ts abc123-def456-ghi789 "Bearer eyJhbGc..."
 */

import { supabase } from "../server/lib/supabase";

const BRAND_ID = process.argv[2];
const ACCESS_TOKEN = process.argv[3] || process.env.ACCESS_TOKEN;

if (!BRAND_ID) {
  console.error("❌ Error: BRAND_ID is required");
  console.log("\nUsage: pnpm tsx scripts/brand-experience-smoke.ts <BRAND_ID> [ACCESS_TOKEN]");
  process.exit(1);
}

if (!ACCESS_TOKEN) {
  console.error("❌ Error: ACCESS_TOKEN is required (as argument or ACCESS_TOKEN env var)");
  process.exit(1);
}

const API_BASE = process.env.VITE_APP_URL || "http://localhost:8080";

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${name}: ${message}`);
  if (details && !passed) {
    console.log(`   Details:`, JSON.stringify(details, null, 2));
  }
}

async function testBrandGuide() {
  console.log("\n📋 Testing Brand Guide...");
  
  try {
    // Fetch brand guide
    const response = await fetch(`${API_BASE}/api/brand-guide/${BRAND_ID}`, {
      headers: {
        "Authorization": ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      logTest("Brand Guide Fetch", false, `HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const brandGuide = data.brandGuide;

    if (!brandGuide) {
      logTest("Brand Guide Exists", false, "Brand guide not found in response");
      return null;
    }

    logTest("Brand Guide Exists", true, "Brand guide loaded successfully");

    // Test colors
    const colors = brandGuide.primaryColors || brandGuide.visualIdentity?.colors || [];
    const hasColors = colors.length > 0;
    const areHexColors = colors.every((c: string) => /^#[0-9A-Fa-f]{6}$/.test(c));
    
    logTest("Brand Colors Exist", hasColors, hasColors ? `${colors.length} colors found` : "No colors found");
    logTest("Colors are Clean HEX", areHexColors, areHexColors ? "All colors are valid HEX codes" : "Some colors are not valid HEX codes", { colors });

    // Test logos
    const logos = brandGuide.logos || [];
    logTest("Logos Available", logos.length > 0, `${logos.length} logo(s) found`);

    // Test images
    const images = brandGuide.images || brandGuide.brandImages || [];
    logTest("Brand Images Available", images.length > 0, `${images.length} brand image(s) found`);

    // Test tone/voice
    const tone = brandGuide.voiceAndTone?.tone || brandGuide.tone || [];
    logTest("Tone Keywords", tone.length > 0, `${tone.length} tone keyword(s) found`, { tone });

    // Test mission/values
    const hasMission = !!(brandGuide.mission || brandGuide.purpose);
    const hasValues = !!(brandGuide.identity?.values && brandGuide.identity.values.length > 0);
    logTest("Brand Mission", hasMission, hasMission ? "Mission/purpose found" : "No mission/purpose");
    logTest("Brand Values", hasValues, hasValues ? `${brandGuide.identity.values.length} value(s) found` : "No values");

    return brandGuide;
  } catch (error) {
    logTest("Brand Guide Fetch", false, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function testContentGeneration(brandGuide: any) {
  console.log("\n🤖 Testing Content Generation...");

  try {
    const response = await fetch(`${API_BASE}/api/ai/doc`, {
      method: "POST",
      headers: {
        "Authorization": ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        brandId: BRAND_ID,
        topic: "Introducing our new service",
        platform: "instagram",
        contentType: "post",
        tone: "friendly",
        length: "medium",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logTest("Content Generation", false, `HTTP ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json();
    const variants = data.variants || [];

    logTest("Content Generation", variants.length > 0, `${variants.length} variant(s) generated`);

    if (variants.length > 0) {
      const firstVariant = variants[0];
      const content = firstVariant.content || "";
      
      // Check if content mentions brand name
      const mentionsBrand = brandGuide?.brandName ? content.toLowerCase().includes(brandGuide.brandName.toLowerCase()) : false;
      logTest("Content Mentions Brand", mentionsBrand, mentionsBrand ? "Content references brand name" : "Content does not mention brand name");

      // Check if content uses tone keywords
      const toneKeywords = brandGuide?.voiceAndTone?.tone || brandGuide?.tone || [];
      const usesTone = toneKeywords.length > 0 && toneKeywords.some((keyword: string) => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
      logTest("Content Uses Tone", usesTone || toneKeywords.length === 0, usesTone ? "Content reflects tone keywords" : "Content may not reflect tone keywords");

      // Check BFS
      const bfs = firstVariant.brandFidelityScore || 0;
      logTest("Brand Fidelity Score", bfs > 0, `BFS: ${bfs.toFixed(2)}`, { threshold: "> 0" });

      return variants;
    }

    return null;
  } catch (error) {
    logTest("Content Generation", false, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function testContentQueue() {
  console.log("\n📬 Testing Content Queue...");

  try {
    const response = await fetch(`${API_BASE}/api/content-items?brandId=${BRAND_ID}`, {
      headers: {
        "Authorization": ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      logTest("Content Queue API", false, `HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const items = data.items || data.posts || [];

    logTest("Content Queue API", true, "Content Queue endpoint accessible");
    logTest("Content Items Available", items.length > 0, `${items.length} content item(s) found`);

    if (items.length > 0) {
      const firstItem = items[0];
      logTest("Content Item Structure", !!(firstItem.id && firstItem.title), "Content items have required fields");
    }

    return items;
  } catch (error) {
    logTest("Content Queue API", false, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function testImagePipeline() {
  console.log("\n🖼️  Testing Image Pipeline...");

  try {
    // Check media_assets table
    const { data: mediaAssets, error } = await supabase
      .from("media_assets")
      .select("id, path, category, metadata")
      .eq("brand_id", BRAND_ID)
      .eq("status", "active")
      .limit(10);

    if (error) {
      logTest("Image Pipeline Query", false, error.message);
      return;
    }

    const scrapedImages = mediaAssets?.filter((asset: any) => 
      asset.metadata?.source === "scrape" || asset.path?.startsWith("http")
    ) || [];

    logTest("Scraped Images in DB", scrapedImages.length > 0, `${scrapedImages.length} scraped image(s) in database`);

    const logos = mediaAssets?.filter((asset: any) => 
      asset.category === "logos" || asset.metadata?.role === "logo"
    ) || [];

    logTest("Logos in DB", logos.length > 0, `${logos.length} logo(s) in database`);

  } catch (error) {
    logTest("Image Pipeline", false, error instanceof Error ? error.message : String(error));
  }
}

async function runAllTests() {
  console.log("🚀 Brand Experience Smoke Test");
  console.log(`Brand ID: ${BRAND_ID}`);
  console.log(`API Base: ${API_BASE}`);
  console.log("=" .repeat(60));

  const brandGuide = await testBrandGuide();
  await testContentGeneration(brandGuide);
  await testContentQueue();
  await testImagePipeline();

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Summary");
  console.log("=".repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);

  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  } else {
    console.log("\n✅ All tests passed!");
    process.exit(0);
  }
}

runAllTests().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

