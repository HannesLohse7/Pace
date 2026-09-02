import { supabase } from '@/lib/supabase/client';
import type { CalendarConnectionStatus } from '@/lib/calendar/types';

/** `null` means no `calendar_connection` row exists yet (never connected) — distinct from a real `'disconnected'` row (connected once, then disconnected). Both render the same "Connect" UI today, but the distinction is real and worth keeping rather than collapsing to a boolean. */
export async function fetchGoogleCalendarStatus(
  athleteId: string,
): Promise<CalendarConnectionStatus | null> {
  const { data, error } = await supabase
    .from('calendar_connection')
    .select('status')
    .eq('athlete_id', athleteId)
    .eq('provider', 'google')
    .maybeSingle();

  if (error) throw error;
  return (data?.status as CalendarConnectionStatus | undefined) ?? null;
}
