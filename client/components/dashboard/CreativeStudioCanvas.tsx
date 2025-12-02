import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Trash2, RotateCw, Image as ImageIcon } from "lucide-react";
import { Design, CanvasItem } from "@/types/creativeStudio";
import { logError } from "@/lib/logger";

interface CreativeStudioCanvasProps {
  design: Design;
  selectedItemId: string | null;
  zoom: number;
  onSelectItem: (itemId: string | null) => void;
  onUpdateItem: (itemId: string, updates: Partial<CanvasItem>) => void;
  onUpdateDesign: (updates: Partial<Design>) => void;
  onAddElement?: (elementType: string, props: Record<string, any>, x: number, y: number) => void;
  onRotateItem?: (angle: number) => void;
  onDeleteItem?: () => void;
  onEnterCropMode?: (itemId: string) => void;
  onExitCropMode?: () => void;
  onConfirmCrop?: (itemId: string, crop: { x: number; y: number; width: number; height: number; aspectRatio?: "1:1" | "9:16" | "16:9" | "free" }) => void;
  croppingItemId?: string | null;
  cropAspectRatio?: "1:1" | "9:16" | "16:9" | "free";
}

interface EditingState {
  itemId: string;
  text: string;
}

interface DragState {
  itemId: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

interface CropState {
  itemId: string;
  x: number; // 0-1 relative to image
  y: number; // 0-1 relative to image
  width: number; // 0-1 relative to image
  height: number; // 0-1 relative to image
  aspectRatio?: "1:1" | "9:16" | "16:9" | "free";
}

export function CreativeStudioCanvas({
  design,
  selectedItemId,
  zoom,
  onSelectItem,
  onUpdateItem,
  onUpdateDesign,
  onAddElement,
  onRotateItem,
  onDeleteItem,
  onEnterCropMode,
  onExitCropMode,
  onConfirmCrop,
  croppingItemId,
  cropAspectRatio = "free",
}: CreativeStudioCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizing, setResizing] = useState<{ itemId: string; handle: string } | null>(null);
  const [editingText, setEditingText] = useState<EditingState | null>(null);
  const [cropState, setCropState] = useState<CropState | null>(null);
  const [cropResizing, setCropResizing] = useState<{ handle: string } | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const canvasScale = zoom / 100;
  const previousCroppingItemIdRef = useRef<string | null | undefined>(croppingItemId);
  const previousCropAspectRatioRef = useRef<string | undefined>(cropAspectRatio);

  // Compute initial crop state when entering crop mode
  // Crop coordinates are normalized (0-1) relative to image dimensions for scalability
  const initialCropState = useMemo<CropState | null>(() => {
    if (croppingItemId) {
      const item = design.items.find((i) => i.id === croppingItemId);
      if (item && item.type === "image") {
        // Initialize crop to full image or use existing crop
        // Ensure crop values are valid (0-1 range, width/height > 0)
        const existingCrop = item.crop;
        return {
          itemId: croppingItemId,
          x: Math.max(0, Math.min(1, existingCrop?.x ?? 0)),
          y: Math.max(0, Math.min(1, existingCrop?.y ?? 0)),
          width: Math.max(0.1, Math.min(1, existingCrop?.width ?? 1)),
          height: Math.max(0.1, Math.min(1, existingCrop?.height ?? 1)),
          aspectRatio: cropAspectRatio,
        };
      }
    }
    return null;
  }, [croppingItemId, design.items, cropAspectRatio]);

