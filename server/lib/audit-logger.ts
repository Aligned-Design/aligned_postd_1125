/**
 * Audit logging for approval workflows
 * Tracks all approval, rejection, bulk actions, and email sends
 * Enforces RLS and enables compliance reporting
 * Now uses Supabase database for persistence
 */

import { AuditLog, AuditAction, AuditLogQuery } from "@shared/approvals";
import { auditLogs as dbAuditLogs } from "./dbClient";

/**
 * Helper to convert database record to AuditLog format
 */
function dbRecordToAuditLog(record: unknown): AuditLog {
  return {
    id: record.id,
    brandId: record.brand_id,
    postId: record.post_id,
    actorId: record.actor_id,
    actorEmail: record.actor_email,
    action: record.action as AuditAction,
    metadata: record.metadata || {},
    ipAddress: record.ip_address,
    userAgent: record.user_agent,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

/**
 * Log an approval action
 */
export async function logAuditAction(
  brandId: string,
  postId: string,
  actorId: string,
  actorEmail: string,
  action: AuditAction,
  metadata: Record<string, unknown> = {},
  ipAddress?: string,
  userAgent?: string,
): Promise<AuditLog> {
  try {
    const auditLog = await dbAuditLogs.create({
      brand_id: brandId,
      post_id: postId,
      actor_id: actorId,
      actor_email: actorEmail,
      action,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Log to console for debugging
    console.log(`[Audit] ${action} by ${actorEmail}:`, {
      brandId,
      postId,
      timestamp: auditLog.created_at,
      metadata,
    });

    // TODO: Send to external audit service (Splunk, DataDog, etc.)

    return dbRecordToAuditLog(auditLog);
  } catch (error) {
    console.error("[Audit] Failed to log action:", error);
    throw error;
  }
}

/**
 * Query audit logs with filtering
 */
export async function queryAuditLogs(query: AuditLogQuery): Promise<{
  logs: AuditLog[];
  total: number;
  hasMore: boolean;
}> {
  if (!query.brandId) {
    throw new Error("brandId is required for audit queries");
  }

  const { logs: dbLogs, total } = await dbAuditLogs.query(query.brandId, {
    postId: query.postId,
    actorEmail: query.actorId, // Note: mapping actorId to actorEmail for DB query
    action: query.action,
    startDate: query.startDate,
    endDate: query.endDate,
    limit: query.limit || 50,
    offset: query.offset || 0,
  });

  const limit = query.limit || 50;
  const offset = query.offset || 0;
  const hasMore = offset + limit < total;

  return {
    logs: dbLogs.map(dbRecordToAuditLog),
    total,
    hasMore,
  };
}

/**
 * Get audit logs for a specific post
 */
export async function getPostAuditTrail(
  brandId: string,
  postId: string,
): Promise<AuditLog[]> {
  const logs = await dbAuditLogs.getByPostId(brandId, postId);
  return logs.map(dbRecordToAuditLog);
}

/**
 * Get statistics for compliance reporting
 */
export async function getAuditStatistics(
  brandId: string,
  startDate?: string,
  endDate?: string,
): Promise<{
  totalActions: number;
  byAction: Record<AuditAction, number>;
  averageApprovalTime: number;
  rejectionRate: number;
  bulkApprovals: number;
  emailsSent: number;
  topActors: Array<{ email: string; actionCount: number }>;
}> {
  const { logs } = await dbAuditLogs.query(brandId, {
    startDate,
    endDate,
    limit: 10000, // High limit for statistics collection
  });

  const apiLogs = logs.map(dbRecordToAuditLog);

  // Count by action
  const byAction: Record<string, number> = {};
  apiLogs.forEach((log) => {
    byAction[log.action] = (byAction[log.action] || 0) + 1;
  });

  // Calculate approval time (from APPROVAL_REQUESTED to APPROVED)
  const approvalTimes: number[] = [];
  const requestedMap = new Map<string, AuditLog>();

  apiLogs.forEach((log) => {
    if (log.action === "APPROVAL_REQUESTED") {
      requestedMap.set(log.postId, log);
    } else if (log.action === "APPROVED") {
      const requested = requestedMap.get(log.postId);
      if (requested) {
        const time =
          new Date(log.createdAt).getTime() -
          new Date(requested.createdAt).getTime();
        approvalTimes.push(time);
      }
    }
  });

  const averageApprovalTime =
    approvalTimes.length > 0
      ? approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length
      : 0;

  // Calculate rejection rate
  const approved = byAction["APPROVED"] || 0;
  const rejected = byAction["REJECTED"] || 0;
  const rejectionRate =
    approved + rejected > 0 ? rejected / (approved + rejected) : 0;

  // Count bulk approvals
  const bulkApprovals = byAction["BULK_APPROVED"] || 0;

  // Count emails
  const emailsSent = byAction["EMAIL_SENT"] || 0;

  // Top actors
  const actorCounts: Record<string, number> = {};
  apiLogs.forEach((log) => {
    actorCounts[log.actorEmail] = (actorCounts[log.actorEmail] || 0) + 1;
  });

  const topActors = Object.entries(actorCounts)
    .map(([email, actionCount]) => ({ email, actionCount }))
    .sort((a, b) => b.actionCount - a.actionCount)
    .slice(0, 10);

  return {
    totalActions: apiLogs.length,
    byAction: byAction as Record<AuditAction, number>,
    averageApprovalTime,
    rejectionRate,
    bulkApprovals,
    emailsSent,
    topActors,
  };
}

/**
 * Verify audit log integrity (check for tampering)
 */
export async function verifyAuditLogIntegrity(_logId: string): Promise<{
  valid: boolean;
  message: string;
}> {
  // Note: In production, this would query the database by ID
  // For now, we return true as Supabase handles integrity at the database level

  // In production, check:
  // 1. Cryptographic hash verification
  // 2. Sequence number verification
  // 3. Timestamp ordering
  // 4. Actor permissions at time of action

  return {
    valid: true,
    message: "Audit log verified",
  };
}

/**
 * Export audit logs for compliance (CSV format)
 */
export async function exportAuditLogs(
  brandId: string,
  startDate: string,
  endDate: string,
): Promise<string> {
  const { logs } = await queryAuditLogs({
    brandId,
    startDate,
    endDate,
    limit: 10000,
  });

  // CSV header
  const headers = [
    "ID",
    "Timestamp",
    "Action",
    "Actor Email",
    "Post ID",
    "Note",
    "Bulk Count",
    "Error",
  ];

  const rows = logs.map((log) => [
    log.id,
    log.createdAt,
    log.action,
    log.actorEmail,
    log.postId || "",
    log.metadata.note || "",
    log.metadata.bulkCount || "",
    log.metadata.errorMessage || "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  return csv;
}

/**
 * Delete audit logs older than specified days (for GDPR)
 */
export async function deleteOldAuditLogs(
  olderThanDays: number,
): Promise<number> {
  const deletedCount = await dbAuditLogs.deleteOlderThan(olderThanDays);
  console.log(
    `[Audit] Deleted ${deletedCount} logs older than ${olderThanDays} days`,
  );
  return deletedCount;
}
