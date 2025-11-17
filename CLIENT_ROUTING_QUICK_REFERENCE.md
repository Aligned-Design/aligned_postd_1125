# Client Routing - Quick Reference Guide

## Key Files
- **Main Router**: `/client/App.tsx`
- **Layout Components**: `/client/components/layout/`
- **Page Files**: `/client/pages/*.tsx`
- **Auth Logic**: `/client/contexts/AuthContext.tsx`

## Routes at a Glance

### Public Routes
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Index.tsx | Landing page (shows if not authenticated) |
| `*` | NotFound.tsx | 404 Page for invalid routes |

### Onboarding Flow
| Step | Component | Key Task |
|------|-----------|----------|
| 1 | Screen1SignUp | User registration |
| 2 | Screen2RoleSetup | Agency vs Single Business |
| 3 | Screen3BrandIntake | Brand info collection |
| 3.5 | Screen35ConnectAccounts | OAuth social setup |
| 4 | Screen4BrandSnapshot | Brand identity (voice, colors) |
| 4.5 | Screen45SetGoal | Goal & KPI setting |
| 5 | Screen5GuidedTour | Product tour (replayable) |

### Protected Routes - Main (Content Workflow)
| Path | Component | Icon | Purpose |
|------|-----------|------|---------|
| `/dashboard` | Dashboard.tsx | Home | Daily command center |
| `/calendar` | Calendar.tsx | Calendar | Multi-view content calendar |
| `/content-queue` | ContentQueue.tsx | ListTodo | Approval pipeline |
| `/creative-studio` | CreativeStudio.tsx | Sparkles | AI asset generation |

### Protected Routes - Strategy (Planning)
| Path | Component | Icon | Status | Purpose |
|------|-----------|------|--------|---------|
| `/campaigns` | Campaigns.tsx | Zap | Prod | Campaign builder |
| `/analytics` | Analytics.tsx | BarChart3 | Prod | Performance metrics |
| `/reviews` | Reviews.tsx | Star | Prod | Review management |
| `/paid-ads` | PaidAds.tsx | DollarSign | BETA | Ad campaigns |
| `/events` | Events.tsx | MapPin | Prod | Event scheduling |
| `/brand-intake` | BrandIntake.tsx | - | Prod | Brand data form |
| `/brand-snapshot` | BrandSnapshot.tsx | - | Prod | Brand summary |
| `/brand-intelligence` | BrandIntelligence.tsx | - | Prod | AI insights |
| `/reporting` | Reporting.tsx | - | Prod | Report generation |

### Protected Routes - Assets (Resources)
| Path | Component | Icon | Purpose |
|------|-----------|------|---------|
| `/brand-guide` | BrandGuide.tsx | Palette | Visual standards |
| `/library` | Library.tsx | Library | Asset management |
| `/linked-accounts` | LinkedAccounts.tsx | Link2 | Social connections |
| `/client-portal` | ClientPortal.tsx | - | Client interface |

### Protected Routes - System (Settings)
| Path | Component | Icon | Purpose |
|------|-----------|------|---------|
| `/settings` | Settings.tsx | Settings | Workspace & team config |
| `/billing` | Billing.tsx | - | Subscription management |
| `/auth/logout` | (handler) | LogOut | Sign out |

### Additional Protected Routes
| Path | Component | Purpose |
|------|-----------|---------|
| `/approvals` | Approvals.tsx | Content approval queue |
| `/content-generator` | ContentGenerator.tsx | AI content generation |
| `/brands` | Brands.tsx | Multi-brand management |
| `/client-settings` | ClientSettings.tsx | Client config |

## Authentication & Protection

### Three-Level Route Guard
```javascript
// In ProtectedRoutes() (App.tsx)
1. User not authenticated?      → Show landing page (/)
2. User authenticated + onboarding active? → Show onboarding screens
3. User fully authenticated?     → Show protected routes (with MainLayout)
```

### LocalStorage Keys
- `aligned_user` - Full user object
- `aligned_brand` - Brand snapshot data  
- `aligned_onboarding_step` - Current onboarding step (1-5)

## Layout Components

### MainLayout (Protected Routes)
```
Header
├─ Logo
├─ Search
├─ Help Icon
├─ Notifications
└─ User Profile

Sidebar (Desktop only)
├─ Workspace Switcher
├─ Main Group (4 items)
├─ Strategy Group (5 items)
├─ Assets Group (3 items)
└─ System Section (2 items)

Main Content Area
└─ Page Component
```

### Sidebar Navigation Groups
- **Main**: Dashboard, Calendar, Content Queue, Creative Studio
- **Strategy**: Campaigns, Analytics, Reviews, Paid Ads (Beta), Events
- **Assets**: Brand Guide, Library, Linked Accounts  
- **System**: Settings, Sign Out

## Active Route Styling
- **Active**: Lime-400 background + indigo-950 text + shadow
- **Hover**: White/10 background + white text
- **Default**: White/70 text on indigo background

## Beta Features
- **Paid Ads** (`/paid-ads`)
  - Shows "Beta" badge in sidebar
  - Tooltip: "Beta feature - coming soon"
  - Feature flag: `beta: true`

