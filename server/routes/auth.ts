/**
 * Authentication Routes
 * 
 * Real Supabase Auth implementation for signup/login
 * Creates/retrieves tenant/workspace and ensures stable tenantId
 */

import { Router, RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { generateTokenPair, verifyToken } from "../lib/jwt-auth";
import { Role } from "../middleware/rbac";

const router = Router();

/**
 * POST /api/auth/signup
 * Create a new user account with Supabase Auth
 * Automatically creates/retrieves tenant/workspace
 */
router.post("/signup", (async (req, res, next) => {
  try {
    // ✅ STEP 0: Log incoming request
    console.log("[Auth] 📥 Signup request received", {
      body: { email: req.body?.email, hasPassword: !!req.body?.password, name: req.body?.name, role: req.body?.role },
      headers: { contentType: req.headers["content-type"] },
    });

    const { email, password, name, role = "single_business" } = req.body;

    // ✅ STEP 1: Validate input
    if (!email || !password) {
      console.error("[Auth] ❌ Missing required fields", {
        hasEmail: !!email,
        hasPassword: !!password,
      });
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "email and password are required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    if (password.length < 6) {
      console.error("[Auth] ❌ Password too short", {
        length: password.length,
      });
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Password must be at least 6 characters",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // ✅ STEP 2: Check Supabase connection
    if (!supabase) {
      console.error("[Auth] ❌ CRITICAL: Supabase client not initialized!");
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Database connection not configured. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    // ✅ STEP 3: Log environment check
    const hasSupabaseUrl = !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log("[Auth] 🔍 Environment check", {
      email: email,
      hasSupabaseUrl: hasSupabaseUrl,
      hasServiceKey: hasServiceKey,
      supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "MISSING",
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    });

    if (!hasSupabaseUrl || !hasServiceKey) {
      console.error("[Auth] ❌ Missing Supabase configuration", {
        hasSupabaseUrl,
        hasServiceKey,
      });
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Supabase configuration missing. Check environment variables.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    // ✅ STEP 4: Create user in Supabase Auth
    // ✅ CRITICAL: Use Admin API for user creation (service role key required)
    // signUp() is for client-side with anon key, admin.createUser() is for server-side
    console.log("[Auth] 🔐 Calling supabase.auth.admin.createUser", {
      email: email,
      hasPassword: !!password,
      emailConfirm: true,
    });

    let authData, authError;
    try {
      const result = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // ✅ Auto-confirm email (bypasses email confirmation requirement)
        user_metadata: {
          name: name || email.split("@")[0],
          role: role,
        },
      });
      authData = result.data;
      authError = result.error;
    } catch (err) {
      console.error("[Auth] ❌ Exception during createUser:", err);
      authError = err as any;
    }

    // ✅ CRITICAL: Log full error details for debugging
    if (authError) {
      console.error("[Auth] ❌ Signup error details:", {
        message: authError.message,
        status: authError.status,
        name: authError.name,
        code: (authError as any).code,
        error: JSON.stringify(authError, null, 2),
        fullError: authError,
      });
      
      // ✅ Return detailed error to help debug
      throw new AppError(
        ErrorCode.AUTHENTICATION_ERROR,
        authError?.message || "Failed to create user account",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
        { 
          details: authError?.message,
          status: authError?.status,
          code: (authError as any).code,
          // ✅ Helpful error message for common issues
          hint: !process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL 
            ? "SUPABASE_URL environment variable is missing"
            : !process.env.SUPABASE_SERVICE_ROLE_KEY
            ? "SUPABASE_SERVICE_ROLE_KEY environment variable is missing"
            : (authError as any).code === "invalid_api_key"
            ? "SUPABASE_SERVICE_ROLE_KEY is invalid or expired"
            : (authError as any).code === "invalid_request"
            ? "Check Supabase project settings and API keys"
            : undefined
        }
      );
    }

    if (!authData?.user) {
      console.error("[Auth] ❌ CRITICAL: User creation returned no user object", {
        hasData: !!authData,
        hasUser: !!authData?.user,
        error: authError?.message,
      });
      throw new AppError(
        ErrorCode.AUTHENTICATION_ERROR,
        "User creation failed - no user object returned. Check Supabase configuration.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical",
        {
          hint: "Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct and Supabase project is active"
        }
      );
    }

    // ✅ CRITICAL: Log successful user creation
    console.log("[Auth] ✅ User created in Supabase Auth", {
      userId: authData.user?.id,
      email: authData.user?.email,
      emailConfirmed: authData.user?.email_confirmed_at ? true : false,
      createdAt: authData.user?.created_at,
    });

    if (!authData.user) {
      throw new AppError(
        ErrorCode.AUTHENTICATION_ERROR,
        "User was not created - no user object returned",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    const userId = authData.user.id;
    const userEmail = authData.user.email!;

    // ✅ STEP 2: Create user profile in user_profiles table
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .insert([
        {
          id: userId,
          email: userEmail,
          first_name: name?.split(" ")[0] || name || email.split("@")[0],
          last_name: name?.split(" ").slice(1).join(" ") || null,
          is_active: true,
          last_sign_in_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (profileError && !profileError.message.includes("duplicate")) {
      console.error("[Auth] Profile creation error:", profileError);
      // Continue anyway - profile might already exist
    }

    // ✅ STEP 3: Get or create tenant/workspace
    // For now, use userId as tenantId (1:1 relationship)
    // In future, can support multiple users per workspace
    const tenantId = userId; // Single user = single tenant for now

    // ✅ STEP 4: Store tenantId in user metadata for easy retrieval
    // ✅ CRITICAL: Use admin API to update user metadata (not updateUser which requires session)
    console.log("[Auth] 🔄 Updating user metadata with tenantId", {
      userId: userId,
      tenantId: tenantId,
    });

    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          ...authData.user.user_metadata,
          tenant_id: tenantId,
          workspace_id: tenantId,
        },
      }
    );

    if (metadataError) {
      console.warn("[Auth] ⚠️ Failed to update user metadata:", {
        error: metadataError.message,
        code: (metadataError as any).code,
      });
      // Continue anyway - tenantId is still userId and we can retrieve it from JWT
    } else {
      console.log("[Auth] ✅ User metadata updated with tenantId");
    }

    // ✅ STEP 5: Generate JWT tokens with tenantId
    const tokenPair = generateTokenPair({
      userId: userId,
      email: userEmail,
      role: role === "agency" ? Role.ADMIN : Role.OWNER,
      brandIds: [], // No brands yet
      tenantId: tenantId,
    });

    // ✅ LOGGING: Signup complete with IDs
    console.log("[Auth] ✅ Signup complete", {
      userId: userId,
      tenantId: tenantId,
      email: userEmail,
      role: role,
      hasAccessToken: !!tokenPair.accessToken,
      hasRefreshToken: !!tokenPair.refreshToken,
    });

    // ✅ STEP 6: Return success response
    const response = {
      success: true,
      user: {
        id: userId,
        email: userEmail,
        name: name || email.split("@")[0],
        role: role,
        tenantId: tenantId,
        workspaceId: tenantId,
      },
      tokens: tokenPair,
    };

    console.log("[Auth] 📤 Sending signup response", {
      hasUser: !!response.user,
      hasTokens: !!response.tokens,
      userId: response.user.id,
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

/**
 * POST /api/auth/login
 * Authenticate user with Supabase Auth
 * Returns user with stable tenantId
 */
router.post("/login", (async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "email and password are required",
        HTTP_STATUS.BAD_REQUEST,
        "warning"
      );
    }

    // ✅ STEP 1: Authenticate with Supabase Auth
    // ✅ CRITICAL: Check Supabase connection
    if (!supabase) {
      console.error("[Auth] ❌ CRITICAL: Supabase client not initialized!");
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Database connection not configured. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "critical"
      );
    }

    console.log("[Auth] Attempting login", {
      email: email,
      hasSupabaseUrl: !!process.env.SUPABASE_URL || !!process.env.VITE_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // ✅ CRITICAL: Log full error details for debugging
    if (authError) {
      console.error("[Auth] ❌ Login error details:", {
        message: authError.message,
        status: authError.status,
        name: authError.name,
        error: JSON.stringify(authError, null, 2),
      });
    }

    if (authError || !authData.user) {
      console.error("[Auth] Login failed", {
        error: authError?.message,
        status: authError?.status,
        hasUser: !!authData?.user,
        hasSession: !!authData?.session,
      });
      
      throw new AppError(
        ErrorCode.AUTHENTICATION_ERROR,
        authError?.message || "Invalid email or password",
        HTTP_STATUS.UNAUTHORIZED,
        "warning",
        {
          details: authError?.message,
          status: authError?.status,
        }
      );
    }

    // ✅ CRITICAL: Log successful login
    console.log("[Auth] ✅ User authenticated", {
      userId: authData.user.id,
      email: authData.user.email,
      emailConfirmed: authData.user.email_confirmed_at ? true : false,
    });

    const userId = authData.user.id;
    const userEmail = authData.user.email!;

    // ✅ STEP 2: Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError && !profileError.message.includes("No rows")) {
      console.warn("[Auth] Profile fetch error:", profileError);
    }

    // ✅ STEP 3: Get tenantId from user metadata or use userId
    const tenantId = authData.user.user_metadata?.tenant_id || 
                     authData.user.user_metadata?.workspace_id || 
                     userId; // Fallback to userId

    // ✅ STEP 4: Get user's brands to populate brandIds
    const { data: brandMemberships } = await supabase
      .from("brand_members")
      .select("brand_id, role")
      .eq("user_id", userId);

    const brandIds = brandMemberships?.map((bm) => bm.brand_id) || [];

    // ✅ STEP 5: Update last_sign_in_at
    if (profile) {
      await supabase
        .from("user_profiles")
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq("id", userId);
    }

    // ✅ STEP 6: Generate JWT tokens with tenantId
    const tokenPair = generateTokenPair({
      userId: userId,
      email: userEmail,
      role: profile?.role === "agency" ? Role.ADMIN : Role.OWNER,
      brandIds: brandIds,
      tenantId: tenantId,
    });

    // ✅ LOGGING: Login complete with IDs
    console.log("[Auth] Login complete", {
      userId: userId,
      tenantId: tenantId,
      email: userEmail,
      brandCount: brandIds.length,
    });

    (res as any).json({
      success: true,
      user: {
        id: userId,
        email: userEmail,
        name: profile?.first_name || userEmail.split("@")[0],
        role: profile?.role || "single_business",
        tenantId: tenantId,
        workspaceId: tenantId,
        brandIds: brandIds,
      },
      tokens: tokenPair,
    });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

/**
 * POST /api/auth/logout
 * Sign out user (Supabase handles session cleanup)
 */
router.post("/logout", (async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      // In a real implementation, you might want to invalidate the token
      // For now, just return success
    }

    (res as any).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

/**
 * GET /api/auth/me
 * Get current user info from token
 */
router.get("/me", (async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Authorization header required",
        HTTP_STATUS.UNAUTHORIZED,
        "warning"
      );
    }

    const token = authHeader.slice(7);
    
    // ✅ Verify JWT token (not Supabase Auth token)
    let payload;
    try {
      payload = verifyToken(token);
      if (payload.type !== "access") {
        throw new Error("Invalid token type");
      }
    } catch (error) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Invalid or expired token",
        HTTP_STATUS.UNAUTHORIZED,
        "warning"
      );
    }

    const userId = payload.userId;
    const tenantId = payload.tenantId || userId; // Fallback to userId if not in token

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // Get brands
    const { data: brandMemberships } = await supabase
      .from("brand_members")
      .select("brand_id, role")
      .eq("user_id", userId);

    const brandIds = brandMemberships?.map((bm) => bm.brand_id) || [];

    (res as any).json({
      success: true,
      user: {
        id: userId,
        email: payload.email,
        name: profile?.first_name || payload.email?.split("@")[0],
        role: profile?.role || "single_business",
        tenantId: tenantId,
        workspaceId: tenantId,
        brandIds: brandIds,
      },
    });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

export default router;

