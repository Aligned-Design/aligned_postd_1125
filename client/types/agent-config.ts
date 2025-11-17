/**
 * AI Agent Configuration & Safety Types
 * Phase 5 - Guardrails & Quality Gates
 */

export type SafetyMode = "safe" | "bold" | "edgy_opt_in";

export type CompliancePack = "finance" | "real_estate" | "wellness" | "none";

export type AgentType = "doc" | "design" | "advisor";

/**
 * Brand Safety Configuration
 */
export interface BrandSafetyConfig {
  safety_mode: SafetyMode;
  banned_phrases: string[];
  competitor_names: string[];
  claims: string[];
  required_disclaimers: string[];
  required_hashtags: string[];
  brand_links: string[];
  disallowed_topics: string[];
  allow_topics: string[];
  compliance_pack: CompliancePack;
  platform_limits_override?: {
    instagram?: { max_hashtags?: number; max_chars?: number };
    linkedin?: { max_chars?: number };
    facebook?: { max_chars?: number };
    twitter?: { max_chars?: number };
  };
}

/**
 * Brand Fidelity Score (BFS) Result
 */
export interface BrandFidelityScore {
  overall: number; // 0-1, minimum 0.80 required
  tone_alignment: number; // 30% weight
  terminology_match: number; // 20% weight
  compliance: number; // 20% weight
  cta_fit: number; // 15% weight
  platform_fit: number; // 15% weight
  passed: boolean; // true if overall >= 0.80
  issues: string[];
  regeneration_count: number;
}

/**
 * Linter Check Results
 */
export interface LinterResult {
  passed: boolean;
  profanity_detected: boolean;
  toxicity_score: number; // 0-1
  banned_phrases_found: string[];
  banned_claims_found: string[];
  missing_disclaimers: string[];
  missing_hashtags: string[];
  platform_violations: PlatformViolation[];
  pii_detected: string[]; // emails, phones
  competitor_mentions: string[];
  fixes_applied: string[];
  blocked: boolean;
  needs_human_review: boolean;
}

export interface PlatformViolation {
  platform: string;
  issue: "char_limit" | "hashtag_limit" | "aspect_ratio" | "file_size";
  current: number;
  limit: number;
  suggestion: string;
}

/**
 * Advisor Agent Output Contract
 */
export interface AdvisorOutput {
  topics: Array<{
    title: string;
    rationale: string;
    source_posts?: string[]; // Post IDs that informed this
    date_range?: { start: string; end: string };
  }>;
  best_times: Array<{
    day: string;
    slot: string; // HH:MM format
    confidence: number;
  }>;
  format_mix: {
    reel?: number;
    carousel?: number;
    image?: number;
    story?: number;
  };
  hashtags: string[];
  keywords: string[];
  cached_at?: string;
  valid_until?: string;
}

/**
 * Doc Agent Input Contract
 */
export interface DocInput {
  topic: string;
  tone: string;
  platform: string;
  format: "reel" | "carousel" | "image" | "story" | "post";
  max_length?: number;
  include_cta: boolean;
  cta_type?: "link" | "comment" | "dm" | "bio";
  advisor_context?: AdvisorOutput;
}

/**
 * Doc Agent Output Contract
 */
export interface DocOutput {
  headline?: string;
  body: string;
  cta: string;
  hashtags: string[];
  post_theme: string;
  tone_used: string;
  aspect_ratio?: string;
  char_count: number;
  bfs: BrandFidelityScore;
  linter: LinterResult;
}

/**
 * Design Agent Input Contract
 */
export interface DesignInput {
  aspect_ratio: string; // e.g., "1080x1350"
  theme: string;
  brand_colors: string[];
  tone: string;
  headline?: string;
  doc_context?: DocOutput;
}

/**
 * Design Agent Output Contract
 */
export interface DesignOutput {
  cover_title: string;
  template_ref: string;
  alt_text: string;
  thumbnail_ref?: string;
  visual_elements: string[];
  color_palette_used: string[];
  font_suggestions: string[];
}

/**
 * Generation Log Entry
 */
export interface GenerationLog {
  id: string;
  brand_id: string;
  agent: AgentType;
  prompt_version: string;
  safety_mode: SafetyMode;
  bfs?: BrandFidelityScore;
  linter_results?: LinterResult;
  reviewer_id?: string;
  approved: boolean;
  revision: number;
  timestamp: string;
  input: unknown;
  output: unknown;
  duration_ms: number;
  error?: string;
}

