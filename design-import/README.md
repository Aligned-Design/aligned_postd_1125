# Aligned-20AI Design Import Package

## Overview

This package contains **design-only** components, tokens, and styles extracted from the Builder.io design specification for the Aligned-20AI marketing and product suite.

### What's Included ✅
- **20 React Components** (TSX) - All landing, dashboard, and auth page components
- **Design Tokens** - CSS variables, Tailwind configuration fragments
- **Asset Manifest** - SVGs, icons, and image placeholders
- **Design System Documentation** - Color palette, typography, spacing, animations
- **Integration Guide** - Step-by-step instructions to connect to your backend

### What's NOT Included ❌
- Backend logic, API calls, or server code
- Authentication hooks or state management
- Analytics tracking or navigation handlers
- Environment variables or secrets
- Tests or CI configuration
- Generated builds or node_modules

---

## Package Structure

```
design-import/
├── README.md (this file)
├── components/
│   ├── landing/
│   │   ├── HeroSection.tsx
│   │   ├── ProblemSection.tsx
│   │   ├── PromiseSection.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── WhatItFeelsLikeSection.tsx
│   │   ├── WhyTeamsLoveItSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── ZiaQuotePanel.tsx
│   │   ├── FinalCTASection.tsx
│   │   ├── DashboardVisual.tsx
│   │   ├── ProblemVisuals.tsx
│   │   ├── InteractiveStoryFlow.tsx
│   │   └── LiveDemoPreview.tsx
│   ├── dashboard/
│   │   ├── ZiaMascot.tsx
│   │   ├── GoodNews.tsx
│   │   ├── InsightsFeed.tsx
│   │   ├── Sparkline.tsx
│   │   ├── CalendarAccordion.tsx
│   │   └── AnalyticsPanel.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
├── styles/
│   ├── tokens.css (CSS variables for colors, spacing, animations)
│   ├── animations.css (keyframe definitions)
│   └── reset.css (minimal global resets)
├── tailwind/
│   └── tailwind.config.fragment.ts (animations, colors, extensions)
├── assets/
│   ├── icons/
│   ├── illustrations/
│   └── placeholders/
├── manifests/
│   ├── exported-files.json
│   ├── assets-manifest.json
│   └── component-map.json
└── docs/
    ├── DESIGN_SYSTEM.md (palette, typography, spacing, components)
    ├── COMPONENTS.md (component library reference)
    └── INTEGRATION_GUIDE.md (3-5 step integration walkthrough)
```

---

## Quick Start (3 Steps)

### 1. **Copy Design Tokens**
```bash
# Copy CSS variables and Tailwind config to your project
cp design-import/styles/tokens.css src/styles/
cp design-import/tailwind/tailwind.config.fragment.ts tailwind.config.ts
```

### 2. **Import a Component**
```tsx
// In your page (e.g., client/pages/Index.tsx)
import { HeroSection } from "@/components/landing/HeroSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
    </main>
  );
}
```

### 3. **Connect to Backend**
Replace mock data with real API calls:
```tsx
// Before (mock)
const mockData = { title: "Sample" };

// After (dynamic)
const [data, setData] = useState(null);
useEffect(() => {
  fetch("/api/dashboard")
    .then(res => res.json())
    .then(setData);
}, []);
```

See **INTEGRATION_GUIDE.md** for detailed examples.

---

## Key Design Tokens

### Colors
```css
--color-indigo-900: #1F2937  /* Deep indigo */
--color-indigo-700: #3730A3
--color-indigo-500: #6366F1
--color-indigo-100: #EDEEFF
--color-lime-400: #B9F227    /* Accent */
--color-slate-900: #0f172a   /* Text */
--glass-bg: rgba(255,255,255,0.55)
--glass-border: rgba(255,255,255,0.12)
```

### Typography
- **H1**: 28-32px, font-black (900), text-slate-900
- **H2**: 24px, font-black (900), text-slate-900
- **Body**: 14-16px, font-medium (500), text-slate-600

### Spacing (8pt Grid)
- Tight: 8px
- Normal: 16px
- Spacious: 24px
- Section: 32px

### Animations
- `animate-gradient-shift` — 8s ease infinite
- `animate-pulse-glow` — 3s infinite
- `animate-fade-in-up` — 0.7s ease
- `animate-slide-up` — 0.6s ease

