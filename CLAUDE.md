# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Essential Commands
```bash
# Development
pnpm dev                    # Start dev server (client + server on port 8080)

# Build & Production
pnpm build                  # Build for production
pnpm start                  # Start production server

# Code Quality
pnpm typecheck             # TypeScript type checking
pnpm lint                  # Lint code (max 250 warnings allowed)
pnpm lint:fix              # Auto-fix linting issues
pnpm format.fix            # Auto-fix code formatting

# Testing
pnpm test                  # Run unit tests (Vitest)
pnpm test --watch         # Run tests in watch mode
pnpm e2e                   # Run Playwright end-to-end tests (requires setup)

# Environment & Setup
pnpm validate:env          # Validate environment variables
pnpm verify:supabase      # Test Supabase connection
pnpm check:env            # Check environment configuration

# Database & Data Management
pnpm brands:list          # List all brands in database
pnpm backfill:brand-kit   # Backfill missing brand_kit/colors
pnpm lint:supabase        # Check Supabase query patterns
pnpm test:schema-align    # Verify schema alignment

# Testing Specific Features
pnpm scraper:smoke        # Test scraper with brand (requires SCRAPER_TEST_BRAND_ID_1)
pnpm brand-experience:smoke # Test content pipeline (requires BRAND_EXPERIENCE_TEST_BRAND_ID)
pnpm test:agents:latency  # Test agent response times
```

## High-Level Architecture

### Project Structure
- **POSTD** is a brand-driven AI content platform for social media management
- Monorepo structure with React frontend (Vite) and Node.js/Express backend
- TypeScript throughout (though strict mode is currently disabled - see tsconfig.json)
- Multi-tenant SaaS architecture with tenant_id isolation

### Core Technologies
- **Frontend**: React 18, Vite, TailwindCSS, Radix UI, React Router 6
- **Backend**: Node.js/Express, Supabase (PostgreSQL), Socket.io
- **AI**: Anthropic Claude SDK, OpenAI SDK
- **Queue System**: Bull Queue with Redis
- **Authentication**: Supabase Auth with OAuth 2.0
- **Deployment**: Vercel (primary), supports Netlify

### Key Directories
```
client/              # React frontend
  pages/            # Route components (Dashboard, Creative Studio, etc.)
  components/       # Reusable UI components
    ui/            # Radix-based component library
    postd/         # POSTD-specific components
  hooks/           # Custom React hooks
  contexts/        # Global state management
  lib/             # Utilities and helpers

server/              # Express backend
  routes/           # API endpoints
  lib/              # Core services
    supabase/      # Database interactions
    agents/        # AI agent orchestration
    token-vault/   # Secure token storage
  connectors/      # Platform integrations (Meta, LinkedIn, etc.)
  queue/           # Job processing with Bull
  middleware/      # Express middleware

shared/             # Shared types between client and server
supabase/          # Database migrations and configuration
docs/              # Documentation
```

### Database Architecture
- **Supabase/PostgreSQL** with Row-Level Security (RLS)
- Key tables: `brands`, `users`, `content_queue`, `generation_logs`, `brand_kit`
- Multi-tenant isolation via `tenant_id`
- Comprehensive audit logging

### API Structure
- RESTful API under `/api/v2/*`
- Key endpoints:
  - `/api/v2/brands` - Brand management
  - `/api/v2/content` - Content operations
  - `/api/v2/agents` - AI agent interactions
  - `/api/v2/analytics` - Platform metrics
  - `/api/v2/auth` - Authentication flows

### AI Agent System
- Multiple specialized agents (Creative, Design, Doc, Brand Intelligence)
- Agent orchestration through `/server/lib/agents/`
- Brand Fidelity Score (BFS) for content validation
- Human-in-the-loop (HITL) approval workflows

### Security Features
- AES-256-GCM encryption for platform tokens
- Zod schema validation on all inputs
- Environment variable validation (`pnpm validate:env`)
- Security audit tools (`pnpm security:check`)

### Creative Studio
- Canvas-based design editor at `/creative-studio`
- Entry paths: Blank canvas, Templates, AI-generated
- Brand Kit integration for consistent design
- Real-time save with autosave functionality
- Multi-platform preview and smart resize

### Content Pipeline
1. Brand intake via website crawler
2. AI-powered brand guide generation
3. Content creation in Creative Studio
4. Brand Fidelity Score calculation
5. Approval workflow
6. Multi-platform publishing

## Important Considerations

### TypeScript Configuration
- Strict mode is intentionally disabled for v1 launch (see tsconfig.json line 24)
- Path aliases configured:
  - `@/*` -> `./client/*`
  - `@shared/*` -> `./shared/*`
  - `@postd/*` -> `./client/components/postd/*`

### Environment Variables
Critical environment variables (see docs/ENVIRONMENT_VARIABLES.md for template):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase public key
- `SUPABASE_SERVICE_KEY` - Server-side service key
- `ANTHROPIC_API_KEY` - Claude API
- `OPENAI_API_KEY` - OpenAI API
- `REDIS_HOST`, `REDIS_PORT` - Queue system
- `TOKEN_VAULT_MASTER_SECRET` - Token encryption

### Testing Requirements
- Unit tests run without external dependencies
- E2E tests require Supabase credentials
- Use brand IDs from `pnpm brands:list` for feature testing
- Smoke tests available for critical paths

### Development Workflow
1. Create feature branch from `main`
2. Run `pnpm dev` for local development
3. Test with `pnpm test`, `pnpm typecheck`, `pnpm lint`
4. Run smoke tests before PR submission
5. Ensure all checks pass before merge

### Known Issues & Limitations
- ESLint allows up to 250 warnings (being reduced incrementally)
- Some legacy endpoints exist (marked for removal)
- TypeScript strict mode disabled (post-launch enablement planned)

## Key Documentation References
- Product Definition: `docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md`
- Architecture Overview: `CODEBASE_ARCHITECTURE_OVERVIEW.md`
- API Contract: `POSTD_API_CONTRACT.md`
- Tech Stack: `TECH_STACK_GUIDE.md`
- Security: `SECURITY.md`
- Contributing: `CONTRIBUTING.md`