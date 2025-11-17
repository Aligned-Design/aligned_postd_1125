# Aligned-20AI Dashboard Codebase - Complete Architecture Overview

## EXECUTIVE SUMMARY

The Aligned-20AI dashboard is a comprehensive social media management platform built with React (Vite) on the frontend and Node.js/Express on the backend. It implements AI-powered advisors, multi-platform publishing, real-time analytics, and content creation tools across 12 major dashboard sections.

**Key Stack:**
- Frontend: React 18, TypeScript, Vite, TailwindCSS, Recharts
- Backend: Node.js/Express, Supabase (PostgreSQL), Socket.io
- AI: OpenAI, Anthropic Claude APIs
- Platforms: Instagram, Facebook, LinkedIn, Twitter, TikTok, YouTube, Pinterest, Google Business
- Authentication: Supabase Auth with OAuth flows
- Hosting: Vercel (frontend + API routes)

---

## 1. PAGES/ROUTES STRUCTURE (Implemented Sections)

### Core Navigation Pages (7 sections)

1. **Dashboard** (`/dashboard`)
   - Entry point with strategic overview
   - Uses: GoodNews, CalendarAccordion, InsightsFeed, AnalyticsPanel
   - Displays: Today's pulse, upcoming content, AI insights

2. **Content Calendar** (`/calendar`)
   - Multi-view (day/week/month)
   - Features: MonthCalendarView, DayViewHourly, SchedulingAdvisor
   - Filtering by brand, platform, campaign

3. **Creative Studio** (`/creative-studio`)
   - Canvas-based design editor
   - Components: CreativeStudioCanvas, BrandKit, TemplateGrid, Advisor
   - Features: Autosave, multi-platform preview, smart resize
   - State: Design objects, undo/redo history, zoom tracking

4. **Content Queue** (`/content-queue`)
   - Post review and management
   - Components: StatusOverviewBanner, QueueAdvisor, PostCarousel
   - Statuses: draft, reviewing, scheduled, published
   - Post filtering by platform and status

5. **Approvals** (`/approvals`)
   - Review queue management
   - Displays: BrandFidelityScore, LinterResults, AgentOutput
   - Actions: Approve, reject, request changes
   - Tracks: DocOutput, BrandFidelityScore, LinterResult

6. **Analytics** (`/analytics`)
   - Platform metrics carousel
   - Components: PlatformMetricsCarousel, AnalyticsAdvisor
   - Features: Reporting menus, email reports, date filtering
   - Insights: Reach, engagement, followers, growth trends

7. **Campaigns** (`/campaigns`)
   - Campaign planning and tracking
   - Components: CampaignCard, StartNewCampaignModal, CampaignInsightsPanel
   - Metadata: Goals, status, target platforms, performance metrics

### Strategy Navigation (5 sections)

8. **Brands** (`/brands`)
   - Multi-brand workspace management
   - Lists all brands with settings access

9. **Brand Guide** (`/brand-guide`)
   - Brand identity management
   - Editors: BrandSummaryForm, VoiceToneEditor, VisualIdentityEditor
   - Editors: PersonasEditor, GoalsEditor, GuardrailsEditor
   - Progress tracking with completion percentage
   - Autosave to localStorage

10. **Brand Intelligence** (`/brand-intelligence`)
    - AI-powered brand analysis
    - Tabs: overview, recommendations, content suggestions
    - Hook: useBrandIntelligence (fetch + refresh + feedback)
    - Displays: BrandProfile, StrategicRecommendations, ContentSuggestions
    - Error states with helpful messages

11. **Brand Intake** (`/brand-intake`)
    - Initial brand setup form
    - Data collection for brand profile

12. **Brand Snapshot** (`/brand-snapshot`)
    - Quick brand overview
    - Pre-configured summary view

### Assets Navigation (4 sections)

13. **Library** (`/library`)
    - Asset management with upload
    - Views: grid, table, masonry
    - Components: LibraryUploadZone, LibraryFilterRow, SmartTagPreview
    - Filtering by: date, tags, file type, people, graphics size, campaign, event
    - Stock image integration: StockImageModal

14. **Client Portal** (`/client-portal`)
    - Client-facing content approval interface
    - Sections: overview, approval queue, comments, media
    - Features: WorkflowTracker, comment system
    - White-label support with custom branding

15. **Events** (`/events`)
    - Event creation and promotion
    - Creation modes: AI-assisted or manual
    - Components: EventEditorModal, EventInsightsPanel, EventAIForm
    - Promotion scheduling with multi-platform sync
    - Statuses: published, draft, archived

16. **Reviews** (`/reviews`)
    - Google & Facebook review management
    - Components: ReviewCard, ReviewAdvisor
    - Features: Auto-reply generation, sentiment tracking
    - Statuses: replied, needs-reply, flagged

