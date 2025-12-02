# POSTD Site Map (v1.0)

> **Status:** ✅ Active – This is an active sitemap reference for POSTD.  
> **Last Updated:** 2025-01-20

## Overview

This document serves as the master map for POSTD, showing every page, section, subflow, and how different user roles interact with the platform.

---

## A. Public / Marketing Layer

**Accessible without login; marketing and onboarding pages**

### 1. Homepage (`/`)

- **Purpose**: Product overview and conversion
- **Sections**:
  - Hero with value proposition
  - AI Agent showcase (Doc, Design, Advisor)
  - Feature highlights
  - Social proof / testimonials
  - Pricing tiers overview
  - CTA: Sign Up / Login buttons
- **Route**: `/`
- **Component**: `client/pages/Index.tsx`

### 2. Features

- **Purpose**: Deep dive into AI capabilities
- **Sections**:
  - Doc Agent (POSTD Words) - Content generation
  - Design Agent (POSTD Creative) - Visual creation
  - Advisor Agent (POSTD Insights) - Data-driven recommendations
  - Platform integrations showcase
  - Workflow automation examples
- **Route**: `/features` _(to be implemented)_
- **Status**: 🔄 Planned

### 3. Integrations

- **Purpose**: Showcase supported platforms
- **Sections**:
  - Tier 1 Platforms (Meta, LinkedIn, TikTok, X, Google Business, Pinterest, YouTube, Squarespace, Mailchimp, WordPress)
  - Tier 2 E-Commerce (Shopify, WooCommerce)
  - Coming Soon (Faire, RangeMe)
  - Integration benefits
  - OAuth security details
- **Route**: `/integrations-marketing` _(to be implemented)_
- **Status**: 🔄 Planned

### 4. Pricing / Plans

- **Purpose**: Transparent pricing and plan comparison
- **Plans**:
  - **Solo**: Individual creators ($49/mo)
  - **Agency**: Teams and agencies ($199/mo)
  - **Enterprise**: Custom solutions (Contact sales)
- **Features Comparison Table**
- **Route**: `/pricing` _(to be implemented)_
- **Status**: 🔄 Planned

### 5. About / Contact / Legal

- **About Us**: Company mission and team
- **Contact**: Support form and sales contact
- **Terms of Service**: Legal agreement
- **Privacy Policy**: Data handling and privacy
- **Support**: Help center access
- **Route**: `/about`, `/contact`, `/terms`, `/privacy` _(to be implemented)_
- **Status**: 🔄 Planned

---

## B. Authenticated App

### 1. Global Layout

**Component**: `client/components/layout/AppLayout.tsx`

#### Sidebar Navigation

```
┌─ POSTD Logo
├─ Brand Switcher (dropdown)
│
├─ 📊 Dashboard
├─ 🏢 Brands
├─ ✏️ Create Post
├─ 📅 Calendar
├─ 📁 Assets
├─ 📈 Analytics
├─ 🔌 Integrations
├─ ⭐ Reviews
├─ 📆 Events
│
└─ ⚙️ Settings (bottom)
```

#### Top Bar

- **Left**: Search (⌘K trigger)
- **Center**: Current brand badge
- **Right**:
  - Notifications bell
  - Profile menu (Profile, Sign Out)

#### Role-Based Visibility

See Section C for detailed permissions matrix.

---

### 2. Dashboard (Home)

**Route**: `/dashboard`  
**Component**: `client/pages/Dashboard.tsx`  
**Access**: All authenticated users (role-aware views)

#### Purpose

At-a-glance performance, tasks, and AI agent insights for the current brand.

#### Sections

##### Welcome + AI Summary

- Personalized greeting
- Weekly performance highlight ("Reach +14% this week")
- Brand health score

##### Content Pipeline

Status breakdown:

- 📝 **Draft** - Content being created
- 👀 **In Review** - Awaiting approval
- ✅ **Approved** - Ready to schedule
- ⏰ **Scheduled** - Queued for publishing
- 🚀 **Published** - Live on platforms

##### Calendar Snapshot

- 7-day preview
- Quick view of scheduled posts
- Link to full calendar

##### Approvals Queue

- Posts awaiting approval (for Approvers)
- Quick approve/reject actions
- Request edits option

##### Advisor Insights

- Best posting times
- Top-performing topics
- Recommended formats
- Trending hashtags

##### Connection Health & Token Status

- Platform connection status
- Token expiration warnings
- Quick reconnect actions

##### Recent Activity

- Last 10 actions across the brand
- Agent-generated content
- Manual uploads
- Approvals/rejections

##### Quick Create

- Fast access to create:
  - Social post
  - Blog article
  - Email campaign
  - Event

#### Role-Aware Views

| Role                 | View Access                                              |
| -------------------- | -------------------------------------------------------- |
| **Owner/Admin**      | All brands + billing + team health + system metrics      |
| **Strategy Manager** | Analytics + Advisor insights + Approvals + Full pipeline |
| **Brand Manager**    | Pipeline + Quick Create + Assets + Calendar              |
| **Approver/Client**  | Read-only + Approve/Request Edits on assigned content    |
| **Viewer**           | Read-only summary, no actions                            |

---

### 3. Calendar

**Route**: `/calendar`  
**Component**: `client/pages/Calendar.tsx`  
**Access**: All roles (read/write varies)

#### Purpose

Visual scheduling interface for all content across platforms.

#### View Modes

- 📅 **Month View** - Overview of entire month
- 📊 **Week View** - Detailed 7-day schedule
- 📋 **List View** - Chronological list with filters

#### Features

- **Drag-and-drop** rescheduling (Brand Manager+)
- **Multi-brand** view (Admin only)
- **Platform filters** (Instagram, Facebook, LinkedIn, etc.)
- **Status filters** (Draft, Scheduled, Published)
- **Click post** → Opens Post Editor
- **Color coding** by status:
  - Gray: Draft
  - Yellow: In Review
  - Green: Approved
  - Blue: Scheduled
  - Purple: Published

#### Integrations

