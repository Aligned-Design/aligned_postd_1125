# API Integrations

This document tracks current integrations, a canonical architecture, environment/config needs, and a Phase 1 checklist.

## Current State

Below is an audit of integrations found in the codebase. Status values: Phase 1 ready, Partial, or Missing.

### Supabase (Auth, DB, Storage)
- Paths:
  - `server/lib/supabase.ts`
  - `client/lib/supabase.ts`, `client/supabase.ts`
  - Supabase SQL/migrations: `supabase/migrations/*`
- What it does:
  - Central DB access for brands, content, analytics, workflows, etc.
  - Auth and RLS (policies referenced in tests/docs).
  - Storage for assets (brand/media), referenced by brand guide and media flows.
- Status: Partial → core usage is present and stable, Phase 1-ready with RLS review.

### AI Providers (Advisor/Doc/Design Agents)
- Paths:
  - `server/routes/advisor.ts`, `server/routes/doc-agent.ts`, `server/routes/design-agent.ts`
  - Prompts/logic: `server/lib/ai/*`
- What it does:
  - AI endpoints for insights (advisor) and content/caption/design variants (doc/design).
  - Returns BFS/compliance metadata; supports retries and brand context.
- Status: Phase 1 ready (Doc/Design/Advisor wired to return consistent, typed payloads).

### Stripe (Billing/Subscriptions)
- Paths:
  - `server/routes/billing.ts`, `server/routes/billing-reactivation.ts`
  - `server/routes/webhooks/stripe.ts`
- What it does:
  - Billing endpoints and webhook handler stubs/flows for subscription lifecycle.
- Status: Partial → endpoints/webhook wiring exist; confirm live keys and DB updates.

### Email Providers
- Paths:
  - Mailchimp connector scaffold: `server/connectors/mailchimp/index.ts`
  - Templates/notes: `docs/PAYMENT_EMAIL_TEMPLATES.md`
- What it does:
  - Mailchimp: skeleton connector; transactional provider references in docs.
- Status: Partial (Mailchimp). Missing (Transactional provider wiring).

### Social / Content APIs
- Meta (FB/IG)
  - Paths: `server/connectors/meta/implementation.ts`
  - Status: Partial (connector exists, needs OAuth/token lifecycle + publish/list ops).
- LinkedIn
  - Paths: `server/connectors/linkedin/implementation.ts`, `CONNECTOR_SPECS_LINKEDIN.md`
  - Status: Partial (connector scaffold with specs).
- TikTok
  - Paths: `server/connectors/tiktok/index.ts`, `CONNECTOR_SPECS_TIKTOK.md`
  - Status: Partial (scaffold only).
- Google Business Profile
  - Paths: `server/connectors/gbp/index.ts`, `CONNECTOR_SPECS_GBP.md`
  - Status: Partial (scaffold only).
- Twitter/X
  - Paths: none specific (only references in types/UI); needs connector.
  - Status: Missing.
- Pinterest, YouTube
  - Paths: not implemented; planned in docs.
  - Status: Missing.

### CMS / Email tools
- Squarespace, WordPress
  - Paths: planned in docs (`CODEBASE_ARCHITECTURE_OVERVIEW.md`, integration specs).
  - Status: Missing (scaffold later).

### Canva
- Paths:
  - `server/lib/integrations/canva-client.ts`, `server/lib/integrations/canva/README.md`
  - `client/components/postd/integrations/CanvaIntegrationModal.tsx`, `client/lib/canva-utils.ts`
- What it does:
  - Client/modal scaffolding, server client stub.
- Status: Partial (Phase 1 scaffolding present).

## Integration Architecture

Proposed structure (aligned to existing “connectors” usage):

```
server/
  connectors/
    base.ts                      # base types/helpers
    meta/
      implementation.ts          # Meta FB/IG client + helpers
    linkedin/
      implementation.ts
    twitter/
      implementation.ts          # X client (scaffold)
    tiktok/
      index.ts                   # scaffold
    gbp/
      index.ts                   # scaffold for Google Business Profile
    mailchimp/
      index.ts                   # scaffold
  integrations/
    canva-client.ts              # existing

client/
  lib/
    channels.ts                  # canonical channels matrix (added)
```

