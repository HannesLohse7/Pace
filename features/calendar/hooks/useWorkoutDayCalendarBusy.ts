import { useQuery } from '@tanstack/react-query';

import { addDays, fromIsoDate } from '@/shared/utils/date';

import { fetchGoogleCalendarBusy } from '../services/fetchGoogleCalendarBusy';
import { useGoogleCalendarConnectionStatus } from './useGoogleCalendarConnectionStatus';

/**
 * Whether the athlete's connected Google Calendar has anything on
 * `scheduledDate` ('YYYY-MM-DD') — day-granularity only, deliberately not
 * a true time-of-day conflict check. `workout.scheduled_date` is a date
 * with no time of day anywhere in this schema (see docs/DATABASE.md), so
 * there's no workout start/end to compare a calendar event's start/end
 * against — "this exact slot is free" isn't a claim this app can honestly
 * make yet, only "something's on your calendar that day." See
 * docs/ROADMAP.md for what a real time-level check would need.
 *
 * Only queries at all once the athlete has a connected calendar and a
 * date to check — a disconnected athlete never sees a loading flash or a
 * spurious "not connected" error, and this hook never nudges anyone to
 * connect (that's Profile's job, not Workout Detail's). Pass `undefined`
 * for `scheduledDate` (e.g. a rest day, where there's no workout to plan
 * around) to skip the check entirely rather than calling this
 * conditionally — hooks can't be called conditionally.
 */
export function useWorkoutDayCalendarBusy(
  athleteId: string | undefined,
  scheduledDate: string | undefined,
) {
  const connectionQuery = useGoogleCalendarConnectionStatus(athleteId);
  const isConnected = connectionQuery.data === 'connected';

  const busyQuery = useQuery({
    queryKey: ['google-calendar-day-busy', athleteId, scheduledDate],
    queryFn: () => {
      const dayStart = fromIsoDate(scheduledDate!);
      const dayEnd = addDays(dayStart, 1);
      return fetchGoogleCalendarBusy(dayStart.toISOString(), dayEnd.toISOString());
    },
    enabled: isConnected && Boolean(scheduledDate),
    // A workout screen reopened a minute later shouldn't re-hit Google
    // for a signal this soft — five minutes is generous enough that nothing
    // meaningful is lost by not refetching, and cheap on the athlete's
    // Google API quota (shared across every athlete using this feature).
    staleTime: 5 * 60 * 1000,
  });

  return {
    isConnected,
    eventCount: busyQuery.data?.length,
  };
}
