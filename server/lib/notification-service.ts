/**
 * Notification Service
 * 
 * Handles internal events and routes them to email and in-app notifications.
 * 
 * Events:
 * - content.pending_approval
 * - content.approved
 * - content.failed_to_post
 */

import { supabase } from "./supabase";
import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";

export type NotificationEventType =
  | "content.pending_approval"
  | "content.approved"
  | "content.rejected"
  | "content.failed_to_post"
  | "content.published"
  | "job.completed"
  | "job.failed";

export interface NotificationEvent {
  type: NotificationEventType;
  brandId: string;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, unknown>;
  severity?: "info" | "warning" | "error" | "success";
}

export interface Notification {
  id: string;
  userId: string;
  brandId?: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "success";
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

class NotificationService {
  /**
   * Emit a notification event
   */
  async emit(event: NotificationEvent): Promise<void> {
    try {
      // Get users who should receive this notification
      const recipients = await this.getRecipients(event);

      // Create in-app notifications
      for (const userId of recipients) {
        await this.createInAppNotification(userId, event);
      }

      // Send emails (if enabled)
      // Future work: Implement email sending via SendGrid or similar service
      // This requires email service configuration and template management
      // await this.sendEmailNotifications(recipients, event);

      console.log(`[Notification] Emitted ${event.type} for brand ${event.brandId}`);
    } catch (error: any) {
      console.error("[Notification] Error emitting event:", error);
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * Get users who should receive this notification
   */
  private async getRecipients(event: NotificationEvent): Promise<string[]> {
    const recipients: string[] = [];

    // Get brand members
    const { data: members, error } = await supabase
      .from("brand_members")
      .select("user_id, role")
      .eq("brand_id", event.brandId);

    if (error) {
      console.error("[Notification] Error fetching brand members:", error);
      return recipients;
    }

    // Filter by role based on event type
    for (const member of members || []) {
      if (this.shouldNotify(member.role, event.type)) {
        recipients.push(member.user_id);
      }
    }

    return recipients;
  }

  /**
   * Determine if a role should receive this notification
   */
  private shouldNotify(role: string, eventType: NotificationEventType): boolean {
    // Admins and managers get all notifications
    if (role === "admin" || role === "manager") {
      return true;
    }

    // Content creators get approval-related notifications
    if (
      eventType === "content.pending_approval" ||
      eventType === "content.approved" ||
      eventType === "content.rejected"
    ) {
      return role === "creator" || role === "editor";
    }

    return false;
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(
    userId: string,
    event: NotificationEvent
  ): Promise<void> {
    const { title, message, severity } = this.formatNotification(event);

    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      brand_id: event.brandId,
      type: event.type,
      title,
      message,
      severity: severity || "info",
      action_url: this.getActionUrl(event),
      is_read: false,
    });

    if (error) {
      console.error("[Notification] Error creating in-app notification:", error);
    }
  }

  /**
   * Format notification title and message
   */
  private formatNotification(event: NotificationEvent): {
    title: string;
    message: string;
    severity: "info" | "warning" | "error" | "success";
  } {
    const severity = event.severity || "info";

    switch (event.type) {
      case "content.pending_approval":
        return {
          title: "Content Pending Approval",
          message: `Content ${event.resourceId} is waiting for your approval`,
          severity: "info",
        };
      case "content.approved":
        return {
          title: "Content Approved",
          message: `Content ${event.resourceId} has been approved`,
          severity: "success",
        };
      case "content.rejected":
        return {
          title: "Content Rejected",
          message: `Content ${event.resourceId} has been rejected`,
          severity: "warning",
        };
      case "content.failed_to_post":
        return {
          title: "Posting Failed",
          message: `Failed to post content ${event.resourceId}`,
          severity: "error",
        };
      case "content.published":
        return {
          title: "Content Published",
          message: `Content ${event.resourceId} has been published`,
          severity: "success",
        };
      case "job.completed":
        return {
          title: "Job Completed",
          message: `Publishing job completed successfully`,
          severity: "success",
        };
      case "job.failed":
        return {
          title: "Job Failed",
          message: `Publishing job failed after retries`,
          severity: "error",
        };
      default:
        return {
          title: "Notification",
          message: "You have a new notification",
          severity,
        };
    }
  }

  /**
   * Get action URL for notification
   */
  private getActionUrl(event: NotificationEvent): string | undefined {
    if (event.resourceId && event.resourceType) {
      return `/content/${event.resourceId}`;
    }
    return undefined;
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(
    userId: string,
    brandId?: string,
    limit: number = 50
  ): Promise<Notification[]> {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (brandId) {
      query = query.eq("brand_id", brandId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Notification] Error fetching notifications:", error);
      return [];
    }

    return (data || []).map(this.mapNotification);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("[Notification] Error marking notification as read:", error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Failed to mark notification as read",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "error"
      );
    }
  }

  /**
   * Map database record to Notification
   */
  private mapNotification(record: any): Notification {
    return {
      id: record.id,
      userId: record.user_id,
      brandId: record.brand_id,
      type: record.type,
      title: record.title,
      message: record.message,
      severity: record.severity,
      actionUrl: record.action_url,
      isRead: record.is_read,
      createdAt: new Date(record.created_at),
    };
  }
}

export const notificationService = new NotificationService();

