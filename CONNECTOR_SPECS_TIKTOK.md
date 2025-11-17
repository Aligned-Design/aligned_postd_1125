# TikTok Connector Specifications

**Platform**: TikTok
**API Version**: v1 / Business Account API
**Documentation**: https://developers.tiktok.com/
**Status**: Ready for Implementation
**Effort**: 4-6 weeks (56-80 hours) - Complex multi-step video upload
**Note**: Requires sandbox approval (24-72 hours). Plan for delays.

---

## OAuth 2.0 Flow

### Required Scopes

```
user.info.basic         // Get user ID, username
user.info.profile       // Get full profile info
video.list              // List user's videos
video.create            // Upload/publish videos
video.publish           // Publish videos to feed
video.delete            // Delete videos
```

### OAuth Endpoints

1. **Authorization**: GET `https://www.tiktok.com/v1/oauth/authorize/`
   - Query: `client_key`, `response_type=code`, `scope`, `redirect_uri`, `state`
   - User redirected to TikTok login

2. **Token Exchange**: POST `https://open.tiktokapis.com/v1/oauth/token/`
   - Body: `client_key`, `client_secret`, `code`, `grant_type=authorization_code`, `redirect_uri`
   - Response: `access_token`, `expires_in`, `refresh_token`, `user_id`

3. **Token Refresh**: POST `https://open.tiktokapis.com/v1/oauth/token/`
   - Body: `client_key`, `client_secret`, `refresh_token`, `grant_type=refresh_token`
   - Response: New `access_token` + may return new `refresh_token`

4. **Revoke**: POST `https://open.tiktokapis.com/v1/oauth/revoke/`
   - Body: `client_key`, `client_secret`, `access_token`

---

## Account Fetching

### Get Authenticated User Info

**Endpoint**: GET `https://open.tiktokapis.com/v1/user/info/`

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Query Params**: `fields=open_id,union_id,union_id_v2,avatar_url,display_name,bio_description,avatar_large_url`

**Response**:
```json
{
  "data": {
    "user": {
      "open_id": "XXXXXXXXXXXXXX",
      "union_id": "XXXXXXXXXXXXXX",
      "union_id_v2": "XXXXXXXXXXXXXX",
      "avatar_url": "https://...",
      "display_name": "John Doe",
      "bio_description": "...",
      "avatar_large_url": "https://..."
    }
  }
}
```

**Purpose**: Validate token, get user ID for posting

---

### List User Videos

**Endpoint**: GET `https://open.tiktokapis.com/v1/video/list/`

**Headers**: `Authorization: Bearer {access_token}`

**Query Params**:
```
fields=id,create_time,modify_time,caption,like_count,comment_count,share_count,view_count
max_count=10
cursor=0
```

**Response**:
```json
{
  "data": {
    "videos": [
      {
        "id": "video_id_1",
        "create_time": 1699689600,
        "modify_time": 1699689600,
        "caption": "Amazing content! #viral",
        "like_count": 1250,
        "comment_count": 89,
        "share_count": 234,
        "view_count": 45000
      }
    ],
    "cursor": "next_page_cursor",
    "has_more": true
  }
}
```

---

## Publishing Endpoints

### Create Video Upload

**Endpoint**: POST `https://open.tiktokapis.com/v1/video/upload/init/`

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "source_info": {
    "source": "FILE_UPLOAD",
    "chunk_size": 5242880
  },
  "video_info": {
    "title": "My Awesome TikTok Video",
    "description": "Check this out! #marketing #business",
    "privacy_level": "PUBLIC"
  }
}
```

**Response**:
```json
{
  "data": {
    "upload_url": "https://up-...-tiktok.com/?...",
    "upload_id": "XXXXXXXXXXXXXX",
    "expire_at": 1699775000
  }
}
```

**Upload ID Lifetime**: 24 hours. Videos must be fully uploaded and published within this window.

---

### Upload Video Chunks

**Endpoint**: PUT to `upload_url` from previous step

**Headers**:
```
Content-Type: video/mp4
Content-Range: bytes {start}-{end}/{total}
```

**Process**:
1. Split video file into 5MB chunks
2. For each chunk: PUT chunk data with `Content-Range` header
3. Server responds 200 OK for each chunk
4. After final chunk, server confirms upload complete

**Example** (5MB file = 1 chunk):
```
PUT https://up-...-tiktok.com/?...
Content-Type: video/mp4
Content-Range: bytes 0-5242879/5242880

