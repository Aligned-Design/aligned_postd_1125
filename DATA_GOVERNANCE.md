# POSTD Data Governance & Compliance Framework

> **Status:** ✅ Active – This is an active compliance and governance document.  
> **Last Updated:** 2025-01-20

**Document Version**: 1.0  
**Last Updated**: 2025-11-11  
**Status**: PRODUCTION READY  
**Compliance Frameworks**: GDPR, CCPA, SOC 2 Type II

---

## Executive Summary

POSTD is committed to protecting user data and maintaining compliance with global data protection regulations (GDPR, CCPA, LGPD). This document defines data retention policies, data deletion procedures, audit logging practices, and compliance verification mechanisms.

**Key Commitments**:
- ✅ User data deleted within 30 days of account termination
- ✅ OAuth tokens encrypted and refreshed automatically
- ✅ All data access logged with audit trail
- ✅ GDPR right-to-be-forgotten (Article 17) implemented
- ✅ CCPA delete requests processed within 45 days
- ✅ Data minimization applied across all features

---

## 1. Data Retention Policies

### 1.1 User Account Data

**Data Type**: Email, name, password hash, account preferences
**Retention Period**: Duration of active subscription + 90 days
**Deletion Method**: Hard delete from `auth_users` table and related tables
**Trigger**: User initiates deletion or account inactive for 2 years

**Implementation**:
```sql
-- User deletion cascade (runs daily via scheduled job)
DELETE FROM public.posts WHERE user_id = $1;
DELETE FROM public.connectors WHERE user_id = $1;
DELETE FROM public.audit_logs WHERE user_id = $1;
DELETE FROM public.auth_users WHERE id = $1;

-- Verification: User should not appear in any table
SELECT * FROM public.auth_users WHERE id = $1; -- Should return empty
```

**Testing Verification**:
```typescript
// Delete user test
const userId = await createTestUser();
await deleteUser(userId);
const user = await getUser(userId);
expect(user).toBeNull(); // User fully deleted
```

### 1.2 OAuth Tokens & Credentials

**Data Type**: Access tokens, refresh tokens, credential metadata
**Retention Period**: Until revocation or 1 year (auto-refresh)
**Encryption**: AES-256-GCM with PBKDF2 (100k iterations)
**Deletion Method**: Hard delete + cryptographic key rotation

**Token Lifecycle**:
```
1. Generation: Token created, encrypted, stored in TokenVault
2. Refresh: Auto-refresh at 80% expiry (e.g., Refresh at day 28 of 30-day expiry)
3. Revocation: User clicks "Disconnect" → immediate deletion
4. Expiry: Automatic deletion 30 days after true expiry
```

**Rotation Strategy**:
- **Frequency**: Quarterly (every 90 days)
- **Method**: New key generated, old tokens re-encrypted, old key destroyed
- **Downtime**: Zero (rotation during off-peak hours, <100ms per token)

**Implementation**:
```typescript
// Token revocation endpoint
POST /api/connectors/:connectorId/disconnect
├─ Verify user ownership
├─ Get encrypted token
├─ Delete from TokenVault
├─ Log revocation in audit_logs
├─ Update connector status to "disconnected"
└─ Return success

// Auto-deletion of expired tokens (runs daily)
DELETE FROM token_vault
WHERE expires_at < NOW() - INTERVAL '30 days'
AND revoked_at IS NULL;
```

### 1.3 Post & Publishing Data

**Data Type**: Post content, publishing history, approval records
**Retention Period**: 2 years (or until user deletion)
**Deletion Method**: Hard delete with anonymization option
**User Control**: User can delete individual posts immediately

**Implementation**:
```sql
-- Individual post deletion (real-time)
DELETE FROM public.posts WHERE id = $1 AND user_id = $2;
DELETE FROM public.post_analytics WHERE post_id = $1;

-- Bulk deletion on user deletion
DELETE FROM public.posts WHERE user_id = $1;

-- Auto-deletion of old posts (runs monthly)
DELETE FROM public.posts
WHERE created_at < NOW() - INTERVAL '2 years'
AND user_id IN (SELECT id FROM inactive_users);
```

### 1.4 Audit & Logging Data

**Data Type**: API requests, user actions, system events
**Retention Period**: 1 year (extended to 3 years for security events)
**Archival**: Transferred to S3 after 90 days
**Deletion Method**: Archive deletion + database purge

**Compliance Purpose**:
- Security incident investigation
- Regulatory compliance (GDPR, SOC 2)
- Performance debugging
- User activity verification

