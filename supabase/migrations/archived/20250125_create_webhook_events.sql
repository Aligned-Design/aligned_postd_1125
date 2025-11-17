/**
 * Webhook Events Table
 * Stores all incoming webhook events from external providers
 * Supports idempotency via idempotency_key to prevent duplicate processing
 */

-- Create enum for webhook providers
CREATE TYPE webhook_provider AS ENUM ('zapier', 'make', 'slack', 'hubspot');
CREATE TYPE webhook_status AS ENUM ('pending', 'processing', 'delivered', 'failed', 'dead_letter');

-- Create webhook_events table
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id TEXT NOT NULL,
  provider webhook_provider NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  status webhook_status NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_attempt_count CHECK (attempt_count >= 0 AND attempt_count <= max_attempts),
  CONSTRAINT valid_max_attempts CHECK (max_attempts >= 1 AND max_attempts <= 10)
);

-- Create indexes for common queries
CREATE INDEX idx_webhook_events_brand_id ON webhook_events(brand_id);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at DESC);
CREATE INDEX idx_webhook_events_idempotency_key ON webhook_events(idempotency_key);
CREATE INDEX idx_webhook_events_brand_status ON webhook_events(brand_id, status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_events_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhook_events_timestamp
BEFORE UPDATE ON webhook_events
FOR EACH ROW
EXECUTE FUNCTION update_webhook_events_timestamp();

-- Create RLS policies
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_events_brand_isolation"
  ON webhook_events
  USING (brand_id::uuid = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "webhook_events_insert_webhook_service"
  ON webhook_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "webhook_events_update_webhook_service"
  ON webhook_events
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "webhook_events_select_brand"
  ON webhook_events
  FOR SELECT
  USING (brand_id::uuid = auth.uid() OR auth.role() = 'service_role');

-- Create helper function to mark event as delivered
CREATE OR REPLACE FUNCTION mark_webhook_delivered(event_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE webhook_events
  SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to mark event as dead-letter
CREATE OR REPLACE FUNCTION mark_webhook_dead_letter(event_id UUID, error_msg TEXT)
RETURNS void AS $$
BEGIN
  UPDATE webhook_events
  SET status = 'dead_letter', last_error = error_msg, updated_at = CURRENT_TIMESTAMP
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to get retry candidates
CREATE OR REPLACE FUNCTION get_webhook_retry_candidates(max_age_minutes INTEGER DEFAULT 60)
RETURNS TABLE (
  id UUID,
  brand_id TEXT,
  provider webhook_provider,
  event_type TEXT,
  payload JSONB,
  attempt_count INTEGER,
  max_attempts INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    we.id,
    we.brand_id,
    we.provider,
    we.event_type,
    we.payload,
    we.attempt_count,
    we.max_attempts,
    we.created_at
  FROM webhook_events we
  WHERE
    we.status IN ('pending', 'failed')
    AND we.attempt_count < we.max_attempts
    AND we.created_at > CURRENT_TIMESTAMP - INTERVAL '1 minute' * max_age_minutes
  ORDER BY we.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Create comment for documentation
COMMENT ON TABLE webhook_events IS 'Stores incoming webhook events from external providers with support for idempotency and retry logic';
COMMENT ON COLUMN webhook_events.idempotency_key IS 'Unique key for deduplication - prevents duplicate processing of same event';
COMMENT ON COLUMN webhook_events.status IS 'Event processing status: pending, processing, delivered, failed, or dead_letter';
COMMENT ON COLUMN webhook_events.attempt_count IS 'Number of delivery attempts made so far';
COMMENT ON COLUMN webhook_events.max_attempts IS 'Maximum number of retry attempts before marking as dead-letter';
