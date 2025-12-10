export interface Persona {
  id: string;
  name: string;
  role: string;
  description: string;
  painPoints: string[];
  goals: string[];
  isAIGenerated: boolean;
}

export interface BrandGoal {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  measurable: string;
  timeline: string;
  progress: number; // 0-100
  status: string; // 'not_started' | 'in_progress' | 'completed' preferred
}

export interface Guardrail {
  id: string;
  title: string;
  description: string;
  category: "tone" | "messaging" | "visual" | "behavior";
  isActive: boolean;
}

// Re-export shared BrandGuide type for client use
import type { BrandGuide as SharedBrandGuide } from "@shared/brand-guide";

// Extend with client-specific fields and backward compatibility
export interface BrandGuide extends SharedBrandGuide {
  // Backwards-compatible single-value and legacy fields for Creative Studio
  primaryColor?: string;
  secondaryColor?: string;
  colorPalette?: string[];
  secondaryColors?: string[];
  fontFamily?: string; // Legacy alias for visualIdentity.typography.heading
  logoUrl?: string; // Legacy alias for visualIdentity.logoUrl
  summaryReviewedByAI?: boolean;
  aiToneSuggestions?: string[];
  completionPercentage?: number; // 0-100
  
  // Legacy flat fields for backward compatibility (mapped from nested structure)
  tone?: string[]; // Legacy alias for voiceAndTone.tone
  friendlinessLevel?: number; // Legacy alias for voiceAndTone.friendlinessLevel
  formalityLevel?: number; // Legacy alias for voiceAndTone.formalityLevel
  confidenceLevel?: number; // Legacy alias for voiceAndTone.confidenceLevel
  primaryColors?: string[]; // Legacy alias for visualIdentity.colors
  guardrails?: Guardrail[]; // Legacy alias for contentRules.guardrails
  voiceDescription?: string; // Legacy alias for voiceAndTone.voiceDescription
  fontSource?: "google" | "custom"; // Legacy alias for visualIdentity.typography.source
  customFontUrl?: string; // ✅ FIX: Add customFontUrl to BrandGuide (used in VisualIdentityEditor)
  visualNotes?: string; // Legacy alias for visualIdentity.visualNotes
}

export interface BrandGuideFormData {
  purpose: string;
  mission: string;
  vision: string;
  tone: string[];
  friendlinessLevel: number;
  formalityLevel: number;
  confidenceLevel: number;
  voiceDescription: string;
  logoUrl: string;
  fontFamily: string;
  fontSource?: "google" | "custom";
  customFontUrl?: string;
  primaryColors: string[];
  secondaryColors: string[];
  visualNotes: string;
  personas: Persona[];
  goals: BrandGoal[];
  guardrails: Guardrail[];
}

export const TONE_OPTIONS = [
  "Friendly",
  "Professional",
  "Approachable",
  "Confident",
  "Playful",
  "Inspirational",
  "Authoritative",
  "Conversational",
  "Witty",
  "Empathetic",
  "Direct",
  "Casual",
  "Formal",
  "Educational",
  "Warm",
];

/**
 * INITIAL_BRAND_GUIDE - Generic template for new brand guides
 * 
 * ⚠️ TEMPLATE ONLY: This is used as a starting template when users skip the wizard.
 * The brandName and brandId are always overridden with real values before saving.
 * 
 * DO NOT use specific brand names here - keep it generic.
 */
export const INITIAL_BRAND_GUIDE: BrandGuide = {
  // Required nested structure
  identity: {
    name: "", // Overridden with real brand name
    businessType: undefined,
    industryKeywords: [],
    competitors: undefined,
    sampleHeadlines: undefined,
  },
  voiceAndTone: {
    tone: ["Professional", "Friendly", "Trustworthy"],
    friendlinessLevel: 70,
    formalityLevel: 50,
    confidenceLevel: 70,
    voiceDescription: "We communicate in a professional yet approachable manner, building trust with our audience.",
  },
  visualIdentity: {
    colors: ["#3B82F6", "#10B981", "#6366F1", "#F59E0B"],
    typography: {
      heading: "Inter",
      body: "Inter",
      source: "google",
    },
    photographyStyle: {
      mustInclude: [],
      mustAvoid: [],
    },
    logoUrl: "",
    visualNotes: "",
  },
  contentRules: {
    neverDo: [],
    guardrails: [],
  },
  // Legacy flat fields
  id: "", // Overridden with real brand ID
  brandName: "", // Overridden with real brand name
  brandId: "", // Overridden with real brand ID
  purpose:
    "We exist to provide exceptional value and service to our customers, helping them achieve their goals through our products and expertise.",
  mission:
    "To deliver outstanding solutions that meet our customers' needs while building lasting relationships based on trust and quality.",
  vision:
    "To be the leading provider in our industry, known for innovation, integrity, and customer satisfaction.",
  summaryReviewedByAI: false,
  tone: ["Professional", "Friendly", "Trustworthy"],
  friendlinessLevel: 70,
  formalityLevel: 50,
  confidenceLevel: 70,
  voiceDescription:
    "We communicate in a professional yet approachable manner. Our tone is confident but not arrogant, helpful without being condescending. We aim to be clear and direct while maintaining warmth and authenticity.",
  aiToneSuggestions: [
    "Be clear and direct in all communications",
    "Show expertise without being condescending",
    "Build trust through consistency and honesty",
    "Focus on customer needs and outcomes",
  ],
  logoUrl: "",
  fontFamily: "Inter",
  fontSource: "google",
  customFontUrl: undefined,
  primaryColors: ["#3B82F6", "#10B981"],
  // legacy single value for backward compatibility
  primaryColor: "#3B82F6",
  secondaryColor: "#6366F1",
  colorPalette: ["#3B82F6", "#10B981", "#6366F1", "#F59E0B"],
  secondaryColors: ["#6366F1", "#F59E0B"],
  visualNotes:
    "Use the primary blue for key actions and headers. Green accents convey trust and success. Purple adds sophistication. Keep layouts clean and professional.",
  personas: [],
  goals: [],
  guardrails: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completionPercentage: 50, // Lower since it's just a template
  setupMethod: "template", // Changed from "ai_generated" to "template"
  version: 1,
};

export function calculateCompletionPercentage(data: BrandGuide): number {
  const fields = [
    // Summary (20%)
    { key: "purpose", weight: 7 },
    { key: "mission", weight: 7 },
    { key: "vision", weight: 6 },
    // Voice & Tone (25%)
    { key: "tone", weight: 12, check: (v: any) => v.length > 0 },
    { key: "voiceDescription", weight: 13 },
    // Visual Identity (20%)
    { key: "logoUrl", weight: 10, check: (v: any) => v.length > 0 },
    { key: "primaryColors", weight: 10, check: (v: any) => v.length > 0 },
    // Personas (10%)
    { key: "personas", weight: 10, check: (v: any) => v.length > 0 },
    // Goals (10%)
    { key: "goals", weight: 10, check: (v: any) => v.length > 0 },
    // Guardrails (5%)
    { key: "guardrails", weight: 5, check: (v: any) => v.length > 0 },
  ];

  let completed = 0;
  let total = 0;

  fields.forEach(({ key, weight, check }) => {
    total += weight;
    const value = data[key as keyof BrandGuide];
    const isComplete = check ? (value != null && check(value)) : Boolean(value);
    if (isComplete) completed += weight;
  });

  return Math.round((completed / total) * 100);
}
