# Environment Configuration Guide

Complete setup instructions for all platform integrations and API credentials for the POSTD platform.

## Table of Contents

1. [Core Services](#core-services)
2. [Social Media Platforms](#social-media-platforms)
3. [Environment File Setup](#environment-file-setup)
4. [Local Development](#local-development)
5. [Deployment](#deployment)

---

## Core Services

### Supabase (PostgreSQL + Auth)

**Purpose**: Database and authentication backend

**Setup Steps**:
1. Create account at https://supabase.com
2. Create a new project
3. Copy credentials:
   - **Project URL**: `https://[project-id].supabase.co`
   - **Anon Key**: Settings → API → Project API keys → `anon` / `public`
   - **Service Role Key**: Settings → API → Project API keys → `service_role`

**Environment Variables**:
```
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

**Notes**:
- Service role key is **secret** - never expose in client-side code
- Anon key is public but has RLS policies for security
- Database schema migrations are in `supabase/migrations/`

---

### OpenAI API

**Purpose**: GPT models for content generation and AI features

**Setup Steps**:
1. Create account at https://openai.com/api
2. Go to API Keys: https://platform.openai.com/api-keys
3. Create new secret key (save immediately - won't be shown again)

**Environment Variables**:
```
# Required
OPENAI_API_KEY=sk-[your-api-key]

# Optional: Override default models (see docs/AI_MODEL_CONFIG.md for details)
OPENAI_MODEL_TEXT=gpt-4o-mini          # Default text generation
OPENAI_MODEL_ADVANCED=gpt-4o           # Advanced reasoning
OPENAI_MODEL_CHEAP=gpt-4o-mini         # Background jobs
OPENAI_MODEL_EMBEDDING=text-embedding-3-small  # Embeddings
OPENAI_EMBEDDING_DIMENSIONS=512       # Embedding dimensions
```

**Default Models** (can be overridden via env vars):
- `gpt-4o-mini`: Default text generation (cost-effective, fast)
- `gpt-4o`: Advanced reasoning tasks (higher capability)
- `text-embedding-3-small`: Embeddings (modern, cost-effective)

**Cost Optimization**:
- Default models are optimized for cost/performance balance
- Use `OPENAI_MODEL_CHEAP` for background jobs
- Reduce `OPENAI_EMBEDDING_DIMENSIONS` for lower embedding costs
- See [AI Model Configuration](./AI_MODEL_CONFIG.md) for details

---

### Anthropic API (Claude)

**Purpose**: Advanced AI reasoning and analysis

**Setup Steps**:
1. Create account at https://console.anthropic.com
2. Go to API Keys section
3. Create new API key

**Environment Variables**:
```
ANTHROPIC_API_KEY=sk-ant-[your-api-key]

# Optional: Override default Claude model (defaults to agent-specific models)
ANTHROPIC_MODEL=claude-3-5-sonnet-latest  # Use this model for all agent types

# Optional: Force provider selection (auto/openai/anthropic)
AI_PROVIDER=auto  # Default: auto (prefers OpenAI if both available)
```

**Model Configuration**:
- Default models vary by agent type (see `server/workers/ai-generation.ts`)
- Can be overridden via `ANTHROPIC_MODEL` env var for all agent types
- Recommended: `claude-3-5-sonnet-latest` or `claude-3-5-sonnet-20241022` for production

**Provider Selection**:
- `AI_PROVIDER=auto` (default): Prefers OpenAI if both keys are set, falls back to Anthropic
- `AI_PROVIDER=openai`: Force OpenAI (will fail if `OPENAI_API_KEY` not set)
- `AI_PROVIDER=anthropic`: Force Anthropic (will fail if `ANTHROPIC_API_KEY` not set)

---

### Builder.io (No-Code UI System)

**Purpose**: Visual content builder and CMS integration

**Setup Steps**:
1. Create account at https://builder.io
2. Go to Account Settings → API Keys
3. Copy both keys

**Environment Variables**:
```
VITE_BUILDER_PUBLIC_KEY=[public-key]
BUILDER_PRIVATE_KEY=[private-key]
BUILDER_WEBHOOK_SECRET=[generate-random-string]
```

**Webhook Secret**:
- Generate random 32+ character string
- Use for verifying webhook signatures
- Set in Builder.io dashboard → Webhooks

---

### SendGrid (Email Service)

**Purpose**: Transactional and marketing emails

**Setup Steps**:
1. Create account at https://sendgrid.com
2. Go to Settings → API Keys
3. Create new API key with "Mail Send" permission

**Environment Variables**:
```
SENDGRID_API_KEY=SG.[your-api-key]
EMAIL_SERVICE_PROVIDER=sendgrid
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

**Notes**:
- Verify sender email domain before sending
- Can send up to 100 emails/day on free tier

---

### Socket.io (Real-Time Communication)

**Purpose**: WebSocket connections for live updates

**Environment Variables**:
```
SOCKETIO_CORS_ORIGIN=http://localhost:5173
SOCKETIO_RECONNECTION_DELAY=1000
SOCKETIO_RECONNECTION_DELAY_MAX=5000
```

**Configuration**:
- `CORS_ORIGIN`: Frontend URL (update for production)
- `RECONNECTION_DELAY`: Initial reconnect wait (ms)
- `RECONNECTION_DELAY_MAX`: Maximum reconnect wait (ms)

---

## Social Media Platforms

### Instagram (Meta)

**Purpose**: Schedule, publish, and analyze Instagram posts

**Setup Steps**:

1. **Create Business Account** (if not already):
   - Log in to Instagram
   - Go to Settings → Account type and tools → Switch to professional account
   - Select "Business" type

2. **Create Facebook App**:
   - Go to https://developers.facebook.com
   - Create App → Business
   - Name: "POSTD"
   - Skip quick start

3. **Get Instagram Business Account ID**:
   - Go to Instagramgraph API documentation
   - Use Graph API Explorer
   - Request: `GET /me?fields=ig_user_id`
   - Copy `ig_user_id` value

4. **Generate Access Token**:
   - Apps → Your App → Tools → Graph API Explorer
   - Select "User Token" with Instagram permissions
   - Copy the token

**Environment Variables**:
```
INSTAGRAM_BUSINESS_ACCOUNT_ID=[ig-user-id]
INSTAGRAM_ACCESS_TOKEN=[access-token]
```

**Permissions Required**:
- `instagram_business_read`
- `instagram_business_publish`
- `pages_manage_metadata`

**Token Renewal**:
- Tokens expire after 60 days
- Implement refresh logic or use long-lived tokens

---

### Facebook

**Purpose**: Cross-post content to Facebook pages

**Setup Steps**:

1. **Create Facebook App** (same as Instagram):
   - https://developers.facebook.com
   - Apps → Create App → Business

2. **Generate Page Access Token**:
   - Go to App → Products → Facebook Login
   - Settings → Basic → Copy App ID and App Secret
   - Use Graph API Explorer to get page token:
     - Endpoint: `GET /me/accounts`
     - Look for your page's `access_token`

3. **Get Facebook Page ID**:
   - Go to your Facebook page
   - Settings → Page Info → Copy Page ID

**Environment Variables**:
```
FACEBOOK_PAGE_ID=[page-id]
FACEBOOK_ACCESS_TOKEN=[page-access-token]
```

**Notes**:
- Use page-level token (more secure than user token)
- Token valid for 60 days
- Set up automatic token refresh

---

### Twitter/X

**Purpose**: Post content and track Twitter analytics

**Setup Steps**:

1. **Create Developer Account**:
   - Go to https://developer.twitter.com/en/portal
   - Apply for account (may require approval)

2. **Create App**:
   - Projects & Apps → Create App
   - Name: "POSTD"
   - Purpose: Content distribution

3. **Generate API Credentials**:
   - App Settings → Keys and tokens
   - Generate API Key (API Key)
   - Generate API Secret Key (API Secret Key)
   - Generate Bearer Token

4. **Get Account ID**:
   - Use API endpoint: `GET /2/users/me`
   - With Bearer token in header

**Environment Variables**:
```
TWITTER_API_KEY=[api-key]
TWITTER_API_SECRET=[api-secret]
TWITTER_BEARER_TOKEN=[bearer-token]
TWITTER_ACCOUNT_ID=[user-id]
```

**API Version**: Use Twitter API v2 (more powerful than v1.1)

**Rate Limits**:
- Post tweets: 50/day (basic tier)
- Upgrade for higher limits

---

### TikTok

**Purpose**: Schedule and publish TikTok content

**Setup Steps**:

1. **Create Business Account**:
   - Switch to Business account in TikTok settings
   - Go to Creator/Business Center

2. **Register TikTok App**:
   - Go to https://developer.tiktok.com
   - Register app in Developer Portal
   - Name: "POSTD"

3. **Get Credentials**:
   - App Info → Client Key and Client Secret
   - Copy Business Account ID from settings

4. **Get Access Token**:
   - Use OAuth 2.0 flow with client credentials
   - Or use TikTok's token generation endpoint

**Environment Variables**:
```
TIKTOK_BUSINESS_ACCOUNT_ID=[business-account-id]
TIKTOK_ACCESS_TOKEN=[access-token]
```

**Notes**:
- Requires business account verification
- May have posting restrictions initially
- TikTok API access requires formal approval

---

### LinkedIn

**Purpose**: Share content to LinkedIn and track engagement

**Setup Steps**:

1. **Create LinkedIn App**:
   - Go to https://www.linkedin.com/developers
   - Create app
   - Name: "POSTD"

2. **Get Organization ID**:
   - LinkedIn organization admin page
   - URL contains org ID: linkedin.com/company/[org-id]/
   - Or use API: `GET /me` → `localizedFirstName`

3. **Generate Access Token**:
   - App Auth tab → Create access token
   - Select scopes: `w_member_social`, `r_organization_social`

**Environment Variables**:
```
LINKEDIN_ORGANIZATION_ID=[org-id]
LINKEDIN_ACCESS_TOKEN=[access-token]
```

**Scopes Required**:
- `w_member_social`: Post on behalf of organization
- `r_organization_social`: Read organization posts

---

### Pinterest

**Purpose**: Pin content to Pinterest boards

**Setup Steps**:

1. **Convert to Business Account**:
   - Settings → Account type → Convert to business

2. **Create Pinterest App**:
   - Go to https://developers.pinterest.com
   - Create App
   - Name: "POSTD"

3. **Get Credentials**:
   - App Details → Copy App ID
   - Generate access token (OAuth 2.0)

4. **Get Business Account ID**:
   - API call: `GET /v5/user_account` with access token
   - Use returned `id`

**Environment Variables**:
```
PINTEREST_BUSINESS_ACCOUNT_ID=[account-id]
PINTEREST_ACCESS_TOKEN=[access-token]
```

**Permissions**:
- `pins:read_public`
- `pins:write_secret`
- `boards:read_all`

---

### YouTube

**Purpose**: Manage YouTube channel and track video analytics

**Setup Steps**:

1. **Create Google Cloud Project**:
   - Go to https://console.cloud.google.com
   - Create new project
   - Enable YouTube Data API v3

2. **Create OAuth 2.0 Credentials**:
   - APIs & Services → Credentials
   - Create OAuth 2.0 ID (Web application)
   - Authorized redirect URIs: `http://localhost:3000/oauth/youtube`

3. **Get Channel ID**:
   - Go to your YouTube channel
   - Settings → Advanced settings → Channel ID

4. **Generate API Key**:
   - Credentials → Create API Key (for server-to-server)
   - Restrict to YouTube Data API

**Environment Variables**:
```
YOUTUBE_CHANNEL_ID=[channel-id]
YOUTUBE_API_KEY=[api-key]
```

**Quotas**:
- Default quota: 10,000 units/day
- Uploading video = 1,600 units
- Getting metadata = 1 unit

---

### Google Business (Google My Business)

**Purpose**: Manage business profile and local SEO

**Setup Steps**:

1. **Create Google Cloud Project** (same as YouTube):
   - https://console.cloud.google.com

2. **Enable Google My Business API**:
   - APIs & Services → Enable APIs and Services
   - Search for "My Business Business API" or "Google My Business API"
   - Enable it

3. **Create Service Account**:
   - Credentials → Create Service Account
   - Grant role: Editor
   - Download JSON key file

4. **Get Account ID**:
   - Go to Google My Business dashboard
   - Account ID in URL: accounts/[account-id]

**Environment Variables**:
```
GOOGLE_BUSINESS_ACCOUNT_ID=[account-id]
GOOGLE_API_KEY=[api-key-from-service-account-json]
```

**Notes**:
- Usually requires verification by Google
- Can take 24-48 hours for approval
- Be cautious with permissions

---

### Snapchat

**Purpose**: Create and schedule Snap Stories and posts

**Setup Steps**:

1. **Create Snapchat Business Account**:
   - Switch to business account in Snapchat settings

2. **Register Snapchat App**:
   - Go to https://www.snapchat.com/business/content
   - Snapchat Ads Manager → Tools → API Management

3. **Create OAuth App**:
   - Create new app
   - Name: "POSTD"
   - Get Client ID and Secret

4. **Get Account ID**:
   - Account settings → Organization ID

**Environment Variables**:
```
SNAPCHAT_BUSINESS_ACCOUNT_ID=[account-id]
SNAPCHAT_ACCESS_TOKEN=[access-token]
```

**Permissions**:
- `snap_publish`
- `snap_audience_match`
- `snap_ads_account_manage`

---

## Environment File Setup

### Development (.env.local or .env)

```env
# Supabase
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# AI Providers
OPENAI_API_KEY=sk-[key]
ANTHROPIC_API_KEY=sk-ant-[key]
AI_PROVIDER=auto

# Application
NODE_ENV=development
PORT=8080
VITE_APP_URL=http://localhost:8080
VITE_API_BASE_URL=http://localhost:8080/api
CLIENT_URL=http://localhost:5173

# Builder.io
VITE_BUILDER_PUBLIC_KEY=[public-key]
BUILDER_PRIVATE_KEY=[private-key]
BUILDER_WEBHOOK_SECRET=[secret]

# Email
SENDGRID_API_KEY=SG.[key]
EMAIL_SERVICE_PROVIDER=sendgrid
EMAIL_FROM_ADDRESS=dev@example.com

# Social Media - Instagram
INSTAGRAM_BUSINESS_ACCOUNT_ID=[ig-id]
INSTAGRAM_ACCESS_TOKEN=[token]

# Social Media - Facebook
FACEBOOK_PAGE_ID=[page-id]
FACEBOOK_ACCESS_TOKEN=[token]

# Social Media - Twitter
TWITTER_API_KEY=[api-key]
TWITTER_API_SECRET=[api-secret]
TWITTER_BEARER_TOKEN=[bearer-token]
TWITTER_ACCOUNT_ID=[account-id]

# Social Media - TikTok
TIKTOK_BUSINESS_ACCOUNT_ID=[account-id]
TIKTOK_ACCESS_TOKEN=[token]

# Social Media - LinkedIn
LINKEDIN_ORGANIZATION_ID=[org-id]
LINKEDIN_ACCESS_TOKEN=[token]

# Social Media - Pinterest
PINTEREST_BUSINESS_ACCOUNT_ID=[account-id]
PINTEREST_ACCESS_TOKEN=[token]

# Social Media - YouTube
YOUTUBE_CHANNEL_ID=[channel-id]
YOUTUBE_API_KEY=[api-key]

# Social Media - Google Business
GOOGLE_BUSINESS_ACCOUNT_ID=[account-id]
GOOGLE_API_KEY=[api-key]

# Social Media - Snapchat
SNAPCHAT_BUSINESS_ACCOUNT_ID=[account-id]
SNAPCHAT_ACCESS_TOKEN=[token]

# Socket.io
SOCKETIO_CORS_ORIGIN=http://localhost:5173
SOCKETIO_RECONNECTION_DELAY=1000
SOCKETIO_RECONNECTION_DELAY_MAX=5000

# Web Crawling
CRAWL_MAX_PAGES=50
CRAWL_TIMEOUT_MS=30000
CRAWL_USER_AGENT=POSTDBot/1.0 (+contact: hello@aligned-by-design.com)

# Monitoring (Optional)
SENTRY_DSN=[sentry-dsn]
ENABLE_SENTRY=false
```

### Production (.env.production)

Use the same variables but with production URLs and tokens:

```env
# Update URLs for production domain
VITE_APP_URL=https://yourdomain.com
VITE_API_BASE_URL=https://yourdomain.com/api
CLIENT_URL=https://yourdomain.com

# Socket.io production URL
SOCKETIO_CORS_ORIGIN=https://yourdomain.com

# Email from production domain
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# Enable monitoring in production
ENABLE_SENTRY=true

# Use production API keys for all services
# ...
```

---

## Local Development

### Quick Start

1. **Copy environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in credentials**:
   - Use development/sandbox credentials
   - Don't use production API keys locally
   - Use restricted test accounts for social media

3. **Start development server**:
   ```bash
   npm run dev
   ```

### Testing Platform Integrations

```bash
# Test Supabase connection
npm run test:db

# Test API endpoints
npm run test:api

# Test socket.io
npm run test:realtime
```

### Resetting Environment

If you get `Invalid API key` errors:

1. Verify credentials are correct
2. Check token expiration dates
3. Regenerate tokens if needed
4. Restart development server

---

## Deployment

### Vercel

1. **Add Environment Variables**:
   - Project Settings → Environment Variables
   - Add all production credentials
   - Ensure sensitive keys are marked as sensitive

2. **Supabase Connection**:
   - Linked Supabase project in Project Settings
   - Or add connection string as `DATABASE_URL`

3. **Build Command**:
   ```bash
   npm run build
   ```

4. **Deploy**:
   ```bash
   vercel deploy --prod
   ```

### Docker

1. **Build with environment**:
   ```bash
   docker build --build-arg VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
     --build-arg VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
     -t aligned-ai .
   ```

2. **Run container**:
   ```bash
   docker run -p 3000:3000 \
     -e SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
     -e OPENAI_API_KEY=$OPENAI_API_KEY \
     aligned-ai
   ```

### Environment Checklist

Before deploying to production:

- [ ] All required API keys are set
- [ ] URLs point to production endpoints
- [ ] Supabase project is in production mode
- [ ] All social media platforms are verified
- [ ] Email service is configured and verified
- [ ] Error monitoring (Sentry) is enabled
- [ ] Database backups are configured
- [ ] CORS is restricted to production domain
- [ ] Rate limiting is configured
- [ ] API keys have appropriate scopes/permissions

---

## Troubleshooting

### "Invalid API Key"

- Check key is copied completely (no spaces)
- Verify key hasn't been rotated/deleted
- Check environment variable name is exact
- Restart development server after changing env vars

### "CORS Error"

- Update `SOCKETIO_CORS_ORIGIN` to frontend URL
- Add frontend URL to Supabase CORS settings
- Check API is serving from correct origin

### "Social Media Token Expired"

- Regenerate access token for platform
- Update .env file
- Implement automatic token refresh for production

### "Database Connection Failed"

- Verify `VITE_SUPABASE_URL` is correct
- Check `VITE_SUPABASE_ANON_KEY` has required permissions
- Verify Supabase project is running
- Check database migrations are applied

---

## Deprecated Environment Variables

### USE_MOCKS (REMOVED)

**Status**: ❌ **REMOVED** - No longer used in production code

**Previous Usage**: This variable was previously used to enable mock data in some routes.

**Current Status**: 
- ✅ Removed from all production routes (`server/routes/milestones.ts`, `server/routes/agents.ts`)
- ✅ All routes now use real database queries
- ⚠️ If `USE_MOCKS=true` is set, it will be ignored (no effect)

**Action Required**: 
- Remove `USE_MOCKS` from your `.env` files
- It is no longer needed and has no effect
- The validation script (`server/utils/validate-env.ts`) will warn if `USE_MOCKS=true` is set in production

---

## Security Best Practices

1. **Never commit .env files** - Use .env.example template only
2. **Use separate credentials** - Dev, staging, and production keys
3. **Rotate keys regularly** - Every 90 days recommended
4. **Limit token permissions** - Only grant needed scopes
5. **Monitor API usage** - Set up alerts for unusual activity
6. **Use environment encryption** - In Vercel, mark secrets as sensitive
7. **Audit access** - Review who has access to credentials
8. **Disable unused integrations** - Remove tokens for unused platforms

---

## Support

For help with specific platforms:
- Instagram/Facebook: https://developers.facebook.com/docs
- Twitter/X: https://developer.twitter.com/en/docs
- TikTok: https://developers.tiktok.com
- LinkedIn: https://www.linkedin.com/developers
- YouTube: https://developers.google.com/youtube
- Supabase: https://supabase.com/docs
- SendGrid: https://sendgrid.com/docs
