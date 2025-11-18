# Content Planning and Generation Documentation

## Overview

The Content Planning Service uses all three AI agents (Copywriter/Doc, Advisor, Creative/Design) to generate a complete 7-day content plan during onboarding. This includes:

1. **Copywriter (Doc Agent)** - Completes brand guide based on crawler data
2. **Advisor Agent** - Recommends plan of action
3. **Creative/Design Agent** - Plans and generates content (5 social posts, blog, email)

## Workflow

### Onboarding Integration

The content planning step runs automatically as **Step 6** in the onboarding workflow:

1. Website Crawl
2. Brand Guide Generation
3. Starter Strategy (Advisor)
4. Sample Content
5. Brand Narrative Summary
6. **Content Planning & Generation** ← NEW

### Content Generation Process

1. **Brand Guide Completion** (Doc Agent):
   - Fills in missing brand guide fields based on scraped content
   - Enhances existing fields with more specific details
   - Uses scraped headlines, about text, and services
   - Stores completed fields in `brand_kit`

2. **Advisor Recommendations** (Advisor Agent):
   - Provides 5-7 specific, actionable recommendations
   - Focuses on content types, posting frequency, platform strategy
   - Based on brand identity, audience, and goals
   - Stored in `brand_kit.advisorRecommendations`

3. **Content Planning** (Creative/Design Agent):
   - Generates 5 social media posts (mix of platforms)
   - Generates 1 blog post
   - Generates 1 email campaign
   - Schedules content across 7 days (distributed evenly)
   - Each post is on-brand, engaging, and aligned with brand guide

### Content Storage

All generated content is stored in the `content_items` table with:
- `brand_id` - Brand identifier
- `title` - Content title
- `content_type` - "post", "blog", or "email"
- `platform` - Platform name (instagram, facebook, linkedin, twitter, email, blog)
- `body` - Full content text
- `media_urls` - Array of image URLs (from scraped images)
- `scheduled_for` - ISO timestamp (date + time)
- `status` - "draft" (can be edited/published later)
- `generated_by_agent` - "content-planning-service"

## API Endpoints

### GET /api/content-plan/:brandId

Get the 7-day content plan for a brand.

**Response:**
```json
{
  "success": true,
  "contentPlan": {
    "brandId": "uuid",
    "items": [
      {
        "id": "uuid",
        "title": "Post title",
        "contentType": "post",
        "platform": "instagram",
        "content": "Full content text...",
        "scheduledDate": "2024-01-15",
        "scheduledTime": "09:00",
        "imageUrl": "https://...",
        "status": "draft"
      }
    ],
    "advisorRecommendations": [
      "Post 3-5 times per week on primary platforms",
      "Focus on educational and value-driven content",
      ...
    ],
    "generatedAt": "2024-01-14T10:00:00Z"
  }
}
```

### POST /api/content-plan/:brandId/generate

Generate a new content plan for a brand (triggers all AI agents).

**Response:**
```json
{
  "success": true,
  "contentPlan": {
    "brandId": "uuid",
    "items": [...],
    "advisorRecommendations": [...],
    "generatedAt": "2024-01-14T10:00:00Z"
  },
  "message": "Content plan generated successfully"
}
```

## Frontend Integration

### Screen 7: Content Generation

`client/pages/onboarding/Screen7ContentGeneration.tsx`:
- Calls `POST /api/content-plan/:brandId/generate`
- Shows progress through each content item
- Stores generated content in localStorage for Screen 8

### Screen 8: Calendar Preview

`client/pages/onboarding/Screen8CalendarPreview.tsx`:
- Calls `GET /api/content-plan/:brandId`
- Displays content in 7-day calendar view
- Shows advisor recommendations
- Allows drag-and-drop rescheduling

### Content Studio

Generated content automatically appears in the Content Studio because:
- Content is stored in `content_items` table
- Studio queries `content_items` by `brand_id`
- Content has `status: "draft"` so it can be edited/published

## Content Structure

### Social Posts (5 items)

- Mix of platforms: Instagram, Facebook, LinkedIn, Twitter
- Each post includes:
  - Full content text
  - Scheduled date/time (distributed across 7 days)
  - Image URL (from scraped brand images)
  - Platform-specific formatting

### Blog Post (1 item)

- Full blog post content
- Scheduled for one day in the 7-day plan
- Can be expanded/edited in studio

### Email Campaign (1 item)

- Email content (subject + body)
- Scheduled for one day in the 7-day plan
- Can be customized in studio

## Advisor Recommendations

Stored in `brand_kit.advisorRecommendations` as an array of strings:

```json
{
  "advisorRecommendations": [
    "Post 3-5 times per week on primary platforms",
    "Focus on educational and value-driven content",
    "Engage with audience comments within 24 hours",
    "Use brand colors and imagery consistently",
    "Test different content formats to find what resonates"
  ]
}
```

## Error Handling

- If AI generation fails, system falls back to default content plan
- Default plan includes 7 placeholder items that can be edited
- Errors are logged but don't block onboarding completion
- Content can be regenerated manually via API

## Testing

To test content generation:

1. Complete onboarding steps 1-5 (crawl, brand guide, strategy, sample content, summary)
2. Step 6 automatically generates content plan
3. Check `content_items` table for 7 new items
4. Verify content appears in:
   - Screen 8 (Calendar Preview)
   - Content Studio
   - Calendar view

## Manual Regeneration

Content can be regenerated manually:

```bash
POST /api/content-plan/:brandId/generate
Authorization: Bearer <token>
```

This will:
- Complete brand guide (if needed)
- Generate new advisor recommendations
- Create new content plan (replaces existing items)

## Database Schema

### content_items table

```sql
CREATE TABLE content_items (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  title TEXT NOT NULL,
  content_type TEXT NOT NULL, -- "post", "blog", "email"
  platform TEXT, -- "instagram", "facebook", "linkedin", "twitter", "email", "blog"
  body TEXT, -- Full content text
  media_urls TEXT[], -- Array of image URLs
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft',
  generated_by_agent TEXT, -- "content-planning-service"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### brands.brand_kit (JSONB)

```json
{
  "advisorRecommendations": ["recommendation 1", "recommendation 2", ...],
  "contentPlanGeneratedAt": "2024-01-14T10:00:00Z",
  "brandGuideCompletedAt": "2024-01-14T10:00:00Z",
  ...
}
```

