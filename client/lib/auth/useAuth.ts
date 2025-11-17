/**
 * Unified authentication hook
 * Single source of truth for user authentication and role information
 * Replaces dual implementations: AuthContext + useAuth hook
 */

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export type Role =
  | "SUPERADMIN"
  | "AGENCY_ADMIN"
  | "BRAND_MANAGER"
  | "CREATOR"
  | "ANALYST"
  | "CLIENT_APPROVER"
  | "VIEWER";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  organization_id?: string;
  brand_ids?: string[];
  account_type?: string;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  role: Role | null;
  organizationId: string | undefined;
  brandIds: string[];
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

/**
 * Hook to access authentication context
 * Normalizes user data and exposes canonical role type
 */
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  // Normalize the user data to canonical format
  const normalizeRole = (role: string | undefined): Role => {
    const roleMap: Record<string, Role> = {
      SUPERADMIN: "SUPERADMIN",
      AGENCY_ADMIN: "AGENCY_ADMIN",
      agency: "AGENCY_ADMIN",
      BRAND_MANAGER: "BRAND_MANAGER",
      manager: "BRAND_MANAGER",
      CREATOR: "CREATOR",
      creator: "CREATOR",
      ANALYST: "ANALYST",
      CLIENT_APPROVER: "CLIENT_APPROVER",
      client: "CLIENT_APPROVER",
      VIEWER: "VIEWER",
      viewer: "VIEWER",
    };
    return roleMap[role || ""] || "VIEWER";
  };

  const normalizedUser: AuthUser | null = context.user
    ? {
        id: context.user.id,
        email: context.user.email,
        name: context.user.name,
        role: normalizeRole(context.user.role),
        organization_id: context.user.organization_id,
        brand_ids: context.user.brand_ids,
        account_type: context.user.accountType,
      }
    : null;

  return {
    user: normalizedUser,
    role: normalizedUser?.role ?? null,
    organizationId: normalizedUser?.organization_id,
    brandIds: normalizedUser?.brand_ids ?? [],
    isAuthenticated: context.isAuthenticated,
    loading: false,
    login: context.login || (async () => false),
    logout: context.logout || (() => {}),
    updateUser: context.updateUser || (() => {}),
  };
}
