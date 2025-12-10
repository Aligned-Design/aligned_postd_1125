/**
 * Doc Agent Chaos Tests (R02)
 * 
 * Tests for failure modes identified in the Chaos Audit:
 * - R02: Malformed AI response → parse error path
 * - Low BFS scores → retry behavior
 * 
 * These tests pin down current behavior before fixes are applied.
 * 
 * @see docs/POSTD_FULL_STACK_CHAOS_AUDIT.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// =============================================================================
// UNIT TESTS: Parse Variants Function
// =============================================================================

/**
 * Inline copy of parseDocVariants for isolated testing
 * (Matches server/routes/doc-agent.ts lines 61-97)
 */
function parseDocVariants(content: string): Array<{
  id: string;
  label: string;
  content: string;
  tone?: string;
  platform?: string;
  wordCount: number;
  brandFidelityScore: number;
  complianceTags: string[];
  status: "draft";
}> {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content.trim();
    
    const parsed = JSON.parse(jsonString);
    
    if (!Array.isArray(parsed)) {
      throw new Error("Expected array of variants");
    }

    // Validate and normalize variants
    return parsed.map((item: any, idx: number) => ({
      id: item.id || `variant-${idx + 1}`,
      label: item.label || `Option ${String.fromCharCode(65 + idx)}`, // A, B, C
      content: item.content || "",
      tone: item.tone,
      platform: item.platform,
      wordCount: item.wordCount || (item.content ? item.content.split(/\s+/).length : 0),
      brandFidelityScore: 0, // Will be calculated below
      complianceTags: [],
      status: "draft" as const,
    }));
  } catch (error) {
    console.error("Failed to parse doc variants:", error);
    // Return a fallback variant
    return [{
      id: "parse-error",
      label: "Parse Error",
      content: "The AI response could not be parsed. Please try again.",
      wordCount: 0,
      brandFidelityScore: 0,
      complianceTags: ["parse_error"],
      status: "draft" as const,
    }];
  }
}