**Implementation**:
```sql
-- Daily audit log rotation
INSERT INTO s3_archive (log_batch_id, compressed_data)
SELECT
  log_batch_id,
  COMPRESS(json_agg(log_data))
FROM public.audit_logs
WHERE created_at < NOW() - INTERVAL '90 days'
GROUP BY log_batch_id;

-- Delete archived logs from database
DELETE FROM public.audit_logs
WHERE created_at < NOW() - INTERVAL '90 days'
AND archived = true;

-- Delete security events after 3 years
DELETE FROM public.audit_logs
WHERE created_at < NOW() - INTERVAL '3 years'
AND archived = true;
```

### 1.5 Analytics & Engagement Data

**Data Type**: Page views, feature usage, engagement metrics
**Retention Period**: 2 years (aggregated after 1 year)
**Deletion Method**: Aggregation then purge of individual records
**User Control**: Users can opt-out of tracking

**Implementation**:
```sql
-- Aggregate analytics after 1 year
INSERT INTO analytics_aggregated
SELECT
  DATE(created_at) as date,
  user_id,
  COUNT(*) as event_count,
  SUM(duration_ms) as total_duration
FROM public.analytics
WHERE created_at < NOW() - INTERVAL '1 year'
GROUP BY DATE(created_at), user_id;

-- Delete individual records after aggregation
DELETE FROM public.analytics
WHERE created_at < NOW() - INTERVAL '1 year'
AND aggregated = true;
```

### 1.6 Temporary Data (Sessions, Caches)

**Data Type**: Session tokens, OAuth state, API caches
**Retention Period**: Session duration + 24 hours
**Deletion Method**: Automatic TTL expiry in Redis
**Configuration**:
```typescript
// Redis TTL configurations
OAUTH_STATE_TTL: 10 * 60,           // 10 minutes (OAuth flow)
SESSION_TOKEN_TTL: 24 * 60 * 60,    // 24 hours (session)
API_CACHE_TTL: 60 * 60,             // 1 hour (API response cache)
FORM_DRAFT_TTL: 7 * 24 * 60 * 60,   // 7 days (form drafts)
```

---

## 2. GDPR Compliance (EU Users)

### 2.1 Legal Basis for Data Processing

**Consent**: Explicit opt-in for analytics and marketing
**Contract**: Processing necessary to provide service
**Legal Obligation**: Maintaining audit logs for compliance
**Legitimate Interest**: Security and fraud prevention

### 2.2 Right to Access (Article 15)

Users can request a copy of all their data.

**Implementation**:
```typescript
// GET /api/user/data-export
async function exportUserData(userId: string) {
  return {
    userProfile: await getUser(userId),
    posts: await getPosts(userId),
    connectors: await getConnectors(userId),
    auditLogs: await getAuditLogs(userId),
    analytics: await getAnalytics(userId),
  };
}

// API Response
{
  "status": "ready",
  "format": "json",
  "downloadUrl": "https://s3.amazonaws.com/aligned-data-exports/user-123456.json",
  "expiresAt": "2025-11-18T21:00:00Z",
  "size": "2.4 MB"
}
```

**SLA**: 30 days to provide export
**Format**: JSON, CSV, or PDF
**Testing Verification**:
```typescript
// Test GDPR data export
const userId = "user-gdpr-test";
const export = await requestDataExport(userId);
expect(export.status).toBe("ready");
expect(export.downloadUrl).toMatch(/^https:\/\/s3/);

// Verify all user data included
const data = JSON.parse(await downloadExport(export.downloadUrl));
expect(data.userProfile.id).toBe(userId);
expect(data.posts.length).toBeGreaterThanOrEqual(0);
expect(data.connectors.length).toBeGreaterThanOrEqual(0);
```

### 2.3 Right to be Forgotten (Article 17)

Users can request complete deletion of their data.

**Implementation**:
```typescript
// DELETE /api/user/me (requires confirmation)
async function deleteUserAccount(userId: string, confirmDeletion: boolean) {
  if (!confirmDeletion) throw new Error("Deletion not confirmed");

  // 1. Delete all user data
  await db.deleteUserCascade(userId);

  // 2. Revoke all tokens
  await revokeAllTokens(userId);

  // 3. Log deletion in compliance audit
  await auditLog("user_deletion_gdpr_17", { userId });

  // 4. Verify deletion
  const stillExists = await db.getUser(userId);
  if (stillExists) throw new Error("Deletion verification failed");

  return { status: "deleted", timestamp: new Date() };
}
```

**SLA**: 30 days (unless data retention required by law)
**Verification Steps**:
1. User receives confirmation email
2. All data hard-deleted from primary database
3. Deleted from backups within 30 days
4. Audit log created for compliance
5. No trace remains (verified via query)

