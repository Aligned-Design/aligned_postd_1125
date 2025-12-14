import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Type, ImageIcon, Badge, Square, Send, Star, Layout, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ElementType {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  defaultProps: Record<string, unknown>;
}

const ELEMENT_TYPES: ElementType[] = [
  {
    id: "text",
    name: "Text",
    icon: Type,
    description: "Heading or caption",
    defaultProps: {
      text: "Click to edit text",
      fontSize: 24,
      fontFamily: "Arial",
      fontColor: "#1F2937",
      fontWeight: "normal",
      textAlign: "left",
    },
  },
  {
    id: "image",
    name: "Image",
    icon: ImageIcon,
    description: "Photo from Library",
    defaultProps: {
      imageUrl: "placeholder",
      imageName: "image",
      backgroundColor: "#E5E7EB",
    },
  },
  {
    id: "logo",
    name: "Logo",
    icon: Badge,
    description: "From Brand Guide",
    defaultProps: {
      imageUrl: "placeholder",
      imageName: "logo",
      width: 120,
      height: 120,
    },
  },
  {
    id: "shape",
    name: "Shape",
    icon: Square,
    description: "Rectangle or circle",
    defaultProps: {
      shapeType: "rectangle",
      fill: "#3B82F6",
      stroke: "none",
      borderRadius: 0,
    },
  },
  {
    id: "button",
    name: "Button",
    icon: Send,
    description: "CTA with link",
    defaultProps: {
      text: "Click here",
      fill: "#3B82F6",
      fontColor: "#FFFFFF",
      link: "",
      borderRadius: 8,
    },
  },
  {
    id: "icon",
    name: "Icon",
    icon: Star,
    description: "Star, heart, arrow",
    defaultProps: {
      iconType: "star",
      fill: "#FBBF24",
      size: 48,
    },
  },
];

interface ElementsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onElementDrag: (elementType: string, x: number, y: number) => void;
  onOpenTemplates: () => void;
  onOpenBackground: () => void;
  onOpenMedia: () => void;
  activeSection?: "elements" | "templates" | "background" | "media";
}

