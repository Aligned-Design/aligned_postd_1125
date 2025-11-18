/**
 * Debug Health Check Endpoint
 * 
 * GET /api/debug/health
 * 
 * Comprehensive health check for Supabase connection, auth, tenants, brands, crawler, etc.
 * This endpoint helps catch configuration issues before they cause production failures.
 */

import { Router, RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { verifyToken } from "../lib/jwt-auth";
import { authenticateUser } from "../middleware/security";

const router = Router();

interface HealthCheckResult {
  supabase: "ok" | "error";
  auth: "ok" | "error";
  tenant: "ok" | "error" | "skipped";
  brand_create: "ok" | "error" | "skipped";
  media_assets: "ok" | "error" | "skipped";
  crawler: "ok" | "error" | "skipped";
  brand_guide: "ok" | "error" | "skipped";
  details?: Record<string, any>;
}

/**
 * GET /api/debug/health
 * Comprehensive health check
 */
router.get("/", (async (req, res, next) => {
  const results: HealthCheckResult = {
    supabase: "error",
    auth: "error",
    tenant: "skipped",
    brand_create: "skipped",
    media_assets: "skipped",
    crawler: "skipped",
    brand_guide: "skipped",
    details: {},
  };

  try {
    // 1. Test Supabase connection
    console.log("[Health] 🔍 Testing Supabase connection...");
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id")
        .limit(1);
      
      if (error) {
        console.error("[Health] ❌ Supabase connection failed:", error);
        results.details!.supabase = {
          error: error.message,
          code: error.code,
        };
      } else {
        console.log("[Health] ✅ Supabase connection OK");
        results.supabase = "ok";
        results.details!.supabase = {
          connected: true,
          testQuery: "success",
          rowCount: data?.length || 0,
        };
      }
    } catch (err) {
      console.error("[Health] ❌ Supabase connection exception:", err);
      results.details!.supabase = {
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // 2. Test Auth token decoding
    console.log("[Health] 🔍 Testing auth token decoding...");
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        console.log("[Health] ✅ Auth token decoded successfully");
        results.auth = "ok";
        results.details!.auth = {
          userId: payload.userId,
          tenantId: payload.tenantId,
          role: payload.role,
        };

        // 3. Test tenant exists
        if (payload.tenantId) {
          console.log("[Health] 🔍 Testing tenant existence...");
          const { data: tenant, error: tenantError } = await supabase
            .from("tenants")
            .select("id, name")
            .eq("id", payload.tenantId)
            .single();

          if (tenantError || !tenant) {
            console.error("[Health] ❌ Tenant not found:", tenantError);
            results.tenant = "error";
            results.details!.tenant = {
              tenantId: payload.tenantId,
              error: tenantError?.message || "Tenant not found",
            };
          } else {
            console.log("[Health] ✅ Tenant exists");
            results.tenant = "ok";
            results.details!.tenant = {
              id: tenant.id,
              name: tenant.name,
            };

            // 4. Test brand creation (read-only test)
            console.log("[Health] 🔍 Testing brand table write capability...");
            try {
              // Just verify we can query brands, not actually create one
              const { data: brands, error: brandError } = await supabase
                .from("brands")
                .select("id")
                .eq("tenant_id", payload.tenantId)
                .limit(1);

              if (brandError) {
                console.error("[Health] ❌ Brand query failed:", brandError);
                results.brand_create = "error";
                results.details!.brand_create = {
                  error: brandError.message,
                  code: brandError.code,
                };
              } else {
                console.log("[Health] ✅ Brand table accessible");
                results.brand_create = "ok";
                results.details!.brand_create = {
                  accessible: true,
                  brandCount: brands?.length || 0,
                };
              }
            } catch (err) {
              console.error("[Health] ❌ Brand test exception:", err);
              results.brand_create = "error";
              results.details!.brand_create = {
                error: err instanceof Error ? err.message : String(err),
              };
            }

            // 5. Test media_assets table
            console.log("[Health] 🔍 Testing media_assets table...");
            try {
              const { data: media, error: mediaError } = await supabase
                .from("media_assets")
                .select("id")
                .limit(1);

              if (mediaError) {
                console.error("[Health] ❌ Media assets query failed:", mediaError);
                results.media_assets = "error";
                results.details!.media_assets = {
                  error: mediaError.message,
                  code: mediaError.code,
                };
              } else {
                console.log("[Health] ✅ Media assets table accessible");
                results.media_assets = "ok";
                results.details!.media_assets = {
                  accessible: true,
                  rowCount: media?.length || 0,
                };
              }
            } catch (err) {
              console.error("[Health] ❌ Media assets test exception:", err);
              results.media_assets = "error";
              results.details!.media_assets = {
                error: err instanceof Error ? err.message : String(err),
              };
            }

            // 6. Test brand_guide (brands.brand_kit JSONB)
            console.log("[Health] 🔍 Testing brand guide (brand_kit JSONB)...");
            try {
              const { data: brandGuide, error: guideError } = await supabase
                .from("brands")
                .select("id, brand_kit")
                .eq("tenant_id", payload.tenantId)
                .limit(1);

              if (guideError) {
                console.error("[Health] ❌ Brand guide query failed:", guideError);
                results.brand_guide = "error";
                results.details!.brand_guide = {
                  error: guideError.message,
                  code: guideError.code,
                };
              } else {
                console.log("[Health] ✅ Brand guide accessible");
                results.brand_guide = "ok";
                results.details!.brand_guide = {
                  accessible: true,
                  hasBrandKit: brandGuide?.[0]?.brand_kit ? true : false,
                };
              }
            } catch (err) {
              console.error("[Health] ❌ Brand guide test exception:", err);
              results.brand_guide = "error";
              results.details!.brand_guide = {
                error: err instanceof Error ? err.message : String(err),
              };
            }
          }
        }
      } else {
        console.log("[Health] ⚠️  No auth token provided - skipping auth-dependent tests");
        results.auth = "error";
        results.details!.auth = {
          error: "No Authorization header provided",
        };
      }
    } catch (err) {
      console.error("[Health] ❌ Auth test exception:", err);
      results.auth = "error";
      results.details!.auth = {
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // 7. Test crawler (HTTP request capability)
    console.log("[Health] 🔍 Testing crawler HTTP capability...");
    try {
      // Just verify we can make an HTTP request (to a known endpoint)
      const testUrl = "https://httpbin.org/get";
      const response = await fetch(testUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log("[Health] ✅ Crawler HTTP capability OK");
      results.crawler = "ok";
      results.details!.crawler = {
        httpRequest: "success",
        testUrl: testUrl,
      };
    } catch (err) {
      console.error("[Health] ❌ Crawler HTTP test failed:", err);
      results.crawler = "error";
      results.details!.crawler = {
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // Return results
    const allOk = Object.values(results).every(
      (v) => v === "ok" || v === "skipped"
    );
    const statusCode = allOk ? 200 : 503;

    res.status(statusCode).json({
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks: results,
    });
  } catch (error) {
    console.error("[Health] ❌ Health check failed:", error);
    next(error);
  }
}) as RequestHandler);

export default router;

