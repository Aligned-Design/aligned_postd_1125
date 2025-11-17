/**
 * Wix API Client
 * Handles blog post publishing and email campaign management
 */

export interface WixBlogPost {
  id?: string;
  title: string;
  content: string;
  excerpt?: string;
  richContent?: {
    nodes: unknown[];
  };
  authors?: string[];
  featured_image?: string;
  slug?: string;
  published?: boolean;
  publishedDate?: string;
  firstPublishedDatetime?: string;
  coverImage?: {
    url: string;
    width?: number;
    height?: number;
  };
  categories?: string[];
  tags?: string[];
}

export interface WixEmailCampaign {
  id?: string;
  title: string;
  subject: string;
  fromName?: string;
  fromEmail?: string;
  content: string;
  htmlContent: string;
  contactListIds: string[];
  schedule?: {
    sendAt: string;
  };
  status?: "draft" | "scheduled" | "sent";
}

export class WixClient {
  private siteId: string;
  private accessToken: string;
  private baseUrl = "https://www.wixapis.com/v1";

  constructor(siteId: string, accessToken: string) {
    this.siteId = siteId;
    this.accessToken = accessToken;
  }

  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: unknown,
  ): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: this.accessToken,
        "Content-Type": "application/json",
        "wix-api-version": "1.0",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Wix API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async getSiteInfo(): Promise<unknown> {
    return this.request(`/contacts/sites`);
  }

  async getBlogPosts(limit: number = 20): Promise<WixBlogPost[]> {
    const response = await this.request(
      `/blogs/posts?limit=${limit}&sort=PUBLISHED_DATE_DESC`,
    );
    return (response && response.posts) || [];
  }

  async getBlogPost(postId: string): Promise<WixBlogPost> {
    return this.request(`/blogs/posts/${postId}`);
  }

  async createBlogPost(post: WixBlogPost): Promise<WixBlogPost> {
    return this.request("/blogs/posts", "POST", post);
  }

  async updateBlogPost(
    postId: string,
    updates: Partial<WixBlogPost>,
  ): Promise<WixBlogPost> {
    return this.request(`/blogs/posts/${postId}`, "PATCH", updates);
  }

  async deleteBlogPost(postId: string): Promise<void> {
    await this.request(`/blogs/posts/${postId}`, "DELETE");
  }

  async publishBlogPost(postId: string): Promise<WixBlogPost> {
    return this.request(`/blogs/posts/${postId}`, "PATCH", {
      published: true,
      publishedDate: new Date().toISOString(),
    });
  }

  async scheduleBlogPost(
    postId: string,
    publishDate: string,
  ): Promise<WixBlogPost> {
    return this.request(`/blogs/posts/${postId}`, "PATCH", {
      published: true,
      publishedDate: publishDate,
    });
  }

  async getContactLists(): Promise<unknown[]> {
    const response = await this.request("/contacts/lists");
    return (response && response.lists) || [];
  }

  async getContacts(limit: number = 20): Promise<unknown[]> {
    const response = await this.request(`/contacts/contacts?limit=${limit}`);
    return (response && response.contacts) || [];
  }

  async createEmailCampaign(
    campaign: WixEmailCampaign,
  ): Promise<WixEmailCampaign> {
    return this.request("/email/campaigns", "POST", campaign);
  }

  async updateEmailCampaign(
    campaignId: string,
    updates: Partial<WixEmailCampaign>,
  ): Promise<WixEmailCampaign> {
    return this.request(`/email/campaigns/${campaignId}`, "PATCH", updates);
  }

  async sendEmailCampaign(campaignId: string): Promise<unknown> {
    return this.request(`/email/campaigns/${campaignId}/send`, "POST", {});
  }

  async scheduleEmailCampaign(
    campaignId: string,
    sendAt: string,
  ): Promise<unknown> {
    return this.request(`/email/campaigns/${campaignId}`, "PATCH", {
      schedule: { sendAt },
      status: "scheduled",
    });
  }

  async getEmailCampaigns(limit: number = 20): Promise<WixEmailCampaign[]> {
    const response = await this.request(
      `/email/campaigns?limit=${limit}&sort=CREATED_DATE_DESC`,
    );
    return (response && response.campaigns) || [];
  }

  async getMediaItems(limit: number = 20): Promise<unknown[]> {
    const response = await this.request(
      `/media/items?limit=${limit}&sort=CREATED_DATE_DESC`,
    );
    return (response && response.items) || [];
  }

  async uploadMedia(
    filename: string,
    fileData: Buffer,
    mimeType: string,
  ): Promise<unknown> {
    // Wix uses a different media upload flow - requires multipart form data
    const url = `${this.baseUrl}/media/items`;

    const formData = new FormData();
    const uint8Array = new Uint8Array(fileData);
    const blob = new Blob([uint8Array], { type: mimeType });
    formData.append("file", blob, filename);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: this.accessToken,
        "wix-api-version": "1.0",
      },
      body: formData as unknown,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload media: ${response.statusText}`);
    }

    return response.json();
  }
}
