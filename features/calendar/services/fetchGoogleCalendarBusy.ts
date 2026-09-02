import { supabase } from '@/lib/supabase/client';
import type { CalendarBusyBlock } from '@/lib/calendar/types';

/**
 * Checks the athlete's connected Google Calendar for busy blocks inside
 * a time window (e.g. a workout's scheduled start/end) via the
 * `google-calendar-freebusy` Edge Function. No UI calls this yet — see
 * docs/ROADMAP.md, this round shipped the connect flow and a working
 * backend, with surfacing conflicts on Training/Workout Detail left as a
 * follow-up (a real UI/UX decision — where and how to show a conflict —
 * not something to fold into this round's scope).
 *
 * Throws on failure (network, not-connected, Google error) rather than
 * returning an empty array — a caller checking `.length === 0` for "no
 * conflict" must not be able to confuse "checked, found nothing" with
 * "couldn't check."
 */
export async function fetchGoogleCalendarBusy(
  timeMin: string,
  timeMax: string,
): Promise<CalendarBusyBlock[]> {
  const { data, error } = await supabase.functions.invoke<{
    busy?: CalendarBusyBlock[];
    error?: string;
  }>('google-calendar-freebusy', {
    method: 'POST',
    body: { timeMin, timeMax },
  });

  if (error) throw error;
  if (!data?.busy) throw new Error(data?.error ?? 'Could not check Google Calendar.');
  return data.busy;
}
