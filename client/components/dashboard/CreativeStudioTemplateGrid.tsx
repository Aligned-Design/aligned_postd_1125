import { useState, useMemo } from "react";
import { Sparkles, Square, Plus } from "lucide-react";
import { DesignFormat, FORMAT_PRESETS } from "@/types/creativeStudio";
import {
  STARTER_TEMPLATES,
  type StarterTemplate,
  type TemplateCategory,
  type TemplateFormat,
} from "@/lib/studio/templates";

// Map template formats to DesignFormat
function mapTemplateFormatToDesignFormat(format: TemplateFormat): DesignFormat {
  switch (format) {
    case "square":
      return "social_square";
    case "story":
    case "portrait":
      return "story_portrait";
    case "landscape":
      return "blog_featured";
    case "email":
      return "email_header";
    case "flyer":
      return "custom";
    default:
      return "social_square";
  }
}

interface CreativeStudioTemplateGridProps {
  onSelectTemplate: (template: StarterTemplate) => void;
  onStartAI: () => void;
  onCancel: () => void;
}

export function CreativeStudioTemplateGrid({
  onSelectTemplate,
  onStartAI,
  onCancel,
}: CreativeStudioTemplateGridProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "templates" | "blank">("templates");
  const [selectedFormat, setSelectedFormat] = useState<DesignFormat>("social_square");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all");

  // Get templates filtered by category and format
  const templates = useMemo(() => {
    if (activeTab === "ai") {
      return [];
    }
    if (activeTab === "blank") {
      // Blank canvas - return empty, handled separately
      return [];
    }
    
    let filtered = STARTER_TEMPLATES;
    
    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }
    
    // Filter by format (map template format to design format)
    const designFormat = selectedFormat;
    filtered = filtered.filter((t) => {
      const templateDesignFormat = mapTemplateFormatToDesignFormat(t.format);
      return templateDesignFormat === designFormat;
    });
    
    return filtered;
  }, [activeTab, selectedCategory, selectedFormat]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const unique = new Set<TemplateCategory>();
    STARTER_TEMPLATES.forEach((t) => unique.add(t.category));
    return Array.from(unique);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-white to-blue-50/20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/60 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-lime-400" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Creative Studio</h1>
              <p className="text-sm text-slate-600 mt-1">Start creating on-brand designs in seconds</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-2 py-1 rounded text-xs font-normal transition-all flex items-center gap-1 ${
                activeTab === "ai"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="text-xs leading-none">✨</span>
              <span>AI</span>
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-2 py-1 rounded text-xs font-normal transition-all flex items-center gap-1 ${
                activeTab === "templates"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="text-xs leading-none">📋</span>
              <span>Templates</span>
            </button>
            <button
              onClick={() => setActiveTab("blank")}
              className={`px-2 py-1 rounded text-xs font-normal transition-all flex items-center gap-1 ${
                activeTab === "blank"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="text-xs leading-none">⚪</span>
              <span>Blank</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto p-6 sm:p-8">
        {/* AI Tab */}
        {activeTab === "ai" && (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-900 mb-3">The Creative</h2>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Describe what you want to create, and we'll generate a custom design based on your brand guide.
            </p>
            <button
              onClick={onStartAI}
              className="px-8 py-3 bg-lime-400 text-indigo-950 font-bold rounded-lg hover:shadow-lg hover:shadow-lime-200 transition-all"
            >
              Start with AI
            </button>
          </div>
        )}

        {/* Template Library Tab */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Templates</h2>
              <p className="text-sm text-slate-600 mb-4">
                Choose a template to customize ({templates.length} available)
              </p>

              {/* Category Filter */}
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-600 mb-1.5">Category</p>
                <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 gap-0.5 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-2 py-1 rounded text-xs font-normal transition-all ${
                      selectedCategory === "all"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2 py-1 rounded text-xs font-normal transition-all capitalize ${
                        selectedCategory === cat
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Filter */}
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-600 mb-1.5">Format</p>
                <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
                  {(
                    [
                      { id: "social_square", name: "Square", icon: "🟦" },
                      { id: "story_portrait", name: "Portrait", icon: "📱" },
                      { id: "blog_featured", name: "Blog", icon: "📝" },
                      { id: "email_header", name: "Email", icon: "📧" },
                      { id: "custom", name: "Custom", icon: "📄" },
                    ] as const
                  ).map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id as DesignFormat)}
                      className={`px-2 py-1 rounded text-xs font-normal transition-all flex items-center gap-1 ${
                        selectedFormat === format.id
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span className="text-xs leading-none">{format.icon}</span>
                      <span>{format.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Grid */}
              {templates.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-sm">No templates found for this filter combination.</p>
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedFormat("social_square");
                    }}
                    className="mt-2 text-xs text-[var(--color-primary)] hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => onSelectTemplate(template)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blank Canvas Tab */}
        {activeTab === "blank" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Blank Canvas</h2>
              <p className="text-sm text-slate-600 mb-4">
                Start fresh with a blank canvas. Choose your format.
              </p>

              {/* Format Selection */}
              <div className="mb-6">
                <p className="text-xs font-medium text-slate-600 mb-1.5">Format</p>
                <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
                  {(
                    [
                      { id: "social_square", name: "Square", icon: "🟦" },
                      { id: "story_portrait", name: "Portrait", icon: "📱" },
                      { id: "blog_featured", name: "Blog", icon: "📝" },
                      { id: "email_header", name: "Email", icon: "📧" },
                    ] as const
                  ).map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id as DesignFormat)}
                      className={`px-2 py-1 rounded text-xs font-normal transition-all flex items-center gap-1 ${
                        selectedFormat === format.id
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span className="text-xs leading-none">{format.icon}</span>
                      <span>{format.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Blank Canvas Card */}
              <button
                onClick={() => {
                  // Create a blank design with the selected format
                  const preset = FORMAT_PRESETS[selectedFormat];
                  const blankDesign: StarterTemplate = {
                    id: "blank-canvas",
                    name: "Blank Canvas",
                    category: "cover", // Use cover as default category
                    format: selectedFormat === "social_square" ? "square" : 
                            selectedFormat === "story_portrait" ? "portrait" :
                            selectedFormat === "blog_featured" ? "landscape" :
                            selectedFormat === "email_header" ? "email" : "flyer",
                    description: "Start with a blank canvas",
                    design: {
                      id: `design-${Date.now()}`,
                      name: "Blank Design",
                      format: selectedFormat,
                      width: preset.width,
                      height: preset.height,
                      brandId: "",
                      items: [
                        {
                          id: "bg-1",
                          type: "background",
                          x: 0,
                          y: 0,
                          width: preset.width,
                          height: preset.height,
                          rotation: 0,
                          zIndex: 0,
                          backgroundType: "solid",
                          backgroundColor: "#ffffff", // white (standard color)
                        },
                      ],
                      backgroundColor: "#FFFFFF",
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      savedToLibrary: false,
                    },
                  };
                  onSelectTemplate(blankDesign);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg p-6 hover:border-[var(--color-primary)] hover:shadow-sm transition-all text-center group"
              >
                <div className="text-3xl mb-3 opacity-50 group-hover:opacity-70 transition-opacity">
                  ⚪
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Blank Canvas</h3>
                <p className="text-sm text-slate-600">
                  Full creative freedom
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: StarterTemplate;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  // Get icon emoji based on category
  const getCategoryIcon = (category: TemplateCategory): string => {
    switch (category) {
      case "quote":
        return "💬";
      case "promo":
        return "🎁";
      case "testimonial":
        return "⭐";
      case "event":
        return "📅";
      case "carousel":
        return "🎠";
      case "cover":
        return "📸";
      default:
        return "📋";
    }
  };

  return (
    <button
      onClick={onSelect}
      className="group w-full px-3 py-2 bg-white rounded-md border border-slate-200 hover:border-[var(--color-primary)] hover:bg-slate-50 transition-all text-left flex items-center gap-3"
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-8 h-8 rounded bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <span className="text-lg opacity-60 group-hover:opacity-80 transition-opacity">
          {getCategoryIcon(template.category)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-slate-900 truncate">{template.name}</h3>
          <span className="text-xs text-slate-400 capitalize">({template.category})</span>
        </div>
        <p className="text-xs text-slate-500 truncate">{template.description}</p>
      </div>
    </button>
  );
}
