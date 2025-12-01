# POSTD Socket.io Real-Time Configuration Guide

> **Status:** ✅ Active – This is an active guide for POSTD Socket.io real-time features.  
> **Last Updated:** 2025-01-20

Complete setup and integration guide for Socket.io real-time features in the POSTD platform.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Client Setup](#client-setup)
4. [Server Setup](#server-setup)
5. [Event Types](#event-types)
6. [Custom Hooks](#custom-hooks)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Socket.io enables real-time bidirectional communication between client and server for:

- **Job Status Updates**: Live publishing and analytics sync progress
- **Notifications**: Real-time user notifications and alerts
- **Analytics Sync**: Platform integration progress tracking
- **Collaborative Features**: Live updates for client portal

### Key Features

- **Fallback Support**: Automatically falls back to polling if WebSocket unavailable
- **Reconnection**: Automatic reconnection with exponential backoff
- **Rooms/Namespaces**: Isolated channels for different features
- **Type Safety**: Full TypeScript support for event payloads

---

## Architecture

### Connection Hierarchy

```
Socket.io Server
├── /jobs namespace
│   └── Job status updates
├── /notifications namespace
│   └── User notifications
├── /analytics namespace
│   └── Analytics sync progress
└── /default namespace
    └── General events
```

### Event Flow

```
Client                          Server
  │                               │
  ├─ subscribe-job [jobId]  ────→ │
  │                               │ (stores in memory)
  │                               │
  │ ← job:status-changed ─────────┤ (emits periodically)
  │                               │
  └─ unsubscribe-job [jobId] ──→  │
```

---

## Client Setup

### Environment Variables

```env
# .env or .env.local
SOCKETIO_CORS_ORIGIN=http://localhost:5173
SOCKETIO_RECONNECTION_DELAY=1000
SOCKETIO_RECONNECTION_DELAY_MAX=5000
```

### Using Custom Hooks

#### useRealtimeJob Hook

For tracking single job execution:

```typescript
import { useRealtimeJob } from '@/hooks/useRealtimeJob';

export function JobStatusMonitor({ jobId }: { jobId: string }) {
  const { status, connected, error, isPolling } = useRealtimeJob(jobId, {
    enabled: true,
    fallbackPollingInterval: 5000, // 5 seconds
  });

  if (!connected && !isPolling) {
    return <div className="text-red-500">Disconnected from server</div>;
  }

  return (
    <div>
      <p>Status: {status?.status}</p>
      <p>Progress: {status?.progress}%</p>
      {isPolling && <p className="text-yellow-500">Using polling fallback</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}
    </div>
  );
}
```

#### useRealtimeNotifications Hook

For receiving real-time notifications:

```typescript
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export function NotificationCenter({ userId }: { userId: string }) {
  const {
    notifications,
    unreadCount,
    connected,
    error,
    markAsRead,
    clearAll,
  } = useRealtimeNotifications(userId, {
    enabled: true,
    fallbackPollingInterval: 5000,
    maxNotifications: 50,
  });

  return (
    <div>
      <h2>Notifications ({unreadCount})</h2>
      {notifications.map((notif) => (
        <div
          key={notif.id}
          onClick={() => markAsRead(notif.id)}
          className={notif.read ? 'opacity-50' : ''}
        >
          <p>{notif.title}</p>
          <p>{notif.message}</p>
          <span className={`badge badge-${notif.severity}`}>
            {notif.severity}
          </span>
        </div>
      ))}
      <button onClick={clearAll}>Clear All</button>
    </div>
  );
}
```

#### useRealtimeAnalytics Hook

For tracking analytics sync progress:

```typescript
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';

export function AnalyticsSyncMonitor({ brandId }: { brandId: string }) {
  const { currentProgress, connected, isPolling, error, clearEvents } =
    useRealtimeAnalytics(brandId);

  return (
    <div>
      <h3>Analytics Sync Progress</h3>
      {currentProgress && (
        <>
          <p>Platform: {currentProgress.platform}</p>
          <div className="progress">
            <div
              className="progress-bar"
              style={{ width: `${currentProgress.progress}%` }}
            />
          </div>
          <p>
            {currentProgress.recordsProcessed} /
            {currentProgress.totalRecords} records
          </p>
        </>
      )}
      {!connected && isPolling && (
        <p className="text-yellow-500">Using polling fallback</p>
      )}
      {error && <p className="text-red-500">{error.message}</p>}
    </div>
  );
}
```

### Direct Socket.io Usage

For advanced use cases, import Socket.io client directly:

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io(`${window.location.origin}/jobs`, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

// Subscribe to job updates
socket.emit('subscribe-job', jobId);

// Listen for updates
socket.on('job:status-changed', (data: JobStatusUpdate) => {
  console.log('Job updated:', data);
});

// Cleanup
socket.off('job:status-changed');
socket.emit('unsubscribe-job', jobId);
socket.disconnect();
```

---

## Server Setup

### Socket.io Server Configuration

Located in `server/lib/socket-io.ts`:

```typescript
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.SOCKETIO_CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

export const socketIO = io;

httpServer.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port:', process.env.PORT);
});
```

### Namespace Setup

#### /jobs Namespace

```typescript
const jobsNamespace = io.of('/jobs');

jobsNamespace.on('connection', (socket) => {
  console.log('Client connected to /jobs:', socket.id);

  // Subscribe to specific job
  socket.on('subscribe-job', (jobId: string) => {
    socket.join(`job:${jobId}`);
    console.log(`Client subscribed to job:${jobId}`);
    socket.emit('subscribed', { jobId });
  });

  // Unsubscribe from job
  socket.on('unsubscribe-job', (jobId: string) => {
    socket.leave(`job:${jobId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected from /jobs:', socket.id);
  });
});
```

#### /notifications Namespace

```typescript
const notificationsNamespace = io.of('/notifications');

notificationsNamespace.on('connection', (socket) => {
  const userId = socket.handshake.query.userId as string;

  socket.on('subscribe-user', (userId: string) => {
    socket.join(`user:${userId}`);
    socket.emit('subscribed', { userId });
  });

  socket.on('unsubscribe-user', (userId: string) => {
    socket.leave(`user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', userId);
  });
});
```

#### /analytics Namespace

```typescript
const analyticsNamespace = io.of('/analytics');

analyticsNamespace.on('connection', (socket) => {
  socket.on('subscribe-brand', (brandId: string) => {
    socket.join(`brand:${brandId}`);
    socket.emit('subscribed', { brandId });
  });

  socket.on('unsubscribe-brand', (brandId: string) => {
    socket.leave(`brand:${brandId}`);
  });
});
```

### Broadcasting Updates

#### Broadcasting Job Status

```typescript
export function broadcastJobUpdate(jobId: string, update: JobStatusUpdate) {
  io.of('/jobs').to(`job:${jobId}`).emit('job:status-changed', update);
}
```

Example usage:

```typescript
// In analytics sync handler
broadcastJobUpdate(jobId, {
  jobId,
  status: 'in_progress',
  progress: 50,
  currentPlatform: 'instagram',
  timestamp: new Date().toISOString(),
});
```

#### Broadcasting Notifications

```typescript
export function sendNotificationToUser(userId: string, notification: Notification) {
  io.of('/notifications')
    .to(`user:${userId}`)
    .emit('notification:received', notification);
}
```

Example usage:

```typescript
sendNotificationToUser(userId, {
  id: uuid(),
  type: 'job-completed',
  title: 'Job Completed',
  message: 'Your analytics sync job has completed',
  severity: 'success',
  timestamp: new Date().toISOString(),
});
```

---

## Event Types

### Job Status Events

**Event**: `job:status-changed`
**Direction**: Server → Client
**Payload**:
```typescript
interface JobStatusUpdate {
  jobId: string;
  status: 'draft' | 'pending' | 'approved' | 'published' | 'failed';
  progress?: number; // 0-100
  currentPlatform?: string;
  error?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}
```

### Notification Events

**Event**: `notification:received`
**Direction**: Server → Client
**Payload**:
```typescript
interface Notification {
  id: string;
  type:
    | 'job-completed'
    | 'job-failed'
    | 'approval-needed'
    | 'insight-available'
    | 'sync-complete'
    | 'alert';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  brandId?: string;
  actionUrl?: string;
  timestamp: string;
  read?: boolean;
}
```

### Analytics Events

**Event**: `analytics:sync-progress`
**Direction**: Server → Client
**Payload**:
```typescript
interface AnalyticsEvent {
  syncId: string;
  eventType:
    | 'analytics:sync-started'
    | 'analytics:sync-progress'
    | 'analytics:sync-completed'
    | 'analytics:insights-generated'
    | 'analytics:forecast-ready';
  data: {
    platform: string;
    progress: number; // 0-100
    recordsProcessed: number;
    totalRecords?: number;
    currentMetric?: string;
    timestamp: string;
  };
}
```

---

## Custom Hooks

### Hook Implementation Pattern

All custom hooks follow this pattern:

```typescript
export function useRealtimeFeature(
  id: string,
  options: {
    enabled?: boolean;
    fallbackPollingInterval?: number;
  } = {}
): UseRealtimeFeatureReturn {
  const { enabled = true, fallbackPollingInterval = 5000 } = options;

  const [status, setStatus] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection
  useEffect(() => {
    if (!enabled || !id) return;

    const socket = io(`${window.location.origin}/namespace`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setConnected(true);
      setIsPolling(false);
      socket.emit('subscribe-feature', id);
    });

    socket.on('feature:update', (data) => {
      setStatus(data);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      if (fallbackPollingInterval > 0) {
        startPolling();
      }
    });

    socketRef.current = socket;
    return () => socket.disconnect();
  }, [enabled, id, fallbackPollingInterval]);

  // Polling fallback
  const startPolling = useCallback(() => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/feature/${id}`);
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Polling failed'));
      }
    };

    setIsPolling(true);
    poll();
    pollingIntervalRef.current = setInterval(poll, fallbackPollingInterval);
  }, [id, fallbackPollingInterval]);

  return { status, connected, error, isPolling };
}
```

### Hooks Location

- `client/hooks/useRealtimeJob.ts`: Job execution tracking
- `client/hooks/useRealtimeNotifications.ts`: Notification handling
- `client/hooks/useRealtimeAnalytics.ts`: Analytics sync tracking

---

## Deployment

### Production Configuration

**Environment Variables** (.env.production):

```env
SOCKETIO_CORS_ORIGIN=https://yourdomain.com
SOCKETIO_RECONNECTION_DELAY=2000
SOCKETIO_RECONNECTION_DELAY_MAX=10000
```

### Vercel Deployment

Socket.io works with Vercel's serverless functions via polling transport.

**Configuration** (vercel.json):

```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "env": {
    "SOCKETIO_CORS_ORIGIN": "@socketio_cors_origin"
  }
}
```

### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV SOCKETIO_CORS_ORIGIN=https://yourdomain.com
EXPOSE 3000

CMD ["npm", "start"]
```

### Horizontal Scaling (Redis Adapter)

For multiple server instances, use Redis adapter:

```bash
npm install @socket.io/redis-adapter redis
```

**Server configuration**:

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ host: 'redis-server', port: 6379 });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

---

## Troubleshooting

### Connection Issues

**Problem**: Client shows "Connection Refused"

**Solutions**:
1. Verify `SOCKETIO_CORS_ORIGIN` matches frontend URL
2. Check server is listening on correct port
3. Verify firewall/network allows WebSocket traffic
4. Check browser console for specific errors

**Code**:
```typescript
const socket = io(`${window.location.origin}/namespace`, {
  transports: ['websocket', 'polling'], // Try polling if websocket fails
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Polling Fallback Not Working

**Problem**: Client stuck in polling but not getting updates

**Solutions**:
1. Verify polling endpoint exists: `/api/feature/:id`
2. Check API returns correct JSON format
3. Verify CORS headers on API endpoint
4. Check `fallbackPollingInterval` isn't too large

**Code**:
```typescript
const { isPolling } = useRealtimeFeature(id, {
  fallbackPollingInterval: 5000, // Default 5 seconds
});

console.log('Polling active:', isPolling);
```

### Memory Leaks

**Problem**: Multiple reconnections or duplicate event listeners

**Solutions**:
1. Always cleanup in useEffect return:
```typescript
return () => {
  if (pollingIntervalRef.current) {
    clearInterval(pollingIntervalRef.current);
  }
  if (socketRef.current) {
    socketRef.current.disconnect();
  }
};
```

2. Use `.off()` to remove specific listeners:
```typescript
socket.off('job:status-changed');
```

3. Check for stale closures in callbacks

### High Latency / Lag

**Problem**: Updates arriving with significant delay

**Solutions**:
1. Reduce `fallbackPollingInterval` (smaller = more frequent):
```typescript
useRealtimeJob(jobId, { fallbackPollingInterval: 2000 }); // 2 seconds
```

2. Increase server capacity for Socket.io
3. Use Redis adapter for distributed systems
4. Implement server-side debouncing:
```typescript
let lastEmitTime = 0;
function broadcastJobUpdate(data) {
  if (Date.now() - lastEmitTime > 1000) { // Max 1 update/sec
    io.of('/jobs').emit('job:status-changed', data);
    lastEmitTime = Date.now();
  }
}
```

### CORS Errors

**Problem**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solutions**:
1. Update `SOCKETIO_CORS_ORIGIN` to match frontend:
```env
SOCKETIO_CORS_ORIGIN=http://localhost:5173  # Development
SOCKETIO_CORS_ORIGIN=https://yourdomain.com # Production
```

2. Verify in server configuration:
```typescript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.SOCKETIO_CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});
```

3. Test with curl:
```bash
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  https://yourdomain.com/socket.io
```

---

## Performance Tips

1. **Use Namespaces**: Organize events into logical groups
2. **Room Subscriptions**: Only broadcast to relevant clients
3. **Debounce Updates**: Don't broadcast every microsecond change
4. **Batch Operations**: Send multiple updates in single message
5. **Monitor Memory**: Watch Socket.io memory usage on server
6. **Implement TTL**: Remove stale subscriptions automatically

---

## Security Considerations

1. **Authenticate Connections**: Verify user before subscribing
2. **Validate Messages**: Check payload types and sizes
3. **Rate Limiting**: Prevent clients from overwhelming server
4. **Encrypt Sensitive Data**: Use HTTPS + WSS in production
5. **Audit Logging**: Log all significant Socket.io events

---

## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { useRealtimeJob } from '@/hooks/useRealtimeJob';

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

test('hook initializes with correct defaults', () => {
  const { result } = renderHook(() => useRealtimeJob('test-job'));
  expect(result.current.connected).toBe(false);
  expect(result.current.status).toBeNull();
});
```

### Integration Tests

```typescript
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';

test('client receives job status update', async () => {
  // Setup server
  const ioServer = new Server(8080);

  // Create client
  const socket = ioClient('http://localhost:8080');

  // Test update
  ioServer.emit('job:status-changed', { status: 'completed' });

  // Verify received
  expect(socket.connected).toBe(true);
});
```

---

## Additional Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [Socket.io Client API](https://socket.io/docs/client-api/)
- [WebSocket Best Practices](https://www.ably.io/topic/websockets)
- [Real-time Architecture Patterns](https://martinfowler.com/articles/patterns-of-distributed-systems/real-time-notification.html)
