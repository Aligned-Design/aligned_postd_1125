# API Credentials Integration - Remaining Tasks

## ✅ Completed

1. ✅ Added all credentials to `shared/env.ts`
2. ✅ Updated Meta connector to use `META_APP_ID`, `META_APP_SECRET`
3. ✅ Updated LinkedIn connector to use `LINKEDIN_REDIRECT_URI`
4. ✅ Updated Twitter/X connector to use `X_*` environment variables
5. ✅ Updated TikTok connector to use `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`
6. ✅ Created `API_CREDENTIALS_SETUP.md` documentation

---

## ⚠️ Still Needed

### 1. Connector Manager - Import Missing Connectors

**File:** `server/connectors/manager.ts`

**Issue:** TikTok and Twitter connectors are not imported/used

**Fix Required:**
```typescript
// Add imports at top
import TikTokConnector from './tiktok';
import TwitterConnector from './twitter';

// Update switch statement
case 'tiktok':
  connector = new TikTokConnector(this.tenantId, connectionId, {
    vault: this.vault,
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
  });
  break;

case 'twitter':
case 'x':
  connector = new TwitterConnector(this.tenantId, connectionId, {
    vault: this.vault,
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
  });
  break;
```

---

### 2. OAuth Manager - Update Environment Variable Names

**File:** `server/lib/oauth-manager.ts`

**Issue:** Uses old env var names that don't match our new credentials

**Current (WRONG):**
- `INSTAGRAM_CLIENT_ID` → Should be `META_APP_ID`
- `FACEBOOK_CLIENT_ID` → Should be `META_APP_ID`
- `TWITTER_CLIENT_ID` → Should be `X_CLIENT_ID`
- `TWITTER_CLIENT_SECRET` → Should be `X_CLIENT_SECRET`

**Fix Required:**
```typescript
const OAUTH_CONFIGS: Record<Platform, OAuthConfig> = {
  instagram: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    clientId: process.env.META_APP_ID || '',
    clientSecret: process.env.META_APP_SECRET || '',
    redirectUri: process.env.META_REDIRECT_URI || `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/api/auth/meta/callback`,
    scope: ["pages_manage_posts", "pages_read_engagement", "instagram_business_content_publish"],
  },
  facebook: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    clientId: process.env.META_APP_ID || '',
    clientSecret: process.env.META_APP_SECRET || '',
    redirectUri: process.env.META_REDIRECT_URI || `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/api/auth/meta/callback`,
    scope: ["pages_manage_posts", "pages_read_engagement", "business_management"],
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    clientId: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/api/auth/linkedin/callback`,
    scope: ["w_member_social", "r_liteprofile", "r_emailaddress"],
  },
  twitter: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    clientId: process.env.X_CLIENT_ID || '',
    clientSecret: process.env.X_CLIENT_SECRET || '',
    redirectUri: process.env.X_REDIRECT_URI || `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/api/auth/x/callback`,
    scope: ["tweet.read", "tweet.write", "users.read"],
  },
  // Add missing platforms
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token",
    clientId: process.env.TIKTOK_CLIENT_KEY || '',
    clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
    redirectUri: process.env.TIKTOK_REDIRECT_URI || `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/api/auth/tiktok/callback`,
    scope: ["video.upload", "video.publish", "user.info.basic"],
  },
  threads: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    clientId: process.env.THREADS_APP_ID || process.env.META_APP_ID || '',
    clientSecret: process.env.THREADS_APP_SECRET || process.env.META_APP_SECRET || '',
    redirectUri: process.env.THREADS_REDIRECT_URI || process.env.META_REDIRECT_URI || `${process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080'}/api/auth/threads/callback`,
    scope: ["threads_basic", "threads_content_publish"],
  },
  // ... existing google_business config
};
```

---

### 3. OAuth Manager - Add Missing Platforms

**File:** `server/lib/oauth-manager.ts`

**Missing Platforms:**
- TikTok
- Threads
- Canva (if needed for OAuth)

**Action:** Add OAuth configs for these platforms in `OAUTH_CONFIGS` object

---

### 4. Platform Type Definitions

**File:** `shared/publishing.ts` (or wherever Platform type is defined)

**Check:** Ensure Platform type includes:
- `tiktok`
- `threads`
- `canva` (if applicable)
- `x` (alias for `twitter`)

---

### 5. Integrations Route - Update OAuth URL Generation

**File:** `server/routes/integrations.ts`

**Issue:** Line 378 uses old env var pattern:
```typescript
client_id: process.env[`${type.toUpperCase()}_CLIENT_ID`] || 'demo',
```

**Fix Required:** Update to use correct env var names:
- Meta → `META_APP_ID`
- LinkedIn → `LINKEDIN_CLIENT_ID`
- X/Twitter → `X_CLIENT_ID`
- TikTok → `TIKTOK_CLIENT_KEY`

---

### 6. Canva Integration

**Status:** Canva client exists but connector not created

**Files:**
- `server/lib/integrations/canva-client.ts` (exists)
- `server/connectors/canva/` (doesn't exist)

**Action Required:**
- Create Canva connector following BaseConnector pattern
- Add to ConnectorManager
- Add OAuth config if Canva uses OAuth

---

### 7. Environment Variable Validation

**File:** `shared/env.ts`

**Action:** Update `validateServerEnv()` to check for OAuth credentials:
```typescript
export function validateServerEnv(): boolean {
  const required = [
    'OPENAI_API_KEY', 
    'ANTHROPIC_API_KEY',
    // Optional but recommended:
    // 'META_APP_ID',
    // 'LINKEDIN_CLIENT_ID',
    // etc.
  ] as const;
  // ...
}
```

---

## Summary Checklist

- [ ] **Connector Manager**: Import and register TikTok and Twitter connectors
- [ ] **OAuth Manager**: Update env var names to match new credentials
- [ ] **OAuth Manager**: Add TikTok, Threads, Canva OAuth configs
- [ ] **Integrations Route**: Fix OAuth URL generation to use correct env vars
- [ ] **Platform Types**: Verify all platforms are in Platform type union
- [ ] **Canva Connector**: Create Canva connector implementation
- [ ] **Environment Validation**: Add OAuth credential validation (optional)

---

## Priority Order

1. **HIGH**: OAuth Manager env var updates (blocks OAuth flows)
2. **HIGH**: Connector Manager imports (blocks connector usage)
3. **MEDIUM**: Add missing platform OAuth configs
4. **MEDIUM**: Integrations route fix
5. **LOW**: Canva connector (if needed)
6. **LOW**: Environment validation updates

---

**Estimated Time**: 1-2 hours for high priority items

