# LinkedIn Connector Specifications

**Platform**: LinkedIn
**API Version**: v2
**Documentation**: https://learn.microsoft.com/en-us/linkedin/
**Status**: Ready for Implementation
**Effort**: 3-4 weeks (40-56 hours)

---

## OAuth 2.0 Flow

### Required Scopes

```
openid
profile
email
w_member_social  // Write to member timeline & shares
r_ad_campaigns   // Read advertising campaigns (optional, for future analytics)
r_ads            // Read ads (optional)
```

### OAuth Endpoints

1. **Authorization**: GET `https://www.linkedin.com/oauth/v2/authorization`
   - Query params: `client_id`, `redirect_uri`, `response_type=code`, `scope`, `state`

2. **Token Exchange**: POST `https://www.linkedin.com/oauth/v2/accessToken`
   - Body: `client_id`, `client_secret`, `code`, `redirect_uri`, `grant_type=authorization_code`
   - Response: `access_token` (expires in 60 days if not refreshed)

3. **Token Refresh**: POST `https://www.linkedin.com/oauth/v2/accessToken`
   - Body: `client_id`, `client_secret`, `refresh_token`, `grant_type=refresh_token`
   - Response: New `access_token` + optional new `refresh_token`

4. **Revoke**: POST `https://www.linkedin.com/oauth/v2/revoke`
   - Body: `token`, `client_id`, `client_secret`

---

## Account Fetching

### Get Authenticated User Profile

**Endpoint**: GET `https://api.linkedin.com/v2/me`

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "id": "XXXXXXXXXXXXXX",
  "localizedFirstName": "John",
  "localizedLastName": "Doe"
}
```

**Purpose**: Validate token, get user ID for later operations

---

### Get Company/Account List

**Endpoint**: GET `https://api.linkedin.com/v2/administratedDMFollowingEntities?q=creators`

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "paging": {
    "start": 0,
    "count": 10,
    "total": 5
  },
  "elements": [
    {
      "id": "urn:li:organization:XXXXX",
      "name": "My Company",
      "logo": "..."
    }
  ]
}
```

**Purpose**: List all organizations the user can post on behalf of (for B2B content)

---

### Get User Posts (Activity Feed)

**Endpoint**: GET `https://api.linkedin.com/v2/me/posts`

**Headers**: `Authorization: Bearer {access_token}`

**Query**: `count=10`, `start=0`

**Response**:
```json
{
  "elements": [
    {
      "id": "urn:li:activity:XXXXX",
      "created": 1699689600000,
      "lastModified": 1699689600000,
      "actor": "urn:li:person:XXXXX",
      "lifecycleState": "PUBLISHED",
      "state": "PUBLISHED"
    }
  ]
}
```

**Purpose**: Fetch recent posts from authenticated user's timeline

---

## Publishing Endpoints

### Post to Personal Timeline

**Endpoint**: POST `https://api.linkedin.com/v2/ugcPosts`

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "author": "urn:li:person:{USER_ID}",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.PublishText": {
      "text": "Check out this amazing article! #marketing #socialmedia"
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

**Response**:
```json
{
  "id": "urn:li:activity:XXXXX"
}
```

**Status Codes**:
- 201: Success
- 400: Invalid request (malformed JSON, missing fields)
- 401: Unauthorized (invalid/expired token)
- 403: Forbidden (insufficient permissions, scopes)
- 429: Rate limit exceeded

---

### Post to Organization Timeline

**Endpoint**: POST `https://api.linkedin.com/v2/ugcPosts`

**Request Body** (Modified for org):
```json
{
  "author": "urn:li:organization:{ORG_ID}",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.PublishText": {
      "text": "Exciting news from our team! #innovation"
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

---

### Post with Image/Document

**Endpoint**: POST `https://api.linkedin.com/v2/ugcPosts`

