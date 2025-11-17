import { useState, useEffect, useCallback } from "react";
import { BrandIntelligence } from "@shared/brand-intelligence";

interface UseBrandIntelligenceReturn {
  intelligence: BrandIntelligence | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  submitFeedback: (
    recommendationId: string,
    action: "accepted" | "rejected",
  ) => Promise<void>;
}

interface ApiErrorResponse {
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
  message?: string;
}

/**
 * Safely parses JSON response with defensive checks
 * Validates content-type header and handles JSON parsing errors gracefully
 * @param response Fetch response object
 * @returns Parsed JSON data or throws descriptive error
 */
async function safeJsonParse(response: unknown): Promise<unknown> {
  // Helper to read content-type from Headers-like or plain object
  const getContentType = () => {
    try {
      if (response && ((response as any).headers)) {
        if (typeof ((response as any).headers).get === "function") {
          return ((response as any).headers).get("content-type") || "";
        }
        if (typeof ((response as any).headers)["content-type"] === "string") {
          return ((response as any).headers)["content-type"];
        }
      }
    } catch (_e) {
      // ignore
    }
    return "";
  };

  const contentType = getContentType();

  // If content-type explicitly not JSON, prefer to read text and throw
  if (contentType && !contentType.includes("application/json")) {
    if (typeof (response as Response).text === "function") {
      const bodyText = await (response as Response).text();
      const preview = bodyText.slice(0, 300).replace(/\s+/g, " ");
      throw new Error(
        `Invalid response format: expected JSON but got ${contentType || "no content-type header"}. Response preview: ${preview}`,
      );
    }
    throw new Error(
      `Invalid response format: expected JSON but got ${contentType || "no content-type header"}.`,
    );
  }

  // If response.json exists, try it first (covers native Response and many mocks)
  if (response && typeof (response as Response).json === "function") {
    try {
      return await (response as Response).json();
    } catch (jsonErr) {
      // If json() fails, try to fallback to text and parse
      if (typeof (response as Response).text === "function") {
        const bodyText = await (response as Response).text();
        const preview = bodyText.slice(0, 500).replace(/\s+/g, " ");
        try {
          return JSON.parse(bodyText);
        } catch (parseErr) {
          throw new Error(
            `Failed to parse JSON: ${parseErr instanceof Error ? parseErr.message : "unknown error"}. Body preview: ${preview}`,
          );
        }
      }
      throw new Error(
        `Failed to parse JSON: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}`,
      );
    }
  }

  // If only text() is available, attempt to parse it
  if (response && typeof (response as Response).text === "function") {
    const bodyText = await (response as Response).text();
    const preview = bodyText.slice(0, 500).replace(/\s+/g, " ");
    try {
      return JSON.parse(bodyText);
    } catch (parseErr) {
      throw new Error(
        `Failed to parse JSON from text response: ${parseErr instanceof Error ? parseErr.message : "unknown error"}. Body preview: ${preview}`,
      );
    }
  }

  // Last resort: return response as-is if it appears to be a plain object
  if (response && typeof response === "object") {
    return response;
  }

  throw new Error("Response does not support json() or text() parsing");
}

/**
 * Extracts user-friendly error message from various error sources
 * @param err Error object, API response, or unknown error
 * @returns User-friendly error message suitable for display
 */
function getErrorMessage(err: unknown): string {
  // Handle Error objects
  if (err instanceof Error) {
    return err.message;
  }

  // Handle API error response objects
  if (typeof err === "object" && err !== null) {
    const apiError = err as ApiErrorResponse;
    return apiError.error || apiError.message || "An unknown error occurred";
  }

  // Fallback
  return "An unknown error occurred. Please try again.";
}

