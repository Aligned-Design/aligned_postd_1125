-- AI Agent Safety & Configuration Tables
-- Phase 5 - Guardrails & Quality Gates

-- Add safety config to brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS safety_config JSONB DEFAULT '{
  "safety_mode": "safe",
  "banned_phrases": [],
  "competitor_names": [],
  "claims": [],
  "required_disclaimers": [],
  "required_hashtags": [],
  "brand_links": [],
  "disallowed_topics": ["politics", "religion", "medical advice"],
  "allow_topics": [],
  "compliance_pack": "none",
  "platform_limits_override": {}
}'::jsonb;

-- Generation logs table (audit trail for all AI generations)
CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  agent VARCHAR(20) NOT NULL, -- 'doc' | 'design' | 'advisor'
  prompt_version VARCHAR(10) NOT NULL, -- 'v1.0', 'v1.1', etc.
  safety_mode VARCHAR(20) NOT NULL,
  input JSONB NOT NULL,
  output JSONB,
  bfs_score FLOAT, -- Brand Fidelity Score (0-1)
  bfs_details JSONB, -- Full BFS breakdown
  linter_results JSONB, -- Linter check results
  approved BOOLEAN DEFAULT FALSE,
  reviewer_id UUID REFERENCES auth.users(id),
  revision INTEGER DEFAULT 1,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for generation logs
CREATE INDEX idx_generation_logs_brand_id ON generation_logs(brand_id);
CREATE INDEX idx_generation_logs_agent ON generation_logs(agent);
CREATE INDEX idx_generation_logs_approved ON generation_logs(approved);
CREATE INDEX idx_generation_logs_created_at ON generation_logs(created_at DESC);
CREATE INDEX idx_generation_logs_bfs_score ON generation_logs(bfs_score);

-- Prompt templates table (versioned prompts)
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent VARCHAR(20) NOT NULL, -- 'doc' | 'design' | 'advisor'
  version VARCHAR(10) NOT NULL, -- 'v1.0', 'v1.1', etc.
  locale VARCHAR(5) NOT NULL DEFAULT 'en',
  template TEXT NOT NULL,
  variables TEXT[], -- List of {{variable}} names
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent, version, locale)
);

-- Agent collaboration cache (24h cache for Advisor output)
CREATE TABLE IF NOT EXISTS agent_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  cache_key VARCHAR(255) NOT NULL,
  cache_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  UNIQUE(brand_id, cache_key)
);

-- Index for cache lookups
CREATE INDEX idx_agent_cache_brand_key ON agent_cache(brand_id, cache_key);
CREATE INDEX idx_agent_cache_valid_until ON agent_cache(valid_until);

-- Content review queue (human-in-the-loop)
CREATE TABLE IF NOT EXISTS content_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  generation_log_id UUID REFERENCES generation_logs(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'needs_revision'
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_notes TEXT,
  flagged_reason TEXT, -- Why it was flagged for review
  priority VARCHAR(10) DEFAULT 'normal', -- 'low' | 'normal' | 'high'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Indexes for review queue
CREATE INDEX idx_review_queue_brand_id ON content_review_queue(brand_id);
CREATE INDEX idx_review_queue_status ON content_review_queue(status);
CREATE INDEX idx_review_queue_priority ON content_review_queue(priority, created_at);

-- RLS Policies
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_review_queue ENABLE ROW LEVEL SECURITY;

-- Users can view generation logs for their brands
CREATE POLICY "Users can view brand generation logs"
  ON generation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = generation_logs.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- Service role can insert/update logs (from API)
CREATE POLICY "Service role can manage logs"
  ON generation_logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Anyone can read active prompt templates (read-only)
CREATE POLICY "Anyone can read active prompts"
  ON prompt_templates
  FOR SELECT
  USING (active = true);

-- Only service role can manage prompts
CREATE POLICY "Service role can manage prompts"
  ON prompt_templates
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view cache for their brands
CREATE POLICY "Users can view brand cache"
  ON agent_cache
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = agent_cache.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- Service role can manage cache
CREATE POLICY "Service role can manage cache"
  ON agent_cache
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view review queue for their brands
CREATE POLICY "Users can view brand review queue"
  ON content_review_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = content_review_queue.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- Users can update review status (approve/reject)
CREATE POLICY "Users can update review status"
  ON content_review_queue
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = content_review_queue.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- Service role can insert into review queue
CREATE POLICY "Service role can insert reviews"
  ON content_review_queue
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Function to auto-cleanup expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM agent_cache
  WHERE valid_until < NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to cleanup cache on insert
CREATE TRIGGER trigger_cleanup_expired_cache
  AFTER INSERT ON agent_cache
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_expired_cache();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_generation_logs_updated_at
  BEFORE UPDATE ON generation_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_prompt_templates_updated_at
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert initial prompt templates (v1.0)
INSERT INTO prompt_templates (agent, version, locale, template, variables, active)
VALUES
  ('doc', 'v1.0', 'en', 'See prompts/doc/en/v1.0.md', ARRAY['brand_name', 'brand_id', 'safety_mode', 'banned_phrases', 'competitor_names', 'claims', 'required_disclaimers', 'required_hashtags', 'brand_links', 'disallowed_topics', 'tone_keywords', 'brand_personality', 'writing_style', 'common_phrases'], TRUE),
  ('design', 'v1.0', 'en', 'See prompts/design/en/v1.0.md', ARRAY['brand_name', 'brand_id', 'primary_color', 'secondary_color', 'accent_color', 'font_family', 'font_weights', 'imagery_style'], TRUE),
  ('advisor', 'v1.0', 'en', 'See prompts/advisor/en/v1.0.md', ARRAY['brand_name', 'brand_id'], TRUE)
ON CONFLICT (agent, version, locale) DO NOTHING;
