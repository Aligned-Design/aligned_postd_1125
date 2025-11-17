# Vercel Environment Variables Setup Checklist

Use this checklist to manually add environment variables to Vercel if you don't have or want to use the Vercel CLI.

## How to Add Environment Variables in Vercel UI

1. Go to **[Vercel Dashboard](https://vercel.com/dashboard)**
2. Select your project: **Aligned-20ai**
3. Go to **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)
5. For each variable below:
   - Click **Add New**
   - Paste the **Key** name
   - Paste or enter the **Value**
   - Select **Production** (only environment)
   - Click **Save**

**⚠️ Important:** Replace `your-domain` with your actual Vercel domain (e.g., `aligned-20ai.vercel.app`)

---

## Required Environment Variables

### 1. Supabase Configuration (REQUIRED - App won't work without these)

| Key | Value | Notes |
|-----|-------|-------|
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` | Find in Supabase Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `your-supabase-anon-key` | Find in Supabase Settings → API (public/anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-supabase-service-role-key` | Find in Supabase Settings → API (service role key) |
| `SUPABASE_URL` | `https://your-project-id.supabase.co` | Same as VITE_SUPABASE_URL |

**How to find these:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** (bottom left)
4. Click **API**
5. Copy the values from there

---

### 2. AI Provider Configuration (REQUIRED - For AI features)

