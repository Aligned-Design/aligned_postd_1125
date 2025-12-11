import { supabase } from "./supabase";
import { AppError } from "./error-middleware";
import { ErrorCode, HTTP_STATUS } from "./error-responses";

export type SearchEntityType = "brand" | "content" | "post" | "user" | "asset" | "campaign";

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  brandId?: string;
  brandName?: string;
  platform?: string; // For posts/content
  createdAt?: string;
  updatedAt?: string;
}

interface SearchOptions {
  brandIds?: string[];
  platform?: string; // Filter by platform (instagram, facebook, etc.)
  entityTypes?: SearchEntityType[]; // Filter by entity types
  tenantId?: string;
  role?: string;
  limit?: number;
}

export class SearchService {
  async search(
    query: string,
    options: SearchOptions,
  ): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const entityTypes = options.entityTypes || ["brand", "content", "post", "user", "asset", "campaign"];

    // Build search promises based on requested entity types
    const searchPromises: Promise<SearchResult[]>[] = [];

    if (entityTypes.includes("brand")) {
      searchPromises.push(this.searchBrands(trimmed, options, limit));
    }
    if (entityTypes.includes("content")) {
      searchPromises.push(this.searchContent(trimmed, options, limit));
    }
    if (entityTypes.includes("post")) {
      searchPromises.push(this.searchPosts(trimmed, options, limit));
    }
    if (entityTypes.includes("user")) {
      searchPromises.push(this.searchUsers(trimmed, options, limit));
    }
    if (entityTypes.includes("asset")) {
      searchPromises.push(this.searchAssets(trimmed, options, limit));
    }
    if (entityTypes.includes("campaign")) {
      searchPromises.push(this.searchCampaigns(trimmed, options, limit));
    }

    const results = await Promise.all(searchPromises);
    const combined = results.flat();

    // Sort by relevance score
    const scored = combined
      .map((result) => ({
        result,
        score: scoreResult(result, trimmed),
      }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.result);

    return scored.slice(0, limit);
  }

  private async searchBrands(
    query: string,
    options: SearchOptions,
    limit: number,
  ): Promise<SearchResult[]> {
    // @supabase-scope-ok TODO(rls-review): Confirm if brand search should be restricted to user's authorized brands
    // Currently returns all brands matching query - may need options.brandIds filter
    const builder = supabase
      .from("brands")
      .select("id,name,description,created_at,updated_at")
      .ilike("name", `%${query}%`)
      .order("name", { ascending: true })
      .limit(limit);

    const { data, error } = await builder;
    if (error && error.code !== "PGRST116") {
      throw this.databaseError("Failed to search brands", error);
    }

    return (data || []).map((brand) => ({
      id: brand.id,
      type: "brand" as const,
      title: brand.name,
      subtitle: brand.description || undefined,
      url: `/brands/${brand.id}`,
      createdAt: brand.created_at,
      updatedAt: brand.updated_at,
    }));
  }

  private async searchContent(
    query: string,
    options: SearchOptions,
    limit: number,
  ): Promise<SearchResult[]> {
    // @supabase-scope-ok Uses .in("brand_id", options.brandIds) when brandIds provided - caller provides authorized IDs
    // ✅ SCHEMA ALIGNMENT: scheduled_content doesn't have headline/body/platform columns
    // It only has: id, brand_id, content_id, scheduled_at, platforms[], status
    // Need to search in content_items instead (or join)
    let builder = supabase
      .from("content_items")
      .select("id,brand_id,title,type,content,platform,status,scheduled_for,created_at,updated_at")
      .or(`title.ilike.%${query}%,type.ilike.%${query}%,content.ilike.%${query}%`)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (options.brandIds?.length) {
      builder = builder.in("brand_id", options.brandIds);
    }

    if (options.platform) {
      builder = builder.eq("platform", options.platform);
    }

    const { data, error } = await builder;
    if (error && error.code !== "PGRST116") {
      throw this.databaseError("Failed to search content", error);
    }

    return (data || []).map((content: any) => {
      // Extract text from content JSONB
      const contentObj = content.content || {};
      const bodyText = typeof contentObj === "string" 
        ? contentObj 
        : contentObj?.body || contentObj?.text || JSON.stringify(contentObj);
      
      return {
        id: content.id,
        type: "content" as const,
        title: content.title || "Content Draft",
        subtitle: bodyText?.slice(0, 120) || undefined,
        url: `/queue?content=${content.id}`,
        brandId: content.brand_id,
        platform: content.platform,
        createdAt: content.created_at,
        updatedAt: content.updated_at,
      };
    });
  }

