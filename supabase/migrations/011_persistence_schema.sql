-- Persistence Schema for Orchestration & Learning Loop
-- Tables for strategy briefs, content packages, brand history, and collaboration logs

-- Strategy Briefs Table
CREATE TABLE IF NOT EXISTS strategy_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  version TEXT NOT NULL,
  positioning JSONB NOT NULL,
  voice JSONB NOT NULL,
  visual JSONB NOT NULL,
  competitive JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_brand_id (brand_id),
  INDEX idx_created_at (created_at)
);

-- Content Packages Table
CREATE TABLE IF NOT EXISTS content_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  content_id TEXT NOT NULL UNIQUE,
  request_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  copy JSONB NOT NULL,
  design_context JSONB,
  collaboration_log JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  quality_score DECIMAL(3,1),
  requires_approval BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  INDEX idx_brand_id (brand_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Brand History Table
CREATE TABLE IF NOT EXISTS brand_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  agent TEXT NOT NULL,
  action TEXT NOT NULL,
  content_id TEXT,
  details JSONB,
  rationale TEXT,
  performance JSONB,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_brand_id (brand_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_tags (tags)
);

-- Brand Success Patterns Table
CREATE TABLE IF NOT EXISTS brand_success_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  pattern TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  avg_performance DECIMAL(4,2),
  examples TEXT[] NOT NULL DEFAULT '{}',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_brand_id (brand_id)
);

-- Collaboration Logs Table (Event Stream)
CREATE TABLE IF NOT EXISTS collaboration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  agent TEXT NOT NULL,
  action TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  content_id TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_cycle_id (cycle_id),
  INDEX idx_request_id (request_id),
  INDEX idx_brand_id (brand_id),
  INDEX idx_agent_action (agent, action),
  INDEX idx_timestamp (timestamp)
);

-- Performance Logs Table
CREATE TABLE IF NOT EXISTS performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  content_id TEXT,
  cycle_id TEXT,
  content_type TEXT,
  platform TEXT NOT NULL,
  engagement JSONB NOT NULL,
  reach INTEGER,
  impressions INTEGER,
  click_through_rate DECIMAL(5,2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_brand_id (brand_id),
  INDEX idx_platform (platform),
  INDEX idx_recorded_at (recorded_at)
);

-- Platform Insights Table
CREATE TABLE IF NOT EXISTS platform_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  top_visual_style TEXT,
  best_posting_time TEXT,
  topic_affinity TEXT[] NOT NULL DEFAULT '{}',
  avg_engagement DECIMAL(4,2),
  sample_size INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, platform),
  INDEX idx_brand_id (brand_id),
  INDEX idx_platform (platform)
);

-- Token Health Table
CREATE TABLE IF NOT EXISTS token_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  token_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'healthy',
  expires_at TIMESTAMP WITH TIME ZONE,
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, platform),
  INDEX idx_brand_id (brand_id),
  INDEX idx_status (status)
);

-- Weekly Summaries Table
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_cycles INTEGER DEFAULT 0,
  avg_quality_score DECIMAL(4,2),
  top_performers JSONB,
  success_patterns JSONB,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, week_start),
  INDEX idx_brand_id (brand_id),
  INDEX idx_week_start (week_start)
);

-- Advisor Review Audits Table
CREATE TABLE IF NOT EXISTS advisor_review_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id TEXT NOT NULL UNIQUE,
  request_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  clarity_score DECIMAL(3,1) NOT NULL,
  alignment_score DECIMAL(3,1) NOT NULL,
  resonance_score DECIMAL(3,1) NOT NULL,
  actionability_score DECIMAL(3,1) NOT NULL,
  platform_fit_score DECIMAL(3,1) NOT NULL,
  average_score DECIMAL(4,2) NOT NULL,
  weighted_score DECIMAL(4,2) NOT NULL,
  severity_level TEXT NOT NULL,
  reflection_question TEXT,
  suggested_actions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX idx_brand_id (brand_id),
  INDEX idx_cycle_id (cycle_id),
  INDEX idx_created_at (created_at)
);

-- Create views for common queries

-- View: Recent Content Quality Trends
CREATE OR REPLACE VIEW content_quality_trends AS
SELECT
  brand_id,
  DATE(created_at) as date,
  COUNT(*) as content_count,
  AVG(quality_score) as avg_quality,
  MAX(quality_score) as best_quality,
  MIN(quality_score) as worst_quality,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY quality_score) as median_quality
FROM content_packages
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY brand_id, DATE(created_at)
ORDER BY brand_id, date DESC;

-- View: Platform Performance Summary
CREATE OR REPLACE VIEW platform_performance_summary AS
SELECT
  brand_id,
  platform,
  COUNT(*) as total_posts,
  AVG(engagement -> 'likes' ? 'likes' :: INT) as avg_likes,
  AVG(engagement -> 'comments' ? 'comments' :: INT) as avg_comments,
  AVG(engagement -> 'shares' ? 'shares' :: INT) as avg_shares,
  AVG(reach) as avg_reach,
  AVG(click_through_rate) as avg_ctr
FROM performance_logs
WHERE recorded_at >= NOW() - INTERVAL '30 days'
GROUP BY brand_id, platform
ORDER BY brand_id, platform;

-- View: Brand History Patterns
CREATE OR REPLACE VIEW brand_history_patterns AS
SELECT
  brand_id,
  unnest(tags) as tag,
  COUNT(*) as frequency,
  MAX(timestamp) as last_seen,
  COUNT(CASE WHEN (performance -> 'improvement') ? 'improvement' THEN 1 END) as improved_count
FROM brand_history
WHERE timestamp >= NOW() - INTERVAL '90 days'
GROUP BY brand_id, unnest(tags)
ORDER BY brand_id, frequency DESC;

-- Grants for application user
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO authenticated;
