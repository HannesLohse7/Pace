import { supabase } from '@/lib/supabase/client';

/**
 * Flips `wearable_connection.status` to `'disconnected'` for this
 * athlete's Apple Health row. This is Pace's own record only — unlike
 * Google Calendar's disconnect, there is no token to revoke server-side,
 * because HealthKit read authorization lives entirely on-device and
 * genuinely cannot be revoked by any app, Pace included (only iOS
 * Settings → Privacy → Health can do that; see
 * `syncAppleHealthRecoverySignals.ts`'s doc comments for the same point).
 * What this *does* give the athlete: an honest way to tell Pace "stop
 * treating this as connected" — e.g. after they've revoked it on the OS
 * side themselves and noticed Pace's badge hadn't caught up (there is no
 * OS-level notification Pace could listen for instead; HealthKit doesn't
 * expose one). Re-connecting later re-requests the real permission and
 * re-syncs via `useConnectAppleHealth`, same as a first-time connect.
 */
export async function disconnectAppleHealth(athleteId: string): Promise<void> {
  const { error } = await supabase
    .from('wearable_connection')
    .update({ status: 'disconnected' })
    .eq('athlete_id', athleteId)
    .eq('provider', 'apple_health');

  if (error) throw error;
}
