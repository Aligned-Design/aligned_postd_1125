export type StockProvider = "unsplash" | "pexels" | "pixabay";
export type ImageLicense = "free" | "editorial" | "commercial";

export interface StockImage {
  id: string;
  provider: StockProvider;
  title: string;
  description?: string;
  originalUrl: string; // Direct link to provider
  previewUrl: string; // Thumbnail/preview
  fullImageUrl: string; // High-res download URL
  width: number;
  height: number;
  creatorName: string;
  creatorUrl?: string;
  creatorAvatar?: string;
  licensType: ImageLicense;
  licenseText: string;
  attributionRequired: boolean;
  attributionText: string; // e.g., "Photo by John Doe on Unsplash"
  downloadedAt?: string;
  tags?: string[];
  colors?: string[]; // Dominant colors
  category?: string;
}

export interface StockSearchResult {
  images: StockImage[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface StockSearchParams {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: "landscape" | "portrait" | "square";
  color?: string;
  providers?: StockProvider[];
}

export interface SavedStockImage extends StockImage {
  savedAt: string;
  savedBy: string;
  libraryId: string; // FK to library asset
  usageCount: number;
}