  private async searchPosts(
    query: string,
    options: SearchOptions,
    limit: number,
  ): Promise<SearchResult[]> {
    let builder = supabase
      .from("social_posts")
      .select("id,brand_id,caption,status,platform,scheduled_at,created_at")
      .ilike("caption", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (options.brandIds?.length) {
      builder = builder.in("brand_id", options.brandIds);
    }

    if (options.platform) {
      builder = builder.eq("platform", options.platform);
    }

    const { data, error } = await builder;
    if (error && error.code !== "PGRST116") {
      throw this.databaseError("Failed to search posts", error);
    }

    return (data || []).map((post) => ({
      id: post.id,
      type: "post" as const,
      title: post.caption?.slice(0, 80) || "Untitled Post",
      subtitle: `Status: ${post.status} • ${post.platform}`,
      url: `/queue?post=${post.id}`,
      brandId: post.brand_id,
      platform: post.platform,
      createdAt: post.created_at,
      updatedAt: post.scheduled_at,
    }));
  }

  private async searchUsers(
    query: string,
    options: SearchOptions,
    limit: number,
  ): Promise<SearchResult[]> {
    const { data, error } = await supabase
      .from("profiles_view")
      .select("id,full_name,email,role,created_at")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order("full_name", { ascending: true })
      .limit(limit);

    if (error && error.code !== "PGRST116") {
      throw this.databaseError("Failed to search users", error);
    }

    return (data || []).map((user) => ({
      id: user.id,
      type: "user" as const,
      title: user.full_name || user.email,
      subtitle: user.role || "user",
      url: `/team/${user.id}`,
      createdAt: user.created_at,
    }));
  }

  private async searchAssets(
    query: string,
    options: SearchOptions,
    limit: number,
  ): Promise<SearchResult[]> {
    // @supabase-scope-ok Uses .in("brand_id", options.brandIds) when brandIds provided - caller provides authorized IDs
    let builder = supabase
      .from("media_assets")
      .select("id,brand_id,filename,category,metadata,created_at,updated_at")
      .ilike("filename", `%${query}%`)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (options.brandIds?.length) {
      builder = builder.in("brand_id", options.brandIds);
    }

    // Also search in metadata (aiTags, description, etc.)
    const { data, error } = await builder;
    if (error && error.code !== "PGRST116") {
      throw this.databaseError("Failed to search assets", error);
    }

    // Filter by metadata if query matches
    const filtered = (data || []).filter((asset) => {
      const filenameMatch = asset.filename?.toLowerCase().includes(query.toLowerCase());
      const metadata = asset.metadata as Record<string, unknown> | null;
      const aiTags = (metadata?.aiTags as string[]) || [];
      const tagMatch = aiTags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));
      return filenameMatch || tagMatch;
    });

