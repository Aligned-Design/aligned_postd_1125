export type AssetFileType = "image" | "video";
export type AssetCategory = string; // legacy: 'Product' | 'Team' | 'Event' etc. Allow arbitrary categories for flexibility
export type PlatformFit = "Reels" | "Story" | "Square Post" | "Portrait" | "Landscape";
export type GraphicsSize = "social_square" | "story_portrait" | "blog_featured" | "email_header" | "custom";
export type Orientation = "horizontal" | "vertical" | "square";

export interface Asset {
  id: string;
  filename: string;
  fileType: AssetFileType;
  fileSize: number; // bytes
  width: number; // pixels
  height: number; // pixels
  duration?: number; // seconds (for video)
  thumbnailUrl?: string;
  storagePath?: string;
  // Optional top-level url for convenience
  url?: string;

  tags: string[]; // e.g., ["Team", "Office", "Blue Palette", "Lauren"]
  category: AssetCategory;
  people: string[]; // e.g., ["Lauren", "Kris", "Sariah"]
  colors: string[]; // hex codes e.g., ["#3B82F6", "#1F2937"]
  platformFits: PlatformFit[]; // e.g., ["Reels", "Story"]

  graphicsSize?: GraphicsSize; // e.g., "social_square", "story_portrait"
  orientation?: Orientation; // "horizontal", "vertical", "square"
  aspectRatio?: number; // width / height for future AI resizing

  campaignIds?: string[]; // linked campaigns
  eventIds?: string[]; // linked events
  usageCount?: number; // how many posts/campaigns use it
  favorite?: boolean;

  source: "upload" | "stock" | "ai"; // where it came from
  capturedAt?: string; // ISO date
  uploadedAt: string; // ISO date
  uploadedBy: string; // user ID
  brandId: string; // for multi-brand support

  aiTagsPending: boolean; // waiting for user approval
  description?: string; // optional user caption

  archived?: boolean; // soft-delete: hidden from normal view
  archivedAt?: string; // ISO date when archived
  archivedBy?: string; // user ID who archived it
}

export interface SmartTagPreview {
  assetId: string;
  suggestedTags: string[];
  suggestedCategory: AssetCategory;
  suggestedPeople: string[];
  suggestedColors: string[];
  suggestedPlatformFits: PlatformFit[];
  detectionConfidence: number; // 0-100
}

export interface LibraryFilter {
  datePreset?: "7days" | "30days" | "90days" | "6months" | "12months" | "alltime" | "custom";
  dateRange?: {
    from: string;
    to: string;
  };
  tags: string[];
  fileTypes: AssetFileType[];
  people: string[];
  graphicsSizes?: GraphicsSize[];
  campaignIds: string[];
  eventIds: string[];
  searchQuery: string;
}

export interface LibraryViewPreferences {
  viewMode: "grid" | "table" | "masonry";
  itemsPerPage: number;
  sortBy: "date" | "name" | "usage" | "favorite";
  sortOrder: "asc" | "desc";
}

/**
 * Detect graphics size category from dimensions
 * Maps pixel dimensions to preset sizes with ±10% tolerance
 */
export function detectGraphicsSize(width: number, height: number): { size: GraphicsSize; name: string; icon: string } {
  const aspectRatio = width / height;

  // Social Square (1:1) — 1080×1080px
  if (aspectRatio > 0.9 && aspectRatio < 1.1) {
    return { size: "social_square", name: "Social Square", icon: "🟦" };
  }

  // Story/Portrait (9:16) — 1080×1920px
  if (aspectRatio > 0.5 && aspectRatio < 0.6) {
    return { size: "story_portrait", name: "Story/Portrait", icon: "📱" };
  }

  // Blog Featured (16:9) — 1200×675px
  if (aspectRatio > 1.7 && aspectRatio < 1.9) {
    return { size: "blog_featured", name: "Blog Featured", icon: "📝" };
  }

  // Email Header (3:1) — 600×200, 800×300px
  if (aspectRatio > 2.8 && aspectRatio < 3.2) {
    return { size: "email_header", name: "Email Header", icon: "📧" };
  }

  // Custom/Other
  return { size: "custom", name: "Custom", icon: "🖼️" };
}

/**
 * Detect orientation from dimensions
 */
