# 🔌 Meta (Facebook + Instagram) Connector Specification

**Platform**: Meta Graph API (v18.0)
**Scope**: Facebook Pages + Instagram Business Accounts
**Authentication**: OAuth 2.0
**Status**: Tier 1 MVP
**Priority**: 1 (Must-have, ~4-6 weeks)

---

## OAUTH FLOW

### Scopes Required

```
pages_manage_metadata              # Read/write page metadata
pages_read_engagement              # Read post engagement metrics
pages_manage_posts                 # Create/delete posts
instagram_business_manage_messages # Read/send messages
instagram_business_content_publish # Publish to IG feed, stories, reels
instagram_business_basic           # Basic IG account info
user_photos                        # User photo access
```

### OAuth Endpoints

| Step | HTTP Method | Endpoint | Purpose |
|------|-----|----------|---------|
| 1. Start | GET | `/dialog/oauth` | Generate auth URL with scopes |
| 2. Callback | POST | `/oauth/access_token` | Exchange code for token |
| 3. Refresh | GET | `/oauth/access_token` | Exchange refresh token for new token |
| 4. Verify | GET | `/me/permissions` | Check granted scopes |
| 5. Revoke | GET | `/{user-id}?access_token=...&method=DELETE` | Disconnect |

### Required Implementation Endpoints

```
POST /api/oauth/meta/start
  Payload: { tenantId }
  Response: { authUrl: "string" }

GET /api/oauth/meta/callback
  Query: { code, state, error }
  Response: Redirect to /linked-accounts?platform=meta&success=true

POST /api/oauth/meta/refresh
  Payload: { connectionId }
  Response: { ok: boolean, accessToken?: string, expiresAt?: number }
```

---

## ACCOUNT FETCHING

### Endpoints

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| GET | `/me/accounts` | List Facebook Pages | `{ data: [{ id, name, access_token }] }` |
| GET | `/{page-id}/instagram_business_account` | Get IG account for page | `{ id, name, username, profile_picture_url }` |
| GET | `/me/permissions` | Check granted scopes | `{ data: [{ permission, status }] }` |

### Account Payloads to Store

```
Connection Record:
{
  external_id: "page_id or ig_business_id",
  account_name: "Page Name or Account Name",
  platform: "meta",
  type: "page" | "instagram_account",
  scopes: ["pages_manage_posts", ...],
  access_token_encrypted: Buffer,
  refresh_token_encrypted: Buffer,
  expires_at: Date,
  profile_url: "https://facebook.com/{id}" or "https://instagram.com/{username}",
  profile_image_url: "https://..."
}
```

---

## PUBLISHING

### Supported Formats

- Post (Facebook Feed)
- Story (Instagram)
- Reel (Instagram, video required)
- Carousel (Facebook + Instagram, multiple images)
- Video (Facebook + Instagram)

### Create Post Endpoint

```
POST /{account-id}/feed

Payload:
{
  message: "string (caption)",
  picture: "url (optional, for link preview)",
  link: "url (optional)",
  type: "photo" | "video" | "status",
  access_token: "string"
}

Response:
{
  id: "post_id",
  post_url: "https://facebook.com/..." (if available)
}
```

### Instagram Post Endpoint

```
POST /{ig-account-id}/media

Payload:
{
  image_url: "url (optional for photo)",
  video_url: "url (optional for video)",
  caption: "string",
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL",
  product_tags: [{ product_id, x, y }] (optional),
  access_token: "string"
}

Response:
{
  id: "media_id"
}
```

### Schedule Post Endpoint

```
POST /{page-id}/feed

Payload:
{
  message: "string",
  published: false,
  scheduled_publish_time: number (Unix timestamp in seconds),
  access_token: "string"
}

Response:
{
  id: "scheduled_post_id"
}

Constraints:
- Must be in future (not past)
- Maximum 90 days in advance
- Facebook/IG only (no Twitter, etc.)
```

### Delete Post Endpoint

```
DELETE /{post-id}
  Query: { access_token }
  Response: { success: true }
```

---

## ANALYTICS

### Endpoints

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| GET | `/{post-id}/insights` | Post-level metrics | `{ impressions, engagement, reach, video_views }` |
| GET | `/{page-id}/insights` | Page-level metrics | `{ page_impressions, page_engaged_users, page_post_engagements }` |

### Fields to Fetch

```
Per-Post Insights:
- impressions: number
- engagement: number (likes + comments + shares)
- reach: number (unique users)
- video_views: number (if video)
- video_average_view_duration: number (seconds)

Page-Level Insights (daily):
- page_impressions: number
- page_engaged_users: number
- page_post_engagements: number
```

### Storage

```
Analytics Record:
{
  connection_id: UUID,
  post_id: "external post ID",
  period_start: Date,
  period_end: Date,
  impressions: number,
  engagements: number,
  reach: number,
  shares: number,
  comments: number,
  likes: number,
  saves: number,
  video_views: number,
  video_duration_seconds: number
}
```

---

## WEBHOOKS

### Subscribe To Events

| Event | Fired When | Payload Fields | Action |
|-------|-----------|----------------|--------|
| `feed` | Post created/deleted | `item`, `created_time` | Track published posts |
| `permissions` | Scopes changed/revoked | `permissions` (array) | Update scopes, alert user |
| `page_change` | Page name/info changed | `changed_fields` | Update connection metadata |

### Webhook Receiver Endpoint

```
POST /api/webhooks/meta

Headers:
  X-Hub-Signature: "sha256=..."
  X-Hub-Signature-256: "sha256=..."

Body:
{
  object: "page" | "app" | "user",
  entry: [
    {
      id: "page_id",
      time: number,
      changes: [
        {
          field: "feed" | "permissions" | "page_change",
          value: {...}
        }
      ]
    }
  ]
}
```

