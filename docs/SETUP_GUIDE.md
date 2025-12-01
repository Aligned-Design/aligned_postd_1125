# Setup & Quick Start Guide

Get started with the POSTD design system in minutes.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Vite 7.1.2+
- React 18+

## Installation Status ✅

The design system is **already installed and configured**. No additional npm packages needed.

### What Was Added

```
✓ client/styles/tokens.css         (250 lines - CSS design tokens)
✓ client/styles/animations.css     (529 lines - CSS animations)
✓ client/App.tsx                   (updated with imports)
✓ tailwind.config.ts               (extended with animations)
```

### What's Already Configured

```
✓ Vite - Build tool and dev server
✓ TypeScript - Type safety (@/* path aliases)
✓ Tailwind CSS - Utility-first styling
✓ React - Component framework
✓ ESLint - Code quality
✓ Vitest - Testing framework
```

---

## Quick Start (5 minutes)

### 1. Start Dev Server

```bash
npm run dev
```

Starts Vite dev server on `http://localhost:8080`

### 2. Import Components

```jsx
import { HeroSection } from '@/components/landing/HeroSection';
import { GoodNews } from '@/components/dashboard/GoodNews';
```

### 3. Use in Page

```jsx
export default function MyPage() {
  return (
    <main>
      <HeroSection onCTA={() => handleSignup()} />
      <GoodNews data={metrics} />
    </main>
  );
}
```

### 4. Build for Production

```bash
npm run build:client
```

---

## Verification Checklist

Run through these steps to verify everything is working:

### ✅ Step 1: Check Files Exist

```bash
# Verify design system files
ls -la client/styles/tokens.css
ls -la client/styles/animations.css
ls -la client/components/landing/HeroSection.tsx
ls -la client/components/dashboard/GoodNews.tsx
```

Expected output: All files should exist

### ✅ Step 2: Verify Imports in App.tsx

```bash
grep -A 2 "import.*tokens.css" client/App.tsx
```

Expected output:
```
import "./styles/tokens.css";
import "./styles/animations.css";
```

### ✅ Step 3: Verify TypeScript Compiles

```bash
npm run typecheck
```

Expected output: Should complete without client-side errors

**Note:** Server-side errors are pre-existing and expected

### ✅ Step 4: Verify Build Works

```bash
npm run build:client
```

Expected output:
```
✓ 2998 modules transformed.
✓ built in 3.35s
```

### ✅ Step 5: Test Import

Create a test file:

```bash
cat > /tmp/test-import.tsx << 'EOF'
import { HeroSection } from '@/components/landing/HeroSection';

export default function Test() {
  return <HeroSection />;
}
EOF
```

The import path should resolve correctly in your IDE.

### ✅ Step 6: Start Dev Server

```bash
npm run dev &
sleep 3
ps aux | grep "vite"  # Should see Vite process running
```

Expected output: Vite should start on port 8080

### ✅ Step 7: Test CSS Variables

Navigate to `http://localhost:8080` and open DevTools Console:

```javascript
// In browser console
const styles = getComputedStyle(document.documentElement);
console.log(styles.getPropertyValue('--color-indigo-600'));
// Should output: #4f46e5
```

---

## File Organization

```
client/
├── components/
│   ├── landing/          ← Landing page components (13)
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
│   │   ├── LiveDemoPreview.tsx
│   │   └── ZiaPersonality.tsx
│   │
│   └── dashboard/        ← Dashboard components (6)
│       ├── ZiaMascot.tsx
│       ├── GoodNews.tsx
│       ├── InsightsFeed.tsx
│       ├── Sparkline.tsx
│       ├── CalendarAccordion.tsx
│       └── AnalyticsPanel.tsx
│
└── styles/
    ├── global.css       ← Base styles and Tailwind directives
    ├── tokens.css       ← Design tokens (CSS variables)
    └── animations.css   ← Animation keyframes
```

---

## Common Tasks

### Task 1: Create a Landing Page