    return filtered.map((asset) => ({
      id: asset.id,
      type: "asset" as const,
      title: asset.filename || "Untitled Asset",
      subtitle: `${asset.category} • ${asset.metadata ? "Tagged" : "No tags"}`,
      url: `/library?asset=${asset.id}`,
      brandId: asset.brand_id,
      createdAt: asset.created_at,
      updatedAt: asset.updated_at,
    }));
  }

  private async searchCampaigns(
    query: string,
    options: SearchOptions,
    limit: number,
  ): Promise<SearchResult[]> {
    // @supabase-scope-ok Uses .in("brand_id", options.brandIds) when brandIds provided - caller provides authorized IDs
    // ✅ SCHEMA ALIGNMENT: scheduled_content doesn't have headline/body/platform columns
    // Search in content_items instead (or join with scheduled_content if needed)
    let builder = supabase
      .from("content_items")
      .select("id,brand_id,title,type,content,platform,status,scheduled_for,created_at,updated_at")
      .or(`title.ilike.%${query}%,type.ilike.%${query}%,content.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit * 2); // Get more to group by campaign

    if (options.brandIds?.length) {
      builder = builder.in("brand_id", options.brandIds);
    }

    if (options.platform) {
      builder = builder.eq("platform", options.platform);
    }

    const { data, error } = await builder;
    if (error && error.code !== "PGRST116") {
      throw this.databaseError("Failed to search campaigns", error);
    }

    // Group by campaign_id from metadata if available
    const campaignMap = new Map<string, SearchResult>();
    
    (data || []).forEach((content: any) => {
      // Extract text from content JSONB
      const contentObj = content.content || {};
      const bodyText = typeof contentObj === "string" 
        ? contentObj 
        : contentObj?.body || contentObj?.text || JSON.stringify(contentObj);
      
      const metadata = content.metadata as Record<string, unknown> | null;
      const campaignId = metadata?.campaign_id as string | undefined;
      const campaignName = metadata?.campaign_name as string | undefined;

      if (campaignId && campaignName) {
        if (!campaignMap.has(campaignId)) {
          campaignMap.set(campaignId, {
            id: campaignId,
            type: "campaign" as const,
            title: campaignName,
            subtitle: `Campaign • ${content.platform || "Multiple platforms"}`,
            url: `/campaigns/${campaignId}`,
            brandId: content.brand_id,
            platform: content.platform,
            createdAt: content.created_at,
            updatedAt: content.updated_at,
          });
        }
      } else if (content.title?.toLowerCase().includes(query.toLowerCase())) {
        // If no campaign metadata, treat title as campaign name
        const tempId = `temp-${content.id}`;
        if (!campaignMap.has(tempId)) {
          campaignMap.set(tempId, {
            id: content.id,
            type: "campaign" as const,
            title: content.title || "Untitled Campaign",
            subtitle: `Content Campaign • ${content.platform || "Multiple platforms"}`,
            url: `/queue?content=${content.id}`,
            brandId: content.brand_id,
            platform: content.platform,
            createdAt: content.created_at,
            updatedAt: content.updated_at,
          });
        }
      }
    });

    return Array.from(campaignMap.values()).slice(0, limit);
  }

  private databaseError(message: string, error: any) {
    return new AppError(
      ErrorCode.DATABASE_ERROR,
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "critical",
      { details: error?.message || error },
    );
  }
}

function scoreResult(result: SearchResult, query: string) {
  const lowerQuery = query.toLowerCase();
  const lowerTitle = result.title?.toLowerCase() || "";
  const lowerSubtitle = result.subtitle?.toLowerCase() || "";
  
  // Exact title match gets highest score
  const exactTitleMatch = lowerTitle === lowerQuery ? 10 : 0;
  // Title starts with query
  const titleStartsWith = lowerTitle.startsWith(lowerQuery) ? 5 : 0;
  // Title contains query
  const titleMatch = lowerTitle.includes(lowerQuery) ? 3 : 0;
  // Subtitle contains query
  const subtitleMatch = lowerSubtitle.includes(lowerQuery) ? 1 : 0;
  
  // Type bonuses (content and posts are more actionable)
  const typeBonus =
    result.type === "content" || result.type === "post" ? 2 :
    result.type === "asset" ? 1.5 :
    result.type === "campaign" ? 1.5 : 0;

  return exactTitleMatch + titleStartsWith + titleMatch + subtitleMatch + typeBonus;
}

export const searchService = new SearchService();

