# AI Agents Health & Onboarding System

**Status**: ✅ **IMPLEMENTED**

This document describes the unified agent health monitoring and automatic onboarding workflow system.

---

## 📋 Overview

The system provides:
1. **Unified Health Endpoint** - Monitor all AI agents in one place
2. **Automatic Onboarding** - Triggers when new brands/workspaces are created
3. **Manual Trigger** - "Run Setup" button for re-running onboarding
4. **Structured Logging** - All agent calls are logged with context

---

## 🔍 Agent Registry

All agents are cataloged in `server/lib/agent-registry.ts`:

```typescript
{
  doc: {
    id: "doc",
    name: "Doc Agent (Copywriter)",
    route: "/api/ai/doc",
    worker: "ai-generation",
    dependencies: { envVars: [...], services: [...] }
  },
  design: { ... },
  advisor: { ... },
  orchestrator: { ... },
  crawler: { ... }
}
```

---

## 🏥 Health Endpoint

### `GET /api/agents/health`

**No authentication required** (for monitoring tools)

**Response:**
```json
{
  "overall": "ok" | "degraded" | "error",
  "timestamp": "2025-01-27T...",
  "agents": {
    "doc": {
      "status": "ok",
      "message": "Doc Agent (Copywriter) is operational",
      "dependencies": {
        "envVars": {
          "ANTHROPIC_API_KEY": true,
          "OPENAI_API_KEY": true
        },
        "services": {
          "supabase": true,
          "brand-guide": true
        }
      },
      "lastChecked": "2025-01-27T..."
    },
    "design": { ... },
    "advisor": { ... },
    "orchestrator": { ... },
    "crawler": { ... }
  }
}
```

**Status Codes:**
- `200` - All agents OK or degraded (some dependencies missing)
- `503` - One or more agents in error state

**Usage:**
```bash
# Local
curl http://localhost:8080/api/agents/health

# Production
curl https://postd-delta.vercel.app/api/agents/health
```

---

## 🚀 Automatic Onboarding

### When It Triggers

Onboarding automatically runs when:
1. **Brand is created via backend API** (`POST /api/brands`)
2. **Brand has a `website_url`** (required for crawler step)
3. **`autoRunOnboarding` is true** (default)

### Onboarding Steps

1. **Website Crawler** - Scrapes brand website for colors, tone, content
2. **Brand Guide Generation** - Uses Doc + Design agents to create brand guide
3. **Content Strategy** - Advisor agent generates initial strategy
4. **Sample Content** - Generates sample posts using orchestrator

### Brand Creation Endpoint

**`POST /api/brands`**

**Auth**: Required (`content:manage` scope)

**Body:**
```json
{
  "name": "My Brand",
  "slug": "my-brand",
  "website_url": "https://example.com",
  "industry": "Technology",
  "description": "Brand description",
  "tenant_id": "workspace-uuid",
  "autoRunOnboarding": true
}
```

**Response:**
```json
{
  "success": true,
  "brand": { ... },
  "onboardingTriggered": true,
  "message": "Brand created successfully"
}
```

**Note**: Onboarding runs asynchronously - response returns immediately.

---

## 🔧 Manual Onboarding Trigger

### `POST /api/orchestration/workspace/:workspaceId/run-agents`

**Auth**: Required (`ai:generate` scope)

**Body:**
```json
{
  "brandId": "brand-uuid",
  "websiteUrl": "https://example.com",
  "regenerate": false
}
```

**Response:**
```json
{
  "success": true,
  "workspaceId": "workspace-uuid",
  "status": "started",
  "steps": [
    {
      "id": "crawler",
      "name": "Website Crawler",
      "status": "in_progress"
    },
    {
      "id": "brand-guide",
      "name": "Brand Guide Generation",
      "status": "pending"
    },
    {
      "id": "strategy",
      "name": "Content Strategy",
      "status": "pending"
    },
    {
      "id": "sample-content",
      "name": "Sample Content",
      "status": "pending"
    }
  ],
  "message": "Onboarding workflow started"
}
```

**Alternative Endpoint:**

**`POST /api/orchestration/onboarding/run-all`**