```jsx
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { PromiseSection } from '@/components/landing/PromiseSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FinalCTASection } from '@/components/landing/FinalCTASection';

export default function LandingPage() {
  const handleCTA = () => {
    window.location.href = '/signup';
  };

  return (
    <main className="min-h-screen">
      <HeroSection onCTA={handleCTA} />
      <ProblemSection />
      <PromiseSection onCTA={handleCTA} />
      <TestimonialsSection />
      <FinalCTASection onCTA={handleCTA} />
    </main>
  );
}
```

### Task 2: Create a Dashboard

```jsx
import { GoodNews } from '@/components/dashboard/GoodNews';
import { InsightsFeed } from '@/components/dashboard/InsightsFeed';
import { CalendarAccordion } from '@/components/dashboard/CalendarAccordion';
import { AnalyticsPanel } from '@/components/dashboard/AnalyticsPanel';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [data, setData] = useState({
    metrics: null,
    insights: [],
    schedule: [],
    analytics: []
  });

  useEffect(() => {
    // Fetch data from API
    loadDashboardData().then(setData);
  }, []);

  return (
    <div className="p-8 space-y-6">
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

### Task 3: Use Design Tokens in Custom Components

```jsx
import React from 'react';

export function CustomCard() {
  return (
    <div
      className="rounded-lg transition-all duration-300"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--glass-border)',
        padding: 'var(--spacing-4)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      <h3
        style={{
          color: 'var(--color-indigo-600)',
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--spacing-2)'
        }}
      >
        Custom Card Title
      </h3>
      <p style={{ color: 'var(--color-slate-600)' }}>
        Content using design system colors
      </p>
    </div>
  );
}
```

### Task 4: Add Animations to Elements

```jsx
export function AnimatedCard() {
  return (
    <div className="animate-fade-in-up">
      {/* Fades in and slides up on load */}
    </div>
  );
}

export function HoverEffect() {
  return (
    <button className="hover:animate-lift transition-all duration-300">
      {/* Lifts up on hover with shadow increase */}
      Click me
    </button>
  );
}

export function LoadingSpinner() {
  return (
    <div className="animate-spin border-4 border-indigo-200 border-t-indigo-600 rounded-full w-8 h-8">
      {/* Spinning loader */}
    </div>
  );
}
```

---

## Development Workflow

### Starting Development

```bash
# 1. Start dev server
npm run dev

# 2. Open browser
open http://localhost:8080

# 3. Edit files in client/components/
# Changes auto-refresh in browser
```

### Type Checking

```bash
# Check for TypeScript errors
npm run typecheck

# Note: Server errors are expected, focus on client errors
```

### Building for Production

```bash
# Build client
npm run build:client

# Build output
dist/
├── index.html
├── assets/
│   ├── index-*.css        (172KB gzipped)
│   ├── vendor-*.js
│   └── index-*.js         (809KB total)
```

### Testing

```bash
# Run tests
npm run test

# Expected: 828 passed, 30 failed (pre-existing), 89 skipped
```

---

## Styling with Design System

### Option 1: Tailwind Classes

```jsx
<div className="bg-indigo-600 text-white p-8 rounded-lg shadow-lg">
  Using Tailwind classes
</div>
```

### Option 2: CSS Variables

```jsx
<div style={{
  backgroundColor: 'var(--color-indigo-600)',
  color: 'white',
  padding: 'var(--spacing-4)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-lg)'
}}>
  Using CSS variables
</div>
```

### Option 3: Combined

```jsx
<div
  className="transition-all duration-300 hover:shadow-xl"
  style={{
    backgroundColor: 'var(--color-indigo-600)',
    padding: 'var(--spacing-4)'
  }}
>
  Mixing Tailwind and CSS variables
</div>
```

---

## Responsive Design

Use Tailwind breakpoints:

```jsx
<div className="
  // Mobile-first
  grid
  grid-cols-1           // Mobile: 1 column
  md:grid-cols-2        // Tablet: 2 columns
  lg:grid-cols-3        // Desktop: 3 columns
  gap-4                 // Mobile gap
  md:gap-6              // Tablet gap
  p-4                   // Mobile padding
  md:p-8                // Tablet/Desktop padding
