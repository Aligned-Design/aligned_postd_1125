import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Brand } from "@/lib/supabase";
import { listBrands } from "@/lib/api/brands";
import { useAuth } from "./AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { getBrandTheme, applyTheme } from "@/lib/theme-config";
import { logError, logWarning, logTelemetry } from "@/lib/logger";

type BrandContextType = {
  brands: Brand[];
  currentBrand: Brand | null;
  setCurrentBrand: (brand: Brand | null) => void;
  switchBrand: (brandId: string) => void;
  loading: boolean;
  refreshBrands: () => Promise<void>;
};

const BrandContext = createContext<BrandContextType | undefined>(undefined);

/**
 * ⚠️ REMOVED: createDevBrandForUser function
 * 
 * Previously used direct Supabase calls which violated the data access pattern.
 * Dev brands should be created via the backend API POST /api/brands instead.
 */

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  // Load persisted brand selection from localStorage
  useEffect(() => {
    const savedBrandId = localStorage.getItem("postd_current_brand_id");
    if (savedBrandId && brands.length > 0) {
      const savedBrand = brands.find(b => b.id === savedBrandId);
      if (savedBrand && savedBrand.id !== currentBrand?.id) {
        setCurrentBrand(savedBrand);
      }
    }
  }, [brands]);

  // Persist brand selection to localStorage
  useEffect(() => {
    if (currentBrand) {
      localStorage.setItem("postd_current_brand_id", currentBrand.id);
    }
  }, [currentBrand]);

  // Handle brandId from URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlBrandId = params.get("brandId");
    if (urlBrandId && brands.length > 0) {
      const urlBrand = brands.find(b => b.id === urlBrandId);
      if (urlBrand && urlBrand.id !== currentBrand?.id) {
        setCurrentBrand(urlBrand);
      }
    }
  }, [location.search, brands]);

  const switchBrand = useCallback((brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
      setCurrentBrand(brand);
      // Update URL with brandId param
      const params = new URLSearchParams(location.search);
      params.set("brandId", brandId);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [brands, location, navigate]);

  const fetchBrands = async () => {
    if (!user) {
      // No user - clear brands
      setBrands([]);
      setCurrentBrand(null);
      setLoading(false);
      return;
    }

    // ✅ CRITICAL: Wait for auth token to be available
    // This ensures JWT token is present before making API calls
    const token = localStorage.getItem("aligned_access_token");
    if (!token) {
      logWarning("[BrandContext] No auth token available, waiting for session...", { userId: user.id });
      setLoading(false);
      return;
    }

    // Check if this is a dev mock user - if so, try to fetch brands anyway
    // but don't use DEFAULT_BRAND as a fallback (it causes issues with API calls)
    const isDevMock = user.id === "user-dev-mock" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    
    if (isDevMock) {
      logTelemetry("[BrandContext] Dev/mock user detected, attempting to fetch brands anyway", { userId: user.id });
    }

    try {
      // ✅ Use centralized API layer
      logTelemetry("[BrandContext] Fetching brands via API", {
        userId: user.id,
        hasToken: !!token,
      });
      
      let brandsData: Brand[];
      try {
        brandsData = await listBrands();
        logTelemetry("[BrandContext] ✅ Fetched brands via API", {
          count: brandsData.length,
        });
      } catch (apiError) {
        logError("[BrandContext] ❌ API error fetching brands", apiError instanceof Error ? apiError : new Error(String(apiError)), { userId: user.id });
        // Check if it's a 401 - token might be invalid
        if (apiError instanceof Error && apiError.message.includes("401")) {
          logError("[BrandContext] 401 Unauthorized - token may be invalid or expired", new Error("401 Unauthorized"), { userId: user.id });
          // Clear invalid token
          localStorage.removeItem("aligned_access_token");
          localStorage.removeItem("aligned_refresh_token");
        }
        // Fallback to empty array - user may not have any brands yet
        brandsData = [];
      }
      
      if (!brandsData || brandsData.length === 0) {
        // No brands found - show empty state
        logTelemetry("[BrandContext] No brands found for user", { userId: user.id });
        setBrands([]);
        setCurrentBrand(null);
        setLoading(false);
        return;
      }

      setBrands(brandsData);
      // Auto-select first brand if none selected
      if (!currentBrand || !brandsData.find(b => b.id === currentBrand.id)) {
        setCurrentBrand(brandsData[0]);
      }
    } catch (error) {
      logError("[BrandContext] Error fetching brands", error instanceof Error ? error : new Error(String(error)), { userId: user.id });
      // On error, show empty state
      setBrands([]);
      setCurrentBrand(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [user]);

  // Apply theme when brand changes
  useEffect(() => {
    if (currentBrand) {
      const theme = getBrandTheme(currentBrand);
      applyTheme(theme);
    } else {
      // Reset to defaults when no brand is selected
      applyTheme({
        name: "Default",
        primaryColor: "#8B5CF6",
        secondaryColor: "#6366F1",
        accentColor: "#A855F7",
        backgroundColor: "#FFFFFF",
        textColor: "#1F2937",
        radiusScale: "default",
      });
    }
  }, [currentBrand]);

  return (
    <BrandContext.Provider
      value={{
        brands,
        currentBrand,
        setCurrentBrand,
        switchBrand,
        loading,
        refreshBrands: fetchBrands,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}