- Syncs with `social_posts` table
- Reflects `platform_events` for events
- Updates real-time via Supabase subscriptions

---

### 4. Brand Kit / Intake Form

**Route**: `/brand-intake`  
**Component**: `client/pages/BrandIntake.tsx`  
**Access**: Admin, Strategy Manager, Brand Manager

#### Purpose

Comprehensive brand onboarding and AI training data collection.

#### Multi-Section Form (~20 questions)

##### Section 1: Brand Basics

- Brand name
- Website URL
- Tagline
- Short description
- Industry selection
- Primary audience

##### Section 2: Voice & Messaging

- Brand personality traits
- Tone keywords
- Writing style
- Faith/values integration
- Words to avoid
- Common phrases

##### Section 3: Visual Identity

- Primary color (hex picker)
- Secondary color
- Accent color
- Font family
- Font weights
- Logo upload
- Brand imagery upload
- Reference material links

##### Section 4: Content Preferences

- Platforms used
- Post frequency
- Preferred content types
- Hashtags to include
- Competitors / inspiration

##### Section 5: Operational & Compliance

- Approval workflow
- Required disclaimers
- Content restrictions
- Social handles

##### Section 6: AI Training Assets

- Text reference files
- Visual reference files
- Previous content samples
- AI-specific notes

#### Website Crawler Feature

- **Technology**: Playwright + OpenAI
- **Process**:
  1. User provides URL
  2. Crawler scrapes website content
  3. OpenAI summarizes tone, colors, fonts, messaging
  4. Auto-fills form fields
  5. User reviews and approves/edits
- **Manual Override**: User > Crawler for every field
- **Re-scan**: Re-crawl anytime with diff review modal
- **Component**: `server/workers/brand-crawler.ts`

#### AI Snapshot Panel

Real-time summary of:

- Detected tone
- Key keywords
- Brand colors
- Font suggestions
- Content themes

#### Review Diff Modal

- Shows: Previous value | Crawler suggestion | Current value
- User can: Accept All, Accept Individual, Reject All
- Component: `client/components/brand-intake/CrawlerDiffModal.tsx`

---

### 5. Assets Library

**Route**: `/assets`  
**Component**: `client/pages/Assets.tsx`  
**Access**: Admin, Strategy Manager, Brand Manager

#### Purpose

Centralized media management for all brand content.

#### Features

- **Upload**: Images, videos, PDFs, documents
- **Organize**: Folders and tags
- **Search**: Keyword and tag search
- **Filter**: By type, date, usage
- **Preview**: Quick preview modal
- **Edit**: Basic image editing (crop, resize)
- **Usage Tracking**: See which posts use each asset
- **Automatic Processing**:
  - Thumbnail generation
  - Image derivatives (multiple sizes)
  - Video transcoding
  - Metadata extraction

#### Storage

- **Backend**: Supabase Storage
- **Bucket**: `brand-assets`
- **RLS**: Brand-specific isolation
- **CDN**: Automatic caching

---

### 6. Create / Edit Post

**Route**: `/create-post`  
**Component**: `client/pages/CreatePost.tsx`  
**Access**: Admin, Strategy Manager, Brand Manager

#### Purpose

Unified composer for multi-platform content creation.

#### Tier 1 API Support

All content types supported:

1. **Meta (Facebook + Instagram Business)**
   - Feed posts
   - Stories
   - Reels
   - Events

2. **LinkedIn**
   - Updates
   - Articles

3. **TikTok**
   - Short-form videos

4. **X (Twitter)**
   - Tweets with media

5. **Google Business Profile**
   - Posts
   - Offers
   - Events
   - Updates

6. **Pinterest**
   - Pins

7. **YouTube / Shorts**
   - Video uploads
   - Descriptions

8. **Squarespace**
   - Blog posts
   - Email campaigns

9. **Mailchimp**
   - Newsletters

10. **WordPress**
    - Blog auto-publish

#### Shared Fields

- **Title** (optional, for blogs/articles)
- **Caption / Content** (with character counter)
- **Media Upload** (images/videos)
- **Hashtags** (with suggestions)
- **CTA Button** (text + URL)
- **Schedule** (date/time picker)
- **Platform Selection** (multi-select checkboxes)

#### AI Modes

Accessible via toolbar:

- 🤖 **Generate** - Create from scratch
- ✍️ **Rewrite** - Improve existing text
- 🌐 **Translate** - Multi-language support
- 📝 **Summarize** - Condense long content
- 🎨 **Generate Image** - AI image creation

#### Brand Fidelity Score (BFS)

- Real-time scoring (0.0 - 1.0)
- Minimum: 0.80 to approve
- Breakdown:
  - Tone alignment (30%)
  - Terminology (25%)
  - Compliance (20%)
  - CTA alignment (15%)
  - Platform fit (10%)
- Auto-regenerate if below threshold

#### Approval Workflow Pane

- **Status indicator**
- **Approvers list**
- **Comments thread**
- **Request changes** button
- **Approve/Reject** actions

#### Platform-Specific Validation

- Character limits per platform
- Hashtag limits
- Media format requirements
- Aspect ratio recommendations
- Auto-warnings for violations

---

### 7. Posts / Pipeline

**Route**: `/posts` _(to be implemented)_  
**Status**: 🔄 Planned - Currently shown in Dashboard

#### Purpose

Manage all content across pipeline stages.

#### View Modes

- 📊 **Kanban Board** - By status columns
- 📋 **Table View** - Sortable list

#### Columns (Kanban)

1. Draft
2. In Review
3. Approved
4. Scheduled
5. Published

#### Features

- **Bulk Actions**:
  - Approve multiple
  - Schedule multiple
  - Delete multiple
- **Filters**:
  - By brand
  - By platform
  - By creator
  - By date range
  - By BFS score
- **Sort**:
  - Created date
  - Schedule date
  - BFS score
  - Creator
- **Badges**:
  - BFS score indicator
  - Linter result status
  - Platform icons

---

### 8. Analytics