">
  {/* Content */}
</div>
```

---

## Troubleshooting

### Issue: "Cannot find module '@/components/...'"

**Solution:**
1. Check file exists at correct path
2. Verify case sensitivity (TypeScript is case-sensitive)
3. Restart dev server
4. Check tsconfig.json has `"@/*": ["./client/*"]`

### Issue: CSS variables not working

**Solution:**
1. Verify imports in App.tsx:
   ```jsx
   import "./styles/tokens.css";
   import "./styles/animations.css";
   ```
2. Check browser DevTools - should see `:root { --color-indigo-600: ... }`
3. Ensure component is inside `<App />` (where styles are loaded)

### Issue: Animations not playing

**Solution:**
1. Check CSS is imported
2. Verify animation class name: `animate-fade-in-up`
3. Check browser DevTools Animation tab
4. Look for `prefers-reduced-motion` setting

### Issue: Build fails with type errors

**Solution:**
1. Check only client files have type errors
2. Server type errors are pre-existing and expected
3. Run `npm run build:client` specifically for client build
4. Ignore server errors for now

---

## IDE Setup

### VSCode Extensions (Optional)

For better development experience:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",     // Tailwind intellisense
    "cssho.vscode-svgviewer",         // SVG preview
    "ms-vscode.vscode-typescript-next" // TypeScript
  ]
}
```

### IntelliSense

CSS variables should auto-complete in VSCode:

```jsx
// Type --color- to see suggestions
backgroundColor: 'var(--color-
```

---

## Performance Tips

### Code Splitting

Lazy load landing components:

```jsx
import { lazy, Suspense } from 'react';

const HeroSection = lazy(() =>
  import('@/components/landing/HeroSection')
);

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeroSection />
    </Suspense>
  );
}
```

### Optimize Images

```jsx
// Use next/image for optimization
import Image from 'next/image';

<Image
  src="/dashboard-preview.png"
  alt="Dashboard preview"
  width={800}
  height={600}
  loading="lazy"
/>
```

### Monitor Bundle Size

```bash
# Check client bundle size
npm run build:client
# Look for output like: "index-*.js    809KB"
```

---

## Next Steps

1. ✅ **Verify Setup** - Run through verification checklist above
2. 📖 **Read Documentation**:
   - [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) - Design tokens reference
   - [COMPONENTS.md](COMPONENTS.md) - Component API
   - [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Integration patterns
3. 🎨 **Build Pages** - Create landing pages or dashboards
4. 🚀 **Deploy** - Push to production with `npm run build:client`

---

## Getting Help

**Documentation:**
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) - Colors, spacing, animations
- [COMPONENTS.md](COMPONENTS.md) - Component reference
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - How to use
- [ARCHITECTURE.md](ARCHITECTURE.md) - Design decisions

**Questions?**
- Check existing pages for usage examples
- Review component props in source files
- Look at Index.tsx for a complete landing page example

---

## Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run typecheck       # Check TypeScript
npm run lint            # Run ESLint

# Building
npm run build:client    # Build client for production
npm run build           # Full build (client + server)

# Testing
npm run test            # Run tests with Vitest
npm run test:ui         # Test UI dashboard

# Utilities
npm run preview         # Preview production build locally
npm run clean           # Clean build artifacts
```

---

## Deployment

### Vercel

The design system works out of the box with Vercel:

1. Push to GitHub
2. Connect repo to Vercel
3. Vercel auto-detects Vite config
4. Runs `npm run build:client`
5. Deploys to production

### Other Platforms

Ensure platform runs:

```bash
npm run build:client
```

Then serves `dist/` folder.

---

## Summary

You're all set! The design system is:

✅ **Installed** - All files in place
✅ **Configured** - Integrated with Vite and Tailwind
✅ **Ready to use** - Import components and start building
✅ **Well documented** - Comprehensive guides available

Happy building! 🚀
