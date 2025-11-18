import { Platform, PostContent, ValidationResult, PlatformLimits } from '@shared/publishing';

const PLATFORM_LIMITS: Record<Platform, PlatformLimits> = {
  instagram: {
    platform: 'instagram',
    textMaxLength: 2200,
    imagesMax: 10,
    videosMax: 1,
    hashtagsMax: 30,
    supportedAspectRatios: ['1:1', '4:5', '9:16'],
    supportedFormats: ['jpg', 'jpeg', 'png', 'mp4'],
    schedulingEnabled: true,
    maxScheduleDays: 75
  },
  facebook: {
    platform: 'facebook',
    textMaxLength: 63206,
    imagesMax: 10,
    videosMax: 1,
    hashtagsMax: 10,
    supportedAspectRatios: ['16:9', '1:1', '4:5'],
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'mp4'],
    schedulingEnabled: true,
    maxScheduleDays: 180
  },
  linkedin: {
    platform: 'linkedin',
    textMaxLength: 3000,
    imagesMax: 9,
    videosMax: 1,
    hashtagsMax: 3,
    supportedAspectRatios: ['1.91:1', '1:1'],
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'mp4'],
    schedulingEnabled: true,
    maxScheduleDays: 90
  },
  twitter: {
    platform: 'twitter',
    textMaxLength: 280,
    imagesMax: 4,
    videosMax: 1,
    hashtagsMax: 5,
    supportedAspectRatios: ['16:9', '1:1', '2:1'],
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'mp4'],
    schedulingEnabled: true,
    maxScheduleDays: 365
  },
  google_business: {
    platform: 'google_business',
    textMaxLength: 1500,
    imagesMax: 10,
    videosMax: 1,
    hashtagsMax: 5,
    supportedAspectRatios: ['16:9', '1:1', '4:3'],
    supportedFormats: ['jpg', 'jpeg', 'png', 'mp4'],
    schedulingEnabled: true,
    maxScheduleDays: 30
  },
  x: { // ✅ Added X (Twitter) platform limits
    platform: 'x',
    textMaxLength: 280,
    imagesMax: 4,
    videosMax: 1,
    hashtagsMax: 5,
    supportedAspectRatios: ['16:9', '1:1', '2:1'],
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'mp4'],
    schedulingEnabled: true,
    maxScheduleDays: 365
  },
  tiktok: { // ✅ Added TikTok platform limits
    platform: 'tiktok',
    textMaxLength: 2200,
    imagesMax: 0,
    videosMax: 1,
    hashtagsMax: 100,
    supportedAspectRatios: ['9:16'],
    supportedFormats: ['mp4'],
    schedulingEnabled: true,
    maxScheduleDays: 10
  },
  threads: { // ✅ Added Threads platform limits
    platform: 'threads',
    textMaxLength: 500,
    imagesMax: 10,
    videosMax: 0,
    hashtagsMax: 30,
    supportedAspectRatios: ['1:1', '4:5', '9:16'],
    supportedFormats: ['jpg', 'jpeg', 'png'],
    schedulingEnabled: true,
    maxScheduleDays: 75
  },
  canva: { // ✅ Added Canva platform limits
    platform: 'canva',
    textMaxLength: 5000,
    imagesMax: 20,
    videosMax: 1,
    hashtagsMax: 0,
    supportedAspectRatios: ['16:9', '1:1', '4:5', '9:16'],
    supportedFormats: ['jpg', 'jpeg', 'png', 'mp4'],
    schedulingEnabled: false,
    maxScheduleDays: 0
  }
};

