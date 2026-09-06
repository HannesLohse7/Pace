import { supabase } from '@/lib/supabase/client';
import { addDays, fromIsoDate, mondayOnOrBefore, toIsoDate } from '@/shared/utils/date';

import { computeTrainingLoad } from './computeTrainingLoad';
import type { DailyLoad, TrainingLoadPoint } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Matches `ProgressData.weeklyConsistency`'s own window — the two charts sit on the same screen and cover the same 12 weeks. */
const WEEKS_IN_WINDOW = 12;

export interface TrainingLoadHistory {
  /** Daily CTL/ATL/TSB series, oldest first, one point per calendar day from the athlete's first logged completion through today. Empty when nothing has been logged yet. */
  daily: TrainingLoadPoint[];
  /**
   * One CTL value per of the last `WEEKS_IN_WINDOW` calendar weeks (that
   * week's most recent computed day), oldest first — shaped for
   * `FitnessChart`'s `values` prop. Only as long as there is real
   * history: a brand-new completion history shorter than 12 weeks
   * returns fewer entries rather than zero-padding backward into weeks
   * that never happened.
   */
  weeklyFitness: number[];
}

/**
 * Builds the athlete's CTL/ATL/TSB history from real `workout_completion`
 * rows — the only real data source there is for training load today (see
 * `lib/trainingLoad/types.ts`'s own doc comment on why this is Foster
 * session-RPE, not a power/HR-based TSS). Sums same-day completions
 * (an athlete logging two sessions in one day adds their loads), then
 * zero-fills every day in between with no completion — a rest day, or a
 * day nothing was logged — so `computeTrainingLoad`'s EWMA recursion
 * never skips a day.
 */
export async function fetchTrainingLoadHistory(athleteId: string): Promise<TrainingLoadHistory> {
  const { data, error } = await supabase
    .from('workout_completion')
    .select('completed_at, actual_duration_min, perceived_effort')
    .eq('athlete_id', athleteId)
    .order('completed_at', { ascending: true });
  if (error) throw error;

  if (!data || data.length === 0) {
    return { daily: [], weeklyFitness: [] };
  }

  const loadByDate = new Map<string, number>();
  for (const row of data) {
    const dateIso = toIsoDate(new Date(row.completed_at));
    const sessionLoad = (row.actual_duration_min ?? 0) * (row.perceived_effort ?? 0);
    loadByDate.set(dateIso, (loadByDate.get(dateIso) ?? 0) + sessionLoad);
  }

  const firstDateIso = [...loadByDate.keys()].sort()[0]!;
  const today = fromIsoDate(toIsoDate(new Date()));
  const todayIso = toIsoDate(today);

  const dailyLoads: DailyLoad[] = [];
  let cursor = fromIsoDate(firstDateIso);
  while (toIsoDate(cursor) <= todayIso) {
    const dateIso = toIsoDate(cursor);
    dailyLoads.push({ date: dateIso, load: loadByDate.get(dateIso) ?? 0 });
    cursor = addDays(cursor, 1);
  }

  const daily = computeTrainingLoad(dailyLoads);

  // Weekly-sampled CTL for FitnessChart: the last computed day within
  // each of the last WEEKS_IN_WINDOW calendar weeks, oldest first. A
  // week before the completion history starts is simply absent, not
  // zero-filled -- FitnessChart only ever receives real trailing weeks.
  const windowStart = addDays(mondayOnOrBefore(today), -(WEEKS_IN_WINDOW - 1) * 7);
  const byWeekIndex = new Map<number, TrainingLoadPoint>();
  for (const point of daily) {
    const pointDate = fromIsoDate(point.date);
    if (pointDate < windowStart) continue;
    const weekIndex = Math.floor((pointDate.getTime() - windowStart.getTime()) / (7 * MS_PER_DAY));
    if (weekIndex < 0 || weekIndex >= WEEKS_IN_WINDOW) continue;
    byWeekIndex.set(weekIndex, point); // last write per week wins -- `daily` is date-ordered.
  }
  const weeklyFitness = [...byWeekIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, point]) => Math.round(point.ctl));

  return { daily, weeklyFitness };
}
