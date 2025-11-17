/**
 * Tooltip & Help Content Library
 *
 * Centralized, categorized help content for the entire application.
 * Used by HelpTooltip and Help Library components.
 *
 * Style Guide:
 * - Length: 1-2 sentences (max 20 words)
 * - Tone: Friendly, confident, expert — no jargon
 * - Perspective: Agency user workflows and multi-brand management
 * - Format: Actionable advice, not just descriptions
 */

export interface TooltipContent {
  title: string;
  content: string;
  shortContent?: string; // For compact inline display
  learnMore?: string; // Help Library article link/key
  examples?: string[]; // Real-world examples from agency perspective
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  articles: HelpArticle[];
}

export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  related: string[];
  exampleText?: string;
  tags: string[];
}

// ==================== TOOLTIP LIBRARY ====================

export const TOOLTIPS: Record<string, TooltipContent> = {
  // ==================== ONBOARDING ====================

  onboarding_company_name: {
    title: 'Company Name',
    content: 'Your agency name. This appears in client dashboards and white-label branding.',
    shortContent: 'Shown to clients in your branded experience',
    learnMore: 'setting-up-company-branding',
    examples: [
      'Use your full legal name or a shorter marketing name',
      'Example: "Bright Creative Agency" or just "Bright"',
    ],
  },

  onboarding_user_type: {
    title: 'I am a...',
    content: 'Choose your role to unlock relevant features. Agencies get multi-brand management; freelancers get streamlined tools.',
    shortContent: 'Determines which features you see',
    learnMore: 'user-roles-explained',
    examples: [
      'Agency: manage multiple client brands',
      'Freelancer: focus on one client at a time',
      'Brand: post directly without approval workflows',
    ],
  },

  onboarding_team_size: {
    title: 'Team Size',
    content: 'Helps us suggest collaboration features. Larger teams unlock approval workflows and role-based permissions.',
    shortContent: 'Unlocks team collaboration features',
    learnMore: 'team-collaboration',
  },

  // ==================== BRAND GUIDE ====================

  brand_guide_tone_of_voice: {
    title: 'Tone of Voice',
    content: 'Teach Aligned AI how to write like your brand. Use the sliders to set formality, enthusiasm, and friendliness.',
    shortContent: 'AI learns your brand personality here',
    learnMore: 'setting-brand-tone',
    examples: [
      'Formal: "We provide enterprise solutions"',
      'Casual: "We make stuff that just works"',
      'Balanced: "Professional yet approachable"',
    ],
  },

  brand_guide_brand_voice: {
    title: 'Brand Voice Examples',
    content: 'Paste 2-3 samples of your actual content. AI learns your unique style from real examples.',
    shortContent: 'AI learns from your real content',
    learnMore: 'upload-brand-voice-samples',
    examples: [
      'Paste your best social posts',
      'Include email subject lines',
      'Add product descriptions',
    ],
  },

  brand_guide_logo: {
    title: 'Brand Logo',
    content: 'Upload your logo for client dashboards and white-labeled experiences. PNG or SVG works best.',
    shortContent: 'Appears in client-facing dashboards',
    learnMore: 'uploading-brand-assets',
  },

  brand_guide_colors: {
    title: 'Brand Colors',
    content: 'Your primary and secondary colors. Used in generated images and client dashboards for visual consistency.',
    shortContent: 'Used in graphics and dashboards',
    learnMore: 'brand-color-guidelines',
    examples: [
      'Primary: Your main brand color',
      'Secondary: Accent or highlight color',
      'Leave blank to auto-detect from logo',
    ],
  },

  brand_guide_additional_context: {
    title: 'Additional Brand Context',
    content: 'Add anything AI should know: target audience, key values, product focus, or competitor positioning.',
    shortContent: 'Helps AI understand your market',
    learnMore: 'brand-context-guide',
    examples: [
      'Target: B2B SaaS startups',
      'Values: Transparency, innovation, speed',
      'We position against: Enterprise-only tools',
    ],
  },

  // ==================== CONTENT GENERATION ====================

  content_generation_prompt: {
    title: 'Content Brief',
    content: 'Describe what you want. The more specific, the better. Include topic, goals, tone, and any key messages.',
    shortContent: 'Describe your content goals clearly',
    learnMore: 'writing-effective-prompts',
    examples: [
      'Write a product launch post highlighting speed and ease',
      'Create 5 captions for customer testimonials',
      'Generate LinkedIn article on industry trends',
    ],
  },

  content_generation_tone: {
    title: 'Tone Override',
    content: 'Override your brand tone for this specific post. Useful for promoting a serious product feature or casual announcement.',
    shortContent: 'One-time tone adjustment',
    learnMore: 'tone-overrides',
    examples: [
      'Brand is professional, but post needs enthusiasm',
      'Brand is casual, but security announcement needs formality',
    ],
  },

  content_generation_platform: {
    title: 'Platform',
    content: 'Different platforms have different audiences and character limits. AI optimizes for each one.',
    shortContent: 'AI adapts content to each platform',
    learnMore: 'multi-platform-optimization',
    examples: [
      'Twitter: Concise, punchy, hashtags',
      'LinkedIn: Professional, longer-form, insights',
      'Instagram: Visual-first, trending sounds',
    ],
  },

  content_generation_style: {
    title: 'Content Style',
    content: 'Choose a format: educational, promotional, entertaining, or community-focused.',
    shortContent: 'Determines content type',
    learnMore: 'content-style-guide',
    examples: [
      'Educational: Tips, how-tos, industry insights',
      'Promotional: New features, offers, launches',
      'Entertaining: Memes, behind-the-scenes, fun facts',
      'Community: Questions, polls, user-generated content',
    ],
  },

  // ==================== SCHEDULING ====================

  scheduler_schedule_time: {
    title: 'Post Time',
    content: 'When should this post go live? AI recommends optimal times based on your audience activity.',
    shortContent: 'When to publish (AI recommends best times)',
    learnMore: 'optimal-posting-times',
    examples: [
      'Weekday 10 AM: Best for B2B engagement',
      'Tuesday-Thursday: Highest overall engagement',
      'Evening 6-9 PM: Peak for B2C audiences',
    ],
  },

  scheduler_status_draft: {
    title: 'Draft',
    content: 'Content being written or reviewed. Not yet scheduled for publishing.',
    shortContent: 'Work in progress',
    learnMore: 'post-status-explained',
  },

  scheduler_status_in_queue: {
    title: 'In Queue',
    content: 'Waiting to be approved or published. Will go live at its scheduled time.',
    shortContent: 'Ready to publish soon',
    learnMore: 'post-status-explained',
  },

  scheduler_status_scheduled: {
    title: 'Scheduled',
    content: 'Approved and waiting for publish time. Will post automatically at the scheduled time.',
    shortContent: 'Approved, publishing soon',
    learnMore: 'post-status-explained',
  },

  scheduler_status_published: {
    title: 'Published',
    content: 'Live on the platform. You can still edit or delete it.',
    shortContent: 'Live and viewable',
    learnMore: 'post-status-explained',
  },

  scheduler_status_errored: {
    title: 'Error',
    content: 'Publishing failed (platform down, auth expired, or content violation). Click to retry.',
    shortContent: 'Failed to publish',
    learnMore: 'troubleshooting-publish-errors',
    examples: [
      'Check your platform connection is still active',
      'Verify content doesn\'t violate platform rules',
      'Click "Retry" to attempt publishing again',
    ],
  },

  scheduler_approval_workflow: {
    title: 'Approval Chain',
    content: 'Set who reviews content before publishing. Great for client approvals or team oversight.',
    shortContent: 'Require approval before publishing',
    learnMore: 'setting-up-approvals',
    examples: [
      'Client reviews and approves all posts',
      'Manager reviews, then auto-publish',
      'Multiple reviewers with different permissions',
    ],
  },

  // ==================== ANALYTICS ====================

  analytics_engagement_rate: {
    title: 'Engagement Rate',
    content: 'Calculated as (likes + comments + shares) ÷ impressions. Shows how much your audience interacts with content.',
    shortContent: 'Audience interaction ÷ impressions',
    learnMore: 'understanding-engagement-metrics',
  },

  analytics_reach: {
    title: 'Reach',
    content: 'How many unique people saw your content. Higher reach = bigger audience impact.',
    shortContent: 'Number of unique viewers',
    learnMore: 'reach-vs-impressions',
  },

  analytics_impressions: {
    title: 'Impressions',
    content: 'Total times your content was displayed, including repeat viewers. Track growth over time.',
    shortContent: 'Total times shown (inc. repeats)',
    learnMore: 'impressions-explained',
  },

  analytics_follower_growth: {
    title: 'Follower Growth',
    content: 'New followers gained this period. Shows if your strategy is attracting your target audience.',
    shortContent: 'New followers gained',
    learnMore: 'growth-metrics',
  },

  analytics_date_filter: {
    title: 'Date Range',
    content: 'Compare different time periods. Useful for spotting trends or measuring campaign impact.',
    shortContent: 'Filter data by date range',
    learnMore: 'using-date-filters',
    examples: [
      'Last 7 days: Weekly performance',
      'Last 30 days: Monthly trends',
      'Custom: Compare campaign periods',
    ],
  },

  analytics_platform_filter: {
    title: 'Platform Filter',
    content: 'View one platform or all combined. See which platforms perform best for your content.',
    shortContent: 'View by platform',
    learnMore: 'multi-platform-analytics',
    examples: [
      'Compare Instagram vs. LinkedIn performance',
      'Find your strongest platform',
      'View aggregate across all platforms',
    ],
  },

  analytics_advisor_insight: {
    title: 'Advisor Insight',
    content: 'AI-powered recommendation based on your data. Click to expand or dismiss if not relevant.',
    shortContent: 'AI recommendation based on your data',
    learnMore: 'understanding-advisor-insights',
    examples: [
      '"Your audience is most active Tuesday 2-4 PM"',
      '"Video gets 3x more engagement than images"',
      '"LinkedIn outperforms Instagram by 45%"',
    ],
  },

  // ==================== APPROVALS & WORKFLOW ====================

  approval_status_pending: {
    title: 'Pending Review',
    content: 'Content is waiting for an approver to review. The approver will see notes and suggested edits.',
    shortContent: 'Awaiting reviewer action',
    learnMore: 'approval-workflow',
  },

  approval_status_approved: {
    title: 'Approved',
    content: 'Reviewer approved this content. Can be scheduled or published immediately.',
    shortContent: 'Ready to schedule or publish',
    learnMore: 'approval-workflow',
  },

  approval_status_rejected: {
    title: 'Changes Requested',
    content: 'Reviewer requested changes. Check feedback, edit, and resubmit for review.',
    shortContent: 'Needs revision before approval',
    learnMore: 'handling-feedback',
  },

  approval_add_approver: {
    title: 'Add Approver',
    content: 'Invite team members or clients to review content. They\'ll receive notifications for new submissions.',
    shortContent: 'Add reviewers to content workflow',
    learnMore: 'inviting-approvers',
    examples: [
      'Client approves before posting',
      'Manager reviews for brand consistency',
      'Legal team checks compliance',
    ],
  },

  approval_feedback: {
    title: 'Feedback & Notes',
    content: 'Leave specific, actionable feedback. Tell the creator exactly what to fix or change.',
    shortContent: 'Clear feedback helps creators improve',
    learnMore: 'giving-effective-feedback',
    examples: [
      '"Tone is too casual for this announcement"',
      '"Add social proof quote in second paragraph"',
      '"Use brand color blue instead of purple"',
    ],
  },

  // ==================== WHITE-LABEL & SETTINGS ====================

  whiteLabelConfig_company_name: {
    title: 'Company Name',
    content: 'Your agency name shown in client dashboards. Helps clients remember it\'s your platform.',
    shortContent: 'Your branded experience',
    learnMore: 'white-label-setup',
  },

  whiteLabelConfig_custom_domain: {
    title: 'Custom Domain',
    content: 'Your own domain (e.g., clients.youragency.com). Clients see your domain, not alignedai.com.',
    shortContent: 'Fully branded client experience',
    learnMore: 'custom-domain-setup',
    examples: [
      'clients.youragency.com',
      'content.youragency.com',
      'dashboard.youragency.com',
    ],
  },

  whiteLabelConfig_colors: {
    title: 'Dashboard Colors',
    content: 'Customize primary, secondary, and accent colors. Your brand colors throughout the dashboard.',
    shortContent: 'Your brand colors in the dashboard',
    learnMore: 'color-customization',
  },

  whiteLabelConfig_hide_branding: {
    title: 'Hide "Powered by Aligned AI"',
    content: 'Remove Aligned AI branding. Clients see only your brand (agency/white-label plan required).',
    shortContent: 'Fully white-labeled experience',
    learnMore: 'hiding-powered-by-branding',
  },

  settings_oauth_scopes: {
    title: 'Permission Scopes',
    content: 'Permissions Aligned AI requests from the platform. We only ask for what we need to post, read analytics, etc.',
    shortContent: 'What access we request',
    learnMore: 'understanding-oauth-scopes',
    examples: [
      'pages_manage_posts: Permission to publish',
      'read_insights: Permission to track analytics',
      'manage_pages: Permission to schedule posts',
    ],
  },

  settings_api_key: {
    title: 'API Key',
    content: 'Your secret authentication key. Keep this private. Regenerate if you suspect it\'s compromised.',
    shortContent: 'Keep this secure and secret',
    learnMore: 'managing-api-keys',
    examples: [
      'Never share in code or emails',
      'Use environment variables',
      'Rotate keys regularly for security',
    ],
  },

  // ==================== AGENCY-SPECIFIC ====================

  agency_multi_brand: {
    title: 'Multi-Brand Management',
    content: 'Manage multiple client brands in one dashboard. Switch between clients with one click.',
    shortContent: 'Manage all clients in one place',
    learnMore: 'multi-brand-management',
    examples: [
      'Use separate brand kits for each client',
      'Set different approval chains per client',
      'View unified analytics across all clients',
    ],
  },

  agency_client_dashboard: {
    title: 'Client Portal',
    content: 'Share a branded dashboard with clients. They approve content without seeing your full platform.',
    shortContent: 'Clients review and approve content',
    learnMore: 'setting-up-client-portal',
    examples: [
      'Clients see only their brand\'s content',
      'Streamlined approval interface',
      'No access to your other clients\' data',
    ],
  },

  agency_team_roles: {
    title: 'Team Roles',
    content: 'Assign roles to team members: Viewer, Editor, Admin. Control what each person can do.',
    shortContent: 'Manage team permissions',
    learnMore: 'team-roles-and-permissions',
    examples: [
      'Viewer: See content only',
      'Editor: Create and edit content',
      'Admin: Manage team and integrations',
    ],
  },

  agency_billing: {
    title: 'Billing & Seats',
    content: 'Add/remove team members and adjust your plan. Seats are pro-rated monthly.',
    shortContent: 'Manage team and subscription',
    learnMore: 'team-billing',
  },
};

