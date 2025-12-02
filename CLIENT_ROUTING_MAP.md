# Client-Side Routing Map - POSTD Platform

## Overview
This document provides a comprehensive map of all client-side routes in the POSTD application. The application uses React Router v6 for client-side routing with Vite as the build tool.

---

## Architecture Overview

### Framework & Setup
- **Router**: React Router v6 (BrowserRouter)
- **Build Tool**: Vite
- **Layout System**: Component-based with PostdLayout (protected) and UnauthenticatedLayout (public)
- **State Management**: Context API (AuthContext, WorkspaceContext, UserContext, BrandContext)
- **Location**: `/Users/krisfoust/Downloads/Aligned-20ai.posted/client/`

### Page Structure (Source of Truth)

**Canonical Page Locations:**
- **Authenticated Pages**: `/client/app/(postd)/<feature>/page.tsx` - All production app pages live here
- **Public Pages**: `/client/app/(public)/<section>/page.tsx` - All public/marketing/legal pages live here
- **Compatibility Pages**: `/client/pages/` - Only for:
  - `Index.tsx` (landing page `/`)
  - `Pricing.tsx` (pricing page `/pricing`)
  - `Onboarding.tsx` (onboarding container `/onboarding`)
  - `NotFound.tsx` (404 catch-all `*`)
  - `onboarding/Screen*.tsx` (onboarding step screens)

**Legacy & Experimental Pages:**
- **Legacy Pages**: `/client/pages/_legacy/` - Archived pages replaced by `app/(postd)` versions
- **Experimental Pages**: `/client/pages/_experiments/` - Unrouted experimental features

**⚠️ Important:** Do NOT add new feature pages to `client/pages/`. All new pages must go in `client/app/(postd)/` or `client/app/(public)/`.

### Entry Points
- **Main App Component**: `/client/App.tsx`
- **Components Directory**: `/client/components/`
- **Layout Components**: `/client/components/layout/`

### Route Aliases

The following routes have aliases for backwards compatibility:
- `/queue` → `/content-queue` (canonical)
- `/studio` → `/creative-studio` (canonical)
- `/ads` → `/paid-ads` (canonical)
- `/reports` → `/reporting` (canonical)

**Note:** These aliases may be consolidated into redirects in a future release. New code should use the canonical paths.

---

## Authentication & Protection

### Authentication Flow
1. **Entry Point**: Users start at `/` (Index/Landing Page)
2. **Auth Check**: `ProtectedRoutes()` component checks authentication via `useAuth()`
3. **Onboarding State**: If authenticated but `onboardingStep` exists, user is shown Onboarding
4. **Protected Access**: Authenticated users with completed onboarding access protected routes
5. **Fallback**: Unauthenticated users are redirected to `/` (landing page)

### Auth Context
**File**: `/client/contexts/AuthContext.tsx`

**User States**:
- `isAuthenticated`: Boolean based on `!!user`
- `onboardingStep`: 1 | 2 | 3 | 3.5 | 4 | 4.5 | 5 | null
- `user`: OnboardingUser | null

**Stored in LocalStorage**:
- `aligned_user`: Complete user object
- `aligned_brand`: Brand snapshot data
- `aligned_onboarding_step`: Current onboarding step

### Route Protection
All protected routes are wrapped in `ProtectedRoutes()` component that enforces:
- Authentication requirement
- Onboarding completion check
- Automatic redirect to `/` for unauthenticated users

---

## Route Hierarchy & Organization

### 1. PUBLIC ROUTES (Unauthenticated)

#### Root Route
```
PATH: /
COMPONENT: client/pages/Index.tsx
LAYOUT: UnauthenticatedLayout
AUTH: Public (redirects authenticated users to /dashboard)
STATUS: Production
DESCRIPTION: Landing page with hero, features, testimonials
NAVIGATION: CTA buttons to /dashboard (if authed) or /onboarding (if not)
```

---

### 2. ONBOARDING FLOWS (Auth-Gated, Multi-Step)

#### Onboarding Container
```
PATH: /onboarding
COMPONENT: client/pages/Onboarding.tsx
LAYOUT: (Custom - no MainLayout)
AUTH: Required
STATUS: Production
DESCRIPTION: Multi-step onboarding wizard
LOGIC: Displays different screens based on onboardingStep
```

