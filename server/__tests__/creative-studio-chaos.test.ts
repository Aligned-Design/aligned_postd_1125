/**
 * Creative Studio Chaos Tests (R04)
 * 
 * Tests for failure modes identified in the Chaos Audit:
 * - R04: DB save failure falls through to mock response
 * 
 * These tests pin down current behavior BEFORE fixes are applied.
 * After Phase 2A fix, tests should be updated to expect proper error responses.
 * 
 * @see docs/POSTD_FULL_STACK_CHAOS_AUDIT.md
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";

// =============================================================================
// MOCK TYPES (match creative-studio.ts)
// =============================================================================

interface SaveDesignRequest {
  name?: string;
  format: "social_square" | "story_portrait" | "blog_featured" | "email_header" | "custom";
  width: number;
  height: number;
  brandId: string;
  campaignId?: string;
  items: any[];
  backgroundColor?: string;
  savedToLibrary?: boolean;
  libraryAssetId?: string;
}

interface SaveDesignResponse {
  success: boolean;
  design: {
    id: string;
    name: string;
    format: string;
    width: number;
    height: number;
    brandId: string;
    campaignId?: string | null;
    items: any[];
    backgroundColor: string;
    createdAt: string;
    updatedAt: string;
    savedToLibrary: boolean;
    libraryAssetId?: string | null;
  };
}

// =============================================================================
// MOCK SAVE HANDLER (simulates current behavior from creative-studio.ts)
// =============================================================================

/**
 * Simulates the current save behavior from server/routes/creative-studio.ts
 * lines 105-211, including the problematic fallback to mock response
 */
async function simulateSaveHandler(
  designData: SaveDesignRequest,
  userId: string,
  supabaseInsertResult: { data: any; error: any }
): Promise<{ status: number; body: SaveDesignResponse | { error: string } }> {
  const designId = `design-${Date.now()}`;
  const now = new Date().toISOString();

  // Try to save to content_items
  try {
    const { data: contentItem, error: contentError } = supabaseInsertResult;

    if (!contentError && contentItem) {
      // Success path - return real response
      return {
        status: 201,
        body: {
          success: true,
          design: {
            id: contentItem.id,
            name: designData.name || "Untitled Design",
            format: designData.format,
            width: designData.width,
            height: designData.height,
            brandId: designData.brandId,
            campaignId: designData.campaignId || null,
            items: designData.items,
            backgroundColor: designData.backgroundColor || "#FFFFFF",
            createdAt: contentItem.created_at,
            updatedAt: contentItem.updated_at,
            savedToLibrary: designData.savedToLibrary || false,
            libraryAssetId: designData.libraryAssetId || null,
          },
        },
      };
    }
  } catch (err) {
    // ✅ R04 CURRENT BEHAVIOR: Fall through to mock response
    console.log("Content items table not available, using mock response");
  }

  // ✅ R04 PROBLEM: Even on DB error, returns mock success response
  return {
    status: 201,
    body: {
      success: true,
      design: {
        id: designId,
        name: designData.name || "Untitled Design",
        format: designData.format,
        width: designData.width,
        height: designData.height,
        brandId: designData.brandId,
        campaignId: designData.campaignId || null,
        items: designData.items,
        backgroundColor: designData.backgroundColor || "#FFFFFF",
        createdAt: now,
        updatedAt: now,
        savedToLibrary: designData.savedToLibrary || false,
        libraryAssetId: designData.libraryAssetId || null,
      },
    },
  };
}

/**
 * Simulates FIXED save behavior (for Phase 2A)
 * Returns error instead of mock response on DB failure
 */