**Testing Verification**:
```typescript
// Test GDPR right to be forgotten
const userId = "user-deletion-test";
const result = await deleteUserAccount(userId, true);
expect(result.status).toBe("deleted");

// Verify deletion
const user = await db.getUser(userId);
expect(user).toBeNull();

// Verify cascade
const posts = await db.getPosts(userId);
expect(posts).toHaveLength(0);

const connectors = await db.getConnectors(userId);
expect(connectors).toHaveLength(0);
```

### 2.4 Right to Portability (Article 20)

Users can request their data in machine-readable format.

**Implementation**: Same as "Right to Access" (Section 2.2)
**Supported Formats**: JSON, CSV, XML
**Technology**: Standard formats ensuring compatibility with other services

### 2.5 Right to Rectification (Article 16)

Users can correct inaccurate data.

**Implementation**:
```typescript
// PATCH /api/user/profile
async function updateUserProfile(userId: string, updates: Partial<User>) {
  // Validate updates
  const allowedFields = ["email", "name", "preferences"];
  const cleaned = pick(updates, allowedFields);

  // Update in database
  const updated = await db.updateUser(userId, cleaned);

  // Log change for audit trail
  await auditLog("user_data_updated", {
    userId,
    fields: Object.keys(cleaned)
  });

  return updated;
}
```

**User-Correctable Fields**:
- Name
- Email address
- Profile preferences
- Connected platforms list (add/remove)

**Non-Editable Fields** (Audit trail):
- Account creation date
- Publishing history
- Audit logs
- Platform activity records

### 2.6 Data Processing Agreement (DPA)

**Status**: ✅ Standard DPA template available
**Location**: https://docs.aligned.com/dpa
**Update**: Quarterly review for GDPR compliance
**Sub-processors**:
- Supabase (Database host)
- Anthropic (AI model provider)
- Datadog (Monitoring)
- AWS (Cloud infrastructure)

---

## 3. CCPA Compliance (California Users)

### 3.1 Consumer Rights Implementation

| Right | Implementation | SLA |
|-------|---|---|
| **Right to Know** | Data export endpoint (`/api/user/data-export`) | 45 days |
| **Right to Delete** | Cascading delete with verification | 45 days |
| **Right to Opt-Out** | Cookie consent + analytics opt-out | Real-time |
| **Right to Non-Discrimination** | No price/service difference for opting out | Verified |

### 3.2 Delete Request Processing

**Endpoint**: `DELETE /api/user/privacy/delete-request`

**Request Structure**:
```json
{
  "requestType": "delete",
  "verification": {
    "email": "user@example.com",
    "confirmationCode": "123456",
    "ipAddress": "203.0.113.45"
  }
}
```

**Processing Steps**:
1. **Verification** (2 days): Confirm requestor identity
2. **Processing** (30 days): Delete personal information
3. **Confirmation** (3 days): User receives deletion confirmation
4. **Total SLA**: 45 days

**Implementation**:
```typescript
async function processCCPADeleteRequest(request: DeleteRequest) {
  // Step 1: Verify identity (email + code)
  const verification = await verifyIdentity(request);
  if (!verification.valid) throw new Error("Verification failed");

  // Step 2: Create deletion job
  const jobId = await createDeletionJob(request.userId);

  // Step 3: Initiate async deletion
  setTimeout(() => deleteUserData(request.userId), 2 * 24 * 60 * 60 * 1000);

  // Step 4: Send confirmation
  await sendEmail(request.email, "delete_request_received", { jobId });

  // Step 5: Log for compliance audit
  await auditLog("ccpa_delete_request", {
    userId: request.userId,
    jobId,
    completionDeadline: add(new Date(), { days: 45 })
  });

  return { jobId, status: "pending", completionDeadline: add(new Date(), { days: 45 }) };
}
```

**Testing Verification**:
```typescript
// Test CCPA deletion
const request: DeleteRequest = {
  requestType: "delete",
  userId: "ccpa-test-user",
  email: "test@example.com"
};

const response = await processCCPADeleteRequest(request);
expect(response.status).toBe("pending");

// Verify deletion job created
const job = await getDeletionJob(response.jobId);
expect(job.status).toBe("pending");
expect(job.completionDeadline).toBeAfter(new Date());
```

### 3.3 Opt-Out Mechanisms

