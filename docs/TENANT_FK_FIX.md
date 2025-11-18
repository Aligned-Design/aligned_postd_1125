# Tenant Foreign Key Constraint Fix

## Problem

Brand creation was failing with:
```
Failed to create brand: insert or update on table "brands" violates foreign key constraint "brands_tenant_id_fkey"
```

**Root Cause**: The signup flow was setting `tenantId = userId` but **never creating a row in the `tenants` table**. When brand creation tried to insert with `tenant_id: userId`, that UUID didn't exist in `tenants`, causing the foreign key violation.

## Solution

### 1. ✅ Signup Flow (`server/routes/auth.ts`)

**Before**: 
```typescript
const tenantId = userId; // Just used userId, never created tenant row
```

**After**:
- ✅ **Creates tenant row** in `tenants` table during signup
- ✅ Uses `userId` as tenant `id` (1:1 relationship for now)
- ✅ Sets tenant `name` from user's name or email
- ✅ Sets tenant `plan` to "free"
- ✅ Handles case where tenant already exists (idempotent)
- ✅ Comprehensive error handling and logging

**Code Flow**:
1. Check if tenant exists for this userId
2. If not, create tenant row: `{ id: userId, name: tenantName, plan: "free" }`
3. Store tenantId in user metadata
4. Include tenantId in JWT token

### 2. ✅ Login Flow (`server/routes/auth.ts`)

**Added**: Tenant verification and creation during login
- ✅ Checks if tenant exists when user logs in
- ✅ Creates tenant if missing (handles edge cases)
- ✅ Logs tenant status for debugging

### 3. ✅ Brand Creation (`server/routes/brands.ts`)

**Added**: Tenant verification before brand insert
- ✅ **Verifies tenant exists** in `tenants` table before creating brand
- ✅ **Creates tenant on the fly** if missing (handles edge cases)
- ✅ Comprehensive logging for tenant verification
- ✅ Clear error messages if tenant creation fails

**Code Flow**:
1. Get tenantId from request/JWT
2. Verify tenant exists in `tenants` table
3. If missing, create tenant row
4. Proceed with brand creation (tenant_id FK will now pass)

## Database Schema

### `tenants` Table
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `brands` Table Foreign Key
```sql
tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL
```

## Tenant ID Flow

### Signup
1. User signs up → `POST /api/auth/signup`
2. Create user in Supabase Auth
3. **Create tenant row** in `tenants` table (`id = userId`)
4. Store `tenantId` in user metadata
5. Generate JWT with `tenantId`
6. Return user + tokens

### Login
1. User logs in → `POST /api/auth/login`
2. Authenticate with Supabase Auth
3. **Verify tenant exists** (create if missing)
4. Generate JWT with `tenantId`
5. Return user + tokens

### Brand Creation
1. User creates brand → `POST /api/brands`
2. Extract `tenantId` from JWT/user context
3. **Verify tenant exists** in `tenants` table
4. **Create tenant if missing** (edge case handling)
5. Insert brand with `tenant_id: <valid-tenant-id>`
6. ✅ Foreign key constraint passes

## Logging

### Signup Logs
```
[Auth] 🏢 Creating tenant for new user
[Auth] ✅ Tenant created successfully { tenantId, tenantName }
[Auth] ✅ Signup complete { userId, tenantId }
```

### Login Logs
```
[Auth] ✅ Tenant exists { tenantId }
[Auth] ⚠️ Tenant not found, creating tenant for existing user
[Auth] ✅ Tenant created during login
```

### Brand Creation Logs
```
[Brands] 🔍 Verifying tenant exists { tenantId, userId }
[Brands] ✅ Tenant verified { tenantId, tenantName }
[Brands] 🏢 Creating missing tenant (if needed)
[Brands] ✅ Tenant created successfully
[Brands] Creating brand { userId, tenantId, brandName }
```

## Error Handling

### Tenant Creation Failures
- **Signup**: Throws error, prevents user creation
- **Login**: Logs warning, continues (tenantId still set)
- **Brand Creation**: Throws error with clear message

### Foreign Key Violations
- **Prevented**: Tenant is always verified/created before brand insert
- **Fallback**: Brand creation creates tenant if missing

## Testing Checklist

✅ **New User Signup**
1. Sign up with new email
2. Verify tenant row created in `tenants` table
3. Verify `tenantId` in user metadata
4. Verify `tenantId` in JWT token

✅ **Brand Creation**
1. Create brand during onboarding
2. Verify tenant exists before insert
3. Verify brand created with valid `tenant_id`
4. No foreign key violations

✅ **Existing User Login**
1. Login with existing user
2. Verify tenant exists (or created if missing)
3. Verify `tenantId` in JWT token

✅ **Edge Cases**
1. User with missing tenant (legacy data)
2. Brand creation with invalid tenantId
3. Multiple brand creations for same tenant

## Migration Notes

### For Existing Users
- **Login flow** will automatically create missing tenants
- **Brand creation** will create tenant if missing
- No manual database work required

### For New Users
- **Signup flow** automatically creates tenant
- No additional steps needed

## Files Changed

1. `server/routes/auth.ts`
   - Added tenant creation during signup
   - Added tenant verification/creation during login

2. `server/routes/brands.ts`
   - Added tenant verification before brand insert
   - Added tenant creation on-the-fly if missing

## Next Steps

1. ✅ Test signup → tenant creation → brand creation end-to-end
2. ✅ Verify no foreign key violations in production
3. ✅ Monitor logs for tenant creation patterns
4. ⏭️ Consider multi-user workspace support (future)

