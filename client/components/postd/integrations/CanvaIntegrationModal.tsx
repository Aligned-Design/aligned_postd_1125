/**
 * Canva Integration Modal
 * 
 * Placeholder modal for Canva integration actions.
 * Shows "coming soon" message or initiates Canva editor session when ready.
 */

import { X, ExternalLink, Info } from "lucide-react";
import { useState } from "react";
import { isCanvaConfigured } from "@/lib/canva-utils";

interface CanvaIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiateEditor?: () => void;
  onImportDesign?: () => void;
  mode?: "editor" | "import";
}

export function CanvaIntegrationModal({
  isOpen,
  onClose,
  onInitiateEditor,
  onImportDesign,
  mode = "editor",
}: CanvaIntegrationModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleInitiate = async () => {
    setIsLoading(true);
    try {
      // TODO: When Canva API is ready, call actual API
      // For now, just log and show placeholder
      console.log("[Canva] TODO: Connect Canva API");
      
      if (mode === "import" && onImportDesign) {
        onImportDesign();
      } else if (onInitiateEditor) {
        onInitiateEditor();
      } else {
        // Placeholder: show info message
        alert(mode === "import" 
          ? "Canva import coming soon! This will import a design from your Canva account."
          : "Canva integration coming soon! This will open the Canva editor.");
      }
    } catch (error) {
      console.error("[Canva] Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isConfigured = isCanvaConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[var(--radius-card)] shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {mode === "editor" ? "Design in Canva" : "Import from Canva"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {!isConfigured ? (
            <>
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Canva Integration Coming Soon</p>
                  <p>
                    The Canva integration is being set up. Once configured, you'll be able to:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Open designs in Canva's editor</li>
                    <li>Import designs directly to your library</li>
                    <li>Sync Canva assets with your brand</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-slate-600">
                {mode === "editor"
                  ? "Open your design in Canva's editor to make advanced edits, use templates, and access Canva's full design tools."
                  : "Import a design from your Canva account directly into your library."}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleInitiate}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-[var(--color-lime-500)] text-[var(--color-primary-dark)] font-semibold rounded-lg hover:bg-[var(--color-lime-400)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[var(--color-primary-dark)] border-t-transparent rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>{mode === "editor" ? "Open in Canva" : "Import Design"}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 border-2 border-[var(--color-primary)] bg-transparent text-[var(--color-primary)] font-semibold rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