| Key | Value | Notes |
|-----|-------|-------|
| `OPENAI_API_KEY` | `sk-...` | Get from [OpenAI API Keys](https://platform.openai.com/api-keys) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Get from [Anthropic Console](https://console.anthropic.com) |
| `AI_PROVIDER` | `auto` | Keep as-is (automatically selects available provider) |

---

### 3. Application URLs (REQUIRED - For CORS and API routing)

Replace `your-domain` with your actual Vercel project domain (e.g., `aligned-20ai.vercel.app`)

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Keep as-is |
| `VITE_APP_URL` | `https://your-domain.vercel.app` | Frontend application URL |
| `VITE_API_BASE_URL` | `https://your-domain.vercel.app/api` | Backend API URL |
| `CLIENT_URL` | `https://your-domain.vercel.app` | Same as VITE_APP_URL |
| `SOCKETIO_CORS_ORIGIN` | `https://your-domain.vercel.app` | For WebSocket connections |

---

### 4. Builder.io Configuration (REQUIRED - For content management)

| Key | Value | Notes |
|-----|-------|-------|
| `VITE_BUILDER_PUBLIC_KEY` | `your-builder-public-key` | Get from Builder.io Dashboard → Account Settings → API Keys |
| `BUILDER_PRIVATE_KEY` | `your-builder-private-key` | Get from Builder.io Dashboard → Account Settings → API Keys |
| `BUILDER_WEBHOOK_SECRET` | `your-webhook-secret` | Generate a random secret string for webhook verification |

**How to find Builder.io keys:**
1. Go to [Builder.io Dashboard](https://builder.io/app)
2. Click your avatar (top right)
3. Select **Account Settings**
4. Find **API Keys** section
5. Copy the public and private keys

---

### 5. Email Service Configuration (REQUIRED - For notifications)

| Key | Value | Notes |
|-----|-------|-------|
| `SENDGRID_API_KEY` | `SG.xxxxx...` | Get from [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys) |
| `EMAIL_SERVICE_PROVIDER` | `sendgrid` | Keep as-is |
| `EMAIL_FROM_ADDRESS` | `noreply@your-domain.com` | Email address for system notifications |

---

### 6. Frontend Analytics (OPTIONAL)

| Key | Value | Notes |
|-----|-------|-------|
| `VITE_ANALYTICS_ID` | `your-analytics-id` | Optional - for analytics tracking |

---

### 7. Social Media Platform Credentials (OPTIONAL - For Analytics Sync)

Add these only if you want to sync analytics from social platforms.

#### Instagram
| Key | Value |
|-----|-------|
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | `your-instagram-business-account-id` |
| `INSTAGRAM_ACCESS_TOKEN` | `your-instagram-access-token` |

#### Facebook
| Key | Value |
|-----|-------|
| `FACEBOOK_PAGE_ID` | `your-facebook-page-id` |
| `FACEBOOK_ACCESS_TOKEN` | `your-facebook-access-token` |

#### Twitter/X
| Key | Value |
|-----|-------|
| `TWITTER_API_KEY` | `your-twitter-api-key` |
| `TWITTER_API_SECRET` | `your-twitter-api-secret` |
| `TWITTER_BEARER_TOKEN` | `your-twitter-bearer-token` |
| `TWITTER_ACCOUNT_ID` | `your-twitter-account-id` |

#### TikTok
| Key | Value |
|-----|-------|
| `TIKTOK_BUSINESS_ACCOUNT_ID` | `your-tiktok-business-account-id` |
| `TIKTOK_ACCESS_TOKEN` | `your-tiktok-access-token` |

#### LinkedIn
| Key | Value |
|-----|-------|
| `LINKEDIN_ORGANIZATION_ID` | `your-linkedin-organization-id` |
| `LINKEDIN_ACCESS_TOKEN` | `your-linkedin-access-token` |

#### Pinterest
| Key | Value |
|-----|-------|
| `PINTEREST_BUSINESS_ACCOUNT_ID` | `your-pinterest-business-account-id` |
| `PINTEREST_ACCESS_TOKEN` | `your-pinterest-access-token` |

#### YouTube
| Key | Value |
|-----|-------|
| `YOUTUBE_CHANNEL_ID` | `your-youtube-channel-id` |
| `YOUTUBE_API_KEY` | `your-youtube-api-key` |

#### Google Business
| Key | Value |
|-----|-------|
| `GOOGLE_BUSINESS_ACCOUNT_ID` | `your-google-business-account-id` |
| `GOOGLE_API_KEY` | `your-google-api-key` |

#### Snapchat
| Key | Value |
|-----|-------|
| `SNAPCHAT_BUSINESS_ACCOUNT_ID` | `your-snapchat-business-account-id` |
| `SNAPCHAT_ACCESS_TOKEN` | `your-snapchat-access-token` |

---

### 8. Socket.io Configuration (OPTIONAL - For real-time features)

| Key | Value | Notes |
|-----|-------|-------|
| `SOCKETIO_RECONNECTION_DELAY` | `1000` | Milliseconds between reconnection attempts |
| `SOCKETIO_RECONNECTION_DELAY_MAX` | `5000` | Max milliseconds between reconnection attempts |

---

### 9. Web Crawling Configuration (OPTIONAL)

| Key | Value | Notes |
|-----|-------|-------|
| `CRAWL_MAX_PAGES` | `50` | Max pages to crawl per request |
| `CRAWL_TIMEOUT_MS` | `30000` | Timeout in milliseconds for crawl operations |
| `CRAWL_USER_AGENT` | `AlignedAIBot/1.0 (+contact: hello@aligned-by-design.com)` | User agent for crawler requests |

---

### 10. Monitoring (OPTIONAL)

| Key | Value | Notes |
|-----|-------|-------|
| `SENTRY_DSN` | `https://your-sentry-dsn` | Optional error monitoring via Sentry |
| `ENABLE_SENTRY` | `false` | Set to true to enable Sentry if DSN is provided |

---

## Priority Order

**Add in this order (fastest path to working deployment):**

1. **Tier 1 (CRITICAL - Do first):**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. **Tier 2 (IMPORTANT - Do second):**
   - `VITE_APP_URL` (replace `your-domain`)
   - `VITE_API_BASE_URL` (replace `your-domain`)
   - `CLIENT_URL` (replace `your-domain`)
   - `SOCKETIO_CORS_ORIGIN` (replace `your-domain`)
   - `NODE_ENV`

3. **Tier 3 (RECOMMENDED - Do third):**
   - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
   - `AI_PROVIDER`
   - `VITE_BUILDER_PUBLIC_KEY`
   - `BUILDER_PRIVATE_KEY`
   - `BUILDER_WEBHOOK_SECRET`

4. **Tier 4 (OPTIONAL - Add as needed):**
   - Email service variables
   - Social media credentials
   - Analytics and monitoring

---

## Verification Steps

After adding environment variables:

1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment (or push new code to GitHub)
3. Wait for build to complete (5-10 minutes)
4. Test the deployed URL:
   - Home page: `https://your-domain.vercel.app`
   - API test: `https://your-domain.vercel.app/api/ping` (if available)

---

## Troubleshooting

### Missing Environment Variables Error
- Check that all required variables (Tier 1 & 2) are set
- Verify the values match exactly (no extra spaces)

### 404 Not Found on API Routes
- Check that `VITE_API_BASE_URL` is set correctly
- Make sure `your-domain` matches your actual Vercel project domain
- Verify deployment used the latest code

### CORS Errors in Browser Console
- Ensure `SOCKETIO_CORS_ORIGIN` matches your Vercel domain
- Check that `CLIENT_URL` is set correctly

### Build Failed in Vercel
- Check the deployment logs in Vercel Dashboard
- Look for missing environment variables in the build output
- Run `pnpm typecheck` locally to find TypeScript errors

---

## Need Your Vercel Domain?

Find your Vercel project domain in the Vercel Dashboard:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on **Aligned-20ai** project
3. Your domain appears at the top (e.g., `aligned-20ai.vercel.app`)

Use this domain to replace `your-domain` in all environment variable values above.
