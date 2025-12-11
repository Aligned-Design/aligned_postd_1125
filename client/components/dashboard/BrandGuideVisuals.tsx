/**
 * BrandGuideVisuals Component
 * 
 * A curated designer layout for Brand Guide visuals that groups images by role:
 * - Logos: Dedicated row with max 2 featured logos
 * - Brand Images: Gallery for hero, brand_image, team, product
 * - Hidden by default: icon, social_icon, platform_logo
 * 
 * Includes role override controls and color palette with extraction metadata.
 */

import { useState, useCallback, useEffect } from "react";
import { RefreshCw, X, Eye, EyeOff, RotateCcw, ChevronDown, Sparkles, Info } from "lucide-react";
import { apiPost, apiPatch } from "@/lib/api";
import { cn } from "@/lib/design-system";
import { useToast } from "@/hooks/use-toast";

// Role types that map to the backend
export type MediaRole = 
  | "logo" 
  | "brand_image" 
  | "hero" 
  | "team" 
  | "product" 
  | "icon" 
  | "social_icon" 
  | "platform_logo" 
  | "partner_logo"
  | "background"
  | "other";

// Roles that are hidden by default in the Brand Guide
const HIDDEN_ROLES: MediaRole[] = ["icon", "social_icon", "platform_logo", "partner_logo"];

// Roles that display in Brand Images gallery
const BRAND_IMAGE_ROLES: MediaRole[] = ["hero", "brand_image", "team", "product", "background", "other"];

interface MediaAsset {
  id: string;
  url: string;
  filename?: string;
  metadata?: {
    role?: MediaRole;
    source?: string;
    width?: number;
    height?: number;
    confidence?: number;
    extractionSource?: string;
    userOverridden?: boolean;
  };
}

interface ExtractedColor {
  hex: string;
  source?: "dom" | "screenshot" | "fallback" | string;
  confidence?: number;
  weight?: number;
  extractionSource?: string; // e.g., "hero background", "primary button"
}

interface BrandGuideVisualsProps {
  brandId: string;
  logos?: MediaAsset[];
  brandImages?: MediaAsset[];
  allImages?: MediaAsset[];
  colors?: ExtractedColor[] | string[];
  colorPaletteSource?: "dom" | "screenshot" | "fallback";
  colorPaletteConfidence?: number;
  className?: string;
  onRoleChange?: (assetId: string, newRole: MediaRole) => void;
  onExclude?: (assetId: string) => void;
  onRestore?: (assetId: string) => void;
}

// Role display labels
const ROLE_LABELS: Record<MediaRole, string> = {
  logo: "Logo",
  brand_image: "Brand Image",
  hero: "Hero",
  team: "Team",
  product: "Product",
  icon: "Icon",
  social_icon: "Social Icon",
  platform_logo: "Platform Logo",
  partner_logo: "Partner Logo",
  background: "Background",
  other: "Other",
};

// Role selector options (what users can change to)
const ROLE_OPTIONS: { value: MediaRole; label: string }[] = [
  { value: "logo", label: "Logo" },
  { value: "brand_image", label: "Brand Image" },
  { value: "hero", label: "Hero" },
  { value: "team", label: "Team" },
  { value: "product", label: "Product" },
  { value: "background", label: "Background" },
  { value: "other", label: "Other" },
];

/**
 * RoleSelector - Dropdown to change an asset's role
 */
