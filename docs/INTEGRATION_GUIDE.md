# Design System Integration Guide

Step-by-step guide to integrating the POSTD design system into your development workflow.

## Quick Start (5 minutes)

### 1. Design Tokens & Animations Already Loaded ✅

The design system is already integrated into your project:

```jsx
// In client/App.tsx - automatically loaded
import "./styles/tokens.css";
import "./styles/animations.css";
```

CSS variables and animations are **automatically available** throughout your application.

### 2. Import Components

```jsx
// Landing components
import { HeroSection } from '@/components/landing/HeroSection';
import { PromiseSection } from '@/components/landing/PromiseSection';
import { FinalCTASection } from '@/components/landing/FinalCTASection';

// Dashboard components
import { GoodNews } from '@/components/dashboard/GoodNews';
import { Sparkline } from '@/components/dashboard/Sparkline';
```

### 3. Use in Your Pages

```jsx
export default function LandingPage() {
  const handleCTA = () => {
    navigate('/signup');
  };

  return (
    <main>
      <HeroSection onCTA={handleCTA} />
      <PromiseSection onCTA={handleCTA} />
      <FinalCTASection onCTA={handleCTA} />
    </main>
  );
}
```

That's it! 🎉

---

## Detailed Integration Steps

### Step 1: Verify Installation ✅

**Status:** Already done in commit `8e9e89c`

Files that were added/modified:

```
✓ client/styles/tokens.css       (250 lines - CSS variables)
✓ client/styles/animations.css   (529 lines - animations)
✓ client/App.tsx                 (imports added)
✓ tailwind.config.ts             (animations merged)
```

Verify by checking:

```bash
# Check files exist
ls -la client/styles/tokens.css
ls -la client/styles/animations.css

# Verify imports in App.tsx
grep -A 2 "import.*tokens.css" client/App.tsx

# Test build
npm run build:client
```

---

### Step 2: Build Components

**Status:** Existing components in `client/components/`

```
client/
├── components/
│   ├── landing/
│   │   ├── HeroSection.tsx
│   │   ├── ProblemSection.tsx
│   │   ├── InteractiveStoryFlow.tsx
│   │   ├── PromiseSection.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── WhatItFeelsLikeSection.tsx
│   │   ├── WhyTeamsLoveItSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── ZiaQuotePanel.tsx
│   │   ├── FinalCTASection.tsx
│   │   ├── DashboardVisual.tsx
│   │   ├── ProblemVisuals.tsx
│   │   ├── LiveDemoPreview.tsx
│   │   └── ZiaPersonality.tsx
│   └── dashboard/
│       ├── ZiaMascot.tsx
│       ├── GoodNews.tsx
│       ├── InsightsFeed.tsx
│       ├── Sparkline.tsx
│       ├── CalendarAccordion.tsx
│       └── AnalyticsPanel.tsx
└── styles/
    ├── tokens.css
    ├── animations.css
    └── global.css
```

All components are **already imported and ready to use**.

---

### Step 3: Use Design Tokens

CSS variables are available in three ways:

#### A. CSS Variables (Recommended)

```css
.my-element {
  color: var(--color-indigo-600);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  animation: var(--duration-base);
}
```

#### B. Tailwind Classes

```jsx
<div className="bg-indigo-600 p-8 rounded-lg shadow-lg">
  Content with design system styling
</div>
```

#### C. Inline Styles

```jsx
<div style={{
  color: 'var(--color-slate-900)',
  padding: 'var(--spacing-3)',
  marginBottom: 'var(--spacing-2)'
}}>
  Inline styled content
</div>
```

---

### Step 4: Use Animations

#### CSS Class Approach (Simple)

```jsx
<div className="animate-slide-up">
  Slides up on mount
</div>

<div className="animate-fade-in-up">
  Fades in while sliding up
</div>

<div className="animate-pulse-glow">
  Continuously pulses with glow
</div>
```

#### Tailwind Approach

```jsx
<button className="hover:animate-lift transition-all duration-300">
  Button that lifts on hover
</button>
```

#### Stagger Effect (Multiple Elements)

