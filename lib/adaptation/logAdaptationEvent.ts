import { supabase } from '@/lib/supabase/client';

/** Matches the `adaptation_event.trigger_type` CHECK constraint — see docs/DATABASE.md. */
export type AdaptationTriggerType =
  | 'missed_workout'
  | 'calendar_conflict'
  | 'extra_time'
  | 'poor_recovery'
  | 'illness'
  | 'travel'
  | 'race_date_change'
  | 'manual_move'
  | 'other';

export interface LogAdaptationEventInput {
  athleteId: string;
  triggerType: AdaptationTriggerType;
  /** Short, athlete-facing description of what happened. */
  summary: string;
  trainingPlanId?: string | null;
  workoutId?: string | null;
  reasoning?: string | null;
  /**
   * String-valued snapshots only (e.g. `{ scheduled_date: '2026-07-16' }`,
   * `{ status: 'missed' }`) — every real caller's before/after state is
   * this simple, and keeping it string-only means it's assignable to the
   * generated `Json` column type directly, no unsafe cast needed.
   */
  beforeState?: Record<string, string> | null;
  afterState?: Record<string, string> | null;
  /**
   * Set only by the adaptation engine itself
   * (`lib/adaptation/engine/`), never by a manual/athlete-initiated
   * caller — the honest signal for "which rule set actually made this
   * decision," per `adaptation_event`'s own schema comment. Every
   * manual caller (reschedules, "what's going on" reports) omits this,
   * which defaults to `null`.
   */
  engineVersionId?: string | null;
}

/**
 * Inserts one `adaptation_event` row — the audit trail Workout Detail's
 * HISTORY section reads back per workout (see docs/DATABASE.md and
 * `features/training/services/fetchWorkoutHistory.ts`). Shared by every
 * caller that changes a workout or plan for a real, attributable reason:
 * `features/overrides/services/reportOverride.ts` (the "what's going on"
 * report), `features/training/hooks/useReorderWorkout.ts` (drag-reorder
 * and Workout Detail's "Move this workout," both manual date changes),
 * and now `lib/adaptation/engine/` (the v1 rule-based engine's own
 * adjustments, the first caller to actually set `engineVersionId`).
 *
 * `engine_version_id` defaults to `null` — the honest value for every
 * manual, athlete-initiated caller, since there's no engine version that
 * made *that* decision (see `adaptation_event`'s own schema comment).
 *
 * Returns `{ error }` rather than throwing: logging the audit trail
 * matters, but a logging failure shouldn't be able to undo or block an
 * action (a reschedule, a status change) that already succeeded.
 * Callers that need the write to be visible to the athlete (the "what's
 * going on" report, where logging *is* the action) check the returned
 * error; callers logging a side effect of something else already
 * confirmed (drag-reorder, the engine's own adjustment) can await and
 * ignore it.
 */
export async function logAdaptationEvent(
  input: LogAdaptationEventInput,
): Promise<{ error: unknown | null }> {
  const { error } = await supabase.from('adaptation_event').insert({
    athlete_id: input.athleteId,
    trigger_type: input.triggerType,
    summary: input.summary,
    training_plan_id: input.trainingPlanId ?? null,
    workout_id: input.workoutId ?? null,
    engine_version_id: input.engineVersionId ?? null,
    reasoning: input.reasoning ?? null,
    before_state: input.beforeState ?? null,
    after_state: input.afterState ?? null,
  });
  return { error };
}
