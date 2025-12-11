/**
 * StudioHeader - Simplified header for Creative Studio
 * Phase 1: Quick Wins - Simplified header with clear hierarchy
 */

import { ArrowLeft, Save, Send, MoreVertical, CheckCircle2, Loader2, Sparkles, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/design-system";
import { useNavigate } from "react-router-dom";

// Platform connection status for the header indicator
interface PlatformConnectionStatus {
  facebook: boolean;
  instagram: boolean;
}

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
  onMakeOnBrand?: () => void;
  isMakingOnBrand?: boolean;
  showMakeOnBrand?: boolean; // Show when template is loaded
  userRole?: string;
  /** Platform connection status for displaying indicators */
  platformConnections?: PlatformConnectionStatus;
  /** Whether connections are still loading */
  connectionsLoading?: boolean;
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
  onMakeOnBrand,
  isMakingOnBrand = false,
  showMakeOnBrand = false,
  userRole,
  platformConnections,
  connectionsLoading = false,
}: StudioHeaderProps) {
  const navigate = useNavigate();
  
  const hasAnyConnection = platformConnections?.facebook || platformConnections?.instagram;
  
  const handleConnectionsClick = () => {
    navigate("/linked-accounts");
  };
  
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

          {/* Connected Accounts Indicator */}
          <TooltipProvider>
            <div 
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors border border-slate-200"
              onClick={handleConnectionsClick}
              role="button"
              aria-label="View connected accounts"
            >
              {connectionsLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
              ) : (
                <>
                  {/* Facebook Icon */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <svg 
                          className={cn(
                            "w-4 h-4 transition-colors",
                            platformConnections?.facebook ? "text-blue-600" : "text-slate-300"
                          )} 
                          viewBox="0 0 24 24" 
                          fill="currentColor"
                        >
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        {platformConnections?.facebook && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{platformConnections?.facebook ? "Facebook connected" : "Facebook not connected"}</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Instagram Icon */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <svg 
                          className={cn(
                            "w-4 h-4 transition-colors",
                            platformConnections?.instagram ? "text-pink-600" : "text-slate-300"
                          )} 
                          viewBox="0 0 24 24" 
                          fill="currentColor"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        {platformConnections?.instagram && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{platformConnections?.instagram ? "Instagram connected" : "Instagram not connected"}</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
              
              {/* Connection status indicator */}
              {!connectionsLoading && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="ml-0.5">
                      <Link2 className={cn(
                        "w-3.5 h-3.5",
                        hasAnyConnection ? "text-green-600" : "text-amber-500"
                      )} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{hasAnyConnection ? "Click to manage connections" : "No accounts connected - click to connect"}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Make on-brand Button (when template is loaded) */}
            {showMakeOnBrand && onMakeOnBrand && (
              <Button
                onClick={onMakeOnBrand}
                disabled={isMakingOnBrand}
                variant="outline"
                size="sm"
                className="gap-2 border-lime-400 text-lime-700 hover:bg-lime-50"
              >
                {isMakingOnBrand ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Make on-brand
                  </>
                )}
              </Button>
            )}

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

