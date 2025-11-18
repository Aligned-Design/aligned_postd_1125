import React, { createContext, useContext, useState, useEffect } from "react";

export interface OnboardingUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "agency" | "single_business";
  plan?: "trial" | "base" | "agency";
  trial_published_count?: number;
  trial_started_at?: string;
  trial_expires_at?: string;
  accountType?: string;
  workspaceName?: string;
  clientCount?: number;
  teamMembers?: string[];
  whiteLabel?: boolean;
  businessName?: string;
  website?: string;
  industry?: string;
  connectedPlatforms?: string[];
  goal?: {
    type: "engagement" | "followers" | "leads";
    target: number;
  };
}

export interface BrandSnapshot {
  name?: string;
  voice: string;
  tone: string[];
  audience: string;
  goal: string;
  colors: string[];
  logo?: string;
  industry?: string;
  extractedMetadata?: {
    keywords: string[];
    coreMessaging: string[];
    dos: string[];
    donts: string[];
    images?: string[];
    brandIdentity?: string;
  };
}

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | null;

// Canonical role type (matches config/permissions.json)
export type CanonicalRole =
  | "SUPERADMIN"
  | "AGENCY_ADMIN"
  | "BRAND_MANAGER"
  | "CREATOR"
  | "ANALYST"
  | "CLIENT_APPROVER"
  | "VIEWER";

export interface AuthContextType {
  user: OnboardingUser | null;
  brandSnapshot: BrandSnapshot | null;
  onboardingStep: OnboardingStep;
  isAuthenticated: boolean;
  role: CanonicalRole | null;
  signUp: (user: Partial<OnboardingUser>) => void;
  updateUser: (updates: Partial<OnboardingUser>) => void;
  setBrandSnapshot: (snapshot: BrandSnapshot) => void;
  setOnboardingStep: (step: OnboardingStep) => void;
  completeOnboarding: () => void;
  logout: () => void;
  login?: (email: string, password: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

// Normalize legacy role to canonical role
function normalizeRole(legacyRole?: string): CanonicalRole {
  if (!legacyRole) return "VIEWER";

  const roleMap: Record<string, CanonicalRole> = {
    agency: "AGENCY_ADMIN",
    single_business: "BRAND_MANAGER",
    superadmin: "SUPERADMIN",
    admin: "AGENCY_ADMIN",
    manager: "BRAND_MANAGER",
    creator: "CREATOR",
    client: "CLIENT_APPROVER",
    viewer: "VIEWER",
    analyst: "ANALYST",
  };

  return roleMap[legacyRole.toLowerCase()] || "VIEWER";
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<OnboardingUser | null>(null);
  const [brandSnapshot, setBrandSnapshot] = useState<BrandSnapshot | null>(
    null,
  );
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(null);

  // Load from localStorage on mount (defensive parsing to avoid crashes from corrupted values)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // ✅ REAL AUTH: Try to restore session from token
        const token = localStorage.getItem("aligned_access_token");
        if (token) {
          try {
            const response = await fetch("/api/auth/me", {
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              const user: OnboardingUser = {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                password: "", // Never store password
                role: data.user.role as "agency" | "single_business",
                tenantId: data.user.tenantId,
                workspaceId: data.user.tenantId,
              };
              
              // ✅ LOGGING: Session restored
              console.log("[Auth] Session restored", {
                userId: data.user.id,
                tenantId: data.user.tenantId,
                email: data.user.email,
              });
              
              setUser(user);
              return; // Exit early - session restored
            } else {
              // Token invalid, clear it
              localStorage.removeItem("aligned_access_token");
              localStorage.removeItem("aligned_refresh_token");
            }
          } catch (error) {
            console.error("[Auth] Failed to restore session:", error);
            // Continue to localStorage fallback
          }
        }

        // ✅ CRITICAL: Do NOT use localStorage fallback for user data
        // This was creating mock users and bypassing real authentication
        // Only restore from localStorage if we have a valid token
        // If no token, user must sign up/login through real Supabase Auth
        
        // Check for old localStorage user data and clear it (migration cleanup)
        const stored = localStorage.getItem("aligned_user");
        if (stored && !token) {
          console.warn("[Auth] Clearing old localStorage user data - authentication required");
          localStorage.removeItem("aligned_user");
          localStorage.removeItem("aligned_brand");
          localStorage.removeItem("aligned_onboarding_step");
        }

        // Restore brand snapshot from localStorage
        const storedBrand = localStorage.getItem("aligned_brand");
        if (storedBrand) {
          try {
            setBrandSnapshot(JSON.parse(storedBrand));
          } catch (err) {
            console.warn(
              "Failed to parse aligned_brand, clearing corrupted key",
              err,
            );
            localStorage.removeItem("aligned_brand");
          }
        }

        // Restore onboarding step from localStorage
        const storedStep = localStorage.getItem("aligned_onboarding_step");
        if (storedStep) {
          try {
            setOnboardingStep(JSON.parse(storedStep));
          } catch (err) {
            console.warn("Failed to parse onboarding_step, clearing key", err);
            localStorage.removeItem("aligned_onboarding_step");
          }
        }
      } catch (err) {
        console.error("Unexpected error loading auth/brand/onboarding state:", err);
      }
    };

    restoreSession();
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (user) {
      localStorage.setItem("aligned_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("aligned_user");
    }
  }, [user]);

