import { StockImage, StockSearchParams, StockSearchResult, StockProvider } from "@/types/stock";
import { logError } from "@/lib/logger";

/**
 * Stock Image API Integration
 * Supports Pexels and Pixabay stock image providers
 */

// Mock data for fallback only - real API is now implemented
const MOCK_STOCK_IMAGES: StockImage[] = [
  {
    id: "unsplash-1",
    provider: "unsplash",
    title: "Mountain Landscape",
    description: "Beautiful mountain scenery at sunset",
    originalUrl: "https://unsplash.com/photos/mountain",
    previewUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    fullImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1440&fit=crop",
    width: 1920,
    height: 1440,
    creatorName: "John Doe",
    creatorUrl: "https://unsplash.com/@johndoe",
    creatorAvatar: "https://i.pravatar.cc/150?img=1",
    licensType: "free",
    licenseText: "Unsplash License",
    attributionRequired: true,
    attributionText: "Photo by John Doe on Unsplash",
    tags: ["mountain", "landscape", "nature", "sunset"],
    colors: ["#8B7355", "#FF6B6B", "#FFE66D"],
    category: "nature",
  },
  {
    id: "pexels-1",
    provider: "pexels",
    title: "Modern Office",
    description: "Contemporary workspace with natural light",
    originalUrl: "https://www.pexels.com/photo/modern-office/",
    previewUrl: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    fullImageUrl: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1440&fit=crop",
    width: 1920,
    height: 1440,
    creatorName: "Jane Smith",
    creatorUrl: "https://www.pexels.com/@janesmith",
    creatorAvatar: "https://i.pravatar.cc/150?img=2",
    licensType: "free",
    licenseText: "Pexels License",
    attributionRequired: false,
    attributionText: "Photo from Pexels",
    tags: ["office", "workspace", "business", "interior"],
    colors: ["#FFFFFF", "#E0E0E0", "#4A4A4A"],
    category: "business",
  },
  {
    id: "pixabay-1",
    provider: "pixabay",
    title: "Abstract Colorful",
    description: "Vibrant abstract background",
    originalUrl: "https://pixabay.com/illustrations/abstract/",
    previewUrl: "https://cdn.pixabay.com/photo/2021/12/08/22/24/abstract-6859429_150.jpg",
    fullImageUrl: "https://cdn.pixabay.com/photo/2021/12/08/22/24/abstract-6859429_640.jpg",
    width: 640,
    height: 480,
    creatorName: "Creative Artist",
    creatorUrl: "https://pixabay.com/users/creativeartist",
    licensType: "free",
    licenseText: "Pixabay License",
    attributionRequired: false,
    attributionText: "Image from Pixabay",
    tags: ["abstract", "colorful", "background", "design"],
    colors: ["#FF1744", "#00BCD4", "#FFC107"],
    category: "abstract",
  },
  {
    id: "unsplash-2",
    provider: "unsplash",
    title: "Ocean Waves",
    description: "Peaceful beach scenery",
    originalUrl: "https://unsplash.com/photos/beach",
    previewUrl: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=300&fit=crop",
    fullImageUrl: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&h=1440&fit=crop",
    width: 1920,
    height: 1440,
    creatorName: "Sarah Williams",
    creatorUrl: "https://unsplash.com/@sarahwilliams",
    creatorAvatar: "https://i.pravatar.cc/150?img=3",
    licensType: "free",
    licenseText: "Unsplash License",
    attributionRequired: true,
    attributionText: "Photo by Sarah Williams on Unsplash",
    tags: ["beach", "ocean", "water", "nature"],
    colors: ["#0066CC", "#FFFFFF", "#CCCCCC"],
    category: "nature",
  },
];

