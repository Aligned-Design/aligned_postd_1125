/**
 * Integration Service
 * Routes to appropriate platform-specific API clients
 */

import { MailchimpClient } from './mailchimp-client';
import { SquarespaceClient } from './squarespace-client';
import { WordPressClient } from './wordpress-client';
import { WixClient } from './wix-client';

// Platform provider type
export type PlatformProvider = 'mailchimp' | 'squarespace' | 'wordpress' | 'wix';

export interface PublishPostRequest {
  title: string;
  content: string;
  excerpt?: string;
  mediaUrls?: string[];
  tags?: string[];
  categories?: string[];
  scheduledFor?: string;
}

export interface PublishEmailCampaignRequest {
  title: string;
  subject: string;
  content: string;
  htmlContent?: string;
  listIds?: string[];
  excerpt?: string;
  scheduledFor?: string;
}

export class IntegrationService {
  /**
   * Publish blog post to specified platform
   */
  static async publishBlogPost(
    provider: PlatformProvider,
    credentials: Record<string, string>,
    post: PublishPostRequest
  ): Promise<unknown> {
    switch (provider) {
      case 'wordpress': {
        const client = new WordPressClient(
          credentials.siteUrl,
          credentials.username,
          credentials.appPassword
        );
        const wpPost = {
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          categories: post.categories?.map(c => parseInt(c, 10)),
          tags: post.tags?.map(t => parseInt(t, 10)),
        };

        if (post.scheduledFor) {
          return client.scheduleBlogPost(await this.createWPPost(client, wpPost), post.scheduledFor);
        } else {
          const created = await client.createPost(wpPost);
          return client.publishPost(created.id!);
        }
      }

      case 'squarespace': {
        const client = new SquarespaceClient(
          credentials.accessToken,
          credentials.siteId
        );
        const ssPost = {
          title: post.title,
          body: post.content,
          excerpt: post.excerpt,
          tags: post.tags,
          categories: post.categories,
        };

        if (post.scheduledFor) {
          const created = await client.createBlogPost(ssPost);
          return created; // Squarespace scheduling handled separately
        } else {
          const created = await client.createBlogPost(ssPost);
          return client.publishBlogPost(created.id!);
        }
      }

      case 'wix': {
        const client = new WixClient(credentials.siteId, credentials.accessToken);
        const wixPost = {
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          tags: post.tags,
          categories: post.categories,
        };

        if (post.scheduledFor) {
          const created = await client.createBlogPost(wixPost);
          return client.scheduleBlogPost(created.id!, post.scheduledFor);
        } else {
          const created = await client.createBlogPost(wixPost);
          return client.publishBlogPost(created.id!);
        }
      }

      default:
        throw new Error(`Blog publishing not supported for ${provider}`);
    }
  }

  /**
   * Publish email campaign to specified platform
   */
  static async publishEmailCampaign(
    provider: PlatformProvider,
    credentials: Record<string, string>,
    campaign: PublishEmailCampaignRequest
  ): Promise<unknown> {
    switch (provider) {
      case 'mailchimp': {
        const client = new MailchimpClient(credentials.apiKey);
        const mcCampaign = {
          type: 'regular' as const,
          recipients: {
            list_id: credentials.listId,
          },
          settings: {
            subject_line: campaign.subject,
            title: campaign.title,
            from_name: credentials.fromName || 'Team',
            reply_to: credentials.replyTo || '',
            preview_text: campaign.excerpt,
          },
          content: {
            html: campaign.htmlContent || campaign.content,
            text: campaign.content,
          },
        };

        const created = await client.createCampaign(mcCampaign);

        if (campaign.scheduledFor) {
          return client.scheduleCampaign(created.id, campaign.scheduledFor);
        } else {
          return client.sendCampaign(created.id);
        }
      }

      case 'squarespace': {
        const client = new SquarespaceClient(
          credentials.accessToken,
          credentials.siteId
        );
        const ssCampaign = {
          title: campaign.title,
          subject: campaign.subject,
          content: campaign.content,
          htmlContent: campaign.htmlContent || campaign.content,
          listIds: campaign.listIds || [],
        };

        const created = await client.createEmailCampaign(ssCampaign);

        if (campaign.scheduledFor) {
          const sendAt = new Date(campaign.scheduledFor).getTime() / 1000;
          return client.scheduleEmailCampaign(created.id!, sendAt);
        } else {
          return client.sendEmailCampaign(created.id!);
        }
      }

      case 'wix': {
        const client = new WixClient(credentials.siteId, credentials.accessToken);
        const wixCampaign = {
          title: campaign.title,
          subject: campaign.subject,
          content: campaign.content,
          htmlContent: campaign.htmlContent || campaign.content,
          contactListIds: campaign.listIds || [],
        };

        const created = await client.createEmailCampaign(wixCampaign);

        if (campaign.scheduledFor) {
          return client.scheduleEmailCampaign(created.id!, campaign.scheduledFor);
        } else {
          return client.sendEmailCampaign(created.id!);
        }
      }

      default:
        throw new Error(`Email publishing not supported for ${provider}`);
    }
  }

  /**
   * Get platform info (lists, categories, etc.)
   */
  static async getPlatformInfo(
    provider: PlatformProvider,
    credentials: Record<string, string>
  ): Promise<unknown> {
    switch (provider) {
      case 'mailchimp': {
        const client = new MailchimpClient(credentials.apiKey);
        return client.getLists();
      }

      case 'squarespace': {
        const client = new SquarespaceClient(credentials.accessToken, credentials.siteId);
        return {
          site: await client.getSiteInfo(),
          emailLists: await client.getEmailLists(),
        };
      }

      case 'wordpress': {
        const client = new WordPressClient(
          credentials.siteUrl,
          credentials.username,
          credentials.appPassword
        );
        return {
          site: await client.getSiteInfo(),
          categories: await client.getCategories(),
          tags: await client.getTags(),
        };
      }

      case 'wix': {
        const client = new WixClient(credentials.siteId, credentials.accessToken);
        return {
          site: await client.getSiteInfo(),
          contactLists: await client.getContactLists(),
        };
      }

      default:
        throw new Error(`Platform info not available for ${provider}`);
    }
  }

  private static async createWPPost(
    client: WordPressClient,
    post: unknown
  ): Promise<number> {
    const created = await client.createPost(post);
    return created.id!;
  }
}