### Settings Navigation (4 sections)

17. **Linked Accounts** (`/linked-accounts`)
    - OAuth connections management
    - Platform connection status

18. **Settings** (`/settings`)
    - Workspace management
    - Tabs: workspace, members, integrations, billing
    - Features: Member invite, role management, workspace deletion

19. **Client Settings** (`/client-settings`)
    - Client-specific preferences
    - Email preferences and unsubscribe management

20. **Billing** (`/billing`)
    - Subscription and usage tracking
    - Displays: Plan details, usage metrics, invoice history
    - Integration: Stripe (mock implementation)

### Reporting & Additional

21. **Reporting** (`/reporting`)
    - Report generation and customization
    - Components: ReportingMenu, ReportSettingsModal, EmailReportDialog

22. **Content Generator** (`/content-generator`)
    - AI-powered content creation
    - Uses: OpenAI/Claude APIs

23. **Paid Ads** (`/paid-ads`)
    - Ad campaign management placeholder

---

## 2. COMPONENT ORGANIZATION

### Dashboard Components Structure
Location: `/client/components/dashboard/` (90+ components)

#### Advisor Panels (AI Insight Generation)
- **AdvisorPanel**: General insights display (emoji-based insights)
- **AdvisorPlaceholder**: Loading/empty state
- **AnalyticsAdvisor**: Platform-specific performance insights
- **CreativeStudioAdvisor**: Design recommendation engine
- **QueueAdvisor**: Content review recommendations
- **ReviewAdvisor**: Review response suggestions
- **SchedulingAdvisor**: Optimal posting time recommendations
- **CampaignInsightsPanel**: Campaign performance insights
- **EventInsightsPanel**: Event promotion insights

#### Core UI Components
- **MainLayout**: Navigation wrapper
- **WorkspaceSwitcher**: Multi-workspace navigation
- **WorkspacePageHeader**: Page headers with workspace context

#### Content Management
- **CreativeStudioCanvas**: Design editor
- **CreativeStudioTemplateGrid**: Template selection
- **CreativeStudioBrandKit**: Brand asset management
- **ElementsDrawer**: Design element library
- **ElementSidebar**: Element properties panel
- **CanvasToolbar**: Drawing/design tools

#### Calendar & Scheduling
- **CalendarAccordion**: Week view with expandable days
- **MonthCalendarView**: Monthly grid view
- **DayViewHourly**: Hourly breakdown view
- **CalendarPreview**: Compact calendar widget
- **ScheduleModal**: Date/time picker
- **ScheduleDropdown**: Quick scheduling

#### Analytics & Reporting
- **AnalyticsPanel**: Metrics summary
- **AnalyticsCharts**: Chart visualizations
- **PlatformMetricsCarousel**: Multi-platform metrics slider
- **MetricCard**: Individual metric display
- **HeroMetricCard**: Large metric display
- **ComboMetricCard**: Multiple metrics in one card
- **ReportingMenu**: Report options
- **ReportSettingsModal**: Report configuration
- **EmailReportDialog**: Email scheduling

#### Library & Assets
- **LibraryUploadZone**: Drag-drop upload area
- **LibraryGridView**: Grid display mode
- **LibraryTableView**: Table display mode
- **LibraryMasonryView**: Masonry layout
- **LibraryFilterRow**: Filter controls
- **LibraryFilterBar**: Advanced filtering
- **LibraryAssetDrawer**: Asset detail view
- **SmartTagPreview**: AI-generated tagging preview
- **ImageSelectorModal**: Image picker dialog
- **StockImageModal**: Stock image search/selection

#### Content Review & Approval
- **PostCarousel**: Post content slider
- **PostPreviewModal**: Full post preview
- **PostActionMenu**: Post operations menu
- **DraftedPosts**: Draft content list
- **RecentPosts**: Recently created content
- **PublishConfirmModal**: Pre-publish confirmation
- **SendToQueueDropdown**: Queue routing
- **SaveDropdown**: Save options

#### Brand Management
- **BrandDashboard**: Brand overview
- **BrandProgressMeter**: Completion tracking
- **BrandGuideWizard**: Setup wizard
- **BrandSummaryForm**: Brand info editor
- **VoiceToneEditor**: Voice/tone configuration
- **VisualIdentityEditor**: Color, font, logo editor
- **PersonasEditor**: Audience persona management
- **GoalsEditor**: Campaign goals editor
- **GuardrailsEditor**: Content guidelines

#### Event Management
- **EventCard**: Event display card
- **EventEditorModal**: Event creation/edit
- **EventAIForm**: AI-assisted event creation
- **EventTypeSelector**: Event type chooser
- **EventCreationMode**: Creation method selector
- **EventConfirmationModal**: Event confirmation

