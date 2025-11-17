# Security Implementation Plan

## Overview

This document outlines the comprehensive three-layer security implementation for the Aligned AI platform:

1. **Application Layer** - Authentication, authorization, input validation, encryption
2. **Infrastructure Layer** - Network security, DDoS protection, secure deployment
3. **Compliance Layer** - GDPR/CCPA, data governance, audit logging, incident response

## Current Tech Stack

- **Frontend**: React + TypeScript
- **Backend**: Express + Node.js
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **CMS**: Builder.io
- **Payments**: Stripe
- **Auth**: Supabase Auth (planned transition from localStorage)

---

## 🔐 Layer 1: Application Security

### 1.1 Authentication & Authorization

#### Current State

- ❌ Tokens stored in localStorage (insecure)
- ❌ No JWT rotation
- ❌ No email verification enforcement
- ⚠️ Basic password requirements

#### Implementation

**Files Created/Modified:**

- `server/lib/jwt-auth.ts` - JWT generation, verification, and rotation
- `server/middleware/rbac.ts` - Role-based access control
- `client/contexts/AuthContext.tsx` - Updated to use secure token storage

**Changes:**

1. **JWT Authentication**

   ```typescript
   // Short-lived access tokens (1 hour)
   // Refresh tokens (7 days) stored in httpOnly cookies
   const tokens = generateTokenPair({
     userId,
     email,
     role,
     brandIds,
     tenantId,
   });

   // Automatic token rotation
   setRefreshTokenCookie(res, tokens.refreshToken);
   ```

2. **Supabase Auth Hardening**
   - Enable email verification (configured in Supabase Dashboard)
   - Strong password policy: min 10 chars, 1 special, 1 number
   - Magic link expiry: 15 minutes
   - Session expiry: 1 hour

3. **OAuth Token Management**
   - Encrypted storage in database (AES-256)
   - Server-side token refresh
   - Automatic token rotation before expiry

4. **Role-Based Access Control (RBAC)**
   ```typescript
   enum Role {
     SUPERADMIN = "superadmin",
     AGENCY_ADMIN = "agency_admin",
     BRAND_MANAGER = "brand_manager",
     CREATOR = "creator",
     CLIENT_VIEWER = "client_viewer",
   }
   ```

**Action Items:**

- [ ] Update Supabase auth settings in dashboard
- [ ] Migrate from localStorage to httpOnly cookies
- [ ] Implement JWT refresh endpoint
- [ ] Add 2FA option (when Supabase supports it)

### 1.2 API & Backend Security

#### Rate Limiting

**File:** `server/middleware/security.ts`

```typescript
// Global rate limit: 1000 requests/15 min per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 1000,
  }),
);

// Strict rate limit for sensitive endpoints: 100 requests/15 min
const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
});
```

**Features:**

- Per-IP and per-user rate limiting
- Configurable windows and limits
- Automatic cleanup of old entries
- Rate limit headers in responses

#### Input Validation & Sanitization

**File:** `server/middleware/security.ts`

```typescript
// XSS protection - sanitize all input
app.use(sanitizeInput);

// Request size limits
app.use(requestSizeLimit(10 * 1024 * 1024)); // 10MB max
```

**Protections:**

- Remove script tags
- Sanitize dangerous attributes
- Validate JSON payloads with Zod schemas
- Size limits on requests

#### Error Handling

**File:** `server/middleware/monitoring.ts`

```typescript
// Never expose stack traces in production
const isDevelopment = process.env.NODE_ENV === "development";

res.status(500).json({
  error: "Internal Server Error",
  requestId: res.getHeader("X-Request-ID"),
  ...(isDevelopment && {
    message: error.message,
    stack: error.stack,
  }),
});
```

#### HTTPS & Security Headers

**File:** `server/security-server.ts`

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.builder.io"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        // ... more directives
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

**Headers Applied:**

- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer

#### Secrets Management

**Environment Variables Required:**

```bash
# Authentication
JWT_SECRET=<generate-with-openssl-rand-base64-32>
ENCRYPTION_KEY=<generate-with-openssl-rand-base64-32>
HMAC_SECRET=<generate-with-openssl-rand-base64-32>

# Supabase
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Stripe
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>

# Application
NODE_ENV=production
VITE_APP_URL=https://your-domain.com
```

**Action Items:**

- [ ] Set secrets in Vercel environment variables (encrypted)
- [ ] Never commit secrets to repository
- [ ] Rotate keys every 90 days
- [ ] Use Vercel CLI to set secrets: `vercel env add`

### 1.3 Database & Data Layer Security

#### Row-Level Security (RLS)

