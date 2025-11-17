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
 * This ensures dev users always have a brand to work with
 */
async function createDevBrandForUser(userId: string): Promise<void> {
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

    // Check if this is a dev mock user - if so, try to fetch brands anyway
    // but don't use DEFAULT_BRAND as a fallback (it causes issues with API calls)
    const isDevMock = user.id === "user-dev-mock" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    
    if (isDevMock) {
      console.log("[BrandContext] Dev/mock user detected, attempting to fetch brands anyway:", user.id);
    }

    try {
      // NOTE: BrandContext uses direct Supabase access to brand_members because:
      // 1. It needs to find ALL brands a user belongs to (not just one brandId)
      // 2. The API route GET /api/brands/:brandId/members requires a brandId (chicken-and-egg problem)
      // 3. This is a foundational context that must work before any brand is selected
      // TODO: Post-launch - Backend should provide /api/users/:userId/brands endpoint
      // For now, this direct access is acceptable as it's read-only and uses RLS
      let { data: memberData, error: memberError } = await supabase
        .from("brand_members")
        .select("brand_id")
        .eq("user_id", user.id);

      // Handle 401 or other auth errors gracefully
      if (memberError) {
        // If it's a dev mock user and we get an auth error, create a dev brand automatically
        if (isDevMock) {
          console.log("[BrandContext] Dev user auth error (expected), creating dev brand:", memberError.message);
          await createDevBrandForUser(user.id);
          // Retry fetching after creating brand
          const retryResult = await supabase
            .from("brand_members")
            .select("brand_id")
            .eq("user_id", user.id);
          if (retryResult.data && retryResult.data.length > 0) {
            memberData = retryResult.data;
            memberError = null; // Clear error after successful retry
          } else {
            setBrands([]);
            setCurrentBrand(null);
            setLoading(false);
            return;
          }
        } else {
          console.warn("[BrandContext] Error fetching brand members:", memberError);
          setBrands([]);
          setCurrentBrand(null);
          setLoading(false);
          return;
        }
      }

      if (!memberData || memberData.length === 0) {
        // No brands found - for dev/mock users, create one automatically
        if (isDevMock) {
          console.log("[BrandContext] No brands found for dev user, creating dev brand:", user.id);
          await createDevBrandForUser(user.id);
          // Retry fetching after creating brand
          const retryResult = await supabase
            .from("brand_members")
            .select("brand_id")
            .eq("user_id", user.id);
          if (retryResult.data && retryResult.data.length > 0) {
            memberData = retryResult.data;
          } else {
            setBrands([]);
            setCurrentBrand(null);
            setLoading(false);
            return;
          }
        } else {
          // Real users should have brands - show empty state
          console.log("[BrandContext] No brands found for user:", user.id);
          setBrands([]);
          setCurrentBrand(null);
          setLoading(false);
          return;
        }
      }

      const brandIds = memberData.map((m) => m.brand_id);
      const { data: brandsData, error: brandsError } = await supabase
        .from("brands")
        .select("*")
        .in("id", brandIds)
        .order("name");

      if (brandsError) {
        console.warn("[BrandContext] Error fetching brands:", brandsError);
        setBrands([]);
        setCurrentBrand(null);
        setLoading(false);
        return;
      }

      if (brandsData && brandsData.length > 0) {
        setBrands(brandsData);
        // Auto-select first brand if none selected
        if (!currentBrand || !brandsData.find(b => b.id === currentBrand.id)) {
          setCurrentBrand(brandsData[0]);
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
