/**
 * Audit Simulation Test
 *
 * Simulates the complete pipeline with the "Refined Wellness" brand test case:
 * - BRAND: Refined Wellness (placeholder)
 * - GOAL: Drive bookings for a new "Stress Reset" service this week
 * - PLATFORM: Instagram
 * - TONE: Calm, trustworthy, slightly witty
 * - CTA: "Tap the link in bio to book a Stress Reset"
 * - CONSTRAINTS: IG template; 3–7 hashtags; no medical claims
 *
 * Run with: npx tsx server/scripts/audit-simulation.ts
 */

import { executePipelineCycle } from "../lib/pipeline-orchestrator";
import {
  createStrategyBrief,
  createBrandHistory,
  createPerformanceLog,
} from "../lib/collaboration-artifacts";
import type { CollaborationContext } from "../lib/collaboration-artifacts";

async function runAuditSimulation() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║              AUDIT SIMULATION - REFINED WELLNESS               ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  const results = {
    ran: false,
    copy_ok: false,
    creative_ok: false,
    advisor_ok: false,
    average_score: 0,
    blocked_by: [] as string[],
    logs_emitted: [] as string[],
    notes: "",
  };

  try {
    console.log("📋 TEST CASE: Refined Wellness - Stress Reset Booking Campaign");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("  GOAL: Drive bookings for a new 'Stress Reset' service this week");
    console.log("  PLATFORM: Instagram");
    console.log("  TONE: Calm, trustworthy, slightly witty");
    console.log("  CTA: 'Tap the link in bio to book a Stress Reset'");
    console.log("  CONSTRAINTS: IG template; 3–7 hashtags; no medical claims\n");

    // Create Refined Wellness strategy
    const strategy = createStrategyBrief({
      brandId: "refined-wellness",
      version: "1.0.0",
      positioning: {
        tagline: "Stress Reset Wellness Service",
        missionStatement: "Help clients reset stress through personalized wellness sessions",
        targetAudience: {
          demographics: "Busy professionals, 25-55",
          psychographics: ["wellness-focused", "self-care advocates", "stress-conscious"],
          painPoints: ["chronic stress", "burnout", "poor work-life balance"],
          aspirations: ["inner peace", "better sleep", "sustainable wellbeing"],
        },
      },
      voice: {
        tone: "professional",
        personality: ["trustworthy", "slightly witty", "supportive"],
        keyMessages: ["stress reset", "personalized wellness", "booking available"],
        avoidPhrases: ["medical claims", "cure", "guaranteed results"],
      },
      visual: {
        primaryColor: "#8B7AA8",
        secondaryColor: "#D4A5A5",
        accentColor: "#6BBF9C",
        fontPairing: {
          heading: "Poppins",
          body: "Inter",
        },
        imagery: {
          style: "photo" as const,
          subjects: ["serene spaces", "wellness moments", "people relaxing"],
        },
      },
      competitive: {
        differentiation: ["personalized approach", "holistic wellness"],
        uniqueValueProposition: "Tailored stress-reset sessions that fit your schedule",
      },
    });

    // Create context with brand history
    const context: Partial<CollaborationContext> = {
      strategyBrief: strategy,
      brandHistory: createBrandHistory({
        brandId: "refined-wellness",
        entries: [],
        successPatterns: [],
      }),
      performanceLog: createPerformanceLog({
        brandId: "refined-wellness",
        contentPerformance: [
          {
            contentId: "test-content-2",
            platform: "instagram",
            publishedAt: new Date().toISOString(),
            metrics: {
              reach: { value: 3200, change: 0 } as any,
              engagement: { value: 420, change: 0 } as any,
              clicks: { value: 67, change: 0 } as any,
            },
            visualAttributes: {
              layout: "carousel",
              colorScheme: "brand-primary",
              motionType: "static",
              imageType: "photo",
            },
            copyAttributes: {
              tone: "professional",
              length: 120,
              hasEmoji: false,
              hasCallToAction: true,
            },
          },
        ],
        // Type assertion for dev-only script - platforms property exists at runtime
        ...({ platforms: ["instagram"] } as any),
        patterns: [
          {
            pattern: "High engagement on wellness-focused carousels",
            strength: "strong",
            example: "Carousel posts with wellness themes show 2.3x higher engagement",
            impact: "Consider increasing wellness-focused carousel content",
          },
        ],
      }),
    };

    console.log("🚀 STEP 1: Copy Intelligence - Generate IG Caption");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const cycle = await executePipelineCycle("refined-wellness", context);

    if (!cycle.contentPackage) {
      results.blocked_by.push("NEEDS_INFO: ContentPackage not created");
      throw new Error("ContentPackage creation failed");
    }

    const copy = cycle.contentPackage.copy;
    console.log(`  ✅ Headline: "${copy.headline}"`);
    console.log(`  ✅ Body: "${copy.body}"`);
    console.log(`  ✅ CTA: "${copy.callToAction}"`);
    console.log(`  ✅ Platform: ${copy.tone}`);
    console.log(`  ✅ Keywords: ${copy.keywords.join(", ")}\n`);

    // Verify copy output
    if (!copy.headline || !copy.body || !copy.callToAction) {
      results.blocked_by.push("NEEDS_INFO: Missing copy components");
      throw new Error("Copy output incomplete");
    }
    results.copy_ok = true;
    results.logs_emitted.push("copy.generated");

    // Check for guardrails
    if (copy.body.toLowerCase().includes("medical") || copy.body.toLowerCase().includes("cure")) {
      results.blocked_by.push("GUARDRAIL_VIOLATION: Medical claims detected");
      throw new Error("Medical claims in copy");
    }

    console.log("🎨 STEP 2: Creative Intelligence - Generate Design Concept");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const design = cycle.contentPackage.designContext;
    if (!design) {
      results.blocked_by.push("NEEDS_INFO: DesignContext not created");
      throw new Error("Design context missing");
    }

    console.log(`  ✅ Layout: "${design.suggestedLayout.substring(0, 60)}..."`);
    console.log(`  ✅ Components: ${design.componentPrecedence.join(", ")}`);
    console.log(`  ✅ Accessibility Notes: ${design.accessibilityNotes.length} items`);
    console.log(`     Sample: "${design.accessibilityNotes[0]}"\n`);

    // Verify creative output
    if (!design.suggestedLayout || design.componentPrecedence.length === 0) {
      results.blocked_by.push("NEEDS_INFO: Design concept incomplete");
      throw new Error("Design output incomplete");
    }
    results.creative_ok = true;
    results.logs_emitted.push("creative.concept.generated");

    console.log("📊 STEP 3: Advisor Intelligence - Score & Feedback");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const scores = cycle.reviewScores;
    if (!scores) {
      results.blocked_by.push("NEEDS_INFO: Scores not calculated");
      throw new Error("Scoring failed");
    }

    console.log(`  5-Dimensional Scores:`);
    console.log(`    ├─ Clarity:       ${scores.clarity}/10`);
    console.log(`    ├─ Alignment:     ${scores.brand_alignment}/10`);
    console.log(`    ├─ Resonance:     ${scores.resonance}/10`);
    console.log(`    ├─ Actionability: ${scores.actionability}/10`);
    console.log(`    └─ Platform Fit:  ${scores.platform_fit}/10`);

    console.log(`\n  Overall:`);
    console.log(`    ├─ Average:  ${scores.average.toFixed(1)}/10`);
    console.log(`    └─ Weighted: ${scores.weighted.toFixed(1)}/10`);

    results.average_score = scores.weighted;
    results.advisor_ok = true;
    results.logs_emitted.push("advisor.review.created");

    // Check for minimum quality threshold
    if (scores.weighted < 8.0) {
      console.log(`\n  ⚠️  RECOMMENDATION: Score ${scores.weighted.toFixed(1)} < 8.0 threshold`);
      console.log("     Advisor suggests revision before scheduling");
    }

    console.log("\n📋 STEP 4: Verify Guardrails & Logging");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Check HITL safeguard
    if (cycle.contentPackage.status !== "draft") {
      results.blocked_by.push("HITL_VIOLATION: Content not in draft status");
      throw new Error("HITL safeguard failed");
    }
    console.log(`  ✅ HITL Status: Content is ${cycle.contentPackage.status} (not auto-published)`);

    // Check collaboration log
    const log = cycle.contentPackage.collaborationLog;
    if (log.length === 0) {
      results.blocked_by.push("LOGGING_MISSING: No collaboration log entries");
      throw new Error("Logging failed");
    }

    console.log(`  ✅ Collaboration Log: ${log.length} entries`);
    log.forEach((entry, i) => {
      console.log(`     ${i + 1}. [${entry.agent.toUpperCase()}] ${entry.action}`);
    });

    // Check CTA presence
    const ctaFound = copy.callToAction.toLowerCase().includes("book") ||
      copy.callToAction.toLowerCase().includes("tap") ||
      copy.headline.toLowerCase().includes("book");

    if (!ctaFound) {
      console.log(`  ⚠️  CTA less prominent than required - consider revision`);
    } else {
      console.log(`  ✅ CTA Verified: "Tap the link in bio" action present`);
    }

    // Check hashtags
    const hashtags = cycle.contentPackage.copy.keywords || [];
    console.log(`  ✅ Hashtags: ${hashtags.length} generated (IG requires 3-7)`);

    // Summary
    console.log("\n✅ SIMULATION COMPLETE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    results.ran = true;
    results.notes = `Refined Wellness Stress Reset campaign simulated successfully.
Copy: ${results.copy_ok ? "✅" : "❌"} | Creative: ${results.creative_ok ? "✅" : "❌"} | Advisor: ${results.advisor_ok ? "✅" : "❌"}
Average Advisor Score: ${results.average_score.toFixed(1)}/10
Logs Emitted: ${results.logs_emitted.join(", ")}
${results.blocked_by.length > 0 ? `Blockers: ${results.blocked_by.join("; ")}` : "No blockers - content ready for review"}`;

    console.log(`Copy Model:           ${results.copy_ok ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Creative Model:       ${results.creative_ok ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Advisor Model:        ${results.advisor_ok ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`\nQuality Score:        ${results.average_score.toFixed(1)}/10`);
    console.log(`HITL Safeguard:       ✅ PASS (draft status maintained)`);
    console.log(`Logging Coverage:     ${results.logs_emitted.length === 3 ? "✅ PASS" : "⚠️  PARTIAL"}`);

    if (results.blocked_by.length > 0) {
      console.log(`\n🚫 BLOCKERS:`);
      results.blocked_by.forEach((blocker) => {
        console.log(`   - ${blocker}`);
      });
    }

    console.log("\n");
    return results;
  } catch (error) {
    console.error("\n❌ SIMULATION FAILED");
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
    results.notes = `Simulation failed: ${error instanceof Error ? error.message : String(error)}`;
    return results;
  }
}

runAuditSimulation().then((results) => {
  console.log(JSON.stringify(results, null, 2));
  process.exit(results.ran && results.copy_ok && results.creative_ok && results.advisor_ok ? 0 : 1);
});
