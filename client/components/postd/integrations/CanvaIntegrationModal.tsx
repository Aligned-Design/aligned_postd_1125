/**
 * Canva Integration Modal
 * 
 * Modal for Canva integration actions.
 * Handles OAuth connection and design import/editor functionality.
 */

import { X, ExternalLink, Info, Link2 } from "lucide-react";
import { useState, useEffect } from "react";
import { 
  isCanvaConfigured, 
  checkCanvaConfigured, 
  startCanvaAuth, 
  initiateCanvaEditor, 
  importCanvaDesign 
} from "@/lib/canva-utils";
import { logError, logInfo } from "@/lib/logger";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { useToast } from "@/hooks/use-toast";

interface CanvaIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiateEditor?: () => void;
  onImportDesign?: (assetId: string, url: string) => void;
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
  const [isConnected, setIsConnected] = useState(isCanvaConfigured());
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [designIdInput, setDesignIdInput] = useState("");
  const { brandId } = useCurrentBrand();
  const { toast } = useToast();

  // Check connection status on mount
  useEffect(() => {
    if (isOpen && brandId) {
      setIsCheckingConnection(true);
      checkCanvaConfigured(brandId)
        .then((connected) => {
          setIsConnected(connected);
          if (connected) {
            sessionStorage.setItem("canva_connected", "true");
          }
        })
        .catch(() => setIsConnected(false))
        .finally(() => setIsCheckingConnection(false));
    }
  }, [isOpen, brandId]);

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!brandId) {
      toast({
        title: "Error",
        description: "No brand selected. Please select a brand first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      logInfo("[Canva] Starting OAuth flow", { brandId });
      const { authUrl } = await startCanvaAuth(brandId);
      window.location.href = authUrl;
    } catch (error) {
      logError("[Canva] Failed to start OAuth", error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Canva. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditor = async () => {
    if (!brandId) return;

    setIsLoading(true);
    try {
      logInfo("[Canva] Opening editor", { brandId });
      const { editorUrl } = await initiateCanvaEditor(brandId);
      
      // Open Canva in a new tab
      window.open(editorUrl, "_blank", "noopener,noreferrer");
      
      toast({
        title: "Canva Opened",
        description: "Canva editor opened in a new tab.",
      });
      
      onInitiateEditor?.();
      onClose();
    } catch (error) {
      logError("[Canva] Failed to open editor", error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "Error",
        description: "Failed to open Canva editor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!brandId || !designIdInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Canva design ID.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      logInfo("[Canva] Importing design", { brandId, designId: designIdInput });
      const { assetId, url } = await importCanvaDesign(brandId, designIdInput.trim());
      
      toast({
        title: "Import Successful",
        description: "Design imported to your library.",
      });
      
      onImportDesign?.(assetId, url);
      onClose();
    } catch (error) {
      logError("[Canva] Failed to import design", error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "Import Failed",
        description: "Failed to import design. Please check the design ID and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          {isCheckingConnection ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-slate-600">Checking connection...</span>
            </div>
          ) : !isConnected ? (
            <>
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Connect Your Canva Account</p>
                  <p>
                    Connect your Canva account to access powerful design features:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Open designs in Canva's editor</li>
                    <li>Import designs directly to your library</li>
                    <li>Sync Canva assets with your brand</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>Connect Canva Account</span>
                  </>
                )}
              </button>
            </>
          ) : mode === "editor" ? (
            <>
              <p className="text-slate-600">
                Open your design in Canva's editor to make advanced edits, use templates, and access Canva's full design tools.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleOpenEditor}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-[var(--color-lime-500)] text-[var(--color-primary-dark)] font-semibold rounded-lg hover:bg-[var(--color-lime-400)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[var(--color-primary-dark)] border-t-transparent rounded-full animate-spin" />
                      <span>Opening...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Open in Canva</span>
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
          ) : (
            <>
              <p className="text-slate-600">
                Import a design from your Canva account directly into your library.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Canva Design ID
                </label>
                <input
                  type="text"
                  value={designIdInput}
                  onChange={(e) => setDesignIdInput(e.target.value)}
                  placeholder="e.g., DAF1234567890"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Find the design ID in your Canva design URL
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={isLoading || !designIdInput.trim()}
                  className="flex-1 px-4 py-3 bg-[var(--color-lime-500)] text-[var(--color-primary-dark)] font-semibold rounded-lg hover:bg-[var(--color-lime-400)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[var(--color-primary-dark)] border-t-transparent rounded-full animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Import Design</span>
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
