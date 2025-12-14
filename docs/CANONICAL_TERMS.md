# Canonical Terms - POSTD

**Last Updated:** 2025-12-13  
**Purpose:** Define authoritative naming conventions and prevent deprecated terminology

---

## Product Branding

### ✅ Current (Use These)
- **POSTD** - Primary product name
- **POSTD Platform** - Full platform reference
- **POSTDBot** - Crawler user agent

### ❌ Deprecated (Do Not Use)
- ~~Aligned-20AI~~ - Old product name
- ~~aligned20~~ - Abbreviated old name
- ~~Aligned Design~~ - Legacy company reference

---

## Core Entities

### Primary Domain Objects

**Brand/BrandKit**
- Database table: `brands` (core brand record)
- Related table: `brand_guide` (AI-extracted brand guidelines)
- Type: `Brand`, `BrandKit`, `BrandGuideData`
- Route prefix: `/api/brands`
- **Note:** `BrandKit` and `Brand` are used interchangeably in code - both refer to the same entity

**ContentItem**
- Database table: `content_items` (canonical content storage)
- Type: `ContentItem`, `ContentItemContent`
- Route prefix: `/api/content-items`
- **Note:** Replaces legacy `content` table usage

**ConnectedAccount / PlatformConnection**
- Database table: `platform_connections`
- Type: `PlatformConnectionRecord`, `ConnectedAccount`
- Route prefix: `/api/platform-connections` or `/api/connections`
- **Note:** OAuth tokens and platform integrations

**PublishJob / ScheduledContent**
- Database tables: `publishing_jobs`, `scheduled_content`
- Type: `PublishingJob`, `ScheduledContentRow`
- Route prefix: `/api/publish` or `/api/schedule`
- **Note:** Handles content publishing and scheduling

**User / UserProfile**
- Database tables: `user_profiles`, `brand_members`
- Type: `UserProfile`, `BrandMemberRecord`
- Route prefix: `/api/users` or `/api/auth`

### Banned Synonyms

❌ **Do not use these terms in code:**
- `aligned-20`, `aligned20`, `Aligned-20AI` (old product name)
- `builder.io`, `@builder.io/*` (removed dependency)
- `content` table alone (ambiguous - use `content_items`)
- `brand_profile` (non-existent - use `brands` or `brand_guide`)

---

## Database Conventions

### Table Names
- ✅ **snake_case** - All table names
- ✅ Plural for collections: `brands`, `content_items`, `posts`
- ✅ Singular for config/metadata: `brand_guide`, `user_preferences`

### Column Names
- ✅ **snake_case** - All column names
- ✅ `_id` suffix for foreign keys: `brand_id`, `user_id`
- ✅ `_at` suffix for timestamps: `created_at`, `updated_at`, `published_at`
- ✅ **UUID type** for all IDs (never text)

### Critical Rules
- ❌ **NEVER use text type for `brand_id`** - Always UUID
- ✅ All `brand_id` columns must have RLS policies
- ✅ Use `auth.uid()` for user identification in RLS

---

## Code Conventions

### TypeScript/JavaScript
```typescript
// ✅ Variables & Functions: camelCase
const brandId = "...";
function generateContent() {}

// ✅ Components & Classes: PascalCase
export const BrandGuide = () => {};
class ContentGenerator {}

// ✅ Constants: SCREAMING_SNAKE_CASE
const MAX_RETRIES = 3;
const DEFAULT_AI_PROVIDER = "openai";

// ✅ Types & Interfaces: PascalCase
interface BrandGuideData {}
type ContentStatus = "draft" | "published";

// ❌ Avoid: Hungarian notation, prefixes
// Bad: strBrandName, arrItems, objConfig
// Good: brandName, items, config
```

### File Names
```bash
# ✅ React Components: PascalCase.tsx
BrandGuide.tsx
ContentCalendar.tsx

# ✅ Utilities/Services: camelCase.ts
brandContext.ts
apiClient.ts

# ✅ Tests: *.test.ts or *.spec.ts
brandGuide.test.ts
api.spec.ts

# ✅ Config files: kebab-case or dot notation
vite.config.ts
.eslintrc.js
tailwind.config.ts
```

---

## API Conventions

### Routes
```
# ✅ RESTful, plural resources
GET    /api/brands
POST   /api/brands
GET    /api/brands/:id
PUT    /api/brands/:id
DELETE /api/brands/:id

GET    /api/content-items  (kebab-case for multi-word)
POST   /api/ai/generate   (nested for logical grouping)

# ❌ Avoid:
/api/getBrand             (RPC style)
/api/brand/get/:id        (redundant verbs)
/api/content_items        (snake_case in URLs)
```

### Response Format
```typescript
// ✅ Success Response
{
  "success": true,
  "data": { ... },
  "meta": { ... }  // optional pagination, etc.
}

// ✅ Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": { ... }  // optional field-specific errors
  }
}
```

---

## Environment Variables

### Naming Convention
```bash
# ✅ Client-side (exposed to browser)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_URL=

# ✅ Server-side only (never exposed)
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# ✅ Provider-specific prefixes
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
SENDGRID_API_KEY=

# ❌ Never use (deprecated)
BUILDER_PRIVATE_KEY=
VITE_BUILDER_PUBLIC_KEY=
NEXT_PUBLIC_* (we use Vite, not Next.js)
```

