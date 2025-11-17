-- Platform Integrations Schema
-- Manages OAuth connections, multi-platform posting, reviews, and events

-- Platform connections table
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  account_username VARCHAR(255),
  account_id VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  status VARCHAR(20) DEFAULT 'connected',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, provider, account_id)
);

-- Social media posts table
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  connection_ids UUID[],
  title TEXT,
  caption TEXT,
  content_type VARCHAR(50),
  media_urls TEXT[],
  hashtags TEXT[],
  cta_text TEXT,
  cta_url TEXT,
  platform_specific_data JSONB DEFAULT '{}',
  schedule_for TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  published_urls JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS platform_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES platform_connections(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  external_review_id VARCHAR(255) NOT NULL,
  reviewer_name VARCHAR(255),
  reviewer_avatar_url TEXT,
  rating DECIMAL(2,1),
  review_text TEXT,
  review_date TIMESTAMPTZ,
  response_text TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),
  sentiment VARCHAR(20),
  status VARCHAR(20) DEFAULT 'unanswered',
  platform_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, provider, external_review_id)
);

-- Events table
CREATE TABLE IF NOT EXISTS platform_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  connection_ids UUID[],
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location_name VARCHAR(255),
  location_address TEXT,
  online_url TEXT,
  cover_image_url TEXT,
  rsvp_enabled BOOLEAN DEFAULT false,
  rsvp_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  published_urls JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Response templates for reviews
CREATE TABLE IF NOT EXISTS review_response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL,
  rating_range VARCHAR(20),
  template_text TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_platform_connections_brand ON platform_connections(brand_id);
CREATE INDEX idx_platform_connections_status ON platform_connections(status);
CREATE INDEX idx_social_posts_brand ON social_posts(brand_id);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_schedule ON social_posts(schedule_for);
CREATE INDEX idx_platform_reviews_brand ON platform_reviews(brand_id);
CREATE INDEX idx_platform_reviews_status ON platform_reviews(status);
CREATE INDEX idx_platform_reviews_rating ON platform_reviews(rating);
CREATE INDEX idx_platform_events_brand ON platform_events(brand_id);
CREATE INDEX idx_platform_events_start ON platform_events(start_time);

-- Row-Level Security (RLS)
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_response_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their brand's connections"
  ON platform_connections FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their brand's connections"
  ON platform_connections FOR ALL
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their brand's posts"
  ON social_posts FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their brand's posts"
  ON social_posts FOR ALL
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their brand's reviews"
  ON platform_reviews FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their brand's reviews"
  ON platform_reviews FOR ALL
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their brand's events"
  ON platform_events FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their brand's events"
  ON platform_events FOR ALL
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their brand's templates"
  ON review_response_templates FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their brand's templates"
  ON review_response_templates FOR ALL
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_platform_connections_updated_at BEFORE UPDATE ON platform_connections FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_platform_reviews_updated_at BEFORE UPDATE ON platform_reviews FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_platform_events_updated_at BEFORE UPDATE ON platform_events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_review_response_templates_updated_at BEFORE UPDATE ON review_response_templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
