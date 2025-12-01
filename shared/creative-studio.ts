/**
 * Creative Studio Shared Types
 * Types used by both client and server for Creative Studio functionality
 */

// ============================================================================
// CANVAS ITEM TYPES
// ============================================================================

export type CanvasItemType = "text" | "image" | "shape" | "background";
export type ShapeType = "rectangle" | "circle";
export type DesignFormat =
  | "social_square"
  | "story_portrait"
  | "blog_featured"
  | "email_header"
  | "custom";

/**
 * CanvasItem - Represents a single element on the Creative Studio canvas
 * Supports text, images, shapes, and background elements
 */
export interface CanvasItem {
  id: string;
  type: CanvasItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked?: boolean;

  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  fontWeight?: "normal" | "bold" | "900";
  textAlign?: "left" | "center" | "right";

  // Image properties
  imageUrl?: string;
  imageName?: string;
  crop?: {
    x: number; // Crop area X offset (0-1, relative to image)
    y: number; // Crop area Y offset (0-1, relative to image)
    width: number; // Crop area width (0-1, relative to image)
    height: number; // Crop area height (0-1, relative to image)
    aspectRatio?: "1:1" | "9:16" | "16:9" | "free"; // Locked aspect ratio
  };

  // Shape properties
  shapeType?: ShapeType;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;

  // Background properties
  backgroundType?: "solid" | "gradient";
  backgroundColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
}

// ============================================================================
// DESIGN TYPES
// ============================================================================

/**
 * CreativeStudioDesign - Complete design object stored in database
 * This matches the structure returned by the API and stored in Supabase
 */
export interface CreativeStudioDesign {
  id: string;
  name?: string;
  format: DesignFormat;
  width: number;
  height: number;
  brandId: string;
  campaignId?: string;
  items: CanvasItem[];
  backgroundColor?: string;
  createdAt: string;
  updatedAt: string;
  savedToLibrary: boolean;
  libraryAssetId?: string;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * SaveDesignRequest - Request body for saving a new design
 */
export interface SaveDesignRequest {
  name?: string;
  format: DesignFormat;
  width: number;
  height: number;
  brandId: string;
  campaignId?: string;
  items: CanvasItem[];
  backgroundColor?: string;
  savedToLibrary?: boolean;
  libraryAssetId?: string;
}

/**
 * SaveDesignResponse - Response from saving a design
 */
export interface SaveDesignResponse {
  success: boolean;
  design: CreativeStudioDesign;
}

/**
 * UpdateDesignRequest - Request body for updating an existing design
 */
export interface UpdateDesignRequest extends Partial<SaveDesignRequest> {
  id: string;
}

/**
 * UpdateDesignResponse - Response from updating a design
 */
export interface UpdateDesignResponse {
  success: boolean;
  design: CreativeStudioDesign;
}

/**
 * ScheduleDesignRequest - Request body for scheduling a design
 */
export interface ScheduleDesignRequest {
  scheduledDate: string; // YYYY-MM-DD format
  scheduledTime: string; // HH:mm format
  scheduledPlatforms: string[];
  autoPublish?: boolean;
}

/**
 * ScheduleDesignResponse - Response from scheduling a design
 */
export interface ScheduleDesignResponse {
  success: boolean;
  job: {
    id: string;
    designId: string;
    platforms: string[];
    scheduledAt: string; // ISO datetime string
    autoPublish: boolean;
    status: string;
  };
}

/**
 * ListDesignsResponse - Response from listing designs
 */
export interface ListDesignsResponse {
  success: boolean;
  designs: CreativeStudioDesign[];
}

// ============================================================================
// FORMAT PRESETS
// ============================================================================

export interface FormatPreset {
  name: string;
  width: number;
  height: number;
  icon: string;
}

export const FORMAT_PRESETS: Record<DesignFormat, FormatPreset> = {
  social_square: {
    name: "Social Post",
    width: 1080,
    height: 1350,
    icon: "🟦",
  },
  story_portrait: {
    name: "Story / Vertical",
    width: 1080,
    height: 1920,
    icon: "📱",
  },
  blog_featured: {
    name: "Blog Graphic",
    width: 800,
    height: 400,
    icon: "📝",
  },
  email_header: {
    name: "Email Header",
    width: 800,
    height: 200,
    icon: "📧",
  },
  custom: {
    name: "Custom / Flyer",
    width: 1200,
    height: 1800,
    icon: "🖼️",
  },
} as const;

