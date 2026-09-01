import { supabase } from '@/lib/supabase/client';
import { addDays, fromIsoDate, mondayOnOrBefore, toIsoDate } from '@/shared/utils/date';

const WEEKS_IN_WINDOW = 12;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ProgressData {
  /**
   * One entry per of the last 12 calendar weeks (oldest first, this
   * week last), each the percentage of that week's *already-due*
   * workouts (`scheduled_date <= today`) marked `completed`. `null`
   * means there was nothing due that week to measure yet -- before the
   * athlete's plan existed, or (for the current week) before anything
   * in it has come due -- not a fabricated 0%.
   */
  weeklyConsistency: (number | null)[];
}

/**
 * Progress's one real section (2026-09-01): consistency, computed from
 * real `workout.status`/`scheduled_date` values. Everything else on
 * this screen (fitness/fatigue trend, VO2 Max/FTP/threshold-pace/CSS-
 * pace stats, monthly mileage, personal records) has no real data
 * source in the schema at all -- the fitness trend is explicitly on
 * ROADMAP.md's postponed list (CTL/ATL/TSB-style dashboards), the
 * stats need a performance-test table that doesn't exist, mileage needs
 * a distance field `workout` doesn't have, and PRs need a tracking
 * table that doesn't exist either. `ProgressScreen.tsx` shows honest
 * "coming soon" notes for all of those rather than fetching or faking
 * anything for them.
 */
export async function fetchProgress(athleteId: string): Promise<ProgressData> {
  const today = new Date();
  const todayIso = toIsoDate(today);
  const windowStart = addDays(mondayOnOrBefore(today), -(WEEKS_IN_WINDOW - 1) * 7);
  const windowStartIso = toIsoDate(windowStart);

  const { data, error } = await supabase
    .from('workout')
    .select('scheduled_date, status')
    .eq('athlete_id', athleteId)
    .gte('scheduled_date', windowStartIso)
    .lte('scheduled_date', todayIso);
  if (error) throw error;

  const buckets: { total: number; completed: number }[] = Array.from(
    { length: WEEKS_IN_WINDOW },
    () => ({ total: 0, completed: 0 }),
  );

  for (const workout of data ?? []) {
    const daysFromWindowStart = Math.round(
      (fromIsoDate(workout.scheduled_date).getTime() - windowStart.getTime()) / MS_PER_DAY,
    );
    const weekIndex = Math.min(
      WEEKS_IN_WINDOW - 1,
      Math.max(0, Math.floor(daysFromWindowStart / 7)),
    );
    const bucket = buckets[weekIndex]!;
    bucket.total += 1;
    if (workout.status === 'completed') bucket.completed += 1;
  }

  return {
    weeklyConsistency: buckets.map((b) =>
      b.total > 0 ? Math.round((b.completed / b.total) * 100) : null,
    ),
  };
}
