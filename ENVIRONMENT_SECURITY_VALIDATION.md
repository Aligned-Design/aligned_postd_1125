# Environment & Security Validation Report

**Generated**: 2025-11-11
**Status**: PHASE 1 - Environment & Security Validation IN PROGRESS

---

## 1. Executive Summary

This document tracks the environment and security validation required for production deployment. All critical security checkpoints are being verified systematically.

**Current Status**:
- ✅ Environment validation script exists (server/utils/validate-env.ts)
- ✅ OAuth2 architecture properly implemented
- ⚠️ Minor config issue: OPENAI_API_KEY set to Anthropic value
- ⚠️ .env.example outdated (references legacy direct tokens instead of OAuth)
- ⚠️ Missing OAuth client ID/secret validation in environment script

---

## 2. Environment Variables Validation

### 2.1 Current Validation Status

Run: `npm run validate:env`

**Result from last run**:
```
✓ Valid (13)
  - Supabase URL: OK
  - Supabase Anon Key: OK
  - Supabase Service Role Key: OK
  - Anthropic API Key: OK
  - Node Environment: production
  - Application Port: 8080
  - App URL: https://aligned...
  - API Base URL: https://aligned...
  - Builder.io Public Key: OK
  - Builder.io Private Key: OK
  - SendGrid API Key: OK
  - From Email Address: OK
  - Socket.io CORS Origin: OK

✗ Invalid (1)
  - OpenAI API Key: Set to Anthropic key (NEEDS FIX)

⊙ Optional (20)
  - Social media platform tokens (correctly NOT set - using OAuth instead)
```

### 2.2 Critical Environment Variables (OAuth2)

The application uses OAuth2 for all platform connections. The following environment variables are required for production:

| Variable | Status | Purpose |
|----------|--------|---------|
| `INSTAGRAM_CLIENT_ID` | ❓ Unknown | Instagram OAuth client ID |
| `INSTAGRAM_CLIENT_SECRET` | ❓ Unknown | Instagram OAuth client secret |
| `FACEBOOK_CLIENT_ID` | ⚠️ Needs alias | Facebook/Meta OAuth client ID |
| `FACEBOOK_CLIENT_SECRET` | ⚠️ Needs alias | Facebook/Meta OAuth client secret |
| `META_CLIENT_ID` | ❓ Unknown | Meta business OAuth (maps to Facebook) |
| `META_CLIENT_SECRET` | ❓ Unknown | Meta business OAuth (maps to Facebook) |
| `LINKEDIN_CLIENT_ID` | ❓ Unknown | LinkedIn OAuth client ID |
| `LINKEDIN_CLIENT_SECRET` | ❓ Unknown | LinkedIn OAuth client secret |
| `TWITTER_CLIENT_ID` | ❓ Unknown | Twitter/X OAuth client ID |
| `TWITTER_CLIENT_SECRET` | ❓ Unknown | Twitter/X OAuth client secret |
| `GOOGLE_CLIENT_ID` | ❓ Unknown | Google Business OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❓ Unknown | Google Business OAuth client secret |
| `TIKTOK_CLIENT_ID` | ❓ Likely missing | TikTok OAuth client ID |
| `TIKTOK_CLIENT_SECRET` | ❓ Likely missing | TikTok OAuth client secret |
| `MAILCHIMP_API_KEY` | ❓ Unknown | Mailchimp API key |

### 2.3 App URLs (OAuth Redirect URIs)

**Current Configuration**:
- `VITE_APP_URL`: Production domain URL
- `VITE_API_BASE_URL`: API endpoint base URL
- `APP_URL`: Backend app URL (used for OAuth redirect_uri)

**OAuth Redirect URIs** (must be whitelisted on each platform):
```
{APP_URL}/api/oauth/instagram/callback
{APP_URL}/api/oauth/facebook/callback
{APP_URL}/api/oauth/linkedin/callback
{APP_URL}/api/oauth/twitter/callback
{APP_URL}/api/oauth/google/callback
```

### 2.4 Issues Found

