# Mock Auth Removal Report

**Date**: 2025-11-18  
**Status**: ✅ Complete  
**Priority**: CRITICAL - Blocking crawler, brand guide, assets, and scheduling systems

## Summary

Removed all mock/development authentication bypasses and replaced with real Supabase Auth for ALL environments (production, preview, local dev).

## Files Changed

### Client-Side Changes

1. **`client/hooks/useAuth.ts`**
   - **Before**: Had mock authentication that created fake users with `localStorage.setItem('auth-user')`
   - **After**: Redirects to real `AuthContext` implementation
   - **Impact**: Any code importing from `@/hooks/useAuth` now uses real auth

2. **`client/contexts/AuthContext.tsx`**
   - **Before**: Had localStorage fallback that created mock users without tokens
   - **After**: Removed localStorage fallback - only restores session if valid token exists
   - **Impact**: Users must sign up/login through real Supabase Auth

3. **`client/pages/Index.tsx`**
   - **Before**: Had dev-only mock auth toggle button
   - **After**: Removed dev auth toggle completely
   - **Impact**: No dev bypasses allowed

### Server-Side Changes

4. **`server/middleware/security.ts`**
   - **Before**: `optionalAuthForOnboarding` allowed requests without auth
   - **After**: Now requires real authentication (calls `authenticateUser`)
   - **Impact**: All routes using this middleware now require real auth

5. **`server/middleware/rbac.ts`**
   - **Before**: Had `mockAuth` function that created fake user data
   - **After**: `mockAuth` now throws error - completely disabled
   - **Impact**: No mock auth can be used

6. **`server/routes/crawler.ts`**
   - **Before**: Routes didn't require authentication
   - **After**: All routes now require `authenticateUser` middleware
   - **Routes updated**:
     - `POST /api/crawl/start` - Now requires auth
     - `GET /api/crawl/result/:jobId` - Now requires auth
     - `POST /api/brand-kit/apply` - Now requires auth
     - `GET /api/brand-kit/history/:brandId` - Now requires auth
     - `POST /api/brand-kit/revert` - Now requires auth
   - **Impact**: Crawler now gets tenantId from authenticated user

7. **`server/index.ts`**
   - **Before**: Used `optionalAuthForOnboarding` for crawler routes
   - **After**: Uses `authenticateUser` for crawler routes
   - **Impact**: Crawler requires real authentication

8. **`server/index-v2.ts`**
   - **Before**: Some routes didn't require authentication
   - **After**: All routes now require `authenticateUser` middleware
   - **Routes updated**:
     - `POST /api/ai/advisor` - Now requires auth
     - `POST /api/ai/doc` - Now requires auth
     - `POST /api/ai/design` - Now requires auth
     - `POST /api/dashboard` - Now requires auth
     - `app.use("/api/milestones", ...)` - Now requires auth
     - `app.use("/api/agents", ...)` - Now requires auth
     - `app.use("/api/analytics", ...)` - Now requires auth
     - `app.use("/api/approvals", ...)` - Now requires auth
     - `app.use("/api/media", ...)` - Now requires auth
   - **Impact**: All API routes require real authentication

## Functions Updated

### Client Functions

1. **`client/hooks/useAuth.ts::useAuth()`**
   - **Before**: Created mock users, stored in `localStorage['auth-user']`
   - **After**: Redirects to `AuthContext.useAuth()` which uses real Supabase Auth

2. **`client/contexts/AuthContext.tsx::restoreSession()`**
   - **Before**: Fallback to localStorage user data without token
   - **After**: Only restores from token via `/api/auth/me`, clears old localStorage data

3. **`client/contexts/AuthContext.tsx::handleSignUp()`**
   - **Status**: ✅ Already uses real Supabase Auth via `/api/auth/signup`
   - **No changes needed**

4. **`client/contexts/AuthContext.tsx::handleLogin()`**
   - **Status**: ✅ Already uses real Supabase Auth via `/api/auth/login`
   - **No changes needed**

### Server Functions

5. **`server/middleware/security.ts::optionalAuthForOnboarding()`**
   - **Before**: Allowed requests without auth
   - **After**: Calls `authenticateUser()` - requires real auth

6. **`server/middleware/rbac.ts::mockAuth()`**
   - **Before**: Created fake user data
   - **After**: Throws error - completely disabled

7. **`server/routes/auth.ts::POST /api/auth/signup`**
   - **Status**: ✅ Already uses real Supabase Auth (`supabase.auth.admin.createUser`)
   - **No changes needed**

8. **`server/routes/auth.ts::POST /api/auth/login`**
   - **Status**: ✅ Already uses real Supabase Auth (`supabase.auth.signInWithPassword`)
   - **No changes needed**

## How Sign-Up Now Works

### Flow

1. **User fills sign-up form** (`client/pages/onboarding/Screen1SignUp.tsx`)
   - Calls `signUp({ name, email, password, role })` from `AuthContext`

2. **Frontend calls backend** (`client/contexts/AuthContext.tsx::handleSignUp`)
   - `POST /api/auth/signup` with `{ email, password, name, role }`

3. **Backend creates user** (`server/routes/auth.ts::POST /api/auth/signup`)
   - Uses `supabase.auth.admin.createUser()` with service role key
   - Creates user in Supabase Auth
   - Creates user profile in `user_profiles` table
   - Generates tenantId (currently userId for 1:1 relationship)
   - Stores tenantId in user metadata
   - Generates JWT tokens with tenantId

