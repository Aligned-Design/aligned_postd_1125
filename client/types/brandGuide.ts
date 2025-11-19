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

// ✅ FIX: Add required nested structure to INITIAL_BRAND_GUIDE
export const INITIAL_BRAND_GUIDE: BrandGuide = {
  // Required nested structure
  identity: {
    name: "Hobby Lobby",
    businessType: undefined,
    industryKeywords: [],
    competitors: undefined,
    sampleHeadlines: undefined,
  },
  voiceAndTone: {
    tone: ["Warm", "Encouraging", "Accessible", "Inspirational", "Community-Focused"],
    friendlinessLevel: 80,
    formalityLevel: 40,
    confidenceLevel: 75,
    voiceDescription: "We speak like a friendly craft mentor—approachable, encouraging, and genuinely enthusiastic about creativity.",
  },
  visualIdentity: {
    colors: ["#C41E3A", "#FFD700", "#2E5090", "#F5E6D3"],
    typography: {
      heading: "Poppins",
      body: "Poppins",
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
  id: "brand-1",
  brandName: "Hobby Lobby",
  brandId: "brand-1",
  purpose:
    "To inspire families to discover their creative potential and pursue their passions through high-quality arts, crafts, and home décor products. We believe creativity strengthens families and communities.",
  mission:
    "Hobby Lobby provides affordable, accessible craft supplies and home décor to enable people of all ages to create meaningful projects. We support makers by offering quality products, expert guidance, and a welcoming community.",
  vision:
    "To be the world's most trusted resource for creative inspiration and supplies, where every customer feels empowered to make something beautiful for themselves and their loved ones.",
  summaryReviewedByAI: true,
  tone: ["Warm", "Encouraging", "Accessible", "Inspirational", "Community-Focused"],
  friendlinessLevel: 80,
  formalityLevel: 40,
  confidenceLevel: 75,
  voiceDescription:
    "We speak like a friendly craft mentor—approachable, encouraging, and genuinely enthusiastic about creativity. Our tone celebrates every skill level, from beginners to experienced makers. We use inclusive language, share inspiration freely, and make crafting feel fun and achievable for everyone.",
  aiToneSuggestions: [
    "Celebrate every creative attempt, big or small",
    "Use encouraging language that builds confidence, not intimidation",
    "Share project ideas and inspiration naturally, like a friend",
    "Focus on joy and self-expression, not perfection",
  ],
  logoUrl: "",
  fontFamily: "Poppins",
  fontSource: "google",
  customFontUrl: undefined,
  primaryColors: ["#C41E3A", "#FFD700"],
  // legacy single value for backward compatibility
  primaryColor: "#C41E3A",
  secondaryColor: "#2E5090",
  colorPalette: ["#C41E3A", "#FFD700", "#2E5090", "#F5E6D3"],
  secondaryColors: ["#2E5090", "#F5E6D3"],
  visualNotes:
    "Classic red (#C41E3A) conveys passion and creativity; gold accents add warmth and approachability. Pair with cream backgrounds for comfort and nostalgia. Use Poppins for friendly, rounded typography. Incorporate imagery of diverse families creating together.",
  personas: [],
  goals: [],
  guardrails: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completionPercentage: 85,
  setupMethod: "ai_generated",
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
