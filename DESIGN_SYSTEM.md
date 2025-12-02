# POSTD Design System

A cohesive, energizing visual language for marketing command centers. This system ensures consistency across all product areas while maintaining flexibility for feature-specific needs.

---

## 🎨 Core Design Principles

1. **Clarity First** - Information hierarchy over decoration
2. **Energizing Not Overwhelming** - Thoughtful use of space and contrast
3. **Micro-interactions** - Subtle, purposeful motion (200-400ms)
4. **Accessibility** - 4.5:1 contrast minimum, keyboard navigation
5. **Responsive by Default** - Mobile-first, scales gracefully

---

## 🎭 Color Palette

All colors use CSS custom properties defined in `client/global.css`.

### Primary Colors
- **Deep Indigo**: `--color-indigo` (primary brand color, UI elements)
- **Lime**: `--color-lime` (accent, CTAs, uptrends only)
- **Blue Gradient**: `from-indigo-600 via-blue-600 to-indigo-600` (hero sections)

### Semantic Colors
- **Success**: Green (`bg-green-500`, `text-green-600`)
- **Warning**: Yellow (`bg-yellow-500`, `text-yellow-700`)
- **Info**: Blue (`bg-blue-500`, `text-blue-700`)
- **Neutral**: Gray (`bg-gray-400`, `text-gray-600`)

### Backgrounds
- **Card Base**: `bg-white/50 backdrop-blur-xl` (glassmorphism)
- **Overlay**: `from-indigo-50/40 via-blue-50/20 to-transparent` (subtle gradient)
- **Page**: `from-indigo-50/30 via-white to-blue-50/20` (full page gradient)

### Border Colors
- **Default**: `border-white/60`
- **Hover/Active**: `border-indigo-300/50`
- **Subtle**: `border-indigo-200/40`

---

## 📏 Spacing & Layout System

Uses **8pt base grid** for all spacing decisions.

### Standard Gaps
- **Tight**: 8px (12-16px range)
- **Normal**: 16px
- **Spacious**: 24px
- **Section**: 32px

### Padding (Cards & Containers)
```css
/* Compact (sidebars, tight panels) */
p-4 /* 16px */

/* Standard (most cards) */
p-6 /* 24px */

/* Expansive (hero sections) */
p-8 /* 32px (desktop only) */
```

### Margins (Section Spacing)
```css
/* Between sections */
mb-12 /* 48px */
mb-16 /* 64px (desktop) */

/* Between cards */
space-y-4 /* 16px */
space-y-3 /* 12px (compact) */
space-y-2 /* 8px (tight) */
```

---

## 🔤 Typography System

Uses **Inter** or **DM Sans** with specific weight/size combinations.

### Heading Hierarchy
```
h1: 28-32px, font-black (900), text-slate-900
h2: 24px, font-black (900), text-slate-900
h3: 16-18px, font-black (900), text-slate-900
h4: 14px, font-bold (700), text-slate-900
```

### Body Text
```
Base: 14-16px, font-medium (500), text-slate-600
Compact: 12px, font-medium (500), text-slate-600
Small: 11px, font-medium (500), text-slate-500
```

### Special Cases
- **Labels/Tags**: 12px, font-bold (700), `uppercase tracking-widest`
- **Metrics**: 24-32px, font-black (900), `text-slate-900`
- **Subtle Text**: 12px, font-medium (500), `text-slate-500`

---

## 🧩 Component Library

### 1. **Card Container**
Base glassmorphic card used everywhere.

```tsx
<div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 hover:shadow-md transition-all duration-300 relative overflow-hidden">
  {/* Content */}
</div>
```

**Variants**:
- **Compact** (sidebars): `p-4`, `space-y-2`
- **Standard** (dashboard): `p-6`, `space-y-3`
- **Hero** (banners): `p-8` (desktop), full-width gradient background

---

### 2. **Hero Section (Good News Pattern)**
Full-width banner showcasing key metrics.

