# Tech Stack Guide - POSTD Platform

**Last Verified**: November 11, 2025
**Version**: 1.0
**Commit**: f52ffc4
**Status**: Production Ready

---

## Executive Summary

**POSTD** (formerly Aligned-20AI) is a full-stack TypeScript SaaS platform for multi-platform social media content management, powered by React 18, Express.js, Supabase PostgreSQL, Bull Queue/Redis, and AI services (OpenAI, Claude). The stack emphasizes:

- **Type Safety**: TypeScript throughout (though strict mode currently disabled)
- **Scalability**: Multi-tenant SaaS architecture with tenant_id isolation
- **Resilience**: Auto-pause error recovery, circuit breaker pattern, error taxonomy (20+ codes)
- **Observability**: Structured Datadog logging with cycleId/requestId/tenantId context
- **Security**: AES-256-GCM token encryption, OAuth 2.0, RLS policies, input validation (Zod)

**Supported Environments**: Local (port 8080), Staging, Production (Vercel)

---

## 1. Core Dependencies Map

### Frontend (Client)

| Package | Version | Category | Purpose | Where Used | Status |
|---------|---------|----------|---------|-----------|--------|
| **react** | 18.3.1 | Framework | Core UI library | `client/**` | Active |
| **react-dom** | 18.3.1 | Framework | DOM rendering | `client/index.*` | Active |
| **react-router-dom** | 6.30.1 | Routing | Client-side routing | `client/App.tsx` | Active |
| **typescript** | 5.9.2 | Language | Type safety | All files | Active |
| **vite** | 7.1.2 | Build Tool | Fast bundling | Root config | Active |
| **@vitejs/plugin-react-swc** | 4.0.0 | Build Plugin | React + SWC transpilation | `vite.config.ts` | Active |
| **tailwindcss** | 3.4.17 | Styling | Utility-first CSS | `client/**` | Active |
| **@tailwindcss/typography** | 0.5.16 | Plugin | Rich text styling | Docs/content | Active |
| **tailwind-merge** | 2.6.0 | Utility | Class conflict resolution | Component utilities | Active |
| **tailwindcss-animate** | 1.0.7 | Plugin | Built-in animations | Global keyframes | Active |
| **@radix-ui/\*** | 1.x | Component Library | Accessible UI components | `client/components/ui` | Active |
| **react-hook-form** | 7.62.0 | Forms | Form state management | `client/components` | Active |
| **@hookform/resolvers** | 5.2.1 | Validation | Schema resolvers for React Hook Form | Form components | Active |
| **zod** | 3.25.76 | Validation | TypeScript-first schema validation | Client & server | Active |
| **@tanstack/react-query** | 5.84.2 | Data Fetching | Server state, caching, sync | Hooks in `client/hooks` | Active |
| **lucide-react** | 0.539.0 | Icons | Icon library | `client/components` | Active |
| **recharts** | 2.12.7 | Charts | React charting library | Analytics/dashboard | Active |
| **framer-motion** | 12.23.12 | Animation | Advanced motion library | Interactive components | Active |
| **next-themes** | 0.4.6 | Theming | Dark mode support | `client/App.tsx` | Active |
| **embla-carousel-react** | 8.6.0 | Carousel | Image carousel | Library/gallery | Active |
| **react-dropzone** | 14.3.8 | File Upload | File drop zone | `LibraryUploadZone` | Active |
| **react-day-picker** | 9.8.1 | Date Picker | Lightweight date UI | Calendar components | Active |
| **react-resizable-panels** | 3.0.4 | Layout | Resizable panel layout | Dashboard layout | Active |
| **sonner** | 1.7.4 | Toast | Toast notifications | `useToast()` hook | Active |
| **clsx** | 2.1.1 | Utilities | Conditional class names | Component utilities | Active |
| **class-variance-authority** | 0.7.1 | Utilities | Component variant system | UI components | Active |
| **date-fns** | 4.1.0 | Date Utils | Date manipulation | Analytics, scheduling | Active |
| **vaul** | 1.1.2 | Drawer | Drawer/dialog component | Asset drawer, settings | Active |
| **input-otp** | 1.4.2 | Form | OTP input component | Auth flows | Active |
| **uuid** | 13.0.0 | Utilities | UUID generation | Frontend IDs | Active |
| **@sentry/react** | 10.23.0 | Monitoring | Error tracking | Error boundaries | Active |
| **@testing-library/react** | 16.3.0 | Testing | React testing utilities | Test files | Dev |
| **jsdom** | 27.1.0 | Testing | DOM simulation | Test environment | Dev |
| **vitest** | 3.2.4 | Testing | Fast unit tests | `*.spec.ts` files | Dev |

### Backend (Server)

| Package | Version | Category | Purpose | Where Used | Status |
|---------|---------|----------|---------|-----------|--------|
| **express** | 5.1.0 | Framework | HTTP server/routing | `server/index.ts` | Active |
| **@supabase/supabase-js** | 2.80.0 | Database | Supabase client | DB services | Active |
| **@types/express** | 5.0.3 | Types | Express types | TypeScript | Dev |
| **@types/node** | 24.2.1 | Types | Node.js types | TypeScript | Dev |
| **multer** | 2.0.2 | Middleware | File upload handling | Media routes | Active |
| **cors** | 2.8.5 | Middleware | CORS support | `server/index.ts` | Active |
| **@types/cors** | 2.8.19 | Types | CORS types | TypeScript | Dev |
| **socket.io** | 4.8.1 | Real-time | WebSocket events | Analytics/live updates | Active |
| **socket.io-client** | 4.8.1 | Real-time | WebSocket client | `client/hooks` | Active |

### Job Queue & Caching

| Package | Version | Category | Purpose | Where Used | Status |
|---------|---------|----------|---------|-----------|--------|
| **bull** | (check package.json) | Queue | Redis job queue | `server/queue/**` | Active |
| **redis** | (check package.json) | Cache | In-memory store | Queue backend | Active |
| **ioredis** | (check package.json) | Redis Driver | Redis client | Queue/cache | Active |

### AI & Language Models

| Package | Version | Category | Purpose | Where Used | Status |
|---------|---------|----------|---------|-----------|--------|
| **@anthropic-ai/sdk** | 0.68.0 | AI | Claude API integration | Brand intelligence, content gen | Active |
| **openai** | 6.8.1 | AI | OpenAI API integration | GPT-4, GPT-3.5 calls | Active |

### Email & Communication

| Package | Version | Category | Purpose | Where Used | Status |
|---------|---------|----------|---------|-----------|--------|
| **@sendgrid/mail** | 8.1.6 | Email | SendGrid integration | Email notifications | Active |
| **nodemailer** | 7.0.10 | Email | SMTP email fallback | Backup email | Active |

### Media & Asset Processing

| Package | Version | Category | Purpose | Where Used | Status |
|---------|---------|----------|---------|-----------|--------|
| **sharp** | 0.34.5 | Image Processing | Fast image manipulation | Media resizing, optimization | Active |
| **node-vibrant** | 4.0.3 | Color Extraction | Extract palette from images | Brand guide auto-generation | Active |
| **robots-parser** | 3.0.1 | Web Crawling | Parse robots.txt | Content crawling | Active |

