/**
 * Daily reminder helpers
 *
 * Pure, platform-independent logic for the daily task reminder so it can be
 * unit-tested without the native notifications module.
 */

export interface ReminderTime {
  /** Hour of day in 24h format (0-23). */
  hour: number;
  /** Minute of hour (0-59). */
  minute: number;
}

/** Default reminder time: 12:00 (noon). */
export const DEFAULT_REMINDER_TIME: ReminderTime = { hour: 12, minute: 0 };

/**
 * Build the reminder notification body, reflecting how many tasks are
 * scheduled for today.
 */
export function buildReminderBody(taskCount: number): string {
  if (!Number.isFinite(taskCount) || taskCount <= 0) {
    return 'No tasks scheduled for today';
  }
  const noun = taskCount === 1 ? 'task' : 'tasks';
  return `You have ${taskCount} ${noun} scheduled for today`;
}

/** Format a reminder time as a zero-padded 24h string, e.g. "08:05". */
export function formatReminderTime({ hour, minute }: ReminderTime): string {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Validate that a reminder time has in-range, integer hour and minute. */
export function isValidReminderTime(time: ReminderTime): boolean {
  const { hour, minute } = time;
  return (
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}
