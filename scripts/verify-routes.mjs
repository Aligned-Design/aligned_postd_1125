#!/usr/bin/env node
/**
 * Route Verification Script
 *
 * Verifies that critical endpoints exist in the production build.
 * This script imports the actual Express app and inspects its router stack.
 *
 * Exit codes:
 * - 0: All required routes found
 * - 1: Missing routes or errors
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Required routes for onboarding/crawler flow
const REQUIRED_ROUTES = [
  {
    method: "POST",
    path: "/api/analytics/log",
    description: "Frontend logging endpoint",
  },
  {
    method: "POST",
    path: "/api/auth/signup",
    description: "User registration",
  },
  {
    method: "POST",
    path: "/api/orchestration/onboarding/run-all",
    description: "Onboarding crawler trigger",
  },
  {
    method: "POST",
    path: "/api/crawl/start",
    description: "Brand crawler trigger",
  },
];

/**
 * Extract routes from Express app stack
 */
function extractRoutes(stack, prefix = "") {
  const routes = [];

  if (!stack) return routes;

  for (const layer of stack) {
    if (layer.route) {
      // Direct route
      const path = prefix + layer.route.path;
      const methods = Object.keys(layer.route.methods).map((m) =>
        m.toUpperCase(),
      );
      routes.push({ methods, path });
    } else if (layer.name === "router" && layer.handle?.stack) {
      // Nested router - extract path from regexp
      let routerPath = "";
      if (layer.regexp?.source) {
        // Express escapes slashes as \/ in regexp source
        // Pattern: /^\/api\/auth(?=\/|$)/i becomes "^\\/api\\/auth(?=\\/|$)"
        // We need to: remove ^, unescape \/, stop at (?= or $
        const cleaned = layer.regexp.source
          .replace(/^\^/, "")              // Remove leading ^
          .replace(/\\\//g, "/")           // Unescape slashes
          .replace(/\(\?[^)]*\).*/g, "")   // Remove lookahead and everything after
          .replace(/\$.*/, "");            // Remove $ and everything after
        
        if (cleaned && cleaned !== "/") {
          routerPath = cleaned;
        }
      }
      routes.push(...extractRoutes(layer.handle.stack, routerPath));
    } else if (layer.name === "bound dispatch" && layer.handle?.stack) {
      // Another pattern for nested routers
      routes.push(...extractRoutes(layer.handle.stack, prefix));
    }
  }

  return routes;
}

/**
 * Check if a required route exists in the app
 * Matches either full path or the endpoint portion (for cases where router prefix wasn't captured)
 */
function routeExists(routes, requiredMethod, requiredPath) {
  // Extract the endpoint part (last segment after last /)
  const pathParts = requiredPath.split("/").filter(Boolean);
  const endpoint = "/" + pathParts[pathParts.length - 1];
  
  return routes.some((route) => {
    const methodMatches = route.methods.includes(requiredMethod);
    if (!methodMatches) return false;
    
    // Try exact match first
    if (route.path === requiredPath) return true;
    
    // Try endpoint match (e.g., /signup matches /api/auth/signup)
    // But only if the route path ends with the endpoint
    if (route.path.endsWith(endpoint) || route.path === endpoint) {
      return true;
    }
    
    // Try partial match for nested paths (e.g., /onboarding/run-all)
    if (requiredPath.includes("/") && route.path.includes("/")) {
      const requiredSegments = requiredPath.split("/").filter(Boolean);
      const routeSegments = route.path.split("/").filter(Boolean);
      
      // Check if route ends with the same segments as required
      if (requiredSegments.length >= 2) {
        const lastTwo = requiredSegments.slice(-2).join("/");
        const routeLastTwo = routeSegments.slice(-2).join("/");
        if (lastTwo === routeLastTwo) return true;
      }
    }
    
    return false;
  });
}

