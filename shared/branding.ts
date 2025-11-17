export interface WhiteLabelConfig {
  id: string;
  agencyId: string;
  isActive: boolean;
  
  // Brand Identity
  branding: {
    companyName: string;
    logoUrl?: string;
    logoText?: string; // Fallback if no logo
    favicon?: string;
    tagline?: string;
  };
  
  // Color Scheme
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  
  // Domain & URLs
  domain: {
    custom: string; // e.g., "brand.agency.com" or "clients.myagency.com"
    subdomain?: string; // e.g., "nike" for "nike.myagency.com"
    isPrimary: boolean;
  };
  
  // Footer & Legal
  footer: {
    copyrightText: string;
    showPoweredBy: boolean; // "Powered by Aligned AI"
    customLinks: Array<{
      label: string;
      url: string;
      openInNewTab: boolean;
    }>;
    supportEmail?: string;
    privacyPolicyUrl?: string;
    termsOfServiceUrl?: string;
  };
  
  // Email Templates
  email: {
    fromName: string;
    fromEmail: string;
    replyTo?: string;
    headerColor: string;
    footerText: string;
    logoUrl?: string;
  };
  
  // Feature Visibility
  features: {
    hideAlignedAIBranding: boolean;
    customLoginPage: boolean;
    customDashboardTitle: string;
    allowClientBranding: boolean; // If clients can see their own brand colors
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface BrandingTheme {
  name: string;
  colors: WhiteLabelConfig['colors'];
  description: string;
  preview: string; // CSS snippet or color palette preview
}

export interface WhiteLabelRequest {
  config: Partial<WhiteLabelConfig>;
  previewMode?: boolean;
}

export interface WhiteLabelResponse {
  success: boolean;
  config?: WhiteLabelConfig;
  previewUrl?: string;
  error?: string;
}

// Predefined theme templates
export const BRANDING_THEMES: BrandingTheme[] = [
  {
    name: 'Professional Blue',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#3b82f6',
      background: '#ffffff',
      surface: '#f8fafc',
      text: {
        primary: '#0f172a',
        secondary: '#475569',
        muted: '#94a3b8'
      },
      border: '#e2e8f0',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626'
    },
    description: 'Clean, corporate look perfect for B2B agencies',
    preview: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
  },
  {
    name: 'Creative Purple',
    colors: {
      primary: '#7c3aed',
      secondary: '#6b7280',
      accent: '#a855f7',
      background: '#ffffff',
      surface: '#faf5ff',
      text: {
        primary: '#1f2937',
        secondary: '#4b5563',
        muted: '#9ca3af'
      },
      border: '#e5e7eb',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    description: 'Bold and creative for design-focused agencies',
    preview: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
  },
  {
    name: 'Modern Dark',
    colors: {
      primary: '#06b6d4',
      secondary: '#64748b',
      accent: '#0891b2',
      background: '#0f172a',
      surface: '#1e293b',
      text: {
        primary: '#f1f5f9',
        secondary: '#cbd5e1',
        muted: '#64748b'
      },
      border: '#334155',
      success: '#22c55e',
      warning: '#eab308',
      error: '#f87171'
    },
    description: 'Sleek dark theme for tech-savvy agencies',
    preview: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
  }
];
