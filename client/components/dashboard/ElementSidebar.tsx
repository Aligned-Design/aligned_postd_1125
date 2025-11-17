import { Type, ImageIcon, Badge, Square, Send, Star, ZoomIn, ZoomOut, Undo2, Redo2 } from "lucide-react";
import { cn } from "@/lib/design-system";

interface ElementCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  tooltip: string;
}

const ELEMENT_CATEGORIES: ElementCategory[] = [
  {
    id: "text",
    name: "Text",
    icon: Type,
    tooltip: "Add text",
  },
  {
    id: "image",
    name: "Image",
    icon: ImageIcon,
    tooltip: "Add image",
  },
  {
    id: "logo",
    name: "Logo",
    icon: Badge,
    tooltip: "Add logo",
  },
  {
    id: "shape",
    name: "Shape",
    icon: Square,
    tooltip: "Add shape",
  },
  {
    id: "button",
    name: "Button",
    icon: Send,
    tooltip: "Add button",
  },
  {
    id: "icon",
    name: "Icon",
    icon: Star,
    tooltip: "Add icon",
  },
];

interface ElementSidebarProps {
  onCategoryClick: (categoryId: string) => void;
  activeCategory?: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function ElementSidebar({
  onCategoryClick,
  activeCategory,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ElementSidebarProps) {
  return (
    <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-3 h-full overflow-y-auto">
      {/* Element Categories */}
      <div className="space-y-3">
        {ELEMENT_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;

          return (
            <div key={category.id} className="group relative">
              <button
                onClick={() => onCategoryClick(category.id)}
                className={cn(
                  "p-3 rounded-lg transition-all duration-200 flex items-center justify-center",
                  "hover:bg-indigo-50 hover:text-indigo-600",
                  "focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2",
                  isActive && "bg-indigo-100 text-indigo-600 shadow-md shadow-indigo-200"
                )}
                title={category.tooltip}
              >
                <Icon className="w-5 h-5" />
              </button>

              {/* Tooltip on hover */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {category.tooltip}
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-lime-400 rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-slate-200" />

      {/* Zoom Controls */}
      <div className="space-y-2">
        <div className="group relative">
          <button
            onClick={onZoomIn}
            className={cn(
              "p-3 rounded-lg transition-all duration-200 flex items-center justify-center",
              "hover:bg-slate-50 text-slate-600 hover:text-indigo-600"
            )}
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Zoom In
          </div>
        </div>

        <div className="group relative">
          <button
            onClick={onZoomOut}
            className={cn(
              "p-3 rounded-lg transition-all duration-200 flex items-center justify-center",
              "hover:bg-slate-50 text-slate-600 hover:text-indigo-600"
            )}
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Zoom Out
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-slate-200" />

      {/* Undo/Redo Controls */}
      <div className="space-y-2 mt-auto">
        <div className="group relative">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              "p-3 rounded-lg transition-all duration-200 flex items-center justify-center",
              canUndo
                ? "hover:bg-slate-50 text-slate-600 hover:text-indigo-600"
                : "text-slate-300 cursor-not-allowed"
            )}
            title="Undo"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Undo
          </div>
        </div>

        <div className="group relative">
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={cn(
              "p-3 rounded-lg transition-all duration-200 flex items-center justify-center",
              canRedo
                ? "hover:bg-slate-50 text-slate-600 hover:text-indigo-600"
                : "text-slate-300 cursor-not-allowed"
            )}
            title="Redo"
          >
            <Redo2 className="w-5 h-5" />
          </button>
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Redo
          </div>
        </div>
      </div>
    </div>
  );
}
