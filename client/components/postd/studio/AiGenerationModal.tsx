/**
 * AiGenerationModal
 * 
 * Modal dialog for AI content generation with Doc and Design tabs.
 */

import { useState } from "react";
import { X, FileText, Palette } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocAiPanel } from "./DocAiPanel";
import { DesignAiPanel } from "./DesignAiPanel";
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
            <span>Generate Content</span>
          </DialogTitle>
        </DialogHeader>

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

