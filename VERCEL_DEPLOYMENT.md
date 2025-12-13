# Vercel Deployment Guide

## Quick Start

This app is configured to deploy to Vercel. Follow these steps:

### Step 1: Set Environment Variables in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Replace `your-domain` with your actual Vercel domain. Add these variables **for Production**:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_URL=https://your-project-id.supabase.co

OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
AI_PROVIDER=auto

NODE_ENV=production
VITE_APP_URL=https://your-domain.vercel.app
VITE_API_BASE_URL=https://your-domain.vercel.app/api
CLIENT_URL=https://your-domain.vercel.app
SOCKETIO_CORS_ORIGIN=https://your-domain.vercel.app


VITE_ANALYTICS_ID=your-analytics-id

SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_SERVICE_PROVIDER=sendgrid
EMAIL_FROM_ADDRESS=noreply@your-domain.com

SENTRY_DSN=your-sentry-dsn
ENABLE_SENTRY=false
```

**For each variable:**
- Click **Add New**
- Enter the key name (e.g., `VITE_SUPABASE_URL`)
- Enter the value
- Select **Production**
- Click **Save**

### Step 2: Trigger Deployment

1. Either:
   - Push code to GitHub (auto-deploys)
   - Or go to **Deployments** tab → Click **...** on latest → **Redeploy**

2. Wait for build to complete (5-10 minutes)

### Step 3: Test Your Deployment

Once deployed successfully, test:

```bash
# Home page
https://your-domain.vercel.app

# API health check (if available)
https://your-domain.vercel.app/api/ping
```

## Important Notes

### About Your App Architecture

This is a **full-stack Node.js app** with:
- **React SPA** (Frontend) - served from `/dist`
- **Express Server** (Backend) - API routes in `/api/[...all].ts`

Vercel's serverless functions work with this setup, but:
- All API requests route through `/api/[...all].ts`
- Express handles the routing internally
- Static files (SPA) are served from `dist/` directory

### Environment Variables

- **Development**: Use `.env` file locally
- **Production**: Set in Vercel Dashboard
- Never commit `.env` files to git

### URLs Must Match

For CORS and API calls to work:
- `VITE_APP_URL` must match your Vercel domain
- `VITE_API_BASE_URL` must match your Vercel domain `/api`
- `SOCKETIO_CORS_ORIGIN` must match your Vercel domain

### If Deployment Fails

Check the build logs in Vercel Dashboard:
1. Go to **Deployments**
2. Click on the failed deployment
3. Click **Logs** tab
4. Look for error messages

Common issues:
- **Missing environment variables**: Add them to Vercel Settings
- **Build errors**: Check `pnpm run build` locally first
- **Type errors**: Run `pnpm typecheck` locally to find issues

## Troubleshooting

### API Routes Return 404

Make sure environment variables are set, particularly:
- `VITE_API_BASE_URL`
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`

### CORS Errors

Ensure `SOCKETIO_CORS_ORIGIN` is set to your Vercel domain (not localhost).

### SPA Not Loading

Make sure:
- Build completed successfully
- `dist/` directory has `index.html` and assets
- Vite config outputs to `dist/` (not `dist/spa`)

## Need Help?

Refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev)
- Check GitHub Issues in this repo
