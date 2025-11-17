# Phase 5 - Posting Quotas & Agent Orchestration

**Status**: ✅ Core Components Implemented  
**Goal**: Automated, performance-responsive content production at scale

---

## 🎯 System Overview

**Baseline**: ~25-40 content pieces per month per brand (customizable)

**Agents Working Together**:

1. **Advisor Agent** → Analyzes data → Recommends content mix & times
2. **Doc Agent** → Generates copy (captions, blogs, emails)
3. **Design Agent** → Creates visuals (templates, storyboards)
4. **Human** → Reviews, approves, gives feedback

**Performance-Responsive**: Auto-adjusts frequency based on engagement, growth, and failures

---

## 📦 What's Been Implemented

### 1. Type Definitions

**File**: `client/types/content-quota.ts` (400 lines)

**Key Types**:

- `PlatformQuota`: Default posting ranges per platform
- `ContentMix`: Breakdown of content types per platform
- `MonthlyContentPlan`: Advisor Agent output contract
- `PerformanceAdjustment`: Auto-tuning rules
- `BrandPostingConfig`: User-customizable settings
- `ScheduledContent`: Calendar entries
- `WeeklySummary`: Dashboard metrics

**Default Quotas**:

```typescript
{
  instagram: 3-5 posts/week (12-20/month) → Reels, carousels, images
  facebook: 3-5 posts/week (12-20/month) → Mix of formats
  linkedin: 2-3 posts/week (8-12/month) → Thought leadership
  twitter: 3-5 posts/week (12-20/month) → Snippets, quotes
  tiktok: 2 posts/week (8/month) → Short-form video
  blog: 1 post/week (4/month) → SEO content
  email: 1 per week (4/month) → Newsletters
  google_business: 1 per week (4/month) → Local updates
}
```

**Posting Frequency Presets**:

- **Light**: 70% of standard (~15-25 posts/month)
- **Standard**: 100% baseline (~25-40 posts/month)
- **Aggressive**: 150% of standard (~40-60 posts/month)

---

### 2. Database Schema

**File**: `supabase/migrations/20250118_create_content_calendar_tables.sql` (301 lines)

**New Tables**:

1. **`monthly_content_plans`**
   - Stores Advisor's monthly plan (total pieces, platforms, best times, topics)
   - One plan per brand per month

2. **`scheduled_content`**
   - Content calendar entries
   - Fields: platform, content_type, funnel_stage, body, hashtags, scheduled_for, status
   - Status: draft → pending_review → approved → scheduled → published

3. **`weekly_summaries`**
   - Dashboard metrics (posts published, awaiting approval, reach/engagement changes)
   - Suggested actions (generate more, regenerate low, rebalance)

4. **`performance_metrics`**
   - Per-platform performance data (reach, engagement, follower growth, failed posts)
   - Used for auto-adjustment rules

5. **`performance_adjustments`**
   - Audit trail for auto-tuning (before/after configs)

**New Column on `brands`**:

- `posting_config` (JSONB): Frequency, platforms enabled, approval workflow, AI threshold

---

### 3. Performance Adjustment Engine

**File**: `server/agents/performance-adjuster.ts` (298 lines)

**Auto-Tuning Rules**:

| Condition        | Threshold | Action             | Details                        |
| ---------------- | --------- | ------------------ | ------------------------------ |
| **Engagement ↑** | > 25%     | Increase frequency | +1 post/week on top 2 channels |
| **Engagement ↓** | > 20%     | Decrease frequency | -1 post/week; focus quality    |
| **Growth flat**  | 2+ months | Shift mix          | 60% awareness → 40% conversion |
| **Failed posts** | > 2/month | Audit integrations | Flag for user review           |

**Functions**:

- `analyzePerformance()`: Evaluates metrics and determines adjustments
- `applyAdjustments()`: Updates posting config automatically
- `generateSuggestedActions()`: Creates dashboard action buttons
- `calculateSuccessMetrics()`: Tracks system performance

