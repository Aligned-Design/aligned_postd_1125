/**
 * Automation Test Fixtures
 * Mock data and helpers for E2E automation pipeline testing
 */

import { v4 as uuidv4 } from 'uuid';

// ==================== TEST DATA ====================

export const TEST_BRAND_ID = '550e8400-e29b-41d4-a716-446655440000';
export const TEST_USER_ID = '660e8400-e29b-41d4-a716-446655440001';
export const TEST_USER_EMAIL = 'test@example.com';
export const TEST_POST_ID = uuidv4();

// ==================== MOCK AI RESPONSES ====================

export const mockAIGeneratedContent = {
  happy_path: {
    title: 'Introducing Our New Product Line',
    body: 'We are excited to announce the launch of our latest innovation. This product combines cutting-edge technology with user-friendly design to deliver exceptional value to our customers.',
    cta: 'Learn more about our new products',
    tone: 'professional',
    hashtags: ['#innovation', '#product', '#technology'],
  },
  brand_mismatch: {
    title: 'yo check this out',
    body: 'so like, we just made some stuff and its pretty cool i guess. might wanna buy it or whatever lol',
    cta: 'click here maybe',
    tone: 'casual',
    hashtags: ['#stuff', '#cool'],
  },
  missing_cta: {
    title: 'Product Update',
    body: 'We have made improvements to our service.',
    cta: '',
    tone: 'neutral',
    hashtags: ['#update'],
  },
  compliance_violation: {
    title: 'Exclusive Offer - Guaranteed Results',
    body: 'This product will definitely cure all your problems. No side effects. Money-back guarantee.',
    cta: 'Buy now before it sells out',
    tone: 'aggressive',
    hashtags: ['#offer', '#exclusive'],
  },
};

// ==================== MOCK BRAND GUIDES ====================

export const mockBrandGuide = {
  id: 'brand-123',
  name: 'Default Brand Guide',
  tone: {
    description: 'Professional and informative',
    keywords: ['professional', 'clear', 'authoritative'],
    prohibited: ['casual', 'slang', 'emoji'],
  },
  terminology: {
    preferred: {
      product: 'Solution',
      customer: 'Partner',
      buy: 'Invest',
    },
    avoid: ['item', 'client', 'purchase'],
  },
  compliance: {
    requirements: [
      'No guarantee claims',
      'Clear disclaimers for claims',
      'Proper attribution',
    ],
    prohibited_words: ['guarantee', 'cure', 'definitely', 'definitely cure'],
  },
  cta: {
    required: true,
    preferred_patterns: [
      'Learn more about',
      'Explore',
      'Discover',
      'Get started with',
    ],
  },
  platform_guidelines: {
    linkedin: {
      max_length: 1300,
      hashtag_count: '2-5',
      recommended_tone: 'professional',
    },
    twitter: {
      max_length: 280,
      hashtag_count: '1-3',
      recommended_tone: 'concise',
    },
    instagram: {
      max_length: 2200,
      hashtag_count: '5-30',
      recommended_tone: 'engaging',
    },
  },
};

export const strictBrandGuide = {
  ...mockBrandGuide,
  tone: {
    description: 'Extremely professional and formal',
    keywords: ['formal', 'corporate', 'authoritative'],
    prohibited: ['casual', 'informal', 'conversational', 'friendly'],
  },
};

// ==================== TIMEZONE TEST DATA ====================

export const timezones = [
  { name: 'US/Eastern', offset: -5 },
  { name: 'US/Central', offset: -6 },
  { name: 'US/Mountain', offset: -7 },
  { name: 'US/Pacific', offset: -8 },
  { name: 'Europe/London', offset: 0 },
  { name: 'Europe/Paris', offset: 1 },
  { name: 'Asia/Tokyo', offset: 9 },
  { name: 'Australia/Sydney', offset: 10 },
];

export function calculateScheduleTime(timezone: string, hoursFromNow: number): Date {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;

  // Parse timezone offset
  const tzData = timezones.find((tz) => tz.name === timezone);
  const offset = tzData ? tzData.offset * 3600000 : 0;

  const localTime = utcTime + offset;
  const scheduledTime = localTime + hoursFromNow * 3600000;

  return new Date(scheduledTime);
}

// ==================== BFS SCORE EXPECTATIONS ====================

export interface BFSScoreExpectation {
  minScore: number;
  maxScore: number;
  expectedBreakdown: {
    tone: { min: number; max: number };
    terminology: { min: number; max: number };
    compliance: { min: number; max: number };
    cta: { min: number; max: number };
    platform: { min: number; max: number };
  };
}