**Route**: `/analytics`  
**Component**: `client/pages/Analytics.tsx`  
**Access**: All roles (depth varies)

#### Purpose

Performance tracking and data-driven insights.

#### Channel-Level Metrics

Per platform dashboard showing:

- **Reach** - Total impressions
- **Engagement** - Likes, comments, shares
- **CTR** - Click-through rate
- **Followers** - Growth over time
- **Top Posts** - Best performing content

#### Trend Charts

- Line charts for metrics over time
- Comparison mode (multiple date ranges)
- Platform comparison overlays
- Export to PNG/PDF

#### AI Insights (Advisor Agent)

- **Best Times to Post** - By platform and day
- **Top Topics** - Content themes that perform
- **Format Recommendations** - Video vs. image vs. carousel
- **Hashtag Analysis** - Which tags drive engagement
- **Audience Insights** - Demographics and behavior

#### Advisor Recommendations Panel

- Actionable next steps
- Content gap analysis
- Competitor benchmarking
- Suggested experiments

#### Reports

- **Download PDF** - Formatted analytics report
- **Scheduled Reports** - Email delivery
- **Custom Dashboards** - Save filter combinations

#### Date Range Comparison

- This week vs. last week
- This month vs. last month
- Custom date ranges
- Year-over-year

---

### 9. Integrations

**Route**: `/integrations`  
**Component**: `client/pages/Integrations.tsx`  
**Access**: Admin only

#### Purpose

Manage all platform connections and OAuth flows.

#### Platform Categories

##### Tier 1 (Fully Integrated)

Connected to unified composer:

- 📱 **Social Media**: Instagram, Facebook, LinkedIn, X (Twitter), TikTok, Pinterest
- 🎥 **Video**: YouTube
- 💼 **Professional**: Google Business Profile
- 📧 **Email**: Mailchimp, Squarespace Email
- 📝 **Blog/Web**: WordPress, Squarespace Blog

##### Tier 2 (E-Commerce)

Partial integration:

- 🛍️ **Shopify** - Product feed
- 🛒 **WooCommerce** - Order sync

##### Coming Soon

- 📦 **Faire** - Wholesale marketplace
- 🏪 **RangeMe** - Retail distribution
- 🌐 **Amazon Seller Central**

#### Connection Tiles

Each platform shows:

- **Logo & Brand Color**
- **Connection Status**:
  - 🟢 Connected
  - 🟡 Expiring (< 7 days)
  - 🔴 Expired
  - ⚫ Disconnected
- **Account Info**: @username
- **Scopes**: Permissions granted
- **Last Publish**: Timestamp
- **Health Score**: API response rate
- **Actions**:
  - 🔄 Reconnect
  - ⚙️ Settings
  - 🗑️ Disconnect

#### Multi-Account Support

- Connect multiple accounts per platform
- Example: 3 Instagram accounts, 2 Facebook pages
- Switch between accounts in composer

#### OAuth Wizard

- Click "+ Connect New Platform"
- Select platform from grid
- OAuth redirect flow
- Scope selection
- Success confirmation
- Auto-refresh token management

#### Token Health Monitoring

- Automatic expiration detection
- Proactive reconnection prompts
- Token refresh on API calls
- Error handling and logging

---

### 10. Reviews & Reputation

**Route**: `/reviews`  
**Component**: `client/pages/Reviews.tsx`  
**Access**: Admin, Strategy Manager, Brand Manager, Approver (respond only)

#### Purpose

Centralized review management from Facebook and Google Business Profile.

#### Features

##### Review Dashboard

- **Total Reviews Count**
- **Average Rating** (1-5 stars)
- **Unanswered Count** (alerts)
- **Sentiment Breakdown**:
  - 😊 Positive (4-5 stars)
  - 😐 Neutral (3 stars)
  - 😞 Negative (1-2 stars)

##### Filters & Sorting

- **Filter by**:
  - Rating (1-5 stars)
  - Status (Unanswered, Answered, Flagged)
  - Platform (Facebook, Google)
  - Date range
- **Sort by**:
  - Newest first
  - Oldest first
  - Highest rating
  - Lowest rating

##### AI Sentiment Analysis

- Automatic classification per review
- Sentiment score (0-1)
- Emotion detection
- Urgency flagging

##### Response Management

- **View Review**: Full review text + metadata
- **AI-Suggested Reply**:
  - Context-aware response
  - Brand tone matching
  - Customizable templates
- **Manual Edit**: Customize AI suggestion
- **Send Response**: Publish via API
- **Response Templates**: Save frequently used responses

##### Review Card Display

- Reviewer name + avatar
- Star rating (visual)
- Review text
- Review date
- Platform badge
- Sentiment badge
- Response status
- Quick actions (Respond, Flag, Archive)

##### Export Report

- PDF download
- CSV export
- Date range selection
- Include/exclude responded reviews

---

### 11. Events Management

**Route**: `/events`  
**Component**: `client/pages/Events.tsx`  
**Access**: Admin, Strategy Manager, Brand Manager

#### Purpose

Create and manage events for Facebook and Google Business Profile.

#### Event Creation Form

##### Basic Info

- **Title** (required)
- **Description** (rich text)
- **Event Type** (dropdown):
  - Conference
  - Workshop
  - Webinar
  - Sale/Promotion
  - Community Event
  - Other

##### Date & Time

- **Start Date/Time** (required)
- **End Date/Time** (optional)
- **Timezone** (auto-detected)
- **All-day event** (checkbox)

##### Location

- **Physical Location**:
  - Venue name
  - Street address
  - City, State, ZIP
  - Map preview
- **OR Online Event**:
  - URL (Zoom, Meet, etc.)
  - Platform name

##### Media

- **Cover Image** (recommended 1920×1080)
- **Additional Images** (gallery)

##### Settings

- **RSVP Enabled** (checkbox)
- **Max Attendees** (optional)
- **Ticket URL** (if paid)
- **Registration Required** (checkbox)

##### Platform Selection

- Facebook Events
- Google Business Events
- Multi-select supported