  // Initialize crop state when entering crop mode or update when aspect ratio changes
  // eslint-disable-next-line react-hooks/exhaustive-deps -- cropState is also updated by user interactions, so we need to sync computed state
  useEffect(() => {
    // Initialize when entering crop mode
    if (croppingItemId && !cropState && initialCropState) {
      setCropState(initialCropState);
      setCropResizing(null);
      previousCroppingItemIdRef.current = croppingItemId;
    } 
    // Clean up when exiting crop mode
    else if (!croppingItemId && cropState) {
      setCropState(null);
      setCropResizing(null);
      previousCroppingItemIdRef.current = null;
    }
    // Update aspect ratio when it changes
    else if (cropState && cropAspectRatio !== previousCropAspectRatioRef.current && cropAspectRatio !== cropState.aspectRatio) {
      // Adjust crop to maintain aspect ratio
      const [w, h] = cropAspectRatio === "free" ? [1, 1] : cropAspectRatio.split(":").map(Number);
      const targetRatio = w / h;
      const currentRatio = cropState.width / cropState.height;

      const newCrop = { ...cropState, aspectRatio: cropAspectRatio };

      if (cropAspectRatio !== "free") {
        if (currentRatio > targetRatio) {
          // Too wide - adjust height
          newCrop.height = newCrop.width / targetRatio;
          if (newCrop.y + newCrop.height > 1) {
            newCrop.height = 1 - newCrop.y;
            newCrop.width = newCrop.height * targetRatio;
          }
        } else {
          // Too tall - adjust width
          newCrop.width = newCrop.height * targetRatio;
          if (newCrop.x + newCrop.width > 1) {
            newCrop.width = 1 - newCrop.x;
            newCrop.height = newCrop.width / targetRatio;
          }
        }
      }

      setCropState(newCrop);
      previousCropAspectRatioRef.current = cropAspectRatio;
    }
  }, [croppingItemId, cropState, initialCropState, cropAspectRatio]);

