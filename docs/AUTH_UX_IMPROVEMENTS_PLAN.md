# Authentication UX Improvements Plan

## Current State Analysis

### ✅ What Already Exists:
1. **LoginPage component** (`client/components/auth/LoginPage.tsx`):
   - Has password toggle functionality (Eye/EyeOff icons)
   - Uses different styling (Card-based, not matching onboarding style)
   - Not currently used in routes ( `/login` redirects to Index)

2. **Signup Screen** (`client/pages/onboarding/Screen1SignUp.tsx`):
   - Part of onboarding flow
   - No password toggle
   - Basic error handling

### ❌ What's Missing:
1. Password toggle on signup form
2. Dedicated login page matching onboarding style
3. "Email already exists" → redirect to login flow
4. Forgot password functionality
5. Reusable password input component

## Implementation Plan

### Phase 1: Create Reusable PasswordInput Component
**File:** `client/components/ui/password-input.tsx`
- Props: value, onChange, placeholder, error, className
- Features:
  - Eye/EyeOff icon toggle (Lucide icons)
  - Matches existing input styling
  - Accessible (aria-labels)
  - Smooth transitions

### Phase 2: Add Password Toggle to Signup
**File:** `client/pages/onboarding/Screen1SignUp.tsx`
- Replace password input with PasswordInput component
- Maintain existing styling and validation

### Phase 3: Create Login Page Matching Onboarding Style
**File:** `client/pages/onboarding/Screen0Login.tsx` (or `client/pages/Login.tsx`)
- Match Screen1SignUp styling (gradient background, rounded cards)
- Use PasswordInput component
- Add "Forgot password?" link
- Add "Don't have an account? Sign up" link
- Integrate with AuthContext login function

### Phase 4: Handle "Email Already Exists" Error
**Files:**
- `client/pages/onboarding/Screen1SignUp.tsx`
- `client/contexts/AuthContext.tsx`

**Flow:**
1. Detect "user_already_exists" or "email already exists" error
2. Store email in URL params or state
3. Redirect to `/login?email=<email>&message=already_exists`
4. Login page shows friendly message: "This email is already registered. Please log in below."
5. Pre-fill email field

### Phase 5: Forgot Password Functionality
**Files:**
- `client/pages/onboarding/ScreenForgotPassword.tsx` (or separate route)
- `server/routes/auth.ts` (add reset password endpoint)

**Flow:**
1. User clicks "Forgot password?" on login page
2. Navigate to `/forgot-password`
3. User enters email
4. Call backend: `POST /api/auth/forgot-password` with email
5. Backend calls: `supabase.auth.resetPasswordForEmail(email)`
6. Show success message: "We've sent you a password reset email."
7. Option to return to login

### Phase 6: Update Routing
**File:** `client/App.tsx`
- Add `/login` route pointing to new login page
- Add `/forgot-password` route
- Update signup link in Screen1SignUp to navigate to login

## Implementation Order

1. ✅ Create PasswordInput component
2. ✅ Update Screen1SignUp to use PasswordInput
3. ✅ Create login page matching onboarding style
4. ✅ Add "email already exists" handling
5. ✅ Add forgot password page and backend endpoint
6. ✅ Update routing

## Success Criteria

- [x] Password field toggles visibility via eye icon on signup
- [x] Password field toggles visibility via eye icon on login
- [x] Attempting to sign up with existing email redirects to login
- [x] Login page displays "email already exists" notice
- [x] "Forgot password?" flow is available and functional
- [x] Works in Production and Preview environments

