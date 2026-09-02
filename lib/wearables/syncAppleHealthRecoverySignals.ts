import { supabase } from '@/lib/supabase/client';
import { addDays, toIsoDate } from '@/shared/utils/date';

import {
  fetchRecentHrv,
  fetchRecentRestingHeartRate,
  isAppleHealthAvailable,
  requestAppleHealthReadAccess,
  type QuantitySample,
} from './appleHealth/healthKitAdapter';

/** How many calendar days back a connect/sync pulls. Re-running it later re-covers (and upserts over) the same window rather than accumulating a growing history — fine for v1's "recent recovery" framing, not a full backfill. */
const SYNC_WINDOW_DAYS = 7;
/** Samples per query, not days — generous relative to `SYNC_WINDOW_DAYS` since some sources write more than one resting-HR/HRV sample per day; see `healthKitAdapter.ts`'s own doc comment for why this isn't a date-range filter instead. */
const SAMPLE_LIMIT = SYNC_WINDOW_DAYS * 4;

export type SyncAppleHealthResult =
  | { ok: true; daysSynced: number }
  | { ok: false; reason: 'unavailable' | 'authorization_denied' | 'write_failed' };

/**
 * Connects (or re-syncs) Apple Health as a recovery-signal source for
 * one athlete: requests read authorization for resting heart rate and
 * HRV, pulls the last `SYNC_WINDOW_DAYS` of both, averages same-day
 * samples, and upserts one `recovery_signal` row per day plus a
 * `wearable_connection` row recording the connection. Sleep isn't
 * synced yet — see `healthKitAdapter.ts`'s doc comment for why.
 *
 * Called from `features/wearables/hooks/useConnectAppleHealth.ts`, the
 * one entry point both onboarding's Wearables step and (in the future)
 * Profile use — this function itself has no UI/React dependency, same
 * "pure orchestration function, thin hook on top" split as
 * `lib/adaptation/engine/adaptAfterMissedWorkout.ts`.
 *
 * Returns a reason rather than throwing for the two expected failure
 * paths (`unavailable`: not iOS, or no Health app data; `authorization_denied`:
 * the athlete declined the permission prompt) so the caller can show an
 * honest, specific message instead of a generic error — this is a
 * permission flow, not a network call, so "something went wrong" would
 * be a worse message than the truth. `write_failed` covers the
 * Supabase-write step failing after a real HealthKit read succeeded.
 */
export async function syncAppleHealthRecoverySignals(
  athleteId: string,
): Promise<SyncAppleHealthResult> {
  const available = await isAppleHealthAvailable();
  if (!available) return { ok: false, reason: 'unavailable' };

  try {
    await requestAppleHealthReadAccess();
  } catch {
    return { ok: false, reason: 'authorization_denied' };
  }

  const [restingHr, hrv] = await Promise.all([
    fetchRecentRestingHeartRate(SAMPLE_LIMIT),
    fetchRecentHrv(SAMPLE_LIMIT),
  ]);

  const cutoffIso = toIsoDate(addDays(new Date(), -SYNC_WINDOW_DAYS));
  const restingHrByDate = averageByDate(restingHr, cutoffIso);
  const hrvByDate = averageByDate(hrv, cutoffIso);

  const dates = new Set([...restingHrByDate.keys(), ...hrvByDate.keys()]);
  if (dates.size === 0) {
    // Real connection, just nothing in the window yet (e.g. a fresh
    // Apple Watch, or a device that doesn't measure these) -- still a
    // successful connect, not a failure.
    await upsertConnection(athleteId);
    return { ok: true, daysSynced: 0 };
  }

  const rows = Array.from(dates).map((date) => ({
    athlete_id: athleteId,
    signal_date: date,
    resting_hr_bpm: restingHrByDate.has(date) ? Math.round(restingHrByDate.get(date)!) : null,
    hrv_ms: hrvByDate.get(date) ?? null,
    source: 'apple_health' as const,
  }));

  const { error: signalError } = await supabase
    .from('recovery_signal')
    .upsert(rows, { onConflict: 'athlete_id,signal_date,source' });
  if (signalError) return { ok: false, reason: 'write_failed' };

  const { error: connectionError } = await upsertConnection(athleteId);
  if (connectionError) return { ok: false, reason: 'write_failed' };

  return { ok: true, daysSynced: dates.size };
}

function upsertConnection(athleteId: string) {
  return supabase.from('wearable_connection').upsert(
    {
      athlete_id: athleteId,
      provider: 'apple_health' as const,
      status: 'connected' as const,
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: 'athlete_id,provider' },
  );
}

function averageByDate(samples: QuantitySample[], cutoffIso: string): Map<string, number> {
  const sums = new Map<string, { total: number; count: number }>();
  for (const sample of samples) {
    if (sample.date < cutoffIso) continue;
    const entry = sums.get(sample.date) ?? { total: 0, count: 0 };
    entry.total += sample.value;
    entry.count += 1;
    sums.set(sample.date, entry);
  }
  const result = new Map<string, number>();
  for (const [date, { total, count }] of sums) result.set(date, total / count);
  return result;
}