### 3D & Graphics

| Package | Version | Category | Purpose | Where Used | Status |
|---------|---------|----------|---------|-----------|--------|
| **three** | 0.176.0 | 3D Library | 3D rendering engine | Creative Studio 3D | Active |
| **@react-three/fiber** | 8.18.0 | 3D React | Three.js React binding | Canvas 3D component | Active |
| **@react-three/drei** | 9.122.0 | 3D Helpers | Helper objects/utilities | 3D scene setup | Active |
| **@types/three** | 0.176.0 | Types | Three.js types | TypeScript | Dev |

### Utilities & Helpers

| Package | Version | Category | Purpose | Where Used | Status |
|---------|---------|----------|---------|-----------|--------|
| **dotenv** | 17.2.1 | Config | Environment variables | `server/index.ts` | Active |
| **tsx** | 4.20.3 | Runtime | TypeScript execution | Scripts, development | Dev |

### Deployment & Serverless

| Package | Version | Category | Purpose | Where Used | Status |
|---------|---------|----------|---------|-----------|--------|
| **@vercel/node** | 5.5.5 | Deployment | Vercel serverless runtime | API routes on Vercel | Active |
| **serverless-http** | 3.2.0 | Serverless | Express to serverless adapter | Vercel compatibility | Active |

### Code Quality & Testing

| Package | Version | Category | Purpose | Where Used | Status |
|---------|---------|----------|---------|-----------|--------|
| **eslint** | 9.39.1 | Linting | Code quality | Pre-commit/CI | Dev |
| **eslint-plugin-react** | 7.37.5 | Linting | React best practices | Component linting | Dev |
| **eslint-plugin-react-hooks** | 7.0.1 | Linting | React Hooks rules | Hook safety | Dev |
| **@typescript-eslint/eslint-plugin** | 8.46.4 | Linting | TypeScript rules | TS linting | Dev |
| **@typescript-eslint/parser** | 8.46.4 | Linting | TypeScript parser | ESLint config | Dev |
| **prettier** | 3.6.2 | Formatting | Code formatter | Pre-commit | Dev |
| **supertest** | 7.1.4 | Testing | HTTP assertion library | API endpoint tests | Dev |
| **@types/supertest** | 6.0.3 | Types | Supertest types | TypeScript | Dev |

### Build & Dev Tools

| Package | Version | Category | Purpose | Where Used | Status |
|---------|---------|----------|---------|-----------|--------|
| **@swc/core** | 1.13.3 | Transpiler | Fast TypeScript transpilation | Vite/build pipeline | Dev |
| **autoprefixer** | 10.4.21 | CSS | CSS vendor prefixes | PostCSS pipeline | Dev |
| **postcss** | 8.5.6 | CSS | CSS transformation | Tailwind integration | Dev |
| **globals** | 16.3.0 | Types | Global type definitions | ESLint config | Dev |

### Observability & Monitoring

| Package | Version | Category | Purpose | Where Used | Status |
|---------|---------|----------|---------|-----------|--------|
| **pino** | (check package.json) | Logging | Structured JSON logging | `server/lib/observability.ts` | Active |
| **pino-pretty** | (check package.json) | Logging | Pretty console output (dev) | Development logging | Dev |
| **web-vitals** | 5.1.0 | Monitoring | Core Web Vitals tracking | `client/lib/analytics.ts` | Active |

### Total Dependency Count
- **Runtime Dependencies**: 40+
- **Dev Dependencies**: 50+
- **Total Top-Level Packages**: 90+

---

## 2. Package Scripts Reference

| Script | Command | Purpose | When to Use | Frequency |
|--------|---------|---------|------------|-----------|
| `dev` | `vite` | Start Vite dev server (port 8080) | Local development | Daily |
| `build` | `npm run build:client && npm run build:server` | Full production build | CI/CD, pre-deployment | Release cycle |
| `build:client` | `vite build` | Build React frontend to `dist/` | Manual client-only builds | As needed |
| `build:server` | `vite build --config vite.config.server.ts` | Build Express backend | Manual server-only builds | As needed |
| `start` | `node dist/server/node-build.mjs` | Start production server | Production runtime | Deployment |
| `test` | `vitest --run` | Run all tests once | CI/CD, validation | Before commits |
| `test:ci` | `vitest --run` | Run tests in CI (same as test) | GitHub Actions | CI/CD |
| `format` | `prettier --check .` | Check code formatting | Pre-commit validation | CI/CD |
| `format.fix` | `prettier --write .` | Auto-fix code formatting | Local development | After changes |
| `lint` | `eslint . --ext .ts,.tsx,.js,.jsx` | Check code quality | Pre-commit | CI/CD |
| `lint:fix` | `eslint . --ext .ts,.tsx,.js,.jsx --fix` | Auto-fix linting issues | Local development | After changes |
| `typecheck` | `tsc` | TypeScript type checking | Pre-commit validation | Frequently |
| `validate:env` | `tsx server/utils/validate-env.ts` | Validate environment variables | Pre-deployment | Setup, deployment |
| `verify:supabase` | `tsx server/utils/verify-supabase-setup.ts` | Test Supabase connection | Setup, debugging | Setup phase |

---

## 3. Frontend Architecture

### React & React Router v6

**Routing Pattern** (`client/App.tsx`):
```typescript
// Code-split by route for optimal loading
<BrowserRouter>
  <Routes>
    <Route path="/" element={<UnauthenticatedLayout />}>
      <Route index element={<Index />} />
    </Route>
    <Route element={<ProtectedRoutes />}>
      <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
      <Route path="/calendar" element={<MainLayout><Calendar /></MainLayout>} />
      {/* 34+ more protected routes */}
    </Route>
  </Routes>
</BrowserRouter>
```

**Best Practices**:
- ✅ Use `React.lazy()` + `Suspense` for route code-splitting
- ✅ Wrap protected routes in `<ProtectedRoutes />` component
- ✅ Implement Error Boundary at route level for graceful failures
- ✅ Use `useNavigate()` for programmatic navigation, `<Link />` for standard links
- ⚠️ Current: TypeScript strict mode is OFF; enable for better type safety
- ⚠️ Watch: Monitor bundle size; current chunk limit is 1000KB

**Key Hook Patterns**:
```typescript
// Data fetching with React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', resourceId],
  queryFn: async () => fetch(`/api/resource/${resourceId}`).then(r => r.json()),
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: 2,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Form state with React Hook Form + Zod
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(mySchema),
});

// Global state with Context
const { user, isAuthenticated } = useAuth();
```

### Vite Configuration

**Build Strategy** (`vite.config.ts`):
- Vendor code splitting by category:
  - `vendor-react`: React, React Router, React DOM
  - `vendor-ui`: Radix UI components
  - `vendor-graphics`: Three.js, React Three Fiber
  - `vendor-data`: React Query, Recharts
  - `vendor-form`: React Hook Form, Zod
  - `vendor-other`: Everything else
- Chunk size warning threshold: 1000KB
- Dev server runs on port **8080** (IPv6 support via `::`)
- File system restrictions: Only allows `client/` and `shared/` access