### Signature Validation

```
Verify HMAC-SHA256(payload, app_secret) === X-Hub-Signature_256
```

---

## RATE LIMITS

### Tier Structure

```
Default tier: 3,500 / hour per token
Burst: Up to 450 requests in a 15-minute window

Bucket model:
- If you see 429 response:
  - Rate-Limit-Reset: (header) - when bucket refills
  - Back off for that duration
  - Retry after backoff
```

### Backoff Strategy

```
On 429 error:
1. Parse X-RateLimit-* headers (if present)
2. If header absent, use exponential backoff (1s, 3s, 9s, 27s)
3. Do NOT retry immediately
4. Track per-token (not global) to avoid cascading
```

---

## ERROR HANDLING

### Status Code Classification

| Status | Error Code | Classification | Action |
|--------|-----------|----------------|--------|
| 401 | invalid_token, expired_token | Auth error | Mark "attention" + reconnect |
| 403 | PERMISSION_DENIED, insufficient_permission | Permission error | Mark "attention" + reconnect |
| 404 | INVALID_PARAMETER | Not found | Fail, log, DLQ |
| 429 | RATE_LIMIT | Rate limit | Backoff + retry |
| 500, 502, 503, 504 | SERVER_ERROR | Server error | Exponential backoff + retry |
| 408 | TIMEOUT | Timeout | Retry |

### Common Errors

```
{ error: { code: 1, message: "An unknown error occurred" } }
  → Retry 3x, then fail

{ error: { code: 100, message: "Unsupported get request... /" } }
  → Wrong endpoint or deprecated, do not retry

{ error: { code: 190, message: "Invalid OAuth access token" } }
  → Auth error, mark connection "attention"

{ error: { code: 200, message: "Permissions error" } }
  → Permission error, reconnect required
```

---

## TOKEN MANAGEMENT

### Token Lifecycle

```
Initial token expires: 60 days (long-lived by default)
Refresh strategy: Refresh at T-7d, T-1d, T-12h before expiry
Refresh endpoint: /oauth/access_token?grant_type=fb_exchange_token

On Refresh Failure:
1. Wait 1 hour, retry (transient failures common)
2. If still failing after 6 hours: Mark connection "attention"
3. Notify user: "Your Meta connection needs attention"
4. Offer one-click Reconnect button
```

### Token Storage

```
Connection Table:
{
  access_token_encrypted: Buffer,
  refresh_token_encrypted: null (Meta doesn't use refresh tokens),
  expires_at: Date,
  last_refresh_at: Date,
  scopes: ["pages_manage_posts", ...],
  status: "healthy" | "expiring_soon" | "attention" | "revoked"
}
```

---

## HEALTH CHECK

### Synthetic Ping Endpoint

```
GET /me
  Query: { access_token, fields: "id,name" }
  Response: { id, name }

Frequency: Every 6 hours per connection
On failure: Attempt token refresh, mark "attention" if fails
```

---

## IMPLEMENTATION CHECKLIST

- [ ] Register Meta App in Developer Dashboard
- [ ] Get App ID, App Secret, and set Redirect URI
- [ ] Implement OAuth start → callback flow
- [ ] Implement account fetching (Pages + IG accounts)
- [ ] Implement create post (Feed)
- [ ] Implement create post (IG Feed, Stories, Reels)
- [ ] Implement schedule post
- [ ] Implement delete post
- [ ] Implement analytics fetch
- [ ] Implement webhook signature validation
- [ ] Implement webhook event parsing
- [ ] Implement token refresh with 7-day window
- [ ] Implement health check (synthetic ping)
- [ ] Implement error classification (401, 403, 429, 500, etc.)
- [ ] Implement retry logic (exponential backoff, max 4 attempts)
- [ ] Write unit tests (success + failure paths)
- [ ] Write integration tests with sandbox page
- [ ] Document all scopes, limits, and gotchas
- [ ] Set up logging (no tokens in logs)
- [ ] Set up rate-limit monitoring

---

## GOTCHAS & CONSTRAINTS

1. **Business Account Required**: Personal Facebook accounts can't use Graph API
2. **No Reel API for Publishing**: IG Reels can be scheduled but not published via API yet (timeline TBD)
3. **Product Tagging**: IG Reels don't support product tags via API (future feature)
4. **Story Deprecation**: Story API is deprecated; use Media endpoint
5. **Rate Limits Are Bucket-Based**: Not per-endpoint; shared across all calls
6. **Sandbox Limitations**: Test with real page + real IG account (no mock page available)
7. **App Deauthorization**: If user deauthorizes, you get webhook event (must handle gracefully)
8. **Page Tokens vs User Tokens**: Store page token for long-lived access (user tokens expire after 60 days)

---

## TESTING STRATEGY

### Unit Tests

- [ ] OAuth URL generation
- [ ] Code → token exchange
- [ ] Token refresh logic
- [ ] Account fetching + parsing
- [ ] Post creation payload validation
- [ ] Error classification (all status codes)
- [ ] Retry backoff calculation
- [ ] Webhook signature validation

### Integration Tests (Sandbox)

- [ ] OAuth callback flow end-to-end
- [ ] Create post → verify in Meta UI
- [ ] Schedule post → verify scheduled status
- [ ] Delete post → verify deletion
- [ ] Fetch analytics → verify metrics
- [ ] Webhook event → verify parsing + action
- [ ] Token refresh → verify new token works
- [ ] Rate limit 429 → verify backoff + retry

---

**Version**: 1.0
**Last Updated**: November 11, 2025
**Status**: Ready for Implementation

