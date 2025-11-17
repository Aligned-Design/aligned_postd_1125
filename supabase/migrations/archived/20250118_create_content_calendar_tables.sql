-- Content Calendar & Scheduling System
-- Phase 5 - Posting Quotas & Agent Orchestration

-- Add posting config to brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS posting_config JSONB DEFAULT '{
  "posting_frequency": "standard",
  "platforms_enabled": ["instagram", "linkedin"],
  "content_type_weighting": {},
  "approval_workflow": "manual",
  "publish_schedule": {},
  "ai_confidence_threshold": 0.8,
  "auto_generate_next_month": false
}'::jsonb;

-- Monthly content plans table (from Advisor Agent)
CREATE TABLE IF NOT EXISTS monthly_content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- YYYY-MM format
  total_pieces INTEGER NOT NULL,
  platforms JSONB NOT NULL, -- ContentMix[] array
  best_times JSONB NOT NULL, -- Array of {platform, day, slot, confidence}
  top_topics TEXT[],
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  UNIQUE(brand_id, month)
);

-- Scheduled content table (calendar entries)
CREATE TABLE IF NOT EXISTS scheduled_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  funnel_stage VARCHAR(10) NOT NULL, -- 'top' | 'mid' | 'bottom'
  headline TEXT,
  body TEXT NOT NULL,
  cta TEXT,
  hashtags TEXT[],
  media_urls TEXT[],
  scheduled_for TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft | pending_review | approved | rejected | scheduled | published | failed
  generation_log_id UUID REFERENCES generation_logs(id),
  bfs_score FLOAT,
  auto_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly summaries table (dashboard metrics)
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  posts_published INTEGER DEFAULT 0,
  posts_awaiting_approval INTEGER DEFAULT 0,
  new_insights INTEGER DEFAULT 0,
  reach_change_pct FLOAT DEFAULT 0,
  engagement_change_pct FLOAT DEFAULT 0,
  top_performer_id UUID REFERENCES scheduled_content(id),
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, week_start)
);

-- Performance metrics table (for adjustment rules)
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  posts_count INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  avg_engagement_rate FLOAT DEFAULT 0,
  follower_growth INTEGER DEFAULT 0,
  failed_posts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, platform, period_start, period_end)
);

-- Performance adjustments log (audit trail for auto-adjustments)
CREATE TABLE IF NOT EXISTS performance_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  condition VARCHAR(50) NOT NULL, -- 'engagement_up' | 'engagement_down' | etc.
  threshold_value FLOAT NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'increase_frequency' | 'decrease_frequency' | etc.
  adjustment_details JSONB NOT NULL,
  before_config JSONB NOT NULL,
  after_config JSONB NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for content calendar
CREATE INDEX idx_scheduled_content_brand_id ON scheduled_content(brand_id);
CREATE INDEX idx_scheduled_content_platform ON scheduled_content(platform);
CREATE INDEX idx_scheduled_content_status ON scheduled_content(status);
CREATE INDEX idx_scheduled_content_scheduled_for ON scheduled_content(scheduled_for);
CREATE INDEX idx_scheduled_content_funnel_stage ON scheduled_content(funnel_stage);

-- Indexes for monthly plans
CREATE INDEX idx_monthly_plans_brand_id ON monthly_content_plans(brand_id);
CREATE INDEX idx_monthly_plans_month ON monthly_content_plans(month);

-- Indexes for summaries
CREATE INDEX idx_weekly_summaries_brand_id ON weekly_summaries(brand_id);
CREATE INDEX idx_weekly_summaries_week_start ON weekly_summaries(week_start);

-- Indexes for metrics
CREATE INDEX idx_performance_metrics_brand_platform ON performance_metrics(brand_id, platform);
CREATE INDEX idx_performance_metrics_period ON performance_metrics(period_start, period_end);

-- RLS Policies
ALTER TABLE monthly_content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_adjustments ENABLE ROW LEVEL SECURITY;

-- Users can view content for their brands
CREATE POLICY "Users can view brand content plans"
  ON monthly_content_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = monthly_content_plans.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view scheduled content"
  ON scheduled_content
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = scheduled_content.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scheduled content"
  ON scheduled_content
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = scheduled_content.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view weekly summaries"
  ON weekly_summaries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = weekly_summaries.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view performance metrics"
  ON performance_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = performance_metrics.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view adjustments"
  ON performance_adjustments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = performance_adjustments.brand_id
      AND brand_members.user_id = auth.uid()
    )
  );

-- Service role can manage all tables
CREATE POLICY "Service role can manage content plans"
  ON monthly_content_plans
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage scheduled content"
  ON scheduled_content
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage summaries"
  ON weekly_summaries
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage metrics"
  ON performance_metrics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage adjustments"
  ON performance_adjustments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Triggers for updated_at
CREATE TRIGGER trigger_scheduled_content_updated_at
  BEFORE UPDATE ON scheduled_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to auto-publish approved content when scheduled time arrives
CREATE OR REPLACE FUNCTION auto_publish_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if content is approved and scheduled time has passed
  IF NEW.status = 'approved' AND NEW.scheduled_for <= NOW() THEN
    NEW.status = 'scheduled';
    -- Actual publishing happens via external worker/cron job
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_publish
  BEFORE UPDATE ON scheduled_content
  FOR EACH ROW
  EXECUTE FUNCTION auto_publish_content();

-- Function to calculate weekly summary metrics
CREATE OR REPLACE FUNCTION calculate_weekly_summary(
  p_brand_id UUID,
  p_week_start DATE,
  p_week_end DATE
)
RETURNS void AS $$
DECLARE
  v_posts_published INTEGER;
  v_posts_awaiting INTEGER;
  v_reach_change FLOAT;
  v_engagement_change FLOAT;
BEGIN
  -- Count published posts
  SELECT COUNT(*) INTO v_posts_published
  FROM scheduled_content
  WHERE brand_id = p_brand_id
    AND status = 'published'
    AND published_at >= p_week_start
    AND published_at < p_week_end + INTERVAL '1 day';

  -- Count awaiting approval
  SELECT COUNT(*) INTO v_posts_awaiting
  FROM scheduled_content
  WHERE brand_id = p_brand_id
    AND status = 'pending_review';

  -- Calculate reach/engagement changes (simplified - would use actual metrics)
  v_reach_change := 0.14; -- Placeholder
  v_engagement_change := 0.10; -- Placeholder

  -- Insert or update weekly summary
  INSERT INTO weekly_summaries (
    brand_id,
    week_start,
    week_end,
    posts_published,
    posts_awaiting_approval,
    reach_change_pct,
    engagement_change_pct
  ) VALUES (
    p_brand_id,
    p_week_start,
    p_week_end,
    v_posts_published,
    v_posts_awaiting,
    v_reach_change,
    v_engagement_change
  )
  ON CONFLICT (brand_id, week_start)
  DO UPDATE SET
    posts_published = EXCLUDED.posts_published,
    posts_awaiting_approval = EXCLUDED.posts_awaiting_approval,
    reach_change_pct = EXCLUDED.reach_change_pct,
    engagement_change_pct = EXCLUDED.engagement_change_pct;
END;
$$ LANGUAGE plpgsql;
