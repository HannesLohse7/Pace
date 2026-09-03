import { fromIsoDate } from './date';

/**
 * Minutes -> a display string matching the design source's own
 * convention -- "35 min" under an hour, "1 hr 50 min" / "3 hr 00 min"
 * (always two digits, always shown even at :00) at or above an hour.
 */
export function formatDurationMinutes(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = String(minutes % 60).padStart(2, '0');
  return `${hours} hr ${remainder} min`;
}

/**
 * "Good morning" / "Good afternoon" / "Good evening" from the local hour --
 * Home's header used to hardcode "Good morning" regardless of when the
 * athlete actually opened the app, which reads as broken on an evening
 * check-in (this is the one line of copy on the app's first screen, so it's
 * also the one place a wrong-time-of-day greeting is most visible). Boundaries
 * match the common convention other fitness apps use (5am/12pm/5pm/9pm), not
 * anything in the design source -- there was no time-aware version to match.
 */
export function formatGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 5) return 'Good evening';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** e.g. "TUESDAY, JUL 15" -- Home's date-label eyebrow, always uppercase regardless of locale casing. */
export function formatDateLabel(date: Date): string {
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  return formatted.toUpperCase();
}

/** e.g. "Oct 6, 2026" -- race-date display, from an ISO 'YYYY-MM-DD' string. */
export function formatRaceDate(isoDate: string): string {
  return fromIsoDate(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** e.g. "THU" -- the short weekday label used by UpcomingList's left-hand column. */
export function formatShortWeekday(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

/** e.g. "Jun 15" -- month + day, no year, for date-range labels like Training's phase card. */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * e.g. "Today", "Yesterday", or "Jun 15" -- Workout Detail's history
 * section, from a Postgres `timestamptz` string (`adaptation_event.created_at`).
 * Falls back to `formatShortDate` beyond yesterday rather than a full
 * relative-time library, matching this app's existing date-label
 * precedent (no "3 days ago" style anywhere else in the app).
 */
export function formatEventDate(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const today = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Today';

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return formatShortDate(date);
}
