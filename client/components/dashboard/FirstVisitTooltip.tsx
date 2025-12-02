import { useMemo } from "react";
import { X } from "lucide-react";
import { PAGE_TIPS } from "@/types/help";
import { useHelpState } from "@/hooks/useHelpState";
import type { PageKey } from "@/types/help";

interface FirstVisitTooltipProps {
  page: PageKey;
  children?: React.ReactNode;
}

export function FirstVisitTooltip({ page, children }: FirstVisitTooltipProps) {
  const { isTipDismissed, dismissTip } = useHelpState();

  // Use useMemo instead of useState + useEffect to avoid setState in effect
  const isVisible = useMemo(() => {
    // Check if tooltip has been dismissed for this page in this workspace
    return !isTipDismissed(page);
  }, [page, isTipDismissed]);

  const tip = PAGE_TIPS[page];

  const handleDismiss = () => {
    dismissTip(page);
  };

  const placementClasses = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2",
  };

  return (
    <div className="relative">
      {children}
      {isVisible && tip && (
        <div
          className={`fixed ${placementClasses[tip.placement]} max-w-xs bg-white rounded-xl shadow-2xl border border-indigo-200 p-4 z-40 animate-[slideDown_300ms_ease-out] motion-reduce:animate-none`}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Dismiss tooltip"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>

          <h3 className="text-sm font-black text-slate-900 mb-1 pr-6">
            {tip.title}
          </h3>
          <p className="text-xs text-slate-600 mb-3">{tip.description}</p>

          <button
            onClick={handleDismiss}
            className="w-full px-3 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );
}
