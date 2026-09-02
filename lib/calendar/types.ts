/** Matches `calendar_connection.provider`'s CHECK constraint — see docs/DATABASE.md. Only Google is real; Apple Calendar (EventKit) isn't built yet — see docs/ROADMAP.md. */
export type CalendarProvider = 'google';

export type CalendarConnectionStatus = 'connected' | 'disconnected';

/** One busy interval, as returned by Google's freebusy.query and relayed by the `google-calendar-freebusy` Edge Function. */
export interface CalendarBusyBlock {
  start: string;
  end: string;
}
