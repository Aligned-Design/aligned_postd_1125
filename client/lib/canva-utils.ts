/**
 * Canva Integration Utilities
 * 
 * Client-side utilities for Canva integration.
 * Canva integration uses the standard OAuth flow via /api/integrations.
 */

import { logError } from "./logger";

/**
 * Check if Canva integration is configured (client-side check)
 * 
 * Checks if the server has Canva OAuth credentials configured.
 */
export async function checkCanvaConfigured(brandId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/integrations?brandId=${brandId}`);
    if (!response.ok) return false;
    
    const data = await response.json();
    const canvaIntegration = data.integrations?.find(
      (i: { type: string; status: string }) => i.type === "canva" && i.status === "connected"
    );
    
    return !!canvaIntegration;
  } catch {
    return false;
  }
}

/**
 * Synchronous check for Canva configuration (uses cached status)
 * Returns false by default - use checkCanvaConfigured for accurate check.
 */
export function isCanvaConfigured(): boolean {
  // Check if we have a cached Canva connection status in sessionStorage
  const cachedStatus = sessionStorage.getItem("canva_connected");
  return cachedStatus === "true";
}

/**
 * Start Canva OAuth flow
 * 
 * Initiates the OAuth authorization process for Canva.
 */
export async function startCanvaAuth(brandId: string): Promise<{ authUrl: string }> {
  const response = await fetch("/api/integrations/oauth/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "canva", brandId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to start Canva authorization");
  }

  return response.json();
}

/**
 * Initiate Canva editor session (client-side)
 * 
 * Opens Canva editor with the brand's connected account.
 * If not connected, starts OAuth flow first.
 */
export async function initiateCanvaEditor(
  brandId: string,
  designId?: string,
  templateId?: string
): Promise<{ editorUrl: string; state: string }> {
  // Check if Canva is connected
  const isConnected = await checkCanvaConfigured(brandId);
  
  if (!isConnected) {
    // Start OAuth flow
    const { authUrl } = await startCanvaAuth(brandId);
    // Redirect to Canva OAuth
    window.location.href = authUrl;
    throw new Error("Redirecting to Canva authorization...");
  }

  // Build Canva editor URL with optional design/template parameters
  const params = new URLSearchParams();
  if (designId) params.append("designId", designId);
  if (templateId) params.append("templateId", templateId);
  params.append("brandId", brandId);

  // Generate state token for security
  const state = `canva_editor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem("canva_editor_state", state);

  // Canva Connect API editor URL
  const editorUrl = `https://www.canva.com/design/create?${params.toString()}`;

  return { editorUrl, state };
}

/**
 * Import design from Canva (client-side)
 * 
 * Imports a Canva design into the POSTD media library.
 */
export async function importCanvaDesign(
  brandId: string,
  designId: string
): Promise<{ assetId: string; url: string }> {
  // Check if Canva is connected
  const isConnected = await checkCanvaConfigured(brandId);
  
  if (!isConnected) {
    throw new Error("Canva not connected. Please connect Canva first.");
  }

  // Call backend to import the design
  const response = await fetch("/api/media/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brandId,
      source: "canva",
      sourceId: designId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    logError("[Canva] Failed to import design", new Error(error.message));
    throw new Error(error.message || "Failed to import Canva design");
  }

  const data = await response.json();
  return {
    assetId: data.asset?.id || data.assetId,
    url: data.asset?.url || data.url,
  };
}

/**
 * Disconnect Canva integration
 */
export async function disconnectCanva(brandId: string): Promise<void> {
  const response = await fetch(`/api/integrations?brandId=${brandId}`);
  if (!response.ok) return;
  
  const data = await response.json();
  const canvaIntegration = data.integrations?.find(
    (i: { type: string }) => i.type === "canva"
  );
  
  if (canvaIntegration) {
    await fetch(`/api/integrations/${canvaIntegration.id}`, {
      method: "DELETE",
    });
    sessionStorage.removeItem("canva_connected");
  }
}
