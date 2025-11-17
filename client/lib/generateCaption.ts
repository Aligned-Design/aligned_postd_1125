import { BrandGuide } from "@/types/brandGuide";
import { Design } from "@/types/creativeStudio";

/**
 * Generate mock AI captions based on brand tone and design context
 * Uses brand voice attributes to create contextually relevant suggestions
 */
export function generateCaptions(brand: BrandGuide | null, design: Design | null): string[] {
  const captions: string[] = [];

  if (!brand) {
    return [
      "Share your creativity with the world",
      "Inspire and engage your audience",
      "Tell your story visually",
    ];
  }

  // Get tone attributes
  const tones = brand.tone || [];
  const voice = brand.voiceDescription || "";
  const purpose = brand.purpose || "";
  const mission = brand.mission || "";

  // Caption templates based on tone
  const friendlyTemplates = [
    "Hey there! Check this out →",
    "We're excited to share this with you!",
    "Come join us! 👋",
    "Love this? You will too!",
    "Can't wait to show you this 🎉",
  ];

  const professionalTemplates = [
    "Discover what's possible with us",
    "Innovation meets excellence",
    "Elevating standards in our industry",
    "Your partner in success",
    "Setting the benchmark for quality",
  ];

  const confidentTemplates = [
    "This is how we do it",
    "Leading the way forward",
    "Proven results, delivered",
    "We know what works",
    "Trust the expert",
  ];

  const engagementTemplates = [
    "What do you think? Drop your thoughts below 👇",
    "Tag someone who needs to see this",
    "Help us spread the word!",
    "Your feedback matters to us",
    "Let's start a conversation",
  ];

  // Combine templates based on detected tones
  let selectedTemplates: string[] = [];

  if (tones.includes("Friendly") || tones.includes("Warm")) {
    selectedTemplates.push(...friendlyTemplates);
  }

  if (tones.includes("Professional") || tones.includes("Formal")) {
    selectedTemplates.push(...professionalTemplates);
  }

  if (tones.includes("Confident") || tones.includes("Bold")) {
    selectedTemplates.push(...confidentTemplates);
  }

  if (tones.includes("Engaging") || tones.includes("Conversational")) {
    selectedTemplates.push(...engagementTemplates);
  }

  // If no specific tones, use purpose/mission-based templates
  if (selectedTemplates.length === 0) {
    if (mission && mission.toLowerCase().includes("help")) {
      selectedTemplates = [
        "We're here to help you succeed",
        "Supporting your journey",
        "Making a difference together",
        "Your success is our mission",
        "We've got you covered",
      ];
    } else if (purpose && purpose.toLowerCase().includes("inspire")) {
      selectedTemplates = [
        "Be inspired by what's possible",
        "Your inspiration starts here",
        "Unlock your potential",
        "Dream bigger with us",
        "Inspiration, delivered",
      ];
    } else {
      selectedTemplates = [
        "Discover our latest creation",
        "Experience the difference",
        "See what we've been working on",
        "Here's something special",
        "Check out what's new",
      ];
    }
  }

  // Add design-specific context if available
  if (design) {
    const hasImage = design.items.some((item) => item.type === "image");
    const hasText = design.items.some((item) => item.type === "text");

    if (hasImage && hasText) {
      captions.push(`${selectedTemplates[0]} ${brand.brandName}`);
      captions.push(`Bringing ${brand.brandName} to life ✨`);
    } else if (hasImage) {
      captions.push(`Visual storytelling at its finest`);
      captions.push(`A picture is worth a thousand words`);
    } else if (hasText) {
      captions.push(`Words of wisdom from ${brand.brandName}`);
      captions.push(`Here's what we're thinking...`);
    }
  }

  // Add hashtag suggestion
  const brandNameTag = brand.brandName.toLowerCase().replace(/\s+/g, "");
  captions.push(`#${brandNameTag} #ContentCreation`);
  captions.push(`#${brandNameTag} #BrandStory`);

  // Return unique captions, max 10
  return Array.from(new Set(captions)).slice(0, 10);
}

/**
 * Get caption suggestions with explanations
 */
export function getCaptionWithReasoning(brand: BrandGuide | null, design: Design | null): { caption: string; reasoning: string }[] {
  const captions = generateCaptions(brand, design);

  const reasonings = [
    `Aligns with ${brand?.voiceDescription || "your brand voice"}`,
    `Reflects ${brand?.purpose || "your mission"}`,
    `Matches ${brand?.tone?.[0] || "your brand"} tone`,
    `Encourages audience engagement`,
    `Branded hashtag for recognition`,
    `Emphasizes your unique value`,
    `Creates emotional connection`,
    `Drives calls to action`,
    `Builds community narrative`,
    `Maintains brand consistency`,
  ];

  return captions.map((caption, idx) => ({
    caption,
    reasoning: reasonings[idx % reasonings.length],
  }));
}
