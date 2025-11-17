import { Event, EventType, EVENT_TYPE_CONFIGS, PromotionPost, AIGeneratedContent } from "@/types/event";

export interface EventGenerationInput {
  eventType: EventType;
  goal: string;
  targetAudience: string;
  startDate: string;
  brand: string;
  description?: string;
  location?: string;
}

/**
 * Generate AI content for events based on type and user input
 * Multi-layer generation: title, description, promotions, schedule, cross-platform variants
 */
export function generateEventContent(input: EventGenerationInput): AIGeneratedContent {
  const config = EVENT_TYPE_CONFIGS[input.eventType];
  const postingCadence = config.defaultPostingCadence;

  // Generate title variations based on event type
  const titles = generateEventTitles(input);
  const descriptions = generateEventDescriptions(input, titles[0]);
  const promotionPosts = generatePromotionPosts(input, postingCadence);
  const hashtags = generateHashtags(input);
  const imagePrompts = generateImagePrompts(input);

  // Calculate estimated reach lift based on event type and strategy
  const estimatedReachLift = calculateReachLift(input.eventType, promotionPosts.length);

  return {
    eventTitle: titles[0],
    eventDescription: descriptions[0],
    promotionContent: {
      before: extractPromotionsByType(promotionPosts, "before").map((p) => p.content),
      during: extractPromotionsByType(promotionPosts, "during").map((p) => p.content),
      after: extractPromotionsByType(promotionPosts, "after").map((p) => p.content),
    },
    hashtagsSuggested: hashtags,
    imageprompts: imagePrompts,
    postingCadence: {
      preEventDays: postingCadence.preEventDays,
      postEventDays: postingCadence.postEventDays,
      postsPerDay: 1,
    },
    estimatedReachLift,
  };
}

function generateEventTitles(input: EventGenerationInput): string[] {
  const { eventType, goal, brand } = input;

  const templates: Record<EventType, string[]> = {
    digital: [
      `${goal} – ${brand} Webinar`,
      `Join Us: ${goal} with ${brand}`,
      `Live Webinar: ${goal}`,
    ],
    in_person: [
      `${goal} Event`,
      `Join Us: ${goal}`,
      `${brand} ${goal}`,
    ],
    promo: [
      `Limited Time: ${goal}`,
      `Don't Miss: ${goal}`,
      `Exclusive: ${goal}`,
    ],
  };

  return templates[eventType] || ["Event: " + goal];
}

function generateEventDescriptions(input: EventGenerationInput, title: string): string[] {
  const { eventType, goal, targetAudience, description } = input;

  const config = EVENT_TYPE_CONFIGS[eventType];

  const baseDescription = description || `Join us for an exclusive ${config.name.toLowerCase()} event.`;

  const templates: Record<EventType, string[]> = {
    digital: [
      `${baseDescription} Learn about ${goal} from industry experts. Perfect for ${targetAudience}. Register now for exclusive access to recording and Q&A.`,
      `Discover ${goal} in this interactive webinar. ${targetAudience} will learn practical strategies they can apply immediately. Limited spots available!`,
    ],
    in_person: [
      `${baseDescription} We're excited to host ${goal} for our community. Join us and connect with fellow ${targetAudience}. Refreshments provided!`,
      `Join us for an unforgettable ${goal} event! Meet amazing ${targetAudience}, enjoy great conversations, and make meaningful connections.`,
    ],
    promo: [
      `${baseDescription} ${goal} is happening now! This exclusive offer is for ${targetAudience} only. Hurry - limited time available!`,
      `Don't miss out! ${goal} is here for ${targetAudience}. Save big on your favorite products and services. Offer ends soon!`,
    ],
  };

  return templates[eventType] || [baseDescription];
}