**Request Body** (with media):
```json
{
  "author": "urn:li:person:{USER_ID}",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.PublishContent": {
      "media": [
        {
          "status": "READY",
          "media": "urn:li:digitalmediaAsset:{ASSET_ID}"
        }
      ],
      "title": {
        "text": "Check out this infographic"
      },
      "description": {
        "text": "Here's a deep dive into Q4 performance metrics"
      }
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

**Pre-requisite**: Upload image via `/v2/assets` endpoint (see Media Upload section)

---

### Upload Image/Media

**Step 1**: Initialize upload

**Endpoint**: POST `https://api.linkedin.com/v2/assets?action=registerUpload`

**Request Body**:
```json
{
  "registerUploadRequest": {
    "recipes": ["urn:li:digitalmediaRecipe:feedshare_image"],
    "owner": "urn:li:person:{USER_ID}",
    "serviceRelationships": [
      {
        "relationshipType": "OWNER",
        "identifier": "urn:li:userGeneratedContent"
      }
    ]
  }
}
```

**Response**:
```json
{
  "value": {
    "mediaUploadHttpRequest": {
      "uploadUrl": "https://media.licdn.com/dms/image/upload?...",
      "headers": {...}
    },
    "asset": "urn:li:digitalmediaAsset:XXXXX"
  }
}
```

**Step 2**: Upload binary image

**Endpoint**: Use `uploadUrl` from Step 1 response

**Method**: PUT
**Content-Type**: `image/jpeg` (or appropriate MIME type)
**Body**: Raw image bytes

**Step 3**: Use returned `asset` URN in post creation (see above)

---

### Schedule Post

**Limitation**: LinkedIn API does **NOT** support scheduling posts. Posts must be:
- Published immediately (`lifecycleState: "PUBLISHED"`), OR
- Drafted (`lifecycleState: "DRAFT"`) for manual publishing later

**Workaround**:
- Store scheduled posts in Bull queue
- Use timestamp-based job scheduling
- Publish via API when scheduled time arrives
- Send notification to user for manual approval before auto-publish

---

### Delete Post

**Endpoint**: DELETE `https://api.linkedin.com/v2/ugcPosts/{POST_ID}`

**Headers**: `Authorization: Bearer {access_token}`

**Response**: 204 No Content (success)

**Note**: LinkedIn returns 204 even if post not found (idempotent)

---

## Analytics Endpoints

### Get Post Engagement

**Endpoint**: GET `https://api.linkedin.com/v2/ugcPosts/{POST_ID}?q=author`

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "id": "urn:li:activity:XXXXX",
  "created": 1699689600000,
  "lifecycleState": "PUBLISHED",
  "specificContent": {...}
}
```

**Limitation**: LinkedIn does **NOT** provide real-time engagement metrics (likes, comments, shares) via REST API. You must:
1. Use LinkedIn Analytics dashboard (browser-based)
2. Integrate with LinkedIn's `Analytics API` (limited availability, requires enterprise agreement)
3. Implement polling mechanism to track post performance manually

---

### Get Profile Views & Impressions

**Limitation**: LinkedIn does NOT expose general profile/post impressions via public API. Engagement metrics are only available through:
- LinkedIn Analytics Dashboard (manual)
- LinkedIn Ads API (for sponsored content only)
- Enterprise partnerships

**Alternative**: Track engagement indirectly via webhook subscriptions (see Webhooks section)

---

## Webhooks

### Supported Events

LinkedIn does **NOT** provide real-time webhooks for social posts (unlike Meta/TikTok). Instead:
- Use **LinkedIn's Webhooks for Enterprise** (requires B2B agreement)
- Or implement **polling mechanism** (check posts every 6-24 hours)

### Event Types (if using Enterprise webhooks)
- Share created
- Share commented
- Share liked
- Comment created on share
- User profile changed

---

## Rate Limits

### Throttling Rules

- **General API**: 300 requests per 60-second window per user
- **Batch endpoints**: 100 requests per 60-second window
- **POST operations**: 50 posts per month per LinkedIn mobile app

**Response**: 429 Too Many Requests with `Retry-After` header

**Backoff Strategy**: Use shared exponential backoff from `CONNECTOR_SPECS_SHARED.md`
- Base: 1 second
- Max: 60 seconds
- Formula: `1s × 2^attempt + random(0-1s)` up to 4 attempts

---

## Error Classification

| HTTP Code | Error Type | Retryable | Action |
|-----------|-----------|-----------|--------|
| 400 | Validation Error | ❌ No | Fail immediately, DLQ, review request format |
| 401 | Unauthorized | ❌ No | Mark connection "attention", trigger reconnect |
| 403 | Forbidden | ❌ No | Insufficient scopes, mark "attention", manual intervention |
| 404 | Not Found | ❌ No | Resource deleted, fail with DLQ |
| 429 | Rate Limit | ✅ Yes | Backoff + retry (max 4 attempts) |
| 500, 502, 503, 504 | Server Error | ✅ Yes | Backoff + retry (max 4 attempts) |
| 408 | Timeout | ✅ Yes | Retry immediately (max 3 attempts) |

---

## Token Management

### Token Lifecycle

- **Access Token**: 60-day expiration (LinkedIn standard)
- **Refresh Token**: Indefinite (until revoked or explicit expiration)

### Refresh Strategy

**Refresh at**:
- T-7 days before expiry (proactive)
- T-1 day before expiry (emergency refresh)
- T-12 hours before expiry (final check)

**Endpoint**: POST `https://www.linkedin.com/oauth/v2/accessToken`

