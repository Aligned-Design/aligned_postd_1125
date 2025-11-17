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
    try {
      // DEV ONLY: Check for dev auth toggle
      const devAuthEnabled = localStorage.getItem("aligned_dev_auth");
      if (devAuthEnabled === "true" && !localStorage.getItem("aligned_user")) {
        const mockUser: OnboardingUser = {
          id: "user-dev-mock",
          name: "Lauren",
          email: "lauren@aligned-bydesign.com",
          password: "",
          role: "agency",
          plan: "agency",
        };
        setUser(mockUser);
        return;
      }

      const stored = localStorage.getItem("aligned_user");
      if (stored) {
        try {
          const parsedUser = JSON.parse(stored);
          // Check if user signed up with trial query param
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get("trial")) {
            parsedUser.plan = "trial";
            parsedUser.trial_published_count = 0;
            const now = new Date();
            parsedUser.trial_started_at = now.toISOString();
            parsedUser.trial_expires_at = new Date(
              now.getTime() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString();
          }
          setUser(parsedUser);
        } catch (err) {
          console.warn(
            "Failed to parse aligned_user, clearing corrupted localStorage key",
            err,
          );
          localStorage.removeItem("aligned_user");
        }
      }

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
      console.error("Unexpected error loading auth state:", err);
    }
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

  const handleSignUp = (newUser: Partial<OnboardingUser>) => {
    const completeUser: OnboardingUser = {
      id: newUser.id || `user_${Date.now()}`,
      name: newUser.name || "New User",
      email: newUser.email || "",
      password: newUser.password || "",
      role: (newUser.role || "agency") as "agency" | "single_business",
      ...newUser,
    };
    setUser(completeUser);
  };

  const handleUpdateUser = (updates: Partial<OnboardingUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleCompleteOnboarding = () => {
    setOnboardingStep(null);
    // Mark onboarding as completed
    localStorage.setItem("aligned:onboarding:completed", "true");
  };

  const handleLogout = () => {
    setUser(null);
    setBrandSnapshot(null);
    setOnboardingStep(null);
    localStorage.clear();
  };

  const handleLogin = async (
    email: string,
    password: string,
  ): Promise<boolean> => {
    try {
      // Mock login for demo purposes
      const mockUser: OnboardingUser = {
        id: `user_${email.split("@")[0]}`,
        name: email.split("@")[0],
        email,
        password, // In real app, never store this
        role: email.includes("client") ? "single_business" : "agency",
      };
      setUser(mockUser);
      return true;
    } catch {
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
    signUp: handleSignUp,
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
