# Client-Side Routing Map - Aligned AI Platform

## Overview
This document provides a comprehensive map of all client-side routes in the Aligned AI application. The application uses React Router v6 for client-side routing with Vite as the build tool.

---

## Architecture Overview

### Framework & Setup
- **Router**: React Router v6 (BrowserRouter)
- **Build Tool**: Vite
- **Layout System**: Component-based with MainLayout (protected) and UnauthenticatedLayout (public)
- **State Management**: Context API (AuthContext, WorkspaceContext, UserContext, BrandContext)
- **Location**: `/Users/krisfoust/Documents/GitHub/Aligned-20ai/client/`

### Entry Points
- **Main App Component**: `/client/App.tsx`
- **Pages Directory**: `/client/pages/`
- **Components Directory**: `/client/components/`
- **Layout Components**: `/client/components/layout/`

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
COMPONENT: Index.tsx
LAYOUT: UnauthenticatedLayout
AUTH: Required (redirects to / if not authenticated)
STATUS: Production
DESCRIPTION: Landing page with hero, features, testimonials
NAVIGATION: CTA buttons to /dashboard (if authed) or /onboarding (if not)
```

---

### 2. ONBOARDING FLOWS (Auth-Gated, Multi-Step)

#### Onboarding Container
```
PATH: /onboarding
COMPONENT: Onboarding.tsx
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
  COMPONENT: Screen1SignUp.tsx
  DESCRIPTION: User registration and initial setup

Step 2: Role Setup
  PATH: /onboarding?step=2
  COMPONENT: Screen2RoleSetup.tsx
  DESCRIPTION: Agency vs Single Business selection

Step 3: Brand Intake
  PATH: /onboarding?step=3
  COMPONENT: Screen3BrandIntake.tsx
  DESCRIPTION: Brand information collection

Step 3.5: Connect Accounts
  PATH: /onboarding?step=3.5
  COMPONENT: Screen35ConnectAccounts.tsx
  DESCRIPTION: Social media account connection

Step 4: Brand Snapshot
  PATH: /onboarding?step=4
  COMPONENT: Screen4BrandSnapshot.tsx
  DESCRIPTION: Brand voice, tone, colors, audience

Step 4.5: Set Goal
  PATH: /onboarding?step=4.5
  COMPONENT: Screen45SetGoal.tsx
  DESCRIPTION: Campaign goals and targets

Step 5: Guided Tour
  PATH: /onboarding?step=5
  COMPONENT: Screen5GuidedTour.tsx
  DESCRIPTION: Interactive product tour
  NOTE: Can be replayed from MainLayout help drawer