#### Events List View

- **Upcoming Events**: Future-dated, published
- **Draft Events**: Not yet published
- **Past Events**: Historical with metrics

#### Event Card Display

- Cover image thumbnail
- Event title
- Date & time
- Location / Online badge
- RSVP count (if enabled)
- Platform badges (where published)
- Status (Draft, Published, Cancelled)
- Actions (Edit, Duplicate, Cancel, Delete)

#### Calendar Sync

- Auto-add to POSTD calendar
- Optional: Sync to website calendar (Squarespace/WordPress plugin)
- iCal export for external calendars

#### Metrics & Engagement

- **RSVP Count**: Going / Interested
- **Reach**: Event page views
- **Engagement**: Comments, shares
- **Check-ins**: Day-of attendance (Facebook)

---

### 12. Emails & Campaigns

**Route**: `/emails` _(to be implemented)_  
**Status**: 🔄 Planned - Currently part of Create Post flow

#### Purpose

Dedicated email campaign creation and management.

#### Supported Platforms

- **Squarespace Email Campaigns**
- **Mailchimp**

#### Campaign Builder

- **Template Library**:
  - Newsletter
  - Announcement
  - Promotion
  - Event Invitation
  - Welcome Series
- **Drag-and-drop Editor**
- **AI Copy Generation**:
  - Subject line suggestions
  - Body content
  - CTA optimization
- **Personalization**: Merge tags
- **Preview**: Desktop + Mobile

#### Email List Management

- **Segments**: Filter subscribers
- **Import/Export**: CSV support
- **Sync**: Platform native lists

#### Campaign Analytics

- **Open Rate**: % who opened
- **Click Rate**: % who clicked links
- **Bounce Rate**: Failed deliveries
- **Unsubscribe Rate**: Opt-outs
- **Heat Map**: Where users clicked

#### A/B Testing

- Subject line variants
- Content variants
- Send time optimization

---

### 13. Settings

**Route**: `/settings`  
**Component**: `client/pages/Settings.tsx` _(to be implemented)_  
**Access**: Role-dependent (see tabs below)

#### Purpose

Centralized configuration for user, brand, and system settings.

#### Tabs

##### Profile & Notifications

**Access**: All users

- Personal info (name, email)
- Password change
- Profile picture
- Email preferences:
  - Daily digest
  - Weekly report
  - Approval requests
  - System updates
- Push notifications
- Time zone

##### Brand Settings

**Access**: Admin, Brand Manager

- **Posting Rules**:
  - Default post frequency
  - Preferred posting times
  - Auto-schedule settings
- **Approval Workflow**:
  - Single approver
  - Multi-step approval
  - Auto-approve (high trust)
  - Custom workflow
- **Safety Mode**:
  - Safe (default)
  - Bold
  - Edgy (opt-in)
- **Content Restrictions**:
  - Banned phrases
  - Required disclaimers
  - Topic restrictions

##### Team & Roles

**Access**: Admin only

- **User List**: All team members
- **Invite Users**: Email invitations
- **Role Assignment**:
  - Admin
  - Strategy Manager
  - Brand Manager
  - Approver/Client
  - Viewer
- **Permissions Matrix**: View access levels
- **Deactivate Users**: Soft delete

##### Billing & Usage

**Access**: Admin (Owner) only

- **Current Plan**: Solo / Agency / Enterprise
- **Usage Metrics**:
  - Posts published this month
  - API calls consumed
  - Storage used
  - Team seats used
- **Upgrade/Downgrade**: Plan changes
- **Payment Method**: Card on file
- **Billing History**: Invoice downloads
- **Quota Alerts**: 80%, 90%, 100% thresholds

##### API Keys / Webhooks

**Access**: Admin only

- **API Keys**: Generate, revoke, rotate
- **Webhooks**: Configure event callbacks
  - Post published
  - Review received
  - Approval requested
  - Error occurred
- **Developer Docs**: Link to API reference

##### Security / 2FA

**Access**: All users (own account)

- **Two-Factor Authentication**:
  - Enable/Disable
  - App-based (Authenticator)
  - SMS backup
- **Active Sessions**: View and revoke
- **Login History**: Recent logins
- **Security Alerts**: Unusual activity

##### Data Exports

**Access**: Admin only

- **Export Brand Data**:
  - All posts (JSON/CSV)
  - All assets (ZIP)
  - Analytics data
  - Review history
- **GDPR Compliance**: User data portability
- **Scheduled Exports**: Automatic backups

---

### 14. Admin / Owner Only

**Route**: `/admin` _(to be implemented)_  
**Access**: Admin role only

#### Purpose

System-wide management and monitoring across all brands.

#### Tenant-Level Overview

- **All Brands Summary**:
  - Total brands
  - Total users
  - Total posts published
  - Aggregate reach
  - Storage usage
  - API quota consumption

#### User Management

- **Full User List** (all brands)
- **Invite Users**: System-wide invitations
- **Role Management**: Assign/revoke roles
- **Deactivate Users**: Suspend accounts
- **Audit Log**: User actions

#### Billing Dashboard

- **Plan Distribution**:
  - Solo plan count
  - Agency plan count
  - Enterprise plan count
- **Revenue Metrics**:
  - MRR (Monthly Recurring Revenue)
  - Churn rate
  - Upgrade/downgrade trends
- **Quota Limits**: System-wide thresholds
- **Overages**: Brands exceeding limits

#### System Health

- **Connection Uptime**:
  - % uptime per platform
  - Recent outages
  - Response time averages
- **Queue Depth**:
  - Posts pending publish
  - Jobs in processing
  - Error rate
- **Database Metrics**:
  - Query performance
  - Storage growth
  - RLS policy violations (should be 0)
- **AI Agent Performance**:
  - Doc Agent: Avg generation time
  - Design Agent: Success rate
  - Advisor Agent: Insight accuracy

#### Feature Flags

- Enable/disable features globally
- A/B testing configuration
- Beta feature access

---

### 15. Support / Docs / Changelog

