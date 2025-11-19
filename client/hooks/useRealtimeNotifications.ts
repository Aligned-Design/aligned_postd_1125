import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

export type NotificationType =
  | "job-completed"
  | "job-failed"
  | "approval-needed"
  | "insight-available"
  | "sync-complete"
  | "alert";

export type NotificationSeverity = "info" | "warning" | "error" | "success";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  brandId?: string;
  actionUrl?: string;
  timestamp: string;
  read?: boolean;
}

interface UseRealtimeNotificationsOptions {
  enabled?: boolean;
  fallbackPollingInterval?: number; // milliseconds, 0 to disable polling fallback
  maxNotifications?: number; // Keep last N notifications in memory
}

export interface UseRealtimeNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  connected: boolean;
  isPolling: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => void;
  clearAll: () => void;
  removeNotification: (notificationId: string) => void;
}

/**
 * Hook for real-time user notifications via WebSocket
 * Falls back to polling if WebSocket unavailable
 */
export function useRealtimeNotifications(
  userId: string,
  options: UseRealtimeNotificationsOptions = {}
): UseRealtimeNotificationsReturn {
  const {
    enabled = true,
    fallbackPollingInterval = 5000,
    maxNotifications = 50,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationsRef = useRef<Notification[]>([]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!enabled || !userId) return;

    // Create socket connection
    const socket = io(`${window.location.origin}/notifications`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on("connect", () => {
      setConnected(true);
      setIsPolling(false);
      setError(null);

      // Subscribe to this user's notifications
      socket.emit("subscribe-user", userId);

      console.log(`Connected to notifications for user ${userId}`);
    });

    socket.on("disconnect", () => {
      setConnected(false);

      // Start polling fallback if configured
      if (fallbackPollingInterval > 0) {
        startPolling();
      }
    });

    // Receive notifications
    socket.on("notification:received", (data: unknown) => {
      // ✅ FIX: Type guard for notification payload
      const isNotificationPayload = (payload: unknown): payload is {
        id?: string;
        type?: string;
        title?: string;
        message?: string;
        severity?: "info" | "success" | "warning" | "error";
        brandId?: string;
        actionUrl?: string;
        timestamp?: string;
      } => {
        return payload !== null && typeof payload === "object";
      };
      
      const payload = isNotificationPayload(data) ? data : {};
      // ✅ FIX: Ensure type matches NotificationType union
      const notificationType: NotificationType = (
        payload.type === "job-completed" ||
        payload.type === "job-failed" ||
        payload.type === "approval-needed" ||
        payload.type === "insight-available" ||
        payload.type === "sync-complete" ||
        payload.type === "alert"
      ) ? payload.type : "alert";
      
      const notification: Notification = {
        id: payload.id || `notif-${Date.now()}-${Math.random()}`,
        type: notificationType,
        title: payload.title || "",
        message: payload.message || "",
        severity: payload.severity || "info",
        brandId: payload.brandId,
        actionUrl: payload.actionUrl,
        timestamp: payload.timestamp || new Date().toISOString(),
        read: false,
      };

      notificationsRef.current = [
        notification,
        ...notificationsRef.current,
      ].slice(0, maxNotifications);

      setNotifications([...notificationsRef.current]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on("subscribed", (data: { userId: string }) => {
      console.log(`Successfully subscribed to notifications for user ${data.userId}`);
    });

    socket.on("error", (err: unknown) => {
      // ✅ FIX: Type guard for error payload
      const errorMessage = typeof err === "string" 
        ? err 
        : (err && typeof err === "object" && "message" in err && typeof err.message === "string")
        ? err.message
        : "WebSocket error";
      const error = new Error(errorMessage);
      setError(error);
      console.error("WebSocket error:", error);

      // Start polling fallback
      if (fallbackPollingInterval > 0) {
        startPolling();
      }
    });

    return () => {
      // Cleanup
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      if (socketRef.current) {
        socketRef.current.emit("unsubscribe-user", userId);
        socketRef.current.disconnect();
      }
    };
  }, [enabled, userId, fallbackPollingInterval, maxNotifications]);

  // Polling fallback mechanism
  const startPolling = useCallback(() => {
    if (isPolling) return;

    setIsPolling(true);
    console.log(`Starting polling fallback for notifications`);

    const pollNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?limit=10`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data.notifications && Array.isArray(data.notifications)) {
          notificationsRef.current = data.notifications.slice(0, maxNotifications);
          setNotifications([...notificationsRef.current]);

          // Calculate unread count
          const unread = data.notifications.filter(
            (n: Notification) => !n.read
          ).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error("Polling error:", err);
        setError(
          err instanceof Error ? err : new Error("Polling failed")
        );
      }
    };

    // Initial poll
    pollNotifications();

    // Set up interval
    pollingIntervalRef.current = setInterval(
      pollNotifications,
      fallbackPollingInterval
    );
  }, [fallbackPollingInterval, isPolling, maxNotifications]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Stop polling if we reconnect via WebSocket
  useEffect(() => {
    if (connected && isPolling) {
      stopPolling();
    }
  }, [connected, isPolling, stopPolling]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    notificationsRef.current = notificationsRef.current.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications([...notificationsRef.current]);
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    notificationsRef.current = [];
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId: string) => {
    notificationsRef.current = notificationsRef.current.filter(
      (n) => n.id !== notificationId
    );
    setNotifications([...notificationsRef.current]);
  }, []);

  return {
    notifications,
    unreadCount,
    connected,
    isPolling,
    error,
    markAsRead,
    clearAll,
    removeNotification,
  };
}
