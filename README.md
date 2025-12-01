# POSTD

**POSTD** is a brand-driven AI content platform that helps agencies, businesses, and creators manage multi-brand content creation, scheduling, and publishing across social media platforms.

> **Note**: POSTD was formerly known as Aligned-20AI. All current documentation refers to POSTD as the product name.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** package manager (preferred) or npm
- **Supabase account** (for database access)
- **API Keys** for OpenAI, Anthropic Claude, and social platform integrations

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Aligned-20ai.posted

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)

# Validate environment setup
pnpm run validate:env

# Verify Supabase connection
pnpm run verify:supabase

# Start development servers
pnpm dev
```

The application will be available at `http://localhost:8080`.

---

## 📚 Documentation

### For New Developers

**Start here** to understand POSTD:

1. **[Product Definition & Guardrails](docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md)** - Product purpose, system pillars, and scope boundaries
2. **[Codebase Architecture Overview](CODEBASE_ARCHITECTURE_OVERVIEW.md)** - High-level architecture and system structure
3. **[Tech Stack Guide](TECH_STACK_GUIDE.md)** - Complete technology stack reference
4. **[Setup Guide](docs/SETUP_GUIDE.md)** - Detailed development setup instructions
5. **[API Contract](POSTD_API_CONTRACT.md)** - Complete API reference documentation

### Documentation Index

See **[DOCS_INDEX.md](DOCS_INDEX.md)** for a complete map of all documentation files organized by category.

### Key Documentation Categories

- **Architecture**: System design, database schema, routing structure
- **Features**: Brand onboarding, Creative Studio, content generation
- **API**: Endpoints, authentication, integrations
- **Development**: Setup guides, coding standards, deployment
- **Security**: Authentication, encryption, data governance

---

## 🏗️ Project Structure

```
Aligned-20ai.posted/
├── client/              # React frontend (Vite + TypeScript)
│   ├── pages/          # Route components
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # Global state management
│   └── lib/            # Utilities and helpers
├── server/             # Express backend
│   ├── routes/         # API route handlers
│   ├── lib/            # Services and utilities
│   ├── connectors/     # Platform adapters (Meta, LinkedIn, etc.)
│   └── queue/          # Job queue processing
├── shared/             # Types shared between client and server
├── supabase/           # Database migrations and config
├── docs/               # Documentation
└── public/             # Static assets
```

See **[CODEBASE_ARCHITECTURE_OVERVIEW.md](CODEBASE_ARCHITECTURE_OVERVIEW.md)** for detailed structure documentation.

---

## 🛠️ Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server (client + server on port 8080) |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run test suite |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | Lint code |
| `pnpm format.fix` | Auto-fix code formatting |
| `pnpm validate:env` | Validate environment variables |
| `pnpm verify:supabase` | Test Supabase connection |

### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** following the [Contributing Guidelines](CONTRIBUTING.md)

3. **Test locally**:
   ```bash
   pnpm test
   pnpm typecheck
   pnpm lint
   ```

4. **Commit changes** with descriptive commit messages

5. **Open a Pull Request** for review

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for detailed contribution guidelines.

---

## 🔑 Environment Variables

Required environment variables (see `.env.example` for template):

### Core Configuration

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase public/anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service role key (server only)

### AI Services

- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `OPENAI_API_KEY` - OpenAI API key

### Infrastructure

- `REDIS_HOST` - Redis server hostname
- `REDIS_PORT` - Redis server port
- `TOKEN_VAULT_MASTER_SECRET` - Master secret for token encryption

### Optional

- `AWS_KMS_KEY_ID` - AWS KMS key ID (optional, for enhanced security)
- `DATADOG_API_KEY` - Datadog API key (for monitoring)
- `NODE_ENV` - Environment (`development` | `production`)
- `PORT` - Server port (default: 3000)

See **[TECH_STACK_GUIDE.md](TECH_STACK_GUIDE.md)** for complete environment variable reference.