// ==================== HELP LIBRARY ====================

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Set up your account and brand identity',
    icon: 'rocket',
    articles: [
      {
        id: 'setting-up-company-branding',
        title: 'Set Up Your Company Branding',
        category: 'getting-started',
        content: `Your company name and branding are the foundation of your Aligned AI experience. Here's how to set them up for maximum impact:

1. **Company Name**: Use the name your clients will recognize. This appears in all client-facing dashboards.
2. **Logo**: Upload a high-quality PNG or SVG (square format works best).
3. **Brand Colors**: Choose colors that match your brand identity. These appear in client dashboards.
4. **Tagline**: A short phrase that defines your agency (optional but recommended).

💡 Pro Tip: If you're managing multiple client brands, you'll set up individual brand kits for each client later.`,
        related: ['brand-guide-setup', 'uploading-brand-assets'],
        tags: ['onboarding', 'branding', 'setup'],
      },
      {
        id: 'user-roles-explained',
        title: 'Understanding User Roles',
        category: 'getting-started',
        content: `Aligned AI is built for different ways of working. Choose the role that matches your use case:

**Agencies**: Manage multiple client brands, set up approval workflows, and white-label the platform for clients.

**Freelancers**: Focus on one brand at a time. Streamlined tools for individual creators or small teams.

**Brands**: Post content directly and manage your own social presence.

You can switch or add roles later in your account settings.`,
        related: ['team-roles-and-permissions'],
        tags: ['onboarding', 'roles', 'setup'],
      },
      {
        id: 'team-collaboration',
        title: 'Set Up Team Collaboration',
        category: 'getting-started',
        content: `Working with a team? Aligned AI has built-in collaboration features for agencies and groups:

1. **Invite Team Members**: In Settings → Team, enter their email to invite.
2. **Assign Roles**: Viewer (read-only), Editor (create/edit), Admin (manage team).
3. **Set Up Approvals**: Route content through reviewers before publishing.
4. **Track Changes**: See who created or edited each piece of content.

💡 Pro Tip: Large teams can create approval chains (e.g., creator → manager → client).`,
        related: ['team-roles-and-permissions', 'approval-workflow'],
        tags: ['team', 'collaboration', 'permissions'],
      },
    ],
  },

  {
    id: 'brand-setup',
    name: 'Brand & Tone Setup',
    description: 'Teach Aligned AI your brand voice and style',
    icon: 'palette',
    articles: [
      {
        id: 'setting-brand-tone',
        title: 'Set Your Brand\'s Tone of Voice',
        category: 'brand-setup',
        content: `Your tone of voice is how your brand sounds. Aligned AI learns it and applies it to all generated content. Here's how to set it up:

**The Three Sliders:**
- **Formality**: Formal (technical, corporate) ↔ Casual (conversational, friendly)
- **Enthusiasm**: Quiet (understated) ↔ Energetic (exclamation marks, emojis)
- **Friendliness**: Professional (business-like) ↔ Personal (warm, conversational)

**Example Combinations:**
- B2B SaaS: Formal + Energetic + Professional
- Lifestyle Brand: Casual + Enthusiastic + Personal
- Legal Firm: Formal + Quiet + Professional

💡 Pro Tip: You can override tone for individual posts if you need a different feel.`,
        related: ['upload-brand-voice-samples', 'tone-overrides'],
        tags: ['brand', 'tone', 'setup'],
      },
      {
        id: 'upload-brand-voice-samples',
        title: 'Upload Brand Voice Samples',
        category: 'brand-setup',
        content: `Real examples are the best teachers. Aligned AI learns your unique voice by analyzing samples of your best content.

**What to Upload:**
- 2-3 social media posts you love
- Email subject lines (for email-style posts)
- Product descriptions
- Blog headlines
- Customer testimonials (if they reflect your voice)

**Format:**
Just paste the text. No need for links or attachments. The more examples, the better.

💡 Pro Tip: Include your best-performing content. Posts with high engagement reflect what resonates with your audience.`,
        related: ['setting-brand-tone'],
        tags: ['brand', 'voice', 'examples'],
      },
      {
        id: 'brand-color-guidelines',
        title: 'Choose Your Brand Colors',
        category: 'brand-setup',
        content: `Brand colors appear in generated graphics and client dashboards. Pick colors that represent your brand:

**Primary Color**: Your main brand color (logo, buttons, headers)
**Secondary Color**: A complementary color for accents and highlights
**Accent Color**: Optional highlight color for key elements

**Quick Color Picker Tips:**
- Use hex codes (e.g., #FF5733) for exact matches
- Click the color square to use a visual picker
- Not sure? Leave blank and we'll auto-detect from your logo

💡 Pro Tip: Colors should have good contrast for readability on light and dark backgrounds.`,
        related: ['uploading-brand-assets'],
        tags: ['brand', 'colors', 'design'],
      },
      {
        id: 'brand-context-guide',
        title: 'Add Brand Context & Positioning',
        category: 'brand-setup',
        content: `Context helps Aligned AI understand your market and position. Add details like:

**Target Audience:**
- "B2B SaaS startups in the productivity space"
- "Busy parents looking for time-saving solutions"
- "Enterprise IT decision-makers"

**Key Values:**
- "Transparency, innovation, and speed"
- "Sustainability and ethical practices"

**Competitive Positioning:**
- "We position against: Enterprise-only tools that are too expensive"
- "Our advantage: 10x faster implementation"

**Product/Service Focus:**
- "Sell both software and professional services"
- "Focus on our top 3 products"

💡 Pro Tip: The more context you provide, the smarter AI recommendations become.`,
        related: ['setting-brand-tone'],
        tags: ['brand', 'positioning', 'context'],
      },
    ],
  },

  {
    id: 'content-creation',
    name: 'Content Creation',
    description: 'Generate and manage content ideas',
    icon: 'edit-3',
    articles: [
      {
        id: 'writing-effective-prompts',
        title: 'Write Effective Content Prompts',
        category: 'content-creation',
        content: `A clear prompt = better content. Here's how to write prompts that get results:

**Good Prompts Have:**
1. **Topic**: What's the content about?
2. **Goal**: What should it achieve? (educate, promote, entertain, build community)
3. **Format**: How should it be structured? (list, story, how-to, quote)
4. **Tone** (optional): Formal, casual, etc. (overrides your default)

**Example Prompts:**
- "Write a LinkedIn article about 5 AI tools for small business. Make it educational and include real examples."
- "Create 3 Instagram captions for our new product launch. Make them exciting and include an emoji or two."
- "Write a Twitter thread explaining why remote work is here to stay. Professional but friendly tone."

**Pro Tips:**
- Be specific about what you want
- Include numbers (e.g., "5 tips", "3 reasons") when helpful
- Mention if you want a specific format (list, story, question)
- Reference examples if you have them ("Like we did in last month's campaign")

❌ Avoid: "Write a post" or "Something about our new feature"
✅ Better: "Write a promotional post about our AI content writer. Explain how it saves 5 hours per week. Include a call-to-action."`,
        related: ['content-style-guide', 'tone-overrides'],
        tags: ['content', 'prompts', 'generation'],
      },
      {
        id: 'multi-platform-optimization',
        title: 'Optimize Content for Different Platforms',
        category: 'content-creation',
        content: `Different platforms have different audiences and best practices. Aligned AI adapts content for each:

**Twitter/X:**
- Short, punchy, conversational
- 280 characters max
- Hashtags and @mentions work well
- Use trending topics when relevant

**LinkedIn:**
- Professional, longer-form (100-300 words)
- Thought leadership and insights
- Industry trends and personal stories work
- Less emoji, more substance

**Instagram:**
- Visual-first (captions are secondary)
- Lifestyle, behind-the-scenes, inspirational
- Emojis, trending audio, stories
- Captions 125-150 characters work best

**Facebook:**
- Community-focused conversations
- Longer captions (200+ words) drive engagement
- Links and articles perform well
- Comments and engagement matter more than likes

💡 Pro Tip: Generate the same content for multiple platforms and compare. Sometimes one version resonates more.`,
        related: ['content-style-guide'],
        tags: ['content', 'platforms', 'optimization'],
      },
      {
        id: 'content-style-guide',
        title: 'Choose Content Styles That Work',
        category: 'content-creation',
        content: `Every piece of content serves a purpose. Pick the style that matches your goal:

**Educational:**
- Teach your audience something useful
- "5 Tips for...", "How to...", "Why..."
- Great for: building authority, SEO, long-term value

**Promotional:**
- Drive awareness or sales
- "New Feature Launch", "Limited Offer", "Announcement"
- Great for: product releases, special promotions, launches

**Entertaining:**
- Make people laugh, smile, or react
- Memes, behind-the-scenes, fun facts
- Great for: brand personality, engagement, viral potential

**Community:**
- Spark conversation
- Questions, polls, user-generated content requests
- Great for: engagement, feedback, relationship building

**Mix Strategy:**
- 40% Educational (build trust and authority)
- 30% Promotional (drive sales)
- 20% Entertaining (personality and fun)
- 10% Community (conversations and feedback)

💡 Pro Tip: Balance your content. Too much promotion feels salesy. Too little won't drive business results.`,
        related: ['writing-effective-prompts'],
        tags: ['content', 'style', 'strategy'],
      },
    ],
  },

  {
    id: 'scheduling',
    name: 'Scheduling & Publishing',
    description: 'Plan and publish content on schedule',
    icon: 'calendar',
    articles: [
      {
        id: 'optimal-posting-times',
        title: 'Find Your Optimal Posting Times',
        category: 'scheduling',
        content: `Timing affects how many people see your content. Post when your audience is most active.

**General Best Times:**
- **Weekday Mornings (8-10 AM)**: Great for B2B and professional content
- **Lunch Hours (12-1 PM)**: Good for casual content
- **Evenings (6-9 PM)**: Peak for B2C and entertainment
- **Weekdays > Weekends**: Tuesday-Thursday usually win

**But It Depends:**
- Different audiences, different times
- Test and measure what works for YOUR audience
- Use analytics to find peak engagement times

**Aligned AI Tip:**
When you schedule a post, we recommend optimal times based on your past performance. Try the recommendation or adjust based on your knowledge of your audience.

💡 Pro Tip: Post consistently at good times. Your audience will expect posts then, and the algorithm rewards consistency.`,
        related: ['analytics-scheduling'],
        tags: ['scheduling', 'timing', 'publishing'],
      },
      {
        id: 'post-status-explained',
        title: 'Understanding Post Status',
        category: 'scheduling',
        content: `Every post goes through a lifecycle. Here's what each status means:

**Draft:**
- You're still working on it
- Not scheduled yet
- Only you can see it

**In Queue / In Review:**
- Waiting for approval (if your workflow requires it)
- Or waiting to be scheduled
- Ready to publish once approved

**Scheduled:**
- Approved and waiting for publish time
- Will go live automatically at scheduled time
- You can still edit or cancel

**Published:**
- Live on the platform
- Accruing engagement (likes, comments, shares)
- You can still edit or delete (though edits don't apply retroactively)

**Error/Failed:**
- Something went wrong (platform down, auth expired, content violation)
- Click the error message to see details
- Click "Retry" to try again

**Timeline Example:**
"New Post" (Draft) → Approver Reviews → "In Review" → Approved → "Scheduled" → Publish Time Arrives → "Published" → Engagement Accrues`,
        related: ['approval-workflow', 'troubleshooting-publish-errors'],
        tags: ['scheduling', 'status', 'publishing'],
      },
      {
        id: 'setting-up-approvals',
        title: 'Set Up Content Approval Workflows',
        category: 'scheduling',
        content: `Approval workflows keep your brand consistent and keep clients in the loop. Here's how:

**Types of Workflows:**
- **No Approval** (default): You publish directly
- **Single Approver**: One person (manager/client) reviews before publishing
- **Multi-Step**: Creator → Manager → Client (or any chain you want)
- **Conditional**: Different approvers for different brands or content types

**How It Works:**
1. You create content
2. Click "Submit for Review"
3. Approver gets notified
4. Approver reviews and leaves feedback
5. You revise (if needed)
6. Approver approves or rejects
7. Approved content can be scheduled or published immediately

**Pro Setup for Agencies:**
- Creator submits content
- Manager reviews for brand consistency
- Client reviews for approval
- Auto-publish when approved

**Pro Setup for Teams:**
- Freelancer creates content
- Editor refines and checks quality
- Manager approves final version

💡 Pro Tip: Give clear feedback so creators know exactly what to fix. "Not quite right" isn't as helpful as "Tone is too casual; make it more professional."`,
        related: ['handling-feedback', 'inviting-approvers'],
        tags: ['workflow', 'approval', 'collaboration'],
      },
      {
        id: 'troubleshooting-publish-errors',
        title: 'Fix Publishing Errors',
        category: 'scheduling',
        content: `Publishing failed? Here's how to troubleshoot:

**Common Causes & Fixes:**

**1. "Connection Not Authorized"**
- Your platform connection expired
- Fix: Go to Settings → Integrations → Reconnect [Platform]
- Takes 30 seconds

**2. "Content Violates Platform Policy"**
- The post might have certain keywords, links, or images flagged
- Fix: Check for links, sensitive keywords, or controversial topics. Remove/revise and retry.

**3. "Platform Temporarily Unavailable"**
- The social platform is down or slow
- Fix: Wait 30 minutes and click "Retry". Try again.

**4. "Rate Limit Exceeded"**
- You're posting too many times in a short period
- Fix: Wait a few minutes before retrying

**5. "Token Expired" (For Instagram/Facebook)**
- Your Facebook/Instagram access token needs refresh
- Fix: Go to Settings → Integrations → Disconnect → Reconnect [Platform]

**After Fixing, Always Retry:**
- Click the error message or the "Retry" button
- The post will try to publish again

💡 Pro Tip: If you keep getting errors on a post, try creating a fresh version with slightly different wording.`,
        related: ['post-status-explained'],
        tags: ['troubleshooting', 'errors', 'publishing'],
      },
    ],
  },

  {
    id: 'analytics',
    name: 'Analytics & Insights',
    description: 'Understand your performance and get recommendations',
    icon: 'bar-chart-2',
    articles: [
      {
        id: 'understanding-engagement-metrics',
        title: 'Understand Engagement Metrics',
        category: 'analytics',
        content: `Engagement tells you how much your audience interacts with content. Here are the key metrics:

**Engagement Rate:**
- Formula: (Likes + Comments + Shares + Saves) ÷ Impressions
- Shows: What percentage of people who see your content react to it
- Good Benchmark: 1-3% for most industries, 3-5%+ is excellent
- What It Means: Higher = better resonance with your audience

**Reach:**
- Shows: How many unique people saw your content
- Includes: Both followers and non-followers
- What It Means: Bigger potential audience impact

**Impressions:**
- Shows: How many times your content was displayed
- Includes: Repeat viewers counting multiple times
- What It Means: Total visibility (some people saw it multiple times)

**Saves/Shares:**
- Shows: How many people saved or shared your content
- What It Means: Content people value enough to keep or tell others about
- Usually indicate highest quality content

**Video Metrics** (If you post videos):
- Watch Time: Total minutes people spent watching
- Completion Rate: Percentage who watched the whole thing
- High completion = good content fit`,
        related: ['reach-vs-impressions', 'multi-platform-analytics'],
        tags: ['analytics', 'metrics', 'engagement'],
      },
      {
        id: 'reach-vs-impressions',
        title: 'Reach vs. Impressions: What\'s the Difference?',
        category: 'analytics',
        content: `These sound similar but measure different things:

**Reach:**
- How many DIFFERENT people saw your post
- Counts each person only once
- Example: 5,000 reach = 5,000 different people saw it

**Impressions:**
- How many TIMES your post was displayed
- Counts the same person multiple times
- Example: 7,500 impressions = post was shown 7,500 times (some people saw it 2+ times)

**Why It Matters:**
- High reach, low impressions = content isn't interesting (not shown much)
- High impressions, low reach = algorithm loves it but few unique people (showing same people)
- Healthy posts = impressions 1.5-2x reach

**In Your Aligned AI Dashboard:**
- Both metrics are shown so you can spot patterns
- Use them to understand how the algorithm is treating your content`,
        related: ['understanding-engagement-metrics'],
        tags: ['analytics', 'metrics', 'reach'],
      },
      {
        id: 'multi-platform-analytics',
        title: 'Compare Performance Across Platforms',
        category: 'analytics',
        content: `Different platforms perform differently. Compare to find your strongest channels:

**How to Analyze:**
1. Go to Analytics Dashboard
2. Use the Platform Filter to view each platform separately
3. Compare metrics side-by-side:
   - Engagement rate
   - Average reach per post
   - Best-performing content types

**Common Patterns:**
- **B2B Companies**: LinkedIn usually wins
- **Lifestyle Brands**: Instagram usually wins
- **News/Timely Content**: Twitter/X usually wins
- **Diverse Audiences**: Varies; test each

**What to Look For:**
- Which platform gets highest engagement rate?
- Which platform reaches new followers best?
- Which platform drives clicks/conversions?
- Which content types work best on each platform?

**Use These Insights To:**
- Post more often on winning platforms
- Tailor content to what works on each platform
- Consider stopping or reducing on low-performing platforms
- Invest in promoted posts on your strongest platforms

💡 Pro Tip: Success on different platforms requires different strategies. Don't post the same thing everywhere; adapt for each platform's audience.`,
        related: ['understanding-engagement-metrics'],
        tags: ['analytics', 'platforms', 'comparison'],
      },
      {
        id: 'understanding-advisor-insights',
        title: 'Understand Advisor AI Recommendations',
        category: 'analytics',
        content: `Advisor Insights are AI-powered recommendations based on your actual data.

**Types of Insights:**

**1. Best Times to Post**
- "Your audience is most active Tuesday-Thursday 2-4 PM"
- Based on: When your audience engages most
- Action: Schedule posts for these times

**2. Top-Performing Formats**
- "Video gets 3x more engagement than images"
- Based on: Comparing your own content performance
- Action: Create more videos

**3. Platform Winners**
- "LinkedIn outperforms Instagram by 45%"
- Based on: Your engagement rates per platform
- Action: Post more frequently on LinkedIn, tailor content for it

**4. Content Type Recommendations**
- "Educational content gets 2x more saves"
- Based on: Performance of different content styles
- Action: Create more educational content

**5. Growth Opportunities**
- "You're missing Tuesday posts; that's when engagement peaks"
- Based on: Gaps in your posting schedule vs. audience activity
- Action: Fill Tuesday posting gap

**How to Use:**
- Read the insight
- Check if it matches your goals
- If helpful, implement it
- If not relevant, click "Dismiss"
- Insights update regularly as you post more content

💡 Pro Tip: Some insights might contradict each other or your strategy. Use your judgment. AI recommends based on data, but you know your business goals.`,
        related: ['understanding-engagement-metrics', 'multi-platform-analytics'],
        tags: ['analytics', 'insights', 'ai-recommendations'],
      },
    ],
  },

  {
    id: 'teams',
    name: 'Team & Approvals',
    description: 'Collaborate with your team and manage permissions',
    icon: 'users',
    articles: [
      {
        id: 'approval-workflow',
        title: 'Set Up Approval Workflows',
        category: 'teams',
        content: `Approval workflows route content through reviewers before publishing.

**Basic Setup:**
1. Go to Settings → Approvals
2. Enable approval requirements
3. Choose who approves (one person or multiple)
4. Save

**Types of Workflows:**

**Single Approver:**
- Creator submits → Approver reviews → Publishes
- Best for: Small teams, simple content

**Sequential (Chain):**
- Creator → Manager → Client → Publish
- Each person reviews in order
- Best for: Agencies managing client approvals

**Parallel:**
- Multiple approvers review simultaneously
- All must approve before publishing
- Best for: High-stakes content (announcements, legal)

**By Content Type:**
- Blog posts need manager approval
- Social media posts don't (or only client approval)
- Ads need legal team approval

**Approver Notifications:**
- Approvers get notified when content is submitted
- Can review on desktop or mobile
- Can leave feedback
- Can request revisions

💡 Pro Tip: Clear approval workflows prevent bottlenecks and ensure consistent quality. Set them up carefully.`,
        related: ['handling-feedback', 'inviting-approvers'],
        tags: ['workflow', 'approvals', 'team'],
      },
      {
        id: 'team-roles-and-permissions',
        title: 'Manage Team Roles & Permissions',
        category: 'teams',
        content: `Different roles have different capabilities. Assign wisely:

**Viewer:**
- Can view all content and analytics
- Cannot create, edit, or approve
- Great for: Clients, stakeholders, observers

**Editor:**
- Can create and edit content
- Can submit for approval
- Cannot approve or change team settings
- Great for: Content creators, copywriters

**Manager:**
- Can create, edit, approve content
- Can see team settings
- Cannot change billing or remove users
- Great for: Team leads, senior editors

**Admin:**
- Full access to everything
- Can manage team, billing, integrations
- Great for: Agency owner, account manager

**Setting Permissions:**
1. Go to Settings → Team
2. Click each user
3. Select their role
4. Save

**Role Assignment Tips:**
- Don't make everyone admins
- Give people the least access they need
- Review permissions quarterly
- Disable access immediately when someone leaves

💡 Pro Tip: Start with limited permissions and expand as needed. It's easier to grant access than restrict it later.`,
        related: ['inviting-approvers'],
        tags: ['team', 'roles', 'permissions'],
      },
      {
        id: 'handling-feedback',
        title: 'Give & Receive Feedback Effectively',
        category: 'teams',
        content: `Good feedback improves content. Here's how to give and receive it:

**When Giving Feedback (Approver):**

✅ DO:
- Be specific: "Add a call-to-action button" vs. "Not good enough"
- Explain why: "This tone doesn't match our brand voice"
- Suggest improvements: "Try this headline instead..."
- Be encouraging: "Great concept, just needs..."

❌ DON'T:
- Be vague: "Doesn't feel right"
- Be harsh: "This is terrible"
- Rewrite everything: Give direction, let creator fix
- Leave feedback without explanation

**Example Good Feedback:**
"This is on the right track! The tone is a bit too casual for our CFO audience. LinkedIn users expect more professional language. Try replacing 'awesome' with 'powerful' and 'no cap' with 'no question.' Keep the energy but elevate the language."

**When Receiving Feedback (Creator):**
- Read carefully
- Ask clarifying questions
- Don't take it personally (it's about the content, not you)
- Make revisions thoughtfully
- Resubmit when ready

💡 Pro Tip: Feedback should help content be better. If you disagree with feedback, discuss it. Good teams iterate together, not against each other.`,
        related: ['approval-workflow'],
        tags: ['feedback', 'collaboration', 'communication'],
      },
      {
        id: 'inviting-approvers',
        title: 'Invite Team Members & Approvers',
        category: 'teams',
        content: `Building your team? Here's how to invite people:

**To Add a Team Member:**
1. Go to Settings → Team
2. Click "Invite Team Member"
3. Enter their email
4. Choose their role
5. Send invite

They'll get an email with a link to join.

**To Add an Approver:**
1. Go to Settings → Approvals
2. Click "Add Approver"
3. Search for existing team member or invite new one
4. Save

They'll get notified when content is submitted for approval.

**Tips for Inviting:**
- Use real work emails (not personal accounts)
- Invite multiple admins for backup
- Have approvers create a strong password
- Consider your approval chain carefully

**Who to Invite:**
- Agency: Invite your team + client contacts
- Freelancer: Invite a mentor or trusted feedback person
- Brand: Invite team members, maybe external agencies

💡 Pro Tip: Invite early. Getting team members onboarded takes a few days for them to set up passwords and get comfortable with the platform.`,
        related: ['team-roles-and-permissions'],
        tags: ['team', 'invitations', 'setup'],
      },
    ],
  },

  {
    id: 'white-label',
    name: 'White-Label & Branding',
    description: 'Customize the platform for your clients',
    icon: 'shield',
    articles: [
      {
        id: 'white-label-setup',
        title: 'Set Up White-Label Branding',
        category: 'white-label',
        content: `White-label your dashboard so clients see your brand, not Aligned AI's.

**What Gets Branded:**
- Client dashboard (your colors, logo, domain)
- Emails sent to clients
- Reports and exports
- "Powered by Aligned AI" notice (can hide)

**Setup Steps:**
1. Go to Settings → White-Label
2. Upload your logo
3. Enter your company name
4. Choose your colors
5. (Optional) Set custom domain
6. Review preview
7. Save

**Custom Domain Setup** (Advanced):
- Points to your white-label dashboard
- Example: clients.youragency.com
- Requires DNS configuration
- Contact support for help

**What Clients See:**
- Your logo, colors, domain
- Your company name everywhere
- Your support email for help
- Your branding in all communications

**Pro Setup:**
- Use your agency's colors
- Include your agency tagline
- Set support email to your team
- Hide "Powered by Aligned AI" for full white-label

💡 Pro Tip: Your white-label experience is your competitive advantage. Make it polished and professional.`,
        related: ['custom-domain-setup', 'hiding-powered-by-branding'],
        tags: ['white-label', 'branding', 'client-experience'],
      },
      {
        id: 'custom-domain-setup',
        title: 'Set Up a Custom Domain',
        category: 'white-label',
        content: `Use your own domain instead of alignedai.com. Here's how:

**What You Need:**
- Your own domain (e.g., youragency.com)
- Access to domain DNS settings
- A CNAME or A record to configure

**Setup Steps:**
1. Go to Settings → White-Label → Custom Domain
2. Enter your domain (e.g., clients.youragency.com)
3. Copy the DNS record
4. Log into your domain registrar
5. Add the DNS record
6. Wait 24-48 hours for propagation
7. Done!

**Common Domain Examples:**
- clients.youragency.com
- content.youragency.com
- dashboard.youragency.com
- app.youragency.com

**If You Get Stuck:**
- Check that you added the DNS record correctly
- DNS changes take 24-48 hours to propagate
- Contact support with your domain name and DNS record

💡 Pro Tip: Use a subdomain (clients.youragency.com) instead of replacing your main site. Safer and easier to manage.`,
        related: ['white-label-setup'],
        tags: ['white-label', 'domain', 'setup'],
      },
      {
        id: 'hiding-powered-by-branding',
        title: 'Remove "Powered by Aligned AI" Branding',
        category: 'white-label',
        content: `For a fully white-labeled experience, hide Aligned AI branding:

**How to Hide It:**
1. Go to Settings → White-Label
2. Toggle "Hide Aligned AI Branding"
3. Save

**What Gets Hidden:**
- "Powered by Aligned AI" in footer
- Aligned AI logo in branding
- Aligned AI links and references

**What Remains:**
- Your company branding (logo, colors, domain)
- Your support contact information
- Your company tagline

**Pro Setup:**
- Hide branding + custom domain + custom colors = Fully branded experience
- Clients won't know they're using Aligned AI (unless they ask)
- You can market this as your own tool

**White-Label Plans:**
- Not all plans support hiding branding
- Check your plan or contact sales

💡 Pro Tip: Fully white-labeled platforms help you charge premium rates and build brand loyalty with clients.`,
        related: ['white-label-setup', 'color-customization'],
        tags: ['white-label', 'branding', 'setup'],
      },
      {
        id: 'color-customization',
        title: 'Customize Dashboard Colors',
        category: 'white-label',
        content: `Match your brand colors in the dashboard:

**Color Picker:**
- Click any color to open the picker
- Enter hex codes (e.g., #FF5733) for exact matches
- Or use the visual picker to choose colors

**Colors You Can Change:**
- Primary (main brand color)
- Secondary (complementary color)
- Accent (highlights)
- Success/Warning/Error (feedback colors)

**Hex Code Format:**
- Format: #RRGGBB
- Example: #FF5733 (red)
- Find hex codes at color-picker.com

**Pro Color Strategy:**
- Primary: Your main brand color
- Secondary: A complementary color
- Accent: Something bold for important elements
- Keep contrast for readability

**Preview:**
- See changes instantly in the preview
- Colors update in real time
- Check mobile preview too

💡 Pro Tip: Make sure colors have enough contrast so text is readable on backgrounds.`,
        related: ['white-label-setup'],
        tags: ['white-label', 'colors', 'design'],
      },
    ],
  },

  {
    id: 'agencies',
    name: 'For Agencies',
    description: 'Multi-brand management and client workflows',
    icon: 'briefcase',
    articles: [
      {
        id: 'multi-brand-management',
        title: 'Manage Multiple Client Brands',
        category: 'agencies',
        content: `Manage all your clients in one place with separate brand kits:

**How It Works:**
1. Create a brand kit for each client
2. Switch between clients with one click
3. Each client has separate content, analytics, and workflows
4. Shared team members can access approved clients

**Setting Up Client Brands:**
- Go to Brands or Dashboard
- Click "Add New Brand"
- Name it after the client
- Set up their brand kit (logo, colors, tone)
- Invite team members who work on this client
- Start creating content

**Switching Between Clients:**
- Click the brand dropdown at the top
- Select the client you want to work on
- Everything switches (content, analytics, settings)

**Benefits:**
- One login for all clients
- Easy to switch between brands
- Keep brand consistency for each client
- See performance across all clients
- Scale your agency without complexity

**Pro Setup for Agencies:**
- Have default templates per client (e.g., LinkedIn post template)
- Set up approval workflows per client
- Use consistent naming (Client Name - Brand Type)
- Archive old/inactive clients

💡 Pro Tip: The more organized your brands, the faster you can work. Spend time setting up templates and workflows up front.`,
        related: ['setting-up-client-portal', 'team-roles-and-permissions'],
        tags: ['agencies', 'multi-brand', 'management'],
      },
      {
        id: 'setting-up-client-portal',
        title: 'Set Up Client Portal for Approvals',
        category: 'agencies',
        content: `Let clients approve content without seeing your full platform:

**What's the Client Portal?**
- A simplified, branded dashboard shared with clients
- Clients see only their brand's content
- They can approve/reject without access to your full account
- No visibility into your other clients' work

**How to Set Up:**
1. Go to Client Portals
2. Click "Create New Portal"
3. Select the brand/client
4. Customize the branding (optional)
5. Generate a unique link
6. Send to client

**What Clients See:**
- Content awaiting their approval
- Option to approve or request revisions
- Their content calendar
- Their analytics (if enabled)
- Their brand branding only

**What Clients Don't See:**
- Your other clients
- Team members who work on multiple brands
- Behind-the-scenes content planning
- Full Aligned AI platform

**Benefits:**
- Streamlined client experience
- No information leakage between clients
- Professional, branded experience
- Faster approvals (easier interface)
- Clients feel VIP treatment

**Pro Setup:**
- Brand it with client's colors (or keep your agency branding)
- Enable analytics so clients see what's working
- Set approval requirements clearly
- Train clients on how to use it (short video or guide)

💡 Pro Tip: A great client portal makes clients feel like they're on a premium, custom-built platform. It's a huge competitive advantage.`,
        related: ['approval-workflow', 'white-label-setup'],
        tags: ['agencies', 'client-portal', 'approvals'],
      },
      {
        id: 'team-billing',
        title: 'Manage Team Seats & Billing',
        category: 'agencies',
        content: `Add team members and manage your subscription:

**How Billing Works:**
- Pay per team seat (team member)
- Month-to-month: Cancel anytime
- Annual: Get 20% discount
- Seats are pro-rated (pay for partial months)

**Add Team Members:**
1. Go to Settings → Team
2. Click "Invite Member"
3. Enter their email
4. Choose role
5. Confirm invite

You'll be charged for the new seat immediately (pro-rated for the month).

**Remove Team Members:**
1. Go to Settings → Team
2. Find the member
3. Click "Remove"
4. They lose access immediately
5. You get a credit for the unused portion of the month

**View Your Bill:**
1. Go to Settings → Billing
2. See current plan and seats
3. See upcoming charges
4. Download invoices

**Plans Available:**
- **Starter**: 1-5 team members
- **Professional**: 5-20 team members
- **Agency**: 20+ team members (custom pricing)

**Pro Tips:**
- Remove inactive members to save money
- Add power users during busy seasons, remove after
- Switch to annual plan if you're committed (save 20%)
- Contact support if you have custom needs

💡 Pro Tip: Keep your team lean. Contract freelancers for project work instead of adding full-time seats.`,
        related: ['team-roles-and-permissions'],
        tags: ['billing', 'team', 'subscriptions'],
      },
    ],
  },
];

// ==================== UTILITY FUNCTIONS ====================

export function getTooltipByKey(key: string): TooltipContent | undefined {
  return TOOLTIPS[key];
}

export function getCategoryById(id: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find((cat) => cat.id === id);
}

export function getArticleById(id: string): HelpArticle | undefined {
  for (const category of HELP_CATEGORIES) {
    const article = category.articles.find((a) => a.id === id);
    if (article) return article;
  }
  return undefined;
}

export function searchHelpArticles(query: string): HelpArticle[] {
  const lowercaseQuery = query.toLowerCase();
  const results: HelpArticle[] = [];

  for (const category of HELP_CATEGORIES) {
    for (const article of category.articles) {
      if (
        article.title.toLowerCase().includes(lowercaseQuery) ||
        article.content.toLowerCase().includes(lowercaseQuery) ||
        article.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
      ) {
        results.push(article);
      }
    }
  }

  return results;
}
