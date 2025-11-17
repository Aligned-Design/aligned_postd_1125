# Client-Side Routing Documentation Index

This directory contains comprehensive documentation of the Aligned AI application's client-side routing structure, navigation system, and authentication flows.

## Documentation Files

### 1. CLIENT_ROUTING_MAP.md (842 lines, 23 KB)
**Comprehensive routing reference with detailed descriptions**

Complete mapping of every route in the application including:
- Architecture overview and framework details
- Authentication and protection mechanisms
- Full route hierarchy organized by function (Main, Strategy, Assets, System)
- Onboarding flow with all 7 steps
- Navigation components (Header, Sidebar, MainLayout)
- Workspace and context systems
- Special route behaviors and redirects
- Route guards and middleware
- Beta features and coming soon functionality
- Help system integration
- Responsive design behaviors
- Layout component hierarchy
- Context providers and their purposes

**Best for**: Understanding the complete structure, finding specific routes, learning how features connect

### 2. CLIENT_ROUTING_DIAGRAMS.md (485 lines, 24 KB)
**Visual ASCII diagrams of routing architecture**

Contains flowcharts and architecture diagrams:
- Application routing flow (with guard checks)
- Sidebar navigation hierarchy
- Route protection pyramid (3 levels)
- Authentication state machine
- Route groups with features
- Onboarding flow diagram
- Beta features summary
- Navigation state management
- Layout component hierarchy
- Context providers diagram
- Error handling & special routes
- Responsive breakpoints

**Best for**: Visualizing relationships, understanding flows, presentations

### 3. CLIENT_ROUTING_QUICK_REFERENCE.md (301 lines, 9.1 KB)
**Quick lookup tables and common operations**

Includes:
- Key files and locations
- Route tables at a glance (grouped by category)
- Authentication and protection overview
- Layout components summary
- Active route styling
- Beta features list
- Responsive behavior grid
- Common code patterns
- Common operations (check auth, navigate, logout)
- Navigation contexts summary
- Quick troubleshooting table
- File navigation instructions
- Files affected by feature changes

**Best for**: Quick lookups, common tasks, troubleshooting

## Quick Navigation

### I Need to...

| Task | File | Section |
|------|------|---------|
| Find a specific route | QUICK_REFERENCE | Route tables |
| Understand the whole architecture | ROUTING_MAP | Architecture Overview |
| See how auth works | DIAGRAMS | Authentication State Machine |
| Add a new page | QUICK_REFERENCE | File Navigation |
| Find all beta features | DIAGRAMS | Beta Features & Coming Soon |
| Understand sidebar organization | DIAGRAMS | Sidebar Navigation Hierarchy |
| Check if a route is protected | ROUTING_MAP | Route Hierarchy section |
| See all available routes | QUICK_REFERENCE | Routes at a Glance |
| Understand onboarding steps | DIAGRAMS | Onboarding Flow |
| Know what contexts exist | DIAGRAMS | Context Providers section |
| Troubleshoot routing issues | QUICK_REFERENCE | Quick Troubleshooting |

## Key Statistics

### Routes by Category
- **Public Routes**: 2 (landing, 404)
- **Onboarding Routes**: 7 steps
- **Protected Routes**: 27 routes
  - Main Group: 4 routes
  - Strategy Group: 9 routes
  - Assets Group: 4 routes
  - System Group: 3 routes
  - Additional: 4 routes
- **Total Routes**: 36

### Navigation Structure
- **Sidebar Groups**: 4 (Main, Strategy, Assets, System)
- **Sidebar Items**: 14 (visible in main navigation)
- **Beta Features**: 1 (Paid Ads)
- **Onboarding Steps**: 7 (including half-steps)

### Files Involved
- **Page Files**: 27 files
- **Layout Components**: 9 files
- **Context Files**: 4 files
- **Navigation Components**: Multiple dashboard components

## Core Concepts

### Authentication Levels
1. **Public** - Unauthenticated users (/, *)
2. **Auth-Gated** - Users authenticated but in onboarding (/onboarding)
3. **Protected** - Fully authenticated users (all others)

### Navigation Groups
- **Main**: Daily workflow (Dashboard, Calendar, Content Queue, Creative Studio)
- **Strategy**: Planning & analytics (Campaigns, Analytics, Reviews, Paid Ads, Events)
- **Assets**: Resources (Brand Guide, Library, Linked Accounts)
- **System**: Configuration (Settings, Billing, Logout)

### Route Guards
- `ProtectedRoutes()` component in App.tsx
- Checks: isAuthenticated, onboardingStep
- Automatic redirects based on auth state

### Context System
- AuthContext: User & onboarding state
- WorkspaceContext: Workspace management
- UserContext: User preferences
- BrandContext: Brand management

## File Locations

```
/Users/krisfoust/Documents/GitHub/Aligned-20ai/

Core Routing Files:
├─ client/App.tsx                       (main router)
├─ client/pages/                        (27 page components)
├─ client/components/layout/            (layout & nav components)
├─ client/contexts/                     (auth & state providers)

Documentation:
├─ CLIENT_ROUTING_MAP.md                (this directory)
├─ CLIENT_ROUTING_DIAGRAMS.md
├─ CLIENT_ROUTING_QUICK_REFERENCE.md
└─ ROUTING_DOCUMENTATION_INDEX.md       (you are here)
```