#### Onboarding Steps
```
Step 1: Sign Up
  PATH: /onboarding?step=1 (internal routing via state)
  COMPONENT: client/pages/onboarding/Screen1SignUp.tsx
  DESCRIPTION: User registration and initial setup

Step 2: Business Essentials
  PATH: /onboarding?step=2
  COMPONENT: client/pages/onboarding/Screen2BusinessEssentials.tsx
  DESCRIPTION: Agency vs Single Business selection

Step 3: Expectation Setting
  PATH: /onboarding?step=3
  COMPONENT: client/pages/onboarding/Screen3ExpectationSetting.tsx
  DESCRIPTION: Setting expectations

Step 3.5: Brand Intake
  PATH: /onboarding?step=3.5
  COMPONENT: client/pages/onboarding/Screen3BrandIntake.tsx
  DESCRIPTION: Brand information collection (manual intake for users without website)

Step 4: AI Scrape
  PATH: /onboarding?step=4
  COMPONENT: client/pages/onboarding/Screen3AiScrape.tsx
  DESCRIPTION: AI-powered brand scraping

Step 5: Brand Summary Review
  PATH: /onboarding?step=5
  COMPONENT: client/pages/onboarding/Screen5BrandSummaryReview.tsx
  DESCRIPTION: Review brand summary

Step 6: Weekly Focus
  PATH: /onboarding?step=6
  COMPONENT: client/pages/onboarding/Screen6WeeklyFocus.tsx
  DESCRIPTION: Set weekly content focus

Step 7: Content Generation
  PATH: /onboarding?step=7
  COMPONENT: client/pages/onboarding/Screen7ContentGeneration.tsx
  DESCRIPTION: Content generation introduction

Step 8: Calendar Preview
  PATH: /onboarding?step=8
  COMPONENT: client/pages/onboarding/Screen8CalendarPreview.tsx
  DESCRIPTION: Calendar preview

Step 9: Connect Accounts
  PATH: /onboarding?step=9
  COMPONENT: client/pages/onboarding/Screen9ConnectAccounts.tsx
  DESCRIPTION: Social media account connection

Step 10: Dashboard Welcome
  PATH: /onboarding?step=10
  COMPONENT: client/pages/onboarding/Screen10DashboardWelcome.tsx
  DESCRIPTION: Final welcome screen

NOTE: Screen35ConnectAccounts.tsx exists but is not used in the current flow.
      It has been archived to client/pages/_legacy/onboarding/
```

---

### 3. PROTECTED ROUTES (Authenticated Users Only)

#### MAIN NAVIGATION GROUP (Dashboard & Content)

```
PATH: /dashboard
COMPONENT: client/app/(postd)/dashboard/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: "Dashboard" (Main > Home icon)
BREADCRUMB: Dashboard
DESCRIPTION: Main command center with daily overview
FEATURES: 
  - Today's Pulse (GoodNews component)
  - Calendar Accordion
  - Insights Feed
  - Analytics Panel
  - FirstVisitTooltip context
```

```
PATH: /calendar
COMPONENT: client/app/(postd)/calendar/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: "Calendar" (Main > Calendar icon)
BREADCRUMB: Calendar
DESCRIPTION: Multi-view content calendar
VIEWS: Day view (hourly), Week view, Month view
FILTERS: By brand, platform, campaign
FEATURES:
  - MonthCalendarView component
  - DayViewHourly component
  - SchedulingAdvisor
  - CalendarAccordion
```

```
PATH: /content-queue (canonical)
PATH: /queue (alias)
COMPONENT: client/app/(postd)/queue/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: "Content Queue" (Main > ListTodo icon)
BREADCRUMB: Content Queue
DESCRIPTION: Content pipeline and approval queue
FEATURES: Post scheduling, status management
NOTE: /queue is an alias for backwards compatibility. May be consolidated into redirects later.
```

```
PATH: /creative-studio (canonical)
PATH: /studio (alias)
COMPONENT: client/app/(postd)/studio/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: "Creative Studio" (Main > Sparkles icon)
BREADCRUMB: Creative Studio
DESCRIPTION: AI-powered creative asset generation
FEATURES: Template selection, AI generation, asset preview
NOTE: /studio is an alias for backwards compatibility. May be consolidated into redirects later.
```

