# Health Checks Documentation

**Last Updated:** January 2025

---

## Overview

This document describes the health check endpoints available for monitoring the POSTD backend.

---

## Health Check Endpoints

### 1. Basic Health Check

**Endpoint:** `GET /health`

**Description:** Basic health check to verify the service is running.

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "service": "postd-backend"
}
```

**Status Codes:**
- `200 OK` - Service is healthy

**Monitoring:**
- **Uptime Check URL:** `https://your-domain.com/health`
- **Expected Status:** `200`
- **Check Interval:** 1 minute
- **Timeout:** 5 seconds

---

### 2. AI Service Health

**Endpoint:** `GET /health/ai`

**Description:** Checks if AI service (OpenAI/Anthropic) is configured and available.

**Expected Response:**
```json
{
  "status": "ok",
  "provider": "openai",
  "configured": true,
  "timestamp": "2025-01-XX..."
}
```

**Status Codes:**
- `200 OK` - AI service is configured
- `200 OK` with `"status": "degraded"` - AI service not configured (non-critical)

**Monitoring:**
- **Uptime Check URL:** `https://your-domain.com/health/ai`
- **Expected Status:** `200`
- **Check Interval:** 5 minutes
- **Timeout:** 10 seconds

---

### 3. Supabase Health

**Endpoint:** `GET /health/supabase`

**Description:** Checks database connection and availability.

**Expected Response:**
```json
{
  "status": "ok",
  "connected": true,
  "timestamp": "2025-01-XX..."
}
```

**Status Codes:**
- `200 OK` - Database is connected
- `503 Service Unavailable` - Database connection failed

**Monitoring:**
- **Uptime Check URL:** `https://your-domain.com/health/supabase`
- **Expected Status:** `200`
- **Check Interval:** 1 minute
- **Timeout:** 5 seconds
- **Alert on:** `503` status

---

## Monitoring Setup

### UptimeRobot / Pingdom

**Recommended Checks:**

1. **Basic Health**
   - URL: `https://your-domain.com/health`
   - Interval: 1 minute
   - Alert: If down for 2 consecutive checks

2. **Database Health**
   - URL: `https://your-domain.com/health/supabase`
   - Interval: 1 minute
   - Alert: If down for 1 check (critical)

3. **AI Service Health**
   - URL: `https://your-domain.com/health/ai`
   - Interval: 5 minutes
   - Alert: If down for 3 consecutive checks (non-critical)

### Vercel / Render / Railway

**Native Health Checks:**

Most platforms support automatic health checks. Configure:

- **Health Check Path:** `/health`
- **Expected Status:** `200`
- **Interval:** 60 seconds

---

## Response Shapes

All health endpoints return JSON with:
- `status`: `"ok"` | `"degraded"` | `"error"`
- `timestamp`: ISO 8601 timestamp
- Additional fields specific to each endpoint

---

## Troubleshooting

### `/health` returns 200 but service is slow

- Check `/health/supabase` for database issues
- Review application logs for slow queries
- Check server resource usage

### `/health/supabase` returns 503

- Verify Supabase credentials in environment variables
- Check Supabase dashboard for service status
- Verify network connectivity to Supabase

### `/health/ai` returns degraded

- Verify `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set
- Check API key validity
- Review AI provider status

---

**Last Updated:** January 2025

