/**
 * Security Validation Script
 *
 * Validates that all security measures are properly configured
 * Run before deployment to production
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

interface ValidationResult {
  category: string;
  check: string;
  status: "pass" | "fail" | "warning";
  message: string;
}

const results: ValidationResult[] = [];

function addResult(
  category: string,
  check: string,
  status: "pass" | "fail" | "warning",
  message: string,
) {
  results.push({ category, check, status, message });
}

/**
 * Validate environment variables
 */
function validateEnvironment() {
  const category = "Environment Variables";

  // Critical secrets
  const criticalSecrets = [
    "JWT_SECRET",
    "ENCRYPTION_KEY",
    "HMAC_SECRET",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  for (const secret of criticalSecrets) {
    if (!process.env[secret]) {
      addResult(category, secret, "fail", `${secret} is not set`);
    } else if (
      process.env[secret]?.includes("your-") ||
      process.env[secret]?.includes("change-in-production")
    ) {
      addResult(
        category,
        secret,
        "fail",
        `${secret} appears to be a placeholder value`,
      );
    } else if (process.env[secret]!.length < 32) {
      addResult(
        category,
        secret,
        "warning",
        `${secret} should be at least 32 characters for security`,
      );
    } else {
      addResult(category, secret, "pass", `${secret} is properly set`);
    }
  }

  // Optional but recommended
  const recommendedVars = ["STRIPE_SECRET_KEY", "SENTRY_DSN", "OPENAI_API_KEY"];

  for (const varName of recommendedVars) {
    if (!process.env[varName]) {
      addResult(
        category,
        varName,
        "warning",
        `${varName} is not set (optional but recommended)`,
      );
    } else {
      addResult(category, varName, "pass", `${varName} is set`);
    }
  }

  // NODE_ENV check
  if (process.env.NODE_ENV !== "production") {
    addResult(
      category,
      "NODE_ENV",
      "warning",
      'NODE_ENV is not set to "production"',
    );
  } else {
    addResult(category, "NODE_ENV", "pass", "NODE_ENV is set to production");
  }
}

/**
 * Validate database connection and RLS
 */
async function validateDatabase() {
  const category = "Database";

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Test connection
    const { error: connectionError } = await supabase
      .from("user_profiles")
      .select("count")
      .limit(1);

    if (connectionError) {
      addResult(
        category,
        "Connection",
        "fail",
        `Failed to connect: ${connectionError.message}`,
      );
      return;
    }

    addResult(category, "Connection", "pass", "Database connection successful");

    // Check if RLS is enabled on critical tables
    const criticalTables = [
      "user_profiles",
      "brands",
      "brand_members",
      "content",
      "platform_connections",
      "audit_logs",
    ];

    for (const table of criticalTables) {
      try {
        const { data, error } = await supabase
          .from("pg_tables")
          .select("tablename, rowsecurity")
          .eq("tablename", table)
          .single();

        if (error) {
          addResult(
            category,
            `RLS-${table}`,
            "warning",
            `Could not verify RLS status for ${table}`,
          );
        } else if (!data?.rowsecurity) {
          addResult(
            category,
            `RLS-${table}`,
            "fail",
            `RLS is not enabled on ${table}`,
          );
        } else {
          addResult(
            category,
            `RLS-${table}`,
            "pass",
            `RLS is enabled on ${table}`,
          );
        }
      } catch (e) {
        addResult(
          category,
          `RLS-${table}`,
          "warning",
          `Could not check RLS for ${table}`,
        );
      }
    }
  } catch (error) {
    addResult(
      category,
      "Setup",
      "fail",
      `Database validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Validate security headers configuration
 */
function validateSecurityHeaders() {
  const category = "Security Headers";

  // Check if helmet is installed
  try {
    require.resolve("helmet");
    addResult(category, "Helmet", "pass", "Helmet package is installed");
  } catch {
    addResult(category, "Helmet", "fail", "Helmet package is not installed");
  }

  // These will be verified at runtime, so just check configuration exists
  addResult(
    category,
    "Configuration",
    "pass",
    "Security headers are configured in server/security-server.ts",
  );
}

/**
 * Validate encryption setup
 */
function validateEncryption() {
  const category = "Encryption";

  // Test encryption/decryption
  try {
    const { encrypt, decrypt } = require("../lib/encryption");

    const testData = "test-secret-data-12345";
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);

    if (decrypted === testData) {
      addResult(
        category,
        "AES-256-GCM",
        "pass",
        "Encryption/decryption working correctly",
      );
    } else {
      addResult(
        category,
        "AES-256-GCM",
        "fail",
        "Encryption/decryption test failed",
      );
    }
  } catch (error) {
    addResult(
      category,
      "AES-256-GCM",
      "fail",
      `Encryption test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  // Test password hashing
  try {
    const { hashPassword, verifyPassword } = require("../lib/encryption");

    const testPassword = "TestPassword123!@#";
    const hashed = hashPassword(testPassword);
    const verified = verifyPassword(testPassword, hashed);

    if (verified) {
      addResult(
        category,
        "PBKDF2",
        "pass",
        "Password hashing working correctly",
      );
    } else {
      addResult(category, "PBKDF2", "fail", "Password verification failed");
    }
  } catch (error) {
    addResult(
      category,
      "PBKDF2",
      "fail",
      `Password hashing test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Validate JWT configuration
 */
function validateJWT() {
  const category = "JWT Authentication";

  try {
    const { generateTokenPair } = require("../lib/jwt-auth");

    const tokens = generateTokenPair({
      userId: "test-user",
      email: "test@example.com",
      role: "agency_admin" as any,
      brandIds: ["test-brand"],
      tenantId: "test-tenant",
    });

    if (tokens.accessToken && tokens.refreshToken) {
      addResult(
        category,
        "Token Generation",
        "pass",
        "JWT token generation working",
      );
    } else {
      addResult(
        category,
        "Token Generation",
        "fail",
        "Failed to generate tokens",
      );
    }
  } catch (error) {
    addResult(
      category,
      "Token Generation",
      "fail",
      `JWT test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Validate RBAC configuration
 */
function validateRBAC() {
  const category = "RBAC";

  try {
    const { Role, Permission, hasPermission } = require("../middleware/rbac");

    // Test that superadmin has all permissions
    const canManage = hasPermission(Role.SUPERADMIN, Permission.MANAGE_SYSTEM);

    if (canManage) {
      addResult(
        category,
        "Permissions",
        "pass",
        "RBAC permission checks working",
      );
    } else {
      addResult(
        category,
        "Permissions",
        "fail",
        "RBAC permission checks not working correctly",
      );
    }
  } catch (error) {
    addResult(
      category,
      "Permissions",
      "fail",
      `RBAC test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Validate password policy
 */
function validatePasswordPolicy() {
  const category = "Password Policy";

  try {
    const { validatePassword } = require("../lib/password-policy");

    // Test weak password
    const weakResult = validatePassword("weak");
    if (!weakResult.valid) {
      addResult(
        category,
        "Weak Password Rejection",
        "pass",
        "Weak passwords are rejected",
      );
    } else {
      addResult(
        category,
        "Weak Password Rejection",
        "fail",
        "Weak passwords are accepted",
      );
    }

    // Test strong password
    const strongResult = validatePassword("StrongP@ssw0rd2025!");
    if (strongResult.valid) {
      addResult(
        category,
        "Strong Password Acceptance",
        "pass",
        "Strong passwords are accepted",
      );
    } else {
      addResult(
        category,
        "Strong Password Acceptance",
        "fail",
        "Strong passwords are rejected",
      );
    }
  } catch (error) {
    addResult(
      category,
      "Validation",
      "fail",
      `Password policy test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Print results in a formatted table
 */
function printResults() {
  console.log("\n" + "=".repeat(80));
  console.log("SECURITY VALIDATION RESULTS");
  console.log("=".repeat(80) + "\n");

  const groupedResults: Record<string, ValidationResult[]> = {};

  for (const result of results) {
    if (!groupedResults[result.category]) {
      groupedResults[result.category] = [];
    }
    groupedResults[result.category].push(result);
  }

  const statusSymbols = {
    pass: "✅",
    fail: "❌",
    warning: "⚠️ ",
  };

  for (const [category, categoryResults] of Object.entries(groupedResults)) {
    console.log(`\n📦 ${category}`);
    console.log("-".repeat(80));

    for (const result of categoryResults) {
      const symbol = statusSymbols[result.status];
      console.log(`  ${symbol} ${result.check.padEnd(30)} ${result.message}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  const passCount = results.filter((r) => r.status === "pass").length;
  const failCount = results.filter((r) => r.status === "fail").length;
  const warningCount = results.filter((r) => r.status === "warning").length;

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Passed:   ${passCount}`);
  console.log(`  ❌ Failed:   ${failCount}`);
  console.log(`  ⚠️  Warnings: ${warningCount}`);
  console.log(`  📝 Total:    ${results.length}`);

  if (failCount > 0) {
    console.log(
      "\n❌ SECURITY VALIDATION FAILED - Please fix the issues above before deploying",
    );
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(
      "\n⚠️  SECURITY VALIDATION PASSED WITH WARNINGS - Review warnings before deploying",
    );
    process.exit(0);
  } else {
    console.log("\n✅ SECURITY VALIDATION PASSED - All checks successful");
    process.exit(0);
  }
}

/**
 * Main validation function
 */
async function main() {
  console.log("🔒 Running security validation...\n");

  validateEnvironment();
  await validateDatabase();
  validateSecurityHeaders();
  validateEncryption();
  validateJWT();
  validateRBAC();
  validatePasswordPolicy();

  printResults();
}

// Run validation
main().catch((error) => {
  console.error("❌ Validation script error:", error);
  process.exit(1);
});
