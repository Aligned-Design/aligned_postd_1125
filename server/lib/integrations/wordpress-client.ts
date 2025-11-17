/**
 * WordPress REST API Client
 * Handles blog post creation, scheduling, and publishing
 */

export interface WordPressPost {
  id?: number;
  title: string | { raw: string; rendered: string };
  content: string | { raw: string; rendered: string };
  excerpt?: string | { raw: string; rendered: string };
  status?: "draft" | "pending" | "publish" | "future" | "private";
  date?: string;
  date_gmt?: string;
  slug?: string;
  author?: number;
  featured_media?: number;
  categories?: number[];
  tags?: number[];
  sticky?: boolean;
  format?: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export class WordPressClient {
  private siteUrl: string;
  private username: string;
  private appPassword: string;
  private baseUrl: string;

  constructor(siteUrl: string, username: string, appPassword: string) {
    this.siteUrl = siteUrl.replace(/\/$/, ""); // Remove trailing slash
    this.username = username;
    this.appPassword = appPassword;
    this.baseUrl = `${this.siteUrl}/wp-json/wp/v2`;
  }

  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const auth = Buffer.from(`${this.username}:${this.appPassword}`).toString(
      "base64",
    );

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WordPress API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async getSiteInfo(): Promise<unknown> {
    return fetch(`${this.siteUrl}/wp-json`).then((r: Response) => r.json());
  }

  async getPosts(params?: Record<string, string>): Promise<WordPressPost[]> {
    const defaults = {
      per_page: "20",
      order: "desc",
      orderby: "date",
    } as Record<string, string>;
    const queryParams = { ...defaults, ...(params || {}) };
    const queryString = new URLSearchParams(queryParams);
    return this.request(`/posts?${queryString.toString()}`) as Promise<
      WordPressPost[]
    >;
  }

  async getPost(postId: number): Promise<WordPressPost> {
    return this.request(`/posts/${postId}`);
  }

  async createPost(post: WordPressPost): Promise<WordPressPost> {
    return this.request("/posts", "POST", post);
  }

  async updatePost(
    postId: number,
    updates: Partial<WordPressPost>,
  ): Promise<WordPressPost> {
    return this.request(`/posts/${postId}`, "POST", updates);
  }

  async deletePost(postId: number, force: boolean = false): Promise<unknown> {
    const queryString = force ? "?force=true" : "";
    return this.request(`/posts/${postId}${queryString}`, "DELETE");
  }

  async publishPost(postId: number): Promise<WordPressPost> {
    return this.request(`/posts/${postId}`, "POST", {
      status: "publish",
    });
  }

  async scheduleBlogPost(
    postId: number,
    publishDate: string,
  ): Promise<WordPressPost> {
    return this.request(`/posts/${postId}`, "POST", {
      status: "future",
      date: publishDate,
    });
  }

  async getCategories(): Promise<WordPressCategory[]> {
    return this.request("/categories?per_page=100");
  }

  async getTags(): Promise<WordPressTag[]> {
    return this.request("/tags?per_page=100");
  }

  async createCategory(
    name: string,
    description?: string,
  ): Promise<WordPressCategory> {
    return this.request("/categories", "POST", {
      name,
      description,
    });
  }

  async createTag(name: string, description?: string): Promise<WordPressTag> {
    return this.request("/tags", "POST", {
      name,
      description,
    });
  }

  async uploadMedia(
    filename: string,
    fileData: Buffer,
    mimeType: string,
  ): Promise<unknown> {
    const url = `${this.baseUrl}/media`;
    const auth = Buffer.from(`${this.username}:${this.appPassword}`).toString(
      "base64",
    );

    const uint8Array = new Uint8Array(fileData);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
      body: uint8Array,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload media: ${response.statusText}`);
    }

    return response.json();
  }

  async getMediaItems(limit: number = 20): Promise<unknown[]> {
    return this.request(`/media?per_page=${limit}&order=desc&orderby=date`);
  }
}
