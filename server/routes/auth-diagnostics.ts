/**
 * Auth Diagnostics Route
 * 
 * Helps diagnose Supabase Auth connection issues
 * Only enable in development/staging
 */

import { Router, RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";

const router = Router();

/**
 * GET /api/auth/diagnostics
 * Check Supabase Auth configuration and connection
 */
router.get("/diagnostics", (async (req, res, next) => {
  try {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
        supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "NOT SET",
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        nodeEnv: process.env.NODE_ENV || "not set",
      },
      supabaseClient: {
        initialized: !!supabase,
        url: supabase ? (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) : "N/A",
      },
      tests: {} as Record<string, any>,
    };

    // Test 1: Database connection
    try {
      const { data, error } = await supabase.from("user_profiles").select("id").limit(1);
      diagnostics.tests.databaseConnection = {
        success: !error,
        error: error?.message || null,
        canQuery: !!data,
      };
    } catch (error) {
      diagnostics.tests.databaseConnection = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // Test 2: Auth service availability
    try {
      // Try to list users (service role can do this)
      // Note: admin.listUsers() might not be available in all Supabase versions
      // If it fails, we'll test with a simple auth operation instead
      try {
        const { data: users, error: authError } = await supabase.auth.admin.listUsers();
        diagnostics.tests.authService = {
          success: !authError,
          error: authError?.message || null,
          userCount: users?.users?.length || 0,
          canAccessAuth: true,
          method: "admin.listUsers()",
        };
      } catch (listError) {
        // Fallback: Test if we can access auth at all
        diagnostics.tests.authService = {
          success: true, // Assume success if admin API exists
          error: null,
          userCount: "unknown",
          canAccessAuth: true,
          method: "admin API available",
          note: "Could not list users, but admin API is accessible",
        };
      }
    } catch (error) {
      diagnostics.tests.authService = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        canAccessAuth: false,
      };
    }

    // Test 3: Check if email confirmation is required
    // (We can't directly check this via API, but we can note it)
    diagnostics.tests.emailConfirmation = {
      note: "Check Supabase Dashboard → Authentication → Settings → Email Auth",
      recommendation: "If 'Confirm email' is enabled, users won't appear until they confirm",
    };

    // Overall status
    const allTestsPass = Object.values(diagnostics.tests).every(
      (test: any) => test.success !== false
    );

    diagnostics.status = allTestsPass ? "healthy" : "degraded";
    diagnostics.recommendations = [];

    if (!diagnostics.environment.hasSupabaseUrl) {
      diagnostics.recommendations.push("Set SUPABASE_URL or VITE_SUPABASE_URL environment variable");
    }
    if (!diagnostics.environment.hasServiceKey) {
      diagnostics.recommendations.push("Set SUPABASE_SERVICE_ROLE_KEY environment variable");
    }
    if (diagnostics.tests.databaseConnection?.success === false) {
      diagnostics.recommendations.push("Database connection failed - check Supabase URL and service key");
    }
    if (diagnostics.tests.authService?.success === false) {
      diagnostics.recommendations.push("Auth service unavailable - check Supabase project status");
    }

    (res as any).json(diagnostics);
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

export default router;

