import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  TAPER_LOAD_GUARDRAIL_ERROR,
  violatesTaperLoadGuardrail,
} from '@/lib/adaptation/guardrails/checkTaperLoadGuardrail';
import { logAdaptationEvent } from '@/lib/adaptation/logAdaptationEvent';
import { supabase } from '@/lib/supabase/client';

import type { TrainingWeekData } from '../services/fetchTrainingWeek';

export interface ReorderWorkoutInput {
  /** The dragged (or explicitly "moved") workout: its real id, title (for the audit summary), plan, and the date it's moving away from. */
  moved: { id: string; title: string; trainingPlanId: string | null; originDate: string };
  /** The date `moved` is moving to. */
  targetDate: string;
  /** The real workout currently on `targetDate`, if any -- takes `moved`'s origin date in exchange. Undefined when the drop target is an empty (synthesized) rest day, in which case this is a plain move, not a swap. */
  displaced?: { id: string; title: string; trainingPlanId: string | null };
}

/**
 * Persists a workout reschedule as an atomic `scheduled_date` change --
 * either a two-workout swap (both real rows trade dates) or a
 * one-workout move (dropped onto an empty calendar day). Shared by two
 * entry points: Training's hand-built drag-reorder
 * (`features/training/screens/TrainingScreen.tsx`) and Workout Detail's
 * explicit "Move this workout" action -- both are the same underlying
 * operation, just triggered differently.
 *
 * Simpler than the mock week's cascading splice/shift
 * (`shared/store/useTrainingStore.ts`'s `reorderWeek`, still used by
 * Coach/Progress's own mocks): a real reorder only ever needs "this
 * workout's date <-> that workout's date," not a full list re-key,
 * since Training's 7 row positions are always exactly this week's
 * fixed Mon-Sun calendar days, not an array order to maintain.
 *
 * Optimistic: the caller sees the change immediately via the query
 * cache, and it rolls back automatically on failure (offline, an RLS
 * reject, a workout deleted mid-drag) rather than waiting on the round
 * trip.
 *
 * Also logs a real `adaptation_event` per affected workout (one for a
 * plain move, two for a swap) -- a real gap in the original drag-reorder
 * (added 2026-09-01, alongside `features/overrides`' "what's going on"
 * reports): every manual reschedule should be in the same audit trail
 * Workout Detail's future "why this changed" reads from, not just the
 * athlete-reported overrides. Logging happens after the reschedule
 * itself has already succeeded and isn't awaited-and-thrown -- a
 * logging failure shouldn't undo or block a reschedule the athlete
 * already saw happen.
 *
 * Checks `checkTaperLoadGuardrail.ts`'s v1 safety guardrail before
 * writing anything (added 2026-09-01, #15): during a Taper phase,
 * neither the target day nor (on a swap) the origin day is allowed to
 * end up with more planned duration than it already had. A blocked
 * reschedule throws `TAPER_LOAD_GUARDRAIL_ERROR` instead of writing --
 * the optimistic update rolls back the same way any other failure does
 * (`onError`, below), which for drag-reorder is already the existing
 * "snap back" UX for a rejected drop; `WorkoutDetailScreen.tsx`'s
 * explicit "Move this workout" checks for this specific error to show
 * an athlete-facing explanation instead of a generic one.
 */
export function useReorderWorkout(athleteId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['training-week', athleteId];

  return useMutation({
    mutationFn: async ({ moved, targetDate, displaced }: ReorderWorkoutInput) => {
      if (athleteId) {
        const ids = displaced ? [moved.id, displaced.id] : [moved.id];
        const { data: durationRows, error: durationError } = await supabase
          .from('workout')
          .select('id, planned_duration_min')
          .in('id', ids);
        if (durationError) throw durationError;

        const movedDuration =
          durationRows?.find((row) => row.id === moved.id)?.planned_duration_min ?? 0;
        const displacedDuration = displaced
          ? (durationRows?.find((row) => row.id === displaced.id)?.planned_duration_min ?? 0)
          : 0;

        const targetBlocked = await violatesTaperLoadGuardrail({
          athleteId,
          date: targetDate,
          beforeMin: displacedDuration,
          afterMin: movedDuration,
        });
        if (targetBlocked) throw new Error(TAPER_LOAD_GUARDRAIL_ERROR);

        if (displaced) {
          const originBlocked = await violatesTaperLoadGuardrail({
            athleteId,
            date: moved.originDate,
            beforeMin: movedDuration,
            afterMin: displacedDuration,
          });
          if (originBlocked) throw new Error(TAPER_LOAD_GUARDRAIL_ERROR);
        }
      }

      const updates = [
        supabase.from('workout').update({ scheduled_date: targetDate }).eq('id', moved.id),
      ];
      if (displaced) {
        updates.push(
          supabase
            .from('workout')
            .update({ scheduled_date: moved.originDate })
            .eq('id', displaced.id),
        );
      }
      const results = await Promise.all(updates);
      for (const result of results) {
        if (result.error) throw result.error;
      }

      if (athleteId) {
        const summary = displaced
          ? `Swapped "${moved.title}" and "${displaced.title}"'s scheduled dates.`
          : `Moved "${moved.title}" to a new date.`;
        const events = [
          logAdaptationEvent({
            athleteId,
            triggerType: 'manual_move',
            summary,
            trainingPlanId: moved.trainingPlanId,
            workoutId: moved.id,
            beforeState: { scheduled_date: moved.originDate },
            afterState: { scheduled_date: targetDate },
          }),
        ];
        if (displaced) {
          events.push(
            logAdaptationEvent({
              athleteId,
              triggerType: 'manual_move',
              summary,
              trainingPlanId: displaced.trainingPlanId,
              workoutId: displaced.id,
              beforeState: { scheduled_date: targetDate },
              afterState: { scheduled_date: moved.originDate },
            }),
          );
        }
        await Promise.all(events);
      }
    },
    onMutate: async ({ moved, targetDate, displaced }: ReorderWorkoutInput) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TrainingWeekData>(queryKey);
      if (previous) {
        queryClient.setQueryData<TrainingWeekData>(queryKey, {
          ...previous,
          weekWorkouts: previous.weekWorkouts.map((workout) => {
            if (workout.id === moved.id) return { ...workout, scheduled_date: targetDate };
            if (displaced && workout.id === displaced.id) {
              return { ...workout, scheduled_date: moved.originDate };
            }
            return workout;
          }),
        });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