---

## 🎯 Core Features

### Brand Management

- **Brand Intake**: Website crawler extracts brand identity (colors, logos, messaging)
- **Brand Guide Generator**: AI-powered brand guide creation from crawled content
- **Multi-Brand Workspaces**: Manage multiple brands within a single workspace

### Content Creation

- **Creative Studio**: Canvas-based design editor with templates and AI generation
- **Content Generation**: AI-powered copy and visual content aligned to brand guidelines
- **Brand Fidelity Score (BFS)**: Measures content alignment to brand guidelines

### Publishing & Scheduling

- **Multi-Platform Publishing**: Instagram, Facebook, LinkedIn, TikTok, Google Business, and more
- **Content Calendar**: Schedule and manage posts across platforms
- **Approval Workflows**: Client approval system with audit trails

### Analytics & Intelligence

- **Performance Analytics**: Track content performance across platforms
- **AI Advisor**: Actionable insights and recommendations
- **Brand Intelligence**: AI-powered brand analysis and insights

See **[docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md](docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md)** for complete feature documentation.

---

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

Tests use **Vitest** for unit tests and **Playwright** for end-to-end testing.

---

## 🚢 Deployment

### Production Build

```bash
pnpm build
```

This creates optimized production bundles:
- Frontend: `dist/spa/`
- Backend: `dist/server/`

### Deployment Platforms

- **Vercel** (recommended): See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- **Netlify**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

### Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security audit passed (`pnpm run security:check`)
- [ ] Type checking passed (`pnpm run typecheck`)
- [ ] Tests passing (`pnpm test`)
- [ ] Linting passed (`pnpm lint`)

See **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** and **[GO_LIVE_PLAYBOOK.md](GO_LIVE_PLAYBOOK.md)** for detailed deployment instructions.

---

## 🔒 Security

POSTD implements comprehensive security measures:

- **Authentication**: Supabase Auth with OAuth 2.0 flows
- **Token Encryption**: AES-256-GCM encryption for platform tokens
- **Row-Level Security (RLS)**: Database-level data isolation
- **Input Validation**: Zod schema validation on all inputs
- **Audit Logging**: Comprehensive audit trails for compliance

See **[SECURITY.md](SECURITY.md)** for complete security documentation.

---

## 📊 Tech Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS
- **React Router 6** - Client-side routing
- **Radix UI** - Accessible component library
- **React Query** - Server state management

### Backend

- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Supabase** - PostgreSQL database
- **Bull Queue** - Job queue with Redis
- **Socket.io** - Real-time communication

### AI & Integrations

- **Anthropic Claude** - AI content generation
- **OpenAI** - AI services
- **Platform Connectors** - Meta, LinkedIn, TikTok, Google Business, etc.

See **[TECH_STACK_GUIDE.md](TECH_STACK_GUIDE.md)** for complete technology stack documentation.

---

## 🤝 Contributing

We welcome contributions! Please read:

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[CODEBASE_ARCHITECTURE_OVERVIEW.md](CODEBASE_ARCHITECTURE_OVERVIEW.md)** - Architecture overview
- **[docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md](docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md)** - Product definition

---

## 📝 License

See [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Documentation**: See [DOCS_INDEX.md](DOCS_INDEX.md) for complete documentation index
- **Issues**: Report bugs and request features via GitHub Issues
- **Development Guide**: See [docs/development/README.md](docs/development/README.md)

---

## 📈 Project Status

**Status**: Active Development

**Last Updated**: 2025-01-20

**Version**: See [CHANGELOG.md](CHANGELOG.md)

---

## 🙏 Acknowledgments

Built with modern web technologies and best practices. See **[TECH_STACK_GUIDE.md](TECH_STACK_GUIDE.md)** for complete acknowledgments.

---

**Questions?** Check the [Documentation Index](DOCS_INDEX.md) or see [Setup Guide](docs/SETUP_GUIDE.md) for getting started.
