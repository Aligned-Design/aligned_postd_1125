# Google Business Profile (GBP) Connector Specifications

**Platform**: Google Business Profile (formerly Google My Business)
**API Version**: Google Business Profile API v1
**Documentation**: https://developers.google.com/my-business/content/overview
**Status**: Ready for Implementation
**Effort**: 2-3 weeks (24-40 hours) - Simpler than Meta/TikTok, fewer endpoints

---

## OAuth 2.0 Flow

### Required Scopes

```
https://www.googleapis.com/auth/business.manage  // Full access to GBP data
https://www.googleapis.com/auth/drive.readonly   // (Optional) For logo/image access
```

### OAuth Endpoints

1. **Authorization**: GET `https://accounts.google.com/o/oauth2/v2/auth`
   - Query: `client_id`, `redirect_uri`, `response_type=code`, `scope`, `state`, `access_type=offline`
   - `access_type=offline` is critical to get refresh token

2. **Token Exchange**: POST `https://oauth2.googleapis.com/token`
   - Body: `client_id`, `client_secret`, `code`, `grant_type=authorization_code`, `redirect_uri`
   - Response: `access_token`, `expires_in`, `refresh_token`

3. **Token Refresh**: POST `https://oauth2.googleapis.com/token`
   - Body: `client_id`, `client_secret`, `refresh_token`, `grant_type=refresh_token`
   - Response: New `access_token` + optional new `refresh_token`

4. **Revoke**: POST `https://oauth2.googleapis.com/revoke`
   - Body: `token` (access or refresh token)

---

## Account Fetching

### Get Authenticated User

**Endpoint**: GET `https://mybusiness.googleapis.com/v4/accounts`

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "accounts": [
    {
      "name": "accounts/1234567890",
      "accountName": "My Business Name",
      "type": "PERSONAL",
      "accountNumber": "1234567890",
      "permissionLevel": "OWNER"
    }
  ]
}
```

**Purpose**: Get account ID for subsequent API calls

---

### List Locations (Business Profiles)

**Endpoint**: GET `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations`

**Headers**: `Authorization: Bearer {access_token}`

**Query Params**: `pageSize=100`

**Response**:
```json
{
  "locations": [
    {
      "name": "accounts/1234567890/locations/5678901234",
      "displayName": "My Coffee Shop - Downtown",
      "businessType": "COFFEE_SHOP",
      "address": {
        "postalAddress": {
          "regionCode": "US",
          "languageCode": "en",
          "postalCode": "90210",
          "sortingCode": "",
          "administrativeArea": "CA",
          "locality": "Beverly Hills",
          "addressLines": ["123 Main Street"]
        }
      },
      "phoneNumbers": {
        "primaryPhone": "+1-800-123-4567"
      },
      "websiteUri": "https://example.com"
    }
  ]
}
```

**Purpose**: Get list of all locations user can manage

---

### Get Location Details

**Endpoint**: GET `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}`

**Headers**: `Authorization: Bearer {access_token}`

**Response**: Same structure as above with full location info

---

## Publishing Endpoints

### Create Post

**Endpoint**: POST `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/posts`

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "summary": "Join us for our 10% off anniversary sale! Limited time only.",
  "callToAction": {
    "actionType": "LEARN_MORE",
    "url": "https://example.com/anniversary"
  },
  "postType": "STANDARD",
  "media": [
    {
      "mediaFormat": "IMAGE",
      "sourceUrl": "https://example.com/image.jpg"
    }
  ]
}
```

**Response**:
```json
{
  "name": "accounts/1234567890/locations/5678901234/posts/9876543210",
  "postType": "STANDARD",
  "summary": "Join us for our 10% off anniversary sale! Limited time only.",
  "callToAction": {
    "actionType": "LEARN_MORE",
    "url": "https://example.com/anniversary"
  },
  "createTime": "2024-11-11T10:30:00Z",
  "updateTime": "2024-11-11T10:30:00Z"
}
```

**Valid Post Types**:
- `STANDARD`: Text + optional image post
- `EVENT`: Event promotion (requires eventData)
- `OFFER`: Special offer/coupon (requires offer details)
- `PRODUCT`: Product showcase (newer feature)

---

### Create Event Post

**Endpoint**: POST `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/posts`