This keeps “connectors” vendor-specific and reusable by routes/services. Any OAuth and token storage flows should be centralized (e.g., in `connections_db_service` or similar) and reused across connectors.

## Environment & Config

Add to `.env.example` (names are self-explanatory; comments included):

```
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE=

# AI Providers
OPENAI_API_KEY=        # or ANTHROPIC_API_KEY=
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Meta (Facebook/Instagram)
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=

# X (Twitter)
X_API_KEY=
X_API_SECRET=
X_BEARER_TOKEN=

# TikTok (scaffold)
TIKTOK_CLIENT_ID=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=

# Google Business Profile (scaffold)
GBP_CLIENT_ID=
GBP_CLIENT_SECRET=
GBP_REDIRECT_URI=

# Mailchimp (or transactional provider)
MAILCHIMP_API_KEY=
MAILCHIMP_SERVER_PREFIX=

# Canva
CANVA_CLIENT_ID=
CANVA_CLIENT_SECRET=
CANVA_REDIRECT_URI=
```

Per-brand OAuth credentials/tokens are typically stored in a `connections` or `brand_integrations` table. If missing, the minimum schema is:

```
-- Minimal brand connections table (example)
CREATE TABLE IF NOT EXISTS brand_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  provider text NOT NULL,               -- 'meta','linkedin','twitter','tiktok', etc.
  account_id text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Phase 1 Checklist

Legend: [ ] not started, [~] partial, [x] implemented

### Supabase
- [~] Auth roles and RLS policies defined for agency/brand/client users
- [x] Tables for brands, content, approvals, analytics snapshots (in use; continue hardening)
- [~] Storage bucket for brand assets (present; verify quotas/paths)

### Meta (Facebook/Instagram Business)
- [~] OAuth / long-lived tokens wired
- [ ] Endpoint: list pages/IG accounts per brand
- [ ] Endpoint: schedule/publish a basic post (image + caption)
- [ ] Endpoint: pull recent posts + metrics

### LinkedIn
- [~] Endpoint to publish a basic page update (connector scaffold exists)
- [ ] Endpoint to fetch recent company posts & analytics

### X (Twitter)
- [ ] Endpoint to publish a tweet with image
- [ ] Endpoint to fetch recent tweets for analytics

### TikTok (scaffold)
- [~] Client module placeholders for upload/authorization
- [ ] TODOs for real video upload logic

### Google Business Profile (scaffold)
- [~] Client placeholders for posts/offers
- [ ] TODOs for OAuth + mapping brand → GBP location

### AI / Doc Agent
- [x] `/api/ai/doc` endpoint exists
- [x] Brand kit/guardrails injected; BFS/compliance returned
- [x] Returns variants + metadata; user-friendly errors/logging

### Email (Mailchimp or transactional)
- [~] Mailchimp connector scaffold present
- [ ] Centralized `sendEmail` utility and templates for invites/approvals/failures

### Stripe
- [~] Client initialized + routes present
- [~] Checkout/billing portal scaffold
- [~] Webhook handler stub present; confirm DB update logic

### Canva (Phase 1 scaffolding)
- [x] Modal/UI + client stub
- [ ] OAuth/connect flow (stub)
- [ ] Save finished designs back into brand assets (stub)

## Testing Phase 1 Integrations

Local steps:

- Lint/tests:
  - `pnpm test` (some tests are legacy; run selectively)
  - `pnpm typecheck`

- Manual flows (dev):
  - Create brand → connect Meta (stub) → schedule a post (stub endpoint) → verify UI/log
  - Create draft → run AI Doc Agent → confirm BFS/compliance uses brand data
  - Invite a user → verify email send (or log in dev mode)
  - Create Stripe test subscription → confirm webhook updates a subscription field

Example scaffolded tests to start with:

- Meta publish mock (unit): verify request shape mapping to Meta endpoints
- AI Doc Agent: assert response includes `variants`, `brandContext`, `metadata`, BFS >= 0..1

---

## Notes & Next Steps

- Implement connector clients incrementally (Meta → LinkedIn → X), reusing token storage.
- Keep non-ready integrations behind feature flags.
- Expand analytics pullers once publish flows are stable. 