function generatePromotionPosts(input: EventGenerationInput, postingCadence: any): PromotionPost[] {
  const { eventType, goal, targetAudience, startDate, brand } = input;
  const config = EVENT_TYPE_CONFIGS[eventType];

  const startDateObj = new Date(startDate);
  const posts: PromotionPost[] = [];

  // Generate "before" posts
  const beforePostCount = Math.min(3, Math.ceil(postingCadence.preEventDays / 3));
  for (let i = 0; i < beforePostCount; i++) {
    const daysBeforeEvent = postingCadence.preEventDays - i * 3;
    const postDate = new Date(startDateObj);
    postDate.setDate(postDate.getDate() - daysBeforeEvent);

    const beforeContent = generateBeforeEventContent(eventType, goal, targetAudience, brand);
    posts.push({
      id: `promo-before-${i}`,
      type: "before",
      title: `Pre-Event Promo ${i + 1}`,
      content: beforeContent[i] || beforeContent[0],
      platforms: ["facebook", "google_business"],
      scheduledDate: postDate.toISOString().split("T")[0],
      status: "draft",
    });
  }

  // Generate "during" post
  const duringContent = generateDuringEventContent(eventType, goal, brand);
  posts.push({
    id: "promo-during",
    type: "during",
    title: "Live Event Post",
    content: duringContent,
    platforms: ["facebook"],
    scheduledDate: startDate,
    status: "draft",
  });

  // Generate "after" posts
  const afterPostCount = Math.min(2, Math.ceil(postingCadence.postEventDays / 3));
  for (let i = 0; i < afterPostCount; i++) {
    const daysAfterEvent = 1 + i * 3;
    const postDate = new Date(startDateObj);
    postDate.setDate(postDate.getDate() + daysAfterEvent);

    const afterContent = generateAfterEventContent(eventType, goal, brand);
    posts.push({
      id: `promo-after-${i}`,
      type: "after",
      title: `Post-Event Follow-up ${i + 1}`,
      content: afterContent[i] || afterContent[0],
      platforms: ["facebook", "google_business", "squarespace"],
      scheduledDate: postDate.toISOString().split("T")[0],
      status: "draft",
    });
  }

  return posts;
}

function generateBeforeEventContent(
  eventType: EventType,
  goal: string,
  audience: string,
  brand: string
): string[] {
  const templates: Record<EventType, string[]> = {
    digital: [
      `🚨 Don't miss out! We're hosting a webinar on ${goal}. Register now and get exclusive bonuses. Limited spots available! 🔗 [Register]`,
      `📚 Learn from the experts! Join us for an in-depth session on ${goal}. Perfect for ${audience}. Register here: 🔗 [Register]`,
      `✨ This Friday: ${goal} webinar with ${brand}. Bring your toughest questions and get expert answers. Free to attend! 🔗 [Register]`,
    ],
    in_person: [
      `🎉 Mark your calendar! We're hosting ${goal}. Join us and connect with amazing ${audience}! Refreshments provided. 🔗 [RSVP]`,
      `🌟 Something exciting is coming! ${brand} is hosting ${goal}. Be there for great conversations and new connections! 🔗 [Event Details]`,
      `🤝 You're invited! ${goal} is happening soon. Connect with fellow ${audience} and make meaningful connections. See you there! 🔗 [RSVP]`,
    ],
    promo: [
      `🔥 Limited Time Offer! ${goal} is happening now. Don't miss out on this exclusive deal! 🏷️ [Shop Now]`,
      `⏰ Hurry! ${goal} for ${audience}. This offer is available for a limited time only. 🏷️ [Get Your Deal]`,
      `💰 Save Big! ${goal} is here! Get incredible savings on your favorite items. Offer ends soon! 🏷️ [Shop Now]`,
    ],
  };

  return templates[eventType] || [];
}

function generateDuringEventContent(eventType: EventType, goal: string, brand: string): string {
  const templates: Record<EventType, string> = {
    digital: `🔴 LIVE NOW! We're hosting our ${goal} webinar with ${brand}. Tune in for expert insights and exclusive Q&A. 📹 [Watch Live]`,
    in_person: `🎉 HAPPENING NOW! ${goal} is live! Come join us at ${brand}! 🎊`,
    promo: `🔥 DEAL IS LIVE! ${goal} is happening right now. Hurry and get your offer before it expires! 🏷️ [Shop Now]`,
  };

  return templates[eventType] || "Event is happening now!";
}

function generateAfterEventContent(
  eventType: EventType,
  goal: string,
  brand: string
): string[] {
  const templates: Record<EventType, string[]> = {
    digital: [
      `📹 Thank you for attending! Watch the full recording of our ${goal} webinar. Exclusive access for registered attendees. 🔗 [Watch Now]`,
      `💡 Missed the live session? No worries! Full recording + Q&A transcript available for registrants. Get your access now. 🔗 [Access Recording]`,
    ],
    in_person: [
      `🙏 Thank you for joining our ${goal} event! Check out photos from the celebration. 📸 🔗 [See Photos]`,
      `✨ What an amazing event! Thanks to everyone who attended. Let's stay connected! 🌟 🔗 [Join Our Community]`,
    ],
    promo: [
      `🎉 Thank you for shopping our ${goal}! Check out more great deals available now. 🛍️ 🔗 [Shop More]`,
      `💝 Hope you loved your ${goal} purchase! Check out similar offers. Share your experience with us! ⭐ 🔗 [Leave Review]`,
    ],
  };

  return templates[eventType] || [];
}