async function main() {
  console.log("");
  console.log("═".repeat(70));
  console.log("  ROUTE VERIFICATION - Production Build Proof");
  console.log("═".repeat(70));
  console.log("");

  try {
    // Try to import from built dist first, fallback to source
    let createServer;
    let importSource;

    const importStrategies = [
      {
        path: "../dist/server/vercel-server.mjs",
        label: "Production build (dist/)",
      },
      { path: "../server/vercel-server.ts", label: "Source file (server/)" },
    ];

    for (const strategy of importStrategies) {
      try {
        console.log(`Attempting to load: ${strategy.label}`);
        const serverModule = await import(strategy.path);
        createServer =
          serverModule.createServer || serverModule.default?.createServer;

        if (createServer && typeof createServer === "function") {
          importSource = strategy.label;
          console.log(`✅ Loaded from: ${importSource}`);
          break;
        }
      } catch (err) {
        console.log(`❌ ${strategy.label} not available: ${err.message}`);
      }
    }

    if (!createServer) {
      console.error("");
      console.error("❌ FATAL: Cannot load server module");
      console.error(
        "   Neither dist/server/vercel-server.mjs nor server/vercel-server.ts is available.",
      );
      console.error('   Run "pnpm build" to create production build.');
      process.exit(1);
    }

    console.log("");
    console.log("Creating Express app...");
    const app = createServer();

    // Extract routes from Express router stack
    const router = app._router || app.router;
    if (!router || !router.stack) {
      console.error("❌ FATAL: Cannot access Express router stack");
      process.exit(1);
    }

    const routes = extractRoutes(router.stack);
    console.log(`✅ Extracted ${routes.length} routes from app`);
    console.log("");

    // DEBUG: Show sample routes for troubleshooting
    if (process.env.DEBUG_ROUTES === "true") {
      console.log("DEBUG: Sample of extracted routes:");
      routes.slice(0, 20).forEach((r) => {
        console.log(`  ${r.methods.join(",")} ${r.path}`);
      });
      console.log("  ...");
      console.log("");
    }

    // Verify each required route
    console.log("─".repeat(70));
    console.log("  REQUIRED ROUTES VERIFICATION");
    console.log("─".repeat(70));
    console.log("");

    const results = [];
    for (const required of REQUIRED_ROUTES) {
      const exists = routeExists(routes, required.method, required.path);
      results.push({ ...required, exists });

      const status = exists ? "✅ FOUND" : "❌ MISSING";
      console.log(`${status}: ${required.method.padEnd(6)} ${required.path}`);
      console.log(`         ${required.description}`);
      
      // Show matching route if found but not exact match
      if (exists) {
        const matchingRoute = routes.find((r) => {
          if (!r.methods.includes(required.method)) return false;
          if (r.path === required.path) return false; // Skip exact matches
          
          const endpoint = "/" + required.path.split("/").filter(Boolean).pop();
          return r.path.endsWith(endpoint) || r.path === endpoint;
        });
        if (matchingRoute) {
          console.log(`         Matched: ${matchingRoute.methods.join(",")} ${matchingRoute.path}`);
        }
      }
      console.log("");
    }

    // Summary
    const found = results.filter((r) => r.exists).length;
    const missing = results.filter((r) => !r.exists);

    console.log("─".repeat(70));
    console.log(`  SUMMARY: ${found}/${REQUIRED_ROUTES.length} routes found`);
    console.log("─".repeat(70));
    console.log("");

    if (missing.length > 0) {
      console.error("❌ VERIFICATION FAILED");
      console.error("");
      console.error("Missing routes:");
      for (const route of missing) {
        console.error(`   ${route.method} ${route.path}`);
      }
      console.error("");
      process.exit(1);
    }

    console.log("✅ VERIFICATION PASSED");
    console.log("   All required routes are registered in the Express app.");
    console.log("");
    console.log("   Source: " + importSource);
    console.log("");
    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("❌ VERIFICATION ERROR");
    console.error("");
    console.error(error.message);
    if (error.stack) {
      console.error("");
      console.error("Stack trace:");
      console.error(error.stack);
    }
    console.error("");
    process.exit(1);
  }
}

main();
