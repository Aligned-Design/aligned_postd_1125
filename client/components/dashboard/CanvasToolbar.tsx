/* eslint-disable */
import { ZoomIn, ZoomOut, Undo2, Redo2 } from "lucide-react";
import { cn } from "@/lib/design-system";

interface CanvasToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function CanvasToolbar({
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CanvasToolbarProps) {
  const ToolButton = ({
    icon: Icon,
    label,
    onClick,
    disabled,
  }: {
    icon: React.ComponentType<any>;
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-3 rounded-lg transition-all duration-200 flex items-center justify-center",
        "bg-white text-slate-700 hover:bg-slate-50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      title={label}
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  return (
    <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center gap-2 p-3 h-full">
      {/* Zoom Tools */}
      <div className="w-full space-y-1 pb-3 border-b border-slate-200">
        <ToolButton icon={ZoomIn} label="Zoom In" onClick={onZoomIn} />
        <ToolButton icon={ZoomOut} label="Zoom Out" onClick={onZoomOut} />
      </div>

      {/* Undo/Redo Tools */}
      <div className="w-full space-y-1">
        <ToolButton icon={Undo2} label="Undo" onClick={onUndo} disabled={!canUndo} />
        <ToolButton icon={Redo2} label="Redo" onClick={onRedo} disabled={!canRedo} />
      </div>

      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );
}
