/* eslint-disable */
/**
 * User-Friendly Error Messages
 * 
 * Converts technical errors into human-readable, actionable messages
 */

export interface UserFriendlyError {
  title: string;
  message: string;
  action: string;
  severity: "error" | "warning" | "info";
  helpLink?: string;
}

export const ERROR_MESSAGES: Record<string, UserFriendlyError> = {
  // Brand Creation Errors
  BRAND_CREATION_DUPLICATE_SLUG: {
    title: "Brand name already in use",
    message: "You already have a brand with this name. We've automatically added a number to make it unique (e.g., 'My Brand 2').",
    action: "Try again or choose a different name",
    severity: "info",
  },
  
  BRAND_CREATION_FAILED: {
    title: "Couldn't create your brand",
    message: "Something went wrong while creating your brand. This usually happens if there's a connection issue.",
    action: "Check your internet connection and try again. If this persists, contact support.",
    severity: "error",
    helpLink: "/help/brand-creation",
  },
  
  BRAND_CREATION_MISSING_TENANT: {
    title: "Account setup incomplete",
    message: "We need to finish setting up your account before creating a brand.",
    action: "Please go back to complete your account setup, or refresh the page.",
    severity: "warning",
  },

  // Website Scraping Errors
  WEBSITE_SCRAPE_FAILED: {
    title: "Couldn't scan your website",
    message: "We had trouble accessing your website. This might be because it's password-protected, temporarily unavailable, or has security restrictions.",
    action: "You can continue with manual setup, or try again later.",
    severity: "warning",
  },
  
  WEBSITE_SCRAPE_TIMEOUT: {
    title: "Website scan is taking longer than expected",
    message: "We're still working on scanning your website. This can happen with larger sites or slower connections.",
    action: "Please wait a moment, or click 'Skip to manual setup' to continue.",
    severity: "info",
  },
  
  WEBSITE_SCRAPE_INVALID_URL: {
    title: "Invalid website URL",
    message: "That doesn't look like a valid website URL. Make sure it starts with http:// or https://, or just enter the domain name (e.g., example.com).",
    action: "Try entering your website URL again, or click 'Skip to manual setup'.",
    severity: "warning",
  },

  // Content Generation Errors
  CONTENT_GENERATION_FAILED: {
    title: "Content generation is taking longer than expected",
    message: "We're still working on your content. This can happen if our AI is processing a lot of requests.",
    action: "Please wait a moment, or refresh the page. Your content will be saved when it's ready.",
    severity: "info",
  },
  
  CONTENT_GENERATION_ERROR: {
    title: "Couldn't generate content",
    message: "Something went wrong while creating your content. This is usually temporary.",
    action: "Try again in a moment. If this keeps happening, contact support.",
    severity: "error",
    helpLink: "/help/content-generation",
  },

  // Authentication Errors
  AUTH_FAILED: {
    title: "Sign in failed",
    message: "We couldn't sign you in. Please check your email and password, or try signing in with a magic link.",
    action: "Try again, or use the 'Forgot password' link if you need to reset your password.",
    severity: "error",
  },
  
  AUTH_SESSION_EXPIRED: {
    title: "Your session expired",
    message: "For security, you've been signed out after a period of inactivity.",
    action: "Please sign in again to continue.",
    severity: "info",
  },

  // Network Errors
  NETWORK_ERROR: {
    title: "Connection problem",
    message: "We couldn't reach our servers. Please check your internet connection.",
    action: "Check your connection and try again.",
    severity: "error",
  },
  
  NETWORK_TIMEOUT: {
    title: "Request timed out",
    message: "The request took too long to complete. This might be due to a slow connection.",
    action: "Try again, or check your internet connection.",
    severity: "warning",
  },

  // Generic Errors
  UNKNOWN_ERROR: {
    title: "Something went wrong",
    message: "An unexpected error occurred. Don't worry—your data is safe.",
    action: "Try refreshing the page, or contact support if this keeps happening.",
    severity: "error",
    helpLink: "/help",
  },
  
  VALIDATION_ERROR: {
    title: "Please check your input",
    message: "Some of the information you entered needs to be corrected.",
    action: "Review the highlighted fields and try again.",
    severity: "warning",
  },
};

/**
 * Convert a technical error into a user-friendly message
 */
export function getUserFriendlyError(
  error: Error | string | unknown,
  context?: string
): UserFriendlyError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorKey = error instanceof Error ? (error as any).code : undefined;
  
  // Check for specific error codes
  if (errorKey && ERROR_MESSAGES[errorKey]) {
    return ERROR_MESSAGES[errorKey];
  }
  
  // Check error message for keywords
  const lowerMessage = errorMessage.toLowerCase();
  
  if (lowerMessage.includes("duplicate") || lowerMessage.includes("unique constraint")) {
    if (context === "brand") {
      return ERROR_MESSAGES.BRAND_CREATION_DUPLICATE_SLUG;
    }
  }
  
  if (lowerMessage.includes("network") || lowerMessage.includes("fetch") || lowerMessage.includes("connection")) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  if (lowerMessage.includes("timeout")) {
    return ERROR_MESSAGES.NETWORK_TIMEOUT;
  }
  
  if (lowerMessage.includes("auth") || lowerMessage.includes("unauthorized") || lowerMessage.includes("session")) {
    return ERROR_MESSAGES.AUTH_SESSION_EXPIRED;
  }
  
  if (lowerMessage.includes("validation") || lowerMessage.includes("invalid")) {
    return ERROR_MESSAGES.VALIDATION_ERROR;
  }
  
  // Default to unknown error
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Format error for display in UI
 */
export function formatErrorForUI(error: Error | string | unknown, context?: string): {
  title: string;
  message: string;
  action: string;
  severity: "error" | "warning" | "info";
  helpLink?: string;
} {
  return getUserFriendlyError(error, context);
}

