import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface JobStatusUpdate {
  jobId: string;
  status: "draft" | "pending" | "approved" | "published" | "failed";
  progress?: number;
  currentPlatform?: string;
  error?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

interface UseRealtimeJobOptions {
  enabled?: boolean;
  fallbackPollingInterval?: number; // milliseconds, 0 to disable polling fallback
}

export interface UseRealtimeJobReturn {
  status: JobStatusUpdate | null;
  connected: boolean;
  error: Error | null;
  isPolling: boolean;
}

/**
 * Hook for real-time job status updates via WebSocket
 * Falls back to polling if WebSocket unavailable
 */
export function useRealtimeJob(
  jobId: string,
  options: UseRealtimeJobOptions = {}
): UseRealtimeJobReturn {
  const { enabled = true, fallbackPollingInterval = 5000 } = options;

  const [status, setStatus] = useState<JobStatusUpdate | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!enabled || !jobId) return;

    // Create socket connection
    const socket = io(`${window.location.origin}/jobs`, {
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

      // Subscribe to this specific job
      socket.emit("subscribe-job", jobId);

      console.log(`Connected to job updates for ${jobId}`);
    });

    socket.on("disconnect", () => {
      setConnected(false);

      // Start polling fallback if configured
      if (fallbackPollingInterval > 0) {
        startPolling();
      }
    });

    // Receive job status updates
    socket.on("job:status-changed", (data: JobStatusUpdate) => {
      setStatus(data);
    });

    socket.on("subscribed", (data: { jobId: string }) => {
      console.log(`Successfully subscribed to job ${data.jobId}`);
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
        socketRef.current.emit("unsubscribe-job", jobId);
        socketRef.current.disconnect();
      }
    };
  }, [enabled, jobId, fallbackPollingInterval]);

  // Polling fallback mechanism
  const startPolling = useCallback(() => {
    if (isPolling) return;

    setIsPolling(true);
    console.log(`Starting polling fallback for job ${jobId}`);

    const pollJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        setStatus(data);
      } catch (err) {
        console.error("Polling error:", err);
        setError(
          err instanceof Error ? err : new Error("Polling failed")
        );
      }
    };

    // Initial poll
    pollJob();

    // Set up interval
    pollingIntervalRef.current = setInterval(pollJob, fallbackPollingInterval);
  }, [jobId, fallbackPollingInterval, isPolling]);

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

  return {
    status,
    connected,
    isPolling,
    error,
  };
}
