/**
 * Client Settings types and validation
 * Email preferences, notification settings, and account preferences for clients
 */

import { z } from 'zod';

// ==================== EMAIL PREFERENCES ====================

export type EmailNotificationType =
  | 'approvals_needed'
  | 'approval_reminders'
  | 'publish_failures'
  | 'publish_success'
  | 'weekly_digest'
  | 'daily_digest';

export type NotificationFrequency = 'immediate' | 'digest' | 'never';
export type DigestFrequency = 'daily' | 'weekly' | 'never';
export type ReminderFrequency = 'immediate' | '24h' | '48h' | 'weekly';

export interface EmailPreferences {
  // Notification toggles
  approvalsNeeded: boolean;
  approvalReminders: boolean;
  publishFailures: boolean;
  publishSuccess: boolean;
  weeklyDigest: boolean;
  dailyDigest: boolean;

  // Frequency settings
  reminderFrequency: ReminderFrequency;
  digestFrequency: DigestFrequency;

  // Rate limiting
  maxEmailsPerDay: number;
}

export interface ClientSettings {
  id: string;
  clientId: string;
  brandId: string;

  // Email preferences
  emailPreferences: EmailPreferences;

  // Account preferences
  timezone: string;
  language: 'en' | 'es' | 'fr' | 'de';

  // Unsubscribe
  unsubscribeToken?: string;
  unsubscribedFromAll: boolean;
  unsubscribedTypes: EmailNotificationType[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  lastModifiedBy?: string;
}

// ==================== ZOD VALIDATION ====================

const EmailPreferencesSchema = z.object({
  approvalsNeeded: z.boolean().default(true),
  approvalReminders: z.boolean().default(true),
  publishFailures: z.boolean().default(true),
  publishSuccess: z.boolean().default(false),
  weeklyDigest: z.boolean().default(false),
  dailyDigest: z.boolean().default(false),

  reminderFrequency: z.enum(['immediate', '24h', '48h', 'weekly']).default('24h'),
  digestFrequency: z.enum(['daily', 'weekly', 'never']).default('weekly'),

  maxEmailsPerDay: z.number().int().min(1).max(100).default(20),
});

export const ClientSettingsSchema = z.object({
  clientId: z.string().min(1),
  brandId: z.string().min(1),

  emailPreferences: EmailPreferencesSchema,

  timezone: z.string().default('America/New_York'),
  language: z.enum(['en', 'es', 'fr', 'de']).default('en'),

  unsubscribeToken: z.string().optional(),
  unsubscribedFromAll: z.boolean().default(false),
  unsubscribedTypes: z.array(z.string()).default([]),
});

export const UpdateClientSettingsSchema = ClientSettingsSchema.partial().omit({
  clientId: true,
  brandId: true,
});

export type CreateClientSettingsInput = z.infer<typeof ClientSettingsSchema>;
export type UpdateClientSettingsInput = z.infer<typeof UpdateClientSettingsSchema>;

// ==================== API RESPONSE TYPES ====================

export interface ClientSettingsResponse {
  success: boolean;
  settings: ClientSettings;
  message?: string;
}

export interface ClientSettingsListResponse {
  success: boolean;
  settings: ClientSettings[];
  total: number;
}

// ==================== UNSUBSCRIBE MANAGEMENT ====================

export interface UnsubscribeRequest {
  unsubscribeToken: string;
  fromType?: EmailNotificationType; // If not provided, unsubscribe from all
}

export interface UnsubscribeResponse {
  success: boolean;
  message: string;
  unsubscribedFromAll?: boolean;
  unsubscribedTypes?: EmailNotificationType[];
}

// ==================== DEFAULTS ====================

export const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
  approvalsNeeded: true,
  approvalReminders: true,
  publishFailures: true,
  publishSuccess: false,
  weeklyDigest: false,
  dailyDigest: false,

  reminderFrequency: '24h',
  digestFrequency: 'weekly',

  maxEmailsPerDay: 20,
};

export const DEFAULT_CLIENT_SETTINGS: Omit<ClientSettings, 'id' | 'clientId' | 'brandId' | 'createdAt' | 'updatedAt'> = {
  emailPreferences: DEFAULT_EMAIL_PREFERENCES,
  timezone: 'America/New_York',
  language: 'en',
  unsubscribedFromAll: false,
  unsubscribedTypes: [],
};

// ==================== TIMEZONE OPTIONS ====================

export const TIMEZONE_OPTIONS = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Australia/Sydney',
  'Australia/Melbourne',
];

// ==================== LANGUAGE OPTIONS ====================

export const LANGUAGE_OPTIONS: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};
