# POSTD Environment Setup Guide

This guide explains how to configure environment variables for POSTD local development, testing, UAT, and Cursor agents.

---

## Quick Start

### 1. Copy the Example File

```bash
cp .env.example .env.local
```

### 2. Fill in Required Values

Open `.env.local` and fill in your actual credentials:

```bash
# Required: At least one AI provider
OPENAI_API_KEY=sk-your-real-openai-key

# Required: Supabase credentials
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-real-key
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-real-key
```

### 3. Verify Configuration

```bash
pnpm run check:env
```

You should see:
```
✅ All required variables are configured!
✅ AI provider is configured!
🚀 Ready to run POSTD!
```

---

## Environment Files

| File | Purpose | Git Tracked |
|------|---------|-------------|
| `.env.example` | Template with placeholder values | ✅ Yes |
| `.env.local` | Your local development secrets | ❌ No |
| `.env` | Alternative to .env.local | ❌ No |
| `.cursorenv` | Cursor agent environment | ❌ No |

---

## Required Variables

### AI Providers (At Least One Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic/Claude API key | `sk-ant-...` |

**Note:** You need at least one AI provider configured. The system will fallback to Anthropic if OpenAI fails.

### Supabase

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `SUPABASE_URL` | Project URL | Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret!) | Dashboard → Settings → API |
| `VITE_SUPABASE_URL` | Same as SUPABASE_URL | Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key | Dashboard → Settings → API |

---

## Optional Variables

### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | auto-generated | Auth token secret (required in production) |
| `VITE_APP_URL` | `http://localhost:8080` | Public app URL |

### Email (SendGrid)

| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key for transactional emails |
| `EMAIL_FROM_ADDRESS` | From address for outgoing emails |

### Feature Flags

| Variable | Description |
|----------|-------------|
| `VITE_FEATURE_STUDIO_SIDEBAR` | Enable studio sidebar |
| `VITE_FEATURE_AI_COPY_V1` | Enable AI copy generation |
| `VITE_FEATURE_AI_PALETTE_V1` | Enable AI color palette |

### Debug Flags

| Variable | Description |
|----------|-------------|
| `VERBOSE` | Enable verbose logging |
| `DEBUG_COLOR_EXTRACT` | Debug color extraction |
| `DEBUG_LOGO_DETECT` | Debug logo detection |
| `DEBUG_IMAGE_CLASSIFICATION` | Debug image classification |

---

## Cursor Agent Setup

Cursor agents need environment variables to run UAT scripts and AI generation.

### Option 1: Use .cursorenv File

1. Edit `.cursorenv` in the repo root
2. Fill in your real API keys:

```bash
OPENAI_API_KEY=sk-your-real-key
ANTHROPIC_API_KEY=sk-ant-your-real-key
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-real-key
```

### Option 2: Cursor Workspace Settings

1. Open Cursor Settings → Workspace → Environment
2. Add each variable individually:
   - `OPENAI_API_KEY` → `sk-...`
   - `SUPABASE_URL` → `https://...`
   - etc.

---

## Running UAT Scripts

After configuring environment variables:

```bash
# Run the FB/IG posting UAT
pnpm tsx server/scripts/uat-fb-ig-posting.ts

# Check environment first
pnpm run check:env
```

---

## Troubleshooting

### "AI generation failed: OpenAI client not available"

**Cause:** `OPENAI_API_KEY` is not set or invalid.

**Fix:**
1. Verify the key: `pnpm run check:env`
2. Check your `.env.local` has the correct key
3. Restart the server after changing env vars

### "SUPABASE_URL is required"

**Cause:** Supabase environment variables not loaded.

**Fix:**
1. Ensure `.env.local` exists in repo root
2. Check the file contains `SUPABASE_URL=...`
3. The server uses `dotenv/config` which loads `.env` files automatically

### "JWT_SECRET not set in production"

**Cause:** Running in production mode without JWT_SECRET.

**Fix:**
```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to your environment
JWT_SECRET=your-generated-secret
```

---

## How Environment Loading Works

### Server (Node.js)

The server uses `dotenv/config` which is imported at the top of entry files:

```typescript
// server/index-v2.ts
import "dotenv/config";
```

This loads variables from:
1. `.env.local` (highest priority)
2. `.env`

### Client (Vite)

Vite automatically loads `VITE_*` prefixed variables from:
1. `.env.local`
2. `.env.development.local`
3. `.env.development`
4. `.env`

Access in client code:
```typescript
const url = import.meta.env.VITE_SUPABASE_URL;
```

---

## Security Best Practices

1. **Never commit secrets** - `.env.local` and `.cursorenv` are gitignored
2. **Use service role key only server-side** - Never expose in client code
3. **Rotate keys regularly** - Especially if exposed accidentally
4. **Set JWT_SECRET in production** - Use a strong 32+ character secret
5. **Validate on startup** - The server validates Supabase credentials at boot

---

## Post-Migration: Schema Cache Reload

After running Supabase migrations, PostgREST may serve stale schema metadata. This can cause errors like:
- "column `content_type` does not exist" on `content_items`
- "column `connection_id` does not exist" on `publishing_jobs`

### Why This Happens

PostgREST caches the database schema for performance. When you add/modify columns via migrations, the cache becomes stale until refreshed.

### How to Reload the Schema Cache

**After running migrations, execute:**

```bash
# Option 1: Via Supabase CLI
supabase db run-sql -f supabase/scripts/reload-schema.sql

# Option 2: Via psql
psql $DATABASE_URL -c "SELECT pg_notify('pgrst', 'reload schema');"

# Option 3: Via Supabase Dashboard → SQL Editor
SELECT pg_notify('pgrst', 'reload schema');
```

The script is located at: `supabase/scripts/reload-schema.sql`

### When to Run This

1. **After any migration** that adds/modifies columns or tables
2. **If you see stale column errors** after deploying
3. **As part of your CI/CD pipeline** after migration step

---

## AI Provider Error Behavior

When AI content generation or refinement fails due to missing API keys, the system returns a clear error:

> "AI content generation is unavailable. Configure OPENAI_API_KEY or ANTHROPIC_API_KEY to enable this feature."

This error appears in:
- Social content generation (`/api/agents/generate/social`)
- Caption refinement (`/api/agents/refine-caption`)
- Any other AI-powered endpoints

**Solution:** Configure at least one AI provider in your `.env.local` file (see [AI Providers](#ai-providers-at-least-one-required) above).

---

## Related Documentation

- [API_CREDENTIALS_SETUP.md](./API_CREDENTIALS_SETUP.md) - Detailed API key setup
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment
- [QUICK-DB-REFERENCE.md](./QUICK-DB-REFERENCE.md) - Supabase schema reference