---

## 🔄 Content Production Pipeline

### Step 1: Advisor Analyzes (Monthly)

**Input**: Last 30-90 days of post performance data

**Process**:

```typescript
1. Query performance_metrics table
2. Identify top performers (by engagement rate)
3. Find patterns (topics, times, formats, platforms)
4. Generate MonthlyContentPlan:
   {
     "total_pieces": 35,
     "platforms": [
       {
         "platform": "instagram",
         "total_posts": 16,
         "breakdown": {
           "reel": { count: 8, percentage: 0.5 },
           "carousel": { count: 5, percentage: 0.3 },
           "image": { count: 3, percentage: 0.2 }
         },
         "funnel_distribution": {
           "top": 0.50,  // 50% awareness
           "mid": 0.30,  // 30% education
           "bottom": 0.20 // 20% conversion
         }
       },
       // ... linkedin, blog, etc.
     ],
     "best_times": [
       { "platform": "instagram", "day": "Thursday", "slot": "18:00", "confidence": 0.85 }
     ],
     "top_topics": ["Testimonials", "BTS", "Tips & Tricks"]
   }
5. Cache plan for 24h in monthly_content_plans table
```

**Triggers**:

- 1st of each month (auto-generate)
- User clicks "Regenerate Monthly Plan"
- Performance adjustment detected

---

### Step 2: Doc Generates Copy (Weekly Batches)

**Input**: Topic from MonthlyContentPlan + Brand Kit

**Process**:

```typescript
1. Load prompt template (v1.0)
2. Inject brand variables (tone, banned phrases, disclaimers, etc.)
3. For each content piece in plan:
   {
     "topic": "Testimonial Tuesday",
     "platform": "instagram",
     "content_type": "carousel",
     "funnel_stage": "mid",
     "tone": "educational-warm"
   }
4. Call OpenAI/Claude with Doc Agent prompt
5. Run BFS scorer (must be ≥ 0.80)
6. Run linter (profanity, compliance, platform limits)
7. Auto-fix if possible (disclaimers, hashtags, shorten)
8. Create scheduled_content record (status: pending_review)
```

**Output** (stored in `scheduled_content`):

```json
{
  "platform": "instagram",
  "content_type": "carousel",
  "funnel_stage": "mid",
  "headline": "5 Reasons Clients Love Working With Us",
  "body": "Slide 1: Reason #1...",
  "cta": "Tap the link in bio to learn more",
  "hashtags": ["#Testimonial", "#ClientLove"],
  "scheduled_for": "2025-01-23T18:00:00Z",
  "status": "pending_review",
  "bfs_score": 0.87
}
```

---

### Step 3: Design Creates Visuals (Parallel)

**Input**: DocOutput + Brand Kit visual identity

**Process**:

```typescript
1. Read Doc's output (headline, post_theme, tone, aspect_ratio)
2. Load Design Agent prompt
3. Generate visual recommendations:
   {
     "cover_title": "5 Reasons Clients Love Us",
     "template_ref": "carousel-5-slide-testimonial",
     "alt_text": "Five-slide carousel showing client testimonials...",
     "visual_elements": ["Slide 1: Quote + client photo", ...],
     "color_palette_used": ["#0A4A4A", "#EC4899"],
     "font_suggestions": ["Outfit Bold for headlines"]
   }
4. Attach to scheduled_content record (media_urls field)
```

---

### Step 4: Human Reviews & Approves

**UI Flow**:

1. Dashboard shows "3 posts awaiting approval"
2. User opens review queue
3. Sees content with BFS score, linter results
4. **Options**:
   - ✅ **Approve** → status: approved
   - ❌ **Reject** → status: rejected
   - ✏️ **Edit then Approve** → status: approved, revision++
   - 🔄 **Regenerate** → Creates new generation

**Pre-Flight Checklist** (before approve):

