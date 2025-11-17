/**
 * BrandSwitcher
 * 
 * Dropdown component for switching between accessible brands/clients/locations.
 * Used in the left sidebar to select the current brand/client within the agency.
 */

import { useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/design-system";

export function BrandSwitcher() {
  const { brands, currentBrand, switchBrand, loading } = useBrand();

  // Auto-select first brand if none selected (use effect to avoid render issues)
  useEffect(() => {
    if (!currentBrand && brands.length > 0 && !loading) {
      // Silently set the first brand as current (no error state)
      switchBrand(brands[0].id);
    }
  }, [currentBrand, brands, loading, switchBrand]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10">
        <div className="w-6 h-6 rounded bg-white/20 animate-pulse" />
        <span className="text-sm font-medium text-white/70">Loading...</span>
      </div>
    );
  }

  // If no brands, show a placeholder (shouldn't happen in normal flow)
  if (brands.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10">
        <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
          <span className="text-xs font-bold text-white/70">?</span>
        </div>
        <span className="text-sm font-medium text-white/70">No brands</span>
      </div>
    );
  }

  // Auto-select first brand if currentBrand is missing (use effect to avoid render issues)
  const displayBrand = currentBrand || brands[0];

  // Single brand: show as static display (no dropdown)
  if (brands.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
        {displayBrand?.logo_url ? (
          <img
            src={displayBrand.logo_url}
            alt={displayBrand.name}
            className="w-6 h-6 rounded"
          />
        ) : (
          <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {displayBrand?.name?.substring(0, 1).toUpperCase() || "B"}
            </span>
          </div>
        )}
        <span className="text-sm font-medium text-white truncate">
          {displayBrand?.name || "Brand"}
        </span>
      </div>
    );
  }

  // Multiple brands: show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-left">
          {displayBrand?.logo_url ? (
            <img
              src={displayBrand.logo_url}
              alt={displayBrand.name}
              className="w-6 h-6 rounded flex-shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {displayBrand?.name?.substring(0, 1).toUpperCase() || "B"}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-white truncate flex-1">
            {displayBrand?.name || "Select Brand"}
          </span>
          <ChevronDown className="w-4 h-4 text-white/60 flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-white">
        {brands.map((brand) => (
          <DropdownMenuItem
            key={brand.id}
            onClick={() => switchBrand(brand.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            {brand.logo_url ? (
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="w-5 h-5 rounded flex-shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">
                  {brand.name?.substring(0, 1).toUpperCase() || "B"}
                </span>
              </div>
            )}
            <span className="flex-1 truncate">{brand.name}</span>
            {currentBrand?.id === brand.id && (
              <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

