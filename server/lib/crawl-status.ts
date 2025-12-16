/**
 * Canonical Crawl Run Status Types
 * 
 * Single source of truth for crawler job statuses.
 * Used across server and client to ensure consistency.
 * 
 * DO NOT add new statuses without updating:
 * - Database constraint (crawl_runs table)
 * - Client polling logic
 * - Reaper logic
 */

export type CrawlRunStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Check if a status is terminal (job is done)
 */
export function isTerminalStatus(status: CrawlRunStatus): boolean {
  return status === 'completed' || status === 'failed';
}

/**
 * Validate status string
 */
export function isValidStatus(status: string): status is CrawlRunStatus {
  return ['pending', 'processing', 'completed', 'failed'].includes(status);
}

/**
 * Status transition validation
 */
export function canTransition(from: CrawlRunStatus, to: CrawlRunStatus): boolean {
  const validTransitions: Record<CrawlRunStatus, CrawlRunStatus[]> = {
    pending: ['processing', 'failed'],
    processing: ['completed', 'failed'],
    completed: [], // Terminal
    failed: [], // Terminal
  };
  
  return validTransitions[from]?.includes(to) ?? false;
}

/**
 * Status constants for use in code
 */
export const CrawlStatus = {
  PENDING: 'pending' as CrawlRunStatus,
  PROCESSING: 'processing' as CrawlRunStatus,
  COMPLETED: 'completed' as CrawlRunStatus,
  FAILED: 'failed' as CrawlRunStatus,
} as const;