function generateHashtags(input: EventGenerationInput): string[] {
  const { eventType, goal, brand } = input;

  const baseHashtags = [
    `#${brand.replace(/\s+/g, "")}`,
    `#${goal.replace(/\s+/g, "")}`,
  ];

  const typeHashtags: Record<EventType, string[]> = {
    digital: ["#Webinar", "#Virtual", "#Online", "#LearningEvent"],
    in_person: ["#Event", "#Community", "#Meetup", "#Connect"],
    promo: ["#Sale", "#LimitedTime", "#Deal", "#SaveBig"],
  };

  return [...baseHashtags, ...typeHashtags[eventType]];
}

function generateImagePrompts(input: EventGenerationInput): string[] {
  const { eventType, goal, brand } = input;

  const prompts: Record<EventType, string[]> = {
    digital: [
      `Professional webinar setup with screen showing ${goal} title, presenter visible`,
      `Diverse group attending online webinar, engaged and taking notes`,
      `Key statistics or insights from ${goal} displayed graphically`,
    ],
    in_person: [
      `Diverse group of people mingling and networking at an event`,
      `People enjoying refreshments and engaging in conversation`,
      `Community event with people smiling and connecting`,
    ],
    promo: [
      `Eye-catching sale promotion with discount tags and special offers`,
      `Customers shopping and saving with big discount signs`,
      `Vibrant promotional display highlighting the ${goal} offer`,
    ],
  };

  return prompts[eventType] || [];
}

function extractPromotionsByType(
  posts: PromotionPost[],
  type: "before" | "during" | "after"
): PromotionPost[] {
  return posts.filter((p) => p.type === type);
}

function calculateReachLift(eventType: EventType, postCount: number): number {
  // Base reach lift percentages by event type
  const baseLifts: Record<EventType, number> = {
    digital: 35,
    in_person: 40,
    promo: 50,
  };

  const baseReachLift = baseLifts[eventType];

  // Add 5% for each additional promotional post beyond 3
  const additionalLift = Math.max(0, (postCount - 3) * 5);

  return baseReachLift + additionalLift;
}

/**
 * Generate a complete event object with AI-generated content
 */
export function generateCompleteEvent(
  input: EventGenerationInput & { startTime?: string; endTime?: string }
): Partial<Event> {
  const content = generateEventContent(input);
  const config = EVENT_TYPE_CONFIGS[input.eventType];

  const promotionSchedule: PromotionPost[] = [];

  // Convert generated content back to PromotionPost objects
  (content.promotionContent?.before || []).forEach((text, idx) => {
    promotionSchedule.push({
      id: `promo-before-${idx}`,
      type: "before",
      title: `Pre-Event Post ${idx + 1}`,
      content: text,
      platforms: ["facebook", "google_business"],
      scheduledDate: new Date(new Date(input.startDate).getTime() - 5 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      status: "draft",
    });
  });

  (content.promotionContent?.during || []).forEach((text, idx) => {
    promotionSchedule.push({
      id: `promo-during-${idx}`,
      type: "during",
      title: `Live Event Post`,
      content: text,
      platforms: ["facebook"],
      scheduledDate: input.startDate,
      status: "draft",
    });
  });

  (content.promotionContent?.after || []).forEach((text, idx) => {
    promotionSchedule.push({
      id: `promo-after-${idx}`,
      type: "after",
      title: `Post-Event Post ${idx + 1}`,
      content: text,
      platforms: ["facebook", "google_business", "squarespace"],
      scheduledDate: new Date(new Date(input.startDate).getTime() + 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      status: "draft",
    });
  });

  return {
    title: content.eventTitle || input.goal,
    description: content.eventDescription || input.description,
    location: input.location || "TBD",
    startDate: input.startDate,
    startTime: input.startTime || "18:00",
    endDate: input.startDate,
    endTime: input.endTime || "19:00",
    eventType: input.eventType,
    status: "draft",
    visibility: "public",
    tags: content.hashtagsSuggested || [],
    brand: input.brand,
    platforms: [
      { platform: "facebook", isConnected: true, syncStatus: "pending" },
      { platform: "google_business", isConnected: true, syncStatus: "pending" },
      { platform: "squarespace", isConnected: false, syncStatus: "not_linked" },
    ],
    promotionSchedule,
    aiGeneratedContent: content,
    isAIGenerated: true,
  };
}
