import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { FirstVisitTooltip } from "@/components/dashboard/FirstVisitTooltip";
import { BrandGuide, INITIAL_BRAND_GUIDE, calculateCompletionPercentage } from "@/types/brandGuide";
import { BrandDashboard } from "@/components/dashboard/BrandDashboard";
import { BrandSummaryForm } from "@/components/dashboard/BrandSummaryForm";
import { VoiceToneEditor } from "@/components/dashboard/VoiceToneEditor";
import { VisualIdentityEditor } from "@/components/dashboard/VisualIdentityEditor";
import { PersonasEditor } from "@/components/dashboard/PersonasEditor";
import { GoalsEditor } from "@/components/dashboard/GoalsEditor";
import { GuardrailsEditor } from "@/components/dashboard/GuardrailsEditor";
import { BrandProgressMeter } from "@/components/dashboard/BrandProgressMeter";
import { AdvisorPlaceholder } from "@/components/dashboard/AdvisorPlaceholder";
import { BrandGuideWizard } from "@/components/dashboard/BrandGuideWizard";
import { StockImageModal } from "@/components/dashboard/StockImageModal";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { useBrandGuide } from "@/hooks/useBrandGuide";
import { logError } from "@/lib/logger";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { ErrorState } from "@/components/postd/ui/feedback/ErrorState";
import { EmptyState } from "@/components/postd/ui/feedback/EmptyState";
import { Loader2 } from "lucide-react";

type EditingSection = "dashboard" | "summary" | "voice" | "visual" | "personas" | "goals" | "guardrails" | "stock";

const AUTOSAVE_DELAY = 2000; // 2 seconds

