import { useState, useEffect } from "react";
import { X, Search, RotateCcw, Keyboard, Mail } from "lucide-react";
import { PAGE_TIPS, GUIDED_TOUR_STEPS } from "@/types/help";
import type { PageKey } from "@/types/help";
import { useHelpState } from "@/hooks/useHelpState";

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: PageKey;
  onReplayTour: () => void;
}

export function HelpDrawer({
  isOpen,
  onClose,
  currentPage = "dashboard",
  onReplayTour,
}: HelpDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("tips");
  const { resetTour } = useHelpState();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pageTip = currentPage ? PAGE_TIPS[currentPage] : null;

  // Search all available content
  const searchResults = (() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: Array<{
      type: "tip" | "tutorial" | "shortcut";
      title: string;
      description: string;
      page?: PageKey;
    }> = [];

    // Search page tips
    Object.values(PAGE_TIPS).forEach((tip) => {
      if (
        tip.title.toLowerCase().includes(query) ||
        tip.description.toLowerCase().includes(query)
      ) {
        results.push({
          type: "tip",
          title: tip.title,
          description: tip.description,
          page: tip.page,
        });
      }
    });

    // Search tour steps
    GUIDED_TOUR_STEPS.forEach((step) => {
      if (
        step.title.toLowerCase().includes(query) ||
        step.description.toLowerCase().includes(query)
      ) {
        results.push({
          type: "tutorial",
          title: `${step.emoji} ${step.title}`,
          description: step.description,
        });
      }
    });

    return results;
  })();

  const handleTourReplay = () => {
    resetTour();
    onReplayTour();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 transition-opacity duration-200"
      onClick={onClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Drawer */}
      <div
        className="absolute right-0 top-0 h-screen w-full sm:w-96 bg-white shadow-2xl flex flex-col animate-[slideDown_300ms_ease-out] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-200 p-4 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50">
          <h2 className="text-lg font-black text-slate-900">Help & Support</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            aria-label="Close help drawer"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {searchQuery ? (
            // Search Results
            <div className="p-4 space-y-3">
              {searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500 font-medium">
                    No results found for "{searchQuery}"
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase text-slate-500 mb-3">
                    Search Results ({searchResults.length})
                  </p>
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
                    >
                      <h4 className="text-sm font-bold text-slate-900 mb-1">
                        {result.title}
                      </h4>
                      <p className="text-xs text-slate-600">{result.description}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <>
              {/* This Page Tips */}
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 flex items-center gap-2">
                  <span>This Page Tips</span>
                </h3>
                {pageTip ? (
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="text-sm font-bold text-indigo-900 mb-1">
                      {pageTip.title}
                    </h4>
                    <p className="text-xs text-indigo-800">{pageTip.description}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No tips for this page</p>
                )}
              </div>

              {/* Mini Tutorials */}
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">
                  Guided Tour
                </h3>
                <div className="space-y-2">
                  {GUIDED_TOUR_STEPS.map((step) => (
                    <div
                      key={step.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                    >
                      <div className="font-bold text-slate-900 mb-1">
                        {step.emoji} {step.title}
                      </div>
                      <p className="text-slate-600 text-xs">{step.description}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                  <span className="font-bold">Coming Soon:</span> Interactive GIFs
                </div>
              </div>

              {/* Shortcuts */}
              <div className="p-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleTourReplay}
                    className="w-full flex items-center gap-3 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors text-left"
                  >
                    <RotateCcw className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-indigo-900">
                        Replay Guided Tour
                      </div>
                      <div className="text-xs text-indigo-700">Start the tour again</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      alert("Keyboard shortcuts coming soon!");
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors text-left"
                  >
                    <Keyboard className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900">
                        Keyboard Shortcuts
                      </div>
                      <div className="text-xs text-slate-600">
                        Ctrl/Cmd + ?
                      </div>
                    </div>
                  </button>

                  <a
                    href="mailto:support@aligned.ai"
                    className="w-full flex items-center gap-3 p-3 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors text-left"
                  >
                    <Mail className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900">
                        Contact Support
                      </div>
                      <div className="text-xs text-slate-600">
                        Get help from our team
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
