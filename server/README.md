# Server - Backend API

The server is an Express.js + TypeScript application that provides RESTful APIs for the Aligned AI platform.

## Overview

The backend handles:
- User authentication and authorization
- Brand and content management APIs
- AI integration with Claude and OpenAI
- Content publishing to social platforms
- Media and asset management
- Webhook event handling
- Database operations with Supabase
- Email notifications
- Analytics and reporting

## Directory Structure

```
server/
├── routes/              # API route handlers
│   ├── auth.ts         # Authentication endpoints
│   ├── brands.ts       # Brand management
│   ├── content.ts      # Content operations
│   ├── ai-generation.ts # AI generation endpoints
│   ├── webhooks.ts     # Webhook handlers
│   ├── escalations.ts  # Escalation rules
│   ├── audit.ts        # Audit logging
│   └── ...             # Other routes
├── lib/                 # Business logic and utilities
│   ├── dbClient.ts     # Supabase client setup
│   ├── publishing-db-service.ts  # Publishing operations
│   ├── webhook-handler.ts        # Webhook processing
│   ├── escalation-scheduler.ts   # Escalation logic
│   ├── audit-logger.ts  # Audit logging
│   └── ...             # Other utilities
├── middleware/          # Express middleware
├── workers/            # Background job processors
├── types/              # TypeScript type definitions
└── index.ts            # Main server entry point
```

## Tech Stack

- **Framework:** Express.js 4
- **Language:** TypeScript 5
- **Runtime:** Node.js 18+
- **Database:** Supabase (PostgreSQL)
- **ORM:** Supabase PostgREST + raw SQL
- **Auth:** Supabase Auth with JWT
- **AI:** Claude API (Anthropic), OpenAI API
- **Email:** SendGrid API
- **Testing:** Vitest + Supertest
- **Monitoring:** Sentry (optional)

## Getting Started

### Installation

```bash
# From project root
pnpm install

# Start development server
pnpm dev
```

The backend will be available at `http://localhost:8080`

### Environment Configuration

See `.env.example` for required variables:
```
NODE_ENV=development
PORT=8080
VITE_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
SENDGRID_API_KEY=your-sendgrid-key
```

## API Structure

### Route Handlers

Each route file exports handlers for specific endpoints:

```typescript
export const getBrands: RequestHandler = async (req, res) => {
  try {
    // Business logic
    res.json({ data: brands });
  } catch (error) {
    // Error handling
    res.status(500).json({ error: error.message });
  }
};
```

### Error Handling Pattern

Consistent error response format across all endpoints:
```typescript
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-11-05T12:00:00Z"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Core APIs

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info

### Brands
- `GET /api/brands` - List user's brands
- `GET /api/brands/:id` - Get brand details
- `POST /api/brands` - Create brand
- `PUT /api/brands/:id` - Update brand

### Content
- `GET /api/content` - List content items
- `POST /api/content` - Create content
- `POST /api/content/generate` - Generate with AI
- `PUT /api/content/:id` - Update content
- `POST /api/content/:id/approve` - Approve content
- `POST /api/content/:id/publish` - Publish content

### Assets
- `POST /api/upload` - Upload file
- `GET /api/assets` - List assets
- `GET /api/assets/:id` - Get asset details
- `DELETE /api/assets/:id` - Delete asset

### Brand Intelligence
- `GET /api/brand-intelligence/:brandId` - Get insights
- `POST /api/brand-intelligence/feedback` - Submit feedback

### Webhooks
- `POST /api/webhooks` - Register webhook
- `POST /api/webhooks/events` - Webhook events
- `GET /api/webhooks/:id` - Get webhook

### Audit & Approvals
- `GET /api/audit` - List audit logs
- `POST /api/approvals/bulk` - Bulk operations

## Database

### Connection Setup

```typescript
// server/lib/dbClient.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
```

### Row-Level Security (RLS)

All tables use RLS policies for multi-tenant isolation:

```sql
CREATE POLICY "Users can only access their own brands"
ON brands FOR SELECT
USING (auth.uid() = user_id);
```

### Database Operations

Common patterns:

```typescript
// Read with filtering
const { data, error } = await supabase
  .from('content')
  .select('*')
  .eq('brand_id', brandId)
  .order('created_at', { ascending: false });

