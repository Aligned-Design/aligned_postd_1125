# Development Guide

This directory contains documentation for local development setup, coding standards, and contribution workflows.

## Getting Started

### Prerequisites
- Node.js 18+ (use `nvm` with `.nvmrc` file)
- pnpm (Node package manager)
- Git
- VS Code or similar editor

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/aligned-ai.git
cd aligned-ai

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env  # or your preferred editor

# Start development servers
pnpm dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:8080`.

## Project Structure

```
aligned-ai/
├── client/              # React frontend
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Utility functions
│   └── styles/         # Global styles
├── server/             # Express backend
│   ├── routes/         # API route handlers
│   ├── lib/            # Business logic
│   ├── middleware/     # Express middleware
│   └── workers/        # Background jobs
├── shared/             # Shared types and utilities
├── supabase/          # Database migrations
└── docs/              # Documentation
```

## Development Workflow

### Creating a New Feature

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Implement the feature following the coding standards below
3. Add tests for your code
4. Run linting and type checking
5. Commit with a meaningful message
6. Push and create a pull request

### Coding Standards

- **TypeScript:** Strict mode enabled
- **Naming:** PascalCase for components/classes, camelCase for functions/variables
- **React:** Functional components with hooks
- **Styling:** Tailwind CSS for all styling
- **Imports:** Use path aliases (@/ for client, @shared/ for shared code)
- **Error Handling:** Consistent error patterns with proper logging

### Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests with Playwright
pnpm exec playwright test

# Generate coverage report
pnpm test:coverage
```

### Code Quality

```bash
# Run ESLint
pnpm lint

# Fix linting issues
pnpm lint:fix

# Run TypeScript type checking
pnpm typecheck

# Build for production
pnpm build
```

## Database Development

### Running Migrations

```bash
# Push migrations to Supabase
supabase db push

# Pull schema from Supabase
supabase db pull

# Create new migration
supabase migration new migration_name
```

### RLS Policy Development

All data access is controlled via Row-Level Security (RLS) policies. When adding new tables:

1. Create RLS policy for the table
2. Test policy with different user roles
3. Document policy in migration file
4. Add tests to verify policy behavior

## Debugging

### Frontend Debugging
- Use React DevTools browser extension
- Browser DevTools console for JavaScript errors
- Network tab to inspect API calls
- Application tab to view component state

### Backend Debugging
- Console logs are output to terminal
- Use debugger breakpoints in VS Code
- Check database queries in Supabase dashboard
- Review error logs for unhandled exceptions

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

**TypeScript Errors**
```bash
pnpm typecheck  # Check and fix issues
```

**Database Connection Issues**
- Verify .env configuration
- Check Supabase project status
- Test connection: `supabase status`

## Before Committing

- [ ] Run `pnpm test` - all tests pass
- [ ] Run `pnpm typecheck` - no type errors
- [ ] Run `pnpm lint:fix` - no linting issues
- [ ] Code follows standards above
- [ ] Commit message is descriptive
- [ ] No debug logs or comments left in code

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [ESLint Rules Guide](../guides/ESLINT_RULES_GUIDE.md)

---

See [Contributing Guidelines](../../CONTRIBUTING.md) for pull request and code review procedures.