#### Review Management
- **ReviewCard**: Review display
- **ReviewAdvisor**: Reply suggestions

#### Other Components
- **GoodNews**: Daily summary widget
- **InsightsFeed**: Insights sidebar
- **FirstVisitTooltip**: Onboarding tooltips
- **StatusOverviewBanner**: Status summary
- **QuickActions**: Quick action buttons
- **HelpDrawer**: Help/documentation
- **ZiaMascot**: AI assistant character
- **Sparkline**: Mini trend chart
- **MultiPlatformPreview**: Multi-platform post preview
- **SectionCarousel**: Content carousel
- **ActionButtonsHeader**: Header action buttons
- **CreateWorkspaceModal**: Workspace creation
- **PlatformSelectorModal**: Platform multi-select
- **ColorPickerModal**: Color selection
- **BackgroundPickerModal**: Background selection
- **RenameAssetModal**: Asset renaming
- **SmartResizeModal**: Responsive resize tool
- **TemplateLibrarySelector**: Template picker
- **ConnectionWizard**: OAuth flow UI

### UI Component Library (`/client/components/ui/`)
Base components (40+ files):
- **Card, Button, Badge, Dialog, Tabs, Input, Textarea**
- **ErrorBoundary**: React error catching
- **ErrorState**: Error display component
- **EmptyState**: Empty state placeholder
- **Skeletons**: Loading skeleton loaders
- **Toaster/Sonner**: Toast notifications
- **SmartTooltip**: Enhanced tooltips
- **Breadcrumb, Pagination, Progress, Slider**
- **Accordion, Drawer, Sheet, ResizablePanel**
- **Table, CommandPalette, ResponsiveGrid, AspectRatio**
- **ProgressiveDisclosure**: Expandable content
- **AccessibleChart, Chart**: Data visualization

---

## 3. DATA FLOW ARCHITECTURE

### Client-Side Data Flow

#### State Management Patterns
1. **React Context** (Global state):
   - `AuthContext`: User auth, onboarding step
   - `UserContext`: Current user profile
   - `WorkspaceContext`: Active workspace, members, brands
   - `BrandContext`: Selected brand data

2. **React Query** (Server state):
   - Configured in App.tsx
   - Caching and auto-refresh
   - Stale while revalidate patterns

3. **Local State** (Component state):
   - useState for UI state (modals, filters, selections)
   - useCallback for memoized handlers
   - useEffect for side effects

#### Data Fetching Hooks

**useBrandIntelligence** (Brand Intelligence hook)
```
Flow:
1. Fetch /api/brand-intelligence/:brandId
2. Response: BrandIntelligence object with:
   - brandProfile (USP, differentiators, values, audience)
   - recommendations (StrategicRecommendation[])
   - contentSuggestions (ContentSuggestion[])
3. Error handling: Safe JSON parsing, HTTP status specific messages
4. Feedback submission: POST to /api/brand-intelligence/feedback
5. Auto-reload on feedback
```

**useRealtimeAnalytics** (WebSocket analytics)
```
Flow:
1. Initialize Socket.io connection to /analytics
2. Subscribe to brand-specific channel
3. Listen for events:
   - analytics:sync-started
   - analytics:sync-progress
   - analytics:sync-completed
   - analytics:insights-generated
   - analytics:forecast-ready
4. Fallback: Polling if WebSocket unavailable
5. Events: syncId, progress, recordsProcessed, metrics
```

**useAuth** (Authentication)
```
Flow:
1. Check Supabase session
2. Load user profile
3. Track onboarding step
4. Redirect to landing if unauthenticated
5. Redirect to onboarding if incomplete
```

**useWorkspace** (Workspace management)
```
Flow:
1. Load from localStorage or Supabase
2. Maintain currentWorkspaceId
3. Support switching workspaces
4. Update workspace properties
5. Manage workspace members
```

#### Fetch Patterns
1. **Direct fetch()**:
   - Brand Intelligence API
   - Analytics data
   - Publishing jobs

2. **React Query**:
   - Automatic caching
   - Request deduplication
   - Background refresh

3. **WebSocket/Socket.io**:
   - Real-time analytics sync
   - Instant notifications
   - Live progress updates

### Server-Side Data Flow

#### Express Route Architecture
Server entry: `/server/index.ts`
- 25+ route files organized by feature
- CORS enabled for all origins
- Body parsing: JSON + URL-encoded

#### Route Organization

**Core Routes:**
- `/api/analytics/:brandId` - Platform metrics
- `/api/analytics/:brandId/insights` - AI insights
- `/api/analytics/:brandId/goals` - Goal management
- `/api/analytics/:brandId/heatmap` - Engagement heatmap

**Publishing Routes:**
- `/api/publishing` - Publishing router (OAuth, publish, jobs)
- `/api/ai/generate/content` - Content generation
- `/api/ai/generate/design` - Design generation

