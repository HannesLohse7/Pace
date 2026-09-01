import { supabase } from '@/lib/supabase/client';
import type { Tables } from '@/lib/supabase/types';

export type WorkoutRow = Tables<'workout'>;
export type WorkoutStepRow = Tables<'workout_step'>;
export type WorkoutTargetZoneRow = Tables<'workout_target_zone'>;

export interface WorkoutDetailData {
  workout: WorkoutRow;
  steps: WorkoutStepRow[];
  targetZones: WorkoutTargetZoneRow[];
}

/**
 * A single workout's full detail: the `workout` row itself, plus its
 * `workout_step` (warmup/mainset/cooldown text) and
 * `workout_target_zone` (HR/power target ranges) child rows. Both child
 * tables are real, RLS-protected parts of the schema (see
 * docs/DATABASE.md) -- nothing writes to them yet
 * (`lib/planGenerator/generatePlan.ts`'s v1 only inserts the `workout`
 * row itself; see its own doc comment on why: FTP/threshold data
 * onboarding doesn't collect). Querying them for real here, rather than
 * assuming they're always empty, means this screen is already correct
 * for whenever something *does* start writing them (a future
 * plan-generator version, or the adaptation engine) -- no second wiring
 * round needed. `buildWorkoutDetailViewModel.ts` is what turns an empty
 * result into the honest "not available yet" note.
 *
 * Returns null when no `workout` row matches `workoutId` (wrong id,
 * RLS-blocked, or deleted) -- the screen's own "not found" state, not
 * an error.
 */
export async function fetchWorkoutDetail(workoutId: string): Promise<WorkoutDetailData | null> {
  const workoutResult = await supabase
    .from('workout')
    .select('*')
    .eq('id', workoutId)
    .maybeSingle();
  if (workoutResult.error) throw workoutResult.error;
  if (!workoutResult.data) return null;

  const [stepsResult, zonesResult] = await Promise.all([
    supabase.from('workout_step').select('*').eq('workout_id', workoutId),
    supabase
      .from('workout_target_zone')
      .select('*')
      .eq('workout_id', workoutId)
      .order('sequence', { ascending: true }),
  ]);
  if (stepsResult.error) throw stepsResult.error;
  if (zonesResult.error) throw zonesResult.error;

  return {
    workout: workoutResult.data,
    steps: stepsResult.data ?? [],
    targetZones: zonesResult.data ?? [],
  };
}