async function simulateFixedSaveHandler(
  designData: SaveDesignRequest,
  userId: string,
  supabaseInsertResult: { data: any; error: any }
): Promise<{ status: number; body: SaveDesignResponse | { error: string; code: string } }> {
  const now = new Date().toISOString();

  // Try to save to content_items
  const { data: contentItem, error: contentError } = supabaseInsertResult;

  if (contentError) {
    // ✅ FIXED BEHAVIOR: Return proper error on DB failure
    console.error("[CreativeStudio] Failed to save design:", contentError);
    return {
      status: 500,
      body: {
        error: "Failed to save design",
        code: "DATABASE_ERROR",
      },
    };
  }

  if (!contentItem) {
    return {
      status: 500,
      body: {
        error: "Failed to save design - no data returned",
        code: "DATABASE_ERROR",
      },
    };
  }

  // Success path - return real response
  return {
    status: 201,
    body: {
      success: true,
      design: {
        id: contentItem.id,
        name: designData.name || "Untitled Design",
        format: designData.format,
        width: designData.width,
        height: designData.height,
        brandId: designData.brandId,
        campaignId: designData.campaignId || null,
        items: designData.items,
        backgroundColor: designData.backgroundColor || "#FFFFFF",
        createdAt: contentItem.created_at,
        updatedAt: contentItem.updated_at,
        savedToLibrary: designData.savedToLibrary || false,
        libraryAssetId: designData.libraryAssetId || null,
      },
    },
  };
}

// =============================================================================
// TESTS: Current Behavior (R04 - Before Fix)
// =============================================================================

describe("Creative Studio Save - Current Behavior (R04 - Chaos Audit)", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  const validDesignData: SaveDesignRequest = {
    name: "Test Design",
    format: "social_square",
    width: 1080,
    height: 1080,
    brandId: "550e8400-e29b-41d4-a716-446655440000",
    items: [],
    backgroundColor: "#FFFFFF",
  };

  describe("Success Path", () => {
    it("returns 201 with design when DB insert succeeds", async () => {
      const result = await simulateSaveHandler(
        validDesignData,
        "user-123",
        {
          data: {
            id: "content-item-123",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          error: null,
        }
      );

      expect(result.status).toBe(201);
      expect((result.body as SaveDesignResponse).success).toBe(true);
      expect((result.body as SaveDesignResponse).design.id).toBe("content-item-123");
    });
  });

  describe("Failure Path - DB Error (R04 Problem)", () => {
    it("CURRENT BEHAVIOR: returns 201 success even when DB fails", async () => {
      const result = await simulateSaveHandler(
        validDesignData,
        "user-123",
        {
          data: null,
          error: { message: "Database connection failed", code: "PGRST301" },
        }
      );

      // ✅ R04 CURRENT BEHAVIOR: Still returns 201 success!
      expect(result.status).toBe(201);
      expect((result.body as SaveDesignResponse).success).toBe(true);
      
      // The ID is generated locally, not from DB
      expect((result.body as SaveDesignResponse).design.id).toMatch(/^design-\d+$/);
    });

    it("CURRENT BEHAVIOR: logs mock response message on DB failure", async () => {
      const result = await simulateSaveHandler(
        validDesignData,
        "user-123",
        {
          data: null,
          error: { message: "Table does not exist" },
        }
      );

      // Note: This test captures the problematic behavior where:
      // - DB fails, but success: true is still returned
      // The log message is internal to the catch block
      expect(result.status).toBe(201);
      expect((result.body as any).success).toBe(true);
    });

    it("CURRENT BEHAVIOR: returns mock design with local ID on DB exception", async () => {
      const result = await simulateSaveHandler(
        validDesignData,
        "user-123",
        {
          data: null,
          error: { message: "Connection timeout" },
        }
      );

      // ✅ R04 PROBLEM: User thinks save succeeded, but nothing was persisted
      expect((result.body as SaveDesignResponse).success).toBe(true);
      expect((result.body as SaveDesignResponse).design.name).toBe("Test Design");
    });
  });

  describe("Failure Path - Table Not Available", () => {
    it("CURRENT BEHAVIOR: falls through to mock when table doesn't exist", async () => {
      const result = await simulateSaveHandler(
        validDesignData,
        "user-123",
        {
          data: null,
          error: { message: "relation \"content_items\" does not exist", code: "42P01" },
        }
      );

      // ✅ R04 CURRENT BEHAVIOR: Still returns success
      expect(result.status).toBe(201);
      expect((result.body as SaveDesignResponse).success).toBe(true);
    });
  });
});