#### STRATEGY NAVIGATION GROUP (Planning & Analytics)

```
PATH: /campaigns
COMPONENT: client/app/(postd)/campaigns/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: "Campaigns" (Strategy > Zap icon)
BREADCRUMB: Campaigns
DESCRIPTION: Campaign management and creation
FEATURES: Campaign builder, performance tracking
```

```
PATH: /analytics
COMPONENT: client/app/(postd)/analytics/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: "Analytics" (Strategy > BarChart3 icon)
BREADCRUMB: Analytics
DESCRIPTION: Performance metrics and insights
FEATURES: Multi-brand analytics, trend analysis
```

```
PATH: /reviews
COMPONENT: client/app/(postd)/reviews/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: "Reviews" (Strategy > Star icon)
BREADCRUMB: Reviews
DESCRIPTION: Client/customer review management
FEATURES: Review monitoring, sentiment analysis
```

```
PATH: /paid-ads (canonical)
PATH: /ads (alias)
COMPONENT: client/app/(postd)/paid-ads/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Beta (Feature flag: beta = true)
SIDEBAR: "Paid Ads" (Strategy > DollarSign icon) - Shows Beta badge
BREADCRUMB: Paid Ads
DESCRIPTION: Paid advertising campaign management
BETA_FLAG: Yes - displays "Beta" badge in sidebar with tooltip "Beta feature - coming soon"
FEATURES: Meta, Google, LinkedIn ad integration
COMING_SOON: Campaign creation wizard
NOTE: /ads is an alias for backwards compatibility. May be consolidated into redirects later.
```

```
PATH: /events
COMPONENT: client/app/(postd)/events/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: "Events" (Strategy > MapPin icon)
BREADCRUMB: Events
DESCRIPTION: Event scheduling and promotion
FEATURES:
  - Event creation (AI or manual)
  - Multiple event types
  - Platform sync
  - EventEditorModal, EventTypeSelector
```

#### ASSETS NAVIGATION GROUP (Brand & Resources)

```
PATH: /brand-guide
COMPONENT: client/app/(postd)/brand-guide/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: "Brand Guide" (Assets > Palette icon)
BREADCRUMB: Brand Guide
DESCRIPTION: Brand guidelines documentation
FEATURES: Visual standards, color palette, typography
```

```
PATH: /library
COMPONENT: client/app/(postd)/library/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: "Library" (Assets > Library icon)
BREADCRUMB: Library
DESCRIPTION: Digital asset management system
FEATURES:
  - Multiple view modes: Grid, Table, Masonry
  - Upload functionality (LibraryUploadZone)
  - Asset filtering and search
  - Stock image integration
  - Smart tag preview
```

```
PATH: /linked-accounts
COMPONENT: client/app/(postd)/linked-accounts/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: "Linked Accounts" (Assets > Link2 icon)
BREADCRUMB: Linked Accounts
DESCRIPTION: Social media platform connections
FEATURES:
  - Account status monitoring
  - Token expiration tracking
  - Permission management
  - Sync status display
  - Platforms: Meta, Google Business, LinkedIn, Twitter, TikTok
```

#### ADDITIONAL PROTECTED ROUTES

```
PATH: /approvals
COMPONENT: client/app/(postd)/approvals/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: (Not directly in main sidebar - likely accessed via content-queue)
DESCRIPTION: Content approval and review queue
FEATURES: Multi-level approval workflows
```

```
PATH: /content-generator
COMPONENT: client/app/(postd)/content-generator/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: (Not directly in main sidebar)
DESCRIPTION: AI-powered content generation tool
FEATURES: Template-based generation, batch creation
```

```
PATH: /brands
COMPONENT: client/app/(postd)/brands/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: (Not directly in main sidebar - strategy section)
DESCRIPTION: Multi-brand management
FEATURES: Brand listing, brand switching, creation
```

```
PATH: /brand-intake
COMPONENT: client/app/(postd)/brand-intake/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: (Strategy group, optional)
DESCRIPTION: Brand information intake form
FEATURES: Structured brand data collection
```

```
PATH: /brand-snapshot
COMPONENT: client/app/(postd)/brand-snapshot/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: (Strategy group, optional)
DESCRIPTION: Brand personality and identity snapshot
FEATURES: Voice, tone, audience, colors summary
```

