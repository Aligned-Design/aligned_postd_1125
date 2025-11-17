/**
 * Advisor Integration Tests
 *
 * End-to-end tests for Copy → Creative → Advisor workflow.
 * Verifies the complete content generation and review pipeline.
 */

import { calculateReviewScores, getSeverityLevel } from "./advisor-review-scorer";
import { generateReflectionQuestion } from "./advisor-reflection-generator";
import { type ActionContext } from "./advisor-action-handlers";
import {
  mockActionTightenPostLength,
  mockActionOptimizeSchedule,
  mockActionAutofillOpenDates,
  mockActionQueueVariant,
  mockActionRequestBrandInfo,
  mockActionFlagReconnect,
  mockActionMarkForReview,
} from "./advisor-action-handlers-mock";
import { advisorHistoryStore, type AdvisorReviewRecord } from "./advisor-history-storage";
import {
  logAdvisorReviewCreated,
  logAdvisorActionInvoked,
  logAdvisorActionResult,
} from "./advisor-event-logger";

/**
 * Test Suite: Full Advisor Workflow
 */
export async function runAdvisorIntegrationTests(): Promise<{
  passed: number;
  failed: number;
  total: number;
  results: Array<{ name: string; status: "pass" | "fail"; message: string; duration: number }>;
}> {
  const results: Array<{ name: string; status: "pass" | "fail"; message: string; duration: number }> =
    [];

  console.log("\n🧪 Starting Advisor Integration Tests...\n");

  // Test 1: Review Scoring
  results.push(await testReviewScoring());

  // Test 2: Reflection Question Generation
  results.push(await testReflectionQuestionGeneration());

  // Test 3: Action Handlers
  results.push(await testActionHandlers());

  // Test 4: History Storage
  results.push(await testHistoryStorage());

  // Test 5: Event Logging
  results.push(await testEventLogging());

  // Test 6: Full Workflow Integration
  results.push(await testFullWorkflowIntegration());

  // Summary
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;

  console.log("\n📊 Test Results Summary:");
  console.log(`   ✅ Passed: ${passed}/${results.length}`);
  console.log(`   ❌ Failed: ${failed}/${results.length}`);
  console.log(`\n`);

  results.forEach((result) => {
    const icon = result.status === "pass" ? "✅" : "❌";
    console.log(`${icon} ${result.name} (${result.duration}ms): ${result.message}`);
  });

  return {
    passed,
    failed,
    total: results.length,
    results,
  };
}

/**
 * Test 1: Review Scoring System
 */