**Route**: `/support` _(to be implemented)_  
**Access**: All users

#### In-App Help Center

- **Search**: AI-assisted article search
- **Categories**:
  - Getting Started
  - Brand Kit Setup
  - Creating Content
  - Platform Integrations
  - Analytics & Reporting
  - Billing & Plans
  - Troubleshooting
- **Video Tutorials**: Embedded walkthroughs
- **Live Chat**: Support widget

#### Documentation

- **User Guides**: Step-by-step instructions
- **API Reference**: Developer docs
- **Keyboard Shortcuts**: ⌘K reference
- **Best Practices**: Content strategy tips

#### Changelog / Release Notes

- **What's New**: Feature announcements
- **Version History**: Past releases
- **Upcoming Features**: Roadmap preview
- **Bug Fixes**: Known issues resolved

#### Contact Support

- **Ticket Submission**: Email-based support
- **Live Chat**: Business hours
- **Emergency Hotline**: Enterprise only

---

## C. Role-Based Navigation Visibility

| Menu Item          |     Admin     |  Strategy Mgr   |     Brand Mgr      | Approver/Client |     Viewer      |
| ------------------ | :-----------: | :-------------: | :----------------: | :-------------: | :-------------: |
| **Dashboard**      |    ✅ Full    |     ✅ Full     |      ✅ Full       |     ✅ Read     |     ✅ Read     |
| **Brands**         | ✅ All brands |   ✅ Assigned   |    ✅ Assigned     |    🔒 Hidden    |    🔒 Hidden    |
| **Create Post**    |    ✅ Full    |     ✅ Full     |      ✅ Full       |    🔒 Hidden    |    🔒 Hidden    |
| **Calendar**       |    ✅ Edit    |     ✅ Edit     |      ✅ Edit       |     ✅ Read     |     ✅ Read     |
| **Brand Kit**      |    ✅ Edit    |     ✅ Edit     |      ✅ Edit       |    🔒 Hidden    |    🔒 Hidden    |
| **Assets**         |   ✅ Manage   |    ✅ Manage    |     ✅ Manage      |    🔒 Hidden    |    🔒 Hidden    |
| **Posts/Pipeline** |    ✅ Full    |     ✅ Full     |      ✅ Full       | ✅ Approve only |     ✅ Read     |
| **Analytics**      |    ✅ Full    |     ✅ Full     |      ✅ Full       |   ✅ Summary    |   ✅ Summary    |
| **Integrations**   |   ✅ Manage   |     🔒 Read     |     🔒 Hidden      |    🔒 Hidden    |    🔒 Hidden    |
| **Reviews**        |   ✅ Manage   |    ✅ Manage    |     ✅ Respond     |   ✅ Respond    |     ✅ Read     |
| **Events**         |   ✅ Manage   |    ✅ Manage    |     ✅ Manage      |     ✅ Read     |    🔒 Hidden    |
| **Emails**         |   ✅ Manage   |    ✅ Manage    |     ✅ Manage      |    🔒 Hidden    |    🔒 Hidden    |
| **Settings**       |  ✅ All tabs  | 🔒 Profile only | 🔒 Profile + Brand | 🔒 Profile only | 🔒 Profile only |
| **Admin Tools**    |    ✅ Full    |    🔒 Hidden    |     🔒 Hidden      |    🔒 Hidden    |    🔒 Hidden    |

### Permission Legend

- ✅ **Full Access** - Complete read/write permissions
- ✅ **Edit** - Can modify content
- ✅ **Manage** - Can create, edit, delete
- ✅ **Read** - View-only access
- ✅ **Assigned** - Only brands assigned to user
- ✅ **Approve only** - Can approve/reject but not create
- ✅ **Respond** - Can reply to reviews
- ✅ **Summary** - High-level metrics only
- 🔒 **Hidden** - Not visible in navigation

---

## D. Data Flows Cross-Reference

### Content Creation Flow

```
User → Brand Kit → AI Agents → Post Draft → Approval → Schedule → Publish → Analytics
```

| Page               | Primary Agents      | Data Sources                                              | Outputs                            | Notes                     |
| ------------------ | ------------------- | --------------------------------------------------------- | ---------------------------------- | ------------------------- |
| **Dashboard**      | Advisor             | `brands`, `social_posts`, `platform_reviews`, `analytics` | Summaries, next actions            | Surfaces AI insights      |
| **Calendar**       | Doc + Design        | `social_posts`, `platform_events`                         | Scheduled content                  | Real-time sync            |
| **Brand Kit**      | All 3 agents        | User input, Website crawler                               | Brand embeddings, AI training data | Feeds all AI context      |
| **Create Post**    | Doc + Design        | Brand kit, previous posts                                 | Post drafts with BFS               | Multi-platform validation |
| **Posts/Pipeline** | Doc + Design        | `social_posts`, `generation_logs`                         | Content workflow                   | Approval state machine    |
| **Analytics**      | Advisor             | Platform APIs, `social_posts`                             | Insights, recommendations          | ML-powered trends         |
| **Integrations**   | None (OAuth)        | `platform_connections`                                    | Access tokens                      | Token refresh automation  |
| **Reviews**        | Advisor (sentiment) | Facebook API, Google API                                  | Review data, responses             | AI sentiment analysis     |
| **Events**         | Doc + Design        | `platform_events`                                         | Event posts                        | Calendar sync             |
| **Emails**         | Doc + Design        | Email platform APIs                                       | Campaign data                      | Template-based            |

### AI Agent Responsibilities

#### Doc Agent (POSTD Words)

- **Consumes**: Brand kit, tone embeddings, previous content
- **Produces**: Post captions, blog articles, email copy
- **Quality Gate**: Brand Fidelity Score ≥ 0.80
- **Used In**: Create Post, Emails, Events

#### Design Agent (POSTD Creative)

- **Consumes**: Brand colors, fonts, logo, imagery style
- **Produces**: Social graphics, carousel images, video thumbnails
- **Quality Gate**: Visual brand alignment check
- **Used In**: Create Post, Events

