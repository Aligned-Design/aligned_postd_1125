/**
 * TemplateCard - Improved template card with visual preview
 * Phase 1: Quick Wins - Replace emoji icons with visual previews
 */

import { Plus, Sparkles } from "lucide-react";
import type { StarterTemplate } from "@/lib/studio/templates";
import { cn } from "@/lib/design-system";

interface TemplateCardProps {
  template: StarterTemplate;
  onSelect: () => void;
}

export function TemplateCard({ template, onSelect }: TemplateCardProps) {
  // Generate a simple visual preview based on template design
  const renderPreview = () => {
    if (template.design?.items) {
      // Render a simplified preview of the template
      return (
        <div className="w-full h-full relative bg-white rounded-lg overflow-hidden">
          {/* Background */}
          {template.design.backgroundColor && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: template.design.backgroundColor }}
            />
          )}
          
          {/* Gradient Background */}
          {template.design.items.find((item: any) => item.backgroundType === "gradient") && (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${
                  template.design.items.find((item: any) => item.gradientFrom)?.gradientFrom || "var(--color-primary-light)"
                } 0%, ${
                  template.design.items.find((item: any) => item.gradientTo)?.gradientTo || "var(--color-primary)"
                } 100%)`,
              }}
            />
          )}

          {/* Text Elements (simplified) */}
          {template.design.items
            .filter((item: any) => item.type === "text")
            .slice(0, 2)
            .map((item: any, idx: number) => (
              <div
                key={idx}
                className="absolute"
                style={{
                  left: `${(item.x / (template.design?.width || 1080)) * 100}%`,
                  top: `${(item.y / (template.design?.height || 1080)) * 100}%`,
                  width: `${(item.width / (template.design?.width || 1080)) * 100}%`,
                  height: `${(item.height / (template.design?.height || 1080)) * 100}%`,
                  color: item.fontColor || "var(--color-gray-800)",
                  fontSize: `${Math.max(8, (item.fontSize || 24) * 0.15)}px`,
                  fontWeight: item.fontWeight || "normal",
                  textAlign: item.textAlign || "left",
                }}
              >
                {item.text?.substring(0, 20) || "Text"}
              </div>
            ))}

          {/* Shape Elements (simplified) */}
          {template.design.items
            .filter((item: any) => item.type === "shape")
            .slice(0, 1)
            .map((item: any, idx: number) => (
              <div
                key={idx}
                className="absolute rounded"
                style={{
                  left: `${(item.x / (template.design?.width || 1080)) * 100}%`,
                  top: `${(item.y / (template.design?.height || 1080)) * 100}%`,
                  width: `${(item.width / (template.design?.width || 1080)) * 100}%`,
                  height: `${(item.height / (template.design?.height || 1080)) * 100}%`,
                  backgroundColor: item.fill || "var(--color-blue-500)",
                  borderRadius: item.shapeType === "circle" ? "50%" : "4px",
                }}
              />
            ))}
        </div>
      );
    }

    // Fallback: Show icon with gradient background
    const getCategoryIcon = (category: string) => {
      switch (category) {
        case "quote": return "💬";
        case "promo": return "🎁";
        case "testimonial": return "⭐";
        case "event": return "📅";
        case "carousel": return "🎠";
        case "cover": return "📸";
        default: return "📋";
      }
    };
    return (
      <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
        <div className="text-4xl opacity-60">{getCategoryIcon(template.category)}</div>
      </div>
    );
  };

  return (
    <button
      onClick={onSelect}
      className="group bg-white rounded-2xl border-2 border-slate-200 overflow-hidden hover:border-indigo-400 hover:shadow-xl transition-all text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      {/* Preview Area */}
      <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
        {renderPreview()}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all" />
        
        {/* Format Badge */}
        {template.format && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-xs font-bold text-slate-700 capitalize">
            {template.format}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 mb-1 truncate">
              {template.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              {template.category}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
          {template.description}
        </p>

        {/* CTA */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" />
            Use This Template
          </span>
        </div>
      </div>
    </button>
  );
}

