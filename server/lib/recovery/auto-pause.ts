/**
 * Auto-Pause Mechanism - Gracefully pause channels on authentication/permission failures
 *
 * When auth or permission errors occur, automatically pause the channel rather than
 * repeatedly failing. User gets a clear reconnect prompt with one-click re-auth.
 */

import { createClient } from '@supabase/supabase-js';
import { logger, recordMetric } from '../observability';
import { ErrorCode } from './error-taxonomy';

/**
 * Connection status values
 */
export type ConnectionStatus = 'active' | 'attention' | 'paused' | 'revoked' | 'inactive';

/**
 * Health status values
 */
export type HealthStatus = 'healthy' | 'warning' | 'critical';

/**
 * Reason for pause
 */
export interface PauseReason {
  code: ErrorCode;
  description: string;
  recoveryAction: string; // User-facing action needed
  timestamp: Date;
  requiresReauth: boolean;
  suggestedScopes?: string[];
}

/**
 * Auto-pause a connection due to error
 */
export async function autoPauseConnection(
  tenantId: string,
  connectionId: string,
  reason: PauseReason,
  supabaseUrl?: string,
  supabaseKey?: string
): Promise<void> {
  const url = supabaseUrl || process.env.VITE_SUPABASE_URL || '';
  const key = supabaseKey || process.env.VITE_SUPABASE_ANON_KEY || '';

  const supabase = createClient(url, key);

  try {
    // Determine new status
    const newStatus: ConnectionStatus = reason.requiresReauth ? 'attention' : 'paused';

    logger.info(
      {
        tenantId,
        connectionId,
        pauseReason: reason.code,
        newStatus,
      },
      `Auto-pausing connection: ${reason.description}`
    );

    // Update connection status
    const { error: updateError } = await supabase
      .from('connections')
      .update({
        status: newStatus,
        health_status: 'critical' as HealthStatus,
        last_health_check: new Date().toISOString(),
        health_check_error: reason.description,
        pause_reason: reason.code,
        pause_description: reason.description,
        paused_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .eq('tenant_id', tenantId);

    if (updateError) {
      logger.error(
        {
          tenantId,
          connectionId,
          error: updateError.message,
        },
        'Failed to auto-pause connection'
      );
      throw updateError;
    }

    // Log pause event to audit trail
    const { error: auditError } = await supabase
      .from('connection_audit')
      .insert({
        connection_id: connectionId,
        tenant_id: tenantId,
        action: 'auto_pause',
        details: {
          reason_code: reason.code,
          description: reason.description,
          recovery_action: reason.recoveryAction,
        },
        timestamp: new Date().toISOString(),
      });

    if (auditError) {
      logger.warn(
        {
          tenantId,
          connectionId,
          error: auditError.message,
        },
        'Failed to log pause event'
      );
    }

    // Record metric
    recordMetric('connector.auto_pause', 1, {
      tenant_id: tenantId,
      pause_reason: reason.code,
      new_status: newStatus,
    });

    logger.info(
      {
        tenantId,
        connectionId,
        newStatus,
      },
      'Connection auto-paused'
    );
  } catch (error) {
    logger.error(
      {
        tenantId,
        connectionId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Error in auto-pause'
    );
    throw error;
  }
}

/**
 * Resume a paused connection
 */
export async function resumeConnection(
  tenantId: string,
  connectionId: string,
  supabaseUrl?: string,
  supabaseKey?: string
): Promise<void> {
  const url = supabaseUrl || process.env.VITE_SUPABASE_URL || '';
  const key = supabaseKey || process.env.VITE_SUPABASE_ANON_KEY || '';

  const supabase = createClient(url, key);

  try {
    logger.info(
      {
        tenantId,
        connectionId,
      },
      'Resuming paused connection'
    );

    // Update connection status back to active
    const { error: updateError } = await supabase
      .from('connections')
      .update({
        status: 'active' as ConnectionStatus,
        health_status: 'healthy' as HealthStatus,
        last_health_check: new Date().toISOString(),
        health_check_error: null,
        pause_reason: null,
        pause_description: null,
        paused_at: null,
      })
      .eq('id', connectionId)
      .eq('tenant_id', tenantId);

    if (updateError) {
      logger.error(
        {
          tenantId,
          connectionId,
          error: updateError.message,
        },
        'Failed to resume connection'
      );
      throw updateError;
    }

    // Log resume event
    const { error: auditError } = await supabase
      .from('connection_audit')
      .insert({
        connection_id: connectionId,
        tenant_id: tenantId,
        action: 'resume',
        details: {
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

    if (auditError) {
      logger.warn(
        {
          tenantId,
          connectionId,
          error: auditError.message,
        },
        'Failed to log resume event'
      );
    }

    recordMetric('connector.resume', 1, {
      tenant_id: tenantId,
    });

    logger.info(
      {
        tenantId,
        connectionId,
      },
      'Connection resumed'
    );
  } catch (error) {
    logger.error(
      {
        tenantId,
        connectionId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Error resuming connection'
    );
    throw error;
  }
}

/**
 * Get all paused connections for a tenant
 */
export async function getPausedConnections(
  tenantId: string,
  supabaseUrl?: string,
  supabaseKey?: string
): Promise<any[]> {
  const url = supabaseUrl || process.env.VITE_SUPABASE_URL || '';
  const key = supabaseKey || process.env.VITE_SUPABASE_ANON_KEY || '';

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('status', ['attention', 'paused', 'revoked'])
    .order('paused_at', { ascending: false, nullsFirst: false });

  if (error) {
    logger.error(
      {
        tenantId,
        error: error.message,
      },
      'Failed to fetch paused connections'
    );
    throw error;
  }

  return data || [];
}

/**
 * Build pause reason for common error scenarios
 */
export function buildPauseReason(errorCode: ErrorCode): PauseReason {
  switch (errorCode) {
    case ErrorCode.AUTH_EXPIRED:
      return {
        code: errorCode,
        description: 'Your authentication token has expired',
        recoveryAction: 'Click "Reconnect" to refresh your credentials',
        timestamp: new Date(),
        requiresReauth: true,
      };

    case ErrorCode.AUTH_INVALID:
      return {
        code: errorCode,
        description: 'Your authentication is invalid',
        recoveryAction: 'Click "Reconnect" to authenticate again',
        timestamp: new Date(),
        requiresReauth: true,
      };

    case ErrorCode.AUTH_REVOKED:
      return {
        code: errorCode,
        description: 'Your authorization was revoked',
        recoveryAction: 'Click "Reconnect" to authorize access',
        timestamp: new Date(),
        requiresReauth: true,
      };

    case ErrorCode.PERMISSION_INSUFFICIENT:
      return {
        code: errorCode,
        description: 'Insufficient permissions for this operation',
        recoveryAction: 'Click "Reconnect" and grant all requested permissions',
        timestamp: new Date(),
        requiresReauth: true,
      };

    case ErrorCode.PERMISSION_CHANGED:
      return {
        code: errorCode,
        description: 'Your permissions have changed on the platform',
        recoveryAction: 'Click "Reconnect" to update your permissions',
        timestamp: new Date(),
        requiresReauth: true,
      };

    case ErrorCode.SCOPE_MISSING:
      return {
        code: errorCode,
        description: 'Required permissions are missing',
        recoveryAction: 'Click "Reconnect" and enable all requested permissions',
        timestamp: new Date(),
        requiresReauth: true,
      };

    case ErrorCode.APP_DEAUTHORIZED:
      return {
        code: errorCode,
        description: 'The application has been deauthorized',
        recoveryAction: 'Contact support for assistance',
        timestamp: new Date(),
        requiresReauth: false,
      };

    case ErrorCode.APP_SUSPENDED:
      return {
        code: errorCode,
        description: 'The application has been suspended',
        recoveryAction: 'Contact support for assistance',
        timestamp: new Date(),
        requiresReauth: false,
      };

    default:
      return {
        code: errorCode,
        description: 'An unexpected error occurred',
        recoveryAction: 'Contact support if this persists',
        timestamp: new Date(),
        requiresReauth: false,
      };
  }
}
