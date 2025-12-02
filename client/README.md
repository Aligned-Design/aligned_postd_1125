# Client - Frontend Application

The client is a modern React 18 + TypeScript application built with Vite, featuring a responsive UI with Tailwind CSS.

## Overview

The frontend provides the user interface for the POSTD platform, including:
- User authentication and dashboard
- Brand and content management
- AI-powered content generation
- Content approval workflows
- Media and asset management
- Analytics and reporting
- Brand intelligence and insights

## Directory Structure

```
client/
├── components/          # Reusable React components
│   ├── ui/             # Base UI components (buttons, forms, modals)
│   ├── layout/         # Layout components (header, sidebar, footer)
│   ├── auth/           # Authentication components
│   └── ...             # Feature-specific components
├── pages/              # Page components (routes)
├── hooks/              # Custom React hooks
├── utils/              # Utility functions and helpers
├── styles/             # Global styles and CSS
├── types/              # TypeScript type definitions
├── assets/             # Static assets (images, icons)
└── App.tsx            # Main app component with routing
```

## Tech Stack

- **Framework:** React 18
- **Language:** TypeScript 5
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 3
- **UI Components:** shadcn/ui
- **Routing:** React Router v6
- **State Management:** React Context API + custom hooks
- **HTTP Client:** Fetch API with defensive response handling
- **Testing:** Vitest + Playwright

## Getting Started

### Installation

```bash
# From project root
pnpm install

# Start development server
pnpm dev
```

The frontend will be available at `http://localhost:5173`

### Environment Configuration

See `.env.example` for required variables:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_URL=http://localhost:8080
```

## Key Features

### Authentication
- Protected routes with role-based access control
- Supabase JWT authentication
- Auto-login on app load
- Session management

### Content Management
- AI-powered content generation with Claude
- Content approval workflows
- Bulk operations for multiple items
- Content calendar with scheduling

### Brand Management
- Multi-brand workspace support
- Brand kit configuration
- Brand-specific data isolation
- Brand switcher in navigation

### Media Management
- Asset upload with progress tracking
- Image variant generation
- Auto-tagging with AI
- Duplicate detection
- Advanced search and filtering

### Analytics
- Performance metrics
- Audience insights
- Engagement tracking
- Custom reporting

### Brand Intelligence
- Competitor analysis
- Audience profiling
- Content recommendations
- Strategic insights

## Component Patterns

### Functional Components with Hooks

```typescript
import { useState, useEffect } from 'react';

interface PageProps {
  id: string;
}

export function MyComponent({ id }: PageProps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data
  }, [id]);

  if (loading) return <LoadingSpinner />;

  return <div>{/* component JSX */}</div>;
}
```

### Custom Hooks

Custom hooks located in `hooks/` directory:
- `useAuth()` - Authentication state and methods
- `useBrandIntelligence()` - Brand intelligence data fetching
- `useToast()` - Toast notifications
- And more...

### Error Handling

All API calls use defensive JSON parsing via `safeJsonParse()`:
```typescript
try {
  const data = await safeJsonParse(response);
} catch (err) {
  // Handle parsing error gracefully
}
```

## Styling Guidelines

### Tailwind CSS
- Use utility classes for all styling
- Follow Tailwind class ordering conventions
- Use responsive prefixes for mobile-first design

```tsx
<div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Title</h1>
</div>
```

### CSS Variables
Custom colors and values defined in `globals.css`:
```css
--primary: #2563eb;
--secondary: #7c3aed;
```

## State Management

### React Context
Global state using React Context API:
- Authentication context
- Brand context
- Theme context

### Custom Hooks
Business logic and state in custom hooks for reusability and testing.

### Local State
Component-level state with `useState` for UI-specific data.

## API Integration

### Defensive Response Handling
```typescript
// Safe JSON parsing with Content-Type validation
async function fetchData() {
  const response = await fetch('/api/endpoint');

  // This validates Content-Type before JSON.parse()
  const data = await safeJsonParse(response);

  // Handle success response
  return data;
}
```

### Error Handling
```typescript
// Consistent error handling pattern
try {
  const data = await safeJsonParse(response);
} catch (err) {
  const message = getErrorMessage(err);
  setError(message);
  logError(err);
}
```

## Testing

### Running Tests

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# E2E tests
pnpm exec playwright test

# Coverage report
pnpm test:coverage
```

### Writing Tests

Tests located alongside components in `__tests__/` folders:
```typescript
describe('UserProfile', () => {
  it('should render user name', () => {
    const { getByText } = render(<UserProfile userId="123" />);
    expect(getByText('John Doe')).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Code Splitting
- Lazy load pages with `React.lazy()`
- Use Suspense boundaries for fallback UI
- Only load necessary code on each route

### Image Optimization
- Use responsive image variants
- Lazy load below-the-fold images
- Optimize image formats and sizes

### Bundle Optimization
- Tree-shake unused code
- Minify and compress assets
- Use dynamic imports where needed

## Debugging

### Browser DevTools
- React DevTools extension for component inspection
- Network tab for API calls
- Console for JavaScript errors
- Application tab for local storage

### VS Code Debugging
- Set breakpoints in VS Code
- Debug in Chrome using Debugger for Chrome extension
- Use console.log for simple debugging

## Common Issues

### Port 5173 Already in Use
```bash
lsof -ti:5173 | xargs kill -9
```

### Module Not Found
- Check import paths and aliases
- Verify file names and extensions
- Clear node_modules and reinstall

### CORS Errors
- Check API_BASE_URL in .env
- Verify backend CORS configuration
- Use relative paths when possible

## Best Practices

- ✅ Use TypeScript strictly, no `any` types
- ✅ Follow React hooks rules
- ✅ Write tests for business logic
- ✅ Use semantic HTML
- ✅ Ensure responsive design
- ✅ Implement proper error boundaries
- ✅ Optimize performance
- ✅ Document complex components
- ✅ Follow naming conventions
- ✅ Keep components small and focused

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Vite Guide](https://vitejs.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

For more information, see [Development Guide](../docs/development/README.md).
