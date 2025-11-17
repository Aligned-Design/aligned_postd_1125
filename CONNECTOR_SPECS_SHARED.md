# 🔌 Shared Connector Specifications

**Location**: `/server/connectors/_shared/`
**Purpose**: Common types, error taxonomy, retry policies, and logging standards for all connectors
**Version**: 1.0

---

## SHARED TYPES & INTERFACES

### Error Taxonomy

```
ERROR CATEGORIES:
├─ AuthError (401, 403)
│  └─ Action: Mark connection "attention" + trigger reconnect flow
│  └─ Retryable: NO
│  └─ Examples: invalid_token, expired_token, insufficient_permission
│
├─ RateLimitError (429)
│  └─ Action: Backoff + exponential retry
│  └─ Retryable: YES (with backoff)
│  └─ Backoff window: 1s → 3s → 9s → 27s (exponential, max 60s)
│
├─ ServerError (500, 502, 503, 504)
│  └─ Action: Exponential backoff retry
│  └─ Retryable: YES
│  └─ Max attempts: 4
│
├─ ClientError (400, 404, 409)
│  └─ Action: Fail immediately, log, send to DLQ
│  └─ Retryable: NO
│  └─ Examples: invalid_payload, resource_not_found, conflict
│
├─ TimeoutError (408, network timeout)
│  └─ Action: Retry with backoff
│  └─ Retryable: YES
│  └─ Max attempts: 3
│
└─ UnclassifiedError
   └─ Action: Log + alert + manual review
   └─ Retryable: NO (fail safe)
```

### Retry Policy

**Definition**:
- Max attempts: 4 (total; includes initial)
- Base delay: 1000ms
- Backoff multiplier: 2x (exponential)
- Jitter: 0-1000ms random
- Max delay cap: 60000ms

**Calculation**:
```
delay[i] = min(
  base_delay × (2 ^ attempt_index) + random(0, 1000),
  max_delay_cap
)
```

**Timeline**:
```
Attempt 1: Immediate
Attempt 2: ~1-2s
Attempt 3: ~3-4s
Attempt 4: ~9-10s
Max total time: ~15-20s
```

### Idempotency Key

**Purpose**: Prevent duplicate publishes if request retries

**Field Name**: `idempotencyKey` (string, UUID)

**Storage**:
- Before API call: Save `(idempotencyKey, status='pending')`
- After success: Update `(idempotencyKey, status='published', externalPostId, permalink)`
- After failure: Update `(idempotencyKey, status='failed', errorCode, errorMessage)`

