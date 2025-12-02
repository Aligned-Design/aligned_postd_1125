/**
 * Crawler QA Script
 * ------------------
 * Runs the crawler against 5 test websites (Squarespace, Wix, WordPress, Optimizely)
 * and prints a compact summary for each:
 *   - Selected logo URLs
 *   - Primary color palette
 *   - About blurb length + preview
 *
 * This helps quickly verify that the crawler is producing:
 *   - Accurate brand logos
 *   - UI-based color palettes
 *   - Solid brand summaries
 */

import { crawlWebsite, extractColors, selectBrandLogos, generateBrandKit } from "../server/workers/brand-crawler";
import { createClient } from "@supabase/supabase-js";

const TEST_SITES = [
  { brandId: "qa-1", url: "https://aligned-bydesign.com", label: "Squarespace (ABD)" },
  { brandId: "qa-2", url: "https://www.hurricanebeachcarwash.com/", label: "Wix (Hurricane Beach)" },
  { brandId: "qa-3", url: "https://www.westechsupply.com/", label: "Wix (Westech Supply)" },
  { brandId: "qa-4", url: "https://1-spine.com/", label: "WordPress (1Spine)" },
  { brandId: "qa-5", url: "https://www.connectinvest.com/", label: "Optimizely (Connect Invest)" },
];

// Dummy Supabase (required for brand kit, but embeddings are non-critical)
const supabase = createClient("https://example.supabase.co", "public-anon-key");

async function runTest(site: { brandId: string; url: string; label: string }) {
  console.log(`\n\n==============================`);
  console.log(`🚀 Running crawler QA for: ${site.label}`);
  console.log(`URL: ${site.url}`);
  console.log(`==============================`);

  try {
    // 1. Crawl pages
    const pages = await crawlWebsite(site.url);
    console.log(`• Pages Crawled: ${pages.length}`);

    // 2. Extract colors
    const colors = await extractColors(site.url);

    // 3. Select brand logos
    const logos = selectBrandLogos(pages);
    const logoUrls = logos.map(l => l.url);

    // 4. Generate brand kit (AI summary, keywords, etc.)
    const brandKit = await generateBrandKit(pages, colors, site.url);

    // 5. Print summary
    console.log(`\n🖼️  Logo(s) Selected:`);
    if (logoUrls.length === 0) console.log("  - ❌ NONE FOUND");
    else logoUrls.forEach((l, i) => console.log(`  ${i + 1}. ${l.slice(0, 110)}`));

    console.log(`\n🎨 Color Palette:`);
    console.log(`  Primary:   ${colors.primary}`);
    console.log(`  Secondary: ${colors.secondary}`);
    console.log(`  Accent:    ${colors.accent}`);
    console.log(`  All Colors:`, colors.allColors);

    console.log(`\n📝 About Blurb:`);
    console.log(`  Length: ${brandKit.about_blurb.length}`);
    console.log(`  Preview: "${brandKit.about_blurb.slice(0, 120)}..."`);

    console.log(`\n✅ Finished: ${site.label}`);
  } catch (error) {
    console.log(`\n❌ ERROR running crawler for ${site.url}`);
    console.error(error);
  }
}

async function main() {
  console.log("\n\n==============================");
  console.log("🔥 CRAWLER QA TEST RUN STARTING");
  console.log("==============================");

  for (const site of TEST_SITES) {
    await runTest(site);
  }

  console.log("\n\n==============================");
  console.log("🚀 QA COMPLETE");
  console.log("==============================\n\n");
}

main();

