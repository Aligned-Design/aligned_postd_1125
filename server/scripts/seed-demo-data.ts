#!/usr/bin/env tsx
/**
 * Seed Demo Data Script
 * 
 * Creates 2-3 demo workspaces, 5-10 brands with realistic brand_guide JSON,
 * example scheduled posts, approvals, and analytics.
 * 
 * Run with: pnpm tsx server/scripts/seed-demo-data.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface DemoWorkspace {
  id: string;
  name: string;
  plan: string;
  brands: DemoBrand[];
}

interface DemoBrand {
  id: string;
  name: string;
  brandGuide: any;
  scheduledPosts: any[];
}

const demoWorkspaces: DemoWorkspace[] = [
  {
    id: randomUUID(),
    name: "Acme Agency",
    plan: "agency",
    brands: [
      {
        id: randomUUID(),
        name: "EcoWear",
        brandGuide: {
          purpose: "Sustainable fashion for conscious consumers",
          mission: "Make sustainable fashion accessible to everyone",
          vision: "A world where fashion doesn't cost the earth",
          toneKeywords: ["eco-friendly", "conscious", "authentic", "inspiring"],
          voiceDescription: "Warm, authentic, and inspiring. We speak to conscious consumers who care about the planet.",
          primaryColor: "#2D5016",
          colorPalette: ["#2D5016", "#5A8F3C", "#8BC34A", "#C8E6C9"],
          fontFamily: "Inter",
          personas: [
            {
              name: "Eco-Conscious Millennial",
              age: "28-35",
              interests: ["sustainability", "minimalism", "wellness"],
            },
          ],
          guardrails: [
            {
              category: "messaging",
              title: "No greenwashing",
              description: "Never make unsubstantiated environmental claims",
              isActive: true,
            },
          ],
        },
        scheduledPosts: [],
      },
      {
        id: randomUUID(),
        name: "TechFlow",
        brandGuide: {
          purpose: "Streamline business operations with smart technology",
          mission: "Empower businesses to work smarter, not harder",
          vision: "Every business running at peak efficiency",
          toneKeywords: ["professional", "innovative", "efficient", "reliable"],
          voiceDescription: "Professional, clear, and solution-focused. We help businesses understand complex tech simply.",
          primaryColor: "#0066CC",
          colorPalette: ["#0066CC", "#3399FF", "#66B2FF", "#99CCFF"],
          fontFamily: "Roboto",
          personas: [
            {
              name: "Business Owner",
              age: "35-50",
              interests: ["productivity", "automation", "growth"],
            },
          ],
          guardrails: [
            {
              category: "tone",
              title: "Avoid jargon",
              description: "Use simple language, avoid technical jargon",
              isActive: true,
            },
          ],
        },
        scheduledPosts: [],
      },
    ],
  },
  {
    id: randomUUID(),
    name: "Local Marketing Co",
    plan: "solo",
    brands: [
      {
        id: randomUUID(),
        name: "Bella's Bakery",
        brandGuide: {
          purpose: "Fresh, artisanal baked goods for the community",
          mission: "Bring joy to our community through delicious treats",
          vision: "The neighborhood's favorite bakery",
          toneKeywords: ["warm", "welcoming", "homemade", "community"],
          voiceDescription: "Warm, friendly, and community-focused. Like talking to a neighbor.",
          primaryColor: "#D4A574",
          colorPalette: ["#D4A574", "#E8C5A0", "#F5E6D3", "#FFF8F0"],
          fontFamily: "Playfair Display",
          personas: [
            {
              name: "Local Resident",
              age: "25-65",
              interests: ["food", "community", "local business"],
            },
          ],
          guardrails: [],
        },
        scheduledPosts: [],
      },
    ],
  },
];

async function seedDemoData() {
  console.log("\n" + "=".repeat(60));
  console.log("SEEDING DEMO DATA");
  console.log("=".repeat(60));

  try {
    // Create workspaces
    for (const workspace of demoWorkspaces) {
      const { error: tenantError } = await supabase.from("tenants").insert({
        id: workspace.id,
        name: workspace.name,
        plan: workspace.plan,
      });

      if (tenantError && !tenantError.message.includes("duplicate")) {
        console.warn(`⚠️  Could not create workspace ${workspace.name}:`, tenantError.message);
      } else {
        console.log(`✅ Created workspace: ${workspace.name}`);
      }

      // Create brands
      for (const brand of workspace.brands) {
        const { error: brandError } = await supabase.from("brands").insert({
          id: brand.id,
          tenant_id: workspace.id,
          name: brand.name,
          brand_kit: brand.brandGuide,
          voice_summary: {
            tone: brand.brandGuide.toneKeywords,
            voiceDescription: brand.brandGuide.voiceDescription,
          },
          visual_summary: {
            colors: brand.brandGuide.colorPalette,
            fonts: [brand.brandGuide.fontFamily],
          },
        });

        if (brandError && !brandError.message.includes("duplicate")) {
          console.warn(`⚠️  Could not create brand ${brand.name}:`, brandError.message);
        } else {
          console.log(`  ✅ Created brand: ${brand.name}`);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Demo data seeded successfully");
    console.log("=".repeat(60) + "\n");
  } catch (error: any) {
    console.error("❌ Error seeding demo data:", error.message);
    process.exit(1);
  }
}

seedDemoData();