// Create
const { data, error } = await supabase
  .from('content')
  .insert({ title, body, brand_id: brandId })
  .select()
  .single();

// Update
const { data, error } = await supabase
  .from('content')
  .update({ status: 'published' })
  .eq('id', contentId)
  .select()
  .single();

// Delete
const { error } = await supabase
  .from('content')
  .delete()
  .eq('id', contentId);
```

## Business Logic

### Services

Each service handles specific domain logic:

```typescript
// server/lib/publishing-db-service.ts
export class PublishingService {
  async publishContent(contentId: string, platform: string) {
    // Publishing logic
  }

  async getPublishingQueue() {
    // Queue management logic
  }
}
```

### Middleware

Express middleware for common tasks:

```typescript
// Authentication middleware
app.use('/api/protected', verifyAuth);

// Logging middleware
app.use(requestLogger);

// Error handling
app.use(errorHandler);
```

## AI Integration

### Claude API

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Generate content...' }],
});
```

### OpenAI API

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Generate content...' }],
});
```

## Email Service

### SendGrid Integration

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: 'user@example.com',
  from: process.env.EMAIL_FROM_ADDRESS,
  subject: 'Approval Needed',
  html: approvalEmailHtml,
});
```

## Webhooks

### Webhook Processing

```typescript
// server/lib/webhook-handler.ts
export async function handleWebhookEvent(event: WebhookEvent) {
  // Process webhook
  // Retry on failure
  // Log results
}
```

### Event Types
- `content.created`
- `content.approved`
- `content.published`
- `asset.uploaded`
- And more...

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

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('GET /api/brands', () => {
  it('should return user brands', async () => {
    const response = await request(app)
      .get('/api/brands')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

## Logging & Monitoring

### Structured Logging

```typescript
console.log('[Info]', 'User logged in', {
  userId: user.id,
  timestamp: new Date().toISOString(),
});

console.error('[Error]', 'Database error', {
  error: err.message,
  query: 'SELECT ...',
});
```

### Performance Monitoring

- Response time tracking
- Database query monitoring
- API rate limiting
- Error rate monitoring

## Security

### Input Validation

```typescript
// Validate request body
if (!email || !password) {
  return res.status(400).json({ error: 'Missing fields' });
}

// Escape output
const safe = escapeHtml(userInput);
```

### Authentication

```typescript
// Verify JWT token
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Authorization

```typescript
// Check user permissions with RLS
// Queries respect user_id from JWT automatically
const { data } = await supabase
  .from('brands')
  .select('*')
  .eq('id', brandId);
  // RLS ensures only user's brands are returned
```

## Performance Tips

- Use database indexes for frequently queried columns
- Cache responses where appropriate
- Implement pagination for large result sets
- Use connection pooling
- Monitor slow queries
- Optimize N+1 queries with joins

## Debugging

### Console Output
```bash
# View logs
tail -f server.log

# Filter by level
grep ERROR server.log
```

### Database Debugging
```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM content WHERE brand_id = '...';

-- View table stats
SELECT * FROM pg_stat_user_tables;
```

## Deployment

### Build for Production

```bash
pnpm build
NODE_ENV=production node dist/server/index.js
```

### Environment Setup

1. Set production environment variables
2. Configure Supabase for production
3. Set up database backups
4. Configure monitoring with Sentry
5. Enable CORS for frontend domain

## Troubleshooting

### Database Connection Issues
- Verify Supabase URL and keys
- Check database is accessible
- Review RLS policies
- Check network access rules

### Authentication Failures
- Verify JWT token format
- Check token expiration
- Confirm Supabase setup
- Review RLS policies

### AI API Failures
- Verify API keys
- Check rate limits
- Review request format
- Check error messages

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Claude API Documentation](https://docs.anthropic.com/)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

For more information, see [Development Guide](../docs/development/README.md).
