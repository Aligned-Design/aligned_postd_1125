/**
 * Permission checking hook
 * Determines if current user can perform a specific action/scope
 * Based on canonical role-permission mapping from config/permissions.json
 */

import { useAuth, Role } from "./useAuth";
import permissionsMap from "../../../config/permissions.json";

export type Scope =
  | "brand:manage"
  | "brand:edit"
  | "brand:view"
  | "user:invite"
  | "user:manage"
  | "user:view"
  | "billing:manage"
  | "billing:view"
  | "content:create"
  | "content:edit"
  | "content:delete"
  | "content:approve"
  | "content:view"
  | "publish:schedule"
  | "publish:now"
  | "queue:reschedule"
  | "queue:cancel"
  | "analytics:read"
  | "analytics:export"
  | "integrations:connect"
  | "integrations:manage"
  | "integrations:view"
  | "audit:view"
  | "white_label:manage"
  | "workflow:manage"
  | "approval:configure"
  | "comment:create"
  | "comment:view";

/**
 * Check if user has permission to perform an action
 * @param scope - The permission scope to check (e.g., 'content:approve')
 * @returns boolean - True if user is allowed, false otherwise
 */
export function useCan(scope: Scope): boolean {
  const { role, user } = useAuth();

  if (!role || !user) {
    return false;
  }

  // Get permissions for user's role
  const rolePerms = permissionsMap[role as keyof typeof permissionsMap];

  if (!rolePerms) {
    return false;
  }

  // SUPERADMIN has all permissions (wildcard)
  if (rolePerms.includes("*")) {
    return true;
  }

  // Check if specific scope is in permissions list
  return rolePerms.includes(scope);
}

/**
 * Check multiple scopes (user must have ALL of them)
 * @param scopes - Array of permission scopes
 * @returns boolean - True if user has all scopes
 */
export function useCanAll(scopes: Scope[]): boolean {
  const { role, user } = useAuth();
  
  if (!role || !user) {
    return false;
  }

  const rolePerms = permissionsMap[role as keyof typeof permissionsMap];
  
  if (!rolePerms) {
    return false;
  }

  // SUPERADMIN has all permissions (wildcard)
  if (rolePerms.includes("*")) {
    return true;
  }

  // Check if all scopes are in permissions list
  return scopes.every((scope) => rolePerms.includes(scope));
}

/**
 * Check multiple scopes (user must have AT LEAST ONE)
 * @param scopes - Array of permission scopes
 * @returns boolean - True if user has at least one scope
 */
export function useCanAny(scopes: Scope[]): boolean {
  const { role, user } = useAuth();
  
  if (!role || !user) {
    return false;
  }

  const rolePerms = permissionsMap[role as keyof typeof permissionsMap];
  
  if (!rolePerms) {
    return false;
  }

  // SUPERADMIN has all permissions (wildcard)
  if (rolePerms.includes("*")) {
    return true;
  }

  // Check if at least one scope is in permissions list
  return scopes.some((scope) => rolePerms.includes(scope));
}

/**
 * Check if user is in a specific role
 * Useful for components that need exact role match
 * @param targetRole - The role to check against
 * @returns boolean
 */
export function useIsRole(targetRole: Role | Role[]): boolean {
  const { role } = useAuth();

  if (Array.isArray(targetRole)) {
    return targetRole.includes(role as Role);
  }

  return role === targetRole;
}
