/**
 * Review Queue Shared Types
 * Types for the agent review queue API responses
 * 
 * Note: BrandFidelityScore, LinterResult, and DocOutput are client-only types
 * For shared types, we use Record<string, unknown> to avoid circular dependencies
 * Agent configuration types are defined in @shared/agent-config
 */

/**
 * ReviewQueueItem - Item returned from /api/agents/review/queue/:brandId
 * This matches the actual structure returned by the backend
 */
export interface ReviewQueueItem {
  id?: string;
  log_id?: string; // Alternative ID field
  brand_id: string;
  agent: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>; // DocOutput | Record<string, unknown> - using Record to avoid client dependency
  bfs?: Record<string, unknown>; // BrandFidelityScore - using Record to avoid client dependency
  linter_results?: Record<string, unknown>; // LinterResult - using Record to avoid client dependency
  timestamp?: string;
  created_at?: string; // Alternative timestamp field
  error?: string;
}

/**
 * ReviewQueueResponse - Response from /api/agents/review/queue/:brandId
 */
export interface ReviewQueueResponse {
  items: ReviewQueueItem[];
  totalCount: number;
  pendingCount: number;
}

