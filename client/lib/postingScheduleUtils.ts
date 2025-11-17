/**
 * Posting Schedule Utilities
 * 
 * Helper functions for checking if a scheduled time matches preferred posting schedule.
 * Used for suggestions only, not blocking.
 */

export interface PreferredPostingSchedule {
  preferredDays: string[]; // e.g., ['mon', 'tue', 'thu']
  preferredWindows: {
    [day: string]: Array<{ start: string; end: string }>; // e.g., { 'mon': [{ start: '09:00', end: '17:00' }] }
  };
}

/**
 * Get day of week abbreviation from a Date
 */
function getDayAbbrev(date: Date): string {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[date.getDay()];
}

/**
 * Convert time string (HH:mm) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if a scheduled date/time is within preferred posting schedule
 * Returns suggestion info if outside preferences
 */
export function checkPreferredSchedule(
  scheduledAt: Date | string,
  schedule?: PreferredPostingSchedule | null
): {
  isPreferred: boolean;
  suggestion?: string;
} {
  // If no schedule configured, everything is preferred
  if (!schedule || schedule.preferredDays.length === 0) {
    return { isPreferred: true };
  }

  const date = typeof scheduledAt === 'string' ? new Date(scheduledAt) : scheduledAt;
  const dayAbbrev = getDayAbbrev(date);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const timeMinutes = timeToMinutes(timeStr);

  // Check if day is preferred
  const isPreferredDay = schedule.preferredDays.includes(dayAbbrev);
  
  if (!isPreferredDay) {
    return {
      isPreferred: false,
      suggestion: `This is outside your preferred posting days. You typically post on ${schedule.preferredDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}.`,
    };
  }

  // Check if time is within preferred windows for this day
  const windows = schedule.preferredWindows[dayAbbrev] || [];
  
  // If no time windows set for this day, any time is preferred
  if (windows.length === 0) {
    return { isPreferred: true };
  }

  // Check if time falls within any preferred window
  const isInWindow = windows.some(window => {
    const startMinutes = timeToMinutes(window.start);
    const endMinutes = timeToMinutes(window.end);
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  });

  if (!isInWindow) {
    const windowStr = windows.map(w => `${w.start}–${w.end}`).join(' or ');
    return {
      isPreferred: false,
      suggestion: `This time is outside your preferred posting window for ${dayName} (${windowStr}).`,
    };
  }

  return { isPreferred: true };
}