export function detectOrientation(width: number, height: number): Orientation {
  const aspectRatio = width / height;
  if (aspectRatio > 1.1) return "horizontal";
  if (aspectRatio < 0.9) return "vertical";
  return "square";
}

/**
 * Get graphics size display info
 */
export function getGraphicsSizeInfo(size: GraphicsSize): { name: string; icon: string; examples: string } {
  const info: Record<GraphicsSize, { name: string; icon: string; examples: string }> = {
    social_square: {
      name: "Social Square",
      icon: "🟦",
      examples: "Instagram Feed, LinkedIn Post",
    },
    story_portrait: {
      name: "Story/Portrait",
      icon: "📱",
      examples: "Instagram Story, TikTok",
    },
    blog_featured: {
      name: "Blog Featured",
      icon: "📝",
      examples: "Blog Hero, Featured Image",
    },
    email_header: {
      name: "Email Header",
      icon: "📧",
      examples: "Email Header, Web Banner",
    },
    custom: {
      name: "Custom",
      icon: "🖼️",
      examples: "Other Dimensions",
    },
  };
  return info[size];
}

/**
 * Mock AI detection for assets
 * In Phase 2, this will call AWS Rekognition or Google Vision
 */
export function mockDetectAsset(filename: string, fileType: AssetFileType): SmartTagPreview {
  // Deterministic "detection" based on filename patterns
  const lowerName = filename.toLowerCase();

  // Suggest category
  let suggestedCategory: AssetCategory = "Other";
  if (lowerName.includes("team") || lowerName.includes("headshot") || lowerName.includes("people")) {
    suggestedCategory = "Team";
  } else if (lowerName.includes("product") || lowerName.includes("promo")) {
    suggestedCategory = "Product";
  } else if (lowerName.includes("event") || lowerName.includes("conference")) {
    suggestedCategory = "Event";
  } else if (lowerName.includes("office") || lowerName.includes("behind") || lowerName.includes("bts")) {
    suggestedCategory = "Behind the Scenes";
  } else if (lowerName.includes("lifestyle") || lowerName.includes("life")) {
    suggestedCategory = "Lifestyle";
  } else if (lowerName.includes("logo") || lowerName.includes("brand")) {
    suggestedCategory = "Logo";
  }

  // Suggest people (mock)
  const people = [];
  const teamNames = ["Lauren", "Kris", "Sariah", "Alex", "Jordan", "Morgan"];
  if (suggestedCategory === "Team" || lowerName.includes("headshot")) {
    people.push(...teamNames.slice(0, Math.random() > 0.5 ? 1 : 2));
  }

  // Suggest platform fits
  const platformFits: PlatformFit[] = [];
  if (fileType === "image") {
    platformFits.push("Square Post");
    if (Math.random() > 0.4) platformFits.push("Landscape");
    if (Math.random() > 0.6) platformFits.push("Portrait");
  } else {
    platformFits.push("Reels", "Story");
  }

  // Suggest colors (mocked)
  const colorPalettes = [
    ["#3B82F6", "#1F2937", "#FFFFFF"], // Blue/Dark/White
    ["#EC4899", "#FBBF24", "#FFFFFF"], // Pink/Yellow/White
    ["#10B981", "#1F2937", "#F3F4F6"], // Green/Dark/Light
    ["#8B5CF6", "#F87171", "#FFFFFF"], // Purple/Red/White
    ["#F97316", "#1F2937", "#FFFFFF"], // Orange/Dark/White
  ];
  const suggestedColors = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

  // Common tags
  const allTags = [
    suggestedCategory,
    fileType === "video" ? "Video" : "Photo",
    ...suggestedColors.map((c) => `Color: ${c}`),
    ...(platformFits.map((pf) => `${pf}-friendly`)),
  ];

  // Add contextual tags based on filename
  if (lowerName.includes("outdoor")) allTags.push("Outdoor");
  if (lowerName.includes("indoor")) allTags.push("Indoor");
  if (lowerName.includes("professional")) allTags.push("Professional");
  if (lowerName.includes("casual")) allTags.push("Casual");

  return {
    assetId: "", // set by caller
    suggestedTags: allTags,
    suggestedCategory,
    suggestedPeople: people,
    suggestedColors,
    suggestedPlatformFits: platformFits,
    detectionConfidence: 75 + Math.random() * 20,
  };
}

/**
 * Generate mock asset data for demo
 */
