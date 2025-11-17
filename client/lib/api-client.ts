/**
 * API Client Utilities
 * 
 * Provides timeout handling, retry logic, and consistent error handling
 * for all API calls in the application.
 */

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRY_DELAY = 1000; // 1 second
const DEFAULT_MAX_RETRIES = 2;

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface FetchError extends Error {
  status?: number;
  statusText?: string;
  response?: Response;
}

/**
 * Check if an error is a FetchError with a specific status code
 */
export function isFetchError(error: unknown, status?: number): error is FetchError {
  if (!(error instanceof Error)) return false;
  const fetchError = error as FetchError;
  if (status !== undefined) {
    return fetchError.status === status;
  }
  return fetchError.status !== undefined;
}

/**
 * Fetch with timeout and retry logic
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    ...fetchOptions
  } = options;

  let lastError: FetchError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: FetchError = new Error(
          `HTTP ${response.status}: ${response.statusText}`
        ) as FetchError;
        error.status = response.status;
        error.statusText = response.statusText;
        error.response = response;

        // Don't retry on 4xx errors (client errors)
        // 404 is a special case - resource doesn't exist, not a failure
        if (response.status >= 400 && response.status < 500) {
          throw error;
        }

        // Retry on 5xx errors (server errors) or network errors
        lastError = error;
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
        throw error;
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        const timeoutError: FetchError = new Error(
          `Request timeout after ${timeout}ms`
        ) as FetchError;
        lastError = timeoutError;

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
        throw timeoutError;
      }

      // Network error or other fetch error
      lastError = error as FetchError;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("Request failed after retries");
}

/**
 * Fetch JSON with timeout and retry
 */
export async function fetchJSON<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  try {
    const text = await response.text();
    if (!text) {
      throw new Error("Empty response");
    }
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

