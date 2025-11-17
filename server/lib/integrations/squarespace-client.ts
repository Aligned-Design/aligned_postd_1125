/**
 * Squarespace API Client
 * Handles blog post publishing and email campaign management
 */

export interface SquarespacePost {
  id?: string;
  title: string;
  body: string;
  excerpt?: string;
  addedOn?: number;
  publishedOn?: number;
  updatedOn?: number;
  categories?: string[];
  tags?: string[];
  author?: string;
  sourceUrl?: string;
  sourceUrlTitle?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  mainImage?: {
    assetUrl: string;
    width?: number;
    height?: number;
  };
}

export interface SquarespaceEmailCampaign {
  id?: string;
  title: string;
  subject: string;
  content: string;
  htmlContent: string;
  listIds: string[];
  schedule?: {
    sendAt: number;
  };
}

export class SquarespaceClient {
  private accessToken: string;
  private siteId: string;
  private baseUrl = "https://api.squarespace.com/v1";

  constructor(accessToken: string, siteId: string) {
    this.accessToken = accessToken;
    this.siteId = siteId;
  }

  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Squarespace API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async getSiteInfo(): Promise<unknown> {
    return this.request<unknown>(`/sites/${this.siteId}`);
  }

  async getBlogPosts(limit: number = 20): Promise<SquarespacePost[]> {
    const response = await this.request<{ items: SquarespacePost[] }>(
      `/sites/${this.siteId}/blog/posts?limit=${limit}`,
    );
    return response.items || [];
  }

  async createBlogPost(post: SquarespacePost): Promise<unknown> {
    return this.request<unknown>(`/sites/${this.siteId}/blog/posts`, "POST", post);
  }

  async updateBlogPost(
    postId: string,
    updates: Partial<SquarespacePost>,
  ): Promise<unknown> {
    return this.request<unknown>(
      `/sites/${this.siteId}/blog/posts/${postId}`,
      "PATCH",
      updates,
    );
  }

  async deleteBlogPost(postId: string): Promise<void> {
    await this.request<unknown>(
      `/sites/${this.siteId}/blog/posts/${postId}`,
      "DELETE",
    );
  }

  async publishBlogPost(postId: string): Promise<unknown> {
    return this.request<unknown>(
      `/sites/${this.siteId}/blog/posts/${postId}`,
      "PATCH",
      {
        publishedOn: Math.floor(Date.now() / 1000),
      },
    );
  }

  async getEmailLists(): Promise<unknown> {
    return this.request<unknown>(`/sites/${this.siteId}/email/lists`);
  }

  async createEmailCampaign(campaign: SquarespaceEmailCampaign): Promise<unknown> {
    return this.request<unknown>(
      `/sites/${this.siteId}/email/campaigns`,
      "POST",
      campaign,
    );
  }

  async updateEmailCampaign(
    campaignId: string,
    updates: Partial<SquarespaceEmailCampaign>,
  ): Promise<unknown> {
    return this.request<unknown>(
      `/sites/${this.siteId}/email/campaigns/${campaignId}`,
      "PATCH",
      updates,
    );
  }

  async sendEmailCampaign(campaignId: string): Promise<unknown> {
    return this.request<unknown>(
      `/sites/${this.siteId}/email/campaigns/${campaignId}/send`,
      "POST",
      {},
    );
  }

  async scheduleEmailCampaign(
    campaignId: string,
    sendAt: number,
  ): Promise<unknown> {
    return this.request<unknown>(
      `/sites/${this.siteId}/email/campaigns/${campaignId}`,
      "PATCH",
      {
        schedule: { sendAt },
      },
    );
  }
}
