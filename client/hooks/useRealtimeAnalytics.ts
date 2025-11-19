import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface AnalyticsSyncProgress {
  platform: string;
  progress: number; // 0-100
  recordsProcessed: number;
  totalRecords?: number;
  currentMetric?: string;
  timestamp: string;
}

interface AnalyticsEvent {
  syncId: string;
  eventType:
    | "analytics:sync-started"
    | "analytics:sync-progress"
    | "analytics:sync-completed"
    | "analytics:insights-generated"
    | "analytics:forecast-ready";
  data: AnalyticsSyncProgress;
}

interface UseRealtimeAnalyticsOptions {
  enabled?: boolean;
  fallbackPollingInterval?: number; // milliseconds, 0 to disable polling fallback
}

export interface UseRealtimeAnalyticsReturn {
  events: AnalyticsEvent[];
  currentProgress: AnalyticsSyncProgress | null;
  connected: boolean;
  isPolling: boolean;
  error: Error | null;
  clearEvents: () => void;
}

/**
 * Hook for real-time analytics sync progress via WebSocket
 * Falls back to polling if WebSocket unavailable
 */
export function useRealtimeAnalytics(
  brandId: string,
  options: UseRealtimeAnalyticsOptions = {}
): UseRealtimeAnalyticsReturn {
  const { enabled = true, fallbackPollingInterval = 5000 } = options;

  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [currentProgress, setCurrentProgress] =
    useState<AnalyticsSyncProgress | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventsRef = useRef<AnalyticsEvent[]>([]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!enabled || !brandId) return;

    // Create socket connection
    const socket = io(`${window.location.origin}/analytics`, {
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

      // Subscribe to this brand's analytics
      socket.emit("subscribe-brand", brandId);

      console.log(`Connected to analytics for brand ${brandId}`);
    });

    socket.on("disconnect", () => {
      setConnected(false);

      // Start polling fallback if configured
      if (fallbackPollingInterval > 0) {
        startPolling();
      }
    });

    // Receive analytics sync progress
    socket.on("analytics:sync-progress", (data: unknown) => {
      // ✅ FIX: Type guard for WebSocket payload
      const isAnalyticsPayload = (payload: unknown): payload is {
        syncId?: string;
        eventType?: string;
        platform?: string;
        progress?: number;
        recordsProcessed?: number;
        totalRecords?: number;
        currentMetric?: string;
        timestamp?: string;
      } => {
        return payload !== null && typeof payload === "object";
      };
      
      const payload = isAnalyticsPayload(data) ? data : {};
      // ✅ FIX: Ensure eventType matches the union type
      const eventType = (
        payload.eventType === "analytics:sync-started" ||
        payload.eventType === "analytics:sync-progress" ||
        payload.eventType === "analytics:sync-completed" ||
        payload.eventType === "analytics:insights-generated" ||
        payload.eventType === "analytics:forecast-ready"
      ) ? payload.eventType : "analytics:sync-progress";
      
      const event: AnalyticsEvent = {
        syncId: payload.syncId || `sync-${Date.now()}`,
        eventType,
        data: {
          platform: payload.platform,
          progress: payload.progress,
          recordsProcessed: payload.recordsProcessed,
          totalRecords: payload.totalRecords,
          currentMetric: payload.currentMetric,
          timestamp: payload.timestamp,
        },
      };

      eventsRef.current = [...eventsRef.current, event];
      setEvents([...eventsRef.current]);
      setCurrentProgress(event.data);
    });

    socket.on("subscribed", (data: { brandId: string }) => {
      console.log(`Successfully subscribed to brand ${data.brandId}`);
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
        socketRef.current.emit("unsubscribe-brand", brandId);
        socketRef.current.disconnect();
      }
    };
  }, [enabled, brandId, fallbackPollingInterval]);

  // Polling fallback mechanism
  const startPolling = useCallback(() => {
    if (isPolling) return;

    setIsPolling(true);
    console.log(`Starting polling fallback for brand ${brandId}`);

    const pollAnalytics = async () => {
      try {
        const response = await fetch(`/api/analytics/status/${brandId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        // Update current progress if available
        if (data.currentSync) {
          setCurrentProgress({
            platform: data.currentSync.platform,
            progress: data.currentSync.progress,
            recordsProcessed: data.currentSync.recordsProcessed,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("Polling error:", err);
        setError(
          err instanceof Error ? err : new Error("Polling failed")
        );
      }
    };

    // Initial poll
    pollAnalytics();

    // Set up interval
    pollingIntervalRef.current = setInterval(
      pollAnalytics,
      fallbackPollingInterval
    );
  }, [brandId, fallbackPollingInterval, isPolling]);

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

  // Clear events (optional, for memory management)
  const clearEvents = useCallback(() => {
    eventsRef.current = [];
    setEvents([]);
  }, []);

  return {
    events,
    currentProgress,
    connected,
    isPolling,
    error,
    clearEvents,
  };
}