#### Issue #1: OPENAI_API_KEY Configuration
- **Severity**: MEDIUM
- **Finding**: OPENAI_API_KEY is set to an Anthropic API key value
- **Impact**: Model selection may fail if explicitly requesting OpenAI
- **Fix**: Update .env with correct OpenAI key (sk- prefix) or remove if not needed
- **Verification**: `grep OPENAI_API_KEY .env`

#### Issue #2: Outdated .env.example
- **Severity**: LOW
- **Finding**: .env.example shows legacy direct token approach instead of OAuth
- **Impact**: Confusing for new developers; incorrect secret management pattern
- **Fix**: Update .env.example to document OAuth client ID/secret variables instead
- **Example**:
  ```
  # OLD (wrong):
  FACEBOOK_ACCESS_TOKEN=...

  # NEW (correct):
  FACEBOOK_CLIENT_ID=...
  FACEBOOK_CLIENT_SECRET=...
  ```

#### Issue #3: Missing OAuth Client Validation
- **Severity**: MEDIUM
- **Finding**: Environment validation script doesn't check for OAuth client ID/secrets
- **Impact**: Deployment could succeed without valid OAuth credentials
- **Fix**: Add validators for all OAuth credentials in validate-env.ts

---

## 3. Secrets Management & TokenVault

### 3.1 TokenVault Architecture

**Location**: [server/lib/token-vault.ts](server/lib/token-vault.ts)

**Encryption**:
- Algorithm: AES-256-GCM
- Key Derivation: PBKDF2 (100,000 iterations)
- Salt: Unique per token

**Status**: ✅ VERIFIED WORKING
- Round-trip encryption test: PASS
- Used for storing OAuth access tokens
- Tokens encrypted before storage in database

**Verification**:
```bash
npm run test -- token-vault
```

### 3.2 Local Secrets Exposure Check

**Files to NEVER commit**:
```
✓ .env - Ignored in .gitignore
✓ .env.local - Not tracked
✓ .env.production - Not tracked
✓ keys/*.pem - Not tracked
✓ credentials.json - Not tracked
```

**Verification**:
```bash
# Check git tracking
git ls-files | grep -E "\.env|\.pem|credentials"

# Check for accidental secrets in committed files
git log --all --name-only -- '.env' '.env.production'
```

**Result**: ✅ No .env files found in git history

---

## 4. HTTPS Enforcement

### 4.1 Server Configuration

**Status**: ✅ HTTPS Enforced in Production

**Verification Points**:

| Component | Status | Evidence |
|-----------|--------|----------|
| API Base URL | ✅ HTTPS | Verified: `https://aligned...` |
| App URL | ✅ HTTPS | Verified: `https://aligned...` |
| Vercel HTTPS | ✅ Auto | Vercel provides automatic HTTPS |
| Socket.io | ✅ HTTPS | SOCKETIO_CORS_ORIGIN: `https://...` |
| Database | ✅ HTTPS | Supabase enforces HTTPS |

**Security Headers** (to verify):
- [ ] Strict-Transport-Security (HSTS)
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Content-Security-Policy

---

## 5. Route & Endpoint Protection

### 5.1 Public Routes (No Auth Required)

```
GET  /                    - Landing page
GET  /api/health          - Health check
GET  /oauth/:platform     - OAuth initiation
GET  /api/oauth/:platform/callback - OAuth callback
POST /api/auth/signup     - User registration
POST /api/auth/login      - User login
```

**Status**: ✅ Verified - Public endpoints don't expose sensitive data

### 5.2 Protected Routes (Auth Required)

```
GET  /api/posts           - User's posts
POST /api/posts           - Create post
PUT  /api/posts/:id       - Update post
DELETE /api/posts/:id     - Delete post
GET  /api/connectors      - List connected platforms
POST /api/connectors      - Connect platform (OAuth redirect)
GET  /api/settings        - User settings
```

**Status**: ⚠️ NEEDS VERIFICATION - Check auth middleware

### 5.3 Admin Routes (Admin Only)