[binary video data]
```

**Response**: 200 OK (no body required)

---

### Publish Video (After Upload Complete)

**Endpoint**: POST `https://open.tiktokapis.com/v1/video/publish/`

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "source_info": {
    "source": "FILE_UPLOAD"
  },
  "post_info": {
    "title": "My Awesome TikTok Video",
    "description": "Check this out! #marketing #business",
    "disable_comment": false,
    "disable_duet": false,
    "disable_stitch": false,
    "privacy_level": "PUBLIC"
  },
  "upload_id": "UPLOAD_ID_FROM_INIT"
}
```

**Response**:
```json
{
  "data": {
    "video_id": "XXXXXXXXXXXXXX",
    "status": "PROCESSING_UPLOAD"
  }
}
```

**Status Flow**:
- PROCESSING_UPLOAD (1-5 minutes)
- PUBLISHED_SUCCESSFULLY (visible on TikTok)
- PUBLISH_FAILED (requires re-upload)

**Polling**: Check video status via `/v1/video/query/` endpoint every 30 seconds

---

### Query Video Status

**Endpoint**: GET `https://open.tiktokapis.com/v1/video/query/`

**Headers**: `Authorization: Bearer {access_token}`

**Query Params**: `ids=video_id_1,video_id_2&fields=id,status,create_time`

**Response**:
```json
{
  "data": {
    "videos": [
      {
        "id": "video_id_1",
        "status": "PUBLISHED_SUCCESSFULLY",
        "create_time": 1699689600
      }
    ]
  }
}
```

---

### Delete Video

**Endpoint**: POST `https://open.tiktokapis.com/v1/video/delete/`

**Headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "video_id": "XXXXXXXXXXXXXX"
}
```

**Response**:
```json
{
  "data": {
    "video_id": "XXXXXXXXXXXXXX"
  }
}
```

---

### Schedule Video (Delayed Publishing)

**Limitation**: TikTok's public API does **NOT** support scheduled posts. Workaround:
- Store video upload data in Bull queue with scheduled timestamp
- At scheduled time: Download video file → Upload via API → Publish
- Alternative: Use TikTok Creator Studio (browser) or premium publishing tools

**Recommended Approach**:
1. Save uploaded video to S3 with presigned URL
2. Schedule Bull job with s3_key, scheduled_time
3. At scheduled_time: Download from S3 → Upload to TikTok → Publish
4. Clean up S3 after publish

---

## Analytics Endpoints

### Get Video Analytics

**Endpoint**: GET `https://open.tiktokapis.com/v1/video/query/`

**Headers**: `Authorization: Bearer {access_token}`

**Query Params**:
```
ids=video_id_1
fields=id,like_count,comment_count,share_count,view_count,watch_time,profile_visits,follower_count,unique_visitors
```

**Response**:
```json
{
  "data": {
    "videos": [
      {
        "id": "video_id_1",
        "like_count": 5230,
        "comment_count": 450,
        "share_count": 1200,
        "view_count": 125000,
        "watch_time": 450000,
        "profile_visits": 8900,
        "follower_count": 2500,
        "unique_visitors": 45000
      }
    ]
  }
}
```

**Update Frequency**: Delayed by 1-3 hours (not real-time)

---

### Get Account Analytics

**Endpoint**: GET `https://open.tiktokapis.com/v1/user/stat/`

**Headers**: `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "data": {
    "user_stat": {
      "follower_count": 2500,
      "following_count": 450,
      "video_count": 23,
      "heart_count": 125000,
      "comment_count": 1200,
      "share_count": 850,
      "download_count": 2300
    }
  }
}
```

---

## Webhooks

