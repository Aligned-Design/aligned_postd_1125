# Database Schema Diagram & Relationships

## Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CORE ENTITIES                                          │
├─────────────────────────────────────────────────────────────────────────────────┤

    ┌──────────────────┐
    │   auth.users     │
    │  (Supabase Auth) │
    │                  │
    │  - id (UUID)     │
    │  - email         │
    │  - role          │
    └────────┬─────────┘
             │ 1:M
             │ owns
             ▼
    ┌──────────────────┐
    │  brand_users     │         ┌─────────────────┐
    │                  ├────────►│  brands         │
    │  - id            │ M    1  │                 │
    │  - user_id (FK)  │         │  - id (UUID)    │
    │  - brand_id (FK) │         │  - tenant_id    │
    │  - role          │         │  - name         │
    └──────────────────┘         │  - posting_...  │
         (pivot)                 │  - timezone     │
                                 └────────┬────────┘
                                          │ 1:M
                                          │ has
                                          ▼
```

## Phase 6: Media Management

```
    ┌──────────────────────────────┐
    │     storage_quotas           │
    │                              │
    │  - id (UUID)                 │
    │  - brand_id (FK) ────────┐   │
    │  - limit_bytes: 5GB       │   │
    │  - warning_threshold: 80% │   │
    └──────────────────────────────┘
                                 
             ┌────────────────────┐
             │   media_assets     │
             │                    │
             │  - id (UUID)       │
             │  - brand_id (FK)   │
             │  - category        │
             │  - filename        │
             │  - path (Supabase) │
             │  - hash (SHA256)   │◄──── (Unique for duplicate detection)
             │  - url             │
             │  - thumbnail_url   │
             │  - metadata (JSONB)│◄────(width, height, tags, colors)
             │  - variants (JSONB)│◄────(multiple sizes)
             │  - used_in (TEXT[])│◄────(post IDs, email IDs)
             │  - usage_count     │
             │  - created_at      │
             │  - updated_at      │
             └────────┬───────────┘
                      │ 1:M
                      │ has
                      ▼
        ┌─────────────────────────────┐
        │   media_usage_logs          │
        │                             │
        │  - id (UUID)                │
        │  - asset_id (FK)            │
        │  - used_in (post:123)       │
        │  - used_by_user (UUID)      │
        │  - created_at               │
        └─────────────────────────────┘
        (Tracks reuse of assets)
```

## Phase 7: Publishing & Connections

```
    ┌─────────────────────────────────────────┐
    │   platform_connections                  │
    │   (OAuth Token Storage)                 │
    │                                         │
    │  - id (UUID)                            │
    │  - brand_id (FK) ──────────────────┐   │
    │  - platform (instagram|facebook...)│   │
    │  - account_id                      │   │
    │  - account_name                    │   │
    │  - access_token                    │   │
    │  - refresh_token                   │   │
    │  - token_expires_at                │   │
    │  - status (connected|expired|...)  │   │
    │  - last_verified_at                │   │
    │  UNIQUE(brand_id, platform) ◄──────── (One per platform)
    └─────────────────────────────────────────┘
             │ 1:M
             │
             ▼
    ┌─────────────────────────────┐
    │   publishing_jobs           │
    │                             │
    │  - id (UUID)                │
    │  - brand_id (FK)            │
    │  - content (JSONB)          │
    │  - platforms (TEXT[])       │◄── (instagram, facebook, linkedin...)
    │  - scheduled_at             │
    │  - status (pending|...)     │
    │  - retry_count              │
    │  - max_retries: 3           │
    │  - published_at             │
    │  - last_error               │
    │  - created_at               │
    └────────────┬────────────────┘
                 │ 1:M
                 │ creates
                 ▼
    ┌───────────────────────────────┐
    │   publishing_logs             │
    │   (Audit Trail)               │
    │                               │
    │  - id (UUID)                  │
    │  - job_id (FK)                │
    │  - brand_id (FK)              │
    │  - platform (TEXT)            │
    │  - status (published|failed)  │
    │  - attempt_number             │
    │  - platform_post_id           │
    │  - platform_post_url          │
    │  - error_code                 │
    │  - error_message              │
    │  - error_details (JSONB)      │
    │  - created_at                 │
    └───────────────────────────────┘