**Request Body**:
```json
{
  "summary": "Grand Opening Celebration!",
  "postType": "EVENT",
  "eventData": {
    "title": "Grand Opening Celebration",
    "description": "Join us for our grand opening with special food, drinks, and entertainment!",
    "schedule": {
      "repeating_open_date_time": [
        {
          "open_day": "TUESDAY",
          "open_time": {
            "hours": 18,
            "minutes": 0
          },
          "close_day": "TUESDAY",
          "close_time": {
            "hours": 22,
            "minutes": 0
          }
        }
      ]
    }
  },
  "callToAction": {
    "actionType": "CALL",
    "url": "+1-800-123-4567"
  },
  "media": [
    {
      "mediaFormat": "IMAGE",
      "sourceUrl": "https://example.com/event.jpg"
    }
  ]
}
```

---

### Create Offer Post

**Endpoint**: POST `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/posts`

**Request Body**:
```json
{
  "summary": "Save 20% on all products this weekend only!",
  "postType": "OFFER",
  "offer": {
    "redeemOnlineUrl": "https://example.com/coupon-code-ABC123",
    "termsConditions": "Valid through November 12, 2024. Offer code: SAVE20",
    "couponCode": "SAVE20"
  },
  "callToAction": {
    "actionType": "LEARN_MORE",
    "url": "https://example.com/offer"
  }
}
```

---

### Update Post

**Endpoint**: PATCH `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/posts/{postId}`

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Query Params**: `updateMask=summary,callToAction`

**Request Body**:
```json
{
  "summary": "UPDATED: Join us for our 20% off anniversary sale! Limited time only.",
  "callToAction": {
    "actionType": "LEARN_MORE",
    "url": "https://example.com/anniversary-updated"
  }
}
```

**Response**: Updated post object

---

### Delete Post

**Endpoint**: DELETE `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/posts/{postId}`

**Headers**: `Authorization: Bearer {access_token}`

**Response**: 200 OK (no body)

---

### Get Posts

**Endpoint**: GET `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/posts`

**Headers**: `Authorization: Bearer {access_token}`

**Query Params**:
```
pageSize=100
orderBy=createTime desc
```

**Response**:
```json
{
  "posts": [
    {
      "name": "accounts/.../posts/123",
      "summary": "...",
      "createTime": "2024-11-11T10:30:00Z",
      "updateTime": "2024-11-11T10:30:00Z"
    }
  ]
}
```

---

## Analytics Endpoints

### Get Location Insights

**Endpoint**: GET `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/insights`

**Headers**: `Authorization: Bearer {access_token}`

**Query Params**:
```
startDate.year=2024
startDate.month=11
startDate.day=1
endDate.year=2024
endDate.month=11
endDate.day=11
```

**Response**:
```json
{
  "locationInsights": [
    {
      "metricType": "QUERIES_DIRECT",
      "totalValue": 150
    },
    {
      "metricType": "QUERIES_INDIRECT",
      "totalValue": 450
    },
    {
      "metricType": "VIEWS_MAPS",
      "totalValue": 2300
    },
    {
      "metricType": "VIEWS_SEARCH",
      "totalValue": 5600
    },
    {
      "metricType": "ACTIONS_PHONE",
      "totalValue": 23
    },
    {
      "metricType": "ACTIONS_WEBSITE",
      "totalValue": 78
    },
    {
      "metricType": "ACTIONS_DIRECTIONS",
      "totalValue": 45
    }
  ]
}
```

**Available Metrics**:
- `QUERIES_DIRECT`: Direct profile searches
- `QUERIES_INDIRECT`: Indirect searches
- `VIEWS_MAPS`: Profile views from Maps
- `VIEWS_SEARCH`: Profile views from Search
- `ACTIONS_PHONE`: Calls to business
- `ACTIONS_WEBSITE`: Website clicks
- `ACTIONS_DIRECTIONS`: Directions requests

---

### Get Post Insights

**Endpoint**: GET `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/posts/{postId}/insights`

**Headers**: `Authorization: Bearer {access_token}`

**Query Params**:
```
startDate.year=2024
startDate.month=11
startDate.day=1
```

**Response**:
```json
{
  "postInsights": [
    {
      "metricType": "POST_VIEWS",
      "totalValue": 1230
    },
    {
      "metricType": "POST_ACTIONS_CALL",
      "totalValue": 12
    },
    {
      "metricType": "POST_ACTIONS_WEBSITE",
      "totalValue": 45
    },
    {
      "metricType": "POST_ACTIONS_DIRECTION",
      "totalValue": 34
    }
  ]
}
```

---

