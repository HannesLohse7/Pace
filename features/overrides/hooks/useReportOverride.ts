import { useMutation, useQueryClient } from '@tanstack/react-query';

import { reportOverride } from '../services/reportOverride';

/**
 * Wraps `reportOverride` as a mutation. Not optimistic (unlike
 * `useReorderWorkout`) — this can flip a real workout to `missed`, and
 * that's not a change worth showing before the write is confirmed, the
 * way a drag-reorder's immediate visual feedback is. On success,
 * invalidates every query this could have touched: today's workout
 * (this hook's own read), Home's dashboard, and Training's week — all
 * of which show today's workout status. When the adaptation engine
 * also trimmed a later workout this week (`result.adaptedWorkoutId`,
 * added 2026-09-01), its own detail/history queries are invalidated
 * too, so navigating there shows the change without a stale cache.
 */
export function useReportOverride(athleteId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reportOverride,
    onSuccess: (result) => {
      if (result.error) return;
      void queryClient.invalidateQueries({ queryKey: ['today-workout', athleteId] });
      void queryClient.invalidateQueries({ queryKey: ['home-dashboard', athleteId] });
      void queryClient.invalidateQueries({ queryKey: ['training-week', athleteId] });
      if (result.adaptedWorkoutId) {
        void queryClient.invalidateQueries({
          queryKey: ['workout-detail', result.adaptedWorkoutId],
        });
        void queryClient.invalidateQueries({
          queryKey: ['workout-history', result.adaptedWorkoutId],
        });
      }
    },
  });
}