## How to Use This Documentation

### For Development
1. Start with **QUICK_REFERENCE** for route paths and common patterns
2. Reference **ROUTING_MAP** for detailed information about specific routes
3. Use **DIAGRAMS** to understand how components connect

### For Navigation Design
1. Review **DIAGRAMS** > Sidebar Navigation Hierarchy
2. Check **QUICK_REFERENCE** > Sidebar Navigation Groups
3. Reference **ROUTING_MAP** > Navigation Components

### For Authentication
1. Study **DIAGRAMS** > Authentication State Machine
2. Reference **ROUTING_MAP** > Authentication & Protection
3. Check **ROUTING_MAP** > Route Guards section

### For Onboarding
1. Review **DIAGRAMS** > Onboarding Flow
2. See **ROUTING_MAP** > Onboarding Flows section
3. Check step details in ROUTING_MAP for each Screen

### For Adding Features
1. Consult **QUICK_REFERENCE** > File Navigation
2. Reference **ROUTING_MAP** > Route Hierarchy for location
3. Update **QUICK_REFERENCE** > Files Changed by Feature

## Important Routes & Entry Points

### Public Entry
- `/` - Landing page (Index.tsx)

### Onboarding Entry
- `/onboarding` - Onboarding container
- Steps 1-5 controlled via onboardingStep state

### Main Application Hubs
- `/dashboard` - Default landing after onboarding
- `/calendar` - Content scheduling
- `/settings` - Configuration

### Beta/Experimental
- `/paid-ads` - Beta feature (marked with badge)

### Special Routes
- `/auth/logout` - Sign out handler
- `*` - 404 Not Found

## Navigation Features

### Sidebar Navigation (Desktop ≥768px)
- 4 organized groups
- Active route highlighting (lime-400)
- Workspace switcher at top
- Help and settings at bottom
- Responsive collapse on mobile

### Header Navigation
- Logo and branding
- Global search
- Help drawer trigger
- Notifications
- User profile menu

### Breadcrumbs
- Context-aware page identification
- Help system integration
- Page-specific tooltips

## States & Styling

### Route Active States
```
Active:   lime-400 background + indigo-950 text + shadow
Hover:    white/10 background + white text
Default:  white/70 text on indigo background
```

### Badge States
```
Beta Badge:  amber-400/20 background + amber-200 text + border
Info Badge:  red/destructive background for counts
```

## Context & State Management

### AuthContext
- Controls: user, isAuthenticated, onboardingStep, brandSnapshot
- Persists: localStorage (aligned_user, aligned_brand, aligned_onboarding_step)
- Methods: signUp, updateUser, setOnboardingStep, completeOnboarding, logout

### WorkspaceContext
- Controls: currentWorkspace, workspaces
- Methods: switchWorkspace, createWorkspace, updateWorkspace, addMember

### Help System
- Integrated: MainLayout.tsx with PAGE_MAP
- Supports: 6 page-specific help contexts
- Replayable: Onboarding tour (step 5)

## Mobile Responsiveness

### Breakpoints
```
Desktop (≥md / 768px):   Full sidebar visible
Tablet (sm-md):          Full sidebar visible
Mobile (<sm / <640px):   Sidebar hidden/collapsed
```

### Adaptive Components
- Header: Always visible, responsive content
- Sidebar: Hidden on mobile, fixed on desktop
- Content: Full width adaptation
- Search: Context-dependent visibility

## Common Maintenance Tasks

### Adding a New Route
1. Create page in `/client/pages/NewPage.tsx`
2. Add to `/client/App.tsx` routes
3. Add to sidebar in `/client/components/layout/Sidebar.tsx`
4. Add to documentation files

### Updating Navigation
- Edit `/client/components/layout/Sidebar.tsx`
- Update navGroups array
- Update QUICK_REFERENCE table

### Modifying Auth
- Edit `/client/contexts/AuthContext.tsx`
- Update `/client/App.tsx` ProtectedRoutes
- Update documentation

### Adding Help Content
- Update `/client/components/layout/MainLayout.tsx` PAGE_MAP
- Add help content to HelpDrawer

## Quick Fact Sheet

- **Router Framework**: React Router v6
- **Build Tool**: Vite
- **Auth Method**: LocalStorage-based mock auth
- **State Management**: Context API
- **Layout System**: Component-based (MainLayout, UnauthenticatedLayout)
- **Mobile First**: Yes (responsive at all breakpoints)
- **Protected Routes**: 27 + public landing
- **Onboarding Steps**: 7
- **Beta Features**: 1 (Paid Ads)
- **Navigation Groups**: 4
- **Help Pages Mapped**: 6

## Updates & Modifications

This documentation was last generated on: 2025-11-11

When modifying routing:
1. Update the relevant route file
2. Update App.tsx if route registration changes
3. Update Sidebar.tsx if navigation changes
4. Update appropriate documentation file
5. Test responsive behavior across breakpoints

---

For detailed information, see the specific documentation files listed above.