```
PATH: /brand-intelligence
COMPONENT: client/app/(postd)/brand-intelligence/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: (Strategy group, likely)
DESCRIPTION: AI-powered brand insights and analysis
FEATURES: Competitive analysis, market positioning
```

```
PATH: /reporting (canonical)
PATH: /reports (alias)
COMPONENT: client/app/(postd)/reporting/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: (Strategy group, optional)
DESCRIPTION: Report generation and distribution
FEATURES: Custom reports, scheduled delivery, export
NOTE: /reports is an alias for backwards compatibility. May be consolidated into redirects later.
```

```
PATH: /client-portal
COMPONENT: client/app/(postd)/client-portal/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: (Assets group, optional)
DESCRIPTION: Client-facing portal for approvals and communications
FEATURES: Approval requests, client messaging
```

```
PATH: /client-settings
COMPONENT: client/app/(postd)/client-settings/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: (Not in sidebar - system settings)
DESCRIPTION: Client workspace settings and configuration
FEATURES: Invite management, permissions, workspace settings
```

#### SYSTEM SETTINGS GROUP

```
PATH: /settings
COMPONENT: client/app/(postd)/settings/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: "Settings" (System > Settings icon)
BREADCRUMB: Settings
DESCRIPTION: Workspace and account settings
TABS:
  - Workspace settings
  - Team member management
  - Integrations
  - Billing information
FEATURES:
  - Member invite and management
  - Role assignment (Admin, Manager, Contributor, Viewer)
  - Workspace configuration
```

```
PATH: /billing
COMPONENT: client/app/(postd)/billing/page.tsx
LAYOUT: PostdLayout (via app/(postd)/layout.tsx)
AUTH: Required
STATUS: Production
SIDEBAR: (Likely in settings group or separate)
DESCRIPTION: Subscription and billing management
FEATURES: Payment method, invoice history, plan management
```

#### AUTHENTICATION & SYSTEM ROUTES

```
PATH: /auth/logout
COMPONENT: (Handled by logout link in Sidebar)
AUTH: Required
DESCRIPTION: Sign out functionality
BEHAVIOR: Clears auth state and redirects to /
```

```
PATH: /pricing
COMPONENT: client/pages/Pricing.tsx
LAYOUT: UnauthenticatedLayout (or custom)
AUTH: Public
STATUS: Production
DESCRIPTION: Pricing page with plan comparison
```

```
PATH: /login
COMPONENT: client/pages/onboarding/Screen0Login.tsx
LAYOUT: (Custom - no MainLayout)
AUTH: Public (redirects authenticated users)
STATUS: Production
DESCRIPTION: Login screen
```

```
PATH: /blog
COMPONENT: client/app/(public)/blog/page.tsx
LAYOUT: UnauthenticatedLayout
AUTH: Public
STATUS: Production
DESCRIPTION: Blog index page
```

```
PATH: /blog/:slug
COMPONENT: client/app/(public)/blog/[slug]/page.tsx
LAYOUT: UnauthenticatedLayout
AUTH: Public
STATUS: Production
DESCRIPTION: Individual blog post
```

```
PATH: /legal/privacy-policy
COMPONENT: client/app/(public)/legal/privacy-policy/page.tsx
LAYOUT: UnauthenticatedLayout
AUTH: Public
STATUS: Production
DESCRIPTION: Privacy policy
```

```
PATH: /legal/terms
COMPONENT: client/app/(public)/legal/terms/page.tsx
LAYOUT: UnauthenticatedLayout
AUTH: Public
STATUS: Production
DESCRIPTION: Terms of service
```

```
PATH: /legal/cookies
COMPONENT: client/app/(public)/legal/cookies/page.tsx
LAYOUT: UnauthenticatedLayout
AUTH: Public
STATUS: Production
DESCRIPTION: Cookie policy
```

```
PATH: /legal/data-deletion
COMPONENT: client/app/(public)/legal/data-deletion/page.tsx
LAYOUT: UnauthenticatedLayout
AUTH: Public
STATUS: Production
DESCRIPTION: Data deletion policy
```

```
PATH: /legal/acceptable-use
COMPONENT: client/app/(public)/legal/acceptable-use/page.tsx
LAYOUT: UnauthenticatedLayout
AUTH: Public
STATUS: Production
DESCRIPTION: Acceptable use policy
```

