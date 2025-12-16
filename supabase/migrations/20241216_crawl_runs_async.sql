-- ============================================================================
-- CRAWL RUNS TABLE - Async Job Processing
-- ============================================================================
-- Purpose: Track crawler jobs outside HTTP request lifecycle
-- Fixes: Vercel 504 timeout on /api/crawl/start
-- Created: 2024-12-16

CREATE TABLE IF NOT EXISTS crawl_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  brand_id TEXT NOT NULL,  -- Can be temporary (brand_123) or UUID
  tenant_id UUID,          -- Required for persistence
  url TEXT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'
  progress INTEGER NOT NULL DEFAULT 0,     -- 0-100
  
  -- Timing
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Results
  brand_kit JSONB,           -- Final brand kit result
  error_message TEXT,        -- If status='failed'
  error_code TEXT,
  
  -- Metadata
  crawl_options JSONB,       -- Original request options (cache_mode, etc.)
  runtime_info JSONB,        -- Runtime fingerprint, duration, pages crawled
  
  -- Indexes for efficient queries
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Indexes for fast lookups
CREATE INDEX idx_crawl_runs_status ON crawl_runs(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_crawl_runs_brand ON crawl_runs(brand_id);
CREATE INDEX idx_crawl_runs_created ON crawl_runs(created_at DESC);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_crawl_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crawl_runs_updated_at
BEFORE UPDATE ON crawl_runs
FOR EACH ROW
EXECUTE FUNCTION update_crawl_runs_updated_at();

-- Comment
COMMENT ON TABLE crawl_runs IS 'Async crawler job queue - moves long-running crawls out of HTTP request lifecycle';

