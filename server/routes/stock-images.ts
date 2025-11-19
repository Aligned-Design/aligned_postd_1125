/**
 * Stock Image API Routes
 * Proxies requests to Pexels API and Pixabay API
 */

import { RequestHandler, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../lib/error-middleware";
import { ErrorCode, HTTP_STATUS } from "../lib/error-responses";
import { requireScope } from "../middleware/requireScope";

// Pexels API types
interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

// Pixabay API types
interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL?: string;
  fullHDURL?: string;
  imageURL?: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL?: string;
}

interface PixabaySearchResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

// Request validation schema
const stockImageSearchSchema = z.object({
  query: z.string().min(1).max(200),
  page: z.number().int().positive().optional().default(1),
  perPage: z.number().int().positive().max(200).optional().default(20), // Pixabay allows up to 200
  orientation: z.enum(["landscape", "portrait", "square"]).optional(),
  provider: z.enum(["pexels", "unsplash", "pixabay"]).optional().default("pexels"),
});

/**
 * Search stock images via Pexels API
 * GET /api/media/stock-images/search
 */
export const searchStockImages: RequestHandler = async (req, res, next) => {
  try {
    const queryParams = stockImageSearchSchema.parse({
      query: req.query.query || "nature",
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      perPage: req.query.perPage ? parseInt(req.query.perPage as string) : 20,
      orientation: req.query.orientation,
      provider: req.query.provider || "pexels",
    });

    // Only Pexels is implemented for now
    if (queryParams.provider !== "pexels") {
      throw new AppError(
        ErrorCode.NOT_IMPLEMENTED,
        `Provider "${queryParams.provider}" is not yet implemented. Only "pexels" is available.`,
        HTTP_STATUS.NOT_IMPLEMENTED,
        "info",
      );
    }

    let images: any[] = [];
    let total = 0;
    let hasMore = false;

    if (queryParams.provider === "pexels") {
      // Get Pexels API key from environment
      const pexelsApiKey = process.env.PEXELS_API_KEY;
      if (!pexelsApiKey) {
        throw new AppError(
          ErrorCode.CONFIGURATION_ERROR,
          "Pexels API key not configured. Please set PEXELS_API_KEY environment variable.",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
        );
      }

      // Build Pexels API URL
      const pexelsUrl = new URL("https://api.pexels.com/v1/search");
      pexelsUrl.searchParams.set("query", queryParams.query);
      pexelsUrl.searchParams.set("page", queryParams.page.toString());
      pexelsUrl.searchParams.set("per_page", Math.min(queryParams.perPage, 80).toString());
      
      // Map orientation to Pexels format
      if (queryParams.orientation) {
        if (queryParams.orientation === "landscape") {
          pexelsUrl.searchParams.set("orientation", "landscape");
        } else if (queryParams.orientation === "portrait") {
          pexelsUrl.searchParams.set("orientation", "portrait");
        } else if (queryParams.orientation === "square") {
          pexelsUrl.searchParams.set("orientation", "square");
        }
      }

      // Call Pexels API
      const pexelsResponse = await fetch(pexelsUrl.toString(), {
        method: "GET",
        headers: {
          Authorization: pexelsApiKey,
          "User-Agent": "Postd/1.0",
        },
      });

      if (!pexelsResponse.ok) {
        const errorText = await pexelsResponse.text();
        console.error("[Stock Images] Pexels API error:", pexelsResponse.status, errorText);
        
        if (pexelsResponse.status === 401) {
          throw new AppError(
            ErrorCode.UNAUTHORIZED,
            "Invalid Pexels API key",
            HTTP_STATUS.UNAUTHORIZED,
            "error",
          );
        } else if (pexelsResponse.status === 429) {
          throw new AppError(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            "Rate limit exceeded. Please try again later.",
            HTTP_STATUS.TOO_MANY_REQUESTS,
            "warning",
          );
        } else {
          throw new AppError(
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            `Pexels API error: ${pexelsResponse.statusText}`,
            HTTP_STATUS.BAD_GATEWAY,
            "error",
          );
        }
      }

      const pexelsData: PexelsSearchResponse = await pexelsResponse.json();

      // Transform Pexels response to our StockImage format
      images = pexelsData.photos.map((photo): any => {
        // Determine orientation from dimensions
        let orientation: "landscape" | "portrait" | "square" = "landscape";
        if (photo.height > photo.width) {
          orientation = "portrait";
        } else if (Math.abs(photo.width - photo.height) < 100) {
          orientation = "square";
        }

        return {
          id: `pexels-${photo.id}`,
          provider: "pexels" as const,
          title: photo.alt || `Photo by ${photo.photographer}`,
          description: photo.alt || undefined,
          originalUrl: photo.url,
          previewUrl: photo.src.medium, // Medium size for preview
          fullImageUrl: photo.src.large2x || photo.src.large, // High-res for download
          width: photo.width,
          height: photo.height,
          creatorName: photo.photographer,
          creatorUrl: photo.photographer_url,
          creatorAvatar: undefined, // Pexels doesn't provide avatars
          licensType: "free" as const,
          licenseText: "Pexels License - Free to use, no attribution required",
          attributionRequired: false, // Pexels doesn't require attribution
          attributionText: `Photo by ${photo.photographer} from Pexels`,
          tags: photo.alt ? [photo.alt.toLowerCase()] : [],
          colors: photo.avg_color ? [photo.avg_color] : [],
          category: undefined,
          // ✅ SOURCE FIELD: Mark as stock
          source: "stock" as const,
        };
      });

      // Calculate hasMore
      const totalPages = Math.ceil(pexelsData.total_results / queryParams.perPage);
      hasMore = queryParams.page < totalPages;
      total = pexelsData.total_results;
    } else if (queryParams.provider === "pixabay") {
      // Get Pixabay API key from environment
      const pixabayApiKey = process.env.PIXABAY_API_KEY;
      if (!pixabayApiKey) {
        throw new AppError(
          ErrorCode.CONFIGURATION_ERROR,
          "Pixabay API key not configured. Please set PIXABAY_API_KEY environment variable.",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
        );
      }

      // Build Pixabay API URL
      const pixabayUrl = new URL("https://pixabay.com/api/");
      pixabayUrl.searchParams.set("key", pixabayApiKey);
      pixabayUrl.searchParams.set("q", queryParams.query);
      pixabayUrl.searchParams.set("page", queryParams.page.toString());
      pixabayUrl.searchParams.set("per_page", Math.min(queryParams.perPage, 200).toString());
      pixabayUrl.searchParams.set("image_type", "photo"); // Only photos for now
      pixabayUrl.searchParams.set("safesearch", "true");
      
      // Map orientation to Pixabay format
      if (queryParams.orientation) {
        if (queryParams.orientation === "landscape") {
          pixabayUrl.searchParams.set("orientation", "horizontal");
        } else if (queryParams.orientation === "portrait") {
          pixabayUrl.searchParams.set("orientation", "vertical");
        }
        // Pixabay doesn't have a "square" option, so we'll filter client-side if needed
      }

      // Call Pixabay API
      const pixabayResponse = await fetch(pixabayUrl.toString(), {
        method: "GET",
        headers: {
          "User-Agent": "Postd/1.0",
        },
      });

      if (!pixabayResponse.ok) {
        const errorText = await pixabayResponse.text();
        console.error("[Stock Images] Pixabay API error:", pixabayResponse.status, errorText);
        
        if (pixabayResponse.status === 401 || pixabayResponse.status === 400) {
          throw new AppError(
            ErrorCode.UNAUTHORIZED,
            "Invalid Pixabay API key or request",
            HTTP_STATUS.UNAUTHORIZED,
            "error",
          );
        } else if (pixabayResponse.status === 429) {
          throw new AppError(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            "Rate limit exceeded. Please try again later.",
            HTTP_STATUS.TOO_MANY_REQUESTS,
            "warning",
          );
        } else {
          throw new AppError(
            ErrorCode.EXTERNAL_SERVICE_ERROR,
            `Pixabay API error: ${pixabayResponse.statusText}`,
            HTTP_STATUS.BAD_GATEWAY,
            "error",
          );
        }
      }

      const pixabayData: PixabaySearchResponse = await pixabayResponse.json();

      // Transform Pixabay response to our StockImage format
      const pixabayImages = pixabayData.hits.map((hit): any => {
        // Determine orientation from dimensions
        let orientation: "landscape" | "portrait" | "square" = "landscape";
        if (hit.imageHeight > hit.imageWidth) {
          orientation = "portrait";
        } else if (Math.abs(hit.imageWidth - hit.imageHeight) < 100) {
          orientation = "square";
        }

        // Filter by orientation if specified
        if (queryParams.orientation && queryParams.orientation !== orientation) {
          return null;
        }

        return {
          id: `pixabay-${hit.id}`,
          provider: "pixabay" as const,
          title: hit.tags || `Image by ${hit.user}`,
          description: hit.tags || undefined,
          originalUrl: hit.pageURL,
          previewUrl: hit.previewURL, // 150px preview
          fullImageUrl: hit.largeImageURL || hit.webformatURL.replace("_640", "_960"), // High-res for download
          width: hit.imageWidth,
          height: hit.imageHeight,
          creatorName: hit.user,
          creatorUrl: `https://pixabay.com/users/${hit.user}-${hit.user_id}/`,
          creatorAvatar: hit.userImageURL,
          licensType: "free" as const,
          licenseText: "Pixabay License - Free for commercial use, no attribution required",
          attributionRequired: false, // Pixabay doesn't require attribution, but we show it anyway
          attributionText: `Image by ${hit.user} from Pixabay`,
          tags: hit.tags ? hit.tags.split(", ").map((t: string) => t.trim()) : [],
          colors: undefined, // Pixabay doesn't provide color info
          category: undefined,
          // ✅ SOURCE FIELD: Mark as stock
          source: "stock" as const,
        };
      }).filter((img) => img !== null); // Remove filtered-out images

      // Calculate hasMore
      const totalPages = Math.ceil(pixabayData.totalHits / queryParams.perPage);
      hasMore = queryParams.page < totalPages;
      total = pixabayData.totalHits;
      images = pixabayImages;
    }

    // Return standardized response
    res.json({
      images,
      total,
      page: queryParams.page,
      hasMore,
      provider: queryParams.provider,
      // Pixabay requires showing source when displaying search results
      attributionNotice: queryParams.provider === "pixabay" 
        ? "Images from Pixabay - Please show where images are from when displaying search results."
        : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid request parameters: ${error.errors.map((e) => e.message).join(", ")}`,
        HTTP_STATUS.BAD_REQUEST,
        "warning",
      );
    }
    next(error);
  }
};

/**
 * Get a single stock image by ID
 * GET /api/media/stock-images/:id
 */
export const getStockImage: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        "Image ID is required",
        HTTP_STATUS.BAD_REQUEST,
        "warning",
      );
    }

    // Parse provider and photo ID from our format (e.g., "pexels-12345" or "pixabay-12345")
    const [provider, photoId] = id.split("-");
    
    if (provider !== "pexels" && provider !== "pixabay") {
      throw new AppError(
        ErrorCode.NOT_IMPLEMENTED,
        `Provider "${provider}" is not yet implemented. Only "pexels" and "pixabay" are available.`,
        HTTP_STATUS.NOT_IMPLEMENTED,
        "info",
      );
    }

    let image: any;

    if (provider === "pexels") {
      const pexelsApiKey = process.env.PEXELS_API_KEY;
      if (!pexelsApiKey) {
        throw new AppError(
          ErrorCode.CONFIGURATION_ERROR,
          "Pexels API key not configured",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
        );
      }

      // Call Pexels API to get photo details
      const pexelsResponse = await fetch(`https://api.pexels.com/v1/photos/${photoId}`, {
        method: "GET",
        headers: {
          Authorization: pexelsApiKey,
          "User-Agent": "Postd/1.0",
        },
      });

      if (!pexelsResponse.ok) {
        if (pexelsResponse.status === 404) {
          throw new AppError(
            ErrorCode.NOT_FOUND,
            "Image not found",
            HTTP_STATUS.NOT_FOUND,
            "warning",
          );
        }
        throw new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Pexels API error: ${pexelsResponse.statusText}`,
          HTTP_STATUS.BAD_GATEWAY,
          "error",
        );
      }

      const photo: PexelsPhoto = await pexelsResponse.json();

      // Transform to our format
      image = {
        id: `pexels-${photo.id}`,
        provider: "pexels" as const,
        title: photo.alt || `Photo by ${photo.photographer}`,
        description: photo.alt || undefined,
        originalUrl: photo.url,
        previewUrl: photo.src.medium,
        fullImageUrl: photo.src.large2x || photo.src.large,
        width: photo.width,
        height: photo.height,
        creatorName: photo.photographer,
        creatorUrl: photo.photographer_url,
        creatorAvatar: undefined,
        licensType: "free" as const,
        licenseText: "Pexels License - Free to use, no attribution required",
        attributionRequired: false,
        attributionText: `Photo by ${photo.photographer} from Pexels`,
        tags: photo.alt ? [photo.alt.toLowerCase()] : [],
        colors: photo.avg_color ? [photo.avg_color] : [],
        category: undefined,
        // ✅ SOURCE FIELD: Mark as stock
        source: "stock" as const,
      };
    } else if (provider === "pixabay") {
      const pixabayApiKey = process.env.PIXABAY_API_KEY;
      if (!pixabayApiKey) {
        throw new AppError(
          ErrorCode.CONFIGURATION_ERROR,
          "Pixabay API key not configured",
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "error",
        );
      }

      // Call Pixabay API to get image details
      const pixabayUrl = new URL("https://pixabay.com/api/");
      pixabayUrl.searchParams.set("key", pixabayApiKey);
      pixabayUrl.searchParams.set("id", photoId);

      const pixabayResponse = await fetch(pixabayUrl.toString(), {
        method: "GET",
        headers: {
          "User-Agent": "Postd/1.0",
        },
      });

      if (!pixabayResponse.ok) {
        if (pixabayResponse.status === 404) {
          throw new AppError(
            ErrorCode.NOT_FOUND,
            "Image not found",
            HTTP_STATUS.NOT_FOUND,
            "warning",
          );
        }
        throw new AppError(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          `Pixabay API error: ${pixabayResponse.statusText}`,
          HTTP_STATUS.BAD_GATEWAY,
          "error",
        );
      }

      const pixabayData: PixabaySearchResponse = await pixabayResponse.json();
      
      if (!pixabayData.hits || pixabayData.hits.length === 0) {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "Image not found",
          HTTP_STATUS.NOT_FOUND,
          "warning",
        );
      }

      const hit = pixabayData.hits[0];

      // Transform to our format
      image = {
        id: `pixabay-${hit.id}`,
        provider: "pixabay" as const,
        title: hit.tags || `Image by ${hit.user}`,
        description: hit.tags || undefined,
        originalUrl: hit.pageURL,
        previewUrl: hit.previewURL,
        fullImageUrl: hit.largeImageURL || hit.webformatURL.replace("_640", "_960"),
        width: hit.imageWidth,
        height: hit.imageHeight,
        creatorName: hit.user,
        creatorUrl: `https://pixabay.com/users/${hit.user}-${hit.user_id}/`,
        creatorAvatar: hit.userImageURL,
        licensType: "free" as const,
        licenseText: "Pixabay License - Free for commercial use, no attribution required",
        attributionRequired: false,
        attributionText: `Image by ${hit.user} from Pixabay`,
        tags: hit.tags ? hit.tags.split(", ").map((t: string) => t.trim()) : [],
        colors: undefined,
        category: undefined,
        // ✅ SOURCE FIELD: Mark as stock
        source: "stock" as const,
      };
    }

    res.json({
      image,
      attributionNotice: provider === "pixabay" 
        ? "Images from Pixabay - Please show where images are from when displaying search results."
        : undefined,
    });
  } catch (error) {
    next(error);
  }
};