```
PATH: /legal/refunds
COMPONENT: client/app/(public)/legal/refunds/page.tsx
LAYOUT: UnauthenticatedLayout
AUTH: Public
STATUS: Production
DESCRIPTION: Refund policy
```

```
PATH: /legal/api-policy
COMPONENT: client/app/(public)/legal/api-policy/page.tsx
LAYOUT: UnauthenticatedLayout
AUTH: Public
STATUS: Production
DESCRIPTION: API policy
```

```
PATH: /legal/ai-disclosure
COMPONENT: client/app/(public)/legal/ai-disclosure/page.tsx
LAYOUT: UnauthenticatedLayout
AUTH: Public
STATUS: Production
DESCRIPTION: AI disclosure
```

```
PATH: /legal/security
COMPONENT: client/app/(public)/legal/security/page.tsx
LAYOUT: UnauthenticatedLayout
AUTH: Public
STATUS: Production
DESCRIPTION: Security statement
```

```
PATH: *
COMPONENT: client/pages/NotFound.tsx
LAYOUT: (No specific layout)
AUTH: N/A (Shown for invalid routes)
STATUS: Production
DESCRIPTION: 404 Page Not Found
FEATURES: Navigation back to home, back button
```

---

## Navigation Components

### Layout Structure

#### Header Component
**File**: `/client/components/layout/Header.tsx`
**Features**:
- Logo link to "/"
- Global search bar (hidden on mobile)
- Help icon (opens HelpDrawer)
- Notifications bell with indicator
- User profile dropdown

#### Sidebar Component
**File**: `/client/components/layout/Sidebar.tsx`
**Features**:
- Workspace switcher with create modal
- Organized navigation groups:
  - **Main**: Dashboard, Calendar, Content Queue, Creative Studio
  - **Strategy**: Campaigns, Analytics, Reviews, Paid Ads (Beta), Events
  - **Assets**: Brand Guide, Library, Linked Accounts
- System section:
  - Settings
  - Sign Out
- Active state styling with lime-400 highlight
- Beta badges for experimental features
- Hidden on mobile (responsive)
- Gradient background: indigo-950 to indigo-800

#### MainLayout Component
**File**: `/client/components/layout/MainLayout.tsx`
**Features**:
- Page-specific help drawer system
- Maps routes to help pages (dashboard, calendar, library, studio, brand, analytics)
- Loading overlay during hydration
- Escape key handler for help drawer
- Fixed header positioning
- Responsive main content area

#### Key Navigation Props
```
activeState Indicators:
  - Lime-400 background and text for active routes
  - Hover states with transparency
  - Nested route matching (e.g., /calendar/* matches /calendar)

Beta Feature Badges:
  - Amber/gold styling
  - Uppercase "Beta" label
  - Border and background with transparency
  - Tooltip on hover: "Beta feature - coming soon"
```

---

## Workspace & Context System

### WorkspaceContext
**File**: `/client/contexts/WorkspaceContext.tsx`
**Purpose**: Manages multi-workspace functionality
**Key Functions**:
- Workspace switching and creation
- Member management
- Workspace-specific settings

### UserContext
**File**: `/client/contexts/UserContext.tsx`
**Purpose**: User profile and preferences
**Key Functions**:
- User data management
- Preference storage

### BrandContext
**File**: `/client/contexts/BrandContext.tsx`
**Purpose**: Brand-specific data
**Key Functions**:
- Brand selection
- Brand settings

---

## Special Route Behaviors

### Catch-All Route
```
PATH: * (All unmatched routes)
COMPONENT: NotFound.tsx
BEHAVIOR: Logs 404 error, shows "Page Not Found" with navigation options
```

### Redirects
```
FROM: / (when authenticated)
TO: /dashboard
BEHAVIOR: Automatic via CTA in Index.tsx

FROM: Unauthenticated access to protected routes
TO: / (landing page)
BEHAVIOR: Automatic via ProtectedRoutes() wrapper
```

### Route Guards (via ProtectedRoutes wrapper)
```javascript
function ProtectedRoutes() {
  const { isAuthenticated, onboardingStep } = useAuth();

  // If authenticated and in onboarding, show onboarding flow
  if (isAuthenticated && onboardingStep) {
    return <Onboarding />;
  }

  // If not authenticated, show landing page
  if (!isAuthenticated) {
    return <Index />;
  }

  // If authenticated and completed onboarding, show protected routes
  return <Routes>{ /* all protected routes */ }</Routes>;
}
```

