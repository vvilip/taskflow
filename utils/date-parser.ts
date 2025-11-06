/**
 * Date Parser Utility
 * Intelligently parses dates from task titles
 */

interface ParseResult {
  cleanedTitle: string;
  detectedDate?: number;
}

// Weekday mappings
const WEEKDAYS_DE = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
const WEEKDAYS_EN = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Get the next occurrence of a specific weekday
 * @param targetDay - 0 (Monday) to 6 (Sunday)
 * @returns timestamp for the next occurrence of that weekday
 */
function getNextWeekday(targetDay: number): number {
  const today = new Date();
  const currentDay = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
  
  let daysUntilTarget = targetDay - currentDay;
  
  // If the target day is today or has passed this week, get next week's occurrence
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntilTarget);
  targetDate.setHours(23, 59, 59, 999);
  
  return targetDate.getTime();
}

/**
 * Parse task title for date keywords and extract them
 * @param title - The task title to parse
 * @returns Object with cleaned title and detected date
 */
export function parseTaskTitle(title: string): ParseResult {
  let cleanedTitle = title;
  let detectedDate: number | undefined;
  
  const lowerTitle = title.toLowerCase();
  
  // Check for "today" / "heute" first (higher priority)
  if (/\b(heute|today)\b/i.test(lowerTitle)) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    detectedDate = today.getTime();
    cleanedTitle = cleanedTitle.replace(/\b(heute|today)\b/gi, '').trim();
  }
  
  // Check for "tomorrow" / "morgen"
  else if (/\b(morgen|tomorrow)\b/i.test(lowerTitle)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    detectedDate = tomorrow.getTime();
    cleanedTitle = cleanedTitle.replace(/\b(morgen|tomorrow)\b/gi, '').trim();
  }
  
  // Check for German weekdays
  else {
    for (let index = 0; index < WEEKDAYS_DE.length; index++) {
      const weekday = WEEKDAYS_DE[index];
      const regex = new RegExp(`\\b${weekday}\\b`, 'gi');
      if (regex.test(lowerTitle)) {
        detectedDate = getNextWeekday(index);
        cleanedTitle = cleanedTitle.replace(regex, '').trim();
        break;
      }
    }
  }
  
  // Check for English weekdays (only if no German weekday was found)
  if (!detectedDate) {
    for (let index = 0; index < WEEKDAYS_EN.length; index++) {
      const weekday = WEEKDAYS_EN[index];
      const regex = new RegExp(`\\b${weekday}\\b`, 'gi');
      if (regex.test(lowerTitle)) {
        detectedDate = getNextWeekday(index);
        cleanedTitle = cleanedTitle.replace(regex, '').trim();
        break;
      }
    }
  }
  
  // Clean up extra spaces and trim
  cleanedTitle = cleanedTitle.replace(/\s+/g, ' ').trim();
  
  // If title is now empty, return original title without date
  if (!cleanedTitle && title.trim()) {
    return {
      cleanedTitle: title.trim(),
      detectedDate,
    };
  }
  
  return {
    cleanedTitle,
    detectedDate,
  };
}

/**
 * Format a date to a readable string
 * @param timestamp - Unix timestamp
 * @returns Formatted date string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
