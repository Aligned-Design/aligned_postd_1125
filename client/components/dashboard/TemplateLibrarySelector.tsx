import { useState } from "react";
import { DESIGN_TEMPLATES, DesignTemplate } from "@/lib/designTemplates";
import { Design, DesignFormat } from "@/types/creativeStudio";
import { X } from "lucide-react";

interface TemplateLibrarySelectorProps {
  format: DesignFormat;
  onSelectTemplate: (template: Design) => void;
  onClose: () => void;
}

export function TemplateLibrarySelector({ format, onSelectTemplate, onClose }: TemplateLibrarySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "social" | "email" | "blog" | "general">("all");

  const templates = DESIGN_TEMPLATES.filter(
    (t) =>
      t.format === format &&
      (selectedCategory === "all" || t.category === selectedCategory)
  );

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "social", label: "Social Media" },
    { id: "email", label: "Email" },
    { id: "blog", label: "Blog" },
    { id: "general", label: "General" },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/60 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Choose a Template</h2>
            <p className="text-sm text-slate-600 mt-1">
              Start with a pre-designed layout and customize it
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-bold transition-all text-sm ${
                  selectedCategory === category.id
                    ? "bg-lime-400 text-indigo-950"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          {templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => {
                    // Create a complete design from the template
                    const design: Design = {
                      ...template.design,
                      id: `design-${Date.now()}`,
                      brandId: "default",
                      campaignId: "",
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      savedToLibrary: false,
                    };
                    onSelectTemplate(design);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600 font-semibold mb-2">No templates available</p>
              <p className="text-sm text-slate-500">
                Try selecting a different format or category
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-white/60 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: DesignTemplate;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const preview =
    template.design.items.find((item) => item.type === "image")?.imageUrl ||
    template.design.backgroundColor;

  return (
    <button
      onClick={onSelect}
      className="group rounded-lg border-2 border-slate-200 overflow-hidden hover:border-lime-400 hover:shadow-lg transition-all text-left"
    >
      {/* Preview */}
      <div
        className="w-full aspect-square bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center overflow-hidden relative"
        style={{ backgroundColor: template.design.backgroundColor || "#f8fafc" }}
      >
        <div
          className="text-2xl opacity-50 group-hover:opacity-75 transition-opacity"
          style={{
            width: "80%",
            height: "80%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          {template.preview}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-white">
        <h3 className="font-bold text-slate-900">{template.name}</h3>
        <p className="text-xs text-slate-600 mt-1">{template.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs font-semibold text-slate-500 uppercase">
            {template.format === "social_square" && "1:1"}
            {template.format === "story_portrait" && "9:16"}
            {template.format === "blog_featured" && "16:9"}
            {template.format === "email_header" && "~3:1"}
            {template.format === "custom" && "Custom"}
          </span>
          <span className="text-xs font-bold text-lime-600 group-hover:text-lime-700 transition-colors">
            Use Template →
          </span>
        </div>
      </div>
    </button>
  );
}