## Responsive Behavior
- **Desktop (≥768px)**: Sidebar visible, 64 units wide
- **Tablet (640-768px)**: Sidebar visible, 64 units wide
- **Mobile (<640px)**: Sidebar hidden

## Common Patterns

### Route Matching
```javascript
// Exact match
isActive = location.pathname === '/dashboard'

// Nested match
isActive = location.pathname.startsWith('/calendar/')
```

### Navigation
```javascript
// Use Link from react-router-dom
import { Link } from 'react-router-dom';
<Link to="/dashboard">Dashboard</Link>

// Or useNavigate hook
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/dashboard');
```

### Route Protection
```javascript
// All routes wrapped automatically
// Just add MainLayout to any protected page
import { MainLayout } from "@/components/layout/MainLayout";

export default function MyPage() {
  return (
    <MainLayout>
      {/* Page content */}
    </MainLayout>
  );
}
```

## Help System Integration
Maps routes to help pages:
- `/dashboard` → dashboard help
- `/calendar` → calendar help
- `/library` → library help
- `/creative-studio` → studio help
- `/brand-guide` → brand help
- `/analytics` → analytics help

Users can open help with:
- Help icon in header
- Can replay tour from help drawer (`/onboarding?step=5`)

## Common Operations

### Check If User Is Authenticated
```javascript
import { useAuth } from "@/contexts/AuthContext";

const { isAuthenticated, user } = useAuth();
```

### Check If User Completed Onboarding
```javascript
const { onboardingStep } = useAuth();
if (onboardingStep) {
  // Still in onboarding
} else {
  // Onboarding complete
}
```

### Navigate to Different Pages
```javascript
const navigate = useNavigate();
navigate('/dashboard');           // Go to dashboard
navigate('/calendar');            // Go to calendar
navigate('/onboarding?step=5');   // Go to tour step
navigate('/');                    // Go to home
```

### Handle Logout
- Click "Sign Out" in sidebar → `/auth/logout`
- Clears: user, brand snapshot, onboarding step
- Redirects to landing page

## Navigation Contexts

### AuthContext
- Manages: user, isAuthenticated, onboardingStep, brandSnapshot
- Methods: signUp, updateUser, setOnboardingStep, completeOnboarding, logout

### WorkspaceContext  
- Manages: currentWorkspace, workspaces
- Methods: switchWorkspace, createWorkspace, updateWorkspace

### UserContext
- Manages: user profile and preferences
- Methods: updateProfile, setPreferences

### BrandContext
- Manages: current brand and brand list
- Methods: selectBrand, updateBrand

## Page Help Drawer
- Opened via Help icon in header
- Shows context-specific help
- Escape key closes it
- Can replay onboarding tour (step 5)

## Sidebar Active State Detection
```javascript
// Determines active item
const isActive = location.pathname === item.href 
  || (item.href !== "/" && location.pathname.startsWith(item.href + "/"))

// Visual indicator: lime-400 highlight
```

## Quick Troubleshooting

| Issue | Check |
|-------|-------|
| Route not showing | Is user authenticated? Onboarding complete? |
| Can't access protected route | User auth state in AuthContext |
| 404 page showing | Route path typo or missing route registration |
| Sidebar not visible | Mobile view? Desktop ≥768px shows sidebar |
| Help drawer not opening | Check MainLayout PAGE_MAP for route |
| Beta feature acting strange | Check beta flag in Sidebar.tsx |

## File Navigation

### To Add a New Protected Route
1. Create page file: `/client/pages/MyPage.tsx`
2. Import MainLayout: `import { MainLayout } from "@/components/layout/MainLayout"`
3. Wrap content: `<MainLayout>{/* page content */}</MainLayout>`
4. Register route in `App.tsx`: `<Route path="/my-page" element={<MyPage />} />`
5. (Optional) Add to sidebar in `/client/components/layout/Sidebar.tsx`

### To Add a Sidebar Navigation Item
1. Edit `/client/components/layout/Sidebar.tsx`
2. Add to appropriate navGroup (Main, Strategy, Assets, System)
3. Include: icon, label, href
4. Optional: add beta flag or badge

### To Update Onboarding
1. Edit `/client/pages/Onboarding.tsx` to add/change steps
2. Modify step screens in `/client/pages/onboarding/`
3. Update step numbers in screens map (1-5)
4. Update AuthContext.tsx OnboardingStep type if needed

---

## Files Changed by Feature

### Adding New Page
- `/client/pages/NewPage.tsx` (create)
- `/client/App.tsx` (add route)
- `/client/components/layout/Sidebar.tsx` (add nav item)

### Modifying Auth
- `/client/contexts/AuthContext.tsx`
- `/client/App.tsx` (ProtectedRoutes)

### Updating Navigation
- `/client/components/layout/Sidebar.tsx`
- `/client/components/layout/Header.tsx`
- `/client/components/layout/MainLayout.tsx`

### Adding Help Content
- `/client/components/layout/MainLayout.tsx` (PAGE_MAP)
- `/client/components/dashboard/HelpDrawer.tsx`

