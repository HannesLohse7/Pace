import { fetchTrainingLoadHistory } from '@/lib/trainingLoad/fetchTrainingLoadHistory';
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
  /**
   * Weekly-sampled CTL ("fitness"), oldest first, from
   * `fetchTrainingLoadHistory` -- see that file and `lib/trainingLoad/
   * types.ts` for the Foster session-RPE methodology and why this can be
   * shorter than 12 entries for an athlete who hasn't logged that long.
   * Empty until the athlete has logged at least one workout completion.
   */
  weeklyFitness: number[];
}

/**
 * Progress's two real sections: consistency (`workout.status`/
 * `scheduled_date`, since 2026-09-01) and, as of 2026-09-06, the fitness
 * trend (`workout_completion`-derived CTL, see `lib/trainingLoad/`).
 * Everything else on this screen (VO2 Max/FTP/threshold-pace/CSS-pace
 * stats, monthly mileage, personal records) still has no real data
 * source in the schema at all -- the stats need a performance-test
 * table that doesn't exist, mileage needs a distance field `workout`
 * doesn't have, and PRs need a tracking table that doesn't exist either.
 * `ProgressScreen.tsx` shows honest "coming soon" notes for those rather
 * than fetching or faking anything.
 */
export async function fetchProgress(athleteId: string): Promise<ProgressData> {
  const today = new Date();
  const todayIso = toIsoDate(today);
  const windowStart = addDays(mondayOnOrBefore(today), -(WEEKS_IN_WINDOW - 1) * 7);
  const windowStartIso = toIsoDate(windowStart);

  // Independent queries (different tables, no shared filters) -- run
  // together rather than one after the other.
  const [{ data, error }, { weeklyFitness }] = await Promise.all([
    supabase
      .from('workout')
      .select('scheduled_date, status')
      .eq('athlete_id', athleteId)
      .gte('scheduled_date', windowStartIso)
      .lte('scheduled_date', todayIso),
    fetchTrainingLoadHistory(athleteId),
  ]);
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
    weeklyFitness,
  };
}
