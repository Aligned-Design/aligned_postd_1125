/**
 * WebSocket Server Setup using Socket.io
 *
 * Handles real-time communications for:
 * - Publishing job status updates
 * - Analytics sync progress
 * - Notification delivery
 *
 * Architecture:
 * - Namespaces: /jobs, /analytics, /notifications
 * - Rooms: job-{jobId}, brand-{brandId}, user-{userId}
 */

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { getCorsConfig } from "./cors-config";

interface WebSocketServerOptions {
  corsOrigin?: string | string[];
  enableTracing?: boolean;
}

let ioInstance: SocketIOServer | null = null;

/**
 * Initialize Socket.io server
 * Should be called with HTTP server instance, typically:
 * const httpServer = createServer(app);
 * const io = initializeWebSocketServer(httpServer);
 */
export function initializeWebSocketServer(
  httpServer: HTTPServer,
  options: WebSocketServerOptions = {}
): SocketIOServer {
  // ✅ Type-safe CORS configuration for Socket.io
  // Socket.io expects a simpler CORS config than Express
  const corsOrigin = options.corsOrigin || (process.env.NODE_ENV === "production" 
    ? (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "*")
    : "*");
  
  const corsConfigTyped: {
    origin: string | string[] | boolean;
    credentials: boolean;
    methods: string[];
  } = {
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST"],
  };

  const io = new SocketIOServer(httpServer, {
    cors: corsConfigTyped,
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6, // 1MB
  });

  // Namespaces
  setupJobsNamespace(io);
  setupAnalyticsNamespace(io);
  setupNotificationsNamespace(io);

  ioInstance = io;

  console.log("✅ WebSocket server initialized");
  return io;
}

/**
 * Get current Socket.io instance
 */
export function getWebSocketInstance(): SocketIOServer {
  if (!ioInstance) {
    throw new Error(
      "WebSocket server not initialized. Call initializeWebSocketServer first."
    );
  }
  return ioInstance;
}

/**
 * Namespace: /jobs
 * Handles publishing job status updates
 */
function setupJobsNamespace(io: SocketIOServer): void {
  const namespace = io.of("/jobs");

  namespace.on("connection", (socket) => {
    console.log(`[Jobs] Client connected: ${socket.id}`);

    // Subscribe to specific job updates
    socket.on("subscribe-job", (jobId: string) => {
      const room = `job-${jobId}`;
      socket.join(room);
      console.log(`[Jobs] Client ${socket.id} subscribed to job ${jobId}`);

      // Send initial "subscribed" event
      socket.emit("subscribed", {
        jobId,
        timestamp: new Date().toISOString(),
      });
    });

    // Unsubscribe from job
    socket.on("unsubscribe-job", (jobId: string) => {
      const room = `job-${jobId}`;
      socket.leave(room);
      console.log(`[Jobs] Client ${socket.id} unsubscribed from job ${jobId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Jobs] Client disconnected: ${socket.id}`);
    });

    socket.on("error", (error) => {
      console.error(`[Jobs] Socket error for ${socket.id}:`, error);
    });
  });
}

/**
 * Namespace: /analytics
 * Handles analytics sync progress and insights generation
 */
function setupAnalyticsNamespace(io: SocketIOServer): void {
  const namespace = io.of("/analytics");

  namespace.on("connection", (socket) => {
    console.log(`[Analytics] Client connected: ${socket.id}`);

    // Subscribe to brand analytics
    socket.on("subscribe-brand", (brandId: string) => {
      const room = `brand-${brandId}`;
      socket.join(room);
      console.log(
        `[Analytics] Client ${socket.id} subscribed to brand ${brandId}`
      );

      socket.emit("subscribed", {
        brandId,
        timestamp: new Date().toISOString(),
      });
    });

    // Unsubscribe from brand
    socket.on("unsubscribe-brand", (brandId: string) => {
      const room = `brand-${brandId}`;
      socket.leave(room);
      console.log(
        `[Analytics] Client ${socket.id} unsubscribed from brand ${brandId}`
      );
    });

    socket.on("disconnect", () => {
      console.log(`[Analytics] Client disconnected: ${socket.id}`);
    });

    socket.on("error", (error) => {
      console.error(`[Analytics] Socket error for ${socket.id}:`, error);
    });
  });
}

/**
 * Namespace: /notifications
 * Handles user notifications and alerts
 */
function setupNotificationsNamespace(io: SocketIOServer): void {
  const namespace = io.of("/notifications");

  namespace.on("connection", (socket) => {
    console.log(`[Notifications] Client connected: ${socket.id}`);

    // Subscribe to user notifications
    socket.on("subscribe-user", (userId: string) => {
      const room = `user-${userId}`;
      socket.join(room);
      console.log(
        `[Notifications] Client ${socket.id} subscribed to user ${userId}`
      );

      socket.emit("subscribed", {
        userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Subscribe to team notifications
    socket.on("subscribe-team", (teamId: string) => {
      const room = `team-${teamId}`;
      socket.join(room);
      console.log(
        `[Notifications] Client ${socket.id} subscribed to team ${teamId}`
      );

      socket.emit("subscribed", {
        teamId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      console.log(`[Notifications] Client disconnected: ${socket.id}`);
    });

    socket.on("error", (error) => {
      console.error(`[Notifications] Socket error for ${socket.id}:`, error);
    });
  });
}

/**
 * Broadcast job status update to all subscribed clients
 */
export function broadcastJobStatusUpdate(jobId: string, data: unknown): void {
  const io = getWebSocketInstance();
  const room = `job-${jobId}`;

  io.of("/jobs").to(room).emit("job:status-changed", {
    jobId,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast analytics sync progress to all subscribed clients
 */
export function broadcastAnalyticsSyncProgress(brandId: string, data: unknown): void {
  const io = getWebSocketInstance();
  const room = `brand-${brandId}`;

  io.of("/analytics").to(room).emit("analytics:sync-progress", {
    brandId,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast notification to user
 */
export function broadcastNotificationToUser(userId: string, data: unknown): void {
  const io = getWebSocketInstance();
  const room = `user-${userId}`;

  io.of("/notifications").to(room).emit("notification:received", {
    userId,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get current Socket.io statistics
 */
export function getWebSocketStats(): {
  jobsConnected: number;
  analyticsConnected: number;
  notificationsConnected: number;
  totalRooms: number;
} {
  const io = getWebSocketInstance();

  return {
    jobsConnected: io.of("/jobs").sockets.size,
    analyticsConnected: io.of("/analytics").sockets.size,
    notificationsConnected: io.of("/notifications").sockets.size,
    totalRooms: io.engine.clientsCount,
  };
}

export default {
  initializeWebSocketServer,
  getWebSocketInstance,
  broadcastJobStatusUpdate,
  broadcastAnalyticsSyncProgress,
  broadcastNotificationToUser,
  getWebSocketStats,
};