4. **Frontend receives response**
   - Stores tokens: `aligned_access_token`, `aligned_refresh_token`
   - Stores user with tenantId
   - Sets user in AuthContext state

5. **User is authenticated**
   - All subsequent API calls include `Authorization: Bearer <token>` header
   - Server extracts tenantId from JWT token
   - All routes have access to authenticated user context

## How Login Now Works

### Flow

1. **User fills login form**
   - Calls `login(email, password)` from `AuthContext`

2. **Frontend calls backend** (`client/contexts/AuthContext.tsx::handleLogin`)
   - `POST /api/auth/login` with `{ email, password }`

3. **Backend authenticates** (`server/routes/auth.ts::POST /api/auth/login`)
   - Uses `supabase.auth.signInWithPassword()` with service role key
   - Verifies credentials against Supabase Auth
   - Retrieves user profile from `user_profiles` table
   - Gets tenantId from user metadata or uses userId
   - Gets user's brands from `brand_members` table
   - Generates JWT tokens with tenantId and brandIds

4. **Frontend receives response**
   - Stores tokens
   - Stores user with tenantId
   - Sets user in AuthContext state

5. **User is authenticated**
   - All subsequent API calls include token
   - Server extracts tenantId from JWT

## How Tenant/Workspace is Created and Linked

### During Sign-Up

1. **TenantId Generation** (`server/routes/auth.ts:170`)
   - Currently: `tenantId = userId` (1:1 relationship)
   - Future: Can support multiple users per workspace

2. **Storage in User Metadata** (`server/routes/auth.ts:173-178`)
   - Updates Supabase Auth user metadata with `tenant_id` and `workspace_id`
   - This allows easy retrieval on login

3. **Storage in JWT Token** (`server/routes/auth.ts:186-192`)
   - JWT token includes `tenantId` in payload
   - All authenticated requests have access to tenantId

4. **Storage in User Profile** (implicit)
   - User profile in `user_profiles` table is linked to userId
   - Brands are linked via `brand_members` table with `user_id` and `tenant_id`

### During Login

1. **Retrieval from Metadata** (`server/routes/auth.ts:312-314`)
   - Gets tenantId from `authData.user.user_metadata.tenant_id`
   - Falls back to `workspace_id` or `userId`

2. **Brand Memberships** (`server/routes/auth.ts:317-322`)
   - Queries `brand_members` table for user's brands
   - Populates `brandIds` in JWT token

3. **Token Generation** (`server/routes/auth.ts:333-339`)
   - JWT includes tenantId and brandIds
   - All authenticated requests have tenantId available

### Usage in Routes

1. **Extraction from Request** (`server/middleware/security.ts:24`)
   - `authenticateUser` middleware extracts tenantId from JWT
   - Sets `req.user.tenantId` and `req.auth.tenantId`

2. **Brand Access Checks** (`server/lib/brand-access.ts`)
   - Uses `req.user.tenantId` to verify brand access
   - Ensures users can only access brands in their workspace

3. **Data Persistence** (e.g., `server/routes/crawler.ts`)
   - Uses `req.user.tenantId` to persist scraped images
   - All data is scoped to user's workspace

## Verification Checklist

- [x] `client/hooks/useAuth.ts` redirects to real AuthContext
- [x] `client/contexts/AuthContext.tsx` removed localStorage fallback
- [x] `client/pages/Index.tsx` removed dev auth toggle
- [x] `server/middleware/security.ts::optionalAuthForOnboarding` requires auth
- [x] `server/middleware/rbac.ts::mockAuth` throws error
- [x] All crawler routes require `authenticateUser`
- [x] All routes in `server/index-v2.ts` require `authenticateUser`
- [x] Sign-up uses `supabase.auth.admin.createUser()`
- [x] Login uses `supabase.auth.signInWithPassword()`
- [x] TenantId is created and stored during sign-up
- [x] TenantId is retrieved and used during login
- [x] All routes extract tenantId from JWT token

## Testing Instructions

1. **Clear localStorage**:
   ```javascript
   localStorage.clear();
   ```

2. **Test Sign-Up**:
   - Go to `/onboarding`
   - Fill sign-up form
   - Verify user is created in Supabase Dashboard → Authentication → Users
   - Verify tokens are stored in localStorage
   - Verify user has tenantId

3. **Test Login**:
   - Logout
   - Login with same credentials
   - Verify tokens are refreshed
   - Verify tenantId is available

4. **Test Crawler**:
   - Sign up/login
   - Start onboarding with website URL
   - Verify crawler gets tenantId from authenticated user
   - Verify images are persisted with correct tenantId

5. **Verify No Mock Auth**:
   - Check browser console - no "mock" or "dev" auth messages
   - Check Vercel logs - all requests require valid JWT tokens
   - Verify no requests succeed without `Authorization` header

## Breaking Changes

⚠️ **IMPORTANT**: The following will break:

1. **Old localStorage users**: Users with only `aligned_user` in localStorage (no token) will be logged out
   - **Solution**: They must sign up/login again through real Supabase Auth

2. **Dev mock users**: Any code relying on mock auth will fail
   - **Solution**: Use real Supabase Auth for all environments

3. **Unauthenticated crawler requests**: Crawler routes now require auth
   - **Solution**: Ensure frontend sends `Authorization` header with token

## Migration Notes

- Old localStorage user data is automatically cleared on next page load
- Users will need to sign up/login again
- All environments (production, preview, local dev) now use real Supabase Auth
- No environment-specific auth bypasses remain