  // Focus text input when editing starts (only when itemId changes, not on every text change)
  useEffect(() => {
    if (editingText && textInputRef.current) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          // Position cursor at end instead of selecting all
          const length = textInputRef.current.value.length;
          textInputRef.current.setSelectionRange(length, length);
        }
      }, 0);
    }
  }, [editingText?.itemId]); // Only re-run when editing a different item, not on text changes

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    // Don't select if we're editing text
    if (editingText) return;
    if (e.button !== 0) return; // Only left mouse button

    const target = e.target as HTMLElement;

    // Don't drag if clicking on textarea or input
    if (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.tagName === "BUTTON") return;

    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const item = design.items.find((i) => i.id === itemId);
    if (!item) return;

    // If in crop mode for this item, handle crop interactions
    if (croppingItemId === itemId && cropState) {
      const targetClassName = typeof target.className === "string" ? target.className : target.getAttribute("class") || "";
      
      // Check if clicking on crop resize handle
      if (targetClassName.includes("crop-handle-")) {
        const handle = targetClassName.match(/crop-handle-(\w+)/)?.[1] || "";
        setCropResizing({ handle });
        return;
      }
      
      // Check if clicking inside crop area (to drag crop)
      const itemRect = {
        left: item.x * canvasScale,
        top: item.y * canvasScale,
        width: item.width * canvasScale,
        height: item.height * canvasScale,
      };
      const cropRect = {
        left: itemRect.left + cropState.x * itemRect.width,
        top: itemRect.top + cropState.y * itemRect.height,
        width: cropState.width * itemRect.width,
        height: cropState.height * itemRect.height,
      };
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      if (
        clickX >= cropRect.left &&
        clickX <= cropRect.left + cropRect.width &&
        clickY >= cropRect.top &&
        clickY <= cropRect.top + cropRect.height
      ) {
        // Start dragging crop area
        setCropState({
          ...cropState,
          // Store initial mouse position relative to crop area
        });
        return;
      }
      
      // Clicked outside crop area - ignore
      return;
    }

    onSelectItem(itemId);

    // Check if clicking on resize handle
    const resizeHandles = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
    const targetClassName = typeof target.className === "string" ? target.className : target.getAttribute("class") || "";
    const isResizeHandle = resizeHandles.some((handle) => targetClassName.includes(`handle-${handle}`));

    if (isResizeHandle) {
      const handle = resizeHandles.find((h) => targetClassName.includes(`handle-${h}`)) || "";
      setResizing({ itemId, handle });
      return;
    }

    setDragState({
      itemId,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      offsetX: item.x,
      offsetY: item.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      // Handle crop interactions first (if in crop mode)
      // Crop coordinates are normalized (0-1) relative to image dimensions
      if (cropState && cropResizing) {
        const item = design.items.find((i) => i.id === cropState.itemId);
        if (!item || item.type !== "image") return;

        const itemX = item.x * canvasScale;
        const itemY = item.y * canvasScale;
        const itemWidth = item.width * canvasScale;
        const itemHeight = item.height * canvasScale;

        // Convert mouse position to normalized crop coordinates (0-1)
        const mouseX = Math.max(0, Math.min(1, (e.clientX - rect.left - itemX) / itemWidth));
        const mouseY = Math.max(0, Math.min(1, (e.clientY - rect.top - itemY) / itemHeight));

        const newCrop = { ...cropState };

        // Calculate new crop bounds based on handle
        // Minimum crop size: 10% of image (0.1) to prevent disappearing crop
        if (cropResizing.handle.includes("e")) {
          // Resize from east (right) edge
          newCrop.width = Math.max(0.1, Math.min(1 - newCrop.x, mouseX - newCrop.x));
        }
        if (cropResizing.handle.includes("w")) {
          // Resize from west (left) edge
          const newX = Math.max(0, Math.min(newCrop.x + newCrop.width - 0.1, mouseX));
          newCrop.width = newCrop.x + newCrop.width - newX;
          newCrop.x = newX;
        }
        if (cropResizing.handle.includes("s")) {
          // Resize from south (bottom) edge
          newCrop.height = Math.max(0.1, Math.min(1 - newCrop.y, mouseY - newCrop.y));
        }
        if (cropResizing.handle.includes("n")) {
          // Resize from north (top) edge
          const newY = Math.max(0, Math.min(newCrop.y + newCrop.height - 0.1, mouseY));
          newCrop.height = newCrop.y + newCrop.height - newY;
          newCrop.y = newY;
        }

        // Apply aspect ratio constraint if set (e.g., "1:1", "9:16")
        if (newCrop.aspectRatio && newCrop.aspectRatio !== "free") {
          const [w, h] = newCrop.aspectRatio.split(":").map(Number);
          const targetRatio = w / h;
          const currentRatio = newCrop.width / newCrop.height;

          if (currentRatio > targetRatio) {
            // Too wide - adjust height to match target ratio
            newCrop.height = newCrop.width / targetRatio;
            // Ensure crop stays within image bounds
            if (newCrop.y + newCrop.height > 1) {
              newCrop.height = 1 - newCrop.y;
              newCrop.width = newCrop.height * targetRatio;
            }
          } else {
            // Too tall - adjust width to match target ratio
            newCrop.width = newCrop.height * targetRatio;
            // Ensure crop stays within image bounds
            if (newCrop.x + newCrop.width > 1) {
              newCrop.width = 1 - newCrop.x;
              newCrop.height = newCrop.width / targetRatio;
            }
          }
        }

        // Final bounds check: ensure crop stays within image (0-1 range)
        newCrop.x = Math.max(0, Math.min(1 - newCrop.width, newCrop.x));
        newCrop.y = Math.max(0, Math.min(1 - newCrop.height, newCrop.y));
        newCrop.width = Math.max(0.1, Math.min(1 - newCrop.x, newCrop.width));
        newCrop.height = Math.max(0.1, Math.min(1 - newCrop.y, newCrop.height));

        setCropState(newCrop);
        return;
      }

      if (dragState) {
        const deltaX = (e.clientX - rect.left - dragState.startX) / canvasScale;
        const deltaY = (e.clientY - rect.top - dragState.startY) / canvasScale;

        onUpdateItem(dragState.itemId, {
          x: Math.max(0, dragState.offsetX + deltaX),
          y: Math.max(0, dragState.offsetY + deltaY),
        });
      }

      if (resizing) {
        const item = design.items.find((i) => i.id === resizing.itemId);
        if (!item) return;

        const deltaX = (e.clientX - rect.left) / canvasScale - item.x;
        const deltaY = (e.clientY - rect.top) / canvasScale - item.y;

        const updates: Partial<CanvasItem> = {};

        if (resizing.handle.includes("e")) {
          updates.width = Math.max(20, item.width + deltaX);
        }
        if (resizing.handle.includes("s")) {
          updates.height = Math.max(20, item.height + deltaY);
        }
        if (resizing.handle.includes("w")) {
          updates.x = item.x + deltaX;
          updates.width = item.width - deltaX;
        }
        if (resizing.handle.includes("n")) {
          updates.y = item.y + deltaY;
          updates.height = item.height - deltaY;
        }

        onUpdateItem(resizing.itemId, updates);
      }
    },
    [dragState, resizing, cropState, cropResizing, canvasScale, onUpdateItem, design.items]
  );

  const handleMouseUp = () => {
    setDragState(null);
    setResizing(null);
    setCropResizing(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData("elementType");
    const propsStr = e.dataTransfer.getData("elementProps");

    if (elementType && onAddElement) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / canvasScale;
      const y = (e.clientY - rect.top) / canvasScale;

      try {
        const props = JSON.parse(propsStr);
        onAddElement(elementType, props, Math.max(0, x), Math.max(0, y));
      } catch (error) {
        logError("Failed to parse element props", error instanceof Error ? error : new Error(String(error)), { elementType, propsStr });
      }
    }
  };

  return (
    <div
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex-1 bg-slate-50 border-l border-slate-200 p-8 overflow-auto relative"
      style={{ cursor: dragState ? "grabbing" : "default" }}
    >
      {/* Canvas Container */}
      <div
        className="relative mx-auto bg-white shadow-2xl"
        style={{
          width: `${design.width * canvasScale}px`,
          height: `${design.height * canvasScale}px`,
          backgroundColor: design.backgroundColor,
        }}
      >
        {/* Canvas Items */}
        {design.items.map((item) => {
          const isSelected = item.id === selectedItemId;

          return (
            <div
              key={item.id}
              className={`absolute transition-opacity ${isSelected ? "z-20" : "z-10"}`}
              style={{
                left: `${item.x * canvasScale}px`,
                top: `${item.y * canvasScale}px`,
                width: `${item.width * canvasScale}px`,
                height: `${item.height * canvasScale}px`,
                transform: `rotate(${item.rotation}deg)`,
              }}
              onMouseDown={(e) => handleMouseDown(e, item.id)}
            >
              {/* Item Content */}
              {item.type === "background" && (
                <div
                  className="w-full h-full"
                  style={{
                    background:
                      item.backgroundType === "gradient"
                        ? `linear-gradient(${item.gradientAngle || 0}deg, ${item.gradientFrom}, ${item.gradientTo})`
                        : item.backgroundColor,
                  }}
                />
              )}

              {item.type === "text" && (
                <>
                  {editingText?.itemId === item.id ? (
                    <textarea
                      ref={textInputRef}
                      value={editingText.text}
                      onChange={(e) => {
                        e.stopPropagation();
                        setEditingText({ itemId: item.id, text: e.target.value });
                      }}
                      onBlur={(e) => {
                        e.stopPropagation();
                        if (editingText) {
                          onUpdateItem(item.id, { text: editingText.text });
                          setEditingText(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          // Cmd/Ctrl+Enter to save
                          e.preventDefault();
                          if (editingText) {
                            onUpdateItem(item.id, { text: editingText.text });
                            setEditingText(null);
                          }
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          setEditingText(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-full h-full p-2 resize-none border-2 border-lime-400 rounded focus:outline-none focus:ring-2 focus:ring-lime-500"
                      style={{
                        fontSize: `${(item.fontSize || 24) * canvasScale}px`,
                        fontFamily: item.fontFamily,
                        color: item.fontColor,
                        fontWeight: item.fontWeight,
                        textAlign: item.textAlign,
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                      }}
                      autoFocus
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center p-2 break-normal break-words cursor-text"
                      style={{
                        fontSize: `${(item.fontSize || 24) * canvasScale}px`,
                        fontFamily: item.fontFamily,
                        color: item.fontColor,
                        fontWeight: item.fontWeight,
                        textAlign: item.textAlign,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingText({ itemId: item.id, text: item.text || "" });
                      }}
                      title="Double-click to edit"
                    >
                      {item.text || "Click to edit text"}
                    </div>
                  )}
                </>
              )}

              {item.type === "image" && item.imageUrl && (
                item.imageUrl === "placeholder" ? (
                  <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    {/* Generic placeholder image - subtle pattern */}
                    <svg
                      className="w-full h-full opacity-40"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 400 400"
                    >
                      <defs>
                        <pattern id="imagePattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                          <rect width="40" height="40" fill="#f1f5f9" />
                          <path d="M0 0L40 40M40 0L0 40" stroke="#cbd5e1" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="400" height="400" fill="url(#imagePattern)" />
                      <circle cx="200" cy="150" r="30" fill="#94a3b8" opacity="0.3" />
                      <rect x="150" y="200" width="100" height="80" rx="4" fill="#94a3b8" opacity="0.2" />
                    </svg>
                    {/* Overlay with icon and text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ImageIcon className="w-16 h-16 mb-3 text-slate-400 opacity-60" />
                      <p className="text-sm font-medium text-slate-500 text-center px-4">{item.imageName || "Select image..."}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full relative overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.imageName}
                      className="w-full h-full object-cover"
                      style={{
                        // Apply crop using CSS clip-path and object-position
                        // Crop coordinates are normalized (0-1), convert to percentages for CSS
                        // clip-path inset: top right bottom left (percentages)
                        // object-position: center point of visible crop area
                        ...(item.crop && {
                          objectPosition: `${(item.crop.x + item.crop.width / 2) * 100}% ${(item.crop.y + item.crop.height / 2) * 100}%`,
                          clipPath: `inset(${(1 - item.crop.y - item.crop.height) * 100}% ${(1 - item.crop.x - item.crop.width) * 100}% ${item.crop.y * 100}% ${item.crop.x * 100}%)`,
                        }),
                      }}
                      onError={(e) => {
                        // Fallback for broken image URLs - show placeholder
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                    {/* Crop Overlay - shown when in crop mode */}
                    {croppingItemId === item.id && cropState && (
                      <>
                        {/* Darkened overlay outside crop area */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `linear-gradient(to right, 
                              rgba(0,0,0,0.5) 0%, 
                              rgba(0,0,0,0.5) ${cropState.x * 100}%, 
                              transparent ${cropState.x * 100}%, 
                              transparent ${(cropState.x + cropState.width) * 100}%, 
                              rgba(0,0,0,0.5) ${(cropState.x + cropState.width) * 100}%, 
                              rgba(0,0,0,0.5) 100%),
                              linear-gradient(to bottom, 
                              rgba(0,0,0,0.5) 0%, 
                              rgba(0,0,0,0.5) ${cropState.y * 100}%, 
                              transparent ${cropState.y * 100}%, 
                              transparent ${(cropState.y + cropState.height) * 100}%, 
                              rgba(0,0,0,0.5) ${(cropState.y + cropState.height) * 100}%, 
                              rgba(0,0,0,0.5) 100%)`,
                          }}
                        />
                        {/* Crop rectangle border */}
                        <div
                          className="absolute border-2 border-lime-400 pointer-events-none"
                          style={{
                            left: `${cropState.x * 100}%`,
                            top: `${cropState.y * 100}%`,
                            width: `${cropState.width * 100}%`,
                            height: `${cropState.height * 100}%`,
                          }}
                        />
                        {/* Crop resize handles */}
                        {["nw", "ne", "sw", "se", "n", "s", "e", "w"].map((handle) => (
                          <div
                            key={handle}
                            className={`absolute w-3 h-3 bg-lime-400 border-2 border-white rounded-sm cursor-${handle}-resize crop-handle-${handle}`}
                            style={{
                              left: handle.includes("w")
                                ? `${cropState.x * 100}%`
                                : handle.includes("e")
                                ? `${(cropState.x + cropState.width) * 100}%`
                                : `${(cropState.x + cropState.width / 2) * 100}%`,
                              top: handle.includes("n")
                                ? `${cropState.y * 100}%`
                                : handle.includes("s")
                                ? `${(cropState.y + cropState.height) * 100}%`
                                : `${(cropState.y + cropState.height / 2) * 100}%`,
                              transform: `translate(-50%, -50%)`,
                              pointerEvents: "auto",
                            }}
                          />
                        ))}
                        {/* Crop confirm/cancel buttons */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mt-2 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onExitCropMode) onExitCropMode();
                            }}
                            className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onConfirmCrop && cropState) {
                                onConfirmCrop(cropState.itemId, {
                                  x: cropState.x,
                                  y: cropState.y,
                                  width: cropState.width,
                                  height: cropState.height,
                                  aspectRatio: cropState.aspectRatio,
                                });
                              }
                            }}
                            className="px-4 py-2 text-sm bg-lime-400 hover:bg-lime-500 text-indigo-950 font-bold rounded-lg transition-colors"
                          >
                            Confirm
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              )}

              {item.type === "shape" && (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: item.fill,
                    border: item.stroke ? `${item.strokeWidth || 2}px solid ${item.stroke}` : "none",
                    borderRadius: item.shapeType === "circle" ? "50%" : "0",
                  }}
                />
              )}

              {/* Selection Border */}
              {isSelected && (
                <div
                  className="absolute inset-0 border-2 border-lime-400 pointer-events-none"
                  style={{
                    transform: `translate(calc(-2px * ${1 / canvasScale}), calc(-2px * ${1 / canvasScale}))`,
                  }}
                >
                  {/* Resize Handles */}
                  {item.type !== "background" && (
                    <>
                      <div
                        className="handle-nw absolute -top-2 -left-2 w-3 h-3 bg-lime-400 border border-white cursor-nwse-resize"
                        style={{ transform: `scale(${1 / canvasScale})` }}
                      />
                      <div
                        className="handle-ne absolute -top-2 -right-2 w-3 h-3 bg-lime-400 border border-white cursor-nesw-resize"
                        style={{ transform: `scale(${1 / canvasScale})` }}
                      />
                      <div
                        className="handle-sw absolute -bottom-2 -left-2 w-3 h-3 bg-lime-400 border border-white cursor-nesw-resize"
                        style={{ transform: `scale(${1 / canvasScale})` }}
                      />
                      <div
                        className="handle-se absolute -bottom-2 -right-2 w-3 h-3 bg-lime-400 border border-white cursor-nwse-resize"
                        style={{ transform: `scale(${1 / canvasScale})` }}
                      />
                      <div
                        className="handle-n absolute -top-2 left-1/2 w-3 h-3 bg-lime-400 border border-white cursor-ns-resize"
                        style={{ transform: `translate(-50%, 0) scale(${1 / canvasScale})` }}
                      />
                      <div
                        className="handle-s absolute -bottom-2 left-1/2 w-3 h-3 bg-lime-400 border border-white cursor-ns-resize"
                        style={{ transform: `translate(-50%, 0) scale(${1 / canvasScale})` }}
                      />
                      <div
                        className="handle-e absolute top-1/2 -right-2 w-3 h-3 bg-lime-400 border border-white cursor-ew-resize"
                        style={{ transform: `translateY(-50%) scale(${1 / canvasScale})` }}
                      />
                      <div
                        className="handle-w absolute top-1/2 -left-2 w-3 h-3 bg-lime-400 border border-white cursor-ew-resize"
                        style={{ transform: `translateY(-50%) scale(${1 / canvasScale})` }}
                      />
                    </>
                  )}

                  {/* Action Buttons */}
                  {item.type !== "background" && (
                    <>
                      {/* Rotate Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRotateItem?.(45);
                        }}
                        className="absolute -top-6 left-1/2 p-1.5 bg-lime-400 hover:bg-lime-500 text-indigo-950 rounded-full border border-white shadow-md transition-all pointer-events-auto"
                        style={{ transform: `translate(-50%, 0) scale(${1 / canvasScale})` }}
                        title="Rotate 45°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem?.();
                        }}
                        className="absolute -top-6 -right-6 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full border border-white shadow-md transition-all pointer-events-auto"
                        style={{ transform: `scale(${1 / canvasScale})` }}
                        title="Delete element (Del)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Canvas Info */}
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-slate-600 border border-white/60">
        <span>Zoom: {zoom}% • </span>
        <span>{design.width}×{design.height}px</span>
      </div>
    </div>
  );
}
