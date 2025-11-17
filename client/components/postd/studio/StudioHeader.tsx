/**
 * StudioHeader - Simplified header for Creative Studio
 * Phase 1: Quick Wins - Simplified header with clear hierarchy
 */

import { ArrowLeft, Save, Send, MoreVertical, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/design-system";

interface StudioHeaderProps {
  designName: string;
  onDesignNameChange: (name: string) => void;
  onBack: () => void;
  isSaving?: boolean;
  lastSaved?: string;
  hasUnsavedChanges?: boolean;
  onSave: () => void;
  onPublish: () => void;
  onSchedule?: () => void;
  onSaveAsDraft?: () => void;
  onDownload?: () => void;
  onSaveToLibrary?: () => void;
  onDesignInCanva?: () => void;
  userRole?: string;
}

export function StudioHeader({
  designName,
  onDesignNameChange,
  onBack,
  isSaving = false,
  lastSaved,
  hasUnsavedChanges = false,
  onSave,
  onPublish,
  onSchedule,
  onSaveAsDraft,
  onDownload,
  onSaveToLibrary,
  onDesignInCanva,
  userRole,
}: StudioHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/60">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Back + Design Name */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={designName}
                onChange={(e) => onDesignNameChange(e.target.value)}
                className="text-lg font-bold text-slate-900 bg-transparent border-none outline-none w-full placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded px-2 py-1 -ml-2"
                placeholder="Untitled Design"
              />
            </div>
          </div>

          {/* Center: Save Status */}
          <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span className="font-medium text-amber-600">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <span>Saved {lastSaved}</span>
              </>
            ) : hasUnsavedChanges ? (
              <span className="text-amber-600 font-medium">Unsaved changes</span>
            ) : null}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Save Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save to Library
                </DropdownMenuItem>
                {onSaveAsDraft && (
                  <DropdownMenuItem onClick={onSaveAsDraft}>
                    Save as Draft
                  </DropdownMenuItem>
                )}
                {onDownload && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDownload}>
                      Download
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Publish Button (Primary) */}
            <Button
              onClick={onPublish}
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold gap-2 shadow-md shadow-indigo-200/50"
            >
              <Send className="w-4 h-4" />
              Publish
            </Button>

            {/* More Options - All secondary actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {onSchedule && (
                  <DropdownMenuItem onClick={onSchedule}>
                    Schedule
                  </DropdownMenuItem>
                )}
                {onSaveAsDraft && (
                  <DropdownMenuItem onClick={onSaveAsDraft}>
                    Save as Draft
                  </DropdownMenuItem>
                )}
                {onDownload && (
                  <DropdownMenuItem onClick={onDownload}>
                    Download
                  </DropdownMenuItem>
                )}
                {onSaveToLibrary && (
                  <DropdownMenuItem onClick={onSaveToLibrary}>
                    Save to Library
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {(userRole === "admin" || userRole === "manager") && (
                  <DropdownMenuItem onClick={onPublish}>
                    Publish Now
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  Duplicate Design
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Export as SVG
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDesignInCanva}>
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">C</span>
                    Design in Canva
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