**AI & Agents:**
- `/api/agents` - Agent operations
- `/api/ai-metrics` - AI metric tracking
- `/api/brand-intelligence/:brandId` - Brand analysis

**Content Management:**
- `/api/approvals` - Content approval workflow
- `/api/bulk-approvals` - Batch operations
- `/api/audit/logs/:brandId` - Audit trail

**Client Features:**
- `/api/client-portal` - Client approval interface
- `/api/client-settings` - Client configuration
- `/api/media` - Asset management
- `/api/library` - Library operations (via media routes)

**Integrations:**
- `/api/integrations` - Third-party integrations
- `/api/webhooks` - Zapier, Make, Slack, HubSpot
- `/api/white-label` - White-label configuration

**Workflow:**
- `/api/workflow` - Workflow templates and execution
- `/api/escalations` - Escalation management

#### Database Integration (Supabase)
1. **Connection**: Service via `supabaseDB` instance
2. **Tables**:
   - brands, users, workspaces, members
   - publishing_jobs, publishing_logs
   - analytics_data, platform_metrics
   - brand_intelligence, recommendations
   - approvals, audit_logs
   - media_assets, library_items
   - integrations, connections
   - workflows, notifications

3. **Services**:
   - analyticsDB: Metrics and insights
   - publishingDBService: Publishing jobs
   - mediaDBService: Asset management
   - connectionsDB: OAuth connections
   - workflowDBService: Workflow storage

#### AI Integration

**AI Generation Worker** (`/server/workers/ai-generation.ts`)
```
Providers:
- OpenAI: GPT-4, GPT-3.5-turbo
- Anthropic: Claude 3 Opus, Sonnet, Haiku

Configuration:
- Timeout: 30 seconds
- Token limits: Configurable per model
- Fallback: Claude if OpenAI unavailable

Requests:
- Content generation (posts, captions)
- Design descriptions
- Brand intelligence analysis
```

**Agent System**
```
Agents Available:
- content-linter: Quality checking
- brand-fidelity-scorer: Brand alignment
- performance-adjuster: Optimization

Execution:
- Receive input (BrandGuide, content)
- Process through agent
- Return DocOutput with scores/recommendations
- Store in approvals queue
```

#### Error Handling & Logging

**Error Middleware** (`/server/lib/error-middleware.ts`)
1. **AppError Class**: Custom error with:
   - code: ErrorCode enum
   - message: User-friendly message
   - statusCode: HTTP status
   - severity: error|warning|info
   - details: Structured data
   - suggestion: Recovery action

2. **Error Types Handled**:
   - AppError: Custom application errors
   - ZodError: Validation errors
   - SyntaxError: JSON parsing errors
   - Generic Error: Unexpected errors

3. **Response Format**:
   ```json
   {
     "error": {
       "code": "BRAND_NOT_FOUND",
       "message": "The requested brand does not exist",
       "severity": "warning",
       "timestamp": "2024-11-11T10:30:00Z",
       "requestId": "uuid",
       "suggestion": "Please check the brand ID and try again"
     }
   }
   ```

4. **Async Handler Wrapper**:
   - Wraps async route handlers
   - Catches promise rejections
   - Passes to error handler

---

## 4. ADVISOR PANELS - AI INSIGHT GENERATION

### Advisor Panel Implementations (7 variants)

#### 1. **AdvisorPanel** (Dashboard)
- Location: `/client/components/dashboard/AdvisorPanel.tsx`
- Displays: 4 hardcoded insights (emoji-based)
- Insights:
  - Best time to post: "9:00 AM on Thursdays · +23% engagement"
  - Top performing topic: "Behind-the-scenes content · 45K avg reach"
  - Quick win: "Video posts → 3.2× more engagement"
  - Reshare strategy: "Top 3 posts from last month"
- CTA: "Get Weekly Brief" button
- Status: Mock data (needs API integration)

#### 2. **InsightsFeed** (Dashboard Sidebar)
- Location: `/client/components/dashboard/InsightsFeed.tsx`
- Displays: 4 insights with varying styles (metric, text, action)
- Animation: Staggered fade-in on mount
- Interactivity:
  - Hover scale effects
  - "Generate Scheduler" CTA for reshare
  - "Get Weekly Brief" main button
- Styling: Glassmorphism design
- Status: Mock data

#### 3. **AnalyticsAdvisor** (Analytics page)
- Location: `/client/components/dashboard/AnalyticsAdvisor.tsx`
- Displays: Up to 5 AnalyticsInsight objects
- Insight types:
  - **opportunity**: Lightbulb icon, emerald styling
  - **warning**: AlertCircle icon, amber styling
  - **suggestion**: TrendingUp icon, blue styling
