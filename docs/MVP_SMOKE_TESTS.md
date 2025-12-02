# MVP Smoke Tests

**Date**: January 2025  
**Purpose**: Light automated tests for critical client journeys (one per MVP)

---

## Test Setup

These tests are designed to run against a deployed environment (staging/prod). They use test accounts and test brands.

**Prerequisites**:
- Test account credentials
- Test brand IDs
- API base URL configured
- AI API keys configured (for generation tests)

---

## MVP 2: Brand Guide Builder Smoke Test

### Test: Create Brand and Build Brand Guide

```typescript
describe("MVP 2: Brand Guide Builder", () => {
  it("should create brand and build Brand Guide via scrape", async () => {
    // 1. Create brand
    const brandResponse = await fetch(`${API_URL}/api/brands`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TEST_TOKEN}` },
      body: JSON.stringify({
        name: "Test Brand",
        website_url: "https://example.com",
        workspace_id: TEST_WORKSPACE_ID,
      }),
    });
    expect(brandResponse.ok).toBe(true);
    const { id: brandId } = await brandResponse.json();

    // 2. Trigger scrape
    const scrapeResponse = await fetch(`${API_URL}/api/crawl/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TEST_TOKEN}` },
      body: JSON.stringify({
        url: "https://example.com",
        brand_id: brandId,
        workspaceId: TEST_WORKSPACE_ID,
        sync: true,
      }),
    });
    expect(scrapeResponse.ok).toBe(true);
    const scrapeData = await scrapeResponse.json();
    expect(scrapeData.brandKit).toBeDefined();

    // 3. Get Brand Guide
    const guideResponse = await fetch(`${API_URL}/api/brand-guide/${brandId}`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    expect(guideResponse.ok).toBe(true);
    const guide = await guideResponse.json();
    expect(guide.brandGuide).toBeDefined();
    expect(guide.hasBrandGuide).toBe(true);

    // 4. Update Brand Guide
    const updateResponse = await fetch(`${API_URL}/api/brand-guide/${brandId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TEST_TOKEN}` },
      body: JSON.stringify({
        tone: ["professional", "friendly"],
        primaryColor: "#3B82F6",
      }),
    });
    expect(updateResponse.ok).toBe(true);

    // 5. Verify update persisted
    const verifyResponse = await fetch(`${API_URL}/api/brand-guide/${brandId}`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    const updatedGuide = await verifyResponse.json();
    expect(updatedGuide.brandGuide.tone).toContain("professional");
    expect(updatedGuide.brandGuide.primaryColor).toBe("#3B82F6");
  });
});
```

---

## MVP 3: AI Content Generator Smoke Test

### Test: Generate Content with Brand Guide Context

```typescript
describe("MVP 3: AI Content Generator", () => {
  it("should generate content using Brand Guide settings", async () => {
    // Prerequisite: Brand Guide exists (from MVP 2 test)
    const brandId = TEST_BRAND_ID;

    // 1. Get Brand Guide (verify it exists)
    const guideResponse = await fetch(`${API_URL}/api/brand-guide/${brandId}`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    expect(guideResponse.ok).toBe(true);
    const { brandGuide } = await guideResponse.json();
    expect(brandGuide).toBeDefined();

    // 2. Generate content
    const generateResponse = await fetch(`${API_URL}/api/agents/generate/doc`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TEST_TOKEN}` },
      body: JSON.stringify({
        brand_id: brandId,
        input: {
          topic: "New product launch",
          platform: "instagram",
          contentType: "caption",
          tone: "professional",
        },
      }),
    });
    expect(generateResponse.ok).toBe(true);
    const generated = await generateResponse.json();
    
    // 3. Verify response structure
    expect(generated.output).toBeDefined();
    expect(generated.output.body).toBeDefined();
    expect(generated.output.headline).toBeDefined();
    expect(generated.bfs).toBeDefined();
    expect(generated.bfs.brandFidelityScore).toBeGreaterThanOrEqual(0);
    expect(generated.bfs.brandFidelityScore).toBeLessThanOrEqual(1);

    // 4. Verify BFS is reasonable (not too low)
    expect(generated.bfs.brandFidelityScore).toBeGreaterThan(0.5); // At least 50% match
  });
});
```

---

## MVP 4: Creative Studio Smoke Test

### Test: Save and Load Design

```typescript
describe("MVP 4: Creative Studio", () => {
  it("should save and load design", async () => {
    const brandId = TEST_BRAND_ID;

    // 1. Get Brand Guide (for colors/fonts)
    const guideResponse = await fetch(`${API_URL}/api/brand-guide/${brandId}`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    expect(guideResponse.ok).toBe(true);

    // 2. Save design
    const saveResponse = await fetch(`${API_URL}/api/creative-studio/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TEST_TOKEN}` },
      body: JSON.stringify({
        brand_id: brandId,
        design_json: {
          items: [
            { id: "text-1", type: "text", content: "Test Design", x: 100, y: 100 },
          ],
          format: { width: 1080, height: 1080 },
        },
        name: "Test Design",
        format: "instagram",
      }),
    });
    expect(saveResponse.ok).toBe(true);
    const { design_id } = await saveResponse.json();
    expect(design_id).toBeDefined();

    // 3. Load design
    const loadResponse = await fetch(`${API_URL}/api/creative-studio/${design_id}`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    expect(loadResponse.ok).toBe(true);
    const design = await loadResponse.json();
    expect(design.design_json).toBeDefined();
    expect(design.design_json.items).toHaveLength(1);
  });
});
```

---

## MVP 5: Scheduler + Approvals Smoke Test

### Test: Schedule Content and Approve

```typescript
describe("MVP 5: Scheduler + Approvals", () => {
  it("should schedule content and approve it", async () => {
    const brandId = TEST_BRAND_ID;

    // 1. Create content package
    const createResponse = await fetch(`${API_URL}/api/content-packages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TEST_TOKEN}` },
      body: JSON.stringify({
        brand_id: brandId,
        items: [
          {
            platform: "instagram",
            content: "Test post content",
            scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            status: "pending_review",
          },
        ],
      }),
    });
    expect(createResponse.ok).toBe(true);
    const { id: packageId } = await createResponse.json();

    // 2. Get approval queue
    const queueResponse = await fetch(`${API_URL}/api/agents/review/queue/${brandId}`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    expect(queueResponse.ok).toBe(true);
    const queue = await queueResponse.json();
    expect(queue.items).toBeDefined();
    expect(Array.isArray(queue.items)).toBe(true);

    // 3. Approve content (if item exists in queue)
    if (queue.items.length > 0) {
      const itemId = queue.items[0].id;
      const approveResponse = await fetch(`${API_URL}/api/approvals/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${TEST_TOKEN}` },
        body: JSON.stringify({
          content_id: itemId,
          comment: "Test approval",
        }),
      });
      expect(approveResponse.ok).toBe(true);
    }

    // 4. Get calendar (verify scheduled content appears)
    const calendarResponse = await fetch(`${API_URL}/api/calendar/${brandId}`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    expect(calendarResponse.ok).toBe(true);
    const calendar = await calendarResponse.json();
    expect(calendar.events).toBeDefined();
    expect(Array.isArray(calendar.events)).toBe(true);
  });
});
```

---

## Running Smoke Tests

### Manual Execution

1. **Set environment variables**:
   ```bash
   export API_URL="https://staging.example.com"
   export TEST_TOKEN="your-test-jwt-token"
   export TEST_WORKSPACE_ID="your-test-workspace-id"
   export TEST_BRAND_ID="your-test-brand-id"
   ```

2. **Run tests**:
   ```bash
   pnpm test server/__tests__/mvp-smoke.test.ts
   ```

### Automated Execution (CI/CD)

Add to CI pipeline:
```yaml
- name: Run MVP Smoke Tests
  run: |
    pnpm test server/__tests__/mvp-smoke.test.ts --env=staging
  env:
    API_URL: ${{ secrets.STAGING_API_URL }}
    TEST_TOKEN: ${{ secrets.TEST_TOKEN }}
```

---

## Test Data Requirements

### Test Brand
- Brand ID: UUID format
- Brand Guide: Should exist (can be minimal)
- Workspace ID: Valid workspace UUID

### Test Account
- User ID: Valid user UUID
- Permissions: `content:view`, `content:manage`, `ai:generate`, `content:approve`
- Workspace access: Access to test workspace

---

## Expected Results

All tests should:
- ✅ Return 200 OK status codes
- ✅ Have valid response structure
- ✅ Persist data correctly
- ✅ Respect brand isolation (no cross-brand leaks)

---

## Known Test Limitations

1. **AI Generation Tests**: Require AI API keys configured
2. **OAuth Tests**: Require OAuth redirect URLs configured
3. **Publishing Tests**: Require platform connections (Instagram, LinkedIn, etc.)
4. **Performance Tests**: Not included (focus on functionality)

---

## Test Maintenance

- Update test data (brand IDs, workspace IDs) when test accounts change
- Update API endpoints if routes change
- Add new tests for new MVP features
- Remove tests for deprecated features

---

## Integration with Manual Checklists

These smoke tests cover the **happy path** for each MVP. For comprehensive testing, also run the manual checklists in `MVP_CLIENT_ACCEPTANCE_CHECKLISTS.md`.

