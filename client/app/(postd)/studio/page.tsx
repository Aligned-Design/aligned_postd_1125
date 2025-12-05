import { useState, useEffect, useCallback } from "react";
import { FirstVisitTooltip } from "@/components/dashboard/FirstVisitTooltip";
import { CreativeStudioTemplateGrid } from "@/components/dashboard/CreativeStudioTemplateGrid";
import { CreativeStudioCanvas } from "@/components/dashboard/CreativeStudioCanvas";
import { CreativeStudioBrandKit } from "@/components/dashboard/CreativeStudioBrandKit";
import { CreativeStudioAdvisor } from "@/components/dashboard/CreativeStudioAdvisor";
import { SmartResizeModal } from "@/components/dashboard/SmartResizeModal";
import { MultiPlatformPreview } from "@/components/dashboard/MultiPlatformPreview";
import { ColorPickerModal } from "@/components/dashboard/ColorPickerModal";
import { ImageSelectorModal } from "@/components/dashboard/ImageSelectorModal";
import { ActionButtonsHeader } from "@/components/dashboard/ActionButtonsHeader";
import { RenameAssetModal } from "@/components/dashboard/RenameAssetModal";
import { PublishConfirmModal } from "@/components/dashboard/PublishConfirmModal";
import { ScheduleModal } from "@/components/dashboard/ScheduleModal";
import { PlatformSelectorModal } from "@/components/dashboard/PlatformSelectorModal";
import { BackgroundPickerModal } from "@/components/dashboard/BackgroundPickerModal";
import { ElementsDrawer } from "@/components/dashboard/ElementsDrawer";
import { Menu, Download, Share2, Send, Calendar, Save, X, Zap, Eye, Layout, Layers, Image as ImageIcon } from "lucide-react";
import {
  Design,
  CanvasItem,
  DesignFormat,
  createInitialDesign,
  pushToHistory,
  undo,
  redo,
  CreativeStudioState,
} from "@/types/creativeStudio";
import { useToast } from "@/hooks/use-toast";
import { safeGetJSON, safeSetJSON } from "@/lib/safeLocalStorage";
import { useUser } from "@/contexts/UserContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useBrand } from "@/contexts/BrandContext";
import { useBrandGuide } from "@/hooks/useBrandGuide";
import { generateCaptions } from "@/lib/generateCaption";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { ElementSidebar } from "@/components/dashboard/ElementSidebar";
import { AiGenerationModal } from "@/components/postd/studio/AiGenerationModal";
import { StudioEntryScreen } from "@/components/postd/studio/StudioEntryScreen";
import { StudioHeader } from "@/components/postd/studio/StudioHeader";
import { ContextualFloatingToolbar } from "@/components/postd/studio/ContextualFloatingToolbar";
import { ContextualPropertiesPanel } from "@/components/postd/studio/ContextualPropertiesPanel";
import { CanvaIntegrationModal } from "@/components/postd/integrations/CanvaIntegrationModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { AiDocVariant, AiDesignVariant } from "@/lib/types/aiContent";
import type { BrandGuide } from "@/types/brandGuide";
import { logTelemetry, logError, logWarning } from "@/lib/logger";
import type { StarterTemplate } from "@/lib/studio/templates";
import { createTemplateDesign } from "@/lib/studio/templates";
import { createContentPackageFromTemplate } from "@/lib/studio/template-content-package";
import { createContentPackageFromUpload } from "@/lib/studio/upload-content-package";
import { VariantSelector } from "@/components/postd/studio/VariantSelector";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import type {
  SaveDesignRequest,
  SaveDesignResponse,
  UpdateDesignRequest,
  UpdateDesignResponse,
  ScheduleDesignRequest,
  ScheduleDesignResponse,
} from "@shared/creative-studio";
import { FORMAT_PRESETS } from "@shared/creative-studio";

const AUTOSAVE_DELAY = 3000; // 3 seconds

/**
 * Calculate zoom level to fit canvas on screen
 * Accounts for sidebar (~256px), padding (64px total), and header (~80px)
 * Returns zoom percentage (e.g., 50 for 50%)
 */
function calculateFitToScreenZoom(canvasWidth: number, canvasHeight: number): number {
  // Estimate viewport dimensions
  // Sidebar: ~256px, padding: ~64px total, header: ~80px
  // Available viewport: ~1400px wide, ~900px tall (conservative estimate)
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth - 256 - 64 : 1400;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight - 80 - 64 : 900;

  // Calculate zoom to fit both width and height with 20px margin
  const margin = 20;
  const maxWidth = viewportWidth - margin * 2;
  const maxHeight = viewportHeight - margin * 2;

  const zoomByWidth = (maxWidth / canvasWidth) * 100;
  const zoomByHeight = (maxHeight / canvasHeight) * 100;

  // Use the smaller zoom to ensure canvas fits entirely on screen
  const fitZoom = Math.min(zoomByWidth, zoomByHeight);

  // Clamp between 25% (very zoomed out) and 100% (actual size)
  return Math.max(25, Math.min(100, Math.floor(fitZoom)));
}

