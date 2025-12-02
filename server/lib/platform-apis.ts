/**
 * Platform API Integrations
 * Real implementations for Instagram, Facebook, LinkedIn, Twitter, and Google Business
 */

import { PostContent, Platform } from "@shared/publishing";

interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  errorCode?: string;
  errorDetails?: unknown;
}

/**
 * Instagram Graph API
 * Documentation: https://developers.facebook.com/docs/instagram-api
 */
export class InstagramAPI {
  private accessToken: string;
  private pageId: string;
  private baseUrl = "https://graph.instagram.com/v18.0";

  constructor(accessToken: string, pageId: string) {
    this.accessToken = accessToken;
    this.pageId = pageId;
  }

  async publishPost(content: PostContent): Promise<PublishResult> {
    try {
      // Instagram requires separate container creation for media
      // Step 1: Create media container
      const containerResponse = await fetch(
        `${this.baseUrl}/${this.pageId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: content.images?.[0],
            caption: content.text,
            access_token: this.accessToken,
          }),
        },
      );

      if (!containerResponse.ok) {
        const error = (await containerResponse.json()) as { error?: { message?: string; code?: string } };
        return {
          success: false,
          error: error.error?.message || "Failed to create media container",
          errorCode: error.error?.code,
          errorDetails: error,
        };
      }

      const container = (await containerResponse.json()) as { id?: string };

      // Step 2: Publish container
      const publishResponse = await fetch(
        `${this.baseUrl}/${this.pageId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: container.id,
            access_token: this.accessToken,
          }),
        },
      );

      if (!publishResponse.ok) {
        const error = (await publishResponse.json()) as { error?: { message?: string; code?: string } };
        return {
          success: false,
          error: error.error?.message || "Failed to publish media",
          errorCode: error.error?.code,
          errorDetails: error,
        };
      }

      const result = (await publishResponse.json()) as { id?: string };

      return {
        success: true,
        platformPostId: result.id,
        platformUrl: `https://instagram.com/p/${result.id}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Instagram API error",
        errorDetails: error,
      };
    }
  }
}

/**
 * Facebook Graph API
 * Documentation: https://developers.facebook.com/docs/facebook-api/overview
 */
export class FacebookAPI {
  private accessToken: string;
  private pageId: string;
  private baseUrl = "https://graph.facebook.com/v18.0";

  constructor(accessToken: string, pageId: string) {
    this.accessToken = accessToken;
    this.pageId = pageId;
  }

  async publishPost(content: PostContent): Promise<PublishResult> {
    try {
      const body: unknown = {
        message: content.text,
        access_token: this.accessToken,
      };

      // Add media if provided
      if (content.images?.[0]) {
        (body as { link?: string }).link = content.images[0];
      }

      const response = await fetch(`${this.baseUrl}/${this.pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: { message?: string; code?: string } } | unknown;
        const errorObj = error && typeof error === 'object' && 'error' in error && error.error && typeof error.error === 'object' ? error.error : null;
        return {
          success: false,
          error: (errorObj && 'message' in errorObj && typeof errorObj.message === 'string' ? errorObj.message : null) || "Failed to publish post",
          errorCode: errorObj && 'code' in errorObj && typeof errorObj.code === 'string' ? errorObj.code : undefined,
          errorDetails: error,
        };
      }

      const result = (await response.json()) as { id?: string } | unknown;
      const resultId = result && typeof result === 'object' && 'id' in result && typeof result.id === 'string' ? result.id : undefined;

      return {
        success: true,
        platformPostId: resultId,
        platformUrl: resultId ? `https://facebook.com/${resultId}` : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Facebook API error",
        errorDetails: error,
      };
    }
  }
}

/**
 * LinkedIn API
 * Documentation: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/posts-api
 */
export class LinkedInAPI {
  private accessToken: string;
  private actorId: string;
  private baseUrl = "https://api.linkedin.com/rest";

  constructor(accessToken: string, actorId: string) {
    this.accessToken = accessToken;
    this.actorId = actorId;
  }

