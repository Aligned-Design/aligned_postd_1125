/**
 * Protected route component
 * Checks authentication and optionally verifies permissions
 */

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/useAuth";
import { useCan } from "@/lib/auth/useCan";
import type { Scope } from "@/lib/auth/useCan";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredScope?: Scope;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredScope,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const hasPermission = useCan(requiredScope || "brand:view");

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Has authentication but missing required permission
  if (requiredScope && !hasPermission) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  // All checks passed
  return <>{children}</>;
}

export default ProtectedRoute;
