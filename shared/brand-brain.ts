/**
 * Brand Brain Types
 *
 * The Brand Brain is the per-brand AI layer responsible for:
 * - Brand memory (distilled from Brand Guide, user edits, performance)
 * - Creative QA (evaluating content for brand alignment)
 * - Providing context packs to other agents
 *
 * SCOPE: Brand Brain is the ONLY intelligence that may:
 * - Read/write brand content
 * - Read/write brand-level memory
 * - Evaluate content for a brand
 * - Suggest creative fixes based on brand rules
 */

// ============================================================================
// BRAND BRAIN STATE
// ============================================================================

/**
 * Core Brand Brain state - distilled brand memory
 * Stored in `brand_brain_state` table
 */
export interface BrandBrainState {
  id: string;
  brandId: string;

  /** Short, model-ready description of the brand */
  summary: BrandSummary;

  /** Voice & tone guidelines, do/don't phrases */
  voiceRules: VoiceRules;

  /** Colors, fonts, logo usage, visual do/don'ts */
  visualRules: VisualRules;

  /** Current expected alignment baseline (0-100) */
  bfsBaseline: number;

  /** Strictness level, channel prefs, default CTAs */
  preferences: BrandPreferences;

  /** Timestamp of last state refresh */
  lastRefreshedAt: string;

  /** Version for tracking updates */
  version: number;
}

export interface BrandSummary {
  /** One-paragraph brand description */
  description: string;
  /** Business type (e.g., "coffee shop", "accountant") */
  businessType?: string;
  /** Industry (e.g., "Retail", "Healthcare") */
  industry?: string;
  /** Core values */
  values: string[];
  /** Target audience summary */
  targetAudience?: string;
  /** Key differentiators */
  differentiators: string[];
  /** Unique value proposition */
  uvp?: string;
}

export interface VoiceRules {
  /** Tone keywords (e.g., "Friendly", "Professional") */
  tone: string[];
  /** Formality level 0-100 */
  formalityLevel: number;
  /** Friendliness level 0-100 */
  friendlinessLevel: number;
  /** Confidence level 0-100 */
  confidenceLevel: number;
  /** Narrative voice description */
  voiceDescription?: string;
  /** Specific writing rules */
  writingRules: string[];
  /** Phrases to always avoid */
  avoidPhrases: string[];
  /** Approved brand phrases */
  brandPhrases: string[];
  /** Key messages to reinforce */
  keyMessages: string[];
}

export interface VisualRules {
  /** Brand colors (hex codes) */
  colors: string[];
  /** Primary font */
  primaryFont?: string;
  /** Secondary font */
  secondaryFont?: string;
  /** Photography style must-includes */
  photographyMustInclude: string[];
  /** Photography style must-avoids */
  photographyMustAvoid: string[];
  /** Logo usage guidelines */
  logoGuidelines?: string;
  /** Additional visual notes */
  visualNotes?: string;
}

export interface BrandPreferences {
  /** Strictness level for evaluations */
  strictnessLevel: "lenient" | "moderate" | "strict";
  /** Preferred platforms */
  preferredPlatforms: string[];
  /** Default CTA style */
  defaultCtaStyle?: string;
  /** Content pillars/themes */
  contentPillars: string[];
  /** Platform-specific guidelines */
  platformGuidelines: Record<string, string>;
  /** Required disclaimers (for regulated industries) */
  requiredDisclaimers: string[];
  /** Required hashtags */
  requiredHashtags: string[];
}

// ============================================================================
// BRAND BRAIN EXAMPLES
// ============================================================================

/**
 * Brand content examples for learning
 * Stored in `brand_brain_examples` table
 */
export interface BrandBrainExample {
  id: string;
  brandId: string;
  /** Type of example */
  exampleType: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  /** Channel (instagram, email, linkedin, etc.) */
  channel: string;
  /** Content details */
  content: ExampleContent;
  /** Performance metrics */
  performance?: ExamplePerformance;
  /** Human notes/feedback */
  notes?: string;
  /** Creation timestamp */
  createdAt: string;
  /** Source of the example */
  source: "user_feedback" | "analytics" | "manual" | "system";
}

