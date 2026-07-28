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
 * dragged workout, matching react-native-draggable-flatlist's own
 * contract (its internal drag-gesture position tracking, keyed by
 * `id` via `keyExtractor`, expects the array itself to reorder and the
 * key to move with the item it animated). This was NOT the first
 * implementation: an earlier version pinned `id`/`short`/`dateNum` to
 * the array *position* and swapped only content, so the array order
 * never actually changed on a drop — that directly contradicted what
 * the library had just animated, and produced exactly the on-device
 * symptom reported: workouts snapping to the wrong position on drop and
 * jumping to a different spot when starting a new drag.
 *
 * Reverting to true reordering brings back the *original* problem this
 * feature started with, though: if `short`/`dateNum` simply travel with
 * the dragged object like `id` does, the visible date label stops
 * matching the row's real calendar day (a workout dragged from
 * Wednesday to Saturday's position would still say "WED" while sitting
 * in Saturday's slot). Since this list is always exactly the current
 * week's 7 fixed days in order, `short`/`dateNum` aren't part of what
 * "belongs" to a dragged workout the way `id`/title/discipline/etc. are
 * — they're recomputed from `DAY_SLOTS` after every reorder, keyed
 * purely by final array position. `id` is the only field that travels;
 * everything else either travels with it (real workout content) or is
 * reassigned from position (the calendar-day labels).
 */
export interface TrainingState {
  weekWorkouts: PlannedWorkout[];
}

export interface TrainingActions {
  /**
   * Commits a drag-reorder. `data` is react-native-draggable-flatlist's
   * own already-reordered array from `onDragEnd` (real moved positions,
   * `id` traveling with each item) — `from`/`to` are the same callback's
   * pre-drag indices, used only for validation against the *previous*
   * `weekWorkouts` state.
   *
   * Rejected (silently, no state change) when: the dragged workout
   * (`from` in the previous state) isn't swappable, or committing this
   * move would change the position of any non-swappable workout — every
   * index strictly between `from` and `to` shifts by one slot as part
   * of a real reorder, and completed/missed/rest days must never move,
   * not just never be the exact drop target. Since `weekWorkouts`
   * doesn't change in the rejected case, DraggableFlatList's own
   * optimistic drag animation reconciles back to the last real state on
   * the next render — a visual snap-back, not a broken/stuck list.
   */
  reorderWeek: (data: PlannedWorkout[], from: number, to: number) => void;
}

export type TrainingStore = TrainingState & TrainingActions;

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  weekWorkouts,
  reorderWeek: (data, from, to) => {
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

    const relabeled = data.map((workout, index) => ({
      ...workout,
      short: DAY_SLOTS[index]!.short,
      dateNum: DAY_SLOTS[index]!.dateNum,
    }));

    set({ weekWorkouts: relabeled });
  },
}));