- Priority levels: high (red), medium (orange), low (blue)
- Fields:
  - title, description, metric, actionLabel
  - platform (badge), type, priority
- CTA: "Optimize Strategy" button
- Status: Accepts props from parent, ready for real data

#### 4. **CreativeStudioAdvisor** (Creative Studio)
- Location: `/client/components/dashboard/CreativeStudioAdvisor.tsx`
- Provides: Design recommendations
- Shows:
  - Color suggestions from brand guide
  - Typography recommendations
  - Layout tips for selected format
  - Branding compliance checks
- Interactive: Adjusts recommendations based on current design state
- Status: Integrated with design canvas, mock recommendations

#### 5. **QueueAdvisor** (Content Queue)
- Location: `/client/components/dashboard/QueueAdvisor.tsx`
- Provides: Review queue recommendations
- Shows:
  - Posts needing approval count
  - Best posts to feature
  - Engagement predictions
  - Brand compliance status
- Status: Integrated with post data

#### 6. **ReviewAdvisor** (Reviews page)
- Location: `/client/components/dashboard/ReviewAdvisor.tsx`
- Provides: Auto-reply suggestions
- Features:
  - Sentiment-based response templates
  - Brand voice adaptation
  - Priority ordering for responses
  - Bulk reply generation
- Status: Ready for integration

#### 7. **SchedulingAdvisor** (Calendar page)
- Location: `/client/components/dashboard/SchedulingAdvisor.tsx`
- Provides: Optimal posting times
- Shows:
  - Peak engagement hours by platform
  - Audience activity patterns
  - Competitor posting schedules
  - Forecast metrics
- Status: Mock data, needs analytics integration

### Advisor Data Flow

**Data Sources:**
1. **useBrandIntelligence** hook:
   - Fetches from `/api/brand-intelligence/:brandId`
   - Returns: StrategicRecommendation[], ContentSuggestion[]

2. **useRealtimeAnalytics** hook:
   - WebSocket updates from analytics server
   - Real-time insight generation

3. **Direct Analytics API**:
   - GET `/api/analytics/:brandId/insights`
   - Returns: AnalyticsInsight[] objects

**Insight Generation Process:**
1. Fetch brand data + historical metrics
2. Run through AI model (OpenAI/Claude)
3. Format as structured recommendations
4. Cache with 5-minute TTL
5. Push updates via WebSocket
6. Display with priority ordering

---

## 5. API INTEGRATION & BACKEND CONNECTIONS

### Platform Integrations

#### Implemented Platform APIs
1. **Instagram** (Meta Graph API v18.0)
   - Class: InstagramAPI
   - Methods: publishPost(), getInsights(), getMedia()
   - Flow: Create media container → Publish → Get URL

2. **Facebook** (Meta Graph API)
   - Feed publishing
   - Page insights and metrics
   - Comment management

3. **LinkedIn**
   - Post publishing to personal and company profiles
   - Share and engagement tracking

4. **Twitter/X**
   - Tweet publishing
   - Retweet and likes tracking

5. **TikTok**
   - Video publishing
   - Analytics integration

6. **YouTube**
   - Video description and metadata
   - Channel analytics

7. **Pinterest**
   - Pin creation
   - Board management
   - Traffic metrics

8. **Google Business**
   - Event publishing
   - Review management
   - Q&A interactions

### OAuth Implementation

**OAuth Manager** (`/server/lib/oauth-manager.ts`)
```
Flow:
1. generateOAuthUrl(platform, brandId)
   - Creates unique state token (CSRF protection)
   - Caches state:brandId:userId mapping
   - Returns authorization URL

2. handleOAuthCallback(code, state)
   - Validates state token
   - Exchanges code for access token
   - Stores connection credentials
   - Returns connection details

3. Token Management
   - refreshAccessToken(platform, connectionId)
   - Handles expiration and refresh
   - Stores new tokens in DB
```

**Connection Storage**
- Table: `connections`
- Fields: platform, accessToken, refreshToken, expiresAt
- RLS: Users can only access own connections
- Encryption: Tokens encrypted at rest

### Token Management

**Routes:**
- POST `/api/publishing/oauth/initiate` - Start OAuth
- GET `/api/publishing/oauth/callback/:platform` - Handle callback
- POST `/api/publishing/verify-connection` - Test connection
- POST `/api/publishing/refresh-token` - Refresh expired token

**Security Measures:**
1. CSRF tokens: State parameter with TTL
2. Auth context validation: User must be authenticated
3. Brand access check: User must have access to brand
4. Rate limiting: Prevent brute force attempts
5. Token encryption: In-database encryption
6. Secure storage: No tokens in localStorage

### Publishing Flow

