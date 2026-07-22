import { create } from 'zustand';

import { weekWorkouts } from '@/features/training/data/mockTrainingData';
import type { PlannedWorkout } from '@/features/training/types/training';

/**
 * Wraps `mockTrainingData.ts`'s static week array in a Zustand store —
 * same reasoning as `useProfileStore`: a plain exported const can't
 * trigger a re-render when drag-reorder changes it, so TrainingScreen
 * needs a reactive source of truth for the reordered list to actually
 * stick after the drag ends instead of snapping back. Unpersisted, same
 * as every other store here — resets to the mock default on restart.
 *
 * Reordering only ever changes array position, never a workout's own
 * fields (id/short/dateNum/etc. travel with it) — matches the source's
 * own `planOrder`/`handleDrop`, which reorders which day-ids appear
 * where without renumbering any workout's date. `todayId` comparisons
 * in TrainingScreen keep working correctly after a reorder because
 * they match on id, not position.
 */
export interface TrainingState {
  weekWorkouts: PlannedWorkout[];
}

export interface TrainingActions {
  reorderWeek: (newOrder: PlannedWorkout[]) => void;
}

export type TrainingStore = TrainingState & TrainingActions;

export const useTrainingStore = create<TrainingStore>((set) => ({
  weekWorkouts,
  reorderWeek: (newOrder) => set({ weekWorkouts: newOrder }),
}));