```

---

### 3. PROTECTED ROUTES (Authenticated Users Only)

#### MAIN NAVIGATION GROUP (Dashboard & Content)

```
PATH: /dashboard
COMPONENT: Dashboard.tsx
LAYOUT: MainLayout
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
COMPONENT: Calendar.tsx
LAYOUT: MainLayout
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
PATH: /content-queue
COMPONENT: ContentQueue.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: "Content Queue" (Main > ListTodo icon)
BREADCRUMB: Content Queue
DESCRIPTION: Content pipeline and approval queue
FEATURES: Post scheduling, status management
```

```
PATH: /creative-studio
COMPONENT: CreativeStudio.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: "Creative Studio" (Main > Sparkles icon)
BREADCRUMB: Creative Studio
DESCRIPTION: AI-powered creative asset generation
FEATURES: Template selection, AI generation, asset preview
```

#### STRATEGY NAVIGATION GROUP (Planning & Analytics)

```
PATH: /campaigns
COMPONENT: Campaigns.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: "Campaigns" (Strategy > Zap icon)
BREADCRUMB: Campaigns
DESCRIPTION: Campaign management and creation
FEATURES: Campaign builder, performance tracking
```

```
PATH: /analytics
COMPONENT: Analytics.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: "Analytics" (Strategy > BarChart3 icon)
BREADCRUMB: Analytics
DESCRIPTION: Performance metrics and insights
FEATURES: Multi-brand analytics, trend analysis
```

```
PATH: /reviews
COMPONENT: Reviews.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: "Reviews" (Strategy > Star icon)
BREADCRUMB: Reviews
DESCRIPTION: Client/customer review management
FEATURES: Review monitoring, sentiment analysis
```

```
PATH: /paid-ads
COMPONENT: PaidAds.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Beta (Feature flag: beta = true)
SIDEBAR: "Paid Ads" (Strategy > DollarSign icon) - Shows Beta badge
BREADCRUMB: Paid Ads
DESCRIPTION: Paid advertising campaign management
BETA_FLAG: Yes - displays "Beta" badge in sidebar with tooltip "Beta feature - coming soon"
FEATURES: Meta, Google, LinkedIn ad integration
COMING_SOON: Campaign creation wizard
```

```
PATH: /events
COMPONENT: Events.tsx
LAYOUT: MainLayout
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
COMPONENT: BrandGuide.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: "Brand Guide" (Assets > Palette icon)
BREADCRUMB: Brand Guide
DESCRIPTION: Brand guidelines documentation
FEATURES: Visual standards, color palette, typography
```

```
PATH: /library
COMPONENT: Library.tsx
LAYOUT: MainLayout
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
COMPONENT: LinkedAccounts.tsx
LAYOUT: MainLayout
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
COMPONENT: Approvals.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: (Not directly in main sidebar - likely accessed via content-queue)
DESCRIPTION: Content approval and review queue
FEATURES: Multi-level approval workflows
```

```
PATH: /content-generator
COMPONENT: ContentGenerator.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: (Not directly in main sidebar)
DESCRIPTION: AI-powered content generation tool
FEATURES: Template-based generation, batch creation
```

```
PATH: /brands
COMPONENT: Brands.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: (Not directly in main sidebar - strategy section)
DESCRIPTION: Multi-brand management
FEATURES: Brand listing, brand switching, creation
```

```
PATH: /brand-intake
COMPONENT: BrandIntake.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: (Strategy group, optional)
DESCRIPTION: Brand information intake form
FEATURES: Structured brand data collection
```

```
PATH: /brand-snapshot
COMPONENT: BrandSnapshot.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: (Strategy group, optional)
DESCRIPTION: Brand personality and identity snapshot
FEATURES: Voice, tone, audience, colors summary
```

```
PATH: /brand-intelligence
COMPONENT: BrandIntelligence.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: (Strategy group, likely)
DESCRIPTION: AI-powered brand insights and analysis
FEATURES: Competitive analysis, market positioning
```

```
PATH: /reporting
COMPONENT: Reporting.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: (Strategy group, optional)
DESCRIPTION: Report generation and distribution
FEATURES: Custom reports, scheduled delivery, export
```

```
PATH: /client-portal
COMPONENT: ClientPortal.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: (Assets group, optional)
DESCRIPTION: Client-facing portal for approvals and communications
FEATURES: Approval requests, client messaging
```

```
PATH: /client-settings
COMPONENT: ClientSettings.tsx
LAYOUT: MainLayout
AUTH: Required
STATUS: Production
SIDEBAR: (Not in sidebar - system settings)
DESCRIPTION: Client workspace settings and configuration
FEATURES: Invite management, permissions, workspace settings
```

#### SYSTEM SETTINGS GROUP

```
PATH: /settings
COMPONENT: Settings.tsx
LAYOUT: MainLayout
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
COMPONENT: Billing.tsx
LAYOUT: MainLayout
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
PATH: *
COMPONENT: NotFound.tsx
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
| / | Index.tsx | - | Unauth | Prod | Public | Landing page |
| /onboarding | Onboarding.tsx | Req | Custom | Prod | Auth | Multi-step wizard |
| /dashboard | Dashboard.tsx | Req | Main | Prod | Main | Command center |
| /calendar | Calendar.tsx | Req | Main | Prod | Main | Content calendar |
| /content-queue | ContentQueue.tsx | Req | Main | Prod | Main | Approval queue |
| /creative-studio | CreativeStudio.tsx | Req | Main | Prod | Main | AI generation |
| /campaigns | Campaigns.tsx | Req | Main | Prod | Strategy | Campaign mgmt |
| /analytics | Analytics.tsx | Req | Main | Prod | Strategy | Performance |
| /reviews | Reviews.tsx | Req | Main | Prod | Strategy | Review mgmt |
| /paid-ads | PaidAds.tsx | Req | Main | Beta | Strategy | Ad management |
| /events | Events.tsx | Req | Main | Prod | Strategy | Event scheduling |
| /brand-guide | BrandGuide.tsx | Req | Main | Prod | Assets | Brand guidelines |
| /library | Library.tsx | Req | Main | Prod | Assets | Asset management |
| /linked-accounts | LinkedAccounts.tsx | Req | Main | Prod | Assets | Social connections |
| /approvals | Approvals.tsx | Req | Main | Prod | - | Review queue |
| /content-generator | ContentGenerator.tsx | Req | Main | Prod | - | Content AI |
| /brands | Brands.tsx | Req | Main | Prod | - | Multi-brand |
| /brand-intake | BrandIntake.tsx | Req | Main | Prod | Strategy | Brand form |
| /brand-snapshot | BrandSnapshot.tsx | Req | Main | Prod | Strategy | Brand summary |
| /brand-intelligence | BrandIntelligence.tsx | Req | Main | Prod | Strategy | Brand insights |
| /reporting | Reporting.tsx | Req | Main | Prod | Strategy | Reports |
| /client-portal | ClientPortal.tsx | Req | Main | Prod | Assets | Client view |
| /client-settings | ClientSettings.tsx | Req | Main | Prod | - | Client config |
| /settings | Settings.tsx | Req | Main | Prod | System | Workspace settings |
| /billing | Billing.tsx | Req | Main | Prod | System | Billing mgmt |
| /auth/logout | (handler) | Req | - | Prod | System | Sign out |
| * | NotFound.tsx | - | - | Prod | System | 404 page |

