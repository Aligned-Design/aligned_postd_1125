/**
 * useCurrentBrand
 * 
 * Ensures consistent access to the current brand across all pages and modules.
 * This is the canonical way to get the current brandId - always use this instead
 * of directly accessing currentBrand from BrandContext.
 * 
 * @returns The current brand ID (UUID) or null if no brand is selected
 * @throws Error if brand is required but not available
 */

import { useBrand } from "@/contexts/BrandContext";

export function useCurrentBrand() {
  const { currentBrand, loading } = useBrand();
  
  return {
    brandId: currentBrand?.id || null,
    brand: currentBrand,
    loading,
    hasBrand: !!currentBrand?.id,
    isValid: currentBrand?.id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentBrand.id) : false,
  };
}

/**
 * useRequiredBrand
 * 
 * Use this when a brand is absolutely required for the operation.
 * Throws an error or shows a toast if no brand is available.
 * 
 * @param actionName - Name of the action (for error messages)
 * @returns The current brand ID (never null)
 */
export function useRequiredBrand(actionName: string = "perform this action") {
  const { brandId, brand, hasBrand, isValid } = useCurrentBrand();
  
  if (!hasBrand || !isValid) {
    throw new Error(`Brand required: Please select a brand to ${actionName}.`);
  }
  
  return {
    brandId: brandId!,
    brand: brand!,
  };
}

