-- Phase 2B: Workflow Escalation & Time-Based Notifications
-- Tracks escalation configuration and triggered escalation events

-- ==================== ESCALATION RULES TABLE ====================
-- Brand-level configuration for when to trigger escalations
CREATE TABLE IF NOT EXISTS escalation_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  brand_id TEXT NOT NULL,

  -- Rule Configuration
  rule_type TEXT NOT NULL CHECK (rule_type IN ('reminder_24h', 'reminder_48h', 'escalation_48h', 'escalation_96h', 'custom')),
  trigger_hours INTEGER NOT NULL,

  -- Target Configuration
  target_type TEXT NOT NULL DEFAULT 'approval' CHECK (target_type IN ('approval', 'post', 'workflow')),

  -- Escalation Action
  escalate_to_role TEXT DEFAULT 'manager' CHECK (escalate_to_role IN ('manager', 'admin', 'custom')),
  escalate_to_user_id TEXT,
  notify_via TEXT ARRAY DEFAULT ARRAY['email']::TEXT[],

  -- Custom Configuration
  custom_escalate_endpoint TEXT,
  webhook_secret TEXT,

  -- Flags
  enabled BOOLEAN DEFAULT TRUE,
  send_email BOOLEAN DEFAULT TRUE,
  send_slack BOOLEAN DEFAULT FALSE,

  -- Per-brand Overrides (if different from global settings)
  override_reminder_frequency TEXT,
  override_max_emails_per_day INTEGER,
  respect_timezone BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,

  -- Constraints
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_escalation_rules_brand ON escalation_rules(brand_id);
CREATE INDEX IF NOT EXISTS idx_escalation_rules_brand_enabled ON escalation_rules(brand_id, enabled);
CREATE INDEX IF NOT EXISTS idx_escalation_rules_brand_type ON escalation_rules(brand_id, rule_type);
CREATE INDEX IF NOT EXISTS idx_escalation_rules_trigger_hours ON escalation_rules(trigger_hours);