Same functionality, different path. Use this if you prefer the `/onboarding/` prefix.

---

## 📊 Onboarding Workflow Details

### Step 1: Website Crawler

- **Worker**: `server/workers/brand-crawler.ts`
- **What it does**: Crawls website, extracts colors, text, images
- **Output**: Updates `brands.brand_kit` with crawled data
- **Can fail**: Yes (falls back to empty brand kit)

### Step 2: Brand Guide Generation

- **Agents**: Doc Agent + Design Agent
- **What it does**: Uses orchestrator to generate brand voice and visual identity
- **Output**: Updates `brands.brand_kit` with generated guide
- **Can fail**: Yes (continues with partial data)

### Step 3: Content Strategy

- **Agent**: Advisor Agent
- **What it does**: Generates initial content strategy and positioning
- **Output**: Creates strategy brief in collaboration storage
- **Can fail**: Yes (continues without strategy)

### Step 4: Sample Content

- **Agent**: Full Pipeline Orchestrator
- **What it does**: Generates sample social media posts
- **Output**: Creates content package
- **Can fail**: Yes (continues without samples)

### Completion

When all steps complete (or fail gracefully), the brand is marked with `onboarding_completed_at` timestamp.

---

## 📝 Logging

All agent calls and onboarding steps are logged with structured data:

```typescript
logger.info("Onboarding workflow started", {
  requestId: "onboarding-123",
  brandId: "brand-uuid",
  workspaceId: "workspace-uuid",
  websiteUrl: "https://example.com"
});
```

**Log Fields:**
- `requestId` - Unique identifier for the request
- `brandId` - Brand being onboarded
- `workspaceId` - Workspace/tenant ID
- `duration` - Time taken in milliseconds
- `status` - Success/failure status
- `errors` - Array of any errors encountered

---

## ✅ Verification

### Test Health Endpoint

```bash
# Local
curl http://localhost:8080/api/agents/health | jq

# Production
curl https://postd-delta.vercel.app/api/agents/health | jq
```

**Expected**: All agents show `"status": "ok"` when deployed.

### Test Brand Creation

```bash
curl -X POST http://localhost:8080/api/brands \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Brand",
    "website_url": "https://example.com",
    "tenant_id": "workspace-uuid"
  }'
```

**Expected**: Brand created, onboarding triggered (check logs).

### Test Manual Trigger

```bash
curl -X POST http://localhost:8080/api/orchestration/workspace/workspace-uuid/run-agents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "brand-uuid",
    "websiteUrl": "https://example.com"
  }'
```

**Expected**: Onboarding workflow starts, returns step statuses.

---

## 🔗 Frontend Integration

### "Run Setup" Button

```typescript
const handleRunSetup = async () => {
  const response = await fetch(
    `/api/orchestration/workspace/${workspaceId}/run-agents`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        brandId: currentBrand.id,
        websiteUrl: currentBrand.website_url,
        regenerate: false,
      }),
    }
  );

  const data = await response.json();
  // Show status: data.steps
};
```

### Check Onboarding Status

```typescript
// Check if onboarding completed
const { data: brand } = await supabase
  .from("brands")
  .select("onboarding_completed_at")
  .eq("id", brandId)
  .single();

const isOnboarded = !!brand?.onboarding_completed_at;
```

---

## 🐛 Troubleshooting

### Health Check Shows "error"

1. Check environment variables are set
2. Verify Supabase connection
3. Check agent-specific logs

### Onboarding Not Triggering

1. Verify `website_url` is provided
2. Check `autoRunOnboarding` is not `false`
3. Review server logs for errors

### Onboarding Steps Failing

1. Check individual step logs
2. Verify brand has access to required services
3. Check AI provider API keys are valid

---

## 📚 Related Files

- `server/lib/agent-registry.ts` - Agent catalog
- `server/routes/agents-health.ts` - Health endpoint
- `server/lib/onboarding-orchestrator.ts` - Onboarding workflow
- `server/routes/orchestration.ts` - Manual trigger endpoints
- `server/routes/brands.ts` - Brand creation with auto-onboarding

---

**Last Updated**: 2025-01-27

