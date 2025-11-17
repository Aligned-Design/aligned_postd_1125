# Monitoring Setup Guide

**Last Updated:** January 2025

---

## Overview

This guide explains how to set up error monitoring and alerting for the POSTD backend.

---

## Error Monitoring

### Logger Integration

The backend uses a centralized logger (`server/lib/logger.ts`) that outputs structured JSON logs.

**Log Format:**
```json
{
  "timestamp": "2025-01-XX...",
  "level": "error",
  "message": "Failed to process job",
  "context": {
    "brandId": "...",
    "workspaceId": "...",
    "userId": "...",
    "requestId": "..."
  },
  "error": {
    "name": "Error",
    "message": "...",
    "stack": "..."
  }
}
```

---

## Error Monitoring Providers

### Option 1: Sentry

**Setup:**

1. Install Sentry SDK:
```bash
pnpm add @sentry/node @sentry/integrations
```

2. Initialize in `server/index.ts`:
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 0.1,
});
```

3. Update logger to send to Sentry:
```typescript
// In server/lib/logger.ts
import * as Sentry from "@sentry/node";

error(message: string, error?: Error, context?: LogContext): void {
  Sentry.captureException(error || new Error(message), {
    tags: context,
    level: "error",
  });
  // ... existing console.error ...
}
```

**Environment Variable:**
```bash
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

### Option 2: Logflare

**Setup:**

1. Install Logflare client:
```bash
pnpm add @logflare/node
```

2. Initialize in `server/index.ts`:
```typescript
import { Logflare } from "@logflare/node";

const logflare = new Logflare({
  apiKey: process.env.LOGFLARE_API_KEY,
  sourceToken: process.env.LOGFLARE_SOURCE_TOKEN,
});
```

3. Update logger to send to Logflare:
```typescript
// In server/lib/logger.ts
import { logflare } from "../index";

error(message: string, error?: Error, context?: LogContext): void {
  logflare.insertLogs([{
    timestamp: new Date().toISOString(),
    level: "error",
    message,
    context,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined,
  }]);
  // ... existing console.error ...
}
```

**Environment Variables:**
```bash
LOGFLARE_API_KEY=xxx
LOGFLARE_SOURCE_TOKEN=xxx
```

---

### Option 3: Provider Logs (Vercel / Render / Railway)

**Vercel:**

Logs are automatically collected. View in Vercel dashboard → Project → Logs.

**Render:**

Logs are automatically collected. View in Render dashboard → Service → Logs.

**Railway:**

Logs are automatically collected. View in Railway dashboard → Service → Logs.

**Query Failed Jobs:**

```sql
-- Failed publishing jobs
SELECT * FROM publishing_jobs
WHERE status = 'failed'
ORDER BY updated_at DESC
LIMIT 100;

-- Jobs that exceeded max retries
SELECT * FROM publishing_jobs
WHERE retry_count >= max_retries
AND status = 'failed'
ORDER BY updated_at DESC;
```

---

## Alerting

### Failed Publishing Jobs

**Query:**
```sql
SELECT COUNT(*) as failed_jobs
FROM publishing_jobs
WHERE status = 'failed'
AND updated_at > NOW() - INTERVAL '1 hour';
```

**Alert Threshold:** > 10 failed jobs in 1 hour

### Escalation Events

**Query:**
```sql
SELECT COUNT(*) as escalations
FROM escalation_events
WHERE created_at > NOW() - INTERVAL '1 hour';
```

**Alert Threshold:** > 5 escalations in 1 hour

---

## Job Failure Visibility

### Database Queries

**Recent Failed Jobs:**
```sql
SELECT 
  id,
  brand_id,
  platforms,
  status,
  retry_count,
  last_error,
  updated_at
FROM publishing_jobs
WHERE status = 'failed'
ORDER BY updated_at DESC
LIMIT 50;
```

**Jobs in Dead Letter (Max Retries Exceeded):**
```sql
SELECT 
  id,
  brand_id,
  platforms,
  retry_count,
  max_retries,
  last_error,
  last_error_details
FROM publishing_jobs
WHERE status = 'failed'
AND retry_count >= max_retries
ORDER BY updated_at DESC;
```

**Failed Jobs by Platform:**
```sql
SELECT 
  platform,
  COUNT(*) as failed_count
FROM publishing_jobs
WHERE status = 'failed'
AND updated_at > NOW() - INTERVAL '24 hours'
GROUP BY platform
ORDER BY failed_count DESC;
```

---

## Log Aggregation

### Structured Logging

All logs include:
- `brandId` - For filtering by brand
- `workspaceId` - For filtering by workspace
- `userId` - For filtering by user
- `requestId` - For tracing requests

**Example Query (Logflare/Sentry):**
```
brandId:"xxx" AND level:error
```

---

## Best Practices

1. **Monitor Health Endpoints**
   - Set up uptime checks for `/health`, `/health/supabase`
   - Alert on consecutive failures

2. **Monitor Error Rates**
   - Track error rate by endpoint
   - Alert if error rate > 5% in 5 minutes

3. **Monitor Job Failures**
   - Track failed publishing jobs
   - Alert if > 10 failures in 1 hour

4. **Monitor Database Performance**
   - Track slow queries (> 1 second)
   - Monitor connection pool usage

5. **Monitor AI Service**
   - Track AI API latency
   - Monitor rate limit errors

---

## Environment Variables

**Required for Error Monitoring:**
```bash
# Sentry
SENTRY_DSN=xxx

# Or Logflare
LOGFLARE_API_KEY=xxx
LOGFLARE_SOURCE_TOKEN=xxx
```

**Optional:**
```bash
# Environment name for filtering
NODE_ENV=production

# Service name
SERVICE_NAME=postd-backend
```

---

**Last Updated:** January 2025

