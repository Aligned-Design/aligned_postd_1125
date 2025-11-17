import { createContext, useContext, useState } from "react";
import { User, AnalyticsLayout, MOCK_AGENCY_ADMIN } from "@/types/user";
import { safeSetJSON } from "@/lib/safeLocalStorage";

interface UserContextType {
  user: User;
  setUser: (user: User) => void;
  updateAnalyticsLayout: (layout: AnalyticsLayout) => void;
  isAgency: boolean;
  isAdmin: boolean;
  isClient: boolean;
  canCustomize: boolean;
  previewAsClient: boolean;
  setPreviewAsClient: (preview: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User>(MOCK_AGENCY_ADMIN);
  const [previewAsClient, setPreviewAsClient] = useState(false);

  const setUser = (newUser: User) => {
    setUserState(newUser);
    // Save to localStorage for persistence
    try {
      safeSetJSON("user", newUser);
    } catch (err) {
      // Fallback
      try {
        localStorage.setItem("user", JSON.stringify(newUser));
      } catch (e) {
        console.warn("Failed to persist user to localStorage", e);
      }
    }
  };

  const updateAnalyticsLayout = (layout: AnalyticsLayout) => {
    const updatedUser = {
      ...user,
      analyticsLayout: { ...layout, lastUpdated: new Date().toISOString() },
    };
    setUser(updatedUser);
  };

  const isAgency = user.accountType === "agency";
  const isAdmin = user.role === "admin";
  const isClient = user.role === "client";
  const canCustomize = isAgency && (isAdmin || user.role === "manager") && !previewAsClient;

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        updateAnalyticsLayout,
        isAgency,
        isAdmin,
        isClient,
        canCustomize,
        previewAsClient,
        setPreviewAsClient,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
