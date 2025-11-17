/**
 * PHASE 8 - Analytics Metrics Schema
 * Tables for storing analytics data from social platforms
 * Includes metrics, sync logs, goals, and advisor feedback
 */

-- Create analytics_metrics table for storing platform metrics
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL, -- instagram, facebook, linkedin, twitter, tiktok, pinterest, youtube, google_business
  post_id VARCHAR(255), -- Platform-specific post ID

  -- Metric data
  date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}', -- Contains reach, impressions, engagement, likes, comments, shares, clicks, followers, ctr, engagementRate
  metadata JSONB NOT NULL DEFAULT '{}', -- Contains postType, hashtags, contentCategory, etc.

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT unique_post_metric UNIQUE(brand_id, platform, post_id, date)
);

-- Create analytics_sync_logs table for audit trail
CREATE TABLE IF NOT EXISTS analytics_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL,

  -- Sync details
  sync_type VARCHAR(50) NOT NULL, -- 'incremental' or 'historical'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Error information
  error_message TEXT,
  error_details JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create analytics_goals table for goal tracking
CREATE TABLE IF NOT EXISTS analytics_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  tenant_id UUID NOT NULL,

  -- Goal definition
  metric VARCHAR(100) NOT NULL, -- 'engagement_rate', 'reach', 'followers', etc.
  target FLOAT NOT NULL,
  current FLOAT DEFAULT 0,

  -- Timeline
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, completed, failed, cancelled
  notes TEXT,

  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create advisor_feedback table for learning system
CREATE TABLE IF NOT EXISTS advisor_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  insight_id VARCHAR(255) NOT NULL,

  -- Feedback details
  category VARCHAR(100) NOT NULL, -- 'content', 'timing', 'platform', etc.
  type VARCHAR(100) NOT NULL, -- 'recommendation', 'observation', 'alert', etc.
  feedback VARCHAR(50) NOT NULL, -- 'accepted', 'rejected', 'implemented'

  -- Weight tracking for learning
  previous_weight FLOAT DEFAULT 1.0,
  new_weight FLOAT DEFAULT 1.0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create auto_plans table for generated content plans
CREATE TABLE IF NOT EXISTS auto_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  tenant_id UUID NOT NULL,

  -- Plan metadata
  month DATE NOT NULL, -- First day of the month for this plan
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Plan details
  plan_data JSONB NOT NULL DEFAULT '{}', -- Contains recommendations, topics, formats, posting_schedule
  confidence FLOAT DEFAULT 0.75, -- Based on data quality

  -- Generation info
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by UUID,

  -- Execution tracking
  published_count INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT unique_monthly_plan UNIQUE(brand_id, month)
);

-- Create indexes for performance
CREATE INDEX idx_analytics_metrics_brand_date ON analytics_metrics(brand_id, date DESC);
CREATE INDEX idx_analytics_metrics_platform ON analytics_metrics(brand_id, platform, date DESC);
CREATE INDEX idx_analytics_metrics_post_id ON analytics_metrics(platform, post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_analytics_metrics_date_range ON analytics_metrics(brand_id, platform, date) WHERE date >= CURRENT_DATE - INTERVAL '90 days';

CREATE INDEX idx_analytics_sync_logs_brand ON analytics_sync_logs(brand_id, created_at DESC);
CREATE INDEX idx_analytics_sync_logs_status ON analytics_sync_logs(status, platform, created_at DESC);
CREATE INDEX idx_analytics_sync_logs_incomplete ON analytics_sync_logs(status) WHERE status IN ('pending', 'in_progress');

CREATE INDEX idx_analytics_goals_brand ON analytics_goals(brand_id, deadline);
CREATE INDEX idx_analytics_goals_status ON analytics_goals(status) WHERE status IN ('active', 'completed');

CREATE INDEX idx_advisor_feedback_insight ON advisor_feedback(insight_id);
CREATE INDEX idx_advisor_feedback_category_type ON advisor_feedback(category, type, feedback);

CREATE INDEX idx_auto_plans_brand_month ON auto_plans(brand_id, month DESC);
CREATE INDEX idx_auto_plans_pending ON auto_plans(brand_id) WHERE approved = FALSE AND completed = FALSE;

-- Enable RLS on all tables
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_metrics
CREATE POLICY analytics_metrics_select_own_brand ON analytics_metrics
  FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY analytics_metrics_insert_own_brand ON analytics_metrics
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY analytics_metrics_update_own_brand ON analytics_metrics
  FOR UPDATE
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for analytics_sync_logs
CREATE POLICY analytics_sync_logs_select_own_brand ON analytics_sync_logs
  FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY analytics_sync_logs_insert_own_brand ON analytics_sync_logs
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for analytics_goals
CREATE POLICY analytics_goals_select_own_brand ON analytics_goals
  FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY analytics_goals_crud_own_brand ON analytics_goals
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for advisor_feedback
CREATE POLICY advisor_feedback_select_own_brand ON advisor_feedback
  FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY advisor_feedback_insert_own_brand ON advisor_feedback
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for auto_plans
CREATE POLICY auto_plans_select_own_brand ON auto_plans
  FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY auto_plans_crud_own_brand ON auto_plans
  FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Create trigger functions for timestamp updates
CREATE OR REPLACE FUNCTION update_analytics_metrics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analytics_metrics_update_timestamp
  BEFORE UPDATE ON analytics_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_metrics_timestamp();

CREATE OR REPLACE FUNCTION update_auto_plans_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_plans_update_timestamp
  BEFORE UPDATE ON auto_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_auto_plans_timestamp();

CREATE OR REPLACE FUNCTION update_analytics_goals_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analytics_goals_update_timestamp
  BEFORE UPDATE ON analytics_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_goals_timestamp();