  async publishPost(content: PostContent): Promise<PublishResult> {
    try {
      const body: unknown = {
        author: `urn:li:person:${this.actorId}`,
        commentary: content.text,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
      };

      // Add media if provided
      if (content.images?.[0]) {
        (body as { content?: { media?: { id: string } } }).content = {
          media: {
            id: content.images[0],
          },
        };
      }

      const response = await fetch(`${this.baseUrl}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
          "LinkedIn-Version": "202301",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = (await response.json()) as { message?: string; status?: number };
        return {
          success: false,
          error: error.message || "Failed to publish post",
          errorCode: error.status?.toString(),
          errorDetails: error,
        };
      }

      const postId = response.headers.get("x-linkedin-id") || "unknown";

      return {
        success: true,
        platformPostId: postId,
        platformUrl: `https://linkedin.com/feed/update/${postId}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "LinkedIn API error",
        errorDetails: error,
      };
    }
  }
}

/**
 * Twitter API v2
 * Documentation: https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/integrate/create-tweet
 */
export class TwitterAPI {
  private accessToken: string;
  private baseUrl = "https://api.twitter.com/2";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async publishPost(content: PostContent): Promise<PublishResult> {
    try {
      const body: unknown = {
        text: content.text,
      };

      // Twitter media handling
      if (content.images?.[0]) {
        // Note: In production, would need to upload media first to get media_ids
        (body as { media?: { media_ids: string[] } }).media = {
          media_ids: [content.images[0]],
        };
      }

      const response = await fetch(`${this.baseUrl}/tweets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = (await response.json()) as { detail?: string; type?: string };
        return {
          success: false,
          error: error.detail || "Failed to publish tweet",
          errorCode: error.type,
          errorDetails: error,
        };
      }

      const result = (await response.json()) as { data?: { id?: string } };

      return {
        success: true,
        platformPostId: result.data.id,
        platformUrl: `https://twitter.com/i/web/status/${result.data.id}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Twitter API error",
        errorDetails: error,
      };
    }
  }
}

/**
 * Google Business Profile API
 * Documentation: https://developers.google.com/my-business/content/posts
 */
export class GoogleBusinessAPI {
  private accessToken: string;
  private businessAccountId: string;
  private baseUrl = "https://mybusinesscontent.googleapis.com/v1";

  constructor(accessToken: string, businessAccountId: string) {
    this.accessToken = accessToken;
    this.businessAccountId = businessAccountId;
  }

  async publishPost(content: PostContent): Promise<PublishResult> {
    try {
      const postData: unknown = {
        summary: content.text,
        callToAction: {
          actionType: "LEARN_MORE",
        },
      };

      // Add media if provided
      if (content.images?.[0]) {
        (postData as { media?: Array<{ mediaFormat: string; sourceUrl: string }> }).media = [
          {
            mediaFormat: "IMAGE",
            sourceUrl: content.images[0],
          },
        ];
      }

      const response = await fetch(
        `${this.baseUrl}/accounts/${this.businessAccountId}/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(postData),
        },
      );

      if (!response.ok) {
        const error = (await response.json()) as { error?: { message?: string; code?: string } };
        return {
          success: false,
          error: error.error?.message || "Failed to publish post",
          errorCode: error.error?.code,
          errorDetails: error,
        };
      }

      const result = (await response.json()) as { name?: string };

      return {
        success: true,
        platformPostId: result.name,
        platformUrl: `https://www.google.com/business/location/${this.businessAccountId}`,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Google Business API error",
        errorDetails: error,
      };
    }
  }
}

/**
 * Factory function to get the correct API client
 */
export function getPlatformAPI(
  platform: Platform,
  accessToken: string,
  accountId: string,
): InstagramAPI | FacebookAPI | LinkedInAPI | TwitterAPI | GoogleBusinessAPI {
  switch (platform) {
    case "instagram":
      return new InstagramAPI(accessToken, accountId);
    case "facebook":
      return new FacebookAPI(accessToken, accountId);
    case "linkedin":
      return new LinkedInAPI(accessToken, accountId);
    case "twitter":
      return new TwitterAPI(accessToken);
    case "google_business":
      return new GoogleBusinessAPI(accessToken, accountId);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