```tsx
<div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 rounded-lg bg-lime-400/20 flex items-center justify-center">
      <Icon className="text-lime-300" />
    </div>
    <h2 className="text-2xl font-black">Good News 🎉</h2>
  </div>
  
  <p className="text-white/80 text-sm mb-6">Subtitle text here.</p>
  <p className="text-xs font-medium text-blue-100/70">POSTD Summary — Updated Today · Powered by Advisor</p>
  
  {/* 3-card grid */}
</div>
```

**Key Features**:
- Lime accent icon box (20% opacity)
- 3-card inner grid (responsive: 1 mobile → 2 tablet → 3 desktop)
- "Powered by Advisor" timestamp for AI credibility
- CTA button: `bg-lime-400`, `text-indigo-950`

---

### 3. **Accordion/Expandable Section**
7-day calendar pattern, but reusable for any hierarchical content.

```tsx
// Day Header (always visible)
<button className="w-full px-4 py-3 bg-gradient-to-br from-indigo-50/30 to-blue-50/10 hover:from-indigo-50/50 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <ChevronDown className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
    <div>
      <p className="font-bold text-sm">{title}</p>
      <p className="text-xs text-slate-600">{subtitle}</p>
    </div>
  </div>
  {/* Status indicators */}
</button>

// Expanded Content (smooth 200ms reveal)
{isExpanded && (
  <div className="animate-[slideDown_200ms_ease-out] bg-white/30 border-t p-4 space-y-2">
    {/* Items */}
  </div>
)}
```

**Patterns**:
- Per-item expand/collapse (not accordion-only)
- Multiple sections open simultaneously
- Status dots (gray/yellow/green/blue)
- Smooth 200ms `slide-down` animation

---

### 4. **Insights Panel (Compact Sidebar)**
AI-driven insights, tight professional sidekick.

```tsx
<div className="bg-white/50 backdrop-blur-xl rounded-2xl p-4 border border-white/60">
  {/* Header with icon */}
  <div className="flex items-center gap-2 mb-4 pb-3 border-b">
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-200/50 to-blue-200/40 flex items-center justify-center">
      <Icon className="w-4 h-4 text-indigo-600" />
    </div>
    <h3 className="text-sm font-black">AI Insights</h3>
  </div>

  {/* Insight cards, space-y-2 */}
  <div className="space-y-2">
    {/* Cards with staggered fade-in (100ms delay) */}
  </div>

  {/* CTA button: lime accent */}
</div>
```

**Spacing Quirks**:
- Tight: `p-4`, `space-y-2`, `gap-2`
- Headings: `text-sm`, icons: `w-4 h-4`
- Animation delay: `idx * 100ms` for stagger effect
- Hover lift: `hover:translate-y-[-1px]` (subtle, not intrusive)

---

### 5. **Sparkline Visualization**
Tiny animated trend chart (60×20px).

```tsx
<svg width={60} height={20}>
  {/* Gradient fill with lime (up) or gray (down) */}
  <polygon points={svgPoints} fill="url(#gradient)" />
  {/* Trend line */}
  <polyline points={svgPoints} stroke={lineColor} />
</svg>
<span className="text-xs font-bold text-lime-600">+8%</span>
```

**Features**:
- 400ms left-to-right reveal animation
- Lime for uptrends, gray for downtrends
- Paired with numeric % change
- Used in metrics rows (Performance Metrics, etc.)

---

## 🎬 Micro-Interactions & Animations

All animations use CSS transitions/keyframes. Keep durations **purposeful, not slow**.

### Standard Durations
- **Quick feedback**: 200ms (hover states, accordion open/close)
- **Entrance**: 300ms (fade-in on card load)
- **Reveal**: 400ms (sparklines, larger content)

### Keyframe Definitions
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-down {
  from { opacity: 0; height: 0; transform: translateY(-10px); }
  to { opacity: 1; height: auto; transform: translateY(0); }
}
```

### Hover & Focus States
```css
/* Card hover */
hover:bg-white/70 hover:shadow-md hover:border-indigo-300/50 transition-all duration-300

