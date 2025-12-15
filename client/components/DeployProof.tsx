/**
 * Deploy Proof Marker
 * 
 * Displays build metadata in the UI to verify deployed code version.
 * Renders in bottom-right corner, subtle but visible.
 * 
 * This component survives minification and proves the exact build deployed.
 * 
 * Uses environment variables instead of importing generated files to avoid
 * TypeScript compile-time errors in Vercel builds.
 */

import { useState } from "react";

// Read build metadata from environment variables (set by build process)
const buildMeta = {
  gitSha: import.meta.env.VITE_GIT_SHA ?? "unknown",
  gitShortSha: import.meta.env.VITE_GIT_SHORT_SHA ?? "unknown",
  buildTime: import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString(),
  buildId: import.meta.env.VITE_BUILD_ID ?? "dev",
};

export function DeployProof() {
  const [expanded, setExpanded] = useState(false);

  // Format build time
  const buildDate = new Date(buildMeta.buildTime);
  const buildTimeShort = buildDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Proof string (visible in DOM)
  const proofString = `${buildMeta.gitShortSha}-${buildMeta.buildId}`;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "8px",
        right: "8px",
        fontSize: "10px",
        fontFamily: "monospace",
        color: "#666",
        background: expanded ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.7)",
        padding: expanded ? "8px 12px" : "4px 8px",
        borderRadius: "4px",
        border: "1px solid #e0e0e0",
        zIndex: 9999,
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: expanded ? "0 2px 8px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.05)",
        userSelect: "text",
      }}
      onClick={() => setExpanded(!expanded)}
      title="Click to expand build details"
      data-deploy-proof={proofString}
    >
      {expanded ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#333" }}>
            🔍 DEPLOY_PROOF
          </div>
          <div>
            <strong>SHA:</strong> {buildMeta.gitShortSha}
          </div>
          <div>
            <strong>Build:</strong> {buildTimeShort}
          </div>
          <div>
            <strong>ID:</strong> {buildMeta.buildId}
          </div>
          <div style={{ fontSize: "9px", color: "#999", marginTop: "4px" }}>
            Full: {buildMeta.gitSha.substring(0, 16)}...
          </div>
        </div>
      ) : (
        <div>
          <span style={{ opacity: 0.6 }}>🔍</span> {proofString}
        </div>
      )}
    </div>
  );
}

/**
 * Minimalist version (always collapsed)
 * Use this if you want it even more subtle
 */
export function DeployProofMinimal() {
  // Read build metadata from environment variables
  const buildMeta = {
    gitShortSha: import.meta.env.VITE_GIT_SHORT_SHA ?? "unknown",
    buildTime: import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString(),
    buildId: import.meta.env.VITE_BUILD_ID ?? "dev",
  };
  
  const proofString = `${buildMeta.gitShortSha}-${buildMeta.buildId}`;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "4px",
        right: "4px",
        fontSize: "9px",
        fontFamily: "monospace",
        color: "#999",
        opacity: 0.5,
        padding: "2px 6px",
        background: "rgba(255, 255, 255, 0.5)",
        borderRadius: "3px",
        zIndex: 9999,
        userSelect: "text",
      }}
      data-deploy-proof={proofString}
      title={`Build: ${buildMeta.buildTime}`}
    >
      {proofString}
    </div>
  );
}

