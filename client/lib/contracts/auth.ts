/**
 * Auth Contract Schemas
 */

import { z } from "zod";

/**
 * User profile schema
 */
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar_url: z.string().url().nullable().optional(),
  role: z.enum(["admin", "manager", "client"]).optional(),
  created_at: z.string().datetime().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * Session schema
 */
export const SessionSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number().optional(),
});

export type Session = z.infer<typeof SessionSchema>;

/**
 * Login credentials
 */
export const LoginCredentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

