import { Platform, AnalyticsMetric } from "@shared/analytics";
import {
  broadcastAnalyticsSyncStarted,
  broadcastAnalyticsSyncProgressUpdate,
  broadcastAnalyticsSyncCompleted,
  broadcastInsightsGenerated,
} from "./event-broadcaster";
import {
  InstagramMediaResponse,
  InstagramAccountInsightsResponse,
  FacebookPostsResponse,
  LinkedInPostsResponse,
  TwitterTweetsResponse,
  TikTokVideosResponse,
  GoogleBusinessInsightsResponse,
  PinterestPinsResponse,
  YouTubePlaylistItemsResponse,
} from "../types/platform-apis";

interface SyncConfig {
  platform: Platform;
  accessToken: string;
  accountId: string;
  lastSyncAt?: string;
}

export class AnalyticsSync {
  private rateLimits = new Map<
    Platform,
    { remaining: number; resetAt: number }
  >();

  async performIncrementalSync(
    brandId: string,
    configs: SyncConfig[],
  ): Promise<void> {
    console.log(`Starting incremental sync for brand ${brandId}`);

    for (const config of configs) {
      const syncId = `sync-${Date.now()}-${config.platform}`;

      // Emit sync start event
      try {
        broadcastAnalyticsSyncStarted(brandId, {
          syncId,
          platform: config.platform,
        });
      } catch (error) {
        console.error("Error broadcasting sync started:", error);
      }

      await this.syncPlatform(brandId, config, "incremental", syncId);
    }
  }

  async performHistoricalBackfill(
    brandId: string,
    configs: SyncConfig[],
    days = 90,
  ): Promise<void> {
    console.log(
      `Starting ${days}-day historical backfill for brand ${brandId}`,
    );

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (const config of configs) {
      const syncId = `backfill-${Date.now()}-${config.platform}`;

      // Emit sync start event
      try {
        broadcastAnalyticsSyncStarted(brandId, {
          syncId,
          platform: config.platform,
        });
      } catch (error) {
        console.error("Error broadcasting sync started:", error);
      }

      await this.syncPlatformDateRange(
        brandId,
        config,
        startDate,
        endDate,
        syncId,
      );
    }
  }

