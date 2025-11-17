/**
 * Mailchimp API Client
 * Handles email campaign creation, scheduling, and sending
 */

export interface MailchimpCampaign {
  id?: string;
  type: "regular" | "plaintext" | "absplit" | "rss" | "variate";
  recipients: {
    list_id: string;
    segment_opts?: {
      saved_segment_id: number;
      match: "any" | "all";
    };
  };
  settings: {
    subject_line: string;
    title: string;
    from_name: string;
    reply_to: string;
    preview_text?: string;
  };
  content: {
    html: string;
    text?: string;
    url?: string;
  };
  schedule?: {
    schedule_time: string;
  };
}

export interface MailchimpListSegment {
  id: number;
  name: string;
  member_count: number;
  type: string;
  created_at: string;
  updated_at: string;
}

export class MailchimpClient {
  private apiKey: string;
  private serverPrefix: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Extract server prefix from API key (e.g., us1, us2, etc.)
    const parts = apiKey.split("-");
    this.serverPrefix = parts[1] || "us1";
    this.baseUrl = `https://${this.serverPrefix}.api.mailchimp.com/3.0`;
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
        Authorization: `Basic ${Buffer.from(`anystring:${this.apiKey}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mailchimp API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async getLists(): Promise<unknown> {
    return this.request<unknown>("/lists");
  }

  async getListSegments(listId: string): Promise<MailchimpListSegment[]> {
    const response = await this.request<{ segments: MailchimpListSegment[] }>(
      `/lists/${listId}/segments`,
    );
    return response.segments || [];
  }

  async createCampaign(campaign: MailchimpCampaign): Promise<unknown> {
    return this.request<unknown>("/campaigns", "POST", campaign);
  }

  async updateCampaign(
    campaignId: string,
    updates: Partial<MailchimpCampaign>,
  ): Promise<unknown> {
    return this.request<unknown>(`/campaigns/${campaignId}`, "PATCH", updates);
  }

  async setCampaignContent(campaignId: string, content: unknown): Promise<unknown> {
    return this.request<unknown>(
      `/campaigns/${campaignId}/content`,
      "PUT",
      content,
    );
  }

  async sendCampaign(campaignId: string): Promise<unknown> {
    return this.request<unknown>(
      `/campaigns/${campaignId}/actions/send`,
      "POST",
      {},
    );
  }

  async scheduleCampaign(
    campaignId: string,
    scheduleTime: string,
  ): Promise<unknown> {
    return this.request<unknown>(
      `/campaigns/${campaignId}/actions/schedule`,
      "POST",
      {
        schedule_time: scheduleTime,
      },
    );
  }

  async getCampaignStatus(campaignId: string): Promise<unknown> {
    return this.request<unknown>(`/campaigns/${campaignId}`);
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    await this.request(`/campaigns/${campaignId}`, "DELETE");
  }
}
