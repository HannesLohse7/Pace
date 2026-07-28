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
 * The fixed calendar-day labels for each of the 7 row positions, taken
 * from the original mock order. This list is always exactly "this
 * week, Mon through Sun, top to bottom" — position 0 is always Monday's
 * date, position 6 always Sunday's, regardless of which workout is
 * currently assigned to that day. Reordering moves *which workout* sits
 * at a position; it never moves the calendar day the position itself
 * represents.
 */
const DAY_SLOTS = weekWorkouts.map((workout) => ({
  short: workout.short,
  dateNum: workout.dateNum,
}));

/**
 * Wraps `mockTrainingData.ts`'s static week array in a Zustand store —
 * same reasoning as `useProfileStore`: a plain exported const can't
 * trigger a re-render when drag-reorder changes it. Unpersisted, same as
 * every other store here — resets to the mock default on restart.
 *
 * `reorderWeek` is a genuine array reorder — `id` travels with the
 * dragged workout. This store no longer depends on any drag-gesture
 * library at all: Training's row list (see `TrainingScreen.tsx` /
 * `TrainingWorkoutRow.tsx`) is a hand-built absolute-positioned list on
 * react-native-gesture-handler + react-native-reanimated directly, not
 * react-native-draggable-flatlist. Three straight rounds of on-device
 * bugs (stale layout-cache overlap, then a position-pinned swap that
 * contradicted the library's own reorder contract, then snapping/
 * jumping) all traced back to that library's internal position-
 * tracking cache going stale relative to reality. The replacement
 * model has no such cache: every row's position is `index * ROW_HEIGHT`,
 * computed fresh from the current array on every render, never stored
 * or inferred separately from it — this store is the only source of
 * truth for order, and there's nothing else to fall out of sync with it.
 *
 * `short`/`dateNum` still don't travel with `id`, for the same reason
 * as before: this list is always exactly "this week, Mon through Sun,
 * top to bottom," so the calendar-day label belongs to the *position*,
 * not the dragged workout — recomputed from `DAY_SLOTS` after every
 * reorder, keyed purely by final array position.
 */
export interface TrainingState {
  weekWorkouts: PlannedWorkout[];
}

export interface TrainingActions {
  /**
   * Commits a drag-reorder as a genuine splice/move: the workout at
   * `from` is removed and reinserted at `to`, shifting everything
   * strictly between them by one slot — real list-reorder semantics,
   * not a two-position swap.
   *
   * Rejected (silently, no state change) when: `from === to`, the
   * dragged workout isn't swappable, or committing this move would
   * change the position of any non-swappable workout — every index
   * strictly between `from` and `to` shifts by one slot as part of a
   * real reorder, and completed/missed/rest days must never move, not
   * just never be the exact drop target. Since `weekWorkouts` doesn't
   * change in the rejected case, the dragged row's own gesture-driven
   * offset resets to 0 and it visually settles back at its unchanged
   * position — a snap-back, not a broken/stuck row.
   */
  reorderWeek: (from: number, to: number) => void;
}

export type TrainingStore = TrainingState & TrainingActions;

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  weekWorkouts,
  reorderWeek: (from, to) => {
    if (from === to) return;

    const current = get().weekWorkouts;
    const dragged = current[from];
    if (!dragged || !isSwappable(dragged)) return;

    const start = Math.min(from, to);
    const end = Math.max(from, to);
    for (let i = start; i <= end; i++) {
      if (i === from) continue;
      const displaced = current[i];
      if (!displaced || !isSwappable(displaced)) return;
    }

    const moved = current.slice();
    const [item] = moved.splice(from, 1);
    moved.splice(to, 0, item!);

    const relabeled = moved.map((workout, index) => ({
      ...workout,
      short: DAY_SLOTS[index]!.short,
      dateNum: DAY_SLOTS[index]!.dateNum,
    }));

    set({ weekWorkouts: relabeled });
  },
}));