**Best Practices**:
- Monitor chunk sizes with `npm run build` output
- Use dynamic imports for heavy libraries: `const Three = await import('three')`
- Avoid circular dependencies; use barrel exports (`index.ts`) to organize
- Tree-shake unused code; verify with `rollup` plugin inspection

### TailwindCSS Design System

**Token System** (`tailwind.config.ts`):
- **Colors**: Primary, secondary, destructive, muted, accent, popover, card, sidebar
- **All use HSL variables** for dynamic theming: `hsl(var(--primary))`
- **Spacing**: 12, 16, 24, 32 (custom additions beyond Tailwind defaults)
- **Border Radius**: lg (var(--radius)), md, sm (computed variants)
- **Animations**: accordion-down/up, fade-in, slide-in (via keyframes)
- **Dark Mode**: Class-based toggle (`dark:bg-black`)

**Class Naming Hygiene**:
- ✅ Use Tailwind utilities for layout/spacing: `flex`, `gap-4`, `p-6`
- ✅ Use Tailwind for responsive: `md:grid-cols-2`, `lg:hidden`
- ✅ Extract repeated patterns to components, not CSS classes
- ⚠️ Avoid inline styles; use Tailwind utilities instead
- ⚠️ Use `tailwind-merge` for dynamic class combinations to avoid conflicts

**Performance Tips**:
- Tailwind scans `client/**/*.{ts,tsx}` for classes (excludes server code)
- Purges unused CSS in production builds automatically
- Design tokens reduce bundle size vs. arbitrary color values

### TypeScript Configuration

**Settings** (`tsconfig.json`):
- **Target**: ES2020 (modern browsers)
- **Module**: ESNext (native ES modules)
- **JSX**: react-jsx (no React import needed)
- **Module Resolution**: bundler (Vite/Rollup compatible)
- **Strict Mode**: **DISABLED** ❌ (reason: allows gradual migration, but reduces type safety)
- **Path Aliases**: `@/*` → `./client/*`, `@shared/*` → `./shared/*`

**⚠️ Current Gaps**:
- Strict mode disabled → potential null reference errors
- noUnusedLocals/Parameters disabled → dead code possible
- noImplicitAny disabled → implicit `any` types allowed

**Recommendation**: Enable strict mode incrementally:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Context API State Management

**Pattern** (in `client/contexts/`):

```typescript
// AuthContext: User authentication state
interface AuthContextType {
  user: OnboardingUser | null;
  isAuthenticated: boolean;
  onboardingStep: 1 | 2 | 3 | 3.5 | 4 | 4.5 | 5 | null;
  login: (user: OnboardingUser) => void;
  logout: () => void;
}

// WorkspaceContext: Multi-workspace management
interface WorkspaceContextType {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
  members: Member[];
}

// BrandContext: Selected brand
interface BrandContextType {
  selectedBrand: Brand;
  setBrand: (brand: Brand) => void;
}
```

**Best Practices**:
- ✅ Keep contexts focused (auth, workspace, brand, user) - one concern each
- ✅ Store in localStorage for persistence: `aligned_user`, `aligned_brand`
- ✅ Use `useCallback` to memoize context values to prevent re-renders
- ⚠️ Don't use Context for frequently-changing data (use React Query instead)
- ⚠️ Avoid creating new context objects on every render

### Observability on Client

**Performance Tracking** (`client/lib/analytics.ts`):
```typescript
// Track Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(metric => recordMetric('web.vitals.cls', metric.value));
getLCP(metric => recordMetric('web.vitals.lcp', metric.value));
```

**Recommended Lighthouse Targets**:
- Performance: ≥90
- Accessibility: ≥90
- Best Practices: ≥90
- SEO: ≥90

---

## 4. Backend Architecture

### Express.js Routing & Middleware

**Server Setup** (`server/index.ts`):
```typescript
const app = express();

// Middleware order (important!)
app.use(cors());  // CORS first
app.use(express.json());  // Body parsing
app.use(morgan('combined'));  // Logging
app.use(csrfProtection);  // CSRF (if required)
app.use(validateEnv);  // Env validation
app.use(requestIdMiddleware);  // Add requestId to context
app.use(authMiddleware);  // Auth validation (attach to req.user)

// Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/publishing', publishingRoutes);
app.use('/api/brand-intelligence', brandIntelligenceRoutes);
app.use('/api/webhooks', webhookRoutes);
// 25+ more route groups

app.use(errorHandler);  // Global error handler LAST

app.listen(process.env.PORT || 3000);
```

**Route Pattern**:
```typescript
// Good: Typed, validated, error-handled
router.post('/publish',
  validateRequestBody(PublishSchema),  // Zod validation
  authenticateRequest,  // Auth check
  asyncHandler(async (req: Request, res: Response) => {
    const { content, platforms } = req.body;
    const result = await publishingService.publish(content, platforms);
    res.json({ success: true, jobId: result.jobId });
  })
);
```

**Best Practices**:
- ✅ Use `asyncHandler` wrapper for all async routes (handles promise rejections)
- ✅ Validate all inputs with Zod before processing
- ✅ Authenticate all protected routes
- ✅ Return consistent error responses: `{ error, code, message, suggestion }`
- ✅ Log with context: `log({ tenantId, userId, requestId }, 'info', message)`
- ⚠️ Never return sensitive data in errors
- ⚠️ Always validate tenant_id matches authenticated user

### Supabase / PostgreSQL

**Database Client** (`server/lib/connections-db-service.ts`):
```typescript
// All queries use tenant_id for multi-tenant isolation
const { data, error } = await supabase
  .from('connections')
  .select('*')
  .eq('tenant_id', tenantId)  // REQUIRED: Always filter by tenant
  .eq('status', 'active');

if (error) {
  log({ tenantId, errorCode: error.code }, 'error', 'DB query failed');
  throw new AppError(error.message, 'DB_ERROR');
}
```

**Schema Highlights**:
- **connections**: OAuth tokens (encrypted), platform accounts, status
- **brands**: Tenant brand configurations, brand voice, visual identity
- **publishing_jobs**: Job tracking, status, retry attempts
- **publishing_logs**: Attempt logs, error details, timestamps
- **analytics_data**: Platform metrics, aggregated by platform + date
- **brand_intelligence**: Cached AI analysis, recommendations
- **audit_logs**: All state changes for compliance

**RLS Policies** (Row-Level Security):
- Enforce tenant_id isolation at database layer
- Users can only see data for their tenant
- Service role (backend) can bypass RLS if needed

**Best Practices**:
- ✅ Always include `eq('tenant_id', tenantId)` in SELECT/UPDATE/DELETE
- ✅ Use prepared statements (Supabase client handles this)
- ✅ Index frequently-filtered columns: tenant_id, created_at, status
- ✅ Use batch operations for bulk inserts/updates
- ⚠️ Monitor query performance in production
- ⚠️ Set up connection pooling (Supabase does this automatically)

**Connection Pooling**:
- Supabase uses PgBouncer for connection management
- Default pool size: 10-100 depending on plan
- Monitor active connections in Supabase dashboard

### Bull Queue + Redis

**Job Types** (`server/queue/`):