export async function searchStockImages(
  params: StockSearchParams
): Promise<StockSearchResult> {
  const {
    query,
    page = 1,
    perPage = 12,
    orientation,
    providers = ["pexels"], // Default to Pexels (Pexels and Pixabay are implemented)
  } = params;

  // Use first provider (or default to Pexels)
  const provider = providers[0] || "pexels";

  try {
    // Call backend API (proxies to Pexels)
    const searchParams = new URLSearchParams({
      query: query || "nature",
      page: page.toString(),
      perPage: perPage.toString(),
      provider: provider,
    });

    if (orientation) {
      searchParams.set("orientation", orientation);
    }

    const response = await fetch(`/api/media/stock-images/search?${searchParams.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to search stock images" }));
      throw new Error(error.error?.message || error.message || "Failed to search stock images");
    }

    const data = await response.json();
    
    return {
      images: data.images || [],
      total: data.total || 0,
      page: data.page || page,
      hasMore: data.hasMore || false,
    };
  } catch (error) {
    logError("[Stock Images] API error", error instanceof Error ? error : new Error(String(error)));
    
    // ✅ DEV-ONLY FALLBACK: Only use mock data in development
    const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";
    
    if (isDev) {
      // Development: fallback to mock data for easier testing
      const results = MOCK_STOCK_IMAGES.filter((img) => {
        const matchesQuery =
          !query ||
          img.title.toLowerCase().includes(query.toLowerCase()) ||
          img.description?.toLowerCase().includes(query.toLowerCase()) ||
          img.tags?.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

        const matchesProvider = providers.includes(img.provider);

        const matchesOrientation =
          !orientation ||
          (orientation === "landscape" && img.width > img.height) ||
          (orientation === "portrait" && img.height > img.width) ||
          (orientation === "square" && Math.abs(img.width - img.height) < 100);

        return matchesQuery && matchesProvider && matchesOrientation;
      });

      const start = (page - 1) * perPage;
      const end = start + perPage;
      const paginatedResults = results.slice(start, end);

      return {
        images: paginatedResults,
        total: results.length,
        page,
        hasMore: end < results.length,
      };
    }
    
    // Production: return empty results instead of fake images
    return {
      images: [],
      total: 0,
      page,
      hasMore: false,
    };
  }
}

export async function getStockImage(id: string): Promise<StockImage | null> {
  try {
    // Call backend API
    const response = await fetch(`/api/media/stock-images/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to get stock image");
    }

    const data = await response.json();
    return data.image || null;
  } catch (error) {
    logError("[Stock Images] API error", error instanceof Error ? error : new Error(String(error)));
    
    // ✅ DEV-ONLY FALLBACK: Only use mock data in development
    const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";
    
    if (isDev) {
      // Development: fallback to mock data for easier testing
      return MOCK_STOCK_IMAGES.find((img) => img.id === id) || null;
    }
    
    // Production: return null instead of fake image
    return null;
  }
}

export async function addStockImageToLibrary(
  image: StockImage,
  brandId: string,
  userId: string
): Promise<{ success: boolean; assetId: string; message: string }> {
  try {
    const response = await fetch("/api/media/stock-images/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId,
        userId,
        imageUrl: image.fullImageUrl,
        provider: image.provider,
        providerId: image.id,
        title: image.title,
        description: image.description,
        attribution: image.attributionText,
        tags: image.tags,
        metadata: {
          creatorName: image.creatorName,
          creatorUrl: image.creatorUrl,
          licenseType: image.licensType,
          licenseText: image.licenseText,
          originalUrl: image.originalUrl,
          width: image.width,
          height: image.height,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to import image" }));
      throw new Error(error.message || "Failed to import image to library");
    }

    const data = await response.json();
    return {
      success: true,
      assetId: data.asset?.id || data.assetId || `asset-${Date.now()}`,
      message: `Added "${image.title}" to library (${image.provider})`,
    };
  } catch (error) {
    logError("[Stock Images] Failed to add to library", error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      assetId: "",
      message: `Failed to add "${image.title}" to library: ${(error as Error).message}`,
    };
  }
}

export function getProviderBadgeColor(provider: StockProvider): string {
  const colors = {
    unsplash: "bg-black text-white",
    pexels: "bg-green-600 text-white",
    pixabay: "bg-blue-600 text-white",
  };
  return colors[provider];
}

export function getLicenseBadgeColor(license: string): string {
  const colors = {
    free: "bg-green-100 text-green-800",
    editorial: "bg-yellow-100 text-yellow-800",
    commercial: "bg-blue-100 text-blue-800",
  };
  return colors[license as keyof typeof colors] || "bg-gray-100 text-gray-800";
}

/**
 * Provider-specific search functions
 * These delegate to the main searchStockImages function with the appropriate provider filter.
 * Backend API (Pexels) handles the actual stock image fetching.
 */
export async function searchUnsplashImages(
  query: string,
  page: number = 1,
  perPage: number = 12
): Promise<StockImage[]> {
  const result = await searchStockImages({
    query,
    page,
    perPage,
    providers: ["unsplash"],
  });
  return result.images;
}

export async function searchPexelsImages(
  query: string,
  page: number = 1,
  perPage: number = 12
): Promise<StockImage[]> {
  const result = await searchStockImages({
    query,
    page,
    perPage,
    providers: ["pexels"],
  });
  return result.images;
}

export async function searchPixabayImages(
  query: string,
  page: number = 1,
  perPage: number = 12
): Promise<StockImage[]> {
  const result = await searchStockImages({
    query,
    page,
    perPage,
    providers: ["pixabay"],
  });
  return result.images;
}