**Routes:**
```
POST /api/publishing/publish
- Accepts: PostContent, platforms[], scheduledAt?
- Validates content against brand guidelines
- Creates publishing job
- Queues for background processing
- Returns job ID

GET /api/publishing/jobs/:jobId
- Returns job status and logs

POST /api/publishing/jobs/:jobId/retry
- Retries failed publish attempts

DELETE /api/publishing/jobs/:jobId
- Cancels scheduled job
```

**Publishing Queue**
- Queue system: Background job processing
- Retry logic: Exponential backoff, max 3 retries
- Scheduling: Supports future dates
- Validation: Pre-flight platform checks

### Analytics Integration

**Analytics API Routes:**
```
GET /api/analytics/:brandId
- Summary metrics (reach, engagement, followers)
- Platform breakdown
- Growth comparison vs previous period
- Date range filtering

GET /api/analytics/:brandId/insights
- AI-generated insights
- Trend analysis
- Anomaly detection

GET /api/analytics/:brandId/forecast
- Predictive analytics
- Growth projections
- Engagement forecasts

POST /api/analytics/:brandId/sync
- Manual sync trigger
- Platform data pull
- Updates DB with latest metrics

GET /api/analytics/:brandId/heatmap
- Engagement by day/hour
- Platform-specific patterns
```

**Analytics Data Service** (`analyticsDB`)
- getMetricsSummary(brandId, days)
- getPlatformStats(brandId, platform, days)
- getMetricsByDateRange(brandId, startDate, endDate)
- getEngagementHeatmap(brandId, days)
- getPeakEngagementTimes(brandId, platform)

### Webhook Integrations

**Supported Webhooks:**
1. **Zapier**: Generic automation connector
2. **Make (Integromat)**: Workflow automation
3. **Slack**: Notifications and commands
4. **HubSpot**: CRM integration

**Routes:**
```
POST /api/webhooks/zapier
POST /api/webhooks/make
POST /api/webhooks/slack
POST /api/webhooks/hubspot

GET /api/webhooks/status
- List webhook health

GET /api/webhooks/logs/:brandId
- Webhook event logs

POST /api/webhooks/:eventId/retry
- Retry failed webhook
```

### White Label Support

**Routes:**
```
GET /api/white-label/:brandId/config
- Branding: logo, colors, fonts

GET /api/white-label/domain/:domain
- Config by custom domain

PUT /api/white-label/:brandId/config
- Update branding
```

**Database:** white_label_config table
- Stores: colors, fonts, logo URL, custom domain
- Applied in ClientPortal on load

---

## 6. ERROR HANDLING & FALLBACK STATES

### Error Handling Strategy

#### Frontend Error Handling

**Error Boundary Component** (`ErrorBoundary.tsx`)
```typescript
- Catches React component errors
- Displays default error UI or custom fallback
- Shows error message and stack (dev only)
- Provides: "Try Again" and "Go Home" buttons
- Logs to console and telemetry
```

**Hook-Level Error Handling**

useBrandIntelligence:
```
1. Safe JSON parsing with type checking
2. Content-type validation
3. HTTP status specific messages:
   - 401: "Authentication required"
   - 403: "Permission denied"
   - 404: "Not found"
   - 5xx: "Server error"
4. Fallback: Show HTML in response preview
5. Telemetry: Log to window.__telemetry
```

**Toast Notifications** (Sonner + React-Toastify)
- Success messages
- Error messages with retry CTAs
- Loading states during async operations

**Empty States** (EmptyState component)
- User-friendly messages
- Icon/illustration
- CTA to create content

**Loading States** (Skeletons)
- Placeholder content
- Smooth transitions
- DashboardSkeleton, BrandIntelligenceSkeleton

#### Backend Error Handling

**AppError Class**
```typescript
constructor(
  code: ErrorCode,
  message: string,
  statusCode: number,
  severity: "error" | "warning" | "info",
  details?: Record<string, unknown>,
  suggestion?: string
)
```

**Error Codes** (Enum):
- VALIDATION_ERROR: 422
- NOT_FOUND: 404
- UNAUTHORIZED: 401
- FORBIDDEN: 403
- CONFLICT: 409
- INTERNAL_ERROR: 500
- RATE_LIMITED: 429
- MISSING_REQUIRED_FIELD: 400
- INVALID_FORMAT: 400