#### Advisor Agent (POSTD Insights)

- **Consumes**: Analytics data, engagement metrics, platform trends
- **Produces**: Posting recommendations, content ideas, optimal times
- **Quality Gate**: Statistical significance thresholds
- **Used In**: Dashboard, Analytics, Calendar

### Database Tables Reference

| Table                  | Purpose              | Related Pages                   |
| ---------------------- | -------------------- | ------------------------------- |
| `brands`               | Brand configurations | Brand Kit, Dashboard, All       |
| `brand_embeddings`     | AI training vectors  | All agent operations            |
| `brand_kit_history`    | Change tracking      | Brand Kit diff modal            |
| `social_posts`         | Content items        | Create Post, Calendar, Pipeline |
| `platform_connections` | OAuth tokens         | Integrations, Create Post       |
| `platform_reviews`     | Review aggregation   | Reviews                         |
| `platform_events`      | Event data           | Events, Calendar                |
| `generation_logs`      | AI agent audit trail | Admin, Analytics                |
| `content_review_queue` | Approval workflow    | Pipeline, Dashboard             |

---

## E. Technical Architecture

### Frontend Routes

```typescript
// Public Routes
/                           → Index.tsx (marketing homepage)
/features                   → Features.tsx (planned)
/pricing                    → Pricing.tsx (planned)
/login                      → Login.tsx
/signup                     → Signup.tsx

// Authenticated Routes (with AppLayout)
/dashboard                  → Dashboard.tsx
/brands                     → Brands.tsx
/brand-intake              → BrandIntake.tsx
/brand-snapshot            → BrandSnapshot.tsx (AI summary)
/create-post               → CreatePost.tsx
/calendar                  → Calendar.tsx
/assets                    → Assets.tsx
/analytics                 → Analytics.tsx
/integrations              → Integrations.tsx
/reviews                   → Reviews.tsx
/events                    → Events.tsx
/emails                    → Emails.tsx (planned)
/settings                  → Settings.tsx (planned)
/admin                     → Admin.tsx (planned)

// Error Routes
*                          → NotFound.tsx
```

### Backend API Routes

```typescript
// Authentication
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session

// Brands
GET    /api/brands
POST   /api/brands
GET    /api/brands/:id
PUT    /api/brands/:id
DELETE /api/brands/:id

// Brand Crawler
POST   /api/crawler/scan
GET    /api/crawler/status/:jobId

// Content
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
PUT    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/approve
POST   /api/posts/:id/reject

// Integrations
POST   /api/integrations/oauth/connect/:provider
GET    /api/integrations/oauth/callback/:provider
POST   /api/integrations/connections/:id/refresh
GET    /api/integrations/connections
DELETE /api/integrations/connections/:id

// Publishing
POST   /api/integrations/posts/publish

// Reviews
GET    /api/integrations/reviews/sync/:brandId
POST   /api/integrations/reviews/:reviewId/respond

// Events
POST   /api/integrations/events/publish

// Analytics
GET    /api/analytics/:brandId
GET    /api/analytics/:brandId/insights

// AI Agents
POST   /api/agents/generate/doc
POST   /api/agents/generate/design
POST   /api/agents/generate/advisor
GET    /api/agents/bfs/calculate
```

### Database Schema Overview

```
brands
├─ brand_embeddings (AI vectors)
├─ brand_kit_history (change tracking)
├─ platform_connections (OAuth)
│  └─ social_posts (content)
│     └─ generation_logs (AI audit)
├─ platform_reviews (reviews)
├─ platform_events (events)
└─ content_review_queue (approvals)

auth.users
└─ brand_users (role assignments)
```

---

## F. Implementation Status

### ✅ Fully Implemented

- [x] Homepage (public marketing)
- [x] Authentication (Login/Signup)
- [x] Dashboard (with role-aware views)
- [x] Brand Kit / Intake Form (6 sections)
- [x] Website Crawler (with diff review)
- [x] Calendar (basic view)
- [x] Assets Library
- [x] Create Post (multi-platform)
- [x] Integrations (15 platforms)
- [x] Reviews Management
- [x] Events Management
- [x] Analytics (basic metrics)
- [x] Navigation (sidebar + top bar)
- [x] Role-Based Access Control (RLS)
- [x] AI Agent Guardrails (BFS, linter)

### 🔄 Partially Implemented

- [ ] Posts/Pipeline (shown in Dashboard, needs dedicated page)
- [ ] Emails/Campaigns (in Create Post, needs dedicated module)
- [ ] Settings (basic structure, needs all tabs)

### 📋 Planned

- [ ] Features page (marketing)
- [ ] Pricing page (marketing)
- [ ] About/Contact/Legal pages
- [ ] Admin Tools (tenant-level overview)
- [ ] Support/Docs/Changelog
- [ ] A/B Testing
- [ ] Advanced Analytics (custom dashboards)

---

## G. Acceptance Criteria

### Site Map Build Verification

#### ✅ Navigation

- [ ] All pages exist in sidebar navigation
- [ ] Routes are registered in `client/App.tsx`
- [ ] Responsive navigation on mobile
- [ ] Keyboard accessible (Tab, Enter)
- [ ] Search (⌘K) includes all pages

#### ✅ Role-Based Visibility

- [ ] Admin sees all menu items
- [ ] Strategy Manager sees assigned items
- [ ] Brand Manager sees create/edit items
- [ ] Approver sees read-only + approve
- [ ] Viewer sees read-only summary
- [ ] Hidden items don't appear in DOM

#### ✅ Security (RLS)

- [ ] All queries filter by `brand_id`
- [ ] Users can't access other brands' data
- [ ] Admin can access all brands
- [ ] RLS policies enforced at database level
- [ ] No data leaks in API responses

#### ✅ Integrations

- [ ] Tier 1 APIs available in Create Post
- [ ] Multi-account connect supported
- [ ] OAuth flows complete successfully
- [ ] Token refresh automation works
- [ ] Connection health monitoring active

#### ✅ Content Pipeline

