/**
 * Date Utilities for POSTD
 * 
 * Handles timezone-aware date operations for:
 * - Converting UTC timestamps to local dates
 * - Calendar date boundaries
 * - Schedule time display
 * 
 * All database timestamps are stored as UTC (TIMESTAMPTZ).
 * All display should convert to user's local timezone.
 */

/**
 * Get the local date string (YYYY-MM-DD) from a UTC timestamp
 * Correctly handles timezone offset to ensure date boundaries are respected
 * 
 * @example
 * // If user is in UTC-6 and timestamp is "2024-01-15T02:00:00Z"
 * // This is actually Jan 14 at 8 PM local time, not Jan 15
 * getLocalDateFromUtc("2024-01-15T02:00:00Z") // Returns "2024-01-14"
 */
export function getLocalDateFromUtc(utcTimestamp: string | Date | null | undefined): string | null {
  if (!utcTimestamp) return null;
  
  try {
    const date = utcTimestamp instanceof Date ? utcTimestamp : new Date(utcTimestamp);
    if (isNaN(date.getTime())) return null;
    
    // Use local date methods to get the correct local date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

/**
 * Get the local time string (HH:mm) from a UTC timestamp
 * 
 * @example
 * // If user is in UTC-6 and timestamp is "2024-01-15T14:00:00Z"
 * // Local time is 8:00 AM
 * getLocalTimeFromUtc("2024-01-15T14:00:00Z") // Returns "08:00"
 */
export function getLocalTimeFromUtc(utcTimestamp: string | Date | null | undefined): string | null {
  if (!utcTimestamp) return null;
  
  try {
    const date = utcTimestamp instanceof Date ? utcTimestamp : new Date(utcTimestamp);
    if (isNaN(date.getTime())) return null;
    
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    
    return `${hours}:${minutes}`;
  } catch {
    return null;
  }
}

/**
 * Format a UTC timestamp to local date for display
 * 
 * @example
 * formatLocalDate("2024-01-15T14:00:00Z", "short") // "Jan 15"
 * formatLocalDate("2024-01-15T14:00:00Z", "long") // "Monday, January 15, 2024"
 */
export function formatLocalDate(
  utcTimestamp: string | Date | null | undefined,
  format: "short" | "long" | "medium" = "short"
): string {
  if (!utcTimestamp) return "";
  
  try {
    const date = utcTimestamp instanceof Date ? utcTimestamp : new Date(utcTimestamp);
    if (isNaN(date.getTime())) return "";
    
    const options: Intl.DateTimeFormatOptions = 
      format === "long" ? { weekday: "long", year: "numeric", month: "long", day: "numeric" } :
      format === "medium" ? { weekday: "short", month: "short", day: "numeric" } :
      { month: "short", day: "numeric" };
    
    return date.toLocaleDateString("en-US", options);
  } catch {
    return "";
  }
}

/**
 * Create a UTC timestamp from local date and time strings
 * Used when scheduling content
 * 
 * @example
 * createUtcTimestamp("2024-01-15", "14:00") 
 * // Returns ISO string representing 2 PM local time in UTC
 */
export function createUtcTimestamp(localDate: string, localTime: string): string {
  const dateTimeStr = `${localDate}T${localTime}:00`;
  const localDateTime = new Date(dateTimeStr);
  return localDateTime.toISOString();
}

/**
 * Get date range for calendar queries
 * Returns UTC boundaries for a date range in local time
 */
export function getCalendarDateRange(
  startDate: Date,
  days: number
): { startUtc: string; endUtc: string } {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  end.setHours(23, 59, 59, 999);
  
  return {
    startUtc: start.toISOString(),
    endUtc: end.toISOString(),
  };
}

/**
 * Check if a UTC timestamp falls on a specific local date
 * Handles midnight boundary edge cases
 */
export function isOnLocalDate(
  utcTimestamp: string | Date,
  localDate: string
): boolean {
  const localDateFromUtc = getLocalDateFromUtc(utcTimestamp);
  return localDateFromUtc === localDate;
}

/**
 * Get the user's timezone offset in hours
 */
export function getTimezoneOffsetHours(): number {
  return -(new Date().getTimezoneOffset() / 60);
}

/**
 * Get the user's timezone name (e.g., "America/New_York")
 */
export function getLocalTimezoneName(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