**Request**:
```json
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "refresh_token": "STORED_REFRESH_TOKEN",
  "grant_type": "refresh_token"
}
```

**Response**:
```json
{
  "access_token": "NEW_TOKEN",
  "expires_in": 5184000,
  "refresh_token": "NEW_OR_SAME_REFRESH_TOKEN"
}
```

**Handle Refresh Failure**:
- If refresh fails (401, 403), mark connection "attention"
- User must re-authenticate via OAuth flow
- Store new tokens in encrypted TokenVault

---

## Health Check Protocol

### Health Check Endpoint

**Endpoint**: GET `https://api.linkedin.com/v2/me`

**Headers**: `Authorization: Bearer {access_token}`

**Schedule**: Every 6 hours per connection

**Success**: HTTP 200 + valid user ID

**Failure Handling**:
1. First failure: Attempt token refresh
2. If refresh succeeds: Mark connection "healthy"
3. If refresh fails: Mark connection "attention" (user must reconnect)
4. Log event: `type: health_check_failure, status: attention, platform: linkedin`

---

## Secrets & Key Management

### Store in TokenVault

All sensitive data encrypted with **AES-256-GCM** + AWS KMS:

```
linkedin_access_token_{tenant_id}_{connection_id}
linkedin_refresh_token_{tenant_id}_{connection_id}
```

### Rotation Policy

- Quarterly manual rotation (refresh tokens)
- Automatic refresh on T-7d, T-1d, T-12h schedule
- AWS KMS key rotation: Annual (AWS managed automatic)

---

## Performance Targets (SLOs)

| Operation | p95 Latency | Target | Notes |
|-----------|------------|--------|-------|
| Publish (text only) | <500ms | <550ms | Direct API call, no media upload |
| Publish (with image) | <2s | <2.5s | Includes media upload |
| Token refresh | <200ms | <250ms | Fast credential rotation |
| Health check | <300ms | <350ms | Lightweight GET request |
| Delete post | <300ms | <350ms | Immediate removal |

---

## Dead Letter Queue (DLQ) Pattern

**Conditions for DLQ**:
1. Max retries exhausted (4 attempts for retryable errors)
2. Unretryable error (400, 401, 403, 404)
3. Job age >7 days in queue

**DLQ Storage**:
```typescript
{
  job_id: UUID,
  tenant_id: UUID,
  connection_id: UUID,
  platform: "linkedin",
  action: "publish|delete|refresh",
  payload: {...},
  error_code: "UNRETRYABLE_AUTH|RATE_LIMIT_EXHAUSTED|VALIDATION_ERROR|...",
  error_message: "...",
  retry_count: 4,
  first_attempt: timestamp,
  last_attempt: timestamp,
  reason: "Max retries exceeded after 2 hours"
}
```

