#!/usr/bin/env tsx
/**
 * Check that lint warnings don't increase beyond baseline
 * 
 * Usage:
 *   pnpm check:lint-baseline
 *   
 * Exit codes:
 *   0 - Warnings within baseline
 *   1 - Warnings increased beyond baseline
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface LintBaseline {
  warningCount: number;
  errorCount: number;
  lastUpdated: string;
  allowedIncrease: number;
}

function main() {
  console.log("🔍 Checking lint against baseline...\n");

  // Read baseline
  const baselinePath = join(__dirname, "..", "tools", "lint-baseline.json");
  let baseline: LintBaseline;
  
  try {
    baseline = JSON.parse(readFileSync(baselinePath, "utf-8"));
  } catch (error) {
    console.error("❌ Could not read lint baseline file");
    console.error("   Expected at: tools/lint-baseline.json");
    process.exit(1);
  }

  // Run lint and capture output
  let lintOutput: string;
  try {
    lintOutput = execSync("pnpm lint 2>&1", {
      encoding: "utf-8",
      cwd: join(__dirname, ".."),
    });
  } catch (error: any) {
    // Lint may exit with error code if there are violations
    lintOutput = error.stdout || error.output?.join("") || "";
  }

  // Parse lint output for problem count
  const problemsMatch = lintOutput.match(/✖ (\d+) problems? \((\d+) errors?, (\d+) warnings?\)/);
  
  if (!problemsMatch) {
    console.error("❌ Could not parse lint output");
    console.error("   Lint may have failed or changed format");
    process.exit(1);
  }

  const [, totalProblems, errors, warnings] = problemsMatch;
  const currentWarnings = parseInt(warnings, 10);
  const currentErrors = parseInt(errors, 10);

  console.log(`Baseline: ${baseline.warningCount} warnings, ${baseline.errorCount} errors`);
  console.log(`Current:  ${currentWarnings} warnings, ${currentErrors} errors`);
  console.log();

  // Check errors (must be 0)
  if (currentErrors > baseline.errorCount) {
    console.error("❌ FAIL: Lint errors increased!");
    console.error(`   Baseline: ${baseline.errorCount} errors`);
    console.error(`   Current:  ${currentErrors} errors`);
    console.error(`   Increase: +${currentErrors - baseline.errorCount}`);
    process.exit(1);
  }

  // Check warnings
  const maxAllowed = baseline.warningCount + baseline.allowedIncrease;
  
  if (currentWarnings > maxAllowed) {
    console.error("❌ FAIL: Lint warnings increased beyond baseline!");
    console.error(`   Baseline:     ${baseline.warningCount} warnings`);
    console.error(`   Max allowed:  ${maxAllowed} warnings`);
    console.error(`   Current:      ${currentWarnings} warnings`);
    console.error(`   Increase:     +${currentWarnings - baseline.warningCount}`);
    console.error();
    console.error("   Fix the new warnings or update the baseline with justification.");
    process.exit(1);
  }

  if (currentWarnings < baseline.warningCount) {
    console.log("✅ SUCCESS: Lint warnings DECREASED!");
    console.log(`   Reduced by: ${baseline.warningCount - currentWarnings}`);
    console.log("   Consider updating the baseline to lock in this improvement.");
  } else if (currentWarnings === baseline.warningCount) {
    console.log("✅ SUCCESS: Lint warnings at baseline (no increase)");
  } else {
    console.log(`⚠️  WARNING: Lint warnings increased by ${currentWarnings - baseline.warningCount}`);
    console.log(`   Still within allowed increase of ${baseline.allowedIncrease}`);
  }

  process.exit(0);
}

main();

