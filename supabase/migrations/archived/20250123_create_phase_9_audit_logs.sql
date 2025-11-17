-- PHASE 9 Feature 3: Audit Logs Table
-- Comprehensive audit trail for compliance, tracking all approval actions and changes

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  brand_id TEXT NOT NULL,
  post_id TEXT,

  -- Actor Information
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,

  -- Action Type
  action TEXT NOT NULL CHECK (action IN (
    'APPROVAL_REQUESTED',
    'APPROVED',
    'REJECTED',
    'BULK_APPROVED',
    'BULK_REJECTED',
    'PUBLISH_FAILED',
    'EMAIL_SENT',
    'COMMENT_ADDED',
    'WORKFLOW_STARTED',
    'SETTINGS_UPDATED',
    'EMAIL_PREFERENCES_UPDATED'
  )),

  -- Metadata (JSONB for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Request Context
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- Create indexes for common queries and filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_brand ON audit_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_brand_action ON audit_logs(brand_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_brand_post ON audit_logs(brand_id, post_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(brand_id, actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_date ON audit_logs(action, created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view audit logs for their brand
CREATE POLICY "brand_isolation_select" ON audit_logs
  FOR SELECT USING (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

-- RLS Policy: Only authenticated users can insert logs (backend only)
CREATE POLICY "backend_only_insert" ON audit_logs
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

-- RLS Policy: Admins can delete old logs (GDPR compliance)
CREATE POLICY "admin_delete" ON audit_logs
  FOR DELETE USING (
    current_setting('jwt.claims.role', TRUE) = 'admin'
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_audit_logs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_logs_updated_at
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_audit_logs_timestamp();

-- Function to log approval action (used by backend)
CREATE OR REPLACE FUNCTION log_approval_action(
  p_brand_id TEXT,
  p_post_id TEXT,
  p_actor_id TEXT,
  p_actor_email TEXT,
  p_action TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_log_id TEXT;
BEGIN
  INSERT INTO audit_logs (
    brand_id,
    post_id,
    actor_id,
    actor_email,
    action,
    metadata,
    ip_address,
    user_agent
  )
  VALUES (
    p_brand_id,
    p_post_id,
    p_actor_id,
    p_actor_email,
    p_action,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT ON audit_logs TO anon; -- For read-only access (if needed)