**File:** `supabase/migrations/20250120_enhanced_security_rls.sql`

**Features:**

- RLS enabled on all tables
- Brand isolation (users can only access their brands)
- Role-based permissions at database level
- Helper functions for permission checks

**Example Policy:**

```sql
CREATE POLICY "Users can view their brands"
  ON brands FOR SELECT
  USING (
    id IN (
      SELECT brand_id FROM brand_members
      WHERE user_id = auth.uid()
    )
  );
```

**Action Items:**

- [ ] Apply RLS migration to Supabase
- [ ] Test all RLS policies
- [ ] Verify brand isolation
- [ ] Monitor RLS performance

#### Encryption

**File:** `server/lib/encryption.ts`

**Implementation:**

```typescript
// Encrypt OAuth tokens before storing
const encryptedToken = encrypt(accessToken);
await supabase
  .from("platform_connections")
  .update({ access_token: encryptedToken });

// Decrypt when needed
const decryptedToken = decrypt(encryptedToken);
```

**Encryption Details:**

- Algorithm: AES-256-GCM
- Key derivation: PBKDF2 with 100,000 iterations
- Authenticated encryption (prevents tampering)
- Unique IV for each encryption

**What Gets Encrypted:**

- OAuth access tokens
- OAuth refresh tokens
- API keys
- Webhook secrets
- Sensitive user data (PII)

**Action Items:**

- [ ] Encrypt existing tokens in database
- [ ] Update token storage/retrieval code
- [ ] Test encryption/decryption flows

#### Backups

**Supabase Settings:**

- Automated daily backups: ✅ Enabled
- Retention: 30 days
- Point-in-time recovery: Available for Pro plan

**Action Items:**

- [ ] Enable automated backups in Supabase Dashboard
- [ ] Test restore procedure monthly
- [ ] Document recovery process

### 1.4 File Storage & Media

#### Supabase Storage Security

**File:** `server/lib/supabase.ts`

```typescript
// Private buckets with RLS
await supabase.storage.createBucket(bucketName, {
  public: false,
  allowedMimeTypes: ["image/*", "video/*"],
  fileSizeLimit: 50 * 1024 * 1024, // 50MB
});

// Generate signed URLs (5 min expiry)
const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
```

**Security Features:**

- Private buckets (not publicly accessible)
- Signed URLs with short expiry
- File type restrictions
- Size limits
- EXIF metadata stripping (privacy)

**Action Items:**

- [ ] Implement EXIF stripping for uploaded images
- [ ] Set up bucket policies
- [ ] Configure CDN with signed URLs

### 1.5 Payments & Billing (Stripe)

**Security Measures:**

- Never store raw card data (PCI compliance)
- Use Stripe Checkout or Customer Portal
- Verify webhook signatures
- Encrypt webhook secrets

**File:** Updates to existing Stripe integration

```typescript
// Verify webhook signature
const signature = req.headers["stripe-signature"];
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET,
);
```

**Action Items:**

- [ ] Verify webhook signature verification is implemented
- [ ] Use Stripe Checkout for all payment flows
- [ ] Enable Stripe Radar for fraud detection

---

## 🧱 Layer 2: Infrastructure Security

### 2.1 Vercel Deployment

**Security Features:**

- Automatic HTTPS with TLS 1.3
- DDoS mitigation
- Edge network protection
- Environment variable encryption

**Configuration:**

**File:** `vercel.json`

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

**Action Items:**

- [ ] Update vercel.json with security headers
- [ ] Enable Vercel Firewall (Pro plan)
- [ ] Set up staging environment
- [ ] Configure custom domains with SSL

### 2.2 Cloudflare Integration (Optional)

**Benefits:**

- Additional DDoS protection
- WAF (Web Application Firewall)
- Bot protection
- Caching
- SSL/TLS management

**Action Items:**

- [ ] Consider adding Cloudflare if needed
- [ ] Configure DNS settings
- [ ] Set up WAF rules

### 2.3 Monitoring & Alerts

**File:** `server/middleware/monitoring.ts`

**Features:**

- Performance monitoring
- Audit logging
- Security event tracking
- Error logging with Sentry

**Integrations:**

- Sentry for error tracking
- PostHog for analytics
- Custom audit logs in database

**Action Items:**

- [ ] Configure Sentry project
- [ ] Set up alert rules
- [ ] Configure log retention
- [ ] Create monitoring dashboard

---

## 📋 Layer 3: Compliance & Governance

### 3.1 GDPR/CCPA Compliance

**Requirements:**

1. Data export endpoint
2. Data deletion endpoint
3. Privacy policy
4. Cookie consent
5. Data retention policies

