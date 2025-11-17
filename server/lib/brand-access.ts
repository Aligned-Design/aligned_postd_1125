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

  // Get user's brand IDs
  const userBrandIds: string[] = Array.isArray(user.brandIds)
    ? user.brandIds
    : user.brandId
      ? [user.brandId]
      : [];

  // In dev mode, allow access if brandIds are missing (for testing)
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev && userBrandIds.length === 0) {
    console.warn("[BrandAccess] Dev mode: Allowing access without brandIds for testing");
    return;
  }

  // Check if user has access to this brand (via brand_members)
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

