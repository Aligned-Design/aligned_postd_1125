import { useState, useCallback, useEffect } from "react";
import { BrandGuide } from "@/types/brandGuide";
import { ArrowRight, Sparkles, RefreshCw, Check, X, TrendingUp, Calendar, Eye, EyeOff, RotateCcw } from "lucide-react";
import { apiPost, apiGet } from "@/lib/api";

interface BrandDashboardProps {
  brand: BrandGuide;
  onUpdate?: (updates: Partial<BrandGuide>) => void;
}

type EditingField = "purpose" | "mission" | "vision" | "voiceDescription" | "visualNotes" | null;

export function BrandDashboard({ brand, onUpdate }: BrandDashboardProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editValue, setEditValue] = useState("");
  // ✅ NEW: Track excluded images locally for immediate UI feedback
  const [excludedImageIds, setExcludedImageIds] = useState<Set<string>>(new Set());
  const [isExcluding, setIsExcluding] = useState<string | null>(null); // Track which image is being excluded
  const [excludeError, setExcludeError] = useState<string | null>(null);
  
  // ✅ NEW: State for "Show Hidden / Restore" feature
  const [showHiddenImages, setShowHiddenImages] = useState(false);
  const [hiddenImages, setHiddenImages] = useState<Array<{ id: string; url: string; filename?: string; metadata?: any }>>([]);
  const [isLoadingHidden, setIsLoadingHidden] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [restoredImageIds, setRestoredImageIds] = useState<Set<string>>(new Set()); // Track locally restored images

  // ✅ NEW: Handler for excluding an image from the brand
  const handleExcludeImage = useCallback(async (assetId: string, imageUrl: string) => {
    if (!assetId || isExcluding) return;
    
    setIsExcluding(assetId);
    setExcludeError(null);
    
    try {
      // Optimistically update UI
      setExcludedImageIds(prev => new Set([...prev, assetId]));
      
      // Call API to persist the exclusion
      await apiPost(`/api/media/${assetId}/exclude`, {});
      
      console.log(`[BrandDashboard] ✅ Image excluded: ${imageUrl.substring(0, 50)}...`);
    } catch (error) {
      // Rollback optimistic update on error
      setExcludedImageIds(prev => {
        const next = new Set(prev);
        next.delete(assetId);
        return next;
      });
      
      const errorMessage = error instanceof Error ? error.message : "Failed to remove image";
      setExcludeError(errorMessage);
      console.error("[BrandDashboard] Error excluding image:", error);
      
      // Clear error after 3 seconds
      setTimeout(() => setExcludeError(null), 3000);
    } finally {
      setIsExcluding(null);
    }
  }, [isExcluding]);

  // ✅ NEW: Fetch hidden images when toggle is enabled
  const fetchHiddenImages = useCallback(async () => {
    if (!brand.brandId && !brand.id) return;
    
    setIsLoadingHidden(true);
    try {
      const brandId = brand.brandId || brand.id;
      const response = await apiGet<{ items: Array<{ id: string; url: string; filename?: string; metadata?: any }> }>(
        `/api/media/excluded?brandId=${brandId}`
      );
      setHiddenImages(response.items || []);
    } catch (error) {
      console.error("[BrandDashboard] Error fetching hidden images:", error);
      setHiddenImages([]);
    } finally {
      setIsLoadingHidden(false);
    }
  }, [brand.brandId, brand.id]);

  // ✅ NEW: Handler for restoring a hidden image
  const handleRestoreImage = useCallback(async (assetId: string, imageUrl: string) => {
    if (!assetId || isRestoring) return;
    
    setIsRestoring(assetId);
    
    try {
      // Optimistically update UI - mark as restored locally
      setRestoredImageIds(prev => new Set([...prev, assetId]));
      
      // Also remove from locally excluded if present
      setExcludedImageIds(prev => {
        const next = new Set(prev);
        next.delete(assetId);
        return next;
      });
      
      // Call API to restore
      await apiPost(`/api/media/${assetId}/restore`, {});
      
      console.log(`[BrandDashboard] ✅ Image restored: ${imageUrl.substring(0, 50)}...`);
      
      // Remove from hidden images list
      setHiddenImages(prev => prev.filter(img => img.id !== assetId));
    } catch (error) {
      // Rollback optimistic update on error
      setRestoredImageIds(prev => {
        const next = new Set(prev);
        next.delete(assetId);
        return next;
      });
      
      const errorMessage = error instanceof Error ? error.message : "Failed to restore image";
      setExcludeError(errorMessage);
      console.error("[BrandDashboard] Error restoring image:", error);
      
      // Clear error after 3 seconds
      setTimeout(() => setExcludeError(null), 3000);
    } finally {
      setIsRestoring(null);
    }
  }, [isRestoring]);

  // ✅ NEW: Fetch hidden images when showHiddenImages is toggled on
  useEffect(() => {
    if (showHiddenImages) {
      fetchHiddenImages();
    }
  }, [showHiddenImages, fetchHiddenImages]);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setIsRegenerating(false);
    }, 1500);
  };

  const startEditing = (field: EditingField, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = (field: EditingField) => {
    if (!onUpdate || !field) return;
    onUpdate({ [field]: editValue } as Partial<BrandGuide>);
    setEditingField(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const getToneLabel = (level: number) => {
    if (level < 33) return "Low";
    if (level < 67) return "Moderate";
    return "High";
  };

  return (
    <div className="space-y-6">
      {/* Hero: Brand Essence */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 rounded-xl border border-indigo-100 p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">{brand.brandName || "Your Brand"}</h2>
            <p className="text-sm text-slate-600">
              {brand.purpose
                ? `${brand.purpose.substring(0, 80)}...`
                : "Your brand essence will appear here as you fill out the guide."}
            </p>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-sm whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
            {isRegenerating ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-indigo-100">
          <div className="text-center py-2">
            <p className="text-xs text-slate-600 font-bold mb-1">TONE KEYWORDS</p>
            <p className="text-lg font-black text-indigo-600">{(brand.voiceAndTone?.tone || brand.tone || []).length}</p>
          </div>
          <div className="text-center py-2">
            <p className="text-xs text-slate-600 font-bold mb-1">COLORS</p>
            <p className="text-lg font-black text-indigo-600">
              {(brand.visualIdentity?.colors || brand.primaryColors || []).length + (brand.secondaryColors || []).length}
            </p>
          </div>
          <div className="text-center py-2">
            <p className="text-xs text-slate-600 font-bold mb-1">PERSONAS</p>
            <p className="text-lg font-black text-indigo-600">{brand.personas?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Who We Are */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6 group hover:border-indigo-200 transition-colors">
        <h3 className="text-lg font-black text-slate-900 mb-3">Who We Are</h3>
        {editingField === "purpose" ? (
          <div className="space-y-3">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => saveEdit("purpose")}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-lime-400 text-slate-900 hover:bg-lime-500 transition-colors font-bold text-sm"
              >
                <Check className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-bold text-sm"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-700 leading-relaxed mb-4">
              {brand.purpose ? (
                brand.purpose
              ) : (
                <span className="text-slate-500 italic">
                  Define your purpose to show what drives your brand forward.
                </span>
              )}
            </p>
            <button
              onClick={() => startEditing("purpose", brand.purpose || "")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
            >
              ✏️ Edit
              <ArrowRight className="w-3 h-3" />
            </button>
          </>
        )}
      </div>

      {/* What We Stand For */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6 group hover:border-indigo-200 transition-colors">
        <h3 className="text-lg font-black text-slate-900 mb-4">What We Stand For</h3>

        {editingField === "mission" ? (
          <div className="space-y-3 mb-4">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => saveEdit("mission")}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-lime-400 text-slate-900 hover:bg-lime-500 transition-colors font-bold text-sm"
              >
                <Check className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-bold text-sm"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3 mb-4 group/mission">
            <p className="text-sm text-slate-700 leading-relaxed flex-1">
              {brand.mission ? (
                brand.mission
              ) : (
                <span className="text-slate-500 italic">
                  Define your mission to explain what your brand does and its impact.
                </span>
              )}
            </p>
            <button
              onClick={() => startEditing("mission", brand.mission || "")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors opacity-0 group-hover/mission:opacity-100 flex-shrink-0"
            >
              ✏️
            </button>
          </div>
        )}

        {brand.vision && (
          <>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4"></div>
            {editingField === "vision" ? (
              <div className="space-y-3">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit("vision")}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-lime-400 text-slate-900 hover:bg-lime-500 transition-colors font-bold text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-bold text-sm"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3 group/vision">
                <p className="text-sm text-slate-700 flex-1">
                  <span className="text-xs font-bold text-slate-900 block mb-1">Vision</span>
                  {brand.vision}
                </p>
                <button
                  onClick={() => startEditing("vision", brand.vision || "")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors opacity-0 group-hover/vision:opacity-100 flex-shrink-0"
                >
                  ✏️
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* How We Show Up: Tone & Voice */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <h3 className="text-lg font-black text-slate-900 mb-4">How We Show Up</h3>

        {/* Tone Keywords */}
        {(brand.voiceAndTone?.tone || brand.tone || []).length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-600 mb-2">VOICE KEYWORDS</p>
            <div className="flex flex-wrap gap-2">
              {(brand.voiceAndTone?.tone || brand.tone || []).map((t) => (
                <span
                  key={t}
                  className="px-3 py-1.5 bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200 hover:border-indigo-400 transition-colors"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tone Sliders Visualization */}
        <div className="space-y-4 mb-6">
          {/* Friendliness */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-slate-900">Friendliness</p>
                <p className="text-xs text-slate-500">Formal ↔ Warm & Friendly</p>
              </div>
              <span className="text-sm font-black text-indigo-600">{brand.voiceAndTone?.friendlinessLevel || brand.friendlinessLevel || 50}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${brand.voiceAndTone?.friendlinessLevel || brand.friendlinessLevel || 50}%` }}
              />
            </div>
          </div>

          {/* Formality */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-slate-900">Formality</p>
                <p className="text-xs text-slate-500">Casual ↔ Professional</p>
              </div>
              <span className="text-sm font-black text-indigo-600">{brand.voiceAndTone?.formalityLevel || brand.formalityLevel || 50}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-purple-400 transition-all duration-300"
                style={{ width: `${brand.voiceAndTone?.formalityLevel || brand.formalityLevel || 50}%` }}
              />
            </div>
          </div>

          {/* Confidence */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-slate-900">Confidence</p>
                <p className="text-xs text-slate-500">Tentative ↔ Bold & Authoritative</p>
              </div>
              <span className="text-sm font-black text-indigo-600">{brand.voiceAndTone?.confidenceLevel || brand.confidenceLevel || 50}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-300"
                style={{ width: `${brand.voiceAndTone?.confidenceLevel || brand.confidenceLevel || 50}%` }}
              />
            </div>
          </div>
        </div>

        {/* Voice Description */}
        {brand.voiceAndTone?.voiceDescription || brand.voiceDescription && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 group/voice hover:border-indigo-200 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700 mb-1">VOICE PERSONALITY</p>
                {editingField === "voiceDescription" ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit("voiceDescription")}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-lime-400 text-slate-900 hover:bg-lime-500 transition-colors font-bold text-xs"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-bold text-xs"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700">{brand.voiceAndTone?.voiceDescription || brand.voiceDescription}</p>
                )}
              </div>
              {editingField !== "voiceDescription" && (
                <button
                  onClick={() => startEditing("voiceDescription", brand.voiceAndTone?.voiceDescription || brand.voiceDescription || "")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors opacity-0 group-hover/voice:opacity-100 flex-shrink-0"
                >
                  ✏️
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Visual Identity */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <h3 className="text-lg font-black text-slate-900 mb-4">Visual Identity</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Logos - Display scraped logos or fallback to logoUrl */}
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2">LOGOS</p>
            {/* ✅ FIX: Get scraped logos from multiple possible sources */}
            {(() => {
              // Try to get logos from various possible locations
              const logos: Array<{ id?: string; url: string; filename?: string }> = [];
              
              // 1. Check for top-level logos array (from API)
              if ((brand as any).logos && Array.isArray((brand as any).logos)) {
                logos.push(...(brand as any).logos);
              }
              
              // 2. Check approvedAssets.uploadedPhotos (filtered by source='scrape' and role='logo')
              if (brand.approvedAssets?.uploadedPhotos) {
                const scrapedLogos = brand.approvedAssets.uploadedPhotos.filter((img: any) => {
                  const metadata = img.metadata || {};
                  const source = img.source || metadata.source || "";
                  const role = metadata.role || "";
                  return source === "scrape" && (role === "logo" || role === "Logo");
                });
                // Only add if not already in logos array
                scrapedLogos.forEach((logo: any) => {
                  if (!logos.some(l => l.url === logo.url)) {
                    logos.push(logo);
                  }
                });
              }
              
              // 3. Fallback to logoUrl if no scraped logos found
              if (logos.length === 0 && brand.logoUrl) {
                logos.push({ url: brand.logoUrl, id: "fallback-logo" });
              }
              
              if (logos.length > 0) {
                return (
                  <div className="space-y-2">
                    {logos.slice(0, 2).map((logo, idx) => (
                      <div key={logo.id || idx} className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                        <img src={logo.url} alt={logo.filename || `Brand logo ${idx + 1}`} className="w-full h-full object-contain p-2" />
                      </div>
                    ))}
                    {logos.length > 2 && (
                      <p className="text-xs text-slate-500 text-center">+{logos.length - 2} more logo{logos.length - 2 > 1 ? 's' : ''}</p>
                    )}
                  </div>
                );
              }
              
              return (
                <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-500 text-xs font-bold">
                  No logos found
                </div>
              );
            })()}
          </div>

          {/* Typography */}
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2">TYPOGRAPHY</p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p
                className="text-2xl font-black text-slate-900 mb-2 line-clamp-2"
                style={{ fontFamily: `"${brand.fontFamily}", sans-serif` }}
              >
                {brand.brandName || "Brand Name"}
              </p>
              <p className="text-xs text-slate-600">
                {brand.visualIdentity?.typography?.source || brand.fontSource === "google" ? "Google Font: " : "Custom Font: "}
                <span className="font-bold">{brand.fontFamily}</span>
              </p>
            </div>
          </div>

          {/* Colors */}
          <div className="md:col-span-2">
            <p className="text-xs font-bold text-slate-600 mb-2">COLOR PALETTE</p>
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                {(brand.visualIdentity?.colors || brand.primaryColors || []).map((color) => (
                  <div
                    key={color}
                    className="w-10 h-10 rounded-lg border-2 border-slate-200 hover:border-slate-400 transition-colors cursor-help"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              {brand.secondaryColors.length > 0 && (
                <div className="flex gap-2 flex-wrap opacity-60">
                  {brand.secondaryColors.map((color) => (
                    <div
                      key={color}
                      className="w-10 h-10 rounded-lg border-2 border-slate-200 hover:border-slate-400 transition-colors cursor-help"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {brand.visualIdentity?.visualNotes || brand.visualNotes && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 group/visual hover:border-indigo-200 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700 mb-1">VISUAL GUIDELINES</p>
                {editingField === "visualNotes" ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit("visualNotes")}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-lime-400 text-slate-900 hover:bg-lime-500 transition-colors font-bold text-xs"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-bold text-xs"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700">{brand.visualIdentity?.visualNotes || brand.visualNotes}</p>
                )}
              </div>
              {editingField !== "visualNotes" && (
                <button
                  onClick={() => startEditing("visualNotes", brand.visualIdentity?.visualNotes || brand.visualNotes || "")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors opacity-0 group-hover/visual:opacity-100 flex-shrink-0"
                >
                  ✏️
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ✅ NEW: Brand Images Gallery - Display scraped brand images with X to remove */}
      {(() => {
        // ✅ UPDATED (2025-12-10): More lenient filtering - include logos, let user remove via X
        const brandImages: Array<{ id?: string; url: string; filename?: string; metadata?: any }> = [];
        const seenUrls = new Set<string>(); // Deduplication by URL
        
        // 1. Check for top-level images array (from API)
        if ((brand as any).images && Array.isArray((brand as any).images)) {
          (brand as any).images.forEach((img: any) => {
            const metadata = img.metadata || {};
            const role = metadata.role || "";
            const url = img.url || "";
            const id = img.id || "";
            
            // ✅ ONLY filter social icons and platform logos (never useful)
            if (role === "social_icon" || role === "platform_logo") {
              return;
            }
            
            // ✅ Skip if excluded locally
            if (id && excludedImageIds.has(id)) {
              return;
            }
            
            // ✅ DEDUPE: Only add if not already seen
            if (url && !seenUrls.has(url)) {
              brandImages.push(img);
              seenUrls.add(url);
            }
          });
        }
        
        // Also check brandImages alias
        if ((brand as any).brandImages && Array.isArray((brand as any).brandImages)) {
          (brand as any).brandImages.forEach((img: any) => {
            const metadata = img.metadata || {};
            const role = metadata.role || "";
            const url = img.url || "";
            const id = img.id || "";
            
            // ✅ ONLY filter social icons and platform logos
            if (role === "social_icon" || role === "platform_logo") {
              return;
            }
            
            // ✅ Skip if excluded locally
            if (id && excludedImageIds.has(id)) {
              return;
            }
            
            // ✅ DEDUPE: Only add if not already seen
            if (url && !seenUrls.has(url)) {
              brandImages.push(img);
              seenUrls.add(url);
            }
          });
        }
        
        // 2. Check approvedAssets.uploadedPhotos (filtered by source='scrape')
        if (brand.approvedAssets?.uploadedPhotos) {
          brand.approvedAssets.uploadedPhotos.forEach((img: any) => {
            const metadata = img.metadata || {};
            const source = img.source || metadata.source || "";
            const role = metadata.role || "";
            const url = img.url || "";
            const id = img.id || "";
            
            // Only include scraped images
            if (source !== "scrape") return;
            
            // ✅ ONLY filter social icons and platform logos
            if (role === "social_icon" || role === "platform_logo") {
              return;
            }
            
            // ✅ Skip if excluded locally
            if (id && excludedImageIds.has(id)) {
              return;
            }
            
            // ✅ DEDUPE: Only add if not already seen
            if (url && !seenUrls.has(url)) {
              brandImages.push(img);
              seenUrls.add(url);
            }
          });
        }
        
        // Only render section if we have images
        if (brandImages.length === 0) {
          return null;
        }
        
        // Calculate hidden count (locally excluded + server excluded)
        const locallyExcludedCount = excludedImageIds.size;
        const serverExcludedCount = hiddenImages.filter(img => !restoredImageIds.has(img.id)).length;
        const totalHiddenCount = showHiddenImages ? serverExcludedCount : (locallyExcludedCount + serverExcludedCount);
        
        return (
          <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Brand Images</h3>
                <p className="text-xs text-slate-600">
                  {brandImages.length} image{brandImages.length !== 1 ? 's' : ''} scraped from your website
                </p>
              </div>
              <div className="flex items-center gap-3">
                {excludeError && (
                  <span className="text-xs text-red-500 animate-pulse">{excludeError}</span>
                )}
                {/* ✅ NEW: Show Hidden toggle button */}
                <button
                  onClick={() => setShowHiddenImages(!showHiddenImages)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    showHiddenImages 
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title={showHiddenImages ? "Hide removed images" : "Show removed images"}
                >
                  {showHiddenImages ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      Hide removed
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      Show removed {totalHiddenCount > 0 && `(${totalHiddenCount})`}
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Active Brand Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {brandImages.slice(0, 15).map((img, idx) => (
                <div
                  key={img.id || idx}
                  className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-400 transition-colors group"
                >
                  <img
                    src={img.url}
                    alt={img.filename || `Brand image ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* ✅ X button to remove image from brand */}
                  {img.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExcludeImage(img.id!, img.url);
                      }}
                      disabled={isExcluding === img.id}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove from brand images"
                    >
                      {isExcluding === img.id ? (
                        <RefreshCw className="w-3 h-3 text-white animate-spin" />
                      ) : (
                        <X className="w-3 h-3 text-white" />
                      )}
                    </button>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                </div>
              ))}
            </div>
            {brandImages.length > 15 && (
              <p className="text-xs text-slate-500 text-center mt-4">
                Showing 15 of {brandImages.length} images
              </p>
            )}
            
            {/* ✅ NEW: Hidden/Removed Images Section */}
            {showHiddenImages && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <EyeOff className="w-4 h-4 text-slate-400" />
                  <h4 className="text-sm font-bold text-slate-700">Removed Images</h4>
                  {isLoadingHidden && (
                    <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
                  )}
                </div>
                
                {isLoadingHidden ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                    <span className="ml-2 text-sm text-slate-500">Loading hidden images...</span>
                  </div>
                ) : hiddenImages.filter(img => !restoredImageIds.has(img.id)).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-lg">
                    No hidden images. Images you remove will appear here.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {hiddenImages
                      .filter(img => !restoredImageIds.has(img.id))
                      .map((img, idx) => (
                        <div
                          key={img.id || idx}
                          className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-dashed border-slate-300 group"
                        >
                          <img
                            src={img.url}
                            alt={img.filename || `Hidden image ${idx + 1}`}
                            className="w-full h-full object-cover opacity-50 grayscale"
                            loading="lazy"
                          />
                          {/* Restore button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreImage(img.id, img.url);
                            }}
                            disabled={isRestoring === img.id}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Restore this image"
                          >
                            {isRestoring === img.id ? (
                              <RefreshCw className="w-5 h-5 text-white animate-spin" />
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <RotateCcw className="w-5 h-5 text-white" />
                                <span className="text-xs font-bold text-white">Restore</span>
                              </div>
                            )}
                          </button>
                          {/* Hidden badge */}
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-slate-800/70 rounded text-[10px] font-bold text-white">
                            Hidden
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* BFS Baseline */}
      {brand.performanceInsights?.bfsBaseline && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-black text-slate-900">BFS Baseline</h3>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-600">
                {brand.performanceInsights.bfsBaseline.calculatedAt
                  ? new Date(brand.performanceInsights.bfsBaseline.calculatedAt).toLocaleDateString()
                  : "Not calculated"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Baseline Score */}
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">BASELINE SCORE</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-green-600">
                  {(brand.performanceInsights.bfsBaseline.score * 100).toFixed(0)}%
                </span>
                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                    style={{ width: `${brand.performanceInsights.bfsBaseline.score * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                This is the baseline score used to compare generated content against your brand guidelines.
              </p>
            </div>

            {/* Sample Content Preview */}
            {brand.performanceInsights.bfsBaseline.sampleContent && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2">
                  <span>View Sample Baseline Content</span>
                  <span className="text-slate-400 group-open:hidden">▼</span>
                  <span className="text-slate-400 hidden group-open:inline">▲</span>
                </summary>
                <div className="mt-3 p-4 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {brand.performanceInsights.bfsBaseline.sampleContent}
                  </p>
                </div>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Deep Dive CTAs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <button className="px-4 py-3 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors font-bold text-xs flex flex-col items-center gap-1">
          👥
          <span>Personas</span>
        </button>
        <button className="px-4 py-3 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors font-bold text-xs flex flex-col items-center gap-1">
          🎯
          <span>Goals</span>
        </button>
        <button className="px-4 py-3 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors font-bold text-xs flex flex-col items-center gap-1">
          ⚖️
          <span>Guardrails</span>
        </button>
      </div>
    </div>
  );
}
