# Component Library Reference

Complete reference for all landing page and dashboard components in the Aligned-20AI design system.

## Table of Contents

- [Landing Components](#landing-components)
- [Dashboard Components](#dashboard-components)
- [Component State Management](#component-state-management)
- [Props Reference](#props-reference)

---

## Landing Components

Landing page components are designed to be stateless presentation components with optional callbacks for user interactions (CTAs).

### HeroSection

Main hero section with headline, subheadline, and primary CTA.

**Location:** `client/components/landing/HeroSection.tsx`

**Props:**
```typescript
interface HeroSectionProps {
  onCTA?: () => void;  // Called when primary button is clicked
}
```

**Features:**
- Large headline with gradient text option
- Subheadline with supporting copy
- Primary CTA button (calls `onCTA` callback)
- Animated background with gradient effects
- Responsive design for mobile/tablet/desktop

**Usage:**
```jsx
import { HeroSection } from '@/components/landing/HeroSection';

export default function Page() {
  const handleCTA = () => {
    // Navigate to signup or dashboard
  };

  return <HeroSection onCTA={handleCTA} />;
}
```

**Animations:**
- `animate-slide-up` on headline
- `animate-fade-in-up` on subheadline and CTA
- Background gradient animation

---

### ProblemSection

Section showcasing customer pain points with visual illustrations.

**Location:** `client/components/landing/ProblemSection.tsx`

**Props:**
```typescript
interface ProblemSectionProps {
  // No props - fully static
}
```

**Features:**
- 4-column grid of pain points
- Icons/illustrations for each problem
- Short description and impact statement
- Fully responsive grid layout

**Usage:**
```jsx
import { ProblemSection } from '@/components/landing/ProblemSection';

export default function Page() {
  return <ProblemSection />;
}
```

**Content:**
1. Brand Chaos - Inconsistent messaging
2. Approval Bottlenecks - Slow workflows
3. Manual Overload - Time-consuming tasks
4. Reporting Fatigue - Data compilation

---

### InteractiveStoryFlow

3-step interactive flow showing transformation (Chaos → Clarity → Alignment).

**Location:** `client/components/landing/InteractiveStoryFlow.tsx`

**Props:**
```typescript
interface InteractiveStoryFlowProps {
  // No props - fully static
}
```

**Features:**
- 3-step flow visualization
- Animated transitions between steps
- Large SVG illustration
- Descriptive text for each step

**Usage:**
```jsx
import { InteractiveStoryFlow } from '@/components/landing/InteractiveStoryFlow';

export default function Page() {
  return <InteractiveStoryFlow />;
}
```

**Steps:**
1. Chaos - Scattered, unaligned
2. Clarity - Process understanding
3. Alignment - Complete synchronization

---

### LiveDemoPreview

Mock dashboard preview showing product interface.

**Location:** `client/components/landing/LiveDemoPreview.tsx`

**Props:**
```typescript
interface LiveDemoPreviewProps {
  // No props - mock data only
}
```

**Features:**
- Mock dashboard metrics display
- 3 key metric cards (posts scheduled, engagement rate, ROI)
- Static numbers for visual reference
- Glass card design with shadow effects

**Usage:**
```jsx
import { LiveDemoPreview } from '@/components/landing/LiveDemoPreview';

export default function Page() {
  return <LiveDemoPreview />;
}
```

---

### PromiseSection

Section highlighting the value proposition and benefits.

**Location:** `client/components/landing/PromiseSection.tsx`

**Props:**
```typescript
interface PromiseSectionProps {
  onCTA?: () => void;  // Called when CTA button is clicked
}
```

**Features:**
- Headline with value proposition
- 3-5 benefit statements with icons
- Secondary CTA button
- Dark background variant option

**Usage:**
```jsx
import { PromiseSection } from '@/components/landing/PromiseSection';

export default function Page() {
  return <PromiseSection onCTA={() => handleSignup()} />;
}
```

---

### HowItWorksSection

Step-by-step guide showing how the product works.

**Location:** `client/components/landing/HowItWorksSection.tsx`

**Props:**
```typescript
interface HowItWorksSectionProps {
  // No props - fully static
}
```

**Features:**
- 4 sequential steps with numbers
- Icons for each step
- Descriptions and outcomes
- Connected visual flow

**Usage:**
```jsx
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';

export default function Page() {
  return <HowItWorksSection />;
}
```

**Steps:**
1. Connect Your Accounts
2. Set Up Preferences
3. AI Generates Content
4. Review & Publish

---

### WhatItFeelsLikeSection

Emotional narrative section describing user experience.

**Location:** `client/components/landing/WhatItFeelsLikeSection.tsx`

**Props:**
```typescript
interface WhatItFeelsLikeSectionProps {
  onCTA?: () => void;  // Optional CTA callback
}
```

**Features:**
- Narrative-style copy
- Emotional appeal
- Optional CTA button
- Storytelling approach to engagement

**Usage:**
```jsx
import { WhatItFeelsLikeSection } from '@/components/landing/WhatItFeelsLikeSection';

export default function Page() {
  return <WhatItFeelsLikeSection onCTA={handleCTA} />;
}
```

---

### WhyTeamsLoveItSection

Section highlighting differentiators and competitive advantages.

**Location:** `client/components/landing/WhyTeamsLoveItSection.tsx`

**Props:**
```typescript
interface WhyTeamsLoveItSectionProps {
  // No props - fully static
}
```

**Features:**
- 5-6 key differentiators
- Icons and short descriptions
- Comparison to alternatives
- Highlight Aligned-20AI advantages

**Usage:**
```jsx
import { WhyTeamsLoveItSection } from '@/components/landing/WhyTeamsLoveItSection';

export default function Page() {
  return <WhyTeamsLoveItSection />;
}
```

---

### TestimonialsSection

Social proof section with customer testimonials.

**Location:** `client/components/landing/TestimonialsSection.tsx`

**Props:**
```typescript
interface TestimonialsSectionProps {
  testimonials?: Testimonial[];  // Optional real testimonials
}

interface Testimonial {
  name: string;
  company: string;
  role: string;
  quote: string;
  avatar?: string;  // Image URL
  logo?: string;    // Company logo URL
}
```

**Features:**
- 3 customer testimonial cards
- Avatar images and company logos
- Star ratings (5 stars)
- Responsive grid layout
- Mock data included

**Usage:**
```jsx
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';

export default function Page() {
  const testimonials = [
    {
      name: "Jane Smith",
      company: "Little Fox Creative",
      role: "Creative Director",
      quote: "Aligned has transformed how our team collaborates...",
      avatar: "/avatars/jane.jpg",
      logo: "/logos/little-fox.png"
    },
    // ... more testimonials
  ];

  return <TestimonialsSection testimonials={testimonials} />;
}
```

---

### ZiaQuotePanel

Mascot-based quote panel with personality.

**Location:** `client/components/landing/ZiaQuotePanel.tsx`

**Props:**
```typescript
interface ZiaQuotePanelProps {
  // No props - fully static
}
```

**Features:**
- Zia zebra mascot illustration
- Inspirational or humorous quote
- Personal touch to landing page
- Brand personality element

**Usage:**
```jsx
import { ZiaQuotePanel } from '@/components/landing/ZiaQuotePanel';

export default function Page() {
  return <ZiaQuotePanel />;
}
```

---

### FinalCTASection

Dark variant final call-to-action section.

**Location:** `client/components/landing/FinalCTASection.tsx`

**Props:**
```typescript
interface FinalCTASectionProps {
  onCTA?: () => void;  // Called when primary button is clicked
}
```

**Features:**
- Dark background for contrast
- Strong headline and subheadline
- Primary and secondary CTA buttons
- High conversion focus
- Often placed at page bottom

**Usage:**
```jsx
import { FinalCTASection } from '@/components/landing/FinalCTASection';

export default function Page() {
  return <FinalCTASection onCTA={() => handleSignup()} />;
}
```

---

### DashboardVisual

Mock dashboard card showing product interface.

**Location:** `client/components/landing/DashboardVisual.tsx`

**Props:**
```typescript
interface DashboardVisualProps {
  // No props - mock data only
}
```

**Features:**
- Dashboard mockup display
- Static metrics and layout
- Visual product showcase
- Screenshot or SVG illustration

**Usage:**
```jsx
import { DashboardVisual } from '@/components/landing/DashboardVisual';

export default function Page() {
  return <DashboardVisual />;
}
```

---

### ProblemVisuals

Grid of problem illustrations.

**Location:** `client/components/landing/ProblemVisuals.tsx`

**Props:**
```typescript
interface ProblemVisualsProps {
  // No props - fully static
}
```

**Features:**
- 4 problem illustration cards
- Responsive grid layout
- SVG or image illustrations
- Visual pain point representation

**Usage:**
```jsx
import { ProblemVisuals } from '@/components/landing/ProblemVisuals';

export default function Page() {
  return <ProblemVisuals />;
}
```

---

## Dashboard Components

Dashboard components are designed for authenticated users and can accept real data via props.

### ZiaMascot

Reusable mascot component with size options.

**Location:** `client/components/dashboard/ZiaMascot.tsx`

**Props:**
```typescript
interface ZiaMascotProps {
  size?: 'sm' | 'md' | 'lg';  // Default: 'md'
  className?: string;         // Additional CSS classes
}
```

**Features:**
- Scalable Zia illustration
- Size variants for different contexts
- Pure SVG or image-based
- Brand personality element

**Usage:**
```jsx
import { ZiaMascot } from '@/components/dashboard/ZiaMascot';

export default function Dashboard() {
  return (
    <div>
      <ZiaMascot size="lg" />
      <ZiaMascot size="sm" className="mb-4" />
    </div>
  );
}
```

---

### GoodNews

Dashboard hero banner with key metrics.

**Location:** `client/components/dashboard/GoodNews.tsx`

**Props:**
```typescript
interface MetricsData {
  postsScheduled: number;
  engagementRate: number;
  roi: string;
}

interface GoodNewsProps {
  data?: MetricsData;  // Optional real metrics
}
```

**Features:**
- Welcome message with Zia mascot
- 3 key metric cards (posts, engagement, ROI)
- Mock data included
- Responsive layout
- Animated counters (optional)

**Usage:**
```jsx
import { GoodNews } from '@/components/dashboard/GoodNews';

export default function Dashboard() {
  const metrics = {
    postsScheduled: 42,
    engagementRate: 8.5,
    roi: "+312%"
  };

  return <GoodNews data={metrics} />;
}
```

---

### InsightsFeed

AI-generated insights panel.

**Location:** `client/components/dashboard/InsightsFeed.tsx`

**Props:**
```typescript
interface Insight {
  id: string;
  title: string;
  description: string;
  actionable: boolean;
  icon?: string;
}

interface InsightsFeedProps {
  insights?: Insight[];  // Optional real insights
}
```

**Features:**
- 4-card insights grid
- Sticky positioning on desktop
- Actionable insights highlighting
- Mock data included
- Responsive collapse on mobile

**Usage:**
```jsx
import { InsightsFeed } from '@/components/dashboard/InsightsFeed';

export default function Dashboard() {
  const insights = [
    {
      id: '1',
      title: "Best Time to Post",
      description: "Tue 2-4 PM gets 40% more engagement",
      actionable: true,
    },
    // ... more insights
  ];

  return <InsightsFeed insights={insights} />;
}
```

---

### Sparkline

Animated trend sparkline chart.

**Location:** `client/components/dashboard/Sparkline.tsx`

**Props:**
```typescript
interface SparklineProps {
  data: number[];           // Array of data points
  trend?: 'up' | 'down';    // Trend indicator
  className?: string;       // Additional CSS classes
}
```

**Features:**
- Small inline chart visualization
- Data point animation
- Trend indicator (up/down arrow)
- Responsive sizing
- Pure SVG implementation

**Usage:**
```jsx
import { Sparkline } from '@/components/dashboard/Sparkline';

export default function MetricsCard() {
  const data = [10, 15, 12, 18, 22, 25, 28];

  return <Sparkline data={data} trend="up" />;
}
```

---

### CalendarAccordion

7-day expandable schedule calendar.

**Location:** `client/components/dashboard/CalendarAccordion.tsx`

**Props:**
```typescript
interface ScheduleItem {
  date: string;        // YYYY-MM-DD format
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
  time: string;        // HH:MM format
  content: string;     // Post content preview
  status: 'scheduled' | 'published' | 'draft';
}

interface CalendarAccordionProps {
  schedule?: ScheduleItem[];  // Optional real schedule
}
```

**Features:**
- 7-day collapsible schedule
- Platform icons (Instagram, Facebook, Twitter, LinkedIn)
- Time and content display
- Status indicators
- Mock data included

**Usage:**
```jsx
import { CalendarAccordion } from '@/components/dashboard/CalendarAccordion';

export default function Dashboard() {
  const schedule = [
    {
      date: '2024-11-12',
      platform: 'instagram',
      time: '14:00',
      content: 'New campaign announcement...',
      status: 'scheduled'
    },
    // ... more items
  ];

  return <CalendarAccordion schedule={schedule} />;
}
```

---

### AnalyticsPanel

Performance metrics grid display.

**Location:** `client/components/dashboard/AnalyticsPanel.tsx`

**Props:**
```typescript
interface MetricItem {
  label: string;
  value: string | number;
  change?: string;      // e.g., "+12%"
  trend?: 'up' | 'down';
}

interface AnalyticsPanelProps {
  metrics?: MetricItem[];  // Optional real metrics
}
```

**Features:**
- Grid of key performance indicators
- Value + change display
- Trend indicators (up/down arrows)
- Responsive grid layout
- Mock data included

**Usage:**
```jsx
import { AnalyticsPanel } from '@/components/dashboard/AnalyticsPanel';

export default function Dashboard() {
  const metrics = [
    { label: "Reach", value: "12.5K", change: "+18%", trend: "up" },
    { label: "Engagement", value: "8.3%", change: "+5%", trend: "up" },
    { label: "Conversions", value: "342", change: "-2%", trend: "down" },
    // ... more metrics
  ];

  return <AnalyticsPanel metrics={metrics} />;
}
```

---

## Component State Management

### Mock Data Strategy

All components come with built-in mock data. To use real data:

1. **Pass props** to override mock data
2. **Parent component** manages API calls
3. **Keep components** presentational and stateless

```jsx
// Parent component (smart)
export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Fetch from API
    fetchDashboardMetrics().then(setMetrics);
  }, []);

  // Child components (dumb)
  return (
    <GoodNews data={metrics} />
  );
}
```

### Optional Props Pattern

Components use optional props for real data:

```typescript
// If prop is provided, use real data
// Otherwise, use mock data from component

interface ComponentProps {
  data?: RealData;
}

export function Component({ data }: ComponentProps) {
  const displayData = data || MOCK_DATA;

  return <div>{displayData.value}</div>;
}
```

---

## Props Reference

### Common Props Across Components

```typescript
// Optional CTA callback
onCTA?: () => void

// Optional data override
data?: DataType

// Optional className for styling
className?: string

// Optional size variant
size?: 'sm' | 'md' | 'lg'

// Optional trend indicator
trend?: 'up' | 'down'
```

### Data Type Examples

```typescript
// Testimonial
interface Testimonial {
  name: string;
  company: string;
  role: string;
  quote: string;
  avatar?: string;
  logo?: string;
  rating?: number;  // 1-5 stars
}

// Schedule Item
interface ScheduleItem {
  date: string;        // YYYY-MM-DD
  platform: string;    // social platform
  time: string;        // HH:MM
  content: string;     // preview text
  status: 'scheduled' | 'published' | 'draft';
}

// Metric
interface MetricItem {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
}
```

---

## Styling & Customization

All components use Tailwind CSS classes and CSS variables for styling:

```jsx
// Add custom classes
<HeroSection className="my-custom-class" />

// Override spacing
<GoodNews data={metrics} className="p-8" />

// Combine with other styles
<ZiaMascot size="lg" className="mx-auto mb-8" />
```

### CSS Variable Access

```jsx
// Use in component styles
<div style={{ color: 'var(--color-indigo-600)' }}>
  Custom styled content
</div>
```

---

## Performance Considerations

- **Components are lightweight** - No heavy dependencies
- **Animations are GPU-accelerated** - Smooth 60fps
- **Lazy loading ready** - Can be code-split with React.lazy()
- **Accessibility included** - ARIA labels and semantic HTML

---

## Common Integration Patterns

### Landing Page

```jsx
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { PromiseSection } from '@/components/landing/PromiseSection';
import { FinalCTASection } from '@/components/landing/FinalCTASection';

export default function LandingPage() {
  const handleCTA = () => {
    navigate('/signup');
  };

  return (
    <main>
      <HeroSection onCTA={handleCTA} />
      <ProblemSection />
      <PromiseSection onCTA={handleCTA} />
      <FinalCTASection onCTA={handleCTA} />
    </main>
  );
}
```

### Dashboard Layout

```jsx
import { GoodNews } from '@/components/dashboard/GoodNews';
import { InsightsFeed } from '@/components/dashboard/InsightsFeed';
import { CalendarAccordion } from '@/components/dashboard/CalendarAccordion';
import { AnalyticsPanel } from '@/components/dashboard/AnalyticsPanel';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    loadDashboardData().then(setMetrics);
  }, []);

  return (
    <div className="space-y-6">
      <GoodNews data={metrics} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InsightsFeed />
        <CalendarAccordion />
        <AnalyticsPanel />
      </div>
    </div>
  );
}
```

---

## Next Steps

1. **Choose components** for your pages
2. **Pass real data** via props
3. **Wire up CTAs** with navigation or callbacks
4. **Customize styling** with Tailwind classes
5. **Test responsiveness** across devices

For detailed design system information, see [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

For integration guidance, see [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md).