/**
 * Content Generation Request
 */
export interface GenerationRequest {
  brand_id: string;
  agent: AgentType;
  input: DocInput | DesignInput | Record<string, unknown>;
  safety_mode?: SafetyMode;
  idempotency_key?: string;
}

/**
 * Content Generation Response
 */
export interface GenerationResponse {
  success: boolean;
  output?: DocOutput | DesignOutput | AdvisorOutput;
  bfs?: BrandFidelityScore;
  linter?: LinterResult;
  needs_review: boolean;
  blocked: boolean;
  error?: string;
  log_id: string;
}

/**
 * Prompt Template Metadata
 */
export interface PromptTemplate {
  agent: AgentType;
  version: string;
  locale: string;
  template: string;
  variables: string[];
  created_at: string;
  active: boolean;
}

/**
 * Safety Mode Descriptions
 */
export const SAFETY_MODE_DESCRIPTIONS: Record<SafetyMode, string> = {
  safe: "No profanity, no controversy, neutral/inclusive tone (default)",
  bold: "Persuasive, edgy metaphors allowed; still no profanity/hate",
  edgy_opt_in:
    "Explicit client opt-in only; stronger hooks; still blocks hate/violence/illegal",
};

/**
 * Compliance Pack Requirements
 */
export const COMPLIANCE_PACKS: Record<
  CompliancePack,
  {
    required_disclaimers: string[];
    banned_claims: string[];
    review_keywords: string[];
  }
> = {
  finance: {
    required_disclaimers: [
      "Investing involves risk. Past performance does not guarantee future results.",
      "Not financial advice. Consult a licensed advisor.",
    ],
    banned_claims: [
      "guaranteed returns",
      "risk-free",
      "can't lose",
      "sure thing",
      "100% profit",
    ],
    review_keywords: [
      "invest",
      "return",
      "profit",
      "portfolio",
      "stock",
      "crypto",
    ],
  },
  real_estate: {
    required_disclaimers: [
      "Actual results may vary. Not a guarantee of property value.",
      "Consult a real estate professional for specific advice.",
    ],
    banned_claims: [
      "guaranteed appreciation",
      "can't lose value",
      "always goes up",
      "risk-free investment",
    ],
    review_keywords: [
      "property",
      "investment",
      "appreciation",
      "value",
      "returns",
    ],
  },
  wellness: {
    required_disclaimers: [
      "These statements have not been evaluated by the FDA.",
      "Not intended to diagnose, treat, cure, or prevent any disease.",
      "Consult a healthcare professional before use.",
    ],
    banned_claims: [
      "cure",
      "treat disease",
      "FDA approved",
      "guaranteed results",
      "miracle",
    ],
    review_keywords: [
      "health",
      "cure",
      "treat",
      "disease",
      "medical",
      "therapy",
    ],
  },
  none: {
    required_disclaimers: [],
    banned_claims: [],
    review_keywords: [],
  },
};

/**
 * Default Brand Safety Config
 */
export const DEFAULT_SAFETY_CONFIG: BrandSafetyConfig = {
  safety_mode: "safe",
  banned_phrases: [],
  competitor_names: [],
  claims: [],
  required_disclaimers: [],
  required_hashtags: [],
  brand_links: [],
  disallowed_topics: ["politics", "religion", "medical advice"],
  allow_topics: [],
  compliance_pack: "none",
};

/**
 * Default Generation Parameters
 */
export const DEFAULT_GENERATION_PARAMS = {
  temperature: 0.5,
  top_p: 0.9,
  max_tokens: {
    doc_short: 500,
    doc_long: 2000,
    design: 300,
    advisor: 1000,
  },
  timeout_ms: 30000,
  max_retries: 1,
};

/**
 * BFS Thresholds
 */
export const BFS_THRESHOLDS = {
  minimum: 0.8,
  excellent: 0.95,
  max_regenerations: 2,
};

/**
 * Platform Limits
 */
export const PLATFORM_LIMITS = {
  instagram: {
    caption: 2200,
    hashtags: 30,
    story_text: 2200,
  },
  linkedin: {
    post: 3000,
    article: 125000,
  },
  facebook: {
    post: 63206,
  },
  twitter: {
    post: 280,
    thread: 25,
  },
};
