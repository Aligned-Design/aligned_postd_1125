import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/design-system";

interface ProgressiveDisclosureProps {
  title: string;
  description?: string;
  level: "beginner" | "intermediate" | "advanced";
  children: React.ReactNode;
  advancedContent?: React.ReactNode;
  helpContent?: string;
  className?: string;
}

export function ProgressiveDisclosure({
  title,
  description,
  level,
  children,
  advancedContent,
  helpContent,
  className,
}: ProgressiveDisclosureProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const levelColors = {
    beginner: "bg-green-100 text-green-800",
    intermediate: "bg-yellow-100 text-yellow-800",
    advanced: "bg-red-100 text-red-800",
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="outline" className={levelColors[level]}>
              {level}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {helpContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            )}
            {advancedContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="gap-1"
              >
                <Settings className="h-4 w-4" />
                {showAdvanced ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
        {showHelp && helpContent && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{helpContent}</p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Content */}
        <div>{children}</div>

        {/* Advanced Content */}
        {showAdvanced && advancedContent && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">
                Advanced Options
              </span>
            </div>
            {advancedContent}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
