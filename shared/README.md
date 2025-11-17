# Shared - Shared Types & Utilities

The shared directory contains TypeScript type definitions, interfaces, and utilities used across both client and server applications.

## Overview

This directory provides:
- TypeScript type definitions for data structures
- Shared constants and enumerations
- Utility functions used by both frontend and backend
- API request/response types
- Database entity types
- Business logic types

## Directory Structure

```
shared/
├── types/               # TypeScript type definitions
│   ├── auth.ts         # Authentication types
│   ├── brands.ts       # Brand types
│   ├── content.ts      # Content types
│   └── ...             # Other types
├── constants.ts        # Shared constants
├── utils/              # Shared utility functions
│   ├── validation.ts   # Validation helpers
│   ├── formatting.ts   # Formatting utilities
│   └── ...             # Other utilities
└── index.ts           # Main export file
```

## Key Files

### Type Definitions

#### `auth.ts`
User and authentication related types:
```typescript
interface User {
  id: string;
  email: string;
  role: 'agency' | 'client';
  brands: string[];
}

interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}
```

#### `brands.ts`
Brand and brand kit types:
```typescript
interface Brand {
  id: string;
  name: string;
  userId: string;
  colorScheme: ColorScheme;
  fontFamily: string;
  platforms: Platform[];
}

interface BrandKit {
  logo: string;
  colors: Record<string, string>;
  fonts: FontConfig[];
}
```

#### `content.ts`
Content item types:
```typescript
interface ContentItem {
  id: string;
  brandId: string;
  title: string;
  body: string;
  platform: 'instagram' | 'linkedin' | 'facebook' | 'twitter';
  status: 'draft' | 'pending' | 'approved' | 'published' | 'rejected';
  createdAt: string;
  publishedAt?: string;
}

interface ApprovalRequest {
  contentId: string;
  requestedBy: string;
  requestedAt: string;
  deadline?: string;
}
```

#### `api.ts`
API request/response types:
```typescript
interface ApiResponse<T> {
  data: T;
  success: boolean;
  timestamp: string;
}

interface ApiError {
  error: string;
  code: string;
  timestamp: string;
}
```

### Constants

```typescript
// shared/constants.ts
export const SUPPORTED_PLATFORMS = [
  'instagram',
  'linkedin',
  'facebook',
  'twitter',
] as const;

export const CONTENT_STATUS = [
  'draft',
  'pending',
  'approved',
  'published',
  'rejected',
] as const;

export const USER_ROLES = ['agency', 'client'] as const;

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  BRANDS: '/api/brands',
  CONTENT: '/api/content',
  ASSETS: '/api/assets',
} as const;
```

## Usage

### In Client Code

```typescript
import { type ContentItem, CONTENT_STATUS } from '@shared/content';
import { getInitials } from '@shared/utils/formatting';

function MyComponent() {
  const content: ContentItem = {
    // ...
  };

  return <div>{getInitials(content.title)}</div>;
}
```

### In Server Code

```typescript
import { type ContentItem, type ApiResponse } from '@shared';
import { validateEmail } from '@shared/utils/validation';

export async function handleContentRequest(item: ContentItem) {
  const response: ApiResponse<ContentItem> = {
    data: item,
    success: true,
    timestamp: new Date().toISOString(),
  };

  return response;
}
```

## Type Organization

### By Domain

Types are organized by business domain:
- `auth.ts` - Authentication and users
- `brands.ts` - Brand management
- `content.ts` - Content and publishing
- `assets.ts` - Media and files
- `analytics.ts` - Metrics and analytics
- `webhooks.ts` - Webhook events
- `approvals.ts` - Approval workflows
- `escalations.ts` - Escalation rules
- `audit.ts` - Audit logs
- `brand-intelligence.ts` - Intelligence and insights

### Naming Conventions

- **Interfaces:** PascalCase (e.g., `ContentItem`)
- **Types:** PascalCase (e.g., `Platform`)
- **Enums:** PascalCase (e.g., `ContentStatus`)
- **Union Types:** Literal values (e.g., `'draft' | 'approved'`)

## Utility Functions

### Validation Utilities

```typescript
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

### Formatting Utilities

```typescript
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0].toUpperCase())
    .join('');
}
```

### Type Guards

```typescript
export function isContentItem(obj: unknown): obj is ContentItem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'brandId' in obj &&
    'title' in obj
  );
}

