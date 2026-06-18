import {
  DEFAULT_REMINDER_TIME,
  buildReminderBody,
  formatReminderTime,
  isValidReminderTime,
} from '../reminder';

describe('buildReminderBody', () => {
  it('reports when there are no tasks for today', () => {
    expect(buildReminderBody(0)).toBe('No tasks scheduled for today');
  });

  it('uses the singular form for exactly one task', () => {
    expect(buildReminderBody(1)).toBe('You have 1 task scheduled for today');
  });

  it('uses the plural form for multiple tasks', () => {
    expect(buildReminderBody(5)).toBe('You have 5 tasks scheduled for today');
  });

  it('treats negative counts as zero', () => {
    expect(buildReminderBody(-3)).toBe('No tasks scheduled for today');
  });
});

describe('formatReminderTime', () => {
  it('zero-pads hours and minutes (24h format)', () => {
    expect(formatReminderTime({ hour: 8, minute: 5 })).toBe('08:05');
  });

  it('formats the noon default', () => {
    expect(formatReminderTime(DEFAULT_REMINDER_TIME)).toBe('12:00');
  });

  it('formats late evening times', () => {
    expect(formatReminderTime({ hour: 23, minute: 59 })).toBe('23:59');
  });
});

describe('isValidReminderTime', () => {
  it('accepts valid times', () => {
    expect(isValidReminderTime({ hour: 0, minute: 0 })).toBe(true);
    expect(isValidReminderTime({ hour: 23, minute: 59 })).toBe(true);
  });

  it('rejects out-of-range or non-integer values', () => {
    expect(isValidReminderTime({ hour: 24, minute: 0 })).toBe(false);
    expect(isValidReminderTime({ hour: -1, minute: 0 })).toBe(false);
    expect(isValidReminderTime({ hour: 12, minute: 60 })).toBe(false);
    expect(isValidReminderTime({ hour: 12.5, minute: 0 })).toBe(false);
  });
});
