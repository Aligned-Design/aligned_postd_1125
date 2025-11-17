import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Sparkles } from "lucide-react";
import { CrawlerSuggestion, FieldChange } from "@/types/brand-kit-field";
import { cn } from "@/lib/design-system";

interface CrawlerDiffModalProps {
  open: boolean;
  onClose: () => void;
  suggestions: CrawlerSuggestion[];
  onApplyChanges: (changes: FieldChange[]) => void;
}

export function CrawlerDiffModal({
  open,
  onClose,
  suggestions,
  onApplyChanges,
}: CrawlerDiffModalProps) {
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(
    new Set(),
  );
  const [activeTab, setActiveTab] = useState("all");

  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce(
    (acc, suggestion) => {
      if (!acc[suggestion.category]) {
        acc[suggestion.category] = [];
      }
      acc[suggestion.category].push(suggestion);
      return acc;
    },
    {} as Record<string, CrawlerSuggestion[]>,
  );

  const categories = Object.keys(groupedSuggestions);

  const toggleSuggestion = (field: string) => {
    setSelectedChanges((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const selectAll = () => {
    const filteredSuggestions =
      activeTab === "all" ? suggestions : groupedSuggestions[activeTab] || [];

    setSelectedChanges(
      new Set(
        filteredSuggestions
          .filter((s) => s.currentSource !== "user")
          .map((s) => s.field),
      ),
    );
  };

  const deselectAll = () => {
    setSelectedChanges(new Set());
  };

  const handleApply = () => {
    const changes: FieldChange[] = suggestions
      .filter((s) => selectedChanges.has(s.field))
      .map((s) => ({
        field: s.field,
        value: s.suggestedValue,
        source: "crawler" as const,
      }));

    onApplyChanges(changes);
    onClose();
  };

  const renderSuggestionCard = (suggestion: CrawlerSuggestion) => {
    const isSelected = selectedChanges.has(suggestion.field);
    const isUserEdited = suggestion.currentSource === "user";

    return (
      <div
        key={suggestion.field}
        className={cn(
          "rounded-xl border p-6 transition-all",
          isSelected && !isUserEdited
            ? "border-violet bg-violet/5"
            : "border-border/50 bg-card",
          isUserEdited && "opacity-60",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{suggestion.label}</h4>
              {isUserEdited && (
                <Badge variant="outline" className="text-xs">
                  User-edited (protected)
                </Badge>
              )}
              {!isUserEdited && suggestion.currentSource === "crawler" && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI suggestion
                </Badge>
              )}
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-20 text-sm text-muted-foreground">
                  Current:
                </div>
                <div className="flex-1">
                  {renderValue(suggestion.currentValue, suggestion.field)}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="shrink-0 w-20 text-sm font-medium text-violet">
                  Suggested:
                </div>
                <div className="flex-1 font-medium">
                  {renderValue(suggestion.suggestedValue, suggestion.field)}
                </div>
              </div>
            </div>

            {suggestion.confidence && (
              <div className="mt-3 text-xs text-muted-foreground">
                Confidence: {Math.round(suggestion.confidence * 100)}%
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isSelected ? "default" : "outline"}
              onClick={() => toggleSuggestion(suggestion.field)}
              disabled={isUserEdited}
              className="shrink-0"
            >
              {isSelected ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </>
              ) : (
                "Keep mine"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderValue = (value: unknown, field: string) => {
    if (!value)
      return <span className="text-muted-foreground italic">Not set</span>;

    // Colors
    if (field.includes("color") || field === "colors") {
      if (typeof value === "object" && !Array.isArray(value)) {
        return (
          <div className="flex gap-2">
            {Object.entries(value).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-lg border shadow-sm"
                  style={{ backgroundColor: color as string }}
                />
                <span className="text-sm">{String(color)}</span>
              </div>
            ))}
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg border shadow-sm"
            style={{ backgroundColor: String(value) }}
          />
          <span className="text-sm">{String(value)}</span>
        </div>
      );
    }

    // Arrays
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, i) => (
            <Badge key={i} variant="secondary">
              {item}
            </Badge>
          ))}
        </div>
      );
    }

    // Objects
    if (typeof value === "object") {
      return (
        <div className="space-y-1">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="text-sm">
              <span className="font-medium">{key}:</span> {String(val)}
            </div>
          ))}
        </div>
      );
    }

    // String/number
    return <span className="text-sm">{String(value)}</span>;
  };

  const filteredSuggestions =
    activeTab === "all" ? suggestions : groupedSuggestions[activeTab] || [];

  const selectedCount = selectedChanges.size;
  const userEditedCount = suggestions.filter(
    (s) => s.currentSource === "user",
  ).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet" />
            Review Website Import
          </DialogTitle>
          <DialogDescription>
            Select which AI-suggested changes to accept. User-edited fields are
            protected and won't be overwritten.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">All ({suggestions.length})</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)} (
                  {groupedSuggestions[category].length})
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select all
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            <TabsContent value={activeTab} className="mt-0 space-y-4">
              {filteredSuggestions.map(renderSuggestionCard)}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{selectedCount} selected</span>
            {userEditedCount > 0 && (
              <span className="text-orange-600">
                {userEditedCount} protected (user-edited)
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={selectedCount === 0}>
              <Check className="h-4 w-4 mr-2" />
              Apply {selectedCount} change{selectedCount !== 1 ? "s" : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
