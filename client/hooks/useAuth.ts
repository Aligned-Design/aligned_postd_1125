/**
 * Authentication hook
 * DEPRECATED: This file is kept for backward compatibility only.
 * All authentication should use AuthContext from @/contexts/AuthContext
 * 
 * This file now redirects to the real AuthContext implementation.
 */

import { useAuth as useAuthContext } from "@/contexts/AuthContext";

interface User {
  id: string;
  email: string;
  name: string;
  role: 'agency' | 'client';
  brandId?: string;
  brandName?: string;
}

interface UseAuthReturn {
  user: User | null;
  userRole: 'agency' | 'client';
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

/**
 * @deprecated Use `useAuth` from `@/contexts/AuthContext` instead
 * This hook is kept for backward compatibility but redirects to the real implementation
 */
export function useAuth(): UseAuthReturn {
  // ✅ CRITICAL: Redirect to real AuthContext implementation
  // This prevents mock authentication from being used
  const context = useAuthContext();
  
  // Map AuthContext return to legacy format for backward compatibility
  return {
    user: context.user ? {
      id: context.user.id,
      email: context.user.email,
      name: context.user.name,
      role: context.user.role === "agency" ? "agency" : "client",
      brandId: context.user.workspaceId,
      brandName: undefined,
    } : null,
    userRole: context.user?.role === "agency" ? "agency" : "client",
    loading: false,
    login: context.login || (async () => false),
    logout: context.logout,
    isAuthenticated: context.isAuthenticated,
  };
}
