/**
 * Canonical Crawl Error Codes
 * 
 * Clear, actionable error codes for crawl failures.
 * Each code should have a clear user-facing message.
 */

export const CrawlErrorCode = {
  // Step A: Fetch errors
  FETCH_FAILED: 'FETCH_FAILED',
  FETCH_TIMEOUT: 'FETCH_TIMEOUT',
  FETCH_BLOCKED: 'FETCH_BLOCKED',
  FETCH_INVALID_URL: 'FETCH_INVALID_URL',
  
  // Step B: Render errors
  RENDER_TIMEOUT: 'RENDER_TIMEOUT',
  RENDER_BLOCKED: 'RENDER_BLOCKED',
  RENDER_CRASH: 'RENDER_CRASH',
  
  // Step C: AI errors
  AI_TIMEOUT: 'AI_TIMEOUT',
  AI_EMPTY: 'AI_EMPTY',
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',
  AI_INVALID_RESPONSE: 'AI_INVALID_RESPONSE',
  
  // System errors
  RATE_LIMITED: 'RATE_LIMITED',
  STALE_JOB_TIMEOUT: 'STALE_JOB_TIMEOUT',
  DB_WRITE_FAILED: 'DB_WRITE_FAILED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type CrawlErrorCodeType = typeof CrawlErrorCode[keyof typeof CrawlErrorCode];

/**
 * Get user-friendly error message for error code
 */
export function getErrorMessage(code: CrawlErrorCodeType): string {
  const messages: Record<CrawlErrorCodeType, string> = {
    [CrawlErrorCode.FETCH_FAILED]: 'Failed to load website',
    [CrawlErrorCode.FETCH_TIMEOUT]: 'Website took too long to respond',
    [CrawlErrorCode.FETCH_BLOCKED]: 'Website blocked our request',
    [CrawlErrorCode.FETCH_INVALID_URL]: 'Invalid website URL',
    
    [CrawlErrorCode.RENDER_TIMEOUT]: 'Website rendering timed out',
    [CrawlErrorCode.RENDER_BLOCKED]: 'Website blocked browser access',
    [CrawlErrorCode.RENDER_CRASH]: 'Browser crashed while loading website',
    
    [CrawlErrorCode.AI_TIMEOUT]: 'AI processing took too long',
    [CrawlErrorCode.AI_EMPTY]: 'AI failed to generate brand kit',
    [CrawlErrorCode.AI_RATE_LIMIT]: 'AI service rate limit reached',
    [CrawlErrorCode.AI_INVALID_RESPONSE]: 'AI returned invalid response',
    
    [CrawlErrorCode.RATE_LIMITED]: 'Too many requests, please try again later',
    [CrawlErrorCode.STALE_JOB_TIMEOUT]: 'Job timed out',
    [CrawlErrorCode.DB_WRITE_FAILED]: 'Database write failed',
    [CrawlErrorCode.UNKNOWN_ERROR]: 'Unknown error occurred',
  };
  
  return messages[code] || messages[CrawlErrorCode.UNKNOWN_ERROR];
}

/**
 * Check if error code is retryable
 */
export function isRetryable(code: CrawlErrorCodeType): boolean {
  const retryable = new Set<CrawlErrorCodeType>([
    CrawlErrorCode.FETCH_TIMEOUT,
    CrawlErrorCode.RENDER_TIMEOUT,
    CrawlErrorCode.AI_TIMEOUT,
    CrawlErrorCode.RATE_LIMITED,
    CrawlErrorCode.DB_WRITE_FAILED,
  ]);
  
  return retryable.has(code);
}