  private async syncPlatform(
    brandId: string,
    config: SyncConfig,
    type: "incremental" | "full",
    syncId?: string,
  ): Promise<void> {
    const startTime = Date.now();
    try {
      // Validate required credentials
      if (!config.accessToken || config.accessToken.trim() === "") {
        throw new Error(`Missing access token for ${config.platform}`);
      }
      if (!config.accountId || config.accountId.trim() === "") {
        throw new Error(`Missing account ID for ${config.platform}`);
      }

      // Check rate limits
      if (this.isRateLimited(config.platform)) {
        console.log(`Rate limited for ${config.platform}, scheduling retry`);
        return;
      }

      const metrics = await this.fetchPlatformMetrics(config, type);
      const normalizedMetrics = this.normalizeMetrics(
        brandId,
        config.platform,
        metrics,
      );

      // Store in database
      await this.storeMetrics(normalizedMetrics);

      // Update rate limit info
      this.updateRateLimit(config.platform);

      const duration = Date.now() - startTime;

      console.log(
        `✅ Synced ${normalizedMetrics.length} metrics for ${config.platform}`,
      );

      // Emit sync completion event
      if (syncId) {
        try {
          broadcastAnalyticsSyncCompleted(brandId, {
            syncId,
            platform: config.platform,
            recordsProcessed: normalizedMetrics.length,
            duration,
          });
        } catch (error) {
          console.error("Error broadcasting sync completed:", error);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Sync failed for ${config.platform}: ${errorMsg}`);
      await this.logSyncError(brandId, config.platform, error);
    }
  }

  private async syncPlatformDateRange(
    brandId: string,
    config: SyncConfig,
    startDate: Date,
    endDate: Date,
    syncId?: string,
  ): Promise<void> {
    // Split large date ranges into smaller chunks to avoid timeouts
    const chunkSize = 7; // 7 days per chunk
    let currentDate = new Date(startDate);
    let totalRecords = 0;
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    while (currentDate < endDate) {
      const chunkEnd = new Date(currentDate);
      chunkEnd.setDate(chunkEnd.getDate() + chunkSize);

      if (chunkEnd > endDate) {
        chunkEnd.setTime(endDate.getTime());
      }

      const chunkRecords = await this.syncPlatformChunk(
        brandId,
        config,
        currentDate,
        chunkEnd,
        syncId,
        totalDays,
      );
      totalRecords += chunkRecords;

      currentDate = new Date(chunkEnd);
      currentDate.setDate(currentDate.getDate() + 1);

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Emit final completion event for historical backfill
    if (syncId) {
      try {
        broadcastAnalyticsSyncCompleted(brandId, {
          syncId,
          platform: config.platform,
          recordsProcessed: totalRecords,
          duration: 0, // Duration tracked at chunk level
        });
      } catch (error) {
        console.error("Error broadcasting backfill completed:", error);
      }
    }
  }

  private async syncPlatformChunk(
    brandId: string,
    config: SyncConfig,
    startDate: Date,
    endDate: Date,
    syncId?: string,
    totalDays?: number,
  ): Promise<number> {
    try {
      const metrics = await this.fetchPlatformMetricsDateRange(
        config,
        startDate,
        endDate,
      );
      const normalizedMetrics = this.normalizeMetrics(
        brandId,
        config.platform,
        metrics,
      );
      await this.storeMetrics(normalizedMetrics);

      // Emit progress update if we have a syncId
      if (syncId && totalDays) {
        try {
          const daysDone = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          const progress = Math.min(
            99,
            Math.floor((daysDone / totalDays) * 100),
          );

          broadcastAnalyticsSyncProgressUpdate(brandId, config.platform, {
            platform: config.platform,
            progress,
            recordsProcessed: normalizedMetrics.length,
            currentMetric: `Synced ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
          });
        } catch (error) {
          console.error("Error broadcasting chunk progress:", error);
        }
      }

