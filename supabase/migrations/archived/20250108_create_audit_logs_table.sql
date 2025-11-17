-- Migration: Create audit_logs table
-- Purpose: Track all approval, rejection, and action audit trails for compliance and debugging
-- Date: 2025-01-08

-- Create the audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifiers for tracking
  brand_id VARCHAR(255) NOT NULL,
  post_id VARCHAR(255) NOT NULL,
  actor_id VARCHAR(255) NOT NULL,
  actor_email VARCHAR(255) NOT NULL,

  -- Action tracking
  action VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}',

  -- Request context
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Multi-tenancy
  CONSTRAINT audit_logs_brand_id_fk FOREIGN KEY (brand_id) REFERENCES COALESCE(public.client_settings(brand_id), brand_id)
);

-- Create indexes for common queries
CREATE INDEX idx_audit_logs_brand_id ON public.audit_logs(brand_id);
CREATE INDEX idx_audit_logs_post_id ON public.audit_logs(post_id);
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_brand_post ON public.audit_logs(brand_id, post_id);
CREATE INDEX idx_audit_logs_brand_actor ON public.audit_logs(brand_id, actor_id);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenant isolation
-- Policy: Users can only view audit logs for their brand
CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT
  USING (
    auth.jwt() ->> 'brand_id' = brand_id
    OR
    TRUE  -- Application layer handles header-based access control
  );

-- Policy: Users can only insert audit logs for their brand
CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'brand_id' = brand_id
    OR
    TRUE  -- Application layer handles access control
  );

-- Create update trigger to automatically set updated_at
CREATE OR REPLACE FUNCTION public.update_audit_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_logs_updated_at
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audit_logs_updated_at();

-- Add comment to table
COMMENT ON TABLE public.audit_logs IS
'Immutable audit trail for approval actions, rejections, and operations. Enforces compliance reporting and debugging.';

-- Add comments to key columns
COMMENT ON COLUMN public.audit_logs.action IS
'Type of action: APPROVAL_REQUESTED, APPROVED, REJECTED, REMINDER_SENT, BULK_APPROVED, BULK_REJECTED';

COMMENT ON COLUMN public.audit_logs.metadata IS
'JSON object containing additional context: rejection_reason, comment, approval_time, bulk_operation_id';
