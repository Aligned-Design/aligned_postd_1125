# POSTD Dashboard - Quick Reference Guide

## Dashboard Sections (20 Implemented)

```
CORE NAVIGATION (7)
├─ Dashboard (/dashboard)                → GoodNews, InsightsFeed, AnalyticsPanel
├─ Content Calendar (/calendar)          → MonthCalendarView, DayViewHourly, SchedulingAdvisor
├─ Creative Studio (/creative-studio)    → Canvas, Templates, BrandKit
├─ Content Queue (/content-queue)        → PostCarousel, StatusBanner, QueueAdvisor
├─ Approvals (/approvals)                → ReviewQueue, Comments, Agent Output
├─ Analytics (/analytics)                → PlatformMetrics, Charts, AnalyticsAdvisor
└─ Campaigns (/campaigns)                → CampaignCard, Insights, Performance

STRATEGY (5)
├─ Brands (/brands)                      → Brand list, Multi-brand management
├─ Brand Guide (/brand-guide)            → 5 Editors (Summary, Voice, Visual, Personas, Goals)
├─ Brand Intelligence (/brand-intelligence) → AI Analysis, Recommendations, Suggestions
├─ Brand Intake (/brand-intake)          → Initial setup form
└─ Brand Snapshot (/brand-snapshot)      → Quick overview

ASSETS (4)
├─ Library (/library)                    → Upload, Grid/Table/Masonry views, Stock images
├─ Client Portal (/client-portal)        → Approval interface, Comments, Workflows
├─ Events (/events)                      → Create, Edit, AI-assisted, Promotion
└─ Reviews (/reviews)                    → Google/Facebook, Auto-reply, Sentiment

SETTINGS (4)
├─ Linked Accounts (/linked-accounts)    → OAuth connections
├─ Settings (/settings)                  → Workspace, Members, Integrations
├─ Client Settings (/client-settings)    → Preferences, Email management
└─ Billing (/billing)                    → Plans, Usage, Invoices
```

## Architecture Diagram

```
FRONTEND (React/Vite)
┌────────────────────────────────────────────────────────────┐
│ React Router                                              │
│ ├─ Pages (23 files)                                       │
│ │  └─ Dashboard, Calendar, CreativeStudio, ContentQueue... │
│ ├─ Components (90+ files)                                 │
│ │  ├─ Dashboard Components                                │
│ │  │  ├─ Advisor Panels (7)                               │
│ │  │  ├─ Calendar/Schedule                                │
│ │  │  ├─ Analytics/Reporting                              │
│ │  │  ├─ Library/Assets                                   │
│ │  │  └─ Brand Management                                 │
│ │  └─ UI Library (40+ base components)                    │
│ ├─ Contexts (4)                                           │
│ │  ├─ AuthContext (user auth, onboarding)                │
│ │  ├─ UserContext (profile)                              │
│ │  ├─ WorkspaceContext (workspaces, members)             │
│ │  └─ BrandContext (selected brand)                      │
│ ├─ Hooks (14)                                             │
│ │  ├─ useBrandIntelligence (API fetch + feedback)        │
│ │  ├─ useRealtimeAnalytics (WebSocket + polling)         │
│ │  ├─ useAuth, useWorkspace, etc.                        │
│ │  └─ Custom hooks for state management                  │
│ └─ State Management                                       │
│    ├─ React Query (server state)                         │
│    ├─ Context API (global state)                         │
│    └─ useState (component state)                         │
└────────────────────────────────────────────────────────────┘
                              ↓
                     HTTP + WebSocket
                              ↓
BACKEND (Node.js/Express)
┌────────────────────────────────────────────────────────────┐
│ Express.js Routes (25+ files)                             │
│ ├─ Analytics (/api/analytics/*)                          │
│ ├─ Publishing (/api/publishing/*)                        │
│ ├─ Brand Intelligence (/api/brand-intelligence/*)        │
│ ├─ Agents (/api/agents/*)                                │
│ ├─ Approvals (/api/approvals/*)                          │
│ ├─ Audit (/api/audit/*)                                  │
│ ├─ Client Portal (/api/client-portal/*)                  │
│ ├─ Media (/api/media/*)                                  │
│ ├─ Webhooks (/api/webhooks/*)                            │
│ ├─ Integrations (/api/integrations/*)                    │
│ ├─ Workflow (/api/workflow/*)                            │
│ └─ White Label (/api/white-label/*)                      │
│                                                          │
│ Middleware                                               │
│ ├─ CORS (all origins)                                    │
│ ├─ Auth validation                                       │
│ ├─ Request ID tracking                                   │
│ ├─ Zod validation                                        │
│ └─ Error handling (centralized)                          │
│                                                          │
│ Services (Database + AI)                                 │
│ ├─ analyticsDB (metrics, insights)                       │
│ ├─ publishingDBService (jobs, logs)                      │
│ ├─ mediaDBService (assets)                               │
│ ├─ connectionsDB (OAuth tokens)                          │
│ ├─ AI Workers (OpenAI, Claude)                           │
│ ├─ Agents (linter, fidelity scorer)                      │
│ └─ OAuth Manager (token exchange, refresh)               │
└────────────────────────────────────────────────────────────┘
                              ↓
DATABASE (Supabase/PostgreSQL)
┌────────────────────────────────────────────────────────────┐
│ Tables:                                                   │
│ ├─ brands, users, workspaces, members                    │
│ ├─ publishing_jobs, publishing_logs                      │
│ ├─ analytics_data, platform_metrics                      │
│ ├─ brand_intelligence, recommendations                   │
│ ├─ approvals, audit_logs                                 │
│ ├─ media_assets, library_items                           │
│ ├─ connections (OAuth), workflows                        │
│ ├─ white_label_config                                    │
│ └─ notifications                                         │
└────────────────────────────────────────────────────────────┘
                              ↓
EXTERNAL INTEGRATIONS
┌────────────────────────────────────────────────────────────┐
│ Platform APIs                                             │
│ ├─ Meta (Instagram, Facebook)                            │
│ ├─ LinkedIn                                              │
│ ├─ Twitter/X                                             │
│ ├─ TikTok, YouTube, Pinterest                            │
│ ├─ Google Business                                       │
│ └─ Stripe (billing)                                      │
│                                                          │
│ AI Services                                              │
│ ├─ OpenAI (GPT-4, GPT-3.5)                              │
│ └─ Anthropic (Claude 3)                                  │
│                                                          │
│ Third-Party Integrations                                 │
│ ├─ Zapier                                                │
│ ├─ Make (Integromat)                                     │
│ ├─ Slack                                                 │
│ └─ HubSpot                                               │
└────────────────────────────────────────────────────────────┘
```

