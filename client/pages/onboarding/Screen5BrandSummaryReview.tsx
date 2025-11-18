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

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Edit, CheckCircle2, Sparkles, X } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useConfetti } from "@/hooks/useConfetti";
import { saveBrandGuideFromOnboarding } from "@/lib/onboarding-brand-sync";

export default function Screen5BrandSummaryReview() {
  const { brandSnapshot, setBrandSnapshot, setOnboardingStep } = useAuth();
  const { fire } = useConfetti();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [brandGuideImages, setBrandGuideImages] = useState<string[]>([]);

  // Fire confetti on load
  useEffect(() => {
    const timer = setTimeout(() => {
      fire({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 },
        colors: ["#4F46E5", "#818CF8", "#C7D2FE", "#A855F7"],
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [fire]);

  // ✅ FIX: Fetch images from brand guide (where scraped images are stored)
  useEffect(() => {
    const fetchBrandGuideImages = async () => {
      const brandId = localStorage.getItem("aligned_brand_id");
      if (!brandId) {
        console.warn("[BrandSnapshot] No brandId found in localStorage");
        return;
      }

      // ✅ Validate brandId is a UUID (not temporary brand_*)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(brandId)) {
        console.warn("[BrandSnapshot] Invalid brand ID format:", brandId);
        return;
      }

      try {
        // ✅ Use centralized API utility with auth headers
        const { apiGet } = await import("@/lib/api");
        console.log("[BrandSnapshot] Fetching brand guide", { brandId });
        
        const data = await apiGet<{ brandGuide: any; hasBrandGuide: boolean }>(`/api/brand-guide/${brandId}`);
        const brandGuide = data.brandGuide;
        
        // Extract scraped images from approvedAssets.uploadedPhotos (source='scrape')
        if (brandGuide?.approvedAssets?.uploadedPhotos) {
          const scrapedImages = brandGuide.approvedAssets.uploadedPhotos
            .filter((img: any) => img.source === "scrape")
            .map((img: any) => img.url)
            .filter(Boolean);
          
          if (scrapedImages.length > 0) {
            console.log(`[BrandSnapshot] ✅ Found ${scrapedImages.length} scraped images from brand guide`);
            setBrandGuideImages(scrapedImages);
            return;
          }
        }
        
        // Also check visualIdentity for logo/colors
        if (brandGuide?.visualIdentity) {
          console.log("[BrandSnapshot] Brand guide loaded", {
            hasColors: !!(brandGuide.visualIdentity.colors?.length),
            hasLogo: !!brandGuide.visualIdentity.logoUrl,
          });
        }
      } catch (error) {
        console.warn("[BrandSnapshot] Could not fetch brand guide images:", error);
        // Continue with fallback
      }
    };

    fetchBrandGuideImages();
  }, []);

  if (!brandSnapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your brand profile...</p>
        </div>
      </div>
    );
  }

  const handleContinue = async () => {
    // Save Brand Guide to Supabase before continuing
    if (brandSnapshot) {
      const brandId = localStorage.getItem("aligned_brand_id");
      if (!brandId) {
        console.error("[BrandSnapshot] No brandId found - cannot save brand guide");
        setOnboardingStep(6);
        return;
      }

      // ✅ Validate brandId is a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(brandId)) {
        console.error("[BrandSnapshot] Invalid brand ID format:", brandId);
        setOnboardingStep(6);
        return;
      }

      const brandName = brandSnapshot.name || "Untitled Brand";
      
      try {
        await saveBrandGuideFromOnboarding(brandId, brandSnapshot, brandName);
        console.log("[BrandSnapshot] ✅ Brand Guide saved for brand:", brandId);
      } catch (error) {
        console.error("Failed to save Brand Guide:", error);
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
    
    // Update brandSnapshot locally
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
    
    // Save to Supabase via Brand Guide API
    const brandId = localStorage.getItem("aligned_brand_id") || `brand_${Date.now()}`;
    const brandName = brandSnapshot.name || "Untitled Brand";
    
    // Build update object based on field being edited
    const updates: any = {};
    if (editingField === "tone") {
      updates.tone = updatedSnapshot.tone;
    } else if (editingField === "brandIdentity") {
      updates.purpose = editValue;
    } else if (editingField === "colors") {
      updates.primaryColors = updatedSnapshot.colors;
      updates.colorPalette = updatedSnapshot.colors;
      updates.primaryColor = updatedSnapshot.colors[0];
      updates.secondaryColor = updatedSnapshot.colors[1];
      updates.secondaryColors = updatedSnapshot.colors.slice(1);
    } else if (editingField === "keywords") {
      // Keywords are stored in brand_kit, need to update via PATCH
      updates.brandName = brandName; // Ensure brand name is set
    }
    
    try {
      // Save via Brand Guide API (PATCH for partial update)
      const response = await fetch(`/api/brand-guide/${brandId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        // Update local state
        setBrandSnapshot(updatedSnapshot);
        
        // Also update keywords if that field was edited
        if (editingField === "keywords") {
          // Keywords are stored in brand_kit.keywords, update via PATCH
          const keywordUpdates = {
            keywords: updatedSnapshot.extractedMetadata?.keywords || [],
          };
          const keywordResponse = await fetch(`/api/brand-guide/${brandId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(keywordUpdates),
          });
          if (!keywordResponse.ok) {
            console.warn("Failed to save keywords");
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save edit");
      }
    } catch (error) {
      console.error("Failed to save edit:", error);
      // Show error toast (will be handled by parent component if needed)
    }
    
    setShowEditModal(false);
    setEditingField(null);
    setEditValue("");
  };

  // ✅ PRIORITY: Use images from brand guide (scraped images) first, then fallback to brandSnapshot, then stock
  const brandImages = brandGuideImages.length > 0
    ? brandGuideImages.slice(0, 6) // Use scraped images from brand guide
    : (brandSnapshot.extractedMetadata?.images && brandSnapshot.extractedMetadata.images.length > 0
      ? brandSnapshot.extractedMetadata.images.slice(0, 6) // Use images from crawler response
      : []); // Don't show stock images - only show if we have scraped images

  // Brand identity sentence (generated by AI)
  const brandIdentity = brandSnapshot.extractedMetadata?.brandIdentity || 
    `${brandSnapshot.name} is a ${brandSnapshot.industry || "business"} that ${brandSnapshot.voice || "connects with customers"} through ${brandSnapshot.tone?.join(" and ") || "authentic communication"}.`;

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
            Here's your brand snapshot ✨
          </h1>
          <p className="text-slate-600 font-medium mb-2">
            We've extracted everything from your website. Review and make any quick edits.
          </p>
          <p className="text-slate-500 text-sm">
            💡 You can change anything later in your Brand Guide—no pressure!
          </p>
        </div>

        {/* Brand Identity Sentence */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
                Brand Identity
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

        {/* Visual Grid: Colors + Images */}
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

          {/* Brand Images */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900">Brand Images</h2>
              <span className="text-xs text-slate-500">
                {brandImages.length > 0 ? `${brandImages.length} images` : "No images found"}
              </span>
            </div>
            {brandImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {brandImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-100"
                  >
                    <img
                      src={imageUrl}
                      alt={`Brand image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error(`[BrandSnapshot] Failed to load image ${index + 1}:`, imageUrl);
                        // Hide broken image
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                <p>No images were extracted from your website.</p>
                <p className="mt-2 text-xs">Images will appear here once they're scraped and saved.</p>
              </div>
            )}
          </div>
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
            Looks Great → Continue
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