### Supported Events

TikTok **DOES** support webhooks. Subscribe at https://developers.tiktok.com/app/webhooks

**Event Types**:
- `video.complete` - Video finished uploading/processing
- `video.publish.complete` - Video published successfully
- `video.delete` - Video deleted
- `creator.follow` - New follower
- `user.comment` - New comment on video
- `user.like` - New like on video
- `user.share` - New share of video

### Webhook Subscription

**Setup**: Configure webhook URL in TikTok Developer Dashboard
- Webhook URL: `https://yourapp.com/api/webhooks/tiktok`
- Verification token: Provided by TikTok
- Enable desired events

### Webhook Verification

**TikTok sends**:
```json
{
  "type": "webhook_verify",
  "challenge": "XXXXXXXXXXXXXX"
}
```

**Your response** (within 3 seconds):
```json
{
  "challenge": "XXXXXXXXXXXXXX"
}
```

### Webhook Event Format

**Incoming**:
```json
{
  "type": "video.publish.complete",
  "data": {
    "video_id": "XXXXXXXXXXXXXX",
    "video_status": "PUBLISHED_SUCCESSFULLY",
    "create_time": 1699689600,
    "timestamp": 1699689605
  },
  "signature": "HMAC_SHA256_SIGNATURE"
}
```

**Signature Validation**: HMAC-SHA256 with webhook secret (see `CONNECTOR_SPECS_SHARED.md`)

---

## Rate Limits

### Throttling Rules

- **General endpoints**: 60 requests per minute per app (not per user)
- **Video upload**: Parallel uploads allowed (test with 3-5 concurrent)
- **Video publish**: 1 publish per 5 seconds per user

**Response**: 429 Too Many Requests with `X-Rate-Limit-Reset` header (Unix timestamp)

**Backoff Strategy**: Use exponential backoff from `CONNECTOR_SPECS_SHARED.md`
- Base: 1 second
- Max: 60 seconds
- Formula: `1s × 2^attempt + random(0-1s)` up to 4 attempts

---

## Error Classification

| HTTP Code / Error | Type | Retryable | Action |
|----------|------|-----------|--------|
| 400 | Bad Request (invalid params) | ❌ No | Fail immediately, DLQ |
| 401 | Unauthorized | ❌ No | Mark connection "attention", trigger reconnect |
| 403 | Forbidden (scope/permission) | ❌ No | Mark connection "attention", manual intervention |
| 404 | Not Found | ❌ No | Video deleted, fail gracefully |
| 429 | Rate Limit | ✅ Yes | Backoff + retry (max 4 attempts) |
| 500, 502, 503, 504 | Server Error | ✅ Yes | Backoff + retry (max 4 attempts) |
| 408 | Timeout | ✅ Yes | Retry immediately (max 3 attempts) |

**TikTok-Specific Errors**:
- `UPLOAD_EXCEED_FILE_SIZE_LIMIT` (>1GB): Non-retryable, fail with DLQ
- `INVALID_VIDEO_FORMAT`: Non-retryable, return user error
- `PROCESSING_UPLOAD_TIMEOUT` (>24h): Mark upload_id expired, force re-upload
- `CHANNEL_BAN`: Non-retryable, mark connection "suspended"

---

## Token Management

### Token Lifecycle

- **Access Token**: 24-hour expiration (short-lived!)
- **Refresh Token**: 365-day expiration

### Refresh Strategy

**Refresh at**:
- T-1 hour before expiry (proactive, given short 24-hour window)
- T-30 min before expiry (secondary)
- Every 18 hours as safety measure

**Endpoint**: POST `https://open.tiktokapis.com/v1/oauth/token/`

**Request**:
```json
{
  "client_key": "YOUR_CLIENT_KEY",
  "client_secret": "YOUR_CLIENT_SECRET",
  "refresh_token": "STORED_REFRESH_TOKEN",
  "grant_type": "refresh_token"
}
```

**Response**:
```json
{
  "data": {
    "access_token": "NEW_TOKEN",
    "expires_in": 86400,
    "refresh_token": "NEW_OR_SAME_REFRESH_TOKEN"
  }
}
```