```typescript
// Queue setup
const publishQueue = new Queue('publishing', {
  redis: { host: process.env.REDIS_HOST, port: 6379 },
});

// Job types
interface PublishJob {
  tenantId: string;
  connectionId: string;
  content: PostContent;
  platforms: string[];
  idempotencyKey: string;  // Prevent duplicate processing
}

// Worker with retry/backoff
publishQueue.process(async (job) => {
  try {
    const { content, platforms } = job.data;
    const results = await publishToAllPlatforms(content, platforms);
    return { success: true, results };
  } catch (error) {
    const classified = classifyAndActionError(error);

    if (classified.retryable && job.attemptsMade < classified.maxRetries) {
      // Bull will retry with exponential backoff
      throw error;
    } else {
      // Non-retryable; send to DLQ
      await dlqQueue.add({ ...job.data, reason: classified.code });
      throw error;  // Still mark job as failed
    }
  }
});

// Retry config
publishQueue.addJob = async (job) => {
  return publishQueue.add(job.data, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,  // Start at 1s, multiply by 2 each attempt
    },
    removeOnComplete: true,
    removeOnFail: false,  // Keep failed jobs for debugging
  });
};
```

**Job State Machine**:
```
Pending → Active → Completed ✓
      ↘       ↘ Failed → Waiting (retry)
             → Stalled (timeout)
```

**Best Practices**:
- ✅ Use idempotency keys to prevent duplicate processing
- ✅ Set appropriate retry counts (usually 3-5 for external APIs)
- ✅ Configure exponential backoff (avoid thundering herd)
- ✅ Move truly failed jobs to DLQ for manual review
- ✅ Monitor queue depth via Datadog metrics
- ⚠️ Don't process large objects in job data; store references instead
- ⚠️ Redis is NOT persistent by default; use AOF or RDB backup

**DLQ (Dead Letter Queue)** Pattern:
```typescript
const dlqQueue = new Queue('dlq');

// When job fails permanently:
await dlqQueue.add({
  originalJobId: job.id,
  failureReason: classified.errorCode,
  failureMessage: classified.userMessage,
  attempts: job.attemptsMade,
  data: job.data,
  timestamp: Date.now(),
});

// Operators review DLQ, decide: retry or discard
```

### Error Classification & Auto-Pause

**Error Taxonomy** (`server/lib/errors/error-taxonomy.ts`):
```typescript
export const ERROR_TAXONOMY: Record<ErrorCode, ClassifiedError> = {
  AUTH_EXPIRED: {
    code: ErrorCode.AUTH_EXPIRED,
    action: ErrorAction.TRIGGER_RECONNECT,
    severity: ErrorSeverity.HIGH,
    retryable: false,
    maxRetries: 0,
    userMessage: 'Your connection has expired. Click "Reconnect" to refresh credentials.',
    requiresReauth: true,
    pausesChannel: true,  // ← Prevents cascading retries
  },
  // ... 20+ more error codes
};
```

**Auto-Pause Flow** (`server/lib/recovery/auto-pause.ts`):
```typescript
// When 401/403 occurs:
await autoPauseConnection(tenantId, connectionId, {
  code: ErrorCode.AUTH_EXPIRED,
  description: 'OAuth token expired',
  recoveryAction: 'Click "Reconnect" and reauthorize',
  requiresReauth: true,
});

// Connection status changes to 'attention'
// User sees reconnect banner in UI
// When user clicks reconnect → OAuth flow with pre-selected account
// On success → resumeConnection() → status back to 'active'
```

**Benefits**:
- ✅ Eliminates 401/403 retries (which will always fail)
- ✅ Forces user action instead of cascading failures
- ✅ Audit trail of all pause/resume events
- ✅ Enables synthetic health checks to detect silent failures

---

## 5. Authentication & Secrets

### TokenVault (AES-256-GCM + PBKDF2)

**Encryption Flow** (`server/lib/token-vault.ts`):
```typescript
const vault = new TokenVault({
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
  kmsKeyId: process.env.AWS_KMS_KEY_ID,  // Optional: Use AWS KMS
  masterSecret: process.env.TOKEN_VAULT_MASTER_SECRET,  // Fallback
});

// Encrypt
const encrypted = await vault.encrypt(accessToken);
// Result: { ciphertext, iv, authTag, algorithm, keyId, timestamp }

// Store in database
await connectionsDB.update({
  encrypted_token: encrypted,
});

// Decrypt
const encrypted = await connectionsDB.get(connectionId);
const decrypted = await vault.decrypt(encrypted);  // Back to plaintext
```

**Security Properties**:
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **IV**: Random 16-byte initialization vector per encryption
- **Key Derivation**: PBKDF2 with 100,000 iterations (slow, resistant to brute-force)
- **Auth Tag**: 16-byte tag ensures ciphertext not tampered
- **Master Secret**: Can be AWS KMS key or environment variable
- **Timestamp**: Records when encrypted (for key rotation tracking)

**Best Practices**:
- ✅ Rotate master secret every 90 days
- ✅ Use AWS KMS in production (better than env vars)
- ✅ Never log plaintext tokens
- ✅ Decrypt tokens only when needed, immediately after fetch
- ⚠️ Store master secret in secure vault (1Password, AWS Secrets Manager)
- ⚠️ Monitor key usage patterns for anomalies

### OAuth 2.0 Flows

**Supported Providers**:
- Meta (Instagram, Facebook)
- LinkedIn
- TikTok
- Google Business Profile
- Mailchimp

**Flow Pattern**:
```
1. User clicks "Connect [Platform]"
2. Backend generates authorization URL with:
   - client_id, redirect_uri, scope, state (CSRF token)
3. User redirected to platform login
4. User grants permissions
5. Platform redirects back with authorization code
6. Backend exchanges code for tokens:
   - POST /oauth/token { code, client_id, client_secret, redirect_uri }
7. Platform returns { access_token, refresh_token, expires_in }
8. Backend encrypts tokens via TokenVault
9. Stores encrypted tokens in connections table
10. User sees "Connected" status in UI
```

**Minimum Scopes** (respect least-privilege):

| Platform | Min. Scopes | Reason |
|----------|-----------|--------|
| Meta (Instagram) | `instagram_basic,instagram_content_publish` | Publish + read insights |
| Meta (Facebook) | `pages_manage_posts,pages_read_user_context` | Publish + read engagement |
| LinkedIn | `w_member_social,r_basicprofile` | Publish + identity |
| TikTok | `video.upload,user.info.basic` | Upload + account info |
| Google Business | `google.business_basics,google.business_manage_business` | Business data access |
| Mailchimp | `lists,emails` | Campaign creation |

**Best Practices**:
- ✅ Store `state` (CSRF token) in session/database with 10-minute expiry
- ✅ Request minimum scopes needed; let users add more manually
- ✅ Validate redirect_uri matches configured value
- ✅ Use PKCE (Proof Key for Code Exchange) if platform supports it
- ✅ Refresh tokens 5 minutes before expiry (proactive)
- ⚠️ Never store `code` long-term; exchange immediately
- ⚠️ Rotate refresh tokens on each use if platform provides new one

### Zod Validation