```jsx
{items.map((item, idx) => (
  <div
    key={idx}
    className={`animate-fade-in-up animate-stagger-${idx}`}
  >
    {item.name}
  </div>
))}
```

#### Dynamic Animation Duration

```jsx
<div
  style={{
    animation: 'slide-up 0.6s ease-out forwards',
    animationDelay: '200ms'
  }}
>
  Custom animation timing
</div>
```

---

### Step 5: Connect Data to Components

Components accept optional `data` props to override mock data.

#### Example: Dashboard Metrics

```jsx
export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    // Fetch data from API
    Promise.all([
      fetchDashboardMetrics(),
      fetchInsights()
    ]).then(([m, i]) => {
      setMetrics(m);
      setInsights(i);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Pass real data to components */}
      <GoodNews data={metrics} />
      <InsightsFeed insights={insights} />
      <CalendarAccordion schedule={schedule} />
      <AnalyticsPanel metrics={analyticsMetrics} />
    </div>
  );
}
```

---

### Step 6: Wire Up CTAs

Components with `.onCTA` prop:
- `HeroSection`
- `PromiseSection`
- `FinalCTASection`
- `WhatItFeelsLikeSection`

#### Pattern: Landing Page with Navigation

```jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { HeroSection } from '@/components/landing/HeroSection';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = (source: string) => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup', { state: { from: source } });
    }
  };

  return (
    <>
      <HeroSection onCTA={() => handleCTA('hero')} />
      <PromiseSection onCTA={() => handleCTA('promise')} />
      <FinalCTASection onCTA={() => handleCTA('final')} />
    </>
  );
}
```

---

### Step 7: Customize Components

### Option A: Tailwind Classes

```jsx
<GoodNews
  data={metrics}
  className="bg-gradient-to-r from-indigo-50 to-lime-50"
/>
```

### Option B: Wrapper Div

```jsx
<div className="p-8 rounded-lg bg-slate-100">
  <HeroSection onCTA={handleCTA} />
</div>
```

### Option C: CSS Variables

```jsx
<div style={{
  '--custom-color': 'var(--color-indigo-600)',
  '--custom-spacing': 'var(--spacing-6)'
} as React.CSSProperties}>
  <PromiseSection />
</div>
```

---

## Common Integration Patterns

### Pattern 1: Full Landing Page

```jsx
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { InteractiveStoryFlow } from '@/components/landing/InteractiveStoryFlow';
import { PromiseSection } from '@/components/landing/PromiseSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FinalCTASection } from '@/components/landing/FinalCTASection';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleCTA = () => {
    navigate('/signup');
  };

  return (
    <main className="min-h-screen">
      <HeroSection onCTA={handleCTA} />
      <ProblemSection />
      <InteractiveStoryFlow />
      <PromiseSection onCTA={handleCTA} />
      <HowItWorksSection />
      <TestimonialsSection />
      <FinalCTASection onCTA={handleCTA} />
    </main>
  );
}
```

### Pattern 2: Dashboard with Real Data

```jsx
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    metrics: null,
    insights: [],
    schedule: [],
    analytics: []
  });

  useEffect(() => {
    Promise.all([
      api.getDashboardMetrics(),
      api.getInsights(),
      api.getSchedule(),
      api.getAnalytics()
    ]).then(([metrics, insights, schedule, analytics]) => {
      setData({ metrics, insights, schedule, analytics });
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 p-8">
      <GoodNews data={data.metrics} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InsightsFeed insights={data.insights} />
        <CalendarAccordion schedule={data.schedule} />
        <AnalyticsPanel metrics={data.analytics} />
      </div>
    </div>
  );
}
```

### Pattern 3: Feature Cards with Animations