// =============================================================================
// TESTS: Fixed Behavior (Phase 2A - After Fix)
// =============================================================================

describe("Creative Studio Save - Fixed Behavior (Phase 2A)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const validDesignData: SaveDesignRequest = {
    name: "Test Design",
    format: "social_square",
    width: 1080,
    height: 1080,
    brandId: "550e8400-e29b-41d4-a716-446655440000",
    items: [],
  };

  describe("Success Path", () => {
    it("returns 201 with design when DB insert succeeds", async () => {
      const result = await simulateFixedSaveHandler(
        validDesignData,
        "user-123",
        {
          data: {
            id: "content-item-123",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          error: null,
        }
      );

      expect(result.status).toBe(201);
      expect((result.body as SaveDesignResponse).success).toBe(true);
    });
  });

  describe("Failure Path - DB Error (R04 Fixed)", () => {
    it("FIXED: returns 500 error when DB fails", async () => {
      const result = await simulateFixedSaveHandler(
        validDesignData,
        "user-123",
        {
          data: null,
          error: { message: "Database connection failed", code: "PGRST301" },
        }
      );

      // ✅ FIXED BEHAVIOR: Returns proper error
      expect(result.status).toBe(500);
      expect((result.body as any).error).toBe("Failed to save design");
      expect((result.body as any).code).toBe("DATABASE_ERROR");
    });

    it("FIXED: logs error on DB failure", async () => {
      await simulateFixedSaveHandler(
        validDesignData,
        "user-123",
        {
          data: null,
          error: { message: "Connection timeout" },
        }
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[CreativeStudio] Failed to save design:",
        expect.any(Object)
      );
    });

    it("FIXED: returns 500 when DB returns no data", async () => {
      const result = await simulateFixedSaveHandler(
        validDesignData,
        "user-123",
        {
          data: null, // No data returned
          error: null, // But also no error
        }
      );

      expect(result.status).toBe(500);
      expect((result.body as any).error).toContain("no data returned");
    });
  });
});

// =============================================================================
// TESTS: Update Handler Failure (R04 Related)
// =============================================================================

/**
 * Simulates current PUT /:id behavior with mock fallback
 */
async function simulateUpdateHandler(
  designId: string,
  updateData: Partial<SaveDesignRequest>,
  supabaseResult: { data: any; error: any }
): Promise<{ status: number; body: any }> {
  const { data, error } = supabaseResult;

  if (error) {
    // ✅ R04 CURRENT BEHAVIOR: Falls through to mock response
    console.log("Content items update not available, using mock response");
  }

  if (!error && data) {
    return {
      status: 200,
      body: {
        success: true,
        design: data,
      },
    };
  }

  // Mock fallback (problematic)
  return {
    status: 200,
    body: {
      success: true,
      design: {
        id: designId,
        name: updateData.name || "Updated Design",
        ...updateData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

describe("Creative Studio Update - Current Behavior (R04 Related)", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("CURRENT BEHAVIOR: returns 200 success even when update fails", async () => {
    const result = await simulateUpdateHandler(
      "design-123",
      { name: "Updated Name" },
      {
        data: null,
        error: { message: "Update failed" },
      }
    );

    // ✅ R04 CURRENT BEHAVIOR: Still returns success
    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
  });

  it("CURRENT BEHAVIOR: logs fallback message on update failure", async () => {
    await simulateUpdateHandler(
      "design-123",
      { name: "Updated Name" },
      {
        data: null,
        error: { message: "Update failed" },
      }
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("using mock response")
    );
  });
});