**Implementation:**

**Endpoints to add:**

```typescript
// Export user data
GET /api/users/:userId/data-export

// Delete user account and data
DELETE /api/users/:userId/delete-account

// Get privacy settings
GET /api/users/:userId/privacy

// Update privacy settings
PUT /api/users/:userId/privacy
```

**Action Items:**

- [ ] Implement data export endpoint
- [ ] Implement data deletion endpoint
- [ ] Add privacy policy page
- [ ] Add cookie consent banner
- [ ] Document data retention policies

### 3.2 Audit Logging

**File:** `server/middleware/monitoring.ts`

**What Gets Logged:**

- User authentication events
- Content creation/modification
- Publishing actions
- Role/permission changes
- Integration connections
- Data exports
- Account deletions

**Log Retention:**

- 90 days for access logs
- 1 year for audit logs
- Permanent for security incidents

**Action Items:**

- [ ] Review audit log coverage
- [ ] Set up log analysis
- [ ] Create audit dashboards
- [ ] Test log retention

### 3.3 Session Management

**Features:**

- Session timeout: 1 hour
- Automatic session renewal
- "Sign out all devices" option
- Session activity tracking

**Implementation:**

**Endpoint to add:**

```typescript
// Sign out all sessions
POST /api/auth/sign-out-all

// Get active sessions
GET /api/auth/sessions

// Revoke specific session
DELETE /api/auth/sessions/:sessionId
```

**Action Items:**

- [ ] Implement session management endpoints
- [ ] Add session UI in user settings
- [ ] Test session revocation

---

## 🚨 Incident Response

### 4.1 Severity Levels

| Level    | Description                    | Response Time      | Example             |
| -------- | ------------------------------ | ------------------ | ------------------- |
| Critical | Data breach, system compromise | Immediate (15 min) | Exposed credentials |
| High     | Service unavailable            | 1 hour             | Database outage     |
| Medium   | Degraded performance           | 4 hours            | Slow queries        |
| Low      | Minor issues                   | 24 hours           | UI glitches         |

### 4.2 Contact List

```
Engineering Lead: <email>
Security Officer: <email>
Legal Counsel: <email>
Client Success: <email>
```

### 4.3 Incident Response Plan

**File:** `docs/INCIDENT_RESPONSE.md`

**Steps:**

1. Detect & assess severity
2. Contain the incident
3. Investigate & document
4. Remediate
5. Communicate (if client data affected)
6. Post-mortem & prevention

**Action Items:**

- [ ] Create detailed incident response document
- [ ] Define escalation procedures
- [ ] Create communication templates
- [ ] Schedule incident response drills

---

## ✅ Launch Readiness Checklist

### Authentication & Authorization

- [ ] JWT rotation implemented
- [ ] Email verification enabled
- [ ] Strong password policy enforced
- [ ] RLS policies applied
- [ ] RBAC implemented

### API & Backend

- [ ] HTTPS enforced
- [ ] CORS whitelist configured
- [ ] Rate limiting active
- [ ] Input sanitization enabled
- [ ] Error handling hides stack traces

### Data Security

- [ ] Encrypted tokens in database
- [ ] Daily backups enabled
- [ ] RLS tested and verified
- [ ] Secrets in environment variables

### Frontend

- [ ] No exposed secrets
- [ ] CSP headers configured
- [ ] Tokens in httpOnly cookies
- [ ] Session timeout implemented

### Payments

- [ ] Stripe webhook verification
- [ ] No raw card data stored
- [ ] Using Stripe Checkout

### Monitoring & Compliance

- [ ] Sentry configured
- [ ] Audit logs active
- [ ] Privacy policy published
- [ ] Data export/delete endpoints

### Infrastructure

- [ ] Vercel security headers
- [ ] Staging environment
- [ ] Backup tested
- [ ] SSL certificates valid

---

## 🔄 Ongoing Security Practices

### Daily

- Monitor error rates
- Review security events
- Check system health

### Weekly

- Review audit logs
- Check rate limit hits
- Review failed login attempts

### Monthly

- Test backup restore
- Review access logs
- Update dependencies
- Check SSL certificates

### Quarterly

- Rotate API keys
- Security audit
- Penetration testing
- Update incident response plan

### Annually

- Full security review
- Compliance audit
- Update policies
- Staff security training

---

## 📚 Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security-best-practices)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Vercel Security](https://vercel.com/docs/security)
- [Stripe Security](https://stripe.com/docs/security)

---

## 🆘 Support

For security concerns or incidents:

- Email: security@aligned.ai
- Urgent: Use incident response procedures
- Non-urgent: Create GitHub security advisory
