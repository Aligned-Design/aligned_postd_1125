# Mailchimp Connector Specifications

**Platform**: Mailchimp
**API Version**: v3.0
**Documentation**: https://mailchimp.com/developer/marketing/api/
**Status**: Ready for Implementation
**Effort**: 1-2 weeks (16-24 hours) - Simplest integration, fewest endpoints

---

## API Key Authentication

### Setup (No OAuth)

Mailchimp uses **API Key authentication** (not OAuth 2.0):

1. Log in to Mailchimp account
2. Go to Profile → Extras → API Keys
3. Create API Key (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6-us1`)
4. Extract **data center prefix** from key suffix (e.g., `-us1` = US data center 1)
5. Store API Key in encrypted TokenVault

**API URL**: `https://{dc}.api.mailchimp.com/3.0/` (e.g., `https://us1.api.mailchimp.com/3.0/`)

---

## Account Verification

### Get Account Info

**Endpoint**: GET `https://{dc}.api.mailchimp.com/3.0/`

**Headers**:
```
Authorization: Basic {base64_encoded_key}
Content-Type: application/json
```

**Auth Encoding**: `base64_encode("anystring:{api_key}")` (username can be anything)

**Response**:
```json
{
  "account_name": "John Doe",
  "account_id": "123456789",
  "login": {
    "account_name": "John Doe",
    "email": "john@example.com"
  },
  "contact": {
    "company": "Example Corp",
    "address1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102",
    "country": "United States"
  }
}
```

**Purpose**: Validate API key, get account info

---

## List Management

### Get Lists

**Endpoint**: GET `https://{dc}.api.mailchimp.com/3.0/lists`

**Headers**: `Authorization: Basic {base64_encoded_key}`

**Query Params**: `count=100`

**Response**:
```json
{
  "lists": [
    {
      "id": "abc123def456",
      "name": "Email Marketing List",
      "contact": {
        "company": "Example Corp",
        "address1": "123 Main St",
        "city": "San Francisco"
      },
      "permission_reminder": "You are receiving this email because...",
      "use_archive_bar": true,
      "campaign_defaults": {
        "from_name": "Example Corp",
        "from_email": "marketing@example.com",
        "subject": "",
        "language": "en"
      },
      "notify_on_subscribe": "notify@example.com",
      "notify_on_unsubscribe": "notify@example.com",
      "date_created": "2023-01-15T10:30:00+00:00",
      "list_rating": 3,
      "email_type_option": true,
      "subscribe_url_short": "http://eepurl.com/abc123",
      "subscribe_url_long": "https://example.us1.list-manage.com/...",
      "beamer_address": "us1-123456789abcdef@inbox.mailchimp.com",
      "visibility": "pub",
      "modules": [],
      "stats": {
        "member_count": 1250,
        "unsubscribe_count": 45,
        "cleaned_count": 12,
        "member_count_since_send": 1250,
        "unopen_percentage": 65.4,
        "open_percentage": 25.3,
        "click_percentage": 8.2
      }
    }
  ],
  "total_items": 1
}
```

---

### Get Single List

**Endpoint**: GET `https://{dc}.api.mailchimp.com/3.0/lists/{list_id}`

**Headers**: `Authorization: Basic {base64_encoded_key}`

**Response**: Single list object (same structure as above)

---

## Campaign Operations

### Create Campaign

**Endpoint**: POST `https://{dc}.api.mailchimp.com/3.0/campaigns`

**Headers**:
```
Authorization: Basic {base64_encoded_key}
Content-Type: application/json
```

**Request Body**:
```json
{
  "type": "regular",
  "recipients": {
    "list_id": "abc123def456"
  },
  "settings": {
    "subject_line": "Welcome to Our Newsletter!",
    "preview_text": "Check out what's new this month...",
    "title": "November 2024 Newsletter",
    "from_name": "Marketing Team",
    "from_email": "marketing@example.com",
    "reply_to": "reply@example.com",
    "to_name": "*|FNAME|*"
  },
  "tracking": {
    "track_opens": true,
    "track_clicks": true,
    "track_ecommerce": false
  }
}
```

**Response**:
```json
{
  "id": "campaign123abc",
  "type": "regular",
  "create_time": "2024-11-11T10:30:00+00:00",
  "archive_url": "https://us1.mailchimp.com/campaigns/campaign123abc",
  "status": "save",
  "emails_sent": 0,
  "send_time": "",
  "content_type": "template",
  "recipients": {
    "list_id": "abc123def456"
  },
  "settings": {
    "subject_line": "Welcome to Our Newsletter!",
    "title": "November 2024 Newsletter",
    "from_name": "Marketing Team",
    "from_email": "marketing@example.com",
    "reply_to": "reply@example.com",
    "to_name": "*|FNAME|*"
  },
  "tracking": {
    "track_opens": true,
    "track_clicks": true,
    "track_ecommerce": false
  }
}
```

**Campaign Status**:
- `save`: Draft
- `paused`: Paused
- `scheduled`: Scheduled for future send
- `sending`: Currently sending
- `sent`: Sent

---

### Set Campaign Content

**Endpoint**: PUT `https://{dc}.api.mailchimp.com/3.0/campaigns/{campaign_id}/content`

**Headers**:
```
Authorization: Basic {base64_encoded_key}
Content-Type: application/json
```

**Request Body** (HTML content):
```json
{
  "html": "<html><body><h1>Welcome!</h1><p>Here's what's new this month...</p></body></html>"
}
```

**Or** (Template-based):
```json
{
  "template": {
    "id": 12345,
    "sections": {
      "header_section": "<h1>November News</h1>",
      "body_section": "<p>Check out our latest products...</p>",
      "footer_section": "<p>© 2024 Example Corp</p>"
    }
  }
}
```

**Response**: Content object

---

### Schedule Campaign

**Endpoint**: POST `https://{dc}.api.mailchimp.com/3.0/campaigns/{campaign_id}/actions/schedule`

**Headers**: `Authorization: Basic {base64_encoded_key}`

**Request Body**:
```json
{
  "schedule_time": "2024-11-15T14:30:00+00:00"
}
```

**Response**:
```json
{
  "status": "scheduled",
  "scheduled_at": "2024-11-15T14:30:00+00:00"
}
```

---

### Send Campaign Immediately

**Endpoint**: POST `https://{dc}.api.mailchimp.com/3.0/campaigns/{campaign_id}/actions/send`

**Headers**: `Authorization: Basic {base64_encoded_key}`

**Request Body**: Empty `{}`

**Response**:
```json
{
  "status": "sending",
  "emails_sent": 1250
}
```

---

### Pause Campaign

**Endpoint**: POST `https://{dc}.api.mailchimp.com/3.0/campaigns/{campaign_id}/actions/pause`

**Headers**: `Authorization: Basic {base64_encoded_key}`

**Request Body**: Empty `{}`

**Response**:
```json
{
  "status": "paused"
}
```

---

### Resume Campaign

**Endpoint**: POST `https://{dc}.api.mailchimp.com/3.0/campaigns/{campaign_id}/actions/resume`

**Headers**: `Authorization: Basic {base64_encoded_key}`

**Request Body**: Empty `{}`

---

### Get Campaign Performance

**Endpoint**: GET `https://{dc}.api.mailchimp.com/3.0/campaigns/{campaign_id}`

**Headers**: `Authorization: Basic {base64_encoded_key}`

**Response** (includes stats):
```json
{
  "id": "campaign123abc",
  "status": "sent",
  "emails_sent": 1250,
  "create_time": "2024-11-11T10:30:00+00:00",
  "send_time": "2024-11-15T14:30:00+00:00",
  "settings": {
    "subject_line": "Welcome to Our Newsletter!",
    "title": "November 2024 Newsletter"
  },
  "tracking": {
    "opens": true,
    "clicks": true
  },
  "report_summary": {
    "opens": 325,
    "open_rate": "26.0%",
    "clicks": 85,
    "click_rate": "6.8%",
    "subscriber_clicks": 52,
    "hard_bounces": 8,
    "soft_bounces": 3,
    "unsubscribes": 2,
    "abuse_reports": 0,
    "forwards": 12,
    "facebook_likes": 0,
    "industriy_opens": "22.5%",
    "industry_clicks": "5.2%",
    "industry_unsubscribes": "0.3%",
    "industry_bounce_rate": "0.8%"
  }
}
```

---

## Contact Management

### Add Contact to List

**Endpoint**: POST `https://{dc}.api.mailchimp.com/3.0/lists/{list_id}/members`

**Headers**:
```
Authorization: Basic {base64_encoded_key}
Content-Type: application/json
```

**Request Body**:
```json
{
  "email_address": "subscriber@example.com",
  "status": "subscribed",
  "merge_fields": {
    "FNAME": "John",
    "LNAME": "Doe",
    "PHONE": "+1-800-123-4567"
  },
  "tags": ["vip", "early-adopter"]
}
```

**Response**:
```json
{
  "id": "member123abc",
  "email_address": "subscriber@example.com",
  "unique_email_id": "unique123abc",
  "email_type": "html",
  "status": "subscribed",
  "merge_fields": {
    "FNAME": "John",
    "LNAME": "Doe",
    "PHONE": "+1-800-123-4567"
  },
  "interests": {},
  "stats": {
    "avg_open_rate": 25.3,
    "avg_click_rate": 6.2
  },
  "ip_signup": "192.168.1.1",
  "timestamp_signup": "2024-11-11T10:30:00+00:00",
  "ip_opt": "192.168.1.1",
  "timestamp_opt": "2024-11-11T10:30:00+00:00",
  "member_rating": 4,
  "last_changed": "2024-11-11T10:30:00+00:00",
  "language": "en",
  "vip": false,
  "email_client": "Gmail",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "gmtoff": -8,
    "dstoff": -7,
    "country_code": "US",
    "timezone": "America/Los_Angeles"
  },
  "tags": [
    {
      "id": 1,
      "name": "vip"
    },
    {
      "id": 2,
      "name": "early-adopter"
    }
  ]
}
```

---

## Webhooks

### Webhook Events

Mailchimp **DOES** support webhooks. Configure at https://admin.mailchimp.com/

**Event Types**:
- `subscribe`: New subscriber
- `unsubscribe`: Subscriber unsubscribed
- `profile`: Subscriber profile updated
- `email`: Email sent (campaign)
- `click`: Link clicked in email
- `open`: Email opened
- `bounce`: Email bounced
- `cleaned`: Email cleaned (invalid)
- `upemail`: Email address updated
- `campaign`: Campaign status changed

### Webhook URL Setup

1. Go to Mailchimp admin → List settings → Webhooks
2. Add webhook URL: `https://yourapp.com/api/webhooks/mailchimp`
3. Enable desired events
4. Mailchimp will POST events to your URL

### Webhook Event Format

**Incoming** (e.g., subscribe event):
```json
{
  "type": "subscribe",
  "fired_at": "2024-11-11T10:30:00+00:00",
  "data": {
    "id": "member123abc",
    "email": "subscriber@example.com",
    "email_type": "html",
    "ip_opt": "192.168.1.1",
    "ip_signup": "192.168.1.1",
    "list_id": "abc123def456",
    "merges": {
      "EMAIL": "subscriber@example.com",
      "FNAME": "John",
      "LNAME": "Doe"
    }
  }
}
```

### Webhook Verification

Mailchimp includes no signature. Instead:
- Verify webhook URL is accessible + reachable
- Use IP whitelist filtering (Mailchimp publishes IPs)
- Store webhook URL in your database

---

## Rate Limits

### Throttling Rules

- **General API**: 10 requests per second per API key
- **Batch operations**: 500 contacts per request max

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
| 404 | Not Found | ❌ No | List/campaign deleted, fail gracefully |
| 429 | Rate Limit | ✅ Yes | Backoff + retry (max 4 attempts) |
| 500, 502, 503, 504 | Server Error | ✅ Yes | Backoff + retry (max 4 attempts) |
| 408 | Timeout | ✅ Yes | Retry immediately (max 3 attempts) |

---

## Secrets & Key Management

### Store in TokenVault

Encrypted with **AES-256-GCM** + AWS KMS:

```
mailchimp_api_key_{tenant_id}_{connection_id}
mailchimp_data_center_{tenant_id}_{connection_id}
```

### Rotation Policy

- Quarterly manual rotation (new API key)
- AWS KMS key rotation: Annual (AWS managed)

**Note**: Mailchimp API keys do NOT expire. They persist until revoked.

---

## Performance Targets (SLOs)

| Operation | p95 Latency | Target | Notes |
|-----------|------------|--------|-------|
| Verify API key | <300ms | <350ms | GET / endpoint |
| Get lists | <300ms | <350ms | List fetch |
| Create campaign | <500ms | <550ms | Sync response |
| Set content | <500ms | <550ms | HTML upload |
| Schedule campaign | <300ms | <350ms | Schedule request |
| Send immediately | <500ms | <550ms | Trigger send |
| Get campaign stats | <400ms | <450ms | Performance data |
| Add contact | <200ms | <250ms | Single subscriber |

---

## Dead Letter Queue (DLQ) Pattern

**Conditions for DLQ**:
1. Max retries exhausted (4 attempts)
2. Unretryable error (400, 401, 403, 404)
3. Job age >7 days in queue

**DLQ Storage**:
```typescript
{
  job_id: UUID,
  tenant_id: UUID,
  connection_id: UUID,
  platform: "mailchimp",
  action: "create_campaign|send|schedule|update_contact",
  payload: {
    list_id: string,
    campaign_id?: string,
    subject_line: string,
    email_address?: string
  },
  error_code: "UNRETRYABLE_AUTH|VALIDATION_ERROR|...",
  error_message: "...",
  retry_count: 4,
  first_attempt: timestamp,
  last_attempt: timestamp,
  reason: "Max retries exceeded"
}
```

---

## Implementation Checklist

- [ ] API key storage in TokenVault (encrypted)
- [ ] Account verification (GET / endpoint)
- [ ] List fetching (GET /lists)
- [ ] Create campaign (POST /campaigns)
- [ ] Set campaign content (PUT /campaigns/{id}/content)
- [ ] Schedule campaign (POST /campaigns/{id}/actions/schedule)
- [ ] Send immediately (POST /campaigns/{id}/actions/send)
- [ ] Pause/resume campaign (POST /campaigns/{id}/actions/pause|resume)
- [ ] Get campaign performance (GET /campaigns/{id})
- [ ] Add contact (POST /lists/{id}/members)
- [ ] Webhook subscription + parsing
- [ ] Webhook event handling (subscribe, unsubscribe, bounce, etc.)
- [ ] Error classification per table above
- [ ] Retry logic with exponential backoff
- [ ] Health check (GET / endpoint every 6 hours)
- [ ] DLQ pattern for unrecoverable jobs
- [ ] Secrets encryption (AES-256-GCM + KMS)
- [ ] Logging with redaction (NO API keys in logs)
- [ ] Unit tests (campaign creation, scheduling, contact add)
- [ ] Integration tests (real Mailchimp account)

---

## Gotchas & Constraints

1. **No OAuth**: API key authentication only. Users must generate & share API key. Less secure than OAuth. Consider OAuth when Mailchimp supports it.

2. **Data Center Extraction**: API URL includes data center prefix (e.g., `-us1`). Extract from API key suffix.

3. **Basic Auth Required**: All requests need `Authorization: Basic {base64_encode_key}`. Implement for every request.

4. **List ID Required**: Most operations require list ID. Pre-fetch and cache available lists.

5. **Template IDs**: If using templates, template IDs are account-specific. Can't assume portability across accounts.

6. **Email List Size**: Getting large lists may timeout. Use pagination (`count=100`, iterate with offsets).

7. **No Update Campaign After Send**: Once campaign status = "sending" or "sent", cannot update content. Must create new campaign.

8. **Merge Fields**: Custom merge fields must be configured in Mailchimp first. Can't create new merge fields via API.

9. **Rate Limits**: 10 req/sec is shared across all actions. Monitor and batch operations if needed.

10. **API Rate Limit Headers**: Response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`. Use for proactive backoff.

---

## Testing Strategy

### Unit Tests

```typescript
// Authentication
- test('verify API key + get account info')
- test('extract data center from API key')

// Campaign operations
- test('create campaign with list')
- test('set campaign content (HTML)')
- test('schedule campaign for future date')
- test('send campaign immediately')
- test('pause/resume campaign')
- test('get campaign performance metrics')

// Contact management
- test('add single contact to list')
- test('add contact with merge fields')

// Error handling
- test('retry on 429 (rate limit)')
- test('mark connection attention on 401')
- test('DLQ job on max retries')

// Webhooks
- test('parse subscribe webhook')
- test('parse unsubscribe webhook')
- test('parse open/click webhooks')
```

### Integration Tests (Real Mailchimp Account)

```typescript
// Full workflows
- test('create + schedule + send campaign')
- test('add contact + verify subscription')
- test('get campaign stats after send')
- test('receive + parse webhook events')
```

### Acceptance Tests (Pre-Launch)

- [ ] Create test list in Mailchimp
- [ ] Create campaign via API
- [ ] Set content via API
- [ ] Schedule + send via API
- [ ] Verify email received in test inbox
- [ ] Verify campaign metrics update
- [ ] Add contact via API
- [ ] Verify contact appears in list

---

## Next Steps

1. **Week 1**: Implement API key storage + account verification
2. **Week 2**: Implement campaign creation, scheduling, sending
3. **Week 3**: Implement contact management + webhooks
4. **Week 4**: Testing + documentation + launch

---

**Version**: 1.0
**Last Updated**: November 11, 2025
**Status**: Ready for Implementation
