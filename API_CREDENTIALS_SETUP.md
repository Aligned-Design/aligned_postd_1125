# API Credentials Configuration Guide

This document contains all OAuth credentials and API keys for platform integrations.

## ⚠️ SECURITY WARNING

**NEVER commit actual credentials to version control.** This file documents the structure. Store actual values in:
- `.env` file (local development) - **MUST be in .gitignore**
- Environment variables (production)
- Secret management service (recommended for production)

---

## Environment Variables Structure

Add these to your `.env` file:

```env
# ============================================================================
# Meta (Facebook/Instagram/Threads)
# ============================================================================
META_APP_ID=1153555240091402
META_APP_SECRET=edbb347cd77fe25094dd36a8ab18d5c8
META_ACCESS_TOKEN=373cb691e9cdf31966c38c2f19d9fd57
META_REDIRECT_URI=http://localhost:8080/api/auth/meta/callback
# Production: https://app.postd.app/api/auth/meta/callback

# ============================================================================
# Threads (Meta)
# ============================================================================
THREADS_APP_ID=801761816181762
THREADS_APP_SECRET=6fd35b0dd758b22129e17385c2da3e06
THREADS_REDIRECT_URI=http://localhost:8080/api/auth/threads/callback
# Production: https://app.postd.app/api/auth/threads/callback

# ============================================================================
# LinkedIn
# ============================================================================
LINKEDIN_CLIENT_ID=864033mgzl6q1v
LINKEDIN_CLIENT_SECRET=YOUR_LINKEDIN_CLIENT_SECRET_HERE
LINKEDIN_REDIRECT_URI=http://localhost:8080/api/auth/linkedin/callback
# Production: https://app.postd.app/api/auth/linkedin/callback

# ============================================================================
# X (Twitter)
# ============================================================================
X_CLIENT_ID=VXBsTzFvWDdka1JzNHZTaklJREs6MTpjaQ
X_CLIENT_SECRET=DTrVqtKi3Y-pXPbrfKwXinsAVOja6NIVslmSDd-f354Y0mnfze
X_API_KEY=dcQjzzSnY97UKsKTS1SlMcFe3N8qPTjSiVcEsvBlkyGXu3scA9
X_API_SECRET=dcQjzzSnY97UKsKTS1SlMcFe3N8qPTjSiVcEsvBlkyGXu3scA9
X_BEARER_TOKEN=dcQjzzSnY97UKsKTS1SlMcFe3N8qPTjSiVcEsvBlkyGXu3scA9
X_REDIRECT_URI=http://localhost:8080/api/auth/x/callback
# Production: https://app.postd.app/api/auth/x/callback

# ============================================================================
# TikTok
# ============================================================================
TIKTOK_CLIENT_KEY=awpiosguy7xhu8ku
TIKTOK_CLIENT_SECRET=pbyi7liR4Qt4KmG5fKzyWU3AfYfSxjKa
TIKTOK_REDIRECT_URI=http://localhost:8080/api/auth/tiktok/callback
# Production: https://app.postd.app/api/auth/tiktok/callback

# ============================================================================
# Canva
# ============================================================================
CANVA_CLIENT_ID=OC-AZqKM7Kb9sZZ
CANVA_CLIENT_SECRET=YOUR_CANVA_CLIENT_SECRET_HERE
CANVA_REDIRECT_URI=http://localhost:8080/api/auth/canva/callback
# Production: https://app.postd.app/api/auth/canva/callback
```

---

## OAuth Callback URLs

### Development (Localhost)
- Meta: `http://localhost:8080/api/auth/meta/callback`
- Threads: `http://localhost:8080/api/auth/threads/callback`
- LinkedIn: `http://localhost:8080/api/auth/linkedin/callback`
- X (Twitter): `http://localhost:8080/api/auth/x/callback`
- TikTok: `http://localhost:8080/api/auth/tiktok/callback`
- Canva: `http://localhost:8080/api/auth/canva/callback`

### Production
- Meta: `https://app.postd.app/api/auth/meta/callback`
- Threads: `https://app.postd.app/api/auth/threads/callback`
- LinkedIn: `https://app.postd.app/api/auth/linkedin/callback`
- X (Twitter): `https://app.postd.app/api/auth/x/callback`
- TikTok: `https://app.postd.app/api/auth/tiktok/callback`
- Canva: `https://app.postd.app/api/auth/canva/callback`

---

## Platform Developer Console Links

Update these callback URLs in each platform's developer console:

### Meta (Facebook/Instagram)
- **Console**: https://developers.facebook.com/apps/1153555240091402/fb-login/settings/
- **Redirect URIs**: Add both development and production URLs

### Threads
- **Console**: https://developers.facebook.com/apps/801761816181762/
- **Redirect URIs**: Add both development and production URLs

### LinkedIn
- **Console**: https://www.linkedin.com/developers/apps/864033mgzl6q1v/auth
- **Redirect URIs**: Add both development and production URLs

### X (Twitter)
- **Console**: https://developer.twitter.com/en/portal/projects
- **Redirect URIs**: Add both development and production URLs

### TikTok
- **Console**: https://developers.tiktok.com/apps
- **Redirect URIs**: Add both development and production URLs

### Canva
- **Console**: https://www.canva.com/developers/apps
- **Redirect URIs**: Add both development and production URLs

---

## Implementation Status

### ✅ Configured in Code
- [x] Meta connector uses `META_APP_ID` and `META_APP_SECRET`
- [x] LinkedIn connector uses `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`
- [x] Twitter/X connector uses `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_API_KEY`, `X_BEARER_TOKEN`
- [x] TikTok connector uses `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET`
- [x] Environment variables added to `shared/env.ts`
- [x] Redirect URIs configurable via environment variables

### ⚠️ Not Yet Implemented
- [ ] Canva connector (credentials ready, connector implementation pending)
- [ ] Threads connector (uses Meta credentials, may need separate OAuth flow)

### ⚠️ Action Required
1. **Create `.env` file** with actual credentials (copy from this doc)
2. **Update callback URLs** in each platform's developer console
3. **Test OAuth flows** for each platform
4. **Rotate credentials** if any are exposed or compromised

---

## Security Best Practices

1. **Never commit `.env`** - Ensure it's in `.gitignore`
2. **Use different credentials** for development and production
3. **Rotate credentials regularly** (every 90 days recommended)
4. **Use secret management** in production (AWS Secrets Manager, Vercel Env, etc.)
5. **Monitor for credential exposure** in logs, error messages, or public repos
6. **Limit OAuth scopes** to minimum required permissions
7. **Use environment-specific redirect URIs** (dev vs prod)

---

## Troubleshooting

### OAuth Callback Errors
- Verify callback URL matches exactly in developer console
- Check that redirect URI environment variable is set correctly
- Ensure protocol (http/https) matches environment

### Invalid Credentials
- Verify credentials are copied correctly (no extra spaces)
- Check if credentials have expired or been rotated
- Confirm app is approved/verified in platform developer console

### Missing Environment Variables
- Check `.env` file exists and is loaded
- Verify variable names match exactly (case-sensitive)
- Restart dev server after adding new variables

---

**Last Updated**: 2025-01-27  
**Maintained By**: Connector Engineering Team