## Advisor Panels (7 variants)

| Panel | Location | Purpose | Data Source |
|-------|----------|---------|------------|
| **AdvisorPanel** | Dashboard | General insights | Mock data |
| **InsightsFeed** | Dashboard sidebar | Quick tips | Mock data |
| **AnalyticsAdvisor** | Analytics page | Performance analysis | `/api/analytics/:id/insights` |
| **CreativeStudioAdvisor** | Creative Studio | Design recommendations | Brand guide + canvas state |
| **QueueAdvisor** | Content Queue | Review tips | Post data + brand data |
| **ReviewAdvisor** | Reviews page | Auto-reply suggestions | Review data + brand voice |
| **SchedulingAdvisor** | Calendar page | Optimal posting times | Analytics + platform data |

## Data Flow Patterns

### Brand Intelligence
```
BrandIntelligence Page
    ↓
useBrandIntelligence hook
    ↓
fetch /api/brand-intelligence/:brandId
    ↓
Backend: getBrandIntelligence route
    ↓
Returns: BrandIntelligence object
    {
      id, brandId,
      brandProfile: { USP, differentiators, values, audience },
      recommendations: StrategicRecommendation[],
      contentSuggestions: ContentSuggestion[]
    }
    ↓
Display with error handling + refresh + feedback
```

### Real-Time Analytics
```
useRealtimeAnalytics hook
    ↓
Socket.io connection to /analytics
    ↓
Subscribe: analytics:brand_:id
    ↓
Listen for events:
- analytics:sync-started
- analytics:sync-progress { progress, recordsProcessed }
- analytics:sync-completed
- analytics:insights-generated
- analytics:forecast-ready
    ↓
Fallback: HTTP polling if WebSocket unavailable
```

### Publishing Flow
```
Content Queue / Creative Studio
    ↓
POST /api/publishing/publish
    {
      content: PostContent,
      platforms: string[],
      scheduledAt?: Date
    }
    ↓
Backend:
1. Validate against brand guidelines
2. Create publishing job
3. Queue for processing
4. Return job ID
    ↓
Monitor: GET /api/publishing/jobs/:jobId
    ↓
Publish to platforms via platform APIs
    ↓
Log results in publishing_logs table
```

## Error Handling Strategy

### Frontend
```
React Component
    ↓
Error Boundary (catches component errors)
    ↓
Hook error handling (try/catch + setError)
    ↓
HTTP error handling (status checks, safe JSON parse)
    ↓
User feedback:
- Toast notifications (Sonner)
- Error state components
- Loading states (skeletons)
- Empty states
```

### Backend
```
Express Route Handler
    ↓
Zod validation (throws ZodError)
    ↓
AppError class (custom errors)
    ↓
asyncHandler wrapper (catches promise rejections)
    ↓
Error handler middleware:
- Converts to standardized ErrorResponse
- Adds request ID, severity, suggestion
- Returns JSON with code + message
    ↓
Response: 200/4xx/5xx with error details
```

