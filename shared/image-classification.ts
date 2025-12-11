/**
 * Image Classification Types
 * 
 * Defines the taxonomy for classifying crawled/uploaded images in POSTD.
 * These roles determine how images are displayed in the Brand Guide and Creative Studio.
 * 
 * @see docs/POSTD_PRODUCT_DEFINITION_AND_GUARDRAILS.md
 * @see server/workers/brand-crawler.ts
 * @see server/lib/scraped-images-service.ts
 */

/**
 * ImageRole: Primary classification for how an image should be used
 * 
 * These roles are stored in media_assets.metadata.role and used to:
 * - Separate logos from brand images in the Brand Guide
 * - Filter out icons from primary brand imagery
 * - Prioritize which images to display in onboarding Step 5
 */
export type ImageRole =
  | "logo"           // Primary brand logo (max 2 per brand)
  | "brand_image"    // Rich brand photos: hero banners, lifestyle, product shots (max 15)
  | "icon"           // Small UI icons, service icons, illustrations (excluded from Brand Guide)
  | "hero"           // Large hero/banner images (subset of brand_image)
  | "team"           // Team/staff photos
  | "product"        // Product/service images
  | "partner_logo"   // Partner/vendor/association badges (excluded)
  | "social_icon"    // Social media icons (excluded)
  | "platform_logo"  // Platform badges like "Powered by Squarespace" (excluded)
  | "background"     // Background textures/patterns
  | "other";         // Unclassified images

/**
 * ImageCategory: Storage category in media_assets table
 * Maps to media_assets.category column
 */
export type ImageCategory = "logos" | "images" | "graphics" | "icons";

/**
 * ImageSourceType: How the image was discovered/extracted
 */
export type ImageSourceType =
  | "html-img"       // Standard <img> tag
  | "css-bg"         // CSS background-image
  | "svg"            // Inline or external SVG
  | "og"             // Open Graph meta tag
  | "favicon"        // Favicon/icon links
  | "upload"         // User uploaded
  | "ai-generated";  // AI-generated image

/**
 * Classification signals used to determine image role
 */
export interface ClassificationSignals {
  // Size-based signals
  width?: number;
  height?: number;
  area?: number;               // width * height
  aspectRatio?: number;        // width / height

  // Location-based signals
  inHeaderOrNav?: boolean;
  inFooter?: boolean;
  inHeroOrAboveFold?: boolean;
  inAffiliateOrPartnerSection?: boolean;
  offsetTop?: number;          // Distance from top of page

  // Content-based signals
  alt?: string;
  filename?: string;
  url?: string;
  brandMatchScore?: number;    // 0-2: how well alt/filename matches brand name

  // Source signals
  sourceType?: ImageSourceType;
  parentClasses?: string[];
  parentIds?: string[];

  // Color signals (for icon detection)
  colorCount?: number;         // Number of distinct colors
  isMonochrome?: boolean;      // Single color + transparency
  hasSolidBackground?: boolean;
}

/**
 * Classified image result
 */
export interface ClassifiedImage {
  url: string;
  role: ImageRole;
  category: ImageCategory;
  confidence: number;          // 0-1 confidence in classification
  signals: ClassificationSignals;
  
  // For Brand Guide display
  shouldDisplay: boolean;      // Whether to show in Brand Guide
  displayPriority: number;     // Higher = show first
  
  // Metadata
  alt?: string;
  width?: number;
  height?: number;
  filename?: string;
  sourceType?: ImageSourceType;
  
  // Override tracking
  userOverridden?: boolean;    // True if user manually changed role
  originalRole?: ImageRole;    // Role before user override
}

/**
 * Role mapping from legacy crawler roles to new taxonomy
 */
export const LEGACY_ROLE_MAP: Record<string, ImageRole> = {
  "logo": "logo",
  "hero": "hero",
  "photo": "brand_image",
  "team": "team",
  "subject": "product",
  "social_icon": "social_icon",
  "platform_logo": "platform_logo",
  "partner_logo": "partner_logo",
  "ui_icon": "icon",
  "other": "other",
};

/**
 * Roles that should be excluded from Brand Guide display
 */
export const EXCLUDED_ROLES: ImageRole[] = [
  "icon",
  "social_icon",
  "platform_logo",
  "partner_logo",
];

/**
 * Roles that map to the "logos" category
 */
export const LOGO_ROLES: ImageRole[] = ["logo"];

