-- ============================================================================
-- MIGRATION 005: Platform Integrations & Connections
-- Created: 2025-01-01
-- Description: OAuth connections and integration event tracking
-- ============================================================================

-- Platform Connections Table (OAuth tokens and credentials)
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(brand_id, platform, account_id)
);

-- Integration Events Table (Webhook and event tracking)
CREATE TABLE IF NOT EXISTS integration_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webhook Logs Table (For debugging webhook integration)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255),
  event_type VARCHAR(100),
  payload JSONB,
  status_code INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_platform_connections_brand_id ON platform_connections(brand_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_platform ON platform_connections(platform);
CREATE INDEX IF NOT EXISTS idx_platform_connections_is_active ON platform_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_platform_connections_updated_at ON platform_connections(updated_at);
CREATE INDEX IF NOT EXISTS idx_integration_events_brand_id ON integration_events(brand_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_connection_id ON integration_events(connection_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_event_type ON integration_events(event_type);
CREATE INDEX IF NOT EXISTS idx_integration_events_created_at ON integration_events(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_brand_id ON webhook_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_platform ON webhook_logs(platform);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- Trigger to track token update time
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_platform_connections_updated_at') THEN
    CREATE TRIGGER update_platform_connections_updated_at
    BEFORE UPDATE ON platform_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Function to check token expiration and schedule refresh
CREATE OR REPLACE FUNCTION check_token_expiration()
RETURNS SETOF platform_connections AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM platform_connections
  WHERE is_active = TRUE
  AND expires_at IS NOT NULL
  AND expires_at < CURRENT_TIMESTAMP + INTERVAL '1 day'
  ORDER BY expires_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to safely encrypt/decrypt sensitive tokens
CREATE OR REPLACE FUNCTION encrypt_platform_token(token TEXT)
RETURNS BYTEA AS $$
BEGIN
  -- Note: In production, use pgcrypto.pem_key() or similar
  -- This is a placeholder for encryption logic
  RETURN encode(convert_to(token, 'UTF8'), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Brand members can view their platform connections
CREATE POLICY "Brand members can view platform connections"
  ON platform_connections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = platform_connections.brand_id
      AND brand_members.user_id = auth.uid()::uuid
    )
  );

-- Only brand admins can connect platforms
CREATE POLICY "Admins can manage platform connections"
  ON platform_connections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = platform_connections.brand_id
      AND brand_members.user_id = auth.uid()::uuid
      AND brand_members.role IN ('owner', 'admin')
    )
  );

-- Brand members can view integration events
CREATE POLICY "Brand members can view integration events"
  ON integration_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = integration_events.brand_id
      AND brand_members.user_id = auth.uid()::uuid
    )
  );

-- Only system can write integration events
CREATE POLICY "System can create integration events"
  ON integration_events
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
    OR EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = integration_events.brand_id
      AND brand_members.user_id = auth.uid()::uuid
      AND brand_members.role IN ('owner', 'admin')
    )
  );

-- Admins can view webhook logs
CREATE POLICY "Admins can view webhook logs"
  ON webhook_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = webhook_logs.brand_id
      AND brand_members.user_id = auth.uid()::uuid
      AND brand_members.role IN ('owner', 'admin')
    )
  );

-- System can write webhook logs
CREATE POLICY "System can create webhook logs"
  ON webhook_logs
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = '00000000-0000-0000-0000-000000000000'
    OR EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = webhook_logs.brand_id
      AND brand_members.user_id = auth.uid()::uuid
      AND brand_members.role IN ('owner', 'admin')
    )
  );