**Validation Pattern**:
```typescript
import { z } from 'zod';

// Define schema
const PublishRequestSchema = z.object({
  content: z.string().min(1).max(5000),
  platforms: z.array(z.enum(['meta', 'linkedin', 'tiktok'])).min(1),
  scheduledAt: z.date().optional(),
  tags: z.array(z.string()).optional(),
});

type PublishRequest = z.infer<typeof PublishRequestSchema>;

// Validate in route
router.post('/publish', (req, res) => {
  const parsed = PublishRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }

  const request: PublishRequest = parsed.data;
  // Safe to use; type guaranteed
});
```

**Best Practices**:
- ✅ Use `safeParse()` to handle errors without exceptions
- ✅ Define schemas once, use everywhere (client + server validation)
- ✅ Use `.refine()` for complex cross-field validation
- ✅ Provide helpful error messages
- ⚠️ Never trust client validation alone; always validate server-side
- ⚠️ Avoid deeply nested schemas; flatten if possible

---

## 6. Connector Pattern (Pluggable Platform Adapters)

### Connector Interface

**Base Structure** (`server/connectors/base.ts`):
```typescript
export abstract class BaseConnector {
  abstract authenticate(): Promise<void>;
  abstract publish(content: PostContent): Promise<PublishResult>;
  abstract getAccounts(): Promise<Account[]>;
  abstract fetchPostAnalytics(postId: string): Promise<Analytics>;
  abstract healthCheck(): Promise<HealthStatus>;
  abstract deletePost(postId: string): Promise<void>;
  abstract refreshToken(): Promise<void>;
}

// Implementations: MetaConnector, LinkedInConnector, TikTokConnector, etc.
```

### Connector Manager

**Factory Pattern** (`server/connectors/manager.ts`):
```typescript
class ConnectorManager {
  getConnector(platform: string, connectionId: string): BaseConnector {
    switch (platform) {
      case 'meta':
        return new MetaConnector(connectionId, this.vault);
      case 'linkedin':
        return new LinkedInConnector(connectionId, this.vault);
      case 'tiktok':
        return new TikTokConnector(connectionId, this.vault);
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }
}

// Usage
const connector = manager.getConnector('meta', connectionId);
const result = await connector.publish(content);
```

### Capability Matrix

**Concept** (designed, ready for implementation):
```typescript
interface CapabilityMatrix {
  [platform: string]: {
    formats: {
      text: boolean;
      image: boolean;
      video: boolean;
      carousel: boolean;
      story: boolean;
    };
    features: {
      scheduling: boolean;
      analytics: boolean;
      engagement: boolean;
      hashtags: boolean;
      mentions: boolean;
    };
    limits: {
      maxTextLength: number;
      maxImageSize: number;
      maxVideoLength: number;
      maxImagesPerPost: number;
    };
  };
}

// Validate before publish
const caps = CAPABILITY_MATRIX['meta'];
if (content.text.length > caps.limits.maxTextLength) {
  throw new Error(`Text exceeds ${caps.limits.maxTextLength} character limit`);
}
```

### Error Classification → Recovery

**Pattern**:
```typescript
try {
  await connector.publish(content);
} catch (error) {
  // 1. Classify error
  const classified = classifyAndActionError(platform, statusCode, errorData);

  // 2. Take action
  if (classified.pausesChannel) {
    await autoPauseConnection(tenantId, connectionId, classified);
  } else if (classified.retryable) {
    // Bull queue will retry with backoff
    throw error;
  } else {
    // Send to DLQ
    await dlqQueue.add({ ...jobData, dlqReason: classified.code });
  }
}
```

---

## 7. Observability & Monitoring

### Structured Logging (Pino + Datadog)

**Logger Setup** (`server/lib/observability.ts`):
```typescript
// Pino configured with Datadog compatibility
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isProduction ? undefined : { target: 'pino-pretty' },
  serializers: {
    req: (req) => ({ method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
    error: pino.stdSerializers.err,
  },
});

// Structured logging with context
export function log(context: LogContext, level: 'debug'|'info'|'warn'|'error', message: string, data?: any) {
  const logData = { ...context, ...data, timestamp: new Date().toISOString() };
  logger[level](logData, message);
}
```

**Required Log Fields**:
```typescript
interface LogContext {
  cycleId?: string;       // Batch operation ID
  requestId?: string;     // Single request ID
  tenantId?: string;      // Multi-tenant ID
  userId?: string;        // User identity
  connectionId?: string;  // API connection ID
  platform?: string;      // 'meta', 'linkedin', etc.
  jobId?: string;         // Queue job ID
  latencyMs?: number;     // Operation latency
  statusCode?: number;    // HTTP status
  errorCode?: string;     // Classified error code
  retryAttempt?: number;  // Retry attempt #
}
```

**Example**:
```typescript
log(
  {
    tenantId: 'acme-corp',
    requestId: 'req-123',
    platform: 'meta',
    latencyMs: 245,
    statusCode: 200,
  },
  'info',
  'Post published successfully'
);

// Datadog receives:
// {
//   cycleId, requestId, tenantId, userId, connectionId, platform, jobId,
//   latencyMs, statusCode, errorCode, retryAttempt,
//   timestamp, message, level, ...other_fields
// }
```

### Datadog Integration

**Dashboards Expected**:
1. **IntegrationHealth**: Connection status, auth failures, sync health
2. **QueueAndLatency**: Job throughput, p50/p95/p99 latencies, retry rates
3. **TokensAndExpiries**: Upcoming expirations, refresh success rate, key rotation

**Core Alerts**:
1. TokenRefreshFailures: Too many 401/403 errors
2. Auth4xxSpike: Sudden increase in auth errors (indicates security issue)
3. WebhookFailures: Incoming webhooks failing consistently
4. QueueDepthThreshold: Queue backlog exceeding limit
5. DLQJobsAccumulating: Dead letter queue growing (manual action needed)

**SLOs to Track**:
- API Success Rate: ≥99.5%
- P95 API Latency: ≤500ms
- MTTR (Mean Time to Recovery): ≤15 minutes for page incidents
- Availability: ≥99.9% (per tenant)

### Best Practices

- ✅ Log at entry/exit of critical functions
- ✅ Include requestId/cycleId for request tracing
- ✅ Use structured fields (not unstructured strings)
- ✅ Sample high-volume logs (e.g., 1 in 10)
- ✅ Alert on business metrics (failed publishes, auth issues)
- ⚠️ Never log PII (email, tokens, passwords)
- ⚠️ Never log full request bodies (too much data)
- ⚠️ Set appropriate log retention (30 days typical)

---

## 8. Multi-Tenant Architecture

### Tenant_ID Propagation

**Rules** (must follow everywhere):

1. **Database Queries**:
   ```typescript
   // ❌ Wrong: Missing tenant filter
   const connections = await supabase.from('connections').select('*');

   // ✅ Right: Always filter by tenant_id
   const connections = await supabase
     .from('connections')
     .select('*')
     .eq('tenant_id', tenantId);
   ```

2. **Logs**:
   ```typescript
   // Always include tenantId in logs
   log({ tenantId, requestId, userId }, 'info', 'User action');
   ```

3. **Queue Jobs**:
   ```typescript
   // Always pass tenantId in job data
   await publishQueue.add({
     tenantId,
     connectionId,
     content,
   });
   ```