```

## Phase 8: Analytics

```
    ┌──────────────────────────┐
    │   analytics_metrics      │
    │                          │
    │  - id (UUID)             │
    │  - brand_id (FK)         │
    │  - platform              │
    │  - date                  │
    │  - metrics (JSONB):      │
    │    • reach               │
    │    • engagement          │
    │    • followers           │
    │    • engagementRate      │
    │    • impressions         │
    │  - metadata (JSONB)      │
    │  UNIQUE(brand_id,        │
    │    platform, date)       │
    └────────┬─────────────────┘
             │ 1:M
             ▼
    ┌──────────────────────────┐
    │ analytics_sync_logs      │
    │ (Operation Audit)        │
    │                          │
    │  - sync_type             │
    │  - status                │
    │  - items_synced          │
    │  - items_failed          │
    │  - duration_ms           │
    └──────────────────────────┘

    ┌──────────────────────────┐
    │  analytics_goals         │
    │                          │
    │  - id (UUID)             │
    │  - brand_id (FK)         │
    │  - metric (TEXT)         │
    │  - target (FLOAT)        │
    │  - current (FLOAT)       │
    │  - deadline              │
    │  - status (active|...)   │
    └──────────────────────────┘

    ┌──────────────────────────┐
    │   advisor_feedback       │
    │   (Learning System)      │
    │                          │
    │  - insight_id            │
    │  - category              │
    │  - type                  │
    │  - feedback (accepted|..)│
    │  - previous_weight       │
    │  - new_weight            │
    └──────────────────────────┘

    ┌──────────────────────────┐
    │     auto_plans           │
    │                          │
    │  - id (UUID)             │
    │  - brand_id (FK)         │
    │  - month                 │
    │  - plan_data (JSONB)     │
    │  - confidence            │
    │  - approved              │
    │  - published_count       │
    │  UNIQUE(brand_id, month) │
    └──────────────────────────┘
```

## Phase 9: Approvals & Compliance

```
    ┌──────────────────────────────────┐
    │    client_settings               │
    │                                  │
    │  - id (TEXT)                     │
    │  - client_id (TEXT)              │
    │  - brand_id (TEXT) (FK)          │
    │  - email_preferences (JSONB)     │◄── Default preferences
    │  - timezone                      │
    │  - language (en|es|fr|de)        │
    │  - unsubscribe_token (unique)    │◄── For unsubscribe links
    │  - unsubscribed_from_all         │
    │  - unsubscribed_types (TEXT[])   │
    │  UNIQUE(client_id, brand_id)     │
    └──────────────────────────────────┘

    ┌──────────────────────────────────┐
    │    post_approvals                │
    │                                  │
    │  - id (TEXT)                     │
    │  - brand_id (TEXT) (FK) ─────┐   │
    │  - post_id (TEXT)             │   │
    │  - status (pending|           │   │
    │    approved|rejected)         │   │
    │  - approved_at                │   │
    │  - approved_by                │   │
    │  - rejected_at                │   │
    │  - rejected_by                │   │
    │  - locked                     │   │
    │  UNIQUE(brand_id, post_id)    │   │
    └──────────────────────────────────┘
             │ 1:M                      
             │                         
             ▼                         
    ┌──────────────────────────────────┐
    │   escalation_events              │
    │                                  │
    │  - id (TEXT)                     │
    │  - approval_id (FK) ──────────┐  │
    │  - post_id                     │  │
    │  - rule_id (FK)                │  │
    │  - escalation_level (24h|48h..)│  │
    │  - status (pending|sent|...)   │  │
    │  - scheduled_send_at           │  │
    │  - sent_at                     │  │
    │  - resolved_at                 │  │
    │  - resolved_by                 │  │
    │  - delivery_attempt_count      │  │
    └──────────────────────────────────┘
             │ 1:M
             ▼
    ┌──────────────────────────────────┐
    │   escalation_history             │
    │   (Audit Trail)                  │
    │                                  │
    │  - id (TEXT)                     │
    │  - escalation_event_id (FK)      │
    │  - action (created|sent|..)      │
    │  - actor (user_id)               │
    │  - reason                        │
    │  - metadata (JSONB)              │
    └──────────────────────────────────┘

    ┌──────────────────────────────────┐
    │   escalation_rules               │
    │                                  │
    │  - id (TEXT)                     │
    │  - brand_id (TEXT) (FK) ─┐       │
    │  - rule_type (reminder_24h..)    │
    │  - trigger_hours                 │
    │  - target_type (approval|post)   │
    │  - escalate_to_role              │
    │  - notify_via (TEXT[])           │
    │  - enabled                       │
    │  - send_email                    │
    │  - send_slack                    │
    │  - respect_timezone              │
    └──────────────────────────────────┘

    ┌──────────────────────────────────┐
    │    audit_logs                    │
    │    (GDPR Compliance)             │
    │                                  │
    │  - id (TEXT)                     │
    │  - brand_id (TEXT) (FK)          │
    │  - post_id (TEXT)                │
    │  - actor_id (TEXT)               │
    │  - actor_email (TEXT)            │
    │  - action (APPROVED|REJECTED..)  │
    │  - metadata (JSONB)              │
    │  - ip_address                    │
    │  - user_agent                    │
    │  - created_at (immutable)        │
    └──────────────────────────────────┘
