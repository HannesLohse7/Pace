/**
 * Formats a `Date` as a local-calendar-date ISO string ('YYYY-MM-DD') --
 * the same shape the onboarding store's `raceDate` field and this app's
 * `date` Postgres columns use everywhere. Deliberately built from the
 * Date object's local getters (not `.toISOString()`, which is UTC and
 * can roll the date backward/forward by one for anyone not at UTC+0).
 */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses a Postgres `date` column value ('YYYY-MM-DD') back into a local `Date` at midnight. */
export function fromIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** The Monday on or before `date` -- start of the calendar week it falls in (weeks are Mon-Sun throughout this app). */
export function mondayOnOrBefore(date: Date): Date {
  // Date#getDay(): 0=Sun..6=Sat.
  const offsetFromMonday = (date.getDay() + 6) % 7;
  return addDays(date, -offsetFromMonday);
}