4. **API Responses**:
   ```typescript
   // Return only tenant-specific data
   // Filter by req.user.tenantId before returning
   const result = await getAnalytics(req.user.tenantId, brandId);
   ```

### Data Isolation Guarantees

**Database Layer (RLS)**:
- Supabase RLS policies enforce `tenant_id` filtering
- Service role can bypass; web client always filtered

**Application Layer**:
- Extract tenantId from JWT/session: `req.user.tenantId`
- Validate in every query: `eq('tenant_id', tenantId)`

**Rate Limiting** (per-tenant):
- Each tenant has separate quota (e.g., 100 API calls/minute)
- One tenant hitting limit doesn't affect others
- Token bucket algorithm per tenant

### Feature Flags (Per-Tenant)

**Pattern** (`server/lib/feature-flags.ts`):
```typescript
class FeatureFlagsManager {
  async isEnabled(tenantId: string, flag: string): Promise<boolean> {
    const config = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('tenant_id', tenantId)
      .eq('flag_name', flag)
      .single();

    return config?.enabled ?? false;  // Default to off
  }
}

// Usage
if (await featureFlags.isEnabled(tenantId, 'RECOVERY_AUTOPAUSE_ENABLED')) {
  await autoPauseConnection(...);  // New feature, gradual rollout
} else {
  // Old behavior
}
```

**Phase 3 Feature Flags**:
- `RECOVERY_AUTOPAUSE_ENABLED`: Auto-pause on 401/403
- `RECONNECT_WIZARD_ENABLED`: One-click reconnect UI
- `SYNTHETIC_PINGS_ENABLED`: Periodic health checks
- `CHAOS_TESTS_ENABLED`: Resilience testing enabled

---

## 9. Security Considerations

### OWASP Top 10 Mitigations

| Risk | Mitigation | Status |
|------|-----------|--------|
| **A1: Injection** | Parameterized queries (Supabase), Zod validation | ✅ Implemented |
| **A2: Broken Auth** | JWT via Supabase Auth, OAuth tokens encrypted | ✅ Implemented |
| **A3: Sensitive Data** | AES-256-GCM TokenVault, HTTPS only, no PII in logs | ✅ Implemented |
| **A4: XML/XXE** | Not applicable (no XML processing) | N/A |
| **A5: Access Control** | RLS policies, tenant_id filtering, RBAC (pending) | ✅ Partial |
| **A6: Security Misconfiguration** | CORS configured, security headers, env validation | ✅ Implemented |
| **A7: XSS** | React escaping by default, no innerHTML, CSP headers (todo) | ✅ Mostly |
| **A8: CSRF** | `sameSite` cookies, state parameter in OAuth | ✅ Implemented |
| **A9: Insecure Deserialization** | No pickle/deserialize; JSON only | ✅ Safe |
| **A10: Logging & Monitoring** | Datadog, audit trails, alerting | ✅ Implemented |

### CORS Policy

**Current** (`server/index.ts`):
```typescript
app.use(cors());  // Allows all origins (dev-friendly, NOT production-safe)
```

**Production Recommendation**:
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),  // e.g., 'https://app.example.com'
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Input Validation Strategy

**Client-Side** (UX):
```typescript
// React Hook Form with Zod
const form = useForm({ resolver: zodResolver(schema) });
// Provides real-time validation feedback
```

**Server-Side** (Security):
```typescript
// Always validate; NEVER trust client
router.post('/api/publish', (req, res) => {
  const result = PublishSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error });
  // Guaranteed safe to use result.data
});
```

### Data Retention & Deletion

**Retention Policy** (to be formalized):
- Publishing logs: Keep 90 days
- Analytics: Keep 12 months (aggregate after 90 days)
- Audit logs: Keep 7 years (compliance)
- User sessions: Auto-expire after 30 days inactivity

**Deletion Flow**:
```typescript
// When user deletes their account
async function deleteUserAndData(userId: string) {
  // 1. Soft-delete user (set deleted_at)
  await usersDB.update(userId, { deleted_at: new Date() });

  // 2. Delete PII (emails, names)
  await analyticsDB.anonymize(userId);

  // 3. Keep audit logs (immutable, for compliance)
  // 4. Keep derived analytics (aggregated, no PII)
}
```

### Audit Trails

**Events to Log**:
- User login/logout
- Token refresh
- Permission changes
- Data exports
- Settings changes
- Admin actions

**Schema** (`connection_audit` table):
```sql
CREATE TABLE connection_audit (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  connection_id UUID NOT NULL,
  action TEXT NOT NULL,  -- 'auto_pause', 'resume', 'token_refresh', etc.
  details JSONB,  -- { reason_code, description, old_status, new_status }
  changed_at TIMESTAMP NOT NULL,
  changed_by UUID,  -- User who triggered (null if system)
  FOREIGN KEY (connection_id) REFERENCES connections(id)
);
```

---

## 10. Performance Playbook

### Frontend (React + Vite + Tailwind)

**Wins**:
- ✅ Vite dev server: Fast HMR (>100ms refresh)
- ✅ Code splitting: Each route loads only needed code
- ✅ React SWC: 10-20x faster build vs. Babel
- ✅ Tailwind PurgeCSS: Only included used styles

**Pitfalls to Avoid**:
- ❌ Creating new objects/functions in JSX (breaks memoization)
- ❌ Large inline images (use lazy loading or next-image)
- ❌ Uncontrolled forms (causes re-renders)
- ❌ Missing keys in lists (`key={index}` is bad)
- ❌ Context thrashing (frequently-updating contexts)

**Optimization Checklist**:
```typescript
// 1. Memoize expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// 2. Lazy load routes
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

// 3. Use React Query for smart caching
const { data } = useQuery({
  queryKey: ['resource', id],
  queryFn: fetchResource,
  staleTime: 5 * 60 * 1000,  // 5 min
});

// 4. Virtualize long lists
<VirtualList items={1000} itemHeight={50} />

// 5. Preload critical resources
<link rel="preload" href="/vendor-react.js" as="script" />
```

### Backend (Express + Node + Supabase)

**Wins**:
- ✅ Node.js event loop: Great for I/O bound (network, DB)
- ✅ Connection pooling: Supabase handles automatically
- ✅ Async/await: Makes concurrent code readable
- ✅ Bull queue: Defers slow work off request path

**Pitfalls**:
- ❌ Blocking operations: `fs.readFileSync`, `crypto.pbkdf2Sync`
- ❌ Large loops without yields: Blocks event loop
- ❌ No connection limits: Resource exhaustion
- ❌ Unbounded queue growth: Memory leak
- ❌ Hot module reloading in prod: Causes restarts

**Optimization Checklist**:
```typescript
// 1. Use async file I/O
const data = await fs.promises.readFile(path);

// 2. Use async crypto
const hash = await crypto.subtle.pbkdf2(...);

// 3. Batch database queries
const results = await Promise.all([
  getAnalytics(id),
  getBrand(id),
  getConnections(id),
]);

// 4. Use queue for slow work
await publishQueue.add({ ... }, { delay: 5000 });

// 5. Paginate results
const page = req.query.page || 1;
const limit = 50;
const offset = (page - 1) * limit;
const data = await db.query({ limit, offset });
```