```

## Phase 9: Webhooks

```
    ┌──────────────────────────────────┐
    │   webhook_events                 │
    │                                  │
    │  - id (UUID)                     │
    │  - brand_id (TEXT) (FK)          │
    │  - provider (zapier|make|slack)  │
    │  - event_type (TEXT)             │
    │  - payload (JSONB)               │
    │  - idempotency_key (UNIQUE) ◄─── (Deduplication key)
    │  - status (pending|delivered|..)│
    │  - attempt_count                 │
    │  - max_attempts: 5               │
    │  - last_error                    │
    │  - delivered_at                  │
    │  - created_at                    │
    └──────────────────────────────────┘
             │ 1:M
             │
             ▼
    ┌──────────────────────────────────┐
    │   webhook_attempts               │
    │   (Retry History)                │
    │                                  │
    │  - id (UUID)                     │
    │  - event_id (FK)                 │
    │  - attempt_number                │
    │  - status (success|failed)       │
    │  - error                         │
    │  - response_code                 │
    │  - backoff_ms (exponential)      │
    │  - created_at                    │
    └──────────────────────────────────┘
```

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                           CLIENT REQUEST                                       │
│                          (React/Vite)                                          │
│                                │                                               │
│                                ▼                                               │
│                    ┌──────────────────────┐                                    │
│                    │   API Route Handler  │                                    │
│                    │  (server/routes/)    │                                    │
│                    └──────────┬───────────┘                                    │
│                               │                                                │
│                               ▼                                                │
│        ┌──────────────────────────────────────────────────────┐                │
│        │         Database Service Layer                       │                │
│        │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │                │
│        │  │dbClient  │  │analytics │  │publish  │            │                │
│        │  │          │  │DB        │  │ingDB    │            │                │
│        │  └──────────┘  └──────────┘  └──────────┘            │                │
│        └──────────┬───────────────────────────────┘            │                │
│                   │                                             │                │
│                   ▼                                             │                │
│        ┌──────────────────────────────────────────────────────┐│                │
│        │     Supabase (PostgreSQL)                            ││                │
│        │                                                      ││                │
│        │  • RLS Policies (brand isolation)                    ││                │
│        │  • JWT-based access control                          ││                │
│        │  • All 35+ tables with indexes                       ││                │
│        │  • Triggers for auto-increment, timestamps           ││                │
│        │  • Helper functions for complex operations           ││                │
│        └──────────────────────────────────────────────────────┘│                │
│                                                                 │                │
│        ┌──────────────────────────────────────────────────────┐│                │
│        │  Supabase Storage (brand-assets bucket)              ││                │
│        │  • Media files organized by brand                    ││                │
│        │  • Public read access                                ││                │
│        │  • Authenticated upload/delete                       ││                │
│        └──────────────────────────────────────────────────────┘│                │
│                                                                 │                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Multi-Tenancy Architecture

```
┌─────────────────────────────────────────────────┐
│         JWT Claims (from Supabase Auth)         │
│                                                 │
│  {                                              │
│    "sub": "user-id",                            │
│    "email": "user@example.com",                 │
│    "brand_id": "brand-uuid",                    │
│    "role": "admin|manager|viewer"               │
│  }                                              │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│         RLS Policy Enforcement                  │
│                                                 │
│  current_setting('jwt.claims.brand_id') ═══╗   │
│                              │              ║   │
│                              └─────┐        ║   │
│                                    ▼        ║   │
│  SELECT * FROM table WHERE      brand_id = current_brand
│                                    ║        ║
│                              ┌─────┴────────╫───┐
│                              │              ║   │
│                              ▼              ║   ▼
│                         ┌──────────┐        ║ ┌──────────┐
│                         │Brand A   │        ║ │Brand B   │
│                         │Tables    │        ║ │Tables    │
│                         └──────────┘        ║ └──────────┘
│                              │              ║
│                    (Only Brand A sees      (Only Brand B sees
│                     Brand A data)           Brand B data)
└──────────────────────────────────────────────────┘
```

---

**Notes:**
- All tables use UUID or TEXT primary keys
- Foreign keys enforce referential integrity
- RLS policies ensure data isolation
- Timestamps are automatically managed via triggers
- JSONB columns for flexible, nested data
- Indexes on frequently-queried columns for performance
