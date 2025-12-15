#!/usr/bin/env tsx
/**
 * Generate Build Metadata
 * 
 * Creates client/src/build-meta.json with:
 * - buildTime (ISO timestamp)
 * - gitSha (short commit hash)
 * - buildId (random fallback)
 * 
 * This file is imported by the app and rendered as DEPLOY_PROOF marker.
 */

import { execSync } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface BuildMeta {
  buildTime: string;
  gitSha: string;
  gitShortSha: string;
  buildId: string;
  nodeEnv: string;
}

function getGitSha(): { full: string; short: string } {
  try {
    const fullSha = execSync("git rev-parse HEAD", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    const shortSha = execSync("git rev-parse --short HEAD", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    return { full: fullSha, short: shortSha };
  } catch (error) {
    console.warn("⚠️  Git not available, using fallback SHA");
    return { full: "unknown", short: "unknown" };
  }
}

function generateBuildId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function main() {
  const buildTime = new Date().toISOString();
  const { full: gitSha, short: gitShortSha } = getGitSha();
  const buildId = generateBuildId();
  const nodeEnv = process.env.NODE_ENV || "development";

  const buildMeta: BuildMeta = {
    buildTime,
    gitSha,
    gitShortSha,
    buildId,
    nodeEnv,
  };

  const outputPath = `${__dirname}/../client/src/build-meta.json`;

  // Ensure directory exists
  mkdirSync(dirname(outputPath), { recursive: true });

  // Write metadata
  writeFileSync(outputPath, JSON.stringify(buildMeta, null, 2), "utf-8");

  console.log("✅ Build metadata generated:");
  console.log(`   buildTime: ${buildTime}`);
  console.log(`   gitSha: ${gitShortSha}`);
  console.log(`   buildId: ${buildId}`);
  console.log(`   nodeEnv: ${nodeEnv}`);
  console.log(`   → ${outputPath}`);
}

main();