## Component Hierarchy (Example: Dashboard)

```
Dashboard Page
├─ FirstVisitTooltip
│  └─ div.gradient-background
│     ├─ Page Header
│     │  └─ H1 + "New Content" CTA
│     │
│     ├─ ZONE 1: GoodNews (Strategic Overview)
│     │  └─ Multiple metric cards
│     │
│     ├─ ZONE 2: Two Column Layout
│     │  ├─ Left (2/3): CalendarAccordion
│     │  │  └─ Expandable days with posts
│     │  └─ Right (1/3, sticky): InsightsFeed
│     │     └─ AI insights + CTA buttons
│     │
│     └─ ZONE 3: AnalyticsPanel
│        └─ Platform metrics + insights
│
└─ MainLayout (wraps navigation)
   └─ Top navigation bar
```

## API Routes Summary

| Category | Endpoints |
|----------|-----------|
| **Analytics** | GET /api/analytics/:brandId, /insights, /goals, /heatmap, /alerts |
| **Publishing** | POST /api/publishing/publish, GET /jobs/:id, PUT /jobs/:id/cancel |
| **Brand Intelligence** | GET /api/brand-intelligence/:brandId, POST /feedback |
| **Approvals** | POST /api/approvals/bulk, /single, GET /pending/:brandId |
| **Audit** | GET /api/audit/logs/:brandId, /stats/:brandId, POST /search/:brandId |
| **Media** | POST /api/media/upload, GET /list, DELETE /:id |
| **Client Portal** | GET /api/client-portal/:clientId/dashboard, POST /approve/:contentId |
| **Webhooks** | POST /api/webhooks/zapier, /make, /slack, /hubspot |
| **Workflow** | GET /api/workflow/templates/:brandId, POST /start/:brandId |

## Key Files Reference

### Critical Frontend Files
- `/client/App.tsx` - Route configuration
- `/client/pages/Dashboard.tsx` - Entry point
- `/client/hooks/useBrandIntelligence.ts` - Brand analysis data
- `/client/hooks/useRealtimeAnalytics.ts` - WebSocket analytics
- `/client/contexts/AuthContext.tsx` - Auth state
- `/client/contexts/WorkspaceContext.tsx` - Workspace state
- `/client/lib/analytics.ts` - Analytics tracking

### Critical Backend Files
- `/server/index.ts` - Express server setup
- `/server/routes/analytics.ts` - Analytics endpoints
- `/server/routes/brand-intelligence.ts` - AI analysis
- `/server/routes/publishing.ts` - Publishing + OAuth
- `/server/lib/error-middleware.ts` - Error handling
- `/server/lib/platform-apis.ts` - Platform integrations
- `/server/workers/ai-generation.ts` - AI provider integration

### Shared Types
- `/shared/brand-intelligence.ts`
- `/shared/publishing.ts`
- `/shared/analytics.ts`
- `/shared/validation-schemas.ts`

## Environment Setup

```bash
# Required env variables
VITE_API_BASE_URL=http://localhost:3000/api
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[key]
OPENAI_API_KEY=[key]
ANTHROPIC_API_KEY=[key]
STRIPE_PUBLIC_KEY=[key]
META_APP_ID=[id]
GOOGLE_CLIENT_ID=[id]
LINKEDIN_CLIENT_ID=[id]
TWITTER_API_KEY=[key]
```

## Development Workflow

```
1. Start Backend
   npm run server

2. Start Frontend
   npm run dev

3. Access Dashboard
   http://localhost:5173/dashboard

4. Test Publishing
   - Create content in CreativeStudio
   - Send to ContentQueue
   - Review in Approvals
   - Publish via Publishing route

5. Monitor Analytics
   - View real-time metrics in Analytics page
   - Check WebSocket connection in DevTools
```

## Performance Optimizations

- **Code Splitting**: React Router lazy loading
- **Caching**: React Query with 5-minute TTL
- **WebSocket**: Real-time updates via Socket.io
- **LocalStorage**: Brand guide autosave
- **Compression**: Zod validation on client
- **Memoization**: useCallback for event handlers
- **Virtualization**: Library grid/masonry views

## Security Measures

- **OAuth CSRF**: State parameter with server-side validation
- **Token Storage**: Supabase Auth handles session
- **RLS Policies**: Database row-level security
- **Validation**: Zod on client and server
- **Error Sanitization**: No sensitive data in error messages
- **Request IDs**: Audit trail for debugging
- **CORS**: Configured for Vercel domains

## Next Steps for Development

1. Replace mock data with real Supabase queries
2. Implement real AI advisor data generation
3. Complete webhook handlers
4. Add comprehensive test coverage
5. Performance optimization (bundle analysis)
6. Mobile responsiveness refinement
7. Accessibility improvements (WCAG AA)
8. Multi-language support