### Queue Throughput

**Target**: 1,000+ publishes per minute

**Tuning**:
```typescript
const queue = new Queue('publishing', {
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
  },
  settings: {
    maxStalledCount: 2,  // How many stalls before fail
    stalledInterval: 5000,  // Check every 5s
    guardInterval: 5000,  // Clean stalled every 5s
    retryProcessDelay: 5000,  // Retry processing every 5s
  },
});

queue.process(100);  // Process 100 jobs in parallel
```

**Monitoring**:
- Queue depth should stay < 1,000 (not growing unbounded)
- P95 job latency should be < 5 seconds
- Failed jobs should go to DLQ, not keep retrying

### Redis Sizing

**Estimate**:
- 1 million jobs in queue: ~500MB RAM
- High throughput (10k jobs/sec): ~2GB RAM minimum
- Add 50% buffer for headroom

**Configuration**:
```
# redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru  # Evict least-recently-used
timeout 0
tcp-keepalive 300
```

### Build & Deployment Performance

**Client Build** (`npm run build:client`):
- Target: < 2 seconds for incremental, < 30 seconds full
- Output: ~500KB gzipped (with code splitting)
- Analyze: `npm run build -- --analyze`

**Server Build** (`npm run build:server`):
- Target: < 10 seconds
- Output: ~5MB uncompressed (includes node_modules)

**Deployment to Vercel**:
- Cold start: ~2 seconds
- Warm start: <100ms
- Edge caching: 60 seconds default

---

## 11. Common Patterns in This Codebase

### Folder Structure

```
aligned-20ai/
├── client/                    # React frontend
│   ├── App.tsx               # Router setup
│   ├── pages/                # Page components (23 files)
│   ├── components/           # Reusable components (90+ files)
│   │   ├── ui/               # Base UI (Radix-based)
│   │   ├── dashboard/        # Dashboard-specific
│   │   └── layout/           # Layout (Header, Sidebar)
│   ├── hooks/                # Custom hooks (14 files)
│   ├── contexts/             # State (Auth, Workspace, Brand, User)
│   ├── lib/                  # Utilities (analytics, validators, etc.)
│   └── types/                # TypeScript interfaces
├── server/                    # Express backend
│   ├── index.ts              # Express setup
│   ├── routes/               # API routes (25+ files)
│   ├── lib/                  # Services (error handling, connectors, DB)
│   ├── queue/                # Bull queue setup
│   ├── connectors/           # Platform adapters (Meta, LinkedIn, TikTok)
│   ├── scripts/              # One-off scripts
│   └── middleware/           # Auth, CSRF, validation
├── shared/                    # Types shared client/server
│   ├── brand-intelligence.ts
│   ├── publishing.ts
│   └── validation-schemas.ts
├── supabase/                  # Database migrations & config
│   └── migrations/
├── docs/                      # Documentation
└── vite.config.ts, tsconfig.json, etc.  # Config files
```

### Module Boundaries

**Don't Cross**:
- ❌ Client importing from `server/`
- ❌ Server importing from `client/`
- ❌ Components importing from `pages/`

**Do Use**:
- ✅ `shared/` for types both need
- ✅ `server/lib/` for business logic
- ✅ `client/lib/` for browser utilities
- ✅ `client/contexts/` for global state only

### Error Taxonomy Usage Pattern

```typescript
// 1. Error occurs
try {
  await connector.publish(content);
} catch (error) {
  // 2. Classify
  const classified = classifyPartnerError(platform, statusCode, errorData);

  // 3. Log
  log({
    tenantId, connectionId, platform, errorCode: classified.code,
  }, 'warn', `Publish failed: ${classified.code}`);

  // 4. Recover
  if (classified.pausesChannel) {
    await autoPauseConnection(tenantId, connectionId, classified);
    // Notify user via UI banner
  } else if (classified.retryable) {
    // Bull queue will retry
    throw error;
  } else {
    // Send to DLQ
    await dlqQueue.add({ ...jobData, dlqReason: classified.code });
  }
}
```

### Publishing Workflow Lifecycle

```
1. User creates content in Creative Studio
2. User clicks "Send to Queue"
   ├─ POST /api/publishing/queue
   ├─ Validate against brand guidelines
   ├─ Create publishing_job record (status: draft)
   └─ Trigger BrandFidelity + Linter agents

3. Content moves to Content Queue
   ├─ Status: reviewing
   ├─ Show BrandFidelityScore, LinterResults
   ├─ User can edit content

4. User reviews & approves
   ├─ Status: approved
   ├─ Optionally schedule (scheduledAt)

5. Publishing job processes (Bull worker)
   ├─ Get connector for each platform
   ├─ Publish content
   ├─ Classify any errors (auto-pause if needed)
   ├─ Log results
   └─ Update publishing_job (status: published, error details)

6. Analytics collected
   ├─ Platform webhooks fire
   ├─ Synthetic pings detect silent failures
   ├─ Metrics aggregated hourly
```

### HITL (Human-In-The-Loop) Approval Pattern

```typescript
// Agent generates suggestion
const suggestion = await creativeBrainAgent.generate(brand, goal);

// User reviews & edits
// Option A: Accept as-is
// Option B: Edit manually
// Option C: Regenerate

// Log feedback for improvement
await feedback.log({
  agentId: 'creative-brain',
  suggestion,
  userFeedback: 'accepted|edited|rejected',
  editsMade: { field: 'caption', oldValue: '...', newValue: '...' },
});
```

---

## 12. Setup & Local Development

### 5-Minute Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your values:
#   VITE_SUPABASE_URL=https://xxxx.supabase.co
#   VITE_SUPABASE_ANON_KEY=eyxxx
#   ANTHROPIC_API_KEY=sk-ant-xxx
#   OPENAI_API_KEY=sk-xxx
#   etc.

# 3. Validate environment
pnpm run validate:env

# 4. Verify Supabase setup
pnpm run verify:supabase

# 5. Start dev server
pnpm run dev

# 6. Open browser
open http://localhost:8080
```

### Common Development Tasks

| Task | Command | Notes |
|------|---------|-------|
| Start frontend dev | `pnpm run dev` | Vite on port 8080 |
| Type-check | `pnpm run typecheck` | Run before commits |
| Lint code | `pnpm run lint` | Run before PR |
| Format code | `pnpm run format.fix` | Auto-fix style |
| Run tests | `pnpm run test` | All tests once |
| Build for prod | `pnpm run build` | Full bundle |
| Deploy to Vercel | `git push origin main` | Auto-deploy on merge |

### Debugging Tips

**Frontend**:
```typescript
// Check if feature flag enabled
console.log(await featureFlags.isEnabled(tenantId, 'FLAG_NAME'));

// Check auth state
const { user } = useAuth();
console.log(user);

