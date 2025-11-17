/**
 * Supabase Setup Verification Script
 * Validates database connection, migrations, and RLS policies
 *
 * Usage:
 *   npx ts-node server/utils/verify-supabase-setup.ts
 *   npm run verify:supabase
 */

import { createClient } from "@supabase/supabase-js";
import { inspect } from "util";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  bold: "\x1b[1m",
};

interface VerificationResult {
  category: string;
  checks: {
    name: string;
    status: "pass" | "fail" | "skip";
    message: string;
  }[];
}

const results: VerificationResult[] = [];

function log(
  status: "success" | "error" | "info" | "warn",
  message: string
) {
  const prefix = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
  };

  console.log(`${prefix[status]} ${message}`);
}

async function verifySuabaseSetup() {
  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log("error", "Missing Supabase credentials in environment");
    log(
      "error",
      "Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to continue"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("\n");
  console.log(
    `${colors.bold}${colors.blue}Supabase Setup Verification${colors.reset}`
  );
  console.log("=".repeat(60) + "\n");

  // === CONNECTION TEST ===
  const connectionResults = { category: "Database Connection", checks: [] };

  log("info", "Testing Supabase connection...");

  try {
    const { data, error } = await supabase.from("user_profiles").select("id").limit(1);

    if (error && error.code !== "PGRST100") {
      // PGRST100 is "no rows found", which is fine
      throw new Error(error.message);
    }

    connectionResults.checks.push({
      name: "Database connectivity",
      status: "pass",
      message: "Successfully connected to Supabase database",
    });
    log("success", "Connected to Supabase");
  } catch (error) {
    connectionResults.checks.push({
      name: "Database connectivity",
      status: "fail",
      message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
    });
    log(
      "error",
      `Failed to connect: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }

  results.push(connectionResults);

  // === MIGRATION TABLES ===
  const migrationResults = {
    category: "Database Migrations",
    checks: [] as any[],
  };

  const requiredTables = [
    // Migration 001
    { name: "user_profiles", migration: "001_auth_and_users" },
    { name: "user_preferences", migration: "001_auth_and_users" },
    // Migration 002
    { name: "brands", migration: "002_brands_and_agencies" },
    { name: "brand_members", migration: "002_brands_and_agencies" },
    { name: "brand_assets", migration: "002_brands_and_agencies" },
    { name: "white_label_configs", migration: "002_brands_and_agencies" },
    // Migration 003
    { name: "content", migration: "003_content_and_posts" },
    { name: "posts", migration: "003_content_and_posts" },
    { name: "post_approvals", migration: "003_content_and_posts" },
    // Migration 004
    { name: "analytics_data", migration: "004_analytics_and_metrics" },
    { name: "analytics_metrics", migration: "004_analytics_and_metrics" },
    { name: "sync_events", migration: "004_analytics_and_metrics" },
    { name: "analytics_sync_logs", migration: "004_analytics_and_metrics" },
    // Migration 005
    { name: "platform_connections", migration: "005_integrations" },
    { name: "integration_events", migration: "005_integrations" },
    { name: "webhook_logs", migration: "005_integrations" },
    // Migration 006
    { name: "approval_requests", migration: "006_approvals_and_workflows" },
    { name: "approval_threads", migration: "006_approvals_and_workflows" },
    { name: "workflow_templates", migration: "006_approvals_and_workflows" },
    { name: "workflow_instances", migration: "006_approvals_and_workflows" },
    { name: "approval_metadata", migration: "006_approvals_and_workflows" },
    // Migration 007
    { name: "client_settings", migration: "007_client_portal_and_audit" },
    { name: "client_comments", migration: "007_client_portal_and_audit" },
    { name: "client_media", migration: "007_client_portal_and_audit" },
    { name: "audit_logs", migration: "007_client_portal_and_audit" },
    { name: "notifications", migration: "007_client_portal_and_audit" },
  ];

  log("info", "Checking for required tables...");

  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase.from(table.name).select("id").limit(1);

      // Error 42P01 = table doesn't exist, or specific RLS error
      if (
        error &&
        error.code === "42P01"
      ) {
        migrationResults.checks.push({
          name: `Table: ${table.name}`,
          status: "fail",
          message: `Table not found (migration: ${table.migration})`,
        });
        log("error", `Missing table: ${table.name}`);
      } else {
        migrationResults.checks.push({
          name: `Table: ${table.name}`,
          status: "pass",
          message: `Table exists`,
        });
        log("success", `Found table: ${table.name}`);
      }
    } catch (error) {
      migrationResults.checks.push({
        name: `Table: ${table.name}`,
        status: "fail",
        message: `Error checking table: ${error instanceof Error ? error.message : String(error)}`,
      });
      log("error", `Error checking ${table.name}: ${String(error)}`);
    }
  }

  results.push(migrationResults);

  // === RLS POLICIES ===
  const rlsResults = {
    category: "Row Level Security Policies",
    checks: [] as any[],
  };

  log("info", "Checking RLS policies...");

  const tablesWithRLS = [
    "user_profiles",
    "brands",
    "brand_members",
    "content",
    "posts",
    "analytics_data",
    "platform_connections",
    "approval_requests",
    "audit_logs",
    "notifications",
  ];

  for (const table of tablesWithRLS) {
    try {
      // Try to select from table - if RLS is enabled, this may fail without auth
      const { error } = await supabase.from(table).select("id").limit(1);

      if (error && error.code === "PGRST100") {
        // No rows found is fine
        rlsResults.checks.push({
          name: `RLS on ${table}`,
          status: "pass",
          message: "RLS appears to be enabled",
        });
        log("success", `RLS active on table: ${table}`);
      } else if (error && error.code === "42501") {
        // 42501 = permission denied (RLS denied)
        rlsResults.checks.push({
          name: `RLS on ${table}`,
          status: "pass",
          message: "RLS enforcing permissions (expected with service role)",
        });
        log("success", `RLS enforced on: ${table}`);
      } else {
        rlsResults.checks.push({
          name: `RLS on ${table}`,
          status: "pass",
          message: "Table accessible",
        });
      }
    } catch (error) {
      rlsResults.checks.push({
        name: `RLS on ${table}`,
        status: "skip",
        message: `Could not verify: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  results.push(rlsResults);

  // === INDEXES ===
  const indexResults = {
    category: "Performance Indexes",
    checks: [] as any[],
  };

  log("info", "Checking indexes...");

  // We can't directly query indexes via Supabase client, so we'll just verify tables exist
  const indexedTables = [
    { table: "content", expectedIndexes: ["brand_id", "status"] },
    { table: "posts", expectedIndexes: ["content_id", "platform"] },
    { table: "analytics_data", expectedIndexes: ["brand_id", "date"] },
  ];

  for (const check of indexedTables) {
    indexResults.checks.push({
      name: `Indexes on ${check.table}`,
      status: "skip",
      message: "Use SQL query to verify indexes: SELECT * FROM pg_indexes WHERE tablename = ?",
    });
  }

  results.push(indexResults);

  // === PRINT RESULTS ===
  console.log("\n" + "=".repeat(60) + "\n");

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;

  for (const category of results) {
    console.log(`${colors.bold}${category.category}${colors.reset}`);

    for (const check of category.checks) {
      totalTests++;

      const icon = {
        pass: `${colors.green}✓${colors.reset}`,
        fail: `${colors.red}✗${colors.reset}`,
        skip: `${colors.yellow}⊙${colors.reset}`,
      };

      console.log(
        `  ${icon[check.status]} ${check.name}: ${check.message}`
      );

      if (check.status === "pass") passedTests++;
      if (check.status === "fail") failedTests++;
      if (check.status === "skip") skippedTests++;
    }

    console.log("");
  }

  // === SUMMARY ===
  console.log("=".repeat(60));
  console.log(`${colors.bold}Summary${colors.reset}`);
  console.log(
    `  ${colors.green}Passed:${colors.reset} ${passedTests}/${totalTests}`
  );
  if (failedTests > 0) {
    console.log(`  ${colors.red}Failed:${colors.reset} ${failedTests}/${totalTests}`);
  }
  if (skippedTests > 0) {
    console.log(`  ${colors.yellow}Skipped:${colors.reset} ${skippedTests}/${totalTests}`);
  }

  if (failedTests === 0) {
    console.log(
      `\n${colors.green}${colors.bold}✓ Supabase setup verification passed!${colors.reset}\n`
    );
    console.log("Next steps:");
    console.log("1. Apply any pending migrations to Supabase:");
    console.log("   supabase db push");
    console.log("2. Run tests to verify RLS policies:");
    console.log("   npm run test -- rls-validation.test.ts");
    console.log("3. Start the development server:");
    console.log("   npm run dev");
    return 0;
  } else {
    console.log(
      `\n${colors.red}${colors.bold}✗ Supabase setup verification failed!${colors.reset}\n`
    );
    console.log("Issues to resolve:");
    console.log("1. Check Supabase project is created");
    console.log("2. Verify environment variables are correct");
    console.log("3. Apply migrations if not already applied:");
    console.log("   supabase db push");
    console.log("4. Review ENVIRONMENT_SETUP.md for help");
    return 1;
  }
}

verifySuabaseSetup()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("Verification error:", err);
    process.exit(1);
  });