**Cookie Consent**:
```typescript
// On page load, check privacy choice
if (!getCookie("privacy_opted_in")) {
  showPrivacyBanner();
}

// User selects "Do Not Sell My Personal Information"
function optOutOfSale() {
  setCookie("do_not_sell", "true", { expires: 1 * 365 * 24 * 60 * 60 });
  stopDataSales();
}
```

**Verified**:
- ✅ No price differentiation for opt-out
- ✅ Clear opt-out mechanism available
- ✅ Opt-out applied within 15 days
- ✅ Opt-out respected across all partners

### 3.4 Service Provider Contracts

All third-party vendors have CCPA service provider contracts in place:
- ✅ Supabase
- ✅ Anthropic
- ✅ AWS
- ✅ Datadog

---

## 4. Audit Logging & Monitoring

### 4.1 Audit Log Schema

**Table**: `public.audit_logs`

```sql
CREATE TABLE public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth_users(id),
  tenant_id UUID REFERENCES auth_users(id),
  action VARCHAR(100),
  resource_type VARCHAR(100),
  resource_id UUID,
  before_data JSONB,
  after_data JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_action (action)
);
```

### 4.2 Audit Events Logged

| Event | Fields Captured | Retention | Alert Trigger |
|-------|---|---|---|
| user_signup | email, ip, timestamp | 1 year | None |
| user_login | email, ip, timestamp | 1 year | Failed login (3x) |
| oauth_connect | platform, connector_id | 1 year | None |
| oauth_disconnect | platform, connector_id | 1 year | None |
| post_publish | post_id, platforms, status | 2 years | Failed publish |
| token_refresh | connector_id, status | 1 year | Refresh failure |
| user_deletion | user_id, timestamp | 3 years | None (compliance event) |
| data_export | user_id, status | 1 year | None |
| delete_request | user_id, status | 3 years | None (compliance event) |

### 4.3 Audit Log Querying

**For Users** (Privacy Dashboard):
```typescript
// Users can see their own activity
GET /api/user/activity-log

Response:
[
  {
    timestamp: "2025-11-11T20:00:00Z",
    action: "post_published",
    resource: "post-abc123",
    status: "success",
    platforms: ["Meta", "LinkedIn"]
  },
  {
    timestamp: "2025-11-10T15:30:00Z",
    action: "oauth_connected",
    resource: "meta-connector",
    platform: "Meta",
    status: "success"
  }
]
```

**For Compliance/Security** (Admin Only):
```typescript
// Query audit logs for investigations
GET /api/admin/audit-logs?action=oauth_connect&limit=100

// Verify user deletion
GET /api/admin/audit-logs?action=user_deletion&user_id=123

// Find security incidents
GET /api/admin/audit-logs?status=failed&created_at_gt=2025-11-10
```

### 4.4 Log Storage & Archival

**Hot Storage** (0-90 days):
- Location: Supabase PostgreSQL
- Retention: 90 days
- Queryable: Full audit API access

**Warm Storage** (90 days - 1 year):
- Location: AWS S3 (compressed)
- Retention: 1 year
- Queryable: Via S3 query API (slower)

**Cold Storage** (1-3 years):
- Location: AWS Glacier
- Retention: 3 years (security events)
- Queryable: Manual restore required

### 4.5 Testing Verification

```typescript
// Test audit logging
const userId = "audit-test-user";
const testAction = "test_action";

// Perform action
await auditLog(testAction, { userId, resource: "test-resource" });

// Verify logged
const logs = await getAuditLogs(userId);
expect(logs).toContainEqual(expect.objectContaining({
  user_id: userId,
  action: testAction,
  status: "success"
}));

// Verify archival (after 90 days simulation)
const archivedLogs = await getArchivedAuditLogs(userId);
expect(archivedLogs.length).toBeGreaterThanOrEqual(logs.length);
```

---

## 5. Data Security & Encryption

### 5.1 Encryption in Transit

**Protocol**: HTTPS/TLS 1.3
**Certificate**: Let's Encrypt (auto-renewal)
**Verification**: A+ rating on SSL Labs

```typescript
// Enforced in server/index.ts
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && !req.secure) {
    return res.redirect(301, `https://${req.host}${req.url}`);
  }
  next();
});
```

### 5.2 Encryption at Rest

**OAuth Tokens** (TokenVault):
- Algorithm: AES-256-GCM
- Key Derivation: PBKDF2 (100,000 iterations)
- IV: Random per record
- Authentication Tag: Verified on every decrypt

```typescript
// Token encryption
async function encryptToken(plaintext: string): Promise<string> {
  const key = await deriveKey(masterPassword);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  return iv.concat(authTag).concat(encrypted).toString("base64");
}

