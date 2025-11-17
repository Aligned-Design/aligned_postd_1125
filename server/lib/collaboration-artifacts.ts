/**
 * Collaboration Artifacts
 *
 * NOTE: Types have been moved to @shared/collaboration-artifacts
 * Re-exported here for backward compatibility with server code
 */

// Re-export all types and functions from shared
export type {
  StrategyBrief,
  ContentPackage,
  BrandHistory,
  BrandHistoryEntry,
  PerformanceLog,
  PerformanceMetrics,
  ContentPerformance,
  CollaborationContext,
} from "@shared/collaboration-artifacts";

export {
  createStrategyBrief,
  createContentPackage,
  createBrandHistory,
  createPerformanceLog,
  createCollaborationContext,
  addBrandHistoryEntry,
} from "@shared/collaboration-artifacts";
