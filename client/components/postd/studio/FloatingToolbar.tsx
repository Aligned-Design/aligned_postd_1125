/**
 * FloatingToolbar - Floating toolbar that appears above selected elements
 * Phase 1: Quick Wins - Contextual editing tools
 */

import { Trash2, Copy, AlignLeft, AlignCenter, AlignRight, Layers, RotateCw } from "lucide-react";
import { cn } from "@/lib/design-system";
import { CanvasItem } from "@/types/creativeStudio";

interface FloatingToolbarProps {
  item: CanvasItem;
  position: { x: number; y: number };
  onDelete: () => void;
  onDuplicate: () => void;
  onAlign?: (alignment: "left" | "center" | "right") => void;
  onRotate?: () => void;
  onLayerUp?: () => void;
  onLayerDown?: () => void;
  className?: string;
}

export function FloatingToolbar({
  item,
  position,
  onDelete,
  onDuplicate,
  onAlign,
  onRotate,
  onLayerUp,
  onLayerDown,
  className,
}: FloatingToolbarProps) {
  // Position toolbar above the element
  const toolbarStyle = {
    left: `${position.x}px`,
    top: `${position.y - 48}px`, // 48px above element
  };

  return (
    <div
      className={cn(
        "absolute z-50 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-slate-200 p-1",
        "animate-in fade-in slide-in-from-bottom-2 duration-200",
        className
      )}
      style={toolbarStyle}
    >
      {/* Delete */}
      <button
        onClick={onDelete}
        className="p-2 hover:bg-red-50 rounded-md transition-colors group"
        title="Delete"
      >
        <Trash2 className="w-4 h-4 text-red-600 group-hover:text-red-700" />
      </button>

      {/* Duplicate */}
      <button
        onClick={onDuplicate}
        className="p-2 hover:bg-indigo-50 rounded-md transition-colors group"
        title="Duplicate"
      >
        <Copy className="w-4 h-4 text-indigo-600 group-hover:text-indigo-700" />
      </button>

      {/* Divider */}
      {item.type === "text" && onAlign && (
        <>
          <div className="w-px h-6 bg-slate-200" />
          {/* Alignment (text only) */}
          <button
            onClick={() => onAlign("left")}
            className="p-2 hover:bg-slate-50 rounded-md transition-colors"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => onAlign("center")}
            className="p-2 hover:bg-slate-50 rounded-md transition-colors"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => onAlign("right")}
            className="p-2 hover:bg-slate-50 rounded-md transition-colors"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4 text-slate-600" />
          </button>
        </>
      )}

      {/* Rotate */}
      {onRotate && (
        <>
          <div className="w-px h-6 bg-slate-200" />
          <button
            onClick={onRotate}
            className="p-2 hover:bg-slate-50 rounded-md transition-colors"
            title="Rotate 45°"
          >
            <RotateCw className="w-4 h-4 text-slate-600" />
          </button>
        </>
      )}

      {/* Layer Controls */}
      {(onLayerUp || onLayerDown) && (
        <>
          <div className="w-px h-6 bg-slate-200" />
          {onLayerUp && (
            <button
              onClick={onLayerUp}
              className="p-2 hover:bg-slate-50 rounded-md transition-colors"
              title="Bring Forward"
            >
              <Layers className="w-4 h-4 text-slate-600" />
            </button>
          )}
          {onLayerDown && (
            <button
              onClick={onLayerDown}
              className="p-2 hover:bg-slate-50 rounded-md transition-colors rotate-180"
              title="Send Backward"
            >
              <Layers className="w-4 h-4 text-slate-600" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