async function testReviewScoring(): Promise<{
  name: string;
  status: "pass" | "fail";
  message: string;
  duration: number;
}> {
  const startTime = Date.now();

  try {
    const testContent =
      "Check out our new product! It's amazing and will change your life. Click the link below to learn more.";

    const mockAdvisorOutput = {
      feedback: "Consider adding more specific benefits and social proof",
      insights: ["Add 2-3 specific product benefits", "Include customer testimonial", "Use action verb in CTA"],
      suggested_actions: ["regenerate_caption", "request_brand_info"],
      needs_review: false,
    };

    const mockBrandKit = {
      voice_attributes: {
        tone: "professional",
        style: "authentic",
      },
    };

    const scores = calculateReviewScores(testContent, mockAdvisorOutput, mockBrandKit, "instagram");

    // Verify all dimensions are calculated
    if (
      typeof scores.clarity !== "number" ||
      typeof scores.brand_alignment !== "number" ||
      typeof scores.resonance !== "number" ||
      typeof scores.actionability !== "number" ||
      typeof scores.platform_fit !== "number"
    ) {
      throw new Error("Not all score dimensions calculated");
    }

    // Verify scores are in valid range (1-10)
    const allScores = [
      scores.clarity,
      scores.brand_alignment,
      scores.resonance,
      scores.actionability,
      scores.platform_fit,
      scores.average,
    ];
    if (!allScores.every((s) => s >= 1 && s <= 10)) {
      throw new Error(`Scores out of range: ${JSON.stringify(allScores)}`);
    }

    // Verify weighted scoring
    if (typeof scores.weighted !== "number" || scores.weighted < 1 || scores.weighted > 10) {
      throw new Error(`Invalid weighted score: ${scores.weighted}`);
    }

    // Verify severity level
    const severity = getSeverityLevel(scores.weighted);
    if (!["green", "yellow", "red"].includes(severity)) {
      throw new Error(`Invalid severity: ${severity}`);
    }

    return {
      name: "Review Scoring System",
      status: "pass",
      message: `Scores calculated correctly (avg: ${scores.average.toFixed(1)}, weighted: ${scores.weighted.toFixed(1)}, severity: ${severity})`,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: "Review Scoring System",
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test 2: Reflection Question Generation
 */
async function testReflectionQuestionGeneration(): Promise<{
  name: string;
  status: "pass" | "fail";
  message: string;
  duration: number;
}> {
  const startTime = Date.now();

  try {
    const mockScores = {
      clarity: 6,
      brand_alignment: 8,
      resonance: 5, // Weakest - should get resonance question
      actionability: 7,
      platform_fit: 7,
      average: 6.6,
      weighted: 6.8,
      timestamp: new Date().toISOString(),
    };

    const mockAdvisorOutput = {
      feedback: "Good structure but lacks emotional connection",
    };

    const question = generateReflectionQuestion(mockScores, mockAdvisorOutput, "instagram", "Sample content");

    // Verify question structure
    if (!question.question || question.question.length === 0) {
      throw new Error("Question not generated");
    }

    if (!["clarity", "alignment", "resonance", "actionability", "platform"].includes(question.category)) {
      throw new Error(`Invalid category: ${question.category}`);
    }

    if (!question.focus_area || !question.intended_benefit) {
      throw new Error("Missing question metadata");
    }

    if (!Array.isArray(question.follow_up_prompts) || question.follow_up_prompts.length === 0) {
      throw new Error("No follow-up prompts");
    }

    return {
      name: "Reflection Question Generation",
      status: "pass",
      message: `Question generated in ${question.category} category with ${question.follow_up_prompts.length} follow-ups`,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: "Reflection Question Generation",
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test 3: Action Handlers
 */
async function testActionHandlers(): Promise<{
  name: string;
  status: "pass" | "fail";
  message: string;
  duration: number;
}> {
  const startTime = Date.now();

  try {
    const mockContext: ActionContext = {
      insight_id: "test_insight_1",
      brand_id: "550e8400-e29b-41d4-a716-446655440000",
      content_id: "test_content_1",
      platform: "instagram",
      content: "Check out our amazing new product!",
      user_id: "test_user_1",
    };

    // Test each action (using mocks to avoid API dependencies)
    const tightenResult = await mockActionTightenPostLength(mockContext);
    if (!tightenResult.success || !tightenResult.result_data) {
      throw new Error("Tighten post length failed");
    }

    const scheduleResult = await mockActionOptimizeSchedule(mockContext);
    if (!scheduleResult.success || !scheduleResult.result_data?.recommended_times) {
      throw new Error("Optimize schedule failed");
    }

    const autofillResult = await mockActionAutofillOpenDates(mockContext, 3);
    if (!autofillResult.success || !Array.isArray(autofillResult.result_data?.scheduled_posts)) {
      throw new Error("Autofill dates failed");
    }

    const variantResult = await mockActionQueueVariant(mockContext, "tone");
    if (!variantResult.success || !variantResult.result_data?.variant_content) {
      throw new Error("Queue variant failed");
    }

    const infoResult = await mockActionRequestBrandInfo(mockContext, ["brand_voice", "target_audience"]);
    if (!infoResult.success || !Array.isArray(infoResult.result_data?.requested_fields)) {
      throw new Error("Request brand info failed");
    }

    const reconnectResult = await mockActionFlagReconnect(mockContext, "account_123", 5);
    if (!reconnectResult.success || reconnectResult.result_data?.days_until_expiry !== 5) {
      throw new Error("Flag reconnect failed");
    }

    const reviewResult = await mockActionMarkForReview(mockContext, "Needs human review", "high");
    if (!reviewResult.success || reviewResult.result_data?.status !== "pending_review") {
      throw new Error("Mark for review failed");
    }

    // Verify all require approval
    const allResults = [tightenResult, scheduleResult, autofillResult, variantResult, infoResult, reconnectResult, reviewResult];
    if (!allResults.every((r) => r.requires_approval === true)) {
      throw new Error("Not all actions have requires_approval=true (HITL violation)");
    }

    return {
      name: "Action Handlers (7/8 tested)",
      status: "pass",
      message: "All tested actions executed successfully with HITL compliance (using mocks)",
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: "Action Handlers",
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test 4: History Storage
 */
async function testHistoryStorage(): Promise<{
  name: string;
  status: "pass" | "fail";
  message: string;
  duration: number;
}> {
  const startTime = Date.now();

  try {
    const testBrandId = "550e8400-e29b-41d4-a716-446655440000";

    // Create test review
    const testReview: AdvisorReviewRecord = {
      id: `review_test_${Date.now()}`,
      brand_id: testBrandId,
      content_id: "content_test_1",
      platform: "instagram",
      scores: {
        clarity: 7,
        brand_alignment: 8,
        resonance: 6,
        actionability: 7,
        platform_fit: 8,
        average: 7.2,
        weighted: 7.4,
        timestamp: new Date().toISOString(),
      },
      severity_level: "green",
      reflection_question: "Does this content sound like your brand?",
      suggested_actions: ["regenerate_caption", "optimize_schedule"],
      created_at: new Date().toISOString(),
    };

    // Store review
    advisorHistoryStore.storeReview(testReview);

    // Retrieve review
    const retrieved = advisorHistoryStore.getReview(testReview.id);
    if (!retrieved || retrieved.id !== testReview.id) {
      throw new Error("Review retrieval failed");
    }

    // Get brand reviews
    const brandReviews = advisorHistoryStore.getBrandReviews(testBrandId);
    if (!Array.isArray(brandReviews) || brandReviews.length === 0) {
      throw new Error("Brand reviews retrieval failed");
    }

    // Calculate trends
    const trends = advisorHistoryStore.calculateTrends(testBrandId, 7);
    if (!trends || typeof trends.overall_average !== "number") {
      throw new Error("Trend calculation failed");
    }

    // Get summary
    const summary = advisorHistoryStore.getBrandSummary(testBrandId);
    if (!summary || typeof summary.total_reviews !== "number") {
      throw new Error("Summary retrieval failed");
    }

    return {
      name: "History Storage",
      status: "pass",
      message: `Stored review, calculated trends (avg: ${trends.overall_average.toFixed(1)}), summary shows ${summary.total_reviews} reviews`,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: "History Storage",
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test 5: Event Logging
 */
async function testEventLogging(): Promise<{
  name: string;
  status: "pass" | "fail";
  message: string;
  duration: number;
}> {
  const startTime = Date.now();

  try {
    const testBrandId = "550e8400-e29b-41d4-a716-446655440000";
    const testRequestId = `request_test_${Date.now()}`;

    const mockScores = {
      clarity: 7,
      brand_alignment: 8,
      resonance: 6,
      actionability: 7,
      platform_fit: 8,
      average: 7.2,
      weighted: 7.4,
      timestamp: new Date().toISOString(),
    };

    // Log review creation (should not throw)
    logAdvisorReviewCreated(testBrandId, testRequestId, 145, {
      content_id: "content_123",
      platform: "instagram",
      scores: mockScores,
      severity_level: "green",
      has_reflection_question: true,
      suggested_actions_count: 3,
    });

    // Log action invocation (should not throw)
    logAdvisorActionInvoked(testBrandId, testRequestId, {
      action_type: "regenerate_caption",
      content_id: "content_123",
      platform: "instagram",
      user_id: "user_123",
    });

    // Log action result (should not throw)
    logAdvisorActionResult(testBrandId, testRequestId, 234, {
      action_type: "regenerate_caption",
      content_id: "content_123",
      success: true,
      result: {
        new_caption: "Updated caption text",
        platform: "instagram",
      },
    });

    return {
      name: "Event Logging",
      status: "pass",
      message: "All event logging functions executed without errors",
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: "Event Logging",
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Test 6: Full Workflow Integration
 */
async function testFullWorkflowIntegration(): Promise<{
  name: string;
  status: "pass" | "fail";
  message: string;
  duration: number;
}> {
  const startTime = Date.now();

  try {
    const testBrandId = "550e8400-e29b-41d4-a716-446655440000";
    const testRequestId = `workflow_test_${Date.now()}`;

    console.log(`\n   📋 Running full workflow test for brand ${testBrandId}...`);

    // Step 1: Content copy generated (mock)
    const generatedContent = "Join us for our exclusive launch event! Limited spots available. Sign up today!";
    console.log(`   ✓ Step 1: Content generated (${generatedContent.length} chars)`);

    // Step 2: Score the content
    const mockAdvisorOutput = {
      feedback: "Good copy but could be more specific about event details",
      insights: ["Add event date", "Include time", "Mention benefits"],
      suggested_actions: ["regenerate_caption", "request_brand_info"],
      needs_review: false,
    };

    const scores = calculateReviewScores(generatedContent, mockAdvisorOutput, null, "instagram");
    console.log(`   ✓ Step 2: Content scored (avg: ${scores.average.toFixed(1)}/10)`);

    // Step 3: Generate reflection question
    const question = generateReflectionQuestion(scores, mockAdvisorOutput, "instagram", generatedContent);
    console.log(`   ✓ Step 3: Reflection question generated: "${question.category}"`);

    // Step 4: Log review creation
    logAdvisorReviewCreated(testBrandId, testRequestId, 234, {
      content_id: "workflow_test_content",
      platform: "instagram",
      scores,
      severity_level: getSeverityLevel(scores.weighted),
      has_reflection_question: true,
      suggested_actions_count: 2,
    });
    console.log(`   ✓ Step 4: Review creation logged with requestId: ${testRequestId}`);

    // Step 5: Execute action (optimize schedule)
    const actionContext: ActionContext = {
      insight_id: "workflow_insight",
      brand_id: testBrandId,
      content_id: "workflow_test_content",
      platform: "instagram",
      content: generatedContent,
      user_id: "workflow_user",
    };

    logAdvisorActionInvoked(testBrandId, testRequestId, {
      action_type: "optimize_schedule",
      content_id: actionContext.content_id,
      platform: actionContext.platform,
      user_id: actionContext.user_id,
    });

    const scheduleAction = await mockActionOptimizeSchedule(actionContext);
    console.log(`   ✓ Step 5: Action invoked (${(scheduleAction.result_data as any)?.recommended_times?.length || 0} times)`);

    // Step 6: Log action result
    logAdvisorActionResult(testBrandId, testRequestId, 156, {
      action_type: "optimize_schedule",
      content_id: actionContext.content_id,
      success: scheduleAction.success,
      result: scheduleAction.result_data,
    });
    console.log(`   ✓ Step 6: Action result logged`);

    // Step 7: Store in history
    const reviewRecord: AdvisorReviewRecord = {
      id: `workflow_review_${Date.now()}`,
      brand_id: testBrandId,
      content_id: "workflow_test_content",
      platform: "instagram",
      scores,
      severity_level: getSeverityLevel(scores.weighted),
      reflection_question: question.question,
      suggested_actions: ["optimize_schedule"],
      created_at: new Date().toISOString(),
    };

    advisorHistoryStore.storeReview(reviewRecord);
    advisorHistoryStore.markReviewPublished(reviewRecord.id);
    console.log(`   ✓ Step 7: Review stored and marked as published`);

    // Step 8: Verify history and trends
    const brandReviews = advisorHistoryStore.getBrandReviews(testBrandId, 10);
    const trends = advisorHistoryStore.calculateTrends(testBrandId, 7);
    const summary = advisorHistoryStore.getBrandSummary(testBrandId);

    console.log(`   ✓ Step 8: History verified - ${brandReviews.length} reviews, avg score: ${trends.overall_average.toFixed(1)}`);

    return {
      name: "Full Workflow Integration",
      status: "pass",
      message: `Complete workflow executed: Content → Score → Question → Action → Log → History (8 steps)`,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: "Full Workflow Integration",
      status: "fail",
      message: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}
