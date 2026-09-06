import { supabase } from '@/lib/supabase/client';

export interface LogWorkoutCompletionInput {
  workoutId: string;
  athleteId: string;
  /** 1-10, Foster's session-RPE scale — matches `workout_completion.perceived_effort`'s own CHECK constraint. */
  perceivedEffort: number;
  actualDurationMin: number;
}

/**
 * Logs a completed workout: inserts the `workout_completion` row (see
 * docs/DATABASE.md's training-load section for why this table already
 * existed, untracked, before this feature) and marks the parent
 * `workout.status = 'completed'`. This is the first and only place in
 * the app that ever sets `status = 'completed'` — see
 * `workoutMapping.ts`'s own doc comment on why every workout was
 * effectively stuck at `'past'`/`'upcoming'` before this.
 *
 * Two separate statements, not a transaction (the Supabase JS client
 * doesn't expose one) — ordered so a half failure leaves the safer
 * state: the completion row is inserted first, so a failed status
 * update just means `workoutMapping.ts` still shows this workout as
 * `'past'` (untracked) rather than a phantom `workout_completion` row
 * for a workout that still reads as `'upcoming'`. `workout_id` has a
 * unique constraint (`workout_completion_unique_workout`, added
 * alongside this feature), so a duplicate log attempt fails the insert
 * rather than creating a second row — the UI itself already prevents
 * this by only offering "Mark complete" while `status` isn't
 * `'completed'`, so this is a backstop, not the primary guard.
 *
 * `actual_tss` is stored as Foster's session-RPE score
 * (`actual_duration_min * perceived_effort`) — the same value
 * `computeTrainingLoad` derives from these two columns, kept redundant
 * here so any future direct SQL or reporting against
 * `workout_completion` doesn't have to know the formula. `source` is
 * left at its schema default (`'manual'`) — this flow is always
 * athlete-entered; `'wearable_import'` is reserved for a future sync
 * path this app doesn't have yet.
 */
export async function logWorkoutCompletion({
  workoutId,
  athleteId,
  perceivedEffort,
  actualDurationMin,
}: LogWorkoutCompletionInput): Promise<{ error: unknown | null }> {
  const { error: insertError } = await supabase.from('workout_completion').insert({
    workout_id: workoutId,
    athlete_id: athleteId,
    perceived_effort: perceivedEffort,
    actual_duration_min: actualDurationMin,
    actual_tss: actualDurationMin * perceivedEffort,
  });
  if (insertError) return { error: insertError };

  const { error: statusError } = await supabase
    .from('workout')
    .update({ status: 'completed' })
    .eq('id', workoutId);
  return { error: statusError };
}
