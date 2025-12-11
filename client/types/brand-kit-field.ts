/**
 * Brand Kit Field Types with Source Tracking
 *
 * Every field tracks its value, source, and update timestamp
 * Precedence: user > import > crawler
 */

export type FieldSource = "user" | "crawler" | "import";

export interface TrackedField<T = unknown> {
  value: T;
  source: FieldSource;
  last_updated_at: string;
}

export interface BrandKitWithSources {
  // Brand Basics
  brandName?: TrackedField<string>;
  websiteUrl?: TrackedField<string>;
  tagline?: TrackedField<string>;
  shortDescription?: TrackedField<string>;
  industry?: TrackedField<string>;
  primaryAudience?: TrackedField<string>;

  // Colors
  colors?: TrackedField<{
    primary: string;
    secondary: string;
    accent: string;
  }>;

  // Fonts
  fonts?: TrackedField<{
    family: string;
    weights: string[];
  }>;

  // Voice & Messaging
  tone_keywords?: TrackedField<string[]>;
  banned_phrases?: TrackedField<string[]>;
  voice_summary?: TrackedField<string>;
  brandPersonality?: TrackedField<string[]>;
  writingStyle?: TrackedField<string>;
  commonPhrases?: TrackedField<string>;

  // Visual
  imagery_style?: TrackedField<string[]>;

  // Keywords
  keywords?: TrackedField<string[]>;
  keyword_themes?: TrackedField<string[]>;

  // About
  about_blurb?: TrackedField<string>;

  // Host-aware copy extraction fields (from crawler)
  heroHeadline?: TrackedField<string>;
  aboutText?: TrackedField<string>;
  services?: TrackedField<string[]>;

  // Settings
  crawler_settings?: {
    auto_apply: boolean;
    preserve_user_overrides: boolean;
    fields_enabled: string[];
    allow_contact_info: boolean;
  };
}

export interface CrawlerSuggestion {
  field: string;
  label: string;
  currentValue: unknown;
  currentSource: FieldSource;
  suggestedValue: unknown;
  confidence: number;
  category: "colors" | "fonts" | "tone" | "keywords" | "about" | "other";
}

export interface CrawlResult {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  suggestions: CrawlerSuggestion[];
  palette: string[];
  keywords: string[];
  error?: string;
  started_at: string;
  completed_at?: string;
}

export interface FieldChange {
  field: string;
  value: unknown;
  source: FieldSource;
  force_user_override?: boolean; // admin only
}

export interface FieldHistoryEntry {
  timestamp: string;
  field: string;
  old_value: unknown;
  new_value: unknown;
  old_source: FieldSource;
  new_source: FieldSource;
  changed_by: "user" | "crawler" | "system";
  user_id?: string;
}

export interface BrandKitHistory {
  brand_id: string;
  changes: FieldHistoryEntry[];
  max_entries: number; // Default: 10 per field
}

/**
 * Helper to create a tracked field
 */
export function createTrackedField<T>(
  value: T,
  source: FieldSource = "user",
): TrackedField<T> {
  return {
    value,
    source,
    last_updated_at: new Date().toISOString(),
  };
}

/**
 * Helper to check if field can be updated by crawler
 */
export function canCrawlerUpdate(
  field: TrackedField<unknown> | undefined,
): boolean {
  if (!field) return true; // No existing value, crawler can set it
  return field.source !== "user"; // Only update if not user-edited
}

/**
 * Helper to get display label for source
 */
export function getSourceLabel(source: FieldSource): string {
  const labels: Record<FieldSource, string> = {
    user: "Manually entered",
    crawler: "AI suggestion",
    import: "Imported",
  };
  return labels[source];
}