---

## File Structure

```
/client/
├── App.tsx                          # Main router setup
├── main.tsx                         # Entry point
├── pages/
│   ├── Index.tsx                   # Landing page
│   ├── Onboarding.tsx              # Onboarding container
│   ├── onboarding/
│   │   ├── Screen1SignUp.tsx
│   │   ├── Screen2RoleSetup.tsx
│   │   ├── Screen3BrandIntake.tsx
│   │   ├── Screen35ConnectAccounts.tsx
│   │   ├── Screen4BrandSnapshot.tsx
│   │   ├── Screen45SetGoal.tsx
│   │   └── Screen5GuidedTour.tsx
│   ├── Dashboard.tsx
│   ├── Calendar.tsx
│   ├── ContentQueue.tsx
│   ├── CreativeStudio.tsx
│   ├── Campaigns.tsx
│   ├── Analytics.tsx
│   ├── Reviews.tsx
│   ├── PaidAds.tsx
│   ├── Events.tsx
│   ├── BrandGuide.tsx
│   ├── Library.tsx
│   ├── LinkedAccounts.tsx
│   ├── Approvals.tsx
│   ├── ContentGenerator.tsx
│   ├── Brands.tsx
│   ├── BrandIntake.tsx
│   ├── BrandSnapshot.tsx
│   ├── BrandIntelligence.tsx
│   ├── Reporting.tsx
│   ├── ClientPortal.tsx
│   ├── ClientSettings.tsx
│   ├── Settings.tsx
│   ├── Billing.tsx
│   └── NotFound.tsx
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

The Aligned AI platform uses a well-organized, role-based routing structure with:

1. **Clear separation** between public (/) and authenticated routes
2. **Multi-step onboarding** with state-driven screen display
3. **Organized navigation** into functional groups: Main, Strategy, Assets, System
4. **Beta feature support** with visual indicators and tooltips
5. **Help system integration** with page-specific context
6. **Responsive design** with hidden sidebar on mobile
7. **Workspace management** with context-based switching
8. **Proper 404 handling** with error logging and navigation options

All routes are protected by authentication checks and onboarding completion validation, ensuring users complete setup before accessing core functionality.
