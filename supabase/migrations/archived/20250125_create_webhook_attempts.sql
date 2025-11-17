/**
 * Webhook Attempts Table
 * Records each retry attempt for webhook delivery
 * Enables detailed logging of failures and backoff intervals
 */

-- Create enum for attempt status
CREATE TYPE webhook_attempt_status AS ENUM ('success', 'failed');

-- Create webhook_attempts table
CREATE TABLE webhook_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES webhook_events(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  status webhook_attempt_status NOT NULL,
  error TEXT,
  response_code INTEGER,
  backoff_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_attempt_number CHECK (attempt_number >= 1),
  CONSTRAINT valid_backoff CHECK (backoff_ms >= 0),
  CONSTRAINT valid_response_code CHECK (response_code IS NULL OR (response_code >= 100 AND response_code <= 599))
);

-- Create indexes for common queries
CREATE INDEX idx_webhook_attempts_event_id ON webhook_attempts(event_id);
CREATE INDEX idx_webhook_attempts_status ON webhook_attempts(status);
CREATE INDEX idx_webhook_attempts_created_at ON webhook_attempts(created_at DESC);
CREATE INDEX idx_webhook_attempts_event_attempt ON webhook_attempts(event_id, attempt_number);

-- Create RLS policies
ALTER TABLE webhook_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_attempts_brand_isolation"
  ON webhook_attempts
  USING (
    event_id IN (
      SELECT id FROM webhook_events WHERE brand_id::uuid = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "webhook_attempts_insert_webhook_service"
  ON webhook_attempts
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "webhook_attempts_select_brand"
  ON webhook_attempts
  FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM webhook_events WHERE brand_id::uuid = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

-- Create helper function to log webhook attempt
CREATE OR REPLACE FUNCTION log_webhook_attempt(
  event_id UUID,
  attempt_number INTEGER,
  status webhook_attempt_status,
  error_msg TEXT DEFAULT NULL,
  response_code INTEGER DEFAULT NULL,
  backoff_delay_ms INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  attempt_id UUID;
BEGIN
  INSERT INTO webhook_attempts (
    event_id,
    attempt_number,
    status,
    error,
    response_code,
    backoff_ms
  ) VALUES (
    event_id,
    attempt_number,
    status,
    error_msg,
    response_code,
    backoff_delay_ms
  ) RETURNING id INTO attempt_id;

  RETURN attempt_id;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to get latest attempt for event
CREATE OR REPLACE FUNCTION get_latest_webhook_attempt(event_id UUID)
RETURNS TABLE (
  id UUID,
  attempt_number INTEGER,
  status webhook_attempt_status,
  error TEXT,
  response_code INTEGER,
  backoff_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wa.id,
    wa.attempt_number,
    wa.status,
    wa.error,
    wa.response_code,
    wa.backoff_ms,
    wa.created_at
  FROM webhook_attempts wa
  WHERE wa.event_id = event_id
  ORDER BY wa.attempt_number DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to get attempt history
CREATE OR REPLACE FUNCTION get_webhook_attempt_history(event_id UUID, limit_rows INTEGER DEFAULT 20)
RETURNS TABLE (
  attempt_number INTEGER,
  status webhook_attempt_status,
  error TEXT,
  response_code INTEGER,
  backoff_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wa.attempt_number,
    wa.status,
    wa.error,
    wa.response_code,
    wa.backoff_ms,
    wa.created_at
  FROM webhook_attempts wa
  WHERE wa.event_id = event_id
  ORDER BY wa.attempt_number DESC
  LIMIT limit_rows;
END;
$$ LANGUAGE plpgsql;

-- Create comment for documentation
COMMENT ON TABLE webhook_attempts IS 'Records retry attempts for webhook delivery with error details and backoff intervals';
COMMENT ON COLUMN webhook_attempts.attempt_number IS 'Sequential attempt number (1-based)';
COMMENT ON COLUMN webhook_attempts.backoff_ms IS 'Milliseconds to wait before next retry (exponential backoff)';
