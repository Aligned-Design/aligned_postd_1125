-- ============================================================================
-- MIGRATION 007: Client Portal & Audit Logging
-- Created: 2025-01-01
-- Description: Client portal access management and comprehensive audit trails
-- ============================================================================

-- Client Settings Table (Per-client permissions)
CREATE TABLE IF NOT EXISTS client_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  can_view_analytics BOOLEAN DEFAULT FALSE,
  can_approve_content BOOLEAN DEFAULT FALSE,
  can_upload_media BOOLEAN DEFAULT FALSE,
  can_view_brand_guide BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(brand_id, client_id)
);

-- Client Comments Table (Feedback on content)
CREATE TABLE IF NOT EXISTS client_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  attachment_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client Media Table (Media uploads by clients)
CREATE TABLE IF NOT EXISTS client_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'uploading' CHECK (status IN ('uploading', 'ready', 'failed')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Audit Logs Table (Comprehensive activity tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  changes JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  approval_notifications BOOLEAN DEFAULT TRUE,
  job_completion_notifications BOOLEAN DEFAULT TRUE,
  sync_alerts BOOLEAN DEFAULT TRUE,
  weekly_digest BOOLEAN DEFAULT TRUE,
  daily_summary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table (User notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_settings_brand_id ON client_settings(brand_id);
CREATE INDEX IF NOT EXISTS idx_client_settings_client_id ON client_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_client_comments_content_id ON client_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_client_comments_client_id ON client_comments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_comments_is_resolved ON client_comments(is_resolved);
CREATE INDEX IF NOT EXISTS idx_client_media_brand_id ON client_media(brand_id);
CREATE INDEX IF NOT EXISTS idx_client_media_client_id ON client_media(client_id);
CREATE INDEX IF NOT EXISTS idx_client_media_status ON client_media(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_brand_id ON audit_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_brand_id ON notifications(brand_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_client_settings_updated_at') THEN
    CREATE TRIGGER update_client_settings_updated_at
    BEFORE UPDATE ON client_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_client_comments_updated_at') THEN
    CREATE TRIGGER update_client_comments_updated_at
    BEFORE UPDATE ON client_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_notification_preferences_updated_at') THEN
    CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION clean_expired_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
  AND expires_at < CURRENT_TIMESTAMP;

  DELETE FROM client_media
  WHERE expires_at IS NOT NULL
  AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
  p_brand_id UUID,
  p_user_id UUID,
  p_action VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id VARCHAR,
  p_changes JSONB DEFAULT '{}'::JSONB,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_ip_address VARCHAR DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    brand_id, user_id, action, resource_type, resource_id,
    changes, metadata, ip_address, user_agent
  ) VALUES (
    p_brand_id, p_user_id, p_action, p_resource_type, p_resource_id,
    p_changes, p_metadata, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Clients can view their settings
CREATE POLICY "Clients can view their settings"
  ON client_settings
  FOR SELECT
  USING (client_id = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = client_settings.brand_id
      AND brand_members.user_id = auth.uid()::uuid
      AND brand_members.role IN ('owner', 'admin')
    ));

-- Admins can manage client settings
CREATE POLICY "Admins can manage client settings"
  ON client_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = client_settings.brand_id
      AND brand_members.user_id = auth.uid()::uuid
      AND brand_members.role IN ('owner', 'admin')
    )
  );

-- Clients can view comments on content
CREATE POLICY "Clients can view comments"
  ON client_comments
  FOR SELECT
  USING (
    client_id = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM content
      JOIN brand_members ON brand_members.brand_id = content.brand_id
      WHERE content.id = client_comments.content_id
      AND brand_members.user_id = auth.uid()::uuid
    )
  );

-- Clients can create comments
CREATE POLICY "Clients can create comments"
  ON client_comments
  FOR INSERT
  WITH CHECK (
    client_id = auth.uid()::uuid AND
    EXISTS (
      SELECT 1 FROM client_settings
      WHERE client_settings.brand_id = (
        SELECT brand_id FROM content WHERE id = client_comments.content_id
      )
      AND client_settings.client_id = auth.uid()::uuid
    )
  );

-- Clients can view their uploads
CREATE POLICY "Clients can view their media"
  ON client_media
  FOR SELECT
  USING (
    client_id = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = client_media.brand_id
      AND brand_members.user_id = auth.uid()::uuid
    )
  );

-- Clients can upload media
CREATE POLICY "Clients can upload media"
  ON client_media
  FOR INSERT
  WITH CHECK (
    client_id = auth.uid()::uuid AND
    EXISTS (
      SELECT 1 FROM client_settings
      WHERE client_settings.brand_id = client_media.brand_id
      AND client_settings.client_id = auth.uid()::uuid
      AND client_settings.can_upload_media = TRUE
    )
  );

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = audit_logs.brand_id
      AND brand_members.user_id = auth.uid()::uuid
      AND brand_members.role IN ('owner', 'admin')
    )
  );

-- Users can view their own notification preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences
  FOR SELECT
  USING (user_id = auth.uid()::uuid);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON notification_preferences
  FOR ALL
  USING (user_id = auth.uid()::uuid);

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  USING (user_id = auth.uid()::uuid);

-- Users can update notification read status
CREATE POLICY "Users can update notification status"
  ON notifications
  FOR UPDATE
  USING (user_id = auth.uid()::uuid)
  WITH CHECK (user_id = auth.uid()::uuid);
