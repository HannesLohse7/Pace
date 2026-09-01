import { supabase } from '@/lib/supabase/client';
import type { Tables } from '@/lib/supabase/types';
import { addDays, mondayOnOrBefore, toIsoDate } from '@/shared/utils/date';

export type WorkoutRow = Tables<'workout'>;
export type TrainingPhaseRow = Tables<'training_phase'>;

export interface TrainingWeekData {
  /** Null when the athlete has no active plan yet -- see generateTrainingPlan's own scope notes (Sprint/Olympic only, for now). */
  plan: { id: string; startDate: string; endDate: string; weeks: number } | null;
  race: { name: string; raceDate: string } | null;
  /** Empty when there's no active plan yet. Ordered `sequence` ascending (Base -> Build -> Peak -> Taper). */
  phases: TrainingPhaseRow[];
  /** This calendar week's (Mon-Sun) real workout rows -- rest-day synthesis for empty days is `buildTrainingViewModel.ts`'s job, not this fetch's. */
  weekWorkouts: WorkoutRow[];
}

/**
 * One round trip's worth of Training week data for one athlete. Mirrors
 * `features/home/services/fetchHomeDashboard.ts`'s shape and style
 * (framework-agnostic, follow-up queries only made once the plan/race
 * id is known) -- Training and Home read the same active plan, just
 * with a different workout window (this week only, not +14 days) and a
 * different extra (phases here, today/upcoming splits there).
 */
export async function fetchTrainingWeek(athleteId: string): Promise<TrainingWeekData> {
  const weekStart = mondayOnOrBefore(new Date());
  const weekStartIso = toIsoDate(weekStart);
  const weekEndIso = toIsoDate(addDays(weekStart, 6));

  const [planResult, workoutResult] = await Promise.all([
    supabase
      .from('training_plan')
      .select('*')
      .eq('athlete_id', athleteId)
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('workout')
      .select('*')
      .eq('athlete_id', athleteId)
      .gte('scheduled_date', weekStartIso)
      .lte('scheduled_date', weekEndIso)
      .order('scheduled_date', { ascending: true })
      .order('sequence_in_day', { ascending: true }),
  ]);

  if (planResult.error) throw planResult.error;
  if (workoutResult.error) throw workoutResult.error;

  const plan = planResult.data;

  let phases: TrainingPhaseRow[] = [];
  let race: TrainingWeekData['race'] = null;

  if (plan) {
    const phaseResult = await supabase
      .from('training_phase')
      .select('*')
      .eq('training_plan_id', plan.id)
      .order('sequence', { ascending: true });
    if (phaseResult.error) throw phaseResult.error;
    phases = phaseResult.data ?? [];

    if (plan.race_id) {
      const raceResult = await supabase
        .from('race')
        .select('name, race_date')
        .eq('id', plan.race_id)
        .maybeSingle();
      if (raceResult.error) throw raceResult.error;
      if (raceResult.data) {
        race = { name: raceResult.data.name, raceDate: raceResult.data.race_date };
      }
    }
  }

  return {
    plan: plan
      ? { id: plan.id, startDate: plan.start_date, endDate: plan.end_date, weeks: plan.weeks }
      : null,
    race,
    phases,
    weekWorkouts: workoutResult.data ?? [],
  };
}
