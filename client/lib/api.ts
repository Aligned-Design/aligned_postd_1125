/**
 * Centralized API utility
 * Automatically adds Authorization header to all API requests
 */

/**
 * Get the current access token from localStorage
 */
function getAccessToken(): string | null {
  return localStorage.getItem("aligned_access_token");
}

/**
 * Make an authenticated API request
 * Automatically includes Authorization header if token is available
 */
export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  
  const headers = new Headers(options.headers);
  
  // Set Content-Type if not already set and body is provided
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  
  // Add Authorization header if token is available
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  return response;
}

/**
 * Make an authenticated API request and parse JSON response
 */
export async function apiRequestJson<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiRequest(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: {
        message: `Request failed with status ${response.status}`,
        status: response.status,
      },
    }));
    
    const errorMessage =
      errorData?.error?.message ||
      errorData?.message ||
      `Request failed with status ${response.status}`;
    
    throw new Error(errorMessage);
  }
  
  return response.json();
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(url: string): Promise<T> {
  return apiRequestJson<T>(url, { method: "GET" });
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  url: string,
  body?: any
): Promise<T> {
  return apiRequestJson<T>(url, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(url: string, body?: any): Promise<T> {
  return apiRequestJson<T>(url, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T = any>(
  url: string,
  body?: any
): Promise<T> {
  return apiRequestJson<T>(url, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(url: string): Promise<T> {
  return apiRequestJson<T>(url, { method: "DELETE" });
}

