/**
 * Environment Variable Validation Script
 * Validates all required environment variables and tests connectivity
 *
 * Usage:
 *   npx ts-node server/utils/validate-env.ts
 *   npm run validate:env
 */

import * as fs from "fs";
import * as path from "path";

// ANSI color codes for output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  bold: "\x1b[1m",
};

interface EnvValidator {
  name: string;
  required: boolean;
  validate: (value: string) => { valid: boolean; message?: string };
}

// Validation rules for environment variables
const validators: Record<string, EnvValidator> = {
  // Core Services
  VITE_SUPABASE_URL: {
    name: "Supabase URL",
    required: true,
    validate: (val) => ({
      valid: val.startsWith("https://") && val.includes("supabase.co"),
      message: "Should be https://[project].supabase.co",
    }),
  },
  VITE_SUPABASE_ANON_KEY: {
    name: "Supabase Anon Key",
    required: true,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid JWT-like string",
    }),
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    name: "Supabase Service Role Key",
    required: true,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid JWT-like string",
    }),
  },

  // AI Providers
  OPENAI_API_KEY: {
    name: "OpenAI API Key",
    required: false,
    validate: (val) => {
      // Check if accidentally set to Anthropic key
      if (val.startsWith("sk-ant-") || val.startsWith("k-ant-")) {
        return {
          valid: false,
          message: "ERROR: Set to Anthropic key! Use 'sk-' prefix for OpenAI or leave empty if not using OpenAI",
        };
      }
      return {
        valid: val.startsWith("sk-"),
        message: "Should start with 'sk-' (OpenAI format) or leave empty if using Anthropic only",
      };
    },
  },
  ANTHROPIC_API_KEY: {
    name: "Anthropic API Key",
    required: false,
    validate: (val) => ({
      valid: val.startsWith("sk-ant-"),
      message: "Should start with 'sk-ant-'",
    }),
  },
  ANTHROPIC_MODEL: {
    name: "Anthropic Model",
    required: false,
    validate: (val) => ({
      valid: val.length > 5 && (val.includes("claude") || val.includes("sonnet") || val.includes("haiku") || val.includes("opus")),
      message: "Should be a valid Claude model name (e.g., claude-3-5-sonnet-latest)",
    }),
  },

  // Application Config
  NODE_ENV: {
    name: "Node Environment",
    required: true,
    validate: (val) => ({
      valid: ["development", "staging", "production"].includes(val),
      message: "Should be: development, staging, or production",
    }),
  },
  // ✅ DEPRECATED: USE_MOCKS has been removed from production code
  // This validation warns if USE_MOCKS is set (it should not be used)
  USE_MOCKS: {
    name: "Use Mocks (DEPRECATED)",
    required: false,
    validate: (val) => {
      const isProduction = process.env.NODE_ENV === "production";
      if (isProduction && val === "true") {
        return {
          valid: false,
          message: "⚠️  WARNING: USE_MOCKS=true in production is not allowed. Mock data has been removed from production code.",
        };
      }
      return {
        valid: true,
        message: "USE_MOCKS is deprecated and no longer used. Remove this variable.",
      };
    },
  },
  PORT: {
    name: "Application Port",
    required: false,
    validate: (val) => ({
      valid: /^\d+$/.test(val) && parseInt(val) > 1000,
      message: "Should be a number > 1000",
    }),
  },
  VITE_APP_URL: {
    name: "App URL",
    required: true,
    validate: (val) => ({
      valid: val.startsWith("http://") || val.startsWith("https://"),
      message: "Should be a valid HTTP(S) URL",
    }),
  },
  VITE_API_BASE_URL: {
    name: "API Base URL",
    required: true,
    validate: (val) => ({
      valid: val.startsWith("http://") || val.startsWith("https://"),
      message: "Should be a valid HTTP(S) URL",
    }),
  },

  // Builder.io
  VITE_BUILDER_PUBLIC_KEY: {
    name: "Builder.io Public Key",
    required: false,
    validate: (val) => ({
      valid: val.length > 5,
      message: "Should be a valid public key",
    }),
  },
  BUILDER_PRIVATE_KEY: {
    name: "Builder.io Private Key",
    required: false,
    validate: (val) => ({
      valid: val.length > 5,
      message: "Should be a valid private key",
    }),
  },

  // Email Service
  SENDGRID_API_KEY: {
    name: "SendGrid API Key",
    required: false,
    validate: (val) => ({
      valid: val.startsWith("SG."),
      message: "Should start with 'SG.'",
    }),
  },
  EMAIL_FROM_ADDRESS: {
    name: "From Email Address",
    required: false,
    validate: (val) => ({
      valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      message: "Should be a valid email address",
    }),
  },

  // Social Media - Instagram
  INSTAGRAM_BUSINESS_ACCOUNT_ID: {
    name: "Instagram Business Account ID",
    required: false,
    validate: (val) => ({
      valid: /^\d+$/.test(val),
      message: "Should be a numeric ID",
    }),
  },
  INSTAGRAM_ACCESS_TOKEN: {
    name: "Instagram Access Token",
    required: false,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid access token",
    }),
  },

  // Social Media - Facebook
  FACEBOOK_PAGE_ID: {
    name: "Facebook Page ID",
    required: false,
    validate: (val) => ({
      valid: /^\d+$/.test(val),
      message: "Should be a numeric ID",
    }),
  },
  FACEBOOK_ACCESS_TOKEN: {
    name: "Facebook Access Token",
    required: false,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid access token",
    }),
  },

  // Social Media - Twitter
  TWITTER_API_KEY: {
    name: "Twitter API Key",
    required: false,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid API key",
    }),
  },
  TWITTER_API_SECRET: {
    name: "Twitter API Secret",
    required: false,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid API secret",
    }),
  },
  TWITTER_BEARER_TOKEN: {
    name: "Twitter Bearer Token",
    required: false,
    validate: (val) => ({
      valid: val.startsWith("Bearer ") || val.length > 50,
      message: "Should be a valid bearer token",
    }),
  },
  TWITTER_ACCOUNT_ID: {
    name: "Twitter Account ID",
    required: false,
    validate: (val) => ({
      valid: /^\d+$/.test(val),
      message: "Should be a numeric ID",
    }),
  },

  // Social Media - TikTok
  TIKTOK_CLIENT_KEY: {
    name: "TikTok OAuth Client Key",
    required: false,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid client key",
    }),
  },
  TIKTOK_CLIENT_SECRET: {
    name: "TikTok OAuth Client Secret",
    required: false,
    validate: (val) => ({
      valid: val.length > 20,
      message: "Should be a valid secret string (>20 chars)",
    }),
  },
  TIKTOK_REDIRECT_URI: {
    name: "TikTok OAuth Redirect URI",
    required: false,
    validate: (val) => ({
      valid: val.startsWith("http://") || val.startsWith("https://"),
      message: "Should be a valid HTTP(S) URL",
    }),
  },
  TIKTOK_BUSINESS_ACCOUNT_ID: {
    name: "TikTok Business Account ID",
    required: false,
    validate: (val) => ({
      valid: val.length > 5,
      message: "Should be a valid account ID",
    }),
  },
  TIKTOK_ACCESS_TOKEN: {
    name: "TikTok Access Token",
    required: false,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid access token",
    }),
  },

  // Social Media - LinkedIn
  LINKEDIN_ORGANIZATION_ID: {
    name: "LinkedIn Organization ID",
    required: false,
    validate: (val) => ({
      valid: /^\d+$/.test(val),
      message: "Should be a numeric ID",
    }),
  },
  LINKEDIN_ACCESS_TOKEN: {
    name: "LinkedIn Access Token",
    required: false,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid access token",
    }),
  },

  // Social Media - Pinterest
  PINTEREST_BUSINESS_ACCOUNT_ID: {
    name: "Pinterest Business Account ID",
    required: false,
    validate: (val) => ({
      valid: val.length > 5,
      message: "Should be a valid account ID",
    }),
  },
  PINTEREST_ACCESS_TOKEN: {
    name: "Pinterest Access Token",
    required: false,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid access token",
    }),
  },

  // Social Media - YouTube
  YOUTUBE_CHANNEL_ID: {
    name: "YouTube Channel ID",
    required: false,
    validate: (val) => ({
      valid: val.startsWith("UC"),
      message: "Should start with 'UC'",
    }),
  },
  YOUTUBE_API_KEY: {
    name: "YouTube API Key",
    required: false,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid API key",
    }),
  },

  // Social Media - Google Business
  GOOGLE_BUSINESS_ACCOUNT_ID: {
    name: "Google Business Account ID",
    required: false,
    validate: (val) => ({
      valid: val.length > 5,
      message: "Should be a valid account ID",
    }),
  },
  GOOGLE_API_KEY: {
    name: "Google API Key",
    required: false,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid API key",
    }),
  },

  // Social Media - Snapchat
  SNAPCHAT_BUSINESS_ACCOUNT_ID: {
    name: "Snapchat Business Account ID",
    required: false,
    validate: (val) => ({
      valid: val.length > 5,
      message: "Should be a valid account ID",
    }),
  },
  SNAPCHAT_ACCESS_TOKEN: {
    name: "Snapchat Access Token",
    required: false,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid access token",
    }),
  },

  // Socket.io
  SOCKETIO_CORS_ORIGIN: {
    name: "Socket.io CORS Origin",
    required: false,
    validate: (val) => ({
      valid: val.startsWith("http://") || val.startsWith("https://"),
      message: "Should be a valid HTTP(S) URL",
    }),
  },

  // OAuth Credentials - CRITICAL for production
  FACEBOOK_CLIENT_ID: {
    name: "Facebook OAuth Client ID",
    required: false,
    validate: (val) => ({
      valid: /^\d+$/.test(val),
      message: "Should be a numeric app ID",
    }),
  },
  FACEBOOK_CLIENT_SECRET: {
    name: "Facebook OAuth Client Secret",
    required: false,
    validate: (val) => ({
      valid: val.length > 20,
      message: "Should be a valid secret string (>20 chars)",
    }),
  },
  META_CLIENT_ID: {
    name: "Meta OAuth Client ID",
    required: false,
    validate: (val) => ({
      valid: /^\d+$/.test(val),
      message: "Should be a numeric app ID",
    }),
  },
  META_CLIENT_SECRET: {
    name: "Meta OAuth Client Secret",
    required: false,
    validate: (val) => ({
      valid: val.length > 20,
      message: "Should be a valid secret string (>20 chars)",
    }),
  },
  INSTAGRAM_CLIENT_ID: {
    name: "Instagram OAuth Client ID",
    required: false,
    validate: (val) => ({
      valid: /^\d+$/.test(val),
      message: "Should be a numeric app ID",
    }),
  },
  INSTAGRAM_CLIENT_SECRET: {
    name: "Instagram OAuth Client Secret",
    required: false,
    validate: (val) => ({
      valid: val.length > 20,
      message: "Should be a valid secret string (>20 chars)",
    }),
  },
  LINKEDIN_CLIENT_ID: {
    name: "LinkedIn OAuth Client ID",
    required: false,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid client ID",
    }),
  },
  LINKEDIN_CLIENT_SECRET: {
    name: "LinkedIn OAuth Client Secret",
    required: false,
    validate: (val) => ({
      valid: val.length > 20,
      message: "Should be a valid secret string (>20 chars)",
    }),
  },
  TWITTER_CLIENT_ID: {
    name: "Twitter OAuth Client ID",
    required: false,
    validate: (val) => ({
      valid: val.length > 10,
      message: "Should be a valid client ID",
    }),
  },
  TWITTER_CLIENT_SECRET: {
    name: "Twitter OAuth Client Secret",
    required: false,
    validate: (val) => ({
      valid: val.length > 20,
      message: "Should be a valid secret string (>20 chars)",
    }),
  },
  GOOGLE_CLIENT_ID: {
    name: "Google OAuth Client ID",
    required: false,
    validate: (val) => ({
      valid: val.includes(".apps.googleusercontent.com"),
      message: "Should be a valid Google client ID (ends with .apps.googleusercontent.com)",
    }),
  },
  GOOGLE_CLIENT_SECRET: {
    name: "Google OAuth Client Secret",
    required: false,
    validate: (val) => ({
      valid: val.length > 20,
      message: "Should be a valid secret string (>20 chars)",
    }),
  },
};

