#!/usr/bin/env tsx
import "dotenv/config";
import { supabase } from "../server/lib/supabase";

async function main() {
  const brandId = "aaaaaaaa-bbbb-cccc-dddd-222222222222";

  const { data: images } = await supabase
    .from("media_assets")
    .select("path, metadata, created_at")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: true })
    .limit(15);

  if (!images) {
    console.log("No images found");
    return;
  }

  console.log(`\nFound ${images.length} images for Squarespace brand:\n`);

  images.forEach((img, idx) => {
    const meta = img.metadata as any;
    const filename = img.path.split("/").pop() || "unknown";
    
    console.log(`${idx + 1}. ${meta?.role || "unknown"}`);
    console.log(`   URL: ${img.path.substring(0, 80)}...`);
    console.log(`   Filename: ${filename.substring(0, 60)}`);
    console.log(`   Alt: ${meta?.alt || "N/A"}`);
    console.log(`   Dimensions: ${meta?.width || "?"}x${meta?.height || "?"}`);
    console.log(`   Source: ${meta?.source || "N/A"}`);
    console.log();
  });
}

main().catch(console.error);

