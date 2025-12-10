/**
 * AiGenerationModal
 * 
 * Modal dialog for AI content generation with Doc and Design tabs.
 * Shows "Brand voice used" chip to make AI feel personalized.
 */

import { useState } from "react";
import { FileText, Palette, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocAiPanel } from "./DocAiPanel";
import { DesignAiPanel } from "./DesignAiPanel";
import { useBrandGuide } from "@/hooks/useBrandGuide";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import type { AiDocVariant, AiDesignVariant } from "@/lib/types/aiContent";
import type { Design, CanvasItem } from "@/types/creativeStudio";

interface AiGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseDocVariant?: (variant: AiDocVariant) => void;
  onUseDesignVariant?: (variant: AiDesignVariant) => void;
}

export function AiGenerationModal({
  open,
  onOpenChange,
  onUseDocVariant,
  onUseDesignVariant,
}: AiGenerationModalProps) {
  const [activeTab, setActiveTab] = useState<"doc" | "design">("doc");
  const [showBrandInputs, setShowBrandInputs] = useState(false);
  
  const { brandGuide, hasBrandGuide } = useBrandGuide();
  const { brand: currentBrand } = useCurrentBrand();
  
  // Extract brand voice data for display
  const brandName = brandGuide?.brandName || currentBrand?.name || "Your Brand";
  const toneKeywords = brandGuide?.voiceAndTone?.tone || brandGuide?.tone || [];
  const mission = brandGuide?.identity?.name ? `${brandGuide.identity.name}` : "";
  const audience = brandGuide?.identity?.targetAudience || "";
  const contentPillars = brandGuide?.contentRules?.contentPillars || [];

  const handleUseDocVariant = (variant: AiDocVariant) => {
    onUseDocVariant?.(variant);
    // Optionally close modal after use
    // onOpenChange(false);
  };

  const handleUseDesignVariant = (variant: AiDesignVariant) => {
    onUseDesignVariant?.(variant);
    // Optionally close modal after use
    // onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Generate Content</span>
          </DialogTitle>
        </DialogHeader>

        {/* Brand Voice Chip - Shows what brand context AI is using */}
        {hasBrandGuide && toneKeywords.length > 0 && (
          <div className="mt-2 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-600">Brand voice:</span>
                <div className="flex flex-wrap gap-1">
                  {toneKeywords.slice(0, 3).map((tone) => (
                    <span
                      key={tone}
                      className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700"
                    >
                      {tone.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowBrandInputs(!showBrandInputs)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                View brand inputs
                {showBrandInputs ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>
            
            {/* Expandable brand inputs section */}
            {showBrandInputs && (
              <div className="mt-3 pt-3 border-t border-indigo-100 grid grid-cols-2 gap-3 text-xs">
                {mission && (
                  <div>
                    <span className="font-semibold text-slate-600">Brand:</span>
                    <p className="text-slate-700 mt-0.5">{brandName}</p>
                  </div>
                )}
                {audience && (
                  <div>
                    <span className="font-semibold text-slate-600">Audience:</span>
                    <p className="text-slate-700 mt-0.5 line-clamp-2">{audience}</p>
                  </div>
                )}
                {contentPillars.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-semibold text-slate-600">Content pillars:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {contentPillars.slice(0, 5).map((pillar) => (
                        <span
                          key={pillar}
                          className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700"
                        >
                          {pillar}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "doc" | "design")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="doc" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              The Copywriter
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              The Creative
            </TabsTrigger>
          </TabsList>

          <TabsContent value="doc" className="mt-4">
            <DocAiPanel onUseVariant={handleUseDocVariant} />
          </TabsContent>

          <TabsContent value="design" className="mt-4">
            <DesignAiPanel onUseVariant={handleUseDesignVariant} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

