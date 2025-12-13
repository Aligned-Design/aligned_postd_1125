# Route Guards Documentation

**Purpose:** Centralized authentication and authorization checks for routing.

## Current Implementation

The app uses THREE route guard components defined in `App.tsx`:

### 1. `PublicRoute`
**Purpose:** Routes that should only be accessible to non-authenticated users.

**Behavior:**
- ✅ Not authenticated → Show public content (landing, pricing, blog)
- 🔄 Authenticated + onboarding in progress → Redirect to `/onboarding`
- 🔄 Authenticated + onboarding complete → Redirect to `/dashboard`

**Usage:**
```tsx
<Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
<Route path="/pricing" element={<PublicRoute><Pricing /></PublicRoute>} />
```

### 2. `ProtectedRoute`
**Purpose:** Routes that require authentication AND completed onboarding.

**Behavior:**
- 🔄 Not authenticated → Redirect to `/` (landing)
- 🔄 Authenticated but onboarding incomplete → Redirect to `/onboarding`
- ✅ Authenticated + onboarding complete → Show protected content

**Usage:**
```tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <PostdLayout><Dashboard /></PostdLayout>
  </ProtectedRoute>
} />
```

### 3. `OnboardingRoute`
**Purpose:** Onboarding flow protection.

**Behavior:**
- 🔄 Not authenticated → Redirect to `/` (landing)
- ✅ Authenticated + onboarding in progress → Show onboarding
- 🔄 Authenticated + onboarding complete → Redirect to `/dashboard`

**Usage:**
```tsx
<Route path="/onboarding" element={
  <OnboardingRoute><Onboarding /></OnboardingRoute>
} />
```

## Flow Diagram

```
User Visit
    ↓
[Not Authenticated] → Landing Page (/) → Login
    ↓
[Authenticated + No Onboarding Step]
    ↓
[Onboarding Incomplete] → Onboarding Flow (/onboarding)
    ↓
[Onboarding Complete] → Dashboard + App (/dashboard)
```

## Permission-Based Guards

For feature-level permissions, use `ProtectedRoute` from `components/auth/ProtectedRoute.tsx`:

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

<ProtectedRoute requiredScope="brand:write">
  <SensitiveFeature />
</ProtectedRoute>
```

**Available Scopes:**
- `brand:view` - View brand data
- `brand:write` - Modify brand data
- `content:write` - Create/edit content
- `publish:execute` - Publish content
- `analytics:view` - View analytics
- `settings:manage` - Manage settings

## Auth State Sources

Guards rely on `useAuth()` hook which provides:

```typescript
{
  user: User | null,
  isAuthenticated: boolean,
  onboardingStep: number | null,
  login: (credentials) => Promise<void>,
  logout: () => Promise<void>
}
```

## Best Practices

### ✅ DO

1. **Use guards for ALL routes** (except truly public like legal pages)
2. **Keep guard logic in App.tsx** (single source of truth)
3. **Use ProtectedRoute for permissions** (feature-level auth)
4. **Test auth flows** (login, onboarding, logout)

### ❌ DON'T

1. **Don't check auth in components** (use guards instead)
2. **Don't inline auth logic** (centralize in guards)
3. **Don't skip onboarding checks** (security risk)
4. **Don't create custom guards** (use existing patterns)

## Adding New Protected Routes

1. **Import the page component:**
   ```tsx
   import NewFeature from './app/(postd)/new-feature/page';
   ```

2. **Add route with ProtectedRoute guard:**
   ```tsx
   <Route path="/new-feature" element={
     <ProtectedRoute>
       <PostdLayout><NewFeature /></PostdLayout>
     </ProtectedRoute>
   } />
   ```

3. **For permission-specific features:**
   ```tsx
   <Route path="/admin-only" element={
     <ProtectedRoute requiredScope="admin:manage">
       <PostdLayout><AdminFeature /></PostdLayout>
     </ProtectedRoute>
   } />
   ```

## Current Status

✅ **Implemented:**
- PublicRoute, ProtectedRoute, OnboardingRoute guards
- Centralized in App.tsx
- Permission-based ProtectedRoute component
- Auth flow: landing → login → onboarding → dashboard

✅ **Consistency:**
- No ad-hoc auth checks in components
- All routes use appropriate guards
- Single source of truth for auth logic

📋 **No changes needed** - already follows best practices!

## Testing

To test auth flows:

1. **Not authenticated:**
   - Visit `/dashboard` → Should redirect to `/`
   - Visit `/onboarding` → Should redirect to `/`

2. **Authenticated, onboarding incomplete:**
   - Visit `/dashboard` → Should redirect to `/onboarding`
   - Visit `/` → Should redirect to `/onboarding`

3. **Authenticated, onboarding complete:**
   - Visit `/` → Should redirect to `/dashboard`
   - Visit `/dashboard` → Should show dashboard
   - Visit `/onboarding` → Should redirect to `/dashboard`

