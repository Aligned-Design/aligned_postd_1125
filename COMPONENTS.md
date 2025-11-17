# Component Library Reference

Quick-access guide for all reusable dashboard components. Each component is production-ready and can be imported into any page.

---

## 📦 Components at a Glance

| Component | Location | Use Case | Responsive |
|-----------|----------|----------|------------|
| `<GoodNews />` | `dashboard/GoodNews.tsx` | Hero banner with 3 metric cards | ✅ |
| `<CalendarAccordion />` | `dashboard/CalendarAccordion.tsx` | 7-day expandable schedule | ✅ |
| `<InsightsFeed />` | `dashboard/InsightsFeed.tsx` | Compact AI insights panel (sticky) | ✅ |
| `<Sparkline />` | `dashboard/Sparkline.tsx` | Animated trend visualization | �� |
| `<AnalyticsPanel />` | `dashboard/AnalyticsPanel.tsx` | Performance metrics + integrations | ✅ |
| `<QuickActions />` | `dashboard/QuickActions.tsx` | 4-button action grid | ✅ |
| `<AdvisorPanel />` | `dashboard/AdvisorPanel.tsx` | Insights feed (legacy, compact) | ✅ |

---

## 🎨 Component Details

### 1. GoodNews

**Purpose**: Hero banner showcasing top-performing content and milestones.

**Props**: None (static data)

**Usage**:
```tsx
import { GoodNews } from "@/components/dashboard/GoodNews";

export default function Page() {
  return (
    <div className="p-8">
      <GoodNews />
    </div>
  );
}
```

**Output**:
- Full-width gradient banner (indigo-600 to blue-600)
- Header with lime icon and timestamp
- 3-card grid: Best Performer, Trending, Milestone
- "View Full Report" lime CTA

**Customization**:
- Edit `news` array in component for different metrics
- Colors: indigo primary, lime accent
- Responsive: 1 col mobile → 2 col tablet → 3 col desktop

**Mobile Note**: Cards stack to single column on mobile. Text scales: `text-2xl sm:text-3xl`.

---

### 2. CalendarAccordion

**Purpose**: 7-day expandable schedule with per-day post cards.

**Props**: None (static data)

**Usage**:
```tsx
import { CalendarAccordion } from "@/components/dashboard/CalendarAccordion";

export default function Page() {
  return <CalendarAccordion />;
}
```

**Output**:
- 7 collapsible day cards (Mon-Sun)
- Per-day header: date, post count, status dots
- Expand/Collapse All toggle
- Inline post cards with preview/edit/approve actions
- Status dots: gray (draft), yellow (reviewing), green (approved), blue (scheduled)

**Features**:
- Smooth 200ms accordion expand/collapse animation
- Multiple days can be open simultaneously
- Hover actions appear on post cards
- Platform icons (LinkedIn, Instagram, etc.)

**Customization**:
- Edit `schedule` array for different dates/posts
- Adjust `statusDotMap` colors if needed
- Change initial expanded day: `new Set([0])` → `new Set([1])`

**Mobile Note**: Full-width by default, scrollable on small screens.

---

### 3. InsightsFeed

**Purpose**: Compact 4-card AI insights panel, sticky on desktop.

**Props**: None (static data)

**Usage**:
```tsx
import { InsightsFeed } from "@/components/dashboard/InsightsFeed";

export default function Page() {
  return (
    <div className="lg:sticky lg:top-20 lg:h-fit">
      <InsightsFeed />
    </div>
  );
}
```

**Output**:
- Compact glassmorphic card (p-4)
- Header: AI Insights icon + "Always-on strategist" subtitle
- 4 insight cards with staggered fade-in animation (100ms delay)
- Insight types: metric (text), text (bold), action (button CTA)
- "Get Weekly Brief" lime button

**Features**:
- Tight spacing (12-16px range) for sidekick feel
- Hover lift effect on cards (`hover:translate-y-[-1px]`)
- Staggered animations for visual delight
- Action buttons: full-width on action-style insights

**Customization**:
- Edit `insights` array for different AI recommendations
- Change animation delay: `idx * 100` → `idx * 150` for slower stagger
- Update button text in CTA section