## Webhooks

### GBP Webhooks Status

Google Business Profile **does NOT** provide real-time webhooks. Workaround:
- Implement polling mechanism
- Poll location insights every 6-24 hours
- Store results in database for trending analysis

**Future**: Google may enable webhooks. Check official docs for updates.

---

## Rate Limits

### Throttling Rules

- **General API**: Quota varies by project setup (typically 1000-10000 QPS)
- **GBP Specific**: 100 requests per 100 seconds per location

**Response**: 429 Too Many Requests

**Backoff Strategy**: Use exponential backoff from `CONNECTOR_SPECS_SHARED.md`
- Base: 1 second
- Max: 60 seconds
- Formula: `1s × 2^attempt + random(0-1s)` up to 4 attempts

---

## Error Classification

| HTTP Code | Error Type | Retryable | Action |
|-----------|-----------|-----------|--------|
| 400 | Bad Request | ❌ No | Fail immediately, DLQ |
| 401 | Unauthorized | ❌ No | Mark connection "attention", trigger reconnect |
| 403 | Forbidden | ❌ No | Insufficient permissions, mark "attention" |
| 404 | Not Found | ❌ No | Resource deleted, fail gracefully |
| 429 | Rate Limit | ✅ Yes | Backoff + retry (max 4 attempts) |
| 500, 502, 503, 504 | Server Error | ✅ Yes | Backoff + retry (max 4 attempts) |
| 408 | Timeout | ✅ Yes | Retry immediately (max 3 attempts) |

---

## Token Management

### Token Lifecycle

- **Access Token**: 3600 seconds (1 hour) expiration
- **Refresh Token**: Indefinite (until revoked or 6+ months no use)

### Refresh Strategy

**Refresh at**:
- T-5 minutes before expiry (proactive, given 1-hour window)
- T-1 minute before expiry (emergency)
- Every 50 minutes as safety measure

**Endpoint**: POST `https://oauth2.googleapis.com/token`

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
  "expires_in": 3600,
  "scope": "https://www.googleapis.com/auth/business.manage",
  "token_type": "Bearer"
}
```

**Handle Refresh Failure**:
- If refresh fails (401, 403), mark connection "attention"
- User must re-authenticate
- Store new tokens in encrypted TokenVault

---

## Health Check Protocol

### Health Check Endpoint

**Endpoint**: GET `https://mybusiness.googleapis.com/v4/accounts`

**Headers**: `Authorization: Bearer {access_token}`

**Schedule**: Every 6 hours per connection (+ every 45 min if token expiring in 1 hour)

**Success**: HTTP 200 + valid account data

**Failure Handling**:
1. First failure: Attempt token refresh
2. If refresh succeeds: Mark connection "healthy"
3. If refresh fails: Mark connection "attention" (user must reconnect)
4. Log event: `type: health_check_failure, platform: gbp`

---

## Secrets & Key Management

### Store in TokenVault

All sensitive data encrypted with **AES-256-GCM** + AWS KMS:

```
gbp_access_token_{tenant_id}_{connection_id}
gbp_refresh_token_{tenant_id}_{connection_id}
```

### Rotation Policy

- Quarterly manual rotation (refresh tokens)
- Automatic refresh on T-5min, T-1min schedule
- AWS KMS key rotation: Annual (AWS managed)

---

## Performance Targets (SLOs)