function RoleSelector({
  assetId,
  currentRole,
  onRoleChange,
  isLoading,
}: {
  assetId: string;
  currentRole: MediaRole;
  onRoleChange: (assetId: string, newRole: MediaRole) => void;
  isLoading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (role: MediaRole) => {
    if (role !== currentRole) {
      onRoleChange(assetId, role);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all",
          "bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <RefreshCw className="w-3 h-3 animate-spin" />
        ) : (
          <>
            {ROLE_LABELS[currentRole]}
            <ChevronDown className="w-3 h-3" />
          </>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-1 z-50 min-w-[120px] bg-white rounded-lg shadow-lg border border-slate-200 py-1 overflow-hidden">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(option.value);
                }}
                className={cn(
                  "w-full px-3 py-1.5 text-left text-xs font-medium transition-colors",
                  option.value === currentRole
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * ColorSwatch - Individual color display with metadata tooltip
 */
function ColorSwatch({ 
  color, 
  showLabel = false 
}: { 
  color: ExtractedColor | string; 
  showLabel?: boolean;
}) {
  const hex = typeof color === "string" ? color : color.hex;
  const metadata = typeof color === "string" ? null : color;
  
  // Build tooltip text
  let tooltipText = hex.toUpperCase();
  if (metadata) {
    if (metadata.extractionSource) {
      tooltipText += `\nFrom: ${metadata.extractionSource}`;
    }
    if (metadata.source) {
      tooltipText += `\nSource: ${metadata.source}`;
    }
    if (metadata.confidence !== undefined) {
      const confidenceLabel = metadata.confidence > 0.7 ? "high" : metadata.confidence > 0.4 ? "medium" : "low";
      tooltipText += `\nConfidence: ${confidenceLabel}`;
    }
  }

  return (
    <div className="group relative text-center">
      <div
        className="w-12 h-12 rounded-lg border-2 border-white shadow-md cursor-help transition-transform group-hover:scale-110"
        style={{ backgroundColor: hex }}
        title={tooltipText}
      />
      {showLabel && (
        <div className="mt-1.5 space-y-0.5">
          <p className="text-[10px] font-mono text-slate-600 uppercase">{hex}</p>
          {metadata?.extractionSource && (
            <p className="text-[9px] text-slate-400 truncate max-w-[60px]" title={metadata.extractionSource}>
              {metadata.extractionSource}
            </p>
          )}
          {metadata?.confidence !== undefined && (
            <p className={cn(
              "text-[9px] font-medium",
              metadata.confidence > 0.7 ? "text-green-600" : 
              metadata.confidence > 0.4 ? "text-amber-600" : "text-slate-400"
            )}>
              {metadata.confidence > 0.7 ? "high" : metadata.confidence > 0.4 ? "medium" : "low"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ImageCard - Individual image display with role selector and actions
 */
function ImageCard({
  asset,
  showRoleSelector = true,
  onRoleChange,
  onExclude,
  isUpdating,
  isExcluding,
  size = "medium",
}: {
  asset: MediaAsset;
  showRoleSelector?: boolean;
  onRoleChange?: (assetId: string, newRole: MediaRole) => void;
  onExclude?: (assetId: string) => void;
  isUpdating?: boolean;
  isExcluding?: boolean;
  size?: "small" | "medium" | "large";
}) {
  const currentRole: MediaRole = asset.metadata?.role || "other";
  const sizeClasses = {
    small: "h-20",
    medium: "h-28",
    large: "h-40",
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-400 transition-all bg-slate-100">
      <img
        src={asset.url}
        alt={asset.filename || "Brand asset"}
        className={cn(
          "w-full object-cover transition-transform group-hover:scale-105",
          sizeClasses[size]
        )}
        loading="lazy"
      />
      
      {/* Overlay controls */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Role selector (bottom left) */}
        {showRoleSelector && onRoleChange && (
          <div className="absolute bottom-1 left-1">
            <RoleSelector
              assetId={asset.id}
              currentRole={currentRole}
              onRoleChange={onRoleChange}
              isLoading={isUpdating || false}
            />
          </div>
        )}

        {/* Exclude button (top right) */}
        {onExclude && asset.id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExclude(asset.id);
            }}
            disabled={isExcluding}
            className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
            title="Remove from brand"
          >
            {isExcluding ? (
              <RefreshCw className="w-3 h-3 text-white animate-spin" />
            ) : (
              <X className="w-3 h-3 text-white" />
            )}
          </button>
        )}

        {/* User override badge */}
        {asset.metadata?.userOverridden && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-500 rounded text-[9px] font-bold text-white">
            Edited
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandGuideVisuals({
  brandId,
  logos: initialLogos = [],
  brandImages: initialBrandImages = [],
  allImages = [],
  colors = [],
  colorPaletteSource,
  colorPaletteConfidence,
  className,
  onRoleChange: externalRoleChange,
  onExclude: externalExclude,
  onRestore: externalRestore,
}: BrandGuideVisualsProps) {
  const { toast } = useToast();
  
  // Local state for optimistic updates
  const [logos, setLogos] = useState<MediaAsset[]>(initialLogos);
  const [brandImagesState, setBrandImages] = useState<MediaAsset[]>(initialBrandImages);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [excludingId, setExcludingId] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenAssets, setHiddenAssets] = useState<MediaAsset[]>([]);
  const [loadingHidden, setLoadingHidden] = useState(false);

  // Sync with props
  useEffect(() => {
    setLogos(initialLogos);
  }, [initialLogos]);

  useEffect(() => {
    setBrandImages(initialBrandImages);
  }, [initialBrandImages]);

  // Derive images from allImages if specific arrays not provided
  useEffect(() => {
    if (allImages.length > 0 && initialLogos.length === 0 && initialBrandImages.length === 0) {
      const derivedLogos = allImages.filter(
        (img) => img.metadata?.role === "logo" && !excludedIds.has(img.id)
      ).slice(0, 2);
      
      const derivedBrandImages = allImages.filter(
        (img) => 
          !HIDDEN_ROLES.includes(img.metadata?.role || "other") &&
          img.metadata?.role !== "logo" &&
          !excludedIds.has(img.id)
      ).slice(0, 15);

      setLogos(derivedLogos);
      setBrandImages(derivedBrandImages);
    }
  }, [allImages, initialLogos.length, initialBrandImages.length, excludedIds]);

  // Handle role change via API
  const handleRoleChange = useCallback(async (assetId: string, newRole: MediaRole) => {
    if (!assetId) return;
    
    setUpdatingRole(assetId);
    
    try {
      // Optimistic update
      const updateAssetRole = (assets: MediaAsset[]) =>
        assets.map((a) =>
          a.id === assetId
            ? { ...a, metadata: { ...a.metadata, role: newRole, userOverridden: true } }
            : a
        );

      setLogos(updateAssetRole);
      setBrandImages(updateAssetRole);

      // API call
      await apiPatch(`/api/media/${assetId}/role`, { role: newRole });

      // Notify parent
      externalRoleChange?.(assetId, newRole);

      // Re-categorize if role changed to/from logo
      if (newRole === "logo") {
        // Move to logos if not already there
        const asset = [...logos, ...brandImagesState].find((a) => a.id === assetId);
        if (asset && !logos.some((l) => l.id === assetId)) {
          setBrandImages((prev) => prev.filter((a) => a.id !== assetId));
          setLogos((prev) => [...prev.slice(0, 1), { ...asset, metadata: { ...asset.metadata, role: newRole } }].slice(0, 2));
        }
      } else if (logos.some((l) => l.id === assetId)) {
        // Was a logo, now something else - move to brand images
        const asset = logos.find((a) => a.id === assetId);
        if (asset) {
          setLogos((prev) => prev.filter((a) => a.id !== assetId));
          setBrandImages((prev) => [{ ...asset, metadata: { ...asset.metadata, role: newRole } }, ...prev].slice(0, 15));
        }
      }

      toast({
        title: "Role updated",
        description: `Changed to "${ROLE_LABELS[newRole]}"`,
      });
    } catch (error) {
      console.error("[BrandGuideVisuals] Role update failed:", error);
      toast({
        title: "Update failed",
        description: "Could not update image role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingRole(null);
    }
  }, [logos, brandImagesState, externalRoleChange, toast]);

  // Handle exclude (soft delete)
  const handleExclude = useCallback(async (assetId: string) => {
    if (!assetId || excludingId) return;
    
    setExcludingId(assetId);
    
    try {
      // Optimistic update
      setExcludedIds((prev) => new Set([...prev, assetId]));
      setLogos((prev) => prev.filter((a) => a.id !== assetId));
      setBrandImages((prev) => prev.filter((a) => a.id !== assetId));

      // API call
      await apiPost(`/api/media/${assetId}/exclude`, {});

      externalExclude?.(assetId);

      toast({
        title: "Image hidden",
        description: "You can restore it from the hidden images section.",
      });
    } catch (error) {
      // Rollback
      setExcludedIds((prev) => {
        const next = new Set(prev);
        next.delete(assetId);
        return next;
      });
      
      console.error("[BrandGuideVisuals] Exclude failed:", error);
      toast({
        title: "Action failed",
        description: "Could not hide image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExcludingId(null);
    }
  }, [excludingId, externalExclude, toast]);

  // Handle restore
  const handleRestore = useCallback(async (assetId: string) => {
    if (!assetId) return;
    
    try {
      // Optimistic update
      setExcludedIds((prev) => {
        const next = new Set(prev);
        next.delete(assetId);
        return next;
      });
      setHiddenAssets((prev) => prev.filter((a) => a.id !== assetId));

      // API call
      await apiPost(`/api/media/${assetId}/restore`, {});

      externalRestore?.(assetId);

      toast({
        title: "Image restored",
        description: "The image is now visible in your brand assets.",
      });
    } catch (error) {
      console.error("[BrandGuideVisuals] Restore failed:", error);
      toast({
        title: "Restore failed",
        description: "Could not restore image. Please try again.",
        variant: "destructive",
      });
    }
  }, [externalRestore, toast]);

  // Load hidden assets when toggle is enabled
  useEffect(() => {
    if (showHidden && hiddenAssets.length === 0 && !loadingHidden) {
      setLoadingHidden(true);
      import("@/lib/api").then(({ apiGet }) => {
        apiGet<{ items: MediaAsset[] }>(`/api/media/excluded?brandId=${brandId}`)
          .then((response) => {
            setHiddenAssets(response.items || []);
          })
          .catch((err) => {
            console.error("[BrandGuideVisuals] Failed to load hidden assets:", err);
          })
          .finally(() => {
            setLoadingHidden(false);
          });
      });
    }
  }, [showHidden, brandId, hiddenAssets.length, loadingHidden]);

  // Filter out excluded images from display
  const visibleLogos = logos.filter((l) => !excludedIds.has(l.id));
  const visibleBrandImages = brandImagesState.filter((b) => !excludedIds.has(b.id));

  // Normalize colors to ExtractedColor format
  const normalizedColors: ExtractedColor[] = colors.map((c) =>
    typeof c === "string" ? { hex: c } : c
  );

  return (
    <div className={cn("space-y-8", className)}>
      {/* Color Palette Section */}
      {normalizedColors.length > 0 && (
        <section className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Brand Colors</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {normalizedColors.length} primary colors extracted from your brand
              </p>
            </div>
            {(colorPaletteSource || colorPaletteConfidence !== undefined) && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info className="w-3.5 h-3.5" />
                <span>
                  {colorPaletteSource && `Source: ${colorPaletteSource}`}
                  {colorPaletteSource && colorPaletteConfidence !== undefined && " · "}
                  {colorPaletteConfidence !== undefined && 
                    `Confidence: ${colorPaletteConfidence > 0.7 ? "high" : colorPaletteConfidence > 0.4 ? "medium" : "low"}`
                  }
                </span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4">
            {normalizedColors.slice(0, 6).map((color, idx) => (
              <ColorSwatch key={color.hex || idx} color={color} showLabel />
            ))}
          </div>
        </section>
      )}

      {/* Logos Section */}
      {visibleLogos.length > 0 && (
        <section className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Logos</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Featured brand logos (max 2)
              </p>
            </div>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
              {visibleLogos.length} logo{visibleLogos.length !== 1 ? "s" : ""}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {visibleLogos.slice(0, 2).map((logo) => (
              <div 
                key={logo.id} 
                className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 p-4 flex items-center justify-center min-h-[120px] group"
              >
                <img
                  src={logo.url}
                  alt={logo.filename || "Brand logo"}
                  className="max-h-24 max-w-full object-contain"
                  loading="lazy"
                />
                
                {/* Hover controls */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg">
                  {/* Role selector */}
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <RoleSelector
                      assetId={logo.id}
                      currentRole={logo.metadata?.role || "logo"}
                      onRoleChange={handleRoleChange}
                      isLoading={updatingRole === logo.id}
                    />
                  </div>
                  
                  {/* Exclude button */}
                  {logo.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExclude(logo.id);
                      }}
                      disabled={excludingId === logo.id}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/30 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove from brand"
                    >
                      {excludingId === logo.id ? (
                        <RefreshCw className="w-3 h-3 text-white animate-spin" />
                      ) : (
                        <X className="w-3 h-3 text-white" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Brand Images Gallery */}
      {visibleBrandImages.length > 0 && (
        <section className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Brand Images</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Hero images, team photos, products & more
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
                {visibleBrandImages.length} image{visibleBrandImages.length !== 1 ? "s" : ""}
              </span>
              
              {/* Show hidden toggle */}
              <button
                onClick={() => setShowHidden(!showHidden)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                  showHidden 
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {showHidden ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    Hide removed
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    Show removed
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {visibleBrandImages.slice(0, 15).map((img) => (
              <ImageCard
                key={img.id}
                asset={img}
                onRoleChange={handleRoleChange}
                onExclude={handleExclude}
                isUpdating={updatingRole === img.id}
                isExcluding={excludingId === img.id}
                size="medium"
              />
            ))}
          </div>
          
          {visibleBrandImages.length > 15 && (
            <p className="text-xs text-slate-500 text-center mt-4">
              Showing 15 of {visibleBrandImages.length} images
            </p>
          )}

          {/* Hidden/Removed Images */}
          {showHidden && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <EyeOff className="w-4 h-4 text-slate-400" />
                <h4 className="text-sm font-bold text-slate-700">Removed Images</h4>
                {loadingHidden && (
                  <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
                )}
              </div>
              
              {loadingHidden ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                  <span className="ml-2 text-sm text-slate-500">Loading hidden images...</span>
                </div>
              ) : hiddenAssets.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-lg">
                  No hidden images. Images you remove will appear here.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {hiddenAssets.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-dashed border-slate-300 group"
                    >
                      <img
                        src={img.url}
                        alt={img.filename || "Hidden image"}
                        className="w-full h-full object-cover opacity-50 grayscale"
                        loading="lazy"
                      />
                      {/* Restore button */}
                      <button
                        onClick={() => handleRestore(img.id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Restore this image"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <RotateCcw className="w-5 h-5 text-white" />
                          <span className="text-xs font-bold text-white">Restore</span>
                        </div>
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
        </section>
      )}

      {/* Empty state */}
      {visibleLogos.length === 0 && visibleBrandImages.length === 0 && normalizedColors.length === 0 && (
        <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-8 text-center">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">No Brand Visuals Yet</h3>
          <p className="text-sm text-slate-500">
            Complete website scraping during onboarding to automatically extract your brand's logos, images, and colors.
          </p>
        </div>
      )}
    </div>
  );
}

export default BrandGuideVisuals;