export function useBrandIntelligence(
  brandId: string,
): UseBrandIntelligenceReturn {
  const [intelligence, setIntelligence] = useState<BrandIntelligence | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBrandIntelligence = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Make request with explicit JSON acceptance, using configured API base URL
      const envBase = import.meta.env.VITE_API_BASE_URL ?? "/api";
      // When running in remote preview, a client-side env pointing to localhost isn't reachable from the browser.
      // Prefer a relative `/api` path when the configured base targets localhost (dev machine).
      const apiBase =
        envBase.startsWith("http") &&
        (envBase.includes("localhost") || envBase.includes("127.0.0.1"))
          ? "/api"
          : envBase.replace(/\/$/, "");
      const response = await fetch(
        `${apiBase}/brand-intelligence/${encodeURIComponent(brandId)}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      // Log response diagnostics for debugging
      const respContentType =
        response && (response as Response).headers
          ? (response as Response).headers.get("content-type") || ""
          : "";
      console.debug(
        "[Brand Intelligence] fetch response status:",
        response.status,
        "content-type:",
        respContentType,
      );

      // Handle non-OK status codes
      if (!response.ok) {
        // Try to parse error response as JSON first
        let errorData: unknown;
        try {
          errorData = await safeJsonParse(response);
        } catch (_parseErr) {
          // If JSON parsing fails, attempt to read text body for debugging and include URL
          let bodyPreview = "";
          try {
            bodyPreview = await response.text();
          } catch (_e) {
            bodyPreview = "<unable to read response body>";
          }
          const preview = bodyPreview.slice(0, 500).replace(/\s+/g, " ");
          throw new Error(
            `HTTP ${response.status}: ${response.statusText || response.url}. Response preview: ${preview}`,
          );
        }

        // Handle specific HTTP status codes with friendly messages for auth/permission/not found
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in.");
        } else if (response.status === 403) {
          throw new Error(
            "You do not have permission to view this brand intelligence.",
          );
        } else if (response.status === 404) {
          throw new Error("Brand intelligence data not found.");
        } else if (response.status >= 500) {
          // For server errors prefer returning the HTTP status message to the caller
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Try to extract error message from API response
        const apiError = errorData as ApiErrorResponse;
        throw new Error(
          apiError.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      // Parse successful response with validation
      const data = await safeJsonParse(response);
      setIntelligence(data as BrandIntelligence);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);

      // Comprehensive error logging for debugging — ensure objects are stringified to avoid `[object Object]`
      try {
        const serializedError = (function stringifySafe(value: unknown) {
          try {
            return JSON.stringify(value, (_k, v) => {
              // Convert functions to their names, handle Error objects
              if (v instanceof Error) {
                return { message: v.message, stack: v.stack };
              }
              if (typeof v === "function")
                return `[Function: ${v.name || "anonymous"}]`;
              return v;
            });
          } catch (_e) {
            return String(value);
          }
        })(err);

        console.error(`[Brand Intelligence] Error: ${serializedError}`, {
          message: errorMessage,
          brandId,
          timestamp: new Date().toISOString(),
        });
      } catch (logErr) {
        // Fallback logging
        console.error(
          "[Brand Intelligence] Error (logging failed):",
          String(logErr),
        );
        console.error("[Brand Intelligence] Original error:", err);
      }

      // Log to telemetry/monitoring service if available
      if (typeof window !== "undefined") {
        const telemetry = (window as { __telemetry?: { error?: (event: string, data: unknown) => void } }).__telemetry;
        if (telemetry?.error) {
          telemetry.error("brand_intelligence_fetch_failed", {
            message: errorMessage,
            brandId,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  const submitFeedback = useCallback(
    async (recommendationId: string, action: "accepted" | "rejected") => {
      try {
        const response = await fetch("/api/brand-intelligence/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recommendationId, action }),
        });

        if (!response.ok) {
          // Try to parse error response
          let errorData: unknown;
          try {
            errorData = await safeJsonParse(response);
          } catch (_parseErr) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const apiError = errorData as ApiErrorResponse;
          throw new Error(apiError.error || "Failed to submit feedback");
        }

        // Verify response is valid JSON
        await safeJsonParse(response);

        // Reload data after successful feedback
        await loadBrandIntelligence();
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);

        try {
          const serializedError = (function stringifySafe(value: unknown) {
            try {
              return JSON.stringify(value, (_k, v) => {
                if (v instanceof Error) {
                  return { message: v.message, stack: v.stack };
                }
                if (typeof v === "function")
                  return `[Function: ${v.name || "anonymous"}]`;
                return v;
              });
            } catch (e) {
              return String(value);
            }
          })(err);

          console.error(
            `[Brand Intelligence Feedback] Error: ${serializedError}`,
            {
              message: errorMessage,
              recommendationId,
              action,
              timestamp: new Date().toISOString(),
            },
          );
        } catch (logErr) {
          console.error(
            "[Brand Intelligence Feedback] Error (logging failed):",
            String(logErr),
          );
          console.error("[Brand Intelligence Feedback] Original error:", err);
        }

        if (typeof window !== "undefined") {
          const telemetry = (window as { __telemetry?: { error?: (event: string, data: unknown) => void } }).__telemetry;
          if (telemetry?.error) {
            telemetry.error(
              "brand_intelligence_feedback_failed",
              {
                message: errorMessage,
                recommendationId,
                timestamp: new Date().toISOString(),
              },
            );
          }
        }
      }
    },
    [loadBrandIntelligence],
  );

  useEffect(() => {
    loadBrandIntelligence();
  }, [loadBrandIntelligence]);

  return {
    intelligence,
    loading,
    error,
    refresh: loadBrandIntelligence,
    submitFeedback,
  };
}