export function generateMockAssets(count: number = 12): Asset[] {
  const mockData = [
    { filename: "team-headshot-lauren.jpg", category: "Team", people: ["Lauren"], imageId: "1571282237490-a4a3a5e1b6e" },
    { filename: "product-launch-event.jpg", category: "Event", people: [], imageId: "1552664730-d307ca884978" },
    { filename: "office-culture-moment.jpg", category: "Behind the Scenes", people: ["Kris", "Alex"], imageId: "1552900195-4e4e4e4e4e4e" },
    { filename: "product-demo-video.mp4", category: "Product", people: [], imageId: "1574169208507-84007b92a305" },
    { filename: "conference-speakers.jpg", category: "Event", people: ["Lauren", "Sariah"], imageId: "1552966543-e4e4e4e4e4e4" },
    { filename: "lifestyle-outdoor.jpg", category: "Lifestyle", people: [], imageId: "1529156069898-49953e39b3ac" },
    { filename: "brand-logo-horizontal.png", category: "Logo", people: [], imageId: "1606575883503-d1b0a9d5f2f3" },
    { filename: "team-meeting-candid.jpg", category: "Behind the Scenes", people: ["Morgan", "Jordan"], imageId: "1552664953-6f2fa6e4e4e4" },
    { filename: "product-showcase.jpg", category: "Product", people: [], imageId: "1517694712202-14dd9538aa97" },
    { filename: "customer-testimonial-video.mp4", category: "Lifestyle", people: [], imageId: "1552664730-d307ca884978" },
    { filename: "office-tour-behind-scenes.jpg", category: "Behind the Scenes", people: [], imageId: "1552900195-4e4e4e4e4e4e" },
    { filename: "instagram-reel-concept.mp4", category: "Product", people: [], imageId: "1574169208507-84007b92a305" },
  ];

  const colors = [
    ["#3B82F6", "#1F2937"],
    ["#EC4899", "#FBBF24"],
    ["#10B981", "#1F2937"],
    ["#8B5CF6", "#F87171"],
  ];

  const now = new Date();

  // Preset dimensions for variety
  const dimensionSets = [
    { width: 1080, height: 1080 }, // Social Square
    { width: 1080, height: 1920 }, // Story/Portrait
    { width: 1200, height: 675 }, // Blog Featured
    { width: 800, height: 300 }, // Email Header
    { width: 1600, height: 900 }, // Wide screen
    { width: 500, height: 800 }, // Mobile portrait
  ];

  return mockData.slice(0, count).map((data, idx) => {
    const isVideo = data.filename.endsWith(".mp4");
    const detection = mockDetectAsset(data.filename, isVideo ? "video" : "image");
    const uploadDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // last 30 days

    // Use preset dimensions or random
    const dims = dimensionSets[idx % dimensionSets.length];
    const width = isVideo ? 1920 : dims.width;
    const height = isVideo ? 1080 : dims.height;
    const graphicsSize = detectGraphicsSize(width, height);
    const orientation = detectOrientation(width, height);
    const aspectRatio = width / height;

    return {
      id: `asset-${idx + 1}`,
      filename: data.filename,
      fileType: isVideo ? "video" : "image",
      fileSize: Math.floor(Math.random() * 5000000) + 500000, // 500KB to 5.5MB
      width,
      height,
      duration: isVideo ? Math.floor(Math.random() * 60) + 10 : undefined,
      thumbnailUrl: `https://images.unsplash.com/photo-${data.imageId}?w=400&h=400&fit=crop&crop=faces`,
      storagePath: `/assets/${data.filename}`,

      tags: detection.suggestedTags.slice(0, 6),
      category: data.category,
      people: data.people,
      colors: colors[idx % colors.length],
      platformFits: detection.suggestedPlatformFits,

      graphicsSize: graphicsSize.size,
      orientation,
      aspectRatio,

      campaignIds: Math.random() > 0.5 ? ["campaign-1", "campaign-2"].slice(0, Math.floor(Math.random() * 2) + 1) : [],
      eventIds: Math.random() > 0.6 ? ["event-1"] : [],
      usageCount: Math.floor(Math.random() * 15),
      favorite: Math.random() > 0.8,

      source: "upload",
      uploadedAt: uploadDate.toISOString(),
      uploadedBy: "user-1",
      brandId: "brand-1",

      aiTagsPending: false,

      archived: false,
    };
  });
}
