/**
 * StudioEntryScreen - Redesigned with AI-forward UX
 * New structure: Start Creating → Edit Existing Content
 */

import React from "react";
import { Upload, Sparkles, Plus, FileImage, Instagram, Video, Image as ImageIcon, FileText, Megaphone, Paintbrush, Info, FolderOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { cn } from "@/lib/design-system";
import { DesignFormat } from "@/types/creativeStudio";

interface StudioEntryScreenProps {
  onEditExisting?: (designId: string) => void;
  onUploadToEdit?: () => void;
  onImportFromCanva?: () => void;
  onStartNew?: (format?: DesignFormat) => void;
  onStartFromAI?: (templateType?: string) => void;
  onOpenTemplateLibrary?: () => void;
  recentDesigns?: Array<{
    id: string;
    name: string;
    thumbnail?: string;
    updatedAt: string;
  }>;
  drafts?: Array<{
    id: string;
    name: string;
    thumbnail?: string;
    updatedAt: string;
  }>;
  // Guardrails
  hasBrand?: boolean;
  hasBrandKit?: boolean;
  isBrandKitLoading?: boolean;
}

// Quick template types for AI generation
const QUICK_TEMPLATES = [
  { id: "social-post", label: "Social Post", icon: Instagram, format: "social_square" as DesignFormat },
  { id: "reel-tiktok", label: "Reel / TikTok", icon: Video, format: "story_portrait" as DesignFormat },
  { id: "story", label: "Story", icon: ImageIcon, format: "story_portrait" as DesignFormat },
  { id: "blog-graphic", label: "Blog Graphic", icon: FileText, format: "blog_featured" as DesignFormat },
  { id: "email-header", label: "Email Header", icon: FileText, format: "email_header" as DesignFormat },
  { id: "flyer", label: "Flyer", icon: Megaphone, format: "custom" as DesignFormat },
];

export function StudioEntryScreen({
  onEditExisting,
  onUploadToEdit,
  onImportFromCanva,
  onStartNew,
  onStartFromAI,
  onOpenTemplateLibrary,
  recentDesigns = [],
  drafts = [],
  hasBrand = false,
  hasBrandKit = false,
  isBrandKitLoading = false,
}: StudioEntryScreenProps) {
  const [activeMode, setActiveMode] = React.useState<"ai" | "template" | "blank">("ai");
  const [showQuickTemplates, setShowQuickTemplates] = React.useState(false);

  // Check AI availability
  const { aiConfigured, isLoading: healthLoading } = useSystemHealth();

  // Guardrail: Check if AI/template actions are allowed
  // Brands are created during registration, so hasBrand should always be true after loading
  // Allow clicking if brand is selected (even without brand guide - modal will show helpful message)
  const canUseAI = hasBrand && !isBrandKitLoading && (healthLoading || aiConfigured);
  const aiBlockReason = isBrandKitLoading
    ? "Loading brand kit..."
    : !healthLoading && !aiConfigured
    ? "AI generation is currently unavailable"
    : null;

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Visual Enhancements - Soft purple abstract shape in top right */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-100/40 to-indigo-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-lg">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Creative Studio</h1>
              <p className="text-sm text-slate-600">Create and edit your designs</p>
            </div>
          </div>

          {/* Segmented Control for Main Actions */}
          <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as "ai" | "template" | "blank")} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 h-10 bg-slate-100">
              <TabsTrigger 
                value="ai" 
                className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                disabled={!hasBrand || isBrandKitLoading}
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                AI
              </TabsTrigger>
              <TabsTrigger 
                value="template" 
                className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <FolderOpen className="w-4 h-4 mr-1.5" />
                Templates
              </TabsTrigger>
              <TabsTrigger 
                value="blank" 
                className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Blank
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12 sm:py-16 relative">

        {/* Section 1: Start Creating - Content based on active tab */}
        <div className="mb-12 sm:mb-16">
          <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as "ai" | "template" | "blank")} className="w-full">
            {/* AI Tab Content */}
            <TabsContent value="ai" className="mt-6">
              {!healthLoading && !aiConfigured && (
                <Alert className="mb-4 border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-800">
                    AI generation is currently unavailable in this environment.
                    Please contact support or your admin to enable AI.
                  </AlertDescription>
                </Alert>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <button
                        onClick={() => {
                          if (!canUseAI && aiBlockReason) return;
                          if (onStartFromAI) {
                            onStartFromAI();
                          }
                        }}
                        disabled={!canUseAI}
                        className={cn(
                          "w-full px-6 py-4 rounded-lg border-2 transition-all text-left",
                          canUseAI
                            ? "bg-[var(--color-lime-500)] border-[var(--color-lime-500)] hover:bg-[var(--color-lime-400)] hover:shadow-md"
                            : "bg-slate-200 border-slate-300 cursor-not-allowed opacity-60"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Sparkles className={cn(
                            "w-5 h-5 flex-shrink-0",
                            canUseAI ? "text-[var(--color-primary-dark)]" : "text-slate-500"
                          )} />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-[var(--color-primary-dark)] mb-0.5">
                              Generate with AI
                            </h3>
                            <p className="text-xs text-[var(--color-primary-dark)]/80 leading-snug">
                              Create designs automatically based on your brand guide
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </TooltipTrigger>
                  {!canUseAI && aiBlockReason && (
                    <TooltipContent>
                      <p className="text-sm">{aiBlockReason}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              {/* Quick Templates - Shown below AI button */}
              {hasBrand && !isBrandKitLoading && (healthLoading || aiConfigured) && onStartFromAI && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-600 mb-3">Quick Templates</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TEMPLATES.map((template) => {
                      const Icon = template.icon;
                      return (
                        <button
                          key={template.id}
                          onClick={() => {
                            onStartFromAI(template.id);
                          }}
                          className="group px-3 py-2 bg-white rounded-md border border-slate-200 hover:border-[var(--color-primary)] hover:bg-slate-50 transition-all flex items-center gap-2 text-sm"
                        >
                          <Icon className="w-4 h-4 text-slate-600 group-hover:text-[var(--color-primary)] transition-colors" />
                          <span className="font-medium text-slate-700 group-hover:text-[var(--color-primary)] transition-colors">
                            {template.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Template Library Tab Content */}
            <TabsContent value="template" className="mt-6">
              <button
                onClick={() => {
                  // Open template grid modal
                  if (onOpenTemplateLibrary) {
                    onOpenTemplateLibrary();
                  } else if (onStartNew) {
                    // Fallback: open blank canvas if template library handler not provided
                    onStartNew();
                  }
                }}
                className="w-full px-6 py-4 rounded-lg border-2 border-[var(--color-primary)] hover:border-[var(--color-primary-light)] hover:bg-slate-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-[var(--color-primary)] mb-0.5">
                      Browse Template Library
                    </h3>
                    <p className="text-xs text-[var(--color-primary)]/80 leading-snug">
                      Choose from professional templates and customize them
                    </p>
                  </div>
                </div>
              </button>
            </TabsContent>

            {/* Blank Canvas Tab Content */}
            <TabsContent value="blank" className="mt-6">
              <button
                onClick={() => onStartNew?.()}
                className="w-full px-6 py-4 rounded-lg border-2 border-[var(--color-primary)] hover:border-[var(--color-primary-light)] hover:bg-slate-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-[var(--color-primary)] mb-0.5">
                      Start Blank Canvas
                    </h3>
                    <p className="text-xs text-[var(--color-primary)]/80 leading-snug">
                      Begin with an empty editor and design from scratch
                    </p>
                  </div>
                </div>
              </button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Section 2: Edit Existing Content */}
        <div className="mb-12 sm:mb-16 relative">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Edit Existing Content</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload to Edit Card */}
            <button
              onClick={onUploadToEdit}
              className="group relative p-5 bg-white rounded-lg border border-slate-200 hover:border-[var(--color-primary)] hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors flex-shrink-0">
                  <Upload className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">Upload to Edit</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Upload an image or design to begin editing
                  </p>
                </div>
              </div>
            </button>

            {/* Import from Canva Card */}
            {onImportFromCanva && (
              <button
                onClick={onImportFromCanva}
                className="group relative p-5 bg-white rounded-lg border border-slate-200 hover:border-[var(--color-primary)] hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:from-blue-600 group-hover:to-purple-700 transition-colors flex-shrink-0">
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 mb-1">Import from Canva</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Bring designs from Canva directly into the studio
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Recent Designs / Drafts - Only show if there are items */}
        {(recentDesigns.length > 0 || drafts.length > 0) && (
          <div className="mt-12 sm:mt-16">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {drafts.length > 0 ? "Drafts & Recent" : "Recent Designs"}
              </h2>
              {recentDesigns.length > 4 && (
                <button className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-light)] font-medium transition-colors">
                  View All
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...drafts, ...recentDesigns].slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onEditExisting?.(item.id)}
                  className="group bg-white rounded-[var(--radius-card)] border border-slate-200 hover:border-[var(--color-primary)] hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="aspect-square bg-slate-100 relative overflow-hidden">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileImage className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-slate-900 truncate mb-1">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