export function validatePostContent(platform: Platform, content: PostContent): ValidationResult[] {
  const limits = PLATFORM_LIMITS[platform];
  const results: ValidationResult[] = [];

  // Validate text length
  if (content.text) {
    const textLength = content.text.length;
    if (textLength > limits.textMaxLength) {
      results.push({
        field: 'text',
        status: 'error',
        message: `Text exceeds ${platform} limit of ${limits.textMaxLength} characters (${textLength})`,
        suggestion: `Reduce text by ${textLength - limits.textMaxLength} characters`
      });
    } else if (textLength > limits.textMaxLength * 0.9) {
      results.push({
        field: 'text',
        status: 'warning',
        message: `Text is close to ${platform} limit (${textLength}/${limits.textMaxLength})`,
        suggestion: 'Consider shortening for better engagement'
      });
    } else {
      results.push({
        field: 'text',
        status: 'valid',
        message: `Text length is within ${platform} limits`
      });
    }
  }

  // Validate images
  if (content.images && content.images.length > 0) {
    if (content.images.length > limits.imagesMax) {
      results.push({
        field: 'images',
        status: 'error',
        message: `Too many images for ${platform} (${content.images.length}/${limits.imagesMax})`,
        suggestion: `Remove ${content.images.length - limits.imagesMax} images`
      });
    } else {
      results.push({
        field: 'images',
        status: 'valid',
        message: `Image count is within ${platform} limits`
      });
    }
  }

  // Validate videos
  if (content.videos && content.videos.length > 0) {
    if (content.videos.length > limits.videosMax) {
      results.push({
        field: 'videos',
        status: 'error',
        message: `Too many videos for ${platform} (${content.videos.length}/${limits.videosMax})`,
        suggestion: `Remove ${content.videos.length - limits.videosMax} videos`
      });
    } else {
      results.push({
        field: 'videos',
        status: 'valid',
        message: `Video count is within ${platform} limits`
      });
    }
  }

  // Validate hashtags
  if (content.hashtags && content.hashtags.length > 0) {
    if (content.hashtags.length > limits.hashtagsMax) {
      results.push({
        field: 'hashtags',
        status: 'error',
        message: `Too many hashtags for ${platform} (${content.hashtags.length}/${limits.hashtagsMax})`,
        suggestion: `Remove ${content.hashtags.length - limits.hashtagsMax} hashtags`
      });
    } else {
      results.push({
        field: 'hashtags',
        status: 'valid',
        message: `Hashtag count is within ${platform} limits`
      });
    }
  }

  // Platform-specific validations
  if (platform === 'twitter') {
    validateTwitterSpecific(content, results);
  } else if (platform === 'linkedin') {
    validateLinkedInSpecific(content, results);
  } else if (platform === 'instagram') {
    validateInstagramSpecific(content, results);
  }

  return results;
}

function validateTwitterSpecific(content: PostContent, results: ValidationResult[]): void {
  // Twitter thread detection
  if (content.text && content.text.length > 280) {
    const threadCount = Math.ceil(content.text.length / 280);
    results.push({
      field: 'text',
      status: 'warning',
      message: `Content would create a ${threadCount}-tweet thread`,
      suggestion: 'Consider condensing or using a single image with text'
    });
  }
}

function validateLinkedInSpecific(content: PostContent, results: ValidationResult[]): void {
  // LinkedIn prefers professional content
  if (content.hashtags && content.hashtags.length > 3) {
    results.push({
      field: 'hashtags',
      status: 'warning',
      message: 'LinkedIn performs better with 1-3 relevant hashtags',
      suggestion: 'Use fewer, more targeted hashtags for better reach'
    });
  }
}

function validateInstagramSpecific(content: PostContent, results: ValidationResult[]): void {
  // Instagram hashtag optimization
  if (content.hashtags && content.hashtags.length < 5) {
    results.push({
      field: 'hashtags',
      status: 'warning',
      message: 'Instagram posts typically perform better with 5-10 hashtags',
      suggestion: 'Add more relevant hashtags to increase discoverability'
    });
  }
}

export function getPlatformLimits(platform: Platform): PlatformLimits {
  return PLATFORM_LIMITS[platform];
}

export function validateScheduleTime(platform: Platform, scheduledAt: Date): ValidationResult {
  const limits = PLATFORM_LIMITS[platform];
  const now = new Date();
  const daysDiff = Math.ceil((scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff > limits.maxScheduleDays) {
    return {
      field: 'scheduledAt',
      status: 'error',
      message: `${platform} only allows scheduling up to ${limits.maxScheduleDays} days in advance`,
      suggestion: `Schedule within ${limits.maxScheduleDays} days`
    };
  }

  if (daysDiff < 0) {
    return {
      field: 'scheduledAt',
      status: 'error',
      message: 'Cannot schedule posts in the past',
      suggestion: 'Choose a future date and time'
    };
  }

  return {
    field: 'scheduledAt',
    status: 'valid',
    message: 'Schedule time is valid'
  };
}
