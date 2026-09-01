import { adaptAfterMissedWorkout } from '@/lib/adaptation/engine/adaptAfterMissedWorkout';
import { logAdaptationEvent } from '@/lib/adaptation/logAdaptationEvent';
import { supabase } from '@/lib/supabase/client';

import type { GeneralOverrideReason } from '../types/overrides';
import type { WorkoutRow } from './fetchTodayWorkout';

export interface ReportOverrideInput {
  athleteId: string;
  reason: GeneralOverrideReason;
  summary: string;
  /** Today's real workout row, if the athlete has one scheduled — undefined on a rest day. */
  todayWorkout?: WorkoutRow | null;
}

export interface ReportOverrideResult {
  error: unknown | null;
  /** Set when the adaptation engine trimmed a later workout this week in response — see `adaptAfterMissedWorkout.ts`. Lets the caller invalidate that specific workout's own queries. */
  adaptedWorkoutId?: string | null;
}

/** Reasons where today's session honestly isn't happening — worth marking `missed` rather than leaving it `planned` and silently stale. */
const REASONS_THAT_CANCEL_TODAY: readonly GeneralOverrideReason[] = [
  'illness',
  'travel',
  'poor_recovery',
];

/**
 * Handles the 4 general "what's going on" override reasons (see
 * `ReportOverrideScreen.tsx`'s doc comment for why "move this workout"
 * is a separate action, on Workout Detail). The honest v1 behavior for
 * the mechanical part of this — the one outcome that's unambiguous
 * without needing any judgment call — is: illness/travel/poor sleep
 * mean today's session isn't happening, so it's marked `missed` rather
 * than left `planned` (which would silently go stale, since nothing
 * else marks a past-due `planned` workout as anything). "Extra time"
 * has no such mechanical outcome — nothing here decides what to add to
 * today — so it only logs.
 *
 * On a real `missed` transition, also calls the adaptation engine
 * (`lib/adaptation/engine/adaptAfterMissedWorkout.ts`, added
 * 2026-09-01) — the one place in the app a workout becomes `missed`
 * today, so it's the one real place to react to that. The engine call
 * happens after the status update and report are both already
 * confirmed, and its own errors are swallowed internally (never
 * thrown here) — a failed or skipped adaptation should never make an
 * athlete's already-successful report look like it failed.
 */
export async function reportOverride({
  athleteId,
  reason,
  summary,
  todayWorkout,
}: ReportOverrideInput): Promise<ReportOverrideResult> {
  let beforeState: Record<string, string> | null = null;
  let afterState: Record<string, string> | null = null;
  let adaptedWorkoutId: string | null = null;

  if (
    REASONS_THAT_CANCEL_TODAY.includes(reason) &&
    todayWorkout &&
    todayWorkout.status === 'planned'
  ) {
    const { error: updateError } = await supabase
      .from('workout')
      .update({ status: 'missed' })
      .eq('id', todayWorkout.id);
    if (updateError) return { error: updateError };
    beforeState = { status: 'planned' };
    afterState = { status: 'missed' };

    const { adjustedWorkoutId } = await adaptAfterMissedWorkout({
      athleteId,
      scheduledDate: todayWorkout.scheduled_date,
    });
    adaptedWorkoutId = adjustedWorkoutId;
  }

  const { error } = await logAdaptationEvent({
    athleteId,
    triggerType: reason,
    summary,
    trainingPlanId: todayWorkout?.training_plan_id ?? null,
    workoutId: todayWorkout?.id ?? null,
    beforeState,
    afterState,
  });

  return { error, adaptedWorkoutId };
}
