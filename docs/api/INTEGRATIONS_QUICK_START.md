# Integration Platform - Quick Start Guide

## What's New? 🎉

Your POSTD platform now includes a complete **Integration & Platform Management System** with:

✅ **4 New Pages** in your navigation:

- **Integrations** - Manage all platform connections
- **Create Post** - Compose & publish to multiple platforms at once
- **Reviews** - Manage & respond to customer reviews
- **Events** - Create & publish events across platforms

✅ **15 Platform Integrations**:

- Social: Instagram, Facebook, LinkedIn, Twitter/X, TikTok, Pinterest
- Video: YouTube
- Professional: Google Business Profile
- Email: Mailchimp, Squarespace Email
- Blog: WordPress, Squarespace Blog
- E-Commerce: Shopify, WooCommerce (Coming: Faire, RangeMe)

## How to Use

### 1️⃣ Connect Your Platforms

1. Click **Integrations** in the sidebar
2. Browse platforms by category (Social, Email, Blog, etc.)
3. Click **Connect** on any platform
4. Authorize through OAuth
5. Multiple accounts per platform supported!

**Status Indicators:**

- 🟢 **Connected** - Ready to use
- 🟡 **Expiring** - Token expires soon (click Reconnect)
- 🔴 **Expired** - Needs reconnection
- ⚫ **Disconnected** - Not connected

### 2️⃣ Create Multi-Platform Posts

1. Click **Create Post** in the sidebar
2. Write your content (system shows character limits)
3. Add hashtags, images, CTAs
4. Select which platforms to publish to
5. Choose: **Save Draft**, **Schedule**, or **Publish Now**

**Smart Features:**

- Auto-validates against each platform's rules
- Shows max caption length based on selected platforms
- Platform-specific content type support
- One click publishes to all selected platforms

### 3️⃣ Manage Reviews

1. Click **Reviews** in the sidebar
2. View all Facebook & Google Business reviews
3. Filter by: Status, Sentiment, Rating
4. Click **Respond to Review**
5. Optional: Use **Generate AI Response**
6. Edit and send your response

**Review Analytics:**

- Total reviews
- Unanswered count
- Average rating
- Sentiment breakdown (positive/neutral/negative)

### 4️⃣ Create Events

1. Click **Events** in the sidebar
2. Click **Create Event**
3. Fill in: Title, Description, Date/Time, Location
4. Upload cover image (optional)
5. Enable RSVP tracking (optional)
6. Select Facebook and/or Google Business
7. Publish!

**Event Features:**

- Physical or online events
- RSVP tracking
- Multi-platform publishing
- Calendar sync ready

## Database Migration

The system automatically creates these tables:

- `platform_connections` - OAuth tokens & connection status
- `social_posts` - Multi-platform post storage
- `platform_reviews` - Review aggregation
- `platform_events` - Event management
- `review_response_templates` - Reusable responses

**Security:** All tables have Row-Level Security (RLS) for brand isolation.

## Environment Variables Needed

To enable OAuth, add these to your environment:

```env
# Facebook/Instagram
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# Twitter/X
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret

# Google Business
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Your app URL
APP_URL=https://your-domain.com
```

## Platform-Specific Limits

The system enforces these automatically:

| Platform  | Max Caption  | Max Hashtags | Content Types      |
| --------- | ------------ | ------------ | ------------------ |
| Instagram | 2,200 chars  | 30           | post, story, reel  |
| Facebook  | 63,206 chars | unlimited    | post, story, event |
| LinkedIn  | 3,000 chars  | -            | post, article      |
| Twitter/X | 280 chars    | 10           | tweet              |
| TikTok    | 2,200 chars  | 30           | video              |
| Pinterest | 500 chars    | -            | pin                |
| YouTube   | 5,000 chars  | -            | video              |

## Next Steps

### To Start Using:

1. **Apply Database Migration:**

   ```bash
   npx supabase db push
   ```

2. **Set up OAuth Apps:**
   - Create apps on Facebook, LinkedIn, Twitter, Google
   - Add OAuth credentials to environment variables
   - Configure redirect URIs (see INTEGRATION_PLATFORM_IMPLEMENTATION.md)

3. **Connect Your First Platform:**
   - Go to Integrations page
   - Click "Connect" on Instagram or Facebook
   - Authorize the app

4. **Create Your First Post:**
   - Go to Create Post page
   - Write content
   - Select platforms
   - Publish!

### Optional Enhancements:

- [ ] Set up review sync cron job
- [ ] Configure AI response templates
- [ ] Enable RSVP email notifications
- [ ] Add Shopify/WooCommerce credentials
- [ ] Create custom response templates

## Troubleshooting

**"No platforms connected"**

- Go to Integrations page and connect at least one platform

**"Token expired"**

- Click "Reconnect" button on the platform tile

**"OAuth error"**

- Check environment variables are set
- Verify redirect URIs match in platform settings
- Ensure OAuth apps are approved/published

**"Reviews not showing"**

- Make sure Facebook/Google Business are connected
- Run manual sync via Reviews page
- Check platform permissions include review access

## File Structure

```
client/
  pages/
    Integrations.tsx    - Platform management
    CreatePost.tsx      - Multi-platform composer
    Reviews.tsx         - Review dashboard
    Events.tsx          - Event management
  types/
    integrations.ts     - Type definitions

server/
  routes/
    integrations.ts     - OAuth & API routes

supabase/
  migrations/
    20250119_create_integrations_tables.sql
```

## Support

For detailed technical documentation, see:

- `INTEGRATION_PLATFORM_IMPLEMENTATION.md` - Full implementation details
- Platform API docs - Links in implementation doc

## Success! 🎉

You now have a complete multi-platform content management system. Create once, publish everywhere!

**Key Benefits:**

- ⏱️ Save time - Compose once, post to all platforms
- 📊 Centralized - All reviews and events in one place
- 🤖 AI-Powered - Auto-generate review responses
- 🔒 Secure - OAuth 2.0 + RLS policies
- 📈 Scalable - Add unlimited accounts per platform
