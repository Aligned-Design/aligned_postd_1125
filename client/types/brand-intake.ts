export interface BrandIntakeFormData {
  // Section 1: Brand Basics
  brandName: string;
  websiteUrl: string;
  tagline: string;
  shortDescription: string;
  industry: string;
  primaryAudience: string;

  // Section 2: Voice & Messaging
  brandPersonality: string[];
  toneKeywords: string[];
  writingStyle: string;
  faithValuesIntegration: boolean;
  faithValuesDetails: string;
  wordsToAvoid: string;
  commonPhrases: string;

  // Section 3: Visual Identity
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontWeights: string[];
  logoFiles: File[];
  brandImageryFiles: File[];
  referenceMaterialLinks: string[];

  // Section 4: Content Preferences
  platformsUsed: string[];
  postFrequency: string;
  preferredContentTypes: string[];
  hashtagsToInclude: string[];
  competitorsOrInspiration: string[];

  // Section 5: Operational & Compliance
  approvalWorkflow: string;
  requiredDisclaimers: string;
  contentRestrictions: string;
  socialHandles: string[];

  // Section 6: AI Training Assets
  textReferenceFiles: File[];
  visualReferenceFiles: File[];
  previousContentFiles: File[];
  aiNotes: string;
}

export interface VoiceSummary {
  tone: string[];
  audience: string;
  language_style: string;
  avoid: string[];
  personality: string[];
  writing_style: string;
}

export interface VisualSummary {
  colors: string[];
  fonts: string[];
  style: string;
  logo_urls: string[];
  reference_urls: string[];
}

export const INDUSTRIES = [
  "Real Estate",
  "Wellness",
  "Finance",
  "Technology",
  "Healthcare",
  "Education",
  "Retail",
  "Food & Beverage",
  "Professional Services",
  "Entertainment",
  "Other",
];

export const BRAND_PERSONALITIES = [
  "Friendly",
  "Bold",
  "Professional",
  "Playful",
  "Sophisticated",
  "Inspiring",
  "Innovative",
  "Trustworthy",
  "Energetic",
  "Calm",
];

export const WRITING_STYLES = [
  "Conversational",
  "Formal",
  "Inspirational",
  "Educational",
  "Witty",
  "Direct",
];

export const PLATFORMS = [
  "Instagram",
  "Facebook",
  "LinkedIn",
  "X (Twitter)",
  "Google Business Profile",
  "TikTok",
  "Pinterest",
];

export const POST_FREQUENCIES = [
  "3× per week",
  "5× per week",
  "Daily",
  "Multiple times daily",
  "Custom",
];

export const CONTENT_TYPES = [
  "Reels/Short Video",
  "Carousel",
  "Static Image",
  "Blog Post",
  "Email Newsletter",
  "Stories",
  "Long-form Video",
];

export const APPROVAL_WORKFLOWS = [
  "Single Approver",
  "Multi-step Approval",
  "Auto-approve (High Trust)",
  "Custom Workflow",
];

export const FONT_FAMILIES = [
  "Nourd",
  "Inter",
  "Roboto",
  "Playfair Display",
  "Montserrat",
  "Open Sans",
  "Lato",
  "Custom",
];

export const FONT_WEIGHTS = [
  "Regular (400)",
  "Medium (500)",
  "Semi-Bold (600)",
  "Bold (700)",
  "Extra Bold (800)",
];