**Desktop Positioning**: Wrap in sticky container:
```tsx
<div className="lg:sticky lg:top-20 lg:h-fit">
  <InsightsFeed />
</div>
```

**Mobile Note**: Falls back to stacked layout below calendar on small screens.

---

### 4. Sparkline

**Purpose**: Miniature animated trend chart (60×20px) for metrics.

**Props**:
```tsx
interface SparklineProps {
  trend: "up" | "down";
  percentage: number;
}
```

**Usage**:
```tsx
import { Sparkline } from "@/components/dashboard/Sparkline";

export default function MetricCard() {
  return (
    <div>
      <h3>Total Reach</h3>
      <Sparkline trend="up" percentage={12} />
    </div>
  );
}
```

**Output**:
- Animated SVG line chart (60×20px)
- Lime gradient fill for uptrends, gray for downtrends
- 400ms left-to-right reveal animation
- Percentage change label below chart
- Paired metric value: "+12%" for up, "-5%" for down

**Features**:
- Smooth gradient animation on load
- Responsive sizing (scales with container)
- Hover pulse effect on gradient
- Clean, professional feel

**Customization**:
- Colors: `lineColor` logic (lime for up, gray for down)
- Animation duration: `400ms` in SVG className
- Points array: adjust `[20, 15, 25, ...]` for different data shapes

---

### 5. AnalyticsPanel

**Purpose**: Performance metrics grid + platform integrations overview.

**Props**: None (static data)

**Usage**:
```tsx
import { AnalyticsPanel } from "@/components/dashboard/AnalyticsPanel";

export default function Page() {
  return <AnalyticsPanel />;
}
```

**Output**:
- **Section 1**: 3 metric cards (Total Reach, Engagement Rate, Conversion Rate)
  - Icons, values, trend indicators
  - Ready for Sparkline integration
- **Section 2**: Platform integrations grid
  - 10 platform icons (Meta, Instagram, LinkedIn, etc.)
  - Connected: lime highlight
  - Not connected: gray
  - "Connected Accounts" badge
  - "Connect Another Account" button

**Features**:
- Glassmorphic card containers
- Responsive grid: 3 cols desktop → 2 cols tablet → 1 col mobile
- Integration grid: 5 cols desktop → 3 cols mobile
- Hover states on metric cards

**Customization**:
- Edit `analytics` array for different metrics
- Edit `integrations` array to show/hide platforms
- Change connected status: `connected: true/false`
- Integrate `<Sparkline />` component for trend visualization

---

### 6. QuickActions

**Purpose**: 4-button action grid for common workflows.

**Props**: None (static config)

**Usage**:
```tsx
import { QuickActions } from "@/components/dashboard/QuickActions";

export default function Page() {
  return <QuickActions />;
}
```

**Output**:
- 4-button grid: Create Post, AI Ideas, Bulk Approve, View Report
- Each button: gradient icon box + title + description
- Unique gradient colors per action
- Hover: slight lift, icon scale
- Responsive: 1 col mobile → 2 col tablet → 4 col desktop

**Features**:
- Icon backgrounds match action theme
- Descriptions truncated on small screens
- Hover animations: scale up icon, lift card

**Customization**:
- Edit `actions` array for different buttons
- Change gradient colors: `from-indigo-500 to-blue-500`
- Update icon, label, description text

---

### 7. AdvisorPanel (Legacy)

**Purpose**: Compact insights feed (predecessor to InsightsFeed).

**Props**: None (static data)

**Usage**:
```tsx
import { AdvisorPanel } from "@/components/dashboard/AdvisorPanel";

export default function Page() {
  return <AdvisorPanel />;
}
```

**Output**:
- Compact card with icon header
- 4 insight items with emoji icons
- Green highlight badges for metrics
- "Get Weekly Brief" CTA button

**Features**:
- Professional, tight spacing
- Hover lift on insight items
- Metric pills for key data points

**Note**: `InsightsFeed` is the newer, more feature-rich version. Use `AdvisorPanel` only for legacy implementations.

---

## 🔗 How to Combine Components

### Pattern 1: 3-Zone Dashboard (Recommended)