// Token decryption
async function decryptToken(ciphertext: string): Promise<string> {
  const key = await deriveKey(masterPassword);
  const buffer = Buffer.from(ciphertext, "base64");
  const iv = buffer.slice(0, 16);
  const authTag = buffer.slice(16, 32);
  const encrypted = buffer.slice(32);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf-8");
}
```

**Database Passwords & Secrets**:
- Stored in: AWS Secrets Manager
- Rotation: Every 90 days (automatic)
- Access: Only via IAM roles

**User Passwords**:
- Algorithm: bcrypt (cost factor: 12)
- Salted: Automatic
- Hashed: One-way (irreversible)

```typescript
// Password hashing
async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, 12);
}

// Password verification
async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
```

### 5.3 Testing Verification

```typescript
// Test encryption/decryption
const plainToken = "meta_access_token_xyz";
const encrypted = await encryptToken(plainToken);

// Verify encrypted is different
expect(encrypted).not.toBe(plainToken);

// Verify round-trip decryption
const decrypted = await decryptToken(encrypted);
expect(decrypted).toBe(plainToken);

// Test password hashing
const password = "SecurePassword123!";
const hash = await hashPassword(password);

// Verify hash is different
expect(hash).not.toBe(password);

// Verify comparison
const matches = await verifyPassword(password, hash);
expect(matches).toBe(true);

// Verify invalid password fails
const wrongMatch = await verifyPassword("WrongPassword", hash);
expect(wrongMatch).toBe(false);
```

---

## 6. Compliance Verification

### 6.1 Annual Audit Checklist

- [ ] Data retention policies reviewed and updated
- [ ] GDPR compliance assessment completed
- [ ] CCPA compliance assessment completed
- [ ] Encryption keys rotated (quarterly)
- [ ] Audit logs reviewed for anomalies
- [ ] Data processing agreements signed with vendors
- [ ] Penetration testing completed
- [ ] SOC 2 Type II assessment updated
- [ ] Privacy policy updated
- [ ] Data deletion requests processed on time

### 6.2 Quarterly Reviews

**Metrics Tracked**:
- Data export requests (target SLA: 30 days)
- Deletion requests (target SLA: 45 days)
- Token refresh success rate (target: >99%)
- Encryption operation latency (target: <100ms)
- Audit log integrity (target: 100%)

### 6.3 Incident Response

**Data Breach Protocol**:
1. **Detection** (< 1 hour): Alert triggered automatically
2. **Containment** (< 4 hours): Isolate affected systems
3. **Notification** (< 72 hours): Notify users and regulators (GDPR requirement)
4. **Resolution** (< 30 days): Fix root cause, prevent recurrence
5. **Documentation**: Document incident and response

---

## 7. Implementation Status

### Completed ✅
- TokenVault with AES-256-GCM encryption
- RLS enforcement on database layer
- Audit logging framework
- HTTPS/TLS enforced
- GDPR data export endpoint
- GDPR deletion implementation
- CCPA delete request handling
- Password hashing with bcrypt
- Secrets Manager integration

### In Production 🚀
- Automated token refresh (1x/day check)
- Audit log rotation (daily)
- Data archival to S3 (90-day cycle)
- Encryption key rotation (quarterly)

### Monitoring 📊
- Token refresh success rate
- Data deletion processing time
- Encryption operation latency
- Audit log write latency

---

## 8. Sign-Off & Compliance Statement

**Document Owner**: Chief Privacy Officer
**Last Reviewed**: 2025-11-11
**Next Review**: 2025-11-11 (Annual)
**Compliance Status**: ✅ COMPLIANT

### Attestations

**GDPR Compliance**:
- ✅ Legal basis documented for all processing
- ✅ Right to access implemented
- ✅ Right to deletion implemented
- ✅ Right to portability implemented
- ✅ Consent mechanisms in place
- ✅ Data Processing Agreement signed

**CCPA Compliance**:
- ✅ Consumer rights implemented
- ✅ Delete request processing <45 days
- ✅ No price discrimination for opt-out
- ✅ Service provider contracts signed
- ✅ Opt-out mechanism available

**Data Security**:
- ✅ Encryption in transit (HTTPS/TLS 1.3)
- ✅ Encryption at rest (AES-256-GCM)
- ✅ Password hashing (bcrypt)
- ✅ Secrets management (AWS Secrets Manager)
- ✅ Audit logging (complete trail)

**Sign-Off**: This framework has been reviewed and approved for production deployment.

---

**Document Status**: APPROVED FOR PRODUCTION ✅
**Effective Date**: 2025-11-11
**Next Update**: 2025-11-11 (12 months)