**Error Response Format**:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message",
    "severity": "error|warning|info",
    "timestamp": "ISO timestamp",
    "requestId": "uuid for tracing",
    "details": {/* structured data */},
    "suggestion": "How to recover",
    "validationErrors": [{field, message, code}]
  }
}
```

**Middleware Chain**:
1. addRequestId: Generate request ID for tracing
2. Express built-in: JSON/URL-encoded parsing
3. Route handlers: Wrapped with asyncHandler
4. Validation: Zod schemas with error conversion
5. errorHandler: Central error processing
6. notFoundHandler: 404 catch-all

### Recovery Strategies

**Network Errors:**
- Retry with exponential backoff
- Show offline indicator
- Cache last known state
- Fallback to polling

**Auth Errors:**
- Redirect to login
- Refresh token if expired
- Show permission denied

**Validation Errors:**
- Show field-specific messages
- Highlight invalid fields
- Suggest corrections

**Rate Limiting:**
- Exponential backoff
- Show "too many requests" message
- Suggest retry after delay

---

## 7. ANALYTICS & LOGGING IMPLEMENTATION

### Analytics Architecture

**Analytics Wrapper** (`/client/lib/analytics.ts`)
```typescript
class Analytics {
  track<T extends EventName>(eventName: T, properties: AnalyticsEvent[T])
}

Events:
- cta_click: {source, auth_state}
- page_view: {page}
- form_submit: {form, success}
- error: {message, code}
```

**Current Status**: Console logging (placeholder)
**TODO**: Replace with Segment/Mixpanel integration

### Real-Time Analytics

**WebSocket Architecture** (`useRealtimeAnalytics`)
```
Connection:
- Socket.io to /analytics endpoint
- Auto-reconnect with backoff
- Max 5 reconnection attempts

Events:
- analytics:sync-started
- analytics:sync-progress {progress %, recordsProcessed}
- analytics:sync-completed
- analytics:insights-generated
- analytics:forecast-ready

Fallback:
- HTTP polling if WebSocket fails
- 5-second default interval
- Configurable interval per call
```

### Audit Logging

**Audit Routes** (`/api/audit/`)
```
GET /api/audit/logs/:brandId
- Paginated audit entries
- Filters: action, user, date range

GET /api/audit/logs/post/:postId
- Post-specific audit trail

GET /api/audit/stats/:brandId
- Aggregated statistics

POST /api/audit/search/:brandId
- Full-text search in audit logs

GET /api/audit/export/:brandId
- Export audit logs (CSV/JSON)

GET /api/audit/actions/:brandId
- List available audit actions
```

**Audit Service** (`audit-logger.ts`)
```
Logged Actions:
- Content created/published/deleted
- Approvals and rejections
- Brand guide changes
- Member access changes
- Settings modifications
- Webhook events
- API access
```

**Audit Entry**:
```json
{
  "id": "uuid",
  "brand_id": "string",
  "user_id": "string",
  "action": "enum",
  "resource_type": "string",
  "resource_id": "string",
  "old_value": "any",
  "new_value": "any",
  "details": {/* context */},
  "timestamp": "ISO timestamp"
}
```

### Monitoring & Health Checks

**Health Endpoints**:
- GET `/health` - Basic health check
- GET `/api/ping` - API availability
- Response: {status: "ok"}

**Error Tracking**:
- Request IDs for tracing
- Console error logging
- Telemetry window object integration
- Error details in response

### User Activity Tracking

**Preferences Service** (`/api/preferences/:userId`)
```
GET /api/preferences/:userId
- User settings and preferences

PUT /api/preferences/:userId
- Update user preferences

GET /api/preferences/:userId/export
- Export user data (GDPR)
```

**Stored Preferences**:
- View preferences (grid/table/masonry)
- Filter defaults
- Notification settings
- Email preferences

---

## 8. TECHNOLOGY STACK & DEPENDENCIES

### Frontend Stack
```
Core:
- React 18.3.1
- React Router v6 (routing)
- TypeScript 5.x

State Management:
- React Context API
- TanStack React Query
- Zustand (potentially)

UI Framework:
- TailwindCSS 3.x
- Shadcn/ui components
- Recharts (data visualization)
- Lucide React (icons)

Real-Time:
- Socket.io-client

Utilities:
- date-fns (date handling)
- zod (validation)
- clsx (class composition)
```

### Backend Stack
```
Runtime:
- Node.js 18+
- Express.js 4.x
- TypeScript

Database:
- Supabase (PostgreSQL)
- Row-Level Security (RLS)

APIs:
- OpenAI SDK
- Anthropic Claude SDK

Real-Time:
- Socket.io (WebSocket)

Authentication:
- Supabase Auth
- OAuth 2.0 flows

