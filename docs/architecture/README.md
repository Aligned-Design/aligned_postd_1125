# Architecture Documentation

This directory contains comprehensive documentation about the system architecture, design patterns, and technical decisions.

## Contents

- **ALIGNED_20AI_ROADMAP.md** - Full product roadmap, workflows, and development phases

- **AI_DESIGN_SYSTEM.md** - AI-powered design system and component guidelines
- **DESIGN_SYSTEM.md** - Visual design system, colors, typography, and components
- **AGENTS.md** - AI agents architecture and agent configuration
- **ALIGNED_AI_SITEMAP.md** - Visual sitemap and page hierarchy

## Tech Stack

### Frontend
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** React Context, custom hooks
- **Component Library:** Shadcn/ui components

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth with JWT
- **ORM:** Supabase PostgREST

### AI & Integration
- **AI Models:** Claude API (Anthropic), OpenAI API
- **Email Service:** SendGrid (Phase 9)
- **Monitoring:** Sentry (optional)

## Key Architectural Concepts

### Row-Level Security (RLS)
All data access is controlled via Supabase RLS policies, ensuring multi-tenant isolation and brand-specific access control.

### Lazy Loading & Code Splitting
Routes use React lazy loading with Suspense boundaries for optimal performance.

### Defensive API Response Handling
Frontend implements safe JSON parsing that validates Content-Type headers before JSON.parse() to prevent crashes on unexpected responses.

### Structured Error Handling
Consistent error response format across all API endpoints: `{error, code, timestamp}`.

## Database Schema

The database is organized around several key entity groups:
- **Authentication:** Users and roles
- **Brand Management:** Brands and brand kits
- **Content:** Posts, comments, approvals
- **Assets:** Media files, uploads, variants
- **Analytics:** Metrics and engagement data
- **Webhooks:** Event tracking and retry scheduling
- **Escalations:** Priority queues and rules

## Architecture Index
- [Aligned 20AI Roadmap](./ALIGNED_20AI_ROADMAP.md)
- [Agents Overview](./AGENTS.md)
- [AI Design System](./AI_DESIGN_SYSTEM.md)
- [POSTD Sitemap](./ALIGNED_AI_SITEMAP.md)
- [Design System](./DESIGN_SYSTEM.md)

## Verification & Alignment

- **[Final Lock-In Verification Report](../audit/FINAL_LOCK_IN_VERIFICATION_REPORT.md)** - Repository alignment verification (2025-01-20) - **Baseline alignment complete**

All tables include proper indexing and RLS policies for security.

---

For deployment considerations, see [Deployment Documentation](../deployment/).
For API specifications, see [API Documentation](../api/).
