/**
 * Auth API Functions
 */

import { apiGet, apiPost } from "../api";

// Simple user type - can be enhanced later
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface SessionResponse {
  user: UserProfile | null;
  session: {
    access_token: string;
    refresh_token: string;
  } | null;
}

/**
 * Get current authenticated user session
 */
export async function getSession(): Promise<SessionResponse> {
  return apiGet<SessionResponse>("/api/auth/session");
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const response = await apiGet<{ user: UserProfile | null }>("/api/auth/user");
  return response.user;
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  await apiPost("/api/auth/signout");
}

