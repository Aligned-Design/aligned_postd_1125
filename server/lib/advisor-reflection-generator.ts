/**
 * Advisor Reflection Question Generator
 *
 * Generates thoughtful reflection questions that help users think deeper
 * about their content strategy, audience engagement, and brand alignment.
 * One question per review to encourage thoughtful consideration.
 */

import type { ReviewScore } from "./advisor-review-scorer";

export interface ReflectionQuestion {
  question: string;
  category: "clarity" | "alignment" | "resonance" | "actionability" | "platform";
  focus_area: string;
  intended_benefit: string;
  follow_up_prompts: string[];
}

/**
 * Generate a single reflection question based on review scores and output
 */
export function generateReflectionQuestion(
  scores: ReviewScore,
  advisor_output: Record<string, unknown>,
  platform: string,
  content: string
): ReflectionQuestion {
  // Identify the weakest dimension to focus on
  const dimensions = [
    { name: "clarity" as const, score: scores.clarity },
    { name: "alignment" as const, score: scores.brand_alignment },
    { name: "resonance" as const, score: scores.resonance },
    { name: "actionability" as const, score: scores.actionability },
    { name: "platform" as const, score: scores.platform_fit },
  ];

  const weakest = dimensions.reduce((prev, current) =>
    current.score < prev.score ? current : prev
  );

  // Generate question based on weakest dimension
  switch (weakest.name) {
    case "clarity":
      return generateClarityQuestion(advisor_output, content);
    case "alignment":
      return generateAlignmentQuestion(advisor_output, content);
    case "resonance":
      return generateResonanceQuestion(advisor_output, content, platform);
    case "actionability":
      return generateActionabilityQuestion(advisor_output, content);
    case "platform":
      return generatePlatformQuestion(advisor_output, content, platform);
  }
}

/**
 * Clarity: Is the message clear and well-structured?
 */
function generateClarityQuestion(
  advisor_output: Record<string, unknown>,
  content: string
): ReflectionQuestion {
  const questions = [
    {
      question:
        "If someone read this content for the first time, could they understand your core message in the first sentence?",
      category: "clarity" as const,
      focus_area: "message_structure",
      intended_benefit: "Ensures main message is immediately clear",
      follow_up_prompts: [
        "What is the single most important idea you're communicating?",
        "Does your opening sentence capture that idea?",
        "Would removing the first sentence confuse the reader?",
      ],
    },
    {
      question:
        "Does your content have a clear beginning, middle, and end, or could it benefit from better structure?",
      category: "clarity" as const,
      focus_area: "content_structure",
      intended_benefit: "Improves readability and information flow",
      follow_up_prompts: [
        "What's your opening hook?",
        "What's the main body or support?",
        "What's your closing call-to-action?",
      ],
    },
    {
      question:
        "Are you using any jargon or technical terms that your audience might not immediately understand?",
      category: "clarity" as const,
      focus_area: "language_accessibility",
      intended_benefit: "Makes content more accessible to broader audience",
      follow_up_prompts: [
        "What complex terms did you use?",
        "Could you explain them in simpler words?",
        "Would your message be stronger with simpler language?",
      ],
    },
  ];

  return questions[Math.floor(Math.random() * questions.length)];
}

/**
 * Alignment: Does this reflect your brand values and voice?
 */
function generateAlignmentQuestion(
  advisor_output: Record<string, unknown>,
  content: string
): ReflectionQuestion {
  const questions = [
    {
      question:
        "Does this content sound like it's coming from your brand, or could it fit any brand in your industry?",
      category: "alignment" as const,
      focus_area: "brand_voice",
      intended_benefit: "Strengthens unique brand identity",
      follow_up_prompts: [
        "What makes your brand voice distinct?",
        "Does this content reflect those unique qualities?",
        "How could you add more brand personality to this?",
      ],
    },
    {
      question:
        "Which of your brand values are represented in this content, and which are missing?",
      category: "alignment" as const,
      focus_area: "values_alignment",
      intended_benefit: "Ensures content reinforces brand mission",
      follow_up_prompts: [
        "What are your top 3-5 brand values?",
        "Which of these values shine through in this content?",
        "Could you weave in one more value?",
      ],
    },
    {
      question:
        "Would your most loyal brand advocate feel proud seeing this content represent your company?",
      category: "alignment" as const,
      focus_area: "brand_representation",
      intended_benefit: "Builds deeper brand loyalty and trust",
      follow_up_prompts: [
        "Who are your brand advocates?",
        "What would they appreciate about this content?",
        "What might they wish was different?",
      ],
    },
  ];

  return questions[Math.floor(Math.random() * questions.length)];
}

/**
 * Resonance: Will this emotionally connect with your audience?
 */
function generateResonanceQuestion(
  advisor_output: Record<string, unknown>,
  content: string,
  platform: string
): ReflectionQuestion {
  const platformContext =
    platform === "tiktok"
      ? "does it inspire action or conversation?"
      : platform === "linkedin"
        ? "does it provide value or insight?"
        : "does it spark interest or emotion?";

  const questions = [
    {
      question: `What emotion do you want your audience to feel after reading this, and ${platformContext}`,
      category: "resonance" as const,
      focus_area: "emotional_connection",
      intended_benefit: "Creates deeper audience engagement",
      follow_up_prompts: [
        "What's the primary feeling you want to evoke?",
        "Do the words and tone reflect that feeling?",
        "Could you strengthen the emotional connection?",
      ],
    },
    {
      question:
        "Does this content address a real problem or desire your audience has, or does it just broadcast information?",
      category: "resonance" as const,
      focus_area: "audience_relevance",
      intended_benefit: "Increases relevance and engagement",
      follow_up_prompts: [
        "What problem does your audience face?",
        "How does this content address it?",
        "Could you make that connection clearer?",
      ],
    },
    {
      question: "Is there a human story in this content, or is it entirely factual/promotional?",
      category: "resonance" as const,
      focus_area: "storytelling",
      intended_benefit: "Makes content more memorable and shareable",
      follow_up_prompts: [
        "Is there a character, challenge, or transformation?",
        "Could you add a human element to this?",
        "Who's the hero in this story—your audience or your brand?",
      ],
    },
  ];

  return questions[Math.floor(Math.random() * questions.length)];
}