```tsx
import { GoodNews } from "@/components/dashboard/GoodNews";
import { CalendarAccordion } from "@/components/dashboard/CalendarAccordion";
import { InsightsFeed } from "@/components/dashboard/InsightsFeed";
import { AnalyticsPanel } from "@/components/dashboard/AnalyticsPanel";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
      <div className="p-4 sm:p-6 md:p-8">
        
        {/* Zone 1: Strategic Overview */}
        <GoodNews />

        {/* Zone 2: Operational Workflow (2-column) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 my-12">
          <div className="lg:col-span-2">
            <CalendarAccordion />
          </div>
          <div className="lg:sticky lg:top-20 lg:h-fit">
            <InsightsFeed />
          </div>
        </div>

        {/* Zone 3: Intelligence & Data */}
        <AnalyticsPanel />
      </div>
    </div>
  );
}
```

### Pattern 2: Analytics Page

```tsx
import { AnalyticsPanel } from "@/components/dashboard/AnalyticsPanel";
import { QuickActions } from "@/components/dashboard/QuickActions";

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
      <div className="p-8">
        <h1 className="text-4xl font-black mb-6">Analytics</h1>
        
        <QuickActions />
        <AnalyticsPanel />
      </div>
    </div>
  );
}
```

### Pattern 3: Simple Insights Sidebar

```tsx
import { InsightsFeed } from "@/components/dashboard/InsightsFeed";

export default function ContentPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Main content on left */}
      <div className="lg:col-span-3">
        {/* Your content */}
      </div>

      {/* AI Insights sidebar on right */}
      <div className="lg:sticky lg:top-20 lg:h-fit">
        <InsightsFeed />
      </div>
    </div>
  );
}
```

---

## 🎯 Common Customizations

### Changing Colors

Most components use design tokens. Update in `client/global.css`:

```css
:root {
  --color-indigo: #312E81;
  --color-lime: #B9F227;
  /* etc. */
}
```

Then use in components:
```tsx
<div className="bg-indigo-600 text-lime-400">...</div>
```

### Adjusting Spacing

Edit Tailwind `spacing` in `tailwind.config.ts`, or use inline classes:

```tsx
<div className="p-4 sm:p-6 md:p-8">  {/* Responsive padding */}
  <div className="space-y-2 sm:space-y-4">  {/* Responsive gap */}
  </div>
</div>
```

### Swapping Icons

Most components use Lucide icons. Replace in component files:

```tsx
import { BookOpen } from "lucide-react";  // New icon

<BookOpen className="w-5 h-5" />
```

### Disabling Animations

Remove `animate-` classes or update `tailwind.config.ts`:

```tsx
animation: {
  "fade-in": "fade-in 0s",  // Instant, no animation
}
```

---

## 📋 Checklist for New Pages

When building a new page using this design system:

- [ ] Wrap page in gradient background container
- [ ] Use appropriate component from library (don't rebuild)
- [ ] Ensure responsive classes: `p-4 sm:p-6 md:p-8`
- [ ] Test at 375px, 768px, 1200px screen widths
- [ ] Verify colors use design tokens (no custom hex)
- [ ] Add hover states to interactive elements
- [ ] Check text contrast (4.5:1 minimum)
- [ ] Test keyboard navigation
- [ ] Use consistent spacing (8pt grid)

---

## 🐛 Troubleshooting

**Components not rendering?**
- Check imports: `@/components/dashboard/ComponentName`
- Verify all dependencies in component file
- Check for missing icon imports from `lucide-react`

**Sticky sidebar not working?**
- Ensure parent has `lg:sticky lg:top-20 lg:h-fit` classes
- Check that sidebar content doesn't exceed viewport height
- On mobile, sticky falls back to normal stacking

**Animations not smooth?**
- Check `tailwind.config.ts` for animation definitions
- Verify `slide-down` keyframe exists
- Ensure animation duration matches intent (200-400ms)

**Responsive breakpoints wrong?**
- Mobile-first approach: `sm:` overrides at 640px, `lg:` at 1024px
- Check Tailwind config breakpoints match intent
- Test in browser DevTools responsive mode

---

**Last Updated**: Nov 2024
**Questions?** Check `DESIGN_SYSTEM.md` for foundational principles.