**Handle Refresh Failure**:
- If refresh fails (401, 403), mark connection "attention"
- User must re-authenticate
- Store new tokens in encrypted TokenVault

---

## Health Check Protocol

### Health Check Endpoint

**Endpoint**: GET `https://open.tiktokapis.com/v1/user/info/`

**Headers**: `Authorization: Bearer {access_token}`

**Schedule**: Every 6 hours per connection (+ every 1 hour if token expiring in 2 hours)

**Success**: HTTP 200 + valid user ID

**Failure Handling**:
1. First failure: Attempt token refresh
2. If refresh succeeds: Mark connection "healthy"
3. If refresh fails: Mark connection "attention" (user must reconnect)
4. Log event: `type: health_check_failure, platform: tiktok`

---

## Secrets & Key Management

### Store in TokenVault

All sensitive data encrypted with **AES-256-GCM** + AWS KMS:

```
tiktok_access_token_{tenant_id}_{connection_id}
tiktok_refresh_token_{tenant_id}_{connection_id}
```

### Rotation Policy

- Automatic refresh every 18 hours (short 24-hour token lifetime)
- AWS KMS key rotation: Annual (AWS managed)
- Monitor for refresh failures daily

---

## Performance Targets (SLOs)

| Operation | p95 Latency | Target | Notes |
|-----------|------------|--------|-------|
| Upload init | <200ms | <250ms | API call only |
| Upload chunks | <2s per chunk | <2.5s | Depends on video size + network |
| Publish | <500ms | <550ms | Initiate async processing |
| Status check | <300ms | <350ms | Poll every 30s until PUBLISHED |
| Delete | <300ms | <350ms | Immediate removal |
| Health check | <300ms | <350ms | GET /user/info |

---

## Dead Letter Queue (DLQ) Pattern

**Conditions for DLQ**:
1. Max retries exhausted (4 attempts for retryable errors)
2. Unretryable error (400, 401, 403, 404, upload_exceed_file_size, etc.)
3. Job age >7 days in queue
4. Upload_id expired (>24 hours old)

**DLQ Storage**:
```typescript
{
  job_id: UUID,
  tenant_id: UUID,
  connection_id: UUID,
  platform: "tiktok",
  action: "publish|delete|refresh",
  payload: {
    upload_id?: string,
    video_id?: string,
    video_file?: string,
    caption: string
  },
  error_code: "UPLOAD_EXCEED_FILE_SIZE_LIMIT|UNRETRYABLE_AUTH|...",
  error_message: "...",
  retry_count: 4,
  first_attempt: timestamp,
  last_attempt: timestamp,
  reason: "Max retries exceeded OR upload_id expired (>24 hours)"
}
```

**Human Review**: Escalate video uploads to DLQ daily (may indicate corrupt file or API issues)

---

## Implementation Checklist

- [ ] OAuth 2.0 flow (authorize → token exchange → refresh → revoke)
- [ ] User info fetching (GET /user/info)
- [ ] Video list fetching (GET /video/list/)
- [ ] Video upload init (POST /video/upload/init/)
- [ ] Chunk-based video upload (PUT upload_url with Content-Range)
- [ ] Publish video (POST /video/publish/)
- [ ] Poll video status (GET /video/query/) with backoff
- [ ] Delete video (POST /video/delete/)
- [ ] Schedule video workaround (S3 → Bull → Upload → Publish)
- [ ] Get video analytics (GET /video/query/ with metrics fields)
- [ ] Get account analytics (GET /user/stat/)
- [ ] Webhook subscription + verification + parsing
- [ ] Webhook signature validation (HMAC-SHA256)
- [ ] Error classification per table above
- [ ] Retry logic with exponential backoff
- [ ] Token refresh every 18 hours (short 24h window)
- [ ] Health check every 6 hours
- [ ] DLQ pattern for unrecoverable jobs
- [ ] Secrets encryption (AES-256-GCM + KMS)
- [ ] Logging with redaction (NO tokens/secrets)
- [ ] Unit tests (OAuth, upload, publish, status polling, delete, analytics)
- [ ] Integration tests (sandbox account upload/publish flow)