-- ==================== ESCALATION EVENTS TABLE ====================
-- Tracks actual escalation events triggered for specific content
CREATE TABLE IF NOT EXISTS escalation_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  brand_id TEXT NOT NULL,

  -- Reference to what triggered this escalation
  approval_id TEXT,
  post_id TEXT,

  -- Event Details
  rule_id TEXT NOT NULL,
  escalation_level TEXT NOT NULL CHECK (escalation_level IN ('reminder_24h', 'reminder_48h', 'escalation_48h', 'escalation_96h')),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'resolved')),

  -- Escalation Details
  escalated_to_role TEXT,
  escalated_to_user_id TEXT,
  notification_type TEXT CHECK (notification_type IN ('email', 'slack', 'webhook')),

  -- Timing
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_send_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,

  -- Response/Error Tracking
  delivery_attempt_count INTEGER DEFAULT 0,
  last_delivery_error TEXT,
  response_metadata JSONB,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (approval_id) REFERENCES post_approvals(id) ON DELETE CASCADE,
  FOREIGN KEY (rule_id) REFERENCES escalation_rules(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_escalation_events_brand ON escalation_events(brand_id);
CREATE INDEX IF NOT EXISTS idx_escalation_events_brand_status ON escalation_events(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_escalation_events_brand_approval ON escalation_events(brand_id, approval_id);
CREATE INDEX IF NOT EXISTS idx_escalation_events_scheduled_send_at ON escalation_events(scheduled_send_at);
CREATE INDEX IF NOT EXISTS idx_escalation_events_triggered_at ON escalation_events(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_escalation_events_escalated_to ON escalation_events(escalated_to_user_id);

-- ==================== ESCALATION HISTORY TABLE ====================
-- Audit trail for escalation lifecycle
CREATE TABLE IF NOT EXISTS escalation_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  brand_id TEXT NOT NULL,
  escalation_event_id TEXT NOT NULL,

  -- Action
  action TEXT NOT NULL CHECK (action IN ('created', 'scheduled', 'sent', 'failed', 'resolved', 'acknowledged')),
  actor TEXT,
  reason TEXT,

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (escalation_event_id) REFERENCES escalation_events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_escalation_history_brand ON escalation_history(brand_id);
CREATE INDEX IF NOT EXISTS idx_escalation_history_event ON escalation_history(escalation_event_id);
CREATE INDEX IF NOT EXISTS idx_escalation_history_action ON escalation_history(action);
CREATE INDEX IF NOT EXISTS idx_escalation_history_created_at ON escalation_history(created_at DESC);

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for escalation_rules
CREATE POLICY "escalation_rules_select" ON escalation_rules
  FOR SELECT USING (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

CREATE POLICY "escalation_rules_insert" ON escalation_rules
  FOR INSERT WITH CHECK (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

CREATE POLICY "escalation_rules_update" ON escalation_rules
  FOR UPDATE USING (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

CREATE POLICY "escalation_rules_delete" ON escalation_rules
  FOR DELETE USING (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

-- RLS Policies for escalation_events
CREATE POLICY "escalation_events_select" ON escalation_events
  FOR SELECT USING (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

CREATE POLICY "escalation_events_insert" ON escalation_events
  FOR INSERT WITH CHECK (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

CREATE POLICY "escalation_events_update" ON escalation_events
  FOR UPDATE USING (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

-- RLS Policies for escalation_history
CREATE POLICY "escalation_history_select" ON escalation_history
  FOR SELECT USING (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

CREATE POLICY "escalation_history_insert" ON escalation_history
  FOR INSERT WITH CHECK (
    brand_id = current_setting('jwt.claims.brand_id', TRUE)::TEXT
    OR current_setting('jwt.claims.role', TRUE) = 'admin'
  );

-- ==================== HELPER FUNCTIONS ====================

-- Function to create escalation event from rule
CREATE OR REPLACE FUNCTION create_escalation_event(
  p_brand_id TEXT,
  p_approval_id TEXT,
  p_rule_id TEXT,
  p_escalation_level TEXT,
  p_scheduled_send_at TIMESTAMP WITH TIME ZONE
)
RETURNS escalation_events AS $$
DECLARE
  v_event escalation_events;
  v_rule escalation_rules;
BEGIN
  -- Get rule details
  SELECT * INTO v_rule FROM escalation_rules WHERE id = p_rule_id;

  IF v_rule IS NULL THEN
    RAISE EXCEPTION 'Escalation rule not found: %', p_rule_id;
  END IF;

  -- Create event
  INSERT INTO escalation_events (
    brand_id,
    approval_id,
    rule_id,
    escalation_level,
    escalated_to_role,
    escalated_to_user_id,
    notification_type,
    scheduled_send_at,
    status
  ) VALUES (
    p_brand_id,
    p_approval_id,
    p_rule_id,
    p_escalation_level,
    v_rule.escalate_to_role,
    v_rule.escalate_to_user_id,
    (v_rule.notify_via)[1],
    p_scheduled_send_at,
    'pending'
  ) RETURNING * INTO v_event;

  -- Log creation
  INSERT INTO escalation_history (
    brand_id,
    escalation_event_id,
    action,
    metadata
  ) VALUES (
    p_brand_id,
    v_event.id,
    'created',
    jsonb_build_object('rule_id', p_rule_id, 'escalation_level', p_escalation_level)
  );

  RETURN v_event;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark escalation as sent
CREATE OR REPLACE FUNCTION mark_escalation_sent(
  p_event_id TEXT,
  p_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS escalation_events AS $$
DECLARE
  v_event escalation_events;
BEGIN
  UPDATE escalation_events
  SET status = 'sent',
      sent_at = p_sent_at,
      updated_at = NOW()
  WHERE id = p_event_id
  RETURNING * INTO v_event;

  -- Log send
  INSERT INTO escalation_history (
    brand_id,
    escalation_event_id,
    action
  ) VALUES (
    v_event.brand_id,
    p_event_id,
    'sent'
  );

  RETURN v_event;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark escalation as resolved
CREATE OR REPLACE FUNCTION mark_escalation_resolved(
  p_event_id TEXT,
  p_resolved_by TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS escalation_events AS $$
DECLARE
  v_event escalation_events;
BEGIN
  UPDATE escalation_events
  SET status = 'resolved',
      resolved_at = NOW(),
      resolved_by = p_resolved_by,
      updated_at = NOW()
  WHERE id = p_event_id
  RETURNING * INTO v_event;

  -- Log resolution
  INSERT INTO escalation_history (
    brand_id,
    escalation_event_id,
    action,
    actor,
    reason
  ) VALUES (
    v_event.brand_id,
    p_event_id,
    'resolved',
    p_resolved_by,
    p_reason
  );

  RETURN v_event;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending escalations for processing
CREATE OR REPLACE FUNCTION get_pending_escalations(
  p_max_age_hours INTEGER DEFAULT 168
)
RETURNS TABLE (
  id TEXT,
  brand_id TEXT,
  approval_id TEXT,
  escalation_level TEXT,
  scheduled_send_at TIMESTAMP WITH TIME ZONE,
  escalated_to_user_id TEXT,
  notification_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ee.id,
    ee.brand_id,
    ee.approval_id,
    ee.escalation_level,
    ee.scheduled_send_at,
    ee.escalated_to_user_id,
    ee.notification_type
  FROM escalation_events ee
  WHERE ee.status = 'pending'
    AND ee.scheduled_send_at <= NOW()
    AND ee.triggered_at >= NOW() - INTERVAL '1 hour' * p_max_age_hours
  ORDER BY ee.scheduled_send_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_escalation_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_escalation_rules_updated_at
  BEFORE UPDATE ON escalation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_escalation_rules_timestamp();

CREATE OR REPLACE FUNCTION update_escalation_events_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_escalation_events_updated_at
  BEFORE UPDATE ON escalation_events
  FOR EACH ROW
  EXECUTE FUNCTION update_escalation_events_timestamp();

-- ==================== PERMISSIONS ====================

GRANT SELECT, INSERT, UPDATE, DELETE ON escalation_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON escalation_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON escalation_history TO authenticated;
GRANT EXECUTE ON FUNCTION create_escalation_event TO authenticated;
GRANT EXECUTE ON FUNCTION mark_escalation_sent TO authenticated;
GRANT EXECUTE ON FUNCTION mark_escalation_resolved TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_escalations TO authenticated;