- [x] BFS score ≥ 0.80
- [x] Linter passed (no profanity, banned phrases)
- [x] Required disclaimers present
- [x] Platform limits respected

---

### Step 5: Auto-Schedule & Publish

**Trigger**: Content approved + scheduled_for time reached

**Process**:

```typescript
1. Cron job checks scheduled_content WHERE status = 'approved' AND scheduled_for <= NOW()
2. For each entry:
   - Update status: 'scheduled' → 'publishing'
   - Call platform API (Instagram, LinkedIn, etc.)
   - If success: status = 'published', published_at = NOW()
   - If fail: status = 'failed', error = [reason]
3. Update weekly_summaries (increment posts_published or failed_posts)
```

**Publishing API Integration** (future):

- Instagram Graph API
- LinkedIn Share API
- Twitter API
- Facebook Pages API
- Google My Business API

---

### Step 6: Advisor Learns & Adapts

**Weekly** (every Monday):

```typescript
1. Calculate performance_metrics for last 7 days
2. Compare to previous week/month
3. Run analyzePerformance()
4. If adjustments needed:
   - Log to performance_adjustments table
   - Update posting_config
   - Notify user of changes
5. Generate weekly_summaries with suggested actions
```

**Monthly** (1st of month):

```typescript
1. Analyze last 30 days
2. Generate new MonthlyContentPlan
3. Auto-apply performance adjustments
4. Queue next month's content for Doc/Design
```

---

## 🎨 Dashboard UI (Weekly Summary)

### Weekly Summary Card (Example)

```tsx
<Card className="p-6">
  <h3 className="text-xl font-semibold mb-4">Week of Jan 15–21</h3>

  <div className="grid grid-cols-2 gap-4 mb-6">
    <StatCard icon={<CheckCircle2 />} label="Posts Published" value={18} />
    <StatCard icon={<Clock />} label="Awaiting Approval" value={3} />
    <StatCard icon={<Sparkles />} label="New AI Insights" value={3} />
    <StatCard
      icon={<TrendingUp />}
      label="Reach Change"
      value="+14%"
      trend="up"
    />
  </div>

  <div className="space-y-2">
    <h4 className="font-medium">Suggested Actions</h4>
    <Button variant="outline" className="w-full justify-start">
      <Sparkles className="mr-2 h-4 w-4" />
      Generate 5 More Like These
    </Button>
    <Button variant="outline" className="w-full justify-start">
      <RotateCcw className="mr-2 h-4 w-4" />
      Regenerate 3 Low-Performers
    </Button>
    <Button variant="outline" className="w-full justify-start">
      <Sliders className="mr-2 h-4 w-4" />
      Rebalance This Week's Plan
    </Button>
  </div>
</Card>
```

---

## ⚙️ Settings UI (Brand Posting Config)

### Posting Frequency Selector

```tsx
<div>
  <Label>Posting Frequency</Label>
  <RadioGroup value={frequency} onValueChange={setFrequency}>
    <RadioGroupItem value="light">Light (~15-25 posts/month)</RadioGroupItem>
    <RadioGroupItem value="standard">
      Standard (~25-40 posts/month) - Recommended
    </RadioGroupItem>
    <RadioGroupItem value="aggressive">
      Aggressive (~40-60 posts/month)
    </RadioGroupItem>
  </RadioGroup>
</div>
```

### Platform Toggles

```tsx
<div>
  <Label>Platforms Enabled</Label>
  {platforms.map((platform) => (
    <div key={platform} className="flex items-center justify-between">
      <Label>{platform}</Label>
      <Switch
        checked={config.platforms_enabled.includes(platform)}
        onCheckedChange={(checked) => togglePlatform(platform, checked)}
      />
    </div>
  ))}
</div>
```

### Content Type Weighting (per platform)