See **DESIGN_SYSTEM.md** for complete reference.

---

## Component List

### Landing Components
| Component | Purpose | Mock Data | Status |
|-----------|---------|-----------|--------|
| HeroSection | Main hero with CTA | Dashboard preview, copy | ✅ Ready |
| ProblemSection | Problem statement | 4 pain points, visuals | ✅ Ready |
| PromiseSection | Value proposition | 3 supporting paragraphs | ✅ Ready |
| HowItWorksSection | Process flow | 4 step cards | ✅ Ready |
| WhatItFeelsLikeSection | Narrative section | Sample text | ✅ Ready |
| WhyTeamsLoveItSection | Differentiators | 2 paragraphs | ✅ Ready |
| TestimonialsSection | Social proof | 3 testimonial cards | ✅ Ready |
| ZiaQuotePanel | Mascot quote | Quote + mascot illustration | ✅ Ready |
| FinalCTASection | Strong closing | Dark variant CTA | ✅ Ready |
| DashboardVisual | Mock dashboard | Static card layout | ✅ Ready |
| ProblemVisuals | Visual grid | Placeholder images | ✅ Ready |
| InteractiveStoryFlow | 3-step visual flow | Chaos → Clarity → Alignment | ✅ Ready |
| LiveDemoPreview | Dashboard metrics | Static KPI cards | ✅ Ready |

### Dashboard Components
| Component | Purpose | Mock Data | Status |
|-----------|---------|-----------|--------|
| ZiaMascot | Mascot character | Placeholder illustration | ✅ Ready |
| GoodNews | Hero banner | 3 metric cards, timestamp | ✅ Ready |
| InsightsFeed | AI insights panel | 4 insight cards | ✅ Ready |
| Sparkline | Trend visualization | Sample sparkline data | ✅ Ready |
| CalendarAccordion | 7-day schedule | Sample schedule data | ✅ Ready |
| AnalyticsPanel | Performance metrics | Sample metrics | ✅ Ready |

### Layout Components
| Component | Purpose | Status |
|-----------|---------|--------|
| Header | Site navigation & auth | ✅ Ready |
| Footer | Links, copyright, newsletter | ✅ Ready |

---

## What's Been Removed

To create a clean design-only package, the following behavioral code has been removed or stubbed:

### Navigation & Routing
- **Removed**: `useNavigate()`, route pushes
- **Reason**: Backend will determine routing logic
- **Left Comment**: `// TODO: Wire to navigation handler`

### Authentication
- **Removed**: `useAuth()`, user context checks
- **Reason**: Auth state is backend-specific
- **Left Comment**: `// TODO: Connect to auth context`

### Analytics Tracking
- **Removed**: `analytics.track()` calls, event properties
- **Reason**: Analytics strategy is backend-specific
- **Left Comment**: `// TODO: Add data-cta tracking`

### Form Submission
- **Removed**: Form handlers, API calls, validation logic
- **Reason**: Forms are presentation-only in this package
- **Left Comment**: `// TODO: Connect form to API`

### Dynamic Data Fetching
- **Removed**: `useEffect`, `fetch`, API integrations
- **Reason**: All data is now static mock data
- **Left Comment**: `// TODO: Replace mock data with API call`

See **manifests/component-map.json** for a detailed breakdown of what was removed from each component.

---

## Placeholders & Mock Data

All components use **static mock data** for images, text, and metrics. You can identify placeholders by:

1. **Image placeholders**: `src="data:image/svg+xml;base64,..."`
2. **Text marked `[MOCK]`**: `"[MOCK] Sample text"`
3. **Data marked `TODO`**: Comments like `// TODO: Replace with real data`

### How to Replace Placeholders

**Example: Dashboard metrics**
```tsx
// Before (mock)
const metrics = [
  { label: "Posts Generated", value: "243", change: "+12%" },
  // ...
];

// After (real API)
const [metrics, setMetrics] = useState([]);
useEffect(() => {
  fetch("/api/metrics")
    .then(r => r.json())
    .then(setMetrics);
}, []);
```

See **INTEGRATION_GUIDE.md** for more examples.

---

## Asset Manifest

All images and SVGs are listed in **manifests/assets-manifest.json**:

```json
{
  "assets": [
    {
      "original_path": "client/assets/icons/dashboard.svg",
      "exported_path": "design-import/assets/icons/dashboard.svg",
      "usage": ["DashboardVisual.tsx"],
      "type": "icon"
    }
  ]
}
```

Use this to:
- Verify all images were copied
- Track which components use which assets
- Plan replacements (e.g., real dashboard screenshots instead of mocks)

---

## Design System Documentation

Three documents included:

1. **DESIGN_SYSTEM.md** — Complete design language reference
   - Color palette with CSS variable names
   - Typography hierarchy
   - Spacing & layout grid
   - Glassmorphism patterns
   - Micro-interactions & animations
   - Responsive breakpoints
   - Implementation checklist

2. **COMPONENTS.md** — Component library quick reference
   - Each component's purpose, props, usage examples
   - Customization notes
   - Mobile/responsive notes
   - Open source library versions

3. **INTEGRATION_GUIDE.md** — Step-by-step integration walkthrough
   - Copy tokens & Tailwind config
   - Import components into pages
   - Replace mock data with API calls
   - Connect to authentication
   - Add analytics tracking
   - Production readiness checklist

---

## Tailwind Configuration

The `tailwind.config.fragment.ts` contains:

```typescript
// Animations
extend: {
  animation: {
    'gradient-shift': 'gradient-shift 8s ease-in-out infinite',
    'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    'float-soft': 'float-soft 4s ease-in-out infinite',
    'slide-up': 'slide-up 0.6s ease-out forwards',
    'fade-in-up': 'fade-in-up 0.7s ease-out forwards',
  },
  keyframes: {
    'gradient-shift': { /* ... */ },
    'pulse-glow': { /* ... */ },
    // ... etc
  }
}
```

Merge this with your existing `tailwind.config.ts` to get all animations.

---

## Verification Checklist

Before integrating into your main project:

- [ ] All 20 components render without errors
- [ ] No `console.warn()` or `console.error()` about missing props
- [ ] No imports from `@/contexts/`, `@/hooks/`, or `/api` routes (design-only)
- [ ] Images load correctly (or show placeholder)
- [ ] Responsive design works on mobile (375px), tablet (768px), desktop (1200px)
- [ ] Animations play smoothly (no jank)
- [ ] Colors match design spec (indigo primary, lime accent, glass cards)
- [ ] Fonts render correctly (Inter or DM Sans)
- [ ] No secrets in any files (`.env`, API keys, etc.)
- [ ] Asset manifest matches files in `assets/` folder

---

## Common Integration Patterns

### 1. **Rendering a Section with Mock Data**
```tsx
import { HeroSection } from "@/components/landing/HeroSection";

export default function Home() {
  return <HeroSection />;
  // Component renders with internal mock data
}
```

### 2. **Injecting Real Data via Props**
```tsx
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";

export default function Home() {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    fetch("/api/testimonials")
      .then(r => r.json())
      .then(setTestimonials);
  }, []);

  return <TestimonialsSection data={testimonials} />;
}
```

### 3. **Handling CTA Clicks**
```tsx
import { HeroSection } from "@/components/landing/HeroSection";

export default function Home() {
  const navigate = useNavigate();

  const handleCTA = () => {
    // Track analytics
    analytics.track("cta_click", { source: "hero" });
    // Navigate
    navigate("/signup");
  };

  return <HeroSection onCTA={handleCTA} />;
}
```

See **INTEGRATION_GUIDE.md** for more patterns.

---

## Support & Questions

- **Design tokens unclear?** → See `DESIGN_SYSTEM.md`
- **How to customize a component?** → See `COMPONENTS.md`
- **Need to wire up the backend?** → See `INTEGRATION_GUIDE.md`
- **Can't find an asset?** → Check `manifests/assets-manifest.json`
- **Component structure?** → Check `manifests/component-map.json`

---

## Version & Last Updated

**Version**: 1.0
**Exported From**: Builder.io (Nov 2024)
**Design System**: Aligned-20AI v2024.11
**Last Updated**: Nov 11, 2024

---

## License

These components are part of the Aligned-20AI project. Use in accordance with project licensing terms.

---

**Ready to integrate?** → Start with Step 1 in INTEGRATION_GUIDE.md