export function isPlatform(value: unknown): value is Platform {
  return SUPPORTED_PLATFORMS.includes(value as Platform);
}
```

## Best Practices

### Type Safety

- ✅ Define types for all shared data structures
- ✅ Use strict TypeScript settings
- ✅ Avoid `any` type
- ✅ Use discriminated unions for complex types
- ✅ Implement type guards for runtime checking

### Code Organization

- ✅ Group related types in single files
- ✅ Export types from main index.ts
- ✅ Use consistent naming conventions
- ✅ Document complex types with comments
- ✅ Keep utilities focused and reusable

### Examples

**Complex Type:**
```typescript
type ContentStatus = 'draft' | 'pending' | 'approved' | 'published' | 'rejected';

interface ContentItem {
  id: string;
  title: string;
  status: ContentStatus;
  metadata?: Record<string, unknown>;
}
```

**Discriminated Union:**
```typescript
type WebhookEvent =
  | { type: 'content.created'; payload: ContentItem }
  | { type: 'content.published'; payload: ContentItem & { publishedAt: string } }
  | { type: 'user.registered'; payload: User };
```

**Type Guard:**
```typescript
function handleWebhookEvent(event: WebhookEvent) {
  if (event.type === 'content.created') {
    // event.payload is ContentItem
    console.log(event.payload.title);
  }
}
```

## Import Paths

All imports use the `@shared` alias:

```typescript
// Correct
import { ContentItem } from '@shared/content';
import { validateEmail } from '@shared/utils/validation';

// Incorrect - don't use relative paths
import { ContentItem } from '../shared/content';
```

## Adding New Types

### Step 1: Create Type File

```typescript
// shared/my-new-feature.ts
export interface MyFeature {
  id: string;
  name: string;
  enabled: boolean;
}

export type MyFeatureStatus = 'active' | 'inactive' | 'pending';

export const MY_FEATURE_DEFAULTS = {
  enabled: false,
} as const;
```

### Step 2: Export from Index

```typescript
// shared/index.ts
export type { MyFeature, MyFeatureStatus } from './my-new-feature';
export { MY_FEATURE_DEFAULTS } from './my-new-feature';
```

### Step 3: Use in Client/Server

```typescript
import { type MyFeature } from '@shared';
```

## Testing Shared Code

```bash
# Run tests (if any)
pnpm test

# Type check
pnpm typecheck
```

## Documentation

### Inline Comments

```typescript
/**
 * Represents a content item that can be published to social platforms.
 * @property id - Unique identifier
 * @property brandId - Associated brand
 * @property status - Publication status
 */
export interface ContentItem {
  id: string;
  brandId: string;
  status: ContentStatus;
}
```

### JSDoc for Functions

```typescript
/**
 * Validates if string is a valid email format
 * @param email - Email address to validate
 * @returns true if valid email format
 * @example
 * validateEmail('user@example.com') // true
 * validateEmail('invalid') // false
 */
export function validateEmail(email: string): boolean {
  // implementation
}
```

## Common Patterns

### API Response Wrapper

```typescript
interface ApiResponse<T> {
  data: T;
  success: boolean;
  timestamp: string;
  code?: string;
}

type ApiResult<T> = Promise<ApiResponse<T>>;
```

### Error Response

```typescript
interface ApiError {
  error: string;
  code: string;
  timestamp: string;
  details?: Record<string, unknown>;
}
```

### Pagination

```typescript
interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

## Maintenance

### Regular Tasks

- Update types when database schema changes
- Add tests for type guards
- Review and update documentation
- Ensure imports use proper aliases
- Keep types DRY (Don't Repeat Yourself)

### Deprecation

When deprecating types:

```typescript
/**
 * @deprecated Use NewType instead
 * @see NewType
 */
export type OldType = { /* ... */ };
```

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Advanced Types](https://www.typescriptlang.org/docs/handbook/advanced-types.html)
- [Type Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

## Contributing

When adding new shared code:

1. Define types clearly with comments
2. Add type guards for runtime checking
3. Use consistent naming conventions
4. Update main index.ts exports
5. Add tests if applicable
6. Update this README if needed

---

See [Contributing Guidelines](../CONTRIBUTING.md) for more information.
