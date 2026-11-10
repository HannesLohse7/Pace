import { supabase } from '@/lib/supabase/client';
import type { WearableConnectionStatus } from '@/lib/wearables/types';

/**
 * `null` means no `wearable_connection` row exists yet for this athlete/
 * provider (never connected) — distinct from a real `'disconnected'` row
 * (connected once, then disconnected from Profile). Both render the same
 * "Connect" UI today, same distinction `fetchGoogleCalendarStatus.ts`
 * keeps for the same reason.
 */
export async function fetchAppleHealthConnectionStatus(
  athleteId: string,
): Promise<WearableConnectionStatus | null> {
  const { data, error } = await supabase
    .from('wearable_connection')
    .select('status')
    .eq('athlete_id', athleteId)
    .eq('provider', 'apple_health')
    .maybeSingle();

  if (error) throw error;
  return (data?.status as WearableConnectionStatus | undefined) ?? null;
}