- [ ] Create → Review → Approve → Schedule → Publish
- [ ] Status updates propagate correctly
- [ ] Notifications sent to approvers
- [ ] Calendar syncs with pipeline
- [ ] Multi-platform publish works

#### ✅ AI Agents

- [ ] Doc Agent generates on-brand content
- [ ] Design Agent creates visuals
- [ ] Advisor Agent provides insights
- [ ] BFS calculation accurate
- [ ] Content linter catches violations

#### ✅ Reviews & Events

- [ ] Facebook reviews sync correctly
- [ ] Google Business reviews sync correctly
- [ ] AI sentiment analysis accurate
- [ ] Response posting works
- [ ] Events publish to platforms
- [ ] RSVP tracking functional

#### ✅ Multi-Brand Support

- [ ] Brand switcher works
- [ ] Data isolated per brand
- [ ] Admin view aggregates brands
- [ ] No cross-brand data leaks
- [ ] Each brand has own connections

---

## H. Future Enhancements

### Phase 8: Advanced Features

- **Content Templates Library**
- **Bulk Upload & Schedule**
- **A/B Testing Engine**
- **Competitor Monitoring**
- **Influencer Collaboration**
- **White-Label Options**

### Phase 9: E-Commerce Deep Integration

- **Shopify Product Feed Sync**
- **WooCommerce Order Automation**
- **Dynamic Product Posts**
- **Inventory-Aware Scheduling**
- **Sales Performance Tracking**

### Phase 10: Enterprise Features

- **Multi-Tenant Architecture**
- **Custom Branding**
- **Advanced Permissions**
- **SSO Integration**
- **Dedicated Support**
- **SLA Guarantees**

---

## I. Visual Tree Format

```
POSTD
│
├─ 🌐 PUBLIC LAYER
│  ├─ Homepage (/)
│  ├─ Features (/features) *planned*
│  ├─ Integrations Showcase (/integrations-marketing) *planned*
│  ├─ Pricing (/pricing) *planned*
│  └─ Legal
│     ├─ About
│     ├─ Contact
│     ├─ Terms
│     └─ Privacy
│
└─ 🔐 AUTHENTICATED APP
   │
   ├─ 📊 DASHBOARD (/dashboard)
   │  ├─ Welcome + AI Summary
   │  ├─ Content Pipeline (Draft→Review→Approved→Scheduled→Published)
   │  ├─ Calendar Snapshot (7-day)
   │  ├─ Approvals Queue
   │  ├─ Advisor Insights
   │  ├─ Connection Health
   │  ├─ Recent Activity
   │  └─ Quick Create
   │
   ├─ 🏢 BRANDS (/brands)
   │  ├─ Brand List
   │  ├─ Create New Brand
   │  └─ Brand Switcher
   │
   ├─ 📝 BRAND KIT (/brand-intake)
   │  ├─ Section 1: Basics
   │  ├─ Section 2: Voice & Messaging
   │  ├─ Section 3: Visual Identity
   │  ├─ Section 4: Content Preferences
   │  ├─ Section 5: Operational & Compliance
   │  ├─ Section 6: AI Training Assets
   │  ├─ Website Crawler
   │  │  ├─ Scan Website
   │  │  ├─ AI Summary
   │  │  └─ Review Diff Modal
   │  └─ AI Snapshot Panel
   │
   ├─ ✏️ CREATE POST (/create-post)
   │  ├─ Platform Selection (15 platforms)
   │  │  ├─ Tier 1: Instagram, Facebook, LinkedIn, X, TikTok, Google Business, Pinterest, YouTube, Squarespace, Mailchimp, WordPress
   │  │  └─ Tier 2: Shopify, WooCommerce
   │  ├─ Unified Composer
   │  │  ├─ Title / Caption / Media / Hashtags / CTA
   │  │  ├─ AI Modes: Generate, Rewrite, Translate, Summarize
   │  │  └─ Platform-Specific Validation
   │  ├─ Brand Fidelity Score (BFS)
   │  ├─ Approval Workflow Pane
   │  └─ Actions: Draft, Schedule, Publish
   │
   ├─ 📅 CALENDAR (/calendar)
   │  ├─ Month View
   │  ├─ Week View
   │  ├─ List View
   │  ├─ Filters (Brand, Platform, Status)
   │  └─ Drag-and-Drop Scheduling
   │
   ├─ 📁 ASSETS (/assets)
   │  ├─ Upload Media
   │  ├─ Folders & Tags
   │  ├─ Search & Filter
   │  ├─ Preview & Edit
   │  └─ Usage Tracking
   │
   ├─ 📈 ANALYTICS (/analytics)
   │  ├─ Channel Metrics (Reach, Engagement, CTR, Followers)
   │  ├─ Trend Charts
   │  ├─ AI Insights (Advisor Agent)
   │  │  ├─ Best Times to Post
   │  │  ├─ Top Topics
   │  │  ├─ Format Recommendations
   │  │  └─ Hashtag Analysis
   │  ├─ Date Range Comparison
   │  └─ Export Reports (PDF)
   │
   ├─ 🔌 INTEGRATIONS (/integrations)
   │  ├─ Platform Categories
   │  │  ├─ Social Media
   │  │  ├─ Video
   │  │  ├─ Professional
   │  │  ├─ Email
   │  │  ├─ Blog/Web
   │  │  └─ E-Commerce
   │  ├─ Connection Tiles
   │  │  ├─ Status Indicator
   │  │  ├─ Multi-Account Support
   │  │  └─ Actions (Reconnect, Settings, Disconnect)
   │  ├─ OAuth Wizard
   │  └─ Token Health Monitoring
   │
   ├─ ⭐ REVIEWS (/reviews)
   │  ├─ Review Dashboard
   │  │  ├─ Total Reviews
   │  │  ├─ Average Rating
   │  │  ├─ Unanswered Count
   │  │  └─ Sentiment Breakdown
   │  ├─ Filters & Sorting
   │  ├─ AI Sentiment Analysis
   │  ├─ Response Management
   │  │  ├─ AI-Suggested Reply
   │  │  ├─ Manual Edit
   │  │  └─ Response Templates
   │  └─ Export Report
   │
   ├─ 📆 EVENTS (/events)
   │  ├─ Event Creation Form
   │  │  ├─ Basic Info (Title, Description, Type)
   │  │  ├�� Date & Time
   │  │  ├─ Location (Physical/Online)
   │  │  ├─ Media (Cover Image)
   │  │  └─ Settings (RSVP, Max Attendees)
   │  ├─ Events List (Upcoming, Draft, Past)
   │  ├─ Platform Publishing (Facebook, Google Business)
   │  ├─ Calendar Sync
   │  └─ Metrics (RSVP Count, Reach, Engagement)
   │
   ├─ 📧 EMAILS (/emails) *planned*
   │  ├─ Campaign Builder
   │  │  ├─ Template Library
   │  │  ├─ Drag-and-Drop Editor
   │  │  └─ AI Copy Generation
   │  ├─ Email List Management
   │  ├─ Campaign Analytics
   │  └─ A/B Testing
   │
   ├─ ⚙️ SETTINGS (/settings) *partial*
   │  ├─ Profile & Notifications
   │  ├─ Brand Settings
   │  ├─ Team & Roles
   │  ├─ Billing & Usage
   │  ├─ API Keys / Webhooks
   │  ├─ Security / 2FA
   │  └─ Data Exports
   │
   ├─ 🔧 ADMIN TOOLS (/admin) *planned*
   │  ├─ Tenant-Level Overview
   │  ├─ User Management
   │  ├─ Billing Dashboard
   │  ├─ System Health
   │  └─ Feature Flags
   │
   └─ 💬 SUPPORT (/support) *planned*
      ├─ In-App Help Center
      ├─ Documentation
      ├─ Changelog / Release Notes
      └─ Contact Support
```

