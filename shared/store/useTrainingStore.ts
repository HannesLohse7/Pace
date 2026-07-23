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
 * Dragging is a *reschedule*, not a reorder. Each array position is a
 * fixed calendar day, permanently — `id`/`short`/`dateNum` are pinned to
 * the *position* and never change, only which workout's *content*
 * (title/discipline/duration/status/etc.) is currently assigned to that
 * day. `swapWorkouts` swaps content between the two affected positions
 * and leaves each position's own id/short/dateNum untouched.
 *
 * This was NOT the first implementation: an earlier version swapped
 * `id`/`short`/`dateNum` onto the new position instead (moving the
 * label to follow the dragged workout). That produces an identical
 * visual result — swapping labels-at-fixed-content is mathematically
 * equivalent to swapping content-at-fixed-labels — but broke on-device
 * after a few repeated drags: tiles went missing or overlapped.
 * Root cause: `id` is also what TrainingScreen's `keyExtractor` hands to
 * react-native-draggable-flatlist, which caches per-key index and
 * layout measurements (`keyToIndexRef`/`cellDataRef` internally) across
 * renders to drive its drag animation. Reassigning `id` to a different
 * row on every successful drop repeatedly invalidated that cache's
 * assumption that a given key stays anchored to roughly the same row,
 * corrupting its layout state after enough drags. Pinning id/short/
 * dateNum to the array position — and moving content instead — keeps
 * every key permanently stable, which is what the library requires.
 *
 * `todayId` comparisons in TrainingScreen and the `weekWorkouts.find(w
 * => w.id === id)` detail-screen lookup both keep working unchanged:
 * "today" is a fixed calendar day (a fixed position), so nothing needs
 * to track it across a reschedule — the highlighted row always shows
 * whatever's now scheduled for today, which is exactly the desired
 * behavior.
 */
export interface TrainingState {
  weekWorkouts: PlannedWorkout[];
}

export interface TrainingActions {
  /**
   * Swaps the workout *content* between `fromIndex` and `toIndex`,
   * leaving each position's own id/short/dateNum untouched (see the
   * store doc comment above for why those must never move). A no-op —
   * the drop is rejected rather than silently accepted — when either
   * index is out of range, the indices are equal, or either workout
   * isn't swappable (completed, missed, or a rest day). Since
   * `weekWorkouts` doesn't change in the rejected case, DraggableFlatList's
   * own optimistic drag animation reconciles back to the last real state
   * on the next render — a visual snap-back, not a broken/stuck list.
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
        return { ...target, id: dragged.id, short: dragged.short, dateNum: dragged.dateNum };
      }
      if (index === toIndex) {
        return { ...dragged, id: target.id, short: target.short, dateNum: target.dateNum };
      }
      return workout;
    });

    set({ weekWorkouts: updated });
  },
}));