---

## Feature Flags & Beta Features

### Beta Features
1. **Paid Ads** (`/paid-ads`)
   - Status: Beta
   - Flag: `beta: true` in sidebar config
   - Badge: Amber/gold Beta badge displayed
   - Tooltip: "Beta feature - coming soon"
   - Coming Soon Features:
     - Campaign creation wizard (shows toast "Coming Soon")
     - Full Meta/Google/LinkedIn integration

---

## Help System Integration

### Page Help Map
**File**: `/client/components/layout/MainLayout.tsx` contains PAGE_MAP:
```javascript
const PAGE_MAP: Record<string, PageKey> = {
  "/dashboard": "dashboard",
  "/calendar": "calendar",
  "/library": "library",
  "/creative-studio": "studio",
  "/brand-guide": "brand",
  "/analytics": "analytics",
};
```

### Help Drawer
**File**: `/client/components/dashboard/HelpDrawer.tsx`
**Features**:
- Page-specific help content
- Replay tour button (redirects to `/onboarding?step=5`)
- Escape key closes drawer
- Scrollable help content

---

## Responsive Behavior

### Desktop (md+)
- Sidebar: Fixed, visible (64 width units)
- Header: Fixed top
- Content: Full width with left margin for sidebar
- Main content offset by sidebar

### Mobile (< md)
- Sidebar: Hidden (use MobileNav if available)
- Header: Fixed top
- Content: Full width

---

## Navigation Data Structure

### Sidebar Navigation Items
```typescript
interface NavItem {
  icon: IconComponent,
  label: string,
  href: string,
  beta?: boolean,  // For beta features
  badge?: number,  // For unread counts
}

// Groups
const navGroups = [
  { title: "Main", items: [...] },
  { title: "Strategy", items: [...] },
  { title: "Assets", items: [...] },
];

const bottomItems = [
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: LogOut, label: "Sign Out", href: "/auth/logout" },
];
```

---

## Breadcrumb & Active State Logic

### Route Matching
```typescript
// In Sidebar NavItem component
const isActive = location.pathname === item.href;

// In Sidebar overall
const activeGroup = navGroups.find(group =>
  group.items.some(item => 
    location.pathname === item.href || 
    location.pathname.startsWith(item.href + '/')
  )
);
```

### Visual States
- **Active**: lime-400 background, indigo-950 text, shadow
- **Hover**: white/10 background, white text (inactive), elevated
- **Default**: white/70 text on indigo background

---

## Route Summary Table