**Human Review**: Daily audit of DLQ, escalate critical failures

---

## Implementation Checklist

- [ ] OAuth 2.0 flow implemented (authorize → token exchange → refresh → revoke)
- [ ] User profile fetching (GET /me endpoint)
- [ ] Organization list fetching (GET /administratedDMFollowingEntities)
- [ ] Text post publishing (POST /ugcPosts with PublishText)
- [ ] Organization post publishing (change author to org URN)
- [ ] Image/document upload flow (POST /assets → PUT uploadUrl)
- [ ] Post deletion (DELETE /ugcPosts/{id})
- [ ] Error classification per table above
- [ ] Retry logic with exponential backoff (1s, 3s, 9s, 27s)
- [ ] Token refresh at T-7d, T-1d, T-12h
- [ ] Health check every 6 hours (GET /me)
- [ ] Webhook subscription (if Enterprise plan available)
- [ ] Polling fallback for engagement metrics (every 24 hours)
- [ ] DLQ pattern for unrecoverable jobs
- [ ] Secrets encryption (AES-256-GCM + KMS)
- [ ] Logging with redaction (NO tokens/secrets in logs)
- [ ] Unit tests (OAuth, publish, delete, refresh, error handling)
- [ ] Integration tests (mock API responses, error scenarios)

---

## Gotchas & Constraints

1. **No Scheduling API**: LinkedIn does NOT support native post scheduling. Implement workaround via Bull queue (schedule locally, publish at time).

2. **No Real-Time Engagement**: LinkedIn does NOT expose likes/comments/shares via REST API. Only available via:
   - LinkedIn Analytics Dashboard (manual)
   - LinkedIn Ads API (sponsored posts only)
   - Enterprise webhooks (requires B2B agreement)

3. **Image Upload Complexity**: Image upload is multi-step (register → get upload URL → PUT binary → use asset URN). Handle each step separately with error recovery.

4. **Enterprise vs Standard**: Some features (webhooks, analytics) require enterprise agreements or B2B account status.

5. **Refresh Token Rotation**: LinkedIn may issue new refresh tokens on each refresh. Always store the returned refresh token, not just the access token.

6. **Rate Limits Per User**: Rate limits are per user, not per app. If you have 10 connections, each gets its own 300-req/60s budget.

7. **Scope Limitations**: Without `w_member_social`, posts can only be drafted, not published. Without `r_liteprofile` (deprecated), user email not available.

8. **Sandbox Accounts**: LinkedIn Developer Sandbox is limited. Request production access early for real testing.

---

## Testing Strategy

### Unit Tests

```typescript
// OAuth flow
- test('exchange code for access token')
- test('refresh expired token')
- test('revoke token on disconnect')

// Publishing
- test('publish text-only post')
- test('publish with image attachment')
- test('publish as organization')
- test('handle validation error on blank text')

// Error handling
- test('retry on 429 (rate limit)')
- test('mark connection attention on 401')
- test('DLQ job on max retries')
```

### Integration Tests

```typescript
// Use LinkedIn Sandbox (LinkedIn provides test credentials)
- test('full OAuth flow with sandbox credentials')
- test('create and delete post')
- test('upload image and include in post')
- test('health check via /me endpoint')
- test('gracefully handle rate limits')
```

### Acceptance Tests (Pre-Launch)

- [ ] Manually post to LinkedIn via UI
- [ ] Verify post appears immediately (no delay)
- [ ] Verify edit/delete functionality
- [ ] Verify error handling (disconnect, reconnect)
- [ ] Test with multiple concurrent posts
- [ ] Verify tokens refresh without user action

---

## Next Steps

1. **Week 1**: Create database schema + TokenVault infrastructure
2. **Week 2**: Implement OAuth flow + account fetching
3. **Week 3**: Implement post publishing (text + images)
4. **Week 4**: Error handling + retry logic + health checks
5. **Week 5**: Testing + documentation + launch

---

**Version**: 1.0
**Last Updated**: November 11, 2025
**Status**: Ready for Implementation
