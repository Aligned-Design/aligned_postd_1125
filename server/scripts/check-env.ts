#!/usr/bin/env tsx
/**
 * Environment Variable Sanity Check
 * 
 * Verifies that all required environment variables are present.
 * Run with: pnpm run check:env
 */

import "dotenv/config";

// ============================================================================
// Required Environment Variables
// ============================================================================

const REQUIRED_VARS = [
  // AI Providers (at least one required)
  { key: "OPENAI_API_KEY", required: false, group: "AI" },
  { key: "ANTHROPIC_API_KEY", required: false, group: "AI" },
  
  // Supabase (all required)
  { key: "SUPABASE_URL", required: true, group: "Supabase" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", required: true, group: "Supabase" },
  { key: "VITE_SUPABASE_URL", required: true, group: "Supabase" },
  { key: "VITE_SUPABASE_ANON_KEY", required: true, group: "Supabase" },
];

const OPTIONAL_VARS = [
  // Server
  { key: "NODE_ENV", group: "Server" },
  { key: "PORT", group: "Server" },
  { key: "JWT_SECRET", group: "Server" },
  { key: "VITE_APP_URL", group: "Server" },
  
  // Email
  { key: "SENDGRID_API_KEY", group: "Email" },
  { key: "EMAIL_FROM_ADDRESS", group: "Email" },
  
  // Monitoring
  { key: "VITE_ANALYTICS_ID", group: "Monitoring" },
  { key: "VITE_ENABLE_SENTRY", group: "Monitoring" },
];

// ============================================================================
// Check Functions
// ============================================================================

function checkVar(key: string): { present: boolean; masked: string } {
  const value = process.env[key];
  const present = !!value && value.trim() !== "";
  
  // Mask the value for display (show first 4 and last 4 chars)
  let masked = "";
  if (present && value) {
    if (value.length > 12) {
      masked = `${value.slice(0, 4)}...${value.slice(-4)}`;
    } else {
      masked = "***";
    }
  }
  
  return { present, masked };
}

function printSection(title: string) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`  ${title}`);
  console.log(`${"─".repeat(50)}`);
}

// ============================================================================
// Main
// ============================================================================

console.log("\n🔍 POSTD Environment Variable Check\n");

// Check required variables
printSection("REQUIRED VARIABLES");

let hasAIProvider = false;
const missingRequired: string[] = [];

for (const { key, required, group } of REQUIRED_VARS) {
  const { present, masked } = checkVar(key);
  const icon = present ? "✅" : (required ? "❌" : "⚠️");
  const status = present ? `present (${masked})` : "missing";
  
  console.log(`  ${icon} ${key.padEnd(30)} ${status}`);
  
  // Track AI providers
  if (group === "AI" && present) {
    hasAIProvider = true;
  }
  
  // Track missing required
  if (required && !present) {
    missingRequired.push(key);
  }
}

// Check at least one AI provider
if (!hasAIProvider) {
  console.log(`\n  ⚠️  WARNING: No AI provider configured!`);
  console.log(`     Set either OPENAI_API_KEY or ANTHROPIC_API_KEY`);
  console.log(`     Content generation will fail without an AI provider.`);
}

// Check optional variables
printSection("OPTIONAL VARIABLES");

let currentGroup = "";
for (const { key, group } of OPTIONAL_VARS) {
  if (group !== currentGroup) {
    if (currentGroup !== "") console.log("");
    console.log(`  [${group}]`);
    currentGroup = group;
  }
  
  const { present, masked } = checkVar(key);
  const icon = present ? "✅" : "○";
  const status = present ? `present (${masked})` : "not set";
  
  console.log(`    ${icon} ${key.padEnd(28)} ${status}`);
}

// Summary
printSection("SUMMARY");

const allRequiredPresent = missingRequired.length === 0;
const fullyConfigured = allRequiredPresent && hasAIProvider;

if (fullyConfigured) {
  console.log("  ✅ All required variables are configured!");
  console.log("  ✅ AI provider is configured!");
  console.log("\n  🚀 Ready to run POSTD!\n");
} else {
  if (missingRequired.length > 0) {
    console.log(`  ❌ Missing required variables: ${missingRequired.join(", ")}`);
  }
  if (!hasAIProvider) {
    console.log("  ⚠️  No AI provider configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)");
  }
  console.log("\n  📝 Copy .env.example to .env.local and fill in values\n");
  process.exit(1);
}

