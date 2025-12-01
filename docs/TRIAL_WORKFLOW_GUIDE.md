# POSTD Trial Workflow Implementation Guide

> **Status:** ✅ Active – This is an active guide for POSTD trial workflow implementation.  
> **Last Updated:** 2025-01-20

## Overview

This document describes the complete 7-Day Guided Trial workflow implementation for POSTD, including frontend components, backend API, database schema, and integration examples.

---

## Features

### Trial User Experience

1. **7-Day Trial Period** - Users can test the platform for 7 days
2. **2 Test Posts** - Trial users can publish up to 2 live posts
3. **Full Feature Access** - Access to Creative Studio, content generation, approval workflows, and analytics
4. **Celebration on Publish** - Confetti animation and toast notification when publishing
5. **Trial Status Banner** - Always-visible banner showing trial status and post counter
6. **Upgrade Prompts** - Clear CTAs to upgrade when limit is reached

---

## File Structure

### Frontend Components

```
client/
├── pages/
│   └── Pricing.tsx                          # Main pricing page with hero, tiers, FAQ
├── components/
│   └── dashboard/
│       ├── TrialBanner.tsx                  # Trial status banner (dismissible)
│       ├── PostCounterPill.tsx              # Post usage counter pill
│       └── TrialDashboardIntegration.tsx    # Example integration
├── hooks/
│   ├── use-trial-status.ts                  # React Query hook for trial API
│   └── use-publish-celebration.ts           # Confetti + toast on publish
└── contexts/
    └── AuthContext.tsx                      # Updated with trial plan support
```

### Backend API

```
server/
├── routes/
│   └── trial.ts                             # Trial API endpoints
├── middleware/
│   └── trial.ts                             # Trial enforcement middleware
└── index.ts                                 # Register trial router
```

### Database

```
supabase/migrations/
└── 20250201_add_trial_support.sql          # Trial columns + indexes
```

---

## API Endpoints

### GET `/api/trial/status`

**Description:** Fetch current trial status for authenticated user

**Response:**

```json
{
  "success": true,
  "data": {
    "isTrial": true,
    "publishedCount": 1,
    "maxPosts": 2,
    "remainingPosts": 1,
    "daysRemaining": 5,
    "isExpired": false,
    "canPublish": true
  }
}
```

### POST `/api/trial/start`

**Description:** Initialize trial period (sets trial_started_at and trial_expires_at)

**Response:**

```json
{
  "success": true,
  "data": {
    "trialStartedAt": "2025-02-01T12:00:00Z",
    "trialExpiresAt": "2025-02-08T12:00:00Z",
    "daysRemaining": 7
  }
}
```

---

## Database Schema

### Users Table Updates

```sql
ALTER TABLE users
ADD COLUMN trial_published_count INT DEFAULT 0;

ALTER TABLE users
ADD COLUMN plan VARCHAR(50) DEFAULT 'trial';

ALTER TABLE users
ADD COLUMN trial_started_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE users
ADD COLUMN trial_expires_at TIMESTAMP WITH TIME ZONE;
```

**Columns:**

- `trial_published_count` - Number of posts published during trial (max 2)
- `plan` - User subscription tier: `trial`, `base`, or `agency`
- `trial_started_at` - Timestamp when trial began
- `trial_expires_at` - Timestamp when trial ends (7 days from start)

---

## Usage Examples

### 1. Display Trial Banner

```tsx
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { useAuth } from "@/contexts/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      {user?.plan === "trial" && (
        <TrialBanner
          publishedCount={user.trial_published_count || 0}
          maxPosts={2}
        />
      )}
      {/* Rest of dashboard */}
    </div>
  );
}
```

### 2. Show Post Counter

```tsx
import { PostCounterPill } from "@/components/dashboard/PostCounterPill";
import { useTrialStatus } from "@/hooks/use-trial-status";

function ContentEditor() {
  const { trialStatus } = useTrialStatus();

  if (!trialStatus?.isTrial) return null;

  return (
    <div className="flex items-center gap-4">
      <h2>Publish Content</h2>
      <PostCounterPill
        publishedCount={trialStatus.publishedCount}
        maxPosts={trialStatus.maxPosts}
      />
    </div>
  );
}
```

### 3. Publish with Celebration

```tsx
import { usePublishCelebration } from "@/hooks/use-publish-celebration";
import { useAuth } from "@/contexts/AuthContext";

function PublishButton() {
  const { celebrate } = usePublishCelebration();
  const { user } = useAuth();

  const handlePublish = async () => {
    // Make publish API call
    const response = await fetch("/api/posts/publish", {
      method: "POST",
      body: JSON.stringify({ postId: "123" }),
    });

    if (response.ok) {
      const isFirstPost = (user?.trial_published_count || 0) === 0;
      celebrate(isFirstPost);
    }
  };

  return <button onClick={handlePublish}>Publish</button>;
}
```

### 4. Enforce Trial Limits (Backend)

```typescript
import { checkTrialLimit } from "../middleware/trial";
import { Router } from "express";

const router = Router();

router.post("/api/posts/publish", checkTrialLimit, async (req, res) => {
  const user = req.user;

  // Publish post logic...

  // Increment trial count if trial user
  if (user.plan === "trial") {
    await incrementTrialCount(user.id, db);
  }

  res.json({ success: true });
});
```

---

## Pricing Page

### Route

- `/pricing` - Public pricing page accessible to everyone

### Sections

1. **Hero** - Headline, subheadline, 3 CTAs (Get Started, Book Demo, Start Trial)
2. **Pricing Tiers** - Base Plan ($199/mo) and Agency Tier ($99/mo for 5+)
3. **Add-Ons Table** - Onboarding Concierge, White-Label Portal
4. **FAQ Accordion** - 5 common questions
5. **Footer CTA** - Final conversion section

### CTA Flow

- **Get Started** → `/signup`
- **Start Trial** → `/signup?trial=7`
- **Book Demo** → `/contact`

---

## Design Tokens

All components follow the POSTD design system:

```css
/* Primary Colors */
--color-purple-600: #3d0fd6;
--color-purple-700: #7c3aed;
--color-indigo-600: #4f46e5;

/* Accent Colors */
--color-lime-400: #a3e635;
--color-lime-500: #84cc16;

/* Background */
--color-gray-50: #f9fafb;

/* Typography */
--font-family: "Inter", sans-serif;
```

---

## Testing Checklist

- [ ] Pricing page renders on `/pricing` route
- [ ] Hero section with 3 CTAs visible
- [ ] Pricing tier cards display correctly
- [ ] FAQ accordion expands/collapses
- [ ] Trial signup flow works (`/signup?trial=7`)
- [ ] Trial banner appears for trial users
- [ ] Post counter updates after publish
- [ ] Trial limit enforced (max 2 posts)
- [ ] Confetti fires on first publish
- [ ] Toast notification shows on publish
- [ ] Trial expiration after 7 days
- [ ] Upgrade prompt after limit reached
- [ ] Mobile responsive layout

---

## Next Steps

1. **Connect to Real Database** - Replace mock data with Supabase queries
2. **Add Payment Integration** - Stripe/Paddle for plan upgrades
3. **Email Notifications** - Trial start, trial ending soon, trial expired
4. **Analytics Tracking** - Track trial conversions, publish rates
5. **A/B Testing** - Test different pricing, trial limits, CTA copy

---

## Support

For questions or issues with the trial workflow, contact the development team or reference:

- `/docs/AGENT_REVALIDATION_REPORT.md` - Testing and validation
- `/docs/ARCHITECTURE.md` - System architecture
- `/API_DOCUMENTATION.md` - API reference
