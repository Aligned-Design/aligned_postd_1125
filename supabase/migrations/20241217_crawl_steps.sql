-- Add step-based processing columns to crawl_runs
-- Enables multi-step pipeline: fetch → render → generate

-- Add new columns for step tracking
ALTER TABLE crawl_runs
ADD COLUMN IF NOT EXISTS step TEXT DEFAULT 'fetch' CHECK (step IN ('fetch', 'render', 'generate', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS step_attempt INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rendered_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS step_timings JSONB DEFAULT '{}';

-- Create index for efficient step-based queries
CREATE INDEX IF NOT EXISTS idx_crawl_runs_step ON crawl_runs(step, next_run_at) WHERE status = 'pending';

-- Create index for failed jobs by error code
CREATE INDEX IF NOT EXISTS idx_crawl_runs_error_code ON crawl_runs(error_code) WHERE status = 'failed';

-- Update existing rows to have step='fetch'
UPDATE crawl_runs 
SET step = 'fetch' 
WHERE step IS NULL AND status = 'pending';

COMMENT ON COLUMN crawl_runs.step IS 'Current processing step: fetch (HTTP), render (browser), generate (AI), completed, failed';
COMMENT ON COLUMN crawl_runs.step_attempt IS 'Retry counter for current step';
COMMENT ON COLUMN crawl_runs.next_run_at IS 'Earliest time to retry this step (for backoff)';
COMMENT ON COLUMN crawl_runs.raw_data IS 'Results from Step A: HTTP fetch + HTML parse';
COMMENT ON COLUMN crawl_runs.rendered_data IS 'Results from Step B: Playwright render (optional)';
COMMENT ON COLUMN crawl_runs.step_timings IS 'Timing data for each step: {fetch: 1200, render: 5400, generate: 8900}';

