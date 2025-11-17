# Integration Guide — Connecting Design to Backend

This guide walks you through connecting the design-only components to your Aligned-20AI backend logic.

---

## Table of Contents
1. [Step 1: Import Tokens & Tailwind Config](#step-1-import-tokens--tailwind-config)
2. [Step 2: Copy Components to Project](#step-2-copy-components-to-project)
3. [Step 3: Render a Component](#step-3-render-a-component)
4. [Step 4: Connect to Backend Data](#step-4-connect-to-backend-data)
5. [Step 5: Wire Up Navigation & Auth](#step-5-wire-up-navigation--auth)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

---

## Step 1: Import Tokens & Tailwind Config

### 1a. Copy CSS Variables
```bash
cp design-import/styles/tokens.css client/styles/design-tokens.css
```

Add to `client/global.css`:
```css
@import "./styles/design-tokens.css";
@import "./styles/animations.css";
```

### 1b. Merge Tailwind Config

**Current**: `tailwind.config.ts`
**Source**: `design-import/tailwind/tailwind.config.fragment.ts`

Copy the `extend` section into your existing config:
```typescript
// tailwind.config.ts
export default {
  content: ["./client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // ... your existing extends ...
      animation: {
        'gradient-shift': 'gradient-shift 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-soft': 'float-soft 4s ease-in-out infinite',
        'slide-up': 'slide-up 0.6s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.7s ease-out forwards',
      },
      keyframes: {
        // ... copy from design-import/tailwind/...
      }
    }
  }
};
```

**Verify**: Run `pnpm build` — no CSS errors should appear.

---

## Step 2: Copy Components to Project

### Option A: Copy All (Recommended for first integration)
```bash
# Copy all components
cp -r design-import/components/landing client/components/
cp -r design-import/components/dashboard client/components/
cp -r design-import/components/layout client/components/
```

### Option B: Selective Copy (One component at a time)
```bash
# Copy just HeroSection
cp design-import/components/landing/HeroSection.tsx client/components/landing/
```

**Verify**: Run TypeScript check:
```bash
pnpm typecheck
```

No errors should appear (you may see warnings about unused mock data — expected).

---

## Step 3: Render a Component

### 3a. Simple Render (No Backend)
```tsx
// client/pages/Index.tsx
import { HeroSection } from "@/components/landing/HeroSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
    </main>
  );
}
```

**Result**: HeroSection renders with internal mock data (static "You built your agency..." text, mock dashboard preview, etc.)

### 3b. Render Multiple Sections
```tsx
// client/pages/Index.tsx
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { PromiseSection } from "@/components/landing/PromiseSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ProblemSection />
      <PromiseSection />
    </main>
  );
}
```

**Result**: Three sections rendered back-to-back with mock content, transitions, and animations.

---

## Step 4: Connect to Backend Data

Replace mock data with real API calls. Here are common patterns:

### 4a. Dashboard Metrics (GoodNews Component)
**File**: `client/pages/Dashboard.tsx`

**Before** (mock):
```tsx
import { GoodNews } from "@/components/dashboard/GoodNews";

export default function Dashboard() {
  return <GoodNews />;
}
```

The component renders with hard-coded mock metrics:
```
"Best Performer" → "New Feature Launch" (245 engagements)
```

**After** (connected to backend):
```tsx
import { GoodNews } from "@/components/dashboard/GoodNews";
import { useEffect, useState } from "react";

interface MetricsData {
  bestPerformer: { title: string; count: number };
  trending: { title: string; count: number };
  milestone: { title: string; description: string };
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  useEffect(() => {
    // Fetch real metrics from your API
    fetch("/api/dashboard/metrics")
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error("Failed to load metrics:", err));
  }, []);

  if (!metrics) return <div>Loading...</div>;

  // Pass to component OR update component to accept props
  return <GoodNews data={metrics} />;
}
```

**Component Update** (optional):
If `GoodNews` doesn't accept `data` prop, you'll need to:
1. Add props to component signature
2. Use props instead of hardcoded data
3. Fall back to mock if props not provided

**Example**:
```tsx
// In GoodNews.tsx
interface GoodNewsProps {
  data?: MetricsData;
}

export function GoodNews({ data }: GoodNewsProps) {
  const metrics = data || MOCK_METRICS; // Fall back to mock

  return (
    // ... render using metrics ...
  );
}
```

### 4b. Testimonials Section (TestimonialsSection Component)

**Before** (mock):
```tsx
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";

export default function Home() {
  return <TestimonialsSection />;
}
```

Renders 3 hard-coded testimonials (Little Fox Creative, Indigo & Co, 806 Marketing).

**After** (connected to backend):
```tsx
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { useEffect, useState } from "react";

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  logoUrl?: string;
}

export default function Home() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    fetch("/api/testimonials")
      .then(res => res.json())
      .then(data => setTestimonials(data.testimonials))
      .catch(err => console.error("Failed to load testimonials:", err));
  }, []);

  return <TestimonialsSection testimonials={testimonials} />;
}
```

### 4c. Blog Posts (BlogCard Component)

**Before** (mock):
```tsx
import { BlogCard } from "@/components/landing/BlogCard";

export default function Blog() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <BlogCard />
      <BlogCard />
      <BlogCard />
    </div>
  );
}
```

Renders 3 hard-coded blog cards with mock thumbnail, title, excerpt.

**After** (connected to backend):
```tsx
import { BlogCard } from "@/components/landing/BlogCard";
import { useEffect, useState } from "react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  slug: string;
  thumbnail?: string;
  readTime?: number;
  tags?: string[];
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    fetch("/api/blog/posts")
      .then(res => res.json())
      .then(data => setPosts(data.posts))
      .catch(err => console.error("Failed to load posts:", err));
  }, []);

  return (
    <div className="grid grid-cols-3 gap-6">
      {posts.map(post => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

---

## Step 5: Wire Up Navigation & Auth

### 5a. CTA Button Clicks

**Issue**: Components have placeholder CTAs that don't route anywhere.

**Before** (design-only):
```tsx
// HeroSection.tsx (as exported)
<button onClick={() => {
  // TODO: Wire to navigation handler
  console.log("CTA clicked");
}}>
  Get Aligned →
</button>
```

**After** (integrated):
```tsx
import { HeroSection } from "@/components/landing/HeroSection";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const handleCTA = () => {
    navigate("/signup");
  };

  return <HeroSection onCTA={handleCTA} />;
}
```

### 5b. Authentication-Dependent Content

**Issue**: Components might show different content based on auth state.

**Before** (design-only):
```tsx
// All users see the same content (signup CTA)
<button>Sign Up →</button>
```

**After** (integrated):
```tsx
import { useAuth } from "@/contexts/AuthContext";

export function HeroSection() {
  const { user } = useAuth();

  return (
    <button onClick={() => {
      if (user) {
        navigate("/dashboard");
      } else {
        navigate("/signup");
      }
    }}>
      {user ? "Go to Dashboard" : "Get Started"} →
    </button>
  );
}
```

### 5c. Analytics Tracking

**Issue**: Components don't emit analytics events.

**After** (integrated):
```tsx
import { analytics } from "@/lib/analytics";

export function HeroSection() {
  const handleCTA = () => {
    analytics.track("cta_click", {
      source: "hero",
      cta_text: "Get Aligned →",
      auth_state: user ? "authed" : "anon",
    });
    navigate("/signup");
  };

  return <button onClick={handleCTA}>Get Aligned →</button>;
}
```

---

## Common Patterns

### Pattern 1: Render & Forget (Static Content)
Use when content doesn't change:
```tsx
import { ZiaQuotePanel } from "@/components/landing/ZiaQuotePanel";

export default function Home() {
  return <ZiaQuotePanel />;
}
```

**Applicable to**: ZiaQuotePanel, FinalCTASection, PromiseSection, etc.

### Pattern 2: Fetch Once, Render Once (Data List)
Use for one-time data loads (testimonials, blog posts):
```tsx
const [data, setData] = useState([]);

useEffect(() => {
  fetch("/api/...").then(r => r.json()).then(setData);
}, []);

return <Component data={data} />;
```

**Applicable to**: TestimonialsSection, BlogCard, PricingCard, etc.

### Pattern 3: Real-Time Updates (Dashboard)
Use for metrics that update frequently:
```tsx
const [metrics, setMetrics] = useState([]);

useEffect(() => {
  // Fetch on mount
  fetch("/api/metrics").then(...).then(setMetrics);

  // Poll every 30 seconds
  const interval = setInterval(() => {
    fetch("/api/metrics").then(...).then(setMetrics);
  }, 30000);

  return () => clearInterval(interval);
}, []);

return <GoodNews data={metrics} />;
```

**Applicable to**: GoodNews, CalendarAccordion, InsightsFeed, AnalyticsPanel

### Pattern 4: User-Triggered Actions (Forms, CTAs)
Use for buttons that trigger navigation or submission:
```tsx
const handleSubmit = () => {
  analytics.track("form_submit", { form: "contact" });
  navigate("/thank-you");
};

return <button onClick={handleSubmit}>Submit</button>;
```

**Applicable to**: All CTA buttons, form submissions

---

## Data Mapping Reference

### HeroSection
```typescript
interface HeroData {
  eyebrow?: string;          // "Built for agencies..."
  headline: string;          // "You built your agency..."
  subheadline: string;       // "Aligned handles your content..."
  primaryCTA: { label: string; href?: string };
  secondaryCTA?: { label: string; href?: string };
  heroVisual?: string;       // Image URL
  features?: string[];       // ["Brand Management", ...]
}
```

### GoodNews
```typescript
interface GoodNewsData {
  cards: Array<{
    label: string;           // "Best Performer"
    value: string;           // "243 engagements"
    description: string;
  }>;
  timestamp?: string;        // "Updated 2 hours ago"
  ctaText?: string;          // "View Full Report"
}
```

### TestimonialsSection
```typescript
interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  logo?: string;             // Company logo URL
  avatar?: string;           // Headshot URL
}
```

### CalendarAccordion
```typescript
interface ScheduleItem {
  date: string;              // "2024-11-11"
  day: string;               // "Monday"
  posts: Array<{
    id: string;
    title: string;
    platform: string;        // "LinkedIn"
    status: "draft" | "reviewing" | "approved" | "scheduled";
    preview?: string;
  }>;
}
```

---

## Troubleshooting

### Issue: Component renders but looks empty
**Cause**: Mock data paths don't exist
**Fix**: Check if `src/assets/` images exist, or use placeholder images

### Issue: TypeScript errors about missing props
**Cause**: Component expects props but component doesn't define them
**Fix**: Add prop interface to component and use default mock data as fallback

### Issue: Styles look wrong (colors, spacing)
**Cause**: CSS variables not loaded, or Tailwind config not merged
**Fix**:
1. Verify `design-tokens.css` is imported in `global.css`
2. Verify Tailwind `extend.animation` section merged
3. Run `pnpm run build` to regenerate Tailwind styles

### Issue: Animations don't play
**Cause**: Keyframes not defined in Tailwind config
**Fix**: Verify all keyframe definitions copied from `tailwind.config.fragment.ts`

### Issue: Component shows "TODO" comment instead of content
**Cause**: Placeholder code not replaced with real logic
**Fix**: Search component for `// TODO:` and implement accordingly

### Issue: Links don't navigate
**Cause**: `onCTA` prop not wired or navigation not imported
**Fix**: Add `onCTA` handler to component (see Step 5a above)

---

## Production Readiness Checklist

- [ ] All design tokens imported (colors, spacing, animations)
- [ ] Tailwind config merged
- [ ] Components render without console errors
- [ ] Mock data replaced with real API calls (critical paths)
- [ ] CTA buttons wired to navigation
- [ ] Auth state integrated (if needed)
- [ ] Analytics events firing
- [ ] Images/assets loading (not showing 404s)
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Form submissions working
- [ ] Error states handled (loading, failures)
- [ ] Accessibility checked (keyboard nav, ARIA labels, contrast)

---

## Next Steps

1. **Pick one component** (e.g., HeroSection)
2. **Copy it** to your project
3. **Render it** on a page
4. **Replace one piece** of mock data (e.g., headline text)
5. **Test in browser**
6. **Repeat** for next component

For questions about specific components, see **COMPONENTS.md**.
For design tokens/styling questions, see **DESIGN_SYSTEM.md**.