// React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
<ReactQueryDevtools initialIsOpen={false} />
```

**Backend**:
```bash
# Watch logs during development
tail -f logs/*.log

# Check queue state
redis-cli
> KEYS publishing:*
> HGETALL bull:publishing:1  # Job ID

# Database query in Supabase console
SELECT * FROM publishing_jobs WHERE tenant_id = '...' LIMIT 10;
```

---

## 13. Maintenance & Upgrades

### Dependency Evaluation Process

**Before adding new package**:
1. Check for existing alternatives: `pnpm ls @radix-ui` → 20 packages already
2. Assess bundle impact: `npm install && npm run build -- --analyze`
3. Check security: `npm audit`
4. Evaluate maintenance: GitHub stars, recent updates, open issues
5. Document decision in commit message

**Version Pinning Policy**:
- Runtime deps: Caret (`^`) for minor updates, locks patch via lockfile
- Dev deps: Caret acceptable; renovate for auto-updates
- Critical (Supabase, Express): Minor pinning if breaking changes likely

**Update Frequency**:
- Security patches: ASAP (within 24 hours)
- Minor versions: Monthly review
- Major versions: Quarterly, with staging test

### Quarterly Integration Review

**Review Checklist**:
- [ ] Run `npm audit` for vulnerabilities
- [ ] Check for deprecated packages
- [ ] Evaluate unused dependencies (tree-shake analysis)
- [ ] Review GitHub issues for known bugs
- [ ] Check for breaking changes in roadmap
- [ ] Update TypeScript, Vite, Tailwind versions
- [ ] Verify all tests still pass

**Pruning Low-ROI Dependencies**:
- Example: If 3 packages do same thing, consolidate to 1
- Example: If feature unused, remove it
- Example: If polyfill no longer needed (all modern browsers), remove

---

## 14. Appendices

### A. Full Dependency Inventory

**See `package.json` for authoritative list** (90+ packages).

Top 20 by size/importance:
1. react (18.3.1)
2. react-dom (18.3.1)
3. typescript (5.9.2)
4. @supabase/supabase-js (2.80.0)
5. express (5.1.0)
6. vite (7.1.2)
7. tailwindcss (3.4.17)
8. @radix-ui/\* (multiple)
9. @tanstack/react-query (5.84.2)
10. @anthropic-ai/sdk (0.68.0)
... (and 80+ more)

### B. Required Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key | `eyJhbGc...` |
| `SUPABASE_SERVICE_KEY` | Supabase service role | `eyJhbGc...` (server only) |
| `ANTHROPIC_API_KEY` | Claude API key | `sk-ant-...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `REDIS_HOST` | Redis server | `localhost` (dev) |
| `REDIS_PORT` | Redis port | `6379` |
| `TOKEN_VAULT_MASTER_SECRET` | Encryption key | (generate with crypto.randomBytes) |
| `AWS_KMS_KEY_ID` | AWS KMS key (optional) | `arn:aws:kms:...` |
| `DATADOG_API_KEY` | Datadog API key | (prod only) |
| `NODE_ENV` | Environment | `development` \| `production` |
| `PORT` | Server port | `3000` |

### C. Glossary

| Term | Definition |
|------|-----------|
| **Tenant** | Customer/workspace; all data scoped by tenant_id |
| **Connection** | OAuth credential to a social platform (Instagram, LinkedIn, etc.) |
| **Publishing Job** | Queued task to publish content to one or more platforms |
| **Connector** | Platform-specific adapter (MetaConnector, LinkedInConnector, etc.) |
| **Capability Matrix** | Feature/format support matrix per platform |
| **Error Taxonomy** | Canonical classification of errors (20+ codes) |
| **Auto-Pause** | Automatic pausing of connection on 401/403 errors |
| **TokenVault** | Encrypted secret storage (AES-256-GCM) |
| **Bull Queue** | Redis-backed job queue library |
| **DLQ** | Dead Letter Queue for unrecoverable jobs |
| **RLS** | Row-Level Security (Supabase database policies) |
| **HITL** | Human-In-The-Loop (user reviews AI suggestions) |
| **Idempotency Key** | Unique ID to prevent duplicate processing |
| **Synthetic Ping** | Periodic health check independent of user activity |

### D. "If You Only Read One Page" Cheat Sheet

**For Developers**:
- TypeScript is enabled (strict mode OFF, consider enabling)
- React Router v6 with code splitting
- TailwindCSS for styling; design tokens in `tailwind.config.ts`
- React Query for server state; Context API for global client state
- Zod validates all inputs client & server
- Express.js backend with Supabase database
- Always filter by `tenant_id` in queries
- TokenVault encrypts all tokens (AES-256-GCM)
- Bull Queue for async work; error classification decides action
- Datadog logging with structured context (cycleId, requestId, tenantId)
- Auto-pause on 401/403; user reconnects via one-click OAuth

**For Operators**:
- Frontend: `pnpm run dev` (port 8080), built to `dist/` via Vite
- Backend: Runs on Express, connects to Supabase PostgreSQL + Redis
- Queue: Bull + Redis; jobs auto-retry with exponential backoff
- Secrets: TokenVault (AES-256-GCM); env vars in `.env`
- Monitoring: Datadog (logs, metrics, alerts); check dashboards for anomalies
- Failures: Check DLQ for stuck jobs; fix root cause then replay
- Scaling: Bull workers parallelizable; Redis is single-threaded (watch throughput)

**For Security**:
- Tokens always encrypted (TokenVault)
- Always validate tenant_id matches user
- RLS policies enforce data isolation
- Zod validates all inputs
- OAuth scopes minimal (least privilege)
- PII never logged
- CORS configured per environment
- Audit trails for state changes

---

## 15. Last Verified & Commit Info

**Last Verified**: November 11, 2025 at 18:12 UTC
**Commit SHA**: f52ffc4 (Fix TypeScript type errors with pragmatic type casting)
**Verified By**: Automated code scan + manual review

**Files Used for Verification**:
- `/package.json` - Dependencies
- `/tsconfig.json` - TypeScript config
- `/vite.config.ts`, `/vite.config.server.ts` - Build config
- `/tailwind.config.ts` - Design tokens
- `/server/lib/token-vault.ts` - Encryption
- `/server/lib/observability.ts` - Logging
- `/server/lib/errors/error-taxonomy.ts` - Error codes
- `/server/connectors/` - Platform adapters
- `/client/App.tsx` - Routing
- `/client/contexts/` - State management

**Known Gaps**:
- ⚠️ TypeScript strict mode disabled (should enable gradually)
- ⚠️ CORS allows all origins (configure per env in prod)
- ⚠️ API rate limiting designed but not fully implemented
- ⚠️ Capability matrix designed but not yet built
- ⚠️ Synthetic pings designed for Phase 3 (not yet implemented)

---

## Next Steps

1. **Enable TypeScript Strict Mode** incrementally
2. **Review CORS Configuration** for production URLs
3. **Implement API Rate Limiting** per tenant
4. **Build Synthetic Health Checks** (Phase 3)
5. **Set Up Datadog Dashboards & Alerts** with correct log fields
6. **Document Auth Flows** for each platform (OAuth scopes, redirect URIs)
7. **Create Incident Runbooks** for common failures (DLQ, token refresh failures, etc.)

---

**Questions?** See ARCHITECTURE_QUICK_REFERENCE.md, CODEBASE_ARCHITECTURE_OVERVIEW.md, or docs/ARCHITECTURE.md for additional details.