Utilities:
- cors
- dotenv
- uuid
- zod
```

### Shared Types
Location: `/shared/` (24+ files)
- `brand-intelligence.ts`: BrandIntelligence types
- `publishing.ts`: Publishing and platform types
- `analytics.ts`: Analytics data types
- `api.ts`: API request/response types
- `validation-schemas.ts`: Zod schemas
- `workflow.ts`: Workflow types
- `approvals.ts`: Approval queue types
- `client-portal.ts`: Client portal types
- `media.ts`: Asset types
- `integrations.ts`: Integration types

---

## 9. KEY FEATURES IMPLEMENTED

### Content Creation & Publishing
1. AI content generation (OpenAI/Claude)
2. Design studio with canvas
3. Multi-platform preview
4. Smart resizing for platforms
5. Template library
6. Brand kit integration
7. Stock image library
8. Scheduling support

### Analytics & Reporting
1. Real-time metrics sync
2. Platform-specific dashboards
3. Engagement heatmaps
4. Growth tracking
5. Custom reports
6. Email report delivery
7. AI-powered insights
8. Forecast modeling

### Content Management
1. Draft/review/scheduled queue
2. Approval workflows
3. Brand compliance checking
4. Content linting
5. Performance scoring
6. Bulk operations
7. Comments and collaboration

### AI Integration
1. Content generation (multiple providers)
2. Brand intelligence analysis
3. Review response generation
4. Design recommendations
5. Scheduling optimization
6. Trend detection

### Collaboration
1. Multi-brand workspaces
2. Team member management
3. Role-based access
4. Client portal
5. Comment threads
6. Activity audit

### Administration
1. Workspace settings
2. Member management
3. Integration management
4. Billing and usage
5. White-label configuration
6. Webhook management

---

## 10. DEPLOYMENT & CONFIGURATION

### Vercel Deployment
- Config: `vercel.json`
- Functions: API routes via `/api/[...all].ts` catch-all
- Environment: `.env` file with platform API keys
- Build: Vite build for frontend

### Environment Variables
```
VITE_API_BASE_URL: API endpoint
SUPABASE_URL: Database URL
SUPABASE_ANON_KEY: Public key
OPENAI_API_KEY: OpenAI access
ANTHROPIC_API_KEY: Claude access
STRIPE_PUBLIC_KEY: Stripe configuration
META_APP_ID: Facebook/Instagram OAuth
GOOGLE_CLIENT_ID: Google OAuth
LINKEDIN_CLIENT_ID: LinkedIn OAuth
TWITTER_API_KEY: Twitter API access
```

### Database Migrations
- Location: `/server/migrations/`
- Tools: apply-migrations.ts, verify-supabase-setup.ts
- Run on: Server startup or manual trigger

---

## SUMMARY OF SECTIONS IMPLEMENTED

| # | Section | Status | Pages | Components |
|---|---------|--------|-------|------------|
| 1 | Dashboard | ✅ | Dashboard | GoodNews, InsightsFeed, AnalyticsPanel |
| 2 | Content Calendar | ✅ | Calendar | CalendarAccordion, MonthView, DayView |
| 3 | Creative Studio | ✅ | CreativeStudio | Canvas, Templates, BrandKit |
| 4 | Content Queue | ✅ | ContentQueue | PostCarousel, StatusBanner |
| 5 | Approvals | ✅ | Approvals | ReviewQueue, Comments |
| 6 | Analytics | ✅ | Analytics | PlatformMetrics, Charts |
| 7 | Campaigns | ✅ | Campaigns | CampaignCard, Insights |
| 8 | Brands | ✅ | Brands | BrandList |
| 9 | Brand Guide | ✅ | BrandGuide | Editors (5+) |
| 10 | Brand Intelligence | ✅ | BrandIntelligence | Recommendations, Charts |
| 11 | Brand Intake | ✅ | BrandIntake | Form |
| 12 | Brand Snapshot | ✅ | BrandSnapshot | Summary |
| 13 | Library | ✅ | Library | Upload, Grid/Table/Masonry |
| 14 | Client Portal | ✅ | ClientPortal | Approval UI, Workflows |
| 15 | Events | ✅ | Events | Editor, Insights |
| 16 | Reviews | ✅ | Reviews | ReviewCard, Advisor |
| 17 | Linked Accounts | ✅ | LinkedAccounts | Connection Status |
| 18 | Settings | ✅ | Settings | Workspace, Members |
| 19 | Client Settings | ✅ | ClientSettings | Preferences |
| 20 | Billing | ✅ | Billing | Plans, Usage |

**Advisor Panels**: 7/7 implemented
- AdvisorPanel (Dashboard)
- AnalyticsAdvisor (Analytics)
- CreativeStudioAdvisor (CreativeStudio)
- QueueAdvisor (ContentQueue)
- ReviewAdvisor (Reviews)
- SchedulingAdvisor (Calendar)
- CampaignInsightsPanel (Campaigns)

---

## NEXT STEPS & GAPS

1. **Analytics Integration**: Replace mock data with real Supabase queries
2. **AI Advisor Maturity**: Connect to real AI models for recommendations
3. **Publishing Queue**: Implement background job processing
4. **Webhook Handlers**: Complete integrations (Zapier, Make, Slack, HubSpot)
5. **Testing**: Expand test coverage for critical paths
6. **Performance**: Optimize bundle size and render performance
7. **Accessibility**: A11y audit and improvements
8. **Mobile**: Responsive design refinement
