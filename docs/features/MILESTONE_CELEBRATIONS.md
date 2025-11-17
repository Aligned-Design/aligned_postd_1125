# Milestone Celebrations System

## Overview

The Milestone Celebrations system provides delightful user feedback through confetti animations and toast notifications when users achieve key milestones in the platform.

## Features

- 🎉 **Confetti Animations**: Canvas-based confetti that respects `prefers-reduced-motion`
- 📱 **Toast Notifications**: Non-blocking celebration messages
- 🔒 **Idempotent**: Each milestone fires once per workspace
- ⚡ **Real-time**: WebSocket support for instant celebrations
- 📊 **Analytics**: Automatic tracking via PostHog

## Milestones

| Milestone Key         | Trigger Event                     | Animation |
| --------------------- | --------------------------------- | --------- |
| `onboarding_complete` | User finishes Brand Guide         | Burst     |
| `first_integration`   | First OAuth connection success    | Fire      |
| `first_approval`      | First content approved            | Fire      |
| `first_publish`       | First post published successfully | Burst     |
| `goal_met`            | Analytics goal achieved           | Fire      |
| `agency_scale_5`      | Workspace reaches 5 brands        | Burst     |
| `month_1_anniversary` | 30 days after signup              | Burst     |

## Architecture

### Client Side

```
client/
├── hooks/
│   ├── useConfetti.ts          # Canvas confetti animations
│   └── useMilestones.ts        # WebSocket + React Query
├── lib/
│   └── milestones.ts           # Milestone keys & copy
└── components/
    └── MilestoneCelebrator.tsx # Headless celebration logic
```

### Server Side

```
server/
├── lib/
│   ├── milestones.ts           # Core milestone CRUD
│   └── milestone-triggers.ts   # Helper functions
└── routes/
    └── milestones.ts           # API endpoints
```

### Database

```sql
milestones
├── id (uuid, primary key)
├── workspace_id (text)
├── key (text)
├── unlocked_at (timestamp)
├── acknowledged_at (timestamp, nullable)
├── created_at (timestamp)
└── updated_at (timestamp)

UNIQUE(workspace_id, key)
```

## Integration Guide

### 1. Trigger a Milestone

```typescript
import { triggerFirstPublish } from "@/server/lib/milestone-triggers";

// After successful publish
await publishContent(content);
await triggerFirstPublish(workspaceId); // Safe, idempotent
```

### 2. Available Triggers

```typescript
// In server code
import {
  triggerOnboardingComplete,
  triggerFirstIntegration,
  triggerFirstApproval,
  triggerFirstPublish,
  triggerGoalMet,
  triggerAgencyScale5,
  triggerMonth1Anniversary,
  checkAgencyScale, // Auto-checks brand count
} from "@/server/lib/milestone-triggers";
```

### 3. Add New Milestone

#### Step 1: Add to type

```typescript
// client/lib/milestones.ts
export type MilestoneKey = "existing_milestone" | "new_milestone"; // Add here
```

#### Step 2: Add copy

```typescript
// client/lib/milestones.ts
export const milestoneCopy: Record<MilestoneKey, {...}> = {
  // ...
  new_milestone: {
    title: 'New Achievement! 🎯',
    body: 'You did something awesome!',
  },
};
```

#### Step 3: Add trigger helper

```typescript
// server/lib/milestone-triggers.ts
export async function triggerNewMilestone(workspaceId: string) {
  try {
    await unlockMilestone(workspaceId, "new_milestone");
  } catch (err) {
    console.error("[Milestone] Failed to trigger new_milestone:", err);
  }
}
```

#### Step 4: Call trigger

```typescript
// In your route/handler
import { triggerNewMilestone } from "@/server/lib/milestone-triggers";

await performAction();
await triggerNewMilestone(workspaceId);
```

## API Endpoints

### GET /api/milestones

Fetch all milestones for current workspace

**Response:**

```json
[
  {
    "id": "uuid",
    "workspace_id": "ws_123",
    "key": "first_publish",
    "unlocked_at": "2025-01-20T12:00:00Z",
    "acknowledged_at": "2025-01-20T12:00:05Z"
  }
]
```

### POST /api/milestones/:key/ack

Acknowledge a milestone (user has seen it)

**Response:**

```json
{ "success": true }
```

## Configuration

### Environment Variables

```bash
# Optional: WebSocket URL for real-time updates
VITE_WS_URL=wss://your-app.com/ws

# Feature flag (optional)
VITE_FEATURE_CONFETTI=true
```

### Rate Limiting

- Maximum 2 celebrations per 60 seconds
- Prevents overwhelming users with animations
- Configurable in `MilestoneCelebrator.tsx`

## Accessibility

- ✅ Respects `prefers-reduced-motion`
- ✅ Toast notifications are screen-reader friendly
- ✅ Non-blocking UI
- ✅ Dismissible toasts
- ✅ No sound effects

## Testing

### Manual Testing

```typescript
// In browser console
fetch("/api/milestones/onboarding_complete/ack", { method: "POST" });
```

### Integration Test Example

```typescript
import { triggerFirstPublish } from "@/server/lib/milestone-triggers";

test("first publish unlocks milestone", async () => {
  const workspaceId = "test-workspace";

  await triggerFirstPublish(workspaceId);

  const milestones = await getMilestones(workspaceId);
  expect(milestones).toContainEqual(
    expect.objectContaining({ key: "first_publish" }),
  );
});
```

## Roadmap

- [ ] WebSocket implementation for real-time updates
- [ ] Milestone badges/achievements page
- [ ] Social sharing for milestones
- [ ] Custom confetti colors per brand
- [ ] Milestone progress tracking (e.g., "3/5 posts published")
- [ ] Milestone history export

## Troubleshooting

### Confetti not showing

- Check browser console for `prefers-reduced-motion`
- Verify `canvas-confetti` is installed
- Check rate limiting (max 2 per minute)

### Milestone fires multiple times

- Verify database unique constraint is active
- Check `acknowledged_at` is being set
- Ensure idempotent unlock logic

### WebSocket not connecting

- Set `VITE_WS_URL` environment variable
- Falls back to polling if not configured
- Check server WebSocket endpoint

## Credits

Built with:

- [canvas-confetti](https://github.com/catdad/canvas-confetti) - Confetti animations
- React Query - Data synchronization
- Supabase - Database & real-time

---

**Last Updated:** January 2025
