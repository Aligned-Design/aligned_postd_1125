# Contributing to Aligned AI

Thank you for your interest in contributing to Aligned AI! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm package manager
- Git
- Supabase account (for database access)

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/your-org/aligned-ai.git
cd aligned-ai

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials and API keys

# Start development servers
pnpm dev
```

See [Development Guide](./docs/development/README.md) for detailed setup instructions.

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Use clear, descriptive branch names:
- `feature/user-authentication` - new feature
- `fix/login-validation` - bug fix
- `docs/api-documentation` - documentation
- `refactor/component-structure` - code refactoring
- `test/add-e2e-tests` - tests

### 2. Make Your Changes

- Follow the [Coding Standards](#coding-standards) below
- Write clear, descriptive commit messages
- Include comments for complex logic
- Update relevant documentation

### 3. Test Your Changes

```bash
# Run unit tests
pnpm test

# Run type checking
pnpm typecheck

# Run linter
pnpm lint:fix

# Run E2E tests (if applicable)
pnpm exec playwright test
```

All tests must pass before submitting a PR.

### 4. Commit Your Changes

Write clear commit messages following this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:** feat, fix, docs, style, refactor, test, chore
**Scope:** component, api, database, etc.
**Subject:** brief description (50 chars or less)
**Body:** detailed explanation (optional)
**Footer:** reference issues (e.g., Fixes #123)

**Example:**
```
feat(brand-intelligence): add competitor analysis endpoint

Implements new /api/brand-intelligence/:brandId endpoint
that provides comprehensive competitor analysis and recommendations.

Includes:
- Competitor identification and benchmarking
- Content gap analysis
- Strategy recommendations

Fixes #456
```

### 5. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Then open a PR on GitHub with:
- Clear title describing the change
- Description of what was changed and why
- Reference to related issues
- Screenshots/demos if applicable
- Checklist of testing performed

## Coding Standards

### TypeScript
- Use strict mode enabled
- No `any` type unless absolutely necessary
- Define interfaces for all data structures
- Use discriminated unions for complex types
- Add JSDoc comments for public APIs

Example:
```typescript
/**
 * Fetches brand intelligence data
 * @param brandId - The brand identifier
 * @returns Promise containing brand intelligence data
 * @throws Error if brand not found or unauthorized
 */
async function getBrandIntelligence(brandId: string): Promise<BrandIntelligence> {
  // implementation
}
```

### React Components
- Use functional components with hooks
- Prefer composition over inheritance
- Use meaningful prop names
- Add PropTypes or TypeScript interfaces
- Memoize expensive computations

Example:
```typescript
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // fetch user
  }, [userId]);

  return (
    // component JSX
  );
}
```

### Styling
- Use Tailwind CSS utilities
- Create reusable component styles
- Use CSS variables for custom colors
- Avoid inline styles
- Ensure responsive design

Example:
```tsx
<div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
    Title
  </h1>
</div>
```

### Error Handling
- Use try/catch for async operations
- Provide meaningful error messages
- Log errors for debugging
- Don't expose sensitive information
- Handle errors gracefully in UI

### Testing
- Write unit tests for business logic
- Write integration tests for APIs
- Write E2E tests for critical user flows
- Aim for 70%+ code coverage
- Use descriptive test names

Example:
```typescript
describe('getBrandIntelligence', () => {
  it('should return intelligence data for valid brandId', async () => {
    const result = await getBrandIntelligence('brand-123');
    expect(result.id).toBe('brand-123');
  });

  it('should throw error for invalid brandId', async () => {
    await expect(getBrandIntelligence('invalid')).rejects.toThrow();
  });
});
```

## Commit Message Template

We provide a commit message template to help format messages consistently:

```bash
git config commit.template .gitmessage
```

## Pull Request Review Process

1. **Automated Checks:** GitHub Actions runs tests, linting, and type checking
2. **Code Review:** Maintainers review code for quality and standards
3. **Feedback:** Address any requested changes or questions
4. **Approval:** PR requires approval from at least one maintainer
5. **Merge:** Squash and merge to main branch

### Review Checklist
- [ ] Code follows style guide
- [ ] All tests pass
- [ ] No new warnings introduced
- [ ] Documentation updated
- [ ] PR description clear and complete
- [ ] Related issues referenced
- [ ] No unrelated changes included

## Reporting Bugs

Use GitHub Issues to report bugs. Include:

- **Title:** Clear, descriptive summary
- **Description:** What you expected vs. what happened
- **Steps to Reproduce:** Detailed reproduction steps
- **Environment:** OS, Node version, browser (if applicable)
- **Logs:** Error messages, stack traces
- **Screenshots:** Visual issues with screenshots

**Example Bug Report:**
```markdown
# Login button not responding

## Description
Clicking the login button on the login page has no effect.

## Steps to Reproduce
1. Navigate to http://localhost:5173/login
2. Enter email and password
3. Click "Sign In" button
4. Button shows no response

## Expected
User should be logged in and redirected to dashboard

## Actual
No visible change, no error messages

## Environment
- OS: macOS 12.4
- Node: 18.16.0
- Browser: Chrome 114
```

## Suggesting Features

Use GitHub Discussions for feature suggestions:

- **Title:** Feature name and brief description
- **Use Case:** Why this feature is needed
- **Proposed Solution:** How it might work
- **Alternatives:** Other approaches considered
- **Additional Context:** Mockups, examples, references

## Documentation

Help improve documentation by:

- Fixing typos and clarifying confusing sections
- Adding examples and use cases
- Documenting undocumented features
- Improving organization and structure
- Creating missing documentation

Documentation changes should follow the same PR process as code changes.

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Check [Development Guide](./docs/development/README.md)
- Review [API Documentation](./docs/api/README.md)
- See [Architecture Documentation](./docs/architecture/README.md)
- Ask in GitHub Discussions

---

Thank you for contributing to Aligned AI! 🙌