interface ValidationResult {
  key: string;
  name: string;
  status: "ok" | "missing" | "invalid" | "skipped";
  value?: string;
  message?: string;
}

function getEnvValue(key: string): string | undefined {
  // Check multiple sources
  if (process.env[key]) return process.env[key];

  // Try loading from .env files
  const envFiles = [".env.local", ".env", ".env.development"];
  for (const file of envFiles) {
    try {
      const content = fs.readFileSync(path.join(process.cwd(), file), "utf-8");
      const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
      if (match) return match[1].trim();
    } catch {
      // Continue to next file
    }
  }

  return undefined;
}

function validateEnv(): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const [key, validator] of Object.entries(validators)) {
    const value = getEnvValue(key);

    if (!value) {
      results.push({
        key,
        name: validator.name,
        status: validator.required ? "missing" : "skipped",
        message: validator.required ? "Missing required variable" : "Optional variable not set",
      });
      continue;
    }

    const validation = validator.validate(value);
    if (!validation.valid) {
      results.push({
        key,
        name: validator.name,
        status: "invalid",
        value: value.substring(0, 10) + "***",
        message: validation.message,
      });
      continue;
    }

    results.push({
      key,
      name: validator.name,
      status: "ok",
      value: value.substring(0, 10) + "***",
    });
  }

  return results;
}

