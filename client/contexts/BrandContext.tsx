import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, Brand } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { getBrandTheme, applyTheme } from "@/lib/theme-config";

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
 * Create a dev brand for dev/mock users automatically
 * ⚠️ DEPRECATED: This function uses direct Supabase calls which require session tokens.
 * In production, this will fail with 401 errors.
 * Use the backend API instead via POST /api/brands
 */
async function createDevBrandForUser(userId: string): Promise<void> {
  // ✅ DISABLED in production - use backend API instead
  // Direct Supabase calls require session tokens which we don't have in production
  if (process.env.NODE_ENV === "production") {
    console.warn("[BrandContext] createDevBrandForUser is disabled in production - use backend API");
    return;
  }

  try {
    // Check if dev brand already exists for this user
    const devBrandId = `dev-brand-${userId}`;
    const { data: existingBrand } = await supabase
      .from("brands")
      .select("id")
      .eq("id", devBrandId)
      .single();

    if (existingBrand) {
      // Brand exists, just ensure membership
      const { data: existingMember } = await supabase
        .from("brand_members")
        .select("id")
        .eq("brand_id", devBrandId)
        .eq("user_id", userId)
        .single();

      if (!existingMember) {
        await supabase.from("brand_members").insert({
          brand_id: devBrandId,
          user_id: userId,
          role: "owner",
        });
      }
      return;
    }

    // Create dev brand
    const { error: brandError } = await supabase.from("brands").insert({
      id: devBrandId,
      name: "Dev Brand",
      slug: `dev-brand-${userId}`,
      logo_url: null,
      website_url: "https://postd.app",
      industry: "Development",
      primary_color: "#8B5CF6",
      description: "Development brand for testing",
      tone_keywords: ["professional", "friendly"],
      compliance_rules: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (brandError && brandError.code !== "23505") {
      // Ignore duplicate key errors (23505)
      console.warn("[BrandContext] Error creating dev brand:", brandError);
      return;
    }

    // Create membership
    await supabase.from("brand_members").insert({
      brand_id: devBrandId,
      user_id: userId,
      role: "owner",
    });

    console.log("[BrandContext] Created dev brand for user:", userId);
  } catch (error) {
    console.error("[BrandContext] Error creating dev brand:", error);
    // Don't throw - allow app to continue without brand
  }
}

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
      console.warn("[BrandContext] No auth token available, waiting for session...");
      setLoading(false);
      return;
    }

    // Check if this is a dev mock user - if so, try to fetch brands anyway
    // but don't use DEFAULT_BRAND as a fallback (it causes issues with API calls)
    const isDevMock = user.id === "user-dev-mock" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    
    if (isDevMock) {
      console.log("[BrandContext] Dev/mock user detected, attempting to fetch brands anyway:", user.id);
    }

    try {
      // ✅ FIX: Use backend API endpoint with JWT authentication
      // This replaces direct Supabase access which required session tokens
      const { apiGet } = await import("@/lib/api");
      
      console.log("[BrandContext] Fetching brands via API", {
        userId: user.id,
        hasToken: !!token,
      });
      
      let brandsData;
      try {
        const response = await apiGet<{ success: boolean; brands: any[]; total: number }>("/api/brands");
        brandsData = response.brands || [];
        console.log("[BrandContext] ✅ Fetched brands via API", {
          count: brandsData.length,
        });
      } catch (apiError) {
        console.error("[BrandContext] ❌ API error fetching brands:", apiError);
        // Check if it's a 401 - token might be invalid
        if (apiError instanceof Error && apiError.message.includes("401")) {
          console.error("[BrandContext] 401 Unauthorized - token may be invalid or expired");
          // Clear invalid token
          localStorage.removeItem("aligned_access_token");
          localStorage.removeItem("aligned_refresh_token");
        }
        // Fallback to empty array - user may not have any brands yet
        brandsData = [];
      }
      
      // ✅ API already returns full brand data, no need to fetch again
      if (!brandsData || brandsData.length === 0) {
        // No brands found - show empty state
        console.log("[BrandContext] No brands found for user:", user.id);
        setBrands([]);
        setCurrentBrand(null);
        setLoading(false);
        return;
      }

      // Transform API brands to Brand type
      const transformedBrands: Brand[] = brandsData.map((brand: any) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo_url: brand.logo_url,
        primary_color: brand.primary_color,
        website_url: brand.website_url,
        industry: brand.industry,
        description: brand.description,
        tone_keywords: brand.tone_keywords,
        compliance_rules: brand.compliance_rules,
        brand_kit: brand.brand_kit,
        voice_summary: brand.voice_summary,
        visual_summary: brand.visual_summary,
        created_at: brand.created_at,
        updated_at: brand.updated_at,
      }));

      if (transformedBrands && transformedBrands.length > 0) {
        setBrands(transformedBrands);
        // Auto-select first brand if none selected
        if (!currentBrand || !transformedBrands.find(b => b.id === currentBrand.id)) {
          setCurrentBrand(transformedBrands[0]);
        }
      } else {
        // No brands found in DB
        setBrands([]);
        setCurrentBrand(null);
      }
    } catch (error) {
      console.error("[BrandContext] Error fetching brands:", error);
      // On error, show empty state (don't use DEFAULT_BRAND)
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