**Validation**:
- On new publish request: Check if `(tenantId, idempotencyKey, status='published')` exists
- If exists: Return cached result (don't call API again)
- If pending: Wait or fail with "already processing"
- If failed: Allow retry (new attempt_count = 0)

---

## LOGGING STANDARDS

### Required Fields (Every Event)

```json
{
  "timestamp": "ISO8601",
  "event": "string (connector_auth | connector_publish | connector_refresh | webhook_received | error)",
  "tenantId": "UUID",
  "brandId": "UUID or null",
  "connectionId": "UUID or null",
  "platform": "string (meta | linkedin | tiktok | etc)",
  "CycleId": "UUID (request batch ID for tracing)",
  "RequestId": "UUID (individual request ID)",
  "status": "string (started | success | failed | retrying)",
  "errorCode": "string or null",
  "errorMessage": "string or null (NO secrets, NO tokens)",
  "durationMs": "number",
  "metadata": {
    "attempt": "number",
    "externalId": "string or null",
    "httpStatus": "number or null"
  }
}
```

### Redaction Rules

**NEVER log**:
- Access tokens
- Refresh tokens
- API keys
- User passwords
- Personally identifiable information (names, emails, phone numbers)

**DO log** (sanitized):
- HTTP status codes
- Error codes (not messages if they contain secrets)
- Endpoint names (not full URLs with tokens)
- External IDs (page ID, account ID, etc.)
- Timestamps and durations

---

## RETRY & BACKOFF ALGORITHM

### Pseudocode

```
function retryWithBackoff(fn, maxAttempts=4) {
  for attempt in range(1, maxAttempts + 1) {
    try {
      result = fn()
      log("success", {attempt, durationMs})
      return result
    } catch error {
      classification = classifyError(error.statusCode, error.code)

      if not classification.retryable or attempt === maxAttempts {
        log("failed", {attempt, errorCode, durationMs})
        throw error
      }

      delayMs = exponentialBackoff(attempt - 1)
      log("retrying", {attempt, delayMs, errorCode})
      sleep(delayMs)
    }
  }
}
```

---

## STATE MACHINE (Per Publish Job)

```
pending ─→ scheduled ─→ published ✅
  │          │
  └─→ retrying ─→ failed ❌
         │
         └─→ published (after retry success) ✅
```

**Transitions**:
- `pending` → `scheduled`: Job enqueued, scheduled_for set
- `pending` → `published`: Immediate publish success
- `pending` / `scheduled` → `retrying`: Attempt failed, will retry
- `retrying` → `published`: Retry succeeded
- Any → `failed`: Max retries exhausted or unretryable error

---

## WEBHOOK HANDLING

### Expected Webhook Pattern

```
POST /api/webhooks/:platform
Headers:
  X-Hub-Signature: HMAC-SHA256(body, appSecret)
  X-Request-ID: UUID

Body:
  {
    timestamp: number (Unix seconds),
    object: "page" | "user" | "app",
    entry: [
      {
        id: "string",
        time: number,
        changes: [
          {
            field: "string",
            value: {...}
          }
        ]
      }
    ]
  }
```

### Validation Steps

1. **Signature verification**: HMAC-SHA256
2. **Timestamp check**: Must be within last 5 minutes (anti-replay)
3. **Idempotency**: Track event ID globally; ignore duplicates
4. **Async processing**: Queue webhook for processing, return 200 immediately

---

## HEALTH CHECK PROTOCOL

### Synthetic Health Ping

**Frequency**: Every 6 hours per connection

**Payload**:
```
GET /me or equivalent
Parameters: { access_token }
```

**Expected Response**: HTTP 200 + user/account data

**On Failure**:
- Attempt token refresh (if available)
- If refresh fails: Mark connection "attention"
- Send notification to user: "Your [Platform] connection needs attention"

---

## SECRETS & KEY MANAGEMENT

### Encryption

**Algorithm**: AES-256-GCM
**Key Storage**: AWS KMS (or Secrets Manager alternative)
**Rotation**: Quarterly

**Pattern**:
```
encrypted_token = AES256_GCM_ENCRYPT(token, kmsKey, nonce)
storage = {
  access_token_encrypted: encrypted_token,
  iv: nonce,
  auth_tag: tag
}
```

### Scopes Audit

**On Connection Created**:
- Fetch granted scopes from platform
- Store in `connections.scopes` (array)
- Compare to required scopes
- If missing: Log warning, add to reconnect prompt

**On Token Refresh**:
- Fetch scopes again
- If changed: Update `connections.scopes`
- If missing required scope: Escalate to user

---

## PERFORMANCE TARGETS

| Metric | Target | SLO |
|--------|--------|-----|
| Publish latency (p95) | <500ms | 99.5% |
| Token refresh latency | <200ms | 99.5% |
| Health check latency | <300ms | 99.5% |
| Queue processing (p95) | <1s per job | 99% |
| Token refresh success rate | >99% | - |
| Publish success rate (1st attempt) | >95% | - |
| Auth error recovery (MTTR) | <2h (manual reconnect) | - |

---

## DEAD LETTER QUEUE (DLQ) PATTERN

**When to send to DLQ**:
- Max retries exhausted
- Unretryable error (auth, validation)
- Job age exceeds 7 days

**DLQ Record**:
```json
{
  "jobId": "UUID",
  "reason": "max_retries_exhausted | unretryable_error | expired",
  "errorCode": "string",
  "errorMessage": "string (sanitized)",
  "lastAttempt": "ISO8601",
  "payload": "original job payload",
  "attempts": 4
}
```

**Manual Retry Process**:
1. Human reviews DLQ record
2. Confirms user wants to retry
3. Creates new job with new `idempotencyKey`
4. Enqueues for processing

---

## CHECKLIST: Before Implementing Any Connector

- [ ] Understand platform's OAuth flow and scopes
- [ ] Map required scopes → ConnectorInterface methods
- [ ] Identify rate limits (requests/minute, per-token buckets, etc.)
- [ ] List all webhook event types we care about
- [ ] Document platform-specific fields (e.g., Instagram requires Business Account)
- [ ] Test in platform's sandbox/testing environment first
- [ ] Implement token refresh BEFORE expiry
- [ ] Implement error classification for all HTTP status codes
- [ ] Add synthetic health check endpoint
- [ ] Add logging to every function
- [ ] Write unit tests for success + failure paths
- [ ] Write integration tests with sandbox account

---

**Version**: 1.0
**Last Updated**: November 11, 2025
**Owner**: Engineering Team