| Path | Component | Auth | Layout | Status | Group | Notes |
|------|-----------|------|--------|--------|-------|-------|
| / | client/pages/Index.tsx | Public | Unauth | Prod | Public | Landing page |
| /pricing | client/pages/Pricing.tsx | Public | Unauth | Prod | Public | Pricing page |
| /onboarding | client/pages/Onboarding.tsx | Req | Custom | Prod | Auth | Multi-step wizard |
| /login | client/pages/onboarding/Screen0Login.tsx | Public | Custom | Prod | Auth | Login screen |
| /dashboard | client/app/(postd)/dashboard/page.tsx | Req | PostdLayout | Prod | Main | Command center |
| /calendar | client/app/(postd)/calendar/page.tsx | Req | PostdLayout | Prod | Main | Content calendar |
| /content-queue | client/app/(postd)/queue/page.tsx | Req | PostdLayout | Prod | Main | Approval queue |
| /queue | client/app/(postd)/queue/page.tsx | Req | PostdLayout | Prod | Main | Alias for /content-queue |
| /creative-studio | client/app/(postd)/studio/page.tsx | Req | PostdLayout | Prod | Main | AI generation |
| /studio | client/app/(postd)/studio/page.tsx | Req | PostdLayout | Prod | Main | Alias for /creative-studio |
| /campaigns | client/app/(postd)/campaigns/page.tsx | Req | PostdLayout | Prod | Strategy | Campaign mgmt |
| /analytics | client/app/(postd)/analytics/page.tsx | Req | PostdLayout | Prod | Strategy | Performance |
| /reviews | client/app/(postd)/reviews/page.tsx | Req | PostdLayout | Prod | Strategy | Review mgmt |
| /paid-ads | client/app/(postd)/paid-ads/page.tsx | Req | PostdLayout | Beta | Strategy | Ad management |
| /ads | client/app/(postd)/paid-ads/page.tsx | Req | PostdLayout | Beta | Strategy | Alias for /paid-ads |
| /events | client/app/(postd)/events/page.tsx | Req | PostdLayout | Prod | Strategy | Event scheduling |
| /brand-guide | client/app/(postd)/brand-guide/page.tsx | Req | PostdLayout | Prod | Assets | Brand guidelines |
| /library | client/app/(postd)/library/page.tsx | Req | PostdLayout | Prod | Assets | Asset management |
| /linked-accounts | client/app/(postd)/linked-accounts/page.tsx | Req | PostdLayout | Prod | Assets | Social connections |
| /approvals | client/app/(postd)/approvals/page.tsx | Req | PostdLayout | Prod | - | Review queue |
| /content-generator | client/app/(postd)/content-generator/page.tsx | Req | PostdLayout | Prod | - | Content AI |
| /brands | client/app/(postd)/brands/page.tsx | Req | PostdLayout | Prod | - | Multi-brand |
| /brand-intake | client/app/(postd)/brand-intake/page.tsx | Req | PostdLayout | Prod | Strategy | Brand form |
| /brand-snapshot | client/app/(postd)/brand-snapshot/page.tsx | Req | PostdLayout | Prod | Strategy | Brand summary |
| /brand-intelligence | client/app/(postd)/brand-intelligence/page.tsx | Req | PostdLayout | Prod | Strategy | Brand insights |
| /reporting | client/app/(postd)/reporting/page.tsx | Req | PostdLayout | Prod | Strategy | Reports |
| /reports | client/app/(postd)/reporting/page.tsx | Req | PostdLayout | Prod | Strategy | Alias for /reporting |
| /client-portal | client/app/(postd)/client-portal/page.tsx | Req | PostdLayout | Prod | Assets | Client view |
| /client-settings | client/app/(postd)/client-settings/page.tsx | Req | PostdLayout | Prod | - | Client config |
| /settings | client/app/(postd)/settings/page.tsx | Req | PostdLayout | Prod | System | Workspace settings |
| /billing | client/app/(postd)/billing/page.tsx | Req | PostdLayout | Prod | System | Billing mgmt |
| /insights-roi | client/app/(postd)/insights-roi/page.tsx | Req | PostdLayout | Prod | Strategy | ROI insights |
| /admin | client/app/(postd)/admin/page.tsx | Req | PostdLayout | Prod | System | Admin panel |
| /blog | client/app/(public)/blog/page.tsx | Public | Unauth | Prod | Public | Blog index |
| /blog/:slug | client/app/(public)/blog/[slug]/page.tsx | Public | Unauth | Prod | Public | Blog post |
| /legal/* | client/app/(public)/legal/*/page.tsx | Public | Unauth | Prod | Public | Legal pages |
| /auth/logout | (handler) | Req | - | Prod | System | Sign out |
| * | client/pages/NotFound.tsx | - | - | Prod | System | 404 page |

---

## File Structure

