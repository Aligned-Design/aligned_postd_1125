-- Add trial support to user accounts
-- Migration: 20250201_add_trial_support.sql

-- Add trial_published_count column to track trial post usage
ALTER TABLE users
ADD COLUMN IF NOT EXISTS trial_published_count INT DEFAULT 0;

-- Add plan column to track user subscription tier
ALTER TABLE users
ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'trial';

-- Add trial_started_at for tracking trial period
ALTER TABLE users
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE;

-- Add trial_expires_at for trial expiration
ALTER TABLE users
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient trial user queries
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_trial_expires ON users(trial_expires_at);

-- Add comment for documentation
COMMENT ON COLUMN users.trial_published_count IS 'Number of posts published during trial period (max 2)';
COMMENT ON COLUMN users.plan IS 'User subscription plan: trial, base, agency';
COMMENT ON COLUMN users.trial_started_at IS 'Timestamp when trial period started';
COMMENT ON COLUMN users.trial_expires_at IS 'Timestamp when trial period expires (7 days from start)';