export default function CreativeStudio() {
  // Brand data - load from Supabase via useBrandGuide hook
  const { currentBrand, brands, loading: brandsLoading } = useBrand();
  const { brandGuide: brand, hasBrandGuide, isLoading: isBrandKitLoading } = useBrandGuide();
  const { user } = useUser();
  const { currentWorkspace } = useWorkspace();

  // Canvas State
  const [state, setState] = useState<CreativeStudioState>({
    design: null,
    selectedItemId: null,
    startMode: null,
    zoom: 100,
    isDragging: false,
    showBrandKit: false, // Hidden by default - canvas is hero
    showAdvisor: false, // Hidden by default
    history: [],
    historyIndex: -1,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("");
  const [showSmartResize, setShowSmartResize] = useState(false);
  const [showPlatformPreview, setShowPlatformPreview] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [pendingImageItemId, setPendingImageItemId] = useState<string | null>(null);

  // Action dropdown modals
  const [showRenameAsset, setShowRenameAsset] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);

  // Elements drawer
  const [showElementsDrawer, setShowElementsDrawer] = useState(false);
  const [activeDrawerSection, setActiveDrawerSection] = useState<"elements" | "templates" | "background" | "media">("elements");
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // AI Generation Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTemplateFormat, setAiTemplateFormat] = useState<DesignFormat | null>(null);
  
  // Canva Integration Modal
  const [showCanvaModal, setShowCanvaModal] = useState(false);

  // Crop mode state
  const [croppingItemId, setCroppingItemId] = useState<string | null>(null);
  const [cropAspectRatio, setCropAspectRatio] = useState<"1:1" | "9:16" | "16:9" | "free">("free");

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ContentPackage for agent collaboration
  const [contentPackageId, setContentPackageId] = useState<string | null>(null);
  const [isMakingOnBrand, setIsMakingOnBrand] = useState(false);
  
  // Variant selection state
  const [pendingVariants, setPendingVariants] = useState<AiDesignVariant[] | null>(null);
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);

  const { toast } = useToast();

  /**
   * Get valid brandId from context - single source of truth
   * If no brands exist, returns a workspace-level default brand ID
   * This allows Creative Studio to work even without explicit brands
   */
  const getValidBrandId = useCallback((): string | null => {
    // BrandContext already auto-selects first brand if available
    if (currentBrand?.id) {
      return currentBrand.id;
    }
    
    // If no currentBrand but brands exist, auto-select first (silent)
    if (brands.length > 0 && !brandsLoading) {
      const firstBrand = brands[0];
      if (firstBrand?.id) {
        return firstBrand.id;
      }
    }
    
    // If no brands exist but workspace exists, use workspace-level default brand
    // This allows Studio to work without explicit brands
    if (brands.length === 0 && !brandsLoading && currentWorkspace?.id) {
      return `workspace-${currentWorkspace.id}`;
    }
    
    // Return null only while loading
    return null;
  }, [currentBrand, brands, brandsLoading, currentWorkspace]);

  /**
   * Get brandId for an action that requires persistence (save, schedule, publish)
   * For non-persistent actions (blank canvas, upload, import), use getValidBrandId() directly
   */
  const requireBrandForAction = useCallback((actionName: string, requirePersisted: boolean = true): string | null => {
    const brandId = getValidBrandId();
    
    // Wait for brands to finish loading
    if (brandsLoading) {
      return null; // Will retry when loading completes
    }
    
    // For non-persistent actions (blank canvas, upload, import), allow workspace default
    if (!requirePersisted) {
      return brandId;
    }
    
    // For persistent actions (save, schedule), prefer real brands but allow workspace default
    // If we have brands but no currentBrand, auto-select silently
    if (!brandId && brands.length > 0) {
      return brands[0]?.id || null;
    }
    
    return brandId;
  }, [getValidBrandId, brands, brandsLoading]);

  // Load brand guide from Supabase via Brand Context
  useEffect(() => {
    // Brand is loaded via BrandContext - no localStorage needed
    // The Brand Guide page syncs to Supabase, and we read from there
  }, []);

  // Autosave design to API and localStorage
  useEffect(() => {
    if (!state.design) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      
      // Save to localStorage for offline support
      safeSetJSON("creativeStudio_design", state.design);
      
      // Save to API if design has an ID (has been saved before)
      if (state.design.id && !state.design.id.startsWith("design-") && !state.design.id.startsWith("text-") && !state.design.id.startsWith("shape-") && !state.design.id.startsWith("image-")) {
        // Ensure we have a valid brandId for the update request
        const brandId = state.design.brandId || getValidBrandId();
        if (!brandId) {
          // Skip autosave if no brandId - will retry on next change
          setIsSaving(false);
          return;
        }

        try {
          const response = await fetch(`/api/studio/${state.design.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: state.design.name,
              format: state.design.format,
              width: state.design.width,
              height: state.design.height,
              brandId: brandId, // Include brandId for backend validation
              items: state.design.items,
              backgroundColor: state.design.backgroundColor,
              savedToLibrary: state.design.savedToLibrary,
            }),
          });

          if (response.ok) {
            const data: UpdateDesignResponse = await response.json();
            // Update design with server response, preserving items structure
            setState((prev) => {
              if (!prev.design) return prev;
              const mergedDesign: Design = {
                ...prev.design,
                ...data.design,
                items: prev.design.items, // Keep existing items structure (CanvasItem[])
              };
              return {
                ...prev,
                design: mergedDesign,
              };
            });
          }
        } catch (error) {
          logError("Autosave failed", error instanceof Error ? error : new Error(String(error)));
          // Continue silently - localStorage backup is in place
        } finally {
          setIsSaving(false);
        }
      } else {
        setIsSaving(false);
      }
      
      setLastSaved(new Date().toLocaleTimeString());
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(timer);
  }, [state.design, getValidBrandId]);

  // Load design from localStorage on mount (defensive)
  useEffect(() => {
    const parsedDesign = safeGetJSON("creativeStudio_design", null);
    if (parsedDesign) {
      const fitZoom = calculateFitToScreenZoom(parsedDesign.width, parsedDesign.height);
      setState((prev) => ({
        ...prev,
        design: parsedDesign,
        zoom: fitZoom,
        history: [parsedDesign],
        historyIndex: 0,
      }));
    }
  }, []);

  // Debug: Log when design state changes
  useEffect(() => {
    logTelemetry("[Studio] state.design changed", { 
      hasDesign: !!state.design, 
      designId: state.design?.id,
      itemsCount: state.design?.items.length 
    });
  }, [state.design]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveToLibrary();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSendToQueue();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
        setShowScheduleModal(true);
      } else if (e.key === "Delete" && state.selectedItemId) {
        e.preventDefault();
        handleDeleteItem();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "r" && state.selectedItemId) {
        e.preventDefault();
        handleRotateItem(45);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.design, state.selectedItemId, handleDeleteItem, handleRotateItem, handleSaveToLibrary, handleSendToQueue]);

  const handleStartDesign = (mode: "ai" | "template" | "scratch", format: DesignFormat) => {
    // For blank canvas, don't require persisted brand (allow workspace default)
    const brandId = requireBrandForAction("create design", false);
    if (!brandId) {
      // Only wait if still loading
      if (brandsLoading) {
        return;
      }
      // If not loading and no brandId, something went wrong - but don't block
      logWarning("[Studio] No brandId available for blank canvas, using fallback");
    }

    const newDesign = createInitialDesign(format, brandId || "workspace-default", "");
    const fitZoom = calculateFitToScreenZoom(newDesign.width, newDesign.height);
    setState((prev) => ({
      ...prev,
      design: newDesign,
      startMode: mode,
      selectedItemId: null,
      zoom: fitZoom,
      history: [newDesign],
      historyIndex: 0,
    }));
    
    // Telemetry
    logTelemetry("studio_canvas_opened", {
      mode,
      format,
      brandId: brandId || "workspace-default",
      timestamp: new Date().toISOString(),
    });
  };

  const handleCancel = () => {
    // Clean state reset: clear design, history, and localStorage
    safeSetJSON("creativeStudio_design", null);
    setState({
      design: null,
      selectedItemId: null,
      startMode: null,
      zoom: 100,
      isDragging: false,
      showBrandKit: false,
      showAdvisor: false,
      history: [],
      historyIndex: -1,
    });
    setAiTemplateFormat(null);
    setHasUnsavedChanges(false);
    
    // Telemetry
    logTelemetry("studio_canvas_closed", {
      hadDesign: !!state.design,
      designId: state.design?.id,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSelectItem = (itemId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedItemId: itemId,
    }));
  };

  const handleUpdateItem = (itemId: string, updates: Partial<CanvasItem>) => {
    setState((prev) => {
      if (!prev.design) return prev;

      const updatedItems = prev.design.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      );

      const updatedDesign: Design = {
        ...prev.design,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      return pushToHistory(prev, updatedDesign);
    });
  };

  const handleUpdateDesign = (updates: Partial<Design>) => {
    setState((prev) => {
      if (!prev.design) return prev;

      const updatedDesign: Design = {
        ...prev.design,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return pushToHistory(prev, updatedDesign);
    });

    // Mark as unsaved if not saving
    if (!updates.savedToLibrary) {
      setHasUnsavedChanges(true);
    }
  };

  const handleAddText = () => {
    setState((prev) => {
      if (!prev.design) return prev;

      const newItem: CanvasItem = {
        id: `text-${Date.now()}`,
        type: "text",
        x: 50,
        y: 50,
        width: 200,
        height: 100,
        rotation: 0,
        zIndex: prev.design.items.length,
        text: "Click to edit text",
        fontSize: 24,
        fontFamily: brand?.fontFamily || "Arial",
        fontColor: brand?.primaryColor || "#000000",
        fontWeight: "normal",
        textAlign: "center",
      };

      const updatedItems = [...prev.design.items, newItem];
      const updatedDesign: Design = {
        ...prev.design,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...pushToHistory(prev, updatedDesign),
        selectedItemId: newItem.id,
      };
    });
  };

  const handleAddImage = () => {
    setShowImageSelector(true);
  };

  const handleAddShape = (shapeType: "rectangle" | "circle") => {
    setState((prev) => {
      if (!prev.design) return prev;

      const newItem: CanvasItem = {
        id: `shape-${Date.now()}`,
        type: "shape",
        x: 50,
        y: 50,
        width: 150,
        height: 150,
        rotation: 0,
        zIndex: prev.design.items.length,
        shapeType,
        fill: brand?.primaryColor || "#3B82F6",
        stroke: "none",
      };

      const updatedItems = [...prev.design.items, newItem];
      const updatedDesign: Design = {
        ...prev.design,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...pushToHistory(prev, updatedDesign),
        selectedItemId: newItem.id,
      };
    });
  };

  const handleColorPicker = () => {
    setShowColorPicker(true);
  };

  const handleSelectColor = (color: string) => {
    if (state.selectedItemId && state.design) {
      const item = state.design.items.find((i) => i.id === state.selectedItemId);
      if (item) {
        const updates: Partial<CanvasItem> = {};
        if (item.type === "text") {
          updates.fontColor = color;
        } else if (item.type === "shape") {
          updates.fill = color;
        } else if (item.type === "background") {
          updates.backgroundColor = color;
        }
        handleUpdateItem(state.selectedItemId, updates);
        toast({
          title: "Color Applied",
          description: "Color applied to selected element",
        });
      }
    } else {
      toast({
        title: "Select an Element",
        description: "Select a shape or text to apply the color",
      });
    }
  };

  const handleSelectImage = async (imageUrl: string, imageName: string) => {
    setState((prev) => {
      if (!prev.design) return prev;

      // If there's a pending image item (from drag-drop), update it instead of creating new
      if (pendingImageItemId) {
        const updatedItems = prev.design.items.map((item) =>
          item.id === pendingImageItemId
            ? { ...item, imageUrl, imageName }
            : item
        );

        const updatedDesign: Design = {
          ...prev.design,
          items: updatedItems,
          updatedAt: new Date().toISOString(),
        };

        setPendingImageItemId(null);
        return {
          ...pushToHistory(prev, updatedDesign),
          selectedItemId: pendingImageItemId,
        };
      }

      // Otherwise, create a new image item (for direct "Add Image" button)
      const newItem: CanvasItem = {
        id: `image-${Date.now()}`,
        type: "image",
        x: 50,
        y: 50,
        width: 400,
        height: 400,
        rotation: 0,
        zIndex: prev.design.items.length,
        imageUrl,
        imageName,
      };

      const updatedItems = [...prev.design.items, newItem];
      const updatedDesign: Design = {
        ...prev.design,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...pushToHistory(prev, updatedDesign),
        selectedItemId: newItem.id,
        startMode: prev.startMode || "upload", // Mark as upload if not already set
      };
    });

    // ✅ PHASE 2: Create ContentPackage for uploaded image
    const brandId = getValidBrandId();
    if (brandId) {
      try {
        const contentPackage = createContentPackageFromUpload(
          imageUrl,
          imageName,
          brandId,
          state.design?.format
        );

        // Save ContentPackage via API
        try {
          const response = await fetch("/api/content-packages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contentPackage,
              brandId,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            setContentPackageId(result.contentPackageId || contentPackage.id);
          }
        } catch (error) {
          logWarning("[Studio] Failed to save ContentPackage for upload", { error: error instanceof Error ? error.message : String(error) });
          // Continue anyway - Design Agent can create it
        }
      } catch (error) {
        logWarning("[Studio] Failed to create ContentPackage for upload", { error: error instanceof Error ? error.message : String(error) });
      }
    }

    toast({
      title: "Image Added",
      description: "Click and drag to reposition or resize. Use 'Make on-brand' to enhance.",
    });
  };

const handleAddElement = (elementType: string, defaultProps: Record<string, unknown>, x: number, y: number) => {
  // Check if this is an image element - if so, open image selector instead of creating placeholder
  if (elementType === "image" || elementType === "logo") {
    // Create a placeholder image item first
    setState((prev) => {
      if (!prev.design) return prev;

      const defaultDimensions: Record<string, { width: number; height: number }> = {
        image: { width: 300, height: 300 },
        logo: { width: 120, height: 120 },
      };

      const dimensions = defaultDimensions[elementType] || { width: 300, height: 300 };

      const newItem: CanvasItem = {
        id: `${elementType}-${Date.now()}`,
        type: "image",
        x: Math.max(0, x - dimensions.width / 2),
        y: Math.max(0, y - dimensions.height / 2),
        width: dimensions.width,
        height: dimensions.height,
        rotation: 0,
        zIndex: prev.design.items.length,
        imageUrl: "placeholder", // Placeholder until user selects image
        imageName: "Select image...",
        ...defaultProps,
      };

      const updatedItems = [...prev.design.items, newItem];
      const updatedDesign: Design = {
        ...prev.design,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      // Store the item ID so we can update it when image is selected
      setPendingImageItemId(newItem.id);

      return {
        ...pushToHistory(prev, updatedDesign),
        selectedItemId: newItem.id,
      };
    });

    // Open image selector modal
    setShowImageSelector(true);
    return;
  }

  // For non-image elements, create them normally
  setState((prev) => {
    if (!prev.design) return prev;

    // Default dimensions based on element type
    const defaultDimensions: Record<string, { width: number; height: number }> = {
      text: { width: 200, height: 100 },
      shape: { width: 150, height: 150 },
      button: { width: 150, height: 50 },
      icon: { width: 100, height: 100 },
    };

    const dimensions = defaultDimensions[elementType] || { width: 150, height: 150 };

    const newItem: CanvasItem = {
      id: `${elementType}-${Date.now()}`,
      type: elementType === "text" ? "text" : elementType === "shape" ? "shape" : "text",
      x: Math.max(0, x - dimensions.width / 2),
      y: Math.max(0, y - dimensions.height / 2),
      width: dimensions.width,
      height: dimensions.height,
      rotation: 0,
      zIndex: prev.design.items.length,
      ...defaultProps,
    };

    const updatedItems = [...prev.design.items, newItem];
    const updatedDesign: Design = {
      ...prev.design,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    return {
      ...pushToHistory(prev, updatedDesign),
      selectedItemId: newItem.id,
    };
  });

  toast({
    title: "Element Added",
    description: "Click and drag to reposition, or use the toolbar to edit",
  });
};

  // Wrapper for ElementsDrawer which calls (elementType, x, y)
  const handleElementDrag = (elementType: string, x: number, y: number) => {
    handleAddElement(elementType, {}, x, y);
  };

  const handleZoomIn = () => {
    setState((prev) => ({
      ...prev,
      zoom: Math.min(200, prev.zoom + 10),
    }));
  };

  const handleZoomOut = () => {
    setState((prev) => ({
      ...prev,
      zoom: Math.max(50, prev.zoom - 10),
    }));
  };

  const handleUndo = () => {
    setState(undo);
  };

  const handleRedo = () => {
    setState(redo);
  };

  const handleSaveToLibrary = useCallback(async () => {
    if (!state.design) return;

    // Ensure design has a valid brandId - use current brand from context if missing
    const brandId = state.design.brandId || getValidBrandId();
    if (!brandId) {
      const brandIdForAction = requireBrandForAction("save design");
      if (!brandIdForAction) {
        return; // Error already shown if needed
      }
      // Update design with brandId
      setState((prev) => {
        if (!prev.design) return prev;
        return {
          ...prev,
          design: { ...prev.design, brandId: brandIdForAction },
        };
      });
      // Retry save after brandId is set
      setTimeout(() => handleSaveToLibrary(), 100);
      return;
    }

    setIsSaving(true);
    try {
      // If design has been saved before, update it; otherwise create new
      const isUpdate = state.design.id && !state.design.id.startsWith("design-") && !state.design.id.startsWith("text-") && !state.design.id.startsWith("shape-") && !state.design.id.startsWith("image-");
      
      const url = isUpdate ? `/api/studio/${state.design.id}` : "/api/studio/save";
      const method = isUpdate ? "PUT" : "POST";
      
      const requestBody: SaveDesignRequest | UpdateDesignRequest = {
        ...(isUpdate ? { id: state.design.id } : {}),
        name: state.design.name,
        format: state.design.format,
        width: state.design.width,
        height: state.design.height,
        brandId: brandId,
        campaignId: state.design.campaignId,
        items: state.design.items,
        backgroundColor: state.design.backgroundColor,
        savedToLibrary: true,
        libraryAssetId: state.design.libraryAssetId,
      };
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to save" }));
        throw new Error(error.message || "Failed to save design");
      }

      const data: SaveDesignResponse | UpdateDesignResponse = await response.json();
      const savedDesign = data.design;

      // Also save to localStorage for offline support
      const libraryAsset = {
        ...savedDesign,
        campaignIds: savedDesign.campaignId ? [savedDesign.campaignId] : [],
        uploadedAt: savedDesign.createdAt,
        uploadedBy: "current-user",
        tags: ["creative-studio"],
      };
      const existingAssets = safeGetJSON("libraryAssets", []) || [];
      existingAssets.push(libraryAsset);
      safeSetJSON("libraryAssets", existingAssets);

      setState((prev) => {
        if (!prev.design) return prev;
        // Convert unknown[] items to CanvasItem[] by preserving existing items structure
        const mergedDesign: Design = {
          ...prev.design,
          ...savedDesign,
          items: prev.design.items, // Keep existing items structure (CanvasItem[])
          savedToLibrary: true,
          libraryAssetId: savedDesign.libraryAssetId || savedDesign.id,
          lastSaveAction: "saveToLibrary",
        };
        return {
          ...prev,
          design: mergedDesign,
        };
      });

      setHasUnsavedChanges(false);
      const tags = [brand?.brandId, state.design.campaignId].filter(Boolean).join(", ");
      toast({
        title: "✅ Saved to Library",
        description: `${savedDesign.name || "Design"} · Added tags: ${tags || "creative-studio"}`,
      });

      logTelemetry("save_to_library", { designId: savedDesign.id, timestamp: new Date().toISOString() });
    } catch (error) {
      logError("Failed to save to library", error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "⚠️ Save Failed",
        description: error instanceof Error ? error.message : "Failed to save design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [state.design, getValidBrandId, requireBrandForAction, toast]);

  const handleSaveAsDraft = async () => {
    if (!state.design) return;

    // Ensure design has a valid brandId - use current brand from context if missing
    const brandId = state.design.brandId || getValidBrandId();
    if (!brandId) {
      const brandIdForAction = requireBrandForAction("save design");
      if (!brandIdForAction) {
        return; // Error already shown if needed
      }
      // Update design with brandId
      setState((prev) => {
        if (!prev.design) return prev;
        return {
          ...prev,
          design: { ...prev.design, brandId: brandIdForAction },
        };
      });
      // Retry save after brandId is set
      setTimeout(() => handleSaveToLibrary(), 100);
      return;
    }

    setIsSaving(true);
    try {
      // If design has been saved before, update it; otherwise create new
      const isUpdate = state.design.id && !state.design.id.startsWith("design-") && !state.design.id.startsWith("text-") && !state.design.id.startsWith("shape-") && !state.design.id.startsWith("image-");
      
      const url = isUpdate ? `/api/studio/${state.design.id}` : "/api/studio/save";
      const method = isUpdate ? "PUT" : "POST";
      
      const requestBody: SaveDesignRequest | UpdateDesignRequest = {
        ...(isUpdate ? { id: state.design.id } : {}),
        name: state.design.name,
        format: state.design.format,
        width: state.design.width,
        height: state.design.height,
        brandId: brandId,
        campaignId: state.design.campaignId,
        items: state.design.items,
        backgroundColor: state.design.backgroundColor,
        savedToLibrary: false,
      };
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to save" }));
        throw new Error(error.message || "Failed to save draft");
      }

      const data: SaveDesignResponse | UpdateDesignResponse = await response.json();
      const savedDesign = data.design;

      // Also save to localStorage for offline support
      const draft = {
        ...savedDesign,
        lastSaveAction: "saveAsDraft" as const,
      };
      const existingDrafts = safeGetJSON("creativeStudio_drafts", []) || [];
      existingDrafts.push(draft);
      safeSetJSON("creativeStudio_drafts", existingDrafts);

      setState((prev) => {
        if (!prev.design) return prev;
        // Convert unknown[] items to CanvasItem[] by preserving existing items structure
        const mergedDesign: Design = {
          ...prev.design,
          ...savedDesign,
          items: prev.design.items, // Keep existing items structure (CanvasItem[])
          lastSaveAction: "saveAsDraft",
        };
        return {
          ...prev,
          design: mergedDesign,
        };
      });

      setHasUnsavedChanges(false);
      toast({
        title: "📝 Saved as Draft",
        description: `${savedDesign.name || "Design"} · Ready for editing`,
      });

      logTelemetry("save_as_draft", { designId: savedDesign.id, timestamp: new Date().toISOString() });
    } catch (error) {
      logError("Failed to save draft", error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "⚠️ Save Failed",
        description: error instanceof Error ? error.message : "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCreateVariant = () => {
    if (!state.design) return;

    const variant = {
      ...state.design,
      id: `variant-${Date.now()}`,
      name: `${state.design.name} (Variant)`,
      lastSaveAction: "saveCreateVariant" as const,
    };

    setState((prev) => ({
      ...prev,
      design: variant,
      history: [variant],
      historyIndex: 0,
    }));

    toast({
      title: "✨ Variant Created",
      description: `${variant.name} · Based on ${state.design.name}`,
    });

    logTelemetry("save_create_variant", { originalId: state.design.id, variantId: variant.id });
  };

  const handleSendToQueue = useCallback(() => {
    if (!state.design) return;

    setState((prev) => ({
      ...prev,
      design: prev.design ? { ...prev.design, lastSaveAction: "sendToQueue" } : null,
    }));

    toast({
      title: "📤 Sent to Queue",
      description: `${state.design.name} · In review status · View in Content Queue`,
    });

    logTelemetry("send_to_queue", { designId: state.design.id });
  }, [state.design, setState, toast]);

  const handleSendPublishNow = () => {
    if (!state.design) return;

    // Check role permission
    if (user?.role !== "admin" && user?.role !== "manager") {
      toast({
        title: "Permission Denied",
        description: "Only admins and managers can publish",
      });
      return;
    }

    setShowPublishConfirm(true);
  };

  const handleConfirmPublish = () => {
    if (!state.design) return;

    setState((prev) => ({
      ...prev,
      design: prev.design ? { ...prev.design, lastSaveAction: "sendPublishNow" } : null,
    }));

    toast({
      title: "🚀 Published Now",
      description: `${state.design.name} · Live on all platforms · View in Content Queue`,
    });

    logTelemetry("send_publish_now", { designId: state.design.id });
    setShowPublishConfirm(false);
  };

  const handleSendMultiplePlatforms = () => {
    setShowPlatformSelector(true);
  };

  const handleConfirmMultiplePlatforms = (platforms: string[], createVariants: boolean) => {
    if (!state.design) return;

    setState((prev) => ({
      ...prev,
      design: prev.design
        ? {
            ...prev.design,
            scheduledPlatforms: platforms,
            lastSaveAction: "sendMultiplePlatforms",
          }
        : null,
    }));

    toast({
      title: "🌐 Sent to Platforms",
      description: `${state.design.name} → ${platforms.join(", ")}${createVariants ? " (optimized)" : ""}`,
    });

    logTelemetry("send_multiple_platforms", { designId: state.design.id, platforms, createVariants });
  };

  const handleOpenContentQueue = () => {
    // Navigate to content queue page
    window.location.href = "/content-queue";
  };

  const handleSchedule = () => {
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = async (date: string, time: string, autoPublish: boolean, platforms: string[]) => {
    if (!state.design) return;

    // Ensure design has a valid brandId - use current brand from context if missing
    let brandId = state.design.brandId || getValidBrandId();
    if (!brandId) {
      const brandIdForAction = requireBrandForAction("schedule design");
      if (!brandIdForAction) {
        return; // Error already shown if needed
      }
      brandId = brandIdForAction;
      // Update design with brandId
      setState((prev) => {
        if (!prev.design) return prev;
        return {
          ...prev,
          design: { ...prev.design, brandId: brandIdForAction },
        };
      });
    }

    setIsSaving(true);
    try {
      // Ensure design is saved first
      let designId = state.design.id;
      if (!designId || designId.startsWith("design-") || designId.startsWith("text-") || designId.startsWith("shape-") || designId.startsWith("image-")) {
        // Save design first
        const saveRequestBody: SaveDesignRequest = {
          name: state.design.name,
          format: state.design.format,
          width: state.design.width,
          height: state.design.height,
          brandId: brandId,
          campaignId: state.design.campaignId,
          items: state.design.items,
          backgroundColor: state.design.backgroundColor,
          savedToLibrary: false,
        };
        
        const saveResponse = await fetch("/api/studio/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveRequestBody),
        });

        if (!saveResponse.ok) {
          throw new Error("Failed to save design before scheduling");
        }

        const saveData: SaveDesignResponse = await saveResponse.json();
        designId = saveData.design.id;
      }

      // Schedule the design
      // scheduledDate should be ISO date string (YYYY-MM-DD), scheduledTime should be HH:mm
      const scheduleRequestBody: ScheduleDesignRequest = {
        scheduledDate: date, // YYYY-MM-DD format
        scheduledTime: time, // HH:mm format
        scheduledPlatforms: platforms,
        autoPublish,
      };
      
      const scheduleResponse = await fetch(`/api/studio/${designId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleRequestBody),
      });

      if (!scheduleResponse.ok) {
        const error = await scheduleResponse.json().catch(() => ({ message: "Failed to schedule" }));
        throw new Error(error.message || "Failed to schedule design");
      }

      const scheduleData: ScheduleDesignResponse = await scheduleResponse.json();

      setState((prev) => ({
        ...prev,
        design: prev.design
          ? {
              ...prev.design,
              id: designId,
              scheduledDate: date,
              scheduledTime: time,
              autoPublish,
              scheduledPlatforms: platforms,
              lastSaveAction: "schedule",
            }
          : null,
      }));

      toast({
        title: "⏰ Scheduled",
        description: `${state.design.name} · ${date} at ${time} → ${platforms.join(", ")}`,
      });

      logTelemetry("schedule", { designId, date, time, platforms });
      setShowScheduleModal(false);
    } catch (error) {
      logError("Failed to schedule design", error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "⚠️ Schedule Failed",
        description: error instanceof Error ? error.message : "Failed to schedule design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewCalendar = () => {
    // Navigate to calendar with date selected
    const date = state.design?.scheduledDate || new Date().toISOString().split("T")[0];
    window.location.href = `/calendar?date=${date}`;
  };

  const handleBestTimeSuggestions = () => {
    // Show best time suggestions in advisor panel
    setState((prev) => ({ ...prev, showAdvisor: true }));
    toast({
      title: "💡 Best Time Tips",
      description: "Check The Advisor panel on the right for timing recommendations",
    });
  };

  const handleRenameAsset = () => {
    setShowRenameAsset(true);
  };

  const handleConfirmRename = (newName: string) => {
    if (!state.design) return;

    setState((prev) => ({
      ...prev,
      design: prev.design ? { ...prev.design, name: newName } : null,
    }));

    toast({
      title: "✏️ Renamed",
      description: `"${state.design.name}" �� "${newName}"`,
    });

    logTelemetry("rename_asset", { designId: state.design.id, newName });
  };

  const handleDownload = () => {
    if (!state.design) return;

    // Mock download functionality
    toast({
      title: "⬇️ Download Started",
      description: `Preparing ${state.design.name}.png for download...`,
    });

    setState((prev) => ({
      ...prev,
      design: prev.design ? { ...prev.design, lastSaveAction: "download" } : null,
    }));

    logTelemetry("download", { designId: state.design.id });
  };

  const handleRotateItem = useCallback((angle: number = 45) => {
    if (!state.design || !state.selectedItemId) return;

    const item = state.design.items.find((i) => i.id === state.selectedItemId);
    if (!item) return;

    const newRotation = ((item.rotation || 0) + angle) % 360;
    handleUpdateItem(state.selectedItemId, { rotation: newRotation });

    toast({
      title: "🔄 Rotated",
      description: `${item.type} rotated to ${newRotation}°`,
    });

    logTelemetry("rotate_item", { itemId: state.selectedItemId, rotation: newRotation });
  }, [state.design, state.selectedItemId, handleUpdateItem, toast]);

  const handleDeleteItem = useCallback(() => {
    if (!state.design || !state.selectedItemId) return;

    const item = state.design.items.find((i) => i.id === state.selectedItemId);
    if (!item) return;

    const itemId = state.selectedItemId;
    const itemType = item.type;

    const updatedItems = state.design.items.filter((i) => i.id !== itemId);
    const updatedDesign: Design = {
      ...state.design,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...pushToHistory(prev, updatedDesign),
      selectedItemId: null,
    }));

    toast({
      title: "����️ Deleted",
      description: `${itemType} element removed`,
    });

    logTelemetry("delete_item", { itemId, itemType });
  }, [state.design, state.selectedItemId, setState, toast]);

  const handleEnterCropMode = (itemId: string) => {
    const item = state.design?.items.find((i) => i.id === itemId);
    if (!item || item.type !== "image") {
      toast({
        title: "Invalid Selection",
        description: "Crop tool is only available for images",
        variant: "destructive",
      });
      return;
    }

    setCroppingItemId(itemId);
    toast({
      title: "✂️ Crop Mode",
      description: "Adjust the crop area, then confirm or cancel",
    });
  };

  const handleExitCropMode = () => {
    setCroppingItemId(null);
    setCropAspectRatio("free");
  };

  const handleConfirmCrop = (itemId: string, crop: { x: number; y: number; width: number; height: number; aspectRatio?: "1:1" | "9:16" | "16:9" | "free" }) => {
    if (!state.design) return;

    handleUpdateItem(itemId, { crop });
    setCroppingItemId(null);
    setCropAspectRatio("free");

    toast({
      title: "✅ Crop Applied",
      description: "Image crop has been applied",
    });

    logTelemetry("crop_applied", { itemId, aspectRatio: crop.aspectRatio });
  };

  const handleChangeBackground = (backgroundColor: string) => {
    if (!state.design) return;

    const updatedDesign: Design = {
      ...state.design,
      backgroundColor,
      updatedAt: new Date().toISOString(),
    };

    setState((prev) => pushToHistory(prev, updatedDesign));
    setShowBackgroundModal(false);

    toast({
      title: "🎨 Background Changed",
      description: "Canvas background updated",
    });

    logTelemetry("change_background", { backgroundColor });
  };

  const handleOpenTemplateLibrary = () => {
    setShowTemplateModal(true);
  };

  const handleOpenMedia = () => {
    setShowImageSelector(true);
  };

  /**
   * Make template/upload on-brand using Design Agent
   */
  const handleMakeOnBrand = async () => {
    // ✅ UX: Guard against invalid states
    if (!state.design) {
      toast({
        title: "No Design Selected",
        description: "Please select a template or create a design first",
        variant: "destructive",
      });
      return;
    }

    const brandId = getValidBrandId();
    if (!brandId) {
      toast({
        title: "Brand Required",
        description: "Please select a brand to use this feature",
        variant: "destructive",
      });
      return;
    }

    // ✅ UX: Check if Brand Guide exists
    if (!hasBrandGuide) {
      toast({
        title: "Brand Guide Required",
        description: "Please create a Brand Guide in Settings to unlock AI content generation",
        variant: "destructive",
      });
      return;
    }

    setIsMakingOnBrand(true);

    try {
      // Extract content metadata
      const textItems = state.design.items.filter((item) => item.type === "text") as Array<
        CanvasItem & { text?: string }
      >;
      const imageItems = state.design.items.filter((item) => item.type === "image") as Array<
        CanvasItem & { imageUrl?: string; imageName?: string }
      >;
      
      const headline = textItems.find((item) => item.fontSize && item.fontSize >= 40)?.text || "";
      const body = textItems.find((item) => item.fontSize && item.fontSize < 40)?.text || "";
      const uploadedImages = imageItems
        .filter((item) => item.imageUrl && item.imageUrl !== "placeholder")
        .map((item) => ({ url: item.imageUrl!, name: item.imageName || "Uploaded image" }));

      // Map design format to agent format (must match enum: 'story' | 'feed' | 'reel' | 'short' | 'ad' | 'other')
      const formatMap: Record<string, "story" | "feed" | "reel" | "short" | "ad" | "other"> = {
        social_square: "feed",
        story_portrait: "story",
        blog_featured: "other", // Not in enum, use "other"
        email_header: "other", // Not in enum, use "other"
        custom: "feed",
      };
      const agentFormat = formatMap[state.design.format] || "feed";

      // Determine context based on start mode
      const isTemplate = state.startMode === "template";
      const isUpload = state.startMode === "upload" || uploadedImages.length > 0;
      
      let additionalContext = "";
      if (isTemplate) {
        additionalContext = `Modify this template to align with brand guidelines while preserving the template structure. Template ID: ${state.design.id}. Current headline: "${headline}". Current body: "${body}". Maintain the layout and structure but ensure all colors, fonts, and imagery comply with the Brand Guide.`;
      } else if (isUpload) {
        additionalContext = `Modify this uploaded content to align with brand guidelines. Uploaded image(s): ${uploadedImages.map(img => img.name).join(", ")}. Current headline: "${headline}". Current body: "${body}". Ensure all colors, fonts, and imagery comply with the Brand Guide photography style rules (mustInclude/mustAvoid).`;
      } else {
        additionalContext = `Modify this design to align with brand guidelines. Ensure all colors, fonts, and imagery comply with the Brand Guide.`;
      }

      // ✅ UX: Create ContentPackage on-the-fly if missing
      let finalContentPackageId = contentPackageId;
      if (!finalContentPackageId && brandId) {
        try {
          const contentPackage = isTemplate
            ? createContentPackageFromTemplate(state.design, brandId, state.design.id)
            : isUpload && uploadedImages.length > 0
            ? createContentPackageFromUpload(uploadedImages[0].url, uploadedImages[0].name, brandId, state.design.format)
            : null;

          if (contentPackage) {
            const saveResponse = await fetch("/api/content-packages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                brandId,
                contentPackage,
              }),
            });

            if (saveResponse.ok) {
              const saveResult = await saveResponse.json();
              if (saveResult.success && saveResult.contentPackageId) {
                finalContentPackageId = saveResult.contentPackageId;
                setContentPackageId(finalContentPackageId);
              }
            }
          }
        } catch (packageError) {
          logWarning("[Studio] Failed to create ContentPackage", { error: packageError instanceof Error ? packageError.message : String(packageError) });
          // Continue without ContentPackage - Design Agent can work without it
        }
      }

      // Call Design Agent with content context
      const response = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId, // Required
          platform: "instagram", // Required
          format: agentFormat, // Required, must be enum value
          contentPackageId: finalContentPackageId || undefined, // Optional
          visualStyle: "brand-compliant",
          additionalContext: additionalContext.substring(0, 1000), // Max 1000 chars
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
        
        // ✅ UX: Handle specific error cases
        const errorMessage = errorData.error?.message || errorData.message || "Failed to make content on-brand";
        
        if (errorMessage.includes("Brand Guide") || errorData.error?.code === "NO_BRAND_GUIDE") {
          toast({
            title: "Brand Guide Required",
            description: "Please create a Brand Guide in Settings to unlock AI content generation",
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.variants && result.variants.length > 0) {
        // ✅ PHASE 4: Store variants and show selector instead of auto-selecting
        setPendingVariants(result.variants);
        setIsVariantSelectorOpen(true);
        
        // Update ContentPackage ID if returned
        if (result.contentPackageId) {
          setContentPackageId(result.contentPackageId);
        }

        toast({
          title: "✨ Content Enhanced",
          description: `Generated ${result.variants.length} brand-compliant variants. Select one to apply.`,
        });

        logTelemetry("studio_make_on_brand", {
          designId: state.design.id,
          startMode: state.startMode,
          variantCount: result.variants.length,
          avgBFS: result.metadata?.averageBrandFidelityScore || 0,
          brandId,
        });
      } else {
        throw new Error("No variants generated");
      }
    } catch (error) {
      logError("Make on-brand failed", error instanceof Error ? error : new Error(String(error)), { designId: state.design?.id });
      
      // ✅ UX: User-friendly error messages
      const errorMessage = error instanceof Error ? error.message : "Failed to make content on-brand";
      
      // Check for network errors
      if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
        toast({
          title: "Network Error",
          description: "Please check your internet connection and try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Enhancement Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsMakingOnBrand(false);
    }
  };

  // ✅ PHASE 4: Handle variant selection
  const handleSelectVariant = async (variant: AiDesignVariant) => {
    if (!state.design || !getValidBrandId()) {
      toast({
        title: "Error",
        description: "Design or brand not available",
        variant: "destructive",
      });
      return;
    }

    const brandId = getValidBrandId();
    if (!brandId) return;

    // Close selector
    setIsVariantSelectorOpen(false);
    setPendingVariants(null);

    try {
      // ✅ PHASE 4: Update ContentPackage with variant selection (minimal, safe update)
      if (contentPackageId) {
        try {
          // Get current ContentPackage
          const getResponse = await fetch(`/api/content-packages/${contentPackageId}?brandId=${brandId}`);
          if (getResponse.ok) {
            const getResult = await getResponse.json();
            if (getResult.success && getResult.contentPackage) {
              const contentPackage = getResult.contentPackage;
              
              // Add collaboration log entry for variant selection
              const updatedLog = [
                ...contentPackage.collaborationLog,
                {
                  agent: "creative" as const,
                  action: "variant_selected",
                  timestamp: new Date().toISOString(),
                  notes: `Selected variant "${variant.label}" (ID: ${variant.id}) with BFS: ${variant.brandFidelityScore.toFixed(2)}`,
                },
              ];

              // ✅ PHASE 4: Mark variant as selected in visuals[]
              const contentPackageWithVariant = {
                ...contentPackage,
                collaborationLog: updatedLog,
                updatedAt: new Date().toISOString(),
              };

              // Update ContentPackage (backend will handle variant selection in visuals[])
              const updateResponse = await fetch("/api/content-packages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  brandId,
                  contentPackage: contentPackageWithVariant,
                  selectedVariant: variant, // ✅ PHASE 4: Pass variant to backend for visuals[] update
                }),
              });

              if (updateResponse.ok) {
                console.log("[Studio] ContentPackage updated with variant selection");
              }
            }
          }
        } catch (packageError) {
          console.warn("[Studio] Failed to update ContentPackage with variant selection:", packageError);
          // Continue anyway - variant selection still works without ContentPackage update
        }
      }

      // ✅ PHASE 4: Apply variant to canvas
      applyVariantToCanvas(variant);

      logTelemetry("studio_variant_selected", {
        designId: state.design.id,
        variantId: variant.id,
        variantLabel: variant.label,
        brandFidelityScore: variant.brandFidelityScore,
        brandId,
      });

    } catch (error) {
      console.error("[Studio] Failed to select variant:", error);
      toast({
        title: "Selection Failed",
        description: "Failed to apply selected variant",
        variant: "destructive",
      });
    }
  };

  const handleCloseVariantSelector = () => {
    setIsVariantSelectorOpen(false);
    setPendingVariants(null);
  };

  // ✅ PHASE 4: Apply variant to existing canvas (minimal, safe update)
  const applyVariantToCanvas = (variant: AiDesignVariant) => {
    if (!state.design || !brand) {
      console.warn("[Studio] Cannot apply variant: design or brand not available");
      return;
    }

    // Use pushToHistory pattern for undo/redo support
    setState((prev) => {
      if (!prev.design) return prev;

      // Get brand colors and fonts
      const primaryColor = brand.primaryColor || "#39339a";
      const secondaryColor = brand.secondaryColor || "#632bf0";
      const brandFont = brand.fontFamily || "Arial";

      // Update existing items to match brand guide (preserve structure, update styling)
      const updatedItems = prev.design.items.map((item) => {
        const updates: Partial<CanvasItem> = {};

        // Apply brand colors to text items
        if (item.type === "text") {
          // Update font to match brand
          if (brandFont) {
            updates.fontFamily = brandFont;
          }
          // Update text color to primary brand color (if not already customized)
          if (!item.fontColor || item.fontColor === "#000000" || item.fontColor === "#333333") {
            updates.fontColor = primaryColor;
          }
        }

        // Apply brand colors to shapes
        if (item.type === "shape" && item.fill) {
          // Update shape fill to secondary brand color (if using default colors)
          const isDefaultColor = item.fill === "#3B82F6" || item.fill === "#000000" || !item.fill;
          if (isDefaultColor) {
            updates.fill = secondaryColor;
          }
        }

        // Apply brand colors to background items
        if (item.type === "background") {
          if (item.backgroundType === "gradient") {
            updates.gradientFrom = primaryColor;
            updates.gradientTo = secondaryColor;
          } else if (item.backgroundColor) {
            // Update solid background to primary color if it's white/default
            if (item.backgroundColor === "#FFFFFF" || item.backgroundColor === "#ffffff") {
              updates.backgroundColor = primaryColor;
            }
          }
        }

        // Return updated item if there are changes, otherwise return original
        return Object.keys(updates).length > 0 ? { ...item, ...updates } : item;
      });

      // Optionally update design background color to match brand
      const updatedBackgroundColor = 
        prev.design.backgroundColor === "#FFFFFF" || prev.design.backgroundColor === "#ffffff"
          ? primaryColor
          : prev.design.backgroundColor;

      const updatedDesign: Design = {
        ...prev.design,
        items: updatedItems,
        backgroundColor: updatedBackgroundColor,
        updatedAt: new Date().toISOString(),
      };

      // Use pushToHistory for undo/redo support
      return pushToHistory(prev, updatedDesign);
    });

    // Show success toast
    toast({
      title: "✅ Variant Applied",
      description: `"${variant.label}" styling applied to canvas. All changes are undoable.`,
    });
  };

  const handleSelectTemplate = async (template: StarterTemplate | Design) => {
    // Convert StarterTemplate to Design if needed
    let design: Design;
    const templateId = 'id' in template ? template.id : (template as Design).id;
    
    if ('design' in template && template.design) {
      // It's a StarterTemplate - convert to full Design with brand adaptation
      const templateDesign = template.design;
      const format = templateDesign.format || "social_square";
      const preset = FORMAT_PRESETS[format];
      
      // Get brandId from context - brands are created during registration
      const brandId = requireBrandForAction("use template");
      if (!brandId) {
        return; // Error already shown if needed
      }

      // Use brand adaptation from template library
      design = createTemplateDesign(template as StarterTemplate, brandId, brand);
    } else {
      // It's already a Design
      design = template as Design;
    }
    
    // ✅ PHASE 2: Create ContentPackage for agent collaboration
    const brandId = getValidBrandId();
    if (brandId) {
      try {
        const contentPackage = createContentPackageFromTemplate(design, brandId, templateId);
        
        // Save ContentPackage via API (create endpoint if needed, or store locally for now)
        // For now, we'll store the ID and pass it to Design Agent when "Make on-brand" is clicked
        setContentPackageId(contentPackage.id);
        
        // Save to server via API call
        const response = await fetch("/api/content-packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentPackage,
            brandId,
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          setContentPackageId(result.contentPackageId || contentPackage.id);
        } else {
          // If endpoint doesn't exist yet, store locally (will be created when Design Agent is called)
          // ContentPackage will be created by Design Agent
        }
      } catch (error) {
        logWarning("[Studio] Failed to create ContentPackage", { error: error instanceof Error ? error.message : String(error) });
        // Continue anyway - Design Agent can create it
      }
    }
    
    const fitZoom = calculateFitToScreenZoom(design.width, design.height);
    setState((prev) => ({
      ...prev,
      design,
      startMode: "template",
      selectedItemId: null,
      zoom: fitZoom,
      history: [design],
      historyIndex: 0,
    }));
    
    // Close template modal
    setShowTemplateModal(false);
    
    // Telemetry
    const brandIdForTelemetry = getValidBrandId();
    logTelemetry("studio_template_selected", {
      templateId,
      format: design.format,
      brandId: brandIdForTelemetry,
      timestamp: new Date().toISOString(),
    });
  };

  // Handle AI-generated content
  const handleUseDocVariant = (variant: AiDocVariant) => {
    // Use the template format if available, otherwise default to social_square
    const format: DesignFormat = aiTemplateFormat || "social_square";
    
    // Get brandId from context - brands are created during registration
    const brandId = requireBrandForAction("use AI content");
    if (!brandId) {
      return; // Error already shown if needed
    }
    
    logTelemetry("[Studio] handleUseDocVariant called", { format, hasDesign: !!state.design });
    
    // Single state update that handles both creating design and adding content
    setState((prev) => {
      // Create design if it doesn't exist
      let currentDesign = prev.design;
      let newZoom = prev.zoom;
      if (!currentDesign) {
        currentDesign = createInitialDesign(format, brandId, "");
        newZoom = calculateFitToScreenZoom(currentDesign.width, currentDesign.height);
      }

      // Find existing text item or create new one
      const existingTextItem = currentDesign.items.find(item => item.type === "text");
      let updatedItems: CanvasItem[];

      if (existingTextItem) {
        // Update existing text item
        updatedItems = currentDesign.items.map(item =>
          item.id === existingTextItem.id
            ? { ...item, text: variant.content }
            : item
        );
      } else {
        // Create new text item
        const newTextItem: CanvasItem = {
          id: `text-${Date.now()}`,
          type: "text",
          x: currentDesign.width * 0.1,
          y: currentDesign.height * 0.3,
          width: currentDesign.width * 0.8,
          height: currentDesign.height * 0.4,
          rotation: 0,
          zIndex: 2,
          text: variant.content,
          fontSize: 32,
          fontFamily: "Arial",
          fontColor: "#000000",
          fontWeight: "normal",
          textAlign: "center",
        };
        updatedItems = [...currentDesign.items, newTextItem];
      }

      const updatedDesign: Design = {
        ...currentDesign,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      };

      // Return updated state with design
      // If design already exists, use pushToHistory; otherwise initialize new history
      if (prev.design) {
        return pushToHistory(prev, updatedDesign);
      } else {
        logTelemetry("[Studio] Creating new design", { designId: updatedDesign.id, format: updatedDesign.format });
        return {
          ...prev,
          design: updatedDesign,
          zoom: newZoom,
          startMode: "ai",
          selectedItemId: updatedItems.find(item => item.type === "text")?.id || null,
          history: [updatedDesign],
          historyIndex: 0,
        };
      }
    });

      // Telemetry: Variant used
      const brandIdForTelemetry = getValidBrandId();
      logTelemetry("studio_variant_used", {
        variantType: "doc",
        variantLabel: variant.label,
        format,
        brandId: brandIdForTelemetry,
        timestamp: new Date().toISOString(),
      });

    toast({
      title: "✨ Content Added",
      description: `${variant.label} has been added to your design.`,
    });

    // Close the modal after state update
    setShowAiModal(false);
  };

  const handleUseDesignVariant = (variant: AiDesignVariant) => {
      // Create a new design with visual elements based on the AI concept
      const format: DesignFormat = aiTemplateFormat || "social_square";
      const preset = FORMAT_PRESETS[format];
      
      // Get brandId from context - brands are created during registration
      const brandId = requireBrandForAction("use AI design");
      if (!brandId) {
        return; // Error already shown if needed
      }

      const newDesign = createInitialDesign(format, brandId, "");
      const fitZoom = calculateFitToScreenZoom(newDesign.width, newDesign.height);
    
    // Create a visual design based on the variant
    // Use brand colors if available, otherwise use defaults
    const primaryColor = brand?.primaryColor || "#39339a";
    const secondaryColor = brand?.secondaryColor || "#632bf0";
    const bgColor = "#FFFFFF"; // Default white background
    
    // Create a gradient background for visual interest
    const backgroundItem: CanvasItem = {
      id: "bg-1",
      type: "background",
      x: 0,
      y: 0,
      width: preset.width,
      height: preset.height,
      rotation: 0,
      zIndex: 0,
      backgroundType: "gradient",
      gradientFrom: primaryColor,
      gradientTo: secondaryColor,
      gradientAngle: 135,
      backgroundColor: bgColor,
    };
    
    // Create a title text item with the variant label
    const titleItem: CanvasItem = {
      id: `title-${Date.now()}`,
      type: "text",
      x: preset.width * 0.1,
      y: preset.height * 0.2,
      width: preset.width * 0.8,
      height: preset.height * 0.15,
      rotation: 0,
      zIndex: 2,
      text: variant.label,
      fontSize: Math.min(48, preset.width / 20),
      fontFamily: brand?.fontFamily || "Arial",
      fontColor: "#FFFFFF",
      fontWeight: "900",
      textAlign: "center",
    };
    
    // Create a description text item if available
    const descriptionItem: CanvasItem | null = variant.description ? {
      id: `desc-${Date.now()}`,
      type: "text",
      x: preset.width * 0.1,
      y: preset.height * 0.4,
      width: preset.width * 0.8,
      height: preset.height * 0.3,
      rotation: 0,
      zIndex: 2,
      text: variant.description,
      fontSize: Math.min(24, preset.width / 40),
      fontFamily: brand?.fontFamily || "Arial",
      fontColor: "#FFFFFF",
      fontWeight: "normal",
      textAlign: "center",
    } : null;
    
    // Create a decorative shape for visual interest
    const shapeItem: CanvasItem = {
      id: `shape-${Date.now()}`,
      type: "shape",
      x: preset.width * 0.1,
      y: preset.height * 0.7,
      width: preset.width * 0.8,
      height: 8,
      rotation: 0,
      zIndex: 1,
      shapeType: "rectangle",
      fill: "#FFFFFF",
      stroke: "none",
    };

    const designWithVisuals: Design = {
      ...newDesign,
      name: variant.label,
      items: [
        backgroundItem,
        shapeItem,
        titleItem,
        ...(descriptionItem ? [descriptionItem] : []),
      ],
      backgroundColor: bgColor,
    };

    setState((prev) => {
      // If design already exists, update it; otherwise create new
      if (prev.design) {
        return pushToHistory(prev, designWithVisuals);
      } else {
        const fitZoom = calculateFitToScreenZoom(designWithVisuals.width, designWithVisuals.height);
        return {
          ...prev,
          design: designWithVisuals,
          startMode: "ai",
          selectedItemId: titleItem.id,
          zoom: fitZoom,
          history: [designWithVisuals],
          historyIndex: 0,
        };
      }
    });

      // Telemetry: Variant used
      const brandIdForTelemetry = getValidBrandId();
      logTelemetry("studio_variant_used", {
        variantType: "design",
        variantLabel: variant.label,
        format,
        brandId: brandIdForTelemetry,
        timestamp: new Date().toISOString(),
      });

    toast({
      title: "✨ Visual Concept Created",
      description: `${variant.label} has been added to your canvas. Customize it further!`,
    });

    // Close the modal after state update
    setShowAiModal(false);
  };

  // Load recent designs and drafts
  const [recentDesigns, setRecentDesigns] = useState<Array<{
    id: string;
    name: string;
    thumbnail?: string;
    updatedAt: string;
  }>>([]);
  const [drafts, setDrafts] = useState<Array<{
    id: string;
    name: string;
    thumbnail?: string;
    updatedAt: string;
  }>>([]);

  useEffect(() => {
    // Load recent designs from localStorage
    const savedDesigns = safeGetJSON("creativeStudio_designs", []) || [];
    const savedDrafts = safeGetJSON("creativeStudio_drafts", []) || [];
    
    setRecentDesigns(
      savedDesigns
        .map((d: Design) => ({
          id: d.id,
          name: d.name,
          updatedAt: d.updatedAt || d.createdAt,
        }))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 8)
    );
    
    setDrafts(
      savedDrafts
        .map((d: Design) => ({
          id: d.id,
          name: d.name,
          updatedAt: d.updatedAt || d.createdAt,
        }))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4)
    );
  }, []);

  // Get selected item for contextual toolbar/properties
  const selectedItem = state.design && state.selectedItemId
    ? state.design.items.find((item) => item.id === state.selectedItemId) || null
    : null;

  // Handle apply brand style
  const handleApplyBrandStyle = () => {
    if (!selectedItem || !brand) return;
    
    const updates: Partial<CanvasItem> = {};
    if (selectedItem.type === "text") {
      updates.fontFamily = brand.fontFamily || "Arial";
      updates.fontColor = brand.primaryColor || "#000000";
    }
    handleUpdateItem(state.selectedItemId!, updates);
    
    toast({
      title: "✨ Brand Style Applied",
      description: "Applied brand font and color",
    });
  };

  // Handle AI rewrite
  const handleAiRewrite = () => {
    if (!selectedItem || selectedItem.type !== "text") return;
    setShowAiModal(true);
  };

  // Render entry screen or canvas editor
  const renderMainContent = () => {
    // Show simplified entry screen if no design is active
    if (!state.design) {
      return (
        <StudioEntryScreen
          hasBrand={!!currentBrand || !!currentWorkspace}
          hasBrandKit={hasBrandGuide}
          isBrandKitLoading={isBrandKitLoading}
          onOpenTemplateLibrary={handleOpenTemplateLibrary}
          onEditExisting={(designId) => {
            // Load design from storage
            const allDesigns = safeGetJSON("creativeStudio_designs", []) || [];
            const allDrafts = safeGetJSON("creativeStudio_drafts", []) || [];
            const found = [...allDesigns, ...allDrafts].find((d: Design) => d.id === designId);
            if (found) {
              const fitZoom = calculateFitToScreenZoom(found.width, found.height);
              setState((prev) => ({
                ...prev,
                design: found,
                startMode: "template",
                selectedItemId: null,
                zoom: fitZoom,
                history: [found],
                historyIndex: 0,
              }));
            }
          }}
          onUploadToEdit={() => {
            // Open image selector for upload - will create design when image is selected
            setShowImageSelector(true);
          }}
          onImportFromCanva={() => {
            setShowCanvaModal(true);
          }}
          onStartNew={(format) => {
            // Telemetry: Blank canvas clicked
            logTelemetry("studio_blank_canvas_clicked", {
              brandId: currentBrand?.id || null,
              format: format || "social_square",
              timestamp: new Date().toISOString(),
            });
            
            // If format is provided, create design directly
            // Otherwise show template grid to select format
            if (format) {
              // For blank canvas, don't require persisted brand (allow workspace default)
              const brandId = requireBrandForAction("create blank canvas", false);
              if (!brandId && !brandsLoading) {
                // Use workspace default if no brands exist
                const fallbackBrandId = currentWorkspace?.id ? `workspace-${currentWorkspace.id}` : "workspace-default";
                const newDesign = createInitialDesign(format, fallbackBrandId, "");
                const fitZoom = calculateFitToScreenZoom(newDesign.width, newDesign.height);
                setState((prev) => ({
                  ...prev,
                  design: newDesign,
                  startMode: "scratch",
                  selectedItemId: null,
                  zoom: fitZoom,
                  history: [newDesign],
                  historyIndex: 0,
                }));
                return;
              }
              if (!brandId) {
                return; // Still loading
              }

              const newDesign = createInitialDesign(format, brandId, "");
              const fitZoom = calculateFitToScreenZoom(newDesign.width, newDesign.height);
              setState((prev) => ({
                ...prev,
                design: newDesign,
                startMode: "scratch",
                selectedItemId: null,
                zoom: fitZoom,
                history: [newDesign],
                historyIndex: 0,
              }));
            } else {
              // Show template grid for format selection
              setShowTemplateModal(true);
            }
          }}
          onStartFromAI={(templateType) => {
            // Telemetry: AI clicked
            logTelemetry("studio_start_ai_clicked", {
              templateType: templateType || null,
              brandId: currentBrand?.id || null,
              hasBrandKit: !!brand,
              timestamp: new Date().toISOString(),
            });

            // Map quick template type → format (for canvas size)
            const map: Record<string, DesignFormat> = {
              "social-post": "social_square",
              "reel-tiktok": "story_portrait",
              story: "story_portrait",
              "blog-graphic": "blog_featured",
              "email-header": "email_header",
              flyer: "custom",
            };

            if (templateType && map[templateType]) {
              setAiTemplateFormat(map[templateType]);
              // Telemetry: Template selected
              logTelemetry("studio_template_selected", {
                templateId: templateType,
                format: map[templateType],
                brandId: currentBrand?.id || null,
                timestamp: new Date().toISOString(),
              });
            } else {
              setAiTemplateFormat(null);
            }

            setShowAiModal(true);
          }}
          recentDesigns={recentDesigns}
          drafts={drafts}
        />
      );
    }

    // Show canvas editor
    return (
      <FirstVisitTooltip page="studio">
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
          {/* Simplified Header */}
          <StudioHeader
            designName={state.design.name}
            onDesignNameChange={(name) => handleUpdateDesign({ name })}
            onBack={handleCancel}
            isSaving={isSaving}
            lastSaved={lastSaved}
            hasUnsavedChanges={hasUnsavedChanges}
            onSave={handleSaveToLibrary}
            onPublish={handleSendToQueue}
            onSchedule={handleSchedule}
            onSaveAsDraft={handleSaveAsDraft}
            onDownload={handleDownload}
            onSaveToLibrary={handleSaveToLibrary}
            onDesignInCanva={() => setShowCanvaModal(true)}
            onMakeOnBrand={handleMakeOnBrand}
            isMakingOnBrand={isMakingOnBrand}
            showMakeOnBrand={(state.startMode === "template" || state.startMode === "upload") && !!state.design && hasBrandGuide}
            userRole={user?.role}
          />

          {/* Main Editor Area - Canvas is Hero */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left Toolbar - Minimal, Collapsible */}
            <ElementSidebar
              onCategoryClick={(categoryId) => {
                setActiveDrawerSection(categoryId as "elements" | "templates" | "background" | "media");
                setShowElementsDrawer(true);
              }}
              activeCategory={showElementsDrawer ? activeDrawerSection : undefined}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={state.historyIndex > 0}
              canRedo={state.historyIndex < state.history.length - 1}
            />

            {/* Canvas - Hero, Centered */}
            <div className="flex-1 relative overflow-auto bg-slate-50">
              <CreativeStudioCanvas
                design={state.design}
                selectedItemId={state.selectedItemId}
                zoom={state.zoom}
                onSelectItem={handleSelectItem}
                onUpdateItem={handleUpdateItem}
                onUpdateDesign={handleUpdateDesign}
                onAddElement={handleAddElement}
                onRotateItem={handleRotateItem}
                onDeleteItem={handleDeleteItem}
                onEnterCropMode={handleEnterCropMode}
                onExitCropMode={handleExitCropMode}
                onConfirmCrop={handleConfirmCrop}
                croppingItemId={croppingItemId}
                cropAspectRatio={cropAspectRatio}
              />

              {/* Floating Toolbar - Contextual */}
              {selectedItem && state.selectedItemId && (
                <ContextualFloatingToolbar
                  item={selectedItem}
                  position={{
                    x: selectedItem.x + selectedItem.width / 2,
                    y: selectedItem.y,
                  }}
                  brandColors={[
                    brand?.primaryColor,
                    brand?.secondaryColor,
                    ...(brand?.colorPalette || []),
                  ].filter(Boolean) as string[]}
                  brandFont={brand?.fontFamily}
                  onDelete={handleDeleteItem}
                  onDuplicate={() => {
                    // Duplicate item
                    const newItem: CanvasItem = {
                      ...selectedItem,
                      id: `${selectedItem.type}-${Date.now()}`,
                      x: selectedItem.x + 20,
                      y: selectedItem.y + 20,
                    };
                    setState((prev) => {
                      if (!prev.design) return prev;
                      const updatedItems = [...prev.design.items, newItem];
                      const updatedDesign: Design = {
                        ...prev.design,
                        items: updatedItems,
                        updatedAt: new Date().toISOString(),
                      };
                      return pushToHistory(prev, updatedDesign);
                    });
                  }}
                  onAlign={(alignment) => {
                    if (selectedItem.type === "text") {
                      handleUpdateItem(state.selectedItemId!, { textAlign: alignment });
                    }
                  }}
                  onRotate={() => handleRotateItem(45)}
                  onFontChange={(font) => {
                    if (selectedItem.type === "text") {
                      handleUpdateItem(state.selectedItemId!, { fontFamily: font });
                    }
                  }}
                  onSizeChange={(size) => {
                    if (selectedItem.type === "text") {
                      handleUpdateItem(state.selectedItemId!, { fontSize: size });
                    }
                  }}
                  onWeightChange={(weight) => {
                    if (selectedItem.type === "text") {
                      handleUpdateItem(state.selectedItemId!, { fontWeight: weight });
                    }
                  }}
                  onColorChange={(color) => {
                    if (selectedItem.type === "text") {
                      handleUpdateItem(state.selectedItemId!, { fontColor: color });
                    }
                  }}
                  onAiRewrite={handleAiRewrite}
                  onApplyBrandStyle={handleApplyBrandStyle}
                  onCrop={() => {
                    if (state.selectedItemId) {
                      handleEnterCropMode(state.selectedItemId);
                    }
                  }}
                  onReplace={() => {
                    // Set the current item as pending so we update it instead of creating new
                    if (state.selectedItemId) {
                      setPendingImageItemId(state.selectedItemId);
                      setShowImageSelector(true);
                    }
                  }}
                  onFilters={() => {
                    // TODO: Implement filters
                    toast({ title: "Filters", description: "Filters coming soon" });
                  }}
                  onSwapImage={() => {
                    // Set the current item as pending so we update it instead of creating new
                    if (state.selectedItemId) {
                      setPendingImageItemId(state.selectedItemId);
                      setShowImageSelector(true);
                    }
                  }}
                />
              )}
            </div>

            {/* Right Properties Panel - Contextual, Only When Selected */}
            {selectedItem ? (
              <ContextualPropertiesPanel
                item={selectedItem}
                design={state.design}
                brand={brand}
                onClose={() => handleSelectItem(null)}
                onUpdateItem={(updates) => handleUpdateItem(state.selectedItemId!, updates)}
                onUpdateDesign={handleUpdateDesign}
                onReplaceImage={() => {
                  // Set the current item as pending so we update it instead of creating new
                  if (state.selectedItemId) {
                    setPendingImageItemId(state.selectedItemId);
                    setShowImageSelector(true);
                  }
                }}
                onApplyBrandStyle={handleApplyBrandStyle}
                onEnterCropMode={() => {
                  if (state.selectedItemId) {
                    handleEnterCropMode(state.selectedItemId);
                  }
                }}
                croppingItemId={croppingItemId}
                cropAspectRatio={cropAspectRatio}
                onCropAspectRatioChange={setCropAspectRatio}
                onConfirmCrop={handleConfirmCrop}
                onExitCropMode={handleExitCropMode}
              />
            ) : (
              <ContextualPropertiesPanel
                item={null}
                design={state.design}
                brand={brand}
                onClose={() => {}}
                onUpdateItem={() => {}}
                onUpdateDesign={handleUpdateDesign}
              />
            )}
          </div>

          {/* Smart Resize Modal */}
          {showSmartResize && state.design && (
            <SmartResizeModal
              design={state.design}
              onResize={(newDesign) => {
                setState((prev) => pushToHistory(prev, newDesign));
                setShowSmartResize(false);
              }}
              onClose={() => setShowSmartResize(false)}
            />
          )}

          {/* Multi-Platform Preview Modal */}
          {showPlatformPreview && state.design && (
            <MultiPlatformPreview
              design={state.design}
              onClose={() => setShowPlatformPreview(false)}
            />
          )}

          {/* Color Picker Modal */}
          {showColorPicker && (
            <ColorPickerModal
              brandColors={[brand?.primaryColor, brand?.secondaryColor, ...(brand?.colorPalette || [])].filter(
                Boolean
              ) as string[]}
              onSelectColor={(color) => {
                handleSelectColor(color);
                setShowColorPicker(false);
              }}
              onClose={() => setShowColorPicker(false)}
            />
          )}

          {/* Image Selector Modal */}
          {showImageSelector && (
            <ImageSelectorModal
              onSelectImage={(imageUrl, imageName) => {
                // If we're uploading to edit (no design exists), create a new design with the image
                if (!state.design) {
                  // Get brandId (allow workspace default for upload)
                  const brandId = requireBrandForAction("upload to edit", false) || "workspace-default";
                  
                  // Create a square design (1080x1080) with the uploaded image
                  const preset = FORMAT_PRESETS["social_square"];
                  const backgroundItem: CanvasItem = {
                    id: "bg-1",
                    type: "background",
                    x: 0,
                    y: 0,
                    width: preset.width,
                    height: preset.height,
                    rotation: 0,
                    zIndex: 0,
                    backgroundType: "solid",
                    backgroundColor: "#ffffff",
                  };
                  
                  // Create image item - center it and scale to fit canvas
                  const imageItem: CanvasItem = {
                    id: `image-${Date.now()}`,
                    type: "image",
                    x: 0,
                    y: 0,
                    width: preset.width,
                    height: preset.height,
                    rotation: 0,
                    zIndex: 1,
                    imageUrl,
                    imageName,
                  };
                  
                  const newDesign: Design = {
                    id: `design-${Date.now()}`,
                    name: imageName || "Uploaded Image",
                    format: "social_square",
                    width: preset.width,
                    height: preset.height,
                    brandId,
                    items: [backgroundItem, imageItem],
                    backgroundColor: "#ffffff",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    savedToLibrary: false,
                  };
                  
                  const fitZoom = calculateFitToScreenZoom(newDesign.width, newDesign.height);
                  setState((prev) => ({
                    ...prev,
                    design: newDesign,
                    startMode: "scratch",
                    selectedItemId: imageItem.id,
                    zoom: fitZoom,
                    history: [newDesign],
                    historyIndex: 0,
                  }));
                  
                  logTelemetry("studio_upload_to_edit", {
                    brandId,
                    imageName,
                    timestamp: new Date().toISOString(),
                  });
                } else {
                  // If design exists, use normal handleSelectImage (for adding images to existing design)
                  handleSelectImage(imageUrl, imageName);
                }
                setShowImageSelector(false);
                setPendingImageItemId(null); // Clear pending item after selection
              }}
              onClose={() => {
                setShowImageSelector(false);
                // If there's a pending placeholder image, remove it if user cancels
                if (pendingImageItemId) {
                  setState((prev) => {
                    if (!prev.design) return prev;
                    const updatedItems = prev.design.items.filter((item) => item.id !== pendingImageItemId);
                    const updatedDesign: Design = {
                      ...prev.design,
                      items: updatedItems,
                      updatedAt: new Date().toISOString(),
                    };
                    return {
                      ...prev,
                      design: updatedDesign,
                      selectedItemId: null,
                    };
                  });
                  setPendingImageItemId(null);
                }
              }}
            />
          )}

          {/* Rename Asset Modal */}
          {showRenameAsset && state.design && (
            <RenameAssetModal
              currentName={state.design.name}
              onConfirm={handleConfirmRename}
              onClose={() => setShowRenameAsset(false)}
            />
          )}

          {/* Publish Confirm Modal */}
          {showPublishConfirm && state.design && (
            <PublishConfirmModal
              designName={state.design.name}
              platforms={state.design.scheduledPlatforms || ["All"]}
              onConfirm={handleConfirmPublish}
              onCancel={() => setShowPublishConfirm(false)}
            />
          )}

          {/* Schedule Modal */}
          {showScheduleModal && state.design && (
            <ScheduleModal
              currentSchedule={{
                date: state.design.scheduledDate || "",
                time: state.design.scheduledTime || "12:00",
                autoPublish: state.design.autoPublish || false,
              }}
              onConfirm={handleConfirmSchedule}
              onClose={() => setShowScheduleModal(false)}
            />
          )}

          {/* Platform Selector Modal */}
          {showPlatformSelector && state.design && (
            <PlatformSelectorModal
              onConfirm={handleConfirmMultiplePlatforms}
              onClose={() => setShowPlatformSelector(false)}
            />
          )}

          {/* Background Picker Modal */}
          {showBackgroundModal && state.design && (
            <BackgroundPickerModal
              currentColor={state.design.backgroundColor || "#FFFFFF"}
              onConfirm={handleChangeBackground}
              onClose={() => setShowBackgroundModal(false)}
            />
          )}

          {/* Elements Drawer */}
          {state.design && (
            <ElementsDrawer
              isOpen={showElementsDrawer}
              onClose={() => setShowElementsDrawer(false)}
              onElementDrag={handleElementDrag}
              onOpenTemplates={() => {
                setShowElementsDrawer(false);
                setShowTemplateModal(true);
              }}
              onOpenBackground={() => {
                setShowElementsDrawer(false);
                setShowBackgroundModal(true);
              }}
              onOpenMedia={() => {
                setShowElementsDrawer(false);
                setShowImageSelector(true);
              }}
              activeSection={activeDrawerSection}
            />
          )}

          {/* ✅ PHASE 4: Variant Selector Modal */}
          {pendingVariants && pendingVariants.length > 0 && (
            <VariantSelector
              variants={pendingVariants}
              isOpen={isVariantSelectorOpen}
              isLoading={isMakingOnBrand}
              onSelect={handleSelectVariant}
              onClose={handleCloseVariantSelector}
            />
          )}
        </div>
      </FirstVisitTooltip>
    );
  };

  // Main render - always render modals so they work from entry screen
  return (
    <PageShell>
      {/* Modals - Always rendered so they work from entry screen */}
      <AiGenerationModal
        open={showAiModal}
        onOpenChange={setShowAiModal}
        onUseDocVariant={handleUseDocVariant}
        onUseDesignVariant={handleUseDesignVariant}
      />
      <CanvaIntegrationModal
        isOpen={showCanvaModal}
        onClose={() => setShowCanvaModal(false)}
        mode={state.design ? "editor" : "import"}
        onInitiateEditor={() => {
          logTelemetry("canva_editor_initiated", { brandId: currentBrand?.id });
          // TODO: When Canva API is ready, call initiateCanvaEditor()
          setShowCanvaModal(false);
        }}
        onImportDesign={() => {
          logTelemetry("canva_import_initiated", { brandId: currentBrand?.id });
          // TODO: When Canva API is ready, call importCanvaDesign()
          toast({
            title: "Import from Canva",
            description: "Canva import coming soon! This will import a design from your Canva account.",
          });
          setShowCanvaModal(false);
        }}
      />

      {/* Smart Resize Modal */}
      {showSmartResize && state.design && (
        <SmartResizeModal
          design={state.design}
          onResize={(newDesign) => {
            setState((prev) => pushToHistory(prev, newDesign));
            setShowSmartResize(false);
          }}
          onClose={() => setShowSmartResize(false)}
        />
      )}

      {/* Multi-Platform Preview Modal */}
      {showPlatformPreview && state.design && (
        <MultiPlatformPreview
          design={state.design}
          onClose={() => setShowPlatformPreview(false)}
        />
      )}

      {/* Color Picker Modal */}
      {showColorPicker && (
        <ColorPickerModal
          brandColors={[brand?.primaryColor, brand?.secondaryColor, ...(brand?.colorPalette || [])].filter(
            Boolean
          ) as string[]}
          onSelectColor={(color) => {
            handleSelectColor(color);
            setShowColorPicker(false);
          }}
          onClose={() => setShowColorPicker(false)}
        />
      )}

      {/* Image Selector Modal */}
      {showImageSelector && (
        <ImageSelectorModal
          onSelectImage={(imageUrl, imageName) => {
            handleSelectImage(imageUrl, imageName);
            setShowImageSelector(false);
            setPendingImageItemId(null); // Clear pending item after selection
          }}
          onClose={() => {
            setShowImageSelector(false);
            // If there's a pending placeholder image, remove it if user cancels
            if (pendingImageItemId) {
              setState((prev) => {
                if (!prev.design) return prev;
                const updatedItems = prev.design.items.filter((item) => item.id !== pendingImageItemId);
                const updatedDesign: Design = {
                  ...prev.design,
                  items: updatedItems,
                  updatedAt: new Date().toISOString(),
                };
                return {
                  ...prev,
                  design: updatedDesign,
                  selectedItemId: null,
                };
              });
              setPendingImageItemId(null);
            }
          }}
        />
      )}

      {/* Rename Asset Modal */}
      {showRenameAsset && state.design && (
        <RenameAssetModal
          currentName={state.design.name}
          onConfirm={handleConfirmRename}
          onClose={() => setShowRenameAsset(false)}
        />
      )}

      {/* Publish Confirm Modal */}
      {showPublishConfirm && state.design && (
        <PublishConfirmModal
          designName={state.design.name}
          platforms={state.design.scheduledPlatforms || ["All"]}
          onConfirm={handleConfirmPublish}
          onCancel={() => setShowPublishConfirm(false)}
        />
      )}

      {/* Schedule Modal */}
      {showScheduleModal && state.design && (
        <ScheduleModal
          currentSchedule={{
            date: state.design.scheduledDate || "",
            time: state.design.scheduledTime || "12:00",
            autoPublish: state.design.autoPublish || false,
          }}
          onConfirm={handleConfirmSchedule}
          onClose={() => setShowScheduleModal(false)}
        />
      )}

      {/* Platform Selector Modal */}
      {showPlatformSelector && state.design && (
        <PlatformSelectorModal
          onConfirm={handleConfirmMultiplePlatforms}
          onClose={() => setShowPlatformSelector(false)}
        />
      )}

      {/* Background Picker Modal */}
      {showBackgroundModal && state.design && (
        <BackgroundPickerModal
          currentColor={state.design.backgroundColor || "#FFFFFF"}
          onConfirm={handleChangeBackground}
          onClose={() => setShowBackgroundModal(false)}
        />
      )}

      {/* Elements Drawer */}
      {state.design && (
        <ElementsDrawer
          isOpen={showElementsDrawer}
          onClose={() => setShowElementsDrawer(false)}
          onElementDrag={handleElementDrag}
          onOpenTemplates={() => {
            setShowElementsDrawer(false);
            // Open template library here if needed
          }}
          onOpenBackground={() => {
            setShowElementsDrawer(false);
            setShowBackgroundModal(true);
          }}
          onOpenMedia={() => {
            setShowElementsDrawer(false);
            setShowImageSelector(true);
          }}
          activeSection={activeDrawerSection}
        />
      )}

      {/* Template Grid Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
          <CreativeStudioTemplateGrid
            onSelectTemplate={handleSelectTemplate}
            onStartAI={() => {
              setShowTemplateModal(false);
              setShowAiModal(true);
            }}
            onCancel={() => setShowTemplateModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Main Content - Entry Screen or Canvas Editor */}
      {renderMainContent()}
    </PageShell>
  );
}