export default function BrandGuidePageComponent() {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const { brandId: currentBrandId, brand: currentBrand } = useCurrentBrand();
  const {
    brandGuide: brand,
    isLoading,
    isError,
    isSaving,
    lastSaved,
    updateBrandGuide,
    saveBrandGuide,
    refetch,
  } = useBrandGuide();
  
  const [editingSection, setEditingSection] = useState<EditingSection>("dashboard");
  const [showWizard, setShowWizard] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  // ✅ FIX: Define proper type for stock images
  interface StockImage {
    id: string;
    previewUrl: string;
    title: string;
  }
  const [brandStockImages, setBrandStockImages] = useState<StockImage[]>([]);
  const [localBrand, setLocalBrand] = useState<BrandGuide | null>(null);

  // Use local brand if loaded, otherwise use from hook
  const displayBrand = localBrand || brand;

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousBrandIdRef = useRef<string | undefined>(currentBrandId);

  // ✅ FIX: Use useLayoutEffect to avoid cascading renders
  // Reset local state when brand changes
  useLayoutEffect(() => {
    if (previousBrandIdRef.current !== currentBrandId) {
      setLocalBrand(null);
      setShowWizard(false);
      previousBrandIdRef.current = currentBrandId;
    }
  }, [currentBrandId]);

  // Initialize local brand from hook data when brand loads
  useEffect(() => {
    if (brand) {
      // If we don't have localBrand yet, always set it
      if (!localBrand) {
        setLocalBrand(brand);
        setShowWizard(false);
      } else if (brand.updatedAt !== localBrand.updatedAt) {
        // If we have localBrand, only update if server version is newer
        const serverTime = new Date(brand.updatedAt).getTime();
        const localTime = new Date(localBrand.updatedAt).getTime();
        if (serverTime > localTime) {
          setLocalBrand(brand);
        }
      }
    } else if (!brand && !isLoading && currentBrand) {
      // No brand guide exists - show wizard
      setShowWizard(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, isLoading, currentBrand]); // Removed localBrand from deps to avoid loops, setState is intentional

  // Autosave with debounce (sync to Supabase)
  // Use ref to avoid dependency on updateBrandGuide function
  const updateBrandGuideRef = useRef(updateBrandGuide);
  useEffect(() => {
    updateBrandGuideRef.current = updateBrandGuide;
  }, [updateBrandGuide]);

  useEffect(() => {
    if (!localBrand || !currentBrandId) return;

    // Clear existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      const updatedBrand = {
        ...localBrand,
        updatedAt: new Date().toISOString(),
        completionPercentage: calculateCompletionPercentage(localBrand),
      };
      
      // Update via API using ref to avoid dependency issues
      updateBrandGuideRef.current(updatedBrand).catch((err) => {
        logError("Brand Guide autosave failed", err instanceof Error ? err : new Error(String(err)), {
          brandId: currentBrandId,
        });
      });
    }, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [localBrand, currentBrandId]); // Removed updateBrandGuide from dependencies

  // Update brand data (local state + sync to Supabase)
  const handleBrandUpdate = useCallback(
    async (updates: Partial<BrandGuide>) => {
      if (!localBrand) return;

      const updatedBrand = {
        ...localBrand,
        ...updates,
        updatedAt: new Date().toISOString(),
        completionPercentage: calculateCompletionPercentage({
          ...localBrand,
          ...updates,
        }),
      };

      setLocalBrand(updatedBrand);

      // Sync to Supabase (debounced via useEffect)
      // For immediate saves, call updateBrandGuide directly
    },
    [localBrand]
  );

  // Handle wizard completion
  const handleWizardComplete = async (newBrand: BrandGuide) => {
    setLocalBrand(newBrand);
    setShowWizard(false);
    
    // Save to Supabase
    if (currentBrandId) {
      try {
        await saveBrandGuide(newBrand);
      } catch (err) {
        logError("Brand Guide wizard save failed", err instanceof Error ? err : new Error(String(err)), {
          brandId: currentBrandId,
          action: "wizard_complete",
        });
        toast({
          title: "⚠️ Save Failed",
          description: "Failed to save brand guide. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Show loading state
  if (isLoading || !currentBrand) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
          <p className="text-slate-600 font-semibold">
            {!currentBrand ? "Loading brand..." : "Loading your brand guide..."}
          </p>
        </div>
      </PageShell>
    );
  }

  // Show error state
  if (isError && !displayBrand) {
    return (
      <PageShell>
        <ErrorState
          title="Failed to load Brand Guide"
          message="We couldn't load your brand guide. Please try again."
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  // Show wizard if no brand exists
  if (showWizard && !displayBrand) {
    return (
      <BrandGuideWizard
        onComplete={handleWizardComplete}
        onSkip={async () => {
          const initialGuide = {
            ...INITIAL_BRAND_GUIDE,
            brandId: currentBrandId || "default",
            brandName: currentBrand?.name || "Untitled Brand",
          };
          setLocalBrand(initialGuide);
          setShowWizard(false);
          
          // Save to Supabase
          if (currentBrandId) {
            try {
              await saveBrandGuide(initialGuide);
            } catch (err) {
              logError("Brand Guide initial save failed", err instanceof Error ? err : new Error(String(err)), {
                brandId: currentBrandId,
                action: "initial_save",
              });
              toast({
                title: "⚠️ Save Failed",
                description: "Failed to save initial brand guide. Please try again.",
                variant: "destructive",
              });
            }
          }
        }}
      />
    );
  }


  // Show empty state if no brand guide exists and not showing wizard
  if (!displayBrand && !showWizard && !isLoading) {
    return (
      <PageShell>
        <PageHeader
          title="Brand Guide"
          subtitle={
            <span>
              <span className="bg-slate-200 text-black px-2 py-1 rounded-lg font-semibold">
                {currentBrand?.name || currentWorkspace?.name}
              </span>
              {" — Define your brand identity, voice, and visual standards"}
            </span>
          }
        />
        <EmptyState
          title="No Brand Guide Yet"
          description="Create your brand guide to define your brand identity, voice, and visual standards."
          action={{
            label: "Create Brand Guide",
            onClick: () => setShowWizard(true),
          }}
        />
      </PageShell>
    );
  }

  return (
    <FirstVisitTooltip page="brand">
      <PageShell maxWidth="full" className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-white to-blue-50/20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/60 -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-10 px-4 sm:px-6 md:px-8 lg:px-10">
          <PageHeader
            title="Brand Guide"
            subtitle={
              <span>
                <span className="bg-slate-200 text-black px-2 py-1 rounded-lg font-semibold">
                  {currentBrand?.name || currentWorkspace?.name}
                </span>
                {" — Define your brand identity, voice, and visual standards"}
              </span>
            }
            actions={
              <div className="text-right">
                {isSaving ? (
                  <div className="flex items-center gap-2 text-xs text-amber-600 font-semibold">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : lastSaved ? (
                  <p className="text-xs text-slate-500">Saved at {lastSaved}</p>
                ) : displayBrand?.updatedAt ? (
                  <p className="text-xs text-slate-500">Last updated: {new Date(displayBrand.updatedAt).toLocaleString()}</p>
                ) : null}
              </div>
            }
          />

          {/* Section Navigation - Simplified with Quick Essentials */}
          <div className="space-y-3 pb-4">
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                Quick Essentials
              </p>
              <div className="flex gap-2 flex-wrap">
                {(["dashboard", "summary", "voice", "visual"] as EditingSection[]).map((section) => (
                  <button
                    key={section}
                    onClick={() => setEditingSection(section)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                      editingSection === section
                        ? "bg-lime-400 text-indigo-950"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {section === "dashboard"
                      ? "Overview"
                      : section === "summary"
                      ? "Summary"
                      : section === "voice"
                      ? "Voice & Tone"
                      : "Visual"}
                  </button>
                ))}
              </div>
            </div>
            <details className="group">
              <summary className="text-xs font-bold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 list-none">
                Advanced Sections
                <span className="ml-2 text-slate-400 group-open:hidden">▼</span>
                <span className="ml-2 text-slate-400 hidden group-open:inline">▲</span>
              </summary>
              <div className="flex gap-2 flex-wrap mt-2">
                {(["personas", "goals", "guardrails", "stock"] as EditingSection[]).map((section) => (
                  <button
                    key={section}
                    onClick={() => setEditingSection(section)}
                    className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all whitespace-nowrap ${
                      editingSection === section
                        ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {section === "personas"
                      ? "Personas"
                      : section === "goals"
                      ? "Goals"
                      : section === "guardrails"
                      ? "Guardrails"
                      : "Stock Assets"}
                  </button>
                ))}
              </div>
            </details>
            <p className="text-xs text-slate-500 italic">
              💡 You can change anything later—no pressure!
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar: Progress & Navigation */}
            <div className="lg:col-span-1">
              {displayBrand && <BrandProgressMeter percentage={displayBrand.completionPercentage} />}

              {/* Quick Nav Cards */}
              <div className="mt-6 space-y-3">
                {[
                  { id: "summary", label: "Summary", icon: "📝" },
                  { id: "voice", label: "Voice & Tone", icon: "🎤" },
                  { id: "visual", label: "Visual", icon: "🎨" },
                  { id: "personas", label: "Personas", icon: "👥" },
                  { id: "goals", label: "Goals", icon: "🎯" },
                  { id: "guardrails", label: "Guardrails", icon: "⚖️" },
                  { id: "stock", label: "Stock Assets", icon: "🌍" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setEditingSection(item.id as EditingSection)}
                    className={`w-full px-4 py-3 rounded-lg font-bold text-left text-sm transition-all ${
                      editingSection === item.id
                        ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-300"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Center: Main Content */}
            <div className="lg:col-span-2">
              {!displayBrand ? (
                <EmptyState
                  title="No Brand Guide Data"
                  description="Please create a brand guide to get started."
                  action={{
                    label: "Create Brand Guide",
                    onClick: () => setShowWizard(true),
                  }}
                />
              ) : (
                <>
                  {editingSection === "dashboard" && (
                    <BrandDashboard brand={displayBrand} onUpdate={handleBrandUpdate} />
                  )}
                  {editingSection === "summary" && (
                    <BrandSummaryForm brand={displayBrand} onUpdate={handleBrandUpdate} />
                  )}
                  {editingSection === "voice" && (
                    <VoiceToneEditor brand={displayBrand} onUpdate={handleBrandUpdate} />
                  )}
                  {editingSection === "visual" && (
                    <VisualIdentityEditor brand={displayBrand} onUpdate={handleBrandUpdate} />
                  )}
                  {editingSection === "personas" && (
                    <PersonasEditor brand={displayBrand} onUpdate={handleBrandUpdate} />
                  )}
                  {editingSection === "goals" && (
                    <GoalsEditor brand={displayBrand} onUpdate={handleBrandUpdate} />
                  )}
                  {editingSection === "guardrails" && (
                    <GuardrailsEditor brand={displayBrand} onUpdate={handleBrandUpdate} />
                  )}
                  {editingSection === "stock" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Brand Stock Assets</h2>
                    <p className="text-slate-600 mb-6">
                      Browse and assign stock images from Unsplash, Pexels, and Pixabay to your brand. All images come with proper attribution metadata.
                    </p>

                    <button
                      onClick={() => setShowStockModal(true)}
                      className="px-6 py-3 bg-lime-400 text-indigo-950 font-black rounded-lg hover:bg-lime-500 transition-colors"
                    >
                      🔍 Browse & Assign Stock
                    </button>
                  </div>

                  {/* Assigned Stock Images */}
                  {brandStockImages.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Assigned Stock Images ({brandStockImages.length})</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {brandStockImages.map((image: StockImage) => (
                          <div key={image.id} className="group relative rounded-lg overflow-hidden border border-slate-200">
                            <img
                              src={image.previewUrl}
                              alt={image.title}
                              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                              <button
                                onClick={() => setBrandStockImages((prev: StockImage[]) => prev.filter((img) => img.id !== image.id))} // ✅ FIX: Use proper type
                                className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-600 text-white rounded font-bold text-sm transition-all"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                  )}
                </>
              )}
            </div>

            {/* Right Sidebar: Advisor Placeholder */}
            <div className="lg:col-span-1">
              {displayBrand && <AdvisorPlaceholder brand={displayBrand} />}
            </div>
          </div>
        </div>

        {/* Stock Image Modal */}
        {showStockModal && (
          <StockImageModal
            isOpen={showStockModal}
            onClose={() => setShowStockModal(false)}
            onSelectImage={(image, action) => {
              if (action === "add-to-library") {
                setBrandStockImages((prev) => [...prev, image]);
                toast({
                  title: "Image Assigned",
                  description: `"${image.title}" added to brand stock assets`,
                });
              }
            }}
          />
        )}
      </PageShell>
    </FirstVisitTooltip>
  );
}