---

## Gotchas & Constraints

1. **Short Token Lifetime**: 24-hour access token expiration is aggressive. Refresh every 18 hours to avoid failures mid-upload. Implement T-1 hour, T-30min proactive refreshes.

2. **Chunked Upload Required**: Videos >100MB require chunked upload with Content-Range headers. Implement proper chunk handling.

3. **Upload ID Expiration**: Uploads expire after 24 hours. If upload incomplete, must restart with new upload_id.

4. **Status Polling Required**: Publish returns immediately with PROCESSING status. Must poll `/video/query/` to confirm PUBLISHED_SUCCESSFULLY.

5. **No Native Scheduling**: Public API does NOT support scheduled posts. Build workaround with S3 + Bull queue.

6. **Per-App Rate Limits**: Limits are 60 req/min per app (not per user). If 5 concurrent users, each gets 12 req/min share.

7. **Sandbox Approval**: Sandbox access typically takes 24-72 hours. Request early. Develop with mock responses while waiting.

8. **Video Format Constraints**:
   - Max file size: 1 GB
   - Recommended: <600 MB
   - Min duration: 15 seconds
   - Max duration: 10 minutes (varies by account)
   - Formats: MP4, MOV, AVI, WMV, WEBM
   - Codec: H.264 (video), AAC (audio)
   - Resolution: 720p recommended (1080p acceptable)

9. **Webhook Verification Timeout**: Must respond with challenge within 3 seconds. TikTok considers timeout as failed verification.

10. **Follower-Only API**: Some analytics require min 10k followers. Test with account that has followers.

---

## Testing Strategy

### Unit Tests

```typescript
// OAuth flow
- test('exchange code for access token')
- test('refresh token when <1 hour remaining')
- test('revoke token on disconnect')

// Video upload
- test('init upload session')
- test('split video into 5MB chunks')
- test('upload chunk with Content-Range header')
- test('publish video after upload complete')
- test('poll status until PUBLISHED_SUCCESSFULLY')

// Error handling
- test('retry on 429 (rate limit)')
- test('mark connection attention on 401')
- test('DLQ job on max retries')
- test('DLQ job on UPLOAD_EXCEED_FILE_SIZE')

// Analytics
- test('fetch video metrics')
- test('fetch account stats')
```

### Integration Tests (TikTok Sandbox)

```typescript
// Full workflows
- test('complete upload + publish flow')
- test('publish video with hashtags')
- test('delete published video')
- test('health check via /user/info')
- test('webhook verification challenge')
- test('parse webhook event + validate signature')
```

### Acceptance Tests (Pre-Launch)

- [ ] Create sandbox TikTok account
- [ ] Upload test video (>50MB, <600MB)
- [ ] Verify post appears on profile (may take 1-5 min)
- [ ] Verify edit caption (if supported)
- [ ] Verify delete functionality
- [ ] Verify token refresh succeeds
- [ ] Test with 3 concurrent uploads
- [ ] Verify error handling (disconnect, reconnect)

---

## Sandbox Account Setup

**Request via**: https://developers.tiktok.com/

1. Create TikTok Developer app
2. Request **sandbox access**
3. Receive sandbox credentials + sandbox account
4. Test OAuth flow with sandbox account
5. Test video upload + publish (sandbox videos public)
6. Request **production access** after validation

**Timeline**: Plan for 24-72 hour approval delay

---

## Next Steps

1. **Week 1**: Create database schema + TokenVault infrastructure
2. **Week 2**: Implement OAuth flow + token refresh (T-1h, T-30m logic)
3. **Week 3**: Implement video upload (init → chunks → publish → poll)
4. **Week 4**: Implement delete + error handling + DLQ
5. **Week 5**: Implement analytics + webhooks
6. **Week 6**: Testing + sandbox validation + launch

---

**Version**: 1.0
**Last Updated**: November 11, 2025
**Status**: Ready for Implementation