function formatOutput(results: ValidationResult[]): string {
  let output = "\n";
  output += `${colors.bold}${colors.blue}Environment Variables Validation${colors.reset}\n`;
  output += "=".repeat(60) + "\n\n";

  const byStatus: Record<string, ValidationResult[]> = {
    ok: [],
    missing: [],
    invalid: [],
    skipped: [],
  };

  for (const result of results) {
    byStatus[result.status].push(result);
  }

  // OK
  if (byStatus.ok.length > 0) {
    output += `${colors.green}✓ Valid (${byStatus.ok.length})${colors.reset}\n`;
    for (const result of byStatus.ok) {
      output += `  ${result.name}: ${result.value}\n`;
    }
    output += "\n";
  }

  // Missing
  if (byStatus.missing.length > 0) {
    output += `${colors.red}✗ Missing (${byStatus.missing.length})${colors.reset}\n`;
    for (const result of byStatus.missing) {
      output += `  ${result.name} (${result.key})\n`;
    }
    output += "\n";
  }

  // Invalid
  if (byStatus.invalid.length > 0) {
    output += `${colors.red}✗ Invalid (${byStatus.invalid.length})${colors.reset}\n`;
    for (const result of byStatus.invalid) {
      output += `  ${result.name}: ${result.message}\n`;
      output += `    Value: ${result.value}\n`;
    }
    output += "\n";
  }

  // Skipped (optional)
  if (byStatus.skipped.length > 0) {
    output += `${colors.yellow}⊙ Optional (${byStatus.skipped.length})${colors.reset}\n`;
    const optional = byStatus.skipped.slice(0, 3);
    for (const result of optional) {
      output += `  ${result.name}\n`;
    }
    if (byStatus.skipped.length > 3) {
      output += `  ... and ${byStatus.skipped.length - 3} more\n`;
    }
    output += "\n";
  }

  // Summary
  output += "=".repeat(60) + "\n";
  const missCount = byStatus.missing.length;
  const invalidCount = byStatus.invalid.length;

  if (missCount === 0 && invalidCount === 0) {
    output += `${colors.green}${colors.bold}✓ All required variables are valid!${colors.reset}\n`;
    return output;
  }

  output += `${colors.red}${colors.bold}✗ Validation failed:${colors.reset}\n`;
  if (missCount > 0) {
    output += `  - ${missCount} required variable(s) missing\n`;
  }
  if (invalidCount > 0) {
    output += `  - ${invalidCount} variable(s) with invalid format\n`;
  }
  output += "\nPlease review docs/ENVIRONMENT_SETUP.md for configuration help.\n";

  return output;
}

async function testConnections(results: ValidationResult[]): Promise<void> {
  // Test Supabase connection
  const supabaseUrl = getEnvValue("VITE_SUPABASE_URL");
  const supabaseKey = getEnvValue("VITE_SUPABASE_ANON_KEY");

  if (supabaseUrl && supabaseKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
        },
      });

      if (response.ok) {
        console.log(`${colors.green}✓${colors.reset} Supabase connection successful\n`);
      } else {
        console.log(`${colors.yellow}⚠${colors.reset} Supabase returned status ${response.status}\n`);
      }
    } catch (err) {
      console.log(`${colors.yellow}⚠${colors.reset} Could not verify Supabase connection\n`);
    }
  }
}

async function main() {
  console.clear();

  const results = validateEnv();
  console.log(formatOutput(results));

  const hasErrors =
    results.some((r) => r.status === "missing" || r.status === "invalid");

  if (!hasErrors) {
    console.log(
      `\n${colors.blue}Testing external connections...${colors.reset}\n`
    );
    await testConnections(results);
  }

  process.exit(hasErrors ? 1 : 0);
}

main().catch((err) => {
  console.error("Validation error:", err);
  process.exit(1);
});