### Critical Security Rules
- ❌ **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to client
- ❌ **NEVER** commit `.env` files to git
- ✅ **ALWAYS** use `VITE_` prefix for client-accessible vars
- ✅ **ALWAYS** validate required env vars on server startup

---

## Dependencies (Forbidden)

### ❌ Do Not Add These
```json
{
  "@builder.io/react": "FORBIDDEN - removed 2025-12-13",
  "@builder.io/sdk": "FORBIDDEN - removed 2025-12-13",
  "next": "FORBIDDEN - we use Vite, not Next.js",
  "create-react-app": "FORBIDDEN - deprecated",
  "moment": "FORBIDDEN - use date-fns instead"
}
```

### ✅ Approved Alternatives
```json
{
  "date-fns": "✅ Date manipulation",
  "zod": "✅ Validation",
  "react-hook-form": "✅ Forms",
  "@tanstack/react-query": "✅ Data fetching"
}
```

---

## AI Providers

### Current Configuration
```typescript
// ✅ Supported providers
type AIProvider = "openai" | "anthropic";

// ✅ Provider selection
AI_PROVIDER=auto         // Prefers OpenAI if both available
AI_PROVIDER=openai       // Force OpenAI
AI_PROVIDER=anthropic    // Force Claude

// ✅ Model configuration
OPENAI_MODEL_TEXT=gpt-4o-mini           // Default for text generation
OPENAI_MODEL_ADVANCED=gpt-4o            // For complex reasoning
ANTHROPIC_MODEL=claude-3-5-sonnet-latest // Claude default
```

---

## Agent Types

### Canonical Agent Names
```typescript
type AgentType = "doc" | "design" | "advisor";

// ✅ Use these consistently
"doc"     - Content Writer Agent (social posts, copy)
"design"  - Design Agent (visual specs, layouts)
"advisor" - Strategic Advisor Agent (analysis, recommendations)

// ❌ Avoid inconsistent naming
"content", "writer", "copywriter" → use "doc"
"designer", "visual" → use "design"
"strategy", "analyst" → use "advisor"
```

---

## Git Conventions

### Branch Names
```bash
# ✅ Feature branches
feature/add-dark-mode
feature/social-media-scheduler

# ✅ Bug fixes
fix/calendar-timezone-issue
fix/auth-redirect-loop

# ✅ Chores (maintenance, deps, cleanup)
chore/remove-builder
chore/update-dependencies

# ✅ Docs
docs/update-api-guide
docs/add-deployment-checklist

# ❌ Avoid
main_feature_123        (underscores, unclear)
johns-branch            (personal names)
temp                    (vague)
```

### Commit Messages
```bash
# ✅ Format: <type>: <description>
feat: add social media calendar view
fix: resolve timezone bug in scheduler
chore: remove Builder.io integration
docs: update deployment guide
refactor: simplify auth middleware
test: add RLS policy tests

# ✅ Breaking changes
feat!: migrate to UUID brand_id (BREAKING)

# ❌ Avoid
"fixed stuff"           (vague)
"WIP"                   (not descriptive)
"asdf"                  (meaningless)
```

---

## Documentation Standards

### File Structure
```
docs/
├── architecture/       # System design, diagrams
├── guides/            # How-to guides
├── deployment/        # Deploy & infra
├── api/              # API reference
└── archive/          # Historical docs (rarely updated)
```

### Markdown Conventions
```markdown
# ✅ Headings: Title Case for H1/H2, Sentence case for H3+
# Main System Architecture
## Database Schema
### Brand guide table structure

# ✅ Code blocks: Always specify language
```typescript
const example = "code";
```

# ✅ Links: Use relative paths within docs
[See deployment guide](./deployment/GUIDE.md)

# ❌ Avoid:
ALL CAPS HEADINGS
bare URLs without link text
broken internal links
```

---

## Testing Conventions

### File Naming
```bash
# ✅ Unit tests: *.test.ts
brandContext.test.ts
apiClient.test.ts

# ✅ Integration tests: *.integration.test.ts
onboarding-flow.integration.test.ts

# ✅ E2E tests: *.e2e.test.ts
user-journey.e2e.test.ts
```

### Test Structure
```typescript
// ✅ Describe blocks: Clear hierarchy
describe("BrandGuide", () => {
  describe("creation", () => {
    it("should create a new brand guide", () => {});
    it("should validate required fields", () => {});
  });
  
  describe("updates", () => {
    it("should update existing guide", () => {});
  });
});

// ❌ Avoid:
test("test 1", () => {});  // Vague description
it("works", () => {});     // Not descriptive
```

---

## Enforcement

### CI Checks
```bash
# Run guardrail check
.github/scripts/check-forbidden-terms.sh

# This check runs in CI and will FAIL if:
- Builder.io references found in code
- Aligned-20AI branding in code files
- Forbidden dependencies in package.json
```

### Manual Checks
```bash
# Check for Builder.io in code
grep -rn "builder\.io\|@builder\.io" server/ client/ shared/

# Check for deprecated branding
grep -rn "aligned-20\|aligned20" server/ client/ shared/

# Should return: 0 matches
```

---

## Questions?

If you're unsure about a naming convention:
1. Check this document first
2. Look for similar existing code
3. Ask in team chat
4. When in doubt, prioritize consistency with existing code

**Last Updated:** 2025-12-13  
**Maintained By:** Engineering Team

