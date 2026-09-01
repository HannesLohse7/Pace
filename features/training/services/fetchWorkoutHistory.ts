import { supabase } from '@/lib/supabase/client';
import type { Tables } from '@/lib/supabase/types';

export type WorkoutHistoryEvent = Pick<
  Tables<'adaptation_event'>,
  'id' | 'summary' | 'reasoning' | 'created_at'
>;

/**
 * Real adaptation-event history for one workout -- the read side of the
 * audit trail `lib/adaptation/logAdaptationEvent.ts` writes to (manual
 * reschedules via `useReorderWorkout`, "what's going on today" reports
 * via `features/overrides`, and the v1 adaptation engine via
 * `lib/adaptation/engine/`). Scoped to `workout_id` so a workout's
 * detail screen only ever shows events that actually touched *it*, not
 * every event on the athlete's plan.
 *
 * `summary` is already the athlete-facing sentence every writer crafts
 * (e.g. "Reported feeling sick.", 'Moved "Tempo Run" to a new date.'),
 * so there's nothing to derive from `trigger_type` for display.
 * `reasoning` is selected too (added 2026-09-01) -- the engine is the
 * first writer to ever set it to something real (a longer explanation
 * of why it made its own adjustment); manual callers still leave it
 * `null`, so `WorkoutDetailScreen.tsx` only renders it when present.
 *
 * Table RLS is insert+select only (see docs/DATABASE.md) -- rows are
 * never edited or removed once written, so this is a plain ordered read,
 * newest first.
 */
export async function fetchWorkoutHistory(workoutId: string): Promise<WorkoutHistoryEvent[]> {
  const { data, error } = await supabase
    .from('adaptation_event')
    .select('id, summary, reasoning, created_at')
    .eq('workout_id', workoutId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
