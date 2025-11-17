/**
 * Test Fixtures
 * Strongly typed test data and factory functions
 */

import {
  UserProfile,
  BrandRecord,
  ContentItem,
  Post,
  PlatformConnection,
  AnalyticsData,
  WorkflowInstance,
} from '../types/database';

// ============================================================================
// USER FIXTURES
// ============================================================================

export const mockUserProfile: UserProfile = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  avatarUrl: 'https://example.com/avatar.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  lastSignInAt: '2024-01-01T00:00:00Z',
  isActive: true,
};

export const createMockUserProfile = (overrides?: Partial<UserProfile>): UserProfile => ({
  ...mockUserProfile,
  ...overrides,
});

// ============================================================================
// BRAND FIXTURES
// ============================================================================

export const mockBrandRecord: BrandRecord = {
  id: 'brand-123',
  agencyId: 'agency-123',
  name: 'Test Brand',
  description: 'A test brand',
  industry: 'Technology',
  website: 'https://example.com',
  logoUrl: 'https://example.com/logo.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  isActive: true,
};

export const createMockBrandRecord = (overrides?: Partial<BrandRecord>): BrandRecord => ({
  ...mockBrandRecord,
  ...overrides,
});

// ============================================================================
// CONTENT FIXTURES
// ============================================================================

export const mockContentItem: ContentItem = {
  id: 'content-123',
  brandId: 'brand-123',
  title: 'Test Post',
  description: 'A test post',
  content: 'This is test content',
  status: 'draft',
  contentType: 'post',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'user-123',
};

export const createMockContentItem = (overrides?: Partial<ContentItem>): ContentItem => ({
  ...mockContentItem,
  ...overrides,
});

export const mockPost: Post = {
  id: 'post-123',
  contentId: 'content-123',
  platform: 'instagram',
  platformPostId: 'ig-post-123',
  url: 'https://instagram.com/p/test',
  status: 'published',
  publishedAt: '2024-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const createMockPost = (overrides?: Partial<Post>): Post => ({
  ...mockPost,
  ...overrides,
});

// ============================================================================
// PLATFORM CONNECTION FIXTURES
// ============================================================================

export const mockPlatformConnection: PlatformConnection = {
  id: 'conn-123',
  brandId: 'brand-123',
  platform: 'instagram',
  accountId: 'ig-account-123',
  accountName: 'Test Account',
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresAt: '2025-01-01T00:00:00Z',
  isActive: true,
  lastSyncAt: '2024-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const createMockPlatformConnection = (
  overrides?: Partial<PlatformConnection>
): PlatformConnection => ({
  ...mockPlatformConnection,
  ...overrides,
});

// ============================================================================
// ANALYTICS FIXTURES
// ============================================================================

export const mockAnalyticsData: AnalyticsData = {
  id: 'analytics-123',
  brandId: 'brand-123',
  platform: 'instagram',
  metricType: 'engagement',
  value: 1500,
  date: '2024-01-01',
  recordedAt: '2024-01-01T00:00:00Z',
};

export const createMockAnalyticsData = (overrides?: Partial<AnalyticsData>): AnalyticsData => ({
  ...mockAnalyticsData,
  ...overrides,
});

// ============================================================================
// WORKFLOW FIXTURES
// ============================================================================

export const mockWorkflowInstance: WorkflowInstance = {
  id: 'workflow-123',
  templateId: 'template-123',
  brandId: 'brand-123',
  contentId: 'content-123',
  status: 'in_progress',
  currentStep: 1,
  startedAt: '2024-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
};

export const createMockWorkflowInstance = (
  overrides?: Partial<WorkflowInstance>
): WorkflowInstance => ({
  ...mockWorkflowInstance,
  ...overrides,
});

// ============================================================================
// REQUEST/RESPONSE FIXTURES
// ============================================================================

export interface MockRequestContext {
  userId: string;
  brandId: string;
  headers: Record<string, string>;
}

export const createMockRequestContext = (
  overrides?: Partial<MockRequestContext>
): MockRequestContext => ({
  userId: 'user-123',
  brandId: 'brand-123',
  headers: {
    'content-type': 'application/json',
    authorization: 'Bearer test-token',
  },
  ...overrides,
});

// ============================================================================
// BATCH FIXTURES
// ============================================================================

export const createMockBrandWithContent = (count: number = 3) => {
  const brand = createMockBrandRecord();
  const content = Array.from({ length: count }, (_, i) =>
    createMockContentItem({
      id: `content-${i}`,
      brandId: brand.id,
    })
  );
  const posts = content.map((item, i) =>
    createMockPost({
      id: `post-${i}`,
      contentId: item.id,
    })
  );

  return { brand, content, posts };
};

export const createMockBrandWithConnections = (count: number = 3) => {
  const brand = createMockBrandRecord();
  const platforms = ['instagram', 'facebook', 'twitter', 'tiktok', 'linkedin'].slice(0, count);
  const connections = platforms.map((platform, i) =>
    createMockPlatformConnection({
      id: `conn-${i}`,
      brandId: brand.id,
      platform,
      accountId: `${platform}-account-${i}`,
    })
  );

  return { brand, connections };
};

// ============================================================================
// SEED DATA UTILITIES
// ============================================================================

export interface TestDataSnapshot {
  users: UserProfile[];
  brands: BrandRecord[];
  content: ContentItem[];
  posts: Post[];
  connections: PlatformConnection[];
  analytics: AnalyticsData[];
  workflows: WorkflowInstance[];
}

export const createMockTestDataSnapshot = (options?: {
  userCount?: number;
  brandCount?: number;
  contentPerBrand?: number;
  connectionsPerBrand?: number;
}): TestDataSnapshot => {
  const {
    userCount = 2,
    brandCount = 2,
    contentPerBrand = 3,
    connectionsPerBrand = 2,
  } = options || {};

  const users = Array.from({ length: userCount }, (_, i) =>
    createMockUserProfile({ id: `user-${i}` })
  );

  const brands = Array.from({ length: brandCount }, (_, i) =>
    createMockBrandRecord({ id: `brand-${i}` })
  );

  const content = brands.flatMap((brand, brandIdx) =>
    Array.from({ length: contentPerBrand }, (_, contentIdx) =>
      createMockContentItem({
        id: `content-${brandIdx}-${contentIdx}`,
        brandId: brand.id,
        createdBy: users[brandIdx % users.length].id,
      })
    )
  );

  const posts = content.map((item, i) =>
    createMockPost({
      id: `post-${i}`,
      contentId: item.id,
    })
  );

  const connections = brands.flatMap((brand, brandIdx) =>
    Array.from({ length: connectionsPerBrand }, (_, connIdx) => {
      const platforms = ['instagram', 'facebook', 'twitter', 'tiktok', 'linkedin'];
      return createMockPlatformConnection({
        id: `conn-${brandIdx}-${connIdx}`,
        brandId: brand.id,
        platform: platforms[connIdx % platforms.length],
      });
    })
  );

  const analytics = connections.flatMap((conn, i) =>
    Array.from({ length: 5 }, (_, metricIdx) =>
      createMockAnalyticsData({
        id: `analytics-${i}-${metricIdx}`,
        brandId: conn.brandId,
        platform: conn.platform,
        date: new Date(Date.now() - metricIdx * 86400000).toISOString().split('T')[0],
      })
    )
  );

  const workflows = content.map((item, i) =>
    createMockWorkflowInstance({
      id: `workflow-${i}`,
      contentId: item.id,
      brandId: item.brandId,
    })
  );

  return {
    users,
    brands,
    content,
    posts,
    connections,
    analytics,
    workflows,
  };
};