```
/client/
├── App.tsx                          # Main router setup
├── main.tsx                         # Entry point
├── app/
│   ├── (postd)/                     # Authenticated app pages
│   │   ├── dashboard/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── queue/page.tsx
│   │   ├── studio/page.tsx
│   │   ├── campaigns/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── reviews/page.tsx
│   │   ├── paid-ads/page.tsx
│   │   ├── events/page.tsx
│   │   ├── brand-guide/page.tsx
│   │   ├── library/page.tsx
│   │   ├── linked-accounts/page.tsx
│   │   ├── approvals/page.tsx
│   │   ├── content-generator/page.tsx
│   │   ├── brands/page.tsx
│   │   ├── brand-intake/page.tsx
│   │   ├── brand-snapshot/page.tsx
│   │   ├── brand-intelligence/page.tsx
│   │   ├── reporting/page.tsx
│   │   ├── client-portal/page.tsx
│   │   ├── client-settings/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── billing/page.tsx
│   │   ├── insights-roi/page.tsx
│   │   └── admin/page.tsx
│   └── (public)/                    # Public/marketing pages
│       ├── blog/
│       └── legal/
├── pages/                           # Compatibility/legacy directory
│   ├── Index.tsx                    # Landing page
│   ├── Pricing.tsx                  # Pricing page
│   ├── Onboarding.tsx               # Onboarding container
│   ├── NotFound.tsx                 # 404 page
│   ├── onboarding/                 # Onboarding step screens
│   │   ├── Screen1SignUp.tsx
│   │   ├── Screen2BusinessEssentials.tsx
│   │   ├── Screen3ExpectationSetting.tsx
│   │   ├── Screen3BrandIntake.tsx
│   │   ├── Screen3AiScrape.tsx
│   │   ├── Screen5BrandSummaryReview.tsx
│   │   ├── Screen6WeeklyFocus.tsx
│   │   ├── Screen7ContentGeneration.tsx
│   │   ├── Screen8CalendarPreview.tsx
│   │   ├── Screen9ConnectAccounts.tsx
│   │   └── Screen10DashboardWelcome.tsx
│   ├── _legacy/                     # Archived legacy pages
│   │   ├── onboarding/              # Legacy onboarding screens
│   │   │   ├── Screen2RoleSetup.tsx
│   │   │   ├── Screen4BrandSnapshot.tsx
│   │   │   ├── Screen45SetGoal.tsx
│   │   │   ├── Screen5GuidedTour.tsx
│   │   │   └── Screen35ConnectAccounts.tsx
│   │   └── [22 legacy page files]
│   └── _experiments/                # Experimental pages
│       ├── BatchCreativeStudio.tsx
│       └── AdminBilling.tsx
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── MainLayout.tsx           # Authenticated layout wrapper
│   │   ├── Header.tsx               # Top navigation bar
│   │   ├── Sidebar.tsx              # Main navigation sidebar
│   │   ├── MobileNav.tsx
│   │   ├── TopBar.tsx
│   │   ├── UnauthenticatedLayout.tsx # Public page layout
│   │   ├── KeyboardShortcuts.tsx
│   │   └── MainNavigation.tsx
│   ├── dashboard/                   # Page-specific components
│   ├── landing/                     # Landing page sections
│   └── ui/                          # Reusable UI components
├── contexts/
│   ├── AuthContext.tsx              # Auth state management
│   ├── WorkspaceContext.tsx         # Workspace management
│   ├── UserContext.tsx              # User data
│   └── BrandContext.tsx             # Brand data
├── hooks/                           # Custom React hooks
├── lib/                             # Utilities and helpers
├── types/                           # TypeScript type definitions
└── styles/                          # CSS and styling
```

---

## Key Implementation Details

### Route Registration (App.tsx)
- All protected routes registered in ProtectedRoutes() component
- Uses React Router's `<Routes>` with `<Route>` elements
- Catch-all route (`path="*"`) at end for 404 handling
- Single BrowserRouter at root level

### Navigation State Management
- Uses `useLocation()` hook to determine active route
- Compares `location.pathname` with route `href`
- Handles nested routes with prefix matching

### Layout Selection
- MainLayout automatically applied to all protected routes
- UnauthenticatedLayout for landing page
- ProtectedRoutes wrapper enforces auth checks before layout render

### Help System Integration
- PAGE_MAP in MainLayout maps paths to help page keys
- Specific help content for dashboard, calendar, library, studio, brand, analytics
- Default to "dashboard" help for unmapped routes

---

## Environment-Specific Behaviors

### Development
- Full route logging via console.error for 404s
- HMR (Hot Module Replacement) for instant updates
- Unoptimized component rendering

### Production
- Same routes and behaviors
- Code splitting via Vite
- Optimized bundle

---

## Summary

The POSTD platform uses a well-organized, role-based routing structure with:

1. **Clear separation** between public (/) and authenticated routes
2. **Multi-step onboarding** with state-driven screen display
3. **Organized navigation** into functional groups: Main, Strategy, Assets, System
4. **Beta feature support** with visual indicators and tooltips
5. **Help system integration** with page-specific context
6. **Responsive design** with hidden sidebar on mobile
7. **Workspace management** with context-based switching
8. **Proper 404 handling** with error logging and navigation options

All routes are protected by authentication checks and onboarding completion validation, ensuring users complete setup before accessing core functionality.
