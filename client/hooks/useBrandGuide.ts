/**
 * useBrandGuide Hook
 * 
 * Manages Brand Guide data with Supabase sync.
 * Replaces localStorage with server-side persistence.
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { useToast } from "@/hooks/use-toast";
import { fetchJSON, isFetchError } from "@/lib/api-client";
import { logError } from "@/lib/logger";
import type { BrandGuide } from "@/types/brandGuide";

interface UseBrandGuideReturn {
  brandGuide: BrandGuide | null;
  hasBrandGuide: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isSaving: boolean;
  lastSaved: string | null;
  updateBrandGuide: (updates: Partial<BrandGuide>) => Promise<void>;
  saveBrandGuide: (fullGuide: BrandGuide) => Promise<void>;
  refetch: () => void;
}

export function useBrandGuide(): UseBrandGuideReturn {
  const { brandId, brand: currentBrand } = useCurrentBrand();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Fetch Brand Guide from API
  const {
    data: brandGuideData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["brandGuide", brandId],
    queryFn: async () => {
      if (!brandId) {
        return { brandGuide: null, hasBrandGuide: false };
      }

      // Validate brandId is a UUID (not "default-brand")
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(brandId)) {
        return { brandGuide: null, hasBrandGuide: false };
      }

      try {
        // ✅ Use centralized API utility which includes auth headers
        const { apiGet } = await import("@/lib/api");
        const result = await apiGet<{ brandGuide: BrandGuide; hasBrandGuide: boolean }>(`/api/brand-guide/${brandId}`);
        return {
          brandGuide: result.brandGuide || null,
          hasBrandGuide: result.hasBrandGuide || false,
        };
      } catch (err) {
        // Handle 404 as "brand not found" (not just missing guide)
        if (isFetchError(err, 404)) {
          return { brandGuide: null, hasBrandGuide: false };
        }
        // Error will be handled by React Query
        throw err;
      }
    },
    enabled: !!brandId,
    staleTime: 30000, // 30 seconds
  });

  const brandGuide = brandGuideData?.brandGuide || null;
  const hasBrandGuide = brandGuideData?.hasBrandGuide || false;

  // Partial update mutation (PATCH)
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<BrandGuide>) => {
      if (!brandId) {
        throw new Error("No brand selected");
      }

      try {
        return await fetchJSON(`/api/brand-guide/${brandId}`, {
          method: "PATCH",
          body: JSON.stringify(updates),
          timeout: 30000, // 30 seconds
          retries: 2,
        });
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to update Brand Guide: ${error.message}`);
        }
        throw new Error("Failed to update Brand Guide");
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["brandGuide", brandId] });
      setLastSaved(new Date().toLocaleTimeString());
      
      toast({
        title: "✅ Saved",
        description: "Brand Guide updated successfully",
      });
    },
    onError: (error: Error) => {
      logError("Brand Guide update failed", error, {
        brandId: brandId,
        action: "update",
      });
      toast({
        title: "⚠️ Save Failed",
        description: error.message || "Failed to save Brand Guide. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Full save mutation (PUT)
  const saveMutation = useMutation({
    mutationFn: async (fullGuide: BrandGuide) => {
      if (!brandId) {
        throw new Error("No brand selected");
      }

      try {
        // ✅ Use centralized API utility which includes auth headers
        const { apiPut } = await import("@/lib/api");
        return await apiPut(`/api/brand-guide/${brandId}`, fullGuide);
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to save Brand Guide: ${error.message}`);
        }
        throw new Error("Failed to save Brand Guide");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["brandGuide", brandId] });
      setLastSaved(new Date().toLocaleTimeString());
      
      toast({
        title: "✅ Saved",
        description: "Brand Guide saved successfully",
      });
    },
    onError: (error: Error) => {
      logError("Brand Guide save failed", error, {
        brandId: brandId,
        action: "save",
      });
      toast({
        title: "⚠️ Save Failed",
        description: error.message || "Failed to save Brand Guide. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update with debounce
  const updateBrandGuide = useCallback(
    async (updates: Partial<BrandGuide>) => {
      setIsSaving(true);
      try {
        await updateMutation.mutateAsync(updates);
      } finally {
        setIsSaving(false);
      }
    },
    [updateMutation]
  );

  // Full save
  const saveBrandGuide = useCallback(
    async (fullGuide: BrandGuide) => {
      setIsSaving(true);
      try {
        await saveMutation.mutateAsync(fullGuide);
      } finally {
        setIsSaving(false);
      }
    },
    [saveMutation]
  );

  return {
    brandGuide: brandGuide || null,
    hasBrandGuide,
    isLoading,
    isError,
    error: error as Error | null,
    isSaving: isSaving || updateMutation.isPending || saveMutation.isPending,
    lastSaved,
    updateBrandGuide,
    saveBrandGuide,
    refetch,
  };
}

