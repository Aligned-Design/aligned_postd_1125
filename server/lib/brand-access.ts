/**
 * Brand Access Helper
 * 
 * Shared utility for verifying user access to brand resources.
 * Used across all brand-scoped routes to ensure proper authorization.
 * Verifies both brand membership AND workspace ownership.
 */

import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";
import { supabase } from "./supabase";

/**
 * Assert that the authenticated user has access to the specified brand
 * and that the brand belongs to the user's workspace.
 * 
 * @param req - Express request object (must have user/auth from authenticateUser)
 * @param brandId - Brand ID to check access for
 * @param allowSuperAdmin - If true, SUPERADMIN role bypasses brand check (default: true)
 * @param verifyWorkspace - If true, verifies brand belongs to user's workspace (default: true)
 * @throws AppError if user doesn't have access or brand doesn't belong to workspace
 */
export async function assertBrandAccess(
  req: any,
  brandId: string | undefined,
  allowSuperAdmin: boolean = true,
  verifyWorkspace: boolean = true
): Promise<void> {
  if (!brandId) {
    throw new AppError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      "brandId is required",
      HTTP_STATUS.BAD_REQUEST,
      "warning",
      undefined,
      "Please provide a valid brand ID"
    );
  }

  const user = req.user || req.auth;
  if (!user) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Authentication required",
      HTTP_STATUS.UNAUTHORIZED,
      "warning",
      undefined,
      "Please log in to access this resource"
    );
  }

  // SUPERADMIN can access any brand
  if (allowSuperAdmin && user.role?.toUpperCase() === "SUPERADMIN") {
    return;
  }

  // ✅ CRITICAL: Check brand_members table instead of relying on JWT brandIds
  // JWT brandIds may be stale (brand created after JWT was issued)
  // Always check the database for current membership
  const userId = user.id || user.userId;
  if (!userId) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "User ID not found",
      HTTP_STATUS.UNAUTHORIZED,
      "warning"
    );
  }

  // Check if user is a member of this brand
  const { data: membership, error: membershipError } = await supabase
    .from("brand_members")
    .select("id, role")
    .eq("brand_id", brandId)
    .eq("user_id", userId)
    .single();

  if (membershipError || !membership) {
    // If brand was just created, membership might not exist yet
    // Check if user created the brand (brand.created_by === userId)
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, created_by, tenant_id, workspace_id")
      .eq("id", brandId)
      .single();

    if (brandError || !brand) {
      throw new AppError(
        ErrorCode.INVALID_BRAND,
        "Brand not found",
        HTTP_STATUS.NOT_FOUND,
        "warning",
        { brandId },
        "The requested brand does not exist"
      );
    }

    // Allow access if user created the brand OR brand belongs to user's workspace
    const userWorkspaceId = user.workspaceId || user.tenantId;
    const brandWorkspaceId = brand.workspace_id || brand.tenant_id;
    
    if (brand.created_by === userId || (userWorkspaceId && brandWorkspaceId === userWorkspaceId)) {
      // User owns the brand or it's in their workspace - allow access
      return;
    }

    throw new AppError(
      ErrorCode.FORBIDDEN,
      "Not authorized to access this brand",
      HTTP_STATUS.FORBIDDEN,
      "warning",
      { brandId, userId, userRole: user.role },
      "You don't have access to this brand. Please contact your administrator."
    );
  }

  // User is a member - allow access

  // Verify brand belongs to user's workspace (if verifyWorkspace is true)
  if (verifyWorkspace) {
    const userWorkspaceId = user.workspaceId || user.tenantId;
    
    if (userWorkspaceId) {
      // Fetch brand to verify workspace ownership
      const { data: brand, error } = await supabase
        .from("brands")
        .select("id, tenant_id, workspace_id")
        .eq("id", brandId)
        .single();

      if (error || !brand) {
        throw new AppError(
          ErrorCode.INVALID_BRAND,
          "Brand not found",
          HTTP_STATUS.NOT_FOUND,
          "warning",
          { brandId },
          "The requested brand does not exist"
        );
      }

      // Check workspace ownership (tenant_id or workspace_id)
      const brandWorkspaceId = brand.workspace_id || brand.tenant_id;
      if (brandWorkspaceId && brandWorkspaceId !== userWorkspaceId) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Brand does not belong to your workspace",
          HTTP_STATUS.FORBIDDEN,
          "warning",
          { brandId, userWorkspaceId, brandWorkspaceId },
          "You don't have access to this brand. It belongs to a different workspace."
        );
      }
    }
  }
}

/**
 * Synchronous version for routes that don't need workspace verification
 * (for backward compatibility)
 */
export function assertBrandAccessSync(
  req: any,
  brandId: string | undefined,
  allowSuperAdmin: boolean = true
): void {
  if (!brandId) {
    throw new AppError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      "brandId is required",
      HTTP_STATUS.BAD_REQUEST,
      "warning",
      undefined,
      "Please provide a valid brand ID"
    );
  }

  const user = req.user || req.auth;
  if (!user) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Authentication required",
      HTTP_STATUS.UNAUTHORIZED,
      "warning",
      undefined,
      "Please log in to access this resource"
    );
  }

  if (allowSuperAdmin && user.role?.toUpperCase() === "SUPERADMIN") {
    return;
  }

  const userBrandIds: string[] = Array.isArray(user.brandIds)
    ? user.brandIds
    : user.brandId
      ? [user.brandId]
      : [];

  const isDev = process.env.NODE_ENV !== "production";
  if (isDev && userBrandIds.length === 0) {
    console.warn("[BrandAccess] Dev mode: Allowing access without brandIds for testing");
    return;
  }

  if (!userBrandIds.includes(brandId)) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      "Not authorized to access this brand",
      HTTP_STATUS.FORBIDDEN,
      "warning",
      { brandId, userBrandIds, userRole: user.role },
      "You don't have access to this brand. Please contact your administrator."
    );
  }
}

