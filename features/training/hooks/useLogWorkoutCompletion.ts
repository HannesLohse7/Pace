import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logWorkoutCompletion } from '../services/logWorkoutCompletion';
import type { LogWorkoutCompletionInput } from '../services/logWorkoutCompletion';

/**
 * On success, invalidates every query a logged completion can change the
 * answer to: this workout's own detail (status badge), the current
 * training week (row status dot), and Progress (consistency, plus the
 * new fitness trend — see `fetchProgress.ts`). Not optimistic — unlike
 * `useReorderWorkout`, there's no single obviously-correct optimistic
 * shape across all three caches at once, and logging a completion is a
 * deliberate, infrequent athlete action rather than a drag gesture, so
 * the extra round-trip latency is an acceptable tradeoff for staying
 * simple.
 */
export function useLogWorkoutCompletion(athleteId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogWorkoutCompletionInput) => {
      const { error } = await logWorkoutCompletion(input);
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: ['workout-detail', input.workoutId] });
      void queryClient.invalidateQueries({ queryKey: ['training-week', athleteId] });
      void queryClient.invalidateQueries({ queryKey: ['progress', athleteId] });
    },
  });
}
