/**
 * Screen 5: Brand Summary Review
 * 
 * NEW visual layout showing:
 * - Color palette chips
 * - 3-6 images from website
 * - Tone chips
 * - Keyword tags
 * - 1-sentence brand identity
 * - "Make Quick Edits" (inline modal)
 * - "Looks Great → Continue"
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Edit, CheckCircle2, Sparkles, X, RefreshCw } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useConfetti } from "@/hooks/useConfetti";
import { saveBrandGuideFromOnboarding } from "@/lib/onboarding-brand-sync";
import { logInfo, logWarning, logError } from "@/lib/logger";
import { apiPost } from "@/lib/api";

// ✅ NEW: Image type with ID for exclude functionality
interface BrandImage {
  id: string;
  url: string;
}

export default function Screen5BrandSummaryReview() {
  const { brandSnapshot, setBrandSnapshot, setOnboardingStep } = useAuth();
  const { fire } = useConfetti();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  // ✅ UPDATED: Store full image objects (with IDs) for exclude functionality
  const [logoImages, setLogoImages] = useState<BrandImage[]>([]);
  const [otherImages, setOtherImages] = useState<BrandImage[]>([]);
  const [brandGuideStory, setBrandGuideStory] = useState<string | null>(null);
  // ✅ NEW: Track excluded images for immediate UI feedback
  const [excludedImageIds, setExcludedImageIds] = useState<Set<string>>(new Set());
  const [isExcluding, setIsExcluding] = useState<string | null>(null);
  const [excludeError, setExcludeError] = useState<string | null>(null);

  // ✅ NEW: Handler for excluding an image
  const handleExcludeImage = useCallback(async (assetId: string, imageUrl: string) => {
    if (!assetId || isExcluding) return;
    
    setIsExcluding(assetId);
    setExcludeError(null);
    
    try {
      // Optimistically update UI
      setExcludedImageIds(prev => new Set([...prev, assetId]));
      
      // Call API to persist the exclusion
      await apiPost(`/api/media/${assetId}/exclude`, {});
      
      logInfo("Image excluded", { step: "exclude_image", assetId, url: imageUrl.substring(0, 50) });
    } catch (error) {
      // Rollback optimistic update on error
      setExcludedImageIds(prev => {
        const next = new Set(prev);
        next.delete(assetId);
        return next;
      });
      
      const errorMessage = error instanceof Error ? error.message : "Failed to remove image";
      setExcludeError(errorMessage);
      logError("Failed to exclude image", error instanceof Error ? error : new Error(errorMessage), {
        step: "exclude_image",
        assetId,
      });
      
      // Clear error after 3 seconds
      setTimeout(() => setExcludeError(null), 3000);
    } finally {
      setIsExcluding(null);
    }
  }, [isExcluding]);

  // Fire confetti on load
  useEffect(() => {
    const timer = setTimeout(() => {
      fire({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 },
        colors: ["#632bf0", "#c084fc", "#e2e8f0", "#a855f7"], // primary-light, purple-400, slate-200, purple-500 (design tokens)
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [fire]);

  // ✅ FIX: Fetch images from brand guide (where scraped images are stored)
  useEffect(() => {
    const fetchBrandGuideImages = async () => {
      const brandId = localStorage.getItem("postd_brand_id");
      if (!brandId) {
        if (import.meta.env.DEV) {
          logWarning("No brandId found in localStorage", { step: "fetch_images" });
        }
        return;
      }

      // ✅ Validate brandId is a UUID (not temporary brand_*)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(brandId)) {
        logError("Invalid brand ID format", new Error("Invalid brand ID format"), { step: "fetch_images" });
        // Don't show alert - just log and continue with fallback
        if (import.meta.env.DEV) {
          logWarning("Will use images from brandSnapshot as fallback", { step: "fetch_images" });
        }
        return;
      }

      try {
        // ✅ Use centralized API utility with auth headers
        const { apiGet } = await import("@/lib/api");
        if (import.meta.env.DEV) {
          logInfo("Fetching brand guide for images", { step: "fetch_images" });
        }
        
        const data = await apiGet<{ brandGuide: any; hasBrandGuide: boolean }>(`/api/brand-guide/${brandId}`);
        const brandGuide = data.brandGuide;
        
        if (import.meta.env.DEV) {
          logInfo("Brand guide response", {
            step: "fetch_images",
            hasBrandGuide: !!brandGuide,
            hasApprovedAssets: !!brandGuide?.approvedAssets,
            uploadedPhotosCount: brandGuide?.approvedAssets?.uploadedPhotos?.length || 0,
          });
        }
        
        // ✅ FIX: Fetch brand story from brand guide (purpose or longFormSummary)
        // This ensures we get the AI-generated story, not just the snapshot
        if (brandGuide?.purpose || brandGuide?.longFormSummary) {
          const story = brandGuide.purpose || brandGuide.longFormSummary || "";
          // Only use if it's a valid non-empty string (not "0", not empty)
          if (story && typeof story === "string" && story.length > 10 && story !== "0") {
            if (import.meta.env.DEV) {
              logInfo("Found brand story from brand guide", { step: "fetch_story" });
            }
            setBrandGuideStory(story);
            // Also update brandSnapshot locally so it displays immediately
            if (brandSnapshot) {
              setBrandSnapshot({
                ...brandSnapshot,
                extractedMetadata: {
                  ...brandSnapshot.extractedMetadata,
                  brandIdentity: story,
                },
              });
            }
          }
        }
        
        // ✅ CRITICAL FIX: Read from separate logos and images arrays (primary source)
        // ✅ UPDATED: Keep full objects with IDs for exclude functionality
        // Brand Guide now exposes logos (≤2) and images/brandImages (≤15) arrays
        if (brandGuide?.logos && Array.isArray(brandGuide.logos)) {
          const logos: BrandImage[] = brandGuide.logos
            .filter((img: any) => img.url && typeof img.url === "string" && img.url.startsWith("http"))
            .map((img: any) => ({ id: img.id || "", url: img.url }))
            .filter((img: BrandImage) => img.url);
          
          if (import.meta.env.DEV) {
            logInfo("Found logos from brand guide", {
              step: "fetch_images",
              logosCount: logos.length,
            });
          }
          
          if (logos.length > 0) {
            setLogoImages(logos);
          }
        }
        
        // ✅ Read brand images from images or brandImages array
        // ✅ UPDATED: Keep full objects with IDs for exclude functionality
        const brandImagesArray = brandGuide?.images || brandGuide?.brandImages;
        if (brandImagesArray && Array.isArray(brandImagesArray)) {
          const images: BrandImage[] = brandImagesArray
            .filter((img: any) => img.url && typeof img.url === "string" && img.url.startsWith("http"))
            .map((img: any) => ({ id: img.id || "", url: img.url }))
            .filter((img: BrandImage) => img.url);
          
          if (import.meta.env.DEV) {
            logInfo("Found brand images from brand guide", {
              step: "fetch_images",
              imagesCount: images.length,
            });
          }
          
          if (images.length > 0) {
            setOtherImages(images);
          }
        }
        
        // ✅ FALLBACK: If logos/images arrays are empty, try approvedAssets.uploadedPhotos (backward compatibility)
        // ✅ UPDATED: Keep full objects with IDs for exclude functionality
        if ((!brandGuide?.logos || brandGuide.logos.length === 0) && 
            (!brandGuide?.images || brandGuide.images.length === 0) &&
            brandGuide?.approvedAssets?.uploadedPhotos) {
          if (import.meta.env.DEV) {
            logInfo("Falling back to approvedAssets.uploadedPhotos", { step: "fetch_images" });
          }
          
          const allScrapedImages = brandGuide.approvedAssets.uploadedPhotos
            .filter((img: any) => img.source === "scrape" && img.url && typeof img.url === "string" && img.url.startsWith("http"));
          
          const logos: BrandImage[] = allScrapedImages
            .filter((img: any) => {
              const role = img.metadata?.role || "";
              return role === "logo" || role === "Logo";
            })
            .map((img: any) => ({ id: img.id || "", url: img.url }))
            .filter((img: BrandImage) => img.url)
            .slice(0, 2); // Max 2 logos
          
          const otherImgs: BrandImage[] = allScrapedImages
            .filter((img: any) => {
              const role = img.metadata?.role || "";
              return role !== "logo" && role !== "Logo";
            })
            .map((img: any) => ({ id: img.id || "", url: img.url }))
            .filter((img: BrandImage) => img.url)
            .slice(0, 15); // Max 15 brand images
          
          if (logos.length > 0) {
            setLogoImages(logos);
          }
          if (otherImgs.length > 0) {
            setOtherImages(otherImgs);
          }
        }
        
        // ✅ FINAL FALLBACK: If still no logos but logoUrl exists, use that
        // We'll check this after all the above logic runs
        let hasLogos = false;
        if (brandGuide?.logos && Array.isArray(brandGuide.logos) && brandGuide.logos.length > 0) {
          hasLogos = true;
        } else if (brandGuide?.approvedAssets?.uploadedPhotos) {
          const hasScrapedLogos = brandGuide.approvedAssets.uploadedPhotos.some((img: any) => {
            const role = img.metadata?.role || "";
            return (role === "logo" || role === "Logo") && img.source === "scrape";
          });
          if (hasScrapedLogos) hasLogos = true;
        }
        
        if (!hasLogos && brandGuide?.logoUrl && brandGuide.logoUrl.startsWith("http")) {
          if (import.meta.env.DEV) {
            logInfo("Using logoUrl as final fallback", { step: "fetch_images" });
          }
          // ✅ UPDATED: Use BrandImage format (with fallback ID)
          setLogoImages([{ id: "fallback-logo", url: brandGuide.logoUrl }]);
        }
      } catch (error) {
        logError("Error fetching brand guide images", error instanceof Error ? error : new Error(String(error)), {
          step: "fetch_images",
        });
        // Continue with fallback - don't block UI
      }
    };

    fetchBrandGuideImages();
  }, []);

  if (!brandSnapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your Brand Guide...</p>
        </div>
      </div>
    );
  }

  const handleContinue = async () => {
    // Save Brand Guide to Supabase before continuing
    if (brandSnapshot) {
      const brandId = localStorage.getItem("postd_brand_id");
      if (!brandId) {
        logError("No brandId found - cannot save brand guide", new Error("Brand ID missing"), {
          step: "save_brand_guide",
        });
        setOnboardingStep(6);
        return;
      }

      // ✅ Validate brandId is a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(brandId)) {
        logError("Invalid brand ID format", new Error("Invalid brand ID format"), {
          step: "save_brand_guide",
        });
        setOnboardingStep(6);
        return;
      }

      const brandName = brandSnapshot.name || "Untitled Brand";
      
      try {
        await saveBrandGuideFromOnboarding(brandId, brandSnapshot, brandName);
        if (import.meta.env.DEV) {
          logInfo("Brand Guide saved", { step: "save_brand_guide" });
        }
      } catch (error) {
        logError("Failed to save Brand Guide", error instanceof Error ? error : new Error(String(error)), {
          step: "save_brand_guide",
        });
        // Continue anyway - don't block onboarding
      }
    }
    
    setOnboardingStep(6);
  };

  const handleEdit = (field: string, currentValue: string | string[]) => {
    setEditingField(field);
    setEditValue(Array.isArray(currentValue) ? currentValue.join(", ") : currentValue);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingField || !brandSnapshot) return;
    
    // Update brandSnapshot locally first for immediate UI feedback
    const updatedSnapshot = { ...brandSnapshot };
    
    if (editingField === "tone") {
      updatedSnapshot.tone = editValue.split(",").map((t) => t.trim()).filter(Boolean);
    } else if (editingField === "keywords") {
      updatedSnapshot.extractedMetadata = {
        ...updatedSnapshot.extractedMetadata,
        keywords: editValue.split(",").map((k) => k.trim()).filter(Boolean),
      };
    } else if (editingField === "brandIdentity") {
      updatedSnapshot.extractedMetadata = {
        ...updatedSnapshot.extractedMetadata,
        brandIdentity: editValue,
      };
    } else if (editingField === "colors") {
      updatedSnapshot.colors = editValue.split(",").map((c) => c.trim()).filter(Boolean);
    }
    
    // Update local state immediately for responsive UI
    setBrandSnapshot(updatedSnapshot);
    
    // Save to Supabase via Brand Guide API
    const brandId = localStorage.getItem("postd_brand_id");
    if (!brandId) {
      if (import.meta.env.DEV) {
        logWarning("No brandId found for save", { step: "save_edit" });
      }
      setShowEditModal(false);
      setEditingField(null);
      setEditValue("");
      return;
    }
    
    // Build update object based on field being edited
    const updates: any = {};
    if (editingField === "tone") {
      updates.tone = updatedSnapshot.tone;
    } else if (editingField === "brandIdentity") {
      // Save brand identity as both purpose and longFormSummary
      updates.purpose = editValue;
      updates.longFormSummary = editValue; // Also save as long form summary
    } else if (editingField === "colors") {
      // Save colors properly
      updates.primaryColors = updatedSnapshot.colors;
      updates.colorPalette = updatedSnapshot.colors;
      updates.allColors = updatedSnapshot.colors; // Also save as allColors
      updates.primaryColor = updatedSnapshot.colors[0] || "";
      updates.secondaryColor = updatedSnapshot.colors[1] || "";
      updates.secondaryColors = updatedSnapshot.colors.slice(1) || [];
    } else if (editingField === "keywords") {
      // Keywords need special handling - they're stored in brand_kit
      updates.keywords = updatedSnapshot.extractedMetadata?.keywords || [];
    }
    
    try {
      // Use centralized API utility for authenticated requests
      const { apiPatch } = await import("@/lib/api");
      
      // Save via Brand Guide API (PATCH for partial update)
      await apiPatch(`/api/brand-guide/${brandId}`, updates);
      
      if (import.meta.env.DEV) {
        logInfo("Successfully saved edit", { step: "save_edit", field: editingField });
      }
      
      // Close modal after successful save
      setShowEditModal(false);
      setEditingField(null);
      setEditValue("");
    } catch (error) {
      logError("Failed to save edit", error instanceof Error ? error : new Error(String(error)), {
        step: "save_edit",
        field: editingField,
      });
      // Revert local state on error
      setBrandSnapshot(brandSnapshot);
      
      // Show error to user
      alert(`Failed to save changes: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`);
    }
  };

  // Brand identity sentence (generated by AI)
  // ✅ PRIORITY: Use brandGuideStory first (from API), then brandSnapshot, then fallback
  // ✅ FIX: Check if brandIdentity is a valid string (not 0, null, or empty)
  const rawBrandIdentity = brandGuideStory || brandSnapshot.extractedMetadata?.brandIdentity;
  
  // ✅ CRITICAL LOGGING: Debug brand story display
  // Brand identity resolution (debug only)
  if (import.meta.env.DEV) {
    logInfo("Brand identity resolution", {
      hasBrandGuideStory: !!brandGuideStory,
      brandGuideStoryLength: brandGuideStory?.length || 0,
      brandGuideStoryPreview: brandGuideStory?.substring(0, 100),
      hasSnapshotIdentity: !!brandSnapshot.extractedMetadata?.brandIdentity,
      snapshotIdentityLength: brandSnapshot.extractedMetadata?.brandIdentity?.length || 0,
      snapshotIdentityValue: brandSnapshot.extractedMetadata?.brandIdentity,
      rawBrandIdentity: rawBrandIdentity,
      rawBrandIdentityType: typeof rawBrandIdentity,
    });
  }
  
  // ✅ CRITICAL FIX: Clean brand story - remove "\n\n0" suffix and any trailing "0"
  let cleanedBrandIdentity = rawBrandIdentity;
  if (cleanedBrandIdentity && typeof cleanedBrandIdentity === "string") {
    // Remove "\n\n0" pattern
    cleanedBrandIdentity = cleanedBrandIdentity.replace(/\n\n0$/, "").replace(/\n0$/, "");
    // Remove trailing "0" if it's standalone
    cleanedBrandIdentity = cleanedBrandIdentity.replace(/ 0$/, "").trim();
  }
  
  const brandIdentity = (cleanedBrandIdentity && typeof cleanedBrandIdentity === "string" && cleanedBrandIdentity.trim().length > 10 && cleanedBrandIdentity !== "0" && !cleanedBrandIdentity.toLowerCase().includes("placeholder"))
    ? cleanedBrandIdentity.trim()
    : `${brandSnapshot.name || "Your brand"} is a ${brandSnapshot.industry || "business"} that ${brandSnapshot.voice || "connects with customers"} through ${brandSnapshot.tone?.join(" and ") || "authentic communication"}.`;
  
  // ✅ LOG FINAL RESULT (debug only)
  if (import.meta.env.DEV) {
    logInfo("Final brand identity", {
      step: "brand_identity_resolution",
      finalIdentityLength: brandIdentity.length,
      isFallback: !rawBrandIdentity || rawBrandIdentity === "0" || rawBrandIdentity.length < 10,
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 p-4">
      <div className="max-w-5xl mx-auto pt-6 pb-12">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={5} totalSteps={10} label="Review your brand" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            Here's your Brand Guide
          </h1>
          <p className="text-slate-600 font-medium text-lg mb-2">
            We've automatically detected your brand assets for you
          </p>
          <p className="text-slate-500 text-sm">
            Feel free to add or remove any images—everything is customizable
          </p>
        </div>

        {/* Brand Identity Sentence */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                Your Brand Story
              </p>
              <p className="text-lg text-slate-900 font-medium leading-relaxed">
                {brandIdentity}
              </p>
            </div>
            <button
              onClick={() => handleEdit("brandIdentity", brandIdentity)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Edit brand identity"
            >
              <Edit className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Visual Grid: Colors + Logos + Images */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Color Palette */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900">Color Palette</h2>
              <button
                onClick={() => handleEdit("colors", brandSnapshot.colors || [])}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Edit colors"
              >
                <Edit className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {brandSnapshot.colors && brandSnapshot.colors.length > 0 ? (
                brandSnapshot.colors.map((color, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className="w-16 h-16 rounded-lg border-2 border-slate-200 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <code className="text-xs font-mono text-slate-600">{color}</code>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No colors detected</p>
              )}
            </div>
          </div>

          {/* Logos Section */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Logos</h2>
                {logoImages.filter(img => !excludedImageIds.has(img.id)).length > 0 && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Auto-detected from your website
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {excludeError && <span className="text-xs text-red-500 animate-pulse">{excludeError}</span>}
                <span className="text-xs text-slate-500">
                  {logoImages.filter(img => !excludedImageIds.has(img.id)).length > 0 
                    ? `${logoImages.filter(img => !excludedImageIds.has(img.id)).length} logo${logoImages.filter(img => !excludedImageIds.has(img.id)).length !== 1 ? 's' : ''}` 
                    : "No logos found"}
                </span>
              </div>
            </div>
            {logoImages.filter(img => !excludedImageIds.has(img.id)).length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {logoImages.filter(img => !excludedImageIds.has(img.id)).map((image, index) => (
                  <div
                    key={image.id || index}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center group"
                  >
                    <img
                      src={image.url}
                      alt={`Logo ${index + 1}`}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        if (import.meta.env.DEV) {
                          logError(`Failed to load logo ${index + 1}`, new Error("Image load failed"), {
                            step: "image_load",
                            imageIndex: index + 1,
                          });
                        }
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    {/* ✅ NEW: X button to remove logo */}
                    {image.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExcludeImage(image.id, image.url);
                        }}
                        disabled={isExcluding === image.id}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove from brand"
                      >
                        {isExcluding === image.id ? (
                          <RefreshCw className="w-3 h-3 text-white animate-spin" />
                        ) : (
                          <X className="w-3 h-3 text-white" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                <p>No logos were extracted from your website.</p>
                <p className="mt-2 text-xs">Logos will appear here once they're scraped and saved.</p>
              </div>
            )}
          </div>
        </div>

        {/* Brand Images Section (always visible, even if empty) */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Brand Images</h2>
              {otherImages.filter(img => !excludedImageIds.has(img.id)).length > 0 && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Auto-detected from your website
                </p>
              )}
            </div>
            <span className="text-xs text-slate-500">
              {otherImages.filter(img => !excludedImageIds.has(img.id)).length > 0 
                ? `${otherImages.filter(img => !excludedImageIds.has(img.id)).length} image${otherImages.filter(img => !excludedImageIds.has(img.id)).length !== 1 ? 's' : ''}` 
                : "No images found"}
            </span>
          </div>
          {otherImages.filter(img => !excludedImageIds.has(img.id)).length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {otherImages.filter(img => !excludedImageIds.has(img.id)).map((image, index) => (
                <div
                  key={image.id || index}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-100 group"
                >
                  <img
                    src={image.url}
                    alt={`Brand image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (import.meta.env.DEV) {
                        logError(`Failed to load image ${index + 1}`, new Error("Image load failed"), {
                          step: "image_load",
                          imageIndex: index + 1,
                        });
                      }
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {/* ✅ NEW: X button to remove image */}
                  {image.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExcludeImage(image.id, image.url);
                      }}
                      disabled={isExcluding === image.id}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove from brand"
                    >
                      {isExcluding === image.id ? (
                        <RefreshCw className="w-3 h-3 text-white animate-spin" />
                      ) : (
                        <X className="w-3 h-3 text-white" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              <p>We automatically detected your brand assets for you.</p>
              <p className="mt-2 text-xs">Feel free to add or remove any images.</p>
            </div>
          )}
        </div>

        {/* Tone & Keywords Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Tone Keywords */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900">Tone & Voice</h2>
              <button
                onClick={() => handleEdit("tone", brandSnapshot.tone || [])}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Edit tone"
              >
                <Edit className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {brandSnapshot.tone && brandSnapshot.tone.length > 0 ? (
                brandSnapshot.tone.map((tone, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold border border-indigo-200"
                  >
                    {tone}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">No tone detected</p>
              )}
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900">Keywords</h2>
              <button
                onClick={() => handleEdit("keywords", brandSnapshot.extractedMetadata?.keywords || [])}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Edit keywords"
              >
                <Edit className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {brandSnapshot.extractedMetadata?.keywords && brandSnapshot.extractedMetadata.keywords.length > 0 ? (
                brandSnapshot.extractedMetadata.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-bold border border-purple-200"
                  >
                    {keyword}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">No keywords detected</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex-1 px-6 py-4 bg-white border-2 border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Make Quick Edits
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            This looks perfect! Continue
          </button>
        </div>

        {/* Quick Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-slate-900">Quick Edit</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingField(null);
                    setEditValue("");
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    {editingField === "brandIdentity" ? "Brand Identity" :
                     editingField === "tone" ? "Tone Keywords (comma-separated)" :
                     editingField === "keywords" ? "Keywords (comma-separated)" :
                     editingField === "colors" ? "Colors (comma-separated hex codes)" :
                     "Edit"}
                  </label>
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:outline-none resize-none"
                    rows={editingField === "brandIdentity" ? 3 : 2}
                    placeholder="Enter your changes..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white font-black rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingField(null);
                      setEditValue("");
                    }}
                    className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

