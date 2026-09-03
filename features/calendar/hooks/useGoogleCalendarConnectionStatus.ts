import { useQuery } from '@tanstack/react-query';

import type { CalendarConnectionStatus } from '@/lib/calendar/types';

import { fetchGoogleCalendarStatus } from '../services/fetchGoogleCalendarStatus';

/**
 * The one query key every reader of the athlete's Google Calendar
 * connection status should use — `useConnectGoogleCalendar`'s own polling
 * included (extracted from there, behavior unchanged) — so two different
 * screens asking "is Google Calendar connected?" share one cache entry
 * instead of each holding a slightly-stale copy.
 */
function connectionQueryKey(athleteId: string | undefined) {
  return ['google-calendar-connection', athleteId] as const;
}

export interface UseGoogleCalendarConnectionStatusOptions {
  /** Poll at this interval (ms) while truthy. Omit, or pass `false`, for a one-shot fetch with no polling — the right default for a passive reader like a conflict check, as opposed to `useConnectGoogleCalendar`'s active wait-for-it-to-land polling. */
  refetchInterval?: number | false;
}

export function useGoogleCalendarConnectionStatus(
  athleteId: string | undefined,
  options: UseGoogleCalendarConnectionStatusOptions = {},
) {
  return useQuery<CalendarConnectionStatus | null>({
    queryKey: connectionQueryKey(athleteId),
    queryFn: () => fetchGoogleCalendarStatus(athleteId!),
    enabled: Boolean(athleteId),
    refetchInterval: options.refetchInterval ?? false,
  });
}