export function ElementsDrawer({
  isOpen,
  onClose,
  onElementDrag,
  onOpenTemplates,
  onOpenBackground,
  onOpenMedia,
  activeSection,
}: ElementsDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    elements: activeSection === "elements" || true,
    templates: activeSection === "templates" || false,
    background: activeSection === "background" || false,
    media: activeSection === "media" || false,
  });

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-close drawer after 5 seconds of inactivity
  useEffect(() => {
    if (!isOpen) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        onClose();
      }, 5000); // 5 seconds of inactivity
    };

    resetTimer();

    // Listen for mouse movement to reset the timer
    window.addEventListener("mousemove", resetTimer);

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isOpen, onClose]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleDragStart = (e: React.DragEvent, element: ElementType) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("elementType", element.id);
    e.dataTransfer.setData("elementProps", JSON.stringify(element.defaultProps));
  };

  return (
    <>
      {/* Sliding Panel - No Modal Overlay */}
      <div
        className={`
          fixed left-16 top-0 bottom-0 w-72 bg-white/95 backdrop-blur-xl 
          border-r border-slate-200/60 shadow-2xl z-40 overflow-y-auto 
          flex flex-col transition-all duration-300 ease-out
          ${isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"}
        `}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-transparent border-b border-slate-200/60 p-4 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">📦 Design & Content</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/50 rounded-lg transition-colors"
            title="Close drawer (Auto-closes after inactivity)"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Design Elements Section */}
          <div className="border border-slate-200/60 rounded-lg overflow-hidden bg-white/50">
            <button
              onClick={() => toggleSection("elements")}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50 hover:bg-indigo-50/50 transition-colors border-b border-slate-200/40"
            >
              <p className="text-xs font-black uppercase text-slate-700 tracking-wide">Design Elements</p>
              <ChevronDown
                className={`w-4 h-4 text-slate-600 transition-transform ${expandedSections.elements ? "rotate-180" : ""}`}
              />
            </button>

            {expandedSections.elements && (
              <div className="p-3 space-y-2 bg-white">
                {ELEMENT_TYPES.map((element) => {
                  const Icon = element.icon;
                  return (
                    <div
                      key={element.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, element)}
                      className="group p-3 rounded-lg border border-slate-200 bg-white hover:border-lime-400 hover:bg-lime-50 transition-all cursor-move active:opacity-75"
                    >
                      <div className="flex items-start gap-2.5">
                        <Icon className="w-4 h-4 text-slate-600 group-hover:text-lime-600 transition-colors mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900">{element.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{element.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Templates Section */}
          <div className="border border-slate-200/60 rounded-lg overflow-hidden bg-white/50">
            <button
              onClick={() => toggleSection("templates")}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50 hover:bg-indigo-50/50 transition-colors border-b border-slate-200/40"
            >
              <p className="text-xs font-black uppercase text-slate-700 tracking-wide">Templates</p>
              <ChevronDown
                className={`w-4 h-4 text-slate-600 transition-transform ${expandedSections.templates ? "rotate-180" : ""}`}
              />
            </button>

            {expandedSections.templates && (
              <div className="p-3 bg-white/30">
                <button
                  onClick={onOpenTemplates}
                  className="w-full px-4 py-3 flex items-center gap-3 rounded-lg border border-slate-200/50 hover:border-lime-400 hover:bg-lime-50/50 transition-colors group"
                >
                  <Layout className="w-4 h-4 text-slate-600 group-hover:text-lime-600" />
                  <p className="text-sm font-bold text-slate-900">Browse Templates</p>
                </button>
              </div>
            )}
          </div>

          {/* Background Section */}
          <div className="border border-slate-200/60 rounded-lg overflow-hidden bg-white/50">
            <button
              onClick={() => toggleSection("background")}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50 hover:bg-indigo-50/50 transition-colors border-b border-slate-200/40"
            >
              <p className="text-xs font-black uppercase text-slate-700 tracking-wide">Background</p>
              <ChevronDown
                className={`w-4 h-4 text-slate-600 transition-transform ${expandedSections.background ? "rotate-180" : ""}`}
              />
            </button>

            {expandedSections.background && (
              <div className="p-3 bg-white/30">
                <button
                  onClick={onOpenBackground}
                  className="w-full px-4 py-3 flex items-center gap-3 rounded-lg border border-slate-200/50 hover:border-lime-400 hover:bg-lime-50/50 transition-colors group"
                >
                  <Layers className="w-4 h-4 text-slate-600 group-hover:text-lime-600" />
                  <p className="text-sm font-bold text-slate-900">Change Color</p>
                </button>
              </div>
            )}
          </div>

          {/* Media Library Section */}
          <div className="border border-slate-200/60 rounded-lg overflow-hidden bg-white/50">
            <button
              onClick={() => toggleSection("media")}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50 hover:bg-indigo-50/50 transition-colors border-b border-slate-200/40"
            >
              <p className="text-xs font-black uppercase text-slate-700 tracking-wide">Media Library</p>
              <ChevronDown
                className={`w-4 h-4 text-slate-600 transition-transform ${expandedSections.media ? "rotate-180" : ""}`}
              />
            </button>

            {expandedSections.media && (
              <div className="p-3 bg-white/30">
                <button
                  onClick={onOpenMedia}
                  className="w-full px-4 py-3 flex items-center gap-3 rounded-lg border border-slate-200/50 hover:border-lime-400 hover:bg-lime-50/50 transition-colors group"
                >
                  <ImageIcon className="w-4 h-4 text-slate-600 group-hover:text-lime-600" />
                  <p className="text-sm font-bold text-slate-900">Browse & Upload</p>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Keyboard Shortcuts */}
        <div className="sticky bottom-0 bg-gradient-to-t from-slate-50/50 to-transparent border-t border-slate-200/40 p-4">
          <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">💡 Quick Tips</p>
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Delete Element</span>
              <span className="font-mono bg-slate-200/40 px-1.5 py-0.5 rounded text-slate-700">Del</span>
            </div>
            <div className="flex justify-between">
              <span>Rotate</span>
              <span className="font-mono bg-slate-200/40 px-1.5 py-0.5 rounded text-slate-700">⌘R</span>
            </div>
            <div className="flex justify-between">
              <span>Auto-closes in 5s</span>
              <span className="font-mono text-slate-500">⏱️</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