/* Icon hover */
group-hover:scale-110 transition-transform duration-300

/* Button hover */
hover:scale-105 active:scale-95 transition-all duration-200

/* Lift effect (cards, insights) */
hover:translate-y-[-2px] transition-transform duration-300
```

### Stagger Pattern (Insights, Calendar)
```tsx
style={{
  animationDelay: `${idx * 100}ms`,
  animationFillMode: "both",
}}
```
Each subsequent item animates 100ms after the previous, creating a cascade effect.

---

## 📐 Responsive Breakpoints

Uses Tailwind's default breakpoints. Key patterns:

```
sm: 640px  (mobile → tablet)
md: 768px  (tablet → desktop)
lg: 1024px (desktop, unlock 2-column layouts)
```

### Dashboard Layout (3-Zone Example)

**Mobile (< 640px)**
```
- Stack all zones vertically
- Full-width cards (p-4 padding)
- InsightsFeed below Calendar (not sticky)
- Hero: h-auto, responsive text sizes
```

**Tablet (640px - 1023px)**
```
- Calendar Accordion + InsightsFeed still stacked
- Cards: p-4-6 (scale up slightly)
- Hero: still full-width
```

**Desktop (1024px+)**
```
- 2-column: Calendar (2/3) + InsightsFeed (1/3)
- InsightsFeed: sticky (lg:sticky lg:top-20 lg:h-fit)
- Cards: p-6, standard spacing
- Hero: full-width luxury spacing (p-8)
```

---

## 🛠️ Implementation Checklist

When applying this design system to new pages/areas:

- [ ] **Color Tokens**: Use `indigo-600`, `lime-400`, not custom hex values
- [ ] **Spacing**: Follow 8pt grid (16px gaps, 24px padding defaults)
- [ ] **Glassmorphism**: Apply `bg-white/50 backdrop-blur-xl` to all cards
- [ ] **Typography**: Use font-black (900) for headings, font-medium (500) for body
- [ ] **Animations**: Keep durations to 200-400ms, use keyframes from above
- [ ] **Responsive**: Test at 375px (mobile), 768px (tablet), 1200px (desktop)
- [ ] **Accessibility**: Ensure 4.5:1 contrast on all text, test keyboard nav
- [ ] **Hover States**: Always include subtle transitions (scale, shadow, color)
- [ ] **Micro-copy**: Use warm, encouraging tone ("Powered by Advisor", emojis sparingly)

---

## 📦 Reusable Components

Pre-built components ready to drop into other pages:

1. **`<GoodNews />`** - Hero banner with 3 metric cards
2. **`<CalendarAccordion />`** - 7-day expandable schedule
3. **`<InsightsFeed />`** - Compact 4-card AI insights
4. **`<Sparkline />`** - Animated trend visualization
5. **`<AnalyticsPanel />`** - Performance metrics grid

All located in `client/components/dashboard/`. Import and customize as needed.

---

## 🎯 Example: Applying to a New Page

**Before** (generic):
```tsx
<div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
  <h1>Analytics</h1>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
    {/* Cards */}
  </div>
</div>
```

**After** (design system):
```tsx
<div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
  <div className="p-4 sm:p-6 md:p-8">
    <h1 className="text-4xl font-black text-slate-900 mb-6">Analytics</h1>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
      <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/70 transition-all duration-300">
        {/* Card content */}
      </div>
    </div>
  </div>
</div>
```

---

## 📚 Resources

- **Tailwind Config**: `tailwind.config.ts` (colors, animations, spacing)
- **Global CSS**: `client/global.css` (design tokens, resets)
- **Component Examples**: Dashboard page (`client/pages/Dashboard.tsx`)
- **Live Playground**: `/dashboard` route

---

**Last Updated**: Nov 2024
**Maintained By**: Design & Engineering Team
