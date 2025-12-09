# Environment Variables Template

**Purpose**: This document contains the exact template for creating `.env.example` at the repository root.

**Usage**: Copy the contents below into a file named `.env.example` at the root of the repository.

**Note**: The `.env.example` file itself may be gitignored, but this template serves as the source of truth for all environment variables used in POSTD.

---

```env
# ============================================================================
# POSTD Platform - Environment Variables Template
# ============================================================================
# Copy this file to .env.local (for local development) or .env (for production)
# Fill in your actual credentials - DO NOT commit .env or .env.local to git
#
# Quick Start:
#   1. cp .env.example .env.local
#   2. Fill in your Supabase credentials (required)
#   3. Add AI provider keys (optional but recommended)
#   4. Add connector credentials as needed (optional)
# ============================================================================

# ============================================================================
# CORE SERVICES (REQUIRED)
# ============================================================================

# Supabase - Database and Authentication Backend
# Get these from: https://app.supabase.com → Your Project → Settings → API
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Note: Server code should use SUPABASE_URL (not VITE_SUPABASE_URL)
# VITE_* prefix is for client-side code only
SUPABASE_URL=https://your-project-ref.supabase.co

# ============================================================================
# APPLICATION CONFIG (REQUIRED)
# ============================================================================

# Node Environment
NODE_ENV=development

# Application Port (optional, defaults to 3000)
PORT=3000

# Application URLs
VITE_APP_URL=http://localhost:8080
VITE_API_BASE_URL=http://localhost:8080/api
CLIENT_URL=http://localhost:5173

# ============================================================================
# AI PROVIDERS (OPTIONAL - At least one recommended)
# ============================================================================

# OpenAI API Key
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-key-here

# Optional: Override default OpenAI models
# OPENAI_MODEL_TEXT=gpt-4o-mini
# OPENAI_MODEL_ADVANCED=gpt-4o
# OPENAI_MODEL_CHEAP=gpt-4o-mini
# OPENAI_MODEL_EMBEDDING=text-embedding-3-small
# OPENAI_EMBEDDING_DIMENSIONS=512

# Anthropic API Key (Claude)
# Get from: https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Optional: Override default Anthropic model
# ANTHROPIC_MODEL=claude-3-5-sonnet-latest

# AI Provider Selection (auto/openai/anthropic)
# Default: auto (prefers OpenAI if both available)
AI_PROVIDER=auto

# ============================================================================
# BUILDER.IO (OPTIONAL)
# ============================================================================

# Builder.io - No-Code UI System
# Get from: https://builder.io → Account Settings → API Keys
VITE_BUILDER_PUBLIC_KEY=your-builder-public-key-here
BUILDER_PRIVATE_KEY=your-builder-private-key-here
BUILDER_WEBHOOK_SECRET=your-webhook-secret-here

# ============================================================================
# EMAIL SERVICE (OPTIONAL)
# ============================================================================

# SendGrid - Transactional and Marketing Emails
# Get from: https://sendgrid.com → Settings → API Keys
SENDGRID_API_KEY=SG.your-sendgrid-key-here
EMAIL_SERVICE_PROVIDER=sendgrid
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# ============================================================================
# SOCKET.IO (OPTIONAL - For Real-Time Features)
# ============================================================================

SOCKETIO_CORS_ORIGIN=http://localhost:5173
SOCKETIO_RECONNECTION_DELAY=1000
SOCKETIO_RECONNECTION_DELAY_MAX=5000

# ============================================================================
# OAUTH CREDENTIALS - SOCIAL MEDIA PLATFORMS (OPTIONAL)
# ============================================================================

# Meta/Facebook/Instagram OAuth
# Get from: https://developers.facebook.com → Your App → Settings → Basic
META_APP_ID=your-meta-app-id-here
META_APP_SECRET=your-meta-app-secret-here
META_REDIRECT_URI=http://localhost:8080/api/auth/meta/callback

# Legacy Facebook/Instagram (for backward compatibility)
FACEBOOK_CLIENT_ID=your-facebook-client-id-here
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret-here
INSTAGRAM_CLIENT_ID=your-instagram-client-id-here
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret-here

# LinkedIn OAuth
# Get from: https://www.linkedin.com/developers/apps
LINKEDIN_CLIENT_ID=your-linkedin-client-id-here
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret-here
LINKEDIN_REDIRECT_URI=http://localhost:8080/api/auth/linkedin/callback

# X (Twitter) OAuth
# Get from: https://developer.twitter.com/en/portal/dashboard
# NOTE: We use X_* prefix to match the connector implementation (server/connectors/twitter/implementation.ts)
# The connector is named "X" to reflect the platform's rebranding from Twitter to X
X_CLIENT_ID=your-x-client-id-here
X_CLIENT_SECRET=your-x-client-secret-here
X_REDIRECT_URI=http://localhost:8080/api/auth/x/callback
X_API_KEY=your-x-api-key-here
X_API_SECRET=your-x-api-secret-here
X_BEARER_TOKEN=your-x-bearer-token-here

# TikTok OAuth
# Get from: https://developers.tiktok.com
TIKTOK_CLIENT_KEY=your-tiktok-client-key-here
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret-here
TIKTOK_REDIRECT_URI=http://localhost:8080/api/auth/tiktok/callback

# Google OAuth (for Google Business Profile - not yet implemented)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# ============================================================================
# SOCIAL MEDIA PLATFORM CREDENTIALS (OPTIONAL - Legacy/Alternative Auth)
# ============================================================================

# Instagram Business Account
INSTAGRAM_BUSINESS_ACCOUNT_ID=your-instagram-business-account-id-here
INSTAGRAM_ACCESS_TOKEN=your-instagram-access-token-here

# Facebook Page
FACEBOOK_PAGE_ID=your-facebook-page-id-here
FACEBOOK_ACCESS_TOKEN=your-facebook-access-token-here

# X (Twitter) API - Legacy naming (use X_* prefix instead)
# NOTE: For OAuth, use X_CLIENT_ID/X_CLIENT_SECRET (see OAuth Credentials section above)
# The following are legacy direct API credentials (not recommended for OAuth flows)
X_API_KEY=your-x-api-key-here
X_API_SECRET=your-x-api-secret-here
X_BEARER_TOKEN=your-x-bearer-token-here

# TikTok Business
TIKTOK_BUSINESS_ACCOUNT_ID=your-tiktok-business-account-id-here
TIKTOK_ACCESS_TOKEN=your-tiktok-access-token-here

# LinkedIn Organization
LINKEDIN_ORGANIZATION_ID=your-linkedin-organization-id-here
LINKEDIN_ACCESS_TOKEN=your-linkedin-access-token-here

# Pinterest Business
PINTEREST_BUSINESS_ACCOUNT_ID=your-pinterest-business-account-id-here
PINTEREST_ACCESS_TOKEN=your-pinterest-access-token-here

# YouTube
YOUTUBE_CHANNEL_ID=your-youtube-channel-id-here
YOUTUBE_API_KEY=your-youtube-api-key-here

# Google Business Profile (not yet implemented)
GOOGLE_BUSINESS_ACCOUNT_ID=your-google-business-account-id-here
GOOGLE_API_KEY=your-google-api-key-here

# Snapchat Business
SNAPCHAT_BUSINESS_ACCOUNT_ID=your-snapchat-business-account-id-here
SNAPCHAT_ACCESS_TOKEN=your-snapchat-access-token-here

# ============================================================================
# WEB CRAWLING (OPTIONAL)
# ============================================================================

CRAWL_MAX_PAGES=50
CRAWL_TIMEOUT_MS=30000
CRAWL_USER_AGENT=POSTDBot/1.0

# ============================================================================
# MONITORING & ERROR TRACKING (OPTIONAL)
# ============================================================================

# Sentry - Error Tracking
SENTRY_DSN=your-sentry-dsn-here
ENABLE_SENTRY=false

# ============================================================================
# DEPRECATED VARIABLES (DO NOT USE)
# ============================================================================

# USE_MOCKS - DEPRECATED: Mock data has been removed from production code
# Do not set this variable

# ============================================================================
# NOTES
# ============================================================================
#
# 1. Required Variables:
#    - VITE_SUPABASE_URL
#    - VITE_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
#    - NODE_ENV
#    - VITE_APP_URL
#    - VITE_API_BASE_URL
#
# 2. Server vs Client Variables:
#    - VITE_* prefix: Client-side only (exposed to browser)
#    - Non-VITE_*: Server-side only (never exposed to browser)
#    - SUPABASE_SERVICE_ROLE_KEY: NEVER expose to client (server-only)
#
# 3. For Production:
#    - Update all URLs to production domain
#    - Use production API keys
#    - Enable monitoring (ENABLE_SENTRY=true)
#    - Set NODE_ENV=production
#
# 4. For Local Development:
#    - Use development/sandbox credentials
#    - Don't use production API keys locally
#    - Use restricted test accounts for social media
#
# 5. See docs/ENVIRONMENT_SETUP.md for detailed setup instructions
# ============================================================================
```

---

## How to Use This Template

1. **Copy the template above** (everything between the code fences)
2. **Create `.env.example`** at the repository root:
   ```bash
   # At repository root
   cp docs/ENVIRONMENT_VARIABLES.md .env.example
   # Then edit .env.example to remove the markdown formatting, keeping only the env vars
   ```
3. **Or manually create** `.env.example` and paste the contents from the code block above

## Variable Categories

- **Required**: Must be set for the application to function
- **Optional**: Enhance functionality but not required
- **Deprecated**: Should not be used (kept for reference only)

## Additional Resources

- `docs/ENVIRONMENT_SETUP.md` - Detailed setup instructions for each service
- `server/utils/validate-env.ts` - Environment variable validation script
- Run `pnpm validate:env` to check your environment configuration

