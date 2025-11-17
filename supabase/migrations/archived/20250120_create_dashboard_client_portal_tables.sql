-- Dashboard & Client Portal Schema
-- Enhanced dashboard analytics and client portal features

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'strategy_manager', 'brand_manager', 'approver', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, brand_id)
);

-- Dashboard metrics (cached analytics)
CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  reach BIGINT DEFAULT 0,
  engagement BIGINT DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  posts_published INTEGER DEFAULT 0,
  followers_gained INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  platform_breakdown JSONB DEFAULT '{}',
  top_posts JSONB DEFAULT '[]',
  advisor_insights JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, metric_date)
);

-- Client portal settings
CREATE TABLE IF NOT EXISTS client_portal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN DEFAULT true,
  logo_url TEXT,
  header_image_url TEXT,
  accent_color VARCHAR(7),
  custom_domain VARCHAR(255),
  modules_enabled TEXT[] DEFAULT ARRAY['analytics', 'approvals', 'reviews', 'events', 'uploads', 'messages'],
  default_date_range INTEGER DEFAULT 28,
  allow_share_links BOOLEAN DEFAULT true,
  footer_text TEXT,
  support_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Shareable analytics links
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255),
  scope JSONB DEFAULT '{}',
  date_range_days INTEGER DEFAULT 28,
  expires_at TIMESTAMPTZ,
  passcode_hash TEXT,
  allow_download BOOLEAN DEFAULT false,
  watermark_logo BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client uploads
CREATE TABLE IF NOT EXISTS client_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  file_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  tags TEXT[],
  notes TEXT,
  campaign VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content version history
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  caption TEXT,
  media_urls TEXT[],
  hashtags TEXT[],
  changes_summary TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, version_number)
);

-- Client messages and updates
CREATE TABLE IF NOT EXISTS client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  message_type VARCHAR(50) CHECK (message_type IN ('update', 'comment', 'notification')),
  title VARCHAR(255),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  from_user_id UUID REFERENCES auth.users(id),
  to_user_id UUID REFERENCES auth.users(id),
  read_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Approval comments
CREATE TABLE IF NOT EXISTS approval_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comment_text TEXT NOT NULL,
  comment_type VARCHAR(50) CHECK (comment_type IN ('feedback', 'approval', 'rejection', 'mention')),
  mentions UUID[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Share link access log
CREATE TABLE IF NOT EXISTS share_link_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT
);

-- Indexes
CREATE INDEX idx_user_roles_user_brand ON user_roles(user_id, brand_id);
CREATE INDEX idx_user_roles_brand ON user_roles(brand_id);
CREATE INDEX idx_dashboard_metrics_brand_date ON dashboard_metrics(brand_id, metric_date DESC);
CREATE INDEX idx_client_portal_brand ON client_portal_settings(brand_id);
CREATE INDEX idx_share_links_brand ON share_links(brand_id);
CREATE INDEX idx_share_links_token ON share_links(token) WHERE revoked_at IS NULL;
CREATE INDEX idx_client_uploads_brand ON client_uploads(brand_id);
CREATE INDEX idx_client_uploads_status ON client_uploads(status);
CREATE INDEX idx_content_versions_post ON content_versions(post_id, version_number DESC);
CREATE INDEX idx_client_messages_brand ON client_messages(brand_id, created_at DESC);
CREATE INDEX idx_approval_comments_post ON approval_comments(post_id, created_at DESC);

-- Row-Level Security (RLS)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_link_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User Roles
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Dashboard Metrics
CREATE POLICY "Users can view metrics for their brands"
  ON dashboard_metrics FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT brand_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage metrics"
  ON dashboard_metrics FOR ALL
  TO authenticated
  USING (true);

-- Client Portal Settings
CREATE POLICY "Users can view portal settings for their brands"
  ON client_portal_settings FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT brand_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage portal settings"
  ON client_portal_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND brand_id = client_portal_settings.brand_id
        AND role IN ('admin', 'strategy_manager')
    )
  );

-- Share Links
CREATE POLICY "Users can view share links for their brands"
  ON share_links FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT brand_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create share links"
  ON share_links FOR INSERT
  TO authenticated
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'strategy_manager', 'brand_manager')
    )
  );

CREATE POLICY "Users can manage their share links"
  ON share_links FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their share links"
  ON share_links FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Client Uploads
CREATE POLICY "Users can view uploads for their brands"
  ON client_uploads FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT brand_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files"
  ON client_uploads FOR INSERT
  TO authenticated
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their uploads"
  ON client_uploads FOR UPDATE
  TO authenticated
  USING (
    brand_id IN (
      SELECT brand_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Content Versions
CREATE POLICY "Users can view versions for their brand posts"
  ON content_versions FOR SELECT
  TO authenticated
  USING (
    post_id IN (
      SELECT id FROM social_posts
      WHERE brand_id IN (
        SELECT brand_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can create versions"
  ON content_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Client Messages
CREATE POLICY "Users can view messages for their brands"
  ON client_messages FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT brand_id FROM user_roles WHERE user_id = auth.uid()
    )
    OR to_user_id = auth.uid()
    OR from_user_id = auth.uid()
  );

CREATE POLICY "Users can send messages"
  ON client_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    brand_id IN (
      SELECT brand_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON client_messages FOR UPDATE
  TO authenticated
  USING (to_user_id = auth.uid());

-- Approval Comments
CREATE POLICY "Users can view comments on their brand posts"
  ON approval_comments FOR SELECT
  TO authenticated
  USING (
    post_id IN (
      SELECT id FROM social_posts
      WHERE brand_id IN (
        SELECT brand_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can comment on posts"
  ON approval_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    post_id IN (
      SELECT id FROM social_posts
      WHERE brand_id IN (
        SELECT brand_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  );

-- Share Link Access Log (admin only)
CREATE POLICY "Admins can view access logs"
  ON share_link_access_log FOR SELECT
  TO authenticated
  USING (
    share_link_id IN (
      SELECT id FROM share_links
      WHERE brand_id IN (
        SELECT brand_id FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "System can log access"
  ON share_link_access_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Triggers
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_dashboard_metrics_updated_at BEFORE UPDATE ON dashboard_metrics FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_client_portal_settings_updated_at BEFORE UPDATE ON client_portal_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_share_links_updated_at BEFORE UPDATE ON share_links FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_client_uploads_updated_at BEFORE UPDATE ON client_uploads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Functions

-- Get user role for a brand
CREATE OR REPLACE FUNCTION get_user_role(p_brand_id UUID)
RETURNS VARCHAR AS $$
  SELECT role FROM user_roles
  WHERE user_id = auth.uid() AND brand_id = p_brand_id
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user has permission
CREATE OR REPLACE FUNCTION has_permission(p_brand_id UUID, p_required_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND brand_id = p_brand_id
      AND role = ANY(p_required_roles)
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Increment share link view count
CREATE OR REPLACE FUNCTION increment_share_link_views(p_token VARCHAR)
RETURNS VOID AS $$
  UPDATE share_links
  SET view_count = view_count + 1,
      last_accessed_at = now()
  WHERE token = p_token AND revoked_at IS NULL;
$$ LANGUAGE SQL;