describe("Doc Agent Parse Variants (R02 - Chaos Audit)", () => {
  // Suppress console.error during tests
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("Valid JSON Parsing", () => {
    it("parses well-formed JSON array correctly", () => {
      const validJson = JSON.stringify([
        { id: "v1", label: "Option A", content: "Hello world" },
        { id: "v2", label: "Option B", content: "Goodbye world" },
      ]);

      const result = parseDocVariants(validJson);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("v1");
      expect(result[0].content).toBe("Hello world");
      expect(result[1].id).toBe("v2");
    });

    it("extracts JSON from markdown code blocks", () => {
      const markdownWrapped = `\`\`\`json
[{"id": "v1", "content": "Test content"}]
\`\`\``;

      const result = parseDocVariants(markdownWrapped);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Test content");
    });

    it("calculates word count when not provided", () => {
      const json = JSON.stringify([
        { id: "v1", content: "This is a five word sentence" },
      ]);

      const result = parseDocVariants(json);

      expect(result[0].wordCount).toBe(6); // "This is a five word sentence"
    });

    it("generates labels when not provided", () => {
      const json = JSON.stringify([
        { id: "v1", content: "First" },
        { id: "v2", content: "Second" },
        { id: "v3", content: "Third" },
      ]);

      const result = parseDocVariants(json);

      expect(result[0].label).toBe("Option A");
      expect(result[1].label).toBe("Option B");
      expect(result[2].label).toBe("Option C");
    });
  });

  describe("Malformed Response Handling (R02)", () => {
    it("returns parse-error variant for invalid JSON", () => {
      const malformedJson = "{ not valid json [";

      const result = parseDocVariants(malformedJson);

      // ✅ R02 BEHAVIOR: Current implementation returns parse-error variant
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("parse-error");
      expect(result[0].complianceTags).toContain("parse_error");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("returns parse-error variant for non-array JSON", () => {
      const objectJson = JSON.stringify({ message: "Not an array" });

      const result = parseDocVariants(objectJson);

      // ✅ R02 BEHAVIOR: Object instead of array triggers parse-error
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("parse-error");
      expect(result[0].complianceTags).toContain("parse_error");
    });

    it("returns parse-error variant for empty response", () => {
      const result = parseDocVariants("");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("parse-error");
    });

    it("returns parse-error variant for null/undefined-like strings", () => {
      const result = parseDocVariants("null");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("parse-error");
    });

    it("parse-error variant has brandFidelityScore of 0", () => {
      const result = parseDocVariants("garbage");

      // ✅ CHAOS AUDIT NOTE: BFS=0 on parse-error could be misleading
      expect(result[0].brandFidelityScore).toBe(0);
    });

    it("parse-error variant has status 'draft'", () => {
      const result = parseDocVariants("garbage");

      // ✅ Current behavior: parse-error is still "draft" status
      expect(result[0].status).toBe("draft");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty array", () => {
      const result = parseDocVariants("[]");

      expect(result).toHaveLength(0);
    });

    it("handles array with missing fields", () => {
      const json = JSON.stringify([{}]); // Empty object in array

      const result = parseDocVariants(json);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("variant-1");
      expect(result[0].content).toBe("");
    });

    it("handles extremely long content without crashing", () => {
      const longContent = "word ".repeat(10000);
      const json = JSON.stringify([{ id: "v1", content: longContent }]);

      const result = parseDocVariants(json);

      expect(result).toHaveLength(1);
      // Note: trailing space creates an extra empty string in split, so 10001
      expect(result[0].wordCount).toBeGreaterThanOrEqual(10000);
    });
  });
});

// =============================================================================
// BFS WARNING TESTS
// =============================================================================

/**
 * Inline copy of buildDocWarnings for isolated testing
 * (Matches server/routes/doc-agent.ts lines 126-173)
 */
function buildDocWarnings({
  avgBFS,
  complianceTagCounts,
  retryAttempted,
  parseWarning,
}: {
  avgBFS: number;
  complianceTagCounts: Record<string, number>;
  retryAttempted: boolean;
  parseWarning: boolean;
}): Array<{
  code: string;
  message: string;
  severity: "warning" | "info" | "critical";
  details?: any;
}> {
  const LOW_BFS_THRESHOLD = 0.8;
  const warnings: Array<{
    code: string;
    message: string;
    severity: "warning" | "info" | "critical";
    details?: any;
  }> = [];

  if (avgBFS < LOW_BFS_THRESHOLD) {
    warnings.push({
      code: "low_bfs",
      message: `Average brand fidelity is ${Math.round(avgBFS * 100)}%. Please review before publishing.`,
      severity: "warning",
    });
  }

  if (Object.keys(complianceTagCounts).length > 0) {
    warnings.push({
      code: "compliance_flags",
      message: "Some variants triggered compliance flags.",
      severity: "warning",
      details: { tags: complianceTagCounts },
    });
  }

  if (parseWarning) {
    warnings.push({
      code: "partial_parse",
      message: "The AI response was partially parsed. A fallback variant is shown.",
      severity: "warning",
    });
  }

  if (retryAttempted) {
    warnings.push({
      code: "retry_attempted",
      message: "Initial draft needed a retry to reach acceptable fidelity.",
      severity: "info",
    });
  }

  return warnings;
}

describe("Doc Agent BFS Warnings (R02 - Chaos Audit)", () => {
  describe("Low BFS Score Warnings", () => {
    it("generates warning when avgBFS < 0.8", () => {
      const warnings = buildDocWarnings({
        avgBFS: 0.5,
        complianceTagCounts: {},
        retryAttempted: false,
        parseWarning: false,
      });

      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe("low_bfs");
      expect(warnings[0].severity).toBe("warning");
      expect(warnings[0].message).toContain("50%");
    });

    it("no warning when avgBFS >= 0.8", () => {
      const warnings = buildDocWarnings({
        avgBFS: 0.85,
        complianceTagCounts: {},
        retryAttempted: false,
        parseWarning: false,
      });

      expect(warnings).toHaveLength(0);
    });

    it("warning threshold is exactly 0.8", () => {
      const atThreshold = buildDocWarnings({
        avgBFS: 0.8,
        complianceTagCounts: {},
        retryAttempted: false,
        parseWarning: false,
      });

      const belowThreshold = buildDocWarnings({
        avgBFS: 0.79,
        complianceTagCounts: {},
        retryAttempted: false,
        parseWarning: false,
      });

      expect(atThreshold).toHaveLength(0);
      expect(belowThreshold).toHaveLength(1);
    });
  });

  describe("Parse Warning", () => {
    it("generates partial_parse warning when parseWarning is true", () => {
      const warnings = buildDocWarnings({
        avgBFS: 1.0,
        complianceTagCounts: {},
        retryAttempted: false,
        parseWarning: true,
      });

      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe("partial_parse");
      expect(warnings[0].severity).toBe("warning");
    });
  });

  describe("Retry Attempted", () => {
    it("generates info-level warning when retry was attempted", () => {
      const warnings = buildDocWarnings({
        avgBFS: 0.9,
        complianceTagCounts: {},
        retryAttempted: true,
        parseWarning: false,
      });

      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe("retry_attempted");
      expect(warnings[0].severity).toBe("info");
    });
  });

  describe("Compliance Tags", () => {
    it("generates compliance_flags warning when tags present", () => {
      const warnings = buildDocWarnings({
        avgBFS: 0.9,
        complianceTagCounts: { sensitive_content: 2, promotional: 1 },
        retryAttempted: false,
        parseWarning: false,
      });

      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe("compliance_flags");
      expect(warnings[0].details?.tags).toEqual({ sensitive_content: 2, promotional: 1 });
    });
  });

  describe("Multiple Warnings", () => {
    it("accumulates all applicable warnings", () => {
      const warnings = buildDocWarnings({
        avgBFS: 0.5,
        complianceTagCounts: { flagged: 1 },
        retryAttempted: true,
        parseWarning: true,
      });

      // All 4 warning types should be present
      expect(warnings).toHaveLength(4);
      
      const codes = warnings.map((w) => w.code);
      expect(codes).toContain("low_bfs");
      expect(codes).toContain("compliance_flags");
      expect(codes).toContain("retry_attempted");
      expect(codes).toContain("partial_parse");
    });
  });
});

// =============================================================================
// STATUS DETERMINATION TESTS
// =============================================================================

function determineStatus(
  variantCount: number,
  warnings: Array<{ severity: string }>,
): "success" | "partial_success" | "failure" {
  if (variantCount === 0) {
    return "failure";
  }

  const hasBlockingWarning = warnings.some(
    (warning) => warning.severity === "warning" || warning.severity === "critical",
  );

  return hasBlockingWarning ? "partial_success" : "success";
}

describe("Doc Agent Status Determination (R02 - Chaos Audit)", () => {
  it("returns 'failure' when no variants", () => {
    const status = determineStatus(0, []);
    expect(status).toBe("failure");
  });

  it("returns 'success' when variants exist and no blocking warnings", () => {
    const status = determineStatus(3, [{ severity: "info" }]);
    expect(status).toBe("success");
  });

  it("returns 'partial_success' when warning-level warnings exist", () => {
    const status = determineStatus(3, [{ severity: "warning" }]);
    expect(status).toBe("partial_success");
  });

  it("returns 'partial_success' when critical warnings exist", () => {
    const status = determineStatus(3, [{ severity: "critical" }]);
    expect(status).toBe("partial_success");
  });

  it("returns 'partial_success' with mixed warning severities", () => {
    const status = determineStatus(3, [
      { severity: "info" },
      { severity: "warning" },
    ]);
    expect(status).toBe("partial_success");
  });
});

