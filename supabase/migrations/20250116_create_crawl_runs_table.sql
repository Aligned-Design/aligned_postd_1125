-- Crawl Runs Table for Async Job Processing
-- Tracks crawler job status to prevent Vercel 504 timeouts

CREATE TABLE IF NOT EXISTS crawl_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  tenant_id UUID,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  progress TEXT, -- Optional progress message
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error TEXT,
  result JSONB, -- Stores brandKit when complete
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_crawl_runs_status ON crawl_runs(status);
CREATE INDEX idx_crawl_runs_brand_id ON crawl_runs(brand_id);
CREATE INDEX idx_crawl_runs_created_at ON crawl_runs(created_at DESC);

COMMENT ON TABLE crawl_runs IS 'Async crawler job tracking to prevent serverless timeouts';
COMMENT ON COLUMN crawl_runs.status IS 'Job status: pending, processing, completed, failed';
COMMENT ON COLUMN crawl_runs.result IS 'Full brandKit JSON when crawl completes';