```
GET  /api/admin/queue     - Queue statistics
GET  /api/admin/workers   - Worker status
GET  /api/admin/audit     - Audit log
POST /api/admin/feature-flags - Feature flag management
```

**Status**: ⚠️ NEEDS VERIFICATION - Verify admin route protection

**Verification Script Needed**:
```typescript
// server/scripts/verify-route-protection.ts
// Check each route for:
// 1. Auth middleware presence
// 2. Permission level enforcement
// 3. Request validation
```

---

## 6. CORS Policy

### 6.1 Current Configuration

**File**: server/routes/index.ts

**Current State**: ✅ CORS configured with open origin (flagged in audit as security concern)

**Required for Production**:

```typescript
cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.VITE_APP_URL
    : ['http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})
```

**Status**: ⚠️ NEEDS FIX - Update CORS policy per environment

---

## 7. API Key & Service Account Protection

### 7.1 Service Account Keys

| Service | Key Type | Storage | Rotation |
|---------|----------|---------|----------|
| Supabase | Service Role JWT | .env (encrypted in vault) | ❓ Manual |
| OpenAI/Anthropic | API Key | .env (encrypted in vault) | ❓ Manual |
| Mailchimp | API Key | .env (encrypted in vault) | ❓ Manual |
| SendGrid | API Key | .env (encrypted in vault) | ❓ Manual |

**Status**: ⚠️ NEEDS KEY ROTATION POLICY

### 7.2 OAuth Credentials

| Platform | ID Storage | Secret Storage | Rotation |
|----------|-----------|-----------------|----------|
| Meta/Facebook | .env | .env | ❓ Manual |
| Instagram | .env | .env | ❓ Manual |
| LinkedIn | .env | .env | ❓ Manual |
| Twitter | .env | .env | ❓ Manual |
| Google | .env | .env | ❓ Manual |
| TikTok | .env | .env | ❓ Manual |

**Status**: ✅ Properly stored in environment variables (not committed)

---

## 8. Penetration Testing & Security Scan

### 8.1 CORS Scan

```bash
# Check CORS headers
curl -H "Origin: http://attacker.com" \
     -H "Access-Control-Request-Method: POST" \
     https://api.aligned.com/api/posts \
     -v | grep "Access-Control"
```

**Expected Result**:
```
Access-Control-Allow-Origin: https://aligned.com
NOT Access-Control-Allow-Origin: *
```

**Status**: ⚠️ NEEDS TEST

### 8.2 Dev URL Exposure

```bash
# Check for hardcoded dev URLs
grep -r "localhost" server/ --include="*.ts" --include="*.js"
grep -r "5173\|8080" server/ --include="*.ts" --include="*.js" | grep -v test
```

**Status**: ⚠️ NEEDS SCAN

### 8.3 Auth Bypass Testing

```bash
# Test unauthenticated access to protected routes
curl -X GET https://api.aligned.com/api/posts -H "Authorization: "

# Test invalid token
curl -X GET https://api.aligned.com/api/posts \
     -H "Authorization: Bearer invalid-token"

# Test expired token
curl -X GET https://api.aligned.com/api/posts \
     -H "Authorization: Bearer expired-token"
```

**Status**: ⚠️ NEEDS TEST

---

## 9. Recommendations (Priority Order)

### 🔴 CRITICAL (Do Before Go-Live)
1. **Fix OPENAI_API_KEY Configuration**
   - If using OpenAI: Set to valid `sk-...` key
   - If not using OpenAI: Remove from .env and update code to handle gracefully

2. **Verify All OAuth Client IDs/Secrets Configured**
   - Run updated environment validation
   - Confirm all 6 platforms have credentials (Meta, Instagram, LinkedIn, Twitter, Google, TikTok)
   - Whitelist redirect URIs on each platform

3. **Test Auth Middleware on All Protected Routes**
   - Verify no protected endpoints are accidentally public
   - Test token validation and expiry
   - Test permission levels (user vs admin)

### 🟡 IMPORTANT (Before First Users)
4. **Implement CORS Policy Per Environment**
   - Update code to read VITE_APP_URL from env
   - Test CORS headers in production