/**
 * Roles that map to the "images" category (brand imagery)
 */
export const BRAND_IMAGE_ROLES: ImageRole[] = [
  "brand_image",
  "hero",
  "team",
  "product",
  "background",
  "other",
];

/**
 * Map role to category for storage
 */
export function roleToCategory(role: ImageRole): ImageCategory {
  if (LOGO_ROLES.includes(role)) return "logos";
  if (EXCLUDED_ROLES.includes(role)) return "icons";
  return "images";
}

/**
 * Check if a role should be displayed in Brand Guide
 */
export function shouldDisplayInBrandGuide(role: ImageRole): boolean {
  return !EXCLUDED_ROLES.includes(role);
}

/**
 * Image classification thresholds
 */
export const CLASSIFICATION_THRESHOLDS = {
  // Size thresholds
  MIN_LOGO_SIZE: 40,           // Minimum dimension for logos
  MAX_LOGO_SIZE: 400,          // Maximum dimension for logos (larger = brand image)
  MIN_BRAND_IMAGE_SIZE: 200,   // Minimum dimension for brand images
  MIN_HERO_SIZE: 600,          // Minimum dimension for hero images
  
  // Icon detection
  MAX_ICON_SIZE: 150,          // Maximum dimension to consider as icon
  MAX_ICON_AREA: 22500,        // 150x150 = icon threshold
  
  // Logo detection
  MAX_LOGO_AREA: 160000,       // 400x400 = max logo area
  
  // Hero detection
  MIN_HERO_AREA: 360000,       // 600x600 minimum for hero
  MIN_HERO_WIDTH: 800,         // Minimum width for wide hero banners
  
  // Color analysis
  MONOCHROME_COLOR_THRESHOLD: 3, // Max colors to consider monochrome
};

/**
 * Known icon pack patterns (URLs/filenames that indicate icon libraries)
 */
export const ICON_PACK_PATTERNS = [
  "/icons/", "/icon/", "/assets/icons", "/img/icons", "/images/icons",
  "/iconpack/", "/icon-pack/", "/ui-icons/", "/ui/icons",
  "/fontawesome", "/feather", "/heroicons", "/lucide", "/bootstrap-icons",
  "/material-icons", "/ionicons", "/tabler-icons", "/phosphor-icons",
];

/**
 * Generic icon name patterns (filenames/alt text that indicate UI icons)
 */
export const GENERIC_ICON_PATTERNS = [
  "envelope", "mail", "email", "globe", "world", "phone", "call", "contact",
  "arrow", "chevron", "caret", "hamburger", "menu", "search", "magnify",
  "user", "person", "avatar", "profile", "account", "settings", "cog", "gear",
  "home", "house", "star", "heart", "like", "share", "download", "upload",
  "play", "pause", "stop", "next", "prev", "forward", "back", "close", "x-mark",
  "check", "checkmark", "tick", "cross", "plus", "minus", "add", "remove",
  "cart", "shopping", "bag", "basket", "lock", "unlock", "key", "shield",
  "bell", "notification", "alert", "warning", "info", "help", "question",
  "calendar", "clock", "time", "date", "location", "map", "pin", "marker",
  "link", "chain", "external", "new-window", "copy", "clipboard", "edit", "pencil",
  "trash", "delete", "bin", "folder", "file", "document", "pdf",
  "camera", "video", "mic", "microphone", "speaker", "volume", "mute",
  "wifi", "signal", "battery", "power", "refresh", "sync", "loading", "spinner",
];

/**
 * Social media platform patterns
 */
export const SOCIAL_PLATFORM_PATTERNS = [
  "facebook", "instagram", "linkedin", "x-logo", "twitter", "tiktok",
  "youtube", "pinterest", "snapchat", "whatsapp", "telegram", "discord",
  "social-icon", "social_icon", "socialicon", "social-media",
];

/**
 * Platform vendor patterns (hosting platforms)
 */
export const PLATFORM_VENDOR_PATTERNS = [
  "squarespace", "wix", "godaddy", "canva", "shopify", "wordpress",
  "webflow", "weebly", "duda", "jimdo",
];

/**
 * Partner/affiliate section patterns
 */
export const PARTNER_SECTION_PATTERNS = [
  "partner", "association", "member", "vendor", "powered-by", "powered_by",
  "badge", "sponsor", "brokers", "advisors", "custodian", "certified",
  "affiliate", "featured-in", "as-seen-on",
];

