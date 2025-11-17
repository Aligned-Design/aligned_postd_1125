# Guides & Tutorials

This directory contains how-to guides, tutorials, troubleshooting documentation, and reference materials.

## Contents

### Quick Start Guides
- **IMPLEMENTATION_PLAN.md** - Overall project implementation strategy
- **FINAL_COMPLETION_REPORT.md** - Project completion status and lessons learned
- **QUALITY_IMPROVEMENTS_SUMMARY.md** - Quality enhancement initiatives

### Development Guides
- **ESLINT_RULES_GUIDE.md** - ESLint configuration and rule explanations
- **TESTING_SCRIPTS_GUIDE.md** - Testing utilities and script guide
- **TYPESCRIPT_FIXES_SUMMARY.md** - Common TypeScript issues and fixes

### Documentation & Reference
- **SITEMAP_VISUAL_TREE.md** - Visual sitemap of application pages
- **QUALITY_CHECKLIST.md** - Quality assurance checklist before releases

### Troubleshooting
- **CRITICAL_GAPS_REMEDIATION.md** - Fixing critical application gaps
- **REMEDIATION_PROGRESS.md** - Tracking remediation work progress

### Checklists & Workflows
- **COMPETITOR_BENCHMARKING.md** - Industry benchmarking guide

## Learning Path

### For New Developers
1. Start with [Development Setup](../development/README.md)
2. Review [Architecture Documentation](../architecture/README.md)
3. Follow [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
4. Check [TESTING_SCRIPTS_GUIDE.md](./TESTING_SCRIPTS_GUIDE.md)

### For Maintaining Code Quality
1. Review [ESLINT_RULES_GUIDE.md](./ESLINT_RULES_GUIDE.md)
2. Follow [QUALITY_CHECKLIST.md](./QUALITY_CHECKLIST.md)
3. Use [TYPESCRIPT_FIXES_SUMMARY.md](./TYPESCRIPT_FIXES_SUMMARY.md) for type issues

### For Troubleshooting
1. Check [CRITICAL_GAPS_REMEDIATION.md](./CRITICAL_GAPS_REMEDIATION.md)
2. Review [REMEDIATION_PROGRESS.md](./REMEDIATION_PROGRESS.md)
3. Refer to [Development Debugging](../development/README.md#debugging)

## Common Tasks

### Setting Up a Local Environment
```bash
# See Development Setup in ../development/README.md
pnpm install
cp .env.example .env
pnpm dev
```

### Running Tests
```bash
# See TESTING_SCRIPTS_GUIDE.md
pnpm test
pnpm test:coverage
pnpm exec playwright test
```

### Fixing TypeScript Errors
```bash
# See TYPESCRIPT_FIXES_SUMMARY.md
pnpm typecheck
```

### Improving Code Quality
```bash
# See ESLINT_RULES_GUIDE.md and QUALITY_CHECKLIST.md
pnpm lint:fix
pnpm typecheck
pnpm test
```

### Deploying to Production
```bash
# See ../deployment/README.md
pnpm build
# Follow deployment guide
```

## Reference Materials

### Technology Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Express.js, Node.js, TypeScript
- **Database:** Supabase (PostgreSQL)
- **Testing:** Vitest, Playwright
- **Linting:** ESLint, Prettier
- **Build:** Vite

### Important Concepts
- **RLS (Row-Level Security):** Database-level access control
- **Lazy Loading:** Code splitting for performance
- **Defensive Parsing:** Safe JSON response handling
- **Error Boundaries:** React error handling pattern

### Key Files to Know
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.cjs` - ESLint configuration
- `vite.config.ts` - Vite build configuration
- `.env.example` - Environment variable template

## Best Practices

### Code Organization
- Components in `/client/components`
- Pages in `/client/pages`
- Hooks in `/client/hooks`
- Types shared across app in `/shared`

### Naming Conventions
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Files: match component/function name
- Folders: lowercase with hyphens (e.g., `user-profile/`)
- Functions: camelCase (e.g., `getUserData()`)

### TypeScript
- Always use strict mode
- No `any` type unless absolutely necessary
- Define interfaces for all data structures
- Use discriminated unions for complex types

### React Patterns
- Use functional components with hooks
- Memoize expensive computations
- Use Suspense for code splitting
- Implement error boundaries

### Testing
- Write unit tests for business logic
- Write integration tests for APIs
- Write E2E tests for critical flows
- Aim for 70%+ code coverage

## Support & Help

### Getting Help
1. Check relevant documentation in this directory
2. Review [Architecture](../architecture/) for design patterns
3. Check [API Documentation](../api/) for endpoint details
4. Review open issues in GitHub
5. Ask in team discussions

### Reporting Issues
- Create detailed bug reports with reproduction steps
- Include error messages and stack traces
- Attach relevant logs or screenshots
- Reference similar issues if applicable

### Suggesting Improvements
- Check existing documentation
- Document the improvement clearly
- Follow contribution guidelines
- Submit pull request with changes

---

**Last Updated:** 2025-11-05
**Status:** Active Maintenance