export const bfsScoreExpectations = {
  perfect_brand_alignment: {
    minScore: 95,
    maxScore: 100,
    expectedBreakdown: {
      tone: { min: 95, max: 100 },
      terminology: { min: 95, max: 100 },
      compliance: { min: 95, max: 100 },
      cta: { min: 95, max: 100 },
      platform: { min: 95, max: 100 },
    },
  } as BFSScoreExpectation,

  good_brand_alignment: {
    minScore: 80,
    maxScore: 94,
    expectedBreakdown: {
      tone: { min: 80, max: 94 },
      terminology: { min: 80, max: 94 },
      compliance: { min: 80, max: 94 },
      cta: { min: 80, max: 94 },
      platform: { min: 80, max: 94 },
    },
  } as BFSScoreExpectation,

  poor_brand_alignment: {
    minScore: 30,
    maxScore: 50,
    expectedBreakdown: {
      tone: { min: 20, max: 40 },
      terminology: { min: 30, max: 60 },
      compliance: { min: 40, max: 60 },
      cta: { min: 20, max: 50 },
      platform: { min: 30, max: 50 },
    },
  } as BFSScoreExpectation,

  failing_score: {
    minScore: 0,
    maxScore: 35,
    expectedBreakdown: {
      tone: { min: 0, max: 30 },
      terminology: { min: 0, max: 30 },
      compliance: { min: 0, max: 30 },
      cta: { min: 0, max: 30 },
      platform: { min: 0, max: 30 },
    },
  } as BFSScoreExpectation,
};

// ==================== SCHEDULING CONFLICT DATA ====================

export interface ScheduleConflict {
  existingPostId: string;
  existingScheduleTime: Date;
  newScheduleTime: Date;
  conflictType: 'same_minute' | 'same_hour' | 'same_day';
}

export const scheduleConflicts = {
  same_minute: {
    existingPostId: uuidv4(),
    existingScheduleTime: new Date(Date.now() + 3600000), // 1 hour from now
    newScheduleTime: new Date(Date.now() + 3600000), // Same time
    conflictType: 'same_minute' as const,
  },

  same_hour: {
    existingPostId: uuidv4(),
    existingScheduleTime: new Date(Date.now() + 3600000),
    newScheduleTime: new Date(Date.now() + 3600000 + 1800000), // 30 minutes later
    conflictType: 'same_hour' as const,
  },

  same_day: {
    existingPostId: uuidv4(),
    existingScheduleTime: new Date(Date.now() + 3600000),
    newScheduleTime: new Date(Date.now() + 3600000 + 86400000), // Next day
    conflictType: 'same_day' as const,
  },
};

// ==================== AUDIT LOG ASSERTIONS ====================

export interface AuditLogAssertion {
  action: string;
  expectedFields: string[];
  shouldContainMetadata: string[];
}

export const auditLogAssertions = {
  automation_started: {
    action: 'AUTOMATION_STARTED',
    expectedFields: ['postId', 'brandId', 'actorId', 'createdAt'],
    shouldContainMetadata: ['brandGuideId', 'targetPlatform', 'scheduleTime'],
  } as AuditLogAssertion,

  ai_generation_complete: {
    action: 'AI_GENERATION_COMPLETE',
    expectedFields: ['postId', 'brandId', 'createdAt'],
    shouldContainMetadata: ['generatedContent', 'generationTime'],
  } as AuditLogAssertion,

  brand_application_complete: {
    action: 'BRAND_APPLICATION_COMPLETE',
    expectedFields: ['postId', 'brandId', 'createdAt'],
    shouldContainMetadata: ['appliedChanges', 'bfsScore'],
  } as AuditLogAssertion,

  scheduling_complete: {
    action: 'SCHEDULING_COMPLETE',
    expectedFields: ['postId', 'brandId', 'createdAt'],
    shouldContainMetadata: ['platform', 'scheduledTime'],
  } as AuditLogAssertion,

  automation_failed: {
    action: 'AUTOMATION_FAILED',
    expectedFields: ['postId', 'brandId', 'createdAt'],
    shouldContainMetadata: ['failureReason', 'failureStep'],
  } as AuditLogAssertion,
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a mock automation request
 */
export function createMockAutomationRequest(
  overrides?: Partial<{
    brandId: string;
    userId: string;
    userEmail: string;
    postId: string;
    platform: string;
    scheduleHours: number;
    timezone: string;
    contentVariant: 'happy_path' | 'brand_mismatch' | 'missing_cta' | 'compliance_violation';
    brandGuide: unknown;
  }>
) {
  const defaults = {
    brandId: TEST_BRAND_ID,
    userId: TEST_USER_ID,
    userEmail: TEST_USER_EMAIL,
    postId: TEST_POST_ID,
    platform: 'linkedin',
    scheduleHours: 24,
    timezone: 'US/Eastern',
  };

  return { ...defaults, ...overrides };
}

/**
 * Verify BFS score is within expected range
 */
export function verifyBFSScore(
  score: number,
  expectation: BFSScoreExpectation
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (score < expectation.minScore) {
    errors.push(`Score ${score} is below minimum ${expectation.minScore}`);
  }
  if (score > expectation.maxScore) {
    errors.push(`Score ${score} is above maximum ${expectation.maxScore}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Verify BFS breakdown scores
 */
export function verifyBFSBreakdown(
  breakdown: { tone: number; terminology: number; compliance: number; cta: number; platform: number },
  expectation: BFSScoreExpectation
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const categories = ['tone', 'terminology', 'compliance', 'cta', 'platform'] as const;

  categories.forEach((category) => {
    const score = breakdown[category];
    const range = expectation.expectedBreakdown[category];

    if (score < range.min || score > range.max) {
      errors.push(
        `${category} score ${score} is not in range [${range.min}, ${range.max}]`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate deterministic mock content based on seed
 */
export function generateMockContent(seed: string): typeof mockAIGeneratedContent.happy_path {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variants = Object.values(mockAIGeneratedContent);
  return variants[hash % variants.length];
}