/**
 * Actionability: Will your audience know what to do with this information?
 */
function generateActionabilityQuestion(
  advisor_output: Record<string, unknown>,
  content: string
): ReflectionQuestion {
  const questions = [
    {
      question:
        "What is the one action you want someone to take after reading this, and is that action obvious in the content?",
      category: "actionability" as const,
      focus_area: "call_to_action",
      intended_benefit: "Increases conversion and engagement",
      follow_up_prompts: [
        "What's your desired next step?",
        "Is your CTA clear and compelling?",
        "Is it easy for someone to take that action?",
      ],
    },
    {
      question:
        "Could someone who reads this content actually implement your advice or suggestion, or would they need more information?",
      category: "actionability" as const,
      focus_area: "implementation_clarity",
      intended_benefit: "Ensures content delivers real value",
      follow_up_prompts: [
        "What steps did you outline?",
        "Are they ordered logically?",
        "Could someone do them without asking for clarification?",
      ],
    },
    {
      question:
        "Is the effort required to act on this content realistic for your audience's situation?",
      category: "actionability" as const,
      focus_area: "effort_barrier",
      intended_benefit: "Removes friction to engagement",
      follow_up_prompts: [
        "How much time does your suggestion take?",
        "Is that realistic for your audience?",
        "How could you reduce the time or effort required?",
      ],
    },
  ];

  return questions[Math.floor(Math.random() * questions.length)];
}

/**
 * Platform: Is this optimized for where it's being posted?
 */
function generatePlatformQuestion(
  advisor_output: Record<string, unknown>,
  content: string,
  platform: string
): ReflectionQuestion {
  const platformGuidance = getPlatformGuidance(platform);

  const baseQuestions = [
    {
      question: `${platformGuidance.characteristic} Is this post optimized for that characteristic?`,
      category: "platform" as const,
      focus_area: "platform_format",
      intended_benefit: "Leverages platform strengths",
      follow_up_prompts: platformGuidance.follow_ups.slice(0, 2),
    },
    {
      question: `When will your audience see this post on ${platform}? Is that the best time to reach them?`,
      category: "platform" as const,
      focus_area: "posting_timing",
      intended_benefit: "Maximizes reach and engagement",
      follow_up_prompts: [
        "When is your audience most active on this platform?",
        "Are you posting during peak hours?",
        "Does your audience's timezone matter?",
      ],
    },
    {
      question: `What makes content perform on ${platform}? Does this post have those elements?`,
      category: "platform" as const,
      focus_area: "platform_best_practices",
      intended_benefit: "Follows platform algorithm preferences",
      follow_up_prompts: platformGuidance.follow_ups.slice(2),
    },
  ];

  return baseQuestions[Math.floor(Math.random() * baseQuestions.length)];
}

/**
 * Get platform-specific guidance for reflection questions
 */
function getPlatformGuidance(platform: string): {
  characteristic: string;
  follow_ups: string[];
} {
  const guidance: Record<
    string,
    {
      characteristic: string;
      follow_ups: string[];
    }
  > = {
    instagram: {
      characteristic: "Instagram is visual-first and values beautiful, cohesive aesthetics.",
      follow_ups: [
        "Does your image or caption pair well together?",
        "Does this fit your Instagram feed aesthetic?",
        "Would this content make someone stop scrolling?",
        "Did you use all available caption space effectively?",
      ],
    },
    tiktok: {
      characteristic: "TikTok rewards creativity, trends, and rapid engagement.",
      follow_ups: [
        "Is this content trendy or does it participate in relevant trends?",
        "Are the first 3 seconds attention-grabbing?",
        "Does this encourage comments, shares, or duets?",
        "Is the pacing fast enough to keep viewer attention?",
      ],
    },
    linkedin: {
      characteristic: "LinkedIn values professional insights, industry perspectives, and career relevance.",
      follow_ups: [
        "Does this provide professional value?",
        "Could someone share this in a business context?",
        "Does it position you or your brand as knowledgeable?",
        "Does it encourage professional conversation?",
      ],
    },
    twitter: {
      characteristic: "Twitter (X) is fast-paced and rewards wit, timeliness, and conversation.",
      follow_ups: [
        "Is this relevant to current conversation or trending topics?",
        "Is your message expressed concisely?",
        "Does it invite replies or discussion?",
        "Does your tone match the platform's conversational style?",
      ],
    },
    facebook: {
      characteristic: "Facebook is community-focused and values meaningful connections.",
      follow_ups: [
        "Does this encourage conversation or community?",
        "Is this relevant to your community's interests?",
        "Would people want to tag friends in this?",
        "Does this respect Facebook's community standards?",
      ],
    },
    email: {
      characteristic: "Email is intimate and values personalization and clear value.",
      follow_ups: [
        "Would someone open this based on the subject line?",
        "Is the value clear in the first 50 words?",
        "Would recipients want to share this?",
        "Does this feel personal or mass-produced?",
      ],
    },
  };

  return (
    guidance[platform.toLowerCase()] || {
      characteristic: "This platform has unique characteristics.",
      follow_ups: [
        "Is this formatted appropriately for this platform?",
        "Would your audience engage with this format here?",
      ],
    }
  );
}