---

## J. Notion-Ready Tables

### Main Navigation Table

| Route           | Page Name    | Status     | Access Roles         | Primary Purpose         |
| --------------- | ------------ | ---------- | -------------------- | ----------------------- |
| `/`             | Homepage     | ✅ Live    | Public               | Marketing conversion    |
| `/login`        | Login        | ✅ Live    | Public               | User authentication     |
| `/signup`       | Signup       | ✅ Live    | Public               | New user registration   |
| `/dashboard`    | Dashboard    | ✅ Live    | All Auth             | Performance overview    |
| `/brands`       | Brands       | ✅ Live    | Admin, Mgr           | Brand management        |
| `/brand-intake` | Brand Kit    | ✅ Live    | Admin, Mgr           | Brand onboarding        |
| `/create-post`  | Create Post  | ✅ Live    | Admin, Mgr           | Multi-platform composer |
| `/calendar`     | Calendar     | ✅ Live    | All Auth             | Content scheduling      |
| `/assets`       | Assets       | ✅ Live    | Admin, Mgr           | Media library           |
| `/analytics`    | Analytics    | ✅ Live    | All Auth             | Performance metrics     |
| `/integrations` | Integrations | ✅ Live    | Admin                | Platform connections    |
| `/reviews`      | Reviews      | ✅ Live    | Admin, Mgr, Approver | Review management       |
| `/events`       | Events       | ✅ Live    | Admin, Mgr           | Event publishing        |
| `/emails`       | Emails       | 🔄 Planned | Admin, Mgr           | Email campaigns         |
| `/settings`     | Settings     | 🔄 Partial | All Auth             | Configuration           |
| `/admin`        | Admin Tools  | 📋 Planned | Admin Only           | System management       |

### Feature Implementation Status

| Feature               | Status         | Component Path                    | Database Tables                   | Notes                           |
| --------------------- | -------------- | --------------------------------- | --------------------------------- | ------------------------------- |
| Brand Kit Form        | ✅ Complete    | `client/pages/BrandIntake.tsx`    | `brands`, `brand_embeddings`      | 6 sections, crawler integration |
| Website Crawler       | ✅ Complete    | `server/workers/brand-crawler.ts` | `brand_kit_history`               | Playwright + OpenAI             |
| Multi-Platform Post   | ✅ Complete    | `client/pages/CreatePost.tsx`     | `social_posts`                    | 15 platforms supported          |
| Platform Integrations | ✅ Complete    | `client/pages/Integrations.tsx`   | `platform_connections`            | OAuth + token management        |
| Reviews Management    | ✅ Complete    | `client/pages/Reviews.tsx`        | `platform_reviews`                | AI sentiment analysis           |
| Events Management     | ✅ Complete    | `client/pages/Events.tsx`         | `platform_events`                 | Facebook + Google Business      |
| AI Agent Guardrails   | ✅ Complete    | Multiple files                    | `generation_logs`, `agent_cache`  | BFS scoring, linter             |
| Role-Based Access     | ✅ Complete    | RLS policies                      | All tables                        | 5 role types supported          |
| Calendar View         | 🔄 Basic       | `client/pages/Calendar.tsx`       | `social_posts`, `platform_events` | Needs drag-drop enhancement     |
| Email Campaigns       | 🔄 In Progress | Partial in CreatePost             | `social_posts`                    | Needs dedicated module          |
| Settings Pages        | 🔄 Partial     | Needs implementation              | Multiple                          | Profile + Brand done            |
| Admin Dashboard       | 📋 Planned     | Not started                       | All tables                        | Tenant-level overview           |

---

## K. Summary

This site map captures the complete POSTD platform architecture as of v1.0:

- **Public Layer**: 5 marketing pages (1 live, 4 planned)
- **Authenticated App**: 16 main sections
- **15 Platform Integrations**: Tier 1 fully operational
- **5 User Roles**: Complete RBAC implementation
- **3 AI Agents**: Doc, Design, Advisor with guardrails
- **Database**: 12+ tables with RLS enforcement

**Implementation Progress**: ~85% complete for MVP, with Email Campaigns, Settings, and Admin Tools as remaining priorities.
