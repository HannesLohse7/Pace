import { create } from 'zustand';

import { weekWorkouts } from '@/features/training/data/mockTrainingData';
import type { PlannedWorkout } from '@/features/training/types/training';

/**
 * Only upcoming, non-rest workouts can be dragged, and — per the same
 * restriction — only upcoming, non-rest workouts can be valid drop
 * targets. Completed/missed workouts already happened (or didn't), so
 * rescheduling them isn't meaningful in either direction, and a rest day
 * isn't a session with a date worth taking over.
 */
export function isSwappable(workout: PlannedWorkout): boolean {
  return workout.status === 'upcoming' && workout.discipline !== 'rest';
}

/**
 * Wraps `mockTrainingData.ts`'s static week array in a Zustand store —
 * same reasoning as `useProfileStore`: a plain exported const can't
 * trigger a re-render when drag-reorder changes it. Unpersisted, same as
 * every other store here — resets to the mock default on restart.
 *
 * Dragging is a *reschedule*, not a reorder: found on-device (not this
 * store's original design) that swapping only array position left each
 * workout's own date/dateNum/short fields pointing at its old day, so a
 * dragged Wednesday workout kept displaying "WED" even after landing in
 * Thursday's slot. `swapWorkouts` fixes this by swapping only the
 * date-identity fields between the two affected slots — each workout's
 * actual content (title/duration/description/etc.) stays with the
 * object it belongs to, but the *labels* move to match where the user
 * actually dropped it. `todayId` comparisons in TrainingScreen keep
 * matching the correct row after a swap because `id` is one of the
 * fields that moves with the reschedule.
 */
export interface TrainingState {
  weekWorkouts: PlannedWorkout[];
}

export interface TrainingActions {
  /**
   * Swaps the date-identity (id/short/dateNum) of the workouts at
   * `fromIndex` and `toIndex`. A no-op — the drop is rejected rather
   * than silently accepted — when either index is out of range, the
   * indices are equal, or either workout isn't swappable (completed,
   * missed, or a rest day). Since `weekWorkouts` doesn't change in the
   * rejected case, DraggableFlatList's own optimistic drag animation
   * reconciles back to the last real state on the next render — a
   * visual snap-back, not a broken/stuck list.
   */
  swapWorkouts: (fromIndex: number, toIndex: number) => void;
}

export type TrainingStore = TrainingState & TrainingActions;

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  weekWorkouts,
  swapWorkouts: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    const current = get().weekWorkouts;
    const dragged = current[fromIndex];
    const target = current[toIndex];
    if (!dragged || !target) return;
    if (!isSwappable(dragged) || !isSwappable(target)) return;

    const updated = current.map((workout, index) => {
      if (index === fromIndex) {
        return { ...workout, id: target.id, short: target.short, dateNum: target.dateNum };
      }
      if (index === toIndex) {
        return { ...workout, id: dragged.id, short: dragged.short, dateNum: dragged.dateNum };
      }
      return workout;
    });

    set({ weekWorkouts: updated });
  },
}));