| Operation | p95 Latency | Target | Notes |
|-----------|------------|--------|-------|
| Create post | <500ms | <550ms | Synchronous API response |
| Update post | <500ms | <550ms | Sync response |
| Delete post | <300ms | <350ms | Quick removal |
| Get locations | <300ms | <350ms | List fetch |
| Get insights | <500ms | <600ms | May require aggregation |
| Token refresh | <200ms | <250ms | Fast credential rotation |
| Health check | <300ms | <350ms | GET /accounts |

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
  platform: "gbp",
  action: "publish|update|delete|refresh",
  payload: {
    location_id: string,
    post_type: "STANDARD|EVENT|OFFER",
    summary: string
  },
  error_code: "UNRETRYABLE_AUTH|VALIDATION_ERROR|...",
  error_message: "...",
  retry_count: 4,
  first_attempt: timestamp,
  last_attempt: timestamp,
  reason: "Max retries exceeded after 2 hours"
}
```

---

## Implementation Checklist

- [ ] OAuth 2.0 flow (authorize → token exchange → refresh → revoke)
- [ ] Account fetching (GET /accounts)
- [ ] Location list fetching (GET /locations)
- [ ] Location detail fetching (GET /locations/{id})
- [ ] Create standard post (POST /posts with summary)
- [ ] Create event post (POST /posts with eventData)
- [ ] Create offer post (POST /posts with offer)
- [ ] Update post (PATCH /posts with updateMask)
- [ ] Delete post (DELETE /posts/{id})
- [ ] Get posts (GET /posts with pagination)
- [ ] Get location insights (GET /insights with date range)
- [ ] Get post insights (GET /posts/{id}/insights)
- [ ] Error classification per table above
- [ ] Retry logic with exponential backoff
- [ ] Token refresh every 50 minutes (1-hour window)
- [ ] Health check every 6 hours
- [ ] Polling mechanism for insights (no webhooks available)
- [ ] DLQ pattern for unrecoverable jobs
- [ ] Secrets encryption (AES-256-GCM + KMS)
- [ ] Logging with redaction (NO tokens/secrets)
- [ ] Unit tests (OAuth, create/update/delete posts, insights)
- [ ] Integration tests (real GCP project + test locations)

---

## Gotchas & Constraints

1. **No Native Scheduling**: GBP API does NOT support scheduled posts. Implement workaround via Bull queue.

2. **No Real-Time Webhooks**: Polling required for insights. Update every 6-24 hours.

3. **Account/Location Hierarchy**: Must get account ID first, then location ID. Requests must include both.

4. **Short Token Lifetime**: 1-hour access token. Refresh every 50 minutes to avoid failures.

5. **updateMask Required**: When updating posts, must specify which fields to update via `updateMask` query param. Common: `updateMask=summary,callToAction`.

6. **Media URL Format**: Media must be publicly accessible URLs. No file upload endpoint. Pre-host images on CDN.

7. **Business Information Required**: Location must have complete business info (address, phone, hours) in GBP before posting. Can't create bare posts.

8. **Limited Post Formatting**: No rich text. Text only with optional media. No hashtags or mentions supported.

9. **Insight Delays**: Analytics data delayed by 24-48 hours. Not real-time.

10. **Inactive Business**: If business inactive >1 month, posts may not be visible. Verify location status before publishing.

---

## Testing Strategy

### Unit Tests

```typescript
// OAuth flow
- test('exchange code for access token')
- test('refresh token when <5 minutes remaining')
- test('revoke token on disconnect')

// Location operations
- test('fetch accounts')
- test('fetch locations for account')
- test('get specific location details')

// Post operations
- test('create standard post')
- test('create event post')
- test('create offer post')
- test('update post summary')
- test('delete post')
- test('list posts with pagination')

// Analytics
- test('fetch location insights')
- test('fetch post insights')

// Error handling
- test('retry on 429 (rate limit)')
- test('mark connection attention on 401')
- test('DLQ job on max retries')
```

### Integration Tests (GCP + Test Location)

```typescript
// Real API calls with test business
- test('complete post lifecycle: create → update → delete')
- test('create post with multiple locations')
- test('retrieve insights after post creation')
- test('health check via /accounts endpoint')
```

### Acceptance Tests (Pre-Launch)

- [ ] Create test location in GBP
- [ ] Publish test post via API
- [ ] Verify post appears in GBP UI (may take 1-5 min)
- [ ] Verify post can be edited
- [ ] Verify post can be deleted
- [ ] Verify location insights update (24-48 hour delay)
- [ ] Verify token refresh succeeds
- [ ] Test with 5 concurrent posts

---

## GCP Project Setup

**Required**:
1. Google Cloud Project with billing enabled
2. Google Business Profile API enabled
3. OAuth 2.0 credentials (web application)
4. Test location in Google Business Profile

**Steps**:
1. Go to https://console.cloud.google.com/
2. Create new project
3. Enable "Google Business Profile API"
4. Create OAuth 2.0 Client ID (web app)
5. Add redirect URI: `https://yourapp.com/api/oauth/gbp/callback`
6. Download credentials JSON

---

## Next Steps

1. **Week 1**: Create database schema + TokenVault
2. **Week 2**: Implement OAuth flow + account/location fetching
3. **Week 3**: Implement post publishing (standard, event, offer)
4. **Week 4**: Implement update/delete + error handling
5. **Week 5**: Implement insights + testing + launch

---

**Version**: 1.0
**Last Updated**: November 11, 2025
**Status**: Ready for Implementation
