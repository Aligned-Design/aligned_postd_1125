// Account type: Agency vs Single-Business
export type AccountType = "agency" | "single-business";

// User role within account
export type UserRole = "admin" | "manager" | "client";

// Analytics layout preference
export interface AnalyticsLayout {
  sections: AnalyticsSection[];
  sortBy: "best" | "lowest" | "custom";
  isLocked: boolean;
  platformsHidden: string[];
  lastUpdated?: string;
}

export interface AnalyticsSection {
  id: string;
  name: string;
  visible: boolean;
  order: number;
}

// User profile
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  accountType: AccountType;
  role: UserRole;
  accountId: string;
  brandId?: string; // For agency clients, which brand they manage
  analyticsLayout?: AnalyticsLayout;
  preferences?: {
    theme?: "light" | "dark";
    defaultDateRange?: "7d" | "30d" | "3m" | "1y";
    autoReportFrequency?: "daily" | "weekly" | "monthly";
  };
}

// Report settings
export interface ReportSettings {
  id: string;
  accountId: string;
  brandId?: string;
  name: string;
  frequency: "weekly" | "monthly" | "quarterly";
  dayOfWeek?: number; // 0-6 for weekly (0=Sunday)
  monthlyType?: "specific-day" | "ordinal"; // How to schedule monthly
  dayOfMonth?: number; // 1-31 for specific day of month
  ordinalDay?: {
    ordinal: "first" | "second" | "third" | "fourth" | "last"; // first Monday, second Tuesday, etc.
    dayOfWeek: number; // 0-6
  };
  quarterlyMonth?: number; // 0, 3, 6, 9 for Q1, Q2, Q3, Q4
  recipients: string[];
  includeMetrics: string[];
  includePlatforms: string[];
  aiSummary?: string; // Aligned AI Analytics Summary
  includeAISummary?: boolean; // Whether to include AI summary in report
  isActive: boolean;
  createdDate: string;
  lastSent?: string;
}

// Default analytics sections for fresh users
export const DEFAULT_ANALYTICS_SECTIONS: AnalyticsSection[] = [
  { id: "summary", name: "Weekly Summary", visible: true, order: 0 },
  { id: "platforms", name: "Platform Performance", visible: true, order: 1 },
  { id: "advisor", name: "Advisor Insights", visible: true, order: 2 },
  { id: "opportunities", name: "Top Opportunities", visible: true, order: 3 },
];

// Mock user for development (agency admin)
export const MOCK_AGENCY_ADMIN: User = {
  id: "user-1",
  name: "You (Agency Admin)",
  email: "admin@aligned-agency.com",
  avatar: "👤",
  accountType: "agency",
  role: "admin",
  accountId: "agency-1",
  analyticsLayout: {
    sections: DEFAULT_ANALYTICS_SECTIONS,
    sortBy: "best",
    isLocked: false,
    platformsHidden: [],
    lastUpdated: new Date().toISOString(),
  },
  preferences: {
    defaultDateRange: "7d",
    autoReportFrequency: "weekly",
  },
};

// Mock user for client view
export const MOCK_AGENCY_CLIENT: User = {
  id: "user-2",
  name: "Client Brand Manager",
  email: "client@brand.com",
  avatar: "👤",
  accountType: "agency",
  role: "client",
  accountId: "agency-1",
  brandId: "brand-1",
  analyticsLayout: {
    sections: DEFAULT_ANALYTICS_SECTIONS,
    sortBy: "best",
    isLocked: true, // Clients can't customize
    platformsHidden: [],
  },
};

// Mock user for single-business
export const MOCK_SINGLE_BUSINESS_ADMIN: User = {
  id: "user-3",
  name: "Business Owner",
  email: "owner@business.com",
  avatar: "👤",
  accountType: "single-business",
  role: "admin",
  accountId: "single-1",
  analyticsLayout: {
    sections: DEFAULT_ANALYTICS_SECTIONS,
    sortBy: "best",
    isLocked: false,
    platformsHidden: [],
  },
};
