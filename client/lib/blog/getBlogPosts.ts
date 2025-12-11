/**
 * getBlogPosts
 * 
 * Fetches all blog posts from the content directory.
 * For now, uses a simple static data structure.
 * Later can be replaced with CMS or markdown file reading.
 */

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  featuredImage?: string;
  date: string;
  author: {
    name: string;
    avatar?: string;
  };
  category: string;
  keywords: string[];
  readTime: number; // in minutes
  body: string; // markdown content
}

// Static blog posts data
// In production, this would be loaded from markdown files or a CMS
const BLOG_POSTS: BlogPost[] = [
  {
    slug: "getting-started-with-postd",
    title: "Getting Started with Postd: Your Complete Guide",
    excerpt: "Learn how to set up your Brand Guide, connect your accounts, and start creating content that sounds like you.",
    featuredImage: "/images/blog/getting-started.jpg",
    date: "2025-01-15",
    author: {
      name: "Postd Team",
      avatar: "/images/authors/postd-team.jpg",
    },
    category: "Getting Started",
    keywords: ["onboarding", "setup", "tutorial"],
    readTime: 5,
    body: `# Getting Started with Postd

Welcome to Postd! This guide will help you get up and running quickly.

## Step 1: Create Your Account

Sign up with your email and create a secure password. We'll guide you through the onboarding process.

## Step 2: Set Up Your Brand Guide

Your Brand Guide is the foundation of everything we do. We'll help you:

- Extract your brand colors from your website
- Identify your brand voice and tone
- Understand your target audience
- Set up your content preferences

## Step 3: Connect Your Accounts

Link your social media accounts to start publishing directly from Postd:

- Instagram
- Facebook
- LinkedIn
- Google Business Profile
- Email providers (Mailchimp, etc.)

## Step 4: Create Your First Post

Use the Creative Studio to generate content that matches your brand perfectly.

Ready to get started? [Sign up today](/signup) and see the magic happen!`,
  },
  {
    slug: "ai-content-generation-best-practices",
    title: "AI Content Generation: Best Practices for Brand Consistency",
    excerpt: "Discover how to use AI to create content that maintains your brand voice while saving time and increasing engagement.",
    featuredImage: "/images/blog/ai-content.jpg",
    date: "2025-01-10",
    author: {
      name: "Sarah Chen",
      avatar: "/images/authors/sarah-chen.jpg",
    },
    category: "AI & Content",
    keywords: ["AI", "content strategy", "brand voice"],
    readTime: 8,
    body: `# AI Content Generation: Best Practices

Content generation is revolutionizing how brands create content. Here's how to do it right.

## Understanding Brand Fidelity

Brand Fidelity Score (BFS) measures how well your AI-generated content aligns with your brand guidelines. Aim for a score above 0.8 for best results.

## Tips for Better AI Content

1. **Provide Clear Context**: The more context you give our AI, the better the output
2. **Review and Refine**: Always review AI-generated content before publishing
3. **Use Variants**: Generate multiple variants and choose the best one
4. **Maintain Consistency**: Keep your brand guide updated for consistent results

## Common Pitfalls to Avoid

- Don't rely solely on AI without human review
- Don't ignore your brand guidelines
- Don't skip the compliance check

Ready to create better content? [Try our Creative Studio](/studio) today!`,
  },
  {
    slug: "multi-channel-content-strategy",
    title: "Multi-Channel Content Strategy: Reaching Your Audience Everywhere",
    excerpt: "Learn how to create a cohesive content strategy that works across Instagram, LinkedIn, Facebook, and more.",
    featuredImage: "/images/blog/multi-channel.jpg",
    date: "2025-01-05",
    author: {
      name: "Michael Rodriguez",
      avatar: "/images/authors/michael-rodriguez.jpg",
    },
    category: "Strategy",
    keywords: ["content strategy", "social media", "multi-channel"],
    readTime: 10,
    body: `# Multi-Channel Content Strategy

A successful content strategy reaches your audience where they are. Here's how to do it effectively.

## Why Multi-Channel Matters

Your audience is spread across multiple platforms. A multi-channel strategy ensures you:

- Reach more people
- Reinforce your message
- Build brand recognition
- Drive consistent engagement

## Platform-Specific Considerations

### Instagram
- Visual-first content
- Stories and Reels perform well
- Use relevant hashtags

### LinkedIn
- Professional tone
- Long-form content works
- Focus on value and insights

### Facebook
- Community-focused
- Mix of content types
- Engage with comments

### Google Business Profile
- Local SEO focus
- Update hours and services
- Respond to reviews

## Creating Platform-Optimized Content

Postd helps you adapt your core message for each platform while maintaining brand consistency.

[Start planning your multi-channel strategy](/calendar) today!`,
  },
];

/**
 * Get all blog posts, optionally filtered by category
 */
export function getBlogPosts(category?: string): BlogPost[] {
  let posts = [...BLOG_POSTS];
  
  // Sort by date (newest first)
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Filter by category if provided
  if (category) {
    posts = posts.filter(post => post.category.toLowerCase() === category.toLowerCase());
  }
  
  return posts;
}

/**
 * Get all unique categories
 */
export function getBlogCategories(): string[] {
  const categories = new Set(BLOG_POSTS.map(post => post.category));
  return Array.from(categories).sort();
}

