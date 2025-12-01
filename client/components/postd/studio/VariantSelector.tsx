/**
 * VariantSelector
 * 
 * Modal component for selecting a Design Agent variant to apply to the canvas.
 * Displays all variants with their metadata and allows user to choose one.
 */

import { X, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/design-system";
import type { AiDesignVariant } from "@/lib/types/aiContent";

interface VariantSelectorProps {
  variants: AiDesignVariant[];
  isOpen: boolean;
  isLoading?: boolean;
  onSelect: (variant: AiDesignVariant) => void;
  onClose: () => void;
}

export function VariantSelector({
  variants,
  isOpen,
  isLoading = false,
  onSelect,
  onClose,
}: VariantSelectorProps) {
  const formatBFS = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const getBFSColor = (score: number) => {
    if (score >= 0.9) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 0.8) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 0.7) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Choose a Design Variant</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-slate-600">Loading variants...</span>
          </div>
        ) : variants.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No variants available
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-slate-600 mb-4">
              Select one of the {variants.length} brand-compliant design variants to apply to your canvas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {variants.map((variant, index) => (
                <Card
                  key={variant.id}
                  className={cn(
                    "relative transition-all hover:shadow-lg",
                    "border-2 hover:border-indigo-300"
                  )}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {variant.label || `Variant ${String.fromCharCode(65 + index)}`}
                        </CardTitle>
                        {variant.description && (
                          <CardDescription className="mt-1">
                            {variant.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge
                        className={cn(
                          "ml-2 flex-shrink-0",
                          getBFSColor(variant.brandFidelityScore)
                        )}
                      >
                        {formatBFS(variant.brandFidelityScore)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {/* Variant Metadata */}
                      <div className="space-y-2 text-sm">
                        {variant.aspectRatio && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="font-medium">Aspect:</span>
                            <span>{variant.aspectRatio}</span>
                          </div>
                        )}
                        {variant.useCase && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="font-medium">Use Case:</span>
                            <span>{variant.useCase}</span>
                          </div>
                        )}
                        {variant.complianceTags && variant.complianceTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {variant.complianceTags.slice(0, 3).map((tag, tagIndex) => (
                              <Badge
                                key={tagIndex}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Prompt Preview */}
                      {variant.prompt && (
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-xs text-slate-500 line-clamp-3">
                            {variant.prompt}
                          </p>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button
                        onClick={() => onSelect(variant)}
                        className="w-full mt-4"
                        variant="default"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Use This Variant
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