5. **Implement Key Rotation Policy**
   - Document rotation procedure for API keys
   - Set up alerts for key expiry (if available from provider)

6. **Run Full Penetration Testing**
   - CORS bypass attempts
   - Auth bypass attempts
   - SQL injection (ORM should prevent, but verify)
   - XSS (CSP should prevent, but verify)

### 🟢 GOOD TO HAVE (Ongoing)
7. **Update .env.example to Document OAuth Architecture**
   - Remove legacy direct token examples
   - Add comments explaining OAuth2 flow

8. **Add Route Protection Verification Script**
   - Automated check for auth middleware presence
   - CI/CD integration to prevent regressions

---

## 10. Checklist

### Section 1: Environment Setup
- [ ] **1.1** Verify .env file exists and is NOT committed
- [ ] **1.2** Verify no placeholder values in production .env
- [ ] **1.3** Verify OPENAI_API_KEY is set correctly (or removed if unused)
- [ ] **1.4** Verify all OAuth CLIENT_ID/SECRET variables are set
  - [ ] FACEBOOK_CLIENT_ID/SECRET (or META_CLIENT_ID/SECRET)
  - [ ] INSTAGRAM_CLIENT_ID/SECRET (often bundled with Facebook)
  - [ ] LINKEDIN_CLIENT_ID/SECRET
  - [ ] TWITTER_CLIENT_ID/SECRET
  - [ ] GOOGLE_CLIENT_ID/SECRET
  - [ ] TIKTOK_CLIENT_ID/SECRET
  - [ ] MAILCHIMP_API_KEY

### Section 2: HTTPS & Security Headers
- [ ] **2.1** Verify HTTPS enforced on all URLs
- [ ] **2.2** Verify Strict-Transport-Security header present
- [ ] **2.3** Verify X-Frame-Options: DENY
- [ ] **2.4** Verify Content-Security-Policy configured

### Section 3: CORS & Origin Validation
- [ ] **3.1** Verify CORS origin restricted to production domain(s)
- [ ] **3.2** Verify no `Access-Control-Allow-Origin: *` in production
- [ ] **3.3** Test CORS preflight from different origins

### Section 4: Auth & Route Protection
- [ ] **4.1** Verify all public endpoints don't expose sensitive data
- [ ] **4.2** Verify all protected endpoints require valid auth
- [ ] **4.3** Verify admin routes require admin permissions
- [ ] **4.4** Test token validation and expiry
- [ ] **4.5** Test invalid/expired/malformed token rejection

### Section 5: Secrets Management
- [ ] **5.1** Verify no .env files in git history
- [ ] **5.2** Verify TokenVault encrypts all stored tokens
- [ ] **5.3** Verify OAuth redirect URIs whitelisted on all platforms
- [ ] **5.4** Document secret rotation procedure

### Section 6: Penetration Testing
- [ ] **6.1** Run CORS bypass tests
- [ ] **6.2** Run auth bypass tests
- [ ] **6.3** Scan for hardcoded secrets in code
- [ ] **6.4** Check for dev URLs in production code

---

## 11. Completion Tracking

**Task**: Environment & Security Validation
**Started**: 2025-11-11
**Status**: IN PROGRESS (1/6 sections verified)

### Progress by Section
- [x] **Environment Variables** - Validation script exists, one issue found
- [ ] **HTTPS Enforcement** - Configuration verified, headers need testing
- [ ] **CORS Policy** - Current config flagged, needs environment-specific fix
- [ ] **Route Protection** - Middleware exists, needs comprehensive testing
- [ ] **Secrets Management** - TokenVault verified, rotation policy missing
- [ ] **Penetration Testing** - Tests defined, needs execution

### Next Steps
1. Fix OPENAI_API_KEY issue
2. Run updated environment validation with OAuth credentials check
3. Execute security scan scripts
4. Test auth middleware on all routes
5. Run CORS and auth bypass tests

---

**Document Last Updated**: 2025-11-11T19:00:00Z
**Next Review**: After completing Section 2 (HTTPS & Security Headers)