      return normalizedMetrics.length;
    } catch (error) {
      console.error(`Chunk sync failed for ${config.platform}:`, error);
      return 0;
    }
  }

  private async fetchPlatformMetrics(
    config: SyncConfig,
    type: "incremental" | "full",
  ): Promise<unknown[]> {
    switch (config.platform) {
      case "instagram":
        return this.fetchInstagramMetrics(config, type);
      case "facebook":
        return this.fetchFacebookMetrics(config, type);
      case "linkedin":
        return this.fetchLinkedInMetrics(config, type);
      case "twitter":
        return this.fetchTwitterMetrics(config, type);
      case "tiktok":
        return this.fetchTikTokMetrics(config, type);
      case "google_business":
        return this.fetchGoogleBusinessMetrics(config, type);
      case "pinterest":
        return this.fetchPinterestMetrics(config, type);
      case "youtube":
        return this.fetchYouTubeMetrics(config, type);
      default:
        throw new Error(`Unsupported platform: ${config.platform}`);
    }
  }

  private async fetchPlatformMetricsDateRange(
    config: SyncConfig,
    startDate: Date,
    endDate: Date,
  ): Promise<unknown[]> {
    // Delegate to platform-specific handlers with date range support
    // Most platforms use incremental sync, so we create a temporary config with the date range
    const dateRangeConfig = {
      ...config,
      lastSyncAt: startDate.toISOString(),
    };

    switch (config.platform) {
      case "instagram":
        return this.fetchInstagramMetricsForDateRange(
          dateRangeConfig,
          startDate,
          endDate,
        );
      case "facebook":
        return this.fetchFacebookMetricsForDateRange(
          dateRangeConfig,
          startDate,
          endDate,
        );
      case "linkedin":
        return this.fetchLinkedInMetricsForDateRange(
          dateRangeConfig,
          startDate,
          endDate,
        );
      case "twitter":
        return this.fetchTwitterMetricsForDateRange(
          dateRangeConfig,
          startDate,
          endDate,
        );
      case "tiktok":
        return this.fetchTikTokMetricsForDateRange(
          dateRangeConfig,
          startDate,
          endDate,
        );
      case "google_business":
        return this.fetchGoogleBusinessMetricsForDateRange(
          dateRangeConfig,
          startDate,
          endDate,
        );
      case "pinterest":
        return this.fetchPinterestMetricsForDateRange(
          dateRangeConfig,
          startDate,
          endDate,
        );
      case "youtube":
        return this.fetchYouTubeMetricsForDateRange(
          dateRangeConfig,
          startDate,
          endDate,
        );
      default:
        throw new Error(`Unsupported platform: ${config.platform}`);
    }
  }

  // Date-range specific methods for each platform
  private async fetchInstagramMetricsForDateRange(
    config: SyncConfig,
    startDate: Date,
    endDate: Date,
  ): Promise<unknown[]> {
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    try {
      const postsResponse = await fetch(
        `https://graph.instagram.com/${config.accountId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,insights.metric(reach,impressions,engagement)&since=${startStr}&until=${endStr}&access_token=${config.accessToken}`,
      );

      if (!postsResponse.ok) {
        throw new Error(`Instagram API error: ${postsResponse.statusText}`);
      }

      const postsData: InstagramMediaResponse = await postsResponse.json();
      return postsData.data || [];
    } catch (error) {
      console.error("Instagram date-range fetch error:", error);
      return [];
    }
  }

  private async fetchFacebookMetricsForDateRange(
    config: SyncConfig,
    startDate: Date,
    endDate: Date,
  ): Promise<unknown[]> {
    const startUnix = Math.floor(startDate.getTime() / 1000);
    const endUnix = Math.floor(endDate.getTime() / 1000);

    try {
      const postsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${config.accountId}/posts?fields=id,created_time,type,story,permalink_url,insights.metric(engagement,impressions,reach)&since=${startUnix}&until=${endUnix}&access_token=${config.accessToken}`,
      );

      if (!postsResponse.ok) {
        throw new Error(`Facebook API error: ${postsResponse.statusText}`);
      }

      const postsData: FacebookPostsResponse = await postsResponse.json();
      return postsData.data || [];
    } catch (error) {
      console.error("Facebook date-range fetch error:", error);
      return [];
    }
  }

  private async fetchLinkedInMetricsForDateRange(
    config: SyncConfig,
    startDate: Date,
    endDate: Date,
  ): Promise<unknown[]> {
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    try {
      const postsResponse = await fetch(
        `https://api.linkedin.com/v2/organizationalActs?q=actors&actors=List(urn:li:organization:${config.accountId})&sortBy=CREATED_TIME_DESC&start=0&count=100`,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      );

      if (!postsResponse.ok) {
        throw new Error(`LinkedIn API error: ${postsResponse.statusText}`);
      }

      const postsData: LinkedInPostsResponse = await postsResponse.json();
      // Filter posts by date range
      return (postsData.elements || []).filter((post) => {
        const postTime = post.createdTime || 0;
        return postTime >= startMs && postTime <= endMs;
      });
    } catch (error) {
      console.error("LinkedIn date-range fetch error:", error);
      return [];
    }
  }

  private async fetchTwitterMetricsForDateRange(
    config: SyncConfig,
    startDate: Date,
    endDate: Date,
  ): Promise<unknown[]> {
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    try {
      const tweetsResponse = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=from:${config.accountId} -is:retweet&max_results=100&start_time=${startStr}&end_time=${endStr}&tweet.fields=created_at,public_metrics,author_id&expansions=author_id`,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
          },
        },
      );

      if (!tweetsResponse.ok) {
        throw new Error(`Twitter API error: ${tweetsResponse.statusText}`);
      }

      const tweetsData: TwitterTweetsResponse = await tweetsResponse.json();
      return tweetsData.data || [];
    } catch (error) {
      console.error("Twitter date-range fetch error:", error);
      return [];
    }
  }

  private async fetchTikTokMetricsForDateRange(
    config: SyncConfig,
    startDate: Date,
    endDate: Date,
  ): Promise<unknown[]> {
    try {
      const videosResponse = await fetch(
        "https://open.tiktokapis.com/v1/video/list/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filters: {
              creation_date_range: {
                start_date: Math.floor(startDate.getTime() / 1000),
                end_date: Math.floor(endDate.getTime() / 1000),
              },
            },
            fields: [
              "id",
              "create_time",
              "share_count",
              "view_count",
              "like_count",
              "comment_count",
              "download_count",
            ],
          }),
        },
      );

      if (!videosResponse.ok) {
        throw new Error(`TikTok API error: ${videosResponse.statusText}`);
      }

      const videosData: TikTokVideosResponse = await videosResponse.json();
      return videosData.data?.videos || [];
    } catch (error) {
      console.error("TikTok date-range fetch error:", error);
      return [];
    }
  }

  private async fetchGoogleBusinessMetricsForDateRange(
    config: SyncConfig,
    startDate: Date,
    endDate: Date,
  ): Promise<unknown[]> {
    try {
      const insightsResponse = await fetch(
        `https://mybusiness.googleapis.com/v1/accounts/*/locations/${config.accountId}/insights:reportInsights?pageSize=100`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locationNames: [`locations/${config.accountId}`],
            basicRequest: {
              timeRange: {
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
              },
              metricRequests: [
                { metric: "QUERY_DIRECT", options: ["ALL"] },
                { metric: "VIEWS_MAPS", options: ["ALL"] },
                { metric: "VIEWS_SEARCH", options: ["ALL"] },
                { metric: "ACTIONS_PHONE", options: ["ALL"] },
              ],
            },
          }),
        },
      );

      if (!insightsResponse.ok) {
        throw new Error(
          `Google Business API error: ${insightsResponse.statusText}`,
        );
      }

      const insightsData: GoogleBusinessInsightsResponse = await insightsResponse.json();
      return insightsData.locationInsights || [];
    } catch (error) {
      console.error("Google Business date-range fetch error:", error);
      return [];
    }
  }

  private async fetchPinterestMetricsForDateRange(
    config: SyncConfig,
    startDate: Date,
    endDate: Date,
  ): Promise<unknown[]> {
    try {
      const pinsResponse = await fetch(
        `https://api.pinterest.com/v1/user/${config.accountId}/pins?access_token=${config.accessToken}&fields=id,created_at,note,stats`,
      );

      if (!pinsResponse.ok) {
        throw new Error(`Pinterest API error: ${pinsResponse.statusText}`);
      }

      const pinsData: PinterestPinsResponse = await pinsResponse.json();
      // Filter by date range
      return (pinsData.data || []).filter((pin) => {
        const pinTime = new Date(pin.created_at).getTime();
        return pinTime >= startDate.getTime() && pinTime <= endDate.getTime();
      });
    } catch (error) {
      console.error("Pinterest date-range fetch error:", error);
      return [];
    }
  }

  private async fetchYouTubeMetricsForDateRange(
    config: SyncConfig,
    startDate: Date,
    endDate: Date,
  ): Promise<unknown[]> {
    try {
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=50&publishedAfter=${startDate.toISOString()}&publishedBefore=${endDate.toISOString()}&access_token=${config.accessToken}`,
      );

      if (!videosResponse.ok) {
        throw new Error(`YouTube API error: ${videosResponse.statusText}`);
      }

      const videosData: YouTubePlaylistItemsResponse = await videosResponse.json();
      return videosData.items || [];
    } catch (error) {
      console.error("YouTube date-range fetch error:", error);
      return [];
    }
  }

  // Platform-specific implementations
  private async fetchInstagramMetrics(
    config: SyncConfig,
    type: string,
  ): Promise<unknown[]> {
    const sinceDate =
      type === "incremental" && config.lastSyncAt
        ? config.lastSyncAt
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    try {
      // Fetch posts
      const postsResponse = await fetch(
        `https://graph.instagram.com/${config.accountId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,insights.metric(reach,impressions,engagement)&since=${sinceDate}&access_token=${config.accessToken}`,
      );

      if (!postsResponse.ok) {
        throw new Error(`Instagram API error: ${postsResponse.statusText}`);
      }

      const postsData: InstagramMediaResponse = await postsResponse.json();

      // Fetch account insights
      const accountResponse = await fetch(
        `https://graph.instagram.com/${config.accountId}/insights?metric=reach,impressions,profile_views&period=day&since=${sinceDate}&access_token=${config.accessToken}`,
      );

      const accountData: InstagramAccountInsightsResponse = accountResponse.ok
        ? await accountResponse.json()
        : { data: [] };

      return [...(postsData.data || []), ...(accountData.data || [])];
    } catch (error) {
      console.error("Instagram fetch error:", error);
      return [];
    }
  }

  private async fetchFacebookMetrics(
    config: SyncConfig,
    type: string,
  ): Promise<unknown[]> {
    const sinceDate =
      type === "incremental" && config.lastSyncAt
        ? Math.floor(new Date(config.lastSyncAt).getTime() / 1000)
        : Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);

    try {
      // Fetch posts with insights
      const postsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${config.accountId}/posts?fields=id,created_time,type,story,permalink_url,insights.metric(engagement,impressions,reach)&since=${sinceDate}&access_token=${config.accessToken}`,
      );

      if (!postsResponse.ok) {
        throw new Error(`Facebook API error: ${postsResponse.statusText}`);
      }

      const postsData: FacebookPostsResponse = await postsResponse.json();

      // Fetch page insights
      const pageInsightsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${config.accountId}/insights?metric=page_views,page_engaged_users,page_fans&period=day&since=${sinceDate}&access_token=${config.accessToken}`,
      );

      const pageInsightsData: FacebookPostsResponse = pageInsightsResponse.ok
        ? await pageInsightsResponse.json()
        : { data: [] };

      return [...(postsData.data || []), ...(pageInsightsData.data || [])];
    } catch (error) {
      console.error("Facebook fetch error:", error);
      return [];
    }
  }

  private async fetchLinkedInMetrics(
    config: SyncConfig,
    type: string,
  ): Promise<unknown[]> {
    const sinceDate =
      type === "incremental" && config.lastSyncAt
        ? new Date(config.lastSyncAt).toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    try {
      // Fetch organization posts
      const postsResponse = await fetch(
        `https://api.linkedin.com/v2/organizationalActs?q=actors&actors=List(urn:li:organization:${config.accountId})&sortBy=CREATED_TIME_DESC&start=0&count=100`,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      );

      if (!postsResponse.ok) {
        throw new Error(`LinkedIn API error: ${postsResponse.statusText}`);
      }

      const postsData: LinkedInPostsResponse = await postsResponse.json();

      // Fetch organization insights
      const insightsResponse = await fetch(
        `https://api.linkedin.com/v2/organizationalPageStatistics?q=organizationalPageId&organizationalPageId=urn:li:organization:${config.accountId}&timeIntervals.timeGranularity=DAY&timeIntervals.timeRange.start=${Math.floor(new Date(sinceDate).getTime())}`,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      );

      const insightsData: LinkedInPostsResponse = insightsResponse.ok
        ? await insightsResponse.json()
        : { elements: [] };

      return [...(postsData.elements || []), ...(insightsData.elements || [])];
    } catch (error) {
      console.error("LinkedIn fetch error:", error);
      return [];
    }
  }

  private async fetchTwitterMetrics(
    config: SyncConfig,
    type: string,
  ): Promise<unknown[]> {
    const sinceDate =
      type === "incremental" && config.lastSyncAt
        ? new Date(config.lastSyncAt).toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    try {
      // Fetch recent tweets with metrics
      const tweetsResponse = await fetch(
        `https://api.twitter.com/2/tweets/search/recent?query=from:${config.accountId} -is:retweet&max_results=100&start_time=${sinceDate}&tweet.fields=created_at,public_metrics,author_id&expansions=author_id`,
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
          },
        },
      );

      if (!tweetsResponse.ok) {
        throw new Error(`Twitter API error: ${tweetsResponse.statusText}`);
      }

      const tweetsData: TwitterTweetsResponse = await tweetsResponse.json();
      return tweetsData.data || [];
    } catch (error) {
      console.error("Twitter fetch error:", error);
      return [];
    }
  }

  private async fetchTikTokMetrics(
    config: SyncConfig,
    _type: string,
  ): Promise<unknown[]> {
    try {
      // Fetch video statistics
      const videosResponse = await fetch(
        "https://open.tiktokapis.com/v1/video/list/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: [
              "id",
              "create_time",
              "share_count",
              "view_count",
              "like_count",
              "comment_count",
              "download_count",
            ],
          }),
        },
      );

      if (!videosResponse.ok) {
        throw new Error(`TikTok API error: ${videosResponse.statusText}`);
      }

      const videosData: TikTokVideosResponse = await videosResponse.json();
      return videosData.data?.videos || [];
    } catch (error) {
      console.error("TikTok fetch error:", error);
      return [];
    }
  }

  private async fetchGoogleBusinessMetrics(
    config: SyncConfig,
    _type: string,
  ): Promise<unknown[]> {
    try {
      // Fetch location insights
      const insightsResponse = await fetch(
        `https://mybusiness.googleapis.com/v1/accounts/*/locations/${config.accountId}/insights:reportInsights?pageSize=100`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locationNames: [`locations/${config.accountId}`],
            basicRequest: {
              metricRequests: [
                {
                  metric: "QUERY_DIRECT",
                  options: ["ALL"],
                },
                {
                  metric: "VIEWS_MAPS",
                  options: ["ALL"],
                },
                {
                  metric: "VIEWS_SEARCH",
                  options: ["ALL"],
                },
                {
                  metric: "ACTIONS_PHONE",
                  options: ["ALL"],
                },
              ],
            },
          }),
        },
      );

      if (!insightsResponse.ok) {
        throw new Error(
          `Google Business API error: ${insightsResponse.statusText}`,
        );
      }

      const insightsData: GoogleBusinessInsightsResponse = await insightsResponse.json();
      return insightsData.locationInsights || [];
    } catch (error) {
      console.error("Google Business fetch error:", error);
      return [];
    }
  }

  private async fetchPinterestMetrics(
    config: SyncConfig,
    _type: string,
  ): Promise<unknown[]> {
    try {
      // Fetch pin analytics
      const pinsResponse = await fetch(
        `https://api.pinterest.com/v1/user/${config.accountId}/pins?access_token=${config.accessToken}&fields=id,created_at,note,stats`,
      );

      if (!pinsResponse.ok) {
        throw new Error(`Pinterest API error: ${pinsResponse.statusText}`);
      }

      const pinsData: PinterestPinsResponse = await pinsResponse.json();
      return pinsData.data || [];
    } catch (error) {
      console.error("Pinterest fetch error:", error);
      return [];
    }
  }

  private async fetchYouTubeMetrics(
    config: SyncConfig,
    _type: string,
  ): Promise<unknown[]> {
    try {
      // Fetch channel and video statistics
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=50&access_token=${config.accessToken}`,
      );

      if (!videosResponse.ok) {
        throw new Error(`YouTube API error: ${videosResponse.statusText}`);
      }

      const videosData: YouTubePlaylistItemsResponse = await videosResponse.json();

      // Fetch analytics report
      const analyticsResponse = await fetch(
        `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel=${config.accountId}&start-date=2024-01-01&end-date=2024-12-31&metrics=views,estimatedMinutesWatched,likes,comments,shares&access_token=${config.accessToken}`,
      );

      const analyticsData: YouTubePlaylistItemsResponse = analyticsResponse.ok
        ? await analyticsResponse.json()
        : { items: [] };

      return [...(videosData.items || []), ...(analyticsData.items || [])];
    } catch (error) {
      console.error("YouTube fetch error:", error);
      return [];
    }
  }

  private normalizeMetrics(
    brandId: string,
    platform: Platform,
    rawData: unknown[],
  ): AnalyticsMetric[] {
    return rawData.map((item, index) => {
      const itemAny = item as any;
      return {
        id: `${platform}_${brandId}_${Date.now()}_${index}`,
        brandId,
        platform,
        postId: itemAny.id || undefined,
        date:
          itemAny.timestamp?.split("T")[0] || new Date().toISOString().split("T")[0],
        metrics: this.extractMetrics(platform, item),
        metadata: this.extractMetadata(platform, item),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  private extractMetrics(
    platform: Platform,
    item: unknown,
  ): AnalyticsMetric["metrics"] {
    const itemAny = item as any;
    const base = {
      reach: 0,
      impressions: 0,
      engagement: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      followers: 0,
      followerGrowth: 0,
      ctr: 0,
      engagementRate: 0,
    };

    switch (platform) {
      case "instagram":
        return {
          ...base,
          reach:
            itemAny.insights?.data?.find((i: unknown) => (i as any).name === "reach")
              ?.values?.[0]?.value || 0,
          impressions:
            itemAny.insights?.data?.find((i: unknown) => (i as any).name === "impressions")
              ?.values?.[0]?.value || 0,
          engagement:
            itemAny.insights?.data?.find((i: unknown) => (i as any).name === "engagement")
              ?.values?.[0]?.value || 0,
          likes: itemAny.like_count || 0,
          comments: itemAny.comments_count || 0,
          engagementRate:
            itemAny.like_count && itemAny.insights
              ? ((itemAny.like_count + itemAny.comments_count) /
                  (itemAny.insights.data.find((i: unknown) => (i as any).name === "reach")
                    ?.values?.[0]?.value || 1)) *
                100
              : 0,
        };
      // Add other platforms...
      default:
        return base;
    }
  }

  private extractMetadata(
    platform: Platform,
    item: unknown,
  ): AnalyticsMetric["metadata"] {
    const it = (item || {}) as any;
    return {
      postType: this.mapPostType(platform, it.media_type || it.type),
      hashtags: this.extractHashtags(it.caption || it.text || ""),
      contentCategory: "general",
    };
  }

  private mapPostType(
    platform: Platform,
    type: string,
  ): AnalyticsMetric["metadata"]["postType"] {
    const mappings: Record<
      Platform,
      Record<string, AnalyticsMetric["metadata"]["postType"]>
    > = {
      instagram: {
        IMAGE: "image",
        VIDEO: "video",
        CAROUSEL_ALBUM: "carousel",
      },
      // Add other platforms...
      facebook: {},
      linkedin: {},
      twitter: {},
      tiktok: {},
      google_business: {},
      pinterest: {},
      youtube: {},
    };

    return mappings[platform]?.[type] || "image";
  }

  private extractHashtags(text: string): string[] {
    return text.match(/#\w+/g) || [];
  }

  private async storeMetrics(metrics: AnalyticsMetric[]): Promise<void> {
    if (metrics.length === 0) return;

    try {
      // Import supabase for database operations
      const { supabase } = await import("./supabase");

      // Scrub PII from metrics before storing
      const scrubbedMetrics = metrics.map((metric) => ({
        ...metric,
        metadata: this.scrubbePII(metric.metadata),
      }));

      // Batch insert in chunks to avoid oversized requests
      const chunkSize = 100;
      for (let i = 0; i < scrubbedMetrics.length; i += chunkSize) {
        const chunk = scrubbedMetrics.slice(i, i + chunkSize);

        const { error: dbError } = await supabase
          .from("analytics_metrics")
          .upsert(
            chunk.map((metric) => ({
              brand_id: metric.brandId,
              tenant_id: metric.brandId, // Assuming tenant_id = brand_id for now
              platform: metric.platform,
              post_id: metric.postId,
              date: metric.date,
              metrics: metric.metrics,
              metadata: metric.metadata,
            })),
            { onConflict: "brand_id,platform,post_id,date" },
          );

        if (dbError) {
          throw new Error(`Failed to store metrics: ${dbError.message}`);
        }
      }

      console.log(`✅ Stored ${metrics.length} metrics to database`);
    } catch (error) {
      console.error("Error storing metrics:", error);
      throw error;
    }
  }

  private async logSyncError(
    brandId: string,
    platform: Platform,
    error: unknown,
  ): Promise<void> {
    try {
      const { supabase } = await import("./supabase");

      // Safely extract error information
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorCode = (error as any)?.code || undefined;

      const { error: dbError } = await supabase
        .from("analytics_sync_logs")
        .insert({
          brand_id: brandId,
          tenant_id: brandId,
          platform,
          sync_type: "incremental",
          status: "failed",
          items_synced: 0,
          items_failed: 1,
          error_message: errorMessage,
          error_details: {
            stack: errorStack,
            code: errorCode,
            timestamp: new Date().toISOString(),
            platform,
            brandId,
          },
        });

      if (dbError) {
        console.error(`❌ Failed to log sync error for ${platform}:`, dbError);
      } else {
        console.log(
          `📋 Sync error logged for ${brandId}/${platform}: ${errorMessage}`,
        );
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Error logging sync error: ${errMsg}`);
    }
  }

  /**
   * Scrub PII from metadata before storing in database
   * Removes email addresses, phone numbers, usernames, and other sensitive data
   */
  private scrubbePII(metadata: unknown): unknown {
    if (!metadata) return metadata;

    const scrubbedData = { ...(metadata as any || {}) } as any;

    // Patterns for common PII
    const patterns = {
      email: /[\w.-]+@[\w.-]+\.\w+/g,
      phone: /(\+?1?\d{9,15})/g,
      ssn: /\d{3}-\d{2}-\d{4}/g,
      username: /@\w+/g,
      url: /(https?:\/\/[^\s]+)/g,
    };

    // Scrub text fields
    if (scrubbedData.hashtags && Array.isArray(scrubbedData.hashtags)) {
      scrubbedData.hashtags = scrubbedData.hashtags.map((tag: string) => {
        // Remove @mentions that could be usernames
        return tag.replace(patterns.username, "[redacted]");
      });
    }

    // Scrub caption/text if present
    if (scrubbedData.caption) {
      scrubbedData.caption = scrubbedData.caption
        .replace(patterns.email, "[email]")
        .replace(patterns.phone, "[phone]")
        .replace(patterns.ssn, "[ssn]")
        .replace(patterns.username, "[username]");
    }

    // Mark that PII has been processed
    scrubbedData.pii_scrubbed = true;
    scrubbedData.scrubbed_at = new Date().toISOString();

    return scrubbedData;
  }

  private isRateLimited(platform: Platform): boolean {
    const limit = this.rateLimits.get(platform);
    if (!limit) return false;

    return limit.remaining <= 0 && Date.now() < limit.resetAt;
  }

  private updateRateLimit(platform: Platform): void {
    // Update based on API response headers
    // This is a simplified implementation
    this.rateLimits.set(platform, {
      remaining: 100,
      resetAt: Date.now() + 60 * 60 * 1000, // 1 hour
    });
  }
}

export const analyticsSync = new AnalyticsSync();
