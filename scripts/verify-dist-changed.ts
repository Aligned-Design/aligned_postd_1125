#!/usr/bin/env tsx
/**
 * Verify Dist Changed
 * 
 * Verifies that a fresh build actually produces new dist/ output.
 * 
 * Steps:
 * 1. Delete dist/
 * 2. Run build
 * 3. Verify dist/ was created
 * 4. Show file timestamps and hashes
 * 
 * Exit codes:
 * 0 = success (dist changed)
 * 1 = error (dist not created or unchanged)
 */

import { execSync } from "child_process";
import { existsSync, readdirSync, statSync, readFileSync, rmSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_DIR = join(__dirname, "../dist");

function hashFile(filePath: string): string {
  try {
    const content = readFileSync(filePath);
    return createHash("sha256").update(content).digest("hex").substring(0, 16);
  } catch (error) {
    return "error";
  }
}

function getNewestFiles(dir: string, limit = 5): Array<{ path: string; mtime: Date }> {
  if (!existsSync(dir)) return [];

  const files: Array<{ path: string; mtime: Date }> = [];

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const stats = statSync(fullPath);
        files.push({ path: fullPath.replace(DIST_DIR + "/", ""), mtime: stats.mtime });
      }
    }
  }

  walk(dir);
  return files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime()).slice(0, limit);
}

function main() {
  console.log("🔍 Verifying dist/ build freshness\n");

  // Step 1: Check if dist exists before deletion
  const distExistedBefore = existsSync(DIST_DIR);
  if (distExistedBefore) {
    console.log("📁 dist/ exists, capturing state...");
    const beforeFiles = getNewestFiles(DIST_DIR, 3);
    console.log("   Newest files before:");
    beforeFiles.forEach((f) => {
      console.log(`   - ${f.path} (${f.mtime.toISOString()})`);
    });
  } else {
    console.log("📁 dist/ does not exist (clean state)");
  }

  // Step 2: Delete dist/
  console.log("\n🗑️  Deleting dist/...");
  try {
    if (existsSync(DIST_DIR)) {
      rmSync(DIST_DIR, { recursive: true, force: true });
      console.log("   ✅ dist/ deleted");
    }
  } catch (error) {
    console.error("   ❌ Failed to delete dist/:", error);
    process.exit(1);
  }

  // Step 3: Run build
  console.log("\n🔨 Running build...");
  try {
    execSync("pnpm run build", {
      stdio: "inherit",
      cwd: join(__dirname, ".."),
    });
    console.log("\n   ✅ Build completed");
  } catch (error) {
    console.error("\n   ❌ Build failed");
    process.exit(1);
  }

  // Step 4: Verify dist/ was created
  console.log("\n✅ Verifying dist/ output...");
  if (!existsSync(DIST_DIR)) {
    console.error("   ❌ dist/ was not created!");
    process.exit(1);
  }

  // Step 5: Show newest files
  const afterFiles = getNewestFiles(DIST_DIR, 5);
  console.log(`   ✅ dist/ created with ${afterFiles.length} files`);
  console.log("\n📦 Newest files in dist/:");
  afterFiles.forEach((f, i) => {
    console.log(`   ${i + 1}. ${f.path}`);
    console.log(`      mtime: ${f.mtime.toISOString()}`);
  });

  // Step 6: Hash index.html (if exists)
  const indexPath = join(DIST_DIR, "index.html");
  if (existsSync(indexPath)) {
    const indexHash = hashFile(indexPath);
    console.log(`\n🔐 dist/index.html hash: ${indexHash}`);
  }

  // Step 7: Check for build-meta.json in output
  const buildMetaPath = join(DIST_DIR, "assets");
  if (existsSync(buildMetaPath)) {
    const assetFiles = readdirSync(buildMetaPath);
    const jsFiles = assetFiles.filter((f) => f.endsWith(".js"));
    console.log(`\n📄 JavaScript bundles: ${jsFiles.length} files`);
    jsFiles.slice(0, 3).forEach((f) => {
      console.log(`   - ${f}`);
    });
  }

  console.log("\n✅ Verification complete: dist/ was freshly built\n");
  process.exit(0);
}

main();