export interface ExampleContent {
  /** Main text body */
  body: string;
  /** Headline if applicable */
  headline?: string;
  /** CTA text */
  cta?: string;
  /** Hashtags used */
  hashtags?: string[];
  /** Media references */
  mediaRefs?: string[];
}

export interface ExamplePerformance {
  /** Engagement rate */
  engagementRate?: number;
  /** Reach */
  reach?: number;
  /** Clicks */
  clicks?: number;
  /** Saves */
  saves?: number;
  /** Shares */
  shares?: number;
  /** Comments */
  comments?: number;
  /** Conversions */
  conversions?: number;
}

// ============================================================================
// BRAND BRAIN EVENTS (AUDIT LOG)
// ============================================================================

/**
 * Event log for Brand Brain operations
 * Stored in `brand_brain_events` table
 */
export interface BrandBrainEvent {
  id: string;
  brandId: string;
  /** Type of event */
  eventType: BrandBrainEventType;
  /** Source agent/feature */
  source: string;
  /** Input snapshot */
  inputSnapshot: Record<string, unknown>;
  /** Result snapshot */
  resultSnapshot: Record<string, unknown>;
  /** Creation timestamp */
  createdAt: string;
  /** Creator (user ID or "system") */
  createdBy: string;
}

export type BrandBrainEventType =
  | "CONTEXT_BUILT"
  | "CONTENT_EVALUATED"
  | "EXAMPLE_ADDED"
  | "STATE_UPDATED"
  | "OUTCOME_REGISTERED"
  | "STATE_REFRESHED";

// ============================================================================
// BRAND CONTEXT PACK (OUTPUT TO AGENTS)
// ============================================================================

/**
 * Context pack provided to other agents
 * This is the standardized output from `getBrandContextPack`
 */
export interface BrandContextPack {
  /** Brand ID */
  brandId: string;
  /** Brand name */
  brandName: string;
  /** Short brand summary */
  brandSummary: BrandSummary;
  /** Voice & tone rules */
  voiceRules: VoiceRules;
  /** Visual identity rules */
  visualRules: VisualRules;
  /** Do's and don'ts */
  dosAndDonts: {
    do: string[];
    dont: string[];
  };
  /** Short example snippets */
  exampleSnippets: ExampleSnippet[];
  /** Brand positioning */
  positioning?: {
    tagline?: string;
    missionStatement?: string;
    visionStatement?: string;
  };
  /** Offers/products */
  offers?: string[];
  /** Audience segments */
  audienceSegments?: string[];
  /** Content pillars */
  contentPillars: string[];
  /** Regulated industry flags */
  regulatedIndustry?: {
    isRegulated: boolean;
    requiredDisclaimers: string[];
  };
  /** Host/CMS platform metadata (from scraper) */
  host?: {
    /** CMS/platform type: squarespace, shopify, wordpress, wix, webflow, unknown */
    type: string;
    /** Detection confidence: high, medium, low */
    confidence?: string;
  };
  /** Context pack version */
  version: number;
  /** Generated at timestamp */
  generatedAt: string;
}

export interface ExampleSnippet {
  /** Type (positive/negative) */
  type: "POSITIVE" | "NEGATIVE";
  /** Channel */
  channel: string;
  /** Short snippet text */
  text: string;
  /** Why this is a good/bad example */
  reason?: string;
}

// ============================================================================
// CONTENT EVALUATION
// ============================================================================

/**
 * Input for content evaluation
 */
export interface ContentEvaluationInput {
  /** Channel (instagram, email, linkedin, etc.) */
  channel: string;
  /** Content to evaluate */
  content: {
    body: string;
    headline?: string;
    cta?: string;
    hashtags?: string[];
    mediaRefs?: string[];
  };
  /** Content goal */
  goal: ContentGoal;
  /** Optional additional context */
  context?: string;
}

export type ContentGoal =
  | "awareness"
  | "engagement"
  | "nurture"
  | "launch"
  | "lead_gen"
  | "conversion"
  | "retention"
  | "education"
  | "entertainment";

/**
 * Output from content evaluation
 */
export interface ContentEvaluationResult {
  /** Overall score 0-100 */
  score: number;
  /** Individual checks */
  checks: EvaluationCheck[];
  /** Natural language recommendations */
  recommendations: string[];
  /** Whether auto-fix is available (future use) */
  canAutoFix: boolean;
  /** Suggested patch (future use) */
  patch?: ContentPatch;
  /** Evaluation timestamp */
  evaluatedAt: string;
  /** Evaluation version/policy ID */
  evaluationVersion: string;
}