  useEffect(() => {
    if (brandSnapshot) {
      localStorage.setItem("aligned_brand", JSON.stringify(brandSnapshot));
    } else {
      localStorage.removeItem("aligned_brand");
    }
  }, [brandSnapshot]);

  useEffect(() => {
    if (onboardingStep !== null) {
      localStorage.setItem(
        "aligned_onboarding_step",
        JSON.stringify(onboardingStep),
      );
    } else {
      localStorage.removeItem("aligned_onboarding_step");
    }
  }, [onboardingStep]);

  const handleSignUp = async (newUser: Partial<OnboardingUser>) => {
    try {
      // ✅ REAL AUTH: Call backend signup endpoint
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          name: newUser.name,
          role: newUser.role || "single_business",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // ✅ Handle both error formats: { error: { message } } and { message }
        const errorMessage = errorData?.error?.message || errorData?.message || `Signup failed (${response.status})`;
        console.error("[Auth] Signup API error", {
          status: response.status,
          error: errorData,
          message: errorMessage,
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // ✅ Store tokens
      if (data.tokens) {
        localStorage.setItem("aligned_access_token", data.tokens.accessToken);
        localStorage.setItem("aligned_refresh_token", data.tokens.refreshToken);
      }

      // ✅ Store user with tenantId
      const completeUser: OnboardingUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        password: "", // Never store password
        role: data.user.role as "agency" | "single_business",
        ...newUser,
        // ✅ CRITICAL: Store tenantId for consistent use
        workspaceId: data.user.tenantId,
        tenantId: data.user.tenantId,
      };

      // ✅ LOGGING: Signup complete
      console.log("[Auth] Signup complete", {
        userId: data.user.id,
        tenantId: data.user.tenantId,
        email: data.user.email,
      });

      setUser(completeUser);
    } catch (error) {
      console.error("[Auth] Signup error:", error);
      throw error;
    }
  };

  const handleUpdateUser = (updates: Partial<OnboardingUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleCompleteOnboarding = () => {
    setOnboardingStep(null);
    // Mark onboarding as completed
    localStorage.setItem("aligned:onboarding:completed", "true");
  };

  const handleLogout = async () => {
    try {
      // ✅ REAL AUTH: Call backend logout endpoint
      const token = localStorage.getItem("aligned_access_token");
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("[Auth] Logout error:", error);
      // Continue with logout anyway
    } finally {
      setUser(null);
      setBrandSnapshot(null);
      setOnboardingStep(null);
      localStorage.clear();
    }
  };

  const handleLogin = async (
    email: string,
    password: string,
  ): Promise<boolean> => {
    try {
      // ✅ REAL AUTH: Call backend login endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();

      // ✅ Store tokens
      if (data.tokens) {
        localStorage.setItem("aligned_access_token", data.tokens.accessToken);
        localStorage.setItem("aligned_refresh_token", data.tokens.refreshToken);
      }

      // ✅ Store user with tenantId
      const user: OnboardingUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        password: "", // Never store password
        role: data.user.role as "agency" | "single_business",
        // ✅ CRITICAL: Store tenantId for consistent use
        workspaceId: data.user.tenantId,
        tenantId: data.user.tenantId,
      };

      // ✅ LOGGING: Login complete
      console.log("[Auth] Login complete", {
        userId: data.user.id,
        tenantId: data.user.tenantId,
        email: data.user.email,
        brandCount: data.user.brandIds?.length || 0,
      });

      setUser(user);
      return true;
    } catch (error) {
      console.error("[Auth] Login error:", error);
      return false;
    }
  };

  const canonicalRole = normalizeRole(user?.role);

  const value: AuthContextType = {
    user,
    brandSnapshot,
    onboardingStep,
    isAuthenticated: !!user,
    role: canonicalRole,
    signUp: handleSignUp as any, // ✅ Updated to async function
    updateUser: handleUpdateUser,
    setBrandSnapshot,
    setOnboardingStep,
    completeOnboarding: handleCompleteOnboarding,
    logout: handleLogout,
    login: handleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