```tsx
<div>
  <Label>Instagram Content Mix</Label>
  <Slider
    label="Reels"
    value={weighting.instagram.reel}
    onChange={(val) => updateWeighting("instagram", "reel", val)}
  />
  <Slider
    label="Carousels"
    value={weighting.instagram.carousel}
    onChange={(val) => updateWeighting("instagram", "carousel", val)}
  />
  <Slider
    label="Images"
    value={weighting.instagram.image}
    onChange={(val) => updateWeighting("instagram", "image", val)}
  />
</div>
```

### Approval Workflow

```tsx
<div>
  <Label>Approval Workflow</Label>
  <Select value={config.approval_workflow} onValueChange={setWorkflow}>
    <SelectItem value="manual">Manual Review (Default)</SelectItem>
    <SelectItem value="auto">Auto-Approve (BFS ≥ 0.9)</SelectItem>
  </Select>
</div>
```

### AI Confidence Threshold

```tsx
<div>
  <Label>AI Confidence Threshold</Label>
  <Slider
    min={0.7}
    max={1.0}
    step={0.05}
    value={config.ai_confidence_threshold}
    onChange={setThreshold}
  />
  <p className="text-sm text-muted-foreground">
    Current: {config.ai_confidence_threshold} (Higher = stricter quality)
  </p>
</div>
```

---

## 🔒 Safeguards & Quality Gates

### 1. No Auto-Publish Without Approval

**Rule**: `status` must be `approved` before auto-publishing

**Exception**: If `approval_workflow = 'auto'` AND `bfs_score >= 0.9`, then auto-approve

### 2. Quota Enforcement

**Rule**: Agents cannot generate more than `max_posts_per_month * 1.2` (120% of quota)

**Prevention**: Doc Agent checks `scheduled_content` count before generating new piece

### 3. Reels & Videos Require Review

**Rule**: `content_type = 'reel' | 'video'` → Always `status = 'pending_review'`

**Reason**: Visual content higher risk for off-brand imagery

### 4. Weekly Audit

**Cron Job** (every Monday):

```typescript
- Check posting frequency (not exceeding quotas)
- Check approval compliance (no unapproved posts published)
- Check channel connections (test API keys)
- Flag issues for user review
```

---

## 📊 Success Metrics

### System Performance Targets

| Metric                    | Target | How to Measure                                                                  |
| ------------------------- | ------ | ------------------------------------------------------------------------------- |
| **Auto-Generation Rate**  | ≥ 90%  | `SELECT COUNT(*) / total_planned FROM scheduled_content`                        |
| **Approval Without Edit** | ≥ 80%  | `SELECT COUNT(*) FROM scheduled_content WHERE revision = 1 AND approved = TRUE` |
| **Avg BFS Score**         | ≥ 0.85 | `SELECT AVG(bfs_score) FROM scheduled_content`                                  |
| **On-Time Publication**   | ≥ 95%  | `SELECT COUNT(*) WHERE ABS(published_at - scheduled_for) < '5 minutes'`         |
| **MoM Engagement Growth** | +10%   | Compare `performance_metrics.avg_engagement_rate` month-over-month              |

### Dashboard Query (Example)

```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'published') AS published,
  COUNT(*) FILTER (WHERE status = 'pending_review') AS pending,
  AVG(bfs_score) AS avg_bfs,
  COUNT(*) FILTER (WHERE auto_approved = TRUE) AS auto_approved,
  COUNT(*) FILTER (WHERE ABS(EXTRACT(EPOCH FROM (published_at - scheduled_for))) < 300) AS on_time
FROM scheduled_content
WHERE brand_id = :brand_id
  AND created_at >= NOW() - INTERVAL '30 days';
```

---

## 🚀 Optional Expansion Ideas

### 1. AI Sprint Mode

**Feature**: Generate 30 days of content in one click

**Use Case**: Seasonal campaigns, product launches, events

**Implementation**:

```typescript
async function generateSprint(brandId: string, days: number) {
  const plan = await generateMonthlyContentPlan(brandId);
  const allContent = [];

  for (let day = 0; day < days; day++) {
    const todaysContent = await generateContentForDay(plan, day);
    allContent.push(...todaysContent);
  }

  return allContent; // All scheduled, awaiting approval
}
```

---

### 2. Adaptive Frequency

**Feature**: AI suggests lowering/raising output during slow/high seasons

**Triggers**:

- December holidays → Suggest reducing frequency
- Product launch week → Suggest increasing frequency
- Summer slowdown → Suggest focusing on evergreen content

**Implementation**:

```typescript
function detectSeason(month: number): { adjustment: number; reason: string } {
  if (month === 12)
    return { adjustment: 0.7, reason: "Holiday season slowdown" };
  if (month === 7 || month === 8)
    return { adjustment: 0.8, reason: "Summer slowdown" };
  return { adjustment: 1.0, reason: "Normal" };
}
```

---

### 3. Human Override Mode

**Feature**: CSM/Brand Manager can bulk-shift all posts by date or platform

**UI**:

```tsx
<Button onClick={openOverrideModal}>
  <Settings /> Bulk Override
</Button>

<Modal>
  <Label>Shift all posts by:</Label>
  <Input type="number" placeholder="Days" />

  <Label>Or change platform:</Label>
  <Select>
    <Option>Instagram → LinkedIn</Option>
    <Option>LinkedIn → Twitter</Option>
  </Select>

  <Button>Apply to 18 scheduled posts</Button>
</Modal>
```

---

## 🧪 Testing Checklist

### Unit Tests

- [ ] `calculateMonthlyQuota()` with different frequencies
- [ ] `generateContentMix()` with custom weightings
- [ ] `analyzePerformance()` with mock performance data
- [ ] `applyAdjustments()` updates config correctly
- [ ] `generateSuggestedActions()` returns correct actions

### Integration Tests

- [ ] Advisor → Doc → Design pipeline (full flow)
- [ ] BFS scorer integration with Doc Agent
- [ ] Linter integration with auto-fix
- [ ] Scheduler publishes at correct time
- [ ] Performance adjustment triggers on threshold

### Acceptance Tests

- [ ] Generate 30 days of content for a brand
- [ ] Auto-adjust frequency when engagement up 25%
- [ ] Flag failed posts after 2 failures
- [ ] Weekly summary displays correct metrics
- [ ] Settings UI updates posting_config

---

## 📁 Files Summary

```
client/types/content-quota.ts                          400 lines ✅
supabase/migrations/20250118_create_content_calendar_tables.sql  301 lines ✅
server/agents/performance-adjuster.ts                  298 lines ✅
PHASE_5_POSTING_QUOTAS_IMPLEMENTATION.md               ~600 lines ✅
───────────────────────────────────────────────────────────────
Total: ~1,600 lines implemented
```

---

## 🎯 Next Steps

### Week 1: Core Pipeline

1. **Deploy database migration** (`supabase db push`)
2. **Create API endpoints** for monthly plan generation
3. **Integrate Doc Agent** with content calendar
4. **Build review queue UI** (approve/reject/regenerate)

### Week 2: Automation

5. **Set up cron jobs** (weekly summaries, auto-publish)
6. **Implement performance adjuster** (auto-tune frequency)
7. **Build dashboard summary** widget
8. **Test end-to-end** (Advisor → Doc → Design → Publish)

### Week 3: Settings & Polish

9. **Build settings UI** (frequency, platforms, approval workflow)
10. **Add suggested action buttons** (generate more, regenerate, rebalance)
11. **Create success metrics** dashboard
12. **Performance testing** (ensure < 10s generation time)

---

**Status**: ✅ **Core Components Ready**  
**Baseline**: ~25-40 content pieces/month/brand  
**Auto-Tuning**: Performance-responsive frequency adjustment

**Created**: January 2025  
**Author**: Fusion AI  
**Version**: 1.0