```jsx
const features = [
  { icon: '🎯', title: 'Target', desc: 'AI-powered targeting' },
  { icon: '📊', title: 'Analyze', desc: 'Real-time analytics' },
  { icon: '✨', title: 'Optimize', desc: 'Smart optimization' }
];

export default function FeaturesSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
      {features.map((feature, idx) => (
        <div
          key={idx}
          className={`
            animate-fade-in-up animate-stagger-${idx}
            p-6 rounded-lg glass-card
            transition-all duration-300 hover:animate-lift
          `}
        >
          <div className="text-4xl mb-4">{feature.icon}</div>
          <h3 className="text-indigo-900 font-bold mb-2">{feature.title}</h3>
          <p className="text-slate-600">{feature.desc}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Styling Guidelines

### Responsive Design

Use Tailwind breakpoints:

```jsx
<div className="
  grid
  grid-cols-1          // Mobile: 1 column
  md:grid-cols-2       // Tablet: 2 columns
  lg:grid-cols-3       // Desktop: 3 columns
  gap-4 md:gap-6
  p-4 md:p-8
">
  {/* Content */}
</div>
```

### Color Combinations

**Primary text + Indigo background:**
```jsx
<div className="bg-indigo-600 text-white p-8 rounded-lg">
  Light text on dark background
</div>
```

**Dark text + Light background:**
```jsx
<div className="bg-indigo-100 text-indigo-900 p-8 rounded-lg">
  Dark text on light background
</div>
```

**Lime accent on white:**
```jsx
<button className="bg-lime-400 text-slate-900 hover:bg-lime-500">
  Primary CTA button
</button>
```

### Glass Cards

```jsx
<div className="glass-card p-6 hover:shadow-xl transition-shadow">
  Glass-morphism card with hover effect
</div>
```

---

## Performance Optimization

### Code Splitting

Lazy load landing components:

```jsx
import { lazy, Suspense } from 'react';

const HeroSection = lazy(() =>
  import('@/components/landing/HeroSection')
);
const PromiseSection = lazy(() =>
  import('@/components/landing/PromiseSection')
);

export default function LandingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeroSection />
      <PromiseSection />
    </Suspense>
  );
}
```

### Image Optimization

For testimonial avatars and dashboard previews:

```jsx
import { Image as NextImage } from 'next/image';

// Use optimized images
<NextImage
  src="/avatars/jane.jpg"
  alt="Jane Smith"
  width={48}
  height={48}
/>
```

### Animation Performance

- ✅ Use `transform` and `opacity` (GPU-accelerated)
- ❌ Avoid animating `width`, `height`, `left`, `top`
- ✅ Use `will-change` for heavy animations
- ✓ Respect `prefers-reduced-motion`

---

## Troubleshooting

### Issue: Components Not Importing

**Error:** `Cannot find module '@/components/landing/HeroSection'`

**Solution:**
1. Verify `tsconfig.json` has `"@/*": ["./client/*"]`
2. Ensure component file exists at `client/components/landing/HeroSection.tsx`
3. Check import path capitalization (case-sensitive)

### Issue: Styles Not Applied

**Error:** CSS variables not working

**Solution:**
1. Verify `client/styles/tokens.css` is imported in `client/App.tsx`
2. Check browser DevTools to confirm CSS variables are in `:root`
3. Ensure component is inside `<App />` (where styles are loaded)

### Issue: Animations Not Running

**Error:** Elements not animating on mount

**Solution:**
1. Verify `animations.css` is imported
2. Add to component: `className="animate-fade-in-up"`
3. Check that animation class matches keyframe name
4. Inspect browser DevTools for animation details

---

## Documentation Reference

- **Design System Details:** [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
- **Component Props & Usage:** [COMPONENTS.md](COMPONENTS.md)
- **Architecture Overview:** [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Quick Command Reference

```bash
# Verify build
npm run build:client

# Start dev server
npm run dev

# Type check
npm run typecheck

# Run tests
npm run test
```

---

## Next Steps

1. ✅ **Verify setup** - Run `npm run build:client`
2. 📖 **Read COMPONENTS.md** - Learn about each component
3. 🎨 **Explore DESIGN_SYSTEM.md** - Understand colors, spacing, animations
4. 🚀 **Build your page** - Import components and wire up data
5. 📱 **Test responsive** - Check on mobile, tablet, desktop

---

## Support & Questions

For more information:
- See [COMPONENTS.md](COMPONENTS.md) for component API reference
- See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for design tokens
- Check existing pages for usage examples
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for design decisions

Happy building! 🚀