export interface EvaluationCheck {
  /** Check name */
  name: string;
  /** Status */
  status: "pass" | "warn" | "fail";
  /** Details about the check */
  details: string;
  /** Category of check */
  category: "tone" | "visual" | "compliance" | "cta" | "platform" | "clarity";
  /** Severity weight (1-10) */
  weight: number;
}

export interface ContentPatch {
  /** Suggested body edit */
  body?: string;
  /** Suggested headline edit */
  headline?: string;
  /** Suggested CTA edit */
  cta?: string;
  /** Suggested hashtag changes */
  hashtags?: string[];
}

// ============================================================================
// OUTCOME REGISTRATION
// ============================================================================

/**
 * Input for registering content outcome
 */
export interface OutcomeRegistrationInput {
  /** Content ID */
  contentId: string;
  /** Channel */
  channel: string;
  /** Performance metrics */
  performanceMetrics: ExamplePerformance;
  /** User feedback */
  userFeedback?: {
    rating: "great" | "good" | "neutral" | "poor" | "off_brand";
    comment?: string;
  };
}

// ============================================================================
// AGENT PREFLIGHT
// ============================================================================

/**
 * Agent preflight check result
 */
export interface AgentPreflightResult {
  /** Whether preflight passed */
  passed: boolean;
  /** Brand ID confirmed */
  brandId: string;
  /** Brand context loaded */
  contextLoaded: boolean;
  /** Errors encountered */
  errors: string[];
  /** Warnings */
  warnings: string[];
  /** Agent mode */
  mode?: "context" | "evaluation" | "learning";
}

/**
 * Agent types in the system
 */
export type AgentType =
  | "brand_brain"
  | "ops_brain"
  | "copy"
  | "creative"
  | "advisor"
  | "scheduler"
  | "approvals"
  | "analytics";

/**
 * Agent preflight configuration
 */
export interface AgentPreflightConfig {
  /** Agent type */
  agentType: AgentType;
  /** Whether brand context is required */
  requiresBrandContext: boolean;
  /** Whether brand ID is required */
  requiresBrandId: boolean;
  /** Allowed to access brand content */
  canAccessBrandContent: boolean;
  /** Allowed to access platform metrics */
  canAccessMetrics: boolean;
}

// ============================================================================
// AGENT PREFLIGHT CONFIGS
// ============================================================================

export const AGENT_PREFLIGHT_CONFIGS: Record<AgentType, AgentPreflightConfig> = {
  brand_brain: {
    agentType: "brand_brain",
    requiresBrandContext: false, // It creates the context
    requiresBrandId: true,
    canAccessBrandContent: true,
    canAccessMetrics: true,
  },
  ops_brain: {
    agentType: "ops_brain",
    requiresBrandContext: false,
    requiresBrandId: false,
    canAccessBrandContent: false, // Never touches brand content
    canAccessMetrics: true, // Aggregated only
  },
  copy: {
    agentType: "copy",
    requiresBrandContext: true,
    requiresBrandId: true,
    canAccessBrandContent: true,
    canAccessMetrics: false,
  },
  creative: {
    agentType: "creative",
    requiresBrandContext: true,
    requiresBrandId: true,
    canAccessBrandContent: true,
    canAccessMetrics: false,
  },
  advisor: {
    agentType: "advisor",
    requiresBrandContext: true,
    requiresBrandId: true,
    canAccessBrandContent: true,
    canAccessMetrics: true,
  },
  scheduler: {
    agentType: "scheduler",
    requiresBrandContext: true,
    requiresBrandId: true,
    canAccessBrandContent: false, // Only sees content IDs
    canAccessMetrics: false,
  },
  approvals: {
    agentType: "approvals",
    requiresBrandContext: true,
    requiresBrandId: true,
    canAccessBrandContent: true,
    canAccessMetrics: false,
  },
  analytics: {
    agentType: "analytics",
    requiresBrandContext: false,
    requiresBrandId: true,
    canAccessBrandContent: false, // Only content IDs
    canAccessMetrics: true,
  },
};

