-- Payment Status Tracking Migration
-- Migration: 20250201_payment_status_tracking.sql
-- Purpose: Track payment failures, grace periods, and account suspension

-- Add payment status columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS plan_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_retry_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS past_due_since TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS grace_extension_days INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_payment_attempt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_retry_date TIMESTAMP WITH TIME ZONE;

-- Create payment_attempts table for detailed tracking
CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'failed', 'succeeded', 'pending'
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_invoice_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  error_code VARCHAR(255),
  error_message TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create archived_data table for 90-day retention
CREATE TABLE IF NOT EXISTS archived_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_id UUID,
  data_type VARCHAR(100) NOT NULL, -- 'posts', 'assets', 'settings', etc.
  data JSONB NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delete_after TIMESTAMP WITH TIME ZONE NOT NULL, -- archived_at + 90 days
  restored BOOLEAN DEFAULT FALSE,
  restored_at TIMESTAMP WITH TIME ZONE
);

-- Create payment_notifications table
CREATE TABLE IF NOT EXISTS payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL, -- 'soft_reminder', 'final_warning', 'suspension', etc.
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_subject TEXT,
  email_body TEXT,
  delivered BOOLEAN DEFAULT FALSE,
  opened BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_plan_status ON users(plan_status);
CREATE INDEX IF NOT EXISTS idx_users_past_due_since ON users(past_due_since);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_user_id ON payment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_archived_data_user_id ON archived_data(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_data_delete_after ON archived_data(delete_after);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_user_id ON payment_notifications(user_id);

-- Add constraints
ALTER TABLE users
ADD CONSTRAINT chk_plan_status CHECK (plan_status IN ('active', 'trial', 'past_due', 'archived', 'deleted'));

ALTER TABLE payment_attempts
ADD CONSTRAINT chk_payment_status CHECK (status IN ('failed', 'succeeded', 'pending'));

-- Add comments for documentation
COMMENT ON COLUMN users.plan_status IS 'User account status: active, trial, past_due, archived, deleted';
COMMENT ON COLUMN users.payment_failed_at IS 'Timestamp of first payment failure in current cycle';
COMMENT ON COLUMN users.payment_retry_count IS 'Number of retry attempts (max 3)';
COMMENT ON COLUMN users.past_due_since IS 'Date when account moved to past_due status';
COMMENT ON COLUMN users.grace_extension_days IS 'Additional grace days granted by admin';
COMMENT ON TABLE payment_attempts IS 'Detailed log of all payment attempts for auditing';
COMMENT ON TABLE archived_data IS 'User data stored for 90 days after account archival';
COMMENT ON TABLE payment_notifications IS 'Track all payment-related emails sent to users';

-- Create function to calculate days past due
CREATE OR REPLACE FUNCTION get_days_past_due(user_id_param UUID)
RETURNS INT AS $$
DECLARE
  days_past_due INT;
BEGIN
  SELECT EXTRACT(DAY FROM NOW() - past_due_since)::INT
  INTO days_past_due
  FROM users
  WHERE id = user_id_param AND plan_status = 'past_due';
  
  RETURN COALESCE(days_past_due, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-archive accounts at Day 30
CREATE OR REPLACE FUNCTION auto_archive_past_due_accounts()
RETURNS INT AS $$
DECLARE
  archived_count INT;
BEGIN
  WITH archived AS (
    UPDATE users
    SET 
      plan_status = 'archived',
      archived_at = NOW()
    WHERE 
      plan_status = 'past_due'
      AND past_due_since < NOW() - INTERVAL '30 days'
      AND (grace_extension_days = 0 OR past_due_since < NOW() - (INTERVAL '30 days' + grace_extension_days * INTERVAL '1 day'))
    RETURNING id
  )
  SELECT COUNT(*) INTO archived_count FROM archived;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to schedule permanent deletion at Day 90
CREATE OR REPLACE FUNCTION schedule_account_deletion()
RETURNS INT AS $$
DECLARE
  scheduled_count INT;
BEGIN
  WITH scheduled AS (
    UPDATE users
    SET plan_status = 'deleted'
    WHERE 
      plan_status = 'archived'
      AND archived_at < NOW() - INTERVAL '90 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO scheduled_count FROM scheduled;
  
  RETURN scheduled_count;
END;
$$ LANGUAGE plpgsql;
